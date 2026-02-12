

# Assistente AI - Collegamento ai dati reali del tuo account

## Obiettivo

Trasformare l'AI Assistant da un chatbot finto (risposta statica) a un vero assistente finanziario collegato all'AI (Lovable AI Gateway) che risponde **esclusivamente** basandosi sui dati reali del tuo account: transazioni bancarie, conti, fatture, scadenze, budget e KPI.

## Come funzionera

1. Quando invii un messaggio, il frontend raccoglie i tuoi dati dal database (transazioni, conti bancari, fatture, scadenze, budget)
2. Questi dati vengono inviati insieme alla tua domanda a una nuova Edge Function backend
3. L'AI riceve un prompt di sistema che le dice: "Rispondi SOLO basandoti sui dati forniti, non inventare nulla"
4. La risposta arriva in streaming (token per token) per un'esperienza fluida

## Cosa vedrai

- Risposte in tempo reale basate sui tuoi saldi, transazioni e fatture
- L'AI potra dirti cose come: "Hai 3 fatture in scadenza questa settimana per un totale di 5.200 EUR" oppure "Il tuo burn rate mensile e di 12.000 EUR"
- Se chiedi qualcosa che non riguarda i tuoi dati finanziari, l'AI rispondera che puo aiutarti solo con i dati della piattaforma
- Rendering markdown delle risposte (tabelle, elenchi, grassetto)

## Dettagli tecnici

### 1. Nuova Edge Function: `supabase/functions/ai-assistant/index.ts`

- Riceve: messaggio utente + storico conversazione + token di autenticazione
- Legge dal database (con il service role) i dati dell'utente autenticato:
  - `bank_accounts` (saldi, nome banca)
  - `bank_transactions` (ultime 100 transazioni)
  - `invoices` (fatture attive/passive)
  - `deadlines` (scadenze prossime)
  - `budgets` (budget attivi)
- Costruisce un prompt di sistema che include tutti questi dati come contesto
- Il prompt di sistema specifica: "Sei il CFO virtuale dell'utente. Rispondi SOLO basandoti sui dati forniti. Non inventare dati. Se non hai informazioni sufficienti, dillo. Rispondi sempre in italiano."
- Chiama Lovable AI Gateway con streaming abilitato
- Gestisce errori 429 (rate limit) e 402 (crediti esauriti)

### 2. Aggiornamento frontend: `src/pages/AIAssistant.tsx`

- Rimuovere la risposta simulata con `setTimeout`
- Implementare streaming SSE token-by-token verso la Edge Function
- Aggiungere rendering markdown con `react-markdown` (da installare)
- Prima di inviare il messaggio, fare le query Supabase per raccogliere i dati dell'utente
- Inviare i dati come contesto alla Edge Function
- Gestire stati di errore (rate limit, crediti esauriti) con toast
- Mantenere la cronologia conversazione in memoria per contesto multi-turno

### 3. Aggiornamento `supabase/config.toml`

- Aggiungere la nuova funzione `ai-assistant` con `verify_jwt = true`

### 4. Dipendenza: `react-markdown`

- Installare per renderizzare le risposte AI formattate (tabelle, elenchi, grassetto)
