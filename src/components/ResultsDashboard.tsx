import { Zap, DollarSign, Calendar, Leaf, Sun, TrendingUp, AlertTriangle, Gauge, Building, Users, PlugZap, Battery, Unplug, Package, Download, Loader2, Share2, Printer, LayoutGrid, CheckCircle2, XCircle, AlertCircle, Info, ArrowUp, ArrowDown, Crosshair, BarChart3, Settings2, ChevronDown, Phone, Satellite, Wind, Mountain, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useMarketData } from "@/hooks/useMarketData";
import { MarketDataBadge } from "@/components/MarketDataBadge";
import { SolarCalculation, formatCurrency, formatNumber, MONTH_NAMES, costScenarios, systemPackages, PackageType } from "@/lib/solarData";
import { ShareableParams } from "@/lib/shareUtils";
import ResultCard from "./ResultCard";
import ROITimeline from "./ROITimeline";
import ShareDialog from "./ShareDialog";
import ContactExpertDialog from "./ContactExpertDialog";

import FeatureGate from "./FeatureGate";
import LockedFeature from "./LockedFeature";
import UpgradeBanner from "./UpgradeBanner";
import IdealSizingCard from "./IdealSizingCard";
import SystemComparison from "./SystemComparison";
import TechnicalSpecifications from "./TechnicalSpecifications";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { generateSolarReport, ReportLanguage } from "@/lib/pdfReport";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SolarEngineData } from "@/pages/Index";
import SatelliteVisionCard from "@/components/SatelliteVisionCard";

interface ResultsDashboardProps {
  results: SolarCalculation | null;
  isVisible: boolean;
  locationName?: string;
  shareableParams?: ShareableParams;
  monthlyConsumption?: number;
  pvType?: string;
  buildingType?: string;
  costScenario?: string;
  electricityPrice?: number;
  solarEngineData?: SolarEngineData | null;
  solarEngineLoading?: boolean;
  aiReviewText?: string;
}

const ResultsDashboard = ({ results, isVisible, locationName, shareableParams, monthlyConsumption = 500, pvType = "B_standard_mono", buildingType = "apartment", costScenario = "medium", electricityPrice = 1.95, solarEngineData, solarEngineLoading, aiReviewText }: ResultsDashboardProps) => {
  const { t, i18n } = useTranslation();
  const { profile } = useUserAuth();
  const planFeatures = usePlanFeatures();
  const isAr = i18n.language === "ar";
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEmailingReport, setIsEmailingReport] = useState(false);
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>(isAr ? "ar" : "en");
  const { panelPrices, tariffs, refresh: refreshMarketData } = useMarketData();

  useEffect(() => {
    if (isVisible) refreshMarketData();
  }, [isVisible]);

  if (!results || !isVisible) return null;

  const handleDownloadReport = async () => {
    if (!results || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateSolarReport(results, locationName, reportLanguage);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => window.print();

  const handleEmailReport = async () => {
    if (!results || isEmailingReport) return;
    if (!profile?.email) {
      toast.error(isAr ? "يجب تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    setIsEmailingReport(true);
    try {
      const feasibilityLabel = feasibilityStatus === 'suitable' ? (isAr ? 'مناسب' : 'Suitable')
        : feasibilityStatus === 'conditional' ? (isAr ? 'مناسب بشروط' : 'Conditionally Suitable')
        : feasibilityStatus === 'oversized' ? (isAr ? 'نظام كبير' : 'Oversized')
        : (isAr ? 'غير مناسب' : 'Not Suitable');
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'solar-report',
          recipientEmail: profile.email,
          idempotencyKey: `solar-report-${profile.user_id}-${Date.now()}`,
          templateData: {
            name: profile.name,
            location: locationName,
            systemSizeKw: results.kWInstalled,
            annualProduction: Math.round(results.energyYear),
            annualSavings: Math.round(results.savingsYear),
            paybackYears: results.paybackYears,
            co2Saved: Math.round(results.co2Saved),
            feasibility: feasibilityLabel,
            reportUrl: window.location.href,
          },
        },
      });
      if (error) throw error;
      toast.success(isAr ? `تم إرسال التقرير إلى ${profile.email}` : `Report sent to ${profile.email}`);
    } catch (e: any) {
      console.error(e);
      toast.error(isAr ? "فشل إرسال البريد" : "Failed to send email");
    } finally {
      setIsEmailingReport(false);
    }
  };

  // Chart data
  const monthlyData = MONTH_NAMES.map((month, index) => ({
    month,
    production: Math.round(results.monthlyProduction[index]),
  }));

  const cumulativeSavings = results.monthlyProduction.reduce<{ month: string; savings: number; cumulative: number }[]>(
    (acc, production, index) => {
      const monthSavings = production * (results.savingsYear / results.energyYear);
      const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({ month: MONTH_NAMES[index], savings: Math.round(monthSavings), cumulative: Math.round(prevCumulative + monthSavings) });
      return acc;
    },
    []
  );

  const coveragePercent = Math.min(results.coverageRatio * 100, 200);

  // Feasibility
  const feasibilityStatus = results.coverageRatio >= 1.5
    ? 'oversized'
    : results.coverageRatio >= 0.7 && results.paybackYears <= 10
      ? 'suitable'
      : results.coverageRatio >= 0.3 && results.paybackYears <= 15
        ? 'conditional'
        : 'notSuitable';

  // Get recommended data from solar engine for oversized systems
  const recommended = solarEngineData?.recommended as Record<string, number> | undefined;

  const feasibilityConfig = {
    suitable: { icon: CheckCircle2, color: 'text-solar-green', bg: 'bg-solar-green/10 border-solar-green/30', iconColor: 'text-solar-green' },
    conditional: { icon: AlertCircle, color: 'text-solar-gold', bg: 'bg-solar-gold/10 border-solar-gold/30', iconColor: 'text-solar-gold' },
    notSuitable: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', iconColor: 'text-destructive' },
    oversized: { icon: Settings2, color: 'text-solar-green', bg: 'bg-solar-green/10 border-solar-green/30', iconColor: 'text-solar-green' },
  };

  const fc = feasibilityConfig[feasibilityStatus];
  const FeasibilityIcon = fc.icon;

  // --- Ranked Causal Factors ---
  const computeRankedFactors = () => {
    const factors: { key: string; label: string; score: number; direction: "positive" | "negative"; causalSentence: string }[] = [];
    const coveragePct = results.coverageRatio * 100;
    const coverageScore = coveragePct >= 90 ? 10 : coveragePct >= 70 ? 8 : coveragePct >= 50 ? 5 : coveragePct >= 30 ? 3 : 1;
    factors.push({
      key: "coverage", label: isAr ? "نسبة التغطية" : "Coverage Ratio", score: coverageScore,
      direction: coveragePct >= 50 ? "positive" : "negative",
      causalSentence: coveragePct >= 50
        ? (isAr ? `نسبة تغطية مرتفعة (${formatNumber(coveragePct, 0)}%) تدعم جدوى التركيب.` : `High coverage ratio (${formatNumber(coveragePct, 0)}%) supports installation feasibility.`)
        : (isAr ? `نسبة تغطية منخفضة (${formatNumber(coveragePct, 0)}%) تحد من الجدوى المالية.` : `Low coverage ratio (${formatNumber(coveragePct, 0)}%) limits financial viability.`),
    });
    const paybackScore = results.paybackYears <= 5 ? 10 : results.paybackYears <= 7 ? 8 : results.paybackYears <= 10 ? 6 : results.paybackYears <= 13 ? 3 : 1;
    factors.push({
      key: "payback", label: isAr ? "فترة الاسترداد" : "Payback Period", score: paybackScore,
      direction: results.paybackYears <= 10 ? "positive" : "negative",
      causalSentence: results.paybackYears <= 10
        ? (isAr ? `فترة استرداد قصيرة (${formatNumber(results.paybackYears, 1)} سنة) تؤكد الجدوى المالية.` : `Short payback (${formatNumber(results.paybackYears, 1)} years) confirms financial viability.`)
        : (isAr ? `فترة استرداد طويلة (${formatNumber(results.paybackYears, 1)} سنة) تضعف المبرر المالي.` : `Long payback (${formatNumber(results.paybackYears, 1)} years) weakens the financial case.`),
    });
    const areaScore = results.usableArea >= 80 ? 9 : results.usableArea >= 50 ? 7 : results.usableArea >= 30 ? 4 : 2;
    factors.push({
      key: "area", label: isAr ? "المساحة القابلة للاستخدام" : "Usable Area", score: areaScore,
      direction: results.usableArea >= 40 ? "positive" : "negative",
      causalSentence: results.usableArea >= 40
        ? (isAr ? `المساحة (${formatNumber(results.usableArea, 0)} م²) كافية لنظام ${results.kWInstalled} ك.و.` : `Usable area (${formatNumber(results.usableArea, 0)} m²) supports a ${results.kWInstalled} kW system.`)
        : (isAr ? `المساحة (${formatNumber(results.usableArea, 0)} م²) تقيّد حجم النظام.` : `Usable area (${formatNumber(results.usableArea, 0)} m²) constrains system size.`),
    });
    return factors.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const rankedFactors = computeRankedFactors();
  const rankLabels = isAr ? ["العامل الرئيسي", "العامل الثانوي", "العامل الثالث"] : ["Primary Factor", "Secondary Factor", "Minor Factor"];

  // Financial context
  const paybackContext = results.paybackYears <= 5
    ? isAr ? "أقل من النطاق النموذجي في مصر (5-8 سنوات)" : "Below Egypt's typical range of 5-8 years"
    : results.paybackYears <= 8
    ? isAr ? "ضمن النطاق النموذجي في مصر (5-8 سنوات)" : "Within Egypt's typical range of 5-8 years"
    : results.paybackYears <= 12
    ? isAr ? "أعلى من النطاق النموذجي، ضمن 8-12 سنة" : "Above Egypt's typical range, within 8-12 years"
    : isAr ? "يتجاوز 12 سنة، أعلى من نطاق التبرير النموذجي" : "Exceeds 12 years, above typical justification range";

  // Sensitivity scenarios
  const baseSavings = results.savingsYear;
  const basePayback = results.paybackYears;
  const scenarios = [
    { name: isAr ? "متحفظ" : "Conservative", desc: isAr ? "استهلاك +20%، تكلفة +15%" : "Consumption +20%, Cost +15%", paybackRange: `${formatNumber(basePayback * 1.1, 1)}–${formatNumber(basePayback * 1.2, 1)} ${isAr ? "سنة" : "yrs"}`, savingsRange: `${formatCurrency(baseSavings * 0.9)}–${formatCurrency(baseSavings)}`, color: "text-destructive bg-destructive/10 border-destructive/30" },
    { name: isAr ? "نموذجي" : "Typical", desc: isAr ? "القيم الأساسية" : "Baseline values", paybackRange: `${formatNumber(basePayback, 1)} ${isAr ? "سنة" : "yrs"}`, savingsRange: formatCurrency(baseSavings), color: "text-primary bg-primary/10 border-primary/30" },
    { name: isAr ? "متفائل" : "Optimistic", desc: isAr ? "استهلاك -20%، تكلفة -15%" : "Consumption -20%, Cost -15%", paybackRange: `${formatNumber(basePayback * 0.8, 1)}–${formatNumber(basePayback * 0.9, 1)} ${isAr ? "سنة" : "yrs"}`, savingsRange: `${formatCurrency(baseSavings)}–${formatCurrency(baseSavings * 1.1)}`, color: "text-solar-green bg-solar-green/10 border-solar-green/30" },
  ];

  // Dynamic assumptions based on market data
  const priceSource = panelPrices.isLive
    ? (isAr ? "أسعار محدّثة من السوق" : "Live market prices")
    : (isAr ? "أسعار تقديرية" : "Estimated prices");
  const tariffSource = tariffs.isLive
    ? (isAr ? `تعريفة محدّثة (${tariffs.data?.effective_date || "2026"})` : `Updated tariff (${tariffs.data?.effective_date || "2026"})`)
    : (isAr ? "تعريفة 2026 (ثابتة)" : "2026 tariff (static)");
  const costPerKwDisplay = panelPrices.data
    ? `${panelPrices.data.economy.costPerKW.toLocaleString()} - ${panelPrices.data.premium.costPerKW.toLocaleString()} EGP/kW`
    : (isAr ? "15,000 - 26,000 جنيه/ك.و" : "15,000 - 26,000 EGP/kW");

  const assumptionGroups = [
    { category: isAr ? "افتراضات الطاقة" : "Energy Assumptions", items: [
      { label: isAr ? "العائد النوعي" : "Specific Yield", value: isAr ? "1,800 ك.و.س/ك.و.ذ/سنة" : "1,800 kWh/kWp/year" },
      { label: isAr ? "بيانات الإشعاع" : "Irradiance Data", value: isAr ? "ناسا باور — المتوسط السنوي" : "NASA POWER — annual average" },
      { label: isAr ? "نسبة الأداء" : "Performance Ratio", value: "80%" },
      { label: isAr ? "تدهور الألواح" : "Panel Degradation", value: isAr ? "0.5% سنوياً" : "0.5%/year" },
      { label: isAr ? "عامل CO₂" : "CO₂ Factor", value: "0.55 kg/kWh" },
    ]},
    { category: isAr ? "افتراضات مالية" : "Financial Assumptions", items: [
      { label: isAr ? "تعريفة الكهرباء" : "Electricity Tariff", value: tariffSource },
      { label: isAr ? "تكلفة الكيلووات" : "Cost per kW", value: `${costPerKwDisplay} (${priceSource})` },
      ...(panelPrices.scraped_at ? [{ label: isAr ? "آخر تحديث للأسعار" : "Prices Last Updated", value: new Date(panelPrices.scraped_at).toLocaleDateString(isAr ? "ar-EG" : "en-US") }] : []),
    ]},
    { category: isAr ? "افتراضات تشغيلية" : "Operational Assumptions", items: [
      { label: isAr ? "العمر التشغيلي" : "System Lifetime", value: isAr ? "25 سنة" : "25 years" },
      { label: isAr ? "الاستهلاك" : "Consumption", value: isAr ? "ثابت طوال العمر التشغيلي" : "Held constant" },
    ]},
  ];

  // Input traces
  const rooftopArea = results.usableArea ? Math.round(results.usableArea / 0.65) : undefined;
  const inputTraces = [
    { label: isAr ? "مساحة السطح" : "Rooftop Area", value: rooftopArea ? `${rooftopArea} m²` : "—", impact: results.usableArea >= 60 ? "high" : results.usableArea >= 30 ? "medium" : "low" as "high" | "medium" | "low" },
    { label: isAr ? "الاستهلاك الشهري" : "Monthly Consumption", value: `${monthlyConsumption.toLocaleString()} kWh`, impact: monthlyConsumption >= 500 ? "high" : monthlyConsumption >= 200 ? "medium" : "low" as "high" | "medium" | "low" },
    { label: isAr ? "نوع الألواح" : "PV Type", value: pvType || "Standard", impact: "medium" as "high" | "medium" | "low" },
    { label: isAr ? "نوع المبنى" : "Building Type", value: buildingType || "apartment", impact: "medium" as "high" | "medium" | "low" },
  ];
  const impactBadgeColors = { high: "bg-solar-green/15 text-solar-green border-solar-green/30", medium: "bg-solar-gold/15 text-solar-gold border-solar-gold/30", low: "bg-muted text-muted-foreground border-border" };
  const impactLabels = { high: isAr ? "عالي" : "High", medium: isAr ? "متوسط" : "Medium", low: isAr ? "منخفض" : "Low" };

  return (
    <section className="container mx-auto px-4 py-12 print:py-4">
      <div className="max-w-6xl mx-auto">

        {/* ==================== SECTION 0: DECISION OVERVIEW (ALWAYS VISIBLE) ==================== */}
        <div className="mb-8 animate-fade-in">
          <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">
            {isAr ? "نظرة عامة على القرار" : "Decision Overview"}
          </h3>
          
          <div className={`p-6 rounded-2xl border-2 ${fc.bg} mb-4`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-card">
                <FeasibilityIcon className={`w-8 h-8 ${fc.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-display text-xl font-bold ${fc.color} mb-1`}>
                  {t(`results.verdict.${feasibilityStatus}`)}
                </h4>
                <p className="text-muted-foreground">
                  {feasibilityStatus === 'oversized'
                    ? t(`results.feasibility.oversizedDesc`, {
                        coverage: formatNumber(results.coverageRatio * 100, 0),
                        savings: recommended ? formatNumber(recommended.savings_from_downsizing, 0) : '—',
                      })
                    : t(`results.feasibility.${feasibilityStatus}Desc`, {
                        years: formatNumber(results.paybackYears, 1),
                        coverage: formatNumber(results.coverageRatio * 100, 0),
                      })
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Small oversized hint in decision overview */}
          {feasibilityStatus === 'oversized' && recommended && (
            <div className="p-3 rounded-xl border border-solar-green/30 bg-solar-green/5 mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-solar-green" />
              <p className="text-xs text-solar-green font-medium">
                {isAr ? "اطلع على النظام المُوصى به بالأسفل ↓" : "See the Recommended System below ↓"}
              </p>
            </div>
          )}

          {/* Approximate system cost */}
          <div className="bg-card rounded-xl border border-border/50 p-4 text-center mb-4">
            <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(results.totalCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "التكلفة التقريبية للنظام" : "Approximate System Cost"}</p>
          </div>

          {/* Two high-level figures */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border/50 p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(results.savingsYear)}</p>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "التوفير السنوي المقدر" : "Estimated Annual Savings"}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{formatNumber(results.paybackYears, 1)} {isAr ? "سنة" : "yrs"}</p>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "فترة الاسترداد" : "Payback Period"}</p>
            </div>
          </div>

          {/* Warnings */}
          {results.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl print:hidden">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <ul className="space-y-0.5">
                  {results.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-destructive/80">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Banner for free users */}
        <UpgradeBanner />

        {/* ==================== DETAILED SECTIONS (ACCORDIONS) ==================== */}
        <div className="space-y-3 print:hidden">

          {/* ==================== ACCORDION 0: RECOMMENDED SYSTEM (OVERSIZED ONLY) ==================== */}
          {feasibilityStatus === 'oversized' && recommended && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-5 bg-solar-green/10 rounded-2xl border-2 border-solar-green/40 hover:bg-solar-green/15 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-solar-green/20">
                    <TrendingUp className="w-5 h-5 text-solar-green" />
                  </div>
                  <span className="font-display text-base md:text-lg font-semibold text-solar-green">{isAr ? "النظام المُوصى به" : "Recommended System"}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-solar-green transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 animate-fade-in">
                <div className="bg-solar-green/5 rounded-2xl border-2 border-solar-green/30 p-5 space-y-4">

                  {/* Comparison header */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "النظام الحالي" : "Current System"}</p>
                      <div className="bg-card rounded-xl border border-border/50 p-3">
                        <p className="text-lg font-bold text-foreground">{results.kWInstalled} kW</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-solar-green mb-1">{isAr ? "النظام المقترح" : "Recommended"}</p>
                      <div className="bg-card rounded-xl border-2 border-solar-green/40 p-3">
                        <p className="text-lg font-bold text-solar-green">{recommended.recommended_size_kw} kW</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed comparison table */}
                  <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    {[
                      { label: isAr ? "حجم النظام" : "System Size", current: `${results.kWInstalled} kW`, rec: `${recommended.recommended_size_kw} kW` },
                      { label: isAr ? "المساحة المطلوبة" : "Required Area", current: `${formatNumber(results.usableArea, 0)} m²`, rec: `${recommended.recommended_area} m²` },
                      { label: isAr ? "التكلفة" : "Total Cost", current: formatCurrency(results.totalCost), rec: formatCurrency(recommended.recommended_cost) },
                      { label: isAr ? "نسبة التغطية" : "Coverage", current: `${formatNumber(results.coverageRatio * 100, 0)}%`, rec: "110%" },
                      { label: isAr ? "فترة الاسترداد" : "Payback", current: `${formatNumber(results.paybackYears, 1)} ${isAr ? "سنة" : "yrs"}`, rec: `${formatNumber(recommended.recommended_payback, 1)} ${isAr ? "سنة" : "yrs"}` },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border/30" : ""}`}>
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground/60 line-through">{row.current}</span>
                          <span className="font-semibold text-solar-green">{row.rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Savings highlight */}
                  <div className="bg-solar-green/10 rounded-xl p-4 text-center border border-solar-green/30">
                    <p className="text-xs text-solar-green font-medium mb-1">{isAr ? "التوفير من تصغير النظام" : "Savings From Right-Sizing"}</p>
                    <p className="text-2xl font-bold text-solar-green">{formatCurrency(recommended.savings_from_downsizing)}</p>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {isAr
                      ? "النظام المقترح يغطي 110% من استهلاكك — كافي تماماً مع هامش أمان."
                      : "The recommended system covers 110% of your consumption — fully sufficient with a safety margin."}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* ==================== ACCORDION 1: ELECTRICAL & SYSTEM DETAILS ==================== */}
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display text-base md:text-lg font-semibold text-foreground">{isAr ? "تفاصيل النظام الكهربائي" : "Electrical & System Details"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">

              {/* System specs table */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <div className="space-y-3">
                  {[
                    { label: isAr ? "السعة المركبة" : "Installed Capacity", value: `${results.kWInstalled} kW`, sub: `${isAr ? "الحد الأقصى" : "Max"}: ${formatNumber(results.kWMax)} kW` },
                    { label: isAr ? "الإنتاج السنوي" : "Annual Production", value: `${formatNumber(results.energyYear, 0)} kWh`, sub: `${formatNumber(results.energyMonth, 0)} kWh/${isAr ? "شهر" : "month"}` },
                    { label: isAr ? "عدد الألواح" : "Panels Required", value: `${results.panelCount}`, sub: "" },
                    { label: isAr ? "المساحة القابلة للاستخدام" : "Usable Rooftop Area", value: `${formatNumber(results.usableArea, 0)} m²`, sub: "" },
                    { label: isAr ? "خفض CO₂" : "CO₂ Reduction", value: `${formatNumber(results.co2Saved)} ${isAr ? "طن/سنة" : "tons/yr"}`, sub: "" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <div className="text-end">
                        <span className="text-sm font-semibold text-foreground">{row.value}</span>
                        {row.sub && <p className="text-xs text-muted-foreground">{row.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coverage Ratio */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-solar-blue" />
                  {isAr ? "نسبة التغطية" : "Coverage Ratio"}
                </h5>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="absolute h-full bg-gradient-to-r from-primary to-solar-green rounded-full transition-all duration-1000" style={{ width: `${Math.min(coveragePercent, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-foreground">{formatNumber(results.coverageRatio * 100, 0)}%</span>
                  <span className="text-xs text-muted-foreground">
                    {results.coverageRatio >= 1 ? `✓ ${t('results.fullCoverage')}` : results.coverageRatio >= 0.7 ? t('results.goodCoverage') : t('results.partialCoverage')}
                  </span>
                </div>
              </div>

              {/* Building Mode */}
              {results.buildingMode && (
                <div className="bg-card rounded-2xl border border-border/50 p-5">
                  <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-solar-blue" />
                    {t('results.buildingModeAnalysis')}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{results.numberOfUnits}</p>
                      <p className="text-[10px] text-muted-foreground">{t('results.totalUnits')}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-foreground">{results.avgUnitConsumption}</p>
                      <p className="text-[10px] text-muted-foreground">{t('results.kWhUnitMonth')}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-solar-blue">{results.effectiveMonthlyConsumption.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{t('results.totalKWhMonth')}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-solar-green">{formatNumber(results.unitsCovered, 1)}</p>
                      <p className="text-[10px] text-muted-foreground">{t('results.unitsCovered')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Recommendation */}
              {results.connectionRecommendation && (
                <div className={`p-4 rounded-xl border ${
                  results.connectionRecommendation.icon === "offgrid" ? "bg-solar-green/10 border-solar-green/30"
                  : results.connectionRecommendation.icon === "hybrid" ? "bg-solar-gold/10 border-solar-gold/30"
                  : "bg-primary/10 border-primary/30"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${results.connectionRecommendation.icon === "offgrid" ? "bg-solar-green/20" : results.connectionRecommendation.icon === "hybrid" ? "bg-solar-gold/20" : "bg-primary/20"}`}>
                      {results.connectionRecommendation.icon === "offgrid" ? <Unplug className="w-5 h-5 text-solar-green" /> : results.connectionRecommendation.icon === "hybrid" ? <Battery className="w-5 h-5 text-solar-gold" /> : <PlugZap className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('results.recommended')}: {results.connectionRecommendation.systemType}</p>
                      <p className="text-xs text-muted-foreground">{results.connectionRecommendation.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Production Chart */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <h5 className="text-sm font-semibold text-foreground mb-4">{t('results.monthlyProduction')}</h5>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`${value.toLocaleString()} kWh`, "Production"]} />
                      <Bar dataKey="production" fill="hsl(var(--solar-blue))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Input Impact Trace */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-muted-foreground" />
                  {isAr ? "تأثير المدخلات" : "Input Impact"}
                </h5>
                <div className="space-y-2">
                  {inputTraces.map((trace, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{trace.label}</p>
                        <p className="text-xs text-muted-foreground">{trace.value}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${impactBadgeColors[trace.impact]}`}>
                        {impactLabels[trace.impact]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ==================== ACCORDION 2: FINANCIAL ANALYSIS ==================== */}
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-solar-gold/10">
                  <DollarSign className="w-5 h-5 text-solar-gold" />
                </div>
                <span className="font-display text-base md:text-lg font-semibold text-foreground">{isAr ? "التحليل المالي" : "Financial Analysis"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">

              {/* Key financial metrics */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-start py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">{isAr ? "تكلفة النظام المقدرة" : "Estimated System Cost"}</span>
                    <div className="text-end">
                      <span className="text-lg font-bold text-foreground">{formatCurrency(results.totalCost)}</span>
                      <p className="text-xs text-muted-foreground">{isAr ? "حسب الباقة المختارة" : "Based on selected package"}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">{isAr ? "التوفير السنوي" : "Annual Savings"}</span>
                    <div className="text-end">
                      <span className="text-lg font-bold text-foreground">{formatCurrency(results.savingsYear)}</span>
                      <p className="text-xs text-muted-foreground">{formatCurrency(results.savingsYear / 12)} / {isAr ? "شهر" : "month"}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">{isAr ? "فترة الاسترداد" : "Payback Period"}</span>
                    <div className="text-end">
                      <span className="text-lg font-bold text-foreground">{formatNumber(results.paybackYears, 1)} {isAr ? "سنة" : "years"}</span>
                      <p className="text-xs text-muted-foreground">{paybackContext}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm text-muted-foreground">{isAr ? "عمر النظام" : "System Lifetime"}</span>
                    <span className="text-lg font-bold text-foreground">25 {isAr ? "سنة" : "years"}</span>
                  </div>
                </div>
              </div>

              {/* Package Options */}
              <LockedFeature feature="canViewPackageComparison">
              {results.packageOptions && results.packageOptions.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    {t('results.packageOptions')}
                  </h5>
                  <div className="grid md:grid-cols-3 gap-3">
                    {results.packageOptions.map((option) => {
                      const isSelected = option.packageKey === results.selectedPackage;
                      const accent = { economy: "text-solar-green border-solar-green/30", standard: "text-primary border-primary/30", premium: "text-solar-gold border-solar-gold/30" };
                      const a = accent[option.packageKey as keyof typeof accent] || accent.standard;
                      return (
                        <div key={option.packageKey} className={`p-4 rounded-xl border-2 bg-card ${isSelected ? a.replace("/30", "") : a} ${isSelected ? "shadow-md" : ""}`}>
                          {isSelected && <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t('results.selected')}</span>}
                          <p className={`font-semibold ${a.split(" ")[0]}`}>{option.package.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{option.package.efficiency} • {option.package.areaPerKW} m²/kW</p>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">{t('results.totalCost')}</span><span className="font-mono font-semibold">{formatCurrency(option.totalCost)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">{t('results.payback')}</span><span className="font-mono">{formatNumber(option.paybackYears, 1)} {isAr ? "سنة" : "yrs"}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </LockedFeature>

              {/* 25-Year ROI Timeline */}
              <LockedFeature feature="canViewROIChart">
              <ROITimeline
                initialCost={results.totalCost}
                yearlyEnergy={results.energyYear}
                electricityPrice={results.climateData?.location ? (results.savingsYear / results.energyYear) : 1.95}
              />
              </LockedFeature>

              {/* Cumulative Savings Chart */}
              <div className="bg-card rounded-2xl border border-border/50 p-5">
                <h5 className="text-sm font-semibold text-foreground mb-4">{t('results.cumulativeSavings')}</h5>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeSavings}>
                      <defs>
                        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--solar-gold))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--solar-gold))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Cumulative"]} />
                      <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--solar-gold))" strokeWidth={2} fill="url(#savingsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Why this conclusion */}
              <div className="bg-solar-blue-soft rounded-2xl border border-solar-blue/20 p-5">
                <h5 className="text-sm font-semibold text-solar-navy mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-solar-blue" />
                  {isAr ? "لماذا تم التوصل إلى هذا الاستنتاج" : "Why This Conclusion Was Reached"}
                </h5>
                <div className="space-y-2.5">
                  {rankedFactors.map((factor, i) => (
                    <div key={factor.key} className="flex items-start gap-2.5">
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <span className="w-5 h-5 rounded-full bg-solar-blue/15 text-solar-blue text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        {factor.direction === "positive" ? <ArrowUp className="w-3.5 h-3.5 text-solar-green" /> : <ArrowDown className="w-3.5 h-3.5 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{rankLabels[i]}</p>
                        <p className="text-xs text-foreground leading-relaxed">{factor.causalSentence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ==================== ACCORDION 3: ASSUMPTIONS & CONDITIONS ==================== */}
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-display text-base md:text-lg font-semibold text-foreground">{isAr ? "الافتراضات والشروط" : "Assumptions & Conditions"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">

              {assumptionGroups.map((group, gi) => (
                <div key={gi} className="bg-card rounded-2xl border border-border/50 p-5">
                  <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">{group.category}</h5>
                  <ul className="space-y-2">
                    {group.items.map((a, i) => (
                      <li key={i} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
                        <span className="text-muted-foreground">{a.label}</span>
                        <span className="font-medium text-foreground text-end">{a.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Scope & Limitations */}
              <div className="bg-muted/40 rounded-xl border border-border/50 p-5">
                <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-solar-gold" />
                  {isAr ? "النطاق والقيود" : "Scope and Limitations"}
                </h5>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-foreground mb-1.5">{isAr ? "مصمم لـ" : "Designed For"}</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {(isAr ? [
                      "المباني السكنية والتجارية والصناعية والزراعية في مصر.",
                      "أنظمة الأسطح حتى ~500 ك.و.",
                      "التقييم الأولي قبل الدراسات الميدانية.",
                      "تركيبات الزاوية الثابتة القياسية.",
                    ] : [
                      "Residential, commercial, industrial, and agricultural buildings in Egypt.",
                      "Rooftop systems up to ~500 kW.",
                      "Preliminary assessment before detailed site studies.",
                      "Standard fixed-tilt installations.",
                    ]).map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-solar-green mt-0.5">✓</span>{item}</li>)}
                  </ul>
                </div>
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs font-semibold text-foreground mb-1.5">{isAr ? "غير مصمم لـ" : "Not Designed For"}</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {(isAr ? [
                      "تصميم وتكلفة البطاريات أو التخزين.",
                      "تصاريح التركيب أو اختيار المقاولين.",
                      "أنظمة التتبع الشمسي.",
                      "حسابات تعريفة التصدير أو العداد الصافي.",
                      "المواقع خارج مصر.",
                    ] : [
                      "Battery or storage system sizing and costing.",
                      "Installation permitting or contractor selection.",
                      "Tracking (single/dual-axis) solar systems.",
                      "Export tariffs or net metering calculations.",
                      "Locations outside Egypt.",
                    ]).map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span>{item}</li>)}
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ==================== ACCORDION 4: UNCERTAINTY & SENSITIVITY ==================== */}
          <LockedFeature feature="canViewSensitivity">
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-solar-green/10">
                  <BarChart3 className="w-5 h-5 text-solar-green" />
                </div>
                <span className="font-display text-base md:text-lg font-semibold text-foreground">{isAr ? "عدم اليقين والحساسية" : "Uncertainty & Sensitivity"}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">

              <div className="space-y-3">
                {scenarios.map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.color}`}>
                    <div className="flex items-center justify-between mb-2">
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

              <div className="bg-muted/40 rounded-xl border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "النتائج قد تختلف بسبب تغيرات في أنماط الاستهلاك، أسعار الكهرباء، أداء المعدات، أو ظروف الطقس. النطاقات أعلاه توضح التأثير المحتمل لهذه التغيرات."
                    : "Results may vary due to changes in consumption patterns, electricity prices, equipment performance, or weather conditions. The ranges above illustrate the potential impact of these variations."}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
          </LockedFeature>

        </div>

        {/* Uncertainty Statement */}
        <div className="mt-6 flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{t('results.uncertaintyStatement')}</p>
        </div>

        {/* Actions Bar — Report-focused */}
        <div data-tour="report" className="mt-4 bg-gradient-to-r from-primary/10 via-solar-green/10 to-solar-gold/10 rounded-2xl border border-primary/20 p-6 md:p-8 print:mt-4">
          <div className="flex flex-col gap-6">
            {/* CTA text */}
            <div className="text-center md:text-start">
              <h4 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                {isAr ? "تقريرك جاهز" : "Your Report is Ready"}
              </h4>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                {isAr
                  ? `حمّل التقرير الكامل أو شاركه — نظام ${results.kWInstalled} كيلوواط، توفير سنوي ${formatCurrency(results.savingsYear)}، خفض ${formatNumber(results.co2Saved)} طن CO₂.`
                  : `Download the full report or share it — ${results.kWInstalled} kW system, ${formatCurrency(results.savingsYear)} annual savings, ${formatNumber(results.co2Saved)} tons CO₂ reduced.`}
              </p>
            </div>

            {/* Report actions — Primary */}
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              {/* Report download with language selector */}
              <div className="flex items-center gap-2 bg-card rounded-xl border border-border p-1.5">
                <Select value={reportLanguage} onValueChange={(v: ReportLanguage) => setReportLanguage(v)}>
                  <SelectTrigger className="w-[100px] h-9 text-xs border-0 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="ar">🇪🇬 عربي</SelectItem>
                  </SelectContent>
                </Select>
                <LockedFeature feature="canExportPDF">
                  <button onClick={handleDownloadReport} disabled={isGeneratingPdf} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-solar text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGeneratingPdf ? "..." : t('results.downloadReport')}
                  </button>
                </LockedFeature>
                {profile?.email && (
                  <button onClick={handleEmailReport} disabled={isEmailingReport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
                    {isEmailingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {isEmailingReport ? "..." : (isAr ? "إرسال بالبريد" : "Email Report")}
                  </button>
                )}
              </div>
              
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                <Printer className="w-4 h-4" />
                {t('results.printReport')}
              </button>
              {shareableParams && (
                <LockedFeature feature="canShareReport">
                  <ShareDialog params={shareableParams} trigger={
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      <Share2 className="w-4 h-4" />
                      {t('results.shareResults')}
                    </button>
                  } />
                </LockedFeature>
              )}
            </div>
          </div>
        </div>


        {/* Solar Engine Enhanced Data Badges */}
        {(solarEngineLoading || solarEngineData) && (
          <div className="mt-6">
            {solarEngineLoading && !solarEngineData ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {isAr ? "جاري تحليل البيانات المتقدمة..." : "Loading AI-enhanced analysis..."}
              </div>
            ) : solarEngineData ? (
              <div className="space-y-3">
                {/* Data source & environmental badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <Satellite className="w-3 h-3" />
                    {solarEngineData.solar_data.source === "google_solar" ? "Google Solar" : "NASA POWER"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    solarEngineData.environmental.aqi < 50 ? "bg-solar-green/10 text-solar-green border-solar-green/20" :
                    solarEngineData.environmental.aqi <= 100 ? "bg-solar-gold/10 text-solar-gold border-solar-gold/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  }`}>
                    <Wind className="w-3 h-3" />
                    AQI: {solarEngineData.environmental.aqi}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    <Mountain className="w-3 h-3" />
                    {solarEngineData.location.elevation}m
                  </span>
                  {solarEngineData.environmental.dust_efficiency_loss > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-solar-gold/10 text-solar-gold border-solar-gold/20">
                      {isAr ? `فقد غبار: ${solarEngineData.environmental.dust_efficiency_loss}%` : `Dust loss: ${solarEngineData.environmental.dust_efficiency_loss}%`}
                    </span>
                  )}
                </div>

                {solarEngineData.vision_analysis && (
                  <SatelliteVisionCard vision={solarEngineData.vision_analysis} />
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Technical Specifications - only for technical profile users */}
        {profile?.profile_type === 'technical' && (
          <TechnicalSpecifications results={results} />
        )}

      </div>
    </section>
  );
};

export default ResultsDashboard;
