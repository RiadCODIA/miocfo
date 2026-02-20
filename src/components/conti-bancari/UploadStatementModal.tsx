import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

interface ProcessResult {
  account: {
    id: string;
    bank_name: string;
    iban: string | null;
    balance: number;
    currency: string;
  };
  transactions_count: number;
  period?: { from: string; to: string };
}

export function UploadStatementModal({
  open,
  onOpenChange,
  onSuccess,
}: UploadStatementModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setBankName("");
    setReplaceExisting(true);
    setUploadState("idle");
    setError(null);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (uploadState !== "uploading" && uploadState !== "processing") {
      resetState();
      onOpenChange(false);
    }
  }, [uploadState, resetState, onOpenChange]);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "text/csv",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = ["csv", "pdf", "png", "jpg", "jpeg", "webp", "xls", "xlsx"];

    if (file.size > maxSize) {
      setError("Il file supera la dimensione massima di 10MB");
      return false;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(ext) && !allowedTypes.includes(file.type)) {
      setError("Formato file non supportato. Usa PDF, CSV o immagini.");
      return false;
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setError(null);
    setUploadState("uploading");

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Devi effettuare il login per caricare file");
      }

      // Upload file to storage
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const fileName = `${session.user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("bank-statements")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Errore nel caricamento del file");
      }

      setUploadState("processing");

      // Process the file
      const { data, error: processError } = await supabase.functions.invoke(
        "process-bank-statement",
        {
          body: {
            file_path: fileName,
            bank_name: bankName || undefined,
            replace_existing: replaceExisting,
          },
        }
      );

      if (processError) {
        console.error("Process error:", processError);
        // Try to extract the real error message from the response body
        let errorMessage = "Errore nell'elaborazione del file";
        try {
          // processError.context contains the raw response
          const ctx = (processError as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) errorMessage = body.error;
          }
        } catch {
          // fallback to generic message
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setUploadState("success");

      toast({
        title: "Estratto conto importato",
        description: `${data.transactions_count} transazioni importate con successo`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      setUploadState("error");
    }
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Carica Estratto Conto</DialogTitle>
          <DialogDescription>
            Carica un file PDF, CSV o immagine del tuo estratto conto per importare
            automaticamente le transazioni.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Upload Zone - only show in idle state */}
          {uploadState === "idle" && (
            <>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  file && "border-success bg-success/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("statement-file-input")?.click()}
              >
                <input
                  id="statement-file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.csv,.png,.jpg,.jpeg,.webp,.xls,.xlsx"
                  onChange={handleFileSelect}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-success" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Trascina qui il tuo estratto conto oppure{" "}
                      <span className="text-primary font-medium">sfoglia</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, CSV, PNG, JPG (max 10MB)
                    </p>
                  </>
                )}
              </div>

              {/* Bank Name Input */}
              <div className="space-y-2">
                <Label htmlFor="bank-name">Nome Banca (opzionale)</Label>
                <Input
                  id="bank-name"
                  placeholder="es. Intesa Sanpaolo, UniCredit..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se non specificato, verrà estratto automaticamente dal documento.
                </p>
              </div>

              {/* Replace Existing Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="replace-existing" className="font-medium">
                      Sostituisci import precedente
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elimina i conti importati manualmente e le relative transazioni prima di importare
                  </p>
                </div>
                <Switch
                  id="replace-existing"
                  checked={replaceExisting}
                  onCheckedChange={setReplaceExisting}
                />
              </div>
            </>
          )}

          {/* Processing State */}
          {(uploadState === "uploading" || uploadState === "processing") && (
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="font-medium text-foreground">
                {uploadState === "uploading"
                  ? "Caricamento file..."
                  : "Elaborazione in corso..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {uploadState === "processing" &&
                  "Estrazione transazioni con AI, potrebbe richiedere qualche secondo."}
              </p>
            </div>
          )}

          {/* Success State */}
          {uploadState === "success" && result && (
            <div className="py-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-center text-foreground mb-4">
                Importazione completata!
              </h3>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banca:</span>
                  <span className="font-medium text-foreground">
                    {result.account.bank_name}
                  </span>
                </div>
                {result.account.iban && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN:</span>
                    <span className="font-mono text-foreground text-sm">
                      {result.account.iban}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transazioni importate:</span>
                  <span className="font-medium text-foreground">
                    {result.transactions_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("it-IT", {
                      style: "currency",
                      currency: result.account.currency,
                    }).format(result.account.balance)}
                  </span>
                </div>
                {result.period && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periodo:</span>
                    <span className="text-foreground text-sm">
                      {result.period.from} → {result.period.to}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            {uploadState === "idle" && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Annulla
                </Button>
                <Button onClick={handleUpload} disabled={!file}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importa
                </Button>
              </>
            )}

            {uploadState === "error" && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Chiudi
                </Button>
                <Button onClick={resetState}>Riprova</Button>
              </>
            )}

            {uploadState === "success" && (
              <Button onClick={handleFinish}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Chiudi
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
