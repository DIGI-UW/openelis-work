# Custom Data Export & My Report Queue
## Functional Requirements Specification — v1.1

**Version:** 1.1
**Date:** 2026-07-15
**Status:** Draft for Review
**Jira Stories:**
- [OGC-479](https://uwdigi.atlassian.net/browse/OGC-479) — Custom Data Export: 3-step report builder wizard
- [OGC-481](https://uwdigi.atlassian.net/browse/OGC-481) — My Report Queue: Async job queue
- [OGC-483](https://uwdigi.atlassian.net/browse/OGC-483) — Saved Export Configurations
**Parent Epic:** [OGC-70](https://uwdigi.atlassian.net/browse/OGC-70) — Catalyst LLM-Powered Lab Data Assistant
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Report Print Queue, Catalyst (OGC-70), Reports, User Preferences, Printed Reports Configuration

> **Companion release requirement:** OGC-479 and OGC-481 MUST ship in the same release. The primary use cases (TAT monitoring, quarterly extracts) exceed the sync thresholds by definition and are only retrievable via the queue. Async job submission MUST NOT be enabled in a build that does not include the My Report Queue page.

### Changelog — v1.0 → v1.1

| # | Change | Sections |
|---|---|---|
| 1 | **Grain families introduced.** Variable domains are grouped into three mutually exclusive grain families (Sample & Testing, Referrals, Non-Conformance). An export draws from exactly one family; the wizard locks the others once a selection is made. Replaces the v1.0 free-mix model and BR-012's partial join rules. | 4.1, 5, 8 (BR-012, BR-015), 10, 12 |
| 2 | **Quality Control domain removed.** OpenELIS Global has no structured QC data model to back it. Deferred to a follow-up story dependent on a QC data model. | 4.1, 5, 9 |
| 3 | **Selections show labels, never just a count** (Constitution II amendment, 2026-07-09). Step 1 shows selected variables as dismissible tags; all MultiSelects render selected values as tags. | 4.1, 4.2, 12 |
| 4 | **Duplicate saved-config name = confirm & overwrite** (resolves v1.0 FR/AC contradiction in favor of FR-7-002). | 4.7, 9, 12 |
| 5 | **Thresholds live in the existing General Configuration → Printed Reports Configuration admin page.** No new admin page. All limits (sync row/date thresholds, max date range, active job limit, saved-config limit, retention days) are named configuration properties. | 4.5, 8 |
| 6 | **Maximum date range cap added** (default 90 days, configurable) — was previously only a risk-mitigation note on OGC-479. | 4.2, 8 (BR-002), 10 |
| 7 | **Data model aligned to OpenELIS conventions**: entities extend `BaseObject<String>` (String IDs), Liquibase changesets required, explicit non-FHIR justification, `grainFamily` column added to `DataExportJob`. | 5 |
| 8 | **Derived/sourced variables annotated**: `resultValue` type resolution, `referenceRange`/`abnormalFlag` computed from ResultLimit, program fields sourced from ObservationHistory, `loincCode` sparse. Status filter values mapped to real StatusService statuses. | 4.2, 5 |
| 9 | **API paths aligned to `/rest/` controller convention** (Constitution IV); ownership rule made explicit (BR-016); CSV format defined (BR-017); async worker & restart recovery defined (BR-018); notification mechanism specified (FR-6-012). | 6, 8, 11 |
| 10 | **Section 4.8 FR IDs renumbered** (FR-8-00x) to fix collision with Saved Configurations. Testing Requirements section added (Constitution V). | 4.8, 13 |
| 11 | **Family color coding & wayfinding helpers.** Each grain family has an assigned color used consistently across group headers, card edge-stripes, the selection summary, and a new Step 1 legend — so users can see which variables travel together *before* selecting anything. Once locked, a persistent helper banner names the active family and offers "Clear all selections" to switch. | 4.1 (FR-1-008, FR-1-009), 7, 9 |

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
13. Testing Requirements

---

## 1. Executive Summary

The Custom Data Export feature gives authorized laboratory staff a self-service tool to extract structured CSV data from OpenELIS Global without requiring LLM configuration or DBA intervention. Users select from a curated catalog of variables within one of three **grain families** — Sample & Testing, Referrals, or Non-Conformance — apply date range and lab section filters, and receive an estimated row count before submission. Small reports download immediately; large reports are processed asynchronously via a personal report queue with download notification. This feature is the no-LLM foundational layer that Catalyst's Wizard Mode (OGC-70) will build upon in a later phase, sharing the same `filterSpec` schema, `selectedVariables` catalog, and queue infrastructure.

**Out of scope (v1.1):** A Quality Control export domain was removed from this specification because OpenELIS Global does not currently have a structured QC data model to back it. It will be specified in a follow-up story once a QC data model exists.

---

## 2. Problem Statement

**Current state:** Generating custom data extracts from OpenELIS Global requires either running preconfigured Jasper reports (which cover a limited set of fixed queries), writing ad hoc SQL, or requesting data from a system administrator. No self-service mechanism exists for variable-composition data export.

**Impact:** Lab managers, QA officers, and program case managers cannot independently generate the operational reports they need for accreditation submissions, TAT monitoring, QC reviews, or program follow-up. This creates bottlenecks and reliance on technical staff for routine data needs. Users with data needs outside the fixed Jasper report set have no recourse.

**Proposed solution:** A structured 3-step report builder wizard in the Reports section allows users to select variables from predefined groups within a single grain family, apply date and section filters, preview estimated row counts, and receive their data as a CSV file — either immediately for small requests or via an async queue for larger ones. RBAC ensures users only export data from lab sections they are authorized to access, and PII fields require explicit two-tier additional permissions.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | Build & download personal exports | Scoped to assigned lab sections; no PII by default |
| Lab Manager | Build & download personal exports | Scoped to assigned sections; may hold PII permissions |
| QA Officer | Build & download personal exports | Scoped to assigned sections |
| Case Manager | Build & download personal exports | May hold PII permissions. *Note: program-level scoping (beyond lab section scoping) is NOT enforced in this phase — Case Managers are scoped by lab section like all other roles.* |
| System Administrator | Full | Access to all sections; may hold PII permissions |

**Required permission keys:**

- `DATA_EXPORT` — Required to access the Custom Data Export page and My Report Queue, submit jobs, and download results. All other export permissions are additive to this base key.
- `DATA_EXPORT_PII_DEMOGRAPHICS` — Required to include patient demographics (name, DOB, sex) in an export. Without this key, the Demographics variable group is visible but locked with a lock icon.
- `DATA_EXPORT_PII_IDENTIFIERS` — Required to include strong patient identifiers (national ID, program codes, phone, address) in an export. Without this key, the Identifiers variable group is visible but locked.

**Permission seeding (Liquibase):** The three permission keys are added to the role-module tree via Liquibase changeset. On migration, `DATA_EXPORT` is granted to roles that currently hold access to the Reports menu; the two PII keys are granted to **no roles by default** — administrators grant them explicitly. The changeset MUST include a rollback.

---

## 4. Functional Requirements

### 4.1 Report Builder — Step 1: Variable Selection

**FR-1-001:** The report builder MUST be a 3-step wizard rendered with a Carbon `ProgressIndicator` showing three steps: (1) Select Variables, (2) Set Filters, (3) Review & Submit. Users may navigate backwards freely at any time; forward navigation from Step 1 to Step 2 requires at least one variable selected.

**FR-1-002:** Step 1 MUST present variables organized into seven domain groups, each rendered as a Carbon `Accordion` item with the domain name as the header. Domain groups belong to one of three **grain families**:

| Grain Family | Domain Groups | Output Row Grain |
|---|---|---|
| **SAMPLE_TESTING** | Sample / Order; Test Results; Patient Demographics *(🔒 `DATA_EXPORT_PII_DEMOGRAPHICS`)*; Patient Identifiers *(🔒 `DATA_EXPORT_PII_IDENTIFIERS`)*; Turnaround Time | One row per test result per accession when Test Results or Turnaround Time variables are selected; otherwise one row per accession |
| **REFERRAL** | Referrals | One row per referred analysis |
| **NON_CONFORMANCE** | Non-Conformance / Rejections | One row per non-conforming event |

All domain groups MUST be **expanded by default** when Step 1 loads, so the full variable catalog is visible before the user commits to a family. Groups belonging to locked families collapse while locked (FR-1-008).

Each grain family has an assigned color from the Carbon `Tag` palette, applied consistently wherever the family is referenced (group header chips, card edge-stripes, legend, selection summary, Step 3 review): SAMPLE_TESTING = `blue`, REFERRAL = `teal`, NON_CONFORMANCE = `magenta`. Every domain group header MUST display its family as a colored chip **at all times** — including before any selection — so users can see which groups travel together before committing to one.

**FR-1-003:** Each domain group MUST display its full variable list as individual `Checkbox` items showing **only the variable's display name** — no technical annotations (e.g., "computed", "from ObservationHistory", "blank when unmapped") appear in the UI. Derivation and sourcing details are implementation notes in this spec (Section 5), not user-facing content. The complete variable catalog is defined in Section 5.

**FR-1-004:** PII-gated groups (Patient Demographics, Patient Identifiers) MUST display a single **"PII"** `Tag` in the group header (both groups use the same tag — the tier distinction is a permissions concept, not user-facing labeling) with a tooltip: "Contains patient-identifying data — requires additional permission; exports including these fields are audited." For users without the corresponding permission key, the group additionally shows a lock icon and disabled (greyed) `Checkbox` items, with a tooltip stating which permission is required (e.g., "Requires Data Export PII Demographics permission"). The groups MUST remain visible — not hidden — so users understand what data exists and can request the appropriate permissions.

**FR-1-005:** A "Select All" checkbox MUST appear at the top of each domain group's variable list. Checking it selects all variables in that group; unchecking it clears all. "Select All" MUST be indeterminate when some but not all variables are selected.

**FR-1-006:** A selection summary MUST be displayed in the step header area showing **both** a running count (e.g., "12 variables selected") **and** the selected variables' display names as dismissible Carbon `Tag` components (clicking a tag's close icon deselects that variable). Per Constitution Principle II ("Selections show their labels, never just a count"), the count MUST NOT appear without the labels. The "Next" button to proceed to Step 2 MUST be disabled and display a tooltip ("Select at least one variable to continue") when zero variables are selected.

**FR-1-007:** Variable selection state MUST persist when the user navigates backwards to Step 1 from Steps 2 or 3. Navigating back does not reset selections.

**FR-1-008 (Grain family locking):** Selecting the first variable MUST lock the wizard to that variable's grain family. Domain groups belonging to other grain families MUST become disabled (greyed accordion headers with a tooltip: "Not available with {family} variables — an export draws from one data family at a time"). While locked, a persistent `InlineNotification` (kind `info`) MUST be displayed above the variable groups naming the active family ("You're building a {family} export. The other families are locked — clear your selections to switch.") with an inline **"Clear all selections"** ghost button that deselects everything and unlocks all families. Deselecting all variables (by any means) MUST unlock all families. The active family MUST be indicated in the selection summary area with its colored family chip.

**FR-1-009 (Family legend):** Step 1 MUST display a legend above the domain groups listing the three grain families, each with: its colored family chip, a one-line plain-language description, and its output row grain (e.g., "Sample & Testing — orders, results, patients & turnaround times · one row per test result"). When a family is locked in, its legend entry MUST be visually highlighted and the other entries dimmed, keeping the legend in sync with the accordion state. The legend teaches the one-family rule *before* the user encounters the lock.

### 4.2 Report Builder — Step 2: Filters

**FR-2-001:** Step 2 MUST include a mandatory date range filter using two `DatePickerInput` fields: "Date From" and "Date To". Both fields are required. The date anchor depends on the export's grain family:
- **SAMPLE_TESTING** — sample collection date
- **REFERRAL** — referral sent date
- **NON_CONFORMANCE** — rejection/NCE date

**FR-2-002:** Step 2 MUST include a Lab Section `MultiSelect` populated with the lab sections the current user has access to. If the user has access to exactly one section, it MUST be pre-selected and the control MUST be read-only. If the user has access to multiple sections, no sections are pre-selected by default (selecting none is equivalent to selecting all accessible sections).

**FR-2-003:** Step 2 MUST include an optional Sample Status `MultiSelect` filter (SAMPLE_TESTING family only; hidden for other families). Displayed values map to OpenELIS `StatusService` sample statuses:

| Display Value | StatusService Mapping *(dev-verify exact enum)* |
|---|---|
| Received | `SampleStatus.Entered` |
| In Progress | `SampleStatus.Started` |
| Completed | `SampleStatus.Finished` |
| Cancelled | `SampleStatus.Canceled` |

> *v1.0 listed "Resulted" and "Validated" as sample statuses; these are analysis-level states in OpenELIS and have been removed from this filter.*

**FR-2-004:** Step 2 MUST include an optional Result Status `MultiSelect` filter, disabled (greyed with tooltip) when no variables from the Test Results domain are selected. Displayed values map to OpenELIS `StatusService` analysis statuses:

| Display Value | StatusService Mapping *(dev-verify exact enum)* |
|---|---|
| Preliminary (technically accepted) | `AnalysisStatus.TechnicalAcceptance` |
| Validated (finalized) | `AnalysisStatus.Finalized` |
| Corrected | Correction state per existing correction workflow |

**FR-2-005:** Step 2 MUST include an optional Priority `MultiSelect` filter with values: Routine, Urgent, STAT.

**FR-2-006:** Step 2 MUST include an optional Referring Site `ComboBox` with search, allowing users to filter by a single referring facility.

**FR-2-007:** The "Date To" MUST NOT be earlier than "Date From". If the user selects an invalid range, the Date To field MUST display Carbon's built-in `invalidText` validation error: "Date To must be on or after Date From." The "Next" button to Step 3 MUST be disabled while this error is active.

**FR-2-008:** Filter state MUST persist when the user navigates backwards from Step 3 to Step 2. Navigating back does not reset filter selections.

**FR-2-009 (Labels, not counts):** All `MultiSelect` filters MUST render their selected values as visible dismissible tags (Carbon `FilterableMultiSelect` selected-item tags or an adjacent tag row) — never a bare count. Per Constitution Principle II, a count MAY appear alongside the labels, never instead of them.

**FR-2-010 (Maximum date range):** The date range MUST NOT exceed the configured maximum (`dataExport.maxDateRangeDays`, default 90). If exceeded, the Date To field MUST display `invalidText`: "Date range cannot exceed {max} days." The "Next" button MUST be disabled while this error is active. The limit is also enforced server-side (Section 10).

### 4.3 Report Builder — Step 3: Review & Submit

**FR-3-001:** Step 3 MUST display a read-only summary panel showing: (a) the grain family and the selected variables' display names grouped by domain (full labels, with count shown alongside), (b) applied date range, (c) selected lab sections by name (or "All accessible sections" if none specified), and (d) any optional filters applied, showing selected values by name.

**FR-3-002:** Step 3 MUST include a `TextInput` for the export name. This field is optional. If left blank on submission, the system MUST auto-generate a name using the format `[Domains]_[DateFrom]_to_[DateTo]` (e.g., `Test_Results_2026-01-01_to_2026-03-31`). Maximum 100 characters.

**FR-3-003:** Step 3 MUST automatically fetch a row count estimate via `POST /rest/reports/data-export/estimate` when the user arrives at Step 3 (not on button click). A skeleton/loading state MUST be shown while the estimate is pending. If estimation fails or times out, an `InlineNotification` with kind `warning` MUST be displayed: "Row count estimate unavailable. The export will be queued for processing." The user can still submit.

**FR-3-004:** Based on the estimate response:
- If `routedAsync: false` → display `InlineNotification` kind `info`: "This report will download immediately (~{count} rows)."
- If `routedAsync: true` → display `InlineNotification` kind `info`: "This report will be queued — you will be notified when it is ready (~{count} rows, ~{wait} min)."

**FR-3-005:** Clicking "Generate Export" triggers `POST /rest/reports/data-export/jobs`. On success:
- Sync (200): Browser initiates file download immediately; `InlineNotification` kind `success` confirms: "Your export is downloading."
- Async (202): `InlineNotification` kind `success` confirms queuing and includes a "View My Report Queue" link.

**FR-3-006:** After successful submission (sync or async), the wizard MUST reset to Step 1 with all variable selections and filters cleared, allowing the user to build a new export.

### 4.4 Row Estimation

**FR-4-001:** The `/rest/reports/data-export/estimate` endpoint MUST execute a `COUNT(*)` query using the same filter predicates as the full export, but without materializing result rows. Response schema:
```json
{ "estimatedRows": 12450, "routedAsync": true, "estimatedWaitSeconds": 45 }
```

**FR-4-002:** The estimate MUST complete within 5 seconds. If the query exceeds 5 seconds, the endpoint MUST return a timeout response (HTTP 200 with `{ "estimatedRows": null, "timedOut": true, "routedAsync": true }`). The UI MUST display a warning that the estimate is unavailable and assume the export will be queued.

**FR-4-003:** The row estimate displayed to the user MUST be prefixed with a tilde to indicate approximation (e.g., "~12,450 rows estimated"). It MUST NOT be presented as exact.

**FR-4-004 (Query strategy):** Export and estimate queries MUST be composed via HQL or the JPA Criteria API — native SQL is prohibited (Constitution IV). If join performance across the Sample→SampleItem→Analysis→Result chain proves inadequate, a read-optimized database view MAY be introduced **via Liquibase changeset** and mapped as a read-only entity; this decision and its rationale MUST be documented in the implementation PR.

### 4.5 Sync vs Async Routing

**FR-5-001:** If `estimatedRows ≤ dataExport.syncRowLimit` (default 5,000) AND the date range span is ≤ `dataExport.syncDateRangeDays` (default 7 calendar days), the job MUST be routed synchronously. The CSV is generated within the HTTP request/response and returned as a file download with `Content-Disposition: attachment`.

**FR-5-002:** If either threshold is exceeded, the job MUST be routed asynchronously. `POST /rest/reports/data-export/jobs` returns HTTP 202 with the job ID. The job enters the async processing queue.

**FR-5-003:** If a sync job exceeds 30 seconds of server-side generation time, it MUST be automatically promoted to async. The HTTP response transitions to 202 with the job ID. The frontend MUST handle a delayed 202 response gracefully by redirecting to the queue view with an explanatory notification.

**FR-5-004 (Configuration):** All data export limits MUST be exposed as named configuration properties in the existing **Admin → General Configuration → Printed Reports Configuration** page (new "Data Export" property group — no new admin page):

| Property | Default | Description |
|---|---|---|
| `dataExport.syncRowLimit` | 5000 | Max estimated rows for sync routing |
| `dataExport.syncDateRangeDays` | 7 | Max date range (days) for sync routing |
| `dataExport.maxDateRangeDays` | 90 | Hard cap on export date range |
| `dataExport.maxActiveJobs` | 5 | Max concurrent QUEUED+GENERATING jobs per user |
| `dataExport.maxSavedConfigs` | 20 | Max saved configurations per user |
| `dataExport.jobRetentionDays` | 7 | Days a READY file is retained before expiry |

All user-facing messages referencing these limits MUST interpolate the configured value — no hardcoded limit numbers in i18n strings.

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

**FR-6-004:** READY jobs MUST display a primary "Download" button. Clicking it triggers a file download via `GET /rest/reports/data-export/jobs/{id}/download`. Downloading does NOT change job status — repeat downloads are permitted until expiry.

**FR-6-005:** QUEUED jobs MUST display a ghost "Cancel Job" button. Confirming cancellation transitions the job to CANCELLED and removes it from the processing queue. A destructive confirmation `Modal` MUST be shown before cancellation executes.

**FR-6-006:** FAILED jobs MUST display a secondary "Retry" button. Clicking Retry re-submits an identical job (new job record, same `selectedVariables` and `filterSpec`) and routes it through the standard sync/async evaluation. The original failed job remains in the queue.

**FR-6-007:** EXPIRED jobs MUST display a ghost "Re-run" button. Clicking Re-run navigates the user to the Report Builder with all variable selections and optional filters pre-populated from the expired job's parameters. The date range is NOT pre-populated — the user must set a new date range before submitting.

**FR-6-008:** READY and EXPIRED jobs MUST display the row count and file size (e.g., "4,312 rows · 847 KB") in the Rows / File Size column.

**FR-6-009:** QUEUED jobs MUST display an estimated wait time (e.g., "~2 min") in the Rows / File Size column. The estimate is computed as queue position × rolling average generation time of the last 20 completed jobs (see BR-018).

**FR-6-010:** Any job in any status EXCEPT GENERATING may be deleted from the queue. A ghost "Delete" action MUST be available via an `OverflowMenu` per row. Deleting a READY job purges both the record and the output file from storage. Attempting to delete a GENERATING job MUST show an error notification.

**FR-6-011:** The queue page MUST automatically poll `GET /rest/reports/data-export/jobs` every 15 seconds while any job is in QUEUED or GENERATING status. Polling MUST stop when no active jobs exist. The DataTable MUST update in place without a full page reload.

**FR-6-012 (Cross-page notification):** When an async job transitions to READY or FAILED, an in-app notification (banner) MUST be displayed, even if the user has navigated to a different page. **Mechanism:** an app-shell-level notification context polls `GET /rest/reports/data-export/jobs?status=QUEUED,GENERATING` every 30 seconds while the user has known active jobs (tracked in app state after a submission or a queue page visit); on a transition to READY or FAILED, the banner is shown. Polling stops when no active jobs remain. WebSockets/push are out of scope for this phase. The notification for READY jobs MUST include a direct download link.

### 4.7 Saved Report Configurations

**FR-7-001:** At the top of Step 1 (Variable Selection), the wizard MUST display a "Load saved configuration" `ComboBox`. The dropdown lists the current user's saved configurations by name, sorted most-recently-used first. Selecting a configuration and clicking "Load" pre-populates variable selections (and locks the grain family accordingly, per FR-1-008) and all non-date filter fields. The date range is never saved or pre-populated — the user must always set the date range fresh.

**FR-7-002:** On Step 3 (Review & Submit), the wizard MUST display a "Save this configuration" section with a `TextInput` for the configuration name and a "Save" button. Clicking Save creates a `DataExportSavedConfig` record. If a config with the same name already exists for the user, a confirmation `Modal` MUST ask whether to overwrite it ("A configuration named '{name}' already exists. Overwrite it?"). Confirming updates the existing record in place (same ID, `updatedAt` refreshed); cancelling makes no change. *(Resolves the v1.0 contradiction between FR-7-002 and the acceptance criteria, in favor of overwrite-with-confirmation.)*

**FR-7-003:** Saved configurations MUST be accessible from the Report Builder only. Managing (renaming, deleting) saved configs is done via the same Step 3 panel — a "Manage saved configs" link opens a modal listing all saved configs with delete/rename actions.

**FR-7-004:** A user MAY have up to `dataExport.maxSavedConfigs` (default 20) saved configurations. Attempting to exceed the limit MUST display an error notification: "You have reached the maximum of {max} saved configurations. Delete one before saving a new one."

**FR-7-005:** Saved configurations are personal — they are not visible to or shareable with other users in this phase.

**FR-7-006 (Stale key handling):** On load, the server MUST validate saved variable keys against the current catalog; unknown keys are silently excluded from the loaded selection and the UI shows a warning notification listing the dropped variables.

### 4.8 User Preferences

**FR-8-001:** The user's items-per-page selection for the queue MUST be persisted to their server-side user profile and restored on subsequent sessions. Default: 20. Browser local storage MUST NOT be used for preference persistence. A `UserDataExportPreference` record is created on first explicit preference change; if no record exists, the default of 20 is applied silently. *(Renumbered from FR-7-001 in v1.0 to fix the ID collision with Saved Report Configurations.)*

---

## 5. Data Model

### Conventions (Constitution IV & VI)

- All new entities extend `BaseObject<String>` — **IDs are String** (numeric, sequence-generated via `@GenericGenerator`), with inherited `sys_user_id` and `lastupdated`. The v1.0 `Long` ID types were incorrect.
- All schema changes ship as **Liquibase changesets** with rollback scripts; no direct DDL.
- **No FHIR exposure (Principle III justification):** these entities are internal reporting infrastructure — job bookkeeping, preferences, and audit records. They carry no clinical data themselves and are not exchanged with external systems, so no `fhir_uuid` column or FHIR transform is required. The *exported data* originates from FHIR-mapped clinical entities, but the export artifact is a flat CSV outside FHIR scope.
- JPA annotations only — no `.hbm.xml` mappings.

### New Entities

**DataExportJob** — Represents one export request.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | Yes | Primary key (sequence) |
| userId | String | Yes | FK to SystemUser |
| jobName | String | Yes | User-provided or auto-generated; max 100 chars |
| jobStatus | Enum | Yes | QUEUED, GENERATING, READY, FAILED, CANCELLED, EXPIRED |
| routingType | Enum | Yes | SYNC, ASYNC |
| grainFamily | Enum | Yes | SAMPLE_TESTING, REFERRAL, NON_CONFORMANCE |
| selectedVariables | JSON | Yes | Ordered list of variable keys; all keys MUST belong to `grainFamily` (BR-015) |
| filterSpec | JSON | Yes | Serialized filter state (dateFrom, dateTo, labSectionIds, sampleStatuses, resultStatuses, priorities, referringSiteId) |
| estimatedRowCount | Integer | No | From pre-flight estimate; null if estimate timed out |
| actualRowCount | Integer | No | Set on successful completion |
| outputFileKey | String | No | Storage key for generated CSV; null until READY. Files stored on the server filesystem under a configured export directory (`dataExport.storagePath`); object storage out of scope this phase |
| outputFileSizeBytes | Long | No | Set on successful completion |
| createdAt | Timestamp | Yes | Job submission time |
| startedAt | Timestamp | No | When async generation began |
| completedAt | Timestamp | No | When generation finished (success or failure) |
| expiresAt | Timestamp | No | Set to completedAt + `dataExport.jobRetentionDays` when status transitions to READY |
| errorMessage | String | No | Set on FAILED; max 1000 chars |
| parentJobId | String | No | FK to DataExportJob; set when this job is a retry of a prior job |

**DataExportJobSection** — Lab sections in scope for audit trail.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | Yes | Primary key |
| jobId | String | Yes | FK to DataExportJob |
| labSectionId | String | Yes | FK to existing test section entity |

**UserDataExportPreference** — One record per user, upserted on change.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | Yes | Primary key |
| userId | String | Yes | FK to SystemUser; unique constraint |
| itemsPerPage | Integer | Yes | Default: 20 |

**DataExportSavedConfig** — A named, reusable report configuration saved by a user.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | Yes | Primary key |
| userId | String | Yes | FK to SystemUser |
| configName | String | Yes | User-provided name; max 100 chars; unique per user (overwrite-with-confirmation updates in place) |
| grainFamily | Enum | Yes | SAMPLE_TESTING, REFERRAL, NON_CONFORMANCE |
| selectedVariables | JSON | Yes | Same structure as `DataExportJob.selectedVariables` |
| filterSpec | JSON | Yes | Same structure as `DataExportJob.filterSpec` — date range is excluded (never saved) |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | Updated on overwrite/rename |

**PiiAccessLog** — Immutable record created when PII variables are included in an export.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | Yes | Primary key |
| jobId | String | Yes | FK to DataExportJob |
| userId | String | Yes | FK to SystemUser |
| piiTier | Enum | Yes | DEMOGRAPHICS, IDENTIFIERS |
| accessedAt | Timestamp | Yes | Server-generated at job submission; not user-editable |

### Variable Catalog

The following variable keys are valid values in the `selectedVariables` JSON array. The catalog is also returned by `GET /rest/reports/data-export/variables` (each entry includes its domain, grain family, PII tier, and a `derived` flag). Variables marked **[derived]** are computed at export time, not read from stored columns; variables marked **[sourced]** require resolution from a non-obvious source table — both carry implementation notes below their table.

#### Grain Family: SAMPLE_TESTING

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
| sampleStatus | Sample Status | Mapped via StatusService (see FR-2-003) |
| priority | Priority | Routine / Urgent / STAT |
| referringSite | Referring Site / Facility | — |
| requestingProvider | Requesting Provider | — |
| labSection | Lab Section | — |
| numberOfTests | Number of Tests Ordered | **[derived]** count of analyses on the sample |

**Domain: TEST_RESULTS**

| Variable Key | Display Name | Notes |
|---|---|---|
| testName | Test Name | — |
| loincCode | LOINC Code | Nullable — LOINC coverage is sparse in most installations; blank when unmapped |
| resultValue | Result Value | **[derived]** type-aware resolution, see note |
| resultUnit | Result Unit | — |
| referenceRange | Reference Range | **[derived]** from ResultLimit by patient age/sex at test time, see note |
| resultStatus | Result Status | Mapped via StatusService (see FR-2-004) |
| abnormalFlag | Abnormal Flag | **[derived]** result vs. ResultLimit bounds (H / L / Critical), see note |
| dateResulted | Date Resulted | — |
| enteredBy | Entered By (Technician) | Display name |
| validatedBy | Validated By | Display name |
| validationDate | Validation Date | — |
| resultNotes | Result Notes / Comments | — |

> **`resultValue` resolution rule:** Result is type-polymorphic. Dictionary results MUST be resolved to their dictionary display text (not the stored ID); multiselect dictionary results MUST be joined into one cell with `; ` separators; numeric results MUST apply the test's significant-digit rules; free-text results are exported verbatim. One output cell per result row in all cases.
>
> **`referenceRange` / `abnormalFlag` computation:** neither is a stored Result column. Both MUST be computed from the applicable `ResultLimit` for the patient's age and sex **at the time of the test**, matching the logic used by results entry/validation screens. `abnormalFlag` values: `H`, `L`, `Critical`, blank.

**Domain: PATIENT_DEMOGRAPHICS** *(🔒 Requires `DATA_EXPORT_PII_DEMOGRAPHICS`)*

| Variable Key | Display Name | Notes |
|---|---|---|
| patientName | Patient Name | "LastName, FirstName" format; sourced from Person |
| dateOfBirth | Date of Birth | — |
| sex | Sex / Gender | — |

**Domain: PATIENT_IDENTIFIERS** *(🔒 Requires `DATA_EXPORT_PII_IDENTIFIERS`)*

| Variable Key | Display Name | Notes |
|---|---|---|
| nationalId | National / External ID | **[sourced]** PatientIdentity by identity type |
| programPatientCode | Program Patient Code | **[sourced]** ObservationHistory by observation type (HIV, TB, etc.), see note |
| programEnrollment | Program Enrollment | **[sourced]** ObservationHistory by observation type, see note |
| phoneNumber | Phone Number | Sourced from Person |
| address | Address | Sourced from Person/address parts |

> **Program fields:** `programPatientCode` and `programEnrollment` are not columns — they are `ObservationHistory` records keyed by `ObservationHistoryType`. The implementation MUST resolve them by type name and handle absence (blank cell). Dev-verify the exact type names used by the target installations.

**Domain: TURNAROUND_TIME**

*All TAT fields are **[derived]** at export time from existing timestamps via date arithmetic — they are not stored columns. TAT variables force the one-row-per-test-result grain.*

| Variable Key | Display Name | Notes |
|---|---|---|
| orderToResultMinutes | Order to Result (min) | Computed: dateResulted − orderDate |
| receivedToValidatedMinutes | Received to Validated (min) | Computed: validationDate − receivedDate |
| orderToCollectionMinutes | Order to Collection (min) | Computed: collectionDate − orderDate |
| collectionToReceivedMinutes | Collection to Received (min) | Computed: receivedDate − collectionDate |
| resultedToValidatedMinutes | Resulted to Validated (min) | Computed: validationDate − dateResulted |

#### Grain Family: REFERRAL

**Domain: REFERRALS**

| Variable Key | Display Name | Notes |
|---|---|---|
| referralAccessionNumber | Accession Number | — |
| referringLab | Referring Lab | — |
| referredTestName | Referred Test Name | — |
| referralDate | Referral Date | Date anchor for this family |
| referralResultValue | Referral Result Value | — |
| referralResultDate | Referral Result Date | — |
| referralStatus | Referral Status | Pending / Received / Complete |

#### Grain Family: NON_CONFORMANCE

**Domain: NON_CONFORMANCE**

| Variable Key | Display Name | Notes |
|---|---|---|
| ncAccessionNumber | Accession Number | — |
| rejectionReason | Rejection Reason | — |
| rejectionDate | Rejection Date | Date anchor for this family |
| rejectionStage | Rejection Stage | Pre-analytical / Analytical / Post-analytical |
| rejectedBy | Rejected By | Display name |

> **Removed in v1.1:** the QUALITY_CONTROL domain (qcLotNumber, qcTestName, qcResultValue, qcPassFail, qcDate, analyzerInstrument, qcTechnician). OpenELIS Global has no structured QC entity model to back these variables. A follow-up story will reintroduce a QC grain family when a QC data model exists.

---

## 6. API Endpoints

> **Path convention:** endpoints use the `/rest/` controller prefix per Constitution IV (`@RequestMapping("/rest/{module}")`) and MUST match the convention used by the existing Patient Report Print Queue controllers. *(v1.0 specified `/api/v1/…`, which does not match the codebase convention — dev to confirm final prefix against the Print Queue implementation before coding.)*

All endpoints are **scoped to the authenticated user** (BR-016): job and saved-config resources belonging to another user return HTTP 404.

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/rest/reports/data-export/variables` | List variable catalog with domain, grain family, PII and derived flags | `DATA_EXPORT` |
| POST | `/rest/reports/data-export/estimate` | Estimate row count for given filter spec | `DATA_EXPORT` |
| POST | `/rest/reports/data-export/jobs` | Submit new export job (sync or async) | `DATA_EXPORT` |
| GET | `/rest/reports/data-export/jobs` | List current user's jobs | `DATA_EXPORT` |
| GET | `/rest/reports/data-export/jobs/{id}` | Get single job status (owner only) | `DATA_EXPORT` |
| GET | `/rest/reports/data-export/jobs/{id}/download` | Download completed CSV file (owner only) | `DATA_EXPORT` |
| DELETE | `/rest/reports/data-export/jobs/{id}` | Cancel (QUEUED) or delete a job (owner only) | `DATA_EXPORT` |
| GET | `/rest/reports/data-export/preferences` | Get current user's queue preferences | `DATA_EXPORT` |
| PUT | `/rest/reports/data-export/preferences` | Update current user's queue preferences | `DATA_EXPORT` |
| GET | `/rest/reports/data-export/saved-configs` | List current user's saved configurations | `DATA_EXPORT` |
| POST | `/rest/reports/data-export/saved-configs` | Save a new named configuration | `DATA_EXPORT` |
| PUT | `/rest/reports/data-export/saved-configs/{id}` | Rename or overwrite a saved configuration (owner only) | `DATA_EXPORT` |
| DELETE | `/rest/reports/data-export/saved-configs/{id}` | Delete a saved configuration (owner only) | `DATA_EXPORT` |

**POST `/rest/reports/data-export/estimate` — Request Body:**
```json
{
  "selectedVariables": ["accessionNumber", "testName", "resultValue"],
  "filterSpec": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-03-31",
    "labSectionIds": ["12", "15"],
    "sampleStatuses": ["FINISHED"],
    "resultStatuses": ["FINALIZED"],
    "priorities": [],
    "referringSiteId": null
  }
}
```
**Response:** `{ "estimatedRows": 12450, "routedAsync": true, "estimatedWaitSeconds": 45, "timedOut": false }`

*The grain family is derived server-side from `selectedVariables`; a request mixing families is rejected with HTTP 422 (BR-015).*

**POST `/rest/reports/data-export/jobs` — Request Body:**
```json
{
  "jobName": "Hematology TAT Q1 2026",
  "selectedVariables": ["accessionNumber", "testName", "resultValue"],
  "filterSpec": { "dateFrom": "2026-01-01", "dateTo": "2026-03-31", ... }
}
```
- **Sync (200):** CSV file with `Content-Disposition: attachment; filename="<jobName>.csv"`
- **Async (202):** `{ "jobId": "4821", "jobName": "Hematology TAT Q1 2026", "routedAsync": true }`

**GET `/rest/reports/data-export/jobs` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| status | String | Comma-separated status filter; omit for all |
| page | Integer | 0-indexed page number |
| pageSize | Integer | Items per page |

---

## 7. UI Design

See companion mockups (updated for v1.1 — grain family locking, QC domain removed, tag-based selection summary):
- `custom-data-export-mockup.jsx` — Production mockup using `@carbon/react` and `@carbon/icons-react`. Reference for implementation.
- `custom-data-export-preview.html` — Visual preview. Open in any browser — no build step required.

### Navigation Path

Two new menu items are added to the Reports section of the left navigation sidebar, as siblings to the existing Patient Report Print Queue and Patient Status Report entries:

- **Reports → Custom Data Export** — The 3-step report builder wizard
- **Reports → My Report Queue** — The async job queue for data exports

### Key Screens

1. **Report Builder — Step 1 (Variable Selection)** — `ProgressIndicator` at top; seven `Accordion` groups in three grain families; family locking greys out non-active families; PII groups locked for unauthorized users with tooltip explanation; selection summary shows dismissible variable `Tag`s plus count
2. **Report Builder — Step 2 (Filters)** — Mandatory `DatePicker` date range (max range enforced); Lab Sections `MultiSelect`; optional filters (Sample Status, Result Status, Priority, Referring Site); all selections render as visible tags
3. **Report Builder — Step 3 (Review & Submit)** — Read-only summary with full variable labels; row estimate with routing notification; export name `TextInput`; save-configuration panel; Submit button
4. **My Report Queue** — `DataTable` with status `Tag`s; Download / Cancel / Retry / Re-run actions per status; `OverflowMenu` delete; auto-polling every 15 seconds

### Interaction Patterns

- **`ProgressIndicator`** for wizard step tracking; back navigation free; forward requires validation
- **`Accordion` + `Checkbox`** with per-group "Select All"; grain-family locking disables non-active families
- **Family color coding** — blue / teal / magenta family chips on every group header and card edge-stripes, matching the Step 1 legend (FR-1-009); locked state pairs the color cue with a helper banner and "Clear all selections" action (FR-1-008)
- **Dismissible `Tag`s** for selected variables and filter values — labels always visible, never a bare count (Constitution II)
- **Variable checkboxes show display names only** — no technical annotations in the UI (FR-1-003)
- **`DatePicker`** with Carbon built-in `invalidText` for date validation
- **`MultiSelect`** for lab sections (pre-scoped to user's authorized sections)
- **`InlineNotification`** for row estimate, routing preview (sync/async), and job submission feedback
- **`DataTable`** with `OverflowMenu` actions and 15-second auto-polling for queue

---

## 8. Business Rules

**BR-001:** A job is routed SYNC if `estimatedRows ≤ dataExport.syncRowLimit` AND the date range spans ≤ `dataExport.syncDateRangeDays`. If either threshold is exceeded, the job is routed ASYNC. Both thresholds are configured in Admin → General Configuration → Printed Reports Configuration (FR-5-004).

**BR-002:** A job MUST have at least one variable selected (enforced UI and API) and a date range applied (both Date From and Date To required). The date range MUST NOT exceed `dataExport.maxDateRangeDays` (default 90), enforced server-side with error key `error.dataExport.dateRangeTooLarge`. Unbounded full-table exports are not permitted.

**BR-003:** All export queries MUST be scoped to lab sections the requesting user is authorized to access, enforced server-side. If a user's API request includes unauthorized `labSectionIds`, those IDs MUST be silently excluded — no error is returned and no unauthorized data is returned.

**BR-004:** PII variable keys (`patientName`, `dateOfBirth`, `sex`, `nationalId`, `programPatientCode`, `programEnrollment`, `phoneNumber`, `address`) MUST be excluded from the CSV output if the user does not hold the corresponding `DATA_EXPORT_PII_DEMOGRAPHICS` or `DATA_EXPORT_PII_IDENTIFIERS` permission at job execution time. No error is returned — the column simply does not appear in the output. This rule is enforced server-side as defense-in-depth regardless of what the UI submitted.

**BR-005:** A sync job that exceeds 30 seconds of server-side generation MUST be automatically promoted to ASYNC status. The HTTP response transitions to 202 with the job ID. The UI MUST handle a delayed 202 gracefully by displaying a notification and linking to the queue.

**BR-006:** Completed READY jobs expire `dataExport.jobRetentionDays` (default 7) days after `completedAt`. On expiry, the job transitions to EXPIRED status and the output file is purged from storage. The `DataExportJob` record and associated `PiiAccessLog` entries are retained indefinitely for audit purposes.

**BR-007:** A GENERATING job MUST NOT be cancelled. The Cancel action is only available for QUEUED jobs. The UI MUST not render the Cancel button for GENERATING rows. If a DELETE request is received for a GENERATING job, the API MUST return HTTP 409 Conflict.

**BR-008:** A `PiiAccessLog` entry MUST be created at job submission time (not at download time) for each PII tier included in the job's `selectedVariables`. If both DEMOGRAPHICS and IDENTIFIERS variables are selected, two separate log entries are created.

**BR-009:** CSV column order MUST follow the canonical order of the variable catalog (domain group order, then variable order within each group), NOT the order in which the user checked individual boxes. Column order is determined server-side and is consistent across identical `selectedVariables` sets.

**BR-010:** A maximum of `dataExport.maxActiveJobs` (default 5) concurrent active jobs (QUEUED + GENERATING combined) are permitted per user at any time. Submitting a job that would exceed this limit MUST return HTTP 429 with error key `error.dataExport.jobLimitExceeded` (message interpolates the configured limit).

**BR-011:** The "Re-run" action on an EXPIRED job pre-populates the Report Builder with the expired job's `selectedVariables` and optional filter fields (statuses, priority, site). The date range MUST NOT be pre-populated — the user must set a new date range before submitting. This prevents accidental resubmission of stale date ranges.

**BR-012 (Row grain per family):** Output row grain is determined by the job's grain family (see FR-1-002): SAMPLE_TESTING exports are one row per test result per accession when Test Results or TAT variables are selected, otherwise one row per accession; REFERRAL exports are one row per referred analysis; NON_CONFORMANCE exports are one row per non-conforming event. *(Replaces the v1.0 cross-domain join rules, which are superseded by BR-015.)*

**BR-013:** CANCELLED jobs are retained in the queue view for 24 hours after cancellation, then automatically deleted. Their `PiiAccessLog` entries (if any) are retained.

**BR-014:** Retry jobs (created via the Retry action) set `parentJobId` to the ID of the failed job, creating an auditable chain for repeated failures.

**BR-015 (Grain family integrity):** All keys in `selectedVariables` MUST belong to a single grain family. The server derives the family from the submitted keys and MUST reject any request mixing families with HTTP 422 and error key `error.dataExport.mixedGrainFamilies`, regardless of client-side enforcement (FR-1-008).

**BR-016 (Ownership):** All job, download, and saved-config resources are scoped to their owning user. A request for another user's resource MUST return HTTP 404 (not 403, to avoid resource-existence disclosure). Administrator cross-user queue visibility is out of scope for this phase.

**BR-017 (CSV format):** Exports are RFC 4180 CSV: UTF-8 with BOM (for Excel compatibility), comma delimiter, double-quote escaping. Dates use ISO 8601 (`yyyy-MM-dd`; timestamps `yyyy-MM-dd HH:mm`) in the laboratory server's timezone. Null values are empty cells. The header row uses the catalog's canonical English display names (fixed, not localized) so column headers are stable for downstream tooling regardless of the submitting user's locale.

**BR-018 (Async worker & recovery):** Async jobs are processed by a single background executor (Spring `TaskExecutor`/`@Scheduled` polling loop), FIFO by `createdAt`, one job at a time per application instance. On application startup, any job found in GENERATING status MUST be transitioned to FAILED with `errorMessage` "Interrupted by system restart" (retryable via the standard Retry action); QUEUED jobs survive restarts untouched. `estimatedWaitSeconds` = queue position × rolling average generation time of the last 20 completed jobs (fallback 60s when no history exists).

---

## 9. Localization

All UI text is externalized. **Per Constitution VII, keys are added to `en.json` ONLY** — all other locales come from Transifex. The following i18n keys must be added:

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
| `label.dataExport.domain.referrals` | Referrals |
| `label.dataExport.domain.nonConformance` | Non-Conformance / Rejections |
| `label.dataExport.family.sampleTesting` | Sample & Testing |
| `label.dataExport.family.referral` | Referrals |
| `label.dataExport.family.nonConformance` | Non-Conformance |
| `label.dataExport.family.activeExport` | {family} export |
| `tooltip.dataExport.familyLocked` | Not available with {family} variables — an export draws from one data family at a time |
| `heading.dataExport.familyLegend` | Export families |
| `label.dataExport.familyLegend.subtitle` | An export draws from one family — picking a variable locks the others |
| `label.dataExport.family.desc.sampleTesting` | Orders, results, patients & turnaround times · one row per test result |
| `label.dataExport.family.desc.referral` | Tests referred to other labs · one row per referred analysis |
| `label.dataExport.family.desc.nonConformance` | Rejected samples & non-conforming events · one row per event |
| `message.dataExport.familyLockedBanner` | You're building a {family} export. The other families are locked — clear your selections to switch. |
| `button.dataExport.clearSelections` | Clear all selections |
| `label.dataExport.variablesSelected` | {count} variables selected |
| `label.dataExport.selectAll` | Select All |
| `label.dataExport.piiLocked` | Requires {permission} permission |
| `label.dataExport.piiTag` | PII |
| `tooltip.dataExport.piiTag` | Contains patient-identifying data — requires additional permission; exports including these fields are audited |
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
| `error.dataExport.dateRangeTooLarge` | Date range cannot exceed {max} days. |
| `error.dataExport.mixedGrainFamilies` | Selected variables must all belong to the same data family. |
| `error.dataExport.jobLimitExceeded` | You have reached the maximum of {max} active export jobs. Please wait for a job to complete before submitting a new one. |
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
| `message.dataExport.configOverwriteConfirm` | A configuration named "{name}" already exists. Overwrite it? |
| `message.dataExport.configStaleVariables` | Some saved variables are no longer available and were removed: {variables} |
| `message.dataExport.configDeleteConfirm` | Are you sure you want to delete the saved configuration "{name}"? |
| `message.dataExport.configDeleteSuccess` | Configuration deleted. |
| `error.dataExport.configLimitExceeded` | You have reached the maximum of {max} saved configurations. Please delete one before saving a new configuration. |
| `error.dataExport.configNameRequired` | Configuration name is required. |

> **Removed in v1.1:** `label.dataExport.domain.qualityControl` (QC domain cut), `error.dataExport.configNameDuplicate` (replaced by `message.dataExport.configOverwriteConfirm`). Limit-bearing messages now interpolate `{max}` instead of hardcoding 5/20.

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| selectedVariables | Must contain at least one key | `error.dataExport.noVariables` |
| selectedVariables | All keys must belong to one grain family (server-derived; HTTP 422 on violation) | `error.dataExport.mixedGrainFamilies` |
| selectedVariables (PII keys) | Must match user's PII permission tier | Server silently excludes unauthorized keys from CSV output |
| filterSpec.dateFrom | Required | `error.dataExport.noDateFrom` |
| filterSpec.dateTo | Required; must be ≥ dateFrom | `error.dataExport.noDateTo` / `error.dataExport.invalidDateRange` |
| filterSpec date range | Must not exceed `dataExport.maxDateRangeDays` (server + client) | `error.dataExport.dateRangeTooLarge` |
| jobName (if provided) | Max 100 characters | — |
| configName | Required on save; max 100 characters | `error.dataExport.configNameRequired` |
| Active concurrent jobs | Max `dataExport.maxActiveJobs` per user (QUEUED + GENERATING); HTTP 429 | `error.dataExport.jobLimitExceeded` |
| Saved configs | Max `dataExport.maxSavedConfigs` per user; HTTP 422 | `error.dataExport.configLimitExceeded` |
| labSectionIds | All IDs must be in user's authorized sections | Server silently excludes unauthorized IDs |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Custom Data Export page | `DATA_EXPORT` | Menu item hidden; direct URL returns HTTP 403 |
| View My Report Queue page | `DATA_EXPORT` | Menu item hidden; direct URL returns HTTP 403 |
| Submit an export job | `DATA_EXPORT` | Submit button hidden; API returns HTTP 403 |
| Download a completed export | `DATA_EXPORT` + resource ownership | Download button hidden; API returns HTTP 403 (no permission) / 404 (not owner) |
| Access another user's job or saved config | — (never permitted) | API returns HTTP 404 (BR-016) |
| Select Patient Demographics variables | `DATA_EXPORT_PII_DEMOGRAPHICS` | Group visible but locked; checkboxes disabled; API excludes keys silently |
| Select Patient Identifier variables | `DATA_EXPORT_PII_IDENTIFIERS` | Group visible but locked; checkboxes disabled; API excludes keys silently |

**Ownership (BR-016):** every job, download, and saved-config endpoint verifies the resource belongs to the authenticated user; non-owned resources return HTTP 404 to avoid disclosing resource existence. Administrator cross-user visibility is out of scope this phase.

**Section scoping (enforced at API layer):** All export queries MUST be filtered to the lab sections mapped to the current user's active roles. If a user's role is modified during a session to remove section access, subsequent API calls MUST reflect the updated scoping immediately.

**PII audit logging:** All jobs that include Patient Demographics or Patient Identifier variable keys MUST create a `PiiAccessLog` entry at job submission time. The log is immutable and cannot be deleted via any API endpoint.

**Mid-session permission loss:** If `DATA_EXPORT` is removed from the user's role while they have the page open, the next API call MUST return HTTP 403. The frontend MUST redirect to the home page and display a session permission error `InlineNotification`.

---

## 12. Acceptance Criteria

### Functional

- [ ] **[FR-1-001, Section 3]** User with `DATA_EXPORT` permission can navigate to Reports → Custom Data Export; wizard loads with Step 1 active and `ProgressIndicator` showing all three steps
- [ ] **[FR-1-002, FR-1-003]** All 7 variable domain groups render in `Accordion`; each group shows its full variable list as `Checkbox` items
- [ ] **[FR-1-004]** Patient Demographics and Patient Identifiers groups are visible but locked (disabled checkboxes + lock icon + tooltip) for users without respective `DATA_EXPORT_PII_DEMOGRAPHICS` / `DATA_EXPORT_PII_IDENTIFIERS` permissions
- [ ] **[FR-1-005]** "Select All" per group toggles all variables in that group; shows indeterminate state when partially selected
- [ ] **[FR-1-006]** Selection summary shows selected variables as dismissible tags AND a count; dismissing a tag deselects the variable; "Next" disabled with tooltip when zero variables selected
- [ ] **[FR-1-007]** Navigating back from Step 2 or 3 to Step 1 preserves variable selections
- [ ] **[FR-1-008, BR-015]** Selecting a variable locks the wizard to its grain family: other families' groups grey out with tooltip; deselecting all unlocks; server rejects mixed-family submissions with HTTP 422
- [ ] **[FR-2-001]** Date From and Date To are required; Date To field displays Carbon `invalidText` error if set before Date From; "Next" disabled while error active
- [ ] **[FR-2-002]** Lab Sections `MultiSelect` shows only user's authorized sections; single-section users see it pre-selected and read-only
- [ ] **[FR-2-004]** Result Status filter is disabled when no Test Results domain variables are selected
- [ ] **[FR-2-009]** All MultiSelect filters display selected values as visible dismissible tags — never a bare count
- [ ] **[FR-2-010, BR-002]** Date range exceeding the configured maximum shows `invalidText` and blocks progression; server rejects over-limit ranges independently
- [ ] **[FR-2-008]** Navigating back from Step 3 to Step 2 preserves filter selections
- [ ] **[FR-3-003]** Row estimate is fetched automatically on reaching Step 3; loading skeleton shown while pending; warning shown if estimate fails; user can still submit
- [ ] **[FR-3-004]** `InlineNotification` shows sync vs async routing based on threshold evaluation; estimated row count and wait time displayed
- [ ] **[FR-3-005, BR-001]** Sync jobs (within configured thresholds) download immediately; async jobs return 202 and appear in queue with QUEUED status
- [ ] **[FR-3-006]** Wizard resets to Step 1 with cleared selections after successful submission
- [ ] **[FR-6-001 – FR-6-012]** My Report Queue shows all user jobs; correct status `Tag` kinds per status; Download/Cancel/Retry/Re-run actions available per status; queue auto-polls every 15 seconds while active jobs exist; polling stops when no active jobs
- [ ] **[FR-6-004]** Download does not change job status; repeat downloads permitted until expiry
- [ ] **[FR-6-012]** READY/FAILED transition triggers an in-app banner even on other pages (app-shell poller); READY banner includes a download link
- [ ] **[BR-006]** Jobs expire per configured retention days after completion; status transitions to EXPIRED; file no longer downloadable; Re-run option available
- [ ] **[BR-010]** Submitting a job beyond the configured active-job limit returns HTTP 429 with `error.dataExport.jobLimitExceeded` displayed as `InlineNotification` kind `error`
- [ ] **[BR-012]** SAMPLE_TESTING jobs with Test Results/TAT variables produce one row per test result per accession; Sample/Order-only jobs produce one row per accession; REFERRAL jobs one row per referred analysis; NON_CONFORMANCE jobs one row per NCE event
- [ ] **[BR-003, BR-004]** Server enforces section scoping and PII exclusion regardless of what the client submits; unauthorized columns not present in CSV output; no error returned
- [ ] **[BR-016]** Requesting another user's job, download, or saved config returns HTTP 404
- [ ] **[BR-017]** Output CSV is UTF-8 with BOM, RFC 4180, ISO 8601 dates, canonical English headers

### Non-Functional

- [ ] **[Constitution VII]** All UI strings use i18n keys — zero hardcoded English text in JSX; new keys added to `en.json` only
- [ ] **[FR-4-002]** Row estimate endpoint responds within 5 seconds under normal conditions
- [ ] **[Section 11]** All permissions enforced at both UI layer (hidden/disabled controls) and API layer (HTTP 403 for unauthorized requests)
- [ ] **[Constitution II]** All components use Carbon Design System from `@carbon/react`; no Bootstrap, Tailwind, or custom component libraries
- [ ] **[FR-8-001]** User preferences (items per page) persisted server-side; browser local storage not used
- [ ] **[Constitution VII]** Feature verified with the `fr` locale loaded — no untranslated key strings visible *(v1.0 referenced Malagasy, which is not in the supported locale set)*

### Integration

- [ ] **[OGC-70]** The `filterSpec` JSON schema and `selectedVariables` variable catalog are documented and stable — Catalyst Wizard Mode can consume these without breaking changes in a future phase
- [ ] **[Patient Report Print Queue]** My Report Queue page follows identical `DataTable` architecture, controller path conventions, server-side preference persistence pattern, and status `Tag` kind conventions as Patient Report Print Queue
- [ ] **[BR-008, Section 11]** `PiiAccessLog` entries created at job submission time for all jobs including PII variables; verified in database after test submission
- [ ] **[Companion release]** Build containing OGC-479 without OGC-481 has async submission disabled (over-threshold requests rejected with guidance to narrow the range) — enforced only if the stories ever ship separately, which is not planned

### Saved Configurations

- [ ] **[FR-7-001]** Saved configurations panel appears at top of Step 1; dropdown lists all configurations belonging to the current user; loading a config locks the grain family
- [ ] **[FR-7-002]** Selecting a saved configuration and clicking Load populates Step 1 variable selections; existing selections are replaced; confirmation `InlineNotification` (kind="success") shown
- [ ] **[FR-7-002]** Saving with a duplicate name opens a confirmation `Modal`; confirming overwrites the existing config in place; cancelling makes no change
- [ ] **[FR-7-004]** Exceeding the configured saved-config limit returns `error.dataExport.configLimitExceeded`; user must delete one before saving
- [ ] **[FR-7-005]** Saved configurations are stored server-side in `DataExportSavedConfig`; date range is NOT persisted; personal to the user; persist across sessions
- [ ] **[FR-7-006]** Loading a config containing retired variable keys drops them silently and shows a warning listing the removed variables

---

## 13. Testing Requirements (Constitution V)

**Backend (JUnit 4 + Mockito; >80% line coverage on new code via JaCoCo):**
- Unit tests for the query-builder service: variable→column mapping per grain family, filter predicate composition, PII exclusion (BR-004), section scoping (BR-003), grain family rejection (BR-015). Every test MUST satisfy the Inversion Test (V.6).
- Unit tests for routing logic (BR-001, BR-005) including threshold boundary cases and configuration overrides.
- ORM validation tests (V.4) for all five new entities — mapping correctness without a database connection.
- Integration test: `PiiAccessLog` row created on submission with PII variables; absent without (AC requirement).
- Worker tests: FIFO ordering, restart recovery (GENERATING→FAILED), expiry transition and file purge (BR-006, BR-018).

**Frontend (React Testing Library; >70% coverage on new components):**
- Wizard state: family locking/unlocking, tag dismissal, back-navigation persistence, validation gating.
- Queue: status-conditional action rendering, polling start/stop.

**E2E (Playwright — new tests; no Cypress):**
1. Sync happy path: build small export → immediate download.
2. Async path: over-threshold export → 202 → queue shows QUEUED→READY → download.
3. PII lock: user without PII keys sees locked groups; submission never contains PII columns.
4. Grain lock: selecting a Referrals variable disables Sample & Testing groups.
5. Saved config: save → reload → overwrite-confirm flow.

**CI gates:** `mvn spotless:check`, `mvn clean install`, Playwright suite — all green before merge to `develop`.

