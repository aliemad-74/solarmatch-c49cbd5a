import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  MapPin,
  Zap,
  Building,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface UserDetailModalProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailModal = ({ user, open, onOpenChange }: UserDetailModalProps) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["user-reports", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_history")
        .select("*")
        .eq("auth_user_id", user.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["user-assessments", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solar_assessments")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  const { data: role } = useQuery({
    queryKey: ["user-role", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user_id)
        .maybeSingle();
      if (error) throw error;
      return data?.role || "user";
    },
    enabled: !!user?.user_id && open,
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("admin.userDetail.title")}
          </DialogTitle>
        </DialogHeader>

        {/* User Profile */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("admin.userDetail.profileInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" dir="ltr">{user.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(user.created_at), "PPp", { locale: dateLocale })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("admin.userDetail.accountInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.userDetail.role")}</span>
                <Badge variant="outline">{role || "user"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.userDetail.type")}</span>
                <Badge variant="secondary">{user.user_type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.users.reports")}</span>
                <span className="font-medium">{user.reports_generated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.userDetail.assessments")}</span>
                <span className="font-medium">{assessments?.length ?? "..."}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Report History */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("admin.userDetail.reportHistory")} ({reports?.length ?? 0})
          </h3>
          {reportsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : reports && reports.length > 0 ? (
            <div className="rounded-md border max-h-[200px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.reports.location")}</TableHead>
                    <TableHead>{t("admin.reports.systemSize")}</TableHead>
                    <TableHead>{t("admin.reports.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {r.location_name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.system_size_kw ? `${r.system_size_kw} kW` : "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(r.created_at), "PP", { locale: dateLocale })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("admin.userDetail.noReports")}</p>
          )}
        </div>

        {/* Assessment History */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t("admin.userDetail.assessmentHistory")} ({assessments?.length ?? 0})
          </h3>
          {assessmentsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : assessments && assessments.length > 0 ? (
            <div className="rounded-md border max-h-[200px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.reports.location")}</TableHead>
                    <TableHead>{t("admin.userDetail.buildingType")}</TableHead>
                    <TableHead>{t("admin.reports.systemSize")}</TableHead>
                    <TableHead>{t("admin.userDetail.feasibility")}</TableHead>
                    <TableHead>{t("admin.reports.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="truncate max-w-[120px] block">
                          {a.formatted_address || a.city || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{a.building_type || "-"}</TableCell>
                      <TableCell>
                        {a.system_size_kw ? `${a.system_size_kw} kW` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.feasibility === "Suitable"
                              ? "default"
                              : a.feasibility === "Not Suitable"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {a.feasibility || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(a.created_at), "PP", { locale: dateLocale })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("admin.userDetail.noAssessments")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
