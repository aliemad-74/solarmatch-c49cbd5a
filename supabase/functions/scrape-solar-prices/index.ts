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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

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

    // Search for solar panel prices in Egypt
    // Search with both Arabic and English queries for better results
    console.log("Searching for solar panel prices...");
    const queries = [
      { query: "solar panel prices Egypt 2025 2026 cost per kilowatt EGP", lang: "en", country: "eg" },
      { query: "أسعار ألواح شمسية مصر 2025 2026 سعر كيلو وات طاقة شمسية", lang: "ar", country: "eg" },
    ];

    let allResults: any[] = [];
    const allSourceUrls: string[] = [];

    for (const q of queries) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q.query,
            limit: 3,
            lang: q.lang,
            country: q.country,
            scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData.data || [];
          console.log(`Query "${q.query.slice(0, 30)}..." returned ${results.length} results`);
          allResults = [...allResults, ...results];
          allSourceUrls.push(...results.map((r: any) => r.url).filter(Boolean));
        } else {
          const errText = await searchRes.text();
          console.error(`Firecrawl search error for query "${q.lang}":`, searchRes.status, errText);
        }
      } catch (e) {
        console.error(`Search error for "${q.lang}" query:`, e);
      }
    }

    console.log(`Total results: ${allResults.length}`);

    // Combine all markdown content
    const combinedContent = allResults
      .map((r: any) => `--- ${r.url} ---\n${(r.markdown || r.description || "").slice(0, 1500)}`)
      .join("\n\n")
      .slice(0, 4000);

    console.log(`Combined content length: ${combinedContent.length} chars`);
    if (combinedContent.length < 100) {
      console.warn("Very little content scraped, likely no useful data found");
    }

    // Use Gemini to extract structured pricing data
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract solar panel prices in Egypt (EGP per kW) from this content. Return ONLY valid JSON, no markdown fences:
{"economy":{"costPerKW":<number>,"confidence":"high|medium|low","notes":"<note>"},"standard":{"costPerKW":<number>,"confidence":"high|medium|low","notes":"<note>"},"premium":{"costPerKW":<number>,"confidence":"high|medium|low","notes":"<note>"},"currency":"EGP","market_date":"<date>","sources_analyzed":<number>}

Economy=polycrystalline, Standard=mono, Premium=high-power mono (Canadian Solar, LONGi).
Fallback if no data: Economy=15000, Standard=19000, Premium=26000 (confidence=low).

Content:
${combinedContent}`
          }]
        }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    let priceData: any = null;
    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("Gemini full response length:", rawText.length);
      console.log("Gemini raw start:", rawText.slice(0, 300));
      console.log("Gemini raw end:", rawText.slice(-300));
      
      // Try multiple extraction methods
      let jsonStr = "";
      
      // Method 1: Extract from code fences
      const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
        console.log("Extracted from code fence, length:", jsonStr.length);
      }
      
      // Method 2: Find first { to last }
      if (!jsonStr) {
        const firstBrace = rawText.indexOf("{");
        const lastBrace = rawText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = rawText.slice(firstBrace, lastBrace + 1);
          console.log("Extracted braces, length:", jsonStr.length);
        }
      }
      
      if (jsonStr) {
        try {
          priceData = JSON.parse(jsonStr);
          console.log("✅ Parsed prices:", JSON.stringify(priceData).slice(0, 400));
        } catch (e) {
          console.error("❌ JSON parse failed:", (e as Error).message);
          console.error("JSON snippet:", jsonStr.slice(0, 200));
        }
      } else {
        console.error("❌ No JSON found in Gemini response");
      }
    } else {
      const errBody = await geminiRes.text();
      console.error("Gemini HTTP error:", geminiRes.status, errBody.slice(0, 300));
    }

    // Fallback if extraction failed
    if (!priceData) {
      priceData = {
        economy: { costPerKW: 15000, confidence: "low", notes: "Fallback value" },
        standard: { costPerKW: 19000, confidence: "low", notes: "Fallback value" },
        premium: { costPerKW: 26000, confidence: "low", notes: "Fallback value" },
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
