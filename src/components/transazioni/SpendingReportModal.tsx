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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Archive,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Users,
  CheckCircle2,
  Loader2,
  PieChart,
  ArrowRight,
  Euro,
  Activity,
  Target,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useSpendingAnalysis, SpendingAnalysis, ActionItem } from "@/hooks/useSpendingAnalysis";
import { useAIUsage } from "@/hooks/useAIUsage";
import {
  useSavedSpendingAnalyses,
  type SavedSpendingAnalysisDocument,
} from "@/hooks/useSavedSpendingAnalyses";
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
  LineChart,
  Line,
  CartesianGrid,
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
  const { usage } = useAIUsage();
  const { analyses: savedAnalyses, isLoading: isSavedAnalysesLoading } = useSavedSpendingAnalyses();
  const [hasStarted, setHasStarted] = useState(false);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);
  const [selectedSavedAnalysis, setSelectedSavedAnalysis] = useState<SavedSpendingAnalysisDocument | null>(null);

  const analysesUsed = usage?.transactionAnalysesUsed ?? 0;
  const analysesLimit = usage?.transactionAnalysesLimit ?? 0;
  const analysesRemaining = usage?.transactionAnalysesRemaining ?? 0;
  const isAnalysesBlocked = usage?.isTransactionAnalysesBlocked ?? false;

  const activeData: SpendingAnalysis | null = selectedSavedAnalysis?.payload ?? data;
  const activeError = selectedSavedAnalysis ? null : error;

  const handleStart = async () => {
    setShowSavedAnalyses(false);
    setSelectedSavedAnalysis(null);
    setHasStarted(true);
    await analyze();
  };

  const handleOpenSavedAnalysis = (analysis: SavedSpendingAnalysisDocument) => {
    setSelectedSavedAnalysis(analysis);
    setHasStarted(true);
    setShowSavedAnalyses(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    onOpenChange(false);
    setTimeout(() => {
      setHasStarted(false);
      setShowSavedAnalyses(false);
      setSelectedSavedAnalysis(null);
    }, 300);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (value: string) => {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
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

  const getRiskLevelColor = (level: "low" | "medium" | "high" | "critical") => {
    switch (level) {
      case "low": return "text-success";
      case "medium": return "text-warning";
      case "high": return "text-warning";
      case "critical": return "text-destructive";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getPriorityBadge = (priority: "urgente" | "alta" | "media" | "bassa" | undefined) => {
    switch (priority) {
      case "urgente":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "alta":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Alta</Badge>;
      case "media":
        return <Badge variant="secondary" className="text-xs">Media</Badge>;
      case "bassa":
        return <Badge variant="outline" className="text-xs">Bassa</Badge>;
      default:
        return null;
    }
  };

  const pieData = activeData?.categoryBreakdown.slice(0, 6).map((cat, i) => ({
    name: cat.name,
    value: cat.totalAmount,
    percentage: cat.percentage,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const barData = activeData?.topSuppliers.slice(0, 8).map((supplier) => ({
    name: supplier.name.length > 15 ? `${supplier.name.substring(0, 15)}...` : supplier.name,
    amount: supplier.amount,
    fullName: supplier.name,
  })) || [];

  const trendData = activeData?.monthlyTrend?.map((month) => ({
    month: month.month.substring(5),
    spese: month.spending,
    entrate: month.income,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            Report CFO - Analisi Spese Avanzata
          </DialogTitle>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Analisi rimaste questo mese:</span>{" "}
              <span className="font-semibold text-foreground">{analysesRemaining} / {analysesLimit}</span>
              <span className="ml-2">· usate {analysesUsed}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={showSavedAnalyses ? "outline" : "secondary"}
                onClick={() => setShowSavedAnalyses(false)}
              >
                Nuova analisi
              </Button>
              <Button
                size="sm"
                variant={showSavedAnalyses ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => setShowSavedAnalyses(true)}
              >
                <Archive className="h-4 w-4" />
                Analisi salvate
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-168px)] px-6 pb-6">
          {showSavedAnalyses ? (
            <div className="space-y-4 pt-4">
              {isSavedAnalysesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carico le analisi salvate...</p>
                </div>
              ) : savedAnalyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Archive className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Nessuna analisi salvata</h3>
                    <p className="text-sm text-muted-foreground">
                      Le analisi che generi compariranno qui automaticamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{analysis.title}</p>
                          <Badge variant="outline">{analysis.monthYear}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Salvata il {formatDateTime(analysis.createdAt)}
                        </p>
                      </div>
                      <Button onClick={() => handleOpenSavedAnalysis(analysis)}>Apri</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !hasStarted && !isLoading && !activeData ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analisi CFO Intelligente</h3>
                <p className="text-muted-foreground max-w-md">
                  L'AI analizzerà tutte le tue transazioni per generare un report dettagliato
                  con trend, score di salute finanziaria, anomalie e suggerimenti operativi.
                </p>
                {isAnalysesBlocked && (
                  <p className="text-sm text-destructive">
                    Hai finito le analisi mensili, ma puoi comunque aprire le analisi salvate.
                  </p>
                )}
              </div>
              <Button size="lg" onClick={handleStart} className="gap-2" disabled={isAnalysesBlocked}>
                <Lightbulb className="h-5 w-5" />
                Avvia Analisi CFO
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analisi in corso...</h3>
                <p className="text-muted-foreground">
                  Sto elaborando un report CFO completo delle tue spese
                </p>
              </div>
            </div>
          ) : activeError ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-warning" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Nessuna transazione disponibile</h3>
                <p className="text-muted-foreground max-w-md">
                  Per generare il report, devi prima sincronizzare i tuoi conti bancari.
                  Vai alla pagina <strong>Conti Bancari</strong> e clicca <strong>Sincronizza</strong>.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { handleDialogChange(false); window.location.href = "/conti-bancari"; }}>
                  Vai a Conti Bancari
                </Button>
                <Button variant="outline" onClick={handleStart} disabled={isAnalysesBlocked}>
                  Riprova
                </Button>
              </div>
            </div>
          ) : activeData ? (
            <div className="space-y-6 pt-4">
              {selectedSavedAnalysis && (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Stai visualizzando un'analisi salvata</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSavedAnalysis.title} · {formatDateTime(selectedSavedAnalysis.createdAt)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSavedAnalysis(null)}>
                    Torna alla nuova analisi
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Euro className="h-4 w-4" />
                    Totale Spese
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(activeData.totalSpent)}</div>
                  <div className="text-xs text-muted-foreground">
                    {activeData.periodMonths} mesi analizzati
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Totale Entrate
                  </div>
                  <div className="text-2xl font-bold text-success">{formatCurrency(activeData.totalIncome)}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Activity className="h-4 w-4" />
                    Cash Flow Netto
                  </div>
                  <div className={`text-2xl font-bold ${activeData.netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(activeData.netCashFlow)}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Risparmio Potenziale
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(activeData.aiAnalysis?.summary?.potentialSavings || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">/mese</div>
                </div>
              </div>

              {activeData.aiAnalysis?.cashFlowHealth && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Salute Finanziaria
                    </h3>
                    <Badge className={`${getRiskLevelColor(activeData.aiAnalysis.cashFlowHealth.riskLevel)} bg-transparent border`}>
                      Rischio: {activeData.aiAnalysis.cashFlowHealth.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center">
                      <div className={`text-5xl font-bold ${getScoreColor(activeData.aiAnalysis.cashFlowHealth.score)}`}>
                        {activeData.aiAnalysis.cashFlowHealth.score}
                      </div>
                      <div className="text-sm text-muted-foreground">Score /100</div>
                      <Progress
                        value={activeData.aiAnalysis.cashFlowHealth.score}
                        className="w-full mt-2 h-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        {activeData.aiAnalysis.cashFlowHealth.diagnosis}
                      </p>
                      {activeData.aiAnalysis.cashFlowHealth.recommendations && (
                        <div className="space-y-1">
                          {activeData.aiAnalysis.cashFlowHealth.recommendations.map((recommendation, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {trendData.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Trend Mensile
                    </h3>
                    {activeData.aiAnalysis?.trendAnalysis && (
                      <Badge variant="outline" className="capitalize">
                        {activeData.aiAnalysis.trendAnalysis.overallTrend === "increasing" ? "↑ In aumento" :
                         activeData.aiAnalysis.trendAnalysis.overallTrend === "decreasing" ? "↓ In calo" : "→ Stabile"}
                      </Badge>
                    )}
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="spese" stroke="hsl(var(--destructive))" strokeWidth={2} name="Spese" />
                        <Line type="monotone" dataKey="entrate" stroke="hsl(var(--success))" strokeWidth={2} name="Entrate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {activeData.aiAnalysis?.trendAnalysis?.trendNote && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {activeData.aiAnalysis.trendAnalysis.trendNote}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {activeData.aiAnalysis?.anomalies && activeData.aiAnalysis.anomalies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-warning">
                    <AlertCircle className="h-5 w-5" />
                    Anomalie Rilevate
                  </h3>
                  <div className="bg-warning/5 border border-warning/20 rounded-lg divide-y divide-warning/10">
                    {activeData.aiAnalysis.anomalies.map((anomaly, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              {anomaly.supplier}
                              <span className="text-destructive font-bold">{formatCurrency(anomaly.amount)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{anomaly.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                          <Lightbulb className="h-4 w-4" />
                          {anomaly.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeData.aiAnalysis?.criticalAreas && activeData.aiAnalysis.criticalAreas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Aree Critiche - Attenzione
                  </h3>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-4">
                    {activeData.aiAnalysis.criticalAreas.map((area, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {area.category}: {formatCurrency(area.amount)}{" "}
                            <span className="text-muted-foreground">
                              ({area.percentage.toFixed(0)}% del totale)
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{area.warning}</div>
                          {area.benchmark && (
                            <div className="text-xs text-primary mt-1">
                              📊 Benchmark: {area.benchmark}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeData.aiAnalysis?.savingSuggestions && activeData.aiAnalysis.savingSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-primary">
                    <Lightbulb className="h-5 w-5" />
                    Suggerimenti di Risparmio
                  </h3>
                  <Accordion type="single" collapsible className="bg-primary/5 border border-primary/20 rounded-lg">
                    {activeData.aiAnalysis.savingSuggestions.map((suggestion, i) => (
                      <AccordionItem key={i} value={`suggestion-${i}`} className="border-primary/10">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{suggestion.title}</span>
                              {suggestion.priority && (
                                <span className="ml-2">
                                  {getPriorityBadge(suggestion.priority)}
                                </span>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0">
                              -{formatCurrency(suggestion.estimatedSaving)}/mese
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="pl-9 space-y-3">
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                            {suggestion.timeline && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Timeline: {suggestion.timeline}</span>
                              </div>
                            )}
                            {suggestion.steps && suggestion.steps.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Step da seguire:</div>
                                {suggestion.steps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-start gap-2 text-sm">
                                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Breakdown per Categoria
                  </h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    {pieData.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">
                        <div>
                          <PieChart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>Nessuna categoria di spesa disponibile</p>
                          <p className="text-xs mt-1">Sincronizza i conti per importare più transazioni</p>
                        </div>
                      </div>
                    ) : (
                      <>
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
                          {activeData.categoryBreakdown.slice(0, 5).map((category, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              <span className="text-sm truncate flex-1">{category.name}</span>
                              <span className="text-sm text-muted-foreground">{category.percentage.toFixed(0)}%</span>
                              <Progress value={category.percentage} className="w-16 h-2" />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Fornitori per Spesa
                  </h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    {barData.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">
                        <div>
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>Nessun fornitore identificato</p>
                          <p className="text-xs mt-1">I fornitori appariranno con più transazioni</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                            <XAxis type="number" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => barData.find((entry) => entry.name === label)?.fullName || label}
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
                    )}
                  </div>
                </div>
              </div>

              {activeData.aiAnalysis?.supplierAnalysis && activeData.aiAnalysis.supplierAnalysis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analisi Dettagliata Fornitori
                  </h3>
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="divide-y divide-border">
                      {activeData.aiAnalysis.supplierAnalysis.slice(0, 10).map((supplier, i) => (
                        <div key={i} className="p-4 hover:bg-secondary/50">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{supplier.name}</span>
                                {getStatusBadge(supplier.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">{supplier.category}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold">{formatCurrency(supplier.amount)}</div>
                            </div>
                          </div>
                          {supplier.note && (
                            <p className="text-sm text-muted-foreground mt-2">{supplier.note}</p>
                          )}
                          {supplier.recommendation && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                              <Lightbulb className="h-4 w-4" />
                              {supplier.recommendation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeData.aiAnalysis?.actionItems && activeData.aiAnalysis.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    Azioni Prioritarie
                  </h3>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4 space-y-3">
                    {activeData.aiAnalysis.actionItems.map((item, i) => {
                      const isString = typeof item === "string";
                      const action = isString ? item : (item as ActionItem).action;
                      const priority = isString ? undefined : (item as ActionItem).priority;
                      const impact = isString ? undefined : (item as ActionItem).impact;

                      return (
                        <div key={i} className="flex items-start gap-3">
                          <ArrowRight className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{action}</span>
                              {priority && getPriorityBadge(priority)}
                            </div>
                            {impact && (
                              <div className="text-xs text-muted-foreground mt-1">
                                💰 {impact}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeData.aiAnalysis?.summary?.recommendation && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">Raccomandazione Principale</div>
                      <p className="text-sm text-muted-foreground">
                        {activeData.aiAnalysis.summary.recommendation}
                      </p>
                      {activeData.aiAnalysis.summary.mainRisk && (
                        <p className="text-sm text-warning mt-2">
                          ⚠️ Rischio principale: {activeData.aiAnalysis.summary.mainRisk}
                        </p>
                      )}
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
