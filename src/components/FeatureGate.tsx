import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription, FeatureKey } from '@/hooks/useSubscription';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockOverlay?: boolean;
}

export default function FeatureGate({ feature, children, fallback, showLockOverlay = true }: FeatureGateProps) {
  const { t } = useTranslation();
  const { getFeatureGate } = useSubscription();
  const { locked, requiredPlan } = getFeatureGate(feature);

  if (!locked) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  if (!showLockOverlay) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative opacity-50 pointer-events-none select-none">
          {children}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[1px] rounded-lg">
            <Lock className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground font-medium">
              {t('pricing.availableIn', { plan: requiredPlan })}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('pricing.upgradeToAccess', { plan: requiredPlan })}</p>
      </TooltipContent>
    </Tooltip>
  );
}
