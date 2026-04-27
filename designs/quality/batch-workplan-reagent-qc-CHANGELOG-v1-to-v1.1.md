# Batch Workplan FRS — Changelog v1.0 → v1.1

**Spec:** `batch-workplan-reagent-qc-frs-v1.1.md`
**Date:** 2026-04-27
**Driver:** Discovery that the Westgard QC implementation (OGC-41, PR #3390) was already merged into OpenELIS-Global-2 and ships a complete async rule-evaluation pipeline. v1.0 of this spec was written without that knowledge and proposed a parallel `QcRun` table plus reagent-level QC frequency. v1.1 aligns the design with the existing implementation so contributors can build on top of the merged code rather than against it.

---

## TL;DR for reviewers

| Concept | v1.0 | v1.1 |
|---|---|---|
| QC entity | New `QcRun` table | Existing `QCResult` (from OGC-41) |
| QC frequency lives on | `Reagent` | `QCControlLot` |
| Westgard rule evaluation | Out of scope | Reused via `QCResultCreatedEvent` listener |
| QC validity = "Pass" requires | Frequency window only | Frequency window AND no rejection violation AND lot ACTIVE |
| Frequency types | DAILY, PER_LOT, CUSTOM_HOURS | DAILY, PER_SHIFT, CUSTOM_HOURS, PER_RUN (PER_LOT removed; reagent-lot acceptance is a separate concern out of v1 scope) |
| New schema | `QcRun` table + Reagent fields | `QCControlLot` field additions only + workplan-side `TestBatch*` tables |
| NCE links to | Batch only | Batch + linked `QCResult` + linked `QCRuleViolation` |
| QC entry path | Workplan-only QC entry endpoint | Reuses existing `POST /api/v1/qc/results` |

**Net effect:** v1.1 removes ~one entire entity from the data model, adds zero new QC-side tables, and lights up the existing Westgard pipeline by making the workplan a write-through caller of OGC-41 rather than a parallel system.

---

## Section-by-section diff

### §1 Executive Summary
- Reframed around resolving a `QCControlLot` for the (test, instrument) pair (not the reagent lot)
- Added explicit mention of `QCResultCreatedEvent` and the OGC-41 listener doing the Westgard work
- Clarified that NCEs link to `QCRuleViolation` records when applicable

### §3 User Roles & Permissions
- Added note that `qc.result.enter` is the existing OGC-41 permission, not a new one
- No new permission keys

### §4.3 Reagent & Lot Assignment
- New requirement **FR-RA-005**: handle the case where no active `QCControlLot` exists for the (test, instrument) pair — surface a warning and disable workplan generation, rather than silently allowing release. This was a gap in v1.

### §4.5 (renamed: "QC Integration" — was "Reagent QC Integration")
- **FR-QC-001**: Frequency lives on `QCControlLot`. New types:
  - `DAILY` (kept from v1)
  - `PER_SHIFT` (new — covers the common 2- or 3-shift lab pattern)
  - `CUSTOM_HOURS` (kept from v1)
  - `PER_RUN` (new — strictest mode, requires fresh QC before each batch run)
  - Removed: `PER_LOT` (this was conflating reagent-lot acceptance with recurring QC; reagent-lot acceptance is its own gate, deferred per Open Question #2)
- **FR-QC-003**: Combined validity check — frequency AND no rejection violation AND lot lifecycle ACTIVE AND most recent `result_status` ACCEPTED. v1 only checked frequency.
- **FR-QC-004**: Expanded status set — added "QC Violation", "Lot in Establishment", "Lot Expired" Tags
- **FR-QC-005**: Notification copy now includes Westgard rule code (e.g., "1-3s") when a violation drives the warning
- **FR-QC-006**: QC history accordion now shows z-score and triggered rule codes (was just date/value before)

### §4.6 Inline QC Entry
- **FR-QCE-003** (rewrite): Submission now writes `QCResult` via `QCResultDAO` and publishes `QCResultCreatedEvent`. The async listener handles the rest.
- **FR-QCE-004** (new): Loading state with 1s polling for async Westgard evaluation, 30s timeout, fallback to "evaluation pending".
- **FR-QCE-006**: Failed QC notification now lists triggered rule codes (was just "Failed").
- **FR-QCE-007** (new): Workplan-entered QC must be visible in the existing OGC-41 dashboard, charts, and alerts. This is the integration assertion.
- Removed (from v1): the old workplan-only "Pass / Fail" radio button. Pass/Fail is now derived from `result_status` set by the listener; users only enter the numeric value.

### §4.7 QC Override and NCE Generation
- **FR-NCE-001**: Modal copy is now status-specific (Overdue / Failed / Violation / Not Run / Establishment / Expired) — six distinct messages
- **FR-NCE-002**: NCE payload extended with `linkedQcRuleViolationId`, `linkedQcResultId`, `failureMode`
- **FR-NCE-004** (new): NCE detail page links back to the linked Westgard violation (round-trip traceability)
- **FR-NCE-005**: Lot Expired explicitly hides the override "Proceed" button — this is the only QC failure mode that blocks rather than warns

### §5 Data Model
**Removed:**
- New `QcRun` table (replaced by existing `QCResult`)
- New fields on `Reagent` (`qcFrequencyType`, `qcFrequencyHours`, `qcRequired`)

**Added:**
- New fields on `QCControlLot` (`qcFrequencyType`, `qcFrequencyHours`, `qcRequired`, `shiftDefinitionHours`)
- New `TestBatchOverride` table — soft-join for NCE link with optional `qcResultId` / `qcRuleViolationId` references
- New optional fields on `NceRecord`: `linkedQcResultId`, `linkedQcRuleViolationId`

**Net schema impact:**
- v1.0 proposal: 1 new table + Reagent column additions
- v1.1 proposal: 1 new table (TestBatchOverride) + QCControlLot column additions + NceRecord column additions
- The QC-side schema impact shrinks; the audit-trace schema impact grows.

### §6 API Endpoints
- Removed: workplan-side `POST /api/v1/reagent-lots/{id}/qc-runs` and `GET /api/v1/reagent-lots/{id}/qc-status`
- Added: `GET /api/v1/workplan/batches/{id}/qc-status` (workplan-side aggregator that calls the existing OGC-41 endpoints internally)
- Added: explicit list of OGC-41 endpoints the workplan reuses (control lots, results, violations, L-J chart)
- New requirement **FR-API-001**: workplan inline QC entry MUST submit to the existing `POST /api/v1/qc/results` endpoint, not a parallel one

### §7 UI Design
- Added cross-links from the workplan UI into existing OGC-41 views:
  - "View Full Levey-Jennings Chart" link from QC accordion → existing chart page
  - "View Violation Details" link from violation notifications → existing OGC-41 Alerts/Violations view
- Added Loading state on batch Tile during async Westgard evaluation (FR-QCE-004)

### §8 Business Rules
- **BR-002**: Rewrite — covers all four validity conditions, with frequency-window evaluation per type (DAILY/PER_SHIFT/CUSTOM_HOURS/PER_RUN)
- **BR-003**: Now references `result_status` field set by the listener
- **BR-007** (new): "The workplan MUST NOT reimplement Westgard rule evaluation." Explicit no-rebuild rule.
- **BR-012** (new): Lot Expired is the only blocking QC failure mode; all others allow override
- **BR-013** (new): Lot in Establishment — workplan can record results (contributing to establishment statistics) but cannot evaluate Pass/Fail; override required
- **BR-014** (new): Async timeout fallback — server-side `override-qc` re-checks `result_status` at the moment of override

### §10 Validation Rules
- Removed: "QC Result Pass/Fail required" (Pass/Fail is now system-derived, not user-entered)
- Added: "Active control lot must exist for (test, instrument) before workplan generation"

### §12 Acceptance Criteria
- Added a dedicated **Integration (with OGC-41)** section with 6 specific items verifying the integration is working
- Added items for each new QC status (Violation, Establishment, Lot Expired)
- Added item: "Levey-Jennings chart for the control lot shows QC results entered via the workplan"
- Added item: "NCE detail page links back to the linked Westgard violation"
- Added item: "QC frequency types DAILY, PER_SHIFT, CUSTOM_HOURS, and PER_RUN all evaluate correctly"

### §13 (new) Integration with OGC-41
- New section enumerating exactly what is reused, what is added, and the boundary clarifications
- Includes the reagent-lot vs. control-lot disambiguation that was missing in v1

### §14 (new) Open Questions / Known Gaps
- Six open questions surfaced for community/team review before implementation:
  1. Per-shift definition — rolling N-hour vs. anchored shift schedule?
  2. Reagent-lot acceptance testing — separate gate or out of scope?
  3. Multi-level QC — wait for OGC-41 v2?
  4. Override audit immutability
  5. Manual analyzer coordination with `analyzer-manual-qc` (#3490)
  6. Time-zone handling for DAILY

---

## Files changed vs. files unchanged

**Spec files:**
- `batch-workplan-reagent-qc-frs-v1.1.md` — full replacement of v1.0
- `batch-workplan-reagent-qc-mockup.jsx` — **no changes required for v1.1**. The mockup already shows the QC tag and inline entry form; it does not encode reagent-vs-control-lot distinctions or frequency types in a way that conflicts with v1.1. A small label change (Tag set should include "QC Violation", "Lot in Establishment", "Lot Expired") may be desirable but is not required to ship v1.1 of the FRS.

**Gallery upload copy:**
- `upload/processed/batch-workplan-reagent-qc-frs-v1.md` — replace with v1.1 (rename to `-frs-v1.1.md` if the gallery's manifest version-pins, otherwise overwrite in place)
- `upload/processed/batch-workplan-reagent-qc-mockup.jsx` — unchanged

**GitHub issues:**
- `DIGI-UW/OpenELIS-Global-2#3491` (Batch Workplan) — add a comment pointing at v1.1 and the OGC-41 integration story
- `DIGI-UW/OpenELIS-Global-2#3490` (Analyzer Manual QC) — add a comment noting it is the OGC-41 v2 roadmap "Manual QC recording" item; coordinate with the OGC-41 team

---

## Implementation impact note for contributors

The v1.1 changes are larger on paper than in practice:

- **Backend:** The new code is the workplan-side service that resolves a `QCControlLot` for a (test, instrument) pair, evaluates the four-condition QC status, and publishes `QCResultCreatedEvent` on inline QC entry. All of this is straightforward Spring service code. The Westgard engine is untouched.
- **Frontend:** The new UI is the QC status badge with seven states and the inline QC entry form (which now writes value-only, not Pass/Fail). The L-J chart link reuses the existing `LeveyJenningsChart` component.
- **DB migration:** Three Liquibase changesets — add fields to `QCControlLot`, add fields to `NceRecord`, create `TestBatchOverride` and the workplan-side `TestBatch*` tables. No destructive changes.

Net: implementation effort goes **down** vs. v1.0 (no parallel `QcRun` table to build, no parallel rule evaluation logic to write).
