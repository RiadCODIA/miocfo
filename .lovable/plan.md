
# Cassetto Fiscale (A-Cube) — Fix per funzionamento in Sandbox

## Problemi identificati

### 1. URL sandbox Gov IT errato — causa root del fallimento DNS

Il codice attuale usa due URL distinti basati su `ACUBE_ENV`:
- Production: `https://gov-it.api.acubeapi.com`
- Sandbox: `https://gov-it-sandbox.api.acubeapi.com` ← questo dominio **non esiste**

Il test diretto dell'edge function lo conferma con l'errore: `dns error: failed to lookup address information: Name or service not known`.

A differenza dell'Open Banking di A-Cube (che ha `ob-sandbox.api.acubeapi.com`), il servizio **Gov IT (Cassetto Fiscale) non ha un URL sandbox separato** — usa sempre `gov-it.api.acubeapi.com` sia in sandbox che in produzione. La distinzione sandbox/produzione avviene a livello di account/credenziali A-Cube, non di URL.

**Fix**: rimuovere la logica biforcata per Gov IT e usare sempre `https://gov-it.api.acubeapi.com`.

### 2. invoice_type sbagliato nel parser

La funzione `parseAcubeInvoice` in `acube-cassetto-fiscale/index.ts` usa:
```typescript
const invoiceType = (inv.direction === "outbound" || inv.type === "active") ? "revenue" : "expense";
```

I valori `"revenue"` e `"expense"` sono vecchi tipi legacy. Dopo la migrazione del piano precedente, il sistema usa `"emessa"` e `"ricevuta"`. Questo significa che anche se le fatture venissero importate, non apparirebbero nel Conto Economico.

**Fix**: aggiornare i valori a `"emessa"` e `"ricevuta"`.

### 3. Stato "connesso" basato solo sulla presenza di fatture

Nella pagina `Collegamenti.tsx`, il badge "Connesso/Non connesso" si determina da `cassettoInvoices.length > 0`. Questo significa che anche dopo aver configurato correttamente le credenziali, la UI mostra "Non connesso" finché non sono state importate fatture. L'utente non capisce se la configurazione ha avuto successo.

**Fix**: aggiungere una query che verifica se esiste una configurazione attiva nel DB (salvarla in una tabella o in `localStorage` dopo un `setup` riuscito), oppure mostrare un messaggio informativo più chiaro.

### 4. Nessun feedback durante il download

Dopo il setup, l'utente deve manualmente avviare il download delle fatture — ma la UI non offre un pulsante "Scarica ora" ben visibile una volta connesso. Il modal si chiude e l'utente non sa come procedere.

**Fix**: dopo un `setup` riuscito, mostrare nel modal un secondo step con il pulsante "Scarica fatture ora" che chiama `action: "download-now"`.

---

## Soluzione in 3 parti

### A. Fix URL Gov IT nell'edge function

Modificare `supabase/functions/acube-cassetto-fiscale/index.ts`:

```typescript
// PRIMA (errato - il dominio sandbox non esiste)
const ACUBE_GOV_IT_URL = ACUBE_ENV === "production"
  ? "https://gov-it.api.acubeapi.com"
  : "https://gov-it-sandbox.api.acubeapi.com";  // ← DNS fallisce

// DOPO (corretto - Gov IT usa sempre lo stesso URL)
const ACUBE_GOV_IT_URL = "https://gov-it.api.acubeapi.com";
```

### B. Fix invoice_type nel parser

```typescript
// PRIMA
const invoiceType = (inv.direction === "outbound" || inv.type === "active") ? "revenue" : "expense";

// DOPO
const invoiceType = (inv.direction === "outbound" || inv.type === "active") ? "emessa" : "ricevuta";
```

### C. Miglioramento UX del modal — aggiungere step "Scarica Ora"

Modificare `CassettoFiscaleModal.tsx` per avere due step:
- **Step 1** (form credenziali): inserisci Codice Fiscale, Password, PIN → chiama `setup`
- **Step 2** (post-connessione): mostra "Connesso con successo!" e un pulsante "Scarica fatture ora" → chiama `download-now` + poi `fetch-invoices`

Aggiungere anche un feedback sullo stato della configurazione in `Collegamenti.tsx` basato su `localStorage` (come già fatto per altri stati nell'app), così il badge "Connesso" appare subito dopo il setup anche prima dell'import delle fatture.

---

## File modificati

1. **`supabase/functions/acube-cassetto-fiscale/index.ts`**
   - Rimuovere l'URL sandbox errato per Gov IT
   - Correggere `invoice_type` da `"revenue"/"expense"` a `"emessa"/"ricevuta"`
   - Migliorare il logging per debug

2. **`src/components/fatture/CassettoFiscaleModal.tsx`**
   - Aggiungere step 2 post-setup con pulsante "Scarica fatture ora"
   - Aggiungere chiamata a `download-now` e poi a `fetch-invoices`
   - Salvare in `localStorage` il `fiscal_id` configurato per mostrare lo stato correttamente

3. **`src/pages/Collegamenti.tsx`**
   - Leggere da `localStorage` il `fiscal_id` configurato per mostrare il badge "Connesso" anche prima dell'import
   - Aggiungere bottone "Scarica ora" direttamente nella card Cassetto Fiscale se configurato

---

## Comportamento finale atteso

1. L'utente apre il modal "Collega Cassetto Fiscale"
2. Inserisce il suo Codice Fiscale (o P.IVA), Password e PIN Fisconline
3. Clicca "Collega" → l'edge function chiama correttamente `gov-it.api.acubeapi.com` (URL che ora funziona)
4. Se le credenziali sono valide → appare Step 2 con "Connesso!" e pulsante "Scarica fatture"
5. Cliccando "Scarica fatture" → viene avviato il job di download + fetch, le fatture importate appaiono nella tabella con `invoice_type = "ricevuta"` o `"emessa"`
6. Il badge nella card diventa "Connesso" anche senza ricaricare

Note: il funzionamento reale dipende anche dalle credenziali A-Cube (`ACUBE_EMAIL`/`ACUBE_PASSWORD`) configurate — in sandbox, A-Cube autentica con account di test. Se l'account A-Cube non ha accesso al servizio Gov IT, l'API restituirà un 403, ma il DNS e la connessione funzioneranno correttamente.
