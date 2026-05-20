import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2 } from 'lucide-react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { supabase } from '@/integrations/supabase/client';

const PHONE_REGEX = /^[0-9+\-\(\) ]{7,20}$/;

/**
 * Shown ONLY after login (Google/Apple/email) when the user's profile has no phone.
 * If profile.phone already exists (returning user, or phone was provided at email signup),
 * this modal stays hidden — fulfilling the requirement that the phone step is post-login
 * and shown only when missing.
 */
export default function PhoneCollectionGate() {
  const { t, i18n } = useTranslation();
  const { user, profile, isLoading, refreshProfile } = useUserAuth();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRTL = i18n.language === 'ar';

  // Hide on admin routes — admins manage that area separately
  const onAdminRoute = location.pathname.startsWith('/admin');

  const needsPhone = !!user && !!profile && !profile.phone && !isLoading && !onAdminRoute;

  useEffect(() => {
    if (!needsPhone) {
      setPhone('');
      setError(null);
    }
  }, [needsPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      setError(isRTL ? 'رقم هاتف غير صحيح' : 'Invalid phone number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: trimmed })
        .eq('user_id', user!.id);
      if (updateError) {
        setError(updateError.message);
      } else {
        await refreshProfile();
      }
    } catch (err) {
      setError(isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={needsPhone}>
      <DialogContent
        className="sm:max-w-md"
        dir={isRTL ? 'rtl' : 'ltr'}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-solar-gold/20 flex items-center justify-center">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-display">
            {isRTL ? 'أكمل ملفك الشخصي' : 'Complete your profile'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isRTL
              ? 'نحتاج رقم هاتفك للتواصل معك بخصوص التقارير والعروض المناسبة.'
              : 'We need your phone number so we can reach you about your reports and matched offers.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="gate-phone" className="text-sm">
              {isRTL ? 'رقم الهاتف' : 'Phone number'}
            </Label>
            <Input
              id="gate-phone"
              type="tel"
              placeholder="+20 XXX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`h-10 ${error ? 'border-destructive' : ''}`}
              disabled={submitting}
              dir="ltr"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-solar-gold hover:opacity-90"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isRTL ? 'جارٍ الحفظ...' : 'Saving...'}
              </>
            ) : isRTL ? 'حفظ ومتابعة' : 'Save and continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
