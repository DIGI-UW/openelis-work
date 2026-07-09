# Results Entry — Functional Requirements Specification (multi-component integrated)

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** `/Results` · **SideNav:** Workplan → Results · **Breadcrumb:** Home / Workplan / Results
**Related surfaces:** Validation Page (inherits the Method/Analyzer split **and** the multi-component rendering), Admin Validation Configuration (cross-domain config). Referrals / Sample Shipment, NCE module, Reagent Inventory, Reagent Forecasting, Storage are integration points, not redesigned here.
**Companion artifacts:** `results-entry-v4-preview.html` (mockup), `results-entry-v4-decisions.md` (design decisions D1–D19), plus the multi-component V1 artifacts (`results-entry-multicomponent-v1.*`).
**Supersedes:** the Results Entry **v4** FRS (`results-entry-v4.md`). This is a **new full FRS** (per the "not-started ⇒ new FRS, not addendum" rule) that carries forward all v4 scope and natively integrates **multi-component result entry**. Version-agnostic — version boundaries are decided in the breakdown, not here.
**Related Jira:** OGC-811 (this Results Entry redesign), OGC-1124 (multi-component V1 on the current page), OGC-1126 (report), OGC-1127 (show-on-report), OGC-1128 (component identity + component-aware terminology), OGC-1129 (analyzer ingestion), OGC-1130 (this v4 fold-in). Program: OGC-949.

---

## Lab Context

### Current State
The Results Entry page is where a bench technician records the value of a test for a sample that's waiting on a result. A tech sits at the bench with a worklist of pending tests — some read off an instrument (an "analyzer"), some run by hand (a rapid test strip, a manual microscopy slide). For each one they open the row, type or pick the value, note which method and instrument produced it, sometimes record which reagent lot they used and a quality-control (QC) check, and save. The same page is used by labs that don't test patients at all: environmental labs testing drinking water against regulatory limits, and vector-surveillance labs testing pools of mosquitoes for disease. Which kind of lab you are is set by the **Lab Unit** you select at the top of the page.

Most tests produce **one** value. But some produce **several at once**. A molecular PCR (Polymerase Chain Reaction) assay on a GeneXpert instrument is the driving example: one cartridge reports an overall call (e.g. "MTB DETECTED") plus a value for each **target gene / probe** it amplified — for Xpert MTB/RIF, five *rpoB* probe **Ct** values (cycle threshold — the PCR cycle at which the signal is detected). Today the page can record only the single overall call; the other values have nowhere to go and live on the instrument printout.

### Pain
The current design buries the one thing the tech is there to do. When a row is expanded, the result value sits at the *bottom* of a stack of fourteen blocks, so the tech scrolls past everything to reach the field they came for. A single "Analyzer Result" column conflates two different facts — the *method* (e.g. "Cobas TaqMan") and the *specific instrument* (one of four machines the lab nicknamed Leonardo, Donatello, Michelangelo, Raphael). A saved, validated value can be overwritten just by clicking into it. Reagent use, QC controls, dilutions, and "this sample is used up" have nowhere to be recorded at the bench, so they live on paper. Critical and abnormal flags are pale color tints that are hard to see. The "History" tab shows patient trends and statistical (Westgard) rules that don't belong on this screen. **And a multi-value test can only capture one value** — a "MTB DETECTED, very low" result isn't reproducible or auditable because the five probe Cts behind it never enter the system.

### What Changes
The expanded row leads with what the tech touches: the value, the method, the specific instrument, and notes — with an explicit Edit→Save control so a saved value can't be changed by accident. Method and instrument become two separate fields, prefilled from the analyzer. Everything the tech only *reads* collapses into summarized, remember-my-choice sections below. The tech can record reagent lots and quantity used, a QC control, a dilution factor, partial or full use of the sample, and can create aliquots — all without leaving the page. Flags become high-contrast icon-and-tag badges. "History" now shows *this test's* own history. Selecting a different Lab Unit reshapes the page for water-quality or mosquito-pool work. **And a test that defines more than one result component now shows a result field for each — using the very same result widgets — so the tech captures every value the test produces (all five probe Cts, or an N2/E pair), while single-result tests look exactly as they do today.**

---

## Overview

Results Entry consolidates the legacy result-entry routes into one `/Results` workbench: a filterable table of pending analyses with an inline-expanding panel per row. The panel is reorganized into a **work zone** (always-open, high-touch fields) and a **reference zone** (collapsed, summarized, sticky-per-user sections). The page is cross-domain: a `currentDomain` of `CLINICAL` / `ENVIRONMENTAL` / `VECTOR` is derived from the selected Lab Unit and reshapes columns, banners, and labels. No new domain enum value is introduced (never `BOTH`).

**Multi-component results.** A test may define one or more **result components** (OGC-949 M1 `test_result_component`); every legacy test has exactly one (`PRIMARY`), so today's single-value behavior is just "one component." This FRS renders **one result field per component**, each produced by the **same polymorphic result widget** used today (chosen by that component's result type), with the component's own label, unit, significant digits, and reference range. The first/primary component is the result as today; additional components mirror it. This is the durable home of the capability piloted on the current page in OGC-1124.

**Navigation & URL.** Canonical route `/Results`; SideNav path Workplan → Results; breadcrumb Home / Workplan / Results. The selected Lab Unit and status filter are the page's primary state; the route stays stable across rows.

---

## User Stories

- **As a bench technician,** I want the result value(s), method, and instrument at the top of the expanded row with one Edit→Save control, so I can enter or correct a result quickly without scrolling and without overwriting a validated value by accident.
- **As a bench technician entering a multi-component test,** I want a result field for **each** component (e.g. the MTB call plus each rpoB probe Ct) using the same fields I already use, so I capture every value the assay produced.
- **As a bench technician,** I want to record which reagent lot and how much I used, a QC control result, and a dilution factor at the moment I enter the result, so consumption and quality data stop living on paper.
- **As a bench technician,** I want to mark a sample partly or fully used and create aliquots from this screen, so sample handling is captured where the work happens.
- **As a bench technician,** I want to file a non-conformity or refer a test out from the row, so quality and referral workflows start in context.
- **As an environmental / vector technician,** I want the page to drop patient fields and show site or trap context with regulatory limits or pool composition, so the screen matches non-clinical work.
- **As a supervisor,** I want this analysis's own history (prior values, retests, status changes) visible inline, so I can see what happened to this result without leaving the page.

---

## Functional Requirements

### A. Result entry & edit-state machine
- **FR-A1.** Each result field is **polymorphic**: numeric (`NumberInput`), dictionary/qualitative (`Select`), or multi-select (checkbox set), driven by the **component's** result type.
- **FR-A2.** A **saved** result renders **read-only**. An **Edit** control on the row unlocks all editable fields in the expanded panel (every component value, method, analyzer, reagent, controls, notes) and swaps to **Save**. (Per-row scope — decision D1.) Edit unlocks the whole analysis, including all its components together.
- **FR-A3.** An **un-resulted** row is editable on open; a **Save** control appears once any value is entered. States: `EMPTY → DIRTY → SAVED(read-only) → (Edit) → EDITING → SAVED`.
- **FR-A4.** **Save** records the user's e-signature. Save is **never blocked** on critical-value acknowledgment; acknowledgment is a follow-up on the Alerts dashboard.
- **FR-A5.** Editing a previously-saved value sets the note context to **Modification** (see FR-J) and is captured in this-analysis history (see FR-H).

### A′. Multi-component results *(new — integrates OGC-1124 into this redesign)*
- **FR-A′1.** For an analysis whose test defines **N result components**, the work zone renders **N result fields**, one per component, in the component `display_order`. A test with a single (`PRIMARY`) component renders exactly one field — **identical to today**.
- **FR-A′2.** Each component's field is produced by the **existing polymorphic result renderer** (FR-A1) chosen by that component's `result_type`; **no bespoke widget** is introduced. Additional components render as result lines that **mirror the primary**, each showing the component label and applying its unit, significant digits, and reference range.
- **FR-A′3.** Each component value is **saved and read back keyed to its `component_id`**; saving one component does not alter another, and the primary component keeps today's read/write path.
- **FR-A′4.** An empty component value renders blank everywhere (entry, validation, report) — never a fabricated 0.
- **FR-A′5.** Which components appear is **data-driven** (the test's components); there is no feature flag and no molecular-specific branch. "Ct" is a unit on numeric components, not a special case.
- **FR-A′6.** The edit-state machine (FR-A2/A3), e-signature on Save (FR-A4), flags/contrast (FR-L), and history (FR-H) all apply per analysis across its components.

### B. Method + Analyzer split
- **FR-B1.** Method and Analyzer are **two distinct fields/columns**: **Method** is the analyzer *type* / method (`Analysis.method` → `Method`); **Analyzer** is the specific instrument instance (`Analysis.analyzerId`).
- **FR-B2.** On analyzer import, **Method prefills** from the analyzer type and **Analyzer prefills** with the instrument instance; both editable when the row is in Edit. A provenance indicator marks analyzer-imported rows. Per-component values imported from the analyzer prefill their respective component fields (see FR-N / OGC-1129).
- **FR-B3.** The Validation Page inherits this split.

### C. Panel hierarchy & progressive disclosure
- **FR-C1.** The expanded panel is split into a **work zone** (always open: result value(s) + method + analyzer + notes + row actions) and a **reference zone** (collapsible sections below). For a multi-component test, the component result fields all live in the work zone.
- **FR-C2.** Patient/site/trap context renders as one **compact strip**, not a stack of banners, with **no decorative leading icon** (D19). A full-width banner is reserved for the critical-value acknowledgment only.
- **FR-C3.** Reference-zone sections are **collapsed-but-summarized** — the collapsed header shows a one-line gist.
- **FR-C4.** Section open/closed state is **remembered per user** across rows and sessions (browser-local; "Reset layout" restores defaults). Precedence: remembered > per-result auto-open > collapsed. A section **auto-opens** when this result has notable content. (D9.)
- **FR-C5.** Sections render **conditionally** — a section with no content for this result is not rendered.

### D. Combined Reagents, QC & Controls
- **FR-D1.** Reagent capture **adopts the reagent-usage model**: where the Test Catalog → Method → Reagent linkage exists, the per-test reagent list (capture mode HIDDEN/OPTIONAL/REQUIRED, FIFO lot cards, Quantity Used + Unit, low-stock warning, override-reason); until that linkage ships, the free-form name/lot ComboBox picker. Both write a `ReagentConsumptionEvent` (`sourceType = RESULT_ENTRY`) and auto-credit on void/downward edit. (D11.)
- **FR-D2.** Analyzer-imported results show the reagent lot **read-only** ("analyzer-reported", capture mode HIDDEN).
- **FR-D3.** **Control result** capture adapts to test type (D12): for a rapid diagnostic test (RDT), the **control-line outcome** (Valid / Invalid; Invalid blocks reporting and prompts a repeat) with control lot; for a manual quantitative test, **measured value + expected value + uncertainty (±) + Pass/Fail** with control level and lot.
- **FR-D4.** **Expected value and uncertainty are entered by the tech** (or prefilled only if a target range is configured for the QC lot). (D12a.)
- **FR-D5.** **Dilution factor** (quantitative only): reported result = entered value × dilution factor. Applies per numeric component. (D14.)
- **FR-D6.** **Replicate / repeat values** behind a collapsed toggle (Rep 1–n + mean). (D14.)
- **FR-D7.** **Instrument flags** from the analyzer payload shown read-only. (D14.)
- **FR-D8.** Method and Analyzer are surfaced in the work zone (FR-C1) and are **not duplicated** in this section.

### E. Non-Conformity (NCE)
- **FR-E1.** "Report Non-Conformity" opens the **real inline NCE form** (the shipped `InlineNceForm`, embedded — not a modal), auto-linking the sample and result. (D2.)
- **FR-E2.** NCE fields (authoritative): NCE Number (auto, read-only), Reporter (session), Date of Event\*, Reporting Unit\*, Category\*, Subcategory, Severity\* (Critical/Major/Minor), Title, Description\*, Immediate Action, Suspected Causes, Proposed Action, Attachments. (\* required.)
- **FR-E3.** NCE **Result Disposition** = Cancel / Reject + reason / Retest. **Refer-out is not a disposition** (see FR-F).

### F. Referral (refer-out)
- **FR-F1.** "Refer this test" is a **distinct row action** that opens an inline referral form (not an NCE disposition). (D3, D16.)
- **FR-F2.** Referral fields: **Reference laboratory\***, **Reason\***, **Referral date/time** (defaults to now, editable). No "test to perform" field.
- **FR-F3.** Saving sets `Analysis.referredOut` and hands off to the Referrals / Sample Shipment subsystem (`soSend*` lifecycle). This work does not modify those pages.

### G. Interpretation
- **FR-G1.** Interpretation is an **editor**, not a read-only suggestion, with three entry paths (D15): (a) **rule** — categorical buckets configured on the test, auto-matched to the entered value; (b) **macro** — a **type-to-search** field that inserts a canned phrase (D17); (c) **free text**. Rule text is a non-binding suggestion until applied/edited. For multi-component tests, interpretation remains at the analysis level (the derived call), not per probe, unless a component defines its own interpretation rows.

### H. History (this analysis)
- **FR-H1.** History shows **this analysis's own history only** (D7): prior saved values (`Analysis.revision`), status transitions, retests/reflexes, corrections, bound notes, and `audit_trail` changes. Per-component value changes are included.
- **FR-H2.** History is an **inline, default-collapsed section** (not a tab) and is **paginated** (25/50/100). Patient-longitudinal trends and Westgard rules are out of scope.

### I. Aliquoting
- **FR-I1.** The panel includes an **Aliquots** section that reuses the existing aliquot function (D18): list existing aliquots and **create aliquot(s)** (count, type/species, volume/count, storage destination).
- **FR-I2.** Child sample items use numbering `LABNO.X` (`LABNO.X-Y` for vector sub-pools / deconvolution) and inherit storage + chain-of-custody.

### J. Notes (dual-axis)
- **FR-J1.** Notes use the **dual-axis model** (D10): each note carries a **context** (Entry / Modification / Validation — auto-set) and a **visibility** (Internal / Send with result = external).
- **FR-J2.** External visibility flows to the patient/clinician report; selecting it shows a confirmation.

### K. Sample status & disposal
- **FR-K1.** A **Sample status** control tracks the `SampleItem`'s remaining volume (D13): record an amount used this test (partial) or mark it used up (exhausted).
- **FR-K2.** Full exhaustion queues the item into the disposal workflow (records who/when/method).

### L. Color, contrast & accessibility
- **FR-L1.** Critical/abnormal/normal/invalid flags use **leading icon + Carbon `Tag` + bold text** at WCAG 2.2 AA — not background tint alone (D8). Applies per component value where a component carries its own range.
- **FR-L2.** All interactive controls are keyboard-reachable; status is never conveyed by color alone.

### M. Cross-domain (Lab Unit drives the page)
- **FR-M1.** `currentDomain` derives from the selected Lab Unit (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR`).
- **FR-M2. Water Quality (ENVIRONMENTAL):** no patient column; **Site** context replaces patient; **regulatory limit** replaces the clinical reference range; a regulatory-exceedance banner replaces the critical-value banner.
- **FR-M3. Vector Surveillance (VECTOR):** **Trap** context; pool composition surfaced in Aliquots, **tech-entered** (D18); abnormal-only review.
- **FR-M4.** i18n keys follow `label.foo` / `label.foo.env` / `label.foo.vector` with clinical fallback.

### N. Analyzer-fed component values *(functional objective; mechanism = OGC-1129)*
- **FR-N1.** Where results arrive from a configured analyzer, each target/component value prefills the correct component field of the correct test (matching on the component `code`, or its optional terminology code — never a display string). A target with no matching component surfaces as a visible unmapped-result exception, not silently dropped. Existing test-level (primary-result) analyzer flows are unchanged for single-component tests. *(Full spec: OGC-1129; stated here so the entry surface accounts for prefilled multi-component rows.)*

---

## Data Model (reuse-first)

All UI elements trace to existing OpenELIS entities; new data is declared as a named dependency.

| Concept | Entity / field (existing) | Notes |
|---|---|---|
| Analysis lifecycle | `Analysis` (`status/statusId`, `revision`, dates, `correctedSincePatientReport`, `children`, `triggeredReflex`, `referredOut`, `soSend*`) | Drives edit-state, status, history, referral |
| Result value | `Result` | Polymorphic by result type |
| **Result component** | `test_result_component` (`code` unique per test, `label`, `result_type`, `uom_id`, `significant_digits`, `display_order`, `is_active`) | Defines how many result fields render; PRIMARY per test today |
| **Per-component result value** | `Result` + **new nullable component linkage** | First multi-component consumer (see dependencies) |
| Method | `Analysis.method` → `Method` | Method/type column |
| Analyzer instance | `Analysis.analyzerId` | Specific instrument |
| Reagent consumption | `ReagentConsumptionEvent`, `Reagent`, `ReagentLot` | `sourceType=RESULT_ENTRY` |
| NCE | `nonconform` module | Real inline form |
| Notes | `Note` (BoundTo.ANALYSIS), dual-axis | |
| Sample | `SampleItem` (status; storage) | Partial-use + disposal |
| Component terminology | `test_terminology_mapping` + **nullable `component_id`** (OGC-1128, Option A) | Optional LOINC per component; test-level today |
| Show-on-report | `test_result_component.show_on_report` (OGC-1127) | Per-component report visibility |

### Declared dependencies (flag, don't invent)
1. **Runtime per-component result value linkage** — implemented as a **nullable `RESULT.component_id` FK → `test_result_component`** (null = PRIMARY = today). The `RESULT` table is **already one-to-many off `Analysis`** (multi-select and conjugate results already store several rows per analysis), so this **extends an existing pattern** rather than being greenfield; mirrors M1's nullable `component_id` on `TEST_RESULT` / `RESULT_LIMITS`. (See the runtime-storage spike.)
2. Test Catalog → Method → Reagent linkage (reagent list; interim = free-form picker).
3. Manual / RDT control-result persistence.
4. `SampleItem` remaining-volume field.
5. Sample disposal hand-off in the storage module.
6. Per-test interpretation rule config (categorical buckets).
7. Component-aware terminology (`component_id` on `test_terminology_mapping`) and per-component `show_on_report` — owned by OGC-1128 / OGC-1127.

---

## Permissions & Audit
- **Role attachment.** Accessible via the existing **Analyst (results) role bundle**. No new granular per-action permission keys. Reagent/referral/NCE use existing module access.
- **Roles Builder additions.** None.
- **Audit events (`audit_trail`).** `RESULT_SAVED` / `RESULT_MODIFIED` (analysis id, **component id**, value, revision, actor); `REAGENT_CONSUMPTION_RECORDED`; `CONTROL_RESULT_RECORDED`; `SAMPLE_USE_RECORDED` / `SAMPLE_MARKED_EXHAUSTED`; `ALIQUOT_CREATED`; `TEST_REFERRED`; `NCE_REPORTED` (NCE module). Reads not audited.
- **Envers.** Existing audited entities retain `@Audited`; new per-component result persistence defaults to `@Audited` as clinical data.

---

## Localization (representative keys)

Carries the v4 key set (`label.results.edit/save/method/analyzer/reagentsQcControls/…`, env/vector `.env`/`.vector` suffix with clinical fallback). Multi-component adds no per-target keys — **component labels come from the component's own label** via the existing localization mechanism (e.g. "N2 gene", "rpoB Probe A"), and "Ct" is a unit-of-measure value, not a key.

---

## Out of scope
- The multi-level validation pipeline (preserved).
- Redesign of the Validation page beyond inheriting the Method/Analyzer split **and** multi-component read-only display (its own FRS).
- Redesign of Referrals / Sample Shipment / reference-lab-results.
- New admin permissions; multi-tenancy / per-site filtering (single-tenant per deployment).
- Reagent open-vial/first-use date.
- Patient-longitudinal trends and Westgard rules.
- Pre-seeding molecular components (OGC-1125), patient-report rendering (OGC-1126), and the component/terminology admin UI (OGC-1127/1128) — separate stories; this FRS consumes their outputs.

## Open questions (flagged for ratification)
- NCE disposition placement (as v4).
- Each declared dependency needs engineering confirmation before its slice is sized — especially the **runtime per-component result linkage** (dependency 1), which gates multi-component entirely.
- **Notes: decided — per analysis** (today's model), not per component (per OGC-1124). Per-component notes are out of scope; revisit only if a real need appears.
- Whether **show_on_report** also affects entry/validation display or the report only (default: report only — OGC-1127).
