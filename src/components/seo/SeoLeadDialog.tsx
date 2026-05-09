import { useState, ReactNode } from "react";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface SeoLeadDialogProps {
  lang: "en" | "ar";
  topic: string;
  trigger: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SeoLeadDialog = ({ lang, topic, trigger, defaultOpen, onOpenChange }: SeoLeadDialogProps) => {
  const isAr = lang === "ar";
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    bestTime: "morning" as "morning" | "afternoon" | "evening",
  });

  const handleOpen = (o: boolean) => {
    setOpen(o);
    onOpenChange?.(o);
    if (o) trackEvent("seo_lead_open", { topic });
  };

  const submit = async () => {
    setErr(null);
    if (form.name.trim().length < 2) return setErr(isAr ? "الاسم قصير جداً" : "Name too short");
    if (!/^[0-9+\-() ]{7,20}$/.test(form.phone)) return setErr(isAr ? "رقم الموبايل غير صالح" : "Invalid phone number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr(isAr ? "البريد الإلكتروني غير صالح" : "Invalid email");

    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        preferred_contact: "call",
        best_time: form.bestTime,
        location_name: topic,
        status: "new",
      });
      if (error) throw error;
      trackEvent("seo_lead_submit", { topic });
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : isAr ? "تعذر الإرسال. حاول مجدداً." : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              {isAr ? "تم استلام طلبك" : "Request received"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "سيتواصل معك خبير الطاقة الشمسية قريباً." : "A solar expert will reach out shortly."}
            </p>
            <Button className="mt-5 w-full" onClick={() => handleOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {isAr ? "تحدث مع خبير الطاقة الشمسية" : "Talk to a solar expert"}
              </DialogTitle>
              <DialogDescription>
                {isAr
                  ? "اترك بياناتك وسنتواصل معك بدراسة جدوى مخصصة لعقارك."
                  : "Leave your details and we'll call you with a tailored feasibility study."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="seo-name">{isAr ? "الاسم" : "Name"}</Label>
                <Input id="seo-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="seo-phone">{isAr ? "رقم الموبايل" : "Phone"}</Label>
                <Input id="seo-phone" type="tel" placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="seo-email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input id="seo-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label className="block mb-2">{isAr ? "أفضل وقت للتواصل" : "Best time to contact"}</Label>
                <RadioGroup
                  value={form.bestTime}
                  onValueChange={(v) => setForm({ ...form, bestTime: v as typeof form.bestTime })}
                  className="grid grid-cols-3 gap-2"
                >
                  {(["morning", "afternoon", "evening"] as const).map((t) => (
                    <Label key={t} className="flex items-center gap-2 border rounded-md p-2 cursor-pointer text-sm">
                      <RadioGroupItem value={t} />
                      {isAr ? { morning: "صباحاً", afternoon: "ظهراً", evening: "مساءً" }[t] : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              {err && <p className="text-destructive text-xs">{err}</p>}
              <Button className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "إرسال الطلب" : "Send request"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {isAr ? "بياناتك آمنة ولن تُشارك مع أي طرف ثالث." : "Your data is safe and never shared with third parties."}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeoLeadDialog;
