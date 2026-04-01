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
        query: "شرائح أسعار الكهرباء مصر 2025 2026 تعريفة الكهرباء المنزلية الجديدة",
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

    // Use Gemini to extract tariff tiers
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract Egyptian residential electricity tariff tiers from this content. Return valid JSON only:
{"tiers":[{"minKWh":0,"maxKWh":50,"rateEGP":<n>,"tierName":"Tier 1","tierNameAr":"الشريحة الأولى"},...],"commercial_rate":<n>,"industrial_rate":<n>,"effective_date":"<period>","confidence":"high|medium|low","sources_analyzed":<n>}

7 tiers: 0-50, 51-100, 101-200, 201-350, 351-650, 651-1000, >1000.
Fallback: 0.58, 0.73, 1.12, 1.41, 1.69, 1.95, 2.28. Commercial: 1.85, Industrial: 1.65 (confidence=low).

Content:
${combinedContent}`
          }]
        }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    let tariffData: any = null;
    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      let text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("Gemini tariff response:", text.slice(0, 800));
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          tariffData = JSON.parse(jsonMatch[0]);
          console.log("Extracted tariffs successfully:", JSON.stringify(tariffData).slice(0, 300));
        } catch (e) {
          console.error("Failed to parse tariff JSON:", e);
        }
      }
    } else {
      console.error("Gemini error:", geminiRes.status, await geminiRes.text());
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
