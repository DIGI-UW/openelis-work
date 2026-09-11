# Custom Data Export & My Report Queue
## Functional Requirements Specification — v1.3

**Version:** 1.3
**Date:** 2026-09-11
**Status:** Draft for Review
**Next checkpoint:** [Design revision and implementation readiness](#14-design-revision-and-implementation-readiness) — revised mock/spec in review; validation, publication and owner acceptance pending.
**Jira Stories:**
- [OGC-479](https://uwdigi.atlassian.net/browse/OGC-479) — Custom Data Export: 3-step report builder wizard
- [OGC-481](https://uwdigi.atlassian.net/browse/OGC-481) — My Report Queue: Async job queue
- [OGC-483](https://uwdigi.atlassian.net/browse/OGC-483) — Saved Export Configurations
**Parent Epic:** [OGC-70](https://uwdigi.atlassian.net/browse/OGC-70) — Catalyst LLM-Powered Lab Data Assistant
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Report Print Queue, Catalyst (OGC-70), Reports, User Preferences, Printed Reports Configuration

> **Companion release requirement:** OGC-479 and OGC-481 MUST ship in the same release. The primary use cases (TAT monitoring, quarterly extracts) exceed the sync thresholds by definition and are only retrievable via the queue. Async job submission MUST NOT be enabled in a build that does not include the My Report Queue page.

### MVP review update — v1.2

The OpenELIS screens, styling and reporting requirements stay in this repository.
[The interactive HTML mock](custom-data-export.html) is the current workflow
review surface; the JSX file is only a compatibility wrapper for existing gallery links.
[The Catalyst-side draft](https://pmanko.github.io/clinical-ai-validation-harness/catalyst-design/?view=integration&app=catalyst)
and [cross-project roadmap](https://github.com/pmanko/clinical-ai-validation-harness/blob/main/specs/openelis-reporting-catalyst-integration.md)
link here instead of reproducing OpenELIS screens.

This update retains the seven domains and three row families below. The initial
complete downloadable **fictional review example** is August 2026 Virology:
HIV viral load, validated results, collection-date filtering, one row per result,
and accession number / collection date / lab section / test / result / unit /
result status. The five rows include two distinct results for one accession and
one blank result value. The example does not prove live exports or parity.
Broader fields remain required for application delivery; the mock explains its
fixture limitation rather than inventing values for them.

The prototype connects generation to the queue, produces an actual fictional
CSV, saves reusable choices without dates, and preserves drafts while switching
views or recovering from access changes. Reviewer controls simulate failure and
access. No application, authentication, clinical-data or AI requests are added.

Patient printing, Jasper replacement, automatic scheduling and dashboards are
outside this export MVP. OpenELIS keeps its own Carbon styling; Catalyst keeps
its approved Workbench styling. Owner design approval, application implementation,
real-source parity and deployment remain separately recorded milestones.

### Design-readiness update — v1.3

The reporting landing page now gives equal weight to creating a new export and
rerunning saved report settings. New exports retain the three-step builder. Users
choose the report type before fields, search only that type's field catalog, see
common filters first, and reveal additional filters when needed. Saved report
settings open directly at a fresh reporting period and keep field editing available.

The review step adds direct Change actions, treats the CSV file name separately
from optional saved report settings, and uses **Create CSV** as the primary action.
The queue distinguishes continuing the current draft from starting a new export,
uses named actions, and adapts to narrow screens. Preview-only permission and
failure controls remain outside the staff workflow. These changes preserve the
three row families, full field catalog, permission rules, retained input, queue
recovery and companion-release requirement.

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
14. Design Revision and Implementation Readiness

---

## 1. Executive Summary

The Custom Data Export feature gives authorized laboratory staff a self-service tool to extract structured CSV data from OpenELIS Global without requiring LLM configuration or DBA intervention. Users select from a curated catalog of variables within one of three **grain families** — Sample & Testing, Referrals, or Non-Conformance — apply date range and lab section filters, and receive an estimated row count before submission. Small reports download immediately; large reports are processed asynchronously via a personal report queue with download notification. OpenELIS reporting is delivered independently of Catalyst and AI. Catalyst independently queries its configured OpenELIS source; reuse of this export schema, variable catalog or queue is not an integration prerequisite. Shared organizational sign-in and equivalent lab-unit/identifying-field authorization require separate implementation; there is no application link, embedded Catalyst UI or report-criteria transfer in the agreed integration design.

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

**FR-1-002:** Before showing fields, Step 1 MUST ask the user to choose one of three plain-language **report types**. Each report type maps to one grain family. After selection, Step 1 shows only that family's domain groups as Carbon `Accordion` items; the complete permitted field catalog remains available through those groups.

| Grain Family | Domain Groups | Output Row Grain |
|---|---|---|
| **SAMPLE_TESTING** | Sample / Order; Test Results; Patient Demographics *(🔒 `DATA_EXPORT_PII_DEMOGRAPHICS`)*; Patient Identifiers *(🔒 `DATA_EXPORT_PII_IDENTIFIERS`)*; Turnaround Time | One row per test result per accession when Test Results or Turnaround Time variables are selected; otherwise one row per accession |
| **REFERRAL** | Referrals | One row per referred analysis |
| **NON_CONFORMANCE** | Non-Conformance / Rejections | One row per non-conforming event |

The first relevant domain group is expanded after report-type selection; the
remaining groups start collapsed. A field search filters labels within the chosen
type and temporarily exposes matching groups. Search does not reduce server-side
coverage or hide fields from an authorized user who clears the search.

**FR-1-003:** Each domain group MUST display its full variable list as individual `Checkbox` items showing **only the variable's display name** — no technical annotations (e.g., "computed", "from ObservationHistory", "blank when unmapped") appear in the UI. Derivation and sourcing details are implementation notes in this spec (Section 5), not user-facing content. The complete variable catalog is defined in Section 5.

**FR-1-004:** Permission-gated groups (Patient Demographics, Patient Identifiers) MUST display one plain-language **"Identifying data"** `Tag` in the group header with a tooltip: "Contains patient-identifying data. Additional access is required and exports are audited." For users without the corresponding permission key, the group additionally shows a lock icon and disabled `Checkbox` items with guidance to request identifying-data access. The technical permission key may appear in administrative help, not as the primary staff-facing label. The groups remain visible so users understand what data exists and can request access.

**FR-1-005:** A "Select All" checkbox MUST appear at the top of each domain group's variable list. Checking it selects all variables in that group; unchecking it clears all. "Select All" MUST be indeterminate when some but not all variables are selected.

**FR-1-006:** A selection summary MUST be displayed in the step header area showing **both** a running count (e.g., "12 variables selected") **and** the selected variables' display names as dismissible Carbon `Tag` components (clicking a tag's close icon deselects that variable). Per Constitution Principle II ("Selections show their labels, never just a count"), the count MUST NOT appear without the labels. The "Next" button to proceed to Step 2 MUST be disabled and display a tooltip ("Select at least one variable to continue") when zero variables are selected.

**FR-1-007:** Variable selection state MUST persist when the user navigates backwards to Step 1 from Steps 2 or 3. Navigating back does not reset selections.

**FR-1-008 (Report-type integrity):** The report-type choice MUST occur before field selection and determine the submitted grain family. After any field is selected, switching type requires the explicit **Change type and clear fields** action. The client MUST never submit mixed-family keys, and the server MUST continue to enforce BR-015.

**FR-1-009 (Report-type guidance):** Each report-type choice MUST name the type, describe its purpose in plain language and state its output row meaning. Color MAY reinforce the choice but MUST NOT be the only distinction. The chosen type remains visible in the selection summary and review step.

**FR-1-010 (Field search and disclosure):** Step 1 MUST provide a field-label search after report-type selection. Search results remain organized by domain; accordion headers use semantic buttons with `aria-expanded` and visible focus. Clearing search restores the complete chosen-type catalog and prior selections.

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

**FR-2-007:** Both date fields are required, but an empty form MUST NOT show a
reversed-range error. After the user attempts to continue, each missing field MUST
show its own required error. The "Date To" field shows "Date To must be on or after
Date From" only when both values exist and the order is invalid. Continue remains
unavailable for missing, reversed or over-limit periods.

**FR-2-008:** Filter state MUST persist when the user navigates backwards from Step 3 to Step 2. Navigating back does not reset filter selections.

**FR-2-009 (Labels, not counts):** All `MultiSelect` filters MUST render their selected values as visible dismissible tags (Carbon `FilterableMultiSelect` selected-item tags or an adjacent tag row) — never a bare count. Per Constitution Principle II, a count MAY appear alongside the labels, never instead of them.

**FR-2-010 (Maximum date range):** The date range MUST NOT exceed the configured maximum (`dataExport.maxDateRangeDays`, default 90). If exceeded, the Date To field MUST display `invalidText`: "Date range cannot exceed {max} days." The "Next" button MUST be disabled while this error is active. The limit is also enforced server-side (Section 10).

**FR-2-011 (Test filter):** When Test Results variables are selected, provide an
optional test selector using the existing Carbon `ComboBox`/filter conventions.
Show the selected test by name in Step 3 and saved configurations. An empty
selection means all eligible tests; one selected test restricts the result rows
to that test. Backend IDs, catalog lookup and enforcement are verified during
implementation. It must not replace the authorized lab-section restriction.

**FR-2-012 (Progressive filter disclosure):** The reporting period, date basis,
authorized lab scope and any selected test/result status MUST be visible without
opening another panel. Less common filters such as sample status, priority and
referring site MAY be grouped under **More filters**. Collapsing that group retains
all values and displays a plain-language summary of any active filters.

### 4.3 Report Builder — Step 3: Review & Submit

**FR-3-001:** Step 3 MUST display a read-only summary panel showing: (a) the grain family and the selected variables' display names grouped by domain (full labels, with count shown alongside), (b) applied date range, (c) selected lab sections by name (or "All accessible sections" if none specified), and (d) any optional filters applied, showing selected values by name.

**FR-3-002:** Step 3 MUST include an optional **File name** `TextInput`. If left blank on submission, the system auto-generates `[Domains]_[DateFrom]_to_[DateTo]` (for example, `Test_Results_2026-01-01_to_2026-03-31`). Maximum 100 characters. This name is distinct from the saved report-settings name in FR-7-002.

**FR-3-003:** Step 3 MUST automatically fetch a row count estimate via `POST /rest/reports/data-export/estimate` when the user arrives at Step 3 (not on button click). A skeleton/loading state MUST be shown while the estimate is pending. If estimation fails or times out, an `InlineNotification` with kind `warning` MUST be displayed: "Row count estimate unavailable. The export will be queued for processing." The user can still submit.

**FR-3-004:** Based on the estimate response:
- If `routedAsync: false` → display `InlineNotification` kind `info`: "This report will download immediately (~{count} rows)."
- If `routedAsync: true` → display `InlineNotification` kind `info`: "This report will be queued — you will be notified when it is ready (~{count} rows, ~{wait} min)."

**FR-3-005:** Clicking **Create CSV** triggers `POST /rest/reports/data-export/jobs`. The button may add "and add to queue" when the estimate predicts async processing. On success:
- Sync (200): Browser initiates file download immediately; `InlineNotification` kind `success` confirms: "Your export is downloading."
- Async (202): `InlineNotification` kind `success` confirms queuing and includes a "View My Report Queue" link.

**FR-3-006:** Submitting an export MUST retain the current variables and filters while the job generates and after failure or retry. Users can return from My Report Queue to review or adjust those choices without rebuilding the request. Loading a saved configuration or re-running an expired job still requires fresh dates (FR-7-001).

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

At narrow widths the same information MUST reflow into readable row cards instead
of requiring horizontal scrolling. Status-specific primary actions use visible
labels: Download, Cancel, Retry or Re-run. Details and Delete remain secondary.

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

**FR-6-013 (Draft-aware queue navigation):** The queue MUST distinguish
**Continue current export** from **New export**. Continue returns to the retained
builder state. New export starts a clean builder only after the user chooses that
action; it MUST NOT silently reopen or silently discard the previous draft.

### 4.7 Saved Report Configurations

**FR-7-001:** The reporting landing page MUST show the current user's saved report settings by name, sorted most-recently-used first, beside the new-export entry point. Choosing **Use report** loads its report type, fields and non-date filters and opens Step 2 for a fresh reporting period. The user can return to Step 1 to edit fields. Dates are never saved or pre-populated.

**FR-7-002:** On Step 3, saving report settings MUST be optional and collapsed by default behind **Save these report settings for later**. Opting in reveals a distinct **Saved report name** input and Save action. Clicking Save creates a `DataExportSavedConfig`. If the name already exists for the user, an accessible confirmation modal asks whether to replace it. Confirming updates the existing record in place; cancelling makes no change.

**FR-7-003:** Saved report settings are accessible from the reporting landing page and the Step 3 save section only. Managing names and deletion is done from the landing page or a linked management dialog; management MUST NOT compete with Create CSV on the review step.

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
| filterSpec | JSON | Yes | Serialized filter state (dateFrom, dateTo, labSectionIds, testIds, sampleStatuses, resultStatuses, priorities, referringSiteId) |
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
>
> **Cross-reference:** this is the same abnormal-flag signal `designs/reports/positivity-rate.md`'s `ALL_ABNORMAL` match mode uses to define positivity for numeric-result tests (BR-003 in that FRS). A raw per-result export using this column agrees with that report's aggregate rate for any test using `ALL_ABNORMAL`. Ad hoc `SPECIFIC_CODES` positivity definitions aren't exportable as a static column here, since they're chosen per report run rather than being a property of the result.

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
    "testIds": [],
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

See the paired design artifacts:
- `custom-data-export.html` — authoritative interactive review workflow.
- `custom-data-export-example.js` — fictional August 2026 fixture and downloadable CSV helper.
- `custom-data-export.jsx` — thin compatibility wrapper that renders the HTML workflow; it contains no second design.

### Navigation Path

Two new menu items are added to the Reports section of the left navigation sidebar, as siblings to the existing Patient Report Print Queue and Patient Status Report entries:

- **Reports → Custom Data Export** — The 3-step report builder wizard
- **Reports → My Report Queue** — The async job queue for data exports

### Key Screens

1. **Reporting landing page** — equally clear Start a new export and Use a saved report paths
2. **Report Builder — Step 1 (Field selection)** — explicit report type, searchable matching accordions, permission-aware identifying fields and a selected-field summary
3. **Report Builder — Step 2 (Filters)** — required reporting period and lab scope; common filters visible; less common filters under More filters with retained values
4. **Report Builder — Step 3 (Review & Submit)** — direct Change actions, row estimate, optional file name, optional saved report settings and Create CSV
5. **My Report Queue** — responsive job list with named Download / Cancel / Retry / Re-run actions, draft-aware navigation and 15-second polling

### Interaction Patterns

- **`ProgressIndicator`** for wizard step tracking; back navigation free; forward requires validation
- **Plain-language report-type choices** before field selection; color may reinforce but never carries meaning alone
- **`Accordion` + `Checkbox`** with semantic headers, field-label search and per-group "Select all shown"
- **Dismissible `Tag`s** for selected variables and filter values — labels always visible, never a bare count (Constitution II)
- **Variable checkboxes show display names only** — no technical annotations in the UI (FR-1-003)
- **`DatePicker`** with Carbon built-in `invalidText` for date validation
- **`MultiSelect`** for lab sections (pre-scoped to user's authorized sections)
- **`InlineNotification`** for row estimate, routing preview (sync/async), and job submission feedback
- **Responsive `DataTable`** with named primary actions and 15-second auto-polling for queue

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
| `label.dataExport.family.activeExport` | {family} report |
| `heading.dataExport.reportType` | What kind of information do you need? |
| `label.dataExport.reportType.help` | Choose one report type so every CSV row has a clear meaning. |
| `label.dataExport.family.desc.sampleTesting` | Orders, results, patients & turnaround times · one row per test result |
| `label.dataExport.family.desc.referral` | Tests referred to other labs · one row per referred analysis |
| `label.dataExport.family.desc.nonConformance` | Rejected samples & non-conforming events · one row per event |
| `message.dataExport.reportTypeBanner` | You're building a {family} report. |
| `button.dataExport.changeReportType` | Change type and clear fields |
| `label.dataExport.variablesSelected` | {count} fields selected |
| `label.dataExport.selectAll` | Select all shown |
| `label.dataExport.fieldSearch` | Find a field |
| `placeholder.dataExport.fieldSearch` | Search fields... |
| `label.dataExport.piiLocked` | Requires additional identifying-data access |
| `label.dataExport.piiTag` | Identifying data |
| `tooltip.dataExport.piiTag` | Contains patient-identifying data. Additional access is required and exports are audited. |
| `label.dataExport.dateFrom` | Date From |
| `label.dataExport.dateTo` | Date To |
| `label.dataExport.labSections` | Lab Sections |
| `label.dataExport.allSections` | All accessible sections |
| `label.dataExport.sampleStatus` | Sample Status |
| `label.dataExport.resultStatus` | Result Status |
| `label.dataExport.priority` | Priority |
| `label.dataExport.referringSite` | Referring Site |
| `label.dataExport.exportName` | File name |
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
| `button.dataExport.submit` | Create CSV |
| `button.dataExport.download` | Download |
| `button.dataExport.cancelJob` | Cancel Job |
| `button.dataExport.retry` | Retry |
| `button.dataExport.rerun` | Re-run |
| `button.dataExport.delete` | Delete |
| `button.dataExport.viewQueue` | View My Report Queue |
| `button.dataExport.newExport` | New Export |
| `button.dataExport.continueExport` | Continue current export |
| `button.dataExport.moreFilters` | Show more filters |
| `button.dataExport.fewerFilters` | Hide more filters |
| `button.dataExport.change` | Change |
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
| `label.dataExport.savedConfig.loadHeading` | Use a saved report |
| `label.dataExport.savedConfig.selectPlaceholder` | — Select saved report settings — |
| `label.dataExport.savedConfig.saveHeading` | Save these report settings for later |
| `label.dataExport.savedConfig.saveSubtext` | Save fields and filters to reuse. The reporting period is not saved. |
| `label.dataExport.savedConfig.nameLabel` | Saved report name |
| `label.dataExport.savedConfig.namePlaceholder` | e.g. Hematology Monthly TAT |
| `button.dataExport.loadConfig` | Use report |
| `button.dataExport.saveConfig` | Save report settings |
| `button.dataExport.deleteConfig` | Delete saved report |
| `message.dataExport.configSaveSuccess` | Saved report "{name}" updated. |
| `message.dataExport.configLoadSuccess` | Saved report "{name}" loaded. Choose a fresh reporting period. |
| `message.dataExport.configOverwriteConfirm` | Saved report settings named "{name}" already exist. Replace them? |
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

- [ ] **[FR-1-001, FR-7-001, Section 3]** User with `DATA_EXPORT` permission reaches a reporting landing page with equally clear new-export and saved-report paths; starting new opens the three-step builder
- [ ] **[FR-1-002, FR-1-003, FR-1-010]** Explicit report-type selection shows the matching domain groups and complete permitted field catalog; field search filters labels without losing selections or coverage
- [ ] **[FR-1-004]** Patient Demographics and Patient Identifiers groups are visible but locked (disabled checkboxes + lock icon + tooltip) for users without respective `DATA_EXPORT_PII_DEMOGRAPHICS` / `DATA_EXPORT_PII_IDENTIFIERS` permissions
- [ ] **[FR-1-005]** "Select All" per group toggles all variables in that group; shows indeterminate state when partially selected
- [ ] **[FR-1-006]** Selection summary shows selected variables as dismissible tags AND a count; dismissing a tag deselects the variable; "Next" disabled with tooltip when zero variables selected
- [ ] **[FR-1-007]** Navigating back from Step 2 or 3 to Step 1 preserves variable selections
- [ ] **[FR-1-008, BR-015]** Report type determines the grain family before field selection; switching after selection uses the explicit clear-and-change action; server rejects mixed-family submissions with HTTP 422
- [ ] **[FR-1-010]** Domain accordions are keyboard operable semantic buttons with `aria-expanded`, visible focus and stable selected-field state
- [ ] **[FR-2-001, FR-2-007]** Empty dates show no reversed-range error; Continue reveals field-specific required errors; a complete reversed or over-limit period blocks progression
- [ ] **[FR-2-002]** Lab Sections `MultiSelect` shows only user's authorized sections; single-section users see it pre-selected and read-only
- [ ] **[FR-2-004]** Result Status filter is disabled when no Test Results domain variables are selected
- [ ] **[FR-2-009]** All MultiSelect filters display selected values as visible dismissible tags — never a bare count
- [ ] **[FR-2-010, BR-002]** Date range exceeding the configured maximum shows `invalidText` and blocks progression; server rejects over-limit ranges independently
- [ ] **[FR-2-012]** Common filters are visible; More filters retains values when collapsed and summarizes active values
- [ ] **[FR-2-008]** Navigating back from Step 3 to Step 2 preserves filter selections
- [ ] **[FR-3-003]** Row estimate is fetched automatically on reaching Step 3; loading skeleton shown while pending; warning shown if estimate fails; user can still submit
- [ ] **[FR-3-004]** `InlineNotification` shows sync vs async routing based on threshold evaluation; estimated row count and wait time displayed
- [ ] **[FR-3-001, FR-3-002]** Review has direct Change actions for fields and filters; file name is clearly distinct from optional saved report settings
- [ ] **[FR-3-005, BR-001]** Create CSV downloads sync jobs immediately; async jobs return 202 and appear in queue with QUEUED status
- [ ] **[FR-3-006]** Variables and filters survive submission, queue navigation, generation failure and retry
- [ ] **[FR-6-001 – FR-6-013]** My Report Queue shows all user jobs; correct status `Tag` kinds per status; named Download/Cancel/Retry/Re-run actions remain reachable on narrow screens; queue auto-polls every 15 seconds while active jobs exist; polling stops when no active jobs
- [ ] **[FR-6-004]** Download does not change job status; repeat downloads permitted until expiry
- [ ] **[FR-6-012]** READY/FAILED transition triggers an in-app banner even on other pages (app-shell poller); READY banner includes a download link
- [ ] **[FR-6-013]** Continue current export restores the retained draft; New export deliberately starts clean
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

- [ ] **[Integration boundary]** OpenELIS exports work with Catalyst and AI unavailable. Shared export APIs or a Catalyst wizard are not required for this release. Real cross-application sign-in and equivalent authorization are verified separately under the integration roadmap.
- [ ] **[Patient Report Print Queue]** My Report Queue page follows identical `DataTable` architecture, controller path conventions, server-side preference persistence pattern, and status `Tag` kind conventions as Patient Report Print Queue
- [ ] **[BR-008, Section 11]** `PiiAccessLog` entries created at job submission time for all jobs including PII variables; verified in database after test submission
- [ ] **[Companion release]** Build containing OGC-479 without OGC-481 has async submission disabled (over-threshold requests rejected with guidance to narrow the range) — enforced only if the stories ever ship separately, which is not planned

### Saved Report Settings

- [ ] **[FR-7-001]** Landing page lists the user's saved report settings beside Start a new export; Use report restores type, fields and non-date filters at Step 2 with blank dates
- [ ] **[FR-7-002]** Save these report settings is off by default; opting in reveals a distinct name and Save action
- [ ] **[FR-7-002]** Saving with a duplicate name opens an accessible confirmation `Modal`; confirming replaces the existing config in place; cancelling makes no change
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
- Landing and wizard state: new/saved entry paths, explicit report type, field search, tag dismissal, progressive filters, back-navigation persistence and validation gating.
- Queue: status-conditional named actions, draft-aware navigation, narrow presentation and polling start/stop.

**E2E (Playwright — new tests; no Cypress):**
1. Sync happy path: build small export → immediate download.
2. Async path: over-threshold export → 202 → queue shows QUEUED→READY → download.
3. PII lock: user without PII keys sees locked groups; submission never contains PII columns.
4. Report type: choose Referrals → matching catalog only → changing type after selection explicitly clears fields.
5. Saved report: save → landing page → load with blank dates → overwrite-confirm flow.

**CI gates:** `mvn spotless:check`, `mvn clean install`, Playwright suite — all green before merge to `develop`.



### MVP mock acceptance checkpoint

Continue with the [current design-readiness checkpoint](#14-design-revision-and-implementation-readiness).
Its acceptance covers the wizard, saved choices, queue recovery, reporting meaning,
access examples and fictional CSV limitation. Do not maintain a separate checklist here.

Technical checks and a published mock are not owner acceptance or application
implementation. The interactive HTML preview is the source for these mock paths;
its in-memory timers represent queue behavior without implementing a worker.

## 14. Design revision and implementation readiness

**Goal:** Deliver a reviewed, implementation-ready OpenELIS reporting MVP design
that supports an equal mix of new exports and rerunning familiar reports, while
retaining configurable fields, OpenELIS styling and reliable recovery.

**Status (2026-09-11):** The v1.3 mock and Sections 1–13 have been revised together
on design PR #315. Browser validation, live gallery publication and owner acceptance
remain pending. A passing automated check does not approve the revised design.

### Artifact ownership

| Artifact | Responsibility |
| --- | --- |
| This specification, including section 14 | OpenELIS product requirements, this checkpoint's sequence, decisions and acceptance. Keep one progress register here. |
| [Interactive mock](custom-data-export.html) and [fictional example helper](custom-data-export-example.js) | Current OpenELIS review experience and downloadable fictional CSV. |
| [Gallery compatibility wrapper](custom-data-export.jsx) | Preserves existing registry and manifest links by rendering the authoritative HTML. It contains no competing workflow. |
| [Integration roadmap](https://github.com/pmanko/clinical-ai-validation-harness/blob/main/specs/openelis-reporting-catalyst-integration.md) | Cross-project milestones, source parity and shared-access decisions; links here for OpenELIS progress. |
| [Catalyst integration design](https://github.com/DIGI-UW/catalyst-ai/blob/main/docs/specs/openelis-reporting-integration/spec.md) | Catalyst's independent connected-source workflow. OpenELIS screens stay in this repository. |

### Delivery checkpoints

| ID | Work and acceptance | Status |
| --- | --- | --- |
| R1 — Establish the implementation baseline | Inspect current OpenELIS code and relevant open/merged work for OGC-479, OGC-481 and OGC-483. Identify reusable components, duplicate efforts and missing behavior. Resolve product decisions that block the first implementation slice; record evidence and any owner decision here. | Baseline complete; owner decisions below remain the implementation gate |
| R2 — Revise mock and specification together | Implement the UX changes below in the existing review surface and reconcile every affected requirement, acceptance case and localization entry. Both new and repeat-report journeys remain complete. Every old requirement is retained, amended with rationale or explicitly deferred. | Complete in PR #315; owner acceptance remains R4 |
| R3 — Validate and publish for review | Run focused browser journeys and existing repository tests/build. Inspect desktop and narrow screenshots, keyboard/focus, recovery and downloaded CSV. Publish through the existing gallery, verify the actual live source revision/assets, and provide usable review links. | Local checks complete; live publication pending merge |
| R4 — Review and hand off | Record owner review and resolve blocking findings. Prepare small implementation slices linked to the existing stories, with code ownership, dependencies and behavioral acceptance. The first slice needs no unresolved product assumptions. | Pending |

### Baseline evidence — 2026-09-11

- OpenELIS `develop` was refreshed at `672c92a6`. The current Reports menu still
  routes Routine CSV to `CISampleRoutineExport` from
  `frontend/src/components/reports/Routine.jsx`.
- `CSVRoutineSampleExportReport.java` remains a synchronous, fixed-column generator.
  No configurable-field builder, personal saved-report store or personal async
  report queue was found in the current product path. The existing FHIR data-export
  status administration code serves a different purpose and is not reusable as
  the staff report queue without a deliberate design change.
- No open GitHub pull request or issue matching OGC-479, OGC-481, OGC-483,
  Custom Data Export or My Report Queue was found in `DIGI-UW/OpenELIS-Global-2`.
- Jira currently records OGC-479 as **Selected for Development**, assigned to
  mozzy mutesa; OGC-481 and OGC-483 are **Backlog** and unassigned. The three
  stories therefore describe the intended split but do not show an active
  implementation for the queue or saved reports.
- Reuse targets are the existing Reports navigation, Carbon form/table patterns,
  localization pipeline, role-module permissions, Printed Reports Configuration
  area and Patient Report Print Queue conventions. Reuse must be confirmed in
  the implementation checkout rather than inferred from this mock.

The v1.3 mock/spec revision:

- Give new exports and saved reports clear entry points. New exports retain three
  steps; a saved setup opens at a fresh reporting period, with field editing available.
- Makes report type explicit before field selection and provides searchable fields,
  sensible grouping and selected labels without removing permitted coverage.
  FR-1-002/008/009 replace the all-expanded and implicit family-lock rules.
  Preserve incompatible-family prevention and explain it separately from permissions.
- Keep the period, date basis, lab scope and active filters visible. Reveal less
  common filters on request; retain their values. Empty dates must not display a
  reversed-range error. Update FR-2-007 and the matching tests.
- Provide direct Change actions from review, preserving input and returning to
  review. Make Create CSV the primary action and saving a reusable setup optional;
  distinguish its name from the generated file name. Reconcile FR-7 and its acceptance.
- Clarify starting a new export versus continuing the retained draft. Keep Download,
  Retry and Re-run understandable and reachable on narrow screens; preserve failure,
  expiry and fresh-period behavior. Reconcile queue requirements and acceptance.
- Use existing Carbon components/patterns, including keyboard-operable accordions,
  visible focus and clear error associations. Keep preview-only controls separate
  from the staff workflow. Reuse existing localization keys where appropriate.

The rationale is to reveal relevant choices without reducing capability, following
[Carbon form guidance](https://carbondesignsystem.com/patterns/forms-pattern/) and
[progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
Review editing follows the [check-answers pattern](https://design-system.service.gov.uk/patterns/check-answers/);
accordion behavior follows [W3C guidance](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).
These guides inform the design; they do not establish usability with lab staff.

### Decisions and implementation handoff

| Decision for the first complete path | Proposed review default | State |
| --- | --- | --- |
| Output rows | Sample & Testing, one row per individual result; repeated accessions are expected when an accession has multiple results | Owner review pending |
| Reporting period | Inclusive collection dates in the laboratory server timezone | Owner review pending |
| Result state | Validated results for the first virology path; corrected-result representation must be verified against the production model | Owner review pending |
| Duplicates and missing values | Preserve distinct result records; write missing values as blank CSV cells; never deduplicate by matching display values alone | Owner review pending |
| Existing Routine CSV | Coexist during development; decide replacement only after CSV comparison and owner acceptance | Owner review pending |
| Permission loss | Recheck access before generation and download, retain the draft, and explain denial. Reconcile this with BR-004 before implementation. | Owner review pending |

Before declaring readiness, settle output row meaning (including BR-012's
selection-dependent grain), date boundaries/timezone, status/correction handling,
duplicates and missing values for the first complete export. Decide whether the
Routine CSV entry point is replaced or retained. Resolve what the user sees when
permissions change before execution or download, including BR-004's silent column
omission. Validate proposed reuse and backend assumptions against actual OpenELIS
code; do not infer implementation from this mock or invent a replacement data platform.

Start implementation with one complete, bounded export journey that includes
retrieval and failure recovery, then expand required coverage and saved-report
capabilities in manageable slices. The seven-domain product scope remains required
unless explicitly amended; the seven-column fictional example is not the whole MVP.
Preserve the companion-release requirement for export generation and its queue.

Each slice must name its existing story/owner or unassigned ownership, dependency,
affected component, completion behavior and relevant tests. Record actual
implementation, merge, deployment and acceptance separately when those stages begin.
Detailed application tasks should live with their owning OpenELIS work, linked here.

#### Manageable implementation slices

| Slice | Owning story | Concrete result | Dependencies and acceptance |
| --- | --- | --- | --- |
| A — one virology CSV path | OGC-479 + OGC-481 | Authorized user selects the seven fictional-example fields, chooses an inclusive collection period, creates a job and retrieves a UTF-8 CSV through the real queue path | Owner accepts the six decisions above; backend verifies lab scope and row identity; focused service/API tests and one browser download path pass |
| B — reporting shell and field catalog | OGC-479 | Landing page, explicit report type, complete authorized catalog, field search, required/common/more filters, review Change actions and retained draft use Carbon/OpenELIS components | Slice A contracts exist; keyboard, validation and permission states pass component/browser tests |
| C — queue resilience | OGC-481 | Personal queue covers generating, ready, failed/retry and expired/re-run states with named responsive actions and notification behavior | Ships in the same release as OGC-479; restart, ownership, polling and file-retention tests pass |
| D — saved report settings | OGC-483 | Save, list, load with fresh dates, replace, rename/delete and stale-field handling | Builder contracts stable; personal ownership and limit tests pass |
| E — full required coverage | OGC-479 | All seven domains, three row grains, optional filters, identifying-data audit and correction/status rules are implemented | Production model verification and representative-data acceptance pass; does not rely on the seven-column fixture alone |

Slice A is the first implementation checkpoint. It crosses submission, generation,
queue retrieval and CSV verification so the project tests the risky path early.
Slices B–E may use separate reviewable pull requests, but OGC-479 and OGC-481 remain
a single release boundary.

### Validation and completion

Exercise new export creation, saved-setup reruns with fresh dates, review edits,
empty/invalid periods, duplicate setup names, navigation with drafts, failed jobs,
retries, expiry, restricted access and actual fictional CSV download. Check column
values, row meaning and exclusions, not only counts. Recheck manual date entry;
the prior browser inspection used the example shortcut after unreliable automated
native-date input. Inspect desktop/narrow screenshots and keyboard interaction.
Use the existing OpenELIS theme; this checkpoint does not add a dark theme.

Local validation on 2026-09-11 exercised both landing paths, explicit report
type, field-label search, empty-date validation, the 31-day queued path, review
Change actions, sign-in recovery, deliberate new-versus-continue behavior and
the ready/failed/expired queue actions. Keyboard Enter toggled the Test Results
accordion. At 390 × 844 the queue reflowed without page-level horizontal overflow.
The ready-job download link contains the expected BOM-prefixed seven-column,
five-row fictional CSV; the fixture tests independently check canonical order,
quoting, repeated accessions and blank cells. The browser logged no application
errors. The repository's 268 tests and production gallery build passed; the build
still reports pre-existing duplicate-key warnings in unrelated designs.

| Acceptance record | Current state |
| --- | --- |
| Revised mock/spec agreement and focused behavior checks | Complete locally: landing, new/saved paths, field search, required dates, draft/sign-in recovery, queue actions and keyboard accordion checked |
| Repository tests/build and verified live gallery revision | 268 gallery tests and production build pass; live revised gallery pending merge/deploy verification |
| Owner design review, including report meaning, access and fixture limitations | Pending R4 |
| Implementation backlog and first-slice readiness | Pending R1/R4 |
| Representative staff usability sessions | Not performed; arrange a small round if participants are available, otherwise record it as pending with the remaining usability uncertainty |
| Application implementation, deployment and real-source parity | Outside this design-readiness goal; tracked separately |

Completion requires R1–R4, a synchronized mock/spec, verified live preview, recorded
owner acceptance and an actionable first implementation slice. Do not claim staff
validation from automated checks. Keep raw screenshots, traces and session evidence
outside Git; retain concise requirement rationale and validation outcomes here.

OpenELIS continues to work without AI. Patient printing, Jasper replacement,
scheduling and dashboards remain outside this goal. Catalyst's approved upgrade
continues independently; shared sign-in, equivalent authorization and real-source
CSV/Dataset parity remain requirements of the separate integration milestones.

### Copyable goal

```text
Finish the OpenELIS reporting MVP v1.3 design-readiness checkpoint in
DIGI-UW/openelis-work PR #315. Treat designs/reports/custom-data-export.md
Section 14 as the progress register, custom-data-export.html as the authoritative
interactive workflow, and custom-data-export-example.js as the fictional CSV
fixture. Verify the completed R1 baseline and R2 mock/spec revision, then complete
R3 and R4: resolve the six recorded owner decisions, rerun focused browser and
repository checks, merge and verify the live gallery revision, and record owner
acceptance. Keep the harness roadmap PR #134 synchronized by link and milestone
state only. Finish with one accepted mock/spec, a verified public review URL, and
Slice A ready to implement across OGC-479 and OGC-481 as a complete authorized
virology export, queue and CSV-retrieval journey. Preserve OpenELIS/Carbon styling,
the full required field catalog, retained drafts, permissions and failure recovery.
Keep staff usability testing, production APIs/authentication/database work and
real-source Catalyst parity as separately tracked milestones.
```
