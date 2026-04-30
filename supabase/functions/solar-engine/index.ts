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
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;
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
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: ["DOMINANT_POLLUTANT_CONCENTRATION", "POLLUTANT_CONCENTRATION"],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const idx = data?.indexes?.[0];
      const aqi = typeof idx?.aqi === "number" ? idx.aqi : (idx?.aqiDisplay ? parseInt(idx.aqiDisplay) : 75);
      const dominantPollutant = idx?.dominantPollutant ?? null;
      const pollutants: any[] = data?.pollutants ?? [];
      const findConc = (code: string) =>
        pollutants.find((x) => x?.code === code)?.concentration?.value ?? null;
      return { aqi, dominantPollutant, pm10: findConc("pm10"), pm25: findConc("pm25") };
    }
  } catch (e) {
    console.error("Air Quality error:", e);
  }
  return { aqi: 75, dominantPollutant: null, pm10: null, pm25: null };
}

async function getPollenDust(lat: number, lng: number, apiKey: string) {
  try {
    const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=1`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const types: any[] = data?.dailyInfo?.[0]?.pollenTypeInfo ?? [];
      const maxIndex = types.reduce((m, t) => Math.max(m, t?.indexInfo?.value ?? 0), 0);
      return { pollenIndex: maxIndex, available: true };
    }
  } catch (e) {
    console.error("Pollen API error:", e);
  }
  return { pollenIndex: 0, available: false };
}

// Combined soiling-loss model: PM10 dominates in Egypt; pollen adds a small bump.
function combinedSoilingLoss(pm10: number | null, pm25: number | null, pollenIndex: number, aqi: number): number {
  let pmBased: number | null = null;
  const v = pm10 ?? (pm25 != null ? pm25 * 1.5 : null);
  if (v != null) {
    if (v < 50) pmBased = 0.02;
    else if (v < 100) pmBased = 0.035;
    else if (v < 200) pmBased = 0.05;
    else pmBased = 0.065;
  }
  const aqiBased = dustLoss(aqi);
  let base = pmBased ?? aqiBased;
  // Pollen bump: index 0-5 → up to +1%
  base += Math.min(pollenIndex, 5) * 0.002;
  return Math.min(base, 0.10); // cap 10%
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

/* ───── STEP 6: AI Analysis via Lovable AI ───── */
async function getAIAnalysis(prompt: string, _unused: string) {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return null;
    
    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a solar energy expert for Egypt. Be concise and specific with numbers." },
          { role: "user", content: prompt },
        ],
      }),
    }, 15000);
    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? null;
    }
    console.error("Lovable AI status:", res.status, await res.text());
  } catch (e) {
    console.error("Lovable AI error:", e);
  }
  return null;
}

/* ───── main handler ───── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
      polygonPoints,
      language = "en",
    } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number" || !isFinite(latitude) || !isFinite(longitude)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pkg = (["economy", "standard", "premium"].includes(pvPackage) ? pvPackage : "standard") as string;

    // Vision analysis (optional — only if polygon provided & not farm mode)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const visionPromise: Promise<any> = (polygonPoints && Array.isArray(polygonPoints) && polygonPoints.length >= 3 && !farmMode && supabaseUrl)
      ? fetchWithTimeout(`${supabaseUrl}/functions/v1/satellite-vision`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}` },
          body: JSON.stringify({ lat: latitude, lng: longitude, polygonPoints, language }),
        }, 30000).then((r) => r.ok ? r.json() : null).catch((e) => { console.error("vision call failed:", e); return null; })
      : Promise.resolve(null);

    // STEP 1-4: parallel API calls + market prices + vision
    const [geo, solarData, weather, airQuality, elevation, pollen, marketPrices, visionAnalysis] = await Promise.all([
      geocode(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getSolarData(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getWeather(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getAirQuality(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getElevation(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getPollenDust(latitude, longitude, GOOGLE_MAPS_API_KEY),
      getMarketPrices(),
      visionPromise,
    ]);


    const aqi = airQuality.aqi;
    const dominantPollutant = airQuality.dominantPollutant;

    // STEP 5: Enhanced calculation
    const dust = combinedSoilingLoss(airQuality.pm10, airQuality.pm25, pollen.pollenIndex, aqi);
    const tf = tempFactor(elevation);
    // Apply Vision AI: detected target ratio (real building/farm ÷ drawn polygon) × usable ratio (after obstacles)
    const detectedRatio: number = (visionAnalysis && typeof visionAnalysis.detectedAreaRatio === "number")
      ? Math.max(0.1, Math.min(1, visionAnalysis.detectedAreaRatio))
      : 1.0;
    const usableInsideTarget: number = (visionAnalysis && typeof visionAnalysis.usableAreaRatio === "number")
      ? Math.max(0.3, Math.min(1, visionAnalysis.usableAreaRatio))
      : 1.0;
    const visionRatio: number = detectedRatio * usableInsideTarget;
    const baseArea = farmMode && areaInFeddans ? areaInFeddans * 4200 * 0.6 : rooftopArea;
    const effectiveArea = baseArea * visionRatio;
    const base_irradiance = solarData.irradiance * 365;
    const adjusted_irradiance_factor =
      solarData.irradiance * (1 - dust) * tf * (1 - weather.cloudCover / 200);
    const adjusted_irradiance = adjusted_irradiance_factor * 365;

    const areaPerKw = AREA_PER_KW[pkg] ?? 7;
    const costPerKw = marketPrices[pkg] ?? DEFAULT_COST_PER_KW[pkg] ?? 19000;

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

    let feasibility: "suitable" | "conditional" | "not_suitable" | "oversized";
    if (coverage_ratio >= 1.5) feasibility = "oversized";
    else if (coverage_ratio >= 0.7 && payback_years <= 10) feasibility = "suitable";
    else if (coverage_ratio >= 0.3 && payback_years <= 15) feasibility = "conditional";
    else feasibility = "not_suitable";

    // For oversized systems, calculate recommended (right-sized) values
    let recommended: Record<string, number> | null = null;
    if (feasibility === "oversized") {
      const target_coverage = 1.1; // 110% of consumption
      const recommended_annual = annual_consumption * target_coverage;
      const recommended_size = Math.round((recommended_annual / (adjusted_irradiance_factor * 365 * 0.80)) * 100) / 100;
      const recommended_area_val = Math.round(recommended_size * areaPerKw);
      const recommended_cost_val = Math.round(recommended_size * costPerKw);
      const recommended_savings = Math.round(Math.min(recommended_annual, annual_consumption) * electricity_price);
      const recommended_payback = recommended_savings > 0 ? Math.round((recommended_cost_val / recommended_savings) * 10) / 10 : 99;
      recommended = {
        recommended_size_kw: recommended_size,
        recommended_area: recommended_area_val,
        recommended_cost: recommended_cost_val,
        recommended_payback: recommended_payback,
        savings_from_downsizing: total_cost - recommended_cost_val,
      };
    }

    // STEP 6: AI Analysis
    const visionBlock = visionAnalysis ? `
Satellite Vision AI (Gemini 2.5 Pro):
- Detected target: ${visionAnalysis.siteType ?? "n/a"} — ${visionAnalysis.detectionNote ?? ""}
- Drawn polygon: ${Math.round(visionAnalysis.drawnAreaSqm ?? baseArea)} m² → Detected real footprint: ${Math.round(visionAnalysis.detectedAreaSqm ?? baseArea)} m² (${Math.round((visionAnalysis.detectedAreaRatio ?? 1) * 100)}% of drawn)
- Usable inside target (after obstacles): ${Math.round((visionAnalysis.usableAreaRatio ?? 1) * 100)}%
- Combined applied ratio: ${Math.round(visionRatio * 100)}%
- Obstacles detected: ${(visionAnalysis.obstacles ?? []).length} (${(visionAnalysis.obstacles ?? []).map((o: any) => o.type).join(", ") || "none"})
- Shading: ${visionAnalysis.shadingLevel ?? "n/a"}, Orientation: ${visionAnalysis.orientation ?? "n/a"}, Confidence: ${visionAnalysis.confidence ?? "n/a"}
- Effective area used in calc: ${Math.round(effectiveArea)} m² (raw drawn: ${Math.round(baseArea)} m²)
` : `
Satellite Vision AI: not run (no polygon drawn). Calculation used full rooftop area without obstacle deduction.
`;

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
Air Quality Index: ${aqi}${dominantPollutant ? ` (dominant: ${dominantPollutant})` : ""}
PM10: ${airQuality.pm10 ?? "n/a"} µg/m³  PM2.5: ${airQuality.pm25 ?? "n/a"} µg/m³
Soiling Loss Applied: ${Math.round(dust * 1000) / 10}% (combined dust + pollen index ${pollen.pollenIndex})
Elevation: ${Math.round(elevation)}m
Weather: ${weather.temperature}°C, ${weather.cloudCover}% cloud cover
Data Source: ${solarData.source}
Feasibility: ${feasibility}
${visionBlock}

Provide:
1. One clear opening sentence about the feasibility verdict
2. Top 3 factors driving this recommendation (ranked by impact)
3. One specific insight about this location's conditions (mention dust/cleaning if soiling > 4%)
4. One actionable next step

Keep response under 200 words. Be specific with numbers.`;

    const aiText = await getAIAnalysis(aiPrompt, LOVABLE_API_KEY);

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
        dominant_pollutant: dominantPollutant,
        pm10: airQuality.pm10,
        pm25: airQuality.pm25,
        pollen_index: pollen.pollenIndex,
        soiling_loss_percent: Math.round(dust * 1000) / 10,
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
      ...(recommended ? { recommended } : {}),
      ...(visionAnalysis ? { vision_analysis: { ...visionAnalysis, applied_ratio: visionRatio } } : {}),
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
