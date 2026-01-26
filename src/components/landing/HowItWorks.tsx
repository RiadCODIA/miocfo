import { UserPlus, Link2, Eye } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Registrati in pochi secondi",
    description: "Crea il tuo account e accedi subito alla piattaforma.",
  },
  {
    icon: Link2,
    step: "02",
    title: "Collega i tuoi conti bancari",
    description: "Sincronizza in sicurezza i tuoi conti aziendali per importare automaticamente tutti i movimenti.",
  },
  {
    icon: Eye,
    step: "03",
    title: "Monitora tutto dalla dashboard",
    description: "Visualizza KPI, analizza i flussi di cassa e prendi decisioni informate con dati sempre aggiornati.",
  },
];

export function HowItWorks() {
  return (
    <section id="come-funziona" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Inizia in <span className="text-primary">3 semplici passi</span>
          </h2>
          <p className="text-base text-muted-foreground font-normal leading-relaxed">
            Configurare Finexa è veloce e intuitivo. In pochi minuti avrai 
            il controllo completo delle finanze della tua azienda.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-border" />

          {steps.map((step, index) => (
            <div 
              key={step.step} 
              className="relative text-center"
            >
              {/* Step circle with icon */}
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-lg font-medium text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground font-normal leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
