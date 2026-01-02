import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Invoice } from "./InvoiceTable";
import { supabase } from "@/integrations/supabase/client";

interface InvoicePreviewProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatch: (invoice: Invoice) => void;
}

export function InvoicePreview({ invoice, open, onOpenChange, onMatch }: InvoicePreviewProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Load file when sheet opens
  useEffect(() => {
    if (open && invoice?.filePath) {
      loadFile(invoice.filePath);
    }

    // Cleanup on close or invoice change
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
      setFileError(null);
    };
  }, [open, invoice?.filePath]);

  const loadFile = async (filePath: string) => {
    setIsFileLoading(true);
    setFileError(null);

    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .download(filePath);

      if (error) {
        throw new Error(error.message);
      }

      const objectUrl = URL.createObjectURL(data);
      setFileUrl(objectUrl);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Impossibile caricare il file");
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl && invoice) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = invoice.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

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

  const isPdf = invoice.fileName?.toLowerCase().endsWith('.pdf') || 
                invoice.fileType === 'application/pdf';
  const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(invoice.fileName || '') ||
                  invoice.fileType?.startsWith('image/');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dettaglio Fattura</SheetTitle>
          <SheetDescription>
            Visualizza i dettagli e gestisci l'abbinamento
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* File Preview */}
          <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border overflow-hidden">
            {isFileLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <Skeleton className="w-32 h-4" />
                <p className="text-sm text-muted-foreground">Caricamento file...</p>
              </div>
            ) : fileError ? (
              <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive font-medium">Errore nel caricamento</p>
                <p className="text-xs text-muted-foreground">{fileError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => invoice.filePath && loadFile(invoice.filePath)}
                >
                  Riprova
                </Button>
              </div>
            ) : fileUrl ? (
              isPdf ? (
                <iframe 
                  src={fileUrl} 
                  className="w-full h-full rounded-lg"
                  title={invoice.fileName}
                />
              ) : isImage ? (
                <img 
                  src={fileUrl} 
                  alt={invoice.fileName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{invoice.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Anteprima non disponibile per questo formato
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{invoice.fileName}</p>
              </div>
            )}
          </div>

          {/* Download buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDownload}
              disabled={!fileUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Scarica
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleOpenInNewTab}
              disabled={!fileUrl}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Apri in nuova scheda
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
