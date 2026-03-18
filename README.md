# mioCFO — Gestione Finanziaria Intelligente

Dashboard di gestione finanziaria per PMI italiane. Monitora cash flow, fatture, scadenze e KPI aziendali in un'unica piattaforma.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **AI**: OpenAI API (GPT-4o-mini) per analisi finanziaria, categorizzazione e OCR fatture

## Sviluppo locale

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## Funzionalità principali

- 📊 Dashboard con KPI finanziari in tempo reale
- 🏦 Connessione conti bancari e importazione estratti conto
- 🧾 Upload e OCR fatture con categorizzazione automatica
- 📈 Analisi spese e cash flow con AI
- 📅 Scadenzario e gestione deadlines
- 🤖 Assistente AI (CFO virtuale)
- 💼 Gestione budget e previsioni
- 👥 Multi-utente con ruoli (user, admin, super_admin)
