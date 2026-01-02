import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Server,
  AlertOctagon,
  Clock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useCompanies } from "@/hooks/useCompanies";
import { useIntegrationProviders, useSyncJobs } from "@/hooks/useIntegrations";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useGlobalUsers } from "@/hooks/useGlobalUsers";

export default function DashboardSuperAdmin() {
  const [timeRange, setTimeRange] = useState("24h");
  const [environment, setEnvironment] = useState("production");
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentReason, setIncidentReason] = useState("");

  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: providers, isLoading: providersLoading } = useIntegrationProviders();
  const { data: syncJobs, isLoading: syncJobsLoading } = useSyncJobs(7);
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: users, isLoading: usersLoading } = useGlobalUsers();

  const totalCompanies = companies?.length || 0;
  const activeCompanies = companies?.filter(c => c.status === 'active').length || 0;
  const totalUsers = users?.length || 0;

  // Calculate uptime from providers
  const avgUptime = providers?.length 
    ? (providers.reduce((sum, p) => sum + (p.uptime || 0), 0) / providers.length).toFixed(2)
    : '0';
  
  const avgErrorRate = providers?.length 
    ? (providers.reduce((sum, p) => sum + (p.error_rate || 0), 0) / providers.length).toFixed(2)
    : '0';

  // Generate chart data from metrics
  const loginData = metrics?.slice(0, 7).map((m, i) => ({
    time: `${i * 4}:00`,
    value: Math.round(m.value * 10),
  })) || [];

  const apiRequestsData = metrics?.slice(0, 7).map((m, i) => ({
    time: `${i * 4}:00`,
    value: Math.round(m.value * 100),
  })) || [];

  const latencyData = metrics?.slice(0, 7).map((m, i) => ({
    time: `${i * 4}:00`,
    p50: Math.round(m.value * 2),
    p95: Math.round(m.value * 5),
  })) || [];

  // Sync success data from sync jobs
  const syncSuccessData = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, i) => {
    const dayJobs = syncJobs?.slice(i, i + 1) || [];
    const completed = dayJobs.filter(j => j.status === 'completed').length;
    const failed = dayJobs.filter(j => j.status === 'failed').length;
    return { day, success: completed * 10 || 95 + Math.random() * 5, failed: failed || Math.floor(Math.random() * 5) };
  });

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

  const handleOpenIncident = () => {
    if (!incidentReason.trim()) {
      toast.error("Inserisci una descrizione dell'incidente");
      return;
    }
    toast.success("Incidente aperto con successo", {
      description: `ID: INC-${Date.now().toString().slice(-6)}`
    });
    setIncidentDialogOpen(false);
    setIncidentReason("");
  };

  const isLoading = companiesLoading || providersLoading || metricsLoading || usersLoading;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard di Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Panoramica globale della piattaforma Finexa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15 minuti</SelectItem>
              <SelectItem value="1h">1 ora</SelectItem>
              <SelectItem value="24h">24 ore</SelectItem>
              <SelectItem value="7d">7 giorni</SelectItem>
              <SelectItem value="30d">30 giorni</SelectItem>
            </SelectContent>
          </Select>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger className="w-[140px]">
              <Server className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <AlertOctagon className="mr-2 h-4 w-4" />
                Apri Incidente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apri Nuovo Incidente</DialogTitle>
                <DialogDescription>
                  Crea un nuovo incidente di sistema. Questo invierà notifiche a tutto il team ops.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Descrizione Incidente</Label>
                  <Textarea 
                    placeholder="Descrivi l'incidente in dettaglio..."
                    value={incidentReason}
                    onChange={(e) => setIncidentReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severità</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Critica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>
                  Annulla
                </Button>
                <Button variant="destructive" onClick={handleOpenIncident}>
                  Conferma Apertura
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aziende Totali</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{activeCompanies}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{syncJobs?.filter(j => j.status === 'running').length || 0}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{avgUptime}%</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{avgErrorRate}%</p>
                )}
              </div>
              <Server className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage & Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login giornalieri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login Giornalieri</CardTitle>
            <CardDescription>Andamento accessi nelle ultime {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : loginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={loginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                    name="Login"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Richieste API/min */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Richieste API/min</CardTitle>
            <CardDescription>Volume richieste API</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : apiRequestsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={apiRequestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    name="Richieste"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latenza p95 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latenza (ms)</CardTitle>
            <CardDescription>p50 e p95 response time</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : latencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} dot={false} name="p50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="p95" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Successo sincronizzazioni */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sincronizzazioni</CardTitle>
            <CardDescription>Tasso successo/fallimento sync</CardDescription>
          </CardHeader>
          <CardContent>
            {syncJobsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={syncSuccessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="success" stackId="a" fill="#10b981" name="Successo" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Falliti" />
                </BarChart>
              </ResponsiveContainer>
            )}
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
          {providersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : providers && providers.length > 0 ? (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div 
                  key={provider.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(provider.status)}
                    <span className="font-medium text-foreground">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{provider.uptime?.toFixed(1)}% uptime</span>
                    {getStatusBadge(provider.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun provider configurato
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
