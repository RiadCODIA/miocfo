import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ForecastData {
  data: string;
  saldo: number;
  min: number;
}

interface LiquidityForecastChartProps {
  forecast: ForecastData[] | undefined;
  isLoading: boolean;
}

export function LiquidityForecastChart({ forecast, isLoading }: LiquidityForecastChartProps) {
  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!forecast || forecast.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Nessuna previsione disponibile</p>
        <p className="text-xs mt-1">Aggiungi scadenze per visualizzare la proiezione</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
        <XAxis
          dataKey="data"
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
          formatter={(value: number) => [formatCurrency(value), "Saldo"]}
        />
        <ReferenceLine 
          y={10000} 
          stroke="hsl(0 72% 51%)" 
          strokeDasharray="5 5" 
          label={{ 
            value: "Soglia min", 
            position: "right", 
            fill: "hsl(0 72% 51%)", 
            fontSize: 11 
          }} 
        />
        <Area
          type="monotone"
          dataKey="saldo"
          stroke="hsl(174 72% 46%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorForecast)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
