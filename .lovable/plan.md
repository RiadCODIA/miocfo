
# Piano di Sicurezza: Isolamento dei Dati per Utente

## Problema Critico Identificato

I dati finanziari di un utente sono visibili a TUTTI gli altri utenti autenticati. Questo accade perché:

1. Molte tabelle hanno policy RLS con `USING (true)` che permettono accesso globale
2. Alcune tabelle critiche NON hanno la colonna `user_id` per filtrare i dati
3. Le transazioni bancarie non sono filtrate in base al proprietario del conto

## Analisi delle Tabelle

| Tabella | Ha user_id? | Policy Attuale | Azione Richiesta |
|---------|-------------|----------------|------------------|
| `bank_accounts` | Si (nullable) | Mista (permissiva + user) | Rimuovere policy permissiva, rendere NOT NULL |
| `bank_transactions` | No (via bank_account_id) | `USING (true)` | Filtrare via bank_accounts.user_id |
| `budgets` | No | `USING (true)` | Aggiungere user_id + RLS |
| `deadlines` | No | `USING (true)` | Aggiungere user_id + RLS |
| `alerts` | No | `USING (true)` | Aggiungere user_id + RLS |
| `invoices` | Si (NOT NULL) | Permissiva | Correggere RLS per user_id |
| `employees` | No | `USING (true)` | Aggiungere user_id + RLS |
| `categorization_rules` | Si (nullable) | `USING (true)` | Correggere RLS + NOT NULL |

## Piano di Implementazione

### Fase 1: Correzione Schema Database

Migrazioni SQL per:

1. **Aggiungere colonna `user_id`** alle tabelle mancanti:
   - `budgets`
   - `deadlines`  
   - `alerts`
   - `employees`

2. **Rendere `user_id` NOT NULL** dove attualmente nullable:
   - `bank_accounts`
   - `categorization_rules`

### Fase 2: Rimozione Policy Permissive

Rimuovere tutte le policy con `USING (true)`:
- `bank_accounts`: "Allow all access to bank_accounts"
- `bank_transactions`: "Allow all access to bank_transactions"
- `budgets`: "Allow all access to budgets"
- `deadlines`: "Allow all access to deadlines"
- `alerts`: "Allow all access to alerts"
- `invoices`: tutte le policy "Allow public..."
- `employees`: "Allow all access to employees"
- `categorization_rules`: "Allow all access..."
- `cost_categories`, `revenue_centers`, `vat_rates`: valutare se tenere condivisi o per utente

### Fase 3: Creazione Nuove Policy RLS

Per ogni tabella creare policy basate su `user_id`:

```sql
-- Esempio per budgets
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);
```

Per `bank_transactions` (filtro via join):
```sql
CREATE POLICY "Users can manage their own transactions"
  ON bank_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      WHERE bank_accounts.id = bank_transactions.bank_account_id 
        AND bank_accounts.user_id = auth.uid()
    )
  );
```

### Fase 4: Aggiornamento Codice Frontend

Aggiornare gli hooks per passare `user_id` negli insert:
- `useBudgets.ts` - aggiungere user_id in `useCreateBudget`
- `useDeadlines.ts` - aggiungere user_id in `useCreateDeadline`
- `useAlerts.ts` - aggiungere user_id se necessario

### Fase 5: Migrazione Dati Esistenti

Prima di applicare i vincoli NOT NULL, assegnare i dati orfani:
```sql
-- Assegnare dati esistenti all'utente admin (o eliminarli)
UPDATE budgets SET user_id = 'UUID_ADMIN' WHERE user_id IS NULL;
UPDATE deadlines SET user_id = 'UUID_ADMIN' WHERE user_id IS NULL;
-- etc.
```

## Dettagli Tecnici

### Migrazione Completa SQL

```sql
-- 1. Aggiungere colonne user_id mancanti
ALTER TABLE budgets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE deadlines ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE alerts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Rimuovere policy permissive esistenti
DROP POLICY IF EXISTS "Allow all access to bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Allow all access to bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Allow all access to budgets" ON budgets;
DROP POLICY IF EXISTS "Allow all access to deadlines" ON deadlines;
DROP POLICY IF EXISTS "Allow all access to alerts" ON alerts;
DROP POLICY IF EXISTS "Allow all access to employees" ON employees;
DROP POLICY IF EXISTS "Allow all access to categorization_rules" ON categorization_rules;
DROP POLICY IF EXISTS "Allow public delete invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public view invoices" ON invoices;

-- 3. Creare nuove policy per user isolation
-- (policy dettagliate per ogni tabella)
```

### File da Modificare

1. **src/hooks/useBudgets.ts**: Aggiungere `user_id` in insert
2. **src/hooks/useDeadlines.ts**: Aggiungere `user_id` in insert  
3. **src/hooks/useAlerts.ts**: Aggiungere `user_id` in insert
4. **src/components/configurazione/EmployeesManager.tsx**: Aggiungere `user_id`
5. **Edge functions**: Assicurarsi che passino `user_id` correttamente

## Rischi e Mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Dati esistenti persi | Backup prima della migrazione, assegnazione a utente admin |
| Blocco accesso | Testare policy in ambiente di sviluppo prima |
| Breaking changes | Deploy graduale, monitoraggio errori |

## Priorita'

1. **CRITICO**: `bank_accounts`, `bank_transactions` - dati bancari sensibili
2. **ALTO**: `invoices`, `budgets`, `deadlines` - dati finanziari
3. **MEDIO**: `alerts`, `employees`, `categorization_rules` - dati operativi
4. **BASSO**: `cost_categories`, `revenue_centers`, `vat_rates` - configurazione (potrebbero rimanere condivisi)
