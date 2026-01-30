import { Zap, DollarSign, Calendar, Leaf, Sun, TrendingUp } from "lucide-react";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES } from "@/lib/solarData";
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
      const monthSavings = production * (results.yearlySavings / results.yearlyProduction);
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

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <ResultCard
            icon={<Sun className="w-6 h-6" />}
            title="Installed Capacity"
            value={`${formatNumber(results.kWInstalled)} kW`}
            subtitle={`${results.panelsCount} panels`}
            highlight
            delay={0}
          />
          <ResultCard
            icon={<DollarSign className="w-6 h-6" />}
            title="System Cost"
            value={formatCurrency(results.systemCost)}
            subtitle="Total investment"
            delay={100}
          />
          <ResultCard
            icon={<Zap className="w-6 h-6" />}
            title="Yearly Production"
            value={`${formatNumber(results.yearlyProduction, 0)} kWh`}
            subtitle="Annual energy"
            delay={200}
          />
          <ResultCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Monthly Savings"
            value={formatCurrency(results.monthlySavings)}
            subtitle="Average per month"
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
            value={`${formatNumber(results.co2Reduction)} tons`}
            subtitle="Per year saved"
            highlight
            delay={500}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Production Chart */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
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
                Based on your {formatNumber(results.kWInstalled)} kW system, you could save approximately{" "}
                <span className="font-semibold text-primary">{formatCurrency(results.yearlySavings)}</span> annually 
                and reduce your carbon footprint by <span className="font-semibold text-solar-green">{formatNumber(results.co2Reduction)} tons</span> of CO₂ per year.
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
