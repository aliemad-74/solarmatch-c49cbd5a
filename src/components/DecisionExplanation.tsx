import { useState } from "react";
import { ChevronDown, ChevronUp, Info, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Settings2, ArrowUp, ArrowDown, Crosshair } from "lucide-react";
import { SolarCalculation, formatCurrency, formatNumber } from "@/lib/solarData";
import { useTranslation } from "react-i18next";

interface DecisionExplanationProps {
  results: SolarCalculation;
  monthlyConsumption: number;
  rooftopArea?: number;
  pvType?: string;
  buildingType?: string;
  electricityPrice?: number;
}

interface RankedFactor {
  key: string;
  label: string;
  score: number;
  direction: "positive" | "negative";
  causalSentence: string;
}

const DecisionExplanation = ({ results, monthlyConsumption, rooftopArea, pvType, buildingType, electricityPrice }: DecisionExplanationProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showInputTrace, setShowInputTrace] = useState(false);

  const feasibilityStatus =
    results.coverageRatio >= 0.7 && results.paybackYears <= 10
      ? "suitable"
      : results.coverageRatio >= 0.3 && results.paybackYears <= 15
      ? "conditional"
      : "notSuitable";

  // --- Ranked Causal Factors ---
  const computeRankedFactors = (): RankedFactor[] => {
    const factors: RankedFactor[] = [];

    // Coverage ratio impact
    const coveragePct = results.coverageRatio * 100;
    const coverageScore = coveragePct >= 90 ? 10 : coveragePct >= 70 ? 8 : coveragePct >= 50 ? 5 : coveragePct >= 30 ? 3 : 1;
    const coveragePositive = coveragePct >= 50;
    factors.push({
      key: "coverage",
      label: isAr ? "نسبة التغطية" : "Coverage Ratio",
      score: coverageScore,
      direction: coveragePositive ? "positive" : "negative",
      causalSentence: coveragePositive
        ? (isAr
          ? `نسبة تغطية مرتفعة (${formatNumber(coveragePct, 0)}%) تدعم جدوى التركيب بشكل قوي.`
          : `High coverage ratio (${formatNumber(coveragePct, 0)}%) strongly supports installation feasibility.`)
        : (isAr
          ? `نسبة تغطية منخفضة (${formatNumber(coveragePct, 0)}%) تحد من الجدوى المالية للنظام.`
          : `Low coverage ratio (${formatNumber(coveragePct, 0)}%) limits the system's financial viability.`),
    });

    // Payback period impact
    const paybackScore = results.paybackYears <= 5 ? 10 : results.paybackYears <= 7 ? 8 : results.paybackYears <= 10 ? 6 : results.paybackYears <= 13 ? 3 : 1;
    const paybackPositive = results.paybackYears <= 10;
    factors.push({
      key: "payback",
      label: isAr ? "فترة الاسترداد" : "Payback Period",
      score: paybackScore,
      direction: paybackPositive ? "positive" : "negative",
      causalSentence: paybackPositive
        ? (isAr
          ? `فترة استرداد قصيرة (${formatNumber(results.paybackYears, 1)} سنة) تؤكد الجدوى المالية.`
          : `Short payback period (${formatNumber(results.paybackYears, 1)} years) confirms financial viability.`)
        : (isAr
          ? `فترة استرداد طويلة (${formatNumber(results.paybackYears, 1)} سنة) تضعف المبرر المالي.`
          : `Long payback period (${formatNumber(results.paybackYears, 1)} years) weakens the financial case.`),
    });

    // Usable area impact
    const areaScore = results.usableArea >= 80 ? 9 : results.usableArea >= 50 ? 7 : results.usableArea >= 30 ? 4 : 2;
    const areaPositive = results.usableArea >= 40;
    factors.push({
      key: "area",
      label: isAr ? "المساحة القابلة للاستخدام" : "Usable Area",
      score: areaScore,
      direction: areaPositive ? "positive" : "negative",
      causalSentence: areaPositive
        ? (isAr
          ? `المساحة القابلة للاستخدام (${formatNumber(results.usableArea, 0)} م²) كافية لتركيب نظام بحجم ${results.kWInstalled} ك.و.`
          : `Usable area (${formatNumber(results.usableArea, 0)} m²) is sufficient to support a ${results.kWInstalled} kW system.`)
        : (isAr
          ? `المساحة القابلة للاستخدام (${formatNumber(results.usableArea, 0)} م²) تقيّد حجم النظام الممكن تركيبه.`
          : `Usable area (${formatNumber(results.usableArea, 0)} m²) constrains the installable system size.`),
    });

    // Consumption impact
    const consumptionScore = monthlyConsumption >= 800 ? 8 : monthlyConsumption >= 400 ? 6 : monthlyConsumption >= 200 ? 4 : 2;
    const consumptionPositive = monthlyConsumption >= 300;
    factors.push({
      key: "consumption",
      label: isAr ? "الاستهلاك الشهري" : "Monthly Consumption",
      score: consumptionScore,
      direction: consumptionPositive ? "positive" : "negative",
      causalSentence: consumptionPositive
        ? (isAr
          ? `الاستهلاك الشهري (${monthlyConsumption.toLocaleString()} ك.و.س) يبرر حجم النظام ويقصر فترة الاسترداد.`
          : `Monthly consumption (${monthlyConsumption.toLocaleString()} kWh) justifies the system size and shortens payback.`)
        : (isAr
          ? `الاستهلاك الشهري المنخفض (${monthlyConsumption.toLocaleString()} ك.و.س) يقلل من التوفير المحتمل.`
          : `Low monthly consumption (${monthlyConsumption.toLocaleString()} kWh) reduces potential savings.`),
    });

    // Sort by score descending, take top 3
    return factors.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const rankedFactors = computeRankedFactors();
  const rankLabels = isAr
    ? ["العامل الرئيسي", "العامل الثانوي", "العامل الثالث"]
    : ["Primary Factor", "Secondary Factor", "Minor Factor"];

  // --- Financial context ---
  const paybackContext =
    results.paybackYears <= 5
      ? isAr ? "ممتاز — أقل من المتوسط المصري (5-8 سنوات)" : "Excellent — below Egypt's typical range (5–8 years)"
      : results.paybackYears <= 8
      ? isAr ? "جيد — ضمن النطاق المصري النموذجي" : "Good — within Egypt's typical range"
      : results.paybackYears <= 12
      ? isAr ? "مقبول — أعلى من المتوسط قليلاً" : "Acceptable — slightly above average"
      : isAr ? "مرتفع — يتجاوز نطاق التبرير المعتاد (12+ سنة)" : "High — exceeds typical justification range (12+ years)";

  // --- Sensitivity scenarios ---
  const baseSavings = results.savingsYear;
  const basePayback = results.paybackYears;

  const scenarios = [
    {
      name: isAr ? "متحفظ" : "Conservative",
      desc: isAr ? "استهلاك +20%، تكلفة +15%" : "Consumption +20%, Cost +15%",
      paybackRange: `${formatNumber(basePayback * 1.1, 1)}–${formatNumber(basePayback * 1.2, 1)} ${isAr ? "سنة" : "yrs"}`,
      savingsRange: `${formatCurrency(baseSavings * 0.9)}–${formatCurrency(baseSavings)}`,
      color: "text-destructive bg-destructive/10 border-destructive/30",
    },
    {
      name: isAr ? "نموذجي (الحالي)" : "Typical (Current)",
      desc: isAr ? "القيم الأساسية" : "Baseline values",
      paybackRange: `${formatNumber(basePayback, 1)} ${isAr ? "سنة" : "yrs"}`,
      savingsRange: formatCurrency(baseSavings),
      color: "text-primary bg-primary/10 border-primary/30",
    },
    {
      name: isAr ? "متفائل" : "Optimistic",
      desc: isAr ? "استهلاك -20%، تكلفة -15%" : "Consumption -20%, Cost -15%",
      paybackRange: `${formatNumber(basePayback * 0.8, 1)}–${formatNumber(basePayback * 0.9, 1)} ${isAr ? "سنة" : "yrs"}`,
      savingsRange: `${formatCurrency(baseSavings)}–${formatCurrency(baseSavings * 1.1)}`,
      color: "text-solar-green bg-solar-green/10 border-solar-green/30",
    },
  ];

  // --- Grouped Assumptions ---
  const assumptionGroups = [
    {
      category: isAr ? "الطاقة" : "Energy",
      items: [
        { label: isAr ? "العائد النوعي" : "Specific Yield", value: isAr ? "1,800 ك.و.س/ك.و.ذ/سنة (متوسط مصر)" : "1,800 kWh/kWp/year (Egypt average)" },
        { label: isAr ? "بيانات الإشعاع" : "Irradiance Data", value: isAr ? "ناسا باور — المتوسط السنوي للموقع" : "NASA POWER — location annual average" },
        { label: isAr ? "نسبة الأداء" : "Performance Ratio", value: isAr ? "80% (نظام صيانة جيد)" : "80% (well-maintained system)" },
        { label: isAr ? "تدهور الألواح" : "Panel Degradation", value: isAr ? "0.5% سنوياً (نموذجي)" : "0.5% per year (typical)" },
        { label: isAr ? "عامل CO₂" : "CO₂ Factor", value: isAr ? "0.55 كجم/ك.و.س (شبكة مصر)" : "0.55 kg/kWh (Egypt grid mix)" },
      ],
    },
    {
      category: isAr ? "المالية" : "Financial",
      items: [
        { label: isAr ? "ثبات الأسعار" : "Tariff Stability", value: isAr ? "التعريفة الحالية (2024/2025) ثابتة" : "Current tariff (2024/2025) held constant" },
        { label: isAr ? "تكلفة الكيلووات" : "Cost per kW", value: isAr ? "ثابتة حسب الباقة المختارة" : "Held constant per selected package" },
      ],
    },
    {
      category: isAr ? "التشغيل" : "Operational",
      items: [
        { label: isAr ? "العمر التشغيلي للنظام" : "System Lifetime", value: isAr ? "25 سنة (معيار الصناعة)" : "25 years (industry standard)" },
        { label: isAr ? "الاستهلاك" : "Consumption", value: isAr ? "ثابت طوال العمر التشغيلي" : "Held constant across system lifetime" },
      ],
    },
  ];

  // --- Input Impact Trace ---
  const inputTraces = [
    {
      label: isAr ? "مساحة السطح" : "Rooftop Area",
      value: rooftopArea ? `${rooftopArea} m²` : `${formatNumber(results.usableArea / 0.65, 0)} m²`,
      impact: results.usableArea >= 60 ? "high" : results.usableArea >= 30 ? "medium" : "low" as "high" | "medium" | "low",
    },
    {
      label: isAr ? "الاستهلاك الشهري" : "Monthly Consumption",
      value: `${monthlyConsumption.toLocaleString()} kWh`,
      impact: monthlyConsumption >= 500 ? "high" : monthlyConsumption >= 200 ? "medium" : "low" as "high" | "medium" | "low",
    },
    {
      label: isAr ? "نوع الألواح" : "PV Type",
      value: pvType || "Standard",
      impact: "medium" as "high" | "medium" | "low",
    },
    {
      label: isAr ? "نوع المبنى" : "Building Type",
      value: buildingType || "apartment",
      impact: "medium" as "high" | "medium" | "low",
    },
    {
      label: isAr ? "سعر الكهرباء" : "Electricity Price",
      value: electricityPrice ? `${electricityPrice} EGP/kWh` : "—",
      impact: electricityPrice && electricityPrice >= 1.5 ? "high" : "medium" as "high" | "medium" | "low",
    },
  ];

  const impactBadgeColors = {
    high: "bg-solar-green/15 text-solar-green border-solar-green/30",
    medium: "bg-solar-gold/15 text-solar-gold border-solar-gold/30",
    low: "bg-muted text-muted-foreground border-border",
  };

  const impactLabels = { high: isAr ? "عالي" : "High", medium: isAr ? "متوسط" : "Medium", low: isAr ? "منخفض" : "Low" };

  return (
    <div className="space-y-4">
      {/* Causal Ranked Factors */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-primary" />
          <h4 className="font-display text-base font-semibold text-foreground">
            {isAr ? "لماذا هذه التوصية؟" : "Why This Recommendation?"}
          </h4>
        </div>

        {/* Ranked factors */}
        <div className="space-y-3 mb-4">
          {rankedFactors.map((factor, i) => (
            <div key={factor.key} className="flex items-start gap-3">
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {factor.direction === "positive" ? (
                  <ArrowUp className="w-4 h-4 text-solar-green" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {rankLabels[i]}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{factor.causalSentence}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Financial context */}
        <div className="pt-4 border-t border-border/50 flex items-start gap-2">
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
          {isAr ? "العرض المتقدم — الافتراضات والحساسية والتتبع" : "Advanced View — Assumptions, Sensitivity & Traceability"}
        </div>
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-3 animate-fade-in">
          {/* Input Impact Trace */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setShowInputTrace(!showInputTrace)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {isAr ? "تتبع تأثير المدخلات على القرار" : "Input-to-Decision Impact Trace"}
                </span>
              </div>
              {showInputTrace ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showInputTrace && (
              <div className="px-4 pb-4 space-y-2">
                {inputTraces.map((trace, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">{trace.label}</p>
                      <p className="text-xs text-muted-foreground">{trace.value}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${impactBadgeColors[trace.impact]}`}>
                      {impactLabels[trace.impact]}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 italic">
                  {isAr
                    ? "يوضح مستوى تأثير كل مدخل على التوصية النهائية."
                    : "Shows how much each input influenced the final recommendation."}
                </p>
              </div>
            )}
          </div>

          {/* Grouped Assumptions */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {isAr ? "الافتراضات الرئيسية المستخدمة في التحليل" : "Key Assumptions Used in This Analysis"}
                </span>
              </div>
              {showAssumptions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showAssumptions && (
              <div className="px-4 pb-4 space-y-4">
                {assumptionGroups.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{group.category}</p>
                    <div className="space-y-1.5">
                      {group.items.map((a, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
                          <span className="text-muted-foreground">{a.label}</span>
                          <span className="font-medium text-foreground text-end">{a.value}</span>
                        </div>
                      ))}
                    </div>
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

          {/* Three Named Sensitivity Scenarios */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setShowSensitivity(!showSensitivity)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {isAr ? "كيف تتغير النتائج إذا تغيرت الظروف" : "How Results Change If Conditions Vary"}
                </span>
              </div>
              {showSensitivity ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showSensitivity && (
              <div className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {scenarios.map((s, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${s.color}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{s.name}</span>
                        <span className="text-xs opacity-80">{s.desc}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs opacity-70">{isAr ? "فترة الاسترداد" : "Payback"}</p>
                          <p className="font-mono font-semibold">{s.paybackRange}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-70">{isAr ? "التوفير السنوي" : "Annual Savings"}</p>
                          <p className="font-mono font-semibold">{s.savingsRange}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  {isAr
                    ? "ملاحظة: هذه تقديرات توجيهية تعتمد على نسب تغيير بسيطة، وليست محاكاة دقيقة."
                    : "Note: These are indicative ranges based on simple multipliers, not precise simulations."}
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
