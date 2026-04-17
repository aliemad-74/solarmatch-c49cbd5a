import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type State = "loading" | "valid" | "invalid" | "already" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const isAr = i18n.language === "ar";

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(r => r.json())
      .then(data => {
        if (data.valid === true) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) setState("error");
    else if (data?.success || data?.reason === "already_unsubscribed") setState("done");
    else setState("error");
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {state === "loading" && (<><Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" /><p>{isAr ? "جاري التحقق..." : "Verifying..."}</p></>)}
        {state === "valid" && (<>
          <MailX className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">{isAr ? "إلغاء الاشتراك" : "Unsubscribe"}</h1>
          <p className="text-muted-foreground">{isAr ? "هل أنت متأكد من رغبتك في عدم تلقي رسائل البريد الإلكتروني من SolarMatch؟" : "Are you sure you want to stop receiving emails from SolarMatch?"}</p>
          <Button onClick={confirm} size="lg" className="w-full">{isAr ? "تأكيد إلغاء الاشتراك" : "Confirm Unsubscribe"}</Button>
        </>)}
        {state === "submitting" && (<><Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" /><p>{isAr ? "جاري المعالجة..." : "Processing..."}</p></>)}
        {state === "done" && (<>
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
          <h1 className="text-2xl font-bold">{isAr ? "تم إلغاء الاشتراك" : "Unsubscribed"}</h1>
          <p className="text-muted-foreground">{isAr ? "لن تتلقى المزيد من الرسائل. يمكنك إغلاق هذه الصفحة." : "You won't receive further emails. You can close this page."}</p>
        </>)}
        {state === "already" && (<>
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
          <h1 className="text-2xl font-bold">{isAr ? "تم بالفعل" : "Already Unsubscribed"}</h1>
          <p className="text-muted-foreground">{isAr ? "هذا البريد ملغى الاشتراك بالفعل." : "This email is already unsubscribed."}</p>
        </>)}
        {(state === "invalid" || state === "error") && (<>
          <XCircle className="w-12 h-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">{isAr ? "رابط غير صالح" : "Invalid Link"}</h1>
          <p className="text-muted-foreground">{isAr ? "هذا الرابط غير صالح أو منتهي الصلاحية." : "This link is invalid or expired."}</p>
        </>)}
      </Card>
    </div>
  );
}
