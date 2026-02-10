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

  // Current active step
  const activeIndex = hasResults ? 3 : hasConfigured ? 2 : hasLocation ? 1 : 0;

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connection line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-10" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary mx-10 transition-all duration-700"
            style={{ width: `${Math.min((activeIndex / (steps.length - 1)) * 100, 100)}%` }}
          />

          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone = step.done;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/10 border-primary text-primary animate-pulse"
                        : "bg-card border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium transition-colors",
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
