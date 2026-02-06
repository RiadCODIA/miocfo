

# Piano: Configurazione Database e Account Demo

## Panoramica

Il progetto e' stato remixato e il database Supabase e' vuoto. Il file `types.ts` autogenerato non contiene definizioni di tabelle, causando tutti gli errori TypeScript. Dobbiamo:

1. **Ricreare lo schema del database** eseguendo le migrazioni esistenti
2. **Creare account demo reali** in Supabase Auth
3. **Aggiornare il frontend** per usare login reali invece di dati mock locali

---

## Fase 1: Creazione Schema Database

Eseguire una migrazione SQL che crea tutte le tabelle necessarie in un'unica transazione. Le migrazioni esistenti nella cartella `supabase/migrations/` definiscono:

### Enumerazioni
- `app_role`: 'user', 'admin_aziendale', 'super_admin'
- `cashflow_type`: 'operational', 'investment', 'financing'
- `cost_type`: 'fixed', 'variable'

### Tabelle Core
| Tabella | Descrizione |
|---------|-------------|
| `profiles` | Profili utente (collegati ad auth.users) |
| `user_roles` | Ruoli utente separati per sicurezza |
| `bank_accounts` | Conti bancari collegati |
| `bank_transactions` | Transazioni bancarie |
| `invoices` | Fatture caricate |
| `budgets` | Budget previsionali |
| `deadlines` | Scadenze pagamenti/incassi |
| `alerts` | Notifiche sistema |
| `employees` | Dipendenti azienda |
| `cost_categories` | Categorie di costo |
| `revenue_centers` | Centri di ricavo |
| `vat_rates` | Aliquote IVA |
| `categorization_rules` | Regole categorizzazione AI |
| `notification_preferences` | Preferenze notifiche |

### Tabelle Consulente/Admin
| Tabella | Descrizione |
|---------|-------------|
| `companies` | Aziende clienti |
| `admin_clients` | Relazione consulente-clienti |
| `company_financials` | Dati finanziari aziende |

### Tabelle Super Admin
| Tabella | Descrizione |
|---------|-------------|
| `subscription_plans` | Piani abbonamento |
| `integration_providers` | Provider integrazioni |
| `sync_jobs` | Job sincronizzazione |
| `application_logs` | Log applicazione |
| `audit_trail` | Traccia audit |
| `system_metrics` | Metriche sistema |
| `feature_flags` | Feature flags |
| `gdpr_requests` | Richieste GDPR |
| `ip_allowlist` | Allowlist IP |
| `security_policies` | Policy sicurezza |

### Funzioni e Trigger
- `update_updated_at_column()`: Aggiornamento automatico timestamp
- `handle_new_user()`: Creazione profilo e ruolo su signup
- `has_role()`: Verifica ruoli (SECURITY DEFINER)
- `get_users_with_email()`: Lista utenti per super admin
- `validate_rollout_percentage()`: Validazione feature flags

### RLS Policies
Tutte le tabelle avranno Row Level Security abilitato con policy appropriate per isolamento dati utente.

---

## Fase 2: Creazione Account Demo

Creare 3 account demo reali nel database Supabase:

```text
+---------------------------+---------------------------+
| Account                   | Credenziali               |
+---------------------------+---------------------------+
| Utente Demo               | demo.user@finexa.it       |
|                           | DemoUser2024!             |
+---------------------------+---------------------------+
| Consulente Demo           | demo.admin@finexa.it      |
|                           | DemoAdmin2024!            |
+---------------------------+---------------------------+
| Super Admin Demo          | demo.superadmin@finexa.it |
|                           | DemoSuper2024!            |
+---------------------------+---------------------------+
```

Questi account saranno creati tramite:
1. Inserimento in `auth.users` via RPC o signup API
2. Creazione profili corrispondenti in `profiles`
3. Assegnazione ruoli in `user_roles`

---

## Fase 3: Aggiornamento Frontend

### File: `src/pages/Auth.tsx`

Modificare le funzioni demo per effettuare login reali:

```typescript
// Prima (mock locale)
const handleDemoLogin = () => {
  signInAsDemo(); // Imposta stato locale fake
  navigate("/", { replace: true });
};

// Dopo (login reale)
const handleDemoLogin = async () => {
  setIsSubmitting(true);
  const { error } = await signIn("demo.user@finexa.it", "DemoUser2024!");
  setIsSubmitting(false);
  if (error) {
    toast({
      title: "Errore Demo",
      description: "Account demo non disponibile",
      variant: "destructive",
    });
  }
};
```

### File: `src/contexts/AuthContext.tsx`

Rimuovere le funzioni mock:
- `signInAsDemo()` - sostituire con login reale
- `signInAsDemoAdmin()` - sostituire con login reale
- `signInAsDemoSuperAdmin()` - sostituire con login reale

Rimuovere stati mock:
- `isDemoMode` state puo' rimanere ma derivato da email demo
- `demoRole` non piu' necessario - usare `userRole` reale

---

## Fase 4: Pulizia Dati Mock

I componenti seguenti gia' usano dati reali da Supabase:
- Dashboard: `useDashboardKPIs()` - OK
- Transazioni: `useTransactions()` - OK
- Conti: `useBankAccounts()` - OK

Verificare e aggiornare se necessario:
- `src/hooks/useAlerts.ts`
- `src/hooks/useBudgets.ts`
- `src/hooks/useDeadlines.ts`
- `src/hooks/useCashFlowData.ts`

---

## Dettagli Tecnici

### Migrazione SQL Unificata

La migrazione combina tutti gli script esistenti in ordine:
1. Enums e funzioni base
2. Tabelle di configurazione (vat_rates, cost_categories, revenue_centers)
3. Tabelle core (profiles, user_roles, bank_accounts, bank_transactions)
4. Tabelle business (invoices, budgets, deadlines, alerts, employees)
5. Tabelle admin (companies, admin_clients, company_financials)
6. Tabelle super admin (subscription_plans, integration_providers, logs, etc.)
7. RLS policies per tutte le tabelle
8. Storage buckets (invoices, bank-statements)
9. Dati iniziali (aliquote IVA, categorie costo, piani abbonamento)

### Creazione Account Demo via SQL

```sql
-- Gli account verranno creati con una funzione RPC 
-- che usa supabase_admin per inserire in auth.users
```

Alternativa: Usare Supabase Dashboard per creare manualmente i 3 account, poi assegnare ruoli via SQL.

---

## Ordine di Esecuzione

1. Eseguire migrazione schema database
2. Verificare che types.ts venga rigenerato automaticamente
3. Creare account demo (manualmente o via script)
4. Assegnare ruoli agli account demo
5. Aggiornare Auth.tsx per login demo reali
6. Pulire AuthContext.tsx rimuovendo mock
7. Testare tutti e 3 i flussi demo

---

## Risultato Atteso

- Build senza errori TypeScript
- Pulsanti "Utente Demo", "Admin Demo", "Super Demo" funzionanti
- Login reale con sessione Supabase persistente
- Dati demo (transazioni, conti) visibili dopo login
- RLS attivo per isolamento dati tra utenti

