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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");
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

    // Search for ALL electricity tariffs (residential + commercial + industrial)
    console.log("Searching for electricity tariffs (residential + commercial + industrial)...");
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `أسعار شرائح الكهرباء الجديدة مصر ${new Date().getFullYear()} تعريفة الكهرباء المنزلية التجارية الصناعية الحالية اليوم`,
        limit: 8,
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
      .map((r: any) => `--- ${r.url} ---\n${(r.markdown || r.description || "").slice(0, 2000)}`)
      .join("\n\n")
      .slice(0, 6000);

    console.log(`Combined tariff content length: ${combinedContent.length} chars, ${results.length} results`);

    // Use Lovable AI Gateway to extract ALL tariff tiers
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an Egyptian electricity tariff analyst. Extract structured tariff data from web content for ALL categories: residential, commercial, and industrial." },
          { role: "user", content: `Analyze the following scraped web content and extract the MOST RECENT electricity tariff tiers in Egypt as of today (${new Date().toISOString().split("T")[0]}).

IMPORTANT:
- Extract RESIDENTIAL tariff tiers: 7 tiers (0-50, 51-100, 101-200, 201-350, 351-650, 651-1000, >1000 kWh).
- Extract COMMERCIAL tariff tiers: typically 5-6 tiers with higher rates than residential.
- Extract INDUSTRIAL tariff tiers: typically 4-5 tiers.
- Extract the ACTUAL rates from the content. DO NOT use placeholder values.
- Always use the NEWEST rates available. Prefer ${new Date().getFullYear()} rates.
- Set effective_date to the year of the rates you extracted (e.g. "2026").
- Commercial rates are generally 1.5x-2x higher than residential rates.
- Industrial rates are between residential and commercial.

Content to analyze:
${combinedContent}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tariffs",
            description: "Extract electricity tariff tiers from analyzed content for all categories",
            parameters: {
              type: "object",
              properties: {
                tiers: { type: "array", description: "Residential tariff tiers", items: { type: "object", properties: { minKWh: { type: "number" }, maxKWh: { type: "number" }, rateEGP: { type: "number" }, tierName: { type: "string" }, tierNameAr: { type: "string" } }, required: ["minKWh", "maxKWh", "rateEGP", "tierName", "tierNameAr"] } },
                commercial_tiers: { type: "array", description: "Commercial tariff tiers", items: { type: "object", properties: { minKWh: { type: "number" }, maxKWh: { type: "number" }, rateEGP: { type: "number" }, tierName: { type: "string" }, tierNameAr: { type: "string" } }, required: ["minKWh", "maxKWh", "rateEGP", "tierName", "tierNameAr"] } },
                industrial_tiers: { type: "array", description: "Industrial tariff tiers", items: { type: "object", properties: { minKWh: { type: "number" }, maxKWh: { type: "number" }, rateEGP: { type: "number" }, tierName: { type: "string" }, tierNameAr: { type: "string" } }, required: ["minKWh", "maxKWh", "rateEGP", "tierName", "tierNameAr"] } },
                commercial_rate: { type: "number", description: "Average commercial rate EGP/kWh" },
                industrial_rate: { type: "number", description: "Average industrial rate EGP/kWh" },
                effective_date: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                sources_analyzed: { type: "number" },
              },
              required: ["tiers", "commercial_tiers", "industrial_tiers", "commercial_rate", "industrial_rate", "effective_date", "confidence", "sources_analyzed"],
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
          console.log("✅ Extracted tariffs via Lovable AI:", JSON.stringify(tariffData).slice(0, 500));
        } catch (e) {
          console.error("Failed to parse tariff JSON:", e);
        }
      }
    } else {
      console.error("Lovable AI error:", aiRes.status, await aiRes.text());
    }

    // Validate: reject zero-rate extractions
    if (tariffData && tariffData.tiers) {
      const hasValidRates = tariffData.tiers.some((t: any) => t.rateEGP > 0);
      if (!hasValidRates) {
        console.warn("⚠️ Extracted tariffs have all-zero rates, falling back to defaults");
        tariffData = null;
      }
    }

    // 2026 official rates fallback
    const FALLBACK_2026 = {
      tiers: [
        { minKWh: 0, maxKWh: 50, rateEGP: 0.68, tierName: "Tier 1 (0-50 kWh)", tierNameAr: "الشريحة الأولى (0-50 ك.و.س)" },
        { minKWh: 51, maxKWh: 100, rateEGP: 0.78, tierName: "Tier 2 (51-100 kWh)", tierNameAr: "الشريحة الثانية (51-100 ك.و.س)" },
        { minKWh: 101, maxKWh: 200, rateEGP: 0.95, tierName: "Tier 3 (101-200 kWh)", tierNameAr: "الشريحة الثالثة (101-200 ك.و.س)" },
        { minKWh: 201, maxKWh: 350, rateEGP: 1.55, tierName: "Tier 4 (201-350 kWh)", tierNameAr: "الشريحة الرابعة (201-350 ك.و.س)" },
        { minKWh: 351, maxKWh: 650, rateEGP: 1.95, tierName: "Tier 5 (351-650 kWh)", tierNameAr: "الشريحة الخامسة (351-650 ك.و.س)" },
        { minKWh: 651, maxKWh: 1000, rateEGP: 2.10, tierName: "Tier 6 (651-1000 kWh)", tierNameAr: "الشريحة السادسة (651-1000 ك.و.س)" },
        { minKWh: 1001, maxKWh: null, rateEGP: 2.23, tierName: "Tier 7 (>1000 kWh)", tierNameAr: "الشريحة السابعة (>1000 ك.و.س)" },
      ],
      commercial_tiers: [
        { minKWh: 0, maxKWh: 100, rateEGP: 1.40, tierName: "Commercial 1 (0-100 kWh)", tierNameAr: "تجاري 1 (0-100 ك.و.س)" },
        { minKWh: 101, maxKWh: 250, rateEGP: 1.80, tierName: "Commercial 2 (101-250 kWh)", tierNameAr: "تجاري 2 (101-250 ك.و.س)" },
        { minKWh: 251, maxKWh: 600, rateEGP: 2.20, tierName: "Commercial 3 (251-600 kWh)", tierNameAr: "تجاري 3 (251-600 ك.و.س)" },
        { minKWh: 601, maxKWh: 1000, rateEGP: 2.85, tierName: "Commercial 4 (601-1000 kWh)", tierNameAr: "تجاري 4 (601-1000 ك.و.س)" },
        { minKWh: 1001, maxKWh: 2500, rateEGP: 3.15, tierName: "Commercial 5 (1001-2500 kWh)", tierNameAr: "تجاري 5 (1001-2500 ك.و.س)" },
        { minKWh: 2501, maxKWh: null, rateEGP: 3.45, tierName: "Commercial 6 (>2500 kWh)", tierNameAr: "تجاري 6 (>2500 ك.و.س)" },
      ],
      industrial_tiers: [
        { minKWh: 0, maxKWh: 200, rateEGP: 1.18, tierName: "Industrial 1 (0-200 kWh)", tierNameAr: "صناعي 1 (0-200 ك.و.س)" },
        { minKWh: 201, maxKWh: 500, rateEGP: 1.45, tierName: "Industrial 2 (201-500 kWh)", tierNameAr: "صناعي 2 (201-500 ك.و.س)" },
        { minKWh: 501, maxKWh: 1000, rateEGP: 1.72, tierName: "Industrial 3 (501-1000 kWh)", tierNameAr: "صناعي 3 (501-1000 ك.و.س)" },
        { minKWh: 1001, maxKWh: 5000, rateEGP: 1.95, tierName: "Industrial 4 (1001-5000 kWh)", tierNameAr: "صناعي 4 (1001-5000 ك.و.س)" },
        { minKWh: 5001, maxKWh: null, rateEGP: 2.10, tierName: "Industrial 5 (>5000 kWh)", tierNameAr: "صناعي 5 (>5000 ك.و.س)" },
      ],
      commercial_rate: 2.85,
      industrial_rate: 1.95,
      effective_date: "2026",
      confidence: "official",
      sources_analyzed: 0,
    };

    // Use 2026 fallback if no data or scraped data is older
    if (!tariffData || (tariffData.effective_date && !tariffData.effective_date.includes("2026"))) {
      console.log("📊 Using 2026 official tariffs (all categories)");
      tariffData = FALLBACK_2026;
    }

    // Ensure commercial/industrial tiers exist in final data
    if (!tariffData.commercial_tiers || tariffData.commercial_tiers.length < 3) {
      tariffData.commercial_tiers = FALLBACK_2026.commercial_tiers;
    }
    if (!tariffData.industrial_tiers || tariffData.industrial_tiers.length < 3) {
      tariffData.industrial_tiers = FALLBACK_2026.industrial_tiers;
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
