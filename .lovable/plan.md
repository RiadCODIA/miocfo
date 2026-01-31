

## Obiettivo
Sincronizzare automaticamente le transazioni dopo il collegamento di un nuovo conto bancario, così l'utente vedrà immediatamente le transazioni nella sezione Transazioni senza dover cliccare manualmente "Sincronizza".

## Problema Identificato

Attualmente il flusso è:
1. Utente collega il conto → viene recuperato solo il **saldo**
2. Le transazioni vengono scaricate **solo** quando l'utente clicca "Sincronizza" manualmente
3. La modale dice "Le transazioni verranno sincronizzate automaticamente" ma non è vero

**Risultato**: Il conto BCC di Cherasco è collegato con status "active" ma ha **0 transazioni** nel database.

---

## Soluzione Proposta

### Opzione A: Sincronizzazione Automatica nel Backend (Consigliata)

Dopo aver salvato i conti durante `complete_session`, chiamare automaticamente la logica di sincronizzazione transazioni per ogni conto.

**Vantaggi**:
- Tutto avviene in un'unica operazione
- L'utente vede immediatamente le transazioni
- Nessuna modifica al frontend necessaria

**File da modificare**: `supabase/functions/enable-banking/index.ts`

```typescript
// In completeSession(), dopo aver salvato gli account:

// Auto-sync transactions for each newly connected account
console.log("[Enable Banking] Auto-syncing transactions for new accounts...");

for (const savedAccount of savedAccounts) {
  try {
    // Get the account UID from the database (plaid_account_id stores the Enable Banking uid)
    const accountUid = savedAccount.plaid_account_id;
    
    // Fetch transactions for the last 90 days (safe default)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    console.log(`[Enable Banking] Auto-syncing transactions for ${accountUid} from ${startDate} to ${endDate}`);
    
    // Call transaction fetch logic (reuse existing syncAccountTransactions function)
    const result = await syncAccountTransactions(
      savedAccount.id, // DB account ID
      accountUid,      // Enable Banking account UID
      startDate,
      endDate,
      userId
    );
    
    console.log(`[Enable Banking] Auto-synced ${result.transactions_synced} transactions for ${savedAccount.bank_name}`);
  } catch (syncError) {
    // Log but don't fail the whole operation - account is still connected
    console.error(`[Enable Banking] Auto-sync failed for ${savedAccount.bank_name}:`, syncError);
  }
}
```

### Opzione B: Sincronizzazione Automatica nel Frontend

Dopo che `completeSession` ritorna con i conti collegati, chiamare `syncAccount` per ogni conto.

**File da modificare**: `src/components/conti-bancari/ConnectBankModal.tsx`

```typescript
// In useEffect callback after completeSession succeeds:
const accounts = await completeSession(authCode);
setConnectedAccounts(accounts);

// Auto-sync transactions for each account
for (const account of accounts) {
  try {
    await syncAccount(account.id);
  } catch (error) {
    console.error("Auto-sync failed for", account.bank_name, error);
    // Continue with other accounts
  }
}

setStep("success");
```

---

## Piano di Implementazione (Opzione A - Backend)

### Fase 1: Refactoring della funzione sync_account

Estrarre la logica di sincronizzazione transazioni in una funzione riutilizzabile:

```typescript
async function syncAccountTransactions(
  dbAccountId: string,
  enableBankingUid: string,
  startDate: string,
  endDate: string,
  userId: string
): Promise<{ transactions_synced: number }> {
  // [logica esistente di sync_account per le transazioni]
  // ...
  return { transactions_synced: count };
}
```

### Fase 2: Chiamare la sincronizzazione in complete_session

Dopo aver salvato i conti nel database, iterare su ogni conto e sincronizzare le transazioni.

### Fase 3: Gestione errori resiliente

Se la sincronizzazione fallisce per un conto (es. rate limit), non bloccare l'intero processo. Il conto rimane collegato e l'utente può sincronizzare manualmente dopo.

---

## File da Modificare

| File | Modifica |
|------|----------|
| `supabase/functions/enable-banking/index.ts` | Aggiungere auto-sync in `completeSession()` |

---

## Risultato Atteso

Dopo questa modifica:
1. Utente collega un conto → il conto viene salvato
2. **Le transazioni degli ultimi 90 giorni vengono scaricate automaticamente**
3. L'utente vede immediatamente le transazioni nella sezione Transazioni
4. Se la sincronizzazione fallisce, il conto è comunque collegato e l'utente può sincronizzare manualmente

---

## Nota Importante

Per il conto BCC di Cherasco già collegato, dovrai comunque cliccare "Sincronizza" manualmente una volta per importare le transazioni storiche. La sincronizzazione automatica si applicherà ai **nuovi** conti collegati.

