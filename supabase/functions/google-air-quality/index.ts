import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { value: any; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

// Map Google Universal AQI (UAQI, 0-100, higher = better) OR local AQI to soiling-loss factor.
// We treat the returned aqi.code === 'uaqi' (lower = worse) and Egypt-style local AQI consistently.
function soilingLossFromPollutants(pm10: number | null, pm25: number | null): { percent: number; severity: string } {
  // PM10 is the main soiling driver in Egypt
  const v = pm10 ?? (pm25 != null ? pm25 * 1.5 : null);
  if (v == null) return { percent: 3, severity: "moderate" };
  if (v < 50) return { percent: 2, severity: "low" };
  if (v < 100) return { percent: 3.5, severity: "moderate" };
  if (v < 200) return { percent: 5, severity: "high" };
  return { percent: 6.5, severity: "extreme" };
}

function cleaningFrequency(severity: string, lang: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    low: { ar: "كل شهرين", en: "Every 2 months" },
    moderate: { ar: "كل شهر", en: "Monthly" },
    high: { ar: "كل أسبوعين", en: "Every 2 weeks" },
    extreme: { ar: "أسبوعياً", en: "Weekly" },
  };
  return (map[severity] ?? map.moderate)[lang];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const lang: "ar" | "en" = body.language === "ar" ? "ar" : "en";

    if (!isFinite(lat) || !isFinite(lng)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}_${lang}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify({ success: true, cached: true, ...cached.value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Air Quality API — request pollutants
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: ["DOMINANT_POLLUTANT_CONCENTRATION", "POLLUTANT_CONCENTRATION", "HEALTH_RECOMMENDATIONS"],
        languageCode: lang,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Air Quality API error:", res.status, txt);
      // Fail-safe defaults
      const fallback = {
        available: false,
        aqi: 75,
        category: "Moderate",
        dominantPollutant: "pm10",
        pm10: null,
        pm25: null,
        soilingLossPercent: 3.5,
        severity: "moderate",
        cleaningFrequency: cleaningFrequency("moderate", lang),
        healthRecommendation: null,
      };
      return new Response(JSON.stringify({ success: true, ...fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    // Pick the local-style AQI if available, else the universal one
    const indexes = data.indexes ?? [];
    const localIdx = indexes.find((i: any) => i?.code !== "uaqi") ?? indexes[0] ?? null;
    const aqi = localIdx?.aqi ?? null;
    const category = localIdx?.category ?? null;
    const dominantCode = localIdx?.dominantPollutant ?? null;

    const pollutants: any[] = data.pollutants ?? [];
    const findConc = (code: string) => {
      const p = pollutants.find((x) => x?.code === code);
      return p?.concentration?.value ?? null;
    };
    const pm10 = findConc("pm10");
    const pm25 = findConc("pm25");

    const { percent: soilingLossPercent, severity } = soilingLossFromPollutants(pm10, pm25);

    const value = {
      available: true,
      aqi,
      category,
      dominantPollutant: dominantCode,
      pm10,
      pm25,
      soilingLossPercent,
      severity,
      cleaningFrequency: cleaningFrequency(severity, lang),
      healthRecommendation: data.healthRecommendations?.generalPopulation ?? null,
    };
    cache.set(key, { value, expires: Date.now() + TTL });

    return new Response(JSON.stringify({ success: true, ...value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-air-quality error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
