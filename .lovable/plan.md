
Stato attuale (cosa ho controllato “end-to-end” e cosa significa)
- La sezione /transazioni è collegata correttamente al resto della piattaforma: fa una query a Supabase su `bank_transactions` (join con `bank_accounts`) e riceve `200` con `[]`. Quindi la UI non “perde” dati: semplicemente nel DB non c’è niente da mostrare.
- Nel DB c’è 1 conto attivo (`bank_accounts` = 1) ma `bank_transactions` è 0.
- La Edge Function `enable-banking` sta provando a chiamare davvero l’endpoint Enable Banking:
  `GET https://api.enablebanking.com/accounts/{uid}/transactions?...`
  ma riceve sempre `400 ASPSP_ERROR` (“Error interacting with ASPSP”).
- Quindi oggi il problema non è “Conti Bancari non collegato al resto”: è che la chiamata “transactions” verso Enable Banking non sta tornando dati (né success né un payload utilizzabile), quindi non possiamo salvarli in `bank_transactions`.

Ipotesi più probabili (con priorità)
1) Parametri/query non compatibili con BCC (date_to “oggi”, oppure necessita `transaction_status=BOOK`, oppure necessita una `strategy` specifica).
2) Timing/race: dopo la connessione la sessione non è ancora “pronta” per recuperare movimenti e va fatto retry/backoff (alcune banche rispondono con errore generico se chiamate subito).
3) `psu_type` sbagliato (stai autorizzando come “business” ma la banca o il conto richiede “personal”, o viceversa). Nei log della sessione risulta `psu_type: "business"`.
4) Spec JWT: nelle docs moderne l’audience consigliata è `aud: "api.enablebanking.com"` (noi stiamo firmando con `aud: "api.tilisy.com"` che è deprecato). Anche se alcune chiamate funzionano, è una deviazione dalla specifica e voglio allinearla perché potrebbe impattare solo alcune integrazioni/endpoint.

Obiettivo
- Arrivare a una chiamata “transactions” che ritorna `200` con lista `transactions`, almeno per gli ultimi 7-30 giorni.
- Popolare `bank_transactions`, così /transazioni mostra dati.

Piano di intervento (code + debug, senza “a tentativi ciechi”)
A) Aggiungere una modalità di diagnostica server-side (Edge Function) che ci dica esattamente cosa risponde Enable Banking
- In `supabase/functions/enable-banking/index.ts` aggiungere una nuova `action` (es. `debug_transactions`) che:
  1) Verifica ownership dell’account (come già facciamo in `syncAccount`).
  2) Chiama l’endpoint Enable Banking `/accounts/{uid}/transactions` con combinazioni controllate di parametri:
     - Variante 1: senza `date_from/date_to` (solo endpoint nudo).
     - Variante 2: con `date_to = ieri` (non oggi) e `date_from` coerente.
     - Variante 3: aggiungendo `transaction_status=BOOK`.
     - Variante 4: se disponibile/necessario, aggiungendo `strategy=<valore>` (configurabile).
  3) Ritorna al frontend un JSON con:
     - status code
     - body raw (o parse JSON) della risposta Enable Banking
     - i parametri usati (date_from/date_to/transaction_status/strategy)
     - psu headers effettivamente inviati (solo i nomi, e magari IP/UA troncato)
- Vantaggio: smettiamo di “indovinare”; vediamo quale combinazione funziona e quale no.

B) Rendere la sync “resiliente” alle banche che non accettano “oggi”
- In `syncAccountTransactionsWithFallback` cambiare la logica di calcolo date:
  - invece di `endDate = today`, provare:
    1) `endDate = yesterday` come default (molte banche PSD2 sono in ritardo/chiudono a fine giornata)
    2) se fallisce per “period” o errori specifici, fallback a `today`
- Tenere il fallback 365/90/30/7, ma con endDate più “compatibile”.

C) Aggiungere (o rendere di default) `transaction_status=BOOK`
- Da docs, l’endpoint transazioni supporta `transaction_status` come query param.
- Implementazione:
  - prima chiamata: `transaction_status=BOOK` (per prendere le “booked” che sono quelle che di solito servono a contabilità)
  - opzionale seconda chiamata: includere pending separatamente, solo se serve.

D) Allineare JWT alla specifica attuale (fix potenzialmente decisivo, costo basso)
- In `createJWT()` aggiornare payload:
  - `aud: "api.enablebanking.com"` (invece di `api.tilisy.com`)
- Aggiungere anche header HTTP standard `Accept: application/json` nelle chiamate a Enable Banking (oltre a `Psu-Accept`), per evitare comportamenti “strani” su alcune pipeline.

E) Retry/backoff post-connessione (se la banca non è pronta immediatamente)
- Dopo `POST /sessions` e prima dell’auto-sync, aggiungere:
  - 2-3 tentativi con delay crescente (es. 1s, 2s, 4s) solo per la prima fetch transazioni
- E in caso di ASPSP_ERROR, prima di fallback finestre, fare un retry breve (alcune banche oscillano).

F) Verifica che non sia un problema “psu_type” (business vs personal)
- Aggiornare UI/flow (ConnectBankModal) per rendere evidente e persistente il `psu_type` scelto, e salvarlo su `bank_accounts` (se non già).
- In diagnostica `debug_transactions` includere anche `psu_type` della sessione per capire se stiamo autorizzando con un tipo non coerente.

G) UX (opzionale ma utile): bottone “Diagnostica”/“Esporta log” in Conti Bancari
- Aggiungere un pulsante visibile solo in modalità admin/dev (o dietro feature flag) che chiama `debug_transactions` e mostra il risultato.
- Così quando una banca specifica fallisce, avete immediatamente materiale da dare al support Enable Banking o per confrontare con chiamate fatte fuori piattaforma.

Come testeremo (end-to-end)
1) Colleghi il conto.
2) Premi “Sincronizza”.
3) Verifichiamo nei log:
   - che almeno una delle varianti (`date_to=ieri`, `transaction_status=BOOK`, ecc.) torni `200` e “Total transactions fetched > 0”.
4) Query DB: `bank_transactions` deve diventare > 0.
5) Ritorno su /transazioni: la lista si popola.

Risultato atteso
- Se il problema è “parametri / endDate / status / strategy / timing / aud JWT”: vedremo finalmente transazioni importate e la piattaforma risulta “connessa” come deve.
- Se invece anche la modalità `debug_transactions` mostra che Enable Banking continua a ricevere `400 ASPSP_ERROR` da BCC con qualsiasi combinazione: allora è davvero un problema di connettore ASPSP (banca) e avremo prove precise, non supposizioni (utile anche per aprire ticket a Enable Banking).

Nota importante
- Al momento, dai log, la richiesta “transactions” sta fallendo prima di qualsiasi salvataggio: quindi non è un problema di mapping DB o di pagina /transazioni. È a monte, nella fetch dalla banca via Enable Banking, e dobbiamo sbloccarla con diagnostica + parametri compatibili.

Se vuoi che continui subito con l’implementazione, mandami un nuovo messaggio (questa richiesta era “time critical” e mi devo fermare qui).
