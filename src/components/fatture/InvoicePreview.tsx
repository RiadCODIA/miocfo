import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Calendar,
  Hash,
  Building2,
  Euro,
  Link2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Invoice } from "./InvoiceTable";
import { cn } from "@/lib/utils";

interface InvoicePreviewProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatch: (invoice: Invoice) => void;
}

export function InvoicePreview({ invoice, open, onOpenChange, onMatch }: InvoicePreviewProps) {
  if (!invoice) return null;

  const statusConfig = {
    matched: {
      label: "Abbinata",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    pending: {
      label: "In attesa",
      icon: Clock,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    discrepancy: {
      label: "Discrepanza",
      icon: AlertTriangle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const status = statusConfig[invoice.matchStatus];
  const StatusIcon = status.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Dettaglio Fattura</SheetTitle>
          <SheetDescription>
            Visualizza i dettagli e gestisci l'abbinamento
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* PDF Preview Placeholder */}
          <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{invoice.fileName}</p>
            <Button variant="outline" size="sm" className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Scarica PDF
            </Button>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Dati estratti</h4>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Numero fattura</span>
                </div>
                <span className="font-medium font-mono">{invoice.invoiceNumber}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Data</span>
                </div>
                <span className="font-medium">
                  {invoice.date.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Fornitore</span>
                </div>
                <span className="font-medium">{invoice.supplier}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Euro className="h-4 w-4" />
                  <span>Importo</span>
                </div>
                <span className="font-medium text-lg">
                  {new Intl.NumberFormat("it-IT", {
                    style: "currency",
                    currency: "EUR",
                  }).format(invoice.amount)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Match Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Stato abbinamento</h4>
              <Badge variant="outline" className={status.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            {invoice.matchStatus === "matched" && invoice.matchedTransactionId && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  Abbinata alla transazione <span className="font-mono font-medium">#{invoice.matchedTransactionId}</span>
                </p>
              </div>
            )}

            {invoice.matchStatus !== "matched" && (
              <Button className="w-full" onClick={() => onMatch(invoice)}>
                <Link2 className="h-4 w-4 mr-2" />
                Abbina a transazione
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
