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
    <section id="come-funziona" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Inizia in <span className="text-gradient">3 semplici passi</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Configurare Finexa è veloce e intuitivo. In pochi minuti avrai 
            il controllo completo delle finanze della tua azienda.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

          {steps.map((step, index) => (
            <div 
              key={step.step} 
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step number with icon */}
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg glow">
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
