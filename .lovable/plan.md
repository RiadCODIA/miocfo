

## Obiettivo
Permettere agli utenti demo di testare il flusso di connessione bancaria A-Cube in modalita sandbox, mantenendo il blocco per le connessioni reali.

## Problema Attuale
Il codice blocca completamente gli utenti demo dal collegare conti bancari. Questo e corretto per l'ambiente di produzione, ma impedisce il testing del flusso A-Cube in sandbox.

## Soluzione Proposta
Modificare la logica per permettere agli utenti demo di utilizzare l'ambiente sandbox di A-Cube, mostrando un avviso che si tratta di dati di test.

### Modifiche da Apportare

#### 1. ConnectBankModal.tsx
Modificare la logica di blocco demo per mostrare un avviso invece di bloccare completamente:

```text
// Invece di bloccare, mostrare un avviso e procedere con sandbox
if (isDemoMode) {
  toast({
    title: "Modalita Demo - Sandbox",
    description: "Stai utilizzando l'ambiente di test A-Cube. I dati non sono reali.",
    variant: "default",
  });
}
```

#### 2. Aggiungere indicatore visivo
Mostrare un badge "SANDBOX" nel modal quando si e in modalita demo.

### Vantaggi
- Permette di testare l'intero flusso di connessione
- Mantiene la sicurezza bloccando le connessioni reali per utenti demo
- Fornisce feedback chiaro che si tratta di dati di test

---

## Dettagli Tecnici

### File da Modificare
1. `src/components/conti-bancari/ConnectBankModal.tsx`
   - Rimuovere il `return` che blocca gli utenti demo
   - Aggiungere toast informativo per la modalita sandbox
   - Aggiungere badge visivo "SANDBOX / TEST"

### Codice Specifico

**Linee 95-103** - Sostituire il blocco con avviso:
```typescript
// Show warning for demo users but allow sandbox testing
if (isDemoMode) {
  toast({
    title: "Modalita Demo - Ambiente Sandbox",
    description: "Stai testando con l'ambiente sandbox A-Cube. Nessun dato bancario reale verra utilizzato.",
  });
  // Continue with sandbox connection instead of returning
}
```

**Linee 162-211** - Aggiungere badge sandbox nel form:
```typescript
{isDemoMode && (
  <div className="flex items-center justify-center">
    <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
      SANDBOX / TEST
    </span>
  </div>
)}
```

### Comportamento Risultante
1. Utente demo clicca "Continua"
2. Viene mostrato un toast informativo
3. Il flusso procede normalmente verso A-Cube sandbox
4. I conti collegati saranno dati di test

