import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planInterest?: string;
}

export default function WaitlistModal({ open, onOpenChange, planInterest = 'premium' }: WaitlistModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('waitlist' as any).insert({ email, plan_interest: planInterest } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error(isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSubmitted(false); setEmail(''); } }}>
      <DialogContent className="sm:max-w-sm" dir={isAr ? 'rtl' : 'ltr'}>
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-solar-green mx-auto mb-3" />
            <p className="font-display font-bold text-lg">
              {isAr ? 'تم التسجيل بنجاح!' : 'Successfully registered!'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isAr ? 'سنتواصل معك عند إطلاق نظام الدفع.' : "We'll contact you when payments launch."}
            </p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>
              {isAr ? 'حسناً' : 'OK'}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-secondary" />
              </div>
              <DialogTitle className="text-lg font-display">
                {isAr ? 'شكراً لاهتمامك!' : 'Thanks for your interest!'}
              </DialogTitle>
              <DialogDescription>
                {isAr
                  ? 'نظام الدفع قيد الإطلاق قريباً. سنتواصل معك عند الإطلاق.'
                  : 'Payment system launching soon. We\'ll contact you when it\'s ready.'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <Input
                type="email"
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
              <Button className="w-full" onClick={handleSubmit} disabled={loading || !email.includes('@')}>
                {loading
                  ? (isAr ? 'جاري التسجيل...' : 'Submitting...')
                  : (isAr ? 'أعلمني عند الإطلاق' : 'Notify me at launch')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
