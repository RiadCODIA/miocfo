import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configurato' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { amount_eur } = await req.json();
    const validAmounts = [5, 10, 15];
    if (!validAmounts.includes(amount_eur)) {
      return new Response(JSON.stringify({ error: 'Importo non valido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const origin = req.headers.get('origin') || 'https://miocfo.lovable.app';
    const amountCents = amount_eur * 100;
    const { format } = await import("https://deno.land/x/date_fns@v2.22.1/index.js");
    const monthYear = new Date().toISOString().substring(0, 7); // yyyy-MM

    // Create Stripe Checkout Session
    const stripeBody = new URLSearchParams({
      'mode': 'payment',
      'success_url': `${origin}/impostazioni?recharge=success&amount=${amount_eur}`,
      'cancel_url': `${origin}/impostazioni?recharge=cancelled`,
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][product_data][name]': `Credito AI +€${amount_eur}`,
      'line_items[0][price_data][product_data][description]': `Ricarica credito AI per il mese ${monthYear}`,
      'line_items[0][price_data][unit_amount]': amountCents.toString(),
      'line_items[0][quantity]': '1',
      'metadata[user_id]': user.id,
      'metadata[amount_eur]': amount_eur.toString(),
      'metadata[month_year]': monthYear,
      'metadata[type]': 'ai_recharge',
      'payment_intent_data[metadata][user_id]': user.id,
      'payment_intent_data[metadata][amount_eur]': amount_eur.toString(),
      'payment_intent_data[metadata][month_year]': monthYear,
      'payment_intent_data[metadata][type]': 'ai_recharge',
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeBody.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      throw new Error(session.error?.message || 'Errore Stripe');
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('create-ai-recharge-checkout error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Errore interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
