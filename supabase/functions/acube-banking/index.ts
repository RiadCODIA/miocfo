import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// A-Cube configuration
const ACUBE_EMAIL = Deno.env.get("ACUBE_EMAIL")!;
const ACUBE_PASSWORD = Deno.env.get("ACUBE_PASSWORD")!;
const ACUBE_ENV = Deno.env.get("ACUBE_ENV") || "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// A-Cube API URLs - use sandbox URLs when in sandbox mode
const ACUBE_COMMON_URL = ACUBE_ENV === "production" 
  ? "https://common.api.acubeapi.com" 
  : "https://common-sandbox.api.acubeapi.com";
const ACUBE_OB_URL = ACUBE_ENV === "production" 
  ? "https://ob.api.acubeapi.com" 
  : "https://ob-sandbox.api.acubeapi.com";

interface AcubeBankingRequest {
  action: string;
  fiscal_id?: string;
  redirect_uri?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
}

// Cache for JWT token
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get JWT token from A-Cube (with caching)
async function getAcubeToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  console.log("[A-Cube] Logging in to get JWT token...");
  console.log("[A-Cube] Environment check:", {
    hasEmail: !!ACUBE_EMAIL,
    hasPassword: !!ACUBE_PASSWORD,
    emailLength: ACUBE_EMAIL?.length || 0,
    env: ACUBE_ENV,
  });
  
  const response = await fetch(`${ACUBE_COMMON_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: ACUBE_EMAIL,
      password: ACUBE_PASSWORD,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[A-Cube] Login failed:", response.status, errorText);
    console.error("[A-Cube] Check your A-Cube account at https://developer.acubeapi.com/");
    throw new Error(`A-Cube login failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.token || data.access_token;
  
  if (!token) {
    throw new Error("No token in A-Cube login response");
  }

  // Cache token for 55 minutes (tokens typically last 1 hour)
  cachedToken = {
    token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  console.log("[A-Cube] Login successful, token cached");
  return token;
}

// Make authenticated request to A-Cube Open Banking API
async function acubeRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const token = await getAcubeToken();

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const url = `${ACUBE_OB_URL}${endpoint}`;
  console.log(`[A-Cube] ${method} ${url}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[A-Cube] Error ${response.status}:`, errorText);
    throw new Error(`A-Cube API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Extract authenticated user ID from Authorization header
async function extractAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error || !user) {
      console.log("[A-Cube] Auth token validation failed:", error?.message || "No user");
      return null;
    }
    return user.id;
  } catch (e) {
    console.error("[A-Cube] Error validating auth token:", e);
    return null;
  }
}

// Create or get business registry for a fiscal ID
async function createBusinessRegistry(fiscalId: string): Promise<{ fiscalId: string; status: string }> {
  console.log(`[A-Cube] Creating/getting business registry for: ${fiscalId}`);
  
  // First, try to GET the existing business registry
  try {
    const existing = await acubeRequest(`/business-registry/${fiscalId}`, "GET") as { enabled?: boolean };
    console.log("[A-Cube] Business registry already exists:", existing);
    
    // If it exists but is not enabled, try to enable it
    if (existing && typeof existing === "object" && "enabled" in existing && !existing.enabled) {
      try {
        await acubeRequest(`/business-registry/${fiscalId}`, "PATCH", { enabled: true });
        console.log("[A-Cube] Business registry enabled");
      } catch (patchError) {
        console.log("[A-Cube] Could not enable business registry:", patchError);
      }
    }
    return { fiscalId, status: "exists" };
  } catch (getError) {
    // If GET returns 404, the registry doesn't exist - we need to create it
    if (getError instanceof Error && getError.message.includes("404")) {
      console.log("[A-Cube] Business registry doesn't exist, creating new one");
      
      try {
        const result = await acubeRequest("/business-registry", "POST", {
          fiscalId: fiscalId,
          email: `business-${fiscalId}@miocfo.app`, // Unique email per business
          businessName: `Business ${fiscalId}`,
          enabled: true,
        });
        console.log("[A-Cube] Business registry created:", result);
        return { fiscalId, status: "created" };
      } catch (createError) {
        // Handle edge cases where registry was created between GET and POST
        if (createError instanceof Error && 
            (createError.message.includes("409") || createError.message.includes("422"))) {
          console.log("[A-Cube] Business registry was created in the meantime");
          return { fiscalId, status: "exists" };
        }
        throw createError;
      }
    }
    throw getError;
  }
}

// Start bank connection flow - returns redirect URL
async function createConnectRequest(
  fiscalId: string,
  redirectUri: string
): Promise<{ connect_url: string }> {
  console.log(`[A-Cube] Creating connect request for: ${fiscalId}`);

  // First ensure the business registry exists
  await createBusinessRegistry(fiscalId);

  // Determine environment - use XF (fake country) for sandbox, IT for production
  const isSandbox = ACUBE_ENV !== "production";
  const countryCode = isSandbox ? "XF" : "IT"; // XF = fake test banks, IT = Italian banks
  
  console.log(`[A-Cube] Using country code: ${countryCode} (sandbox: ${isSandbox})`);

  // Create the connect request with required parameters
  const result = await acubeRequest(`/business-registry/${fiscalId}/connect`, "POST", {
    redirectUri: redirectUri,
    returnUrl: redirectUri, // Some versions use returnUrl instead
    country: countryCode,   // Required to show banks - XF for sandbox test banks
    locale: "it",           // Italian locale for UI
    days: 90,               // Number of days for transaction history
  });

  console.log("[A-Cube] Connect response:", JSON.stringify(result));
  
  // A-Cube returns various field names for the redirect URL
  const resultObj = result as Record<string, unknown>;
  const connectUrl = resultObj.url || 
                     resultObj.redirectUrl || 
                     resultObj.redirect_url ||
                     resultObj.connectUrl ||
                     resultObj.connect_url ||
                     resultObj.link;
  
  if (!connectUrl || typeof connectUrl !== "string") {
    console.error("[A-Cube] No redirect URL found in response. Full response:", JSON.stringify(result));
    throw new Error(`No redirect URL in A-Cube connect response. Response: ${JSON.stringify(result)}`);
  }

  console.log("[A-Cube] Connect URL generated:", connectUrl);
  return { connect_url: connectUrl };
}

// Get accounts for a fiscal ID
interface AcubeAccount {
  id: string;
  accountId?: string;
  iban?: string;
  name?: string;
  currency?: string;
  product?: string;
  aspspName?: string;
  bankName?: string;
}

async function getAccounts(fiscalId: string): Promise<AcubeAccount[]> {
  console.log(`[A-Cube] Getting accounts for: ${fiscalId}`);
  
  const result = await acubeRequest(`/business-registry/${fiscalId}/accounts`) as { 
    accounts?: AcubeAccount[];
    data?: AcubeAccount[];
  };
  
  return result.accounts || result.data || [];
}

// Get balances for an account
interface AcubeBalance {
  balanceType: string;
  amount: { amount: string | number; currency: string };
}

async function getBalances(fiscalId: string, accountId: string): Promise<AcubeBalance[]> {
  console.log(`[A-Cube] Getting balances for account: ${accountId}`);
  
  const result = await acubeRequest(
    `/business-registry/${fiscalId}/accounts/${accountId}/balances`
  ) as { balances?: AcubeBalance[]; data?: AcubeBalance[] };
  
  return result.balances || result.data || [];
}

// Get transactions for a fiscal ID
interface AcubeTransaction {
  transactionId?: string;
  entryReference?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount: { amount: string | number; currency: string };
  creditDebitIndicator?: "CRDT" | "DBIT";
  remittanceInformation?: string[];
  creditorName?: string;
  debtorName?: string;
  creditorAccount?: { iban?: string };
  debtorAccount?: { iban?: string };
}

async function getTransactions(
  fiscalId: string,
  startDate?: string,
  endDate?: string
): Promise<AcubeTransaction[]> {
  console.log(`[A-Cube] Getting transactions for: ${fiscalId}`);
  
  let endpoint = `/business-registry/${fiscalId}/transactions`;
  const params = new URLSearchParams();
  
  if (startDate) params.append("dateFrom", startDate);
  if (endDate) params.append("dateTo", endDate);
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  const result = await acubeRequest(endpoint) as { 
    transactions?: AcubeTransaction[];
    data?: AcubeTransaction[];
  };
  
  return result.transactions || result.data || [];
}

// Sync accounts from A-Cube to database
async function syncAccountsToDatabase(
  userId: string,
  fiscalId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<{ accounts: unknown[]; transactions_synced: number }> {
  console.log(`[A-Cube] Syncing accounts for user: ${userId}, fiscalId: ${fiscalId}`);
  
  const acubeAccounts = await getAccounts(fiscalId);
  console.log(`[A-Cube] Found ${acubeAccounts.length} accounts`);
  
  const savedAccounts = [];
  let totalTransactions = 0;
  
  for (const acubeAccount of acubeAccounts) {
    // Get balances for this account
    let balance = 0;
    try {
      const balances = await getBalances(fiscalId, acubeAccount.id || acubeAccount.accountId || "");
      // Find available or closing balance
      const availableBalance = balances.find(b => 
        b.balanceType === "ITAV" || b.balanceType === "expected" || b.balanceType === "available"
      );
      const closingBalance = balances.find(b => 
        b.balanceType === "CLBD" || b.balanceType === "closingBooked" || b.balanceType === "current"
      );
      const balanceEntry = availableBalance || closingBalance || balances[0];
      if (balanceEntry) {
        balance = typeof balanceEntry.amount.amount === "string" 
          ? parseFloat(balanceEntry.amount.amount) 
          : balanceEntry.amount.amount;
      }
    } catch (e) {
      console.log(`[A-Cube] Could not fetch balance for account: ${e}`);
    }
    
    const accountData = {
      user_id: userId,
      fiscal_id: fiscalId,
      acube_account_id: acubeAccount.id || acubeAccount.accountId,
      external_id: acubeAccount.id || acubeAccount.accountId,
      iban: acubeAccount.iban,
      name: acubeAccount.name || acubeAccount.product || "Conto Bancario",
      bank_name: acubeAccount.aspspName || acubeAccount.bankName || "Banca",
      balance: balance,
      currency: acubeAccount.currency || "EUR",
      provider: "acube",
      is_connected: true,
      last_sync_at: new Date().toISOString(),
    };
    
    // Upsert account (update if exists, insert if not)
    const { data: savedAccount, error: accountError } = await supabase
      .from("bank_accounts")
      .upsert(accountData, { 
        onConflict: "acube_account_id",
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (accountError) {
      // If upsert fails, try insert
      const { data: insertedAccount, error: insertError } = await supabase
        .from("bank_accounts")
        .insert(accountData)
        .select()
        .single();
      
      if (insertError) {
        console.error(`[A-Cube] Error saving account:`, insertError);
        continue;
      }
      savedAccounts.push(insertedAccount);
    } else {
      savedAccounts.push(savedAccount);
    }
  }
  
  // Sync transactions
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const transactions = await getTransactions(fiscalId, startDate, endDate);
    console.log(`[A-Cube] Found ${transactions.length} transactions`);
    
    for (const tx of transactions) {
      const amount = typeof tx.transactionAmount.amount === "string"
        ? parseFloat(tx.transactionAmount.amount)
        : tx.transactionAmount.amount;
      
      // Apply sign based on credit/debit indicator
      const signedAmount = tx.creditDebitIndicator === "DBIT" ? -Math.abs(amount) : Math.abs(amount);
      
      const transactionData = {
        user_id: userId,
        external_id: tx.transactionId || tx.entryReference || `acube:${tx.bookingDate}:${amount}`,
        date: tx.bookingDate || tx.valueDate || new Date().toISOString().split("T")[0],
        amount: signedAmount,
        description: tx.remittanceInformation?.join(" ") || "",
        merchant_name: tx.creditorName || tx.debtorName || null,
        transaction_type: tx.creditDebitIndicator === "CRDT" ? "income" : "expense",
        category: null,
      };
      
      // Use upsert to avoid duplicates
      const { error: txError } = await supabase
        .from("bank_transactions")
        .upsert(transactionData, { 
          onConflict: "external_id",
          ignoreDuplicates: true 
        });
      
      if (!txError) {
        totalTransactions++;
      }
    }
  } catch (e) {
    console.log(`[A-Cube] Error syncing transactions: ${e}`);
  }
  
  return { accounts: savedAccounts, transactions_synced: totalTransactions };
}

// Get accounts from database for a user
async function getAccountsFromDatabase(
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[A-Cube] Error fetching accounts:", error);
    throw new Error("Errore nel recupero dei conti bancari");
  }
  
  return data || [];
}

// Remove account connection
async function removeConnection(
  accountId: string,
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<{ deleted_count: number }> {
  // First, delete related transactions
  await supabase
    .from("bank_transactions")
    .delete()
    .eq("bank_account_id", accountId);
  
  // Then delete the account
  const { error, count } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("[A-Cube] Error removing account:", error);
    throw new Error("Errore nella rimozione del conto");
  }
  
  return { deleted_count: count || 1 };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify credentials are configured
    if (!ACUBE_EMAIL || !ACUBE_PASSWORD) {
      throw new Error("A-Cube credentials not configured");
    }

    const body = await req.json() as AcubeBankingRequest;
    const { action } = body;

    console.log(`[A-Cube] Action: ${action}`);

    // Create Supabase client with service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract authenticated user for protected actions
    const userId = await extractAuthenticatedUserId(req);
    
    // Actions that require authentication
    const protectedActions = [
      "connect_request",
      "complete_connection",
      "get_accounts",
      "sync_account",
      "remove_connection",
    ];
    
    if (protectedActions.includes(action) && !userId) {
      throw new Error("Autenticazione richiesta");
    }

    let result: unknown;

    switch (action) {
      case "connect_request": {
        const { fiscal_id, redirect_uri } = body;
        if (!fiscal_id || !redirect_uri) {
          throw new Error("fiscal_id e redirect_uri sono richiesti");
        }
        
        // Save fiscal_id to user profile for later use
        await supabase
          .from("profiles")
          .update({ company_name: fiscal_id }) // Store fiscal_id temporarily in company_name
          .eq("id", userId);
        
        result = await createConnectRequest(fiscal_id, redirect_uri);
        break;
      }

      case "complete_connection": {
        const { fiscal_id } = body;
        if (!fiscal_id) {
          throw new Error("fiscal_id è richiesto");
        }
        result = await syncAccountsToDatabase(userId!, fiscal_id, supabase);
        break;
      }

      case "get_accounts": {
        result = { accounts: await getAccountsFromDatabase(userId!, supabase) };
        break;
      }

      case "sync_account": {
        const { account_id } = body;
        if (!account_id) {
          throw new Error("account_id è richiesto");
        }
        
        // Get the account to find fiscal_id
        const { data: account, error: accountError } = await supabase
          .from("bank_accounts")
          .select("*")
          .eq("id", account_id)
          .eq("user_id", userId)
          .single();
        
        if (accountError || !account) {
          throw new Error("Conto non trovato");
        }
        
        if (!account.fiscal_id) {
          throw new Error("fiscal_id non trovato per questo conto");
        }
        
        result = await syncAccountsToDatabase(userId!, account.fiscal_id, supabase);
        break;
      }

      case "remove_connection": {
        const { account_id } = body;
        if (!account_id) {
          throw new Error("account_id è richiesto");
        }
        result = await removeConnection(account_id, userId!, supabase);
        break;
      }

      default:
        throw new Error(`Azione non supportata: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[A-Cube] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
