# M-12 Test → Reagent Linkage — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Cross-cutting OpenELIS foundation (Test Catalog admin + Reagent inventory)
**Phase:** Pre-1A — starts before Micro Phase 1A and runs as a parallel track
**Owner:** Test Catalog admin team (Micro is a primary consumer; chemistry, hematology, etc., also benefit)
**Status:** Draft

This spec adds a long-deferred OE foundation: the ability to declare which reagent lots are required (or optional) for a given test. Per memory `project_reagent_test_catalog_link`, the Test → Reagent linkage doesn't exist today even though reagent concepts (lots, expiration, QC status) do. Micro is the forcing function for this work — AST cards, discs, and culture media are all reagents with lot numbers that ISO 15189 §7.3 expects traceable to each patient result.

Several parked specs benefit: Reagent Forecasting, Reagent QC, Catalog Subscription, future Phase 2 chemistry reagent tracking improvements.

---

## 1. Overview

### 1.1 Purpose

Define the relationship between Tests and Reagents so that:

1. **At result entry**, the system knows which reagent lot was used for the test (and validates the lot is unlocked, not expired, and has passing QC).
2. **For audit**, every patient result is traceable to the specific reagent lot that produced it (ISO 15189 §7.3 compliance).
3. **For forecasting**, future Reagent Forecasting can model consumption rates per test.
4. **For inventory**, the lab can see which lots are about to expire and which tests will be affected.

### 1.2 Routes

| Surface | Route |
|---------|-------|
| Test Catalog editor — Reagents tab (existing screen, new tab) | `/admin/test-catalog/:testId/reagents` |
| Reagent → Tests view (admin lookup) | `/admin/reagents/:reagentId/tests` |
| Reagent Lot search at result entry (component) | (embedded in each consuming module) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Configure linkages; manage reagent inventory |
| Microbiology Supervisor | View linkages; pick lots at result entry |
| Microbiology Tech | Pick lots at result entry from valid set |
| System Administrator | All actions |

### 1.4 Integration

- **Test Catalog v2.5** — adds a new Reagents tab on the Test editor (the Reagents tab already exists in v2.5 but is empty placeholder; M-12 fills it).
- **Reagent inventory** — existing OE reagent concepts (reagent definitions, lots, QC status).
- **M-04 Case Workbench Core** — Inoculation modal picks reagent lots for media types.
- **M-05 AST Entry & Interpretation** — AST Setup modal picks reagent lots for AST cards / discs.
- **FRS_Reagent_Forecasting** (parked) — unblocked by this spec.
- **Reagent QC FRS** (referenced in qa-release-bundle) — unblocked by this spec.
- **Catalog Subscription FRS** (parked) — benefits from this spec.

---

## 2. Data model

### 2.1 New tables

```
test_reagent_link
├── link_id (UUID PK)
├── test_id (FK to test catalog — existing OE table)
├── reagent_id (FK to reagent — existing OE table)
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

### 2.2 Existing tables augmented

```
test (existing OE table; no schema changes; gain inverse relation)
   └── test_reagent_link (1:N via test_id)

reagent (existing OE table; no schema changes; gain inverse relation)
   └── test_reagent_link (1:N via reagent_id)

qc_lot (existing OE table; key surface used at result entry)
   ├── lot_number, expires_at, status (UNLOCKED / LOCKED / EXPIRED)
   ├── reagent_id (FK)
   └── (existing columns)
```

### 2.3 Linkage semantics

| Linkage type | Behavior at result entry |
|--------------|--------------------------|
| REQUIRED | The user must pick a lot before saving. Validation blocks save without it. |
| OPTIONAL | The user may pick a lot; not blocking. Useful for items the lab tracks loosely (e.g., a generic broth that isn't lot-tracked at this lab). |
| SUBSTITUTE | One of multiple substitute reagents may satisfy this test's needs. E.g., "MAC OR HE for enteric isolation." User picks one. |

| Consumption unit | Example |
|------------------|---------|
| PER_TEST | One Etest strip used per organism × antibiotic test. |
| PER_RUN | One VITEK card per AST Run, regardless of how many antibiotics it tests. |
| PER_BATCH | One QC organism vial used across a day's batch of AST setups. |
| PER_DAY | One Gram stain reagent bottle consumes ~N tests per day; lab tracks daily. |

---

## 3. Test Catalog editor — Reagents tab

The Test Catalog v2.5 editor already has a Reagents tab placeholder (per memory `project_reagent_test_catalog_link` — "the Reagents tab in Test Catalog needs the linkage built first"). M-12 builds the tab content.

### 3.1 Layout

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

### 3.2 Link New modal

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
│                                                                              │
│  Consumption unit: *                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Per run                                                              ▼  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
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

---

## 4. Reagent lot picker (component)

A reusable component (`ReagentLotPicker`) used by any module that consumes reagents at result entry.

### 4.1 Component contract

```
ReagentLotPicker(
   test_id: UUID,
   method: text | null,
   target_field: <reagent_id or null>
) → Component that returns selected reagent_lot_id
```

The component:

1. Looks up `test_reagent_link` rows for the test_id (and optionally filtered by method).
2. For each linkage, queries available `qc_lot` rows: status = UNLOCKED, not expired, sorted by FIFO (oldest first).
3. Renders one `ComboBox` per REQUIRED linkage, plus one per OPTIONAL the user enables.
4. Validates selection on form submit.

### 4.2 Validation

For each REQUIRED linkage:

- A lot must be selected.
- The selected lot must be UNLOCKED.
- The selected lot must not be expired (expires_at > now).
- If the lot's QC has failed recently, surfaces a warning (not blocking — supervisor can override).

If validation fails, save is blocked with clear error messages per-linkage.

### 4.3 UI in consuming modals

In M-04's Inoculation modal:

```
Media: BAP, MAC
Reagent lots (required): *
┌─ BAP ───────────────────────────────────────────────────────────────────────┐
│ BAP Lot # GL-26-04-117 (expires 2026-08-15, QC pass)              ▼        │
└─────────────────────────────────────────────────────────────────────────────┘
┌─ MAC ───────────────────────────────────────────────────────────────────────┐
│ MAC Lot # ML-26-04-088 (expires 2026-09-02, QC pass)              ▼        │
└─────────────────────────────────────────────────────────────────────────────┘
```

In M-05's AST Setup modal:

```
Reagent Lot: *
┌─────────────────────────────────────────────────────────────────────────────┐
│ VITEK GN AST card — Lot AST-GN-26-04-117 (expires 2026-08-15)         ▼   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Reagent → Tests reverse view

For inventory planning, lab managers can see which tests consume a given reagent.

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

This view enables Reagent Forecasting (parked spec) to compute expected consumption.

---

## 6. Permissions

| Action | Permission |
|--------|-----------|
| View linkages (Test Catalog Reagents tab) | `test_catalog.view` (existing) |
| Edit linkages | `test_catalog.manage` (existing) |
| Use ReagentLotPicker at result entry | The consuming surface's permission (e.g., `micro.case.edit`) |

---

## 7. Migration considerations

This spec adds new tables; no migration of existing data. Phase 1A workflow:

1. Schema migration creates `test_reagent_link` table.
2. Lab manager seeds initial linkages for the tests in scope (Blood Culture, Urine Culture, AST tests). Phase 1A seed data covers the common micro tests.
3. Chemistry / hematology tests can be linked incrementally as those modules adopt.

No existing data writes are blocked by this spec — at result entry, if a test has no linkages defined, the picker shows no required lots (graceful fallback for tests not yet linked).

---

## 8. Acceptance criteria

- **AC-M12-01**: `test_reagent_link` table created with the schema in §2.1.
- **AC-M12-02**: Test Catalog editor's Reagents tab shows linkages for the selected test.
- **AC-M12-03**: Link New modal validates all required fields.
- **AC-M12-04**: Linkage types: REQUIRED blocks save without lot, OPTIONAL doesn't, SUBSTITUTE accepts one of N.
- **AC-M12-05**: Method constraint (optional) restricts linkage to specific test methods.
- **AC-M12-06**: ReagentLotPicker component renders correctly in M-04 Inoculation and M-05 AST Setup.
- **AC-M12-07**: Lot picker filters to UNLOCKED, unexpired lots; sorts FIFO.
- **AC-M12-08**: Validation rejects save with LOCKED or expired lots.
- **AC-M12-09**: Reverse view (`/admin/reagents/:reagentId/tests`) shows tests consuming the reagent.
- **AC-M12-10**: Reagent lot quantity surface accurate for inventory planning.
- **AC-M12-11**: NFR-02 (scale, < 500ms ReagentLotPicker load), NFR-04 (a11y).

---

## 9. i18n keys

Estimated 30-40 keys. Pattern:

```
admin.testCatalog.reagents.tab.title              "Reagents"
admin.testCatalog.reagents.list.column.reagentName "Reagent Name"
admin.testCatalog.reagents.list.column.linkage    "Linkage"
admin.testCatalog.reagents.list.column.consumption "Consumption"
admin.testCatalog.reagents.list.column.method     "Method"
admin.testCatalog.reagents.action.linkNew         "Link New"
admin.testCatalog.reagents.linkage.required       "Required"
admin.testCatalog.reagents.linkage.optional       "Optional"
admin.testCatalog.reagents.linkage.substitute     "Substitute"
admin.testCatalog.reagents.consumption.perTest    "Per test"
admin.testCatalog.reagents.consumption.perRun     "Per run"
admin.testCatalog.reagents.consumption.perBatch   "Per batch"
admin.testCatalog.reagents.consumption.perDay     "Per day"
admin.testCatalog.reagents.modal.linkNew.title    "Link Reagent to {{testName}}"
admin.testCatalog.reagents.modal.linkNew.reagent.label "Reagent"
admin.testCatalog.reagents.modal.linkNew.method.helper "If 'All methods' is selected, this linkage applies regardless of how the test is performed."
admin.reagentLotPicker.label.required             "Reagent lots (required)"
admin.reagentLotPicker.label.optional             "Reagent lots (optional)"
admin.reagentLotPicker.lot.summary                "{{name}} Lot # {{lotNumber}} (expires {{expiresAt}}, QC {{qcStatus}})"
admin.reagentLotPicker.error.lotLocked            "Lot is locked by QC"
admin.reagentLotPicker.error.lotExpired           "Lot expired on {{date}}"
admin.reagentLotPicker.warning.qcPending          "QC for this lot is pending — supervisor may need to approve"
admin.reagentInventory.tests.title                "Tests using this reagent"
admin.reagentInventory.currentLots.title          "Current lots"
admin.reagentInventory.currentLots.column.quantity "Quantity"
```

---

## 10. Open verification items

- Confirm existing `reagent` and `qc_lot` table schemas.
- Confirm Test Catalog v2.5's Reagents tab placeholder is empty (vs. partially filled — if partially, M-12 builds on top).
- Confirm existing reagent inventory admin routes.

---

## 11. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (Inoculation modal consumes ReagentLotPicker)
- M-05 AST Entry & Interpretation (AST Setup consumes ReagentLotPicker)
- Test Catalog v2.5 (`test-catalog-requirements-v2.5.md` Reagents tab placeholder)
- `FRS_Reagent_Forecasting.md` (parked spec, unblocked by M-12)
- `project_reagent_test_catalog_link` memory
- ISO 15189 §7.3 — Examination Processes / Equipment, Reagents, and Consumables
