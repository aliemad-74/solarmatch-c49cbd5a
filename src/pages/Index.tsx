import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MapSection from "@/components/MapSection";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import Footer from "@/components/Footer";
import { calculateSolarFeasibility, SolarCalculation, PanelType, defaultClimateData } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";
import { deriveAllInsights, DerivedInsights } from "@/lib/autoDerive";

const Index = () => {
  const [rooftopArea, setRooftopArea] = useState<number>(100);
  const [selectedCity, setSelectedCity] = useState<string>("zagazig");
  const [results, setResults] = useState<SolarCalculation | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  
  // Auto-derived insights from location + NASA data
  const [insights, setInsights] = useState<DerivedInsights | null>(null);

  // Auto-derive ALL parameters when area or climate data changes
  useEffect(() => {
    const climate = climateData ?? defaultClimateData;
    const lat = climate.location?.lat ?? 30.0444;
    const lng = climate.location?.lng ?? 31.2357;
    
    const derived = deriveAllInsights(rooftopArea, lat, lng, climate);
    setInsights(derived);
  }, [rooftopArea, climateData]);

  const handleCalculate = () => {
    if (!insights) return;
    
    const calculation = calculateSolarFeasibility(
      rooftopArea, 
      climateData, 
      insights.costScenario, 
      insights.electricityPrice, 
      insights.usableFraction, 
      insights.panelType
    );
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
          onCalculate={handleCalculate}
          locationName={locationName}
          climateData={climateData}
          insights={insights}
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
