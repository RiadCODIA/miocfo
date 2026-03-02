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

    console.log("[Auto-Categorize] Starting scheduled auto-categorization...");

    // Call the existing categorize-transactions function in batch mode
    const response = await fetch(`${supabaseUrl}/functions/v1/categorize-transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ batch_mode: true }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Auto-Categorize] Error from categorize-transactions:", result);
      return new Response(
        JSON.stringify({ success: false, error: result.error || "Categorization failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Auto-Categorize] Completed. ${result.message || "No details"}`);

    return new Response(
      JSON.stringify({ success: true, message: result.message, count: result.results?.length || 0 }),
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
