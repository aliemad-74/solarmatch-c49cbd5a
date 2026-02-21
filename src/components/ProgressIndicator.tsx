import { MapPin, Settings, BarChart3, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  hasLocation: boolean;
  hasConfigured: boolean;
  hasResults: boolean;
}

const ProgressIndicator = ({ hasLocation, hasConfigured, hasResults }: ProgressIndicatorProps) => {
  const { t } = useTranslation();

  const steps = [
    { key: "location", icon: MapPin, label: t("progress.location"), done: hasLocation },
    { key: "configure", icon: Settings, label: t("progress.configure"), done: hasConfigured },
    { key: "results", icon: BarChart3, label: t("progress.results"), done: hasResults },
  ];

  const activeIndex = hasResults ? 3 : hasConfigured ? 2 : hasLocation ? 1 : 0;

  return (
    <div className="w-full bg-card/60 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-6 py-2.5">
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-[11px] left-4 right-4 h-[2px] bg-border/50 rounded-full" />
            <div
              className="absolute top-[11px] left-4 h-[2px] bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `calc(${Math.min((activeIndex / (steps.length - 1)) * 100, 100)}% - 32px)` }}
            />

            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              const isDone = step.done;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 gap-1">
                  <div
                    className={cn(
                      "w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-500",
                      isDone
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : isActive
                          ? "bg-primary/15 border-[1.5px] border-primary text-primary"
                          : "bg-muted border border-border/60 text-muted-foreground/60"
                    )}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : <step.icon className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider transition-colors",
                      isDone ? "text-primary" : isActive ? "text-primary/80" : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
