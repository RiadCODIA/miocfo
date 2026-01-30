

## Piano: Migliorare la Gestione degli Errori Enable Banking

### Problema Identificato

Il collegamento della banca funziona (il conto viene creato), ma:
1. Il saldo rimane a 0€ perché l'errore nel recupero saldi viene ignorato silenziosamente
2. Lo status diventa "Errore" quando provi a sincronizzare perché la banca restituisce `ASPSP_ERROR`

### Causa Probabile

L'errore `ASPSP_ERROR` da Enable Banking indica un problema di comunicazione con la banca BCC di Cherasco. Potrebbe essere:
- Consenso PSD2 non completato correttamente
- Problemi temporanei dell'API della banca
- La banca potrebbe richiedere autenticazione SCA aggiuntiva per accedere ai saldi

### Soluzione Proposta

Migliorare il codice per:
1. Loggare chiaramente quando il recupero saldi fallisce durante `complete_session`
2. Mostrare all'utente un messaggio più utile invece di "Errore"
3. Aggiungere un pulsante "Ricollega" quando la connessione è scaduta/invalida

---

## Modifiche Tecniche

### 1. Edge Function: Migliorare logging e gestione errori

**File:** `supabase/functions/enable-banking/index.ts`

Modificare la funzione `completeSession` per loggare esplicitamente quando il recupero saldi fallisce:

```typescript
// Linea 287-289: Migliorare il logging
} catch (e) {
  console.error("[Enable Banking] FAILED to fetch balances for account", account.uid, ":", e);
  // Continuiamo con balance = 0, ma logghiamo l'errore
}
```

Modificare per impostare uno status più descrittivo quando c'è un errore di saldi:

```typescript
// Nuovo campo: se i saldi non sono stati recuperati, usiamo uno status diverso
status: currentBalance === 0 && availableBalance === 0 ? "pending" : "active",
```

### 2. Frontend: Mostrare messaggi più utili

**File:** `src/components/conti-bancari/BankAccountCard.tsx`

Aggiungere un pulsante "Ricollega" per gli account in errore e migliorare i messaggi di stato:

```typescript
// Aggiungere "pending" come status con messaggio "In attesa di sincronizzazione"
const statusConfig = {
  active: { label: "Attivo", className: "bg-success text-success-foreground" },
  pending: { label: "In sincronizzazione", className: "bg-warning text-warning-foreground" },
  error: { label: "Riconnessione richiesta", className: "bg-destructive text-destructive-foreground" },
};

// Mostrare pulsante "Ricollega" quando status è error
{account.status === "error" && (
  <Button variant="outline" size="sm" onClick={() => onReconnect?.(account.id)}>
    <RefreshCw className="h-4 w-4 mr-1" />
    Ricollega
  </Button>
)}
```

### 3. Opzionale: Retry automatico per saldi

Aggiungere un meccanismo di retry nella Edge Function per tentare più volte di recuperare i saldi in caso di errore temporaneo della banca.

---

## Riepilogo File da Modificare

| File | Modifica |
|------|----------|
| `supabase/functions/enable-banking/index.ts` | Logging migliorato, status "pending" se saldi = 0 |
| `src/components/conti-bancari/BankAccountCard.tsx` | Status "pending", pulsante "Ricollega" |
| `src/pages/ContiBancari.tsx` | Handler per riconnessione account |

---

## Nota Importante

L'errore `ASPSP_ERROR` è un problema lato banca, non del nostro codice. Possibili azioni:

1. **Attendere e riprovare** - Potrebbe essere un problema temporaneo della banca
2. **Verificare il consenso** - Assicurati che il consenso PSD2 sia stato completato fino in fondo sul sito della banca
3. **Contattare Enable Banking** - Se il problema persiste, potrebbero esserci problemi specifici con BCC di Cherasco

