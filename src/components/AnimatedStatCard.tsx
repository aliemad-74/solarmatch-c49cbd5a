import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, DollarSign, Leaf } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/solarData";

interface AnimatedStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: "number" | "currency" | "percent";
  decimals?: number;
  color?: "primary" | "green" | "gold" | "teal";
  delay?: number;
}

const AnimatedStatCard = ({
  icon,
  title,
  value,
  suffix = "",
  prefix = "",
  format = "number",
  decimals = 0,
  color = "primary",
  delay = 0,
}: AnimatedStatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        // Easing function for smoother animation
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayValue(value * eased);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  const formatValue = () => {
    if (format === "currency") {
      return formatCurrency(displayValue);
    }
    if (format === "percent") {
      return `${formatNumber(displayValue, decimals)}%`;
    }
    return formatNumber(displayValue, decimals);
  };

  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    green: "text-solar-green bg-solar-green/10 border-solar-green/20",
    gold: "text-solar-gold bg-solar-gold/10 border-solar-gold/20",
    teal: "text-solar-teal bg-solar-teal/10 border-solar-teal/20",
  };

  const iconColorClasses = {
    primary: "text-primary",
    green: "text-solar-green",
    gold: "text-solar-gold",
    teal: "text-solar-teal",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`p-4 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <div className={iconColorClasses[color]}>{icon}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{title}</p>
              <motion.p
                key={displayValue}
                className="text-xl font-bold font-mono text-foreground"
              >
                {prefix}
                {formatValue()}
                {suffix}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedStatCard;
