import { 
  LayoutDashboard, 
  Landmark, 
  FileText, 
  TrendingUp, 
  PieChart, 
  Bell 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <section id="funzionalita" className="py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tutto ciò di cui hai bisogno per{" "}
            <span className="text-gradient">gestire le finanze</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Finexa integra tutti gli strumenti necessari per la gestione finanziaria 
            della tua PMI in un'unica piattaforma intuitiva.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group glass hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
