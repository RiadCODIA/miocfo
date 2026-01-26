import { FileSpreadsheet, ArrowRight, LayoutDashboard } from "lucide-react";

export function ProblemSolutionSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Problem */}
          <div className="text-center p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-destructive/70" />
            <h3 className="text-xl font-bold text-foreground mb-3">Il Problema</h3>
            <p className="text-muted-foreground">
              Fogli Excel complicati, dati sparsi ovunque, ore perse a compilare report 
              e nessuna visione chiara delle finanze aziendali.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <ArrowRight className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Solution */}
          <div className="text-center p-8 rounded-2xl bg-success/5 border border-success/20">
            <LayoutDashboard className="h-16 w-16 mx-auto mb-4 text-success" />
            <h3 className="text-xl font-bold text-foreground mb-3">La Soluzione</h3>
            <p className="text-muted-foreground">
              Una piattaforma unificata che centralizza tutti i dati finanziari, 
              automatizza i report e ti dà il controllo totale in tempo reale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
