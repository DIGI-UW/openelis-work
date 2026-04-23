# Analyzer Manual QC Recording
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-16
**Status:** Draft for Review
**Jira:** (Pending)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Analyzer Import, QC, Reagent Management, Batch Workplan (shared QcRun table)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

This feature adds manual QC recording capabilities for analyzers that run manual tests. On the per-analyzer import page, a QC status panel displays the last QC run and allows technicians to record new QC results (Pass/Fail with optional freetext) inline without leaving the page. Additionally, the main analyzers list page gains a "Record Manual QC" action in each analyzer's existing overflow menu, providing a quick-access entry point. All QC runs are persisted in the shared `QcRun` table (same as the Batch Workplan feature), extended with an optional `analyzerId` field, maintaining a single source of truth for QC data across the system.

---

## 2. Problem Statement

**Current state:** For analyzers that process manual tests, there is no mechanism within the analyzer import workflow to verify or record QC. Technicians must navigate to a separate QC module or use paper logs to track whether QC controls have been run on an instrument before accepting patient results. The existing analyzer import page redesign (see `analyzer-import-requirements.md`) handles automated QC extraction from the data stream (control samples mixed with patient samples), but manual-test analyzers do not transmit QC data — the tech must physically run a control and record the result.

**Impact:** Without integrated QC recording on the import page, techs may forget to perform QC, or perform it but have no digital record linked to the analyzer and import session. This creates gaps in audit trails for ISO 15189 compliance and forces supervisors to cross-reference paper QC logs with digital import records.

**Proposed solution:** Add a QC status panel to the per-analyzer import page that shows the last QC run for that analyzer and provides an inline form to record new QC results (Pass/Fail + freetext). Also add a "Record Manual QC" action to the overflow menu on the main analyzers list page for quick access without opening an import. Both entry points write to the same `QcRun` table used by the Batch Workplan and QC Module features.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | View QC status, record QC results | Primary user during import workflow |
| Lab Manager | All technician permissions + view QC history across analyzers | Supervisory |
| QC Officer | View QC status, record QC results, review QC history | QC-focused role |
| System Administrator | Full | Configuration only |

**Required permission keys:**

- `analyzer.view` — Can access analyzer import pages and list
- `qc.result.enter` — Can record a QC run for an analyzer (reused from Batch Workplan)
- `qc.history.view` — Can view full QC run history for an analyzer

---

## 4. Functional Requirements

### 4.1 QC Status Panel on Analyzer Import Page

**FR-AQC-001:** The per-analyzer import page MUST display a QC Status Panel below the page header and above the existing QC Results / Run Settings sections. This panel is specific to manual QC for the analyzer instrument itself (not automated QC extracted from the data stream).

**FR-AQC-002:** The QC Status Panel MUST display the following information for the analyzer's last manual QC run: QC Status Tag (Pass `green` / Overdue `red` / Not Run `gray`), Last QC Date/Time, Performed By, Result (Pass/Fail), Value (optional freetext notes), and Next QC Due (derived from the analyzer's QC frequency rule).

**FR-AQC-003:** If QC is overdue or has never been run, the panel MUST display an InlineNotification (kind `warning`) with the message: "Manual QC has not been performed within the required timeframe for this analyzer. Last QC: [date] or 'Never'."

**FR-AQC-004:** The QC Status Panel MUST include a "Record QC" button that expands an inline form (per Constitution Principle 3 — not a modal) for entering a new QC result.

**FR-AQC-005:** The QC Status Panel MUST be visually distinct from the automated QC extraction panel described in `analyzer-import-requirements.md`. The panel heading MUST read "Manual QC Status" to differentiate from the "QC Results from This Run" section which handles extracted control samples.

### 4.2 Inline QC Recording Form

**FR-AQC-010:** Clicking "Record QC" MUST expand an inline form within the QC Status Panel containing: Date/Time (defaults to now, editable DatePicker + TimePicker), Result (RadioButtonGroup: Pass / Fail), Value (optional TextInput for freetext control values or notes), Performed By (auto-populated with current user, editable ComboBox for delegated entry).

**FR-AQC-011:** On saving, the system MUST immediately re-evaluate the analyzer's QC status and update the panel. If the result is Pass, any overdue warning MUST be dismissed. If Fail, the status Tag MUST change to "QC Failed" (red) and an InlineNotification (kind `error`) MUST appear: "QC failed for [Analyzer Name]. Review and re-run QC before accepting patient results."

**FR-AQC-012:** The saved QC run MUST be persisted in the `QcRun` table with `source = 'ANALYZER_IMPORT'` and `analyzerId` set to the current analyzer's ID. The `reagentLotId` field MUST be null for analyzer-level QC runs.

**FR-AQC-013:** After saving, the form MUST collapse and the Last QC Run summary MUST update to reflect the newly recorded result.

### 4.3 Record Manual QC from Analyzers List

**FR-AQC-020:** The main analyzers list page MUST add a "Record Manual QC" item to each analyzer's existing overflow menu (⋮).

**FR-AQC-021:** Clicking "Record Manual QC" MUST open an inline row expansion below the analyzer row (per Constitution Principle 3) containing the same QC recording form as FR-AQC-010, plus a read-only display of the last QC run for that analyzer.

**FR-AQC-022:** After saving a QC result from the analyzers list, the row expansion MUST update to show the new result, and the analyzer row itself MUST update its QC status indicator (if one is displayed).

**FR-AQC-023:** The inline row expansion MUST include a "View Full History" link that navigates to the analyzer's QC history (either a dedicated page or the QC module filtered to this analyzer).

### 4.4 QC Frequency Configuration

**FR-AQC-030:** Each analyzer definition in Admin MUST include QC frequency configuration fields: QC Frequency Type (DAILY, PER_SHIFT, CUSTOM_HOURS), QC Frequency Hours (used when type = CUSTOM_HOURS), QC Required (Boolean — whether manual QC enforcement is active for this analyzer).

**FR-AQC-031:** The QC status evaluation MUST use the same logic as the Batch Workplan reagent QC (see `batch-workplan-reagent-qc-frs-v1.md`, BR-002), but applied to the analyzer's QC frequency rule instead of a reagent's rule. For DAILY: valid if last passing QcRun for this analyzer occurred on the current calendar day. For PER_SHIFT: valid if last passing QcRun occurred within the current shift window (configurable, default 8 hours). For CUSTOM_HOURS: valid if last passing QcRun occurred within the configured number of hours.

---

## 5. Data Model

### Modified Entities

**QcRun** — Add field:

| Field | Type | Notes |
|---|---|---|
| analyzerId | Long (nullable) | FK to Analyzer — set for analyzer-level QC, null for reagent-lot QC |

The `QcRun` table now supports two kinds of QC records: reagent-lot QC (where `reagentLotId` is set and `analyzerId` may or may not be set) and analyzer-level QC (where `analyzerId` is set and `reagentLotId` is null). The `source` field distinguishes entry point: `WORKPLAN`, `QC_MODULE`, `ANALYZER_IMPORT`, `ANALYZER_LIST`.

**Analyzer** — Add fields:

| Field | Type | Notes |
|---|---|---|
| qcFrequencyType | Enum | DAILY, PER_SHIFT, CUSTOM_HOURS |
| qcFrequencyHours | Integer | Used when type = CUSTOM_HOURS or PER_SHIFT |
| qcRequired | Boolean | Whether manual QC enforcement is active |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/analyzers/{id}/qc-status` | Get manual QC status and last run for an analyzer | `analyzer.view` |
| GET | `/api/v1/analyzers/{id}/qc-runs` | List manual QC run history for an analyzer | `qc.history.view` |
| POST | `/api/v1/analyzers/{id}/qc-runs` | Record a new manual QC run for an analyzer | `qc.result.enter` |

These endpoints complement the existing analyzer import API endpoints listed in `analyzer-import-requirements.md`. The GET `/api/v1/analyzers/{id}/qc-history` endpoint from that spec returns automated QC extraction history; the endpoints above are specifically for manual QC runs.

---

## 7. UI Design

See companion React mockup: `analyzer-manual-qc-mockup.jsx`

### Navigation Paths

Two entry points, no new navigation items:

1. **Analyzer Import Page** (per-analyzer) — QC Status Panel added below the header, above the existing "QC Results from This Run" section.
2. **Analyzers List Page** — "Record Manual QC" added to each analyzer row's existing overflow menu (⋮), triggering inline row expansion.

### Key Screens

1. **Analyzer Import Page — QC Status Panel** — Colored banner showing last manual QC run (date, by, result, value) with status Tag and "Record QC" button. InlineNotification for overdue/failed. Inline form expansion for recording.
2. **Analyzers List — Inline QC Row** — Inline row expansion showing last QC run + recording form. Same visual treatment as the import page panel but within a table row expansion.

### Interaction Patterns

- **Inline form** for QC recording (not modal) — follows Constitution Principle 3
- **Colored status banner** on import page — green border/background for QC Pass, red for overdue/failed, gray for not run
- **Inline row expansion** on analyzers list — expands below the analyzer row
- **Auto-dismiss** of overdue warning after successful QC pass entry

---

## 8. Business Rules

**BR-AQC-001:** Analyzer manual QC status is derived dynamically from the most recent QcRun record where `analyzerId` matches and `reagentLotId` is null, evaluated against the analyzer's QC frequency rule.

**BR-AQC-002:** A QcRun with result = FAIL does NOT satisfy the QC requirement. Only PASS results count toward QC validity. Same rule as Batch Workplan BR-003.

**BR-AQC-003:** Manual QC for an analyzer is independent of reagent-lot QC. An analyzer can have valid manual QC even if a reagent lot used by that analyzer has overdue reagent QC (and vice versa). The two QC types serve different purposes: manual QC verifies the instrument is working correctly; reagent QC verifies the reagent lot is performing correctly.

**BR-AQC-004:** If `qcRequired` is false for an analyzer, the QC Status Panel MUST still be shown but the overdue warnings MUST NOT appear. The panel displays informational QC history only, without enforcement.

**BR-AQC-005:** The QC Status Panel on the import page does NOT block patient result acceptance (unlike automated QC extraction which can block via NCE). Manual QC status is informational and for audit traceability. Future enhancement may add gating based on manual QC.

**BR-AQC-006:** QC runs recorded from the analyzer import page MUST have `source = 'ANALYZER_IMPORT'`. QC runs recorded from the analyzers list overflow MUST have `source = 'ANALYZER_LIST'`.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.analyzerQc.manualQcStatus` | Manual QC Status |
| `heading.analyzerQc.recordQc` | Record QC Result |
| `heading.analyzerQc.lastQcRun` | Last QC Run |
| `heading.analyzerQc.fullHistory` | Full QC History |
| `label.analyzerQc.qcStatus` | QC Status |
| `label.analyzerQc.lastQcDate` | Last QC |
| `label.analyzerQc.nextQcDue` | Next QC Due |
| `label.analyzerQc.performedBy` | Performed By |
| `label.analyzerQc.qcResult` | Result |
| `label.analyzerQc.qcValue` | Value (optional) |
| `label.analyzerQc.qcDate` | QC Date/Time |
| `label.analyzerQc.pass` | Pass |
| `label.analyzerQc.fail` | Fail |
| `label.analyzerQc.qcPass` | QC Pass |
| `label.analyzerQc.qcOverdue` | QC Overdue |
| `label.analyzerQc.qcFailed` | QC Failed |
| `label.analyzerQc.qcNotRun` | Not Run |
| `label.analyzerQc.qcNotRequired` | QC Not Required |
| `button.analyzerQc.recordQc` | Record QC |
| `button.analyzerQc.saveQc` | Save QC Result |
| `button.analyzerQc.cancel` | Cancel |
| `button.analyzerQc.viewHistory` | View Full History |
| `placeholder.analyzerQc.qcValue` | Enter control value or notes... |
| `message.analyzerQc.qcSaved` | QC result saved for {0}. |
| `message.analyzerQc.qcOverdueWarning` | Manual QC has not been performed within the required timeframe for this analyzer. Last QC: {0}. |
| `message.analyzerQc.qcFailedWarning` | QC failed for {0}. Review and re-run QC before accepting patient results. |
| `message.analyzerQc.noQcHistory` | No manual QC runs recorded for this analyzer. |
| `error.analyzerQc.qcRequired` | QC result (Pass or Fail) is required. |
| `error.analyzerQc.qcDateFuture` | QC date cannot be in the future. |
| `nav.analyzer.recordManualQc` | Record Manual QC |
| `nav.analyzer.openImport` | Open Import Page |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| QC Result | Required (Pass or Fail) | `error.analyzerQc.qcRequired` |
| QC Date | Required, cannot be in the future | `error.analyzerQc.qcDateFuture` |
| Value | Optional, max 500 characters | (no error — soft limit) |
| Performed By | Required, must be a valid system user | `error.analyzerQc.qcRequired` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View QC status panel | `analyzer.view` | Panel not shown |
| Record QC result | `qc.result.enter` | "Record QC" button hidden |
| View full QC history | `qc.history.view` | "View Full History" link hidden |
| Access analyzer import page | `analyzer.view` | Page not shown in menu |

---

## 12. Acceptance Criteria

### Functional

- [ ] QC Status Panel appears on the per-analyzer import page below the header
- [ ] Panel displays last manual QC run (date, performed by, result, value, status Tag)
- [ ] InlineNotification appears when QC is overdue with the correct message
- [ ] "Record QC" button expands inline form (not modal)
- [ ] User can record Pass/Fail with optional freetext value
- [ ] QC status updates immediately after saving a new QC result
- [ ] Overdue warning dismisses after recording a passing QC result
- [ ] QC Failed result shows error notification recommending re-run
- [ ] "Record Manual QC" appears in the overflow menu on the analyzers list page
- [ ] Clicking "Record Manual QC" opens inline row expansion with form + last QC run
- [ ] QC results recorded from both entry points appear in the QcRun table with correct source
- [ ] QC results recorded here are visible in the QC module and Batch Workplan QC history
- [ ] "View Full History" link navigates to the analyzer's full QC history

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Panel loads within 1 second (single API call for QC status)
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with French language file

### Integration

- [ ] QcRun records created here appear in the QC module's history views
- [ ] QcRun records use the same table and entity as the Batch Workplan QC feature
- [ ] Analyzer QC frequency rules are configurable in Admin → Analyzer configuration
- [ ] Manual QC status is independent of automated QC extraction status on the same import page
