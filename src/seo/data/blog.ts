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
