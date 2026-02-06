import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Sun } from "lucide-react";

const NotFound = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl gradient-solar flex items-center justify-center shadow-glow">
          <Sun className="w-10 h-10 text-primary-foreground" />
        </div>

        {/* 404 Number */}
        <h1 className="text-8xl font-bold text-primary/20 mb-2">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">{t("notFound.title")}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8">{t("notFound.description")}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 me-2" />
              {t("notFound.backToHome")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/how-it-works">
              <Search className="w-4 h-4 me-2" />
              {t("notFound.howItWorks")}
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">{t("notFound.helpfulLinks")}</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/" className="text-primary hover:underline">{t("header.title")}</Link>
            <Link to="/how-it-works" className="text-primary hover:underline">{t("header.howItWorks")}</Link>
            <Link to="/about" className="text-primary hover:underline">{t("header.about")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
