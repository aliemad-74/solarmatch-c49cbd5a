import logoImage from "@/assets/solarmatch-logo.png";

interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  // Icon variant: square crop of the mark only
  if (variant === "icon") {
    return (
      <img
        src={logoImage}
        alt="SolarMatch"
        className={`object-contain ${className}`}
        style={{ height: size, width: size, objectPosition: "left center" }}
      />
    );
  }

  // Full variant: logo + wordmark
  return (
    <img
      src={logoImage}
      alt="SolarMatch"
      className={`object-contain ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
};

export default SolarMatchLogo;
