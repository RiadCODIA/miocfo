import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Euro,
  Sparkles,
} from "lucide-react";
import { InvoiceUploadZone, UploadedInvoice } from "@/components/fatture/InvoiceUploadZone";
import { InvoiceTable, Invoice } from "@/components/fatture/InvoiceTable";
import { InvoiceMatchingModal } from "@/components/fatture/InvoiceMatchingModal";
import { InvoicePreview } from "@/components/fatture/InvoicePreview";
import { useToast } from "@/hooks/use-toast";

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "FT-2024-001",
    date: new Date("2024-01-15"),
    supplier: "ABC Forniture Srl",
    amount: 1250.00,
    matchStatus: "matched",
    matchedTransactionId: "TRX-001",
    fileName: "fattura_abc_001.pdf",
  },
  {
    id: "2",
    invoiceNumber: "FT-2024-002",
    date: new Date("2024-01-18"),
    supplier: "XYZ Servizi SpA",
    amount: 3450.00,
    matchStatus: "pending",
    fileName: "fattura_xyz_002.pdf",
  },
  {
    id: "3",
    invoiceNumber: "FT-2024-003",
    date: new Date("2024-01-20"),
    supplier: "Tech Solutions",
    amount: 890.50,
    matchStatus: "discrepancy",
    fileName: "fattura_tech_003.pdf",
  },
  {
    id: "4",
    invoiceNumber: "FT-2024-004",
    date: new Date("2024-01-22"),
    supplier: "Office Pro",
    amount: 567.00,
    matchStatus: "pending",
    fileName: "fattura_office_004.pdf",
  },
  {
    id: "5",
    invoiceNumber: "FT-2024-005",
    date: new Date("2024-01-25"),
    supplier: "Marketing Agency",
    amount: 2100.00,
    matchStatus: "matched",
    matchedTransactionId: "TRX-005",
    fileName: "fattura_marketing_005.pdf",
  },
];

export default function Fatture() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (files: File[]) => {
    const newUploads: UploadedInvoice[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    // Simulate upload and processing
    for (const upload of newUploads) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === upload.id ? { ...f, status: "processing" as const } : f
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create extracted invoice
      const extractedInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `FT-2024-${String(invoices.length + 1).padStart(3, "0")}`,
        date: new Date(),
        supplier: "Nuovo Fornitore",
        amount: Math.random() * 5000 + 100,
        matchStatus: "pending",
        fileName: upload.fileName,
      };

      setInvoices((prev) => [extractedInvoice, ...prev]);
      setUploadingFiles((prev) => prev.filter((f) => f.id !== upload.id));

      toast({
        title: "Fattura elaborata",
        description: `${upload.fileName} è stata caricata e i dati sono stati estratti.`,
      });
    }
  };

  const handleRemoveUpload = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleMatch = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsMatchingOpen(true);
  };

  const handleConfirmMatch = (invoiceId: string, transactionId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, matchStatus: "matched" as const, matchedTransactionId: transactionId }
          : inv
      )
    );
    toast({
      title: "Abbinamento confermato",
      description: "La fattura è stata abbinata alla transazione.",
    });
  };

  const handleAutoMatch = async () => {
    toast({
      title: "Abbinamento automatico",
      description: "Analisi delle fatture in corso...",
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate auto-matching some invoices
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.matchStatus === "pending" && Math.random() > 0.5
          ? { ...inv, matchStatus: "matched" as const, matchedTransactionId: `TRX-AUTO-${Date.now()}` }
          : inv
      )
    );

    toast({
      title: "Abbinamento completato",
      description: "Le fatture compatibili sono state abbinate automaticamente.",
    });
  };

  // Stats
  const totalInvoices = invoices.length;
  const matchedCount = invoices.filter((i) => i.matchStatus === "matched").length;
  const pendingCount = invoices.filter((i) => i.matchStatus === "pending").length;
  const discrepancyCount = invoices.filter((i) => i.matchStatus === "discrepancy").length;
  const unreconciled = invoices
    .filter((i) => i.matchStatus !== "matched")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fatture</h1>
          <p className="text-muted-foreground mt-1">
            Carica e gestisci le fatture ricevute
          </p>
        </div>
        <Button onClick={handleAutoMatch}>
          <Sparkles className="h-4 w-4 mr-2" />
          Abbina automaticamente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale fatture</p>
                <p className="text-2xl font-bold text-foreground">{totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abbinate</p>
                <p className="text-2xl font-bold text-foreground">{matchedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In attesa</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Euro className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non riconciliato</p>
                <p className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("it-IT", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(unreconciled)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zone */}
      <InvoiceUploadZone
        onUpload={handleUpload}
        uploadingFiles={uploadingFiles}
        onRemoveFile={handleRemoveUpload}
      />

      {/* Invoice Table */}
      <InvoiceTable
        invoices={invoices}
        onView={handleView}
        onMatch={handleMatch}
      />

      {/* Modals */}
      <InvoicePreview
        invoice={selectedInvoice}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onMatch={handleMatch}
      />

      <InvoiceMatchingModal
        invoice={selectedInvoice}
        open={isMatchingOpen}
        onOpenChange={setIsMatchingOpen}
        onMatch={handleConfirmMatch}
      />
    </div>
  );
}
