import { ClimateData } from "./climateApi";

// ================================================
// GLOBAL CONSTANTS (Egypt defaults)
// ================================================

export const SPECIFIC_YIELD = 1800;           // kWh/kW/year (Egypt average)
export const DEFAULT_USABLE_FRACTION = 0.60;
export const DEFAULT_ELECTRICITY_PRICE = 1.95; // EGP/kWh
export const CO2_FACTOR = 0.55;               // kg CO2 per kWh
export const SYSTEM_LIFETIME_YEARS = 25;

// ================================================
// PV TYPES - Area per kW
// ================================================

export const pvTypes = {
  A_high_power_mono: { 
    label: "High-Power Mono", 
    description: "540-700W monocrystalline, highest efficiency",
    areaPerKW: 6,  // m² needed per kW
  },
  B_standard_mono: { 
    label: "Standard Mono", 
    description: "360-450W monocrystalline, balanced choice",
    areaPerKW: 7,  // m² needed per kW
  },
  C_poly_economy: { 
    label: "Economy Poly", 
    description: "Polycrystalline, budget-friendly, needs more space",
    areaPerKW: 8.5, // m² needed per kW
  },
};

export type PVType = keyof typeof pvTypes;

// ================================================
// COST SCENARIOS (per kW)
// ================================================

export const costScenarios = {
  low: { 
    label: "Budget", 
    costPerKW: 12000, 
    description: "Basic components, local brands" 
  },
  medium: { 
    label: "Standard", 
    costPerKW: 18000, 
    description: "Quality components, mixed brands" 
  },
  high: { 
    label: "Premium", 
    costPerKW: 30000, 
    description: "Top-tier components, international brands" 
  },
};

export type CostScenario = keyof typeof costScenarios;

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
// TIME CONSTANTS
// ================================================

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
  // Step 1: Usable area
  usableArea: number;
  
  // Step 2: Max installable power
  kWMax: number;
  
  // Step 3: Practical installed power
  kWInstalled: number;
  
  // Step 4 & 5: Energy production
  energyYear: number;
  energyMonth: number;
  monthlyProduction: number[];
  
  // Step 6 & 7: Savings
  savingsYear: number;
  savingsMonth: number;
  
  // Step 8: System cost
  totalCost: number;
  costPerKW: number;
  
  // Step 9: Payback
  paybackYears: number;
  
  // Step 10: Coverage ratio
  coverageRatio: number;
  
  // Step 11: CO2 impact
  co2Saved: number;
  
  // Building Mode data
  buildingMode: boolean;
  numberOfUnits: number;
  avgUnitConsumption: number;
  effectiveMonthlyConsumption: number;
  annualConsumption: number;
  unitsCovered: number;
  
  // Metadata
  pvType: PVType;
  buildingType: BuildingType;
  costScenario: CostScenario;
  climateData?: ClimateData;
  
  // Warnings
  warnings: string[];
}

// ================================================
// MAIN CALCULATION ENGINE (kW-based method)
// ================================================

export function calculateSolarFeasibility(
  rooftopArea: number,
  climateData: ClimateData | null,
  electricityPrice: number,
  pvType: PVType,
  buildingType: BuildingType,
  costScenario: CostScenario,
  effectiveMonthlyConsumption: number,
  buildingMode: boolean = false,
  numberOfUnits: number = 1,
  avgUnitConsumption: number = 300
): SolarCalculation {
  const climate = climateData || defaultClimateData;
  const pv = pvTypes[pvType];
  const building = buildingTypes[buildingType];
  const scenario = costScenarios[costScenario];
  const warnings: string[] = [];

  // ============================================
  // STEP 1: Compute usable area
  // usable_area = roof_area_m2 × usable_fraction
  // ============================================
  const usableArea = rooftopArea * building.usableFraction;

  // ============================================
  // STEP 2: Compute max installable power
  // kW_max = usable_area / area_per_kW[pv_type]
  // ============================================
  const kWMax = usableArea / pv.areaPerKW;

  // ============================================
  // STEP 3: Practical installable power
  // kW_installed = floor(kW_max × 0.95)
  // ============================================
  const kWInstalled = Math.floor(kWMax * 0.95);

  // Rule 4: Warning for unusually large systems
  if (kWInstalled > 15 && buildingType === "residential") {
    warnings.push("⚠️ Unusually large system for residential – verify roof area.");
  }

  // ============================================
  // STEP 4: Annual energy production
  // Energy_year = kW_installed × specific_yield
  // ============================================
  const energyYear = kWInstalled * SPECIFIC_YIELD;

  // ============================================
  // STEP 5: Monthly energy
  // Energy_month = Energy_year / 12
  // ============================================
  const energyMonth = energyYear / 12;

  // Monthly distribution based on irradiance
  const totalIrradiance = climate.monthlyIrradiance.reduce((sum, v) => sum + v, 0);
  const monthlyProduction = climate.monthlyIrradiance.map((irradiance) => {
    const monthFraction = irradiance / totalIrradiance;
    return energyYear * monthFraction;
  });

  // ============================================
  // STEP 6: Annual savings
  // Savings_year = Energy_year × electricity_price
  // ============================================
  const savingsYear = energyYear * electricityPrice;

  // ============================================
  // STEP 7: Monthly savings
  // Savings_month = Savings_year / 12
  // ============================================
  const savingsMonth = savingsYear / 12;

  // Rule 1 & 2 validation (mathematical integrity)
  const savingsYearCheck = savingsMonth * 12;
  const energyYearCheck = energyMonth * 12;
  
  if (Math.abs(savingsYear - savingsYearCheck) > 0.01) {
    warnings.push("⚠️ Calculation error: Savings integrity check failed.");
  }
  if (Math.abs(energyYear - energyYearCheck) > 0.01) {
    warnings.push("⚠️ Calculation error: Energy integrity check failed.");
  }

  // ============================================
  // STEP 8: System cost
  // Total_cost = kW_installed × cost_per_kW[cost_scenario]
  // ============================================
  const totalCost = kWInstalled * scenario.costPerKW;
  const costPerKW = kWInstalled > 0 ? totalCost / kWInstalled : 0;

  // Rule 3 validation
  if (kWInstalled > 0 && Math.abs(totalCost / costPerKW - kWInstalled) > 0.01) {
    warnings.push("⚠️ Calculation error: Cost integrity check failed.");
  }

  // ============================================
  // STEP 9: Payback period
  // Payback_years = Total_cost / Savings_year
  // ============================================
  const paybackYears = savingsYear > 0 ? totalCost / savingsYear : 0;

  // ============================================
  // STEP 10: Coverage ratio & Building Mode
  // Coverage = Energy_year / Annual_consumption
  // units_covered = Energy_year / (avg_unit_consumption × 12)
  // ============================================
  const annualConsumption = effectiveMonthlyConsumption * 12;
  const coverageRatio = annualConsumption > 0 ? energyYear / annualConsumption : 0;
  
  // Units covered calculation (for Building Mode display)
  const unitAnnualConsumption = avgUnitConsumption * 12;
  const unitsCovered = unitAnnualConsumption > 0 ? energyYear / unitAnnualConsumption : 0;

  // ============================================
  // STEP 11: CO2 impact (tons/year)
  // CO2_saved = Energy_year × CO2_factor
  // ============================================
  const co2Saved = (energyYear * CO2_FACTOR) / 1000; // Convert to tons

  // Rule 6: Physical limits check
  if (kWInstalled > rooftopArea * 0.2) {
    warnings.push("⚠️ ERROR: kW exceeds physical limits of roof area.");
  }

  return {
    usableArea,
    kWMax,
    kWInstalled,
    energyYear,
    energyMonth,
    monthlyProduction,
    savingsYear,
    savingsMonth,
    totalCost,
    costPerKW,
    paybackYears,
    coverageRatio,
    co2Saved,
    buildingMode,
    numberOfUnits,
    avgUnitConsumption,
    effectiveMonthlyConsumption,
    annualConsumption,
    unitsCovered,
    pvType,
    buildingType,
    costScenario,
    climateData: climate,
    warnings,
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
