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
import DashedBar from "@/components/charts/DashedBar";

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
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={11} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
            <XAxis
              dataKey="mese"
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
                const abs = Math.abs(value);
                if (abs >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                if (abs >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                return `€${value}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 47% 14%)",
                border: "1px solid hsl(222 47% 22%)",
                borderRadius: "8px",
                color: "hsl(210 40% 98%)",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "consuntivo" ? "Consuntivo" : "Budget",
              ]}
            />
            <Legend
              formatter={(value) => (value === "consuntivo" ? "Consuntivo" : "Budget")}
              wrapperStyle={{ fontSize: 11 }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="consuntivo" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="previsionale" name="previsionale" shape={<DashedBar color="hsl(142, 71%, 45%)" />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
