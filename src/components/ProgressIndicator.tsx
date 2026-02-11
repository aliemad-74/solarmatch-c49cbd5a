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
    <div className="container mx-auto px-4 pt-2 pb-0">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connection line */}
          <div className="absolute top-3 left-0 right-0 h-px bg-border mx-8" />
          <div
            className="absolute top-3 left-0 h-px bg-primary mx-8 transition-all duration-700"
            style={{ width: `${Math.min((activeIndex / (steps.length - 1)) * 100, 100)}%` }}
          />

          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone = step.done;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium transition-colors",
                    isDone || isActive ? "text-primary" : "text-muted-foreground"
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
  );
};

export default ProgressIndicator;
