import { PlanId, FeatureFlag, PLANS, getFeatureAccess, getMinimumPlan } from '@/lib/plans';

export interface PlanFeatures extends Record<FeatureFlag, boolean> {
  planId: PlanId;
  reportsRemaining: number | 'unlimited';
  canGenerateReport: boolean;
  getRequiredPlan: (feature: FeatureFlag) => PlanId;
  getPlanName: (planId: PlanId, isAr: boolean) => string;
}

// SolarMatch is now fully free — every feature is unlocked for every visitor.
export function usePlanFeatures(): PlanFeatures {
  const features = getFeatureAccess('business');
  const allOn = Object.keys(features).reduce((acc, key) => {
    acc[key as FeatureFlag] = true;
    return acc;
  }, {} as Record<FeatureFlag, boolean>);

  return {
    ...allOn,
    planId: 'business',
    reportsRemaining: 'unlimited',
    canGenerateReport: true,
    getRequiredPlan: (feature: FeatureFlag) => getMinimumPlan(feature),
    getPlanName: (id: PlanId, isAr: boolean) =>
      isAr ? PLANS[id].displayNameAr : PLANS[id].displayNameEn,
  };
}
