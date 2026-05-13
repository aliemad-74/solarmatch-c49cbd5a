import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Wind, Building2, Sprout, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RoofReport } from "@/lib/roofReport";

export const RoofReportSection = ({ report }: { report: RoofReport }) => {
  const { i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const env = report.environment;
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Satellite className="w-4 h-4 text-primary" />
          {ar ? "تحليل السطح بالذكاء الاصطناعي" : "AI Rooftop Analysis"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={ar ? "المساحة المحددة" : "Selected"} value={`${report.selectedArea} m²`} />
          <Stat label={ar ? "السطح الفعلي" : "Detected"} value={`${report.detectedRoofArea} m²`} />
          <Stat label={ar ? "قابل للاستخدام" : "Usable"} value={`${report.usableArea} m²`} />
          <Stat label={ar ? "غير قابل" : "Unusable"} value={`${report.unusablePercentage}%`} />
        </div>
        {report.obstacles.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{ar ? "العوائق المكتشفة:" : "Detected obstacles:"}</p>
            <div className="flex flex-wrap gap-1">
              {report.obstacles.map((o, i) => <Badge key={i} variant="secondary">{o}</Badge>)}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{ar ? "نوع العقار:" : "Property type:"}</span>
          <Badge variant="outline" className="capitalize">{report.propertyType}</Badge>
          <span className="text-xs text-muted-foreground ms-auto">
            {ar ? "الثقة" : "Confidence"}: {Math.round(report.confidenceScore * 100)}%
          </span>
        </div>
        {env.available && (
          <div className="rounded-md bg-muted/40 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Wind className="w-3.5 h-3.5" /> {ar ? "البيئة وجودة الهواء" : "Air & Environment"}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>AQI: <b>{env.aqi ?? "—"}</b></div>
              <div>PM10: <b>{env.pm10 ?? "—"}</b></div>
              <div>{ar ? "خسارة الغبار" : "Dust loss"}: <b>{env.soilingLossPercent}%</b></div>
              <div className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> <b>{env.cleaningFrequency}</b></div>
            </div>
          </div>
        )}
        {report.farm.isFarm && (
          <div className="rounded-md bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sprout className="w-3.5 h-3.5" /> {ar ? "وضع الأراضي الزراعية" : "Agricultural Land"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>{ar ? "فدان" : "Feddans"}: <b>{report.farm.feddans}</b></div>
              <div>{ar ? "قيراط" : "Qirats"}: <b>{report.farm.qirats}</b></div>
            </div>
            {report.farm.irrigationNote && <p className="text-xs text-muted-foreground">{report.farm.irrigationNote}</p>}
          </div>
        )}
        {report.notes && <p className="text-xs italic text-muted-foreground">{report.notes}</p>}
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export const ReportFeedback = ({ context }: { context?: Record<string, unknown> }) => {
  const { i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    const { error } = await supabase.from("user_feedback").insert([{
      rating,
      comment: comment.slice(0, 2000) || null,
      category: "report",
      page_context: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: (context ?? {}) as never,
    }]);
    setBusy(false);
    if (error) {
      toast.error(ar ? "تعذر إرسال التقييم" : "Could not submit feedback");
      return;
    }
    setSubmitted(true);
    toast.success(ar ? "شكراً لتقييمك!" : "Thanks for your feedback!");
  };

  if (submitted) {
    return (
      <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
        {ar ? "تم استلام تقييمك. شكراً!" : "Feedback received. Thank you!"}
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{ar ? "كيف كان التقرير؟" : "How was this report?"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`text-2xl leading-none ${n <= rating ? "text-primary" : "text-muted-foreground"}`} aria-label={`${n} stars`}>★</button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={ar ? "تعليقك (اختياري)" : "Comment (optional)"} maxLength={2000} rows={3} />
        <Button onClick={submit} disabled={!rating || busy} size="sm">
          {ar ? "إرسال" : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
};
