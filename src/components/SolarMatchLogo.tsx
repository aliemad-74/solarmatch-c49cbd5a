import logoIcon from "@/assets/logo-icon.png";

interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  if (variant === "icon") {
    return (
      <div className={className}>
        <img
          src={logoIcon}
          alt="SolarMatch"
          style={{ height: size, width: size }}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoIcon}
        alt="SolarMatch"
        style={{ height: size * 1.3, width: size * 1.3 }}
        className="object-contain"
      />
      <span className="font-display font-bold text-lg tracking-tight text-foreground">
        Solar<span className="text-secondary">Match</span>
      </span>
    </div>
  );
};

export default SolarMatchLogo;
