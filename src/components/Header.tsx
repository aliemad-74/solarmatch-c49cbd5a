import { Sun } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-solar flex items-center justify-center shadow-glow">
            <Sun className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">SolarMatch</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Rooftop Solar Feasibility</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">How it Works</span>
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">About</span>
          <span className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">Get Started</span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
