import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useIntegrationProviders, useSyncJobs, useUpdateProvider, useCreateSyncJob, IntegrationProvider, SyncJob } from "@/hooks/useIntegrations";
import { useCompanies } from "@/hooks/useCompanies";

export default function Integrazioni() {
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [forceSyncDialogOpen, setForceSyncDialogOpen] = useState(false);
  const [forceSyncCompany, setForceSyncCompany] = useState("");

  const { data: providers, isLoading: providersLoading } = useIntegrationProviders();
  const { data: syncJobs, isLoading: syncJobsLoading } = useSyncJobs(20);
  const { data: companies } = useCompanies();
  const updateProvider = useUpdateProvider();
  const createSyncJob = useCreateSyncJob();

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
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">In Attesa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleConfigProvider = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    const config = provider.config as Record<string, unknown> || {};
    setFormApiUrl((config.api_base_url as string) || "");
    setFormClientId((config.client_id as string) || "");
    setFormClientSecret((config.client_secret as string) || "");
    setFormWebhookUrl((config.webhook_url as string) || "");
    setFormRateLimitPolicy((config.rate_limit_policy as string) || "standard");
    setConfigSheetOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedProvider) return;
    
    updateProvider.mutate({
      id: selectedProvider.id,
      config: {
        api_base_url: formApiUrl,
        client_id: formClientId,
        client_secret: formClientSecret,
        webhook_url: formWebhookUrl,
        rate_limit_policy: formRateLimitPolicy,
      }
    }, {
      onSuccess: () => setConfigSheetOpen(false)
    });
  };

  const handleViewJobDetails = (job: SyncJob) => {
    setSelectedJob(job);
    setJobDetailOpen(true);
  };

  const handleRetryJob = (job: SyncJob) => {
    const company = companies?.find(c => c.id === job.company_id);
    createSyncJob.mutate({
      company_id: job.company_id,
      provider_id: job.provider_id,
      status: 'pending',
      records_processed: 0,
      duration_ms: null,
      started_at: null,
      completed_at: null,
      error_message: null,
      stack_trace: null,
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
    const company = companies?.find(c => c.id === forceSyncCompany);
    createSyncJob.mutate({
      company_id: forceSyncCompany,
      provider_id: null,
      status: 'pending',
      records_processed: 0,
      duration_ms: null,
      started_at: null,
      completed_at: null,
      error_message: null,
      stack_trace: null,
    });
    setForceSyncDialogOpen(false);
    setForceSyncCompany("");
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return "N/A";
    const company = companies?.find(c => c.id === companyId);
    return company?.name || companyId.slice(0, 8);
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
        {providersLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : providers && providers.length > 0 ? (
          providers.map((provider) => (
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
                    <p className="text-xl font-bold text-foreground">{provider.uptime?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-xl font-bold text-foreground">{provider.error_rate?.toFixed(2) || 0}%</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Rate Limit Hits (24h)</span>
                    <span className="text-foreground">{provider.rate_limit_hits || 0}</span>
                  </div>
                  <Progress value={provider.rate_limit_hits || 0} max={100} className="h-2" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Ultimo sync: {provider.last_sync_at ? new Date(provider.last_sync_at).toLocaleString('it-IT') : 'Mai'}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleConfigProvider(provider)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            Nessun provider configurato
          </div>
        )}
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
          {syncJobsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : syncJobs && syncJobs.length > 0 ? (
            <div className="space-y-4">
              {syncJobs.map((job) => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{getCompanyName(job.company_id)}</p>
                      <p className="text-sm text-muted-foreground">ID: {job.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{job.records_processed || 0} record</p>
                      <p className="text-xs text-muted-foreground">{job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : '-'}</p>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun job di sincronizzazione
            </div>
          )}
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
            <Button 
              className="bg-violet-600 hover:bg-violet-700" 
              onClick={handleSaveConfig}
              disabled={updateProvider.isPending}
            >
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
              Dettaglio Job: {selectedJob?.id.slice(0, 8)}
            </SheetTitle>
            <SheetDescription>
              Sincronizzazione per {selectedJob?.company_id ? getCompanyName(selectedJob.company_id) : 'N/A'}
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
                  <p className="font-medium">{selectedJob.records_processed || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Durata</p>
                  <p className="font-medium">{selectedJob.duration_ms ? `${(selectedJob.duration_ms / 1000).toFixed(1)}s` : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Iniziato</p>
                  <p className="font-medium">{selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString('it-IT') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completato</p>
                  <p className="font-medium">{selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString('it-IT') : "In corso..."}</p>
                </div>
              </div>

              {selectedJob.error_message && (
                <div className="space-y-2">
                  <Label className="text-destructive">Error Message</Label>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-mono">
                    {selectedJob.error_message}
                  </div>
                </div>
              )}

              {selectedJob.stack_trace && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Stack Trace</Label>
                  <pre className="p-3 rounded-lg bg-muted/50 border border-border text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {selectedJob.stack_trace}
                  </pre>
                </div>
              )}

              {selectedJob.status === "failed" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={() => handleRetryJob(selectedJob)}
                    disabled={createSyncJob.isPending}
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
                  <SelectValue placeholder="Seleziona un'azienda" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceSyncDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700" 
              onClick={handleForceSync}
              disabled={createSyncJob.isPending}
            >
              Avvia Sincronizzazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
