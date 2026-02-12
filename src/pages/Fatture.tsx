import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Euro,
  Sparkles,
  Loader2,
  Users,
  ShieldCheck,
  Download,
} from "lucide-react";
import { InvoiceUploadZone, UploadedInvoice } from "@/components/fatture/InvoiceUploadZone";
import { InvoiceTable, Invoice } from "@/components/fatture/InvoiceTable";
import { InvoiceMatchingModal } from "@/components/fatture/InvoiceMatchingModal";
import { InvoicePreview } from "@/components/fatture/InvoicePreview";
import { CassettoFiscaleModal } from "@/components/fatture/CassettoFiscaleModal";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DbInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  client_name: string | null;
  amount: number;
  vat_amount: number | null;
  total_amount: number;
  invoice_type: string;
  payment_status: string | null;
  matched_transaction_id: string | null;
  file_name: string | null;
  file_path: string | null;
  due_date: string | null;
  category_id: string | null;
  extracted_data: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Transform database invoice to frontend format
function transformInvoice(dbInvoice: DbInvoice): Invoice {
  const matchStatus = dbInvoice.matched_transaction_id ? "matched" 
    : dbInvoice.payment_status === "discrepancy" ? "discrepancy" 
    : "pending";
    
  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoice_number || "",
    date: dbInvoice.invoice_date ? new Date(dbInvoice.invoice_date) : new Date(),
    supplier: dbInvoice.vendor_name || dbInvoice.client_name || "N/A",
    amount: Number(dbInvoice.total_amount || dbInvoice.amount),
    matchStatus: matchStatus as "matched" | "pending" | "discrepancy",
    matchedTransactionId: dbInvoice.matched_transaction_id || undefined,
    fileName: dbInvoice.file_name || "",
    filePath: dbInvoice.file_path || "",
    fileType: null,
  };
}

export default function Fatture() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCassettoModalOpen, setIsCassettoModalOpen] = useState(false);
  const [connectedFiscalId, setConnectedFiscalId] = useState<string | null>(null);
  const [isFetchingCassetto, setIsFetchingCassetto] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices from database
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DbInvoice[]).map(transformInvoice);
    },
  });

  // Upload mutation - upload diretto a Storage poi process
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      // UUID valido per utenti demo (non autenticati)
      const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000';
      
      const uploadResults = [];
      
      for (const file of files) {
        // 1. Upload diretto a Supabase Storage
        const storagePath = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(storagePath, file, {
            contentType: file.type || 'application/octet-stream'
          });

        if (uploadError) {
          throw new Error(`Errore upload ${file.name}: ${uploadError.message}`);
        }

        // 2. Chiama edge function per processare il file già caricato
        const response = await fetch(
          'https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/process-invoice',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token 
                ? { 'Authorization': `Bearer ${session.access_token}` }
                : {}),
            },
            body: JSON.stringify({
              storagePath,
              fileName: file.name,
              fileType: file.type,
              userId
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore durante l\'elaborazione');
        }

        const result = await response.json();
        uploadResults.push(result);
      }

      return {
        processed: uploadResults.length,
        total_invoices: uploadResults.reduce((sum, r) => sum + (r.invoices_count || 1), 0),
        results: uploadResults
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Fatture elaborate",
        description: `${data.total_invoices} fatture estratte da ${data.processed} file.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (files: File[]) => {
    const newUploads: UploadedInvoice[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    try {
      // Update status to processing
      setUploadingFiles((prev) =>
        prev.map((f) =>
          newUploads.some(u => u.id === f.id) ? { ...f, status: "processing" as const } : f
        )
      );

      await uploadMutation.mutateAsync(files);

      // Clear upload queue on success
      setUploadingFiles((prev) =>
        prev.filter((f) => !newUploads.some(u => u.id === f.id))
      );
    } catch (error) {
      // Mark as error
      setUploadingFiles((prev) =>
        prev.map((f) =>
          newUploads.some(u => u.id === f.id) ? { ...f, status: "error" as const } : f
        )
      );
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

  const handleConfirmMatch = async (invoiceId: string, transactionId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          match_status: 'matched',
          matched_transaction_id: transactionId 
        })
        .eq('id', invoiceId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      toast({
        title: "Abbinamento confermato",
        description: "La fattura è stata abbinata alla transazione.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare l'abbinamento.",
        variant: "destructive",
      });
    }
  };

  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    
    toast({
      title: "Abbinamento automatico",
      description: "Analisi delle fatture in corso...",
    });

    try {
      // Fetch bank transactions for matching
      const { data: transactions } = await supabase
        .from('bank_transactions')
        .select('*')
        .order('date', { ascending: false });

      const pendingInvoices = invoices.filter(i => i.matchStatus === 'pending');
      let matchedCount = 0;

      for (const invoice of pendingInvoices) {
        // Find matching transaction by amount (within 1% tolerance)
        const matchingTx = transactions?.find(tx => {
          const amountDiff = Math.abs(Math.abs(Number(tx.amount)) - invoice.amount);
          const tolerance = invoice.amount * 0.01;
          return amountDiff <= tolerance;
        });

        if (matchingTx) {
          const { error } = await supabase
            .from('invoices')
            .update({ 
              match_status: 'matched',
              matched_transaction_id: matchingTx.id 
            })
            .eq('id', invoice.id);

          if (!error) matchedCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({
        title: "Abbinamento completato",
        description: matchedCount > 0 
          ? `${matchedCount} fatture abbinate automaticamente.`
          : "Nessuna corrispondenza trovata. Prova l'abbinamento manuale.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'abbinamento automatico.",
        variant: "destructive",
      });
    } finally {
      setIsAutoMatching(false);
    }
  };

  const handleReprocess = async (invoice: Invoice) => {
    setReprocessingId(invoice.id);
    
    try {
      const response = await fetch(
        'https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/process-invoice',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reprocessInvoiceId: invoice.id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il riprocessamento');
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({
        title: "Fattura riprocessata",
        description: `${result.invoice?.supplier_name || 'Fattura'} - €${result.invoice?.amount?.toFixed(2) || 0}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il riprocessamento",
        variant: "destructive",
      });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Sei sicuro di voler eliminare la fattura ${invoice.invoiceNumber}?`)) {
      return;
    }

    setDeletingId(invoice.id);
    
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .remove([invoice.filePath]);

      if (storageError) {
        console.warn('Errore eliminazione file:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({
        title: "Fattura eliminata",
        description: `La fattura ${invoice.invoiceNumber} è stata eliminata.`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'eliminazione",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const totalInvoices = invoices.length;
  const matchedCount = invoices.filter((i) => i.matchStatus === "matched").length;
  const pendingCount = invoices.filter((i) => i.matchStatus === "pending").length;
  const discrepancyCount = invoices.filter((i) => i.matchStatus === "discrepancy").length;
  const unreconciled = invoices
    .filter((i) => i.matchStatus !== "matched")
    .reduce((sum, i) => sum + i.amount, 0);

  // Supplier summary
  const supplierSummary = invoices.reduce((acc, inv) => {
    if (!acc[inv.supplier]) {
      acc[inv.supplier] = { count: 0, total: 0 };
    }
    acc[inv.supplier].count++;
    acc[inv.supplier].total += inv.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const topSuppliers = Object.entries(supplierSummary)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const handleFetchFromCassetto = async () => {
    if (!connectedFiscalId) return;
    setIsFetchingCassetto(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // First trigger download
      await fetch(
        "https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-cassetto-fiscale",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ action: "download-now", fiscal_id: connectedFiscalId }),
        }
      );

      // Then fetch invoices into DB
      const response = await fetch(
        "https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-cassetto-fiscale",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ action: "fetch-invoices", fiscal_id: connectedFiscalId }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore durante il download");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      toast({
        title: "Fatture importate",
        description: `${result.imported || 0} nuove fatture importate dal Cassetto Fiscale.`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCassetto(false);
    }
  };

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
        <div className="flex flex-wrap gap-2">
          {connectedFiscalId ? (
            <Button
              variant="outline"
              onClick={handleFetchFromCassetto}
              disabled={isFetchingCassetto}
            >
              {isFetchingCassetto ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Scarica dal Cassetto
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsCassettoModalOpen(true)}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Collega Cassetto Fiscale
            </Button>
          )}
          <Button onClick={handleAutoMatch} disabled={isAutoMatching || pendingCount === 0}>
            {isAutoMatching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Abbina automaticamente
          </Button>
        </div>
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "-" : totalInvoices}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "-" : matchedCount}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "-" : pendingCount}
                </p>
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
                  {isLoading ? "-" : new Intl.NumberFormat("it-IT", {
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

      {/* Supplier Summary */}
      {topSuppliers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Riepilogo per Fornitore</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topSuppliers.map(([supplier, data]) => (
                <div key={supplier} className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-sm text-foreground truncate" title={supplier}>
                    {supplier}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("it-IT", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(data.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.count} fattur{data.count === 1 ? 'a' : 'e'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        onReprocess={handleReprocess}
        onDelete={handleDelete}
        reprocessingId={reprocessingId}
        deletingId={deletingId}
        isLoading={isLoading}
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

      <CassettoFiscaleModal
        open={isCassettoModalOpen}
        onOpenChange={setIsCassettoModalOpen}
        onConnected={(fid) => setConnectedFiscalId(fid)}
      />
    </div>
  );
}
