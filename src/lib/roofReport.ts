// Pure client helper. Sends polygon to backend; backend returns full report.
// No DOM/canvas/pointer side effects.
import { supabase } from "@/integrations/supabase/client";

export interface LatLng { lat: number; lng: number }

export interface RoofReport {
  success: boolean;
  selectedArea: number;
  detectedRoofArea: number;
  usableArea: number;
  unusablePercentage: number;
  obstacles: string[];
  propertyType: "residential" | "commercial" | "industrial" | "warehouse" | "farm" | "mixed";
  propertyTypeReasoning: string | null;
  confidenceScore: number;
  notes: string | null;
  environment: {
    available: boolean;
    aqi?: number | null;
    category?: string | null;
    dominantPollutant?: string | null;
    pm10?: number | null;
    pm25?: number | null;
    soilingLossPercent?: number;
    severity?: string;
    cleaningFrequency?: string;
  };
  farm: {
    isFarm: boolean;
    feddans: number;
    qirats: number;
    irrigationNote: string | null;
  };
  visionAvailable: boolean;
  cached?: boolean;
}

export async function generateRoofReport(params: {
  polygon: LatLng[];
  center: LatLng;
  selectedArea: number;
  buildingTypeHint?: string;
  language?: "ar" | "en";
}): Promise<RoofReport> {
  const { data, error } = await supabase.functions.invoke("roof-report", { body: params });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as RoofReport;
}
