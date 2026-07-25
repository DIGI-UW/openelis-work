# Test Catalog — QC Targets & Detection Limits (LOD/LOQ) — Functional Requirements Specification

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** Test Catalog unified editor (OGC-949 v2.5 scaffold) → new **QC Targets** section leaf; LOD/LOQ fields extend the existing **Sample & Results** section. Section key `qcTargets`; exact URL follows the shipped editor's section routing — verify against the live editor before implementation (editor scaffold M2, `/MasterListsPage/…` shell).
**SideNav (editor-internal, flat list):** … Methods → Ranges → **QC Targets** (new, after Ranges) → Sample Storage …
**Breadcrumb:** Home / Admin / Test Catalog / [Test name] / QC Targets
**Related surfaces:** Results Entry R6 control capture (consumes targets for prefill — owned by the Results Entry FRS), Manual/RDT QC persistence (OGC-1147 — stores captured results against these targets), QC Lot Management under the QA menu (owns `qc_control_lot` records; this section links to lots, never creates them)
**Companion artifacts:** `test-catalog-qc-targets-preview.html` (HTML preview, this design); `manual-rdt-qc-persistence-frs.md` §B; `results-entry-multicomponent-frs.md` FR-D3/D4; `westgard_rules_implementation.md` (control lot model)
**Related Jira:** OGC-949 (Test Catalog program — parent), OGC-1147 (persistence, Samuel), OGC-1025 (capture UI, R6), OGC-775 (result expanded uncertainty — distinct field, see Scope boundaries)

---

## Lab Context

### Current State
When a bench technician runs a control before a manual assay — say a glucose control on a HemoCue, or a hemoglobin control material — the acceptable answer lives on a piece of paper: the control manufacturer's package insert, or a hand-written card taped near the bench, stating something like "Level 2: 5.5 ± 0.4 mmol/L". The tech measures the control, glances at the card, and decides pass or fail in their head. When the Results Entry redesign ships its control capture, the tech will type both the measured value *and* that expected value ± tolerance into the form for every single run, because OpenELIS has nowhere to store what the acceptable range for a control actually is.

Separately, quantitative methods have detection limits: below some concentration the method cannot quantify (limit of quantification, LOQ) or even detect (limit of detection, LOD). Today techs type results like "<0.0033" as literal text because the catalog doesn't know the test's limits — the "less than" convention lives in each tech's head and each lab's SOP (standard operating procedure).

### Pain
Typing the expected value and tolerance on every control run is slow and error-prone in exactly the way QC is supposed to prevent: a tech who mistypes the target as 5.9 instead of 5.5 will pass a failing control, and nothing in the system can notice, because the system never knew the real target. Different techs on different shifts can use different targets for the same control level if the bench card is stale. And free-text "<0.0033" results are unparseable — reports can't render them consistently, trend calculations silently skip them, and two techs may write "<0.003", "<0.0033", or "BLQ" for the same situation.

### What Changes
The lab's quality officer (or whoever manages the test catalog) enters each test's QC targets once, in the Test Catalog editor: expected value and tolerance (±) per control level (Low / Normal / High), with an optional override for a specific control lot when a new lot's insert differs from the level default. From then on, the Results Entry control form arrives pre-filled with the right target — the tech enters only the measured value, and pass/fail is computed against the configured target, not a bench card. In the same editor, each result component gains LOD and LOQ fields, so "below the limit" becomes structured data the entry form and reports can handle uniformly instead of free-typed text.

---

## Overview

This FRS adds two things to the Test Catalog unified editor (OGC-949):

1. A new **QC Targets** section — a per-test table of control-level targets (expected value + uncertainty ±, or an expected qualitative outcome), each optionally overridable per control lot. Targets are the prefill source for Results Entry control capture (FR-D4 of the Results Entry FRS) and the comparison basis stored by the Manual/RDT QC persistence layer (OGC-1147 §B).
2. **LOD / LOQ fields on each result component** — two optional numeric fields in the existing Sample & Results per-component accordion, alongside unit and significant digits.

Configuration is always optional: a test with no QC targets still supports control capture with tech-entered values (persistence FRS FR-B2), and components without LOD/LOQ behave exactly as today.

**Navigation & URL.** QC Targets is a new leaf in the editor's flat internal SideNav, positioned after Ranges. It follows the editor scaffold's section routing and state conventions (selected section encoded per the shipped editor pattern; deep-linkable). LOD/LOQ adds fields inside the existing Sample & Results section — no navigation change.

## User Stories

- **As a quality officer (Test Catalog Manager),** I want to record each test's control targets (expected value ± tolerance per level) once in the catalog, so techs stop re-typing them from bench cards on every QC run.
- **As a quality officer,** when a new control lot arrives whose insert states different values, I want to add a lot-specific override without touching the level default, so the next run against that lot prefills correctly.
- **As a bench technician,** I want the Results Entry control form pre-filled with the right expected value and tolerance for the level and lot I'm running, so I only enter the measured value.
- **As a lab supervisor,** I want pass/fail on manual QC computed against a configured target rather than whatever a tech typed that day, so QC decisions are consistent across shifts.
- **As a quality officer,** I want to record each component's LOD and LOQ, so below-limit results are structured data instead of free-typed "<" text.

---

## Functional Requirements

### A. QC Targets section (new editor leaf)
- **FR-A1.** The Test Catalog editor gains a **QC Targets** section for the open test, positioned in the flat SideNav after Ranges. It renders a table with one row per **control level** (Low / Normal / High), columns: Level, Expected value, Uncertainty (±), Unit (read-only, from the test/primary component), Lot overrides (count *and* lot names when present), Status.
- **FR-A2.** For a **quantitative** test, a level's target is *expected value* (numeric) + *uncertainty* (±, numeric ≥ 0). For a **qualitative** test, the target is an *expected outcome* selected from the test's dictionary result values; the value/uncertainty inputs are replaced by that select.
- **FR-A3.** Levels are optional and independent — a lab may configure only Normal, or all three. An unconfigured level row shows an empty state ("No target configured — techs enter values at capture") and an **Add target** action.
- **FR-A4.** Editing uses **inline row expansion** (no modal). The expanded panel contains the target fields and the lot-override list (FR-B).
- **FR-A5.** Targets are never hard-deleted: a target row can be **Deactivated / Reactivated**; the table hides deactivated rows by default with a **"Show deactivated"** toggle.
- **FR-A6.** For a multi-component test, v1 targets apply to the **primary component** (the reported result). Per-component targets are out of scope (see Out of scope) but the data model reserves the association.

### B. Per-lot overrides
- **FR-B1.** Inside a level's expanded row, a **Lot overrides** list shows any lot-specific targets: Lot (name + lot number), Expected value, Uncertainty, Active-from/to (read-only, from the lot record), Status.
- **FR-B2.** **Add override** opens an inline row whose lot picker is a **typeahead ComboBox over existing `qc_control_lot` records** for this test (filtered to the row's level). Lots are *linked, never created here* — an empty result offers a link out to QC Lot Management, then return.
- **FR-B3.** Override rows follow the same deactivate/reactivate rule as level targets (FR-A5).
- **FR-B4.** **Prefill precedence** (consumed by Results Entry FR-D4 via OGC-1147): lot-specific override → level default → blank (tech enters manually). The section header states this rule in helper text so admins understand what the table drives.

### C. LOD / LOQ on result components (Sample & Results section)
- **FR-C1.** Each result component in the Sample & Results per-component accordion gains two optional numeric fields: **LOD** (limit of detection) and **LOQ** (limit of quantification), displayed alongside unit and significant digits. Quantitative components only; hidden for dictionary/qualitative components.
- **FR-C2.** Validation: both ≥ 0; if both provided, **LOD ≤ LOQ**; blank means "not tracked" and changes nothing downstream.
- **FR-C3.** Values are stored per component (`test_result_component`) and serialized on the component API, available to downstream consumers (Results Entry below-limit affordance, report rendering of "<LOQ"). Those consumers are separate stories — this FRS delivers capture + storage + API only.

### D. Consumption contract (what other features read)
- **FR-D1.** The persistence layer (OGC-1147) reads the effective target (per FR-B4 precedence) at capture time and stores a snapshot of expected value + uncertainty on the QC result record — so later target edits never rewrite the history of past runs.
- **FR-D2.** Target configuration changes are ordinary catalog audit events (user + timestamp, standard `lastupdated`/`sys_user_id` columns) and appear in the editor's existing audit surface.

## Data Model

**New table `test_qc_target`** (Liquibase, additive):

| Column | Type | Notes |
|---|---|---|
| `id` | numeric | seq |
| `test_id` | FK → TEST, NOT NULL | |
| `component_id` | FK → test_result_component, nullable | null = primary component (v1 always null) |
| `control_level` | varchar CHECK (`LOW`,`NORMAL`,`HIGH`) | |
| `qc_control_lot_id` | FK → qc_control_lot, nullable | null = level default; set = lot override |
| `expected_value` | DECIMAL, nullable | quantitative |
| `uncertainty` | DECIMAL, nullable, ≥ 0 | quantitative (±) |
| `expected_dict_result_id` | FK → dictionary, nullable | qualitative expected outcome |
| `is_active` | boolean, default true | deactivate, never delete |
| `sys_user_id`, `lastupdated` | | standard audit columns |

Application-enforced uniqueness: one active row per (test, component, level, lot-or-null).

**Extended `test_result_component`:** `lod DECIMAL` nullable, `loq DECIMAL` nullable.

## Access

Editable by the roles that can already edit the Test Catalog (**Admin**, **Test Catalog Manager**) — QC Targets and LOD/LOQ are catalog configuration like Ranges. All other roles see the section read-only exactly as they see other catalog sections; the Results Entry prefill consumption requires no additional access. No new permission mechanism.

## Localization (new keys, en.json only)

| Key | EN |
|---|---|
| `admin.testCatalog.qcTargets.section.label` | QC Targets |
| `admin.testCatalog.qcTargets.column.level` | Control level |
| `admin.testCatalog.qcTargets.column.expected` | Expected value |
| `admin.testCatalog.qcTargets.column.uncertainty` | Uncertainty (±) |
| `admin.testCatalog.qcTargets.column.unit` | Unit |
| `admin.testCatalog.qcTargets.column.overrides` | Lot overrides |
| `admin.testCatalog.qcTargets.level.low` | Low |
| `admin.testCatalog.qcTargets.level.normal` | Normal |
| `admin.testCatalog.qcTargets.level.high` | High |
| `admin.testCatalog.qcTargets.expectedOutcome.label` | Expected outcome |
| `admin.testCatalog.qcTargets.addTarget` | Add target |
| `admin.testCatalog.qcTargets.addOverride` | Add lot override |
| `admin.testCatalog.qcTargets.lot.label` | Control lot |
| `admin.testCatalog.qcTargets.lot.placeholder` | Search control lots… |
| `admin.testCatalog.qcTargets.lot.emptyLink` | No lots found — manage lots in QC Lot Management |
| `admin.testCatalog.qcTargets.empty.level` | No target configured — techs enter values at capture |
| `admin.testCatalog.qcTargets.helper.precedence` | At results entry, the control form prefills from the lot override if one exists, otherwise the level default. |
| `admin.testCatalog.qcTargets.showDeactivated` | Show deactivated |
| `admin.testCatalog.qcTargets.deactivate` | Deactivate |
| `admin.testCatalog.qcTargets.reactivate` | Reactivate |
| `admin.testCatalog.sampleResults.lod.label` | LOD |
| `admin.testCatalog.sampleResults.loq.label` | LOQ |
| `admin.testCatalog.sampleResults.lod.helper` | Limit of detection (optional) |
| `admin.testCatalog.sampleResults.loq.helper` | Limit of quantification (optional) |
| `error.testCatalog.qcTargets.uncertaintyNegative` | Uncertainty must be a non-negative number. |
| `error.testCatalog.sampleResults.lodGtLoq` | LOD cannot be greater than LOQ. |

Reuse existing keys for Save / Cancel / Edit buttons and status tags — do not mint duplicates.

## Validation rules

| Field | Rule | Error key |
|---|---|---|
| Expected value | Required to save a quantitative target | (standard required) |
| Uncertainty | Required with expected value; ≥ 0 | `error.testCatalog.qcTargets.uncertaintyNegative` |
| Expected outcome | Required to save a qualitative target | (standard required) |
| Lot (override row) | Required; must be an existing active lot for this test | (standard required) |
| LOD / LOQ | Each ≥ 0; LOD ≤ LOQ when both set | `error.testCatalog.sampleResults.lodGtLoq` |

## Dependencies

- **`qc_control_lot`** (Westgard Phase 2 / OGC-682) must exist for lot overrides; the level-default targets have no lot dependency and can ship against an empty lot table.
- **OGC-1147** (Manual/RDT QC persistence) consumes targets; its D1 decision does not change this FRS — the prefill contract (FR-B4, FR-D1) is stable either way.
- **`test_result_component`** (OGC-949 M1) must exist for LOD/LOQ columns — it is already shipped.
- Declared new data: `test_qc_target` table, `test_result_component.lod/loq` columns (per design-addendum MUST A).

## Scope boundaries

- **Distinct from OGC-775** (result expanded uncertainty): that is the *measurement uncertainty of a reported patient/sample result*, entered at Results Entry. This FRS's uncertainty is the *tolerance around a QC control target*, entered in the catalog. Different fields, different tables; do not merge.
- **QC Lot Management** (QA menu) owns lot lifecycle. This section links to lots only.

## Out of scope

Per-component QC targets for multi-component tests (data model reserves `component_id`); below-limit entry affordance in Results Entry and "<LOQ" report rendering (separate consumption stories); Westgard statistics establishment (targets here feed the "fixed values" mode via OGC-1147 D3); blanks/duplicates QC types; EQA.

## Acceptance criteria

- [ ] QC Targets section appears in the editor SideNav after Ranges for every test; table shows Low/Normal/High rows with configured state or empty state.
- [ ] Quantitative targets capture expected value + uncertainty; qualitative targets capture an expected dictionary outcome; inline row expansion editing throughout, no modals.
- [ ] Lot override rows link existing `qc_control_lot` records via typeahead; lots are never created from this section; empty search links out to QC Lot Management.
- [ ] Prefill precedence (lot override → level default → blank) is documented in section helper text and honored by the target-resolution API consumed by OGC-1147/R6.
- [ ] Targets deactivate/reactivate (no hard delete); deactivated rows hidden by default with a Show-deactivated toggle.
- [ ] LOD/LOQ fields appear per quantitative component in Sample & Results; validation LOD ≤ LOQ; values serialized on the component API.
- [ ] All new strings via the i18n keys above (en.json only); no hardcoded English.
- [ ] All schema changes via additive Liquibase changesets.
