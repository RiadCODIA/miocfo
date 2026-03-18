import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, DollarSign, Percent, Clock, Wallet, Info, Settings2, Loader2, Brain, CalendarRange, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useKPIData, useKPITargets, useUpdateKPITargets, type KPIPeriod, type KPIResult } from "@/hooks/useKPIData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AIReportSection, type AIReport } from "@/components/area-economica/AIReportSection";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAIUsage } from "@/hooks/useAIUsage";

const KPI_ICONS: Record<string, React.ReactNode> = {
  ricavi: <DollarSign className="h-5 w-5" />,
  primo_margine: <Percent className="h-5 w-5" />,
  ebitda: <BarChart3 className="h-5 w-5" />,
  cashflow: <Wallet className="h-5 w-5" />,
  dso: <Clock className="h-5 w-5" />,
  dpo: <Clock className="h-5 w-5" />,
};

const KPI_COLORS: Record<string, string> = {
  ricavi: "bg-primary/10 text-primary",
  primo_margine: "bg-success/10 text-success",
  ebitda: "bg-warning/10 text-warning",
  cashflow: "bg-primary/10 text-primary",
  dso: "bg-destructive/10 text-destructive",
  dpo: "bg-muted text-muted-foreground",
};

function KPICard({ kpi }: { kpi: KPIResult }) {
  const isPositiveTrend = kpi.trend !== null && kpi.trend >= 0;
  const isGoodTrend = kpi.id === "dso" || kpi.id === "dpo"
    ? kpi.trend !== null && kpi.trend <= 0
    : isPositiveTrend;

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-2 rounded-lg", KPI_COLORS[kpi.id] || "bg-muted text-muted-foreground")}>
            {KPI_ICONS[kpi.id] || <BarChart3 className="h-5 w-5" />}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
        </div>
        {kpi.trend !== null && (
          <Badge className={cn(
            "text-xs gap-1",
            isGoodTrend
              ? "bg-success/10 text-success border-success/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {isPositiveTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {kpi.trend >= 0 ? "+" : ""}{kpi.trend.toFixed(1)}{kpi.unit === "%" || kpi.unit === "giorni" ? "" : "%"}
          </Badge>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
      <p className="text-xs text-muted-foreground">{kpi.trendLabel}</p>
      {kpi.note && (
        <div className="flex items-start gap-1.5 pt-1">
          <Info className="h-3 w-3 text-muted-foreground/60 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground/70 leading-tight">{kpi.note}</p>
        </div>
      )}
    </div>
  );
}

export default function KPIReport() {
  const [period, setPeriod] = useState<KPIPeriod>("year");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarStep, setCalendarStep] = useState<"from" | "to">("from");

  const { data, isLoading } = useKPIData(period, customFrom, customTo);
  const { data: targets } = useKPITargets();
  const updateTargets = useUpdateKPITargets();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [editTargets, setEditTargets] = useState<Record<string, number>>({});
  const { isBlocked } = useAIUsage();

  const handlePeriodChange = (v: string) => {
    if (v !== "custom") {
      setCustomFrom(undefined);
      setCustomTo(undefined);
    }
    setPeriod(v as KPIPeriod);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    if (calendarStep === "from") {
      setCustomFrom(date);
      setCalendarStep("to");
    } else {
      setCustomTo(date);
      setCalendarOpen(false);
      setCalendarStep("from");
      setPeriod("custom");
    }
  };

  const clearCustomRange = () => {
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setPeriod("year");
    setCalendarStep("from");
  };

  const customRangeLabel = customFrom && customTo
    ? `${format(customFrom, "dd MMM yyyy", { locale: it })} – ${format(customTo, "dd MMM yyyy", { locale: it })}`
    : customFrom
    ? `Dal ${format(customFrom, "dd MMM yyyy", { locale: it })} — seleziona fine`
    : null;

  const handleAIAnalysis = async () => {
    if (!data?.kpis.length) {
      toast.error("Nessun dato KPI disponibile per l'analisi");
      return;
    }
    if (isBlocked) {
      toast.error("Limite AI raggiunto", { description: "Hai raggiunto il limite mensile AI del tuo piano." });
      return;
    }
    setAiLoading(true);
    try {
      const { data: report, error } = await supabase.functions.invoke("analyze-kpi", {
        body: { kpis: data.kpis },
      });
      if (error) throw error;
      if (report?.error) throw new Error(report.error);
      setAiReport(report);
      toast.success("Analisi AI completata");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Errore nell'analisi AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenTargetModal = () => {
    setEditTargets(targets ? { ...targets } : {});
    setTargetModalOpen(true);
  };

  const handleSaveTargets = async () => {
    try {
      await updateTargets.mutateAsync(editTargets);
      setTargetModalOpen(false);
      toast.success("Target aggiornati");
    } catch {
      toast.error("Errore nel salvataggio dei target");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dati & Statistiche</h1>
          <p className="text-muted-foreground mt-1">6 KPI aggiornati in tempo reale</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dati & Statistiche</h1>
          <p className="text-muted-foreground mt-1">
            {customRangeLabel && customFrom && customTo
              ? <span className="text-primary font-medium">{customRangeLabel}</span>
              : "Indicatori calcolati in tempo reale da fatture e transazioni bancarie"
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mese corrente</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Anno corrente</SelectItem>
              <SelectItem value="custom">Personalizzato</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          {(period === "custom" || customFrom) && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-2 h-9 text-sm", customFrom && customTo && "border-primary text-primary")}
                >
                  <CalendarRange className="h-4 w-4" />
                  {customFrom && customTo
                    ? `${format(customFrom, "dd/MM/yy")} – ${format(customTo, "dd/MM/yy")}`
                    : customFrom
                    ? `Dal ${format(customFrom, "dd/MM/yy")}…`
                    : "Seleziona intervallo"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 text-sm font-medium text-muted-foreground border-b border-border">
                  {calendarStep === "from" ? "Seleziona data inizio" : "Seleziona data fine"}
                </div>
                <Calendar
                  mode="single"
                  selected={calendarStep === "from" ? customFrom : customTo}
                  onSelect={handleCalendarSelect}
                  disabled={calendarStep === "to" && customFrom ? { before: customFrom } : undefined}
                  locale={it}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {customFrom && customTo && (
            <Button variant="ghost" size="sm" onClick={clearCustomRange} className="h-9 px-2 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleOpenTargetModal} className="gap-2">
            <Settings2 className="h-4 w-4" />
            Target
          </Button>
          <Button size="sm" onClick={handleAIAnalysis} disabled={aiLoading || !kpis.length || isBlocked} className="gap-2">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analisi AI
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      {kpis.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nessun dato disponibile per calcolare i KPI</p>
          <p className="text-sm text-muted-foreground mt-1">Aggiungi fatture o transazioni per visualizzare gli indicatori</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="glass rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p>· <strong>KPI 1-2-3</strong> (Ricavi, Primo Margine, EBITDA) usano logica di <strong>competenza</strong> (data fattura)</p>
        <p>· <strong>KPI 4</strong> (Cash Flow) usa logica di <strong>cassa</strong> (data movimento bancario)</p>
        <p>· <strong>KPI 5-6</strong> (DSO, DPO) usano la scadenza contrattuale, non il pagamento effettivo</p>
        <p>· Se Ricavi = 0, i KPI percentuali mostrano "N/D"</p>
      </div>

      {/* AI Report */}
      {aiReport && <AIReportSection report={aiReport} />}

      {/* Target Modal */}
      <Dialog open={targetModalOpen} onOpenChange={setTargetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Target KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-foreground flex-1">Target Ricavi (€)</label>
              <Input
                type="number"
                className="w-32 text-right"
                value={editTargets.ricavi ?? ""}
                onChange={(e) => setEditTargets(prev => ({ ...prev, ricavi: Number(e.target.value) }))}
                placeholder="es. 500000"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-foreground flex-1">Target Cash Flow (€)</label>
              <Input
                type="number"
                className="w-32 text-right"
                value={editTargets.cashflow ?? ""}
                onChange={(e) => setEditTargets(prev => ({ ...prev, cashflow: Number(e.target.value) }))}
                placeholder="es. 100000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetModalOpen(false)}>Annulla</Button>
            <Button onClick={handleSaveTargets} disabled={updateTargets.isPending}>
              {updateTargets.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
