import { useTranslation } from "react-i18next";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { FileText, AlertTriangle, Scale, CreditCard, Ban, RefreshCw } from "lucide-react";

const Terms = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const lastUpdated = isAr ? "آخر تحديث: 17 أبريل 2026" : "Last updated: April 17, 2026";

  const sections = isAr
    ? [
        {
          icon: FileText,
          title: "طبيعة الخدمة",
          body: "سولار ماتش منصة لدعم اتخاذ القرار وتقدير الجدوى الأولية لتركيب الطاقة الشمسية في مصر. التقارير المقدمة تعتمد على نماذج هندسية ومالية معتمدة لكنها لا تعتبر دراسة هندسية نهائية ولا تغني عن المعاينة الميدانية المتخصصة.",
        },
        {
          icon: AlertTriangle,
          title: "إخلاء المسؤولية",
          body: "النتائج تقديرية وقد تختلف عن التطبيق الفعلي بسبب عوامل ميدانية (التظليل، توجيه السطح، حالة الكابلات، أسعار السوق وقت التركيب). لا تتحمل سولار ماتش أي مسؤولية عن قرارات استثمارية تُتخذ بناءً على التقارير دون مراجعة مهندس متخصص.",
        },
        {
          icon: Scale,
          title: "استخدام مقبول",
          body: "يلتزم المستخدم باستخدام المنصة لأغراض مشروعة فقط، وعدم محاولة اختراقها أو استخراج بياناتها بأساليب آلية، أو إساءة استخدام نظام التقارير المجانية عبر حسابات متعددة.",
        },
        {
          icon: CreditCard,
          title: "الاشتراكات والمدفوعات",
          body: "الخطة المجانية تتيح تقريراً واحداً. الخطط المدفوعة (تقرير منفرد، اشتراك شهري، خطة الأعمال) توفر حدوداً أعلى ومزايا إضافية. الأسعار قابلة للتعديل بإشعار مسبق، والمبالغ المدفوعة غير قابلة للاسترداد إلا في حالات الخلل التقني المثبت.",
        },
        {
          icon: Ban,
          title: "إنهاء الحساب",
          body: "نحتفظ بالحق في تعليق أو إنهاء أي حساب يخالف هذه الشروط دون إشعار مسبق، ويمكن للمستخدم حذف حسابه بنفسه في أي وقت من صفحة الحساب.",
        },
        {
          icon: RefreshCw,
          title: "تعديلات الشروط",
          body: "قد نحدّث هذه الشروط من حين لآخر. يتم إشعار المستخدمين بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة، ويعتبر استمرار الاستخدام بعد التحديث موافقة ضمنية على الشروط الجديدة.",
        },
      ]
    : [
        {
          icon: FileText,
          title: "Nature of the Service",
          body: "SolarMatch is a decision-support platform that estimates the preliminary feasibility of installing solar energy in Egypt. Reports are based on validated engineering and financial models, but do not constitute a final engineering study and do not replace a specialized on-site inspection.",
        },
        {
          icon: AlertTriangle,
          title: "Disclaimer",
          body: "Results are estimates and may differ from actual implementation due to field factors (shading, roof orientation, wiring condition, market prices at the time of installation). SolarMatch is not liable for any investment decisions made based on reports without consulting a specialized engineer.",
        },
        {
          icon: Scale,
          title: "Acceptable Use",
          body: "Users agree to use the platform for lawful purposes only, not to attempt to breach it or scrape its data using automated methods, and not to abuse the free report system via multiple accounts.",
        },
        {
          icon: CreditCard,
          title: "Subscriptions and Payments",
          body: "The Free plan allows one report. Paid plans (Single Report, Monthly Subscription, Business Plan) provide higher limits and additional features. Prices may change with prior notice. Paid amounts are non-refundable except in proven technical failure cases.",
        },
        {
          icon: Ban,
          title: "Account Termination",
          body: "We reserve the right to suspend or terminate any account that violates these terms without prior notice. Users may delete their own account at any time from the Account page.",
        },
        {
          icon: RefreshCw,
          title: "Changes to Terms",
          body: "We may update these terms from time to time. Users will be notified of material changes via email or in-platform notice. Continued use after an update constitutes implicit acceptance of the new terms.",
        },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageSeo
        path="/terms"
        en={{
          title: "Terms & Conditions | SolarMatch",
          description: "Review the SolarMatch Terms & Conditions covering use of our AI solar calculator and feasibility reports for homes, farms, and businesses in Egypt.",
        }}
        ar={{
          title: "الشروط والأحكام | SolarMatch",
          description: "راجع شروط وأحكام استخدام منصة SolarMatch وحاسبة الطاقة الشمسية وتقارير دراسة الجدوى للمنازل والمزارع والشركات في مصر.",
        }}
        breadcrumbs={[{ name: "Terms", nameAr: "الشروط", path: "/terms" }]}
      />
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
            </h1>
            <p className="text-muted-foreground">{lastUpdated}</p>
          </div>

          <div className="mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              {isAr
                ? "باستخدامك لمنصة سولار ماتش فإنك توافق على الشروط التالية. يرجى قراءتها بعناية قبل الاعتماد على نتائج التقارير."
                : "By using the SolarMatch platform you agree to the following terms. Please read them carefully before relying on report results."}
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((s, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Terms;
