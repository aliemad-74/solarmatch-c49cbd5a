import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import WaitlistModal from './WaitlistModal';

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LimitReachedModal({ open, onOpenChange }: LimitReachedModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState('single');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" dir={isAr ? 'rtl' : 'ltr'}>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl font-display">
              {isAr ? 'استخدمت تقريرك المجاني' : 'Free report used'}
            </DialogTitle>
            <DialogDescription>
              {isAr ? 'اختر كيف تريد الاستمرار:' : 'Choose how to continue:'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: Single Report */}
            <button
              onClick={() => { onOpenChange(false); setWaitlistPlan('single'); setWaitlistOpen(true); }}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary/40 transition-all bg-card text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{isAr ? 'تقرير واحد' : 'Single Report'}</p>
                <p className="text-lg font-bold text-primary mt-1">149 {isAr ? 'جنيه' : 'EGP'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'دفعة واحدة' : 'One-time'}</p>
              </div>
            </button>

            {/* Option B: Premium */}
            <button
              onClick={() => { onOpenChange(false); setWaitlistPlan('premium'); setWaitlistOpen(true); }}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-secondary/50 bg-secondary/5 hover:bg-secondary/10 transition-all text-center"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{isAr ? 'اشتراك شهري' : 'Monthly Plan'}</p>
                <p className="text-lg font-bold text-secondary mt-1">599 {isAr ? 'جنيه/شهر' : 'EGP/mo'}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'تقارير غير محدودة' : 'Unlimited reports'}</p>
              </div>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => { onOpenChange(false); navigate('/pricing'); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {isAr ? 'البيزنس خطة؟' : 'Need Business plan?'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} planInterest={waitlistPlan} />
    </>
  );
}
