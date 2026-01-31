import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Search, PenTool, Trash2, MousePointer, Loader2, Undo2, Maximize2, Minimize2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as turf from "@turf/turf";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchClimateData, searchLocation, getLocationName, ClimateData } from "@/lib/climateApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapSectionProps {
  onAreaCalculated?: (area: number) => void;
  onClimateDataFetched?: (data: ClimateData) => void;
  onLocationChange?: (locationName: string) => void;
}

interface DetectedBuilding {
  id: number;
  coordinates: [number, number][];
  area?: number;
}

// Default location (Cairo)
const DEFAULT_LOCATION = { lat: 30.0444, lng: 31.2357, name: "Cairo" };

const MIN_POLYGON_POINTS = 4;

type MapSize = "normal" | "large";

const MapSection = ({ 
  onAreaCalculated,
  onClimateDataFetched,
  onLocationChange,
}: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; name: string }>(DEFAULT_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoadingClimate, setIsLoadingClimate] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [mapSize, setMapSize] = useState<MapSize>("normal");
  
  // Building detection states
  const [isSearchingBuildings, setIsSearchingBuildings] = useState(false);
  const [detectedBuildings, setDetectedBuildings] = useState<DetectedBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const pointMarkersRef = useRef<L.CircleMarker[]>([]);
  const buildingLayersRef = useRef<L.Polygon[]>([]);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [currentLocation.lat, currentLocation.lng],
        20
      );

      // ESRI World Imagery (satellite view) - free for basic use
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when container size changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [mapSize]);

  // Clear detected buildings from map
  const clearDetectedBuildings = useCallback(() => {
    buildingLayersRef.current.forEach(layer => mapRef.current?.removeLayer(layer));
    buildingLayersRef.current = [];
    setDetectedBuildings([]);
    setSelectedBuildingId(null);
  }, []);

  // Fetch buildings from Overpass API via edge function
  const fetchBuildingsAtLocation = useCallback(async (lat: number, lng: number) => {
    setIsSearchingBuildings(true);
    clearDetectedBuildings();
    
    try {
      const response = await supabase.functions.invoke('building-footprints', {
        body: { lat, lng, radius: 50 }
      });

      if (response.error) {
        console.error('Error fetching buildings:', response.error);
        toast.error(t('map.noBuildingsFound'));
        return;
      }

      const { buildings } = response.data;
      
      if (!buildings || buildings.length === 0) {
        toast.info(t('map.noBuildingsFound'));
        // Switch to manual draw mode
        setIsDrawingMode(true);
        return;
      }

      setDetectedBuildings(buildings);
      toast.success(t('map.buildingsFound', { count: buildings.length }));

      // Draw buildings on map
      buildings.forEach((building: DetectedBuilding) => {
        if (!mapRef.current) return;
        
        const positions: L.LatLngExpression[] = building.coordinates.map(
          ([lat, lng]) => [lat, lng]
        );
        
        const polygon = L.polygon(positions, {
          color: "#f97316", // Orange for detected
          fillColor: "#f97316",
          fillOpacity: 0.3,
          weight: 2,
          className: 'detected-building',
        }).addTo(mapRef.current);

        // Click handler for selecting building
        polygon.on('click', () => {
          selectBuilding(building);
        });

        // Hover effects
        polygon.on('mouseover', () => {
          if (selectedBuildingId !== building.id) {
            polygon.setStyle({ fillOpacity: 0.5 });
          }
        });
        
        polygon.on('mouseout', () => {
          if (selectedBuildingId !== building.id) {
            polygon.setStyle({ fillOpacity: 0.3 });
          }
        });

        buildingLayersRef.current.push(polygon);
      });

    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      toast.error(t('map.noBuildingsFound'));
    } finally {
      setIsSearchingBuildings(false);
    }
  }, [t, clearDetectedBuildings]);

  // Select a detected building
  const selectBuilding = useCallback(async (building: DetectedBuilding) => {
    setSelectedBuildingId(building.id);
    
    // Update polygon styling
    buildingLayersRef.current.forEach((layer, index) => {
      if (detectedBuildings[index]?.id === building.id) {
        layer.setStyle({
          color: "#14b8a6",
          fillColor: "#14b8a6",
          fillOpacity: 0.4,
        });
      } else {
        layer.setStyle({
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.3,
        });
      }
    });

    // Convert coordinates to polygon points for further processing
    const points = building.coordinates.map(([lat, lng]) => L.latLng(lat, lng));
    setPolygonPoints(points);

    // Calculate area using Turf.js for accuracy
    const coordinates = building.coordinates.map(([lat, lng]) => [lng, lat]);
    coordinates.push(coordinates[0]); // Close polygon
    const polygon = turf.polygon([coordinates]);
    const areaInSqMeters = turf.area(polygon);
    const area = Math.round(areaInSqMeters * 100) / 100;
    
    setCalculatedArea(area);
    if (onAreaCalculated && area > 0) {
      onAreaCalculated(area);
    }

    // Calculate centroid for location
    const centroid = turf.centroid(polygon);
    const [lng, lat] = centroid.geometry.coordinates;
    
    // Update location and fetch climate data
    const locationName = await getLocationName(lat, lng);
    setCurrentLocation({ lat, lng, name: locationName });
    if (onLocationChange) {
      onLocationChange(locationName);
    }
    fetchClimateForLocation(lat, lng);
    
    toast.success(t('map.selectedBuilding'));
  }, [detectedBuildings, onAreaCalculated, onLocationChange, t]);

  // Reference to track if we should complete polygon
  const shouldCompleteRef = useRef<L.LatLng[] | null>(null);

  // Effect to handle polygon completion outside of state setter
  useEffect(() => {
    if (shouldCompleteRef.current) {
      const points = shouldCompleteRef.current;
      shouldCompleteRef.current = null;
      completePolygon(points);
    }
  });

  // Update click handler when drawing mode changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.off("click");
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        if (isDrawingMode) {
          setPolygonPoints(prev => {
            // Check if clicking near the first point to close polygon
            if (prev.length >= MIN_POLYGON_POINTS) {
              const firstPoint = prev[0];
              const distance = e.latlng.distanceTo(firstPoint);
              if (distance < 5) {
                shouldCompleteRef.current = prev;
                return prev;
              }
            }
            return [...prev, e.latlng];
          });
        } else {
          // Detect buildings at clicked location
          fetchBuildingsAtLocation(e.latlng.lat, e.latlng.lng);
        }
      });
    }
  }, [isDrawingMode, fetchBuildingsAtLocation]);

  // Calculate polygon area using Turf.js
  const calculatePolygonArea = useCallback((points: L.LatLng[]) => {
    if (points.length < MIN_POLYGON_POINTS) return 0;

    const coordinates = points.map((ll) => [ll.lng, ll.lat]);
    coordinates.push(coordinates[0]);

    const polygon = turf.polygon([coordinates]);
    const areaInSqMeters = turf.area(polygon);
    
    return Math.round(areaInSqMeters * 100) / 100;
  }, []);

  // Recalculate area whenever points change (for dragging updates in manual draw mode)
  useEffect(() => {
    if (!isDrawingMode && polygonPoints.length >= MIN_POLYGON_POINTS && detectedBuildings.length === 0) {
      const area = calculatePolygonArea(polygonPoints);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) {
        onAreaCalculated(area);
      }
    }
  }, [polygonPoints, isDrawingMode, calculatePolygonArea, onAreaCalculated, detectedBuildings.length]);

  // Update polygon visualization for manual drawing
  useEffect(() => {
    if (!mapRef.current || detectedBuildings.length > 0) return;

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

    // Draw draggable point markers (only when not in drawing mode for better UX)
    polygonPoints.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: !isDrawingMode,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 8px;
            height: 8px;
            background: ${index === 0 ? '#f59e0b' : '#14b8a6'};
            border: 1px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            cursor: ${isDrawingMode ? 'crosshair' : 'grab'};
          "></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        }),
      }).addTo(mapRef.current!);

      // Handle drag events to update polygon points
      if (!isDrawingMode) {
        marker.on('drag', (e: L.LeafletEvent) => {
          const target = e.target as L.Marker;
          const newLatLng = target.getLatLng();
          setPolygonPoints(prev => {
            const updated = [...prev];
            updated[index] = newLatLng;
            return updated;
          });
        });
      }

      pointMarkersRef.current.push(marker as any);
    });
  }, [polygonPoints, isDrawingMode, detectedBuildings.length]);

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

  // Complete polygon drawing and update location based on polygon center
  const completePolygon = useCallback(async (points: L.LatLng[]) => {
    if (points.length >= MIN_POLYGON_POINTS) {
      const area = calculatePolygonArea(points);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) {
        onAreaCalculated(area);
      }

      // Calculate the center of the polygon using Turf.js
      const coordinates = points.map((ll) => [ll.lng, ll.lat]);
      coordinates.push(coordinates[0]);
      const polygon = turf.polygon([coordinates]);
      const centroid = turf.centroid(polygon);
      const [lng, lat] = centroid.geometry.coordinates;

      // Update location based on polygon center and fetch climate data
      const locationName = await getLocationName(lat, lng);
      setCurrentLocation({ lat, lng, name: locationName });
      if (onLocationChange) {
        onLocationChange(locationName);
      }
      fetchClimateForLocation(lat, lng);
    }
    setIsDrawingMode(false);
  }, [calculatePolygonArea, onAreaCalculated, onLocationChange, fetchClimateForLocation]);

  // Update location and fetch climate data
  const updateLocation = useCallback(async (lat: number, lng: number, name?: string) => {
    const locationName = name || await getLocationName(lat, lng);
    setCurrentLocation({ lat, lng, name: locationName });
    
    if (onLocationChange) {
      onLocationChange(locationName);
    }
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 20);
    }
    
    // Fetch climate data for new location
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
  }, [onClimateDataFetched, onLocationChange]);

  // Initial climate data fetch
  useEffect(() => {
    fetchClimateForLocation(currentLocation.lat, currentLocation.lng);
  }, []);

  // Detect location using GPS
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t('map.gpsNotSupported'));
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        await updateLocation(lat, lng);
        toast.success(t('map.locationDetected'));
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('GPS error:', error);
        toast.error(t('map.locationError'));
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [t, updateLocation]);

  // Clear polygon
  const clearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCalculatedArea(null);
    clearDetectedBuildings();
    
    // Clear manual drawing polygon
    if (polygonLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    pointMarkersRef.current.forEach(marker => mapRef.current?.removeLayer(marker));
    pointMarkersRef.current = [];
  }, [clearDetectedBuildings]);

  // Undo last point
  const undoLastPoint = useCallback(() => {
    setPolygonPoints(prev => prev.slice(0, -1));
  }, []);

  // Toggle drawing mode
  const toggleDrawingMode = useCallback(() => {
    if (isDrawingMode) {
      if (polygonPoints.length >= MIN_POLYGON_POINTS) {
        completePolygon(polygonPoints);
      }
      setIsDrawingMode(false);
    } else {
      clearPolygon();
      setIsDrawingMode(true);
    }
  }, [isDrawingMode, polygonPoints, completePolygon, clearPolygon]);

  // Start manual drawing mode
  const startManualDraw = useCallback(() => {
    clearPolygon();
    setIsDrawingMode(true);
  }, [clearPolygon]);

  // Debounced search ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-search as user types with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Select a search result
  const selectSearchResult = (result: { lat: number; lng: number; name: string }) => {
    updateLocation(result.lat, result.lng, result.name.split(",")[0]);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 gradient-hero" />
      
      <div className="relative container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isArabic ? 'اكتشف' : 'Find Your'} <span className="text-gradient-solar">{isArabic ? 'إمكاناتك الشمسية' : 'Solar Potential'}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('map.subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-6 animate-slide-up relative z-50">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder={isArabic ? "ابحث عن أي موقع في مصر..." : "Search any location in Egypt..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 pe-10 h-12 bg-card border-border/50 shadow-card focus:shadow-glow transition-shadow"
            />
            {isSearching && (
              <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute start-0 end-0 z-[100] mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full px-4 py-3 text-start hover:bg-primary/10 text-sm truncate border-b border-border/50 last:border-b-0 transition-colors"
                >
                  <span className="text-foreground">{result.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Location Button */}
        <div className="flex justify-center gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Button
            onClick={detectLocation}
            disabled={isDetectingLocation}
            variant="outline"
            className="flex items-center gap-2 bg-card border-border hover:border-primary/50"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('map.detectingLocation')}
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                {t('map.detectLocation')}
              </>
            )}
          </Button>
        </div>

        {/* Drawing Controls - only show when in drawing mode or when we have a polygon */}
        <div className="flex justify-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {!isDrawingMode && !calculatedArea && (
            <Button
              onClick={startManualDraw}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              {t('map.manualDraw')}
            </Button>
          )}
          {isDrawingMode && (
            <>
              <Button
                onClick={toggleDrawingMode}
                variant="default"
                className="flex items-center gap-2 gradient-solar text-primary-foreground shadow-glow"
              >
                <MousePointer className="w-4 h-4" />
                {isArabic ? 'إنهاء الرسم' : 'Finish Drawing'}
              </Button>
              {polygonPoints.length > 0 && (
                <Button
                  onClick={undoLastPoint}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  {isArabic ? 'تراجع' : 'Undo'}
                </Button>
              )}
            </>
          )}
          {(polygonPoints.length > 0 || calculatedArea !== null) && (
            <Button
              onClick={clearPolygon}
              variant="outline"
              className="flex items-center gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              {isArabic ? 'مسح' : 'Clear'}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mb-4 animate-fade-in">
          {isSearchingBuildings ? (
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{t('map.searchingBuildings')}</span>
            </div>
          ) : isDrawingMode ? (
            <p className="text-sm text-primary font-medium bg-primary/10 inline-block px-4 py-2 rounded-lg">
              {polygonPoints.length < MIN_POLYGON_POINTS 
                ? (isArabic 
                    ? `انقر على الخريطة لإضافة نقاط (${polygonPoints.length}/${MIN_POLYGON_POINTS} الحد الأدنى)`
                    : `Click on the map to add points (${polygonPoints.length}/${MIN_POLYGON_POINTS} minimum)`)
                : (isArabic
                    ? `${polygonPoints.length} نقاط - انقر بالقرب من النقطة الأولى أو 'إنهاء الرسم'`
                    : `${polygonPoints.length} points - Click near first point or 'Finish Drawing'`)}
            </p>
          ) : !calculatedArea ? (
            <p className="text-sm text-primary font-medium bg-primary/10 inline-block px-4 py-2 rounded-lg">
              {t('map.clickToDetect')}
            </p>
          ) : null}
        </div>

        {/* Calculated Area Display */}
        {calculatedArea !== null && (
          <div className="text-center mb-4 animate-scale-in">
            <div className="inline-flex items-center gap-2 bg-solar-green/20 text-solar-green px-4 py-2 rounded-lg border border-solar-green/30">
              <span className="text-sm font-medium">{t('map.rooftopArea')}:</span>
              <span className="text-lg font-bold">{calculatedArea.toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {/* Map Size Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <Button
            onClick={() => setMapSize("normal")}
            variant={mapSize === "normal" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
          >
            <Minimize2 className="w-4 h-4" />
            {isArabic ? 'عادي' : 'Normal'}
          </Button>
          <Button
            onClick={() => setMapSize("large")}
            variant={mapSize === "large" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
          >
            <Maximize2 className="w-4 h-4" />
            {isArabic ? 'كبير' : 'Large'}
          </Button>
        </div>

        {/* Map Container */}
        <div 
          className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 animate-scale-in transition-all duration-300"
          style={{ animationDelay: "0.2s" }}
        >
          <div 
            className={`bg-muted relative ${
              mapSize === "normal" 
                ? "aspect-[16/9] md:aspect-[21/9]" 
                : "aspect-square md:aspect-[16/9] min-h-[500px]"
            }`}
          >
            <div 
              ref={mapContainerRef} 
              className="w-full h-full z-0"
              style={{ cursor: isDrawingMode ? "crosshair" : "pointer" }}
            />
          </div>
          
          {/* Map Overlay Info */}
          <div className="absolute bottom-4 start-4 glass rounded-lg px-4 py-2 shadow-lg z-[1000]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
              <span className="text-sm font-medium text-foreground">{currentLocation.name}, {isArabic ? 'مصر' : 'Egypt'}</span>
            </div>
            {isLoadingClimate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isArabic ? 'جاري تحميل بيانات المناخ...' : 'Loading climate data...'}
              </div>
            ) : climateData ? (
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'متوسط الإشعاع الشمسي:' : 'Avg. Solar Irradiance:'} {climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day
              </p>
            ) : null}
          </div>

          {/* Data Source Badge */}
          <div className="absolute bottom-4 end-4 glass rounded-lg px-3 py-1.5 shadow-lg z-[1000]">
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'البيانات:' : 'Data:'} <span className="text-foreground font-medium">NASA POWER</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
