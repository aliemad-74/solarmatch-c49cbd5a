import { Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 print:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-solar flex items-center justify-center shadow-glow">
            <Sun className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">{t('header.title')}</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">{t('header.subtitle')}</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {t('header.howItWorks')}
          </span>
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {t('header.about')}
          </span>
          <span className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
            {t('header.getStarted')}
          </span>
          <LanguageToggle />
        </nav>
        {/* Mobile language toggle */}
        <div className="md:hidden">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
