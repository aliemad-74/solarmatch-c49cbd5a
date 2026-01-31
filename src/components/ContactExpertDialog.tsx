import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MessageCircle, Clock, User, Loader2, CheckCircle } from "lucide-react";
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

interface ContactExpertDialogProps {
  results?: SolarCalculation | null;
  locationName?: string;
  trigger?: React.ReactNode;
}

const ContactExpertDialog = ({ results, locationName, trigger }: ContactExpertDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    preferredContact: "call",
    bestTime: "morning",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          preferred_contact: formData.preferredContact,
          best_time: formData.bestTime,
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

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {t('contact.name')}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('contact.namePlaceholder')}
                required
              />
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
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t('contact.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('contact.emailPlaceholder')}
                required
              />
            </div>

            {/* Preferred Contact Method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                {t('contact.preferredContact')}
              </Label>
              <RadioGroup
                value={formData.preferredContact}
                onValueChange={(value) => setFormData({ ...formData, preferredContact: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="call" id="call" />
                  <Label htmlFor="call" className="text-sm cursor-pointer">{t('contact.call')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="text-sm cursor-pointer">{t('contact.whatsapp')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-option" />
                  <Label htmlFor="email-option" className="text-sm cursor-pointer">{t('contact.emailOption')}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Best Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {t('contact.bestTime')}
              </Label>
              <RadioGroup
                value={formData.bestTime}
                onValueChange={(value) => setFormData({ ...formData, bestTime: value })}
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
