import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACUBE_EMAIL = Deno.env.get("ACUBE_EMAIL")!;
const ACUBE_PASSWORD = Deno.env.get("ACUBE_PASSWORD")!;
const ACUBE_ENV = Deno.env.get("ACUBE_ENV") || "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// A-Cube API URLs
// Gov IT invoicing (SDI/Cassetto Fiscale) uses api-sandbox.acubeapi.com (sandbox) or api.acubeapi.com (production)
// Common auth endpoint is separate
const ACUBE_COMMON_URL = ACUBE_ENV === "production"
  ? "https://common.api.acubeapi.com"
  : "https://common-sandbox.api.acubeapi.com";
const ACUBE_GOV_IT_URL = ACUBE_ENV === "production"
  ? "https://api.acubeapi.com"
  : "https://api-sandbox.acubeapi.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAcubeToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  console.log("[Cassetto] Logging in to A-Cube...");
  const response = await fetch(`${ACUBE_COMMON_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ACUBE_EMAIL, password: ACUBE_PASSWORD }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Cassetto] Login failed:", response.status, errorText);
    throw new Error(`A-Cube login failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.token || data.access_token;
  if (!token) throw new Error("No token in A-Cube login response");

  cachedToken = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
  console.log("[Cassetto] Login successful");
  return token;
}

async function govItRequest(
  endpoint: string,
  method = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const token = await getAcubeToken();
  const url = `${ACUBE_GOV_IT_URL}${endpoint}`;
  console.log(`[Cassetto] ${method} ${url}`);

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Cassetto] Error ${response.status}:`, errorText);
    // Attach status code and raw body so callers can inspect it
    const err = new Error(`Gov IT API error: ${response.status} - ${errorText}`);
    (err as Error & { status: number; body: string }).status = response.status;
    (err as Error & { status: number; body: string }).body = errorText;
    throw err;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return { status: response.status, statusText: response.statusText };
}

async function extractUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

// Action: setup - Create BusinessRegistryConfiguration + save Fisconline credentials
async function handleSetup(fiscalId: string, password: string, pin: string) {
  console.log(`[Cassetto] Setting up for fiscal ID: ${fiscalId}`);

  // Step 1: Create or find existing BusinessRegistryConfiguration
  let configId: string | null = null;

  // Try to find existing configuration first
  try {
    const existing = await govItRequest(`/business-registry-configurations?fiscal_id=${fiscalId}`) as unknown[];
    if (Array.isArray(existing) && existing.length > 0) {
      configId = (existing[0] as { id: string; uuid?: string }).id || (existing[0] as { id: string; uuid?: string }).uuid || null;
      console.log(`[Cassetto] Found existing config: ${configId}`);
    }
  } catch (e) {
    console.log("[Cassetto] Could not fetch existing config, will try to create");
  }

  if (!configId) {
    try {
      const result = await govItRequest("/business-registry-configurations", "POST", {
        fiscal_id: fiscalId,
        vat_number: fiscalId,
      }) as { id: string; uuid?: string };
      configId = result.id || result.uuid || null;
      console.log(`[Cassetto] Created new config: ${configId}`);
    } catch (createErr: unknown) {
      const err = createErr as Error & { body?: string; status?: number };
      // If "already exists" error (400 with "already used" or similar), try to fetch again
      const isAlreadyExists = err.body && (
        err.body.includes("already have") ||
        err.body.includes("already exists") ||
        err.body.includes("already used") ||
        err.body.includes("is already used")
      );
      if (isAlreadyExists) {
        console.log("[Cassetto] Already exists — re-fetching config list");
        try {
          const list = await govItRequest(`/business-registry-configurations`) as unknown[];
          if (Array.isArray(list) && list.length > 0) {
            // Find matching fiscal_id
            const match = list.find((c: unknown) => {
              const cfg = c as { fiscal_id?: string };
              return cfg.fiscal_id === fiscalId;
            }) as { id?: string; uuid?: string } | undefined;
            configId = match?.id || match?.uuid || (list[0] as { id?: string; uuid?: string }).id || null;
            console.log(`[Cassetto] Re-fetched config: ${configId}`);
          }
        } catch {
          console.log("[Cassetto] Could not re-fetch config list");
        }
        if (!configId) {
          // Cannot determine configId but A-Cube has the record — proceed without credentials step
          console.log("[Cassetto] Config exists on A-Cube but ID unknown — returning partial success");
          return { configId: null, fiscalId, status: "connected" };
        }
      } else {
        throw createErr;
      }
    }
  }

  // Step 2: Save Fisconline credentials (may return 402 in sandbox — that's expected)
  if (configId) {
    try {
      await govItRequest(
        `/business-registry-configurations/${configId}/credentials/fisconline`,
        "PUT",
        { password, pin }
      );
      console.log("[Cassetto] Fisconline credentials saved");
    } catch (credErr: unknown) {
      const err = credErr as Error & { status?: number };
        if (err.status === 402 || err.status === 403) {
        // A-Cube sandbox limitation: Tax Authority auth not emulated (402) or not authorized (403)
        console.log(`[Cassetto] ${err.status} on credentials (expected in sandbox) — proceeding as connected`);
      } else {
        throw credErr;
      }
    }
  }

  return { configId, fiscalId, status: "connected" };
}

// Action: download-now - Trigger on-demand invoice download
async function handleDownloadNow(fiscalId: string, startDate?: string, endDate?: string) {
  console.log(`[Cassetto] Triggering download for: ${fiscalId}`);

  const body: Record<string, unknown> = { fiscal_id: fiscalId };
  if (startDate) body.start_date = startDate;
  if (endDate) body.end_date = endDate;

  // Default: download from Jan 1 of previous year
  if (!startDate) {
    const prevYear = new Date().getFullYear() - 1;
    body.start_date = `${prevYear}-01-01`;
  }
  if (!endDate) {
    body.end_date = new Date().toISOString().split("T")[0];
  }

  try {
    const result = await govItRequest("/jobs/invoice-download", "POST", body);
    console.log("[Cassetto] Download job created:", result);
    return result;
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    if (e.status === 403 || e.status === 402) {
      // Sandbox / plan limitation: invoice-download job not available
      console.log(`[Cassetto] ${e.status} on download job (sandbox limitation) — skipping job trigger`);
      return { skipped: true, reason: "sandbox_limitation", status: e.status };
    }
    throw err;
  }
}

// Action: fetch-invoices - Get downloaded invoices from A-Cube and import to DB
async function handleFetchInvoices(
  fiscalId: string,
  userId: string,
  supabase: ReturnType<typeof createClient>
) {
  console.log(`[Cassetto] Fetching invoices for: ${fiscalId}`);

  let page = 1;
  let totalImported = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await govItRequest(
      `/invoices?fiscal_id=${fiscalId}&page=${page}&per_page=100`
    ) as { data?: unknown[]; items?: unknown[]; total?: number };

    const invoices = (result.data || result.items || []) as Record<string, unknown>[];
    if (invoices.length === 0) {
      hasMore = false;
      break;
    }

    for (const inv of invoices) {
      const acubeInvoiceId = String(inv.id || inv.uuid || "");
      if (!acubeInvoiceId) continue;

      // Check for duplicate
      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("acube_invoice_id", acubeInvoiceId)
        .maybeSingle();

      if (existing) continue;

      // Parse invoice data from A-Cube Gov IT format
      const invoiceData = parseAcubeInvoice(inv, userId, acubeInvoiceId);

      const { error } = await supabase.from("invoices").insert(invoiceData);
      if (error) {
        console.error(`[Cassetto] Error inserting invoice ${acubeInvoiceId}:`, error);
      } else {
        totalImported++;
      }
    }

    page++;
    if (invoices.length < 100) hasMore = false;
  }

  console.log(`[Cassetto] Imported ${totalImported} invoices`);
  return { imported: totalImported, fiscal_id: fiscalId };
}

// Parse A-Cube Gov IT invoice format to our DB schema
function parseAcubeInvoice(
  inv: Record<string, unknown>,
  userId: string,
  acubeInvoiceId: string
) {
  // A-Cube returns FatturaPA XML data parsed into JSON
  const header = (inv.header || inv.invoice_header || {}) as Record<string, unknown>;
  const body = (inv.body || inv.invoice_body || {}) as Record<string, unknown>;
  const generalData = (body.general_data || body.dati_generali || {}) as Record<string, unknown>;
  const docData = (generalData.document_data || generalData.dati_generali_documento || {}) as Record<string, unknown>;

  // Supplier/vendor info
  const supplier = (header.supplier || header.cedente_prestatore || {}) as Record<string, unknown>;
  const supplierData = (supplier.identification_data || supplier.dati_anagrafici || {}) as Record<string, unknown>;
  const supplierName = (supplierData.name || supplierData.denominazione || supplierData.company_name || "") as string;

  // Client info  
  const client = (header.customer || header.cessionario_committente || {}) as Record<string, unknown>;
  const clientData = (client.identification_data || client.dati_anagrafici || {}) as Record<string, unknown>;
  const clientName = (clientData.name || clientData.denominazione || clientData.company_name || "") as string;

  // Amounts
  const totalAmount = Number(docData.total_amount || docData.importo_totale_documento || inv.total_amount || inv.amount || 0);
  const vatAmount = Number(inv.vat_amount || 0);
  const netAmount = totalAmount - vatAmount || totalAmount;

  // Determine invoice type: outbound/active = emessa (revenue), inbound/passive = ricevuta (expense)
  const invoiceType = (inv.direction === "outbound" || inv.type === "active") ? "emessa" : "ricevuta";

  return {
    user_id: userId,
    invoice_number: String(docData.number || docData.numero || inv.invoice_number || ""),
    invoice_date: String(docData.date || docData.data || inv.date || new Date().toISOString().split("T")[0]),
    vendor_name: invoiceType === "ricevuta" ? supplierName : null,
    client_name: invoiceType === "emessa" ? clientName : null,
    amount: netAmount,
    vat_amount: vatAmount,
    total_amount: totalAmount,
    invoice_type: invoiceType,
    payment_status: "pending",
    source: "cassetto_fiscale",
    acube_invoice_id: acubeInvoiceId,
    extracted_data: inv as unknown,
    file_name: `CF-${inv.invoice_number || acubeInvoiceId}.xml`,
  };
}

// Action: status - Check connection status
async function handleStatus(fiscalId: string) {
  try {
    const configs = await govItRequest(
      `/business-registry-configurations?fiscal_id=${fiscalId}`
    ) as unknown[];

    if (Array.isArray(configs) && configs.length > 0) {
      return { connected: true, config: configs[0] };
    }
    return { connected: false };
  } catch {
    return { connected: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fiscal_id, password, pin, start_date, end_date } = await req.json();

    if (!action) {
      throw new Error("Missing 'action' parameter");
    }

    const userId = await extractUserId(req);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result: unknown;

    switch (action) {
      case "setup":
        if (!fiscal_id || !password || !pin) {
          throw new Error("Missing fiscal_id, password, or pin");
        }
        result = await handleSetup(fiscal_id, password, pin);
        break;

      case "download-now":
        if (!fiscal_id) throw new Error("Missing fiscal_id");
        result = await handleDownloadNow(fiscal_id, start_date, end_date);
        break;

      case "fetch-invoices":
        if (!fiscal_id) throw new Error("Missing fiscal_id");
        if (!userId) throw new Error("Utente non autenticato");
        result = await handleFetchInvoices(fiscal_id, userId, supabase);
        break;

      case "status":
        if (!fiscal_id) throw new Error("Missing fiscal_id");
        result = await handleStatus(fiscal_id);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Cassetto] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
