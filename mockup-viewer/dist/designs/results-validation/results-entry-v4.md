# Results Entry — Functional Requirements Specification (consolidated)

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** `/Results` · **SideNav:** Workplan → Results · **Breadcrumb:** Home / Workplan / Results
**Related surfaces:** Validation Page (inherits the Method/Analyzer split), Admin Validation Configuration (cross-domain config). Referrals / Sample Shipment, NCE module, Reagent Inventory, Reagent Forecasting, Storage are integration points, not redesigned here.
**Companion artifacts:** `results-entry-v4-preview.html` (mockup), `results-entry-v4-decisions.md` (design decisions D1–D19).
**Supersedes:** the v3 Results Entry drafts (`results-page-v3-*`). This is version-agnostic — version boundaries are decided in the breakdown, not here.

---

## Lab Context

### Current State
The Results Entry page is where a bench technician records the value of a test for a sample that's waiting on a result. In a clinical lab a tech sits at the bench with a worklist of pending tests — some read off an instrument (an "analyzer"), some run by hand (a rapid test strip, a manual microscopy slide). For each one they open the row, type or pick the value, note which method and instrument produced it, sometimes record which reagent lot they used and a quality-control (QC) check, and save. The same page is used by labs that don't test patients at all: environmental labs testing drinking water against regulatory limits, and vector-surveillance labs testing pools of mosquitoes for disease. Which kind of lab you are is set by the **Lab Unit** you select at the top of the page.

### Pain
The current design buries the one thing the tech is there to do. When a row is expanded, the result value sits at the *bottom* of a stack of fourteen blocks (patient banner, program banner, modification notice, notes, interpretation, method, order info, storage, referral, attachments, plus two tabs), so the tech scrolls past everything to reach the field they came for. A single "Analyzer Result" column actually conflates two different facts — the *method* (e.g. "Cobas TaqMan") and the *specific instrument* (one of four machines the lab nicknamed Leonardo, Donatello, Michelangelo, Raphael) — so neither is captured cleanly. A saved, validated value can be overwritten just by clicking into it. Reagent use, QC controls, dilutions, and "this sample is used up" have nowhere to be recorded at the bench, so they live on paper. Critical and abnormal flags are pale color tints that are hard to see. And the "History" tab shows patient trends and statistical (Westgard) rules that don't belong on this screen.

### What Changes
The expanded row leads with what the tech touches: the value, the method, the specific instrument, and notes — with an explicit Edit→Save control so a saved value can't be changed by accident. Method and instrument become two separate fields, prefilled from the analyzer when the result was imported. Everything the tech only *reads* (demographics, order details, program metadata) collapses into summarized, remember-my-choice sections below. The tech can record reagent lots and quantity used, a QC control (a rapid-test control line, or a manual control value), a dilution factor, partial or full use of the sample (kicking off disposal when it's gone), and can create aliquots — all without leaving the page. Flags become high-contrast icon-and-tag badges. "History" now shows *this test's* own history — prior values, retests, status changes. Selecting a different Lab Unit reshapes the page for water-quality or mosquito-pool work.

---

## Overview

Results Entry consolidates the legacy result-entry routes into one `/Results` workbench: a filterable table of pending analyses with an inline-expanding panel per row. The panel is reorganized into a **work zone** (always-open, high-touch fields) and a **reference zone** (collapsed, summarized, sticky-per-user sections). The page is cross-domain: a `currentDomain` of `CLINICAL` / `ENVIRONMENTAL` / `VECTOR` is derived from the selected Lab Unit and reshapes columns, banners, and labels. No new domain enum value is introduced (never `BOTH`).

**Navigation & URL.** Canonical route `/Results`; SideNav path Workplan → Results; breadcrumb Home / Workplan / Results. The selected Lab Unit and status filter are the page's primary state; the route stays stable across rows.

---

## User Stories

- **As a bench technician,** I want the result value, method, and instrument at the top of the expanded row with one Edit→Save control, so I can enter or correct a result quickly without scrolling and without overwriting a validated value by accident.
- **As a bench technician,** I want to record which reagent lot and how much I used, a QC control result, and a dilution factor at the moment I enter the result, so consumption and quality data stop living on paper.
- **As a bench technician,** I want to mark a sample partly or fully used and create aliquots from this screen, so sample handling is captured where the work happens.
- **As a bench technician,** I want to file a non-conformity or refer a test out from the row, so quality and referral workflows start in context.
- **As an environmental / vector technician,** I want the page to drop patient fields and show site or trap context with regulatory limits or pool composition, so the screen matches non-clinical work.
- **As a supervisor,** I want this analysis's own history (prior values, retests, status changes) visible inline, so I can see what happened to this result without leaving the page.

---

## Functional Requirements

### A. Result entry & edit-state machine
- **FR-A1.** Each row's result cell is **polymorphic**: numeric (`NumberInput`), dictionary/qualitative (`Select`), or multi-select (checkbox set), driven by the test's result type.
- **FR-A2.** A **saved** result renders **read-only**. An **Edit** control on the row unlocks all editable fields in the expanded panel (value, method, analyzer, reagent, controls, notes) and swaps to **Save**. (Per-row scope — decision D1.)
- **FR-A3.** An **un-resulted** row is editable on open; a **Save** control appears once a value is entered. States: `EMPTY → DIRTY → SAVED(read-only) → (Edit) → EDITING → SAVED`.
- **FR-A4.** **Save** records the user's e-signature. Save is **never blocked** on critical-value acknowledgment; acknowledgment is a follow-up on the Alerts dashboard.
- **FR-A5.** Editing a previously-saved value sets the note context to **Modification** (see FR-J) and is captured in this-analysis history (see FR-H).

### B. Method + Analyzer split
- **FR-B1.** Method and Analyzer are **two distinct fields/columns**: **Method** is the analyzer *type* / method (`Analysis.method` → `Method`); **Analyzer** is the specific instrument instance (`Analysis.analyzerId`).
- **FR-B2.** On analyzer import, **Method prefills** from the analyzer type and **Analyzer prefills** with the instrument instance; both editable when the row is in Edit. A provenance indicator marks analyzer-imported rows.
- **FR-B3.** The Validation Page inherits this split (its only change from this work).

### C. Panel hierarchy & progressive disclosure
- **FR-C1.** The expanded panel is split into a **work zone** (always open: result value + method + analyzer + notes + row actions) and a **reference zone** (collapsible sections below).
- **FR-C2.** Patient/site/trap context renders as one **compact strip**, not a stack of banners, with **no decorative leading icon** (D19). A full-width banner is reserved for the critical-value acknowledgment only.
- **FR-C3.** Reference-zone sections are **collapsed-but-summarized** — the collapsed header shows a one-line gist (e.g. `Order info — Dr. Chen · STAT · Endocrinology`).
- **FR-C4.** Section open/closed state is **remembered per user** across rows and sessions (browser-local; a "Reset layout" control restores defaults). Precedence: remembered choice > per-result auto-open > collapsed. A section **auto-opens** when this result has notable content (e.g. an interpretation rule fired). (D9.)
- **FR-C5.** Sections render **conditionally** — a section with no content for this result (e.g. Program info when the analysis is in no program) is not rendered.

### D. Combined Reagents, QC & Controls
- **FR-D1.** Reagent capture **adopts the reagent-usage model**: where the Test Catalog → Method → Reagent linkage exists, the per-test reagent list (capture mode HIDDEN/OPTIONAL/REQUIRED, FIFO lot cards, Quantity Used + Unit, low-stock warning, override-reason); until that linkage ships, the free-form name/lot ComboBox picker. Both write a `ReagentConsumptionEvent` (`sourceType = RESULT_ENTRY`) and auto-credit on void/downward edit. (D11.)
- **FR-D2.** Analyzer-imported results show the reagent lot **read-only** ("analyzer-reported", capture mode HIDDEN).
- **FR-D3.** **Control result** capture adapts to test type (D12): for a rapid diagnostic test (RDT), the **control-line outcome** (Valid / Invalid; Invalid blocks reporting and prompts a repeat) with control lot; for a manual quantitative test, **measured value + expected value + uncertainty (±) + Pass/Fail** with control level and lot.
- **FR-D4.** **Expected value and uncertainty are entered by the tech** (or prefilled only if a target range is configured for the QC lot) — the system does not infer them. (D12a.)
- **FR-D5.** **Dilution factor** (quantitative only): reported result = entered value × dilution factor. (D14.)
- **FR-D6.** **Replicate / repeat values** behind a collapsed toggle (Rep 1–n + mean). (D14.)
- **FR-D7.** **Instrument flags** from the analyzer payload shown read-only (clot, error codes, out-of-linear-range). (D14.)
- **FR-D8.** Method and Analyzer are surfaced in the work zone (FR-C1) and are **not duplicated** in this section.

### E. Non-Conformity (NCE)
- **FR-E1.** "Report Non-Conformity" opens the **real inline NCE form** (the shipped `InlineNceForm`, embedded — not a modal), auto-linking the sample and result. (D2.)
- **FR-E2.** NCE fields (authoritative): NCE Number (auto, read-only), Reporter (session), Date of Event\*, Reporting Unit\*, Category\*, Subcategory, Severity\* (Critical/Major/Minor), Title, Description\*, Immediate Action, Suspected Causes, Proposed Action, Attachments. (\* required.)
- **FR-E3.** NCE **Result Disposition** = Cancel / Reject + reason / Retest. **Refer-out is not a disposition** (see FR-F).

### F. Referral (refer-out)
- **FR-F1.** "Refer this test" is a **distinct row action** that opens an inline referral form (not an NCE disposition). (D3, D16.)
- **FR-F2.** Referral fields: **Reference laboratory\***, **Reason\***, **Referral date/time** (defaults to now, editable). No "test to perform" field — the referred test is already known.
- **FR-F3.** Saving sets `Analysis.referredOut` and hands off to the Referrals / Sample Shipment subsystem (`soSend*` lifecycle). This work does not modify those pages.

### G. Interpretation
- **FR-G1.** Interpretation is an **editor**, not a read-only suggestion, with three entry paths (D15): (a) **rule** — categorical buckets configured on the test, auto-matched to the entered value; picking a bucket applies its text; (b) **macro** — a **type-to-search** field (code or name) that inserts a canned phrase (D17); (c) **free text**. Rule text is a non-binding suggestion until applied/edited.

### H. History (this analysis)
- **FR-H1.** History shows **this analysis's own history only** (D7): prior saved values (`Analysis.revision`), status transitions (`enteredDate → startedDate → completedDate → releasedDate → printedDate`), retests/reflexes (`children`, `triggeredReflex`), corrections (`correctedSincePatientReport`), bound notes, and `audit_trail` changes.
- **FR-H2.** History is an **inline, default-collapsed section** (not a tab) and is **paginated** (standard 25/50/100). Patient-longitudinal trends (patient record) and Westgard rules (QC dashboard) are explicitly out of scope here.

### I. Aliquoting
- **FR-I1.** The panel includes an **Aliquots** section that reuses the existing aliquot function (D18): list existing aliquots and **create aliquot(s)** (count, type/species, volume/count, storage destination).
- **FR-I2.** Child sample items use numbering `LABNO.X` (`LABNO.X-Y` for vector sub-pools / deconvolution) and inherit storage + chain-of-custody.

### J. Notes (dual-axis)
- **FR-J1.** Notes use the **dual-axis model** (D10), consistent with the Validation page: each note carries a **context** (Entry / Modification / Validation — auto-set) and a **visibility** (Internal / Send with result = external).
- **FR-J2.** External visibility flows to the patient/clinician report; selecting it shows a "this note will appear on the patient report" confirmation.

### K. Sample status & disposal
- **FR-K1.** A **Sample status** control tracks the `SampleItem`'s remaining volume (D13). The tech can **record an amount used this test** (partial — decrements remaining) or **mark it used up** (exhausted).
- **FR-K2.** Full exhaustion or "Mark used up" queues the item into the disposal workflow (records who/when/method).

### L. Color, contrast & accessibility
- **FR-L1.** Critical/abnormal/normal/invalid flags use **leading icon + Carbon `Tag` + bold text** at WCAG 2.2 AA — not background tint alone (D8). The value cell carries a left accent bar for scannability.
- **FR-L2.** All interactive controls are keyboard-reachable; status is never conveyed by color alone.

### M. Cross-domain (Lab Unit drives the page)
- **FR-M1.** `currentDomain` derives from the selected Lab Unit (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR`).
- **FR-M2. Water Quality (ENVIRONMENTAL):** no patient column; **Site** context (sampling point, source type) replaces patient; **regulatory limit** replaces the clinical reference range; a regulatory-exceedance banner replaces the critical-value banner.
- **FR-M3. Vector Surveillance (VECTOR):** **Trap** context; pool composition surfaced in the Aliquots section, **tech-entered** (species + count from morphological sorting / field collection) — not inferred (D18); abnormal-only review.
- **FR-M4.** i18n keys follow `label.foo` / `label.foo.env` / `label.foo.vector` with clinical fallback.

---

## Data Model (reuse-first)

All UI elements trace to existing OpenELIS entities; new data is declared as a named dependency rather than invented.

| Concept | Entity / field (existing) | Notes |
|---|---|---|
| Analysis lifecycle | `Analysis` (`status/statusId`, `revision`, `enteredDate`, `startedDate`, `completedDate`, `releasedDate`, `printedDate`, `correctedSincePatientReport`, `children`, `triggeredReflex`, `referredOut`, `soSend*`) | Drives edit-state, status, history, referral |
| Result value | `Result` | Polymorphic by result type |
| Method | `Analysis.method` → `Method` | Method/type column |
| Analyzer instance | `Analysis.analyzerId` | Specific instrument |
| Reagent consumption | `ReagentConsumptionEvent`, `Reagent`, `ReagentLot` | Reagent-usage model; `sourceType=RESULT_ENTRY` |
| NCE | `nonconform` module (`InlineNceForm`, `/rest/reportnonconformingevent`, NCE Category/Type/Severity) | Real inline form |
| Notes | `Note` (BoundTo.ANALYSIS), dual-axis visibility × context | |
| Sample | `SampleItem` (status; storage) | Partial-use + disposal |
| Site / env | `Site_Information`, sampling point | Env context |
| Aliquots | existing aliquot function, numbering `LABNO.X[-Y]` | |

### Declared dependencies (not yet in the shipped schema — flag, don't invent)
1. **Test Catalog → Method → Reagent linkage** (gates the v2.1 per-test reagent list; interim = free-form picker).
2. **Manual / RDT control-result persistence** (analyzer QC exists; bench-entered control results need a home).
3. **`SampleItem` remaining-volume field** (for partial-use tracking).
4. **Sample disposal hand-off** in the storage module.
5. **Per-test interpretation rule config** (categorical buckets) — confirm/extend.

---

## Permissions & Audit

- **Role attachment.** Accessible via the existing **Analyst (results) role bundle** — anyone who can enter results. No new granular per-action permission keys (OpenELIS uses binary admin + module-bundle roles). Reagent consumption recording is auto-granted with results-modify per the reagent-usage spec; referral and NCE use their existing module access.
- **Roles Builder additions.** None — no new module-level grant introduced.
- **Audit events (`audit_trail`).** `RESULT_SAVED` / `RESULT_MODIFIED` (analysis id, value, revision, actor); `REAGENT_CONSUMPTION_RECORDED` (event id, lot, qty); `CONTROL_RESULT_RECORDED` (analysis id, outcome); `SAMPLE_USE_RECORDED` / `SAMPLE_MARKED_EXHAUSTED` (sample item id, amount); `ALIQUOT_CREATED` (parent/child ids); `TEST_REFERRED` (analysis id, reference lab, reason); `NCE_REPORTED` (handled by the NCE module). Reads are not audited.
- **Envers.** No new entities introduced by this UI; existing audited entities (`Analysis`, `Result`, `Note`) retain `@Audited`. Any new persistence from the declared dependencies (e.g. control results, remaining-volume) should default to `@Audited` as clinical data.

---

## Localization (representative keys)

| Key | English |
|---|---|
| `label.results.edit` | Edit |
| `label.results.save` | Save |
| `label.results.method` | Method |
| `label.results.analyzer` | Analyzer |
| `label.results.reagentsQcControls` | Reagents, QC & Controls |
| `label.results.quantityUsed` | Quantity used |
| `label.results.control.line` | Control line |
| `label.results.control.valid` | Valid |
| `label.results.control.invalid` | Invalid |
| `label.results.control.expected` | Expected value |
| `label.results.control.uncertainty` | Uncertainty (±) |
| `label.results.dilutionFactor` | Dilution factor |
| `label.results.replicates` | Replicate / repeat values |
| `label.results.sampleStatus` | Sample status |
| `label.results.amountUsed` | Amount used this test |
| `label.results.markUsedUp` | Mark used up |
| `label.results.startDisposal` | Start disposal |
| `label.results.aliquots` | Aliquots |
| `label.results.createAliquots` | Create aliquot(s) |
| `label.results.refer` | Refer this test |
| `label.results.referenceLab` | Reference laboratory |
| `label.results.referralReason` | Reason for referral |
| `label.results.referralDate` | Referral date/time |
| `label.results.interpretation` | Interpretation |
| `label.results.insertMacro` | Insert macro |
| `label.results.history` | History (this analysis) |
| `label.results.resetLayout` | Reset layout |
| `label.results.site.env` | Site |
| `label.results.regulatoryLimit.env` | Regulatory limit |
| `label.results.trap.vector` | Trap |
| `label.results.poolComposition.vector` | Pool composition |

(Full key set lives with the implementation; env/vector variants use the `.env` / `.vector` suffix with clinical fallback.)

---

## Out of scope
- The multi-level validation pipeline (preserved).
- Redesign of the Validation page beyond inheriting the Method/Analyzer split.
- Redesign of Referrals / Sample Shipment / reference-lab-results.
- New admin permissions; multi-tenancy / per-site filtering (OpenELIS is single-tenant per deployment).
- Reagent open-vial/first-use date (belongs to reagent/lot management).
- Patient-longitudinal trends and Westgard rules (patient record / QC dashboard).

## Open questions (flagged for ratification)
- NCE disposition placement — Cancel/Reject/Retest currently live inside the NCE form (filing an NCE *is* the rejection workflow); confirm whether disposition should be selectable without a full NCE.
- Each "Declared dependency" above needs engineering confirmation before the corresponding slice is sized.
