# M-12 Reagent and medium lot selection — functional requirements

> Functional authority: the V2 baseline owns case behavior; this document owns its scoped laboratory outcomes. Technical examples are non-normative. Engineering decisions and verification belong to specs/amr.


**V2 baseline, synchronized 2026-10-06.** Test Catalog defines allowed reagents,
methods and requiredness; Inventory defines lots and their eligibility. Case
result entry uses the shared lot-selection behavior. Engineering decisions and
storage contracts belong to specs/amr, not this functional source.

**Culture media are traceability only:** selection records which medium and lot
were used, with no quantity, stock consumption or automatic credit on undo.
Other reagents retain their method, requiredness and stock policies. See
[V2 media](amr-micro-v2-amendments.md#fr-05.1b) and
[shared Inventory](../inventory/inventory-redesign.md).

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

- **[Shared Test Catalog](../admin-config/test-catalog.md)** owns the allowed reagent/media definitions, methods and requiredness.
- **[Shared Inventory](../inventory/inventory-redesign.md)** owns lots, their eligibility, stock and traceability policies; culture-row selection never changes stock.
- **[V2 case](amr-micro-v2-amendments.md#fr-17.6) Case Workbench Core** — inoculation section picks reagent lots for media types via the shared `ReagentLotPicker`.
- **[V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry & Interpretation** — susceptibility setup section picks reagent lots for AST cards / discs via the same `ReagentLotPicker`.
- **FRS_Reagent_Forecasting** (parked) — unblocked by this spec.
- **Reagent QC FRS** (referenced in qa-release-bundle) — unblocked by this spec.
- **Catalog Subscription FRS** (parked) — benefits from this spec.

---

## 3. Linkage behavior

### 3.1 Information shown to laboratory users

The test's allowed reagents and media show their name, method restrictions,
requiredness, permitted substitutions and active state. A lot shows its number,
expiry and eligibility with a reason when unavailable. The result history names
the selected reagent lot; the culture row names its medium and tracked lot.
Culture-medium links have editable timing and atmosphere defaults but no quantity.

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

A reusable component (`ReagentLotPicker`) — the **generic lot-selection component reused across the app**: [V2 case](amr-micro-v2-amendments.md#fr-17.6) Inoculation, [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Setup, and any future module that consumes reagents at result entry. In every host it behaves identically: **FIFO ordering (oldest expiry first), QC status shown per lot, and expired or QC-locked lots blocked from selection**.

### 5.1 Shared selection behavior

1. Offer the test's permitted reagents, filtered by its method where configured.
2. List usable lots first by earliest expiry. Show expired, failed, quarantined or consumed lots disabled with their reason.
3. Require a lot for required links, allow optional links, and allow one permitted alternative for a substitute group.
4. Recheck eligibility on save. Culture-media selection records traceability only, with no stock change.

**FIFO tooltip (review edit H5).** The lot dropdown carries a tooltip on its header: *"Lots are listed oldest-expiry first (FIFO) — use the top one unless you have a reason not to."* This makes the ordering rule legible rather than implicit.

### 5.2 Validation and specific errors

For each REQUIRED linkage:

- A lot must be selected.
- The selected lot must be UNLOCKED.
- The selected lot must not be expired (expires_at > now).
- Failed, quarantined and consumed lots are ineligible; pending QC follows the shared Inventory policy and shows its explanation.

If validation fails, save is blocked with **specific, actionable per-linkage error messages** (review edit H5) — not a generic "invalid lot":

- *"BAP Lot GL-26-04-117 expired 2026-07-01 — pick another lot."*
- *"MAC Lot ML-26-02-040 is locked by QC — pick another lot."*
- *"Blood agar plate (BAP) is required — select a lot before saving."* (no selection)
- (warning, non-blocking) *"QC for VITEK GN card lot AST-GN-26-04-117 is pending — a supervisor may need to approve."*

Expired and locked lots are **not selectable** in the dropdown (shown disabled with a reason per §5.1); the explicit error covers the case where a previously valid selection expires or locks between load and save.

### 5.3 UI in consuming modals

In [V2 case](amr-micro-v2-amendments.md#fr-17.6)'s inoculation section:

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

In [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b)'s susceptibility setup section:

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
│ │ Blood Culture     │ Tracked  │ Trace only   │ Blood         │ (all)    │ │
│ │ Blood Culture (Ped)│ Tracked │ Trace only   │ Blood         │ (all)    │ │
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

## 7. Shared setup

Laboratory managers configure the permitted media for Blood Culture, Urine
Culture and Wound Culture, and reagent links for the susceptibility setup tests.
The same shared catalog behavior applies to other laboratory sections. A test
with no reagent links requires no reagent selection. A tracked culture medium
requires a valid lot; a Not tracked medium records its name without a lot.
Engineering owns cutover and any storage transformation.

---

## 8. Permissions

| Action | Permission |
|--------|-----------|
| View linkages (Test Catalog Reagents tab) | `test_catalog.view` (existing) |
| Edit linkages | `test_catalog.manage` (existing) |
| Use ReagentLotPicker at result entry | The consuming surface's permission (e.g., Results rights in the case lab unit) |

---

## 9. Acceptance criteria

> **Scope note (v3.0):** M-12's own acceptance is **AC-M12-06, -07, -08, -11** (the `ReagentLotPicker` component + its behavior in [V2 case](amr-micro-v2-amendments.md#fr-17.6)/[V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b)). The rest below — AC-M12-01 (table), -02 (Reagents tab), -03/-04/-05 (linkage editor), -09 (reverse view), -10/-12 (inventory/seed) — are **owned by Test Catalog v2.5 (OGC-759) / Inventory** and listed here only as the contract M-12 depends on.

- **AC-M12-01** *(Shared Test Catalog)*: administrators can link a test to its allowed reagents and media, with method and requiredness shown; culture media carry no consumption quantity.
- **AC-M12-02**: Test Catalog editor's Reagents tab shows linkages for the selected test, with an empty state for tests with no linkages (review edit R-07).
- **AC-M12-03**: Link New modal validates all required fields; the Linkage-type radio group and Consumption-unit dropdown show downstream helper text per selection (review edit H5).
- **AC-M12-04**: Linkage types: REQUIRED blocks save without lot, OPTIONAL doesn't, SUBSTITUTE accepts one of N.
- **AC-M12-05**: Method constraint (optional) restricts linkage to specific test methods.
- **AC-M12-06**: The single generic `ReagentLotPicker` component renders correctly in both [V2 case](amr-micro-v2-amendments.md#fr-17.6) Inoculation and [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Setup, behaving identically (FIFO, QC status, expired/locked blocked).
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

- Confirm the existing **Inventory module** schema (`InventoryItem` / `InventoryLot` / `InventoryUsage`) — the picker reads `InventoryLot` and writes `InventoryUsage`. (Supersedes the old `reagent`/`qc_lot` check.)
- Confirm the existing **Reagent Usage on Result Entry** component (v1 / v2.1 on `main`) so the micro `ReagentLotPicker` reuses/extends it rather than diverging.
- Confirm Test Catalog v2.5 (OGC-759) timeline for `test_reagent_link` + the Reagents tab — M-12's picker depends on that definition existing.

---

## 12. References

- [V2 baseline](amr-micro-v2-amendments.md) Microbiology functional baseline
- [V2 case](amr-micro-v2-amendments.md#fr-17.6) Case Workbench Core (inoculation section consumes the shared `ReagentLotPicker`)
- [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry & Interpretation (AST Setup consumes the shared `ReagentLotPicker`)
- Test Catalog v2.5 (`test-catalog-requirements-v2.5.md` Reagents tab placeholder)
- `FRS_Reagent_Forecasting.md` (parked spec, unblocked by M-12)
- `project_reagent_test_catalog_link` memory
- ISO 15189 §7.3 — Examination Processes / Equipment, Reagents, and Consumables
