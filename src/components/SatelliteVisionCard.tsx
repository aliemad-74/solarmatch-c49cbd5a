import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, AlertTriangle, Compass, Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SolarEngineData } from "@/pages/Index";

const OBSTACLE_LABELS_EN: Record<string, string> = {
  water_tank: "Water tank",
  satellite_dish: "Satellite dish",
  ac_unit: "AC unit",
  stairs_room: "Stairs room",
  chimney: "Chimney",
  skylight: "Skylight",
  vent: "Vent",
  other: "Other obstacle",
};
const OBSTACLE_LABELS_AR: Record<string, string> = {
  water_tank: "خزان مياه",
  satellite_dish: "طبق فضائي",
  ac_unit: "وحدة تكييف",
  stairs_room: "غرفة سلم",
  chimney: "مدخنة",
  skylight: "كوة سقف",
  vent: "فتحة تهوية",
  other: "عائق آخر",
};

const SHADING_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

interface Props {
  vision: NonNullable<SolarEngineData["vision_analysis"]>;
}

const SatelliteVisionCard = ({ vision }: Props) => {
  const { i18n, t } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const labels = isAr ? OBSTACLE_LABELS_AR : OBSTACLE_LABELS_EN;
  const usablePct = Math.round((vision.usableAreaRatio || 0) * 100);

  return (
    <Card className="p-6 space-y-5 border-primary/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {isAr ? "تحليل صورة القمر الصناعي بالذكاء الاصطناعي" : "AI Satellite Image Analysis"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "كشف العوائق وحساب المساحة الفعلية القابلة للاستخدام" : "Obstacle detection & usable area estimation"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {isAr ? "ثقة:" : "Confidence:"} {vision.confidence}
        </Badge>
      </div>

      {vision.summary && (
        <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border-l-2 border-primary">
          {vision.summary}
        </p>
      )}

      {/* Usable area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isAr ? "المساحة الفعلية القابلة للاستخدام" : "Effective usable area"}
          </span>
          <span className="text-sm font-bold text-primary">{usablePct}%</span>
        </div>
        <Progress value={usablePct} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {isAr
            ? `تم تطبيق هذه النسبة على حسابات حجم النظام. (${100 - usablePct}% خصمت بسبب العوائق المرئية)`
            : `Applied to system sizing. (${100 - usablePct}% deducted for visible obstacles)`}
        </p>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-md bg-muted/30 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "تظليل من المجاورات" : "Shading"}</div>
            <Badge className={`mt-1 ${SHADING_COLOR[vision.shadingLevel] ?? ""}`} variant="secondary">
              {vision.shadingLevel}
            </Badge>
          </div>
        </div>
        <div className="p-3 rounded-md bg-muted/30 flex items-center gap-2">
          <Compass className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? "اتجاه السطح" : "Orientation"}</div>
            <div className="text-sm font-medium capitalize">{vision.orientation}</div>
          </div>
        </div>
      </div>

      {/* Obstacles */}
      {vision.obstacles?.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">
            {isAr ? `العوائق المكتشفة (${vision.obstacles.length})` : `Detected obstacles (${vision.obstacles.length})`}
          </div>
          <div className="flex flex-wrap gap-2">
            {vision.obstacles.map((o, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {labels[o.type] ?? o.type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {vision.warnings?.length > 0 && (
        <div className="space-y-2">
          {vision.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">{w}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground italic">
        {isAr
          ? "تحليل تقريبي بناءً على صورة القمر الصناعي. لا يغني عن المعاينة الميدانية."
          : "Approximate analysis based on satellite imagery. Does not replace on-site inspection."}
      </p>
    </Card>
  );
};

export default SatelliteVisionCard;
