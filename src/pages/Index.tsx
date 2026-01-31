import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import Footer from "@/components/Footer";
import { calculateSolarFeasibility, SolarCalculation, PanelType, BuildingType, defaultClimateData } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";

const Index = () => {
  // Manual inputs
  const [rooftopArea, setRooftopArea] = useState<number>(100);
  const [panelType, setPanelType] = useState<PanelType>("standard");
  const [buildingType, setBuildingType] = useState<BuildingType>("apartment");
  const [electricityPrice, setElectricityPrice] = useState<number>(1.95);
  
  // Map/location state
  const [selectedCity, setSelectedCity] = useState<string>("zagazig");
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  
  // Results
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    const calculation = calculateSolarFeasibility(
      rooftopArea, 
      climateData, 
      electricityPrice, 
      panelType,
      buildingType
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
          panelType={panelType}
          setPanelType={setPanelType}
          buildingType={buildingType}
          setBuildingType={setBuildingType}
          electricityPrice={electricityPrice}
          setElectricityPrice={setElectricityPrice}
          onCalculate={handleCalculate}
          locationName={locationName}
          climateData={climateData}
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
