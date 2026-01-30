import { ClimateData } from "./climateApi";

// Cost scenarios in EGP per kW
export const costScenarios = {
  low: { value: 12000, label: "Economy", description: "Basic equipment, local installation" },
  medium: { value: 18000, label: "Standard", description: "Quality equipment, professional installation" },
  high: { value: 30000, label: "Premium", description: "Top-tier equipment, extended warranty" },
};

// System constants
export const PERFORMANCE_RATIO = 0.80; // System losses (inverter, wiring, etc.)
export const KW_PER_SQM = 0.18; // kW capacity per square meter (typical)
export const CO2_FACTOR = 0.5; // kg CO2 saved per kWh (Egypt grid average)
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
  electricityPrice: number
): SolarCalculation {
  const climate = climateData || defaultClimateData;

  // Maximum installable capacity
  const maxCapacityKW = rooftopArea * KW_PER_SQM;

  // System cost based on scenario
  const systemCost = maxCapacityKW * costScenarios[costScenario].value;

  // Monthly energy production (kWh)
  const monthlyProduction = climate.monthlyIrradiance.map((irradiance, index) => {
    const dailyProduction = maxCapacityKW * irradiance * PERFORMANCE_RATIO;
    return dailyProduction * DAYS_PER_MONTH[index];
  });

  // Yearly totals
  const yearlyProduction = monthlyProduction.reduce((sum, monthly) => sum + monthly, 0);
  const monthlySavings = (yearlyProduction / 12) * electricityPrice;
  const yearlySavings = yearlyProduction * electricityPrice;

  // Payback period
  const paybackYears = yearlySavings > 0 ? systemCost / yearlySavings : 0;

  // Environmental impact
  const co2Reduction = yearlyProduction * CO2_FACTOR / 1000; // tons per year

  return {
    maxCapacityKW,
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
