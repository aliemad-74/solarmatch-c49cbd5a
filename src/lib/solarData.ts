import { ClimateData } from "./climateApi";

// Cost scenarios in EGP per kW
export const costScenarios = {
  low: { value: 12000, label: "Economy", description: "Basic equipment, local installation" },
  medium: { value: 18000, label: "Standard", description: "Quality equipment, professional installation" },
  high: { value: 30000, label: "Premium", description: "Top-tier equipment, extended warranty" },
};

// System constants (Egypt 2025 market data)
export const SQM_PER_KW = 7; // 7 m² per kW (modern 540-700W panels)
export const DEFAULT_USABLE_FRACTION = 0.60; // 60% of roof usable (residential default)
export const ENERGY_YIELD_PER_KW = 1800; // kWh per kW per year (Egypt realistic average)
export const CO2_FACTOR = 0.55; // kg CO2 saved per kWh (Egypt grid emission factor)
export const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Default climate data (fallback)
export const defaultClimateData: ClimateData = {
  monthlyIrradiance: [4.2, 5.0, 5.8, 6.5, 7.0, 7.5, 7.3, 7.0, 6.2, 5.3, 4.5, 4.0],
  monthlyTemperature: [14, 15, 18, 22, 26, 29, 30, 30, 28, 24, 19, 15],
  monthlyWindSpeed: [3.5, 3.8, 4.2, 4.0, 3.8, 4.5, 4.8, 4.5, 4.0, 3.5, 3.2, 3.3],
  monthlyCloudCover: [25, 22, 18, 12, 8, 5, 3, 4, 8, 15, 20, 25],
  annualAvgIrradiance: 5.78,
  location: { lat: 30.0444, lng: 31.2357 },
};

export interface SolarCalculation {
  maxCapacityKW: number;
  usableArea: number;
  systemCost: number;
  monthlyProduction: number[];
  yearlyProduction: number;
  monthlySavings: number;
  yearlySavings: number;
  paybackYears: number;
  co2Reduction: number;
  climateData?: ClimateData;
}

export function calculateSolarFeasibility(
  rooftopArea: number,
  climateData: ClimateData | null,
  costScenario: "low" | "medium" | "high",
  electricityPrice: number,
  usableFraction: number = DEFAULT_USABLE_FRACTION
): SolarCalculation {
  const climate = climateData || defaultClimateData;

  // Calculate usable roof area
  const usableArea = rooftopArea * usableFraction;

  // Maximum installable capacity: kW = usable_area / 7 m²/kW
  const maxCapacityKW = usableArea / SQM_PER_KW;

  // System cost based on scenario
  const systemCost = maxCapacityKW * costScenarios[costScenario].value;

  // Annual energy production using Egypt yield factor (1800 kWh/kW/year)
  const yearlyProduction = maxCapacityKW * ENERGY_YIELD_PER_KW;

  // Monthly distribution based on irradiance patterns
  const totalIrradiance = climate.monthlyIrradiance.reduce((sum, v) => sum + v, 0);
  const monthlyProduction = climate.monthlyIrradiance.map((irradiance) => {
    const monthFraction = irradiance / totalIrradiance;
    return yearlyProduction * monthFraction;
  });

  // Savings calculations
  const yearlySavings = yearlyProduction * electricityPrice;
  const monthlySavings = yearlySavings / 12;

  // Payback period
  const paybackYears = yearlySavings > 0 ? systemCost / yearlySavings : 0;

  // Environmental impact: kg CO2 saved per year, converted to tons
  const co2Reduction = (yearlyProduction * CO2_FACTOR) / 1000;

  return {
    maxCapacityKW,
    usableArea,
    systemCost,
    monthlyProduction,
    yearlyProduction,
    monthlySavings,
    yearlySavings,
    paybackYears,
    co2Reduction,
    climateData: climate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
