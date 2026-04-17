import { useTranslation } from 'react-i18next';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import WaitlistModal from './WaitlistModal';

/** Banner shown at the top of results for free users */
export default function UpgradeBanner() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { planId } = usePlanFeatures();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  if (planId !== 'free') return null;

  return (
    <>
      <div className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-primary/10 border border-secondary/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
        <TrendingUp className="w-5 h-5 text-secondary shrink-0" />
        <p className="text-sm text-foreground flex-1 text-center sm:text-start">
          {isAr
            ? 'تقريرك الأساسي جاهز. اشتري التقرير الكامل للحصول على تحليل AI كامل وتصدير PDF.'
            : 'Your basic report is ready. Buy the full report for complete AI analysis and PDF export.'}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setWaitlistOpen(true)} className="whitespace-nowrap">
          {isAr ? 'اكمل التقرير — 149 جنيه' : 'Full Report — 149 EGP'}
        </Button>
      </div>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} planInterest="single" />
    </>
  );
}
