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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Phone, Mail, MapPin, Zap, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  closed: "bg-gray-500",
};

const LeadsTable = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast({
        title: t("admin.leads.statusUpdated"),
        description: t("admin.leads.statusUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("admin.error"),
        description: t("admin.leads.statusUpdateError"),
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.leads.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("admin.leads.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.leads.allStatuses")}</SelectItem>
            <SelectItem value="new">{t("admin.leads.status.new")}</SelectItem>
            <SelectItem value="contacted">{t("admin.leads.status.contacted")}</SelectItem>
            <SelectItem value="qualified">{t("admin.leads.status.qualified")}</SelectItem>
            <SelectItem value="closed">{t("admin.leads.status.closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.leads.name")}</TableHead>
              <TableHead>{t("admin.leads.contact")}</TableHead>
              <TableHead>{t("admin.leads.project")}</TableHead>
              <TableHead>{t("admin.leads.status")}</TableHead>
              <TableHead>{t("admin.leads.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t("admin.leads.noLeads")}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`contact.${lead.preferred_contact}`)} • {t(`contact.${lead.best_time}`)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{lead.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {lead.location_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{lead.location_name}</span>
                        </div>
                      )}
                      {lead.kw_installed && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span>{lead.kw_installed} kW</span>
                        </div>
                      )}
                      {lead.estimated_cost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span>{Number(lead.estimated_cost).toLocaleString()} EGP</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ leadId: lead.id, newStatus: value })
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue>
                          <Badge className={statusColors[lead.status]}>
                            {t(`admin.leads.status.${lead.status}`)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t("admin.leads.status.new")}</SelectItem>
                        <SelectItem value="contacted">{t("admin.leads.status.contacted")}</SelectItem>
                        <SelectItem value="qualified">{t("admin.leads.status.qualified")}</SelectItem>
                        <SelectItem value="closed">{t("admin.leads.status.closed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {format(new Date(lead.created_at), "PP", { locale: dateLocale })}
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

export default LeadsTable;
