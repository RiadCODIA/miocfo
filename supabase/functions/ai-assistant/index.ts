import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role client with user's token to verify identity
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // ── AI Usage Block Check ──────────────────────────────────────────────
    const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data: aiUsage } = await supabase
      .from('ai_usage_monthly')
      .select('cost_accumulated, credit_recharged')
      .eq('user_id', userId)
      .eq('month_year', currentMonthYear)
      .maybeSingle();

    if (aiUsage) {
      let planLimit = 5;
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      if (subData?.plan_id) {
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('ai_monthly_limit_eur')
          .eq('id', subData.plan_id)
          .single();
        if (planData?.ai_monthly_limit_eur) planLimit = Number(planData.ai_monthly_limit_eur);
      }
      const budgetAvailable = planLimit + Number(aiUsage.credit_recharged || 0);
      if (Number(aiUsage.cost_accumulated || 0) >= budgetAvailable) {
        return new Response(
          JSON.stringify({ error: "Limite AI raggiunto. Ricarica il credito AI per continuare a usare l'assistente.", blocked: true }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch user data in parallel
    const [accountsRes, transactionsRes, invoicesRes, deadlinesRes, budgetsRes] = await Promise.all([
      supabase.from("bank_accounts").select("name, bank_name, balance, currency, iban").eq("user_id", userId),
      supabase.from("bank_transactions").select("date, amount, description, category, merchant_name, transaction_type").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      supabase.from("invoices").select("invoice_number, invoice_type, amount, total_amount, vat_amount, client_name, vendor_name, due_date, payment_status, invoice_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("deadlines").select("title, due_date, amount, status, priority, deadline_type").eq("user_id", userId).order("due_date", { ascending: true }).limit(30),
      supabase.from("budgets").select("name, amount, start_date, end_date, period_type, is_active").eq("user_id", userId),
    ]);

    const accounts = accountsRes.data || [];
    const transactions = transactionsRes.data || [];
    const invoices = invoicesRes.data || [];
    const deadlines = deadlinesRes.data || [];
    const budgets = budgetsRes.data || [];

    // Build context
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const contextParts: string[] = [];

    contextParts.push(`## Conti Bancari (${accounts.length})\nSaldo totale: €${totalBalance.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`);
    if (accounts.length) contextParts.push(accounts.map(a => `- ${a.name} (${a.bank_name}): €${(a.balance || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })} ${a.currency || "EUR"}`).join("\n"));

    contextParts.push(`\n## Ultime Transazioni (${transactions.length})`);
    if (transactions.length) {
      const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      contextParts.push(`Entrate totali: €${income.toLocaleString("it-IT", { minimumFractionDigits: 2 })}\nUscite totali: €${expenses.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`);
      contextParts.push(transactions.slice(0, 30).map(t => `- ${t.date} | €${t.amount} | ${t.description || t.merchant_name || "N/A"} | ${t.category || "non categorizzata"}`).join("\n"));
    }

    contextParts.push(`\n## Fatture (${invoices.length})`);
    if (invoices.length) {
      const unpaid = invoices.filter(i => i.payment_status !== "paid");
      contextParts.push(`Non pagate: ${unpaid.length}`);
      contextParts.push(invoices.slice(0, 20).map(i => `- ${i.invoice_number || "N/A"} | ${i.invoice_type} | €${i.total_amount} | ${i.client_name || i.vendor_name || "N/A"} | Scadenza: ${i.due_date || "N/A"} | Stato: ${i.payment_status || "N/A"}`).join("\n"));
    }

    contextParts.push(`\n## Scadenze (${deadlines.length})`);
    if (deadlines.length) contextParts.push(deadlines.slice(0, 15).map(d => `- ${d.title} | Scadenza: ${d.due_date} | €${d.amount || 0} | Stato: ${d.status} | Priorità: ${d.priority}`).join("\n"));

    contextParts.push(`\n## Budget (${budgets.length})`);
    if (budgets.length) contextParts.push(budgets.map(b => `- ${b.name}: €${b.amount} | ${b.period_type} | ${b.is_active ? "Attivo" : "Inattivo"}`).join("\n"));

    const dataContext = contextParts.join("\n");

    const systemPrompt = `Sei il CFO virtuale dell'utente sulla piattaforma mioCFO. Il tuo compito è analizzare ESCLUSIVAMENTE i dati finanziari reali dell'utente forniti qui sotto e rispondere alle sue domande.

REGOLE FONDAMENTALI:
1. Rispondi SOLO basandoti sui dati forniti. NON inventare mai dati, numeri o informazioni.
2. Se non hai dati sufficienti per rispondere, dillo chiaramente.
3. Se la domanda non riguarda i dati finanziari della piattaforma, rispondi: "Posso aiutarti solo con i dati finanziari presenti sulla piattaforma mioCFO."
4. Rispondi SEMPRE in italiano.
5. Sii conciso e professionale.

REGOLE DI FORMATTAZIONE (OBBLIGATORIE):
- Usa **tabelle markdown** per elencare transazioni, fatture o dati tabulari. Mai usare il formato "| testo | testo |" inline su una riga sola.
- Usa **titoli** (### o ####) per separare le sezioni della risposta.
- Usa **grassetto** per importi, date importanti e KPI chiave.
- Usa **elenchi puntati** per suggerimenti e analisi.
- Usa **---** per separare sezioni logiche.
- Le tabelle devono avere sempre l'header e il separatore, esempio:
| Colonna 1 | Colonna 2 |
|---|---|
| dato | dato |

--- DATI DELL'UTENTE ---
${dataContext}
--- FINE DATI ---`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi richieste, riprova tra poco." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti. Aggiungi crediti al workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
