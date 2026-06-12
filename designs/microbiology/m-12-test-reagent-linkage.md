# M-12 Test → Reagent Linkage — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Cross-cutting OpenELIS foundation (Test Catalog admin + Reagent inventory)
**Phase:** Pre-1A — starts before Micro Phase 1A and runs as a parallel track
**Owner:** Test Catalog admin team (Micro is a primary consumer; chemistry, hematology, etc., also benefit)
**Status:** Draft

> This FRS is self-contained. The AMR design-review edits — REQUIRED/OPTIONAL/SUBSTITUTE and consumption-unit helper text, specific lot-validation errors, the FIFO tooltip, the reverse Reagent→Tests view, empty states, and the Phase-1A seed tests — are written **inline** in the relevant sections below; there is no separate edits doc or addendum.

This spec adds a long-deferred OE foundation: the ability to declare which reagent lots are required (or optional) for a given test. Per memory `project_reagent_test_catalog_link`, the Test → Reagent linkage doesn't exist today even though reagent concepts (lots, expiration, QC status) do. Micro is the forcing function for this work — AST cards, discs, and culture media are all reagents with lot numbers that ISO 15189 §7.3 expects traceable to each patient result.

> **⚠ Reuse update (verified in code + Jira) — supersedes the old `reagent`/`qc_lot` framing below.** Two pieces already exist and M-12 must build on them, not duplicate:
> - **In code now — the Inventory module:** `InventoryItem` (ItemType REAGENT / CARTRIDGE / kit), `InventoryLot` (lot, expiry, `LotStatus` = ACTIVE/IN_USE/EXPIRED/CONSUMED/QUARANTINED, `QCStatus` = PENDING/PASSED/FAILED/QUARANTINED), `InventoryTransaction`, and **`InventoryUsage` — which already records consumption and is keyed to `analysis_id` + `test_result_id`.** So per-result lot **consumption + traceability already has a home**; it is *not* new work.
> - **In Jira (not code yet) — the definitional link:** the Test↔Reagent "which reagents does this test use" link (`test_reagent_link`) is planned in **Test Catalog v2.5 v2 (OGC-759)**.
>
> **Therefore M-12 = reuse + wire, not build:** the **`ReagentLotPicker` over `InventoryLot`** (FIFO / expiry / QC blocking from `LotStatus`/`QCStatus`) whose selection **writes an `InventoryUsage`** (consumption + traceability — reuse), consuming the `test_reagent_link` definition from OGC-759. The picker UI + the result-entry wiring are the only net-new parts; the old `reagent` / `qc_lot` references in §3 below are superseded by the Inventory module.

Several parked specs benefit: Reagent Forecasting, Reagent QC, Catalog Subscription, future Phase 2 chemistry reagent tracking improvements.

---

## 1. Lab Context

**Current State.** OE already knows about reagents — definitions, lots, expiration, QC status — but a Test has no declared relationship to the reagents it consumes. At result entry there's nothing that says "this Blood Culture used BAP lot GL-26-04-117," so lot traceability is recorded (if at all) on paper.

**Pain.** Without a Test↔Reagent link, a patient result can't be traced to the specific lot that produced it — the ISO 15189 §7.3 expectation. A tech can save a result against an expired or QC-failed lot with nothing to stop them, and inventory planning can't see which tests a soon-to-expire lot will affect.

**What Changes.** A Test declares its reagents with a **linkage type** (REQUIRED / OPTIONAL / SUBSTITUTE) and a **consumption unit** (per test / run / batch / day), each with inline helper text explaining what it means. At result entry a single reusable **`ReagentLotPicker`** offers valid lots — **FIFO, oldest-expiry first, QC status shown, expired/locked lots blocked** — with specific, actionable error messages. A reverse Reagent→Tests view lets inventory see which tests a lot feeds.

---

## 2. Overview

### 2.1 Purpose

Define the relationship between Tests and Reagents so that:

1. **At result entry**, the system knows which reagent lot was used for the test (and validates the lot is unlocked, not expired, and has passing QC).
2. **For audit**, every patient result is traceable to the specific reagent lot that produced it (ISO 15189 §7.3 compliance).
3. **For forecasting**, future Reagent Forecasting can model consumption rates per test.
4. **For inventory**, the lab can see which lots are about to expire and which tests will be affected.

### 2.2 Routes

| Surface | Route |
|---------|-------|
| Test Catalog editor — Reagents tab (existing screen, new tab) | `/admin/test-catalog/:testId/reagents` |
| Reagent → Tests view (admin lookup) | `/admin/reagents/:reagentId/tests` |
| Reagent Lot search at result entry (component) | (embedded in each consuming module) |

### 2.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Configure linkages; manage reagent inventory |
| Microbiology Supervisor | View linkages; pick lots at result entry |
| Microbiology Tech | Pick lots at result entry from valid set |
| System Administrator | All actions |

### 2.4 Integration

- **Test Catalog v2.5 (OGC-759)** — owns the Reagents tab **and the `test_reagent_link` definitional table**; M-12 fills the tab content + the picker. Coordinate so the link isn't double-built.
- **Inventory module (existing, in code)** — `InventoryItem` (REAGENT/CARTRIDGE/kit), `InventoryLot` (lot/expiry/`LotStatus`/`QCStatus`), `InventoryUsage` (consumption, keyed to `analysis_id`/`test_result_id`), `InventoryTransaction`. The `ReagentLotPicker` reads `InventoryLot` and **writes an `InventoryUsage`** on selection. Supersedes the old `reagent`/`qc_lot` for this purpose.
- **M-04 Case Workbench Core** — Inoculation modal picks reagent lots for media types via the shared `ReagentLotPicker`.
- **M-05 AST Entry & Interpretation** — AST Setup modal picks reagent lots for AST cards / discs via the same `ReagentLotPicker`.
- **FRS_Reagent_Forecasting** (parked) — unblocked by this spec.
- **Reagent QC FRS** (referenced in qa-release-bundle) — unblocked by this spec.
- **Catalog Subscription FRS** (parked) — benefits from this spec.

---

## 3. Data model

### 3.1 New tables

```
test_reagent_link
├── link_id (UUID PK)
├── test_id (FK to test catalog — existing OE table)
├── inventory_item_id (FK to InventoryItem — existing Inventory module; the reagent/cartridge/kit)
│        NOTE: this table is owned/built by Test Catalog v2.5 (OGC-759); M-12 consumes it.
├── linkage_type (enum: REQUIRED, OPTIONAL, SUBSTITUTE)
├── consumption_unit (enum: PER_TEST, PER_RUN, PER_BATCH, PER_DAY)
├── consumption_quantity (numeric, default 1 — e.g., 1 card per AST Run, 1 plate per culture)
├── notes (text, nullable)
├── active (bool, default true)
└── audit columns

test_reagent_method_constraint (sub-junction, optional refinement)
├── constraint_id (PK)
├── link_id (FK to test_reagent_link)
├── method (text — e.g., "VITEK_2", "DISK_DIFFUSION", null = applies to all methods)
└── audit columns
```

### 3.2 Existing tables augmented

```
test (existing OE table; no schema changes; gain inverse relation)
   └── test_reagent_link (1:N via test_id)

InventoryItem (existing Inventory module — ItemType REAGENT / CARTRIDGE / kit; replaces the old `reagent`)
   └── test_reagent_link (1:N via inventory_item_id)

InventoryLot (existing — the lot-picker surface at result entry; replaces the old `qc_lot`)
   ├── lot_number, expiry, LotStatus (ACTIVE/IN_USE/EXPIRED/CONSUMED/QUARANTINED), QCStatus (PENDING/PASSED/FAILED/QUARANTINED)
   └── picker blocks selection when EXPIRED / QUARANTINED / QC FAILED

InventoryUsage (existing — consumption is ALREADY recorded here; M-12 writes a row on lot selection)
   ├── inventory_item_id, lot_id, analysis_id, test_result_id, quantity_used, usage_date, performed_by_user
   └── this IS the per-result lot traceability (ISO 15189 §7.3) — reused, not rebuilt
```

### 3.3 Linkage semantics

| Linkage type | Behavior at result entry | Helper text (shown in editor) |
|--------------|--------------------------|-------------------------------|
| REQUIRED | The user must pick a lot before saving. Validation blocks save without it. | "A lot must be chosen before the result can be saved." |
| OPTIONAL | The user may pick a lot; not blocking. Useful for items the lab tracks loosely (e.g., a generic broth that isn't lot-tracked at this lab). | "A lot may be chosen but is not required to save." |
| SUBSTITUTE | One of multiple substitute reagents may satisfy this test's needs. E.g., "MAC OR HE for enteric isolation." User picks one. | "One of several interchangeable reagents — pick whichever the bench used." |

The three linkage types are presented as a RadioButtonGroup in the Link New modal (§4.2) with the helper text above shown beneath the group (review edit H5).

| Consumption unit | Example | Helper text (shown in editor) |
|------------------|---------|-------------------------------|
| PER_TEST | One Etest strip used per organism × antibiotic test. | "Consumed once for each individual test." |
| PER_RUN | One VITEK card per AST Run, regardless of how many antibiotics it tests. | "Consumed once per run/setup, covering many antibiotics." |
| PER_BATCH | One QC organism vial used across a day's batch of AST setups. | "Consumed once across a batch of setups." |
| PER_DAY | One Gram stain reagent bottle consumes ~N tests per day; lab tracks daily. | "Tracked per day rather than per test." |

The consumption-unit dropdown shows the matching helper text for the selected unit (review edit H5).

---

## 4. Test Catalog editor — Reagents tab

The Test Catalog v2.5 editor already has a Reagents tab placeholder (per memory `project_reagent_test_catalog_link` — "the Reagents tab in Test Catalog needs the linkage built first"). M-12 builds the tab content.

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Test Catalog / Edit Test: Blood Culture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Basic Info] [Result Types] [Methods] [Reagents] [Alerts] [Compliance] ...   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Reagents                                                       [+ Link New]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Reagent Name              │ Linkage  │ Consumption │ Method     │ Actions   │
├───────────────────────────┼──────────┼─────────────┼────────────┼───────────┤
│ BacT/Alert FA bottle      │ REQUIRED │ 1 PER_RUN   │ (all)      │ ⋮         │
│ BacT/Alert FN bottle      │ REQUIRED │ 1 PER_RUN   │ (all)      │ ⋮         │
│ Blood agar plate (BAP)    │ REQUIRED │ 1 PER_RUN   │ (all)      │ ⋮         │
│ MacConkey agar plate (MAC)│ REQUIRED │ 1 PER_RUN   │ (all)      │ ⋮         │
│ Chocolate agar plate      │ OPTIONAL │ 1 PER_RUN   │ (all)      │ ⋮         │
└───────────────────────────┴──────────┴─────────────┴────────────┴───────────┘
```

**Empty state.** A test with no linkages yet: "No reagents linked to this test. **+ Link New** to declare which reagents it consumes — REQUIRED ones must be picked at result entry." (Result entry still works for unlinked tests — the picker just shows no required lots; see §7.)

### 4.2 Link New modal

```
┌─ Link Reagent to Blood Culture ─────────────────────────────────────────────┐
│                                                                              │
│  Reagent: *                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ [Search reagents...]                                                   ▼ │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Linkage type: *                                                             │
│  (•) Required   ( ) Optional   ( ) Substitute                               │
│  Required: a lot must be chosen before the result can be saved.              │
│                                                                              │
│  Consumption unit: *                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Per run                                                              ▼  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Consumed once per run/setup, covering many antibiotics.                     │
│                                                                              │
│  Quantity per unit: *                                                        │
│  ┌──────────────┐                                                            │
│  │ 1            │                                                            │
│  └──────────────┘                                                            │
│                                                                              │
│  Restrict to method (optional):                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ All methods                                                          ▼  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  If "All methods" is selected, this linkage applies regardless of how the    │
│  test is performed.                                                          │
│                                                                              │
│  Notes:                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [Cancel]                                                            [Save] │
└──────────────────────────────────────────────────────────────────────────────┘
```

The Linkage-type radio group and the Consumption-unit dropdown each display the matching helper text from §3.3 — the radio group's helper updates to the selected type, the dropdown's to the selected unit (review edit H5).

---

## 5. Reagent lot picker (component)

A reusable component (`ReagentLotPicker`) — the **generic lot-selection component reused across the app**: M-04 Inoculation, M-05 AST Setup, and any future module that consumes reagents at result entry. In every host it behaves identically: **FIFO ordering (oldest expiry first), QC status shown per lot, and expired or QC-locked lots blocked from selection**.

### 5.1 Component contract

```
ReagentLotPicker(
   test_id: UUID,
   method: text | null,
   target_field: <reagent_id or null>
) → Component that returns selected reagent_lot_id
```

The component:

1. Looks up `test_reagent_link` rows for the test_id (and optionally filtered by method).
2. For each linkage, queries available `qc_lot` rows: status = UNLOCKED, not expired, sorted by FIFO (**oldest expiry first**).
3. Renders one `ComboBox` per REQUIRED linkage, plus one per OPTIONAL the user enables, and a single ComboBox per SUBSTITUTE group from which one lot is chosen.
4. Validates selection on form submit.

**FIFO tooltip (review edit H5).** The lot dropdown carries a tooltip on its header: *"Lots are listed oldest-expiry first (FIFO) — use the top one unless you have a reason not to."* This makes the ordering rule legible rather than implicit.

### 5.2 Validation and specific errors

For each REQUIRED linkage:

- A lot must be selected.
- The selected lot must be UNLOCKED.
- The selected lot must not be expired (expires_at > now).
- If the lot's QC has failed recently, surfaces a warning (not blocking — supervisor can override).

If validation fails, save is blocked with **specific, actionable per-linkage error messages** (review edit H5) — not a generic "invalid lot":

- *"BAP Lot GL-26-04-117 expired 2026-07-01 — pick another lot."*
- *"MAC Lot ML-26-02-040 is locked by QC — pick another lot."*
- *"Blood agar plate (BAP) is required — select a lot before saving."* (no selection)
- (warning, non-blocking) *"QC for VITEK GN card lot AST-GN-26-04-117 is pending — a supervisor may need to approve."*

Expired and locked lots are **not selectable** in the dropdown in the first place (they're filtered out per §5.1); the explicit error covers the case where a previously valid selection expires or locks between load and save.

### 5.3 UI in consuming modals

In M-04's Inoculation modal:

```
Media: BAP, MAC
Reagent lots (required): *                                        (ⓘ FIFO)
┌─ BAP ───────────────────────────────────────────────────────────────────────┐
│ BAP Lot # GL-26-04-117 (expires 2026-08-15, QC pass)              ▼        │
└─────────────────────────────────────────────────────────────────────────────┘
┌─ MAC ───────────────────────────────────────────────────────────────────────┐
│ MAC Lot # ML-26-04-088 (expires 2026-09-02, QC pass)              ▼        │
└─────────────────────────────────────────────────────────────────────────────┘
```

In M-05's AST Setup modal:

```
Reagent Lot: *                                                    (ⓘ FIFO)
┌─────────────────────────────────────────────────────────────────────────────┐
│ VITEK GN AST card — Lot AST-GN-26-04-117 (expires 2026-08-15)         ▼   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Both hosts render the same component; the (ⓘ FIFO) tooltip and the QC-status text per lot are identical across them.

---

## 6. Reagent → Tests reverse view

For inventory planning, lab managers can see which tests consume a given reagent (review edit H5/R-07 — the reverse direction of the linkage).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Reagents / BacT/Alert FA bottle                                      │
│                                                                              │
│ Tests using this reagent:                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Test Name         │ Linkage  │ Consumption │ Specimen Type │ Method   │ │
│ ├───────────────────┼──────────┼─────────────┼───────────────┼──────────┤ │
│ │ Blood Culture     │ REQUIRED │ 1 PER_RUN   │ Blood         │ (all)    │ │
│ │ Blood Culture (Ped)│ REQUIRED│ 1 PER_RUN   │ Blood         │ (all)    │ │
│ └───────────────────┴──────────┴─────────────┴───────────────┴──────────┘ │
│                                                                              │
│ Current lots:                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Lot #          │ Expires      │ Status   │ QC Status │ Quantity         │ │
│ ├────────────────┼──────────────┼──────────┼───────────┼──────────────────┤ │
│ │ FA-26-04-117   │ 2026-08-15   │ Unlocked │ Pass      │ 48 bottles       │ │
│ │ FA-26-05-201   │ 2026-09-30   │ Unlocked │ Pass      │ 96 bottles       │ │
│ │ FA-26-03-088   │ 2026-07-01   │ Locked   │ Pending   │ 12 bottles       │ │
│ └────────────────┴──────────────┴──────────┴───────────┴──────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Empty state.** A reagent linked to no tests: "No tests are linked to this reagent yet. Link it from a test's Reagents tab."

This view enables Reagent Forecasting (parked spec) to compute expected consumption.

---

## 7. Migration considerations

This spec adds new tables; no migration of existing data. Phase 1A workflow:

1. Schema migration creates `test_reagent_link` table.
2. Lab manager seeds initial linkages for the **Phase-1A seed tests** (review edit R-07): **Blood Culture, Urine Culture, Wound Culture, and the AST setup tests** (GN/GP/Enterococcus/Strep/Pseudomonas panels). These cover the common micro tests that drive Phase-1A workflow; the seed includes the media/card linkages shown in §4.1.
3. Chemistry / hematology tests can be linked incrementally as those modules adopt.

No existing data writes are blocked by this spec — at result entry, if a test has no linkages defined, the picker shows no required lots (graceful fallback for tests not yet linked).

---

## 8. Permissions

| Action | Permission |
|--------|-----------|
| View linkages (Test Catalog Reagents tab) | `test_catalog.view` (existing) |
| Edit linkages | `test_catalog.manage` (existing) |
| Use ReagentLotPicker at result entry | The consuming surface's permission (e.g., `micro.case.edit`) |

---

## 9. Acceptance criteria

- **AC-M12-01**: `test_reagent_link` table created with the schema in §3.1.
- **AC-M12-02**: Test Catalog editor's Reagents tab shows linkages for the selected test, with an empty state for tests with no linkages (review edit R-07).
- **AC-M12-03**: Link New modal validates all required fields; the Linkage-type radio group and Consumption-unit dropdown show downstream helper text per selection (review edit H5).
- **AC-M12-04**: Linkage types: REQUIRED blocks save without lot, OPTIONAL doesn't, SUBSTITUTE accepts one of N.
- **AC-M12-05**: Method constraint (optional) restricts linkage to specific test methods.
- **AC-M12-06**: The single generic `ReagentLotPicker` component renders correctly in both M-04 Inoculation and M-05 AST Setup, behaving identically (FIFO, QC status, expired/locked blocked).
- **AC-M12-07**: Lot picker filters to UNLOCKED, unexpired lots; sorts FIFO (oldest expiry first); shows a FIFO tooltip (review edit H5).
- **AC-M12-08**: Validation rejects save with LOCKED or expired lots, with specific messages naming the lot, the reason, and "pick another lot" (review edit H5).
- **AC-M12-09**: Reverse view (`/admin/reagents/:reagentId/tests`) shows tests consuming the reagent, with an empty state (review edit H5/R-07).
- **AC-M12-10**: Reagent lot quantity surface accurate for inventory planning.
- **AC-M12-11**: NFR-02 (scale, < 500ms ReagentLotPicker load), NFR-04 (a11y).
- **AC-M12-12**: Phase-1A seed linkages cover Blood Culture, Urine Culture, Wound Culture, and the AST setup tests (review edit R-07).

---

## 10. i18n keys

Estimated 30-40 keys. Pattern:

```
admin.testCatalog.reagents.tab.title              "Reagents"
admin.testCatalog.reagents.list.column.reagentName "Reagent Name"
admin.testCatalog.reagents.list.column.linkage    "Linkage"
admin.testCatalog.reagents.list.column.consumption "Consumption"
admin.testCatalog.reagents.list.column.method     "Method"
admin.testCatalog.reagents.list.empty             "No reagents linked to this test. Link New to declare which reagents it consumes."
admin.testCatalog.reagents.action.linkNew         "Link New"
admin.testCatalog.reagents.linkage.required       "Required"
admin.testCatalog.reagents.linkage.optional       "Optional"
admin.testCatalog.reagents.linkage.substitute     "Substitute"
admin.testCatalog.reagents.linkage.required.helper   "A lot must be chosen before the result can be saved."
admin.testCatalog.reagents.linkage.optional.helper   "A lot may be chosen but is not required to save."
admin.testCatalog.reagents.linkage.substitute.helper "One of several interchangeable reagents — pick whichever the bench used."
admin.testCatalog.reagents.consumption.perTest    "Per test"
admin.testCatalog.reagents.consumption.perRun     "Per run"
admin.testCatalog.reagents.consumption.perBatch   "Per batch"
admin.testCatalog.reagents.consumption.perDay     "Per day"
admin.testCatalog.reagents.consumption.perTest.helper  "Consumed once for each individual test."
admin.testCatalog.reagents.consumption.perRun.helper   "Consumed once per run/setup, covering many antibiotics."
admin.testCatalog.reagents.consumption.perBatch.helper "Consumed once across a batch of setups."
admin.testCatalog.reagents.consumption.perDay.helper   "Tracked per day rather than per test."
admin.testCatalog.reagents.modal.linkNew.title    "Link Reagent to {{testName}}"
admin.testCatalog.reagents.modal.linkNew.reagent.label "Reagent"
admin.testCatalog.reagents.modal.linkNew.method.helper "If 'All methods' is selected, this linkage applies regardless of how the test is performed."
admin.reagentLotPicker.label.required             "Reagent lots (required)"
admin.reagentLotPicker.label.optional             "Reagent lots (optional)"
admin.reagentLotPicker.fifo.tooltip               "Lots are listed oldest-expiry first (FIFO) — use the top one unless you have a reason not to."
admin.reagentLotPicker.lot.summary                "{{name}} Lot # {{lotNumber}} (expires {{expiresAt}}, QC {{qcStatus}})"
admin.reagentLotPicker.error.lotLocked            "{{name}} Lot {{lotNumber}} is locked by QC — pick another lot."
admin.reagentLotPicker.error.lotExpired           "{{name}} Lot {{lotNumber}} expired {{date}} — pick another lot."
admin.reagentLotPicker.error.required             "{{name}} is required — select a lot before saving."
admin.reagentLotPicker.warning.qcPending          "QC for {{name}} lot {{lotNumber}} is pending — a supervisor may need to approve."
admin.reagentInventory.tests.title                "Tests using this reagent"
admin.reagentInventory.tests.empty                "No tests are linked to this reagent yet. Link it from a test's Reagents tab."
admin.reagentInventory.currentLots.title          "Current lots"
admin.reagentInventory.currentLots.column.quantity "Quantity"
```

---

## 11. Open verification items

- Confirm existing `reagent` and `qc_lot` table schemas.
- Confirm Test Catalog v2.5's Reagents tab placeholder is empty (vs. partially filled — if partially, M-12 builds on top).
- Confirm existing reagent inventory admin routes.

---

## 12. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (Inoculation modal consumes the shared `ReagentLotPicker`)
- M-05 AST Entry & Interpretation (AST Setup consumes the shared `ReagentLotPicker`)
- Test Catalog v2.5 (`test-catalog-requirements-v2.5.md` Reagents tab placeholder)
- `FRS_Reagent_Forecasting.md` (parked spec, unblocked by M-12)
- `project_reagent_test_catalog_link` memory
- ISO 15189 §7.3 — Examination Processes / Equipment, Reagents, and Consumables
