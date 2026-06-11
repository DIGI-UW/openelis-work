# Validation Page — Functional Requirements Specification (consolidated)

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Route:** `/Validation` · **SideNav:** Validation · **Breadcrumb:** Home / Validation *(verify route against the live app before build)*
**Companion artifacts:** `validation-page-v4-preview.html` (mockup), `results-entry-v4-decisions.md` (shared design decisions D1–D22), `results-entry-v4-frs.md` (sibling), `results-validation-config-v4-frs.md` (the admin page that drives this one).
**Epics:** OGC-817 (Validation Page), depends on OGC-343 (Validation Configuration) for its policy.
**Supersedes:** the v3 Validation drafts (`validation-page-v3-*`). Version-agnostic — slices decided at breakdown.

---

## Lab Context

### Current State
After a bench technician enters a result, it moves into a **validation** queue. A validator — a Supervisor, Senior Tech, or Lab Manager — opens the Validation page, looks at each pending result, and decides whether to **release** it (it becomes part of the patient's chart / the regulatory submission / the surveillance feed), **send it back for retest**, or **reject** it. In labs that do two-level review, a first reviewer checks technical correctness and a second checks clinical interpretation before release. The same page serves clinical, environmental (water-quality), and vector (mosquito-pool) labs; which one it is comes from the selected Lab Unit.

### Pain
Today the validator sees the value and a normal range but little of what they need to actually judge it. They can't tell at a glance which results carry a **non-conformity**, which had a **QC failure**, which were **modified after first save**, or which critical values still need an acknowledgment — so they either open every row or release on faith. The bulk controls make this worse: a "Save All Results" action selects every non-nonconforming row, which **includes abnormal and critical values**, so one click and one signature can release an unreviewed panic value. Rejection is a bare reason dropdown with no quality record. Method and the specific instrument are conflated in one column. The expanded panel buries context behind tabs, and a "History" tab shows patient trends and statistical rules that don't belong on this screen.

### What Changes
The queue becomes a triage surface. A **"Check before release"** column shows a chip only when a row carries risk (open NCE, QC fail, modified-after-save, acknowledgment pending, nonconforming), and **filters** let the validator narrow to just those. Bulk release is replaced by a **guarded "Release all clear"** that only ever touches the safe lane — anything flagged must be opened and released one at a time — and the whole bulk capability is an admin switch a lab can turn off. **Rejection files a non-conformity**; **retest carries a note** (required or optional per admin setting). Method and the specific analyzer are split. The expanded panel leads with a read-only review summary, History becomes *this analysis's* own history inline, and releasing commits an e-signature.

---

## Overview

The Validation page is the supervisory review-and-release surface paired with Results Entry. It presents a filterable queue of analyses awaiting validation, with an inline-expanding **review panel** per row. It is driven by the **Validation Configuration** admin page (triggers, sequential review levels, role bindings, auto-validation, and the behavior flags below) and is cross-domain via the selected Lab Unit (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR`). The multi-level validation pipeline (0–5 levels, per-lab-unit) is preserved as configured; this spec governs the page UI and its release/reject/retest behavior.

**Navigation & URL.** Route `/Validation`; SideNav "Validation"; breadcrumb Home / Validation. Selected Lab Unit, status, and the active "Check before release" filter are the page's primary state.

---

## User Stories

- **As a validator,** I want the queue to show me at a glance which results need a closer look (NCE, QC fail, modified, ack pending, nonconforming), so I can triage instead of opening every row.
- **As a validator,** I want to filter the queue to a single signal (e.g. just QC fails), so I can work the risky results first.
- **As a validator,** I want to release the obviously-clear results in one guarded action while being forced to open and review anything flagged, so throughput stays high without releasing an unreviewed critical value.
- **As a validator,** I want rejection to file a non-conformity and retest to carry a note, so quality events are recorded properly.
- **As a validator,** I want this result's own history (prior values, retests, status changes) and the method + specific instrument visible when I open it, so I can sign with full context.
- **As a Lab Manager,** I want to turn bulk release off and make the retest note required, so my lab's policy is enforced (configured on the Validation Configuration page).

## Functional Requirements

### A. Queue & triage
- **FR-A1.** The queue lists analyses awaiting validation for the selected Lab Unit, with columns: subject (lab # + patient/site/trap), test, result (flag-styled), reference range / regulatory limit, flag (Normal/Abnormal/Critical/Invalid), **Check before release**, status, and the per-row validation action. Method, Analyzer, Sex/Age, and prior-value columns are **not** in the table — they live in the expanded panel (D21).
- **FR-A2. "Check before release" column** renders a chip only when a row carries risk: **NCE open**, **QC fail**, **Modified** (after save), **Ack pending** (critical not yet acknowledged), **Nonconforming**. A clean row shows nothing; the chips are the reasons a row is in the needs-review lane. (D21.) **QC-fail provenance caveat:** the QC-fail signal is analyzer-derived today; for manual/RDT tests it depends on bench-entered control-result persistence (a declared dependency). Until that lands, a manual test with no captured control resolves to **needs-review**, not "QC passed" — the absence of a chip must never be read as "QC confirmed" on a test type whose QC isn't captured yet. **Patient delta-check is excluded** — it's patient-longitudinal (belongs on the patient record), noisy, and not tracked at this layer; distinct from Westgard (control-based), which surfaces as QC fail.
- **FR-A3. Filters.** A filter chip row narrows the queue by signal/flag (All · Needs review · NCE · QC fail · Modified · Ack pending · Critical · Abnormal) with live counts. The Clear lane and "Release all clear" count are computed from the **whole queue**, not the active filter.
- **FR-A4. Auto-validated rows** (released by a `NO_RESULTS`/`ABNORMAL_ONLY`-normal rule) are hidden by default behind an "Include auto-validated" toggle and never show release actions.

### B. Lanes & guarded bulk release (D20)
- **FR-B1.** The queue is partitioned into a **Clear lane** — in-range AND QC-pass AND no NCE AND not modified-after-save AND not critical AND confidently range-matched AND not nonconforming — and a **Needs-review lane** (everything else). Lanes are computed, not chosen. **Fail-safe (MUST):** any clearance input that is missing or indeterminate — QC not captured for a manual test, range-match fell back to a default, etc. — **excludes** the row from the Clear lane. A row is never *assumed* clear; the Clear lane is only as trustworthy as its inputs, so absent data resolves to Needs-review.
- **FR-B2. "Release all clear (N)"** is the only bulk release; it operates only on the Clear lane, shows lane counts, and opens a **scannable confirm list** (lab # · subject · test · result · range · flag) that the e-signature attests to. It can never release a critical/abnormal/flagged result.
- **FR-B3.** Needs-review rows present **"Review →"** (open the panel), not a one-click release. Per-row release happens inside the panel after review. Criticals require acknowledgment first.
- **FR-B4.** The entire bulk-release capability is gated by the **"Allow bulk release of clear results"** flag on the Validation Configuration page. Off ⇒ per-row release only.

### C. Review panel (per row)
- **FR-C1.** Expanding a row opens a review panel led by a **read-only review summary**: the result value (flag-styled), **Method** and **Analyzer instance** split (D-Results-entry B), reference range / limit, who entered it and when, and a QC chip. A compact context strip (patient/site/trap) carries **no decorative leading icon** (D19).
- **FR-C2.** When a row carries signals, the panel opens with a **"Before releasing, check:"** line echoing the chips.
- **FR-C3.** Reference-zone sections below (Reagents/QC/Controls — read-only review of what entry recorded; Notes; Order info; History; Attachments) are collapsible with one-line summaries.

### D. Validation actions
- **FR-D1. Validate & release** commits the validator's **e-signature** (release to chart / regulatory / surveillance). At an intermediate level it **advances** to the next level (not e-sig gated). Batch "Release all clear" commits one signature for the listed set.
- **FR-D2. Reject files a Non-Conformity Event** (D20) — the same real inline NCE form as Results Entry (category, subcategory, severity, description, disposition Reject/Cancel) — not a bare reason dropdown. Gated by the **`allowResultRejection`** setting.
- **FR-D3. Send for retest** opens a note field whose required-ness is the **retest-note-required** flag on the Validation Configuration page; creates a retest order and restarts the pipeline at level 1.
- **FR-D4. Modify result** requires a reason (per **`modify results note required`**) and, when **`modify results role`** is on, a user holding the designated role; the result returns to Awaiting validation.
- **FR-D5. Refer this test** is a distinct action that hands off to the Referral subsystem (not modified here).
- **FR-D6. Critical-value acknowledgment** can be done from the row; it never blocks release (it's a follow-up on the Alerts dashboard).

### E. History (this analysis) — same model as Results Entry
- **FR-E1.** History shows this analysis's own history only (revisions, status transitions, retests/reflexes, corrections, bound notes, audit), inline and paginated. Patient-longitudinal trends and Westgard rules are out of scope here (D7).

### F. Notes (dual-axis) — D10
- **FR-F1.** Notes carry **context** (auto-set to **Validation** here) × **visibility** (Internal / Send with result). External visibility flows to the report with the "appears on the report" confirmation.

### G. Method + Analyzer split — inherited
- **FR-G1.** The review summary shows **Method** (`Analysis.method`) and **Analyzer instance** (`Analysis.analyzerId`) as two fields (inherited from Results Entry, the only change the split imposes on this page).

### H. Color, contrast & accessibility
- **FR-H1.** Flags and signal chips use **icon + Carbon `Tag` + bold text at WCAG 2.2 AA** (not tint alone). Status is never conveyed by color alone; all controls keyboard-reachable.

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
| NCE (reject) | `nonconform` module (`InlineNceForm`, `/rest/reportnonconformingevent`) | Reject = file NCE |
| Notes | `Note` (BoundTo.ANALYSIS), visibility × context | Validation context |
| QC / control | analyzer QC; manual control result (dependency) | "QC fail" signal; a Westgard control violation surfaces here |
| NCE present (signal) | `non_conformity_event` linked to analysis/sample (`SampleQaEvent`) | "NCE open" chip |
| Critical-ack (signal) | alerts `criticalAckStatus` | "Ack pending" chip |
| Validation policy | `validation_config` / `validation_level_config` (per admin FRS) | Triggers, levels, roles |

**Declared dependencies (flag, don't invent):** manual/RDT control-result persistence (for the QC-fail signal on manual tests); confirm the exact `validateTechnicalRejection` flow; verify the `/Validation` route against the live app.

## Permissions & Audit
- **Role attachment:** existing **Validator (result.validate) role bundle**; level-N gating uses roles holding `result.validate` (configured on the admin page). No new per-action keys. `modify results role` (when on) gates Modify.
- **Audit:** `VALIDATE` (level, validator, role, e-signature), `AUTO_VALIDATE`, `RETEST` (reason), `REJECT`/`NCE_REPORTED`, `RESULT_MODIFIED_RELEASED`, `CRITICAL_ACK`, `STALE_PAGE_CONFLICT_VALIDATION`. Reads not audited.
- **Envers:** no new entities introduced here; `Analysis`/`Result`/`Note` remain `@Audited`.

## Localization (representative)
`label.validation.checkBeforeRelease`, `label.validation.releaseAllClear`, `label.validation.needsReview`, `label.validation.signal.nce|qcfail|modified|ack|nonconforming`, `button.validation.validateRelease`, `button.validation.reject` ("Reject (file NCE)"), `button.validation.retest`, `button.validation.modify`, `label.validation.filter.*`, plus `.env`/`.vector` variants with clinical fallback.

## Out of scope
Multi-level pipeline internals (preserved/configured via OGC-343), Referrals/Sample Shipment, Results Entry behavior (sibling FRS), patient-longitudinal trends / Westgard (patient record / QC dashboard), patient delta-check as a default signal.

## Open questions
- Confirm `/Validation` route + SideNav slot against the live app.
- Manual/RDT control-result persistence (shared dependency with Results Entry) drives the QC-fail signal on non-analyzer tests.
