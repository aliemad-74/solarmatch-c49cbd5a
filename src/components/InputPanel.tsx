import { Home, Zap, MapPin, Cpu, Sparkles, DollarSign, Building2, Sun, Thermometer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { panelTypes, costScenarios } from "@/lib/solarData";
import { DerivedInsights } from "@/lib/autoDerive";
import { ClimateData } from "@/lib/climateApi";

interface InputPanelProps {
  rooftopArea: number;
  setRooftopArea: (area: number) => void;
  onCalculate: () => void;
  locationName?: string;
  climateData?: ClimateData | null;
  insights: DerivedInsights | null;
}

const InsightCard = ({ 
  icon, 
  label, 
  value, 
  reason,
  highlight = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  reason: string;
  highlight?: boolean;
}) => (
  <div className={`p-4 rounded-xl border transition-all ${
    highlight 
      ? "bg-primary/5 border-primary/30" 
      : "bg-muted/30 border-border/50"
  }`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
      <Sparkles className="w-3 h-3 text-solar-green" />
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
  </div>
);

const InputPanel = ({
  rooftopArea,
  setRooftopArea,
  onCalculate,
  locationName,
  climateData,
  insights,
}: InputPanelProps) => {
  const usableArea = insights ? rooftopArea * insights.usableFraction : rooftopArea * 0.6;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              Smart Analysis
            </h3>
            <span className="text-xs text-solar-green bg-solar-green/10 px-3 py-1 rounded-full font-medium">
              ✨ All parameters auto-derived
            </span>
          </div>

          {/* Manual Inputs Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Rooftop Area - Only manual input */}
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
                Location & Climate
              </Label>
              <div className="h-12 flex items-center px-3 bg-muted/50 rounded-md border border-border">
                {locationName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
                    <p className="text-sm font-medium text-foreground">
                      {locationName}
                    </p>
                    {climateData?.annualAvgIrradiance && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day)
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    📍 Select location on the map above
                  </p>
                )}
              </div>
              {insights && (
                <p className="text-xs text-muted-foreground">
                  📍 {insights.region} • Expected {insights.regionGHI}
                </p>
              )}
            </div>
          </div>

          {/* Auto-Derived Insights Grid */}
          {insights && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-sm font-semibold text-foreground">Auto-Derived Parameters</h4>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">Based on NASA + location data</span>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Building Type & Usable Area */}
                <InsightCard
                  icon={<Building2 className="w-4 h-4" />}
                  label="Building Type"
                  value={`${insights.buildingType.charAt(0).toUpperCase() + insights.buildingType.slice(1)} • ${Math.round(insights.usableFraction * 100)}% usable`}
                  reason={insights.buildingReason}
                  highlight
                />

                {/* Panel Type */}
                <InsightCard
                  icon={<Cpu className="w-4 h-4" />}
                  label="Recommended Panels"
                  value={`${panelTypes[insights.panelType].label} (${panelTypes[insights.panelType].sqmPerKW} m²/kW)`}
                  reason={insights.panelReason}
                  highlight
                />

                {/* Cost Scenario */}
                <InsightCard
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Installation Cost"
                  value={`${costScenarios[insights.costScenario].label} (${(costScenarios[insights.costScenario].value / 1000).toFixed(0)}K EGP/kW)`}
                  reason={insights.costReason}
                />

                {/* Electricity Price */}
                <InsightCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Electricity Rate"
                  value={`${insights.electricityPrice.toFixed(2)} EGP/kWh`}
                  reason={insights.priceReason}
                />

                {/* Peak Production */}
                <InsightCard
                  icon={<Sun className="w-4 h-4" />}
                  label="Peak Production"
                  value={insights.peakProductionMonths.join(", ")}
                  reason="Months with highest solar irradiance (90%+ of peak)"
                />

                {/* Temperature Impact */}
                <InsightCard
                  icon={<Thermometer className="w-4 h-4" />}
                  label="Temperature"
                  value={`${insights.averageTemperature.toFixed(0)}°C avg`}
                  reason={insights.temperatureImpact}
                />
              </div>

              {/* Summary Stats */}
              <div className="bg-muted/30 rounded-xl p-4 mb-8 flex flex-wrap gap-6 justify-center text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{rooftopArea} m²</p>
                  <p className="text-xs text-muted-foreground">Total Roof</p>
                </div>
                <div className="w-px h-10 bg-border self-center" />
                <div>
                  <p className="text-2xl font-bold text-solar-green">{usableArea.toFixed(0)} m²</p>
                  <p className="text-xs text-muted-foreground">Usable Area</p>
                </div>
                <div className="w-px h-10 bg-border self-center" />
                <div>
                  <p className="text-2xl font-bold text-solar-gold">
                    {(usableArea / panelTypes[insights.panelType].sqmPerKW).toFixed(1)} kW
                  </p>
                  <p className="text-xs text-muted-foreground">Est. Capacity</p>
                </div>
              </div>
            </>
          )}

          {/* Calculate Button */}
          <Button
            onClick={onCalculate}
            disabled={!insights}
            size="lg"
            className="w-full h-14 text-lg font-semibold gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 mr-2" />
            Calculate Solar Potential
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InputPanel;
