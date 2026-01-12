import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
}

interface ExtractedStatement {
  bank_name: string;
  account_number?: string;
  iban?: string;
  period?: { from: string; to: string };
  final_balance?: number;
  currency: string;
  transactions: ExtractedTransaction[];
}

// Parse CSV content for bank statements
function parseCSV(content: string): ExtractedStatement {
  console.log("[process-bank-statement] Parsing CSV...");
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("Il file CSV non contiene dati sufficienti");
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(/[,;]/).map((h) => h.trim().replace(/"/g, ""));

  // Find column indices
  const dateIdx = headers.findIndex((h) =>
    ["data", "date", "data operazione", "data valuta", "data contabile"].includes(h)
  );
  const descIdx = headers.findIndex((h) =>
    ["descrizione", "description", "causale", "movimento", "dettaglio"].includes(h)
  );
  const amountIdx = headers.findIndex((h) =>
    ["importo", "amount", "valore", "euro"].includes(h)
  );
  const debitIdx = headers.findIndex((h) =>
    ["dare", "uscite", "addebito", "debit", "withdrawal"].includes(h)
  );
  const creditIdx = headers.findIndex((h) =>
    ["avere", "entrate", "accredito", "credit", "deposit"].includes(h)
  );
  const balanceIdx = headers.findIndex((h) =>
    ["saldo", "balance", "saldo contabile", "saldo disponibile"].includes(h)
  );

  console.log("[process-bank-statement] Column indices:", {
    dateIdx,
    descIdx,
    amountIdx,
    debitIdx,
    creditIdx,
    balanceIdx,
  });

  if (dateIdx === -1 || descIdx === -1) {
    throw new Error(
      "Colonne obbligatorie non trovate. Assicurati che il CSV contenga colonne per data e descrizione."
    );
  }

  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
    throw new Error(
      "Colonna importo non trovata. Assicurati che il CSV contenga una colonna per importo, dare/avere."
    );
  }

  const transactions: ExtractedTransaction[] = [];
  let finalBalance: number | undefined;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map((v) => v.trim().replace(/"/g, ""));
    if (values.length < Math.max(dateIdx, descIdx) + 1) continue;

    const dateStr = values[dateIdx];
    const description = values[descIdx];

    let amount = 0;
    if (amountIdx !== -1 && values[amountIdx]) {
      amount = parseFloat(values[amountIdx].replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    } else {
      const debit = debitIdx !== -1 && values[debitIdx]
        ? parseFloat(values[debitIdx].replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
        : 0;
      const credit = creditIdx !== -1 && values[creditIdx]
        ? parseFloat(values[creditIdx].replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
        : 0;
      amount = credit - debit;
    }

    const balance = balanceIdx !== -1 && values[balanceIdx]
      ? parseFloat(values[balanceIdx].replace(/[^\d,.-]/g, "").replace(",", "."))
      : undefined;

    if (dateStr && description) {
      transactions.push({
        date: normalizeDate(dateStr),
        description,
        amount,
        balance,
      });

      if (balance !== undefined) {
        finalBalance = balance;
      }
    }
  }

  console.log(`[process-bank-statement] Parsed ${transactions.length} transactions from CSV`);

  return {
    bank_name: "Conto Importato",
    currency: "EUR",
    final_balance: finalBalance,
    transactions,
  };
}

// Normalize date to YYYY-MM-DD format
function normalizeDate(dateStr: string): string {
  // Try common Italian formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const patterns = [
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, // DD/MM/YYYY
    /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, // YYYY/MM/DD
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      if (match[3] && match[3].length === 4) {
        // DD/MM/YYYY
        return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
      } else if (match[1] && match[1].length === 4) {
        // YYYY/MM/DD
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
    }
  }

  // Return as-is if no pattern matches (might already be ISO format)
  return dateStr;
}

// Extract bank statement data using AI (for PDF/images)
async function extractStatementWithAI(
  fileData: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<ExtractedStatement> {
  console.log(`[process-bank-statement] Extracting with AI: ${fileName} (${mimeType})`);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY non configurato");
  }

  const base64Data = btoa(String.fromCharCode(...fileData));

  const systemPrompt = `Sei un esperto nell'analisi di estratti conto bancari. Analizza il documento fornito ed estrai tutte le informazioni in formato JSON strutturato.

IMPORTANTE:
- Estrai TUTTE le transazioni visibili nel documento
- Le date devono essere in formato YYYY-MM-DD
- Gli importi devono essere numeri (positivi per entrate, negativi per uscite)
- Se il documento contiene più pagine, estrai tutte le transazioni`;

  const userPrompt = `Analizza questo estratto conto bancario ed estrai i dati in formato JSON con questa struttura:
{
  "bank_name": "Nome della banca",
  "account_number": "Numero conto o IBAN (se visibile)",
  "iban": "IBAN completo (se visibile)",
  "period": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "final_balance": 12345.67,
  "currency": "EUR",
  "transactions": [
    { "date": "YYYY-MM-DD", "description": "Descrizione movimento", "amount": 123.45, "balance": 12345.67 }
  ]
}

Regole:
- amount positivo = entrata/accredito
- amount negativo = uscita/addebito
- balance è il saldo dopo la transazione (opzionale)
- Estrai tutte le transazioni visibili`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Data}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[process-bank-statement] AI Gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit superato. Riprova tra qualche minuto.");
    }
    if (response.status === 402) {
      throw new Error("Crediti AI esauriti. Aggiungi crediti al workspace.");
    }
    throw new Error(`Errore AI Gateway: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Nessun contenuto estratto dal documento");
  }

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[process-bank-statement] No JSON found in AI response:", content);
    throw new Error("Formato risposta AI non valido");
  }

  try {
    const extracted = JSON.parse(jsonMatch[0]) as ExtractedStatement;
    console.log(
      `[process-bank-statement] AI extracted ${extracted.transactions?.length || 0} transactions`
    );
    return {
      bank_name: extracted.bank_name || "Conto Importato",
      account_number: extracted.account_number,
      iban: extracted.iban,
      period: extracted.period,
      final_balance: extracted.final_balance,
      currency: extracted.currency || "EUR",
      transactions: extracted.transactions || [],
    };
  } catch (e) {
    console.error("[process-bank-statement] JSON parse error:", e, jsonMatch[0]);
    throw new Error("Errore nel parsing dei dati estratti");
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[process-bank-statement] Processing request...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticazione richiesta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("[process-bank-statement] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Token non valido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { file_path, bank_name } = await req.json();
    if (!file_path) {
      return new Response(
        JSON.stringify({ error: "file_path richiesto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-bank-statement] Processing file: ${file_path}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("bank-statements")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("[process-bank-statement] Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Errore nel download del file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file_path.split("/").pop() || "file";
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
    const fileBytes = new Uint8Array(await fileData.arrayBuffer());

    let statement: ExtractedStatement;

    // Process based on file type
    if (fileExt === "csv") {
      const textContent = new TextDecoder().decode(fileBytes);
      statement = parseCSV(textContent);
    } else if (["pdf", "png", "jpg", "jpeg", "webp"].includes(fileExt)) {
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };
      statement = await extractStatementWithAI(fileBytes, fileName, mimeTypes[fileExt] || "application/pdf");
    } else if (["xls", "xlsx"].includes(fileExt)) {
      // For Excel files, we'd need a library. For now, suggest CSV conversion
      return new Response(
        JSON.stringify({ 
          error: "File Excel non supportato direttamente. Per favore esporta il file in formato CSV e riprova." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Formato file non supportato: ${fileExt}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use provided bank name or extracted one
    const finalBankName = bank_name || statement.bank_name || "Conto Importato";

    // Calculate balance from transactions if not provided
    let currentBalance = statement.final_balance;
    if (currentBalance === undefined && statement.transactions.length > 0) {
      // Use balance from last transaction, or sum all amounts
      const lastTx = statement.transactions[statement.transactions.length - 1];
      currentBalance = lastTx.balance ?? statement.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    }
    currentBalance = currentBalance || 0;

    // Create bank account with source: 'manual'
    const accountId = crypto.randomUUID();
    const { data: account, error: accountError } = await supabase
      .from("bank_accounts")
      .insert({
        id: accountId,
        user_id: userId,
        bank_name: finalBankName,
        account_name: statement.account_number || "Conto Principale",
        iban: statement.iban,
        currency: statement.currency,
        current_balance: currentBalance,
        available_balance: currentBalance,
        status: "active",
        source: "manual",
        plaid_item_id: null,
        plaid_account_id: `manual_${accountId}`,
        plaid_access_token: null,
        last_sync_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (accountError) {
      console.error("[process-bank-statement] Account insert error:", accountError);
      return new Response(
        JSON.stringify({ error: "Errore nella creazione del conto" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-bank-statement] Created account: ${account.id}`);

    // Insert transactions
    if (statement.transactions.length > 0) {
      const transactionsToInsert = statement.transactions.map((tx, index) => ({
        id: crypto.randomUUID(),
        bank_account_id: account.id,
        plaid_transaction_id: `manual_${account.id}_${index}`,
        amount: tx.amount,
        currency: statement.currency,
        date: tx.date,
        name: tx.description,
        pending: false,
        transaction_type: tx.amount >= 0 ? "credit" : "debit",
      }));

      const { error: txError } = await supabase
        .from("bank_transactions")
        .insert(transactionsToInsert);

      if (txError) {
        console.error("[process-bank-statement] Transaction insert error:", txError);
        // Don't fail completely, account is created
      } else {
        console.log(`[process-bank-statement] Inserted ${transactionsToInsert.length} transactions`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: account.id,
          bank_name: account.bank_name,
          iban: account.iban,
          current_balance: account.current_balance,
          currency: account.currency,
          source: account.source,
          status: account.status,
          last_sync_at: account.last_sync_at,
        },
        transactions_count: statement.transactions.length,
        period: statement.period,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("[process-bank-statement] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
