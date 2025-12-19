import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileSearch, 
  Search,
  Download,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  Radio,
  CircleOff
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { toast } from "sonner";

// Mock log data
const applicationLogs = [
  { timestamp: "2024-01-15 14:32:45", level: "error", service: "api-gateway", message: "Connection timeout to database", requestId: "req-001", companyId: "acme" },
  { timestamp: "2024-01-15 14:32:44", level: "warn", service: "sync-service", message: "Rate limit approaching for Plaid API", requestId: "req-002", companyId: "techcorp" },
  { timestamp: "2024-01-15 14:32:40", level: "info", service: "auth-service", message: "User login successful: mario.rossi@acme.it", requestId: "req-003", companyId: "acme" },
  { timestamp: "2024-01-15 14:32:38", level: "info", service: "api-gateway", message: "Request completed: GET /api/transactions (45ms)", requestId: "req-004", companyId: "globalfinance" },
  { timestamp: "2024-01-15 14:32:35", level: "warn", service: "billing-service", message: "Invoice generation delayed for company_123", requestId: "req-005", companyId: "startup" },
  { timestamp: "2024-01-15 14:32:30", level: "error", service: "sync-service", message: "Failed to sync transactions: Invalid credentials", requestId: "req-006", companyId: "localbiz" },
  { timestamp: "2024-01-15 14:32:25", level: "info", service: "api-gateway", message: "Request completed: POST /api/transactions (123ms)", requestId: "req-007", companyId: "acme" },
];

const auditTrail = [
  { timestamp: "2024-01-15 14:30:00", actor: "admin@finexa.com", role: "super_admin", action: "company_status_change", target: "Acme S.r.l.", result: "success" },
  { timestamp: "2024-01-15 14:28:00", actor: "admin@finexa.com", role: "super_admin", action: "impersonation_start", target: "mario.rossi@acme.it", result: "success" },
  { timestamp: "2024-01-15 14:25:00", actor: "admin@finexa.com", role: "super_admin", action: "plan_change", target: "TechCorp S.p.A.", result: "success" },
  { timestamp: "2024-01-15 14:20:00", actor: "system", role: "system", action: "security_policy_change", target: "password_policy", result: "success" },
  { timestamp: "2024-01-15 14:15:00", actor: "admin@finexa.com", role: "super_admin", action: "user_role_change", target: "giulia@techcorp.com", result: "success" },
];

export default function MonitoraggioLog() {
  const [liveTailActive, setLiveTailActive] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterRequestId, setFilterRequestId] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportRange, setExportRange] = useState("24h");

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

  const filteredLogs = applicationLogs.filter(log => {
    if (filterSeverity !== "all" && log.level !== filterSeverity) return false;
    if (filterService !== "all" && log.service !== filterService) return false;
    if (filterCompany && !log.companyId.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterRequestId && !log.requestId.toLowerCase().includes(filterRequestId.toLowerCase())) return false;
    return true;
  });

  const handleToggleLiveTail = () => {
    setLiveTailActive(!liveTailActive);
    if (!liveTailActive) {
      toast.success("Live Tail attivato", {
        description: "I log verranno aggiornati in tempo reale"
      });
    } else {
      toast.info("Live Tail disattivato");
    }
  };

  const handleExport = () => {
    toast.success("Export avviato", {
      description: `Download ${exportFormat.toUpperCase()} in corso...`
    });
    setExportDialogOpen(false);
  };

  const resetFilters = () => {
    setFilterSeverity("all");
    setFilterService("all");
    setFilterCompany("");
    setFilterRequestId("");
  };

  const activeFiltersCount = [
    filterSeverity !== "all",
    filterService !== "all",
    filterCompany !== "",
    filterRequestId !== ""
  ].filter(Boolean).length;

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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtri
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-violet-600">{activeFiltersCount}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filtri Avanzati</h4>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tutti i livelli" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Service</Label>
                        <Select value={filterService} onValueChange={setFilterService}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tutti i servizi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti</SelectItem>
                            <SelectItem value="api-gateway">API Gateway</SelectItem>
                            <SelectItem value="auth-service">Auth Service</SelectItem>
                            <SelectItem value="sync-service">Sync Service</SelectItem>
                            <SelectItem value="billing-service">Billing Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Company ID</Label>
                        <Input 
                          placeholder="es: acme"
                          value={filterCompany}
                          onChange={(e) => setFilterCompany(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Request ID</Label>
                        <Input 
                          placeholder="es: req-001"
                          value={filterRequestId}
                          onChange={(e) => setFilterRequestId(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" className="w-full" onClick={resetFilters}>
                        Resetta Filtri
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant={liveTailActive ? "default" : "outline"}
                  className={liveTailActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={handleToggleLiveTail}
                >
                  {liveTailActive ? (
                    <>
                      <Radio className="mr-2 h-4 w-4 animate-pulse" />
                      Live Tail ON
                    </>
                  ) : (
                    <>
                      <CircleOff className="mr-2 h-4 w-4" />
                      Live Tail
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Esporta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Log Recenti
                {liveTailActive && (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {filteredLogs.length} log {filteredLogs.length !== applicationLogs.length && `(filtrati da ${applicationLogs.length})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredLogs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border font-mono text-sm"
                  >
                    <span className="text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                    {getLevelBadge(log.level)}
                    <span className="text-violet-600 dark:text-violet-400">[{log.service}]</span>
                    <span className="text-foreground flex-1">{log.message}</span>
                    <span className="text-muted-foreground text-xs">{log.requestId}</span>
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esporta Log</DialogTitle>
            <DialogDescription>
              Questa azione verrà registrata nell'audit trail
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Range Temporale</Label>
              <Select value={exportRange} onValueChange={setExportRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Ultima ora</SelectItem>
                  <SelectItem value="24h">Ultime 24 ore</SelectItem>
                  <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
                  <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
              <p className="text-amber-600 font-medium">Attenzione</p>
              <p className="text-muted-foreground">
                L'export dei log verrà tracciato nell'audit trail per conformità.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleExport}>
              Conferma Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
