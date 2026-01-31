import { Zap, DollarSign, Calendar, Leaf, Sun, TrendingUp, AlertTriangle, Gauge, Building, Users, PlugZap, Battery, Unplug } from "lucide-react";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES, costScenarios } from "@/lib/solarData";
import ResultCard from "./ResultCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface ResultsDashboardProps {
  results: SolarCalculation | null;
  isVisible: boolean;
}

const ResultsDashboard = ({ results, isVisible }: ResultsDashboardProps) => {
  if (!results || !isVisible) return null;

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
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Your Solar <span className="text-gradient-solar">Feasibility Report</span>
          </h3>
          <p className="text-muted-foreground">
            Based on your inputs and local climate data
          </p>
        </div>

        {/* Warnings */}
        {results.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Calculation Warnings</p>
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
              <h4 className="font-semibold text-foreground">Building Mode Analysis</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-foreground">{results.numberOfUnits}</p>
                <p className="text-xs text-muted-foreground">Total Units</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-foreground">{results.avgUnitConsumption}</p>
                <p className="text-xs text-muted-foreground">kWh/Unit/Month</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <p className="text-2xl font-bold text-primary">{results.effectiveMonthlyConsumption.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total kWh/Month</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border/50">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-solar-green" />
                  <p className="text-2xl font-bold text-solar-green">{formatNumber(results.unitsCovered, 1)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Units Covered</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Your solar system can cover the consumption of <span className="font-bold text-solar-green">{formatNumber(results.unitsCovered, 1)}</span> out of <span className="font-bold text-foreground">{results.numberOfUnits}</span> apartment units
            </p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <ResultCard
            icon={<Sun className="w-6 h-6" />}
            title="Installed Capacity"
            value={`${results.kWInstalled} kW`}
            subtitle={`Max: ${formatNumber(results.kWMax)} kW`}
            highlight
            delay={0}
          />
          <ResultCard
            icon={<DollarSign className="w-6 h-6" />}
            title="System Cost"
            value={formatCurrency(results.totalCost)}
            subtitle={`${scenario.label} scenario`}
            delay={100}
          />
          <ResultCard
            icon={<Zap className="w-6 h-6" />}
            title="Yearly Production"
            value={`${formatNumber(results.energyYear, 0)} kWh`}
            subtitle={`${formatNumber(results.energyMonth, 0)} kWh/month`}
            delay={200}
          />
          <ResultCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Yearly Savings"
            value={formatCurrency(results.savingsYear)}
            subtitle={`${formatCurrency(results.savingsMonth)}/month`}
            highlight
            delay={300}
          />
          <ResultCard
            icon={<Calendar className="w-6 h-6" />}
            title="Payback Period"
            value={`${formatNumber(results.paybackYears)} years`}
            subtitle="Return on investment"
            delay={400}
          />
          <ResultCard
            icon={<Leaf className="w-6 h-6" />}
            title="CO₂ Reduction"
            value={`${formatNumber(results.co2Saved)} tons`}
            subtitle="Per year saved"
            highlight
            delay={500}
          />
        </div>

        {/* Connection Recommendation */}
        {results.connectionRecommendation && (
          <div className="mb-6 animate-fade-in" style={{ animationDelay: "125ms" }}>
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
                      Recommended: {results.connectionRecommendation.systemType}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      results.connectionRecommendation.icon === "offgrid"
                        ? "bg-solar-green/20 text-solar-green"
                        : results.connectionRecommendation.icon === "hybrid"
                          ? "bg-solar-gold/20 text-solar-gold"
                          : "bg-primary/20 text-primary"
                    }`}>
                      {formatNumber(results.coverageRatio * 100, 0)}% Coverage
                    </span>
                  </div>
                  <p className="text-muted-foreground">{results.connectionRecommendation.reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coverage Ratio & Calculation Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Coverage Ratio */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              Coverage Ratio
            </h4>
            <p className="text-sm text-muted-foreground mb-4">Energy production vs consumption</p>
            
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
                  ? "✓ Full coverage + surplus" 
                  : results.coverageRatio >= 0.7 
                    ? "Good coverage" 
                    : "Partial coverage"}
              </span>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">Calculation Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">1. Usable Area</span>
                <span className="font-mono text-foreground">{formatNumber(results.usableArea, 0)} m²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">2. kW Max</span>
                <span className="font-mono text-foreground">{formatNumber(results.kWMax, 2)} kW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">3. kW Installed (×0.95)</span>
                <span className="font-mono font-bold text-primary">{results.kWInstalled} kW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">4. Energy/Year</span>
                <span className="font-mono text-foreground">{formatNumber(results.energyYear, 0)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">8. Total Cost</span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(results.totalCost)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">9. Payback</span>
                <span className="font-mono text-foreground">{formatNumber(results.paybackYears, 1)} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Production Chart */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "250ms" }}>
            <h4 className="font-display text-lg font-semibold text-foreground mb-1">Monthly Energy Production</h4>
            <p className="text-sm text-muted-foreground mb-6">kWh generated each month</p>
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
            <h4 className="font-display text-lg font-semibold text-foreground mb-1">Cumulative Savings</h4>
            <p className="text-sm text-muted-foreground mb-6">Total savings over first year (EGP)</p>
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
        <div className="mt-8 bg-gradient-to-r from-primary/10 via-solar-green/10 to-solar-gold/10 rounded-2xl border border-primary/20 p-6 md:p-8 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                Ready to Go Solar?
              </h4>
              <p className="text-muted-foreground max-w-lg">
                Based on your {results.kWInstalled} kW system, you could save approximately{" "}
                <span className="font-semibold text-primary">{formatCurrency(results.savingsYear)}</span> annually 
                and reduce your carbon footprint by <span className="font-semibold text-solar-green">{formatNumber(results.co2Saved)} tons</span> of CO₂ per year.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors">
                Download Report
              </button>
              <button className="px-6 py-3 rounded-xl gradient-solar text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-opacity">
                Contact Expert
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDashboard;
