# Validation Page — Functional Requirements Specification (multi-component integrated)

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** `/Validation` · **SideNav:** Validation · **Breadcrumb:** Home / Validation *(verify route against the live app before build)*
**Companion artifacts:** `validation-page-v4-preview.html` (mockup), `results-entry-v4-decisions.md` (shared design decisions D1–D22), the Results Entry multi-component FRS (sibling), `results-validation-config-v4.md` (the admin page that drives this one).
**Supersedes:** the Validation Page **v4** FRS (`validation-page-v4.md`). This is a **new full FRS** (per the "not-started ⇒ new FRS, not addendum" rule) that carries forward all v4 scope and adds **read-only multi-component display**.
**Related Jira:** OGC-817 (this page), depends on OGC-343 (Validation Configuration). Multi-component: OGC-1124 (entry+validation V1), OGC-1128 (component identity), OGC-1130 (v4 fold-in). Program: OGC-949 / epic OGC-1131.

---

## Lab Context

### Current State
After a bench technician enters a result, it moves into a **validation** queue. A validator — a Supervisor, Senior Tech, or Lab Manager — opens the Validation page, looks at each pending result, and decides whether to **release** it (it becomes part of the patient's chart / the regulatory submission / the surveillance feed), **send it back for retest**, or **reject** it. In labs that do two-level review, a first reviewer checks technical correctness and a second checks clinical interpretation before release. The same page serves clinical, environmental (water-quality), and vector (mosquito-pool) labs; which one it is comes from the selected Lab Unit.

Some tests produce **more than one value** — a molecular PCR test reports an overall call plus a value for each target gene / probe (e.g. Xpert MTB/RIF's five rpoB probe Ct values). The validator needs to see all of them to sign with full context.

### Pain
Today the validator sees the value and a normal range but little of what they need to actually judge it. They can't tell at a glance which results carry a **non-conformity**, a **QC failure**, were **modified after first save**, or still need a critical-value **acknowledgment** — so they either open every row or release on faith. The bulk controls make this worse: a "Save All Results" action selects every non-nonconforming row, **including abnormal and critical values**, so one click and one signature can release an unreviewed panic value. Rejection is a bare reason dropdown with no quality record. Method and the specific instrument are conflated in one column. And a multi-value test shows only its overall call — the validator can't see the per-target values behind it.

### What Changes
The queue becomes a triage surface. A **"Check before release"** column shows a chip only when a row carries risk, and **filters** let the validator narrow to just those. Bulk release is replaced by a **guarded "Release all clear"** that only ever touches the safe lane; the whole bulk capability is an admin switch. **Rejection files a non-conformity**; **retest carries a note**. Method and the specific analyzer are split. The expanded panel leads with a read-only review summary, History becomes *this analysis's* own history inline, and releasing commits an e-signature. **For a multi-component test the review panel shows every component read-only — value, label, unit, range, flag — in order, so the validator reviews the whole result before releasing.**

---

## Overview

The Validation page is the supervisory review-and-release surface paired with Results Entry. It presents a filterable queue of analyses awaiting validation, with an inline-expanding **review panel** per row, driven by the **Validation Configuration** admin page and cross-domain via the selected Lab Unit (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR`). The multi-level validation pipeline (0–5 levels, per-lab-unit) is preserved as configured.

**Multi-component (read-only).** A test may define one or more **result components** (OGC-949 M1 `test_result_component`); every legacy test has one (`PRIMARY`). This page displays **every component read-only** in the review panel; the validator never edits values here (edits happen on Results Entry — reject/retest to change). The queue row shows the primary/derived result with an indicator when a test has additional components. Validation is release-of-the-whole-analysis: releasing commits all its components together.

**Navigation & URL.** Route `/Validation`; SideNav "Validation"; breadcrumb Home / Validation. Selected Lab Unit, status, and the active "Check before release" filter are the page's primary state.

---

## User Stories

- **As a validator,** I want the queue to show me at a glance which results need a closer look (NCE, QC fail, modified, ack pending, nonconforming), so I can triage instead of opening every row.
- **As a validator,** I want to filter the queue to a single signal, so I can work the risky results first.
- **As a validator,** I want to release the obviously-clear results in one guarded action while being forced to open and review anything flagged, so throughput stays high without releasing an unreviewed critical value.
- **As a validator reviewing a multi-component test,** I want to see every component's value read-only (all probe Cts, the N2/E pair), so I can confirm the derived call before I release.
- **As a validator,** I want rejection to file a non-conformity and retest to carry a note, so quality events are recorded properly.
- **As a validator,** I want this result's own history and the method + specific instrument visible when I open it, so I can sign with full context.
- **As a Lab Manager,** I want to turn bulk release off and make the retest note required (configured on the Validation Configuration page).

## Functional Requirements

### A. Queue & triage
- **FR-A1.** The queue lists analyses awaiting validation for the selected Lab Unit, with columns: subject (lab # + patient/site/trap), test, result (flag-styled), reference range / regulatory limit, flag, **Check before release**, status, and the per-row action. Method, Analyzer, Sex/Age, and prior-value columns live in the expanded panel (D21). For a multi-component test the result cell shows the **primary/derived** result plus a small **"N components"** indicator; the individual component values appear in the panel (FR-C4), not as extra columns.
- **FR-A2. "Check before release" column** renders a chip only when a row carries risk: **NCE open**, **QC fail**, **Modified**, **Ack pending**, **Nonconforming**. A clean row shows nothing. **QC-fail provenance caveat** (as v4): analyzer-derived today; manual/RDT depends on bench-entered control persistence — absence of a chip must never be read as "QC confirmed" for a test type whose QC isn't captured yet. **Multi-component:** a signal on **any** component (e.g. one probe abnormal/critical, or a component's QC fail) flags the whole row. **Patient delta-check excluded** (patient-longitudinal).
- **FR-A3. Filters.** A filter chip row narrows by signal/flag (All · Needs review · NCE · QC fail · Modified · Ack pending · Critical · Abnormal) with live counts computed from the whole queue.
- **FR-A4. Auto-validated rows** are hidden by default behind an "Include auto-validated" toggle and never show release actions.

### B. Lanes & guarded bulk release (D20)
- **FR-B1.** The queue is partitioned into a **Clear lane** — in-range AND QC-pass AND no NCE AND not modified-after-save AND not critical AND confidently range-matched AND not nonconforming — and a **Needs-review lane** (everything else). Lanes are computed. **Fail-safe (MUST):** any missing/indeterminate clearance input excludes the row from Clear. **Multi-component:** a test is Clear only if **every** component is clear; any component abnormal/critical/QC-uncaptured pushes the whole analysis to Needs-review.
- **FR-B2. "Release all clear (N)"** is the only bulk release; operates only on the Clear lane, shows lane counts, and opens a scannable confirm list the e-signature attests to. It can never release a critical/abnormal/flagged result (including one hidden inside a multi-component test).
- **FR-B3.** Needs-review rows present **"Review →"**; per-row release happens inside the panel after review. Criticals require acknowledgment first.
- **FR-B4.** The entire bulk-release capability is gated by the **"Allow bulk release of clear results"** flag on the Validation Configuration page.

### C. Review panel (per row)
- **FR-C1.** Expanding a row opens a review panel led by a **read-only review summary**: the result value (flag-styled), **Method** and **Analyzer instance** split, reference range / limit, who entered it and when, and a QC chip. A compact context strip (patient/site/trap) carries **no decorative leading icon** (D19).
- **FR-C2.** When a row carries signals, the panel opens with a **"Before releasing, check:"** line echoing the chips.
- **FR-C3.** Reference-zone sections below (Reagents/QC/Controls — read-only review; Notes; Order info; History; Attachments) are collapsible with one-line summaries.
- **FR-C4. Multi-component review (new).** For a test with N components, the review summary lists **all N components read-only**, in `display_order`, each showing its label, value, unit, reference range, and flag styling — the primary/derived result first, additional components mirroring it. Empty component values render blank (never 0). The validator does not edit here; to change a value they reject/retest back to the bench. Component `show_on_report = false` does **not** hide the component from validation review (the validator always sees the full result; the flag governs the report only — OGC-1127).

### D. Validation actions
- **FR-D1. Validate & release** commits the validator's **e-signature** and releases the whole analysis (all its components). At an intermediate level it **advances** (not e-sig gated). Batch "Release all clear" commits one signature for the listed set.
- **FR-D2. Reject files a Non-Conformity Event** — the same real inline NCE form as Results Entry — not a bare reason dropdown. Gated by **`allowResultRejection`**.
- **FR-D3. Send for retest** opens a note field whose required-ness is the **retest-note-required** flag; creates a retest order and restarts the pipeline at level 1.
- **FR-D4. Modify result** requires a reason (per **`modify results note required`**) and, when **`modify results role`** is on, the designated role; the result returns to Awaiting validation. (Editing of component values happens on Results Entry.)
- **FR-D5. Refer this test** hands off to the Referral subsystem (not modified here).
- **FR-D6. Critical-value acknowledgment** can be done from the row; never blocks release.

### E. History (this analysis) — same model as Results Entry
- **FR-E1.** History shows this analysis's own history only (revisions incl. per-component value changes, status transitions, retests/reflexes, corrections, bound notes, audit), inline and paginated. Patient-longitudinal trends and Westgard rules are out of scope (D7).

### F. Notes (dual-axis) — D10
- **FR-F1.** Notes carry **context** (auto-set to **Validation**) × **visibility** (Internal / Send with result). External visibility flows to the report with the "appears on the report" confirmation.

### G. Method + Analyzer split — inherited
- **FR-G1.** The review summary shows **Method** (`Analysis.method`) and **Analyzer instance** (`Analysis.analyzerId`) as two fields.

### H. Color, contrast & accessibility
- **FR-H1.** Flags and signal chips use **icon + Carbon `Tag` + bold text at WCAG 2.2 AA** (not tint alone), applied per component value where a component carries its own range. Status never conveyed by color alone; all controls keyboard-reachable.

### I. Cross-domain (Lab Unit drives the page)
- **FR-I1.** ENVIRONMENTAL: no patient column; Site context; regulatory limit replaces reference range; regulatory-exceedance banner replaces the critical banner. VECTOR: Trap context; abnormal-only review per config. i18n keys use `.env` / `.vector` suffix with clinical fallback.

### J. Concurrency
- **FR-J1.** A stale-page conflict guard detects when another validator has acted on a row since load and surfaces a toast + reload (audit `STALE_PAGE_CONFLICT_VALIDATION`).

---

## Data Model (reuse-first)

| Concept | Entity / field (existing) | Notes |
|---|---|---|
| Analysis lifecycle / status | `Analysis` (`status/statusId`, `revision`, status dates, `correctedSincePatientReport`, `children`, `referredOut`) | Drives lanes, status, history |
| Method / Analyzer | `Analysis.method` → `Method`; `Analysis.analyzerId` | Split fields |
| **Result component** | `test_result_component` (`code`, `label`, `result_type`, `uom_id`, `display_order`) | Drives per-component read-only display |
| **Per-component result value** | `Result` + nullable component linkage (OGC-1124) | Read-only here |
| NCE (reject) | `nonconform` module (`InlineNceForm`) | Reject = file NCE |
| Notes | `Note` (BoundTo.ANALYSIS), visibility × context | Validation context |
| QC / control | analyzer QC; manual control result (dependency) | "QC fail" signal, per component |
| NCE present (signal) | `non_conformity_event` / `SampleQaEvent` | "NCE open" chip |
| Critical-ack (signal) | alerts `criticalAckStatus` | "Ack pending" chip |
| Validation policy | `validation_config` / `validation_level_config` | Triggers, levels, roles |

**Declared dependencies (flag, don't invent):** the runtime per-component result value linkage (shared with OGC-1124 — a nullable `RESULT.component_id` FK; the `RESULT` table is already one-to-many off `Analysis`, so this is additive, not greenfield); manual/RDT control-result persistence (QC-fail signal on manual tests); confirm `validateTechnicalRejection`; verify `/Validation` route against the live app.

## Permissions & Audit
- **Role attachment:** existing **Validator (result.validate) role bundle**; level-N gating uses roles holding `result.validate` (configured on the admin page). No new per-action keys. `modify results role` gates Modify.
- **Audit:** `VALIDATE` (level, validator, role, e-signature), `AUTO_VALIDATE`, `RETEST` (reason), `REJECT`/`NCE_REPORTED`, `RESULT_MODIFIED_RELEASED`, `CRITICAL_ACK`, `STALE_PAGE_CONFLICT_VALIDATION`. Release audit covers all components of the analysis. Reads not audited.
- **Envers:** no new entities introduced here; `Analysis`/`Result`/`Note` remain `@Audited`.

## Localization (representative)
Carries the v4 keys (`label.validation.checkBeforeRelease`, `releaseAllClear`, `needsReview`, `signal.nce|qcfail|modified|ack|nonconforming`, `button.validation.validateRelease|reject|retest|modify`, `filter.*`, `.env`/`.vector` variants). Multi-component adds no per-target keys — component labels come from the component's own label; a `label.validation.components` indicator string ("N components") is the only addition.

## Out of scope
Multi-level pipeline internals (preserved/configured via OGC-343), Referrals/Sample Shipment, Results Entry behavior (sibling FRS), patient-longitudinal trends / Westgard, patient delta-check as a default signal, editing component values here (done on Results Entry), pre-seed / report / catalog stories (OGC-1125/1126/1127/1128).

## Open questions
- Confirm `/Validation` route + SideNav slot against the live app.
- Manual/RDT control-result persistence (shared dependency) drives the QC-fail signal on non-analyzer tests, per component.
- Confirm the runtime per-component result linkage (dependency shared with OGC-1124) before sizing.
