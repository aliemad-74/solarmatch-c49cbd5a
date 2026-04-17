import { Home, MapPin, BarChart3, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import AuthModal from "./AuthModal";

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useUserAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navItems = [
    {
      key: "home",
      path: "/",
      label: t("mobileNav.home"),
      icon: Home,
      onClick: () => {
        if (location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      key: "map",
      path: "/#map",
      label: t("mobileNav.map"),
      icon: MapPin,
      onClick: (e: React.MouseEvent) => {
        const mapSection = document.querySelector('[id^="map"]');
        if (mapSection) {
          e.preventDefault();
          mapSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      key: "results",
      path: "/#results",
      label: t("mobileNav.results"),
      icon: BarChart3,
      onClick: (e: React.MouseEvent) => {
        const resultsSection = document.getElementById("results");
        if (resultsSection) {
          e.preventDefault();
          resultsSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg print:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path.startsWith("/#") && location.pathname === "/");

            return (
              <Link
                key={item.key}
                to={item.path.startsWith("/#") ? "/" : item.path}
                onClick={item.onClick as any}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Account / Login */}
          {user ? (
            <Link
              to="/account"
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                location.pathname === "/account"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{t("mobileNav.account")}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{t("mobileNav.login")}</span>
            </button>
          )}
        </div>
      </nav>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default MobileBottomNav;
