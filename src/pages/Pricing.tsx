import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Building2, FileText, Zap, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { openWhatsAppChat } from '@/lib/externalLinks';

const WHATSAPP_NUMBER = '201111009619';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanData {
  id: string;
  icon: React.ReactNode;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const Pricing = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { type: currentPlan } = useSubscription();

  const handleSubscribe = (planName: string) => {
    const message =
      i18n.language === 'ar'
        ? `مرحباً، أريد الاشتراك في خطة ${planName} على SolarMatch`
        : `Hello, I want to subscribe to the ${planName} plan on SolarMatch`;

    openWhatsAppChat(WHATSAPP_NUMBER, message);
  };

  const plans: PlanData[] = [
    {
      id: 'free',
      icon: <Zap className="w-6 h-6" />,
      name: t('pricing.plans.free.name'),
      price: t('pricing.plans.free.price'),
      period: '',
      description: t('pricing.plans.free.description'),
      features: [
        { text: t('pricing.features.oneReport'), included: true },
        { text: t('pricing.features.basicSuitability'), included: true },
        { text: t('pricing.features.basicCostEstimate'), included: true },
        { text: t('pricing.features.limitedAI'), included: true },
        { text: t('pricing.features.pdfExport'), included: false },
        { text: t('pricing.features.reportHistory'), included: false },
        { text: t('pricing.features.systemComparison'), included: false },
        { text: t('pricing.features.fullAIAdvisor'), included: false },
      ],
      cta: t('pricing.plans.free.cta'),
    },
    {
      id: 'single_report',
      icon: <FileText className="w-6 h-6" />,
      name: t('pricing.plans.single.name'),
      price: '50',
      period: t('pricing.perReport'),
      description: t('pricing.plans.single.description'),
      features: [
        { text: t('pricing.features.oneFullReport'), included: true },
        { text: t('pricing.features.fullAnalysis'), included: true },
        { text: t('pricing.features.fullAIExplanation'), included: true },
        { text: t('pricing.features.pdfExport'), included: true },
        { text: t('pricing.features.reportSharing'), included: true },
        { text: t('pricing.features.systemComparison'), included: true },
        { text: t('pricing.features.reportHistory'), included: true },
        { text: t('pricing.features.fullAIAdvisor'), included: false },
      ],
      cta: t('pricing.plans.single.cta'),
    },
    {
      id: 'premium',
      icon: <Crown className="w-6 h-6" />,
      name: t('pricing.plans.premium.name'),
      price: '300',
      period: t('pricing.perMonth'),
      description: t('pricing.plans.premium.description'),
      highlighted: true,
      badge: t('pricing.popular'),
      features: [
        { text: t('pricing.features.twentyReports'), included: true },
        { text: t('pricing.features.fullAIAdvisor'), included: true },
        { text: t('pricing.features.pdfExport'), included: true },
        { text: t('pricing.features.reportHistory'), included: true },
        { text: t('pricing.features.packageComparison'), included: true },
        { text: t('pricing.features.sensitivityScenarios'), included: true },
        { text: t('pricing.features.confidenceScore'), included: true },
        { text: t('pricing.features.aiVerification'), included: true },
        { text: t('pricing.features.liveTariffs'), included: true },
        { text: t('pricing.features.priorityProcessing'), included: true },
        { text: t('pricing.features.contactExpert'), included: true },
      ],
      cta: t('pricing.plans.premium.cta'),
    },
    {
      id: 'business',
      icon: <Building2 className="w-6 h-6" />,
      name: t('pricing.plans.business.name'),
      price: '1,000',
      period: t('pricing.perMonth'),
      description: t('pricing.plans.business.description'),
      features: [
        { text: t('pricing.features.unlimitedReports'), included: true },
        { text: t('pricing.features.everythingPremium'), included: true },
        { text: t('pricing.features.teamAccess'), included: true },
        { text: t('pricing.features.clientManagement'), included: true },
        { text: t('pricing.features.whiteLabelPdf'), included: true },
        { text: t('pricing.features.csvExport'), included: true },
        { text: t('pricing.features.leadManagement'), included: true },
        { text: t('pricing.features.advancedAnalytics'), included: true },
        { text: t('pricing.features.businessDashboard'), included: true },
        { text: t('pricing.features.prioritySupport'), included: true },
        { text: t('pricing.features.apiAccess'), included: true },
      ],
      cta: t('pricing.plans.business.cta'),
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              {t('pricing.title')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border-2 p-6 transition-all ${
                    plan.highlighted
                      ? 'border-secondary shadow-lg shadow-secondary/10 scale-[1.02]'
                      : 'border-border hover:border-primary/30'
                  } bg-card`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3">
                      {plan.badge}
                    </Badge>
                  )}

                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.highlighted ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">
                          {plan.id !== 'single_report' ? t('pricing.currency') : ''} {plan.period}
                        </span>
                      )}
                      {plan.id === 'single_report' && (
                        <span className="text-sm text-muted-foreground">{t('pricing.currency')}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-solar-green mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.id === 'free' ? (
                    <Button variant="outline" disabled={isCurrent} className="w-full">
                      {isCurrent ? t('pricing.currentPlan') : plan.cta}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className={`w-full gap-2 ${plan.highlighted ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : ''}`}
                      disabled={isCurrent}
                      onClick={() => handleSubscribe(plan.name)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isCurrent ? t('pricing.currentPlan') : plan.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* WhatsApp note */}
          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {t('pricing.whatsappNote')}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
