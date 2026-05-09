import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeoHead, orgSchema } from "@/components/seo/SeoHead";
import { BLOG_POSTS, BLOG_CLUSTERS, BlogPost } from "@/seo/data/blog";

interface Props { lang: "en" | "ar" }

const BlogIndex = ({ lang }: Props) => {
  const { i18n } = useTranslation();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const path = isAr ? "/ar/blog" : "/blog";
  const altPath = isAr ? "/blog" : "/ar/blog";

  if (i18n.language !== lang) i18n.changeLanguage(lang);

  const title = isAr
    ? "مدونة سولار ماتش: دليل الطاقة الشمسية في مصر"
    : "SolarMatch Blog: The Egyptian Solar Knowledge Hub";
  const description = isAr
    ? "مقالات عميقة عن الطاقة الشمسية في مصر — التعرفة، التقنية، التمويل، الإجراءات، والأسواق المتخصّصة."
    : "Deep-dive articles on solar in Egypt — tariffs, technology, financing, regulation, and vertical markets.";

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: title,
    description,
    url: `https://solarmatch.site${path}`,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: "SolarMatch" },
  };

  const link = (p: BlogPost) =>
    isAr ? `/ar/blog/${encodeURIComponent(p.arSlug)}` : `/blog/${p.slug}`;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SeoHead
        title={title}
        description={description}
        path={path}
        altPath={altPath}
        lang={lang}
        type="website"
        schema={[orgSchema, blogSchema]}
        keywords={isAr ? "مدونة الطاقة الشمسية, دليل الطاقة الشمسية مصر" : "solar Egypt blog, solar guide Egypt, solar knowledge"}
      />
      <Header />

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              {isAr ? "مركز المعرفة" : "Knowledge Hub"}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {isAr ? "كل ما تحتاج معرفته عن الطاقة الشمسية في مصر" : "Everything You Need to Know About Solar in Egypt"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isAr
                ? "أدلّة هندسية ومالية وتنظيمية مكتوبة من خبراء سولار ماتش — محدّثة لسوق 2026."
                : "Engineering, financial, and regulatory deep-dives by SolarMatch experts — updated for the 2026 Egyptian market."}
            </p>
          </header>

          {BLOG_CLUSTERS.map((cluster) => {
            const posts = BLOG_POSTS.filter((p) => p.cluster === cluster.id);
            if (!posts.length) return null;
            return (
              <section key={cluster.id} className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                    {isAr ? cluster.ar : cluster.en}
                  </h2>
                  <Badge variant="outline">{posts.length} {isAr ? "مقال" : "articles"}</Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {posts.map((post) => (
                    <Link key={post.slug} to={link(post)} className="block group">
                      <Card className="h-full border-border hover:border-primary/40 hover:shadow-md transition-all">
                        <CardContent className="p-5 flex flex-col h-full">
                          <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {isAr ? post.titleAr : post.titleEn}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                            {isAr ? post.descriptionAr : post.descriptionEn}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.updatedAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { year: "numeric", month: "short" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readingMinutes} {isAr ? "د" : "min"}
                            </span>
                            <span className="ms-auto inline-flex items-center gap-1 text-primary font-medium">
                              {isAr ? "اقرأ" : "Read"} <Arrow className="w-3 h-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogIndex;
