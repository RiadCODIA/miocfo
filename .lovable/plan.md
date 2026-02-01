
Obiettivo
- Far comparire finalmente le transazioni (Revolut e BCC) in /transazioni.
- Eliminare il bug “silenzioso” per cui Enable Banking restituisce movimenti ma il nostro DB rimane vuoto.
- Verificare che “Conti Bancari” sia davvero collegato al resto del flusso: lo è, ma oggi il salvataggio a DB fallisce.

Cosa ho controllato (end-to-end) e cosa significa
- Database: `bank_accounts` = 6, `bank_transactions` = 0.
- Log Edge Function `enable-banking`: ripetuti errori
  - `null value in column "plaid_transaction_id" of relation "bank_transactions" violates not-null constraint`
- Diagnostica reale su Revolut (chiamata `debug_transactions`):
  - la risposta contiene transazioni valide (date, entry_reference, amount, ecc.)
  - ma `transaction_id` è `null` per tutte le transazioni che ho visto.
- Il nostro codice salva `plaid_transaction_id = tx.transaction_id`.
  - La colonna `bank_transactions.plaid_transaction_id` è NOT NULL + UNIQUE.
  - Risultato: ogni upsert fallisce → nessuna transazione entra a DB → /transazioni è vuoto.
- Quindi sì: è un problema di codice nostro, non di “sezione conti non collegata”.

Root cause (preciso)
- Enable Banking / alcuni ASPSP (Revolut incluso) restituiscono `transaction_id: null`.
- Noi abbiamo scelto un campo DB legacy chiamato `plaid_transaction_id` come chiave univoca NOT NULL.
- Stiamo scrivendo `null` in quel campo → insert/upsert fallisce sempre.

Soluzione tecnica (senza cambiare schema DB)
1) Generare un ID transazione “stabile e sempre presente” per `plaid_transaction_id`
- In `supabase/functions/enable-banking/index.ts` introdurre una funzione:
  - `computeExternalTransactionId(enableBankingUid, tx): string`
- Priorità consigliata:
  1. se `tx.transaction_id` esiste → `eb:${enableBankingUid}:tx:${tx.transaction_id}`
  2. altrimenti se `tx.entry_reference` esiste (nel tuo caso Revolut c’è) → `eb:${enableBankingUid}:entry:${tx.entry_reference}`
  3. altrimenti se `tx.reference_number` esiste → `eb:${enableBankingUid}:ref:${tx.reference_number}`
  4. fallback deterministico (hash SHA-256) costruito da campi stabili:
     - `enableBankingUid|booking_date|value_date|amount|currency|credit_debit_indicator|remittance_information|creditor.name|debtor.name`
     - ID finale tipo `eb:${enableBankingUid}:hash:${sha256Hex}`
- Questo mantiene:
  - NOT NULL rispettato
  - deduplicazione stabile tra sync successivi (upsert funziona davvero)
  - nessuna collisione tra conti diversi (prefisso con account UID)

2) Correggere il segno dell’importo (fondamentale per dashboard/KPI)
- Oggi salviamo `amount` sempre positivo.
- In tutto il prodotto (dashboard, KPI, cashflow) l’assunzione è:
  - incassi = `amount > 0`
  - pagamenti = `amount < 0`
- In `syncAccountTransactionsCore`:
  - `rawAmount = toNumber(tx.transaction_amount.amount)`
  - se `credit_debit_indicator === "DBIT"` → `amount = -Math.abs(rawAmount)`
  - se `credit_debit_indicator === "CRDT"` → `amount = Math.abs(rawAmount)`
  - se manca indicatore → fallback conservativo:
    - mantenere il segno positivo ma loggare un warning (o usare euristica su debtor/creditor)

3) Evitare che la sync “sembri riuscita” quando in realtà non salva nulla
- Oggi la funzione continua anche dopo upsert error, e torna `transactions_synced: 0` senza fallire “a livello sync”.
- Miglioria:
  - contare `fetchedCount`, `syncedCount`, `failedCount`
  - se `fetchedCount > 0` e `syncedCount === 0` → lanciare errore con messaggio chiaro:
    - “Transazioni ricevute ma non salvate: errore di mapping/constraint”
  - loggare solo i primi N errori per non “inondare” i log.

4) (Importante per “controlla tutta la piattaforma”) mettere in sicurezza l’Edge Function
Stato attuale:
- `supabase/config.toml` ha `verify_jwt = false` per `enable-banking`.
- La funzione oggi si fida di `user_id` passato nel body e, se manca, alcune azioni possono operare senza filtro (rischio serio di data exposure).

Fix proposto (stesso file: `supabase/functions/enable-banking/index.ts`):
- Leggere `Authorization` header
- Creare un client “auth” con `SUPABASE_ANON_KEY` (come già fatto in `create-client-user`)
- `supabaseAuth.auth.getUser()` → ottenere `callerUser.id`
- Usare SOLO quello come `userId` effettivo (ignorare `user_id` dal body)
- Rendere obbligatoria l’autenticazione per tutte le actions:
  - `get_accounts`, `sync_account`, `get_transactions`, `remove_connection`, `debug_transactions`, `complete_session`
- Questo non solo è più sicuro, ma elimina anche dubbi sul fatto che “conti bancari non sono connessi” (evita mix di dati cross-user anche per sbaglio).

5) Aggiornamento frontend (piccolo, consigliato)
Per allinearsi alla sicurezza:
- `src/hooks/useEnableBanking.ts`: non inviare più `user_id` nel body (non serve)
- `src/pages/ContiBancari.tsx`: stesso per `debug_transactions`
- (Opzionale ma consigliato in follow-up) sostituire fetch hard-coded con `supabase.functions.invoke('enable-banking', { body: ... })` per:
  - eliminare URL/anonKey hard-coded
  - avere gestione errori standard e meno duplicazioni

File coinvolti
- Necessari:
  - `supabase/functions/enable-banking/index.ts`
- Consigliati (cleanup/security alignment):
  - `src/hooks/useEnableBanking.ts`
  - `src/pages/ContiBancari.tsx`

Come verifichiamo che sia risolto (test end-to-end)
1) In /conti-bancari:
   - clic su “Sincronizza” su un conto Revolut
2) Atteso nei log edge function:
   - non deve più comparire l’errore “plaid_transaction_id null”
   - deve comparire `Total transactions fetched: X` e `transactions_synced: > 0`
3) Verifica DB:
   - `select count(*) from bank_transactions;` deve diventare > 0
4) /transazioni:
   - la tabella si popola
   - importi: entrate verdi (positive), uscite rosse (negative)

Rischi / Edge cases gestiti
- Se un ASPSP non fornisce né `transaction_id` né `entry_reference` né `reference_number`:
  - il fallback hash garantisce un ID stabile.
- Se alcune transazioni hanno campi “variabili” (ordine array, spazi):
  - il fallback hash userà solo campi selezionati e normalizzati (string trim, join standard).
- Duplicati/riconnessioni:
  - l’upsert su `plaid_transaction_id` continuerà a deduplicare correttamente.

Output atteso
- Transazioni finalmente salvate e visibili (Revolut incluso).
- Dashboard/KPI/cashflow coerenti grazie al segno corretto degli importi.
- Edge function `enable-banking` non esposta a richieste anonime o user_id falsificati.
