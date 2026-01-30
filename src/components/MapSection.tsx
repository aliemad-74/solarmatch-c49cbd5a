import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, PenTool, Trash2, MousePointer, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, FeatureGroup, useMap, useMapEvents } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import * as turf from "@turf/turf";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { fetchClimateData, searchLocation, getLocationName, ClimateData } from "@/lib/climateApi";

// Fix Leaflet default marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});

interface MapSectionProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  onAreaCalculated?: (area: number) => void;
  onClimateDataFetched?: (data: ClimateData) => void;
  onLocationChange?: (lat: number, lng: number, name: string) => void;
}

// Preset cities for quick selection
const presetCities = {
  zagazig: { name: "Zagazig", lat: 30.5877, lng: 31.502 },
  cairo: { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  alexandria: { name: "Alexandria", lat: 31.2001, lng: 29.9187 },
};

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Component to handle map clicks for location selection
function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapSection = ({ 
  selectedCity, 
  onCityChange, 
  onAreaCalculated,
  onClimateDataFetched,
  onLocationChange 
}: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: presetCities[selectedCity as keyof typeof presetCities]?.lat || 30.0444,
    lng: presetCities[selectedCity as keyof typeof presetCities]?.lng || 31.2357,
    name: presetCities[selectedCity as keyof typeof presetCities]?.name || "Cairo",
  });
  const [isLoadingClimate, setIsLoadingClimate] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

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
    if (onLocationChange) {
      onLocationChange(lat, lng, locationName);
    }
    fetchClimateForLocation(lat, lng);
  }, [onLocationChange, fetchClimateForLocation]);

  // Initial climate data fetch
  useEffect(() => {
    fetchClimateForLocation(currentLocation.lat, currentLocation.lng);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle city preset change
  useEffect(() => {
    const city = presetCities[selectedCity as keyof typeof presetCities];
    if (city) {
      updateLocation(city.lat, city.lng, city.name);
    }
  }, [selectedCity, updateLocation]);

  // Calculate polygon area using Turf.js
  const calculatePolygonArea = useCallback((layer: L.Polygon) => {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    if (latlngs.length < 3) return 0;

    // Convert to GeoJSON coordinates
    const coordinates = latlngs.map((ll) => [ll.lng, ll.lat]);
    // Close the polygon
    coordinates.push(coordinates[0]);

    // Create Turf polygon and calculate area
    const polygon = turf.polygon([coordinates]);
    const areaInSqMeters = turf.area(polygon);
    
    return Math.round(areaInSqMeters * 100) / 100;
  }, []);

  // Handle polygon creation
  const onCreated = useCallback((e: L.DrawEvents.Created) => {
    const layer = e.layer as L.Polygon;
    const area = calculatePolygonArea(layer);
    setCalculatedArea(area);
    
    if (onAreaCalculated && area > 0) {
      onAreaCalculated(area);
    }
    setIsDrawingMode(false);
  }, [calculatePolygonArea, onAreaCalculated]);

  // Handle polygon edit
  const onEdited = useCallback((e: L.DrawEvents.Edited) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      const area = calculatePolygonArea(layer as L.Polygon);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) {
        onAreaCalculated(area);
      }
    });
  }, [calculatePolygonArea, onAreaCalculated]);

  // Handle polygon deletion
  const onDeleted = useCallback(() => {
    setCalculatedArea(null);
  }, []);

  // Clear all polygons
  const clearPolygons = useCallback(() => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setCalculatedArea(null);
    }
  }, []);

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      
      // If we got results, select the first one
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

  // Handle location click on map
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    if (!isDrawingMode) {
      updateLocation(lat, lng);
    }
  }, [isDrawingMode, updateLocation]);

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
            onClick={() => setIsDrawingMode(!isDrawingMode)}
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
          {calculatedArea !== null && (
            <Button
              onClick={clearPolygons}
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
            <MapContainer
              center={[currentLocation.lat, currentLocation.lng]}
              zoom={18}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController 
                center={[currentLocation.lat, currentLocation.lng]} 
                zoom={18} 
              />
              
              <LocationSelector onLocationSelect={handleLocationSelect} />
              
              <FeatureGroup ref={featureGroupRef}>
                {/* @ts-ignore - react-leaflet-draw types are incomplete */}
                <EditControl
                  position="topright"
                  onCreated={onCreated}
                  onEdited={onEdited}
                  onDeleted={onDeleted}
                  draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: false,
                    polygon: isDrawingMode ? {
                      allowIntersection: false,
                      shapeOptions: {
                        color: "#14b8a6",
                        fillColor: "#14b8a6",
                        fillOpacity: 0.4,
                        weight: 2,
                      },
                    } : false,
                  }}
                  edit={false as unknown as object}
                />
              </FeatureGroup>
            </MapContainer>
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
