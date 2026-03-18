import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Loader2, CheckCircle, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Deadline, useCompleteDeadline, useUncompleteDeadline, useDeleteDeadline } from "@/hooks/useDeadlines";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeadlineListProps {
  deadlines: Deadline[] | undefined;
  isLoading: boolean;
  onEdit: (deadline: Deadline) => void;
}

export function DeadlineList({ deadlines, isLoading, onEdit }: DeadlineListProps) {
  const completeMutation = useCompleteDeadline();
  const uncompleteMutation = useUncompleteDeadline();
  const deleteMutation = useDeleteDeadline();
  const [deleteTarget, setDeleteTarget] = useState<Deadline | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today && status === "pending";

    if (status === "completed") {
      return <Badge variant="outline" className="border-success/50 text-success">Saldato</Badge>;
    }
    if (isOverdue || status === "overdue") {
      return <Badge variant="outline" className="border-destructive/50 text-destructive">Scaduto</Badge>;
    }
    if (status === "pending") {
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 5) {
        return <Badge variant="outline" className="border-warning/50 text-warning">In scadenza</Badge>;
      }
      return <Badge variant="outline" className="border-primary/50 text-primary">Programmato</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const handleToggleSaldato = async (deadline: Deadline) => {
    setTogglingId(deadline.id);
    try {
      if (deadline.status === "completed") {
        await uncompleteMutation.mutateAsync(deadline);
        toast.success("Scadenza riaperta", {
          description: `${deadline.title} - ${formatCurrency(deadline.amount)}`,
        });
      } else {
        await completeMutation.mutateAsync(deadline);
        toast.success(deadline.type === "incasso" ? "Incasso registrato" : "Pagamento completato", {
          description: `${deadline.title} - ${formatCurrency(deadline.amount)}`,
        });
      }
    } catch (error) {
      toast.error("Errore", {
        description: "Impossibile aggiornare lo stato della scadenza",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Scadenza eliminata", {
        description: deleteTarget.description,
      });
    } catch (error) {
      toast.error("Errore", {
        description: "Impossibile eliminare la scadenza",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!deadlines?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-3 text-success/50" />
        <p className="text-sm font-medium">Nessuna scadenza trovata</p>
        <p className="text-xs mt-1">Usa il bottone "Nuova Scadenza" per aggiungerne una</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-[500px] overflow-hidden">
      <ScrollArea className="h-full">
      <div className="space-y-3 pr-3">
        {deadlines.map((deadline, index) => {
          const dueDate = new Date(deadline.dueDate);
          const isCompleted = deadline.status === "completed";
          const isFromInvoice = deadline.source === "invoice";
          const isToggling = togglingId === deadline.id;

          return (
            <div
              key={deadline.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-secondary/50 opacity-0 animate-slide-in",
                deadline.type === "incasso" ? "border-success/20" : "border-destructive/20",
                isCompleted && "opacity-60"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Checkbox Saldato */}
              <div className="shrink-0 flex items-center" title={isCompleted ? "Segna come non saldato" : "Segna come saldato"}>
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleToggleSaldato(deadline)}
                  disabled={isToggling}
                  className={cn(
                    "h-5 w-5",
                    isCompleted && "data-[state=checked]:bg-success data-[state=checked]:border-success"
                  )}
                />
              </div>

              <div className={cn(
                "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0",
                deadline.type === "incasso" ? "bg-success/10" : "bg-destructive/10"
              )}>
                <span className="text-xs text-muted-foreground">
                  {format(dueDate, "MMM", { locale: it })}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  deadline.type === "incasso" ? "text-success" : "text-destructive"
                )}>
                  {format(dueDate, "dd")}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium text-foreground truncate",
                  isCompleted && "line-through"
                )}>
                  {deadline.title || deadline.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {deadline.type === "incasso" ? (
                    <ArrowDownLeft className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{deadline.type}</span>
                  {isFromInvoice && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary gap-0.5">
                      <FileText className="h-2.5 w-2.5" />
                      Fattura
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right mr-2">
                <p className={cn(
                  "font-semibold",
                  deadline.type === "incasso" ? "text-success" : "text-destructive"
                )}>
                  {deadline.type === "incasso" ? "+" : "-"}{formatCurrency(deadline.amount)}
                </p>
                {getStatusBadge(deadline.status, deadline.dueDate)}
              </div>

              <div className="flex items-center gap-1">
                {!isFromInvoice && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(deadline)}
                      title="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(deadline)}
                      disabled={deleteMutation.isPending}
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </ScrollArea>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa scadenza?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deleteTarget?.description}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
