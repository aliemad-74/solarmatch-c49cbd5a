import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatsCards from "@/components/admin/StatsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const AdminDashboard = () => {
  const { t } = useTranslation();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();

      const [profilesResult, legacyUsersResult, reportsResult, leadsResult, newLeadsResult, newProfilesResult] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("app_users").select("id", { count: "exact", head: true }),
          supabase.from("report_history").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", today),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gte("created_at", today),
        ]);

      return {
        totalUsers: (profilesResult.count || 0) + (legacyUsersResult.count || 0),
        totalReports: reportsResult.count || 0,
        totalLeads: leadsResult.count || 0,
        newLeadsToday: newLeadsResult.count || 0,
        usersToday: newProfilesResult.count || 0,
      };
    },
  });

  // Fetch chart data (last 7 days)
  const { data: chartData } = useQuery({
    queryKey: ["admin-chart"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDayDate = startOfDay(date).toISOString();
        const endOfDayDate = startOfDay(subDays(date, -1)).toISOString();

        const [reportsResult, leadsResult] = await Promise.all([
          supabase
            .from("report_history")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfDayDate)
            .lt("created_at", endOfDayDate),
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfDayDate)
            .lt("created_at", endOfDayDate),
        ]);

        days.push({
          date: format(date, "EEE"),
          reports: reportsResult.count || 0,
          leads: leadsResult.count || 0,
        });
      }
      return days;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats || null} isLoading={statsLoading} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.reportsChart")}</CardTitle>
            <CardDescription>{t("admin.dashboard.last7Days")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="reports" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.leadsChart")}</CardTitle>
            <CardDescription>{t("admin.dashboard.last7Days")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
