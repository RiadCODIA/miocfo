import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface BudgetComparisonChartProps {
  data: {
    mese: string;
    consuntivo: number;
    previsionale: number;
  }[];
}

export function BudgetComparisonChart({ data }: BudgetComparisonChartProps) {
  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Consuntivo vs Budget
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Confronto tra cashflow effettivo e previsto
        </p>
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p>Nessun budget configurato</p>
            <p className="text-sm mt-1">
              Inserisci un budget nella sezione Budget & Previsioni
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Consuntivo vs Budget
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Confronto tra cashflow effettivo e previsto
      </p>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "consuntivo" ? "Consuntivo" : "Budget",
              ]}
            />
            <Legend
              formatter={(value) => (value === "consuntivo" ? "Consuntivo" : "Budget")}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="consuntivo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previsionale" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
