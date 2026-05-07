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
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Unsubscribe from "./pages/Unsubscribe";
import SeoTopicPage from "./pages/SeoTopicPage";
import { SEO_SLUGS } from "./components/seo/seoContent";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

import "./i18n"; // Initialize i18n

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
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/ar" element={<Index />} />
                  {/* Legacy "how-it-works" replaced by interactive onboarding tour — redirect to home */}
                  <Route path="/how-it-works" element={<Navigate to="/" replace />} />
                  <Route path="/ar/how-it-works" element={<Navigate to="/ar" replace />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/ar/about" element={<About />} />
                  {/* Legacy features/pricing URLs now redirect home — site is fully free */}
                  <Route path="/features" element={<Navigate to="/" replace />} />
                  <Route path="/ar/features" element={<Navigate to="/ar" replace />} />
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
