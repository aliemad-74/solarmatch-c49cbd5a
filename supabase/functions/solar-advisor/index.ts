import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const language = (body.language as string) === "ar" ? "ar" : "en";
    const d = body.solarData as Record<string, unknown>;

    const prompt = language === "ar"
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. 
فيما يلي نتائج حسابات جدوى الطاقة الشمسية لمبنى محدد. 
قيّم هذه النتائج وفسرها باختصار.

النتائج المحسوبة:
- الموقع: ${d.locationName || "غير محدد"}
- حجم النظام: ${d.kWInstalled} كيلوواط
- الإنتاج السنوي: ${d.energyYear} كيلوواط/ساعة
- نسبة تغطية الاستهلاك: ${Math.round((d.coverageRatio as number) * 100)}%
- التكلفة الإجمالية: ${d.totalCost} جنيه
- التوفير السنوي: ${d.savingsYear} جنيه
- فترة الاسترداد: ${d.paybackYears} سنة
- تخفيض CO2: ${d.co2Reduction} كجم/سنة
- نوع المبنى: ${d.buildingType}
- نوع الألواح: ${d.pvType}

قدم:
1. جملة واحدة: هل يستحق التركيب؟ (بناءً على فترة الاسترداد ونسبة التغطية)
2. أهم 3 نقاط عملية مخصصة لهذا المبنى تحديداً
3. توصية واحدة للخطوة التالية

اكتب بإيجاز. لا تكرر الأرقام المذكورة أعلاه. ركز على التفسير والنصيحة.`
      : `You are a solar energy expert for the Egyptian market.
Below are pre-calculated solar feasibility results for a specific building.
Interpret these results briefly and provide actionable insights.

Calculated Results:
- Location: ${d.locationName || "Not specified"}
- System Size: ${d.kWInstalled} kW
- Annual Production: ${d.energyYear} kWh
- Consumption Coverage: ${Math.round((d.coverageRatio as number) * 100)}%
- Total Cost: ${d.totalCost} EGP
- Annual Savings: ${d.savingsYear} EGP
- Payback Period: ${d.paybackYears} years
- CO2 Reduction: ${d.co2Reduction} kg/year
- Building Type: ${d.buildingType}
- Panel Type: ${d.pvType}

Provide:
1. One sentence verdict: is this worth installing? (based on payback and coverage)
2. Top 3 practical insights specific to THIS building
3. One recommended next step

Be concise. Do not repeat the numbers above. Focus on interpretation and advice.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response: Response;
    try {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ error: "AI request timed out" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text }, index: 0 }],
                };
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
              }
            } catch {
              continue;
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        try { await writer.close(); } catch {}
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
