import { Home, Zap, MapPin, Cpu, Building2, Sparkles, Sun, Thermometer, TrendingUp, DollarSign, Gauge, Building, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { pvTypes, PVType, buildingTypes, BuildingType, costScenarios, CostScenario, defaultClimateData, SPECIFIC_YIELD } from "@/lib/solarData";
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
  const [showInsights, setShowInsights] = useState(false);
  
  const pv = pvTypes[pvType];
  const building = buildingTypes[buildingType];
  const scenario = costScenarios[costScenario];
  
  // Calculate effective consumption
  const effectiveMonthlyConsumption = buildingMode 
    ? numberOfUnits * avgUnitConsumption 
    : monthlyConsumption;
  
  // Live calculations following the exact formula
  const usableArea = rooftopArea * building.usableFraction;
  const kWMax = usableArea / pv.areaPerKW;
  const kWInstalled = Math.floor(kWMax * 0.95);
  const totalCost = kWInstalled * scenario.costPerKW;
  const energyYear = kWInstalled * SPECIFIC_YIELD;

  const climate = climateData ?? defaultClimateData;
  
  // Find peak months
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxIrr = Math.max(...climate.monthlyIrradiance);
  const peakMonths = climate.monthlyIrradiance
    .map((v, i) => ({ v, m: MONTHS[i] }))
    .filter(x => x.v >= maxIrr * 0.9)
    .map(x => x.m);
  const avgTemp = climate.monthlyTemperature.reduce((a, b) => a + b, 0) / 12;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ==================== MANUAL INPUTS ==================== */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 animate-slide-up">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            System Configuration
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Rooftop Area */}
            <div className="space-y-3">
              <Label htmlFor="rooftop-area" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                Rooftop Area (m²)
              </Label>
              <Input
                id="rooftop-area"
                type="number"
                value={rooftopArea}
                onChange={(e) => setRooftopArea(Math.max(1, Number(e.target.value)))}
                min={1}
                max={10000}
                className="h-12 text-lg font-medium"
                placeholder="Enter area or draw on map"
              />
              <p className="text-xs text-muted-foreground">
                Draw on map above or enter manually
              </p>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </Label>
              <div className="h-12 flex items-center px-3 bg-muted/50 rounded-md border border-border">
                {locationName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
                    <p className="text-sm font-medium text-foreground">{locationName}</p>
                    {climateData?.annualAvgIrradiance && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day)
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">📍 Select location on the map</p>
                )}
              </div>
            </div>
          </div>

          {/* Building Type Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Building Type (determines usable roof %)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(buildingTypes) as [BuildingType, typeof buildingTypes[BuildingType]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setBuildingType(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    buildingType === key 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{data.label}</p>
                  <p className="text-xs opacity-70">{Math.round(data.usableFraction * 100)}% usable</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{building.description}</p>
          </div>

          {/* PV Type Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              PV Type (determines area per kW)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(pvTypes) as [PVType, typeof pvTypes[PVType]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setPvType(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    pvType === key 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{data.label}</p>
                  <p className="text-xs opacity-70">{data.areaPerKW} m²/kW</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{pv.description}</p>
          </div>

          {/* Cost Scenario Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Cost Scenario (EGP per kW)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(costScenarios) as [CostScenario, typeof costScenarios[CostScenario]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setCostScenario(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    costScenario === key 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{data.label}</p>
                  <p className="text-xs opacity-70">{data.costPerKW.toLocaleString()} EGP/kW</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{scenario.description}</p>
          </div>

          {/* Electricity Price Slider */}
          <div className="space-y-4 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Electricity Price (EGP/kWh)
              </span>
              <span className="text-lg font-semibold text-primary">{electricityPrice.toFixed(2)} EGP</span>
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
              <span>0.80 EGP (Low usage)</span>
              <span>2.30 EGP (High usage)</span>
            </div>
          </div>

          {/* ==================== CONSUMPTION SECTION ==================== */}
          <div className="border-t border-border pt-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                Building Mode
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{buildingMode ? "Multi-unit" : "Single consumption"}</span>
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
                  <span>Calculate consumption based on number of apartment units</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-units" className="text-sm">Number of Units (Apartments)</Label>
                    <Input
                      id="num-units"
                      type="number"
                      value={numberOfUnits}
                      onChange={(e) => setNumberOfUnits(Math.max(1, Number(e.target.value)))}
                      min={1}
                      max={500}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avg-consumption" className="text-sm">Avg. Consumption per Unit (kWh/month)</Label>
                    <Input
                      id="avg-consumption"
                      type="number"
                      value={avgUnitConsumption}
                      onChange={(e) => setAvgUnitConsumption(Math.max(50, Number(e.target.value)))}
                      min={50}
                      max={2000}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Total Building Consumption: <span className="font-bold text-foreground">{(numberOfUnits * avgUnitConsumption).toLocaleString()} kWh/month</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Mode: Single Consumption Input */
              <div className="space-y-3">
                <Label htmlFor="monthly-consumption" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  Monthly Consumption (kWh)
                </Label>
                <Input
                  id="monthly-consumption"
                  type="number"
                  value={monthlyConsumption}
                  onChange={(e) => setMonthlyConsumption(Math.max(0, Number(e.target.value)))}
                  min={0}
                  max={50000}
                  className="h-12 text-lg font-medium"
                  placeholder="Enter monthly usage"
                />
                <p className="text-xs text-muted-foreground">
                  Check your electricity bill for average usage
                </p>
              </div>
            )}
          </div>

          {/* Live Preview - Following exact formula */}
          <div className="bg-muted/30 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Live Calculation Preview
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-foreground">{rooftopArea} m²</p>
                <p className="text-xs text-muted-foreground">Total Roof</p>
              </div>
              <div>
                <p className="text-xl font-bold text-solar-green">{usableArea.toFixed(0)} m²</p>
                <p className="text-xs text-muted-foreground">Usable ({Math.round(building.usableFraction * 100)}%)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-muted-foreground">{kWMax.toFixed(1)} kW</p>
                <p className="text-xs text-muted-foreground">kW Max</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{kWInstalled} kW</p>
                <p className="text-xs text-muted-foreground">kW Installed (×0.95)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-solar-gold">{totalCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Cost (EGP)</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{kWInstalled} kW</span> × <span className="font-medium text-foreground">{scenario.costPerKW.toLocaleString()} EGP/kW</span> = <span className="font-bold text-primary">{totalCost.toLocaleString()} EGP</span>
              </p>
              {buildingMode && (
                <p className="text-sm text-muted-foreground mt-1">
                  Consumption: <span className="font-medium text-foreground">{numberOfUnits} units</span> × <span className="font-medium text-foreground">{avgUnitConsumption} kWh</span> = <span className="font-bold text-foreground">{effectiveMonthlyConsumption.toLocaleString()} kWh/month</span>
                </p>
              )}
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={onCalculate}
            size="lg"
            className="w-full h-14 text-lg font-semibold gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 mr-2" />
            Calculate Solar Potential
          </Button>
        </div>

        {/* ==================== AUTO INSIGHTS (COLLAPSIBLE) ==================== */}
        <Collapsible open={showInsights} onOpenChange={setShowInsights}>
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-solar-green" />
                <span className="font-medium text-foreground">Smart Insights (NASA Climate Data)</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showInsights ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-4 pt-0 grid md:grid-cols-3 gap-4">
                {/* Solar Irradiance */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-solar-gold" />
                    <span className="font-medium text-sm">Solar Resource</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{climate.annualAvgIrradiance.toFixed(1)} kWh/m²/day</p>
                  <p className="text-xs text-muted-foreground mt-1">Peak months: {peakMonths.join(", ")}</p>
                </div>

                {/* Temperature */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-sm">Temperature</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{avgTemp.toFixed(0)}°C avg</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {avgTemp > 28 ? "High temps may reduce efficiency 5-10%" : "Favorable for panel efficiency"}
                  </p>
                </div>

                {/* Expected Yield */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Expected Yield</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">1,800 kWh/kW/yr</p>
                  <p className="text-xs text-muted-foreground mt-1">Egypt national average</p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

      </div>
    </section>
  );
};

export default InputPanel;
