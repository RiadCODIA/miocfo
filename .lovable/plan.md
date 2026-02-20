
# Configurazione — Fix: Categorie Costi + Dipendenti nel Conto Economico

## Problemi identificati

### 1. Categorie Costi — impossibile aggiungere (blocco RLS)

La tabella `cost_categories` **non ha una colonna `user_id`** ed è condivisa tra tutti gli utenti del sistema. Le sue policy RLS permettono la scrittura (INSERT/UPDATE/DELETE) solo ai ruoli `super_admin` e `admin_aziendale`. L'utente corrente ha ruolo `user`, quindi ogni tentativo di aggiungere una categoria viene silenziosamente bloccato dal database — il form si chiude senza salvare nulla.

Stessa situazione per `revenue_centers` e `vat_rates`: sono tabelle globali senza separazione per utente.

### 2. Dipendenti — non collegati al Conto Economico

Il dipendente "Fab" (€50.000/anno) è presente nel database, ma non appare nel Conto Economico perché:

- La colonna `monthly_cost` nella tabella `employees` è `NULL` — il database non calcola automaticamente il costo mensile dall'annuale.
- La sezione "Costi Personale" del Conto Economico legge esclusivamente da **localStorage** del browser, non dalla tabella `employees`. I due sistemi non si parlano.

Il risultato pratico: registrare un dipendente in Configurazione non ha alcun effetto sul Conto Economico.

---

## Soluzione in 3 parti

### A. Fix Cost Categories, Revenue Centers, VAT Rates — aggiungere `user_id`

Aggiungere una colonna `user_id uuid` (nullable) a `cost_categories`, `revenue_centers` e `vat_rates`:
- I record esistenti (categorie di sistema) mantengono `user_id = NULL`
- I nuovi record creati dall'utente salvano `user_id = auth.uid()`

Aggiornare le RLS policy per permettere agli utenti autenticati di:
- **SELECT**: tutti possono leggere (invariato)
- **INSERT**: ogni utente autenticato può aggiungere le proprie categorie (con `user_id = auth.uid()`)
- **UPDATE/DELETE**: ogni utente può modificare solo le proprie categorie (`user_id = auth.uid()`)

Le categorie di sistema (`user_id IS NULL`) restano visibili ma non modificabili dagli utenti normali.

**Migrazione SQL:**
```sql
ALTER TABLE cost_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE revenue_centers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE vat_rates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Nuove RLS per cost_categories
CREATE POLICY "Users can insert own cost_categories"
  ON cost_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost_categories"
  ON cost_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost_categories"
  ON cost_categories FOR DELETE
  USING (auth.uid() = user_id);
-- (stessa logica per revenue_centers e vat_rates)
```

**Aggiornamento UI (`CostCategoriesManager.tsx`):**
- Il `createMutation` deve passare `user_id: user.id` nell'INSERT (come già fa `EmployeesManager`)
- Le categorie di sistema (senza `user_id`) mostrano un badge "Sistema" e non hanno i pulsanti Modifica/Elimina

### B. Fix `monthly_cost` — calcolo automatico nel database

Aggiungere un trigger Postgres che calcola automaticamente `monthly_cost = annual_cost / 12` ad ogni INSERT o UPDATE sulla tabella `employees`:

```sql
CREATE OR REPLACE FUNCTION sync_employee_monthly_cost()
RETURNS trigger AS $$
BEGIN
  NEW.monthly_cost := NEW.annual_cost / 12.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_employee_monthly_cost
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION sync_employee_monthly_cost();

-- Aggiorna i record esistenti
UPDATE employees SET monthly_cost = annual_cost / 12.0 WHERE monthly_cost IS NULL;
```

### C. Collegare Dipendenti al Conto Economico

Modificare `ContoEconomicoTab.tsx` per leggere i dipendenti attivi dal database e pre-popolare le righe del personale:

- Aggiungere una query `useQuery` per caricare `employees` attivi (come fa `EmployeesManager`)
- Calcolare il `totalMonthlyCost` degli attivi e distribuirlo uniformemente sui 12 mesi come valore di default per la riga "Salari e stipendi"
- **Mantenere la possibilità di editing manuale** per ogni mese: se l'utente modifica un campo, il valore personalizzato sovrascrive quello del DB (il comportamento con localStorage rimane per le correzioni mese per mese)
- Aggiungere una nota informativa nella sezione Personale che indica: "Pre-popolato dai dipendenti in Configurazione — modifica singolo mese se necessario"

**Logica:**
```typescript
// In ContoEconomicoTab.tsx
const { data: employeesData } = useQuery({
  queryKey: ["employees"],
  queryFn: async () => {
    const { data } = await supabase
      .from("employees")
      .select("monthly_cost, is_active")
      .eq("is_active", true);
    return data;
  },
});

const defaultMonthlySalary = employeesData?.reduce(
  (sum, e) => sum + (e.monthly_cost || 0), 0
) ?? 0;

// Usato come fallback se l'utente non ha ancora digitato nulla per quel mese
const getPersonnelValue = (field: "salari", month: number) => {
  const saved = personnel[field][month];
  if (saved !== undefined) return saved;
  return field === "salari" ? defaultMonthlySalary : 0;
};
```

---

## File modificati

1. **Migrazione DB** — aggiunta `user_id` a `cost_categories`, `revenue_centers`, `vat_rates` + nuove RLS + trigger `monthly_cost`
2. **`src/components/configurazione/CostCategoriesManager.tsx`** — aggiunge `user_id` all'INSERT, nasconde Modifica/Elimina per le categorie di sistema
3. **`src/components/configurazione/RevenueCentersManager.tsx`** — stessa fix di `user_id` nell'INSERT
4. **`src/components/configurazione/VatRatesManager.tsx`** — stessa fix di `user_id` nell'INSERT
5. **`src/components/area-economica/ContoEconomicoTab.tsx`** — legge dipendenti dal DB e pre-popola la riga Salari

---

## Comportamento finale

- L'utente clicca "Nuova Categoria" in Categorie Costi → il record si salva, appare nella lista e diventa disponibile nel dropdown delle Fatture
- Le categorie di sistema predefinite restano visibili ma non eliminabili
- Il dipendente "Fab" (€50.000/anno → €4.167/mese) appare automaticamente pre-popolato nella riga "Salari e stipendi" del Conto Economico per ogni mese, senza bisogno di reinserire i dati
