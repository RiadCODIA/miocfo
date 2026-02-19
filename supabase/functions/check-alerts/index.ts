import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function mapSeverity(priority: string): string {
  switch (priority) {
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "info";
    default: return "info";
  }
}

async function createAlert(
  supabase: any,
  userId: string,
  data: { type: string; title: string; message: string; severity: string; action_url?: string }
): Promise<string | null> {
  // Check for duplicate alert (read or unread) created in the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("type", data.type)
    .eq("title", data.title)
    .eq("user_id", userId)
    .gte("created_at", oneDayAgo.toISOString())
    .maybeSingle();

  if (existing) {
    console.log(`[CheckAlerts] Alert already exists: ${data.title}`);
    return null;
  }

  const { data: inserted, error } = await supabase
    .from("alerts")
    .insert({
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity,
      is_read: false,
      user_id: userId,
      action_url: data.action_url || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[CheckAlerts] Error creating alert:", error);
    return null;
  }

  console.log(`[CheckAlerts] Created alert: ${data.title}`);
  return inserted.id;
}

async function checkDeadlines(supabase: any, userId: string): Promise<string[]> {
  const alertIds: string[] = [];
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const { data: upcomingDeadlines, error } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("due_date", today.toISOString().split("T")[0])
    .lte("due_date", threeDaysFromNow.toISOString().split("T")[0]);

  if (error) {
    console.error("[CheckAlerts] Error fetching deadlines:", error);
    return alertIds;
  }

  for (const deadline of upcomingDeadlines || []) {
    const dueDate = new Date(deadline.due_date);
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const alertId = await createAlert(supabase, userId, {
      type: "scadenza",
      title: `Scadenza ${deadline.deadline_type === "incasso" ? "incasso" : "pagamento"} in ${daysUntil} giorn${daysUntil === 1 ? "o" : "i"}`,
      message: `${deadline.title}${deadline.amount ? ` - €${Number(deadline.amount).toLocaleString("it-IT")}` : ""} - Scade il ${dueDate.toLocaleDateString("it-IT")}`,
      severity: mapSeverity(daysUntil <= 1 ? "high" : "medium"),
      action_url: "/scadenzario",
    });
    if (alertId) alertIds.push(alertId);
  }

  // Check overdue deadlines
  const { data: overdueDeadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lt("due_date", today.toISOString().split("T")[0]);

  for (const deadline of overdueDeadlines || []) {
    const alertId = await createAlert(supabase, userId, {
      type: "scadenza",
      title: `Scadenza ${deadline.deadline_type === "incasso" ? "incasso" : "pagamento"} scaduta!`,
      message: `${deadline.title}${deadline.amount ? ` - €${Number(deadline.amount).toLocaleString("it-IT")}` : ""} - Scaduta il ${new Date(deadline.due_date).toLocaleDateString("it-IT")}`,
      severity: "error",
      action_url: "/scadenzario",
    });
    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

async function checkBudgets(supabase: any, userId: string): Promise<string[]> {
  const alertIds: string[] = [];

  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("[CheckAlerts] Error fetching budgets:", error);
    return alertIds;
  }

  // For each budget, calculate actual spending from transactions
  for (const budget of budgets || []) {
    // Get transactions for the budget period
    const { data: transactions } = await supabase
      .from("bank_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("transaction_type", "expense")
      .gte("date", budget.start_date)
      .lte("date", budget.end_date || new Date().toISOString().split("T")[0]);

    const totalSpent = Math.abs(
      (transactions || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0)
    );
    const budgetAmount = Number(budget.amount);

    if (budgetAmount > 0) {
      const percentage = (totalSpent / budgetAmount) * 100;

      if (percentage >= 100) {
        const alertId = await createAlert(supabase, userId, {
          type: "budget",
          title: `Budget "${budget.name}" superato!`,
          message: `Spese €${totalSpent.toLocaleString("it-IT")} vs budget €${budgetAmount.toLocaleString("it-IT")} (${percentage.toFixed(0)}%)`,
          severity: "error",
          action_url: "/budget",
        });
        if (alertId) alertIds.push(alertId);
      } else if (percentage >= 80) {
        const alertId = await createAlert(supabase, userId, {
          type: "budget",
          title: `Budget "${budget.name}" quasi esaurito`,
          message: `Hai utilizzato il ${percentage.toFixed(0)}% del budget. Rimangono €${(budgetAmount - totalSpent).toLocaleString("it-IT")}`,
          severity: "warning",
          action_url: "/budget",
        });
        if (alertId) alertIds.push(alertId);
      }
    }
  }

  return alertIds;
}

async function checkLiquidity(supabase: any, userId: string): Promise<string[]> {
  const alertIds: string[] = [];
  const LIQUIDITY_THRESHOLD = 5000;

  const { data: accounts, error } = await supabase
    .from("bank_accounts")
    .select("balance")
    .eq("user_id", userId)
    .eq("is_connected", true);

  if (error) {
    console.error("[CheckAlerts] Error fetching bank accounts:", error);
    return alertIds;
  }

  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + (Number(acc.balance) || 0), 0) || 0;

  if (totalBalance < LIQUIDITY_THRESHOLD) {
    const alertId = await createAlert(supabase, userId, {
      type: "liquidità",
      title: "Liquidità sotto la soglia",
      message: `Saldo totale €${totalBalance.toLocaleString("it-IT")} è inferiore alla soglia di €${LIQUIDITY_THRESHOLD.toLocaleString("it-IT")}`,
      severity: totalBalance < 1000 ? "error" : "warning",
      action_url: "/flussi-cassa",
    });
    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

async function checkInvoices(supabase: any, userId: string): Promise<string[]> {
  const alertIds: string[] = [];
  const today = new Date();

  // Check overdue unpaid invoices
  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_status", "pending")
    .lt("due_date", today.toISOString().split("T")[0]);

  if (error) {
    console.error("[CheckAlerts] Error fetching invoices:", error);
    return alertIds;
  }

  for (const invoice of overdueInvoices || []) {
    const alertId = await createAlert(supabase, userId, {
      type: "fattura",
      title: `Fattura ${invoice.invoice_number || ""} scaduta`,
      message: `${invoice.vendor_name || invoice.client_name || "Fattura"} - €${Number(invoice.total_amount).toLocaleString("it-IT")} - Scaduta il ${new Date(invoice.due_date).toLocaleDateString("it-IT")}`,
      severity: "warning",
      action_url: "/fatture",
    });
    if (alertId) alertIds.push(alertId);
  }

  // Check unmatched invoices
  const { data: unmatchedInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("payment_status", "pending")
    .is("matched_transaction_id", null);

  const unmatchedCount = unmatchedInvoices?.length || 0;
  if (unmatchedCount > 0) {
    const alertId = await createAlert(supabase, userId, {
      type: "fattura",
      title: `${unmatchedCount} fattur${unmatchedCount === 1 ? "a" : "e"} da riconciliare`,
      message: `Hai ${unmatchedCount} fattur${unmatchedCount === 1 ? "a" : "e"} non ancora associate a transazioni bancarie`,
      severity: "info",
      action_url: "/fatture",
    });
    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

async function checkBankSync(supabase: any, userId: string): Promise<string[]> {
  const alertIds: string[] = [];
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: staleAccounts, error } = await supabase
    .from("bank_accounts")
    .select("name, bank_name, last_sync_at")
    .eq("user_id", userId)
    .eq("is_connected", true)
    .lt("last_sync_at", threeDaysAgo.toISOString());

  if (error) {
    console.error("[CheckAlerts] Error fetching stale accounts:", error);
    return alertIds;
  }

  for (const account of staleAccounts || []) {
    const alertId = await createAlert(supabase, userId, {
      type: "sync",
      title: `Sincronizzazione ${account.name} non aggiornata`,
      message: `Il conto ${account.name} (${account.bank_name}) non viene sincronizzato da più di 3 giorni. Ultima sync: ${new Date(account.last_sync_at).toLocaleDateString("it-IT")}`,
      severity: "warning",
      action_url: "/conti-bancari",
    });
    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[CheckAlerts] Starting alert check for user ${userId}...`);

    const [deadlineAlerts, budgetAlerts, liquidityAlerts, invoiceAlerts, syncAlerts] = await Promise.all([
      checkDeadlines(supabase, userId),
      checkBudgets(supabase, userId),
      checkLiquidity(supabase, userId),
      checkInvoices(supabase, userId),
      checkBankSync(supabase, userId),
    ]);

    const allAlerts = [...deadlineAlerts, ...budgetAlerts, ...liquidityAlerts, ...invoiceAlerts, ...syncAlerts];

    console.log(`[CheckAlerts] Created ${allAlerts.length} new alerts for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: allAlerts.length,
        breakdown: {
          deadlines: deadlineAlerts.length,
          budgets: budgetAlerts.length,
          liquidity: liquidityAlerts.length,
          invoices: invoiceAlerts.length,
          sync: syncAlerts.length,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[CheckAlerts] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
