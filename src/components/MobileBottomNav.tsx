import { Home, MapPin, BarChart3, User, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserAuth } from "@/contexts/UserAuthContext";

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useUserAuth();

  const navItems = [
    {
      path: "/",
      label: t("mobileNav.home"),
      icon: Home,
      onClick: () => {
        // Scroll to top when on home
        if (location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      path: "/#map",
      label: t("mobileNav.map"),
      icon: MapPin,
      onClick: () => {
        const mapSection = document.querySelector('[id^="map"]');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      path: "/#results",
      label: t("mobileNav.results"),
      icon: BarChart3,
      onClick: () => {
        const resultsSection = document.getElementById("results");
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      path: user ? "/account" : "/",
      label: user ? t("mobileNav.account") : t("mobileNav.login"),
      icon: User,
    },
  ];

  // Only show on mobile
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg print:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path.startsWith("/#") && location.pathname === "/");
          
          return (
            <Link
              key={item.path}
              to={item.path.startsWith("/#") ? "/" : item.path}
              onClick={item.onClick}
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
      </div>
    </nav>
  );
};

export default MobileBottomNav;
