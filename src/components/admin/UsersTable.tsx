import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const UsersTable = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Fetch profiles (new auth system)
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch legacy app_users
  const { data: legacyUsers, isLoading: legacyLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateProfileLimitMutation = useMutation({
    mutationFn: async ({ userId, newLimit }: { userId: string; newLimit: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ report_limit: newLimit })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({
        title: t("admin.users.limitUpdated"),
        description: t("admin.users.limitUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("admin.error"),
        description: t("admin.users.limitUpdateError"),
        variant: "destructive",
      });
    },
  });

  const updateLegacyLimitMutation = useMutation({
    mutationFn: async ({ userId, newLimit }: { userId: string; newLimit: number }) => {
      const { error } = await supabase
        .from("app_users")
        .update({ report_limit: newLimit })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: t("admin.users.limitUpdated"),
        description: t("admin.users.limitUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("admin.error"),
        description: t("admin.users.limitUpdateError"),
        variant: "destructive",
      });
    },
  });

  const filteredProfiles = profiles?.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.phone && user.phone.includes(search))
  );

  const filteredLegacy = legacyUsers?.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.phone.includes(search)
  );

  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const isLoading = profilesLoading || legacyLoading;

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
          placeholder={t("admin.users.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="authenticated">
        <TabsList>
          <TabsTrigger value="authenticated">
            {t("admin.users.authenticated")} ({profiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="legacy">
            {t("admin.users.legacy")} ({legacyUsers?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="authenticated" className="mt-4">
          {/* Authenticated Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.users.name")}</TableHead>
                  <TableHead>{t("admin.users.email")}</TableHead>
                  <TableHead>{t("admin.users.phone")}</TableHead>
                  <TableHead>{t("admin.users.reports")}</TableHead>
                  <TableHead>{t("admin.users.limit")}</TableHead>
                  <TableHead>{t("admin.users.createdAt")}</TableHead>
                  <TableHead>{t("admin.users.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t("admin.users.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell dir="ltr">{user.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.reports_generated} / {user.report_limit}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.report_limit}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "PP", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="w-20 h-8 text-center"
                          defaultValue={user.report_limit}
                          key={user.report_limit}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0 && val !== user.report_limit) {
                              updateProfileLimitMutation.mutate({ userId: user.user_id, newLimit: val });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="legacy" className="mt-4">
          {/* Legacy Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.users.name")}</TableHead>
                  <TableHead>{t("admin.users.email")}</TableHead>
                  <TableHead>{t("admin.users.phone")}</TableHead>
                  <TableHead>{t("admin.users.reports")}</TableHead>
                  <TableHead>{t("admin.users.limit")}</TableHead>
                  <TableHead>{t("admin.users.status")}</TableHead>
                  <TableHead>{t("admin.users.createdAt")}</TableHead>
                  <TableHead>{t("admin.users.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLegacy?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("admin.users.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLegacy?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell dir="ltr">{user.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.reports_generated} / {user.report_limit}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.report_limit}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "verified" ? "default" : "outline"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "PP", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="w-20 h-8 text-center"
                          defaultValue={user.report_limit}
                          key={user.report_limit}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0 && val !== user.report_limit) {
                              updateLegacyLimitMutation.mutate({ userId: user.id, newLimit: val });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersTable;
