import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Sparkles,
  Server,
  Flag,
  Plus,
  Edit,
  Trash2,
  Building2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// All companies for targeting
const allCompanies = [
  { id: "1", name: "Acme S.r.l." },
  { id: "2", name: "TechCorp S.p.A." },
  { id: "3", name: "StartUp Innovation" },
  { id: "4", name: "Global Finance Ltd" },
  { id: "5", name: "Local Business" },
];

// Mock data
const initialFeatureFlags = [
  { key: "ai_categorization", description: "Categorizzazione automatica transazioni", enabled: true, rollout: 100, targetCompanies: [] },
  { key: "ai_forecast", description: "Previsioni cash flow con AI", enabled: true, rollout: 75, targetCompanies: ["1", "2", "4"] },
  { key: "new_dashboard", description: "Nuova dashboard 2.0", enabled: false, rollout: 0, targetCompanies: [] },
  { key: "multi_currency", description: "Supporto multi-valuta", enabled: true, rollout: 50, targetCompanies: ["2", "4"] },
  { key: "api_v2", description: "Nuove API v2", enabled: false, rollout: 10, targetCompanies: ["3"] },
];

type FeatureFlag = typeof initialFeatureFlags[0];

export default function ConfigurazioniGlobali() {
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);
  const [formRollout, setFormRollout] = useState(0);
  const [formTargetCompanies, setFormTargetCompanies] = useState<string[]>([]);

  const handleNewFlag = () => {
    setEditingFlag(null);
    setIsCreating(true);
    setFormKey("");
    setFormDescription("");
    setFormEnabled(false);
    setFormRollout(100);
    setFormTargetCompanies([]);
    setFlagDialogOpen(true);
  };

  const handleEditFlag = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setIsCreating(false);
    setFormKey(flag.key);
    setFormDescription(flag.description);
    setFormEnabled(flag.enabled);
    setFormRollout(flag.rollout);
    setFormTargetCompanies(flag.targetCompanies);
    setFlagDialogOpen(true);
  };

  const handleDeleteFlag = (key: string) => {
    setFeatureFlags(featureFlags.filter(f => f.key !== key));
    toast.success("Feature flag eliminato");
  };

  const handleSaveFlag = () => {
    if (!formKey.trim()) {
      toast.error("Inserisci una chiave per il flag");
      return;
    }
    if (!formDescription.trim()) {
      toast.error("Inserisci una descrizione");
      return;
    }

    const newFlag: FeatureFlag = {
      key: formKey.toLowerCase().replace(/\s+/g, '_'),
      description: formDescription,
      enabled: formEnabled,
      rollout: formRollout,
      targetCompanies: formTargetCompanies,
    };

    if (isCreating) {
      if (featureFlags.some(f => f.key === newFlag.key)) {
        toast.error("Esiste già un flag con questa chiave");
        return;
      }
      setFeatureFlags([...featureFlags, newFlag]);
      toast.success("Feature flag creato");
    } else {
      setFeatureFlags(featureFlags.map(f => f.key === editingFlag!.key ? newFlag : f));
      toast.success("Feature flag aggiornato");
    }
    setFlagDialogOpen(false);
  };

  const handleToggleFlag = (key: string) => {
    setFeatureFlags(featureFlags.map(f => 
      f.key === key ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const toggleTargetCompany = (companyId: string) => {
    setFormTargetCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSaveAiSettings = () => {
    toast.success("Impostazioni AI salvate");
  };

  const handleSaveSystemParams = () => {
    toast.success("Parametri di sistema salvati");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurazioni Globali</h1>
        <p className="text-muted-foreground mt-1">
          Parametri globali di sistema, feature flag e impostazioni AI
        </p>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="ai">Impostazioni AI</TabsTrigger>
          <TabsTrigger value="system">Parametri Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-violet-600" />
                  <div>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Gestione abilitazione funzionalità a livello globale</CardDescription>
                  </div>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleNewFlag}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo Flag
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div 
                    key={flag.key}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <Switch 
                        checked={flag.enabled} 
                        onCheckedChange={() => handleToggleFlag(flag.key)}
                      />
                      <div>
                        <p className="font-medium text-foreground font-mono">{flag.key}</p>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                        {flag.targetCompanies.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Target: {flag.targetCompanies.length} aziende
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Rollout</p>
                        <Badge variant={flag.rollout === 100 ? "default" : "secondary"}>
                          {flag.rollout}%
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEditFlag(flag)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteFlag(flag.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {/* AI Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <CardTitle>Impostazioni AI</CardTitle>
              </div>
              <CardDescription>Parametri globali della componente AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider AI</Label>
                  <Select defaultValue="openai">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modello</Label>
                  <Input defaultValue="gpt-4-turbo" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Token max per richiesta</Label>
                  <Input type="number" defaultValue={4096} />
                </div>
                <div className="space-y-2">
                  <Label>Rate limit/min</Label>
                  <Input type="number" defaultValue={60} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequenza Forecast</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Giornaliero</SelectItem>
                    <SelectItem value="weekly">Settimanale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveAiSettings}>
                Salva Impostazioni AI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Parameters */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-violet-600" />
                <CardTitle>Parametri di Sistema</CardTitle>
              </div>
              <CardDescription>Configurazioni tecniche globali</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeout API (ms)</Label>
                  <Input type="number" defaultValue={30000} />
                </div>
                <div className="space-y-2">
                  <Label>Intervallo Batch Sync (min)</Label>
                  <Input type="number" defaultValue={15} />
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-base">Retry Policy</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Max Retries</Label>
                    <Input type="number" defaultValue={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Backoff Strategy</Label>
                    <Select defaultValue="exponential">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div>
                  <Label className="text-base text-destructive">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Attiva la modalità di manutenzione per tutta la piattaforma</p>
                </div>
                <Switch />
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveSystemParams}>
                Salva Parametri Sistema
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Nuovo Feature Flag" : `Modifica ${editingFlag?.key}`}
            </DialogTitle>
            <DialogDescription>
              {isCreating ? "Crea un nuovo feature flag" : "Modifica i dettagli del flag"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chiave (snake_case)</Label>
              <Input 
                placeholder="es: new_feature"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                disabled={!isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Input 
                placeholder="es: Nuova funzionalità sperimentale"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Abilitato</Label>
              <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rollout Percentage</Label>
                <span className="text-sm text-muted-foreground">{formRollout}%</span>
              </div>
              <Slider 
                value={[formRollout]} 
                onValueChange={(v) => setFormRollout(v[0])}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Target Companies (opzionale)
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Se selezionate, il flag sarà attivo solo per queste aziende
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {allCompanies.map((company) => (
                  <div 
                    key={company.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleTargetCompany(company.id)}
                  >
                    <Checkbox 
                      checked={formTargetCompanies.includes(company.id)}
                      onCheckedChange={() => toggleTargetCompany(company.id)}
                    />
                    <Label className="cursor-pointer text-sm">{company.name}</Label>
                  </div>
                ))}
              </div>
              {formTargetCompanies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formTargetCompanies.length} aziende selezionate
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveFlag}>
              {isCreating ? "Crea Flag" : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
