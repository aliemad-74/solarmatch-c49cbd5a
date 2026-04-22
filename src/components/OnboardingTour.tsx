import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, MapPin, Settings, BarChart3, Download, ArrowRight, ArrowLeft, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ONBOARDING_FLAG = "solarmatch_onboarding_seen";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** CSS selector to spotlight; if omitted, modal is centered. */
  selector?: string;
  /** Preferred placement of the tooltip relative to target. */
  placement?: "top" | "bottom" | "auto";
}

interface OnboardingTourProps {
  onComplete: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 12;

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const isRTL = i18n.language === "ar";

  const steps: TourStep[] = [
    {
      id: "welcome",
      title: t("onboarding.welcome.title"),
      description: t("onboarding.welcome.description"),
      icon: <div className="w-14 h-14 rounded-full gradient-solar flex items-center justify-center text-3xl">👋</div>,
    },
    {
      id: "location",
      title: t("onboarding.location.title"),
      description: t("onboarding.location.description"),
      icon: <MapPin className="w-12 h-12 text-primary" />,
      selector: "#map-section",
      placement: "bottom",
    },
    {
      id: "configure",
      title: t("onboarding.configure.title"),
      description: t("onboarding.configure.description"),
      icon: <Settings className="w-12 h-12 text-solar-gold" />,
      selector: "#config-section",
      placement: "top",
    },
    {
      id: "calculate",
      title: t("onboarding.calculate.title"),
      description: t("onboarding.calculate.description"),
      icon: <Zap className="w-12 h-12 text-primary" />,
      selector: "[data-tour='calculate']",
      placement: "top",
    },
    {
      id: "results",
      title: t("onboarding.results.title"),
      description: t("onboarding.results.description"),
      icon: <BarChart3 className="w-12 h-12 text-solar-green" />,
      selector: "#results",
      placement: "top",
    },
    {
      id: "report",
      title: t("onboarding.report.title"),
      description: t("onboarding.report.description"),
      icon: <Download className="w-12 h-12 text-primary" />,
      selector: "[data-tour='report']",
      placement: "top",
    },
    {
      id: "final",
      title: t("onboarding.final.title"),
      description: t("onboarding.final.description"),
      icon: <div className="w-14 h-14 rounded-full gradient-solar flex items-center justify-center"><Rocket className="w-7 h-7 text-primary-foreground" /></div>,
    },
  ];

  const step = steps[currentStep];

  // Compute spotlight rect; scroll target into view if needed.
  const recalc = useCallback(() => {
    if (!step?.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    });
  }, [step]);

  useLayoutEffect(() => {
    if (!step?.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Allow scroll to settle
      const t1 = window.setTimeout(recalc, 350);
      const t2 = window.setTimeout(recalc, 650);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    recalc();
  }, [step, recalc]);

  useEffect(() => {
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [recalc]);

  // Lock background scrolling/interaction
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleComplete();
  };
  const handlePrev = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const handleComplete = () => {
    try { localStorage.setItem(ONBOARDING_FLAG, "true"); } catch { /* ignore */ }
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  // Tooltip positioning
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const tooltipMaxW = 380;

  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: tooltipMaxW,
    width: "calc(100% - 2rem)",
  };

  if (rect) {
    const placeBelow = rect.top + rect.height + 24 + 280 < viewportH;
    const top = placeBelow ? rect.top + rect.height + 16 : Math.max(16, rect.top - 16 - 280);
    const centerX = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(centerX - tooltipMaxW / 2, 16),
      viewportW - tooltipMaxW - 16
    );
    tooltipStyle = {
      position: "fixed",
      top,
      left,
      maxWidth: tooltipMaxW,
      width: "calc(100% - 2rem)",
      transform: "none",
    };
  }

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      {/* Spotlight overlay using SVG mask for crisp cutout */}
      <svg className="fixed inset-0 w-full h-full pointer-events-auto" aria-hidden>
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={16}
                ry={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--background) / 0.78)"
          style={{ backdropFilter: "blur(2px)" } as React.CSSProperties}
          mask="url(#onboarding-spotlight-mask)"
        />
      </svg>

      {/* Glowing border around target */}
      {rect && (
        <div
          className="fixed pointer-events-none rounded-2xl ring-2 ring-primary/80 shadow-[0_0_0_4px_hsl(var(--primary)/0.25),0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className="bg-card border border-border rounded-2xl shadow-2xl p-6 animate-scale-in"
      >
        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleComplete}
          className="absolute top-2 end-2 h-8 w-8"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex justify-center mb-3">{step.icon}</div>

        <h3 className="text-center text-lg md:text-xl font-display font-bold text-foreground">
          {step.title}
        </h3>
        <p className="text-center text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
          {step.description}
        </p>

        <div className="flex gap-2 mt-5">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev} className="flex-1" size="sm">
              {isRTL ? <ArrowRight className="me-1.5 h-4 w-4" /> : <ArrowLeft className="me-1.5 h-4 w-4" />}
              {t("onboarding.prev")}
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 gradient-solar text-primary-foreground border-0"
            size="sm"
          >
            {currentStep === steps.length - 1 ? t("onboarding.start") : t("onboarding.next")}
            {currentStep < steps.length - 1 &&
              (isRTL ? <ArrowLeft className="ms-1.5 h-4 w-4" /> : <ArrowRight className="ms-1.5 h-4 w-4" />)}
          </Button>
        </div>

        {currentStep < steps.length - 1 && (
          <button
            onClick={handleComplete}
            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("onboarding.skip")}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingTour;
