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
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
  user_id?: string; // Deprecated - now extracted from auth token
  psu_type?: "personal" | "business";
}

// PSU Context extracted from the user's request
interface PsuContext {
  ip: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  referer: string | null;
}

// Extended error with status and payload for retry logic
interface EnableBankingError extends Error {
  status?: number;
  payload?: Record<string, unknown>;
  isRetryable?: boolean;
}

// ============== AUTHENTICATION HELPER ==============
// Extract authenticated user ID from Authorization header
async function extractAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Create a client with the anon key and user's token to verify
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error || !user) {
      console.log("[Enable Banking] Auth token validation failed:", error?.message || "No user");
      return null;
    }
    return user.id;
  } catch (e) {
    console.error("[Enable Banking] Error validating auth token:", e);
    return null;
  }
}

// Extract PSU context from incoming request
function extractPsuContext(req: Request): PsuContext {
  // Try various headers for real IP
  const xForwardedFor = req.headers.get("x-forwarded-for");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const xRealIp = req.headers.get("x-real-ip");
  
  let ip: string | null = null;
  if (xForwardedFor) {
    ip = xForwardedFor.split(",")[0].trim();
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else if (xRealIp) {
    ip = xRealIp;
  }
  
  return {
    ip,
    userAgent: req.headers.get("user-agent"),
    acceptLanguage: req.headers.get("accept-language"),
    referer: req.headers.get("referer"),
  };
}

// Build PSU headers for Enable Banking API (only include non-null values)
function buildPsuHeaders(psuContext: PsuContext): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (psuContext.ip && psuContext.ip !== "0.0.0.0") {
    headers["Psu-Ip-Address"] = psuContext.ip;
  }
  if (psuContext.userAgent) {
    headers["Psu-User-Agent"] = psuContext.userAgent;
  }
  if (psuContext.acceptLanguage) {
    headers["Psu-Accept-Language"] = psuContext.acceptLanguage;
  }
  if (psuContext.referer) {
    headers["Psu-Referer"] = psuContext.referer;
  }
  
  headers["Psu-Accept"] = "application/json";
  
  return headers;
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
    aud: "api.enablebanking.com",
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

// Simple delay helper for retry/backoff
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Make authenticated request to Enable Banking API with structured error handling
async function enableBankingRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>,
  psuHeaders?: Record<string, string>
): Promise<unknown> {
  const jwt = await createJWT();
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${jwt}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...psuHeaders,
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`[Enable Banking] ${method} ${ENABLE_BANKING_API_URL}${endpoint}`);
  if (psuHeaders && Object.keys(psuHeaders).length > 0) {
    console.log(`[Enable Banking] PSU headers included:`, Object.keys(psuHeaders).join(", "));
  }
  
  const response = await fetch(`${ENABLE_BANKING_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Enable Banking] Error ${response.status}:`, errorText);
    
    let parsedPayload: Record<string, unknown> | undefined;
    try {
      parsedPayload = JSON.parse(errorText);
    } catch {
      // Not JSON
    }
    
    const error = new Error(`Enable Banking API error: ${response.status} - ${errorText}`) as EnableBankingError;
    error.status = response.status;
    error.payload = parsedPayload;
    
    const isAspspError = parsedPayload?.error === "ASPSP_ERROR" || 
                         errorText.includes("ASPSP_ERROR") ||
                         errorText.includes("Error interacting with ASPSP");
    const isPeriodError = parsedPayload?.error === "WRONG_TRANSACTIONS_PERIOD" ||
                          errorText.includes("WRONG_TRANSACTIONS_PERIOD") ||
                          response.status === 422;
    
    error.isRetryable = (response.status === 400 && isAspspError) || isPeriodError;
    
    throw error;
  }
  
  return response.json();
}

// Create an authorization request and get the authorization URL
async function createSession(
  redirectUri: string,
  aspspCountry: string,
  aspspName: string,
  psuType: "personal" | "business" = "personal"
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
    psu_type: psuType,
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

// Helper to safely parse amounts (handles string/number from PSD2 APIs)
const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Get "yesterday" date in YYYY-MM-DD format (many banks reject "today")
function getYesterday(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

// Get "today" date in YYYY-MM-DD format
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ============== STABLE TRANSACTION ID GENERATION ==============
// Generates a stable, unique transaction ID even when bank doesn't provide one
// Priority: transaction_id > entry_reference > reference_number > deterministic hash
async function computeExternalTransactionId(
  enableBankingUid: string,
  // deno-lint-ignore no-explicit-any
  tx: any
): Promise<string> {
  // Priority 1: Use transaction_id if available
  if (tx.transaction_id && typeof tx.transaction_id === "string" && tx.transaction_id.trim()) {
    return `eb:${enableBankingUid}:tx:${tx.transaction_id.trim()}`;
  }
  
  // Priority 2: Use entry_reference (common in Revolut, other banks)
  if (tx.entry_reference && typeof tx.entry_reference === "string" && tx.entry_reference.trim()) {
    return `eb:${enableBankingUid}:entry:${tx.entry_reference.trim()}`;
  }
  
  // Priority 3: Use reference_number
  if (tx.reference_number && typeof tx.reference_number === "string" && tx.reference_number.trim()) {
    return `eb:${enableBankingUid}:ref:${tx.reference_number.trim()}`;
  }
  
  // Priority 4: Generate deterministic hash from stable fields
  const stableFields = [
    enableBankingUid,
    tx.booking_date || "",
    tx.value_date || "",
    String(tx.transaction_amount?.amount || ""),
    tx.transaction_amount?.currency || "",
    tx.credit_debit_indicator || "",
    (tx.remittance_information || []).join("|"),
    tx.creditor?.name || tx.creditor_name || "",
    tx.debtor?.name || tx.debtor_name || "",
    tx.creditor_account?.iban || "",
    tx.debtor_account?.iban || "",
  ];
  
  const dataToHash = stableFields.map(s => String(s).trim()).join("|");
  
  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Use first 32 chars of hash (128 bits, sufficient for uniqueness)
  return `eb:${enableBankingUid}:hash:${hashHex.substring(0, 32)}`;
}

// ============== AMOUNT SIGN CORRECTION ==============
// Applies correct sign based on credit_debit_indicator
// CRDT = credit = positive (money in)
// DBIT = debit = negative (money out)
function applyAmountSign(rawAmount: number, creditDebitIndicator: string | null): number {
  const absAmount = Math.abs(rawAmount);
  
  if (creditDebitIndicator === "DBIT") {
    return -absAmount; // Debit: money out = negative
  } else if (creditDebitIndicator === "CRDT") {
    return absAmount; // Credit: money in = positive
  } else {
    // Fallback: keep original sign (or positive if unclear)
    console.log(`[Enable Banking] Warning: missing credit_debit_indicator, keeping amount as-is: ${rawAmount}`);
    return rawAmount;
  }
}

// Sync transactions with automatic fallback to shorter periods
// Uses "yesterday" as default endDate (many banks don't allow "today")
// Adds transaction_status=BOOK for reliable results
// Tries 365 → 90 → 30 → 7 days on ASPSP_ERROR or period errors
async function syncAccountTransactionsWithFallback(
  dbAccountId: string,
  enableBankingUid: string,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  psuContext: PsuContext,
  windowsDays: number[] = [365, 90, 30, 7],
  retryCount: number = 2
): Promise<{ transactions_synced: number; period_used: number }> {
  
  const psuHeaders = buildPsuHeaders(psuContext);
  console.log(`[Enable Banking] syncWithFallback: ${enableBankingUid}, windows: ${windowsDays.join(", ")} days`);
  console.log(`[Enable Banking] PSU context: IP=${psuContext.ip || "none"}, UA=${psuContext.userAgent?.substring(0, 50) || "none"}`);
  
  const endDates = [getYesterday(), getToday()];
  
  let lastError: EnableBankingError | null = null;
  
  for (const endDate of endDates) {
    console.log(`[Enable Banking] Trying endDate: ${endDate}`);
    
    for (const days of windowsDays) {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      console.log(`[Enable Banking] Trying ${days}-day window: ${startDate} to ${endDate}`);
      
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          const result = await syncAccountTransactionsCore(
            dbAccountId,
            enableBankingUid,
            startDate,
            endDate,
            supabase,
            psuHeaders
          );
          
          console.log(`[Enable Banking] SUCCESS with ${days}-day window (endDate=${endDate}): ${result.transactions_synced} transactions`);
          return { transactions_synced: result.transactions_synced, period_used: days };
          
        } catch (error) {
          lastError = error as EnableBankingError;
          const status = lastError.status || 0;
          const isRetryable = lastError.isRetryable || false;
          
          console.log(`[Enable Banking] ${days}-day window failed (attempt ${attempt}/${retryCount}): status=${status}, retryable=${isRetryable}`);
          
          if (status === 429) {
            console.log(`[Enable Banking] Rate limit (429) - stopping retries`);
            throw new Error("Limite di accesso alla banca raggiunto. Riprova tra qualche ora.");
          }
          
          if (status === 401 || status === 403) {
            console.log(`[Enable Banking] Auth/consent error (${status}) - stopping retries`);
            throw new Error("Consenso scaduto o revocato: scollega e ricollega il conto.");
          }
          
          if (isRetryable && attempt < retryCount) {
            const waitMs = 1000 * Math.pow(2, attempt - 1);
            console.log(`[Enable Banking] Waiting ${waitMs}ms before retry...`);
            await delay(waitMs);
            continue;
          }
          
          if (isRetryable) {
            console.log(`[Enable Banking] Will try shorter window...`);
            break;
          }
          
          if (!isRetryable) {
            throw error;
          }
        }
      }
    }
  }
  
  console.error(`[Enable Banking] All period windows failed`);
  throw lastError || new Error("Impossibile recuperare le transazioni dalla banca.");
}

// Define transaction type for Enable Banking API (PSD2/ISO 20022)
interface EnableBankingTransaction {
  transaction_id?: string | null;
  entry_reference?: string;
  merchant_category_code?: string;
  transaction_amount: { amount: string | number; currency: string };
  creditor?: { name?: string };
  creditor_account?: { iban?: string };
  debtor?: { name?: string };
  debtor_account?: { iban?: string };
  bank_transaction_code?: { description?: string; code?: string };
  credit_debit_indicator?: "CRDT" | "DBIT" | string;
  status?: "BOOK" | "PDNG" | string;
  booking_date: string;
  value_date?: string;
  transaction_date?: string;
  balance_after_transaction?: { amount: string | number; currency: string };
  reference_number?: string;
  remittance_information?: string[];
  note?: string;
  creditor_name?: string;
  debtor_name?: string;
}

// Core transaction sync logic with proper ID generation and amount signs
async function syncAccountTransactionsCore(
  dbAccountId: string,
  enableBankingUid: string,
  startDate: string,
  endDate: string,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  psuHeaders: Record<string, string>
): Promise<{ transactions_synced: number }> {
  console.log(`[Enable Banking] syncCore: ${enableBankingUid} from ${startDate} to ${endDate}`);
  
  // Fetch all transactions with pagination
  let allTransactions: EnableBankingTransaction[] = [];
  let continuationKey: string | undefined;
  let pageCount = 0;
  const maxPages = 50;
  
  do {
    pageCount++;
    const url = `/accounts/${enableBankingUid}/transactions?date_from=${startDate}&date_to=${endDate}&transaction_status=BOOK` +
      (continuationKey ? `&continuation_key=${encodeURIComponent(continuationKey)}` : "");
    
    console.log(`[Enable Banking] Fetching transactions page ${pageCount}...`);
    
    const transactionsResponse = await enableBankingRequest(url, "GET", undefined, psuHeaders) as {
      transactions?: EnableBankingTransaction[];
      continuation_key?: string;
      booked?: EnableBankingTransaction[];
      pending?: EnableBankingTransaction[];
    };
    
    const transactions = transactionsResponse.transactions || 
      [...(transactionsResponse.booked || []), ...(transactionsResponse.pending || [])];
    
    if (transactions.length > 0) {
      allTransactions.push(...transactions);
      console.log(`[Enable Banking] Page ${pageCount}: ${transactions.length} transactions (total: ${allTransactions.length})`);
    }
    
    continuationKey = transactionsResponse.continuation_key;
  } while (continuationKey && pageCount < maxPages);
  
  const fetchedCount = allTransactions.length;
  console.log(`[Enable Banking] Total transactions fetched: ${fetchedCount} in ${pageCount} pages`);
  
  let transactionsSynced = 0;
  let failedCount = 0;
  const maxErrorsToLog = 5;
  
  for (const tx of allTransactions) {
    try {
      // Generate stable transaction ID (fixes null transaction_id issue)
      const externalTxId = await computeExternalTransactionId(enableBankingUid, tx);
      
      // Apply correct amount sign based on credit_debit_indicator
      const rawAmount = toNumber(tx.transaction_amount?.amount);
      const signedAmount = applyAmountSign(rawAmount, tx.credit_debit_indicator || null);
      
      const transactionData = {
        bank_account_id: dbAccountId,
        plaid_transaction_id: externalTxId, // Now always non-null!
        amount: signedAmount, // Now correctly signed!
        currency: tx.transaction_amount?.currency || "EUR",
        date: tx.booking_date,
        value_date: tx.value_date || null,
        transaction_date: tx.transaction_date || null,
        name: tx.remittance_information?.join(" ") || 
              tx.creditor?.name || tx.creditor_name ||
              tx.debtor?.name || tx.debtor_name || 
              "Transazione",
        merchant_name: tx.creditor?.name || tx.creditor_name || 
                      tx.debtor?.name || tx.debtor_name || null,
        creditor_name: tx.creditor?.name || tx.creditor_name || null,
        creditor_iban: tx.creditor_account?.iban || null,
        debtor_name: tx.debtor?.name || tx.debtor_name || null,
        debtor_iban: tx.debtor_account?.iban || null,
        credit_debit_indicator: tx.credit_debit_indicator || null,
        pending: tx.status === "PDNG",
        mcc_code: tx.merchant_category_code || null,
        bank_tx_code: tx.bank_transaction_code?.code || null,
        bank_tx_description: tx.bank_transaction_code?.description || null,
        reference_number: tx.reference_number || null,
        balance_after: tx.balance_after_transaction ? toNumber(tx.balance_after_transaction.amount) : null,
        entry_reference: tx.entry_reference || null,
        raw_data: tx,
      };
      
      const { error } = await supabase
        .from("bank_transactions")
        .upsert(transactionData, { onConflict: "plaid_transaction_id" });
      
      if (!error) {
        transactionsSynced++;
      } else {
        failedCount++;
        if (failedCount <= maxErrorsToLog) {
          console.error(`[Enable Banking] Error upserting transaction ${externalTxId}:`, error.message);
        }
      }
    } catch (e) {
      failedCount++;
      if (failedCount <= maxErrorsToLog) {
        console.error(`[Enable Banking] Exception processing transaction:`, e);
      }
    }
  }
  
  // Log summary
  console.log(`[Enable Banking] Sync summary: fetched=${fetchedCount}, synced=${transactionsSynced}, failed=${failedCount}`);
  
  // Throw explicit error if we got transactions but couldn't save any
  if (fetchedCount > 0 && transactionsSynced === 0) {
    throw new Error(`Transazioni ricevute (${fetchedCount}) ma non salvate: errore di mapping/constraint. Controlla i log.`);
  }
  
  return { transactions_synced: transactionsSynced };
}

// ============== DEBUG TRANSACTIONS ACTION ==============
// Diagnostic endpoint to test different parameter combinations
// Returns raw API responses to help troubleshoot bank-specific issues
async function debugTransactions(
  accountId: string,
  userId: string,
  psuContext: PsuContext
): Promise<{
  account_id: string;
  enable_banking_uid: string;
  psu_context: { ip: string | null; userAgent: string | null };
  test_results: Array<{
    variant: string;
    params: Record<string, string>;
    status: number | string;
    body: unknown;
    success: boolean;
  }>;
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership
  const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
  if (!isOwner) {
    throw new Error("Account not found or access denied");
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
  const psuHeaders = buildPsuHeaders(psuContext);
  
  console.log(`[Enable Banking] DEBUG_TRANSACTIONS for ${accountUid}`);
  console.log(`[Enable Banking] PSU context: IP=${psuContext.ip || "none"}, UA=${psuContext.userAgent?.substring(0, 50) || "none"}`);
  
  const yesterday = getYesterday();
  const today = getToday();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  // Test variants to try
  const variants = [
    { 
      name: "no_dates", 
      url: `/accounts/${accountUid}/transactions`
    },
    { 
      name: "yesterday_7d", 
      url: `/accounts/${accountUid}/transactions?date_from=${sevenDaysAgo}&date_to=${yesterday}`
    },
    { 
      name: "yesterday_7d_BOOK", 
      url: `/accounts/${accountUid}/transactions?date_from=${sevenDaysAgo}&date_to=${yesterday}&transaction_status=BOOK`
    },
    { 
      name: "today_7d", 
      url: `/accounts/${accountUid}/transactions?date_from=${sevenDaysAgo}&date_to=${today}`
    },
    { 
      name: "today_30d_BOOK", 
      url: `/accounts/${accountUid}/transactions?date_from=${thirtyDaysAgo}&date_to=${today}&transaction_status=BOOK`
    },
    { 
      name: "yesterday_30d_BOOK", 
      url: `/accounts/${accountUid}/transactions?date_from=${thirtyDaysAgo}&date_to=${yesterday}&transaction_status=BOOK`
    },
  ];
  
  const results: Array<{
    variant: string;
    params: Record<string, string>;
    status: number | string;
    body: unknown;
    success: boolean;
  }> = [];
  
  for (const variant of variants) {
    console.log(`[Enable Banking] Testing variant: ${variant.name}`);
    
    try {
      const jwt = await createJWT();
      const response = await fetch(`${ENABLE_BANKING_API_URL}${variant.url}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...psuHeaders,
        },
      });
      
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      
      results.push({
        variant: variant.name,
        params: Object.fromEntries(new URL(`${ENABLE_BANKING_API_URL}${variant.url}`).searchParams),
        status: response.status,
        body,
        success: response.ok,
      });
      
      console.log(`[Enable Banking] Variant ${variant.name}: status=${response.status}, ok=${response.ok}`);
      
    } catch (error) {
      results.push({
        variant: variant.name,
        params: Object.fromEntries(new URL(`${ENABLE_BANKING_API_URL}${variant.url}`).searchParams),
        status: "error",
        body: { error: error instanceof Error ? error.message : String(error) },
        success: false,
      });
    }
  }
  
  return {
    account_id: accountId,
    enable_banking_uid: accountUid,
    psu_context: {
      ip: psuContext.ip,
      userAgent: psuContext.userAgent?.substring(0, 80) || null,
    },
    test_results: results,
  };
}

// Complete the authorization after user returns with code
async function completeSession(code: string, userId: string, psuContext: PsuContext): Promise<{ accounts: unknown[] }> {
  console.log(`[Enable Banking] Completing session with code: ${code.substring(0, 20)}...`);
  console.log(`[Enable Banking] User ID: ${userId}`);
  
  // Exchange the authorization code for a session
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
  console.log("[Enable Banking] POST /sessions FULL RESPONSE:", JSON.stringify(session));
  console.log("[Enable Banking] Accounts in response:", session.accounts?.length || 0);
  
  let accounts: EnableBankingAccount[] = session.accounts || [];
  
  if (accounts.length === 0) {
    console.log("[Enable Banking] No accounts in session response, fetching session details...");
    
    try {
      const sessionDetails = await enableBankingRequest(`/sessions/${session.session_id}`) as {
        accounts?: string[];
        accounts_data?: Array<{ uid: string; identification_hash?: string }>;
        aspsp?: {
          name: string;
          country: string;
        };
        status?: string;
      };
      
      console.log("[Enable Banking] GET /sessions FULL RESPONSE:", JSON.stringify(sessionDetails));
      console.log("[Enable Banking] Session status:", sessionDetails.status);
      console.log("[Enable Banking] Session details accounts:", sessionDetails.accounts?.length || 0);
      console.log("[Enable Banking] Session details accounts_data:", sessionDetails.accounts_data?.length || 0);
      
      const accountIds: string[] = sessionDetails.accounts || 
        (sessionDetails.accounts_data?.map(a => a.uid) || []);
      
      console.log("[Enable Banking] Account IDs to process:", accountIds);
      
      if (accountIds.length > 0) {
        for (const accountId of accountIds) {
          try {
            const accountDetails = await enableBankingRequest(`/accounts/${accountId}/details`) as EnableBankingAccount;
            console.log(`[Enable Banking] Account ${accountId} details:`, JSON.stringify(accountDetails));
            if (accountDetails) {
              accounts.push({
                ...accountDetails,
                uid: accountDetails.uid || accountId,
              });
            }
          } catch (e) {
            console.log(`[Enable Banking] Could not fetch details for account ${accountId}:`, e);
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
  // deno-lint-ignore no-explicit-any
  const savedAccounts: any[] = [];

  for (const account of accounts) {
    let currentBalance = 0;
    let availableBalance = 0;
    
    let balanceFetchFailed = false;
    try {
      const balancesResponse = await enableBankingRequest(`/accounts/${account.uid}/balances`) as {
        balances?: Array<{
          balance_amount: {
            amount: unknown;
            currency: string;
          };
          balance_type: string;
        }>;
      };
      
      console.log(`[Enable Banking] Balances RAW response for ${account.uid}:`, JSON.stringify(balancesResponse));
      
      if (balancesResponse.balances && balancesResponse.balances.length > 0) {
        for (const balance of balancesResponse.balances) {
          const amount = toNumber(balance.balance_amount?.amount);
          if (["closingBooked", "interimBooked", "CLBD", "ITBD"].includes(balance.balance_type)) {
            currentBalance = amount;
          }
          if (["interimAvailable", "expected", "ITAV", "CLAV", "FWAV"].includes(balance.balance_type)) {
            availableBalance = amount;
          }
        }
        console.log(`[Enable Banking] Parsed balances for ${account.uid}: current=${currentBalance}, available=${availableBalance}`);
      } else {
        console.log(`[Enable Banking] No balances array in response for ${account.uid}`);
      }
    } catch (e) {
      console.error("[Enable Banking] FAILED to fetch balances for account", account.uid, ":", e);
      balanceFetchFailed = true;
    }
    
    const iban = account.iban || account.account_id?.iban || null;
    const accountStatus = balanceFetchFailed ? "pending" : "active";
    
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
  
  // ============ AUTO-SYNC TRANSACTIONS FOR NEW ACCOUNTS ============
  // Wait a short moment before first sync (some banks need time)
  console.log("[Enable Banking] Waiting 2s before auto-sync (bank stabilization)...");
  await delay(2000);
  
  console.log("[Enable Banking] Starting auto-sync of transactions for new accounts...");
  
  for (const savedAccount of savedAccounts) {
    try {
      const accountUid = savedAccount.plaid_account_id;
      
      console.log(`[Enable Banking] Auto-syncing ${savedAccount.bank_name} (${accountUid})`);
      
      const syncResult = await syncAccountTransactionsWithFallback(
        savedAccount.id,
        accountUid,
        supabase,
        psuContext,
        [365, 90, 30, 7]
      );
      
      console.log(`[Enable Banking] Auto-synced ${syncResult.transactions_synced} transactions (${syncResult.period_used} days) for ${savedAccount.bank_name}`);
      
      await supabase
        .from("bank_accounts")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", savedAccount.id);
        
    } catch (syncError) {
      // Log but don't fail the whole operation - account is still connected
      console.error(`[Enable Banking] Auto-sync FAILED for ${savedAccount.bank_name}:`, syncError);
      // Account remains connected, user can sync manually later
    }
  }
  
  console.log("[Enable Banking] Auto-sync complete for all accounts");
  
  return { accounts: savedAccounts };
}

// Get accounts from database (filtered by user_id)
async function getAccounts(userId: string): Promise<{ accounts: unknown[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: accounts, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[Enable Banking] Error fetching accounts:", error);
    throw new Error("Failed to fetch accounts");
  }
  
  return { accounts: accounts || [] };
}

// ============== AUTO CATEGORIZATION TRIGGER ==============
// Trigger automatic categorization of new transactions in background
async function triggerAutoCategorization(): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/categorize-transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ batch_mode: true }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Enable Banking] Auto-categorization failed:", response.status, errorText);
    } else {
      const result = await response.json();
      console.log(`[Enable Banking] Auto-categorization complete:`, result.message);
    }
  } catch (error) {
    console.error("[Enable Banking] Auto-categorization error:", error);
  }
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
async function syncAccount(accountId: string, userId: string, psuContext: PsuContext): Promise<{ account: unknown; transactions_synced: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
  if (!isOwner) {
    throw new Error("Account not found or access denied");
  }
  
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
    const balancesResponse = await enableBankingRequest(`/accounts/${accountUid}/balances`) as {
      balances?: Array<{
        balance_amount: {
          amount: unknown;
          currency: string;
        };
        balance_type: string;
      }>;
    };
    
    console.log(`[Enable Banking] Sync - Balances RAW response:`, JSON.stringify(balancesResponse));
    
    let currentBalance = account.current_balance;
    let availableBalance = account.available_balance;
    
    if (balancesResponse.balances && balancesResponse.balances.length > 0) {
      for (const balance of balancesResponse.balances) {
        const amount = toNumber(balance.balance_amount?.amount);
        if (["closingBooked", "interimBooked", "CLBD", "ITBD"].includes(balance.balance_type)) {
          currentBalance = amount;
        }
        if (["interimAvailable", "expected", "ITAV", "CLAV", "FWAV"].includes(balance.balance_type)) {
          availableBalance = amount;
        }
      }
      console.log(`[Enable Banking] Sync - Parsed balances: current=${currentBalance}, available=${availableBalance}`);
    }
    
    const accountCreatedAt = new Date(account.created_at);
    const hoursSinceCreation = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60);
    const isFreshConnection = hoursSinceCreation <= 1;
    
    const windowsDays = isFreshConnection ? [365, 90, 30, 7] : [90, 30, 7];
    
    console.log(`[Enable Banking] Fresh connection: ${isFreshConnection}, windows: ${windowsDays.join(", ")}`);
    
    const syncResult = await syncAccountTransactionsWithFallback(
      accountId,
      accountUid,
      supabase,
      psuContext,
      windowsDays
    );
    
    const { data: updatedAccount, error: updateError } = await supabase
      .from("bank_accounts")
      .update({
        current_balance: currentBalance,
        available_balance: availableBalance,
        status: "active",
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`[Enable Banking] Sync complete: ${syncResult.transactions_synced} transactions (${syncResult.period_used} days), status=active`);

    // Trigger automatic categorization in background (non-blocking - fire and forget)
    if (syncResult.transactions_synced > 0) {
      console.log(`[Enable Banking] Triggering automatic categorization for new transactions...`);
      // Fire and forget - don't await so we return immediately
      triggerAutoCategorization().catch(e => console.error("[Enable Banking] Background categorization error:", e));
    }
    
    return { account: updatedAccount, transactions_synced: syncResult.transactions_synced };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Enable Banking] Sync error:", errorMessage);
    
    let newStatus = "error";
    let userMessage = "Errore nella sincronizzazione del conto.";
    
    if (errorMessage.includes("429") || errorMessage.includes("ASPSP_RATE_LIMIT_EXCEEDED") || errorMessage.includes("rate limit") || errorMessage.includes("Limite di accesso")) {
      userMessage = "Limite giornaliero raggiunto: la banca limita gli accessi. Riprova tra qualche ora.";
      newStatus = "error";
    } else if (errorMessage.includes("Consenso scaduto") || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized") || errorMessage.includes("consent")) {
      userMessage = "Consenso scaduto o revocato: scollega e ricollega il conto per autorizzare nuovamente.";
      newStatus = "disconnected";
    } else if (errorMessage.includes("SESSION_EXPIRED") || errorMessage.includes("session")) {
      userMessage = "Sessione scaduta: scollega e ricollega il conto bancario.";
      newStatus = "disconnected";
    } else if (errorMessage.includes("Impossibile recuperare") || errorMessage.includes("non salvate")) {
      userMessage = errorMessage; // Keep original message for constraint errors
      newStatus = "error";
    }
    
    console.log(`[Enable Banking] Setting account ${accountId} status to ${newStatus}`);
    
    await supabase
      .from("bank_accounts")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);
    
    throw new Error(userMessage);
  }
}

// Get transactions for an account
async function getTransactions(
  accountId: string,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{ transactions: unknown[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
  if (!isOwner) {
    throw new Error("Account not found or access denied");
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
async function removeConnection(accountId: string, userId: string): Promise<{ success: boolean; deleted_count: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const isOwner = await verifyAccountOwnership(supabase, accountId, userId);
  if (!isOwner) {
    throw new Error("Account not found or access denied");
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
    const { action } = body;
    
    // Extract PSU context from the request
    const psuContext = extractPsuContext(req);
    
    // ========== SECURITY: Extract user from auth token ==========
    // Actions that don't require authentication
    const publicActions = ["create_session", "get_aspsps"];
    
    let userId: string | null = null;
    
    if (!publicActions.includes(action)) {
      // Extract authenticated user from Authorization header
      userId = await extractAuthenticatedUserId(req);
      
      if (!userId) {
        console.error(`[Enable Banking] Unauthorized access attempt for action: ${action}`);
        return new Response(
          JSON.stringify({ error: "Autenticazione richiesta. Effettua il login." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    
    console.log(`[Enable Banking] Action: ${action}, User: ${userId || "public"}`);
    console.log(`[Enable Banking] PSU Context: IP=${psuContext.ip || "none"}`);
    
    let result: unknown;
    
    switch (action) {
      case "create_session":
        if (!body.redirect_uri) {
          throw new Error("redirect_uri is required");
        }
        if (!body.aspsp_country || !body.aspsp_name) {
          throw new Error("aspsp_country and aspsp_name are required");
        }
        result = await createSession(body.redirect_uri, body.aspsp_country, body.aspsp_name, body.psu_type || "personal");
        break;
        
      case "complete_session":
        if (!body.code) {
          throw new Error("code is required");
        }
        result = await completeSession(body.code, userId!, psuContext);
        break;
        
      case "get_accounts":
        result = await getAccounts(userId!);
        break;
        
      case "sync_account":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await syncAccount(body.account_id, userId!, psuContext);
        break;
        
      case "get_transactions":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await getTransactions(body.account_id, userId!, body.start_date, body.end_date);
        break;
        
      case "remove_connection":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await removeConnection(body.account_id, userId!);
        break;
        
      case "get_aspsps":
        if (!body.aspsp_country) {
          throw new Error("aspsp_country is required");
        }
        result = await getASPSPs(body.aspsp_country);
        break;
        
      case "debug_transactions":
        if (!body.account_id) {
          throw new Error("account_id is required");
        }
        result = await debugTransactions(body.account_id, userId!, psuContext);
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
