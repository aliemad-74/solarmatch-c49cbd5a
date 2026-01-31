// 25-Year ROI and Break-even Calculations for Solar Systems

export interface YearlyProjection {
  year: number;
  energyProduction: number;     // kWh (with degradation)
  savings: number;              // EGP for this year
  cumulativeSavings: number;    // Total savings to date
  netPosition: number;          // Cumulative savings - initial cost
  degradationFactor: number;    // Panel efficiency multiplier
  inflationAdjustedSavings?: number;  // Optional: inflation-adjusted
}

export interface ROIAnalysis {
  initialCost: number;
  paybackYearExact: number;     // Exact year (e.g., 5.3)
  paybackYearRounded: number;   // Rounded year for display
  totalSavings25Year: number;   // Total savings over 25 years
  totalROI: number;             // ROI percentage
  yearlyProjections: YearlyProjection[];
  netValue25Year: number;       // Total value after subtracting cost
  averageAnnualReturn: number;  // Average yearly return %
}

export interface ROIConfig {
  degradationRate: number;      // Annual panel degradation (default 0.5%)
  inflationRate?: number;       // Optional electricity price inflation
  systemLifeYears: number;      // System lifetime (default 25 years)
}

const DEFAULT_CONFIG: ROIConfig = {
  degradationRate: 0.005,       // 0.5% per year
  systemLifeYears: 25,
};

// Calculate 25-year ROI projection
export function calculateROIProjection(
  initialCost: number,
  yearlyEnergy: number,         // First year production (kWh)
  electricityPrice: number,     // EGP/kWh
  config: Partial<ROIConfig> = {}
): ROIAnalysis {
  const { degradationRate, inflationRate, systemLifeYears } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeSavings = 0;
  let paybackYear = systemLifeYears; // Default if never achieved
  let paybackAchieved = false;

  for (let year = 1; year <= systemLifeYears; year++) {
    // Calculate degradation factor (compound)
    const degradationFactor = Math.pow(1 - degradationRate, year - 1);
    
    // Energy production with degradation
    const energyProduction = yearlyEnergy * degradationFactor;
    
    // Base savings for this year
    let savings = energyProduction * electricityPrice;
    
    // Optional: Apply electricity price inflation
    let inflationAdjustedSavings: number | undefined;
    if (inflationRate && inflationRate > 0) {
      const inflationFactor = Math.pow(1 + inflationRate, year - 1);
      inflationAdjustedSavings = savings * inflationFactor;
    }
    
    // Cumulative savings
    cumulativeSavings += inflationAdjustedSavings ?? savings;
    
    // Net position (profit/loss)
    const netPosition = cumulativeSavings - initialCost;
    
    // Check for payback year
    if (!paybackAchieved && netPosition >= 0) {
      // Calculate exact payback year with interpolation
      const previousCumulative = cumulativeSavings - (inflationAdjustedSavings ?? savings);
      const previousNetPosition = previousCumulative - initialCost;
      const yearlyAmount = inflationAdjustedSavings ?? savings;
      
      if (yearlyAmount > 0) {
        const fractionOfYear = Math.abs(previousNetPosition) / yearlyAmount;
        paybackYear = year - 1 + fractionOfYear;
      }
      paybackAchieved = true;
    }
    
    yearlyProjections.push({
      year,
      energyProduction: Math.round(energyProduction),
      savings: Math.round(savings),
      cumulativeSavings: Math.round(cumulativeSavings),
      netPosition: Math.round(netPosition),
      degradationFactor,
      inflationAdjustedSavings: inflationAdjustedSavings 
        ? Math.round(inflationAdjustedSavings) 
        : undefined,
    });
  }

  const totalSavings25Year = cumulativeSavings;
  const netValue25Year = totalSavings25Year - initialCost;
  const totalROI = initialCost > 0 
    ? ((totalSavings25Year - initialCost) / initialCost) * 100 
    : 0;
  const averageAnnualReturn = totalROI / systemLifeYears;

  return {
    initialCost,
    paybackYearExact: paybackYear,
    paybackYearRounded: Math.ceil(paybackYear),
    totalSavings25Year: Math.round(totalSavings25Year),
    totalROI: Math.round(totalROI * 10) / 10,
    yearlyProjections,
    netValue25Year: Math.round(netValue25Year),
    averageAnnualReturn: Math.round(averageAnnualReturn * 10) / 10,
  };
}

// Get milestone years for highlighting
export function getMilestones(analysis: ROIAnalysis): { year: number; label: string; value: number }[] {
  const milestones: { year: number; label: string; value: number }[] = [];
  
  // Payback milestone
  milestones.push({
    year: analysis.paybackYearRounded,
    label: 'Break-even',
    value: 0,
  });
  
  // 10-year mark
  if (analysis.yearlyProjections.length >= 10) {
    milestones.push({
      year: 10,
      label: '10 Years',
      value: analysis.yearlyProjections[9].netPosition,
    });
  }
  
  // 25-year mark
  if (analysis.yearlyProjections.length >= 25) {
    milestones.push({
      year: 25,
      label: '25 Years',
      value: analysis.netValue25Year,
    });
  }
  
  return milestones;
}

// Format ROI data for chart display
export function formatROIChartData(analysis: ROIAnalysis) {
  return analysis.yearlyProjections.map(proj => ({
    year: proj.year,
    name: `Year ${proj.year}`,
    cumulative: proj.cumulativeSavings,
    net: proj.netPosition,
    production: proj.energyProduction,
    isPaybackYear: proj.year === analysis.paybackYearRounded,
  }));
}
