import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Computer-vision roof analyzer.
 * Takes lat/lng, fetches a Google Static Maps satellite image, and asks
 * Gemini 2.5 Flash (vision) to estimate:
 *   - usable_area_ratio (0..1) after removing obstacles & shaded zones
 *   - obstacles_count
 *   - shading_level: low | medium | high
 *   - confidence: low | medium | high
 *
 * Always returns 200 with sensible defaults if vision fails (matches the
 * project's "graceful degrade" rule for external APIs).
 */

const DEFAULTS = {
  usable_area_ratio: 0.65,
  obstacles_count: 0,
  shading_level: "medium" as const,
  confidence: "low" as const,
  source: "default" as const,
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function buildSatelliteUrl(lat: number, lng: number, apiKey: string): string {
  // 640x640 max for free tier; zoom 20 = max satellite detail
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&key=${apiKey}`;
}

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
  } catch (e) {
    console.error("imageToBase64 error:", e);
    return null;
  }
}

async function analyzeWithGemini(base64: string): Promise<typeof DEFAULTS | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const prompt = `You are analyzing a satellite image of a rooftop in Egypt for solar panel installation.
Estimate from the image:
1. usable_area_ratio: fraction (0.0–1.0) of the visible roof area that is actually usable for solar panels (subtract water tanks, A/C units, satellite dishes, stairwells, parapet shadows, neighboring building shadows).
2. obstacles_count: integer count of distinct rooftop obstacles you can see.
3. shading_level: "low" | "medium" | "high" based on shadows from neighbors/structures.
4. confidence: "low" | "medium" | "high" based on image clarity.

Return ONLY valid JSON, no markdown, no explanation:
{"usable_area_ratio": 0.0, "obstacles_count": 0, "shading_level": "low", "confidence": "low"}`;

  try {
    const res = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:image/png;base64,${base64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
      20000
    );

    if (!res.ok) {
      console.error("Gemini vision status:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = txt.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const ratio = Math.max(0.2, Math.min(0.95, Number(parsed.usable_area_ratio) || DEFAULTS.usable_area_ratio));
    const count = Math.max(0, Math.min(50, parseInt(parsed.obstacles_count) || 0));
    const shading = ["low", "medium", "high"].includes(parsed.shading_level) ? parsed.shading_level : "medium";
    const confidence = ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low";

    return {
      usable_area_ratio: ratio,
      obstacles_count: count,
      shading_level: shading,
      confidence,
      source: "gemini_vision" as any,
    };
  } catch (e) {
    console.error("Gemini vision error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates", ...DEFAULTS }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: true, ...DEFAULTS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imgUrl = buildSatelliteUrl(latitude, longitude, apiKey);
    const base64 = await imageToBase64(imgUrl);
    if (!base64) {
      return new Response(JSON.stringify({ success: true, ...DEFAULTS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = await analyzeWithGemini(base64);
    const result = analysis ?? DEFAULTS;

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roof-vision error:", e);
    return new Response(JSON.stringify({ success: true, ...DEFAULTS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
