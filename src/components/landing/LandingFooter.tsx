import { Link } from "react-router-dom";
import miocfoLogo from "@/assets/miocfo-logo.png";

export function LandingFooter() {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/">
            <img src={miocfoLogo} alt="mioCFO" className="h-6" />
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <Link to="/contatti" className="hover:text-foreground transition-colors">
              Contatti
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            ©{new Date().getFullYear()} mioCFO. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
