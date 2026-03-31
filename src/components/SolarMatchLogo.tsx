interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 40 }: SolarMatchLogoProps) => {
  const iconSize = size;
  const textScale = size / 40;

  const Icon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Background circle - deep navy */}
      <circle cx="24" cy="24" r="24" className="fill-primary" />
      
      {/* Sun rays - amber/gold */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 24 + 15 * Math.cos(rad);
        const y1 = 24 + 15 * Math.sin(rad);
        const x2 = 24 + 20 * Math.cos(rad);
        const y2 = 24 + 20 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {/* Central sun circle */}
      <circle cx="24" cy="20" r="7" className="fill-accent" />

      {/* Solar panel grid (3 panels) */}
      <g className="fill-primary-foreground" opacity="0.95">
        {/* Left panel */}
        <rect x="10" y="30" width="8" height="5" rx="0.5" />
        <line x1="14" y1="30" x2="14" y2="35" className="stroke-primary" strokeWidth="0.5" />
        <line x1="10" y1="32.5" x2="18" y2="32.5" className="stroke-primary" strokeWidth="0.5" />
        
        {/* Center panel */}
        <rect x="20" y="30" width="8" height="5" rx="0.5" />
        <line x1="24" y1="30" x2="24" y2="35" className="stroke-primary" strokeWidth="0.5" />
        <line x1="20" y1="32.5" x2="28" y2="32.5" className="stroke-primary" strokeWidth="0.5" />
        
        {/* Right panel */}
        <rect x="30" y="30" width="8" height="5" rx="0.5" />
        <line x1="34" y1="30" x2="34" y2="35" className="stroke-primary" strokeWidth="0.5" />
        <line x1="30" y1="32.5" x2="38" y2="32.5" className="stroke-primary" strokeWidth="0.5" />
      </g>

      {/* Connection line from sun to panels */}
      <line x1="24" y1="27" x2="24" y2="30" className="stroke-accent" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="28" x2="14" y2="30" className="stroke-accent" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="28" x2="34" y2="30" className="stroke-accent" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Icon />
      <div style={{ transform: `scale(${textScale})`, transformOrigin: "left center" }}>
        <span className="font-display font-bold text-[1.25rem] tracking-tight text-foreground leading-none">
          Solar<span className="text-accent">Match</span>
        </span>
        <p className="text-[0.6rem] text-muted-foreground -mt-0.5 tracking-wide uppercase font-medium">
          Solar Feasibility Platform
        </p>
      </div>
    </div>
  );
};

export default SolarMatchLogo;
