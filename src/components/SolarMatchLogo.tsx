import logoFull from "@/assets/logo-full.png";
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
    <div className={className}>
      <img
        src={logoFull}
        alt="SolarMatch"
        style={{ height: size * 1.2 }}
        className="object-contain"
      />
    </div>
  );
};

export default SolarMatchLogo;
