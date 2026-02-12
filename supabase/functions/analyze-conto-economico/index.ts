import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPrompt(type: string, data: any, year?: number): string {
  if (type === "scadenzario") {
    return `Sei un CFO virtuale esperto in PMI italiane. Analizza i seguenti dati dello scadenzario clienti/fornitori e fornisci un report strutturato.

DATI SCADENZARIO:
${JSON.stringify(data, null, 2)}

Rispondi SOLO con un JSON valido (senza markdown) con questa struttura:
{
  "healthScore": <numero 1-100 che indica il rischio liquidità, 100=nessun rischio>,
  "healthLabel": "<Critico|Insufficiente|Sufficiente|Buono|Ottimo>",
  "summary": "<sintesi in 2-3 frasi della situazione scadenze>",
  "marginTrend": "<positivo|stabile|negativo>",
  "criticalAreas": [
    { "area": "<nome area critica>", "description": "<descrizione problema>", "severity": "<alta|media|bassa>" }
  ],
  "suggestions": [
    { "title": "<azione prioritaria>", "description": "<descrizione dettagliata dell'azione>", "priority": "<alta|media|bassa>", "timeline": "<immediato|breve termine|medio termine>" }
  ],
  "forecasts": "<previsione flusso di cassa basata sulle scadenze in 2-3 frasi>"
}`;
  }

  if (type === "previsioni") {
    return `Sei un CFO virtuale esperto in PMI italiane. Analizza i seguenti dati di budget e confronto consuntivo vs previsionale e fornisci un report strutturato.

DATI BUDGET E PREVISIONI:
${JSON.stringify(data, null, 2)}

Rispondi SOLO con un JSON valido (senza markdown) con questa struttura:
{
  "healthScore": <numero 1-100 che indica l'attendibilità delle previsioni, 100=perfettamente attendibili>,
  "healthLabel": "<Critico|Insufficiente|Sufficiente|Buono|Ottimo>",
  "summary": "<sintesi in 2-3 frasi dell'attendibilità previsionale>",
  "marginTrend": "<positivo|stabile|negativo>",
  "criticalAreas": [
    { "area": "<area con scostamento significativo>", "description": "<descrizione dello scostamento>", "severity": "<alta|media|bassa>" }
  ],
  "suggestions": [
    { "title": "<suggerimento budget>", "description": "<come migliorare la pianificazione>", "priority": "<alta|media|bassa>", "timeline": "<breve termine|medio termine|lungo termine>" }
  ],
  "forecasts": "<forecast aggiornato basato sui trend attuali in 2-3 frasi>"
}`;
  }

  // Default: conto-economico
  return `Sei un CFO virtuale esperto in PMI italiane. Analizza i seguenti dati del Conto Economico per l'anno ${year} e fornisci un report strutturato.

DATI AGGREGATI:
${JSON.stringify(data, null, 2)}

Rispondi SOLO con un JSON valido (senza markdown) con questa struttura:
{
  "healthScore": <numero 1-100>,
  "healthLabel": "<Critico|Insufficiente|Sufficiente|Buono|Ottimo>",
  "summary": "<sintesi in 2-3 frasi della situazione economica>",
  "marginTrend": "<positivo|stabile|negativo>",
  "criticalAreas": [
    { "area": "<nome area>", "description": "<descrizione problema>", "severity": "<alta|media|bassa>" }
  ],
  "suggestions": [
    { "title": "<titolo>", "description": "<descrizione dettagliata>", "priority": "<alta|media|bassa>", "timeline": "<breve termine|medio termine|lungo termine>" }
  ],
  "forecasts": "<previsione per i prossimi mesi in 2-3 frasi>"
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { year, data, type = "conto-economico" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = buildPrompt(type, data, year);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Sei un CFO virtuale specializzato in analisi finanziaria per PMI italiane. Rispondi sempre in italiano e in formato JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppe richieste. Riprova tra qualche minuto." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti. Ricarica il tuo workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore nel servizio AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Errore nel parsing della risposta AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-conto-economico error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
