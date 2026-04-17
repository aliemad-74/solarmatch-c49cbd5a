import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoHead, orgSchema, faqSchema, articleSchema } from "./SeoHead";

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

  const schemas: Record<string, unknown>[] = [
    orgSchema,
    articleSchema(title, description, path),
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
          {/* Hero */}
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              {h1}
            </h1>
            <div className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {intro}
            </div>
          </header>

          {/* Primary CTA card */}
          <Card className="mb-12 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm md:text-base text-foreground/90">{ctaSub}</p>
              <Button asChild size="lg" className="shrink-0">
                <Link to={ctaTo}>
                  {ctaLabel} <Arrow className="w-4 h-4 ms-2" />
                </Link>
              </Button>
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
              <Button asChild size="lg" variant="secondary">
                <Link to={ctaTo}>
                  {ctaLabel} <Arrow className="w-4 h-4 ms-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </article>
      </main>

      <Footer />
    </div>
  );
};
