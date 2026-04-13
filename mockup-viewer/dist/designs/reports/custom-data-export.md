# Custom Data Export & My Report Queue
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-25
**Status:** Draft for Review
**Jira Stories:**
- [OGC-479](https://uwdigi.atlassian.net/browse/OGC-479) — Custom Data Export: 3-step report builder wizard
- [OGC-481](https://uwdigi.atlassian.net/browse/OGC-481) — My Report Queue: Async job queue
- [OGC-483](https://uwdigi.atlassian.net/browse/OGC-483) — Saved Export Configurations
**Parent Epic:** [OGC-70](https://uwdigi.atlassian.net/browse/OGC-70) — Catalyst LLM-Powered Lab Data Assistant
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Report Print Queue, Catalyst (OGC-70), Reports, User Preferences

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

The Custom Data Export feature gives authorized laboratory staff a self-service tool to extract structured CSV data from OpenELIS Global without requiring LLM configuration or DBA intervention. Users select from a curated catalog of variables across eight data domains, apply date range and lab section filters, and receive an estimated row count before submission. Small reports download immediately; large reports are processed asynchronously via a personal report queue with download notification. This feature is the no-LLM foundational layer that Catalyst's Wizard Mode (OGC-70) will build upon in a later phase, sharing the same `filterSpec` schema, `selectedVariables` catalog, and queue infrastructure.

---

## 2. Problem Statement

**Current state:** Generating custom data extracts from OpenELIS Global requires either running preconfigured Jasper reports (which cover a limited set of fixed queries), writing ad hoc SQL, or requesting data from a system administrator. No self-service mechanism exists for variable-composition data export.

**Impact:** Lab managers, QA officers, and program case managers cannot independently generate the operational reports they need for accreditation submissions, TAT monitoring, QC reviews, or program follow-up. This creates bottlenecks and reliance on technical staff for routine data needs. Users with data needs outside the fixed Jasper report set have no recourse.

**Proposed solution:** A structured 3-step report builder wizard in the Reports section allows users to select variables from predefined groups, apply date and section filters, preview estimated row counts, and receive their data as a CSV file — either immediately for small requests or via an async queue for larger ones. RBAC ensures users only export data from lab sections they are authorized to access, and PII fields require explicit two-tier additional permissions.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | Build & download personal exports | Scoped to assigned lab sections; no PII by default |
| Lab Manager | Build & download personal exports | Scoped to assigned sections; may hold PII permissions |
| QA Officer | Build & download personal exports | Scoped to assigned sections |
| Case Manager | Build & download personal exports | Program-scoped; may hold PII permissions |
| System Administrator | Full | Access to all sections; may hold PII permissions |

**Required permission keys:**

- `DATA_EXPORT` — Required to access the Custom Data Export page and My Report Queue, submit jobs, and download results. All other export permissions are additive to this base key.
- `DATA_EXPORT_PII_DEMOGRAPHICS` — Required to include patient demographics (name, DOB, sex) in an export. Without this key, the Demographics variable group is visible but locked with a lock icon.
- `DATA_EXPORT_PII_IDENTIFIERS` — Required to include strong patient identifiers (national ID, program codes, phone, address) in an export. Without this key, the Identifiers variable group is visible but locked.

---

## 4. Functional Requirements

### 4.1 Report Builder — Step 1: Variable Selection

**FR-1-001:** The report builder MUST be a 3-step wizard rendered with a Carbon `ProgressIndicator` showing three steps: (1) Select Variables, (2) Set Filters, (3) Review & Submit. Users may navigate backwards freely at any time; forward navigation from Step 1 to Step 2 requires at least one variable selected.

**FR-1-002:** Step 1 MUST present variables organized into eight domain groups, each rendered as a Carbon `Accordion` item with the domain name as the header:
- Sample / Order
- Test Results
- Patient Demographics *(🔒 locked if `DATA_EXPORT_PII_DEMOGRAPHICS` absent)*
- Patient Identifiers *(🔒 locked if `DATA_EXPORT_PII_IDENTIFIERS` absent)*
- Turnaround Time
- Quality Control
- Referrals
- Non-Conformance / Rejections

**FR-1-003:** Each domain group MUST display its full variable list as individual `Checkbox` items. The complete variable catalog is defined in Section 5.

**FR-1-004:** PII-gated groups (Patient Demographics, Patient Identifiers) MUST be rendered with a lock icon in the group header and disabled (greyed) `Checkbox` items for users without the corresponding permission key. A tooltip on the group header MUST state which permission is required (e.g., "Requires Data Export PII Demographics permission"). The groups MUST remain visible — not hidden — so users understand what data exists and can request the appropriate permissions.

**FR-1-005:** A "Select All" checkbox MUST appear at the top of each domain group's variable list. Checking it selects all variables in that group; unchecking it clears all. "Select All" MUST be indeterminate when some but not all variables are selected.

**FR-1-006:** A running count of total selected variables MUST be displayed in the step header area (e.g., "12 variables selected"). The "Next" button to proceed to Step 2 MUST be disabled and display a tooltip ("Select at least one variable to continue") when zero variables are selected.

**FR-1-007:** Variable selection state MUST persist when the user navigates backwards to Step 1 from Steps 2 or 3. Navigating back does not reset selections.

### 4.2 Report Builder — Step 2: Filters

**FR-2-001:** Step 2 MUST include a mandatory date range filter using two `DatePickerInput` fields: "Date From" and "Date To". Both fields are required. The date range applies to:
- Collection date for the Sample/Order, Test Results, Turnaround Time, and Non-Conformance domains
- QC date for the Quality Control domain
- Referral date for the Referrals domain

**FR-2-002:** Step 2 MUST include a Lab Section `MultiSelect` populated with the lab sections the current user has access to. If the user has access to exactly one section, it MUST be pre-selected and the control MUST be read-only. If the user has access to multiple sections, no sections are pre-selected by default (selecting none is equivalent to selecting all accessible sections).

**FR-2-003:** Step 2 MUST include an optional Sample Status `MultiSelect` filter with values: Received, In Progress, Resulted, Validated, Cancelled.

**FR-2-004:** Step 2 MUST include an optional Result Status `MultiSelect` filter with values: Preliminary, Final, Corrected. This filter MUST be disabled (greyed with tooltip) when no variables from the Test Results domain are selected.

**FR-2-005:** Step 2 MUST include an optional Priority `MultiSelect` filter with values: Routine, Urgent, STAT.

**FR-2-006:** Step 2 MUST include an optional Referring Site `ComboBox` with search, allowing users to filter by a single referring facility.

**FR-2-007:** The "Date To" MUST NOT be earlier than "Date From". If the user selects an invalid range, the Date To field MUST display Carbon's built-in `invalidText` validation error: "Date To must be on or after Date From." The "Next" button to Step 3 MUST be disabled while this error is active.

**FR-2-008:** Filter state MUST persist when the user navigates backwards from Step 3 to Step 2. Navigating back does not reset filter selections.

### 4.3 Report Builder — Step 3: Review & Submit

**FR-3-001:** Step 3 MUST display a read-only summary panel showing: (a) selected variables count and grouped list, (b) applied date range, (c) selected lab sections (or "All accessible sections" if none specified), and (d) any optional filters applied.

**FR-3-002:** Step 3 MUST include a `TextInput` for the export name. This field is optional. If left blank on submission, the system MUST auto-generate a name using the format `[Domains]_[DateFrom]_to_[DateTo]` (e.g., `Test_Results_2026-01-01_to_2026-03-31`). Maximum 100 characters.

**FR-3-003:** Step 3 MUST automatically fetch a row count estimate via `POST /api/v1/reports/data-export/estimate` when the user arrives at Step 3 (not on button click). A skeleton/loading state MUST be shown while the estimate is pending. If estimation fails or times out, an `InlineNotification` with kind `warning` MUST be displayed: "Row count estimate unavailable. The export will be queued for processing." The user can still submit.

**FR-3-004:** Based on the estimate response:
- If `routedAsync: false` → display `InlineNotification` kind `info`: "This report will download immediately (~{count} rows)."
- If `routedAsync: true` → display `InlineNotification` kind `info`: "This report will be queued — you will be notified when it is ready (~{count} rows, ~{wait} min)."

**FR-3-005:** Clicking "Generate Export" triggers `POST /api/v1/reports/data-export/jobs`. On success:
- Sync (200): Browser initiates file download immediately; `InlineNotification` kind `success` confirms: "Your export is downloading."
- Async (202): `InlineNotification` kind `success` confirms queuing and includes a "View My Report Queue" link.

**FR-3-006:** After successful submission (sync or async), the wizard MUST reset to Step 1 with all variable selections and filters cleared, allowing the user to build a new export.

### 4.4 Row Estimation

**FR-4-001:** The `/api/v1/reports/data-export/estimate` endpoint MUST execute a `COUNT(*)` query using the same filter predicates as the full export, but without materializing result rows. Response schema:
```json
{ "estimatedRows": 12450, "routedAsync": true, "estimatedWaitSeconds": 45 }
```

**FR-4-002:** The estimate MUST complete within 5 seconds. If the query exceeds 5 seconds, the endpoint MUST return a timeout response (HTTP 200 with `{ "estimatedRows": null, "timedOut": true, "routedAsync": true }`). The UI MUST display a warning that the estimate is unavailable and assume the export will be queued.

**FR-4-003:** The row estimate displayed to the user MUST be prefixed with a tilde to indicate approximation (e.g., "~12,450 rows estimated"). It MUST NOT be presented as exact.

### 4.5 Sync vs Async Routing

**FR-5-001:** If `estimatedRows ≤ 5,000` AND the date range span is ≤ 7 calendar days, the job MUST be routed synchronously. The CSV is generated within the HTTP request/response and returned as a file download with `Content-Disposition: attachment`.

**FR-5-002:** If either threshold is exceeded — rows > 5,000 OR date range > 7 days — the job MUST be routed asynchronously. `POST /api/v1/reports/data-export/jobs` returns HTTP 202 with the job ID. The job enters the async processing queue.

**FR-5-003:** If a sync job exceeds 30 seconds of server-side generation time, it MUST be automatically promoted to async. The HTTP response transitions to 202 with the job ID. The frontend MUST handle a delayed 202 response gracefully by redirecting to the queue view with an explanatory notification.

**FR-5-004:** Both the row threshold (5,000) and the date range threshold (7 days) MUST be admin-configurable via Admin → Site Configuration → Data Export Settings.

### 4.6 My Report Queue Page

**FR-6-001:** The My Report Queue page MUST display a paginated Carbon `DataTable` of the current user's export jobs, defaulting to jobs created in the last 30 days, sorted by most-recently-created first.

**FR-6-002:** Each queue row MUST display the following columns: Job Name, Domains, Date Range, Submitted At, Status, Rows / File Size, and Actions.

**FR-6-003:** Job statuses MUST use Carbon `Tag` kinds as follows:

| Status | Tag Kind |
|---|---|
| QUEUED | `purple` |
| GENERATING | `blue` |
| READY | `green` |
| FAILED | `red` |
| EXPIRED | `gray` |
| CANCELLED | `warm-gray` |

**FR-6-004:** READY jobs MUST display a primary "Download" button. Clicking it triggers a file download via `GET /api/v1/reports/data-export/jobs/{id}/download`. Downloading does NOT change job status — repeat downloads are permitted until expiry.

**FR-6-005:** QUEUED jobs MUST display a ghost "Cancel Job" button. Confirming cancellation transitions the job to CANCELLED and removes it from the processing queue. A destructive confirmation `Modal` MUST be shown before cancellation executes.

**FR-6-006:** FAILED jobs MUST display a secondary "Retry" button. Clicking Retry re-submits an identical job (new job record, same `selectedVariables` and `filterSpec`) and routes it through the standard sync/async evaluation. The original failed job remains in the queue.

**FR-6-007:** EXPIRED jobs MUST display a ghost "Re-run" button. Clicking Re-run navigates the user to the Report Builder with all variable selections and optional filters pre-populated from the expired job's parameters. The date range is NOT pre-populated — the user must set a new date range before submitting.

**FR-6-008:** READY and EXPIRED jobs MUST display the row count and file size (e.g., "4,312 rows · 847 KB") in the Rows / File Size column.

**FR-6-009:** QUEUED jobs MUST display an estimated wait time (e.g., "~2 min") in the Rows / File Size column, based on current queue depth.

**FR-6-010:** Any job in any status EXCEPT GENERATING may be deleted from the queue. A ghost "Delete" action MUST be available via an `OverflowMenu` per row. Deleting a READY job purges both the record and the output file from storage. Attempting to delete a GENERATING job MUST show an error notification.

**FR-6-011:** The queue page MUST automatically poll `GET /api/v1/reports/data-export/jobs` every 15 seconds while any job is in QUEUED or GENERATING status. Polling MUST stop when no active jobs exist. The DataTable MUST update in place without a full page reload.

**FR-6-012:** When an async job transitions to READY or FAILED, an in-app notification (banner) MUST be displayed, even if the user has navigated to a different page. The notification for READY jobs MUST include a direct download link.

### 4.7 Saved Report Configurations

**FR-7-001:** At the top of Step 1 (Variable Selection), the wizard MUST display a "Load saved configuration" `ComboBox`. The dropdown lists the current user's saved configurations by name, sorted most-recently-used first. Selecting a configuration and clicking "Load" pre-populates variable selections and all non-date filter fields. The date range is never saved or pre-populated — the user must always set the date range fresh.

**FR-7-002:** On Step 3 (Review & Submit), the wizard MUST display a "Save this configuration" section with a `TextInput` for the configuration name and a "Save" button. Clicking Save creates a `DataExportSavedConfig` record. If a config with the same name already exists for the user, a confirmation dialog MUST ask whether to overwrite it.

**FR-7-003:** Saved configurations MUST be accessible from the Report Builder only. Managing (renaming, deleting) saved configs is done via the same Step 3 panel — a "Manage saved configs" link opens a modal listing all saved configs with delete/rename actions.

**FR-7-004:** A user MAY have up to 20 saved configurations. Attempting to save a 21st MUST display an error notification: "You have reached the maximum of 20 saved configurations. Delete one before saving a new one."

**FR-7-005:** Saved configurations are personal — they are not visible to or shareable with other users in this phase.

### 4.8 User Preferences

**FR-7-001:** The user's items-per-page selection for the queue MUST be persisted to their server-side user profile and restored on subsequent sessions. Default: 20. Browser local storage MUST NOT be used for preference persistence. A `UserDataExportPreference` record is created on first explicit preference change; if no record exists, the default of 20 is applied silently.

---

## 5. Data Model

### New Entities

**DataExportJob** — Represents one export request.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser |
| jobName | String | Yes | User-provided or auto-generated; max 100 chars |
| jobStatus | Enum | Yes | QUEUED, GENERATING, READY, FAILED, CANCELLED, EXPIRED |
| routingType | Enum | Yes | SYNC, ASYNC |
| selectedVariables | JSON | Yes | Ordered list of variable keys |
| filterSpec | JSON | Yes | Serialized filter state (dateFrom, dateTo, labSectionIds, sampleStatuses, resultStatuses, priorities, referringSiteId) |
| estimatedRowCount | Integer | No | From pre-flight estimate; null if estimate timed out |
| actualRowCount | Integer | No | Set on successful completion |
| outputFileKey | String | No | Storage key for generated CSV; null until READY |
| outputFileSizeBytes | Long | No | Set on successful completion |
| createdAt | Timestamp | Yes | Job submission time |
| startedAt | Timestamp | No | When async generation began |
| completedAt | Timestamp | No | When generation finished (success or failure) |
| expiresAt | Timestamp | No | Set to completedAt + 7 days when status transitions to READY |
| errorMessage | String | No | Set on FAILED; max 1000 chars |
| parentJobId | Long | No | FK to DataExportJob; set when this job is a retry of a prior job |

**DataExportJobSection** — Lab sections in scope for audit trail.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| jobId | Long | Yes | FK to DataExportJob |
| labSectionId | Long | Yes | FK to existing lab section entity |

**UserDataExportPreference** — One record per user, upserted on change.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser; unique constraint |
| itemsPerPage | Integer | Yes | Default: 20 |

**DataExportSavedConfig** — A named, reusable report configuration saved by a user.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser |
| configName | String | Yes | User-provided name; max 100 chars |
| selectedVariables | JSON | Yes | Same structure as `DataExportJob.selectedVariables` |
| filterSpec | JSON | Yes | Same structure as `DataExportJob.filterSpec` — date range is excluded (never saved) |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | Updated on overwrite/rename |

**PiiAccessLog** — Immutable record created when PII variables are included in an export.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| jobId | Long | Yes | FK to DataExportJob |
| userId | Long | Yes | FK to SystemUser |
| piiTier | Enum | Yes | DEMOGRAPHICS, IDENTIFIERS |
| accessedAt | Timestamp | Yes | Server-generated at job submission; not user-editable |

### Variable Catalog

The following variable keys are valid values in the `selectedVariables` JSON array. The catalog is also returned by `GET /api/v1/reports/data-export/variables`.

**Domain: SAMPLE_ORDER**

| Variable Key | Display Name | Notes |
|---|---|---|
| accessionNumber | Accession Number | — |
| collectionDate | Collection Date | — |
| collectionTime | Collection Time | — |
| receivedDate | Received Date | — |
| receivedTime | Received Time | — |
| orderDate | Order Date | — |
| sampleType | Sample Type | — |
| sampleStatus | Sample Status | — |
| priority | Priority | Routine / Urgent / STAT |
| referringSite | Referring Site / Facility | — |
| requestingProvider | Requesting Provider | — |
| labSection | Lab Section | — |
| numberOfTests | Number of Tests Ordered | — |

**Domain: TEST_RESULTS**

| Variable Key | Display Name | Notes |
|---|---|---|
| testName | Test Name | — |
| loincCode | LOINC Code | — |
| resultValue | Result Value | — |
| resultUnit | Result Unit | — |
| referenceRange | Reference Range | — |
| resultStatus | Result Status | Preliminary / Final / Corrected |
| abnormalFlag | Abnormal Flag | H / L / Critical |
| dateResulted | Date Resulted | — |
| enteredBy | Entered By (Technician) | Display name |
| validatedBy | Validated By | Display name |
| validationDate | Validation Date | — |
| resultNotes | Result Notes / Comments | — |

**Domain: PATIENT_DEMOGRAPHICS** *(🔒 Requires `DATA_EXPORT_PII_DEMOGRAPHICS`)*

| Variable Key | Display Name | Notes |
|---|---|---|
| patientName | Patient Name | "LastName, FirstName" format |
| dateOfBirth | Date of Birth | — |
| sex | Sex / Gender | — |

**Domain: PATIENT_IDENTIFIERS** *(🔒 Requires `DATA_EXPORT_PII_IDENTIFIERS`)*

| Variable Key | Display Name | Notes |
|---|---|---|
| nationalId | National / External ID | — |
| programPatientCode | Program Patient Code | HIV, TB, etc. |
| programEnrollment | Program Enrollment | Program name |
| phoneNumber | Phone Number | — |
| address | Address | — |

**Domain: TURNAROUND_TIME**

*Note: All TAT fields are computed at export time from existing timestamps — they are not stored columns. The export query derives them via date arithmetic between existing Sample and Result timestamp fields.*

| Variable Key | Display Name | Notes |
|---|---|---|
| orderToResultMinutes | Order to Result (min) | Computed: dateResulted − orderDate |
| receivedToValidatedMinutes | Received to Validated (min) | Computed: validationDate − receivedDate |
| orderToCollectionMinutes | Order to Collection (min) | Computed: collectionDate − orderDate |
| collectionToReceivedMinutes | Collection to Received (min) | Computed: receivedDate − collectionDate |
| resultedToValidatedMinutes | Resulted to Validated (min) | Computed: validationDate − dateResulted |

**Domain: QUALITY_CONTROL**

*Note: `analyzerInstrument` is only populated for sites with analyzer integrations configured. It will be blank for manually-entered QC results.*

| Variable Key | Display Name | Notes |
|---|---|---|
| qcLotNumber | QC Lot Number | — |
| qcTestName | QC Test Name | — |
| qcResultValue | QC Result Value | — |
| qcPassFail | QC Pass / Fail | — |
| qcDate | QC Date | — |
| analyzerInstrument | Analyzer / Instrument | Blank if no analyzer integration |
| qcTechnician | QC Technician | — |

**Domain: REFERRALS**

| Variable Key | Display Name | Notes |
|---|---|---|
| referringLab | Referring Lab | — |
| referredTestName | Referred Test Name | — |
| referralDate | Referral Date | — |
| referralResultValue | Referral Result Value | — |
| referralResultDate | Referral Result Date | — |
| referralStatus | Referral Status | Pending / Received / Complete |

**Domain: NON_CONFORMANCE**

| Variable Key | Display Name | Notes |
|---|---|---|
| ncAccessionNumber | Accession Number | — |
| rejectionReason | Rejection Reason | — |
| rejectionDate | Rejection Date | — |
| rejectionStage | Rejection Stage | Pre-analytical / Analytical / Post-analytical |
| rejectedBy | Rejected By | Display name |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/reports/data-export/variables` | List available variable catalog with PII flags | `DATA_EXPORT` |
| POST | `/api/v1/reports/data-export/estimate` | Estimate row count for given filter spec | `DATA_EXPORT` |
| POST | `/api/v1/reports/data-export/jobs` | Submit new export job (sync or async) | `DATA_EXPORT` |
| GET | `/api/v1/reports/data-export/jobs` | List current user's jobs | `DATA_EXPORT` |
| GET | `/api/v1/reports/data-export/jobs/{id}` | Get single job status | `DATA_EXPORT` |
| GET | `/api/v1/reports/data-export/jobs/{id}/download` | Download completed CSV file | `DATA_EXPORT` |
| DELETE | `/api/v1/reports/data-export/jobs/{id}` | Cancel (QUEUED) or delete a job | `DATA_EXPORT` |
| GET | `/api/v1/reports/data-export/preferences` | Get current user's queue preferences | `DATA_EXPORT` |
| PUT | `/api/v1/reports/data-export/preferences` | Update current user's queue preferences | `DATA_EXPORT` |
| GET | `/api/v1/reports/data-export/saved-configs` | List current user's saved configurations | `DATA_EXPORT` |
| POST | `/api/v1/reports/data-export/saved-configs` | Save a new named configuration | `DATA_EXPORT` |
| PUT | `/api/v1/reports/data-export/saved-configs/{id}` | Rename or overwrite a saved configuration | `DATA_EXPORT` |
| DELETE | `/api/v1/reports/data-export/saved-configs/{id}` | Delete a saved configuration | `DATA_EXPORT` |

**POST `/api/v1/reports/data-export/estimate` — Request Body:**
```json
{
  "selectedVariables": ["accessionNumber", "testName", "resultValue"],
  "filterSpec": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-03-31",
    "labSectionIds": [12, 15],
    "sampleStatuses": ["VALIDATED"],
    "resultStatuses": ["FINAL"],
    "priorities": [],
    "referringSiteId": null
  }
}
```
**Response:** `{ "estimatedRows": 12450, "routedAsync": true, "estimatedWaitSeconds": 45, "timedOut": false }`

**POST `/api/v1/reports/data-export/jobs` — Request Body:**
```json
{
  "jobName": "Hematology TAT Q1 2026",
  "selectedVariables": ["accessionNumber", "testName", "resultValue"],
  "filterSpec": { "dateFrom": "2026-01-01", "dateTo": "2026-03-31", ... }
}
```
- **Sync (200):** CSV file with `Content-Disposition: attachment; filename="<jobName>.csv"`
- **Async (202):** `{ "jobId": 4821, "jobName": "Hematology TAT Q1 2026", "routedAsync": true }`

**GET `/api/v1/reports/data-export/jobs` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| status | String | Comma-separated status filter; omit for all |
| page | Integer | 0-indexed page number |
| pageSize | Integer | Items per page |

---

## 7. UI Design

See companion React mockups:
- `custom-data-export-mockup.jsx` — Production mockup using `@carbon/react` and `@carbon/icons-react`. Reference for implementation.
- `custom-data-export-preview.html` — Visual preview. Open in any browser — no build step required.

### Navigation Path

Two new menu items are added to the Reports section of the left navigation sidebar, as siblings to the existing Patient Report Print Queue and Patient Status Report entries:

- **Reports → Custom Data Export** — The 3-step report builder wizard
- **Reports → My Report Queue** — The async job queue for data exports

### Key Screens

1. **Report Builder — Step 1 (Variable Selection)** — `ProgressIndicator` at top; eight `Accordion` groups with `Checkbox` items; PII groups locked for unauthorized users with tooltip explanation
2. **Report Builder — Step 2 (Filters)** — Mandatory `DatePicker` date range; Lab Sections `MultiSelect`; optional additional filters (Sample Status, Result Status, Priority, Referring Site)
3. **Report Builder — Step 3 (Review & Submit)** — Read-only selections summary; row estimate with routing notification; export name `TextInput`; Submit button
4. **My Report Queue** — `DataTable` with status `Tag`s; Download / Cancel / Retry / Re-run actions per status; `OverflowMenu` delete; auto-polling every 15 seconds

### Interaction Patterns

- **`ProgressIndicator`** for wizard step tracking; back navigation free; forward requires validation
- **`Accordion` + `Checkbox`** with per-group "Select All" for variable selection
- **`DatePicker`** with Carbon built-in `invalidText` for date validation
- **`MultiSelect`** for lab sections (pre-scoped to user's authorized sections)
- **`InlineNotification`** for row estimate, routing preview (sync/async), and job submission feedback
- **`DataTable`** with `OverflowMenu` actions and 15-second auto-polling for queue

---

## 8. Business Rules

**BR-001:** A job is routed SYNC if `estimatedRows ≤ 5,000` AND the date range spans ≤ 7 calendar days. If either threshold is exceeded, the job is routed ASYNC. Both thresholds are admin-configurable in Admin → Site Configuration → Data Export Settings.

**BR-002:** A job MUST have at least one variable selected (enforced UI and API) and a date range applied (both Date From and Date To required). Unbounded full-table exports without a date range are not permitted.

**BR-003:** All export queries MUST be scoped to lab sections the requesting user is authorized to access, enforced server-side. If a user's API request includes unauthorized `labSectionIds`, those IDs MUST be silently excluded — no error is returned and no unauthorized data is returned.

**BR-004:** PII variable keys (`patientName`, `dateOfBirth`, `sex`, `nationalId`, `programPatientCode`, `programEnrollment`, `phoneNumber`, `address`) MUST be excluded from the CSV output if the user does not hold the corresponding `DATA_EXPORT_PII_DEMOGRAPHICS` or `DATA_EXPORT_PII_IDENTIFIERS` permission at job execution time. No error is returned — the column simply does not appear in the output. This rule is enforced server-side as defense-in-depth regardless of what the UI submitted.

**BR-005:** A sync job that exceeds 30 seconds of server-side generation MUST be automatically promoted to ASYNC status. The HTTP response transitions to 202 with the job ID. The UI MUST handle a delayed 202 gracefully by displaying a notification and linking to the queue.

**BR-006:** Completed READY jobs expire 7 days after `completedAt`. On expiry, the job transitions to EXPIRED status and the output file is purged from storage. The `DataExportJob` record and associated `PiiAccessLog` entries are retained indefinitely for audit purposes.

**BR-007:** A GENERATING job MUST NOT be cancelled. The Cancel action is only available for QUEUED jobs. The UI MUST not render the Cancel button for GENERATING rows. If a DELETE request is received for a GENERATING job, the API MUST return HTTP 409 Conflict.

**BR-008:** A `PiiAccessLog` entry MUST be created at job submission time (not at download time) for each PII tier included in the job's `selectedVariables`. If both DEMOGRAPHICS and IDENTIFIERS variables are selected, two separate log entries are created.

**BR-009:** CSV column order MUST follow the canonical order of the variable catalog (domain group order, then variable order within each group), NOT the order in which the user checked individual boxes. Column order is determined server-side and is consistent across identical `selectedVariables` sets.

**BR-010:** A maximum of 5 concurrent active jobs (QUEUED + GENERATING combined) are permitted per user at any time. Submitting a job that would exceed this limit MUST return HTTP 429 with error key `error.dataExport.jobLimitExceeded`.

**BR-011:** The "Re-run" action on an EXPIRED job pre-populates the Report Builder with the expired job's `selectedVariables` and optional filter fields (statuses, priority, site). The date range MUST NOT be pre-populated — the user must set a new date range before submitting. This prevents accidental resubmission of stale date ranges.

**BR-012:** For jobs that include variables from both the Test Results and Sample/Order domains, the export is joined at the test-result level (one output row per test result per accession). For jobs with only Sample/Order variables, the export is one row per accession. For jobs with only QC variables, the export is one row per QC lot entry.

**BR-013:** CANCELLED jobs are retained in the queue view for 24 hours after cancellation, then automatically deleted. Their `PiiAccessLog` entries (if any) are retained.

**BR-014:** Retry jobs (created via the Retry action) set `parentJobId` to the ID of the failed job, creating an auditable chain for repeated failures.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.dataExport.builderTitle` | Custom Data Export |
| `heading.dataExport.queueTitle` | My Report Queue |
| `heading.dataExport.step1` | Select Variables |
| `heading.dataExport.step2` | Set Filters |
| `heading.dataExport.step3` | Review & Submit |
| `heading.dataExport.queueTable` | Export Jobs |
| `label.dataExport.domain.sampleOrder` | Sample / Order |
| `label.dataExport.domain.testResults` | Test Results |
| `label.dataExport.domain.patientDemographics` | Patient Demographics |
| `label.dataExport.domain.patientIdentifiers` | Patient Identifiers |
| `label.dataExport.domain.turnaroundTime` | Turnaround Time |
| `label.dataExport.domain.qualityControl` | Quality Control |
| `label.dataExport.domain.referrals` | Referrals |
| `label.dataExport.domain.nonConformance` | Non-Conformance / Rejections |
| `label.dataExport.variablesSelected` | {count} variables selected |
| `label.dataExport.selectAll` | Select All |
| `label.dataExport.piiLocked` | Requires {permission} permission |
| `label.dataExport.dateFrom` | Date From |
| `label.dataExport.dateTo` | Date To |
| `label.dataExport.labSections` | Lab Sections |
| `label.dataExport.allSections` | All accessible sections |
| `label.dataExport.sampleStatus` | Sample Status |
| `label.dataExport.resultStatus` | Result Status |
| `label.dataExport.priority` | Priority |
| `label.dataExport.referringSite` | Referring Site |
| `label.dataExport.exportName` | Export Name |
| `label.dataExport.estimatedRows` | ~{count} rows estimated |
| `label.dataExport.estimatingRows` | Estimating row count... |
| `label.dataExport.jobName` | Job Name |
| `label.dataExport.domains` | Domains |
| `label.dataExport.dateRange` | Date Range |
| `label.dataExport.submittedAt` | Submitted At |
| `label.dataExport.status` | Status |
| `label.dataExport.rowsFileSize` | Rows / File Size |
| `label.dataExport.status.queued` | Queued |
| `label.dataExport.status.generating` | Generating |
| `label.dataExport.status.ready` | Ready |
| `label.dataExport.status.failed` | Failed |
| `label.dataExport.status.expired` | Expired |
| `label.dataExport.status.cancelled` | Cancelled |
| `label.dataExport.estimatedWait` | ~{minutes} min wait |
| `label.dataExport.rowsFileSummary` | {rows} rows · {size} |
| `button.dataExport.next` | Next |
| `button.dataExport.back` | Back |
| `button.dataExport.submit` | Generate Export |
| `button.dataExport.download` | Download |
| `button.dataExport.cancelJob` | Cancel Job |
| `button.dataExport.retry` | Retry |
| `button.dataExport.rerun` | Re-run |
| `button.dataExport.delete` | Delete |
| `button.dataExport.viewQueue` | View My Report Queue |
| `button.dataExport.newExport` | New Export |
| `message.dataExport.routeSync` | This report will download immediately (~{count} rows). |
| `message.dataExport.routeAsync` | This report will be queued — you will be notified when it is ready (~{count} rows, ~{wait} min). |
| `message.dataExport.submitSuccess.sync` | Your export is downloading. |
| `message.dataExport.submitSuccess.async` | Your export has been queued. You will be notified when it is ready. |
| `message.dataExport.jobReady` | Your export "{name}" is ready to download. |
| `message.dataExport.jobFailed` | Your export "{name}" failed. Please retry or adjust your filters. |
| `message.dataExport.estimateUnavailable` | Row count estimate unavailable. The export will be queued for processing. |
| `message.dataExport.cancelSuccess` | Export job cancelled. |
| `message.dataExport.deleteSuccess` | Export job deleted. |
| `message.dataExport.empty` | No export jobs found |
| `message.dataExport.emptySubtext` | You have not generated any exports yet. Use the Report Builder to create your first export. |
| `message.dataExport.cancelConfirm` | Are you sure you want to cancel this export job? This action cannot be undone. |
| `error.dataExport.noVariables` | Select at least one variable to continue. |
| `error.dataExport.noDateFrom` | Date From is required. |
| `error.dataExport.noDateTo` | Date To is required. |
| `error.dataExport.invalidDateRange` | Date To must be on or after Date From. |
| `error.dataExport.jobLimitExceeded` | You have reached the maximum of 5 active export jobs. Please wait for a job to complete before submitting a new one. |
| `error.dataExport.submitFailed` | Failed to submit export. Please try again. |
| `error.dataExport.downloadFailed` | Failed to download export. Please try again. |
| `error.dataExport.deletingGenerating` | A generating job cannot be deleted. Use Cancel Job to stop a queued job. |
| `nav.dataExport.builderMenuItem` | Custom Data Export |
| `nav.dataExport.queueMenuItem` | My Report Queue |
| `placeholder.dataExport.exportName` | e.g. Hematology TAT Q1 2026 |
| `placeholder.dataExport.referringSite` | Search referring sites... |
| `placeholder.dataExport.labSections` | Select lab sections... |
| `label.dataExport.savedConfig.loadHeading` | Load saved configuration |
| `label.dataExport.savedConfig.selectPlaceholder` | — Select a saved configuration — |
| `label.dataExport.savedConfig.saveHeading` | Save this configuration for later |
| `label.dataExport.savedConfig.saveSubtext` | Save your variable selection to quickly reload it next time. Date range is not saved. |
| `label.dataExport.savedConfig.nameLabel` | Configuration Name |
| `label.dataExport.savedConfig.namePlaceholder` | e.g. Hematology Monthly TAT |
| `button.dataExport.loadConfig` | Load |
| `button.dataExport.saveConfig` | Save Configuration |
| `button.dataExport.deleteConfig` | Delete Configuration |
| `message.dataExport.configSaveSuccess` | Configuration "{name}" saved. |
| `message.dataExport.configLoadSuccess` | Configuration "{name}" loaded. |
| `message.dataExport.configDeleteConfirm` | Are you sure you want to delete the saved configuration "{name}"? |
| `message.dataExport.configDeleteSuccess` | Configuration deleted. |
| `error.dataExport.configLimitExceeded` | You have reached the maximum of 20 saved configurations. Please delete one before saving a new configuration. |
| `error.dataExport.configNameRequired` | Configuration name is required. |
| `error.dataExport.configNameDuplicate` | A configuration with this name already exists. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| selectedVariables | Must contain at least one key | `error.dataExport.noVariables` |
| filterSpec.dateFrom | Required | `error.dataExport.noDateFrom` |
| filterSpec.dateTo | Required; must be ≥ dateFrom | `error.dataExport.noDateTo` / `error.dataExport.invalidDateRange` |
| jobName (if provided) | Max 100 characters | — |
| Active concurrent jobs | Max 5 per user (QUEUED + GENERATING) | `error.dataExport.jobLimitExceeded` |
| labSectionIds | All IDs must be in user's authorized sections | Server silently excludes unauthorized IDs |
| selectedVariables (PII keys) | Must match user's PII permission tier | Server silently excludes unauthorized keys from CSV output |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Custom Data Export page | `DATA_EXPORT` | Menu item hidden; direct URL returns HTTP 403 |
| View My Report Queue page | `DATA_EXPORT` | Menu item hidden; direct URL returns HTTP 403 |
| Submit an export job | `DATA_EXPORT` | Submit button hidden; API returns HTTP 403 |
| Download a completed export | `DATA_EXPORT` | Download button hidden; API returns HTTP 403 |
| Select Patient Demographics variables | `DATA_EXPORT_PII_DEMOGRAPHICS` | Group visible but locked; checkboxes disabled; API excludes keys silently |
| Select Patient Identifier variables | `DATA_EXPORT_PII_IDENTIFIERS` | Group visible but locked; checkboxes disabled; API excludes keys silently |

**Section scoping (enforced at API layer):** All export queries MUST be filtered to the lab sections mapped to the current user's active roles. If a user's role is modified during a session to remove section access, subsequent API calls MUST reflect the updated scoping immediately.

**PII audit logging:** All jobs that include Patient Demographics or Patient Identifier variable keys MUST create a `PiiAccessLog` entry at job submission time. The log is immutable and cannot be deleted via any API endpoint.

**Mid-session permission loss:** If `DATA_EXPORT` is removed from the user's role while they have the page open, the next API call MUST return HTTP 403. The frontend MUST redirect to the home page and display a session permission error `InlineNotification`.

---

## 12. Acceptance Criteria

### Functional

- [ ] **[FR-1-001, Section 3]** User with `DATA_EXPORT` permission can navigate to Reports → Custom Data Export; wizard loads with Step 1 active and `ProgressIndicator` showing all three steps
- [ ] **[FR-1-002, FR-1-003]** All 8 variable domain groups render in `Accordion`; each group shows its full variable list as `Checkbox` items
- [ ] **[FR-1-004]** Patient Demographics and Patient Identifiers groups are visible but locked (disabled checkboxes + lock icon + tooltip) for users without respective `DATA_EXPORT_PII_DEMOGRAPHICS` / `DATA_EXPORT_PII_IDENTIFIERS` permissions
- [ ] **[FR-1-005]** "Select All" per group toggles all variables in that group; shows indeterminate state when partially selected
- [ ] **[FR-1-006]** "Next" button disabled and tooltip shown when zero variables selected; selected count displayed in step area
- [ ] **[FR-1-007]** Navigating back from Step 2 or 3 to Step 1 preserves variable selections
- [ ] **[FR-2-001]** Date From and Date To are required; Date To field displays Carbon `invalidText` error if set before Date From; "Next" disabled while error active
- [ ] **[FR-2-002]** Lab Sections `MultiSelect` shows only user's authorized sections; single-section users see it pre-selected and read-only
- [ ] **[FR-2-004]** Result Status filter is disabled when no Test Results domain variables are selected
- [ ] **[FR-2-008]** Navigating back from Step 3 to Step 2 preserves filter selections
- [ ] **[FR-3-003]** Row estimate is fetched automatically on reaching Step 3; loading skeleton shown while pending; warning shown if estimate fails; user can still submit
- [ ] **[FR-3-004]** `InlineNotification` shows sync vs async routing based on threshold evaluation; estimated row count and wait time displayed
- [ ] **[FR-3-005, BR-001]** Sync jobs (≤5,000 rows AND ≤7 days) download immediately; async jobs return 202 and appear in queue with QUEUED status
- [ ] **[FR-3-006]** Wizard resets to Step 1 with cleared selections after successful submission
- [ ] **[FR-6-001 – FR-6-012]** My Report Queue shows all user jobs; correct status `Tag` kinds per status; Download/Cancel/Retry/Re-run actions available per status; queue auto-polls every 15 seconds while active jobs exist; polling stops when no active jobs
- [ ] **[FR-6-004]** Download does not change job status; repeat downloads permitted until expiry
- [ ] **[BR-006]** Jobs expire 7 days after completion; status transitions to EXPIRED; file no longer downloadable; Re-run option available
- [ ] **[BR-010]** Submitting a 6th concurrent active job returns HTTP 429 with `error.dataExport.jobLimitExceeded` error displayed as `InlineNotification` kind `error`
- [ ] **[BR-012]** Jobs with Test Results variables produce one row per test result per accession; jobs with only Sample/Order variables produce one row per accession
- [ ] **[BR-003, BR-004]** Server enforces section scoping and PII exclusion regardless of what the client submits; unauthorized columns not present in CSV output; no error returned

### Non-Functional

- [ ] **[Principle 1]** All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] **[FR-4-002]** Row estimate endpoint responds within 5 seconds under normal conditions
- [ ] **[Section 11]** All permissions enforced at both UI layer (hidden/disabled controls) and API layer (HTTP 403 for unauthorized requests)
- [ ] **[Principle 2]** All components use Carbon Design System from `@carbon/react`; no Bootstrap, Tailwind, or custom component libraries
- [ ] **[FR-7-001]** User preferences (items per page) persisted server-side; browser local storage not used
- [ ] **[Principle 1]** Feature verified with French and Malagasy locale files loaded — no untranslated key strings visible

### Integration

- [ ] **[OGC-70]** The `filterSpec` JSON schema and `selectedVariables` variable catalog are documented and stable — Catalyst Wizard Mode can consume these without breaking changes in a future phase
- [ ] **[Patient Report Print Queue]** My Report Queue page follows identical `DataTable` architecture, API path conventions (`/api/v1/reports/...`), server-side preference persistence pattern, and status `Tag` kind conventions as Patient Report Print Queue
- [ ] **[BR-008, Section 11]** `PiiAccessLog` entries created at job submission time for all jobs including PII variables; verified in database after test submission

### Saved Configurations

- [ ] **[FR-7-001]** Saved configurations panel appears at top of Step 1; dropdown lists all configurations belonging to the current user
- [ ] **[FR-7-002]** Selecting a saved configuration and clicking Load populates Step 1 variable selections; existing selections are replaced; confirmation `InlineNotification` (kind="success") shown
- [ ] **[FR-7-003]** Save Configuration panel appears at bottom of Step 3 (Review & Submit); user can enter a name and save before or after submitting
- [ ] **[FR-7-004]** Saving a configuration with a duplicate name for the same user displays `invalidText` error (`error.dataExport.configNameDuplicate`); existing configuration is not overwritten
- [ ] **[FR-7-005]** Saved configurations are stored server-side in `DataExportSavedConfig`; date range is NOT persisted in saved configuration (only `selectedVariables` and non-date `filterSpec` fields)
- [ ] **[FR-7-005]** Saved configurations are visible across sessions (persist beyond browser close/reopen)
- [ ] **[FR-7-004]** Saving a 21st configuration returns `error.dataExport.configLimitExceeded` notification; user must delete one before saving a new one
