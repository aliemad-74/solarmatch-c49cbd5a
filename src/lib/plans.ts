// Central plan definitions — single source of truth for all feature gating
export type PlanId = 'free' | 'single' | 'premium' | 'business';

export interface PlanDefinition {
  id: PlanId;
  price: number;
  currency: 'EGP';
  period: 'once' | 'month' | 'free';
  reportLimit: number | 'unlimited';
  displayNameAr: string;
  displayNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  highlighted?: boolean;
  badgeAr?: string;
  badgeEn?: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    price: 0,
    currency: 'EGP',
    period: 'free',
    reportLimit: 1,
    displayNameAr: 'مجاني',
    displayNameEn: 'Free',
    descriptionAr: 'جرّب SolarMatch بتقرير مجاني واحد',
    descriptionEn: 'Try SolarMatch with one free report',
  },
  single: {
    id: 'single',
    price: 149,
    currency: 'EGP',
    period: 'once',
    reportLimit: 1,
    displayNameAr: 'تقرير احترافي',
    displayNameEn: 'Professional Report',
    descriptionAr: 'تقرير تحليل شمسي كامل ومفصل',
    descriptionEn: 'One full detailed solar analysis report',
  },
  premium: {
    id: 'premium',
    price: 599,
    currency: 'EGP',
    period: 'month',
    reportLimit: 'unlimited',
    displayNameAr: 'الخطة الاحترافية',
    displayNameEn: 'Premium',
    descriptionAr: 'وصول كامل للأفراد والمهندسين',
    descriptionEn: 'Full access for individuals and engineers',
    highlighted: true,
    badgeAr: 'الأكثر شيوعاً ⭐',
    badgeEn: 'Most Popular ⭐',
  },
  business: {
    id: 'business',
    price: 2499,
    currency: 'EGP',
    period: 'month',
    reportLimit: 'unlimited',
    displayNameAr: 'خطة الأعمال',
    displayNameEn: 'Business',
    descriptionAr: 'للشركات والمقاولين وفرق العمل',
    descriptionEn: 'For companies, contractors, and teams',
  },
};

// Features included per plan — true means included
export type FeatureFlag =
  | 'canExportPDF'
  | 'canShareReport'
  | 'canViewAIFull'
  | 'canViewAIAdvisor'
  | 'canViewConfidenceScore'
  | 'canViewSensitivity'
  | 'canViewPackageComparison'
  | 'canViewROIChart'
  | 'canViewLivePrices'
  | 'canContactExpert'
  | 'canSaveHistory'
  | 'canCompareReports'
  | 'canWhiteLabel'
  | 'canExportCSV'
  | 'canManageTeam'
  | 'canViewTechSpecs';

const FEATURE_MATRIX: Record<FeatureFlag, PlanId[]> = {
  canExportPDF:             ['single', 'premium', 'business'],
  canShareReport:           ['single', 'premium', 'business'],
  canViewAIFull:            ['single', 'premium', 'business'],
  canViewAIAdvisor:         ['premium', 'business'],
  canViewConfidenceScore:   ['single', 'premium', 'business'],
  canViewSensitivity:       ['single', 'premium', 'business'],
  canViewPackageComparison: ['single', 'premium', 'business'],
  canViewROIChart:          ['single', 'premium', 'business'],
  canViewLivePrices:        ['single', 'premium', 'business'],
  canContactExpert:         ['single', 'premium', 'business'],
  canSaveHistory:           ['single', 'premium', 'business'],
  canCompareReports:        ['premium', 'business'],
  canWhiteLabel:            ['business'],
  canExportCSV:             ['business'],
  canManageTeam:            ['business'],
  canViewTechSpecs:         ['premium', 'business'],
};

export function getFeatureAccess(planId: PlanId): Record<FeatureFlag, boolean> {
  const result = {} as Record<FeatureFlag, boolean>;
  for (const [feature, plans] of Object.entries(FEATURE_MATRIX)) {
    result[feature as FeatureFlag] = plans.includes(planId);
  }
  return result;
}

// Get minimum plan required for a feature
export function getMinimumPlan(feature: FeatureFlag): PlanId {
  const plans = FEATURE_MATRIX[feature];
  if (plans.includes('single')) return 'single';
  if (plans.includes('premium')) return 'premium';
  return 'business';
}

// Map subscription_type DB values to PlanId
export function dbTypeToPlanId(dbType: string | undefined | null): PlanId {
  switch (dbType) {
    case 'single_report':
    case 'single':
      return 'single';
    case 'premium':
      return 'premium';
    case 'business':
      return 'business';
    default:
      return 'free';
  }
}
