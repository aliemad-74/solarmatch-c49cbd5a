import { Home, Zap, MapPin, Cpu, Building2, Sparkles, Sun, Thermometer, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { panelTypes, PanelType, buildingTypes, BuildingType, defaultClimateData, OTHER_COSTS_PER_KW } from "@/lib/solarData";
import { ClimateData } from "@/lib/climateApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface InputPanelProps {
  rooftopArea: number;
  setRooftopArea: (area: number) => void;
  panelType: PanelType;
  setPanelType: (type: PanelType) => void;
  buildingType: BuildingType;
  setBuildingType: (type: BuildingType) => void;
  electricityPrice: number;
  setElectricityPrice: (price: number) => void;
  onCalculate: () => void;
  locationName?: string;
  climateData?: ClimateData | null;
}

const InputPanel = ({
  rooftopArea,
  setRooftopArea,
  panelType,
  setPanelType,
  buildingType,
  setBuildingType,
  electricityPrice,
  setElectricityPrice,
  onCalculate,
  locationName,
  climateData,
}: InputPanelProps) => {
  const [showInsights, setShowInsights] = useState(false);
  
  const panel = panelTypes[panelType];
  const building = buildingTypes[buildingType];
  const usableArea = rooftopArea * building.usableFraction;
  const panelsCount = Math.floor(usableArea / panel.panelArea);
  const totalWatts = panelsCount * panel.panelWatt;
  const kWInstalled = totalWatts / 1000;
  
  // Live cost preview
  const panelCost = panelsCount * panel.panelPrice;
  const otherCosts = kWInstalled * OTHER_COSTS_PER_KW;
  const estimatedCost = panelCost + otherCosts;

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
              Building Type
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

          {/* Panel Type Selection */}
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              Panel Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(panelTypes) as [PanelType, typeof panelTypes[PanelType]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setPanelType(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    panelType === key 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{data.label}</p>
                  <p className="text-xs opacity-70">{data.panelWatt}W • {data.panelPrice.toLocaleString()} EGP</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{panel.description}</p>
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

          {/* Live Preview */}
          <div className="bg-muted/30 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-6 justify-center text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{rooftopArea} m²</p>
                <p className="text-xs text-muted-foreground">Total Roof</p>
              </div>
              <div className="w-px h-10 bg-border self-center" />
              <div>
                <p className="text-2xl font-bold text-solar-green">{usableArea.toFixed(0)} m²</p>
                <p className="text-xs text-muted-foreground">Usable ({Math.round(building.usableFraction * 100)}%)</p>
              </div>
              <div className="w-px h-10 bg-border self-center" />
              <div>
                <p className="text-2xl font-bold text-primary">{panelsCount}</p>
                <p className="text-xs text-muted-foreground">Panels</p>
              </div>
              <div className="w-px h-10 bg-border self-center" />
              <div>
                <p className="text-2xl font-bold text-solar-gold">{kWInstalled.toFixed(1)} kW</p>
                <p className="text-xs text-muted-foreground">Capacity</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Preview */}
          <div className="bg-gradient-to-r from-primary/5 to-solar-gold/5 rounded-xl p-4 mb-6 border border-primary/20">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Cost Breakdown (Per Panel Method)
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{panelCost.toLocaleString()} EGP</p>
                <p className="text-xs text-muted-foreground">{panelsCount} × {panel.panelPrice.toLocaleString()} EGP</p>
                <p className="text-xs text-muted-foreground">Panel Cost</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{otherCosts.toLocaleString()} EGP</p>
                <p className="text-xs text-muted-foreground">{kWInstalled.toFixed(1)} kW × 8,000</p>
                <p className="text-xs text-muted-foreground">Other Costs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{estimatedCost.toLocaleString()} EGP</p>
                <p className="text-xs text-muted-foreground">{kWInstalled > 0 ? (estimatedCost / kWInstalled).toLocaleString() : 0} EGP/kW</p>
                <p className="text-xs text-muted-foreground">Total System</p>
              </div>
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
