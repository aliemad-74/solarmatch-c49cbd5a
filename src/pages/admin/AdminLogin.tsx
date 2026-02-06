import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminLogin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, isAdmin, admin } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRTL = i18n.language === "ar";
  const from = (location.state as any)?.from?.pathname || "/admin";

  // Redirect if already logged in as admin
  useEffect(() => {
    if (admin && isAdmin && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [admin, isAdmin, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 bg-muted/30", isRTL && "rtl")}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Sun className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">{t("admin.login.title")}</CardTitle>
            <CardDescription className="mt-2">
              {t("admin.login.description")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("admin.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.login.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("admin.login.signingIn")}
                </>
              ) : (
                t("admin.login.signIn")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground">
              {t("admin.login.backToSite")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
