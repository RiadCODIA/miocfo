import { Download, FileText, BarChart3, TrendingUp, Percent, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useKPIData } from "@/hooks/useKPIData";
import { toast } from "sonner";

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPI & Report</h1>
          <p className="text-muted-foreground mt-1">Indicatori sintetici e reportistica</p>
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
  const reports = data?.reports || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">KPI & Report</h1>
        <p className="text-muted-foreground mt-1">
          Indicatori sintetici e reportistica
        </p>
      </div>

      {/* KPI Grid */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
            {kpis.map((kpi, index) => (
              <div
                key={kpi.id}
                className="glass rounded-xl p-5 opacity-0 animate-fade-in"
                style={{ animationDelay: `${150 + index * 50}ms` }}
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

      {/* Reports List */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Report Periodici</h3>
            <p className="text-sm text-muted-foreground">Cronologia e stato dei report generati</p>
          </div>
          <Button onClick={handleExport} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        </div>
        <div className="divide-y divide-border">
          {reports.map((report, index) => (
            <div
              key={report.id}
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors opacity-0 animate-slide-in"
              style={{ animationDelay: `${500 + index * 50}ms` }}
            >
              <div className="p-2.5 rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{report.nome}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="text-xs border-border">{report.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">Creato: {report.dataCreazione}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "text-xs",
                  report.stato === "completato" && "bg-success/10 text-success border-success/20",
                  report.stato === "in elaborazione" && "bg-warning/10 text-warning border-warning/20",
                  report.stato === "programmato" && "bg-primary/10 text-primary border-primary/20"
                )}>
                  {report.stato}
                </Badge>
                {report.stato === "completato" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={handleExport}>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
