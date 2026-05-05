import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, PenTool, Trash2, Loader2, Undo2, Navigation, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMap, useJsApiLoader, Polygon, Marker } from "@react-google-maps/api";
import * as turf from "@turf/turf";
import { fetchClimateData, getLocationName, ClimateData } from "@/lib/climateApi";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY = "AIzaSyAuvna58z-9zjIfs8aBsZqHMq7t6_JisXY";
const LIBRARIES: ("places")[] = ["places"];

interface MapSectionProps {
  onAreaCalculated?: (area: number) => void;
  onClimateDataFetched?: (data: ClimateData) => void;
  onLocationChange?: (locationName: string) => void;
  onPolygonChange?: (points: google.maps.LatLngLiteral[]) => void;
}

const DEFAULT_LOCATION = { lat: 30.0444, lng: 31.2357, name: "Cairo" };
const MIN_POLYGON_POINTS = 4;

const MapSection = ({
  onAreaCalculated,
  onClimateDataFetched,
  onLocationChange,
  onPolygonChange,
}: MapSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoadingClimate, setIsLoadingClimate] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Cleanup all Google Maps listeners and reset interaction state on the current map.
  const cleanupGoogleMapInteractions = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      // Remove any listeners we explicitly attached.
      mapListenersRef.current.forEach((l) => l.remove());
      mapListenersRef.current = [];
      // Clear all instance listeners attached to the map by us / library.
      if (window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(map);
      }
      // Reset interaction options to a clean default.
      map.setOptions({
        draggableCursor: "grab",
        gestureHandling: "auto",
        draggable: true,
      });
    } catch (err) {
      console.warn("[MapSection] cleanupGoogleMapInteractions warning", err);
    }
  }, []);

  // Initialize Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !autocompleteInputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
      componentRestrictions: { country: "eg" },
      fields: ["geometry", "formatted_address", "name"],
      types: ["geocode", "establishment"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name || place.formatted_address?.split(",")[0] || "";
        updateLocation(lat, lng, name);
        setSearchQuery(place.formatted_address || name);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded]);

  const calculatePolygonArea = useCallback((points: google.maps.LatLngLiteral[]) => {
    if (points.length < MIN_POLYGON_POINTS) return 0;
    const coordinates = points.map((p) => [p.lng, p.lat]);
    coordinates.push(coordinates[0]);
    const polygon = turf.polygon([coordinates]);
    return Math.round(turf.area(polygon) * 100) / 100;
  }, []);

  useEffect(() => {
    if (!isDrawingMode && polygonPoints.length >= MIN_POLYGON_POINTS) {
      const area = calculatePolygonArea(polygonPoints);
      setCalculatedArea(area);
      if (onAreaCalculated && area > 0) onAreaCalculated(area);
      onPolygonChange?.(polygonPoints);
    }
  }, [polygonPoints, isDrawingMode, calculatePolygonArea, onAreaCalculated, onPolygonChange]);

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
    [onClimateDataFetched]
  );

  useEffect(() => {
    fetchClimateForLocation(currentLocation.lat, currentLocation.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completePolygon = useCallback(
    async (points: google.maps.LatLngLiteral[]) => {
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
      }
      setIsDrawingMode(false);
    },
    [calculatePolygonArea, onAreaCalculated, onLocationChange, fetchClimateForLocation]
  );

  const updateLocation = useCallback(
    async (lat: number, lng: number, name?: string) => {
      const locationName = name || (await getLocationName(lat, lng));
      setCurrentLocation({ lat, lng, name: locationName });
      onLocationChange?.(locationName);

      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(20);
      }

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
    [onClimateDataFetched, onLocationChange]
  );

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t("map.gpsNotSupported"));
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setSearchQuery("");
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = "";
        await updateLocation(position.coords.latitude, position.coords.longitude);
        toast.success(t("map.locationDetected"));
        setIsDetectingLocation(false);
      },
      () => {
        toast.error(t("map.locationError"));
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [t, updateLocation]);

  const clearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCalculatedArea(null);
  }, []);

  const undoLastPoint = useCallback(() => {
    setPolygonPoints((prev) => prev.slice(0, -1));
  }, []);

  const enterDrawing = useCallback(() => {
    clearPolygon();
    setIsDrawingMode(true);
    setIsFullscreen(true);
  }, [clearPolygon]);

  const exitDrawing = useCallback(
    (commit: boolean) => {
      if (commit && polygonPoints.length >= MIN_POLYGON_POINTS) {
        completePolygon(polygonPoints);
      } else if (!commit) {
        clearPolygon();
      }
      setIsDrawingMode(false);
      setIsFullscreen(false);
      // Reset interactions on the (single) map after leaving fullscreen.
      requestAnimationFrame(() => {
        cleanupGoogleMapInteractions();
        if (mapRef.current) {
          mapRef.current.setOptions({
            draggableCursor: "grab",
            gestureHandling: "auto",
          });
          // Force a resize so Google recomputes its internal layout after container change.
          google.maps.event.trigger(mapRef.current, "resize");
          mapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
        }
      });
    },
    [polygonPoints, completePolygon, clearPolygon, cleanupGoogleMapInteractions, currentLocation]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawingMode || !e.latLng) return;
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPolygonPoints((prev) => {
        if (prev.length >= MIN_POLYGON_POINTS) {
          const first = prev[0];
          const dist = google.maps.geometry?.spherical?.computeDistanceBetween(
            new google.maps.LatLng(newPoint.lat, newPoint.lng),
            new google.maps.LatLng(first.lat, first.lng)
          );
          if (dist !== undefined && dist < 5) {
            setTimeout(() => completePolygon(prev), 0);
            return prev;
          }
        }
        return [...prev, newPoint];
      });
    },
    [isDrawingMode, completePolygon]
  );

  const handleMarkerDrag = useCallback((index: number, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPolygonPoints((prev) => {
      const updated = [...prev];
      updated[index] = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
      return updated;
    });
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
  }, [currentLocation]);

  const onMapUnmount = useCallback(() => {
    cleanupGoogleMapInteractions();
    mapRef.current = null;
  }, [cleanupGoogleMapInteractions]);

  // Safety: cleanup on component unmount.
  useEffect(() => {
    return () => {
      cleanupGoogleMapInteractions();
      mapRef.current = null;
    };
  }, [cleanupGoogleMapInteractions]);

  const mapContainerStyle = { width: "100%", height: "100%" };
  const baseMapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    disableDefaultUI: true,
    zoomControl: true,
    tilt: 0,
    maxZoom: 22,
    gestureHandling: "auto",
    draggableCursor: isDrawingMode ? "crosshair" : "grab",
  };

  if (!isLoaded) {
    return (
      <section className="relative">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  // Single GoogleMap element — its container is moved/styled depending on fullscreen state.
  const mapElement = (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={20}
      options={baseMapOptions}
      onClick={handleMapClick}
      onLoad={onMapLoad}
      onUnmount={onMapUnmount}
    >
      {polygonPoints.length >= 2 && (
        <Polygon
          paths={polygonPoints}
          options={{
            fillColor: "#14b8a6",
            fillOpacity: 0.4,
            strokeColor: "#14b8a6",
            strokeWeight: 2,
            clickable: false,
          }}
        />
      )}
      {polygonPoints.map((point, index) => (
        <Marker
          key={`point-${index}-${point.lat}-${point.lng}`}
          position={point}
          draggable={isDrawingMode}
          onDrag={(e) => handleMarkerDrag(index, e)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: isDrawingMode ? 6 : 5,
            fillColor: index === 0 ? "#f59e0b" : "#14b8a6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );

  return (
    <section className="relative">
      <div className="absolute inset-0 gradient-hero" />
      <div className="relative container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isArabic ? "اكتشف" : "Find Your"}{" "}
            <span className="text-gradient-solar">{isArabic ? "إمكاناتك الشمسية" : "Solar Potential"}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("map.subtitle")}</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-6 animate-slide-up relative z-50">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder={isArabic ? "ابحث عن أي موقع في مصر..." : "Search any location in Egypt..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-10 h-12 bg-card border border-border/50 rounded-md shadow-card focus:shadow-glow transition-shadow text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

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
            onClick={enterDrawing}
            className="flex items-center gap-2 gradient-solar text-primary-foreground shadow-glow"
          >
            <PenTool className="w-4 h-4" />
            {isArabic ? "ارسم السطح" : "Draw Rooftop"}
          </Button>
        </div>

        {calculatedArea !== null && !isFullscreen && (
          <div className="text-center mb-4 animate-scale-in">
            <div className="inline-flex items-center gap-2 bg-solar-green/20 text-solar-green px-4 py-2 rounded-lg border border-solar-green/30">
              <span className="text-sm font-medium">{t("map.rooftopArea")}:</span>
              <span className="text-lg font-bold">{calculatedArea.toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {/* Map host — single instance. Container changes between inline and fullscreen. */}
        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-[9999] bg-background flex flex-col"
              : "relative rounded-2xl overflow-hidden shadow-xl border border-border/50 animate-scale-in transition-all duration-300"
          }
          style={!isFullscreen ? { animationDelay: "0.2s" } : undefined}
        >
          {isFullscreen && (
            <>
              <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
                <div className="flex items-center gap-3">
                  <Button onClick={() => exitDrawing(false)} variant="ghost" size="icon">
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
                    onClick={() => exitDrawing(true)}
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
            </>
          )}

          <div className={isFullscreen ? "flex-1 relative" : "aspect-[16/9] md:aspect-[21/9] bg-muted relative"}>
            {mapElement}

            {isFullscreen && polygonPoints.length >= MIN_POLYGON_POINTS && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="inline-flex items-center gap-2 bg-solar-green/90 text-white px-5 py-2.5 rounded-full shadow-lg">
                  <span className="text-sm font-medium">{isArabic ? "المساحة:" : "Area:"}</span>
                  <span className="text-lg font-bold">{calculatePolygonArea(polygonPoints).toFixed(1)} m²</span>
                </div>
              </div>
            )}
          </div>

          {!isFullscreen && (
            <>
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
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default MapSection;
