
## Piano: Collegamento Super Admin a Dati Reali

### Analisi Situazione Attuale

#### Cosa funziona gia con dati reali (hook collegati a Supabase)
- `useGlobalUsers` - Legge da `profiles` + `user_roles` 
- `useCompanies` - Legge da `companies`
- `useSubscriptionPlans` - Legge da `subscription_plans`
- `useIntegrationProviders` - Legge da `integration_providers`
- `useSystemLogs` - Legge da `application_logs` + `audit_trail`
- `useSecurityCompliance` - Legge da `gdpr_requests`, `ip_allowlist`, `security_policies`
- `useFeatureFlags` - Legge da `feature_flags`
- `useSystemMetrics` - Legge da `system_metrics`

#### Problemi Identificati

| Problema | Pagina | Causa |
|----------|--------|-------|
| Mock data hardcodati | `Aziende.tsx` | Array `companies` hardcodato (righe 68-160) invece di usare `useCompanies()` |
| Tabella companies vuota | DB | 0 aziende nel database reale |
| Nessun collegamento user-company | DB | Il campo `user_id` in `companies` non e popolato |
| KPI non calcolati | Dashboard | I valori (transazioni, conti, sync) sono mock |
| Metriche sistema vuote | `system_metrics` | Nessun dato reale di telemetria |

### Modifiche Necessarie

#### 1. Rimuovere Mock Data da Aziende.tsx

**File**: `src/pages/Aziende.tsx`

Sostituire l'array mock con l'hook esistente e aggiungere metriche calcolate:

```typescript
// RIMUOVERE righe 68-160 (array companies mock)

// AGGIUNGERE
import { useCompanies } from "@/hooks/useCompanies";

// Nel componente
const { data: companies, isLoading } = useCompanies();
```

#### 2. Aggiornare useCompanies per includere metriche derivate

**File**: `src/hooks/useCompanies.ts`

Aggiungere un hook per calcolare KPI reali per ogni azienda:

```typescript
export function useCompanyWithMetrics(companyId: string) {
  return useQuery({
    queryKey: ["company-metrics", companyId],
    queryFn: async () => {
      // Conta utenti collegati
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      // Conta conti bancari
      const { count: bankAccountsCount } = await supabase
        .from("bank_accounts")
        .select("*", { count: "exact", head: true })
        // Collegamento tramite user_id dell'azienda
        .in("user_id", [/* users della company */]);

      // Conta transazioni ultimi 30 giorni
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: transactionsCount } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true })
        .gte("date", thirtyDaysAgo.toISOString());

      return {
        users: usersCount || 0,
        bankAccounts: bankAccountsCount || 0,
        transactions30d: transactionsCount || 0,
        syncFailed7d: 0, // Da sync_jobs
      };
    },
  });
}
```

#### 3. Creare company per l'utente esistente

**Migrazione SQL** per creare la company dell'utente attivo:

```sql
-- Crea company per l'utente esistente
INSERT INTO companies (
  name, 
  email, 
  status, 
  user_id,
  vat_number,
  created_at
)
SELECT 
  COALESCE(p.company_name, p.first_name || ' ' || p.last_name || ' Company'),
  u.email,
  'active',
  p.id,
  NULL,
  NOW()
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = '7c09c8f0-1dfa-4951-86cd-2920509bbfa5';
```

#### 4. Collegare bank_accounts a company tramite user_id

Il campo `user_id` in `bank_accounts` gia esiste e contiene l'ID utente. Basta usare la relazione `user -> company` per aggregare i dati.

#### 5. Aggiornare useGlobalUsers per includere email

**File**: `src/hooks/useGlobalUsers.ts`

Il campo email e vuoto perche non viene estratto da `auth.users`. Per motivi di sicurezza, creare un hook che usa RPC:

```sql
-- Funzione per ottenere utenti con email (solo super_admin)
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica che il chiamante sia super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u;
END;
$$ LANGUAGE plpgsql;
```

#### 6. Popolare subscription_plans con piani di default

```sql
INSERT INTO subscription_plans (
  name, price, billing_cycle, status, 
  max_users, max_bank_accounts, max_transactions_month,
  ai_features_enabled, features
) VALUES 
('Starter', 29, 'monthly', 'active', 5, 2, 1000, false, 
 ARRAY['dashboard', 'transactions', 'basic_reports']),
('Professional', 79, 'monthly', 'active', 15, 10, 10000, true, 
 ARRAY['dashboard', 'transactions', 'basic_reports', 'cash_flow', 'budget', 'ai_categorization']),
('Enterprise', 199, 'monthly', 'active', -1, -1, -1, true, 
 ARRAY['dashboard', 'transactions', 'basic_reports', 'cash_flow', 'budget', 'ai_categorization', 'ai_forecast', 'api_access', 'sso', 'dedicated_support']);
```

#### 7. Popolare integration_providers

```sql
INSERT INTO integration_providers (
  name, provider_type, status, uptime, error_rate, rate_limit_hits, config
) VALUES 
('Enable Banking', 'open_banking', 'ok', 99.8, 0.2, 12, '{"api_base_url": "https://api.enablebanking.com"}'),
('Lovable AI', 'ai', 'ok', 99.9, 0.1, 45, '{"model": "lovable-ai"}');
```

---

### Riepilogo File da Modificare

| File | Azione |
|------|--------|
| `src/pages/Aziende.tsx` | Rimuovere mock data, usare `useCompanies()`, aggiungere loading states |
| `src/hooks/useCompanies.ts` | Aggiungere `useCompaniesWithMetrics()` per KPI aggregati |
| `src/hooks/useGlobalUsers.ts` | Aggiungere query RPC per ottenere email utenti |
| **Migrazione DB** | Creare company per utente esistente |
| **Migrazione DB** | Popolare `subscription_plans` con piani default |
| **Migrazione DB** | Popolare `integration_providers` con Enable Banking |
| **Migrazione DB** | Creare funzione RPC `get_users_with_email()` |

---

### Flusso Dati Dopo le Modifiche

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN DASHBOARD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │  companies   │────▶│   Aziende    │     │  profiles    │   │
│   │   (reale)    │     │   (pagina)   │     │   (reale)    │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│          │                                         │            │
│          ▼                                         ▼            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  useCompaniesWithMetrics()                              │   │
│   │  - Conta utenti per company (via user_id)               │   │
│   │  - Conta bank_accounts per user della company           │   │
│   │  - Conta transazioni ultimi 30gg                        │   │
│   │  - Conta sync falliti ultimi 7gg                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Dashboard KPI Cards (dati reali)                       │   │
│   │  - Aziende totali: COUNT(companies)                     │   │
│   │  - Utenti totali: COUNT(profiles)                       │   │
│   │  - Sessioni attive: COUNT(sync_jobs WHERE running)      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Risultato Atteso

1. **Aziende.tsx** mostra dati reali dal database invece di mock
2. **Utenti Globali** mostra email degli utenti (tramite RPC sicura)
3. **Piani** mostra piani commerciali reali
4. **Integrazioni** mostra Enable Banking come provider attivo
5. **Dashboard Super Admin** calcola KPI da dati reali (companies, users, transactions)
6. La company e collegata all'utente esistente (`7c09c8f0-1dfa-4951-86cd-2920509bbfa5`)
