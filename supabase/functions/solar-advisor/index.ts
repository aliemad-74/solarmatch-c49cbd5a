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
      mode?: "advice" | "report";
    };

    if (language !== "en" && language !== "ar") {
      return new Response(JSON.stringify({ error: "Invalid language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const d = solarData;

    // ===== MODE: AI REPORT (structured JSON calculation) =====
    if (mode === "report") {
      const reportPrompt = `You are an expert solar energy engineer performing calculations for a building in Egypt.
You MUST return a JSON object with precise numerical calculations based on the input data.

INPUT DATA:
- Location: ${d.locationName || "Not specified"} (lat: ${d.lat}, lng: ${d.lng})
- Total Rooftop Area: ${d.rooftopArea} m²
- Building Type: ${d.buildingType} (usable fraction: ${d.usableFraction})
- Monthly Consumption: ${d.monthlyConsumption} kWh
- Electricity Price: ${d.electricityPrice} EGP/kWh
- Selected PV Type: ${d.pvType}
- Cost Scenario: ${d.costScenario}
${d.climateData ? `
CLIMATE DATA (NASA POWER):
- Annual Avg Irradiance: ${(d.climateData as any).annualAvgIrradiance} kWh/m²/day
- Monthly Irradiance: ${JSON.stringify((d.climateData as any).monthlyIrradiance)}
- Monthly Temperature: ${JSON.stringify((d.climateData as any).monthlyTemperature)}
` : ""}

SYSTEM PACKAGES for Egyptian market 2024-2025:
- economy: Polycrystalline 16%, 8.5 m²/kW, 15,000 EGP/kW, ~350W panels
- standard: Standard Mono 18%, 7 m²/kW, 19,000 EGP/kW, ~450W panels  
- premium: High-Power Mono 20%+, 6 m²/kW, 26,000 EGP/kW, ~600W panels

CALCULATION RULES:
1. Usable area = rooftop area × usable fraction (residential house=0.50, apartment=0.60, commercial=0.70, industrial=0.75, agricultural=0.85)
2. kWMax = usable area / areaPerKW of selected package
3. kWInstalled = floor(kWMax × 0.95), minimum 1 kW
4. For residential (house/apartment): enforce 150% coverage cap. If (kWInstalled × 1800) > (monthlyConsumption × 12 × 1.5), reduce kWInstalled
5. energyYear = kWInstalled × specific_yield (use ~1800 kWh/kW/year for Egypt, adjust based on irradiance data)
6. Monthly production: distribute based on monthly irradiance ratios. If no data, use typical Egypt pattern
7. savingsYear = energyYear × electricityPrice (capped at actual consumption cost)
8. totalCost = kWInstalled × costPerKW
9. paybackYears = totalCost / savingsYear
10. coverageRatio = energyYear / (monthlyConsumption × 12)
11. co2Saved = energyYear × 0.55 / 1000 (tons/year)
12. panelCount = ceil(kWInstalled × 1000 / panelWattage)
13. Calculate ALL THREE package options with their respective costs and payback

WARNINGS to include (as string array):
- If system > 15kW for residential: "Large residential system (>15kW) - verify actual consumption"
- If payback > 12 years: "Long payback period - consider alternative financing"
- If coverage < 30%: "Low coverage ratio - consider larger installation area"
- If rooftop area < 10: "Very small rooftop area"

Return ONLY valid JSON. Be precise with numbers. Use realistic Egyptian market data.`;

      const toolSchema = {
        name: "solar_report",
        description: "Return structured solar feasibility calculation results",
        parameters: {
          type: "object",
          properties: {
            usableArea: { type: "number", description: "Usable rooftop area in m²" },
            kWMax: { type: "number", description: "Maximum installable kW" },
            kWInstalled: { type: "number", description: "Practical installed kW" },
            energyYear: { type: "number", description: "Annual energy production kWh" },
            energyMonth: { type: "number", description: "Average monthly production kWh" },
            monthlyProduction: { type: "array", items: { type: "number" }, description: "12 monthly production values in kWh" },
            savingsYear: { type: "number", description: "Annual savings in EGP" },
            savingsMonth: { type: "number", description: "Monthly savings in EGP" },
            totalCost: { type: "number", description: "Total system cost in EGP" },
            costPerKW: { type: "number", description: "Cost per kW in EGP" },
            paybackYears: { type: "number", description: "Payback period in years" },
            coverageRatio: { type: "number", description: "Coverage ratio as decimal (e.g. 0.85)" },
            co2Saved: { type: "number", description: "CO2 saved in tons/year" },
            panelCount: { type: "integer", description: "Number of panels" },
            panelWattage: { type: "integer", description: "Wattage per panel" },
            connectionRecommendation: {
              type: "object",
              properties: {
                systemType: { type: "string", enum: ["Grid-Connected", "Hybrid (Grid + Battery)", "Off-grid possible"] },
                reason: { type: "string" },
                icon: { type: "string", enum: ["grid", "hybrid", "offgrid"] }
              },
              required: ["systemType", "reason", "icon"]
            },
            packageOptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  packageKey: { type: "string", enum: ["economy", "standard", "premium"] },
                  kWInstalled: { type: "number" },
                  totalCost: { type: "number" },
                  energyYear: { type: "number" },
                  savingsYear: { type: "number" },
                  paybackYears: { type: "number" },
                  coverageRatio: { type: "number" },
                  panelCount: { type: "integer" }
                },
                required: ["packageKey", "kWInstalled", "totalCost", "energyYear", "savingsYear", "paybackYears", "coverageRatio", "panelCount"]
              },
              description: "All 3 package options calculated"
            },
            warnings: { type: "array", items: { type: "string" }, description: "Warning messages" },
          },
          required: ["usableArea", "kWMax", "kWInstalled", "energyYear", "energyMonth", "monthlyProduction", "savingsYear", "savingsMonth", "totalCost", "costPerKW", "paybackYears", "coverageRatio", "co2Saved", "panelCount", "panelWattage", "connectionRecommendation", "packageOptions", "warnings"]
        }
      };

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      const reportController = new AbortController();
      const reportTimeoutId = setTimeout(() => reportController.abort(), 25000);

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: reportController.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: reportPrompt }] }],
          tools: [{ functionDeclarations: [toolSchema] }],
          toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["solar_report"] } },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
          },
        }),
      });

      clearTimeout(reportTimeoutId);

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

      const result = await response.json();
      const functionCall = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      
      if (!functionCall || functionCall.name !== "solar_report") {
        console.error("Unexpected Gemini response:", JSON.stringify(result));
        return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const reportData = functionCall.args;

      // Ensure monthlyProduction has exactly 12 values
      if (!reportData.monthlyProduction || reportData.monthlyProduction.length !== 12) {
        const avgMonthly = reportData.energyYear / 12;
        reportData.monthlyProduction = [0.85, 0.90, 1.0, 1.05, 1.1, 1.15, 1.15, 1.1, 1.05, 0.95, 0.85, 0.85].map(f => Math.round(avgMonthly * f));
      }

      return new Response(JSON.stringify(reportData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== MODE: ADVICE (post-calculation streaming advice) =====
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const adviceController = new AbortController();
    const adviceTimeoutId = setTimeout(() => adviceController.abort(), 25000);

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: adviceController.signal,
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

    clearTimeout(adviceTimeoutId);

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
                const chunk = { choices: [{ delta: { content: text }, index: 0 }] };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
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
    console.error("Solar advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
