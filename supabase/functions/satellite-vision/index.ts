// Satellite Vision Analyzer — uses Gemini 2.5 Pro multimodal via Lovable AI Gateway
// Analyzes a satellite image of the user's drawn rooftop polygon to detect obstacles,
// estimate usable area, shading and orientation.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// 24h in-memory cache (keyed by lat,lng + polygon hash)
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface PolygonPoint { lat: number; lng: number; }

function cacheKey(lat: number, lng: number, points: PolygonPoint[]): string {
  const poly = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  return `${lat.toFixed(5)},${lng.toFixed(5)}::${poly}`;
}

function buildStaticMapUrl(lat: number, lng: number, points: PolygonPoint[]): string {
  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "20",
    size: "640x640",
    scale: "2",
    maptype: "satellite",
    key: GOOGLE_MAPS_API_KEY!,
  });
  // Draw polygon overlay so the AI knows which area the user marked
  if (points.length >= 3) {
    const path = points.map((p) => `${p.lat},${p.lng}`).join("|");
    const closing = `${points[0].lat},${points[0].lng}`;
    params.append("path", `color:0xFF0000FF|weight:3|fillcolor:0xFF000033|${path}|${closing}`);
  }
  return `${base}?${params.toString()}`;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Static Maps fetch failed: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  // base64 encode
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

async function analyzeWithGemini(imageBase64: string, language: string) {
  const systemPrompt = language === "ar"
    ? "أنت مهندس طاقة شمسية متخصص في تحليل صور الأقمار الصناعية للأسطح. حلل المنطقة المحددة بالأحمر بدقة هندسية."
    : "You are a solar engineer specialized in analyzing satellite images of rooftops. Analyze the area outlined in red with engineering precision.";

  const userPrompt = "Analyze the rooftop area marked in red. Identify obstacles (water tanks, satellite dishes, AC units, stairs rooms, chimneys), estimate the percentage of the marked area actually usable for solar panels, assess shading from neighboring buildings, and detect roof orientation. Be conservative.";

  const body = {
    model: "google/gemini-2.5-pro",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } },
        ],
      },
    ],
    tools: [{
      type: "function",
      function: {
        name: "report_rooftop_analysis",
        description: "Return structured rooftop analysis from satellite image.",
        parameters: {
          type: "object",
          properties: {
            usableAreaRatio: { type: "number", description: "0.0-1.0, fraction of marked area usable for panels after subtracting obstacles" },
            obstacles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["water_tank", "satellite_dish", "ac_unit", "stairs_room", "chimney", "skylight", "vent", "other"] },
                  description: { type: "string" },
                },
                required: ["type", "description"],
              },
            },
            shadingLevel: { type: "string", enum: ["low", "medium", "high"] },
            orientation: { type: "string", enum: ["north", "south", "east", "west", "mixed", "flat"] },
            warnings: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string", description: "1-2 sentence summary in the requested language" },
          },
          required: ["usableAreaRatio", "obstacles", "shadingLevel", "orientation", "warnings", "confidence", "summary"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "report_rooftop_analysis" } },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("No tool call in AI response");
  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { lat, lng, polygonPoints, language = "en" } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "lat and lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(polygonPoints) || polygonPoints.length < 3) {
      return new Response(JSON.stringify({ error: "polygonPoints (>=3) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = cacheKey(lat, lng, polygonPoints);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = buildStaticMapUrl(lat, lng, polygonPoints);
    const imageB64 = await fetchImageAsBase64(url);
    const analysis = await analyzeWithGemini(imageB64, language);

    // Sanitize ratio
    const ratio = Math.max(0, Math.min(1, Number(analysis.usableAreaRatio) || 0.85));
    const result = {
      usableAreaRatio: ratio,
      obstacles: analysis.obstacles ?? [],
      shadingLevel: analysis.shadingLevel ?? "low",
      orientation: analysis.orientation ?? "flat",
      warnings: analysis.warnings ?? [],
      confidence: analysis.confidence ?? "medium",
      summary: analysis.summary ?? "",
      analyzedAt: new Date().toISOString(),
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("satellite-vision error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
