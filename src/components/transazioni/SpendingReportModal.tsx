import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  Users,
  CheckCircle2,
  Loader2,
  PieChart,
  ArrowRight,
  Euro,
} from "lucide-react";
import { useSpendingAnalysis, SpendingAnalysis } from "@/hooks/useSpendingAnalysis";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface SpendingReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted))",
];

export function SpendingReportModal({ open, onOpenChange }: SpendingReportModalProps) {
  const { analyze, isLoading, data, error } = useSpendingAnalysis();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = async () => {
    setHasStarted(true);
    await analyze();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => setHasStarted(false), 300);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: "high" | "ok" | "low") => {
    switch (status) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Alto</Badge>;
      case "ok":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">OK</Badge>;
      case "low":
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Buono</Badge>;
    }
  };

  // Prepare chart data
  const pieData = data?.categoryBreakdown.slice(0, 6).map((cat, i) => ({
    name: cat.name,
    value: cat.totalAmount,
    percentage: cat.percentage,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const barData = data?.topSuppliers.slice(0, 8).map((s) => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + "..." : s.name,
    amount: s.amount,
    fullName: s.name,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            Report AI - Analisi Spese
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)] px-6 pb-6">
          {!hasStarted && !isLoading && !data ? (
            // Initial state - Start button
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analisi Intelligente delle Spese</h3>
                <p className="text-muted-foreground max-w-md">
                  L'AI analizzerà tutte le tue transazioni per identificare pattern di spesa,
                  aree critiche e opportunità di risparmio.
                </p>
              </div>
              <Button size="lg" onClick={handleStart} className="gap-2">
                <Lightbulb className="h-5 w-5" />
                Avvia Analisi AI
              </Button>
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analisi in corso...</h3>
                <p className="text-muted-foreground">
                  Sto analizzando le tue transazioni con l'AI
                </p>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Errore nell'analisi</h3>
                <p className="text-muted-foreground max-w-md">{error}</p>
              </div>
              <Button variant="outline" onClick={handleStart}>
                Riprova
              </Button>
            </div>
          ) : data ? (
            // Results
            <div className="space-y-6 pt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Euro className="h-4 w-4" />
                    Totale Spese
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(data.totalSpent)}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <PieChart className="h-4 w-4" />
                    Categoria Top
                  </div>
                  <div className="text-lg font-semibold truncate">
                    {data.topCategory?.name || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.topCategory?.percentage.toFixed(0)}% del totale
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Alert Critici
                  </div>
                  <div className="text-2xl font-bold text-warning">
                    {data.aiAnalysis?.summary?.criticalAlerts || 0}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Risparmio Potenziale
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(data.aiAnalysis?.summary?.potentialSavings || 0)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Critical Areas */}
              {data.aiAnalysis?.criticalAreas && data.aiAnalysis.criticalAreas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Aree Critiche - Attenzione
                  </h3>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
                    {data.aiAnalysis.criticalAreas.map((area, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
                        <div>
                          <div className="font-medium">
                            {area.category}: {formatCurrency(area.amount)}{" "}
                            <span className="text-muted-foreground">
                              ({area.percentage.toFixed(0)}% del totale)
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{area.warning}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saving Suggestions */}
              {data.aiAnalysis?.savingSuggestions && data.aiAnalysis.savingSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <Lightbulb className="h-5 w-5" />
                    Suggerimenti di Risparmio
                  </h3>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
                    {data.aiAnalysis.savingSuggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.title}</div>
                          <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                        </div>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0">
                          -{formatCurrency(suggestion.estimatedSaving)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Breakdown per Categoria
                  </h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percentage }) =>
                              `${name.substring(0, 10)}${name.length > 10 ? "..." : ""} ${percentage.toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {data.categoryBreakdown.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="text-sm truncate flex-1">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">{cat.percentage.toFixed(0)}%</span>
                          <Progress value={cat.percentage} className="w-16 h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Suppliers */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Fornitori per Spesa
                  </h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                          <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => barData.find((d) => d.name === label)?.fullName || label}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Analysis */}
              {data.aiAnalysis?.supplierAnalysis && data.aiAnalysis.supplierAnalysis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analisi Fornitori
                  </h3>
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="divide-y divide-border">
                      {data.aiAnalysis.supplierAnalysis.slice(0, 8).map((supplier, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-secondary/50">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">{supplier.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(supplier.amount)}</div>
                            {supplier.note && (
                              <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                                {supplier.note}
                              </div>
                            )}
                          </div>
                          {getStatusBadge(supplier.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Items */}
              {data.aiAnalysis?.actionItems && data.aiAnalysis.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    Azioni Consigliate
                  </h3>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4 space-y-2">
                    {data.aiAnalysis.actionItems.map((action, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-success shrink-0" />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              {data.aiAnalysis?.summary?.recommendation && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">Raccomandazione Principale</div>
                      <p className="text-sm text-muted-foreground">
                        {data.aiAnalysis.summary.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
