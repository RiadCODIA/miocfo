import { useState, useEffect, useRef } from "react";
import { Download, FileText, BarChart3, TrendingUp, Percent, Clock, Loader2, Brain, ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useKPIData, useKPITargets, useUpdateKPITargets } from "@/hooks/useKPIData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AIReportSection, type AIReport } from "@/components/area-economica/AIReportSection";
import { useNavigate } from "react-router-dom";
import miocfoLogo from "@/assets/miocfo-logo.png";

const KPI_LABELS: Record<string, { label: string; unit: string }> = {
  ros: { label: "ROS (Return on Sales)", unit: "%" },
  dso: { label: "DSO (Days Sales Outstanding)", unit: " giorni" },
  current_ratio: { label: "Current Ratio", unit: "" },
  margine_operativo: { label: "Margine Operativo", unit: "%" },
  burn_rate: { label: "Burn Rate Mensile", unit: " €" },
  revenue_growth: { label: "Crescita Ricavi", unit: "%" },
};

const getKPIIcon = (id: string, categoria: string) => {
  const colorClass = categoria === "standard" ? "text-primary" : "text-warning";
  switch (id) {
    case "ros":
    case "burn_rate":
    case "revenue_growth":
      return <TrendingUp className={cn("h-4 w-4", colorClass)} />;
    case "dso":
      return <Clock className={cn("h-4 w-4", colorClass)} />;
    case "current_ratio":
      return <BarChart3 className={cn("h-4 w-4", colorClass)} />;
    case "margine_operativo":
      return <Percent className={cn("h-4 w-4", colorClass)} />;
    default:
      return <BarChart3 className={cn("h-4 w-4", colorClass)} />;
  }
};

export default function KPIReport() {
  const { data, isLoading } = useKPIData();
  const { data: targets } = useKPITargets();
  const updateTargets = useUpdateKPITargets();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [editTargets, setEditTargets] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch AI summary when KPIs load
  useEffect(() => {
    if (data?.kpis?.length && !aiSummary && !summaryLoading) {
      setSummaryLoading(true);
      supabase.functions.invoke("analyze-kpi", {
        body: { kpis: data.kpis, mode: "summary" },
      }).then(({ data: result, error }) => {
        if (!error && result?.summary) {
          setAiSummary(result.summary);
        }
      }).finally(() => setSummaryLoading(false));
    }
  }, [data?.kpis?.length]);

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

  const handleDownloadPDF = () => {
    if (!aiReport) {
      toast.error("Genera prima l'Analisi AI per scaricare il PDF");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup bloccato dal browser");
      return;
    }

    const kpiRows = data?.kpis.map(k => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${k.nome}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${k.valore}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${k.target}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:${k.raggiunto ? '#16a34a' : '#dc2626'}">${k.raggiunto ? '✓ Raggiunto' : '✗ Non raggiunto'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${k.trend}</td>
      </tr>
    `).join("") || "";

    const criticalHtml = aiReport.criticalAreas?.map(a =>
      `<li><strong>${a.area}</strong> (${a.severity}): ${a.description}</li>`
    ).join("") || "";

    const suggestionsHtml = aiReport.suggestions?.map(s =>
      `<li><strong>${s.title}</strong> [${s.priority}]: ${s.description} (${s.timeline})</li>`
    ).join("") || "";

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Report KPI - MioCFO</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
        .header img { height: 40px; }
        .header h1 { font-size: 22px; color: #2563eb; margin: 0; }
        .header .date { margin-left: auto; color: #666; font-size: 14px; }
        h2 { color: #2563eb; font-size: 18px; margin-top: 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; padding: 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 13px; }
        .score { display: inline-block; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 18px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 6px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <img src="${miocfoLogo}" alt="MioCFO" />
        <h1>Report Analisi KPI</h1>
        <span class="date">${new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>

      <h2>Panoramica</h2>
      <p>Health Score: <span class="score" style="background:${aiReport.healthScore >= 70 ? '#dcfce7;color:#16a34a' : aiReport.healthScore >= 40 ? '#fef9c3;color:#ca8a04' : '#fee2e2;color:#dc2626'}">${aiReport.healthScore}/100 - ${aiReport.healthLabel}</span></p>
      <p>${aiReport.summary}</p>

      <h2>KPI Dettaglio</h2>
      <table>
        <thead><tr><th>KPI</th><th>Valore</th><th>Target</th><th>Stato</th><th>Trend</th></tr></thead>
        <tbody>${kpiRows}</tbody>
      </table>

      ${criticalHtml ? `<h2>Aree Critiche</h2><ul>${criticalHtml}</ul>` : ""}
      ${suggestionsHtml ? `<h2>Suggerimenti</h2><ul>${suggestionsHtml}</ul>` : ""}
      ${aiReport.forecasts ? `<h2>Previsioni</h2><p>${aiReport.forecasts}</p>` : ""}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPI & Report</h1>
          <p className="text-muted-foreground mt-1">Indicatori calcolati dai tuoi dati reali</p>
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
              Indicatori calcolati in tempo reale dai tuoi dati finanziari
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenTargetModal} className="gap-2">
              <Settings2 className="h-4 w-4" />
              Modifica Target
            </Button>
            <Button onClick={handleAIAnalysis} disabled={aiLoading || !kpis.length} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Analisi AI
            </Button>
          </div>
        </div>
      </div>

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
            <p className="text-sm text-muted-foreground mt-1">Aggiungi transazioni o fatture per visualizzare gli indicatori</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="glass rounded-xl p-5">
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

      {/* AI Summary */}
      {summaryLoading && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generazione sommario AI...</span>
          </div>
        </div>
      )}
      {aiSummary && !summaryLoading && (
        <div className="glass rounded-xl p-5 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Sommario AI</span>
          </div>
          <p className="text-sm text-muted-foreground">{aiSummary}</p>
        </div>
      )}

      {/* AI Report */}
      {aiReport && (
        <div>
          <AIReportSection report={aiReport} />
        </div>
      )}

      {/* Download PDF */}
      <div className="glass rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Scarica Report</h3>
          <p className="text-sm text-muted-foreground">
            {aiReport ? "Scarica il report AI completo in formato PDF" : "Genera prima l'Analisi AI per scaricare il PDF"}
          </p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={!aiReport} className="gap-2">
          <Download className="h-4 w-4" />
          Scarica PDF
        </Button>
      </div>

      {/* Target Modal */}
      <Dialog open={targetModalOpen} onOpenChange={setTargetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Target KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {Object.entries(KPI_LABELS).map(([id, { label, unit }]) => (
              <div key={id} className="flex items-center justify-between gap-4">
                <label className="text-sm text-foreground flex-1">{label}</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="w-28 text-right"
                    value={editTargets[id] ?? ""}
                    onChange={(e) => setEditTargets(prev => ({ ...prev, [id]: Number(e.target.value) }))}
                  />
                  <span className="text-xs text-muted-foreground w-8">{unit}</span>
                </div>
              </div>
            ))}
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
