import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import finexaLogo from "@/assets/finexa-logo.png";

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
          ? "glass shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/landing" className="flex items-center">
          <img src={finexaLogo} alt="Finexa" className="h-8 md:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("funzionalita")}
            className="text-foreground/80 hover:text-primary transition-colors font-medium"
          >
            Funzionalità
          </button>
          <button
            onClick={() => scrollToSection("come-funziona")}
            className="text-foreground/80 hover:text-primary transition-colors font-medium"
          >
            Come Funziona
          </button>
          <button
            onClick={() => scrollToSection("contatti")}
            className="text-foreground/80 hover:text-primary transition-colors font-medium"
          >
            Contatti
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Button asChild variant="outline" className="border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all">
            <Link to="/auth">Accedi</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass mt-2 mx-4 rounded-lg p-4 animate-fade-in">
          <nav className="flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("funzionalita")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium text-left"
            >
              Funzionalità
            </button>
            <button
              onClick={() => scrollToSection("come-funziona")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium text-left"
            >
              Come Funziona
            </button>
            <button
              onClick={() => scrollToSection("contatti")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium text-left"
            >
              Contatti
            </button>
            <div className="pt-4 border-t border-border">
              <Button asChild className="w-full">
                <Link to="/auth">Accedi</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
