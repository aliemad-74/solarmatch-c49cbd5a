import { ReactNode } from "react";

interface ResultCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  highlight?: boolean;
  delay?: number;
}

const ResultCard = ({ icon, title, value, subtitle, highlight = false, delay = 0 }: ResultCardProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover animate-slide-up ${
        highlight
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-glow"
          : "bg-card border-border/50 shadow-card"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background decoration for highlighted cards */}
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              highlight ? "gradient-solar text-primary-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            {icon}
          </div>
        </div>

        <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
        <p className={`text-2xl md:text-3xl font-bold mb-1 ${highlight ? "text-gradient-solar" : "text-foreground"}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default ResultCard;
