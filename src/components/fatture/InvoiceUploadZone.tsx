import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit per Supabase Storage

export interface UploadedInvoice {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  extractedData?: {
    invoiceNumber: string;
    date: Date;
    amount: number;
    supplier: string;
  };
  status: "uploading" | "processing" | "ready" | "error";
  errorMessage?: string;
}

interface InvoiceUploadZoneProps {
  onUpload: (files: File[]) => void;
  uploadingFiles: UploadedInvoice[];
  onRemoveFile: (id: string) => void;
}

export function InvoiceUploadZone({ onUpload, uploadingFiles, onRemoveFile }: InvoiceUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const invalidFiles: { name: string; size: number }[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({ name: file.name, size: file.size });
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "File troppo grandi",
        description: `${invalidFiles.map(f => f.name).join(", ")} supera il limite di 50MB.`,
        variant: "destructive",
      });
    }

    return validFiles;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [onUpload, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    }
  }, [onUpload, toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusMessages = {
    uploading: "Caricamento...",
    processing: "Elaborazione...",
    ready: "Pronto",
    error: "Errore",
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          id="invoice-upload"
          accept=".pdf,.png,.jpg,.jpeg,.csv,.zip"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="invoice-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Trascina qui le tue fatture
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                oppure <span className="text-primary underline">sfoglia i file</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
            PDF, CSV, ZIP, PNG, JPG fino a 50MB
            </p>
          </div>
        </label>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span className={cn(
                        file.status === "ready" && "text-success",
                        file.status === "error" && "text-destructive"
                      )}>
                        {statusMessages[file.status]}
                      </span>
                    </div>
                  </div>
                  {(file.status === "uploading" || file.status === "processing") && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
