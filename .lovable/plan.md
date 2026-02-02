

# Impostare il Logo Finexa come Favicon

## Obiettivo

Sostituire la favicon predefinita di Lovable con l'icona del logo Finexa (`finexa-logo-icon.png`).

## Modifiche da Effettuare

### 1. Copiare l'icona nella cartella public

Copiare il file `src/assets/finexa-logo-icon.png` in `public/favicon.png` per renderlo accessibile come asset statico.

### 2. Aggiornare index.html

Modificare il riferimento alla favicon nel file `index.html`:

```html
<!-- Prima -->
(nessun link favicon esplicito, usa favicon.ico di default)

<!-- Dopo -->
<link rel="icon" href="/favicon.png" type="image/png">
```

## File da Modificare

| File | Modifica |
|------|----------|
| `public/favicon.png` | Copiare da `src/assets/finexa-logo-icon.png` |
| `index.html` | Aggiungere tag `<link rel="icon">` |

## Risultato

La favicon nel browser mostrerà l'icona del logo Finexa invece della favicon predefinita di Lovable.

