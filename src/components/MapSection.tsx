import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cityIrradianceData } from "@/lib/solarData";

interface MapSectionProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const MapSection = ({ selectedCity, onCityChange }: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  const city = cityIrradianceData[selectedCity];
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6cew4e_xMcFPz_E&center=${city?.lat || 30.0444},${city?.lng || 31.2357}&zoom=15&maptype=satellite`;

  useEffect(() => {
    setMapLoaded(false);
    const timer = setTimeout(() => setMapLoaded(true), 500);
    return () => clearTimeout(timer);
  }, [selectedCity]);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (query.includes("zagazig") || query.includes("zag")) {
      onCityChange("zagazig");
    } else if (query.includes("cairo") || query.includes("cai")) {
      onCityChange("cairo");
    } else if (query.includes("alex") || query.includes("alexandria")) {
      onCityChange("alexandria");
    }
    setSearchQuery("");
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 gradient-hero" />
      
      <div className="relative container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Find Your <span className="text-gradient-solar">Solar Potential</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your location to calculate rooftop solar feasibility with real climate data for Egypt
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-6 animate-slide-up">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search city... (Cairo, Zagazig, Alexandria)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12 bg-card border-border/50 shadow-card focus:shadow-glow transition-shadow"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="h-12 px-6 gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              Search
            </Button>
          </div>
        </div>

        {/* City Quick Select */}
        <div className="flex justify-center gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {Object.entries(cityIrradianceData).map(([key, data]) => (
            <button
              key={key}
              onClick={() => onCityChange(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCity === key
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-card text-foreground border border-border hover:border-primary/50"
              }`}
            >
              <MapPin className="w-4 h-4" />
              {data.name}
            </button>
          ))}
        </div>

        {/* Map Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <div className="aspect-[16/9] md:aspect-[21/9] bg-muted relative">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading satellite view...</span>
                </div>
              </div>
            )}
            <iframe
              src={mapUrl}
              className={`w-full h-full border-0 transition-opacity duration-500 ${mapLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Solar Location Map"
              onLoad={() => setMapLoaded(true)}
            />
          </div>
          
          {/* Map Overlay Info */}
          <div className="absolute bottom-4 left-4 glass rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
              <span className="text-sm font-medium text-foreground">{city?.name}, Egypt</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Avg. Solar Irradiance: {(city?.monthlyIrradiance.reduce((a, b) => a + b, 0) / 12).toFixed(1)} kWh/m²/day
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
