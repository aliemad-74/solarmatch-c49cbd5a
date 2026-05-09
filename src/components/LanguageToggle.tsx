import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setLanguage } from "@/i18n";
import { BLOG_POSTS } from "@/seo/data/blog";

/**
 * Maps the current pathname to its mirror in the target language.
 * Blog posts use distinct EN/AR slugs, so we resolve the post and swap.
 */
const mirrorPath = (pathname: string, target: "en" | "ar"): string => {
  // Blog index
  if (pathname === "/blog" || pathname === "/blog/" || pathname === "/ar/blog" || pathname === "/ar/blog/") {
    return target === "ar" ? "/ar/blog" : "/blog";
  }

  // Blog post (EN → AR or AR → EN)
  if (pathname.startsWith("/blog/")) {
    const slug = decodeURIComponent(pathname.slice("/blog/".length));
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (post) {
      return target === "ar" ? `/ar/blog/${encodeURIComponent(post.arSlug)}` : `/blog/${post.slug}`;
    }
  }
  if (pathname.startsWith("/ar/blog/")) {
    const slug = decodeURIComponent(pathname.slice("/ar/blog/".length));
    const post = BLOG_POSTS.find((p) => p.arSlug === slug);
    if (post) {
      return target === "ar" ? `/ar/blog/${encodeURIComponent(post.arSlug)}` : `/blog/${post.slug}`;
    }
  }

  // No mirror — keep same path; rest of the app reacts to i18n.language only.
  return pathname;
};

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const toggleLanguage = () => {
    const newLang: "en" | "ar" = isArabic ? "en" : "ar";
    setLanguage(newLang);

    const next = mirrorPath(location.pathname, newLang);
    if (next !== location.pathname) {
      navigate(next + location.search + location.hash);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Languages className="w-4 h-4" />
      <span className="font-medium">{isArabic ? "EN" : "عربي"}</span>
    </Button>
  );
};

export default LanguageToggle;
