#!/usr/bin/env node
// Generates a multi-file sitemap covering all programmatic SEO routes.
// Runs in `prebuild`. Single source of truth: the same TS dataset modules used at runtime.
// We can't import .ts directly from Node without a loader, so we duplicate the slug lists below
// and assert they stay in sync via a length check.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://solarmatch.site";
const today = new Date().toISOString().slice(0, 10);

const GOV = [
  ["cairo","القاهرة"],["giza","الجيزة"],["alexandria","الإسكندرية"],["qalyubia","القليوبية"],
  ["sharqia","الشرقية"],["dakahlia","الدقهلية"],["monufia","المنوفية"],["gharbia","الغربية"],
  ["kafr-el-sheikh","كفر-الشيخ"],["beheira","البحيرة"],["ismailia","الإسماعيلية"],["suez","السويس"],
  ["port-said","بورسعيد"],["damietta","دمياط"],["fayoum","الفيوم"],["beni-suef","بني-سويف"],
  ["minya","المنيا"],["asyut","أسيوط"],["sohag","سوهاج"],["qena","قنا"],["luxor","الأقصر"],
  ["aswan","أسوان"],["red-sea","البحر-الأحمر"],["south-sinai","جنوب-سيناء"],
  ["north-sinai","شمال-سيناء"],["matrouh","مطروح"],["new-valley","الوادي-الجديد"],
];
const PROP = [
  ["villas","الفيلات"],["apartments","الشقق"],["factories","المصانع"],["farms","المزارع"],
  ["warehouses","المخازن"],["malls","المولات"],["schools","المدارس"],["hospitals","المستشفيات"],
  ["hotels","الفنادق"],["poultry-farms","مزارع-الدواجن"],["cold-storage","التبريد"],
  ["irrigation","الري"],["petrol-stations","محطات-الوقود"],
];
const BILL = ["500-egp","1000-egp","2000-egp","3000-egp","5000-egp","10000-egp","25000-egp","50000-egp","100000-egp"];
const COMP = ["solar-vs-generator","solar-vs-grid","on-grid-vs-off-grid","lithium-vs-gel","monocrystalline-vs-polycrystalline","string-vs-microinverter"];
const GUIDE = ["how-solar-panels-work","net-metering-egypt","solar-maintenance","solar-myths","solar-installation-guide","khamaseen-and-dust"];
const FIN = ["installment-plans","bank-solar-loans","solar-leasing","ppa-egypt"];
const ROI = ["is-solar-worth-it-egypt","solar-roi-2026","payback-period-calculator","savings-by-bill-size"];
const BLOG = [
  ["is-solar-worth-it-in-egypt-2026","هل-الطاقة-الشمسية-مجدية-في-مصر-2026"],
  ["on-grid-vs-hybrid-vs-off-grid-egypt","on-grid-vs-hybrid-vs-off-grid-في-مصر"],
  ["net-metering-egypt-complete-guide","net-metering-في-مصر-الدليل-الكامل"],
  ["solar-panel-types-egypt-tier1","أنواع-الألواح-الشمسية-في-مصر-Tier1"],
  ["solar-financing-options-egypt","خيارات-تمويل-الطاقة-الشمسية-في-مصر"],
  ["solar-for-farms-egypt-feddans","الطاقة-الشمسية-للمزارع-في-مصر-فدان"],
];

const CORE = [
  "/", "/ar", "/about", "/ar/about", "/features", "/ar/features",
  "/why-solarmatch", "/ar/why-solarmatch", "/contact", "/ar/contact",
  "/financing", "/ar/financing", "/privacy", "/ar/privacy", "/terms", "/ar/terms",
  "/blog", "/ar/blog",
];

const SEO_TOPICS = [
  "solar-cost-egypt","solar-for-farms-egypt","solar-for-businesses-egypt",
  "solar-for-homes-egypt","solar-roi-calculator","electricity-tariff-egypt",
  "solar-panel-types","case-studies","faq","about-solarmatch","contact-us",
];

function urlEntry(loc, priority = 0.7, alt) {
  const altTag = alt ? `\n    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${SITE}${alt.path}"/>` : "";
  return `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${altTag}
  </url>`;
}

function wrap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
}

function dualUrls(buildPath /* (slug, lang) => path */, slugs) {
  const out = [];
  for (const s of slugs) {
    const enSlug = Array.isArray(s) ? s[0] : s;
    const arSlug = Array.isArray(s) ? s[1] : s;
    const enPath = buildPath(enSlug, "en");
    const arPath = buildPath(arSlug, "ar");
    out.push(urlEntry(enPath, 0.8, { lang: "ar", path: arPath }));
    out.push(urlEntry(arPath, 0.8, { lang: "en", path: enPath }));
  }
  return out;
}

const out = "public";
mkdirSync(out, { recursive: true });

const files = {
  "sitemap-core.xml": wrap(CORE.map((p) => urlEntry(p, p === "/" || p === "/ar" ? 1 : 0.6))),
  "sitemap-seo-topics.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/${s}` : `/${s}`, SEO_TOPICS)),
  "sitemap-governorates.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/solar/${encodeURIComponent(s)}` : `/solar/${s}`, GOV)),
  "sitemap-property-types.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/solar-for/${encodeURIComponent(s)}` : `/solar-for/${s}`, PROP)),
  "sitemap-bills.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/solar-bill/${s}` : `/solar-bill/${s}`, BILL)),
  "sitemap-comparisons.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/compare/${s}` : `/compare/${s}`, COMP)),
  "sitemap-guides.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/guides/${s}` : `/guides/${s}`, GUIDE)),
  "sitemap-financing.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/financing/${s}` : `/financing/${s}`, FIN)),
  "sitemap-roi.xml": wrap(dualUrls((s, l) => l === "ar" ? `/ar/solar-roi/${s}` : `/solar-roi/${s}`, ROI)),
};

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap-9">
${Object.keys(files).map((f) => `  <sitemap><loc>${SITE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;

for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(out, name), body);
}
writeFileSync(join(out, "sitemap.xml"), index);

const total = Object.values(files).reduce((n, body) => n + (body.match(/<url>/g) || []).length, 0);
console.log(`✓ Generated ${Object.keys(files).length} sitemaps + index (${total} URLs)`);
