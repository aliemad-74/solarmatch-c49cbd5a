// Unified backend rooftop AI report.
// Frontend sends polygon + center; backend handles everything: vision detection,
// property classification, environment, cleaning recommendation, qirat math.
// Returns ONE structured JSON. Never blocks UI; degrades gracefully.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LatLng { lat: number; lng: number }
interface Body {
  polygon: LatLng[];
  center: LatLng;
  selectedArea: number;
  buildingTypeHint?: string;
  language?: "ar" | "en";
}

const SQM_PER_FEDDAN = 4200.83;

const cache = new Map<string, { ts: number; data: unknown }>();
const TTL = 24 * 60 * 60 * 1000;

function validate(body: unknown): { ok: true; data: Body } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid body" };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.polygon) || b.polygon.length < 3) return { ok: false, error: "polygon needs >=3 points" };
  const c = b.center as Record<string, unknown> | undefined;
  if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") return { ok: false, error: "invalid center" };
  if (c.lat < -90 || c.lat > 90 || c.lng < -180 || c.lng > 180) return { ok: false, error: "center out of range" };
  if (typeof b.selectedArea !== "number" || b.selectedArea <= 0 || b.selectedArea > 5_000_000)
    return { ok: false, error: "invalid selectedArea" };
  return { ok: true, data: b as unknown as Body };
}

async function fetchSatelliteImage(center: LatLng, area: number, key: string): Promise<string | null> {
  try {
    const zoom = area < 300 ? 21 : area < 1500 ? 20 : area < 8000 ? 19 : 18;
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=640x640&scale=2&maptype=satellite&key=${key}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:image/png;base64,${btoa(bin)}`;
  } catch (e) {
    console.warn("static maps fail", e);
    return null;
  }
}

async function visionAnalyze(image: string, area: number, hint: string | undefined, key: string) {
  const sys = `You are a solar rooftop and land-use expert reviewing a satellite image.

The user drew a coarse polygon of ~${Math.round(area)} m². The polygon is APPROXIMATE — it
often spills over onto neighboring buildings, streets, or empty lots. Your job is to find
the SINGLE PRIMARY building/structure the user actually intended (the one whose footprint
is most fully and most centrally contained inside the drawn polygon) and report ONLY its
real footprint.

CRITICAL RULES:
1. If the polygon contains one whole building plus partial slivers of adjacent buildings,
   IGNORE the partial neighbors entirely. Use only the fully-contained primary building.
   Example: user draws 400 m², inside there is one complete house of 250 m² centered, plus
   ~75 m² slices of two neighbor houses on the sides → return detectedRoofArea ≈ 250 m²
   and explain in 'notes' that neighbor slivers were excluded.
2. Prefer the building whose centroid is closest to the polygon centroid AND whose roof
   outline is FULLY visible inside the polygon. Reject any building cut by the polygon edge.
3. detectedRoofArea must be the real-world footprint of that one primary building only —
   never the polygon area, never a sum of multiple buildings.
4. If the polygon clearly contains a farm/land plot rather than buildings, treat the
   contiguous land parcel inside the polygon as the target instead.
5. usableArea = detectedRoofArea minus obstacles (water tanks, HVAC, dishes, parapets,
   stairwells, shading, vegetation). Be conservative.
6. propertyType is judged from the SURROUNDING urban pattern, not just the one building.
7. Hint from user (may be wrong, do not trust blindly): ${hint ?? "none"}.

Return JSON via the tool only. In 'notes', briefly state which building you picked and
which areas you excluded (e.g. "picked centered 18×14m house; excluded 2 neighbor slivers").`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          { type: "text", text: `Drawn polygon area ~${Math.round(area)} m². Identify the single primary building inside and report only its real footprint, ignoring sliced neighbors.` },
          { type: "image_url", image_url: { url: image } },
        ] },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report",
          description: "Structured rooftop + property analysis",
          parameters: {
            type: "object",
            properties: {
              detectedRoofArea: { type: "number" },
              usableArea: { type: "number" },
              unusablePercentage: { type: "number" },
              obstacles: { type: "array", items: { type: "string" } },
              propertyType: { type: "string", enum: ["residential", "commercial", "industrial", "warehouse", "farm", "mixed"] },
              propertyTypeReasoning: { type: "string" },
              confidenceScore: { type: "number" },
              notes: { type: "string" },
            },
            required: ["detectedRoofArea", "usableArea", "unusablePercentage", "obstacles", "propertyType", "confidenceScore"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report" } },
    }),
  });

  if (!r.ok) throw new Error(`gateway ${r.status}`);
  const j = await r.json();
  const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("no tool call");
  return JSON.parse(args);
}

async function fetchAirQuality(lat: number, lng: number, lang: "ar" | "en") {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anon) return null;
    const r = await fetch(`${supabaseUrl}/functions/v1/google-air-quality`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ lat, lng, language: lang }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.success ? j : null;
  } catch (e) {
    console.warn("air quality fetch failed", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const v = validate(await req.json().catch(() => null));
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { polygon, center, selectedArea, buildingTypeHint } = v.data;
    const lang: "ar" | "en" = v.data.language === "ar" ? "ar" : "en";

    const cacheKey = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}|${Math.round(selectedArea)}|${lang}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < TTL) {
      return new Response(JSON.stringify({ ...(hit.data as object), cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gmaps = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // 1. Vision analysis (with fallback)
    let vision: any = null;
    if (gmaps && lovableKey) {
      const img = await fetchSatelliteImage(center, selectedArea, gmaps);
      if (img) {
        try { vision = await visionAnalyze(img, selectedArea, buildingTypeHint, lovableKey); }
        catch (e) { console.warn("vision failed", e); }
      }
    }

    const detectedRoofArea = vision
      ? Math.max(0, Math.min(vision.detectedRoofArea, selectedArea * 1.15))
      : Math.round(selectedArea * 0.92);
    const usableArea = vision
      ? Math.max(0, Math.min(vision.usableArea, detectedRoofArea))
      : Math.round(detectedRoofArea * 0.65);
    const unusablePercentage = vision
      ? Math.max(0, Math.min(vision.unusablePercentage, 100))
      : 35;
    const obstacles: string[] = Array.isArray(vision?.obstacles) ? vision.obstacles.slice(0, 12) : [];
    const propertyType: string = vision?.propertyType ?? (selectedArea > 4000 ? "farm" : "residential");
    const confidenceScore = vision ? Math.max(0, Math.min(Number(vision.confidenceScore) || 0.5, 1)) : 0.3;

    // 2. Environment
    const air = await fetchAirQuality(center.lat, center.lng, lang);

    // 3. Qirat / feddan math (always provide; UI shows when farm)
    const feddans = +(selectedArea / SQM_PER_FEDDAN).toFixed(3);
    const qirats = +(feddans * 24).toFixed(2);

    const isFarm = propertyType === "farm";
    const irrigationNote = isFarm
      ? (lang === "ar"
          ? `يمكن تشغيل ${Math.round(usableArea / 8)} لتر/ساعة من الري بالتنقيط بمضخة شمسية بحجم ${Math.round(usableArea * 0.15)}kW.`
          : `Can power ~${Math.round(usableArea / 8)} L/h drip irrigation via a ~${Math.round(usableArea * 0.15)}kW solar pump.`)
      : null;

    const payload = {
      success: true,
      selectedArea: Math.round(selectedArea),
      detectedRoofArea: Math.round(detectedRoofArea),
      usableArea: Math.round(usableArea),
      unusablePercentage: Math.round(unusablePercentage),
      obstacles,
      propertyType,
      propertyTypeReasoning: vision?.propertyTypeReasoning ?? null,
      confidenceScore,
      notes: typeof vision?.notes === "string" ? vision.notes.slice(0, 500) : null,
      environment: air ? {
        available: air.available !== false,
        aqi: air.aqi,
        category: air.category,
        dominantPollutant: air.dominantPollutant,
        pm10: air.pm10,
        pm25: air.pm25,
        soilingLossPercent: air.soilingLossPercent,
        severity: air.severity,
        cleaningFrequency: air.cleaningFrequency,
      } : { available: false },
      farm: {
        isFarm,
        feddans,
        qirats,
        irrigationNote,
      },
      visionAvailable: !!vision,
    };

    cache.set(cacheKey, { ts: Date.now(), data: payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roof-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
