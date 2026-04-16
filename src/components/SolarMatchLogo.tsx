interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  return (
    <span
      className={`font-display font-bold text-primary ${className}`}
      style={{ fontSize: size * 0.22 }}
    >
      Solar<span className="text-secondary">Match</span>
    </span>
  );
};

export default SolarMatchLogo;