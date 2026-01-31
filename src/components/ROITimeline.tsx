import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Target, DollarSign, Percent, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { calculateROIProjection, formatROIChartData, ROIAnalysis } from "@/lib/roiProjections";
import { formatCurrency, formatNumber } from "@/lib/solarData";

interface ROITimelineProps {
  initialCost: number;
  yearlyEnergy: number;
  electricityPrice: number;
}

const ROITimeline = ({ initialCost, yearlyEnergy, electricityPrice }: ROITimelineProps) => {
  const { t } = useTranslation();
  const [includeInflation, setIncludeInflation] = useState(false);

  // Calculate ROI projections
  const analysis = calculateROIProjection(
    initialCost,
    yearlyEnergy,
    electricityPrice,
    includeInflation ? { inflationRate: 0.05 } : {}
  );

  const chartData = formatROIChartData(analysis);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{t('roi.year')} {data.year}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              {t('roi.cumulative')}: <span className="font-medium text-solar-gold">{formatCurrency(data.cumulative)}</span>
            </p>
            <p className="text-muted-foreground">
              {t('roi.net')}: <span className={`font-medium ${data.net >= 0 ? 'text-solar-green' : 'text-destructive'}`}>
                {formatCurrency(data.net)}
              </span>
            </p>
          </div>
          {data.isPaybackYear && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-primary font-medium">🎯 {t('roi.breakeven')}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('roi.title')}
          </h4>
          <p className="text-sm text-muted-foreground">{t('roi.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="inflation-toggle"
            checked={includeInflation}
            onCheckedChange={setIncludeInflation}
          />
          <Label htmlFor="inflation-toggle" className="text-xs text-muted-foreground cursor-pointer">
            {t('roi.showInflation')}
          </Label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary/10 rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{formatNumber(analysis.paybackYearExact, 1)}</p>
          <p className="text-xs text-muted-foreground">{t('roi.breakeven')} ({t('common.years')})</p>
        </div>
        <div className="bg-solar-gold/10 rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-solar-gold mx-auto mb-2" />
          <p className="text-2xl font-bold text-solar-gold">{formatCurrency(analysis.totalSavings25Year)}</p>
          <p className="text-xs text-muted-foreground">{t('roi.totalSavings')}</p>
        </div>
        <div className="bg-solar-green/10 rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-solar-green mx-auto mb-2" />
          <p className="text-2xl font-bold text-solar-green">{formatCurrency(analysis.netValue25Year)}</p>
          <p className="text-xs text-muted-foreground">{t('roi.netValue')}</p>
        </div>
        <div className="bg-accent/10 rounded-xl p-4 text-center">
          <Percent className="w-5 h-5 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent">{analysis.totalROI}%</p>
          <p className="text-xs text-muted-foreground">{t('roi.totalROI')}</p>
        </div>
      </div>

      {/* ROI Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--solar-green))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--solar-green))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--solar-gold))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--solar-gold))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line for break-even */}
            <ReferenceLine
              x={analysis.paybackYearRounded}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Break-even",
                position: "top",
                fill: "hsl(var(--primary))",
                fontSize: 11,
              }}
            />
            
            {/* Reference line for initial cost (zero line) */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              strokeWidth={1}
            />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="hsl(var(--solar-gold))"
              strokeWidth={2}
              fill="url(#cumulativeGradient)"
              name="Cumulative Savings"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="hsl(var(--solar-green))"
              strokeWidth={2}
              fill="url(#roiGradient)"
              name="Net Position"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-solar-gold" />
          <span className="text-muted-foreground">{t('roi.cumulative')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-solar-green" />
          <span className="text-muted-foreground">{t('roi.net')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary" />
          <span className="text-muted-foreground">{t('roi.breakeven')}</span>
        </div>
      </div>
    </div>
  );
};

export default ROITimeline;
