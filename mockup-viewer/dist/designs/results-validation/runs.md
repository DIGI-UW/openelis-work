# Runs: the shared unit of QC, reagent lot and result review

## Functional Requirements Specification

**Status:** Approved for handoff (v0.4, 2026-09-22). v0.4 simplifies the review surface on Casey's direction and applies the crosscheck fixes: the run filter replacing the worklist's other filters (FR-E1b), one paginated table driven by the existing filter chips (FR-E1a, replacing v0.3's two-view band model), the row expanding into the **Results Entry panel with the analyzer value prefilled and editable** (FR-E10, FR-E10a, replacing the bespoke write-preview), run-scoped selection (FR-E11a), server-side paging (FR-E12), the Accept contract corrected against D-059 (FR-E13), and the Validation contract rerouted to the clearance rule's row QC slot (FR-G3). v0.3 introduced the scale and Accept work; v0.2 added the per-row write detail and bulk accept summary.
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Owns:** the run model, its three creation paths, the run header on the Results worklist, the worklist's run-aware row states, the per-test QC gate, and the consumption contracts other features rely on.
**Supersedes in part (see Supersession notes at the end):** Analyzer Results Import v2 (`designs/system/analyzer-import-redesign-v2.md`, OGC-288); Results Entry multicomponent (`designs/results-validation/results-entry-multicomponent.md`, OGC-811) section D; Batch Workplan reagent QC (`designs/quality/batch-workplan-reagent-qc.md`, OGC-427); Manual and RDT QC persistence (`designs/quality/manual-rdt-qc-persistence.md`, OGC-1147) FR-C1 scope.
**Does not change:** Analyzer Manual QC Recording (`designs/quality/analyzer-manual-qc.md`, OGC-428), which stays instrument-level and outside the run model.
**Related Jira:** OGC-288, OGC-1137, OGC-811, OGC-1025, OGC-1147, OGC-427, OGC-428, OGC-1178, OGC-949 (QC Targets section), OGC-682 (Westgard / QA menu), OGC-1131 (multi-component).
**Companion artifacts:** `runs-preview.html` (interactive HTML preview of the worklist states, the run header, and a 96-position rack run at full density) and `runs-mockup.jsx` (the Carbon handoff mockup).

> **How to read the mockup and preview.** Two regions in both artifacts are existing OpenELIS UI, not designs: the **filter chip row** and the **expanded row panel**. Both are fenced in the artifacts with a visible "Existing component, reuse, do not re-implement" marker and are drawn only in abbreviated form so the files read standalone. They are deliberately not a complete or accurate rendering, and their contents are not specified by this FRS. Build them by reusing the shipped components, taking their real filter set, fields, ordering, states and behaviour from the live app and from their owning specs; where the artifacts differ from the live app, the live app is right (design-addendum MUST C, D-008). The only parts of those two regions this FRS does specify are what Runs adds to them: the Held chip and whole-run counts (FR-E1a), and the provenance line, the prefilled tagged value and the edited-value treatment (FR-E10, FR-E10a). Anything else absent from the artifacts is an omission for readability, never a scope decision.

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
- **URL route:** `/Results` (canonical worklist); `/Results?run=<runId>` (run-filtered view with run header). No further parameter is introduced: the filter chips behave as they do on the unfiltered worklist and the run opens on All (FR-E1a). The legacy `/AnalyzerResults?id=<analyzerId>` redirects to `/Results` with the Runs chip pre-filtered to that analyzer; the redirected page carries one dismissible inline notification stating that analyzer results are now reviewed here and that the Import action is now called Accept (a transition aid, removable a release after ship). The generated `Results ▸ Analyzer` menu entries described in the Analyzer Results Lab Unit Access spec (OGC-1178) are retired; their access rule (D-043) is consumed by the Runs chip and the run filter instead. Verify the route and the redirect against the live app before build (design-addendum MUST C).

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
| FR-E1a | The run's rows are a single paginated table under the run header, controlled by the worklist's existing **filter chip row** (All, Needs review, Critical, Abnormal, Exceptions, Held, Normal) with counts computed over the **whole run**, never over the visible page. The run opens on **All**, sorted exceptions and held first, then critical, abnormal, normal. Page size is 25, 50 or 100 on a Carbon `Pagination`, default 50. No second view, no view switch and no collapsible category sections are introduced. | Ratified 2026-09-22. Chips and filters are the established pattern on this page, so the review surface reuses them rather than inventing a parallel taxonomy. A 96-position rack against an eight-analyte panel is close to 700 rows; whole-run chip counts plus paging are what make that reviewable (design-addendum MUST E). The run header's QC, Run settings and Exceptions blocks (FR-E1 to FR-E4) sit above the chips and are unaffected. |
| FR-E1b | **Opening a run replaces the worklist's other filters.** Applying a run filter clears the lab unit selector, the search box and any active signal chip, and the run opens whole on **All**. The run's lab unit is shown read-only in Run settings rather than as a selector, because a run is scoped to one lab unit (FR-B5) and both the analyzer and the tests already carry it. Leaving the run restores the filter state the technician had before opening it. While a run filter is active the only row controls are the chips of FR-E1a and the search box scoped to that run; the Runs chip stays available so the technician can move to another run without going back first. | Ratified 2026-09-22. The alternative, ANDing the run with whatever was already applied, makes the chip counts mean "this run within your earlier filter" and lets a filter set minutes ago hide rows inside a run under review, which is the failure FR-D2 already guards against. Clearing costs nothing here because the lab-unit scope survives in the run itself. |
| FR-E2 | The **QC** block shows the run's overall verdict (Pass, Held, No control, Not required), then one line per covered test with its verdict and, expanded inline, each control covering it with observed versus expected, level, lot, verdict source, operator and time. For a held test the FR-C5 actions appear on that test's line. A **Record control** action opens an inline form (same fields as Results Entry FR-D3) to add a control to the run. | Replaces Import v2's QC-first panel and the QA/QC sidebar's current-run status. |
| FR-E3 | The **Run settings** block shows source, method, analyzer instance (with its instrument-level Manual QC status line from OGC-428 when the source is an analyzer), lab unit, operator, opened and last-activity times, state, and the reagent lot(s). An analyzer-reported lot is read-only and tagged as such; otherwise the lot is selected from inventory with a **Use last-used lot** shortcut and expiring or expired lots flagged. Nothing is pre-selected (no first-in-first-out auto-pick). | Import v2 FR-B1, FR-B2 and G7 carried forward. Lot capture is required only when the deployment's reagent-lot gate is on. |
| FR-E4 | The **Exceptions** block lists the run's unresolved records in three kinds: unmatched sample (lab number unknown), unordered test (accession resolves, test not ordered), unmapped code or target. Each is resolved inline (type-ahead accession search; "Map now" deep-link to Analyzer Types & Mapping; Hold or Ignore with reason). An exception blocks only its own record. The block is hidden when the run has no exceptions. | Import v2 FR-D and FR-J and G8 carried forward unchanged. |
| FR-E5 | The header shows review progress ("12 of 40 rows dispositioned") and a **Mark complete** action for WORKPLAN runs; ANALYZER runs complete automatically when the last row is dispositioned. Partial acceptance is allowed and the run stays Open with the remaining count. | Import v2 G2 carried forward. |
| FR-E6 | Rows under the header are the standard worklist rows carrying the run's provenance. Every row expands into the Results Entry panel (FR-E10); an analyzer row's actions are **Accept, Retest, Ignore** and, on a duplicate, **Keep / Replace / Ignore**. Default sort is exceptions and held first, then critical, abnormal, normal, and the filter chips are the ones the worklist already uses, with counts over the whole run (FR-E1a). | Import v2 FR-C, G2, G3, G11 carried forward. The chips are the run view's only row control (FR-E1a) and carry whole-run counts. Analyzer rows are not read-only: they expand into the Results Entry panel prefilled (FR-E10, FR-E10a). **Vocabulary:** the action is **Accept** on every row whatever the run's source (ratified 2026-09-22); the legacy Import wording does not survive the convergence. Value corrections after accept happen through the row's normal edit-state machine and, after release, the correction workflow. |
| FR-E7 | Accepting a row that carries a critical value creates the pending-acknowledgment Alerts task and audit event exactly as Results Entry does; acceptance is not blocked. | Import v2 G6; Critical Result Acknowledgment spec. |
| FR-E8 | A read-only **View raw** action is available per analyzer row (the record or segment) and per analyzer run (the message or file). | Import v2 G10. |
| FR-E9 | Concurrency follows Results Entry FR-O1 to O3: per-row optimistic save, stale-page guard, and a passive "in review by X" indicator on the run and on rows another user has open. | Import v2 G12. |
| FR-E10 | **The row expands into the Results Entry panel, not a review-only view.** Expanding any row in a run opens the same panel Results Entry opens, rendered by the same components, with the analyzer-reported value and each of its components **prefilled** and tagged *Analyzer-reported*. Ranges, flags, component rendering, the multi-component call-then-targets order and the critical-value treatment are the panel's own and are not restated here. Above the entry fields the panel adds only what is specific to a run and not already on it: the analyzer code to test mapping, the unit check outcome, the reagent lot that will attach, the run reference, and, on a duplicate, whether an existing result will be kept or replaced. | Ratified 2026-09-22, replacing the bespoke "what this accept writes" panel of v0.3. Import v2 FR-G1 already required an imported value and an entered one to render identically; reusing the panel makes that literal instead of re-describing it, and removes a surface to build (design-addendum MUST A). |
| FR-E10a | **The prefilled value is editable.** A technician may change it before accepting. On save the accepted value is recorded with the entering user as its author, the run retains the analyzer-reported value unchanged alongside it, and the audit trail carries both together with the reason the row's normal edit path already collects. Nothing is silently overwritten, and no separate lock-and-override mode is introduced. | Ratified 2026-09-22. The reused panel behaves as Results Entry behaves; provenance, not a read-only field, is what protects the analyzer's reading. |
| FR-E11 | **Bulk accept summary.** Selecting one or more rows in a run shows an inline summary bar above the table (a Tile, not a modal) stating what the batch action will do: count to accept, breakdown by flag (normal, abnormal, critical with the acknowledgment tasks that will be created), rows that will be skipped and why (already resulted, held, exception unresolved), and the lot that will attach. The Accept, Retest and Ignore actions live on the bar; the bar updates live as the selection changes. "Select all normal" selects only rows with no flag, no duplicate and no hold. | Replaces tick-and-go; toast plus Undo (G9) remain after the action. |
| FR-E11a | **Selection is scoped to the run, not the page.** Rows stay selected across page changes and chip changes; the summary bar states the selection's size and composition over the whole run and offers **Clear selection**. **Select all in this filter** selects every eligible row the active chip matches across every page and states how many it selected. The bar names the skipped rows individually, because they are always few; accepted rows are summarised by flag rather than enumerated, since a list of six hundred names is not scannable. | Ratified 2026-09-22 (D-061). This is the one place the "show labels, not a count" convention yields: the exception list keeps its labels, the accepted set is a count by category. |
| FR-E12 | **The run view pages server-side.** The row request carries run, active chip, page and page size; the chip counts for the whole run are returned with the run header's own request, not derived on the client. A bulk action is issued as run plus chip plus an explicit list of exclusions, never as a list of every selected row id, so accepting a whole run is one request. | Keeps a 700-row run from shipping 700 ids and rendering 700 rows. Sizes the non-functional target in Acceptance Criteria. |
| FR-E13 | **What Accept writes.** Accepting a row in a run writes the result exactly as a Results Entry save writes it: the value and each of its components, the entering user and time, the run reference, the reagent lot, and any critical, abnormal or delta flags. The analysis lands in the same state a manually entered result reaches on save, **entered and not yet validated**, and enters the Validation queue. **The Accept action itself neither validates nor releases.** What happens to the row next is the single clearance predicate (D-059) applied to it like any other row: where the deployment runs automated validation, a row the predicate clears may be released unattended, and a row it does not clear waits for a validator. No run-sourced exemption is introduced in either direction. | Ratified 2026-09-22. An imported result is a result entry, not a shortcut past validation. Import v2 implied this in G9; no requirement stated it until now. The second half is the D-059 correction from the 2026-09-22 crosscheck: Runs must not carve run rows out of the one predicate, nor promise a guarantee the platform does not give. |
| FR-E14 | A result accepted in a run may be recalled and re-entered while it is still pending validation, through the row's normal edit-state machine. After validation and release, the correction workflow applies instead. | Import v2 G9 carried forward explicitly. No new control is added to the run view for this: the affordance is the one Results Entry already has on the row, which is why it does not appear in `runs-mockup.jsx`. |

### F. Cross-domain

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | The run header and tags follow the worklist's domain treatment derived from the selected Lab Unit: environmental and vector runs show site or trap context instead of patient confirmation and regulatory limits instead of reference ranges. The Domain enum is CLINICAL, ENVIRONMENTAL or VECTOR; no other value is introduced. | Results Entry FR-M; D-004. |

### G. What other features read from a run (consumption contracts)

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **QC persistence (OGC-1147).** Every control recorded on a run is a source-typed QC result (ASTM or analyzer, MANUAL, RDT) with the run id; the QC-fail signal's scope is the run and the covered test, replacing "same test, lab unit and session window". Quantitative manual controls remain eligible for the statistics store per OGC-1147 D1 and D3. | |
| FR-G2 | **QC dashboard and Manual QC leaf.** The dashboard's Source filter and the Manual QC view (OGC-692 made real by OGC-1147) list runs and their controls; a run reference from the dashboard opens `/Results?run=<id>`. | |
| FR-G3 | **Validation.** Every result accepted in a run enters the Validation queue as an ordinary row carrying its run reference (FR-E13); where the deployment runs automated validation, clearance FR-8 governs whether it is presented as already released rather than appearing in a lane. The run's per-test verdict reaches the validator through the **row quality-control slot** the clearance rule defines (`validation-clearance-rule` FR-10 and FR-12), which renders only when a quality-control fact exists and is specified to accept a verdict from any source: Runs supplies that verdict and does not define its rendering. The fuller provenance, the reagent lot with its origin and each covering control with observed versus expected, verdict source, operator and time, is read in the expanded row's existing **Reagents, QC and Controls** reference section (Validation page FR-C3). A recorded failure excludes the row from Clear per clearance FR-1; under D-058 the absence of a verdict is absence and not risk, so a Pass verdict does not by itself clear a row. | Rewritten 2026-09-22 after the crosscheck (D-062). v0.3 pointed at FR-C3 and the FR-A2 chip and would have collided with OGC-1226, which is in flight and whose own Dependencies already name "a per-test verdict within a run" as its supplier. |
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
| All / Needs review / Critical / Abnormal / Exceptions / Held / Normal (the run's filter chips) | reuse the worklist's existing chip keys; only `run.filter.held` is new | REUSE |
| Select all {count} in this filter | `run.bulk.selectAllInFilter` | NEW |
| {count} selected across this run | `run.bulk.selectionScope` | NEW |
| Clear selection | `run.bulk.clearSelection` | NEW |
| Items per page, page {n} of {total} | reuse the Carbon `Pagination` keys already in use on the worklist | REUSE |
| Entered, not validated | reuse the existing analysis-status key for entered | REUSE |
| Recall | reuse Results Entry key | REUSE |
| The verdict shown in the Validation row's quality-control slot | `label.validation.qc.verdict` | REUSE — owned by `validation-clearance-rule` FR-10. Runs mints no key in the `label.validation.*` namespace; anything rendered on the Validation page uses that page's keys |
| Analyzer results are reviewed here now; Import is now Accept | `run.redirect.notice` | NEW |
| The run is the filter / opening a run replaced your other filters | `run.filters.replacedTitle`, `run.filters.replacedBody` | NEW (FR-E1b) |
| Run view chrome: back to all results, lab-unit filter label, row count, search placeholder, worklist intro, whole-run counts hint | `run.action.backToAll`, `run.filter.allUnits`, `run.rowCount`, `run.search.placeholder`, `run.worklist.intro`, `run.counts.hint` | NEW |
| Run settings field labels: Source, Opened | `run.label.source`, `run.label.opened` | NEW |
| QC block: held summary line, observed-versus-expected line, verdict source values | `run.qc.heldSummary`, `run.control.observedExpected`, `run.verdictSource.analyzerReported` / `.computed` / `.technicianDeclared` | NEW |
| Exception kinds and their inline actions | `run.exception.unmatched` / `.unordered` / `.unmapped`, `run.action.match`, `run.action.mapNow` | NEW |
| Run-specific additions to the reused Results Entry panel: held title and body, analyzer-reported tag, maps to, unit check, duplicate, where the result lands, lot-edited-on-the-run note, run-of-one note | `run.row.heldTitle`, `run.row.heldBody`, `run.lot.analyzerReported`, `run.row.mapsTo`, `run.row.unitCheck`, `run.row.unitOk`, `run.row.duplicate`, `run.row.lands`, `run.row.readOnlyOnRun`, `run.row.willCreateRun` | NEW. Everything else in the panel (field labels, ranges, flags, component rendering, section headings) uses the Results Entry keys unchanged, per FR-E10 |
| Bulk bar: empty-state hint, acknowledgment tasks, and N more, where accepted rows land, the three skip reasons | `run.bulk.empty`, `run.bulk.ackTasks`, `run.bulk.andMore`, `run.bulk.lands`, `run.skip.dup` / `.exception` / `.held` | NEW |
| Run source values (Analyzer message, Workplan batch) | `run.source.analyzer` / `.workplan` | NEW |
| Confirmation toasts, one per action (retest, reject, accept despite, matched, map now, ignored, select all normal, batched, accepted) | `run.toast.retest`, `.reject`, `.acceptDespite`, `.match`, `.mapNow`, `.ignore`, `.selectedAll`, `.batched`, `.accepted` | NEW |
| Flag labels, component count, Manual, Home, Workplan, Done, Lot, Method, Operator, Lab unit, Reagent lot, Ignore, Flags, All, Needs review, Keep existing, Replace, View raw, Retest, Accept despite QC failure | `label.flag.*`, `label.validation.components`, `common.*`, `filter.*`, `button.*` | REUSE (existing families; confirm each with `npm run i18n:find` before build) |
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

9. **Server-side paging with whole-run counts** for the run view, and a bulk-action request expressed as run plus filter plus exclusions rather than an id list (FR-E12). A new capability on the worklist endpoint; today's import page loads a whole message at once.

Feature flags: none new. The deployment's existing reagent-lot gate governs whether lot capture is required (FR-E3).

---

## Out of Scope

- The QC program engine: Westgard rules, Levey-Jennings charts, control-lot lifecycle, statistical violation records (QC dashboard domain; OGC-682, OGC-685).
- Instrument-level periodic QC ("is this machine OK today"): stays as specified in Analyzer Manual QC Recording (OGC-428); this FRS only surfaces its status line in Run settings.
- Analyzer transport, parsing and profile management (OGC-1054 and Bridge).
- Reagent inventory itself (Inventory redesign); this FRS only references lots and emits consumption events.
- Redesign of the Validation page. The run supplies a verdict to the row quality-control slot the clearance rule already defines and fills the Reagents, QC and Controls reference section that already exists (FR-G3). No new section, lane or predicate is introduced there, and the D-058 and D-059 rules are untouched.
- Merging assays modelled as separate tests; delta checks per component (Import v2 open question 2 stands).
- Any change to the Results Entry panel itself. FR-E10 reuses it as it stands and adds only the run-specific lines above the fields.
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
- [ ] Expanding any row in a run opens the Results Entry panel with the analyzer value and its components prefilled and tagged Analyzer-reported, plus the run-specific lines (mapping, unit check, lot, run reference, keep-or-replace on a duplicate); nothing in the panel itself is re-implemented (FR-E10).
- [ ] A technician can change the prefilled value before accepting; the saved result carries them as author, the run still shows the analyzer-reported value, and the audit trail carries both (FR-E10a).
- [ ] Selecting rows in a run shows the inline summary bar with counts by flag, skipped rows with reasons, and the lot; actions run from the bar and the bar updates live (FR-E11).
- [ ] Opening a run from a worklist that had a lab unit, a search term and a signal chip applied clears all three and shows the run whole on All; the run's lab unit appears read-only in Run settings; leaving the run restores the previous filter state (FR-E1b).
- [ ] The chip row and the expanded row panel are the shipped components, not reimplementations: the chip set and panel contents match the live app, and the only Runs-specific additions are the Held chip with whole-run counts and the provenance line, prefilled tagged value and edited-value treatment (FR-E1a, FR-E10, FR-E10a).
- [ ] A run of 96 samples against an eight-analyte panel (about 700 rows) opens on the All chip with every chip count computed over the whole run, paginated at 50, with only one page of rows fetched (FR-E1a, FR-E12).
- [ ] Page size switches between 25, 50 and 100, and a selection survives both a page change and a chip change (FR-E1a, FR-E11a).
- [ ] Select all in this filter selects every eligible row the active chip matches across every page, states how many it selected, and Clear selection empties it (FR-E11a).
- [ ] Accepting a whole run issues one request expressed as run plus chip plus exclusions, not a list of row ids (FR-E12).
- [ ] Accepting a row in a run leaves the analysis entered and not validated and places it in the Validation queue; the Accept action itself neither validates nor releases, and a run-sourced row is neither exempted from nor specially blocked by automated validation (FR-E13, D-059).
- [ ] A result accepted in a run can be recalled while it is pending validation; once released only the correction workflow applies (FR-E14).
- [ ] Analyzer-reported lots are read-only and tagged; otherwise nothing is pre-selected and "Use last-used lot" works (FR-E3).
- [ ] Partial acceptance leaves the run Open with a remaining count; ANALYZER runs complete on last disposition; WORKPLAN runs complete on Mark complete or last disposition (FR-A3, FR-E5).
- [ ] Every result accepted or saved after release references exactly one run (FR-A2).
- [ ] The QC Targets section shows the two policy fields and they drive No control handling (FR-H1, FR-C7).
- [ ] `/AnalyzerResults?id=` redirects to `/Results` pre-filtered by analyzer; no Results ▸ Analyzer menu entries are generated (Navigation & URL).

Non-functional

- [ ] The run header loads with one request for the run (verdicts, settings, exceptions, and the whole-run chip counts) and one for the first page of its rows; no regression to analyzer ingestion throughput or to worklist load time without a run filter. Neither request grows with the size of the run beyond the selected page size.
- [ ] All visible strings use the keys in the Localization table; no hardcoded English; `npm run i18n:find` run before each new key.
- [ ] Every run event in Information & Data appears in the audit trail with user and timestamp.

Integration

- [ ] OGC-1147's QC-fail signal is scoped to run and covered test and is consumed unchanged by Validation (FR-G1, FR-G3).
- [ ] The run's per-test verdict renders in the Validation row's quality-control slot (clearance FR-10, FR-12) and nowhere else new; the lot and every covering control with observed versus expected, verdict source, operator and time are read in the existing Reagents, QC and Controls reference section (FR-G3).
- [ ] A recorded QC failure excludes the row from Clear; a run whose verdict is Pass does not by itself place a row in the Clear lane; and where automated validation is on, an accepted row it clears is presented as already released rather than appearing in a lane (FR-G3, D-058, D-059, clearance FR-8).
- [ ] The QC dashboard lists runs and controls from all three sources and links back to `/Results?run=<id>` (FR-G2).
- [ ] Batch Workplan creates and reads runs; no parallel batch object remains (FR-G4).
- [ ] Reagent consumption events per accepted result carry the run's lot (FR-G5).

---

## Supersession notes (to be added at the top of each affected spec)

- **`analyzer-import-redesign-v2.md` (OGC-288).** Overview & IA, G1 and the whole-run QC gate (FR-A2) are superseded by the Runs FRS: the review is `/Results?run=<id>`, the entry point is the Runs chip, and QC holds are per test. All other FRs and G2 to G13 remain in force and are consumed by Runs FR-E and FR-C; G9's post-accept recall is stated explicitly as Runs FR-E14, FR-G1's "an imported value and an entered one render identically" becomes literal in Runs FR-E10, and the review's scale behaviour, absent from Import v2, is added as Runs FR-E1a and FR-E12. Import v2 FR-C1's read-only analyzer row is superseded: the row expands into the Results Entry panel and its prefilled value is editable with provenance (Runs FR-E10a). OGC-288 to be re-scoped to "run header and analyzer rows on the Results worklist".
- **`results-entry-multicomponent.md` (OGC-811).** Section D (Reagents, QC and Controls) keeps its fields and UI; its scope becomes the row's run (Runs FR-D7). The panel itself is reused unchanged as the run's row expansion (Runs FR-E10); Runs adds run-specific lines above its fields and changes nothing inside it. FR-B2's provenance indicator is the Runs tag set (FR-D3 to D6). OGC-1025 (R6) is the affected slice.
- **`batch-workplan-reagent-qc.md` (OGC-427).** The batch is a run with source WORKPLAN; its reagent QC is the run's control; results reference the run (Runs FR-B2, FR-G4). "Batch these" from the worklist is a new entry point into this feature.
- **`manual-rdt-qc-persistence.md` (OGC-1147).** FR-C1's scope ("same test + lab unit + session window") is replaced by the run and covered test (Runs FR-G1). D1 must satisfy the Runs record (Dependency 1) and OGC-1054's constraint.
- **`test-catalog-qc-targets.md`.** Adds the FR-H1 policy block; FR-D1's snapshot lands on the run's control record.
- **`validation-clearance-rule-frs-v0.1.md` (OGC-1226) and `validation-page-v4.md` (OGC-817).** No redesign of either. The run's per-test verdict is delivered into the row quality-control slot defined by clearance FR-10 and FR-12, whose own Dependencies section names that verdict as a forward dependency; Runs is its supplier. The Reagents, QC and Controls reference section (`validation-page-v4` FR-C3) is populated from the row's run. The D-058 and D-059 rules are unchanged and Runs introduces no run-sourced exemption from either.
- **Analyzer Results Lab Unit Access (OGC-1178).** Generated Results ▸ Analyzer menu entries retire; D-043 is consumed by the Runs chip and `?run=` filter; `/AnalyzerResults?id=` redirects.
- **`analyzer-manual-qc.md` (OGC-428).** Unchanged in scope; its status line is surfaced in Run settings for analyzer-source runs.

## Open questions (flagged for ratification)

Five questions raised against the staged draft were ratified by the Product Director on 2026-09-22 and are encoded above, not left open: the review model at rack scale (one paginated table driven by the existing filter chips, FR-E1a, after the two-view band model of v0.3 was set aside as a parallel taxonomy); the row expansion (the Results Entry panel reused with the analyzer value prefilled, FR-E10); whether that prefilled value may be edited (yes, with provenance and no separate override mode, FR-E10a); what Accept leaves behind (entered and not validated, then subject to the one clearance predicate like any other row, FR-E13 and FR-G3); and the action's name (Accept everywhere, FR-E6). The questions below remain.

1. Whether a manual control recorded against an ANALYZER run (FR-C7) should also satisfy the instrument's periodic Manual QC (OGC-428) for that shift, or the two remain independent as OGC-428 BR-AQC-003 implies. Default: independent.
2. Whether "Batch these" should also be offered from the Workplan page's existing batch flow with the same name, or the Workplan keeps its current wording. Default: same wording on both.
3. Presence transport for FR-E9 is engineering's choice (as in Results Entry).
4. Registry and decision-log upkeep (Runs row; rows for the seven sibling specs; candidate decisions on run-as-unit, per-test verdicts, policy placement, terminology; constitution pointer re-sync to v1.11.1) is owed to the repo copies and could not be written from this session.
