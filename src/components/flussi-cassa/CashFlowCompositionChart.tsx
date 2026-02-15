import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CompositionCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface Props {
  data: CompositionCategory[];
  isLoading: boolean;
}

const formatCurrency = (v: number) => `€${v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function CashFlowCompositionChart({ data, isLoading }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (isLoading) {
    return <Skeleton className="h-[420px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Composizione Incassi</CardTitle>
          <CardDescription>Nessun incasso nel periodo selezionato</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Composizione Incassi</CardTitle>
        <CardDescription>Analisi delle fonti di liquidità nel periodo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full" style={{ maxWidth: 240, aspectRatio: "1" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground">Totale</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Detail List */}
          <div className="flex flex-col gap-3 justify-center">
            {data.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-foreground font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">{cat.percentage}%</span>
                    <span className="font-semibold text-foreground min-w-[80px] text-right">{formatCurrency(cat.value)}</span>
                  </div>
                </div>
                <Progress value={cat.percentage} className="h-2" style={{ "--progress-color": cat.color } as React.CSSProperties} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
