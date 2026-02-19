import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, TestTube, Building2, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  balance: number;
  currency: string;
  status: "active" | "pending" | "error" | "disconnected";
  lastSync: Date;
  source?: "enable_banking" | "powens" | "manual" | "acube";
}

export interface DebugResult {
  account_id?: string;
  enable_banking_uid?: string;
  acube_account_id?: string;
  psu_context?: { ip: string | null; userAgent: string | null };
  test_results?: Array<{
    variant: string;
    params: Record<string, string>;
    status: number | string;
    body: unknown;
    success: boolean;
  }>;
  account?: unknown;
}

interface BankAccountCardProps {
  account: BankAccount;
  onSync: (id: string) => void;
  onTest: (id: string) => void;
  onRemove: (id: string) => void;
  onDebug?: (id: string) => Promise<DebugResult>;
}

export function BankAccountCard({ account, onSync, onTest, onRemove, onDebug }: BankAccountCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const maskIban = (iban: string) => {
    if (iban.length < 8) return iban;
    return iban.slice(0, 4) + " •••• •••• " + iban.slice(-4);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(account.id);
    } catch {
      // Error is handled in the hook, just catch to prevent unhandled rejection
    } finally {
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTest(account.id);
    } catch {
      // Error is handled in the hook
    } finally {
      setTimeout(() => setIsTesting(false), 1500);
    }
  };

  const handleDebug = async () => {
    if (!onDebug) return;
    
    setIsDebugging(true);
    try {
      const result = await onDebug(account.id);
      setDebugResult(result);
      setShowDebugModal(true);
    } catch (error) {
      console.error("Debug failed:", error);
    } finally {
      setIsDebugging(false);
    }
  };

  const statusConfig = {
    active: { label: "Attivo", variant: "default" as const, className: "bg-success text-success-foreground" },
    pending: { label: "In sincronizzazione", variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
    error: { label: "Errore sincronizzazione", variant: "destructive" as const, className: "bg-destructive text-destructive-foreground" },
    disconnected: { label: "Disconnesso", variant: "destructive" as const, className: "bg-muted text-muted-foreground" },
  };

  const status = statusConfig[account.status] || statusConfig.active;

  const isManual = account.source === "manual";
  const providerLabel = account.source === "acube" ? "Enable Banking" : account.source === "enable_banking" ? "Enable Banking" : account.source === "powens" ? "Powens" : "Manuale";
  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{account.bankName}</h3>
                <p className="text-sm text-muted-foreground font-mono">{maskIban(account.iban)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={isManual ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}
              >
                {providerLabel}
              </Badge>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponibile</p>
              <p className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("it-IT", {
                  style: "currency",
                  currency: account.currency,
                }).format(account.balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ultimo aggiornamento: {account.lastSync.toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Retry sync button for error status (temporary bank issue) */}
              {!isManual && account.status === "error" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1", isSyncing && "animate-spin")} />
                  Riprova
                </Button>
              )}
              {/* Normal sync/test buttons for active/pending status */}
              {!isManual && account.status !== "error" && account.status !== "disconnected" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1", isSyncing && "animate-spin")} />
                    Sincronizza
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={isTesting}
                  >
                    <TestTube className={cn("h-4 w-4 mr-1", isTesting && "animate-pulse")} />
                    Testa
                  </Button>
                </>
              )}
              {/* Debug button for troubleshooting (all connected accounts) */}
              {!isManual && onDebug && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDebug}
                  disabled={isDebugging}
                  title="Diagnostica API"
                >
                  <Bug className={cn("h-4 w-4", isDebugging && "animate-pulse")} />
                </Button>
              )}
              {isManual && (
                <span className="text-xs text-muted-foreground self-center mr-2">
                  Importato da file
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(account.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Results Modal */}
      <Dialog open={showDebugModal} onOpenChange={setShowDebugModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Diagnostica API Transazioni</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {debugResult && (
              <div className="space-y-4 p-4">
                <div className="text-sm space-y-1">
                  <p><strong>Account ID:</strong> {debugResult.account_id || "N/A"}</p>
                  {debugResult.enable_banking_uid && (
                    <p><strong>Enable Banking UID:</strong> {debugResult.enable_banking_uid}</p>
                  )}
                  {debugResult.acube_account_id && (
                    <p><strong>Enable Banking Account ID:</strong> {debugResult.acube_account_id}</p>
                  )}
                  {debugResult.psu_context && (
                    <>
                      <p><strong>PSU IP:</strong> {debugResult.psu_context.ip || "non rilevato"}</p>
                      <p><strong>User Agent:</strong> {debugResult.psu_context.userAgent || "non rilevato"}</p>
                    </>
                  )}
                  {debugResult.account && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40 mt-2">
                      {JSON.stringify(debugResult.account, null, 2)}
                    </pre>
                  )}
                </div>

                {debugResult.test_results && debugResult.test_results.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Risultati Test:</h4>
                    <div className="space-y-3">
                      {debugResult.test_results.map((result, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-3 rounded-lg border",
                            result.success ? "bg-success/10 border-success" : "bg-destructive/10 border-destructive"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{result.variant}</span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Params: {JSON.stringify(result.params)}
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(result.body, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
