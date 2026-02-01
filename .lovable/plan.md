
# Correzione Routing Dashboard per Utenti Reali

## Problema Identificato

L'account consulente (k.riad@codia.it) ha il ruolo `admin_aziendale` correttamente salvato nel database, ma viene mostrata la dashboard utente invece di quella consulente.

**Causa**: Il `DashboardRouter` usa solo `demoRole`, che viene impostato solo per login demo. Gli utenti reali non hanno un modo per comunicare il loro ruolo al router.

```typescript
// Codice attuale - PROBLEMA
function DashboardRouter() {
  const { demoRole } = useAuth();  // Solo per demo!
  if (demoRole === 'admin_aziendale') return <DashboardAdmin />;
  return <Index />;  // Tutti gli utenti reali finiscono qui!
}
```

## Soluzione

### Fase 1: Aggiungere `userRole` all'AuthContext

Modificare `AuthContext.tsx` per:
1. Aggiungere uno stato `userRole: AppRole | null`
2. Aggiornare `fetchUserRole` per salvare il ruolo nello stato
3. Esporre `userRole` nel context

### Fase 2: Aggiornare DashboardRouter

Modificare il router per usare sia `userRole` (utenti reali) che `demoRole` (demo):

```typescript
function DashboardRouter() {
  const { demoRole, userRole } = useAuth();
  const effectiveRole = demoRole || userRole;
  
  if (effectiveRole === 'super_admin') return <DashboardSuperAdmin />;
  if (effectiveRole === 'admin_aziendale') return <DashboardAdmin />;
  return <Index />;
}
```

## File da Modificare

| File | Modifica |
|------|----------|
| `src/contexts/AuthContext.tsx` | Aggiungere stato `userRole`, aggiornare `fetchUserRole`, esporre nel context |
| `src/App.tsx` | Usare `userRole` nel `DashboardRouter` |

## Dettagli Tecnici

### AuthContext.tsx

```typescript
// Aggiungere allo stato
const [userRole, setUserRole] = useState<AppRole | null>(null);

// Aggiornare fetchUserRole
const fetchUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  if (!error && data) {
    const role = data.role as AppRole;
    setUserRole(role);  // <-- AGGIUNGERE QUESTA LINEA
    
    // ... resto del codice permessi
  }
};

// Aggiornare signOut per resettare userRole
const signOut = async () => {
  // ...
  setUserRole(null);
};

// Aggiungere userRole al context value
```

### App.tsx

```typescript
function DashboardRouter() {
  const { demoRole, userRole } = useAuth();
  const effectiveRole = demoRole || userRole;
  
  if (effectiveRole === 'super_admin') return <DashboardSuperAdmin />;
  if (effectiveRole === 'admin_aziendale') return <DashboardAdmin />;
  return <Index />;
}
```

## Risultato Atteso

Dopo questa correzione:
- L'account k.riad@codia.it vedrà la dashboard consulente
- La sidebar mostrerà le sezioni corrette per consulenti
- Gli utenti standard continueranno a vedere la dashboard normale
