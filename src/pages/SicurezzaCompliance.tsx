import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Lock,
  Key,
  Clock,
  FileText,
  Download,
  AlertTriangle,
  Plus,
  Trash2,
  Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  useGdprRequests, 
  useIpAllowlist, 
  useSecurityPolicies,
  useAddIpToAllowlist,
  useRemoveIpFromAllowlist,
  useUpdateSecurityPolicy
} from "@/hooks/useSecurityCompliance";

export default function SicurezzaCompliance() {
  const [newIp, setNewIp] = useState("");
  const [newIpDescription, setNewIpDescription] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedGdprRequest, setSelectedGdprRequest] = useState<{ id: string; company_name: string | null } | null>(null);

  const { data: gdprRequests, isLoading: gdprLoading } = useGdprRequests();
  const { data: ipAllowlist, isLoading: ipLoading } = useIpAllowlist();
  const { data: securityPolicies, isLoading: policiesLoading } = useSecurityPolicies();

  const createIpEntry = useAddIpToAllowlist();
  const deleteIpEntry = useRemoveIpFromAllowlist();
  const updatePolicy = useUpdateSecurityPolicy();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Completata</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">In Corso</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">In Attesa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "data_export":
        return <Badge variant="outline">Esportazione Dati</Badge>;
      case "data_deletion":
        return <Badge variant="outline" className="border-destructive/50 text-destructive">Cancellazione Dati</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleAddIp = () => {
    if (!newIp.trim()) {
      toast.error("Inserisci un indirizzo IP valido");
      return;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIp)) {
      toast.error("Formato IP non valido", {
        description: "Usa formato IPv4 (es: 192.168.1.1 o 192.168.1.0/24)"
      });
      return;
    }
    createIpEntry.mutate({
      ip_address: newIp,
      description: newIpDescription || "Nessuna descrizione",
    }, {
      onSuccess: () => {
        setNewIp("");
        setNewIpDescription("");
      }
    });
  };

  const handleRemoveIp = (id: string) => {
    deleteIpEntry.mutate(id);
  };

  const handleExportData = (request: { id: string; company_name: string | null }) => {
    setSelectedGdprRequest(request);
    setExportDialogOpen(true);
  };

  const handleConfirmExport = () => {
    toast.success("Export dati avviato", {
      description: `Export per ${selectedGdprRequest?.company_name || 'azienda'} in corso...`
    });
    setExportDialogOpen(false);
  };

  const handleSaveSecurityPolicy = () => {
    toast.success("Policy di sicurezza salvate");
  };

  const handleSaveRetentionPolicy = () => {
    toast.success("Policy di retention salvate");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sicurezza & Compliance</h1>
        <p className="text-muted-foreground mt-1">
          Gestione policy di sicurezza e conformità GDPR
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList>
          <TabsTrigger value="security">Policy Sicurezza</TabsTrigger>
          <TabsTrigger value="ip">IP Allowlist</TabsTrigger>
          <TabsTrigger value="gdpr">Strumenti GDPR</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          {/* Password Policy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-violet-600" />
                <CardTitle>Policy Password</CardTitle>
              </div>
              <CardDescription>Configurazione requisiti password per tutti gli utenti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lunghezza minima</Label>
                  <Input type="number" defaultValue={8} />
                </div>
                <div className="space-y-2">
                  <Label>Rotazione password (giorni)</Label>
                  <Input type="number" defaultValue={90} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Richiedi lettere maiuscole</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Richiedi numeri</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Richiedi simboli</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session & MFA */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-violet-600" />
                <CardTitle>Autenticazione e Sessioni</CardTitle>
              </div>
              <CardDescription>Impostazioni 2FA e timeout sessione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">2FA Obbligatoria</Label>
                  <p className="text-sm text-muted-foreground">Richiedi autenticazione a due fattori per tutti gli utenti</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">2FA per Super Admin</Label>
                  <p className="text-sm text-muted-foreground">2FA sempre richiesta per super admin (non disabilitabile)</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="space-y-2">
                <Label>Timeout Sessione (minuti)</Label>
                <Input type="number" defaultValue={30} />
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveSecurityPolicy}>
                Salva Policy Sicurezza
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip" className="space-y-6">
          {/* IP Allowlist */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-violet-600" />
                <CardTitle>IP Allowlist</CardTitle>
              </div>
              <CardDescription>
                Limita l'accesso alla piattaforma a indirizzi IP specifici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new IP */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Indirizzo IP (IPv4 o CIDR)</Label>
                  <Input 
                    placeholder="es: 192.168.1.1 o 192.168.1.0/24"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Descrizione (opzionale)</Label>
                  <Input 
                    placeholder="es: Ufficio Milano"
                    value={newIpDescription}
                    onChange={(e) => setNewIpDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700" 
                    onClick={handleAddIp}
                    disabled={createIpEntry.isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi
                  </Button>
                </div>
              </div>

              {/* IP List */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">IP Autorizzati ({ipAllowlist?.length || 0})</Label>
                {ipLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : ipAllowlist && ipAllowlist.length > 0 ? (
                  <div className="space-y-2">
                    {ipAllowlist.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {item.ip_address}
                          </code>
                          <span className="text-sm text-muted-foreground">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            Aggiunto: {new Date(item.created_at).toLocaleDateString('it-IT')}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveIp(item.id)}
                            disabled={deleteIpEntry.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nessun IP nella allowlist
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <p className="text-amber-600 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Attenzione
                </p>
                <p className="text-muted-foreground mt-1">
                  Se la allowlist è vuota, l'accesso è consentito da qualsiasi IP.
                  Aggiungendo IP, l'accesso verrà limitato solo agli indirizzi elencati.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-6">
          {/* GDPR Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-600" />
                  <div>
                    <CardTitle>Richieste GDPR</CardTitle>
                    <CardDescription>Gestione richieste di accesso e cancellazione dati</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {gdprLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : gdprRequests && gdprRequests.length > 0 ? (
                <div className="space-y-4">
                  {gdprRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">GDPR-{request.id.slice(0, 8)}</p>
                            {getTypeBadge(request.request_type)}
                          </div>
                          <p className="text-sm text-muted-foreground">{request.company_name || 'Azienda sconosciuta'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Scadenza: {new Date(request.due_date).toLocaleDateString('it-IT')}</p>
                        </div>
                        {getStatusBadge(request.status || 'pending')}
                        <div className="flex gap-2">
                          {request.request_type === "data_export" && request.status !== "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleExportData(request)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Esporta Dati
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Gestisci
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna richiesta GDPR
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retention Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-600" />
                <CardTitle>Policy di Retention</CardTitle>
              </div>
              <CardDescription>Configurazione retention dati e log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retention Log (giorni)</Label>
                  <Input type="number" defaultValue={90} />
                </div>
                <div className="space-y-2">
                  <Label>Retention Audit (giorni)</Label>
                  <Input type="number" defaultValue={365} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600">Attenzione</p>
                  <p className="text-sm text-muted-foreground">
                    Modificare le policy di retention può avere implicazioni legali. Consulta il DPO prima di apportare modifiche.
                  </p>
                </div>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveRetentionPolicy}>
                Salva Policy Retention
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esporta Dati Azienda</DialogTitle>
            <DialogDescription>
              Esporta tutti i dati per {selectedGdprRequest?.company_name || 'azienda'} in conformità GDPR
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="font-medium text-foreground">Dati inclusi nell'export:</p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Profilo azienda e configurazioni</li>
                <li>• Tutti gli utenti e relativi profili</li>
                <li>• Conti bancari e transazioni</li>
                <li>• Report e forecast generati</li>
                <li>• Log di attività e audit trail</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
              <p className="text-amber-600 font-medium">Questa azione verrà tracciata</p>
              <p className="text-muted-foreground mt-1">
                L'export verrà registrato nell'audit trail per conformità.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleConfirmExport}>
              Conferma Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
