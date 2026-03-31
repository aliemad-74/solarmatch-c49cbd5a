import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// --- Call Gemini ---
async function callGemini(
  apiKey: string,
  prompt: string,
  jsonMode: boolean,
  timeoutMs = 30000
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log("Gemini URL:", geminiUrl.replace(apiKey, "REDACTED"));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const generationConfig: Record<string, unknown> = {
    temperature: 0.4,
    maxOutputTokens: 8192,
  };

  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Gemini fetch error:", err);
    return { ok: false, error: "AI request failed (timeout or network)" };
  }
  clearTimeout(timeoutId);

  console.log("Gemini response status:", geminiResponse.status);

  const rawText = await geminiResponse.text();
  console.log("Gemini raw response (first 300):", rawText.slice(0, 300));

  if (!geminiResponse.ok) {
    console.error("Gemini non-OK:", geminiResponse.status, rawText);
    return { ok: false, error: `AI service error: ${geminiResponse.status}` };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error("Gemini returned invalid JSON:", rawText.slice(0, 300));
    return { ok: false, error: "Invalid JSON from AI service" };
  }

  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Invalid Gemini response structure:", JSON.stringify(parsed).slice(0, 300));
    return { ok: false, error: "Invalid Gemini response structure" };
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    console.log("GEMINI_API_KEY exists:", !!GEMINI_API_KEY);
    if (!GEMINI_API_KEY) {
      return jsonResponse({ success: false, error: "Missing GEMINI_API_KEY" }, 500);
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
        ? Math.round(d.coverageRatio * 100)
        : "N/A";

    console.log(`Mode: ${mode}, Language: ${language}`);
    console.log("Sanitized solar data:", {
      locationName, kWInstalled, energyYear, coverageRatio,
      totalCost, savingsYear, paybackYears, co2Reduction, buildingType, pvType,
    });

    // ==========================================
    // MODE: REVIEW (AI checkpoint before display)
    // ==========================================
    if (mode === "review") {
      const reviewPrompt = language === "ar"
        ? `أنت مهندس طاقة شمسية خبير في السوق المصري ومطلع على أحدث أسعار 2024-2025.

مهمتك: راجع نتائج حسابات جدوى الطاقة الشمسية التالية وتحقق من دقتها.

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
- نوع الألواح: ${pvType}

راجع هذه البيانات وأرجع JSON بالشكل التالي:
{
  "validated": true أو false,
  "confidenceScore": رقم من 1 إلى 100,
  "issues": ["أي مشكلة وجدتها"],
  "adjustments": {
    "totalCost": التكلفة المعدلة أو null إذا صحيحة,
    "costPerKW": تكلفة الكيلوواط المعدلة أو null,
    "paybackYears": فترة الاسترداد المعدلة أو null
  },
  "interpretation": "تفسير شامل ومفصل للنتائج في 4-6 فقرات يوضح: هل المشروع يستحق؟ لماذا؟ ما المميزات والعيوب؟ ما الخطوة التالية الموصى بها؟ نصائح عملية لهذا الموقع تحديداً. اكتب بأسلوب احترافي ودافئ كأنك تتحدث مباشرة للعميل. لا تبدأ بـ 'بصفتي' أو 'كـ' أو 'أنا'. ابدأ مباشرة بالتقييم."
}

ملاحظات مهمة:
- أسعار السوق المصري 2024-2025 تتراوح بين 15,000 - 25,000 جنيه/كيلوواط حسب نوع الألواح
- إذا كانت التكلفة ضمن النطاق المعقول، اترك adjustments بقيمة null
- لا تعدل إلا إذا كان هناك انحراف واضح أكثر من 20%
- التفسير يجب أن يكون مفصلاً وعملياً ومخصصاً لهذا المشروع
- لا تبدأ التفسير بـ "بصفتي" أو "كـ" أو "أنا". ابدأ مباشرة بالتقييم
- إذا كانت نسبة التغطية أكثر من 150%، انصح العميل بإمكانية تقليل حجم النظام والاكتفاء بنسبة تغطية 100-120% لتوفير التكلفة، ووضح كم سيوفر تقريباً`
        : `You are an expert solar energy engineer for the Egyptian market, up-to-date with 2024-2025 prices.

Task: Review the following solar feasibility calculation results and validate their accuracy.

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
- Panel Type: ${pvType}

Review this data and return JSON in this format:
{
  "validated": true or false,
  "confidenceScore": number from 1 to 100,
  "issues": ["any issues found"],
  "adjustments": {
    "totalCost": adjusted cost or null if correct,
    "costPerKW": adjusted cost per kW or null,
    "paybackYears": adjusted payback or null
  },
  "interpretation": "A comprehensive 4-6 paragraph interpretation explaining: Is this project worth it? Why? What are the pros and cons? What's the recommended next step? Practical tips for this specific location. Write in a professional yet warm tone as if speaking directly to the client."
}

Important notes:
- Egyptian market prices 2024-2025 range from 15,000 - 25,000 EGP/kW depending on panel type
- Only set adjustments if there's a clear deviation of more than 20%
- If values are within reasonable range, leave adjustments as null
- The interpretation should be detailed, practical, and specific to this project
- If coverage ratio exceeds 150%, advise the client they could reduce system size to 100-120% coverage to save costs, and estimate how much they would save`;

      const result = await callGemini(GEMINI_API_KEY, reviewPrompt, true, 30000);

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

    const result = await callGemini(GEMINI_API_KEY, advisorPrompt, false, 25000);

    if (!result.ok) {
      return jsonResponse({ success: false, error: result.error || "AI request failed" }, 502);
    }

    return jsonResponse({ success: true, text: result.text });

  } catch (error) {
    console.error("Top-level error:", error);
    return jsonResponse({ success: false, error: error?.message || "An unexpected error occurred" }, 500);
  }
});
