import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useApplicationLogs, useAuditTrail } from "@/hooks/useSystemLogs";

export default function MonitoraggioLog() {
  const [liveTailActive, setLiveTailActive] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterRequestId, setFilterRequestId] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportRange, setExportRange] = useState("24h");

  const { data: applicationLogs, isLoading: logsLoading } = useApplicationLogs({}, 100);
  const { data: auditTrail, isLoading: auditLoading } = useAuditTrail(50);

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

  const filteredLogs = (applicationLogs || []).filter(log => {
    if (filterSeverity !== "all" && log.level !== filterSeverity) return false;
    if (filterService !== "all" && log.service !== filterService) return false;
    if (filterCompany && !log.company_id?.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterRequestId && !log.request_id?.toLowerCase().includes(filterRequestId.toLowerCase())) return false;
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

  // Get unique services for filter
  const uniqueServices = [...new Set((applicationLogs || []).map(log => log.service))];

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
                            {uniqueServices.map(service => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
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
                {filteredLogs.length} log {filteredLogs.length !== (applicationLogs?.length || 0) && `(filtrati da ${applicationLogs?.length || 0})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border font-mono text-sm"
                    >
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('it-IT')}
                      </span>
                      {getLevelBadge(log.level)}
                      <span className="text-violet-600 dark:text-violet-400">[{log.service}]</span>
                      <span className="text-foreground flex-1">{log.message}</span>
                      {log.request_id && (
                        <span className="text-muted-foreground text-xs">{log.request_id}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun log trovato
                </div>
              )}
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
              {auditLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (auditTrail && auditTrail.length > 0) ? (
                <div className="space-y-4">
                  {auditTrail.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <FileSearch className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{event.action.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            da <span className="text-foreground">{event.actor_email || 'Sistema'}</span> → <span className="text-foreground">{event.target_name || event.target_id || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('it-IT')}
                        </span>
                        <Badge className={event.result === 'success' ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                          {event.result}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun evento nell'audit trail
                </div>
              )}
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
