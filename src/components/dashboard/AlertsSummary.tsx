import { AlertTriangle, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, useActiveAlertsCount } from "@/hooks/useAlerts";
import { Skeleton } from "@/components/ui/skeleton";

const getAlertIcon = (alertType: string) => {
  switch (alertType.toLowerCase()) {
    case "liquidity":
    case "liquidità":
      return TrendingDown;
    case "deadline":
    case "scadenza":
      return Clock;
    case "cashflow":
    case "success":
      return CheckCircle;
    default:
      return AlertTriangle;
  }
};

export function AlertsSummary() {
  const { data: alerts, isLoading } = useAlerts({ status: "active" });
  const { data: counts } = useActiveAlertsCount();

  const displayAlerts = alerts?.slice(0, 3) || [];

  return (
    <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alert Attivi</h3>
          <p className="text-sm text-muted-foreground">Situazioni che richiedono attenzione</p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>{counts?.total || 0}</span>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 text-success" />
            <p className="text-sm">Nessun alert attivo</p>
            <p className="text-xs mt-1">Tutto sotto controllo!</p>
          </div>
        ) : (
          displayAlerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.alertType);
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-secondary/50 cursor-pointer opacity-0 animate-slide-in",
                  alert.type === "warning" && "border-warning/20 bg-warning/5",
                  alert.type === "info" && "border-primary/20 bg-primary/5",
                  alert.type === "success" && "border-success/20 bg-success/5",
                  alert.type === "error" && "border-destructive/20 bg-destructive/5"
                )}
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 mt-0.5",
                    alert.type === "warning" && "text-warning",
                    alert.type === "info" && "text-primary",
                    alert.type === "success" && "text-success",
                    alert.type === "error" && "text-destructive"
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
