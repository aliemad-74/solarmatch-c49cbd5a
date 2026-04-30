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

// Approximate polygon area in m² using equirectangular projection + shoelace.
function polygonAreaSqm(points: PolygonPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6378137; // earth radius m
  const latRef = (points.reduce((s, p) => s + p.lat, 0) / points.length) * Math.PI / 180;
  const xy = points.map((p) => {
    const x = (p.lng * Math.PI / 180) * R * Math.cos(latRef);
    const y = (p.lat * Math.PI / 180) * R;
    return { x, y };
  });
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const a = xy[i];
    const b = xy[(i + 1) % xy.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
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

async function analyzeWithGemini(imageBase64: string, language: string, ctx: { contextLabel: string; goal: string; expectedScene: string }, drawnAreaSqm: number | null) {
  const isAr = language === "ar";
  const systemPrompt = isAr
    ? `أنت مهندس طاقة شمسية متخصص في تحليل صور الأقمار الصناعية. حلل المنطقة المحددة بالأحمر بدقة هندسية. المستخدم رسم المنطقة بشكل تقريبي وقد يكون رسم مربعاً أكبر من الهدف الفعلي — مهمتك أن تكتشف الهدف الحقيقي (مبنى، سطح، مزرعة، صوبة، مبنى تبريد) جوا المنطقة المحددة وتقدر نسبته من المساحة المرسومة. لا تفترض دائماً أنها سطح بيت. السياق الحالي: ${ctx.contextLabel}.`
    : `You are a solar engineer specialized in analyzing satellite images. Analyze the area outlined in red with engineering precision. The user drew the area approximately and may have drawn a square LARGER than the actual target — your job is to detect the REAL intended target (building, rooftop, farm, greenhouse, cold-storage) inside the marked region and estimate its fraction of the drawn area. Do NOT always assume it is a house rooftop. Current context: ${ctx.contextLabel}.`;

  const drawnText = drawnAreaSqm && drawnAreaSqm > 0
    ? (isAr ? `\nمساحة المضلع المرسوم تقريباً: ${Math.round(drawnAreaSqm)} م².` : `\nApprox drawn polygon area: ${Math.round(drawnAreaSqm)} m².`)
    : "";

  const userPrompt = isAr
    ? `حلل المنطقة المحددة بالأحمر.${drawnText}\n\nالسياق من المستخدم: ${ctx.contextLabel}.\nالغرض من تركيب الطاقة الشمسية: ${ctx.goal}\n\n${ctx.expectedScene}\n\nالمطلوب بدقة:\n1) صف بدقة ما تراه (سطح بيت، عمارة، صوبة، مزرعة، مبنى تبريد، أرض فضاء...).\n2) **اكتشف الهدف الفعلي**: لو الرسمة مربع كبير وجواه مبنى أصغر، حدد المبنى الفعلي وقدّر مساحته الحقيقية بالمتر المربع (detectedAreaSqm) ونسبته من المساحة المرسومة (detectedAreaRatio = الهدف الفعلي ÷ المرسوم، 0-1).\n3) لو الرسمة مطابقة للهدف، detectedAreaRatio ≈ 1.0.\n4) بعد كده، حدد العوائق المرئية وقدّر usableAreaRatio (نسبة المساحة الصالحة فعلياً للألواح من **الهدف المكتشف** بعد خصم العوائق، 0-1).\n5) قيّم التظليل والاتجاه. كن متحفظاً.`
    : `Analyze the area outlined in red.${drawnText}\n\nUser context: ${ctx.contextLabel}.\nPurpose of solar installation: ${ctx.goal}\n\n${ctx.expectedScene}\n\nTask (be precise):\n1) Describe what you actually see (house roof, apartment, greenhouse, farmland, cold-storage building, empty land...).\n2) **Detect the real target**: if the drawing is a coarse big square and the actual building/structure inside is smaller, identify it and estimate its real footprint in m² (detectedAreaSqm) and its fraction of the drawn polygon (detectedAreaRatio = real target ÷ drawn, 0-1).\n3) If the drawing tightly matches the target, detectedAreaRatio ≈ 1.0.\n4) Then identify visible obstacles and estimate usableAreaRatio (fraction of the **detected target** actually usable for panels after deducting obstacles, 0-1).\n5) Assess shading and orientation. Be conservative.`;

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
            detectedAreaRatio: { type: "number", description: "0.05-1.0. Fraction of the drawn polygon that is occupied by the actual intended target (building/farm/structure). Use ~1.0 if the polygon tightly matches the target. Use <1.0 if the user drew a coarse big square around a smaller building." },
            detectedAreaSqm: { type: "number", description: "Estimated real footprint of the detected target in square meters (must be consistent with detectedAreaRatio × drawn polygon area)." },
            detectionNote: { type: "string", description: "1 short sentence (in the requested language) explaining what was detected as the real target inside the drawn polygon." },
            usableAreaRatio: { type: "number", description: "0.0-1.0, fraction of the DETECTED target usable for panels after subtracting visible obstacles (NOT of the drawn polygon)." },
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
          required: ["siteType", "sceneDescription", "detectedAreaRatio", "detectedAreaSqm", "detectionNote", "usableAreaRatio", "obstacles", "shadingLevel", "orientation", "warnings", "confidence", "summary"],
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

    const { lat, lng, polygonPoints, language = "en", buildingType, farmMode, agriculturalActivity } = await req.json();

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

    const ctxKey = `${buildingType ?? "?"}|${farmMode ? "farm" : "bld"}|${agriculturalActivity ?? "-"}`;
    const key = cacheKey(lat, lng, polygonPoints) + "::" + ctxKey;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = buildContextDescription(buildingType, farmMode, agriculturalActivity, language);
    const url = buildStaticMapUrl(lat, lng, polygonPoints);
    const imageB64 = await fetchImageAsBase64(url);
    const analysis = await analyzeWithGemini(imageB64, language, ctx);

    // Sanitize ratio
    const ratio = Math.max(0, Math.min(1, Number(analysis.usableAreaRatio) || 0.85));
    const result = {
      siteType: analysis.siteType ?? "other",
      sceneDescription: analysis.sceneDescription ?? "",
      usableAreaRatio: ratio,
      obstacles: analysis.obstacles ?? [],
      shadingLevel: analysis.shadingLevel ?? "low",
      orientation: analysis.orientation ?? "flat",
      warnings: analysis.warnings ?? [],
      confidence: analysis.confidence ?? "medium",
      summary: analysis.summary ?? "",
      contextLabel: ctx.contextLabel,
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
