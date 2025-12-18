import { Download, FileText, BarChart3, TrendingUp, Percent, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const kpiData = [
  { id: "roi", nome: "ROI", valore: "18.5%", target: "15%", raggiunto: true, trend: "+2.3%", categoria: "standard" },
  { id: "dso", nome: "DSO (Days Sales Outstanding)", valore: "42 giorni", target: "45 giorni", raggiunto: true, trend: "-3 giorni", categoria: "standard" },
  { id: "current_ratio", nome: "Current Ratio", valore: "2.1", target: "1.5", raggiunto: true, trend: "+0.3", categoria: "standard" },
  { id: "margine_operativo", nome: "Margine Operativo", valore: "31.8%", target: "28%", raggiunto: true, trend: "+4.2%", categoria: "standard" },
  { id: "burn_rate", nome: "Burn Rate Mensile", valore: "€52.000", target: "€60.000", raggiunto: true, trend: "-8.000", categoria: "personalizzato" },
  { id: "ltv_cac", nome: "LTV/CAC Ratio", valore: "4.2", target: "3.0", raggiunto: true, trend: "+0.8", categoria: "personalizzato" },
];

const reports = [
  { id: 1, nome: "Report Mensile Dicembre 2024", tipo: "Mensile", dataCreazione: "01/12/2024", stato: "completato" },
  { id: 2, nome: "Report Trimestrale Q4 2024", tipo: "Trimestrale", dataCreazione: "01/10/2024", stato: "in elaborazione" },
  { id: 3, nome: "Report Annuale 2024", tipo: "Annuale", dataCreazione: "01/01/2024", stato: "programmato" },
  { id: 4, nome: "Report Cashflow Novembre", tipo: "Mensile", dataCreazione: "01/11/2024", stato: "completato" },
];

export default function KPIReport() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiData.map((kpi, index) => (
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
                    {kpi.id === "roi" && <TrendingUp className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
                    {kpi.id === "dso" && <Clock className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
                    {kpi.id === "current_ratio" && <BarChart3 className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
                    {kpi.id === "margine_operativo" && <Percent className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
                    {kpi.id === "burn_rate" && <TrendingUp className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
                    {kpi.id === "ltv_cac" && <BarChart3 className={cn("h-4 w-4", kpi.categoria === "standard" ? "text-primary" : "text-warning")} />}
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
                  kpi.trend.startsWith("+") || kpi.trend.startsWith("-") && !kpi.trend.includes("giorni") && kpi.raggiunto ? "text-success" : "text-muted-foreground"
                )}>
                  {kpi.trend}
                </span>
              </div>
              <Progress value={kpi.raggiunto ? 100 : 75} className="mt-3 h-1.5 bg-secondary" />
            </div>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Report Periodici</h3>
            <p className="text-sm text-muted-foreground">Cronologia e stato dei report generati</p>
          </div>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
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
