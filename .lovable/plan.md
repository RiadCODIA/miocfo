
# Sidebar Reorganization: Area finanziaria and Area economica

## Current Structure
```text
NAVIGAZIONE
  - Dashboard
  - Collegamenti
  - Conti & Transazioni    <-- will move

GESTIONE BUSINESS
  Area finanziaria
    - Fatture              <-- will move to Area economica
    - Flussi di Cassa      (stays)
    - Scadenzario          <-- will move to Area economica
  Area economica
    - Conto Economico      (stays)
    - Budget & Previsioni  (stays)
    - Movimenti            <-- will move to Area finanziaria
```

## New Structure
```text
NAVIGAZIONE
  - Dashboard
  - Collegamenti

GESTIONE BUSINESS
  Area finanziaria
    - Flussi di Cassa
    - Movimenti
    - Conti & Transazioni
  Area economica
    - Conto Economico
    - Budget & Previsioni
    - Fatture
    - Scadenzario
```

## Changes (single file)

**`src/components/layout/Sidebar.tsx`**:
1. Remove "Conti & Transazioni" from the NAVIGAZIONE group (line 68)
2. Update Area finanziaria items to: Flussi di Cassa, Movimenti (moved from Area economica), Conti & Transazioni (moved from NAVIGAZIONE)
3. Update Area economica items to: Conto Economico, Budget & Previsioni, Fatture (moved from Area finanziaria), Scadenzario (moved from Area finanziaria)
