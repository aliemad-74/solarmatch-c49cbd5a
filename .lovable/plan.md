

# Implementation Plan: SolarMatch Strict Compliance Updates

This plan covers 12 requirements. Many features already exist in the codebase and only need text/label adjustments. Below is the full breakdown.

---

## Requirement 1: Product Role Sentence

**File:** `src/pages/Index.tsx`

Add one sentence immediately below the hero section (after the main headline in MapSection or before it). Since the headline is inside the Header/hero area, we'll add a single line of text between the ProgressIndicator and MapSection:

- Exact text: *"This tool provides a preliminary technical and financial assessment to support solar feasibility evaluation before detailed site studies."*
- Styled as `text-base md:text-lg text-muted-foreground text-center` (smaller than headline, larger than body, not bold)

---

## Requirement 2: Transition Screen Before Results

**File:** `src/components/ResultsDashboard.tsx`

Insert a transitional block at the very top of the results section (before the verdict), displayed once before any metrics:

- Title: "Analysis Summary"
- Line 1: "Based on the inputs you provided, the system generated an overall feasibility conclusion."
- Line 2: "The conclusion is shown first, followed by supporting metrics."
- No buttons, no extra animations

This will be a simple `div` block above the current Layer 1 verdict banner.

---

## Requirement 3: Decision Verdict

Already implemented correctly in `ResultsDashboard.tsx` (lines 101-119). The verdict appears before any metric cards. **No changes needed** -- just verify verdict labels match exactly. Current translation keys `results.verdict.suitable`, `results.verdict.conditional`, `results.verdict.notSuitable` need verification.

**File:** `src/i18n/locales/en.json` and `ar.json` -- ensure verdict texts are exactly:
- "Suitable for Solar Installation"
- "Conditionally Suitable"  
- "Not Suitable at This Time"

---

## Requirement 4: Ranked Causal Explanation

**File:** `src/components/DecisionExplanation.tsx`

Change the section title from "Why This Recommendation?" to **"Why This Conclusion Was Reached"** (and Arabic equivalent). The ranked factors logic (3 bullets, ordered by impact, with direction) already exists and complies.

---

## Requirement 5: Assumptions Panel

Already exists in `DecisionExplanation.tsx` with the correct title "Key Assumptions Used in This Analysis", grouped under Energy/Financial/Operational. Collapsed by default. **No changes needed.**

---

## Requirement 6: Input Impact Trace

Already exists in Advanced View only, showing High/Medium/Low labels. **No changes needed.**

---

## Requirement 7: Sensitivity Scenarios

**File:** `src/components/DecisionExplanation.tsx`

Change title from "How Results Change If Conditions Vary" to **"How Results Change Under Different Conditions"**. The three scenarios (Conservative, Typical, Optimistic) already exist with static ranges. **Title change only.**

---

## Requirement 8: Financial Context

**File:** `src/components/DecisionExplanation.tsx`

The current payback context uses evaluative words ("Excellent", "Good", "Acceptable", "High"). These must be replaced with neutral interpretation ranges without value judgments:

- Replace with range-only descriptions like:
  - "Below Egypt's typical range of 5-8 years"
  - "Within Egypt's typical range of 5-8 years"  
  - "Above Egypt's typical range, within 8-12 years"
  - "Exceeds 12 years, above typical justification range"

---

## Requirement 9: Uncertainty Statement

**File:** `src/components/ResultsDashboard.tsx`

Replace or add the exact verbatim text below the results section:

*"All results are estimates and may vary due to behavioral, technical, or market changes."*

The current disclaimer text will be replaced with this exact sentence.

---

## Requirement 10: Advanced View Toggle

**File:** `src/components/DecisionExplanation.tsx`

Change toggle label from "Advanced View -- Assumptions, Sensitivity & Traceability" to two clear states:
- When collapsed: **"Advanced View"**
- When expanded: **"Basic View"**

---

## Requirement 11: Scope and Limitations

**File:** `src/components/DecisionExplanation.tsx`

Restructure the existing scope section in Advanced View:
- Title: **"Scope and Limitations"**
- Two subsections: **"Designed For"** and **"Not Designed For"**
- Short bullet points only

---

## Requirement 12: Methodology Page

**File:** `src/pages/HowItWorks.tsx`

Change the page title from "How It Works" to **"How This System Works"**. The page already contains step-by-step decision flow description, data sources, and scope. No equations or code references exist. **Title change only.**

Also update navigation label in `Header.tsx` and translation files.

---

## Translation Updates

**Files:** `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`

Add/update all new translation keys for:
- Product role sentence
- Analysis summary transition text
- Updated verdict labels (verify exact text)
- Updated section titles
- Uncertainty statement
- Toggle labels
- Restructured scope bullets
- Page title update

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add product role sentence |
| `src/components/ResultsDashboard.tsx` | Add transition block, update uncertainty text |
| `src/components/DecisionExplanation.tsx` | Update 5 section titles, reword financial context, restructure scope, update toggle labels |
| `src/pages/HowItWorks.tsx` | Update page title |
| `src/i18n/locales/en.json` | All new/updated translation keys |
| `src/i18n/locales/ar.json` | All new/updated translation keys |

No calculation logic, tariff logic, or component structure changes.

