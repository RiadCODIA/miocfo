import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ENABLE_BANKING_APP_ID = Deno.env.get("ENABLE_BANKING_APP_ID")!;
const ENABLE_BANKING_PRIVATE_KEY = Deno.env.get("ENABLE_BANKING_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const API_BASE = "https://api.enablebanking.com";

// ========== JWT Generation (same as enable-banking function) ==========

function base64url(input: string | Uint8Array): string {
  let b64: string;
  if (typeof input === "string") {
    b64 = btoa(input);
  } else {
    b64 = btoa(String.fromCharCode(...input));
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function lengthBytes(len: number): number[] {
  return [(len >> 8) & 0xff, len & 0xff];
}

async function generateJWT(): Promise<string> {
  let pemContent = ENABLE_BANKING_PRIVATE_KEY;
  pemContent = pemContent.replace(/\\n/g, "\n");

  let b64Content: string;
  if (pemContent.includes("-----BEGIN")) {
    b64Content = pemContent
      .replace(/-----BEGIN [A-Z ]+-----/g, "")
      .replace(/-----END [A-Z ]+-----/g, "")
      .replace(/\s/g, "");
  } else {
    b64Content = pemContent.replace(/\s/g, "");
  }

  b64Content = b64Content.replace(/-/g, "+").replace(/_/g, "/");
  while (b64Content.length % 4 !== 0) {
    b64Content += "=";
  }

  const binaryDer = Uint8Array.from(atob(b64Content), (c) => c.charCodeAt(0));

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  } catch (_e) {
    const pkcs8Header = new Uint8Array([
      0x30, 0x82,
      ...lengthBytes(binaryDer.length + 26),
      0x02, 0x01, 0x00,
      0x30, 0x0d,
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      0x05, 0x00,
      0x04, 0x82,
      ...lengthBytes(binaryDer.length),
    ]);
    const pkcs8Der = new Uint8Array(pkcs8Header.length + binaryDer.length);
    pkcs8Der.set(pkcs8Header);
    pkcs8Der.set(binaryDer, pkcs8Header.length);
    cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pkcs8Der,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: ENABLE_BANKING_APP_ID }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    iss: "enablebanking.com",
    aud: "api.enablebanking.com",
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

// ========== Enable Banking API helpers ==========

async function ebRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const jwt = await generateJWT();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const options: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }
  const url = `${API_BASE}${endpoint}`;
  console.log(`[SyncBanking] ${method} ${url}`);
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SyncBanking] Error ${response.status}:`, errorText);
    throw new Error(`Enable Banking API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

async function getAccountBalances(accountUid: string) {
  const result = (await ebRequest(`/accounts/${accountUid}/balances`)) as { balances?: unknown[] };
  return result.balances || result;
}

async function getAccountTransactions(accountUid: string, dateFrom?: string, dateTo?: string) {
  // deno-lint-ignore no-explicit-any
  let allTransactions: any[] = [];
  let continuationKey: string | null = null;
  let pageCount = 0;

  do {
    let endpoint = `/accounts/${accountUid}/transactions`;
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (continuationKey) params.append("continuation_key", continuationKey);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const result = (await ebRequest(endpoint)) as Record<string, unknown>;
    pageCount++;

    if (Array.isArray(result.booked)) allTransactions = allTransactions.concat(result.booked);
    if (Array.isArray(result.pending)) allTransactions = allTransactions.concat(result.pending);
    if (Array.isArray(result.transactions)) allTransactions = allTransactions.concat(result.transactions);
    if (Array.isArray(result)) allTransactions = allTransactions.concat(result);

    continuationKey = (result.continuation_key as string) || null;
  } while (continuationKey && pageCount < 50);

  console.log(`[SyncBanking] Fetched ${allTransactions.length} transactions across ${pageCount} pages for ${accountUid}`);
  return allTransactions;
}

// ========== Main sync logic ==========

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[SyncBanking] Starting automated bank sync at ${new Date().toISOString()}`);

  // Security: verify request has Authorization header (from cron or service role)
  // The function has verify_jwt = false in config, so we just check for presence
  // of a valid-looking auth header. The cron job sends the anon key.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("[SyncBanking] Missing Authorization header");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Create sync job record
  const { data: syncJob } = await supabase
    .from("sync_jobs")
    .insert({
      job_type: "auto_sync_banking",
      provider: "enable_banking",
      status: "running",
      started_at: new Date().toISOString(),
      user_id: null,
    })
    .select()
    .single();

  const syncJobId = syncJob?.id;

  try {
    // Get all connected Enable Banking accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("is_connected", true)
      .eq("provider", "enable_banking");

    if (accountsError) {
      throw new Error(`Failed to query bank accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      console.log("[SyncBanking] No connected Enable Banking accounts found");
      if (syncJobId) {
        await supabase.from("sync_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: { accounts_synced: 0, message: "No connected accounts" },
        }).eq("id", syncJobId);
      }
      return new Response(JSON.stringify({ message: "No accounts to sync", accounts_synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[SyncBanking] Found ${accounts.length} connected accounts to sync`);

    let accountsSynced = 0;
    let totalTransactions = 0;
    const errors: string[] = [];

    for (const account of accounts) {
      const accountUid = account.external_id || account.acube_account_id;
      if (!accountUid) {
        errors.push(`Account ${account.id}: no external_id`);
        continue;
      }

      try {
        // Refresh balance
        let balance = account.balance;
        try {
          const balances = (await getAccountBalances(accountUid)) as Array<{
            balance_amount?: { amount?: string | number };
          }>;
          if (Array.isArray(balances) && balances.length > 0) {
            const amt = balances[0].balance_amount?.amount;
            balance = typeof amt === "string" ? parseFloat(amt) : (amt || 0);
          }
        } catch (e) {
          console.log(`[SyncBanking] Balance refresh failed for ${account.id}:`, e);
        }

        // Update balance and last_sync_at
        await supabase
          .from("bank_accounts")
          .update({
            balance,
            last_sync_at: new Date().toISOString(),
            is_connected: true,
          })
          .eq("id", account.id);

        // Sync recent transactions (last 30 days for auto-sync, not full 2 years)
        let transactionsSynced = 0;
        try {
          const endDate = new Date().toISOString().split("T")[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          const transactions = (await getAccountTransactions(
            accountUid,
            startDate,
            endDate
          )) as Array<{
            entry_reference?: string;
            transaction_id?: string;
            booking_date?: string;
            value_date?: string;
            transaction_amount?: { amount?: string | number };
            credit_debit_indicator?: string;
            remittance_information?: string[];
            creditor_name?: string;
            debtor_name?: string;
          }>;

          if (Array.isArray(transactions)) {
            for (const tx of transactions) {
              const rawAmount = tx.transaction_amount?.amount;
              const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : (rawAmount || 0);
              // deno-lint-ignore no-explicit-any
              const indicator = (tx as any).credit_debit_indicator || (tx as any).creditDebitIndicator || "";
              const isDebit =
                indicator === "DBIT" || indicator === "debit" || indicator === "DEBIT" || amount < 0;
              const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);

              const txData = {
                user_id: account.user_id,
                bank_account_id: account.id,
                external_id:
                  tx.entry_reference ||
                  tx.transaction_id ||
                  `eb:${tx.booking_date}:${amount}`,
                date: tx.booking_date || tx.value_date || new Date().toISOString().split("T")[0],
                amount: signedAmount,
                description: tx.remittance_information?.join(" ") || "",
                merchant_name: tx.creditor_name || tx.debtor_name || null,
                transaction_type: isDebit ? "expense" : "income",
              };

              const { error: txError } = await supabase
                .from("bank_transactions")
                .upsert(txData, { onConflict: "external_id", ignoreDuplicates: true });

              if (txError) {
                console.error(`[SyncBanking] TX upsert error:`, txError.message);
              } else {
                transactionsSynced++;
              }
            }
          }
        } catch (e) {
          console.log(`[SyncBanking] Transaction sync error for ${account.id}:`, e);
          errors.push(`Account ${account.id}: transaction sync failed`);
        }

        totalTransactions += transactionsSynced;
        accountsSynced++;
        console.log(`[SyncBanking] Synced account ${account.id}: balance=${balance}, txns=${transactionsSynced}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[SyncBanking] Error syncing account ${account.id}:`, msg);
        errors.push(`Account ${account.id}: ${msg}`);
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      accounts_synced: accountsSynced,
      accounts_total: accounts.length,
      transactions_synced: totalTransactions,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
    };

    console.log(`[SyncBanking] Sync completed:`, JSON.stringify(summary));

    // Update sync job
    if (syncJobId) {
      await supabase.from("sync_jobs").update({
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        completed_at: new Date().toISOString(),
        metadata: summary,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      }).eq("id", syncJobId);
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    console.error("[SyncBanking] Fatal error:", msg);

    if (syncJobId) {
      await supabase.from("sync_jobs").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: msg,
      }).eq("id", syncJobId);
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
