import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox"; // sandbox, development, production

const PLAID_BASE_URL = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
}[PLAID_ENV] || "https://sandbox.plaid.com";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PlaidRequest {
  action:
    | "create_link_token"
    | "exchange_public_token"
    | "get_accounts"
    | "get_transactions"
    | "sync_account"
    | "remove_item";
  public_token?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
}

async function plaidRequest(endpoint: string, body: Record<string, unknown>) {
  console.log(`[Plaid] Calling ${endpoint}`);
  
  const response = await fetch(`${PLAID_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      ...body,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`[Plaid] Error from ${endpoint}:`, data);
    throw new Error(data.error_message || "Plaid API error");
  }

  console.log(`[Plaid] Success from ${endpoint}`);
  return data;
}

async function createLinkToken() {
  const data = await plaidRequest("/link/token/create", {
    user: { client_user_id: "finexa-user" },
    client_name: "Finexa",
    products: ["transactions"],
    country_codes: ["IT", "ES", "FR", "DE", "GB", "NL", "BE"],
    language: "it",
  });

  return { link_token: data.link_token };
}

async function exchangePublicToken(publicToken: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Exchange public token for access token
  const exchangeData = await plaidRequest("/item/public_token/exchange", {
    public_token: publicToken,
  });

  const accessToken = exchangeData.access_token;
  const itemId = exchangeData.item_id;

  console.log(`[Plaid] Exchanged token, item_id: ${itemId}`);

  // Get institution info
  const itemData = await plaidRequest("/item/get", {
    access_token: accessToken,
  });

  const institutionId = itemData.item.institution_id;
  let bankName = "Banca";

  if (institutionId) {
    try {
      const instData = await plaidRequest("/institutions/get_by_id", {
        institution_id: institutionId,
        country_codes: ["IT", "ES", "FR", "DE", "GB", "NL", "BE"],
      });
      bankName = instData.institution.name;
    } catch (e) {
      console.log("[Plaid] Could not get institution name, using default");
    }
  }

  // Get accounts
  const accountsData = await plaidRequest("/accounts/get", {
    access_token: accessToken,
  });

  const accounts = accountsData.accounts;
  console.log(`[Plaid] Found ${accounts.length} accounts`);

  // Save each account to database using upsert (handles re-connections)
  const savedAccounts = [];

  for (const account of accounts) {
    const { data: savedAccount, error } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          plaid_item_id: itemId,
          plaid_access_token: accessToken,
          plaid_account_id: account.account_id,
          bank_name: bankName,
          account_name: account.name,
          account_type: account.type,
          account_subtype: account.subtype,
          mask: account.mask,
          currency: account.balances.iso_currency_code || "EUR",
          current_balance: account.balances.current || 0,
          available_balance: account.balances.available || 0,
          status: "active",
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: "plaid_account_id" }
      )
      .select()
      .single();

    if (error) {
      console.error(`[Plaid] Error saving account ${account.account_id}:`, error);
      throw error;
    }

    savedAccounts.push(savedAccount);
    console.log(`[Plaid] Saved account: ${savedAccount.id} (${account.mask})`);
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
    console.error("[Plaid] Error fetching accounts:", error);
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

  console.log(`[Plaid] Syncing account: ${account.id}`);

  // Refresh balances
  const accountsData = await plaidRequest("/accounts/get", {
    access_token: account.plaid_access_token,
    options: {
      account_ids: [account.plaid_account_id],
    },
  });

  const plaidAccount = accountsData.accounts[0];

  if (plaidAccount) {
    const { error: updateError } = await supabase
      .from("bank_accounts")
      .update({
        current_balance: plaidAccount.balances.current || 0,
        available_balance: plaidAccount.balances.available || 0,
        last_sync_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", accountId);

    if (updateError) {
      console.error("[Plaid] Error updating account:", updateError);
    }
  }

  // Get transactions (last 30 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const transactionsData = await plaidRequest("/transactions/get", {
    access_token: account.plaid_access_token,
    start_date: startDate,
    end_date: endDate,
    options: {
      account_ids: [account.plaid_account_id],
      count: 100,
    },
  });

  console.log(
    `[Plaid] Found ${transactionsData.transactions.length} transactions`
  );

  // Save transactions
  for (const tx of transactionsData.transactions) {
    const { error: txError } = await supabase.from("bank_transactions").upsert(
      {
        bank_account_id: accountId,
        plaid_transaction_id: tx.transaction_id,
        amount: tx.amount,
        currency: tx.iso_currency_code || "EUR",
        date: tx.date,
        name: tx.name,
        merchant_name: tx.merchant_name,
        category: tx.category,
        pending: tx.pending,
        transaction_type: tx.transaction_type,
        payment_channel: tx.payment_channel,
      },
      { onConflict: "plaid_transaction_id" }
    );

    if (txError) {
      console.error("[Plaid] Error saving transaction:", txError);
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
    transactions_synced: transactionsData.transactions.length,
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
    console.error("[Plaid] Error fetching transactions:", error);
    throw error;
  }

  return { transactions };
}

async function removeItem(accountId: string) {
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

  // Handle manual accounts (imported via CSV) - delete directly by ID
  if (account.source === 'manual' || !account.plaid_item_id) {
    console.log(`[Plaid] Deleting manual account: ${accountId}`);
    
    const { error: deleteError } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId);

    if (deleteError) {
      console.error("[Plaid] Error deleting manual account:", deleteError);
      throw deleteError;
    }

    console.log(`[Plaid] Deleted manual account: ${accountId}`);
    return { success: true, deleted_count: 1, account_type: "manual" };
  }

  // Handle Plaid accounts - use plaid_item_id
  const plaidItemId = account.plaid_item_id;

  // Remove item from Plaid
  try {
    await plaidRequest("/item/remove", {
      access_token: account.plaid_access_token,
    });
    console.log(`[Plaid] Removed item from Plaid: ${plaidItemId}`);
  } catch (e) {
    console.log("[Plaid] Item may already be removed from Plaid");
  }

  // Delete ALL accounts with the same plaid_item_id (an item can have multiple accounts)
  const { data: deletedAccounts, error: deleteError } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("plaid_item_id", plaidItemId)
    .select("id");

  if (deleteError) {
    console.error("[Plaid] Error deleting accounts:", deleteError);
    throw deleteError;
  }

  const deletedCount = deletedAccounts?.length || 0;
  console.log(`[Plaid] Deleted ${deletedCount} accounts for item ${plaidItemId}`);

  return { success: true, deleted_count: deletedCount, plaid_item_id: plaidItemId };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PlaidRequest = await req.json();
    console.log(`[Plaid] Action: ${body.action}`);

    let result;

    switch (body.action) {
      case "create_link_token":
        result = await createLinkToken();
        break;

      case "exchange_public_token":
        if (!body.public_token) {
          throw new Error("public_token is required");
        }
        result = await exchangePublicToken(body.public_token);
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

      case "remove_item":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await removeItem(body.account_id);
        break;

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[Plaid] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
