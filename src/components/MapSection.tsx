import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, PenTool, Trash2, Loader2, Undo2, Navigation, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { fetchClimateData, getLocationName, ClimateData } from "@/lib/climateApi";
import { toast } from "sonner";

// TEMPORARY: secret token used while Google Maps billing is being set up.
// Replace with a public pk.* token from https://account.mapbox.com/access-tokens/
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWxpZW1hZDc0IiwiYSI6ImNtb3llNDgyeTBobGMycXF4ZzR4Z3V5azgifQ.1I2brc382ZP3gs3A4aNKfg";
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapSectionProps {
  onAreaCalculated?: (area: number) => void;
  onClimateDataFetched?: (data: ClimateData) => void;
  onLocationChange?: (locationName: string) => void;
  onPolygonComplete?: (
    polygon: { lat: number; lng: number }[],
    center: { lat: number; lng: number },
    area: number,
  ) => void;
}

interface LatLng {
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION = { lat: 30.0444, lng: 31.2357, name: "Cairo" };
const MIN_POLYGON_POINTS = 4;
const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

type DrawingPhase = "idle" | "fullscreen";

const MapSection = ({
  onAreaCalculated,
  onClimateDataFetched,
  onLocationChange,
  onPolygonComplete,
}: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lng: number }[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoadingClimate, setIsLoadingClimate] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [drawingPhase, setDrawingPhase] = useState<DrawingPhase>("idle");

  // Two map instances: preview + fullscreen drawing
  const previewMapRef = useRef<mapboxgl.Map | null>(null);
  const fullscreenMapRef = useRef<mapboxgl.Map | null>(null);
  const searchDebounceRef = useRef<number | null>(null);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  // Calculate polygon area using Turf.js
  const calculatePolygonArea = useCallback((points: LatLng[]) => {
    if (points.length < 3) return 0;
    const coordinates = points.map((p) => [p.lng, p.lat]);
    coordinates.push(coordinates[0]);
    const polygon = turf.polygon([coordinates]);
    return Math.round(turf.area(polygon) * 100) / 100;
  }, []);

  // ===== Render polygon (points + lines + fill) onto a map =====
  const renderPolygonOnMap = useCallback(
    (map: mapboxgl.Map, points: LatLng[]) => {
      const polySource = map.getSource("poly") as mapboxgl.GeoJSONSource | undefined;
      const ptsSource = map.getSource("pts") as mapboxgl.GeoJSONSource | undefined;
      if (!polySource || !ptsSource) return;

      const closedCoords =
        points.length >= 3
          ? [...points.map((p) => [p.lng, p.lat]), [points[0].lng, points[0].lat]]
          : points.map((p) => [p.lng, p.lat]);

      polySource.setData({
        type: "Feature",
        geometry:
          points.length >= 3
            ? { type: "Polygon", coordinates: [closedCoords] }
            : { type: "LineString", coordinates: closedCoords },
        properties: {},
      } as any);

      ptsSource.setData({
        type: "FeatureCollection",
        features: points.map((p, i) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { first: i === 0 },
        })),
      } as any);
    },
    [],
  );

  // Add polygon layers to a map
  const addPolygonLayers = useCallback((map: mapboxgl.Map) => {
    if (map.getSource("poly")) return;
    map.addSource("poly", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] } as any,
    });
    map.addSource("pts", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] } as any,
    });
    map.addLayer({
      id: "poly-fill",
      type: "fill",
      source: "poly",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": "#14b8a6", "fill-opacity": 0.4 },
    });
    map.addLayer({
      id: "poly-outline",
      type: "line",
      source: "poly",
      paint: { "line-color": "#14b8a6", "line-width": 2 },
    });
    map.addLayer({
      id: "pts-circle",
      type: "circle",
      source: "pts",
      paint: {
        "circle-radius": 6,
        "circle-color": ["case", ["get", "first"], "#f59e0b", "#14b8a6"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  }, []);

  // Update both maps' polygon rendering whenever points change
  useEffect(() => {
    if (previewMapRef.current && previewMapRef.current.isStyleLoaded()) {
      renderPolygonOnMap(previewMapRef.current, polygonPoints);
    }
    if (fullscreenMapRef.current && fullscreenMapRef.current.isStyleLoaded()) {
      renderPolygonOnMap(fullscreenMapRef.current, polygonPoints);
    }
  }, [polygonPoints, renderPolygonOnMap]);

  // Recalculate area when not drawing
  useEffect(() => {
    if (!isDrawingMode && polygonPoints.length >= MIN_POLYGON_POINTS) {
      const area = calculatePolygonArea(polygonPoints);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) onAreaCalculated(area);
    }
  }, [polygonPoints, isDrawingMode, calculatePolygonArea, onAreaCalculated]);

  // Climate fetch
  const fetchClimateForLocation = useCallback(
    async (lat: number, lng: number) => {
      setIsLoadingClimate(true);
      try {
        const data = await fetchClimateData(lat, lng);
        setClimateData(data);
        onClimateDataFetched?.(data);
      } catch (error) {
        console.error("Failed to fetch climate data:", error);
      } finally {
        setIsLoadingClimate(false);
      }
    },
    [onClimateDataFetched],
  );

  useEffect(() => {
    fetchClimateForLocation(currentLocation.lat, currentLocation.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Callback ref: init preview map whenever its container mounts =====
  const previewContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        if (previewMapRef.current) {
          previewMapRef.current.remove();
          previewMapRef.current = null;
        }
        return;
      }
      if (previewMapRef.current) return;
      const map = new mapboxgl.Map({
        container: node,
        style: MAP_STYLE,
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 19,
        maxZoom: 22,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        addPolygonLayers(map);
        renderPolygonOnMap(map, polygonPoints);
      });
      previewMapRef.current = map;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ===== Callback ref: init fullscreen drawing map =====
  const fullscreenContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        if (fullscreenMapRef.current) {
          fullscreenMapRef.current.remove();
          fullscreenMapRef.current = null;
        }
        return;
      }
      if (fullscreenMapRef.current) return;
      const map = new mapboxgl.Map({
        container: node,
        style: MAP_STYLE,
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 20,
        maxZoom: 22,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.getCanvas().style.cursor = "crosshair";
      map.on("load", () => {
        addPolygonLayers(map);
        renderPolygonOnMap(map, polygonPoints);
      });
      map.on("click", (e) => {
        const newPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setPolygonPoints((prev) => {
          if (prev.length >= MIN_POLYGON_POINTS) {
            const first = prev[0];
            const dx = (first.lng - newPoint.lng) * 111320 * Math.cos((first.lat * Math.PI) / 180);
            const dy = (first.lat - newPoint.lat) * 110540;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
              setTimeout(() => completePolygon(prev), 0);
              return prev;
            }
          }
          return [...prev, newPoint];
        });
      });
      fullscreenMapRef.current = map;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Pan preview map when location changes
  useEffect(() => {
    if (previewMapRef.current) {
      previewMapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 19,
        duration: 800,
      });
    }
  }, [currentLocation]);

  // ===== Mapbox Geocoding (autocomplete) =====
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery,
        )}.json?country=eg&limit=5&language=${isArabic ? "ar" : "en"}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.features || []).map((f: any) => ({
          name: f.place_name,
          lng: f.center[0],
          lat: f.center[1],
        }));
        setSearchResults(results);
        setShowResults(true);
      } catch (e) {
        console.error("Geocoding error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, isArabic]);

  // Update location
  const updateLocation = useCallback(
    async (lat: number, lng: number, name?: string) => {
      const locationName = name || (await getLocationName(lat, lng));
      setCurrentLocation({ lat, lng, name: locationName });
      onLocationChange?.(locationName);
      setIsLoadingClimate(true);
      try {
        const data = await fetchClimateData(lat, lng);
        setClimateData(data);
        onClimateDataFetched?.(data);
      } catch (error) {
        console.error("Failed to fetch climate data:", error);
      } finally {
        setIsLoadingClimate(false);
      }
    },
    [onClimateDataFetched, onLocationChange],
  );

  // Complete polygon
  const completePolygon = useCallback(
    async (points: LatLng[]) => {
      if (points.length >= MIN_POLYGON_POINTS) {
        const area = calculatePolygonArea(points);
        setCalculatedArea(area);
        if (onAreaCalculated && area > 0) onAreaCalculated(area);

        const coordinates = points.map((p) => [p.lng, p.lat]);
        coordinates.push(coordinates[0]);
        const polygon = turf.polygon([coordinates]);
        const centroid = turf.centroid(polygon);
        const [lng, lat] = centroid.geometry.coordinates;

        const locationName = await getLocationName(lat, lng);
        setCurrentLocation({ lat, lng, name: locationName });
        onLocationChange?.(locationName);
        fetchClimateForLocation(lat, lng);

        onPolygonComplete?.(
          points.map((p) => ({ lat: p.lat, lng: p.lng })),
          { lat, lng },
          area,
        );
      }
      setIsDrawingMode(false);
    },
    [
      calculatePolygonArea,
      onAreaCalculated,
      onLocationChange,
      fetchClimateForLocation,
      onPolygonComplete,
    ],
  );

  // GPS detection
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t("map.gpsNotSupported"));
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setSearchQuery("");
        setShowResults(false);
        await updateLocation(position.coords.latitude, position.coords.longitude);
        toast.success(t("map.locationDetected"));
        setIsDetectingLocation(false);
      },
      () => {
        toast.error(t("map.locationError"));
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [t, updateLocation]);

  // Clear/undo
  const clearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCalculatedArea(null);
  }, []);
  const undoLastPoint = useCallback(() => {
    setPolygonPoints((prev) => prev.slice(0, -1));
  }, []);

  const startDrawing = useCallback(() => {
    clearPolygon();
    setIsDrawingMode(true);
    setDrawingPhase("fullscreen");
  }, [clearPolygon]);

  const handleSelectResult = (r: { name: string; lat: number; lng: number }) => {
    setSearchQuery(r.name);
    setShowResults(false);
    updateLocation(r.lat, r.lng, r.name.split(",")[0]);
  };

  // ===== Fullscreen drawing overlay =====
  if (drawingPhase === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setIsDrawingMode(false);
                setDrawingPhase("idle");
                clearPolygon();
              }}
              variant="ghost"
              size="icon"
            >
              <X className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-foreground">
              {isArabic ? "حدد سطح المبنى" : "Draw Your Rooftop"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {polygonPoints.length > 0 && (
              <Button onClick={undoLastPoint} variant="outline" size="sm" className="gap-1">
                <Undo2 className="w-4 h-4" />
                {isArabic ? "تراجع" : "Undo"}
              </Button>
            )}
            {polygonPoints.length > 0 && (
              <Button
                onClick={clearPolygon}
                variant="outline"
                size="sm"
                className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                {isArabic ? "مسح" : "Clear"}
              </Button>
            )}
            <Button
              onClick={() => {
                if (drawingPhase !== "fullscreen") return;
                setDrawingPhase("idle");
                setIsDrawingMode(false);
                if (polygonPoints.length >= MIN_POLYGON_POINTS) {
                  setTimeout(() => completePolygon(polygonPoints), 0);
                }
              }}
              disabled={polygonPoints.length < MIN_POLYGON_POINTS}
              className="gap-1 gradient-solar text-primary-foreground shadow-glow"
              size="sm"
            >
              <Check className="w-4 h-4" />
              {isArabic ? "تم" : "Done"}
            </Button>
          </div>
        </div>

        <div className="text-center py-2 bg-primary/10 border-b border-primary/20">
          <p className="text-sm text-primary font-medium">
            {polygonPoints.length < MIN_POLYGON_POINTS
              ? isArabic
                ? `انقر على الخريطة لإضافة نقاط (${polygonPoints.length}/${MIN_POLYGON_POINTS} الحد الأدنى)`
                : `Click on the map to add points (${polygonPoints.length}/${MIN_POLYGON_POINTS} minimum)`
              : isArabic
                ? `${polygonPoints.length} نقاط - انقر بالقرب من النقطة الأولى أو اضغط 'تم'`
                : `${polygonPoints.length} points - Click near first point or press 'Done'`}
          </p>
        </div>

        <div className="flex-1 relative">
          <div ref={fullscreenContainerRef} className="absolute inset-0" />
          {polygonPoints.length >= MIN_POLYGON_POINTS && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="inline-flex items-center gap-2 bg-solar-green/90 text-white px-5 py-2.5 rounded-full shadow-lg">
                <span className="text-sm font-medium">{isArabic ? "المساحة:" : "Area:"}</span>
                <span className="text-lg font-bold">
                  {calculatePolygonArea(polygonPoints).toFixed(1)} m²
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 gradient-hero" />
      <div className="relative container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isArabic ? "اكتشف" : "Find Your"}{" "}
            <span className="text-gradient-solar">
              {isArabic ? "إمكاناتك الشمسية" : "Solar Potential"}
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("map.subtitle")}</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-6 animate-slide-up relative z-50">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <input
              type="text"
              placeholder={
                isArabic ? "ابحث عن أي موقع في مصر..." : "Search any location in Egypt..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full ps-10 pe-10 h-12 bg-card border border-border/50 rounded-md shadow-card focus:shadow-glow transition-shadow text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {isSearching && (
              <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-card border border-border/50 rounded-md shadow-lg overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/30 last:border-0"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS + Draw Buttons */}
        <div
          className="flex justify-center gap-3 mb-6 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <Button
            onClick={detectLocation}
            disabled={isDetectingLocation}
            variant="outline"
            className="flex items-center gap-2 bg-card border-border hover:border-primary/50"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("map.detectingLocation")}
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                {t("map.detectLocation")}
              </>
            )}
          </Button>
          <Button
            onClick={startDrawing}
            className="flex items-center gap-2 gradient-solar text-primary-foreground shadow-glow"
          >
            <PenTool className="w-4 h-4" />
            {isArabic ? "ارسم السطح" : "Draw Rooftop"}
          </Button>
        </div>

        {calculatedArea !== null && (
          <div className="text-center mb-4 animate-scale-in">
            <div className="inline-flex items-center gap-2 bg-solar-green/20 text-solar-green px-4 py-2 rounded-lg border border-solar-green/30">
              <span className="text-sm font-medium">{t("map.rooftopArea")}:</span>
              <span className="text-lg font-bold">{calculatedArea.toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {/* Map preview */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 animate-scale-in transition-all duration-300"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="aspect-[16/9] md:aspect-[21/9] bg-muted relative">
            <div ref={previewContainerRef} className="absolute inset-0" />
          </div>

          <div className="absolute bottom-4 start-4 glass rounded-lg px-4 py-2 shadow-lg z-[1000]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solar-green animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                {currentLocation.name}, {isArabic ? "مصر" : "Egypt"}
              </span>
            </div>
            {isLoadingClimate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isArabic ? "جاري تحميل بيانات المناخ..." : "Loading climate data..."}
              </div>
            ) : climateData ? (
              <p className="text-xs text-muted-foreground">
                {isArabic ? "متوسط الإشعاع الشمسي:" : "Avg. Solar Irradiance:"}{" "}
                {climateData.annualAvgIrradiance.toFixed(1)} kWh/m²/day
              </p>
            ) : null}
          </div>

          <div className="absolute bottom-4 end-4 glass rounded-lg px-3 py-1.5 shadow-lg z-[1000]">
            <p className="text-xs text-muted-foreground">
              {isArabic ? "البيانات:" : "Data:"}{" "}
              <span className="text-foreground font-medium">NASA POWER</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
