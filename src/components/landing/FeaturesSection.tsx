import { LayoutDashboard, Bot, Link2 } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    label: "Piano Full",
    title: "Dashboard Personalizzabile",
    description:
      "Crea la tua plancia di comando. Scegli fino a 10 KPI (widget) che contano davvero per te, dai flussi di cassa ai dati di bilancio.",
  },
  {
    icon: Bot,
    label: "AI Powered",
    title: "Il CFO Virtuale",
    description:
      "Non guardare solo i dati, ascoltali. MioCFO ti invia notifiche proattive e suggerimenti su scadenze critiche, trend inaspettati o aree di miglioramento.",
  },
  {
    icon: Link2,
    label: "Analisi Integrata",
    title: "Connetti tutto in un unico posto",
    description:
      "Smetti di saltare da un portale all'altro. Collega conti correnti e fatturazione elettronica per un'analisi completa.",
    badges: ["Banche PSD2", "Cassetto Fiscale", "Fatture Elettroniche"],
  },
];

export function FeaturesSection() {
  return (
    <section id="funzionalita" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-medium text-primary mb-2">Funzionalità</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Progettato per chi guida l'azienda
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-background border border-border/40 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full">
                  {feature.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {feature.description}
              </p>
              {feature.badges && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {feature.badges.map((badge) => (
                    <span
                      key={badge}
                      className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
