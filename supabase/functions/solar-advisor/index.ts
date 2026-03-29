import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { solarData, language, mode } = body as {
      solarData: Record<string, unknown>;
      language: string;
      mode?: "advice" | "calculate";
    };

    if (language !== "en" && language !== "ar") {
      return new Response(JSON.stringify({ error: "Invalid language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const d = solarData;

    // ===== MODE: AI CALCULATION =====
    if (mode === "calculate") {
      const calcPrompt = language === "ar"
        ? `أنت خبير طاقة شمسية ومهندس حسابات. لديك بيانات مبنى محدد في مصر وتحتاج تقوم بتحليل شامل ودقيق.

بيانات المبنى:
- الموقع: ${d.locationName || "غير محدد"} (خط عرض: ${d.lat}, خط طول: ${d.lng})
- مساحة السطح الكلية: ${d.rooftopArea} م²
- نوع المبنى: ${d.buildingType}
- الاستهلاك الشهري: ${d.monthlyConsumption} كيلوواط/ساعة
- سعر الكهرباء: ${d.electricityPrice} جنيه/كيلوواط
- نوع الألواح المختار: ${d.pvType}
- سيناريو التكلفة: ${d.costScenario}
${d.googleSolarData ? `
بيانات Google Solar (بيانات أقمار صناعية فعلية):
- أقصى مساحة للألواح: ${(d.googleSolarData as any).maxArrayAreaMeters2} م²
- ساعات الشمس السنوية: ${(d.googleSolarData as any).maxSunshineHoursPerYear} ساعة
- أقصى عدد ألواح: ${(d.googleSolarData as any).maxArrayPanelsCount}
- قدرة اللوح: ${(d.googleSolarData as any).panelCapacityWatts} واط
` : ""}
${d.climateData ? `
بيانات المناخ (NASA POWER):
- متوسط الإشعاع الشمسي السنوي: ${(d.climateData as any).annualAvgIrradiance} كيلوواط/م²/يوم
- الإشعاع الشهري: ${JSON.stringify((d.climateData as any).monthlyIrradiance)}
- درجات الحرارة الشهرية: ${JSON.stringify((d.climateData as any).monthlyTemperature)}
` : ""}

المطلوب:
قم بتحليل هذا المبنى تحديداً وقدم:

1. **تقييم السطح**: هل هذا السطح مناسب للطاقة الشمسية؟ (ممتاز/جيد/مقبول/غير مناسب) مع السبب
2. **الحجم الأمثل للنظام**: كم كيلوواط يُنصح بتركيبه لهذا المبنى تحديداً ولماذا
3. **التكلفة المتوقعة**: التكلفة الإجمالية بالجنيه المصري مع تفصيل (ألواح، عاكس، تركيب، كابلات)
4. **الإنتاج المتوقع**: الإنتاج السنوي والشهري بناءً على بيانات المناخ الفعلية للموقع
5. **التوفير**: التوفير السنوي والشهري بالجنيه
6. **فترة الاسترداد**: كم سنة لاسترداد التكلفة
7. **نسبة التغطية**: نسبة تغطية الاستهلاك
8. **توصيات خاصة**: نصائح مخصصة لهذا المبنى (اتجاه الألواح، صيانة، تمويل)
9. **مقارنة الباقات**: قارن بين 3 خيارات (اقتصادي/قياسي/ممتاز) مع التكلفة والكفاءة لكل واحد
10. **الأثر البيئي**: تقليل CO2 وما يعادله من أشجار

استخدم أرقام واقعية للسوق المصري 2024-2025. لا تكرر البيانات المدخلة فقط، بل قدم تحليلاً حقيقياً.`

        : `You are an expert solar energy engineer and calculator. You have specific building data from Egypt and need to perform a comprehensive, precise analysis.

Building Data:
- Location: ${d.locationName || "Not specified"} (lat: ${d.lat}, lng: ${d.lng})
- Total Rooftop Area: ${d.rooftopArea} m²
- Building Type: ${d.buildingType}
- Monthly Consumption: ${d.monthlyConsumption} kWh
- Electricity Price: ${d.electricityPrice} EGP/kWh
- Selected Panel Type: ${d.pvType}
- Cost Scenario: ${d.costScenario}
${d.googleSolarData ? `
Google Solar Data (actual satellite data):
- Max Array Area: ${(d.googleSolarData as any).maxArrayAreaMeters2} m²
- Annual Sunshine Hours: ${(d.googleSolarData as any).maxSunshineHoursPerYear} hrs
- Max Panel Count: ${(d.googleSolarData as any).maxArrayPanelsCount}
- Panel Capacity: ${(d.googleSolarData as any).panelCapacityWatts} W
` : ""}
${d.climateData ? `
Climate Data (NASA POWER):
- Annual Avg Irradiance: ${(d.climateData as any).annualAvgIrradiance} kWh/m²/day
- Monthly Irradiance: ${JSON.stringify((d.climateData as any).monthlyIrradiance)}
- Monthly Temperatures: ${JSON.stringify((d.climateData as any).monthlyTemperature)}
` : ""}

Required Analysis:
Analyze THIS specific building and provide:

1. **Rooftop Assessment**: Is this rooftop suitable for solar? (Excellent/Good/Fair/Not suitable) with reasoning
2. **Optimal System Size**: How many kW recommended for THIS building specifically and why
3. **Expected Cost**: Total cost in EGP with breakdown (panels, inverter, installation, cables)
4. **Expected Production**: Annual and monthly production based on actual climate data for this location
5. **Savings**: Annual and monthly savings in EGP
6. **Payback Period**: Years to recover investment
7. **Coverage Ratio**: Percentage of consumption covered
8. **Custom Recommendations**: Tips specific to this building (panel orientation, maintenance, financing)
9. **Package Comparison**: Compare 3 options (Economy/Standard/Premium) with cost and efficiency for each
10. **Environmental Impact**: CO2 reduction and equivalent trees

Use realistic numbers for Egyptian market 2024-2025. Don't just repeat input data - provide actual analysis.`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: calcPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Transform Gemini SSE to OpenAI-compatible SSE
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
                  const openaiChunk = { choices: [{ delta: { content: text }, index: 0 }] };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ===== MODE: ADVICE (post-calculation advice) =====
    const systemPrompt = language === "ar"
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. هذا المستخدم عنده نظام شمسي محسوب بالفعل. 
قدم توصيات عملية ومخصصة بناءً على بياناته المحددة.

قواعد مهمة:
- لا تكرر الأرقام فقط. حلل واشرح ماذا تعني.
- إذا نسبة التغطية < 80%: اقترح حلول محددة (ترقية ألواح، زيادة مساحة)
- إذا فترة الاسترداد > 7 سنوات: اقترح خيارات تمويل أو تقليل تكاليف
- قارن وضعه الحالي بالمثالي
- اذكر برامج دعم حكومية إن وجدت
- اذكر أفضل وقت للتركيب في مصر
- قدم 5-7 نقاط عملية مختلفة`
      : `You are an expert solar energy consultant for the Egyptian market. This user already has calculated solar system data.
Provide practical, personalized recommendations based on their specific data.

Important rules:
- Don't just repeat numbers. Analyze and explain what they mean.
- If coverage < 80%: suggest specific solutions (upgrade panels, increase area)
- If payback > 7 years: suggest financing or cost reduction options
- Compare their current setup to the ideal
- Mention government support programs if available
- Mention best installation timing in Egypt
- Provide 5-7 distinct practical points`;

    const userPrompt = language === "ar"
      ? `بيانات النظام الشمسي لهذا المبنى المحدد:
- الموقع: ${d.locationName || "غير محدد"}
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

حلل هذا النظام وقدم توصيات عملية ومفصلة خاصة بهذا المبنى. لا تعيد سرد الأرقام فقط.`
      : `Solar system data for this specific building:
- Location: ${d.locationName || "Not specified"}
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

Analyze this system and provide practical, detailed recommendations specific to this building. Don't just restate the numbers.`;

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
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE to OpenAI-compatible SSE
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
                const openaiChunk = { choices: [{ delta: { content: text }, index: 0 }] };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch { /* skip */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
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
