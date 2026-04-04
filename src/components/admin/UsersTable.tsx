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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, MoreHorizontal, Eye, Trash2, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import UserDetailModal from "./UserDetailModal";
import { exportToCSV } from "@/lib/exportUtils";

const UsersTable = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>(null);

  const { data: profiles, isLoading } = useQuery({
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

  const { data: roles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.user_id] = r.role; });
      return map;
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
      toast({ title: t("admin.users.limitUpdated"), description: t("admin.users.limitUpdatedDesc") });
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.users.limitUpdateError"), variant: "destructive" });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Upsert role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: t("admin.users.roleUpdated"), description: t("admin.users.roleUpdatedDesc") });
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.users.roleUpdateError"), variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile (cascading from auth not available via client)
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      setDeleteUser(null);
      toast({ title: t("admin.users.deleted"), description: t("admin.users.deletedDesc") });
    },
    onError: () => {
      toast({ title: t("admin.error"), description: t("admin.users.deleteError"), variant: "destructive" });
    },
  });

  const handleExportCSV = () => {
    if (!profiles) return;
    exportToCSV(profiles as any, `solarmatch-users-${format(new Date(), "yyyy-MM-dd")}`, [
      { key: "name" as any, label: "Name" },
      { key: "email" as any, label: "Email" },
      { key: "phone" as any, label: "Phone" },
      { key: "user_type" as any, label: "Type" },
      { key: "reports_generated" as any, label: "Reports" },
      { key: "report_limit" as any, label: "Limit" },
      { key: "created_at" as any, label: "Registered" },
    ]);
  };

  const filteredProfiles = profiles?.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.phone && user.phone.includes(search))
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
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.users.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          {t("admin.users.exportCSV")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.users.name")}</TableHead>
              <TableHead>{t("admin.users.email")}</TableHead>
              <TableHead>{t("admin.users.phone")}</TableHead>
              <TableHead>{t("admin.users.reports")}</TableHead>
              <TableHead>{t("admin.userDetail.role")}</TableHead>
              <TableHead>{t("admin.users.type")}</TableHead>
              <TableHead>{t("admin.users.createdAt")}</TableHead>
              <TableHead>{t("admin.users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t("admin.users.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles?.map((user) => {
                const userRole = roles?.[user.user_id] || "user";
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell dir="ltr">{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.reports_generated} / {user.report_limit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRole}
                        onValueChange={(val) =>
                          changeRoleMutation.mutate({ userId: user.user_id, newRole: val })
                        }
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.user_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "PP", { locale: dateLocale })}
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
                            onClick={() => {
                              setSelectedUser(user);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("admin.users.viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const newLimit = prompt(t("admin.users.enterNewLimit"), String(user.report_limit));
                              if (newLimit !== null) {
                                const val = parseInt(newLimit, 10);
                                if (!isNaN(val) && val >= 0) {
                                  updateProfileLimitMutation.mutate({ userId: user.user_id, newLimit: val });
                                }
                              }
                            }}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            {t("admin.users.resetLimit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("admin.users.deleteUser")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.confirmDeleteDesc", { name: deleteUser?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.users.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser.user_id)}
            >
              {t("admin.users.deleteUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersTable;
