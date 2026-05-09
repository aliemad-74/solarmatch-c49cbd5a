import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, MessageCircle, ShieldCheck, Zap, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoHead, orgSchema, faqSchema, articleSchema, breadcrumbSchema, websiteSchema } from "./SeoHead";
import SeoLeadDialog from "./SeoLeadDialog";

export interface SeoSection {
  heading: string;
  body: ReactNode;
}

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoRelated {
  label: string;
  to: string;
}

export interface SeoPageProps {
  lang: "en" | "ar";
  path: string;
  altPath: string;
  title: string;
  description: string;
  h1: string;
  intro: ReactNode;
  sections: SeoSection[];
  faqs?: SeoFaq[];
  related?: SeoRelated[];
  ctaLabel: string;
  ctaTo?: string;
  keywords?: string;
}

export const SeoPage = ({
  lang,
  path,
  altPath,
  title,
  description,
  h1,
  intro,
  sections,
  faqs,
  related,
  ctaLabel,
  ctaTo = "/",
  keywords,
}: SeoPageProps) => {
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // Derive breadcrumb hub label from path: /solar/* → governorates, /solar-for/* → property types, etc.
  const homeHref = isAr ? "/ar" : "/";
  const seg = path.replace(/^\/ar/, "").split("/").filter(Boolean)[0] || "";
  const hubMap: Record<string, { en: string; ar: string; href: string; arHref: string }> = {
    "solar": { en: "Solar by Region", ar: "الطاقة الشمسية حسب المحافظة", href: "/blog", arHref: "/ar/blog" },
    "solar-for": { en: "Solar by Property", ar: "الطاقة الشمسية حسب نوع العقار", href: "/blog", arHref: "/ar/blog" },
    "solar-bill": { en: "Solar by Bill Size", ar: "الطاقة الشمسية حسب الفاتورة", href: "/blog", arHref: "/ar/blog" },
    "compare": { en: "Comparisons", ar: "المقارنات", href: "/blog", arHref: "/ar/blog" },
    "guides": { en: "Guides", ar: "الأدلة الإرشادية", href: "/blog", arHref: "/ar/blog" },
    "financing": { en: "Financing", ar: "التمويل", href: "/blog", arHref: "/ar/blog" },
    "solar-roi": { en: "ROI", ar: "العائد", href: "/blog", arHref: "/ar/blog" },
    "blog": { en: "Blog", ar: "المدونة", href: "/blog", arHref: "/ar/blog" },
  };
  const hub = hubMap[seg];
  const crumbs = [
    { name: isAr ? "الرئيسية" : "Home", path: homeHref },
    ...(hub ? [{ name: isAr ? hub.ar : hub.en, path: isAr ? hub.arHref : hub.href }] : []),
    { name: h1, path },
  ];

  const schemas: Record<string, unknown>[] = [
    orgSchema,
    websiteSchema,
    articleSchema(title, description, path),
    breadcrumbSchema(crumbs),
  ];
  if (faqs && faqs.length) schemas.push(faqSchema(faqs));

  const relatedTitle = isAr ? "مواضيع ذات صلة" : "Related topics";
  const faqTitle = isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions";
  const ctaSub = isAr
    ? "احصل على دراسة جدوى الطاقة الشمسية لعقارك مجاناً خلال دقائق."
    : "Get a free SolarMatch feasibility study for your property in minutes.";

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SeoHead
        title={title}
        description={description}
        path={path}
        altPath={altPath}
        lang={lang}
        type="article"
        schema={schemas}
        keywords={keywords}
      />
      <Header />

      <main className="pt-32 pb-24 md:pb-12">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs md:text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i < crumbs.length - 1 ? (
                    <Link to={c.path} className="hover:text-primary transition-colors">{c.name}</Link>
                  ) : (
                    <span className="text-foreground/70 line-clamp-1">{c.name}</span>
                  )}
                  {i < crumbs.length - 1 && <span className="opacity-50">{isAr ? "›" : "›"}</span>}
                </li>
              ))}
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              {h1}
            </h1>
            <div className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {intro}
            </div>
          </header>

          {/* Trust strip */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            {[
              { icon: ShieldCheck, label: isAr ? "بيانات NASA + Google" : "NASA + Google data" },
              { icon: Zap, label: isAr ? "تحليل خلال دقيقتين" : "2-min analysis" },
              { icon: Users, label: isAr ? "آلاف الملاك في مصر" : "Thousands of owners" },
            ].map((it, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs md:text-sm">
                <it.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/80">{it.label}</span>
              </div>
            ))}
          </div>

          {/* Primary CTA card */}
          <Card className="mb-12 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm md:text-base text-foreground/90">{ctaSub}</p>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button asChild size="lg">
                  <Link to={ctaTo}>
                    {ctaLabel} <Arrow className="w-4 h-4 ms-2" />
                  </Link>
                </Button>
                <SeoLeadDialog
                  lang={lang}
                  topic={title}
                  trigger={
                    <Button size="lg" variant="outline">
                      <MessageCircle className="w-4 h-4 me-2" />
                      {isAr ? "تحدث مع خبير" : "Talk to expert"}
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
                  {s.heading}
                </h2>
                <div className="text-foreground/85 leading-relaxed space-y-3">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          {/* FAQs */}
          {faqs && faqs.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-5">
                {faqTitle}
              </h2>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {f.a}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Related */}
          {related && related.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                {relatedTitle}
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((r, i) => (
                  <Link
                    key={i}
                    to={r.to}
                    className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-full border border-border bg-card hover:bg-muted hover:text-info transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Footer CTA */}
          <Card className="mt-14 bg-primary text-primary-foreground border-0">
            <CardContent className="p-8 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                {isAr ? "ابدأ تحليل سطحك الآن" : "Start your free solar analysis"}
              </h2>
              <p className="opacity-90 mb-6 max-w-xl mx-auto">{ctaSub}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to={ctaTo}>
                    {ctaLabel} <Arrow className="w-4 h-4 ms-2" />
                  </Link>
                </Button>
                <SeoLeadDialog
                  lang={lang}
                  topic={title}
                  trigger={
                    <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                      <MessageCircle className="w-4 h-4 me-2" />
                      {isAr ? "تحدث مع خبير" : "Talk to expert"}
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </article>
      </main>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 flex gap-2 shadow-lg">
        <Button asChild className="flex-1" size="sm">
          <Link to={ctaTo}>{ctaLabel}</Link>
        </Button>
        <SeoLeadDialog
          lang={lang}
          topic={title}
          trigger={
            <Button variant="outline" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 me-1" />
              {isAr ? "خبير" : "Expert"}
            </Button>
          }
        />
      </div>

      <Footer />
    </div>
  );
};
