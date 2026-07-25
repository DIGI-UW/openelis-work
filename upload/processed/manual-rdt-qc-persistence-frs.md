# Manual & RDT QC Persistence — Functional Requirements Specification

**Status:** Draft for review
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Surfaces:** QC data layer (backend), Quality Assurance menu → Statistical QC pillar (Manual QC leaf), Results Entry (capture UI — owned by the Results Entry FRS, referenced not redesigned here), Validation (QC-fail signal consumer)
**Companion artifacts:** `westgard_rules_implementation.md` (Westgard Phase 2 FRS — schema and rule engine this builds on), `results-entry-multicomponent-frs.md` (FR-D3/D4 — capture UI), `designs/quality/analyzer-manual-qc.md` (Analyzer Manual QC Recording FRS — owns the shared `QcRun` table and the `label.analyzerQc.*` / Pass–Fail i18n vocabulary; reuse, don't duplicate), `qa-gap-closure-and-portal-plan.md` (Plan A)
**Related Jira:** OGC-1147 (this FRS / build-time decisions), OGC-1025 (Results Entry R6 — unblocked by this), OGC-692 (Manual QC placeholder leaf — made real by this), OGC-684/OGC-685 (Westgard Tiers under OGC-682), OGC-428 (Analyzer Manual QC Recording — same entry path, analyzer source)

---

## Lab Context

### Current State
In most labs running OpenELIS, the analyzer is the exception, not the rule. The bulk of the daily workload is run by hand: rapid diagnostic tests (RDTs) for HIV, malaria, syphilis; manual quantitative methods like hemoglobin by HemoCue or manual chemistry. Every one of those methods runs controls — the tech checks the RDT control line before reading a patient strip, or runs a control material and compares the measured value against its expected range. Today none of that has anywhere to live in OpenELIS. The Westgard Phase 2 work (OGC-682) gives analyzer-connected tests a full statistical QC system — control lots, Levey-Jennings charts, automatic rule violations, corrective actions — but its tables are fed only by the ASTM interface. Manual and RDT QC stays where it has always been: in a paper register at the bench.

### Pain
The paper register is invisible. A supervisor cannot see this morning's failed malaria RDT control from the QC dashboard; a failing control does not stop the affected patient results from being released; and when an accreditation assessor asks for documented QC across *all* methods (SLIPTA checklist, ISO 15189), the lab produces a binder for manual tests and a screen for analyzer tests. The system's QC story covers the minority of the workload. It also undercuts the release we are about to ship: the QA menu will show a "Manual QC" leaf that is an empty placeholder (OGC-692), and Results Entry's control-capture slice (OGC-1025) is blocked outright because there is no table to save into.

### Why this must be in the QC system

**Patient safety.** An RDT control line is the only thing standing between a bad kit lot and a wrong HIV or malaria result handed to a patient. When the control check lives on paper, nothing in the system connects "this morning's control was Invalid" to "these fifteen patient results from the same session are about to be released." Persisting the control is what lets the system make that connection automatically — block at entry, flag at validation.

**It's most of the lab's work.** In the facilities OpenELIS serves, manual and RDT methods are the majority of daily test volume — often the overwhelming majority at district and health-center level, where there may be no interfaced analyzer at all. A QC system that only sees analyzer QC is, for those labs, a QC system that sees almost nothing. This feature is what makes the QA release relevant to every tier of the lab network, not just reference labs.

**Accreditation.** SLIPTA and ISO 15189 require documented QC for *all* examination procedures — the assessor does not care whether the method had a serial cable. Labs pursuing accreditation today keep a parallel paper QC register for manual methods and transcribe it for audits. One system of record, exportable, with corrective actions attached, is direct audit evidence and removes the double bookkeeping.

**Supervision.** A lab supervisor's morning question — "is every bench safe to report today?" — is only answerable from the QC dashboard if every bench reports into it. Source-typed persistence is what turns the dashboard from an analyzer monitor into a whole-lab view.

**Release coherence.** The QA release ships a Quality Assurance menu whose Manual QC leaf is an empty placeholder (OGC-692), and the Results Entry redesign has a control-capture slice sitting blocked (OGC-1025) for want of a table to write to. This FRS is the single dependency that turns both into shipped functionality.

### What Changes
Control results from manual and RDT testing become first-class QC data. A tech records the control at the bench in Results Entry (per the Results Entry FRS): a control-line outcome for an RDT, or a measured-vs-expected value for a manual quantitative test. That record persists alongside analyzer QC, appears on the QC dashboard filtered by source, feeds Levey-Jennings charts and Westgard evaluation where the data supports it, and raises the QC-fail signal that Validation uses to hold affected patient results. The paper register becomes a report, not the system of record.

---

## Overview

This FRS defines the **persistence layer and QC-pillar integration** for non-analyzer control results. The capture UI is specified in the Results Entry FRS (FR-D3/D4) and is not redesigned here. The scope is: (A) source-typed QC result storage, (B) QC target configuration, (C) the Validation QC-fail signal, (D) Statistical QC pillar integration, and (E) audit. Five schema-level questions are deliberately left as **build-time decisions** (D1–D5 below) for the implementing engineer — each has a stated default; deviating from the default requires a short rationale note in the PR.

## User Stories

- **As a bench technician,** I want the control I run before an RDT session or manual assay to be recorded in the system at the moment I enter results, so QC stops living in a paper register.
- **As a bench technician,** when my RDT control line is Invalid I want the system to block reporting and prompt a repeat, so an invalid run can't quietly release patient results.
- **As a lab supervisor,** I want manual and RDT QC on the same QC dashboard as analyzer QC, filterable by source, so I see the whole lab's QC state in one place.
- **As a lab supervisor,** I want manual quantitative controls plotted on Levey-Jennings charts with Westgard evaluation where enough data exists, so drift on a manual method is caught the same way as on an analyzer.
- **As a validation reviewer,** I want a failing or absent control to surface as a QC-fail signal on the affected batch, so I can hold results with cause.
- **As a quality officer preparing for accreditation,** I want documented, exportable QC records covering all methods — manual, RDT, and analyzer — so the SLIPTA/ISO 15189 evidence comes from one system.

---

## Functional Requirements

### A. Source-typed QC result persistence
- **FR-A1.** Every QC result record carries a **source**: `ASTM` (existing analyzer path), `MANUAL` (manual quantitative), or `RDT` (control-line outcome). Existing analyzer rows are unaffected.
- **FR-A2.** A `MANUAL` result stores: measured value + unit, expected value, uncertainty (±), derived or tech-confirmed Pass/Fail, control level, control lot, test, lab unit, technician, run date/time.
- **FR-A3.** An `RDT` result stores: control-line outcome (Valid / Invalid), control lot, test (or kit), lab unit, technician, run date/time. No numeric value is fabricated for qualitative outcomes (see D2).
- **FR-A4.** QC results from all sources are immutable once saved, following the Westgard FRS audit model (no deletion; corrections are new records with linkage).
- **FR-A5.** `MANUAL` and `RDT` results do not require an instrument association; where a bench instrument is relevant (e.g. HemoCue unit), it may be recorded optionally (see D1).

### B. QC target configuration
- **FR-B1.** A QC target can be configured per test + control level + lot: expected value, uncertainty (±) for quantitative; expected outcome for qualitative. Where configured, capture prefills per Results Entry FR-D4.
- **FR-B2.** Where no target is configured, the tech-entered expected value + uncertainty (Results Entry FR-D3/D4) is accepted and stored on the result record — configuration is an optimization, never a prerequisite for capture.
- **FR-B3.** Target configuration reuses the Westgard control-lot model's lot lifecycle (activation/deactivation dates, lot change semantics) rather than introducing a parallel lot concept.

### C. Validation QC-fail signal (V1)
- **FR-C1.** A failing control (`RDT` Invalid, or `MANUAL` Fail) raises a **QC-fail signal** scoped to the affected run/batch of patient analyses in the same test + lab unit + session window.
- **FR-C2.** An **absent** control — where lab policy requires one per run and none was recorded — raises the same signal (warn-level).
- **FR-C3.** The signal is consumed by Validation exactly as specified for V1 in the Results Entry redesign: surfaced on the affected rows, hold-or-warn per configuration.
- **FR-C4.** RDT Invalid additionally blocks reporting at entry time and prompts a repeat (Results Entry FR-D3) — the signal covers anything already in flight.

### D. Statistical QC pillar integration
- **FR-D1.** The QC dashboard gains a **Source filter** (All / Analyzer / Manual / RDT). The OGC-692 "Manual QC" placeholder leaf becomes this filtered view — no separate module.
- **FR-D2.** `MANUAL` quantitative results plot on Levey-Jennings charts per control lot, using the same chart component as analyzer QC.
- **FR-D3.** Westgard rule evaluation applies to `MANUAL` quantitative results where the lot has established statistics (see D3 for establishment mode); qualitative `RDT` outcomes are excluded from statistical rule evaluation and instead tracked as pass/fail run history.
- **FR-D4.** Violations raised on manual QC follow the same violation → corrective-action workflow as analyzer QC (subject to D4).
- **FR-D5.** QC reports (daily summary, monthly compliance, export) include all sources, labeled.

### E. Audit, permissions, i18n
- **FR-E1.** Roles follow the Westgard FRS access model (Results / Biologist / Global Admin); capture is available to anyone who can enter results.
- **FR-E2.** All UI strings compose from existing i18n keys where they exist (quality control, lot number, pass/fail, valid/invalid vocabulary already in en.json); new keys only where no equivalent exists, checked against the UI vocabulary before minting.

---

## Build-time decisions (D1–D5)

Owned by the implementing engineer (Samuel), decided during implementation, recorded briefly in the PR description or a dev-notes ADR. Each has a default; deviate with rationale.

- **D1 — Table strategy (three-way).** Two QC stores already exist: the Westgard `qc_result`/`qc_control_lot` pair (statistical, ASTM-fed) and the shared **`QcRun`** table (run-level Pass/Fail + freetext, `source` = WORKPLAN / QC_MODULE / ANALYZER_IMPORT / ANALYZER_LIST) established by the Analyzer Manual QC Recording FRS and already shared with Batch Workplan reagent QC (OGC-427/OGC-428). Options: (a) extend `qc_result` (add `source`, nullable `instrument_id`) — manual quantitative inherits L-J/rules directly; (b) extend `QcRun` (add control lot/level, measured/expected/uncertainty, qualitative outcome, new `source` values RESULT_ENTRY/RDT) — one run-level QC table across all features, but statistics need a bridge; (c) hybrid — `QcRun` remains the run-level gate record (RDT Valid/Invalid, Pass/Fail), while manual *quantitative* values additionally write a `qc_result` row for statistics. *Default:* **(c) hybrid** — it respects both incumbents and avoids retrofitting statistics onto `QcRun`; choose (a) or (b) only if the double-write proves worse than the alternative's retrofit. Whatever the choice, there must be **one** queryable answer to "show me all QC for this test/analyzer today."
- **D2 — Qualitative representation.** *Default:* a nullable `qualitative_outcome` column (VALID / INVALID / PASS / FAIL) alongside numeric `result_value`; never encode qualitative outcomes as magic numbers.
- **D3 — Statistics establishment for manual quantitative.** *Default:* targets-only via the existing "fixed values" strategy (the tech-entered/configured expected ± uncertainty acts as fixed mean/SD-equivalent); do not require the 20-run establishment protocol for manual methods. Rolling establishment may be enabled later per lot.
- **D4 — Violation semantics for manual/RDT fails.** *Default:* a `MANUAL` Fail with established statistics creates a real `qc_rule_violation` (1₃ₛ-equivalent) entering the corrective-action workflow; an `RDT` Invalid raises the V1 signal + repeat prompt without a statistical violation record. Adjust if the violation model resists non-rule-based entries.
- **D5 — Migration posture.** *Default:* strictly additive (new columns/enum values, no rewrites of existing rows), deployable mid-QA-release without touching Phase B/C code paths. If any change is non-additive, it waits for a post-release migration window.

## Non-functional requirements

- **NFR-1.** No regression to analyzer QC ingestion throughput or Westgard evaluation latency (FRS targets: <2s per result).
- **NFR-2.** Capture adds no blocking round-trip to Results Entry save; QC persistence is part of the same transaction or async with guaranteed write.
- **NFR-3.** Works offline-tolerant like the rest of Results Entry (no new hard dependency on external services).

## Related work — scope boundaries

- **Analyzer Manual QC Recording** (`designs/quality/analyzer-manual-qc.md`, OGC-428): *instrument-level* QC — "is this machine OK today" (Pass/Fail per analyzer, frequency rules, non-blocking by design per its BR-AQC-005). This FRS is *test-level, per-run* control capture that **does** gate results. Complementary; they share the QcRun vocabulary and, under D1 option (b)/(c), the table.
- **Batch Workplan reagent QC** (OGC-427, `batch-workplan-reagent-qc-frs-v1.md`): *reagent-lot* QC in `QcRun`. Same D1 sharing question.

## Out of scope

Blanks and duplicates as first-class QC types for manual methods (Plan A step A4 — future FRS); reagent QC (OGC-427); workplan/batch QC quick-add and batch QC status surfacing (Plan B — separate slices); EQA; instrument calibration/maintenance tracking (separate specced module).
