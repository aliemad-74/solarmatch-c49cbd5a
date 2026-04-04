import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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

const SolarBotAnimation = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Sun rays rotating behind */}
    <g className="origin-center" style={{ animation: "spin 8s linear infinite", transformOrigin: "60px 52px" }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="60"
          y1="20"
          x2="60"
          y2="12"
          stroke="hsl(var(--secondary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
          transform={`rotate(${deg} 60 52)`}
        />
      ))}
    </g>

    {/* Sun body (head) */}
    <circle cx="60" cy="52" r="22" fill="hsl(var(--secondary))" opacity="0.15" />
    <circle cx="60" cy="52" r="18" fill="hsl(var(--secondary))" opacity="0.25" />

    {/* Face circle */}
    <circle cx="60" cy="52" r="16" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />

    {/* Eyes - blinking */}
    <g style={{ animation: "blink 3s ease-in-out infinite" }}>
      <circle cx="53" cy="50" r="2.5" fill="hsl(var(--primary))" />
      <circle cx="67" cy="50" r="2.5" fill="hsl(var(--primary))" />
      {/* Eye shine */}
      <circle cx="54" cy="49" r="0.8" fill="white" />
      <circle cx="68" cy="49" r="0.8" fill="white" />
    </g>

    {/* Smile */}
    <path
      d="M54 56 Q60 62 66 56"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Solar panel "antenna" on head */}
    <rect x="55" y="30" width="10" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.8" />
    <line x1="60" y1="36" x2="60" y2="38" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    {/* Panel grid lines */}
    <line x1="58" y1="30" x2="58" y2="36" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.6" />
    <line x1="62" y1="30" x2="62" y2="36" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.6" />
    <line x1="55" y1="33" x2="65" y2="33" stroke="hsl(var(--card))" strokeWidth="0.5" opacity="0.6" />

    {/* Left arm - waving */}
    <g style={{ animation: "wave 1.5s ease-in-out infinite", transformOrigin: "42px 60px" }}>
      <line x1="42" y1="60" x2="30" y2="50" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      {/* Magnifying glass */}
      <circle cx="26" cy="46" r="5" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="30" y1="50" x2="32" y2="52" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lens glint */}
      <path d="M24 44 Q26 43 27 44" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.7" opacity="0.5" />
    </g>

    {/* Right arm - holding chart */}
    <g style={{ animation: "wave 1.5s ease-in-out infinite 0.4s", transformOrigin: "78px 60px" }}>
      <line x1="78" y1="60" x2="90" y2="52" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      {/* Mini chart */}
      <rect x="86" y="42" width="12" height="10" rx="1.5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1" />
      <rect x="88" y="48" width="2" height="3" fill="hsl(var(--secondary))" rx="0.5" />
      <rect x="91" y="46" width="2" height="5" fill="hsl(var(--primary))" rx="0.5" />
      <rect x="94" y="44" width="2" height="7" fill="hsl(var(--secondary))" rx="0.5" />
    </g>

    {/* Body */}
    <rect x="50" y="68" width="20" height="14" rx="4" fill="hsl(var(--primary))" opacity="0.15" stroke="hsl(var(--primary))" strokeWidth="1.5" />

    {/* Solar panel on body */}
    <rect x="53" y="70" width="14" height="10" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
    <line x1="57" y1="70" x2="57" y2="80" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />
    <line x1="60" y1="70" x2="60" y2="80" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />
    <line x1="63" y1="70" x2="63" y2="80" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />
    <line x1="53" y1="73" x2="67" y2="73" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />
    <line x1="53" y1="77" x2="67" y2="77" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />

    {/* Feet - bobbing */}
    <g style={{ animation: "bob 1s ease-in-out infinite" }}>
      <rect x="52" y="83" width="6" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.6" />
      <rect x="62" y="83" width="6" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.6" />
    </g>

    {/* Floating particles */}
    <circle cx="25" cy="30" r="1.5" fill="hsl(var(--secondary))" opacity="0.4" style={{ animation: "float 3s ease-in-out infinite" }} />
    <circle cx="95" cy="35" r="1" fill="hsl(var(--secondary))" opacity="0.3" style={{ animation: "float 3s ease-in-out infinite 1s" }} />
    <circle cx="35" cy="85" r="1.2" fill="hsl(var(--primary))" opacity="0.3" style={{ animation: "float 3s ease-in-out infinite 0.5s" }} />
    <circle cx="88" cy="80" r="1" fill="hsl(var(--primary))" opacity="0.25" style={{ animation: "float 3s ease-in-out infinite 1.5s" }} />

    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes blink {
        0%, 90%, 100% { opacity: 1; }
        95% { opacity: 0; }
      }
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(-8deg); }
      }
      @keyframes bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(2px); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); opacity: 0.3; }
        50% { transform: translateY(-6px); opacity: 0.6; }
      }
    `}</style>
  </svg>
);

const ResultsSkeleton = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const messages = isAr ? MESSAGES_AR : MESSAGES_EN;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
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
        {/* Animated solar bot with spinning ring */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer spinning ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "2.5s" }}
            viewBox="0 0 144 144"
          >
            <defs>
              <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="72"
              cy="72"
              r="68"
              fill="none"
              stroke="url(#loader-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="310 428"
            />
          </svg>

          {/* Static subtle track */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

          {/* Solar bot in center */}
          <div className="relative z-10 w-24 h-24">
            <SolarBotAnimation />
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
