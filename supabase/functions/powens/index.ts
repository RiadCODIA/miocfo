import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Clean domain from any protocol prefix or trailing slashes
const rawDomain = Deno.env.get("POWENS_DOMAIN")!;
const POWENS_DOMAIN = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
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

async function createWebviewUrl(redirectUri: string) {
  const webviewUrl = `https://webview.powens.com/connect?domain=${POWENS_DOMAIN}&client_id=${POWENS_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log(`[Powens] Created webview URL: ${webviewUrl}`);
  return { webview_url: webviewUrl };
}

// deno-lint-ignore no-explicit-any
async function exchangeCode(code: string, userId: string, supabase: any) {
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
  const powensUserId = tokenData.user?.id;

  console.log(`[Powens] Got permanent token for Powens user: ${powensUserId}, app user: ${userId}`);

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

  // Save each account to database with the authenticated user's ID
  const savedAccounts = [];

  for (const account of accounts) {
    const connection = connections.find(
      (c: { id: number }) => c.id === account.id_connection
    );
    const bankName = connection?.connector?.name || "Banca";

    const { data: savedAccount, error } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          user_id: userId,
          plaid_item_id: `powens_${powensUserId}`,
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

// deno-lint-ignore no-explicit-any
async function getAccounts(userId: string, supabase: any) {
  const { data: accounts, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Powens] Error fetching accounts:", error);
    throw error;
  }

  return { accounts };
}

// deno-lint-ignore no-explicit-any
async function syncAccount(accountId: string, userId: string, supabase: any) {
  // Get account from database, scoped to user
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found or access denied");
  }

  console.log(`[Powens] Syncing account: ${account.id} for user: ${userId}`);

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
      .eq("id", accountId)
      .eq("user_id", userId);

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
        user_id: userId,
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
    .eq("user_id", userId)
    .single();

  return {
    account: updatedAccount,
    transactions_synced: transactions.length,
  };
}

async function getTransactions(
  accountId: string,
  userId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  startDate?: string,
  endDate?: string
) {
  // First verify the account belongs to this user
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found or access denied");
  }

  let query = supabase
    .from("bank_transactions")
    .select("*")
    .eq("bank_account_id", accountId)
    .eq("user_id", userId)
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

// deno-lint-ignore no-explicit-any
async function removeConnection(accountId: string, userId: string, supabase: any) {
  // Get account, scoped to user
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found or access denied");
  }

  // Handle manual accounts - delete directly
  if (account.source === "manual" || !account.plaid_item_id) {
    console.log(`[Powens] Deleting manual account: ${accountId}`);

    const { error: deleteError } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[Powens] Error deleting manual account:", deleteError);
      throw deleteError;
    }

    return { success: true, deleted_count: 1, account_type: "manual" };
  }

  // For Powens accounts, delete ALL accounts with the same Powens user ID AND same user
  const powensUserId = account.plaid_item_id;

  const { data: deletedAccounts, error: deleteError } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("plaid_item_id", powensUserId)
    .eq("user_id", userId)
    .select("id");

  if (deleteError) {
    console.error("[Powens] Error deleting accounts:", deleteError);
    throw deleteError;
  }

  const deletedCount = deletedAccounts?.length || 0;
  console.log(
    `[Powens] Deleted ${deletedCount} accounts for user ${userId}`
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

    // Authenticate user (except for create_webview_url which doesn't need DB access)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let userId: string | null = null;

    if (body.action !== "create_webview_url") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Autenticazione richiesta." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await authClient.auth.getUser();

      if (authError || !user) {
        console.error("[Powens] Auth error:", authError);
        return new Response(
          JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = user.id;
      console.log(`[Powens] Authenticated user: ${userId}`);
    }

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
        result = await exchangeCode(body.code, userId!, supabase);
        break;

      case "get_accounts":
        result = await getAccounts(userId!, supabase);
        break;

      case "sync_account":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await syncAccount(body.account_id, userId!, supabase);
        break;

      case "get_transactions":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await getTransactions(
          body.account_id,
          userId!,
          supabase,
          body.start_date,
          body.end_date
        );
        break;

      case "remove_connection":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await removeConnection(body.account_id, userId!, supabase);
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
