import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAlertEmailRequest {
  alertId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("[SendAlertEmail] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alertId, userId }: SendAlertEmailRequest = await req.json();

    // Fetch user preferences
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefsError) {
      console.error("[SendAlertEmail] Error fetching preferences:", prefsError);
      throw prefsError;
    }

    // If no preferences or email notifications disabled, skip
    if (!preferences?.email_notifications) {
      console.log("[SendAlertEmail] Email notifications disabled for user");
      return new Response(
        JSON.stringify({ success: false, message: "Email notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch alert details
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      console.error("[SendAlertEmail] Alert not found:", alertError);
      throw new Error("Alert not found");
    }

    // Check if critical alerts setting should prevent this email
    if (alert.priority !== "high" && !preferences.critical_alerts) {
      console.log("[SendAlertEmail] Non-critical alert, user only wants critical alerts");
      return new Response(
        JSON.stringify({ success: false, message: "User only receives critical alerts" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("[SendAlertEmail] Profile not found:", profileError);
    }

    // Use notification email if set, otherwise profile email
    const recipientEmail = preferences.notification_email || profile?.email;
    if (!recipientEmail) {
      console.error("[SendAlertEmail] No recipient email found");
      return new Response(
        JSON.stringify({ success: false, message: "No recipient email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = profile?.first_name || "Utente";
    const priorityEmoji = alert.priority === "high" ? "🚨" : alert.priority === "medium" ? "⚠️" : "ℹ️";
    const priorityLabel = alert.priority === "high" ? "Alta" : alert.priority === "medium" ? "Media" : "Bassa";

    // Send email
    const emailResponse = await resend.emails.send({
      from: "mioCFO <alerts@finexa.app>",
      to: [recipientEmail],
      subject: `${priorityEmoji} [ALERT] ${alert.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .alert-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${alert.priority === "high" ? "#ef4444" : alert.priority === "medium" ? "#f59e0b" : "#3b82f6"}; margin: 15px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${alert.priority === "high" ? "#fef2f2" : alert.priority === "medium" ? "#fffbeb" : "#eff6ff"}; color: ${alert.priority === "high" ? "#dc2626" : alert.priority === "medium" ? "#d97706" : "#2563eb"}; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 mioCFO Alert</h1>
            </div>
            <div class="content">
              <p>Ciao <strong>${userName}</strong>,</p>
              <p>È stato rilevato un nuovo alert nel tuo sistema finanziario:</p>
              
              <div class="alert-box">
                <h2 style="margin: 0 0 10px 0;">${alert.title}</h2>
                ${alert.description ? `<p style="margin: 0 0 10px 0; color: #6b7280;">${alert.description}</p>` : ""}
                <div style="margin-top: 10px;">
                  <span class="priority">${priorityEmoji} Priorità: ${priorityLabel}</span>
                  <span style="margin-left: 10px; color: #6b7280; font-size: 13px;">Tipo: ${alert.alert_type}</span>
                </div>
              </div>

              <a href="https://miocfo.lovable.app/alert" class="button">Visualizza Dettagli</a>
              
              <div class="footer">
                <p>mioCFO - Gestione Finanziaria Intelligente</p>
                <p>Puoi modificare le preferenze di notifica nelle impostazioni del tuo account.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[SendAlertEmail] Email sent successfully:", emailResponse);

    // Mark alert as email sent
    await supabase
      .from("alerts")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", alertId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[SendAlertEmail] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
