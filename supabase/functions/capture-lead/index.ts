import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    const {
      latitude, longitude, city, governorate, formatted_address,
      building_type, pv_package, monthly_consumption, rooftop_area,
      system_size_kw, annual_production, annual_savings, payback_years,
      total_cost, coverage_ratio, co2_saved, feasibility,
      aqi, elevation, data_source, dust_efficiency_loss,
      temperature, cloud_cover, ai_recommendation, ai_confidence,
      user_id, farm_mode, area_in_feddans,
    } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(JSON.stringify({ error: "Missing coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("solar_assessments").insert({
      latitude, longitude, city, governorate, formatted_address,
      building_type, pv_package, monthly_consumption, rooftop_area,
      system_size_kw, annual_production, annual_savings, payback_years,
      total_cost, coverage_ratio, co2_saved, feasibility,
      aqi, elevation, data_source, dust_efficiency_loss,
      temperature, cloud_cover, ai_recommendation, ai_confidence,
      user_id: user_id || null, farm_mode: farm_mode || false,
      area_in_feddans: area_in_feddans || null,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("capture-lead error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
