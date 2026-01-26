import { Link } from "react-router-dom";
import { Linkedin, Twitter, Mail } from "lucide-react";
import finexaLogo from "@/assets/finexa-logo.png";

export function LandingFooter() {
  return (
    <footer id="contatti" className="bg-muted/50 pt-16 pb-8 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={finexaLogo} alt="Finexa" className="h-8 mb-4" />
            <p className="text-muted-foreground max-w-sm mb-4">
              La piattaforma di gestione finanziaria intelligente per le PMI. 
              Monitora, analizza e ottimizza le finanze della tua azienda in tempo reale.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="mailto:info@finexa.it" 
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Prodotto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#funzionalita" className="text-muted-foreground hover:text-primary transition-colors">
                  Funzionalità
                </a>
              </li>
              <li>
                <a href="#come-funziona" className="text-muted-foreground hover:text-primary transition-colors">
                  Come Funziona
                </a>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Accedi
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legale</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Finexa. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
