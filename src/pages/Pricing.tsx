import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Building2, FileText, Zap, Star } from 'lucide-react';
import { PageSeo } from '@/components/seo/PageSeo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { PLANS, PlanId } from '@/lib/plans';
import { useState } from 'react';
import WaitlistModal from '@/components/WaitlistModal';
import ContactExpertDialog from '@/components/ContactExpertDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';

const Pricing = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isRTL = isAr;
  const { planId: currentPlan } = usePlanFeatures();
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState<string>('premium');

  const openWaitlist = (plan: string) => {
    setWaitlistPlan(plan);
    setWaitlistOpen(true);
  };

  const planOrder: PlanId[] = ['free', 'single', 'premium', 'business'];

  const icons: Record<PlanId, React.ReactNode> = {
    free: <Zap className="w-6 h-6" />,
    single: <FileText className="w-6 h-6" />,
    premium: <Crown className="w-6 h-6" />,
    business: <Building2 className="w-6 h-6" />,
  };

  // Feature lists per plan for cards
  const planFeatures: Record<PlanId, { text: string; included: boolean }[]> = {
    free: [
      { text: isAr ? 'تقرير جدوى واحد (مدى الحياة)' : '1 feasibility report (lifetime)', included: true },
      { text: isAr ? 'حكم الجدوى' : 'Feasibility verdict', included: true },
      { text: isAr ? 'تقدير حجم النظام' : 'Basic system size estimate', included: true },
      { text: isAr ? 'تقدير التوفير السنوي' : 'Basic annual savings', included: true },
      { text: isAr ? 'فترة الاسترداد' : 'Basic payback period', included: true },
      { text: isAr ? 'تصدير PDF' : 'PDF export', included: false },
      { text: isAr ? 'شرح AI كامل' : 'Full AI explanation', included: false },
      { text: isAr ? 'سجل التقارير' : 'Report history', included: false },
      { text: isAr ? 'مشاركة التقرير' : 'Report sharing', included: false },
      { text: isAr ? 'مقارنة الباقات' : 'Package comparison', included: false },
    ],
    single: [
      { text: isAr ? 'تحليل فني ومالي كامل' : 'Full technical & financial analysis', included: true },
      { text: isAr ? 'شرح AI كامل بدون حدود' : 'Full AI explanation (unlimited)', included: true },
      { text: isAr ? 'تحقق AI مع درجة الثقة' : 'AI verification + confidence score', included: true },
      { text: isAr ? 'تصدير PDF ثنائي اللغة' : 'Bilingual PDF export', included: true },
      { text: isAr ? 'مشاركة التقرير عبر رابط' : 'Report sharing via link', included: true },
      { text: isAr ? 'مقارنة الباقات الكاملة' : 'Full package comparison', included: true },
      { text: isAr ? 'سيناريوهات الحساسية' : 'Sensitivity scenarios', included: true },
      { text: isAr ? 'رسم بياني ROI (25 سنة)' : 'ROI Timeline chart (25 years)', included: true },
      { text: isAr ? 'تواصل مع خبير' : 'Contact expert', included: true },
      { text: isAr ? 'مستشار AI تفاعلي' : 'AI Advisor chatbot', included: false },
    ],
    premium: [
      { text: isAr ? 'تقارير غير محدودة (استخدام شخصي)' : 'Unlimited reports (personal use)', included: true },
      { text: isAr ? 'كل مزايا التقرير الاحترافي' : 'Everything in Professional Report', included: true },
      { text: isAr ? 'مستشار AI تفاعلي كامل' : 'Full AI Advisor chatbot', included: true },
      { text: isAr ? 'سجل تقارير محفوظ' : 'Report history saved', included: true },
      { text: isAr ? 'مقارنة حتى 5 تقارير' : 'Compare up to 5 reports', included: true },
      { text: isAr ? 'معالجة أولوية' : 'Priority processing', included: true },
      { text: isAr ? 'مواصفات تقنية كاملة' : 'Full technical specs', included: true },
      { text: isAr ? 'وصول الفريق' : 'Team access', included: false },
      { text: isAr ? 'PDF بعلامتك التجارية' : 'White-label PDF', included: false },
      { text: isAr ? 'تصدير CSV' : 'CSV export', included: false },
    ],
    business: [
      { text: isAr ? 'تقارير غير محدودة' : 'Unlimited reports', included: true },
      { text: isAr ? 'كل مزايا الاحترافية' : 'Everything in Premium', included: true },
      { text: isAr ? 'وصول الفريق (حتى 5 أعضاء)' : 'Team access (up to 5 members)', included: true },
      { text: isAr ? 'لوحة إدارة العملاء' : 'Client management dashboard', included: true },
      { text: isAr ? 'PDF بعلامتك التجارية' : 'White-label PDF reports', included: true },
      { text: isAr ? 'تصدير CSV للتقارير والعملاء' : 'CSV export of reports & leads', included: true },
      { text: isAr ? 'إدارة العملاء المحتملين' : 'Lead management panel', included: true },
      { text: isAr ? 'تحليلات متقدمة' : 'Advanced analytics dashboard', included: true },
      { text: isAr ? 'دعم أولوية وonboarding' : 'Priority support + onboarding', included: true },
      { text: isAr ? 'وصول API (قريباً)' : 'API access (coming soon)', included: true },
    ],
  };

  // Full comparison matrix rows
  const matrixRows = [
    { label: isAr ? 'عدد التقارير' : 'Reports', values: [isAr ? '1 (مدى الحياة)' : '1 (lifetime)', '1', isAr ? 'غير محدود' : 'Unlimited', isAr ? 'غير محدود' : 'Unlimited'] },
    { label: isAr ? 'حكم الجدوى' : 'Feasibility Verdict', values: ['✓', '✓', '✓', '✓'] },
    { label: isAr ? 'حجم النظام' : 'System Size Estimate', values: ['✓', '✓', '✓', '✓'] },
    { label: isAr ? 'التوفير السنوي' : 'Annual Savings', values: ['✓', '✓', '✓', '✓'] },
    { label: isAr ? 'فترة الاسترداد' : 'Payback Period', values: ['✓', '✓', '✓', '✓'] },
    { label: isAr ? 'شرح AI كامل' : 'Full AI Explanation', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'تصدير PDF' : 'PDF Export', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'سجل التقارير' : 'Report History', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'مشاركة التقرير' : 'Report Sharing', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'مقارنة الباقات' : 'Package Comparison', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'سيناريوهات الحساسية' : 'Sensitivity Scenarios', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'درجة الثقة' : 'Confidence Score', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'تحقق AI' : 'AI Verification', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'رسم بياني ROI' : 'ROI Timeline Chart', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'أسعار كهرباء محدّثة' : 'Live Electricity Tariffs', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'أسعار السوق المحدّثة' : 'Live Market Prices', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'تواصل مع خبير' : 'Contact Expert', values: ['✗', '✓', '✓', '✓'] },
    { label: isAr ? 'مستشار AI تفاعلي' : 'AI Advisor Chatbot', values: ['✗', '✗', '✓', '✓'] },
    { label: isAr ? 'مقارنة التقارير' : 'Compare Reports', values: ['✗', '✗', '✓', '✓'] },
    { label: isAr ? 'مواصفات تقنية' : 'Technical Specs', values: ['✗', '✗', '✓', '✓'] },
    { label: isAr ? 'وصول الفريق' : 'Team Access', values: ['✗', '✗', '✗', '✓'] },
    { label: isAr ? 'PDF بعلامتك التجارية' : 'White-label PDF', values: ['✗', '✗', '✗', '✓'] },
    { label: isAr ? 'تصدير CSV' : 'CSV Export', values: ['✗', '✗', '✗', '✓'] },
    { label: isAr ? 'إدارة العملاء المحتملين' : 'Lead Management', values: ['✗', '✗', '✗', '✓'] },
    { label: isAr ? 'تحليلات متقدمة' : 'Advanced Analytics', values: ['✗', '✗', '✗', '✓'] },
    { label: isAr ? 'وصول API' : 'API Access', values: ['✗', '✗', '✗', isAr ? 'قريباً' : 'Soon'] },
  ];

  const faqItems = [
    {
      q: isAr ? 'هل يمكنني الترقية في أي وقت؟' : 'Can I upgrade at any time?',
      a: isAr ? 'نعم، يمكنك الترقية أو تغيير خطتك في أي وقت من إعدادات حسابك.' : 'Yes, you can upgrade or change your plan at any time from your Account Settings.',
    },
    {
      q: isAr ? 'هل التقرير الاحترافي ينتهي؟' : 'Does the professional report expire?',
      a: isAr ? 'لا، بمجرد شراء تقرير احترافي يظل محفوظاً في سجل تقاريرك بشكل دائم.' : 'No, once you purchase a professional report it remains permanently saved in your report history.',
    },
    {
      q: isAr ? 'كيف يختلف Business عن Premium؟' : 'How does Business differ from Premium?',
      a: isAr ? 'Premium مصمم للأفراد والمهندسين. Business مصمم للشركات والمقاولين الذين يديرون عملاء متعددين.' : 'Premium is designed for individuals and engineers. Business is designed for companies and contractors managing multiple clients.',
    },
  ];

  const getCTA = (plan: PlanId) => {
    const isCurrent = plan === currentPlan;
    if (isCurrent) return { text: isAr ? 'خطتك الحالية' : 'Current Plan', disabled: true, action: () => {} };

    switch (plan) {
      case 'free':
        return {
          text: isAr ? 'ابدأ مجاناً' : 'Get Started Free',
          disabled: false,
          action: () => { if (!user) navigate('/'); },
        };
      case 'single':
        return {
          text: isAr ? 'اشتري تقريراً — 149 جنيه' : 'Buy Report — 149 EGP',
          disabled: false,
          action: () => openWaitlist('single'),
        };
      case 'premium':
        return {
          text: isAr ? 'اشترك الآن — 599 جنيه/شهر' : 'Subscribe — 599 EGP/mo',
          disabled: false,
          action: () => openWaitlist('premium'),
        };
      case 'business':
        return {
          text: isAr ? 'تواصل معنا' : 'Contact Us',
          disabled: false,
          action: () => openWaitlist('business'),
        };
    }
  };

  const getPriceDisplay = (plan: PlanId) => {
    const p = PLANS[plan];
    if (p.period === 'free') return { price: isAr ? 'مجاناً' : 'Free', suffix: '' };
    if (p.period === 'once') return { price: `${p.price.toLocaleString()}`, suffix: isAr ? 'ج.م / دفعة واحدة' : 'EGP one-time' };
    return { price: `${p.price.toLocaleString()}`, suffix: isAr ? 'ج.م / شهر' : 'EGP / month' };
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageSeo
        path="/pricing"
        en={{
          title: "SolarMatch Pricing | Free Solar Calculator & Premium Plans",
          description: "Compare SolarMatch pricing: free solar feasibility report, single-report purchase, Premium for households, and Business plans for installers and consultants in Egypt.",
          keywords: "SolarMatch pricing, solar calculator Egypt pricing, solar feasibility plans, AI solar calculator subscription",
        }}
        ar={{
          title: "أسعار SolarMatch | حاسبة الطاقة الشمسية مجاناً وخطط بريميوم",
          description: "قارن خطط SolarMatch: تقرير جدوى مجاني، تقرير منفرد، خطة بريميوم للمنازل، وخطة الأعمال للمركبين والشركات في مصر.",
          keywords: "أسعار SolarMatch, اشتراك حاسبة الطاقة الشمسية, خطط دراسة جدوى الطاقة الشمسية",
        }}
        breadcrumbs={[{ name: "Pricing", nameAr: "الأسعار", path: "/pricing" }]}
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              {isAr ? 'اختر الخطة المناسبة لك' : 'Choose the Right Plan for You'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isAr ? 'ابدأ مجاناً. ادفع فقط عندما تحتاج تقريراً كاملاً.' : 'Start free. Pay only when you need a full report.'}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {planOrder.map((id) => {
              const plan = PLANS[id];
              const cta = getCTA(id);
              const { price, suffix } = getPriceDisplay(id);

              return (
                <div
                  key={id}
                  className={`relative flex flex-col rounded-xl border-2 p-6 transition-all ${
                    plan.highlighted
                      ? 'border-secondary shadow-lg shadow-secondary/10 lg:scale-[1.04]'
                      : 'border-border hover:border-primary/30'
                  } bg-card`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3 whitespace-nowrap">
                      {isAr ? plan.badgeAr : plan.badgeEn}
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.highlighted ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      {icons[id]}
                    </div>
                    <h3 className="font-display font-bold text-lg">
                      {isAr ? plan.displayNameAr : plan.displayNameEn}
                    </h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{price}</span>
                      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAr ? plan.descriptionAr : plan.descriptionEn}
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {planFeatures[id].map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        {f.included ? (
                          <Check className="w-4 h-4 text-solar-green mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        )}
                        <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? 'default' : 'outline'}
                    className={`w-full ${plan.highlighted ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : ''}`}
                    disabled={cta.disabled}
                    onClick={cta.action}
                  >
                    {cta.text}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Full Comparison Table */}
          <div className="max-w-7xl mx-auto mb-16">
            <h2 className="text-2xl font-display font-bold text-center mb-6">
              {isAr ? 'مقارنة تفصيلية' : 'Detailed Comparison'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-start p-3 text-sm font-medium text-muted-foreground w-1/3">
                      {isAr ? 'الميزة' : 'Feature'}
                    </th>
                    {planOrder.map((id) => (
                      <th key={id} className={`p-3 text-center text-sm font-bold ${id === 'premium' ? 'text-secondary' : 'text-foreground'}`}>
                        {isAr ? PLANS[id].displayNameAr : PLANS[id].displayNameEn}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm text-foreground">{row.label}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className="p-3 text-center text-sm">
                          {v === '✓' ? (
                            <Check className="w-4 h-4 text-solar-green mx-auto" />
                          ) : v === '✗' ? (
                            <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                          ) : (
                            <span className="font-medium text-foreground">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-center mb-6">
              {isAr ? 'أسئلة شائعة' : 'FAQ'}
            </h2>
            <Accordion type="single" collapsible>
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-start text-sm font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} planInterest={waitlistPlan} />
    </div>
  );
};

export default Pricing;
