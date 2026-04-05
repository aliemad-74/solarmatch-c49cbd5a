import { Menu, Settings, LogOut, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import SolarMatchLogo from "./SolarMatchLogo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import AuthModal from "./AuthModal";

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAdmin, admin, signOut: adminSignOut } = useAdminAuth();
  const { user, signOut: userSignOut, profile } = useUserAuth();

  const navLinks = [
    { path: "/", label: t('header.home') },
    { path: "/why-solarmatch", label: t('header.whySolarMatch') },
    { path: "/how-it-works", label: t('header.howItWorks') },
    { path: "/pricing", label: t('header.pricing') },
    { path: "/about", label: t('header.about') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border print:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <SolarMatchLogo variant="full" size={92} />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm px-3 py-2 rounded-md transition-colors ${
                isActive(link.path)
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-px h-5 bg-border mx-2" />
          
          {(user || admin) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="max-w-24 truncate text-sm">
                    {profile?.name || admin?.email?.split('@')[0] || t('header.account')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('header.myAccount')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {t('header.adminDashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => {
                    if (admin) adminSignOut();
                    if (user) userSignOut();
                  }}
                  className="text-destructive flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('header.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t('header.login')}
            </Button>
          )}
          <ThemeToggle />
          <LanguageToggle />
        </nav>
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg transition-colors ${
                      isActive(link.path)
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {user && (
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    {t('header.myAccount')}
                  </Link>
                )}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    {t('header.adminDashboard')}
                  </Link>
                )}
                
                {(user || admin) ? (
                  <Button 
                    variant="ghost" 
                    className="justify-start text-lg text-destructive p-0 h-auto"
                    onClick={() => {
                      if (admin) adminSignOut();
                      if (user) userSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5 me-2" />
                    {t('header.signOut')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="gap-2 justify-start"
                  >
                    <LogIn className="w-5 h-5" />
                    {t('header.login')}
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <AuthModal
      open={showAuthModal}
      onOpenChange={setShowAuthModal}
      onSuccess={() => {}}
    />
    </>
  );
};

export default Header;
