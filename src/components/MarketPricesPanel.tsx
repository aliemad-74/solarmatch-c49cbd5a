import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  ExternalLink,
  Clock,
  Sun,
  Zap,
  Package
} from "lucide-react";

// Simulated market data - in real implementation, this would come from database/API
const simulatedMarketData = {
  lastUpdated: new Date().toISOString(),
  sources: [
    { name: "Solar Market Egypt", url: "https://solarmarket.eg", reliability: "high" },
    { name: "PV-Hub Egypt", url: "https://pvhub.eg", reliability: "medium" },
    { name: "Acropol Egypt", url: "https://acropol.eg", reliability: "high" },
  ],
  panels: [
    { 
      brand: "Canadian Solar",
      model: "TOPBiHiKu7",
      wattage: 670,
      pricePerWatt: 6.80,
      priceChange: -0.15,
      availability: "متوفر",
      type: "N-Type TOPCon"
    },
    { 
      brand: "JA Solar",
      model: "DeepBlue 4.0",
      wattage: 580,
      pricePerWatt: 6.50,
      priceChange: 0.10,
      availability: "متوفر",
      type: "Mono PERC"
    },
    { 
      brand: "Trina Solar",
      model: "Vertex S+",
      wattage: 445,
      pricePerWatt: 7.00,
      priceChange: 0,
      availability: "محدود",
      type: "Mono PERC"
    },
    { 
      brand: "LONGi",
      model: "Hi-MO 6",
      wattage: 555,
      pricePerWatt: 7.20,
      priceChange: -0.05,
      availability: "متوفر",
      type: "HPBC"
    },
    { 
      brand: "Risen",
      model: "Titan",
      wattage: 400,
      pricePerWatt: 5.80,
      priceChange: 0.20,
      availability: "متوفر",
      type: "Poly"
    },
  ],
  inverters: [
    {
      brand: "Huawei",
      model: "SUN2000-5KTL-M1",
      power: "5kW",
      priceEGP: 35000,
      priceChange: -500,
      type: "String"
    },
    {
      brand: "Growatt",
      model: "MIN 6000TL-X",
      power: "6kW",
      priceEGP: 28000,
      priceChange: 0,
      type: "String"
    },
    {
      brand: "Sungrow",
      model: "SG5.0RS",
      power: "5kW",
      priceEGP: 32000,
      priceChange: 200,
      type: "String"
    },
    {
      brand: "Deye",
      model: "SUN-8K-SG04LP3",
      power: "8kW",
      priceEGP: 55000,
      priceChange: -1000,
      type: "Hybrid"
    },
  ],
  mounting: [
    {
      type: "Aluminum Rails",
      pricePerMeter: 180,
      priceChange: 5,
    },
    {
      type: "Clamps & Brackets",
      pricePerPanel: 120,
      priceChange: 0,
    },
    {
      type: "Ground Mount System",
      pricePerKW: 2500,
      priceChange: -100,
    },
  ],
  averages: {
    panelPricePerWatt: 6.66,
    inverterPricePerKW: 6200,
    mountingPricePerKW: 1800,
    totalSystemPricePerKW: 14500,
  }
};

const PriceChangeIndicator = ({ change }: { change: number }) => {
  if (change > 0) {
    return (
      <span className="flex items-center text-red-500 text-xs">
        <TrendingUp className="h-3 w-3 mr-1" />
        +{change.toFixed(2)}
      </span>
    );
  } else if (change < 0) {
    return (
      <span className="flex items-center text-green-500 text-xs">
        <TrendingDown className="h-3 w-3 mr-1" />
        {change.toFixed(2)}
      </span>
    );
  }
  return (
    <span className="flex items-center text-muted-foreground text-xs">
      <Minus className="h-3 w-3 mr-1" />
      ثابت
    </span>
  );
};

export function MarketPricesPanel() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data] = useState(simulatedMarketData);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="border-2 border-dashed border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            {isRTL ? "أسعار السوق المصري (محاكاة)" : "Egyptian Market Prices (Simulation)"}
          </CardTitle>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            {isRTL ? "عرض توضيحي" : "Demo"}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {isRTL ? "آخر تحديث:" : "Last updated:"} {formatDate(data.lastUpdated)}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Average Prices Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {isRTL ? "متوسط سعر الواط" : "Avg Panel ₱/W"}
            </div>
            <div className="text-lg font-bold text-primary">
              {data.averages.panelPricePerWatt.toFixed(2)} {isRTL ? "ج.م" : "EGP"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {isRTL ? "الانفرتر/kW" : "Inverter/kW"}
            </div>
            <div className="text-lg font-bold text-primary">
              {data.averages.inverterPricePerKW.toLocaleString()} {isRTL ? "ج.م" : "EGP"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {isRTL ? "الهيكل/kW" : "Mounting/kW"}
            </div>
            <div className="text-lg font-bold text-primary">
              {data.averages.mountingPricePerKW.toLocaleString()} {isRTL ? "ج.م" : "EGP"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {isRTL ? "إجمالي النظام/kW" : "Total System/kW"}
            </div>
            <div className="text-xl font-bold text-green-600">
              {data.averages.totalSystemPricePerKW.toLocaleString()} {isRTL ? "ج.م" : "EGP"}
            </div>
          </div>
        </div>

        {/* Panels Section */}
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            {isRTL ? "الألواح الشمسية" : "Solar Panels"}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-right">{isRTL ? "الماركة" : "Brand"}</th>
                  <th className="p-2 text-right">{isRTL ? "الموديل" : "Model"}</th>
                  <th className="p-2 text-center">{isRTL ? "الواط" : "Watt"}</th>
                  <th className="p-2 text-center">{isRTL ? "النوع" : "Type"}</th>
                  <th className="p-2 text-center">{isRTL ? "سعر الواط" : "₱/W"}</th>
                  <th className="p-2 text-center">{isRTL ? "التغير" : "Change"}</th>
                  <th className="p-2 text-center">{isRTL ? "التوفر" : "Stock"}</th>
                </tr>
              </thead>
              <tbody>
                {data.panels.map((panel, idx) => (
                  <tr key={idx} className="border-b border-muted/30 hover:bg-muted/20">
                    <td className="p-2 font-medium">{panel.brand}</td>
                    <td className="p-2 text-muted-foreground">{panel.model}</td>
                    <td className="p-2 text-center">{panel.wattage}W</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[10px]">{panel.type}</Badge>
                    </td>
                    <td className="p-2 text-center font-semibold">{panel.pricePerWatt.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <PriceChangeIndicator change={panel.priceChange} />
                    </td>
                    <td className="p-2 text-center">
                      <Badge 
                        variant={panel.availability === "متوفر" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {panel.availability}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inverters Section */}
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
            <Zap className="h-4 w-4 text-blue-500" />
            {isRTL ? "الانفرترات" : "Inverters"}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-right">{isRTL ? "الماركة" : "Brand"}</th>
                  <th className="p-2 text-right">{isRTL ? "الموديل" : "Model"}</th>
                  <th className="p-2 text-center">{isRTL ? "القدرة" : "Power"}</th>
                  <th className="p-2 text-center">{isRTL ? "النوع" : "Type"}</th>
                  <th className="p-2 text-center">{isRTL ? "السعر (ج.م)" : "Price (EGP)"}</th>
                  <th className="p-2 text-center">{isRTL ? "التغير" : "Change"}</th>
                </tr>
              </thead>
              <tbody>
                {data.inverters.map((inv, idx) => (
                  <tr key={idx} className="border-b border-muted/30 hover:bg-muted/20">
                    <td className="p-2 font-medium">{inv.brand}</td>
                    <td className="p-2 text-muted-foreground">{inv.model}</td>
                    <td className="p-2 text-center">{inv.power}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[10px]">{inv.type}</Badge>
                    </td>
                    <td className="p-2 text-center font-semibold">{inv.priceEGP.toLocaleString()}</td>
                    <td className="p-2 text-center">
                      <PriceChangeIndicator change={inv.priceChange} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mounting Section */}
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
            <Package className="h-4 w-4 text-gray-500" />
            {isRTL ? "الهياكل والتثبيت" : "Mounting & Structures"}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {data.mounting.map((item, idx) => (
              <div key={idx} className="p-2 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">{item.type}</div>
                <div className="font-semibold text-sm">
                  {'pricePerMeter' in item && `${item.pricePerMeter} ج.م/م`}
                  {'pricePerPanel' in item && `${item.pricePerPanel} ج.م/لوح`}
                  {'pricePerKW' in item && `${item.pricePerKW} ج.م/kW`}
                </div>
                <PriceChangeIndicator change={item.priceChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="pt-2 border-t border-muted">
          <div className="text-xs text-muted-foreground mb-2">
            {isRTL ? "مصادر البيانات:" : "Data Sources:"}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {source.name}
              </a>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-800 dark:text-amber-200">
          ⚠️ {isRTL 
            ? "هذه بيانات توضيحية للمحاكاة فقط وليست أسعار حقيقية. في الإصدار النهائي، سيتم سحب البيانات من مصادر موثوقة."
            : "This is simulation data only, not real prices. In the final version, data will be pulled from reliable sources."
          }
        </div>
      </CardContent>
    </Card>
  );
}
