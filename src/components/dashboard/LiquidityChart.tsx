import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "01 Gen", saldo: 45000 },
  { date: "05 Gen", saldo: 52000 },
  { date: "10 Gen", saldo: 48000 },
  { date: "15 Gen", saldo: 61000 },
  { date: "20 Gen", saldo: 55000 },
  { date: "25 Gen", saldo: 67000 },
  { date: "30 Gen", saldo: 72000 },
];

export function LiquidityChart() {
  return (
    <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Andamento Liquidità</h3>
        <p className="text-sm text-muted-foreground">Saldi giornalieri del periodo</p>
      </div>
      <div className="h-[280px]">
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
      </div>
    </div>
  );
}
