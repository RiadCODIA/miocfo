import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeadlines, useDeadlinesSummary, useLiquidityForecast, DeadlineFilters as FilterType, Deadline } from "@/hooks/useDeadlines";
import { DeadlineModal } from "@/components/scadenzario/DeadlineModal";
import { DeadlineFilters } from "@/components/scadenzario/DeadlineFilters";
import { DeadlineList } from "@/components/scadenzario/DeadlineList";
import { LiquidityForecastChart } from "@/components/scadenzario/LiquidityForecastChart";

export default function Scadenzario() {
  const [filters, setFilters] = useState<FilterType>({ status: "all", type: "all" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);

  const { data: deadlines, isLoading: loadingDeadlines } = useDeadlines(filters);
  const { data: summary, isLoading: loadingSummary } = useDeadlinesSummary();
  const { data: forecast, isLoading: loadingForecast } = useLiquidityForecast();

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setIsModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingDeadline(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Scadenzario</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Pianifica incassi e pagamenti futuri per prevedere la liquidità disponibile.
                    Le scadenze alimentano il grafico di proiezione a 30 giorni.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground mt-1">
            Gestisci le scadenze per vedere l'impatto sulla liquidità futura
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Scadenza
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Incassi Previsti</p>
          </div>
          {loadingSummary ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-success">{formatCurrency(summary?.incassiTotali || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary?.incassiCount || 0} scadenze</p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Pagamenti Programmati</p>
          </div>
          {loadingSummary ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summary?.pagamentiTotali || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary?.pagamentiCount || 0} scadenze</p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-muted-foreground">Saldo Minimo Previsto</p>
          </div>
          {loadingForecast ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(forecast?.minBalance || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {forecast?.minBalanceDate ? `Previsto il ${forecast.minBalanceDate}` : "Nessuna previsione"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadline List */}
        <div className="glass rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Scadenze</h3>
            <DeadlineFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          <DeadlineList
            deadlines={deadlines}
            isLoading={loadingDeadlines}
            onEdit={handleEdit}
          />
        </div>

        {/* Liquidity Forecast Chart */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Previsione Liquidità</h3>
            <p className="text-sm text-muted-foreground">Saldo previsto nei prossimi 30 giorni</p>
          </div>
          <div className="h-[380px]">
            <LiquidityForecastChart forecast={forecast?.forecast} isLoading={loadingForecast} />
          </div>
        </div>
      </div>

      {/* Modal */}
      <DeadlineModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        deadline={editingDeadline}
      />
    </div>
  );
}