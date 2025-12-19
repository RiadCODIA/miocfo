import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plug, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock data
const providers = [
  { 
    name: "Open Banking Provider (Plaid)", 
    status: "ok", 
    uptime: 99.8, 
    errorRate: 0.02,
    rateLimitHits: 12,
    lastSync: "5 min fa"
  },
  { 
    name: "Payment Gateway (Stripe)", 
    status: "ok", 
    uptime: 100, 
    errorRate: 0,
    rateLimitHits: 0,
    lastSync: "2 min fa"
  },
  { 
    name: "Email Service (SendGrid)", 
    status: "degraded", 
    uptime: 98.5, 
    errorRate: 1.2,
    rateLimitHits: 45,
    lastSync: "15 min fa"
  },
];

const syncJobs = [
  { id: "sync-001", company: "Acme S.r.l.", status: "completed", records: 156, duration: "2.3s" },
  { id: "sync-002", company: "TechCorp S.p.A.", status: "completed", records: 423, duration: "5.1s" },
  { id: "sync-003", company: "StartUp Innovation", status: "failed", records: 0, duration: "0.8s" },
  { id: "sync-004", company: "Global Finance Ltd", status: "running", records: 89, duration: "1.2s" },
];

export default function Integrazioni() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Operativo</Badge>;
      case "degraded":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Degradato</Badge>;
      case "down":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Completato</Badge>;
      case "running":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">In Corso</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrazioni</h1>
        <p className="text-muted-foreground mt-1">
          Gestione e supervisione delle integrazioni esterne
        </p>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((provider, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{provider.name}</CardTitle>
                {getStatusBadge(provider.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-xl font-bold text-foreground">{provider.uptime}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-xl font-bold text-foreground">{provider.errorRate}%</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Rate Limit Hits (24h)</span>
                  <span className="text-foreground">{provider.rateLimitHits}</span>
                </div>
                <Progress value={provider.rateLimitHits} max={100} className="h-2" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Ultimo sync: {provider.lastSync}</span>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sincronizzazioni Recenti</CardTitle>
              <CardDescription>Ultimi job di sincronizzazione eseguiti</CardDescription>
            </div>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Forza Sync Globale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncJobs.map((job) => (
              <div 
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{job.company}</p>
                    <p className="text-sm text-muted-foreground">ID: {job.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{job.records} record</p>
                    <p className="text-xs text-muted-foreground">{job.duration}</p>
                  </div>
                  {getJobStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}