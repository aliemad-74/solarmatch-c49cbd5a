import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Zap, MoreHorizontal, Trash2, Flag, DollarSign, Building, Download, Sun } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { exportToCSV } from "@/lib/exportUtils";
import { downloadAdminReportPdf } from "@/lib/adminReportPdf";


const feasibilityColors: Record<string, string> = {
  Suitable: "default",
  "Conditionally Suitable": "secondary",
  "Not Suitable": "destructive",
};

const ReportsTable = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteReport, setDeleteReport] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);


  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports-enhanced"],
    queryFn: async () => {
      // Fetch reports
      const { data: reportData, error: reportError } = await supabase
        .from("report_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (reportError) throw reportError;

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, email");
      const profileMap = new Map(
        (profilesData || []).map((p: any) => [p.user_id, p])
      );

      // Fetch assessments for additional data
      const { data: assessData } = await supabase
        .from("solar_assessments")
        .select("user_id, building_type, feasibility, annual_savings, payback_years, pv_package, created_at")
        .order("created_at", { ascending: false });

      // Group assessments by user_id for loose matching
      const assessByUser = new Map<string, any[]>();
      (assessData || []).forEach((a: any) => {
        if (a.user_id) {
          if (!assessByUser.has(a.user_id)) assessByUser.set(a.user_id, []);
          assessByUser.get(a.user_id)!.push(a);
        }
      });

      return (reportData || []).map((report: any) => {
        const profile = profileMap.get(report.auth_user_id) || null;
        // Try to match assessment by user and approximate time
        const userAssessments = assessByUser.get(report.auth_user_id) || [];
        const matchedAssessment = userAssessments.find((a: any) => {
          const diff = Math.abs(new Date(a.created_at).getTime() - new Date(report.created_at).getTime());
          return diff < 60000; // within 1 minute
        }) || userAssessments[0] || null;

        return { ...report, profile, assessment: matchedAssessment };
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from("report_history").delete().eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports-enhanced"] });
      setDeleteReport(null);
      toast({ title: t("admin.reports.deleted"), description: t("admin.reports.deletedDesc") });
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.reports.deleteError"), variant: "destructive" });
    },
  });

  const handleExportCSV = () => {
    if (!reports) return;
    const exportData = reports.map((r: any) => ({
      id: r.id,
      user: r.profile?.name || "-",
      email: r.profile?.email || "-",
      location: r.location_name || "-",
      system_kw: r.system_size_kw || "-",
      building_type: r.assessment?.building_type || "-",
      feasibility: r.assessment?.feasibility || "-",
      annual_savings: r.assessment?.annual_savings || "-",
      payback_years: r.assessment?.payback_years || "-",
      date: r.created_at,
    }));
    exportToCSV(exportData as any, `solarmatch-reports-${format(new Date(), "yyyy-MM-dd")}`, [
      { key: "id" as any, label: "Report ID" },
      { key: "user" as any, label: "User" },
      { key: "email" as any, label: "Email" },
      { key: "location" as any, label: "Location" },
      { key: "system_kw" as any, label: "System kW" },
      { key: "building_type" as any, label: "Building Type" },
      { key: "feasibility" as any, label: "Feasibility" },
      { key: "annual_savings" as any, label: "Annual Savings" },
      { key: "payback_years" as any, label: "Payback Years" },
      { key: "date" as any, label: "Date" },
    ]);
  };

  const filteredReports = reports?.filter(
    (report: any) =>
      report.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      report.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      report.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      report.id?.toLowerCase().includes(search.toLowerCase())
  );

  const dateLocale = i18n.language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.reports.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          {t("admin.reports.exportCSV")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.reports.user")}</TableHead>
              <TableHead>{t("admin.reports.location")}</TableHead>
              <TableHead>{t("admin.reports.systemSize")}</TableHead>
              <TableHead>{t("admin.reports.buildingType")}</TableHead>
              <TableHead>{t("admin.reports.savings")}</TableHead>
              <TableHead>{t("admin.reports.payback")}</TableHead>
              <TableHead>{t("admin.reports.verdict")}</TableHead>
              <TableHead>{t("admin.reports.createdAt")}</TableHead>
              <TableHead>{t("admin.users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {t("admin.reports.noReports")}
                </TableCell>
              </TableRow>
            ) : (
              filteredReports?.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.profile?.name || "-"}</p>
                      <p className="text-sm text-muted-foreground">{report.profile?.email || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{report.location_name || t("admin.reports.noLocation")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {report.system_size_kw ? `${report.system_size_kw} kW` : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{report.assessment?.building_type || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.assessment?.annual_savings ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        <span className="text-sm">{Number(report.assessment.annual_savings).toLocaleString()}</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {report.assessment?.payback_years
                      ? `${Number(report.assessment.payback_years).toFixed(1)} yr`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {report.assessment?.feasibility ? (
                      <Badge variant={feasibilityColors[report.assessment.feasibility] as any || "secondary"}>
                        {report.assessment.feasibility}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.created_at), "PPp", { locale: dateLocale })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteReport(report)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("admin.reports.deleteReport")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReport} onOpenChange={(open) => !open && setDeleteReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.reports.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.reports.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.users.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteReport && deleteReportMutation.mutate(deleteReport.id)}
            >
              {t("admin.reports.deleteReport")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportsTable;
