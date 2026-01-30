import { Home, Zap, DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { costScenarios } from "@/lib/solarData";

interface InputPanelProps {
  rooftopArea: number;
  setRooftopArea: (area: number) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  costScenario: "low" | "medium" | "high";
  setCostScenario: (scenario: "low" | "medium" | "high") => void;
  electricityPrice: number;
  setElectricityPrice: (price: number) => void;
  onCalculate: () => void;
}

const InputPanel = ({
  rooftopArea,
  setRooftopArea,
  costScenario,
  setCostScenario,
  electricityPrice,
  setElectricityPrice,
  onCalculate,
}: InputPanelProps) => {
  const scenarioIndex = costScenario === "low" ? 0 : costScenario === "medium" ? 1 : 2;

  const handleScenarioSlider = (value: number[]) => {
    const scenarios: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
    setCostScenario(scenarios[value[0]]);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 animate-slide-up">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            Configure Your System
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                placeholder="Enter area in square meters"
              />
              <p className="text-xs text-muted-foreground">
                Typical residential: 50-150 m² | Commercial: 200-2000 m²
              </p>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Location
              </Label>
              <div className="h-12 flex items-center px-3 bg-muted/50 rounded-md border border-border">
                <p className="text-sm text-muted-foreground">
                  📍 Select location on the map above or use city quick buttons
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Climate data fetched dynamically from NASA POWER API
              </p>
            </div>
          </div>

          {/* Cost Scenario Slider */}
          <div className="space-y-4 mb-8">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Installation Cost Scenario
            </Label>
            <div className="px-2">
              <Slider
                value={[scenarioIndex]}
                onValueChange={handleScenarioSlider}
                max={2}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs">
              {Object.entries(costScenarios).map(([key, data]) => (
                <div
                  key={key}
                  className={`text-center transition-all ${
                    costScenario === key ? "text-primary font-semibold scale-105" : "text-muted-foreground"
                  }`}
                >
                  <p className="font-medium">{data.label}</p>
                  <p>{(data.value / 1000).toFixed(0)}K EGP/kW</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg py-2 px-4">
              {costScenarios[costScenario].description}
            </p>
          </div>

          {/* Electricity Price Slider */}
          <div className="space-y-4 mb-8">
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
                min={0.5}
                max={3.0}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.50 EGP (Subsidized)</span>
              <span>3.00 EGP (Commercial)</span>
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
      </div>
    </section>
  );
};

export default InputPanel;
