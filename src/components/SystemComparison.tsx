import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Check, X, TrendingUp, Zap, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarCalculation, formatCurrency, formatNumber, systemPackages, PackageType } from "@/lib/solarData";
import { cn } from "@/lib/utils";

interface SystemComparisonProps {
  results: SolarCalculation;
}

const SystemComparison = ({ results }: SystemComparisonProps) => {
  const { t } = useTranslation();
  const [selectedSystems, setSelectedSystems] = useState<PackageType[]>([
    results.selectedPackage,
    results.packageOptions?.[0]?.packageKey !== results.selectedPackage 
      ? (results.packageOptions?.[0]?.packageKey as PackageType) 
      : (results.packageOptions?.[1]?.packageKey as PackageType)
  ].filter(Boolean) as PackageType[]);

  if (!results.packageOptions || results.packageOptions.length < 2) {
    return null;
  }

  const toggleSystem = (packageKey: PackageType) => {
    if (selectedSystems.includes(packageKey)) {
      if (selectedSystems.length > 1) {
        setSelectedSystems(selectedSystems.filter(s => s !== packageKey));
      }
    } else if (selectedSystems.length < 3) {
      setSelectedSystems([...selectedSystems, packageKey]);
    }
  };

  const comparisonData = results.packageOptions.filter(opt => 
    selectedSystems.includes(opt.packageKey as PackageType)
  );

  const getBestValue = (values: number[], type: 'lowest' | 'highest') => {
    if (type === 'lowest') return Math.min(...values);
    return Math.max(...values);
  };

  const metrics = [
    {
      id: "totalCost",
      label: t("comparison.totalCost"),
      icon: <DollarSign className="w-4 h-4" />,
      getValue: (opt: typeof comparisonData[0]) => opt.totalCost,
      format: (v: number) => formatCurrency(v),
      bestType: "lowest" as const,
    },
    {
      id: "energyYear",
      label: t("comparison.yearlyEnergy"),
      icon: <Zap className="w-4 h-4" />,
      getValue: (opt: typeof comparisonData[0]) => opt.energyYear,
      format: (v: number) => `${formatNumber(v, 0)} kWh`,
      bestType: "highest" as const,
    },
    {
      id: "savingsYear",
      label: t("comparison.yearlySavings"),
      icon: <TrendingUp className="w-4 h-4" />,
      getValue: (opt: typeof comparisonData[0]) => opt.savingsYear,
      format: (v: number) => formatCurrency(v),
      bestType: "highest" as const,
    },
    {
      id: "payback",
      label: t("comparison.paybackPeriod"),
      icon: <Calendar className="w-4 h-4" />,
      getValue: (opt: typeof comparisonData[0]) => opt.paybackYears,
      format: (v: number) => `${formatNumber(v, 1)} ${t("comparison.years")}`,
      bestType: "lowest" as const,
    },
    {
      id: "kw",
      label: t("comparison.capacity"),
      icon: <Zap className="w-4 h-4" />,
      getValue: (opt: typeof comparisonData[0]) => opt.kWInstalled,
      format: (v: number) => `${v} kW`,
      bestType: "highest" as const,
    },
  ];

  const packageColors: Record<PackageType, string> = {
    economy: "bg-solar-green/10 border-solar-green text-solar-green",
    standard: "bg-primary/10 border-primary text-primary",
    premium: "bg-solar-gold/10 border-solar-gold text-solar-gold",
  };

  return (
    <Card className="animate-slide-up print:hidden" style={{ animationDelay: "180ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            {t("comparison.title")}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {results.packageOptions.map((opt) => (
              <Button
                key={opt.packageKey}
                variant={selectedSystems.includes(opt.packageKey as PackageType) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSystem(opt.packageKey as PackageType)}
                className={cn(
                  "text-xs",
                  selectedSystems.includes(opt.packageKey as PackageType) && 
                  packageColors[opt.packageKey as PackageType]
                )}
              >
                {selectedSystems.includes(opt.packageKey as PackageType) ? (
                  <Check className="w-3 h-3 me-1" />
                ) : null}
                {opt.package.name}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-3 px-2 font-medium text-muted-foreground">
                  {t("comparison.metric")}
                </th>
                {comparisonData.map((opt) => (
                  <th key={opt.packageKey} className="text-center py-3 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn("font-semibold", packageColors[opt.packageKey as PackageType])}
                      >
                        {opt.package.name}
                      </Badge>
                      {opt.packageKey === results.selectedPackage && (
                        <span className="text-[10px] text-primary font-medium">
                          {t("comparison.current")}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const values = comparisonData.map(opt => metric.getValue(opt));
                const bestValue = getBestValue(values, metric.bestType);
                
                return (
                  <tr key={metric.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {metric.icon}
                        {metric.label}
                      </div>
                    </td>
                    {comparisonData.map((opt) => {
                      const value = metric.getValue(opt);
                      const isBest = value === bestValue;
                      
                      return (
                        <td key={opt.packageKey} className="text-center py-3 px-2">
                          <span className={cn(
                            "font-mono",
                            isBest && "font-bold text-solar-green"
                          )}>
                            {metric.format(value)}
                            {isBest && <span className="ms-1">✓</span>}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Efficiency row */}
              <tr className="hover:bg-muted/30">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    {t("comparison.efficiency")}
                  </div>
                </td>
                {comparisonData.map((opt) => (
                  <td key={opt.packageKey} className="text-center py-3 px-2">
                    <span className="font-mono">{opt.package.efficiency}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            {t("comparison.summary")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemComparison;
