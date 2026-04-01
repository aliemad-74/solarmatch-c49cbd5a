import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SolarMatchLogo from "./SolarMatchLogo";

const MESSAGES_EN = [
  "Analyzing solar potential…",
  "Calculating optimal system size…",
  "Estimating costs & savings…",
  "Finalizing AI recommendation…",
];

const MESSAGES_AR = [
  "جاري تحليل إمكانات الطاقة الشمسية…",
  "حساب الحجم الأمثل للنظام…",
  "تقدير التكاليف والتوفير…",
  "إعداد التوصية النهائية…",
];

const ResultsSkeleton = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const messages = isAr ? MESSAGES_AR : MESSAGES_EN;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Show first 3 messages for 3s each, then stay on the last one
    if (msgIndex < messages.length - 1) {
      const timer = setTimeout(() => {
        setMsgIndex((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [msgIndex, messages.length]);

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Spinning ring with logo */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer spinning ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "2.5s" }}
            viewBox="0 0 128 128"
          >
            <defs>
              <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="url(#loader-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="270 365"
            />
          </svg>

          {/* Static subtle track */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

          {/* Logo in center */}
          <div className="relative z-10 animate-pulse" style={{ animationDuration: "2s" }}>
            <SolarMatchLogo size={52} />
          </div>
        </div>

        {/* Rotating status message */}
        <p
          key={msgIndex}
          className="text-sm font-medium text-muted-foreground animate-fade-in"
        >
          {messages[msgIndex]}
        </p>

        {/* Subtle dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSkeleton;
