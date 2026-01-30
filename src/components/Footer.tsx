import { Sun } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-solar flex items-center justify-center">
              <Sun className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">SolarMatch</p>
              <p className="text-xs text-muted-foreground">Student Innovation Project 2025</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Demonstrating rooftop solar feasibility analysis for Egypt
            </p>
            <p className="text-xs text-muted-foreground">
              Data is simulated for demonstration purposes only
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2025 SolarMatch. Built for the Innovation Competition.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
