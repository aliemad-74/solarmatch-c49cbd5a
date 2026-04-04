import { NavLink, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  BarChart3,
  LogOut,
  Sun,
  Menu,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminSidebar = () => {
  const { t, i18n } = useTranslation();
  const { signOut, admin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const isRTL = i18n.language === "ar";

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t("admin.nav.dashboard") },
    { to: "/admin/users", icon: Users, label: t("admin.nav.users") },
    { to: "/admin/reports", icon: FileText, label: t("admin.nav.reports") },
    { to: "/admin/leads", icon: UserCheck, label: t("admin.nav.leads") },
    { to: "/admin/analytics", icon: BarChart3, label: t("admin.nav.analytics") },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sun className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-lg">{t("admin.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Back to site & User info & logout */}
      <div className="p-4 border-t border-border space-y-3">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Home className="h-5 w-5" />
          <span>{t("admin.backToSite")}</span>
        </Link>
        <div className="text-sm pt-2">
          <p className="font-medium truncate">{admin?.email}</p>
          <p className="text-xs text-muted-foreground">{t("admin.role")}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            signOut();
            setOpen(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-primary" />
            <span className="font-bold">{t("admin.title")}</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-14" /> {/* Spacer for fixed header */}
      </>
    );
  }

  return (
    <aside
      className={cn(
        "fixed top-0 bottom-0 w-64 bg-card border-border z-40",
        isRTL ? "right-0 border-l" : "left-0 border-r"
      )}
    >
      <SidebarContent />
    </aside>
  );
};

export default AdminSidebar;
