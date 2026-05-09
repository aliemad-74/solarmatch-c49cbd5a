import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setLanguage } from "@/i18n";

/**
 * Maps the current pathname to its mirror in the target language.
 * Currently the blog is the only section with hard-coded /ar mirrors,
 * but this helper is centralized so future mirrored routes can be added here.
 */
const mirrorPath = (pathname: string, target: "en" | "ar"): string => {
  // Blog index
  if (pathname === "/blog" || pathname === "/blog/") {
    return target === "ar" ? "/ar/blog" : "/blog";
  }
  if (pathname === "/ar/blog" || pathname === "/ar/blog/") {
    return target === "ar" ? "/ar/blog" : "/blog";
  }

  // Blog post
  if (pathname.startsWith("/blog/")) {
    const slug = pathname.slice("/blog/".length);
    return target === "ar" ? `/ar/blog/${slug}` : `/blog/${slug}`;
  }
  if (pathname.startsWith("/ar/blog/")) {
    const slug = pathname.slice("/ar/blog/".length);
    return target === "ar" ? `/ar/blog/${slug}` : `/blog/${slug}`;
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
