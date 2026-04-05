import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import {
  MapPin, Zap, BarChart3, FileText, Shield, Brain,
  Sun, Leaf, Clock, Globe, Calculator, Users
} from "lucide-react";

const features = [
  { icon: MapPin, colorClass: "text-blue-500 bg-blue-500/10" },
  { icon: Sun, colorClass: "text-amber-500 bg-amber-500/10" },
  { icon: Calculator, colorClass: "text-emerald-500 bg-emerald-500/10" },
  { icon: Brain, colorClass: "text-purple-500 bg-purple-500/10" },
  { icon: FileText, colorClass: "text-sky-500 bg-sky-500/10" },
  { icon: BarChart3, colorClass: "text-orange-500 bg-orange-500/10" },
  { icon: Shield, colorClass: "text-rose-500 bg-rose-500/10" },
  { icon: Zap, colorClass: "text-yellow-500 bg-yellow-500/10" },
  { icon: Leaf, colorClass: "text-green-500 bg-green-500/10" },
  { icon: Clock, colorClass: "text-indigo-500 bg-indigo-500/10" },
  { icon: Globe, colorClass: "text-teal-500 bg-teal-500/10" },
  { icon: Users, colorClass: "text-pink-500 bg-pink-500/10" },
];

const WhySolarMatch = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const featureItems = [
    {
      title: isAr ? "تحديد الموقع بالخريطة" : "Map-Based Location",
      desc: isAr
        ? "اختار موقعك على خريطة جوجل بدقة واحصل على بيانات إشعاع شمسي حقيقية لمنطقتك"
        : "Select your exact location on Google Maps and get real solar irradiance data for your area",
    },
    {
      title: isAr ? "بيانات شمسية حقيقية" : "Real Solar Data",
      desc: isAr
        ? "نستخدم بيانات NASA POWER و Google Solar API لضمان دقة تقديرات الإنتاج"
        : "We use NASA POWER and Google Solar API to ensure accurate production estimates",
    },
    {
      title: isAr ? "تحليل مالي شامل" : "Full Financial Analysis",
      desc: isAr
        ? "تكلفة النظام، التوفير السنوي، فترة الاسترداد، وعائد الاستثمار بأسعار السوق الحقيقية"
        : "System cost, annual savings, payback period, and ROI with real market prices",
    },
    {
      title: isAr ? "تحليل ذكاء اصطناعي" : "AI-Powered Analysis",
      desc: isAr
        ? "توصيات مخصصة مبنية على بياناتك الفعلية باستخدام أحدث نماذج الذكاء الاصطناعي"
        : "Custom recommendations based on your actual data using the latest AI models",
    },
    {
      title: isAr ? "تقرير PDF احترافي" : "Professional PDF Report",
      desc: isAr
        ? "حمّل تقرير كامل بجميع البيانات والتوصيات جاهز للطباعة أو المشاركة"
        : "Download a complete report with all data and recommendations, ready to print or share",
    },
    {
      title: isAr ? "3 سيناريوهات تكلفة" : "3 Cost Scenarios",
      desc: isAr
        ? "قارن بين الاقتصادي والقياسي والمتميز لاختيار النظام المناسب لميزانيتك"
        : "Compare Economy, Standard, and Premium to choose the system that fits your budget",
    },
    {
      title: isAr ? "أسعار محدّثة يومياً" : "Daily Updated Prices",
      desc: isAr
        ? "أسعار الألواح وتعريفة الكهرباء يتم تحديثها تلقائياً كل 24 ساعة من مصادر حقيقية"
        : "Panel prices and electricity tariffs are auto-updated every 24 hours from real sources",
    },
    {
      title: isAr ? "سرعة فائقة" : "Lightning Fast",
      desc: isAr
        ? "احصل على نتائجك في ثوانٍ بدون انتظار — لا حاجة لحجز موعد أو زيارة ميدانية"
        : "Get your results in seconds — no need to book appointments or wait for site visits",
    },
    {
      title: isAr ? "حساب CO₂" : "CO₂ Calculation",
      desc: isAr
        ? "اعرف كم طن من الانبعاثات ستوفرها سنوياً بالتحول للطاقة الشمسية"
        : "Know how many tons of emissions you'll save annually by switching to solar",
    },
    {
      title: isAr ? "تعريفة الكهرباء 2026" : "2026 Electricity Tariff",
      desc: isAr
        ? "حسابات مبنية على تعريفة الكهرباء الرسمية المحدّثة لعام 2026 بنظام الشرائح"
        : "Calculations based on the official 2026 tiered electricity tariff",
    },
    {
      title: isAr ? "دعم عربي وإنجليزي" : "Arabic & English",
      desc: isAr
        ? "المنصة متاحة بالكامل باللغتين العربية والإنجليزية"
        : "The platform is fully available in both Arabic and English",
    },
    {
      title: isAr ? "مصمم لمصر" : "Built for Egypt",
      desc: isAr
        ? "مصمم خصيصاً للسوق المصري — أسعار محلية، تعريفة مصرية، ومناخ محلي"
        : "Specifically designed for the Egyptian market — local prices, tariffs, and climate",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="pt-20 pb-24 md:pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <ScrollReveal>
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {isAr ? "لماذا سولار ماتش؟" : "Why SolarMatch?"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {isAr
                  ? "منصة ذكية تساعدك تاخد قرار مبني على بيانات حقيقية قبل ما تتواصل مع أي شركة تركيب"
                  : "A smart platform that helps you make data-driven decisions before contacting any installation company"}
              </p>
            </div>
          </ScrollReveal>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureItems.map((item, i) => {
              const f = features[i];
              const Icon = f.icon;
              return (
                <ScrollReveal key={i}>
                  <div className="group rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.colorClass} mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* CTA */}
          <ScrollReveal>
            <div className="text-center mt-16">
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Zap className="w-5 h-5" />
                {isAr ? "ابدأ تقييمك الآن" : "Start Your Assessment Now"}
              </a>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default WhySolarMatch;
