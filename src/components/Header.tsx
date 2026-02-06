import { Sun, Menu, Settings, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
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

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, admin, signOut: adminSignOut } = useAdminAuth();
  const { user, signOut: userSignOut, profile } = useUserAuth();

  const navLinks = [
    { path: "/how-it-works", label: t('header.howItWorks') },
    { path: "/about", label: t('header.about') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 print:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-solar flex items-center justify-center shadow-glow">
            <Sun className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">{t('header.title')}</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">{t('header.subtitle')}</p>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* User Menu */}
          {(user || admin) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="max-w-24 truncate">
                    {profile?.name || admin?.email?.split('@')[0] || t('header.account')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
            <Link
              to="/"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('header.getStarted')}
            </Link>
          )}
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
                
                {/* Admin Dashboard Link - Mobile */}
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
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('header.getStarted')}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
