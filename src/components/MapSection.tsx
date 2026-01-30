import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, PenTool, Trash2, MousePointer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from "@react-google-maps/api";
import { cityIrradianceData } from "@/lib/solarData";

interface MapSectionProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  onAreaCalculated?: (area: number) => void;
}

const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const MapSection = ({ selectedCity, onCityChange, onAreaCalculated }: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<google.maps.Polygon | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const city = cityIrradianceData[selectedCity];

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBFw0Qbyq9zTFTd-tUY6cew4e_xMcFPz_E",
    libraries,
  });

  const mapCenter = {
    lat: city?.lat || 30.0444,
    lng: city?.lng || 31.2357,
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon) => {
    if (window.google && window.google.maps && window.google.maps.geometry) {
      const path = polygon.getPath();
      const areaInSqMeters = google.maps.geometry.spherical.computeArea(path);
      return Math.round(areaInSqMeters * 100) / 100;
    }
    return 0;
  }, []);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Remove previous polygon if exists
    if (drawnPolygon) {
      drawnPolygon.setMap(null);
    }

    setDrawnPolygon(polygon);
    const area = calculatePolygonArea(polygon);
    setCalculatedArea(area);
    
    if (onAreaCalculated && area > 0) {
      onAreaCalculated(area);
    }

    // Exit drawing mode after completing a polygon
    setIsDrawingMode(false);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }

    // Add listener for polygon edits
    google.maps.event.addListener(polygon.getPath(), "set_at", () => {
      const newArea = calculatePolygonArea(polygon);
      setCalculatedArea(newArea);
      if (onAreaCalculated && newArea > 0) {
        onAreaCalculated(newArea);
      }
    });

    google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
      const newArea = calculatePolygonArea(polygon);
      setCalculatedArea(newArea);
      if (onAreaCalculated && newArea > 0) {
        onAreaCalculated(newArea);
      }
    });
  }, [drawnPolygon, calculatePolygonArea, onAreaCalculated]);

  const clearPolygon = useCallback(() => {
    if (drawnPolygon) {
      drawnPolygon.setMap(null);
      setDrawnPolygon(null);
      setCalculatedArea(null);
    }
  }, [drawnPolygon]);

  const toggleDrawingMode = useCallback(() => {
    if (isDrawingMode) {
      setIsDrawingMode(false);
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
    } else {
      setIsDrawingMode(true);
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      }
    }
  }, [isDrawingMode]);

  // Update drawing mode when state changes
  useEffect(() => {
    if (drawingManagerRef.current) {
      if (isDrawingMode) {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      } else {
        drawingManagerRef.current.setDrawingMode(null);
      }
    }
  }, [isDrawingMode]);

  // Pan to new city when selected
  useEffect(() => {
    if (mapRef.current && city) {
      mapRef.current.panTo({ lat: city.lat, lng: city.lng });
    }
  }, [selectedCity, city]);

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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-destructive">Error loading maps</p>
      </div>
    );
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 gradient-hero" />
      
      <div className="relative container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Find Your <span className="text-gradient-solar">Solar Potential</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your location and draw your rooftop to calculate solar feasibility with real climate data for Egypt
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

        {/* Drawing Tools */}
        <div className="flex justify-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Button
            onClick={toggleDrawingMode}
            variant={isDrawingMode ? "default" : "outline"}
            className={`flex items-center gap-2 ${isDrawingMode ? "gradient-solar text-primary-foreground shadow-glow" : ""}`}
          >
            {isDrawingMode ? (
              <>
                <MousePointer className="w-4 h-4" />
                Exit Drawing
              </>
            ) : (
              <>
                <PenTool className="w-4 h-4" />
                Draw Rooftop
              </>
            )}
          </Button>
          {drawnPolygon && (
            <Button
              onClick={clearPolygon}
              variant="outline"
              className="flex items-center gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Drawing Instructions */}
        {isDrawingMode && (
          <div className="text-center mb-4 animate-fade-in">
            <p className="text-sm text-primary font-medium bg-primary/10 inline-block px-4 py-2 rounded-lg">
              Click on the map to draw polygon corners. Click the first point to complete.
            </p>
          </div>
        )}

        {/* Calculated Area Display */}
        {calculatedArea !== null && (
          <div className="text-center mb-4 animate-scale-in">
            <div className="inline-flex items-center gap-2 bg-solar-green/20 text-solar-green px-4 py-2 rounded-lg border border-solar-green/30">
              <span className="text-sm font-medium">Rooftop Area:</span>
              <span className="text-lg font-bold">{calculatedArea.toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <div className="aspect-[16/9] md:aspect-[21/9] bg-muted relative">
            {!isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading satellite view...</span>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={18}
                onLoad={onMapLoad}
                mapTypeId="satellite"
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: true,
                  streetViewControl: false,
                  fullscreenControl: true,
                }}
              >
                <DrawingManager
                  onLoad={onDrawingManagerLoad}
                  onPolygonComplete={onPolygonComplete}
                  options={{
                    drawingMode: isDrawingMode ? google.maps.drawing.OverlayType.POLYGON : null,
                    drawingControl: false,
                    polygonOptions: {
                      fillColor: "#14b8a6",
                      fillOpacity: 0.4,
                      strokeColor: "#14b8a6",
                      strokeOpacity: 1,
                      strokeWeight: 2,
                      editable: true,
                      draggable: true,
                    },
                  }}
                />
              </GoogleMap>
            )}
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
