import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Calendar, 
  MapPin, 
  Zap,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useEffect } from "react";

const Account = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, isLoading } = useUserAuth();
  const isRTL = i18n.language === "ar";
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Fetch user's reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["user-reports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("report_history")
        .select("*")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <Header />
        <main className="container mx-auto px-4 py-24">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const reportsUsed = profile.reports_generated;
  const reportsLimit = profile.report_limit;
  const reportsRemaining = Math.max(0, reportsLimit - reportsUsed);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 me-2" />
          {t("account.backToHome")}
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t("account.title")}</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("account.profileInfo")}
              </CardTitle>
              <CardDescription>{t("account.profileDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{t("account.name")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium" dir="ltr">{profile.email}</p>
                  <p className="text-sm text-muted-foreground">{t("account.email")}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" dir="ltr">{profile.phone}</p>
                    <p className="text-sm text-muted-foreground">{t("account.phone")}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Badge variant={profile.user_type === "business" ? "default" : "secondary"}>
                    {profile.user_type === "business" ? t("auth.business") : t("auth.individual")}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{t("account.accountType")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {format(new Date(profile.created_at), "PPP", { locale: dateLocale })}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("account.memberSince")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t("account.reportsUsage")}
              </CardTitle>
              <CardDescription>{t("account.reportsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("account.reportsUsed")}</p>
                    <p className="text-2xl font-bold">{reportsUsed} / {reportsLimit}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm text-muted-foreground">{t("account.remaining")}</p>
                    <p className="text-2xl font-bold text-primary">{reportsRemaining}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (reportsUsed / reportsLimit) * 100)}%` }}
                  />
                </div>

                {reportsRemaining === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t("account.noReportsRemaining")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("account.reportsHistory")}
            </CardTitle>
            <CardDescription>{t("account.reportsHistoryDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div 
                    key={report.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {report.location_name || t("account.noLocation")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(report.created_at), "PPp", { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    {report.system_size_kw && (
                      <Badge variant="outline" className="gap-1">
                        <Zap className="w-3 h-3" />
                        {report.system_size_kw} kW
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("account.noReports")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
