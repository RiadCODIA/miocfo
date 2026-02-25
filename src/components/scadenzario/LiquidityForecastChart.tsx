import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AccrualMonth } from "@/hooks/useDeadlines";

interface LiquidityForecastChartProps {
  data: AccrualMonth[] | undefined;
  isLoading: boolean;
}

export function LiquidityForecastChart({ data, isLoading }: LiquidityForecastChartProps) {
  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Nessun dato disponibile</p>
        <p className="text-xs mt-1">Carica fatture per visualizzare la previsione per competenza</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={11} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}k`;
            return `€${value.toLocaleString("it-IT")}`;
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(222 47% 14%)",
            border: "1px solid hsl(222 47% 22%)",
            borderRadius: "8px",
            color: "hsl(210 40% 98%)",
          }}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              ricaviPagati: "Ricavi incassati",
              ricaviDaPagare: "Ricavi da incassare",
              costiPagati: "Costi pagati",
              costiDaPagare: "Costi da pagare",
            };
            return [formatCurrency(value), labels[name] || name];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              ricaviPagati: "Ricavi incassati",
              ricaviDaPagare: "Ricavi da incassare",
              costiPagati: "Costi pagati",
              costiDaPagare: "Costi da pagare",
            };
            return labels[value] || value;
          }}
          wrapperStyle={{ fontSize: 11 }}
        />
        {/* Revenue bars - green tones */}
        <Bar
          dataKey="ricaviPagati"
          stackId="revenue"
          fill="hsl(142, 71%, 45%)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="ricaviDaPagare"
          stackId="revenue"
          fill="hsl(142, 71%, 45%)"
          fillOpacity={0.18}
          radius={[2, 2, 0, 0]}
          strokeDasharray="6 3"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth={1.5}
        />
        {/* Cost bars - red tones */}
        <Bar
          dataKey="costiPagati"
          stackId="costs"
          fill="hsl(0, 84%, 60%)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="costiDaPagare"
          stackId="costs"
          fill="hsl(0, 84%, 60%)"
          fillOpacity={0.18}
          radius={[2, 2, 0, 0]}
          strokeDasharray="6 3"
          stroke="hsl(0, 84%, 60%)"
          strokeWidth={1.5}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
