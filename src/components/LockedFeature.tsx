import { FeatureFlag } from '@/lib/plans';

interface LockedFeatureProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  showLocked?: boolean;
}

// SolarMatch is fully free — every feature is always unlocked.
export default function LockedFeature({ children }: LockedFeatureProps) {
  return <>{children}</>;
}
