import { Link } from "react-router-dom";
import { Linkedin, Twitter, Mail } from "lucide-react";
import miocfoLogo from "@/assets/miocfo-logo.png";

export function LandingFooter() {
  return (
    <footer id="contatti" className="bg-background border-t border-border pt-12 pb-8 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={miocfoLogo} alt="mioCFO" className="h-7 mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed">
              La piattaforma di gestione finanziaria intelligente per le PMI. 
              Monitora, analizza e ottimizza le finanze della tua azienda in tempo reale.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-muted-foreground" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Twitter className="h-4 w-4 text-muted-foreground" />
              </a>
              <a 
                href="mailto:info@miocfo.it" 
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Prodotto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#funzionalita" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Funzionalità
                </a>
              </li>
              <li>
                <a href="#come-funziona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Come Funziona
                </a>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Accedi
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Legale</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} mioCFO. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
