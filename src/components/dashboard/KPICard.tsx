import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  delay?: number;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  delay = 0,
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div
      className={cn(
        "glass rounded-xl p-5 opacity-0 animate-fade-in",
        variant === "success" && "border-success/20",
        variant === "warning" && "border-warning/20",
        variant === "destructive" && "border-destructive/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground animate-count-up" style={{ animationDelay: `${delay + 100}ms` }}>
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "p-2.5 rounded-lg",
              variant === "default" && "bg-primary/10 text-primary",
              variant === "success" && "bg-success/10 text-success",
              variant === "warning" && "bg-warning/10 text-warning",
              variant === "destructive" && "bg-destructive/10 text-destructive"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
          {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive && "+"}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
