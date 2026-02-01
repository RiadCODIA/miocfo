# Piano di fix transazioni bancarie - IMPLEMENTATO

## Fix applicati (2025-02-01)

### A) JWT Audience aggiornato ✅
- Cambiato `aud: "api.tilisy.com"` → `aud: "api.enablebanking.com"` (specifica aggiornata)
- Aggiunto header `Accept: application/json` a tutte le chiamate

### B) transaction_status=BOOK ✅
- Aggiunto parametro `transaction_status=BOOK` alla query transazioni
- Le transazioni "booked" sono quelle confermate, più affidabili per contabilità

### C) endDate = yesterday (default) ✅
- Molte banche PSD2 rifiutano "oggi" come data fine
- Ora prova prima "ieri", poi "oggi" come fallback
- Finestre: 365 → 90 → 30 → 7 giorni

### D) Retry/backoff su ASPSP_ERROR ✅
- 2 tentativi con delay crescente (1s, 2s) prima di passare a finestra più corta
- Alcune banche hanno errori transitori che si risolvono con un breve retry

### E) Delay post-connessione ✅
- Attesa 2 secondi dopo `POST /sessions` prima dell'auto-sync
- Alcune banche non sono immediatamente pronte dopo l'autorizzazione

### F) debug_transactions action ✅
- Nuova action che testa 6 combinazioni di parametri:
  - no_dates, yesterday_7d, yesterday_7d_BOOK, today_7d, today_30d_BOOK, yesterday_30d_BOOK
- Ritorna status code e body raw per ogni variante
- Utile per aprire ticket a Enable Banking con dati precisi

### G) UI Diagnostica ✅
- Aggiunto bottone 🐞 (Bug) su ogni carta conto
- Cliccando mostra una modale con i risultati di tutte le varianti testate
- Mostra PSU context (IP, User Agent) per verificare che siano corretti

---

## Come testare

1. **Scollega** il conto BCC Cherasco esistente
2. **Ricollega** il conto (ora attende 2s e usa JWT corretto)
3. Se ancora fallisce, premi il bottone **🐞** sulla carta del conto
4. Nella modale vedrai quale variante funziona (status 200) o fallisce (status 400)
5. Se una variante con "yesterday" e "BOOK" funziona → significa che la banca accetta quei parametri
6. Se **tutte** falliscono con ASPSP_ERROR → è un problema del connettore BCC e va aperto ticket a Enable Banking

---

## Nota sicurezza (RLS)

`bank_transactions` ha ancora RLS `USING (true)`. Da sistemare con:
- Policy che fa join su `bank_accounts.user_id = auth.uid()`
- Oppure aggiungere `user_id` alla tabella e policy diretta

---

## File modificati

- `supabase/functions/enable-banking/index.ts` - tutte le fix backend
- `src/hooks/useEnableBanking.ts` - aggiunta funzione `debugTransactions`
- `src/components/conti-bancari/BankAccountCard.tsx` - bottone diagnostica + modale
- `src/pages/ContiBancari.tsx` - passaggio handler `onDebug`
