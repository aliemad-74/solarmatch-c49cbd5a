// SolarMatch is fully free — this hook now always grants access to every feature.
export type SubscriptionType = 'free' | 'single_report' | 'premium' | 'business';

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

export interface SubscriptionInfo {
  type: SubscriptionType;
  status: string;
  canGenerateReport: boolean;
  remainingReports: number;
  isFeatureAvailable: (feature: FeatureKey) => boolean;
  getFeatureGate: (feature: FeatureKey) => { locked: boolean; requiredPlan: string };
}

export function useSubscription(): SubscriptionInfo {
  return {
    type: 'business',
    status: 'active',
    canGenerateReport: true,
    remainingReports: Number.POSITIVE_INFINITY,
    isFeatureAvailable: () => true,
    getFeatureGate: () => ({ locked: false, requiredPlan: '' }),
  };
}
