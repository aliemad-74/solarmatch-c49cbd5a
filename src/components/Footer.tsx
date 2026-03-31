import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import SolarMatchLogo from "./SolarMatchLogo";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card print:hidden pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <SolarMatchLogo variant="full" size={28} />

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center md:justify-end gap-1">
              {t('footer.madeWith')} <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" /> {t('footer.forEgypt')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('footer.dataSource')}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2025 SolarMatch. Built for the Innovation Competition.</p>
            <div className="flex items-center gap-6">
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
