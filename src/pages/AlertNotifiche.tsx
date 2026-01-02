import { useState } from "react";
import { AlertTriangle, TrendingDown, Clock, CheckCircle, Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAlerts, useActiveAlertsCount, useResolveAlert, useDismissAlert, Alert } from "@/hooks/useAlerts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

const getAlertIcon = (alertType: string) => {
  switch (alertType.toLowerCase()) {
    case "liquidità":
    case "liquidity":
    case "budget":
      return TrendingDown;
    case "scadenza":
    case "deadline":
    case "incasso":
      return Clock;
    case "cashflow":
    case "kpi":
      return CheckCircle;
    default:
      return AlertTriangle;
  }
};

const getLevelBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alto</Badge>;
    case "medium":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Medio</Badge>;
    case "low":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Basso</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getStatoBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Attivo</Badge>;
    case "resolved":
      return <Badge className="bg-success/10 text-success border-success/20">Risolto</Badge>;
    case "dismissed":
      return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Ignorato</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AlertNotifiche() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved" | "dismissed">("active");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: alerts, isLoading } = useAlerts({ 
    status: statusFilter,
    priority: priorityFilter,
    alertType: typeFilter !== "all" ? typeFilter : undefined 
  });
  const { data: counts } = useActiveAlertsCount();
  const resolveAlert = useResolveAlert();
  const dismissAlert = useDismissAlert();

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success("Alert risolto");
    } catch {
      toast.error("Errore durante la risoluzione");
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await dismissAlert.mutateAsync(alertId);
      toast.success("Alert ignorato");
    } catch {
      toast.error("Errore durante l'operazione");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Alert & Notifiche</h1>
        <p className="text-muted-foreground mt-1">
          Monitoraggio situazioni critiche
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/10">
              <Bell className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alert Attivi</p>
              <p className="text-2xl font-bold text-foreground">{counts?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorità Alta</p>
              <p className="text-2xl font-bold text-destructive">{counts?.highPriority || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risolti Questo Mese</p>
              <p className="text-2xl font-bold text-success">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="liquidità">Liquidità</SelectItem>
            <SelectItem value="scadenza">Scadenza</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="cashflow">Cashflow</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Livello" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i livelli</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Medio</SelectItem>
            <SelectItem value="low">Basso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivo</SelectItem>
            <SelectItem value="resolved">Risolto</SelectItem>
            <SelectItem value="dismissed">Ignorato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Tipo Alert</TableHead>
              <TableHead className="text-muted-foreground">Descrizione</TableHead>
              <TableHead className="text-muted-foreground">Livello Rischio</TableHead>
              <TableHead className="text-muted-foreground">Stato</TableHead>
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground w-[120px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : alerts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>Nessun alert trovato</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              alerts?.map((alert, index) => {
                const Icon = getAlertIcon(alert.alertType);
                return (
                  <TableRow
                    key={alert.id}
                    className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          alert.priority === "high" && "text-destructive",
                          alert.priority === "medium" && "text-warning",
                          alert.priority === "low" && "text-primary"
                        )} />
                        <span className="font-medium capitalize">{alert.alertType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <div>
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        {alert.description && (
                          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(alert.priority)}</TableCell>
                    <TableCell>{getStatoBadge(alert.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(alert.createdAt), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {alert.status === "active" && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-success/20"
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolveAlert.isPending}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/20"
                            onClick={() => handleDismiss(alert.id)}
                            disabled={dismissAlert.isPending}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
