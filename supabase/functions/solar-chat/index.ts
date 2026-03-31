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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { messages, solarContext, language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with solar context
    const contextBlock = solarContext
      ? `
## Current Solar Report Data
- Location: ${solarContext.locationName || "Unknown"}
- System Size: ${solarContext.kWInstalled || "N/A"} kW
- Annual Production: ${solarContext.energyYear || "N/A"} kWh
- Monthly Consumption: ${solarContext.monthlyConsumption || "N/A"} kWh
- Coverage Ratio: ${solarContext.coverageRatio ? (solarContext.coverageRatio * 100).toFixed(0) + "%" : "N/A"}
- Total Cost: ${solarContext.totalCost ? solarContext.totalCost.toLocaleString() + " EGP" : "N/A"}
- Annual Savings: ${solarContext.savingsYear ? solarContext.savingsYear.toLocaleString() + " EGP" : "N/A"}
- Payback Period: ${solarContext.paybackYears || "N/A"} years
- CO₂ Reduction: ${solarContext.co2Saved || "N/A"} tons/year
- PV Type: ${solarContext.pvType || "N/A"}
- Building Type: ${solarContext.buildingType || "N/A"}
- Panel Count: ${solarContext.panelCount || "N/A"}
- Usable Area: ${solarContext.usableArea || "N/A"} m²
`
      : "\nNo solar report data available. Answer general solar energy questions for the Egyptian market.\n";

    const systemPrompt =
      language === "ar"
        ? `أنت مستشار طاقة شمسية متخصص في السوق المصري. أجب على أسئلة المستخدم بناءً على بيانات التقرير المتاحة.

## قواعد مهمة
- لا تبدأ بـ "بصفتي" أو "كـ" أو أي تقديم شخصي. ابدأ مباشرة بالمعلومة.
- أجب بإيجاز ووضوح. استخدم الأرقام من التقرير عند الإمكان.
- إذا لم تكن متأكداً، قل ذلك بوضوح.
- اذكر الأسعار بالجنيه المصري (ج.م).
- ركز على النصائح العملية القابلة للتنفيذ.
${contextBlock}`
        : `You are a solar energy advisor specialized in the Egyptian market. Answer the user's questions based on the available report data.

## Important Rules
- Never start with "As a..." or any personal introduction. Start directly with the information.
- Answer concisely and clearly. Use numbers from the report when possible.
- If unsure, say so clearly.
- Mention prices in EGP.
- Focus on practical, actionable advice.
${contextBlock}`;

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
            ...messages.slice(-20), // Keep last 20 messages for context
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
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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
