import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache (24h)
    const { data: cached } = await supabase
      .from("market_data")
      .select("*")
      .eq("type", "tariff")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.scraped_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ success: true, data: cached.data, source: "cache", scraped_at: cached.scraped_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Search for electricity tariffs in Egypt
    console.log("Searching for electricity tariffs...");
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "أسعار شرائح الكهرباء الجديدة مصر 2025 2026 تعريفة الكهرباء المنزلية بعد الزيادة يوليو",
        limit: 5,
        lang: "ar",
        country: "eg",
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("Firecrawl search error:", searchRes.status, errText);
      throw new Error(`Firecrawl search failed: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const results = searchData.data || [];
    const sourceUrls = results.map((r: any) => r.url).filter(Boolean);

    const combinedContent = results
      .map((r: any) => `--- ${r.url} ---\n${(r.markdown || r.description || "").slice(0, 1500)}`)
      .join("\n\n")
      .slice(0, 4000);

    console.log(`Combined tariff content length: ${combinedContent.length} chars, ${results.length} results`);

    // Use Lovable AI Gateway to extract tariff tiers
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an Egyptian electricity tariff analyst. Extract structured tariff data from web content." },
          { role: "user", content: `Analyze the following scraped web content and extract the MOST RECENT residential electricity tariff tiers in Egypt (2025/2026 if available, otherwise 2024/2025).

IMPORTANT:
- There should be 7 residential tiers: 0-50, 51-100, 101-200, 201-350, 351-650, 651-1000, >1000 kWh.
- Extract the ACTUAL rates from the content. DO NOT use placeholder values.
- If the content mentions July 2025 new tariffs, use those. Otherwise use the latest available.
- Set effective_date to the actual period (e.g. "2025/2026" or "2024/2025").

Content to analyze:
${combinedContent}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tariffs",
            description: "Extract electricity tariff tiers from analyzed content",
            parameters: {
              type: "object",
              properties: {
                tiers: { type: "array", items: { type: "object", properties: { minKWh: { type: "number" }, maxKWh: { type: "number" }, rateEGP: { type: "number" }, tierName: { type: "string" }, tierNameAr: { type: "string" } }, required: ["minKWh", "maxKWh", "rateEGP", "tierName", "tierNameAr"] } },
                commercial_rate: { type: "number" },
                industrial_rate: { type: "number" },
                effective_date: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                sources_analyzed: { type: "number" },
              },
              required: ["tiers", "commercial_rate", "industrial_rate", "effective_date", "confidence", "sources_analyzed"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_tariffs" } },
      }),
    });

    let tariffData: any = null;
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          tariffData = JSON.parse(toolCall.function.arguments);
          console.log("✅ Extracted tariffs via Lovable AI:", JSON.stringify(tariffData).slice(0, 300));
        } catch (e) {
          console.error("Failed to parse tariff JSON:", e);
        }
      }
    } else {
      console.error("Lovable AI error:", aiRes.status, await aiRes.text());
    }

    // Fallback
    if (!tariffData) {
      tariffData = {
        tiers: [
          { minKWh: 0, maxKWh: 50, rateEGP: 0.58, tierName: "Tier 1 (0-50 kWh)", tierNameAr: "الشريحة الأولى (0-50 ك.و.س)" },
          { minKWh: 51, maxKWh: 100, rateEGP: 0.73, tierName: "Tier 2 (51-100 kWh)", tierNameAr: "الشريحة الثانية (51-100 ك.و.س)" },
          { minKWh: 101, maxKWh: 200, rateEGP: 1.12, tierName: "Tier 3 (101-200 kWh)", tierNameAr: "الشريحة الثالثة (101-200 ك.و.س)" },
          { minKWh: 201, maxKWh: 350, rateEGP: 1.41, tierName: "Tier 4 (201-350 kWh)", tierNameAr: "الشريحة الرابعة (201-350 ك.و.س)" },
          { minKWh: 351, maxKWh: 650, rateEGP: 1.69, tierName: "Tier 5 (351-650 kWh)", tierNameAr: "الشريحة الخامسة (351-650 ك.و.س)" },
          { minKWh: 651, maxKWh: 1000, rateEGP: 1.95, tierName: "Tier 6 (651-1000 kWh)", tierNameAr: "الشريحة السادسة (651-1000 ك.و.س)" },
          { minKWh: 1001, maxKWh: null, rateEGP: 2.28, tierName: "Tier 7 (>1000 kWh)", tierNameAr: "الشريحة السابعة (>1000 ك.و.س)" },
        ],
        commercial_rate: 1.85,
        industrial_rate: 1.65,
        effective_date: "2024/2025",
        confidence: "low",
        sources_analyzed: 0,
      };
    }

    // Store in database
    await supabase.from("market_data").insert({
      type: "tariff",
      data: tariffData,
      source_urls: sourceUrls,
      scraped_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, data: tariffData, source: "fresh", scraped_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scrape-tariffs error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
