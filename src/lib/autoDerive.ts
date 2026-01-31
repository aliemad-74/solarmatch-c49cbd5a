import { ClimateData } from "./climateApi";
import { PanelType, panelTypes, BuildingType, buildingTypes } from "./solarData";

export interface DerivedInsights {
  panelType: PanelType;
  panelReason: string;
  buildingType: BuildingType;
  buildingReason: string;
  electricityPrice: number;
  priceReason: string;
  region: string;
  regionGHI: string;
  peakProductionMonths: string[];
  averageTemperature: number;
  temperatureImpact: string;
}

function classifyRegion(lat: number): { region: string; expectedGHI: string } {
  if (lat > 31.0) return { region: "Northern Coast", expectedGHI: "1900-2100 kWh/m²/year" };
  if (lat > 29.5) return { region: "Delta & Cairo", expectedGHI: "2000-2200 kWh/m²/year" };
  if (lat > 25.0) return { region: "Upper Egypt", expectedGHI: "2200-2500 kWh/m²/year" };
  return { region: "Southern Desert", expectedGHI: "2500-2800 kWh/m²/year" };
}

function findPeakMonths(monthlyIrradiance: number[]): string[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const threshold = Math.max(...monthlyIrradiance) * 0.9;
  return monthlyIrradiance
    .map((val, idx) => ({ val, month: MONTHS[idx] }))
    .filter(({ val }) => val >= threshold)
    .map(({ month }) => month);
}

export function deriveInsights(
  rooftopArea: number,
  lat: number,
  climateData: ClimateData
): DerivedInsights {
  const usableArea = rooftopArea * 0.6; // Default assumption
  const regionInfo = classifyRegion(lat);
  const peakMonths = findPeakMonths(climateData.monthlyIrradiance);
  const avgTemp = climateData.monthlyTemperature.reduce((a, b) => a + b, 0) / 12;

  // Auto-suggest panel type
  let panelType: PanelType = "standard";
  let panelReason = "Balanced choice for typical rooftops";
  if (usableArea < 50) {
    panelType = "modern";
    panelReason = "Small roof - high-efficiency panels recommended";
  } else if (usableArea > 200) {
    panelType = "economy";
    panelReason = "Large roof - economy panels are cost-effective";
  }

  // Auto-suggest building type
  let buildingType: BuildingType = "apartment";
  let buildingReason = "Medium-sized roof";
  if (rooftopArea < 80) {
    buildingType = "residential";
    buildingReason = "Small residential roof";
  } else if (rooftopArea > 500) {
    buildingType = "industrial";
    buildingReason = "Large industrial roof";
  } else if (rooftopArea > 200) {
    buildingType = "commercial";
    buildingReason = "Commercial-sized roof";
  }

  return {
    panelType,
    panelReason,
    buildingType,
    buildingReason,
    electricityPrice: 1.95,
    priceReason: "Default residential rate",
    region: regionInfo.region,
    regionGHI: regionInfo.expectedGHI,
    peakProductionMonths: peakMonths,
    averageTemperature: avgTemp,
    temperatureImpact: avgTemp > 28 ? "High temps may reduce efficiency" : "Favorable conditions",
  };
}
