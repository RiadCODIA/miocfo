

## Piano: Categorizzazione Automatica Transazioni

### Problema Identificato

1. **Pulsante manuale visibile**: L'utente vuole che la categorizzazione sia automatica e in background
2. **Limite di 20 transazioni**: La edge function ha `.limit(20)` in batch mode (riga 69) - quindi solo 20 vengono processate per chiamata
3. **Nessun loop**: Non c'è logica che continua a categorizzare finché tutte le transazioni non sono processate

### Soluzione Proposta

#### A. Rimuovere il pulsante "Categorizza tutto"
Eliminare il bottone dalla UI di Transazioni.tsx

#### B. Modificare la Edge Function per processare tutte le transazioni
Invece del limite di 20, implementare un sistema che:
- Rimuove il `.limit(20)` 
- Oppure processa in batch da 50-100 transazioni alla volta per evitare timeout

#### C. Categorizzazione automatica in background
Due opzioni:

**Opzione 1 - Alla sincronizzazione bancaria (preferita)**
Aggiungere chiamata alla categorizzazione alla fine della `syncAccount` nella edge function `enable-banking`:
```typescript
// Dopo syncAccountTransactionsWithFallback
// Chiama categorize-transactions in background
EdgeRuntime.waitUntil(triggerCategorization(supabase))
```

**Opzione 2 - Polling frontend**
Usare `useEffect` nella pagina Transazioni per avviare la categorizzazione automatica quando rileva transazioni non categorizzate

### Implementazione Tecnica

#### 1. Modificare `categorize-transactions/index.ts`

**Problema**: Limite di 20 impedisce di processare tutte le 478 transazioni

**Soluzione**: Implementare loop interno che processa a batch di 50 transazioni ciascuno fino al completamento

```typescript
// Invece di .limit(20), loop con batch di 50
let processedTotal = 0;
const batchSize = 50;

while (true) {
  const { data: transactions } = await supabase
    .from("bank_transactions")
    .select("id, name, merchant_name, amount, category")
    .is("ai_category_id", null)
    .limit(batchSize);
  
  if (!transactions || transactions.length === 0) break;
  
  // Processa batch
  // ... logica AI ...
  
  processedTotal += transactions.length;
  
  // Safety: max 500 transazioni per chiamata (per evitare timeout)
  if (processedTotal >= 500) break;
}
```

#### 2. Modificare `enable-banking/index.ts`

Dopo la sincronizzazione delle transazioni, chiamare automaticamente la categorizzazione:

```typescript
// In syncAccount(), dopo syncAccountTransactionsWithFallback
const result = await syncAccountTransactionsWithFallback(...);

// Trigger categorization in background (non blocca la risposta)
triggerBackgroundCategorization();

return result;
```

#### 3. Modificare `src/pages/Transazioni.tsx`

- Rimuovere il bottone "Categorizza tutto"
- Aggiungere indicatore "Categorizzazione in corso..." se ci sono transazioni non categorizzate
- Usare polling o realtime subscription per aggiornare la lista quando le categorie vengono assegnate

---

### Dettaglio Modifiche File

| File | Modifica |
|------|----------|
| `supabase/functions/categorize-transactions/index.ts` | Rimuovere `.limit(20)`, aggiungere loop con batch di 50 e max 500 per chiamata |
| `supabase/functions/enable-banking/index.ts` | Aggiungere chiamata background a `categorize-transactions` dopo sync |
| `src/pages/Transazioni.tsx` | Rimuovere bottone, mostrare status "in elaborazione" se serve |
| `src/hooks/useCategorizeTransactions.ts` | Aggiungere opzione per polling background |

---

### Flusso Risultante

```text
┌──────────────────────────────────────────────────────────────┐
│                    FLUSSO AUTOMATICO                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Utente collega banca]                                       │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                      │
│  │ enable-banking      │                                      │
│  │ sync_account        │                                      │
│  └──────────┬──────────┘                                      │
│             │ Sincronizza 743 transazioni                     │
│             │                                                 │
│             ▼                                                 │
│  ┌─────────────────────┐                                      │
│  │ Trigger automatico  │──┐                                   │
│  │ categorize-tx       │  │ Background (non blocca)           │
│  └─────────────────────┘  │                                   │
│             │             │                                   │
│             ▼             │                                   │
│  ┌─────────────────────┐  │                                   │
│  │ Batch 1: 50 tx      │◀─┘                                   │
│  │ AI categorizza      │                                      │
│  └──────────┬──────────┘                                      │
│             │                                                 │
│             ▼                                                 │
│  ┌─────────────────────┐                                      │
│  │ Batch 2: 50 tx      │                                      │
│  │ AI categorizza      │                                      │
│  └──────────┬──────────┘                                      │
│             │ ... ripeti fino a max 500                       │
│             ▼                                                 │
│  ┌─────────────────────┐                                      │
│  │ Transazioni         │                                      │
│  │ categorizzate!      │                                      │
│  └─────────────────────┘                                      │
│                                                               │
│  [UI] Pagina Transazioni mostra categorie automaticamente     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Considerazioni

1. **Rate limits**: Lovable AI ha rate limits - processeremo max 500 tx per chiamata con delay tra i batch
2. **Timeout**: Le Edge Functions hanno timeout di 400s - il loop con batch da 50 evita il problema
3. **Costi AI**: Ogni chiamata AI costa crediti - l'utente deve essere consapevole
4. **Error handling**: Se l'AI fallisce su un batch, continuare con il successivo

### Risultato Atteso

- Nessun bottone manuale visibile
- Transazioni categorizzate automaticamente dopo ogni sincronizzazione
- Tutte le 478+ transazioni processate (non solo 20)
- UI sempre aggiornata con le categorie

