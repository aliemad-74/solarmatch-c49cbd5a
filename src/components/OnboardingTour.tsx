import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, MapPin, Settings, BarChart3, Download, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const isRTL = i18n.language === "ar";

  const steps: TourStep[] = [
    {
      id: "welcome",
      title: t("onboarding.welcome.title"),
      description: t("onboarding.welcome.description"),
      icon: <div className="w-12 h-12 rounded-full gradient-solar flex items-center justify-center text-2xl">☀️</div>,
    },
    {
      id: "location",
      title: t("onboarding.location.title"),
      description: t("onboarding.location.description"),
      icon: <MapPin className="w-12 h-12 text-primary" />,
      target: "map-section",
    },
    {
      id: "configure",
      title: t("onboarding.configure.title"),
      description: t("onboarding.configure.description"),
      icon: <Settings className="w-12 h-12 text-solar-gold" />,
      target: "input-section",
    },
    {
      id: "results",
      title: t("onboarding.results.title"),
      description: t("onboarding.results.description"),
      icon: <BarChart3 className="w-12 h-12 text-solar-green" />,
    },
    {
      id: "report",
      title: t("onboarding.report.title"),
      description: t("onboarding.report.description"),
      icon: <Download className="w-12 h-12 text-primary" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("solarmatch_onboarding_completed", "true");
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("solarmatch_onboarding_completed", "true");
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2 border-primary/20">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute top-2 end-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          <div className="flex justify-center mb-4">
            {step.icon}
          </div>

          <CardTitle className="text-center text-xl">{step.title}</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                {isRTL ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
                {t("onboarding.prev")}
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex-1 gradient-solar text-white border-0"
            >
              {currentStep === steps.length - 1
                ? t("onboarding.start")
                : t("onboarding.next")}
              {currentStep < steps.length - 1 && (
                isRTL ? <ArrowLeft className="ms-2 h-4 w-4" /> : <ArrowRight className="ms-2 h-4 w-4" />
              )}
            </Button>
          </div>

          {currentStep === 0 && (
            <Button
              variant="link"
              onClick={handleSkip}
              className="w-full mt-3 text-muted-foreground"
            >
              {t("onboarding.skip")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingTour;
