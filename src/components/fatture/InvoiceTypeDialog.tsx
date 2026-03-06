import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type InvoiceType = "emessa" | "ricevuta" | "autofattura";

interface InvoiceTypeDialogProps {
  open: boolean;
  onConfirm: (type: InvoiceType) => void;
  onCancel: () => void;
  fileCount: number;
}

const options: { value: InvoiceType; label: string; description: string; icon: typeof FileUp }[] = [
  {
    value: "ricevuta",
    label: "Fattura ricevuta (acquisto)",
    description: "Ricevuta da un fornitore — IVA a credito",
    icon: FileDown,
  },
  {
    value: "emessa",
    label: "Fattura emessa (vendita)",
    description: "Emessa da te verso un cliente — IVA a debito",
    icon: FileUp,
  },
  {
    value: "autofattura",
    label: "Autofattura",
    description: "Autofattura per reverse charge o acquisti esteri",
    icon: FileText,
  },
];

export function InvoiceTypeDialog({ open, onConfirm, onCancel, fileCount }: InvoiceTypeDialogProps) {
  const [selected, setSelected] = useState<InvoiceType>("ricevuta");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tipo di fattura</DialogTitle>
          <DialogDescription>
            {fileCount === 1
              ? "Che tipo di fattura stai caricando?"
              : `Che tipo sono le ${fileCount} fatture che stai caricando?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-md flex items-center justify-center shrink-0",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button onClick={() => onConfirm(selected)}>Continua</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
