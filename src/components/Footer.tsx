import { Sun, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 bg-muted/30 print:hidden">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-solar flex items-center justify-center">
              <Sun className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">{t('header.title')}</p>
              <p className="text-xs text-muted-foreground">Student Innovation Project 2025</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center md:justify-end gap-1">
              {t('footer.madeWith')} <Heart className="w-4 h-4 text-destructive fill-destructive" /> {t('footer.forEgypt')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('footer.dataSource')}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2025 SolarMatch. Built for the Innovation Competition.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
