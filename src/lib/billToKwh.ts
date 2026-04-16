/**
 * Bill-to-kWh Estimation Utility
 * Converts an Egyptian electricity bill amount (EGP) to estimated monthly consumption (kWh)
 * using the current active tariff structure.
 */

import { getActiveTariffs, calculateTieredBill, TariffTier } from "./egyptTariffs";

export interface BillEstimation {
  estimatedConsumptionKwh: number;
  estimatedTariffBracket: string;
  estimatedTariffBracketAr: string;
  estimatedBillFromKwh: number;
  electricityPricePerKwh: number;
}

/**
 * Deterministic binary-search conversion from bill amount to kWh.
 * Simulates consumption values and finds the closest match to the given bill.
 */
export function estimateKwhFromBill(billAmount: number): BillEstimation {
  // Guard against invalid inputs
  if (!Number.isFinite(billAmount) || billAmount <= 0) {
    console.warn("[billToKwh] Invalid bill amount:", billAmount);
    return {
      estimatedConsumptionKwh: 0,
      estimatedTariffBracket: "",
      estimatedTariffBracketAr: "",
      estimatedBillFromKwh: 0,
      electricityPricePerKwh: 0,
    };
  }

  const { tiers } = getActiveTariffs();

  // Binary search: find kWh where calculateTieredBill(kWh).totalCost ≈ billAmount
  let low = 1;
  let high = 50000; // upper bound for search
  let bestKwh = 1;
  let bestDiff = Infinity;

  // First check if bill is lower than 1 kWh cost
  const minBill = calculateTieredBill(1, tiers).totalCost;
  if (billAmount < minBill) {
    bestKwh = 1;
  } else {
    for (let i = 0; i < 50; i++) {
      const mid = Math.floor((low + high) / 2);
      const calc = calculateTieredBill(mid, tiers);
      const diff = Math.abs(calc.totalCost - billAmount);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestKwh = mid;
      }

      if (calc.totalCost < billAmount) {
        low = mid + 1;
      } else if (calc.totalCost > billAmount) {
        high = mid - 1;
      } else {
        break; // exact match
      }

      if (low > high) break;
    }
  }

  // Ensure positive result
  bestKwh = Math.max(1, bestKwh);

  // Get the tier bracket for the estimated consumption
  const finalCalc = calculateTieredBill(bestKwh, tiers);
  const bracket = finalCalc.currentTier;

  // Log for debugging
  console.log("[billToKwh] Input bill:", billAmount, "EGP");
  console.log("[billToKwh] Estimated kWh:", bestKwh);
  console.log("[billToKwh] Estimated bracket:", bracket.tierName);
  console.log("[billToKwh] Recalculated bill:", finalCalc.totalCost.toFixed(2), "EGP");

  const electricityPricePerKwh = finalCalc.effectiveRate > 0 ? finalCalc.effectiveRate : bracket.rateEGP;

  console.log("[billToKwh] Electricity price per kWh:", electricityPricePerKwh.toFixed(4));

  return {
    estimatedConsumptionKwh: bestKwh,
    estimatedTariffBracket: bracket.tierName,
    estimatedTariffBracketAr: bracket.tierNameAr,
    estimatedBillFromKwh: finalCalc.totalCost,
    electricityPricePerKwh,
  };
}

/**
 * Get tariff info for a known kWh consumption value.
 */
export function getTariffForConsumption(monthlyKwh: number): BillEstimation {
  if (!Number.isFinite(monthlyKwh) || monthlyKwh <= 0) {
    const { tiers } = getActiveTariffs();
    const fallbackRate = tiers[0]?.rateEGP ?? 0.68;
    return {
      estimatedConsumptionKwh: 0,
      estimatedTariffBracket: tiers[0]?.tierName ?? "",
      estimatedTariffBracketAr: tiers[0]?.tierNameAr ?? "",
      estimatedBillFromKwh: 0,
      electricityPricePerKwh: fallbackRate,
    };
  }

  const { tiers } = getActiveTariffs();
  const calc = calculateTieredBill(Math.round(monthlyKwh), tiers);
  const bracket = calc.currentTier;
  const electricityPricePerKwh = calc.effectiveRate > 0 ? calc.effectiveRate : bracket.rateEGP;

  console.log("[getTariffForConsumption] kWh:", monthlyKwh, "bracket:", bracket.tierName, "price:", electricityPricePerKwh.toFixed(4));

  return {
    estimatedConsumptionKwh: Math.round(monthlyKwh),
    estimatedTariffBracket: bracket.tierName,
    estimatedTariffBracketAr: bracket.tierNameAr,
    estimatedBillFromKwh: calc.totalCost,
    electricityPricePerKwh,
  };
}
