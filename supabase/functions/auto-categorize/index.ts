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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Auto-Categorize] Starting scheduled auto-categorization...");

    // Get distinct user_ids that have uncategorized transactions
    const { data: usersWithUncategorized, error: usersError } = await supabase
      .from("bank_transactions")
      .select("user_id")
      .is("ai_category_id", null);

    if (usersError) {
      console.error("[Auto-Categorize] Error fetching users:", usersError);
      throw usersError;
    }

    // Extract unique user IDs
    const uniqueUserIds = [...new Set((usersWithUncategorized || []).map((r: { user_id: string }) => r.user_id))];
    console.log(`[Auto-Categorize] Found ${uniqueUserIds.length} users with uncategorized transactions`);

    let totalCategorized = 0;

    // Process each user separately
    for (const userId of uniqueUserIds) {
      console.log(`[Auto-Categorize] Processing user: ${userId}`);

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/categorize-transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ batch_mode: true, user_id: userId }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(`[Auto-Categorize] Error for user ${userId}:`, result);
          continue;
        }

        const count = result.results?.length || 0;
        totalCategorized += count;
        console.log(`[Auto-Categorize] User ${userId}: categorized ${count} transactions`);
      } catch (userError) {
        console.error(`[Auto-Categorize] Failed for user ${userId}:`, userError);
        continue;
      }
    }

    console.log(`[Auto-Categorize] Completed. Total categorized: ${totalCategorized} across ${uniqueUserIds.length} users`);

    return new Response(
      JSON.stringify({ success: true, message: `Categorized ${totalCategorized} transactions for ${uniqueUserIds.length} users` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Auto-Categorize] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
