import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENABLE_BANKING_APP_ID = Deno.env.get("ENABLE_BANKING_APP_ID")!;
const ENABLE_BANKING_PRIVATE_KEY = Deno.env.get("ENABLE_BANKING_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const API_BASE = "https://api.enablebanking.com";

// Base64url encode
function base64url(input: string | Uint8Array): string {
  let b64: string;
  if (typeof input === "string") {
    b64 = btoa(input);
  } else {
    b64 = btoa(String.fromCharCode(...input));
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Generate JWT for Enable Banking API using crypto.subtle
async function generateJWT(): Promise<string> {
  // Clean the PEM key - handle various storage formats
  let pemContent = ENABLE_BANKING_PRIVATE_KEY;
  
  // Replace escaped newlines with real newlines
  pemContent = pemContent.replace(/\\n/g, "\n");
  
  // Extract the base64 content between PEM headers
  let b64Content: string;
  
  if (pemContent.includes("-----BEGIN")) {
    // Has PEM headers - extract content
    b64Content = pemContent
      .replace(/-----BEGIN [A-Z ]+-----/g, "")
      .replace(/-----END [A-Z ]+-----/g, "")
      .replace(/\s/g, "");
  } else {
    // Raw base64 - just clean whitespace
    b64Content = pemContent.replace(/\s/g, "");
  }

  // Fix URL-safe base64 characters if present
  b64Content = b64Content.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (b64Content.length % 4 !== 0) {
    b64Content += "=";
  }

  console.log(`[EnableBanking] Key length: ${b64Content.length} chars, starts with: ${b64Content.substring(0, 20)}...`);
  console.log(`[EnableBanking] APP_ID: ${ENABLE_BANKING_APP_ID}`);
  console.log(`[EnableBanking] APP_ID length: ${ENABLE_BANKING_APP_ID?.length}, type: ${typeof ENABLE_BANKING_APP_ID}`);

  // Decode base64 to binary
  const binaryDer = Uint8Array.from(atob(b64Content), (c) => c.charCodeAt(0));

  // Try PKCS#8 first, then fall back to PKCS#1
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  } catch (e) {
    console.log(`[EnableBanking] PKCS#8 import failed, trying PKCS#1...`, e);
    // Try importing as PKCS#1 (some keys are in this format)
    // We need to wrap PKCS#1 in PKCS#8 ASN.1 structure
    // Prefix for RSA PKCS#8 wrapping of PKCS#1
    const pkcs8Header = new Uint8Array([
      0x30, 0x82, // SEQUENCE
      ...lengthBytes(binaryDer.length + 26),
      0x02, 0x01, 0x00, // INTEGER 0 (version)
      0x30, 0x0d, // SEQUENCE
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID rsaEncryption
      0x05, 0x00, // NULL
      0x04, 0x82, // OCTET STRING
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

  // Build JWT
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

// Helper for ASN.1 length encoding (2-byte form)
function lengthBytes(len: number): number[] {
  return [(len >> 8) & 0xff, len & 0xff];
}

// Make authenticated request to Enable Banking API
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
  console.log(`[EnableBanking] ${method} ${url}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[EnableBanking] Error ${response.status}:`, errorText);
    throw new Error(
      `Enable Banking API error: ${response.status} - ${errorText}`
    );
  }

  return response.json();
}

// Extract authenticated user ID
async function extractUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// ============ ACTION HANDLERS ============

// Get list of ASPSPs (banks) for a country
async function getASPSPs(country: string) {
  console.log(`[EnableBanking] Getting ASPSPs for country: ${country}`);
  const data = (await ebRequest(`/aspsps?country=${encodeURIComponent(country)}`)) as {
    aspsps?: unknown[];
  };
  return { aspsps: data.aspsps || data };
}

// Start authorization - returns URL for user to authorize
async function startAuth(
  aspspName: string,
  aspspCountry: string,
  redirectUri: string,
  psuType: string = "personal",
  state?: string
) {
  console.log(
    `[EnableBanking] Starting auth for ASPSP: ${aspspName} (${aspspCountry})`
  );

  const validUntil = new Date(
    Date.now() + 10 * 24 * 60 * 60 * 1000
  ).toISOString();

  const body: Record<string, unknown> = {
    access: {
      valid_until: validUntil,
      balances: true,
      transactions: true,
    },
    aspsp: {
      name: aspspName,
      country: aspspCountry,
    },
    state: state || crypto.randomUUID(),
    redirect_url: redirectUri,
    psu_type: psuType,
  };

  const result = (await ebRequest("/auth", "POST", body)) as {
    url?: string;
  };

  if (!result.url) {
    throw new Error("No authorization URL returned from Enable Banking");
  }

  return { authorization_url: result.url, state: body.state };
}

// Complete session after user authorization
async function completeSession(code: string) {
  console.log(`[EnableBanking] Creating session with authorization code`);

  const result = (await ebRequest("/sessions", "POST", { code })) as {
    session_id?: string;
    accounts?: Array<{
      uid?: string;
      account_id?: { iban?: string };
      institution?: { name?: string };
      product?: string;
      currency?: string;
    }>;
  };

  return result;
}

// Get account balances
async function getAccountBalances(accountUid: string) {
  const result = (await ebRequest(
    `/accounts/${accountUid}/balances`
  )) as { balances?: unknown[] };
  return result.balances || result;
}

// Get account transactions with pagination support
async function getAccountTransactions(
  accountUid: string,
  dateFrom?: string,
  dateTo?: string
) {
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
    console.log(`[EnableBanking] Transactions page ${pageCount}, response keys: ${Object.keys(result)}`);
    
    // Enable Banking returns { booked: [...], pending: [...] } format
    if (Array.isArray(result.booked)) {
      console.log(`[EnableBanking] Page ${pageCount}: ${result.booked.length} booked transactions`);
      allTransactions = allTransactions.concat(result.booked);
    }
    if (Array.isArray(result.pending)) {
      console.log(`[EnableBanking] Page ${pageCount}: ${result.pending.length} pending transactions`);
      allTransactions = allTransactions.concat(result.pending);
    }
    if (Array.isArray(result.transactions)) {
      console.log(`[EnableBanking] Page ${pageCount}: ${result.transactions.length} transactions (flat)`);
      allTransactions = allTransactions.concat(result.transactions);
    }
    if (Array.isArray(result)) {
      allTransactions = allTransactions.concat(result);
    }

    // Check for continuation key for next page
    continuationKey = (result.continuation_key as string) || null;
    if (continuationKey) {
      console.log(`[EnableBanking] Continuation key found, fetching next page...`);
    }
  } while (continuationKey && pageCount < 50); // Safety limit: max 50 pages
  
  console.log(`[EnableBanking] Total transactions fetched across ${pageCount} page(s): ${allTransactions.length}`);
  if (allTransactions.length > 0) {
    console.log(`[EnableBanking] Sample transaction: ${JSON.stringify(allTransactions[0]).substring(0, 500)}`);
  }
  
  return allTransactions;
}

// Sync accounts and transactions to database
async function syncToDatabase(
  userId: string,
  sessionData: {
    session_id?: string;
    accounts?: Array<{
      uid?: string;
      account_id?: { iban?: string };
      institution?: { name?: string };
      product?: string;
      currency?: string;
    }>;
  },
  // deno-lint-ignore no-explicit-any
  supabase: any
) {
  const savedAccounts = [];
  let totalTransactions = 0;

  const sessionAccounts = sessionData.accounts || [];
  console.log(
    `[EnableBanking] Syncing ${sessionAccounts.length} accounts for user ${userId}`
  );

  for (const acc of sessionAccounts) {
    const accountUid = acc.uid;
    if (!accountUid) continue;

    // Fetch balance
    let balance = 0;
    try {
      const balances = (await getAccountBalances(accountUid)) as Array<{
        balance_amount?: { amount?: string | number; currency?: string };
        balance_type?: string;
      }>;
      if (Array.isArray(balances) && balances.length > 0) {
        const bal = balances[0];
        const amt = bal.balance_amount?.amount;
        balance = typeof amt === "string" ? parseFloat(amt) : (amt || 0);
      }
    } catch (e) {
      console.log(`[EnableBanking] Could not fetch balance:`, e);
    }

    const iban = acc.account_id?.iban || null;
    const bankName = acc.institution?.name || "Banca";

    const accountData = {
      user_id: userId,
      external_id: accountUid,
      acube_account_id: accountUid,
      iban,
      name: acc.product || "Conto Bancario",
      bank_name: bankName,
      balance,
      currency: acc.currency || "EUR",
      provider: "enable_banking",
      is_connected: true,
      last_sync_at: new Date().toISOString(),
    };

    // Upsert account
    const { data: savedAccount, error: upsertError } = await supabase
      .from("bank_accounts")
      .upsert(accountData, {
        onConflict: "external_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      const { data: inserted, error: insertError } = await supabase
        .from("bank_accounts")
        .insert(accountData)
        .select()
        .single();

      if (insertError) {
        console.error(`[EnableBanking] Error saving account:`, insertError);
        continue;
      }
      savedAccounts.push(inserted);
    } else {
      savedAccounts.push(savedAccount);
    }

    // Sync transactions
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
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
        transaction_amount?: { amount?: string | number; currency?: string };
        credit_debit_indicator?: string;
        remittance_information?: string[];
        creditor_name?: string;
        debtor_name?: string;
      }>;

      if (Array.isArray(transactions)) {
        console.log(
          `[EnableBanking] Found ${transactions.length} transactions for account ${accountUid}`
        );

        for (const tx of transactions) {
          const rawAmount = tx.transaction_amount?.amount;
          const amount =
            typeof rawAmount === "string" ? parseFloat(rawAmount) : (rawAmount || 0);
          // deno-lint-ignore no-explicit-any
          const indicator = (tx as any).credit_debit_indicator || (tx as any).creditDebitIndicator || "";
          const isDebit =
            indicator === "DBIT" ||
            indicator === "debit" ||
            indicator === "DEBIT" ||
            amount < 0;
          const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);

          const txData = {
            user_id: userId,
            bank_account_id: savedAccounts[savedAccounts.length - 1]?.id,
            external_id:
              tx.entry_reference ||
              tx.transaction_id ||
              `eb:${tx.booking_date}:${amount}`,
            date:
              tx.booking_date ||
              tx.value_date ||
              new Date().toISOString().split("T")[0],
            amount: signedAmount,
            description: tx.remittance_information?.join(" ") || "",
            merchant_name: tx.creditor_name || tx.debtor_name || null,
            transaction_type: isDebit ? "expense" : "income",
            category: null,
          };

          const { error: txError } = await supabase
            .from("bank_transactions")
            .upsert(txData, {
              onConflict: "external_id",
              ignoreDuplicates: true,
            });

          if (txError) {
            console.error(`[EnableBanking] TX upsert error:`, txError.message);
          } else {
            totalTransactions++;
          }
        }
      }
    } catch (e) {
      console.log(`[EnableBanking] Error syncing transactions:`, e);
    }
  }

  return { accounts: savedAccounts, transactions_synced: totalTransactions };
}

// Get accounts from database
async function getAccountsFromDB(
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
) {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Errore nel recupero dei conti bancari");
  return data || [];
}

// Sync a single account
async function syncSingleAccount(
  accountId: string,
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
) {
  const { data: account, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !account) throw new Error("Conto non trovato");

  const accountUid = account.external_id || account.acube_account_id;
  if (!accountUid) throw new Error("ID account Enable Banking non trovato");

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
    console.log(`[EnableBanking] Balance refresh failed:`, e);
  }

  await supabase
    .from("bank_accounts")
    .update({
      balance,
      last_sync_at: new Date().toISOString(),
      is_connected: true,
    })
    .eq("id", accountId);

  // Sync transactions
  let transactionsSynced = 0;
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
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
        const amount =
          typeof rawAmount === "string" ? parseFloat(rawAmount) : (rawAmount || 0);
        // deno-lint-ignore no-explicit-any
        const indicator = (tx as any).credit_debit_indicator || (tx as any).creditDebitIndicator || "";
        const isDebit =
          indicator === "DBIT" ||
          indicator === "debit" ||
          indicator === "DEBIT" ||
          amount < 0;
        const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
        console.log(`[EnableBanking] TX: amount=${amount}, indicator=${indicator}, isDebit=${isDebit}`);

        const txData = {
              user_id: userId,
              bank_account_id: accountId,
              external_id:
                tx.entry_reference ||
                tx.transaction_id ||
                `eb:${tx.booking_date}:${amount}`,
              date:
                tx.booking_date ||
                tx.value_date ||
                new Date().toISOString().split("T")[0],
              amount: signedAmount,
              description: tx.remittance_information?.join(" ") || "",
              merchant_name: tx.creditor_name || tx.debtor_name || null,
              transaction_type: isDebit ? "expense" : "income",
            };

        const { error: txError } = await supabase
          .from("bank_transactions")
          .upsert(txData, { onConflict: "external_id", ignoreDuplicates: true });

        if (txError) {
          console.error(`[EnableBanking] Sync TX upsert error:`, txError.message);
        } else {
          transactionsSynced++;
        }
      }
    }
  } catch (e) {
    console.log(`[EnableBanking] Transaction sync error:`, e);
  }

  return { account: { ...account, balance }, transactions_synced: transactionsSynced };
}

// Remove account connection
async function removeConnection(
  accountId: string,
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
) {
  await supabase
    .from("bank_transactions")
    .delete()
    .eq("bank_account_id", accountId);

  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw new Error("Errore nella rimozione del conto");
  return { deleted_count: 1 };
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`[EnableBanking] Action: ${action}`);

    // Public actions (no auth required)
    if (action === "get_aspsps") {
      const country = (params.aspsp_country as string) || "IT";
      const result = await getASPSPs(country);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Protected actions require auth
    const userId = await extractUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Autenticazione richiesta" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result: unknown;

    switch (action) {
      case "start_auth": {
        const aspspName = params.aspsp_name as string;
        const aspspCountry = (params.aspsp_country as string) || "IT";
        const redirectUri = params.redirect_uri as string;
        const psuType = (params.psu_type as string) || "personal";
        const state = params.state as string | undefined;

        if (!aspspName || !redirectUri) {
          return new Response(
            JSON.stringify({
              error: "aspsp_name e redirect_uri sono obbligatori",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        result = await startAuth(aspspName, aspspCountry, redirectUri, psuType, state);
        break;
      }

      case "complete_session": {
        const code = params.code as string;
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Authorization code richiesto" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const sessionData = await completeSession(code);
        result = await syncToDatabase(userId, sessionData, supabase);
        break;
      }

      case "get_accounts": {
        const accounts = await getAccountsFromDB(userId, supabase);
        result = { accounts };
        break;
      }

      case "sync_account": {
        const accountId = params.account_id as string;
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "account_id richiesto" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await syncSingleAccount(accountId, userId, supabase);
        break;
      }

      case "remove_connection": {
        const removeAccountId = params.account_id as string;
        if (!removeAccountId) {
          return new Response(
            JSON.stringify({ error: "account_id richiesto" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await removeConnection(removeAccountId, userId, supabase);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Azione non supportata: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[EnableBanking] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Errore interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
