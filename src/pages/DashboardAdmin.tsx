import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle, Building, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanies } from "@/hooks/useCompanies";
import { useAlerts } from "@/hooks/useAlerts";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

  const isLoading = companiesLoading || alertsLoading;

  // Calculate stats
  const totalClients = companies?.length || 0;
  const activeAlerts = alerts?.filter(a => !a.isRead).length || 0;
  const highPriorityAlerts = alerts?.filter(a => a.severity === 'error' && !a.isRead).length || 0;
  const totalRevenue = 0; // Companies table doesn't have revenue field
  const avgCashflow = 0; // Companies table doesn't have cashflow field

  // Get recent companies (last 4)
  const recentClients = companies?.slice(0, 4) || [];
  
  // Get recent active alerts
  const recentAlerts = alerts?.filter(a => !a.isRead).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

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
            <div className="text-3xl font-bold text-foreground">{totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalClients > 0 ? "Clienti gestiti" : "Nessun cliente ancora"}
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
            <div className="text-3xl font-bold text-foreground">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {highPriorityAlerts > 0 ? `${highPriorityAlerts} priorità alta` : "Nessun alert prioritario"}
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
              {totalRevenue >= 1000000 
                ? `€${(totalRevenue / 1000000).toFixed(1)}M` 
                : `€${(totalRevenue / 1000).toFixed(0)}K`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ricavi totali clienti
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
              €{(avgCashflow / 1000).toFixed(0)}K
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
            {recentClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun cliente ancora</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/clienti")}>
                  Aggiungi il primo cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClients.map((client) => (
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
                          Aggiunto: {new Date(client.created_at).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.is_active ? "outline" : "secondary"}>
                        {client.is_active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun alert attivo</p>
                <p className="text-sm mt-1">Tutto sotto controllo!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'error' 
                        ? 'border-destructive/30 bg-destructive/5' 
                        : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'error' ? 'text-destructive' : 'text-amber-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.message || 'Nessuna descrizione'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt || '').toLocaleString("it-IT")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
