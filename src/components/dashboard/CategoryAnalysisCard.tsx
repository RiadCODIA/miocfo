import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryAnalysis, COLORS } from "@/hooks/useCategoryAnalysis";
import { BarChart3 } from "lucide-react";

export function CategoryAnalysisCard() {
  const { data: categories, isLoading } = useCategoryAnalysis();

  const formatCurrency = (v: number) =>
    `€ ${v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm h-full min-h-[200px]">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[140px] w-[140px] rounded-full mx-auto mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Analisi Categorie</h3>
        <p className="text-xs text-muted-foreground max-w-[220px]">
          Nessuna transazione categorizzata. I dati appariranno qui dopo la categorizzazione.
        </p>
      </div>
    );
  }

  const top5 = categories.slice(0, 5);

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm h-full flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-foreground mb-4">Analisi Categorie</h3>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              strokeWidth={0}
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {top5.map((cat, i) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{cat.name}</span>
            </div>
            <span className="font-medium text-foreground tabular-nums ml-2">
              {formatCurrency(cat.amount)} ({cat.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
