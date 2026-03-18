import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value)) return Object.values(value) as T[];
  return [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9,.-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function normalizePriority(value: unknown): "urgente" | "alta" | "media" {
  const normalized = asString(value, "media").toLowerCase();
  if (["urgent", "urgente", "critical", "critico"].includes(normalized)) return "urgente";
  if (["high", "alta", "alto"].includes(normalized)) return "alta";
  return "media";
}

function normalizeSupplierStatus(value: unknown, amount = 0): "high" | "ok" | "low" {
  const normalized = asString(value).toLowerCase();
  if (["high", "alto", "critical", "critico"].includes(normalized)) return "high";
  if (["low", "basso", "good", "buono"].includes(normalized)) return "low";
  if (["ok", "medium", "medio", "stable", "stabile"].includes(normalized)) return "ok";
  if (amount > 5000) return "high";
  if (amount > 0) return "ok";
  return "low";
}

function normalizeOverallTrend(value: unknown): "increasing" | "stable" | "decreasing" {
  const normalized = asString(value, "stable").toLowerCase();
  if (["increasing", "increase", "up", "crescente", "in aumento"].includes(normalized)) return "increasing";
  if (["decreasing", "decrease", "down", "decrescente", "in calo"].includes(normalized)) return "decreasing";
  return "stable";
}

function normalizeRiskLevel(value: unknown): "low" | "medium" | "high" | "critical" {
  const normalized = asString(value, "medium").toLowerCase();
  if (["low", "basso"].includes(normalized)) return "low";
  if (["high", "alto"].includes(normalized)) return "high";
  if (["critical", "critico"].includes(normalized)) return "critical";
  return "medium";
}

function normalizeAiAnalysis(raw: unknown) {
  const source = isRecord(raw) ? raw : {};

  const criticalAreas = asArray(source.criticalAreas).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      category: asString(record.category ?? record.name ?? record.area, "Area non specificata"),
      amount: asNumber(record.amount ?? record.totalAmount ?? record.value, 0),
      percentage: asNumber(record.percentage ?? record.share ?? record.incidence, 0),
      warning: asString(record.warning ?? record.description ?? record.note, "Richiede attenzione"),
      benchmark: asString(record.benchmark ?? record.reference, "") || undefined,
    };
  }).filter((item) => item.category || item.warning);

  const savingSuggestions = asArray(source.savingSuggestions).map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      title: asString(record.title ?? record.name, `Suggerimento ${index + 1}`),
      description: asString(record.description ?? record.note ?? record.rationale, "Nessun dettaglio disponibile"),
      estimatedSaving: asNumber(record.estimatedSaving ?? record.saving ?? record.amount, 0),
      priority: ["alta", "media", "bassa"].includes(asString(record.priority).toLowerCase())
        ? asString(record.priority).toLowerCase()
        : undefined,
      timeline: asString(record.timeline ?? record.when, "") || undefined,
      steps: asStringArray(record.steps ?? record.actions),
    };
  }).filter((item) => item.title || item.description);

  const supplierAnalysis = asArray(source.supplierAnalysis).map((item) => {
    const record = isRecord(item) ? item : {};
    const amount = asNumber(record.amount ?? record.totalAmount ?? record.spending, 0);
    return {
      name: asString(record.name ?? record.supplier ?? record.vendor, "Fornitore non specificato"),
      amount,
      category: asString(record.category ?? record.segment, "Non categorizzato"),
      status: normalizeSupplierStatus(record.status ?? record.riskLevel, amount),
      note: asString(record.note ?? record.description ?? record.reason, "") || undefined,
      recommendation: asString(record.recommendation ?? record.action ?? record.suggestedAction, "") || undefined,
    };
  }).filter((item) => item.name);

  const actionItems = asArray(source.actionItems).map((item) => {
    if (typeof item === "string") {
      return {
        action: item,
        priority: "media" as const,
        impact: "Da valutare",
      };
    }

    const record = isRecord(item) ? item : {};
    return {
      action: asString(record.action ?? record.description ?? record.title, "Azione consigliata"),
      priority: normalizePriority(record.priority),
      impact: asString(record.impact ?? record.expectedImpact ?? record.outcome, "Da valutare"),
    };
  }).filter((item) => item.action);

  const summarySource = isRecord(source.summary) ? source.summary : {};
  const potentialSavings = asNumber(
    summarySource.potentialSavings ?? source.potentialSavings,
    savingSuggestions.reduce((total, item) => total + item.estimatedSaving, 0),
  );

  const trendSource = isRecord(source.trendAnalysis) ? source.trendAnalysis : {};
  const trendMonthly = asArray(trendSource.monthlyTrend).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      month: asString(record.month, ""),
      amount: asNumber(record.amount ?? record.spending ?? record.value, 0),
      changePercent: asNumber(record.changePercent ?? record.change ?? record.variation, 0),
    };
  }).filter((item) => item.month);

  const cashFlowSource = isRecord(source.cashFlowHealth) ? source.cashFlowHealth : {};
  const anomalies = asArray(source.anomalies).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      description: asString(record.description ?? record.reason ?? record.note, "Anomalia rilevata"),
      amount: asNumber(record.amount ?? record.value, 0),
      supplier: asString(record.supplier ?? record.name ?? record.vendor, "Voce non identificata"),
      date: asString(record.date, "") || undefined,
      reason: asString(record.reason ?? record.description, "Scostamento rispetto al comportamento atteso"),
      recommendation: asString(record.recommendation ?? record.action, "Verifica la transazione e conferma la classificazione"),
    };
  }).filter((item) => item.supplier || item.reason);

  return {
    criticalAreas,
    savingSuggestions,
    supplierAnalysis,
    actionItems,
    summary: {
      potentialSavings,
      criticalAlerts: asNumber(summarySource.criticalAlerts ?? source.criticalAlerts, criticalAreas.length + anomalies.length),
      mainRisk: asString(summarySource.mainRisk ?? summarySource.risk ?? source.mainRisk, "Monitorare le aree a maggiore assorbimento di cassa"),
      recommendation: asString(
        summarySource.recommendation ?? source.recommendation,
        savingSuggestions[0]?.description || actionItems[0]?.action || "Analizza i costi principali e intervieni sulle anomalie più rilevanti",
      ),
    },
    trendAnalysis: {
      monthlyTrend: trendMonthly,
      overallTrend: normalizeOverallTrend(trendSource.overallTrend ?? trendSource.direction),
      seasonalPattern: asString(trendSource.seasonalPattern ?? trendSource.pattern, "") || null,
      forecast: asNumber(trendSource.forecast ?? trendSource.nextMonthForecast, 0),
      trendNote: asString(trendSource.trendNote ?? trendSource.note, "") || undefined,
    },
    cashFlowHealth: {
      score: asNumber(cashFlowSource.score, 0),
      ratio: asNumber(cashFlowSource.ratio ?? cashFlowSource.cashFlowRatio, 0),
      diagnosis: asString(cashFlowSource.diagnosis ?? cashFlowSource.summary, "Salute finanziaria da monitorare"),
      riskLevel: normalizeRiskLevel(cashFlowSource.riskLevel),
      recommendations: asStringArray(cashFlowSource.recommendations ?? cashFlowSource.actions),
    },
    anomalies,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const planName = String((subscription?.subscription_plans as { name?: string } | null)?.name || "small").toLowerCase();
    const defaultLimit = DEFAULT_LIMITS[planName as keyof typeof DEFAULT_LIMITS]?.analyses ?? DEFAULT_LIMITS.small.analyses;
    const analysesLimit = Number((subscription?.subscription_plans as { ai_transaction_analyses_limit_monthly?: number } | null)?.ai_transaction_analyses_limit_monthly ?? defaultLimit);

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
Analizza i dati finanziari forniti e restituisci SOLO un oggetto JSON valido.

Schema richiesto:
{
  "criticalAreas": [{ "category": string, "amount": number, "percentage": number, "warning": string, "benchmark": string }],
  "savingSuggestions": [{ "title": string, "description": string, "estimatedSaving": number, "priority": "alta" | "media" | "bassa", "timeline": string, "steps": string[] }],
  "supplierAnalysis": [{ "name": string, "amount": number, "category": string, "status": "high" | "ok" | "low", "note": string, "recommendation": string }],
  "actionItems": [{ "action": string, "priority": "urgente" | "alta" | "media", "impact": string }],
  "summary": { "potentialSavings": number, "criticalAlerts": number, "mainRisk": string, "recommendation": string },
  "trendAnalysis": { "monthlyTrend": [{ "month": string, "amount": number, "changePercent": number }], "overallTrend": "increasing" | "stable" | "decreasing", "seasonalPattern": string | null, "forecast": number, "trendNote": string },
  "cashFlowHealth": { "score": number, "ratio": number, "diagnosis": string, "riskLevel": "low" | "medium" | "high" | "critical", "recommendations": string[] },
  "anomalies": [{ "description": string, "amount": number, "supplier": string, "date": string, "reason": string, "recommendation": string }]
}

Regole:
- Tutte le sezioni devono esistere.
- Usa array vuoti se una sezione non ha dati.
- Non usare markdown.
- Non restituire testo fuori dal JSON.`;

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
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);
    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) throw new Error("Empty AI response");

    const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const normalizedAiAnalysis = normalizeAiAnalysis(JSON.parse(cleanContent));

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
      aiAnalysis: normalizedAiAnalysis,
    };

    const title = `Analisi spese ${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    const { data: savedDoc } = await (supabase as unknown as { from: (table: string) => { insert: (value: unknown) => { select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> } } } })
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
