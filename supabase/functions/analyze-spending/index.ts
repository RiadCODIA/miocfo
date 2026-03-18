import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  id: string;
  description: string | null;
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

interface MonthlyData {
  month: string;
  spending: number;
  income: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting enhanced spending analysis...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Extract user identity from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non autenticato. Effettua il login." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use anon key + user's auth header to validate identity
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    // Service role client for data queries (with explicit user_id filter)
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Analyzing spending for user: ${userId}`);

    // Fetch ALL transactions for THIS USER (both income and expenses)
    const { data: allTransactions, error: allTxError } = await supabase
      .from("bank_transactions")
      .select("id, description, merchant_name, amount, date, ai_category_id")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (allTxError) {
      console.error("Error fetching transactions:", allTxError);
      throw allTxError;
    }

    // Separate expenses and income
    const expenses = allTransactions?.filter((tx) => tx.amount < 0) || [];
    const incomes = allTransactions?.filter((tx) => tx.amount > 0) || [];

    console.log(`Found ${expenses.length} expenses, ${incomes.length} incomes, total: ${allTransactions?.length || 0}`);

    if (!allTransactions || allTransactions.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nessuna transazione trovata. Sincronizza prima i conti bancari.",
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

    // Calculate totals
    const totalSpent = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);

    // === NEW: Monthly aggregation ===
    const monthlyDataMap = new Map<string, MonthlyData>();
    allTransactions?.forEach((tx) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      const existing = monthlyDataMap.get(month) || { month, spending: 0, income: 0 };
      if (tx.amount < 0) {
        existing.spending += Math.abs(tx.amount);
      } else {
        existing.income += tx.amount;
      }
      monthlyDataMap.set(month, existing);
    });

    const monthlyData = Array.from(monthlyDataMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate month-over-month changes
    const monthlyTrend = monthlyData.map((m, i) => {
      const prev = i > 0 ? monthlyData[i - 1].spending : m.spending;
      const changePercent = prev > 0 ? ((m.spending - prev) / prev) * 100 : 0;
      return {
        month: m.month,
        spending: Math.round(m.spending * 100) / 100,
        income: Math.round(m.income * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
      };
    });

    // === Calculate period in months ===
    const months = monthlyData.length || 1;

    // Aggregate by supplier with enhanced metrics
    const supplierMap = new Map<string, SupplierAggregation>();
    expenses.forEach((tx: Transaction) => {
      const supplierName = (tx.merchant_name || tx.description || "Sconosciuto").toUpperCase().trim();
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
    expenses.forEach((tx: Transaction) => {
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

    // Sort suppliers by amount with enhanced metrics
    const topSuppliers = Array.from(supplierMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15)
      .map((s) => ({
        ...s,
        monthlyAverage: Math.round((s.totalAmount / months) * 100) / 100,
        avgTransactionAmount: Math.round((s.totalAmount / s.transactionCount) * 100) / 100,
        monthlyFrequency: Math.round((s.transactionCount / months) * 10) / 10,
      }));

    // Sort categories by amount and calculate percentages
    const categoryBreakdown: CategoryAggregation[] = Array.from(categoryAggMap.values())
      .map((cat) => ({
        ...cat,
        percentage: (cat.totalAmount / totalSpent) * 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // === Detect potential anomalies (simple heuristics) ===
    const avgTransaction = totalSpent / expenses.length;
    const potentialAnomalies = expenses
      .filter((tx) => Math.abs(tx.amount) > avgTransaction * 5) // 5x average
      .slice(0, 10)
      .map((tx) => ({
        name: tx.merchant_name || tx.description || "Sconosciuto",
        amount: Math.abs(tx.amount),
        date: tx.date,
        deviation: Math.round((Math.abs(tx.amount) / avgTransaction) * 10) / 10,
      }));

    // Prepare enhanced data summary for AI
    const dataSummary = {
      totalSpent: totalSpent.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      netCashFlow: (totalIncome - totalSpent).toFixed(2),
      cashFlowRatio: totalSpent > 0 ? (totalIncome / totalSpent).toFixed(2) : "N/A",
      transactionCount: expenses.length,
      periodMonths: months,
      avgMonthlySpending: (totalSpent / months).toFixed(2),
      avgTransactionAmount: avgTransaction.toFixed(2),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        spending: m.spending.toFixed(2),
        income: m.income.toFixed(2),
        changePercent: m.changePercent.toFixed(1),
      })),
      topSuppliers: topSuppliers.slice(0, 12).map((s) => ({
        name: s.name,
        totalAmount: s.totalAmount.toFixed(2),
        transactions: s.transactionCount,
        monthlyAverage: s.monthlyAverage.toFixed(2),
        avgPerTransaction: s.avgTransactionAmount.toFixed(2),
        monthlyFrequency: s.monthlyFrequency,
        category: s.categoryName || "Non categorizzato",
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        name: c.name,
        amount: c.totalAmount.toFixed(2),
        percentage: c.percentage.toFixed(1),
        transactions: c.transactionCount,
        avgPerTransaction: (c.totalAmount / c.transactionCount).toFixed(2),
      })),
      potentialAnomalies: potentialAnomalies.map((a) => ({
        supplier: a.name,
        amount: a.amount.toFixed(2),
        date: a.date,
        timesAverage: a.deviation,
      })),
    };

    console.log("Enhanced data summary prepared, calling AI...");

    // Enhanced AI prompt for detailed analysis
    const systemPrompt = `Sei un CFO virtuale senior con 20 anni di esperienza in PMI italiane.
Analizza i dati finanziari forniti e genera un report DETTAGLIATO e SPECIFICO in formato JSON.

IMPORTANTE: Fornisci analisi APPROFONDITA con cifre specifiche, percentuali precise e step operativi concreti.

Genera un oggetto JSON con queste sezioni:

1. criticalAreas: Array di 5-6 aree problematiche
   - category: nome categoria
   - amount: importo (numero)
   - percentage: percentuale sul totale (numero)
   - warning: spiegazione dettagliata del problema (max 50 parole)
   - benchmark: confronto con benchmark PMI italiane (es: "Sopra media settore del 15%")

2. savingSuggestions: Array di 6-8 suggerimenti concreti
   - title: titolo del suggerimento
   - description: descrizione dettagliata con step operativi (max 80 parole)
   - estimatedSaving: risparmio mensile stimato (numero)
   - priority: "alta" | "media" | "bassa"
   - timeline: tempo di implementazione (es: "2-4 settimane")
   - steps: array di 2-3 step specifici da seguire

3. supplierAnalysis: Array di 10-12 fornitori
   - name: nome fornitore
   - amount: spesa totale (numero)
   - category: categoria
   - status: "high" | "ok" | "low"
   - note: analisi dettagliata (max 40 parole, includi confronto con altri fornitori simili)
   - recommendation: azione specifica consigliata

4. actionItems: Array di 6-8 azioni prioritarie
   Per ogni azione:
   - action: descrizione dell'azione
   - priority: "urgente" | "alta" | "media"
   - impact: impatto atteso (es: "Risparmio €500/mese")

5. summary: oggetto con:
   - potentialSavings: risparmio mensile totale possibile (numero)
   - criticalAlerts: numero di alert critici (numero)
   - mainRisk: rischio principale identificato (max 30 parole)
   - recommendation: raccomandazione principale dettagliata (max 50 parole)

6. trendAnalysis: oggetto con:
   - monthlyTrend: array con { month (YYYY-MM), amount (numero), changePercent (numero) }
   - overallTrend: "increasing" | "stable" | "decreasing"
   - seasonalPattern: pattern stagionale identificato o null
   - forecast: previsione spesa prossimo mese (numero)
   - trendNote: spiegazione del trend (max 40 parole)

7. cashFlowHealth: oggetto con:
   - score: punteggio 1-100 (salute finanziaria complessiva)
   - ratio: rapporto entrate/uscite (numero)
   - diagnosis: diagnosi dettagliata della situazione (max 60 parole)
   - riskLevel: "low" | "medium" | "high" | "critical"
   - recommendations: array di 2-3 raccomandazioni specifiche per il cash flow

8. anomalies: Array di max 5 transazioni anomale identificate
   - description: cosa rende anomala questa transazione
   - amount: importo (numero)
   - supplier: nome fornitore
   - date: data (YYYY-MM-DD)
   - reason: perché è sospetta o fuori norma (max 30 parole)
   - recommendation: cosa fare (verificare, contestare, etc.)

REGOLE:
- Rispondi SOLO con JSON valido, senza markdown o altro testo
- Usa i dati reali forniti, non inventare cifre
- Sii specifico con nomi di fornitori e cifre esatte
- Confronta con benchmark PMI italiane quando possibile
- Identifica pattern e correlazioni tra i dati
- Prioritizza le azioni per impatto e facilità di implementazione`;

    const userPrompt = `Analizza questi dati finanziari aziendali in dettaglio:

=== RIEPILOGO PERIODO ===
Periodo analizzato: ${dataSummary.periodMonths} mesi
Spesa totale: €${dataSummary.totalSpent}
Entrate totali: €${dataSummary.totalIncome}
Cash Flow Netto: €${dataSummary.netCashFlow}
Rapporto Entrate/Uscite: ${dataSummary.cashFlowRatio}

Spesa media mensile: €${dataSummary.avgMonthlySpending}
Importo medio transazione: €${dataSummary.avgTransactionAmount}
Numero transazioni: ${dataSummary.transactionCount}

=== TREND MENSILE ===
${dataSummary.monthlyTrend.map((m) => `${m.month}: Spese €${m.spending}, Entrate €${m.income}, Variazione ${m.changePercent}%`).join("\n")}

=== TOP FORNITORI (con dettagli) ===
${dataSummary.topSuppliers.map((s) => `- ${s.name}: Totale €${s.totalAmount}, ${s.transactions} transazioni, Media €${s.avgPerTransaction}/tx, €${s.monthlyAverage}/mese, ${s.monthlyFrequency} pagamenti/mese, Categoria: ${s.category}`).join("\n")}

=== BREAKDOWN PER CATEGORIA ===
${dataSummary.categoryBreakdown.map((c) => `- ${c.name}: €${c.amount} (${c.percentage}%), ${c.transactions} tx, Media €${c.avgPerTransaction}/tx`).join("\n")}

=== TRANSAZIONI POTENZIALMENTE ANOMALE ===
${dataSummary.potentialAnomalies.length > 0 ? dataSummary.potentialAnomalies.map((a) => `- ${a.supplier}: €${a.amount} il ${a.date} (${a.timesAverage}x la media)`).join("\n") : "Nessuna anomalia significativa rilevata"}

Genera il report completo in formato JSON.`;

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
      totalIncome,
      netCashFlow: totalIncome - totalSpent,
      transactionCount: expenses.length,
      periodMonths: months,
      avgMonthlySpending: totalSpent / months,
      topCategory: categoryBreakdown[0] || null,
      categoryBreakdown: categoryBreakdown.slice(0, 10),
      topSuppliers: topSuppliers.map((s) => ({
        name: s.name,
        amount: s.totalAmount,
        transactionCount: s.transactionCount,
        category: s.categoryName || "Non categorizzato",
        monthlyAverage: s.monthlyAverage,
        avgTransactionAmount: s.avgTransactionAmount,
      })),
      monthlyTrend: monthlyTrend,
      rawAnomalies: potentialAnomalies,
      aiAnalysis: analysisResult,
    };

    console.log("Enhanced analysis complete, returning result");

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
