import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompleteDeadline, Deadline } from "@/hooks/useDeadlines";
import { toast } from "sonner";
import { useState } from "react";

interface OverdueEntry {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  source: "manual" | "invoice";
  invoiceId: string | null;
  type: "incasso" | "pagamento";
}

interface OverdueTableProps {
  title: string;
  entries: OverdueEntry[];
  type: "incasso" | "pagamento";
  emptyMessage: string;
  isLoading?: boolean;
}

export function OverdueTable({ title, entries, type, emptyMessage, isLoading }: OverdueTableProps) {
  const completeDeadline = useCompleteDeadline();
  const isIncasso = type === "incasso";
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async (entry: OverdueEntry) => {
    const deadline: Deadline = {
      id: entry.id,
      title: entry.title,
      description: null,
      type: entry.type,
      amount: entry.amount,
      dueDate: entry.dueDate,
      status: "overdue",
      invoiceId: entry.invoiceId,
      source: entry.source,
    };

    setCompletingId(entry.id);
    completeDeadline.mutate(deadline, {
      onSuccess: () => {
        toast.success(isIncasso ? "Incasso registrato" : "Pagamento registrato");
        setCompletingId(null);
      },
      onError: () => {
        toast.error("Errore durante il completamento");
        setCompletingId(null);
      },
    });
  };

  const formatCurrency = (value: number) => `€${Math.abs(value).toLocaleString("it-IT")}`;

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-1 max-h-[220px] overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors text-sm"
            >
              <div className="shrink-0" title={isIncasso ? "Segna come incassato" : "Segna come pagato"}>
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleComplete(entry)}
                  disabled={completingId === entry.id}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-foreground">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  Scad. {format(new Date(entry.dueDate), "dd MMM yyyy", { locale: it })}
                </p>
              </div>
              <span className={`font-semibold whitespace-nowrap ${isIncasso ? "text-success" : "text-destructive"}`}>
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
