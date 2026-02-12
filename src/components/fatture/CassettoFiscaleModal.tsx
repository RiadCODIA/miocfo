import { useState } from "react";
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
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CassettoFiscaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (fiscalId: string) => void;
}

export function CassettoFiscaleModal({
  open,
  onOpenChange,
  onConnected,
}: CassettoFiscaleModalProps) {
  const [fiscalId, setFiscalId] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fiscalId || !password || !pin) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci codice fiscale, password e PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        "https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-cassetto-fiscale",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            action: "setup",
            fiscal_id: fiscalId.replace(/\s/g, "").toUpperCase(),
            password,
            pin,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore durante il collegamento");
      }

      toast({
        title: "Cassetto Fiscale collegato",
        description: "Le credenziali sono state salvate. Puoi ora scaricare le fatture.",
      });

      onConnected(fiscalId.replace(/\s/g, "").toUpperCase());
      onOpenChange(false);
      setPassword("");
      setPin("");
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Collega Cassetto Fiscale
          </DialogTitle>
          <DialogDescription>
            Inserisci le credenziali Fisconline per collegare il tuo Cassetto
            Fiscale e importare automaticamente le fatture dall'Agenzia delle
            Entrate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fiscalId">Codice Fiscale / Partita IVA</Label>
            <Input
              id="fiscalId"
              value={fiscalId}
              onChange={(e) => setFiscalId(e.target.value)}
              placeholder="Es. RSSMRA80A01H501U o 01234567890"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password Agenzia delle Entrate</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Fisconline"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN Fisconline</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN Fisconline"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Le credenziali vengono inviate in modo sicuro ad A-Cube che le
              cripta e gestisce il rinnovo automatico. Non vengono mai salvate
              nel nostro database.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Collega
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
