import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Legend,
} from "recharts";
import { Users, Globe, Smartphone, Monitor, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/exportUtils";

const COLORS = ["#1F6B4F", "#D9A441", "#355C7D", "#C89B3C", "#8b5cf6", "#ef4444"];

const AdminVisitors = () => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_visits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const visits = data || [];

  // Aggregate stats
  const uniqueSessions = new Set(visits.map((v: any) => v.session_id)).size;
  const uniqueIps = new Set(visits.map((v: any) => v.ip_address).filter(Boolean)).size;

  const deviceCounts: Record<string, number> = {};
  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const pathCounts: Record<string, number> = {};

  visits.forEach((v: any) => {
    if (v.device_type) deviceCounts[v.device_type] = (deviceCounts[v.device_type] || 0) + 1;
    if (v.browser) browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
    if (v.os) osCounts[v.os] = (osCounts[v.os] || 0) + 1;
    if (v.path) pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
  });

  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(browserCounts).map(([name, value]) => ({ name, value }));
  const osData = Object.entries(osCounts).map(([name, value]) => ({ name, value }));
  const topPaths = Object.entries(pathCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const filtered = visits.filter((v: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.ip_address?.toLowerCase().includes(s) ||
      v.path?.toLowerCase().includes(s) ||
      v.browser?.toLowerCase().includes(s) ||
      v.os?.toLowerCase().includes(s) ||
      v.device_type?.toLowerCase().includes(s) ||
      v.device_model?.toLowerCase().includes(s)
    );
  });

  const handleExport = () => {
    exportToCSV(
      visits as any,
      `solarmatch-visitors-${format(new Date(), "yyyy-MM-dd")}`,
      [
        { key: "created_at" as any, label: "Date" },
        { key: "ip_address" as any, label: "IP" },
        { key: "device_model" as any, label: "Device Model" },
        { key: "device_type" as any, label: "Device Type" },
        { key: "browser" as any, label: "Browser" },
        { key: "os" as any, label: "OS" },
        { key: "path" as any, label: "Path" },
        { key: "referrer" as any, label: "Referrer" },
        { key: "language" as any, label: "Language" },
        { key: "screen_size" as any, label: "Screen" },
        { key: "session_id" as any, label: "Session" },
        { key: "user_agent" as any, label: "User Agent" },
      ]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">الزائرون / Visitors</h1>
          <p className="text-muted-foreground">
            بيانات الزوار: IP, نوع الجهاز, المتصفح, النظام, والصفحات (آخر 1000 زيارة)
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2" variant="outline">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Top stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Page Views</CardTitle>
              <Globe className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Unique Sessions</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueSessions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Unique IPs</CardTitle>
              <Globe className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueIps}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Mobile Share</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visits.length > 0
                  ? Math.round(((deviceCounts.mobile || 0) / visits.length) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Distribution by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
            <CardDescription>Most used browsers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1F6B4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={osData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#D9A441" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited paths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPaths} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#355C7D" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Visit Log</CardTitle>
              <CardDescription>Latest page views (max 1000)</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IP, path, browser..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Device Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Lang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(v.created_at), "MMM dd HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.ip_address || "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{v.device_model || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {v.device_type || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{v.browser || "-"}</TableCell>
                      <TableCell className="text-sm">{v.os || "-"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={v.path}>
                        {v.path}
                      </TableCell>
                      <TableCell className="text-xs">{v.language || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No visits yet</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVisitors;
