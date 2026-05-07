import { useTranslation } from "react-i18next";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import {
  MapPin, Zap, BarChart3, FileText, Shield, Brain, Sun, Leaf, Clock, Globe,
  Calculator, Users, Cloud, Wind, Cpu, Database, LineChart, Lock, Smartphone,
  Languages, Download, Share2, MessageSquare, Building2, Tractor, Home,
  TrendingUp, Eye, Layers, Sparkles, RefreshCw, BookOpen, Award, AlertTriangle,
} from "lucide-react";

type Feature = {
  icon: any;
  color: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
};

type Category = {
  titleEn: string;
  titleAr: string;
  features: Feature[];
};

const categories: Category[] = [
  {
    titleEn: "Mapping & Location",
    titleAr: "الخرائط والموقع",
    features: [
      { icon: MapPin, color: "text-blue-500 bg-blue-500/10",
        titleEn: "Google Maps Integration", titleAr: "تكامل خرائط جوجل",
        descEn: "Pinpoint your exact location with high-resolution satellite imagery powered by Google Maps.",
        descAr: "حدد موقعك بدقة على صور الأقمار الصناعية عالية الدقة من خرائط جوجل." },
      { icon: Eye, color: "text-sky-500 bg-sky-500/10",
        titleEn: "Address Autocomplete", titleAr: "إكمال تلقائي للعنوان",
        descEn: "Search any address in Egypt and jump straight to the right rooftop instantly.",
        descAr: "ابحث عن أي عنوان في مصر وانتقل مباشرة للسطح الصحيح فوراً." },
      { icon: Layers, color: "text-indigo-500 bg-indigo-500/10",
        titleEn: "Polygon Drawing Tool", titleAr: "أداة رسم المضلعات",
        descEn: "Draw your rooftop or land area directly on the map with a precise polygon editor.",
        descAr: "ارسم مساحة السطح أو الأرض مباشرة على الخريطة بأداة رسم دقيقة." },
      { icon: Cpu, color: "text-purple-500 bg-purple-500/10",
        titleEn: "AI Rooftop Detection", titleAr: "كشف السطح بالذكاء الاصطناعي",
        descEn: "Vision AI isolates the actual building inside your selection, ignoring streets and neighbors.",
        descAr: "رؤية الذكاء الاصطناعي تعزل المبنى الفعلي داخل تحديدك متجاهلة الشوارع والجيران." },
    ],
  },
  {
    titleEn: "Solar & Climate Data",
    titleAr: "بيانات الطاقة والمناخ",
    features: [
      { icon: Sun, color: "text-amber-500 bg-amber-500/10",
        titleEn: "Google Solar API", titleAr: "Google Solar API",
        descEn: "Real solar irradiance and roof segment data when available for your location.",
        descAr: "بيانات إشعاع شمسي وأجزاء السطح الحقيقية عند توفرها لموقعك." },
      { icon: Cloud, color: "text-teal-500 bg-teal-500/10",
        titleEn: "NASA POWER Climate", titleAr: "بيانات مناخ NASA",
        descEn: "Multi-decade climate dataset as a reliable fallback for irradiance and temperature.",
        descAr: "مجموعة بيانات مناخية لعقود من NASA كمصدر احتياطي موثوق للإشعاع والحرارة." },
      { icon: Wind, color: "text-cyan-500 bg-cyan-500/10",
        titleEn: "Air Quality & Dust", titleAr: "جودة الهواء والغبار",
        descEn: "AQI and soiling data factor into efficiency losses — including Khamaseen season.",
        descAr: "بيانات جودة الهواء والاتساخ تدخل في حسابات فقد الكفاءة بما فيها موسم الخماسين." },
      { icon: Sparkles, color: "text-yellow-500 bg-yellow-500/10",
        titleEn: "Cleaning Recommendations", titleAr: "توصيات التنظيف",
        descEn: "Get a tailored panel cleaning schedule based on your local dust and pollen levels.",
        descAr: "احصل على جدول تنظيف مخصص للألواح بناءً على مستويات الغبار وحبوب اللقاح المحلية." },
    ],
  },
  {
    titleEn: "Calculations & Engineering",
    titleAr: "الحسابات والهندسة",
    features: [
      { icon: Calculator, color: "text-emerald-500 bg-emerald-500/10",
        titleEn: "Deterministic Math Engine", titleAr: "محرك حسابات حتمي",
        descEn: "Reproducible calculations for system size, energy yield, and savings — no random AI guesses.",
        descAr: "حسابات قابلة للتكرار لحجم النظام والإنتاج والتوفير — بدون تخمينات عشوائية." },
      { icon: TrendingUp, color: "text-green-500 bg-green-500/10",
        titleEn: "Ideal System Sizing", titleAr: "تحجيم النظام المثالي",
        descEn: "We calculate the optimal kWp for your usage, area, and goals — not just the maximum.",
        descAr: "نحسب الكيلوواط المثالي لاستهلاكك ومساحتك وأهدافك — وليس فقط الحد الأقصى." },
      { icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10",
        titleEn: "Oversize Protection", titleAr: "حماية من الإفراط",
        descEn: "Warns when system exceeds 150% coverage and recommends a balanced 110% target.",
        descAr: "ينبهك عندما يتجاوز النظام 150% من التغطية ويوصي بهدف متوازن 110%." },
      { icon: Zap, color: "text-yellow-500 bg-yellow-500/10",
        titleEn: "Grid / Hybrid / Off-grid", titleAr: "شبكة / هجين / مستقل",
        descEn: "Smart connection-type recommendation based on your coverage ratio and load profile.",
        descAr: "توصية ذكية لنوع التوصيل بناءً على نسبة التغطية وملف الحمل." },
    ],
  },
  {
    titleEn: "Financial Analysis",
    titleAr: "التحليل المالي",
    features: [
      { icon: BarChart3, color: "text-emerald-500 bg-emerald-500/10",
        titleEn: "Full ROI & Payback", titleAr: "العائد وفترة الاسترداد",
        descEn: "Annual savings, payback period, and lifetime ROI calculated transparently.",
        descAr: "التوفير السنوي وفترة الاسترداد وعائد العمر الكامل بحسابات شفافة." },
      { icon: LineChart, color: "text-blue-500 bg-blue-500/10",
        titleEn: "25-Year Projections", titleAr: "توقعات 25 سنة",
        descEn: "Visual cashflow timeline showing cumulative savings across the panel lifetime.",
        descAr: "خط زمني مرئي للتدفق النقدي يوضح التوفير التراكمي خلال عمر الألواح." },
      { icon: Layers, color: "text-purple-500 bg-purple-500/10",
        titleEn: "3 Cost Scenarios", titleAr: "3 سيناريوهات للتكلفة",
        descEn: "Compare Economy, Standard, and Premium hardware packages side-by-side.",
        descAr: "قارن بين باقات اقتصادي وقياسي ومتميز جنباً إلى جنب." },
      { icon: RefreshCw, color: "text-rose-500 bg-rose-500/10",
        titleEn: "Live 2026 Tariffs", titleAr: "تعريفة 2026 الحية",
        descEn: "Residential, commercial, and industrial tiered tariffs auto-updated daily.",
        descAr: "تعريفات الشرائح السكنية والتجارية والصناعية تُحدَّث تلقائياً يومياً." },
    ],
  },
  {
    titleEn: "AI & Intelligence",
    titleAr: "الذكاء الاصطناعي",
    features: [
      { icon: Brain, color: "text-purple-500 bg-purple-500/10",
        titleEn: "Gemini-Powered Advisor", titleAr: "مستشار يعمل بـ Gemini",
        descEn: "Personalized verdicts and explanations powered by Google Gemini 2.5.",
        descAr: "توصيات وتفسيرات مخصصة مدعومة بـ Google Gemini 2.5." },
      { icon: Shield, color: "text-emerald-500 bg-emerald-500/10",
        titleEn: "AI Verification Layer", titleAr: "طبقة التحقق بالذكاء الاصطناعي",
        descEn: "AI reviews calculations and caps adjustments at ±30% — math stays trustworthy.",
        descAr: "الذكاء الاصطناعي يراجع الحسابات ويحد التعديلات عند ±30% — الأرقام تبقى موثوقة." },
      { icon: MessageSquare, color: "text-pink-500 bg-pink-500/10",
        titleEn: "Solar ChatBot", titleAr: "روبوت دردشة شمسي",
        descEn: "Ask questions about your report and get instant context-aware answers.",
        descAr: "اسأل عن تقريرك واحصل على إجابات فورية مدركة للسياق." },
      { icon: BookOpen, color: "text-indigo-500 bg-indigo-500/10",
        titleEn: "Decision Explanation", titleAr: "تفسير القرار",
        descEn: "Plain-language reasoning behind every Suitable / Conditional / Not Suitable verdict.",
        descAr: "شرح بلغة بسيطة وراء كل قرار: مناسب / مشروط / غير مناسب." },
    ],
  },
  {
    titleEn: "Property Types",
    titleAr: "أنواع العقارات",
    features: [
      { icon: Home, color: "text-blue-500 bg-blue-500/10",
        titleEn: "Residential Buildings", titleAr: "المباني السكنية",
        descEn: "Single homes and multi-unit apartments with per-unit consumption modeling.",
        descAr: "منازل فردية وعمارات متعددة الوحدات مع نمذجة استهلاك لكل وحدة." },
      { icon: Building2, color: "text-amber-500 bg-amber-500/10",
        titleEn: "Commercial Properties", titleAr: "العقارات التجارية",
        descEn: "Offices, shops, and factories with the right tiered commercial tariffs applied.",
        descAr: "مكاتب ومحلات ومصانع مع تطبيق التعريفات التجارية الصحيحة." },
      { icon: Tractor, color: "text-green-500 bg-green-500/10",
        titleEn: "Agricultural Mode", titleAr: "وضع المزارع",
        descEn: "Feddan-based area input and 85% usable factor for farm-scale solar projects.",
        descAr: "إدخال المساحة بالفدان وعامل استخدام 85% لمشاريع الطاقة الزراعية." },
      { icon: Globe, color: "text-teal-500 bg-teal-500/10",
        titleEn: "Built for Egypt", titleAr: "مصمم لمصر",
        descEn: "Local pricing, Egyptian tariffs, and climate data tuned for the entire country.",
        descAr: "أسعار محلية وتعريفات مصرية وبيانات مناخية مضبوطة للجمهورية كلها." },
    ],
  },
  {
    titleEn: "Reports & Sharing",
    titleAr: "التقارير والمشاركة",
    features: [
      { icon: FileText, color: "text-sky-500 bg-sky-500/10",
        titleEn: "Professional PDF Report", titleAr: "تقرير PDF احترافي",
        descEn: "Bilingual branded PDF with all data, charts, and recommendations — ready to share.",
        descAr: "ملف PDF ثنائي اللغة بكل البيانات والرسوم والتوصيات — جاهز للمشاركة." },
      { icon: Download, color: "text-emerald-500 bg-emerald-500/10",
        titleEn: "Instant Download", titleAr: "تحميل فوري",
        descEn: "No waiting, no email gates — your report downloads the moment it's ready.",
        descAr: "بدون انتظار أو بوابات بريد — تقريرك يُحمّل فور جهوزيته." },
      { icon: Share2, color: "text-purple-500 bg-purple-500/10",
        titleEn: "Shareable Results Link", titleAr: "رابط نتائج قابل للمشاركة",
        descEn: "Send your full assessment to family or your installer with a single URL.",
        descAr: "أرسل تقييمك كاملاً للأسرة أو شركة التركيب برابط واحد." },
      { icon: Database, color: "text-orange-500 bg-orange-500/10",
        titleEn: "Saved Report History", titleAr: "أرشيف التقارير المحفوظة",
        descEn: "Logged-in users get a private history of all past assessments.",
        descAr: "المستخدمون المسجلون يحصلون على أرشيف خاص بكل تقييماتهم السابقة." },
    ],
  },
  {
    titleEn: "Platform & Experience",
    titleAr: "المنصة وتجربة المستخدم",
    features: [
      { icon: Languages, color: "text-rose-500 bg-rose-500/10",
        titleEn: "Arabic + English (RTL)", titleAr: "عربي + إنجليزي (RTL)",
        descEn: "Fully translated UI with proper right-to-left layout and Arabic typography.",
        descAr: "واجهة مترجمة بالكامل مع تخطيط صحيح من اليمين لليسار وطباعة عربية." },
      { icon: Smartphone, color: "text-blue-500 bg-blue-500/10",
        titleEn: "Mobile Optimized", titleAr: "محسّن للموبايل",
        descEn: "Bottom navigation, dark mode toggle, and touch-friendly controls everywhere.",
        descAr: "تنقل سفلي وتبديل الوضع الداكن وتحكم ملائم للمس في كل مكان." },
      { icon: Lock, color: "text-emerald-500 bg-emerald-500/10",
        titleEn: "Secure Authentication", titleAr: "مصادقة آمنة",
        descEn: "Magic-link and Google sign-in with row-level security on all your data.",
        descAr: "تسجيل برابط سحري وحساب جوجل مع حماية على مستوى الصف لكل بياناتك." },
      { icon: Award, color: "text-amber-500 bg-amber-500/10",
        titleEn: "Transparent Assumptions", titleAr: "افتراضات شفافة",
        descEn: "Every number shows its source — no hidden fudge factors or marketing math.",
        descAr: "كل رقم يظهر مصدره — بدون عوامل مخفية أو حسابات تسويقية." },
    ],
  },
];

const FeaturesPage = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const totalFeatures = categories.reduce((s, c) => s + c.features.length, 0);

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <PageSeo
        path="/features"
        en={{
          title: `${totalFeatures}+ Features | SolarMatch — Egypt's AI Solar Platform`,
          description: `Explore all ${totalFeatures}+ features of SolarMatch: AI rooftop detection, NASA & Google Solar data, 25-year ROI, bilingual PDF reports, live 2026 tariffs, and more.`,
          keywords: "SolarMatch features, solar calculator features Egypt, AI solar platform, solar feasibility tools",
        }}
        ar={{
          title: `${totalFeatures}+ ميزة | SolarMatch — منصة الطاقة الشمسية الذكية في مصر`,
          description: `اكتشف كل مميزات SolarMatch: كشف السطح بالذكاء الاصطناعي، بيانات NASA و Google Solar، توقعات 25 سنة، تقارير PDF ثنائية اللغة، تعريفة 2026 الحية، والمزيد.`,
          keywords: "مميزات سولار ماتش, الطاقة الشمسية مصر, حاسبة الطاقة الشمسية, دراسة جدوى",
        }}
        breadcrumbs={[{ name: "Features", nameAr: "المميزات", path: "/features" }]}
        type="article"
      />
      <Header />
      <main className="pt-20 pb-24 md:pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <ScrollReveal>
            <div className="text-center mb-14 mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? `${totalFeatures}+ ميزة قوية` : `${totalFeatures}+ Powerful Features`}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                {isAr ? "كل ما يحتاجه قرارك الشمسي" : "Everything Your Solar Decision Needs"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isAr
                  ? "منصة متكاملة تجمع البيانات الحقيقية والذكاء الاصطناعي والحسابات الهندسية في مكان واحد"
                  : "An integrated platform combining real-world data, AI, and engineering math in one place."}
              </p>
            </div>
          </ScrollReveal>

          {/* Categories */}
          <div className="space-y-16">
            {categories.map((cat, ci) => (
              <section key={ci}>
                <ScrollReveal>
                  <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-3">
                    <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground">
                      {isAr ? cat.titleAr : cat.titleEn}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {cat.features.length} {isAr ? "ميزة" : "features"}
                    </span>
                  </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {cat.features.map((f, fi) => {
                    const Icon = f.icon;
                    return (
                      <ScrollReveal key={fi}>
                        <div className="group h-full rounded-2xl border border-border bg-card p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${f.color} mb-3`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground mb-1.5">
                            {isAr ? f.titleAr : f.titleEn}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {isAr ? f.descAr : f.descEn}
                          </p>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <ScrollReveal>
            <div className="text-center mt-20 rounded-3xl border border-border bg-card p-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                {isAr ? "جاهز تجرب كل ده؟" : "Ready to try all of this?"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                {isAr
                  ? "ابدأ تقييمك المجاني الآن واحصل على تقرير كامل في أقل من دقيقة"
                  : "Start your free assessment now and get a full report in under a minute."}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Zap className="w-5 h-5" />
                {isAr ? "ابدأ تقييمك المجاني" : "Start Free Assessment"}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default FeaturesPage;
