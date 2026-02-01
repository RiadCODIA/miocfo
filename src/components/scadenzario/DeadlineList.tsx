import { ArrowDownLeft, ArrowUpRight, Check, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Deadline, useCompleteDeadline, useDeleteDeadline } from "@/hooks/useDeadlines";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const completeMutation = useCompleteDeadline();
  const deleteMutation = useDeleteDeadline();
  const [deleteTarget, setDeleteTarget] = useState<Deadline | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today && status === "pending";

    if (status === "completed") {
      return <Badge variant="outline" className="border-success/50 text-success">Completato</Badge>;
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

  const handleComplete = async (deadline: Deadline) => {
    setCompletingId(deadline.id);
    try {
      await completeMutation.mutateAsync(deadline.id);
      toast({
        title: deadline.type === "incasso" ? "Incasso registrato" : "Pagamento completato",
        description: `${deadline.description} - ${formatCurrency(deadline.amount)}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile completare la scadenza",
        variant: "destructive",
      });
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "Scadenza eliminata",
        description: deleteTarget.description,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la scadenza",
        variant: "destructive",
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
      <div className="space-y-3">
        {deadlines.map((deadline, index) => {
          const dueDate = new Date(deadline.dueDate);
          const isCompleted = deadline.status === "completed";

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
                  {deadline.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {deadline.type === "incasso" ? (
                    <ArrowDownLeft className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{deadline.type}</span>
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
                {!isCompleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                    onClick={() => handleComplete(deadline)}
                    disabled={completingId === deadline.id}
                    title="Segna come completato"
                  >
                    {completingId === deadline.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                )}
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
              </div>
            </div>
          );
        })}
      </div>

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
