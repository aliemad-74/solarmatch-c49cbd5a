import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageSeo } from "@/components/seo/PageSeo";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import { generateRoofReport, type RoofReport } from "@/lib/roofReport";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

import MobileBottomNav from "@/components/MobileBottomNav";
import SolarChatBot from "@/components/SolarChatBot";
import OnboardingTour, { ONBOARDING_FLAG } from "@/components/OnboardingTour";
import DemoCaseStudy from "@/components/DemoCaseStudy";

import ScrollReveal from "@/components/ScrollReveal";
import ResultsSkeleton from "@/components/ResultsSkeleton";
import LiveReportCounter from "@/components/LiveReportCounter";

import { useUserAuth } from "@/contexts/UserAuthContext";
import { calculateSolarFeasibility, SolarCalculation, PVType, BuildingType, CostScenario, defaultClimateData, AgriculturalActivity, FEDDAN_TO_SQM, buildingTypes, systemPackages, MarketPriceOverrides } from "@/lib/solarData";
import { useMarketData } from "@/hooks/useMarketData";
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
    feasibility: "suitable" | "conditional" | "not_suitable" | "oversized";
    pv_package: string;
  };
  ai_analysis: {
    recommendation: string;
    confidence: "high" | "medium" | "low";
  };
  recommended?: {
    recommended_size_kw: number;
    recommended_area: number;
    recommended_cost: number;
    recommended_payback: number;
    savings_from_downsizing: number;
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
  const { panelPrices, tariffs, getCostPerKW, refresh: refreshMarketData } = useMarketData();
  const [polygonDrawn, setPolygonDrawn] = useState(false);
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
  const [aiReviewText, setAiReviewText] = useState<string>("");
  const [roofReport, setRoofReport] = useState<RoofReport | null>(null);
  const [polygonInfo, setPolygonInfo] = useState<{ polygon: { lat: number; lng: number }[]; center: { lat: number; lng: number } } | null>(null);

  // Onboarding tour — show only for first-time visitors
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_FLAG);
      const replay = sessionStorage.getItem("solarmatch_replay_onboarding");
      if (replay) {
        sessionStorage.removeItem("solarmatch_replay_onboarding");
        // Allow replay regardless of flag
        setTimeout(() => setShowOnboarding(true), 400);
        return;
      }
      if (!seen) {
        // Small delay so the page can paint and target elements exist
        setTimeout(() => setShowOnboarding(true), 800);
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch market data on mount
  useEffect(() => { refreshMarketData(); }, [refreshMarketData]);
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

    // Fire backend AI roof-report in parallel — results merge into report when ready.
    if (polygonInfo) {
      generateRoofReport({
        polygon: polygonInfo.polygon,
        center: polygonInfo.center,
        selectedArea: rooftopArea,
        buildingTypeHint: buildingType,
        language: i18n.language === "ar" ? "ar" : "en",
      })
        .then((rep) => {
          setRoofReport(rep);
          // Adopt AI usable area if confident.
          if (rep.confidenceScore >= 0.4 && rep.detectedRoofArea > 0) {
            setRooftopArea(Math.round(rep.detectedRoofArea));
          }
        })
        .catch((err) => console.warn("roof-report failed:", err));
    }

    try {
      // Build market price overrides from live data
      const marketPriceOverrides: MarketPriceOverrides = {
        economy: getCostPerKW("economy"),
        standard: getCostPerKW("standard"),
        premium: getCostPerKW("premium"),
      };

      // Step 1: Always calculate locally first (source of truth)
      const calculation = calculateSolarFeasibility(
        rooftopArea,
        climateData,
        electricityPrice,
        pvType,
        buildingType,
        costScenario,
        effectiveMonthlyConsumption,
        buildingMode,
        numberOfUnits,
        avgUnitConsumption,
        marketPriceOverrides
      );

      // Step 2: AI Review checkpoint — validate calculations before showing to user
      try {
        const reviewResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-advisor`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              solarData: {
                locationName,
                usableArea: calculation.usableArea,
                kWInstalled: calculation.kWInstalled,
                energyYear: calculation.energyYear,
                panelCount: calculation.panelCount,
                coverageRatio: calculation.coverageRatio,
                monthlyConsumption: effectiveMonthlyConsumption,
                electricityPrice,
                totalCost: calculation.totalCost,
                costPerKW: calculation.costPerKW,
                savingsYear: calculation.savingsYear,
                paybackYears: calculation.paybackYears,
                co2Saved: calculation.co2Saved,
                buildingType,
                pvType,
                roofAnalysis: roofReport ? {
                  selectedArea: roofReport.selectedArea,
                  detectedRoofArea: roofReport.detectedRoofArea,
                  usableArea: roofReport.usableArea,
                  unusablePercentage: roofReport.unusablePercentage,
                  obstacles: roofReport.obstacles,
                  confidenceScore: roofReport.confidenceScore,
                } : null,
              },
              language: i18n.language,
              mode: "review",
            }),
          }
        );

        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          if (reviewData.success && reviewData.review) {
            const review = reviewData.review;
            // AI review received

            // Apply bounded adjustments if AI flagged issues
            if (review.adjustments) {
              const adj = review.adjustments;
              if (adj.totalCost !== null && adj.totalCost !== undefined) {
                const ratio = adj.totalCost / calculation.totalCost;
                // Only apply if within ±30% to prevent hallucination damage
                if (ratio > 0.7 && ratio < 1.3) {
                  calculation.totalCost = Math.round(adj.totalCost);
                  // totalCost adjusted
                }
              }
              if (adj.costPerKW !== null && adj.costPerKW !== undefined) {
                const ratio = adj.costPerKW / calculation.costPerKW;
                if (ratio > 0.7 && ratio < 1.3) {
                  calculation.costPerKW = Math.round(adj.costPerKW);
                  // costPerKW adjusted
                }
              }
              if (adj.paybackYears !== null && adj.paybackYears !== undefined) {
                const ratio = adj.paybackYears / calculation.paybackYears;
                if (ratio > 0.7 && ratio < 1.3) {
                  calculation.paybackYears = parseFloat(adj.paybackYears.toFixed(1));
                  // paybackYears adjusted
                }
              }
            }

            // Store interpretation text for display
            if (review.interpretation) {
              setAiReviewText(review.interpretation);
            }
          }
        }
      } catch (reviewError) {
        console.warn("AI review failed, using local calculations as-is:", reviewError);
        // Non-blocking: if AI review fails, we still show local results
      }

      // Step 3: Show results (after AI review completes or fails gracefully)
      setResults(calculation);
      setShowResults(true);
      setIsCalculating(false);

      if (user && profile) {
        await recordReportGeneration(locationName, calculation.kWInstalled);
      }

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(i18n.language === 'ar' ? "حدث خطأ في الحسابات" : "Calculation error");
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
  const hasLocation = userSelectedLocation && !!climateData && rooftopArea > 0 && polygonDrawn;
  const hasConfigured = userEditedConfig && rooftopArea > 0 && effectiveMonthlyConsumption > 0;

  return (
    <div className="min-h-screen bg-background" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <PageSeo
        path="/"
        arPath="/?lang=ar"
        en={{
          title: "SolarMatch | AI Solar Feasibility Platform for Egypt",
          description: "SolarMatch helps homeowners, farms, and businesses in Egypt estimate solar system size, savings, ROI, payback period, and installation cost using AI-powered solar analysis.",
          keywords: "SolarMatch, Solar Match, solar calculator Egypt, solar panels Egypt, solar feasibility Egypt, AI solar calculator, solar ROI Egypt, solar cost Egypt, solar payback calculator, solar for farms Egypt, solar for businesses Egypt, solar savings calculator, solar system size calculator, solar installation Egypt",
        }}
        ar={{
          title: "SolarMatch | منصة ذكية لدراسة جدوى الطاقة الشمسية في مصر",
          description: "يساعدك SolarMatch على حساب تكلفة الطاقة الشمسية، التوفير، العائد على الاستثمار، وفترة الاسترداد للمنازل والمزارع والشركات في مصر.",
          keywords: "SolarMatch, الطاقة الشمسية في مصر, حاسبة الطاقة الشمسية, دراسة جدوى الطاقة الشمسية, تكلفة الطاقة الشمسية في مصر, الطاقة الشمسية للمزارع, الطاقة الشمسية للشركات, ألواح شمسية للمنازل, تركيب الطاقة الشمسية في مصر",
        }}
      />
      <Header />
      

      <main>

        <LiveReportCounter />


        <div id="map-section">
          <ScrollReveal>
            <MapSection
              onAreaCalculated={(area) => {
                setRooftopArea(Math.round(area));
                setPolygonDrawn(true);
              }}
              onClimateDataFetched={(data) => {
                setClimateData(data);
                if (initialLocationLoadRef.current) {
                  initialLocationLoadRef.current = false;
                } else {
                  setUserSelectedLocation(true);
                }
              }}
              onLocationChange={(name) => { setLocationName(name); }}
              onPolygonComplete={(polygon, center) => setPolygonInfo({ polygon, center })}
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
            tariffInfo={tariffs.data ? { tiers: tariffs.data.tiers as any, source: tariffs.isLive ? "live" : "static", effectiveDate: tariffs.data.effective_date } : undefined}
            dynamicCosts={{ economy: getCostPerKW("economy"), standard: getCostPerKW("standard"), premium: getCostPerKW("premium") }}
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
              solarEngineData={solarEngineData}
              solarEngineLoading={solarEngineLoading}
              aiReviewText={aiReviewText}
            />
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <DemoCaseStudy
            onCtaClick={() => document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth" })}
          />
        </ScrollReveal>

        <ScrollReveal>
          <FAQSection />
        </ScrollReveal>
      </main>

      <Footer />

      {showResults && results && (
        <SolarChatBot
          results={results}
          locationName={locationName}
          preloadedRecommendation={aiReviewText}
          monthlyConsumption={effectiveMonthlyConsumption}
          pvType={pvType}
          buildingType={buildingType}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {}}
      />

      <PaywallModal
        open={showLimitReachedModal}
        onOpenChange={setShowLimitReachedModal}
      />

      <MobileBottomNav />

      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default Index;
