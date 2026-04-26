import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { value: any; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const lang: "ar" | "en" = body.language === "ar" ? "ar" : "en";

    if (!isFinite(lat) || !isFinite(lng)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}_${lang}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify({ success: true, cached: true, ...cached.value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=1&languageCode=${lang}`;
    const res = await fetch(url);

    if (!res.ok) {
      const txt = await res.text();
      console.error("Pollen API error:", res.status, txt);
      const fallback = {
        available: false,
        pollenIndex: 0,
        topAllergens: [],
      };
      return new Response(JSON.stringify({ success: true, ...fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const today = data?.dailyInfo?.[0] ?? {};
    const types: any[] = today.pollenTypeInfo ?? [];
    const plants: any[] = today.plantInfo ?? [];

    const maxIndex = types.reduce((m, t) => Math.max(m, t?.indexInfo?.value ?? 0), 0);
    const topAllergens = plants
      .filter((p) => (p?.indexInfo?.value ?? 0) > 0)
      .sort((a, b) => (b.indexInfo?.value ?? 0) - (a.indexInfo?.value ?? 0))
      .slice(0, 3)
      .map((p) => ({
        code: p.code,
        name: p.displayName,
        index: p.indexInfo?.value ?? 0,
        category: p.indexInfo?.category ?? null,
      }));

    const value = {
      available: true,
      pollenIndex: maxIndex,
      topAllergens,
      types: types.map((t) => ({
        code: t.code,
        name: t.displayName,
        index: t.indexInfo?.value ?? 0,
        category: t.indexInfo?.category ?? null,
      })),
    };
    cache.set(key, { value, expires: Date.now() + TTL });

    return new Response(JSON.stringify({ success: true, ...value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-pollen error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
