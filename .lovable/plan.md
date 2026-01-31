

## Obiettivo
Correggere gli errori di sincronizzazione e mostrare il saldo corretto (disponibile invece di contabile).

## Problemi Identificati

### 1. Errore 422: "WRONG_TRANSACTIONS_PERIOD"
**Causa**: Il codice richiede transazioni per 365 giorni, ma FinecoBank limita l'accesso agli ultimi 90 giorni dopo l'autorizzazione iniziale.

**Log specifico**:
```
GET /accounts/.../transactions?date_from=2025-01-31&date_to=2026-01-31
Error 422: "Wrong transactions period requested"
```

### 2. Saldo Errato (€10.484 invece di ~€9.900)
**Causa**: Il sistema mostra `current_balance` (saldo contabile ITBD = €10.484) invece di `available_balance` (saldo disponibile ITAV = €9.951).

Il saldo **disponibile** (ITAV) è quello che vedi nella tua app Fineco e corrisponde al ~€9.900 che hai verificato.

### 3. Errore 429: Rate Limit
**Causa**: Troppi tentativi di sincronizzazione falliti hanno superato il limite giornaliero della banca. Questo si risolverà automaticamente dopo 24 ore.

---

## Piano di Implementazione

### Fase 1: Correggere il Periodo Transazioni (Edge Function)

**File**: `supabase/functions/enable-banking/index.ts`

Modificare la logica per tentare prima 90 giorni (limite sicuro per la maggior parte delle banche), con fallback intelligente:

```typescript
// Fase 1: Prova con 90 giorni (limite sicuro per la maggior parte delle ASPSP)
const endDate = new Date().toISOString().split("T")[0];
let startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

// Se è la prima sincronizzazione dopo l'autorizzazione (entro 1 ora), prova 365 giorni
const accountCreatedAt = new Date(account.created_at);
const hoursSinceCreation = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60);

if (hoursSinceCreation <= 1) {
  // Entro la prima ora, molte banche permettono storico più lungo
  startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  console.log(`[Enable Banking] First sync within 1h, trying 365 days`);
}
```

Aggiungere anche gestione specifica dell'errore 422 per retry con periodo più breve:

```typescript
} catch (txError) {
  const txErrorMsg = txError instanceof Error ? txError.message : String(txError);
  
  // Se errore 422 WRONG_TRANSACTIONS_PERIOD, riprova con 90 giorni
  if (txErrorMsg.includes("422") || txErrorMsg.includes("WRONG_TRANSACTIONS_PERIOD")) {
    console.log(`[Enable Banking] 365-day period rejected, falling back to 90 days`);
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    // Retry with shorter period...
  }
}
```

### Fase 2: Mostrare il Saldo Disponibile (Frontend)

**File**: `src/pages/ContiBancari.tsx`

Modificare `mapAccountToCard` per usare `available_balance` come saldo principale:

```typescript
const mapAccountToCard = (account: BankAccount) => ({
  id: account.id,
  bankName: account.bank_name,
  iban: account.iban || `•••• ${account.mask || "****"}`,
  // Usa il saldo DISPONIBILE invece del saldo contabile
  balance: account.available_balance || account.current_balance || 0,
  currency: account.currency || "EUR",
  status: account.status as "active" | "pending" | "error" | "disconnected",
  lastSync: account.last_sync_at ? new Date(account.last_sync_at) : new Date(),
  source: (account as BankAccount & { source?: string }).source || "enable_banking",
});
```

**File**: `src/components/conti-bancari/BankAccountCard.tsx`

Aggiornare l'etichetta da "Saldo attuale" a "Saldo disponibile" per chiarezza:

```typescript
<p className="text-sm text-muted-foreground">Saldo disponibile</p>
```

### Fase 3: Gestione Specifica Errore 429 (Edge Function)

**File**: `supabase/functions/enable-banking/index.ts`

Aggiungere riconoscimento specifico dell'errore rate limit:

```typescript
} else if (errorMessage.includes("429") || errorMessage.includes("ASPSP_RATE_LIMIT_EXCEEDED")) {
  userMessage = "Limite giornaliero raggiunto: la banca limita gli accessi. Riprova domani.";
  newStatus = "error";
}
```

---

## File da Modificare

| File | Modifica |
|------|----------|
| `supabase/functions/enable-banking/index.ts` | Periodo 90 giorni, retry con fallback, gestione errore 429 |
| `src/pages/ContiBancari.tsx` | Usare `available_balance` invece di `current_balance` |
| `src/components/conti-bancari/BankAccountCard.tsx` | Etichetta "Saldo disponibile" |

---

## Risultato Atteso

Dopo queste modifiche:
- **Saldo corretto**: Mostrerà ~€9.951 (saldo disponibile) invece di €10.484
- **Sincronizzazione funzionante**: Le transazioni degli ultimi 90 giorni verranno scaricate
- **Messaggi errore chiari**: L'utente vedrà messaggi specifici per rate limit

---

## Nota sul Rate Limit

L'errore 429 attuale si risolverà automaticamente dopo alcune ore. Una volta implementate le modifiche, attendi qualche ora prima di testare nuovamente la sincronizzazione.

