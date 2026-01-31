import { useState } from "react";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import Footer from "@/components/Footer";
import { calculateSolarFeasibility, SolarCalculation, PVType, BuildingType, CostScenario, defaultClimateData } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";

const Index = () => {
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
  
  // Map/location state
  const [selectedCity, setSelectedCity] = useState<string>("zagazig");
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  
  // Results
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Calculate effective monthly consumption
  const effectiveMonthlyConsumption = buildingMode 
    ? numberOfUnits * avgUnitConsumption 
    : monthlyConsumption;

  const handleCalculate = () => {
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
          onCalculate={handleCalculate}
          locationName={locationName}
          climateData={climateData}
        />

        <div id="results">
          <ResultsDashboard 
            results={results}
            isVisible={showResults}
            locationName={locationName}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
