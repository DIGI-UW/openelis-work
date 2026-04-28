# Batch Workplan with Reagent QC Integration
## Functional Requirements Specification — v1.1

**Version:** 1.1
**Date:** 2026-04-27
**Status:** Draft for Review (revised to align with merged Westgard implementation)
**Jira:** (Pending)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Workplan, Reagent Management, QC, NCE System, Test Catalog, Results Entry
**Related Spec:** `specs/OGC-41-westgard-qc/spec.md` (Westgard rules engine — already merged via PR #3390)

---

## Revision History

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-03-16 | Initial draft. Defined QC frequency on `Reagent`; introduced new `QcRun` entity. |
| 1.1 | 2026-04-27 | **Major revision** to integrate with the merged Westgard QC implementation (OGC-41, PR #3390). QC frequency moved from `Reagent` to `QCControlLot`. New `QcRun` entity removed — uses existing `QCResult`. Inline QC entry now fires `QCResultCreatedEvent`, allowing the existing async Westgard evaluator to run automatically. NCE generation extended to also trigger on unresolved rejection-severity Westgard violations. PER_SHIFT frequency type added. |

See `CHANGELOG-v1-to-v1.1.md` for the section-by-section diff.

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
13. Integration with OGC-41 (Westgard QC)
14. Open Questions / Known Gaps

---

## 1. Executive Summary

This feature replaces the four existing workplan screens (by Test, by Panel, by Lab Unit, by Priority) with a single unified workplan that supports multi-criteria filtering, test batching with reagent-lot assignment, and integrated QC enforcement. When a user selects a reagent lot for a batch, the system identifies the active `QCControlLot` for that test-instrument pair and checks whether QC has been performed within the required timeframe and is not in a rejection-severity Westgard rule violation. If QC is overdue, missing, or in violation, the user is warned and can either record a new QC result inline or proceed — in which case a Non-Conforming Event (NCE) is automatically generated and linked to any related `QCRuleViolation`. Inline QC entry writes to the existing `QCResult` table and fires `QCResultCreatedEvent`, so the merged Westgard rules engine (OGC-41) evaluates the new result asynchronously and updates `result_status`, `QCRuleViolation` records, and alerts using the same path as analyzer-bridge ingestion. Batches persist per user so that work is not lost if the user is logged out.

---

## 2. Problem Statement

**Current state:** Lab technicians must navigate four separate workplan screens to generate workplans by Test, Panel, Lab Unit, or Priority. These screens share nearly identical UI but are accessed separately, forcing users to switch between them when building a day's work. There is no concept of batching tests that share the same reagent, no QC validation at workplan generation time, and no integration between the workplan and the merged QC/Westgard tracking system. Users running manual or bench analyzers rely on paper logs or memory to verify that the analytical system has passed QC for the day before running patient samples.

**Impact:** Without QC enforcement at workplan time, labs risk running patient samples on systems whose most recent QC result was overdue, failed, or triggered a rejection-severity Westgard rule — a finding in ISO 15189 audits. Techs must manually reconstruct batches every session because there is no persistence. The four separate screens add unnecessary navigation clicks and cognitive overhead when a simple filter bar would suffice.

**Proposed solution:** A unified workplan page with a multi-filter bar (Test, Panel, Lab Unit, Priority) where users can select pending tests, group them into batches, assign a reagent and specific lot to each batch, see the QC status of the controlling `QCControlLot` at a glance, enter QC results inline if needed (which feed straight into the Westgard pipeline), and receive an automatic NCE if they proceed without valid QC. The last batches created by each user are persisted and reloaded on the next visit, with options to clear or archive them.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | View workplan, create/manage batches, enter QC results, assign reagent lots | Primary user |
| Lab Manager | All technician permissions + override QC warnings, view NCEs generated | Supervisory |
| QC Officer | View QC status across all lots, enter QC results, review NCEs and Westgard violations | QC-focused role |
| System Administrator | Full | Configuration only |

**Required permission keys:**

- `workplan.view` — Can access the unified workplan page
- `workplan.batch.create` — Can create and modify test batches
- `workplan.batch.print` — Can generate/print workplan from a batch
- `qc.result.enter` — Can enter QC results for a control lot (writes `QCResult`)
- `qc.override` — Can proceed with a batch despite invalid QC (triggers NCE)
- `nce.view` — Can view generated NCEs (links to NCE module)

These permissions align with the existing OGC-41 permission scheme; `qc.result.enter` is the same permission already gated on the QC dashboard rule-config and result-entry screens.

---

## 4. Functional Requirements

### 4.1 Unified Workplan List

**FR-WP-001:** The system MUST replace the four separate workplan screens (by Test, by Panel, by Lab Unit, by Priority) with a single unified workplan page accessible from the main Workplan navigation menu item.

**FR-WP-002:** The unified workplan page MUST display a filterable DataTable of all pending tests (tests with orders in status "In Progress" that have not yet been started or have results pending entry).

**FR-WP-003:** The filter bar MUST support the following filters, combinable with AND logic: Test Name (multi-select ComboBox), Panel (multi-select ComboBox), Lab Unit (multi-select ComboBox), Priority (multi-select: Routine, Urgent, STAT), Date Range (date picker for order date).

**FR-WP-004:** The DataTable MUST display the following columns: Select (checkbox), Lab Number, Patient Name, Test Name, Panel, Lab Unit, Priority, Order Date, Sample Type.

**FR-WP-005:** Priority MUST be indicated with Carbon Tags: Routine (`gray`), Urgent (`purple`), STAT (`red`).

**FR-WP-006:** The table MUST support batch selection via the TableSelectAll and TableSelectRow Carbon components.

**FR-WP-007:** The table MUST support sorting by any column and text search via TableToolbarSearch.

### 4.2 Batch Creation (Phase 1 — Test Grouping)

**FR-BA-001:** The user MUST be able to select one or more tests from the workplan list and click "Create Batch" to group them into a named batch. At creation time, only the batch name and tests are required — reagent/lot assignment happens in a separate step (see §4.3).

**FR-BA-002:** When creating a batch, the system MUST prompt the user for a Batch Name (optional, defaults to "Batch — [Date]") and confirm the selected test list. The Create Batch panel does NOT include reagent or lot selection.

**FR-BA-003:** Each batch MUST have the following properties: Batch ID (auto-generated), Batch Name (optional user-provided label, defaults to "Batch — [Date]"), Reagent (nullable until assigned), Selected Reagent Lot (nullable until assigned), Resolved Instrument (derived from selected reagent lot or test default), List of Tests, Created By, Created Date/Time, Status (Draft, Active, Archived, Completed).

**FR-BA-004:** Tests that are already assigned to a batch MUST show a Tag in the DataTable indicating the batch name, and MUST NOT be selectable for a different batch without first removing them from the existing batch.

### 4.3 Reagent & Lot Assignment (Phase 2 — Batch Setup)

**FR-RA-001:** After a batch is created, the user expands the batch Tile to assign a reagent and lot. The expanded batch view MUST present a Reagent dropdown populated with reagents configured for the tests in the batch. If the tests span multiple reagents, all applicable reagents MUST be shown.

**FR-RA-002:** After selecting a reagent, the system MUST display the available reagent lots for that reagent, following the same FIFO-ordered lot selection pattern used on the Results Page (see `results-page-requirements.md`, Reagent Lot Selection section). Lots are sorted by received date (oldest first), with FIFO Suggested badge on the oldest unexpired lot.

**FR-RA-003:** When the user selects a reagent lot, the system MUST resolve the controlling `QCControlLot` for the (test, instrument) pair (see §4.5) and immediately retrieve and display its QC status. The batch is now "fully set up" and ready for workplan generation.

**FR-RA-004:** The user MUST be able to change the reagent and/or reagent lot on a batch in Draft status at any time. Changing the reagent lot MUST re-resolve the controlling control lot and re-evaluate QC status.

**FR-RA-005:** If no `QCControlLot` exists in ACTIVE status for the (test, instrument) pair when the reagent lot is selected, the system MUST display a Carbon InlineNotification (kind `warning`) with the message: "No active QC control lot configured for [Test Name] on [Instrument Name]. A control lot must be set up before this batch can be released. Contact your QC Officer." The "Generate Workplan" button MUST be disabled until a control lot is available.

### 4.4 Batch Lifecycle & Persistence

**FR-BL-001:** Batch status transitions follow this lifecycle: Draft → Active (on workplan generation) → Completed (all tests have results entered). Any batch can also be Archived (soft-deleted) when the user is finished with it or decides not to run it.

**FR-BL-002:** A batch in Draft status can be fully modified: add/remove tests, change reagent/lot, rename.

**FR-BL-003:** A batch in Active status (workplan printed/generated) cannot be modified unless the user explicitly clicks "Edit" which returns it to Draft status (requires `workplan.batch.create` permission).

**FR-BL-004:** The "Archive" action is a soft delete — it removes the batch from the active "My Batches" view. Archived batches are retained in the database for audit traceability but do not appear in the user's working view. Tests from an archived batch are released and become available for new batches.

**FR-BL-005:** Each batch Tile MUST display an OverflowMenu with the following actions: Edit (returns Active → Draft for modification), Archive (soft-delete, removes from view).

**FR-BL-006:** The system MUST persist the user's batches (Draft, Active) server-side, keyed to the user's account. Batches MUST survive logout and re-login.

**FR-BL-007:** When the user navigates to the workplan page, the system MUST reload their persisted batches and display them in a "My Batches" summary panel above the test list DataTable.

**FR-BL-008:** The "My Batches" panel MUST display each batch as a Tile showing: Batch Name, Reagent Name (or "Not assigned" if Phase 2 incomplete), Reagent Lot Number (or "—"), Number of Tests, QC Status Tag (if reagent lot assigned and control lot resolvable), Status Tag, Created Date.

**FR-BL-009:** The user MUST be able to clear all batches via a "Clear All" button with a destructive confirmation modal.

**FR-BL-010:** Batches in Completed status (all tests have results entered) are auto-archived after 30 days.

### 4.5 QC Integration (Control Lot Resolution + Westgard Status)

**FR-QC-001:** Each `QCControlLot` definition MUST include a QC Frequency Rule specifying how often a QC run is required. Supported frequency types:

| Type | Meaning |
|---|---|
| `DAILY` | A passing QC run is required each calendar day before first patient use |
| `PER_SHIFT` | A passing QC run is required each shift (shift definition is configurable per lab; default = 8 hours) |
| `CUSTOM_HOURS` | A passing QC run is required every N hours, where N is configurable |
| `PER_RUN` | A passing QC run is required immediately before each batch run |

A `qcRequired` boolean MUST also be stored on the control lot to disable enforcement entirely for low-risk tests where local policy allows.

**FR-QC-002:** When a user selects a reagent lot for a batch, the system MUST resolve the active `QCControlLot` for the batch's (test, instrument) pair. Since `QCControlLot` is already scoped per test-instrument in the OGC-41 schema, this naturally yields per-test granularity — no additional override layer is required. If multiple ACTIVE control lots exist for the same test-instrument, the most recently activated lot is used.

**FR-QC-003:** The QC status displayed on the batch Tile MUST reflect the combined evaluation of:

1. **Frequency window:** Most recent passing `QCResult` for the controlling `QCControlLot` falls within the configured frequency window
2. **Latest result status:** Most recent `QCResult.result_status` is `ACCEPTED` (i.e. did not trigger any REJECTION-severity Westgard rule when processed by `QCResultCreatedEventListener`)
3. **Open violations:** No unresolved `QCRuleViolation` of REJECTION severity exists for the controlling control lot
4. **Lot lifecycle:** Control lot is in ACTIVE status (not ESTABLISHMENT, EXPIRED, or ARCHIVED)

If all four conditions are satisfied, status is **QC Pass**. Otherwise, the most severe failing condition determines the displayed status (precedence: lifecycle issue > open rejection violation > rejected last result > frequency overdue > no result yet).

**FR-QC-004:** The QC status MUST be displayed as a Carbon Tag with the following kinds:

| Status | Carbon Tag kind | Trigger |
|---|---|---|
| QC Pass | `green` | All four conditions in FR-QC-003 satisfied |
| QC Overdue | `red` | Lifecycle ACTIVE, no violations, but frequency window exceeded |
| QC Failed | `red` | Most recent result has `result_status = REJECTED` |
| QC Violation | `red` | Unresolved REJECTION-severity `QCRuleViolation` exists |
| QC Not Run | `gray` | No `QCResult` recorded yet for the active control lot |
| Lot in Establishment | `purple` | Control lot is in ESTABLISHMENT phase (Westgard not yet evaluating) |
| Lot Expired | `gray` | Control lot is EXPIRED or ARCHIVED |

**FR-QC-005:** When QC status is anything other than Pass, an InlineNotification (kind `warning` or `error` per status precedence) MUST appear below the Tile with status-specific messaging. For QC Violation, the notification MUST identify the rule code (e.g., "1-3s", "2-2s") and provide a link to the violation detail in the existing OGC-41 Alerts view.

**FR-QC-006:** QC run details MUST be viewable inline by clicking the QC status Tag, which expands an Accordion showing the most recent QC results for the controlling control lot (defaulting to last 5, with a "View Full Levey-Jennings Chart" link to the existing OGC-41 chart page). Each shown result MUST include: Date/Time, Performed By, Value, z-score, `result_status`, and any triggered rule codes.

**FR-QC-007:** When a batch has a reagent lot assigned and a control lot resolved, the Last QC Run summary (date, performed by, value, z-score, result_status) MUST always be visible in the expanded batch view — not collapsed behind an accordion. This ensures the most recent QC status is immediately apparent without extra clicks.

**FR-QC-008:** On the Batches page, any batch with QC status of Overdue, Failed, Violation, or Lot Expired MUST be auto-expanded by default when the page loads, so the user immediately sees the QC issue and the last QC run details without needing to manually expand the tile.

### 4.6 Inline QC Entry

**FR-QCE-001:** The user MUST be able to enter a new QC result directly from the workplan batch screen without navigating away. A "Run QC" button MUST appear on each batch Tile when QC status is Overdue, Failed, Violation, or Not Run. The button MUST be hidden when status is Lot in Establishment (control lots in establishment phase do not yet evaluate Westgard rules per OGC-41 FR-008) or Lot Expired (a new lot is required).

**FR-QCE-002:** Clicking "Run QC" MUST expand an inline form (not a modal) within the batch Tile containing: Date/Time (defaults to now, editable), Value (TextInput, required, numeric — z-score will be computed by the existing pipeline), Performed By (auto-populated with current user, editable ComboBox for delegated entry).

**FR-QCE-003:** On submit, the system MUST create a new `QCResult` record linked to the resolved control lot, persisting through the existing `QCResultDAO`. The save MUST publish a `QCResultCreatedEvent` so the existing `QCResultCreatedEventListener` runs Westgard evaluation, sets `result_status` to ACCEPTED or REJECTED, and creates `QCRuleViolation` records as needed — exactly the same pipeline used by analyzer-bridge ingestion. The workplan UI MUST NOT duplicate or reimplement Westgard evaluation logic.

**FR-QCE-004:** Because Westgard evaluation is asynchronous, the workplan UI MUST display a Loading state on the batch Tile after submit until the result_status is finalized. Polling interval MUST be 1 second; timeout MUST be 30 seconds. On timeout, the UI MUST display "QC evaluation pending — refresh to update" and allow the user to proceed with workplan generation (which in turn re-checks status server-side).

**FR-QCE-005:** Once `result_status` is finalized, the system MUST re-evaluate the batch's QC status (per FR-QC-003) and update the Tag and notifications accordingly. If the new result is ACCEPTED and within frequency, the QC Overdue/Not Run/Failed warnings MUST be dismissed.

**FR-QCE-006:** A QC result with `result_status = REJECTED` MUST change the Tag to "QC Failed" (red) and display an InlineNotification (kind `error`) listing the rule codes that triggered: "QC failed for [Test] on [Instrument]: rules [list]. Consider re-running QC, troubleshooting, or selecting a different instrument."

**FR-QCE-007:** All QC results entered via the workplan MUST be visible in the existing OGC-41 dashboard, Levey-Jennings chart, and Alerts views. The workplan is one of several entry points; the data store and evaluation pipeline are unified.

### 4.7 QC Override and NCE Generation

**FR-NCE-001:** If the user attempts to generate/print a workplan for a batch whose QC status is anything other than Pass, the system MUST display a Modal (danger kind) warning. The modal body MUST be tailored to the specific failure mode:

| QC Status | Modal Title | Modal Body |
|---|---|---|
| QC Overdue | "QC Not Current for Batch" | The control lot for [Test] on [Instrument] has not been QC'd within the required timeframe. Last passing QC: [date]. Proceeding will generate a Non-Conforming Event (NCE). |
| QC Failed | "Most Recent QC Failed" | The most recent QC result for [Test] on [Instrument] was rejected. Proceeding will generate an NCE linked to the rejected result. |
| QC Violation | "Active Westgard Violation" | An unresolved [rule code] violation exists for this control lot. Proceeding will generate an NCE linked to the violation. |
| QC Not Run | "No QC Recorded" | No QC has been recorded for the active control lot. Proceeding will generate an NCE. |
| Lot in Establishment | "Control Lot in Establishment" | This control lot is still in the establishment phase; Westgard rules are not yet evaluated. Proceeding will generate an NCE. |
| Lot Expired | "Control Lot Expired" | The control lot for [Test] on [Instrument] is expired. A new control lot must be created before this batch can be released. (No override available.) |

Actions: "Proceed and Generate NCE" (danger button), "Go Back" (secondary button). The "Proceed" button MUST be hidden for Lot Expired (proceeding is not allowed).

**FR-NCE-002:** If the user clicks "Proceed and Generate NCE", the system MUST automatically create an NCE record in the NCE module with the following data:

- NCE Type = "QC Deviation — Workplan Override"
- Source = "Workplan Batch [Batch ID]"
- Test = [Test Name(s) in batch]
- Instrument = [Instrument Name]
- Control Lot = [QCControlLot ID + Manufacturer Lot Number]
- Reagent Lot = [Reagent Name + Lot Number]
- Failure Mode = [QC Overdue | QC Failed | QC Violation | QC Not Run | Lot in Establishment]
- Last QC Date = [date or 'Never']
- Last QC Status = [ACCEPTED | REJECTED | n/a]
- Linked Rule Violation = [QCRuleViolation ID + rule code, if applicable]
- Linked QC Result = [QCResult ID, if applicable]
- Required Frequency = [from control lot config]
- Tests in Batch = [list of test names and lab numbers]
- Created By = [current user]
- Created Date = [now]
- Status = Open

**FR-NCE-003:** The generated NCE MUST appear as a linked record on the batch, visible as a Tag (kind `red`, text "NCE: [NCE-ID]") on the batch Tile. Clicking this Tag MUST navigate to the NCE detail page.

**FR-NCE-004:** When a `QCRuleViolation` is linked to the NCE, the NCE detail page MUST also link back to the violation detail in the OGC-41 Alerts/Violations view, so QC officers can reach the audit trail from either side.

**FR-NCE-005:** The system MUST NOT block the user from proceeding except for Lot Expired — the purpose is traceability and follow-up, not prevention. However, the user MUST hold the `qc.override` permission to click "Proceed and Generate NCE". If the user lacks this permission, the "Proceed" button MUST be disabled and a tooltip MUST read: "You do not have permission to override QC. Contact your lab manager."

### 4.8 Workplan Generation / Print

**FR-WG-001:** Each batch MUST have a "Generate Workplan" button that produces a printable workplan document for that batch.

**FR-WG-002:** The generated workplan MUST include: Batch Name, Date, Reagent Name, Reagent Lot Number, Instrument, Control Lot ID + Manufacturer Lot Number, QC Status (with rule violation codes if any), List of Tests (Lab Number, Patient Name, Test Name, Sample Type, Priority), Generated By, Generated Date/Time. If an NCE was generated as part of release, the NCE-ID MUST be printed on the workplan.

**FR-WG-003:** Generating the workplan MUST change the batch status from Draft to Active.

---

## 5. Data Model

### Use Existing Entities (no new tables)

This v1.1 spec **does not introduce new QC-side tables**. All QC writes go through the existing OGC-41 entities:

| Entity | Source | Used For |
|---|---|---|
| `QCControlLot` | OGC-41 (PR #3390) | Resolve controlling lot per (test, instrument) at batch setup |
| `QCResult` | OGC-41 (PR #3390) | Persist new QC entries from workplan inline form |
| `QCStatistics` | OGC-41 (PR #3390) | Read-only — z-score baselines, displayed in last-QC summary |
| `WestgardRuleConfig` | OGC-41 (PR #3390) | Read-only — determines which rules fire for the control lot |
| `QCRuleViolation` | OGC-41 (PR #3390) | Read-only — link to NCE when a rejection violation is open |
| `QCAlert` | OGC-41 (PR #3390) | Read-only — surfaced in QC status notification |

### New Entities (workplan-side only)

**TestBatch**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key, auto-generated |
| batchName | String(100) | No | User-provided label, defaults to "Batch — [Date]" |
| reagentId | Long | No | FK to Reagent — nullable until Phase 2 assignment |
| reagentLotId | Long | No | FK to ReagentLot — nullable until Phase 2 assignment |
| resolvedControlLotId | Long | No | FK to `QCControlLot` — set when reagent lot is assigned and a control lot is resolved for (test, instrument) |
| createdBy | Long | Yes | FK to SystemUser |
| createdDate | Timestamp | Yes | Auto-set on creation |
| status | Enum | Yes | DRAFT, ACTIVE, ARCHIVED, COMPLETED |
| generatedDate | Timestamp | No | Set when workplan generated |
| archivedDate | Timestamp | No | Set when batch archived |

**TestBatchItem**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| batchId | Long | Yes | FK to TestBatch |
| analysisId | Long | Yes | FK to Analysis (the pending test) |
| sortOrder | Integer | No | Order within batch |

**TestBatchOverride** (NCE link table — soft join, populated on override)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| batchId | Long | Yes | FK to TestBatch |
| nceRecordId | Long | Yes | FK to NceRecord |
| qcResultId | Long | No | FK to `QCResult` if a specific result drove the override |
| qcRuleViolationId | Long | No | FK to `QCRuleViolation` if a violation drove the override |
| failureMode | Enum | Yes | OVERDUE, FAILED, VIOLATION, NOT_RUN, ESTABLISHMENT |
| overrideBy | Long | Yes | FK to SystemUser |
| overrideDate | Timestamp | Yes | |

### Modified Entities

**QCControlLot** — Add fields:

| Field | Type | Notes |
|---|---|---|
| qcFrequencyType | Enum | DAILY, PER_SHIFT, CUSTOM_HOURS, PER_RUN |
| qcFrequencyHours | Integer | Only used when type = CUSTOM_HOURS |
| qcRequired | Boolean | Whether QC enforcement is active for this control lot (default true) |
| shiftDefinitionHours | Integer | Only used when type = PER_SHIFT; default 8 |

This is the **only schema change to QC-side tables**. It belongs on `QCControlLot` (not `Reagent`) because Westgard configuration is already scoped per test-instrument in the OGC-41 schema, which means frequency naturally inherits the same scoping. No new override layer is needed.

**Reagent** — No fields added in v1.1 (the v1.0 `qcFrequencyType`/`qcFrequencyHours`/`qcRequired` fields are removed from the proposal).

**ReagentLot** — (No new fields needed)

**NceRecord** — Add fields (if not already present):

| Field | Type | Notes |
|---|---|---|
| sourceType | String | "WORKPLAN_BATCH" for auto-generated NCEs |
| sourceBatchId | Long | FK to TestBatch, nullable |
| linkedQcResultId | Long | FK to `QCResult`, nullable |
| linkedQcRuleViolationId | Long | FK to `QCRuleViolation`, nullable |

---

## 6. API Endpoints

### Workplan-side (new)

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/workplan/pending-tests` | List pending tests with filters | `workplan.view` |
| GET | `/api/v1/workplan/batches` | List current user's persisted batches | `workplan.view` |
| POST | `/api/v1/workplan/batches` | Create a new batch | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}` | Update batch (add/remove tests, change reagent lot) | `workplan.batch.create` |
| DELETE | `/api/v1/workplan/batches/{id}` | Delete a single batch | `workplan.batch.create` |
| DELETE | `/api/v1/workplan/batches` | Clear all user's batches | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}/archive` | Archive a batch | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}/reagent` | Assign reagent + reagent lot to batch (Phase 2) | `workplan.batch.create` |
| GET | `/api/v1/workplan/batches/{id}/qc-status` | Returns combined QC status (per FR-QC-003) for the batch's resolved control lot | `workplan.view` |
| POST | `/api/v1/workplan/batches/{id}/generate` | Generate workplan for a batch | `workplan.batch.print` |
| POST | `/api/v1/workplan/batches/{id}/override-qc` | Proceed without valid QC (creates NCE + TestBatchOverride) | `qc.override` |

### QC-side (existing — workplan reuses)

The workplan UI calls the existing OGC-41 endpoints rather than reintroducing them:

| Method | Path | Description | Status |
|---|---|---|---|
| GET | `/api/v1/qc/control-lots?test={testId}&instrument={instId}&status=ACTIVE` | Resolve active control lot for (test, instrument) | Existing (OGC-41) |
| GET | `/api/v1/qc/control-lots/{id}/results?limit={n}` | Recent QC results for a control lot | Existing (OGC-41) |
| GET | `/api/v1/qc/control-lots/{id}/violations?status=OPEN` | Open Westgard violations for a control lot | Existing (OGC-41) |
| POST | `/api/v1/qc/results` | Record a new QC result (publishes `QCResultCreatedEvent`) | Existing (OGC-41) |
| GET | `/api/v1/qc/control-lots/{id}/levey-jennings` | Chart data | Existing (OGC-41) |

**FR-API-001:** The workplan inline QC entry form MUST submit to `POST /api/v1/qc/results` — the existing OGC-41 endpoint — with `controlLotId = batch.resolvedControlLotId`. It MUST NOT introduce a parallel workplan-scoped QC submission endpoint.

---

## 7. UI Design

See companion React mockup: `batch-workplan-reagent-qc-mockup.jsx`

### Navigation Path

The four existing Workplan sub-items (By Test, By Panel, By Lab Unit, By Priority) are replaced by two sub-pages:

- **Workplan → Pending Tests** — Unified filter bar + DataTable of all pending tests. Users select tests and click "Create Batch" to start a new batch (navigates to Batches page).
- **Workplan → Batches** — List of user's batches. Each batch expands for reagent/lot assignment, QC verification, and workplan generation.

### Key Screens

1. **Pending Tests** — Filter bar (Test, Panel, Lab Unit, Priority, Date Range) + DataTable. Tests that belong to a batch show a clickable batch name Tag in the Lab Number column, linking to the Batches page.
2. **Batches** — List of the user's batches as expandable Tiles. Expanded view shows two-phase workflow:
   - **Phase 1 (Tests):** Tests in the batch, with ability to add/remove.
   - **Phase 2 (Reagent & QC):** Select reagent → select reagent lot → resolve control lot → view QC status (Pass/Overdue/Failed/Violation/etc.) → enter QC if needed → generate workplan.
3. **QC Override Modal** — Status-specific destructive confirmation when generating a workplan with invalid QC.

### Cross-links into OGC-41

- "View Full Levey-Jennings Chart" link on the QC status accordion → existing chart page
- "View Violation Details" link on Violation status notifications → existing OGC-41 Alerts/Violations view
- NCE detail page links back to violation detail (and vice versa) via the `linkedQcRuleViolationId` relationship

### Interaction Patterns

- **Multi-filter bar** on Pending Tests page for Test, Panel, Lab Unit, Priority, Date Range — all combinable
- **Batch selection toolbar** appears on Pending Tests when tests are checked — "Create Batch" action (name + tests only, then navigates to Batches)
- **Tile-based batch list** on Batches page with inline expansion for the two-phase setup
- **Inline form** for QC entry (not modal) — follows Constitution Principle 3
- **Modal** only for QC override confirmation (destructive action per Principle 3)
- **Loading state** on batch Tile while async Westgard evaluation completes (FR-QCE-004)

---

## 8. Business Rules

**BR-001:** A test (Analysis) can belong to at most one batch at a time. Attempting to add a test that is already in an active batch MUST fail with an error message identifying the existing batch.

**BR-002:** The combined QC validity for a batch MUST be evaluated per FR-QC-003 — all four conditions (frequency, latest result status, no open rejection violations, lot lifecycle ACTIVE) must be satisfied for QC Pass status. Frequency window evaluation by type:

- `DAILY`: Most recent passing QC must have occurred on the current calendar day (lab timezone)
- `PER_SHIFT`: Most recent passing QC must have occurred within the configured `shiftDefinitionHours` (default 8)
- `CUSTOM_HOURS`: Most recent passing QC must have occurred within `qcFrequencyHours`
- `PER_RUN`: Most recent passing QC must have occurred since the last batch was generated for this control lot

**BR-003:** A `QCResult` with `result_status = REJECTED` does NOT satisfy the QC requirement, regardless of when it was performed. Only ACCEPTED results count toward QC validity. (`result_status` is set by the existing `QCResultCreatedEventListener` based on Westgard rule evaluation.)

**BR-004:** When a batch is generated and its QC status is anything other than Pass, proceeding requires `qc.override` permission and automatically creates an NCE plus a `TestBatchOverride` link record.

**BR-005:** Batches persist per user across sessions. The system stores all batches in DRAFT or ACTIVE status in the default view. Archived batches are hidden by default. Batches in COMPLETED status (all tests have results entered) are auto-archived after 30 days.

**BR-006:** When a reagent lot is expired (past expiration date), it MUST NOT be selectable for a batch. Expired reagent lots appear grayed out in the lot selection list. (Separate from control lot expiration, which is handled per BR-012.)

**BR-007:** The workplan MUST NOT reimplement Westgard rule evaluation. All QC writes go through the existing `QCResultDAO` and the listener-driven evaluation pipeline. Workplan code reads `result_status` and `QCRuleViolation` records but does not compute them.

**BR-008:** The system MUST NOT allow a batch to be created with zero tests. Minimum batch size is 1 test.

**BR-009:** When all tests in a batch have results entered and validated, the batch status MUST automatically transition to COMPLETED.

**BR-010:** A batch MUST NOT be eligible for workplan generation until both a reagent and a reagent lot have been assigned (Phase 2 complete) AND a `QCControlLot` has been resolved for the (test, instrument) pair. The "Generate Workplan" button MUST be disabled with a tooltip if reagent/lot is not assigned or no control lot exists.

**BR-011:** Archiving a batch is a soft delete — it removes the batch from the user's active view and releases its tests. The database record is retained for audit traceability.

**BR-012:** When the resolved `QCControlLot` is in EXPIRED or ARCHIVED status, the batch MUST display "Lot Expired" status and the override "Proceed" button MUST be hidden — a new control lot is the only path forward. This is the only QC failure mode that blocks rather than warns.

**BR-013:** When the resolved `QCControlLot` is in ESTABLISHMENT status, Westgard rules are not yet being evaluated by OGC-41 (per OGC-41 FR-008). The workplan MAY still record QC results inline (which contribute to establishment statistics), but these results will not be evaluated as Pass/Fail. Batch QC status displays as "Lot in Establishment" and proceeding requires NCE override.

**BR-014:** If the QC entry submitted from the workplan does not finalize within the FR-QCE-004 timeout (30 seconds), the user is allowed to proceed; the server-side override-QC endpoint will re-check `result_status` at the moment of override and either dismiss the warning (if ACCEPTED in the interim) or proceed with NCE generation (if still PENDING or REJECTED).

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.workplan.title` | Batch Workplan |
| `heading.workplan.myBatches` | My Batches |
| `heading.workplan.pendingTests` | Pending Tests |
| `heading.workplan.createBatch` | Create Batch |
| `heading.workplan.batchDetail` | Batch Detail |
| `heading.workplan.qcHistory` | QC History |
| `heading.workplan.qcEntry` | Record QC Result |
| `heading.workplan.batchSetup` | Batch Setup |
| `heading.workplan.step1Tests` | Step 1: Tests |
| `heading.workplan.step2Reagent` | Step 2: Reagent & QC |
| `heading.workplan.lastQcRun` | Last QC Run |
| `heading.workplan.fullQcHistory` | Full QC History |
| `heading.workplan.qcOverrideTitle` | QC Not Valid for Batch |
| `label.workplan.batchName` | Batch Name |
| `label.workplan.reagent` | Reagent |
| `label.workplan.reagentLot` | Reagent Lot |
| `label.workplan.controlLot` | Control Lot |
| `label.workplan.instrument` | Instrument |
| `label.workplan.testCount` | Tests in Batch |
| `label.workplan.createdDate` | Created |
| `label.workplan.status` | Status |
| `label.workplan.qcStatus` | QC Status |
| `label.workplan.lastQcDate` | Last QC |
| `label.workplan.nextQcDue` | Next QC Due |
| `label.workplan.qcResult` | Result |
| `label.workplan.qcValue` | Value |
| `label.workplan.qcZScore` | Z-score |
| `label.workplan.performedBy` | Performed By |
| `label.workplan.qcDate` | QC Date/Time |
| `label.workplan.labNumber` | Lab Number |
| `label.workplan.patientName` | Patient Name |
| `label.workplan.testName` | Test Name |
| `label.workplan.panel` | Panel |
| `label.workplan.labUnit` | Lab Unit |
| `label.workplan.priority` | Priority |
| `label.workplan.orderDate` | Order Date |
| `label.workplan.sampleType` | Sample Type |
| `label.workplan.nceLinked` | NCE |
| `label.workplan.violationLinked` | Westgard Violation |
| `label.workplan.filterTest` | Filter by Test |
| `label.workplan.filterPanel` | Filter by Panel |
| `label.workplan.filterUnit` | Filter by Lab Unit |
| `label.workplan.filterPriority` | Filter by Priority |
| `label.workplan.filterDateRange` | Date Range |
| `placeholder.workplan.searchTests` | Search tests... |
| `placeholder.workplan.batchName` | e.g., Chemistry AM Run |
| `placeholder.workplan.qcValue` | Enter measured value... |
| `button.workplan.createBatch` | Create Batch |
| `button.workplan.generateWorkplan` | Generate Workplan |
| `button.workplan.runQc` | Run QC |
| `button.workplan.saveQc` | Save QC Result |
| `button.workplan.clearBatches` | Clear All Batches |
| `button.workplan.removeBatch` | Remove Batch |
| `button.workplan.editBatch` | Edit Batch |
| `button.workplan.cancel` | Cancel |
| `button.workplan.proceedNce` | Proceed and Generate NCE |
| `button.workplan.goBack` | Go Back |
| `button.workplan.archiveBatch` | Archive |
| `button.workplan.viewLjChart` | View Full Levey-Jennings Chart |
| `button.workplan.viewViolation` | View Violation Details |
| `nav.workplan` | Workplan |
| `nav.workplan.pendingTests` | Pending Tests |
| `nav.workplan.batches` | Batches |
| `nav.workplan.batchWorkplan` | Batch Workplan |
| `message.workplan.batchCreated` | Batch created successfully. |
| `message.workplan.qcSaved` | QC result saved. Westgard evaluation pending. |
| `message.workplan.qcEvaluated` | QC evaluation complete: {0}. |
| `message.workplan.workplanGenerated` | Workplan generated for batch "{0}". |
| `message.workplan.nceCreated` | NCE {0} created for QC deviation. |
| `message.workplan.batchCleared` | All batches cleared. |
| `message.workplan.batchRemoved` | Batch "{0}" removed. |
| `message.workplan.qcOverdueWarning` | QC has not been performed within the required timeframe for {0} on {1}. Last passing QC: {2}. |
| `message.workplan.qcFailedWarning` | Most recent QC for {0} on {1} was REJECTED ({2}). |
| `message.workplan.qcViolationWarning` | Unresolved {0} violation exists for {1} on {2}. |
| `message.workplan.qcNotRunWarning` | No QC has been recorded for {0} on {1}. |
| `message.workplan.qcEstablishmentInfo` | Control lot for {0} on {1} is in establishment phase — Westgard rules not yet active. |
| `message.workplan.qcLotExpiredError` | Control lot for {0} on {1} is expired. A new control lot is required. |
| `message.workplan.noControlLotWarning` | No active QC control lot configured for {0} on {1}. |
| `message.workplan.qcOverrideBody` | Proceeding will generate a Non-Conforming Event (NCE) for follow-up. |
| `message.workplan.clearConfirm` | Are you sure you want to clear all batches? This cannot be undone. |
| `message.workplan.noPermissionOverride` | You do not have permission to override QC. Contact your lab manager. |
| `message.workplan.qcEvaluationPending` | QC evaluation pending — refresh to update. |
| `error.workplan.testAlreadyBatched` | This test is already assigned to batch "{0}". Remove it from that batch first. |
| `error.workplan.noBatchTests` | A batch must contain at least one test. |
| `error.workplan.lotExpired` | This lot has expired and cannot be selected. |
| `error.workplan.qcRequired` | QC value is required. |
| `error.workplan.qcDateFuture` | QC date cannot be in the future. |
| `error.workplan.batchNameLength` | Batch name cannot exceed 100 characters. |
| `error.workplan.noControlLot` | No active QC control lot resolved. Contact your QC Officer. |
| `label.workplan.routine` | Routine |
| `label.workplan.urgent` | Urgent |
| `label.workplan.stat` | STAT |
| `label.workplan.qcPass` | QC Pass |
| `label.workplan.qcOverdue` | QC Overdue |
| `label.workplan.qcFailed` | QC Failed |
| `label.workplan.qcViolation` | QC Violation |
| `label.workplan.qcNotRun` | QC Not Run |
| `label.workplan.lotEstablishment` | Lot in Establishment |
| `label.workplan.lotExpired` | Lot Expired |
| `label.workplan.draft` | Draft |
| `label.workplan.active` | Active |
| `label.workplan.completed` | Completed |
| `label.workplan.archived` | Archived |
| `label.workplan.accepted` | Accepted |
| `label.workplan.rejected` | Rejected |
| `label.workplan.fifoSuggested` | FIFO Suggested |
| `label.workplan.expiringSoon` | Expiring Soon |
| `label.workplan.expires` | Exp |
| `label.workplan.remaining` | remaining |
| `label.workplan.testsInBatch` | Tests in this batch |
| `label.workplan.testsSelected` | tests selected |
| `label.workplan.selectLot` | Select Lot |
| `label.workplan.assignReagent` | Assign Reagent |
| `label.workplan.assignLot` | Select Lot |
| `label.workplan.reagentNotAssigned` | Not assigned |
| `label.workplan.nceWillBeCreated` | An NCE will be created |
| `placeholder.workplan.selectReagent` | Select reagent... |
| `message.workplan.noBatches` | No batches created. Select tests below and click "Create Batch" to get started. |
| `message.workplan.noQcHistory` | No QC runs recorded for this control lot. |
| `message.workplan.batchArchived` | Batch "{0}" archived. |
| `message.workplan.reagentRequired` | Assign a reagent and lot before generating a workplan. |
| `message.workplan.nceTraceability` | This NCE will be linked to the batch (and any related Westgard violation) for audit traceability. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Batch test list | Minimum 1 test | `error.workplan.noBatchTests` |
| Reagent lot selection | Lot must not be expired | `error.workplan.lotExpired` |
| QC Value (when entering) | Required, numeric | `error.workplan.qcRequired` |
| QC Date | Required, cannot be in the future | `error.workplan.qcDateFuture` |
| Batch Name | Max 100 characters | `error.workplan.batchNameLength` |
| Test assignment | Test cannot be in two active batches | `error.workplan.testAlreadyBatched` |
| Control lot resolution | Active control lot must exist for (test, instrument) before workplan generation | `error.workplan.noControlLot` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View workplan page | `workplan.view` | Page not shown in menu |
| Create / edit batches | `workplan.batch.create` | "Create Batch" button hidden |
| Generate / print workplan | `workplan.batch.print` | "Generate" buttons hidden |
| Enter QC results | `qc.result.enter` | "Run QC" button hidden |
| Override QC (proceed without valid QC) | `qc.override` | "Proceed" button disabled with tooltip |
| View NCEs from workplan | `nce.view` | NCE Tag navigates to NCE module (access controlled there) |
| View linked Westgard violations | (existing OGC-41 permission, e.g. `qc.violation.view`) | Violation link disabled if denied |

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `workplan.view` permission can access the unified Batch Workplan page
- [ ] The four old workplan sub-pages (By Test, By Panel, By Lab Unit, By Priority) are replaced by the single unified page
- [ ] User can filter pending tests by Test, Panel, Lab Unit, Priority, and Date Range simultaneously
- [ ] User can select tests and create a batch, then assign a reagent and reagent lot in Phase 2
- [ ] Selecting a reagent lot resolves the active `QCControlLot` for the (test, instrument) pair
- [ ] If no active control lot exists, the batch displays a warning and "Generate Workplan" is disabled
- [ ] QC status displays one of: Pass / Overdue / Failed / Violation / Not Run / Lot in Establishment / Lot Expired with the correct Carbon Tag color
- [ ] User can enter QC values inline from the batch Tile without navigating away
- [ ] Inline QC submission writes a new `QCResult` linked to the resolved control lot
- [ ] Inline QC submission triggers `QCResultCreatedEvent` → existing async Westgard evaluator runs → `result_status` finalizes to ACCEPTED or REJECTED
- [ ] If Westgard rules are violated by an inline-entered QC, the corresponding `QCRuleViolation` records appear in the existing OGC-41 dashboard and Alerts views
- [ ] QC status updates on the batch Tile after async evaluation completes (with loading state during evaluation)
- [ ] Levey-Jennings chart for the control lot shows QC results entered via the workplan
- [ ] QC override modal appears when generating a workplan with QC status other than Pass
- [ ] Modal copy reflects the specific failure mode (Overdue / Failed / Violation / Not Run / Establishment / Expired)
- [ ] NCE is automatically created when user proceeds through QC override
- [ ] When the override is driven by a Westgard violation, the NCE is linked to the corresponding `QCRuleViolation`
- [ ] NCE Tag appears on the batch Tile and links to the NCE detail page
- [ ] NCE detail page links back to the linked Westgard violation in the OGC-41 Alerts/Violations view
- [ ] User without `qc.override` permission sees the "Proceed" button disabled with tooltip
- [ ] "Lot Expired" status hides the override "Proceed" button (no override permitted)
- [ ] Batches persist across logout/login — user sees their batches on return
- [ ] "Clear All Batches" removes all user's batches with confirmation
- [ ] A test cannot be added to two batches simultaneously — error message shown
- [ ] Expired reagent lots are grayed out and not selectable
- [ ] FIFO ordering and badges match the Results Page reagent lot selection pattern
- [ ] Batch status transitions: Draft → Active (on generate) → Completed (all tests done)
- [ ] QC frequency types DAILY, PER_SHIFT, CUSTOM_HOURS, and PER_RUN all evaluate correctly per BR-002

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Page loads within 2 seconds with up to 500 pending tests
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with French language file
- [ ] No new QC-side tables or DAOs are introduced; workplan reuses OGC-41 entities and endpoints

### Integration (with OGC-41)

- [ ] QC results entered via workplan appear in the QC dashboard, control-lot detail page, Levey-Jennings chart, and Alerts views
- [ ] `QCResultCreatedEventListener` runs after a workplan QC submission (verify via async listener test)
- [ ] Westgard rule violations from workplan-entered QC create `QCRuleViolation` records identical to those from analyzer-bridge ingestion
- [ ] NCE records created via QC override appear in the NCE module dashboard
- [ ] QC frequency rules are read from the `QCControlLot` configured by the QC Officer (no separate workplan-side store)
- [ ] Reagent-lot expiration and FIFO logic is consistent with the Results Entry reagent lot selection

---

## 13. Integration with OGC-41 (Westgard QC)

This feature is a downstream consumer and producer for the Westgard QC implementation merged via PR #3390 (spec: `specs/OGC-41-westgard-qc/spec.md`).

**What this feature reuses (read-only or write-through):**

- `QCResult` entity and `QCResultDAO`
- `QCResultCreatedEvent` + `QCResultCreatedEventListener` (writes through; never bypassed)
- `WestgardRuleEvaluationService` and the 8 evaluator classes (1-2s, 1-3s, 2-2s, R-4s, 3-1s, 4-1s, 7-t, 10-x)
- `QCControlLot` lifecycle (ESTABLISHMENT → ACTIVE → EXPIRED) and statistical methods (initial-runs, rolling, manufacturer-fixed)
- `WestgardRuleConfig` (per test-instrument enable/disable + severity)
- `QCRuleViolation` records (linked into NCE via `linkedQcRuleViolationId`)
- `QCAlert` notifications (surfaced as part of QC status display)
- Levey-Jennings chart component (`LeveyJenningsChart.jsx`)

**What this feature adds:**

- QC frequency configuration on `QCControlLot` (`qcFrequencyType`, `qcFrequencyHours`, `qcRequired`, `shiftDefinitionHours`)
- A "frequency window" check that complements Westgard rule evaluation (frequency answers "is QC current enough?", Westgard answers "is QC valid?")
- Workplan-entry path that writes through the same listener pipeline
- NCE generation on override, with audit-traceable links to the specific `QCResult` and `QCRuleViolation` that drove the override

**Boundary clarifications:**

- **Reagent lot ≠ control lot.** A `ReagentLot` is the analytical reagent kit (HIV ELISA Lot 12345). A `QCControlLot` is the QC material lot (Bio-Rad Lyphochek Lot ABC). They are independently tracked. This feature uses the reagent lot to (a) honor lab inventory/FIFO conventions and (b) determine which (test, instrument) the batch will run on, then resolves the controlling `QCControlLot` from there.
- **Frequency vs. Westgard are orthogonal.** A control lot may be perfectly within the Westgard rules (no violations) but still be QC-overdue if no QC has been run today. Both checks must pass for QC Pass status.
- **Establishment phase.** Per OGC-41 FR-008, control lots in ESTABLISHMENT status do not have Westgard rules evaluated yet. The workplan acknowledges this with a dedicated status and override path.

---

## 14. Open Questions / Known Gaps

These are flagged for community input before implementation begins. Not blockers — but worth resolving early.

1. **Per-shift definition.** PER_SHIFT frequency uses a single `shiftDefinitionHours` value (default 8). Real labs run 2- or 3-shift schedules with calendar-anchored boundaries (e.g., 06:00 / 14:00 / 22:00). Should we support a richer shift schedule (anchor + duration) or is a rolling 8-hour window sufficient for v1?
2. **Reagent-lot acceptance testing.** Some labs run a one-time reagent-lot acceptance run when a new reagent lot arrives — separate from recurring control-lot QC. Should this feature track that gate, or leave it to the existing reagent-management module? **Proposal:** out of scope for v1; revisit once OGC-41 v2 corrective-action workflows land.
3. **Multi-level QC.** OGC-41 v2 roadmap includes "Multiple control levels per lot" (FR1.2). When a control lot has L1/L2/L3 levels, does the workplan check require all levels current, or just the most recent? **Proposal:** wait for OGC-41 v2 schema; align then.
4. **Override audit retention.** `TestBatchOverride` records link the batch to an NCE and (optionally) a violation. Should they be immutable post-creation? **Proposal:** yes — same immutability rules as `QCRuleViolation`.
5. **Manual analyzers.** Some bench analyzers don't go through the analyzer bridge (and thus don't get auto-tagged QC samples). The `analyzer-manual-qc` spec (issue #3490) addresses manual QC entry from the analyzer-import page; this batch workplan feature complements it by adding a workplan-entry path. Coordinate with the OGC-41 v2 manual-QC track.
6. **Time-zone handling for DAILY.** "Calendar day" is lab-local. Confirm with deployment partners that lab timezone is configured consistently and that overnight shifts (which span two calendar days) work correctly.
