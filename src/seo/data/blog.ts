// Pillar blog/knowledge base articles. Bilingual, long-form, internally linked.
// Each article maps to /blog/:slug (en) and /ar/blog/:slug (ar).

export interface BlogSection {
  headingEn: string;
  headingAr: string;
  bodyEn: string;
  bodyAr: string;
}

export interface BlogPost {
  slug: string;            // English URL slug
  arSlug: string;          // Arabic URL slug (URL-encoded native Arabic)
  cluster: "basics" | "finance" | "regulation" | "technology" | "market";
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  keywords: string;        // shared keyword set, comma separated
  introEn: string;
  introAr: string;
  sections: BlogSection[];
  faqs: { qEn: string; aEn: string; qAr: string; aAr: string }[];
  publishedAt: string;     // ISO
  updatedAt: string;       // ISO
  readingMinutes: number;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "is-solar-worth-it-in-egypt-2026",
    arSlug: "هل-الطاقة-الشمسية-مجدية-في-مصر-2026",
    cluster: "basics",
    titleEn: "Is Solar Energy Worth It in Egypt in 2026? Honest Numbers",
    titleAr: "هل الطاقة الشمسية مجدية في مصر 2026؟ أرقام حقيقية",
    descriptionEn: "Real cost, savings, payback and ROI for residential solar in Egypt 2026 — based on the new 7-tier tariff and current market prices.",
    descriptionAr: "التكلفة الفعلية والتوفير وفترة الاسترداد للطاقة الشمسية المنزلية في مصر 2026 — مبنية على الشريحة السابعة الجديدة وأسعار السوق الحقيقية.",
    keywords: "solar Egypt 2026, is solar worth it Egypt, solar cost Egypt, solar payback Egypt, الطاقة الشمسية مصر, جدوى الطاقة الشمسية",
    introEn: "After the 2026 tariff hike, the question 'is solar worth it in Egypt?' has a clearer answer than ever. With residential prices in the top tiers exceeding EGP 2.95/kWh, solar payback periods have dropped to 3.5–5.5 years for most homes — a return on investment most savings accounts can't match. Below, we break down the real numbers using SolarMatch field data.",
    introAr: "بعد زيادات تعرفة 2026، أصبحت إجابة سؤال «هل الطاقة الشمسية مجدية في مصر؟» أوضح من أي وقت مضى. مع تجاوز سعر الكهرباء المنزلية في الشرائح العليا 2.95 جنيه/ك.و.س، انخفضت فترة الاسترداد إلى 3.5-5.5 سنة لمعظم البيوت — عائد لا تنافسه أي وديعة بنكية. فيما يلي تفصيل الأرقام الحقيقية من بيانات سولار ماتش الميدانية.",
    sections: [
      {
        headingEn: "The 2026 tariff reality",
        headingAr: "حقيقة تعرفة 2026",
        bodyEn: "Egypt's 7-tier residential tariff now charges EGP 2.95/kWh above 1000 kWh and EGP 2.45/kWh in the 651–1000 bracket. A villa consuming 1500 kWh/month pays around EGP 4,200/month — exactly the bill solar eliminates fastest. The higher your tier, the faster solar pays back.",
        bodyAr: "تعرفة 2026 المنزلية المكوّنة من 7 شرائح أصبحت تحاسب 2.95 جنيه/ك.و.س فوق 1000 ك.و.س و2.45 جنيه/ك.و.س في شريحة 651-1000. فيلا تستهلك 1500 ك.و.س شهرياً تدفع تقريباً 4,200 جنيه/شهر — وهي الفاتورة التي تختفي بأسرع وقت بالطاقة الشمسية. كلما ارتفعت شريحتك، أسرعت فترة استرداد الطاقة الشمسية.",
      },
      {
        headingEn: "Real cost of solar in Egypt today",
        headingAr: "التكلفة الحقيقية للطاقة الشمسية اليوم",
        bodyEn: "Turnkey on-grid systems in 2026 average EGP 22,000–26,000 per kWp installed (Tier-1 panels, Egyptian-assembled inverters, 25-year structure). A 5 kWp residential system costs around EGP 110,000–130,000 fully installed. Hybrid systems with lithium batteries add ~EGP 18,000–25,000 per usable kWh of storage.",
        bodyAr: "أنظمة on-grid الجاهزة في 2026 تتراوح بين 22,000 و26,000 جنيه لكل كيلوواط مركّب (ألواح Tier-1 وإنفرتر مُجمّع محلياً وحامل ضمان 25 سنة). نظام منزلي 5 كيلوواط يكلّف 110,000-130,000 جنيه كامل التركيب. الأنظمة الهجينة بالبطاريات الليثيوم تضيف 18,000-25,000 جنيه لكل ك.و.س قابل للاستخدام من السعة التخزينية.",
      },
      {
        headingEn: "Payback by bill size",
        headingAr: "الاسترداد حسب حجم الفاتورة",
        bodyEn: "EGP 1,000 bill → ~5.8-year payback. EGP 2,000 bill → ~4.6-year payback. EGP 4,000 bill → ~3.5-year payback. EGP 8,000 bill (commercial) → ~2.8-year payback. After payback, you keep ~20 more years of near-free electricity, with panel degradation under 0.5%/year.",
        bodyAr: "فاتورة 1,000 جنيه → استرداد ≈ 5.8 سنة. فاتورة 2,000 → ≈ 4.6 سنة. فاتورة 4,000 → ≈ 3.5 سنة. فاتورة 8,000 (تجاري) → ≈ 2.8 سنة. بعد الاسترداد تحصل على 20 سنة إضافية من كهرباء شبه مجانية، مع تدهور أداء الألواح أقل من 0.5%/سنة.",
      },
      {
        headingEn: "Hidden factors most calculators miss",
        headingAr: "عوامل خفية تتجاهلها معظم الحاسبات",
        bodyEn: "Khamaseen dust losses (5–8% in spring), summer panel temperature derating (10–14% above 35°C), inverter clipping on oversized arrays, and shading from neighbouring buildings all reduce real-world output. SolarMatch applies all of these to give you the honest annual production — not the marketing figure.",
        bodyAr: "خسائر غبار الخماسين (5-8% في الربيع)، انخفاض كفاءة الألواح في حرارة الصيف (10-14% فوق 35°م)، فقد الإنفرتر عند تكبير المصفوفة، والتظليل من المباني المجاورة — كلها تقلّل الإنتاج الفعلي. سولار ماتش يطبّق هذه العوامل لإعطائك الإنتاج السنوي الحقيقي، لا الرقم التسويقي.",
      },
    ],
    faqs: [
      { qEn: "Is solar mandatory in Egypt now?", aEn: "No, but for properties consuming above 650 kWh/month it has become the most rational financial decision after the 2026 tariff.", qAr: "هل الطاقة الشمسية إلزامية في مصر الآن؟", aAr: "لا، لكن للعقارات التي تستهلك فوق 650 ك.و.س شهرياً أصبحت القرار المالي الأكثر منطقية بعد تعرفة 2026." },
      { qEn: "Do I need EgyptERA approval?", aEn: "On-grid systems above 500 kWp require EgyptERA licensing; smaller residential systems use a simplified net-metering procedure with your local distribution company.", qAr: "هل أحتاج موافقة جهاز تنظيم الكهرباء؟", aAr: "أنظمة on-grid فوق 500 كيلوواط تحتاج ترخيص الجهاز؛ الأنظمة المنزلية الأصغر تتبع إجراء net-metering مبسّط مع شركة التوزيع." },
      { qEn: "What about resale value?", aEn: "Properties with installed solar in Cairo and the North Coast resell at a 3–7% premium based on 2025 broker surveys.", qAr: "ماذا عن قيمة إعادة البيع؟", aAr: "العقارات المركّب بها طاقة شمسية في القاهرة والساحل الشمالي تُباع بزيادة 3-7% حسب استطلاعات وسطاء 2025." },
    ],
    publishedAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    readingMinutes: 7,
  },
  {
    slug: "on-grid-vs-hybrid-vs-off-grid-egypt",
    arSlug: "on-grid-vs-hybrid-vs-off-grid-في-مصر",
    cluster: "technology",
    titleEn: "On-Grid vs Hybrid vs Off-Grid: Which Is Right for Egypt?",
    titleAr: "On-Grid أم Hybrid أم Off-Grid: أيهما الأنسب لمصر؟",
    descriptionEn: "The complete decision guide for Egyptian homes and businesses choosing between grid-tied, hybrid (with battery) and off-grid solar systems.",
    descriptionAr: "الدليل الكامل لاختيار النظام الشمسي المناسب في مصر بين متصل بالشبكة وهجين بالبطاريات وخارج الشبكة.",
    keywords: "on-grid solar Egypt, hybrid solar Egypt, off-grid solar Egypt, net metering Egypt, نظام شمسي هجين, on grid مصر",
    introEn: "Choosing the wrong system architecture is the #1 reason solar projects underperform in Egypt. The right answer depends on three things: how stable your grid is, whether you need night-time backup, and your budget elasticity. Here's the framework SolarMatch engineers use.",
    introAr: "اختيار البنية الخطأ للنظام هو السبب الأول في فشل المشاريع الشمسية في مصر. الاختيار الصحيح يعتمد على ثلاثة عوامل: استقرار الشبكة، الحاجة لاحتياطي ليلي، ومرونة الميزانية. إليك الإطار الذي يستخدمه مهندسو سولار ماتش.",
    sections: [
      { headingEn: "On-Grid (cheapest, most efficient)", headingAr: "On-Grid (الأرخص والأكفأ)", bodyEn: "Your panels feed the home first; surplus exports to the grid via a bidirectional meter (net metering). No batteries, no maintenance overhead, fastest payback (3.5–5 years). The downside: zero backup during outages. Recommended for stable urban grids in Cairo, Alexandria, Giza.", bodyAr: "الألواح تغذّي البيت أولاً ثم يصدّر الفائض للشبكة عبر عداد ثنائي (net metering). لا بطاريات ولا صيانة معقّدة، أسرع استرداد (3.5-5 سنة). العيب: لا احتياطي أثناء الانقطاع. ينصح به للشبكات الحضرية المستقرة في القاهرة والإسكندرية والجيزة." },
      { headingEn: "Hybrid (best balance)", headingAr: "Hybrid (التوازن الأفضل)", bodyEn: "Solar + lithium battery + grid. Powers critical loads during outages (fridge, lights, internet, AC) and still exports surplus by day. Ideal for Upper Egypt, the Delta and any property with frequent outages. Adds 25–35% to total cost but eliminates outage stress.", bodyAr: "ألواح + بطارية ليثيوم + شبكة. يشغّل الأحمال الحيوية أثناء الانقطاع (الثلاجة والإنارة والإنترنت والتكييف) ويصدّر الفائض نهاراً. مثالي للصعيد والدلتا وأي عقار به انقطاعات متكررة. يضيف 25-35% للتكلفة لكنه يلغي قلق انقطاع الكهرباء." },
      { headingEn: "Off-Grid (only for remote sites)", headingAr: "Off-Grid (للمواقع النائية فقط)", bodyEn: "No grid connection. Requires oversized PV array + large battery bank + diesel generator backup. 60–90% more expensive than on-grid. Only justified for remote farms, desert lodges, telecom sites and Bedouin communities beyond 5 km of any distribution line.", bodyAr: "بدون اتصال بالشبكة. يتطلّب مصفوفة ألواح أكبر + بنك بطاريات ضخم + مولّد ديزل احتياطي. أغلى بنسبة 60-90% من on-grid. مبرّر فقط للمزارع النائية ونزل الصحراء ومحطات الاتصالات والمجتمعات البدوية على بعد +5 كم من أي خط توزيع." },
      { headingEn: "Decision matrix", headingAr: "مصفوفة القرار", bodyEn: "If outages < 2/month and you have a smart meter → On-Grid. If outages 2–10/month or you have critical equipment → Hybrid. If no grid within 5 km → Off-Grid. SolarMatch automatically applies this logic based on your governorate and consumption pattern.", bodyAr: "إذا الانقطاعات < 2/شهر ولديك عداد ذكي → On-Grid. إذا 2-10/شهر أو لديك معدّات حساسة → Hybrid. إذا لا توجد شبكة خلال 5 كم → Off-Grid. سولار ماتش يطبّق هذه المنطق تلقائياً بناءً على محافظتك ونمط استهلاكك." },
    ],
    faqs: [
      { qEn: "Can I add batteries later to an on-grid system?", aEn: "Yes if you specify a hybrid-ready inverter from day one. Otherwise inverter replacement adds EGP 12,000–20,000.", qAr: "هل أستطيع إضافة بطاريات لاحقاً لنظام on-grid؟", aAr: "نعم إذا اخترت إنفرتر hybrid-ready من البداية. وإلا فاستبدال الإنفرتر يضيف 12,000-20,000 جنيه." },
      { qEn: "What's the lifespan of lithium batteries?", aEn: "Tier-1 LFP batteries last 6,000–10,000 cycles (15–20 years at one cycle/day) with 80% retained capacity.", qAr: "ما عمر بطاريات الليثيوم؟", aAr: "بطاريات LFP من الفئة الأولى تدوم 6,000-10,000 دورة (15-20 سنة بمعدّل دورة/يوم) مع احتفاظ 80% من السعة." },
    ],
    publishedAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-04-20T00:00:00Z",
    readingMinutes: 8,
  },
  {
    slug: "net-metering-egypt-complete-guide",
    arSlug: "net-metering-في-مصر-الدليل-الكامل",
    cluster: "regulation",
    titleEn: "Net Metering in Egypt: Complete 2026 Guide",
    titleAr: "صافي القياس (Net Metering) في مصر: الدليل الكامل 2026",
    descriptionEn: "How Egyptian net metering works in 2026: eligibility, the 24-month rolling credit, paperwork with EgyptERA, and how to avoid common pitfalls.",
    descriptionAr: "كيف يعمل صافي القياس في مصر 2026: الأهلية، رصيد الـ24 شهر، الأوراق مع جهاز تنظيم الكهرباء، وتجنّب الأخطاء الشائعة.",
    keywords: "net metering Egypt, EgyptERA solar, bidirectional meter Egypt, solar credit Egypt, صافي القياس مصر, تصدير الكهرباء للشبكة",
    introEn: "Net metering is the silent multiplier behind every successful Egyptian rooftop project. Done correctly, it turns your roof into a 24-month battery — without buying any batteries. Done wrong, you lose 30% of your potential savings. Here's the 2026 procedure end-to-end.",
    introAr: "صافي القياس هو المضاعِف الخفي خلف كل مشروع شمسي ناجح فوق الأسطح المصرية. لو طُبّق بشكل صحيح يحوّل سطحك إلى بطارية مدتها 24 شهراً — بدون شراء أي بطاريات. لو طُبّق خطأً تخسر 30% من توفيرك المحتمل. هذا هو إجراء 2026 من البداية للنهاية.",
    sections: [
      { headingEn: "How net metering actually works", headingAr: "كيف يعمل صافي القياس فعلياً", bodyEn: "Your bidirectional meter records imports (grid → home) and exports (home → grid) separately. At month-end, the distribution company nets them: you only pay for net imports. Surplus credits roll over for up to 24 months — perfect for seasonal mismatches between summer production peaks and winter consumption.", bodyAr: "العداد الثنائي يسجّل الاستيراد (الشبكة → البيت) والتصدير (البيت → الشبكة) منفصلَين. آخر الشهر تُجري شركة التوزيع المقاصّة: تدفع فقط على صافي الاستيراد. الفائض يُرحَّل حتى 24 شهر — مثالي للموازنة بين قمم الإنتاج الصيفية والاستهلاك الشتوي." },
      { headingEn: "Step-by-step paperwork", headingAr: "الأوراق خطوة بخطوة", bodyEn: "1) Sign a Net Metering Agreement with your local distribution company. 2) Submit single-line diagram + AC/DC schematic stamped by a licensed PV engineer. 3) Pay the meter replacement fee (~EGP 3,500–5,500). 4) Pass the commissioning test by the distribution engineer. 5) Receive activation within 14 working days.", bodyAr: "1) وقّع اتفاقية صافي القياس مع شركة التوزيع المحلية. 2) قدّم مخطط الخط الأحادي والمخطط AC/DC مختوم من مهندس طاقة شمسية مرخّص. 3) ادفع رسوم استبدال العداد (~3,500-5,500 جنيه). 4) اجتز اختبار التشغيل من مهندس التوزيع. 5) استلم التفعيل خلال 14 يوم عمل." },
      { headingEn: "Common mistakes that kill credits", headingAr: "أخطاء شائعة تقضي على رصيدك", bodyEn: "Oversizing beyond 100% of annual consumption (Egypt does not pay cash for excess), wiring three-phase systems on single-phase meters, and forgetting to register the contract before commissioning. Each can void months of credits.", bodyAr: "تكبير النظام فوق 100% من استهلاكك السنوي (مصر لا تدفع نقداً مقابل الفائض)، توصيل أنظمة ثلاثية الأطوار على عدّاد أحادي، ونسيان تسجيل العقد قبل التشغيل. كل خطأ منها يلغي شهور من الرصيد." },
    ],
    faqs: [
      { qEn: "Can I sell surplus electricity to the grid?", aEn: "Net metering credits energy, not money. To sell power you need a Feed-in Tariff (FiT) PPA — currently only available for utility-scale projects.", qAr: "هل أبيع الكهرباء الفائضة للشبكة؟", aAr: "صافي القياس يحسب طاقة لا نقوداً. للبيع تحتاج عقد FiT — متاح حالياً فقط لمشاريع المرافق الكبرى." },
      { qEn: "Does net metering work with three-phase service?", aEn: "Yes. Three-phase services need three-phase bidirectional meters and balanced inverter outputs.", qAr: "هل يعمل صافي القياس مع الخدمة ثلاثية الأطوار؟", aAr: "نعم. الخدمات ثلاثية الأطوار تحتاج عدّاد ثنائي ثلاثي الأطوار ومخارج إنفرتر متوازنة." },
    ],
    publishedAt: "2026-03-05T00:00:00Z",
    updatedAt: "2026-05-04T00:00:00Z",
    readingMinutes: 6,
  },
  {
    slug: "solar-panel-types-egypt-tier1",
    arSlug: "أنواع-الألواح-الشمسية-في-مصر-Tier1",
    cluster: "technology",
    titleEn: "Solar Panel Types in Egypt: Tier-1 Brands, Bifacial & TOPCon",
    titleAr: "أنواع الألواح الشمسية في مصر: ماركات Tier-1 وBifacial وTOPCon",
    descriptionEn: "Compare Mono PERC, TOPCon, HJT and Bifacial panels for Egyptian rooftops. Real efficiency, degradation rates and price per watt.",
    descriptionAr: "مقارنة بين ألواح Mono PERC وTOPCon وHJT وBifacial للأسطح المصرية. الكفاءة الحقيقية ومعدّلات التدهور وسعر الواط.",
    keywords: "solar panel brands Egypt, Tier-1 panels, TOPCon Egypt, bifacial panels Egypt, ألواح شمسية مصر, جينكو لونجي",
    introEn: "Not all solar panels survive Egyptian summers. Tier-1 manufacturer + cell technology + temperature coefficient — these three numbers decide whether your investment lasts 25 years or starts degrading visibly after 7. Here's what actually performs in Egypt.",
    introAr: "ليست كل الألواح الشمسية قادرة على تحمّل صيف مصر. شركة من فئة Tier-1 + تقنية الخلية + معامل الحرارة — هذه الأرقام الثلاثة تحدّد هل استثمارك يدوم 25 سنة أم يبدأ في التدهور المرئي بعد 7. هذه الألواح التي تعمل فعلاً في مصر.",
    sections: [
      { headingEn: "Tier-1 brands available in Egypt", headingAr: "ماركات Tier-1 المتوفرة في مصر", bodyEn: "Jinko Solar, Longi, Trina Solar, JA Solar and Canadian Solar dominate the Egyptian market. Avoid 'no-name' panels: their bankruptcy risk voids your 25-year linear warranty within 5–7 years. Always verify the Bloomberg Tier-1 listing before purchase.", bodyAr: "جينكو سولار ولونجي وترينا وJA Solar وCanadian Solar تهيمن على السوق المصرية. تجنّب الألواح المجهولة المصدر: مخاطر إفلاسها تلغي ضمان 25 سنة الخطّي خلال 5-7 سنوات. تحقّق دائماً من قائمة Bloomberg Tier-1 قبل الشراء." },
      { headingEn: "Mono PERC vs TOPCon vs HJT", headingAr: "Mono PERC مقابل TOPCon مقابل HJT", bodyEn: "Mono PERC: 20–21% efficiency, mature, cheapest, slight LeTID degradation in heat. TOPCon: 22–23% efficiency, lower temperature coefficient (-0.30%/°C), 30-year warranty common, ~6% pricier. HJT: 23–25% efficiency, best heat performance, premium-only — currently 15–20% pricier.", bodyAr: "Mono PERC: كفاءة 20-21%، تقنية ناضجة، الأرخص، تدهور LeTID خفيف في الحرارة. TOPCon: كفاءة 22-23%، معامل حرارة أقل (-0.30%/°م)، ضمان 30 سنة شائع، أغلى بـ~6%. HJT: كفاءة 23-25%، أفضل أداء حراري، فاخر فقط — حالياً أغلى بـ15-20%." },
      { headingEn: "Bifacial: worth it on Egyptian rooftops?", headingAr: "Bifacial: هل تستحق على الأسطح المصرية؟", bodyEn: "Bifacial panels capture reflected light from the rear surface — yielding 5–12% extra in Egypt over white roofs or sandy ground. On dark concrete or ground-mount with grass, the gain shrinks to 2–4%. Worth it for white-painted rooftops, agricultural ground-mounts, and carports.", bodyAr: "ألواح Bifacial تلتقط الضوء المنعكس من الوجه الخلفي — مكسب 5-12% إضافي في مصر فوق الأسطح البيضاء أو الأرضيات الرملية. على الخرسانة الداكنة أو التربة العشبية ينخفض المكسب إلى 2-4%. تستحق للأسطح المدهونة بالأبيض ومزارع التركيب الأرضي ومظلات السيارات." },
    ],
    faqs: [
      { qEn: "What's the temperature coefficient I should look for?", aEn: "Aim for ≤ -0.34%/°C. Egypt's panel back-of-module temperatures hit 60–70°C in July; every 0.05% improvement saves 1.5% annual yield.", qAr: "ما معامل الحرارة المثالي؟", aAr: "استهدف ≤ -0.34%/°م. حرارة ظهر اللوح في مصر تصل 60-70°م في يوليو؛ كل تحسّن 0.05% يوفّر 1.5% من الإنتاج السنوي." },
      { qEn: "Are Egyptian-made panels reliable?", aEn: "Egyptian assemblers using imported Tier-1 cells are competitive and reduce import duties. Pure-Egyptian cells are not yet at Tier-1 standard for export warranties.", qAr: "هل الألواح المُصنّعة محلياً موثوقة؟", aAr: "المُجمّعون المصريون باستخدام خلايا Tier-1 مستوردة منافسون ويخفّضون الجمارك. الخلايا المصرية الكاملة لم تصل بعد لمعايير Tier-1 لضمانات التصدير." },
    ],
    publishedAt: "2026-03-22T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 7,
  },
  {
    slug: "solar-financing-options-egypt",
    arSlug: "خيارات-تمويل-الطاقة-الشمسية-في-مصر",
    cluster: "finance",
    titleEn: "Solar Financing in Egypt: Banks, Installments & PPAs",
    titleAr: "تمويل الطاقة الشمسية في مصر: البنوك والتقسيط وعقود PPA",
    descriptionEn: "Every way to finance a solar system in Egypt 2026: NBE green loans, CIB installments, vendor BNPL, and commercial PPAs.",
    descriptionAr: "كل طرق تمويل النظام الشمسي في مصر 2026: قروض البنك الأهلي الخضراء وتقسيط CIB ودفع البائع وعقود PPA التجارية.",
    keywords: "solar financing Egypt, solar installments Egypt, green loan Egypt, NBE solar loan, تمويل ألواح شمسية, تقسيط الطاقة الشمسية",
    introEn: "Cash purchase is no longer the only — or even the smartest — way to buy solar in Egypt. With prime rates declining and green loans expanding, 0% to 12% installment plans now make solar cash-flow positive from month one.",
    introAr: "الشراء النقدي لم يعد الطريقة الوحيدة — ولا الأذكى — لشراء الطاقة الشمسية في مصر. مع انخفاض سعر الفائدة وتوسّع القروض الخضراء، خطط التقسيط من 0% إلى 12% أصبحت تجعل النظام الشمسي إيجابي التدفّق النقدي من الشهر الأول.",
    sections: [
      { headingEn: "Bank green loans (NBE, CIB, Banque Misr)", headingAr: "قروض البنوك الخضراء (الأهلي، CIB، مصر)", bodyEn: "NBE's Solar Green Loan covers up to EGP 750,000 over 5 years at ~14–17% APR. CIB matches with personal-loan-style 5–7 year terms. Banque Misr offers SME tracks up to EGP 5M at lower rates with EgyptERA-licensed installer requirement.", bodyAr: "قرض البنك الأهلي الأخضر يغطي حتى 750,000 جنيه على 5 سنوات بفائدة ~14-17%. CIB يقدّم قرض شخصي على 5-7 سنوات. بنك مصر يقدّم مسارات SMEs حتى 5 مليون جنيه بفائدة أقل مع شرط مركّب مرخّص من جهاز تنظيم الكهرباء." },
      { headingEn: "Vendor installments (0–12% APR)", headingAr: "تقسيط البائع (فائدة 0-12%)", bodyEn: "Top installers partner with ValU, Aman and Forsa to offer 12–36 month plans. Plans up to 12 months are typically 0% APR (the installer pays the fee). 24–36 month plans add 8–12% APR but eliminate down payment requirements.", bodyAr: "كبار المركّبين يتعاونون مع ValU وأمان وفرصة لتقديم خطط 12-36 شهر. خطط حتى 12 شهر عادة بفائدة 0% (المركّب يدفع الرسوم). خطط 24-36 شهر تضيف فائدة 8-12% لكنها تلغي الدفعة المقدّمة." },
      { headingEn: "Commercial PPAs (zero CAPEX)", headingAr: "عقود PPA التجارية (بدون رأس مال)", bodyEn: "For factories, malls, hotels and large farms (>250 kWp), Power Purchase Agreements let you pay for kWh consumed at a discount to grid rates with zero upfront cost. The developer owns the system for 7–15 years then transfers ownership. Common structures: 12% below grid + transfer at year 10.", bodyAr: "للمصانع والمولات والفنادق والمزارع الكبرى (+250 كيلوواط)، عقود PPA تتيح لك الدفع عن ك.و.س مستهلك بخصم عن سعر الشبكة وبدون أي تكلفة مقدّمة. المطوّر يملك النظام 7-15 سنة ثم ينقل الملكية. التراكيب الشائعة: 12% أقل من الشبكة + نقل ملكية في السنة 10." },
    ],
    faqs: [
      { qEn: "Do I need property mortgage to qualify?", aEn: "No. Most solar loans use the equipment itself as soft collateral plus standard income proof.", qAr: "هل أحتاج رهن العقار للحصول على القرض؟", aAr: "لا. معظم القروض الشمسية تستخدم المعدّات نفسها كضمان مرن مع إثبات دخل عادي." },
      { qEn: "What credit score do I need?", aEn: "I-Score above 600 generally qualifies for solar BNPL plans; for bank green loans 650+ is typical.", qAr: "ما درجة I-Score المطلوبة؟", aAr: "I-Score فوق 600 يؤهّلك عادة لخطط التقسيط؛ القروض الخضراء البنكية تتطلب 650+ عادة." },
    ],
    publishedAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-05-06T00:00:00Z",
    readingMinutes: 6,
  },
  {
    slug: "solar-for-farms-egypt-feddans",
    arSlug: "الطاقة-الشمسية-للمزارع-في-مصر-فدان",
    cluster: "market",
    titleEn: "Solar for Farms in Egypt: Per-Feddan Cost & Irrigation Pumps",
    titleAr: "الطاقة الشمسية للمزارع في مصر: تكلفة الفدان وطلمبات الري",
    descriptionEn: "How Egyptian farmers cut diesel pumping costs 90% with solar. Per-feddan economics, pump sizing and grant programmes.",
    descriptionAr: "كيف يخفّض المزارعون المصريون تكلفة ضخ المياه 90% بالطاقة الشمسية. اقتصاديات الفدان وحجم الطلمبات وبرامج الدعم.",
    keywords: "solar pumps Egypt, agriculture solar Egypt, feddan solar, طاقة شمسية للمزارع, طلمبات شمسية مصر, ري بالطاقة الشمسية",
    introEn: "Egyptian agriculture spends 18–22% of operating costs on diesel pumping. A 25 hp solar pump now costs EGP 280,000–350,000, replaces 4,200 liters of diesel per year, and pays back in 2.8–3.5 years — making solar irrigation the highest-ROI agricultural investment available today.",
    introAr: "الزراعة المصرية تنفق 18-22% من تكاليف التشغيل على ضخ الديزل. طلمبة شمسية 25 حصان تكلّف الآن 280,000-350,000 جنيه، تستبدل 4,200 لتر ديزل سنوياً، وتسترد رأسمالها خلال 2.8-3.5 سنة — مما يجعل الري الشمسي أعلى استثمار زراعي عائداً متاحاً اليوم.",
    sections: [
      { headingEn: "Per-feddan economics", headingAr: "اقتصاديات الفدان", bodyEn: "Field crops in the Delta need 0.8–1.2 kWh/feddan/day in winter, 2.5–3.5 kWh in summer. A 5-feddan vegetable farm typically needs a 5–8 kWp pump system. Per-feddan installed cost: EGP 28,000–38,000 — vs EGP 14,000/year diesel savings.", bodyAr: "المحاصيل الحقلية في الدلتا تحتاج 0.8-1.2 ك.و.س/فدان/يوم شتاءً و2.5-3.5 ك.و.س صيفاً. مزرعة خضار 5 فدان تحتاج عادة نظام طلمبة 5-8 كيلوواط. تكلفة التركيب لكل فدان: 28,000-38,000 جنيه — مقابل توفير ديزل 14,000 جنيه/سنة." },
      { headingEn: "Pump sizing for Egyptian wells", headingAr: "حجم الطلمبة للآبار المصرية", bodyEn: "Shallow wells (8–25 m): use surface centrifugal pumps with 3–7.5 kWp arrays. Deep wells (40–120 m): use submersible pumps with 7.5–22 kWp arrays plus VFD inverters. Always oversize the array by 20% to compensate for low winter sun in southern Egypt.", bodyAr: "الآبار الضحلة (8-25 م): طلمبات سطحية طاردة مركزية مع مصفوفات 3-7.5 كيلوواط. الآبار العميقة (40-120 م): طلمبات غاطسة مع مصفوفات 7.5-22 كيلوواط وإنفرتر VFD. كبّر المصفوفة 20% لتعويض ضعف الشمس الشتوية في الصعيد." },
      { headingEn: "Government & donor programmes", headingAr: "برامج الحكومة والمانحين", bodyEn: "The Ministry of Agriculture's Solar Pump Initiative subsidizes up to 30% on pumps below 30 hp. UNDP and KfW co-fund up to 40% for farms in Upper Egypt. Always confirm subsidy availability with the local agricultural directorate before signing contracts.", bodyAr: "مبادرة وزارة الزراعة للطلمبات الشمسية تدعم حتى 30% على الطلمبات أقل من 30 حصان. UNDP وKfW يموّلان حتى 40% لمزارع الصعيد. تحقّق من توفّر الدعم في مديرية الزراعة المحلية قبل توقيع العقود." },
    ],
    faqs: [
      { qEn: "Do solar pumps work at night?", aEn: "Direct-coupled solar pumps don't. Solutions: oversized day storage tanks, or hybrid systems with battery for critical night-time flow.", qAr: "هل تعمل الطلمبات الشمسية ليلاً؟", aAr: "الطلمبات المتّصلة مباشرة لا تعمل. الحلول: خزانات تخزين نهاري كبيرة، أو أنظمة هجينة بالبطاريات لحالات التدفّق الليلي الحرجة." },
      { qEn: "What's the best month to install on farms?", aEn: "Late August to early October — after irrigation peak, before winter wheat. Installation downtime is minimal.", qAr: "ما الشهر الأفضل للتركيب في المزارع؟", aAr: "أواخر أغسطس لأوائل أكتوبر — بعد ذروة الري وقبل قمح الشتاء. وقت توقّف الري قليل." },
    ],
    publishedAt: "2026-04-15T00:00:00Z",
    updatedAt: "2026-05-07T00:00:00Z",
    readingMinutes: 6,
  },
  {
    slug: "egypt-solar-tariff-2026-explained",
    arSlug: "تعرفة-الكهرباء-في-مصر-2026-والطاقة-الشمسية",
    cluster: "regulation",
    titleEn: "Egypt's 2026 Electricity Tariff Explained: How It Changes the Solar Math",
    titleAr: "تعرفة الكهرباء في مصر 2026 وكيف تغيّر معادلة الطاقة الشمسية",
    descriptionEn: "Full breakdown of the 2026 Egyptian 7-tier residential, 6-tier commercial and 5-tier industrial tariffs — and exactly how each tier shifts your solar payback.",
    descriptionAr: "تفصيل كامل لتعرفة 2026 المنزلية (7 شرائح) والتجارية (6 شرائح) والصناعية (5 شرائح) — وكيف بتغيّر كل شريحة فترة استرداد الاستثمار الشمسي.",
    keywords: "Egypt electricity tariff 2026, residential tariff Egypt, commercial tariff Egypt, industrial tariff Egypt, solar payback Egypt, تعرفة الكهرباء 2026, شرائح الكهرباء مصر",
    introEn: "The August 2025 tariff revision restructured Egyptian electricity pricing into 7 residential tiers (up to EGP 2.95/kWh), 6 commercial tiers and 5 industrial tiers. For most homes consuming above 650 kWh/month and most businesses paying commercial peak rates, this single change cut solar payback by 12–18 months. Here is exactly how the new brackets work — and how SolarMatch uses them in every feasibility calculation.",
    introAr: "إعادة هيكلة أغسطس 2025 قسّمت تعرفة الكهرباء المصرية إلى 7 شرائح منزلية (حتى 2.95 جنيه/ك.و.س) و6 تجارية و5 صناعية. لمعظم البيوت اللي بتستهلك فوق 650 ك.و.س شهرياً ومعظم المحلات اللي بتدفع أسعار الذروة التجارية، التغيير ده لوحده قلّل فترة استرداد الطاقة الشمسية 12-18 شهر. هنا تفصيل دقيق إزاي الشرائح الجديدة شغّالة — وإزاي سولار ماتش بيستخدمها في كل حسبة جدوى.",
    sections: [
      { headingEn: "Residential 7-tier breakdown", headingAr: "تفصيل الشرائح المنزلية السبع", bodyEn: "Tier 1 (0-50 kWh): EGP 0.68. Tier 2 (51-100): EGP 0.78. Tier 3 (101-200): EGP 0.95. Tier 4 (201-350): EGP 1.55. Tier 5 (351-650): EGP 1.95. Tier 6 (651-1000): EGP 2.45. Tier 7 (>1000): EGP 2.95. Tariffs are cumulative — your bill stacks up through the brackets.", bodyAr: "الشريحة 1 (0-50 ك.و.س): 0.68 جنيه. الشريحة 2 (51-100): 0.78 جنيه. الشريحة 3 (101-200): 0.95 جنيه. الشريحة 4 (201-350): 1.55 جنيه. الشريحة 5 (351-650): 1.95 جنيه. الشريحة 6 (651-1000): 2.45 جنيه. الشريحة 7 (فوق 1000): 2.95 جنيه. الحساب تراكمي — فاتورتك بتتجمّع على الشرائح من الأقل للأعلى." },
      { headingEn: "Why the top tier is the solar gold mine", headingAr: "ليه الشريحة العليا هي كنز الطاقة الشمسية", bodyEn: "Solar offsets your most expensive kWh first. A villa using 1500 kWh/month pays EGP 2.95 for the last 500 kWh — those are the kWh solar removes. Removing the top tier alone saves EGP 1,475/month before touching cheaper brackets.", bodyAr: "الطاقة الشمسية بتشيل أغلى ك.و.س الأول. فيلا بتستخدم 1500 ك.و.س شهرياً بتدفع 2.95 جنيه على آخر 500 ك.و.س — دي اللي الطاقة الشمسية بتشيلها. إزالة الشريحة العليا لوحدها بتوفّر 1,475 جنيه/شهر قبل ما تلمس الشرائح الأرخص." },
      { headingEn: "Commercial 6-tier — peak hours matter", headingAr: "التجاري 6 شرائح — ساعات الذروة مهمة", bodyEn: "Commercial tariffs add a peak/off-peak split (5 PM–11 PM peak rate is 30-45% higher). Solar production peaks 10 AM–3 PM, perfectly matching daytime commercial loads — but covers little of the evening peak unless paired with batteries.", bodyAr: "التعرفة التجارية فيها فرق بين الذروة وخارجها (5 م-11 م سعر الذروة أعلى بـ30-45%). إنتاج الطاقة الشمسية بيوصل لقمته 10 ص-3 م — مطابق تماماً للأحمال التجارية النهارية — لكنه بيغطّي شوية من ذروة المساء إلا لو اتركّب معاه بطاريات." },
      { headingEn: "Industrial 5-tier & demand charges", headingAr: "الصناعي 5 شرائح ورسوم الطلب", bodyEn: "Industrial customers pay both energy (EGP/kWh) and demand (EGP/kW) charges. Solar reduces energy charges directly but only reduces demand charges if paired with smart load management or storage. ROI for industrial solar in 2026 ranges 2.5–3.8 years.", bodyAr: "العملاء الصناعيون بيدفعوا رسوم طاقة (جنيه/ك.و.س) ورسوم طلب قدرة (جنيه/ك.و). الطاقة الشمسية بتقلّل رسوم الطاقة مباشرة لكن مش بتقلّل رسوم الطلب إلا لو معاها إدارة أحمال ذكية أو تخزين. عائد الطاقة الشمسية الصناعية في 2026 يتراوح 2.5-3.8 سنة." },
      { headingEn: "Annual escalation — the silent ROI booster", headingAr: "الزيادة السنوية — معزّز العائد الصامت", bodyEn: "Egyptian tariffs have risen ~14%/year on average since 2014. SolarMatch's 25-year projections assume conservative 8%/year escalation — meaning your savings grow every year. By year 10 your monthly savings are typically double the year-1 amount.", bodyAr: "تعرفة الكهرباء في مصر ارتفعت بمتوسّط 14%/سنة من 2014. سولار ماتش في توقّعاته للـ25 سنة بيفترض زيادة محافظة 8%/سنة — يعني توفيرك بيكبر كل سنة. في السنة 10 توفيرك الشهري عادة بيبقى ضعف توفير السنة الأولى." },
    ],
    faqs: [
      { qEn: "Will the tariff go up again in 2027?", aEn: "Government policy commits to gradual subsidy removal through 2030. Expect 8-12% annual increases until full cost-recovery pricing.", qAr: "هل التعرفة هتزيد تاني في 2027؟", aAr: "السياسة الحكومية ملتزمة بإزالة الدعم تدريجياً حتى 2030. توقّع زيادات سنوية 8-12% حتى الوصول للسعر الكامل بدون دعم." },
      { qEn: "Do solar exports get paid at the same tariff?", aEn: "No. Net-metering credits surplus exports at the average residential rate (~EGP 1.45/kWh in 2026), not the top-tier rate. So self-consumption is always more valuable than export.", qAr: "هل بتاخد نفس سعر التعرفة على الفائض المُصدَّر؟", aAr: "لا. الـnet-metering بيحسب الفائض بمتوسط السعر المنزلي (≈1.45 جنيه/ك.و.س في 2026)، مش بسعر الشريحة العليا. علشان كده الاستهلاك الذاتي دائماً أعلى قيمة من التصدير." },
      { qEn: "How do I know which tier I'm in?", aEn: "Read your last 3 bills' total consumption (kWh). Highest single-month usage determines your peak tier. SolarMatch detects this automatically when you enter your monthly bill.", qAr: "إزاي أعرف أنا في أنهي شريحة؟", aAr: "اقرأ إجمالي استهلاك آخر 3 فواتير (ك.و.س). أعلى استخدام شهري بيحدّد شريحتك العليا. سولار ماتش بيكتشف ده تلقائياً لما تدخل فاتورتك الشهرية." },
      { qEn: "Are commercial-style apartments charged commercial rates?", aEn: "Only if registered as commercial with the distribution company. Mixed-use apartments default to residential tiers — but renting one for an office can trigger reclassification.", qAr: "هل الشقق المستخدمة كمكاتب بتتحاسب تجاري؟", aAr: "بس لو مسجّلة تجاري في شركة التوزيع. الشقق متعدّدة الاستخدام بتفضل تتحاسب منزلي — لكن تأجير شقة كمكتب ممكن يخلّيها تتحوّل تجاري." },
    ],
    publishedAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 8,
  },
  {
    slug: "solar-batteries-egypt-buyer-guide",
    arSlug: "دليل-شراء-بطاريات-الطاقة-الشمسية-في-مصر",
    cluster: "technology",
    titleEn: "Solar Batteries in Egypt: 2026 Buyer's Guide (Lithium vs Gel vs Lead-Acid)",
    titleAr: "بطاريات الطاقة الشمسية في مصر: دليل المشتري 2026 (ليثيوم مقابل جل مقابل رصاص)",
    descriptionEn: "Full battery comparison for Egyptian solar systems — lithium LiFePO4, gel, AGM and lead-acid. Real prices, lifespans, and which fits your home or business.",
    descriptionAr: "مقارنة شاملة لبطاريات الطاقة الشمسية في مصر — ليثيوم LiFePO4، جل، AGM، ورصاص. أسعار حقيقية وأعمار افتراضية وأي نوع يناسب بيتك أو شركتك.",
    keywords: "solar batteries Egypt, lithium battery Egypt, LiFePO4 Egypt, gel battery solar, بطاريات شمسية مصر, بطارية ليثيوم, بطارية جل",
    introEn: "Batteries are the single most expensive — and most misunderstood — component of an Egyptian hybrid solar system. The wrong chemistry can double your 10-year cost and cut your effective storage in half. This 2026 buyer's guide cuts through marketing claims with real Egyptian market prices and field-tested lifespans.",
    introAr: "البطاريات هي أغلى مكوّن في النظام الشمسي الهجين في مصر — وأكترها سوء فهم. الاختيار الغلط ممكن يضاعف تكلفتك على 10 سنين ويقلّل سعتك التخزينية الفعلية للنص. الدليل ده لـ2026 بيكسر الوعود التسويقية بأسعار سوق مصرية حقيقية وأعمار من خبرة الميدان.",
    sections: [
      { headingEn: "Lithium LiFePO4 — the new standard", headingAr: "ليثيوم LiFePO4 — المعيار الجديد", bodyEn: "Cycle life: 4,000-6,000 cycles at 80% DoD. Useful capacity: 90-95% of nameplate. 2026 price: EGP 18,000-25,000 per usable kWh installed (Pylontech, BYD, Felicity). Best for: hybrid homes, daily cycling, anywhere temperature can be controlled.", bodyAr: "عمر الدورات: 4,000-6,000 دورة عند 80% عمق تفريغ. السعة المفيدة: 90-95% من السعة الاسمية. سعر 2026: 18,000-25,000 جنيه لكل ك.و.س مفيد مركّب (Pylontech، BYD، Felicity). الأنسب لـ: البيوت الهجينة، التشغيل اليومي، أي مكان درجة حرارته متحكَّم فيها." },
      { headingEn: "Gel & AGM — the budget compromise", headingAr: "جل وAGM — الحل الاقتصادي", bodyEn: "Cycle life: 800-1,500 cycles at 50% DoD. Useful capacity: only 50% of nameplate. 2026 price: EGP 8,000-12,000 per usable kWh. Best for: backup-only systems used a few times per month, or remote sites where lithium logistics are difficult.", bodyAr: "عمر الدورات: 800-1,500 دورة عند 50% عمق تفريغ. السعة المفيدة: 50% بس من السعة الاسمية. سعر 2026: 8,000-12,000 جنيه لكل ك.و.س مفيد. الأنسب لـ: أنظمة احتياطي بتُستخدم مرات قليلة في الشهر، أو مواقع نائية فيها لوجستيات الليثيوم صعبة." },
      { headingEn: "Lead-acid (tubular) — only one valid use case", headingAr: "الرصاص (الأنبوبي) — له استخدام واحد فقط", bodyEn: "Tubular lead-acid still makes sense ONLY for off-grid pumps with monthly cycling at most. Cycle life: 500-1,000 cycles. Cheap upfront (EGP 5,000/usable kWh) but 10-year cost is 3x lithium because of replacements.", bodyAr: "الرصاص الأنبوبي بقى منطقي فقط للطلمبات خارج الشبكة بتشغيل شهري كحد أقصى. عمر الدورات: 500-1,000 دورة. رخيص مقدّماً (5,000 جنيه/ك.و.س مفيد) لكن تكلفة 10 سنين بتطلع 3 أضعاف الليثيوم بسبب الاستبدال." },
      { headingEn: "Sizing your battery (the right way)", headingAr: "تحديد حجم البطارية (الطريقة الصحيحة)", bodyEn: "Don't size for total daily load — size for evening + critical-night loads only. Typical Egyptian villa: 5-8 kWh usable storage covers fans, lighting, fridge and TV from 6 PM to 6 AM. Bigger banks waste money unless you want full off-grid autonomy.", bodyAr: "متحدّدش الحجم على الحمل اليومي الكامل — حدّده على أحمال المساء + الأحمال الحرجة بالليل بس. فيلا مصرية نموذجية: 5-8 ك.و.س سعة مفيدة بتغطّي المراوح والإضاءة والثلاجة والتلفزيون من 6 م لـ6 ص. البنوك الأكبر بتضيّع فلوس إلا لو عايز استقلال كامل عن الشبكة." },
      { headingEn: "Egyptian heat — the hidden killer", headingAr: "حرارة مصر — القاتل الصامت", bodyEn: "Every 8°C above 25°C halves lithium battery life. Install batteries indoors (not on the rooftop), in a ventilated room ideally below 30°C. Adding a small AC to the battery room often pays for itself in extended battery life within 3 years.", bodyAr: "كل 8 درجات مئوية فوق 25°م بتنزّل عمر بطارية الليثيوم للنص. ركّب البطاريات داخل البيت (مش على السطح)، في غرفة مهوّاة درجة حرارتها أقل من 30°م. إضافة تكييف صغير لغرفة البطاريات بتدفع تكلفتها في العمر الإضافي للبطارية خلال 3 سنين." },
    ],
    faqs: [
      { qEn: "Are Chinese lithium batteries safe?", aEn: "Tier-1 brands (BYD, Pylontech, CATL-based packs) with proper BMS and CE/IEC certification are safe and reliable. Avoid no-brand cells without BMS — these are the source of the rare fire incidents.", qAr: "هل بطاريات الليثيوم الصينية آمنة؟", aAr: "ماركات Tier-1 (BYD، Pylontech، بطاريات مبنية على CATL) ومعاها BMS صحّ وشهادات CE/IEC آمنة وموثوقة. ابعد عن البطاريات بدون ماركة وبدون BMS — هي مصدر حوادث الحريق النادرة." },
      { qEn: "Should I get a battery from day one or upgrade later?", aEn: "If your inverter is hybrid-ready, you can start grid-tied and add batteries when prices drop further (lithium prices fell 18% in 2025). If it's a pure on-grid inverter, retrofitting batteries later costs significantly more.", qAr: "هل أركّب بطارية من أول يوم ولا أأجّلها؟", aAr: "لو الإنفرتر هجين-جاهز، ابدأ on-grid وضيف بطاريات لما الأسعار تنزل أكتر (أسعار الليثيوم نزلت 18% في 2025). لو إنفرتر on-grid فقط، إضافة بطاريات لاحقاً بتكلّف أكتر بكتير." },
      { qEn: "What warranty should I demand?", aEn: "Lithium: minimum 5-year warranty with 70% capacity retention guarantee. Gel: 2 years. Lead-acid tubular: 1 year. Always insist warranty is honored locally, not via the foreign manufacturer.", qAr: "أنهي ضمان أطلبه؟", aAr: "ليثيوم: 5 سنين على الأقل مع ضمان احتفاظ بـ70% من السعة. جل: سنتين. رصاص أنبوبي: سنة. دائماً اطلب الضمان يكون محلّي مش من الشركة الأم بره." },
      { qEn: "Can I mix old and new batteries?", aEn: "Never mix chemistries. Mixing same-chemistry batteries with >6-month age difference is also strongly discouraged — the older bank pulls down the newer one's life.", qAr: "هل أقدر أخلط بطاريات قديمة وجديدة؟", aAr: "متخلطش كيمياءات مختلفة أبداً. حتى نفس الكيمياء بفرق عمر أكتر من 6 شهور غير مفضّل — البنك القديم بيسحب من عمر الجديد." },
    ],
    publishedAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 9,
  },
  {
    slug: "solar-for-commercial-buildings-egypt",
    arSlug: "الطاقة-الشمسية-للمباني-التجارية-في-مصر",
    cluster: "market",
    titleEn: "Solar for Commercial Buildings in Egypt: Offices, Retail, Hotels",
    titleAr: "الطاقة الشمسية للمباني التجارية في مصر: مكاتب ومحلات وفنادق",
    descriptionEn: "How offices, retail spaces, restaurants and hotels in Egypt cut electricity bills 60-85% with rooftop solar. Sizing, ROI and case studies for 2026.",
    descriptionAr: "كيف تخفّض المكاتب والمحلات والمطاعم والفنادق في مصر فاتورة الكهرباء 60-85% بالطاقة الشمسية. حجم النظام والعائد ودراسات حالة لـ2026.",
    keywords: "commercial solar Egypt, office solar Egypt, hotel solar Egypt, retail solar Egypt, الطاقة الشمسية للمحلات, طاقة شمسية للمكاتب, طاقة شمسية للفنادق",
    introEn: "Commercial buildings in Egypt have the strongest solar economics of any sector. Daytime operating hours match solar production perfectly, commercial tariffs are 30-45% higher than residential, and rooftop areas are usually unobstructed. The result: 2.5-3.5 year payback and 22-28% IRR over 25 years.",
    introAr: "المباني التجارية في مصر عندها أقوى اقتصاديات للطاقة الشمسية على مستوى كل القطاعات. ساعات العمل النهارية بتطابق إنتاج الشمس بالظبط، التعرفة التجارية أعلى 30-45% من المنزلية، والأسطح عادة فاضية بدون عوائق. النتيجة: استرداد 2.5-3.5 سنة وعائد سنوي 22-28% على 25 سنة.",
    sections: [
      { headingEn: "Office buildings — match the workday curve", headingAr: "المباني الإدارية — مطابقة منحنى يوم العمل", bodyEn: "Standard offices (9 AM-5 PM, 5 days) consume 80-90% of energy during solar peak hours. Even without batteries, a properly-sized rooftop system covers 65-80% of annual consumption. Typical 1,000 m² office: 60-100 kWp system, EGP 1.4-2.3M capex, 2.8-year payback.", bodyAr: "المكاتب القياسية (9 ص-5 م، 5 أيام) بتستهلك 80-90% من طاقتها في ساعات الذروة الشمسية. حتى من غير بطاريات، نظام سقف مظبوط بيغطّي 65-80% من الاستهلاك السنوي. مكتب 1,000 م² نموذجي: نظام 60-100 كيلوواط، تكلفة 1.4-2.3 مليون جنيه، استرداد 2.8 سنة." },
      { headingEn: "Retail & restaurants — extend with batteries", headingAr: "المحلات والمطاعم — وسّع بالبطاريات", bodyEn: "Retail runs 10 AM-11 PM, restaurants until 2 AM. Rooftop solar covers ~55% of annual load alone. Adding 20-40 kWh of LiFePO4 batteries pushes coverage to 80-90% by feeding evening peak. Payback rises to 3.8-4.5 years but lifetime savings double.", bodyAr: "المحلات بتشتغل 10 ص-11 م والمطاعم لحد 2 ص. السقف الشمسي بيغطّي ≈55% من الحمل السنوي لوحده. إضافة 20-40 ك.و.س بطاريات ليثيوم بتوصّل التغطية لـ80-90% بتغذية ذروة المساء. الاسترداد بيرتفع لـ3.8-4.5 سنة لكن التوفير الكلي بيتضاعف." },
      { headingEn: "Hotels — the solar thermal bonus", headingAr: "الفنادق — مكافأة الطاقة الحرارية", bodyEn: "Hotels combine PV (rooftop electricity) with solar thermal water heating — covering 70-90% of hot water needs. A 4-star 80-room hotel typically installs 150-250 kWp PV + 60-100 m² solar thermal, saving EGP 600,000-1.1M/year.", bodyAr: "الفنادق بتجمع بين الـPV (كهرباء السطح) والسخانات الشمسية للمياه — اللي بتغطّي 70-90% من احتياجات المياه الساخنة. فندق 4 نجوم 80 غرفة عادة بيركّب 150-250 كيلوواط PV + 60-100 م² سخانات شمسية، بيوفّر 600,000-1.1 مليون جنيه/سنة." },
      { headingEn: "Tax & accounting benefits", headingAr: "المزايا الضريبية والمحاسبية", bodyEn: "Solar systems qualify for 5-year accelerated depreciation in Egypt. Capex above EGP 1M can be offset against corporate income tax over 5 years (effective 22.5% rebate). Always confirm latest rules with your tax advisor before procurement.", bodyAr: "أنظمة الطاقة الشمسية مؤهّلة لإهلاك معجّل على 5 سنين في مصر. تكلفة فوق المليون جنيه ممكن تُخصم من ضريبة دخل الشركات على 5 سنين (خصم فعلي 22.5%). أكّد دائماً أحدث القواعد مع مستشارك الضريبي قبل الشراء." },
      { headingEn: "Choosing an EPC contractor", headingAr: "اختيار مقاول التركيب EPC", bodyEn: "Demand: NREA registration, ISO 9001 quality cert, minimum 5 reference projects of similar size, performance guarantee (kWh/year), and 10-year workmanship warranty. SolarMatch's vetted Business plan installer network meets all five criteria.", bodyAr: "اطلب: تسجيل في NREA، شهادة ISO 9001، 5 مشاريع مرجعية بنفس الحجم، ضمان أداء (ك.و.س/سنة)، وضمان تركيب 10 سنين. شبكة مقاولي خطة Business في سولار ماتش معتمدة على المعايير الخمسة." },
    ],
    faqs: [
      { qEn: "Will solar void my building's commercial lease?", aEn: "Generally no, but always check the lease for rooftop usage clauses. Some commercial leases require landlord consent for permanent rooftop modifications.", qAr: "هل الطاقة الشمسية بتلغي عقد الإيجار التجاري؟", aAr: "عموماً لا، لكن راجع العقد لشروط استخدام السطح. بعض العقود التجارية بتشترط موافقة مالك العقار على التعديلات الدائمة على السطح." },
      { qEn: "Can I claim the savings if I rent the building?", aEn: "Yes, if you have multi-year lease security (3+ years remaining) and landlord written consent for installation and removal at lease end.", qAr: "هل أقدر أستفيد من التوفير لو مأجّر المبنى؟", aAr: "نعم، لو عندك عقد طويل المدة (3 سنين فأكتر متبقّية) وموافقة مكتوبة من المالك على التركيب والفك في نهاية العقد." },
      { qEn: "What about hotels in tourist areas (Hurghada, Sharm)?", aEn: "Coastal hotels see 6.0-6.5 kWh/m²/day irradiance — among the world's best. ROI for full-service resorts is typically 2.0-2.8 years. Salt-air panel coatings are required.", qAr: "وفنادق المناطق السياحية (الغردقة وشرم)؟", aAr: "الفنادق الساحلية بتشوف إشعاع 6.0-6.5 ك.و.س/م²/يوم — من الأعلى عالمياً. الاسترداد للمنتجعات الكاملة عادة 2.0-2.8 سنة. الطلاء المقاوم للأملاح ضروري." },
      { qEn: "Does solar disrupt building operations during install?", aEn: "Standard 100 kWp commercial install takes 4-7 working days with zero disruption to operations. Final grid-tie commissioning needs 2-3 hours of planned outage, usually scheduled overnight or weekend.", qAr: "هل التركيب بيعطّل تشغيل المبنى؟", aAr: "تركيب تجاري 100 كيلوواط نموذجي بياخد 4-7 أيام شغل بدون أي تعطيل للعمليات. التشغيل النهائي مع الشبكة محتاج 2-3 ساعات انقطاع مجدول، عادة بليل أو ويك إند." },
    ],
    publishedAt: "2026-03-20T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 8,
  },
  {
    slug: "khamaseen-dust-management-guide",
    arSlug: "إدارة-غبار-الخماسين-للطاقة-الشمسية",
    cluster: "technology",
    titleEn: "Khamaseen Dust & Solar Panels: The Egyptian Cleaning Playbook",
    titleAr: "غبار الخماسين والألواح الشمسية: دليل التنظيف في مصر",
    descriptionEn: "Khamaseen season can cut solar output 25% in days. Cleaning frequency, methods, water consumption, automation options and real cost data for Egyptian sites.",
    descriptionAr: "موسم الخماسين ممكن يقلّل إنتاج الطاقة الشمسية 25% في أيام. تكرار التنظيف والطرق واستهلاك المياه وخيارات الأتمتة وبيانات تكلفة حقيقية للمواقع المصرية.",
    keywords: "Khamaseen solar Egypt, panel cleaning Egypt, dust solar panels, solar maintenance Egypt, تنظيف الألواح الشمسية, الخماسين والطاقة الشمسية, صيانة الألواح",
    introEn: "Egypt's spring Khamaseen winds (March-May) deposit 2-4 grams of dust per m² per day on solar panels — capable of cutting output 18-25% in just one week if uncleaned. Yet most installers in Egypt still don't include a maintenance plan. This guide gives you the exact cleaning schedule, methods and budget for keeping your system above 95% performance year-round.",
    introAr: "رياح الخماسين الربيعية في مصر (مارس-مايو) بترسّب 2-4 جرام غبار/م²/يوم على الألواح — قادرة تقلّل الإنتاج 18-25% في أسبوع واحد بدون تنظيف. ومع ذلك معظم المقاولين في مصر لسه مش بيضيفوا خطة صيانة. الدليل ده بيدّيك جدول التنظيف والطرق والميزانية المظبوطة عشان تحافظ على نظامك فوق 95% أداء طول السنة.",
    sections: [
      { headingEn: "How dust kills solar production", headingAr: "إزاي الغبار بيقتل إنتاج الطاقة الشمسية", bodyEn: "Dust is not just shading — it scatters and absorbs irradiance. A 5 g/m² uniform dust layer cuts output 8%. 15 g/m² cuts 22%. Worse, partial shading on bypass-diode strings can cut full panel output by up to 33% even with light dust because of mismatched cell currents.", bodyAr: "الغبار مش بس تظليل — هو بيشتّت ويمتص الإشعاع. طبقة غبار موحّدة 5 جرام/م² بتقلّل الإنتاج 8%. 15 جرام/م² بتقلّل 22%. الأسوأ: التظليل الجزئي على strings الـbypass-diode ممكن يقلّل إنتاج اللوح كله بـ33% حتى بغبار خفيف بسبب اختلاف تيارات الخلايا." },
      { headingEn: "Recommended cleaning schedule", headingAr: "جدول التنظيف الموصى به", bodyEn: "Cairo, Giza, Delta: monthly Sept-Feb, every 2 weeks Mar-May (Khamaseen), monthly Jun-Aug. Coastal (Alexandria, North Coast): every 6 weeks year-round (salt + dust). Upper Egypt: every 3 weeks year-round. Western Desert sites: weekly during Khamaseen.", bodyAr: "القاهرة والجيزة والدلتا: شهرياً سبتمبر-فبراير، كل أسبوعين مارس-مايو (الخماسين)، شهرياً يونيو-أغسطس. الساحلية (الإسكندرية والساحل الشمالي): كل 6 أسابيع طول السنة (ملح + غبار). الصعيد: كل 3 أسابيع طول السنة. مواقع الصحراء الغربية: أسبوعياً خلال الخماسين." },
      { headingEn: "Right way to clean — without breaking the panels", headingAr: "الطريقة الصحيحة للتنظيف — من غير ما تكسر الألواح", bodyEn: "Use deionized or low-mineral water (TDS<200 ppm), soft microfiber brush, max 30 PSI water pressure. Clean early morning or evening only (cold panels). Never clean hot panels with cold water — thermal shock cracks the glass. Never use detergents — they leave residue that attracts more dust.", bodyAr: "استخدم مياه منزوعة المعادن أو منخفضة الأملاح (TDS أقل من 200 ppm)، فرشاة ميكروفايبر ناعمة، ضغط مياه أقصى 30 PSI. نظّف بدري الصبح أو بالمساء بس (ألواح باردة). متنظّفش ألواح حامية بمياه باردة — الصدمة الحرارية بتكسر الزجاج. متستخدمش منظّفات — بتسيب آثار بتجذب غبار أكتر." },
      { headingEn: "Cost: DIY vs contracted vs automated", headingAr: "التكلفة: ذاتي مقابل بمقاول مقابل أوتوماتيكي", bodyEn: "DIY: ~EGP 50/clean (water + brush). Contracted service: EGP 8-12/panel/clean (5 kWp = ~14 panels = EGP 110-170). Automated robotic cleaning systems: EGP 80,000-150,000 upfront — only justified for arrays above 50 kWp.", bodyAr: "ذاتي: ≈50 جنيه/مرة (مياه + فرشاة). خدمة بمقاول: 8-12 جنيه/لوح/مرة (5 كيلوواط = ≈14 لوح = 110-170 جنيه). أنظمة تنظيف روبوتيك أوتوماتيكية: 80,000-150,000 جنيه مقدّماً — مبرّرة بس للمصفوفات فوق 50 كيلوواط." },
      { headingEn: "Anti-soiling coatings: worth it?", headingAr: "طلاءات مقاومة الاتساخ: تستحق؟", bodyEn: "Hydrophobic nano-coatings (Pilkington, DSM) reduce dust adhesion 40-60% and are reapplied every 18-24 months. Cost: EGP 25-40/m². Net benefit positive for sites in Upper Egypt and Western Desert; marginal for Cairo and Delta.", bodyAr: "الطلاءات النانو الكارهة للماء (Pilkington، DSM) بتقلّل التصاق الغبار 40-60% وبتتجدّد كل 18-24 شهر. التكلفة: 25-40 جنيه/م². الفائدة الصافية إيجابية لمواقع الصعيد والصحراء الغربية؛ هامشية للقاهرة والدلتا." },
    ],
    faqs: [
      { qEn: "Does rain clean panels enough?", aEn: "Egyptian rain is too rare and too dirty (dust-laden first rain) to substitute scheduled cleaning. After rain, cleaning is actually more critical — dried mud is harder to remove than dry dust.", qAr: "هل المطر بينظّف الألواح كفاية؟", aAr: "المطر في مصر نادر جداً ومتّسخ (المطر الأول محمّل بالغبار) ومش بديل عن التنظيف المجدول. بعد المطر التنظيف أكتر أهمية — الطين الجاف أصعب في الإزالة من الغبار الجاف." },
      { qEn: "Can I clean panels during summer noon?", aEn: "No. Panel surface temperature can hit 70°C in Egyptian summer. Cold-water contact causes microcracks invisible to the eye but devastating to long-term output. Only clean before 9 AM or after 6 PM.", qAr: "هل أقدر أنظّف الألواح في ضهر الصيف؟", aAr: "لا. سطح اللوح ممكن يوصل لـ70°م في الصيف المصري. تلامس المياه الباردة بيسبّب شروخ دقيقة مش مرئية بالعين بس مدمّرة للإنتاج طويل المدى. نظّف بس قبل 9 ص أو بعد 6 م." },
      { qEn: "Do I need professional cleaning equipment?", aEn: "For homes (5-15 kWp): a EGP 800-1,500 telescopic microfiber brush + a 25L water tank is enough. For commercial (>30 kWp): invest in a reverse-osmosis filter and an extension pole with flow control.", qAr: "هل محتاج معدّات تنظيف مهنية؟", aAr: "للبيوت (5-15 كيلوواط): فرشاة ميكروفايبر تليسكوب بـ800-1,500 جنيه + خزّان مياه 25 لتر يكفي. للتجاري (فوق 30 كيلوواط): استثمر في فلتر تناضح عكسي وعصاية بطول قابل للتمديد مع تحكّم تدفّق." },
      { qEn: "Will SolarMatch send cleaning reminders?", aEn: "Yes. Premium and Business plan accounts receive automated cleaning reminders calibrated to your governorate and the live air quality / dust forecast.", qAr: "هل سولار ماتش بيبعت تنبيهات تنظيف؟", aAr: "نعم. حسابات Premium وBusiness بتستقبل تنبيهات تنظيف أوتوماتيكية معايرة على محافظتك وتوقّعات جودة الهواء والغبار اللحظية." },
    ],
    publishedAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 7,
  },
  {
    slug: "egyptera-licensing-step-by-step",
    arSlug: "ترخيص-جهاز-تنظيم-الكهرباء-للطاقة-الشمسية",
    cluster: "regulation",
    titleEn: "EgyptERA Solar Licensing: Step-by-Step (2026 Edition)",
    titleAr: "ترخيص جهاز تنظيم الكهرباء للطاقة الشمسية: خطوة بخطوة (إصدار 2026)",
    descriptionEn: "Complete walkthrough of Egyptian solar regulatory approvals — when you need a license, when net-metering is enough, documents required, and timelines.",
    descriptionAr: "شرح كامل لإجراءات الموافقات التنظيمية للطاقة الشمسية في مصر — إمتى محتاج ترخيص وإمتى الـnet-metering يكفي والمستندات المطلوبة والمواعيد.",
    keywords: "EgyptERA solar, solar license Egypt, net metering Egypt, solar regulation Egypt, ترخيص جهاز تنظيم الكهرباء, تنظيم الكهرباء مصر, ترخيص طاقة شمسية",
    introEn: "Egyptian solar regulation is simpler than most installers admit — but the wrong path can stall your project for months. This is the 2026 step-by-step guide to choosing between net-metering (fast track) and full EgyptERA licensing (large systems), with every document, fee and realistic timeline.",
    introAr: "تنظيم الطاقة الشمسية في مصر أبسط مما بيقول معظم المقاولين — لكن المسار الغلط ممكن يأخّر مشروعك شهور. الدليل ده لـ2026 خطوة بخطوة لاختيار المسار الصح بين net-metering (المسار السريع) والترخيص الكامل من الجهاز (الأنظمة الكبيرة)، مع كل مستند ورسم ومواعيد واقعية.",
    sections: [
      { headingEn: "Two regulatory tracks", headingAr: "مساران تنظيميان", bodyEn: "Track A — Net-Metering (≤500 kWp): handled by your local distribution company. No EgyptERA involvement. 2-6 weeks total. Track B — Generation License (>500 kWp): requires EgyptERA licensing, environmental approval, and PPA negotiation. 4-9 months total.", bodyAr: "المسار A — Net-Metering (≤500 كيلوواط): بتتعامل مع شركة التوزيع المحلية. الجهاز مش له دخل. 2-6 أسابيع إجمالي. المسار B — رخصة توليد (فوق 500 كيلوواط): يتطلب ترخيص من الجهاز وموافقة بيئية وتفاوض اتفاقية شراء الطاقة. 4-9 شهور إجمالي." },
      { headingEn: "Net-metering — exactly what to submit", headingAr: "Net-metering — بالظبط إيه اللي تقدّمه", bodyEn: "1) National ID copy. 2) Property ownership/lease deed. 3) Latest electricity bill. 4) Single-line electrical diagram stamped by a registered engineer. 5) Inverter & panel datasheets with EgyptERA-approved model numbers. 6) Installer's NREA registration certificate. Submit to your distribution company branch.", bodyAr: "1) صورة الرقم القومي. 2) عقد ملكية أو إيجار العقار. 3) آخر فاتورة كهرباء. 4) رسم كهربائي خطي مختوم من مهندس نقابي. 5) داتاشيت الإنفرتر والألواح بأرقام موديل معتمدة من الجهاز. 6) شهادة تسجيل المقاول في NREA. تقدّم في فرع شركة التوزيع." },
      { headingEn: "Approved equipment list", headingAr: "قائمة المعدّات المعتمدة", bodyEn: "EgyptERA publishes an official list of certified inverters and panels. Using non-listed equipment automatically rejects net-metering applications. Always demand your installer shows you the latest list (updated quarterly) before final equipment selection.", bodyAr: "الجهاز بينشر قائمة رسمية للإنفرترات والألواح المعتمدة. استخدام معدّات مش على القائمة بيرفض طلب net-metering تلقائياً. اطلب دائماً من المقاول يوريك أحدث قائمة (بتتحدّث كل ربع سنة) قبل اختيار المعدّات النهائي." },
      { headingEn: "Generation license (>500 kWp) walkthrough", headingAr: "خطوات رخصة التوليد (فوق 500 كيلوواط)", bodyEn: "Phase 1 — Provisional approval (1-2 months): site assessment, environmental scoping. Phase 2 — Technical review (2-3 months): full design package, grid impact study. Phase 3 — License issuance + PPA signing (1-3 months). Total: 4-9 months. Fees: EGP 25,000-150,000 depending on capacity.", bodyAr: "المرحلة 1 — موافقة مبدئية (1-2 شهر): تقييم الموقع والمسح البيئي. المرحلة 2 — مراجعة فنية (2-3 شهور): حزمة التصميم الكاملة ودراسة تأثير الشبكة. المرحلة 3 — إصدار الرخصة + توقيع اتفاقية شراء الطاقة (1-3 شهور). الإجمالي: 4-9 شهور. الرسوم: 25,000-150,000 جنيه حسب القدرة." },
      { headingEn: "Common rejection reasons", headingAr: "أسباب الرفض الشائعة", bodyEn: "1) Equipment not on approved list. 2) Engineer's stamp from non-registered engineer. 3) Property documents in different name than electricity account. 4) Single-line diagram missing protection details. 5) System size exceeds property's contracted capacity. SolarMatch's installer network handles all five preemptively.", bodyAr: "1) معدّات مش في القائمة المعتمدة. 2) ختم مهندس مش مسجّل في النقابة. 3) مستندات العقار باسم مختلف عن حساب الكهرباء. 4) الرسم الخطي ناقصه تفاصيل الحماية. 5) حجم النظام بيتجاوز القدرة المتعاقد عليها للعقار. شبكة مقاولي سولار ماتش بتتعامل مع الخمسة وقائياً." },
    ],
    faqs: [
      { qEn: "Do I need a license for a 5 kWp home system?", aEn: "No. Anything under 500 kWp uses the simplified net-metering procedure with your distribution company. EgyptERA is not involved.", qAr: "هل محتاج رخصة لنظام منزلي 5 كيلوواط؟", aAr: "لا. أي حاجة تحت 500 كيلوواط بتستخدم إجراء net-metering المبسّط مع شركة التوزيع. الجهاز مش له دخل." },
      { qEn: "Can I install solar without any approval if I'm fully off-grid?", aEn: "Yes — fully isolated systems with no grid connection don't need any government approval. Required only if you ever connect to the grid or want to export.", qAr: "هل أركّب طاقة شمسية بدون أي موافقات لو خارج الشبكة بالكامل؟", aAr: "نعم — الأنظمة المعزولة كلياً بدون أي اتصال بالشبكة مش محتاجة أي موافقة حكومية. المطلوبة بس لو هتتصل بالشبكة أو هتصدّر لها." },
      { qEn: "Does the meter swap cost extra?", aEn: "The bidirectional (net-metering) meter swap is free in most distribution areas. A few regions charge EGP 800-1,500 for the meter and installation labor.", qAr: "هل تغيير العدّاد بتكلفة إضافية؟", aAr: "تبديل العدّاد ثنائي الاتجاه (net-metering) مجاني في معظم مناطق التوزيع. في مناطق بتاخد 800-1,500 جنيه للعدّاد ولأجور التركيب." },
      { qEn: "Can a tenant install solar with landlord consent?", aEn: "Yes, but the electricity account must remain in a single name. Notarized landlord consent + property documents in landlord's name + tenant's electricity bill — all three required.", qAr: "هل المستأجر يقدر يركّب طاقة شمسية بموافقة المالك؟", aAr: "نعم، بس لازم حساب الكهرباء يفضل بإسم واحد. موافقة المالك موثّقة + مستندات العقار باسم المالك + فاتورة كهرباء المستأجر — التلاتة مطلوبين." },
    ],
    publishedAt: "2026-04-25T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 8,
  },
  {
    slug: "solar-pumping-irrigation-egypt",
    arSlug: "ضخ-المياه-بالطاقة-الشمسية-للري-في-مصر",
    cluster: "market",
    titleEn: "Solar Water Pumping for Egyptian Irrigation: Sizing, Cost & ROI",
    titleAr: "ضخ المياه بالطاقة الشمسية للري في مصر: التحجيم والتكلفة والعائد",
    descriptionEn: "Complete sizing and economics for solar-powered irrigation pumps in Egypt — surface and submersible, drip and flood, with real per-feddan numbers.",
    descriptionAr: "تحجيم كامل واقتصاديات لطلمبات الري الشمسية في مصر — سطحية وغاطسة وبالتنقيط وبالغمر مع أرقام حقيقية لكل فدان.",
    keywords: "solar irrigation Egypt, solar water pump Egypt, drip irrigation solar, agricultural solar Egypt, ري بالطاقة الشمسية, طلمبات شمسية, زراعة شمسية مصر",
    introEn: "Egypt has 8.6 million feddans under cultivation. Roughly 60% still irrigates with diesel pumps, burning EGP 38 billion/year in fuel. Solar pumping is no longer an experiment — it's the highest-ROI agricultural technology available, paying back in 2.5-3.5 years and lasting 20+ years. This guide gives the exact sizing math.",
    introAr: "مصر فيها 8.6 مليون فدان مزروع. تقريباً 60% منهم لسه بيري بطلمبات ديزل، بيحرقوا 38 مليار جنيه/سنة وقود. الضخ الشمسي مش تجربة دلوقتي — هو أعلى تكنولوجيا زراعية عائداً متاحة، بترد رأسمالها في 2.5-3.5 سنة وبتعيش 20+ سنة. الدليل ده بيدّيك حسبة التحجيم بالظبط.",
    sections: [
      { headingEn: "Sizing formula (the engineer's way)", headingAr: "معادلة التحجيم (طريقة المهندس)", bodyEn: "kWp = (water demand m³/day × total dynamic head m × 0.0027) ÷ (peak sun hours × system efficiency 0.45). Example: 100 m³/day × 30 m head ÷ (5.5 × 0.45) = 3.3 kWp pump. Always oversize 20% for low winter sun in Upper Egypt.", bodyAr: "كيلوواط = (طلب المياه م³/يوم × الرفع الديناميكي الكلي م × 0.0027) ÷ (ساعات الشمس الذروة × كفاءة النظام 0.45). مثال: 100 م³/يوم × 30 م رفع ÷ (5.5 × 0.45) = طلمبة 3.3 كيلوواط. كبّر 20% دائماً لتعويض شمس الشتاء الضعيفة في الصعيد." },
      { headingEn: "Pump types — pick the right one", headingAr: "أنواع الطلمبات — اختار الصح", bodyEn: "Surface centrifugal: shallow wells <25m, lowest cost. Submersible: deep wells 25-150m, requires VFD inverter. Solar-direct (no battery): cheapest, runs only during sunlight. Solar+battery hybrid: night-time pumping for orchards needing precise timing.", bodyAr: "السطحية الطاردة المركزية: آبار ضحلة أقل من 25 م، أرخص تكلفة. الغاطسة: آبار عميقة 25-150 م، محتاجة إنفرتر VFD. شمسية مباشرة (بدون بطارية): الأرخص، بتشتغل بس وقت الشمس. شمسية+بطارية هجين: ضخ ليلي للبساتين اللي محتاجة توقيت دقيق." },
      { headingEn: "Per-feddan economics by crop", headingAr: "اقتصاديات الفدان حسب المحصول", bodyEn: "Wheat (winter): 3,000 m³/feddan/season → EGP 28,000 system per feddan, EGP 9,500/feddan/year diesel savings, 3.0-year payback. Vegetables (year-round): 7,500 m³/feddan/year → EGP 42,000 system, EGP 16,800 savings, 2.5-year payback. Citrus: 6,500 m³/feddan/year → 2.7-year payback.", bodyAr: "قمح (شتوي): 3,000 م³/فدان/موسم → نظام 28,000 جنيه/فدان، توفير ديزل 9,500 جنيه/فدان/سنة، استرداد 3.0 سنة. خضار (طول السنة): 7,500 م³/فدان/سنة → نظام 42,000 جنيه، توفير 16,800، استرداد 2.5 سنة. موالح: 6,500 م³/فدان/سنة → استرداد 2.7 سنة." },
      { headingEn: "Drip irrigation pairing", headingAr: "اقتران الري بالتنقيط", bodyEn: "Solar + drip is the killer combo: drip cuts water needs 35-50% vs flood, allowing a smaller (cheaper) solar pump. Combined system payback drops to 1.8-2.5 years. Government water-saving programmes co-fund up to 25% of drip equipment.", bodyAr: "الشمسي + التنقيط = اقتران قاتل: التنقيط بيقلّل احتياج المياه 35-50% مقارنة بالغمر، مما يسمح بطلمبة شمسية أصغر (أرخص). استرداد النظام المشترك بينزل لـ1.8-2.5 سنة. برامج توفير المياه الحكومية بتموّل حتى 25% من معدّات التنقيط." },
      { headingEn: "Maintenance & lifespan", headingAr: "الصيانة والعمر الافتراضي", bodyEn: "Solar panels: 25 years (degradation <0.5%/year). Submersible pumps: 8-12 years before rebuild (EGP 8,000-15,000). Surface pumps: 15-20 years. VFD inverters: 10-12 years. Total 25-year lifecycle cost is roughly half of equivalent diesel pumping including fuel and rebuilds.", bodyAr: "الألواح الشمسية: 25 سنة (تدهور أقل من 0.5%/سنة). الطلمبات الغاطسة: 8-12 سنة قبل التجديد (8,000-15,000 جنيه). الطلمبات السطحية: 15-20 سنة. إنفرتر VFD: 10-12 سنة. إجمالي تكلفة دورة الـ25 سنة ≈ نص تكلفة الضخ بالديزل المكافئ لو حسبنا الوقود والتجديدات." },
    ],
    faqs: [
      { qEn: "Do I need permits for solar pumping?", aEn: "Off-grid pumps with no grid export need no electrical permit. Well-drilling permits from the Ministry of Water Resources are still required for new wells.", qAr: "هل محتاج تصاريح للضخ الشمسي؟", aAr: "الطلمبات خارج الشبكة بدون تصدير مش محتاجة تصريح كهربائي. تصاريح حفر الآبار من وزارة الموارد المائية لسه مطلوبة للآبار الجديدة." },
      { qEn: "Can I run sprinklers with solar?", aEn: "Yes — solar handles sprinkler pressures (2-4 bar) easily. Center-pivot systems above 5 bar need oversized pumps and often partial battery support.", qAr: "هل أقدر أشغّل رشاشات بالشمسي؟", aAr: "نعم — الشمسي بيشيل ضغط الرشاشات (2-4 بار) بسهولة. أنظمة الـcenter-pivot فوق 5 بار محتاجة طلمبات أكبر وأحياناً دعم بطاريات جزئي." },
      { qEn: "What if I want to expand my farm later?", aEn: "Design with 30-50% headroom in the panel array and inverter — adding pump capacity later is cheap if the electrical infrastructure is oversized from day one.", qAr: "ولو هوسّع المزرعة لاحقاً؟", aAr: "صمّم بهامش 30-50% في مصفوفة الألواح والإنفرتر — إضافة قدرة طلمبة لاحقاً رخيصة لو البنية الكهربائية متعمّلة بحجم أكبر من أول يوم." },
      { qEn: "Is grid power needed as backup?", aEn: "For most field crops, no — solar matches the daily watering window. For sensitive crops (greenhouses, dairy), grid or generator backup is recommended for cloudy weeks.", qAr: "هل الكهرباء من الشبكة مطلوبة كاحتياطي؟", aAr: "لمعظم المحاصيل الحقلية، لا — الشمسي بيطابق نافذة الري اليومية. للمحاصيل الحساسة (صوب وألبان)، احتياطي شبكة أو مولد موصى به في الأسابيع الغايمة." },
    ],
    publishedAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    readingMinutes: 9,
  },
];

export const getBlogPost = (slug: string) =>
  BLOG_POSTS.find((p) => p.slug === slug || p.arSlug === slug);

export const BLOG_CLUSTERS: { id: BlogPost["cluster"]; en: string; ar: string }[] = [
  { id: "basics", en: "Solar Basics", ar: "أساسيات الطاقة الشمسية" },
  { id: "technology", en: "Technology & Equipment", ar: "التقنية والمعدّات" },
  { id: "finance", en: "Cost & Financing", ar: "التكلفة والتمويل" },
  { id: "regulation", en: "Regulation & Policy", ar: "التنظيم والسياسات" },
  { id: "market", en: "Market & Sectors", ar: "السوق والقطاعات" },
];
