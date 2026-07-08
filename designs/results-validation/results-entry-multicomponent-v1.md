# FRS — Multi-Component Result Entry **V1** (minimum support)

**Program epic:** OGC-949 (Test Catalog Management v2.5) — consumes the result-component model
**Status:** Draft — dev-ready (intended to be handed to Claude Code)
**Scope:** V1 — let a test capture **more than one result component**, additively, on the **current**
Results Entry & Validation pages, by **reusing the existing result-entry elements** once per component.
**First use case:** molecular target gene + Ct (PCR). Replaces the PR #3831 scalar-column approach — no
new `analysis`/`test` columns, no deployment branch, no data migration.

---

## Lab Context

### Current State
A test in OpenELIS produces **one** result today: the results page shows a single result field per
analysis. But some tests naturally report several values at once. A Molecular Biology PCR assay is the
motivating case: one Cepheid GeneXpert cartridge amplifies several **target genes** (probes) and reports
a **Ct** (cycle threshold — the PCR cycle at which the signal is detected; lower Ct = more genetic
material) for each, alongside the overall call. Xpert MTB/RIF (tuberculosis) reports an MTB detection
call, a rifampicin-resistance call, and five *rpoB* probe Cts; Xpert Xpress SARS-CoV-2 reports a call
plus N2 and E gene Cts. Today only the single overall call is stored; the other values live on the
instrument printout or on paper.

### Pain
There is nowhere in OpenELIS to record the several values a multi-component test produces. A tech running
Xpert MTB/RIF can enter one result (the call) but not the five probe Cts behind it, so a "very low"
result isn't reproducible or auditable, and viral-load Cts can't be trended. This isn't unique to
molecular — any test that reports multiple values hits the same wall.

### What Changes
A test can define multiple **result components**. On the results page, each component gets its own
result-entry field — the **same field the primary result uses today**, chosen by the component's result
type (a dropdown for a select result, a numeric box for a numeric result, etc.), with its own unit and
normal range. The tech enters every value; the validator sees them all; the report can print them.
Single-result tests are completely unchanged.

---

## Overview

OGC-949 M1 shipped a result-component model (`test_result_component`): a test can own one or more
components, each a labeled value field with a `result_type`, unit, significant digits, display order, and
per-component ranges. Every legacy test was backfilled with exactly one `PRIMARY` component, so today's
single-result behavior is just "one component."

V1 turns that latent model into **actual multi-value capture** with the smallest possible change: on the
current Results Entry page, render **one result-entry field per component**, each produced by the
**existing result-cell renderer** (the `resultType` switch already used for the primary result), and
persist a value per component. The first component is the primary result, rendered exactly as today; the
additional components mirror it. Molecular target/Ct is the first use case — numeric components whose unit
is "Ct" — but nothing is specific to Ct or genes; this is generic multi-component support.

This replaces PR #3831 (`analysis.target_gene` / `ct_value` / `test.supports_target_gene_ct`): no scalar
columns, so the deployment that needs molecular capture now lands directly on the durable model — no
branch, no later migration.

### Where it plugs into the current page (reuse, don't rebuild)

- The Results page is `SearchResultForm.jsx`, a `react-data-table-component` grid. Columns
  (Sample Info · Test Date · Analyzer Result · Test Name · Normal Range · Accept · Result · Current
  Result · [Reject] · Notes) are **unchanged**.
- The result cell already renders a widget by `row.resultType` — Select for `"D"`, numeric
  `TextInput type=number` for `"N"`, `TextArea` for `"R"`/`"A"`, multi-select for `"M"`/`"C"`. **V1
  reuses this exact renderer**, once per component. No new result widgets are built.
- For a multi-component analysis, each component is a **result line that mirrors the primary** — the
  primary line as today, additional components as sibling lines carrying the component label, its normal
  range, its result widget (by the component's `result_type`), and its notes.
- Configuration of components already exists in the Test Catalog editor's **Sample & Results** section.

No new route, SideNav item, or breadcrumb. (Verify routes against the live app.)

---

## Non-Breaking Compatibility Contract ("will we break what's there?")

Every point is a guarantee mapped to an acceptance criterion.

- **NB-1 One component = today.** A test with a single (`PRIMARY`) component renders **identically to
  today** — one result line, same widget, same columns.
- **NB-2 Reuse the same elements.** Additional components render through the **existing result-cell
  renderer** (the `resultType` switch) — the same Select/Numeric/Text/Multi-select widgets, plus the
  existing normal-range and notes cells. No new widgets, no new columns.
- **NB-3 Additive read model.** The results-load payload gains a `components` array per analysis; a
  single-component analysis returns exactly one (its PRIMARY), so existing consumers see no change.
- **NB-4 Untouched primary path.** The primary component reads/writes through the existing result path.
  Additional components persist through a **new nullable component linkage** on the stored result.
- **NB-5 No new required fields / flags.** No feature flag; no non-null columns; number of components is
  the only thing that varies.
- **NB-6 Backward-compatible APIs.** Result load/save contracts gain optional per-component fields only.
- **NB-7 Regression gate.** Existing Results Entry and Validation suites pass unchanged; new tests cover
  the multi-component path (see Regression Guardrails).

---

## User Stories

- As a **lab technician (Analyst)**, I want to enter a result for **each component** of a multi-component
  test using the same fields I already use, so I can record every value the test produces (e.g. an MTB
  call plus five probe Cts).
- As a **validator**, I want to see every component's result read-only in the same layout, so I can
  confirm the full result before release.
- As a **Test Catalog Manager**, I want multi-component tests (e.g. stock GeneXpert PCR tests) to have
  their components already defined, so capture works without per-lab setup.
- As an **existing user of a single-result test**, I want results entry and validation to look and behave
  exactly as before.

---

## Functional Requirements & Acceptance Criteria

### A. Multi-component capture (Results Entry)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-1 | For an analysis whose test defines N result components, results entry renders N result-entry fields, one per component, in the component `display_order`. | A test with 3 components renders 3 result fields in order; a test with 1 component renders exactly 1 (unchanged). |
| FR-2 | Each component's result field is produced by the **existing result-cell renderer**, chosen by that component's `result_type` (D → single-select of its options; N → numeric input; R/A → free text; M/C → multi-select). | The widget for each component matches what the primary result renderer produces for that `result_type`; no bespoke widget is introduced. |
| FR-3 | Each component field shows the component's label, applies its unit and significant digits, and shows its own normal range where configured. | Component label rendered; numeric formatting uses the component's `significant_digits`; the Normal Range shown is the component's. |
| FR-4 | The first/primary component renders exactly as the result does today. | Byte-identical rendering + save path for the primary component vs. current behavior. |
| FR-5 | Entered values save per component and survive reload. | POST persists each value keyed to its `component_id`; GET after reload restores each into its field. |
| FR-6 | Numeric components tolerate the same input the primary numeric result does (including qualitative entries where the field allows) and apply range validation only where the component defines bounds. | Same validation behavior as the existing numeric result cell, per component. |
| FR-7 | An empty component value renders blank everywhere — never a fabricated 0. | Null/empty → empty field on entry, blank on validation/report. |

### B. Display (Validation + Report)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-8 | Validation shows every component read-only, in display order, in the same layout as entry. | Each component rendered read-only; order matches `display_order`. |
| FR-9 | The patient report prints each component's result for multi-component tests, and is unchanged for single-component tests. | Report renders a line per component when >1 exists; unchanged output otherwise. |

### C. Catalog data (pre-seed — molecular first use case)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-10 | Stock GeneXpert PCR tests ship with their components pre-seeded (e.g. MTB/RIF → MTB call, RIF call, rpoB A–E numeric with unit "Ct"; SARS-CoV-2 → call, N2, E). Admins can add/edit/reorder/deactivate. | Migration seeds the curated set idempotently, keyed on a stable test identifier, no-op where the test is absent; re-running adds no rows; each seeded component has a non-null `code`. |
| FR-11 | Each component is identified by its `code` (unique per test); a LOINC/terminology code is optional, present only where a standard one exists. | `code` unique within test; LOINC nullable; no dependency on LOINC being set. |

---

## Information & Data

- **Result component** *(exists — `test_result_component`)*: `code` (unique per test), `label`,
  `result_type`, `uom_id` (unit), `significant_digits`, `display_order`, per-component ranges
  (`result_limits.component_id`), `is_active`. A test's set of components is what drives how many result
  fields render.
- **Per-component result value** *(new at runtime)*: the value entered for a component on an analysis,
  stored via a **nullable component linkage** on the result. **Storing more than one value per analysis
  is the one genuinely new capability** — today every analysis stores exactly one result (its PRIMARY
  component). V1 is the first consumer (see Dependencies).
- **result_type** *(exists)*: the existing D/N/R/A/M/C set — reused as-is to pick each component's widget.
- **No new columns on `analysis` or `test`.** Explicitly not the #3831 model. "Ct" is a unit value, not
  a column.

---

## Access

- **Analyst** enters/edits component results on Results (change); **Validator** views read-only + releases
  on Validation; **Test Catalog Manager** defines components. Existing roles, existing workflows, no new
  permission mechanism.

---

## Localization

Column headers already exist and are reused (`column.name.result`, `column.name.normalRange`,
`column.name.notes`, `column.name.testName`, etc.). New keys are generic (not Ct-specific); per-component
labels come from the component's own label via the existing localization mechanism.

| Key | English fallback | Context |
|---|---|---|
| `label.results.component` | Component | Generic label for a component result line where needed |
| `label.results.componentResult` | Result | Aria/label for a component's result field |

(Molecular labels like "N2 gene" or "rpoB Probe A", and the unit "Ct", are data on the components — not
localization keys in this feature.)

---

## Dependencies

- **Runtime per-component result value (critical path).** Storing >1 value under an analysis is new — V1
  is the first consumer. Additive & nullable (defaults to the PRIMARY component = today's behavior).
  Worth a short spike to fix the shape before sizing; it gates the timeline.
- **Reuse (built):** the existing result-cell renderer in `SearchResultForm.jsx` (the `resultType`
  switch), the normal-range/notes cells, the results-load payload, and the save path (`testResult[id].*`
  field pattern + the LogbookResults whitelist — the same touch-points PR #3831 modified, here extended
  per component instead of adding scalar columns); `test_result_component` + Test Catalog Sample & Results
  editor (OGC-949 M1/M5); per-component ranges; unit-of-measure master.
- **Pre-seed curation (molecular):** the component set per stock PCR test (calls + probe/target numerics +
  units). Target sets are fixed per cartridge; source from the GeneXpert profile + Cepheid inserts; review
  with the molecular lead before seeding.

---

## Regression Guardrails (for Claude Code)

- Existing Results Entry and Validation suites pass **unchanged**.
- Add tests: (a) single-component test renders one result line with an unchanged payload; (b) an N-component
  test renders N fields in `display_order`, each using the widget its `result_type` dictates; (c) each
  component value round-trips through save/reload keyed to its `component_id`; (d) saving a non-primary
  component does not alter the primary result; (e) the pre-seed migration is idempotent and no-ops when a
  target test is absent.
- Keep the per-component render+save as a **self-contained module** so it can later move into the OGC-811
  v4 inline panel without a rewrite.

---

## Out of Scope (V1)

- The OGC-811 v4 / OGC-817 redesign and folding this into the v4 inline panel (that is the V2 fold-in).
  V1 lives on the current pages and does not depend on the redesign.
- Automatic analyzer ingestion of per-component results (separate story — import resolves to the primary
  result today; component-level ingestion comes later).
- Deriving a call from component values; reflex/calc rules on component thresholds.
- Any change to NCE, reagents/QC, reference ranges, critical-ack, or cross-domain behavior — untouched.
- Report template redesign beyond printing each component where components exist (first target: the CILNSP
  reduced patient report; others as prioritized).

---

## Suggested slices (developer owns final breakdown)

Each slice is a reviewable PR; dependency-ordered.

1. **Runtime per-component result value** (backend, additive/nullable) + the molecular pre-seed migration
   (FR-10/11) — unblocks everything; ships with tests proving single-component (PRIMARY) behavior is
   unchanged.
2. **Multi-component capture on Results Entry** (FR-1…FR-7) — render one existing result widget per
   component + per-component save.
3. **Validation + report display** (FR-8, FR-9) — read-only rendering per component.

(Analyzer ingestion and the OGC-811/817 fold-in are separate, later stories.)
