

# Fix: Pagina Notifiche vuota - Generazione e visualizzazione alert

## Problema identificato

La pagina "Notifiche" e sempre vuota per tre motivi principali:

1. **Colonne sbagliate nella edge function**: La funzione `check-alerts` usa nomi di colonne che non esistono nella tabella `alerts` (es. `alert_type`, `description`, `priority`, `status` invece di `type`, `message`, `severity`, `is_read`). Ogni insert fallisce silenziosamente.

2. **Mancanza di `user_id`**: La funzione non imposta il `user_id` sugli alert creati. Anche se l'insert riuscisse, la policy RLS (`auth.uid() = user_id`) impedirebbe all'utente di vederli.

3. **Nessun trigger automatico**: La funzione non viene mai invocata -- non c'e cron, ne chiamata dal frontend. Gli alert non vengono mai generati.

---

## Soluzione

### 1. Correggere la edge function `check-alerts`

Allineare i nomi delle colonne con lo schema reale della tabella `alerts`:

| Usato nella function | Colonna reale |
|---|---|
| `alert_type` | `type` |
| `description` | `message` |
| `priority` | `severity` (con mapping: high->error, medium->warning, low->info) |
| `status: "active"` | `is_read: false` |

Aggiungere il parametro `user_id` a ogni insert.

Modificare la funzione per accettare un `userId` nel body della request e usarlo per:
- Filtrare deadlines/budgets/bank_accounts di quell'utente
- Inserire gli alert con quel `user_id`

### 2. Aggiungere generazione automatica al caricamento della pagina

Nel hook `useAlerts`, aggiungere una chiamata automatica alla edge function `check-alerts` quando la pagina viene caricata. Questo garantisce che gli alert vengano generati/aggiornati ogni volta che l'utente visita la pagina Notifiche.

Usare una mutation con `useEffect` che:
- Invia il `userId` dell'utente loggato
- Invalida la query degli alert dopo il completamento
- Non blocca il rendering della pagina (eseguita in background)

### 3. Correggere il controllo duplicati

Anche la query di verifica duplicati usa colonne sbagliate. Allinearla con le colonne reali (`type`, `is_read`, `title`).

---

## File da modificare

| File | Modifiche |
|---|---|
| `supabase/functions/check-alerts/index.ts` | Correggere nomi colonne, aggiungere user_id, filtrare dati per utente |
| `src/hooks/useAlerts.ts` | Aggiungere hook `useGenerateAlerts` che chiama la edge function al mount |
| `src/pages/AlertNotifiche.tsx` | Integrare `useGenerateAlerts` per trigger automatico |

---

## Dettagli tecnici

### Mapping colonne nella edge function

```text
Insert attuale (SBAGLIATO):
  { type, alert_type, title, description, priority, status }

Insert corretto:
  { type, title, message, severity, is_read: false, user_id }

severity mapping:
  "high"   -> "error"
  "medium" -> "warning"  
  "low"    -> "info"
```

### Hook useGenerateAlerts

Nuova funzione nel file `useAlerts.ts` che:
- Chiama `supabase.functions.invoke("check-alerts", { body: { userId } })`
- Viene eseguita una volta al mount della pagina AlertNotifiche
- Al completamento invalida le query `["alerts"]` e `["alerts-count"]`

### Filtri per utente nella edge function

Ogni query nella edge function (deadlines, budgets, bank_accounts) verra filtrata con `.eq("user_id", userId)` per generare alert specifici per quell'utente.

