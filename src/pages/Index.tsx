import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import Footer from "@/components/Footer";
import { calculateSolarFeasibility, SolarCalculation, PanelType, selectOptimalPanelType, defaultClimateData } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";

const Index = () => {
  const [rooftopArea, setRooftopArea] = useState<number>(100);
  const [selectedCity, setSelectedCity] = useState<string>("zagazig");
  const [costScenario, setCostScenario] = useState<"low" | "medium" | "high">("medium");
  const [electricityPrice, setElectricityPrice] = useState<number>(1.95);
  const [usableFraction, setUsableFraction] = useState<number>(0.60);
  const [panelType, setPanelType] = useState<PanelType>("standard");
  const [panelTypeReason, setPanelTypeReason] = useState<string>("");
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  // Auto-select optimal panel type when area or climate data changes
  useEffect(() => {
    const usableArea = rooftopArea * usableFraction;
    const irradiance = climateData?.annualAvgIrradiance ?? defaultClimateData.annualAvgIrradiance;
    const optimal = selectOptimalPanelType(usableArea, irradiance);
    setPanelType(optimal.type);
    setPanelTypeReason(optimal.reason);
  }, [rooftopArea, usableFraction, climateData]);

  const handleCalculate = () => {
    const calculation = calculateSolarFeasibility(rooftopArea, climateData, costScenario, electricityPrice, usableFraction, panelType);
    setResults(calculation);
    setShowResults(true);

    // Scroll to results
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <MapSection 
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          onAreaCalculated={(area) => setRooftopArea(Math.round(area))}
          onClimateDataFetched={setClimateData}
          onLocationChange={setLocationName}
        />

        <InputPanel
          rooftopArea={rooftopArea}
          setRooftopArea={setRooftopArea}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          costScenario={costScenario}
          setCostScenario={setCostScenario}
          electricityPrice={electricityPrice}
          setElectricityPrice={setElectricityPrice}
          usableFraction={usableFraction}
          setUsableFraction={setUsableFraction}
          panelType={panelType}
          panelTypeReason={panelTypeReason}
          onCalculate={handleCalculate}
          locationName={locationName}
          solarIrradiance={climateData?.annualAvgIrradiance}
        />

        <div id="results">
          <ResultsDashboard 
            results={results}
            isVisible={showResults}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
