

## Piano: Nuove Sezioni Super Admin

### Sezioni da Aggiungere

| Sezione | Descrizione | Icona |
|---------|-------------|-------|
| **Fatturazione** | Visualizza tutte le transazioni della piattaforma | Receipt |
| **KPI Interni** | Metriche di business (MRR, crescita utenti, utilizzo) | LineChart |
| **Impostazioni** | Gestione profilo Super Admin (riutilizza componente esistente) | Settings |

---

### 1. Modifica Sidebar Super Admin

**File**: `src/components/layout/Sidebar.tsx`

Aggiornare `superAdminSidebarSections` da 3 a 6 voci:

```typescript
const superAdminSidebarSections: SidebarSection[] = [
  { id: "system_dashboard", label: "Dashboard di Sistema", icon: LayoutDashboard, path: "/" },
  { id: "global_users", label: "Utenti", icon: Users, path: "/utenti-globali" },
  { id: "plans_limits", label: "Piani", icon: CreditCard, path: "/piani" },
  { id: "fatturazione", label: "Fatturazione", icon: Receipt, path: "/fatturazione" },
  { id: "kpi_interni", label: "KPI Interni", icon: LineChart, path: "/kpi-interni" },
  { id: "impostazioni_admin", label: "Impostazioni", icon: Settings, path: "/impostazioni" },
];
```

---

### 2. Nuova Pagina: Fatturazione

**Nuovo file**: `src/pages/Fatturazione.tsx`

Mostra tutte le transazioni della piattaforma con:

| Elemento | Descrizione |
|----------|-------------|
| **Header** | Titolo + contatori totali |
| **Filtri** | Data range, tipo (entrata/uscita), banca |
| **Tabella Transazioni** | Tutte le transazioni con paginazione |
| **KPI Cards** | Totale incassi, pagamenti, netto del periodo |
| **Export** | Bottone per esportare CSV |

```text
┌─────────────────────────────────────────────────────────────────────┐
│  FATTURAZIONE PIATTAFORMA                                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Incassi     │  │  Pagamenti   │  │  Netto       │               │
│  │  €14.149     │  │  €14.256     │  │  -€107       │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  [Filtro Data] [Tipo] [Banca] [Cerca...]           [Esporta CSV]    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Data       │ Descrizione           │ Banca    │ Importo        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ 01/02/2026 │ Pagamento fornitore   │ BNL      │ -€1.200,00     │ │
│  │ 31/01/2026 │ Incasso fattura #123  │ Unicredit│ +€3.500,00     │ │
│  │ ...        │ ...                   │ ...      │ ...            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [< Precedente]           Pagina 1 di 15          [Successivo >]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3. Nuova Pagina: KPI Interni

**Nuovo file**: `src/pages/KPIInterni.tsx`

Dashboard con metriche di business interne:

| KPI | Fonte Dati |
|-----|------------|
| **Utenti Attivi** | Utenti con transazioni negli ultimi 30gg |
| **Crescita Utenti** | % crescita mese su mese |
| **Conti Collegati** | Totale e nuovi nell'ultimo mese |
| **Volume Transazionale** | Totale movimentato sulla piattaforma |
| **Transazioni/Giorno** | Media giornaliera |
| **Piani Attivi** | Distribuzione per piano |

```text
┌─────────────────────────────────────────────────────────────────────┐
│  KPI INTERNI PIATTAFORMA                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Utenti      │  │ Crescita    │  │ Conti       │  │ Volume Tot  │ │
│  │ Attivi: 2   │  │ +50% m/m    │  │ 6 (+2 mese) │  │ €28.405     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                      │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │  Crescita Utenti nel Tempo     │  │  Distribuzione per Piano   │ │
│  │         [LINE CHART]           │  │        [PIE CHART]         │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │  Volume Transazionale Mensile  │  │  Metriche di Utilizzo      │ │
│  │         [AREA CHART]           │  │  - Tx/giorno: 24           │ │
│  │                                │  │  - Tx/utente: 371          │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4. Route App.tsx

**File**: `src/App.tsx`

Aggiungere le nuove route:

```typescript
// Super Admin routes
<Route path="/fatturazione" element={<ProtectedRoute><MainLayout><Fatturazione /></MainLayout></ProtectedRoute>} />
<Route path="/kpi-interni" element={<ProtectedRoute><MainLayout><KPIInterni /></MainLayout></ProtectedRoute>} />
// /impostazioni gia esiste e funziona per tutti i ruoli
```

---

### 5. Hook per Fatturazione

**Nuovo file**: `src/hooks/useFatturazione.ts`

```typescript
// Query per tutte le transazioni con filtri
export function useAllTransactions(filters) {
  // Fetch paginato di bank_transactions con join a bank_accounts per nome banca
}

// KPI del periodo selezionato
export function usePeriodStats(dateRange) {
  // Totale incassi, pagamenti, netto
}
```

---

### 6. Hook per KPI Interni

**Estensione**: `src/hooks/useSuperAdminDashboard.ts`

Aggiungere nuove funzioni:

```typescript
// Utenti attivi (con transazioni negli ultimi 30gg)
export function useActiveUsers() { ... }

// Crescita utenti mese su mese
export function useUserGrowth() { ... }

// Distribuzione utenti per piano
export function usePlanDistribution() { ... }

// Metriche di utilizzo
export function useUsageMetrics() { ... }
```

---

### Riepilogo File da Modificare/Creare

| File | Azione |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Aggiungere 3 nuove voci al menu Super Admin |
| `src/App.tsx` | Aggiungere 2 nuove route (fatturazione e kpi-interni) |
| `src/pages/Fatturazione.tsx` | **NUOVO** - Pagina transazioni piattaforma |
| `src/pages/KPIInterni.tsx` | **NUOVO** - Pagina KPI interni |
| `src/hooks/useFatturazione.ts` | **NUOVO** - Hook per query transazioni |
| `src/hooks/useSuperAdminDashboard.ts` | Estendere con nuovi KPI |

---

### Sidebar Super Admin Risultante

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
│  🧾 Fatturazione         │
│  📈 KPI Interni          │
│  ⚙️ Impostazioni         │
│                          │
└──────────────────────────┘
```

