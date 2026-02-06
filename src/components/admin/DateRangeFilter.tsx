import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangeFilter = ({ dateRange, onDateRangeChange }: DateRangeFilterProps) => {
  const { t, i18n } = useTranslation();
  const [preset, setPreset] = useState<string>("all");
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();
    
    switch (value) {
      case "today":
        onDateRangeChange({
          from: startOfDay(today),
          to: endOfDay(today),
        });
        break;
      case "7days":
        onDateRangeChange({
          from: startOfDay(subDays(today, 7)),
          to: endOfDay(today),
        });
        break;
      case "30days":
        onDateRangeChange({
          from: startOfDay(subDays(today, 30)),
          to: endOfDay(today),
        });
        break;
      case "90days":
        onDateRangeChange({
          from: startOfDay(subDays(today, 90)),
          to: endOfDay(today),
        });
        break;
      case "all":
      default:
        onDateRangeChange({
          from: undefined,
          to: undefined,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("admin.dateFilter.preset")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.dateFilter.allTime")}</SelectItem>
          <SelectItem value="today">{t("admin.dateFilter.today")}</SelectItem>
          <SelectItem value="7days">{t("admin.dateFilter.last7Days")}</SelectItem>
          <SelectItem value="30days">{t("admin.dateFilter.last30Days")}</SelectItem>
          <SelectItem value="90days">{t("admin.dateFilter.last90Days")}</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "PP", { locale: dateLocale })} -{" "}
                  {format(dateRange.to, "PP", { locale: dateLocale })}
                </>
              ) : (
                format(dateRange.from, "PP", { locale: dateLocale })
              )
            ) : (
              t("admin.dateFilter.pickDate")
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              setPreset("custom");
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              });
            }}
            numberOfMonths={2}
            locale={dateLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeFilter;
