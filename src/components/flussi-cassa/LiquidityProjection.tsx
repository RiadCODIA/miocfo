import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface LiquidityProjectionProps {
  data: {
    data: string;
    saldo: number;
    min: number;
  }[];
  minBalance: number;
  minBalanceDate: string;
}

export function LiquidityProjection({
  data,
  minBalance,
  minBalanceDate,
}: LiquidityProjectionProps) {
  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;
  const isLow = minBalance < 10000;

  if (data.length <= 1) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Proiezione Liquidità
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Previsione saldo nei prossimi 30 giorni
        </p>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p>Nessuna scadenza configurata</p>
            <p className="text-sm mt-1">
              Inserisci scadenze nello Scadenzario per vedere la proiezione
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Proiezione Liquidità
          </h3>
          <p className="text-sm text-muted-foreground">
            Previsione saldo nei prossimi 30 giorni
          </p>
        </div>
        {isLow && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Minimo {formatCurrency(minBalance)} il {minBalanceDate}
            </span>
          </div>
        )}
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="data"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatCurrency(value), "Saldo"]}
            />
            <ReferenceLine
              y={10000}
              stroke="hsl(var(--warning))"
              strokeDasharray="5 5"
              label={{
                value: "Soglia minima",
                fill: "hsl(var(--warning))",
                fontSize: 11,
                position: "right",
              }}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
