import { useState } from "react";
import { useDeadlines, useDeadlinesSummary, type DeadlineFilters } from "@/hooks/useDeadlines";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v: number) => `€${v.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`;

export function ScadenzarioTab() {
  const [filters, setFilters] = useState<DeadlineFilters>({ status: "all", type: "all" });
  const { data: deadlines, isLoading } = useDeadlines(filters);
  const { data: summary } = useDeadlinesSummary();

  const clienti = deadlines?.filter((d) => d.type === "incasso") || [];
  const fornitori = deadlines?.filter((d) => d.type === "pagamento") || [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Incassi da ricevere</p>
          <p className="text-xl font-bold text-success mt-1">{fmt(summary?.incassiTotali || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.incassiCount || 0} scadenze</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Pagamenti dovuti</p>
          <p className="text-xl font-bold text-destructive mt-1">{fmt(summary?.pagamentiTotali || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.pagamentiCount || 0} scadenze</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Saldo netto</p>
          <p className={cn("text-xl font-bold mt-1", (summary?.saldoNetto || 0) >= 0 ? "text-success" : "text-destructive")}>
            {fmt(summary?.saldoNetto || 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Scadute</p>
          <p className="text-xl font-bold text-destructive mt-1">{summary?.overdueCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v as DeadlineFilters["type"] }))}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="incasso">Clienti (Incassi)</SelectItem>
            <SelectItem value="pagamento">Fornitori (Pagamenti)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v as DeadlineFilters["status"] }))}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Stato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="overdue">Scadute</SelectItem>
            <SelectItem value="completed">Completate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clienti */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold">Scadenzario Clienti (Incassi)</h3>
              <p className="text-xs text-muted-foreground">{clienti.length} scadenze</p>
            </div>
            <div className="divide-y divide-border/50">
              {clienti.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Nessuna scadenza</p>
              ) : clienti.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.dueDate), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-success">{fmt(d.amount)}</span>
                    <Badge variant={d.status === "overdue" ? "destructive" : d.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                      {d.status === "overdue" ? "Scaduta" : d.status === "completed" ? "Pagata" : "In attesa"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fornitori */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold">Scadenzario Fornitori (Pagamenti)</h3>
              <p className="text-xs text-muted-foreground">{fornitori.length} scadenze</p>
            </div>
            <div className="divide-y divide-border/50">
              {fornitori.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Nessuna scadenza</p>
              ) : fornitori.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.dueDate), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-destructive">{fmt(d.amount)}</span>
                    <Badge variant={d.status === "overdue" ? "destructive" : d.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                      {d.status === "overdue" ? "Scaduta" : d.status === "completed" ? "Pagato" : "In attesa"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
