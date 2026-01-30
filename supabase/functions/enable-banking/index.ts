import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENABLE_BANKING_APP_ID = Deno.env.get("ENABLE_BANKING_APP_ID")!;
const ENABLE_BANKING_PRIVATE_KEY = Deno.env.get("ENABLE_BANKING_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Enable Banking API base URL
const ENABLE_BANKING_API_URL = "https://api.enablebanking.com";

interface EnableBankingRequest {
  action: string;
  redirect_uri?: string;
  code?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  aspsp_country?: string;
  aspsp_name?: string;
  user_id?: string;
}

// Base64URL encode function
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create a JWT signed with RS256 for Enable Banking authentication
async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  console.log("[Enable Banking] App ID (kid):", ENABLE_BANKING_APP_ID);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: ENABLE_BANKING_APP_ID,
  };
  
  const payload = {
    iss: "enablebanking.com",
    aud: "api.tilisy.com",
    iat: now,
    exp: now + 3600,
  };
  
  console.log("[Enable Banking] JWT header:", JSON.stringify(header));
  console.log("[Enable Banking] JWT payload:", JSON.stringify(payload));
  
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const privateKeyPem = ENABLE_BANKING_PRIVATE_KEY
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .trim();
  
  console.log("[Enable Banking] Private key prefix (first 50 chars):", privateKeyPem.substring(0, 50));
  console.log("[Enable Banking] Key contains BEGIN PRIVATE KEY:", privateKeyPem.includes("BEGIN PRIVATE KEY"));
  console.log("[Enable Banking] Key contains BEGIN RSA PRIVATE KEY:", privateKeyPem.includes("BEGIN RSA PRIVATE KEY"));
  
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  let keyData = privateKeyPem;
  
  if (keyData.includes(pemHeader)) {
    keyData = keyData.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  } else {
    const rsaPemHeader = "-----BEGIN RSA PRIVATE KEY-----";
    const rsaPemFooter = "-----END RSA PRIVATE KEY-----";
    keyData = keyData.replace(rsaPemHeader, "").replace(rsaPemFooter, "").replace(/\s/g, "");
  }
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  
  return `${unsignedToken}.${encodedSignature}`;
}

// Make authenticated request to Enable Banking API
async function enableBankingRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const jwt = await createJWT();
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`[Enable Banking] ${method} ${ENABLE_BANKING_API_URL}${endpoint}`);
  
  const response = await fetch(`${ENABLE_BANKING_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Enable Banking] Error ${response.status}:`, errorText);
    throw new Error(`Enable Banking API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Create an authorization request and get the authorization URL
async function createSession(
  redirectUri: string,
  aspspCountry: string,
  aspspName: string
): Promise<{ session_id: string; authorization_url: string }> {
  const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  
  const authData = {
    access: {
      valid_until: validUntil,
    },
    aspsp: {
      country: aspspCountry,
      name: aspspName,
    },
    state: crypto.randomUUID(),
    redirect_url: redirectUri,
    psu_type: "personal",
  };
  
  console.log("[Enable Banking] Creating auth request with data:", JSON.stringify(authData));
  
  const response = await enableBankingRequest("/auth", "POST", authData) as {
    url: string;
  };
  
  console.log("[Enable Banking] Auth response received, URL:", response.url?.substring(0, 50) + "...");
  
  return {
    session_id: authData.state as string,
    authorization_url: response.url,
  };
}

// Account type from Enable Banking API
interface EnableBankingAccount {
  uid: string;
  iban?: string;
  account_id?: {
    iban?: string;
  };
  name?: string;
  currency?: string;
  product?: string;
  cash_account_type?: string;
}

// Complete the authorization after user returns with code
async function completeSession(code: string, userId?: string | null): Promise<{ accounts: unknown[] }> {
  console.log(`[Enable Banking] Completing session with code: ${code.substring(0, 20)}...`);
  console.log(`[Enable Banking] User ID: ${userId || "not provided"}`);
  
  if (!userId) {
    throw new Error("user_id is required to save accounts");
  }
  
  // Exchange the authorization code for a session
  // The POST /sessions endpoint returns session_id AND accounts directly
  const session = await enableBankingRequest("/sessions", "POST", { code }) as {
    session_id: string;
    accounts?: EnableBankingAccount[];
    access?: {
      valid_until: string;
    };
    aspsp?: {
      name: string;
      country: string;
    };
  };
  
  console.log("[Enable Banking] Session created:", session.session_id);
  console.log("[Enable Banking] Accounts in response:", session.accounts?.length || 0);
  
  // Get accounts from the session response directly
  let accounts: EnableBankingAccount[] = session.accounts || [];
  
  // Fallback: if accounts are not in the initial response, fetch session details
  if (accounts.length === 0) {
    console.log("[Enable Banking] No accounts in session response, fetching session details...");
    
    try {
      const sessionDetails = await enableBankingRequest(`/sessions/${session.session_id}`) as {
        accounts?: string[];
        aspsp?: {
          name: string;
          country: string;
        };
      };
      
      console.log("[Enable Banking] Session details accounts:", sessionDetails.accounts?.length || 0);
      
      // If we have account IDs, fetch details for each
      if (sessionDetails.accounts && sessionDetails.accounts.length > 0) {
        for (const accountId of sessionDetails.accounts) {
          try {
            const accountDetails = await enableBankingRequest(`/accounts/${accountId}/details`) as EnableBankingAccount;
            if (accountDetails) {
              accounts.push({
                ...accountDetails,
                uid: accountDetails.uid || accountId,
              });
            }
          } catch (e) {
            console.log(`[Enable Banking] Could not fetch details for account ${accountId}:`, e);
            // Still add basic account info
            accounts.push({ uid: accountId });
          }
        }
      }
    } catch (e) {
      console.error("[Enable Banking] Error fetching session details:", e);
    }
  }
  
  console.log(`[Enable Banking] Processing ${accounts.length} accounts`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const savedAccounts: unknown[] = [];
  
  for (const account of accounts) {
    // Get account balances
    let currentBalance = 0;
    let availableBalance = 0;
    
    let balanceFetchFailed = false;
    try {
      const balances = await enableBankingRequest(`/accounts/${account.uid}/balances`) as {
        balances: Array<{
          balance_amount: {
            amount: number;
            currency: string;
          };
          balance_type: string;
        }>;
      };
      
      if (balances.balances) {
        for (const balance of balances.balances) {
          if (balance.balance_type === "closingBooked" || balance.balance_type === "interimBooked") {
            currentBalance = balance.balance_amount.amount;
          }
          if (balance.balance_type === "interimAvailable" || balance.balance_type === "expected") {
            availableBalance = balance.balance_amount.amount;
          }
        }
        console.log(`[Enable Banking] Balances fetched for ${account.uid}: current=${currentBalance}, available=${availableBalance}`);
      }
    } catch (e) {
      console.error("[Enable Banking] FAILED to fetch balances for account", account.uid, ":", e);
      balanceFetchFailed = true;
      // Continue with balance = 0, but we'll mark the account as pending
    }
    
    const iban = account.iban || account.account_id?.iban || null;
    
    // Set status based on whether we successfully fetched balances
    // "pending" = account connected but waiting for balance sync
    // "active" = account fully connected with balances
    const accountStatus = balanceFetchFailed || (currentBalance === 0 && availableBalance === 0) 
      ? "pending" 
      : "active";
    
    console.log(`[Enable Banking] Account ${account.uid} status: ${accountStatus} (balanceFetchFailed=${balanceFetchFailed})`);

    const accountData = {
      user_id: userId,
      plaid_account_id: account.uid,
      plaid_item_id: session.session_id,
      bank_name: session.aspsp?.name || "Bank",
      account_name: account.name || account.product || "Conto Corrente",
      account_type: account.cash_account_type || "checking",
      iban: iban,
      currency: account.currency || "EUR",
      current_balance: currentBalance,
      available_balance: availableBalance || currentBalance,
      status: accountStatus,
      source: "enable_banking",
      last_sync_at: new Date().toISOString(),
    };
    
    // Check if account already exists for this user
    const { data: existingAccount } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("plaid_account_id", account.uid)
      .eq("user_id", userId)
      .single();
    
    if (existingAccount) {
      const { data: updatedAccount, error } = await supabase
        .from("bank_accounts")
        .update({
          ...accountData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id)
        .select()
        .single();
      
      if (error) {
        console.error("[Enable Banking] Error updating account:", error);
      } else {
        savedAccounts.push(updatedAccount);
      }
    } else {
      const { data: newAccount, error } = await supabase
        .from("bank_accounts")
        .insert(accountData)
        .select()
        .single();
      
      if (error) {
        console.error("[Enable Banking] Error inserting account:", error);
      } else {
        savedAccounts.push(newAccount);
      }
    }
  }
  
  console.log(`[Enable Banking] Saved ${savedAccounts.length} accounts for user ${userId}`);
  
  return { accounts: savedAccounts };
}

// Get accounts from database (filtered by user_id)
async function getAccounts(userId?: string | null): Promise<{ accounts: unknown[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  
  // Filter by user if provided
  if (userId) {
    query = query.eq("user_id", userId);
  }
  
  const { data: accounts, error } = await query;
  
  if (error) {
    console.error("[Enable Banking] Error fetching accounts:", error);
    throw new Error("Failed to fetch accounts");
  }
  
  return { accounts: accounts || [] };
}

// Verify account belongs to user
// deno-lint-ignore no-explicit-any
async function verifyAccountOwnership(supabase: any, accountId: string, userId: string): Promise<boolean> {
  const { data: account, error } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();
  
  if (error || !account) {
    console.error(`[Enable Banking] Account ${accountId} does not belong to user ${userId}`);
    return false;
  }
  return true;
}

// Sync account data (balance and transactions)
async function syncAccount(accountId: string, userId?: string | null): Promise<{ account: unknown; transactions_synced: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership if userId provided
  if (userId) {
    const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
    if (!isOwner) {
      throw new Error("Account not found or access denied");
    }
  }
  
  // Get account from database
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .single();
  
  if (accountError || !account) {
    throw new Error("Account not found");
  }
  
  const accountUid = account.plaid_account_id;
  
  try {
    // Get account balances
    const balances = await enableBankingRequest(`/accounts/${accountUid}/balances`) as {
      balances: Array<{
        balance_amount: {
          amount: number;
          currency: string;
        };
        balance_type: string;
      }>;
    };
    
    let currentBalance = account.current_balance;
    let availableBalance = account.available_balance;
    
    if (balances.balances) {
      for (const balance of balances.balances) {
        if (balance.balance_type === "closingBooked" || balance.balance_type === "interimBooked") {
          currentBalance = balance.balance_amount.amount;
        }
        if (balance.balance_type === "interimAvailable" || balance.balance_type === "expected") {
          availableBalance = balance.balance_amount.amount;
        }
      }
    }
    
    // Get recent transactions (last 90 days)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const transactionsResponse = await enableBankingRequest(
      `/accounts/${accountUid}/transactions?date_from=${startDate}&date_to=${endDate}`
    ) as {
      transactions: Array<{
        transaction_id: string;
        booking_date: string;
        transaction_amount: {
          amount: number;
          currency: string;
        };
        remittance_information?: string[];
        creditor_name?: string;
        debtor_name?: string;
      }>;
    };
    
    let transactionsSynced = 0;
    
    if (transactionsResponse.transactions) {
      for (const tx of transactionsResponse.transactions) {
        const transactionData = {
          bank_account_id: accountId,
          plaid_transaction_id: tx.transaction_id,
          amount: tx.transaction_amount.amount,
          currency: tx.transaction_amount.currency,
          date: tx.booking_date,
          name: tx.remittance_information?.join(" ") || tx.creditor_name || tx.debtor_name || "Transaction",
          merchant_name: tx.creditor_name || tx.debtor_name || null,
          pending: false,
        };
        
        const { error } = await supabase
          .from("bank_transactions")
          .upsert(transactionData, { 
            onConflict: "plaid_transaction_id",
          });
        
        if (!error) {
          transactionsSynced++;
        }
      }
    }
    
    // Update account in database
    const { data: updatedAccount, error: updateError } = await supabase
      .from("bank_accounts")
      .update({
        current_balance: currentBalance,
        available_balance: availableBalance,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return { account: updatedAccount, transactions_synced: transactionsSynced };
  } catch (error) {
    console.error("[Enable Banking] Sync error:", error);
    
    const { data: updatedAccount } = await supabase
      .from("bank_accounts")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .select()
      .single();
    
    throw new Error("Failed to sync account. The connection may have expired.");
  }
}

// Get transactions for an account
async function getTransactions(
  accountId: string,
  userId?: string | null,
  startDate?: string,
  endDate?: string
): Promise<{ transactions: unknown[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership if userId provided
  if (userId) {
    const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
    if (!isOwner) {
      throw new Error("Account not found or access denied");
    }
  }
  
  let query = supabase
    .from("bank_transactions")
    .select("*")
    .eq("bank_account_id", accountId)
    .order("date", { ascending: false });
  
  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }
  
  const { data: transactions, error } = await query;
  
  if (error) {
    throw new Error("Failed to fetch transactions");
  }
  
  return { transactions: transactions || [] };
}

// Remove account connection
async function removeConnection(accountId: string, userId?: string | null): Promise<{ success: boolean; deleted_count: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership if userId provided
  if (userId) {
    const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
    if (!isOwner) {
      throw new Error("Account not found or access denied");
    }
  }
  
  // Delete transactions first
  await supabase
    .from("bank_transactions")
    .delete()
    .eq("bank_account_id", accountId);
  
  // Delete the account
  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId);
  
  if (error) {
    throw new Error("Failed to remove account");
  }
  
  return { success: true, deleted_count: 1 };
}

// Get available ASPSPs (banks) for a country
async function getASPSPs(country: string): Promise<{ aspsps: unknown[] }> {
  const response = await enableBankingRequest(`/aspsps?country=${country}&service=AIS`) as {
    aspsps: unknown[];
  };
  
  return { aspsps: response.aspsps || [] };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body: EnableBankingRequest = await req.json();
    const { action, user_id: userId } = body;
    
    console.log(`[Enable Banking] Action: ${action}, User: ${userId || "anonymous"}`);
    
    let result: unknown;
    
    switch (action) {
      case "create_session":
        if (!body.redirect_uri) {
          throw new Error("redirect_uri is required");
        }
        if (!body.aspsp_country || !body.aspsp_name) {
          throw new Error("aspsp_country and aspsp_name are required");
        }
        result = await createSession(body.redirect_uri, body.aspsp_country, body.aspsp_name);
        break;
        
      case "complete_session":
        if (!body.code) {
          throw new Error("code is required");
        }
        if (!userId) {
          throw new Error("user_id is required");
        }
        result = await completeSession(body.code, userId);
        break;
        
      case "get_accounts":
        result = await getAccounts(userId);
        break;
        
      case "sync_account":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await syncAccount(body.account_id, userId);
        break;
        
      case "get_transactions":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await getTransactions(body.account_id, userId, body.start_date, body.end_date);
        break;
        
      case "remove_connection":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await removeConnection(body.account_id, userId);
        break;
        
      case "get_aspsps":
        if (!body.aspsp_country) {
          throw new Error("aspsp_country is required");
        }
        result = await getASPSPs(body.aspsp_country);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Enable Banking] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
