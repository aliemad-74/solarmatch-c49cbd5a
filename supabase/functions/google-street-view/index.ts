import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache (24h)
const cache = new Map<string, { value: any; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

function cacheKey(lat: number, lng: number, size: string, heading?: number) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${size}_${heading ?? "auto"}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const size = String(body.size ?? "600x300");
    const heading = body.heading != null ? Number(body.heading) : undefined;
    const fov = Number(body.fov ?? 90);

    if (!isFinite(lat) || !isFinite(lng)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = cacheKey(lat, lng, size, heading);
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify({ success: true, cached: true, ...cached.value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: metadata check (free) — confirms imagery exists
    const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const metaRes = await fetch(metaUrl);
    const meta = await metaRes.json();

    if (meta.status !== "OK") {
      const value = { available: false, status: meta.status, imageUrl: null };
      cache.set(key, { value, expires: Date.now() + TTL });
      return new Response(JSON.stringify({ success: true, ...value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: build signed image URL (key embedded; this is a public static image endpoint)
    const params = new URLSearchParams({
      size,
      location: `${lat},${lng}`,
      fov: String(fov),
      key: apiKey,
    });
    if (heading != null && isFinite(heading)) params.set("heading", String(heading));

    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;

    const value = {
      available: true,
      imageUrl,
      copyright: meta.copyright ?? null,
      date: meta.date ?? null,
      panoId: meta.pano_id ?? null,
      location: meta.location ?? null,
    };
    cache.set(key, { value, expires: Date.now() + TTL });

    return new Response(JSON.stringify({ success: true, ...value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-street-view error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
