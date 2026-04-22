import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  MapPin,
  Sun,
  LineChart,
  FileText,
  Languages,
  Building2,
  Tractor,
  Bot,
  ShieldCheck,
  Zap,
  Share2,
  Cloud,
  Calculator,
  Leaf,
  TrendingUp,
} from 'lucide-react';
import { PageSeo } from '@/components/seo/PageSeo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FeatureItem {
  icon: React.ReactNode;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
}

const Features = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isRTL = isAr;

  const features: FeatureItem[] = [
    {
      icon: <Calculator className="w-6 h-6" />,
      titleEn: 'AI Solar Feasibility Calculator',
      titleAr: 'حاسبة جدوى الطاقة الشمسية بالذكاء الاصطناعي',
      descEn: 'Get a complete technical and financial analysis for any property in Egypt in seconds.',
      descAr: 'احصل على تحليل فني ومالي كامل لأي عقار في مصر خلال ثوانٍ.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      titleEn: 'Google Maps Rooftop Drawing',
      titleAr: 'رسم الأسطح على خرائط جوجل',
      descEn: 'Pinpoint your location and trace your roof on satellite imagery for accurate area measurement.',
      descAr: 'حدد موقعك وارسم سطحك على صور الأقمار الصناعية لقياس دقيق للمساحة.',
    },
    {
      icon: <Sun className="w-6 h-6" />,
      titleEn: 'NASA POWER Climate Data',
      titleAr: 'بيانات مناخ ناسا الفورية',
      descEn: 'Real solar irradiance, temperature, and dust loss data tailored to every Egyptian governorate.',
      descAr: 'بيانات حقيقية للإشعاع الشمسي ودرجة الحرارة وفقد الغبار لكل محافظة مصرية.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      titleEn: 'Egypt 2026 Electricity Tariffs',
      titleAr: 'تعريفة الكهرباء المصرية 2026',
      descEn: 'Built-in 7-tier residential, commercial, and industrial tariffs auto-applied to your bill.',
      descAr: 'تعريفات سكنية بـ 7 شرائح وتعريفات تجارية وصناعية يتم تطبيقها تلقائياً على فاتورتك.',
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      titleEn: '25-Year ROI Projections',
      titleAr: 'توقعات العائد لـ 25 سنة',
      descEn: 'Detailed payback period, cumulative savings, and degradation modeling over the full system lifetime.',
      descAr: 'فترة استرداد مفصلة وتوفير تراكمي ونمذجة تدهور الأداء خلال عمر النظام بالكامل.',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      titleEn: 'Interactive Solar AI Chat',
      titleAr: 'مساعد الطاقة الشمسية التفاعلي',
      descEn: 'Ask follow-up questions about your report and get instant expert-level answers in Arabic or English.',
      descAr: 'اسأل أسئلة المتابعة عن تقريرك واحصل على إجابات فورية بمستوى خبير بالعربية أو الإنجليزية.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      titleEn: 'AI Verification Checkpoint',
      titleAr: 'مراجعة الذكاء الاصطناعي',
      descEn: 'Every calculation is reviewed by AI and given a confidence score before you see it.',
      descAr: 'كل عملية حسابية تتم مراجعتها بالذكاء الاصطناعي ومنحها درجة ثقة قبل عرضها عليك.',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      titleEn: 'Bilingual PDF Reports',
      titleAr: 'تقارير PDF ثنائية اللغة',
      descEn: 'Download a professional, branded PDF report in Arabic or English to share with installers.',
      descAr: 'حمّل تقريراً احترافياً بهوية بصرية بالعربية أو الإنجليزية لمشاركته مع شركات التركيب.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      titleEn: 'Shareable Report Links',
      titleAr: 'مشاركة التقارير عبر رابط',
      descEn: 'Generate a unique link that lets anyone view your full analysis without an account.',
      descAr: 'أنشئ رابطاً فريداً يتيح لأي شخص عرض تحليلك الكامل بدون حساب.',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      titleEn: 'Building & Multi-Unit Mode',
      titleAr: 'وضع العمارات والوحدات المتعددة',
      descEn: 'Calculate solar feasibility for apartment buildings with per-unit billing and shared rooftops.',
      descAr: 'احسب جدوى الطاقة الشمسية للعمارات السكنية مع فوترة لكل شقة وسطح مشترك.',
    },
    {
      icon: <Tractor className="w-6 h-6" />,
      titleEn: 'Agricultural Farm Mode',
      titleAr: 'وضع المزارع الزراعية',
      descEn: 'Specialized large-scale calculations in feddans for farms, irrigation, and rural projects.',
      descAr: 'حسابات متخصصة للمزارع بالأفدنة لمشاريع الري والزراعة والمشاريع الريفية.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titleEn: 'System Package Comparison',
      titleAr: 'مقارنة باقات الأنظمة',
      descEn: 'Side-by-side comparison of Economy, Standard, and Premium hardware packages.',
      descAr: 'مقارنة جنباً إلى جنب بين باقات الاقتصادية والقياسية والمميزة.',
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      titleEn: 'Live Market Pricing',
      titleAr: 'أسعار السوق الحية',
      descEn: 'Auto-updated solar component prices scraped from Egyptian suppliers every 24 hours.',
      descAr: 'أسعار مكونات الطاقة الشمسية محدثة تلقائياً من الموردين المصريين كل 24 ساعة.',
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      titleEn: 'Environmental Impact',
      titleAr: 'الأثر البيئي',
      descEn: 'See how many tons of CO₂ your system would offset annually and over its lifetime.',
      descAr: 'شاهد كم طناً من ثاني أكسيد الكربون سيوفره نظامك سنوياً وعلى مدى عمره.',
    },
    {
      icon: <Languages className="w-6 h-6" />,
      titleEn: 'Full Arabic & English Support',
      titleAr: 'دعم كامل للعربية والإنجليزية',
      descEn: 'Complete RTL Arabic interface alongside English — every page, report, and chatbot message.',
      descAr: 'واجهة عربية كاملة من اليمين لليسار بجانب الإنجليزية — كل صفحة وتقرير ورسالة دردشة.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      titleEn: '100% Free for Everyone',
      titleAr: 'مجاني 100% للجميع',
      descEn: 'No subscriptions, no payments, no limits. SolarMatch is fully free for homeowners, farms, and businesses.',
      descAr: 'لا اشتراكات ولا مدفوعات ولا حدود. SolarMatch مجاني بالكامل للمنازل والمزارع والشركات.',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageSeo
        path="/features"
        en={{
          title: 'SolarMatch Features | Free AI Solar Calculator for Egypt',
          description:
            'Explore every feature of SolarMatch — the free AI solar feasibility platform for Egypt. Maps, NASA climate data, ROI, PDF reports, AI chat, and more — all free.',
          keywords:
            'SolarMatch features, AI solar calculator, solar feasibility Egypt, solar ROI calculator, free solar calculator',
        }}
        ar={{
          title: 'مميزات SolarMatch | حاسبة الطاقة الشمسية الذكية المجانية في مصر',
          description:
            'استكشف كل ميزات SolarMatch — منصة دراسة جدوى الطاقة الشمسية المجانية في مصر. خرائط، بيانات مناخ ناسا، عائد استثمار، تقارير PDF، ومساعد ذكاء اصطناعي — كل ذلك مجاناً.',
          keywords:
            'مميزات SolarMatch, حاسبة الطاقة الشمسية, دراسة جدوى الطاقة الشمسية, حساب العائد على الاستثمار, حاسبة الطاقة الشمسية مجاناً',
        }}
        breadcrumbs={[{ name: 'Features', nameAr: 'المميزات', path: '/features' }]}
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'مجاني بالكامل للجميع' : '100% Free for Everyone'}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              {isAr ? 'كل ما تحتاجه لاتخاذ قرار الطاقة الشمسية' : 'Everything You Need to Go Solar'}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {isAr
                ? 'منصة SolarMatch تجمع بين الذكاء الاصطناعي وبيانات ناسا والتعريفة المصرية الرسمية لتمنحك دراسة جدوى احترافية كاملة — بدون رسوم.'
                : 'SolarMatch combines AI, NASA climate data, and Egypt\'s official tariffs to give you a complete professional feasibility study — at no cost.'}
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto mb-16">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-foreground">
                  {isAr ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr ? f.descAr : f.descEn}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              {isAr ? 'ابدأ تقريرك المجاني الآن' : 'Start Your Free Report Now'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isAr
                ? 'لا حاجة لبطاقة ائتمان. لا اشتراكات. كل مميزات المنصة متاحة مجاناً.'
                : 'No credit card required. No subscriptions. Every feature available for free.'}
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                {isAr ? 'احسب جدواي الشمسية' : 'Calculate My Solar Feasibility'}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
