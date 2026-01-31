import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { solarData, language } = await req.json();

    const systemPrompt = language === 'ar' 
      ? `أنت مستشار طاقة شمسية خبير في السوق المصري. قم بتحليل بيانات النظام الشمسي المقدمة وقدم توصيات مخصصة.

قواعد التحليل:
1. إذا كانت نسبة التغطية أقل من 80%، اقترح زيادة مساحة الألواح أو الترقية لنوع أعلى كفاءة
2. إذا كانت فترة الاسترداد أكثر من 7 سنوات، اقترح خيارات توفير أو تمويل
3. قارن بين أنواع الألواح المختلفة وفائدة كل نوع
4. اذكر الفوائد البيئية بشكل ملموس

اجعل ردك:
- مختصراً (3-4 نقاط رئيسية)
- عملياً وقابلاً للتنفيذ
- بأسلوب ودود ومشجع
- استخدم الإيموجي للتوضيح`
      : `You are an expert solar energy consultant for the Egyptian market. Analyze the provided solar system data and give personalized recommendations.

Analysis rules:
1. If coverage ratio is below 80%, suggest increasing panel area or upgrading to higher efficiency type
2. If payback period exceeds 7 years, suggest cost-saving options or financing
3. Compare different panel types and their benefits
4. Mention environmental benefits in concrete terms

Keep your response:
- Brief (3-4 main points)
- Practical and actionable
- Friendly and encouraging
- Use emojis for clarity`;

    const userPrompt = language === 'ar'
      ? `بيانات النظام الشمسي:
- الموقع: ${solarData.locationName || 'غير محدد'}
- مساحة السطح: ${solarData.rooftopArea} م²
- القدرة المركبة: ${solarData.kWInstalled} كيلوواط
- الإنتاج السنوي: ${solarData.energyYear} كيلوواط/ساعة
- الاستهلاك الشهري: ${solarData.monthlyConsumption} كيلوواط/ساعة
- نسبة التغطية: ${solarData.coverageRatio}%
- نوع الألواح: ${solarData.pvType}
- نوع المبنى: ${solarData.buildingType}
- التكلفة الإجمالية: ${solarData.totalCost} جنيه
- التوفير السنوي: ${solarData.savingsYear} جنيه
- فترة الاسترداد: ${solarData.paybackYears} سنة
- تقليل CO2: ${solarData.co2Reduction} كجم/سنة

قدم تحليلاً مختصراً وتوصيات عملية لهذا المستخدم.`
      : `Solar System Data:
- Location: ${solarData.locationName || 'Not specified'}
- Rooftop Area: ${solarData.rooftopArea} m²
- Installed Capacity: ${solarData.kWInstalled} kW
- Annual Production: ${solarData.energyYear} kWh
- Monthly Consumption: ${solarData.monthlyConsumption} kWh
- Coverage Ratio: ${solarData.coverageRatio}%
- Panel Type: ${solarData.pvType}
- Building Type: ${solarData.buildingType}
- Total Cost: ${solarData.totalCost} EGP
- Annual Savings: ${solarData.savingsYear} EGP
- Payback Period: ${solarData.paybackYears} years
- CO2 Reduction: ${solarData.co2Reduction} kg/year

Provide a brief analysis and practical recommendations for this user.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Solar advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
