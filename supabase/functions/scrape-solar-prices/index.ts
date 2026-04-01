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
    console.log("Searching for solar panel prices...");
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "أسعار ألواح شمسية مصر 2025 2026 سعر كيلو وات طاقة شمسية",
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

    // Combine all markdown content
    const combinedContent = results
      .map((r: any) => `--- Source: ${r.url} ---\n${r.markdown || r.description || ""}`)
      .join("\n\n")
      .slice(0, 8000);

    // Use Gemini to extract structured pricing data
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a data extraction expert. From the following scraped web content about solar panel prices in Egypt, extract the average cost per kilowatt (EGP/kW) for three categories:

1. Economy (polycrystalline panels, budget options)
2. Standard (standard monocrystalline panels, mid-range)  
3. Premium (high-efficiency monocrystalline, top brands like Canadian Solar, LONGi, JA Solar)

Return ONLY a valid JSON object with this exact format, no other text:
{
  "economy": { "costPerKW": <number>, "confidence": "high|medium|low", "notes": "<brief note>" },
  "standard": { "costPerKW": <number>, "confidence": "high|medium|low", "notes": "<brief note>" },
  "premium": { "costPerKW": <number>, "confidence": "high|medium|low", "notes": "<brief note>" },
  "currency": "EGP",
  "market_date": "<approximate date of these prices>",
  "sources_analyzed": <number of sources>
}

If you cannot find reliable prices, use these fallback values but mark confidence as "low":
- Economy: 15000 EGP/kW
- Standard: 19000 EGP/kW
- Premium: 26000 EGP/kW

Scraped content:
${combinedContent}`
          }]
        }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.2 },
      }),
    });

    let priceData: any = null;
    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          priceData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse Gemini JSON:", e);
        }
      }
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
      source_urls: sourceUrls,
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
