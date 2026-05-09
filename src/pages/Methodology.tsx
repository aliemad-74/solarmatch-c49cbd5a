import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { PageSeo } from "@/components/seo/PageSeo";
import { ShieldCheck, Database, Calculator, Cpu, FileCheck2 } from "lucide-react";

const Methodology = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const sources = [
    { name: "NASA POWER", desc: isAr ? "بيانات الإشعاع الشمسي ودرجات الحرارة على مدار 30 سنة" : "30-year solar irradiance, temperature & climate data", url: "https://power.larc.nasa.gov/" },
    { name: "Google Solar API", desc: isAr ? "تحليل أسطح المباني والإنتاج الضوئي" : "Rooftop segment analysis and PV production modeling", url: "https://developers.google.com/maps/documentation/solar" },
    { name: "EgyptERA", desc: isAr ? "تعرفة الكهرباء الرسمية لعام 2026 (سكني تجاري صناعي)" : "Official 2026 electricity tariffs (residential, commercial, industrial)", url: "https://egyptera.org/" },
    { name: "IRENA", desc: isAr ? "معايير الصناعة العالمية لتكلفة الطاقة المتجددة" : "Global LCOE benchmarks for renewable energy", url: "https://www.irena.org/" },
    { name: "Lovable AI Gateway (Gemini 2.5)", desc: isAr ? "نقطة تحقق الذكاء الاصطناعي للتوصيات والمراجعة" : "AI verification checkpoint and chatbot recommendations", url: "https://lovable.dev/" },
  ];

  const formulas = [
    { name: isAr ? "الإنتاج السنوي" : "Annual production", body: "kWh/year = kWp × irradiance × 365 × PR(0.78)" },
    { name: isAr ? "التوفير السنوي" : "Annual savings", body: "Savings = production × tiered tariff (EgyptERA 2026)" },
    { name: isAr ? "فترة الاسترداد" : "Payback period", body: "Years = capex ÷ annual savings" },
    { name: isAr ? "تخفيض الكربون" : "CO₂ reduction", body: "CO₂ tons/yr = production × 0.45 kg/kWh × 10⁻³" },
    { name: isAr ? "خسارة الغبار (الخماسين)" : "Dust loss (Khamaseen)", body: isAr ? "4–8% خلال مارس–مايو حسب المنطقة" : "4–8% during Mar–May depending on region" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <PageSeo
        path="/methodology"
        en={{
          title: "Methodology & Data Sources | SolarMatch",
          description: "How SolarMatch calculates solar feasibility for Egypt: NASA POWER, Google Solar API, EgyptERA 2026 tariffs, AI verification, and our engineering formulas.",
          keywords: "solar methodology Egypt, NASA POWER solar, Google Solar API, EgyptERA tariffs, solar calculation",
        }}
        ar={{
          title: "المنهجية ومصادر البيانات | SolarMatch",
          description: "كيف يحسب SolarMatch جدوى الطاقة الشمسية في مصر: بيانات NASA و Google Solar وتعرفة EgyptERA 2026 ومراجعة الذكاء الاصطناعي.",
          keywords: "منهجية الطاقة الشمسية مصر, بيانات ناسا الشمسية, تعرفة الكهرباء 2026",
        }}
        breadcrumbs={[{ name: "Methodology", nameAr: "المنهجية", path: "/methodology" }]}
      />
      <Header />

      <main className="pt-32 pb-16">
        <article className="container mx-auto px-4 max-w-4xl">
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? "شفافية كاملة" : "Full transparency"}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              {isAr ? "المنهجية ومصادر البيانات" : "Methodology & Data Sources"}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isAr
                ? "نوضح هنا بالتفصيل كل مصدر بيانات وكل معادلة نستخدمها لحساب جدوى الطاقة الشمسية. SolarMatch ليس بديلاً عن الدراسة الهندسية النهائية، لكنه أداة قرار أولية مبنية على بيانات حقيقية."
                : "Every data source and formula we use to estimate solar feasibility — documented openly. SolarMatch is a decision-support platform, not a substitute for final engineering inspection."}
            </p>
          </header>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> {isAr ? "مصادر البيانات" : "Data Sources"}
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {sources.map((s) => (
                <Card key={s.name} className="border-border">
                  <CardContent className="p-4">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary">{s.name}</a>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> {isAr ? "المعادلات الأساسية" : "Core Formulas"}
            </h2>
            <div className="space-y-3">
              {formulas.map((f) => (
                <Card key={f.name} className="border-border">
                  <CardContent className="p-4">
                    <div className="font-semibold text-foreground mb-1">{f.name}</div>
                    <code className="text-sm text-primary font-mono bg-primary/5 px-2 py-1 rounded">{f.body}</code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> {isAr ? "نقطة التحقق بالذكاء الاصطناعي" : "AI Verification Checkpoint"}
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              {isAr
                ? "بعد كل حساب، يقوم نموذج Gemini 2.5 بمراجعة النتائج ويمكنه تعديل الأرقام المالية بحد أقصى ±30% بناءً على ظروف السوق المحلية. الحسابات الفنية الأساسية (الإنتاج، الحجم) تبقى ثابتة وقابلة للتكرار."
                : "After every calculation, Gemini 2.5 reviews the result and may adjust financial figures by at most ±30% based on local market context. Core engineering numbers (production, sizing) remain deterministic and reproducible."}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-primary" /> {isAr ? "حدود المنصة" : "Platform Limitations"}
            </h2>
            <ul className="list-disc ms-6 space-y-2 text-foreground/80">
              <li>{isAr ? "لا تحل محل الفحص الهندسي الميداني." : "Not a replacement for on-site engineering inspection."}</li>
              <li>{isAr ? "تقديرات التظليل اعتمادية على Google Solar API وقد تختلف." : "Shading estimates depend on Google Solar API and may vary."}</li>
              <li>{isAr ? "أسعار السوق محدّثة كل 24 ساعة وقد تختلف بين الموردين." : "Market prices refresh every 24 hours and vary across vendors."}</li>
            </ul>
          </section>

          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-6 text-center">
              <p className="mb-4 opacity-90">{isAr ? "جاهز تجرب؟ احسب جدوى عقارك خلال دقيقتين." : "Ready to try it? Calculate your property's feasibility in 2 minutes."}</p>
              <Link to={isAr ? "/ar" : "/"} className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90">
                {isAr ? "ابدأ الآن" : "Start Free Analysis"}
              </Link>
            </CardContent>
          </Card>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Methodology;
