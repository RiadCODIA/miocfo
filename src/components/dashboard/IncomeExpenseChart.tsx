import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useIncomeExpenseChart } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function IncomeExpenseChart() {
  const { data, isLoading } = useIncomeExpenseChart();

  const hasData = data && data.length > 0 && data.some(d => d.incassi > 0 || d.pagamenti > 0);

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Incassi vs Pagamenti</h3>
        <p className="text-sm text-muted-foreground">Confronto mensile ultimi 6 mesi</p>
      </div>
      <div className="h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nessun dato disponibile</p>
            <p className="text-xs mt-1">Collega un conto bancario per visualizzare i dati</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
              <XAxis
                dataKey="mese"
                stroke="hsl(215 20% 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215 20% 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const abs = Math.abs(value);
                  if (abs >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                  if (abs >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                  return `€${value.toFixed(0)}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(222 47% 22%)",
                  borderRadius: "8px",
                  color: "hsl(210 40% 98%)",
                }}
                formatter={(value: number) => `€${value.toLocaleString("it-IT")}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "12px" }}
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm capitalize">{value}</span>
                )}
              />
              <Bar dataKey="incassi" name="Incassi" fill="hsl(160 64% 52%)" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="pagamenti" name="Pagamenti" fill="hsl(0 70% 68%)" radius={[3, 3, 0, 0]} barSize={14} />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="hsl(330 70% 60%)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "hsl(330 70% 60%)" }}
                name="Saldo Netto"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
