import { useTranslation } from "react-i18next";
import { Target, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Info, Zap, Sun, Gauge } from "lucide-react";
import { IdealSizingAnalysis, PackageType, systemPackages, formatNumber } from "@/lib/solarData";
import { Badge } from "@/components/ui/badge";

interface IdealSizingCardProps {
  analysis: IdealSizingAnalysis;
}

const IdealSizingCard = ({ analysis }: IdealSizingCardProps) => {
  const { t } = useTranslation();

  // Determine status color and icon based on recommendation
  const getStatusConfig = () => {
    switch (analysis.recommendation) {
      case "significantly_oversized":
        return {
          color: "text-solar-gold",
          bgColor: "bg-solar-gold/10",
          borderColor: "border-solar-gold/30",
          icon: <TrendingUp className="w-5 h-5" />,
          badge: "bg-solar-gold/20 text-solar-gold",
        };
      case "moderately_oversized":
      case "slightly_oversized":
        return {
          color: "text-primary",
          bgColor: "bg-primary/10",
          borderColor: "border-primary/30",
          icon: <TrendingUp className="w-4 h-4" />,
          badge: "bg-primary/20 text-primary",
        };
      case "optimal":
        return {
          color: "text-solar-green",
          bgColor: "bg-solar-green/10",
          borderColor: "border-solar-green/30",
          icon: <CheckCircle className="w-5 h-5" />,
          badge: "bg-solar-green/20 text-solar-green",
        };
      case "slightly_undersized":
        return {
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          icon: <TrendingDown className="w-4 h-4" />,
          badge: "bg-amber-500/20 text-amber-500",
        };
      case "significantly_undersized":
        return {
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          icon: <AlertCircle className="w-5 h-5" />,
          badge: "bg-destructive/20 text-destructive",
        };
      default:
        return {
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          icon: <Info className="w-5 h-5" />,
          badge: "bg-muted text-muted-foreground",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isOversized = analysis.oversizePercent > 0;
  const absPercent = Math.abs(analysis.oversizePercent);

  // Get optimal package name
  const optimalPackageName = analysis.optimalPackage 
    ? systemPackages[analysis.optimalPackage].name 
    : null;

  return (
    <div className={`rounded-2xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 animate-slide-up`} style={{ animationDelay: "175ms" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl ${statusConfig.bgColor}`}>
          <Target className={`w-5 h-5 ${statusConfig.color}`} />
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-foreground">
            {t('idealSizing.title')}
          </h4>
          <p className="text-xs text-muted-foreground font-mono">
            {t('idealSizing.formula')}
          </p>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-card/50 rounded-xl border border-border/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('idealSizing.dailyConsumption')}</span>
          </div>
          <p className="font-mono font-semibold text-foreground">
            {formatNumber(analysis.dailyConsumption, 1)} <span className="text-xs text-muted-foreground">kWh/day</span>
          </p>
        </div>
        <div className="text-center border-x border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sun className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('idealSizing.peakSunHours')}</span>
          </div>
          <p className="font-mono font-semibold text-foreground">
            {formatNumber(analysis.peakSunHours, 2)} <span className="text-xs text-muted-foreground">h/day</span>
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('idealSizing.performanceRatio')}</span>
          </div>
          <p className="font-mono font-semibold text-foreground">
            {(analysis.performanceRatio * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('idealSizing.idealSize')}</p>
          <p className="text-2xl font-bold font-mono text-foreground">
            {formatNumber(analysis.idealSystemSize, 1)}
          </p>
          <p className="text-xs text-muted-foreground">kW</p>
        </div>
        <div className={`p-4 rounded-xl border-2 text-center ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
          <p className="text-xs text-muted-foreground mb-1">{t('idealSizing.yourSystem')}</p>
          <p className={`text-2xl font-bold font-mono ${statusConfig.color}`}>
            {formatNumber(analysis.installedSystemSize, 1)}
          </p>
          <p className="text-xs text-muted-foreground">kW</p>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('idealSizing.difference')}</p>
          <div className="flex items-center justify-center gap-1">
            {statusConfig.icon}
            <p className={`text-2xl font-bold font-mono ${statusConfig.color}`}>
              {isOversized ? "+" : "-"}{formatNumber(absPercent, 0)}%
            </p>
          </div>
          <Badge className={`mt-1 text-xs ${statusConfig.badge}`}>
            {isOversized ? t('idealSizing.oversized') : analysis.recommendation === 'optimal' ? t('idealSizing.optimal') : t('idealSizing.undersized')}
          </Badge>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-4 rounded-xl ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg bg-card/50 ${statusConfig.color}`}>
            {statusConfig.icon}
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground mb-1">{t('idealSizing.recommendation')}</p>
            <p className="text-sm text-muted-foreground">
              {t(`idealSizing.${analysis.explanationKey}`)}
            </p>
            
            {/* Benefits/Impact list based on status */}
            {isOversized && analysis.recommendation !== 'optimal' && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-foreground mb-1">{t('idealSizing.whyOversizing')}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• {t('idealSizing.oversizingBenefit1')}</li>
                  <li>• {t('idealSizing.oversizingBenefit2')}</li>
                  <li>• {t('idealSizing.oversizingBenefit3')}</li>
                </ul>
              </div>
            )}
            
            {!isOversized && analysis.recommendation !== 'optimal' && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-foreground mb-1">{t('idealSizing.undersizingImpact')}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• {t('idealSizing.undersizingEffect1')}</li>
                  <li>• {t('idealSizing.undersizingEffect2')}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimal Package Suggestion */}
      {optimalPackageName && analysis.optimalPackage !== 'standard' && (
        <div className="mt-4 p-3 bg-card/50 rounded-xl border border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('idealSizing.optimalPackage')}</span>
          <Badge variant="outline" className="font-mono">
            {optimalPackageName} ({formatNumber(analysis.idealSystemSize, 1)} kW)
          </Badge>
        </div>
      )}
    </div>
  );
};

export default IdealSizingCard;
