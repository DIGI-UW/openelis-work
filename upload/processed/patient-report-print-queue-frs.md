# Patient Report Print Queue
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Draft for Review
**Jira:** [To be assigned]
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Status Report, Results Validation, User Preferences

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

The Patient Report Print Queue is a new operational workbench page in OpenELIS Global that automatically surfaces all accessions with newly validated or amended results that have not yet been printed. It replaces the current manual, pull-based report generation workflow with a push-based queue, enabling reporting clerks to manage their entire print run from a single view without manual configuration per report. Reports are automatically queued when results pass validation, and marked as printed when a PDF is generated — providing a complete audit trail that supports ISO 15189 section 7.4.1.4 compliance.

---

## 2. Problem Statement

**Current state:** Reporting clerks must manually configure report generation each time by selecting a site, entering a date range, or typing accession numbers one at a time. There is no system-managed view of which accessions have unprinted results, and no tracking of whether reports have been communicated to requestors. There is also no audit trail of when results were communicated.

**Impact:** Clerks lose track of unprinted reports, especially after shift changes or when new results are added to previously-printed accessions. The lack of a print audit trail creates compliance risk under ISO 15189 section 7.4.1.4. Report delivery delays negatively impact patient care in wards.

**Proposed solution:** A dedicated Print Queue page automatically populated by the results validation workflow. Each accession with newly validated results appears as a queue entry. Clerks filter by facility, ward, or requestor, select accessions, and generate PDFs in batch or individually. PDF generation auto-marks reports as Printed and creates an immutable audit log entry. Amended accessions (with results validated after a prior print) re-enter the queue with an "Amended" indicator, ensuring re-delivery is not missed.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Reporting Clerk | View & Print | Primary user of this feature |
| Lab Technician | View & Print | If PATIENT_REPORT permission is assigned to role |
| Lab Manager | View & Print | Full access; can view all facilities |
| System Administrator | Full | — |

**Required permission keys:**

- `PATIENT_REPORT` — Existing OpenELIS permission key. Required to access the Print Queue page, view queue entries, generate PDFs (first print and reprint). No new permission keys are introduced by this feature.

---

## 4. Functional Requirements

### 4.1 Queue Display & Loading

**FR-1-001:** The system MUST display a paginated DataTable of accessions with newly validated results, scoped to the user's configured time window preference (system default: last 7 days).

**FR-1-002:** Each row in the queue MUST represent one accession (lab order). If a patient has multiple accessions with new results, each accession MUST appear as a separate row.

**FR-1-003:** The queue MUST load automatically when the page is opened, without requiring the user to submit a form or click a generate button.

**FR-1-004:** The queue MUST display the following columns: Accession Number, Patient Name, Facility, Ward/Dept/Unit, Requestor, Validated At, Status, and a Print action.

**FR-1-005:** The "Validated At" column MUST display the timestamp of the most recent validation event that triggered or re-triggered the queue entry. This single timestamp serves as both the result validation time and the queue entry time; no separate elapsed-time calculation is required.

**FR-1-006:** If any result on the accession is flagged as a critical/panic value, the row MUST display a red "Critical Value" Tag indicator alongside the status tags.

### 4.2 Filtering & Search

**FR-2-001:** The queue toolbar MUST provide the following filters: Facility (ComboBox with search), Ward/Dept/Unit (ComboBox with search, cascaded from facility selection), Requestor (ComboBox with search), Print Status (Select: All, Unprinted, Printed), and Time Window (Select, persisted to user preference).

**FR-2-002:** The Ward filter MUST be cascaded from the Facility filter. Selecting a facility restricts the ward list to wards belonging to that facility. When no facility is selected, all wards are shown.

**FR-2-003:** The toolbar MUST include a "Search Patient / Accession" button that opens the existing patient/accession search modal, supporting search by lab number, patient name, health ID, national ID, and other identifiers supported by the modal. Selecting a result from the modal filters the queue to that patient or accession.

**FR-2-004:** A "Clear Filters" button MUST reset Facility, Ward, Requestor, and Print Status filters to their default state. The Time Window preference MUST NOT be reset by Clear Filters.

**FR-2-005:** Filter state (excluding Time Window preference) MUST persist within the session — navigating away and returning to the page retains the current filter selections.

**FR-2-006:** The Time Window filter MUST offer: Last 24 Hours, Last 7 Days (system default), Last 30 Days, All Time.

### 4.3 Print Status Management

**FR-3-001:** Each accession in the queue MUST have a print status of UNPRINTED or PRINTED, displayed as a Carbon Tag (UNPRINTED: `purple` kind; PRINTED: `green` kind).

**FR-3-002:** When new results are validated on an accession that is already in PRINTED status, the accession MUST re-enter the queue with status UNPRINTED and an additional "Amended" Tag (`blue` kind) displayed alongside the status tag.

**FR-3-003:** The "Amended" Tag MUST remain visible until a new PDF is successfully generated for that accession after the amendment event, at which point `isAmended` is set to false.

**FR-3-004:** The queue MUST default to showing both UNPRINTED and PRINTED accessions within the time window. Users can filter to Unprinted only or Printed only using the Print Status filter.

### 4.4 PDF Generation & Audit Logging

**FR-4-001:** The user MUST be able to generate a PDF report for a single accession using the "Print" button on the row, or for multiple selected accessions using the "Print Selected" batch action. Upon successful generation, each PDF MUST open in a new browser tab, consistent with existing OpenELIS report generation behavior. The user then prints from the browser's native print dialog. For batch actions, each PDF opens in its own tab.

**FR-4-002:** Upon successful PDF generation, the system MUST atomically: (a) transition the accession's print status to PRINTED, (b) clear the `isAmended` flag if set, (c) set `lastPrintedAt` to the current server timestamp, (d) set `lastPrintedBy` to the current user, and (e) create an immutable ReportPrintAuditLog entry with accession number, print type (FIRST_PRINT or REPRINT), timestamp, and user.

**FR-4-003:** Successful PDF generation MUST display an `InlineNotification` with kind `success` confirming the number of reports generated.

**FR-4-004:** If PDF generation fails for one or more accessions in a batch, the system MUST: (a) leave failed accessions in their pre-print status, (b) mark successfully generated accessions as PRINTED, and (c) display an `InlineNotification` with kind `error` identifying which accessions failed.

**FR-4-005:** A preview/draft PDF generation action (if added in a future feature) MUST NOT change print status or create an audit log entry. The formal print action and any preview action MUST be explicitly distinguished in the UI and API.

**FR-4-006:** A standalone audit log page is out of scope for this feature. Print history is accessible via the existing sample/accession record view.

### 4.5 User Preferences

**FR-5-001:** The user's selected Time Window value MUST be persisted to their server-side user profile and restored on subsequent sessions and across devices. If no `UserReportPrintPreference` record exists for the user (e.g., first visit), the system MUST apply the defaults (Time Window: 7 days, Items Per Page: 20) without error. A preference record MUST be created on first explicit preference change.

**FR-5-002:** The user's selected items-per-page value MUST be persisted to their server-side user profile and restored on subsequent sessions. If no record exists, the system default of 20 items per page MUST be used silently.

**FR-5-003:** User preferences MUST be stored server-side (tied to the SystemUser account). Browser local storage MUST NOT be used for preference persistence.

### 4.6 Pagination

**FR-6-001:** The queue MUST use the Carbon `Pagination` component with configurable items per page (options: 10, 20, 50, 100). System default: 20.

**FR-6-002:** The total count of matching queue entries MUST be displayed in the pagination control.

---

## 5. Data Model

### New Entities

**ReportPrintQueueEntry** — Represents one accession in the print queue.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| sampleId | Long | Yes | FK to Sample (accession) |
| accessionNumber | String | Yes | Denormalized for display performance |
| patientId | Long | Yes | FK to Patient |
| patientDisplayName | String | Yes | Denormalized: "LastName, FirstName" |
| facilityId | Long | Yes | FK to Organization (facility/site) |
| wardId | Long | No | FK to Organization (ward); nullable |
| requestorId | Long | No | FK to Provider/Requester; nullable |
| printStatus | Enum | Yes | UNPRINTED, PRINTED |
| isAmended | Boolean | Yes | True if re-queued after a prior print event |
| queuedAt | Timestamp | Yes | When this entry was most recently added or re-added to the queue |
| hasCriticalValue | Boolean | Yes | True if any result is flagged critical/panic |
| lastPrintedAt | Timestamp | No | Nullable; set on successful PDF generation |
| lastPrintedBy | Long | No | FK to SystemUser; nullable |

**ReportPrintAuditLog** — Immutable record of each print event. Never updated after creation.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| sampleId | Long | Yes | FK to Sample |
| accessionNumber | String | Yes | Denormalized |
| printType | Enum | Yes | FIRST_PRINT, REPRINT |
| printedAt | Timestamp | Yes | Server-generated; not user-editable |
| printedBy | Long | Yes | FK to SystemUser |

**UserReportPrintPreference** — One record per user, upserted on preference change.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser; unique constraint |
| defaultTimeWindowDays | Integer | Yes | Default: 7; -1 = All Time |
| itemsPerPage | Integer | Yes | Default: 20 |

### Modified Entities

**Sample (existing)** — No schema changes required. ReportPrintQueueEntry population is triggered by listening to existing validation workflow events on Sample/Result entities.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/reports/print-queue` | List queue entries with filter params | `PATIENT_REPORT` |
| POST | `/api/v1/reports/print-queue/generate` | Generate PDF(s) for one or more accessions | `PATIENT_REPORT` |
| GET | `/api/v1/reports/print-queue/preferences` | Get current user's queue preferences | `PATIENT_REPORT` |
| PUT | `/api/v1/reports/print-queue/preferences` | Update current user's queue preferences | `PATIENT_REPORT` |
| GET | `/api/v1/reports/print-queue/{id}/audit` | Get audit log entries for a queue entry | `PATIENT_REPORT` |

**GET `/api/v1/reports/print-queue` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| facilityId | Long | Filter by facility |
| wardId | Long | Filter by ward (must belong to facilityId if both provided) |
| requestorId | Long | Filter by requestor |
| printStatus | String | UNPRINTED, PRINTED; omit for all |
| timeWindowDays | Integer | 1, 7, 30, or -1 (all time); defaults to user preference |
| page | Integer | 0-indexed page number |
| pageSize | Integer | Items per page |
| search | String | Free-text search on accession number or patient display name |

**POST `/api/v1/reports/print-queue/generate` — Request Body:**

```json
{
  "accessionIds": [1, 2, 3]
}
```

**Response:** Returns per-accession success/failure status for partial batch handling.

---

## 7. UI Design

See companion React mockups:
- `patient-report-print-queue-carbon-mockup.jsx` — Production mockup using `@carbon/react` and `@carbon/icons-react`. Reference for implementation. Cannot be loaded directly in the design gallery due to Carbon import requirements.
- `patient-report-print-queue-gallery-preview.jsx` — Plain React preview using inline styles. Functionally equivalent visual approximation. **Load this file in the design gallery.**

### Navigation Path

Reports → Patient Report Print Queue

This is a new menu item in the Reports section of the left navigation sidebar, added alongside the existing Patient Status Report. It does not replace or modify any existing pages.

### Key Screens

1. **Print Queue Workbench** — Main page with breadcrumb, filter toolbar, DataTable with status tags, and pagination
2. **Batch Print Action** — DataTable batch select → "Print Selected" action generates PDFs for all selected rows, each opening in a new browser tab

### Interaction Patterns

- **Batch select** via `TableSelectAll` / `TableSelectRow` → "Print Selected" batch action in `TableBatchActions`
- **Single row print** via primary "Print" `Button` per row
- **Patient/accession search** via existing modal opened by toolbar "Search Patient / Accession" ghost `Button`
- **Time Window & items-per-page** persisted to user profile via PUT preferences endpoint on change

---

## 8. Business Rules

**BR-001:** A ReportPrintQueueEntry is created when one or more results on an accession pass the validation workflow for the first time.

**BR-002:** If a ReportPrintQueueEntry for an accession already exists with printStatus = PRINTED, and new results pass validation on that accession, the entry's printStatus MUST be reset to UNPRINTED, `isAmended` set to true, and `queuedAt` updated to the current timestamp.

**BR-003:** PDF generation MUST atomically update the queue entry and create the audit log entry. Partial state (e.g., status updated but audit log not created) MUST NOT persist.

**BR-004:** If a batch print operation partially fails, successfully generated accessions MUST be marked PRINTED and their audit logs created. Failed accessions MUST remain in their pre-generation status. Partial success MUST be reported to the user.

**BR-005:** The queue is scoped by `queuedAt` against the user's time window preference. Accessions with `queuedAt` older than the window are excluded unless "All Time" is selected.

**BR-006:** The "Amended" Tag is cleared (isAmended set to false) only when a new PDF is successfully generated after the amendment event. Viewing or previewing the report does not clear the flag.

**BR-007:** Ward filter options are restricted to wards belonging to the selected facility. If no facility is selected, all wards from all facilities are shown.

**BR-008:** The `printType` in ReportPrintAuditLog is FIRST_PRINT if `lastPrintedAt` was null at the time of generation; REPRINT if `lastPrintedAt` was already set.

**BR-009:** A single batch print request MUST NOT exceed 50 accessions. If a user selects more than 50 rows, the "Print Selected" action MUST be disabled and a tooltip MUST explain the limit. The API MUST reject generate requests with more than 50 IDs with HTTP 400 and the error key `error.printQueue.batchLimitExceeded`.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.printQueue.title` | Patient Report Print Queue |
| `heading.printQueue.queueTable` | Print Queue |
| `label.printQueue.accessionNumber` | Accession Number |
| `label.printQueue.patientName` | Patient Name |
| `label.printQueue.facility` | Facility |
| `label.printQueue.ward` | Ward / Dept / Unit |
| `label.printQueue.requestor` | Requestor |
| `label.printQueue.validatedAt` | Validated At |
| `label.printQueue.status` | Status |
| `label.printQueue.timeWindow` | Time Window |
| `label.printQueue.statusFilter` | Print Status |
| `label.printQueue.statusAll` | All |
| `label.printQueue.statusUnprinted` | Unprinted |
| `label.printQueue.statusPrinted` | Printed |
| `label.printQueue.statusAmended` | Amended |
| `label.printQueue.critical` | Critical Value |
| `label.printQueue.timeWindow24h` | Last 24 Hours |
| `label.printQueue.timeWindow7d` | Last 7 Days |
| `label.printQueue.timeWindow30d` | Last 30 Days |
| `label.printQueue.timeWindowAll` | All Time |
| `label.printQueue.printType.firstPrint` | First Print |
| `label.printQueue.printType.reprint` | Reprint |
| `button.printQueue.printSelected` | Print Selected ({count}) |
| `button.printQueue.printSingle` | Print |
| `button.printQueue.search` | Search Patient / Accession |
| `button.printQueue.clearFilters` | Clear Filters |
| `button.printQueue.printing` | Printing... |
| `message.printQueue.printSuccess` | {count} report(s) generated and marked as printed. |
| `message.printQueue.reprintSuccess` | Report regenerated. Reprint logged. |
| `message.printQueue.partialSuccess` | {success} of {total} report(s) generated. {failed} failed — see details. |
| `message.printQueue.empty` | No reports in queue |
| `message.printQueue.emptySubtext` | All reports have been printed, or no results have been validated in the selected time window. |
| `error.printQueue.printFailed` | Failed to generate report for accession {accessionNumber}. Please try again. |
| `error.printQueue.loadFailed` | Failed to load print queue. Please refresh the page. |
| `error.printQueue.invalidTimeWindow` | Invalid time window selection. |
| `error.printQueue.invalidItemsPerPage` | Invalid items per page selection. |
| `error.printQueue.invalidAccession` | One or more selected accessions are invalid. |
| `error.printQueue.noAccessionSelected` | Please select at least one accession to print. |
| `error.printQueue.batchLimitExceeded` | Batch print is limited to 50 accessions. Please reduce your selection. |
| `message.printQueue.tableDescription` | Accessions with newly validated results awaiting printing. |
| `placeholder.printQueue.facilitySearch` | Search facilities... |
| `placeholder.printQueue.wardSearch` | Search wards... |
| `placeholder.printQueue.requestorSearch` | Search requestors... |
| `nav.printQueue.menuItem` | Patient Report Print Queue |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| timeWindowDays (preference) | Must be one of: 1, 7, 30, -1 | `error.printQueue.invalidTimeWindow` |
| itemsPerPage (preference) | Must be one of: 10, 20, 50, 100 | `error.printQueue.invalidItemsPerPage` |
| generate request: accessionIds | Must contain at least one ID | `error.printQueue.noAccessionSelected` |
| generate request: accessionIds | All IDs must reference valid, validated accessions | `error.printQueue.invalidAccession` |
| generate request: accessionIds | Must contain no more than 50 IDs | `error.printQueue.batchLimitExceeded` |
| wardId filter | If facilityId is also provided, wardId must belong to that facility | Silently ignored; server returns empty ward list |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Print Queue page | `PATIENT_REPORT` | Menu item not shown in navigation; direct URL returns HTTP 403 |
| View queue entries | `PATIENT_REPORT` | Page not rendered; HTTP 403 on API call |
| Generate PDF (first print) | `PATIENT_REPORT` | Print button hidden; API returns HTTP 403 |
| Reprint (already-printed accession) | `PATIENT_REPORT` | Print button hidden for printed rows; API returns HTTP 403 |
| Update time window / page size preference | `PATIENT_REPORT` | Preference controls hidden; API returns HTTP 403 |

**Mid-session permission loss:** If a user's role is modified to remove `PATIENT_REPORT` while they have the Print Queue page open, the next API call (queue load, generate PDF, or preference update) MUST return HTTP 403. The frontend MUST handle a 403 response on any print-queue endpoint by redirecting the user to the home page and displaying a session permission error notification. The menu item MUST be hidden on the next full page load.

---

## 12. Acceptance Criteria

### Functional

- [ ] **[FR-1-001, FR-1-003, Section 3]** User with `PATIENT_REPORT` permission can navigate to Reports → Patient Report Print Queue; queue loads automatically on page open scoped to user's time window preference (default 7 days)
- [ ] **[FR-1-002]** Each row represents one accession; a patient with 3 accessions with new results appears as 3 separate rows
- [ ] **[FR-1-004]** Columns displayed: Accession Number, Patient Name, Facility, Ward / Dept / Unit, Requestor, Validated At, Status, and Print action
- [ ] **[FR-1-006]** Rows with any critical/panic-flagged result display a red "Critical Value" Tag
- [ ] **[FR-3-001]** Unprinted accessions display purple "Unprinted" Tag; printed accessions display green "Printed" Tag
- [ ] **[FR-3-002, FR-3-003]** Amended accessions display a blue "Amended" Tag alongside their status Tag; Tag is removed after next successful PDF generation
- [ ] **[FR-2-001, FR-2-002]** User can filter by Facility, Ward (cascaded to selected facility), Requestor, Print Status, and Time Window; selecting a facility restricts Ward filter to that facility's wards only
- [ ] **[FR-2-003]** "Search Patient / Accession" button opens existing search modal; selecting a result filters the queue to that patient/accession
- [ ] **[FR-2-004]** "Clear Filters" resets Facility, Ward, Requestor, and Status filters but NOT the Time Window preference
- [ ] **[FR-1-001]** Queue displays empty state message when no accessions match the current time window and filters
- [ ] **[FR-4-001, BR-009]** User can select up to 50 rows and click "Print Selected" to generate batch PDFs; selecting more than 50 disables the action with an explanatory tooltip
- [ ] **[FR-4-001]** User can click "Print" on a single row to generate a PDF; each PDF opens in a new browser tab
- [ ] **[FR-4-002]** Successful PDF generation atomically transitions accession to Printed, clears isAmended flag, sets lastPrintedAt and lastPrintedBy, and creates a ReportPrintAuditLog entry with correct printType (FIRST_PRINT or REPRINT), timestamp, and user
- [ ] **[FR-4-003]** Success InlineNotification shown after print with count of reports generated
- [ ] **[FR-4-004]** Error InlineNotification shown on failure; failed accessions remain in their pre-print status; partial batch failure reports which accessions failed
- [ ] **[BR-002, FR-3-002]** When results are validated on a PRINTED accession, the entry resets to UNPRINTED with isAmended=true and displays "Amended" Tag
- [ ] **[FR-5-001, FR-5-002]** Time Window and items-per-page preferences persisted to server-side user profile; restored on next session; first-visit defaults (7 days / 20 per page) applied without error
- [ ] **[FR-6-001, FR-6-002]** Pagination shows total count of matching entries; supports 10/20/50/100 items per page

### Non-Functional

- [ ] **[Principle 1]** All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] **[Section 12 NFR]** Queue loads within 2 seconds for up to 100 entries under normal network conditions
- [ ] **[Section 11]** Permissions enforced at both layers — menu item hidden in UI when permission absent; HTTP 403 returned for all unauthorized API calls; 403 mid-session redirects user to home page
- [ ] **[Principle 1]** Feature verified with French and Malagasy locale files loaded — no untranslated key strings visible
- [ ] **[Principle 2]** Page meets WCAG 2.1 AA (keyboard navigable, all interactive elements have accessible labels)

### Integration

- [ ] **[BR-001]** ReportPrintQueueEntry is automatically created by the validation workflow on results sign-off — no manual queue management required
- [ ] **[FR-2-003]** Existing patient/accession search modal is reused without modification
- [ ] **[FR-4-001]** PDF generation delegates to the existing patient report generation service
