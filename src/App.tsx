import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/contexts/UserContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import WhySolarMatch from "./pages/WhySolarMatch";
import Features from "./pages/Features";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Unsubscribe from "./pages/Unsubscribe";
import SeoTopicPage from "./pages/SeoTopicPage";
import FinancingCalculator from "./pages/FinancingCalculator";
import { SEO_SLUGS } from "./components/seo/seoContent";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import VisitTracker from "./components/VisitTracker";
import {
  GovernorateRoute, PropertyTypeRoute, BillRoute,
  ComparisonRoute, GuideRoute, FinancingRoute, RoiRoute,
} from "./pages/ProgrammaticSeoRoutes";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import { initAnalytics } from "./lib/analytics";

import "./i18n"; // Initialize i18n

initAnalytics();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <UserAuthProvider>
        <UserProvider>
          <AdminAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <VisitTracker />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/ar" element={<Index />} />
                  {/* Legacy "how-it-works" replaced by interactive onboarding tour — redirect to home */}
                  <Route path="/how-it-works" element={<Navigate to="/" replace />} />
                  <Route path="/ar/how-it-works" element={<Navigate to="/ar" replace />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/ar/about" element={<About />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/ar/features" element={<Features />} />
                  <Route path="/pricing" element={<Navigate to="/" replace />} />
                  <Route path="/ar/pricing" element={<Navigate to="/ar" replace />} />
                  <Route path="/why-solarmatch" element={<WhySolarMatch />} />
                  <Route path="/ar/why-solarmatch" element={<WhySolarMatch />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/ar/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/ar/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/financing" element={<FinancingCalculator />} />
                  <Route path="/ar/financing" element={<FinancingCalculator />} />
                  <Route path="/ar/contact" element={<Contact />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />

                  {/* SEO landing pages — EN + AR (skip slugs that have dedicated pages) */}
                  {SEO_SLUGS.filter((s) => s !== "features" && s !== "pricing-plans").map((slug) => (
                    <Route
                      key={`en-${slug}`}
                      path={`/${slug}`}
                      element={<SeoTopicPage lang="en" slug={slug} />}
                    />
                  ))}
                  {SEO_SLUGS.filter((s) => s !== "features" && s !== "pricing-plans").map((slug) => (
                    <Route
                      key={`ar-${slug}`}
                      path={`/ar/${slug}`}
                      element={<SeoTopicPage lang="ar" slug={slug} />}
                    />
                  ))}
                  {/* Programmatic SEO routes — EN + AR */}
                  <Route path="/solar/:slug" element={<GovernorateRoute lang="en" />} />
                  <Route path="/ar/solar/:slug" element={<GovernorateRoute lang="ar" />} />
                  <Route path="/solar-for/:slug" element={<PropertyTypeRoute lang="en" />} />
                  <Route path="/ar/solar-for/:slug" element={<PropertyTypeRoute lang="ar" />} />
                  <Route path="/solar-bill/:slug" element={<BillRoute lang="en" />} />
                  <Route path="/ar/solar-bill/:slug" element={<BillRoute lang="ar" />} />
                  <Route path="/compare/:slug" element={<ComparisonRoute lang="en" />} />
                  <Route path="/ar/compare/:slug" element={<ComparisonRoute lang="ar" />} />
                  <Route path="/guides/:slug" element={<GuideRoute lang="en" />} />
                  <Route path="/ar/guides/:slug" element={<GuideRoute lang="ar" />} />
                  <Route path="/financing/:slug" element={<FinancingRoute lang="en" />} />
                  <Route path="/ar/financing/:slug" element={<FinancingRoute lang="ar" />} />
                  <Route path="/solar-roi/:slug" element={<RoiRoute lang="en" />} />
                  <Route path="/ar/solar-roi/:slug" element={<RoiRoute lang="ar" />} />

                  {/* Legacy SEO pricing slug also redirects to features */}
                  <Route path="/pricing-plans" element={<Navigate to="/" replace />} />
                  <Route path="/ar/pricing-plans" element={<Navigate to="/ar" replace />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="feedback" element={<AdminFeedback />} />
                    <Route path="visitors" element={<AdminVisitors />} />
                  </Route>

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AdminAuthProvider>
        </UserProvider>
      </UserAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
