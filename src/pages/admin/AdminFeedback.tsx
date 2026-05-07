import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const AdminFeedback = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const avg =
    feedback && feedback.length
      ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(2)
      : "—";

  return (
    <div className={isRTL ? "space-y-6 text-right" : "space-y-6"}>
      <div>
        <h1 className="text-3xl font-bold">{isRTL ? "ملاحظات المستخدمين" : "User Feedback"}</h1>
        <p className="text-muted-foreground">
          {isRTL ? "آراء وتقييمات التقارير" : "Report ratings and comments"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isRTL ? "إجمالي التقييمات" : "Total Feedback"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isRTL ? "متوسط التقييم" : "Average Rating"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {avg} <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isRTL ? "تقارير" : "Report Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback?.filter((f) => f.category === "report").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "آخر الملاحظات" : "Recent Feedback"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{isRTL ? "جارِ التحميل…" : "Loading…"}</p>
          ) : !feedback?.length ? (
            <p className="text-muted-foreground">{isRTL ? "لا توجد ملاحظات بعد" : "No feedback yet"}</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (f.rating || 0)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <Badge variant="outline">{f.category}</Badge>
                      <Badge variant="secondary">{f.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(f.created_at), "PPp")}
                    </span>
                  </div>
                  {f.comment && (
                    <div className="flex gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p>{f.comment}</p>
                    </div>
                  )}
                  {f.page_context && (
                    <p className="text-xs text-muted-foreground">{f.page_context}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeedback;
