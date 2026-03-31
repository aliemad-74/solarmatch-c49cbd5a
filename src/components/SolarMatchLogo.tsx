import logoImg from "@/assets/logo.png";

interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  return (
    <div className={className}>
      <img
        src={logoImg}
        alt="SolarMatch"
        style={{ height: size, width: "auto" }}
        className="object-contain"
      />
    </div>
  );
};

export default SolarMatchLogo;
