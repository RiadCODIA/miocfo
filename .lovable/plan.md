

## Plan: Replace Timeout Error with Informational "Please Wait" Popup

### Problem
When the user returns from the Enable Banking site, the modal shows a spinner while `completeSession` runs. If it takes longer than 120s, the user sees a timeout **error** — but the bank connection actually succeeds in the background (visible after page refresh). The user wants a non-blocking informational popup instead.

### Solution

Remove the timeout-based error entirely. Instead, after returning from the OAuth redirect:

1. **Fire-and-forget the `completeSession` call** — let it run in the background without blocking the UI
2. **Immediately show an informational popup** telling the user the operation is in progress and may take a few minutes
3. **Add a "Continua" (Continue) button** to dismiss the popup — the sync continues in the background regardless
4. **Keep the Realtime subscription** (already in place on `ContiBancari`) to auto-update the page when the bank appears in the DB

### Changes

**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

1. **Remove the 120s timeout** for both Enable Banking (line 108-112) and A-Cube (line 178-182) callbacks — no more fake error
2. **Change the `connecting` step behavior**: Instead of waiting for `completeSession` to finish before showing anything useful, immediately go to a new **`"syncing"` step** that shows an informational message with a "Continua" button
3. **The `completeSession` call runs in the background** — on success it invalidates queries (already does this); on failure it can show a toast but doesn't block the UI
4. **New `"syncing"` step UI**:
   - Green/blue info icon (not a spinner)
   - Title: "Collegamento avviato con successo"
   - Message: "La sincronizzazione delle transazioni è in corso e potrebbe richiedere qualche minuto. Puoi continuare a usare l'app, la pagina si aggiornerà automaticamente."
   - "Continua" button that closes the modal and calls `handleComplete()`

### Flow

```text
User returns from bank OAuth
→ Modal opens with brief spinner (1-2s while session restores)
→ completeSession fires in background
→ Immediately show "syncing" info screen with "Continua" button
→ User clicks "Continua" → modal closes
→ Background: completeSession finishes → queries invalidated → page updates via Realtime
```

### UI for the new "syncing" step

- CheckCircle2 icon in a blue/primary circle (not error, not spinner)
- "Collegamento avviato con successo"
- "La sincronizzazione delle transazioni è in corso e potrebbe richiedere qualche minuto. La pagina si aggiornerà automaticamente."
- Primary button: "Continua"

