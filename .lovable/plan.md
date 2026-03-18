
Problema individuato: il backend `analyze-spending` non sembra essere fermo. Dai log Supabase risulta una chiamata `POST | 200` recente e nel database ci sono analisi salvate correttamente in `ai_analysis_documents`. Quindi il guasto più probabile è nel frontend del modal Transazioni.

Cosa ho verificato
- `src/hooks/useSpendingAnalysis.ts` invoca correttamente `supabase.functions.invoke("analyze-spending")`.
- `supabase/functions/analyze-spending/index.ts` risponde e salva documenti.
- `src/components/transazioni/SpendingReportModal.tsx` mostra il report ma:
  - tratta qualsiasi errore come “Nessuna transazione disponibile”, anche se l’errore reale è diverso;
  - assume una forma molto specifica di `aiAnalysis`, mentre il payload realmente salvato nel DB oggi può avere una struttura diversa.
- Il payload salvato più recente contiene differenze importanti:
  - `actionItems` contiene oggetti con `description`, `dueDate`, `responsible`, non `{ action, priority, impact }`
  - `criticalAreas` è un oggetto annidato, non un array
  - `supplierAnalysis` è un oggetto, non un array
  - `summary` ha campi diversi da quelli attesi dal componente

Perché quindi “non funziona più”
- L’edge function continua a generare output, ma il frontend del modal è fragile rispetto al JSON AI.
- Se OpenAI restituisce un formato leggermente diverso, il modal può:
  - non mostrare parti del report,
  - leggere dati sbagliati,
  - o andare in stato incoerente.
- Inoltre, se c’è un errore reale, il modal oggi lo traduce in modo fuorviante come problema di transazioni mancanti.

Piano di correzione
1. Rendere robusta la lettura del risultato AI nel modal
- Aggiungere normalizzazione lato frontend prima del render in `SpendingReportModal.tsx`.
- Convertire formati alternativi in una struttura stabile:
  - `criticalAreas`: supportare sia array sia oggetto
  - `supplierAnalysis`: supportare sia array sia oggetto
  - `actionItems`: supportare sia stringhe, sia `{ action... }`, sia `{ description... }`
  - `summary`: usare fallback sicuri quando mancano `potentialSavings`, `mainRisk`, `recommendation`

2. Correggere i messaggi di errore nel modal
- Distinguere almeno questi casi:
  - nessuna transazione
  - limite mensile raggiunto
  - errore AI / parsing JSON
  - errore generico
- Mostrare il messaggio reale restituito dalla edge function invece del testo fisso “Sincronizza prima i conti bancari”.

3. Mettere in sicurezza il rendering
- Usare guardie e fallback ovunque il componente oggi presume array o campi obbligatori.
- Evitare `.map()` e accessi profondi su strutture non validate.
- Se alcune sezioni non sono presenti, mostrare solo quelle disponibili invece di rompere il report.

4. Stabilizzare il contratto dell’edge function
- Aggiornare `supabase/functions/analyze-spending/index.ts` per chiedere a OpenAI un JSON più rigido e coerente con il frontend.
- Dopo il parsing, normalizzare anche lato backend il risultato AI prima di salvarlo e restituirlo.
- In questo modo:
  - i nuovi report saranno consistenti,
  - i vecchi report resteranno comunque apribili grazie alla normalizzazione frontend.

5. Verifica mirata
- Controllare il flusso:
  - apertura modal,
  - avvio analisi,
  - visualizzazione del nuovo report,
  - apertura “Analisi salvate”,
  - apertura di un report storico con payload vecchio.
- Verificare anche il caso limite mensile raggiunto.

File da aggiornare
- `src/components/transazioni/SpendingReportModal.tsx`
- `src/hooks/useSpendingAnalysis.ts`
- `supabase/functions/analyze-spending/index.ts`

Dettaglio tecnico
```text
Root cause più probabile
Frontend strict schema
        +
AI output variabile
        =
report Transazioni apparentemente “rotto”

Fix
1) normalize payload in frontend
2) improve error handling
3) normalize payload in edge function
4) keep backward compatibility with saved analyses
```

Risultato atteso
- Le Analisi AI Spese torneranno a funzionare nel modal Transazioni.
- I report nuovi e quelli salvati saranno leggibili anche se il JSON AI cambia leggermente.
- Gli errori mostrati saranno corretti e comprensibili.
