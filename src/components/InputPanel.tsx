import { Home, Zap, MapPin, Cpu, Building2, Sparkles, Sun, Thermometer, TrendingUp, DollarSign, Gauge, Building, Users, Wind, Cloud, Calendar, Droplets, Wheat, Lightbulb, HelpCircle, Receipt } from "lucide-react";
import InputSanityWarnings from "./InputSanityWarnings";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { pvTypes, PVType, buildingTypes, BuildingType, costScenarios, CostScenario, defaultClimateData, SPECIFIC_YIELD, systemPackages, agriculturalActivities, AgriculturalActivity, FEDDAN_TO_SQM } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getAllSolarInsights } from "@/lib/solarInsights";
import { Card, CardContent } from "@/components/ui/card";
import { TariffTier } from "@/lib/egyptTariffs";
import { estimateKwhFromBill, getTariffForConsumption, BillEstimation } from "@/lib/billToKwh";

interface TariffInfo {
  tiers: TariffTier[];
  source: "static" | "live";
  effectiveDate: string;
}

interface InputPanelProps {
  rooftopArea: number;
  setRooftopArea: (area: number) => void;
  pvType: PVType;
  setPvType: (type: PVType) => void;
  buildingType: BuildingType;
  setBuildingType: (type: BuildingType) => void;
  costScenario: CostScenario;
  setCostScenario: (scenario: CostScenario) => void;
  electricityPrice: number;
  setElectricityPrice: (price: number) => void;
  monthlyConsumption: number;
  setMonthlyConsumption: (consumption: number) => void;
  buildingMode: boolean;
  setBuildingMode: (mode: boolean) => void;
  numberOfUnits: number;
  setNumberOfUnits: (units: number) => void;
  avgUnitConsumption: number;
  setAvgUnitConsumption: (consumption: number) => void;
  // Farm Mode props
  farmMode: boolean;
  setFarmMode: (mode: boolean) => void;
  areaInFeddans: number;
  setAreaInFeddans: (feddans: number) => void;
  agriculturalActivity: AgriculturalActivity;
  setAgriculturalActivity: (activity: AgriculturalActivity) => void;
  farmEquipmentConsumption: number;
  setFarmEquipmentConsumption: (consumption: number) => void;
  onCalculate: () => void;
  locationName?: string;
  climateData?: ClimateData | null;
  tariffInfo?: TariffInfo;
  dynamicCosts?: { economy: number; standard: number; premium: number };
}

const InputPanel = ({
  rooftopArea,
  setRooftopArea,
  pvType,
  setPvType,
  buildingType,
  setBuildingType,
  costScenario,
  setCostScenario,
  electricityPrice,
  setElectricityPrice,
  monthlyConsumption,
  setMonthlyConsumption,
  buildingMode,
  setBuildingMode,
  numberOfUnits,
  setNumberOfUnits,
  avgUnitConsumption,
  setAvgUnitConsumption,
  farmMode,
  setFarmMode,
  areaInFeddans,
  setAreaInFeddans,
  agriculturalActivity,
  setAgriculturalActivity,
  farmEquipmentConsumption,
  setFarmEquipmentConsumption,
  onCalculate,
  locationName,
  climateData,
  tariffInfo,
  dynamicCosts,
}: InputPanelProps) => {
  const { t, i18n } = useTranslation();
  const [showInsights, setShowInsights] = useState(false);
  const [usageInputMethod, setUsageInputMethod] = useState<"bill" | "kwh">("bill");
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [billEstimation, setBillEstimation] = useState<BillEstimation | null>(null);
  const isArabic = i18n.language === 'ar';
  
  const pv = pvTypes[pvType];
  const building = buildingTypes[buildingType];
  const scenario = costScenarios[costScenario];
  
  // Get selected package based on PV type
  const selectedPackage = pvType === "A_high_power_mono" 
    ? systemPackages.premium 
    : pvType === "C_poly_economy" 
      ? systemPackages.economy 
      : systemPackages.standard;
  
  // Calculate effective consumption
  const effectiveMonthlyConsumption = buildingMode 
    ? numberOfUnits * avgUnitConsumption 
    : monthlyConsumption;

  // Only use real climate data if available (not default fallback)
  const hasRealClimateData = climateData !== null && climateData !== undefined;
  const climate = climateData ?? defaultClimateData;

  // Auto-detect electricity price from consumption
  useEffect(() => {
    const consumption = buildingMode ? numberOfUnits * avgUnitConsumption : monthlyConsumption;
    if (consumption > 0) {
      const tariffInfo2 = getTariffForConsumption(consumption);
      const price = tariffInfo2.electricityPricePerKwh;
      if (Number.isFinite(price) && price > 0) {
        setElectricityPrice(price);
        console.log("[InputPanel] Auto electricity price:", price.toFixed(4), "EGP/kWh for", consumption, "kWh");
      }
    }
  }, [monthlyConsumption, buildingMode, numberOfUnits, avgUnitConsumption, setElectricityPrice]);
  
  // Get all solar insights from NASA climate data
  const insights = getAllSolarInsights(climate, isArabic);

  // Handle Farm Mode toggle - sync area and building type
  useEffect(() => {
    if (farmMode) {
      // When enabling farm mode, set building type to agricultural
      setBuildingType("agricultural");
      // Convert feddan to sqm
      setRooftopArea(Math.round(areaInFeddans * FEDDAN_TO_SQM));
      // Disable building mode
      if (buildingMode) setBuildingMode(false);
    }
  }, [farmMode, areaInFeddans]);

  // Handle building mode toggle - disable farm mode
  useEffect(() => {
    if (buildingMode && farmMode) {
      setFarmMode(false);
    }
  }, [buildingMode]);

  // Bill-to-kWh estimation
  useEffect(() => {
    if (usageInputMethod === "bill" && monthlyBill > 0) {
      const estimation = estimateKwhFromBill(monthlyBill);
      setBillEstimation(estimation);
      if (estimation.estimatedConsumptionKwh > 0) {
        setMonthlyConsumption(estimation.estimatedConsumptionKwh);
        console.log("[InputPanel] Bill→kWh: bill=", monthlyBill, "EGP → kWh=", estimation.estimatedConsumptionKwh, "bracket=", estimation.estimatedTariffBracket);
      }
    } else if (usageInputMethod === "bill" && monthlyBill <= 0) {
      setBillEstimation(null);
    }
  }, [monthlyBill, usageInputMethod]);

  // Building type labels with translations
  const buildingTypeLabels: Record<BuildingType, string> = {
    residential: t('buildingTypes.residential'),
    apartment: t('buildingTypes.apartment'),
    commercial: t('buildingTypes.commercial'),
    industrial: t('buildingTypes.industrial'),
    agricultural: t('buildingTypes.agricultural'),
  };

  // Package labels with translations
  const packageLabels: Record<string, string> = {
    economy: t('packages.economy'),
    standard: t('packages.standard'),
    premium: t('packages.premium'),
  };

  // Agricultural activity labels
  const activityLabels: Record<AgriculturalActivity, { label: string; icon: string }> = {
    drip_irrigation: { label: t('farmMode.dripIrrigation'), icon: "🌱" },
    greenhouse: { label: t('farmMode.greenhouse'), icon: "🏠" },
    poultry_livestock: { label: t('farmMode.poultryLivestock'), icon: "🐔" },
    cold_storage: { label: t('farmMode.coldStorage'), icon: "❄️" },
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ==================== MANUAL INPUTS ==================== */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 animate-slide-up">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            {t('input.title')}
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Rooftop Area */}
            <div className="space-y-3">
              <Label htmlFor="rooftop-area" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                {t('input.rooftopArea')}
                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[250px]"><p className="text-xs">{t('input.rooftopAreaTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Input
                id="rooftop-area"
                type="number"
                value={rooftopArea || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setRooftopArea(0);
                  } else {
                    setRooftopArea(Math.max(1, Number(val)));
                  }
                }}
                min={1}
                max={10000}
                className="h-12 text-lg font-medium"
                placeholder={t('input.rooftopAreaHint')}
              />
              <p className="text-xs text-muted-foreground">
                {t('input.rooftopAreaHint')}
              </p>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {t('input.location')}
              </Label>
              <div className="h-12 flex items-center px-3 bg-muted/50 rounded-md border border-border">
                {locationName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
                    <p className="text-sm font-medium text-foreground">{locationName}</p>
                    {climateData?.annualAvgIrradiance && (
                      <span className="text-xs text-muted-foreground ms-2">
                        ({climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day)
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">📍 {t('input.selectLocation')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Building Type Selection - Hide Agricultural option when not in farm mode */}
          <div className={`space-y-3 mb-6 ${farmMode ? 'hidden' : ''}`}>
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              {t('input.buildingType')}
              <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[250px]"><p className="text-xs">{t('input.buildingTypeTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(buildingTypes) as [BuildingType, typeof buildingTypes[BuildingType]][])
                .filter(([key]) => key !== 'agricultural')
                .map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setBuildingType(key)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    buildingType === key 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{buildingTypeLabels[key]}</p>
                  <p className="text-xs opacity-70">{Math.round(data.usableFraction * 100)}% {isArabic ? 'قابل للاستخدام' : 'usable'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* PV Type / Package Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              {t('input.systemPackage')}
              <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[250px]"><p className="text-xs">{t('input.systemPackageTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "C_poly_economy" as PVType, pkg: systemPackages.economy, label: packageLabels.economy },
                { key: "B_standard_mono" as PVType, pkg: systemPackages.standard, label: packageLabels.standard },
                { key: "A_high_power_mono" as PVType, pkg: systemPackages.premium, label: packageLabels.premium },
              ].map(({ key, pkg, label }) => (
                <button
                  key={key}
                  onClick={() => setPvType(key)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    pvType === key 
                      ? "bg-primary/10 border-primary text-primary shadow-md" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs opacity-70 mt-1">{pkg.efficiency}</p>
                  <p className="text-xs opacity-70">{pkg.areaPerKW} m²/kW</p>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-medium">
                      {(dynamicCosts?.[key === "C_poly_economy" ? "economy" : key === "B_standard_mono" ? "standard" : "premium"] ?? pkg.costPerKW).toLocaleString()} {t('common.EGP')}/kW
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-detected Electricity Price Display */}
          {effectiveMonthlyConsumption > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {isArabic ? "سعر الكهرباء المُحدد تلقائياً" : "Auto-detected Electricity Price"}
                </span>
              </div>
              <p className="text-lg font-bold text-primary">
                {electricityPrice.toFixed(2)} {t('common.EGP')}/{t('common.kWh')}
              </p>
              {tariffInfo?.source === "live" && (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {tariffInfo?.effectiveDate} - {isArabic ? "بيانات حية" : "Live data"}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isArabic ? "يتم تحديد السعر تلقائياً بناءً على شريحة استهلاكك" : "Price is automatically determined based on your consumption bracket"}
              </p>
            </div>
          )}

          {/* ==================== FARM MODE SECTION ==================== */}
          <div className="border-t border-border pt-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Wheat className="w-4 h-4 text-muted-foreground" />
                {t('farmMode.title')}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{farmMode ? (isArabic ? 'مفعّل' : 'Enabled') : (isArabic ? 'معطّل' : 'Disabled')}</span>
                <Switch
                  checked={farmMode}
                  onCheckedChange={setFarmMode}
                />
              </div>
            </div>

            {farmMode && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4 space-y-4">
                  {/* Area in Feddans */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t('farmMode.areaInFeddans')}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={areaInFeddans || ''}
                        onChange={(e) => setAreaInFeddans(e.target.value === '' ? 0 : Number(e.target.value))}
                        min={0.1}
                        step={0.5}
                        className="h-12 text-lg font-medium flex-1"
                        placeholder={isArabic ? "أدخل المساحة بالفدان" : "Enter area in feddans"}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {isArabic ? 'فدان' : 'Feddan'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">=</span>
                      <span className="font-bold text-primary">{Math.round(areaInFeddans * FEDDAN_TO_SQM).toLocaleString()} m²</span>
                      <span className="text-xs text-muted-foreground">({t('farmMode.feddanEquivalent')})</span>
                    </div>
                  </div>

                  {/* Agricultural Activity Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      {t('farmMode.activityType')}
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(Object.entries(agriculturalActivities) as [AgriculturalActivity, typeof agriculturalActivities[AgriculturalActivity]][]).map(([key, data]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setAgriculturalActivity(key);
                            // Auto-suggest consumption based on activity and feddans
                            const estimated = key === 'drip_irrigation' 
                              ? data.estimatedConsumption * areaInFeddans
                              : data.estimatedConsumption;
                            setFarmEquipmentConsumption(Math.round(estimated));
                          }}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            agriculturalActivity === key 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-background/80 border-border/50 text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="text-xl">{activityLabels[key].icon}</span>
                          <p className="font-medium text-xs mt-1">{activityLabels[key].label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment Consumption */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      {t('farmMode.equipmentConsumption')}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={farmEquipmentConsumption || ''}
                        onChange={(e) => setFarmEquipmentConsumption(e.target.value === '' ? 0 : Number(e.target.value))}
                        min={0}
                        className="h-12 text-lg font-medium flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('common.kWh')}/{t('common.month')}
                      </span>
                    </div>
                  </div>

                  {/* Quick Estimation Tips */}
                  <div className="bg-background/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      {t('farmMode.estimationTip')}
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {t('farmMode.pumpEstimate')}</li>
                      <li>• {t('farmMode.greenhouseEstimate')}</li>
                      <li>• {t('farmMode.poultryEstimate')}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ==================== CONSUMPTION SECTION (Hide when Farm Mode is active) ==================== */}
          <div className={`border-t border-border pt-6 mb-6 ${farmMode ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                {t('input.buildingMode')}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{buildingMode ? t('input.multiUnit') : t('input.singleConsumption')}</span>
                <Switch
                  checked={buildingMode}
                  onCheckedChange={setBuildingMode}
                />
              </div>
            </div>

            {buildingMode ? (
              /* Building Mode: Multiple Units */
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span>{isArabic ? 'حساب الاستهلاك بناءً على عدد الوحدات السكنية' : 'Calculate consumption based on number of apartment units'}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-units" className="text-sm">{t('input.numberOfUnits')}</Label>
                    <Input
                      id="num-units"
                      type="number"
                      value={numberOfUnits || ''}
                      onChange={(e) => setNumberOfUnits(e.target.value === '' ? 0 : Number(e.target.value))}
                      min={0}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avg-consumption" className="text-sm">{t('input.avgConsumption')}</Label>
                    <Input
                      id="avg-consumption"
                      type="number"
                      value={avgUnitConsumption || ''}
                      onChange={(e) => setAvgUnitConsumption(e.target.value === '' ? 0 : Number(e.target.value))}
                      min={0}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t('input.totalBuildingConsumption')}: <span className="font-bold text-foreground">{(numberOfUnits * avgUnitConsumption).toLocaleString()} {t('common.kWh')}/{t('common.month')}</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Mode: Usage Input Method Toggle */
              <div className="space-y-4">
                {/* Usage Method Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    {t('input.usageMethodTitle')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setUsageInputMethod("bill")}
                      className={`p-3 rounded-xl border text-center transition-all text-sm ${
                        usageInputMethod === "bill"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Receipt className="w-4 h-4 mx-auto mb-1" />
                      {t('input.usageMethodBill')}
                    </button>
                    <button
                      onClick={() => setUsageInputMethod("kwh")}
                      className={`p-3 rounded-xl border text-center transition-all text-sm ${
                        usageInputMethod === "kwh"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Zap className="w-4 h-4 mx-auto mb-1" />
                      {t('input.usageMethodKwh')}
                    </button>
                  </div>
                </div>

                {/* Bill Input */}
                {usageInputMethod === "bill" && (
                  <div className="space-y-3">
                    <Label htmlFor="monthly-bill" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      {t('input.monthlyBillLabel')}
                    </Label>
                    <Input
                      id="monthly-bill"
                      type="number"
                      value={monthlyBill || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                        if (Number.isFinite(val)) setMonthlyBill(val);
                      }}
                      min={0}
                      className="h-12 text-lg font-medium"
                      placeholder={isArabic ? "مثال: 500 جنيه" : "Example: 500 EGP"}
                    />
                    {billEstimation && billEstimation.estimatedConsumptionKwh > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                        <p className="text-sm text-foreground">
                          {isArabic ? "الاستهلاك التقديري:" : "Estimated monthly consumption:"}{" "}
                          <span className="font-semibold text-primary">
                            ~{billEstimation.estimatedConsumptionKwh.toLocaleString()} {t('common.kWh')}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "الشريحة التقديرية:" : "Estimated tariff bracket:"}{" "}
                          {isArabic ? billEstimation.estimatedTariffBracketAr : billEstimation.estimatedTariffBracket}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "سعر الكهرباء:" : "Electricity price:"}{" "}
                          <span className="font-semibold">{billEstimation.electricityPricePerKwh.toFixed(2)} {t('common.EGP')}/{t('common.kWh')}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* kWh Input */}
                {usageInputMethod === "kwh" && (
                  <div className="space-y-3">
                    <Label htmlFor="monthly-consumption" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      {t('input.monthlyConsumption')}
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[250px]"><p className="text-xs">{t('input.monthlyConsumptionTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>
                    </Label>
                    <Input
                      id="monthly-consumption"
                      type="number"
                      value={monthlyConsumption || ''}
                      onChange={(e) => setMonthlyConsumption(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="h-12 text-lg font-medium"
                      placeholder={isArabic ? "مثال: 350 ك.و.س" : "Example: 350 kWh"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('input.checkBill')}
                    </p>
                    {monthlyConsumption > 0 && (() => {
                      const info = getTariffForConsumption(monthlyConsumption);
                      return (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {isArabic ? "الشريحة التقديرية:" : "Estimated tariff bracket:"}{" "}
                            {isArabic ? info.estimatedTariffBracketAr : info.estimatedTariffBracket}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isArabic ? "سعر الكهرباء:" : "Electricity price:"}{" "}
                            <span className="font-semibold">{info.electricityPricePerKwh.toFixed(2)} {t('common.EGP')}/{t('common.kWh')}</span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================== COMPACT SMART INSIGHTS - Before Calculate ==================== */}
          {hasRealClimateData && (
            <Collapsible open={showInsights} onOpenChange={setShowInsights} className="mb-6">
              <CollapsibleTrigger className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 flex items-center justify-between hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">{t('insights.title')}</span>
                  {locationName && (
                    <span className="text-xs text-muted-foreground">• {locationName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!showInsights && (
                    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500" />
                        {insights.peakProduction.peakMonths.slice(0, 2).join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-orange-500" />
                        {insights.temperatureRisk.maxTemp.toFixed(0)}°C
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-teal-500" />
                        {insights.windRisk.avgWindSpeed}m/s
                      </span>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showInsights ? "rotate-180" : ""}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-3 space-y-3">
                  {/* Row 1: Key Insights */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* Peak Production */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-xs">{t('insights.peakProduction')}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{insights.peakProduction.peakMonths.slice(0, 3).join(", ")}</p>
                      <p className="text-[10px] text-muted-foreground">{insights.peakProduction.peakHours}</p>
                    </div>

                    {/* Heat Warning */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-xs">{t('insights.heatWarning')}</span>
                      </div>
                      {insights.temperatureRisk.hotMonths.length > 0 ? (
                        <>
                          <p className="text-sm font-bold text-foreground">{insights.temperatureRisk.hotMonths.slice(0, 2).join(", ")}</p>
                          <p className="text-[10px] text-muted-foreground">-{insights.temperatureRisk.avgEfficiencyLoss}% • {insights.temperatureRisk.maxTemp.toFixed(0)}°C</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('insights.noHeatRisk')}</p>
                      )}
                    </div>

                    {/* Cleaning */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Droplets className="w-4 h-4 text-sky-500" />
                        <span className="font-medium text-xs">{t('insights.cleaningSchedule')}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{insights.cleaningSchedule.dustyFrequency}</p>
                      <p className="text-[10px] text-muted-foreground">{insights.cleaningSchedule.dustyMonths.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>

                  {/* Row 2: More Insights */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Wind */}
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                      <Wind className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">
                        {insights.windRisk.riskLevel === "low" && t('insights.lowRisk')}
                        {insights.windRisk.riskLevel === "moderate" && t('insights.moderateRisk')}
                        {insights.windRisk.riskLevel === "high" && t('insights.highRisk')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{insights.windRisk.avgWindSpeed} m/s</p>
                    </div>

                    {/* Cloud */}
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                      <Cloud className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">{insights.cloudCover.avgCloudCover}%</p>
                      <p className="text-[10px] text-muted-foreground">{t('insights.avgCloud')}</p>
                    </div>

                    {/* Best Install */}
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                      <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">{insights.optimalInstall.bestMonths.slice(0, 2).join(", ")}</p>
                      <p className="text-[10px] text-muted-foreground">{t('insights.bestInstall')}</p>
                    </div>
                  </div>

                  {/* Monthly Mini Calendar */}
                  <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span className="font-medium text-[10px] text-muted-foreground">{t('insights.monthlyCalendar')}</span>
                    </div>
                    <div className="flex justify-between items-end gap-0.5">
                      {insights.monthlyCalendar.map((month, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-full rounded-t-sm transition-all ${
                              month.level === "high" 
                                ? "bg-primary h-5" 
                                : month.level === "medium" 
                                  ? "bg-primary/60 h-3" 
                                  : "bg-primary/30 h-2"
                            }`}
                            title={`${month.month}: ${month.irradiance.toFixed(1)} kWh/m²/day`}
                          />
                          <span className="text-[8px] text-muted-foreground mt-0.5">
                            {month.month.slice(0, 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Input Sanity Warnings */}
          <InputSanityWarnings
            rooftopArea={rooftopArea}
            monthlyConsumption={monthlyConsumption}
            electricityPrice={electricityPrice}
            electricityPriceMin={0.68}
            electricityPriceMax={2.23}
            buildingMode={buildingMode}
            numberOfUnits={numberOfUnits}
            avgUnitConsumption={avgUnitConsumption}
            farmMode={farmMode}
            farmEquipmentConsumption={farmEquipmentConsumption}
            areaInFeddans={areaInFeddans}
          />

          {/* Calculate Button */}
          <Button
            onClick={onCalculate}
            size="lg"
            disabled={!climateData}
            className="w-full h-14 text-lg font-semibold gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Zap className="w-5 h-5 me-2" />
            {!climateData ? t('input.selectLocationFirst') : t('input.calculate')}
          </Button>
        </div>

      </div>
    </section>
  );
};

export default InputPanel;
