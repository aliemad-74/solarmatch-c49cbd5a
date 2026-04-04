import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  FileText,
  TrendingUp,
  Building,
  Sun,
  DollarSign,
  Download,
  Zap,
} from "lucide-react";
import { startOfDay, subDays, startOfMonth, format } from "date-fns";
import { exportToCSV, formatDateForExport } from "@/lib/exportUtils";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--destructive))",
];

const AdminAnalytics = () => {
  const { t } = useTranslation();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();

      const [
        profilesRes,
        legacyRes,
        reportsRes,
        reportsMonthRes,
        reportsTodayRes,
        assessmentsRes,
        leadsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("app_users").select("id", { count: "exact", head: true }),
        supabase.from("report_history").select("id", { count: "exact", head: true }),
        supabase
          .from("report_history")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart),
        supabase
          .from("report_history")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        supabase.from("solar_assessments").select(
          "building_type, pv_package, feasibility, payback_years, annual_savings"
        ),
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ]);

      const assessments = assessmentsRes.data || [];

      // Building type distribution
      const buildingTypes: Record<string, number> = {};
      const panelTypes: Record<string, number> = {};
      const feasibilityDist: Record<string, number> = {
        Suitable: 0,
        "Conditionally Suitable": 0,
        "Not Suitable": 0,
      };
      let totalPayback = 0;
      let paybackCount = 0;
      let totalSavings = 0;
      let savingsCount = 0;

      assessments.forEach((a: any) => {
        if (a.building_type) buildingTypes[a.building_type] = (buildingTypes[a.building_type] || 0) + 1;
        if (a.pv_package) panelTypes[a.pv_package] = (panelTypes[a.pv_package] || 0) + 1;
        if (a.feasibility && feasibilityDist[a.feasibility] !== undefined) {
          feasibilityDist[a.feasibility]++;
        }
        if (a.payback_years) { totalPayback += Number(a.payback_years); paybackCount++; }
        if (a.annual_savings) { totalSavings += Number(a.annual_savings); savingsCount++; }
      });

      const topBuildingType = Object.entries(buildingTypes).sort((a, b) => b[1] - a[1])[0];
      const topPanelType = Object.entries(panelTypes).sort((a, b) => b[1] - a[1])[0];

      const totalAssessments = assessments.length;
      const feasibilityData = Object.entries(feasibilityDist).map(([name, value]) => ({
        name,
        value,
        percentage: totalAssessments > 0 ? Math.round((value / totalAssessments) * 100) : 0,
      }));

      return {
        totalUsers: (profilesRes.count || 0) + (legacyRes.count || 0),
        totalReports: reportsRes.count || 0,
        reportsToday: reportsTodayRes.count || 0,
        reportsThisMonth: reportsMonthRes.count || 0,
        totalLeads: leadsRes.count || 0,
        totalAssessments,
        topBuildingType: topBuildingType ? topBuildingType[0] : "-",
        topPanelType: topPanelType ? topPanelType[0] : "-",
        avgPayback: paybackCount > 0 ? (totalPayback / paybackCount).toFixed(1) : "-",
        avgSavings: savingsCount > 0 ? Math.round(totalSavings / savingsCount) : 0,
        feasibilityData,
        buildingTypeData: Object.entries(buildingTypes)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6),
      };
    },
  });

  // Export all analytics as CSV
  const handleExportAnalytics = () => {
    if (!analytics) return;
    const data = [
      { metric: "Total Users", value: analytics.totalUsers },
      { metric: "Total Reports", value: analytics.totalReports },
      { metric: "Reports Today", value: analytics.reportsToday },
      { metric: "Reports This Month", value: analytics.reportsThisMonth },
      { metric: "Total Leads", value: analytics.totalLeads },
      { metric: "Total Assessments", value: analytics.totalAssessments },
      { metric: "Most Common Building", value: analytics.topBuildingType },
      { metric: "Most Common Panel", value: analytics.topPanelType },
      { metric: "Avg Payback (years)", value: analytics.avgPayback },
      { metric: "Avg Annual Savings (EGP)", value: analytics.avgSavings },
      ...analytics.feasibilityData.map((f) => ({
        metric: `Feasibility: ${f.name}`,
        value: `${f.percentage}% (${f.value})`,
      })),
    ];
    exportToCSV(data as any, `solarmatch-analytics-${format(new Date(), "yyyy-MM-dd")}`, [
      { key: "metric" as any, label: "Metric" },
      { key: "value" as any, label: "Value" },
    ]);
  };

  // Export functions for individual tables
  const handleExportUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) {
      exportToCSV(data as any, `solarmatch-users-${format(new Date(), "yyyy-MM-dd")}`, [
        { key: "name" as any, label: "Name" },
        { key: "email" as any, label: "Email" },
        { key: "phone" as any, label: "Phone" },
        { key: "user_type" as any, label: "Type" },
        { key: "reports_generated" as any, label: "Reports" },
        { key: "report_limit" as any, label: "Limit" },
        { key: "created_at" as any, label: "Registered" },
      ]);
    }
  };

  const handleExportReports = async () => {
    const { data } = await supabase.from("report_history").select("*").order("created_at", { ascending: false });
    if (data) {
      exportToCSV(data as any, `solarmatch-reports-${format(new Date(), "yyyy-MM-dd")}`, [
        { key: "id" as any, label: "Report ID" },
        { key: "location_name" as any, label: "Location" },
        { key: "system_size_kw" as any, label: "System kW" },
        { key: "created_at" as any, label: "Date" },
      ]);
    }
  };

  const handleExportLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (data) {
      exportToCSV(data as any, `solarmatch-leads-${format(new Date(), "yyyy-MM-dd")}`, [
        { key: "name" as any, label: "Name" },
        { key: "email" as any, label: "Email" },
        { key: "phone" as any, label: "Phone" },
        { key: "location_name" as any, label: "Location" },
        { key: "kw_installed" as any, label: "kW" },
        { key: "estimated_cost" as any, label: "Cost" },
        { key: "estimated_savings" as any, label: "Savings" },
        { key: "status" as any, label: "Status" },
        { key: "created_at" as any, label: "Date" },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.analytics.title")}</h1>
          <p className="text-muted-foreground">{t("admin.analytics.subtitle")}</p>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("admin.stats.totalUsers")}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("admin.stats.totalReports")}
              </CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalReports.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("admin.analytics.today")}: {analytics?.reportsToday} · {t("admin.analytics.thisMonth")}: {analytics?.reportsThisMonth}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("admin.analytics.avgPayback")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgPayback} <span className="text-sm font-normal text-muted-foreground">{t("admin.analytics.years")}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("admin.analytics.avgSavings")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgSavings.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">EGP</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Feasibility Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.feasibilityDist")}</CardTitle>
            <CardDescription>{t("admin.analytics.totalAssessments")}: {analytics?.totalAssessments ?? 0}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <div className="flex items-center gap-6">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.feasibilityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {analytics?.feasibilityData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {analytics?.feasibilityData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i] }}
                      />
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary" className="text-xs">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Building Types */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.buildingTypes")}</CardTitle>
            <CardDescription>
              {t("admin.analytics.topType")}: {analytics?.topBuildingType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.buildingTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("admin.analytics.topBuildingType")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {analytics?.topBuildingType || "-"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sun className="h-4 w-4" />
              {t("admin.analytics.topPanelType")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {analytics?.topPanelType || "-"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t("admin.analytics.totalAssessments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{analytics?.totalAssessments?.toLocaleString() ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Export Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("admin.analytics.exportTools")}
          </CardTitle>
          <CardDescription>{t("admin.analytics.exportDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportUsers} className="gap-2">
              <Users className="h-4 w-4" />
              {t("admin.analytics.exportUsers")}
            </Button>
            <Button variant="outline" onClick={handleExportReports} className="gap-2">
              <FileText className="h-4 w-4" />
              {t("admin.analytics.exportReports")}
            </Button>
            <Button variant="outline" onClick={handleExportLeads} className="gap-2">
              <Zap className="h-4 w-4" />
              {t("admin.analytics.exportLeads")}
            </Button>
            <Button variant="outline" onClick={handleExportAnalytics} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("admin.analytics.exportAnalytics")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
