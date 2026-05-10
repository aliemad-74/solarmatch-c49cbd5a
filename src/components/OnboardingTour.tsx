import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, MapPin, Settings, BarChart3, Download, ArrowRight, ArrowLeft, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const ONBOARDING_FLAG = "solarmatch_onboarding_seen";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string;
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

const PADDING = 8;

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const isRTL = i18n.language === "ar";
  const isMobile = useIsMobile();
  const rafRef = useRef<number | null>(null);

  const steps: TourStep[] = [
    {
      id: "welcome",
      title: t("onboarding.welcome.title"),
      description: t("onboarding.welcome.description"),
      icon: <div className="w-12 h-12 rounded-full gradient-solar flex items-center justify-center text-2xl">👋</div>,
    },
    {
      id: "location",
      title: t("onboarding.location.title"),
      description: t("onboarding.location.description"),
      icon: <MapPin className="w-10 h-10 text-primary" />,
      selector: "#map-section",
    },
    {
      id: "configure",
      title: t("onboarding.configure.title"),
      description: t("onboarding.configure.description"),
      icon: <Settings className="w-10 h-10 text-solar-gold" />,
      selector: "#config-section",
    },
    {
      id: "calculate",
      title: t("onboarding.calculate.title"),
      description: t("onboarding.calculate.description"),
      icon: <Zap className="w-10 h-10 text-primary" />,
      selector: "[data-tour='calculate']",
    },
    {
      id: "results",
      title: t("onboarding.results.title"),
      description: t("onboarding.results.description"),
      icon: <BarChart3 className="w-10 h-10 text-solar-green" />,
      selector: "#results",
    },
    {
      id: "report",
      title: t("onboarding.report.title"),
      description: t("onboarding.report.description"),
      icon: <Download className="w-10 h-10 text-primary" />,
      selector: "[data-tour='report']",
    },
    {
      id: "final",
      title: t("onboarding.final.title"),
      description: t("onboarding.final.description"),
      icon: <div className="w-12 h-12 rounded-full gradient-solar flex items-center justify-center"><Rocket className="w-6 h-6 text-primary-foreground" /></div>,
    },
  ];

  const step = steps[currentStep];

  // Mark body so we can hide overlapping UI (e.g. Google pac-container) via CSS
  useEffect(() => {
    document.body.setAttribute("data-tour-active", "true");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.removeAttribute("data-tour-active");
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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
      el.scrollIntoView({ behavior: "smooth", block: isMobile ? "start" : "center" });
      const t1 = window.setTimeout(recalc, 350);
      return () => window.clearTimeout(t1);
    }
    recalc();
  }, [step, recalc, isMobile]);

  useEffect(() => {
    const onChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recalc);
    };
    window.addEventListener("resize", onChange, { passive: true });
    window.addEventListener("scroll", onChange, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [recalc]);

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

  // Mobile → use bottom sheet. Desktop → smart positioning around target.
  let tooltipStyle: React.CSSProperties;
  if (isMobile) {
    tooltipStyle = {
      position: "fixed",
      left: 12,
      right: 12,
      bottom: 12,
      maxWidth: "none",
    };
  } else {
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const tooltipMaxW = 380;
    if (rect) {
      const placeBelow = rect.top + rect.height + 24 + 280 < viewportH;
      const top = placeBelow ? rect.top + rect.height + 16 : Math.max(16, rect.top - 16 - 280);
      const centerX = rect.left + rect.width / 2;
      const left = Math.min(Math.max(centerX - tooltipMaxW / 2, 16), viewportW - tooltipMaxW - 16);
      tooltipStyle = { position: "fixed", top, left, maxWidth: tooltipMaxW, width: "calc(100% - 2rem)" };
    } else {
      tooltipStyle = {
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)", maxWidth: tooltipMaxW, width: "calc(100% - 2rem)",
      };
    }
  }

  // Lightweight overlay using 4 divs around the target rect (no SVG mask, no blur).
  const renderOverlay = () => {
    if (!rect) {
      return <div className="fixed inset-0 bg-background/80" />;
    }
    const overlayClass = "fixed bg-background/80";
    return (
      <>
        <div className={overlayClass} style={{ top: 0, left: 0, right: 0, height: rect.top }} />
        <div className={overlayClass} style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
        <div className={overlayClass} style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} />
        <div className={overlayClass} style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[10001] animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      {renderOverlay()}

      {rect && (
        <div
          className="fixed pointer-events-none rounded-2xl ring-2 ring-primary/80"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 3px hsl(var(--primary) / 0.25)",
          }}
        />
      )}

      <div
        style={tooltipStyle}
        className={cn(
          "bg-card border border-border shadow-2xl p-5 animate-scale-in",
          isMobile ? "rounded-t-2xl rounded-b-xl" : "rounded-2xl"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleComplete}
          className="absolute top-2 end-2 h-8 w-8"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex justify-center gap-1.5 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex justify-center mb-2">{step.icon}</div>

        <h3 className="text-center text-base md:text-lg font-display font-bold text-foreground">
          {step.title}
        </h3>
        <p className="text-center text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {step.description}
        </p>

        <div className="flex gap-2 mt-4">
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
