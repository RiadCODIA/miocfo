import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CostCategory {
  id: string;
  name: string;
  cost_type: string;
  cashflow_type: string;
}

interface Transaction {
  id: string;
  name: string;
  merchant_name?: string;
  amount: number;
  category?: string[];
}

interface CategorizationResult {
  transaction_id: string;
  category_id: string;
  category_name: string;
  confidence: number;
  reasoning: string;
}

// Batch size for AI processing (avoid timeout)
const BATCH_SIZE = 50;
// Max transactions per single function call (safety limit)
const MAX_PER_CALL = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction_ids, batch_mode = false } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch available categories
    const { data: categories, error: catError } = await supabase
      .from("cost_categories")
      .select("id, name, cost_type, cashflow_type")
      .eq("is_active", true);

    if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);
    if (!categories || categories.length === 0) {
      throw new Error("No active cost categories found. Please create categories first.");
    }

    // Also fetch existing categorization rules for pattern matching
    const { data: rules } = await supabase
      .from("categorization_rules")
      .select("pattern, category_id, match_type, priority")
      .order("priority", { ascending: false });

    // If specific transaction IDs provided, process just those
    if (transaction_ids && transaction_ids.length > 0) {
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("id, name, merchant_name, amount, category")
        .in("id", transaction_ids);

      if (txError) throw new Error(`Failed to fetch transactions: ${txError.message}`);
      if (!transactions || transactions.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No transactions to categorize", results: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = await processBatch(transactions, categories, rules || [], LOVABLE_API_KEY, supabase);
      return new Response(
        JSON.stringify({ success: true, message: `Categorized ${results.length} transactions`, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch mode: loop through ALL uncategorized transactions
    if (batch_mode) {
      let totalProcessed = 0;
      const allResults: CategorizationResult[] = [];

      while (totalProcessed < MAX_PER_CALL) {
        // Fetch next batch of uncategorized transactions
        const { data: transactions, error: txError } = await supabase
          .from("bank_transactions")
          .select("id, name, merchant_name, amount, category")
          .is("ai_category_id", null)
          .limit(BATCH_SIZE);

        if (txError) {
          console.error("Failed to fetch transactions batch:", txError);
          break;
        }

        if (!transactions || transactions.length === 0) {
          console.log(`[Categorize] No more uncategorized transactions. Total processed: ${totalProcessed}`);
          break;
        }

        console.log(`[Categorize] Processing batch of ${transactions.length} transactions (total so far: ${totalProcessed})`);

        try {
          const batchResults = await processBatch(transactions, categories, rules || [], LOVABLE_API_KEY, supabase);
          allResults.push(...batchResults);
          totalProcessed += transactions.length;
        } catch (batchError) {
          console.error("[Categorize] Batch processing error:", batchError);
          // Continue with next batch even if one fails
        }

        // Small delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`[Categorize] Completed. Total categorized: ${allResults.length}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Categorized ${allResults.length} transactions`,
          results: allResults,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Either transaction_ids or batch_mode must be provided");
  } catch (error) {
    console.error("Categorization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Process a batch of transactions (rule matching + AI)
async function processBatch(
  transactions: Transaction[],
  categories: CostCategory[],
  rules: Array<{ pattern: string; category_id: string; match_type: string; priority: number }>,
  apiKey: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<CategorizationResult[]> {
  const results: CategorizationResult[] = [];
  const needsAI: Transaction[] = [];

  // First, try to match using existing rules
  for (const tx of transactions) {
    const txText = `${tx.name || ""} ${tx.merchant_name || ""}`.toLowerCase();
    let matched = false;

    if (rules.length > 0) {
      for (const rule of rules) {
        let isMatch = false;
        const pattern = rule.pattern.toLowerCase();

        switch (rule.match_type) {
          case "exact":
            isMatch = txText === pattern;
            break;
          case "starts_with":
            isMatch = txText.startsWith(pattern);
            break;
          case "contains":
          default:
            isMatch = txText.includes(pattern);
            break;
        }

        if (isMatch) {
          const category = categories.find((c: CostCategory) => c.id === rule.category_id);
          if (category) {
            results.push({
              transaction_id: tx.id,
              category_id: rule.category_id,
              category_name: category.name,
              confidence: 95,
              reasoning: `Matched rule: "${rule.pattern}"`,
            });
            matched = true;
            break;
          }
        }
      }
    }

    if (!matched) {
      needsAI.push(tx);
    }
  }

  // For transactions that need AI, call Lovable AI
  if (needsAI.length > 0) {
    const categoryList = categories
      .map((c: CostCategory) => `- ${c.name} (ID: ${c.id}, Tipo: ${c.cost_type}, Flusso: ${c.cashflow_type})`)
      .join("\n");

    const transactionsList = needsAI
      .map((tx) => `- ID: ${tx.id}, Nome: "${tx.name}", Merchant: "${tx.merchant_name || "N/A"}", Importo: €${tx.amount}`)
      .join("\n");

    const systemPrompt = `Sei un assistente finanziario esperto nella categorizzazione di transazioni bancarie italiane.
Analizza ogni transazione e suggerisci la categoria più appropriata tra quelle disponibili.

CATEGORIE DISPONIBILI:
${categoryList}

ISTRUZIONI:
- Analizza il nome della transazione e il merchant
- Considera il tipo di transazione (entrata/uscita) basandoti sull'importo
- Assegna un punteggio di confidenza da 0 a 100
- Fornisci una breve motivazione

Usa lo strumento categorize_transactions per restituire i risultati.`;

    const userPrompt = `Categorizza le seguenti transazioni:

${transactionsList}`;

    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "categorize_transactions",
                description: "Categorizza le transazioni bancarie",
                parameters: {
                  type: "object",
                  properties: {
                    categorizations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          transaction_id: { type: "string" },
                          category_id: { type: "string" },
                          category_name: { type: "string" },
                          confidence: { type: "number", minimum: 0, maximum: 100 },
                          reasoning: { type: "string" },
                        },
                        required: ["transaction_id", "category_id", "category_name", "confidence", "reasoning"],
                      },
                    },
                  },
                  required: ["categorizations"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "categorize_transactions" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall && toolCall.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            if (parsed.categorizations && Array.isArray(parsed.categorizations)) {
              results.push(...parsed.categorizations);
            }
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
          }
        }
      } else {
        console.error("AI gateway error:", aiResponse.status);
      }
    } catch (aiError) {
      console.error("AI call failed:", aiError);
    }
  }

  // Update transactions with AI categorization
  const updatePromises = results.map(async (result) => {
    const { error: updateError } = await supabase
      .from("bank_transactions")
      .update({
        ai_category_id: result.category_id,
        ai_confidence: result.confidence,
        category_confirmed: false,
      })
      .eq("id", result.transaction_id);

    if (updateError) {
      console.error(`Failed to update transaction ${result.transaction_id}:`, updateError);
    }
    return result;
  });

  await Promise.all(updatePromises);

  return results;
}