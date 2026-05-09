# SolarMatch Programmatic SEO System

This is a large, multi-phase build. Below is a complete, scoped plan that delivers a real, working programmatic SEO engine — not a one-shot dump. We'll ship in phases so each phase is testable, indexable, and converts.

---

## Phase 1 — SEO Foundations (ship first)

**Goal:** Strong technical base so every new page (now and later) inherits perfect SEO.

1. **Dynamic SEO core** (extend existing `SeoHead` / `SeoPage`)
   - Centralized metadata builder (title/desc/keywords/OG/Twitter/canonical/hreflang).
   - JSON-LD helpers: Organization, WebSite, Article, FAQ, Breadcrumb, LocalBusiness, Product, HowTo, Service.
   - Per-page `lastmod`, image OG fallbacks, Arabic/English locale switching.

2. **Sitemap automation**
   - Replace static `public/sitemap.xml` with a generated multi-sitemap:
     - `sitemap-index.xml`
     - `sitemap-core.xml` (home, about, features, etc.)
     - `sitemap-governorates.xml`
     - `sitemap-property-types.xml`
     - `sitemap-bills.xml`
     - `sitemap-roi.xml`
     - `sitemap-comparisons.xml`
     - `sitemap-guides.xml`
     - `sitemap-commercial.xml`
     - `sitemap-financing.xml`
     - `sitemap-blog.xml`
   - Built at build-time from the same datasets that drive the routes (single source of truth).
   - `robots.txt` updated to point at the index.

3. **Analytics & tracking**
   - GA4 + GTM placeholder (env-driven), Search Console verification meta tag, scroll-depth + outbound + lead-CTA event tracking utility.

---

## Phase 2 — Programmatic SEO Engine

**Goal:** One template + one dataset row = one fully-optimized AR + EN page.

1. **Datasets** (TypeScript, typed, in `src/seo/data/`)
   - `governorates.ts` — 27 Egyptian governorates with: nameEn, nameAr, slug, lat/lng, avgIrradiance (kWh/m²/day), avgTariffEGP, climateNotes, majorCities[].
   - `propertyTypes.ts` — villa, apartment, factory, farm, warehouse, mall, school, hospital, poultry, cold-storage, irrigation, cement, manufacturing.
   - `bills.ts` — bill brackets (500, 1000, 2000, 3000, 5000, 10000, 25000, 50000, 100000 EGP) with derived kWh + recommended kWp.
   - `comparisons.ts` — solar-vs-generator, solar-vs-grid, on-grid-vs-off-grid, lithium-vs-gel, mono-vs-poly, etc.
   - `financing.ts` — installments, bank loans, leasing, PPA.
   - `guides.ts` — how-it-works, net-metering, maintenance, myths, installation.

2. **Page generator** (`src/seo/generator.ts`)
   - Pure function: `(template, row, lang) => SeoPageProps`.
   - Composes: H1, intro, 4–7 sections with **dynamic numbers computed from row** (not lorem-ipsum), 6–10 dynamic FAQs, related-links graph, CTA.
   - Anti-thin-content guard: minimum word count, dataset-driven unique paragraphs (irradiance, tariff bracket, payback months) so no two pages share text.

3. **Internal linking engine** (`src/seo/linking.ts`)
   - Auto-builds related pages from same cluster + cross-cluster (e.g. governorate → top property types in that governorate → matching bill bracket).
   - Breadcrumbs auto-generated from URL.

4. **Routes** (added to `App.tsx`, AR mirrored under `/ar/...`)
   - `/solar/:governorate` (e.g. `/solar/cairo`, `/ar/solar/القاهرة` via slug map)
   - `/solar-for/:propertyType`
   - `/solar-for/:propertyType/:governorate` (cross-template, only generated for high-value pairs to avoid index bloat)
   - `/solar-bill/:amount`
   - `/solar-roi/:topic`
   - `/compare/:slug`
   - `/financing/:slug`
   - `/guides/:slug`
   - `/commercial/:industry`

5. **Slug strategy**
   - English: clean kebab.
   - Arabic: native Arabic slugs (URL-encoded) for max AR ranking, with EN slug fallback alias 301-style via canonical.

---

## Phase 3 — Lead-conversion layer on every SEO page

- Sticky in-content CTA card (already have `SeoPage` CTA — extend with: bill-upload entry, "Talk to expert" → opens existing `ContactExpertDialog`, calculator entry pre-filled with the page's context (e.g. governorate lat/lng or bill amount)).
- Trust strip: live counters from `get_public_stats` RPC, mini case study, disclaimer badge.
- Exit-intent / scroll-depth lead form (lightweight, reuses `leads` table).

---

## Phase 4 — AI-assisted content layer (optional, behind admin)

- Edge function `seo-content-generate` using Lovable AI Gateway (Gemini 3 Flash) to draft new dataset rows + sections for admin review.
- Stored in new table `seo_pages` (id, slug, lang, cluster, h1, intro, sections jsonb, faqs jsonb, status, published_at).
- Admin UI under `/admin/seo` to review/publish; published rows feed the same generator + sitemap.

---

## Phase 5 — Blog / Knowledge base

- `seo_articles` table (slug, lang, title, excerpt, body_mdx, tags[], cluster, hero_image, published_at).
- `/blog` index + `/blog/:slug` (AR mirrored).
- Topic clusters with pillar → cluster internal links.

---

## What ships in THIS first message

To keep this delivery shippable and reviewable, **this first PR will deliver Phases 1 and 2 end-to-end**:

- SEO core extensions (schema helpers, hreflang, OG)
- Datasets: governorates (27), propertyTypes (13), bills (9), comparisons (6), guides (6), financing (4), commercial (8)
- Generator + linking engine
- New routes wired in `App.tsx` (AR + EN)
- Generated multi-sitemap (build-time script + npm script) and updated `robots.txt`
- Lead CTAs on every generated page (reusing `ContactExpertDialog`)
- GA4 + scroll-depth tracker (env-driven, no-op if env missing)

Phases 3 polish, 4 (AI admin), and 5 (blog DB) will follow in subsequent messages so you can review traffic + Search Console signals before we layer on the database-backed content engine.

## Technical notes

- All pages SSR-friendly via `react-helmet-async` (already installed).
- No new dependencies required for Phase 1+2.
- Sitemap script: `scripts/generate-sitemaps.mjs` runs in `prebuild`.
- GA4 ID via `VITE_GA4_ID` (publishable, fine in client).
- Total new pages generated in Phase 2: **~450 unique URLs × 2 languages ≈ 900 indexable pages**, all with unique data-driven content.

Approve and I'll build Phases 1+2 in this turn.
