import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface LiquidityHeroCardProps {
  totalBalance: number;
  change?: number;
  isLoading?: boolean;
}

export function LiquidityHeroCard({ totalBalance, change, isLoading }: LiquidityHeroCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const now = new Date();

  const formatCurrency = (value: number) => {
    return value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Liquidità Totale
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">
              {isLoading ? "..." : `€ ${formatCurrency(totalBalance)}`}
            </span>
            {change !== undefined && !isLoading && (
              <span className={cn(
                "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full",
                isPositive && "text-success bg-success/10",
                isNegative && "text-destructive bg-destructive/10",
                !isPositive && !isNegative && "text-muted-foreground bg-muted"
              )}>
                {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                {isPositive && "+"}{change?.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ultimo aggiornamento: {format(now, "dd MMMM yyyy, HH:mm", { locale: it })}
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          Tutti i conti
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
