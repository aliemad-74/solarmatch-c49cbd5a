import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Settings2, Wrench, ClipboardCheck, HardHat } from "lucide-react";
import { SolarCalculation, systemPackages } from "@/lib/solarData";

interface TechnicalSpecificationsProps {
  results: SolarCalculation;
}

const TechnicalSpecifications = ({ results }: TechnicalSpecificationsProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const { kWInstalled, energyYear, panelCount, panelWattage } = results;

  // Calculations
  const voc = 40; // V per panel
  const isc = Math.round((panelWattage / voc) * 10) / 10;
  const maxSeriesPanels = Math.floor(1000 / voc);
  const recommendedSeries = 3;
  const inverterMin = Math.round(kWInstalled * 1.25 * 10) / 10;
  const inverterRec = Math.round(kWInstalled * 1.5 * 10) / 10;
  const dailyLoad = Math.round((energyYear / 365) * 100) / 100;
  const batteryCapacityKwh = Math.round(dailyLoad * 1.5 * 10) / 10;
  const batteryCapacityAh = Math.round((dailyLoad * 1.5 * 1000) / 48);
  const dailyLoadAh = Math.round((dailyLoad * 1000) / 48);
  const peakLoad = kWInstalled * 1000;
  const stringsCount = Math.ceil(panelCount / recommendedSeries);
  const dcFusing = Math.ceil((panelCount / stringsCount) * isc * 1.25);
  const batteryCable = kWInstalled > 5 ? "16mm²" : "10mm²";

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistItems = [
    { key: "voc", en: "Verify open-circuit voltage (Voc) of each string before connecting to inverter", ar: "تحقق من جهد الدائرة المفتوحة (Voc) لكل سلسلة قبل التوصيل بالعاكس" },
    { key: "polarity", en: "Check polarity on all DC connections", ar: "تحقق من القطبية في جميع التوصيلات المستمرة" },
    { key: "insulation", en: "Insulation resistance test: must be >1MΩ for all DC wiring", ar: "اختبار مقاومة العزل: يجب أن تكون >1MΩ لجميع الأسلاك المستمرة" },
    { key: "load50", en: "Load test at 50% of rated capacity", ar: "اختبار حمل عند 50% من السعة المقننة" },
    { key: "load75", en: "Load test at 75% of rated capacity", ar: "اختبار حمل عند 75% من السعة المقننة" },
    { key: "load100", en: "Load test at 100% of rated capacity", ar: "اختبار حمل عند 100% من السعة المقننة" },
    { key: "inverter", en: "Confirm inverter communication and monitoring active", ar: "تأكد من اتصال العاكس ونشاط المراقبة" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger className="w-full p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-start">
            <h3 className="font-display font-semibold text-foreground">
              {isAr ? "المواصفات التقنية" : "Technical Specifications"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? "تفاصيل هندسية للمهندسين والفنيين" : "Engineering details for professionals"}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-6">
        {/* System Specifications */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            {isAr ? "مواصفات النظام" : "System Specifications"}
          </h4>
          
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">{isAr ? "سعة المصفوفة الإجمالية" : "Total Array Capacity"}</span>
              <span className="font-bold text-foreground">{kWInstalled} kWp</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">{isAr ? "تكوين الألواح" : "Panel Configuration"}</span>
              <span className="font-bold text-foreground">{panelCount} × {panelWattage}W</span>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voc</span>
                <span className="font-medium">~{voc}V {isAr ? "لكل لوح" : "per panel"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Isc</span>
                <span className="font-medium">~{isc}A {isAr ? "لكل لوح" : "per panel"}</span>
              </div>
            </div>

            {/* String Sizing */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
              <p className="font-medium text-foreground">{isAr ? "تحجيم السلاسل" : "String Sizing"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? `الحد الأقصى: ${maxSeriesPanels} لوح على التوالي (حد النظام 1000V)` : `Max ${maxSeriesPanels} panels in series (1000V system limit)`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr ? `الموصى: ${recommendedSeries} ألواح على التوالي لأنظمة بطاريات 48V` : `Recommended: ${recommendedSeries} panels in series for 48V battery systems`}
              </p>
            </div>

            {/* Inverter */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <p className="font-medium text-foreground">{isAr ? "تقييم العاكس" : "Inverter Rating"}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{isAr ? "الحد الأدنى" : "Minimum"}</span>
                <span className="font-medium">{inverterMin} kW {isAr ? "مستمر" : "continuous"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{isAr ? "الموصى" : "Recommended"}</span>
                <span className="font-medium text-primary">{inverterRec} kW ({isAr ? "لأحمال البدء" : "startup surge"})</span>
              </div>
            </div>

            {/* Battery Bank */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <p className="font-medium text-foreground">{isAr ? "بنك البطاريات (سيناريو مستقل)" : "Battery Bank (off-grid scenario)"}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{isAr ? "السعة" : "Capacity"}</span>
                <span className="font-medium">{batteryCapacityKwh} kWh @ 48V = {batteryCapacityAh} Ah</span>
              </div>
            </div>

            {/* Daily Load */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <p className="font-medium text-foreground">{isAr ? "الحمل اليومي" : "Daily Load"}</p>
              <p className="text-xs text-muted-foreground">{dailyLoad} kWh/day = {dailyLoadAh} Ah @ 48V</p>
              <p className="text-xs text-muted-foreground">{isAr ? "حمل الذروة" : "Peak Load"}: {peakLoad.toLocaleString()} W</p>
            </div>
          </div>
        </div>

        {/* Wiring & Protection */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            {isAr ? "الأسلاك والحماية" : "Wiring & Protection"}
          </h4>

          <div className="grid gap-3 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">{isAr ? "كابل PV" : "PV Cable"}</p>
              <p className="text-xs text-muted-foreground">4mm² or 6mm² solar cable (UV-resistant, double-insulated)</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">{isAr ? "كابل البطارية" : "Battery Cable"}</p>
              <p className="text-xs text-muted-foreground">{batteryCable} minimum for DC runs</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">{isAr ? "فيوز DC" : "DC Fusing"}</p>
              <p className="text-xs text-muted-foreground">{dcFusing}A per string ({stringsCount} strings)</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">{isAr ? "حماية AC" : "AC Protection"}</p>
              <p className="text-xs text-muted-foreground">MCB rated for inverter output • RCD/GFCI required on AC side</p>
            </div>
          </div>
        </div>

        {/* Installation Notes */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <HardHat className="w-4 h-4 text-primary" />
            {isAr ? "ملاحظات التركيب" : "Installation Notes"}
          </h4>

          <div className="space-y-3 text-sm">
            {[
              { en: "Mount panels at 10–15° tilt facing SOUTH", ar: "تركيب الألواح بزاوية 10-15° باتجاه الجنوب", note: isAr ? "مصر في نصف الكرة الشمالي — الألواح تواجه الجنوب" : "Egypt is in the Northern Hemisphere — panels face South" },
              { en: "Maintain minimum 5cm gap under panels for ventilation", ar: "الحفاظ على فجوة 5 سم كحد أدنى تحت الألواح للتهوية" },
              { en: "Battery room must be ventilated, away from direct sunlight", ar: "غرفة البطاريات يجب أن تكون مهواة وبعيدة عن أشعة الشمس المباشرة" },
              { en: "Charge controller settings: Bulk: 57.6V | Float: 54.4V | LVD: 44V", ar: "إعدادات وحدة التحكم: Bulk: 57.6V | Float: 54.4V | LVD: 44V" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
                <span className="text-primary mt-0.5">✓</span>
                <div>
                  <p className="text-foreground">{isAr ? item.ar : item.en}</p>
                  {item.note && <p className="text-xs text-muted-foreground mt-0.5">({item.note})</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testing Checklist */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            {isAr ? "قائمة فحص الاختبار" : "Testing Checklist"}
          </h4>

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checklist[item.key] 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                }`}
              >
                <Checkbox
                  checked={!!checklist[item.key]}
                  onCheckedChange={() => toggleCheck(item.key)}
                  className="mt-0.5"
                />
                <span className={`text-sm ${checklist[item.key] ? "text-foreground line-through opacity-70" : "text-foreground"}`}>
                  {isAr ? item.ar : item.en}
                </span>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TechnicalSpecifications;
