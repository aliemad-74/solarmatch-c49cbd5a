// Mock climate data for Egyptian cities (kWh/m²/day average solar irradiance)
export const cityIrradianceData: Record<string, { name: string; lat: number; lng: number; monthlyIrradiance: number[] }> = {
  zagazig: {
    name: "Zagazig",
    lat: 30.5877,
    lng: 31.5020,
    // Monthly average solar irradiance (kWh/m²/day)
    monthlyIrradiance: [4.2, 5.0, 5.8, 6.5, 7.0, 7.5, 7.3, 7.0, 6.2, 5.3, 4.5, 4.0],
  },
  cairo: {
    name: "Cairo",
    lat: 30.0444,
    lng: 31.2357,
    monthlyIrradiance: [4.0, 4.8, 5.6, 6.3, 6.8, 7.2, 7.0, 6.8, 6.0, 5.1, 4.3, 3.8],
  },
  alexandria: {
    name: "Alexandria",
    lat: 31.2001,
    lng: 29.9187,
    monthlyIrradiance: [3.8, 4.5, 5.3, 6.0, 6.5, 7.0, 6.8, 6.5, 5.7, 4.8, 4.0, 3.5],
  },
};

// Cost scenarios in EGP per kW
export const costScenarios = {
  low: { value: 12000, label: "Economy", description: "Basic equipment, local installation" },
  medium: { value: 18000, label: "Standard", description: "Quality equipment, professional installation" },
  high: { value: 30000, label: "Premium", description: "Top-tier equipment, extended warranty" },
};

// System constants
export const SYSTEM_EFFICIENCY = 0.18; // 18% panel efficiency
export const PERFORMANCE_RATIO = 0.80; // System losses (inverter, wiring, etc.)
export const KW_PER_SQM = 0.18; // kW capacity per square meter (typical)
export const CO2_FACTOR = 0.5; // kg CO2 saved per kWh (Egypt grid average)
export const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SolarCalculation {
  maxCapacityKW: number;
  systemCost: number;
  monthlyProduction: number[];
  yearlyProduction: number;
  monthlySavings: number;
  yearlySavings: number;
  paybackYears: number;
  co2Reduction: number;
}

export function calculateSolarFeasibility(
  rooftopArea: number,
  cityKey: string,
  costScenario: "low" | "medium" | "high",
  electricityPrice: number
): SolarCalculation {
  const city = cityIrradianceData[cityKey];
  if (!city) {
    throw new Error("Invalid city selected");
  }

  // Maximum installable capacity
  const maxCapacityKW = rooftopArea * KW_PER_SQM;

  // System cost based on scenario
  const systemCost = maxCapacityKW * costScenarios[costScenario].value;

  // Monthly energy production (kWh)
  const monthlyProduction = city.monthlyIrradiance.map((irradiance, index) => {
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
