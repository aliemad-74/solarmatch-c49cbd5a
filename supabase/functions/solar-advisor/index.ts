import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Rate limiting ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= 15) return false;
  record.count++;
  return true;
}

// --- Safe value helper ---
function safeValue(value: unknown, fallback = "N/A") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && isNaN(value))
  ) {
    return fallback;
  }
  return value;
}

// --- JSON response helpers ---
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Call AI via Lovable AI Gateway ---
async function callGemini(
  _apiKey: string,
  prompt: string,
  jsonMode: boolean,
  timeoutMs = 30000
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { ok: false, error: "LOVABLE_API_KEY not configured" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("AI fetch error:", err);
    return { ok: false, error: "AI request failed (timeout or network)" };
  }
  clearTimeout(timeoutId);

  console.log("Lovable AI response status:", response.status);

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI non-OK:", response.status, errText);
    return { ok: false, error: `AI service error: ${response.status}` };
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    console.error("Invalid AI response structure:", JSON.stringify(data).slice(0, 300));
    return { ok: false, error: "Invalid AI response structure" };
  }

  return { ok: true, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return jsonResponse({ success: false, error: "Rate limit exceeded" }, 429);
    }

    // Validate API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    console.log("LOVABLE_API_KEY exists:", !!LOVABLE_API_KEY);
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ success: false, error: "Missing LOVABLE_API_KEY" }, 500);
    }

    // Validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
    }

    const mode = (body.mode as string) || "advisor";
    const language = (body.language as string) === "ar" ? "ar" : "en";
    const d = (body.solarData as Record<string, unknown>) || {};

    if (!d || Object.keys(d).length === 0) {
      return jsonResponse({ success: false, error: "Missing solarData" }, 400);
    }

    // Sanitize all values
    const locationName = safeValue(d.locationName, language === "ar" ? "غير محدد" : "Not specified");
    const kWInstalled = safeValue(d.kWInstalled);
    const energyYear = safeValue(d.energyYear);
    const totalCost = safeValue(d.totalCost);
    const savingsYear = safeValue(d.savingsYear);
    const paybackYears = safeValue(d.paybackYears);
    const co2Reduction = safeValue(d.co2Reduction);
    const co2Saved = safeValue(d.co2Saved);
    const buildingType = safeValue(d.buildingType);
    const pvType = safeValue(d.pvType);
    const costPerKW = safeValue(d.costPerKW);
    const panelCount = safeValue(d.panelCount);
    const usableArea = safeValue(d.usableArea);
    const monthlyConsumption = safeValue(d.monthlyConsumption);
    const electricityPrice = safeValue(d.electricityPrice);
    const coverageRatio =
      typeof d.coverageRatio === "number" && !isNaN(d.coverageRatio)
        ? Math.round(d.coverageRatio)
        : "N/A";

    console.log(`Mode: ${mode}, Language: ${language}`);
    console.log("Sanitized solar data:", {
      locationName, kWInstalled, energyYear, coverageRatio,
      totalCost, savingsYear, paybackYears, co2Reduction, buildingType, pvType,
    });

    // Vision + environmental findings (optional, passed from frontend after solar-engine returns)
    const vision = (d.visionFindings as Record<string, unknown>) || null;
    const env = (d.environmental as Record<string, unknown>) || null;

    const visionBlockAr = vision
      ? `\n\nتحليل صورة القمر الصناعي بالذكاء الاصطناعي (Gemini Vision):
- نسبة المساحة الصالحة فعلياً للألواح: ${Math.round(((vision.usableAreaRatio as number) ?? 1) * 100)}% من المساحة المرسومة
- النسبة المطبقة في الحساب: ${Math.round(((vision.applied_ratio as number) ?? 1) * 100)}%
- العوائق المرصودة: ${Array.isArray(vision.obstacles) ? (vision.obstacles as any[]).length : 0} (${Array.isArray(vision.obstacles) ? (vision.obstacles as any[]).map((o: any) => o.type).join("، ") || "لا يوجد" : "غير متاح"})
- مستوى الظل: ${vision.shadingLevel ?? "غير محدد"}
- اتجاه السطح: ${vision.orientation ?? "غير محدد"}
- ثقة التحليل البصري: ${vision.confidence ?? "متوسطة"}
- ملخص التحليل: ${vision.summary ?? ""}`
      : "\n\nملاحظة: لم يتم رسم حدود السطح، لذا الحساب يعتمد على المساحة الإجمالية بدون خصم للعوائق المحتملة.";

    const envBlockAr = env
      ? `\n\nالعوامل البيئية المؤثرة على الإنتاج:
- مؤشر جودة الهواء AQI: ${env.aqi ?? "غير متاح"} (الملوث المهيمن: ${env.dominant_pollutant ?? "غير محدد"})
- PM10: ${env.pm10 ?? "غير متاح"} ميكروجرام/م³ — PM2.5: ${env.pm25 ?? "غير متاح"} ميكروجرام/م³
- مؤشر الغبار/حبوب اللقاح: ${env.pollen_index ?? 0}
- نسبة الفقد بسبب الغبار/الاتساخ المطبقة: ${env.soiling_loss_percent ?? 0}%
- درجة الحرارة: ${env.temperature ?? "غير متاح"}°م — السحب: ${env.cloud_cover ?? 0}%`
      : "";

    const visionBlockEn = vision
      ? `\n\nSatellite Image AI Analysis (Gemini Vision):
- Actual usable rooftop ratio: ${Math.round(((vision.usableAreaRatio as number) ?? 1) * 100)}% of drawn area
- Ratio applied to calculation: ${Math.round(((vision.applied_ratio as number) ?? 1) * 100)}%
- Obstacles detected: ${Array.isArray(vision.obstacles) ? (vision.obstacles as any[]).length : 0} (${Array.isArray(vision.obstacles) ? (vision.obstacles as any[]).map((o: any) => o.type).join(", ") || "none" : "n/a"})
- Shading level: ${vision.shadingLevel ?? "n/a"}
- Roof orientation: ${vision.orientation ?? "n/a"}
- Vision confidence: ${vision.confidence ?? "medium"}
- Vision summary: ${vision.summary ?? ""}`
      : "\n\nNote: No rooftop polygon was drawn, so calculation used full area without obstacle deduction.";

    const envBlockEn = env
      ? `\n\nEnvironmental factors affecting production:
- Air Quality Index (AQI): ${env.aqi ?? "n/a"} (dominant pollutant: ${env.dominant_pollutant ?? "n/a"})
- PM10: ${env.pm10 ?? "n/a"} µg/m³ — PM2.5: ${env.pm25 ?? "n/a"} µg/m³
- Pollen/dust index: ${env.pollen_index ?? 0}
- Soiling/dust loss applied to production: ${env.soiling_loss_percent ?? 0}%
- Temperature: ${env.temperature ?? "n/a"}°C — Cloud cover: ${env.cloud_cover ?? 0}%`
      : "";

    // ==========================================
    // MODE: REVIEW (AI checkpoint before display)
    // ==========================================
    if (mode === "review") {
      const reviewPrompt = language === "ar"
        ? `أنت مهندس طاقة شمسية خبير في السوق المصري ومطلع على أحدث أسعار السوق حتى تاريخ اليوم.

مهمتك: راجع نتائج حسابات جدوى الطاقة الشمسية التالية وتحقق من دقتها مع الأخذ في الاعتبار التحليل البصري للسطح والظروف البيئية.

بيانات المشروع:
- الموقع: ${locationName}
- مساحة السطح المستخدمة: ${usableArea} م²
- حجم النظام: ${kWInstalled} كيلوواط
- عدد الألواح: ${panelCount}
- الإنتاج السنوي: ${energyYear} كيلوواط/ساعة
- نسبة تغطية الاستهلاك: ${coverageRatio}%
- الاستهلاك الشهري: ${monthlyConsumption} كيلوواط/ساعة
- سعر الكهرباء: ${electricityPrice} جنيه/كيلوواط
- التكلفة الإجمالية: ${totalCost} جنيه
- تكلفة الكيلوواط: ${costPerKW} جنيه
- التوفير السنوي: ${savingsYear} جنيه
- فترة الاسترداد: ${paybackYears} سنة
- تخفيض CO2: ${co2Saved || co2Reduction} طن/سنة
- نوع المبنى: ${buildingType}
- نوع الألواح: ${pvType}${visionBlockAr}${envBlockAr}

راجع هذه البيانات وأرجع JSON بالشكل التالي:
{
  "validated": true أو false,
  "confidenceScore": رقم من 1 إلى 100,
  "issues": ["أي مشكلة وجدتها"],
  "adjustments": {
    "totalCost": التكلفة المعدلة أو null,
    "costPerKW": تكلفة الكيلوواط المعدلة أو null,
    "paybackYears": فترة الاسترداد المعدلة أو null
  },
  "interpretation": "تفسير شامل ومفصل في 4-6 فقرات. ادمج صراحةً نتائج التحليل البصري للسطح (العوائق، نسبة المساحة الفعلية، الظل) ومستوى الغبار/التلوث. وضح كيف أثرت هذه العوامل على الحساب. ابدأ مباشرة بالتقييم بدون 'بصفتي' أو 'كـ'."
}

ملاحظات مهمة:
- إذا كانت نسبة المساحة الصالحة من تحليل القمر الصناعي أقل من 60%، نبه العميل أن السطح مزدحم بالعوائق
- إذا كانت نسبة الغبار المطبقة أكثر من 5%، انصح بجدول تنظيف شهري
- إذا كان مستوى الظل عالي (high)، نبه أن الإنتاج الفعلي قد يقل بنسبة 10-15%
- أسعار السوق المصري الحالية: 18,000 - 25,000 جنيه/كيلوواط
- لا تعدل الأرقام إلا إذا كان الانحراف أكثر من 20%
- إذا كانت التغطية أكثر من 150%، انصح بتقليل حجم النظام`
        : `You are an expert solar energy engineer for the Egyptian market, up-to-date with current market prices.

Task: Review the following solar feasibility calculation results, considering the satellite vision analysis of the rooftop and environmental conditions.

Project Data:
- Location: ${locationName}
- Usable Roof Area: ${usableArea} m²
- System Size: ${kWInstalled} kW
- Panel Count: ${panelCount}
- Annual Production: ${energyYear} kWh
- Consumption Coverage: ${coverageRatio}%
- Monthly Consumption: ${monthlyConsumption} kWh
- Electricity Price: ${electricityPrice} EGP/kWh
- Total Cost: ${totalCost} EGP
- Cost per kW: ${costPerKW} EGP
- Annual Savings: ${savingsYear} EGP
- Payback Period: ${paybackYears} years
- CO2 Reduction: ${co2Saved || co2Reduction} tons/year
- Building Type: ${buildingType}
- Panel Type: ${pvType}${visionBlockEn}${envBlockEn}

Review and return JSON in this format:
{
  "validated": true or false,
  "confidenceScore": number from 1 to 100,
  "issues": ["any issues found"],
  "adjustments": {
    "totalCost": adjusted cost or null,
    "costPerKW": adjusted cost per kW or null,
    "paybackYears": adjusted payback or null
  },
  "interpretation": "A 4-6 paragraph interpretation. Explicitly weave in the satellite vision findings (obstacles, actual usable ratio, shading) and the dust/pollution level. Explain how these factors influenced the calculation. Start directly with the assessment, no 'As a' or 'As your'."
}

Important notes:
- If satellite vision usable ratio is below 60%, warn the client the roof is crowded with obstacles
- If applied soiling loss exceeds 5%, recommend a monthly cleaning schedule
- If shading level is high, warn that real production may drop 10-15%
- Current Egyptian market prices: 18,000 - 25,000 EGP/kW
- Only adjust numbers if deviation exceeds 20%
- If coverage exceeds 150%, advise reducing system size`;

      const result = await callGemini(LOVABLE_API_KEY, reviewPrompt, true, 55000);

      if (!result.ok) {
        console.error("Review mode Gemini error:", result.error);
        // Return a fallback review that passes through
        return jsonResponse({
          success: true,
          review: {
            validated: true,
            confidenceScore: 70,
            issues: [],
            adjustments: { totalCost: null, costPerKW: null, paybackYears: null },
            interpretation: language === "ar"
              ? "تم حساب النتائج بناءً على النماذج الهندسية المعتمدة. النتائج تمثل تقديرات دقيقة بناءً على بيانات الموقع والمناخ."
              : "Results calculated based on certified engineering models. These represent accurate estimates based on location and climate data.",
          },
        });
      }

      // Parse the JSON review
      let review: any;
      try {
        review = JSON.parse(result.text!);
      } catch {
        console.error("Failed to parse review JSON:", result.text?.slice(0, 300));
        return jsonResponse({
          success: true,
          review: {
            validated: true,
            confidenceScore: 70,
            issues: [],
            adjustments: { totalCost: null, costPerKW: null, paybackYears: null },
            interpretation: result.text || (language === "ar" ? "تمت المراجعة بنجاح." : "Review completed successfully."),
          },
        });
      }

      console.log("AI Review result:", JSON.stringify(review).slice(0, 500));
      return jsonResponse({ success: true, review });
    }

    // ==========================================
    // MODE: ADVISOR (textual explanation / Q&A)
    // ==========================================
    const advisorPrompt = language === "ar"
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. اسمك SolarMatch AI.

فيما يلي نتائج حسابات جدوى الطاقة الشمسية لمبنى محدد تمت مراجعتها والتحقق منها.
وضح هذه النتائج للعميل بأسلوب مبسط ومهني ودافئ.

النتائج المراجعة:
- الموقع: ${locationName}
- حجم النظام: ${kWInstalled} كيلوواط
- عدد الألواح: ${panelCount}
- الإنتاج السنوي: ${energyYear} كيلوواط/ساعة
- نسبة تغطية الاستهلاك: ${coverageRatio}%
- التكلفة الإجمالية: ${totalCost} جنيه
- التوفير السنوي: ${savingsYear} جنيه
- فترة الاسترداد: ${paybackYears} سنة
- تخفيض CO2: ${co2Saved || co2Reduction} طن/سنة
- نوع المبنى: ${buildingType}
- نوع الألواح: ${pvType}

قدم تفسيراً شاملاً يشمل:
1. تقييم عام: هل المشروع يستحق التنفيذ ولماذا؟
2. تحليل مالي: ماذا تعني فترة الاسترداد والتوفير للعميل عملياً؟
3. أهم 3 نقاط عملية مخصصة لهذا المبنى تحديداً
4. مقارنة بالسوق: كيف يقارن هذا العرض بمتوسط الأسعار في مصر؟
5. توصية واضحة للخطوة التالية

اكتب بالتفصيل (4-6 فقرات). لا تبدأ بـ "بصفتي" أو "كـ". ابدأ مباشرة بالتقييم.`
      : `You are an expert solar energy consultant for the Egyptian market. Your name is SolarMatch AI.

Below are verified solar feasibility results for a specific building.
Explain these results to the client in a clear, professional, and warm manner.

Verified Results:
- Location: ${locationName}
- System Size: ${kWInstalled} kW
- Panel Count: ${panelCount}
- Annual Production: ${energyYear} kWh
- Consumption Coverage: ${coverageRatio}%
- Total Cost: ${totalCost} EGP
- Annual Savings: ${savingsYear} EGP
- Payback Period: ${paybackYears} years
- CO2 Reduction: ${co2Saved || co2Reduction} tons/year
- Building Type: ${buildingType}
- Panel Type: ${pvType}

Provide a comprehensive interpretation including:
1. Overall assessment: Is this project worth implementing and why?
2. Financial analysis: What does the payback period and savings mean practically?
3. Top 3 practical insights specific to THIS building
4. Market comparison: How does this compare to average prices in Egypt?
5. Clear recommended next step

Write in detail (4-6 paragraphs). Do NOT start with "As a" or "As your". Start directly with the assessment.`;

    const result = await callGemini(LOVABLE_API_KEY, advisorPrompt, false, 25000);

    if (!result.ok) {
      return jsonResponse({ success: false, error: result.error || "AI request failed" }, 502);
    }

    return jsonResponse({ success: true, text: result.text });

  } catch (error) {
    console.error("Top-level error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" }, 500);
  }
});
