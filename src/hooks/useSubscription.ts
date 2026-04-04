import { useUserAuth } from '@/contexts/UserAuthContext';

export type SubscriptionType = 'free' | 'single_report' | 'premium' | 'business';

export interface SubscriptionInfo {
  type: SubscriptionType;
  status: string;
  canGenerateReport: boolean;
  remainingReports: number;
  isFeatureAvailable: (feature: FeatureKey) => boolean;
  getFeatureGate: (feature: FeatureKey) => { locked: boolean; requiredPlan: string };
}

export type FeatureKey =
  | 'pdf_export'
  | 'report_history'
  | 'full_ai_advisor'
  | 'system_comparison'
  | 'report_sharing'
  | 'sensitivity_scenarios'
  | 'confidence_score'
  | 'ai_verification'
  | 'live_tariffs'
  | 'live_market_prices'
  | 'priority_processing'
  | 'contact_expert'
  | 'unlimited_reports'
  | 'team_access'
  | 'csv_export'
  | 'white_label'
  | 'lead_management'
  | 'advanced_analytics'
  | 'business_dashboard'
  | 'full_financial_analysis'
  | 'full_ai_explanation';

const FEATURE_PLANS: Record<FeatureKey, SubscriptionType[]> = {
  pdf_export: ['single_report', 'premium', 'business'],
  report_history: ['single_report', 'premium', 'business'],
  full_ai_advisor: ['premium', 'business'],
  system_comparison: ['single_report', 'premium', 'business'],
  report_sharing: ['single_report', 'premium', 'business'],
  sensitivity_scenarios: ['premium', 'business'],
  confidence_score: ['premium', 'business'],
  ai_verification: ['premium', 'business'],
  live_tariffs: ['premium', 'business'],
  live_market_prices: ['premium', 'business'],
  priority_processing: ['premium', 'business'],
  contact_expert: ['premium', 'business'],
  unlimited_reports: ['business'],
  team_access: ['business'],
  csv_export: ['business'],
  white_label: ['business'],
  lead_management: ['business'],
  advanced_analytics: ['business'],
  business_dashboard: ['business'],
  full_financial_analysis: ['single_report', 'premium', 'business'],
  full_ai_explanation: ['single_report', 'premium', 'business'],
};

const PLAN_HIERARCHY: SubscriptionType[] = ['free', 'single_report', 'premium', 'business'];

function getRequiredPlan(feature: FeatureKey): string {
  const plans = FEATURE_PLANS[feature];
  if (!plans || plans.length === 0) return 'Premium';
  if (plans.includes('single_report')) return 'Single Report';
  if (plans.includes('premium')) return 'Premium';
  return 'Business';
}

const PLAN_REPORT_LIMITS: Record<SubscriptionType, number> = {
  free: 1,
  single_report: 1,
  premium: 20,
  business: 999999,
};

export function useSubscription(): SubscriptionInfo {
  const { profile } = useUserAuth();

  const type: SubscriptionType = (profile?.subscription_type as SubscriptionType) || 'free';
  const status = profile?.subscription_status || 'active';
  const extraReports = profile?.extra_reports_balance || 0;
  const reportsGenerated = profile?.reports_generated || 0;
  const baseLimit = PLAN_REPORT_LIMITS[type];
  const totalLimit = baseLimit + extraReports;
  const remaining = Math.max(0, totalLimit - reportsGenerated);
  const canGenerateReport = status === 'active' && remaining > 0;

  const isFeatureAvailable = (feature: FeatureKey): boolean => {
    if (status !== 'active') return false;
    const allowedPlans = FEATURE_PLANS[feature];
    if (!allowedPlans) return false;
    return allowedPlans.includes(type);
  };

  const getFeatureGate = (feature: FeatureKey) => {
    const locked = !isFeatureAvailable(feature);
    return { locked, requiredPlan: getRequiredPlan(feature) };
  };

  return {
    type,
    status,
    canGenerateReport,
    remainingReports: remaining,
    isFeatureAvailable,
    getFeatureGate,
  };
}
