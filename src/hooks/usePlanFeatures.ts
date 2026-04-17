import { useUserAuth } from '@/contexts/UserAuthContext';
import { PlanId, FeatureFlag, PLANS, getFeatureAccess, getMinimumPlan, dbTypeToPlanId } from '@/lib/plans';

export interface PlanFeatures extends Record<FeatureFlag, boolean> {
  planId: PlanId;
  reportsRemaining: number | 'unlimited';
  canGenerateReport: boolean;
  getRequiredPlan: (feature: FeatureFlag) => PlanId;
  getPlanName: (planId: PlanId, isAr: boolean) => string;
}

export function usePlanFeatures(): PlanFeatures {
  const { profile } = useUserAuth();

  const planId = dbTypeToPlanId(profile?.subscription_type);
  const plan = PLANS[planId];
  const features = getFeatureAccess(planId);

  // Reports remaining
  const reportsGenerated = profile?.reports_generated || 0;
  const reportsRemaining: number | 'unlimited' =
    plan.reportLimit === 'unlimited'
      ? 'unlimited'
      : Math.max(0, plan.reportLimit - reportsGenerated);

  const canGenerateReport =
    plan.reportLimit === 'unlimited' || (typeof reportsRemaining === 'number' && reportsRemaining > 0);

  const getRequiredPlan = (feature: FeatureFlag) => getMinimumPlan(feature);

  const getPlanName = (id: PlanId, isAr: boolean) =>
    isAr ? PLANS[id].displayNameAr : PLANS[id].displayNameEn;

  return {
    ...features,
    planId,
    reportsRemaining,
    canGenerateReport,
    getRequiredPlan,
    getPlanName,
  };
}
