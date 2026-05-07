// Pure client helper — sends polygon to backend, returns JSON.
// Does NOT touch DOM, focus, pointer events, or render anything.
import { supabase } from "@/integrations/supabase/client";

export interface LatLng { lat: number; lng: number }

export interface RoofAnalysisResult {
  selectedArea: number;
  detectedRoofArea: number;
  usableArea: number;
  unusablePercentage: number;
  obstacles: string[];
  confidenceScore: number;
  notes?: string;
  cached?: boolean;
}

export async function analyzeRoof(params: {
  polygon: LatLng[];
  center: LatLng;
  selectedArea: number;
}): Promise<RoofAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("roof-analysis", {
    body: params,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as RoofAnalysisResult;
}
