import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Users, 
  Lightbulb,
  GraduationCap,
  Globe,
  ArrowRight,
  Heart
} from "lucide-react";
import SolarMatchLogo from "@/components/SolarMatchLogo";

const About = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const values = [
    {
      icon: Target,
      title: t('about.values.accuracy.title'),
      description: t('about.values.accuracy.description'),
    },
    {
      icon: Users,
      title: t('about.values.accessibility.title'),
      description: t('about.values.accessibility.description'),
    },
    {
      icon: Globe,
      title: t('about.values.localization.title'),
      description: t('about.values.localization.description'),
    },
    {
      icon: Lightbulb,
      title: t('about.values.education.title'),
      description: t('about.values.education.description'),
    },
  ];

  const features = [
    t('about.features.realtime'),
    t('about.features.tariffs'),
    t('about.features.roi'),
    t('about.features.ai'),
    t('about.features.bilingual'),
    t('about.features.reports'),
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageSeo
        path="/about"
        en={{
          title: "About SolarMatch | AI Solar Feasibility, Egypt",
          description: "SolarMatch is Egypt's AI solar feasibility platform — accurate ROI, savings, and payback estimates for homes, farms, and businesses.",
          keywords: "About SolarMatch, Solar Match Egypt, AI solar calculator, solar feasibility platform Egypt",
        }}
        ar={{
          title: "عن SolarMatch | جدوى الطاقة الشمسية في مصر",
          description: "SolarMatch منصة ذكية لدراسة جدوى الطاقة الشمسية في مصر للمنازل والمزارع والشركات: التكلفة، التوفير، والعائد على الاستثمار.",
          keywords: "عن SolarMatch, منصة الطاقة الشمسية, دراسة جدوى الطاقة الشمسية في مصر, الطاقة الشمسية في مصر",
        }}
        breadcrumbs={[{ name: "About", nameAr: "من نحن", path: "/about" }]}
        type="article"
      />
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <SolarMatchLogo variant="icon" size={56} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('about.hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('about.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('about.mission.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground leading-relaxed">
                {t('about.mission.description')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Project Background */}
        <section className="bg-muted/30 py-16 mb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  {t('about.background.title')}
                </h2>
              </div>
              
              <div className="space-y-4 text-muted-foreground">
               <p>{t('about.background.p1')}</p>
               <p>{t('about.background.p2')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            {t('about.valuesTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <div key={index} className="flex gap-4 p-6 bg-card rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">{t('about.featuresTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Impact Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold">{t('about.impact.title')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.impact.description')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              {t('about.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('about.cta.description')}
            </p>
            <Link to="/">
              <Button size="lg" className="gradient-solar shadow-glow">
                {t('about.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default About;
