interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  const Icon = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Rooftop outline - abstract house/building shape */}
      <path
        d="M4 20L18 8L32 20"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Solar panel grid on the roof surface */}
      <rect x="10" y="16" width="16" height="10" rx="1.5" className="fill-primary" opacity="0.08" />

      {/* Panel row 1 */}
      <rect x="11" y="17" width="4.5" height="3.5" rx="0.75" className="fill-primary" opacity="0.15" />
      <rect x="16.75" y="17" width="4.5" height="3.5" rx="0.75" className="fill-primary" opacity="0.15" />
      <rect x="22.5" y="17" width="4.5" height="3.5" rx="0.75" className="fill-secondary" />

      {/* Panel row 2 */}
      <rect x="11" y="21.5" width="4.5" height="3.5" rx="0.75" className="fill-primary" opacity="0.15" />
      <rect x="16.75" y="21.5" width="4.5" height="3.5" rx="0.75" className="fill-secondary" />
      <rect x="22.5" y="21.5" width="4.5" height="3.5" rx="0.75" className="fill-primary" opacity="0.15" />

      {/* Partial sun - top right, rising behind the rooftop */}
      <circle cx="29" cy="10" r="4" className="fill-secondary" opacity="0.9" />
      {/* Sun rays */}
      <line x1="29" y1="4" x2="29" y2="2.5" className="stroke-secondary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="6" x2="34" y2="5" className="stroke-secondary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="10" x2="36" y2="10" className="stroke-secondary" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="25" y1="6" x2="24" y2="5" className="stroke-secondary" strokeWidth="1.5" strokeLinecap="round" />
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
      <div className="leading-tight">
        <span className="font-display font-bold text-lg tracking-tight text-foreground">
          Solar<span className="text-secondary">Match</span>
        </span>
      </div>
    </div>
  );
};

export default SolarMatchLogo;
