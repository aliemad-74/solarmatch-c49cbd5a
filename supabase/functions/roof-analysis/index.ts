// Backend-only rooftop analysis. Frontend sends polygon + center; backend
// fetches a high-res satellite image from Google Static Maps and asks the
// Lovable AI Gateway (Gemini vision) to detect the actual roof footprint,
// usable area, and obstacles. Returns structured JSON only — no UI side effects.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LatLng { lat: number; lng: number }
interface AnalyzeBody {
  polygon: LatLng[];          // user-drawn polygon (>=3 points)
  center: LatLng;             // centroid or any point inside
  selectedArea: number;       // m² computed on client (turf)
  zoom?: number;              // optional override
}

interface RoofAnalysis {
  selectedArea: number;
  detectedRoofArea: number;
  usableArea: number;
  unusablePercentage: number;
  obstacles: string[];
  confidenceScore: number;    // 0..1
  notes?: string;
  cached?: boolean;
}

// In-memory cache (per edge instance) — 24h
const cache = new Map<string, { ts: number; data: RoofAnalysis }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function cacheKey(b: AnalyzeBody) {
  const c = `${b.center.lat.toFixed(5)},${b.center.lng.toFixed(5)}`;
  const a = Math.round(b.selectedArea);
  const p = b.polygon.length;
  return `${c}|${a}|${p}`;
}

function validate(body: unknown): { ok: true; data: AnalyzeBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.polygon) || b.polygon.length < 3) return { ok: false, error: "polygon must have >=3 points" };
  if (!b.center || typeof b.center !== "object") return { ok: false, error: "center required" };
  const c = b.center as Record<string, unknown>;
  if (typeof c.lat !== "number" || typeof c.lng !== "number") return { ok: false, error: "invalid center" };
  if (c.lat < -90 || c.lat > 90 || c.lng < -180 || c.lng > 180) return { ok: false, error: "center out of range" };
  if (typeof b.selectedArea !== "number" || b.selectedArea <= 0 || b.selectedArea > 1_000_000)
    return { ok: false, error: "invalid selectedArea" };
  for (const p of b.polygon as LatLng[]) {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") return { ok: false, error: "invalid polygon point" };
  }
  return { ok: true, data: b as unknown as AnalyzeBody };
}

async function fetchSatelliteImage(center: LatLng, zoom: number, apiKey: string): Promise<string> {
  // 640x640 @ scale=2 = 1280x1280 effective, free tier OK
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=640x640&scale=2&maptype=satellite&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Static Maps error ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  // base64 encode
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return `data:image/png;base64,${btoa(bin)}`;
}

async function analyzeWithAI(
  imageDataUrl: string,
  selectedArea: number,
  apiKey: string,
): Promise<RoofAnalysis> {
  const systemPrompt = `You are a solar rooftop analysis expert reviewing a satellite image.
The user has drawn a polygon covering approximately ${Math.round(selectedArea)} m² centered on a building.
Your job: identify the actual rooftop boundary inside that polygon and estimate how much of it is usable for solar panels.
Account for obstacles: water tanks, HVAC units, satellite dishes, chimneys, roof access doors, parapets, shaded zones, vegetation, and skylights.
Return ONLY a JSON object via the provided tool. Be conservative.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Selected polygon area: ${Math.round(selectedArea)} m². Analyze the rooftop.` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_roof_analysis",
          description: "Return structured rooftop analysis",
          parameters: {
            type: "object",
            properties: {
              detectedRoofArea: { type: "number", description: "Estimated actual rooftop area in m²" },
              usableArea: { type: "number", description: "Usable solar area in m² after obstacles/shading" },
              unusablePercentage: { type: "number", description: "Percent of roof unusable (0-100)" },
              obstacles: {
                type: "array",
                items: { type: "string" },
                description: "List of detected obstacle types",
              },
              confidenceScore: { type: "number", description: "0..1 confidence" },
              notes: { type: "string", description: "Brief explanation" },
            },
            required: ["detectedRoofArea", "usableArea", "unusablePercentage", "obstacles", "confidenceScore"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report_roof_analysis" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 200)}`);
  }

  const json = await resp.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI returned no tool call");
  const args = JSON.parse(call.function.arguments);

  // Sanity clamp
  const detectedRoofArea = Math.max(0, Math.min(args.detectedRoofArea, selectedArea * 1.2));
  const usableArea = Math.max(0, Math.min(args.usableArea, detectedRoofArea));
  const unusablePercentage = Math.max(0, Math.min(args.unusablePercentage, 100));

  return {
    selectedArea,
    detectedRoofArea: Math.round(detectedRoofArea),
    usableArea: Math.round(usableArea),
    unusablePercentage: Math.round(unusablePercentage),
    obstacles: Array.isArray(args.obstacles) ? args.obstacles.slice(0, 10) : [],
    confidenceScore: Math.max(0, Math.min(Number(args.confidenceScore) || 0.5, 1)),
    notes: typeof args.notes === "string" ? args.notes.slice(0, 500) : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const v = validate(body);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = cacheKey(v.data);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...hit.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gmaps = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!gmaps || !lovableKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick zoom so polygon roughly fits — small selections get higher zoom
    const zoom = v.data.zoom ?? (v.data.selectedArea < 300 ? 21 : v.data.selectedArea < 1500 ? 20 : 19);

    const img = await fetchSatelliteImage(v.data.center, zoom, gmaps);

    let analysis: RoofAnalysis;
    try {
      analysis = await analyzeWithAI(img, v.data.selectedArea, lovableKey);
    } catch (aiErr) {
      console.error("AI analysis failed, using heuristic fallback:", aiErr);
      // Graceful fallback — never block the UI
      const detected = Math.round(v.data.selectedArea * 0.92);
      analysis = {
        selectedArea: v.data.selectedArea,
        detectedRoofArea: detected,
        usableArea: Math.round(detected * 0.65),
        unusablePercentage: 35,
        obstacles: [],
        confidenceScore: 0.3,
        notes: "Heuristic estimate (AI unavailable).",
      };
    }

    cache.set(key, { ts: Date.now(), data: analysis });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roof-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
