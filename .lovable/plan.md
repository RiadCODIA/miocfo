
# Correzione Sidebar per Utenti Reali

## Problema Identificato

La Sidebar usa solo `demoRole` per determinare quali sezioni mostrare, ignorando completamente `userRole` (il ruolo degli utenti reali). Questo spiega perché l'account `k.riad@codia.it` vede:
- La Dashboard consulente (DashboardRouter usa `userRole`)
- La Sidebar utente normale (Sidebar usa solo `demoRole`)

## Codice Attuale (Problematico)

```typescript
// Sidebar.tsx - linee 81, 84-85
const { user, profile, signOut, demoRole, isDemoMode } = useAuth();

const isAdmin = demoRole === 'admin_aziendale';      // SOLO demoRole!
const isSuperAdmin = demoRole === 'super_admin';      // SOLO demoRole!
```

## Soluzione

Aggiornare la Sidebar per usare lo stesso pattern del `DashboardRouter`: calcolare un `effectiveRole` combinando `demoRole` e `userRole`.

## Modifica da Applicare

**File**: `src/components/layout/Sidebar.tsx`

**Cambiamenti**:

1. Aggiungere `userRole` all'import da `useAuth()` (linea 81)
2. Calcolare `effectiveRole` come in DashboardRouter
3. Usare `effectiveRole` invece di `demoRole` per determinare `isAdmin` e `isSuperAdmin`

```typescript
// Prima (linea 81)
const { user, profile, signOut, demoRole, isDemoMode } = useAuth();

// Dopo
const { user, profile, signOut, demoRole, userRole, isDemoMode } = useAuth();
const effectiveRole = demoRole || userRole;

// Prima (linee 84-85)
const isAdmin = demoRole === 'admin_aziendale';
const isSuperAdmin = demoRole === 'super_admin';

// Dopo
const isAdmin = effectiveRole === 'admin_aziendale';
const isSuperAdmin = effectiveRole === 'super_admin';
```

## File da Modificare

| File | Modifica |
|------|----------|
| `src/components/layout/Sidebar.tsx` | Usare `userRole` oltre a `demoRole` per determinare il ruolo effettivo |

## Risultato Atteso

Dopo questa correzione:
- L'account `k.riad@codia.it` vedrà sia la dashboard consulente che la sidebar consulente
- Gli utenti demo continueranno a funzionare come prima
- Gli utenti normali reali vedranno la sidebar corretta per il loro ruolo
