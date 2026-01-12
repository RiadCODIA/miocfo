import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  ai_category_id: string | null;
}

interface CostCategory {
  id: string;
  name: string;
  cost_type: string;
  cashflow_type: string | null;
}

interface SupplierAggregation {
  name: string;
  totalAmount: number;
  transactionCount: number;
  categoryName: string | null;
}

interface CategoryAggregation {
  name: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting spending analysis...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all transactions (expenses only - negative amounts)
    const { data: transactions, error: txError } = await supabase
      .from("bank_transactions")
      .select("id, name, merchant_name, amount, date, ai_category_id")
      .lt("amount", 0)
      .order("date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

    console.log(`Found ${transactions?.length || 0} expense transactions`);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nessuna transazione di spesa trovata. Importa prima un estratto conto.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch cost categories
    const { data: categories, error: catError } = await supabase
      .from("cost_categories")
      .select("id, name, cost_type, cashflow_type")
      .eq("is_active", true);

    if (catError) {
      console.error("Error fetching categories:", catError);
      throw catError;
    }

    const categoryMap = new Map<string, CostCategory>();
    categories?.forEach((cat) => categoryMap.set(cat.id, cat));

    // Aggregate by supplier
    const supplierMap = new Map<string, SupplierAggregation>();
    transactions.forEach((tx: Transaction) => {
      const supplierName = (tx.merchant_name || tx.name || "Sconosciuto").toUpperCase().trim();
      const existing = supplierMap.get(supplierName);
      const catName = tx.ai_category_id ? categoryMap.get(tx.ai_category_id)?.name || null : null;

      if (existing) {
        existing.totalAmount += Math.abs(tx.amount);
        existing.transactionCount += 1;
      } else {
        supplierMap.set(supplierName, {
          name: supplierName,
          totalAmount: Math.abs(tx.amount),
          transactionCount: 1,
          categoryName: catName,
        });
      }
    });

    // Aggregate by category
    const categoryAggMap = new Map<string, { name: string; totalAmount: number; transactionCount: number }>();
    transactions.forEach((tx: Transaction) => {
      const catId = tx.ai_category_id || "uncategorized";
      const catName = tx.ai_category_id
        ? categoryMap.get(tx.ai_category_id)?.name || "Altro"
        : "Non categorizzato";

      const existing = categoryAggMap.get(catId);
      if (existing) {
        existing.totalAmount += Math.abs(tx.amount);
        existing.transactionCount += 1;
      } else {
        categoryAggMap.set(catId, {
          name: catName,
          totalAmount: Math.abs(tx.amount),
          transactionCount: 1,
        });
      }
    });

    // Calculate totals
    const totalSpent = transactions.reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount), 0);

    // Sort suppliers by amount
    const topSuppliers = Array.from(supplierMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15);

    // Sort categories by amount and calculate percentages
    const categoryBreakdown: CategoryAggregation[] = Array.from(categoryAggMap.values())
      .map((cat) => ({
        ...cat,
        percentage: (cat.totalAmount / totalSpent) * 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Prepare data summary for AI
    const dataSummary = {
      totalSpent: totalSpent.toFixed(2),
      transactionCount: transactions.length,
      topSuppliers: topSuppliers.slice(0, 10).map((s) => ({
        name: s.name,
        amount: s.totalAmount.toFixed(2),
        transactions: s.transactionCount,
        category: s.categoryName || "Non categorizzato",
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        name: c.name,
        amount: c.totalAmount.toFixed(2),
        percentage: c.percentage.toFixed(1),
        transactions: c.transactionCount,
      })),
    };

    console.log("Data summary prepared, calling AI...");

    // Call Lovable AI for analysis
    const systemPrompt = `Sei un CFO virtuale esperto in ottimizzazione costi aziendali italiani.
Analizza i dati finanziari forniti e genera un report JSON strutturato con:

1. criticalAreas: Array di aree dove l'azienda spende troppo (max 3-4)
   - category: nome categoria
   - amount: importo in euro (numero)
   - percentage: percentuale sul totale (numero)
   - warning: breve spiegazione del problema (max 20 parole)

2. savingSuggestions: Array di suggerimenti concreti per risparmiare (max 4-5)
   - title: titolo breve del suggerimento
   - description: descrizione dettagliata (max 30 parole)
   - estimatedSaving: risparmio stimato in euro (numero, stima realistica)

3. supplierAnalysis: Array analisi fornitori principali (max 8)
   - name: nome fornitore
   - amount: spesa totale (numero)
   - category: categoria principale
   - status: "high" se costo elevato, "ok" se nella norma, "low" se buon prezzo
   - note: breve nota (max 15 parole)

4. actionItems: Array di 3-5 azioni prioritarie (stringhe brevi)

5. summary: oggetto con:
   - potentialSavings: stima risparmio mensile possibile (numero)
   - criticalAlerts: numero di alert critici
   - mainRisk: rischio principale identificato (stringa breve)
   - recommendation: raccomandazione principale (max 25 parole)

Rispondi SOLO con JSON valido, senza markdown o altro testo.
Sii specifico con nomi e cifre reali basandoti sui dati forniti.
Se un fornitore ha spese significativamente alte rispetto al volume, segnalalo.`;

    const userPrompt = `Analizza questi dati di spesa aziendale:

SPESA TOTALE: €${dataSummary.totalSpent}
NUMERO TRANSAZIONI: ${dataSummary.transactionCount}

TOP FORNITORI:
${dataSummary.topSuppliers.map((s) => `- ${s.name}: €${s.amount} (${s.transactions} transazioni, ${s.category})`).join("\n")}

BREAKDOWN PER CATEGORIA:
${dataSummary.categoryBreakdown.map((c) => `- ${c.name}: €${c.amount} (${c.percentage}%, ${c.transactions} transazioni)`).join("\n")}

Genera il report di analisi in formato JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error("AI API error:", status, errorText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit raggiunto. Riprova tra qualche secondo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti Lovable AI esauriti. Aggiungi crediti nelle impostazioni workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Empty AI response");
    }

    console.log("AI response received, parsing...");

    // Parse AI response (remove potential markdown code blocks)
    let analysisResult;
    try {
      const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse AI analysis");
    }

    // Combine with raw data
    const result = {
      totalSpent,
      transactionCount: transactions.length,
      topCategory: categoryBreakdown[0] || null,
      categoryBreakdown: categoryBreakdown.slice(0, 8),
      topSuppliers: topSuppliers.map((s) => ({
        name: s.name,
        amount: s.totalAmount,
        transactionCount: s.transactionCount,
        category: s.categoryName || "Non categorizzato",
      })),
      aiAnalysis: analysisResult,
    };

    console.log("Analysis complete, returning result");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-spending:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Errore durante l'analisi",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
