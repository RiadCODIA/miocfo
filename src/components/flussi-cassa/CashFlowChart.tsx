import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDateRange } from "@/contexts/DateRangeContext";

interface CashFlowChartProps {
  data: {
    mese: string;
    incassi: number;
    pagamenti: number;
    cashflow: number;
  }[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { activeLabel } = useDateRange();
  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Andamento Flussi di Cassa
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Incassi, pagamenti e cashflow netto — {activeLabel.toLowerCase()}
      </p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncassi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPagamenti" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="mese"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              tickFormatter={(value) => {
                const abs = Math.abs(value);
                if (abs >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                if (abs >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                return `€${value}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "incassi" ? "Incassi" : name === "pagamenti" ? "Pagamenti" : "Cashflow",
              ]}
              labelFormatter={(label) => label}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) =>
                value === "incassi" ? "Incassi" : value === "pagamenti" ? "Pagamenti" : "Cashflow Netto"
              }
            />
            <Area
              type="monotone"
              dataKey="incassi"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncassi)"
            />
            <Area
              type="monotone"
              dataKey="pagamenti"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPagamenti)"
            />
            <Area
              type="monotone"
              dataKey="cashflow"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={0}
              fill="none"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
