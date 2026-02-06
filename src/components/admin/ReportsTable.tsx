import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Zap } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const ReportsTable = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_history")
        .select(`
          *,
          app_users (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredReports = reports?.filter(
    (report) =>
      report.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      report.app_users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      report.app_users?.email?.toLowerCase().includes(search.toLowerCase())
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
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.reports.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.reports.user")}</TableHead>
              <TableHead>{t("admin.reports.location")}</TableHead>
              <TableHead>{t("admin.reports.systemSize")}</TableHead>
              <TableHead>{t("admin.reports.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {t("admin.reports.noReports")}
                </TableCell>
              </TableRow>
            ) : (
              filteredReports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.app_users?.name || "-"}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.app_users?.email || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{report.location_name || t("admin.reports.noLocation")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>
                        {report.system_size_kw
                          ? `${report.system_size_kw} kW`
                          : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.created_at), "PPp", { locale: dateLocale })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReportsTable;
