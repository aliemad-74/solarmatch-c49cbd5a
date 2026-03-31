import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Sparkles, MapPin, Cpu, DollarSign, CheckCircle, BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEP_DURATION = 1250; // 5s / 4 steps

const ResultsSkeleton = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: MapPin, label: t("loading.step1") },
    { icon: Cpu, label: t("loading.step2") },
    { icon: DollarSign, label: t("loading.step3") },
    { icon: CheckCircle, label: t("loading.step4") },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, [steps.length]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Loading message with steps */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="relative">
              <BrainCircuit className="w-9 h-9 text-primary animate-pulse" />
              <Sparkles className="w-4 h-4 text-solar-gold absolute -top-1 -right-1 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            
            <p className="text-sm font-semibold text-primary">{t("loading.analyzing")}</p>
            <p className="text-xs text-muted-foreground -mt-2">{t("loading.subtitle")}</p>

            <div className="w-64">
              <Progress value={progress} className="h-2 mb-3" />
            </div>

            <div className="space-y-2">
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 transition-all duration-500 ${
                      isActive
                        ? "text-primary font-semibold scale-105"
                        : isDone
                          ? "text-primary/50 line-through"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    <StepIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-5">
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-6">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-32 mb-6" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSkeleton;
