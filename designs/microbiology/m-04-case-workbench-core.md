# M-04 Case Workbench Core — Functional Requirements Specification

**Version:** 2.1 (consolidated — folds the full AMR design review inline; no separate addendum). **v2.1 corrects the no-growth terminal state, and adds the fourth recorded outcome for the TB profile (§4.6)** — `NO_GROWTH_FINAL` becomes `NO_GROWTH_READY` (in workup, awaiting release) followed by release to `FINAL_REPORTED`; see §3.1, §3.2, §4.6, §5, AC-M04-10, AC-M04-26, AC-M04-27.
**Date:** 2026-08-27 (v2.0: 2026-06-05)
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
**In workup:** RECEIVED → INCUBATING → POSITIVE_SIGNAL → GROWTH_DETECTED → ORGANISM_ID → AST_IN_PROGRESS → READY_REVIEW → PRELIM_REPORTED; and, on the negative branch, **NO_GROWTH_READY**.
**Released** (terminal for reporting; revivable only through the amendment cycle, never by ordinary workup): **FINAL_REPORTED**, and its in-flight amendment state AMENDED.
**Closed without a result:** REJECTED_AT_ACCESSIONING, CANCELLED_PRE_INOCULATION, CANCELLED_POST_INOCULATION, CANCELLED_POST_POSITIVE, LOST_SPECIMEN, LOST_SPECIMEN_POSITIVE.

> **Reading the older wording.** Elsewhere in this spec and in M-00, these three classes are still referred to with the older pair **non-terminal** / **terminal**. Map them as: **non-terminal = In workup**; **terminal = Released, or Closed without a result**. Where an existing rule says "any non-terminal stage", it means any stage in the *In workup* class. The classes were renamed in v2.1 because "terminal" was doing two incompatible jobs — *the case is finished* and *the case has no outgoing edges* — and `FINAL_REPORTED` has always had outgoing edges (amendment, and now late-slow-grower revival).
>
> **v2.1 — the negative branch releases, it does not just end.** v2.0 modelled no growth as a single terminal stage, `NO_GROWTH_FINAL`, reached by marking no growth. That collapsed two distinct events into one: *the bench has finished reading the plate* and *an authorized reviewer has released the report*. The shipped build separates them, and it is right to — the positive path has always had that two-stage gate, and a negative result reaches a clinician through exactly the same report. So marking no growth now moves the case to **`NO_GROWTH_READY`** (still *in workup*: read, called, awaiting release), and releasing the final report moves it to **`FINAL_REPORTED`**, the same *Released* state the positive path uses. There is no separate end state for negatives.
>
> This also settles a naming divergence: M-00 §5 and this spec said `NO_GROWTH_FINAL`; the build ships `NO_GROWTH_READY` and the AMR-S29 acceptance story expects the label **"No Growth Ready"**. The build and the story agree, so the specs are the stale party and are corrected here rather than the code being changed to match them.
>
> **A second naming divergence is flagged here, not resolved.** The specs call the terminal released stage `FINAL_REPORTED`; the shipped build appears to use **`FINAL_RELEASED`** (UAT on `b1c692b` observed both `stage` and `finalReleaseState` reading `FINAL_RELEASED`, with the badge "Final Released"). This amendment deliberately does **not** rename it — that touches every module in the bundle and is a larger change than the no-growth correction. It is recorded so the M-00 §5 lifecycle reconciliation settles it deliberately rather than by accident. Everything below reads `FINAL_REPORTED` as "the terminal released stage", whatever it ends up being called.
>
> **A `NO_GROWTH_READY` case must not leak a result.** Between marking no growth and releasing, the negative must not appear on the patient's report — the same boundary the positive path enforces between READY_REVIEW and release.

**Classification is orthogonal to these stages — and is *not* a mandatory first step, nor its own stage value.** A case carries `workflow_type` (`BACTERIOLOGY` / `MYCOBACTERIOLOGY_TB`), set automatically from the ordered test at order entry (M-03 §2.1a). In the normal path **the case is born already classified** and enters `RECEIVED` directly in its profile — it never passes through a "classify" step.

**`UNASSIGNED` is not a stage** — it is simply **`workflow_type IS NULL`**, a predicate over the case, not a value in the stage enum above (so the stage machine stays purely about workup progress). A null-workflow case can only arise from the manual-Program fallback at a deployment with **no default micro workflow** configured (M-03 §2.1a) — a fully typed catalog never produces one. While `workflow_type IS NULL`, profile-dependent work (AST setup, breakpoint family, report templates) is gated and the case shows a "Needs workflow" chip + Worklist flag; the tech's **Change workflow** action (§4.9) sets the type and lifts the gate. The workflow chip is **always visible** in the header (every case shows its profile); the gate is only active while the workflow is null. So: workflow is a visible attribute on every case; classification is a one-off correction for the exception, expressed as a null check — not an extra stage or step.

### 3.2 Transition table (key rows)
| From | To | Trigger | Side effects |
|------|-----|---------|--------------|
| (Sample saved, micro — **typed** test) | RECEIVED | Order-entry post-save hook (§9); resolver returned a `workflow_type` | Case created **already classified** in its profile (normal path) |
| (Sample saved, manual fallback, **deployment default set**) | RECEIVED | Manual `Program = Microbiology`; `site_information.default_micro_workflow` set | Case created in the deployment's default workflow (e.g. bacteriology-only labs) |
| (Sample saved, manual fallback, **no deployment default**) | RECEIVED, `workflow_type = NULL` | Manual `Program = Microbiology`; no default configured | Case created **needing classification** (`workflow_type IS NULL`); profile-dependent work gated — never auto-guessed (M-03 §2.1a) |
| `workflow_type = NULL` | (workflow set) | Tech **Change workflow** (§4.9) | Profile instantiated (sections, breakpoint family, organism vocab, WHONET flavor); audited timeline note. *Not a stage transition — sets the classification attribute.* |
| RECEIVED | INCUBATING | Save inoculation (§4 Inoculation) | `micro_case_inoculation` row + INOCULATION timeline event |
| INCUBATING | POSITIVE_SIGNAL | Analyzer `POSITIVE_SIGNAL` event **or** manual "Mark positive" | Timeline event; worklist row highlights |
| INCUBATING | NO_GROWTH_READY | "Mark no growth" after incubation hours met | Timeline event *"Incubation complete with no growth"*; case is **ready for release, not released** — nothing reaches the patient report yet |
| NO_GROWTH_READY | FINAL_REPORTED | "Release final report" by an authorized final-result reviewer | Final negative report published; case locked; **surveillance-eligible as a negative** (M-09 §4.6, M-15 §4.9) |
| POSITIVE_SIGNAL | GROWTH_DETECTED | First isolate added **or** subculture recorded | Auto-transition |
| GROWTH_DETECTED | ORGANISM_ID | Isolate workup begins (add/edit isolate) | Implicit on first edit |
| ORGANISM_ID | AST_IN_PROGRESS | First AST setup saved (M-05) | `micro_ast_run` row |
| AST_IN_PROGRESS | READY_REVIEW | All clinically-significant isolates have a **reviewed/accepted** AST run (analyzer results land as `RESULTS_IN`, then a tech **Accepts** → `COMPLETE`; auto-received alone does not count — see M-05 §5.6) | Surfaces in worklist "Ready" |
| (any non-terminal, ≥1 Gram stain) | PRELIM_REPORTED | "Release preliminary" | Prelim report; distribution |
| PRELIM_REPORTED | FINAL_REPORTED | "Release final" (checklist passes) | Final report; case locked |
| FINAL_REPORTED | AMENDED→FINAL_REPORTED | "Amend" → "Release amended final" | New report version; originals preserved |
| NO_GROWTH_READY *or* FINAL_REPORTED (negative) | POSITIVE_SIGNAL | Late slow grower (reason required) | Revives case; a released negative report is kept and the revival follows the normal amendment cycle |
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

### 4.1a Sibling cases — the shared-specimen cross-link
When a specimen drives more than one workflow (e.g. one sputum → a Bacteriology case **and** a TB case), each Case is its own record with its own lifecycle — but they share one `SampleItem`, and the UI makes that first-class so a tech never loses the connection. The case **header shows a sibling chip** for every other micro Case on the same `sample_item_id`: e.g. on the bacterial case, *"↔ same specimen · 🫁 TB — Culture, Day 12"*, which one-click navigates to the TB case (and vice-versa).

**How the chip decides what to show — it's a deterministic query, not inference.** There is nothing "intelligent" here; the chip is built from one lookup and a fixed field map:

- **Which siblings:** `SELECT * FROM micro_case WHERE sample_item_id = :current.sample_item_id AND case_id <> :current.case_id` (optionally also same parent `sample_id` if a deployment splits aliquots across SampleItems). No heuristics — siblinghood *is* "same SampleItem."
- **What each chip renders, straight off the sibling row:** its **`workflow_type`** → the icon + label (🧫 Bacteriology / 🫁 TB — from a static map, the same one used in the Test Catalog and Worklist); its **`stage`** (+ day-N where the stage carries it) → the text after the dash; the **stage's status colour** (the existing stage→colour map); and the sibling's `case_id` → the navigation target. The current case is always excluded.
- **Count / ordering:** **0 siblings → no chip** (the common case); 1 → the single chip above; >1 (rare — e.g. a future Mycology arm) → chips ordered by `workflow_type`, or a "↔ 2 related cases" roll-up that expands. 
- **Freshness:** it reflects the sibling's live `stage`, so "Culture, Day 12" updates as that case progresses; no copy of the sibling's data is stored on this case.

So the chip is a projection of existing columns (`workflow_type`, `stage`) of rows found by a single `sample_item_id` match — **purely navigational**, no new entity, and the two cases never share state, results, or release; criticals and reports stay per-case. (Worklist-side grouping of siblings is in M-07.)

### 4.2 Inoculation — the system of record for media
The Inoculation section owns media entry (not the Timeline). It also **displays the case's culture protocol** and hosts the **Set / Change protocol** action (§4.9a) — the protocol defines the expected media and incubation parameters, so it belongs beside the media record rather than in the collapsed Case Info summary. When no protocol resolved at order entry (M-03 AC-M03-04) the header shows an amber **"No protocol set"** chip with **Set protocol**. Its toolbar has **+ Start inoculation** (initial bottles/plates; RECEIVED→INCUBATING) and **+ Add subculture** (requires a parent media via `source_inoculation_id`). A **Source** column shows `Primary` or `subculture ← {parent}`. Each save writes the `micro_case_inoculation` row **and** an auto Timeline event. Reagent lots are chosen via the M-12 `ReagentLotPicker`, which reads `InventoryLot` and records consumption as an `InventoryUsage` (blocks expired/QC-failed lots). Empty state: "No media recorded yet — **+ Start inoculation** to begin."

> **Subculture lineage vs. specimen aliquoting (distinct concepts — keep both).** `source_inoculation_id` here is **media-grown-from-media** (a colony subcultured onto a new plate) — it is *not* a specimen split, so it stays micro-specific on `micro_case_inoculation`. **Splitting the physical specimen** into derived sample items (e.g. TB decontamination → processed aliquot; aliquots for send-out) is a different operation and **reuses the existing sample-management aliquoting workflow** (`CreateAliquot` + `sample_item_aliquot_relationship`, parent→child `SampleItem` with volume tracking — see M-14 §4.1). Rule of thumb: parent/child **SampleItem** → aliquot workflow; media/plate provenance within a Case → `source_inoculation_id`.

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
Preliminary and Final report rows with versions. **Release preliminary** is enabled once any isolate has a Gram stain. **Release final** is gated by a **pass/fail readiness checklist**. *(v2.1)* The checklist's first item is that the culture has a **recorded outcome** — satisfied by any one of: **(1)** isolate workup complete; **(2)** a recorded **no growth**; **(3)** isolates present but **all** judged contaminants *(bacteriology — the culture worked and grew skin flora)*; or **(4)** *(v2.1)* on the TB profile, a recorded **`CONTAMINATED`** or **`NTM_IDENTIFIED`** outcome (M-14 §5, §7.1). It is **never** gated on an isolate existing.

**Releasing and exporting are two different questions, and this checklist answers only the first.** Outcomes 1–3 release *and* contribute to surveillance. Outcome 4 releases but contributes **nothing to TB surveillance** (whether NTM is reportable to any other stream is open — M-14 §14 T-2) — a contaminated TB culture means the specimen was never successfully cultured, yet the clinician must still be told so a repeat can be sent, and withholding release would strand the patient. Which outcomes are surveillance-eligible is decided in M-14 §7.1 (TB) and M-09 §4.6 (bacteriology), never here. On **every branch without a worked-up isolate** — no-growth, contaminant-only, and the TB outcome 4 branches — the remaining isolate-dependent items (all isolates identified · AST complete for significant isolates · expert flags addressed [N/A 1A]) evaluate as **N/A**, not as failures — there is no isolate for them to be about — while the isolate-independent items (no pending tests · clinical correlation reviewed) still apply. On the positive branch the checklist is unchanged. The button is disabled with a count of blocking items until all pass; the blocking message names the **missing outcome** (*"Record the culture outcome before releasing"*), never a missing isolate. **After release the checklist must report no blockers** — on either branch. A blocker returned for an already-released case is a defect regardless of which blocker it is, because it teaches staff to disregard the banner that is supposed to flag genuinely unfinished work. Mirrors M-15 §4.10 and M-09 §4.6. Final release generates the Jasper PDF, distributes via existing channels, locks the case. Amendment (§3) preserves originals.

### 4.7 Critical notification
A **Log critical notification** action appears in the **case header** (`target_type = CASE`) and on **each isolate tile** (`target_type = ISOLATE`); the entry point sets the target. On save it writes the M-11 record + a timeline event and shows the unacknowledged badge immediately (optimistic).

### 4.8 Report NCE & specimen-lost → test rejection
A **Report NCE** action sits in the case header (next to Log critical notification). Any non-conforming event — lost specimen, contamination, mislabel / ID mismatch, transport/temperature excursion, testing error — is raised here, **reusing the existing NCE module's inline report form** (`nce-report` / `nce-results-entry`): category (defaults to Pre-analytical for case-side events) + subcategory + severity + description, with the case's sample auto-linked, and a **Test disposition** choice — *Flag only — continue processing* or **Reject test** (which reuses OE sample rejection: sets sample status Rejected and cancels pending tests). A header NCE badge appears once one is logged.

**Losing a specimen is always an NCE.** "Mark lost" is a specialization of Report NCE, pre-set to subcategory **Specimen lost** with disposition **Reject test — reason: specimen lost**. Saving it (a) records the NCE linked to the sample, (b) rejects the affected test(s) with reason "specimen lost", and (c) transitions the case to LOST_SPECIMEN (LOST_SPECIMEN_POSITIVE if past positive). **No new entity:** the NCE lives in the NCE module and links to this sample; rejection reuses the existing OE rejection-with-reason mechanism; "Specimen lost" is a Pre-analytical NCE subcategory (admin-configurable). Each step writes a Timeline event.

### 4.9 Change workflow — reclassify bacterial ↔ TB (the unassigned/mis-routed escape hatch)
The case's **`workflow_type`** is normally set automatically from the ordered test (M-03 §2.1a). But two situations leave it wrong or missing, and the tech needs a way out:

- **`UNASSIGNED`** — the ordered test had no `culture_workflow_type` (a deployment that hasn't typed its culture tests, or the manual Program fallback). The case is created in classification state `UNASSIGNED`, shown with an amber **"Needs workflow"** chip in the case header and surfaced on the Worklist; bench work that depends on the profile (AST setup, breakpoint family, report templates) is held until it's classified.
- **Mis-routed** — the test was typed, but wrongly (e.g. a combined order set the case bacterial when this specimen is the TB arm).

**The action.** A **Change workflow** control sits in the case header next to the workflow chip. It expands **inline** (Principle 3, no modal) to a short panel: a **Workflow type** select (Bacteriology / Mycobacteriology–TB), a required **reason**, and — because the culture protocol came from the test's default Method — a **culture-protocol Method** picker pre-filled with the chosen workflow's default Method (TB Methods for TB). Confirming:
- re-instantiates the **case profile** (M-04 bacterial sections ↔ M-14 TB sections), the **breakpoint family** (CLSI/EUCAST ↔ WHO-TB critical concentrations, M-02), the **organism vocabulary** (M-01), the **reflex variant**, and the **WHONET flavor** (M-09);
- writes a **stage/classification transition + a Timeline note** (reuse History/Note) recording who, when, from→to, and the reason — auditable like any other transition;
- clears the `UNASSIGNED` chip.

**Guards.** Free while the case is early (no isolates worked / no interpretive results). Once an isolate is identified or AST/DST results exist, the inline panel **warns** that reclassifying will detach profile-specific results (bacterial AST vs TB DST are different result shapes) and requires explicit confirmation; after **final report release** it is blocked (use the amendment path instead). Permission: reuse `micro.case.edit` (no new key). The reclassification never silently discards data — incompatible results are retained on the case history and flagged, not deleted.

**Reclassify after surveillance export.** If the case was already exported for surveillance (WHONET M-09, or pushed to the consolidated FHIR server for GLASS, M-15) — which normally happens only post-final-release, so this is reached via the amendment path — the reclassification **marks the case for re-export/supersede** rather than leaving a stale surveillance record: M-09 re-includes it in the next run, and M-15 re-pushes an updated FHIR Bundle (idempotent on `fhir_uuid`, so the central server supersedes the prior submission). The Timeline note records that a prior surveillance submission was superseded.

**Not the control for a recipe-only correction.** If the `workflow_type` is right and only the culture protocol is wrong — or was never set — use **§4.9a Set / change protocol** instead. Reclassifying to fix a recipe would needlessly re-instantiate the profile and, on a case with results, trip the detach-results warning above for nothing.

**Why a tech action, not a clerk re-order.** During a weeks-long workup the right person to catch "this is actually TB" is the bench tech holding the plate, not a re-order at registration. This keeps the automatic test-driven routing as the default while giving the tech a single, audited correction path — and it is the same control that resolves the `UNASSIGNED` state for un-typed deployments.

---

### 4.9a Set or change the culture protocol — the narrow, protocol-only path

**Why this exists separately from §4.9.** M-03 v2.2 makes the culture protocol **derived and read-only at order entry** — reception can see which workup will start but cannot pick or override it, because a media/incubation recipe is not a decision a clerk can evaluate. The override therefore has to live here. But it cannot live *only* inside **Change workflow**: that control requires choosing a workflow type, demands a reclassification reason, and re-instantiates the case profile, breakpoint family, organism vocabulary, reflex variant and WHONET flavour. Using it to correct a recipe would be a sledgehammer, and on a case with results it would trip the detach-results warning for no reason. A tech whose workflow is right and whose *recipe* is wrong needs a control that changes one thing.

**It also has to cover "never set".** Per M-03 AC-M03-04, when the ordered test has no default Method the order still advances and Step 1 shows *"Not set — the bench will select a protocol."* That promise is only honoured if the bench actually can. So this is **Set or change**, not merely Change — the unset state is a first-class starting point, not an error.

**Where it lives.** The **Inoculation** section (§4.2), because that is where the protocol bites: it defines the expected media set, the incubation parameters, and `max_incubation_days`. It is also the section a tech is already in when they realise the recipe is wrong. The section header shows the current protocol — or an amber **"No protocol set"** chip — with a **Set protocol** / **Change protocol** action beside it.

**The action.** Inline expansion (Principle 3 / D-005, no modal):

- A **Method** picker listing the **active** Methods linked to the case's ordered test **within the current `workflow_type`**. It must not offer another workflow's Methods — crossing that line is a reclassification and belongs to §4.9. **Inactive Methods are excluded from selection** (M-03 AC-M03-24); if the case currently *references* an inactive Method it is shown, marked inactive, as the incumbent value.
- A short required **reason**. The protocol is what the report will state was performed, so a deviation from the test's default is an audited departure — ISO 15189 §7.3 expects the justification to be recoverable. Keep it one line, not a form.
- Confirming writes the new Method reference on the case and a **Timeline note** (reuse History/Note per §4.3) recording who, when, from→to, and the reason. No new store.

**What it deliberately does not do.** It does **not** touch `workflow_type`, the case profile, the breakpoint family, the organism vocabulary, the reflex variant, or the WHONET flavour. If any of those need to change, that is §4.9.

**Already-recorded media are never rewritten.** The protocol is the *plan*; `micro_case_inoculation` is the *record* of what was actually put up. Changing the protocol must not retroactively edit, delete, or re-label existing inoculation rows — the case has to be able to say "we planned A, did A, then switched to B". Where the new protocol implies media not yet inoculated, that surfaces through the §5 next-step banner as a recommendation, never as an automatic write.

**The incubation clock recomputes; it does not reset.** `max_incubation_days` comes from the Method (M-01 §6), and the Worklist renders "Day *n* of *max*" from it (AC-M01-C-04). On a protocol change the day count is recomputed against the **new** maximum but still measured from the **original inoculation date**. Stating this explicitly because both plausible alternatives are wrong: restarting the clock would hide an overdue culture, and freezing the old maximum would silently ignore the change the tech just made.

**Guards.**

- Permission: reuse **`micro.case.edit`** — no new key (D-006).
- Free while the case is pre-release. After **final report release** it is blocked; use the amendment path, consistent with §4.9.
- Unlike §4.9 there is **no detach-results warning**, because nothing profile-specific is being invalidated. Existing isolates, AST runs and interpretations are untouched.
- If the case was already exported for surveillance, a protocol change alone does **not** mark it for re-export: `INFECTION_ORIGIN`, organism, and AST results are unaffected, and the protocol is not a GLASS RIS/SAMPLE field. This is a deliberate contrast with §4.9, which does trigger re-export.

**Which control to use.**

| Situation | Control |
|---|---|
| Right workflow, wrong recipe | **§4.9a Change protocol** |
| No protocol resolved at order entry | **§4.9a Set protocol** |
| Bacterial ↔ TB, or `UNASSIGNED` | **§4.9 Change workflow** (carries its own protocol picker, since changing workflow necessarily changes the recipe) |

§4.9 keeps its Method picker unchanged — a workflow change implies a protocol change, so bundling them there is correct. §4.9a is the narrow path that was missing.

---

## 5. Next-step guidance
The main column renders a **stage-keyed banner** stating the recommended next action(s) — the user-facing projection of §3. Mapping (excerpt): INCUBATING → "Incubating (day n of max); no action until positive or read time"; POSITIVE_SIGNAL → "Subculture the bottle and record the Gram stain on a new isolate"; ORGANISM_ID → "Identify each isolate, then set up AST"; AST_IN_PROGRESS → "Review flagged overrides; release a preliminary report if you haven't"; READY_REVIEW → "Supervisor review, then release final."; *(v2.1)* NO_GROWTH_READY → "No growth recorded; release the final negative report." Each section also carries one-line helper text and an empty state with a call-to-action.

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
Primary `micro_case` (**keyed to `sample_item_id` + `workflow_type`, unique together** — one micro Case per physical specimen *per workflow*; see §2A): `sample_item_id` (FK to the collected `SampleItem`), `workflow_type` (`BACTERIOLOGY` / `MYCOBACTERIOLOGY_TB`; `NULL` = needs classification, §3.1), stage, `culture_protocol` reference (see reuse note), patient_origin, department, ward, number_of_sets, is_screening_culture, clinical_history, antibiotic_exposure, critical_value_notify, prelim/final released_*, final_version, max_incubation_days, audit columns. **`assigned_tech_user_id` exists but is nullable and unused by default** — see §10 (no ownership). Envers `@Audited`.

Side tables: `micro_case_inoculation` (+ **`source_inoculation_id`** nullable self-FK to distinguish subcultures from primary media — verified genuinely new; OpenELIS `Sample`/`SampleItem` carry no parent/derived-from lineage), `micro_isolate` (versioned), `micro_ast_run` (M-05), `micro_case_stage_transition` (audit), `analyzer_event`. **The Timeline is layered on the existing `History`/`Note` infrastructure (§4.3), not a new `micro_timeline_event` log.** Concurrency reuses the existing **optimistic lock** (`@Version`/`lastupdated` on the sample entities) — surfaced as the stale-state error — plus an optional thin transient "working" flag (§10).

**Reuse decisions (no new masters):**
- **Culture protocol → existing `method`.** Drop the proposed `culture_protocol` master; model culture protocol on the existing **Method** entity (extend with `incubation_hours / temp / atmosphere / subculture_at_hours`); the test's default protocol = its default Method (`test_method.is_default`); media via `method_reagent` (M-12). Inoculation references the chosen Method.
- **Workflow cascade → existing reflex/test-rules engine.** The positive→identify→AST→confirmation ordering decisions run on the existing reflex engine (Rule → OrderAction); the Case Workbench owns workup *state*, reflexes own *what-to-order-next*. M-06 confirmations fire through the reflex action API.

---

## 9. How a case is created (test-designation reconciliation)
A Case is created by the Order-Entry post-save hook (`MicroCaseService.createCasesForSample`). The hook runs the **single trigger resolver** (M-03 §2.1a) over the order's micro tests and **groups them by `(SampleItem, workflow_type)`** — creating **one `micro_case` per group**, keyed to `sample_item_id` + `workflow_type` (so one specimen can yield a bacterial *and* a TB case on the same SampleItem). The `workflow_type` comes from the ordered test's Culture-workflow designation (Test Catalog, OGC-925); the culture protocol is that test's default **Method**; `valid_organisms` is read from the test. When no `workflow_type` can be resolved (manual Program fallback, no deployment default), the case is created with `workflow_type = NULL` for tech classification (§3.1, §4.9). Building the hook behind the resolver keeps the trigger and grouping in one place.

**Mixed / multi-protocol orders — resolved by keying the Case to `SampleItem` × `workflow_type`.** A micro Case is **one workflow's workup of one physical specimen**: it is keyed to `sample_item_id` + `workflow_type` (unique together), not to the whole Sample. Consequences:
- **Micro + non-micro tests on one specimen:** the non-micro analyses follow the normal Sample → SampleItem → Analysis → Result path; the Case covers only the micro workup on that SampleItem and neither shows nor blocks on the chemistry.
- **Bacterial + TB on one specimen:** two micro Analyses (different `workflow_type`) on the **same `SampleItem`** → **two Cases that share one `sample_item_id`**. No second accessioning, and "same physical specimen" is intrinsic (shared SampleItem), not a bolted-on link. Each Case keeps its own protocol, breakpoints, lifecycle, and report — the bench reality (bacterial done in days, TB running weeks).
- **Two genuinely separate specimens** (e.g. a sputum collected specifically for TB plus another for culture) come in as **two SampleItems** → two Cases naturally.
- **Paired sets** (e.g. 2 blood-culture bottles) stay **within one Case** via `number_of_sets`.

> **DECISION (resolves the prior open item).** Earlier drafts keyed the Case `1:1` to `sample_id`, which forced "bacterial + TB = two Samples" (double accessioning of one sputum). Resolved by keying to **`SampleItem` × `workflow_type`** — the reuse-aligned grain, since OpenELIS already models the physical specimen as `SampleItem` with multiple `Analysis` rows. No new linkage entity; the shared specimen *is* the shared SampleItem. (Mirrored in M-00 §7, M-03 §2A/§2.1a; UI for the shared-specimen relationship in §4.1a + M-07.)

---

## 10. Ownership, accountability & permissions
**No per-case ownership.** A case is open for days–weeks and worked in shifts; it is not "owned." Work is organized by state/urgency on the shared Worklist (M-07). Accountability is **per action** — `inoculated_by`, `event_by`, AST entered/overridden by, `*_released_by`, all immutable in `audit_trail`. `assigned_tech_user_id` stays optional/off-by-default (config flag for larger labs). Concurrency **reuses OpenELIS's existing optimistic locking** (`@Version`/`lastupdated`) — a second saver gets the stale-state error — and an optional short-lived "working on this" flag (a thin `working_on_by`/`working_on_since`, since OE has no pessimistic lock) gives a softer heads-up before double-entry. Both are concurrency aids, not ownership. The case header shows **"Last activity by"**, not an owner.

**Permissions** (existing role bundles, not per-action keys): view via `micro.case.view`; bench edits via the Analyst bundle; final release / amend / reidentify via Supervisor/Manager. Report NCE and test rejection **reuse the existing NCE-create and sample-rejection permissions** (no new micro-specific keys). Every state-changing action is enforced server-side (403 on unauthorized) and audited; reads are not audited.

---

## 11. Non-functional
Case Detail (5 isolates × 100 AST results × 30 timeline events) renders < 1 s; saves < 500 ms (NFR-02/05). WCAG 2.1 AA: all fields labeled; status by text + colour; modal focus management; macro dropdown keyboard-navigable (NFR-04). Offline: forms queue saves locally with reconnect conflict resolution (NFR-01).

## 12. i18n (pattern `micro.case.*`)
~150–200 keys: stage labels, section headers, inoculation/subculture actions, **culture-protocol set/change (`micro.case.inoculation.protocol.label` / `.none` "No protocol set" / `.set` / `.change` / `.reason` / `.reasonRequired`)**, timeline event types + AUTO badge, isolate ID-status + Identify CTA, AST section, release-prelim/final + checklist items, amend reasons, next-step banner per stage, error strings (e.g. `micro.case.error.releasePrelim.noGramStain`). *(v2.1)* Three added: `micro.case.stage.noGrowthReady` ("No Growth Ready"), `micro.case.nextStep.noGrowthReady` (the §5 banner), and `micro.case.error.releaseFinal.outcomeRequired` — English *"Record the culture outcome before releasing"*, the §4.6 replacement for the isolate-required message. The old isolate-required string is **retired**, not re-worded in place, so no deployment keeps a translated copy of a message that is wrong on the negative branch. (M-15 §8 notes this key lives here, in M-04's namespace, because M-04 owns the release path.) (Full list maintained with implementation.)

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
- **AC-M04-10**: Late slow grower revives a no-growth case (from `NO_GROWTH_READY` or from a released negative) with reason; a released negative report is preserved and the revival follows the amendment cycle; cancellation cascades to the right terminal stage.
- **AC-M04-11**: Analyzer events route correctly; unmatched → FAILED in admin.
- **AC-M04-12**: Critical notification reachable from header + isolate; target_type set by entry point; optimistic badge.
- **AC-M04-13**: Case Info renders as a compact collapsible summary (clinical history first).
- **AC-M04-14**: No per-case owner; "Last activity by" shown; `assigned_tech_user_id` unused unless the assignment flag is on; accountability per-action + audited.
- **AC-M04-15**: Culture protocol modeled as a Method (no `culture_protocol` master); only new field is `source_inoculation_id`.
- **AC-M04-16**: Server-side permission enforcement on every state-changing action; reagent-lot validation via M-12.
- **AC-M04-17**: Report NCE action available in the header (reuses the NCE module's inline form, sample auto-linked); "Mark lost" raises a Specimen-lost NCE and rejects the test with reason "specimen lost" (reusing OE rejection), transitioning to LOST_SPECIMEN(_POSITIVE) — no new NCE/rejection entity.
- **AC-M04-18**: All data-entry actions are inline section/row expansions, not pop-up modals (Principle 3). Bottle/plate IDs and analyzer card IDs are barcode-scannable. Reagent-lot pickers present lots FIFO (oldest-expiry first) with QC status, matching results-entry reagent selection; expired/locked lots are blocked.
- **AC-M04-20**: The Inoculation section displays the case's culture protocol and offers **Set protocol** (amber "No protocol set" chip when none resolved at order entry, per M-03 AC-M03-04) or **Change protocol**. The control is an inline expansion, requires a one-line reason, and writes a Timeline note recording who/when/from→to/reason.
- **AC-M04-21**: The protocol picker lists only **active** Methods linked to the ordered test **within the case's current `workflow_type`**; it never offers another workflow's Methods. An incumbent inactive Method is displayed marked inactive but cannot be re-selected.
- **AC-M04-22**: Changing the protocol does **not** alter `workflow_type`, the case profile, breakpoint family, organism vocabulary, reflex variant, or WHONET flavour, and raises **no** detach-results warning. Existing isolates, AST runs and interpretations are untouched.
- **AC-M04-23**: Changing the protocol never rewrites existing `micro_case_inoculation` rows. Media implied by the new protocol but not yet inoculated surface only as §5 next-step guidance, never as an automatic write.
- **AC-M04-24**: After a protocol change the Worklist day count recomputes against the **new** `max_incubation_days` while still measuring from the **original** inoculation date — the clock is neither restarted nor frozen at the old maximum.
- **AC-M04-25**: A protocol-only change does **not** mark an already-exported case for surveillance re-export (contrast AC for §4.9, which does).
- **AC-M04-26** *(v2.1)*: "Mark no growth" moves the case to **`NO_GROWTH_READY`**, writes the *"Incubation complete with no growth"* Timeline event with actor and time, and renders the §5 next-step banner for that stage. The negative does **not** appear on the patient's report until an authorized final-result reviewer releases it, at which point the case becomes `FINAL_REPORTED` and the patient report carries the final culture result **No growth**. There is no terminal `NO_GROWTH_FINAL` stage.
- **AC-M04-27** *(v2.1)*: Final release is gated on a **recorded culture outcome** — isolate workup complete, no growth recorded, all isolates contaminant, or (TB) a recorded `CONTAMINATED` / `NTM_IDENTIFIED` outcome — never on an isolate existing. On every branch without a worked-up isolate the checklist items that presuppose one evaluate as **N/A**, not as failures. **Passing this gate does not by itself make a case exportable** — surveillance eligibility is decided separately (M-14 §7.1, M-09 §4.6). A released case reports **no** outstanding blockers on either branch, and a case with no recorded outcome is blocked with a message naming the missing outcome rather than a missing isolate. Mirrors M-15 §4.10 and M-09 §4.6.
- **AC-M04-19**: At AST setup the breakpoint standard is selectable (defaults to the lab's active standard; any loaded standard/version choosable per run) and snapshotted on the run; switching the lab's active standard later does not change historical interpretations. Default active + loaded set managed in M-02.

## 14. References
M-00 Parent; M-01 Reference Data; M-02 Breakpoints; M-03 Order-Entry hook; M-05 AST; M-06 Expert Rules; M-07 Worklist; M-08 Macros; M-11 Critical notify; M-12 Reagent linkage; reconciliation OGC-841; existing OE Sample/Order/Result/Method/test-rules tables + Inventory module (reagent lots, via M-12). Mockup: `m-04-case-workbench-prototype.html`.
