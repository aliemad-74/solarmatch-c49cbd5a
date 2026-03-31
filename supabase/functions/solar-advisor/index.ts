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

// --- JSON response helpers ---
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // Validate language
    const language = (body.language as string) === "ar" ? "ar" : "en";

    // Validate solarData
    const d = (body.solarData as Record<string, unknown>) || {};
    if (!d || Object.keys(d).length === 0) {
      return jsonResponse({ success: false, error: "Missing solarData" }, 400);
    }

    // Build prompt (kept exactly as-is)
    const prompt = language === "ar"
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. 
فيما يلي نتائج حسابات جدوى الطاقة الشمسية لمبنى محدد. 
قيّم هذه النتائج وفسرها باختصار.

النتائج المحسوبة:
- الموقع: ${d?.locationName || "غير محدد"}
- حجم النظام: ${d?.kWInstalled ?? "غير محدد"} كيلوواط
- الإنتاج السنوي: ${d?.energyYear ?? "غير محدد"} كيلوواط/ساعة
- نسبة تغطية الاستهلاك: ${d?.coverageRatio != null ? Math.round((d.coverageRatio as number) * 100) : "غير محدد"}%
- التكلفة الإجمالية: ${d?.totalCost ?? "غير محدد"} جنيه
- التوفير السنوي: ${d?.savingsYear ?? "غير محدد"} جنيه
- فترة الاسترداد: ${d?.paybackYears ?? "غير محدد"} سنة
- تخفيض CO2: ${d?.co2Reduction ?? "غير محدد"} كجم/سنة
- نوع المبنى: ${d?.buildingType ?? "غير محدد"}
- نوع الألواح: ${d?.pvType ?? "غير محدد"}

قدم:
1. جملة واحدة: هل يستحق التركيب؟ (بناءً على فترة الاسترداد ونسبة التغطية)
2. أهم 3 نقاط عملية مخصصة لهذا المبنى تحديداً
3. توصية واحدة للخطوة التالية

اكتب بإيجاز. لا تكرر الأرقام المذكورة أعلاه. ركز على التفسير والنصيحة.`
      : `You are a solar energy expert for the Egyptian market.
Below are pre-calculated solar feasibility results for a specific building.
Interpret these results briefly and provide actionable insights.

Calculated Results:
- Location: ${d?.locationName || "Not specified"}
- System Size: ${d?.kWInstalled ?? "N/A"} kW
- Annual Production: ${d?.energyYear ?? "N/A"} kWh
- Consumption Coverage: ${d?.coverageRatio != null ? Math.round((d.coverageRatio as number) * 100) : "N/A"}%
- Total Cost: ${d?.totalCost ?? "N/A"} EGP
- Annual Savings: ${d?.savingsYear ?? "N/A"} EGP
- Payback Period: ${d?.paybackYears ?? "N/A"} years
- CO2 Reduction: ${d?.co2Reduction ?? "N/A"} kg/year
- Building Type: ${d?.buildingType ?? "N/A"}
- Panel Type: ${d?.pvType ?? "N/A"}

Provide:
1. One sentence verdict: is this worth installing? (based on payback and coverage)
2. Top 3 practical insights specific to THIS building
3. One recommended next step

Be concise. Do not repeat the numbers above. Focus on interpretation and advice.`;

    // --- Single Gemini call ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`;
    console.log("Gemini URL:", geminiUrl.replace(GEMINI_API_KEY, "REDACTED"));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Gemini fetch error:", err);
      return jsonResponse({ success: false, error: "AI request failed (timeout or network)" }, 503);
    }
    clearTimeout(timeoutId);

    console.log("Gemini response status:", geminiResponse.status);

    // Read raw text
    const rawText = await geminiResponse.text();
    console.log("Gemini raw response (first 200):", rawText.slice(0, 200));

    // Handle non-200
    if (!geminiResponse.ok) {
      console.error("Gemini non-OK:", geminiResponse.status, rawText);
      return jsonResponse({
        success: false,
        error: `AI service error: ${geminiResponse.status}`,
        details: rawText,
      }, 502);
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Gemini returned invalid JSON:", rawText.slice(0, 300));
      return jsonResponse({ success: false, error: "Invalid JSON from AI service" }, 502);
    }

    console.log("Parsed Gemini response:", JSON.stringify(parsed).slice(0, 300));

    // Extract text safely
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Invalid Gemini response structure:", JSON.stringify(parsed).slice(0, 300));
      return jsonResponse({ success: false, error: "Invalid Gemini response structure" }, 502);
    }

    // Success
    return jsonResponse({ success: true, text });

  } catch (error) {
    console.error("Top-level error:", error);
    return jsonResponse({ success: false, error: error?.message || "An unexpected error occurred" }, 500);
  }
});
