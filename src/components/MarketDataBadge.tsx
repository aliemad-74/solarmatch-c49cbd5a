import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketDataBadgeProps {
  isLive: boolean;
  scrapedAt: string | null;
  type: "prices" | "tariffs";
}

export function MarketDataBadge({ isLive, scrapedAt, type }: MarketDataBadgeProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const label = isLive
    ? (isAr ? "أسعار محدّثة" : "Live Prices")
    : (isAr ? "أسعار تقديرية" : "Estimated");

  const tooltip = scrapedAt
    ? `${isAr ? "آخر تحديث:" : "Last updated:"} ${new Date(scrapedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}`
    : (isAr ? "بيانات افتراضية" : "Default data");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant={isLive ? "default" : "secondary"}
            className={`text-xs gap-1 ${isLive ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
