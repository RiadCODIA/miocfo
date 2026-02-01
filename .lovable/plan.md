
## Cosa ho verificato (e perché oggi non vedi transazioni)

1) **Il frontend sta funzionando**: la pagina **/transazioni** fa una query a Supabase su `bank_transactions` e riceve **200 con body `[]`** (quindi non è un problema di filtri/UI).

2) **Il database è vuoto**: in questo ambiente `bank_transactions` ha **count = 0**. Quindi il problema è che **le transazioni non vengono mai salvate**.

3) **Il backend (edge function) fallisce nel fetch delle transazioni**: nei log di `enable-banking` si vede chiaramente che la chiamata:
`GET /accounts/{uid}/transactions?date_from=...&date_to=...`
ritorna **400 ASPSP_ERROR** (“Error interacting with ASPSP”).
Quindi l’import non parte perché **Enable Banking non ci sta consegnando i movimenti in quella chiamata** (anche se i saldi funzionano).

## Probabile causa reale (non “la banca non funziona” in generale)

Oggi noi inviamo header PSU “fissi”, inclusa **Psu-Ip-Address = 0.0.0.0**.
Per diverse banche PSD2 (Italia in particolare) l’endpoint transazioni è più “rigido” e può rifiutare richieste con:
- PSU IP non valido/assente
- user-agent non coerente
- periodo troppo ampio (alcune banche rispondono 400 invece di 422)

Quindi dobbiamo:
1) **passare l’IP reale dell’utente** (da `x-forwarded-for`) e lo user-agent reale
2) **aggiungere fallback di periodo** quando l’ASPSP non accetta un range grande

---

## Modifiche da implementare

### A) Passare PSU headers reali (IP/UA/Lingua/Referer) alla chiamata transactions
**File:** `supabase/functions/enable-banking/index.ts`

1. Nel handler `serve(async (req) => ...)` estrarre un “PSU context” dal request:
   - `ip` da `x-forwarded-for` (primo IP della lista) con fallback su `cf-connecting-ip` / `x-real-ip`
   - `userAgent` da `user-agent`
   - `acceptLanguage` da `accept-language`
   - `referer` da `referer`
2. Passare questo contesto alle funzioni:
   - `completeSession(code, userId, psuContext)`
   - `syncAccount(accountId, userId, psuContext)`
3. Aggiornare `syncAccountTransactions(...)` per **non usare più** PSU headers hard-coded (0.0.0.0) e costruirli invece da `psuContext`.
   - Se un valore manca, **meglio omettere l’header** (invece di usare 0.0.0.0).

**Obiettivo:** far sì che la banca riceva parametri PSU “credibili” e non rifiuti la richiesta transazioni.

---

### B) Error handling strutturato in enableBankingRequest (per decidere i retry)
**File:** `supabase/functions/enable-banking/index.ts`

1. In `enableBankingRequest`, quando `response.ok` è false:
   - fare `text()` come oggi
   - provare `JSON.parse(text)` (se possibile)
   - creare un `Error` arricchito con:
     - `(err as any).status = response.status`
     - `(err as any).payload = parsedJson` (se parse ok)
2. Questo ci permette di riconoscere in modo affidabile:
   - 429 rate limit (non bisogna ritentare)
   - 401/403/consent (non bisogna ritentare)
   - 400 ASPSP_ERROR (ha senso provare con periodo più corto)

---

### C) Fallback automatico di periodo (365 → 90 → 30 → 7 giorni)
**File:** `supabase/functions/enable-banking/index.ts`

1. Introdurre una funzione wrapper tipo:
   - `syncAccountTransactionsWithFallback(dbAccountId, accountUid, supabase, endDate, windowsDays[], psuContext)`
2. Logica:
   - prova il primo range (es: 365 per “connessione fresca”)
   - se fallisce con:
     - **ASPSP_ERROR** (payload.error === "ASPSP_ERROR") oppure status 400
     - **WRONG_TRANSACTIONS_PERIOD** / status 422
     allora prova il range successivo più corto
   - se fallisce con:
     - **429** → stop immediato (non peggioriamo)
     - **401/403/consent** → stop immediato (serve scollega/ricollega)
3. Usare questa wrapper in 2 punti:
   - **auto-sync** dentro `completeSession` (oggi fa 365 e si ferma al primo 400)
   - **manual sync** dentro `syncAccount` (oggi fa 365/90 ma fallback solo su 422)

**Obiettivo:** anche se la banca rifiuta range lunghi, dovremmo riuscire a importare almeno gli ultimi 7/30 giorni, così in /transazioni comparirà finalmente qualcosa.

---

### D) (Piccola UX) Messaggio empty-state più corretto in /transazioni
**File:** `src/pages/Transazioni.tsx`

Oggi quando `transactions.length === 0` mostra:
“Collega un conto bancario...”, che è fuorviante se il conto è collegato ma l’import non è riuscito.

Modifica proposta:
- testo: “Nessuna transazione importata. Vai su Conti Bancari e premi Sincronizza, oppure importa un estratto conto (PDF/CSV).”
- bottone “Vai a Conti Bancari” (link) e/o “Carica estratto conto”

(Non risolve il backend, ma evita che l’utente pensi che il collegamento non esista.)

---

## Come verifichiamo che sia risolto (test end-to-end)
1) Vai su **Conti Bancari** e premi **Sincronizza**
2) Controlliamo nei log edge function che:
   - la chiamata a `/transactions` non ritorni 400
   - venga stampato “Total transactions fetched: …”
   - vengano eseguiti gli upsert senza errori
3) Verifica DB: `bank_transactions` deve diventare > 0
4) Torna su **/transazioni**: la tabella deve popolarsi

---

## Nota importante (sicurezza, non bloccante per vedere le transazioni)
Ho notato che `bank_transactions` ha RLS “Allow all access … USING true”. È rischioso (potenziale lettura cross-user).
Non lo tocco in questa fix “transazioni non visibili”, ma appena le transazioni arrivano conviene mettere:
- RLS corretta (ad es. accesso tramite join su bank_accounts.user_id)
- oppure aggiungere `user_id` a `bank_transactions` e policy per `auth.uid() = user_id`

---

## File coinvolti
- `supabase/functions/enable-banking/index.ts` (PSU headers reali + error parsing + fallback periodi)
- `src/pages/Transazioni.tsx` (solo miglioramento messaggio empty-state, opzionale)
