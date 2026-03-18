import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUPABASE_URL = "https://yzhonmuhywdiqaxxbnsj.supabase.co";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ciao! Sono il tuo CFO virtuale. Posso analizzare i tuoi **conti bancari**, **transazioni**, **fatture**, **scadenze** e **budget** reali. Chiedimi qualsiasi cosa sui tuoi dati finanziari!",
};

export default function AIAssistant() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAssistantBlocked, usage } = useAIUsage();
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (isAssistantBlocked) {
      toast.error("Limite mensile raggiunto", {
        description: "Hai esaurito i messaggi AI inclusi nel tuo piano.",
      });
      return;
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const historyForAI = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      const content = assistantContent;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id !== "welcome") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { id: crypto.randomUUID(), role: "assistant", content }];
      });
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error("Non autenticato", { description: "Effettua il login per usare l'assistente AI." });
        setIsStreaming(false);
        return;
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY",
        },
        body: JSON.stringify({ messages: historyForAI }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Errore sconosciuto" }));
        if (resp.status === 429) {
          toast.error("Rate limit", { description: "Troppe richieste. Riprova tra poco." });
        } else if (resp.status === 403) {
          toast.error("Limite mensile raggiunto", { description: err.error || "Hai esaurito i messaggi AI del tuo piano." });
        } else {
          toast.error("Errore", { description: err.error || "Errore nella risposta AI." });
        }
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (const raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            // noop
          }
        }
      }
    } catch (e) {
      console.error("AI Assistant error:", e);
      toast.error("Errore di connessione", { description: "Impossibile contattare l'assistente AI." });
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
    }
  }, [input, isStreaming, messages, isAssistantBlocked, queryClient]);

  const used = usage?.assistantMessagesUsed ?? 0;
  const limit = usage?.assistantMessagesLimit ?? 0;
  const remaining = usage?.assistantMessagesRemaining ?? 0;

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">Il tuo CFO virtuale — risposte basate esclusivamente sui tuoi dati reali</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Messaggi AI del mese</p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{used} / {limit}</span> usati · {remaining} rimanenti
          </p>
        </div>
      </div>

      {isAssistantBlocked && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Hai raggiunto il limite mensile dei messaggi AI.</p>
              <p className="text-xs text-muted-foreground">Piano attuale: {used} / {limit} messaggi usati questo mese.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/pricing")}>Upgrade piano</Button>
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:bg-muted-foreground/10 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:border [&_th]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs [&_td]:border [&_td]:border-border [&_strong]:text-primary [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ol]:my-1.5 [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1.5 [&_hr]:my-3 [&_hr]:border-border">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analizzo i tuoi dati...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              placeholder={isAssistantBlocked ? "Hai raggiunto il limite mensile del tuo piano..." : "Chiedimi dei tuoi dati finanziari..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isStreaming || isAssistantBlocked}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isStreaming || isAssistantBlocked}>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          {isAssistantBlocked && (
            <p className="text-xs text-destructive mt-2 text-center">
              Limite mensile raggiunto. <button onClick={() => navigate("/pricing")} className="underline font-medium">Passa a un piano superiore</button>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
