import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 10; // requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation
function validateSolarData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid solar data' };
  }
  
  const solarData = data as Record<string, unknown>;
  
  // Required numeric fields
  const numericFields = ['rooftopArea', 'kWInstalled', 'energyYear', 'monthlyConsumption', 
    'coverageRatio', 'totalCost', 'savingsYear', 'paybackYears', 'co2Reduction'];
  
  for (const field of numericFields) {
    if (typeof solarData[field] !== 'number' || !isFinite(solarData[field] as number)) {
      return { valid: false, error: `Invalid ${field}: must be a valid number` };
    }
  }
  
  // Validate reasonable ranges
  if ((solarData.rooftopArea as number) <= 0 || (solarData.rooftopArea as number) > 1000000) {
    return { valid: false, error: 'Rooftop area out of range' };
  }
  if ((solarData.kWInstalled as number) <= 0 || (solarData.kWInstalled as number) > 10000) {
    return { valid: false, error: 'kW installed out of range' };
  }
  
  // String fields
  if (typeof solarData.pvType !== 'string' || (solarData.pvType as string).length > 100) {
    return { valid: false, error: 'Invalid pvType' };
  }
  if (typeof solarData.buildingType !== 'string' || (solarData.buildingType as string).length > 100) {
    return { valid: false, error: 'Invalid buildingType' };
  }
  if (solarData.locationName !== undefined && solarData.locationName !== null) {
    if (typeof solarData.locationName !== 'string' || (solarData.locationName as string).length > 500) {
      return { valid: false, error: 'Invalid locationName' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting (use IP or fallback)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { solarData, language } = body as { solarData: unknown; language: unknown };
    
    // Validate language
    if (language !== 'en' && language !== 'ar') {
      return new Response(JSON.stringify({ error: "Invalid language parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate solar data
    const validation = validateSolarData(solarData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const validatedSolarData = solarData as Record<string, unknown>;

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
- الموقع: ${validatedSolarData.locationName || 'غير محدد'}
- مساحة السطح: ${validatedSolarData.rooftopArea} م²
- القدرة المركبة: ${validatedSolarData.kWInstalled} كيلوواط
- الإنتاج السنوي: ${validatedSolarData.energyYear} كيلوواط/ساعة
- الاستهلاك الشهري: ${validatedSolarData.monthlyConsumption} كيلوواط/ساعة
- نسبة التغطية: ${validatedSolarData.coverageRatio}%
- نوع الألواح: ${validatedSolarData.pvType}
- نوع المبنى: ${validatedSolarData.buildingType}
- التكلفة الإجمالية: ${validatedSolarData.totalCost} جنيه
- التوفير السنوي: ${validatedSolarData.savingsYear} جنيه
- فترة الاسترداد: ${validatedSolarData.paybackYears} سنة
- تقليل CO2: ${validatedSolarData.co2Reduction} كجم/سنة

قدم تحليلاً مختصراً وتوصيات عملية لهذا المستخدم.`
      : `Solar System Data:
- Location: ${validatedSolarData.locationName || 'Not specified'}
- Rooftop Area: ${validatedSolarData.rooftopArea} m²
- Installed Capacity: ${validatedSolarData.kWInstalled} kW
- Annual Production: ${validatedSolarData.energyYear} kWh
- Monthly Consumption: ${validatedSolarData.monthlyConsumption} kWh
- Coverage Ratio: ${validatedSolarData.coverageRatio}%
- Panel Type: ${validatedSolarData.pvType}
- Building Type: ${validatedSolarData.buildingType}
- Total Cost: ${validatedSolarData.totalCost} EGP
- Annual Savings: ${validatedSolarData.savingsYear} EGP
- Payback Period: ${validatedSolarData.paybackYears} years
- CO2 Reduction: ${validatedSolarData.co2Reduction} kg/year

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
