import { ReactNode } from "react";
import type { SeoPageProps } from "./SeoPage";

type Lang = "en" | "ar";

// Topic slugs (English) — Arabic uses /ar/<same slug>
export const SEO_SLUGS = [
  "features",
  "pricing-plans", // /pricing already exists
  "about-solarmatch", // /about already exists
  "contact-us", // /contact already exists
  "faq",
  "solar-cost-egypt",
  "solar-for-farms-egypt",
  "solar-for-businesses-egypt",
  "solar-for-homes-egypt",
  "solar-roi-calculator",
  "electricity-tariff-egypt",
  "solar-panel-types",
  "case-studies",
] as const;

export type SeoSlug = typeof SEO_SLUGS[number];

// Path map — keep clean, SEO-friendly URLs
export const PATHS: Record<SeoSlug, { en: string; ar: string }> = {
  features: { en: "/features", ar: "/ar/features" },
  "pricing-plans": { en: "/pricing-plans", ar: "/ar/pricing-plans" },
  "about-solarmatch": { en: "/about-solarmatch", ar: "/ar/about-solarmatch" },
  "contact-us": { en: "/contact-us", ar: "/ar/contact-us" },
  faq: { en: "/faq", ar: "/ar/faq" },
  "solar-cost-egypt": { en: "/solar-cost-egypt", ar: "/ar/solar-cost-egypt" },
  "solar-for-farms-egypt": {
    en: "/solar-for-farms-egypt",
    ar: "/ar/solar-for-farms-egypt",
  },
  "solar-for-businesses-egypt": {
    en: "/solar-for-businesses-egypt",
    ar: "/ar/solar-for-businesses-egypt",
  },
  "solar-for-homes-egypt": {
    en: "/solar-for-homes-egypt",
    ar: "/ar/solar-for-homes-egypt",
  },
  "solar-roi-calculator": {
    en: "/solar-roi-calculator",
    ar: "/ar/solar-roi-calculator",
  },
  "electricity-tariff-egypt": {
    en: "/electricity-tariff-egypt",
    ar: "/ar/electricity-tariff-egypt",
  },
  "solar-panel-types": { en: "/solar-panel-types", ar: "/ar/solar-panel-types" },
  "case-studies": { en: "/case-studies", ar: "/ar/case-studies" },
};

// Helper: build related links (excluding self)
const buildRelated = (
  current: SeoSlug,
  lang: Lang,
  picks: SeoSlug[]
) =>
  picks
    .filter((s) => s !== current)
    .map((s) => ({ label: LABELS[lang][s], to: PATHS[s][lang] }));

const LABELS: Record<Lang, Record<SeoSlug, string>> = {
  en: {
    features: "Features",
    "pricing-plans": "Pricing Plans",
    "about-solarmatch": "About SolarMatch",
    "contact-us": "Contact Us",
    faq: "FAQ",
    "solar-cost-egypt": "Solar Cost in Egypt",
    "solar-for-farms-egypt": "Solar for Farms",
    "solar-for-businesses-egypt": "Solar for Businesses",
    "solar-for-homes-egypt": "Solar for Homes",
    "solar-roi-calculator": "ROI & Payback",
    "electricity-tariff-egypt": "Electricity Tariffs Egypt",
    "solar-panel-types": "Solar Panel Types",
    "case-studies": "Case Studies",
  },
  ar: {
    features: "المزايا",
    "pricing-plans": "خطط الأسعار",
    "about-solarmatch": "عن SolarMatch",
    "contact-us": "تواصل معنا",
    faq: "الأسئلة الشائعة",
    "solar-cost-egypt": "تكلفة الطاقة الشمسية في مصر",
    "solar-for-farms-egypt": "الطاقة الشمسية للمزارع",
    "solar-for-businesses-egypt": "الطاقة الشمسية للشركات",
    "solar-for-homes-egypt": "الطاقة الشمسية للمنازل",
    "solar-roi-calculator": "حاسبة العائد والاسترداد",
    "electricity-tariff-egypt": "شرائح الكهرباء في مصر",
    "solar-panel-types": "أنواع الألواح الشمسية",
    "case-studies": "دراسات الحالة",
  },
};

const CTA = {
  en: "Open the calculator",
  ar: "افتح الحاسبة الآن",
};

const p = (text: ReactNode) => <p>{text}</p>;

// ─────────────────────────────────────────────────────────────
// Build a single page payload for a slug + language
// ─────────────────────────────────────────────────────────────
export function getSeoPage(slug: SeoSlug, lang: Lang): SeoPageProps {
  const path = PATHS[slug][lang];
  const altPath = PATHS[slug][lang === "en" ? "ar" : "en"];
  const isAr = lang === "ar";

  const base = {
    lang,
    path,
    altPath,
    ctaLabel: CTA[lang],
    ctaTo: isAr ? "/?lang=ar" : "/",
  };

  switch (slug) {
    // ── 1. FEATURES ────────────────────────────
    case "features":
      return {
        ...base,
        title: isAr
          ? "مزايا منصة SolarMatch | تحليل الطاقة الشمسية في مصر"
          : "SolarMatch Features | Solar Feasibility for Egypt",
        description: isAr
          ? "اكتشف كل مزايا SolarMatch: تحليل المواقع، محرك الطاقة، التحليل المالي، ذكاء اصطناعي، تقارير PDF، حسابات وأدوات للأعمال."
          : "Discover every SolarMatch feature: smart location data, solar engine, financial analysis, AI verification, PDF reports, accounts, and business tools.",
        h1: isAr ? "كل مزايا SolarMatch في مكان واحد" : "Every SolarMatch feature, in one place",
        intro: p(
          isAr
            ? "SolarMatch منصة هندسية متكاملة لتقييم جدوى الطاقة الشمسية للمنازل والشركات والمزارع في مصر، مدعومة بـ Google Solar وبيانات NASA POWER."
            : "SolarMatch is an end-to-end engineering platform that assesses rooftop solar feasibility for homes, businesses, and farms across Egypt — powered by Google Solar and NASA POWER data."
        ),
        sections: [
          {
            heading: isAr ? "بيانات الموقع والمناخ الذكية" : "Smart Location & Climate Data",
            body: p(
              isAr
                ? "خرائط جوجل للأقمار الصناعية، رسم حدود السطح، إشعاع NASA POWER الحقيقي، درجة الحرارة، والغبار."
                : "Google satellite maps, rooftop polygon drawing, real NASA POWER irradiance, temperature, and dust modeling."
            ),
          },
          {
            heading: isAr ? "محرك التحليل الشمسي" : "Solar Analysis Engine",
            body: p(
              isAr
                ? "حسابات حتمية للطاقة المنتجة، حجم النظام الأمثل، وتغطية الاستهلاك بدقة هندسية."
                : "Deterministic calculations for energy yield, optimal system size, and consumption coverage with engineering accuracy."
            ),
          },
          {
            heading: isAr ? "التحليل المالي" : "Financial Analysis",
            body: p(
              isAr
                ? "تعرفة 2026 لـ 7 شرائح سكنية و6 تجارية و5 صناعية، مع توفير سنوي وفترة استرداد لكل سيناريو."
                : "2026 Egyptian tariffs (7 residential / 6 commercial / 5 industrial tiers) with annual savings and payback per scenario."
            ),
          },
          {
            heading: isAr ? "تحقق وتوصيات الذكاء الاصطناعي" : "AI Verification & Recommendations",
            body: p(
              isAr
                ? "نقطة فحص ذكاء اصطناعي تراجع الحسابات وتعدل ضمن ±30% لضمان الواقعية."
                : "AI checkpoint reviews calculations and adjusts within ±30% to keep results realistic."
            ),
          },
          {
            heading: isAr ? "تقارير PDF احترافية" : "Reports & PDF Export",
            body: p(
              isAr
                ? "تقرير ثنائي اللغة مع توقعات 25 سنة، التأثير البيئي، وتفاصيل المعدات."
                : "Bilingual PDF with 25-year projections, environmental impact, and equipment details."
            ),
          },
          {
            heading: isAr ? "حسابات المستخدمين" : "User Accounts",
            body: p(
              isAr
                ? "احفظ تقاريرك، تابع تاريخك، وأعد فتح أي تحليل سابق."
                : "Save reports, track history, and reopen any previous analysis."
            ),
          },
          {
            heading: isAr ? "أدوات الأعمال" : "Business Tools",
            body: p(
              isAr
                ? "تحليلات متقدمة، مقارنات الأنظمة، وعدد تقارير أعلى لخطة الأعمال."
                : "Advanced analytics, system comparison, and higher report quotas on the Business plan."
            ),
          },
          {
            heading: isAr ? "لوحة الإدارة" : "Admin Dashboard",
            body: p(
              isAr
                ? "إدارة المستخدمين، التقارير، والعملاء المحتملين، مع تحليلات شاملة."
                : "Manage users, reports, and leads with comprehensive analytics."
            ),
          },
        ],
        related: buildRelated(slug, lang, [
          "pricing-plans",
          "solar-roi-calculator",
          "case-studies",
          "solar-for-businesses-egypt",
        ]),
        keywords: isAr
          ? "مزايا الطاقة الشمسية, دراسة جدوى الطاقة الشمسية, حاسبة الطاقة الشمسية في مصر"
          : "solar feasibility features, solar calculator Egypt, rooftop solar analysis",
      };

    // ── 2. PRICING ────────────────────────────
    case "pricing-plans":
      return {
        ...base,
        title: isAr
          ? "خطط أسعار SolarMatch | مجاني، تقرير واحد، بريميوم، أعمال"
          : "SolarMatch Pricing Plans | Free, Single Report, Premium, Business",
        description: isAr
          ? "اختر الخطة المناسبة: مجاني (تقرير واحد)، تقرير منفرد، بريميوم للمنازل، أو أعمال للشركات والمزارع."
          : "Pick a plan: Free (1 report), Single Report, Premium for households, or Business for companies and farms.",
        h1: isAr ? "خطط مرنة لكل مستخدم" : "Plans for every solar journey",
        intro: p(
          isAr
            ? "SolarMatch يوفر خططاً مرنة سواء كنت تبحث عن تقرير واحد أو تدير عشرات الدراسات شهرياً."
            : "SolarMatch offers flexible pricing whether you need a single report or run dozens of studies a month."
        ),
        sections: [
          { heading: isAr ? "مجاني" : "Free", body: p(isAr ? "تقرير واحد لتجربة المنصة." : "One free report to try the platform.") },
          { heading: isAr ? "تقرير منفرد" : "Single Report", body: p(isAr ? "ادفع لمرة واحدة لتقرير دقيق إضافي." : "Pay once for an additional detailed report.") },
          { heading: isAr ? "بريميوم" : "Premium", body: p(isAr ? "للمستخدمين النشطين: حد أعلى للتقارير، مقارنات وأدوات متقدمة." : "For active users: higher quotas, system comparison, and advanced tools.") },
          { heading: isAr ? "أعمال" : "Business", body: p(isAr ? "للمقاولين والمستشارين: لوحات تحليلية، تقارير غير محدودة فعلياً، ودعم متقدم." : "For installers and consultants: analytics dashboards, near-unlimited reports, and priority support.") },
        ],
        related: buildRelated(slug, lang, ["features", "solar-for-businesses-egypt", "solar-roi-calculator"]),
        keywords: isAr ? "أسعار الطاقة الشمسية, اشتراك حاسبة شمسية" : "solar pricing, solar calculator subscription Egypt",
      };

    // ── 3. ABOUT ────────────────────────────
    case "about-solarmatch":
      return {
        ...base,
        title: isAr ? "عن SolarMatch | منصة جدوى الطاقة الشمسية في مصر" : "About SolarMatch | Egypt's Solar Feasibility Platform",
        description: isAr
          ? "تعرّف على SolarMatch: المهمة، المشكلة، والحل لتقييم الطاقة الشمسية للمنازل والشركات والمزارع في مصر."
          : "Learn about SolarMatch: our mission, the problem we solve, and how we evaluate rooftop solar across Egypt.",
        h1: isAr ? "من نحن" : "Who we are",
        intro: p(
          isAr
            ? "SolarMatch تساعد ملاك المنازل والمزارع والشركات في مصر على اتخاذ قرار واعٍ قبل التواصل مع المركبين."
            : "SolarMatch helps Egyptian homeowners, farmers, and businesses make informed decisions before contacting installers."
        ),
        sections: [
          { heading: isAr ? "المشكلة" : "The Problem", body: p(isAr ? "صعوبة معرفة الجدوى الحقيقية للطاقة الشمسية بدون استشارة مكلفة." : "It's hard to know the real feasibility of solar without an expensive consultation.") },
          { heading: isAr ? "الحل" : "Our Solution", body: p(isAr ? "تحليل هندسي مدعوم ببيانات حقيقية وذكاء اصطناعي خلال دقائق." : "Engineering-grade analysis powered by real data and AI in minutes.") },
          { heading: isAr ? "لماذا مصر" : "Why Egypt", body: p(isAr ? "إشعاع شمسي ممتاز، تعرفة كهرباء متصاعدة، وحاجة ملحّة لحلول الطاقة." : "Excellent solar irradiance, rising electricity tariffs, and urgent need for clean energy.") },
        ],
        related: buildRelated(slug, lang, ["features", "case-studies", "contact-us"]),
        keywords: isAr ? "عن المنصة, الطاقة الشمسية في مصر" : "about SolarMatch, Egypt solar platform",
      };

    // ── 4. CONTACT ────────────────────────────
    case "contact-us":
      return {
        ...base,
        title: isAr ? "تواصل مع SolarMatch | دعم وشراكات" : "Contact SolarMatch | Support & Partnerships",
        description: isAr
          ? "تواصل مع فريق SolarMatch للدعم، الشراكات، أو استشارة خبير في الطاقة الشمسية."
          : "Reach out to SolarMatch for support, partnerships, or expert solar consultation.",
        h1: isAr ? "تواصل معنا" : "Get in touch",
        intro: p(
          isAr
            ? "نحن هنا لمساعدتك في كل خطوة من رحلتك نحو الطاقة الشمسية."
            : "We're here to help at every step of your solar journey."
        ),
        sections: [
          { heading: isAr ? "الدعم الفني" : "Technical Support", body: p(isAr ? "أسئلة عن الحاسبة، التقارير، أو الحساب." : "Questions about the calculator, reports, or your account.") },
          { heading: isAr ? "الشراكات" : "Partnerships", body: p(isAr ? "للمركبين والموردين الراغبين بالعمل مع SolarMatch." : "For installers and suppliers interested in working with SolarMatch.") },
          { heading: isAr ? "استشارة خبير" : "Expert Consultation", body: p(isAr ? "احجز جلسة مع مهندس طاقة شمسية معتمد." : "Book a session with a certified solar engineer.") },
        ],
        related: buildRelated(slug, lang, ["about-solarmatch", "features", "pricing-plans"]),
        keywords: isAr ? "تواصل, دعم الطاقة الشمسية" : "contact solar support Egypt",
      };

    // ── 5. FAQ ────────────────────────────
    case "faq":
      return {
        ...base,
        title: isAr ? "الأسئلة الشائعة | SolarMatch" : "FAQ | SolarMatch",
        description: isAr
          ? "إجابات على الأسئلة الأكثر شيوعاً عن الطاقة الشمسية في مصر، دقة النتائج، الاسترداد، وخطط الاشتراك."
          : "Answers to the most common questions about solar in Egypt, result accuracy, payback, and subscription plans.",
        h1: isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions",
        intro: p(isAr ? "كل ما تحتاج معرفته قبل تركيب الطاقة الشمسية." : "Everything you need to know before going solar."),
        sections: [
          { heading: isAr ? "نظرة سريعة" : "Quick Overview", body: p(isAr ? "اطّلع على الإجابات الكاملة في قسم الأسئلة أدناه." : "See full answers in the questions below.") },
        ],
        faqs: isAr
          ? [
              { q: "هل الطاقة الشمسية مجدية في مصر؟", a: "نعم، مصر من أفضل دول العالم في الإشعاع الشمسي مع متوسط 1800 كيلوواط ساعة/كيلوواط/سنة." },
              { q: "ما مدى دقة نتائج SolarMatch؟", a: "نستخدم Google Solar وNASA POWER وتعرفة 2026 الرسمية، وتراجع الحسابات بواسطة طبقة AI." },
              { q: "كيف يُحسب فترة الاسترداد؟", a: "بقسمة التكلفة الإجمالية على التوفير السنوي مع مراعاة الشرائح التصاعدية." },
              { q: "ما الفرق بين بريميوم وأعمال؟", a: "بريميوم للمنازل النشطة، وأعمال للمقاولين والشركات بحدود تقارير أعلى وأدوات متقدمة." },
            ]
          : [
              { q: "Is solar worth it in Egypt?", a: "Yes — Egypt has world-class irradiance averaging 1,800 kWh/kWp/year." },
              { q: "How accurate are SolarMatch results?", a: "We combine Google Solar, NASA POWER, and the official 2026 tariff, then validate with an AI checkpoint." },
              { q: "How is the payback period calculated?", a: "Total cost divided by annual savings, accounting for tiered tariff billing." },
              { q: "What's the difference between Premium and Business?", a: "Premium fits active homeowners; Business is for installers/companies with higher quotas and advanced tools." },
            ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "solar-roi-calculator", "electricity-tariff-egypt"]),
        keywords: isAr ? "أسئلة الطاقة الشمسية, جدوى الطاقة الشمسية مصر" : "solar FAQ Egypt, solar feasibility questions",
      };

    // ── 6. SOLAR COST EGYPT ────────────────────────────
    case "solar-cost-egypt":
      return {
        ...base,
        title: isAr ? "تكلفة الطاقة الشمسية في مصر 2026 | SolarMatch" : "Solar Installation Cost in Egypt 2026 | SolarMatch",
        description: isAr
          ? "أسعار محدّثة لتركيب الطاقة الشمسية في مصر 2026 لكل كيلوواط، حسب نوع النظام والباقة."
          : "Up-to-date 2026 solar installation prices in Egypt per kWp, by system type and package.",
        h1: isAr ? "كم تكلف الطاقة الشمسية في مصر؟" : "How much does solar cost in Egypt?",
        intro: p(
          isAr
            ? "تتراوح تكلفة الأنظمة السكنية في مصر بين 18,000 و32,000 جنيه لكل كيلوواط، حسب الباقة."
            : "Residential solar systems in Egypt range from EGP 18,000 to 32,000 per kWp depending on the package tier."
        ),
        sections: [
          { heading: isAr ? "الباقة الاقتصادية" : "Economy Package", body: p(isAr ? "ألواح Mono PERC وانفرتر صيني موثوق — أفضل قيمة للمنازل الصغيرة." : "Mono PERC panels with reliable Chinese inverter — best value for small homes.") },
          { heading: isAr ? "الباقة القياسية" : "Standard Package", body: p(isAr ? "ألواح Tier-1 وانفرتر أوروبي/كوري — التوازن الأمثل." : "Tier-1 panels with European/Korean inverter — the optimal balance.") },
          { heading: isAr ? "الباقة المميزة" : "Premium Package", body: p(isAr ? "ألواح TOPCon/HJT مع انفرتر مميز وضمان طويل." : "TOPCon/HJT panels with premium inverter and long warranties.") },
          { heading: isAr ? "ما يؤثر على السعر" : "What affects price", body: p(isAr ? "حجم النظام، نوع الألواح، الانفرتر، تعقيد التركيب، وموقع العقار." : "System size, panel type, inverter, install complexity, and site location.") },
        ],
        faqs: isAr
          ? [
              { q: "هل يمكن تمويل النظام؟", a: "نعم، عبر عدة بنوك وشركات تمويل بقروض ميسرة." },
              { q: "ما عمر النظام؟", a: "عادةً 25 سنة مع ضمان أداء على الألواح." },
            ]
          : [
              { q: "Can I finance the system?", a: "Yes, through several Egyptian banks and financing companies with installment plans." },
              { q: "What is the system lifetime?", a: "Typically 25 years with a panel performance warranty." },
            ],
        related: buildRelated(slug, lang, ["solar-roi-calculator", "solar-panel-types", "solar-for-homes-egypt"]),
        keywords: isAr ? "تكلفة الطاقة الشمسية, أسعار ألواح شمسية مصر" : "solar cost Egypt, solar panel price Egypt",
      };

    // ── 7. SOLAR FOR FARMS ────────────────────────────
    case "solar-for-farms-egypt":
      return {
        ...base,
        title: isAr ? "الطاقة الشمسية للمزارع في مصر | SolarMatch" : "Solar for Farms in Egypt | SolarMatch",
        description: isAr
          ? "حلول الطاقة الشمسية للمزارع في مصر: ضخ المياه، تبريد، وتشغيل المعدات بطاقة نظيفة وموفّرة."
          : "Solar solutions for Egyptian farms: water pumping, cooling, and equipment with clean, low-cost energy.",
        h1: isAr ? "الطاقة الشمسية للمزارع" : "Solar power for farms",
        intro: p(
          isAr
            ? "وضع المزارع في SolarMatch يدعم الفدّان كوحدة قياس ويحسب 85% من المساحة الصالحة للتركيب."
            : "Farm Mode in SolarMatch supports feddans as the unit and uses 85% of the area as installable."
        ),
        sections: [
          { heading: isAr ? "ضخ المياه الشمسي" : "Solar Water Pumping", body: p(isAr ? "بدائل اقتصادية وموثوقة عن مولدات الديزل." : "Reliable, economical alternatives to diesel generators.") },
          { heading: isAr ? "أنظمة التبريد" : "Cooling Systems", body: p(isAr ? "غرف تبريد المنتجات تعمل بالشمس بشكل اقتصادي." : "Crop cold-rooms powered economically by solar.") },
          { heading: isAr ? "الوفر" : "Savings", body: p(isAr ? "تخفيض كبير في فاتورة الكهرباء أو الديزل بمدد استرداد قصيرة." : "Major reductions in power/diesel bills with short payback periods.") },
        ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "solar-for-businesses-egypt", "case-studies"]),
        keywords: isAr ? "طاقة شمسية للمزارع, ضخ مياه شمسي, جدوى مزرعة" : "solar farms Egypt, agricultural solar, farm feasibility",
      };

    // ── 8. SOLAR FOR BUSINESSES ────────────────────────────
    case "solar-for-businesses-egypt":
      return {
        ...base,
        title: isAr ? "الطاقة الشمسية للشركات والمصانع | SolarMatch" : "Solar for Businesses & Factories in Egypt | SolarMatch",
        description: isAr
          ? "حلول الطاقة الشمسية التجارية والصناعية في مصر مع تحليل دقيق للشرائح التجارية والصناعية."
          : "Commercial and industrial solar in Egypt with precise analysis on commercial and industrial tariff tiers.",
        h1: isAr ? "الطاقة الشمسية للشركات" : "Solar for businesses",
        intro: p(
          isAr
            ? "الشركات والمصانع تواجه تعرفة مرتفعة، مما يجعل الطاقة الشمسية أحد أسرع استثمارات استرداد التكلفة."
            : "Businesses and factories face high tariffs, making solar one of the fastest payback investments."
        ),
        sections: [
          { heading: isAr ? "تحليل الشرائح التجارية" : "Commercial Tariff Analysis", body: p(isAr ? "ندعم 6 شرائح تجارية و5 شرائح صناعية بحسب تعرفة 2026." : "We support 6 commercial and 5 industrial tiers per the 2026 tariff.") },
          { heading: isAr ? "أنظمة كبيرة" : "Large-scale systems", body: p(isAr ? "تحليل دقيق للأنظمة فوق 50 كيلوواط بدون قيود." : "Precise analysis for systems above 50 kWp without limits.") },
          { heading: isAr ? "تقارير للممولين" : "Investor-grade Reports", body: p(isAr ? "تقارير PDF احترافية تصلح للبنوك والممولين." : "Professional PDF reports suitable for banks and investors.") },
        ],
        related: buildRelated(slug, lang, ["pricing-plans", "solar-roi-calculator", "case-studies"]),
        keywords: isAr ? "طاقة شمسية للمصانع, طاقة شمسية تجارية" : "commercial solar Egypt, industrial solar Egypt",
      };

    // ── 9. SOLAR FOR HOMES ────────────────────────────
    case "solar-for-homes-egypt":
      return {
        ...base,
        title: isAr ? "الطاقة الشمسية للمنازل في مصر | SolarMatch" : "Solar for Homes in Egypt | SolarMatch",
        description: isAr
          ? "كل ما يحتاجه صاحب المنزل في مصر لتقييم تركيب نظام طاقة شمسية على السطح."
          : "Everything an Egyptian homeowner needs to evaluate rooftop solar.",
        h1: isAr ? "الطاقة الشمسية للمنازل" : "Solar for homes",
        intro: p(
          isAr
            ? "بيتك يستهلك 600–1500 كيلوواط ساعة شهرياً؟ الطاقة الشمسية يمكن أن تخفّض فاتورتك بشكل كبير."
            : "Does your home use 600–1,500 kWh/month? Solar can dramatically cut your bill."
        ),
        sections: [
          { heading: isAr ? "ابدأ من سطحك" : "Start from your roof", body: p(isAr ? "ارسم سطحك على الخريطة وأدخل استهلاكك الشهري." : "Draw your roof on the map and enter monthly consumption.") },
          { heading: isAr ? "وضع المباني" : "Building Mode", body: p(isAr ? "للعمارات السكنية، يدعم SolarMatch وحدات متعددة." : "For apartment buildings, SolarMatch supports multiple units.") },
          { heading: isAr ? "ربط الشبكة" : "Grid Connection", body: p(isAr ? "موصول بالشبكة، هجين، أو مستقل — حسب نسبة التغطية." : "Grid-tied, hybrid, or off-grid — based on your coverage ratio.") },
        ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "electricity-tariff-egypt", "solar-roi-calculator"]),
        keywords: isAr ? "ألواح شمسية للمنازل, طاقة شمسية منزلية مصر" : "home solar Egypt, residential solar Egypt",
      };

    // ── 10. ROI CALCULATOR ────────────────────────────
    case "solar-roi-calculator":
      return {
        ...base,
        title: isAr ? "حاسبة العائد وفترة الاسترداد للطاقة الشمسية | SolarMatch" : "Solar ROI & Payback Calculator | SolarMatch",
        description: isAr
          ? "احسب فترة استرداد التكلفة والعائد على الاستثمار للطاقة الشمسية في مصر بدقة هندسية."
          : "Calculate solar payback period and ROI in Egypt with engineering accuracy.",
        h1: isAr ? "العائد وفترة الاسترداد" : "ROI & Payback explained",
        intro: p(
          isAr
            ? "العائد على الاستثمار يقيس مدى ربحية النظام الشمسي، وفترة الاسترداد تخبرك متى يدفع النظام نفسه."
            : "ROI measures system profitability and payback tells you when the system pays for itself."
        ),
        sections: [
          { heading: isAr ? "كيف نحسب التوفير" : "How we compute savings", body: p(isAr ? "إنتاج النظام × سعر الكهرباء حسب شريحتك التصاعدية." : "Production × your tier-based tariff price.") },
          { heading: isAr ? "كيف نحسب الاسترداد" : "How we compute payback", body: p(isAr ? "التكلفة الإجمالية ÷ التوفير السنوي." : "Total cost ÷ annual savings.") },
          { heading: isAr ? "إسقاط 25 سنة" : "25-year projection", body: p(isAr ? "نعرض التدفق النقدي على عمر النظام كاملاً." : "We show the cashflow over the entire system lifetime.") },
        ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "electricity-tariff-egypt", "case-studies"]),
        keywords: isAr ? "استرداد الطاقة الشمسية, عائد الاستثمار" : "solar ROI Egypt, payback period solar",
      };

    // ── 11. ELECTRICITY TARIFF ────────────────────────────
    case "electricity-tariff-egypt":
      return {
        ...base,
        title: isAr ? "شرائح الكهرباء في مصر 2026 | SolarMatch" : "Egypt Electricity Tariff Brackets 2026 | SolarMatch",
        description: isAr
          ? "شرائح وأسعار الكهرباء السكنية والتجارية والصناعية في مصر لعام 2026."
          : "Residential, commercial, and industrial electricity tariff brackets in Egypt for 2026.",
        h1: isAr ? "شرائح الكهرباء في مصر 2026" : "Egypt electricity tariffs (2026)",
        intro: p(
          isAr
            ? "تعتمد فاتورة الكهرباء في مصر على نظام شرائح تصاعدية. كلما زاد الاستهلاك، ارتفع سعر الكيلوواط/ساعة."
            : "Egypt's electricity is billed on a progressive tier system — higher use means higher per-kWh price."
        ),
        sections: [
          { heading: isAr ? "السكني (7 شرائح)" : "Residential (7 tiers)", body: p(isAr ? "من 0–50 كيلوواط حتى ما فوق 1000 كيلوواط شهرياً." : "From 0–50 kWh up to over 1,000 kWh/month.") },
          { heading: isAr ? "التجاري (6 شرائح)" : "Commercial (6 tiers)", body: p(isAr ? "أسعار أعلى تجعل العائد على الاستثمار أسرع." : "Higher prices make solar ROI faster.") },
          { heading: isAr ? "الصناعي (5 شرائح)" : "Industrial (5 tiers)", body: p(isAr ? "حسب الجهد المنخفض/المتوسط/العالي." : "Based on low/medium/high voltage.") },
        ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "solar-roi-calculator", "solar-for-homes-egypt"]),
        keywords: isAr ? "شرائح الكهرباء, تعرفة الكهرباء مصر 2026" : "Egypt electricity tariff 2026, kWh price Egypt",
      };

    // ── 12. SOLAR PANEL TYPES ────────────────────────────
    case "solar-panel-types":
      return {
        ...base,
        title: isAr ? "أنواع الألواح الشمسية | Mono PERC, HJT, TOPCon, Bifacial" : "Solar Panel Types | Mono PERC, HJT, TOPCon, Bifacial",
        description: isAr
          ? "مقارنة بين Mono PERC وBifacial وHJT وTOPCon لاختيار الأنسب لمنزلك أو مشروعك في مصر."
          : "Compare Mono PERC, Bifacial, HJT, and TOPCon to choose the best panel for your Egyptian project.",
        h1: isAr ? "أنواع الألواح الشمسية" : "Solar panel technologies",
        intro: p(
          isAr
            ? "اختيار نوع اللوح يؤثر على الإنتاج، السعر، والعمر الافتراضي."
            : "Panel choice affects production, price, and lifetime."
        ),
        sections: [
          { heading: "Mono PERC", body: p(isAr ? "الأكثر شيوعاً، توازن جيد بين السعر والكفاءة (~20–21%)." : "Most common, good balance of price and efficiency (~20–21%).") },
          { heading: "Bifacial", body: p(isAr ? "ينتج من الوجهين بزيادة 5–15% في المساحات العاكسة." : "Generates from both sides — 5–15% gain on reflective surfaces.") },
          { heading: "HJT", body: p(isAr ? "كفاءة عالية (~22–24%) وأداء ممتاز في الحرارة المرتفعة." : "High efficiency (~22–24%) and excellent in high heat.") },
          { heading: "TOPCon", body: p(isAr ? "تقنية حديثة بكفاءة (~22%) ومعدل تدهور منخفض." : "Newer tech (~22%) with very low degradation.") },
        ],
        related: buildRelated(slug, lang, ["solar-cost-egypt", "features", "solar-for-homes-egypt"]),
        keywords: isAr ? "أنواع ألواح شمسية, mono perc, hjt, topcon" : "solar panel types, mono perc, hjt, topcon",
      };

    // ── 13. CASE STUDIES ────────────────────────────
    case "case-studies":
      return {
        ...base,
        title: isAr ? "دراسات حالة | فيلا، مزرعة، ومصنع في مصر" : "Case Studies | Villa, Farm, and Factory in Egypt",
        description: isAr
          ? "أمثلة حقيقية لمشاريع الطاقة الشمسية: فيلا في القاهرة الجديدة، مزرعة في البحيرة، ومصنع في الإسكندرية."
          : "Real solar project examples: a villa in New Cairo, a farm in Beheira, and a factory in Alexandria.",
        h1: isAr ? "دراسات حالة من SolarMatch" : "SolarMatch case studies",
        intro: p(
          isAr
            ? "كيف تبدو نتائج SolarMatch في مشاريع حقيقية متنوعة الأحجام والقطاعات."
            : "How SolarMatch results look across real projects of different sizes and sectors."
        ),
        sections: [
          { heading: isAr ? "فيلا في القاهرة الجديدة" : "Villa in New Cairo", body: p(isAr ? "نظام 12 كيلوواط، توفير سنوي ~84,000 جنيه، استرداد 4.6 سنة." : "12 kWp system, ~EGP 84,000/year savings, 4.6-year payback.") },
          { heading: isAr ? "مزرعة في البحيرة" : "Farm in Beheira", body: p(isAr ? "نظام 75 كيلوواط لضخ المياه، تخفيض ديزل 92%، استرداد 3.8 سنة." : "75 kWp water pumping, 92% diesel reduction, 3.8-year payback.") },
          { heading: isAr ? "مصنع في الإسكندرية" : "Factory in Alexandria", body: p(isAr ? "نظام 220 كيلوواط، تخفيض فاتورة 65%، استرداد 4.2 سنة." : "220 kWp system, 65% bill reduction, 4.2-year payback.") },
        ],
        related: buildRelated(slug, lang, ["solar-for-homes-egypt", "solar-for-farms-egypt", "solar-for-businesses-egypt"]),
        keywords: isAr ? "دراسات حالة طاقة شمسية مصر" : "solar case studies Egypt",
      };
  }
}
