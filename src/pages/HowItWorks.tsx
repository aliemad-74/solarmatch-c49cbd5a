import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Settings, 
  Calculator, 
  FileText, 
  Sun, 
  Zap, 
  TrendingUp,
  ArrowRight,
  Database,
  Leaf
} from "lucide-react";

const HowItWorks = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      icon: MapPin,
      title: t('howItWorks.steps.location.title'),
      description: t('howItWorks.steps.location.description'),
      details: t('howItWorks.steps.location.details'),
    },
    {
      icon: Settings,
      title: t('howItWorks.steps.configure.title'),
      description: t('howItWorks.steps.configure.description'),
      details: t('howItWorks.steps.configure.details'),
    },
    {
      icon: Calculator,
      title: t('howItWorks.steps.calculate.title'),
      description: t('howItWorks.steps.calculate.description'),
      details: t('howItWorks.steps.calculate.details'),
    },
    {
      icon: FileText,
      title: t('howItWorks.steps.results.title'),
      description: t('howItWorks.steps.results.description'),
      details: t('howItWorks.steps.results.details'),
    },
  ];

  const methodology = [
    {
      icon: Sun,
      title: t('howItWorks.methodology.irradiance.title'),
      description: t('howItWorks.methodology.irradiance.description'),
    },
    {
      icon: Zap,
      title: t('howItWorks.methodology.yield.title'),
      description: t('howItWorks.methodology.yield.description'),
    },
    {
      icon: TrendingUp,
      title: t('howItWorks.methodology.roi.title'),
      description: t('howItWorks.methodology.roi.description'),
    },
    {
      icon: Leaf,
      title: t('howItWorks.methodology.carbon.title'),
      description: t('howItWorks.methodology.carbon.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('howItWorks.hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('howItWorks.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            {t('howItWorks.stepsTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 gradient-solar" />
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-xl gradient-solar flex items-center justify-center mb-4 shadow-glow">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-primary">
                      {t('howItWorks.step')} {index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-2">{step.description}</p>
                  <p className="text-xs text-muted-foreground/80">{step.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Methodology Section */}
        <section className="bg-muted/30 py-16 mb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                {t('howItWorks.methodologyTitle')}
              </h2>
              <p className="text-muted-foreground">
                {t('howItWorks.methodologySubtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {methodology.map((item, index) => (
                <div key={index} className="flex gap-4 p-6 bg-background rounded-xl border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>{t('howItWorks.dataSources.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('howItWorks.dataSources.description')}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {t('howItWorks.dataSources.nasa')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {t('howItWorks.dataSources.tariffs')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {t('howItWorks.dataSources.panels')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              {t('howItWorks.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('howItWorks.cta.description')}
            </p>
            <Link to="/">
              <Button size="lg" className="gradient-solar shadow-glow">
                {t('howItWorks.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
