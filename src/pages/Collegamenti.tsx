import { Link2, Building2, CreditCard, FileSpreadsheet, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    id: "banca",
    name: "Collegamento Bancario",
    description: "Collega i tuoi conti correnti per importare automaticamente le transazioni",
    icon: Building2,
    connected: false,
    category: "Banche",
  },
  {
    id: "fatturazione",
    name: "Software di Fatturazione",
    description: "Importa automaticamente le fatture dal tuo gestionale",
    icon: FileSpreadsheet,
    connected: false,
    category: "Contabilità",
  },
  {
    id: "pagamenti",
    name: "Gateway di Pagamento",
    description: "Collega Stripe, PayPal o altri sistemi di pagamento",
    icon: CreditCard,
    connected: false,
    category: "Pagamenti",
  },
];

export default function Collegamenti() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collegamenti</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci le integrazioni con banche, software contabili e servizi esterni
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <integration.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant={integration.connected ? "default" : "secondary"}>
                  {integration.connected ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Connesso</>
                  ) : (
                    <><Circle className="h-3 w-3 mr-1" /> Non connesso</>
                  )}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3">{integration.name}</CardTitle>
              <CardDescription className="text-sm">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant={integration.connected ? "outline" : "default"}>
                {integration.connected ? "Gestisci" : "Collega"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
