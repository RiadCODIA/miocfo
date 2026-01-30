
## Cosa sta succedendo (in parole semplici)
Il redirect ora funziona, quindi il collegamento “tecnico” è ok.  
Però quando provi a sincronizzare, Enable Banking risponde con un errore della banca (**ASPSP_ERROR**), quindi non riesce a leggere saldi/movimenti → saldo resta **0** e la sincronizzazione fallisce.

In più, l’errore che vedi in app è troppo generico (“Errore nella chiamata Enable Banking”) perché il frontend non riesce sempre a “estrarre” il messaggio reale dal body della risposta. E la card può restare in stato “In sincronizzazione” anche se nel DB è già diventata “error”, perché dopo il fallimento non stiamo ricaricando i conti.

---

## Obiettivo
1) Mostrare un messaggio d’errore **chiaro e utile** (es. “Errore banca ASPSP_ERROR: …”) invece di quello generico.  
2) Aggiornare la UI **subito dopo l’errore** (badge e bottoni coerenti con lo stato reale).  
3) Evitare che i bottoni rimangano “bloccati” se la sync fallisce.  
4) (Opzionale ma consigliato) Permettere “Riprova sincronizzazione” anche se lo stato è `error`, oltre a “Ricollega”.

---

## Diagnosi tecnica (basata sui log)
Nei log della Edge Function `enable-banking` risulta:
- `Enable Banking API error: 400 - {... "error":"ASPSP_ERROR" ...}`
- poi la funzione attuale maschera il motivo reale e rilancia sempre:  
  **"Failed to sync account. The connection may have expired."**
- infine la funzione aggiorna `bank_accounts.status = "error"`.

Quindi:
- il problema principale è lato banca/provider (ASPSP_ERROR), ma noi possiamo:
  - comunicare meglio cosa significa
  - guidare l’utente su cosa fare (riprova / ricollega)
  - rendere la UI coerente con lo stato DB

---

## Modifiche previste (codice)

### 1) Edge Function: messaggi più specifici e stato più coerente
**File:** `supabase/functions/enable-banking/index.ts`

Intervento su `syncAccount(...){ ... } catch (error) { ... }`:
- Leggere `error.message` originale.
- Se contiene `ASPSP_ERROR` (o “Error interacting with ASPSP”):
  - Restituire un errore più utile, ad esempio:
    - `Errore banca (ASPSP_ERROR): la banca non ha risposto correttamente tramite PSD2. Riprova più tardi.`
- Se contiene 401/403 (consenso scaduto / revocato):
  - Aggiornare status a `disconnected` invece che `error`
  - Messaggio:
    - `Consenso scaduto o revocato: premi "Ricollega".`
- Continuare ad aggiornare `bank_accounts.status` nel DB, ma con distinzione `error` vs `disconnected` (quando possibile).

Risultato: il frontend riceverà un `{"error":"...messaggio chiaro..."}` e potrà mostrarlo.

---

### 2) Frontend hook: parsing errori robusto + refresh dopo fallimento sync
**File:** `src/hooks/useEnableBanking.ts`

**A. Error parsing**
In `callEnableBankingFunction`:
- Gestire `error.context.body` anche quando:
  - non è JSON
  - oppure è già un oggetto
- Se JSON.parse fallisce, usare direttamente `ctx.body` come stringa (così non rimaniamo col messaggio generico).

**B. Refresh UI dopo errore**
In `syncAccount` (catch):
- Dopo aver mostrato il toast, chiamare `fetchAccounts()` (best-effort) per riallineare badge/stato/bottoni con il DB (che viene aggiornato a `error`/`disconnected` nella edge function).

Questo risolve il caso che vedi ora: badge “In sincronizzazione” ma in realtà il record è già `error`.

---

### 3) UI Card: niente “loading bloccato” e azioni coerenti quando fallisce
**File:** `src/components/conti-bancari/BankAccountCard.tsx`

- Mettere `handleSync/handleTest/handleReconnect` in `try/finally` per spegnere sempre `isSyncing/isTesting/isReconnecting`, anche se `onSync` lancia errore.
- (Consigliato) Quando `status === "error"`:
  - mostrare **sia** “Ricollega” **sia** “Riprova” (che richiama `onSync`), così se è un problema temporaneo lato banca l’utente può riprovare senza rifare tutto il consenso.
- Quando `status === "disconnected"`:
  - mostrare principalmente “Ricollega” (ha senso perché è tipicamente un problema di consenso).

---

### 4) Pagina Conti: supportare anche lo stato `disconnected`
**File:** `src/pages/ContiBancari.tsx`

- Sistemare `mapAccountToCard` per includere correttamente anche `disconnected` (oggi il cast non lo include), così se la edge function imposta `disconnected` la UI lo mostra e presenta le azioni corrette.

---

## Come verifichiamo che è risolto (test rapido)
1) Vai su **/conti-bancari**.
2) Clicca **Sincronizza** su BCC di Cherasco.
3) Atteso:
   - Il toast mostra un messaggio chiaro tipo **“Errore banca (ASPSP_ERROR) …”** (non più generico).
   - La card si aggiorna dopo poco (grazie a `fetchAccounts()` in catch):
     - badge passa a **“Riconnessione richiesta”** o **“Disconnesso”** (a seconda del caso)
     - compaiono i bottoni coerenti (Ricollega e/o Riprova)
   - I bottoni non restano bloccati in loading.

---

## Note importanti (limiti reali)
- **ASPSP_ERROR** è quasi sempre un problema di integrazione banca/PSD2 o un down temporaneo della banca: noi possiamo migliorare UX e diagnosi, ma non possiamo “forzare” la banca a rispondere.
- Se continua a dare ASPSP_ERROR anche dopo “Ricollega”, spesso l’unica soluzione è:
  - riprovare dopo qualche ora
  - oppure aprire ticket con Enable Banking indicando banca + timestamp + ASPSP_ERROR

---

## File coinvolti
- `supabase/functions/enable-banking/index.ts`
- `src/hooks/useEnableBanking.ts`
- `src/components/conti-bancari/BankAccountCard.tsx`
- `src/pages/ContiBancari.tsx`
