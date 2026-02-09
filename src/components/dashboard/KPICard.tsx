import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: KPICardProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
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
    </div>
  );
}
