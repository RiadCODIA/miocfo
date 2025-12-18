import { AlertTriangle, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Liquidità sotto soglia",
    description: "Il saldo previsto per il 15/02 è inferiore a €10.000",
    icon: TrendingDown,
  },
  {
    id: 2,
    type: "info",
    title: "Scadenza imminente",
    description: "3 fatture in scadenza nei prossimi 5 giorni",
    icon: Clock,
  },
  {
    id: 3,
    type: "success",
    title: "Obiettivo raggiunto",
    description: "Cashflow positivo per il terzo mese consecutivo",
    icon: CheckCircle,
  },
];

export function AlertsSummary() {
  return (
    <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alert Attivi</h3>
          <p className="text-sm text-muted-foreground">Situazioni che richiedono attenzione</p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>3</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-secondary/50 cursor-pointer opacity-0 animate-slide-in",
              alert.type === "warning" && "border-warning/20 bg-warning/5",
              alert.type === "info" && "border-primary/20 bg-primary/5",
              alert.type === "success" && "border-success/20 bg-success/5"
            )}
            style={{ animationDelay: `${500 + index * 100}ms` }}
          >
            <alert.icon
              className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                alert.type === "warning" && "text-warning",
                alert.type === "info" && "text-primary",
                alert.type === "success" && "text-success"
              )}
            />
            <div>
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
