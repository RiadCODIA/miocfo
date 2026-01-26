import { FileSpreadsheet, ArrowRight, ArrowDown, LayoutDashboard } from "lucide-react";

export function ProblemSolutionSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-center">
          {/* Problem Card */}
          <div className="text-center p-10 md:p-12 rounded-3xl bg-red-50 border border-red-100 shadow-lg shadow-red-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-100/60 hover:scale-[1.02]">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
              <FileSpreadsheet className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Il Problema</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Fogli Excel complicati, dati sparsi ovunque, ore perse a compilare report 
              e nessuna visione chiara delle finanze aziendali.
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <ArrowRight className="h-8 w-8 text-primary-foreground hidden md:block" />
              <ArrowDown className="h-8 w-8 text-primary-foreground md:hidden" />
            </div>
          </div>

          {/* Solution Card */}
          <div className="text-center p-10 md:p-12 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-lg shadow-emerald-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/60 hover:scale-[1.02]">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <LayoutDashboard className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">La Soluzione</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Una piattaforma unificata che centralizza tutti i dati finanziari, 
              automatizza i report e ti dà il controllo totale in tempo reale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
