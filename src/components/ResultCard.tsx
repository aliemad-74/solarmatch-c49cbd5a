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
      className={`relative overflow-hidden rounded-lg border p-6 transition-all duration-200 hover:shadow-card-hover animate-slide-up ${
        highlight
          ? "bg-primary/[0.03] border-primary/20"
          : "bg-card border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              highlight ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
            }`}
          >
            {icon}
          </div>
        </div>

        <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
        <p className={`text-2xl md:text-3xl font-display font-bold mb-1 ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default ResultCard;
