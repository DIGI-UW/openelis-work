# Runs: the shared unit of QC, reagent lot and result review

## Functional Requirements Specification

**Status:** Approved for handoff (v0.2, 2026-09-09; v0.2 adds FR-E10 per-row write detail and FR-E11 bulk accept summary)
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Owns:** the run model, its three creation paths, the run header on the Results worklist, the worklist's run-aware row states, the per-test QC gate, and the consumption contracts other features rely on.
**Supersedes in part (see Supersession notes at the end):** Analyzer Results Import v2 (`designs/system/analyzer-import-redesign-v2.md`, OGC-288); Results Entry multicomponent (`designs/results-validation/results-entry-multicomponent.md`, OGC-811) section D; Batch Workplan reagent QC (`designs/quality/batch-workplan-reagent-qc.md`, OGC-427); Manual and RDT QC persistence (`designs/quality/manual-rdt-qc-persistence.md`, OGC-1147) FR-C1 scope.
**Does not change:** Analyzer Manual QC Recording (`designs/quality/analyzer-manual-qc.md`, OGC-428), which stays instrument-level and outside the run model.
**Related Jira:** OGC-288, OGC-1137, OGC-811, OGC-1025, OGC-1147, OGC-427, OGC-428, OGC-1178, OGC-949 (QC Targets section), OGC-682 (Westgard / QA menu), OGC-1131 (multi-component).
**Companion artifact:** `runs-preview.html` (interactive HTML preview of the worklist states and the run header).

---

## Lab Context

### Current State

A clinical laboratory produces results three ways. An instrument (an "analyzer", such as a chemistry or hematology machine, or a GeneXpert for tuberculosis) runs a rack of patient samples together with one or more control samples and sends everything to OpenELIS as one message. A technician works a batch of samples by hand at the bench, for example twelve hemoglobin readings on a HemoCue with one control material run first, planned in advance on a workplan. Or a technician does a single manual test as it arrives, most often a rapid diagnostic test (RDT) for HIV, malaria or syphilis, where the "control" is a line on the strip that must appear for the result to count.

In each case the same three facts describe the work: which reagent lot or cartridge lot was used, whether the control passed, and who did it and when. Today OpenELIS has a different home for each case. Analyzer messages are reviewed on a dedicated Analyzer Results Import page that extracts the controls and gates the patient results on them. Workplan batches record a reagent-lot control in a Batch Workplan feature, but the patient results entered for the batch are not tied to that control. Single manual results are typed into the Results Entry worklist row by row, with the lot and control (where recorded at all) typed again on every row. The technician's worklist, the page they live in all day, does not know that an instrument has already produced a value for a pending test, nor that a control failed on the run it came from.

### Pain

A technician looking at the Results worklist sees a pending glucose for sample 24-00817 and cannot tell that the chemistry analyzer reported it forty minutes ago and the value is sitting in an unreviewed message on another page. A supervisor cannot answer "is every bench safe to report today" from one screen, because analyzer QC lives on the import page, batch QC lives in the workplan, and RDT controls live in a paper register. When a control fails on a manual batch of twelve hemoglobins, nothing in the system connects that failure to the twelve patient results, so they can be released. When twenty malaria RDTs are entered one after another from the same kit, the technician either retypes the lot and control twenty times or, more often, stops recording them. Accreditation assessors (SLIPTA, ISO 15189, which require documented quality control for every examination procedure, not only instrument-based ones) are shown a screen for analyzer tests and a binder for everything else.

### What Changes

Every result belongs to a run. A run is the set of results that share one method or instrument, one reagent lot, one control check, one operator and one moment. An analyzer message creates a run when it arrives. A workplan batch is a run declared before the results exist. A single manual result entered on the worklist is a run of one, created when the technician saves. Controls, the reagent lot and the QC verdict belong to the run, and the run's verdict is evaluated per test it covers: a failed potassium control holds the potassium results in that run and nothing else.

The technician stays on the Results worklist. A row whose value is waiting in an unreviewed analyzer run says so and links to it. A row in a run whose control failed is visibly held and cannot be resulted around the hold. Opening a run shows the same worklist rows under a run header: the controls and their verdicts, the lot and its provenance, and any records the system could not match, all on the page the technician already uses. A supervisor sees a Runs count and a Held count on the same filter bar. Twenty RDTs from one kit can be batched from the worklist in one action, recorded against one control, and the paper register becomes a report.

---

## Overview

This FRS introduces the run as the shared unit of quality control (QC), reagent-lot provenance and result review across the three ways results enter OpenELIS: analyzer messages, workplan batches, and single manual entries. It converges the Analyzer Results Import review onto the Results worklist as a run-filtered view with a run header, defines how the worklist shows results that are waiting in or held by a run, defines a per-test QC gate evaluated against each test's configured QC targets, and states the contracts consumed by the QC persistence layer (OGC-1147), Batch Workplan (OGC-427), the QC dashboard, and Validation.

The FRS is version-agnostic. It describes the whole capability; slicing happens in the handoff.

### Navigation & URL

- **SideNav placement:** `Workplan → Results` (unchanged; no new item). The Analyzers group (D-027) keeps its pages; the Analyzers list's per-row "Import" action deep-links to the run filter below.
- **Breadcrumb:** `Home / Workplan / Results`. The run id is rendered as the page subtitle when a run filter is active, not as a crumb, because a run is a filter on the worklist rather than a page.
- **URL route:** `/Results` (canonical worklist); `/Results?run=<runId>` (run-filtered view with run header). The legacy `/AnalyzerResults?id=<analyzerId>` redirects to `/Results` with the Runs chip pre-filtered to that analyzer. The generated `Results ▸ Analyzer` menu entries described in the Analyzer Results Lab Unit Access spec (OGC-1178) are retired; their access rule (D-043) is consumed by the Runs chip and the run filter instead. Verify the route and the redirect against the live app before build (design-addendum MUST C).

---

## User Stories

- **As a bench technician,** I want to see on my worklist that the analyzer has already reported a pending test and open that run from the row, so I stop switching between the worklist and a separate import page to find out why a result is still pending.
- **As a bench technician,** I want the reagent lot and control I record for a batch of manual tests to apply to every result in that batch, so I record them once instead of on every row.
- **As a bench technician,** when the control for a test fails on a run, I want only that test's results in that run to be held, so a bad potassium control does not stop me releasing the run's glucose results.
- **As a lab supervisor,** I want one count of runs waiting for review and one count of runs held on QC on the worklist I already watch, so I can answer "is every bench safe to report" without opening the QC dashboard or the import page.
- **As a quality officer,** I want every control, whether from an instrument, a batch or a single RDT, recorded against a run with its lot, operator and time, so documented QC covers every method the lab performs.
- **As a validation reviewer,** I want a held result to name the run and the control that held it, so I can see cause before deciding to release or reject.

---

## Functional Requirements

### A. The run

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | A run is a persisted record with: run id, source (ANALYZER, WORKPLAN, RESULT_ENTRY), lab unit, method (analyzer type or manual method), analyzer instance (when source is ANALYZER, or when a manual method is performed on a registered bench instrument), operator, time span (opened, last activity, completed), state, reagent lot(s) with provenance (analyzer-reported or selected), zero or more control records, and per-test verdicts. | The run is new information; see Dependencies. Storage is engineering's decision (OGC-1147 D1) and is constrained by OGC-1054 (see Dependencies). |
| FR-A2 | Every Result created or accepted after this ships references exactly one run. Results that predate the feature have no run and render without run affordances. | No backfill is required. |
| FR-A3 | A run has exactly four states: **Open** (rows may be added or dispositioned), **Held** (at least one covered test has a failed control, or a required control is missing under a Hold policy; that test's rows are blocked), **Complete** (every row dispositioned: accepted, rejected, retested or ignored; no rows may be added), **Superseded** (a Complete or Held run whose results were replaced by an accepted retest run). | Held and Open are mutually exclusive: a run with any active per-test hold is Held; when the last hold clears it returns to Open, or to Complete if all rows are dispositioned. |
| FR-A4 | A run's per-test verdict is one of: **Pass**, **Fail**, **No control**, **Not required**. Rows of a test with verdict Fail, or with No control under a Hold policy, are held. Rows of a test with No control under a Warn policy carry a warning and are not held. | Policy per FR-H. |
| FR-A5 | Run and control records are never deleted. A control recorded in error is corrected by recording a new control with a linkage to the one it corrects; both remain visible in the run's history. Runs are not deactivatable objects; they move to Complete or Superseded. | Design-addendum MUST D; matches the Westgard FRS audit model and OGC-1147 FR-A4. |
| FR-A6 | Every state transition, control recording, hold, release, Accept-despite, and supersession is written to the audit trail with user and timestamp, using one shared event vocabulary regardless of the run's source. | See Information & Data for the event list. |

### B. How runs come into existence

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Analyzer.** An incoming analyzer message creates one run with source ANALYZER, the analyzer instance, its type as the method, the analyzer's lab unit(s), and the analyzer-reported reagent or cartridge lot when the message carries one. Controls extracted from the message (per Import v2 FR-A1) become the run's control records; a verdict carried in the message (Import v2 FR-A4) is authoritative for that control. | Duplicate message detection per Import v2 G3 applies before a run is created: a duplicate message is skipped with a warning and does not create a run. |
| FR-B2 | **Workplan.** Creating a batch on the Workplan page creates one run with source WORKPLAN, the selected method, the lab unit, the operator, and the reagent lot the technician selects. The batch's control (per OGC-427) is the run's control record. The run stays Open while the technician results the batch's rows; it becomes Complete when the technician marks the batch complete or when its last pending row is dispositioned. | The Batch Workplan's existing screens are unchanged except that the objects they create and read are runs. |
| FR-B3 | **Results Entry, single row.** Saving a result on a worklist row that is not already in a run creates a run of one with source RESULT_ENTRY, the row's method and analyzer (if any), the row's lab unit, the current user, the reagent lot and the control entered in the row's Reagents, QC and Controls section, and the run is Completed in the same save. There is no separate "start a run" step. | The technician's experience of the row is unchanged from the Results Entry FRS section D; what changes is that the lot and control are stored on the run. |
| FR-B4 | **Results Entry, "Batch these".** On the worklist, selecting two or more pending rows of the same test (any samples) and choosing **Batch these** creates a WORKPLAN-source run for those rows, applies the `?run=` filter, and opens the run header with the control and lot fields ready to enter. Rows of different tests cannot be batched together in one action. | Reuses the Workplan batch creation service; no second batch concept. |
| FR-B5 | A run created from any source is scoped to one lab unit. An analyzer assigned to several lab units creates one run per message; the per-test verdicts and the lab-unit gating of rows follow D-043 inside that run. | No cross-lab-unit run object is introduced. |

### C. Controls and the per-test QC gate

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | A control record on a run carries: the test(s) it covers, control level (Low, Normal, High, or a single unlevelled control), control lot (linked, never created here), observed value or observed qualitative outcome, expected value and uncertainty or expected qualitative outcome (snapshotted from QC Targets at recording time, or entered by the technician when no target is configured), verdict (Pass, Fail), verdict source (analyzer-reported, computed from target, technician-declared), operator, timestamp. | Consumes the QC Targets prefill precedence (lot override, then level default, then blank) and OGC-1147 FR-B2 (configuration is never a prerequisite). |
| FR-C2 | A control covering a **quantitative** test is Pass when the observed value lies within expected plus or minus uncertainty; a control covering a **qualitative** test (including RDT control lines) is Pass when the observed outcome equals the expected outcome (for an RDT: Valid). Where the analyzer message carries its own verdict, that verdict is used and the computed comparison is shown alongside for information. No statistical (Westgard) evaluation happens on the run surface. | Import v2 FR-A4 and FR-A5 carried forward; Westgard belongs to the QC dashboard. |
| FR-C3 | One control may cover many tests (a chemistry Level 1 material covers every analyte it lists); one test may be covered by several controls (Level 1 and Level 2). The per-test verdict is Pass only if every control covering that test on the run is Pass; Fail if any is Fail; No control if none covers it. | The set of tests a control covers comes from the control lot's definition (Westgard `qc_control_lot`) or, for a manual control with no lot, the test the technician is recording it for. |
| FR-C4 | A **Fail** verdict on a test holds every row of that test in the run: the rows cannot be accepted, entered, edited or released from any surface, and each shows the hold reason. Rows of other tests in the same run are unaffected. | Replaces Import v2 FR-A2's whole-run block. |
| FR-C5 | A held test in a run offers three actions to a user with Results rights for the lab unit: **Retest** (the run's rows for that test are marked for retest; a later run covering the same samples surfaces a suggested, user-confirmed "retest of RUN-x" link and, once accepted, supersedes them); **Reject** (the rows are marked Rejected: QC, not released; filing a non-conformance event (NCE) is offered, not required); **Accept despite QC failure** (the rows become accepted with a mandatory NCE, auto-opened and pre-populated with run, analyzer or method, the failing control's observed versus expected, and the affected samples). | Import v2 G13 carried forward and scoped per test. No supervisor escalation until the RBAC revamp; the action is logged. |
| FR-C6 | Recording a passing control for a test whose verdict was Fail does not clear the hold by itself; the held rows stay held until dispositioned by FR-C5, because the original failing control still stands in the run's history. A technician who re-runs the control and it passes uses **Retest** and the new run carries the new control. | Prevents "run controls until one passes" on the same run. |
| FR-C7 | An analyzer-source run whose message carries no controls and whose covered tests have a Hold policy is Held with verdict No control until a control is recorded on the run (the technician may record a manual control against an analyzer run) or the rows are Rejected. Under a Warn policy the rows carry a warning and proceed. | Import v2 FR-A2 "no QC" case, made policy-driven. |

### D. The worklist knows about runs

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | The Results worklist filter bar gains a **Runs** chip showing two counts: runs Open for review and runs Held, for the selected lab unit and only for runs the user may see under D-043. Expanding the chip lists those runs (id, source, method or analyzer, opened time, rows reviewed of total, state) and selecting one applies the run filter. | Labels, not counts alone: the expanded list shows run identities (design-addendum convention). |
| FR-D2 | The worklist gains a **Held** filter chip, on by default, so held rows are never silently absent. Turning it off hides held rows; the chip keeps showing the count. | Addresses high-volume benches without hiding by default. |
| FR-D3 | A pending row whose analysis has a value waiting in an **Open** analyzer run shows a **Waiting in RUN-x** tag with the run's source and time, linking to `/Results?run=<id>` positioned on that row. The value is not shown on the unfiltered worklist and the row cannot be accepted or entered there. | Prevents a second accept path around the run gate. |
| FR-D4 | A pending row whose test is held in a run shows a **Held: QC failed in RUN-x** contrast tag (red, icon plus text), no value, Edit disabled, and cannot be manually resulted while the hold stands. The tag links to the run with the QC block in view. | Hold applies from every surface (FR-C4). |
| FR-D5 | A row in an Open WORKPLAN run shows a **Batched in RUN-x** tag; entering the result on that row records it into the run and inherits the run's lot and control. | The technician can work batched rows from the plain worklist or from the run view. |
| FR-D6 | Once a run is Complete or Superseded its rows carry a small run reference in the row's History section (id, source, control verdict at acceptance) and no tag on the worklist. | |
| FR-D7 | The row's **Reagents, QC and Controls** section (Results Entry FRS section D) describes the row's run: lot (with provenance), control(s) with verdict, run id and state. For a row not yet in a run it is the entry form that will create the run of one on save (FR-B3). For a row in a run, lot and control are read-only with a link to the run header, where they are edited for the whole run. | Supersedes the per-row scope of Results Entry FR-D1 to D4 while keeping the same fields and UI. |

### E. The run header (`/Results?run=<id>`)

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | With a run filter active, the worklist shows only that run's rows and renders a run header above the table with three blocks, in order: **QC**, **Run settings**, **Exceptions**. The header is a stack of Carbon Tiles; nothing in it is a modal. | Layout pattern: Workbench. |
| FR-E2 | The **QC** block shows the run's overall verdict (Pass, Held, No control, Not required), then one line per covered test with its verdict and, expanded inline, each control covering it with observed versus expected, level, lot, verdict source, operator and time. For a held test the FR-C5 actions appear on that test's line. A **Record control** action opens an inline form (same fields as Results Entry FR-D3) to add a control to the run. | Replaces Import v2's QC-first panel and the QA/QC sidebar's current-run status. |
| FR-E3 | The **Run settings** block shows source, method, analyzer instance (with its instrument-level Manual QC status line from OGC-428 when the source is an analyzer), lab unit, operator, opened and last-activity times, state, and the reagent lot(s). An analyzer-reported lot is read-only and tagged as such; otherwise the lot is selected from inventory with a **Use last-used lot** shortcut and expiring or expired lots flagged. Nothing is pre-selected (no first-in-first-out auto-pick). | Import v2 FR-B1, FR-B2 and G7 carried forward. Lot capture is required only when the deployment's reagent-lot gate is on. |
| FR-E4 | The **Exceptions** block lists the run's unresolved records in three kinds: unmatched sample (lab number unknown), unordered test (accession resolves, test not ordered), unmapped code or target. Each is resolved inline (type-ahead accession search; "Map now" deep-link to Analyzer Types & Mapping; Hold or Ignore with reason). An exception blocks only its own record. The block is hidden when the run has no exceptions. | Import v2 FR-D and FR-J and G8 carried forward unchanged. |
| FR-E5 | The header shows review progress ("12 of 40 rows dispositioned") and a **Mark complete** action for WORKPLAN runs; ANALYZER runs complete automatically when the last row is dispositioned. Partial acceptance is allowed and the run stays Open with the remaining count. | Import v2 G2 carried forward. |
| FR-E6 | Rows under the header are the standard worklist rows with the run's provenance: analyzer-reported values render read-only with Accept, Retest, Ignore and, on duplicates, Keep / Replace / Ignore; manual rows in a WORKPLAN run render the normal entry panel. Default sort is exceptions and held first, then critical, abnormal, normal; the filter chips (All, Needs review, Critical, Abnormal, Exceptions, Normal) carry live counts. | Import v2 FR-C, G2, G3, G11 carried forward. Value corrections after accept happen through the row's normal edit-state machine and, after release, the correction workflow. |
| FR-E7 | Accepting a row that carries a critical value creates the pending-acknowledgment Alerts task and audit event exactly as Results Entry does; acceptance is not blocked. | Import v2 G6; Critical Result Acknowledgment spec. |
| FR-E8 | A read-only **View raw** action is available per analyzer row (the record or segment) and per analyzer run (the message or file). | Import v2 G10. |
| FR-E9 | Concurrency follows Results Entry FR-O1 to O3: per-row optimistic save, stale-page guard, and a passive "in review by X" indicator on the run and on rows another user has open. | Import v2 G12. |
| FR-E10 | **What this row writes.** Expanding an analyzer row in a run shows, before any action, exactly what Accept will record: every result component with its value and unit (a multi-component test lists the primary call first and each target value beneath it in `display_order`, reusing the Results Entry component renderer), the test and component each value maps to, the unit check outcome, the flags that will be raised (critical, abnormal, delta), the reagent lot that will attach, the run reference, and whether an existing result will be kept or replaced. A blank component renders blank, never a fabricated zero. | Makes Import v2 FR-C2 and G5 visible on the row. |
| FR-E11 | **Bulk accept summary.** Selecting one or more rows in a run shows an inline summary bar above the table (a Tile, not a modal) stating what the batch action will do: count to accept, breakdown by flag (normal, abnormal, critical with the acknowledgment tasks that will be created), rows that will be skipped and why (already resulted, held, exception unresolved), and the lot that will attach. The Accept, Retest and Ignore actions live on the bar; the bar updates live as the selection changes. "Select all normal" selects only rows with no flag, no duplicate and no hold. | Replaces tick-and-go; toast plus Undo (G9) remain after the action. |

### F. Cross-domain

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | The run header and tags follow the worklist's domain treatment derived from the selected Lab Unit: environmental and vector runs show site or trap context instead of patient confirmation and regulatory limits instead of reference ranges. The Domain enum is CLINICAL, ENVIRONMENTAL or VECTOR; no other value is introduced. | Results Entry FR-M; D-004. |

### G. What other features read from a run (consumption contracts)

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **QC persistence (OGC-1147).** Every control recorded on a run is a source-typed QC result (ASTM or analyzer, MANUAL, RDT) with the run id; the QC-fail signal's scope is the run and the covered test, replacing "same test, lab unit and session window". Quantitative manual controls remain eligible for the statistics store per OGC-1147 D1 and D3. | |
| FR-G2 | **QC dashboard and Manual QC leaf.** The dashboard's Source filter and the Manual QC view (OGC-692 made real by OGC-1147) list runs and their controls; a run reference from the dashboard opens `/Results?run=<id>`. | |
| FR-G3 | **Validation.** A held row surfaces on the Validation page with the run id and the failing control as its hold reason, consuming the QC-fail signal as already specified for Validation V1. | |
| FR-G4 | **Batch Workplan (OGC-427).** The batch is the run; its reagent QC is the run's control; its results reference the run. No parallel batch record. | |
| FR-G5 | **Reagent inventory.** Each accepted result in a run produces one reagent consumption event carrying the run's lot, as today; auto-consume from the Test↔Reagent link is unchanged. | D-037. |
| FR-G6 | **Non-conformance (NCE).** Accept-despite files an NCE pre-populated from the run (FR-C5); Reject offers one. The NCE carries the run reference. | |

### H. Configuration

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | The Test Catalog editor's **QC Targets** section gains a small policy block per test: **Control required per run** (Yes / No, default No) and **When a required control is missing** (Warn / Hold, default Warn). Edited by the roles that edit QC Targets. | Extends the QC Targets FRS; no new admin page. |
| FR-H2 | An analyzer-source run whose message carries a verdict for a test satisfies that test's control requirement. | |
| FR-H3 | No run-timeout or auto-close is configured in v1; runs close by the rules in FR-A3. | If a timeout is ever needed, reuse OGC-428's DAILY / PER_SHIFT / CUSTOM_HOURS rule rather than inventing one. |

---

## Information & Data

Described as information, not storage. Items marked **new** are declared in Dependencies.

- **Run (new).** Identity, source (ANALYZER, WORKPLAN, RESULT_ENTRY), state (Open, Held, Complete, Superseded), lab unit, method, analyzer instance, operator, opened / last activity / completed times, reagent lot references with provenance, supersedes / superseded-by links, review progress (derived). One run per analyzer message, per workplan batch, per single manual save.
- **Control record on a run (new as a run-linked record; the source-typed QC result itself is OGC-1147's).** Covered tests, level, control lot reference (Westgard `qc_control_lot`, existing), observed value or outcome, expected value and uncertainty or expected outcome (snapshot), verdict, verdict source, operator, time, corrects-link.
- **Per-test verdict (derived).** Pass, Fail, No control, Not required, computed from the run's controls and the test's policy; not separately editable.
- **Result → run reference (new attribute).** Every Result (or its Analysis) references its run. Existing entities: `Analysis`, `Result` (one-to-many off Analysis, `RESULT.component_id` for multi-component, OGC-1124).
- **Reagent lot and consumption (existing).** `ReagentLot`, `ReagentConsumptionEvent`; the lot's provenance flag (analyzer-reported or selected) is carried on the run.
- **Exceptions (existing on the import side).** `ImportedResult` records that did not resolve (unmatched, unordered, unmapped), now keyed to the run.
- **QC targets and policy.** `test_qc_target` (specced, QC Targets FRS) plus the two policy attributes in FR-H1 (new).
- **Audit events (new vocabulary, existing audit trail).** run created, control recorded, control corrected, test held, test released, retest requested, rejected on QC, accepted despite QC (with NCE reference), run completed, run superseded.
- **Uniqueness.** One run per analyzer message id; one run per workplan batch; a Result references exactly one run.

Existing import models (`QCSample`, `RunQCStatus`, `ImportedResult`, `RunSettings`) and the specced `QcRun` are inputs to the storage decision, not the design. The engineering repo's authoritative analyzer specification (OGC-1054, 2026-09-02) states that `QcRun` is not part of the target architecture and that openelis-work data-model suggestions are not implementation direction; this FRS therefore prescribes no table.

---

## Access

Accessible via the existing **Results** rights, scoped by lab unit (D-043, D-044). A user with Results rights for a lab unit can see that unit's runs in the Runs chip, open a run, record a control, select a lot, disposition rows, and perform Retest, Reject and Accept despite QC failure (the last is logged; finer control arrives with the RBAC revamp). A user without Results rights for the lab unit does not see its runs, its rows, or its counts. Analyser Import rights are not a gate for any of this (D-044). Configuration in FR-H1 is edited by Admin and Test Catalog Manager, the roles that edit QC Targets; other roles see it read-only. Validation reviewers see held rows and their run reference through the Validation page's existing rights.

---

## Localization

Constitution v1.11.0 Principle VII applies: search before minting (`npm run i18n:find`), reuse `common.*` canonical keys where they exist. `common.*` is seeded by OpenELIS-Global-2 PR #3863, still open as of 2026-08-12; rows marked PENDING #3863 cite the canonical key and fall back to the develop-real key until it lands. New keys are domain-namespaced under `run.*`. Messages use ICU placeholders, no plural syntax.

| UI text | Key | Status |
|---|---|---|
| Runs | `run.chip.label` | NEW |
| {open} open, {held} held | `run.chip.counts` | NEW |
| Held | `run.filter.held` | NEW |
| Waiting in {runId} | `run.tag.waiting` | NEW |
| Held: QC failed in {runId} | `run.tag.held` | NEW |
| Batched in {runId} | `run.tag.batched` | NEW |
| Batch these | `run.action.batchThese` | NEW |
| Run | `run.label.run` | NEW |
| Run settings | `run.header.settings` | NEW |
| Exceptions | `run.header.exceptions` | NEW |
| QC | `run.header.qc` | NEW (check `label.qc` family before minting) |
| Record control | `run.action.recordControl` | NEW |
| Mark complete | `run.action.markComplete` | NEW |
| {done} of {total} rows dispositioned | `run.progress` | NEW |
| Open / Held / Complete / Superseded | `run.state.open` / `.held` / `.complete` / `.superseded` | NEW (reuse `common.complete` for Complete, PENDING #3863) |
| Pass / Fail | `label.analyzerQc.pass` / `label.analyzerQc.fail` | REUSE (OGC-428 vocabulary, per OGC-1147) |
| Valid / Invalid | existing RDT outcome dictionary values | REUSE |
| No control | `run.verdict.noControl` | NEW |
| Not required | `run.verdict.notRequired` | NEW |
| Analyzer-reported | `run.lot.analyzerReported` | NEW |
| Use last-used lot | reuse Results Entry key if present, else `run.lot.useLast` | REUSE / NEW |
| Retest | reuse import key | REUSE |
| Reject | `common.reject` | REUSE, PENDING #3863 |
| Accept | `common.accept` | REUSE, PENDING #3863 |
| Accept despite QC failure | reuse Import v2 key | REUSE |
| Accept {count} selected | `run.bulk.accept` | NEW |
| {n} will be skipped: {reasons} | `run.bulk.skipped` | NEW |
| Select all normal | reuse Import v2 key | REUSE |
| What this accept writes | `run.row.writes` | NEW |
| Lot attached to all accepted results | `run.bulk.lotAttached` | NEW |
| Keep / Replace / Ignore | reuse Import v2 keys | REUSE |
| View raw | reuse Import v2 key | REUSE |
| Retest of {runId} | `run.link.retestOf` | NEW |
| Superseded by {runId} | `run.link.supersededBy` | NEW |
| In review by {user} | reuse Results Entry FR-O3 key | REUSE |
| Control required per run | `admin.testCatalog.qcTargets.policy.requiredPerRun` | NEW |
| When a required control is missing | `admin.testCatalog.qcTargets.policy.onMissing` | NEW |
| Warn / Hold | `admin.testCatalog.qcTargets.policy.warn` / `.hold` | NEW (check `common.warning`, PENDING #3863) |
| Status, Test, Sample ID, Result, Analyzer, Notes, Save, Cancel, Edit, Search, Pending | `common.status`, `common.test`, `common.sampleId`, `common.result`, `common.analyzer`, `common.notes`, `common.save`, `common.cancel`, `common.edit`, `common.search`, `common.pending` | REUSE, PENDING #3863 |

Audit event names share the `run.audit.*` namespace (created, controlRecorded, controlCorrected, testHeld, testReleased, retestRequested, rejectedQc, acceptedDespiteQc, completed, superseded).

---

## Dependencies

New data the lab does not capture today, or capabilities not yet built, each named explicitly:

1. **Run record** (FR-A1) with Result → run reference. Not built. Storage is decided under OGC-1147 D1 by the implementing engineer; must satisfy OGC-1054's constraint (no `QcRun` in the target architecture; openelis-work data-model suggestions are not implementation direction) and must yield one queryable answer to "all runs and controls for this test or analyzer today".
2. **Run-linked control record** with covered tests, snapshot of expected value, verdict source, corrects-link (FR-C1). Extends OGC-1147 FR-A2/A3 (in progress, Samuel).
3. **QC Targets store** `test_qc_target` (QC Targets FRS, specced, not built) plus the two policy attributes in FR-H1.
4. **Pending-value lookup by accession** so the worklist can show Waiting in RUN-x (FR-D3). New service; belongs with the re-scoped OGC-1137.
5. **Results Entry per-row save and presence** (FR-O1 to O3, OGC-1020) for FR-E9.
6. **Multi-component runtime linkage** `RESULT.component_id` (OGC-1124, Done) and target → component ingestion (OGC-1129, Done).
7. **Batch creation service** on Workplan exposed for "Batch these" (FR-B4); Batch Workplan reagent QC (OGC-427, in progress).
8. **Redirect** from `/AnalyzerResults?id=` and retirement of the generated Results ▸ Analyzer menu entries (OGC-1178, Ready, not built; spec change only).

Feature flags: none new. The deployment's existing reagent-lot gate governs whether lot capture is required (FR-E3).

---

## Out of Scope

- The QC program engine: Westgard rules, Levey-Jennings charts, control-lot lifecycle, statistical violation records (QC dashboard domain; OGC-682, OGC-685).
- Instrument-level periodic QC ("is this machine OK today"): stays as specified in Analyzer Manual QC Recording (OGC-428); this FRS only surfaces its status line in Run settings.
- Analyzer transport, parsing and profile management (OGC-1054 and Bridge).
- Reagent inventory itself (Inventory redesign); this FRS only references lots and emits consumption events.
- Redesign of the Validation page beyond its existing consumption of the QC-fail signal.
- Merging assays modelled as separate tests; delta checks per component (Import v2 open question 2 stands).
- Run timeouts or auto-close (FR-H3).
- Supervisor-only escalation for Accept despite QC failure (RBAC revamp).

Anything listed here is absent from `runs-preview.html`; there are no stubbed sections.

---

## Acceptance Criteria

Functional

- [ ] An analyzer message creates one run; a workplan batch creates one run; saving a single manual result with no run creates and completes a run of one in the same save (FR-B1 to B3).
- [ ] "Batch these" on two or more pending rows of the same test creates a WORKPLAN run and opens `/Results?run=<id>` with the header ready for control and lot entry; rows of different tests cannot be batched together (FR-B4).
- [ ] A control's verdict is computed per covered test from QC Targets, or taken from the analyzer's own verdict when present; a Fail holds only that test's rows in the run (FR-C2 to C4).
- [ ] Held rows cannot be accepted, entered, edited or released from the worklist, the run view, or Validation while the hold stands (FR-C4, FR-D4).
- [ ] Retest, Reject and Accept despite QC failure behave per FR-C5, including the mandatory pre-populated NCE on Accept-despite and the suggested "retest of" link on a later run.
- [ ] Recording a later passing control on the same run does not clear an existing Fail hold (FR-C6).
- [ ] The Runs chip shows Open and Held counts for the user's lab units only, and expands to a list of run identities (FR-D1); the Held chip is on by default (FR-D2).
- [ ] A pending row with a value in an Open analyzer run shows Waiting in RUN-x, no value, and links to the run; a row in a Held run shows the red held tag with Edit disabled (FR-D3, FR-D4).
- [ ] The run header renders QC, Run settings and Exceptions blocks as inline Tiles with no modals; Exceptions is hidden when empty (FR-E1 to E4).
- [ ] An expanded analyzer row lists every component value it will write, its mapping, unit check, flags, lot and run reference; a multi-component test shows the call first and each target beneath it (FR-E10).
- [ ] Selecting rows in a run shows the inline summary bar with counts by flag, skipped rows with reasons, and the lot; actions run from the bar and the bar updates live (FR-E11).
- [ ] Analyzer-reported lots are read-only and tagged; otherwise nothing is pre-selected and "Use last-used lot" works (FR-E3).
- [ ] Partial acceptance leaves the run Open with a remaining count; ANALYZER runs complete on last disposition; WORKPLAN runs complete on Mark complete or last disposition (FR-A3, FR-E5).
- [ ] Every result accepted or saved after release references exactly one run (FR-A2).
- [ ] The QC Targets section shows the two policy fields and they drive No control handling (FR-H1, FR-C7).
- [ ] `/AnalyzerResults?id=` redirects to `/Results` pre-filtered by analyzer; no Results ▸ Analyzer menu entries are generated (Navigation & URL).

Non-functional

- [ ] The run header loads with one request for the run (verdicts, settings, exceptions) and one for its rows; no regression to analyzer ingestion throughput or to worklist load time without a run filter.
- [ ] All visible strings use the keys in the Localization table; no hardcoded English; `npm run i18n:find` run before each new key.
- [ ] Every run event in Information & Data appears in the audit trail with user and timestamp.

Integration

- [ ] OGC-1147's QC-fail signal is scoped to run and covered test and is consumed unchanged by Validation (FR-G1, FR-G3).
- [ ] The QC dashboard lists runs and controls from all three sources and links back to `/Results?run=<id>` (FR-G2).
- [ ] Batch Workplan creates and reads runs; no parallel batch object remains (FR-G4).
- [ ] Reagent consumption events per accepted result carry the run's lot (FR-G5).

---

## Supersession notes (to be added at the top of each affected spec)

- **`analyzer-import-redesign-v2.md` (OGC-288).** Overview & IA, G1 and the whole-run QC gate (FR-A2) are superseded by the Runs FRS: the review is `/Results?run=<id>`, the entry point is the Runs chip, and QC holds are per test. All other FRs and G2 to G13 remain in force and are consumed by Runs FR-E and FR-C. OGC-288 to be re-scoped to "run header and analyzer rows on the Results worklist".
- **`results-entry-multicomponent.md` (OGC-811).** Section D (Reagents, QC and Controls) keeps its fields and UI; its scope becomes the row's run (Runs FR-D7). FR-B2's provenance indicator is the Runs tag set (FR-D3 to D6). OGC-1025 (R6) is the affected slice.
- **`batch-workplan-reagent-qc.md` (OGC-427).** The batch is a run with source WORKPLAN; its reagent QC is the run's control; results reference the run (Runs FR-B2, FR-G4). "Batch these" from the worklist is a new entry point into this feature.
- **`manual-rdt-qc-persistence.md` (OGC-1147).** FR-C1's scope ("same test + lab unit + session window") is replaced by the run and covered test (Runs FR-G1). D1 must satisfy the Runs record (Dependency 1) and OGC-1054's constraint.
- **`test-catalog-qc-targets.md`.** Adds the FR-H1 policy block; FR-D1's snapshot lands on the run's control record.
- **Analyzer Results Lab Unit Access (OGC-1178).** Generated Results ▸ Analyzer menu entries retire; D-043 is consumed by the Runs chip and `?run=` filter; `/AnalyzerResults?id=` redirects.
- **`analyzer-manual-qc.md` (OGC-428).** Unchanged in scope; its status line is surfaced in Run settings for analyzer-source runs.

## Open questions (flagged for ratification)

1. Whether a manual control recorded against an ANALYZER run (FR-C7) should also satisfy the instrument's periodic Manual QC (OGC-428) for that shift, or the two remain independent as OGC-428 BR-AQC-003 implies. Default: independent.
2. Whether "Batch these" should also be offered from the Workplan page's existing batch flow with the same name, or the Workplan keeps its current wording. Default: same wording on both.
3. Presence transport for FR-E9 is engineering's choice (as in Results Entry).
4. Registry and decision-log upkeep (Runs row; rows for the seven sibling specs; candidate decisions on run-as-unit, per-test verdicts, policy placement, terminology; constitution pointer re-sync to v1.11.1) is owed to the repo copies and could not be written from this session.
