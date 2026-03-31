interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 40 }: SolarMatchLogoProps) => {
  const iconSize = size;

  const Icon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" className="fill-accent" />
      
      {/* Sun - upper half */}
      <circle cx="20" cy="14" r="6" className="fill-primary" />
      
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 20 + 8 * Math.cos(rad);
        const y1 = 14 + 8 * Math.sin(rad);
        const x2 = 20 + 11 * Math.cos(rad);
        const y2 = 14 + 11 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-primary"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}

      {/* Three solar panels - bottom */}
      <rect x="6" y="26" width="8" height="9" rx="1" className="fill-primary" />
      <rect x="16" y="26" width="8" height="9" rx="1" className="fill-primary" />
      <rect x="26" y="26" width="8" height="9" rx="1" className="fill-primary" />
      
      {/* Panel grid lines */}
      <line x1="10" y1="26" x2="10" y2="35" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="6" y1="30.5" x2="14" y2="30.5" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="20" y1="26" x2="20" y2="35" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="16" y1="30.5" x2="24" y2="30.5" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="30" y1="26" x2="30" y2="35" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="26" y1="30.5" x2="34" y2="30.5" stroke="hsl(36, 82%, 56%)" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={className}>
        <Icon />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Icon />
      <div>
        <span className="font-display font-extrabold text-xl tracking-tight text-foreground leading-none block">
          Solar<span className="text-accent">Match</span>
        </span>
        <p className="text-[0.65rem] text-muted-foreground tracking-widest uppercase font-medium mt-0.5">
          Solar Feasibility Platform
        </p>
      </div>
    </div>
  );
};

export default SolarMatchLogo;
