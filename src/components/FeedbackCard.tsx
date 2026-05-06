import { useState } from "react";
import { Star, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Category = "general" | "accuracy" | "usability" | "bug" | "feature";

interface FeedbackCardProps {
  pageContext?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "solarmatch_feedback_dismissed";

export default function FeedbackCard({ pageContext = "results", metadata }: FeedbackCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [category, setCategory] = useState<Category>("general");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories: { key: Category; ar: string; en: string }[] = [
    { key: "general", ar: "تقييم عام", en: "General" },
    { key: "accuracy", ar: "دقة الحسابات", en: "Accuracy" },
    { key: "usability", ar: "سهولة الاستخدام", en: "Usability" },
    { key: "bug", ar: "مشكلة فنية", en: "Bug" },
    { key: "feature", ar: "اقتراح ميزة", en: "Feature request" },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: isAr ? "اختر تقييم" : "Pick a rating",
        description: isAr ? "من فضلك اختر عدد النجوم أولاً" : "Please select a star rating first",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_feedback").insert({
        rating,
        category,
        comment: comment.trim() || null,
        page_context: pageContext.slice(0, 100),
        user_id: user?.id ?? null,
        metadata: (metadata as any) ?? {},
      });

      if (error) throw error;

      setSubmitted(true);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      toast({
        title: isAr ? "شكراً لك! 🌟" : "Thank you! 🌟",
        description: isAr ? "تم استلام رأيك وهيساعدنا نطور المنصة" : "Your feedback was received and helps us improve.",
      });
    } catch (err) {
      console.error("feedback submit error:", err);
      toast({
        title: isAr ? "حدث خطأ" : "Something went wrong",
        description: isAr ? "حاول مرة أخرى بعد قليل" : "Please try again shortly",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
        <CardContent className="p-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="font-display font-semibold text-foreground">
              {isAr ? "وصلنا رأيك — شكراً!" : "Got your feedback — thanks!"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "كل تقييم بيخلي SolarMatch أحسن لباقي المستخدمين." : "Every rating makes SolarMatch better for everyone."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/60 shadow-card">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {isAr ? "إيه رأيك في التقرير؟" : "How was your report?"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAr ? "ثانيتين فقط — رأيك بيساعدنا نطور المنصة." : "Takes 2 seconds — your feedback shapes SolarMatch."}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 justify-center" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1.5 transition-transform hover:scale-110 active:scale-95"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-9 h-9 transition-colors ${
                  (hover || rating) >= star
                    ? "fill-solar-gold text-solar-gold"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {isAr ? "نوع الملاحظة" : "Feedback type"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      category === c.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40"
                    }`}
                  >
                    {isAr ? c.ar : c.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="feedback-comment" className="text-xs text-muted-foreground">
                {isAr ? "تعليقك (اختياري)" : "Your comment (optional)"}
              </Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                placeholder={
                  isAr
                    ? "اكتب أي ملاحظة، اقتراح، أو حاجة محتاج تتحسن..."
                    : "Share any thoughts, suggestions, or things to improve..."
                }
                rows={3}
                className="resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-end">
                {comment.length}/2000
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                isAr ? "جاري الإرسال..." : "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  {isAr ? "إرسال الرأي" : "Send feedback"}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
