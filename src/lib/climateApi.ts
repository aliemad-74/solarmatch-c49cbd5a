// NASA POWER API integration for solar climate data
// Documentation: https://power.larc.nasa.gov/docs/services/api/

export interface ClimateData {
  monthlyIrradiance: number[]; // kWh/m²/day for each month
  monthlyTemperature: number[]; // °C for each month
  monthlyWindSpeed: number[]; // m/s for each month
  monthlyCloudCover: number[]; // % for each month
  annualAvgIrradiance: number;
  location: {
    lat: number;
    lng: number;
  };
}

interface NASAPowerResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN?: Record<string, number>; // Solar irradiance
      T2M?: Record<string, number>; // Temperature at 2m
      WS10M?: Record<string, number>; // Wind speed at 10m
      CLOUD_AMT?: Record<string, number>; // Cloud amount
    };
  };
}

// Default climate data for Egypt (fallback if API fails)
export const defaultClimateData: ClimateData = {
  monthlyIrradiance: [4.2, 5.0, 5.8, 6.5, 7.0, 7.5, 7.3, 7.0, 6.2, 5.3, 4.5, 4.0],
  monthlyTemperature: [14, 15, 18, 22, 26, 29, 30, 30, 28, 24, 19, 15],
  monthlyWindSpeed: [3.5, 3.8, 4.2, 4.0, 3.8, 4.5, 4.8, 4.5, 4.0, 3.5, 3.2, 3.3],
  monthlyCloudCover: [25, 22, 18, 12, 8, 5, 3, 4, 8, 15, 20, 25],
  annualAvgIrradiance: 5.78,
  location: { lat: 30.0444, lng: 31.2357 },
};

/**
 * Fetches climate data from NASA POWER API
 * Uses climatology data (long-term averages) which doesn't require API keys
 */
export async function fetchClimateData(lat: number, lng: number): Promise<ClimateData> {
  try {
    // NASA POWER API - Climatology endpoint (no API key required)
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

    // Extract monthly values (keys are "1", "2", ... "12" for months)
    const monthlyIrradiance = extractMonthlyValues(params.ALLSKY_SFC_SW_DWN);
    const monthlyTemperature = extractMonthlyValues(params.T2M);
    const monthlyWindSpeed = extractMonthlyValues(params.WS10M);
    const monthlyCloudCover = extractMonthlyValues(params.CLOUD_AMT);

    const annualAvgIrradiance = monthlyIrradiance.reduce((a, b) => a + b, 0) / 12;

    return {
      monthlyIrradiance,
      monthlyTemperature,
      monthlyWindSpeed,
      monthlyCloudCover,
      annualAvgIrradiance,
      location: { lat, lng },
    };
  } catch (error) {
    console.error("Error fetching climate data:", error);
    return { ...defaultClimateData, location: { lat, lng } };
  }
}

/**
 * Extract monthly values from NASA POWER response
 * NASA returns data with keys "1" through "12" for months
 */
function extractMonthlyValues(data: Record<string, number> | undefined): number[] {
  if (!data) {
    return Array(12).fill(0);
  }

  const monthlyValues: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const value = data[month.toString()];
    // NASA uses -999 for missing data
    monthlyValues.push(value && value !== -999 ? value : 0);
  }
  return monthlyValues;
}

/**
 * Get a readable location name using reverse geocoding (Nominatim - free, no API key)
 */
export async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SolarMatch-MVP/1.0",
      },
    });

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    const data = await response.json();
    const address = data.address;

    // Try to get city, town, or village name
    const locationName = address?.city || address?.town || address?.village || address?.county || address?.state;
    return locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Search for a location using Nominatim (free geocoding)
 */
export async function searchLocation(query: string): Promise<{ lat: number; lng: number; name: string }[]> {
  try {
    // Limit search to Egypt
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SolarMatch-MVP/1.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const results = await response.json();
    return results.map((r: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      name: r.display_name,
    }));
  } catch {
    return [];
  }
}
