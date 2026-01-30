import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, TestTube, Building2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  balance: number;
  currency: string;
  status: "active" | "pending" | "error" | "disconnected";
  lastSync: Date;
  source?: "enable_banking" | "powens" | "manual";
}

interface BankAccountCardProps {
  account: BankAccount;
  onSync: (id: string) => void;
  onTest: (id: string) => void;
  onRemove: (id: string) => void;
  onReconnect?: (id: string) => void;
}

export function BankAccountCard({ account, onSync, onTest, onRemove, onReconnect }: BankAccountCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

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

  const handleReconnect = async () => {
    if (!onReconnect) return;
    setIsReconnecting(true);
    try {
      await onReconnect(account.id);
    } catch {
      // Error is handled externally
    } finally {
      setTimeout(() => setIsReconnecting(false), 1500);
    }
  };

  const statusConfig = {
    active: { label: "Attivo", variant: "default" as const, className: "bg-success text-success-foreground" },
    pending: { label: "In sincronizzazione", variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
    error: { label: "Riconnessione richiesta", variant: "destructive" as const, className: "bg-destructive text-destructive-foreground" },
    disconnected: { label: "Disconnesso", variant: "destructive" as const, className: "bg-muted text-muted-foreground" },
  };

  const status = statusConfig[account.status];

  const isManual = account.source === "manual";
  const isConnected = account.source === "enable_banking" || account.source === "powens";

  return (
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
              {isManual ? "Manuale" : "Enable Banking"}
            </Badge>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Saldo attuale</p>
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
            {/* Reconnect button for error/disconnected status */}
            {!isManual && (account.status === "error" || account.status === "disconnected") && onReconnect && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                <Link2 className={cn("h-4 w-4 mr-1", isReconnecting && "animate-pulse")} />
                Ricollega
              </Button>
            )}
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
  );
}
