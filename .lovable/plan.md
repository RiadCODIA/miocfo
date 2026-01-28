
## Piano: Correggere il Check Constraint sulla Tabella bank_accounts

### Problema Identificato

Il conto bancario viene effettivamente recuperato da Enable Banking (i log mostrano "Processing 1 accounts"), ma l'inserimento nel database fallisce con:

```
'new row for relation "bank_accounts" violates check constraint "bank_accounts_source_check"'
```

Il check constraint attuale permette solo questi valori per la colonna `source`:
- `'plaid'`
- `'manual'`

Ma la Edge Function sta cercando di inserire `'enable_banking'`, che viene rifiutato.

### Soluzione

Dobbiamo aggiornare il check constraint per includere `'enable_banking'` come valore valido.

#### Migrazione SQL da Eseguire

Creare una nuova migrazione che:
1. Rimuove il vecchio check constraint
2. Aggiunge un nuovo check constraint con tutti e tre i valori permessi

```sql
-- Rimuovi il vecchio constraint
ALTER TABLE bank_accounts DROP CONSTRAINT bank_accounts_source_check;

-- Aggiungi il nuovo constraint con enable_banking incluso
ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_source_check 
  CHECK (source = ANY (ARRAY['plaid'::text, 'manual'::text, 'enable_banking'::text]));
```

### File da Creare

| File | Descrizione |
|------|-------------|
| `supabase/migrations/[timestamp]_add_enable_banking_source.sql` | Migrazione per aggiornare il check constraint |

### Risultato Atteso

1. La migrazione aggiorna il check constraint
2. La Edge Function può inserire conti con `source: 'enable_banking'`
3. Il modal mostrerà "1 conto collegato" invece di "0 conti collegati"
4. I conti appariranno nella lista della pagina Conti Bancari
