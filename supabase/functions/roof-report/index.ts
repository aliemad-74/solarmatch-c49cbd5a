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

function polygonBounds(poly: LatLng[]) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of poly) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

function pickZoom(poly: LatLng[], center: LatLng, sizePx: number): number {
  // Fit the polygon in the image with ~25% margin around it.
  const b = polygonBounds(poly);
  const latSpan = Math.max(b.maxLat - b.minLat, 1e-6);
  const lngSpan = Math.max(b.maxLng - b.minLng, 1e-6);
  // meters per degree
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const widthM = lngSpan * mPerDegLng;
  const heightM = latSpan * mPerDegLat;
  const targetM = Math.max(widthM, heightM) * 1.5; // 25% margin each side
  // meters per pixel at zoom z = 156543.03392 * cos(lat) / 2^z (at scale=1)
  // We want targetM / sizePx <= mpp(z)/scale  → choose smallest zoom satisfying
  for (let z = 21; z >= 16; z--) {
    const mpp = (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, z);
    const visibleM = mpp * sizePx; // at scale=1, sizePx covers this many meters
    if (visibleM >= targetM) return z;
  }
  return 18;
}

function encodePolyline(poly: LatLng[]): string {
  // Google encoded polyline algorithm
  let lastLat = 0, lastLng = 0, result = "";
  const enc = (v: number) => {
    v = v < 0 ? ~(v << 1) : v << 1;
    let s = "";
    while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
    s += String.fromCharCode(v + 63);
    return s;
  };
  for (const p of poly) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += enc(lat - lastLat) + enc(lng - lastLng);
    lastLat = lat; lastLng = lng;
  }
  return result;
}

async function fetchSatelliteImage(
  center: LatLng,
  polygon: LatLng[],
  key: string,
): Promise<{ image: string; zoom: number; metersPerPixel: number } | null> {
  try {
    const sizePx = 640;
    const zoom = pickZoom(polygon, center, sizePx);
    // meters per pixel in the rendered image (scale=2 doubles resolution but not coverage)
    const metersPerPixel = (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, zoom);
    // Overlay the user's polygon so the AI sees exactly what was selected.
    const closed = polygon[0].lat !== polygon[polygon.length - 1].lat || polygon[0].lng !== polygon[polygon.length - 1].lng
      ? [...polygon, polygon[0]] : polygon;
    const encoded = encodePolyline(closed);
    const path = `path=color:0xff2a2aff|weight:3|fillcolor:0xff2a2a33|enc:${encodeURIComponent(encoded)}`;
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=${sizePx}x${sizePx}&scale=2&maptype=satellite&${path}&key=${key}`;
    const r = await fetch(url);
    if (!r.ok) { console.warn("static maps", r.status); return null; }
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return { image: `data:image/png;base64,${btoa(bin)}`, zoom, metersPerPixel };
  } catch (e) {
    console.warn("static maps fail", e);
    return null;
  }
}

async function visionAnalyze(
  image: string,
  area: number,
  metersPerPixel: number,
  zoom: number,
  hint: string | undefined,
  key: string,
) {
  // The image is 640x640 CSS px but @scale=2 → 1280x1280 actual; coverage is still 640*mpp meters.
  const coverageM = 640 * metersPerPixel;
  const sys = `You are a precise solar rooftop measurement expert reviewing a Google satellite image.

IMAGE METADATA (use these for ALL measurements):
- The image is a square top-down satellite tile.
- Zoom level: ${zoom}
- Ground resolution at the image center: ${metersPerPixel.toFixed(3)} meters per CSS pixel.
- Total ground coverage of the image: ${coverageM.toFixed(1)} m × ${coverageM.toFixed(1)} m.
- A RED outlined polygon is drawn ON the image. This is what the user selected.
  Polygon real-world area ≈ ${Math.round(area)} m².
  WARNING: users routinely draw a SLOPPY/OVERSIZED polygon that includes parts of
  neighbouring buildings, courtyards, streets, or empty land. The polygon is ONLY a hint
  for which building they meant. The true footprint is almost always SMALLER.

YOUR TASK:
Find the SINGLE PRIMARY building (the one most centrally inside the red polygon) and
measure ONLY THAT building's true roof footprint — bounded strictly by its OWN external
walls / parapet edge.

CRITICAL — BOUNDARY DETECTION (Egyptian urban context):
Buildings here are commonly attached wall-to-wall and from above can look like one large
rectangle. You MUST distinguish neighbours by looking for:
  - Thin straight seam line / shadow stripe between roof sections.
  - Change in roof colour, texture, material, or roof-equipment density.
  - Different parapet height (different shadow widths along an edge).
  - Different roof orientation, water tanks, stairwells, or dish positions.
If you see such a seam INSIDE the polygon, treat each side as a separate building and
return ONLY the one the polygon is centred on.

DO NOT INCLUDE in detectedRoofArea:
  - Neighbouring buildings (even attached ones across a seam).
  - Courtyards, gardens, driveways, sidewalks, streets, parking, empty land.
  - Anything outside the chosen building's external walls.
DO NOT extend the footprint to fill the polygon "to be safe" — measure the actual roof.

HOW TO MEASURE (CSS pixels → meters):
- length_m = length_px × ${metersPerPixel.toFixed(3)} ;
  width_m  = width_px  × ${metersPerPixel.toFixed(3)}
- detectedRoofArea = sum of rectangles that cover the true outline of the chosen building
  only (use the real shape for L / T / U / irregular roofs, not its bounding box).
- usableArea = detectedRoofArea minus obstacles (water tanks, HVAC, dishes, stairwells,
  parapets, shading, vegetation). Typically 60–85% residential, 70–90% warehouse/industrial.
- unusablePercentage = round((1 - usableArea/detectedRoofArea) × 100).
- propertyType from surrounding urban pattern.
- confidenceScore: 0.85+ crisp outline; 0.5–0.7 partly shaded/blurry; <0.5 unclear.

EXAMPLES:
- Polygon ≈ 400 m² containing one centred ~250 m² house + slivers of 2 neighbours
  → detectedRoofArea ≈ 250.
- Polygon ≈ 600 m² covering two attached row-houses with a visible seam, centred on the
  left one → return ONLY the left house, e.g. ~280 m² (NOT 600).
- Polygon ≈ 300 m² tightly tracing one house that fills it → return that house's true
  outline (e.g. ~270), NOT the polygon area.
- Polygon ≈ 500 m² but the building inside is clearly only a ~180 m² villa surrounded by
  garden → return 180, not 500.

Hint from user (may be wrong, do not trust blindly): ${hint ?? "none"}.

In 'notes' state the measured dimensions, which building you picked, and any seam used
to separate it from neighbours, e.g.
"left of two attached row-houses; seam at x≈380px (colour change + parapet shadow);
measured ~17×16 m = 272 m²; excluded right neighbour and ~80 m² of yard at south".

Return JSON via the tool only.`;


  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      temperature: 0.1,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          { type: "text", text: `Measure the primary building inside the red polygon. Polygon ≈ ${Math.round(area)} m². Image ground resolution: ${metersPerPixel.toFixed(3)} m/px. Report the building's true footprint — do not under-report.` },
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

    // 1. Vision analysis — TWO independent passes in parallel, then median.
    // Single-shot vision is too noisy (Gemini swings ±50% between calls);
    // taking the median of 2 independent measurements stabilises the output.
    let vision: any = null;
    let visionPasses: any[] = [];
    if (gmaps && lovableKey) {
      const shot = await fetchSatelliteImage(center, polygon, gmaps);
      if (shot) {
        const passes = await Promise.allSettled([
          visionAnalyze(shot.image, selectedArea, shot.metersPerPixel, shot.zoom, buildingTypeHint, lovableKey),
          visionAnalyze(shot.image, selectedArea, shot.metersPerPixel, shot.zoom, buildingTypeHint, lovableKey),
        ]);
        visionPasses = passes
          .filter((p): p is PromiseFulfilledResult<any> => p.status === "fulfilled" && p.value)
          .map((p) => p.value);
        if (visionPasses.length > 0) {
          const median = (xs: number[]) => {
            const s = xs.slice().sort((a, b) => a - b);
            return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
          };
          vision = {
            detectedRoofArea: median(visionPasses.map((v) => Number(v.detectedRoofArea) || 0)),
            usableArea: median(visionPasses.map((v) => Number(v.usableArea) || 0)),
            obstacles: visionPasses[0].obstacles,
            propertyType: visionPasses[0].propertyType,
            propertyTypeReasoning: visionPasses[0].propertyTypeReasoning,
            confidenceScore: median(visionPasses.map((v) => Number(v.confidenceScore) || 0.5)),
            notes: visionPasses.map((v) => v.notes).filter(Boolean).join(" | "),
          };
          console.log(`Vision passes: ${visionPasses.length}, median detectedRoofArea=${Math.round(vision.detectedRoofArea)}, usableArea=${Math.round(vision.usableArea)}`);
        }
      }
    }

    // Property-type-aware usable ratio bands (tight, deterministic).
    const propertyType: string = vision?.propertyType ?? (selectedArea > 4000 ? "farm" : "residential");
    const usableBand: Record<string, [number, number]> = {
      residential: [0.55, 0.78],
      commercial:  [0.62, 0.85],
      industrial:  [0.68, 0.90],
      warehouse:   [0.70, 0.92],
      farm:        [0.78, 0.92],
      mixed:       [0.58, 0.82],
    };
    const [minUR, maxUR] = usableBand[propertyType] ?? [0.55, 0.80];

    // detectedRoofArea: cap above polygon+15%, but ALSO floor at polygon*0.55
    // for dense urban (residential/commercial/mixed) where a tight polygon
    // almost certainly traces one building — AI under-detection is the #1 bug.
    const denseFloor = ["residential", "commercial", "mixed", "industrial"].includes(propertyType) ? 0.55 : 0.40;
    let detectedRoofArea = vision
      ? Math.max(
          selectedArea * denseFloor,
          Math.min(vision.detectedRoofArea, selectedArea * 1.15),
        )
      : Math.round(selectedArea * 0.85);

    // usableArea: clamp into the per-type band — no more 20% or 95% outliers.
    const aiUsableRatio = vision ? vision.usableArea / Math.max(vision.detectedRoofArea, 1) : (minUR + maxUR) / 2;
    const clampedRatio = Math.max(minUR, Math.min(maxUR, aiUsableRatio));
    let usableArea = Math.round(detectedRoofArea * clampedRatio);

    const unusablePercentage = Math.round(
      Math.max(0, Math.min(100, (1 - usableArea / Math.max(detectedRoofArea, 1)) * 100)),
    );
    const obstacles: string[] = Array.isArray(vision?.obstacles) ? vision.obstacles.slice(0, 12) : [];
    const confidenceScore = vision
      ? Math.max(0, Math.min(Number(vision.confidenceScore) || 0.5, 1)) * (visionPasses.length === 2 ? 1 : 0.85)
      : 0.3;


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
