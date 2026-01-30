import { ClimateData } from "./climateApi";
import { PanelType, panelTypes, costScenarios } from "./solarData";

export interface DerivedInsights {
  // Panel selection
  panelType: PanelType;
  panelReason: string;
  
  // Usable fraction based on inferred building type
  usableFraction: number;
  buildingType: "residential" | "apartment" | "commercial" | "industrial";
  buildingReason: string;
  
  // Cost scenario based on market zone
  costScenario: "low" | "medium" | "high";
  costReason: string;
  
  // Electricity price based on consumption tier inference
  electricityPrice: number;
  priceReason: string;
  
  // Regional classification
  region: string;
  regionGHI: string;
  
  // Climate insights
  peakProductionMonths: string[];
  averageTemperature: number;
  temperatureImpact: string;
}

/**
 * Infer building type from rooftop area
 */
function inferBuildingType(rooftopArea: number): {
  type: "residential" | "apartment" | "commercial" | "industrial";
  usableFraction: number;
  reason: string;
} {
  if (rooftopArea < 80) {
    return {
      type: "residential",
      usableFraction: 0.50,
      reason: `Small roof (${rooftopArea}m²) - Typical residential house with obstacles`,
    };
  } else if (rooftopArea < 200) {
    return {
      type: "apartment",
      usableFraction: 0.60,
      reason: `Medium roof (${rooftopArea}m²) - Apartment building with moderate usable space`,
    };
  } else if (rooftopArea < 500) {
    return {
      type: "commercial",
      usableFraction: 0.70,
      reason: `Large roof (${rooftopArea}m²) - Commercial building with good usable area`,
    };
  } else {
    return {
      type: "industrial",
      usableFraction: 0.75,
      reason: `Very large roof (${rooftopArea}m²) - Industrial facility with optimal layout`,
    };
  }
}

/**
 * Classify Egyptian region from latitude
 */
function classifyRegion(lat: number): {
  region: string;
  expectedGHI: string;
  costScenario: "low" | "medium" | "high";
  costReason: string;
} {
  if (lat > 31.0) {
    return {
      region: "Northern Coast (Alexandria area)",
      expectedGHI: "1900-2100 kWh/m²/year",
      costScenario: "medium",
      costReason: "Urban coastal area - competitive market pricing",
    };
  } else if (lat > 29.5) {
    return {
      region: "Delta & Greater Cairo",
      expectedGHI: "2000-2200 kWh/m²/year",
      costScenario: "medium",
      costReason: "High-density urban area - standard market rates",
    };
  } else if (lat > 25.0) {
    return {
      region: "Upper Egypt",
      expectedGHI: "2200-2500 kWh/m²/year",
      costScenario: "low",
      costReason: "Less urban area - economy installations available",
    };
  } else {
    return {
      region: "Southern Desert (Aswan area)",
      expectedGHI: "2500-2800 kWh/m²/year",
      costScenario: "low",
      costReason: "Remote area - basic installation options",
    };
  }
}

/**
 * Estimate electricity price tier based on building type and area
 * Larger buildings typically have higher consumption → higher marginal rates
 */
function estimateElectricityPrice(
  buildingType: "residential" | "apartment" | "commercial" | "industrial",
  rooftopArea: number
): { price: number; reason: string } {
  switch (buildingType) {
    case "residential":
      if (rooftopArea < 60) {
        return { price: 1.50, reason: "Small residence - medium consumption tier (~300-600 kWh)" };
      }
      return { price: 1.95, reason: "Standard residence - high consumption tier (>600 kWh)" };
    
    case "apartment":
      return { price: 1.80, reason: "Apartment building - mixed consumption tiers" };
    
    case "commercial":
      return { price: 2.10, reason: "Commercial property - high consumption tier" };
    
    case "industrial":
      return { price: 2.30, reason: "Industrial facility - peak consumption tier" };
  }
}

/**
 * Select optimal panel type based on usable area and irradiance
 */
function selectPanelType(
  usableArea: number,
  irradiance: number
): { type: PanelType; reason: string } {
  const SMALL_THRESHOLD = 50;
  const MEDIUM_THRESHOLD = 100;
  const LARGE_THRESHOLD = 200;
  const HIGH_IRRADIANCE = 5.5;

  if (usableArea > LARGE_THRESHOLD) {
    return {
      type: "economy",
      reason: `Large usable area (${usableArea.toFixed(0)}m²) - Economy panels maximize cost savings`,
    };
  }

  if (usableArea < SMALL_THRESHOLD) {
    return {
      type: "modern",
      reason: `Compact usable area (${usableArea.toFixed(0)}m²) - Modern high-efficiency panels maximize capacity`,
    };
  }

  if (usableArea > MEDIUM_THRESHOLD && irradiance >= HIGH_IRRADIANCE) {
    return {
      type: "economy",
      reason: `Good area with high irradiance (${irradiance.toFixed(1)} kWh/m²/day) - Economy panels are cost-effective`,
    };
  }

  if (irradiance < HIGH_IRRADIANCE) {
    return {
      type: "modern",
      reason: `Moderate irradiance (${irradiance.toFixed(1)} kWh/m²/day) - Modern panels compensate with higher efficiency`,
    };
  }

  return {
    type: "standard",
    reason: `Balanced choice for ${usableArea.toFixed(0)}m² with ${irradiance.toFixed(1)} kWh/m²/day`,
  };
}

/**
 * Find peak production months from monthly irradiance
 */
function findPeakMonths(monthlyIrradiance: number[]): string[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const threshold = Math.max(...monthlyIrradiance) * 0.9;
  
  return monthlyIrradiance
    .map((val, idx) => ({ val, month: MONTHS[idx] }))
    .filter(({ val }) => val >= threshold)
    .map(({ month }) => month);
}

/**
 * Assess temperature impact on panel efficiency
 */
function assessTemperatureImpact(avgTemp: number): string {
  if (avgTemp > 28) {
    return "High temperatures may reduce efficiency by 5-10%. Consider ventilation gap under panels.";
  } else if (avgTemp > 22) {
    return "Moderate temperatures. Standard installation recommended.";
  } else {
    return "Favorable temperatures for optimal panel efficiency.";
  }
}

/**
 * Master function: Derive all insights from location and climate data
 */
export function deriveAllInsights(
  rooftopArea: number,
  lat: number,
  lng: number,
  climateData: ClimateData
): DerivedInsights {
  // 1. Infer building type from area
  const building = inferBuildingType(rooftopArea);
  
  // 2. Calculate usable area
  const usableArea = rooftopArea * building.usableFraction;
  
  // 3. Classify region from latitude
  const regionInfo = classifyRegion(lat);
  
  // 4. Select panel type based on usable area and irradiance
  const panel = selectPanelType(usableArea, climateData.annualAvgIrradiance);
  
  // 5. Estimate electricity price from building type
  const priceInfo = estimateElectricityPrice(building.type, rooftopArea);
  
  // 6. Find peak production months
  const peakMonths = findPeakMonths(climateData.monthlyIrradiance);
  
  // 7. Calculate average temperature and impact
  const avgTemp = climateData.monthlyTemperature.reduce((a, b) => a + b, 0) / 12;
  const tempImpact = assessTemperatureImpact(avgTemp);

  return {
    panelType: panel.type,
    panelReason: panel.reason,
    
    usableFraction: building.usableFraction,
    buildingType: building.type,
    buildingReason: building.reason,
    
    costScenario: regionInfo.costScenario,
    costReason: regionInfo.costReason,
    
    electricityPrice: priceInfo.price,
    priceReason: priceInfo.reason,
    
    region: regionInfo.region,
    regionGHI: regionInfo.expectedGHI,
    
    peakProductionMonths: peakMonths,
    averageTemperature: avgTemp,
    temperatureImpact: tempImpact,
  };
}
