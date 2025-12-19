import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Server
} from "lucide-react";

// Mock data for demo
const systemMetrics = {
  totalCompanies: 156,
  activeCompanies: 142,
  totalUsers: 892,
  activeSessions: 78,
  uptime24h: 99.97,
  errorRate15m: 0.02,
};

const serviceStatus = [
  { name: "API Gateway", status: "ok", latency: "23ms" },
  { name: "Backend API", status: "ok", latency: "45ms" },
  { name: "Database", status: "ok", latency: "12ms" },
  { name: "Job Sincronizzazione", status: "degraded", latency: "2.1s" },
  { name: "Provider Open Banking", status: "ok", latency: "156ms" },
];

export default function DashboardSuperAdmin() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "down":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Operativo</Badge>;
      case "degraded":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Degradato</Badge>;
      case "down":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard di Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica globale della piattaforma Finexa
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aziende Totali</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.totalCompanies}</p>
              </div>
              <Building2 className="h-8 w-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aziende Attive</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.activeCompanies}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utenti Totali</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessioni Attive</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime (24h)</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.uptime24h}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate (15m)</p>
                <p className="text-2xl font-bold text-foreground">{systemMetrics.errorRate15m}%</p>
              </div>
              <Server className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Servizi</CardTitle>
          <CardDescription>
            Health check dei componenti principali della piattaforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceStatus.map((service, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{service.latency}</span>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}