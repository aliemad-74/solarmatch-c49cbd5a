import logoIcon from "@/assets/logo-icon.png";

interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  const iconEl = (
    <img
      src={logoIcon}
      alt="SolarMatch"
      style={{ height: size, width: size }}
      className="object-contain dark:brightness-[1.6] dark:contrast-[0.85]"
    />
  );

  if (variant === "icon") {
    return <div className={className}>{iconEl}</div>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconEl}
      <span className="font-display font-bold text-lg tracking-tight text-foreground">
        Solar<span className="text-secondary">Match</span>
      </span>
    </div>
  );
};

export default SolarMatchLogo;
