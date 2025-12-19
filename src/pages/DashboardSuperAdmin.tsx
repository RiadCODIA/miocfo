import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// Mock chart data
const loginData = [
  { time: "00:00", value: 12 },
  { time: "04:00", value: 5 },
  { time: "08:00", value: 45 },
  { time: "12:00", value: 78 },
  { time: "16:00", value: 92 },
  { time: "20:00", value: 34 },
  { time: "23:00", value: 18 },
];

const apiRequestsData = [
  { time: "00:00", value: 1200 },
  { time: "04:00", value: 800 },
  { time: "08:00", value: 3500 },
  { time: "12:00", value: 4200 },
  { time: "16:00", value: 5100 },
  { time: "20:00", value: 2800 },
  { time: "23:00", value: 1500 },
];

const latencyData = [
  { time: "00:00", p50: 23, p95: 89 },
  { time: "04:00", p50: 21, p95: 76 },
  { time: "08:00", p50: 34, p95: 145 },
  { time: "12:00", p50: 42, p95: 178 },
  { time: "16:00", p50: 38, p95: 156 },
  { time: "20:00", p50: 28, p95: 98 },
  { time: "23:00", p50: 24, p95: 82 },
];

const syncSuccessData = [
  { day: "Lun", success: 98, failed: 2 },
  { day: "Mar", success: 96, failed: 4 },
  { day: "Mer", success: 99, failed: 1 },
  { day: "Gio", success: 97, failed: 3 },
  { day: "Ven", success: 95, failed: 5 },
  { day: "Sab", success: 99, failed: 1 },
  { day: "Dom", success: 100, failed: 0 },
];

export default function DashboardSuperAdmin() {
  const [timeRange, setTimeRange] = useState("24h");
  const [environment, setEnvironment] = useState("production");
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentReason, setIncidentReason] = useState("");

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

      {/* Usage & Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login giornalieri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login Giornalieri</CardTitle>
            <CardDescription>Andamento accessi nelle ultime {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Richieste API/min */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Richieste API/min</CardTitle>
            <CardDescription>Volume richieste API</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Latenza p95 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latenza (ms)</CardTitle>
            <CardDescription>p50 e p95 response time</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Successo sincronizzazioni */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sincronizzazioni</CardTitle>
            <CardDescription>Tasso successo/fallimento sync</CardDescription>
          </CardHeader>
          <CardContent>
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
