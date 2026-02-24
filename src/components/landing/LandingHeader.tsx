import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import miocfoLogo from "@/assets/miocfo-logo.png";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={miocfoLogo} alt="mioCFO" className="h-8 md:h-9" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("funzionalita")}
            className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm"
          >
            Funzionalità
          </button>
          <button
            onClick={() => scrollToSection("come-funziona")}
            className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm"
          >
            Come Funziona
          </button>
          <button
            onClick={() => scrollToSection("contatti")}
            className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm"
          >
            Contatti
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Button asChild variant="ghost" className="text-sm font-normal border border-border hover:bg-muted">
            <Link to="/auth">Accedi</Link>
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
          <nav className="flex flex-col gap-3">
            <button
              onClick={() => scrollToSection("funzionalita")}
              className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm text-left py-2"
            >
              Funzionalità
            </button>
            <button
              onClick={() => scrollToSection("come-funziona")}
              className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm text-left py-2"
            >
              Come Funziona
            </button>
            <button
              onClick={() => scrollToSection("contatti")}
              className="text-muted-foreground hover:text-foreground transition-colors font-normal text-sm text-left py-2"
            >
              Contatti
            </button>
            <div className="pt-3 border-t border-border">
              <Button asChild variant="ghost" className="w-full text-sm font-normal border border-border">
                <Link to="/auth">Accedi</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
