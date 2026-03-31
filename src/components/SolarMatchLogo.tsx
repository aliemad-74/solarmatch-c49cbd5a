import logoFull from "@/assets/logo.png";

interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  return (
    <img
      src={logoFull}
      alt="SolarMatch"
      className={className}
      style={{ height: size }}
    />
  );
};

export default SolarMatchLogo;
