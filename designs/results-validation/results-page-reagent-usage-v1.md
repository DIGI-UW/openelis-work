# Reagent Usage Capture on Result Entry — Interim v1
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-05-01
**Status:** Draft for Review
**Jira:** [TBD — assign on story creation]
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Result Entry, Reagent Inventory, Reagent Forecasting
**Supersedes:** none (interim ship-now feature)
**Superseded by:** `results-page-requirements-v2.1.md` (Method & Reagents Tab) once the Test Catalog → Method → Reagent linkage lands

---

## 1. Why a separate v1?

The full reagent capture experience specced in `results-page-requirements-v2.1.md` assumes that reagents are linked to tests through the Test Catalog (test → method → reagent). That linkage **does not yet exist in the shipped product** — reagents are configured globally in the Reagent Inventory module and have no formal association with which tests use them. The v2.1 design depends on that linkage to (a) auto-list the reagents required for each test and (b) source the per-reagent default quantity and unit.

Until that linkage ships, labs still need a way to record reagent consumption against patient results so that:

- Inventory deduction can begin happening from the result-entry path (today's only deduction path is manual adjustment in the inventory module — paper-based logs at the bench).
- The Reagent Forecasting module (`FRS_Reagent_Forecasting.md`) starts receiving real consumption events instead of relying on retroactive entries.
- Lot recalls have a queryable trail of "which patient results used lot X."
- The v2.1 design has a year of consumption data already on the books when it ships.

This v1 takes a deliberately minimal, manual approach: a free-form reagent picker that searches all configured reagents (by name or by lot number) plus a simple quantity field. It bolts onto the **existing/shipped Result Entry page** without restructuring it, and writes the same `ReagentConsumptionEvent` shape v2.1 will use — so when v2.1 lights up the per-test reagent listing, no data migration is required.

---

## 2. Scope

### In scope (v1)

- A new "Reagents Used" subsection on the existing Result Entry expand row (the same panel that already holds the result value, qualifiers, and notes today).
- One repeatable reagent row per result. Default visibility: collapsed (one click to expand). Default state when expanded: one empty row with "+ Add another reagent" below.
- A Carbon `ComboBox` that searches all active reagents by **name OR lot number** in a single typeahead.
  - If the user matches by name, the picker reveals the available lots underneath and the user picks a lot from there.
  - If the user matches by lot number, both the reagent and the lot are resolved in one selection.
- FIFO ordering of lots — oldest unexpired lot first, with a "FIFO Suggested" `Tag` on the top match (mirrors the v2.1 design exactly so behavior carries forward).
- A `NumberInput` for **Quantity Used** and a `Select` (or static label) for **Unit**, both populated from the lot/reagent metadata where available.
- On result save: one `ReagentConsumptionEvent` per row with `quantityUsed > 0`, sourced as `RESULT_ENTRY` (same payload as v2.1).
- Auto-credit on result void or downward edit (same logic as v2.1 §Save & Inventory Decrement).

### Out of scope (v1)

- Test Catalog reagent linkage (per-test reagent listing, default quantity, unit, override tolerance) — that is the v2.1 trigger.
- Per-test `reagentCaptureMode` (`HIDDEN`/`OPTIONAL`/`REQUIRED`). v1 is **always optional** because there is no per-test source of truth yet to demand it.
- Per-test cost estimate footer.
- Override-reason workflow — no per-reagent default quantity exists yet to compare against.
- Bulk import of reagent definitions; v1 reads whatever the Reagent Inventory module currently exposes.

### Migration path to v2.1

When v2.1 ships, the v1 widget remains visible for tests where `reagentCaptureMode` is unset or where the Test Catalog has no reagents linked to that test. As labs configure per-test reagents in the catalog, the per-test list (v2.1) renders instead of the search picker (v1). The two widgets share the same underlying `selectedReagentLots` data model and same save event, so the transition is silent for users.

---

## 3. User Roles & Permissions

| Role | Access | Notes |
|---|---|---|
| Lab Technician | Use the picker, enter quantity, save the result | Primary user |
| Lab Manager | Same as technician + reconcile failed inventory decrements | Reuses existing `inventory.adjust` |
| QC Officer | Read-only; consumption events are visible in lot detail view | Reuses `inventory.consumption.view` if it exists; else `inventory.view` |

**Permissions:**

| Action | Permission |
|---|---|
| Show the Reagents Used subsection | `results.modify` (already required to enter results) |
| Issue consumption events on save | `inventory.consumption.record` (auto-granted to anyone with `results.modify`) |
| Issue credit events on void/downward-edit | `inventory.consumption.credit` (auto-granted to anyone with `results.modify` for self-edits) |

---

## 4. Functional Requirements

### 4.1 Placement in the Existing Expanded Panel

The shipped Result Entry expanded panel today contains two horizontal field rows beneath the result table row:

1. **Methods row** — Methods dropdown, Upload file button, Refer-to-reference-lab checkbox + Referral Reason + Institute + Test to Perform (the last three disabled unless referral checkbox is checked).
2. **Storage / NCE row** — Storage location label + Assign storage location button, Report NCE button.

**FR-1-001:** v1 inserts a **new third row labeled "Reagent"** between the Methods row and the Storage / NCE row. The row is **always visible** when the result row is expanded — no Accordion, no collapse toggle. Rationale: the existing panel uses inline horizontal rows so technicians can scan and tab through every field without expansion clicks; reagent capture follows the same pattern.

**FR-1-002:** The Reagent row consists of a left-aligned label "Reagent" followed by a flex container of one or more **Reagent Entries** stacked vertically. The first Reagent Entry is rendered empty by default; a **+ Add another reagent** ghost button sits at the bottom of the container. Up to 12 entries per result (hard cap server-side, button hides at 12 client-side).

**FR-1-003:** A small Carbon `TrashCan` `IconButton` MUST appear on each Reagent Entry (right-aligned within its row). Removing the only entry leaves an empty entry in place — the row never collapses to zero — so the analyst can still type to start a new selection. Once saved, a remove-then-save issues a credit event automatically.

**FR-1-004:** The Reagent row uses the same horizontal grid spacing and field heights as the existing Methods row so the panel reads as a single coherent form. No new dividers, no background tint, no heading larger than the inline row label.

### 4.2 Combined Name/Lot Search

**FR-2-001:** Each Reagent Row MUST present a single `ComboBox` labeled **"Search reagent or lot number"**. The placeholder text is `e.g., Cellpack DCL or LOT-2024-0892`.

**FR-2-002:** As the user types, the ComboBox MUST query `GET /api/v1/reagents/search?q={query}` (see §6) and return up to **20** matches, with the following classification per match:

| Match type | Surface |
|---|---|
| Reagent name match | Item shows reagent name, with **lot count** badge (e.g., "Cellpack DCL · 3 lots"). |
| Lot number match | Item shows `lotNumber` in mono font, then reagent name, then expiration in muted text. |
| Both | Lot match wins precedence (one line, one selection). |

**FR-2-003:** When the user selects a **lot match**, the row resolves immediately: reagent and lot are set; the lot picker beneath collapses. Quantity Used + Unit fields are revealed (see §4.4).

**FR-2-004:** When the user selects a **reagent name match** (no specific lot), the ComboBox collapses and a secondary "Available lots" group appears beneath it, displaying every active lot for that reagent in FIFO order (see §4.3). The user MUST pick a lot from this group before Quantity Used appears.

**FR-2-005:** A user can backspace out of the resolved selection at any time to start a new search. Backing out clears the lot picker, Quantity Used, Unit, and any in-progress event link on that row.

### 4.3 Lot Picker (when a name match is selected)

**FR-3-001:** Lots MUST be ordered by **received date ascending** (oldest first). Each lot card shows:

- Lot number (mono font)
- Expiration date
- Remaining quantity (absolute, with unit) and remaining percentage of original lot size if known
- Status badges: `FIFO Suggested` (teal) on the top match, `Expiring` (warm-gray) when expiration is within 7 days, `Expired` (red, disabled) when past expiration

**FR-3-002:** Expired lots MUST NOT be selectable. They render with reduced opacity and a "Cannot select expired lot" tooltip.

**FR-3-003:** **No lot is pre-selected** — the user must explicitly pick. This mirrors v2.1 FIFO behavior to prevent silent commitment to a lot the analyst didn't see.

**FR-3-004:** If the existing Reagent Inventory module already supports a FIFO ordering API or property (e.g., a `fifoRank` field, a `received_date` index), the search endpoint MUST consume that source of truth. If the existing module does not yet sort lots, the search endpoint MUST sort client-server by `received_date ASC` and tag the first un-expired record as FIFO-suggested. **Implementation note for engineer:** confirm whether `ReagentLot` already exposes received-date/FIFO ordering; if so, reuse — do not introduce a parallel ordering.

### 4.4 Quantity Used + Unit

**FR-4-001:** Once a lot is resolved on a row, two fields appear inline:

| Field | Type | Notes |
|---|---|---|
| Quantity Used | `NumberInput` | Required if the row is to be saved; min 0, step 0.1 (or 1 if unit is integer-natured like `tests`/`strips`). A value of 0 saves the row but generates no consumption event. |
| Unit | `Select` or static label | If the lot's reagent has a single configured unit, render as a static label (e.g., "mL"). If multiple units are configured (rare in v1; reagent inventory may not yet model this), render a `Select`. Default = the lot's primary unit. |

**FR-4-002:** No default Quantity Used is pre-filled in v1. The user types it. Rationale: there is no per-test default to source from in this phase, and pre-filling with a global default would mask user error more than it helps.

**FR-4-003:** When Quantity Used is entered AND would push the lot's `remainingQuantity` below the lot's `reorderThreshold` (when the threshold is configured on the lot), an `InlineNotification kind="warning"` MUST appear under the row:

> Saving this result will leave LOT-2024-0892 below reorder threshold ({0} {1} remaining). Notify your inventory officer.

Where `{0}` is the projected remaining quantity and `{1}` is the unit. The notification is informational; it does NOT block save. Mirrors v2.1.

**FR-4-004:** Quantity Used MUST NOT exceed the lot's current `remainingQuantity`. If the user enters more, the field shows an inline `invalidText` error: "Cannot exceed remaining quantity ({0} {1})." Save is blocked until the value is corrected or the row is removed.

### 4.5 Save & Inventory Decrement

**FR-5-001:** On `POST /api/results/{id}/save` (or whatever the existing save endpoint is — v1 hooks the existing handler, does not introduce a new save endpoint), after the result write succeeds, the server MUST post one `ReagentConsumptionEvent` per Reagent Row with `quantityUsed > 0`:

```json
POST /api/v1/inventory/reagent-consumption-events
{
  "reagentLotId": "LOT-2024-0892",
  "quantityUsed": 2.5,
  "unit": "mL",
  "sourceType": "RESULT_ENTRY",
  "sourceResultId": "<result.id>",
  "sourceTestId": "<result.testId>",
  "performedBy": "<userId>",
  "performedAt": "<ISO8601>"
}
```

This is the **same** event shape consumed by FR-1-001 of `FRS_Reagent_Forecasting.md` and the same shape v2.1 will issue. v1 omits only `overrideReason` (no defaults exist to compare against).

**FR-5-002:** Decrement is atomic with event write — single transaction. On constraint failure (would go negative), the event is rejected and the result remains saved. An `InlineNotification kind="error"` informs the user that inventory was not decremented; they can retry from a "Reconcile" link that opens the inventory adjustment screen pre-filled with the lot.

**FR-5-003:** Auto-credit on void or downward edit:

- **Result voided** (status moves to `cancelled`): compensating positive events are issued for every prior negative event tied to that result, with `sourceType = "RESULT_VOID"` and `voidedEventIds` populated.
- **Saved result re-saved with different rows**: the system computes per-row deltas. Removed rows produce a full credit. Added rows produce a full negative. Modified rows produce a delta event (positive credit if `quantityUsed` decreased, additional negative if it increased). If the lot itself changed on a row, full credit on the old + full negative on the new.
- **No event is ever deleted.** Predecessors are referenced by `voidedEventIds` so the audit chain is reconstructable.

**FR-5-004:** Forecasting integration: the existing nightly ADC recalculation in `FRS_Reagent_Forecasting.md` automatically picks up `RESULT_ENTRY`-sourced events alongside any other consumption events. No changes to the forecasting module are required for v1.

---

## 5. Data Model

### Result-side additions

A `reagentUsage` array is added to the result entity (or its session/draft state):

```typescript
interface ReagentUsageRow {
  reagentId: string;
  reagentName: string;       // denormalized for display + audit
  lotId: string;
  lotNumber: string;         // denormalized
  quantityUsed: number;
  unit: string;
  consumptionEventIds?: string[];  // server-issued after save; for audit
}
```

### Search-side endpoint payload

```typescript
interface ReagentSearchResult {
  matchType: 'name' | 'lot';
  reagentId: string;
  reagentName: string;
  lots?: {                   // populated when matchType === 'name'
    lotId: string;
    lotNumber: string;
    expires: string;
    received: string;
    remainingQuantity: number;
    reorderThreshold?: number;
    unit: string;
    fifoRank?: number;
    status: 'ok' | 'expiring-soon' | 'expired';
  }[];
  lot?: {                    // populated when matchType === 'lot'
    lotId: string;
    lotNumber: string;
    expires: string;
    remainingQuantity: number;
    reorderThreshold?: number;
    unit: string;
    status: 'ok' | 'expiring-soon' | 'expired';
  };
}
```

### No new tables

v1 introduces **no new database tables**. The `reagentUsage` array is persisted as part of the result entity (via existing result-modification endpoints). Consumption events go to the inventory module's existing `ReagentConsumptionEvent` table (already specced in `FRS_Reagent_Forecasting.md`).

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/reagents/search?q={query}&limit=20` | Combined name/lot typeahead. Returns mixed `ReagentSearchResult[]` (lot matches first when both apply, then name matches). | `results.view` |
| GET | `/api/v1/reagents/{reagentId}/lots?activeOnly=true&fifoOrder=true` | All active lots for a reagent, FIFO ordered. Used when a name match is selected and the lot picker opens. | `results.view` |
| POST | `/api/v1/inventory/reagent-consumption-events` | Existing endpoint per `FRS_Reagent_Forecasting.md` FR-1-001. v1 calls it from the result-save handler. | `inventory.consumption.record` |
| POST | `/api/v1/inventory/reagent-consumption-events/credit` | Existing endpoint for credit-back on void/downward edit. | `inventory.consumption.credit` |

**FR-API-001:** The `/api/v1/reagents/search` endpoint MUST be debounced client-side at 250 ms and cap the result set at 20 to keep typeahead responsive. Server-side query implementation is left to the engineer; both `reagent.name ILIKE '%q%'` and `reagent_lot.lot_number ILIKE '%q%'` matches are unioned and de-duplicated by reagent.

---

## 7. UI Design

See companion mockup: `results-page-reagent-usage-v1-mockup.jsx` and preview: `results-page-reagent-usage-v1-preview.html`.

### Layout — full expanded panel context

The new Reagent row (third row below) slots between the existing Methods row and the existing Storage row. The Methods and Storage rows are unchanged.

```
╔═════════════════════════════════════════════════════════════════════════════════════╗
║ Sample Info │ Test Date │ Analyzer │ Test Name │ Normal Range │ Accept │ Result    ║
║ DEV01262… M │ 01/05/26  │ MANUAL   │ COVID-19… │ Any value    │  ☐     │  [▾]      ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │ Methods                Refer test to a   Referral    Institute   Test to Perform │
   │ [        ▾]   [Upload]    reference lab   Reason                  COVID-19 PCR…  │
   │                              ☐                                                   │
   ├─────────────────────────────────────────────────────────────────────────────────┤
   │ Reagent                                                                          │  ← NEW (v1)
   │ ┌─────────────────────────────────────────────────────────────────────────────┐ │
   │ │ [Search reagent or lot number ▾]   Quantity [____] mL          [×]          │ │
   │ │ [Search reagent or lot number ▾]   Quantity [____] drops       [×]          │ │
   │ │ + Add another reagent                                                        │ │
   │ └─────────────────────────────────────────────────────────────────────────────┘ │
   ├─────────────────────────────────────────────────────────────────────────────────┤
   │ Storage location: Unassigned    [Assign storage location]      [Report NCE ⓘ]   │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

### Reagent Entry states

A single Reagent Entry has three states. Vertical alignment with the Methods row is maintained in all three.

**State 1 — Empty (default).** A Carbon `ComboBox` labeled "Search reagent or lot number" occupies ~50% of the row width. Quantity Used and Unit fields are not yet rendered. Remove icon is hidden when this is the only empty entry; visible on additional empty entries.

```
[Search reagent or lot number ▾_____________________]                          [×]
  ↳ typing 'Cellpack' opens a dropdown:
    ┌────────────────────────────────────────────────┐
    │ Cellpack DCL                       · 3 lots    │
    │ Cellpack II                        · 1 lot     │
    │ LOT-2024-0892  Cellpack DCL  exp 12/20/2026    │  (lot match — mono font)
    └────────────────────────────────────────────────┘
```

**State 2 — Picking a lot (only after a name match).** The ComboBox collapses. A "Available lots (FIFO order)" group appears inline beneath, listing lots oldest-first with FIFO and Expiring tags. The user picks one. (When the user picks a lot match in State 1, this state is skipped.)

```
Available lots (FIFO order) · Cellpack DCL                              [Cancel]
  ◉ LOT-2024-0892  [FIFO Suggested] [Expiring]   Exp 12/20/2026 · 30 mL remaining
  ○ LOT-2024-1234                                Exp 01/15/2027 · 170 mL remaining
  ○ LOT-2024-1567                                Exp 02/28/2027 · 200 mL remaining
```

**State 3 — Resolved.** The lot is set. The entry collapses to a one-line resolved chip showing `LOT-NUMBER · reagent name`, plus inline `Quantity Used` and `Unit` fields and the Remove icon. A "Change" ghost button on the chip lets the user re-enter search.

```
[LOT-2024-0892 · Cellpack DCL ⓘ Change]   Quantity [2.5] mL                    [×]
```

### Carbon components used

`ComboBox` (combined search), `Tile` (lot card during State 2), `Tag` (FIFO Suggested / Expiring / Expired), `NumberInput` (quantity), `Select` or static label (unit), `Button kind="ghost"` (Add another, Change, Cancel), `IconButton` with `TrashCan` (Remove), `InlineNotification` (low-stock warning, decrement-failed error). **No `Accordion`** — the row is always visible as part of the expanded panel.

### Inline footer

No separate footer summary in v1 — the Reagent row and its entries are themselves the footer of this section. Total reagent count is implicit from the visible entries.

---

## 8. Business Rules

**BR-1:** Reagent capture in v1 is **always optional**. Saving a result with no Reagent Rows is permitted. (v2.1 introduces required mode per Test Catalog config.)

**BR-2:** A Reagent Row is invalid (and blocks save) if it has a partially-resolved selection — i.e., reagent picked but no lot picked, or lot picked but Quantity Used empty. Validation message: "Complete or remove this reagent row before saving."

**BR-3:** Quantity Used must satisfy `0 < quantityUsed <= lot.remainingQuantity`. If above, save is blocked until the user reduces the quantity or picks a different lot with sufficient stock.

**BR-4:** A user can list the same reagent twice on a single result (e.g., two different lots of the same reagent), and lots are not de-duplicated server-side. Each row produces an independent consumption event.

**BR-5:** No new permission key is introduced. Anyone with `results.modify` can capture reagent usage; the consumption-record permission is auto-granted at user-creation time per FR-3.

**BR-6:** When the existing Reagent Inventory module exposes a FIFO ordering primitive (via API or DB index), v1 MUST consume it rather than introducing a parallel sort. **Engineering verification step:** before implementation, confirm the source of FIFO ordering on `ReagentLot` and document it in the implementation notes attached to the Jira story.

**BR-7:** v1 does NOT introduce a `reagentCaptureMode` field anywhere. That field is a v2.1 concern (Test Catalog).

**BR-8:** Migration: when v2.1 ships, any pre-existing `reagentUsage` rows on saved results remain readable and editable — same data model. The v2.1 UI may filter these rows differently (e.g., show as "ad-hoc reagents" alongside the per-test reagent list), but no row is lost.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.results.reagentUsage.v1` | Reagents Used |
| `label.results.reagentUsage.search` | Search reagent or lot number |
| `placeholder.results.reagentUsage.search` | e.g., Cellpack DCL or LOT-2024-0892 |
| `label.results.reagentUsage.availableLots` | Available lots (FIFO order) |
| `label.results.reagentUsage.quantityUsed` | Quantity Used |
| `label.results.reagentUsage.unit` | Unit |
| `button.results.reagentUsage.addAnother` | + Add another reagent |
| `button.results.reagentUsage.remove` | Remove |
| `label.results.reagentUsage.fifoSuggested` | FIFO Suggested |
| `label.results.reagentUsage.expiring` | Expiring |
| `label.results.reagentUsage.expired` | Expired |
| `label.results.reagentUsage.lotCount` | {0} lots |
| `label.results.reagentUsage.lotCountSingular` | 1 lot |
| `message.results.reagentUsage.lowStock` | Saving this result will leave {0} below reorder threshold ({1} {2} remaining). Notify your inventory officer. |
| `message.results.reagentUsage.consumptionFailed` | Result saved, but inventory was not decremented for {0}. Flag the lot for inventory reconciliation. |
| `error.results.reagentUsage.exceedsRemaining` | Cannot exceed remaining quantity ({0} {1}). |
| `error.results.reagentUsage.incompleteRow` | Complete or remove this reagent row before saving. |
| `error.results.reagentUsage.expiredLot` | Cannot select expired lot. |
| `tooltip.results.reagentUsage.expiredLot` | Lot expired on {0} and cannot be selected. |
| `message.results.reagentUsage.empty` | No reagents recorded. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| ComboBox selection | Must resolve to a `(reagentId, lotId)` pair before quantity is enabled | `error.results.reagentUsage.incompleteRow` |
| Lot selection | Cannot be expired | `error.results.reagentUsage.expiredLot` |
| Quantity Used | > 0 and ≤ `lot.remainingQuantity` | `error.results.reagentUsage.exceedsRemaining` |
| Row count | ≤ 12 per result (server-side cap; client-side hides "+ Add" at 12) | `error.results.reagentUsage.tooManyRows` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Reagents Used Accordion | `results.view` | Accordion not rendered |
| Edit Reagent Rows | `results.modify` | Accordion read-only (rows visible, no edit) |
| Issue consumption events on save | `inventory.consumption.record` (auto-granted with `results.modify`) | Save still succeeds; event creation skipped with a warning toast asking to contact admin |
| Issue credit events on void/edit | `inventory.consumption.credit` (auto-granted with `results.modify` + `inventory.adjust`) | Edit still succeeds; credit creation skipped with same warning |

---

## 12. Acceptance Criteria

### Functional

- [ ] A new "Reagent" row appears in the Result Entry expanded panel between the existing Methods row and the existing Storage / NCE row
- [ ] The row is always visible when the result is expanded — no Accordion, no collapse toggle
- [ ] On first expand, exactly one empty Reagent Entry is rendered plus a "+ Add another reagent" button beneath it
- [ ] The new row uses the same horizontal grid spacing and field heights as the Methods row above it
- [ ] ComboBox typeahead returns reagent name matches AND lot number matches in the same dropdown, capped at 20 results
- [ ] Lot matches in the ComboBox surface as a single line showing `lotNumber · reagentName · exp date`
- [ ] Name matches in the ComboBox surface with a "{n} lots" badge
- [ ] Selecting a lot match resolves both reagent and lot in one click; the lot picker is skipped and Quantity Used appears
- [ ] Selecting a name match collapses the ComboBox and reveals "Available lots (FIFO order)" beneath
- [ ] Lots in the picker are sorted by received date ascending (oldest first)
- [ ] Top un-expired lot is tagged "FIFO Suggested"
- [ ] Lots within 7 days of expiration are tagged "Expiring"
- [ ] Expired lots are visible but disabled (50% opacity, "Cannot select expired lot" tooltip)
- [ ] No lot is pre-selected — user must click
- [ ] Once a lot is resolved, Quantity Used `NumberInput` and Unit field appear inline
- [ ] Unit renders as static label when reagent has one allowed unit; as `Select` when multiple
- [ ] Quantity Used > `lot.remainingQuantity` blocks save with "Cannot exceed remaining quantity ({0} {1})"
- [ ] Quantity Used that would push lot below `reorderThreshold` shows low-stock warning notification but does NOT block save
- [ ] Backspacing out of a resolved selection clears the row and re-enables search
- [ ] "+ Add another reagent" appends a new empty row (up to 12 rows)
- [ ] Remove icon button removes the row immediately, no confirmation
- [ ] Saving an empty Reagents Used section (no rows) is permitted — capture is optional in v1

### Save / Inventory

- [ ] On save, one `POST /api/v1/inventory/reagent-consumption-events` per row with `quantityUsed > 0`
- [ ] Event payload uses `sourceType = "RESULT_ENTRY"` and includes `sourceResultId`, `sourceTestId`, `performedBy`, `performedAt`
- [ ] Decrement of `ReagentLot.remainingQuantity` is atomic with the event write (single transaction)
- [ ] On inventory constraint failure (would go negative), result remains saved and an error notification with a "Reconcile" link to the inventory adjustment screen appears
- [ ] Voiding a saved result issues compensating positive events with `sourceType = "RESULT_VOID"` and `voidedEventIds` populated
- [ ] Re-saving with a row removed issues a full credit event for that row
- [ ] Re-saving with a row's quantity reduced issues a credit event for the difference
- [ ] Re-saving with a row's quantity increased issues an additional negative event for the increase
- [ ] Swapping the lot on a row issues a full credit on the old lot + full negative on the new lot
- [ ] No consumption event is ever deleted; supersession is recorded via `voidedEventIds`
- [ ] `inventory.consumption.record` permission is auto-granted to anyone with `results.modify`

### Forecasting integration

- [ ] Reagent Forecasting's nightly ADC recalculation includes `RESULT_ENTRY`-sourced events alongside manual adjustments
- [ ] A facility's GeneXpert (or any other reagent) DoS reflects result-entry consumption within one day of save

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Search debounce is 250 ms
- [ ] Search returns within 1 s p95 for a database with 500 reagents and 5000 lots
- [ ] Permissions enforced at API level (HTTP 403)
- [ ] Feature tested with French language file
- [ ] No new DB tables introduced

### Migration to v2.1

- [ ] When v2.1 ships, existing saved `reagentUsage` rows are readable and editable using the same data model
- [ ] When v2.1 lights up per-test reagent listings, the v1 free-form picker continues to render for tests that have no Test Catalog reagents linked
- [ ] No data migration script is required to move from v1 to v2.1

---

## 13. Open Questions

These are flagged for community input before implementation:

1. **Existing FIFO support.** Confirm whether `ReagentLot` already exposes a FIFO ordering API or property. If yes, reuse and document in the Jira story. If no, implement server-side `ORDER BY received_date ASC` in the search endpoint and tag the first un-expired record.
2. **Multi-unit reagents.** Does the current `Reagent` entity support multiple allowed units, or just one primary unit per reagent? This determines whether the Unit field is ever a `Select` in v1 or always a static label. **Proposal:** if the schema only models one unit, render as static label always; the `Select` appears in v2.1 once the test-catalog model adds `allowedUnits`.
3. **Mid-row save.** What happens if a user clicks Save while a Reagent Row is in the middle of selection (reagent picked, lot not yet picked)? **Proposal:** validation prevents save with the `error.results.reagentUsage.incompleteRow` message; user can either complete the row or remove it.
4. **Bench-side workflow.** For very high-throughput labs (200+ results per shift) running the same handful of reagents all day, the per-result picker may feel heavy. **Proposal:** out of scope for v1; consider a "carry forward last reagents" toggle in v2.x once we see real usage data.
5. **Recall workflow.** When a lot is recalled, the inventory module already has a recall flag. v1 should NOT modify recall behavior, but the Reagents Used data on past results becomes the queryable trail. Confirm the recall query already filters by `consumption_event.reagent_lot_id` or whether a small reporting query needs to be added.
