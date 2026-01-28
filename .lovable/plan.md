
Obiettivo: risolvere l’errore mostrato dopo il rientro da Enable Banking (“Edge Function returned a non-2xx status code”) e far comparire correttamente i conti collegati.

## Diagnosi (cosa sta succedendo)
Dai log della Edge Function `enable-banking` risulta:
- durante `complete_session` viene chiamato **GET** `https://api.enablebanking.com/sessions/{session_id}/accounts`
- la risposta è **404 Not Found** (`{"detail":"Not Found"}`)

Questo indica che quell’endpoint non è valido. Da documentazione Enable Banking:
- l’endpoint **POST `/sessions`** (con `{ code }`) restituisce già `session_id` e anche la lista `accounts` (dettagli “mostrati solo una volta”)
- quindi non bisogna chiamare `/sessions/{session_id}/accounts`.

Il frontend vede un errore generico perché `supabase.functions.invoke` in caso di HTTP non-2xx solleva `FunctionsHttpError` con messaggio standard.

## Cosa implementerò (fix principale)
### 1) Correzione `completeSession` nella Edge Function (rimuovere chiamata 404)
**File:** `supabase/functions/enable-banking/index.ts`

Modifica della logica:
- `POST /sessions` con `{ code }` → salva la risposta in `session`
- ricava i conti da `session.accounts` (quando presente) invece di chiamare `/sessions/{id}/accounts`
- per ogni account:
  - usa `account.uid` come account id per le chiamate successive
  - chiama `/accounts/{uid}/balances` (come già fai)
  - salva su DB in `bank_accounts`

### 1b) Fallback robusto (se alcune banche non restituiscono `accounts` al POST /sessions)
Sempre in `completeSession`:
- se `session.accounts` è vuoto/assente:
  - chiama `GET /sessions/{session_id}` (endpoint valido) per ottenere `accounts` (lista di id)
  - per ciascun id, chiama `GET /accounts/{account_id}/details` per ottenere i dettagli (incluso `uid`)
  - prosegui con bilanci + salvataggio DB

Risultato atteso: `complete_session` non andrà più in 404 e la function tornerà 200 con `accounts`.

## Migliorie necessarie per evitare errori “misteriosi” lato UI
### 2) Mostrare il messaggio reale dell’errore (non quello generico)
**File:** `src/hooks/useEnableBanking.ts`

Aggiornamento di `callEnableBankingFunction`:
- quando `supabase.functions.invoke` ritorna `error` di tipo `FunctionsHttpError`:
  - estrarre e parsare il body della response (`error.context`) se possibile
  - se nel body c’è `{ error: "..." }`, usare quello come messaggio mostrato all’utente
- fallback: mantenere il messaggio standard solo se non è possibile leggere il body

Risultato atteso: se la function fallisce, il modal mostra l’errore vero (es. “Enable Banking API error: ...”), facilitando supporto e debug.

## (Consigliato) Hardening sicurezza + correttezza dati
Questa parte non è necessaria per “far funzionare” il collegamento, ma evita problemi seri in produzione.

### 3) Filtrare i dati per utente nelle actions “get_accounts / get_transactions / sync_account / remove_connection”
**File:** `supabase/functions/enable-banking/index.ts`

Problema attuale: `getAccounts()` usa service role e fa `select(*)` su tutta la tabella, quindi potrebbe restituire conti di altri utenti (bypass RLS).

Soluzione:
- richiedere sempre un `user_id` valido per le operazioni “utente”
- filtrare le query con `.eq("user_id", userId)`
- per `sync_account`, `remove_connection`, `get_transactions`: verificare che l’`accountId` appartenga a `userId` prima di procedere

Nota: l’estrazione di `userId` ideale è dal token (`Authorization` header), non dal body. Se manteniamo `verify_jwt=false`, implementerò la validazione server-side (leggere token e derivare user_id) così non ci si fida del client.

## Test (end-to-end) dopo le modifiche
1. Aprire la URL pubblicata `https://insight-buddy-09.lovable.app`
2. Login
3. Conti Bancari → Collega nuovo conto → completare flusso in banca
4. Al rientro:
   - il modal deve passare a “Connessione riuscita!”
   - devono apparire i conti collegati (e `Aggiorna` deve mostrare lo stesso)
5. Se qualcosa fallisce:
   - verificare nei log `enable-banking` che non esista più la chiamata `/sessions/{id}/accounts`
   - verificare che l’errore mostrato nel modal sia dettagliato (non più “non-2xx” generico)

## File coinvolti
- `supabase/functions/enable-banking/index.ts` (fix endpoint + fallback + optional hardening)
- `src/hooks/useEnableBanking.ts` (error handling migliore)

## Rischi / note
- Alcune banche possono comportarsi diversamente: il fallback `GET /sessions/{id}` + `/accounts/{id}/details` copre la casistica.
- Se l’utente avvia il flusso dalla preview e viene reindirizzato al dominio pubblicato, la sessione Supabase non è condivisa tra domini: per questo il collegamento va testato/effettuato dalla URL pubblicata.
