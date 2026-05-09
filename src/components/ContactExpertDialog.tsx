import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Mail, Clock, User, Loader2, CheckCircle } from "lucide-react";
import { useUserAuth } from "@/contexts/UserAuthContext";
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
import { SolarCalculation, formatCurrency } from "@/lib/solarData";
import { leadSchema } from "@/lib/validation";

interface ContactExpertDialogProps {
  results?: SolarCalculation | null;
  locationName?: string;
  trigger?: React.ReactNode;
}

const ContactExpertDialog = ({ results, locationName, trigger }: ContactExpertDialogProps) => {
  const { t } = useTranslation();
  const { profile } = useUserAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    preferredContact: "call" | "whatsapp" | "email";
    bestTime: "morning" | "afternoon" | "evening";
  }>({
    name: "",
    phone: "",
    email: "",
    preferredContact: "call",
    bestTime: "morning",
  });

  // Prefill from logged-in user's account when the dialog opens
  useEffect(() => {
    if (open && profile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile.name || "",
        email: prev.email || profile.email || "",
        phone: prev.phone || profile.phone || "",
      }));
    }
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation with zod
    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const validatedData = validation.data;
      const { error: insertError } = await supabase
        .from('leads')
        .insert([{
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email,
          preferred_contact: validatedData.preferredContact,
          best_time: validatedData.bestTime,
          location_name: locationName || null,
          rooftop_area: results?.usableArea || null,
          kw_installed: results?.kWInstalled || null,
          estimated_cost: results?.totalCost || null,
          estimated_savings: results?.savingsYear || null,
          status: 'new',
        }]);

      if (insertError) {
        throw insertError;
      }
      
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          preferredContact: "call",
          bestTime: "morning",
        });
      }, 2000);
    } catch (err) {
      setError(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-solar text-primary-foreground shadow-glow">
            {t('results.contactExpert')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {t('contact.title')}
          </DialogTitle>
          <DialogDescription>
            {t('contact.description')}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-solar-green mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">{t('contact.success')}</p>
          </div>
        ) : !profile ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('contact.signInRequired', 'الرجاء تسجيل الدخول أولاً حتى نستخدم بيانات حسابك.')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Project Summary */}
            {results && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-muted-foreground">
                  📍 {locationName || 'Location not specified'}
                </p>
                <p className="text-muted-foreground">
                  ⚡ {results.kWInstalled} kW system
                </p>
                <p className="text-muted-foreground">
                  💰 Est. Cost: {formatCurrency(results.totalCost)}
                </p>
              </div>
            )}

            {/* Account info (read-only summary) */}
            <div className="rounded-lg border border-border/50 p-3 text-xs space-y-1 bg-card">
              <p className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" /> {profile.name}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {t('contact.phone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('contact.phonePlaceholder')}
                required
                maxLength={20}
                pattern="[0-9+\-() ]{7,20}"
                className={fieldErrors.phone ? "border-destructive" : ""}
                autoFocus
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {t('contact.bestTime')}
              </Label>
              <RadioGroup
                value={formData.bestTime}
                onValueChange={(value: "morning" | "afternoon" | "evening") => setFormData({ ...formData, bestTime: value })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning" />
                  <Label htmlFor="morning" className="text-sm cursor-pointer">{t('contact.morning')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <Label htmlFor="afternoon" className="text-sm cursor-pointer">{t('contact.afternoon')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="evening" id="evening" />
                  <Label htmlFor="evening" className="text-sm cursor-pointer">{t('contact.evening')}</Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full gradient-solar text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('contact.submitting')}
                </>
              ) : (
                t('contact.submit')
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactExpertDialog;
