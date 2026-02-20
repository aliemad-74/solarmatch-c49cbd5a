

# Engineering Transparency Upgrade Plan

## Summary

Most of the transparency infrastructure already exists. This plan closes the remaining gaps by upgrading the existing `DecisionExplanation` component and adjusting the `ResultsDashboard` layout -- without touching any calculation logic.

---

## Changes Overview

### 1. Move DecisionExplanation Right After Verdict

**File:** `src/components/ResultsDashboard.tsx`

Currently the `DecisionExplanation` component sits at line 562 -- after charts, AI advisor, and system comparison. Move it to immediately after the Layer 1 verdict banner (after line 132), so the decision reasoning appears before any numbers or charts.

---

### 2. Explicit Verdict Text

**File:** `src/components/ResultsDashboard.tsx` + translation files

Replace the current feasibility labels with explicit verdict phrases:
- "Suitable for Solar Installation" / "مناسب للتركيب الشمسي"
- "Conditionally Suitable" / "مناسب بشروط"
- "Not Suitable at This Time" / "غير مناسب حالياً"

Update the `results.feasibility.suitable`, `conditional`, and `notSuitable` translation keys.

---

### 3. Causal Ranked Factors (Upgrade DecisionExplanation)

**File:** `src/components/DecisionExplanation.tsx`

Replace the current 4 unranked driver cards with a ranked top-3 causal explanation:
- Compute an impact score for each factor (coverage ratio weight, payback weight, usable area weight, consumption weight) based on thresholds.
- Sort by score descending, take top 3.
- For each, show rank (1/2/3), a causal sentence explaining *how* it affected the outcome, and a direction indicator (positive/negative push).

Example output:
> 1. **Primary:** High coverage ratio (92%) strongly supports feasibility.
> 2. **Secondary:** Short payback period (5.2 years) confirms financial viability.
> 3. **Minor:** Usable area (75 m2) was sufficient but did not constrain the system.

---

### 4. Grouped Assumptions Panel

**File:** `src/components/DecisionExplanation.tsx`

Reorganize the existing 8 assumptions into 3 categories:
- **Energy**: Specific yield, irradiance data, performance ratio, panel degradation, CO2 factor
- **Financial**: Tariff stability, cost per kW held constant
- **Operational**: System lifetime, consumption held constant

Each category gets a subheading. Panel remains collapsed by default inside the Advanced View.

---

### 5. Input-to-Decision Traceability (Advanced View Only)

**File:** `src/components/DecisionExplanation.tsx`

Add a new collapsible section inside Advanced View: "Input Impact Trace". For each major input (rooftop area, monthly consumption, PV type, building type, electricity price), show:
- Input name and value entered
- Impact level badge: High / Medium / Low

Impact is derived from the same ranking logic as the causal factors -- no new formulas.

---

### 6. Three Named Sensitivity Scenarios

**File:** `src/components/DecisionExplanation.tsx`

Replace the current 4-row sensitivity table with 3 named scenarios:

| Scenario | Consumption | System Cost | Payback Range |
|---|---|---|---|
| Conservative | +20% | +15% | payback x 1.15 |
| Typical (Current) | baseline | baseline | baseline |
| Optimistic | -20% | -15% | payback x 0.85 |

Present as ranges, not exact recalculations. Keep "Note: These are indicative estimates" disclaimer.

---

### 7. Uncertainty Indicators on Metric Cards

**File:** `src/components/ResultsDashboard.tsx`

Add a subtle "~ estimate" indicator or +/- range on key metric cards:
- Yearly savings: show +/-10% range
- Payback period: show +/-15% range
- CO2 saved: show "~ estimate" label

Add a one-line disclaimer below the metrics grid:
"Actual performance may vary due to behavioral and market changes."

---

### 8. Translation Updates

**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/ar.json`

Add new keys for:
- Explicit verdict text (3 keys)
- Ranked factor labels (primary, secondary, minor)
- Category headings (Energy, Financial, Operational)
- Input trace section title
- Scenario names (Conservative, Typical, Optimistic)
- Uncertainty disclaimer text
- Estimate indicator label

---

## Files Modified

| File | Change Type |
|---|---|
| `src/components/DecisionExplanation.tsx` | Major upgrade: ranked factors, grouped assumptions, 3 scenarios, input trace |
| `src/components/ResultsDashboard.tsx` | Move DecisionExplanation position, add uncertainty ranges on cards, explicit verdict text |
| `src/i18n/locales/en.json` | New translation keys |
| `src/i18n/locales/ar.json` | New translation keys |

## Files NOT Modified

- `src/lib/solarData.ts` -- no calculation changes
- `src/lib/egyptTariffs.ts` -- no tariff changes
- `src/pages/HowItWorks.tsx` -- already has decision flow and scope sections
- No new files created

## Technical Notes

- All impact scoring uses existing outputs (`coverageRatio`, `paybackYears`, `usableArea`, `monthlyConsumption`) with threshold-based classification -- no new formulas.
- Sensitivity scenarios use simple multipliers on existing `paybackYears` and `savingsYear` values -- deterministic, no recalculation.
- The Advanced View toggle already exists and will continue to gate: assumptions, input trace, sensitivity, and scope sections.
- Basic View remains unchanged: verdict, causal explanation, financial context, and key drivers visible by default.

