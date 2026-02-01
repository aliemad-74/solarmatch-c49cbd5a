// Solar Insights derived from NASA POWER climate data
// All calculations are panel-specific and actionable for solar installations

import { ClimateData } from "./climateApi";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export interface PeakProductionInfo {
  peakMonths: string[];
  peakHours: string;
  maxIrradiance: number;
}

export interface CleaningSchedule {
  dustyMonths: string[];
  dustyFrequency: string;
  normalFrequency: string;
  reason: string;
}

export interface TemperatureRisk {
  hotMonths: string[];
  avgEfficiencyLoss: number;
  dangerLevel: "none" | "moderate" | "high";
  maxTemp: number;
}

export interface WindRisk {
  riskLevel: "low" | "moderate" | "high";
  avgWindSpeed: number;
  riskyMonths: string[];
  recommendation: string;
}

export interface CloudCoverImpact {
  overcastMonths: string[];
  avgCloudCover: number;
  productionImpact: string;
}

export interface OptimalInstallation {
  bestMonths: string[];
  reason: string;
}

export interface MonthlyProductionLevel {
  month: string;
  level: "high" | "medium" | "low";
  irradiance: number;
}

/**
 * Get peak production months and optimal daily hours
 */
export function getPeakProductionInfo(climateData: ClimateData, isArabic: boolean = false): PeakProductionInfo {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const maxIrradiance = Math.max(...climateData.monthlyIrradiance);
  const threshold = maxIrradiance * 0.9;
  
  const peakMonths = climateData.monthlyIrradiance
    .map((val, idx) => ({ val, month: months[idx] }))
    .filter(({ val }) => val >= threshold)
    .map(({ month }) => month);
  
  return {
    peakMonths,
    peakHours: "10:00 - 14:00", // Peak solar hours for Egypt
    maxIrradiance,
  };
}

/**
 * Get cleaning schedule recommendations based on dust/sandstorm patterns
 * Egypt's Khamaseen season (March-May) brings hot, dry winds with sand
 */
export function getCleaningSchedule(climateData: ClimateData, isArabic: boolean = false): CleaningSchedule {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  
  // Egypt's Khamaseen season: March-May (indices 2, 3, 4)
  // High wind + low cloud cover + high temp = sandstorm/dust conditions
  const dustyMonthIndices: number[] = [];
  
  climateData.monthlyWindSpeed.forEach((wind, idx) => {
    const temp = climateData.monthlyTemperature[idx];
    const cloud = climateData.monthlyCloudCover[idx];
    
    // Dusty conditions: wind > 4 m/s, cloud < 30%, temp > 20°C (typical desert dust)
    // Also include Mar-May regardless (Khamaseen)
    if ((wind > 4 && cloud < 30 && temp > 20) || [2, 3, 4].includes(idx)) {
      dustyMonthIndices.push(idx);
    }
  });
  
  // Remove duplicates and sort
  const uniqueDustyIndices = [...new Set(dustyMonthIndices)].sort((a, b) => a - b);
  const dustyMonths = uniqueDustyIndices.map(idx => months[idx]);
  
  return {
    dustyMonths,
    dustyFrequency: isArabic ? "أسبوعياً إلى شهرياً" : "Weekly to monthly",
    normalFrequency: isArabic ? "كل 2-3 أشهر" : "Every 2-3 months",
    reason: isArabic 
      ? "موسم الخماسين يزيد تراكم الغبار" 
      : "Khamaseen sandstorm season increases dust buildup",
  };
}

/**
 * Analyze temperature risks for panel efficiency
 * Panel efficiency drops ~0.4% per degree above 25°C
 */
export function getTemperatureRisks(climateData: ClimateData, isArabic: boolean = false): TemperatureRisk {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const hotMonthIndices: number[] = [];
  let totalEfficiencyLoss = 0;
  let hotMonthCount = 0;
  
  climateData.monthlyTemperature.forEach((temp, idx) => {
    if (temp > 30) { // Threshold for "hot" that affects efficiency significantly
      hotMonthIndices.push(idx);
      // Calculate efficiency loss: ~0.4% per degree above 25°C
      const loss = (temp - 25) * 0.4;
      totalEfficiencyLoss += loss;
      hotMonthCount++;
    }
  });
  
  const maxTemp = Math.max(...climateData.monthlyTemperature);
  const avgEfficiencyLoss = hotMonthCount > 0 ? totalEfficiencyLoss / hotMonthCount : 0;
  
  let dangerLevel: "none" | "moderate" | "high" = "none";
  if (maxTemp > 38) dangerLevel = "high";
  else if (maxTemp > 32) dangerLevel = "moderate";
  
  return {
    hotMonths: hotMonthIndices.map(idx => months[idx]),
    avgEfficiencyLoss: Math.round(avgEfficiencyLoss * 10) / 10,
    dangerLevel,
    maxTemp,
  };
}

/**
 * Assess wind risk for panel mounting
 * Wind > 5 m/s = moderate risk, > 8 m/s = high risk
 */
export function getWindRisks(climateData: ClimateData, isArabic: boolean = false): WindRisk {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const avgWindSpeed = climateData.monthlyWindSpeed.reduce((a, b) => a + b, 0) / 12;
  const maxWind = Math.max(...climateData.monthlyWindSpeed);
  
  const riskyMonthIndices = climateData.monthlyWindSpeed
    .map((wind, idx) => ({ wind, idx }))
    .filter(({ wind }) => wind > 5)
    .map(({ idx }) => idx);
  
  let riskLevel: "low" | "moderate" | "high" = "low";
  let recommendation: string;
  
  if (maxWind > 8) {
    riskLevel = "high";
    recommendation = isArabic 
      ? "تأكد من تثبيت الألواح بإحكام" 
      : "Ensure secure panel mounting";
  } else if (maxWind > 5 || avgWindSpeed > 4.5) {
    riskLevel = "moderate";
    recommendation = isArabic 
      ? "افحص التثبيت موسمياً" 
      : "Inspect mounting seasonally";
  } else {
    recommendation = isArabic 
      ? "ظروف رياح مناسبة" 
      : "Favorable wind conditions";
  }
  
  return {
    riskLevel,
    avgWindSpeed: Math.round(avgWindSpeed * 10) / 10,
    riskyMonths: riskyMonthIndices.map(idx => months[idx]),
    recommendation,
  };
}

/**
 * Analyze cloud cover impact on production
 * Months with >30% cloud cover have reduced production
 */
export function getCloudCoverImpact(climateData: ClimateData, isArabic: boolean = false): CloudCoverImpact {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const avgCloudCover = climateData.monthlyCloudCover.reduce((a, b) => a + b, 0) / 12;
  
  const overcastIndices = climateData.monthlyCloudCover
    .map((cloud, idx) => ({ cloud, idx }))
    .filter(({ cloud }) => cloud > 35) // Above 35% is considered significant cloud cover
    .map(({ idx }) => idx);
  
  let productionImpact: string;
  if (avgCloudCover < 20) {
    productionImpact = isArabic ? "تأثير ضئيل - سماء صافية غالباً" : "Minimal impact - mostly clear skies";
  } else if (avgCloudCover < 35) {
    productionImpact = isArabic ? "تأثير معتدل في بعض الأشهر" : "Moderate impact in some months";
  } else {
    productionImpact = isArabic ? "تأثير ملحوظ - توقع إنتاج أقل" : "Notable impact - expect lower output";
  }
  
  return {
    overcastMonths: overcastIndices.map(idx => months[idx]),
    avgCloudCover: Math.round(avgCloudCover),
    productionImpact,
  };
}

/**
 * Determine optimal months for panel installation
 * Best: moderate temp (15-30°C) + low cloud cover + moderate wind
 */
export function getOptimalInstallMonth(climateData: ClimateData, isArabic: boolean = false): OptimalInstallation {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  
  const monthScores = climateData.monthlyTemperature.map((temp, idx) => {
    const cloud = climateData.monthlyCloudCover[idx];
    const wind = climateData.monthlyWindSpeed[idx];
    
    let score = 100;
    
    // Temperature penalty: ideal is 20-25°C
    if (temp < 15) score -= (15 - temp) * 5;
    else if (temp > 30) score -= (temp - 30) * 8;
    else if (temp > 25) score -= (temp - 25) * 3;
    
    // Cloud penalty
    score -= cloud * 0.5;
    
    // Extreme wind penalty
    if (wind > 6) score -= (wind - 6) * 10;
    
    return { idx, score, month: months[idx] };
  });
  
  // Sort by score descending
  monthScores.sort((a, b) => b.score - a.score);
  
  // Get top 3 months
  const bestMonths = monthScores.slice(0, 3).map(m => m.month);
  
  return {
    bestMonths,
    reason: isArabic 
      ? "درجات حرارة معتدلة وسماء صافية" 
      : "Moderate temps & clear skies",
  };
}

/**
 * Generate monthly production calendar with levels
 */
export function getMonthlyProductionCalendar(climateData: ClimateData, isArabic: boolean = false): MonthlyProductionLevel[] {
  const months = isArabic ? MONTHS_AR : MONTHS_EN;
  const maxIrradiance = Math.max(...climateData.monthlyIrradiance);
  const minIrradiance = Math.min(...climateData.monthlyIrradiance);
  const range = maxIrradiance - minIrradiance;
  
  return climateData.monthlyIrradiance.map((irr, idx) => {
    const normalizedLevel = (irr - minIrradiance) / range;
    
    let level: "high" | "medium" | "low";
    if (normalizedLevel >= 0.7) level = "high";
    else if (normalizedLevel >= 0.3) level = "medium";
    else level = "low";
    
    return {
      month: months[idx],
      level,
      irradiance: irr,
    };
  });
}

/**
 * Get all insights at once
 */
export interface AllSolarInsights {
  peakProduction: PeakProductionInfo;
  cleaningSchedule: CleaningSchedule;
  temperatureRisk: TemperatureRisk;
  windRisk: WindRisk;
  cloudCover: CloudCoverImpact;
  optimalInstall: OptimalInstallation;
  monthlyCalendar: MonthlyProductionLevel[];
}

export function getAllSolarInsights(climateData: ClimateData, isArabic: boolean = false): AllSolarInsights {
  return {
    peakProduction: getPeakProductionInfo(climateData, isArabic),
    cleaningSchedule: getCleaningSchedule(climateData, isArabic),
    temperatureRisk: getTemperatureRisks(climateData, isArabic),
    windRisk: getWindRisks(climateData, isArabic),
    cloudCover: getCloudCoverImpact(climateData, isArabic),
    optimalInstall: getOptimalInstallMonth(climateData, isArabic),
    monthlyCalendar: getMonthlyProductionCalendar(climateData, isArabic),
  };
}
