import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestLog {
  id: string;
  timestamp: Date;
  status: "success" | "error" | "pending";
  message: string;
  details?: string;
}

export function ConnectionTestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TestLog[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 3600000),
      status: "success",
      message: "Connessione API GoCardless verificata",
      details: "Latenza: 145ms",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 7200000),
      status: "success",
      message: "Sincronizzazione transazioni completata",
      details: "42 nuove transazioni importate",
    },
  ]);

  const runTest = async () => {
    setIsRunning(true);
    
    // Add pending log
    const pendingLog: TestLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      status: "pending",
      message: "Test connessione in corso...",
    };
    setLogs((prev) => [pendingLog, ...prev]);

    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update with result
    const success = Math.random() > 0.2;
    setLogs((prev) => [
      {
        id: pendingLog.id,
        timestamp: new Date(),
        status: success ? "success" : "error",
        message: success
          ? "Connessione API GoCardless verificata"
          : "Errore connessione API",
        details: success
          ? `Latenza: ${Math.floor(Math.random() * 200 + 50)}ms`
          : "Timeout - verifica le credenziali API",
      },
      ...prev.slice(1),
    ]);

    setIsRunning(false);
  };

  const statusIcons = {
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
    pending: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Test Connessione GoCardless</CardTitle>
        <Button onClick={runTest} disabled={isRunning} size="sm">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Esegui Test
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun test eseguito
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                {statusIcons[log.status]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                      {log.message}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.timestamp.toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
