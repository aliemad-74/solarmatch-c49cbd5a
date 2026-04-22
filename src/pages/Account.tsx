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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Calendar, 
  MapPin, 
  Zap,
  ArrowLeft,
  Shield,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Account = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, isLoading, refreshProfile } = useUserAuth();
  const isRTL = i18n.language === "ar";
  const isAr = i18n.language === "ar";
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [profileType, setProfileType] = useState<'standard' | 'technical'>('standard');

  useEffect(() => {
    if (profile) {
      setMarketingConsent(profile.marketing_consent);
      setProfileType((profile.profile_type as 'standard' | 'technical') || 'standard');
    }
  }, [profile]);

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

  // SolarMatch is fully free — no per-user report limits.

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

        <div className="grid gap-6 md:grid-cols-1">
          {/* Profile Card only — Reports usage card removed (site is fully free) */}
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

          {/* Reports Usage card removed — SolarMatch is fully free with unlimited reports. */}

        {/* Account Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {isAr ? "إعدادات الحساب" : "Account Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{isAr ? "نوع الحساب" : "Profile Type"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    setProfileType('standard');
                    await supabase.from('profiles').update({ profile_type: 'standard' }).eq('user_id', user!.id);
                    refreshProfile();
                    toast.success(isAr ? "تم التحديث" : "Updated");
                  }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    profileType === 'standard'
                      ? 'bg-primary/10 border-solar-gold ring-2 ring-solar-gold/50'
                      : 'bg-muted/30 border-border/50 hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">🏠</span>
                  <p className="font-medium text-sm">{isAr ? "صاحب عقار أو مشروع" : "Property / Project Owner"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "أبحث عن تركيب طاقة شمسية" : "Looking for solar installation"}</p>
                </button>
                <button
                  onClick={async () => {
                    setProfileType('technical');
                    await supabase.from('profiles').update({ profile_type: 'technical' }).eq('user_id', user!.id);
                    refreshProfile();
                    toast.success(isAr ? "تم التحديث" : "Updated");
                  }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    profileType === 'technical'
                      ? 'bg-primary/10 border-solar-gold ring-2 ring-solar-gold/50'
                      : 'bg-muted/30 border-border/50 hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">⚙️</span>
                  <p className="font-medium text-sm">{isAr ? "مهندس أو مقاول تركيب" : "Engineer / Installer"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "أعمل في مجال الطاقة الشمسية" : "Working in solar energy"}</p>
                </button>
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{isAr ? "السماح بمشاركة بياناتي مع شركاء التركيب" : "Allow sharing my data with installer partners"}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "بيانات التقييم فقط (الموقع، نوع المبنى، حجم النظام)" : "Assessment data only (location, building type, system size)"}</p>
                </div>
              </div>
              <Switch
                checked={marketingConsent}
                onCheckedChange={async (checked) => {
                  setMarketingConsent(checked);
                  await supabase.from('profiles').update({ marketing_consent: checked }).eq('user_id', user!.id);
                  refreshProfile();
                  toast.success(isAr ? "تم التحديث" : "Updated");
                }}
              />
            </div>
          </CardContent>
        </Card>

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
