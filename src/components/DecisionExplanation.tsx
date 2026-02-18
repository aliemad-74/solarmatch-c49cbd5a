import { useState } from "react";
import { ChevronDown, ChevronUp, Info, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Settings2 } from "lucide-react";
import { SolarCalculation, formatCurrency, formatNumber } from "@/lib/solarData";
import { useTranslation } from "react-i18next";

interface DecisionExplanationProps {
  results: SolarCalculation;
  monthlyConsumption: number;
}

const DecisionExplanation = ({ results, monthlyConsumption }: DecisionExplanationProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);

  const feasibilityStatus =
    results.coverageRatio >= 0.7 && results.paybackYears <= 10
      ? "suitable"
      : results.coverageRatio >= 0.3 && results.paybackYears <= 15
      ? "conditional"
      : "notSuitable";

  // --- Why this recommendation ---
  const drivers: { label: string; value: string; impact: "high" | "medium" | "low" }[] = [
    {
      label: isAr ? "نسبة التغطية" : "Coverage Ratio",
      value: `${formatNumber(results.coverageRatio * 100, 0)}%`,
      impact: results.coverageRatio >= 0.7 ? "high" : results.coverageRatio >= 0.4 ? "medium" : "low",
    },
    {
      label: isAr ? "فترة الاسترداد" : "Payback Period",
      value: `${formatNumber(results.paybackYears, 1)} ${isAr ? "سنة" : "yrs"}`,
      impact: results.paybackYears <= 7 ? "high" : results.paybackYears <= 12 ? "medium" : "low",
    },
    {
      label: isAr ? "المساحة القابلة للاستخدام" : "Usable Area",
      value: `${formatNumber(results.usableArea, 0)} m²`,
      impact: results.usableArea >= 60 ? "high" : results.usableArea >= 30 ? "medium" : "low",
    },
    {
      label: isAr ? "الاستهلاك الشهري" : "Monthly Consumption",
      value: `${monthlyConsumption.toLocaleString()} kWh`,
      impact: "medium",
    },
  ];

  const impactColors = {
    high: "text-solar-green bg-solar-green/10 border-solar-green/30",
    medium: "text-solar-gold bg-solar-gold/10 border-solar-gold/30",
    low: "text-muted-foreground bg-muted/50 border-border",
  };

  const whyText = (() => {
    if (feasibilityStatus === "suitable") {
      return isAr
        ? `النظام مناسب لأن نسبة التغطية (${formatNumber(results.coverageRatio * 100, 0)}%) مرتفعة وفترة الاسترداد (${formatNumber(results.paybackYears, 1)} سنة) ضمن النطاق المقبول. المساحة القابلة للاستخدام (${formatNumber(results.usableArea, 0)} م²) كافية لتركيب نظام بحجم ${results.kWInstalled} ك.و.`
        : `Solar is recommended because your coverage ratio (${formatNumber(results.coverageRatio * 100, 0)}%) is strong and payback (${formatNumber(results.paybackYears, 1)} years) falls within an acceptable range. Your ${formatNumber(results.usableArea, 0)} m² usable area supports a ${results.kWInstalled} kW system.`;
    } else if (feasibilityStatus === "conditional") {
      return isAr
        ? `النظام مشروط لأن نسبة التغطية (${formatNumber(results.coverageRatio * 100, 0)}%) أو فترة الاسترداد (${formatNumber(results.paybackYears, 1)} سنة) ليست مثالية. قد يكون التثبيت مجدياً إذا زادت أسعار الكهرباء أو إذا كانت أولويات البيئة مهمة.`
        : `Solar is conditionally viable. Your coverage ratio (${formatNumber(results.coverageRatio * 100, 0)}%) or payback period (${formatNumber(results.paybackYears, 1)} years) is not ideal. Installation may still make sense if electricity prices rise or environmental goals are a priority.`;
    } else {
      return isAr
        ? `لا يُنصح بالنظام حالياً. إما أن المساحة القابلة للاستخدام غير كافية، أو أن الاستهلاك منخفض جداً لتبرير التكلفة. فكر في توسيع مساحة السطح أو مراجعة نمط الاستهلاك.`
        : `Solar is not currently recommended. Either the usable area is insufficient or consumption is too low to justify the cost. Consider increasing usable roof area or reviewing your consumption profile.`;
    }
  })();

  // --- Sensitivity ranges ---
  const baseSavings = results.savingsYear;
  const basePayback = results.paybackYears;
  const sensitivityRows = [
    {
      scenario: isAr ? "الاستهلاك +20%" : "Consumption +20%",
      savings: formatCurrency(baseSavings * 1.0), // stays same – production doesn't change
      payback: `${formatNumber(basePayback, 1)} ${isAr ? "سنة" : "yrs"}`,
      note: isAr ? "نفس الإنتاج، تغطية أقل" : "Same production, less coverage",
    },
    {
      scenario: isAr ? "الاستهلاك -20%" : "Consumption -20%",
      savings: formatCurrency(baseSavings * 1.0),
      payback: `${formatNumber(basePayback, 1)} ${isAr ? "سنة" : "yrs"}`,
      note: isAr ? "فائض أكبر، تغطية أعلى" : "More surplus, higher coverage",
    },
    {
      scenario: isAr ? "التكلفة +15%" : "System Cost +15%",
      savings: formatCurrency(baseSavings),
      payback: `${formatNumber(basePayback * 1.15, 1)} ${isAr ? "سنة" : "yrs"}`,
      note: isAr ? "فترة الاسترداد تزيد" : "Payback extends",
    },
    {
      scenario: isAr ? "التكلفة -15%" : "System Cost -15%",
      savings: formatCurrency(baseSavings),
      payback: `${formatNumber(basePayback * 0.85, 1)} ${isAr ? "سنة" : "yrs"}`,
      note: isAr ? "فترة الاسترداد تقصر" : "Payback shortens",
    },
  ];

  // --- Financial context ---
  const paybackContext =
    results.paybackYears <= 5
      ? isAr ? "ممتاز — أقل من المتوسط المصري (5-8 سنوات)" : "Excellent — below Egypt's typical range (5–8 years)"
      : results.paybackYears <= 8
      ? isAr ? "جيد — ضمن النطاق المصري النموذجي" : "Good — within Egypt's typical range"
      : results.paybackYears <= 12
      ? isAr ? "مقبول — أعلى من المتوسط قليلاً" : "Acceptable — slightly above average"
      : isAr ? "مرتفع — يتجاوز نطاق التبرير المعتاد (12+ سنة)" : "High — exceeds typical justification range (12+ years)";

  return (
    <div className="space-y-4">
      {/* Why This Recommendation */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-primary" />
          <h4 className="font-display text-base font-semibold text-foreground">
            {isAr ? "لماذا هذه التوصية؟" : "Why This Recommendation?"}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{whyText}</p>

        {/* Key drivers */}
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          {isAr ? "العوامل الأكثر تأثيراً" : "Key Drivers"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {drivers.map((d, i) => (
            <div key={i} className={`px-3 py-2 rounded-lg border text-center ${impactColors[d.impact]}`}>
              <p className="text-sm font-bold">{d.value}</p>
              <p className="text-xs opacity-80">{d.label}</p>
            </div>
          ))}
        </div>

        {/* Financial context */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{isAr ? "سياق الاسترداد: " : "Payback context: "}</span>
            {paybackContext}
          </p>
        </div>
      </div>

      {/* Advanced View Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          {isAr ? "العرض المتقدم — الافتراضات والحساسية" : "Advanced View — Assumptions & Sensitivity"}
        </div>
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-3 animate-fade-in">
          {/* Assumptions Disclosure */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {isAr ? "الافتراضات المستخدمة في الحساب" : "Calculation Assumptions"}
                </span>
              </div>
              {showAssumptions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showAssumptions && (
              <div className="px-4 pb-4 space-y-2">
                {[
                  {
                    label: isAr ? "العمر التشغيلي للنظام" : "System Lifetime",
                    value: isAr ? "25 سنة (معيار الصناعة)" : "25 years (industry standard)",
                  },
                  {
                    label: isAr ? "العائد النوعي" : "Specific Yield",
                    value: isAr ? "1,800 ك.و.س/ك.و.ذ/سنة (متوسط مصر)" : "1,800 kWh/kWp/year (Egypt average)",
                  },
                  {
                    label: isAr ? "نسبة الأداء" : "Performance Ratio",
                    value: isAr ? "80% (نظام صيانة جيد)" : "80% (well-maintained system)",
                  },
                  {
                    label: isAr ? "تدهور الألواح" : "Panel Degradation",
                    value: isAr ? "0.5% سنوياً (نموذجي)" : "0.5% per year (typical)",
                  },
                  {
                    label: isAr ? "ثبات الأسعار" : "Tariff Stability",
                    value: isAr ? "التعريفة الحالية (2024/2025) ثابتة" : "Current tariff (2024/2025) held constant",
                  },
                  {
                    label: isAr ? "الاستهلاك" : "Consumption",
                    value: isAr ? "ثابت طوال العمر التشغيلي" : "Held constant across system lifetime",
                  },
                  {
                    label: isAr ? "بيانات الإشعاع" : "Irradiance Data",
                    value: isAr ? "ناسا باور — المتوسط السنوي للموقع" : "NASA POWER — location annual average",
                  },
                  {
                    label: isAr ? "عامل CO₂" : "CO₂ Factor",
                    value: isAr ? "0.55 كجم/ك.و.س (شبكة مصر)" : "0.55 kg/kWh (Egypt grid mix)",
                  },
                ].map((a, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="font-medium text-foreground text-end">{a.value}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 italic">
                  {isAr
                    ? "تغيير أي من هذه الافتراضات سيؤثر على النتائج المالية."
                    : "Changing any of these assumptions will affect financial results."}
                </p>
              </div>
            )}
          </div>

          {/* Sensitivity Awareness */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setShowSensitivity(!showSensitivity)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {isAr ? "تحليل الحساسية — تأثير التغييرات" : "Sensitivity Analysis — Impact of Changes"}
                </span>
              </div>
              {showSensitivity ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showSensitivity && (
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">
                  {isAr
                    ? "توضح الجدول التالي كيف تتأثر النتائج بتغير المدخلات الرئيسية:"
                    : "The table below shows how results shift when key inputs change:"}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-start py-2 text-xs text-muted-foreground font-medium">{isAr ? "السيناريو" : "Scenario"}</th>
                        <th className="text-end py-2 text-xs text-muted-foreground font-medium">{isAr ? "التوفير السنوي" : "Annual Savings"}</th>
                        <th className="text-end py-2 text-xs text-muted-foreground font-medium">{isAr ? "الاسترداد" : "Payback"}</th>
                        <th className="text-end py-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">{isAr ? "ملاحظة" : "Note"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/40 bg-primary/5">
                        <td className="py-2 font-medium text-foreground">{isAr ? "الوضع الحالي" : "Current"}</td>
                        <td className="py-2 text-end font-mono">{formatCurrency(baseSavings)}</td>
                        <td className="py-2 text-end font-mono">{formatNumber(basePayback, 1)} {isAr ? "سنة" : "yrs"}</td>
                        <td className="py-2 text-end text-muted-foreground hidden sm:table-cell">—</td>
                      </tr>
                      {sensitivityRows.map((row, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                          <td className="py-2 text-muted-foreground">{row.scenario}</td>
                          <td className="py-2 text-end font-mono text-foreground">{row.savings}</td>
                          <td className="py-2 text-end font-mono text-foreground">{row.payback}</td>
                          <td className="py-2 text-end text-muted-foreground text-xs hidden sm:table-cell">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  {isAr
                    ? "ملاحظة: هذه تقديرات توجيهية، ليست محاكاة دقيقة."
                    : "Note: These are indicative estimates, not precise simulations."}
                </p>
              </div>
            )}
          </div>

          {/* Scope & Limitations */}
          <div className="bg-muted/40 rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-solar-gold" />
              <span className="text-sm font-semibold text-foreground">
                {isAr ? "نطاق النظام وحدوده" : "System Scope & Limitations"}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {(isAr ? [
                "مصمم للمواقع في مصر — لا يناسب دول أخرى.",
                "يعتمد على الاستهلاك الشهري الثابت. تغيير نمط الاستهلاك يؤثر على الدقة.",
                "لا يحسب تكاليف البطاريات أو أنظمة التخزين.",
                "لا يشمل تعقيدات التركيب أو متطلبات الربط بالشبكة.",
                "التقدير مبني على بيانات متوسطة؛ الأداء الفعلي قد يختلف.",
              ] : [
                "Designed for Egypt-based locations only.",
                "Assumes constant monthly consumption. Changes in usage patterns affect accuracy.",
                "Does not calculate battery or storage system costs.",
                "Does not account for installation complexity or grid-connection requirements.",
                "Estimates are based on average data; actual performance may vary.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-solar-gold mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionExplanation;
