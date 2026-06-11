# Patient Report Print Queue
## Functional Requirements Specification — v1.1

**Version:** 1.1 (revised after `/analyze`)
**Date:** 2026-06-09
**Status:** Draft for Review
**Jira:** [To be assigned]
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Status Report, Results Validation, Report Tracking (DocumentTrack), Audit Trail (History)

> **Revision note (v1.1):** Reworked audit handling to reuse the existing `DocumentTrack`
> report-tracking + `History` audit-trail infrastructure instead of a new audit table
> (was CRITICAL); added the Lab Context section; reframed access from an invented
> `PATIENT_REPORT` key to the real `system_module` / `system_role_module` model; mapped
> the critical indicator to the existing result abnormal flag; declared Envers coverage.

---

## Table of Contents

1. Lab Context
2. Overview & Navigation
3. User Stories
4. User Roles & Access
5. Functional Requirements
6. Data Model
7. API Endpoints
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Audit Trail & History
13. Acceptance Criteria

---

## 1. Lab Context

*Written for a developer who has never worked in a clinical laboratory. Read this first.*

### Current State

When a clinical lab finishes testing a patient's sample, a senior technologist "validates"
(signs off on) the results. After that, a printed paper report has to reach the doctor or
ward that ordered the test. Today in OpenELIS Global, the person who prints these reports —
typically a reporting clerk — has to go to a report page and manually set it up every time:
pick the originating site, type in a date range, or key in lab/accession numbers one at a
time. ("Accession number" is the unique ID printed on a sample when it arrives — one sample
intake equals one accession.) There is no screen that simply shows "here is everything that
has been validated and still needs to be printed."

### Pain

Because nothing tracks what has and hasn't been printed, clerks lose their place. After a
shift change, the incoming clerk has no way to know which validated reports the previous
clerk already printed, so reports get printed twice or, worse, missed entirely. The most
dangerous case: a report is printed, then a few hours later an additional test on the *same*
accession is validated — the already-printed report is now out of date, but nothing flags
that it needs reprinting, so the ward never receives the new result. There is also no record
of when each report was printed, which is a gap for ISO 15189 (the international quality
standard for medical laboratories) clause 7.4.1.4, which requires labs to be able to show
when results were released.

### What Changes

The clerk opens one page — the Print Queue — and immediately sees every accession with
newly validated results that hasn't been printed yet, newest first, with no manual setup.
They can narrow the list by site, ward, or requesting doctor, tick the ones they want, and
print them in a batch. The moment a report's PDF is generated, that accession flips to
"Printed" and the print event is recorded in the standard report-tracking and audit history
that OpenELIS already keeps for documents. If a new result later lands on an
already-printed accession, that accession automatically pops back into the queue marked
"Amended," so the clerk knows to re-send it. Nobody has to remember what they printed; the
queue remembers for them.

---

## 2. Overview & Navigation

The Patient Report Print Queue is a new operational workbench page that automatically
surfaces all accessions with newly validated or amended results that have not yet been
printed. It replaces today's manual, pull-based report setup with a push-based queue:
accessions enter the queue when their results pass validation, and leave the "unprinted"
state when a PDF is generated. Each print is recorded through the existing report-tracking
and audit-history mechanism, satisfying the ISO 15189 (International Organization for
Standardization standard for medical laboratories) clause 7.4.1.4 release-record requirement.

### Navigation & URL

- **SideNav placement:** `Reports → Patient Report Print Queue` — a new item in the existing
  Reports section of the left navigation, listed alongside `Patient Status Report`. It does
  not replace or modify any existing page.
- **Breadcrumb:** `Home / Reports / Patient Report Print Queue`
- **URL route:** `/PatientReportPrintQueue` (new React route under the Reports area;
  registered as a `system_module` with a `system_module_url` so it can be granted to roles —
  see Security & Permissions). Deep-linkable; filter state is session-scoped, not encoded in
  the path.

---

## 3. User Stories

- **As a reporting clerk,** I want validated-but-unprinted reports to appear automatically in
  one list so that I never have to remember which accessions still need printing after a shift
  change.
- **As a reporting clerk,** I want to filter the queue by site, ward, and requesting doctor and
  print a batch at once so that I can clear a ward's reports in a single action.
- **As a reporting clerk,** I want an accession to return to the queue marked "Amended" when a
  new result is validated after it was already printed so that the ward always gets the
  corrected report.
- **As a lab manager,** I want every print and reprint recorded in the report history so that I
  can demonstrate when results were released during an ISO 15189 audit.

---

## 4. User Roles & Access

Access is **not** controlled by a new permission key. It is governed by the existing
role/module model: the Print Queue page is registered as a `system_module` and granted to
roles via `system_role_module` (the same mechanism that gates `Patient Status Report`).

| Role (existing) | Gets access by | Notes |
|---|---|---|
| Any role that today holds **Reports** access (e.g. the role(s) granting Patient Status Report) | Existing role→module grant, extended to the new module URL via Liquibase | Default: grant the new module to the same roles that already see Patient Status Report |
| Global Administrator | Has all modules | — |

No new granular per-action permission strings are introduced. First-print and reprint are
the same page action and are gated by the same module grant; they are distinguished only in
the recorded audit event type (see Audit Trail & History).

---

## 5. Functional Requirements

### 5.1 Queue Display & Loading

**FR-1-001:** The system MUST display a paginated DataTable of accessions with newly validated
results, scoped to the user's configured time window preference (system default: last 7 days).

**FR-1-002:** Each row MUST represent one accession (lab order). A patient with multiple
accessions with new results MUST appear as multiple rows.

**FR-1-003:** The queue MUST load automatically on page open, without the user submitting a
form or clicking a generate button.

**FR-1-004:** The queue MUST display these columns: Accession Number, Patient Name, Facility
(originating site), Ward / Dept / Unit, Requestor, Validated At, Status, and a Print action.

**FR-1-005:** The "Validated At" column MUST display the timestamp of the most recent
validation event that placed (or re-placed) the accession in the queue. This is the same value
persisted as `queuedAt` on the queue entry; the column label is "Validated At" but is backed
by the `queuedAt` field. No separate elapsed-time calculation is required.

**FR-1-006:** If any result on the accession carries the result **abnormal** flag at or beyond
the panic/critical threshold, the row MUST display a red "Critical Value" Tag alongside the
status tags. *(See Data Model — this reuses the existing result abnormal flag; a dedicated
panic-threshold concept is a declared dependency, not a new invented field.)*

### 5.2 Filtering & Search

**FR-2-001:** The toolbar MUST provide: Facility (ComboBox with search), Ward / Dept / Unit
(ComboBox with search), Requestor (ComboBox with search), Print Status (Select: All, Unprinted,
Printed), and Time Window (Select, persisted to user preference).

**FR-2-002:** When the underlying data associates a ward/dept/unit value with a facility,
selecting a facility SHOULD restrict the ward list to that facility's wards; where no such
association exists in the data, all ward values are shown. *(The facility→ward relationship is
not a guaranteed parent-child FK in the current schema — see Dependencies.)*

**FR-2-003:** The toolbar MUST include a "Search Patient / Accession" button that opens the
existing patient/accession search modal (lab number, patient name, health ID, national ID, and
other identifiers it already supports). Selecting a result filters the queue to that
patient/accession.

**FR-2-004:** A "Clear Filters" button MUST reset Facility, Ward, Requestor, and Print Status
to default. The Time Window preference MUST NOT be reset by Clear Filters.

**FR-2-005:** Filter state (excluding Time Window) MUST persist within the session.

**FR-2-006:** The Time Window filter MUST offer: Last 24 Hours, Last 7 Days (default), Last 30
Days, All Time.

### 5.3 Print Status Management

**FR-3-001:** Each accession MUST have a print status of UNPRINTED or PRINTED, shown as a Carbon
Tag (UNPRINTED: `purple`; PRINTED: `green`).

**FR-3-002:** When new results are validated on an accession already in PRINTED status, the
accession MUST re-enter the queue with status UNPRINTED and an additional "Amended" Tag
(`blue`).

**FR-3-003:** The "Amended" Tag MUST remain until a new PDF is successfully generated for that
accession after the amendment, at which point `isAmended` is set to false.

**FR-3-004:** The queue MUST default to showing both UNPRINTED and PRINTED accessions within the
time window; the Print Status filter narrows to one or the other.

### 5.4 PDF Generation & Recording

**FR-4-001:** The user MUST be able to generate a report for a single accession (row "Print"
button) or for multiple selected accessions ("Print Selected" batch action). **Single-row
print** opens the PDF in a new browser tab, consistent with existing OpenELIS report behavior.
**Batch print** MUST produce a single combined PDF (all selected reports concatenated) opened
in one new tab, rather than one tab per accession — opening up to 50 tabs is blocked by
browsers and unusable. The user then prints from the browser's native dialog.

**FR-4-002:** On successful generation, the system MUST atomically: (a) transition the
accession to PRINTED, (b) clear `isAmended` if set, (c) set `lastPrintedAt` to the server
timestamp, (d) set `lastPrintedBy` to the current user, and (e) record the print event through
the existing report-tracking + audit-history mechanism (see Audit Trail & History) — no
separate audit table.

**FR-4-003:** Successful generation MUST display an `InlineNotification` of kind `success`
confirming the number of reports generated.

**FR-4-004:** If generation fails for one or more accessions in a batch, the system MUST: (a)
leave failed accessions in their pre-print status, (b) mark successfully generated accessions
as PRINTED, and (c) display an `InlineNotification` of kind `error` identifying which
accessions failed.

**FR-4-005:** A future preview/draft action (out of scope here) MUST NOT change print status or
record a print event, and MUST be visually and API-distinct from the formal print action.

**FR-4-006:** A standalone print-audit page is out of scope. Print history is accessible via the
existing sample/accession record view, which already renders report-tracking history.

### 5.5 User Preferences

**FR-5-001:** The user's Time Window value MUST persist to their server-side profile and restore
across sessions and devices. With no preference record (first visit), defaults apply (Time
Window 7 days, Items Per Page 20) without error; a record is created on first explicit change.

**FR-5-002:** The user's items-per-page value MUST persist server-side; with no record, the
default of 20 is used silently.

**FR-5-003:** Preferences MUST be stored server-side (tied to SystemUser). Browser local storage
MUST NOT be used.

### 5.6 Pagination

**FR-6-001:** The queue MUST use the Carbon `Pagination` component (items per page: 10, 20, 50,
100; default 20).

**FR-6-002:** The total count of matching entries MUST be shown in the pagination control.

---

## 6. Data Model

### New Entities

**ReportPrintQueueEntry** — one accession in the print queue. High-churn operational state.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| sampleId | Long | Yes | FK to Sample (accession) |
| accessionNumber | String | Yes | Denormalized for display |
| patientId | Long | Yes | FK to Patient |
| patientDisplayName | String | Yes | Denormalized: "LastName, FirstName" |
| facilityId | Long | No | FK to Organization (originating/referring site); nullable |
| wardDeptUnit | String | No | Existing order "ward/dept/unit" value; nullable |
| requestorId | Long | No | FK to Provider/Requester; nullable |
| printStatus | Enum | Yes | UNPRINTED, PRINTED |
| isAmended | Boolean | Yes | True if re-queued after a prior print event |
| hasCriticalValue | Boolean | Yes | Derived: any result abnormal flag ≥ panic threshold |
| queuedAt | Timestamp | Yes | Most recent (re)queue time; backs the "Validated At" column |
| lastPrintedAt | Timestamp | No | Set on successful generation; nullable |
| lastPrintedBy | Long | No | FK to SystemUser; nullable |

**UserReportPrintPreference** — one record per user, upserted on preference change.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser; unique |
| defaultTimeWindowDays | Integer | Yes | Default 7; -1 = All Time |
| itemsPerPage | Integer | Yes | Default 20 |

> **Removed in v1.1:** `ReportPrintAuditLog`. Print/reprint events are recorded via the
> existing report-tracking (`DocumentTrack`) + `History` audit-trail infrastructure (see
> Audit Trail & History). No parallel audit table is introduced.

### Reused Existing Entities (no schema change)

- **Sample / Analysis** — source of accession, validation state, and the result **abnormal**
  flag that drives `hasCriticalValue`. Queue population is triggered by listening to the
  existing validation workflow events on Sample/Analysis.
- **Organization** — originating/referring site ("Facility" filter); the same entity used by
  existing site filters. This is filtering received orders by their referring site, **not**
  multi-tenancy.
- **Provider / Requester** — "Requestor" filter.
- **DocumentTrack** — existing report-tracking record created when a report document is
  generated (see Audit Trail & History).

### Envers / Audited coverage

| Entity | `@Audited`? | Rationale |
|---|---|---|
| ReportPrintQueueEntry | **No** | High-churn operational state; status flips frequently. Print events are captured via report-tracking + History instead. |
| UserReportPrintPreference | **Yes** | Low-volume user configuration; row-level history is cheap and useful. |

### Dependencies (data not guaranteed present today)

- **Panic/critical threshold** — `hasCriticalValue` is derived from the existing result
  abnormal flag. If the deployment needs a dedicated panic threshold distinct from "abnormal,"
  that threshold is a named dependency, and this indicator MUST harmonize with the
  critical-result-acknowledgment work (criticals surfacing in the alerts/Attention feed) rather
  than introduce a parallel critical concept.
- **Facility→ward association** — the facility→ward cascade (FR-2-002) requires that ward/dept/unit
  values be associable with a facility. If the current order data stores ward/dept/unit as a
  free or dictionary value not linked to Organization, the cascade degrades gracefully to
  "show all wards" (FR-2-002) until that association is added.

---

## 7. API Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/rest/reports/print-queue` | List queue entries with filter params | Reports module grant |
| POST | `/rest/reports/print-queue/generate` | Generate combined/single PDF + record print events | Reports module grant |
| GET | `/rest/reports/print-queue/preferences` | Get current user's queue preferences | Reports module grant |
| PUT | `/rest/reports/print-queue/preferences` | Update current user's queue preferences | Reports module grant |

> Print history is read through the existing report-tracking / sample record endpoints; no new
> per-entry audit endpoint is added.

**GET `/rest/reports/print-queue` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| facilityId | Long | Filter by originating/referring site (Organization) |
| wardDeptUnit | String | Filter by ward/dept/unit value |
| requestorId | Long | Filter by requestor |
| printStatus | String | UNPRINTED, PRINTED; omit for all |
| timeWindowDays | Integer | 1, 7, 30, or -1 (all time); defaults to user preference |
| page | Integer | 0-indexed page number |
| pageSize | Integer | Items per page |
| search | String | Free-text on accession number or patient display name |

**POST `/rest/reports/print-queue/generate` — Request Body:**

```json
{ "accessionIds": [1, 2, 3] }
```

**Response:** per-accession success/failure status for partial-batch handling.

---

## 8. Business Rules

**BR-001:** A queue entry is created when one or more results on an accession pass validation
for the first time.

**BR-002:** If a queue entry exists with printStatus = PRINTED and new results pass validation
on that accession, the entry's printStatus MUST reset to UNPRINTED, `isAmended` set to true, and
`queuedAt` updated to now.

**BR-003:** PDF generation MUST atomically update the queue entry **and** record the print event
(via report-tracking + History). Partial state (status updated but no recorded event) MUST NOT
persist.

**BR-004:** On partial batch failure, successfully generated accessions MUST be marked PRINTED
and recorded; failed accessions MUST remain in their pre-generation status; partial success MUST
be reported.

**BR-005:** The queue is scoped by `queuedAt` against the user's time window; entries older than
the window are excluded unless "All Time" is selected.

**BR-006:** The "Amended" Tag is cleared (isAmended=false) only on successful PDF generation
after the amendment. Viewing/previewing does not clear it.

**BR-007:** Where the data associates ward/dept/unit with a facility, ward options are restricted
to the selected facility; otherwise all ward values are shown.

**BR-008:** The recorded print event type is FIRST_PRINT if `lastPrintedAt` was null at
generation time; REPRINT if it was already set. (This maps to the report-tracking `ReportType` /
History event, not a new table.)

**BR-009:** A single batch print MUST NOT exceed 50 accessions. Selecting more than 50 disables
"Print Selected" with an explanatory tooltip. The API MUST reject >50 IDs with HTTP 400 and key
`error.printQueue.batchLimitExceeded`.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `nav.reports` | Reports |
| `nav.printQueue.menuItem` | Patient Report Print Queue |
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
| `placeholder.printQueue.facilitySearch` | Search facilities... |
| `placeholder.printQueue.wardSearch` | Search wards... |
| `placeholder.printQueue.requestorSearch` | Search requestors... |
| `placeholder.printQueue.allFacilities` | All Facilities |
| `placeholder.printQueue.allWards` | All Wards |
| `placeholder.printQueue.allRequestors` | All Requestors |
| `message.printQueue.printSuccess` | {count} report(s) generated and marked as printed. |
| `message.printQueue.reprintSuccess` | Report regenerated. Reprint recorded. |
| `message.printQueue.partialSuccess` | {success} of {total} report(s) generated. {failed} failed — see details. |
| `message.printQueue.empty` | No reports in queue |
| `message.printQueue.emptySubtext` | All reports have been printed, or no results have been validated in the selected time window. |
| `message.printQueue.tableDescription` | Accessions with newly validated results awaiting printing. |
| `message.printQueue.itemsSelected` | {count} item(s) selected |
| `error.printQueue.printFailed` | Failed to generate report for accession {accessionNumber}. Please try again. |
| `error.printQueue.loadFailed` | Failed to load print queue. Please refresh the page. |
| `error.printQueue.invalidTimeWindow` | Invalid time window selection. |
| `error.printQueue.invalidItemsPerPage` | Invalid items per page selection. |
| `error.printQueue.invalidAccession` | One or more selected accessions are invalid. |
| `error.printQueue.noAccessionSelected` | Please select at least one accession to print. |
| `error.printQueue.batchLimitExceeded` | Batch print is limited to 50 accessions. Please reduce your selection. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| timeWindowDays (preference) | One of 1, 7, 30, -1 | `error.printQueue.invalidTimeWindow` |
| itemsPerPage (preference) | One of 10, 20, 50, 100 | `error.printQueue.invalidItemsPerPage` |
| generate: accessionIds | At least one ID | `error.printQueue.noAccessionSelected` |
| generate: accessionIds | All reference valid, validated accessions | `error.printQueue.invalidAccession` |
| generate: accessionIds | No more than 50 IDs | `error.printQueue.batchLimitExceeded` |
| wardDeptUnit filter | If facility provided and association exists, value must belong to that facility | Silently ignored; server returns empty ward list |

---

## 11. Security & Permissions

Access uses the existing `system_module` / `system_role_module` model (agent=ROLE); module
mappings are added via Liquibase. No new permission key is introduced.

| Action | Gate | UI Behavior if Denied |
|---|---|---|
| View Print Queue page | Reports-module grant on the user's role | Menu item hidden; direct URL returns HTTP 403 |
| Load queue entries | Same | Page not rendered; HTTP 403 on API call |
| Generate PDF (first print or reprint) | Same | Print buttons hidden; API returns HTTP 403 |
| Update preferences | Same | Preference controls hidden; API returns HTTP 403 |

**Module registration (Liquibase):** add the page as a `system_module` with its
`system_module_url`, and `system_role_module` rows granting it to the same role(s) that already
hold Patient Status Report access on upgrade.

**Mid-session permission loss:** If the user's role loses the Reports grant while the page is
open, the next API call MUST return HTTP 403; the frontend MUST handle a 403 on any print-queue
endpoint by redirecting to home and showing a session-permission error. The menu item MUST be
hidden on the next full page load.

---

## 12. Audit Trail & History

This feature does **not** introduce an audit table. It reuses OpenELIS's existing
report-tracking and audit-history infrastructure:

- On successful generation, a report-tracking record is created/updated via
  `IReportTrackingService` / `ReportTrackingService` (the same path existing patient reports
  use — `DocumentTrack` + `ReportType`), capturing the document, accession, timestamp, and user.
- The event is surfaced in the audit trail through the existing `History` mechanism (the same
  `ReportHistoryService` that already renders report events on the sample/accession record).
- **Event type:** FIRST_PRINT vs REPRINT is derived per BR-008 and recorded as the report-tracking
  type / History event — not a new column on a new table.
- **Actor** is auto-captured from Spring Security; **payload** is limited to accession id, document
  reference, type, and timestamp (no extra PII).

This satisfies the ISO 15189 7.4.1.4 release-record requirement using infrastructure the lab is
already audited on.

---

## 13. Acceptance Criteria

### Functional

- [ ] **[FR-1-001, FR-1-003, §4]** A user whose role holds the Reports grant can open Reports → Patient Report Print Queue; the queue loads automatically scoped to the time-window preference (default 7 days)
- [ ] **[FR-1-002]** Each row is one accession; a patient with 3 accessions with new results shows as 3 rows
- [ ] **[FR-1-004]** Columns: Accession Number, Patient Name, Facility, Ward / Dept / Unit, Requestor, Validated At, Status, Print action
- [ ] **[FR-1-006]** A row whose result abnormal flag is at/above the panic threshold shows a red "Critical Value" Tag
- [ ] **[FR-3-001]** Unprinted = purple Tag; Printed = green Tag
- [ ] **[FR-3-002, FR-3-003]** Amended accessions show a blue "Amended" Tag alongside status; it clears after the next successful generation
- [ ] **[FR-2-001, FR-2-002]** Filter by Facility, Ward, Requestor, Print Status, Time Window; where ward↔facility association exists, selecting a facility restricts the ward list; otherwise all wards show
- [ ] **[FR-2-003]** "Search Patient / Accession" opens the existing modal; a selection filters the queue
- [ ] **[FR-2-004]** "Clear Filters" resets Facility/Ward/Requestor/Status but NOT Time Window
- [ ] **[FR-1-001]** Empty-state message shows when nothing matches
- [ ] **[FR-4-001, BR-009]** Selecting up to 50 rows + "Print Selected" produces a single combined PDF in one tab; >50 disables the action with a tooltip
- [ ] **[FR-4-001]** Single-row "Print" opens that report's PDF in a new tab
- [ ] **[FR-4-002, §12]** Successful generation atomically flips to Printed, clears isAmended, sets lastPrintedAt/By, and records a report-tracking + History event with correct type (FIRST_PRINT/REPRINT) — verified via the existing sample record history view, with no new audit table
- [ ] **[FR-4-003]** Success InlineNotification shows the count generated
- [ ] **[FR-4-004]** Error InlineNotification on failure; failed accessions keep prior status; partial batch reports which failed
- [ ] **[BR-002, FR-3-002]** Validating results on a PRINTED accession resets it to UNPRINTED, isAmended=true, "Amended" Tag shown
- [ ] **[FR-5-001, FR-5-002]** Time Window and items-per-page persist server-side; restored next session; first-visit defaults applied without error
- [ ] **[FR-6-001, FR-6-002]** Pagination shows total count; supports 10/20/50/100

### Non-Functional

- [ ] **[Principle 1]** All UI strings use i18n keys — zero hardcoded English in JSX (including the breadcrumb `nav.reports` key)
- [ ] Queue loads within 2 seconds for up to 100 entries under normal network conditions
- [ ] **[§11]** Access enforced at both layers — menu hidden when the role lacks the grant; HTTP 403 on all unauthorized API calls; mid-session 403 redirects to home
- [ ] **[Principle 1]** Verified with French and Malagasy locale files — no untranslated key strings visible
- [ ] **[Principle 2]** WCAG 2.1 AA — keyboard navigable, all interactive elements labelled; Carbon tokens only (no hardcoded colors/spacing)

### Integration

- [ ] **[BR-001]** Queue entries are created automatically by the validation workflow on results sign-off — no manual queue management
- [ ] **[FR-2-003]** The existing patient/accession search modal is reused unmodified
- [ ] **[FR-4-001, §12]** PDF generation delegates to the existing patient report generation service; print events are recorded through `IReportTrackingService` + `History`
