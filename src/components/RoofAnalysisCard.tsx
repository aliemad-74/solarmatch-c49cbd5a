import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Loader2 } from "lucide-react";
import type { RoofAnalysisResult } from "@/lib/roofAnalysis";

interface Props {
  loading?: boolean;
  result?: RoofAnalysisResult | null;
  error?: string | null;
}

// Passive presentational card. No overlays, no portals, no pointer handlers.
const RoofAnalysisCard = ({ loading, result, error }: Props) => {
  const { i18n } = useTranslation();
  const ar = i18n.language === "ar";

  if (!loading && !result && !error) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Satellite className="w-4 h-4 text-primary" />
          {ar ? "تحليل السطح بالقمر الصناعي" : "Satellite Rooftop Analysis"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {ar ? "جاري التحليل..." : "Analyzing satellite imagery..."}
          </div>
        )}
        {error && !loading && (
          <p className="text-destructive">{error}</p>
        )}
        {result && !loading && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label={ar ? "المساحة المحددة" : "Selected"} value={`${result.selectedArea} m²`} />
              <Stat label={ar ? "السطح الفعلي" : "Detected roof"} value={`${result.detectedRoofArea} m²`} />
              <Stat label={ar ? "قابل للاستخدام" : "Usable"} value={`${result.usableArea} m²`} />
              <Stat label={ar ? "غير قابل" : "Unusable"} value={`${result.unusablePercentage}%`} />
            </div>
            {result.obstacles.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{ar ? "العوائق المكتشفة:" : "Obstacles detected:"}</p>
                <div className="flex flex-wrap gap-1">
                  {result.obstacles.map((o, i) => <Badge key={i} variant="secondary">{o}</Badge>)}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {ar ? "الثقة" : "Confidence"}: {Math.round(result.confidenceScore * 100)}%
              {result.cached && (ar ? " · مخزّن" : " · cached")}
            </p>
            {result.notes && <p className="text-xs text-muted-foreground italic">{result.notes}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default RoofAnalysisCard;
