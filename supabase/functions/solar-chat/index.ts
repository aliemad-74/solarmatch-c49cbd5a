import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, solarContext, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isAr = language === "ar";

    let contextBlock = "";
    if (solarContext) {
      contextBlock = isAr
        ? `\n\nبيانات التقرير الحالي للمستخدم:
- الموقع: ${solarContext.locationName || "غير محدد"}
- حجم النظام: ${solarContext.systemSize || "غير محدد"} كيلووات
- الإنتاج السنوي: ${solarContext.annualProduction || "غير محدد"} كيلووات ساعة
- التكلفة الإجمالية: ${solarContext.totalCost || "غير محدد"} جنيه
- التوفير السنوي: ${solarContext.annualSavings || "غير محدد"} جنيه
- فترة الاسترداد: ${solarContext.paybackYears || "غير محدد"} سنة
- نسبة التغطية: ${solarContext.coverageRatio || "غير محدد"}%
- خفض CO2: ${solarContext.co2Saved || "غير محدد"} طن
- نوع الألواح: ${solarContext.pvType || "غير محدد"}
- نوع المبنى: ${solarContext.buildingType || "غير محدد"}
- الاستهلاك الشهري: ${solarContext.monthlyConsumption || "غير محدد"} كيلووات ساعة

استخدم هذه البيانات للإجابة على أسئلة المستخدم بدقة.`
        : `\n\nUser's current report data:
- Location: ${solarContext.locationName || "N/A"}
- System size: ${solarContext.systemSize || "N/A"} kW
- Annual production: ${solarContext.annualProduction || "N/A"} kWh
- Total cost: ${solarContext.totalCost || "N/A"} EGP
- Annual savings: ${solarContext.annualSavings || "N/A"} EGP
- Payback period: ${solarContext.paybackYears || "N/A"} years
- Coverage ratio: ${solarContext.coverageRatio || "N/A"}%
- CO2 reduction: ${solarContext.co2Saved || "N/A"} tons
- PV type: ${solarContext.pvType || "N/A"}
- Building type: ${solarContext.buildingType || "N/A"}
- Monthly consumption: ${solarContext.monthlyConsumption || "N/A"} kWh

Use this data to answer user questions accurately.`;
    }

    const systemPrompt = isAr
      ? `أنت مستشار طاقة شمسية خبير متخصص في السوق المصري. أجب بإيجاز ودقة. لا تبدأ بـ "بصفتي" أو "كـ". ابدأ مباشرة بالإجابة. استخدم الأرقام والبيانات الحقيقية عند الإمكان. أجب باللغة العربية.${contextBlock}`
      : `You are an expert solar energy advisor specialized in the Egyptian market. Answer concisely and accurately. Start directly with the answer. Use real numbers and data when possible. Answer in English.${contextBlock}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("solar-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
