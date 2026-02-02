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
// SYSTEM PACKAGES (combines PV type + cost)
// ================================================

export interface SystemPackage {
  name: string;
  pvType: "polycrystalline" | "standard_mono" | "high_power_mono";
  efficiency: string;
  areaPerKW: number;
  costPerKW: number;
  costRange: string;
  justification: string;
  typicalPanelWattage: number; // Typical wattage per panel for this tier
}

export const systemPackages: Record<string, SystemPackage> = {
  economy: {
    name: "Economy Value",
    pvType: "polycrystalline",
    efficiency: "16%",
    areaPerKW: 8.5,
    costPerKW: 15000,
    costRange: "15,000",
    justification: "Uses less expensive polycrystalline panels with good value for larger installations.",
    typicalPanelWattage: 350, // 330-400W typical poly panels
  },
  standard: {
    name: "Standard Balanced",
    pvType: "standard_mono",
    efficiency: "18%",
    areaPerKW: 7,
    costPerKW: 19000,
    costRange: "19,000",
    justification: "Balanced choice with standard monocrystalline modules for optimal price-performance.",
    typicalPanelWattage: 450, // 400-500W standard mono panels
  },
  premium: {
    name: "Premium High-Density",
    pvType: "high_power_mono",
    efficiency: "20%+",
    areaPerKW: 6,
    costPerKW: 26000,
    costRange: "26,000",
    justification: "Highest performance per m² using premium high-power monocrystalline modules.",
    typicalPanelWattage: 600, // 550-700W high-power mono panels (like Canadian Solar TOPBiHiKu7)
  },
};

export type PackageType = keyof typeof systemPackages;

// Legacy PV types (for backward compatibility)
export const pvTypes = {
  A_high_power_mono: { 
    label: "High-Power Mono", 
    description: "540-700W monocrystalline, highest efficiency",
    areaPerKW: 6,
  },
  B_standard_mono: { 
    label: "Standard Mono", 
    description: "360-450W monocrystalline, balanced choice",
    areaPerKW: 7,
  },
  C_poly_economy: { 
    label: "Economy Poly", 
    description: "Polycrystalline, budget-friendly, needs more space",
    areaPerKW: 8.5,
  },
};

export type PVType = keyof typeof pvTypes;

// Legacy cost scenarios (for backward compatibility)
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
// CONNECTION RECOMMENDATION
// ================================================

export interface ConnectionRecommendation {
  systemType: "Grid-Connected" | "Hybrid (Grid + Battery)" | "Off-grid possible";
  reason: string;
  icon: "grid" | "hybrid" | "offgrid";
}

export function getConnectionRecommendation(coverageRatio: number): ConnectionRecommendation {
  const coveragePercent = coverageRatio * 100;
  
  if (coveragePercent < 100) {
    return {
      systemType: "Grid-Connected",
      reason: "System does not fully cover demand. Off-grid is not viable.",
      icon: "grid",
    };
  } else if (coveragePercent >= 100 && coveragePercent <= 120) {
    return {
      systemType: "Hybrid (Grid + Battery)",
      reason: "System barely covers demand. Grid backup required.",
      icon: "hybrid",
    };
  } else {
    return {
      systemType: "Off-grid possible",
      reason: "System has sufficient surplus for full independence.",
      icon: "offgrid",
    };
  }
}

// ================================================
// CALCULATION RESULT INTERFACE
// ================================================

export interface PackageCalculation {
  packageKey: PackageType;
  package: SystemPackage;
  kWInstalled: number;
  totalCost: number;
  energyYear: number;
  savingsYear: number;
  paybackYears: number;
  coverageRatio: number;
  panelCount: number; // Number of panels needed
}

export interface SolarCalculation {
  // Step 1: Usable area
  usableArea: number;
  
  // Step 2: Max installable power (based on selected package)
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
  
  // Step 8: System cost (for selected package)
  totalCost: number;
  costPerKW: number;
  
  // Step 9: Payback
  paybackYears: number;
  
  // Step 10: Coverage ratio
  coverageRatio: number;
  
  // Step 11: CO2 impact
  co2Saved: number;
  
  // Connection recommendation
  connectionRecommendation: ConnectionRecommendation;
  
  // Package options (all three calculated)
  packageOptions: PackageCalculation[];
  selectedPackage: PackageType;
  
  // Building Mode data
  buildingMode: boolean;
  numberOfUnits: number;
  avgUnitConsumption: number;
  effectiveMonthlyConsumption: number;
  annualConsumption: number;
  unitsCovered: number;
  
  // Panel count
  panelCount: number;
  panelWattage: number;
  
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
  const building = buildingTypes[buildingType];
  const warnings: string[] = [];

  // ============================================
  // RESIDENTIAL COVERAGE CAP CONSTANTS
  // ============================================
  const isResidentialType = buildingType === "residential" || buildingType === "apartment";
  const MAX_RESIDENTIAL_COVERAGE = 1.5; // 150% cap for residential
  const annualConsumptionForCap = effectiveMonthlyConsumption * 12;

  // ============================================
  // CALCULATE ALL THREE PACKAGE OPTIONS
  // ============================================
  const packageOptions: PackageCalculation[] = (Object.entries(systemPackages) as [PackageType, SystemPackage][]).map(([key, pkg]) => {
    // Step 1: Usable area
    const usableArea = rooftopArea * building.usableFraction;
    
    // Step 2: Max kW for this package's panel type
    const kWMax = usableArea / pkg.areaPerKW;
    
    // Step 3: Practical installed (with residential cap)
    let kWInstalled = Math.floor(kWMax * 0.95);
    
    // Apply residential coverage cap for package options
    if (isResidentialType && annualConsumptionForCap > 0) {
      const uncappedEnergyYear = kWInstalled * SPECIFIC_YIELD;
      const uncappedCoverageRatio = uncappedEnergyYear / annualConsumptionForCap;
      
      if (uncappedCoverageRatio > MAX_RESIDENTIAL_COVERAGE) {
        const requiredAnnualProduction = annualConsumptionForCap * MAX_RESIDENTIAL_COVERAGE;
        kWInstalled = Math.max(1, Math.floor(requiredAnnualProduction / SPECIFIC_YIELD));
      }
    }
    
    // Step 4: Energy production
    const energyYear = kWInstalled * SPECIFIC_YIELD;
    
    // Step 6: Savings
    const savingsYear = energyYear * electricityPrice;
    
    // Step 8: Cost
    const totalCost = kWInstalled * pkg.costPerKW;
    
    // Step 9: Payback
    const paybackYears = savingsYear > 0 ? totalCost / savingsYear : 0;
    
    // Step 10: Coverage
    const annualConsumption = effectiveMonthlyConsumption * 12;
    const coverageRatio = annualConsumption > 0 ? energyYear / annualConsumption : 0;
    
    // Calculate panel count
    const panelCount = Math.ceil((kWInstalled * 1000) / pkg.typicalPanelWattage);
    
    return {
      packageKey: key,
      package: pkg,
      kWInstalled,
      totalCost,
      energyYear,
      savingsYear,
      paybackYears,
      coverageRatio,
      panelCount,
    };
  });

  // Use selected PV type to determine which package to show as "selected"
  const selectedPackage: PackageType = 
    pvType === "A_high_power_mono" ? "premium" :
    pvType === "C_poly_economy" ? "economy" : "standard";
  
  const selectedPkg = systemPackages[selectedPackage];
  const pv = pvTypes[pvType];
  const scenario = costScenarios[costScenario];

  // ============================================
  // STEP 1: Compute usable area
  // ============================================
  const usableArea = rooftopArea * building.usableFraction;

  // ============================================
  // STEP 2: Compute max installable power
  // ============================================
  const kWMax = usableArea / pv.areaPerKW;

  // ============================================
  // STEP 3: Practical installed power (with residential cap)
  // ============================================
  let kWInstalled = Math.floor(kWMax * 0.95);
  let wasResized = false;
  
  // Apply residential coverage cap (using constants from above)
  if (isResidentialType && effectiveMonthlyConsumption > 0) {
    const uncappedEnergyYear = kWInstalled * SPECIFIC_YIELD;
    const uncappedCoverageRatio = uncappedEnergyYear / annualConsumptionForCap;
    
    if (uncappedCoverageRatio > MAX_RESIDENTIAL_COVERAGE) {
      // Calculate capped system size
      const requiredAnnualProduction = annualConsumptionForCap * MAX_RESIDENTIAL_COVERAGE;
      const cappedKW = Math.floor(requiredAnnualProduction / SPECIFIC_YIELD);
      kWInstalled = Math.max(1, cappedKW); // Ensure at least 1 kW
      wasResized = true;
      warnings.push("⚠️ System size was automatically adjusted to avoid excessive oversizing for residential use.");
      warnings.push("*System limited to 150% of annual demand to minimize unused generation.*");
    }
  }

  // Rule 4: Warning for unusually large systems
  if (kWInstalled > 15 && buildingType === "residential") {
    warnings.push("⚠️ Unusually large system for residential – verify roof area.");
  }

  // ============================================
  // STEP 4: Annual energy production
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
  // ============================================
  const annualConsumption = effectiveMonthlyConsumption * 12;
  const coverageRatio = annualConsumption > 0 ? energyYear / annualConsumption : 0;
  
  // Units covered calculation (for Building Mode display)
  const unitAnnualConsumption = avgUnitConsumption * 12;
  const unitsCovered = unitAnnualConsumption > 0 ? energyYear / unitAnnualConsumption : 0;

  // Panel count calculation based on selected package
  const panelWattage = selectedPkg.typicalPanelWattage;
  const panelCount = Math.ceil((kWInstalled * 1000) / panelWattage);

  // ============================================
  // STEP 11: CO2 impact (tons/year)
  // ============================================
  const co2Saved = (energyYear * CO2_FACTOR) / 1000; // Convert to tons

  // Rule 6: Physical limits check
  if (kWInstalled > rooftopArea * 0.2) {
    warnings.push("⚠️ ERROR: kW exceeds physical limits of roof area.");
  }

  // Get connection recommendation based on coverage
  const connectionRecommendation = getConnectionRecommendation(coverageRatio);

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
    connectionRecommendation,
    packageOptions,
    selectedPackage,
    buildingMode,
    numberOfUnits,
    avgUnitConsumption,
    effectiveMonthlyConsumption,
    annualConsumption,
    unitsCovered,
    panelCount,
    panelWattage,
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
