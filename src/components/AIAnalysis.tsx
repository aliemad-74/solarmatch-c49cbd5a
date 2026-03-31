import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ClimateData, GoogleSolarData } from "@/lib/climateApi";

interface AIAnalysisProps {
  rooftopArea: number;
  locationName: string;
  monthlyConsumption: number;
  pvType: string;
  buildingType: string;
  costScenario: string;
  electricityPrice: number;
  climateData: ClimateData | null;
  googleSolarData: GoogleSolarData | null;
  lat?: number;
  lng?: number;
  isVisible: boolean;
}

const AIAnalysis = ({
  rooftopArea, locationName, monthlyConsumption, pvType, buildingType,
  costScenario, electricityPrice, climateData, googleSolarData, lat, lng, isVisible,
}: AIAnalysisProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnalyzed && !isLoading) {
      runAnalysis();
    }
  }, [isVisible]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setAnalysis("");
    setHasAnalyzed(true);

    try {
      const solarData = {
        locationName,
        rooftopArea,
        monthlyConsumption,
        pvType,
        buildingType,
        costScenario,
        electricityPrice,
        lat: lat || climateData?.location?.lat,
        lng: lng || climateData?.location?.lng,
        climateData: climateData ? {
          annualAvgIrradiance: climateData.annualAvgIrradiance,
          monthlyIrradiance: climateData.monthlyIrradiance,
          monthlyTemperature: climateData.monthlyTemperature,
        } : null,
        googleSolarData: googleSolarData?.available ? {
          maxArrayAreaMeters2: googleSolarData.maxArrayAreaMeters2,
          maxSunshineHoursPerYear: googleSolarData.maxSunshineHoursPerYear,
          maxArrayPanelsCount: googleSolarData.maxArrayPanelsCount,
          panelCapacityWatts: googleSolarData.panelCapacityWatts,
        } : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ solarData, language: i18n.language, mode: "calculate" }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 429) {
          toast.error(isArabic ? "تم تجاوز الحد المسموح، حاول لاحقاً" : "Rate limit exceeded, try later");
          return;
        }
        throw new Error(data.error || "Failed to get AI analysis");
      }

      setAnalysis(data.text || "");
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error(isArabic ? "حدث خطأ في التحليل الذكي" : "AI analysis error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 via-background to-solar-orange/5 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="w-6 h-6 text-primary" />
          {isArabic ? "🤖 تحليل ذكي مخصص لمبناك" : "🤖 AI-Powered Analysis for Your Building"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isArabic
            ? "تحليل شامل بالذكاء الاصطناعي مبني على بيانات موقعك الفعلية"
            : "Comprehensive AI analysis based on your actual location data"}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <Sparkles className="w-4 h-4 text-solar-orange absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm animate-pulse">
              {isArabic ? "الذكاء الاصطناعي يحلل مبناك..." : "AI is analyzing your building..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
            {analysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={runAnalysis}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                {isArabic ? "إعادة التحليل" : "Re-analyze"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysis;
