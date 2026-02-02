import { Zap, DollarSign, Calendar, Leaf, Sun, TrendingUp, AlertTriangle, Gauge, Building, Users, PlugZap, Battery, Unplug, Package, Download, Loader2, Share2, Printer, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES, costScenarios, systemPackages, PackageType } from "@/lib/solarData";
import { ShareableParams } from "@/lib/shareUtils";
import ResultCard from "./ResultCard";
import ROITimeline from "./ROITimeline";
import ShareDialog from "./ShareDialog";
import ContactExpertDialog from "./ContactExpertDialog";
import AIAdvisor from "./AIAdvisor";
import IdealSizingCard from "./IdealSizingCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { generateSolarReport } from "@/lib/pdfReport";
import { useState } from "react";

interface ResultsDashboardProps {
  results: SolarCalculation | null;
  isVisible: boolean;
  locationName?: string;
  shareableParams?: ShareableParams;
  monthlyConsumption?: number;
  pvType?: string;
  buildingType?: string;
}

const ResultsDashboard = ({ results, isVisible, locationName, shareableParams, monthlyConsumption = 500, pvType = "B_standard_mono", buildingType = "apartment" }: ResultsDashboardProps) => {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!results || !isVisible) return null;

  const handleDownloadReport = async () => {
    if (!results || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    try {
      await generateSolarReport(results, locationName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare chart data
  const monthlyData = MONTH_NAMES.map((month, index) => ({
    month,
    production: Math.round(results.monthlyProduction[index]),
  }));

  const cumulativeSavings = results.monthlyProduction.reduce<{ month: string; savings: number; cumulative: number }[]>(
    (acc, production, index) => {
      const monthSavings = production * (results.savingsYear / results.energyYear);
      const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({
        month: MONTH_NAMES[index],
        savings: Math.round(monthSavings),
        cumulative: Math.round(prevCumulative + monthSavings),
      });
      return acc;
    },
    []
  );

  const coveragePercent = Math.min(results.coverageRatio * 100, 200);
  const scenario = costScenarios[results.costScenario];

  return (
    <section className="container mx-auto px-4 py-12 print:py-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-fade-in print:mb-4">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t('results.title')} <span className="text-gradient-solar">{t('results.titleHighlight')}</span>
          </h3>
          <p className="text-muted-foreground">
            {t('results.subtitle')}
          </p>
        </div>

        {/* Warnings */}
        {results.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-fade-in print:hidden">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{t('results.warnings')}</p>
                <ul className="mt-1 space-y-1">
                  {results.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-destructive/80">{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Building Mode Stats */}
        {results.buildingMode && (
          <div className="mb-6 p-5 bg-gradient-to-r from-primary/5 to-solar-green/5 border border-primary/20 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">{t('results.buildingModeAnalysis')}</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-foreground">{results.numberOfUnits}</p>
                <p className="text-xs text-muted-foreground">{t('results.totalUnits')}</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-foreground">{results.avgUnitConsumption}</p>
                <p className="text-xs text-muted-foreground">{t('results.kWhUnitMonth')}</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-primary">{results.effectiveMonthlyConsumption.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('results.totalKWhMonth')}</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-solar-green" />
                  <p className="text-2xl font-bold text-solar-green">{formatNumber(results.unitsCovered, 1)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t('results.unitsCovered')}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              {t('results.unitsMessage', { covered: formatNumber(results.unitsCovered, 1), total: results.numberOfUnits })}
            </p>
          </div>
        )}

        {/* System Package Options */}
        {results.packageOptions && results.packageOptions.length > 0 && (
          <div className="mb-10 animate-fade-in print:mb-4" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h4 className="font-display text-lg font-semibold text-foreground">{t('results.packageOptions')}</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {results.packageOptions.map((option, index) => {
                const isSelected = option.packageKey === results.selectedPackage;
                const bgColors = {
                  economy: "from-solar-green/5 to-solar-green/10",
                  standard: "from-primary/5 to-primary/10", 
                  premium: "from-solar-gold/5 to-solar-gold/10",
                };
                const borderColors = {
                  economy: isSelected ? "border-solar-green" : "border-solar-green/30",
                  standard: isSelected ? "border-primary" : "border-primary/30",
                  premium: isSelected ? "border-solar-gold" : "border-solar-gold/30",
                };
                const accentColors = {
                  economy: "text-solar-green",
                  standard: "text-primary",
                  premium: "text-solar-gold",
                };
                
                return (
                  <div 
                    key={option.packageKey}
                    className={`relative p-5 rounded-xl border-2 bg-gradient-to-br ${bgColors[option.packageKey as keyof typeof bgColors]} ${borderColors[option.packageKey as keyof typeof borderColors]} transition-all ${isSelected ? "shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
                  >
                    {isSelected && (
                      <div className={`absolute -top-3 left-4 px-2 py-0.5 text-xs font-semibold rounded-full bg-card border ${borderColors[option.packageKey as keyof typeof borderColors]} ${accentColors[option.packageKey as keyof typeof accentColors]}`}>
                        {t('results.selected')}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <h5 className={`font-display text-lg font-bold ${accentColors[option.packageKey as keyof typeof accentColors]}`}>
                        {option.package.name}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {option.package.efficiency} efficiency • {option.package.areaPerKW} m²/kW
                      </p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('results.costPerKW')}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {option.package.costPerKW.toLocaleString()} EGP
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('results.installed')}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {option.kWInstalled} kW
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-sm font-medium text-foreground">{t('results.totalCost')}</span>
                        <span className={`font-mono text-lg font-bold ${accentColors[option.packageKey as keyof typeof accentColors]}`}>
                          {formatCurrency(option.totalCost)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                      {option.package.justification}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{formatNumber(option.energyYear, 0)} kWh</p>
                        <p className="text-muted-foreground">{t('results.yearly')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{formatNumber(option.paybackYears, 1)} yrs</p>
                        <p className="text-muted-foreground">{t('results.payback')}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <LayoutGrid className="w-3 h-3 text-muted-foreground" />
                          <p className="font-semibold text-foreground">{option.panelCount}</p>
                        </div>
                        <p className="text-muted-foreground">{t('results.panels')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 print:mb-4">
          <ResultCard
            icon={<Sun className="w-6 h-6" />}
            title={t('results.installedCapacity')}
            value={`${results.kWInstalled} kW`}
            subtitle={`Max: ${formatNumber(results.kWMax)} kW`}
            highlight
            delay={0}
          />
          <ResultCard
            icon={<Zap className="w-6 h-6" />}
            title={t('results.yearlyProduction')}
            value={`${formatNumber(results.energyYear, 0)} kWh`}
            subtitle={`${formatNumber(results.energyMonth, 0)} kWh/month`}
            delay={100}
          />
          <ResultCard
            icon={<TrendingUp className="w-6 h-6" />}
            title={t('results.yearlySavings')}
            value={formatCurrency(results.savingsYear)}
            subtitle={`${formatCurrency(results.savingsMonth)}/month`}
            highlight
            delay={200}
          />
          <ResultCard
            icon={<Calendar className="w-6 h-6" />}
            title={t('results.paybackPeriod')}
            value={`${formatNumber(results.paybackYears)} years`}
            subtitle={t('results.returnOnInvestment')}
            delay={300}
          />
          <ResultCard
            icon={<Leaf className="w-6 h-6" />}
            title={t('results.co2Reduction')}
            value={`${formatNumber(results.co2Saved)} tons`}
            subtitle={t('results.perYearSaved')}
            highlight
            delay={400}
          />
        </div>

        {/* Connection Recommendation */}
        {results.connectionRecommendation && (
          <div className="mb-6 animate-fade-in print:hidden" style={{ animationDelay: "125ms" }}>
            <div className={`p-5 rounded-xl border ${
              results.connectionRecommendation.icon === "offgrid" 
                ? "bg-solar-green/10 border-solar-green/30" 
                : results.connectionRecommendation.icon === "hybrid"
                  ? "bg-solar-gold/10 border-solar-gold/30"
                  : "bg-primary/10 border-primary/30"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  results.connectionRecommendation.icon === "offgrid"
                    ? "bg-solar-green/20"
                    : results.connectionRecommendation.icon === "hybrid"
                      ? "bg-solar-gold/20"
                      : "bg-primary/20"
                }`}>
                  {results.connectionRecommendation.icon === "offgrid" ? (
                    <Unplug className="w-6 h-6 text-solar-green" />
                  ) : results.connectionRecommendation.icon === "hybrid" ? (
                    <Battery className="w-6 h-6 text-solar-gold" />
                  ) : (
                    <PlugZap className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display text-lg font-semibold text-foreground">
                      {t('results.recommended')}: {results.connectionRecommendation.systemType}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      results.connectionRecommendation.icon === "offgrid"
                        ? "bg-solar-green/20 text-solar-green"
                        : results.connectionRecommendation.icon === "hybrid"
                          ? "bg-solar-gold/20 text-solar-gold"
                          : "bg-primary/20 text-primary"
                    }`}>
                      {formatNumber(results.coverageRatio * 100, 0)}% {t('results.coverage')}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{results.connectionRecommendation.reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Solar Advisor */}
        <div className="mb-6 animate-fade-in print:hidden" style={{ animationDelay: "130ms" }}>
          <AIAdvisor 
            results={results}
            locationName={locationName || ''}
            monthlyConsumption={monthlyConsumption}
            pvType={pvType}
            buildingType={buildingType}
          />
        </div>

        {/* Coverage Ratio & Calculation Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Coverage Ratio */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              {t('results.coverageRatio')}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">{t('results.energyVsConsumption')}</p>
            
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-3">
              <div 
                className="absolute h-full bg-gradient-to-r from-primary to-solar-green rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(coveragePercent, 100)}%` }}
              />
              {coveragePercent > 100 && (
                <div 
                  className="absolute h-full bg-solar-gold/50 rounded-full"
                  style={{ left: '100%', width: `${Math.min(coveragePercent - 100, 100)}%`, transform: 'translateX(-100%)' }}
                />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-foreground">{formatNumber(results.coverageRatio * 100, 0)}%</span>
              <span className="text-sm text-muted-foreground">
                {results.coverageRatio >= 1 
                  ? `✓ ${t('results.fullCoverage')}` 
                  : results.coverageRatio >= 0.7 
                    ? t('results.goodCoverage')
                    : t('results.partialCoverage')}
              </span>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">{t('results.calculationBreakdown')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">1. {t('results.usableArea')}</span>
                <span className="font-mono text-foreground">{formatNumber(results.usableArea, 0)} m²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">2. kW Max</span>
                <span className="font-mono text-foreground">{formatNumber(results.kWMax, 2)} kW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">3. kW {t('results.installed')} (×0.95)</span>
                <span className="font-mono font-bold text-primary">{results.kWInstalled} kW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">4. Energy/Year</span>
                <span className="font-mono text-foreground">{formatNumber(results.energyYear, 0)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50 bg-primary/5 -mx-2 px-2 rounded">
                <span className="text-muted-foreground flex items-center gap-1">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  5. {t('results.panelsNeeded')}
                </span>
                <span className="font-mono font-bold text-primary">{results.panelCount} × {results.panelWattage}W</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">6. {t('results.totalCost')}</span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(results.totalCost)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">7. {t('results.payback')}</span>
                <span className="font-mono text-foreground">{formatNumber(results.paybackYears, 1)} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ideal System Sizing Analysis */}
        {results.idealSizing && (
          <div className="mb-6 print:hidden">
            <IdealSizingCard analysis={results.idealSizing} />
          </div>
        )}

        {/* 25-Year ROI Timeline */}
        <div className="mb-6 print:hidden">
          <ROITimeline
            initialCost={results.totalCost}
            yearlyEnergy={results.energyYear}
            electricityPrice={results.climateData?.location ? (results.savingsYear / results.energyYear) : 1.95}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 print:hidden">
          {/* Monthly Production Chart */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "250ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1">{t('results.monthlyProduction')}</h4>
            <p className="text-sm text-muted-foreground mb-6">{t('results.kWhGenerated')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(value: number) => [`${value.toLocaleString()} kWh`, "Production"]}
                  />
                  <Bar 
                    dataKey="production" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Savings Chart */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1">{t('results.cumulativeSavings')}</h4>
            <p className="text-sm text-muted-foreground mb-6">{t('results.totalSavingsFirstYear')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeSavings}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--solar-gold))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--solar-gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(value: number) => [formatCurrency(value), "Cumulative"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--solar-gold))"
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-8 bg-gradient-to-r from-primary/10 via-solar-green/10 to-solar-gold/10 rounded-2xl border border-primary/20 p-6 md:p-8 animate-slide-up print:mt-4" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                {t('results.readyToGoSolar')}
              </h4>
              <p className="text-muted-foreground max-w-lg">
                {t('results.readyMessage', {
                  kw: results.kWInstalled,
                  savings: formatCurrency(results.savingsYear),
                  co2: formatNumber(results.co2Saved),
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <button 
                onClick={handleDownloadReport}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isGeneratingPdf ? "..." : t('results.downloadReport')}
              </button>
              
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                <Printer className="w-4 h-4" />
                {t('results.printReport')}
              </button>

              {shareableParams && (
                <ShareDialog 
                  params={shareableParams}
                  trigger={
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors">
                      <Share2 className="w-4 h-4" />
                      {t('results.shareResults')}
                    </button>
                  }
                />
              )}
              
              <ContactExpertDialog 
                results={results}
                locationName={locationName}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDashboard;
