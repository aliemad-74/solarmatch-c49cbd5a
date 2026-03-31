interface SolarMatchLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

const SolarMatchLogo = ({ variant = "full", className = "", size = 36 }: SolarMatchLogoProps) => {
  return (
    <div className={className}>
      <span className="font-display font-bold text-lg tracking-tight text-foreground">
        Solar<span className="text-secondary">Match</span>
      </span>
    </div>
  );
};

export default SolarMatchLogo;
