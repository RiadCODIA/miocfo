import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const POWENS_DOMAIN = Deno.env.get("POWENS_DOMAIN")!;
const POWENS_CLIENT_ID = Deno.env.get("POWENS_CLIENT_ID")!;
const POWENS_CLIENT_SECRET = Deno.env.get("POWENS_CLIENT_SECRET")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PowensRequest {
  action:
    | "create_webview_url"
    | "exchange_code"
    | "get_accounts"
    | "get_transactions"
    | "sync_account"
    | "remove_connection";
  code?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  redirect_uri?: string;
}

// Powens API base URL
const POWENS_API_URL = `https://${POWENS_DOMAIN}/2.0`;

async function powensRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>,
  permanentToken?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Use permanent token for user-specific requests
  if (permanentToken) {
    headers["Authorization"] = `Bearer ${permanentToken}`;
  }

  const url = `${POWENS_API_URL}${endpoint}`;
  console.log(`[Powens] ${method} ${url}`);

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`[Powens] Error from ${endpoint}:`, data);
    throw new Error(data.message || data.error || "Powens API error");
  }

  console.log(`[Powens] Success from ${endpoint}`);
  return data;
}

// Get client access token (for creating webview URLs)
async function getClientToken(): Promise<string> {
  const response = await fetch(`${POWENS_API_URL}/auth/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: POWENS_CLIENT_ID,
      client_secret: POWENS_CLIENT_SECRET,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Powens] Error getting client token:", data);
    throw new Error(data.message || "Failed to get client token");
  }

  console.log("[Powens] Got client token");
  return data.auth_token;
}

async function createWebviewUrl(redirectUri: string) {
  // Get a temporary auth token
  const authToken = await getClientToken();

  // Generate the webview URL for bank connection
  const webviewUrl = `https://${POWENS_DOMAIN}/2.0/auth/webview/${authToken}?redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log("[Powens] Created webview URL");

  return { webview_url: webviewUrl, auth_token: authToken };
}

async function exchangeCode(code: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Exchange authorization code for permanent token
  const response = await fetch(`${POWENS_API_URL}/auth/token/access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: POWENS_CLIENT_ID,
      client_secret: POWENS_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await response.json();

  if (!response.ok) {
    console.error("[Powens] Error exchanging code:", tokenData);
    throw new Error(tokenData.message || "Failed to exchange code");
  }

  const permanentToken = tokenData.access_token;
  const userId = tokenData.user?.id;

  console.log(`[Powens] Got permanent token for user: ${userId}`);

  // Get user's connections (banks)
  const connectionsData = await powensRequest(
    "/users/me/connections",
    "GET",
    undefined,
    permanentToken
  );

  const connections = connectionsData.connections || [];
  console.log(`[Powens] Found ${connections.length} connections`);

  // Get accounts from all connections
  const accountsData = await powensRequest(
    "/users/me/accounts",
    "GET",
    undefined,
    permanentToken
  );

  const accounts = accountsData.accounts || [];
  console.log(`[Powens] Found ${accounts.length} accounts`);

  // Save each account to database
  const savedAccounts = [];

  for (const account of accounts) {
    // Find the connection for this account to get bank name
    const connection = connections.find(
      (c: { id: number }) => c.id === account.id_connection
    );
    const bankName = connection?.connector?.name || "Banca";

    const { data: savedAccount, error } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          plaid_item_id: `powens_${userId}`, // Reusing field for Powens user ID
          plaid_access_token: permanentToken,
          plaid_account_id: String(account.id),
          bank_name: bankName,
          account_name: account.name || account.original_name,
          account_type: account.type,
          account_subtype: null,
          mask: account.number?.slice(-4) || null,
          iban: account.iban,
          currency: account.currency?.id || "EUR",
          current_balance: account.balance || 0,
          available_balance: account.balance || 0,
          status: account.disabled ? "error" : "active",
          last_sync_at: new Date().toISOString(),
          source: "powens",
        },
        { onConflict: "plaid_account_id" }
      )
      .select()
      .single();

    if (error) {
      console.error(`[Powens] Error saving account ${account.id}:`, error);
      throw error;
    }

    savedAccounts.push(savedAccount);
    console.log(`[Powens] Saved account: ${savedAccount.id}`);
  }

  return { accounts: savedAccounts };
}

async function getAccounts() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: accounts, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Powens] Error fetching accounts:", error);
    throw error;
  }

  return { accounts };
}

async function syncAccount(accountId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get account from database
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found");
  }

  console.log(`[Powens] Syncing account: ${account.id}`);

  const permanentToken = account.plaid_access_token;
  const powensAccountId = account.plaid_account_id;

  // Refresh account balance
  const accountData = await powensRequest(
    `/users/me/accounts/${powensAccountId}`,
    "GET",
    undefined,
    permanentToken
  );

  if (accountData) {
    const { error: updateError } = await supabase
      .from("bank_accounts")
      .update({
        current_balance: accountData.balance || 0,
        available_balance: accountData.balance || 0,
        last_sync_at: new Date().toISOString(),
        status: accountData.disabled ? "error" : "active",
      })
      .eq("id", accountId);

    if (updateError) {
      console.error("[Powens] Error updating account:", updateError);
    }
  }

  // Get transactions (last 30 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const transactionsData = await powensRequest(
    `/users/me/accounts/${powensAccountId}/transactions?min_date=${startDate}&max_date=${endDate}&limit=100`,
    "GET",
    undefined,
    permanentToken
  );

  const transactions = transactionsData.transactions || [];
  console.log(`[Powens] Found ${transactions.length} transactions`);

  // Save transactions
  for (const tx of transactions) {
    const { error: txError } = await supabase.from("bank_transactions").upsert(
      {
        bank_account_id: accountId,
        plaid_transaction_id: String(tx.id),
        amount: tx.value || 0,
        currency: tx.currency?.id || "EUR",
        date: tx.date || tx.rdate,
        name: tx.original_wording || tx.simplified_wording || "Transazione",
        merchant_name: tx.category?.name || null,
        category: tx.category ? [tx.category.name] : null,
        pending: tx.coming || false,
        transaction_type: tx.type,
        payment_channel: null,
      },
      { onConflict: "plaid_transaction_id" }
    );

    if (txError) {
      console.error("[Powens] Error saving transaction:", txError);
    }
  }

  // Get updated account
  const { data: updatedAccount } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  return {
    account: updatedAccount,
    transactions_synced: transactions.length,
  };
}

async function getTransactions(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  const { data: transactions, error } = await query.limit(500);

  if (error) {
    console.error("[Powens] Error fetching transactions:", error);
    throw error;
  }

  return { transactions };
}

async function removeConnection(accountId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get account
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found");
  }

  // Handle manual accounts - delete directly
  if (account.source === "manual" || !account.plaid_item_id) {
    console.log(`[Powens] Deleting manual account: ${accountId}`);

    const { error: deleteError } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId);

    if (deleteError) {
      console.error("[Powens] Error deleting manual account:", deleteError);
      throw deleteError;
    }

    return { success: true, deleted_count: 1, account_type: "manual" };
  }

  // For Powens accounts, we can optionally revoke the connection
  // For now, just delete from our database
  const powensUserId = account.plaid_item_id;

  // Delete ALL accounts with the same Powens user ID
  const { data: deletedAccounts, error: deleteError } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("plaid_item_id", powensUserId)
    .select("id");

  if (deleteError) {
    console.error("[Powens] Error deleting accounts:", deleteError);
    throw deleteError;
  }

  const deletedCount = deletedAccounts?.length || 0;
  console.log(
    `[Powens] Deleted ${deletedCount} accounts for user ${powensUserId}`
  );

  return {
    success: true,
    deleted_count: deletedCount,
    powens_user_id: powensUserId,
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PowensRequest = await req.json();
    console.log(`[Powens] Action: ${body.action}`);

    let result;

    switch (body.action) {
      case "create_webview_url":
        if (!body.redirect_uri) {
          throw new Error("redirect_uri is required");
        }
        result = await createWebviewUrl(body.redirect_uri);
        break;

      case "exchange_code":
        if (!body.code) {
          throw new Error("code is required");
        }
        result = await exchangeCode(body.code);
        break;

      case "get_accounts":
        result = await getAccounts();
        break;

      case "sync_account":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await syncAccount(body.account_id);
        break;

      case "get_transactions":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await getTransactions(
          body.account_id,
          body.start_date,
          body.end_date
        );
        break;

      case "remove_connection":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await removeConnection(body.account_id);
        break;

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[Powens] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
