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
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* House outline - bottom and sides */}
      <path
        d="M8 38V20L24 8L40 20V38H8Z"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Chart/zigzag line inside the house */}
      <polyline
        points="8,32 16,26 22,34 32,18 40,20"
        className="stroke-foreground"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Sun circle at top of roof line */}
      <circle cx="36" cy="14" r="4" className="fill-secondary" />
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
