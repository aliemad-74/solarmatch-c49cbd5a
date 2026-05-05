// Climate data integration: Google Solar API + NASA POWER fallback

export interface ClimateData {
  monthlyIrradiance: number[];
  monthlyTemperature: number[];
  monthlyWindSpeed: number[];
  monthlyCloudCover: number[];
  annualAvgIrradiance: number;
  location: { lat: number; lng: number };
}

export interface GoogleSolarData {
  available: boolean;
  maxArrayAreaMeters2?: number;
  maxSunshineHoursPerYear?: number;
  carbonOffsetFactorKgPerMwh?: number;
  maxArrayPanelsCount?: number;
  panelCapacityWatts?: number;
  panelHeightMeters?: number;
  panelWidthMeters?: number;
  panelLifetimeYears?: number;
  roofSegments?: {
    pitchDegrees: number;
    azimuthDegrees: number;
    areaMeters2: number;
    sunshineQuantiles: number[];
  }[];
  wholeRoofStats?: {
    areaMeters2: number;
    sunshineQuantiles: number[];
  };
  solarPanelConfigs?: {
    panelsCount: number;
    yearlyEnergyDcKwh: number;
  }[];
  imageryDate?: { year: number; month: number; day: number };
  imageryQuality?: string;
}

interface NASAPowerResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
      T2M?: Record<string, number>;
      WS10M?: Record<string, number>;
      CLOUD_AMT?: Record<string, number>;
    };
  };
}

export const defaultClimateData: ClimateData = {
  monthlyIrradiance: [4.2, 5.0, 5.8, 6.5, 7.0, 7.5, 7.3, 7.0, 6.2, 5.3, 4.5, 4.0],
  monthlyTemperature: [14, 15, 18, 22, 26, 29, 30, 30, 28, 24, 19, 15],
  monthlyWindSpeed: [3.5, 3.8, 4.2, 4.0, 3.8, 4.5, 4.8, 4.5, 4.0, 3.5, 3.2, 3.3],
  monthlyCloudCover: [25, 22, 18, 12, 8, 5, 3, 4, 8, 15, 20, 25],
  annualAvgIrradiance: 5.78,
  location: { lat: 30.0444, lng: 31.2357 },
};

/**
 * Fetch Google Solar API building insights via edge function
 */
export async function fetchGoogleSolarData(lat: number, lng: number): Promise<GoogleSolarData | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-solar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ lat, lng, action: "buildingInsights" }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      if (data.fallback) {
        console.log("Google Solar API not available for this location, using fallback");
        return null;
      }
      return null;
    }

    const data = await response.json();
    return data as GoogleSolarData;
  } catch (error) {
    console.error("Google Solar API error:", error);
    return null;
  }
}

/**
 * Fetches climate data from NASA POWER API
 */
export async function fetchClimateData(lat: number, lng: number): Promise<ClimateData> {
  try {
    const parameters = "ALLSKY_SFC_SW_DWN,T2M,WS10M,CLOUD_AMT";
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${parameters}&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn("NASA POWER API request failed, using default data");
      return { ...defaultClimateData, location: { lat, lng } };
    }

    const data: NASAPowerResponse = await response.json();
    const params = data.properties?.parameter;
    if (!params) {
      console.warn("Invalid NASA POWER API response, using default data");
      return { ...defaultClimateData, location: { lat, lng } };
    }

    const monthlyIrradiance = extractMonthlyValues(params.ALLSKY_SFC_SW_DWN);
    const monthlyTemperature = extractMonthlyValues(params.T2M);
    const monthlyWindSpeed = extractMonthlyValues(params.WS10M);
    const monthlyCloudCover = extractMonthlyValues(params.CLOUD_AMT);
    const annualAvgIrradiance = monthlyIrradiance.reduce((a, b) => a + b, 0) / 12;

    return { monthlyIrradiance, monthlyTemperature, monthlyWindSpeed, monthlyCloudCover, annualAvgIrradiance, location: { lat, lng } };
  } catch (error) {
    console.error("Error fetching climate data:", error);
    return { ...defaultClimateData, location: { lat, lng } };
  }
}

function extractMonthlyValues(data: Record<string, number> | undefined): number[] {
  if (!data) return Array(12).fill(0);
  const monthKeys = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return monthKeys.map((key) => {
    const value = data[key];
    return value && value !== -999 ? value : 0;
  });
}

/**
 * Get location name using Google Maps Geocoding API
 */
const GOOGLE_MAPS_API_KEY =
  ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ||
    "AIzaSyAuvna58z-9zjIfs8aBsZqHMq7t6_JisXY");

export async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    // Try Google Geocoding first (using the Maps API key from the client)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.results?.length > 0) {
        // Find city-level result
        const cityResult = data.results.find((r: any) =>
          r.types?.includes("locality") || r.types?.includes("administrative_area_level_1")
        );
        if (cityResult) {
          const cityComponent = cityResult.address_components?.find((c: any) =>
            c.types?.includes("locality") || c.types?.includes("administrative_area_level_1")
          );
          if (cityComponent) return cityComponent.long_name;
        }
        // Fallback to first result's formatted address
        const parts = data.results[0].formatted_address?.split(",");
        return parts?.[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }
  } catch {
    // Fall through to coordinates
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Search for a location - now uses Google Places via the Maps JavaScript API
 * This function is kept for backward compatibility but the MapSection now uses
 * Google Places Autocomplete directly
 */
export async function searchLocation(query: string): Promise<{ lat: number; lng: number; name: string }[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:EG&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      name: r.formatted_address,
    }));
  } catch {
    return [];
  }
}
