import { 
  LayoutDashboard, 
  Landmark, 
  FileText, 
  TrendingUp, 
  PieChart, 
  Bell 
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard KPI in Tempo Reale",
    description: "Visualizza tutti gli indicatori chiave della tua azienda in un'unica schermata aggiornata automaticamente.",
  },
  {
    icon: Landmark,
    title: "Collegamento Conti Bancari",
    description: "Sincronizza i tuoi conti correnti aziendali tramite Enable Banking per avere i movimenti sempre aggiornati.",
  },
  {
    icon: FileText,
    title: "Gestione Fatture Automatica",
    description: "Carica le fatture e lascia che l'AI le elabori automaticamente, abbinandole alle transazioni bancarie.",
  },
  {
    icon: TrendingUp,
    title: "Flussi di Cassa e Previsioni",
    description: "Analizza i flussi di cassa passati e prevedi quelli futuri per pianificare al meglio la liquidità.",
  },
  {
    icon: PieChart,
    title: "Analisi Marginalità",
    description: "Scopri quali prodotti e servizi generano più profitto con analisi dettagliate dei margini.",
  },
  {
    icon: Bell,
    title: "Alert e Notifiche",
    description: "Ricevi avvisi automatici su scadenze, anomalie nei flussi e situazioni critiche da monitorare.",
  },
];

export function FeaturesSection() {
  return (
    <section id="funzionalita" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Tutto ciò di cui hai bisogno per{" "}
            <span className="text-primary">gestire le finanze</span>
          </h2>
          <p className="text-base text-muted-foreground font-normal leading-relaxed">
            Finexa integra tutti gli strumenti necessari per la gestione finanziaria 
            della tua PMI in un'unica piattaforma intuitiva.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="bg-background border border-border/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
