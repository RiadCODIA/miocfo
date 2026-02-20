
# Fatture — Fix completo: Tipo, Categorizzazione inline e Conto Economico

## Problemi identificati (con evidenza dal database)

### 1. Fatture invisibili nel Conto Economico — causa root confermata
Il problema principale: le fatture nel database hanno `invoice_type = 'passive'` (vecchio valore), ma `useContoEconomico.ts` filtra per `invoice_type = 'ricevuta'`. Risultato: **nessuna fattura appare mai nel Conto Economico**.

La stessa incongruenza esiste per le emesse: il codice cerca `invoice_type = 'emessa'`, ma il valore reale potrebbe essere `'active'` o `'income'`.

Il `process-invoice` edge function salva i valori `'emessa'` / `'ricevuta'` correttamente — il problema sono i record esistenti migrati con i valori vecchi.

### 2. Come viene determinato il tipo di fattura (emessa/ricevuta/autofattura)
L'AI analizza il PDF e:
- Identifica chi emette (mittente, in alto) e chi riceve (destinatario, dopo "Spett.le")
- Confronta il nome del mittente con il `company_name` del profilo utente per capire la direzione
- Se trova "FATTURA DI VENDITA" → `emessa`; default → `ricevuta`
- Le **autofatture** (reverse charge, acquisti UE) al momento non sono gestite come tipo separato

L'utente però **non può correggere manualmente** il tipo direttamente dalla tabella se l'AI sbaglia.

### 3. Categorizzazione inline assente
Attualmente la categoria si può assegnare solo dentro il modal di abbinamento (che richiede anche una transazione bancaria). Se l'utente vuole solo categorizzare una fattura senza abbinarla, non ha modo di farlo.

Il modal di abbinamento usa anche liste hardcoded di nomi (`REVENUE_CATEGORIES`, `COST_CATEGORIES`) invece degli ID reali delle categorie — quindi l'associazione al Conto Economico fallisce silenziosamente.

---

## Soluzione in 4 parti

### A. Migrazione DB — normalizzare invoice_type
Aggiornare tutti i record esistenti con i vecchi valori:
```sql
UPDATE invoices SET invoice_type = 'ricevuta' WHERE invoice_type IN ('passive', 'expense');
UPDATE invoices SET invoice_type = 'emessa' WHERE invoice_type IN ('active', 'income');
```
Anche il `transformInvoice` in `Fatture.tsx` va corretto: attualmente mappa `'income' → 'income'`, ignorando i valori `'emessa'`/`'ricevuta'`.

### B. Colonna "Tipo" nella tabella fatture con badge visivo
Aggiungere nella `InvoiceTable` una colonna **Tipo** che mostra:
- Badge verde "Emessa" (fattura di vendita)
- Badge blue "Ricevuta" (fattura di acquisto)
- Badge orange "Autofattura" (per future estensioni)

L'utente può vedere a colpo d'occhio il tipo e modificarlo cliccando sul badge.

### C. Categorizzazione inline senza abbinamento obbligatorio
Nella tabella fatture, aggiungere un **dropdown categoria** direttamente nella riga, visibile per tutte le fatture (non solo quelle abbinate). Le opzioni si caricano dalla tabella `cost_categories` reale.

Questo permette di categorizzare una fattura in modo indipendente dall'abbinamento bancario — essenziale per far comparire le fatture nel Conto Economico.

Il modal di abbinamento va corretto per usare gli ID reali di `cost_categories` invece delle liste hardcoded.

### D. Possibilità di modificare il tipo manualmente
Aggiungere un piccolo controllo (select o toggle) inline nella tabella per correggere il tipo se l'AI ha classificato male.

---

## Dettaglio tecnico

### File modificati

1. **`src/hooks/useContoEconomico.ts`**
   - Allargare il filtro: `.in("invoice_type", ["ricevuta", "passive", "expense"])` per i costi e `.in("invoice_type", ["emessa", "active", "income"])` per i ricavi (tolleranza ai vecchi valori)

2. **`src/pages/Fatture.tsx`**
   - Correggere `transformInvoice`: mappare `'emessa'` → mostrare come "emessa", `'ricevuta'`/`'passive'` → mostrare come "expense"
   - Aggiungere `category_id` e `invoice_type` all'interfaccia `DbInvoice`
   - Aggiungere handler `handleCategoryChange(invoiceId, categoryId)` che fa UPDATE su Supabase
   - Aggiungere handler `handleTypeChange(invoiceId, type)` per correzioni manuali

3. **`src/components/fatture/InvoiceTable.tsx`**
   - Aggiungere la colonna **Tipo** con badge colorati (`Emessa` / `Ricevuta` / `Autofattura`)
   - Aggiungere colonna/dropdown **Categoria** inline con select che carica da `cost_categories`
   - Il select sarà cliccabile direttamente nella riga senza aprire modal
   - Passare `categories` come prop, e `onCategoryChange` / `onTypeChange` callback

4. **`src/components/fatture/InvoiceMatchingModal.tsx`**
   - Sostituire le liste hardcoded `REVENUE_CATEGORIES` / `COST_CATEGORIES` con dati reali da `cost_categories`
   - Il `onMatch` salverà direttamente l'UUID della categoria, non il nome

5. **Migrazione dati (SQL via tool)**
   - `UPDATE invoices SET invoice_type = 'ricevuta' WHERE invoice_type IN ('passive', 'expense')`
   - `UPDATE invoices SET invoice_type = 'emessa' WHERE invoice_type IN ('active', 'income')`

---

## Flusso risultante (dopo fix)

```text
Fattura caricata (PDF) 
       ↓
AI estrae dati → invoice_type = 'emessa' o 'ricevuta'
       ↓
Tabella Fatture mostra:
  [Data] [Numero] [Fornitore] [Importo] [Tipo badge] [Categoria ▾] [Stato] [Azioni]
       ↓
Utente può:
  • Cambiare tipo manualmente (badge cliccabile)
  • Assegnare categoria inline (dropdown diretto nella riga)
  • Abbinare a transazione bancaria (opzionale)
       ↓
Conto Economico legge le fatture con invoice_type corretto
  → Ricevute con categoria variabile → Costi Variabili
  → Ricevute con categoria fissa    → Costi Fissi
  → Ricevute senza categoria        → Non categorizzato (warning)
  → Emesse                          → Ricavi
```
