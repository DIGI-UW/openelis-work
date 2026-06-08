# M-04 Case Workbench Core — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds the full AMR design review inline; no separate addendum)
**Date:** 2026-06-05
**Module:** Microbiology → Case Workbench
**Route:** `/microbiology/case/:caseId`
**Phase:** MVP-1A + Phase 1A+ (items marked)
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft
**Mockup:** `m-04-case-workbench-prototype.html` (single canonical interactive mockup; the earlier static `m-04-case-detail.html` is superseded)

> Self-contained: the case-view UX decisions (interaction model, inoculation entry, two-pass isolate ID, auto-logging timeline, next-step guidance, compact Case Info, reports checklist, critical-notification placement), the data-reuse decisions (culture protocol → Method, reflex-driven cascade), the test-designation reconciliation, the mixed-order handling, and the no-ownership model are all written into the sections below, not kept as notes.

---

## 1. Lab Context

**Current State.** A microbiology case is the multi-day-to-multi-week workup of one specimen: inoculate media, incubate, detect growth (a blood-culture instrument signals positive, or a tech reads a plate), subculture, Gram stain, isolate organisms, identify them, set up and read antimicrobial susceptibility testing (AST = Antimicrobial Susceptibility Testing), then report. Today this is tracked on paper logs and instrument printouts, with results hand-transcribed.

**Pain.** There is no single record of a case's progress: the tech reconstructs "where is this specimen" from bench books, bottle labels, and printouts each time. AST values are copied by hand from instrument printouts (transcription errors get caught late, forcing retests). The chemistry-shaped "Sample → Analysis → Result" model can't represent a case that has several isolates, each with its own susceptibility panel, evolving over days.

**What Changes.** A **Case** becomes a first-class record with a visible stage, a timeline the system keeps automatically, its isolates and AST runs, and its report versions. The tech opens the case on the step that needs doing, records each action in its own section (which auto-logs to the timeline), and releases preliminary and final reports from the same page. Analyzer results flow in automatically. No paper log, no transcription.

---

## 2. Overview

### 2.1 Purpose
The Case is the central abstraction of the Microbiology module — a per-specimen workup record with a lifecycle (state machine), a timeline, zero-or-many isolates (each with zero-or-many AST runs), and one-or-more report versions. The Case Detail page is where a tech does all bench-level work for that specimen.

### 2.2 Navigation & URL
- **Reached from:** the Worklist (M-07) — clicking a row opens the case at its current step.
- **Breadcrumb:** `Home / Microbiology / Worklist / Case {labNumber}`.
- **URL:** `/microbiology/case/:caseId` (deep-linkable). Print view `/microbiology/case/:caseId/print`.
- **Opens focused on the current step (UX):** on load the page scrolls to and highlights the section the stage says needs action (never the Timeline, never blindly the top); completed sections collapse to summaries. The Timeline is a log you consult, not the landing point. A user may jump to any section via the sidebar.

### 2.3 Users
| Role | Primary actions |
|------|-----------------|
| Microbiology Technician | All bench data entry — inoculation, subculture, isolate create/identify, AST setup + manual entry, preliminary release |
| Microbiology Supervisor | Review, approve overrides, release Final, authorize amendments, reidentify |
| Lab Manager | Full access; reidentification of finalized isolates |

### 2.4 Integration
- **M-03 Order Entry hook** — creates the Case on Sample save (see §3.1 and the test-designation note in §9).
- **M-01 Reference Data** — Organism Master, AST Panels, Culture protocol (as a Method, §8).
- **M-02 Breakpoint Catalog** — referenced via the AST run (M-05).
- **M-05 AST Entry** — AST setup/entry opened **inline** from the AST section (not a modal).
- **M-06 Expert Rules** (Phase 1B) — runs on AST completion; confirmation orders flow through the reflex engine (§9).
- **M-07 Worklist** — reads case state; every worklist row opens this page.
- **M-08 Macro Library** — macro-enabled text fields.
- **M-11 Critical-Result Acknowledgment** — critical notifications logged from the header / isolate tiles.
- **M-12 Test → Reagent Linkage** — reagent-lot selection in inoculation and AST setup.

---

## 3. State machine

The state machine is the spine of the case; the page's next-step guidance (§5) and the worklist's filters are projections of it. Every transition writes an immutable `micro_case_stage_transition` row and is atomic with the action that triggered it.

### 3.1 Stages
**Non-terminal:** RECEIVED → INCUBATING → POSITIVE_SIGNAL → GROWTH_DETECTED → ORGANISM_ID → AST_IN_PROGRESS → READY_REVIEW → PRELIM_REPORTED → FINAL_REPORTED → AMENDED.
**Terminal:** NO_GROWTH_FINAL, REJECTED_AT_ACCESSIONING, CANCELLED_PRE_INOCULATION, CANCELLED_POST_INOCULATION, CANCELLED_POST_POSITIVE, LOST_SPECIMEN, LOST_SPECIMEN_POSITIVE.

### 3.2 Transition table (key rows)
| From | To | Trigger | Side effects |
|------|-----|---------|--------------|
| (Sample saved, micro) | RECEIVED | Order-entry post-save hook (§9) | Case created |
| RECEIVED | INCUBATING | Save inoculation (§4 Inoculation) | `micro_case_inoculation` row + INOCULATION timeline event |
| INCUBATING | POSITIVE_SIGNAL | Analyzer `POSITIVE_SIGNAL` event **or** manual "Mark positive" | Timeline event; worklist row highlights |
| INCUBATING | NO_GROWTH_FINAL | "Mark no growth" after incubation hours met | Timeline event; final negative report |
| POSITIVE_SIGNAL | GROWTH_DETECTED | First isolate added **or** subculture recorded | Auto-transition |
| GROWTH_DETECTED | ORGANISM_ID | Isolate workup begins (add/edit isolate) | Implicit on first edit |
| ORGANISM_ID | AST_IN_PROGRESS | First AST setup saved (M-05) | `micro_ast_run` row |
| AST_IN_PROGRESS | READY_REVIEW | All clinically-significant isolates have a **reviewed/accepted** AST run (analyzer results land as `RESULTS_IN`, then a tech **Accepts** → `COMPLETE`; auto-received alone does not count — see M-05 §5.6) | Surfaces in worklist "Ready" |
| (any non-terminal, ≥1 Gram stain) | PRELIM_REPORTED | "Release preliminary" | Prelim report; distribution |
| PRELIM_REPORTED | FINAL_REPORTED | "Release final" (checklist passes) | Final report; case locked |
| FINAL_REPORTED | AMENDED→FINAL_REPORTED | "Amend" → "Release amended final" | New report version; originals preserved |
| NO_GROWTH_FINAL | POSITIVE_SIGNAL | Late slow grower (reason required) | Revives case; prior final kept |
| Order cancelled | CANCELLED_* | Cancellation cascade from Order Entry | Terminal stage per current progress; reason captured |

### 3.3 Rules
- **Preliminary release on Gram stain:** allowed as early as POSITIVE_SIGNAL once at least one isolate has a Gram-stain observation — a positive Gram stain is the clinically actionable result for empiric therapy. Not gated on final ID.
- **Cancellation cascade:** Order Entry's cancellation event maps to the appropriate terminal stage based on the case's current stage; reason captured.
- **Reidentification** of a finalized isolate (§6.3) creates a new isolate version and triggers an amendment cycle; AST runs are **not** auto-re-interpreted.
- **No ownership in the lifecycle:** stage transitions are performed by whoever is on shift; the actor is recorded per action (§10), not as a case owner.

---

## 4. Case Detail page — layout & sections
Left sidebar (Carbon SideNav) with progress dots reflecting the state machine; scrollable main column; sticky footer action bar. The page opens focused on the current step (§2.2). A **stage-keyed next-step banner** sits at the top of the main column (§5).

**Interaction model — inline, not modals (constitution Principle 3).** Every action expands an **inline panel within its section/row** (Carbon row/section expansion), never a pop-up modal overlay; modals are reserved only for destructive confirmations. **Identifier fields are barcode-scannable** — bottle/plate IDs (inoculation, subculture) and analyzer card IDs offer "scan or type." **Reagent-lot selection uses the same FIFO guidance as results-entry reagent selection** — lots sorted oldest-expiry-first, QC status shown inline, expired/locked lots blocked (via M-12).

### 4.1 Case Info — compact, collapsible
Carried from order entry, read-only. Rendered as a **one-line collapsible summary** (order, origin, ward, number of sets, antibiotic exposure) that expands on demand, with **Clinical history surfaced first** when expanded. It mostly duplicates the case header, so it is collapsed by default — techs rarely open it.

### 4.2 Inoculation — the system of record for media
The Inoculation section owns media entry (not the Timeline). Its toolbar has **+ Start inoculation** (initial bottles/plates; RECEIVED→INCUBATING) and **+ Add subculture** (requires a parent media via `source_inoculation_id`). A **Source** column shows `Primary` or `subculture ← {parent}`. Each save writes the `micro_case_inoculation` row **and** an auto Timeline event. Reagent lots are chosen via the M-12 `ReagentLotPicker` (blocks on expired/locked lots). Empty state: "No media recorded yet — **+ Start inoculation** to begin."

### 4.3 Timeline — a read-mostly activity log
The Timeline is the log the system keeps, not a data-entry surface. Entries written by the system carry an **AUTO** badge. Its only manual action is **+ Add note**, limited to non-structured event types (general note, plate reading, lost specimen) — you never hand-enter inoculation/Gram-stain/AST events here; those are written automatically by their owning section. Default shows recent events with "show all."

**Reuse the existing History / Note infrastructure (verified — see design check F-07).** The Timeline is **not** a standalone new store. Build it on OpenELIS's existing audit-history + note services: extend **`AbstractHistoryService`** (the same pattern as `NoteHistoryService`) to collate, into one `AuditTrailItem` feed, the case's row-change history (auto-captured by the audit framework — inoculation/isolate/AST edits), `analyzer_event`s, stage transitions, and **Notes**; **"+ Add note" creates an existing `Note`** (INTERNAL by default). A thin micro event-type layer maps domain actions to display badges/labels. Do **not** duplicate the audit or note storage — so `micro_timeline_event`, if retained at all, is a lightweight typing/index layer over the existing History/Note records, not a parallel log.

### 4.4 Isolates — two-pass identification
**+ Add isolate** creates a **preliminary** isolate from Gram stain + colony morphology (`organism_id` null); this advances the case to GROWTH_DETECTED/ORGANISM_ID and auto-writes a Gram-stain timeline event. Each isolate tile shows an **ID status**:
- **Identification pending** (amber) with a primary **Identify organism →** action;
- **Identified** (green) with method + confidence.
Identification can arrive three ways: manual final ID in the isolate's inline Identify panel, an **analyzer push** (`ID_RESULT_AVAILABLE` fills the organism and clears the pending state), or a re-identification. **Set up AST is disabled until the organism is identified** (tooltip explains why). **Edit** (in-place) is used while the case is open; **Reidentify** (§6.3, versioned) appears only after the final report. Helper text states the create-then-identify rhythm.

### 4.5 AST Results — summary (entry lives in M-05)
Per-isolate AST run tables: inline rows; overridden rows shaded and **expandable to show original→override with a revert action**; the matched breakpoint level (organism-specific / group / none) is shown; "no breakpoint" rows are guided to local-SOP interpretation. "Edit AST" opens the M-05 inline AST-entry panel; "View audit" opens the override audit. Analyzer results arrive automatically (§7); a run awaiting results shows an "awaiting analyzer results" state — there is no manual import.

**Breakpoint standard is chosen at AST setup and shown on the run — and it's flexible.** It defaults to the lab's active standard, but any *loaded* standard — CLSI or EUCAST, any version — can be selected **per run** (some labs run EUCAST for one organism group and CLSI for another, or pin an older version during a transition). The choice is **snapshotted** on the run so historical interpretations never change when the lab later switches its active standard. The lab's default active standard, and which standards are loaded/selectable, are managed in the Breakpoint Catalog (M-02).

**Analyzer results land pre-populated and need review.** When the analyzer pushes results the run becomes **`RESULTS_IN`** (auto, no import) and the case is flagged **"AST results in — review"** on the Worklist (M-07). The AST section then offers **Accept results** (→ `COMPLETE`, audited; what "marking it good" means for pre-populated values) and **Repeat AST run** (retest = a new run, original preserved — whole panel or a single drug; reuses OE retest, also reachable via an NCE *Retest* disposition). Rows where the analyzer's own interpretation differs from our re-computed value, no-breakpoint rows, and expert-phenotype rows are flagged for attention; the run isn't "complete" (and can't feed the final-report checklist) until accepted. Full detail in M-05 §5.3–§5.7.

**AST progress count.** The section header counts **completed runs / total runs**, plus an explicit tally of significant isolates **awaiting AST setup** and isolates **pending identification**. A case with two isolates where one is not yet identified must therefore never read as "1 / 1 complete" — the unidentified/un-set-up isolate is surfaced in the count (e.g. "1 / 1 runs complete · 1 pending ID"), because AST is per-isolate-run and an un-worked isolate is not "done."

### 4.6 Reports — checklist-gated
Preliminary and Final report rows with versions. **Release preliminary** is enabled once any isolate has a Gram stain. **Release final** is gated by a **pass/fail readiness checklist** (all isolates identified · AST complete for significant isolates · expert flags addressed [N/A 1A] · no pending tests · clinical correlation reviewed); the button is disabled with a count of blocking items until all pass. Final release generates the Jasper PDF, distributes via existing channels, locks the case. Amendment (§3) preserves originals.

### 4.7 Critical notification
A **Log critical notification** action appears in the **case header** (`target_type = CASE`) and on **each isolate tile** (`target_type = ISOLATE`); the entry point sets the target. On save it writes the M-11 record + a timeline event and shows the unacknowledged badge immediately (optimistic).

### 4.8 Report NCE & specimen-lost → test rejection
A **Report NCE** action sits in the case header (next to Log critical notification). Any non-conforming event — lost specimen, contamination, mislabel / ID mismatch, transport/temperature excursion, testing error — is raised here, **reusing the existing NCE module's inline report form** (`nce-report` / `nce-results-entry`): category (defaults to Pre-analytical for case-side events) + subcategory + severity + description, with the case's sample auto-linked, and a **Test disposition** choice — *Flag only — continue processing* or **Reject test** (which reuses OE sample rejection: sets sample status Rejected and cancels pending tests). A header NCE badge appears once one is logged.

**Losing a specimen is always an NCE.** "Mark lost" is a specialization of Report NCE, pre-set to subcategory **Specimen lost** with disposition **Reject test — reason: specimen lost**. Saving it (a) records the NCE linked to the sample, (b) rejects the affected test(s) with reason "specimen lost", and (c) transitions the case to LOST_SPECIMEN (LOST_SPECIMEN_POSITIVE if past positive). **No new entity:** the NCE lives in the NCE module and links to this sample; rejection reuses the existing OE rejection-with-reason mechanism; "Specimen lost" is a Pre-analytical NCE subcategory (admin-configurable). Each step writes a Timeline event.

---

## 5. Next-step guidance
The main column renders a **stage-keyed banner** stating the recommended next action(s) — the user-facing projection of §3. Mapping (excerpt): INCUBATING → "Incubating (day n of max); no action until positive or read time"; POSITIVE_SIGNAL → "Subculture the bottle and record the Gram stain on a new isolate"; ORGANISM_ID → "Identify each isolate, then set up AST"; AST_IN_PROGRESS → "Review flagged overrides; release a preliminary report if you haven't"; READY_REVIEW → "Supervisor review, then release final." Each section also carries one-line helper text and an empty state with a call-to-action.

---

## 6. Isolates — data & versioning
### 6.1 Preliminary vs final ID
`micro_isolate.organism_id` is nullable until identified. Preliminary fields (Gram stain, colony) are captured at creation; final ID (organism, method, confidence, significance, default AST panel from the organism) is filled later. The organism's **default AST panel** (M-01) is what the **reflex orders** when AST is triggered — so the panel is chosen upstream, not freshly at AST setup; the run snapshots `ast_panel_id` + version and any tech adjustment is an audited change to the ordered analysis (see M-05 §4.1).
### 6.2 Significance
`significance` pre-fills from the organism's default (M-01) and is editable per case.
### 6.3 Reidentification (Phase 1A+)
A finalized isolate can be reidentified (creates `version+1`, `previous_version_id` set, `current_version` flipped), writes a REIDENTIFICATION timeline event, and triggers an amendment cycle. AST runs against the prior version are preserved and **not** auto-re-interpreted; the lab reviews applicability (M-06 surfaces a "review applicability" signal in Phase 1B).

---

## 7. Analyzer event channel (Phase 1A+)
A general OE foundation for non-result analyzer messages. Blood-culture instruments push `POSITIVE_SIGNAL` / `NEGATIVE_AT_DAY_N`; AST/ID instruments push `AST_RESULT_AVAILABLE` / `ID_RESULT_AVAILABLE` / `AST_QC_FAIL`. Events are written to `analyzer_event` and routed by source id (bottle/card) to the case/isolate/run — driving stage transitions and **automatically populating** isolate IDs and AST results. **There is no manual "import" anywhere**; a push that fails to match is stored `FAILED` and surfaced on the **Admin → Stuck analyzer events** reconciliation page. (AC examples: a `POSITIVE_SIGNAL` for a known bottle transitions INCUBATING→POSITIVE_SIGNAL; an unmatched one lands in admin.)

---

## 8. Data model
Primary `micro_case` (1:1 with `sample`): stage, `culture_protocol` reference (see reuse note), patient_origin, department, ward, number_of_sets, is_screening_culture, clinical_history, antibiotic_exposure, critical_value_notify, prelim/final released_*, final_version, max_incubation_days, audit columns. **`assigned_tech_user_id` exists but is nullable and unused by default** — see §10 (no ownership). Envers `@Audited`.

Side tables: `micro_case_inoculation` (+ **`source_inoculation_id`** nullable self-FK to distinguish subcultures from primary media — verified genuinely new; OpenELIS `Sample`/`SampleItem` carry no parent/derived-from lineage), `micro_isolate` (versioned), `micro_ast_run` (M-05), `micro_case_stage_transition` (audit), `analyzer_event`. **The Timeline is layered on the existing `History`/`Note` infrastructure (§4.3), not a new `micro_timeline_event` log.** Concurrency reuses the existing **optimistic lock** (`@Version`/`lastupdated` on the sample entities) — surfaced as the stale-state error — plus an optional thin transient "working" flag (§10).

**Reuse decisions (no new masters):**
- **Culture protocol → existing `method`.** Drop the proposed `culture_protocol` master; model culture protocol on the existing **Method** entity (extend with `incubation_hours / temp / atmosphere / subculture_at_hours`); the test's default protocol = its default Method (`test_method.is_default`); media via `method_reagent` (M-12). Inoculation references the chosen Method.
- **Workflow cascade → existing reflex/test-rules engine.** The positive→identify→AST→confirmation ordering decisions run on the existing reflex engine (Rule → OrderAction); the Case Workbench owns workup *state*, reflexes own *what-to-order-next*. M-06 confirmations fire through the reflex action API.

---

## 9. How a case is created (test-designation reconciliation)
A Case is created by the Order-Entry post-save hook (`MicroCaseService.createCaseForSample`). **Open reconciliation (OGC-841):** today the trigger keys off the order-level Program = Microbiology, which is decoupled from any test attribute. The Test Catalog currently has a `domain` (CLINICAL/ENVIRONMENTAL/VECTOR — too coarse) and an AMR/WHONET flag (surveillance, not workflow), but **no "this test drives the culture workflow" designation**. Target state: a first-class **"Culture workflow"** test attribute (distinct from the AMR flag) that auto-routes the order into the Case workflow and carries `default_culture_protocol` (= default Method) + `valid_organisms`. Build the hook behind a single trigger resolver so this can change without reworking the service.

**Mixed / multi-protocol orders:** a Case is 1:1 with a Sample and has a single culture protocol. A sample with micro + non-micro tests works (non-micro follows normal results; the Case covers only the micro workup). A sample needing two culture protocols is **not** representable today — declare it out of scope for 1A (second protocol = second sample/case) or promote protocol to per-isolate later. Paired sets are handled via `number_of_sets`.

---

## 10. Ownership, accountability & permissions
**No per-case ownership.** A case is open for days–weeks and worked in shifts; it is not "owned." Work is organized by state/urgency on the shared Worklist (M-07). Accountability is **per action** — `inoculated_by`, `event_by`, AST entered/overridden by, `*_released_by`, all immutable in `audit_trail`. `assigned_tech_user_id` stays optional/off-by-default (config flag for larger labs). Concurrency **reuses OpenELIS's existing optimistic locking** (`@Version`/`lastupdated`) — a second saver gets the stale-state error — and an optional short-lived "working on this" flag (a thin `working_on_by`/`working_on_since`, since OE has no pessimistic lock) gives a softer heads-up before double-entry. Both are concurrency aids, not ownership. The case header shows **"Last activity by"**, not an owner.

**Permissions** (existing role bundles, not per-action keys): view via `micro.case.view`; bench edits via the Analyst bundle; final release / amend / reidentify via Supervisor/Manager. Report NCE and test rejection **reuse the existing NCE-create and sample-rejection permissions** (no new micro-specific keys). Every state-changing action is enforced server-side (403 on unauthorized) and audited; reads are not audited.

---

## 11. Non-functional
Case Detail (5 isolates × 100 AST results × 30 timeline events) renders < 1 s; saves < 500 ms (NFR-02/05). WCAG 2.1 AA: all fields labeled; status by text + colour; modal focus management; macro dropdown keyboard-navigable (NFR-04). Offline: forms queue saves locally with reconnect conflict resolution (NFR-01).

## 12. i18n (pattern `micro.case.*`)
~150–200 keys: stage labels, section headers, inoculation/subculture actions, timeline event types + AUTO badge, isolate ID-status + Identify CTA, AST section, release-prelim/final + checklist items, amend reasons, next-step banner per stage, error strings (e.g. `micro.case.error.releasePrelim.noGramStain`). (Full list maintained with implementation.)

## 13. Acceptance criteria
- **AC-M04-01**: Micro order save auto-creates a Case (RECEIVED) via the hook; idempotent; trigger isolated in one resolver.
- **AC-M04-02**: Page renders header, sidebar (state-machine dots), all sections, sticky footer; **opens focused on the current step**.
- **AC-M04-03**: Stage transitions atomic + audited in `micro_case_stage_transition`.
- **AC-M04-04**: Inoculation has **+ Start inoculation / + Add subculture**; subculture records its parent; saving writes the row + an AUTO timeline event; **no inoculation entry exists in the Timeline**.
- **AC-M04-05**: Timeline is read-mostly with AUTO badges; **+ Add note** offers only manual-only types.
- **AC-M04-06**: Isolate shows ID status; pending isolates show **Identify organism**; AST setup disabled until identified; analyzer ID fills + clears pending; Edit (pre-final) vs Reidentify (post-final) differentiated.
- **AC-M04-07**: AST rows expand to original→override with revert; matched breakpoint shown; awaiting-results state; no manual import.
- **AC-M04-08**: Preliminary allowed once a Gram stain exists; Final gated by the pass/fail checklist with blocking count.
- **AC-M04-09**: Amendment preserves originals; reidentification versions the isolate without auto-re-interpreting AST.
- **AC-M04-10**: Late slow grower revives NO_GROWTH_FINAL with reason; cancellation cascades to the right terminal stage.
- **AC-M04-11**: Analyzer events route correctly; unmatched → FAILED in admin.
- **AC-M04-12**: Critical notification reachable from header + isolate; target_type set by entry point; optimistic badge.
- **AC-M04-13**: Case Info renders as a compact collapsible summary (clinical history first).
- **AC-M04-14**: No per-case owner; "Last activity by" shown; `assigned_tech_user_id` unused unless the assignment flag is on; accountability per-action + audited.
- **AC-M04-15**: Culture protocol modeled as a Method (no `culture_protocol` master); only new field is `source_inoculation_id`.
- **AC-M04-16**: Server-side permission enforcement on every state-changing action; reagent-lot validation via M-12.
- **AC-M04-17**: Report NCE action available in the header (reuses the NCE module's inline form, sample auto-linked); "Mark lost" raises a Specimen-lost NCE and rejects the test with reason "specimen lost" (reusing OE rejection), transitioning to LOST_SPECIMEN(_POSITIVE) — no new NCE/rejection entity.
- **AC-M04-18**: All data-entry actions are inline section/row expansions, not pop-up modals (Principle 3). Bottle/plate IDs and analyzer card IDs are barcode-scannable. Reagent-lot pickers present lots FIFO (oldest-expiry first) with QC status, matching results-entry reagent selection; expired/locked lots are blocked.
- **AC-M04-19**: At AST setup the breakpoint standard is selectable (defaults to the lab's active standard; any loaded standard/version choosable per run) and snapshotted on the run; switching the lab's active standard later does not change historical interpretations. Default active + loaded set managed in M-02.

## 14. References
M-00 Parent; M-01 Reference Data; M-02 Breakpoints; M-03 Order-Entry hook; M-05 AST; M-06 Expert Rules; M-07 Worklist; M-08 Macros; M-11 Critical notify; M-12 Reagent linkage; reconciliation OGC-841; existing OE Sample/Order/Result/Method/test-rules/qc_lot tables. Mockup: `m-04-case-workbench-prototype.html`.
