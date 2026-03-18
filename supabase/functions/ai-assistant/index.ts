import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_LIMITS = {
  small: { messages: 50 },
  pro: { messages: 60 },
  full: { messages: 100 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messaggio non valido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select(`plan_id, subscription_plans(name, ai_assistant_messages_limit_monthly)`)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const planName = String((subscription?.subscription_plans as any)?.name || "small").toLowerCase();
    const defaultLimit = DEFAULT_LIMITS[planName as keyof typeof DEFAULT_LIMITS]?.messages ?? DEFAULT_LIMITS.small.messages;
    const assistantLimit = Number((subscription?.subscription_plans as any)?.ai_assistant_messages_limit_monthly ?? defaultLimit);

    const { data: existingUsage } = await supabase
      .from("ai_usage_monthly")
      .select("id, assistant_messages_used")
      .eq("user_id", userId)
      .eq("month_year", currentMonthYear)
      .maybeSingle();

    const assistantMessagesUsed = Number(existingUsage?.assistant_messages_used || 0);
    if (assistantMessagesUsed >= assistantLimit) {
      return new Response(
        JSON.stringify({
          error: `Hai raggiunto il limite mensile di ${assistantLimit} messaggi AI del tuo piano.`,
          blocked: true,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [accountsRes, transactionsRes, invoicesRes, deadlinesRes, budgetsRes] = await Promise.all([
      supabase.from("bank_accounts").select("name, bank_name, balance, currency, iban").eq("user_id", userId),
      supabase
        .from("bank_transactions")
        .select("date, amount, description, category, merchant_name, transaction_type")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(100),
      supabase
        .from("invoices")
        .select("invoice_number, invoice_type, amount, total_amount, vat_amount, client_name, vendor_name, due_date, payment_status, invoice_date")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("deadlines").select("title, due_date, amount, status, priority, deadline_type").eq("user_id", userId).order("due_date", { ascending: true }).limit(30),
      supabase.from("budgets").select("name, amount, start_date, end_date, period_type, is_active").eq("user_id", userId),
    ]);

    const accounts = accountsRes.data || [];
    const transactions = transactionsRes.data || [];
    const invoices = invoicesRes.data || [];
    const deadlines = deadlinesRes.data || [];
    const budgets = budgetsRes.data || [];

    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const contextParts: string[] = [];

    contextParts.push(`## Conti Bancari (${accounts.length})\nSaldo totale: €${totalBalance.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`);
    if (accounts.length) contextParts.push(accounts.map((a) => `- ${a.name} (${a.bank_name}): €${Number(a.balance || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })} ${a.currency || "EUR"}`).join("\n"));

    contextParts.push(`\n## Ultime Transazioni (${transactions.length})`);
    if (transactions.length) {
      const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      contextParts.push(`Entrate totali: €${income.toLocaleString("it-IT", { minimumFractionDigits: 2 })}\nUscite totali: €${expenses.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`);
      contextParts.push(transactions.slice(0, 30).map((t) => `- ${t.date} | €${t.amount} | ${t.description || t.merchant_name || "N/A"} | ${t.category || "non categorizzata"}`).join("\n"));
    }

    contextParts.push(`\n## Fatture (${invoices.length})`);
    if (invoices.length) {
      const unpaid = invoices.filter((i) => i.payment_status !== "paid");
      contextParts.push(`Non pagate: ${unpaid.length}`);
      contextParts.push(invoices.slice(0, 20).map((i) => `- ${i.invoice_number || "N/A"} | ${i.invoice_type} | €${i.total_amount} | ${i.client_name || i.vendor_name || "N/A"} | Scadenza: ${i.due_date || "N/A"} | Stato: ${i.payment_status || "N/A"}`).join("\n"));
    }

    contextParts.push(`\n## Scadenze (${deadlines.length})`);
    if (deadlines.length) contextParts.push(deadlines.slice(0, 15).map((d) => `- ${d.title} | Scadenza: ${d.due_date} | €${d.amount || 0} | Stato: ${d.status} | Priorità: ${d.priority}`).join("\n"));

    contextParts.push(`\n## Budget (${budgets.length})`);
    if (budgets.length) contextParts.push(budgets.map((b) => `- ${b.name}: €${b.amount} | ${b.period_type} | ${b.is_active ? "Attivo" : "Inattivo"}`).join("\n"));

    const systemPrompt = `Sei il CFO virtuale dell'utente sulla piattaforma mioCFO. Il tuo compito è analizzare ESCLUSIVAMENTE i dati finanziari reali dell'utente forniti qui sotto e rispondere alle sue domande.

REGOLE FONDAMENTALI:
1. Rispondi SOLO basandoti sui dati forniti. NON inventare mai dati, numeri o informazioni.
2. Se non hai dati sufficienti per rispondere, dillo chiaramente.
3. Se la domanda non riguarda i dati finanziari della piattaforma, rispondi: "Posso aiutarti solo con i dati finanziari presenti sulla piattaforma mioCFO."
4. Rispondi SEMPRE in italiano.
5. Sii conciso e professionale.

REGOLE DI FORMATTAZIONE (OBBLIGATORIE):
- Usa tabelle markdown per dati tabulari.
- Usa titoli e bullet point per rendere la risposta leggibile.
- Evidenzia KPI e importi chiave in grassetto.

--- DATI DELL'UTENTE ---
${contextParts.join("\n")}
--- FINE DATI ---`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    if (existingUsage?.id) {
      await supabase
        .from("ai_usage_monthly")
        .update({
          assistant_messages_used: assistantMessagesUsed + 1,
          is_blocked: assistantMessagesUsed + 1 >= assistantLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("ai_usage_monthly").insert({
        user_id: userId,
        month_year: currentMonthYear,
        assistant_messages_used: 1,
        transaction_analyses_used: 0,
        is_blocked: 1 >= assistantLimit,
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
