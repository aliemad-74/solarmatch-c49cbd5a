import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/UserContext';
import { Loader2, Sun, Shield, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^[0-9+\-\(\) ]{7,20}$/, 'Invalid phone number')
});

export default function RegistrationModal({ open, onOpenChange, onSuccess }: RegistrationModalProps) {
  const { t, i18n } = useTranslation();
  const { registerUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate with Zod
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    const response = await registerUser(formData.name, formData.email, formData.phone);
    
    if (response.success) {
      onSuccess();
      onOpenChange(false);
      setFormData({ name: '', email: '', phone: '' });
    } else {
      if (response.error === 'invalid_email') {
        setErrors({ email: t('registration.invalidEmail') });
      } else if (response.error === 'invalid_phone') {
        setErrors({ phone: t('registration.invalidPhone') });
      } else {
        setErrors({ email: t('registration.error') });
      }
    }
    
    setIsSubmitting(false);
  };

  const isRTL = i18n.language === 'ar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-solar-gold/20 flex items-center justify-center">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">
            {t('registration.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('registration.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('registration.name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('registration.namePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('registration.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('registration.emailPlaceholder')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isSubmitting}
              dir="ltr"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('registration.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('registration.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={errors.phone ? 'border-destructive' : ''}
              disabled={isSubmitting}
              dir="ltr"
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          {/* Trust message */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p>{t('registration.privacyNote')}</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-solar-green" />
              <span>{t('registration.benefit1')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-solar-green" />
              <span>{t('registration.benefit2')}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-solar-gold hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('registration.submitting')}
              </>
            ) : (
              t('registration.submit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
