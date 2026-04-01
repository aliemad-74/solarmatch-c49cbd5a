import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Warning {
  type: "warn" | "info";
  message: string;
}

interface InputSanityWarningsProps {
  rooftopArea: number;
  monthlyConsumption: number;
  electricityPrice: number;
  electricityPriceMin?: number;
  electricityPriceMax?: number;
  buildingMode: boolean;
  numberOfUnits: number;
  avgUnitConsumption: number;
  farmMode: boolean;
  farmEquipmentConsumption: number;
  areaInFeddans: number;
}

export function getInputWarnings(props: InputSanityWarningsProps, isAr: boolean): Warning[] {
  const warnings: Warning[] = [];
  const {
    rooftopArea, monthlyConsumption, electricityPrice,
    electricityPriceMin = 0.68, electricityPriceMax = 2.23,
    buildingMode, numberOfUnits, avgUnitConsumption,
    farmMode, farmEquipmentConsumption, areaInFeddans,
  } = props;

  const effectiveConsumption = farmMode
    ? farmEquipmentConsumption
    : buildingMode
    ? numberOfUnits * avgUnitConsumption
    : monthlyConsumption;

  // Area checks
  if (rooftopArea < 20) {
    warnings.push({
      type: "warn",
      message: isAr
        ? `المساحة (${rooftopArea} م²) صغيرة جداً. الأنظمة الشمسية عادةً تحتاج 20 م² على الأقل.`
        : `Area (${rooftopArea} m²) is very small. Solar systems typically require at least 20 m².`,
    });
  }
  if (rooftopArea > 5000 && !farmMode) {
    warnings.push({
      type: "info",
      message: isAr
        ? `المساحة كبيرة جداً (${rooftopArea} م²). تأكد من القياسات. إذا كانت مزرعة، استخدم وضع المزرعة.`
        : `Area is very large (${rooftopArea} m²). Verify your measurements. If this is farmland, use Farm Mode.`,
    });
  }

  // Consumption vs area mismatch
  if (effectiveConsumption > 0 && rooftopArea > 0) {
    // Rough estimate: 1 kW ≈ 7 m² (standard), produces ~150 kWh/month
    const approxProductionPerSqm = 150 / 7; // ~21.4 kWh/month per m²
    const estimatedMaxProduction = rooftopArea * 0.6 * approxProductionPerSqm;
    if (effectiveConsumption > estimatedMaxProduction * 3) {
      warnings.push({
        type: "warn",
        message: isAr
          ? `الاستهلاك الشهري (${effectiveConsumption.toLocaleString()} ك.و.س) مرتفع جداً مقارنةً بمساحة السطح. قد تكون نسبة التغطية منخفضة جداً.`
          : `Monthly consumption (${effectiveConsumption.toLocaleString()} kWh) is very high relative to roof area. Coverage ratio may be very low.`,
      });
    }
    if (effectiveConsumption < 50 && !farmMode) {
      warnings.push({
        type: "info",
        message: isAr
          ? `الاستهلاك الشهري (${effectiveConsumption} ك.و.س) منخفض جداً. هل أنت متأكد من الرقم؟ الاستهلاك النموذجي للمنزل المصري 200-600 ك.و.س.`
          : `Monthly consumption (${effectiveConsumption} kWh) seems very low. Typical Egyptian households use 200–600 kWh/month.`,
      });
    }
  }

  // Electricity price
  if (electricityPrice < electricityPriceMin || electricityPrice > electricityPriceMax) {
    warnings.push({
      type: "warn",
      message: isAr
        ? `سعر الكهرباء (${electricityPrice} جنيه/ك.و.س) خارج النطاق المصري المعتاد (${electricityPriceMin.toFixed(2)}–${electricityPriceMax.toFixed(2)} جنيه).`
        : `Electricity price (${electricityPrice} EGP/kWh) is outside Egypt's typical range (${electricityPriceMin.toFixed(2)}–${electricityPriceMax.toFixed(2)} EGP).`,
    });
  }

  // Building mode checks
  if (buildingMode && numberOfUnits > 100) {
    warnings.push({
      type: "info",
      message: isAr
        ? `عدد الوحدات (${numberOfUnits}) مرتفع جداً. تأكد من القيمة.`
        : `Number of units (${numberOfUnits}) is unusually high. Please verify.`,
    });
  }
  if (buildingMode && avgUnitConsumption > 2000) {
    warnings.push({
      type: "warn",
      message: isAr
        ? `متوسط استهلاك الوحدة (${avgUnitConsumption} ك.و.س/شهر) مرتفع جداً للشقة السكنية.`
        : `Average unit consumption (${avgUnitConsumption} kWh/month) is very high for a residential unit.`,
    });
  }

  // Farm mode checks
  if (farmMode && areaInFeddans > 500) {
    warnings.push({
      type: "info",
      message: isAr
        ? `المساحة الزراعية (${areaInFeddans} فدان) كبيرة جداً. تأكد من القيمة.`
        : `Farm area (${areaInFeddans} Feddans) is very large. Please verify.`,
    });
  }

  return warnings;
}

const InputSanityWarnings = (props: InputSanityWarningsProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const warnings = getInputWarnings(props, isAr);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm ${
            w.type === "warn"
              ? "bg-solar-gold/10 border border-solar-gold/30 text-solar-gold"
              : "bg-primary/8 border border-primary/20 text-primary"
          }`}
        >
          {w.type === "warn" ? (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className={w.type === "warn" ? "text-solar-gold" : "text-primary"}>{w.message}</span>
        </div>
      ))}
    </div>
  );
};

export default InputSanityWarnings;
