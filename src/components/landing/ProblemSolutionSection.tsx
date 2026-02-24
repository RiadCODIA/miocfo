import { FileSpreadsheet, EyeOff, Unplug, HelpCircle, Link2, BarChart3, LayoutDashboard, TrendingUp } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "File Excel infiniti",
    description: "Ore perse ogni settimana per calcoli complessi.",
  },
  {
    icon: EyeOff,
    title: "Sorprese sul conto",
    description: "Scarsa visibilità sulla liquidità futura, con il rischio di scoprirlo troppo tardi.",
  },
  {
    icon: Unplug,
    title: "Dati scollegati",
    description: "Fatture, banche e bilanci parlano lingue diverse. Impossibile avere una visione d'insieme.",
  },
  {
    icon: HelpCircle,
    title: "Decisioni a sensazione",
    description: "Prendere decisioni strategiche basandosi sull'intuito invece che su dati certi.",
  },
];

const solutionSteps = [
  {
    icon: Link2,
    title: "Collega le tue fonti",
    description: "Connetti in sicurezza le tue banche (PSD2) e il tuo Cassetto Fiscale. MioCFO fa il resto.",
  },
  {
    icon: LayoutDashboard,
    title: "Accedi a una dashboard unificata",
    description: "Guarda entrate, uscite, saldi aggregati. Tutto in un unico posto.",
  },
  {
    icon: BarChart3,
    title: "Visualizza la tua liquidità",
    description: "Monitora i flussi di cassa in tempo reale e identifica trend prima che diventino problemi.",
  },
  {
    icon: TrendingUp,
    title: "Anticipa il futuro",
    description: "Grazie all'AI, incrociamo le scadenze delle fatture con i costi ricorrenti per mostrarti la previsione di cassa.",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Problems */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-2">I problemi di oggi</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stanco di navigare a vista?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="text-center p-6 rounded-2xl bg-destructive/5 border border-destructive/10 transition-all duration-300 hover:shadow-md"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-destructive/10 flex items-center justify-center">
                <problem.icon className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>

        {/* Solution */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-2">La soluzione</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            MioCFO è il tuo co-pilota
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutionSteps.map((step, index) => (
            <div
              key={step.title}
              className="relative text-center p-6 rounded-2xl bg-primary/5 border border-primary/10 transition-all duration-300 hover:shadow-md"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <div className="w-14 h-14 mx-auto mb-4 mt-2 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
