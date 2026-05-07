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
- A RED outlined polygon (semi-transparent red fill) is drawn ON the image. This is exactly
  what the user selected. Its real-world area is ~${Math.round(area)} m².

YOUR TASK:
Find the SINGLE PRIMARY building (or land parcel) the user actually intended — the one
whose footprint is most fully and most centrally contained inside the red polygon.
Then MEASURE that one building's true ground footprint and report it.

HOW TO MEASURE (do this carefully, do NOT guess low):
1. Visually estimate the building's length × width in CSS pixels on the image.
2. Convert to meters: length_m = length_px × ${metersPerPixel.toFixed(3)} ;
   width_m = width_px × ${metersPerPixel.toFixed(3)} .
3. detectedRoofArea = length_m × width_m (adjust for non-rectangular shapes; use the
   true outline, not the bounding box, when shapes are L/T/U-shaped).
4. Sanity check against the red polygon: if the primary building visibly fills most of the
   polygon, detectedRoofArea should be CLOSE TO (not far below) ${Math.round(area)} m².
   Underestimating is a common failure — be honest about what you see.
5. If the polygon contains one whole building plus thin slivers of neighbor buildings,
   exclude the slivers. Example: 400 m² polygon with one centered 250 m² house and
   2× ~75 m² neighbor slivers → return 250 m². But if the polygon mostly contains ONE
   large building that fills it (e.g. a ~270 m² house in a ~300 m² polygon), return ~270.
6. usableArea = detectedRoofArea minus obstacles (water tanks, HVAC, dishes, stairwells,
   parapets, shading, vegetation). Typically 60–85% of detectedRoofArea for residential.
7. unusablePercentage = round((1 - usableArea/detectedRoofArea) × 100).
8. propertyType from the surrounding urban pattern, not just one building.
9. confidenceScore: 0.85+ if roof outline is crisp; 0.5–0.7 if partly shaded/blurry.

Hint from user (may be wrong, do not trust blindly): ${hint ?? "none"}.

In 'notes', state the measured dimensions and which building you picked, e.g.
"primary house ~18×15 m = 270 m²; excluded 1 small neighbor sliver on north edge".

Return JSON via the tool only.`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
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
