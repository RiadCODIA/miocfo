import { useState } from "react";
import { Download, FileText, BarChart3, TrendingUp, Percent, Clock, Loader2, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useKPIData } from "@/hooks/useKPIData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AIReportSection, type AIReport } from "@/components/area-economica/AIReportSection";
import { useNavigate } from "react-router-dom";

const getKPIIcon = (id: string, categoria: string) => {
  const colorClass = categoria === "standard" ? "text-primary" : "text-warning";
  switch (id) {
    case "roi":
    case "burn_rate":
    case "revenue_growth":
      return <TrendingUp className={cn("h-4 w-4", colorClass)} />;
    case "dso":
      return <Clock className={cn("h-4 w-4", colorClass)} />;
    case "current_ratio":
    case "ltv_cac":
      return <BarChart3 className={cn("h-4 w-4", colorClass)} />;
    case "margine_operativo":
      return <Percent className={cn("h-4 w-4", colorClass)} />;
    default:
      return <BarChart3 className={cn("h-4 w-4", colorClass)} />;
  }
};

export default function KPIReport() {
  const { data, isLoading } = useKPIData();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();

  const handleExport = () => {
    if (!data) return;
    const csvContent = [
      ["KPI", "Valore", "Target", "Raggiunto", "Trend"].join(","),
      ...data.kpis.map(kpi => [kpi.nome, kpi.valore, kpi.target, kpi.raggiunto ? "Sì" : "No", kpi.trend].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report esportato con successo");
  };

  const handleAIAnalysis = async () => {
    if (!data?.kpis.length) {
      toast.error("Nessun dato KPI disponibile per l'analisi");
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPI & Report</h1>
          <p className="text-muted-foreground mt-1">Indicatori calcolati dai tuoi dati bancari reali</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KPI & Report</h1>
            <p className="text-muted-foreground mt-1">
              Indicatori calcolati in tempo reale dalle tue {data?.transactionCount ?? 0} transazioni bancarie
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/flussi-cassa")} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Flussi di Cassa
            </Button>
            <Button onClick={handleAIAnalysis} disabled={aiLoading || !kpis.length} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Analisi AI
            </Button>
          </div>
        </div>
      </div>

      {/* AI Report */}
      {aiReport && (
        <div>
          <AIReportSection report={aiReport} />
        </div>
      )}

      {/* KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Indicatori Chiave</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">Standard</Badge>
            <Badge variant="outline" className="border-warning/50 text-warning">Personalizzati</Badge>
          </div>
        </div>

        {kpis.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun dato disponibile per calcolare i KPI</p>
            <p className="text-sm text-muted-foreground mt-1">Aggiungi transazioni bancarie per visualizzare gli indicatori</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.id}
                className="glass rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      kpi.categoria === "standard" ? "bg-primary/10" : "bg-warning/10"
                    )}>
                      {getKPIIcon(kpi.id, kpi.categoria)}
                    </div>
                    <span className="text-sm text-muted-foreground">{kpi.nome}</span>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    kpi.raggiunto ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {kpi.raggiunto ? "✓ Target" : "✗ Target"}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.valore}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">Target: {kpi.target}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    kpi.raggiunto ? "text-success" : "text-destructive"
                  )}>
                    {kpi.trend}
                  </span>
                </div>
                <Progress value={kpi.progressValue} className="mt-3 h-1.5 bg-secondary" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="glass rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Esporta Report</h3>
          <p className="text-sm text-muted-foreground">Scarica i KPI attuali in formato CSV</p>
        </div>
        <Button onClick={handleExport} disabled={!kpis.length} className="gap-2">
          <Download className="h-4 w-4" />
          Esporta CSV
        </Button>
      </div>
    </div>
  );
}
