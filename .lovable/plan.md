

## Piano: Semplificazione Super Admin Dashboard

### Analisi della Richiesta

L'utente vuole semplificare drasticamente il profilo Super Admin:

| Azione | Sezione |
|--------|---------|
| **MANTENERE** | Dashboard di Sistema (con KPI reali) |
| **MANTENERE** | Utenti (sezione unificata) |
| **MANTENERE** | Piani e Limiti (dati reali) |
| **RIMUOVERE** | Aziende (crea confusione) |
| **RIMUOVERE** | Integrazioni |
| **RIMUOVERE** | Monitoraggio & Log |
| **RIMUOVERE** | Sicurezza & Compliance |
| **RIMUOVERE** | Configurazioni Globali |

### Dati Reali Disponibili

Dalla query al database, abbiamo dati reali per la dashboard:

| Metrica | Valore |
|---------|--------|
| Utenti totali | 2 |
| Conti bancari | 6 |
| Transazioni totali | 743 |
| Transazioni 30gg | 293 |
| Incassi 30gg | €14.149,62 |
| Pagamenti 30gg | €14.256,66 |
| Piani configurati | 3 |

---

### Modifiche da Implementare

#### 1. Sidebar Super Admin (3 sezioni invece di 8)

**File**: `src/components/layout/Sidebar.tsx`

Ridurre `superAdminSidebarSections` a:

```typescript
const superAdminSidebarSections: SidebarSection[] = [
  { id: "system_dashboard", label: "Dashboard di Sistema", icon: LayoutDashboard, path: "/" },
  { id: "global_users", label: "Utenti", icon: Users, path: "/utenti-globali" },
  { id: "plans", label: "Piani", icon: CreditCard, path: "/piani" },
];
```

#### 2. Dashboard Super Admin con KPI Reali

**File**: `src/pages/DashboardSuperAdmin.tsx`

Sostituire i KPI attuali (aziende totali/attive) con metriche di sistema reali:

| KPI Card | Fonte Dati |
|----------|------------|
| Utenti Totali | `COUNT(profiles)` |
| Conti Bancari | `COUNT(bank_accounts)` |
| Transazioni Totali | `COUNT(bank_transactions)` |
| Volume Transazioni 30gg | `SUM(amount) WHERE date >= 30 days ago` |
| Incassi Periodo | `SUM(amount) WHERE amount > 0` |
| Pagamenti Periodo | `SUM(amount) WHERE amount < 0` |

Rimuovere:
- Cards "Aziende Totali" e "Aziende Attive"
- Sezioni servizi (API Gateway, Backend API, ecc.)
- Grafici tecnici (latenza, error rate)

Aggiungere grafici finanziari:
- Andamento flussi di cassa mensili
- Distribuzione utilizzo piattaforma

#### 3. Rimuovere Route Non Necessarie

**File**: `src/App.tsx`

Rimuovere le route:
- `/aziende`
- `/integrazioni`
- `/log`
- `/sicurezza`
- `/configurazioni`

Rimuovere gli import corrispondenti

#### 4. Hook per KPI di Sistema Reali

**Nuovo file**: `src/hooks/useSuperAdminDashboard.ts`

```typescript
export function useSuperAdminKPIs() {
  return useQuery({
    queryKey: ["super-admin-kpis"],
    queryFn: async () => {
      // Query aggregata per tutti i KPI
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("*", { count: "exact", head: true });
      
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("amount, date");
      
      // Calcola metriche
      return {
        totalUsers: profiles?.length || 0,
        totalBankAccounts: bankAccounts?.length || 0,
        totalTransactions: transactions?.length || 0,
        income30d: /* calcolo */,
        expenses30d: /* calcolo */,
        netFlow30d: /* calcolo */,
      };
    },
  });
}
```

---

### Nuova Struttura Dashboard Super Admin

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD DI SISTEMA                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Utenti    │  │    Conti    │  │ Transazioni │  │  Incassi    │     │
│  │      2      │  │  Bancari 6  │  │    743      │  │  €14.149    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐                                        │
│  │  Pagamenti  │  │    Piani    │                                        │
│  │  €14.256    │  │      3      │                                        │
│  └─────────────┘  └─────────────┘                                        │
│                                                                           │
│  ┌────────────────────────────┐  ┌────────────────────────────┐         │
│  │  Flussi di Cassa Mensili  │  │  Transazioni per Giorno    │         │
│  │     (ultimi 6 mesi)       │  │    (ultimi 30 giorni)      │         │
│  │         [GRAFICO]         │  │         [GRAFICO]          │         │
│  └────────────────────────────┘  └────────────────────────────┘         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Sidebar Risultante

```text
┌──────────────────────────┐
│        FINEXA            │
├──────────────────────────┤
│  👑 Super Admin          │
├──────────────────────────┤
│                          │
│  📊 Dashboard di Sistema │
│  👥 Utenti               │
│  💳 Piani                │
│                          │
├──────────────────────────┤
│  [User Avatar]           │
│  Super Amministratore    │
│                    [🚪]  │
└──────────────────────────┘
```

---

### Riepilogo File da Modificare

| File | Azione |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Ridurre `superAdminSidebarSections` a 3 voci |
| `src/pages/DashboardSuperAdmin.tsx` | Riscrivere con KPI finanziari reali |
| `src/App.tsx` | Rimuovere 5 route e relativi import |
| `src/hooks/useSuperAdminDashboard.ts` | Nuovo hook per KPI aggregati |

---

### File da Eliminare (opzionale, per pulizia)

Questi file non saranno piu accessibili ma possono essere mantenuti per riferimento futuro:
- `src/pages/Aziende.tsx`
- `src/pages/Integrazioni.tsx`
- `src/pages/MonitoraggioLog.tsx`
- `src/pages/SicurezzaCompliance.tsx`
- `src/pages/ConfigurazioniGlobali.tsx`

---

### Risultato Atteso

1. Super Admin con solo 3 sezioni nella sidebar (Dashboard, Utenti, Piani)
2. Dashboard mostra KPI reali dal database (utenti, conti, transazioni, flussi)
3. Nessun mock data o sezioni tecniche non necessarie
4. Piani commerciali reali gestibili (3 piani gia configurati)
5. Gestione utenti funzionante con dati reali

