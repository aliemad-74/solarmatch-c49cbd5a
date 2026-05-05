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
    const FIRECRAWL_API_KEY =
      Deno.env.get("FIRECRAWL_API_KEY_2") ||
      Deno.env.get("FIRECRAWL_API_KEY_1") ||
      Deno.env.get("FIRECRAWL_API_KEY");
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
      .eq("type", "panel_price")
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

    // Strategy: Scrape known Egyptian solar price pages directly, then search as backup
    console.log("Scraping known solar price pages...");

    const knownUrls = [
      "https://solar-egy.com/%D8%AA%D9%83%D9%84%D9%81%D8%A9-%D8%A7%D9%84%D8%B7%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D8%B4%D9%85%D8%B3%D9%8A%D8%A9-%D9%84%D9%84%D9%85%D9%86%D8%A7%D8%B2%D9%84/",
      "https://attaqa.net/2025/01/30/%D8%A3%D8%B3%D8%B9%D8%A7%D8%B1-%D8%A3%D9%84%D9%88%D8%A7%D8%AD-%D8%A7%D9%84%D8%B7%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D8%B4%D9%85%D8%B3%D9%8A%D8%A9-%D9%81%D9%8A-%D9%85%D8%B5%D8%B1-2025/",
    ];

    let allContent: string[] = [];
    const allSourceUrls: string[] = [];

    // Step 1: Scrape known pages directly
    for (const url of knownUrls) {
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          const md = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          if (md.length > 50) {
            console.log(`Scraped ${url.slice(0, 50)}... -> ${md.length} chars`);
            allContent.push(`--- ${url} ---\n${md.slice(0, 3000)}`);
            allSourceUrls.push(url);
          }
        }
      } catch (e) {
        console.error(`Scrape error for ${url.slice(0, 40)}:`, e);
      }
    }

    // Step 2: Search as backup
    if (allContent.length < 2) {
      console.log("Searching for more solar prices...");
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `أسعار تركيب الطاقة الشمسية للمنازل مصر ${new Date().getFullYear()} سعر الكيلو وات اليوم`,
          limit: 3,
          lang: "ar",
          country: "eg",
          scrapeOptions: { formats: ["markdown"] },
        }),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData.data || [];
        for (const r of results) {
          if (r.markdown && r.markdown.length > 50) {
            allContent.push(`--- ${r.url} ---\n${r.markdown.slice(0, 2000)}`);
            allSourceUrls.push(r.url);
          }
        }
      }
    }

    console.log(`Total content pieces: ${allContent.length}`);

    const combinedContent = allContent.join("\n\n").slice(0, 8000);
    console.log(`Combined content length: ${combinedContent.length} chars`);
    console.log("Content preview:", combinedContent.slice(0, 500));
    if (combinedContent.length < 100) {
      console.warn("Very little content scraped, likely no useful data found");
    }

    // Use Lovable AI Gateway to extract structured pricing data
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a solar energy market analyst specializing in Egypt. Extract structured pricing data from web content. Always respond with valid JSON only." },
          { role: "user", content: `Analyze the following content and extract the TOTAL INSTALLED SYSTEM cost per kW in EGP for solar panel systems in Egypt.

IMPORTANT DISTINCTION:
- "Panel price per watt" (e.g., 7 EGP/W) is ONLY the panel cost, NOT the full system
- "System cost per kW" (e.g., 18,000 EGP/kW) includes panels + inverter + mounting + installation + wiring
- We need the FULL SYSTEM installed cost per kW, not just panel price
- Use the most recent prices as of today (${new Date().toISOString().split("T")[0]})
- Typical full system costs in Egypt: Economy 15,000-20,000, Standard 18,000-23,000, Premium 23,000-30,000 EGP/kW

Economy = basic polycrystalline system, Standard = mono PERC system, Premium = high-efficiency (Canadian Solar, LONGi, Jinko).

Content:
${combinedContent}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_solar_prices",
            description: "Extract solar panel system prices from analyzed content",
            parameters: {
              type: "object",
              properties: {
                economy: { type: "object", properties: { costPerKW: { type: "number" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, notes: { type: "string" } }, required: ["costPerKW", "confidence", "notes"] },
                standard: { type: "object", properties: { costPerKW: { type: "number" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, notes: { type: "string" } }, required: ["costPerKW", "confidence", "notes"] },
                premium: { type: "object", properties: { costPerKW: { type: "number" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, notes: { type: "string" } }, required: ["costPerKW", "confidence", "notes"] },
                currency: { type: "string" },
                market_date: { type: "string" },
                sources_analyzed: { type: "number" },
              },
              required: ["economy", "standard", "premium", "currency", "market_date", "sources_analyzed"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_solar_prices" } },
      }),
    });

    let priceData: any = null;
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          priceData = JSON.parse(toolCall.function.arguments);
          console.log("✅ Parsed prices via Lovable AI:", JSON.stringify(priceData).slice(0, 400));
        } catch (e) {
          console.error("❌ JSON parse failed:", (e as Error).message);
        }
      }
    } else {
      const errBody = await aiRes.text();
      console.error("Lovable AI error:", aiRes.status, errBody.slice(0, 300));
    }

    // Fallback if extraction failed or returned null values
    if (!priceData || !priceData.economy?.costPerKW) {
      priceData = {
        economy: { costPerKW: 15000, confidence: "low", notes: "Fallback value" },
        standard: { costPerKW: 19000, confidence: "low", notes: "Fallback value" },
        premium: { costPerKW: 26000, confidence: "low", notes: "Fallback value" },
        currency: "EGP",
        market_date: new Date().toISOString().split("T")[0],
        sources_analyzed: 0,
      };
    }

    // Sanity validation: enforce realistic ranges and Economy < Standard < Premium ordering
    const eco = Number(priceData.economy?.costPerKW);
    const std = Number(priceData.standard?.costPerKW);
    const prm = Number(priceData.premium?.costPerKW);
    const inRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;
    const isOrderValid = eco < std && std < prm;
    const allInRange = inRange(eco, 12000, 22000) && inRange(std, 16000, 26000) && inRange(prm, 22000, 35000);

    if (!isOrderValid || !allInRange) {
      console.warn(`⚠️ Invalid price extraction (eco=${eco}, std=${std}, prm=${prm}) — overriding with safe fallback`);
      priceData = {
        economy: { costPerKW: 15000, confidence: "low", notes: "AI extracted invalid values; using safe fallback" },
        standard: { costPerKW: 19000, confidence: "low", notes: "AI extracted invalid values; using safe fallback" },
        premium: { costPerKW: 26000, confidence: "low", notes: "AI extracted invalid values; using safe fallback" },
        currency: "EGP",
        market_date: new Date().toISOString().split("T")[0],
        sources_analyzed: 0,
      };
    }

    // Store in database using service role
    await supabase.from("market_data").insert({
      type: "panel_price",
      data: priceData,
      source_urls: allSourceUrls,
      scraped_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, data: priceData, source: "fresh", scraped_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scrape-solar-prices error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
