import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    const day = now.getDate();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const forced = body?.force === true;

    if (day !== 1 && !forced) {
      return new Response(JSON.stringify({ message: "Not the 1st of the month, skipping reset" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { error: resetError } = await serviceClient
      .from("ai_usage_monthly")
      .update({
        cost_accumulated: 0,
        credit_recharged: 0,
        num_recharges: 0,
        assistant_messages_used: 0,
        transaction_analyses_used: 0,
        is_blocked: false,
        updated_at: new Date().toISOString(),
      })
      .eq("month_year", currentMonthYear);

    if (resetError) throw resetError;

    return new Response(JSON.stringify({
      success: true,
      month_year: currentMonthYear,
      message: `Reset AI usage for month ${currentMonthYear}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reset-ai-usage error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Errore interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
