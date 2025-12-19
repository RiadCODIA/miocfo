import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Sparkles,
  Server,
  Flag,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const featureFlags = [
  { key: "ai_categorization", description: "Categorizzazione automatica transazioni", enabled: true, rollout: 100 },
  { key: "ai_forecast", description: "Previsioni cash flow con AI", enabled: true, rollout: 75 },
  { key: "new_dashboard", description: "Nuova dashboard 2.0", enabled: false, rollout: 0 },
  { key: "multi_currency", description: "Supporto multi-valuta", enabled: true, rollout: 50 },
  { key: "api_v2", description: "Nuove API v2", enabled: false, rollout: 10 },
];

export default function ConfigurazioniGlobali() {
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
                <Button className="bg-violet-600 hover:bg-violet-700">
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
                      <Switch checked={flag.enabled} />
                      <div>
                        <p className="font-medium text-foreground font-mono">{flag.key}</p>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Rollout</p>
                        <Badge variant={flag.rollout === 100 ? "default" : "secondary"}>
                          {flag.rollout}%
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
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
              <Button className="bg-violet-600 hover:bg-violet-700">
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
              <Button className="bg-violet-600 hover:bg-violet-700">
                Salva Parametri Sistema
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}