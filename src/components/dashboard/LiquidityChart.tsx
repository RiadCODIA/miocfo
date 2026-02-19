import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLiquidityChart } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function LiquidityChart() {
  const { data, isLoading, error } = useLiquidityChart();

  const hasData = data && data.length > 0 && data.some(d => d.saldo > 0);

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Andamento Liquidità</h3>
        <p className="text-sm text-muted-foreground">Saldi giornalieri del periodo</p>
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
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
              <XAxis
                dataKey="date"
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
                formatter={(value: number) => [`€${value.toLocaleString("it-IT")}`, "Saldo"]}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="hsl(174 72% 46%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSaldo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
