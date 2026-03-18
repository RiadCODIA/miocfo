
Obiettivo: aggiungere un piccolo contatore residuo per ogni invio nell’AI Assistant e, nella sezione Analisi AI Spese, un pulsante “Analisi salvate” nello stesso modal con archivio delle analisi e relativo contatore residuo mensile.

Cosa ho verificato
- `useAIUsage.ts` espone già i dati giusti per entrambi i casi:
  - `assistantMessagesUsed / Limit / Remaining`
  - `transactionAnalysesUsed / Limit / Remaining`
- `AIAssistant.tsx` mostra già un riepilogo in alto, ma non un contatore piccolo vicino all’input come da tua richiesta.
- `analyze-spending` salva già ogni analisi in `ai_analysis_documents`.
- `useSpendingAnalysis.ts` invalida già la query `["ai-analysis-documents"]`, quindi è pronto per un archivio live.
- `SpendingReportModal.tsx` oggi non legge i documenti salvati e non mostra il residuo analisi.
- La tabella `ai_analysis_documents` ha già RLS corretta: ogni utente vede solo i propri documenti.

Scelte confermate
- Il “countdown” deve mostrare crediti/usi residui, non il tempo.
- “Analisi salvate” deve stare nello stesso modal.

Implementazione proposta

1. AI Assistant: contatore piccolo sopra l’input
- In `src/pages/AIAssistant.tsx` aggiungerò una micro-barra sopra il campo messaggio con testo tipo:
  - `Messaggi rimasti questo mese: 38 / 50`
- Il numero si aggiornerà automaticamente dopo ogni messaggio grazie a `invalidateQueries(["ai-usage"])` già presente.
- A inizio mese si resetta automaticamente perché la logica usa già `monthYear = format(new Date(), "yyyy-MM")`.

2. Analisi AI Spese: contatore residuo + pulsante “Analisi salvate”
- In `src/components/transazioni/SpendingReportModal.tsx` aggiungerò una header bar con:
  - contatore piccolo: `Analisi rimaste questo mese: 2 / 3`
  - pulsante `Analisi salvate`
- Il pulsante aprirà una vista archivio nello stesso modal, non una finestra separata.

3. Archivio analisi nello stesso modal
- Userò tabs o una semplice modalità toggle nello stesso `SpendingReportModal`:
  - `Nuova analisi`
  - `Analisi salvate`
- In “Analisi salvate” mostrerò elenco documenti da `ai_analysis_documents` filtrati per utente e tipo `transaction_spending`, ordinati per data desc.
- Ogni elemento mostrerà almeno:
  - titolo
  - data/ora
  - pulsante `Apri`
- Clic su `Apri` ricaricherà il `payload` salvato nel modal per consultarlo come report completo.

4. Hook per leggere le analisi salvate
- Aggiungerò un piccolo hook dedicato, ad esempio `useSavedSpendingAnalyses`, oppure una query locale dentro `SpendingReportModal`.
- Query prevista:
  - tabella `ai_analysis_documents`
  - filtro `analysis_type = "transaction_spending"`
  - ordinamento `created_at desc`
- Non serve nuova migration: tabella e policy esistono già.

5. Comportamento UX
- Se non hai ancora analisi salvate:
  - messaggio vuoto chiaro tipo “Non hai ancora analisi salvate”.
- Se una nuova analisi viene generata:
  - il contatore analisi residuo si aggiorna
  - la tab “Analisi salvate” mostra subito il nuovo documento
- Se finisci le analisi mensili:
  - il pulsante per avviare una nuova analisi verrà disabilitato
  - archivio salvato resterà comunque consultabile

File da toccare
- `src/pages/AIAssistant.tsx`
- `src/components/transazioni/SpendingReportModal.tsx`
- probabilmente nuovo hook tipo:
  - `src/hooks/useSavedSpendingAnalyses.ts`
oppure query interna al modal
- possibile riuso di:
  - `src/hooks/useAIUsage.ts`

Dettaglio tecnico
- Nessuna modifica database necessaria.
- Nessuna modifica RLS necessaria.
- I reset mensili restano basati sul mese corrente già gestito dal sistema.
- Per aprire un report salvato userò `payload` già salvato nel DB, evitando nuove chiamate AI.

Risultato atteso
- In chat AI vedrai sempre un piccolo contatore residuo sopra l’input.
- In Analisi AI Spese vedrai un contatore residuo e il pulsante “Analisi salvate”.
- Ogni analisi eseguita finirà nell’archivio consultabile nello stesso modal.
