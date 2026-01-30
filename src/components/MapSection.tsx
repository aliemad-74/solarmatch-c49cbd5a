import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, PenTool, Trash2, MousePointer, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as turf from "@turf/turf";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchClimateData, searchLocation, getLocationName, ClimateData } from "@/lib/climateApi";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapSectionProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  onAreaCalculated?: (area: number) => void;
  onClimateDataFetched?: (data: ClimateData) => void;
}

// Preset cities for quick selection
const presetCities = {
  zagazig: { name: "Zagazig", lat: 30.5877, lng: 31.502 },
  cairo: { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  alexandria: { name: "Alexandria", lat: 31.2001, lng: 29.9187 },
};

const MapSection = ({ 
  selectedCity, 
  onCityChange, 
  onAreaCalculated,
  onClimateDataFetched,
}: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: presetCities[selectedCity as keyof typeof presetCities]?.lat || 30.0444,
    lng: presetCities[selectedCity as keyof typeof presetCities]?.lng || 31.2357,
    name: presetCities[selectedCity as keyof typeof presetCities]?.name || "Cairo",
  });
  const [isLoadingClimate, setIsLoadingClimate] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const pointMarkersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [currentLocation.lat, currentLocation.lng],
        18
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add click handler for drawing
      mapRef.current.on("click", handleMapClick);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map clicks for polygon drawing
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!isDrawingMode) return;
    
    setPolygonPoints(prev => {
      const newPoints = [...prev, e.latlng];
      
      // Check if clicking near the first point to close polygon
      if (prev.length >= 3) {
        const firstPoint = prev[0];
        const distance = e.latlng.distanceTo(firstPoint);
        if (distance < 20) {
          // Complete the polygon
          completePolygon(prev);
          return prev;
        }
      }
      
      return newPoints;
    });
  }, [isDrawingMode]);

  // Update click handler when drawing mode changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.off("click");
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        if (isDrawingMode) {
          setPolygonPoints(prev => {
            const newPoints = [...prev, e.latlng];
            
            // Check if clicking near the first point to close polygon
            if (prev.length >= 3) {
              const firstPoint = prev[0];
              const distance = e.latlng.distanceTo(firstPoint);
              if (distance < 20) {
                completePolygon(prev);
                return prev;
              }
            }
            
            return newPoints;
          });
        }
      });
    }
  }, [isDrawingMode]);

  // Update polygon visualization
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing polygon and markers
    if (polygonLayerRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    pointMarkersRef.current.forEach(marker => mapRef.current?.removeLayer(marker));
    pointMarkersRef.current = [];

    // Draw new polygon if we have points
    if (polygonPoints.length >= 2) {
      const positions: L.LatLngExpression[] = polygonPoints.map(p => [p.lat, p.lng]);
      polygonLayerRef.current = L.polygon(positions, {
        color: "#14b8a6",
        fillColor: "#14b8a6",
        fillOpacity: 0.4,
        weight: 2,
      }).addTo(mapRef.current);
    }

    // Draw point markers
    polygonPoints.forEach((point, index) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 6,
        color: index === 0 ? "#f59e0b" : "#14b8a6",
        fillColor: index === 0 ? "#f59e0b" : "#14b8a6",
        fillOpacity: 1,
        weight: 2,
      }).addTo(mapRef.current!);
      pointMarkersRef.current.push(marker);
    });
  }, [polygonPoints]);

  // Calculate polygon area using Turf.js
  const calculatePolygonArea = useCallback((points: L.LatLng[]) => {
    if (points.length < 3) return 0;

    const coordinates = points.map((ll) => [ll.lng, ll.lat]);
    coordinates.push(coordinates[0]);

    const polygon = turf.polygon([coordinates]);
    const areaInSqMeters = turf.area(polygon);
    
    return Math.round(areaInSqMeters * 100) / 100;
  }, []);

  // Complete polygon drawing
  const completePolygon = useCallback((points: L.LatLng[]) => {
    if (points.length >= 3) {
      const area = calculatePolygonArea(points);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) {
        onAreaCalculated(area);
      }
    }
    setIsDrawingMode(false);
  }, [calculatePolygonArea, onAreaCalculated]);

  // Fetch climate data when location changes
  const fetchClimateForLocation = useCallback(async (lat: number, lng: number) => {
    setIsLoadingClimate(true);
    try {
      const data = await fetchClimateData(lat, lng);
      setClimateData(data);
      if (onClimateDataFetched) {
        onClimateDataFetched(data);
      }
    } catch (error) {
      console.error("Failed to fetch climate data:", error);
    } finally {
      setIsLoadingClimate(false);
    }
  }, [onClimateDataFetched]);

  // Update location and fetch climate data
  const updateLocation = useCallback(async (lat: number, lng: number, name?: string) => {
    const locationName = name || await getLocationName(lat, lng);
    setCurrentLocation({ lat, lng, name: locationName });
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 18);
    }
    
    fetchClimateForLocation(lat, lng);
  }, [fetchClimateForLocation]);

  // Initial climate data fetch
  useEffect(() => {
    fetchClimateForLocation(currentLocation.lat, currentLocation.lng);
  }, []);

  // Handle city preset change
  useEffect(() => {
    const city = presetCities[selectedCity as keyof typeof presetCities];
    if (city) {
      updateLocation(city.lat, city.lng, city.name);
    }
  }, [selectedCity, updateLocation]);

  // Clear polygon
  const clearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCalculatedArea(null);
  }, []);

  // Toggle drawing mode
  const toggleDrawingMode = useCallback(() => {
    if (isDrawingMode) {
      if (polygonPoints.length >= 3) {
        completePolygon(polygonPoints);
      }
      setIsDrawingMode(false);
    } else {
      clearPolygon();
      setIsDrawingMode(true);
    }
  }, [isDrawingMode, polygonPoints, completePolygon, clearPolygon]);

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      
      if (results.length > 0) {
        const first = results[0];
        updateLocation(first.lat, first.lng, first.name.split(",")[0]);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
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
            Select your location and draw your rooftop to calculate solar feasibility with real NASA climate data
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-6 animate-slide-up">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search any location in Egypt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12 bg-card border-border/50 shadow-card focus:shadow-glow transition-shadow"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="h-12 px-6 gradient-solar text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 1 && (
            <div className="absolute z-50 mt-2 w-full max-w-lg bg-card border border-border rounded-lg shadow-lg">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateLocation(result.lat, result.lng, result.name.split(",")[0]);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted text-sm truncate first:rounded-t-lg last:rounded-b-lg"
                >
                  {result.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City Quick Select */}
        <div className="flex justify-center gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {Object.entries(presetCities).map(([key, data]) => (
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
                Finish Drawing
              </>
            ) : (
              <>
                <PenTool className="w-4 h-4" />
                Draw Rooftop
              </>
            )}
          </Button>
          {(polygonPoints.length > 0 || calculatedArea !== null) && (
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
              {polygonPoints.length < 3 
                ? `Click on the map to add points (${polygonPoints.length}/3 minimum)`
                : "Click near the first point to complete, or click 'Finish Drawing'"}
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
            <div 
              ref={mapContainerRef} 
              className="w-full h-full z-0"
              style={{ cursor: isDrawingMode ? "crosshair" : "grab" }}
            />
          </div>
          
          {/* Map Overlay Info */}
          <div className="absolute bottom-4 left-4 glass rounded-lg px-4 py-2 shadow-lg z-[1000]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
              <span className="text-sm font-medium text-foreground">{currentLocation.name}, Egypt</span>
            </div>
            {isLoadingClimate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading climate data...
              </div>
            ) : climateData ? (
              <p className="text-xs text-muted-foreground">
                Avg. Solar Irradiance: {climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day
              </p>
            ) : null}
          </div>

          {/* Data Source Badge */}
          <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1.5 shadow-lg z-[1000]">
            <p className="text-xs text-muted-foreground">
              Data: <span className="text-foreground font-medium">NASA POWER</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
