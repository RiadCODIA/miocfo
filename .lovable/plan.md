

## Plan: Restructure Conto Economico Layout + Add Info Tooltips

### Overview

The current P&L table splits costs into "Costi Variabili" and "Costi Fissi" sections with a "MARGINE DI CONTRIBUZIONE" subtotal between them. The user wants a flat, simplified structure matching a standard Italian P&L format with specific row ordering, a new "MARGINE PRIMA DEGLI STIPENDI" subtotal, and info tooltips on key rows.

Additionally, revenue must be broken down into 3 lines (Ricavi delle vendite, Ricavi delle prestazioni, Altri ricavi e proventi) instead of the current single "Ricavi da fatture emesse" line.

---

### Changes Required

#### 1. Database Migration — Add missing expense categories + rename existing ones

Current DB has categories that don't match the user's list. Need to:

- **Rename** "Tecnologia e software" → remove, add "Software" (new category)
- **Rename** "Servizi professionali" → remove, add "Servizi generali" (new category)
- **Add** "Commissioni" (new expense category)
- **Deactivate** categories not in the user's list: "Affitto e utenze", "Forniture", "Viaggi e trasferte", "Imposte e tasse"
- **Reassign** invoices currently linked to deactivated/renamed categories to appropriate new ones
- **Reorder** all expense categories to match the exact order specified by the user

Final expense category order (all as a flat list, no variable/fixed distinction in the UI):
1. Acquisti (rename "Acquisto materie prime")
2. Energia e combustibili (rename "Energia e carburanti")
3. Lavorazioni di terzi (rename "Lavorazioni c/terzi")
4. Provvigioni
5. Carburanti
6. Manutenzioni
7. Assicurazioni
8. Formazione e ricerca
9. Marketing e pubblicità
10. God. Beni di terzi (rename "Beni di terzi")
11. Canoni di leasing (rename "Canoni Leasing")
12. Consulenze
13. Software (new, replaces "Tecnologia e software")
14. Servizi generali (new, replaces "Servizi professionali")
15. Commissioni (new)
16. Altre spese

Revenue categories (already exist, just need label alignment):
1. Ricavi delle vendite (rename "Ricavi da vendita")
2. Ricavi delle prestazioni (rename "Ricavi da servizi")
3. Altri ricavi e proventi (rename "Altri ricavi")

#### 2. `src/hooks/useContoEconomico.ts` — Restructure data model

- **Query revenue categories** (category_type = 'revenue') in addition to expense categories
- **Break down emessa invoices** by their `category_id` into the 3 revenue lines (uncategorized revenue goes to "Altri ricavi e proventi" or shown as uncategorized)
- **Remove the variable/fixed split** from the returned data — return a single flat `costi: Record<string, MonthlyData>` and `orderedCostCategories: CostCategory[]`
- **Keep uncategorized costs** logic as-is
- **Update the interface** `ContoEconomicoData` to include `ricaviPerCategoria: Record<string, MonthlyData>` and `revenueCategories: CostCategory[]`, and replace `costiVariabili`/`costiFissi`/etc. with a flat `costi` structure
- **Compute a single TOTALE COSTI** (sum of all cost categories + uncategorized)

#### 3. `src/components/area-economica/ContoEconomicoTab.tsx` — Restructure table + add tooltips

**New table structure:**

```text
Ricavi delle vendite
Ricavi delle prestazioni
Altri ricavi e proventi
━━ TOTALE RICAVI ━━

Acquisti                      (i)
Energia e combustibili        (i)
Lavorazioni di terzi
Provvigioni
Carburanti
Manutenzioni
Assicurazioni
Formazione e ricerca
Marketing e pubblicità
God. Beni di terzi
Canoni di leasing
Consulenze
Software
Servizi generali
Commissioni
Altre spese
━━ TOTALE COSTI ━━

━━ MARGINE PRIMA DEGLI STIPENDI ━━   (i)

Salari, stipendi e oneri sociali (manual input)
Compenso soci/amministratori (manual input)

━━ EBITDA ━━                          (i)
```

**Info tooltips** — Add an `Info` icon (from lucide-react) next to specific row labels. On hover, show a tooltip using the existing `Tooltip`/`TooltipProvider` components:

| Row | Tooltip text |
|-----|-------------|
| Acquisti | Comprende l'acquisto di materie prime, materiali di consumo, merci, semilavorati e prodotti simili |
| Energia e combustibili | Comprende canoni di energia elettrica, gas e acqua |
| MARGINE PRIMA DEGLI STIPENDI | È il margine di profitto generato prima di pagare eventuali compensi e costi del personale |
| EBITDA | È il Margine Operativo Lordo (MOL) ossia il profitto generato dall'attività operativa e caratteristica, prima di considerare eventuali Ammortamenti, Accantonamenti, Svalutazioni, Interessi e Tasse |

**Remove**:
- "MARGINE DI CONTRIBUZIONE" row and its percentage row
- The "Costi Variabili" / "Costi Fissi" section headers
- The `TrendingUp`/`TrendingDown` section header icons (replaced by a cleaner flat layout)

**Add**:
- "TOTALE COSTI" subtotal (sum of all cost categories)
- "MARGINE PRIMA DEGLI STIPENDI" = TOTALE RICAVI - TOTALE COSTI
- EBITDA = MARGINE PRIMA DEGLI STIPENDI - Personnel costs

#### 4. Update `useContoEconomico.ts` AI payload

The `handleAIAnalysis` function currently sends `costiVariabiliTotali`, `costiFissiTotali` etc. Update to send the new flat structure so the AI analysis remains accurate.

---

### Technical Details

**Files to modify:**
1. Database migration — Rename categories, add missing ones, deactivate unused, reorder, reassign invoice category_ids
2. `src/hooks/useContoEconomico.ts` — New data model with revenue breakdown and flat cost list
3. `src/components/area-economica/ContoEconomicoTab.tsx` — New table layout, info tooltips, remove variable/fixed split
4. `src/integrations/supabase/types.ts` — Update if needed for any schema changes

**New imports in ContoEconomicoTab.tsx:** `Info` from lucide-react, `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` from UI components.

**No new dependencies needed.**

