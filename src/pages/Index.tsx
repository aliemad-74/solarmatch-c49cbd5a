import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import LimitReachedModal from "@/components/LimitReachedModal";

import MobileBottomNav from "@/components/MobileBottomNav";
import ProgressIndicator from "@/components/ProgressIndicator";
import ScrollReveal from "@/components/ScrollReveal";
import ResultsSkeleton from "@/components/ResultsSkeleton";
import LiveReportCounter from "@/components/LiveReportCounter";

import { useUserAuth } from "@/contexts/UserAuthContext";
import { calculateSolarFeasibility, SolarCalculation, PVType, BuildingType, CostScenario, defaultClimateData, AgriculturalActivity, FEDDAN_TO_SQM, buildingTypes, systemPackages } from "@/lib/solarData";
import { toast } from "sonner";
import { ClimateData } from "@/lib/climateApi";
import { parseShareFromUrl, ShareableParams } from "@/lib/shareUtils";
import { loadPersistedInputs, saveInputs } from "@/hooks/usePersistedInputs";

export interface SolarEngineData {
  success: boolean;
  location: {
    formatted_address: string;
    city: string;
    governorate?: string;
    elevation: number;
    coordinates: { lat: number; lng: number };
  };
  environmental: {
    aqi: number;
    dust_efficiency_loss: number;
    temperature: number;
    humidity?: number;
    cloud_cover: number;
    weather_description: string;
  };
  solar_data: {
    source: "google_solar" | "nasa_power";
    irradiance: number;
    adjusted_irradiance: number;
    max_panels: number | null;
    sunshine_hours: number | null;
  };
  calculation: {
    system_size_kw: number;
    annual_production: number;
    coverage_ratio: number;
    total_cost: number;
    annual_savings: number;
    payback_years: number;
    co2_saved: number;
    feasibility: "suitable" | "conditional" | "not_suitable";
    pv_package: string;
  };
  ai_analysis: {
    recommendation: string;
    confidence: "high" | "medium" | "low";
  };
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, canGenerateReport, recordReportGeneration } = useUserAuth();
  
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [pendingCalculation, setPendingCalculation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Solar engine enhanced data
  const [solarEngineData, setSolarEngineData] = useState<SolarEngineData | null>(null);
  const [solarEngineLoading, setSolarEngineLoading] = useState(false);
  
  // Explicit user-interaction flags (not from defaults/persisted)
  const [userSelectedLocation, setUserSelectedLocation] = useState(false);
  const [userEditedConfig, setUserEditedConfig] = useState(false);
  const initialLocationLoadRef = useRef(true);
  // Load persisted inputs
  const persisted = loadPersistedInputs();
  
  // Manual inputs
  const [rooftopArea, setRooftopArea] = useState<number>(persisted.rooftopArea);
  const [pvType, setPvType] = useState<PVType>(persisted.pvType as PVType);
  const [buildingType, setBuildingType] = useState<BuildingType>(persisted.buildingType as BuildingType);
  const [costScenario, setCostScenario] = useState<CostScenario>(persisted.costScenario as CostScenario);
  const [electricityPrice, setElectricityPrice] = useState<number>(persisted.electricityPrice);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(persisted.monthlyConsumption);
  
  // Building Mode inputs
  const [buildingMode, setBuildingMode] = useState<boolean>(persisted.buildingMode);
  const [numberOfUnits, setNumberOfUnits] = useState<number>(persisted.numberOfUnits);
  const [avgUnitConsumption, setAvgUnitConsumption] = useState<number>(persisted.avgUnitConsumption);
  
  // Farm Mode inputs
  const [farmMode, setFarmMode] = useState<boolean>(persisted.farmMode);
  const [areaInFeddans, setAreaInFeddans] = useState<number>(persisted.areaInFeddans);
  const [agriculturalActivity, setAgriculturalActivity] = useState<AgriculturalActivity>(persisted.agriculturalActivity as AgriculturalActivity);
  const [farmEquipmentConsumption, setFarmEquipmentConsumption] = useState<number>(persisted.farmEquipmentConsumption);
  
  // Map/location state
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  
  const [locationName, setLocationName] = useState<string>("");
  
  // Results
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Persist inputs whenever they change
  useEffect(() => {
    saveInputs({
      rooftopArea, pvType, buildingType, costScenario, electricityPrice,
      monthlyConsumption, buildingMode, numberOfUnits, avgUnitConsumption,
      farmMode, areaInFeddans, agriculturalActivity, farmEquipmentConsumption,
    });
  }, [rooftopArea, pvType, buildingType, costScenario, electricityPrice,
      monthlyConsumption, buildingMode, numberOfUnits, avgUnitConsumption,
      farmMode, areaInFeddans, agriculturalActivity, farmEquipmentConsumption]);

  // Check for shared URL parameters on load
  useEffect(() => {
    const sharedParams = parseShareFromUrl();
    if (sharedParams) {
      loadSharedParams(sharedParams);
    }
  }, []);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      setResults(null);
      setShowResults(false);
      setPendingCalculation(false);
    }
  }, [user]);

  const loadSharedParams = (params: ShareableParams) => {
    setRooftopArea(params.rooftopArea);
    setPvType(params.pvType);
    setBuildingType(params.buildingType);
    setCostScenario(params.costScenario);
    setElectricityPrice(params.electricityPrice);
    setMonthlyConsumption(params.monthlyConsumption);
    setBuildingMode(params.buildingMode);
    setNumberOfUnits(params.numberOfUnits);
    setAvgUnitConsumption(params.avgUnitConsumption);
    
    if (params.locationName) {
      setLocationName(params.locationName);
    }

    setTimeout(() => {
      handleCalculate();
    }, 500);
  };

  const effectiveMonthlyConsumption = farmMode 
    ? farmEquipmentConsumption
    : buildingMode 
      ? numberOfUnits * avgUnitConsumption 
      : monthlyConsumption;

  // Handle auth success - proceed with calculation
  useEffect(() => {
    if (pendingCalculation && user && profile && canGenerateReport) {
      setPendingCalculation(false);
      performCalculation();
    }
  }, [user, profile, canGenerateReport, pendingCalculation]);

  // Call solar-engine in parallel (fire and forget enhancement)
  const callSolarEngine = async () => {
    const packageMap: Record<string, string> = {
      'C_poly_economy': 'economy', 'low': 'economy',
      'B_standard_mono': 'standard', 'medium': 'standard',
      'A_high_power_mono': 'premium', 'high': 'premium',
    };
    const pkg = packageMap[costScenario] || packageMap[pvType] || 'standard';

    setSolarEngineLoading(true);
    setSolarEngineData(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            latitude: climateData?.location?.lat,
            longitude: climateData?.location?.lng,
            monthlyConsumption: effectiveMonthlyConsumption,
            rooftopArea,
            buildingType,
            pvPackage: pkg,
            farmMode,
            areaInFeddans: farmMode ? areaInFeddans : undefined,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: SolarEngineData = await res.json();
        if (data.success) {
          setSolarEngineData(data);

          // Silent capture-lead call
          try {
            fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-lead`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                  latitude: data.location.coordinates.lat,
                  longitude: data.location.coordinates.lng,
                  city: data.location.city,
                  governorate: data.location.governorate,
                  formatted_address: data.location.formatted_address,
                  building_type: buildingType,
                  pv_package: pkg,
                  monthly_consumption: effectiveMonthlyConsumption,
                  rooftop_area: rooftopArea,
                  system_size_kw: data.calculation.system_size_kw,
                  annual_production: data.calculation.annual_production,
                  annual_savings: data.calculation.annual_savings,
                  payback_years: data.calculation.payback_years,
                  total_cost: data.calculation.total_cost,
                  coverage_ratio: data.calculation.coverage_ratio,
                  co2_saved: data.calculation.co2_saved,
                  feasibility: data.calculation.feasibility,
                  aqi: data.environmental.aqi,
                  elevation: data.location.elevation,
                  data_source: data.solar_data.source,
                  dust_efficiency_loss: data.environmental.dust_efficiency_loss,
                  temperature: data.environmental.temperature,
                  cloud_cover: data.environmental.cloud_cover,
                  ai_recommendation: data.ai_analysis.recommendation,
                  ai_confidence: data.ai_analysis.confidence,
                  user_id: user?.id || null,
                  farm_mode: farmMode,
                  area_in_feddans: farmMode ? areaInFeddans : null,
                }),
              }
            );
          } catch {
            // Silent - don't bother user
          }
        }
      }
    } catch {
      // Silent timeout/failure - existing results remain
    } finally {
      setSolarEngineLoading(false);
    }
  };

  const performCalculation = async () => {
    setIsCalculating(true);
    
    // Fire solar-engine in parallel (non-blocking enhancement)
    callSolarEngine();
    
    try {
      // Determine which package maps to the selected pvType + costScenario
      const packageMap: Record<string, string> = {
        'C_poly_economy': 'economy', 'low': 'economy',
        'B_standard_mono': 'standard', 'medium': 'standard',
        'A_high_power_mono': 'premium', 'high': 'premium',
      };
      const selectedPackage = packageMap[costScenario] || packageMap[pvType] || 'standard';
      const building = buildingTypes[buildingType];

      const solarData = {
        locationName,
        rooftopArea,
        buildingType,
        usableFraction: building?.usableFraction || 0.60,
        monthlyConsumption: effectiveMonthlyConsumption,
        electricityPrice,
        pvType,
        costScenario,
        lat: climateData?.location?.lat,
        lng: climateData?.location?.lng,
        climateData: climateData ? {
          annualAvgIrradiance: climateData.annualAvgIrradiance,
          monthlyIrradiance: climateData.monthlyIrradiance,
          monthlyTemperature: climateData.monthlyTemperature,
        } : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ solarData, language: i18n.language, mode: "report" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error(i18n.language === 'ar' ? "تم تجاوز الحد المسموح، حاول لاحقاً" : "Rate limit exceeded, try later");
          return;
        }
        throw new Error(errorData.error || "AI calculation failed");
      }

      const aiResult = await response.json();

      // Map AI result to SolarCalculation interface
      const pkg = systemPackages[selectedPackage as keyof typeof systemPackages] || systemPackages.standard;
      const calculation: SolarCalculation = {
        usableArea: aiResult.usableArea,
        kWMax: aiResult.kWMax,
        kWInstalled: aiResult.kWInstalled,
        energyYear: aiResult.energyYear,
        energyMonth: aiResult.energyMonth,
        monthlyProduction: aiResult.monthlyProduction || Array(12).fill(Math.round(aiResult.energyYear / 12)),
        savingsYear: aiResult.savingsYear,
        savingsMonth: aiResult.savingsMonth,
        totalCost: aiResult.totalCost,
        costPerKW: aiResult.costPerKW,
        paybackYears: aiResult.paybackYears,
        coverageRatio: aiResult.coverageRatio,
        co2Saved: aiResult.co2Saved,
        panelCount: aiResult.panelCount,
        panelWattage: aiResult.panelWattage,
        connectionRecommendation: aiResult.connectionRecommendation,
        packageOptions: (aiResult.packageOptions || []).map((opt: any) => ({
          packageKey: opt.packageKey,
          package: systemPackages[opt.packageKey as keyof typeof systemPackages] || pkg,
          kWInstalled: opt.kWInstalled,
          totalCost: opt.totalCost,
          energyYear: opt.energyYear,
          savingsYear: opt.savingsYear,
          paybackYears: opt.paybackYears,
          coverageRatio: opt.coverageRatio,
          panelCount: opt.panelCount,
        })),
        selectedPackage: selectedPackage as any,
        buildingMode,
        numberOfUnits,
        avgUnitConsumption,
        effectiveMonthlyConsumption,
        annualConsumption: effectiveMonthlyConsumption * 12,
        unitsCovered: buildingMode ? (aiResult.coverageRatio * numberOfUnits) : 0,
        pvType,
        buildingType,
        costScenario,
        climateData: climateData || undefined,
        warnings: aiResult.warnings || [],
      };

      setResults(calculation);
      setShowResults(true);

      if (user && profile) {
        await recordReportGeneration(locationName, calculation.kWInstalled);
      }

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("AI Calculation error:", error);
      toast.error(i18n.language === 'ar' ? "حدث خطأ في الحسابات، جاري المحاولة بالطريقة التقليدية..." : "AI calculation error, falling back to local...");
      
      // Fallback to local calculation
      const calculation = calculateSolarFeasibility(
        rooftopArea, climateData, electricityPrice, pvType, buildingType,
        costScenario, effectiveMonthlyConsumption, buildingMode, numberOfUnits, avgUnitConsumption
      );
      setResults(calculation);
      setShowResults(true);

      if (user && profile) {
        await recordReportGeneration(locationName, calculation.kWInstalled);
      }

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = () => {
    if (!user || !profile) {
      setShowAuthModal(true);
      setPendingCalculation(true);
      return;
    }

    if (!canGenerateReport) {
      setShowLimitReachedModal(true);
      return;
    }

    performCalculation();
  };

  const getShareableParams = (): ShareableParams => ({
    rooftopArea,
    pvType,
    buildingType,
    costScenario,
    electricityPrice,
    monthlyConsumption,
    buildingMode,
    numberOfUnits,
    avgUnitConsumption,
    lat: climateData?.location?.lat,
    lng: climateData?.location?.lng,
    locationName,
  });

  // Progress tracking — only from explicit user actions
  const hasLocation = userSelectedLocation && !!climateData && rooftopArea > 0;
  const hasConfigured = userEditedConfig && rooftopArea > 0 && effectiveMonthlyConsumption > 0;

  return (
    <div className="min-h-screen bg-background" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Progress Indicator — sticky below header */}
      <div className="sticky top-16 z-40">
        <ProgressIndicator
          hasLocation={hasLocation}
          hasConfigured={hasConfigured}
          hasResults={showResults}
        />
      </div>

      <main>

        <LiveReportCounter />


        <div id="map-section">
          <ScrollReveal>
            <MapSection
              onAreaCalculated={(area) => { setRooftopArea(Math.round(area)); }}
              onClimateDataFetched={(data) => {
                setClimateData(data);
                if (initialLocationLoadRef.current) {
                  initialLocationLoadRef.current = false;
                } else {
                  setUserSelectedLocation(true);
                }
              }}
              onLocationChange={(name) => { setLocationName(name); }}
              
            />
          </ScrollReveal>
        </div>

        {/* Product Role Clarification */}
        <div className="container mx-auto px-4 py-3 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-muted/40 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
            <p className="text-xs md:text-sm text-muted-foreground/80 leading-snug">
              {t('hero.productRole')}
            </p>
          </div>
        </div>

        <div id="config-section">
        <ScrollReveal delay={0.1}>
          <InputPanel
            rooftopArea={rooftopArea}
            setRooftopArea={(v) => { setRooftopArea(v); setUserEditedConfig(true); }}
            pvType={pvType}
            setPvType={(v) => { setPvType(v); setUserEditedConfig(true); }}
            buildingType={buildingType}
            setBuildingType={(v) => { setBuildingType(v); setUserEditedConfig(true); }}
            costScenario={costScenario}
            setCostScenario={(v) => { setCostScenario(v); setUserEditedConfig(true); }}
            electricityPrice={electricityPrice}
            setElectricityPrice={(v) => { setElectricityPrice(v); setUserEditedConfig(true); }}
            monthlyConsumption={monthlyConsumption}
            setMonthlyConsumption={(v) => { setMonthlyConsumption(v); setUserEditedConfig(true); }}
            buildingMode={buildingMode}
            setBuildingMode={setBuildingMode}
            numberOfUnits={numberOfUnits}
            setNumberOfUnits={setNumberOfUnits}
            avgUnitConsumption={avgUnitConsumption}
            setAvgUnitConsumption={setAvgUnitConsumption}
            farmMode={farmMode}
            setFarmMode={setFarmMode}
            areaInFeddans={areaInFeddans}
            setAreaInFeddans={setAreaInFeddans}
            agriculturalActivity={agriculturalActivity}
            setAgriculturalActivity={setAgriculturalActivity}
            farmEquipmentConsumption={farmEquipmentConsumption}
            setFarmEquipmentConsumption={setFarmEquipmentConsumption}
            onCalculate={handleCalculate}
            locationName={locationName}
            climateData={climateData}
          />
        </ScrollReveal>
        </div>

        <div id="results">
          {isCalculating && <ResultsSkeleton />}
          <ScrollReveal>
            <ResultsDashboard 
              results={results}
              isVisible={showResults && !isCalculating}
              locationName={locationName}
              shareableParams={getShareableParams()}
              monthlyConsumption={effectiveMonthlyConsumption}
              pvType={pvType}
              buildingType={buildingType}
              costScenario={costScenario}
              electricityPrice={electricityPrice}
            />
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <FAQSection />
        </ScrollReveal>
      </main>

      <Footer />

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {}}
      />

      <LimitReachedModal
        open={showLimitReachedModal}
        onOpenChange={setShowLimitReachedModal}
      />

      <MobileBottomNav />
    </div>
  );
};

export default Index;
