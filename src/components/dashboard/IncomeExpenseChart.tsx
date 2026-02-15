import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useIncomeExpenseChart } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function IncomeExpenseChart() {
  const { data, isLoading } = useIncomeExpenseChart();

  const hasData = data && data.length > 0 && data.some(d => d.incassi > 0 || d.pagamenti > 0);

  return (
    <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
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
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
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
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
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
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm capitalize">{value}</span>
                )}
              />
              <Bar dataKey="incassi" name="Incassi" fill="hsl(142 76% 46%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pagamenti" name="Pagamenti" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(217 91% 60%)" }}
                name="Saldo Netto"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
