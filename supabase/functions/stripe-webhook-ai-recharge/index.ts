import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe non configurato' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verify Stripe webhook signature
    const { Stripe } = await import("https://esm.sh/stripe@14.21.0");
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata || {};

      if (metadata.type !== 'ai_recharge') {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userId = metadata.user_id;
      const amountEur = parseFloat(metadata.amount_eur || '0');
      const monthYear = metadata.month_year;

      if (!userId || !amountEur || !monthYear) {
        console.error('Missing metadata:', metadata);
        return new Response(JSON.stringify({ error: 'Missing metadata' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Record topup in ai_credit_topups
      await serviceClient.from('ai_credit_topups').insert({
        user_id: userId,
        amount_eur: amountEur,
        month_year: monthYear,
      });

      // Upsert monthly usage: increment credit_recharged
      const { data: existing } = await serviceClient
        .from('ai_usage_monthly')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (existing) {
        const newCreditRecharged = Number(existing.credit_recharged || 0) + amountEur;
        const newNumRecharges = Number(existing.num_recharges || 0) + 1;
        const planLimit = 5; // Will be recalculated client-side
        const isBlocked = Number(existing.cost_accumulated || 0) >= (planLimit + newCreditRecharged);

        await serviceClient
          .from('ai_usage_monthly')
          .update({
            credit_recharged: newCreditRecharged,
            num_recharges: newNumRecharges,
            is_blocked: isBlocked,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await serviceClient.from('ai_usage_monthly').insert({
          user_id: userId,
          month_year: monthYear,
          cost_accumulated: 0,
          credit_recharged: amountEur,
          num_recharges: 1,
          is_blocked: false,
        });
      }

      console.log(`AI recharge processed: user=${userId}, amount=€${amountEur}, month=${monthYear}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Errore interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
