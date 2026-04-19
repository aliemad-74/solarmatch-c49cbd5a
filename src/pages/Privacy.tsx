import { useTranslation } from "react-i18next";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Shield, Lock, Eye, Database, Mail, UserCheck } from "lucide-react";

const Privacy = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const lastUpdated = isAr ? "آخر تحديث: 17 أبريل 2026" : "Last updated: April 17, 2026";

  const sections = isAr
    ? [
        {
          icon: Database,
          title: "البيانات التي نجمعها",
          body: "نجمع البيانات التي تقدمها طوعاً مثل الاسم، البريد الإلكتروني، رقم الهاتف، الموقع الجغرافي للعقار، الاستهلاك الشهري للكهرباء، ومساحة السطح. كما نسجل بيانات تقنية مثل عنوان IP ونوع المتصفح لأغراض الأمان وتحسين الخدمة.",
        },
        {
          icon: Eye,
          title: "كيف نستخدم بياناتك",
          body: "نستخدم بياناتك لتقديم تقارير الجدوى الشمسية، حساب التوفير المتوقع، تحسين دقة التوصيات، التواصل معك بخصوص تقاريرك، وتطوير منصة سولار ماتش. لا نستخدم بياناتك لأغراض إعلانية خارجية.",
        },
        {
          icon: Lock,
          title: "حماية البيانات",
          body: "نطبق معايير حماية صارمة تشمل التشفير أثناء النقل (HTTPS)، سياسات أمان الصفوف (RLS) على قاعدة البيانات، وتقييد الوصول للبيانات الحساسة على الموظفين المخولين فقط. كل عمليات تسجيل الدخول مؤمنة عبر Supabase Auth.",
        },
        {
          icon: UserCheck,
          title: "حقوقك",
          body: "لك الحق في الوصول إلى بياناتك، تعديلها، أو حذف حسابك بالكامل في أي وقت من صفحة الحساب. يمكنك أيضاً طلب تصدير بياناتك أو سحب موافقتك على معالجتها بمراسلتنا.",
        },
        {
          icon: Database,
          title: "مشاركة البيانات",
          body: "لا نبيع بياناتك لأي طرف ثالث. نشاركها فقط مع مزودي الخدمات التقنية الموثوقين (مثل Supabase وGoogle Maps) بالحد الأدنى اللازم لتشغيل المنصة، وفي حالة تواصلك مع شركات تركيب نشارك بياناتك معهم بموافقتك الصريحة فقط.",
        },
        {
          icon: Shield,
          title: "استخدام البيانات لأغراض التسويق",
          body: "بموافقتك على شروط الاستخدام، قد تشارك SolarMatch بيانات تقييمك (الموقع الجغرافي، نوع المبنى، حجم النظام المقترح) مع شركاء التركيب المعتمدين بهدف تزويدك بعروض تركيب مناسبة.\n\nلن تُشارَك بياناتك الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف) مع أي طرف خارج شبكة الشركاء المعتمدين لدى SolarMatch.\n\nيمكنك إلغاء هذه الموافقة في أي وقت من خلال إعدادات حسابك، وسيتوقف مشاركة بياناتك فوراً.",
        },
        {
          icon: Mail,
          title: "تواصل معنا",
          body: "لأي استفسار بخصوص الخصوصية أو لممارسة حقوقك، راسلنا على privacy@solarmatch.app أو عبر واتساب على +20 111 100 9619.",
        },
      ]
    : [
        {
          icon: Database,
          title: "Data We Collect",
          body: "We collect data you voluntarily provide such as name, email, phone number, property location, monthly electricity consumption, and rooftop area. We also log technical data like IP address and browser type for security and service improvement.",
        },
        {
          icon: Eye,
          title: "How We Use Your Data",
          body: "Your data is used to generate solar feasibility reports, calculate expected savings, improve recommendation accuracy, contact you about your reports, and develop the SolarMatch platform. We never use your data for external advertising.",
        },
        {
          icon: Lock,
          title: "Data Protection",
          body: "We enforce strict protection standards including in-transit encryption (HTTPS), Row-Level Security (RLS) on the database, and restricted access to sensitive data for authorized staff only. All authentication is secured via Supabase Auth.",
        },
        {
          icon: UserCheck,
          title: "Your Rights",
          body: "You have the right to access, modify, or fully delete your account at any time from the Account page. You can also request a data export or withdraw consent to processing by contacting us.",
        },
        {
          icon: Database,
          title: "Data Sharing",
          body: "We do not sell your data to any third party. We only share it with trusted service providers (such as Supabase and Google Maps) at the minimum required to operate the platform. If you contact installer companies, we share your data with them only with your explicit consent.",
        },
        {
          icon: Shield,
          title: "Use of Data for Marketing Purposes",
          body: "By agreeing to our Terms of Use, SolarMatch may share your assessment data (location, building type, recommended system size) with our verified installer partners to provide you with relevant installation offers.\n\nYour personal data (name, email, phone number) will never be shared with any party outside SolarMatch's approved installer network.\n\nYou may withdraw this consent at any time from your Account Settings. Data sharing will stop immediately upon withdrawal.",
        },
        {
          icon: Mail,
          title: "Contact Us",
          body: "For any privacy inquiry or to exercise your rights, email us at privacy@solarmatch.app or WhatsApp +20 111 100 9619.",
        },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageSeo
        path="/privacy"
        en={{
          title: "Privacy Policy | SolarMatch",
          description: "Read the SolarMatch Privacy Policy: what data we collect, how we use it, and how we protect your information when you use our AI solar feasibility platform in Egypt.",
        }}
        ar={{
          title: "سياسة الخصوصية | SolarMatch",
          description: "اطّلع على سياسة الخصوصية الخاصة بمنصة SolarMatch: البيانات التي نجمعها، طريقة استخدامها، وكيفية حماية معلوماتك عند استخدام حاسبة الطاقة الشمسية.",
        }}
        breadcrumbs={[{ name: "Privacy", nameAr: "الخصوصية", path: "/privacy" }]}
      />
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>
            <p className="text-muted-foreground">{lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none mb-10">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              {isAr
                ? "خصوصيتك أولوية لدينا. توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها داخل منصة سولار ماتش."
                : "Your privacy matters. This policy explains how we collect, use, and protect your data on the SolarMatch platform."}
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
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
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

export default Privacy;
