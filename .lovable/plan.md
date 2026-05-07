## Goal

Rebuild the AI rooftop analysis as a strictly backend-first pipeline whose results feed directly into the final report, expand farm mode with qirat, add environmental + cleaning analysis, add a feedback system, and remove subscriptions and Street View completely — all without touching the map's interaction layer.

---

## 1. Backend: unified `roof-report` edge function

Replace the current `roof-analysis` function with a single `roof-report` function that runs the entire AI pipeline server-side and returns one structured JSON payload used by the report.

Inputs from frontend (only):
- `polygon` (lat/lng[])
- `center` (lat/lng)
- `selectedArea` (m²)
- `monthlyConsumptionKwh`
- `buildingTypeHint` (optional, user-selected)

Backend pipeline (sequential, all server-side):
1. Fetch high-res Google Static Maps satellite tile around polygon.
2. Vision call (Gemini 2.5 Flash via Lovable AI Gateway, structured tool-call) → returns:
   - `detectedRoofArea`, `usableArea`, `unusablePercentage`
   - `obstacles[]` (HVAC, water tanks, dishes, shaded zones, access rooms, parapets…)
   - `propertyType` ∈ residential | commercial | industrial | warehouse | farm | mixed
   - `roofPattern` notes, `confidenceScore`
3. Call existing `google-air-quality` + NASA POWER (already integrated) for AQI, dust, temp, cloud cover.
4. Derive `cleaningFrequency` (every 2 weeks / monthly / quarterly) from AQI + dust + climate.
5. If `propertyType === 'farm'` OR area > ~4000 m² OR user toggled farm mode:
   - Compute land area in m², feddans, qirats (1 feddan = 4200.83 m², 24 qirat/feddan).
   - Add irrigation-pump sizing hint based on usable area and irradiance.
6. Run existing solar-engine math on `usableArea` (not raw selectedArea) and return:
   - system size kWp, annual production, savings, payback, CO₂, coverage, package recs.
7. Persist a row in `solar_assessments` (already exists) and return the unified report JSON.

In-memory 24h cache keyed on (center rounded, area, consumption).

Graceful fallback at every step (return `available:false` for that section, never 500).

## 2. Frontend wiring (UI safety)

Removed/avoided:
- Delete `src/components/RoofAnalysisCard.tsx` (was a separate card — results now live inside the report).
- Delete `src/lib/roofAnalysis.ts`.
- No overlays, no canvases, no portals, no pointer/focus changes anywhere.

New thin client helper `src/lib/roofReport.ts`:
- `generateRoofReport(params) → Promise<RoofReport>` — single `supabase.functions.invoke('roof-report')` call.

`MapSection.tsx`:
- "Done" button stays as a normal `<button>` — single click only.
- On Done: call `onPolygonComplete(polygon, area)` (already does) — no AI calls, no overlays from map.

`Index.tsx` (or results section):
- When user clicks the existing "Calculate" CTA (post-Done), call `generateRoofReport()` once, show a simple inline skeleton inside the report area, then render the unified report. No fullscreen states.

## 3. Report UI updates

Inside the existing `ResultsDashboard.tsx`, add accordion sections (collapsed by default, matching existing pattern):
- **Rooftop Analysis** — selected vs detected vs usable, obstacles as badges, confidence.
- **Property Classification** — detected type + reasoning line.
- **Environmental Conditions** — AQI, dust risk, temp, cloud cover (uses existing AQI badge component).
- **Cleaning Recommendations** — frequency + expected efficiency loss if skipped.
- **Farm/Qirat block** (only when farm) — feddans, qirats, usable hectares, irrigation note.
- All numbers feeding the existing financial cards now come from `usableArea`, not raw selectedArea.

## 4. Feedback system

New table `report_feedback`:
- `report_id` (nullable FK to `solar_assessments.id`), `user_id` (nullable), `rating` (1–5), `comment`, `created_at`, `metadata jsonb`.
- RLS: anyone can INSERT (with rating 1–5 and comment ≤2000 chars); only admins can SELECT/UPDATE/DELETE; users can SELECT own.

Frontend:
- Compact `<ReportFeedback />` block at the bottom of the report (stars + optional comment + submit). No modal, no overlay.

Admin:
- New page `/admin/feedback` with a table (rating, comment, date, linked report). Add link in `AdminSidebar`.
- Reuses existing admin layout/auth.

Note: there is already a `user_feedback` table but it's generic. I'll reuse it (`category='report'`, `metadata.report_id`) instead of creating a duplicate table — simpler and admin scaffolding can extend.

## 5. Remove subscriptions completely

Delete:
- `src/components/PaywallModal.tsx`, `LimitReachedModal.tsx`, `FeatureGate.tsx`, `LockedFeature.tsx`, `UpgradeBanner.tsx`, `WaitlistModal.tsx`
- `src/hooks/useSubscription.ts`, `src/hooks/usePlanFeatures.ts`
- `src/lib/plans.ts`
- `src/pages/Features.tsx` (pricing page) and route
- All imports/usages of the above (search & strip).
- Subscription columns/tables: leave columns in `profiles` but stop reading/writing them (safer than dropping; avoids breaking auth trigger). I will NOT drop columns unless you ask — let me know if you want a destructive migration.
- `waitlist` table: drop or keep? Defaults to **keep** unless you say otherwise (see question below).

## 6. Remove Street View completely

- Delete `supabase/functions/google-street-view/index.ts` and its `config.toml` entry.
- Remove any frontend imports/buttons (search confirms minimal usage).

## 7. Database changes (single migration)

- Add `usable_area`, `detected_roof_area`, `property_type`, `cleaning_frequency`, `qirats`, `feddans` columns to `solar_assessments` (nullable).
- No new feedback table — reuse `user_feedback`.

---

## Technical details

- Edge function: `supabase/functions/roof-report/index.ts`, `verify_jwt = false`, uses `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY` (both already set).
- Vision uses `google/gemini-2.5-flash` with structured `tool_choice` (JSON only).
- Qirat math: `feddans = m² / 4200.83`, `qirats = feddans * 24`.
- Cleaning frequency mapping:
  - AQI ≥ 150 OR desert/dust-heavy → every 2 weeks (≈12% loss/mo if skipped)
  - AQI 100–149 → monthly (≈7% loss/mo)
  - AQI < 100 → every 2–3 months (≈3% loss/mo)
- All UI changes stay in presentational components (`ResultsDashboard`, new `ReportFeedback`). No changes to map event handlers.

---

## Out of scope (confirm before I do)

- Dropping subscription columns/tables in DB (currently I'll just stop using them).
- Removing the `waitlist` table.
- Replacing the existing `user_feedback` table with a new `report_feedback` table.
