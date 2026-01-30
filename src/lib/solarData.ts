import { ClimateData } from "./climateApi";

// Panel types available in Egypt (2025)
export const panelTypes = {
  modern: { 
    label: "Modern High-Power", 
    description: "540-700W monocrystalline, 20% efficiency",
    sqmPerKW: 6, 
    degradation: 0.005,
    pricePerWatt: 7.5 
  },
  standard: { 
    label: "Standard Mono", 
    description: "360-450W monocrystalline, 18% efficiency",
    sqmPerKW: 7, 
    degradation: 0.005,
    pricePerWatt: 7.0 
  },
  economy: { 
    label: "Economy Poly", 
    description: "Polycrystalline, 16% efficiency, needs more space",
    sqmPerKW: 8.5, 
    degradation: 0.006,
    pricePerWatt: 6.5 
  },
};

export type PanelType = keyof typeof panelTypes;

/**
 * Auto-select optimal panel type based on:
 * - Usable roof area (smaller roofs need more efficient panels)
 * - Solar irradiance (high irradiance allows economy panels)
 */
export function selectOptimalPanelType(
  usableArea: number,
  annualAvgIrradiance: number
): { type: PanelType; reason: string } {
  // Thresholds based on Egyptian market reality
  const SMALL_ROOF_THRESHOLD = 50; // m² usable
  const MEDIUM_ROOF_THRESHOLD = 100; // m² usable
  const LARGE_ROOF_THRESHOLD = 200; // m² usable
  const HIGH_IRRADIANCE = 5.5; // kWh/m²/day (Egypt average is ~5.5-6.5)

  // Very large roof (>200 m²): Economy panels are most cost-effective
  if (usableArea > LARGE_ROOF_THRESHOLD) {
    return {
      type: "economy",
      reason: `Large roof (${usableArea.toFixed(0)} m²) - Economy panels offer best value at 8.5 m²/kW`,
    };
  }

  // Small roof (<50 m²): Prioritize high-efficiency to maximize capacity
  if (usableArea < SMALL_ROOF_THRESHOLD) {
    return {
      type: "modern",
      reason: `Compact roof (${usableArea.toFixed(0)} m²) - Modern panels maximize capacity with 6 m²/kW`,
    };
  }

  // Medium-large roof (100-200 m²) with good sun: Economy is viable
  if (usableArea > MEDIUM_ROOF_THRESHOLD && annualAvgIrradiance >= HIGH_IRRADIANCE) {
    return {
      type: "economy",
      reason: `Medium-large roof with good irradiance (${annualAvgIrradiance.toFixed(1)} kWh/m²/day) - Economy panels are cost-effective`,
    };
  }

  // Medium roof (50-100 m²) with high irradiance: Standard is optimal
  if (usableArea >= SMALL_ROOF_THRESHOLD && annualAvgIrradiance >= HIGH_IRRADIANCE) {
    return {
      type: "standard",
      reason: `Balanced choice for ${usableArea.toFixed(0)} m² with ${annualAvgIrradiance.toFixed(1)} kWh/m²/day irradiance`,
    };
  }

  // Medium roof with lower irradiance: Modern for efficiency
  if (usableArea < MEDIUM_ROOF_THRESHOLD && annualAvgIrradiance < HIGH_IRRADIANCE) {
    return {
      type: "modern",
      reason: `Medium roof with moderate irradiance - Modern panels compensate with higher efficiency`,
    };
  }

  // Default: Standard panels for balanced performance
  return {
    type: "standard",
    reason: `Optimal balance for ${usableArea.toFixed(0)} m² roof with ${annualAvgIrradiance.toFixed(1)} kWh/m²/day`,
  };
}

// Cost scenarios in EGP per kW
export const costScenarios = {
  low: { value: 12000, label: "Economy", description: "Basic equipment, local installation" },
  medium: { value: 18000, label: "Standard", description: "Quality equipment, professional installation" },
  high: { value: 30000, label: "Premium", description: "Top-tier equipment, extended warranty" },
};

// System constants (Egypt 2025 market data)
export const DEFAULT_USABLE_FRACTION = 0.60; // 60% of roof usable (residential default)
export const ENERGY_YIELD_PER_KW = 1800; // kWh per kW per year (Egypt realistic average)
export const CO2_FACTOR = 0.55; // kg CO2 saved per kWh (Egypt grid emission factor)
export const SYSTEM_LIFETIME_YEARS = 25; // Standard PV system lifetime
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
  panelType: PanelType;
  costWarning?: string;
}

export function calculateSolarFeasibility(
  rooftopArea: number,
  climateData: ClimateData | null,
  costScenario: "low" | "medium" | "high",
  electricityPrice: number,
  usableFraction: number = DEFAULT_USABLE_FRACTION,
  panelType: PanelType = "standard"
): SolarCalculation {
  const climate = climateData || defaultClimateData;
  const panel = panelTypes[panelType];

  // Calculate usable roof area
  const usableArea = rooftopArea * usableFraction;

  // Maximum installable capacity: kW = usable_area / m²/kW (varies by panel type)
  const maxCapacityKW = usableArea / panel.sqmPerKW;

  // System cost based on scenario
  const systemCost = maxCapacityKW * costScenarios[costScenario].value;

  // Consistency check: warn if cost seems unrealistic for the area
  let costWarning: string | undefined;
  const expectedCost = maxCapacityKW * costScenarios[costScenario].value;
  const maxReasonableCost = expectedCost * 1.2; // 20% tolerance
  if (systemCost > 500000 && maxCapacityKW < 20) {
    costWarning = `Note: For ${formatNumber(maxCapacityKW)} kW system, expected cost is ~${formatCurrency(expectedCost)}. Higher costs may indicate premium equipment or additional features.`;
  }

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
    panelType,
    costWarning,
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
