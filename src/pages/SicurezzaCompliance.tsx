import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Lock,
  Key,
  Clock,
  FileText,
  Download,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const gdprRequests = [
  { id: "GDPR-001", company: "Acme S.r.l.", type: "data_export", status: "pending", createdAt: "2024-01-10", dueDate: "2024-02-10" },
  { id: "GDPR-002", company: "Local Business", type: "data_deletion", status: "completed", createdAt: "2024-01-05", dueDate: "2024-02-05" },
  { id: "GDPR-003", company: "TechCorp S.p.A.", type: "data_export", status: "in_progress", createdAt: "2024-01-12", dueDate: "2024-02-12" },
];

export default function SicurezzaCompliance() {
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
              <Button className="bg-violet-600 hover:bg-violet-700">
                Salva Policy Sicurezza
              </Button>
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
                          <p className="font-medium text-foreground">{request.id}</p>
                          {getTypeBadge(request.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Scadenza: {request.dueDate}</p>
                      </div>
                      {getStatusBadge(request.status)}
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Gestisci
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <Button className="bg-violet-600 hover:bg-violet-700">
                Salva Policy Retention
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}