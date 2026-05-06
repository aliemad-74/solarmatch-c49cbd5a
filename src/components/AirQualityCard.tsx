import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Droplets, AlertCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SolarEngineData } from "@/pages/Index";

interface Props {
  env: SolarEngineData["environmental"];
}

const POLLUTANT_LABELS: Record<string, { en: string; ar: string }> = {
  pm10: { en: "Coarse dust (PM10)", ar: "غبار خشن (PM10)" },
  pm25: { en: "Fine particles (PM2.5)", ar: "جسيمات دقيقة (PM2.5)" },
  o3: { en: "Ozone", ar: "أوزون" },
  no2: { en: "Nitrogen Dioxide", ar: "ثاني أكسيد النيتروجين" },
  so2: { en: "Sulfur Dioxide", ar: "ثاني أكسيد الكبريت" },
  co: { en: "Carbon Monoxide", ar: "أول أكسيد الكربون" },
};

function aqiCategory(aqi: number, isAr: boolean) {
  if (aqi < 50) return { label: isAr ? "ممتازة" : "Excellent", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" };
  if (aqi <= 100) return { label: isAr ? "متوسطة" : "Moderate", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" };
  if (aqi <= 150) return { label: isAr ? "غير صحية للحساسين" : "Unhealthy (sensitive)", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" };
  return { label: isAr ? "غير صحية" : "Unhealthy", color: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" };
}

function cleaningSchedule(soilingPct: number, isAr: boolean) {
  if (soilingPct < 3) return isAr ? "تنظيف كل 3 أشهر" : "Clean every 3 months";
  if (soilingPct < 5) return isAr ? "تنظيف شهري" : "Monthly cleaning";
  if (soilingPct < 8) return isAr ? "تنظيف كل أسبوعين" : "Bi-weekly cleaning";
  return isAr ? "تنظيف أسبوعي" : "Weekly cleaning";
}

const AirQualityCard = ({ env }: Props) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const cat = aqiCategory(env.aqi, isAr);
  const soilingPct = env.soiling_loss_percent ?? env.dust_efficiency_loss ?? 0;
  const dominantKey = env.dominant_pollutant?.toLowerCase();
  const dominantLabel = dominantKey && POLLUTANT_LABELS[dominantKey]
    ? (isAr ? POLLUTANT_LABELS[dominantKey].ar : POLLUTANT_LABELS[dominantKey].en)
    : env.dominant_pollutant;

  return (
    <Card className="p-6 space-y-4 border-primary/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wind className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {isAr ? "جودة الهواء وتأثيرها على الإنتاج" : "Air Quality & Production Impact"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "بيانات حية من Google Air Quality" : "Live data from Google Air Quality"}
            </p>
          </div>
        </div>
        <Badge className={`${cat.color} border whitespace-nowrap`} variant="outline">
          AQI {env.aqi} · {cat.label}
        </Badge>
      </div>

      {/* Pollutants grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {env.pm10 != null && (
          <div className="p-3 rounded-md bg-muted/30">
            <div className="text-xs text-muted-foreground">PM10</div>
            <div className="text-lg font-semibold">{Math.round(env.pm10)} <span className="text-xs font-normal text-muted-foreground">µg/m³</span></div>
          </div>
        )}
        {env.pm25 != null && (
          <div className="p-3 rounded-md bg-muted/30">
            <div className="text-xs text-muted-foreground">PM2.5</div>
            <div className="text-lg font-semibold">{Math.round(env.pm25)} <span className="text-xs font-normal text-muted-foreground">µg/m³</span></div>
          </div>
        )}
        {env.pollen_index != null && (
          <div className="p-3 rounded-md bg-muted/30 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">{isAr ? "حبوب اللقاح" : "Pollen index"}</div>
              <div className="text-lg font-semibold">{env.pollen_index}/5</div>
            </div>
          </div>
        )}
      </div>

      {dominantLabel && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/30 border-l-2 border-primary">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="text-muted-foreground">{isAr ? "الملوّث الأساسي: " : "Primary pollutant: "}</span>
            <span className="font-medium">{dominantLabel}</span>
          </div>
        </div>
      )}

      {/* Soiling impact */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {isAr ? "خسارة الإنتاج المتوقعة بسبب الغبار" : "Expected production loss from dust"}
          </span>
          <span className="text-lg font-bold text-primary">-{soilingPct}%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? `هذه النسبة طُبّقت بالفعل على حسابات الإنتاج السنوي. الجدول الموصى به: ${cleaningSchedule(soilingPct, true)}.`
            : `Already applied to your annual production estimate. Recommended: ${cleaningSchedule(soilingPct, false)}.`}
        </p>
      </div>
    </Card>
  );
};

export default AirQualityCard;
