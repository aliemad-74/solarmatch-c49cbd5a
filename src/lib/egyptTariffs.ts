// Egypt Electricity Tariff System
// Supports dynamic tariffs from market_data scraping with static fallback
// Includes residential, commercial, and industrial tariff structures

export interface TariffTier {
  minKWh: number;
  maxKWh: number;
  rateEGP: number;
  tierName: string;
  tierNameAr: string;
}

export type TariffCategory = "residential" | "commercial" | "industrial";

// Static fallback tariff tiers (2026 rates)
export const DEFAULT_RESIDENTIAL_TARIFFS: TariffTier[] = [
  { minKWh: 0, maxKWh: 50, rateEGP: 0.68, tierName: "Tier 1 (0-50 kWh)", tierNameAr: "الشريحة الأولى (0-50 ك.و.س)" },
  { minKWh: 51, maxKWh: 100, rateEGP: 0.78, tierName: "Tier 2 (51-100 kWh)", tierNameAr: "الشريحة الثانية (51-100 ك.و.س)" },
  { minKWh: 101, maxKWh: 200, rateEGP: 0.95, tierName: "Tier 3 (101-200 kWh)", tierNameAr: "الشريحة الثالثة (101-200 ك.و.س)" },
  { minKWh: 201, maxKWh: 350, rateEGP: 1.55, tierName: "Tier 4 (201-350 kWh)", tierNameAr: "الشريحة الرابعة (201-350 ك.و.س)" },
  { minKWh: 351, maxKWh: 650, rateEGP: 1.95, tierName: "Tier 5 (351-650 kWh)", tierNameAr: "الشريحة الخامسة (351-650 ك.و.س)" },
  { minKWh: 651, maxKWh: 1000, rateEGP: 2.10, tierName: "Tier 6 (651-1000 kWh)", tierNameAr: "الشريحة السادسة (651-1000 ك.و.س)" },
  { minKWh: 1001, maxKWh: Infinity, rateEGP: 2.23, tierName: "Tier 7 (>1000 kWh)", tierNameAr: "الشريحة السابعة (>1000 ك.و.س)" },
];

// Commercial tariff tiers (2026 fallback)
export const DEFAULT_COMMERCIAL_TARIFFS: TariffTier[] = [
  { minKWh: 0, maxKWh: 100, rateEGP: 1.40, tierName: "Commercial 1 (0-100 kWh)", tierNameAr: "تجاري 1 (0-100 ك.و.س)" },
  { minKWh: 101, maxKWh: 250, rateEGP: 1.80, tierName: "Commercial 2 (101-250 kWh)", tierNameAr: "تجاري 2 (101-250 ك.و.س)" },
  { minKWh: 251, maxKWh: 600, rateEGP: 2.20, tierName: "Commercial 3 (251-600 kWh)", tierNameAr: "تجاري 3 (251-600 ك.و.س)" },
  { minKWh: 601, maxKWh: 1000, rateEGP: 2.85, tierName: "Commercial 4 (601-1000 kWh)", tierNameAr: "تجاري 4 (601-1000 ك.و.س)" },
  { minKWh: 1001, maxKWh: 2500, rateEGP: 3.15, tierName: "Commercial 5 (1001-2500 kWh)", tierNameAr: "تجاري 5 (1001-2500 ك.و.س)" },
  { minKWh: 2501, maxKWh: Infinity, rateEGP: 3.45, tierName: "Commercial 6 (>2500 kWh)", tierNameAr: "تجاري 6 (>2500 ك.و.س)" },
];

// Industrial tariff tiers (2026 fallback)
export const DEFAULT_INDUSTRIAL_TARIFFS: TariffTier[] = [
  { minKWh: 0, maxKWh: 200, rateEGP: 1.18, tierName: "Industrial 1 (0-200 kWh)", tierNameAr: "صناعي 1 (0-200 ك.و.س)" },
  { minKWh: 201, maxKWh: 500, rateEGP: 1.45, tierName: "Industrial 2 (201-500 kWh)", tierNameAr: "صناعي 2 (201-500 ك.و.س)" },
  { minKWh: 501, maxKWh: 1000, rateEGP: 1.72, tierName: "Industrial 3 (501-1000 kWh)", tierNameAr: "صناعي 3 (501-1000 ك.و.س)" },
  { minKWh: 1001, maxKWh: 5000, rateEGP: 1.95, tierName: "Industrial 4 (1001-5000 kWh)", tierNameAr: "صناعي 4 (1001-5000 ك.و.س)" },
  { minKWh: 5001, maxKWh: Infinity, rateEGP: 2.10, tierName: "Industrial 5 (>5000 kWh)", tierNameAr: "صناعي 5 (>5000 ك.و.س)" },
];

// Kept for backward compatibility
export const RESIDENTIAL_TARIFFS = DEFAULT_RESIDENTIAL_TARIFFS;

// Commercial tariff rates (backward compat flat rates)
export const COMMERCIAL_RATE = 2.85;
export const INDUSTRIAL_RATE = 1.95;

// Active tariffs state (wrapped in single object for testability)
const tariffState = {
  residential: DEFAULT_RESIDENTIAL_TARIFFS as TariffTier[],
  commercial: DEFAULT_COMMERCIAL_TARIFFS as TariffTier[],
  industrial: DEFAULT_INDUSTRIAL_TARIFFS as TariffTier[],
  commercialRate: COMMERCIAL_RATE,
  industrialRate: INDUSTRIAL_RATE,
  source: "static" as "static" | "live",
  effectiveDate: "2026",
};

/**
 * Reset tariffs to static defaults (useful for tests).
 */
export function resetTariffs() {
  tariffState.residential = DEFAULT_RESIDENTIAL_TARIFFS;
  tariffState.commercial = DEFAULT_COMMERCIAL_TARIFFS;
  tariffState.industrial = DEFAULT_INDUSTRIAL_TARIFFS;
  tariffState.commercialRate = COMMERCIAL_RATE;
  tariffState.industrialRate = INDUSTRIAL_RATE;
  tariffState.source = "static";
  tariffState.effectiveDate = "2026";
}

export function setActiveTariffs(
  tiers: TariffTier[],
  commercialRate?: number,
  industrialRate?: number,
  effectiveDate?: string,
  commercialTiers?: TariffTier[],
  industrialTiers?: TariffTier[],
) {
  if (tiers && tiers.length >= 5) {
    // Normalize maxKWh: null → Infinity for last tier
    tariffState.residential = tiers.map((t, i) => ({
      ...t,
      maxKWh: t.maxKWh == null || t.maxKWh === 0 ? (i === tiers.length - 1 ? Infinity : t.maxKWh) : t.maxKWh,
    }));
    tariffState.source = "live";
    if (commercialRate) tariffState.commercialRate = commercialRate;
    if (industrialRate) tariffState.industrialRate = industrialRate;
    if (effectiveDate) tariffState.effectiveDate = effectiveDate;
    
    if (commercialTiers && commercialTiers.length >= 3) {
      tariffState.commercial = commercialTiers.map((t, i) => ({
        ...t,
        maxKWh: t.maxKWh == null || t.maxKWh === 0 ? (i === commercialTiers.length - 1 ? Infinity : t.maxKWh) : t.maxKWh,
      }));
    }
    if (industrialTiers && industrialTiers.length >= 3) {
      tariffState.industrial = industrialTiers.map((t, i) => ({
        ...t,
        maxKWh: t.maxKWh == null || t.maxKWh === 0 ? (i === industrialTiers.length - 1 ? Infinity : t.maxKWh) : t.maxKWh,
      }));
    }
  }
}

export function getActiveTariffs() {
  return {
    tiers: tariffState.residential,
    commercialTiers: tariffState.commercial,
    industrialTiers: tariffState.industrial,
    commercialRate: tariffState.commercialRate,
    industrialRate: tariffState.industrialRate,
    source: tariffState.source,
    effectiveDate: tariffState.effectiveDate,
  };
}

/**
 * Get the appropriate tariff tiers based on building type / tariff category.
 */
export function getTiersForCategory(category: TariffCategory): TariffTier[] {
  switch (category) {
    case "commercial": return tariffState.commercial;
    case "industrial": return tariffState.industrial;
    default: return tariffState.residential;
  }
}

/**
 * Determine tariff category from building type and consumption level.
 * High-consumption commercial, industrial, and agricultural users 
 * should use commercial/industrial tariff brackets.
 */
export function detectTariffCategory(
  buildingType: string,
  monthlyConsumption?: number,
): TariffCategory {
  // Direct mapping for non-residential types
  if (buildingType === "commercial") return "commercial";
  if (buildingType === "industrial") return "industrial";
  if (buildingType === "agricultural") return "commercial"; // Farms use commercial tariffs
  
  // High-consumption residential/apartment → still residential tiers  
  // (Egyptian law: residential meters stay on residential tariff)
  return "residential";
}

export interface TariffCalculation {
  totalCost: number;
  effectiveRate: number;
  currentTier: TariffTier;
  tierBreakdown: { tier: TariffTier; kWh: number; cost: number }[];
  potentialTierAfterSolar?: TariffTier;
  monthlySavings?: number;
  tariffCategory?: TariffCategory;
}

// Calculate electricity bill using tiered pricing (uses active tariffs)
export function calculateTieredBill(monthlyKWh: number, customTiers?: TariffTier[]): TariffCalculation {
  const tiers = customTiers || tariffState.residential;
  let remaining = monthlyKWh;
  let totalCost = 0;
  const breakdown: { tier: TariffTier; kWh: number; cost: number }[] = [];
  let currentTier = tiers[0];

  for (const tier of tiers) {
    if (remaining <= 0) break;
    
    const tierRange = tier.maxKWh === Infinity ? remaining : tier.maxKWh - tier.minKWh + 1;
    const kWhInTier = Math.min(remaining, tierRange);
    const tierCost = kWhInTier * tier.rateEGP;
    
    breakdown.push({ tier, kWh: kWhInTier, cost: tierCost });
    totalCost += tierCost;
    remaining -= kWhInTier;
    
    if (monthlyKWh >= tier.minKWh) {
      currentTier = tier;
    }
  }

  const effectiveRate = monthlyKWh > 0 ? totalCost / monthlyKWh : 0;

  return { totalCost, effectiveRate, currentTier, tierBreakdown: breakdown };
}

/**
 * Calculate bill with automatic tariff category detection.
 */
export function calculateBillForCategory(
  monthlyKWh: number,
  buildingType: string,
): TariffCalculation & { tariffCategory: TariffCategory } {
  const category = detectTariffCategory(buildingType, monthlyKWh);
  const tiers = getTiersForCategory(category);
  const result = calculateTieredBill(monthlyKWh, tiers);
  
  if (import.meta.env.DEV) console.log(`[tariff] Category: ${category}, kWh: ${monthlyKWh}, effectiveRate: ${result.effectiveRate.toFixed(4)}`);
  
  return { ...result, tariffCategory: category };
}

// Calculate bill after solar offset
export function calculateBillAfterSolar(
  monthlyConsumption: number,
  monthlySolarProduction: number,
  customTiers?: TariffTier[]
): TariffCalculation & { beforeSolar: TariffCalculation; savingsAmount: number } {
  const beforeSolar = calculateTieredBill(monthlyConsumption, customTiers);
  const netConsumption = Math.max(0, monthlyConsumption - monthlySolarProduction);
  const afterSolar = calculateTieredBill(netConsumption, customTiers);
  
  const savingsAmount = beforeSolar.totalCost - afterSolar.totalCost;
  
  return {
    ...afterSolar,
    beforeSolar,
    savingsAmount,
    potentialTierAfterSolar: afterSolar.currentTier,
    monthlySavings: savingsAmount,
  };
}

/**
 * Building Mode: calculate bill PER UNIT (each apartment has its own meter),
 * then multiply by number of units. This avoids pushing the building total
 * into the highest tier when individual apartments are actually in lower tiers.
 *
 * Solar production is divided equally across units before applying tiers.
 */
export function calculateBillAfterSolarPerUnit(
  avgUnitMonthlyConsumption: number,
  numberOfUnits: number,
  totalMonthlySolarProduction: number,
  buildingType: string = "apartment"
): TariffCalculation & { beforeSolar: TariffCalculation; savingsAmount: number } {
  const units = Math.max(1, numberOfUnits);
  const category = detectTariffCategory(buildingType);
  const tiers = getTiersForCategory(category);

  const perUnitSolar = totalMonthlySolarProduction / units;

  const perUnitBefore = calculateTieredBill(avgUnitMonthlyConsumption, tiers);
  const perUnitNet = Math.max(0, avgUnitMonthlyConsumption - perUnitSolar);
  const perUnitAfter = calculateTieredBill(perUnitNet, tiers);

  const beforeSolar: TariffCalculation = {
    totalCost: perUnitBefore.totalCost * units,
    effectiveRate: perUnitBefore.effectiveRate,
    currentTier: perUnitBefore.currentTier,
    tierBreakdown: perUnitBefore.tierBreakdown.map((b) => ({
      tier: b.tier,
      kWh: b.kWh * units,
      cost: b.cost * units,
    })),
  };

  const afterSolar: TariffCalculation = {
    totalCost: perUnitAfter.totalCost * units,
    effectiveRate: perUnitAfter.effectiveRate,
    currentTier: perUnitAfter.currentTier,
    tierBreakdown: perUnitAfter.tierBreakdown.map((b) => ({
      tier: b.tier,
      kWh: b.kWh * units,
      cost: b.cost * units,
    })),
  };

  const savingsAmount = beforeSolar.totalCost - afterSolar.totalCost;

  if (import.meta.env.DEV) {
    console.log(
      `[per-unit tariff] units: ${units}, avg/unit: ${avgUnitMonthlyConsumption}, ` +
      `tier/unit: ${perUnitBefore.currentTier.tierName}, ` +
      `effRate: ${perUnitBefore.effectiveRate.toFixed(4)}, ` +
      `monthlySavings(total): ${savingsAmount.toFixed(2)}`
    );
  }

  return {
    ...afterSolar,
    beforeSolar,
    savingsAmount,
    potentialTierAfterSolar: afterSolar.currentTier,
    monthlySavings: savingsAmount,
  };
}

// Get tier for a given consumption level
export function getTierForConsumption(monthlyKWh: number): TariffTier {
  for (const tier of tariffState.residential) {
    if (monthlyKWh <= tier.maxKWh) {
      return tier;
    }
  }
  return tariffState.residential[tariffState.residential.length - 1];
}

// Get effective electricity price based on consumption tier
export function getEffectivePrice(monthlyConsumption: number): number {
  const calculation = calculateTieredBill(monthlyConsumption);
  return calculation.effectiveRate;
}

// Format tier name for display
export function formatTierName(tier: TariffTier, locale: 'en' | 'ar' = 'en'): string {
  return locale === 'ar' ? tier.tierNameAr : tier.tierName;
}
