import { MapPin, Settings, BarChart3, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ProgressIndicatorProps {
  hasLocation: boolean;
  hasConfigured: boolean;
  hasResults: boolean;
}

const sectionIds = ["map-section", "config-section", "results"];

const ProgressIndicator = ({ hasLocation, hasConfigured, hasResults }: ProgressIndicatorProps) => {
  const { t } = useTranslation();
  const prevActiveRef = useRef(0);
  const hasMountedRef = useRef(false);

  const steps = [
    { key: "location", icon: MapPin, label: t("progress.location"), done: hasLocation },
    { key: "configure", icon: Settings, label: t("progress.configure"), done: hasConfigured },
    { key: "results", icon: BarChart3, label: t("progress.results"), done: hasResults },
  ];

  const activeIndex = hasResults ? 3 : hasConfigured ? 2 : hasLocation ? 1 : 0;

  // Auto-scroll to the next section when a step completes (skip initial mount)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevActiveRef.current = activeIndex;
      return;
    }
    if (activeIndex > prevActiveRef.current && activeIndex <= sectionIds.length) {
      const targetId = sectionIds[Math.min(activeIndex, sectionIds.length - 1)];
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
    prevActiveRef.current = activeIndex;
  }, [activeIndex]);

  const handleStepClick = (index: number) => {
    const el = document.getElementById(sectionIds[index]);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const progressPercent = Math.min((activeIndex / (steps.length - 1)) * 100, 100);

  return (
    <div className="w-full bg-card/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-6 py-2">
        <div className="max-w-[280px] mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute top-[11px] left-5 right-5 h-[2px] bg-border/40 rounded-full" />
            {/* Animated progress line */}
            <motion.div
              className="absolute top-[11px] left-5 h-[2px] bg-primary rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progressPercent / 100 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: "calc(100% - 40px)" }}
            />

            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              const isDone = step.done;

              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(index)}
                  className="flex flex-col items-center relative z-10 gap-1 cursor-pointer group bg-transparent border-none p-0"
                >
                  <motion.div
                    className={cn(
                      "w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors duration-300",
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary/15 border-[1.5px] border-primary text-primary"
                          : "bg-muted border border-border/60 text-muted-foreground/50 group-hover:border-primary/40 group-hover:text-muted-foreground"
                    )}
                    animate={
                      isDone
                        ? { scale: [1, 1.25, 1], boxShadow: "0 0 12px hsl(var(--primary) / 0.4)" }
                        : isActive
                          ? { scale: [1, 1.1, 1] }
                          : { scale: 1, boxShadow: "none" }
                    }
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <AnimatePresence mode="wait">
                      {isDone ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-3 h-3" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <step.icon className="w-2.5 h-2.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300",
                      isDone ? "text-primary" : isActive ? "text-primary/80" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
