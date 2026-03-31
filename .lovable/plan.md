

## Plan: Fix AI Advisor Auto-Trigger and Verify Checkpoint

### Problem Analysis

Based on the edge function logs and code inspection:

1. **Checkpoint IS working** -- logs show `mode: review` returning 200 with `confidenceScore: 98` and valid adjustments/interpretation
2. **AI Advisor auto-displays** because `aiReviewText` from the checkpoint is passed as `preloadedRecommendation` to `AIAdvisor`, which auto-shows it via the `useEffect` on line 26-31
3. **Prompt says "بصفتي"** because the review prompt says "بصفتي مهندس طاقة شمسية" -- needs rewording

### Changes

**File 1: `src/components/AIAdvisor.tsx`**
- Remove the `useEffect` that auto-sets advice from `preloadedRecommendation` (lines 26-31)
- Remove `preloadedRecommendation` from initial state of `advice` and `hasAsked`
- The advisor will only activate when the user clicks the button
- When clicked, if `preloadedRecommendation` exists, show it immediately instead of fetching again; otherwise fetch from solar-advisor

**File 2: `src/components/ResultsDashboard.tsx`**
- Keep passing `aiReviewText` as `preloadedRecommendation` (so it can be used on-demand without re-fetching)

**File 3: `supabase/functions/solar-advisor/index.ts`**
- In the review mode Arabic prompt, change "بصفتي مهندس طاقة شمسية" to a direct instruction: "لا تبدأ بـ 'بصفتي' أو 'كـ'. ابدأ مباشرة بالتقييم"
- In the advisor mode Arabic prompt, ensure the same instruction exists (it already does but verify)

### Technical Details

The checkpoint flow (review mode) is confirmed working from logs:
- Gemini returns `validated: true`, `confidenceScore: 98`
- Adjustments are all `null` (local calculations are accurate)
- Interpretation text is generated successfully

The only UI issue is the advisor auto-populating. Fix is to make `AIAdvisor` start in "not asked" state always, and use the preloaded text as a cache when the user clicks.

