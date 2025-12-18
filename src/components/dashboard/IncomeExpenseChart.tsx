import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { mese: "Set", incassi: 45000, pagamenti: 38000 },
  { mese: "Ott", incassi: 52000, pagamenti: 42000 },
  { mese: "Nov", incassi: 48000, pagamenti: 45000 },
  { mese: "Dic", incassi: 61000, pagamenti: 48000 },
  { mese: "Gen", incassi: 55000, pagamenti: 41000 },
  { mese: "Feb", incassi: 67000, pagamenti: 52000 },
];

export function IncomeExpenseChart() {
  return (
    <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Incassi vs Pagamenti</h3>
        <p className="text-sm text-muted-foreground">Confronto mensile ultimi 6 mesi</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <Bar dataKey="incassi" fill="hsl(142 76% 46%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pagamenti" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
