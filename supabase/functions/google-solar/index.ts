import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    let body: { lat: number; lng: number; action: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lat, lng, action } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
      return new Response(JSON.stringify({ error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "buildingInsights") {
      // Google Solar API - Building Insights
      const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.log("Google Solar API not available for this location:", response.status);
        return new Response(
          JSON.stringify({ 
            available: false,
            fallback: true,
            reason: "Solar imagery not available for this location"
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Extract useful data
      const solarPotential = data.solarPotential;
      const result = {
        available: true,
        maxArrayAreaMeters2: solarPotential?.maxArrayAreaMeters2,
        maxSunshineHoursPerYear: solarPotential?.maxSunshineHoursPerYear,
        carbonOffsetFactorKgPerMwh: solarPotential?.carbonOffsetFactorKgPerMwh,
        maxArrayPanelsCount: solarPotential?.maxArrayPanelsCount,
        panelCapacityWatts: solarPotential?.panelCapacityWatts,
        panelHeightMeters: solarPotential?.panelHeightMeters,
        panelWidthMeters: solarPotential?.panelWidthMeters,
        panelLifetimeYears: solarPotential?.panelLifetimeYears,
        roofSegments: solarPotential?.roofSegmentStats?.map((seg: any) => ({
          pitchDegrees: seg.pitchDegrees,
          azimuthDegrees: seg.azimuthDegrees,
          areaMeters2: seg.stats?.areaMeters2,
          sunshineQuantiles: seg.stats?.sunshineQuantiles,
        })),
        wholeRoofStats: {
          areaMeters2: solarPotential?.wholeRoofStats?.areaMeters2,
          sunshineQuantiles: solarPotential?.wholeRoofStats?.sunshineQuantiles,
        },
        solarPanelConfigs: solarPotential?.solarPanelConfigs?.slice(0, 5)?.map((config: any) => ({
          panelsCount: config.panelsCount,
          yearlyEnergyDcKwh: config.yearlyEnergyDcKwh,
          roofSegmentSummaries: config.roofSegmentSummaries,
        })),
        financialAnalyses: data.solarPotential?.financialAnalyses?.slice(0, 3),
        imageryDate: data.imageryDate,
        imageryQuality: data.imageryQuality,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "dataLayers") {
      // Google Solar API - Data Layers (for heatmaps)
      const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=100&view=FULL_LAYERS&requiredQuality=HIGH&pixelSizeMeters=0.5&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Data layers unavailable", fallback: true }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Solar proxy error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
