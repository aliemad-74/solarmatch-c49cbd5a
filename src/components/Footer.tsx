import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SolarMatchLogo from "./SolarMatchLogo";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-[hsl(157_53%_18%)] text-white print:hidden pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <SolarMatchLogo variant="full" size={64} />

          <div className="text-center md:text-right">
            <p className="text-sm text-white/80 mb-1 flex items-center justify-center md:justify-end gap-1">
              {t('footer.madeWith')} <Heart className="w-3.5 h-3.5 text-[hsl(39_66%_55%)] fill-[hsl(39_66%_55%)]" /> {t('footer.forEgypt')}
            </p>
            <p className="text-xs text-white/60">
              {t('footer.dataSource')}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/15">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>© 2025 SolarMatch. Built for the Innovation Competition.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy', 'Privacy')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms', 'Terms')}</Link>
              <Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact', 'Contact')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
