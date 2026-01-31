import { ClimateData } from "./climateApi";

// ================================================
// PANEL SPECIFICATIONS (Egypt 2025 Market)
// ================================================

export const panelTypes = {
  modern: { 
    label: "High-Power Mono", 
    description: "540-700W monocrystalline, 20% efficiency",
    panelWatt: 550,        // Watts per panel
    panelArea: 2.4,        // m² per panel (physical size + spacing)
    panelPrice: 4500,      // EGP per panel
    degradation: 0.005,
  },
  standard: { 
    label: "Standard Mono", 
    description: "360-450W monocrystalline, 18% efficiency",
    panelWatt: 400,        // Watts per panel
    panelArea: 2.0,        // m² per panel
    panelPrice: 3000,      // EGP per panel
    degradation: 0.005,
  },
  economy: { 
    label: "Economy Poly", 
    description: "Polycrystalline, 16% efficiency, needs more space",
    panelWatt: 330,        // Watts per panel
    panelArea: 2.1,        // m² per panel
    panelPrice: 2200,      // EGP per panel
    degradation: 0.006,
  },
};

export type PanelType = keyof typeof panelTypes;

// ================================================
// BUILDING TYPES & USABLE FRACTIONS
// ================================================

export const buildingTypes = {
  residential: { label: "Residential House", usableFraction: 0.50, description: "Typical house with obstacles (40-50%)" },
  apartment: { label: "Apartment Building", usableFraction: 0.60, description: "Moderate usable space (55-65%)" },
  commercial: { label: "Commercial", usableFraction: 0.70, description: "Good usable area (65-75%)" },
  industrial: { label: "Industrial", usableFraction: 0.75, description: "Optimal flat roof (70-80%)" },
};

export type BuildingType = keyof typeof buildingTypes;

// ================================================
// OTHER COSTS (inverter + mounting + wiring + installation)
// ================================================

export const OTHER_COSTS_PER_KW = 8000; // EGP per kW

// ================================================
// SYSTEM CONSTANTS
// ================================================

export const ENERGY_YIELD_PER_KW = 1800;     // kWh per kW per year (Egypt average)
export const CO2_FACTOR = 0.55;              // kg CO2 saved per kWh
export const SYSTEM_LIFETIME_YEARS = 25;
export const CONSISTENCY_THRESHOLD = 1.3;    // 30% tolerance for cost check
export const BASELINE_COST_PER_KW = 18000;   // Medium scenario for consistency check

export const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Default climate data (Cairo fallback)
export const defaultClimateData: ClimateData = {
  monthlyIrradiance: [4.2, 5.0, 5.8, 6.5, 7.0, 7.5, 7.3, 7.0, 6.2, 5.3, 4.5, 4.0],
  monthlyTemperature: [14, 15, 18, 22, 26, 29, 30, 30, 28, 24, 19, 15],
  monthlyWindSpeed: [3.5, 3.8, 4.2, 4.0, 3.8, 4.5, 4.8, 4.5, 4.0, 3.5, 3.2, 3.3],
  monthlyCloudCover: [25, 22, 18, 12, 8, 5, 3, 4, 8, 15, 20, 25],
  annualAvgIrradiance: 5.78,
  location: { lat: 30.0444, lng: 31.2357 },
};

// ================================================
// CALCULATION RESULT INTERFACE
// ================================================

export interface SolarCalculation {
  // Area
  usableArea: number;
  
  // Panels
  panelsCount: number;
  totalWatts: number;
  kWInstalled: number;
  
  // Cost breakdown (PER PANEL METHOD)
  panelCost: number;           // panels_count × panel_price
  otherCosts: number;          // kW_installed × 8,000
  systemCost: number;          // panel_cost + other_costs
  costPerKWReal: number;       // system_cost / kW_installed
  
  // Production & savings
  monthlyProduction: number[];
  yearlyProduction: number;
  monthlySavings: number;
  yearlySavings: number;
  paybackYears: number;
  
  // Environmental
  co2Reduction: number;
  
  // Metadata
  panelType: PanelType;
  buildingType: BuildingType;
  climateData?: ClimateData;
  
  // Consistency check
  expectedCost: number;
  costWarning?: string;
}

// ================================================
// MAIN CALCULATION - PER PANEL METHOD
// ================================================

export function calculateSolarFeasibility(
  rooftopArea: number,
  climateData: ClimateData | null,
  electricityPrice: number,
  panelType: PanelType,
  buildingType: BuildingType
): SolarCalculation {
  const climate = climateData || defaultClimateData;
  const panel = panelTypes[panelType];
  const building = buildingTypes[buildingType];

  // ============================================
  // STEP 1: Calculate usable area
  // ============================================
  const usableArea = rooftopArea * building.usableFraction;

  // ============================================
  // STEP 2: Calculate panels count
  // panels_count = floor(usable_area / panel_area)
  // ============================================
  const panelsCount = Math.floor(usableArea / panel.panelArea);

  // ============================================
  // STEP 3: Calculate total watts and kW
  // total_watts = panels_count × panel_watt
  // kW_installed = total_watts / 1000
  // ============================================
  const totalWatts = panelsCount * panel.panelWatt;
  const kWInstalled = totalWatts / 1000;

  // ============================================
  // STEP 4: Calculate costs (PER PANEL METHOD)
  // panel_cost = panels_count × panel_price
  // other_costs = kW_installed × 8,000
  // system_cost = panel_cost + other_costs
  // ============================================
  const panelCost = panelsCount * panel.panelPrice;
  const otherCosts = kWInstalled * OTHER_COSTS_PER_KW;
  const systemCost = panelCost + otherCosts;

  // ============================================
  // STEP 5: Real cost per kW
  // ============================================
  const costPerKWReal = kWInstalled > 0 ? systemCost / kWInstalled : 0;

  // ============================================
  // STEP 6: Consistency check
  // expected_cost = kW_installed × 18,000
  // ============================================
  const expectedCost = kWInstalled * BASELINE_COST_PER_KW;
  let costWarning: string | undefined;
  
  if (systemCost > expectedCost * CONSISTENCY_THRESHOLD) {
    costWarning = `⚠️ Cost higher than expected. Calculated: ${formatCurrency(systemCost)}, Expected: ~${formatCurrency(expectedCost)}`;
  } else if (systemCost < expectedCost * 0.5 && kWInstalled > 0) {
    costWarning = `⚠️ Cost lower than expected. Calculated: ${formatCurrency(systemCost)}, Expected: ~${formatCurrency(expectedCost)}`;
  }

  // ============================================
  // STEP 7: Energy production
  // yearly = kW_installed × 1800
  // ============================================
  const yearlyProduction = kWInstalled * ENERGY_YIELD_PER_KW;
  
  const totalIrradiance = climate.monthlyIrradiance.reduce((sum, v) => sum + v, 0);
  const monthlyProduction = climate.monthlyIrradiance.map((irradiance) => {
    const monthFraction = irradiance / totalIrradiance;
    return yearlyProduction * monthFraction;
  });

  // ============================================
  // STEP 8: Savings
  // yearly_savings = yearly_production × electricity_price
  // ============================================
  const yearlySavings = yearlyProduction * electricityPrice;
  const monthlySavings = yearlySavings / 12;

  // ============================================
  // STEP 9: Payback
  // payback_years = system_cost / yearly_savings
  // ============================================
  const paybackYears = yearlySavings > 0 ? systemCost / yearlySavings : 0;

  // ============================================
  // STEP 10: CO2 reduction (tons/year)
  // ============================================
  const co2Reduction = (yearlyProduction * CO2_FACTOR) / 1000;

  return {
    usableArea,
    panelsCount,
    totalWatts,
    kWInstalled,
    panelCost,
    otherCosts,
    systemCost,
    costPerKWReal,
    monthlyProduction,
    yearlyProduction,
    monthlySavings,
    yearlySavings,
    paybackYears,
    co2Reduction,
    panelType,
    buildingType,
    climateData: climate,
    expectedCost,
    costWarning,
  };
}

// ================================================
// FORMATTING UTILITIES
// ================================================

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
