import { describe, it, expect } from "vitest";
import {
  DEFAULT_RESIDENTIAL_TARIFFS,
  calculateTieredBill,
  getEffectivePrice,
} from "./egyptTariffs";
import { CO2_FACTOR } from "./solarData";
import { calculateROIProjection } from "./roiProjections";

describe("2026 tariff tiers (FIX 1)", () => {
  it("uses 2.45 EGP for Tier 6 (651-1000 kWh)", () => {
    const tier6 = DEFAULT_RESIDENTIAL_TARIFFS.find((t) => t.minKWh === 651);
    expect(tier6?.rateEGP).toBe(2.45);
  });

  it("uses 2.95 EGP for Tier 7 (>1000 kWh)", () => {
    const tier7 = DEFAULT_RESIDENTIAL_TARIFFS.find((t) => t.minKWh === 1001);
    expect(tier7?.rateEGP).toBe(2.95);
  });
});

describe("calculateTieredBill tier ranges (FIX 2)", () => {
  it("bills exactly 50 kWh in Tier 1 (no +1)", () => {
    const r = calculateTieredBill(50);
    expect(r.tierBreakdown).toHaveLength(1);
    expect(r.tierBreakdown[0].kWh).toBe(50);
    expect(r.totalCost).toBeCloseTo(0.68 * 50, 6);
  });

  it("splits 100 kWh as 50 + 50 across Tiers 1-2", () => {
    const r = calculateTieredBill(100);
    expect(r.tierBreakdown.map((b) => b.kWh)).toEqual([50, 50]);
    expect(r.totalCost).toBeCloseTo(50 * 0.68 + 50 * 0.78, 6);
  });

  it("splits 200 kWh as 50 + 50 + 100 across Tiers 1-3", () => {
    const r = calculateTieredBill(200);
    expect(r.tierBreakdown.map((b) => b.kWh)).toEqual([50, 50, 100]);
    expect(r.totalCost).toBeCloseTo(50 * 0.68 + 50 * 0.78 + 100 * 0.95, 6);
  });

  it("matches getEffectivePrice to totalCost/kWh", () => {
    expect(getEffectivePrice(200)).toBeCloseTo(calculateTieredBill(200).effectiveRate, 6);
  });
});

describe("Egyptian grid emission factor (FIX 6)", () => {
  it("uses 0.47 kg CO2 per kWh", () => {
    expect(CO2_FACTOR).toBe(0.47);
  });
});

describe("ROI default electricity inflation (FIX 7)", () => {
  it("applies 8% inflation to savings from year 2 onwards", () => {
    const analysis = calculateROIProjection(10000, 1000, 1.0);
    const y1 = analysis.yearlyProjections[0];
    const y2 = analysis.yearlyProjections[1];
    expect(y1.inflationAdjustedSavings).toBeCloseTo(y1.savings, 0);
    expect(y2.inflationAdjustedSavings).toBeCloseTo(y2.savings * 1.08, 0);
  });

  it("reaches payback earlier with inflation than without", () => {
    const withInflation = calculateROIProjection(50000, 5000, 1.0);
    const without = calculateROIProjection(50000, 5000, 1.0, { inflationRate: 0 });
    expect(withInflation.paybackYearExact).toBeLessThan(without.paybackYearExact);
  });
});
