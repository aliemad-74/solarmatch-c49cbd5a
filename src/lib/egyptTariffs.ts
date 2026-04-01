// Egypt Electricity Tariff System
// Supports dynamic tariffs from market_data scraping with static fallback

export interface TariffTier {
  minKWh: number;
  maxKWh: number;
  rateEGP: number;
  tierName: string;
  tierNameAr: string;
}

// Static fallback tariff tiers (2024/2025 rates)
export const DEFAULT_RESIDENTIAL_TARIFFS: TariffTier[] = [
  { minKWh: 0, maxKWh: 50, rateEGP: 0.58, tierName: "Tier 1 (0-50 kWh)", tierNameAr: "الشريحة الأولى (0-50 ك.و.س)" },
  { minKWh: 51, maxKWh: 100, rateEGP: 0.73, tierName: "Tier 2 (51-100 kWh)", tierNameAr: "الشريحة الثانية (51-100 ك.و.س)" },
  { minKWh: 101, maxKWh: 200, rateEGP: 1.12, tierName: "Tier 3 (101-200 kWh)", tierNameAr: "الشريحة الثالثة (101-200 ك.و.س)" },
  { minKWh: 201, maxKWh: 350, rateEGP: 1.41, tierName: "Tier 4 (201-350 kWh)", tierNameAr: "الشريحة الرابعة (201-350 ك.و.س)" },
  { minKWh: 351, maxKWh: 650, rateEGP: 1.69, tierName: "Tier 5 (351-650 kWh)", tierNameAr: "الشريحة الخامسة (351-650 ك.و.س)" },
  { minKWh: 651, maxKWh: 1000, rateEGP: 1.95, tierName: "Tier 6 (651-1000 kWh)", tierNameAr: "الشريحة السادسة (651-1000 ك.و.س)" },
  { minKWh: 1001, maxKWh: Infinity, rateEGP: 2.28, tierName: "Tier 7 (>1000 kWh)", tierNameAr: "الشريحة السابعة (>1000 ك.و.س)" },
];

// Kept for backward compatibility
export const RESIDENTIAL_TARIFFS = DEFAULT_RESIDENTIAL_TARIFFS;

// Commercial tariff rates (fallback)
export const COMMERCIAL_RATE = 1.85;
export const INDUSTRIAL_RATE = 1.65;

// Active tariffs - can be overridden by scraped data
let _activeTariffs: TariffTier[] = DEFAULT_RESIDENTIAL_TARIFFS;
let _activeCommercialRate = COMMERCIAL_RATE;
let _activeIndustrialRate = INDUSTRIAL_RATE;
let _tariffSource: "static" | "live" = "static";
let _tariffEffectiveDate = "2024/2025";

export function setActiveTariffs(
  tiers: TariffTier[],
  commercialRate?: number,
  industrialRate?: number,
  effectiveDate?: string,
) {
  if (tiers && tiers.length >= 5) {
    // Normalize maxKWh: null → Infinity for last tier
    _activeTariffs = tiers.map((t, i) => ({
      ...t,
      maxKWh: t.maxKWh == null || t.maxKWh === 0 ? (i === tiers.length - 1 ? Infinity : t.maxKWh) : t.maxKWh,
    }));
    _tariffSource = "live";
    if (commercialRate) _activeCommercialRate = commercialRate;
    if (industrialRate) _activeIndustrialRate = industrialRate;
    if (effectiveDate) _tariffEffectiveDate = effectiveDate;
  }
}

export function getActiveTariffs() {
  return {
    tiers: _activeTariffs,
    commercialRate: _activeCommercialRate,
    industrialRate: _activeIndustrialRate,
    source: _tariffSource,
    effectiveDate: _tariffEffectiveDate,
  };
}

export interface TariffCalculation {
  totalCost: number;
  effectiveRate: number;
  currentTier: TariffTier;
  tierBreakdown: { tier: TariffTier; kWh: number; cost: number }[];
  potentialTierAfterSolar?: TariffTier;
  monthlySavings?: number;
}

// Calculate electricity bill using tiered pricing (uses active tariffs)
export function calculateTieredBill(monthlyKWh: number, customTiers?: TariffTier[]): TariffCalculation {
  const tiers = customTiers || _activeTariffs;
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

// Calculate bill after solar offset
export function calculateBillAfterSolar(
  monthlyConsumption: number,
  monthlySolarProduction: number
): TariffCalculation & { beforeSolar: TariffCalculation; savingsAmount: number } {
  const beforeSolar = calculateTieredBill(monthlyConsumption);
  const netConsumption = Math.max(0, monthlyConsumption - monthlySolarProduction);
  const afterSolar = calculateTieredBill(netConsumption);
  
  const savingsAmount = beforeSolar.totalCost - afterSolar.totalCost;
  
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
  for (const tier of _activeTariffs) {
    if (monthlyKWh <= tier.maxKWh) {
      return tier;
    }
  }
  return _activeTariffs[_activeTariffs.length - 1];
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
