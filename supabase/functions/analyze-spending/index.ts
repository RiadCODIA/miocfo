import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_LIMITS = {
  small: { analyses: 3 },
  pro: { analyses: 3 },
  full: { analyses: 5 },
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !supabaseKey || !openaiApiKey) throw new Error("Missing configuration");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autenticato. Effettua il login." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessione non valida. Effettua nuovamente il login." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select(`plan_id, subscription_plans(name, ai_transaction_analyses_limit_monthly)`)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const planName = String((subscription?.subscription_plans as any)?.name || "small").toLowerCase();
    const defaultLimit = DEFAULT_LIMITS[planName as keyof typeof DEFAULT_LIMITS]?.analyses ?? DEFAULT_LIMITS.small.analyses;
    const analysesLimit = Number((subscription?.subscription_plans as any)?.ai_transaction_analyses_limit_monthly ?? defaultLimit);

    const { data: existingUsage } = await supabase
      .from("ai_usage_monthly")
      .select("id, transaction_analyses_used")
      .eq("user_id", userId)
      .eq("month_year", currentMonthYear)
      .maybeSingle();

    const transactionAnalysesUsed = Number(existingUsage?.transaction_analyses_used || 0);
    if (transactionAnalysesUsed >= analysesLimit) {
      return new Response(
        JSON.stringify({ error: `Hai raggiunto il limite mensile di ${analysesLimit} analisi AI del tuo piano.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: allTransactions, error: allTxError } = await supabase
      .from("bank_transactions")
      .select("id, description, merchant_name, amount, date, ai_category_id")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (allTxError) throw allTxError;
    if (!allTransactions || allTransactions.length === 0) {
      return new Response(JSON.stringify({ error: "Nessuna transazione trovata. Sincronizza prima i conti bancari." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: categories, error: catError } = await supabase
      .from("cost_categories")
      .select("id, name, cost_type, cashflow_type")
      .eq("is_active", true);

    if (catError) throw catError;

    const expenses = allTransactions.filter((tx) => tx.amount < 0);
    const incomes = allTransactions.filter((tx) => tx.amount > 0);
    const categoryMap = new Map<string, CostCategory>();
    categories?.forEach((cat) => categoryMap.set(cat.id, cat));

    const totalSpent = expenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    const totalIncome = incomes.reduce((sum, tx) => sum + Number(tx.amount), 0);

    const monthlyDataMap = new Map<string, MonthlyData>();
    allTransactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      const existing = monthlyDataMap.get(month) || { month, spending: 0, income: 0 };
      if (tx.amount < 0) existing.spending += Math.abs(Number(tx.amount));
      else existing.income += Number(tx.amount);
      monthlyDataMap.set(month, existing);
    });

    const monthlyData = Array.from(monthlyDataMap.values()).sort((a, b) => a.month.localeCompare(b.month));
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

    const months = monthlyData.length || 1;
    const supplierMap = new Map<string, SupplierAggregation>();
    expenses.forEach((tx: Transaction) => {
      const supplierName = (tx.merchant_name || tx.description || "Sconosciuto").toUpperCase().trim();
      const existing = supplierMap.get(supplierName);
      const catName = tx.ai_category_id ? categoryMap.get(tx.ai_category_id)?.name || null : null;
      if (existing) {
        existing.totalAmount += Math.abs(Number(tx.amount));
        existing.transactionCount += 1;
      } else {
        supplierMap.set(supplierName, {
          name: supplierName,
          totalAmount: Math.abs(Number(tx.amount)),
          transactionCount: 1,
          categoryName: catName,
        });
      }
    });

    const categoryAggMap = new Map<string, { name: string; totalAmount: number; transactionCount: number }>();
    expenses.forEach((tx: Transaction) => {
      const catId = tx.ai_category_id || "uncategorized";
      const catName = tx.ai_category_id ? categoryMap.get(tx.ai_category_id)?.name || "Altro" : "Non categorizzato";
      const existing = categoryAggMap.get(catId);
      if (existing) {
        existing.totalAmount += Math.abs(Number(tx.amount));
        existing.transactionCount += 1;
      } else {
        categoryAggMap.set(catId, {
          name: catName,
          totalAmount: Math.abs(Number(tx.amount)),
          transactionCount: 1,
        });
      }
    });

    const topSuppliers = Array.from(supplierMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15)
      .map((s) => ({
        ...s,
        monthlyAverage: Math.round((s.totalAmount / months) * 100) / 100,
        avgTransactionAmount: Math.round((s.totalAmount / s.transactionCount) * 100) / 100,
        monthlyFrequency: Math.round((s.transactionCount / months) * 10) / 10,
      }));

    const categoryBreakdown: CategoryAggregation[] = Array.from(categoryAggMap.values())
      .map((cat) => ({ ...cat, percentage: totalSpent > 0 ? (cat.totalAmount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const avgTransaction = totalSpent / Math.max(expenses.length, 1);
    const potentialAnomalies = expenses
      .filter((tx) => Math.abs(Number(tx.amount)) > avgTransaction * 5)
      .slice(0, 10)
      .map((tx) => ({
        name: tx.merchant_name || tx.description || "Sconosciuto",
        amount: Math.abs(Number(tx.amount)),
        date: tx.date,
        deviation: avgTransaction > 0 ? Math.round((Math.abs(Number(tx.amount)) / avgTransaction) * 10) / 10 : 0,
      }));

    const dataSummary = {
      totalSpent: totalSpent.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      netCashFlow: (totalIncome - totalSpent).toFixed(2),
      cashFlowRatio: totalSpent > 0 ? (totalIncome / totalSpent).toFixed(2) : "N/A",
      transactionCount: expenses.length,
      periodMonths: months,
      avgMonthlySpending: (totalSpent / months).toFixed(2),
      avgTransactionAmount: avgTransaction.toFixed(2),
      monthlyTrend: monthlyTrend.map((m) => ({ month: m.month, spending: m.spending.toFixed(2), income: m.income.toFixed(2), changePercent: m.changePercent.toFixed(1) })),
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
      potentialAnomalies: potentialAnomalies.map((a) => ({ supplier: a.name, amount: a.amount.toFixed(2), date: a.date, timesAverage: a.deviation })),
    };

    const systemPrompt = `Sei un CFO virtuale senior con 20 anni di esperienza in PMI italiane.
Analizza i dati finanziari forniti e genera un report DETTAGLIATO e SPECIFICO in formato JSON.

Genera un oggetto JSON con le sezioni: criticalAreas, savingSuggestions, supplierAnalysis, actionItems, summary, trendAnalysis, cashFlowHealth, anomalies.
Rispondi SOLO con JSON valido, senza markdown.`;

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

=== TOP FORNITORI ===
${dataSummary.topSuppliers.map((s) => `- ${s.name}: Totale €${s.totalAmount}, ${s.transactions} transazioni, Media €${s.avgPerTransaction}/tx, €${s.monthlyAverage}/mese, Categoria: ${s.category}`).join("\n")}

=== BREAKDOWN PER CATEGORIA ===
${dataSummary.categoryBreakdown.map((c) => `- ${c.name}: €${c.amount} (${c.percentage}%), ${c.transactions} tx`).join("\n")}

=== TRANSAZIONI POTENZIALMENTE ANOMALE ===
${dataSummary.potentialAnomalies.length > 0 ? dataSummary.potentialAnomalies.map((a) => `- ${a.supplier}: €${a.amount} il ${a.date} (${a.timesAverage}x la media)`).join("\n") : "Nessuna anomalia significativa rilevata"}`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);
    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) throw new Error("Empty AI response");

    const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysisResult = JSON.parse(cleanContent);

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
      monthlyTrend,
      rawAnomalies: potentialAnomalies,
      aiAnalysis: analysisResult,
    };

    const title = `Analisi spese ${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    const { data: savedDoc } = await (supabase as any)
      .from("ai_analysis_documents")
      .insert({
        user_id: userId,
        month_year: currentMonthYear,
        analysis_type: "transaction_spending",
        title,
        payload: result,
      })
      .select("id")
      .single();

    if (existingUsage?.id) {
      await supabase
        .from("ai_usage_monthly")
        .update({
          transaction_analyses_used: transactionAnalysesUsed + 1,
          is_blocked: transactionAnalysesUsed + 1 >= analysesLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("ai_usage_monthly").insert({
        user_id: userId,
        month_year: currentMonthYear,
        assistant_messages_used: 0,
        transaction_analyses_used: 1,
        is_blocked: 1 >= analysesLimit,
      });
    }

    return new Response(JSON.stringify({ ...result, savedDocumentId: savedDoc?.id || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-spending:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Errore interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
