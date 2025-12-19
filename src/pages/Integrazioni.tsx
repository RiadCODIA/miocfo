import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity,
  Eye,
  RotateCcw,
  Play
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Mock data
const providers = [
  { 
    id: "1",
    name: "Open Banking Provider (Plaid)", 
    status: "ok", 
    uptime: 99.8, 
    errorRate: 0.02,
    rateLimitHits: 12,
    lastSync: "5 min fa",
    config: {
      api_base_url: "https://api.plaid.com",
      client_id: "client_xxxxx",
      client_secret: "secret_xxxxx",
      webhook_url: "https://api.finexa.com/webhooks/plaid",
      rate_limit_policy: "standard"
    }
  },
  { 
    id: "2",
    name: "Payment Gateway (Stripe)", 
    status: "ok", 
    uptime: 100, 
    errorRate: 0,
    rateLimitHits: 0,
    lastSync: "2 min fa",
    config: {
      api_base_url: "https://api.stripe.com",
      client_id: "pk_live_xxxxx",
      client_secret: "sk_live_xxxxx",
      webhook_url: "https://api.finexa.com/webhooks/stripe",
      rate_limit_policy: "standard"
    }
  },
  { 
    id: "3",
    name: "Email Service (SendGrid)", 
    status: "degraded", 
    uptime: 98.5, 
    errorRate: 1.2,
    rateLimitHits: 45,
    lastSync: "15 min fa",
    config: {
      api_base_url: "https://api.sendgrid.com",
      client_id: "SG.xxxxx",
      client_secret: "",
      webhook_url: "",
      rate_limit_policy: "aggressive"
    }
  },
];

const syncJobs = [
  { 
    id: "sync-001", 
    company: "Acme S.r.l.", 
    companyId: "1",
    status: "completed", 
    records: 156, 
    duration: "2.3s",
    startedAt: "2024-01-15 14:30:00",
    completedAt: "2024-01-15 14:30:02",
    errorMessage: null,
    stackTrace: null
  },
  { 
    id: "sync-002", 
    company: "TechCorp S.p.A.", 
    companyId: "2",
    status: "completed", 
    records: 423, 
    duration: "5.1s",
    startedAt: "2024-01-15 14:28:00",
    completedAt: "2024-01-15 14:28:05",
    errorMessage: null,
    stackTrace: null
  },
  { 
    id: "sync-003", 
    company: "StartUp Innovation", 
    companyId: "3",
    status: "failed", 
    records: 0, 
    duration: "0.8s",
    startedAt: "2024-01-15 14:25:00",
    completedAt: "2024-01-15 14:25:01",
    errorMessage: "Connection timeout: Unable to reach Plaid API",
    stackTrace: `Error: Connection timeout
    at PlaidClient.fetchTransactions (plaid-client.ts:123)
    at SyncService.syncCompany (sync-service.ts:45)
    at JobRunner.execute (job-runner.ts:89)
    at async Promise.all (index 2)
    at BatchProcessor.run (batch-processor.ts:34)`
  },
  { 
    id: "sync-004", 
    company: "Global Finance Ltd", 
    companyId: "4",
    status: "running", 
    records: 89, 
    duration: "1.2s",
    startedAt: "2024-01-15 14:32:00",
    completedAt: null,
    errorMessage: null,
    stackTrace: null
  },
];

type Provider = typeof providers[0];
type SyncJob = typeof syncJobs[0];

export default function Integrazioni() {
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [forceSyncDialogOpen, setForceSyncDialogOpen] = useState(false);
  const [forceSyncCompany, setForceSyncCompany] = useState("");

  // Form state for provider config
  const [formApiUrl, setFormApiUrl] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");
  const [formWebhookUrl, setFormWebhookUrl] = useState("");
  const [formRateLimitPolicy, setFormRateLimitPolicy] = useState("");

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

  const handleConfigProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setFormApiUrl(provider.config.api_base_url);
    setFormClientId(provider.config.client_id);
    setFormClientSecret(provider.config.client_secret);
    setFormWebhookUrl(provider.config.webhook_url);
    setFormRateLimitPolicy(provider.config.rate_limit_policy);
    setConfigSheetOpen(true);
  };

  const handleSaveConfig = () => {
    toast.success("Configurazione salvata", {
      description: `${selectedProvider?.name} aggiornato con successo`
    });
    setConfigSheetOpen(false);
  };

  const handleViewJobDetails = (job: SyncJob) => {
    setSelectedJob(job);
    setJobDetailOpen(true);
  };

  const handleRetryJob = (job: SyncJob) => {
    toast.success("Job riavviato", {
      description: `Sync per ${job.company} in corso...`
    });
    setJobDetailOpen(false);
  };

  const handleForceSyncGlobal = () => {
    toast.success("Sincronizzazione globale avviata", {
      description: "Tutte le aziende verranno sincronizzate"
    });
  };

  const handleForceSync = () => {
    if (!forceSyncCompany) {
      toast.error("Seleziona un'azienda");
      return;
    }
    toast.success("Sincronizzazione forzata avviata", {
      description: `Sync per ${forceSyncCompany} in corso...`
    });
    setForceSyncDialogOpen(false);
    setForceSyncCompany("");
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
        {providers.map((provider) => (
          <Card key={provider.id}>
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
                <Button variant="ghost" size="icon" onClick={() => handleConfigProvider(provider)}>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setForceSyncDialogOpen(true)}>
                <Play className="mr-2 h-4 w-4" />
                Force Sync Azienda
              </Button>
              <Button variant="outline" onClick={handleForceSyncGlobal}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Forza Sync Globale
              </Button>
            </div>
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
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewJobDetails(job)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {job.status === "failed" && (
                      <Button variant="ghost" size="icon" onClick={() => handleRetryJob(job)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Config Sheet */}
      <Sheet open={configSheetOpen} onOpenChange={setConfigSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Configurazione Provider</SheetTitle>
            <SheetDescription>
              {selectedProvider?.name}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input 
                value={formApiUrl}
                onChange={(e) => setFormApiUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input 
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input 
                value={formClientSecret}
                onChange={(e) => setFormClientSecret(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input 
                value={formWebhookUrl}
                onChange={(e) => setFormWebhookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Limit Policy</Label>
              <Select value={formRateLimitPolicy} onValueChange={setFormRateLimitPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setConfigSheetOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveConfig}>
              Salva Configurazione
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Job Detail Sheet */}
      <Sheet open={jobDetailOpen} onOpenChange={setJobDetailOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dettaglio Job: {selectedJob?.id}
            </SheetTitle>
            <SheetDescription>
              Sincronizzazione per {selectedJob?.company}
            </SheetDescription>
          </SheetHeader>
          
          {selectedJob && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Stato</p>
                  {getJobStatusBadge(selectedJob.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Record Processati</p>
                  <p className="font-medium">{selectedJob.records}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Durata</p>
                  <p className="font-medium">{selectedJob.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Iniziato</p>
                  <p className="font-medium">{selectedJob.startedAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completato</p>
                  <p className="font-medium">{selectedJob.completedAt || "In corso..."}</p>
                </div>
              </div>

              {selectedJob.errorMessage && (
                <div className="space-y-2">
                  <Label className="text-destructive">Error Message</Label>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-mono">
                    {selectedJob.errorMessage}
                  </div>
                </div>
              )}

              {selectedJob.stackTrace && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Stack Trace</Label>
                  <pre className="p-3 rounded-lg bg-muted/50 border border-border text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {selectedJob.stackTrace}
                  </pre>
                </div>
              )}

              {selectedJob.status === "failed" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={() => handleRetryJob(selectedJob)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Riprova Sync
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Force Sync Dialog */}
      <Dialog open={forceSyncDialogOpen} onOpenChange={setForceSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Sync Azienda</DialogTitle>
            <DialogDescription>
              Forza una sincronizzazione immediata per un'azienda specifica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seleziona Azienda</Label>
              <Select value={forceSyncCompany} onValueChange={setForceSyncCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un'azienda..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acme S.r.l.">Acme S.r.l.</SelectItem>
                  <SelectItem value="TechCorp S.p.A.">TechCorp S.p.A.</SelectItem>
                  <SelectItem value="StartUp Innovation">StartUp Innovation</SelectItem>
                  <SelectItem value="Global Finance Ltd">Global Finance Ltd</SelectItem>
                  <SelectItem value="Local Business">Local Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceSyncDialogOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleForceSync}>
              Avvia Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
