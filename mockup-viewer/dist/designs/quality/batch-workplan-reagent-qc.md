# Batch Workplan with Reagent QC Integration
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-16
**Status:** Draft for Review
**Jira:** (Pending)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Workplan, Reagent Management, QC, NCE System, Test Catalog, Results Entry

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

This feature replaces the four existing workplan screens (by Test, by Panel, by Lab Unit, by Priority) with a single unified workplan that supports multi-criteria filtering, test batching with reagent lot assignment, and integrated QC enforcement. When a user selects a reagent lot for a batch, the system checks whether QC has been performed within the required timeframe (as configured on the reagent definition in Admin). If QC is overdue, the user is warned and can either enter QC results inline or proceed — in which case a Non-Conforming Event (NCE) is automatically generated. Batches persist per user so that work is not lost if the user is logged out.

---

## 2. Problem Statement

**Current state:** Lab technicians must navigate four separate workplan screens to generate workplans by Test, Panel, Lab Unit, or Priority. These screens share nearly identical UI but are accessed separately, forcing users to switch between them when building a day's work. There is no concept of batching tests that share the same reagent, no QC validation at workplan generation time, and no integration between the workplan and the reagent/QC tracking system. Users rely on paper logs or memory to verify that a reagent lot has passed QC before running patient samples.

**Impact:** Without QC enforcement at workplan time, labs risk running patient samples with reagent lots that have not been QC'd for the day — a finding in ISO 15189 audits. Techs must manually reconstruct batches every session because there is no persistence. The four separate screens add unnecessary navigation clicks and cognitive overhead when a simple filter bar would suffice.

**Proposed solution:** A unified workplan page with a multi-filter bar (Test, Panel, Lab Unit, Priority) where users can select pending tests, group them into batches, assign a reagent and specific lot to each batch, see the QC status of that lot at a glance, enter QC results inline if needed, and receive an automatic NCE if they proceed without valid QC. The last batch created by each user is persisted and reloaded on the next visit, with an option to clear it.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | View workplan, create/manage batches, enter QC results, assign reagent lots | Primary user |
| Lab Manager | All technician permissions + override QC warnings, view NCEs generated | Supervisory |
| QC Officer | View QC status across all lots, enter QC results, review NCEs | QC-focused role |
| System Administrator | Full | Configuration only |

**Required permission keys:**

- `workplan.view` — Can access the unified workplan page
- `workplan.batch.create` — Can create and modify test batches
- `workplan.batch.print` — Can generate/print workplan from a batch
- `qc.result.enter` — Can enter QC results for a reagent lot
- `qc.override` — Can proceed with a batch despite QC failure (triggers NCE)
- `nce.view` — Can view generated NCEs (links to NCE module)

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

**FR-BA-003:** Each batch MUST have the following properties: Batch ID (auto-generated), Batch Name (optional user-provided label, defaults to "Batch — [Date]"), Reagent (nullable until assigned), Selected Lot (nullable until assigned), List of Tests, Created By, Created Date/Time, Status (Draft, Active, Archived, Completed).

**FR-BA-004:** Tests that are already assigned to a batch MUST show a Tag in the DataTable indicating the batch name, and MUST NOT be selectable for a different batch without first removing them from the existing batch.

### 4.3 Reagent & Lot Assignment (Phase 2 — Batch Setup)

**FR-RA-001:** After a batch is created, the user expands the batch Tile to assign a reagent and lot. The expanded batch view MUST present a Reagent dropdown populated with reagents configured for the tests in the batch. If the tests span multiple reagents, all applicable reagents MUST be shown.

**FR-RA-002:** After selecting a reagent, the system MUST display the available lots for that reagent, following the same FIFO-ordered lot selection pattern used on the Results Page (see `results-page-requirements.md`, Reagent Lot Selection section). Lots are sorted by received date (oldest first), with FIFO Suggested badge on the oldest unexpired lot.

**FR-RA-003:** When the user selects a lot, the system MUST immediately retrieve QC status for that lot and display it (see §4.5 Reagent QC Integration). The batch is now "fully set up" and ready for workplan generation.

**FR-RA-004:** The user MUST be able to change the reagent and/or lot on a batch in Draft status at any time. Changing the lot MUST re-evaluate QC status.

### 4.4 Batch Lifecycle & Persistence

**FR-BL-001:** Batch status transitions follow this lifecycle: Draft → Active (on workplan generation) → Completed (all tests have results entered). Any batch can also be Archived (soft-deleted) when the user is finished with it or decides not to run it.

**FR-BL-002:** A batch in Draft status can be fully modified: add/remove tests, change reagent/lot, rename.

**FR-BL-003:** A batch in Active status (workplan printed/generated) cannot be modified unless the user explicitly clicks "Edit" which returns it to Draft status (requires `workplan.batch.create` permission).

**FR-BL-004:** The "Archive" action is a soft delete — it removes the batch from the active "My Batches" view. Archived batches are retained in the database for audit traceability but do not appear in the user's working view. Tests from an archived batch are released and become available for new batches.

**FR-BL-005:** Each batch Tile MUST display an OverflowMenu with the following actions: Edit (returns Active → Draft for modification), Archive (soft-delete, removes from view).

**FR-BL-006:** The system MUST persist the user's batches (Draft, Active) server-side, keyed to the user's account. Batches MUST survive logout and re-login.

**FR-BL-007:** When the user navigates to the workplan page, the system MUST reload their persisted batches and display them in a "My Batches" summary panel above the test list DataTable.

**FR-BL-008:** The "My Batches" panel MUST display each batch as a Tile showing: Batch Name, Reagent Name (or "Not assigned" if Phase 2 incomplete), Lot Number (or "—"), Number of Tests, QC Status Tag (if lot assigned), Status Tag, Created Date.

**FR-BL-009:** The user MUST be able to clear all batches via a "Clear All" button with a destructive confirmation modal.

**FR-BL-010:** Batches in Completed status (all tests have results entered) are auto-archived after 30 days.

### 4.5 Reagent QC Integration

**FR-QC-001:** Each reagent definition in Admin MUST include a QC Frequency Rule specifying how often QC must be performed. Supported frequency types: `DAILY` (QC required each calendar day before first use), `PER_LOT` (QC required once when a new lot is opened/received), `CUSTOM_HOURS` (QC required every N hours — configurable).

**FR-QC-002:** When a user selects a reagent lot for a batch, the system MUST retrieve the most recent QC run record for that specific lot and evaluate whether QC is current based on the reagent's QC Frequency Rule.

**FR-QC-003:** The QC status for a lot MUST be displayed as a Carbon Tag: QC Pass (`green`, kind `green`), QC Overdue (`red`, kind `red`), QC Not Run (`gray`, kind `gray`), QC Failed (`red`, kind `red`).

**FR-QC-004:** The batch Tile (in My Batches panel) MUST display the QC status Tag for the selected lot. If QC is overdue or failed, an InlineNotification (kind `warning`) MUST appear below the Tile with the message: "QC has not been performed within the required timeframe for [Reagent Name] lot [Lot Number]. Last QC: [date] or 'Never'."

**FR-QC-005:** QC run details MUST be viewable inline by clicking the QC status Tag, which expands an Accordion showing: Last QC Date/Time, Performed By, Result (Pass/Fail), Value (optional freetext), Next QC Due.

**FR-QC-006:** When a batch has a lot assigned, the Last QC Run summary (date, performed by, result, value) MUST always be visible in the expanded batch view — not collapsed behind an accordion. This ensures the most recent QC status is immediately apparent without extra clicks.

**FR-QC-007:** On the Batches page, any batch with QC status of "Overdue" or "Failed" MUST be auto-expanded by default when the page loads, so the user immediately sees the QC issue and the last QC run details without needing to manually expand the tile.

### 4.6 Inline QC Entry

**FR-QCE-001:** The user MUST be able to enter a new QC result directly from the workplan batch screen without navigating away. A "Run QC" button MUST appear on each batch Tile when QC is overdue or has not been run.

**FR-QCE-002:** Clicking "Run QC" MUST expand an inline form (not a modal) within the batch Tile containing: Date/Time (defaults to now, editable), Result (RadioButtonGroup: Pass / Fail), Value (optional TextInput for freetext notes/values), Performed By (auto-populated with current user, editable ComboBox for delegated entry).

**FR-QCE-003:** On saving a QC result, the system MUST immediately re-evaluate the lot's QC status and update the Tag on the batch Tile. If Pass, the QC Overdue warning MUST be dismissed.

**FR-QCE-004:** A QC result of Fail MUST change the lot's Tag to "QC Failed" (red) and display an InlineNotification (kind `error`): "QC failed for [Reagent] lot [Lot]. Consider selecting a different lot or re-running QC."

**FR-QCE-005:** All QC results entered via the workplan MUST be persisted in the same QC run history table used by the dedicated QC module, ensuring a single source of truth.

### 4.7 QC Override and NCE Generation

**FR-NCE-001:** If the user attempts to generate/print a workplan for a batch whose selected reagent lot has QC Overdue or QC Failed status, the system MUST display a Modal (danger kind) warning:

Title: "QC Not Valid for Batch"
Body: "The selected lot [Lot Number] for reagent [Reagent Name] has not passed QC within the required timeframe. Proceeding will generate a Non-Conforming Event (NCE) for follow-up."
Actions: "Proceed and Generate NCE" (danger button), "Go Back" (secondary button)

**FR-NCE-002:** If the user clicks "Proceed and Generate NCE", the system MUST automatically create an NCE record in the NCE module with the following data: NCE Type = "Reagent QC Deviation", Source = "Workplan Batch [Batch ID]", Reagent = [Reagent Name], Lot = [Lot Number], Last QC Date = [date or 'Never'], Required Frequency = [from reagent config], Tests in Batch = [list of test names and lab numbers], Created By = [current user], Created Date = [now], Status = Open.

**FR-NCE-003:** The generated NCE MUST appear as a linked record on the batch, visible as a Tag (kind `red`, text "NCE: [NCE-ID]") on the batch Tile. Clicking this Tag MUST navigate to the NCE detail page.

**FR-NCE-004:** The system MUST NOT block the user from proceeding — the purpose is traceability and follow-up, not prevention. However, the user MUST hold the `qc.override` permission to click "Proceed and Generate NCE". If the user lacks this permission, the "Proceed" button MUST be disabled and a tooltip MUST read: "You do not have permission to override QC. Contact your lab manager."

### 4.8 Workplan Generation / Print

**FR-WG-001:** Each batch MUST have a "Generate Workplan" button that produces a printable workplan document for that batch.

**FR-WG-002:** The generated workplan MUST include: Batch Name, Date, Reagent Name, Lot Number, QC Status, List of Tests (Lab Number, Patient Name, Test Name, Sample Type, Priority), Generated By, Generated Date/Time.

**FR-WG-003:** Generating the workplan MUST change the batch status from Draft to Active.

**FR-WG-004:** (Removed — batch workplan generation is per-batch only.)

---

## 5. Data Model

### New Entities

**TestBatch**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key, auto-generated |
| batchName | String(100) | No | User-provided label, defaults to "Batch — [Date]" |
| reagentId | Long | No | FK to Reagent — nullable until Phase 2 assignment |
| reagentLotId | Long | No | FK to ReagentLot — nullable until Phase 2 assignment |
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

**QcRun**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| reagentLotId | Long | Yes | FK to ReagentLot |
| runDate | Timestamp | Yes | Date/time of QC run |
| result | Enum | Yes | PASS, FAIL |
| value | String(500) | No | Optional freetext value/notes |
| performedBy | Long | Yes | FK to SystemUser |
| source | String(50) | No | Where QC was entered: "WORKPLAN", "QC_MODULE", "IMPORT" |

### Modified Entities

**Reagent** — Add fields:

| Field | Type | Notes |
|---|---|---|
| qcFrequencyType | Enum | DAILY, PER_LOT, CUSTOM_HOURS |
| qcFrequencyHours | Integer | Only used when type = CUSTOM_HOURS |
| qcRequired | Boolean | Whether QC enforcement is active for this reagent |

**ReagentLot** — (No new fields needed; QC status is derived from QcRun queries)

**NceRecord** — Add fields (if not already present):

| Field | Type | Notes |
|---|---|---|
| sourceType | String | "WORKPLAN_BATCH" for auto-generated NCEs |
| sourceBatchId | Long | FK to TestBatch, nullable |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/workplan/pending-tests` | List pending tests with filters (test, panel, unit, priority, dateRange) | `workplan.view` |
| GET | `/api/v1/workplan/batches` | List current user's persisted batches | `workplan.view` |
| POST | `/api/v1/workplan/batches` | Create a new batch | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}` | Update batch (add/remove tests, change lot) | `workplan.batch.create` |
| DELETE | `/api/v1/workplan/batches/{id}` | Delete a single batch | `workplan.batch.create` |
| DELETE | `/api/v1/workplan/batches` | Clear all user's batches | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}/archive` | Archive a batch | `workplan.batch.create` |
| PUT | `/api/v1/workplan/batches/{id}/reagent` | Assign reagent + lot to batch (Phase 2) | `workplan.batch.create` |
| POST | `/api/v1/workplan/batches/{id}/generate` | Generate workplan for a batch | `workplan.batch.print` |
| GET | `/api/v1/reagents/{id}/lots` | List lots for a reagent (FIFO ordered) | `workplan.view` |
| GET | `/api/v1/reagent-lots/{id}/qc-status` | Get QC status and last run for a lot | `workplan.view` |
| POST | `/api/v1/reagent-lots/{id}/qc-runs` | Record a new QC run | `qc.result.enter` |
| GET | `/api/v1/reagent-lots/{id}/qc-runs` | List QC run history for a lot | `workplan.view` |
| POST | `/api/v1/workplan/batches/{id}/override-qc` | Proceed without valid QC (creates NCE) | `qc.override` |

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
   - **Phase 2 (Reagent & QC):** Select reagent → select lot → view QC status → enter QC if needed → generate workplan.
3. **QC Override Modal** — Destructive confirmation when generating a workplan with invalid QC (on Batches page).

### Interaction Patterns

- **Multi-filter bar** on Pending Tests page for Test, Panel, Lab Unit, Priority, Date Range — all combinable
- **Batch selection toolbar** appears on Pending Tests when tests are checked — "Create Batch" action (name + tests only, then navigates to Batches)
- **Clickable batch Tag** on Pending Tests links test to its batch on the Batches page
- **Tile-based batch list** on Batches page with inline expansion for the two-phase setup
- **OverflowMenu** on each batch Tile with Edit / Archive actions
- **Inline form** for QC entry (not modal) — follows Constitution Principle 3
- **Modal** only for QC override confirmation (destructive action per Principle 3)
- **Archive** as soft delete — batch disappears from Batches list, tests released back to pending pool

---

## 8. Business Rules

**BR-001:** A test (Analysis) can belong to at most one batch at a time. Attempting to add a test that is already in an active batch MUST fail with an error message identifying the existing batch.

**BR-002:** QC status for a reagent lot is derived dynamically from the most recent QcRun record and the reagent's QC Frequency Rule. For DAILY: QC is valid if the most recent passing QcRun for that lot occurred on the current calendar day. For PER_LOT: QC is valid if any passing QcRun exists for that lot. For CUSTOM_HOURS: QC is valid if the most recent passing QcRun occurred within the configured number of hours.

**BR-003:** A QcRun with result = FAIL does NOT satisfy the QC requirement, regardless of when it was performed. Only PASS results count toward QC validity.

**BR-004:** When a batch is generated (workplan printed) and the selected lot has invalid QC, proceeding requires `qc.override` permission and automatically creates an NCE linked to the batch.

**BR-005:** Batches persist per user across sessions. The system stores all batches in DRAFT or ACTIVE status in the default view. Archived batches are hidden by default. Batches in COMPLETED status (all tests have results entered) are auto-archived after 30 days.

**BR-010:** A batch MUST NOT be eligible for workplan generation until both a reagent and a lot have been assigned (Phase 2 complete). The "Generate Workplan" button MUST be disabled with a tooltip if reagent/lot is not assigned.

**BR-011:** Archiving a batch is a soft delete — it removes the batch from the user's active view and releases its tests. The database record is retained for audit traceability.

**BR-006:** When a reagent lot is expired (past expiration date), it MUST NOT be selectable for a batch. Expired lots appear grayed out in the lot selection list.

**BR-007:** If the user enters a QC result of FAIL and then immediately tries to generate the workplan, the QC override flow (FR-NCE-001) MUST trigger, since a FAIL result does not constitute valid QC.

**BR-008:** The system MUST NOT allow a batch to be created with zero tests. Minimum batch size is 1 test.

**BR-009:** When all tests in a batch have results entered and validated, the batch status MUST automatically transition to COMPLETED.

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
| `label.workplan.batchName` | Batch Name |
| `label.workplan.reagent` | Reagent |
| `label.workplan.lot` | Lot Number |
| `label.workplan.testCount` | Tests in Batch |
| `label.workplan.createdDate` | Created |
| `label.workplan.status` | Status |
| `label.workplan.qcStatus` | QC Status |
| `label.workplan.lastQcDate` | Last QC |
| `label.workplan.nextQcDue` | Next QC Due |
| `label.workplan.qcResult` | Result |
| `label.workplan.qcValue` | Value (optional) |
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
| `label.workplan.filterTest` | Filter by Test |
| `label.workplan.filterPanel` | Filter by Panel |
| `label.workplan.filterUnit` | Filter by Lab Unit |
| `label.workplan.filterPriority` | Filter by Priority |
| `label.workplan.filterDateRange` | Date Range |
| `placeholder.workplan.searchTests` | Search tests... |
| `placeholder.workplan.batchName` | e.g., Chemistry AM Run |
| `placeholder.workplan.qcValue` | Enter value or notes... |
| `button.workplan.createBatch` | Create Batch |
| `button.workplan.generateWorkplan` | Generate Workplan |
| `nav.workplan.pendingTests` | Pending Tests |
| `nav.workplan.batches` | Batches |
| `button.workplan.runQc` | Run QC |
| `button.workplan.saveQc` | Save QC Result |
| `button.workplan.clearBatches` | Clear All Batches |
| `button.workplan.removeBatch` | Remove Batch |
| `button.workplan.editBatch` | Edit Batch |
| `button.workplan.cancel` | Cancel |
| `button.workplan.proceedNce` | Proceed and Generate NCE |
| `button.workplan.goBack` | Go Back |
| `message.workplan.batchCreated` | Batch created successfully. |
| `message.workplan.qcSaved` | QC result saved. |
| `message.workplan.workplanGenerated` | Workplan generated for batch "{0}". |
| `message.workplan.nceCreated` | NCE {0} created for QC deviation. |
| `message.workplan.batchCleared` | All batches cleared. |
| `message.workplan.batchRemoved` | Batch "{0}" removed. |
| `message.workplan.qcOverdueWarning` | QC has not been performed within the required timeframe for {0} lot {1}. Last QC: {2}. |
| `message.workplan.qcFailedWarning` | QC failed for {0} lot {1}. Consider selecting a different lot or re-running QC. |
| `message.workplan.qcOverrideBody` | The selected lot {0} for reagent {1} has not passed QC within the required timeframe. Proceeding will generate a Non-Conforming Event (NCE) for follow-up. |
| `message.workplan.clearConfirm` | Are you sure you want to clear all batches? This cannot be undone. |
| `message.workplan.noPermissionOverride` | You do not have permission to override QC. Contact your lab manager. |
| `error.workplan.testAlreadyBatched` | This test is already assigned to batch "{0}". Remove it from that batch first. |
| `error.workplan.noBatchTests` | A batch must contain at least one test. |
| `error.workplan.lotExpired` | This lot has expired and cannot be selected. |
| `error.workplan.qcRequired` | QC result is required. |
| `nav.workplan` | Workplan |
| `nav.workplan.batchWorkplan` | Batch Workplan |
| `heading.workplan.qcOverrideTitle` | QC Not Valid for Batch |
| `label.workplan.routine` | Routine |
| `label.workplan.urgent` | Urgent |
| `label.workplan.stat` | STAT |
| `label.workplan.qcPass` | QC Pass |
| `label.workplan.qcOverdue` | QC Overdue |
| `label.workplan.qcFailed` | QC Failed |
| `label.workplan.qcNotRun` | QC Not Run |
| `label.workplan.draft` | Draft |
| `label.workplan.active` | Active |
| `label.workplan.completed` | Completed |
| `label.workplan.pass` | Pass |
| `label.workplan.fail` | Fail |
| `label.workplan.fifoSuggested` | FIFO Suggested |
| `label.workplan.expiringSoon` | Expiring Soon |
| `label.workplan.expires` | Exp |
| `label.workplan.remaining` | remaining |
| `label.workplan.testsInBatch` | Tests in this batch |
| `label.workplan.testsSelected` | tests selected |
| `label.workplan.selectLot` | Select Lot |
| `label.workplan.nceWillBeCreated` | An NCE will be created |
| `placeholder.workplan.selectReagent` | Select reagent... |
| `message.workplan.noBatches` | No batches created. Select tests below and click "Create Batch" to get started. |
| `message.workplan.noQcHistory` | No QC runs recorded for this lot. |
| `message.workplan.nceTraceability` | This NCE will be linked to the batch for audit traceability and require follow-up. |
| `error.workplan.qcDateFuture` | QC date cannot be in the future. |
| `error.workplan.batchNameLength` | Batch name cannot exceed 100 characters. |
| `button.workplan.archiveBatch` | Archive |
| `label.workplan.archived` | Archived |
| `label.workplan.reagentNotAssigned` | Not assigned |
| `label.workplan.assignReagent` | Assign Reagent |
| `label.workplan.assignLot` | Select Lot |
| `message.workplan.batchArchived` | Batch "{0}" archived. |
| `message.workplan.reagentRequired` | Assign a reagent and lot before generating a workplan. |
| `heading.workplan.batchSetup` | Batch Setup |
| `heading.workplan.step1Tests` | Step 1: Tests |
| `heading.workplan.step2Reagent` | Step 2: Reagent & QC |
| `heading.workplan.lastQcRun` | Last QC Run |
| `heading.workplan.fullQcHistory` | Full QC History |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Batch test list | Minimum 1 test | `error.workplan.noBatchTests` |
| Reagent lot selection | Lot must not be expired | `error.workplan.lotExpired` |
| QC Result (when entering) | Required (Pass or Fail) | `error.workplan.qcRequired` |
| QC Date | Required, cannot be in the future | `error.workplan.qcDateFuture` |
| Batch Name | Max 100 characters | `error.workplan.batchNameLength` |
| Test assignment | Test cannot be in two active batches | `error.workplan.testAlreadyBatched` |

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

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `workplan.view` permission can access the unified Batch Workplan page
- [ ] The four old workplan sub-pages (By Test, By Panel, By Lab Unit, By Priority) are replaced by the single unified page
- [ ] User can filter pending tests by Test, Panel, Lab Unit, Priority, and Date Range simultaneously
- [ ] User can select tests and create a batch, assigning a reagent and lot
- [ ] Selected lot displays QC status (Pass/Overdue/Failed/Not Run) with correct Carbon Tag color
- [ ] User can enter QC results inline from the batch Tile without navigating away
- [ ] QC status updates immediately after saving a QC result
- [ ] QC override modal appears when generating a workplan with invalid QC on the lot
- [ ] NCE is automatically created when user proceeds through QC override
- [ ] NCE Tag appears on the batch Tile and links to the NCE detail page
- [ ] User without `qc.override` permission sees the "Proceed" button disabled with tooltip
- [ ] Batches persist across logout/login — user sees their batches on return
- [ ] "Clear All Batches" removes all user's batches with confirmation
- [ ] A test cannot be added to two batches simultaneously — error message shown
- [ ] Expired lots are grayed out and not selectable
- [ ] FIFO ordering and badges match the Results Page reagent lot selection pattern
- [ ] Batch status transitions: Draft → Active (on generate) → Completed (all tests done)

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Page loads within 2 seconds with up to 500 pending tests
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with French language file
- [ ] QC results entered via workplan appear in the QC module's history

### Integration

- [ ] NCE records created via QC override appear in the NCE module dashboard
- [ ] QC results are shared with the QC module (single source of truth in QcRun table)
- [ ] Reagent QC Frequency Rules are read from the reagent definition configured in Admin
- [ ] Lot expiration and FIFO logic is consistent with the Results Entry reagent lot selection
