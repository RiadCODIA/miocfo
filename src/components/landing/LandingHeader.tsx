import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import miocfoLogo from "@/assets/miocfo-logo.png";

const navLinks = [
  { label: "Chi Siamo", to: "/#chi-siamo" },
  { label: "Piani", to: "/#piani" },
  { label: "FAQ", to: "/#faq" },
  { label: "Contatti", to: "/#contatti" },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={miocfoLogo} alt="mioCFO" className="h-8 md:h-9" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              onClick={(e) => {
                e.preventDefault();
                const id = link.to.replace("/#", "");
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`text-sm font-medium transition-colors text-muted-foreground hover:text-foreground`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" className="text-sm font-medium">
            <Link to="/auth">Accedi</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/auth?tab=register">Registrati</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border mt-2 mx-4 rounded-lg p-4 shadow-sm">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-medium py-2.5 px-3 rounded-md transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
              <Button asChild variant="ghost" className="w-full text-sm font-medium">
                <Link to="/auth">Accedi</Link>
              </Button>
              <Button asChild className="w-full rounded-full text-sm">
                <Link to="/auth?tab=register">Registrati</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
