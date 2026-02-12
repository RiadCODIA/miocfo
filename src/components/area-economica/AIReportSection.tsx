import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticalArea {
  area: string;
  description: string;
  severity: "alta" | "media" | "bassa";
}

interface Suggestion {
  title: string;
  description: string;
  priority: "alta" | "media" | "bassa";
  timeline: string;
}

export interface AIReport {
  healthScore: number;
  healthLabel: string;
  summary: string;
  marginTrend: string;
  criticalAreas: CriticalArea[];
  suggestions: Suggestion[];
  forecasts: string;
}

const severityColor = (s: string) => {
  if (s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
};

const priorityColor = (p: string) => {
  if (p === "alta") return "text-destructive";
  if (p === "media") return "text-amber-500";
  return "text-muted-foreground";
};

const scoreColor = (s: number) => {
  if (s >= 80) return "text-success";
  if (s >= 60) return "text-amber-500";
  return "text-destructive";
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "positivo") return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === "negativo") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function AIReportSection({ report }: { report: AIReport }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Analisi AI - CFO Virtuale</h3>
      </div>

      {/* Score + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Score Salute Economica</p>
            <p className={cn("text-4xl font-bold", scoreColor(report.healthScore))}>{report.healthScore}</p>
            <Badge variant="outline" className="mt-2">{report.healthLabel}</Badge>
            <Progress value={report.healthScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendIcon trend={report.marginTrend} />
              <p className="text-sm font-medium">Trend Margini: <span className="capitalize">{report.marginTrend}</span></p>
            </div>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Previsioni</p>
            </div>
            <p className="text-sm text-muted-foreground">{report.forecasts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Areas */}
      {report.criticalAreas?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Aree Critiche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.criticalAreas.map((area, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant={severityColor(area.severity) as any} className="mt-0.5 shrink-0">{area.severity}</Badge>
                <div>
                  <p className="text-sm font-medium">{area.area}</p>
                  <p className="text-xs text-muted-foreground">{area.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {report.suggestions?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Suggerimenti Operativi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.suggestions.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{s.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", priorityColor(s.priority))}>
                      {s.priority}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{s.timeline}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
