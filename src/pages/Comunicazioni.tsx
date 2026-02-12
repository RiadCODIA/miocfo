import { useState } from "react";
import { MessageSquare, Filter, Search, Clock, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  category: "sistema" | "alert" | "aggiornamento";
}

const mockMessages: Message[] = [
  {
    id: "1",
    subject: "Nuovo aggiornamento disponibile",
    preview: "È disponibile un aggiornamento con nuove funzionalità per la gestione dei flussi di cassa...",
    date: "2026-02-12",
    read: false,
    category: "aggiornamento",
  },
  {
    id: "2",
    subject: "Promemoria scadenza fiscale",
    preview: "Ricorda che la scadenza per il pagamento IVA del Q4 è prevista per il 16 febbraio...",
    date: "2026-02-10",
    read: false,
    category: "alert",
  },
  {
    id: "3",
    subject: "Benvenuto su mioCFO",
    preview: "Grazie per aver scelto mioCFO. Ecco come iniziare a configurare il tuo account...",
    date: "2026-02-01",
    read: true,
    category: "sistema",
  },
];

const categoryColors: Record<string, string> = {
  sistema: "secondary",
  alert: "destructive",
  aggiornamento: "default",
};

export default function Comunicazioni() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("tutte");

  const filtered = mockMessages.filter((m) => {
    if (tab === "non-lette" && m.read) return false;
    if (search && !m.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunicazioni</h1>
        <p className="text-muted-foreground mt-1">Messaggi, notifiche di sistema e aggiornamenti</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca comunicazioni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tutte">Tutte</TabsTrigger>
          <TabsTrigger value="non-lette">Non lette</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Nessuna comunicazione trovata</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((msg) => (
              <Card key={msg.id} className={msg.read ? "opacity-70" : ""}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground truncate">{msg.subject}</span>
                      {!msg.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={categoryColors[msg.category] as any} className="text-[10px]">
                        {msg.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {msg.date}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
