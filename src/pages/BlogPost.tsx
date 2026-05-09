import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, ArrowLeft, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoHead, orgSchema, faqSchema, articleSchema } from "@/components/seo/SeoHead";
import SeoLeadDialog from "@/components/seo/SeoLeadDialog";
import { getBlogPost, BLOG_POSTS } from "@/seo/data/blog";
import NotFound from "./NotFound";

const decode = (s?: string) => (s ? decodeURIComponent(s) : "");

interface Props { lang: "en" | "ar" }

const BlogPostRoute = ({ lang }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPost(decode(slug));
  if (!post) return <NotFound />;

  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const path = isAr ? `/ar/blog/${encodeURIComponent(post.arSlug)}` : `/blog/${post.slug}`;
  const altPath = isAr ? `/blog/${post.slug}` : `/ar/blog/${encodeURIComponent(post.arSlug)}`;

  const title = isAr ? post.titleAr : post.titleEn;
  const description = isAr ? post.descriptionAr : post.descriptionEn;
  const intro = isAr ? post.introAr : post.introEn;

  const faqList = post.faqs.map((f) => ({
    q: isAr ? f.qAr : f.qEn,
    a: isAr ? f.aAr : f.aEn,
  }));

  const schemas: Record<string, unknown>[] = [
    orgSchema,
    articleSchema(title, description, path),
    faqSchema(faqList),
  ];

  // Related: 3 other posts from same cluster, fallback random
  const related = [
    ...BLOG_POSTS.filter((p) => p.cluster === post.cluster && p.slug !== post.slug),
    ...BLOG_POSTS.filter((p) => p.cluster !== post.cluster),
  ].slice(0, 3);

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
        keywords={post.keywords}
      />
      <Header />

      <main className="pt-32 pb-24 md:pb-12">
        <article className="container mx-auto px-4 max-w-3xl">
          <nav className="text-xs text-muted-foreground mb-4">
            <Link to={isAr ? "/ar/blog" : "/blog"} className="hover:text-primary">
              {isAr ? "المدونة" : "Blog"}
            </Link>
            <span className="mx-2">/</span>
            <span>{title}</span>
          </nav>

          <header className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
              {title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.updatedAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingMinutes} {isAr ? "دقائق قراءة" : "min read"}
              </span>
            </div>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed">{intro}</p>
          </header>

          <Card className="mb-10 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <p className="text-sm text-foreground/90 flex-1">
                {isAr ? "احسب جدوى الطاقة الشمسية لعقارك مجاناً." : "Get a free solar feasibility for your property."}
              </p>
              <Button asChild size="sm">
                <Link to={isAr ? "/ar" : "/"}>
                  {isAr ? "ابدأ الآن" : "Start now"} <Arrow className="w-3.5 h-3.5 ms-2" />
                </Link>
              </Button>
              <SeoLeadDialog
                lang={lang}
                topic={title}
                trigger={
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-3.5 h-3.5 me-1" />
                    {isAr ? "خبير" : "Expert"}
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <div className="space-y-9 prose-like">
            {post.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                  {isAr ? s.headingAr : s.headingEn}
                </h2>
                <p className="text-foreground/85 leading-relaxed whitespace-pre-line">
                  {isAr ? s.bodyAr : s.bodyEn}
                </p>
              </section>
            ))}
          </div>

          {faqList.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-5">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
              <div className="space-y-3">
                {faqList.map((f, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{f.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                {isAr ? "اقرأ أيضاً" : "Read next"}
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    to={isAr ? `/ar/blog/${encodeURIComponent(p.arSlug)}` : `/blog/${p.slug}`}
                    className="block"
                  >
                    <Card className="h-full border-border hover:border-primary/40 transition-colors">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">
                          {isAr ? p.titleAr : p.titleEn}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {isAr ? p.descriptionAr : p.descriptionEn}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Card className="mt-12 bg-primary text-primary-foreground border-0">
            <CardContent className="p-7 text-center">
              <h2 className="font-display text-2xl font-bold mb-3">
                {isAr ? "جاهز تعرف لو الطاقة الشمسية تناسبك؟" : "Ready to see if solar fits your property?"}
              </h2>
              <p className="opacity-90 mb-5 max-w-xl mx-auto text-sm">
                {isAr
                  ? "دراسة جدوى مجانية خلال دقيقتين — بدون التزامات."
                  : "Free feasibility study in under 2 minutes — no commitments."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to={isAr ? "/ar" : "/"}>
                    {isAr ? "احسب جدواي الآن" : "Calculate my feasibility"} <Arrow className="w-4 h-4 ms-2" />
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
          <Link to={isAr ? "/ar" : "/"}>{isAr ? "احسب جدواي" : "Calculate"}</Link>
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

export default BlogPostRoute;
