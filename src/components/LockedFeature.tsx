import { Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FeatureFlag, PLANS, getMinimumPlan } from '@/lib/plans';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LockedFeatureProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  /** If true, renders children grayed out with overlay. If false, hides completely. */
  showLocked?: boolean;
}

export default function LockedFeature({ feature, children, showLocked = true }: LockedFeatureProps) {
  const { i18n } = useTranslation();
  const features = usePlanFeatures();
  const isAr = i18n.language === 'ar';
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const isUnlocked = features[feature];

  if (isUnlocked) return <>{children}</>;
  if (!showLocked) return null;

  const requiredPlan = getMinimumPlan(feature);
  const planName = isAr ? PLANS[requiredPlan].displayNameAr : PLANS[requiredPlan].displayNameEn;

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <div className="opacity-40 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 backdrop-blur-[2px] rounded-lg">
          <Lock className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground font-medium text-center px-2">
            {isAr ? `🔒 متاح في خطة ${planName}` : `🔒 Available in ${planName}`}
          </span>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-sm" dir={isAr ? 'rtl' : 'ltr'}>
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-secondary" />
            </div>
            <DialogTitle className="text-lg font-display">
              {isAr ? `هذه الميزة متاحة في ${planName}` : `This feature is available in ${planName}`}
            </DialogTitle>
          </DialogHeader>
          <Button
            className="w-full gap-2 mt-4"
            onClick={() => { setShowModal(false); navigate('/pricing'); }}
          >
            {isAr ? 'ترقية الخطة' : 'Upgrade Plan'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
