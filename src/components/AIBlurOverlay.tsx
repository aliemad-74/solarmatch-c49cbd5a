import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import WaitlistModal from './WaitlistModal';

interface AIBlurOverlayProps {
  text: string;
  /** Number of sentences to show before blur */
  visibleSentences?: number;
}

export default function AIBlurOverlay({ text, visibleSentences = 2 }: AIBlurOverlayProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { canViewAIFull } = usePlanFeatures();
  const [showWaitlist, setShowWaitlist] = useState(false);

  if (canViewAIFull || !text) return null;

  // Split into sentences
  const sentences = text.split(/(?<=[.!?،؟])\s+/).filter(Boolean);
  const visible = sentences.slice(0, visibleSentences).join(' ');
  const hasMore = sentences.length > visibleSentences;

  if (!hasMore) return null;

  return (
    <>
      <div className="relative mt-3">
        <p className="text-sm text-foreground leading-relaxed">{visible}</p>
        <div className="relative h-24 mt-1 overflow-hidden">
          <p className="text-sm text-foreground leading-relaxed blur-[4px] select-none">
            {sentences.slice(visibleSentences).join(' ')}
          </p>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/80 to-card flex flex-col items-center justify-end pb-2">
            <Lock className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground font-medium mb-2">
              {isAr ? '🔒 لمشاهدة التحليل الكامل' : '🔒 To view full analysis'}
            </p>
            <Button size="sm" variant="secondary" onClick={() => setShowWaitlist(true)}>
              {isAr ? 'اشتري تقريراً — 149 جنيه' : 'Buy Report — 149 EGP'}
            </Button>
          </div>
        </div>
      </div>
      <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} planInterest="single" />
    </>
  );
}
