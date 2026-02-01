import { Home, Zap, MapPin, Cpu, Building2, Sparkles, Sun, Thermometer, TrendingUp, DollarSign, Gauge, Building, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { pvTypes, PVType, buildingTypes, BuildingType, costScenarios, CostScenario, defaultClimateData, SPECIFIC_YIELD, systemPackages } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
  onCalculate: () => void;
  locationName?: string;
  climateData?: ClimateData | null;
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
  onCalculate,
  locationName,
  climateData,
}: InputPanelProps) => {
  const { t, i18n } = useTranslation();
  const [showInsights, setShowInsights] = useState(false);
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
  
  // Live calculations following the exact formula
  const usableArea = rooftopArea * building.usableFraction;
  const kWMax = usableArea / pv.areaPerKW;
  const kWInstalled = Math.floor(kWMax * 0.95);
  const totalCost = kWInstalled * selectedPackage.costPerKW;
  const energyYear = kWInstalled * SPECIFIC_YIELD;

  // Only use real climate data if available (not default fallback)
  const hasRealClimateData = climateData !== null && climateData !== undefined;
  const climate = climateData ?? defaultClimateData;
  
  // Find peak months (only relevant when we have real data)
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthNames = isArabic ? MONTHS_AR : MONTHS;
  const maxIrr = Math.max(...climate.monthlyIrradiance);
  const peakMonths = climate.monthlyIrradiance
    .map((v, i) => ({ v, m: monthNames[i] }))
    .filter(x => x.v >= maxIrr * 0.9)
    .map(x => x.m);
  const avgTemp = climate.monthlyTemperature.reduce((a, b) => a + b, 0) / 12;

  // Building type labels with translations
  const buildingTypeLabels: Record<BuildingType, string> = {
    residential: t('buildingTypes.residential'),
    apartment: t('buildingTypes.apartment'),
    commercial: t('buildingTypes.commercial'),
    industrial: t('buildingTypes.industrial'),
  };

  // Package labels with translations
  const packageLabels: Record<string, string> = {
    economy: t('packages.economy'),
    standard: t('packages.standard'),
    premium: t('packages.premium'),
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
              </Label>
              <Input
                id="rooftop-area"
                type="number"
                value={rooftopArea}
                onChange={(e) => setRooftopArea(Math.max(1, Number(e.target.value)))}
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

          {/* Building Type Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              {t('input.buildingType')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(buildingTypes) as [BuildingType, typeof buildingTypes[BuildingType]][]).map(([key, data]) => (
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
                    <p className="text-xs font-medium">{pkg.costRange} {t('common.EGP')}/kW</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Electricity Price Slider */}
          <div className="space-y-4 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                {t('input.electricityPrice')}
              </span>
              <span className="text-lg font-semibold text-primary">{electricityPrice.toFixed(2)} {t('common.EGP')}</span>
            </Label>
            <div className="px-2">
              <Slider
                value={[electricityPrice]}
                onValueChange={(v) => setElectricityPrice(v[0])}
                min={0.8}
                max={2.3}
                step={0.05}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.80 {t('common.EGP')}</span>
              <span>2.30 {t('common.EGP')}</span>
            </div>
          </div>

          {/* ==================== CONSUMPTION SECTION ==================== */}
          <div className="border-t border-border pt-6 mb-6">
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
              /* Standard Mode: Single Consumption Input */
              <div className="space-y-3">
                <Label htmlFor="monthly-consumption" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  {t('input.monthlyConsumption')}
                </Label>
                <Input
                  id="monthly-consumption"
                  type="number"
                  value={monthlyConsumption || ''}
                  onChange={(e) => setMonthlyConsumption(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={0}
                  className="h-12 text-lg font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  {t('input.checkBill')}
                </p>
              </div>
            )}
          </div>

          {/* Live Preview - Following exact formula */}
          <div className="bg-muted/30 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('input.livePreview')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-foreground">{rooftopArea} m²</p>
                <p className="text-xs text-muted-foreground">{t('input.totalRoof')}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-solar-green">{usableArea.toFixed(0)} m²</p>
                <p className="text-xs text-muted-foreground">{t('input.usable')} ({Math.round(building.usableFraction * 100)}%)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-muted-foreground">{kWMax.toFixed(1)} kW</p>
                <p className="text-xs text-muted-foreground">{t('input.kwMax')}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{kWInstalled} kW</p>
                <p className="text-xs text-muted-foreground">{t('input.kwInstalled')} (×0.95)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-solar-gold">{totalCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('input.totalCost')}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{kWInstalled} kW</span> × <span className="font-medium text-foreground">{selectedPackage.costPerKW.toLocaleString()} {t('common.EGP')}/kW</span> = <span className="font-bold text-primary">{totalCost.toLocaleString()} {t('common.EGP')}</span>
              </p>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={onCalculate}
            size="lg"
            className="w-full h-14 text-lg font-semibold gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 me-2" />
            {t('input.calculate')}
          </Button>
        </div>

        {/* ==================== AUTO INSIGHTS (COLLAPSIBLE) - Only show when location is detected ==================== */}
        {hasRealClimateData && (
          <Collapsible open={showInsights} onOpenChange={setShowInsights}>
            <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-solar-green" />
                  <span className="font-medium text-foreground">{t('insights.title')}</span>
                  {locationName && (
                    <span className="text-xs text-muted-foreground">({locationName})</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showInsights ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 grid md:grid-cols-3 gap-4">
                  {/* Solar Irradiance */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-5 h-5 text-solar-gold" />
                      <span className="font-medium text-sm">{t('insights.solarIrradiance')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{climate.annualAvgIrradiance.toFixed(1)} kWh/m²/day</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('insights.peakMonths')}: {peakMonths.join(", ")}</p>
                  </div>

                  {/* Temperature */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-orange-500" />
                      <span className="font-medium text-sm">{t('insights.temperature')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{avgTemp.toFixed(0)}°C {t('insights.avgAnnual')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {avgTemp > 28 
                        ? (isArabic ? "درجات الحرارة المرتفعة قد تقلل الكفاءة 5-10%" : "High temps may reduce efficiency 5-10%") 
                        : (isArabic ? "مناسب لكفاءة الألواح" : "Favorable for panel efficiency")}
                    </p>
                  </div>

                  {/* Expected Yield */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">{t('insights.yearlyPotential')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">1,800 kWh/kW/{isArabic ? 'سنة' : 'yr'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isArabic ? 'المتوسط الوطني لمصر' : 'Egypt national average'}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

      </div>
    </section>
  );
};

export default InputPanel;
