# Report Print Queue
## Functional Requirements Specification — v1.3

**Version:** 1.3 (filter bar redesign)
**Date:** 2026-07-06
**Status:** Draft for Review
**Jira:** Epic OGC-1031
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Status Report, Results Validation, Report Tracking (DocumentTrack), Audit Trail (History), Background Jobs

> **Revision note (v1.2):** Generalized from a patient-only print queue into a report-type-agnostic
> **Report Print Queue**. Added a `reportType` discriminator (mapped to the existing
> `ReportTrackingService.ReportType` enum) and a generation lifecycle
> (QUEUED → GENERATING → READY → PRINTED, plus FAILED) so long-running reports can appear here
> while they are being produced and signal the requester when ready. **v1 scope ships patient
> reports only**; other report types and the async generation lifecycle are additive later with no
> schema migration. Also folded in confirmed facts: ward/dept/unit is a real FK child of facility
> (cascade is backed by the parent relationship), and critical results are a real, displayed
> concept.
>
> **Naming:** renamed from "Patient Report Print Queue" to "Report Print Queue" since the surface is
> now generic. If the project prefers to keep it patient-only, revert the name and drop §5.7.
>
> **Revision note (v1.3):** Filter bar redesigned for scale and speed. (1) Facility, Ward / Dept /
> Unit, and Requestor are now **multi-select typeahead** filters (`FilterableMultiSelect` with
> server-side option search) — the deployed reference-data sets run to **thousands** of facilities
> and providers, so options are fetched as the user types rather than preloaded. (2) **Lab No is a
> first-class toolbar filter** — a scan-friendly input on the main page (barcode scan or type +
> Enter), with an optional expandable To field for range lookups. The search modal is removed.
> (3) **Search by Patient opens inline** — a collapsible panel directly under the filter bar (no
> modal), still embedding the existing `SearchPatientForm`. (4) **Targeted searches are exclusive:**
> applying a patient or lab-no search clears and disables the other filters; a prominent Clear
> affordance restores normal filtering. This supersedes v1.2's "search ANDs with other filters"
> rule (old FR-2-003i).

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
(signs off on) the results. After that, a printed paper report has to reach the doctor or ward
that ordered the test. Today in OpenELIS Global, the person who prints these reports — typically
a reporting clerk — has to go to a report page and manually set it up every time: pick the
originating site, type in a date range, or key in lab/accession numbers one at a time.
("Accession number" is the unique ID printed on a sample when it arrives — one sample intake
equals one accession.) There is no screen that simply shows "here is everything that has been
validated and still needs to be printed." The lab also produces other documents — result
exports, malaria case reports, non-conformity notifications — and some aggregate reports take
minutes to hours to build; the clerk kicks one off and then has to remember to come back and
check whether it finished.

### Pain

Because nothing tracks what has and hasn't been printed, clerks lose their place. After a shift
change, the incoming clerk has no way to know which validated reports the previous clerk already
printed, so reports get printed twice or, worse, missed entirely. The most dangerous case: a
report is printed, then a few hours later an additional test on the *same* accession is
validated — the already-printed report is now out of date, but nothing flags that it needs
reprinting, so the ward never receives the new result. For the slow aggregate reports, the clerk
has no visibility into whether a long-running report is still building, finished, or failed —
they re-trigger it "just in case," wasting time. There is also no record of when each report was
printed, a gap for ISO 15189 (the international quality standard for medical laboratories) clause
7.4.1.4, which requires labs to show when results were released.

### What Changes

The clerk opens one page — the Report Print Queue — and immediately sees every report that is
ready to print and hasn't been printed yet, newest first, with no manual setup. Patient reports
land here automatically the moment their results are validated. Other report types (result
exports, case reports, and so on) can land here too: when someone requests a long-running report,
it appears in the queue right away marked "Generating," updates itself to "Ready" when the
background job finishes, and signals the person who asked for it. The clerk filters by site, ward,
or requesting doctor, ticks what they want, and prints in a batch. The moment a report's PDF is
generated, that item flips to "Printed" and the event is recorded in the report-tracking and
audit history OpenELIS already keeps. If a new result later lands on an already-printed patient
accession, it pops back into the queue marked "Amended" so it gets re-sent. Nobody has to
remember what they printed or whether a slow report finished; the queue remembers for them.

---

## 2. Overview & Navigation

The Report Print Queue is a report-type-agnostic operational workbench that surfaces reports that
are **ready to print and not yet printed**, plus (for long-running reports) reports that are still
**being generated**. Each queue entry carries a `reportType` (mapped to the existing
`ReportTrackingService.ReportType` enum) and a `generationStatus` lifecycle. Patient reports —
the first and primary type, and the only type shipped in v1 — enter the queue automatically when
results pass validation and are created directly in the READY state (their PDF is produced
on demand). Long-running report types enter as QUEUED, advance to GENERATING while a background
job runs, then READY when complete, signalling the requester. Prints are recorded through the
existing report-tracking + audit-history mechanism, satisfying ISO 15189 (International
Organization for Standardization standard for medical laboratories) clause 7.4.1.4.

> **Version-agnostic FRS.** This document describes the full feature. Version boundaries
> (patient-only v1; other types + async lifecycle in later versions) are decided in `/breakdown`,
> not here. Concretely: every requirement below applies to patient reports in v1; the
> `reportType`/generation-lifecycle requirements (FR-7-xxx, §5.7) become live as additional types
> are added.

### Navigation & URL

- **SideNav placement:** `Reports → Report Print Queue` — a new item in the existing Reports
  section, listed alongside `Patient Status Report`. It does not replace or modify any existing
  page.
- **Breadcrumb:** `Home / Reports / Report Print Queue`
- **URL route:** `/ReportPrintQueue` (new React route; registered as a `system_module` with a
  `system_module_url` so it can be granted to roles — see §11). Deep-linkable; filter state is
  session-scoped, not encoded in the path.

---

## 3. User Stories

- **As a reporting clerk,** I want validated-but-unprinted reports to appear automatically in one
  list so that I never have to remember which accessions still need printing after a shift change.
- **As a reporting clerk,** I want to filter the queue by site, ward, and requesting doctor and
  print a batch at once so that I can clear a ward's reports in a single action.
- **As a reporting clerk,** I want an accession to return to the queue marked "Amended" when a new
  result is validated after it was already printed so that the ward always gets the corrected
  report.
- **As a clerk who requested a slow aggregate report,** I want it to appear in the queue as
  "Generating" and notify me when it turns "Ready" so that I don't have to keep checking back or
  re-trigger it.
- **As a lab manager,** I want every print and reprint recorded in the report history so that I can
  demonstrate when results were released during an ISO 15189 audit.

---

## 4. User Roles & Access

Access is governed by the existing role/module model: the Report Print Queue page is registered as
a `system_module` and granted to roles via `system_role_module` (the same mechanism that gates
`Patient Status Report`). No new permission key is introduced.

| Role (existing) | Gets access by | Notes |
|---|---|---|
| Any role that today holds **Reports** access (e.g. the role(s) granting Patient Status Report) | Existing role→module grant, extended to the new module URL via Liquibase | Default on upgrade: grant the new module to the same roles that already see Patient Status Report |
| Global Administrator | Has all modules | — |

First-print and reprint are the same page action, gated by the same module grant; they are
distinguished only in the recorded audit event type (see §12). Visibility of a given queue entry
is additionally bounded by report type where a type is itself access-controlled (e.g. result
exports) — see BR-010.

---

## 5. Functional Requirements

### 5.1 Queue Display & Loading

**FR-1-001:** The system MUST display a paginated DataTable of report queue entries, scoped to the
user's configured time window preference (system default: last 7 days).

**FR-1-002:** Each row MUST represent one report queue entry. For patient reports, one entry =
one accession; a patient with multiple accessions with new results appears as multiple rows.

**FR-1-003:** The queue MUST load automatically on page open, without the user submitting a form
or clicking a generate button.

**FR-1-004:** The queue MUST display these columns: Report Type, Subject (Accession + Patient Name
for patient reports; a type-appropriate label for others), Facility (originating site), Ward /
Dept / Unit, Requestor, Validated / Queued At, Completeness (FR-1-007), Status, and a Print action.
*(For v1, every row is a patient report, so the Subject column shows Accession Number + Patient
Name and the Report Type column shows a single value.)*

**FR-1-005:** The "Validated / Queued At" column MUST display the `queuedAt` timestamp — for
patient reports this is the most recent validation event that placed (or re-placed) the entry in
the queue; for other types it is when the report was requested. No separate elapsed-time
calculation is required.

**FR-1-006:** If any result on a patient-report accession carries the result **abnormal** flag at
or beyond the lab's critical/panic threshold, the row MUST display a red "Critical Value" Tag
alongside the status tags. The critical indicator MUST render identically to, and stay harmonized
with, the critical-result-acknowledgment treatment used elsewhere (alerts/Attention feed).

**FR-1-007 — Completeness:** For test-based reports (patient reports), the row MUST show a
**Completeness** indicator reflecting how much of the order is reportable, because a report can be
generated before every test is finalized (unfinished tests print as "pending"):

- A Carbon `Tag`: **Final** (`teal`) when every reportable test on the accession is Finalized;
  **Partial** (`warm-gray`) when at least one reportable test is not yet Finalized (including the
  case where none are — a fully preliminary report).
- A count `reported/total` (e.g. `6/7`, `0/9`) where **reported** = analyses in `Finalized`
  status and **total** = reportable analyses on the accession (all analyses except `Canceled`
  and `SampleRejected`). A compact progress meter MAY accompany the count.
- For report types that are not test-based (async types — Result Export, etc.), the Completeness
  column shows "—" (not applicable); those rows use the generation-status indicator instead
  (FR-7-003).

**FR-1-008 — Inline guidance:** The page MUST carry the standard inline-guidance treatment used
across recent OpenELIS pages, so a first-time clerk understands the queue without training:

- **(a) Page-level info strip.** A Carbon `InlineNotification` (kind `info`, non-dismissible)
  directly under the page title, with a bold lead ("Validated reports land here automatically.")
  followed by a short **status legend** explaining the tags the clerk will see, each rendered as
  the actual Tag beside its one-line meaning: **Unprinted** — validated, not yet printed;
  **Printed** — PDF generated and the release recorded in the report history; **Amended** — new
  results validated after printing, reprint needed; **Generating / Failed** — a requested report
  still being built, or one that needs a Retry.
- **(b) Contextual field helpers.** Short helper text under controls whose behavior is not
  self-evident: Lab No ("Scanning a barcode applies the filter instantly"), Ward when disabled
  ("Select a facility first"), the typeahead dropdowns ("Type 2+ characters to search", "keep
  typing to narrow"), and the Time Window while a targeted search is active ("Ignored while
  searching").
- **(c) State explanations.** The targeted-search strip explains *why* the other filters are
  disabled (FR-2-005c); the empty state explains the two reasons a queue can be empty (all
  printed, or nothing validated in the window).

All guidance strings are localized (§9) — no hardcoded English.

### 5.2 Filtering & Search

**FR-2-001:** The toolbar MUST provide, in order: Report Type (Select; defaults to All — in v1
only Patient Report is selectable), Facility (multi-select typeahead, FR-2-001a), Ward / Dept /
Unit (multi-select typeahead, cascaded — FR-2-002), Requestor (multi-select typeahead, FR-2-001a),
**Lab No** (scan-friendly targeted lookup — FR-2-003), Print Status (Select: All, Unprinted,
Printed), and Time Window (Select, persisted to user preference).

**FR-2-001a — Multi-select typeahead pattern (Facility, Ward, Requestor):** Deployments carry
**thousands** of facilities (Organizations) and requestors (Providers), so these filters MUST NOT
preload their full option list into a static dropdown. Each MUST be a Carbon
`FilterableMultiSelect` whose options are fetched **server-side as the user types**:

- **(a) Typeahead fetch.** Options are queried once the user has typed ≥ 2 characters, debounced
  (~300 ms). The dropdown shows at most 25 matches plus a "keep typing to narrow" affordance when
  more exist. No full-list fetch on page load.
- **(b) Endpoint reuse.** Option lookup reuses the **existing** autosuggest/search endpoints that
  Add Order already uses for its Referring Site and Provider (requester) fields — no new
  reference-data search endpoint is introduced.
- **(c) Multi selection.** The user may select any number of options. Selected values render per
  Carbon convention: a count tag inside the field (e.g. `3` with an ×) plus checkmarks in the
  dropdown; clearing the count tag clears that filter. Selected options remain visible/checked in
  the dropdown even when they no longer match the typed text.
- **(d) Semantics.** Multiple selections within one filter are OR'd (Facility ∈ {A, B}); the
  filters are ANDed with each other, as before.

**FR-2-002:** Ward / Dept / Unit is a subunit of Facility, so the ward filter MUST be **disabled
until at least one facility is selected**, with inline helper text explaining why ("Select a
facility first"). Once enabled, its typeahead searches only wards belonging to the **union of the
selected facilities** (ward is a child Organization of the facility). When that union is small
(≤25 wards), the dropdown SHOULD list all of them on open without requiring typed characters — the
typeahead threshold exists for large sets, not small cascaded ones. When the facility selection
changes, any selected ward that is not a child of a still-selected facility MUST be removed from
the selection automatically; clearing the last facility clears and re-disables the ward filter.

**FR-2-003 — Lab No (first-class toolbar lookup):** The Lab No filter lives directly on the
toolbar — it is the highest-frequency lookup (and the barcode-scan path), so it MUST NOT be hidden
behind a button or modal.

- **(a) Field.** A single input using the existing `CustomLabNumberInput` component (same
  lab-number formatting/validation used elsewhere), placeholder "Scan or type lab number". The
  filter applies on **Enter** — which is also what a barcode scanner's terminator sends, so
  scanning a specimen label applies the filter with no further interaction.
- **(b) Optional range.** A small "Range" ghost toggle beside the field reveals an optional **To
  Lab Number** input. With both filled, applying filters to the inclusive `[From, To]` range —
  typically a sequential print run. Leaving To blank looks up the single lab number. Range bounds
  use the existing accession-number ordering/validation; an invalid lab number surfaces
  `CustomLabNumberInput`'s existing validation, and From > To shows
  `error.printQueue.invalidLabRange`.
- **(c) Result.** The queue is filtered to the matching order(s) — typically one or a handful of
  rows. Applying the lab-no lookup is a **targeted search** and triggers the exclusivity behavior
  of FR-2-005.

**FR-2-004 — Search by Patient (inline panel, no modal):** The toolbar MUST include a "Search by
Patient" ghost button that expands a **collapsible inline panel directly beneath the filter bar**
— the queue table moves down to make room; no `Modal` is used. The panel embeds the **existing**
`SearchPatientForm` component (`frontend/src/components/patient/SearchPatientForm.jsx`); the
component is reused, not reimplemented.

- **(a) Criteria.** The component's existing fields: Patient Id (matched by the backend against
  STNumber, subjectNumber, and nationalID), Previous Lab Number, Last Name, First Name, Date of
  Birth, Gender. No new criteria are added.
- **(b) Local search only.** The component's "External Search" and "Client Registry" modes (which
  exist to *import* new patients) MUST be suppressed here — the queue only contains patients
  already known to this lab. Run with `suppressExternalSearch=true` and the external/registry
  controls hidden.
- **(c) Backend.** Calls the existing `GET /rest/patient-search-results` with the component's
  existing parameters; results and server-side paging (`res.paging`) render unchanged. No new
  search endpoint.
- **(d) Selection.** The component returns a **patient** via its `getSelectedPatient(patient)`
  callback. On selection the panel collapses and the queue applies a **patient filter**
  (`patientId`) — narrowing to all of that patient's queue entries (all of their orders). The
  queue MUST NOT import the patient or navigate away. Applying the patient filter is a **targeted
  search** and triggers the exclusivity behavior of FR-2-005.
- **(e) Dismissal.** Collapsing the panel without selecting a patient (the button toggles, or an
  in-panel close) leaves the queue and filters untouched.

**FR-2-005 — Targeted-search exclusivity:** A patient or lab-no lookup identifies specific
orders, so combining it with the browse filters is meaningless. While a targeted search (FR-2-003
or FR-2-004d) is active:

- **(a) Other filters cleared + disabled.** Applying a targeted search MUST clear Report Type,
  Facility, Ward, Requestor, and Print Status to their defaults and render them (and the Time
  Window control) **disabled** until the search is cleared.
- **(b) All-time scope.** The queue MUST search **all time** for the matched subset, ignoring the
  Time Window selection, so a clerk can pull an older order. The saved Time Window preference is
  untouched.
- **(c) Clear affordance.** An active-search strip MUST display a dismissible Carbon `Tag` —
  "Patient: {name}", "Lab No: {labNo}", or "Lab No: {from}–{to}" — plus an explicit **Clear
  search** button. Either one removes the targeted filter, re-enables the browse filters (at their
  defaults), and restores the window-scoped view.
- **(d) Mutual exclusivity.** Only one targeted search is active at a time: applying a patient
  search replaces an active lab-no lookup and vice versa.
- **(e) No match.** If nothing matches, the queue shows the standard empty state (FR-1-001), not
  an error.
- **(f) Search reaches in-progress orders.** Unlike the auto-populated default view (which lists
  only accessions with ≥1 newly-validated, unprinted result), a targeted search MUST also surface
  matching orders that have tests entered but **no** finalized results yet (a fully preliminary
  `0/n` report) and orders previously printed and outside the time window. Such rows render with
  their Completeness indicator (e.g. Partial `0/9`) and remain printable as a preliminary report
  (FR-4-007). The server resolves matches against Samples/Analyses, not only against persisted
  queue entries; a print on a not-yet-queued match creates the tracking record as usual.

**FR-2-006:** A "Clear Filters" button MUST reset Report Type, Facility, Ward, Requestor, Print
Status, and any active targeted search (FR-2-005) to default. The Time Window preference MUST NOT
be reset by Clear Filters.

**FR-2-007:** Filter state (excluding Time Window) MUST persist within the session.

**FR-2-008:** The Time Window filter MUST offer: Last 24 Hours, Last 7 Days (default), Last 30
Days, All Time.

### 5.3 Print Status Management

**FR-3-001:** Each entry MUST have a print status of UNPRINTED or PRINTED, shown as a Carbon Tag
(UNPRINTED: `purple`; PRINTED: `green`). Print status is meaningful only once the entry is READY
(see §5.7).

**FR-3-002:** When new results are validated on a patient-report accession already in PRINTED
status, the entry MUST re-enter the queue with print status UNPRINTED and an additional "Amended"
Tag (`blue`). *(Amendment applies to patient reports; other report types are re-requested rather
than amended.)*

**FR-3-003:** The "Amended" Tag MUST remain until a new PDF is successfully generated for that
accession after the amendment, at which point `isAmended` is set to false.

**FR-3-004:** The queue MUST default to showing both UNPRINTED and PRINTED entries within the time
window; the Print Status filter narrows to one or the other.

### 5.4 PDF Generation & Recording

**FR-4-001:** The user MUST be able to print a single READY entry (row "Print" button) or multiple
selected READY entries ("Print Selected" batch action). **Single-row print** opens the PDF in a
new browser tab. **Batch print** MUST produce a single combined PDF (selected reports
concatenated) opened in one new tab — never one tab per entry. Non-READY entries are not
printable (the Print action is disabled).

**FR-4-002:** On successful generation, the system MUST atomically: (a) transition the entry's
print status to PRINTED, (b) clear `isAmended` if set, (c) set `lastPrintedAt` to the server
timestamp, (d) set `lastPrintedBy` to the current user, and (e) record the print event through the
existing report-tracking + audit-history mechanism (see §12) — no separate audit table.

**FR-4-003:** Successful generation MUST display an `InlineNotification` of kind `success`
confirming the number of reports generated.

**FR-4-004:** If generation fails for one or more entries in a batch, the system MUST: (a) leave
failed entries in their pre-print status, (b) mark successfully generated entries as PRINTED, and
(c) display an `InlineNotification` of kind `error` identifying which failed.

**FR-4-005:** A future preview/draft action (out of scope) MUST NOT change print status or record
a print event, and MUST be visually and API-distinct from the formal print action.

**FR-4-006:** A standalone print-audit page is out of scope. Print history is accessible via the
existing sample/accession (or report) record view.

**FR-4-007 — Printing a partial (preliminary) report:** The user MUST be able to print a report
whose Completeness is Partial; the generated PDF shows finalized results and "pending" for
not-yet-finalized tests (the existing patient report behavior). Printing a Partial report MUST NOT
require a confirmation step — the row's Completeness Tag and `reported/total` count are the
signal, and the action is low-risk (it opens a PDF; the accession re-queues as Amended when the
remaining tests finalize, BR-002). On print, the system MUST record `printedTestsReported` (the
reported count at print time) in addition to the standard print-event recording (FR-4-002).

### 5.5 User Preferences

**FR-5-001:** The user's Time Window value MUST persist to their server-side profile and restore
across sessions and devices. With no preference record (first visit), defaults apply (Time Window
7 days, Items Per Page 20) without error; a record is created on first explicit change.

**FR-5-002:** The user's items-per-page value MUST persist server-side; with no record, the
default of 20 is used silently.

**FR-5-003:** Preferences MUST be stored server-side (tied to SystemUser). Browser local storage
MUST NOT be used.

### 5.6 Pagination

**FR-6-001:** The queue MUST use the Carbon `Pagination` component (items per page: 10, 20, 50,
100; default 20).

**FR-6-002:** The total count of matching entries MUST be shown in the pagination control.

### 5.7 Generation Lifecycle (long-running reports)

*Applies to report types whose generation is not instantaneous. Patient reports in v1 are created
directly in READY and never exercise QUEUED/GENERATING; the lifecycle is modelled now so it is
additive later.*

**FR-7-001:** Each entry MUST have a `generationStatus` of QUEUED, GENERATING, READY, or FAILED.
An entry is printable only in READY. Patient-report entries MUST be created in READY.

**FR-7-002:** When a long-running report is requested, an entry MUST be created immediately in
QUEUED and a background job enqueued. The entry MUST advance to GENERATING when the job starts and
to READY (with print status UNPRINTED) on success, or FAILED on error.

**FR-7-003:** Generation status MUST render as a Carbon Tag: QUEUED `gray`, GENERATING `blue`
(with a loading affordance), READY `teal`, FAILED `red`. These are distinct from the
UNPRINTED/PRINTED print-status tags and may appear together (e.g. READY + Unprinted).

**FR-7-004:** When an entry transitions to READY, the system MUST signal the requesting user
(in-app notification / Attention feed entry: "{reportType} report is ready"). The queue MUST
reflect the new status without a full page reload (poll or push).

**FR-7-005:** A FAILED entry MUST offer a "Retry" action that re-enqueues generation and returns
the entry to QUEUED. Retry MUST NOT create a duplicate entry.

**FR-7-006:** The "Report Type" and "Print Status" filters MUST be combinable with a generation
filter so a clerk can, for example, view only READY-Unprinted entries. The default view shows all
generation statuses within the time window.

---

## 6. Data Model

### New Entities

**ReportPrintQueueEntry** — one report in the queue. High-churn operational state.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| reportType | Enum | Yes | Maps to `ReportTrackingService.ReportType` (PATIENT, NON_CONFORMITY_NOTIFICATION, RESULT_EXPORT, MALARIA_CASE, …). v1 only sets PATIENT |
| sampleId | Long | No | FK to Sample (accession); set when reportType = PATIENT; nullable otherwise |
| reportParametersJson | String/JSONB | No | Parameters for non-accession reports (date range, site, program); nullable |
| subjectLabel | String | Yes | Denormalized display label (patient: "Accession — LastName, FirstName"; others: type-appropriate) |
| patientId | Long | No | FK to Patient; set for patient reports; nullable otherwise |
| facilityId | Long | No | FK to Organization (originating/referring site); nullable |
| wardId | Long | No | FK to Organization (ward; child of facility); nullable |
| requestorId | Long | No | FK to Provider/Requester; nullable |
| requestedBy | Long | No | FK to SystemUser who requested a long-running report (for the ready-notification); nullable for auto-enqueued patient reports |
| generationStatus | Enum | Yes | QUEUED, GENERATING, READY, FAILED. Patient reports created as READY |
| printStatus | Enum | Yes | UNPRINTED, PRINTED (meaningful once READY) |
| isAmended | Boolean | Yes | True if re-queued after additional results finalized post-print (patient reports) |
| testsReported | Integer | No | Derived: count of analyses in `Finalized` status (patient reports) |
| testsTotal | Integer | No | Derived: count of reportable analyses, excl. `Canceled`/`SampleRejected` (patient reports) |
| printedTestsReported | Integer | No | `testsReported` value at last print; drives the re-queue/Amended check (BR-002); nullable |
| hasCriticalValue | Boolean | Yes | Derived: any result abnormal flag ≥ critical/panic threshold (patient reports) |
| queuedAt | Timestamp | Yes | Most recent (re)queue/request time; backs the "Validated / Queued At" column |
| generatedAt | Timestamp | No | Set when generationStatus → READY; nullable |
| lastPrintedAt | Timestamp | No | Set on successful generation; nullable |
| lastPrintedBy | Long | No | FK to SystemUser; nullable |

**UserReportPrintPreference** — one record per user, upserted on preference change.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser; unique |
| defaultTimeWindowDays | Integer | Yes | Default 7; -1 = All Time |
| itemsPerPage | Integer | Yes | Default 20 |

> **No `ReportPrintAuditLog`.** Print/reprint events are recorded via the existing report-tracking
> (`DocumentTrack` + `ReportType`) and `History` audit-trail infrastructure (see §12).

### Reused Existing Entities (no schema change)

- **Sample / Analysis** — accession, validation state, and the result **abnormal** flag (at/above
  the lab's critical threshold) that drives `hasCriticalValue`. Patient-report population is
  triggered by the existing validation workflow events.
- **Organization** — both the originating/referring site ("Facility") and its child ward ("Ward /
  Dept / Unit"); the facility→ward parent relationship backs the cascade (FR-2-002). Filtering
  received orders by referring site is **not** multi-tenancy.
- **Provider / Requester** — "Requestor" filter.
- **DocumentTrack / ReportTrackingService.ReportType** — existing report-tracking; the queue's
  `reportType` maps to this enum, and print events are recorded here.

### Envers / Audited coverage

| Entity | `@Audited`? | Rationale |
|---|---|---|
| ReportPrintQueueEntry | **No** | High-churn operational state (status flips frequently). Print events captured via report-tracking + History instead. |
| UserReportPrintPreference | **Yes** | Low-volume user configuration; row-level history is cheap and useful. |

### Dependencies

- **Background job runner** — the generation lifecycle (FR-7-002) requires an async job mechanism
  to produce long-running reports and update `generationStatus`. v1 (patient reports only) does not
  exercise it; it is a named dependency for the version that adds the first long-running type.
- **Ready notification channel** — FR-7-004 depends on the in-app notification / Attention-feed
  surface; harmonize with the critical-result-acknowledgment feed rather than introduce a parallel
  signal.

---

## 7. API Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/rest/reports/print-queue` | List queue entries with filter params | Reports module grant |
| POST | `/rest/reports/print-queue/generate` | Generate combined/single PDF + record print events for READY entries | Reports module grant |
| POST | `/rest/reports/print-queue/request` | Request a long-running report → create QUEUED entry + enqueue job | Reports module grant |
| POST | `/rest/reports/print-queue/{id}/retry` | Re-enqueue a FAILED entry | Reports module grant |
| GET | `/rest/reports/print-queue/preferences` | Get current user's queue preferences | Reports module grant |
| PUT | `/rest/reports/print-queue/preferences` | Update current user's queue preferences | Reports module grant |

**GET `/rest/reports/print-queue` — Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| reportType | String | Filter by report type; omit for all (v1: PATIENT) |
| generationStatus | String | QUEUED, GENERATING, READY, FAILED; omit for all |
| facilityIds | Long[] (CSV) | Filter by originating/referring site(s) (Organization); OR'd within the list |
| wardIds | Long[] (CSV) | Filter by ward(s); honored only when facilityIds is present, and each must be a child of a facility in facilityIds; OR'd within the list |
| requestorIds | Long[] (CSV) | Filter by requestor(s); OR'd within the list |
| patientId | Long | Targeted search — all of one patient's orders (FR-2-004). Exclusive: no browse-filter params may accompany it (BR-013) |
| accessionFrom | String | Targeted search — lower bound lab number (FR-2-003). Single lookup when accessionTo omitted. Exclusive per BR-013 |
| accessionTo | String | Upper bound lab number for an inclusive range (FR-2-003b); optional |
| printStatus | String | UNPRINTED, PRINTED; omit for all |
| timeWindowDays | Integer | 1, 7, 30, or -1 (all time); defaults to user preference |
| page | Integer | 0-indexed page number |
| pageSize | Integer | Items per page |
| search | String | Free-text on accession number / subject label / patient name |

**POST `/rest/reports/print-queue/generate` — Request Body:** `{ "entryIds": [1, 2, 3] }` →
per-entry success/failure status for partial-batch handling. Server rejects non-READY entries.

**Filter option lookup (API & Data Reuse):** the Facility, Ward, and Requestor typeahead filters
(FR-2-001a) reuse the **existing** autosuggest/search endpoints that Add Order uses for its
Referring Site and Provider (requester) fields. No new reference-data search endpoint is
introduced; if the existing endpoints cannot restrict wards to a set of parent facilities
(FR-2-002), extending them with a parent-organization parameter is the declared exception.

---

## 8. Business Rules

**BR-001:** A patient-report queue entry (reportType = PATIENT, generationStatus = READY) is
created when one or more results on an accession pass validation for the first time.

**BR-002:** If a PATIENT entry exists with printStatus = PRINTED and **additional results are
finalized** on that accession after the last print (i.e. current `testsReported` >
`printedTestsReported`, whether or not the report has reached Final), the entry's printStatus MUST
reset to UNPRINTED, `isAmended` set to true, and `queuedAt` updated to now. This covers both
correcting/adding results to a previously-Final report and a previously-printed Partial report
gaining further finalized tests. (Generation status remains READY.)

**BR-003:** PDF generation MUST atomically update the queue entry **and** record the print event
(via report-tracking + History). Partial state MUST NOT persist.

**BR-004:** On partial batch failure, successfully generated entries MUST be marked PRINTED and
recorded; failed entries MUST remain in their pre-generation status; partial success MUST be
reported.

**BR-005:** The queue is scoped by `queuedAt` against the user's time window; entries older than
the window are excluded unless "All Time" is selected.

**BR-006:** The "Amended" Tag is cleared (isAmended=false) only on successful PDF generation after
the amendment. Viewing/previewing does not clear it.

**BR-007:** The ward filter is actionable only while at least one facility is selected (it is a
subunit of facility); with no facility selected it is disabled and empty. Ward options are
restricted to wards (child Organizations) belonging to the **union of the selected facilities**. A
selected ward whose parent facility is deselected is removed from the selection automatically;
clearing the last facility clears and re-disables the ward filter (FR-2-002).

**BR-008:** The recorded print event type is FIRST_PRINT if `lastPrintedAt` was null at generation
time; REPRINT if it was already set. (Recorded as the report-tracking type / History event, not a
new table.)

**BR-009:** A single batch print MUST NOT exceed 50 entries. Selecting more than 50 disables "Print
Selected" with an explanatory tooltip; the API rejects >50 IDs with HTTP 400 and key
`error.printQueue.batchLimitExceeded`.

**BR-010:** A long-running report entry advances QUEUED → GENERATING → READY (or → FAILED) driven
by its background job; only the requesting user and roles with access to that report type see the
entry. On READY, the requesting user is notified (FR-7-004). FAILED entries are retryable
(FR-7-005) and are not printable.

**BR-011:** Print status is only actionable when generationStatus = READY. The Print action MUST be
disabled for QUEUED/GENERATING/FAILED entries.

**BR-012:** The two targeted searches are mutually exclusive. **Search by Patient** (inline panel,
FR-2-004) reuses `SearchPatientForm` in local-only mode (`suppressExternalSearch=true`, no Client
Registry); it returns a patient and applies a `patientId` filter (all of that patient's orders).
**Lab No** (toolbar, FR-2-003) takes a single lab number or an inclusive From–To range (entered
via `CustomLabNumberInput`) and applies an `accessionFrom`/`accessionTo` filter. Applying one
clears the other. Neither imports patients nor creates queue entries. The `patient.*` and
`pagination.*` i18n keys the embedded form uses already exist and are NOT redefined here.

**BR-013:** An active targeted search (patient or lab-no) **suspends browse filtering entirely**
(FR-2-005): the server ignores `timeWindowDays` (searches all time) and the client clears and
disables Report Type / Facility / Ward / Requestor / Print Status / Time Window while `patientId`
or `accessionFrom` is supplied — the server MUST NOT receive browse-filter params alongside a
targeted-search param. Clearing the search (dismissible tag or Clear search button) re-enables the
browse filters at defaults and restores the window-scoped view; the saved Time Window preference
is never modified.

**BR-014 — Completeness derivation:** For a patient-report entry, `testsReported` = count of the
accession's analyses in `Finalized` status. `testsTotal` = count of **reportable** analyses,
defined as all analyses except those that will never yield a printed value:
`Canceled`, `SampleRejected`, `TechnicalRejected`, and `BiologistRejected` are all excluded. (A
rejected test is resolved, not pending, so it must not prevent a report from reaching Final.)
Completeness is **Final** when `testsReported == testsTotal` and `testsTotal > 0`, otherwise
**Partial**. These are derived from existing Analysis statuses (no new status concept is
introduced) and recomputed whenever an analysis on the accession changes status. Rejected analyses
are surfaced on the printed report per existing patient-report behavior; they simply do not count
toward the completeness denominator.

**BR-015 — Search surfaces in-progress orders:** A patient or lab-number search resolves matches
against Samples/Analyses across all time, including orders with `testsReported = 0` (preliminary)
and orders not present in the auto-populated queue. The default (non-search) view remains limited
to accessions with ≥1 finalized-and-unprinted result. A print on a search-surfaced order that has
no persisted queue entry creates the entry and tracking record at print time.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `nav.reports` | Reports |
| `nav.printQueue.menuItem` | Report Print Queue |
| `heading.printQueue.title` | Report Print Queue |
| `heading.printQueue.queueTable` | Report Print Queue |
| `label.printQueue.reportType` | Report Type |
| `label.printQueue.subject` | Subject |
| `label.printQueue.accessionNumber` | Accession Number |
| `label.printQueue.patientName` | Patient Name |
| `label.printQueue.facility` | Facility |
| `label.printQueue.ward` | Ward / Dept / Unit |
| `label.printQueue.requestor` | Requestor |
| `label.printQueue.queuedAt` | Validated / Queued At |
| `label.printQueue.status` | Status |
| `label.printQueue.timeWindow` | Time Window |
| `label.printQueue.statusFilter` | Print Status |
| `label.printQueue.generationFilter` | Generation Status |
| `label.printQueue.statusAll` | All |
| `label.printQueue.statusUnprinted` | Unprinted |
| `label.printQueue.statusPrinted` | Printed |
| `label.printQueue.statusAmended` | Amended |
| `label.printQueue.completeness` | Completeness |
| `label.printQueue.completenessFinal` | Final |
| `label.printQueue.completenessPartial` | Partial |
| `label.printQueue.testsReported` | {reported}/{total} |
| `label.printQueue.testsReportedFull` | {reported} of {total} tests reported |
| `label.printQueue.notApplicable` | — |
| `helper.printQueue.timeWindowOverridden` | Ignored while searching |
| `label.printQueue.genQueued` | Queued |
| `label.printQueue.genGenerating` | Generating |
| `label.printQueue.genReady` | Ready |
| `label.printQueue.genFailed` | Failed |
| `label.printQueue.critical` | Critical Value |
| `label.printQueue.reportType.patient` | Patient Report |
| `label.printQueue.reportType.resultExport` | Result Export |
| `label.printQueue.reportType.malariaCase` | Malaria Case Report |
| `label.printQueue.reportType.nonConformity` | Non-Conformity Notification |
| `label.printQueue.timeWindow24h` | Last 24 Hours |
| `label.printQueue.timeWindow7d` | Last 7 Days |
| `label.printQueue.timeWindow30d` | Last 30 Days |
| `label.printQueue.timeWindowAll` | All Time |
| `label.printQueue.printType.firstPrint` | First Print |
| `label.printQueue.printType.reprint` | Reprint |
| `button.printQueue.printSelected` | Print Selected ({count}) |
| `button.printQueue.printSingle` | Print |
| `button.printQueue.retry` | Retry |
| `button.printQueue.searchByPatient` | Search by Patient |
| `heading.printQueue.patientSearchPanel` | Search by Patient |
| `label.printQueue.labNo` | Lab No |
| `placeholder.printQueue.scanLabNo` | Scan or type lab number |
| `button.printQueue.labNoRange` | Range |
| `label.printQueue.labNoFrom` | From Lab Number |
| `label.printQueue.labNoTo` | To Lab Number (optional) |
| `button.printQueue.clearSearch` | Clear search |
| `helper.printQueue.filtersDisabled` | Filters are disabled while a targeted search is active |
| `helper.printQueue.keepTyping` | Showing first {shown} of {total} matches — keep typing to narrow |
| `helper.printQueue.typeToSearch` | Type 2+ characters to search |
| `helper.printQueue.selectFacilityFirst` | Select a facility first |
| `helper.printQueue.scanHint` | Scanning a barcode applies the filter instantly |
| `message.printQueue.pageGuidanceTitle` | Validated reports land here automatically. |
| `message.printQueue.guideUnprinted` | validated, not yet printed |
| `message.printQueue.guidePrinted` | PDF generated and the release recorded |
| `message.printQueue.guideAmended` | new results validated after printing — reprint needed |
| `message.printQueue.guideGenerating` | requested report still being built |
| `message.printQueue.guideFailed` | generation failed — use Retry |
| `label.printQueue.patientFilter` | Patient: {name} |
| `label.printQueue.labNoFilter` | Lab No: {labNo} |
| `label.printQueue.labNoRangeFilter` | Lab No: {from}–{to} |
| `button.printQueue.clearSearchFilter` | Remove search filter |
| `error.printQueue.invalidLabRange` | "From" lab number must not be greater than "To". |
| `button.printQueue.clearFilters` | Clear Filters |
| `button.printQueue.printing` | Printing... |
| `placeholder.printQueue.facilitySearch` | Search facilities... |
| `placeholder.printQueue.wardSearch` | Search wards... |
| `placeholder.printQueue.requestorSearch` | Search requestors... |
| `placeholder.printQueue.allFacilities` | All Facilities |
| `placeholder.printQueue.allWards` | All Wards |
| `placeholder.printQueue.allRequestors` | All Requestors |
| `placeholder.printQueue.allReportTypes` | All Report Types |
| `message.printQueue.printSuccess` | {count} report(s) generated and marked as printed. |
| `message.printQueue.reprintSuccess` | Report regenerated. Reprint recorded. |
| `message.printQueue.partialSuccess` | {success} of {total} report(s) generated. {failed} failed — see details. |
| `message.printQueue.reportReady` | Your {reportType} report is ready to print. |
| `message.printQueue.empty` | No reports in queue |
| `message.printQueue.emptySubtext` | All reports have been printed, or no results have been validated in the selected time window. |
| `message.printQueue.tableDescription` | Reports ready to print, plus reports still being generated. |
| `message.printQueue.itemsSelected` | {count} item(s) selected |
| `error.printQueue.printFailed` | Failed to generate report for {subject}. Please try again. |
| `error.printQueue.generationFailed` | Report generation failed. Use Retry to try again. |
| `error.printQueue.loadFailed` | Failed to load report queue. Please refresh the page. |
| `error.printQueue.invalidTimeWindow` | Invalid time window selection. |
| `error.printQueue.invalidItemsPerPage` | Invalid items per page selection. |
| `error.printQueue.invalidEntry` | One or more selected entries are invalid. |
| `error.printQueue.notReady` | One or more selected entries are not ready to print. |
| `error.printQueue.noEntrySelected` | Please select at least one report to print. |
| `error.printQueue.batchLimitExceeded` | Batch print is limited to 50 reports. Please reduce your selection. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| timeWindowDays (preference) | One of 1, 7, 30, -1 | `error.printQueue.invalidTimeWindow` |
| itemsPerPage (preference) | One of 10, 20, 50, 100 | `error.printQueue.invalidItemsPerPage` |
| generate: entryIds | At least one ID | `error.printQueue.noEntrySelected` |
| generate: entryIds | All reference valid entries | `error.printQueue.invalidEntry` |
| generate: entryIds | All entries in READY generation status | `error.printQueue.notReady` |
| generate: entryIds | No more than 50 IDs | `error.printQueue.batchLimitExceeded` |
| wardId filter | If facilityId provided, wardId must be a child of that facility | Silently ignored; server returns empty ward list |
| accessionFrom (search) | Must be a valid lab number per `CustomLabNumberInput` | Inline field validation |
| accessionFrom / accessionTo | From must not be greater than To | `error.printQueue.invalidLabRange` |

---

## 11. Security & Permissions

Access uses the existing `system_module` / `system_role_module` model (agent=ROLE); module
mappings are added via Liquibase. No new permission key is introduced.

| Action | Gate | UI Behavior if Denied |
|---|---|---|
| View Report Print Queue page | Reports-module grant on the user's role | Menu item hidden; direct URL returns HTTP 403 |
| Load queue entries | Same (+ per-type visibility, BR-010) | Page not rendered; HTTP 403 on API call |
| Generate PDF (first print or reprint) | Same | Print buttons hidden; API returns HTTP 403 |
| Request long-running report / Retry | Same (+ access to that report type) | Action hidden; API returns HTTP 403 |
| Update preferences | Same | Preference controls hidden; API returns HTTP 403 |

**Module registration (Liquibase):** add the page as a `system_module` with its
`system_module_url`, and `system_role_module` rows granting it to the same role(s) that already
hold Patient Status Report access on upgrade.

**Mid-session permission loss:** If the user's role loses the Reports grant while the page is open,
the next API call MUST return HTTP 403; the frontend MUST handle a 403 on any print-queue endpoint
by redirecting to home and showing a session-permission error. The menu item MUST be hidden on the
next full page load.

---

## 12. Audit Trail & History

This feature does **not** introduce an audit table. It reuses OpenELIS's existing report-tracking
and audit-history infrastructure:

- On successful generation, a report-tracking record is created/updated via
  `IReportTrackingService` / `ReportTrackingService` (`DocumentTrack` + `ReportType`), capturing
  the document, subject (accession or report parameters), timestamp, and user.
- The event is surfaced in the audit trail through the existing `History` mechanism (the same
  `ReportHistoryService` that already renders report events on the sample/accession record).
- **Event type:** FIRST_PRINT vs REPRINT is derived per BR-008 and recorded as the report-tracking
  type / History event — not a new column on a new table.
- **Actor** is auto-captured from Spring Security; **payload** is limited to entry/subject id,
  document reference, type, and timestamp (no extra PII). For a Partial print the payload includes
  `printedTestsReported`/`testsTotal` so the history shows the report was preliminary.
- **Async generation events (FR-7):** requesting a long-running report and retrying a failed one
  are state-changing user actions and MUST record `audit_trail` events
  (`REPORT_GENERATION_REQUESTED`, `REPORT_GENERATION_RETRIED`; target = the queue entry / report
  parameters; actor from Spring Security). Generation start/finish are job-internal transitions,
  not user actions, and are not separately audited beyond the eventual print record.

This satisfies the ISO 15189 7.4.1.4 release-record requirement using infrastructure the lab is
already audited on.

---

## 13. Acceptance Criteria

### Functional (v1 — patient reports)

- [ ] **[FR-1-001, FR-1-003, §4]** A user whose role holds the Reports grant can open Reports → Report Print Queue; the queue loads automatically scoped to the time-window preference (default 7 days)
- [ ] **[FR-1-002]** Each row is one entry; for patient reports a patient with 3 accessions with new results shows as 3 rows
- [ ] **[FR-1-004]** Columns: Report Type, Subject (Accession + Patient Name), Facility, Ward / Dept / Unit, Requestor, Validated / Queued At, Status, Print action
- [ ] **[FR-1-006]** A patient row whose result abnormal flag is at/above the critical threshold shows a red "Critical Value" Tag, rendered identically to the critical-result-ack treatment
- [ ] **[FR-1-007, BR-014]** Each patient row shows a Completeness indicator: a Final (teal) / Partial (warm-gray) Tag plus a `reported/total` count derived from Finalized vs reportable analyses; async report types show "—"
- [ ] **[FR-4-007]** A Partial report is printable with no confirmation step — the Completeness Tag and `reported/total` count are the signal; printing records `printedTestsReported`
- [ ] **[BR-002]** After a print, finalizing further tests re-queues the entry as UNPRINTED + Amended (covers a previously-Final report corrected, and a previously-printed Partial gaining tests)
- [ ] **[FR-2-005f, BR-015]** A patient or lab-no search surfaces in-progress orders not in the auto-queue (e.g. `0/9` preliminary) and they remain printable
- [ ] **[FR-3-001]** Unprinted = purple Tag; Printed = green Tag
- [ ] **[FR-3-002, FR-3-003]** Amended accessions show a blue "Amended" Tag alongside status; it clears after the next successful generation
- [ ] **[FR-2-001, FR-2-001a]** Facility, Ward, and Requestor are FilterableMultiSelects with server-side typeahead (≥2 chars, debounced, ≤25 results + "keep typing" affordance, no full-list preload); multiple selections OR within a filter and AND across filters
- [ ] **[FR-2-002, BR-007]** Ward filter is disabled (with "Select a facility first" helper) until ≥1 facility is selected; its typeahead searches only the union of the selected facilities' child wards; deselecting a facility auto-removes its wards; clearing the last facility clears and re-disables the ward filter
- [ ] **[FR-1-008]** Page shows the standard inline guidance: info strip under the title, field helpers (Lab No scan hint, ward "select a facility first", typeahead hints), and state explanations (targeted-search strip, empty state) — all via i18n keys
- [ ] **[FR-2-003]** Lab No is a toolbar field: scanning a barcode (or typing + Enter) applies the filter immediately; the "Range" toggle reveals an optional To field for an inclusive From–To lookup; From > To shows `error.printQueue.invalidLabRange`
- [ ] **[FR-2-004]** "Search by Patient" expands an inline panel under the filter bar (no modal) embedding the existing `SearchPatientForm` (Patient Id, Previous Lab Number, Last/First Name, DOB, Gender), local-only (External Search and Client Registry suppressed), backed by `GET /rest/patient-search-results`; selecting a patient collapses the panel and applies a patientId filter showing all that patient's orders; collapsing without selecting changes nothing
- [ ] **[FR-2-005, BR-013]** Applying a patient or lab-no search clears + disables the other filters (incl. Time Window), searches all time, and shows a dismissible Tag ("Patient: {name}", "Lab No: {labNo}", or "Lab No: {from}–{to}") plus a Clear search button; clearing re-enables the filters at defaults and restores the window-scoped view without changing the saved preference; the two search types are mutually exclusive; no match shows the empty state
- [ ] **[FR-2-006]** "Clear Filters" resets Report Type/Facility/Ward/Requestor/Status and any active targeted search but NOT Time Window
- [ ] **[FR-4-001, BR-009, BR-011]** Selecting up to 50 READY rows + "Print Selected" produces a single combined PDF in one tab; >50 disables the action with a tooltip; non-READY rows are not printable
- [ ] **[FR-4-001]** Single-row "Print" opens that report's PDF in a new tab
- [ ] **[FR-4-002, §12]** Successful generation atomically flips to Printed, clears isAmended, sets lastPrintedAt/By, and records a report-tracking + History event with correct type (FIRST_PRINT/REPRINT) — verified via the existing record history view, with no new audit table
- [ ] **[FR-4-003, FR-4-004]** Success/error InlineNotifications shown; failed entries keep prior status; partial batch reports which failed
- [ ] **[BR-002]** Validating results on a PRINTED accession resets it to UNPRINTED, isAmended=true, "Amended" Tag shown
- [ ] **[FR-5-001, FR-5-002]** Time Window and items-per-page persist server-side; restored next session; first-visit defaults applied without error
- [ ] **[FR-6-001, FR-6-002]** Pagination shows total count; supports 10/20/50/100

### Functional (generalized — later versions)

- [ ] **[FR-7-001, FR-7-002, BR-010]** Requesting a long-running report creates a QUEUED entry; it advances to GENERATING then READY (or FAILED) driven by the background job
- [ ] **[FR-7-003]** Generation status renders as distinct Carbon Tags (Queued gray, Generating blue, Ready teal, Failed red), combinable with print-status tags
- [ ] **[FR-7-004]** On READY, the requesting user receives a "report ready" notification and the queue updates without a full reload
- [ ] **[FR-7-005, FR-7-006]** FAILED entries offer Retry (no duplicate entry); generation-status filter combines with report-type and print-status filters

### Non-Functional

- [ ] **[Principle 1]** All UI strings use i18n keys — zero hardcoded English in JSX (including `nav.reports` and all report-type/generation-status labels)
- [ ] Queue loads within 2 seconds for up to 100 entries under normal network conditions
- [ ] **[§11]** Access enforced at both layers — menu hidden when the role lacks the grant; HTTP 403 on all unauthorized API calls; mid-session 403 redirects to home
- [ ] **[Principle 1]** Verified with French and Malagasy locale files — no untranslated key strings visible
- [ ] **[Principle 2]** WCAG 2.1 AA — keyboard navigable, all interactive elements labelled; Carbon tokens only (no hardcoded colors/spacing)

### Integration

- [ ] **[BR-001]** Patient-report entries are created automatically by the validation workflow on results sign-off — no manual queue management
- [ ] **[FR-2-004]** The existing `SearchPatientForm` component is reused unmodified (inline, local-only); the Facility/Ward/Requestor typeaheads reuse the Add Order autosuggest endpoints
- [ ] **[FR-4-001, §12]** PDF generation delegates to the existing patient report generation service; print events are recorded through `IReportTrackingService` + `History`
- [ ] **[FR-7-002]** Long-running report generation uses the background job runner (named dependency); `reportType` maps to `ReportTrackingService.ReportType`
