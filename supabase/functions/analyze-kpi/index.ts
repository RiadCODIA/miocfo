import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kpis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const kpiSummary = kpis.map((k: any) => `${k.nome}: ${k.valore} (target: ${k.target}, ${k.raggiunto ? "raggiunto" : "non raggiunto"}, trend: ${k.trend})`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Sei un CFO virtuale esperto. Analizza i KPI finanziari forniti e genera un report in italiano. Rispondi SOLO con JSON valido (senza markdown) con questa struttura:
{
  "healthScore": number (0-100),
  "healthLabel": string ("Ottimo"|"Buono"|"Sufficiente"|"Critico"),
  "summary": string (2-3 frasi di analisi),
  "marginTrend": string ("positivo"|"negativo"|"stabile"),
  "criticalAreas": [{"area": string, "description": string, "severity": "alta"|"media"|"bassa"}],
  "suggestions": [{"title": string, "description": string, "priority": "alta"|"media"|"bassa", "timeline": string}],
  "forecasts": string (previsione 1-2 frasi)
}`
          },
          {
            role: "user",
            content: `Ecco i KPI attuali della mia azienda:\n\n${kpiSummary}\n\nAnalizza questi dati e genera il report.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi richieste, riprova tra poco." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the AI response, stripping markdown code fences if present
    let cleaned = content?.trim() || "{}";
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    const report = JSON.parse(cleaned);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-kpi error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
