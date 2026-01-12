import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AlertData {
  type: "warning" | "info" | "success" | "error";
  alert_type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "active";
}

async function createAlert(supabase: any, alertData: AlertData): Promise<string | null> {
  // Check if similar active alert already exists (avoid duplicates)
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("alert_type", alertData.alert_type)
    .eq("status", "active")
    .eq("title", alertData.title)
    .maybeSingle();

  if (existing) {
    console.log(`[CheckAlerts] Alert already exists: ${alertData.title}`);
    return null;
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert(alertData)
    .select("id")
    .single();

  if (error) {
    console.error("[CheckAlerts] Error creating alert:", error);
    return null;
  }

  console.log(`[CheckAlerts] Created alert: ${alertData.title}`);
  return data.id;
}

async function checkDeadlines(supabase: any): Promise<string[]> {
  const alertIds: string[] = [];
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  // Check upcoming deadlines (within 3 days)
  const { data: upcomingDeadlines, error } = await supabase
    .from("deadlines")
    .select("*")
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
    
    const alertId = await createAlert(supabase, {
      type: daysUntil <= 1 ? "warning" : "info",
      alert_type: "scadenza",
      title: `Scadenza ${deadline.type === "incasso" ? "incasso" : "pagamento"} in ${daysUntil} giorn${daysUntil === 1 ? "o" : "i"}`,
      description: `${deadline.description} - €${deadline.amount?.toLocaleString("it-IT")}`,
      priority: daysUntil <= 1 ? "high" : "medium",
      status: "active",
    });

    if (alertId) alertIds.push(alertId);
  }

  // Check overdue deadlines
  const { data: overdueDeadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("status", "pending")
    .lt("due_date", today.toISOString().split("T")[0]);

  for (const deadline of overdueDeadlines || []) {
    const alertId = await createAlert(supabase, {
      type: "error",
      alert_type: "scadenza",
      title: `Scadenza ${deadline.type === "incasso" ? "incasso" : "pagamento"} scaduta!`,
      description: `${deadline.description} - €${deadline.amount?.toLocaleString("it-IT")} - Scaduta il ${new Date(deadline.due_date).toLocaleDateString("it-IT")}`,
      priority: "high",
      status: "active",
    });

    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

async function checkBudgets(supabase: any): Promise<string[]> {
  const alertIds: string[] = [];

  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("*");

  if (error) {
    console.error("[CheckAlerts] Error fetching budgets:", error);
    return alertIds;
  }

  for (const budget of budgets || []) {
    const percentage = budget.predicted_expenses > 0 
      ? (budget.actual_expenses / budget.predicted_expenses) * 100 
      : 0;

    if (percentage >= 100) {
      const alertId = await createAlert(supabase, {
        type: "error",
        alert_type: "budget",
        title: `Budget "${budget.name}" superato!`,
        description: `Spese effettive €${budget.actual_expenses?.toLocaleString("it-IT")} vs previste €${budget.predicted_expenses?.toLocaleString("it-IT")} (${percentage.toFixed(0)}%)`,
        priority: "high",
        status: "active",
      });
      if (alertId) alertIds.push(alertId);
    } else if (percentage >= 90) {
      const alertId = await createAlert(supabase, {
        type: "warning",
        alert_type: "budget",
        title: `Budget "${budget.name}" quasi esaurito`,
        description: `Hai utilizzato il ${percentage.toFixed(0)}% del budget. Rimangono €${(budget.predicted_expenses - budget.actual_expenses)?.toLocaleString("it-IT")}`,
        priority: "medium",
        status: "active",
      });
      if (alertId) alertIds.push(alertId);
    }
  }

  return alertIds;
}

async function checkLiquidity(supabase: any): Promise<string[]> {
  const alertIds: string[] = [];
  const LIQUIDITY_THRESHOLD = 5000; // €5.000 default threshold

  const { data: accounts, error } = await supabase
    .from("bank_accounts")
    .select("current_balance")
    .eq("status", "active");

  if (error) {
    console.error("[CheckAlerts] Error fetching bank accounts:", error);
    return alertIds;
  }

  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + (acc.current_balance || 0), 0) || 0;

  if (totalBalance < LIQUIDITY_THRESHOLD) {
    const alertId = await createAlert(supabase, {
      type: totalBalance < 1000 ? "error" : "warning",
      alert_type: "liquidità",
      title: "Liquidità sotto la soglia",
      description: `Saldo totale €${totalBalance.toLocaleString("it-IT")} è inferiore alla soglia di €${LIQUIDITY_THRESHOLD.toLocaleString("it-IT")}`,
      priority: totalBalance < 1000 ? "high" : "medium",
      status: "active",
    });
    if (alertId) alertIds.push(alertId);
  }

  return alertIds;
}

async function sendAlertEmails(supabase: any, alertIds: string[], userId?: string) {
  if (!userId || alertIds.length === 0) return;

  const functionsUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".functions.supabase.co");
  
  for (const alertId of alertIds) {
    try {
      await fetch(`${functionsUrl}/send-alert-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, userId }),
      });
    } catch (e) {
      console.error("[CheckAlerts] Error sending email for alert:", alertId, e);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CheckAlerts] Starting scheduled alert check...");

    const deadlineAlerts = await checkDeadlines(supabase);
    const budgetAlerts = await checkBudgets(supabase);
    const liquidityAlerts = await checkLiquidity(supabase);

    const allAlerts = [...deadlineAlerts, ...budgetAlerts, ...liquidityAlerts];

    console.log(`[CheckAlerts] Created ${allAlerts.length} new alerts`);

    // Note: For a multi-tenant system, you'd iterate through users
    // For now, this creates alerts that are visible to all

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: allAlerts.length,
        breakdown: {
          deadlines: deadlineAlerts.length,
          budgets: budgetAlerts.length,
          liquidity: liquidityAlerts.length,
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
