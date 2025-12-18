import { AlertTriangle, TrendingDown, Clock, CheckCircle, Bell, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const alerts = [
  { id: 1, tipo: "Liquidità", descrizione: "Il saldo previsto per il 15/02 scende sotto la soglia di €10.000", livello: "alto", stato: "attivo", data: "18/12/2024" },
  { id: 2, tipo: "Scadenza", descrizione: "3 fatture in scadenza nei prossimi 5 giorni per un totale di €21.500", livello: "medio", stato: "attivo", data: "17/12/2024" },
  { id: 3, tipo: "Budget", descrizione: "Superamento budget marketing del 15% nel mese corrente", livello: "medio", stato: "attivo", data: "16/12/2024" },
  { id: 4, tipo: "Cashflow", descrizione: "Cashflow positivo per il terzo mese consecutivo", livello: "info", stato: "risolto", data: "15/12/2024" },
  { id: 5, tipo: "Incasso", descrizione: "Fattura #1234 non incassata dopo 60 giorni dalla scadenza", livello: "alto", stato: "attivo", data: "14/12/2024" },
  { id: 6, tipo: "Fornitore", descrizione: "Pagamento fornitore XYZ in ritardo di 15 giorni", livello: "medio", stato: "risolto", data: "10/12/2024" },
  { id: 7, tipo: "KPI", descrizione: "DSO aumentato del 20% rispetto al trimestre precedente", livello: "medio", stato: "monitorato", data: "08/12/2024" },
  { id: 8, tipo: "Anomalia", descrizione: "Movimento bancario non categorizzato superiore a €5.000", livello: "basso", stato: "attivo", data: "05/12/2024" },
];

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case "Liquidità":
    case "Budget":
      return TrendingDown;
    case "Scadenza":
    case "Incasso":
      return Clock;
    case "Cashflow":
    case "KPI":
      return CheckCircle;
    default:
      return AlertTriangle;
  }
};

const getLevelBadge = (livello: string) => {
  switch (livello) {
    case "alto":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alto</Badge>;
    case "medio":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Medio</Badge>;
    case "basso":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Basso</Badge>;
    case "info":
      return <Badge className="bg-success/10 text-success border-success/20">Info</Badge>;
    default:
      return <Badge variant="outline">{livello}</Badge>;
  }
};

const getStatoBadge = (stato: string) => {
  switch (stato) {
    case "attivo":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Attivo</Badge>;
    case "risolto":
      return <Badge className="bg-success/10 text-success border-success/20">Risolto</Badge>;
    case "monitorato":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Monitorato</Badge>;
    default:
      return <Badge variant="outline">{stato}</Badge>;
  }
};

export default function AlertNotifiche() {
  const alertAttivi = alerts.filter(a => a.stato === "attivo").length;
  const alertAlti = alerts.filter(a => a.livello === "alto" && a.stato === "attivo").length;

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
              <p className="text-2xl font-bold text-foreground">{alertAttivi}</p>
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
              <p className="text-2xl font-bold text-destructive">{alertAlti}</p>
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
              <p className="text-2xl font-bold text-success">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <Select defaultValue="all">
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="liquidita">Liquidità</SelectItem>
            <SelectItem value="scadenza">Scadenza</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="cashflow">Cashflow</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Livello" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i livelli</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="basso">Basso</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="attivo">
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="attivo">Attivo</SelectItem>
            <SelectItem value="monitorato">Monitorato</SelectItem>
            <SelectItem value="risolto">Risolto</SelectItem>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert, index) => {
              const Icon = getAlertIcon(alert.tipo);
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
                        alert.livello === "alto" && "text-destructive",
                        alert.livello === "medio" && "text-warning",
                        alert.livello === "basso" && "text-primary",
                        alert.livello === "info" && "text-success"
                      )} />
                      <span className="font-medium">{alert.tipo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    <p className="text-sm text-muted-foreground truncate">{alert.descrizione}</p>
                  </TableCell>
                  <TableCell>{getLevelBadge(alert.livello)}</TableCell>
                  <TableCell>{getStatoBadge(alert.stato)}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.data}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
