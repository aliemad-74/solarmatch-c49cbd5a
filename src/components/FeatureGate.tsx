import { FeatureKey } from '@/hooks/useSubscription';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockOverlay?: boolean;
}

// SolarMatch is fully free — feature gates are disabled.
export default function FeatureGate({ children }: FeatureGateProps) {
  return <>{children}</>;
}
