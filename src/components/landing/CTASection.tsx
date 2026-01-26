import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-primary">
          <div className="relative z-10 text-center py-12 px-6 md:py-16 md:px-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-primary-foreground mb-4 max-w-2xl mx-auto">
              Pronto a trasformare la gestione finanziaria della tua azienda?
            </h2>

            <p className="text-base text-primary-foreground/80 mb-8 max-w-lg mx-auto font-normal">
              Unisciti a centinaia di PMI che hanno già scelto Finexa per 
              semplificare e ottimizzare le proprie finanze.
            </p>

            <Button
              size="lg"
              asChild
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-6"
            >
              <Link to="/auth">
                Inizia Ora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
