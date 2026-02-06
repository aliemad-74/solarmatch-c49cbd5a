import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import LimitReachedModal from "@/components/LimitReachedModal";
import Testimonials from "@/components/Testimonials";

import { useUserAuth } from "@/contexts/UserAuthContext";
import { calculateSolarFeasibility, SolarCalculation, PVType, BuildingType, CostScenario, defaultClimateData, AgriculturalActivity, FEDDAN_TO_SQM } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";
import { parseShareFromUrl, ShareableParams } from "@/lib/shareUtils";

const Index = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, canGenerateReport, recordReportGeneration } = useUserAuth();
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [pendingCalculation, setPendingCalculation] = useState(false);
  
  // Manual inputs
  const [rooftopArea, setRooftopArea] = useState<number>(100);
  const [pvType, setPvType] = useState<PVType>("B_standard_mono");
  const [buildingType, setBuildingType] = useState<BuildingType>("apartment");
  const [costScenario, setCostScenario] = useState<CostScenario>("medium");
  const [electricityPrice, setElectricityPrice] = useState<number>(1.95);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(500);
  
  // Building Mode inputs
  const [buildingMode, setBuildingMode] = useState<boolean>(false);
  const [numberOfUnits, setNumberOfUnits] = useState<number>(10);
  const [avgUnitConsumption, setAvgUnitConsumption] = useState<number>(300);
  
  // Farm Mode inputs
  const [farmMode, setFarmMode] = useState<boolean>(false);
  const [areaInFeddans, setAreaInFeddans] = useState<number>(5);
  const [agriculturalActivity, setAgriculturalActivity] = useState<AgriculturalActivity>("drip_irrigation");
  const [farmEquipmentConsumption, setFarmEquipmentConsumption] = useState<number>(10000);
  
  // Map/location state
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  
  // Results
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);

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

    // Auto-calculate after a short delay to allow state to settle
    setTimeout(() => {
      handleCalculate();
    }, 500);
  };

  // Calculate effective monthly consumption
  // Farm mode uses farm equipment consumption
  // Building mode uses units × avg consumption
  // Standard mode uses monthly consumption
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

  const performCalculation = async () => {
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
      avgUnitConsumption
    );
    setResults(calculation);
    setShowResults(true);

    // Record report generation
    if (user && profile) {
      await recordReportGeneration(locationName, calculation.kWInstalled);
    }

    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCalculate = () => {
    // Check if user is authenticated
    if (!user || !profile) {
      setShowAuthModal(true);
      setPendingCalculation(true);
      return;
    }

    // Check if user can generate more reports
    if (!canGenerateReport) {
      setShowLimitReachedModal(true);
      return;
    }

    // Proceed with calculation
    performCalculation();
  };

  // Get shareable params for the share dialog
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

  return (
    <div className="min-h-screen bg-background" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-8 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("hero.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("hero.subtitle")}</p>
            </div>
          </div>
        </section>

        <MapSection 
          onAreaCalculated={(area) => setRooftopArea(Math.round(area))}
          onClimateDataFetched={setClimateData}
          onLocationChange={setLocationName}
        />

        <InputPanel
          rooftopArea={rooftopArea}
          setRooftopArea={setRooftopArea}
          pvType={pvType}
          setPvType={setPvType}
          buildingType={buildingType}
          setBuildingType={setBuildingType}
          costScenario={costScenario}
          setCostScenario={setCostScenario}
          electricityPrice={electricityPrice}
          setElectricityPrice={setElectricityPrice}
          monthlyConsumption={monthlyConsumption}
          setMonthlyConsumption={setMonthlyConsumption}
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

        <div id="results">
          <ResultsDashboard 
            results={results}
            isVisible={showResults}
            locationName={locationName}
            shareableParams={getShareableParams()}
            monthlyConsumption={effectiveMonthlyConsumption}
            pvType={pvType}
            buildingType={buildingType}
          />
        </div>

        {/* Testimonials Section */}
        <Testimonials />

        <FAQSection />
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          // Will trigger calculation via useEffect
        }}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        open={showLimitReachedModal}
        onOpenChange={setShowLimitReachedModal}
      />
    </div>
  );
};

export default Index;
