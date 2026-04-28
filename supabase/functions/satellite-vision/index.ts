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

function buildContextDescription(buildingType?: string, farmMode?: boolean, agriculturalActivity?: string, language: string = "en"): { contextLabel: string; goal: string; expectedScene: string } {
  const isAr = language === "ar";

  if (farmMode) {
    const activityMap: Record<string, { ar: string; en: string }> = {
      drip_irrigation: { ar: "ري بالتنقيط (مضخات وخراطيم)", en: "drip irrigation (pumps and pipes)" },
      surface_irrigation: { ar: "ري بالغمر (قنوات وحقول مفتوحة)", en: "surface/flood irrigation (canals, open fields)" },
      cold_storage: { ar: "تبريد/تخزين بارد (مباني تبريد، ثلاجات، مخازن معزولة)", en: "cold storage (refrigeration buildings, insulated warehouses, fridge units)" },
      greenhouse: { ar: "صوب زراعية بإضاءة وتهوية", en: "greenhouses with lighting and ventilation" },
      mixed: { ar: "نشاط زراعي متعدد", en: "mixed agricultural activity" },
    };
    const act = agriculturalActivity ? activityMap[agriculturalActivity] : null;
    const actText = act ? (isAr ? act.ar : act.en) : (isAr ? "نشاط زراعي" : "agricultural activity");
    return {
      contextLabel: isAr ? `أرض زراعية — ${actText}` : `Agricultural land — ${actText}`,
      goal: isAr
        ? `الهدف من الطاقة الشمسية هنا هو تشغيل ${actText}. حدد أين يمكن تركيب الألواح (أرض مفتوحة بجانب المعدات، أو فوق مباني التبريد/المخازن، أو فوق هياكل الصوب). إذا رأيت مبنى تبريد أو ثلاجة فاذكر ذلك صراحة.`
        : `The solar system here is intended to power ${actText}. Identify where panels could be installed (open ground near equipment, on top of cold-storage buildings/warehouses, or over greenhouse structures). If you see a cold-storage building or fridge unit, call it out explicitly.`,
      expectedScene: isAr
        ? "قد ترى: حقول مفتوحة، قنوات ري، مضخات، صوب، مباني تبريد، طرق ترابية، أشجار، خزانات مياه."
        : "You may see: open fields, irrigation canals, pumps, greenhouses, cold-storage buildings, dirt roads, trees, water tanks.",
    };
  }

  const buildingMap: Record<string, { ar: { label: string; goal: string }; en: { label: string; goal: string } }> = {
    residential: {
      ar: { label: "سطح منزل سكني", goal: "تركيب ألواح لتغطية استهلاك المنزل. ابحث عن خزانات المياه، أطباق الأقمار، وحدات التكييف، غرف السلالم." },
      en: { label: "residential rooftop", goal: "Install panels to cover home consumption. Look for water tanks, satellite dishes, AC units, stairs rooms." },
    },
    apartment: {
      ar: { label: "سطح عمارة سكنية متعددة الوحدات", goal: "تركيب نظام مشترك لعدة شقق. ركز على المساحة الإجمالية القابلة للاستخدام بعد استبعاد العوائق المشتركة." },
      en: { label: "multi-unit apartment rooftop", goal: "Install a shared system for multiple apartments. Focus on total usable area after excluding shared obstacles." },
    },
    commercial: {
      ar: { label: "مبنى تجاري (محل/مكتب/مول)", goal: "تركيب نظام لتغطية تكييف وإضاءة وأجهزة المبنى التجاري. السطح غالباً أكبر وأقل عوائق." },
      en: { label: "commercial building (shop/office/mall)", goal: "Install a system to cover commercial AC, lighting, and equipment. Roof is usually larger with fewer obstacles." },
    },
    industrial: {
      ar: { label: "مبنى صناعي/مصنع/مستودع", goal: "تركيب نظام كبير لتشغيل المعدات الصناعية. ابحث عن مناور، فتحات تهوية صناعية، مداخن." },
      en: { label: "industrial building / factory / warehouse", goal: "Install a large system to run industrial equipment. Look for skylights, industrial vents, chimneys." },
    },
  };

  const cfg = buildingType && buildingMap[buildingType] ? buildingMap[buildingType] : buildingMap.residential;
  const c = isAr ? cfg.ar : cfg.en;
  return {
    contextLabel: c.label,
    goal: c.goal,
    expectedScene: isAr
      ? "قد ترى: سطح مبنى، خزانات، أطباق، تكييفات، غرف سلالم، مباني مجاورة قد تسبب ظلاً."
      : "You may see: building rooftop, tanks, dishes, AC units, stairs rooms, neighboring buildings that may cause shading.",
  };
}

async function analyzeWithGemini(imageBase64: string, language: string, ctx: { contextLabel: string; goal: string; expectedScene: string }) {
  const isAr = language === "ar";
  const systemPrompt = isAr
    ? `أنت مهندس طاقة شمسية متخصص في تحليل صور الأقمار الصناعية. حلل المنطقة المحددة بالأحمر بدقة هندسية. لا تفترض دائماً أنها سطح بيت — قد تكون أرضاً زراعية، مصنعاً، صوبة، أو مبنى تبريد. السياق الحالي: ${ctx.contextLabel}.`
    : `You are a solar engineer specialized in analyzing satellite images. Analyze the area outlined in red with engineering precision. Do NOT always assume it is a house rooftop — it could be farmland, a factory, a greenhouse, or a cold-storage building. Current context: ${ctx.contextLabel}.`;

  const userPrompt = isAr
    ? `حلل المنطقة المحددة بالأحمر.\n\nالسياق من المستخدم: ${ctx.contextLabel}.\nالغرض من تركيب الطاقة الشمسية: ${ctx.goal}\n\n${ctx.expectedScene}\n\nالمطلوب: 1) صف بدقة ما تراه في المنطقة المحددة (سطح، أرض، مبنى تبريد، صوبة...). 2) حدد العوائق الفعلية المرئية. 3) قدّر النسبة القابلة للاستخدام للألواح الشمسية. 4) قيّم التظليل والاتجاه. كن متحفظاً.`
    : `Analyze the area outlined in red.\n\nUser context: ${ctx.contextLabel}.\nPurpose of solar installation: ${ctx.goal}\n\n${ctx.expectedScene}\n\nTask: 1) Describe accurately what you actually see in the marked area (rooftop, open land, cold-storage building, greenhouse, etc.). 2) Identify visible obstacles. 3) Estimate the usable fraction for solar panels. 4) Assess shading and orientation. Be conservative.`;

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
        description: "Return structured site analysis from satellite image (rooftop, farmland, or other).",
        parameters: {
          type: "object",
          properties: {
            siteType: { type: "string", enum: ["residential_roof", "apartment_roof", "commercial_roof", "industrial_roof", "warehouse_roof", "cold_storage_building", "greenhouse", "open_farmland", "irrigated_field", "mixed_site", "other"], description: "What you actually see in the marked red area." },
            sceneDescription: { type: "string", description: "1-2 sentence factual description of what is inside the red polygon (in the requested language)." },
            usableAreaRatio: { type: "number", description: "0.0-1.0, fraction of marked area usable for panels after subtracting obstacles" },
            obstacles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["water_tank", "satellite_dish", "ac_unit", "stairs_room", "chimney", "skylight", "vent", "tree", "irrigation_pipe", "canal", "building_edge", "other"] },
                  description: { type: "string" },
                },
                required: ["type", "description"],
              },
            },
            shadingLevel: { type: "string", enum: ["low", "medium", "high"] },
            orientation: { type: "string", enum: ["north", "south", "east", "west", "mixed", "flat"] },
            warnings: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string", description: "1-2 sentence summary in the requested language tying the scene to the solar installation purpose." },
          },
          required: ["siteType", "sceneDescription", "usableAreaRatio", "obstacles", "shadingLevel", "orientation", "warnings", "confidence", "summary"],
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
