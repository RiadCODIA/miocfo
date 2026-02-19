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
import { useAlerts, useActiveAlertsCount, useMarkAlertRead, useDeleteAlert, Alert } from "@/hooks/useAlerts";
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

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "error":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alto</Badge>;
    case "warning":
    case "warn":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Medio</Badge>;
    case "info":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Basso</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
};

const getStatusBadge = (isRead: boolean) => {
  if (isRead) {
    return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Letto</Badge>;
  }
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Non letto</Badge>;
};

export default function AlertNotifiche() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("unread");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: alerts, isLoading } = useAlerts({ 
    isRead: readFilter === "all" ? null : readFilter === "read",
    severity: severityFilter !== "all" ? severityFilter : undefined 
  });
  const { data: counts } = useActiveAlertsCount();
  const markAsRead = useMarkAlertRead();
  const deleteAlert = useDeleteAlert();

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead.mutateAsync(alertId);
      toast.success("Alert segnato come letto");
    } catch {
      toast.error("Errore durante l'operazione");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert.mutateAsync(alertId);
      toast.success("Alert eliminato");
    } catch {
      toast.error("Errore durante l'eliminazione");
    }
  };

  // Filter by type client-side
  const filteredAlerts = alerts?.filter(alert => {
    if (typeFilter === "all") return true;
    return alert.type.toLowerCase() === typeFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alert & Notifiche</h1>
        <p className="text-muted-foreground mt-1">
          Monitoraggio situazioni critiche
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/10">
              <Bell className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alert Non Letti</p>
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
              <p className="text-sm text-muted-foreground">Totale Alert</p>
              <p className="text-2xl font-bold text-success">{filteredAlerts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="warning">Avviso</SelectItem>
            <SelectItem value="error">Errore</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Successo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Severità" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutte le severità</SelectItem>
            <SelectItem value="error">Alta</SelectItem>
            <SelectItem value="warning">Media</SelectItem>
            <SelectItem value="info">Bassa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="unread">Non letti</SelectItem>
            <SelectItem value="read">Letti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Tipo Alert</TableHead>
              <TableHead className="text-muted-foreground">Descrizione</TableHead>
              <TableHead className="text-muted-foreground">Severità</TableHead>
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
            ) : filteredAlerts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>Nessun alert trovato</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts?.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <TableRow
                    key={alert.id}
                    className="border-border hover:bg-secondary/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          alert.severity === "error" && "text-destructive",
                          alert.severity === "warning" && "text-warning",
                          alert.severity === "info" && "text-primary"
                        )} />
                        <span className="font-medium capitalize">{alert.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <div>
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        {alert.message && (
                          <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{getStatusBadge(alert.isRead)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(alert.createdAt), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {!alert.isRead && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-success/20"
                            onClick={() => handleMarkAsRead(alert.id)}
                            disabled={markAsRead.isPending}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/20"
                            onClick={() => handleDelete(alert.id)}
                            disabled={deleteAlert.isPending}
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
