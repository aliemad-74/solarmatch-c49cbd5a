import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle, Sun } from "lucide-react";

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = i18n.language === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(t("auth.errors.unknown"));
    }

    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl gradient-solar flex items-center justify-center shadow-glow">
            {success ? (
              <Mail className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Sun className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-display">
            {success ? t("forgotPassword.emailSentTitle") : t("forgotPassword.title")}
          </CardTitle>
          <CardDescription>
            {success 
              ? t("forgotPassword.emailSentDescription")
              : t("forgotPassword.description")
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{t("forgotPassword.checkEmail")}</span>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                {t("forgotPassword.checkSpam")}
              </p>

              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t("forgotPassword.backToHome")}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                    {t("forgotPassword.sending")}
                  </>
                ) : (
                  t("forgotPassword.submit")
                )}
              </Button>

              <Button variant="ghost" asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t("forgotPassword.backToLogin")}
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
