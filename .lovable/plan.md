

## Backend & Functions Test Report

### Test Results Summary

| Function | Status | Notes |
|----------|--------|-------|
| **google-solar** | OK (200) | Returns `available: false, fallback: true` for Cairo -- expected, Google Solar imagery limited in Egypt |
| **capture-lead** | OK (200) | Successfully inserts into `solar_assessments` |
| **solar-chat** | OK (200) | Streaming SSE works, Gemini responds correctly in English |
| **scrape-solar-prices** | OK (200) | Returns cached data (Economy: 18K, Standard: 19K, Premium: 25K EGP/kW) |
| **scrape-tariffs** | OK (200) | Returns 7 tiers, commercial/industrial rates, confidence: high |
| **solar-advisor** | TIMEOUT | 30s timeout exceeded calling Lovable AI Gateway (Gemini 2.5 Pro). See Issue #1 |
| **solar-engine** | ERROR 400 | "Invalid coordinates" -- the function expects `latitude`/`longitude` fields, not `lat`/`lng`. Need to verify frontend sends correct fields |
| **building-footprints** | TIMEOUT | Overpass API call from edge function timed out. May be flaky |
| **create-admin** | NOT TESTED | Requires `ADMIN_SETUP_SECRET` -- skipped (secure by design) |

### Database Health

| Table | Records | Status |
|-------|---------|--------|
| profiles | 8 | OK |
| solar_assessments | 67 | OK |
| report_history | 93 | OK |
| market_data | 13 | OK (latest scrape: 2026-04-07) |
| user_roles | exists | OK |
| leads | exists | OK |

---

### Issues Found

#### Issue #1: solar-advisor times out frequently
- The function uses `google/gemini-2.5-pro` with a 30-second timeout
- Gemini Pro is slower and more expensive -- the review prompt is long
- **Fix**: Increase timeout to 60s, or switch review mode to `google/gemini-2.5-flash` (same model used by solar-chat) which is faster and cheaper. Keep Pro only for complex advisor queries.

#### Issue #2: solar-advisor field mapping problem
- The sanitization logs show `coverageRatio: 8500` instead of `85` -- the function multiplies `coverageRatio` by 100 (`Math.round(d.coverageRatio * 100)`), but the frontend already sends it as a percentage (e.g. `85`), so it becomes `8500%`
- **Fix**: Remove the `* 100` multiplication, or change frontend to send as decimal (0.85)

#### Issue #3: solar-engine uses `requiredQuality=HIGH`
- Line 93 in solar-engine has `requiredQuality=HIGH` for Google Solar API
- The google-solar proxy function does NOT use this constraint (correctly)
- This means solar-engine will fail more often on Egyptian locations than necessary
- **Fix**: Remove `requiredQuality=HIGH` from solar-engine to match google-solar behavior

#### Issue #4: solar-advisor CORS headers are incomplete
- solar-advisor uses short CORS headers: `"authorization, x-client-info, apikey, content-type"`
- All other functions include the full Supabase client headers (`x-supabase-client-platform`, etc.)
- This could cause CORS errors on some browsers/versions
- **Fix**: Update to match the full header set used by other functions

#### Issue #5: building-footprints reliability
- Depends on Overpass API (OpenStreetMap) which can be slow/unreliable
- Timed out during testing -- this is an external dependency issue, not a code bug
- Consider adding a fallback or longer timeout

### What's Working Well
- Market data pipeline (Firecrawl + AI extraction) working and caching correctly
- Solar chat streaming is fast and contextual
- Capture-lead silently logs all assessments
- RLS policies are properly configured
- Auth system (Google/email) functioning per logs

### Recommended Plan

1. **Fix solar-advisor timeout** -- switch review mode to `gemini-2.5-flash`
2. **Fix coverageRatio x100 bug** in solar-advisor sanitization
3. **Remove `requiredQuality=HIGH`** from solar-engine
4. **Update CORS headers** in solar-advisor to match other functions

These are 4 targeted fixes across 2 edge functions. No database changes needed.

