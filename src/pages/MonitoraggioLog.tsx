import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSearch, 
  Search,
  Download,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock log data
const applicationLogs = [
  { timestamp: "2024-01-15 14:32:45", level: "error", service: "api-gateway", message: "Connection timeout to database" },
  { timestamp: "2024-01-15 14:32:44", level: "warn", service: "sync-service", message: "Rate limit approaching for Plaid API" },
  { timestamp: "2024-01-15 14:32:40", level: "info", service: "auth-service", message: "User login successful: mario.rossi@acme.it" },
  { timestamp: "2024-01-15 14:32:38", level: "info", service: "api-gateway", message: "Request completed: GET /api/transactions (45ms)" },
  { timestamp: "2024-01-15 14:32:35", level: "warn", service: "billing-service", message: "Invoice generation delayed for company_123" },
];

const auditTrail = [
  { timestamp: "2024-01-15 14:30:00", actor: "admin@finexa.com", role: "super_admin", action: "company_status_change", target: "Acme S.r.l.", result: "success" },
  { timestamp: "2024-01-15 14:28:00", actor: "admin@finexa.com", role: "super_admin", action: "impersonation_start", target: "mario.rossi@acme.it", result: "success" },
  { timestamp: "2024-01-15 14:25:00", actor: "admin@finexa.com", role: "super_admin", action: "plan_change", target: "TechCorp S.p.A.", result: "success" },
  { timestamp: "2024-01-15 14:20:00", actor: "system", role: "system", action: "security_policy_change", target: "password_policy", result: "success" },
];

export default function MonitoraggioLog() {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">ERROR</Badge>;
      case "warn":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">WARN</Badge>;
      case "info":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">INFO</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monitoraggio & Log</h1>
        <p className="text-muted-foreground mt-1">
          Consultazione log applicativi e audit trail
        </p>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Log Applicativi</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cerca nei log..." 
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtri
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Esporta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Log Recenti</CardTitle>
              <CardDescription>Ultimi eventi registrati dal sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {applicationLogs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border font-mono text-sm"
                  >
                    <span className="text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                    {getLevelBadge(log.level)}
                    <span className="text-violet-600 dark:text-violet-400">[{log.service}]</span>
                    <span className="text-foreground flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Tracciamento azioni sensibili sulla piattaforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <FileSearch className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.action.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          da <span className="text-foreground">{event.actor}</span> → <span className="text-foreground">{event.target}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{event.timestamp}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        {event.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}