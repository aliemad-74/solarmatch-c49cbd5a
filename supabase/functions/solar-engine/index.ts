import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ───── helpers ───── */

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function dustLoss(aqi: number): number {
  if (aqi < 50) return 0;
  if (aqi <= 100) return 0.03;
  if (aqi <= 150) return 0.07;
  return 0.12;
}

function tempFactor(elevation: number): number {
  if (elevation < 100) return 1.0;
  if (elevation <= 500) return 1.02;
  return 1.04;
}

const AREA_PER_KW: Record<string, number> = { economy: 8.5, standard: 7, premium: 6 };
const DEFAULT_COST_PER_KW: Record<string, number> = { economy: 15000, standard: 19000, premium: 26000 };

/* ───── Fetch live market prices from DB ───── */
async function getMarketPrices(): Promise<Record<string, number>> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return DEFAULT_COST_PER_KW;

    const res = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/market_data?type=eq.panel_price&order=scraped_at.desc&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      5000
    );
    if (res.ok) {
      const rows = await res.json();
      if (rows?.length && rows[0]?.data) {
        const d = rows[0].data;
        return {
          economy: d.economy?.costPerKW ?? DEFAULT_COST_PER_KW.economy,
          standard: d.standard?.costPerKW ?? DEFAULT_COST_PER_KW.standard,
          premium: d.premium?.costPerKW ?? DEFAULT_COST_PER_KW.premium,
        };
      }
    }
  } catch (e) {
    console.error("Market price fetch error:", e);
  }
  return DEFAULT_COST_PER_KW;
}

/* ───── STEP 1: Geocoding ───── */
async function geocode(lat: number, lng: number, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.status === "OK" && data.results?.length) {
      const r = data.results[0];
      const get = (type: string) =>
        r.address_components?.find((c: any) => c.types?.includes(type))?.long_name ?? null;
      return {
        formatted_address: r.formatted_address ?? `${lat}, ${lng}`,
        city: get("locality") ?? get("administrative_area_level_2") ?? "",
        governorate: get("administrative_area_level_1") ?? "",
      };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return { formatted_address: `${lat}, ${lng}`, city: "", governorate: "" };
}

/* ───── STEP 2: Solar data ───── */
async function getSolarData(lat: number, lng: number, apiKey: string) {
  // Try Google Solar first
  try {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const sp = data.solarPotential;
      if (sp) {
        return {
          source: "google_solar" as const,
          irradiance: sp.maxSunshineHoursPerYear ? sp.maxSunshineHoursPerYear / 365 * 1.0 : 5.5,
          max_panels: sp.maxArrayPanelsCount ?? null,
          sunshine_hours: sp.maxSunshineHoursPerYear ?? null,
          roof_area: sp.wholeRoofStats?.areaMeters2 ?? null,
          carbon_offset: sp.carbonOffsetFactorKgPerMwh ?? null,
          max_array_area: sp.maxArrayAreaMeters2 ?? null,
        };
      }
    }
    console.log("Google Solar returned non-OK, falling back to NASA POWER");
  } catch (e) {
    console.error("Google Solar error:", e);
  }

  // Fallback: NASA POWER
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;
    const res = await fetchWithTimeout(url, {}, 15000);
    const data = await res.json();
    const params = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    if (params) {
      const months = Object.entries(params).filter(([k]) => k !== "ANN");
      const avg = months.reduce((s, [, v]) => s + (v as number), 0) / (months.length || 1);
      return {
        source: "nasa_power" as const,
        irradiance: avg > 0 ? avg : 5.5,
        max_panels: null,
        sunshine_hours: null,
        roof_area: null,
        carbon_offset: null,
        max_array_area: null,
      };
    }
  } catch (e) {
    console.error("NASA POWER error:", e);
  }

  return { source: "nasa_power" as const, irradiance: 5.5, max_panels: null, sunshine_hours: null, roof_area: null, carbon_offset: null, max_array_area: null };
}

/* ───── STEP 3: Weather & Air Quality ───── */
async function getWeather(lat: number, lng: number, apiKey: string) {
  let temperature = 30, humidity = 50, cloudCover = 20, description = "Clear";
  try {
    const url = `https://weather.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const current = data?.forecastHours?.[0] ?? data?.currentConditions;
      if (current) {
        temperature = current?.temperature?.degrees ?? current?.temperature ?? 30;
        humidity = current?.humidity?.percent ?? current?.humidity ?? 50;
        cloudCover = current?.cloudCover?.percent ?? current?.cloudCover ?? 20;
        description = current?.weatherCondition?.description ?? "Clear";
      }
    }
  } catch (e) {
    console.error("Weather API error:", e);
  }
  return { temperature, humidity, cloudCover, description };
}

async function getAirQuality(lat: number, lng: number, apiKey: string) {
  try {
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: { latitude: lat, longitude: lng } }),
    });
    if (res.ok) {
      const data = await res.json();
      const idx = data?.indexes?.[0];
      return idx?.aqi ?? idx?.aqiDisplay ? parseInt(idx.aqiDisplay) : 75;
    }
  } catch (e) {
    console.error("Air Quality error:", e);
  }
  return 75; // moderate default for Egypt
}

/* ───── STEP 4: Elevation ───── */
async function getElevation(lat: number, lng: number, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.results?.length) {
        return data.results[0].elevation ?? 50;
      }
    }
  } catch (e) {
    console.error("Elevation error:", e);
  }
  return 50;
}

/* ───── STEP 6: Gemini AI ───── */
async function getAIAnalysis(prompt: string, geminiKey: string) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      }),
    }, 15000);
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    }
    console.error("Gemini status:", res.status, await res.text());
  } catch (e) {
    console.error("Gemini error:", e);
  }
  return null;
}

/* ───── main handler ───── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY not configured");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const body = await req.json();
    const {
      latitude,
      longitude,
      monthlyConsumption = 500,
      rooftopArea = 50,
      buildingType = "residential",
      pvPackage = "standard",
      farmMode = false,
      areaInFeddans,
    } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number" || !isFinite(latitude) || !isFinite(longitude)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pkg = (["economy", "standard", "premium"].includes(pvPackage) ? pvPackage : "standard") as string;

    // STEP 1-4: parallel API calls
    const [geo, solarData, weather, aqi, elevation] = await Promise.all([
      geocode(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getSolarData(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getWeather(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getAirQuality(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getElevation(latitude, longitude, GOOGLE_MAPS_API_KEY),
    ]);

    // STEP 5: Enhanced calculation
    const dust = dustLoss(aqi);
    const tf = tempFactor(elevation);
    const effectiveArea = farmMode && areaInFeddans ? areaInFeddans * 4200 * 0.6 : rooftopArea;
    const base_irradiance = solarData.irradiance * 365; // kWh/m²/year
    const adjusted_irradiance_factor =
      solarData.irradiance * (1 - dust) * tf * (1 - weather.cloudCover / 200);
    const adjusted_irradiance = adjusted_irradiance_factor * 365;

    const areaPerKw = AREA_PER_KW[pkg] ?? 7;
    const costPerKw = COST_PER_KW[pkg] ?? 19000;

    const system_size_kw = Math.round((effectiveArea * 0.60 / areaPerKw) * 100) / 100;
    const annual_production = Math.round(system_size_kw * adjusted_irradiance_factor * 365 * 0.80);
    const annual_consumption = monthlyConsumption * 12;
    const coverage_ratio = annual_consumption > 0 ? Math.round((annual_production / annual_consumption) * 100) / 100 : 0;
    const total_cost = Math.round(system_size_kw * costPerKw);

    // Egyptian electricity price (tiered average ~1.65 EGP/kWh)
    const electricity_price = 1.65;
    const annual_savings = Math.round(Math.min(annual_production, annual_consumption) * electricity_price);
    const payback_years = annual_savings > 0 ? Math.round((total_cost / annual_savings) * 10) / 10 : 99;
    const co2_saved = Math.round((annual_production * 0.55 / 1000) * 100) / 100;

    let feasibility: "suitable" | "conditional" | "not_suitable";
    if (coverage_ratio >= 0.7 && payback_years <= 10) feasibility = "suitable";
    else if (coverage_ratio >= 0.3 && payback_years <= 15) feasibility = "conditional";
    else feasibility = "not_suitable";

    // STEP 6: AI Analysis
    const aiPrompt = `You are SolarMatch AI, Egypt's expert solar feasibility advisor. Analyze this solar assessment and provide a personalized recommendation in the same language as the user's location (Arabic for Egyptian locations, English otherwise).

Location: ${geo.formatted_address}
Building Type: ${buildingType}
System Size: ${system_size_kw} kW
Annual Production: ${annual_production} kWh
Monthly Consumption: ${monthlyConsumption} kWh
Coverage Ratio: ${Math.round(coverage_ratio * 100)}%
Payback Period: ${payback_years} years
Annual Savings: ${annual_savings} EGP
Total Cost: ${total_cost} EGP
CO2 Saved: ${co2_saved} tons/year
Air Quality Index: ${aqi} (${Math.round(dust * 100)}% dust loss)
Elevation: ${Math.round(elevation)}m
Weather: ${weather.temperature}°C, ${weather.cloudCover}% cloud cover
Data Source: ${solarData.source}
Feasibility: ${feasibility}

Provide:
1. One clear opening sentence about the feasibility verdict
2. Top 3 factors driving this recommendation (ranked by impact)
3. One specific insight about this location's conditions
4. One actionable next step

Keep response under 200 words. Be specific with numbers.`;

    const aiText = await getAIAnalysis(aiPrompt, GEMINI_API_KEY);

    const confidence = solarData.source === "google_solar" ? "high" : (feasibility === "suitable" ? "medium" : "low");

    // STEP 7: Response
    const result = {
      success: true,
      location: {
        formatted_address: geo.formatted_address,
        city: geo.city,
        governorate: geo.governorate,
        elevation: Math.round(elevation),
        coordinates: { lat: latitude, lng: longitude },
      },
      environmental: {
        aqi,
        dust_efficiency_loss: Math.round(dust * 100),
        temperature: weather.temperature,
        humidity: weather.humidity,
        cloud_cover: weather.cloudCover,
        weather_description: weather.description,
      },
      solar_data: {
        source: solarData.source,
        irradiance: Math.round(base_irradiance),
        adjusted_irradiance: Math.round(adjusted_irradiance),
        max_panels: solarData.max_panels,
        sunshine_hours: solarData.sunshine_hours,
      },
      calculation: {
        system_size_kw,
        annual_production,
        coverage_ratio,
        total_cost,
        annual_savings,
        payback_years,
        co2_saved,
        feasibility,
        pv_package: pkg,
      },
      ai_analysis: {
        recommendation: aiText ?? "AI analysis unavailable. Results are based on engineering calculations.",
        confidence,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("solar-engine error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
