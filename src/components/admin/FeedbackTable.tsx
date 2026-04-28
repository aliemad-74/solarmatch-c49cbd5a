import { useState, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Star, MoreHorizontal, Trash2, CheckCircle, Archive, MessageSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { exportToCSV } from "@/lib/exportUtils";

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  reviewed: "bg-yellow-500",
  resolved: "bg-green-500",
  archived: "bg-gray-500",
};

const categoryLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: "عام", en: "General" },
  accuracy: { ar: "دقة", en: "Accuracy" },
  usability: { ar: "استخدام", en: "Usability" },
  bug: { ar: "مشكلة", en: "Bug" },
  feature: { ar: "اقتراح", en: "Feature" },
};

const FeedbackTable = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("user_feedback")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
    onError: () => {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_feedback").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
      setDeleteItem(null);
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
    onError: () => {
      toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return { total: 0, avg: 0, distribution: [0, 0, 0, 0, 0], newCount: 0 };
    }
    const total = feedback.length;
    const sum = feedback.reduce((s, f) => s + (f.rating || 0), 0);
    const distribution = [1, 2, 3, 4, 5].map(
      (r) => feedback.filter((f) => f.rating === r).length
    );
    const newCount = feedback.filter((f) => f.status === "new").length;
    return { total, avg: sum / total, distribution, newCount };
  }, [feedback]);

  const filtered = feedback?.filter((f) => {
    const matchesSearch =
      !search ||
      (f.comment ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (f.page_context ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    const matchesRating = ratingFilter === "all" || f.rating === Number(ratingFilter);
    return matchesSearch && matchesStatus && matchesCategory && matchesRating;
  });

  const handleExportCSV = () => {
    if (!feedback) return;
    exportToCSV(
      feedback.map((f) => ({
        ...f,
        metadata: JSON.stringify(f.metadata ?? {}),
      })) as any,
      `solarmatch-feedback-${format(new Date(), "yyyy-MM-dd")}`,
      [
        { key: "rating" as any, label: "Rating" },
        { key: "category" as any, label: "Category" },
        { key: "status" as any, label: "Status" },
        { key: "comment" as any, label: "Comment" },
        { key: "page_context" as any, label: "Page" },
        { key: "user_id" as any, label: "User ID" },
        { key: "metadata" as any, label: "Metadata" },
        { key: "created_at" as any, label: "Date" },
      ]
    );
  };

  const dateLocale = isAr ? ar : enUS;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MessageSquare className="w-4 h-4" />
              {isAr ? "إجمالي الآراء" : "Total"}
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Star className="w-4 h-4" />
              {isAr ? "متوسط التقييم" : "Avg Rating"}
            </div>
            <p className="text-2xl font-bold flex items-center gap-1">
              {stats.avg.toFixed(2)}
              <Star className="w-5 h-5 fill-solar-gold text-solar-gold" />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              {isAr ? "جديد" : "New"}
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm mb-1">
              {isAr ? "التوزيع" : "Distribution"}
            </div>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = stats.distribution[r - 1];
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{r}★</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-solar-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-end text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في التعليقات..." : "Search comments..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الحالات" : "All status"}</SelectItem>
              <SelectItem value="new">{isAr ? "جديد" : "New"}</SelectItem>
              <SelectItem value="reviewed">{isAr ? "تمت مراجعته" : "Reviewed"}</SelectItem>
              <SelectItem value="resolved">{isAr ? "تم الحل" : "Resolved"}</SelectItem>
              <SelectItem value="archived">{isAr ? "مؤرشف" : "Archived"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الأنواع" : "All types"}</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل النجوم" : "All stars"}</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "التقييم" : "Rating"}</TableHead>
              <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
              <TableHead className="max-w-md">{isAr ? "التعليق" : "Comment"}</TableHead>
              <TableHead>{isAr ? "الصفحة" : "Page"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
              <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {isAr ? "لا توجد آراء" : "No feedback yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= item.rating
                              ? "fill-solar-gold text-solar-gold"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {isAr
                        ? categoryLabels[item.category]?.ar ?? item.category
                        : categoryLabels[item.category]?.en ?? item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {item.comment ? (
                      <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">
                        {item.comment}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {isAr ? "بدون تعليق" : "No comment"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.page_context || "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ id: item.id, newStatus: value })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          <Badge className={statusColors[item.status]}>{item.status}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{isAr ? "جديد" : "New"}</SelectItem>
                        <SelectItem value="reviewed">{isAr ? "تمت مراجعته" : "Reviewed"}</SelectItem>
                        <SelectItem value="resolved">{isAr ? "تم الحل" : "Resolved"}</SelectItem>
                        <SelectItem value="archived">{isAr ? "مؤرشف" : "Archived"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.created_at), "PP", { locale: dateLocale })}
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
                          onClick={() =>
                            updateStatusMutation.mutate({ id: item.id, newStatus: "resolved" })
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isAr ? "تعليم كمحلول" : "Mark resolved"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({ id: item.id, newStatus: "archived" })
                          }
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {isAr ? "أرشفة" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isAr ? "حذف" : "Delete"}
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
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "تأكيد الحذف" : "Confirm delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع."
                : "Are you sure you want to delete this feedback? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
            >
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedbackTable;
