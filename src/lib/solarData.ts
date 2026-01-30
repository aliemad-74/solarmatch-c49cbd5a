import { ClimateData } from "./climateApi";

// ================================================
// PANEL SPECIFICATIONS (Egypt 2025 Market)
// ================================================

export const panelTypes = {
  modern: { 
    label: "High-Power Mono", 
    description: "540-700W monocrystalline, 20% efficiency",
    sqmPerKW: 6,           // m² per kW
    panelWatt: 550,        // Watts per panel
    panelArea: 2.2,        // m² per panel
    panelPrice: 4500,      // EGP per panel
    degradation: 0.005,
  },
  standard: { 
    label: "Standard Mono", 
    description: "360-450W monocrystalline, 18% efficiency",
    sqmPerKW: 7,           // m² per kW
    panelWatt: 400,        // Watts per panel
    panelArea: 2.0,        // m² per panel
    panelPrice: 3000,      // EGP per panel
    degradation: 0.005,
  },
  economy: { 
    label: "Economy Poly", 
    description: "Polycrystalline, 16% efficiency, needs more space",
    sqmPerKW: 8.5,         // m² per kW
    panelWatt: 330,        // Watts per panel
    panelArea: 2.1,        // m² per panel
    panelPrice: 2200,      // EGP per panel
    degradation: 0.006,
  },
};

export type PanelType = keyof typeof panelTypes;

// ================================================
// COST PACKAGES (EGP per kW - Full System)
// ================================================

export const costScenarios = {
  low: { value: 12000, label: "Economy", description: "Basic equipment, local installation" },
  medium: { value: 18000, label: "Standard", description: "Quality equipment, professional installation" },
  high: { value: 30000, label: "Premium", description: "Top-tier equipment, extended warranty" },
};

// Other costs for panel-based pricing (inverter + mounting + wiring + installation)
export const OTHER_COSTS_PER_KW = 8000; // EGP per kW

// ================================================
// SYSTEM CONSTANTS
// ================================================

export const DEFAULT_USABLE_FRACTION = 0.60;
export const INSTALLATION_FACTOR = 0.95;     // 95% of max capacity installable in practice
export const ENERGY_YIELD_PER_KW = 1800;     // kWh per kW per year (Egypt average)
export const CO2_FACTOR = 0.55;              // kg CO2 saved per kWh
export const SYSTEM_LIFETIME_YEARS = 25;
export const CONSISTENCY_THRESHOLD = 1.3;    // 30% tolerance for cost check

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

export type PricingMode = "per_kw" | "per_panel";

export interface SolarCalculation {
  // Area calculations
  usableArea: number;
  
  // Capacity calculations
  kWMax: number;
  kWInstalled: number;
  
  // Panel details (for per_panel mode)
  panelsCount: number;
  totalWatts: number;
  
  // Cost breakdown
  systemCost: number;
  panelCost: number;
  otherCosts: number;
  costPerKWReal: number;
  
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
  pricingMode: PricingMode;
  climateData?: ClimateData;
  
  // Consistency check
  expectedCost: number;
  costWarning?: string;
}

// ================================================
// METHOD 1: COST PER kW (RECOMMENDED)
// ================================================

function calculatePerKW(
  usableArea: number,
  panel: typeof panelTypes[PanelType],
  costScenario: "low" | "medium" | "high"
): { kWMax: number; kWInstalled: number; systemCost: number; panelsCount: number } {
  // kW_max = usable_area / area_per_kW
  const kWMax = usableArea / panel.sqmPerKW;
  
  // kW_installed = floor(kW_max × 0.95) - practical installation limit
  const kWInstalled = Math.floor(kWMax * INSTALLATION_FACTOR * 10) / 10; // Round to 1 decimal
  
  // Total_System_Cost = kW_installed × Cost_per_kW
  const systemCost = kWInstalled * costScenarios[costScenario].value;
  
  // Estimate panels count for display
  const panelsCount = Math.floor((kWInstalled * 1000) / panel.panelWatt);
  
  return { kWMax, kWInstalled, systemCost, panelsCount };
}

// ================================================
// METHOD 2: COST PER PANEL (OPTIONAL)
// ================================================

function calculatePerPanel(
  usableArea: number,
  panel: typeof panelTypes[PanelType]
): { kWMax: number; kWInstalled: number; systemCost: number; panelsCount: number; panelCost: number; otherCosts: number; totalWatts: number } {
  // Panels_count = floor(usable_area / panel_area)
  const panelsCount = Math.floor(usableArea / panel.panelArea);
  
  // Total_Watts = Panels_count × panel_watt
  const totalWatts = panelsCount * panel.panelWatt;
  
  // kW_installed = Total_Watts / 1000 (CRITICAL: Convert W → kW)
  const kWInstalled = totalWatts / 1000;
  const kWMax = kWInstalled / INSTALLATION_FACTOR; // Reverse calculate max
  
  // Panel_Cost = Panels_count × panel_price
  const panelCost = panelsCount * panel.panelPrice;
  
  // Other_costs = kW_installed × 8,000 EGP
  const otherCosts = kWInstalled * OTHER_COSTS_PER_KW;
  
  // Total_System_Cost = Panel_Cost + Other_costs
  const systemCost = panelCost + otherCosts;
  
  return { kWMax, kWInstalled, systemCost, panelsCount, panelCost, otherCosts, totalWatts };
}

// ================================================
// CONSISTENCY CHECK (MANDATORY)
// ================================================

function checkConsistency(
  systemCost: number,
  kWInstalled: number
): { expectedCost: number; warning?: string } {
  // expected_cost = kW_installed × 18,000 (medium scenario baseline)
  const expectedCost = kWInstalled * costScenarios.medium.value;
  
  // If Total_System_Cost > expected_cost × 1.3: Show warning
  if (systemCost > expectedCost * CONSISTENCY_THRESHOLD) {
    return {
      expectedCost,
      warning: `⚠️ Cost inconsistent with roof area. Expected ~${formatCurrency(expectedCost)} for ${formatNumber(kWInstalled)} kW. Possible unit error or premium equipment.`,
    };
  }
  
  // Also warn if cost is suspiciously low
  if (systemCost < expectedCost * 0.5) {
    return {
      expectedCost,
      warning: `⚠️ Cost seems too low. Expected ~${formatCurrency(expectedCost)} for ${formatNumber(kWInstalled)} kW. Verify pricing inputs.`,
    };
  }
  
  return { expectedCost };
}

// ================================================
// MAIN CALCULATION FUNCTION
// ================================================

export function calculateSolarFeasibility(
  rooftopArea: number,
  climateData: ClimateData | null,
  costScenario: "low" | "medium" | "high",
  electricityPrice: number,
  usableFraction: number = DEFAULT_USABLE_FRACTION,
  panelType: PanelType = "standard",
  pricingMode: PricingMode = "per_kw"
): SolarCalculation {
  const climate = climateData || defaultClimateData;
  const panel = panelTypes[panelType];

  // Step 1: Calculate usable area
  const usableArea = rooftopArea * usableFraction;

  // Step 2: Calculate capacity and cost based on pricing mode
  let kWMax: number;
  let kWInstalled: number;
  let systemCost: number;
  let panelsCount: number;
  let panelCost = 0;
  let otherCosts = 0;
  let totalWatts = 0;

  if (pricingMode === "per_panel") {
    const result = calculatePerPanel(usableArea, panel);
    kWMax = result.kWMax;
    kWInstalled = result.kWInstalled;
    systemCost = result.systemCost;
    panelsCount = result.panelsCount;
    panelCost = result.panelCost;
    otherCosts = result.otherCosts;
    totalWatts = result.totalWatts;
  } else {
    const result = calculatePerKW(usableArea, panel, costScenario);
    kWMax = result.kWMax;
    kWInstalled = result.kWInstalled;
    systemCost = result.systemCost;
    panelsCount = result.panelsCount;
    totalWatts = kWInstalled * 1000;
  }

  // Step 3: Consistency check (MANDATORY)
  const consistency = checkConsistency(systemCost, kWInstalled);

  // Step 4: Calculate real cost per kW
  const costPerKWReal = kWInstalled > 0 ? systemCost / kWInstalled : 0;

  // Step 5: Energy production calculations
  const yearlyProduction = kWInstalled * ENERGY_YIELD_PER_KW;
  
  const totalIrradiance = climate.monthlyIrradiance.reduce((sum, v) => sum + v, 0);
  const monthlyProduction = climate.monthlyIrradiance.map((irradiance) => {
    const monthFraction = irradiance / totalIrradiance;
    return yearlyProduction * monthFraction;
  });

  // Step 6: Savings calculations
  const yearlySavings = yearlyProduction * electricityPrice;
  const monthlySavings = yearlySavings / 12;

  // Step 7: Payback period
  const paybackYears = yearlySavings > 0 ? systemCost / yearlySavings : 0;

  // Step 8: Environmental impact (tons CO2 per year)
  const co2Reduction = (yearlyProduction * CO2_FACTOR) / 1000;

  return {
    usableArea,
    kWMax,
    kWInstalled,
    panelsCount,
    totalWatts,
    systemCost,
    panelCost,
    otherCosts,
    costPerKWReal,
    monthlyProduction,
    yearlyProduction,
    monthlySavings,
    yearlySavings,
    paybackYears,
    co2Reduction,
    panelType,
    pricingMode,
    climateData: climate,
    expectedCost: consistency.expectedCost,
    costWarning: consistency.warning,
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
