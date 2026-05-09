import { ReactNode } from "react";
import type { SeoPageProps } from "@/components/seo/SeoPage";
import { GOVERNORATES, Governorate } from "./data/governorates";
import { PROPERTY_TYPES, PropertyType } from "./data/propertyTypes";
import { BILLS, COMPARISONS, GUIDES, FINANCING, ROI_TOPICS, BillTopic, ComparisonTopic, GuideTopic, FinancingTopic, RoiTopic } from "./data/topics";

type Lang = "en" | "ar";
const fmt = new Intl.NumberFormat("en-US");
const p = (n: ReactNode) => <p key={Math.random()}>{n}</p>;

// ─────────── Constants for deterministic dynamic numbers ───────────
const DEFAULT_PRICE_PER_KWP = 22000; // EGP, 2026 turnkey blended (residential)
const ANNUAL_DEGRADATION = 0.005;
const PERFORMANCE_RATIO = 0.78;

// kWp → annual production (kWh)
const annualKwh = (kwp: number, irradiance: number) =>
  Math.round(kwp * irradiance * 365 * PERFORMANCE_RATIO);

// Annual savings ≈ production × tariff
const annualSavings = (production: number, tariff: number) =>
  Math.round(production * tariff);

// Payback (years)
const payback = (capex: number, annualSav: number) =>
  annualSav > 0 ? +(capex / annualSav).toFixed(1) : 0;

// CO2 saved (tons / year): 0.45 kg/kWh Egyptian grid factor
const co2Tons = (production: number) => +(production * 0.00045).toFixed(1);

// ─────────── Related-link helpers ───────────
const govLink = (g: Governorate, lang: Lang) => ({
  label: lang === "ar" ? `الطاقة الشمسية في ${g.nameAr}` : `Solar in ${g.nameEn}`,
  to: lang === "ar" ? `/ar/solar/${encodeURIComponent(g.arSlug)}` : `/solar/${g.slug}`,
});
const ptLink = (pt: PropertyType, lang: Lang) => ({
  label: lang === "ar" ? `الطاقة الشمسية لـ${pt.nameAr}` : `Solar for ${pt.nameEn}`,
  to: lang === "ar" ? `/ar/solar-for/${encodeURIComponent(pt.arSlug)}` : `/solar-for/${pt.slug}`,
});
const billLink = (b: BillTopic, lang: Lang) => ({
  label: lang === "ar" ? `حل شمسي لفاتورة ${fmt.format(b.amountEGP)} جنيه` : `Solar for an EGP ${fmt.format(b.amountEGP)} bill`,
  to: lang === "ar" ? `/ar/solar-bill/${b.slug}` : `/solar-bill/${b.slug}`,
});
const cmpLink = (c: ComparisonTopic, lang: Lang) => ({
  label: lang === "ar" ? c.nameAr : c.nameEn,
  to: lang === "ar" ? `/ar/compare/${c.slug}` : `/compare/${c.slug}`,
});
const guideLink = (g: GuideTopic, lang: Lang) => ({
  label: lang === "ar" ? g.nameAr : g.nameEn,
  to: lang === "ar" ? `/ar/guides/${g.slug}` : `/guides/${g.slug}`,
});
const finLink = (f: FinancingTopic, lang: Lang) => ({
  label: lang === "ar" ? f.nameAr : f.nameEn,
  to: lang === "ar" ? `/ar/financing/${f.slug}` : `/financing/${f.slug}`,
});
const roiLink = (r: RoiTopic, lang: Lang) => ({
  label: lang === "ar" ? r.nameAr : r.nameEn,
  to: lang === "ar" ? `/ar/solar-roi/${r.slug}` : `/solar-roi/${r.slug}`,
});

const ctaBase = (lang: Lang) => ({
  ctaLabel: lang === "ar" ? "احسب جدواي الآن" : "Calculate my feasibility",
  ctaTo: lang === "ar" ? "/ar" : "/",
});

// ─────────────────────────────────────────────────────────
// 1) GOVERNORATE PAGE
// ─────────────────────────────────────────────────────────
export function buildGovernoratePage(g: Governorate, lang: Lang): SeoPageProps {
  const isAr = lang === "ar";
  const path = isAr ? `/ar/solar/${encodeURIComponent(g.arSlug)}` : `/solar/${g.slug}`;
  const altPath = isAr ? `/solar/${g.slug}` : `/ar/solar/${encodeURIComponent(g.arSlug)}`;
  const refKwp = 5;
  const prod = annualKwh(refKwp, g.irradiance);
  const sav = annualSavings(prod, g.avgTariffEGP);
  const capex = refKwp * DEFAULT_PRICE_PER_KWP;
  const pb = payback(capex, sav);

  return {
    lang, path, altPath, ...ctaBase(lang),
    title: isAr
      ? `الطاقة الشمسية في ${g.nameAr} | تكلفة وتوفير ودراسة جدوى 2026`
      : `Solar Energy in ${g.nameEn} | Cost, Savings & Feasibility 2026`,
    description: isAr
      ? `كل ما تحتاج معرفته عن الطاقة الشمسية في ${g.nameAr}: متوسط الإشعاع ${g.irradiance} ك.و.س/م²/يوم، إنتاج وتوفير وتكلفة نظام 5 كيلوواط، ودراسة جدوى مجانية.`
      : `Solar in ${g.nameEn}: ${g.irradiance} kWh/m²/day irradiance, real cost, annual savings (~EGP ${fmt.format(sav)}) and payback (~${pb} years) for a 5 kWp system. Free feasibility study.`,
    h1: isAr ? `الطاقة الشمسية في ${g.nameAr}` : `Solar Energy in ${g.nameEn}`,
    intro: p(isAr
      ? `${g.nameAr} تتمتع بإشعاع شمسي ${g.irradiance} ك.و.س/م²/يوم — مما يجعلها من المناطق ${g.irradiance >= 6 ? "الممتازة" : "المناسبة"} لتركيب أنظمة الطاقة الشمسية. تعرّف على التكلفة الفعلية، الإنتاج المتوقع، وفترة الاسترداد لمنزلك أو شركتك.`
      : `${g.nameEn} receives an average ${g.irradiance} kWh/m²/day of solar irradiance — placing it among Egypt's ${g.irradiance >= 6 ? "top-tier" : "highly viable"} solar regions. Below: real cost, expected production and payback for homes and businesses in ${g.nameEn}.`),
    sections: [
      {
        heading: isAr ? "إنتاج النظام الشمسي في منطقتك" : "Solar production in your region",
        body: p(isAr
          ? `نظام 5 كيلوواط في ${g.nameAr} ينتج تقريباً ${fmt.format(prod)} ك.و.س سنوياً — كافٍ لتغطية فاتورة شهرية تتراوح بين 700 و1,800 جنيه حسب نمط الاستهلاك.`
          : `A 5 kWp system in ${g.nameEn} produces about ${fmt.format(prod)} kWh annually — enough to cover an EGP 700–1,800 monthly bill depending on usage pattern.`),
      },
      {
        heading: isAr ? "التكلفة والاسترداد" : "Cost & payback",
        body: p(isAr
          ? `تتراوح تكلفة نظام 5 كيلوواط في ${g.nameAr} حول ${fmt.format(capex)} جنيه (تركيب جاهز). بمتوسط تعرفة ${g.avgTariffEGP} جنيه/ك.و.س، التوفير السنوي ≈ ${fmt.format(sav)} جنيه وفترة الاسترداد ≈ ${pb} سنة.`
          : `Turnkey cost for a 5 kWp system in ${g.nameEn} is around EGP ${fmt.format(capex)}. At an average residential tariff of EGP ${g.avgTariffEGP}/kWh, annual savings are ≈ EGP ${fmt.format(sav)} and simple payback ≈ ${pb} years.`),
      },
      {
        heading: isAr ? "ملاحظات المناخ المحلي" : "Local climate notes",
        body: p(isAr ? g.climateNoteAr : g.climateNoteEn),
      },
      {
        heading: isAr ? "المدن المغطاة" : "Cities we cover",
        body: p(isAr
          ? `نقدم دراسات جدوى لأي عقار في ${g.cities.join("، ")} وباقي مدن ${g.nameAr}.`
          : `We deliver feasibility studies for any property in ${g.cities.join(", ")} and the rest of ${g.nameEn}.`),
      },
      {
        heading: isAr ? "الأثر البيئي" : "Environmental impact",
        body: p(isAr
          ? `نظام 5 كيلوواط يقلل انبعاثات الكربون بـ ${co2Tons(prod)} طن سنوياً — ما يعادل زراعة ${Math.round(co2Tons(prod) * 45)} شجرة.`
          : `A 5 kWp system avoids ${co2Tons(prod)} tons of CO₂ per year — equivalent to planting ~${Math.round(co2Tons(prod) * 45)} trees.`),
      },
    ],
    faqs: isAr ? [
      { q: `هل الطاقة الشمسية مجدية في ${g.nameAr}؟`, a: `نعم. بإشعاع ${g.irradiance} ك.و.س/م²/يوم وتعرفة متوسط ${g.avgTariffEGP} جنيه/ك.و.س، فترة الاسترداد لنظام 5 كيلوواط حوالي ${pb} سنة.` },
      { q: `كم تكلفة تركيب الطاقة الشمسية في ${g.nameAr}؟`, a: `نظام 5 كيلوواط ≈ ${fmt.format(capex)} جنيه تركيب جاهز. الأسعار تتغير حسب الماركة وطريقة التركيب.` },
      { q: `كم أوفّر سنوياً؟`, a: `نظام 5 كيلوواط في ${g.nameAr} يوفر ≈ ${fmt.format(sav)} جنيه سنوياً.` },
      { q: `هل أحتاج بطاريات؟`, a: `للمنازل المتصلة بالشبكة في ${g.nameAr}، النظام on-grid كافٍ. البطاريات مطلوبة فقط لاحتياجات الاستمرارية أو المواقع النائية.` },
    ] : [
      { q: `Is solar worth it in ${g.nameEn}?`, a: `Yes. With ${g.irradiance} kWh/m²/day irradiance and an avg tariff of EGP ${g.avgTariffEGP}/kWh, payback for a 5 kWp system is around ${pb} years.` },
      { q: `How much does a solar system cost in ${g.nameEn}?`, a: `A 5 kWp turnkey system is around EGP ${fmt.format(capex)}. Prices vary by component brand and installation method.` },
      { q: `What annual savings can I expect?`, a: `A 5 kWp system in ${g.nameEn} saves ≈ EGP ${fmt.format(sav)} per year.` },
      { q: `Do I need batteries?`, a: `For grid-connected homes in ${g.nameEn}, on-grid is sufficient. Batteries are only needed for backup or remote sites.` },
    ],
    related: [
      ...PROPERTY_TYPES.slice(0, 4).map((pt) => ptLink(pt, lang)),
      ...BILLS.slice(2, 5).map((b) => billLink(b, lang)),
      ...GOVERNORATES.filter((x) => x.slug !== g.slug).slice(0, 3).map((x) => govLink(x, lang)),
    ],
    keywords: isAr
      ? `الطاقة الشمسية في ${g.nameAr}, ألواح شمسية ${g.nameAr}, أسعار الطاقة الشمسية ${g.nameAr}, تركيب الواح شمسية ${g.nameAr}`
      : `solar in ${g.nameEn}, solar panels ${g.nameEn}, solar cost ${g.nameEn}, solar installation ${g.nameEn}`,
  };
}

// ─────────────────────────────────────────────────────────
// 2) PROPERTY TYPE PAGE
// ─────────────────────────────────────────────────────────
export function buildPropertyTypePage(pt: PropertyType, lang: Lang): SeoPageProps {
  const isAr = lang === "ar";
  const path = isAr ? `/ar/solar-for/${encodeURIComponent(pt.arSlug)}` : `/solar-for/${pt.slug}`;
  const altPath = isAr ? `/solar-for/${pt.slug}` : `/ar/solar-for/${encodeURIComponent(pt.arSlug)}`;
  const refKwp = (pt.typicalKwp[0] + pt.typicalKwp[1]) / 2;
  const prod = annualKwh(refKwp, 5.9);
  const sav = annualSavings(prod, 2.0);
  const capex = Math.round(refKwp * DEFAULT_PRICE_PER_KWP);
  const pb = payback(capex, sav);

  return {
    lang, path, altPath, ...ctaBase(lang),
    title: isAr
      ? `الطاقة الشمسية لـ${pt.nameAr} في مصر | الحجم والتكلفة والاسترداد`
      : `Solar for ${pt.nameEn} in Egypt | System Size, Cost & Payback`,
    description: isAr
      ? `الحل الشمسي الأنسب لـ${pt.nameAr}: حجم نظام ${pt.typicalKwp[0]}–${pt.typicalKwp[1]} كيلوواط، تكلفة وتوفير سنوي وتوصية ${pt.bestConfig}.`
      : `The right solar setup for ${pt.nameEn}: ${pt.typicalKwp[0]}–${pt.typicalKwp[1]} kWp system, real cost, annual savings, and ${pt.bestConfig} recommendation.`,
    h1: isAr ? `الطاقة الشمسية لـ${pt.nameAr}` : `Solar Energy for ${pt.nameEn}`,
    intro: p(isAr
      ? `${pt.nameAr} في مصر تستخدم عادةً ${fmt.format(pt.monthlyKwh[0])}–${fmt.format(pt.monthlyKwh[1])} ك.و.س شهرياً. الحل الشمسي الأمثل غالباً نظام ${pt.bestConfig === "off-grid" ? "خارج الشبكة" : pt.bestConfig === "hybrid" ? "هجين" : "متصل بالشبكة"} بسعة ${pt.typicalKwp[0]}–${pt.typicalKwp[1]} كيلوواط.`
      : `${pt.nameEn} in Egypt typically consume ${fmt.format(pt.monthlyKwh[0])}–${fmt.format(pt.monthlyKwh[1])} kWh per month. The optimal solar configuration is usually a ${pt.bestConfig} system between ${pt.typicalKwp[0]} and ${pt.typicalKwp[1]} kWp.`),
    sections: [
      { heading: isAr ? "حجم النظام الموصى به" : "Recommended system size",
        body: p(isAr
          ? `لمنشأة من نوع ${pt.nameAr} بمساحة سطح ${fmt.format(pt.typicalAreaM2[0])}–${fmt.format(pt.typicalAreaM2[1])} م²، نوصي بنظام ${refKwp} كيلوواط ينتج ≈ ${fmt.format(prod)} ك.و.س سنوياً.`
          : `For a ${pt.nameEn.toLowerCase()} property with ${fmt.format(pt.typicalAreaM2[0])}–${fmt.format(pt.typicalAreaM2[1])} m² of usable roof, we recommend a ${refKwp} kWp system producing ≈ ${fmt.format(prod)} kWh/year.`) },
      { heading: isAr ? "التكلفة والاسترداد" : "Cost & payback",
        body: p(isAr
          ? `التكلفة التقريبية ${fmt.format(capex)} جنيه مع توفير سنوي ≈ ${fmt.format(sav)} جنيه وفترة استرداد ≈ ${pb} سنة.`
          : `Approx CapEx EGP ${fmt.format(capex)}, annual savings ≈ EGP ${fmt.format(sav)}, payback ≈ ${pb} years.`) },
      { heading: isAr ? "ملاءمة منحنى الحمل" : "Load-curve fit",
        body: p(isAr
          ? `${pt.nameAr} تتميز بحمل ${pt.loadProfile === "daytime-heavy" ? "نهاري قوي — مما يجعلها مثالية للطاقة الشمسية" : pt.loadProfile === "24-7" ? "مستمر 24/7 — يُنصح بنظام هجين أو بطاريات" : pt.loadProfile === "evening-heavy" ? "مسائي مرتفع — استخدم on-grid مع التصدير للشبكة" : "متوازن"}.`
          : `${pt.nameEn} have a ${pt.loadProfile} consumption profile, ${pt.loadProfile === "daytime-heavy" ? "an ideal match for solar" : pt.loadProfile === "24-7" ? "best served by a hybrid or battery system" : pt.loadProfile === "evening-heavy" ? "best served by on-grid net metering" : "well balanced for hybrid sizing"}.`) },
      { heading: isAr ? "اعتبارات التصميم" : "Design considerations",
        body: p(isAr
          ? `قبل التركيب راعِ: حالة السطح، التظليل، تيار الإنفرتر المناسب، وتوافق العداد مع نظام net-metering في حال on-grid.`
          : `Before installation, assess: roof condition, shading, inverter sizing for your load type, and meter compatibility for net metering if on-grid.`) },
    ],
    related: [
      ...GOVERNORATES.slice(0, 4).map((g) => govLink(g, lang)),
      ...PROPERTY_TYPES.filter((x) => x.slug !== pt.slug).slice(0, 4).map((x) => ptLink(x, lang)),
      cmpLink(COMPARISONS[2], lang), finLink(FINANCING[0], lang),
    ],
    keywords: isAr ? `الطاقة الشمسية لـ${pt.nameAr}, ألواح شمسية ${pt.nameAr}` : `solar for ${pt.nameEn.toLowerCase()}, ${pt.nameEn.toLowerCase()} solar Egypt`,
  };
}

// ─────────────────────────────────────────────────────────
// 3) BILL PAGE
// ─────────────────────────────────────────────────────────
export function buildBillPage(b: BillTopic, lang: Lang): SeoPageProps {
  const isAr = lang === "ar";
  const path = isAr ? `/ar/solar-bill/${b.slug}` : `/solar-bill/${b.slug}`;
  const altPath = isAr ? `/solar-bill/${b.slug}` : `/ar/solar-bill/${b.slug}`;
  const prod = annualKwh(b.recommendedKwp, 5.9);
  const sav = annualSavings(prod, b.amountEGP / b.estKwh);
  const capex = b.recommendedKwp * DEFAULT_PRICE_PER_KWP;
  const pb = payback(capex, sav);

  return {
    lang, path, altPath, ...ctaBase(lang),
    title: isAr
      ? `الحل الشمسي لفاتورة كهرباء ${fmt.format(b.amountEGP)} جنيه شهرياً | حجم وتكلفة 2026`
      : `Solar Solution for an EGP ${fmt.format(b.amountEGP)} Monthly Bill | Size & Cost 2026`,
    description: isAr
      ? `إذا فاتورتك ${fmt.format(b.amountEGP)} جنيه شهرياً (≈ ${fmt.format(b.estKwh)} ك.و.س)، النظام الموصى به ${b.recommendedKwp} كيلوواط بتكلفة ≈ ${fmt.format(capex)} جنيه واسترداد ≈ ${pb} سنة.`
      : `If your monthly bill is EGP ${fmt.format(b.amountEGP)} (≈ ${fmt.format(b.estKwh)} kWh), the recommended system is ${b.recommendedKwp} kWp at ≈ EGP ${fmt.format(capex)} with ≈ ${pb}-year payback.`,
    h1: isAr ? `حلول الطاقة الشمسية لفاتورة ${fmt.format(b.amountEGP)} جنيه` : `Solar Solutions for an EGP ${fmt.format(b.amountEGP)} Bill`,
    intro: p(isAr
      ? `فاتورة ${fmt.format(b.amountEGP)} جنيه تشير لاستهلاك حوالي ${fmt.format(b.estKwh)} ك.و.س شهرياً. لتغطية كامل الاستهلاك، تحتاج نظاماً بسعة ${b.recommendedKwp} كيلوواط.`
      : `An EGP ${fmt.format(b.amountEGP)} bill maps to roughly ${fmt.format(b.estKwh)} kWh/month. To fully cover this, you need around ${b.recommendedKwp} kWp of solar capacity.`),
    sections: [
      { heading: isAr ? "النظام الموصى به" : "Recommended system",
        body: p(isAr
          ? `سعة ${b.recommendedKwp} كيلوواط، إنتاج سنوي ≈ ${fmt.format(prod)} ك.و.س، توفير ≈ ${fmt.format(sav)} جنيه/سنة.`
          : `${b.recommendedKwp} kWp, ≈ ${fmt.format(prod)} kWh/year production, ≈ EGP ${fmt.format(sav)}/year savings.`) },
      { heading: isAr ? "التكلفة والاسترداد" : "Cost & payback",
        body: p(isAr
          ? `استثمار أولي ≈ ${fmt.format(capex)} جنيه، فترة استرداد ≈ ${pb} سنة، ثم 20+ سنة كهرباء شبه مجانية.`
          : `Upfront ≈ EGP ${fmt.format(capex)}, payback ≈ ${pb} years, followed by 20+ years of near-free electricity.`) },
      { heading: isAr ? "هل تحتاج بطاريات؟" : "Do you need batteries?",
        body: p(isAr
          ? `لا في معظم الحالات السكنية. on-grid مع net metering أرخص بنحو 30-40%.`
          : `For most residential cases, no. On-grid net metering is 30–40% cheaper than hybrid.`) },
    ],
    related: [
      ...BILLS.filter((x) => x.slug !== b.slug).slice(0, 4).map((x) => billLink(x, lang)),
      roiLink(ROI_TOPICS[0], lang), ptLink(PROPERTY_TYPES[0], lang),
    ],
    keywords: isAr ? `حل شمسي لفاتورة ${b.amountEGP}, تخفيض فاتورة الكهرباء` : `solar for EGP ${b.amountEGP} bill, reduce electricity bill Egypt`,
  };
}

// ─────────────────────────────────────────────────────────
// 4) COMPARISON / GUIDE / FINANCING / ROI — generic narrative builder
// ─────────────────────────────────────────────────────────
function genericPage(opts: {
  lang: Lang; path: string; altPath: string;
  titleEn: string; titleAr: string;
  descEn: string; descAr: string;
  h1En: string; h1Ar: string;
  introEn: string; introAr: string;
  sections: { headingEn: string; headingAr: string; bodyEn: string; bodyAr: string }[];
  faqsEn?: { q: string; a: string }[]; faqsAr?: { q: string; a: string }[];
  related: { label: string; to: string }[];
  keywordsEn: string; keywordsAr: string;
}): SeoPageProps {
  const isAr = opts.lang === "ar";
  return {
    lang: opts.lang, path: opts.path, altPath: opts.altPath, ...ctaBase(opts.lang),
    title: isAr ? opts.titleAr : opts.titleEn,
    description: isAr ? opts.descAr : opts.descEn,
    h1: isAr ? opts.h1Ar : opts.h1En,
    intro: p(isAr ? opts.introAr : opts.introEn),
    sections: opts.sections.map((s) => ({
      heading: isAr ? s.headingAr : s.headingEn,
      body: p(isAr ? s.bodyAr : s.bodyEn),
    })),
    faqs: isAr ? opts.faqsAr : opts.faqsEn,
    related: opts.related,
    keywords: isAr ? opts.keywordsAr : opts.keywordsEn,
  };
}

export function buildComparisonPage(c: ComparisonTopic, lang: Lang): SeoPageProps {
  const path = lang === "ar" ? `/ar/compare/${c.slug}` : `/compare/${c.slug}`;
  const altPath = lang === "ar" ? `/compare/${c.slug}` : `/ar/compare/${c.slug}`;
  const cards: Record<string, { en: { intro: string; sections: { h: string; b: string }[] }; ar: { intro: string; sections: { h: string; b: string }[] } }> = {
    "solar-vs-generator": {
      en: { intro: `Diesel generators have low upfront cost but burn EGP 14–20 per kWh in fuel. Solar is 3–5× cheaper per kWh over 20 years.`, sections: [
        { h: "Cost per kWh", b: "Diesel: EGP 14–20/kWh including fuel + maintenance. Solar: EGP 3–5/kWh amortized over 25 years." },
        { h: "Reliability", b: "Solar + battery has zero moving parts in the panels; diesel needs oil/filter changes every 250 hours." },
        { h: "Best fit", b: "Backup-only: diesel still wins. Daily use: solar wins decisively." },
      ]},
      ar: { intro: `المولدات أرخص في البداية لكنها تستهلك 14–20 جنيه/ك.و.س وقوداً. الطاقة الشمسية أرخص بـ3–5 أضعاف على 20 سنة.`, sections: [
        { h: "التكلفة لكل ك.و.س", b: "ديزل: 14–20 جنيه شامل الوقود والصيانة. شمسي: 3–5 جنيه موزعة على 25 سنة." },
        { h: "الموثوقية", b: "الألواح بدون أجزاء متحركة؛ المولد يحتاج تغيير زيت وفلتر كل 250 ساعة." },
        { h: "الاستخدام الأمثل", b: "كاحتياطي فقط: الديزل يفوز. للاستخدام اليومي: الشمسي يفوز بفارق كبير." },
      ]},
    },
    "solar-vs-grid": {
      en: { intro: `Egyptian grid tariffs rose every year 2014–2026 and are tiered. Solar locks in your kWh price for 25 years.`, sections: [
        { h: "Price stability", b: "Grid: subject to annual government revisions. Solar: fixed once installed." },
        { h: "Highest tier savings", b: "If you cross into the 7th residential tier (>1,000 kWh), solar pays back in under 4 years." },
        { h: "Reliability", b: "On-grid solar still uses the grid as backup — best of both worlds." },
      ]},
      ar: { intro: `تعرفة الكهرباء في مصر ترتفع سنوياً منذ 2014، وشرائح تصاعدية. الطاقة الشمسية تثبت سعرك لـ25 سنة.`, sections: [
        { h: "ثبات السعر", b: "الشبكة: مراجعات حكومية سنوية. الشمسي: ثابت بعد التركيب." },
        { h: "الادخار في الشرائح العليا", b: "إذا تجاوزت الشريحة السكنية السابعة (>1,000 ك.و.س)، الاسترداد أقل من 4 سنوات." },
        { h: "الموثوقية", b: "on-grid يستخدم الشبكة احتياطياً — جمع بين الاثنين." },
      ]},
    },
    "on-grid-vs-off-grid": {
      en: { intro: `On-grid is cheaper and feeds excess to the grid. Off-grid uses batteries and works without the grid — but costs 60–100% more.`, sections: [
        { h: "On-grid", b: "Lowest cost per kWh, best for cities and reliable grid areas." },
        { h: "Off-grid", b: "Required for remote farms, lodges, telecom sites." },
        { h: "Hybrid", b: "Best of both: keeps power on during outages while staying grid-connected." },
      ]},
      ar: { intro: `on-grid أرخص ويصدر الفائض للشبكة. off-grid يستخدم بطاريات ويعمل بدون شبكة لكنه أغلى بـ60–100%.`, sections: [
        { h: "on-grid", b: "أقل تكلفة، الأفضل للمدن ومناطق الشبكة المستقرة." },
        { h: "off-grid", b: "مطلوب للمزارع النائية والنزل والمواقع البعيدة." },
        { h: "هجين", b: "الأفضل: يحافظ على الطاقة أثناء الانقطاع مع البقاء متصلاً بالشبكة." },
      ]},
    },
    "lithium-vs-gel": {
      en: { intro: `Lithium (LiFePO4) costs more upfront but lasts 10–15 years; Gel lasts 3–5 years.`, sections: [
        { h: "Lifetime cost", b: "Lithium ~EGP 14k/kWh / 5,000 cycles. Gel ~EGP 6k/kWh / 800 cycles. Lithium wins on EGP/kWh delivered." },
        { h: "Depth of discharge", b: "Lithium 90%, Gel 50% — you need ~2× the rated Gel capacity." },
        { h: "Recommendation", b: "Lithium for new installs, except very tight budgets." },
      ]},
      ar: { intro: `الليثيوم (LiFePO4) أغلى في البداية لكنه يدوم 10–15 سنة؛ الجل يدوم 3–5 سنوات.`, sections: [
        { h: "التكلفة على المدى الطويل", b: "ليثيوم ~14 ألف جنيه/ك.و.س / 5,000 دورة. جل ~6 ألف جنيه/ك.و.س / 800 دورة. الليثيوم يفوز بكل ك.و.س مُسلَّم." },
        { h: "عمق التفريغ", b: "ليثيوم 90%، جل 50% — تحتاج ضعف السعة الاسمية للجل." },
        { h: "التوصية", b: "ليثيوم للأنظمة الجديدة، إلا مع ميزانية ضيقة جداً." },
      ]},
    },
    "monocrystalline-vs-polycrystalline": {
      en: { intro: `Monocrystalline panels are now the standard — higher efficiency at near-equal price.`, sections: [
        { h: "Efficiency", b: "Mono 21–23%, Poly 16–18%. Mono needs less roof for same output." },
        { h: "Price", b: "Price gap closed; mono is the default." },
        { h: "Heat tolerance", b: "Mono performs slightly better at high temperatures (Egyptian summer)." },
      ]},
      ar: { intro: `الألواح المونو هي المعيار الآن — كفاءة أعلى بسعر مماثل تقريباً.`, sections: [
        { h: "الكفاءة", b: "مونو 21–23%، بولي 16–18%. مونو يحتاج مساحة سطح أقل لنفس الإنتاج." },
        { h: "السعر", b: "الفارق ضئيل؛ مونو هو الخيار الافتراضي." },
        { h: "تحمّل الحرارة", b: "مونو أداء أفضل في الحرارة المرتفعة (الصيف المصري)." },
      ]},
    },
    "string-vs-microinverter": {
      en: { intro: `String inverters are cheaper; microinverters give per-panel optimization.`, sections: [
        { h: "Cost", b: "String inverter: ~EGP 1,200/kW. Micro: ~EGP 2,800/kW." },
        { h: "Shading tolerance", b: "Micro wins when any panel is shaded; string loses the whole string." },
        { h: "Recommendation", b: "Use string for clean rooftops, micro for shaded or complex roofs." },
      ]},
      ar: { intro: `إنفرتر String أرخص؛ Microinverter يوفر تحسين لكل لوح بمفرده.`, sections: [
        { h: "التكلفة", b: "String: ~1,200 جنيه/ك.و. Micro: ~2,800 جنيه/ك.و." },
        { h: "تحمّل التظليل", b: "Micro يفوز عند تظليل أي لوح؛ String يفقد السلسلة كاملة." },
        { h: "التوصية", b: "String للأسطح النظيفة، Micro للأسطح المظللة أو المعقدة." },
      ]},
    },
  };
  const card = cards[c.slug] ?? cards["solar-vs-generator"];
  return genericPage({
    lang, path, altPath,
    titleEn: `${c.nameEn} | SolarMatch Egypt 2026`,
    titleAr: `${c.nameAr} | SolarMatch مصر 2026`,
    descEn: `Side-by-side comparison: ${c.nameEn} for the Egyptian market — cost, reliability, lifetime, and recommended use cases.`,
    descAr: `مقارنة جانبية: ${c.nameAr} في السوق المصري — التكلفة والموثوقية والعمر الافتراضي والاستخدامات الموصى بها.`,
    h1En: c.nameEn, h1Ar: c.nameAr,
    introEn: card.en.intro, introAr: card.ar.intro,
    sections: card.en.sections.map((s, i) => ({ headingEn: s.h, headingAr: card.ar.sections[i].h, bodyEn: s.b, bodyAr: card.ar.sections[i].b })),
    related: COMPARISONS.filter((x) => x.slug !== c.slug).slice(0, 4).map((x) => cmpLink(x, lang)),
    keywordsEn: `${c.nameEn.toLowerCase()}, solar comparison Egypt`,
    keywordsAr: `${c.nameAr}, مقارنة طاقة شمسية مصر`,
  });
}

export function buildGuidePage(g: GuideTopic, lang: Lang): SeoPageProps {
  const path = lang === "ar" ? `/ar/guides/${g.slug}` : `/guides/${g.slug}`;
  const altPath = lang === "ar" ? `/guides/${g.slug}` : `/ar/guides/${g.slug}`;
  const map: Record<string, { en: string[]; ar: string[] }> = {
    "how-solar-panels-work": {
      en: ["Photovoltaic effect: photons knock electrons free in silicon, creating DC current.", "Inverter converts DC to AC for your home appliances.", "Net meter records what you push back to the grid for credit."],
      ar: ["التأثير الكهروضوئي: الفوتونات تحرر إلكترونات في السيليكون، منتجة تياراً مستمراً.", "الإنفرتر يحوّل التيار المستمر إلى متردد لاستخدام المنزل.", "العداد الذكي يسجل ما ترسله للشبكة كرصيد."],
    },
    "net-metering-egypt": {
      en: ["Egypt allows net metering for systems up to 500 kWp residential / commercial.", "Excess energy is credited at the same retail tariff in most distribution companies.", "Surplus credits roll over month-to-month within a 12-month settlement window."],
      ar: ["مصر تسمح بصافي القياس للأنظمة حتى 500 كيلوواط سكني/تجاري.", "الفائض يُحتسب بنفس تعرفة البيع لدى معظم شركات التوزيع.", "الرصيد ينتقل شهرياً خلال نافذة تسوية 12 شهراً."],
    },
    "solar-maintenance": {
      en: ["Clean panels every 2–3 months in dusty regions; quarterly elsewhere.", "Inspect mounting bolts and DC connectors annually.", "Inverter typically replaced once at year 12–15."],
      ar: ["نظّف الألواح كل 2–3 شهور في المناطق المغبرة؛ ربع سنوي في غيرها.", "افحص مسامير التركيب وموصلات DC سنوياً.", "الإنفرتر يُستبدل عادة مرة واحدة في السنة 12–15."],
    },
    "solar-myths": {
      en: ["Myth: solar doesn't work in summer heat. Reality: production peaks in summer despite efficiency derating.", "Myth: panels need direct face-south. Reality: SE-SW within 30° loses <5%.", "Myth: cleaning needs special chemicals. Reality: clean water + soft brush is sufficient."],
      ar: ["خرافة: الطاقة الشمسية لا تعمل في صيف مصر. الواقع: الإنتاج الأعلى في الصيف رغم تأثير الحرارة.", "خرافة: يجب التوجيه جنوباً مباشرة. الواقع: SE–SW ضمن 30 درجة يفقد أقل من 5%.", "خرافة: التنظيف يحتاج كيماويات خاصة. الواقع: ماء نظيف وفرشاة ناعمة يكفيان."],
    },
    "solar-installation-guide": {
      en: ["Step 1: feasibility study (use SolarMatch).", "Step 2: select certified installer & equipment.", "Step 3: utility paperwork & inspection.", "Step 4: install & commission (1–3 days for residential)."],
      ar: ["الخطوة 1: دراسة الجدوى (استخدم SolarMatch).", "الخطوة 2: اختيار مركّب معتمد ومعدات.", "الخطوة 3: أوراق ومعاينة شركة الكهرباء.", "الخطوة 4: التركيب والتشغيل (1–3 أيام للسكني)."],
    },
    "khamaseen-and-dust": {
      en: ["Khamaseen winds (Mar–May) can drop output 15–25% if not cleaned.", "Cleaning before & after the season recovers most losses.", "Tilt > 15° helps rain self-clean panels."],
      ar: ["رياح الخماسين (مارس–مايو) قد تخفض الإنتاج 15–25% بدون تنظيف.", "التنظيف قبل وبعد الموسم يستعيد معظم الخسائر.", "الميل >15° يساعد المطر في التنظيف الذاتي."],
    },
  };
  const items = map[g.slug] ?? map["how-solar-panels-work"];
  return genericPage({
    lang, path, altPath,
    titleEn: `${g.nameEn} | SolarMatch Egypt`,
    titleAr: `${g.nameAr} | SolarMatch مصر`,
    descEn: `Complete guide: ${g.nameEn}. Practical advice for the Egyptian market with real numbers.`,
    descAr: `دليل شامل: ${g.nameAr}. نصائح عملية للسوق المصري بأرقام حقيقية.`,
    h1En: g.nameEn, h1Ar: g.nameAr,
    introEn: `This guide explains ${g.nameEn.toLowerCase()} in plain language and shows you how it applies to homes and businesses in Egypt.`,
    introAr: `هذا الدليل يشرح ${g.nameAr} بلغة بسيطة ويوضح كيف يطبَّق على المنازل والشركات في مصر.`,
    sections: items.en.map((b, i) => ({ headingEn: `Key point ${i + 1}`, headingAr: `نقطة رئيسية ${i + 1}`, bodyEn: b, bodyAr: items.ar[i] })),
    related: GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4).map((x) => guideLink(x, lang)),
    keywordsEn: `${g.nameEn.toLowerCase()}, solar guide Egypt`,
    keywordsAr: `${g.nameAr}, دليل الطاقة الشمسية مصر`,
  });
}

export function buildFinancingPage(f: FinancingTopic, lang: Lang): SeoPageProps {
  const path = lang === "ar" ? `/ar/financing/${f.slug}` : `/financing/${f.slug}`;
  const altPath = lang === "ar" ? `/financing/${f.slug}` : `/ar/financing/${f.slug}`;
  const map: Record<string, { en: string[]; ar: string[] }> = {
    "installment-plans": { en: ["Most major installers in Egypt offer 12–36 month installments with 0–20% down.", "Effective rate: 0–18% APR depending on duration.", "Best for residential 3–10 kWp systems."], ar: ["معظم كبار المركّبين في مصر يقدمون تقسيط 12–36 شهر بمقدم 0–20%.", "معدل فعلي: 0–18% سنوياً حسب المدة.", "الأنسب للأنظمة السكنية 3–10 كيلوواط."] },
    "bank-solar-loans": { en: ["NBE, CIB, Banque Misr offer green loans 15–22% APR for solar.", "Loan size up to EGP 500k for residential, multi-million for commercial.", "Tenor 3–7 years; some require 10–20% down payment."], ar: ["البنك الأهلي وCIB وبنك مصر يقدمون قروض خضراء 15–22% سنوياً للطاقة الشمسية.", "حجم القرض حتى 500 ألف جنيه سكني، وملايين للتجاري.", "مدة 3–7 سنوات؛ بعضها يتطلب مقدم 10–20%."] },
    "solar-leasing": { en: ["You don't own the system; the lessor maintains it and charges a flat monthly fee.", "Best for businesses that want OpEx not CapEx.", "Egyptian market still nascent — limited providers."], ar: ["لا تملك النظام؛ المؤجّر يصيّنه ويتقاضى رسماً شهرياً ثابتاً.", "الأنسب للشركات التي تفضل OpEx بدل CapEx.", "السوق المصري ناشئ — مزودون محدودون."] },
    "ppa-egypt": { en: ["Customer pays per kWh produced (no upfront cost).", "Common for industrial / commercial sites with stable consumption.", "Typical PPA price: EGP 1.4–1.9/kWh, locked 15–20 years."], ar: ["العميل يدفع لكل ك.و.س منتج (بدون تكلفة مقدمة).", "شائع للمواقع الصناعية والتجارية بالاستهلاك الثابت.", "السعر النموذجي: 1.4–1.9 جنيه/ك.و.س، مثبت 15–20 سنة."] },
  };
  const items = map[f.slug] ?? map["installment-plans"];
  return genericPage({
    lang, path, altPath,
    titleEn: `${f.nameEn} 2026 | SolarMatch`, titleAr: `${f.nameAr} 2026 | SolarMatch`,
    descEn: `Everything about ${f.nameEn.toLowerCase()}: terms, rates, eligibility and how to apply through SolarMatch partners.`,
    descAr: `كل ما يخص ${f.nameAr}: الشروط والأسعار والأهلية وكيفية التقديم عبر شركاء SolarMatch.`,
    h1En: f.nameEn, h1Ar: f.nameAr,
    introEn: `${f.nameEn} make solar accessible without paying the full system cost upfront. Here's how it works in Egypt today.`,
    introAr: `${f.nameAr} يجعل الطاقة الشمسية متاحة بدون دفع تكلفة النظام كاملة مقدماً. إليك كيف تعمل في مصر اليوم.`,
    sections: items.en.map((b, i) => ({ headingEn: `Key fact ${i + 1}`, headingAr: `حقيقة رئيسية ${i + 1}`, bodyEn: b, bodyAr: items.ar[i] })),
    related: FINANCING.filter((x) => x.slug !== f.slug).slice(0, 4).map((x) => finLink(x, lang)),
    keywordsEn: `${f.nameEn.toLowerCase()}, solar financing Egypt`,
    keywordsAr: `${f.nameAr}, تمويل الطاقة الشمسية`,
  });
}

export function buildRoiPage(r: RoiTopic, lang: Lang): SeoPageProps {
  const path = lang === "ar" ? `/ar/solar-roi/${r.slug}` : `/solar-roi/${r.slug}`;
  const altPath = lang === "ar" ? `/solar-roi/${r.slug}` : `/ar/solar-roi/${r.slug}`;
  return genericPage({
    lang, path, altPath,
    titleEn: `${r.nameEn} | Real Numbers 2026 | SolarMatch`,
    titleAr: `${r.nameAr} | أرقام حقيقية 2026 | SolarMatch`,
    descEn: `${r.nameEn} for Egyptian homes & businesses with current 2026 tariffs and component prices.`,
    descAr: `${r.nameAr} للمنازل والشركات المصرية وفق تعرفة 2026 الحالية وأسعار المكونات.`,
    h1En: r.nameEn, h1Ar: r.nameAr,
    introEn: `Solar ROI in Egypt is driven by three numbers: your tariff tier, your annual production (kWh/kWp/year), and the system price per kWp installed.`,
    introAr: `عائد الاستثمار في مصر يحدده 3 أرقام: شريحة التعرفة، الإنتاج السنوي (ك.و.س/ك.و.ذ/سنة)، وسعر النظام لكل كيلوواط مركّب.`,
    sections: [
      { headingEn: "Average payback in 2026", headingAr: "متوسط فترة الاسترداد 2026",
        bodyEn: "Residential 5 kWp: 4.5–6 years. Commercial 50 kWp: 3.5–5 years. Industrial >500 kWp: under 4 years.",
        bodyAr: "سكني 5 كيلوواط: 4.5–6 سنة. تجاري 50 كيلوواط: 3.5–5 سنة. صناعي >500 كيلوواط: أقل من 4 سنوات." },
      { headingEn: "What changes the math", headingAr: "ما الذي يغيّر الحسبة",
        bodyEn: "Tier crossing (>1,000 kWh), shading, panel quality, and inverter sizing — each can move payback by 12–18 months.",
        bodyAr: "تجاوز الشرائح (>1,000 ك.و.س)، التظليل، جودة الألواح، حجم الإنفرتر — كل منها قد يغيّر الاسترداد 12–18 شهراً." },
      { headingEn: "How SolarMatch calculates this", headingAr: "كيف يحسب SolarMatch ذلك",
        bodyEn: "We pull NASA POWER irradiance, Google Solar rooftop data, and current 2026 tariffs — then validate with an AI checkpoint.",
        bodyAr: "نسحب إشعاع NASA POWER، بيانات Google Solar للأسطح، وتعرفة 2026 — ثم نراجع بنقطة فحص AI." },
    ],
    related: ROI_TOPICS.filter((x) => x.slug !== r.slug).slice(0, 3).map((x) => roiLink(x, lang)),
    keywordsEn: `${r.nameEn.toLowerCase()}, solar ROI Egypt 2026`,
    keywordsAr: `${r.nameAr}, عائد الاستثمار في الطاقة الشمسية`,
  });
}
