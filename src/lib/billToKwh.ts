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

  return {
    estimatedConsumptionKwh: bestKwh,
    estimatedTariffBracket: bracket.tierName,
    estimatedTariffBracketAr: bracket.tierNameAr,
    estimatedBillFromKwh: finalCalc.totalCost,
  };
}
