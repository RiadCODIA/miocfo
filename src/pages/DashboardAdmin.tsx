import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle, Building, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Demo data for admin dashboard
const demoClients = [
  { id: "1", name: "Tech Solutions S.r.l.", status: "active", alerts: 2, lastActivity: "Oggi" },
  { id: "2", name: "Green Energy SpA", status: "active", alerts: 0, lastActivity: "Ieri" },
  { id: "3", name: "Fashion House S.r.l.", status: "warning", alerts: 5, lastActivity: "2 giorni fa" },
  { id: "4", name: "Food & Beverage Co.", status: "active", alerts: 1, lastActivity: "Oggi" },
];

const demoStats = {
  totalClients: 12,
  activeAlerts: 8,
  totalRevenue: 2450000,
  avgCashflow: 125000,
};

export default function DashboardAdmin() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-1">
            Panoramica generale dei tuoi clienti
          </p>
        </div>
        <Button onClick={() => navigate("/clienti")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clienti Totali
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{demoStats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 questo mese
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alert Attivi
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{demoStats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 priorità alta
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fatturato Aggregato
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              €{(demoStats.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% vs anno precedente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Flow Medio
            </CardTitle>
            <Building className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              €{(demoStats.avgCashflow / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Media mensile per cliente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clienti Recenti</CardTitle>
              <CardDescription>Attività recente dei tuoi clienti</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/clienti")} className="gap-1">
              Vedi tutti
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate("/clienti")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Ultima attività: {client.lastActivity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.alerts > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {client.alerts}
                      </Badge>
                    )}
                    <Badge
                      variant={client.status === "warning" ? "secondary" : "outline"}
                      className={client.status === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""}
                    >
                      {client.status === "active" ? "Attivo" : "Attenzione"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Alert Prioritari</CardTitle>
              <CardDescription>Situazioni che richiedono attenzione</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/alert")} className="gap-1">
              Vedi tutti
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Liquidità critica</p>
                    <p className="text-sm text-muted-foreground">
                      Fashion House S.r.l. - Cash flow negativo previsto
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">2 ore fa</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Scadenze imminenti</p>
                    <p className="text-sm text-muted-foreground">
                      Tech Solutions S.r.l. - 3 fatture in scadenza
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">5 ore fa</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Budget superato</p>
                    <p className="text-sm text-muted-foreground">
                      Food & Beverage Co. - Spese operative +15%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">1 giorno fa</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
