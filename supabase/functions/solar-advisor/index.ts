import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_REQUESTS) return false;
  record.count++;
  return true;
}

function validateSolarData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid solar data' };
  const d = data as Record<string, unknown>;
  const numericFields = ['rooftopArea', 'kWInstalled', 'energyYear', 'monthlyConsumption',
    'coverageRatio', 'totalCost', 'savingsYear', 'paybackYears', 'co2Reduction'];
  for (const field of numericFields) {
    if (typeof d[field] !== 'number' || !isFinite(d[field] as number)) {
      return { valid: false, error: `Invalid ${field}: must be a valid number` };
    }
  }
  if ((d.rooftopArea as number) <= 0 || (d.rooftopArea as number) > 1000000) return { valid: false, error: 'Rooftop area out of range' };
  if ((d.kWInstalled as number) <= 0 || (d.kWInstalled as number) > 10000) return { valid: false, error: 'kW installed out of range' };
  if (typeof d.pvType !== 'string') return { valid: false, error: 'Invalid pvType' };
  if (typeof d.buildingType !== 'string') return { valid: false, error: 'Invalid buildingType' };
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let body: unknown;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { solarData, language } = body as { solarData: unknown; language: unknown };
    if (language !== 'en' && language !== 'ar') {
      return new Response(JSON.stringify({ error: "Invalid language parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validation = validateSolarData(solarData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const d = solarData as Record<string, unknown>;

    const systemPrompt = language === 'ar'
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. حلل بيانات النظام الشمسي وقدم توصيات مخصصة ومفصلة.

قواعد التحليل:
1. إذا كانت نسبة التغطية أقل من 80%، اقترح زيادة مساحة الألواح أو الترقية لنوع أعلى كفاءة
2. إذا كانت فترة الاسترداد أكثر من 7 سنوات، اقترح خيارات توفير أو تمويل
3. قارن بين أنواع الألواح المختلفة وفائدة كل نوع
4. اذكر الفوائد البيئية بشكل ملموس (مثلاً: زراعة أشجار مكافئة)
5. قدم نصائح عن أفضل وقت للتركيب وصيانة الألواح في مصر
6. اذكر معلومات عن دعم الحكومة المصرية للطاقة الشمسية إن وجد

اجعل ردك:
- مفصلاً (5-7 نقاط رئيسية)
- عملياً وقابلاً للتنفيذ
- بأسلوب ودود ومشجع
- استخدم الإيموجي للتوضيح
- اذكر أرقام محددة من البيانات المقدمة`
      : `You are an expert solar energy consultant for the Egyptian market. Analyze the provided solar system data and give detailed, personalized recommendations.

Analysis rules:
1. If coverage ratio is below 80%, suggest increasing panel area or upgrading to higher efficiency type
2. If payback period exceeds 7 years, suggest cost-saving options or financing
3. Compare different panel types and their benefits for this specific case
4. Mention environmental benefits in concrete terms (e.g., equivalent trees planted)
5. Provide tips about best installation timing and panel maintenance in Egypt
6. Mention Egyptian government solar incentives if applicable

Keep your response:
- Detailed (5-7 main points)
- Practical and actionable
- Friendly and encouraging
- Use emojis for clarity
- Reference specific numbers from the provided data`;

    const userPrompt = language === 'ar'
      ? `بيانات النظام الشمسي:
- الموقع: ${d.locationName || 'غير محدد'}
- مساحة السطح: ${d.rooftopArea} م²
- القدرة المركبة: ${d.kWInstalled} كيلوواط
- الإنتاج السنوي: ${d.energyYear} كيلوواط/ساعة
- الاستهلاك الشهري: ${d.monthlyConsumption} كيلوواط/ساعة
- نسبة التغطية: ${d.coverageRatio}%
- نوع الألواح: ${d.pvType}
- نوع المبنى: ${d.buildingType}
- التكلفة الإجمالية: ${d.totalCost} جنيه
- التوفير السنوي: ${d.savingsYear} جنيه
- فترة الاسترداد: ${d.paybackYears} سنة
- تقليل CO2: ${d.co2Reduction} كجم/سنة

قدم تحليلاً مفصلاً وتوصيات عملية لهذا المستخدم.`
      : `Solar System Data:
- Location: ${d.locationName || 'Not specified'}
- Rooftop Area: ${d.rooftopArea} m²
- Installed Capacity: ${d.kWInstalled} kW
- Annual Production: ${d.energyYear} kWh
- Monthly Consumption: ${d.monthlyConsumption} kWh
- Coverage Ratio: ${d.coverageRatio}%
- Panel Type: ${d.pvType}
- Building Type: ${d.buildingType}
- Total Cost: ${d.totalCost} EGP
- Annual Savings: ${d.savingsYear} EGP
- Payback Period: ${d.paybackYears} years
- CO2 Reduction: ${d.co2Reduction} kg/year

Provide a detailed analysis and practical recommendations for this user.`;

    // Call Gemini API directly
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
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

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Convert to OpenAI-compatible format
                const openaiChunk = {
                  choices: [{ delta: { content: text }, index: 0 }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Solar advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
