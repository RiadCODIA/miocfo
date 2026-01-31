
## Obiettivo
Recuperare le transazioni storiche tramite l'API Enable Banking e salvare tutti i dati disponibili nel database per visualizzarli nella sezione Transazioni.

## Problema identificato

### 1. Sincronizzazione mai eseguita
I log mostrano che l'action `sync_account` non è mai stata chiamata - sono stati eseguiti solo `get_accounts`. Per vedere le transazioni devi cliccare il pulsante **"Sincronizza"** sulla card del conto bancario.

### 2. Limite attuale di 90 giorni
Il codice attuale richiede solo le transazioni degli ultimi 90 giorni. Possiamo estendere questo periodo.

### 3. Dati non catturati
L'API Enable Banking restituisce molti campi che attualmente non stiamo salvando.

---

## Dati disponibili dall'API Enable Banking (Transaction schema)

| Campo API | Descrizione | Attualmente salvato? |
|-----------|-------------|---------------------|
| `transaction_id` | ID univoco transazione | Si (come plaid_transaction_id) |
| `transaction_amount.amount` | Importo | Si |
| `transaction_amount.currency` | Valuta (EUR, USD, etc.) | Si |
| `booking_date` | Data di contabilizzazione | Si (come date) |
| `value_date` | Data valuta | No |
| `transaction_date` | Data effettiva transazione | No |
| `remittance_information[]` | Causale/descrizione | Si (come name) |
| `creditor.name` | Nome beneficiario | Parziale (come merchant_name) |
| `debtor.name` | Nome ordinante | Parziale |
| `creditor_account.iban` | IBAN beneficiario | No |
| `debtor_account.iban` | IBAN ordinante | No |
| `credit_debit_indicator` | CRDT/DBIT (entrata/uscita) | No |
| `status` | BOOK/PDNG (contabilizzata/pending) | Parziale |
| `merchant_category_code` | Codice categoria esercente (MCC) | No |
| `bank_transaction_code.description` | Tipo operazione banca | No |
| `bank_transaction_code.code` | Codice operazione | No |
| `reference_number` | Numero riferimento | No |
| `balance_after_transaction` | Saldo dopo operazione | No |
| `entry_reference` | Riferimento movimento | No |
| `exchange_rate` | Tasso di cambio (per valute estere) | No |
| `note` | Note aggiuntive | No |

---

## Piano di implementazione

### Fase 1: Estensione schema database `bank_transactions`
Aggiungere nuove colonne per catturare tutti i dati:

```sql
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS value_date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS transaction_date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS credit_debit_indicator text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS creditor_name text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS creditor_iban text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS debtor_name text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS debtor_iban text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS mcc_code text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_tx_code text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_tx_description text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reference_number text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS balance_after numeric;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS entry_reference text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS raw_data jsonb;
```

### Fase 2: Aggiornare Edge Function `enable-banking`

**File:** `supabase/functions/enable-banking/index.ts`

1. **Estendere il periodo di recupero** da 90 giorni a 365 giorni (o più)
2. **Aggiornare il TypeScript type** per il transaction response
3. **Mappare tutti i campi** dalla risposta API
4. **Gestire la paginazione** (`continuation_key`) per recuperare tutte le transazioni
5. **Salvare i dati raw** in campo jsonb per debugging futuro

### Fase 3: Aggiornare Frontend

**File:** `src/hooks/useTransactions.ts`
- Aggiungere i nuovi campi al type `Transaction`

**File:** `src/pages/Transazioni.tsx`
- Mostrare informazioni aggiuntive (creditore/debitore, tipo operazione, etc.)

---

## Dettaglio tecnico implementazione

### Edge Function - Nuova logica transazioni

```typescript
// Tipo completo per transazione Enable Banking
interface EnableBankingTransaction {
  transaction_id: string;
  entry_reference?: string;
  merchant_category_code?: string;
  transaction_amount: { amount: string | number; currency: string };
  creditor?: { name: string };
  creditor_account?: { iban?: string };
  debtor?: { name: string };
  debtor_account?: { iban?: string };
  bank_transaction_code?: { description?: string; code?: string };
  credit_debit_indicator?: "CRDT" | "DBIT";
  status?: "BOOK" | "PDNG";
  booking_date: string;
  value_date?: string;
  transaction_date?: string;
  balance_after_transaction?: { amount: string | number; currency: string };
  reference_number?: string;
  remittance_information?: string[];
  note?: string;
}

// Recupero con paginazione (fino a 365 giorni)
const endDate = new Date().toISOString().split("T")[0];
const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

let allTransactions: EnableBankingTransaction[] = [];
let continuationKey: string | undefined;

do {
  const url = `/accounts/${accountUid}/transactions?date_from=${startDate}&date_to=${endDate}` +
    (continuationKey ? `&continuation_key=${continuationKey}` : "");
  
  const response = await enableBankingRequest(url);
  
  if (response.transactions) {
    allTransactions.push(...response.transactions);
  }
  
  continuationKey = response.continuation_key;
} while (continuationKey);

// Mappatura completa
for (const tx of allTransactions) {
  const transactionData = {
    bank_account_id: accountId,
    plaid_transaction_id: tx.transaction_id,
    amount: toNumber(tx.transaction_amount?.amount),
    currency: tx.transaction_amount?.currency || "EUR",
    date: tx.booking_date,
    value_date: tx.value_date || null,
    transaction_date: tx.transaction_date || null,
    name: tx.remittance_information?.join(" ") || tx.creditor?.name || tx.debtor?.name || "Transazione",
    merchant_name: tx.creditor?.name || tx.debtor?.name || null,
    creditor_name: tx.creditor?.name || null,
    creditor_iban: tx.creditor_account?.iban || null,
    debtor_name: tx.debtor?.name || null,
    debtor_iban: tx.debtor_account?.iban || null,
    credit_debit_indicator: tx.credit_debit_indicator || null,
    pending: tx.status === "PDNG",
    mcc_code: tx.merchant_category_code || null,
    bank_tx_code: tx.bank_transaction_code?.code || null,
    bank_tx_description: tx.bank_transaction_code?.description || null,
    reference_number: tx.reference_number || null,
    balance_after: tx.balance_after_transaction ? toNumber(tx.balance_after_transaction.amount) : null,
    entry_reference: tx.entry_reference || null,
    raw_data: tx, // Salva tutto per debugging
  };
  
  await supabase.from("bank_transactions").upsert(transactionData, { 
    onConflict: "plaid_transaction_id" 
  });
}
```

---

## Azione immediata richiesta

Prima di implementare queste modifiche, **prova a cliccare "Sincronizza"** su uno dei conti FinecoBank per verificare che le transazioni vengano recuperate con il codice attuale. Se funziona, le transazioni appariranno nella sezione Transazioni.

Se non appare nulla dopo la sincronizzazione, procederemo con l'implementazione completa.

---

## File da modificare

1. **Migrazione SQL** - Nuove colonne `bank_transactions`
2. **`supabase/functions/enable-banking/index.ts`** - Logica transazioni estesa
3. **`src/integrations/supabase/types.ts`** - Rigenerato automaticamente
4. **`src/hooks/useTransactions.ts`** - Nuovi campi nel tipo Transaction
5. **`src/pages/Transazioni.tsx`** - Visualizzazione dati aggiuntivi (opzionale)

---

## Riepilogo dati estraibili

Dall'API Enable Banking possiamo estrarre per ogni transazione:
- Data contabilizzazione, data valuta, data transazione
- Importo e valuta
- Nome e IBAN creditore/debitore
- Indicatore credito/debito (entrata/uscita)
- Causale completa
- Codice categoria esercente (MCC)
- Codice e descrizione tipo operazione bancaria
- Numero riferimento
- Saldo dopo operazione
- Stato (contabilizzata/in attesa)

Questi dati permetteranno analisi dettagliate delle spese, categorizzazione automatica migliorata e reportistica avanzata.
