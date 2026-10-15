# Report Print Queue
## Functional Requirements Specification, v2.2 (r4)

**Version:** 2.2 (r4: rebuilt on the shipped Compliance Report page; approved for handoff 2026-09-29; v2.2 adds data export jobs and the Partial / Final / Amended report state)
**Date:** 2026-09-29
**Status:** Approved for handoff
**Jira:** Epic [OGC-1031](https://uwdigi.atlassian.net/browse/OGC-1031) (to be re-scoped; its 12 child stories were sliced against r3)
**Builds on (shipped):** OGC-552 Compliance Report page `/LaporanHasil` (Done); OGC-776 LHU amendment workflow (code on `develop`, ticket still Backlog: confirm deployment before calling it shipped); Custom Data Export and its My Report Queue job runner (`/reports/custom-data-export`, OGC-479 / OGC-481, `ReportingJobService`)
**Coordinates with:** OGC-1111 patient report redesign (`patient-report-and-report-management-frs.md` v2.2); S06c environmental and S06d vector certificate templates; navigation redesign (`navigation-redesign-frs.md`); OGC-1070 lab-unit domain filtering
**Supersedes:** r3 (`report-print-queue-frs-r3.md`, 2026-07-06) and the list page of S06 (§5.2, §5.5 of `S06-laporan-hasil-compliance-report-frs-v1.0.md`)

> **What r4 changes.** r3 designed a new page and a new queue table for patient reports.
> Since then the environmental Compliance Report page shipped, and it already does most of
> the job: it lists orders, records each generation, keeps the released PDF with a SHA-256
> hash, knows when an order was released, and reissues a released certificate as a numbered
> amendment with a reason. r4 makes that page the queue for every per-order report type
> (patient reports, environmental certificates, vector certificates) instead of building a
> second one. Other decisions taken with Casey on 2026-09-29:
>
> 1. **One Amended state.** An amended report is an amended report, whatever caused it. The
>    cause is recorded and shown as context, never as a separate status or filter.
> 2. **Completing a partial report is a new version, not an amendment.** Amended applies only
>    when something already printed has changed or been removed.
> 3. **Every released version's PDF is archived** with its SHA-256 hash, for all report types.
> 4. **One list with typed rows.** Report type is a column; type-specific detail lives in the
>    row expansion; type-specific filters appear when one type is chosen.
> 5. **Certificates follow the patient report entry rule:** an order joins on its first
>    released result and can print as a partial certificate with a provisional conclusion.
> 6. **Vector certificates are in scope** (as a declared dependency until S06d is built).
> 7. **No standard is not a blocker.** An environmental or vector order with no standard
>    linked still gets its report: the results, marked "Not evaluated against a standard",
>    with no compliance column and no conclusion.
> 8. **Data export jobs are in scope** (v2.2). The Custom Data Export job runner has shipped
>    with its own My Report Queue; its jobs become another row type here, visible only to the
>    person who requested them. Building an export stays on Custom Data Export.
> 9. **Three report states** (v2.2): every per-order report is exactly one of Partial, Final
>    or Amended, with its own filter. Whether it still needs printing (Unprinted, Printed) is a
>    separate filter.

---

## Table of Contents

1. Lab Context
2. Overview & Navigation
3. Building on the Compliance Report page
4. User Stories
5. Functional Requirements
6. Information & Data
7. Business Rules
8. Access
9. Localization
10. Dependencies
11. Out of Scope
12. Acceptance Criteria
13. Coordination with other specs
14. Open Questions
15. Proposed decisions

---

## 1. Lab Context

*Written for a developer who has never worked in a laboratory. Read this first.*

### Current State

After a test result is checked and signed off by a senior technologist (called
**validation**, and **release** once the result may leave the lab), the lab prints a report
and sends it out. The kind of report depends on the kind of sample:

- A **patient report** goes to the doctor or ward that ordered the tests. A reporting clerk
  opens Reports › Patient Status Report, types a patient's name or a range of lab numbers
  (the ID stuck on every sample when it arrives), and prints. OpenELIS records each print,
  but no screen lists what is still waiting to be printed. The home dashboard shows only a
  count, "Unprinted Results Today".
- An **environmental certificate** (Indonesian: *Laporan Hasil Uji*, LHU, "test result
  report") goes to the client who sent in a water, food or air sample. It states whether each
  measured value is within the legal limit (the **standard**, for example regulation PP
  22/2021 for water quality). The clerk opens Reports › Environmental › Compliance Report,
  presses Search, and presses Generate PDF on each order. If a released certificate turns
  out to be wrong, they press Reissue with Amendment, type why, and the new PDF says which
  certificate it replaces.
- A **vector certificate** (mosquito species and infection surveillance) has a designed
  layout but no page yet.
- A **data export** (a CSV file of, for example, every turnaround time for the quarter) is built
  on Reports › Custom Data Export. Large exports run in the background and wait in that page's
  own "My Report Queue" until the person who asked for them downloads the file.

### Pain

- **Nobody can see what still needs printing.** After a shift change the next clerk cannot
  tell which patient reports were printed. Reports are printed twice or not at all. A ward
  calls to ask where a result is, and the clerk has to search order by order.
- **Late results go unnoticed.** A clerk prints a report at 09:00 with 6 of 9 results. The
  last 3 are released at 14:30. Nothing tells anyone to print again, so the ward never gets
  them.
- **Corrections go unnoticed too.** A potassium of 6.8 mmol/L is corrected to 4.2 after the
  report went out. The doctor still has the wrong number, and today's corrected-report flag
  is cleared the first time the report is reprinted, so the second reprint no longer says it
  is a correction.
- **There is no copy of what was sent.** For patient reports, OpenELIS records *that* a
  report was printed, not *what* it said. When a doctor disputes a result months later, or an
  ISO 15189 assessor (ISO 15189 is the standard medical laboratories are accredited against)
  asks for the report as issued, the lab can only re-render it with today's logos and
  settings. The environmental page already keeps the original PDF; patient reports do not.
- **Too many places to check.** A laboratory that tests both patients and environmental samples
  (most Indonesian regional health laboratories do) trains clerks on two different screens
  that record prints in two different places, and anyone waiting on a large export has to
  remember a third page. The environmental page also lists every
  collected order, including ones with nothing released yet, and has no way to print several
  at once.

### What Changes

The clerk opens one page, the Report Print Queue, and sees every report that needs printing,
newest release first, without typing anything. Patient reports and certificates sit in the
same list, each marked with its type, and so do the user's own data exports while they are
being built and once they are ready to download. A clerk who only handles patient reports
never sees certificates, and nobody sees anyone else's exports. Each report shows as Partial,
Final or Amended, and the clerk can filter on any of them. They scan a lab number or filter by ward or sampling site, tick the rows, and
print them as one PDF. When more results are released on an order that was already printed,
it comes back as Unprinted with a new version number. When a printed result is corrected, it
comes back as Amended, and the new report says which report it replaces and what changed.
Every version that leaves the lab is kept exactly as it was printed, with a fingerprint
(SHA-256 hash) that proves it has not been altered, and anyone with access can open it from
the order's version history. Nothing that still needs printing ages out of the list.

---

## 2. Overview & Navigation

The Report Print Queue is the existing Compliance Report page (`LaporanHasilReport.jsx` and
`/rest/complianceReport`), generalized from one report type to every **per-order report**: a
report that belongs to exactly one order (one lab number). It lists orders that have at least
one released result, shows whether the current content has been printed, prints one or many,
keeps a version history with the archived PDF of every released version, and lets an
authorized user reissue a report with a correction. It also shows the current user's
**data export jobs** from the shipped Custom Data Export job runner, with their job state and
Download, Cancel, Retry and Re-run actions (§5.11).

Three per-order report types, one per domain. A sample has exactly one domain (D-004), so its domain decides its report type. Environmental microbiology prints on the environmental certificate (D-133):

| Report type | Domain | Rendered by (today) | Status |
|---|---|---|---|
| Patient report | Clinical | `PatientCILNSPClinical_vreduit` (Jasper), redesigned by OGC-1111 | Built; redesign in progress |
| Environmental certificate (LHU) | Environmental | `ComplianceReportRestController` (iText), layout by S06c | Built |
| Vector certificate | Vector | Layout by S06d | **Not built** (Dependency D1) |

Plus one job type, which is not per order:

| Row type | Visible to | Produced by | Status |
|---|---|---|---|
| Data export | Only the user who submitted it (Custom Data Export BR-016) | `ReportingJobService`, `/rest/reports/data-export/jobs` | Built (OGC-479 / OGC-481) |

### Navigation & URL

- **SideNav placement:** `Reports › Report Print Queue`, a new top-level item in the Reports
  section, listed directly after `Patient Status Report` (navigation redesign Appendix A.1).
- **Breadcrumb:** `Home / Reports / Report Print Queue`
- **URL route:** `/ReportPrintQueue`. Filter state that matters to a bookmark goes in the
  query string: `?type=patient|environmental|vector`, `?labNo=`.
- **Retiring the Compliance Report entry:** tier **Merge** (D-066). The row
  `Reports › Environmental › Compliance Report` is removed; `/LaporanHasil` redirects to
  `/ReportPrintQueue?type=environmental`. The `Environmental` group keeps `Compliance
  Dashboard`. The page code is not deleted, it becomes the queue (§3).
- **Patient Status Report stays** as the free-form way to print any patient report by patient
  or lab-number range. It prints through the same pipeline (FR-6.8), so its prints appear in
  the queue.
- **Home dashboard:** the existing "Unprinted Results" tile links to
  `/ReportPrintQueue?type=patient` (FR-9.3).
- **Custom Data Export:** the report builder stays at `/reports/custom-data-export`. Its My
  Report Queue panel is removed (tier **Merge**); its links, the post-submit "View My Report
  Queue" link and the ready notification open `/ReportPrintQueue?type=export` (FR-11.6).

---

## 3. Building on the Compliance Report page

This section tells the developer what to keep, what to widen, and what the shipped code
cannot do at clinical volume. It names data elements and behavior; storage shape is the
developer's call.

### 3.1 Keep as is

| Shipped piece | Where | Used for |
|---|---|---|
| Expandable DataTable with per-row action | `LaporanHasilReport.jsx` | The queue table (FR-2) |
| Certificate detail: site, GPS, collection conditions, compliance summary per parameter, analyst and manager signatures | `OrderDetail`, `SignatureCard` in `LaporanHasilReport.jsx`; `ComplianceReportOrderDTO` | Certificate row expansion (FR-5.3) |
| Compliance evaluation per order | `ComplianceEvaluationService.evaluate` | Certificate compliance result and filter |
| Compliance status list | `GET /rest/complianceReport/compliance-statuses` | Compliance result filter options |
| Active standards list | `GET /rest/compliance/standards/active` | Standard filter options |
| Certificate PDF renderer | `buildOriginalPdfBytes`, `buildAmendmentPdfBytes` | Environmental certificate rendering (moved out of the controller, §3.3) |
| Immutable PDF archive with SHA-256, one row per (order, version), write-once guard | `ComplianceReportArchiveService.archiveIfAbsent`, `compliance_report_archive` | The archive for every type (FR-8) |
| "Render once into a buffer, stream it and archive the same bytes" | `exportPdf` | Every print (FR-6.2) |
| Amendment suffix `/Am.N` on the lab number | `LhuAmendmentService.certificateNumberWithAmendmentSuffix` | Certificate identity on amended certificates (FR-4.6) |
| Access rule for reissue: Results, Validation or Admin | class-level `@PreAuthorize` on `ComplianceReportRestController` | Reissue with correction (§8) |
| Patient-report print tracking | `ReportTrackingService.addReports`, `document_track` | Existing issue history for patient reports (§3.2) |
| "Has this patient report been printed?" | `analysisService.patientReportHasBeenDone`, used by the home dashboard's Unprinted Results tile | Same definition as the queue's Unprinted (FR-9.3) |
| Export job runner: states (QUEUED, GENERATING, READY, FAILED, EXPIRED, CANCELLED), ownership, restart recovery, polling, ready notification | `ReportingJobService`, `ExportJobState`, `GET /rest/reports/data-export/jobs`, `…/jobs/{id}/download`; Custom Data Export FRS FR-6-001 to FR-6-012 | Data export rows (§5.11), behavior unchanged |
| Export job Tags, actions and details | `ReportingView.jsx` (`status`, `jobActions`, `jobDetails`), `reporting.state.*` keys | Data export rows and their expansion |

### 3.2 Widen

| Today | Change |
|---|---|
| Environmental orders only (`ENV_WORKFLOW_TYPE = environmental`) | All three domains, each with its own report type (§2) |
| Two print logs: `document_track` for patient reports, `compliance_report_generation` for certificates | **One issue history** for all report types (§6.2). The developer picks which to extend; both must not keep running side by side |
| Amendment number, reason and "amends" are single columns on `sample`, so only the latest reason survives | The change summary is kept **per version** in the issue history (§6.2). The `sample` columns may stay as a cache of the latest |
| `hasBeenReleased` means "a VALIDATED_AND_RELEASED e-signature exists" | A per-type **released** rule (BR-1). Clinical e-signatures are optional, so patient reports use the analysis Finalized status |
| Reissue in a Carbon `Modal` | Inline form in the row expansion (FR-7, D-005) |
| Search button; nothing shows until pressed; dates default to 90 days back from receipt | Loads on open; time window by release time; unprinted rows never age out (FR-3.7) |
| Three tiles with hard-coded border colors | Two tiles (To print, Amended) on Carbon tokens (FR-9) |
| No batch action | Print selected (one combined PDF) and Download selected (ZIP) (FR-6.4, FR-6.5) |
| My Report Queue panel on Custom Data Export (`panel=queue`) | Its rows move into this queue as the Data export type; the panel is removed and redirects (FR-11.6) |
| Orders with no standard are "Ineligible": listed, but Generate PDF is replaced by "No standard linked" | They are ordinary rows that print a results report marked "Not evaluated against a standard" (BR-4, FR-6.11) |
| Generate PDF allowed on unreleased orders (a preview, not archived) | Print needs at least one released result; the row expansion shows what will print (BR-2) |

### 3.3 Cannot carry over as is

1. **The list query does not scale to clinical volume.** `GET /rest/complianceReport` loads
   every sample received in the window, then for each one runs several queries (workflow
   type, sample items, standard links, full compliance evaluation, generation log, e-signature
   lookups per analysis). At environmental volume (tens of orders a day) this is fine. A
   clinical reference laboratory releases thousands of orders a day, and the queue's default
   view has no date bound on unprinted rows. The list MUST be a server-side filtered, sorted
   and paged query (FR-3.9, NFR-1). Per-row detail (compliance summary, signatures, tests,
   version history) loads when the row is expanded, not with the list.
2. **The controller holds business logic and PDF building.** Rendering, release checks,
   archiving and amendment numbering move into services behind one print pipeline with a
   renderer per report type (Constitution IV: layered architecture, `@Transactional` in
   services only).
3. **The page is environmental-specific in its strings.** Keys under `laporanHasil.*` and
   `lhu.amendment.*` that describe the whole page are replaced by `reportQueue.*` keys; the
   certificate-detail keys are reused as is (§9).

---

## 4. User Stories

- **As a reporting clerk,** I want every report that needs printing to be listed when I open
  the page, so that after a shift change I know exactly what is left.
- **As a reporting clerk,** I want to filter by ward or sampling site, tick a batch and print
  it as one PDF, so that I can clear a ward's reports in one action.
- **As a reporting clerk,** I want an order to come back when more results are released or a
  printed result is corrected, so that the doctor or client always has the current report.
- **As a validator,** I want to reissue a released report with a stated correction when the
  error is not in a result (a wrong collection date, a wrong site), so that the corrected
  report is traceable to the one it replaces.
- **As a quality manager,** I want every released version kept exactly as printed with a
  hash, so that I can hand an assessor or a complaining client the original.
- **As a lab manager who requested a quarterly export,** I want it in the same queue as my
  reports, with its progress and a Download button when it is ready, so that I do not have to
  remember a separate page.
- **As a reporting clerk,** I want to filter for Partial, Final or Amended reports, so that I
  can, for example, send every amended report before anything else.

---

## 5. Functional Requirements

### 5.1 The list

**FR-1.1** The page loads the list on open, with no Search button.

**FR-1.2** One row is one order (one lab number) and one report type, or one data export job.
An order never appears twice.

**FR-1.3** Default sort: latest release time (submitted time for data exports), newest first. Columns are sortable where marked.

**FR-1.4** Columns, in order:

| Column | Patient report | Certificate | Data export | Sort |
|---|---|---|---|---|
| (select) | Checkbox for batch actions | Same | Not selectable | no |
| (expand) | Row expansion | Same | Job details (FR-11.4) | no |
| Type | "Patient report" | "Environmental" or "Vector" | "Data export" | yes |
| Lab No / Name | Accession number, monospace | Same | Export name | yes |
| Subject | Patient name, patient code below | Sampling site name, site code below | Report definition (e.g. "Sample & Testing") | yes |
| Details | Requester; facility and ward below | Standard (regulation number) and compliance result Tag, or "Not evaluated against a standard" with a `gray` Not evaluated Tag | Date range; rows and file size below (estimated wait while queued) | no |
| Released / Submitted | Latest release time of any result on the order | Same | Submitted at | yes (default) |
| State | Report state Tag (FR-4.1), plus Critical Tag when any released result is critical | Report state Tag | Job state Tag (FR-11.2) | yes |
| Print status | Print status Tag (FR-4.2) | Same | "–" | yes |
| Version | Current version (`v2`), "Not printed" when never printed | Same; certificates add the `/Am.N` number | "–" | no |
| Action | One-click Print button (D-078) | Same | The job's one action: Download, Cancel, Retry or Re-run (FR-11.3) | no |

**FR-1.5** The Type column is hidden when the user can see only one row type (§8). Data export
counts as a row type only for users who can use Custom Data Export.

**FR-1.6** The Critical Tag (`red`, "Critical") renders identically to the critical-result
treatment in Results Entry and the Attention feed.

**FR-1.7** The compliance result Tag reuses the shipped mapping: Compliant `green`,
Borderline `warm-gray`, Non-compliant `red`, with the shipped glyph prefix (✓, ⚑, ✗) so the
meaning does not depend on color, plus Not evaluated `gray` (prefix: the shipped dash glyph) for an order with no
standard linked. On a Partial certificate the Tag reads "Provisional" before the result
("Provisional: Compliant").

**FR-1.8** Pagination uses the Carbon `Pagination` component, 10, 20, 50 or 100 rows per page,
default 20, with the total count shown.

### 5.2 Which orders appear

**FR-2.1** An order appears once at least one of its results is **released** by its type's
released rule (BR-1).

**FR-2.2** Canceled and rejected analyses are not counted in `released/total` and do not make
an order appear.

**FR-2.3** An environmental or vector order with no standard linked appears like any other
order once a result is released (BR-4). Its Details column reads "Not evaluated against a
standard" and it prints as described in FR-6.11.

**FR-2.4** Orders with nothing released are not listed. A Lab No lookup (FR-3.3) that matches
one shows it in the result with the message "Nothing released yet on this order", and no
Print button.

**FR-2.5** On first deployment, orders whose latest release is earlier than the install date
and that have no issue record are not listed as Unprinted (BR-7). They are reachable by Lab No
or patient lookup.

### 5.3 Filters and search

**FR-3.1** The filter bar holds, in order: Lab No, Search by patient (patient reports only),
Type, State, Print status, Time window. When Type is set to one row type, that type's filters
appear after Time window (FR-3.5, FR-3.6).

**FR-3.2** All filter changes apply immediately; there is no Search button. A Clear filters
button resets everything except the Time window, which is a saved preference.

**FR-3.3 Lab No.** A scan-friendly field (`CustomLabNumberInput`, placeholder "Scan or type lab
number") applies on Enter, which is what a barcode scanner sends. A Range toggle reveals a To
field for an inclusive range. This is a **targeted lookup**: while it is active, the other
filters are cleared and disabled, the time window is ignored, and an active-search strip shows
a dismissible Tag ("Lab No: 26-000412" or "Lab No: 26-000400 to 26-000420") and a Clear search
button. Carried over from r3 FR-2-003 and FR-2-005.

**FR-3.4 Search by patient.** A ghost button opens an inline panel under the filter bar (no
modal) embedding the existing `SearchPatientForm` with external and client-registry search
suppressed. Choosing a patient applies a targeted lookup for all of that patient's orders,
with the same exclusivity as FR-3.3. Shown only when patient reports are in the user's scope.
Carried over from r3 FR-2-004.

**FR-3.5 Patient report filters** (shown when Type = Patient report): Facility, Ward, Requester.
Each is a Carbon `FilterableMultiSelect` with server-side typeahead from 2 characters, reusing
the endpoints Add Order uses for referring site and provider. Ward is disabled until a
facility is chosen and searches only wards of the chosen facilities. Selected values show as
removable chips with their labels, never as a bare count. Supersedes r3 FR-2-001a(c).

**FR-3.6 Certificate filters** (shown when Type = Environmental or Vector): Sampling site
(multi-select typeahead over the sampling site registry), Standard (multi-select over active
standards), Compliance result (Compliant, Borderline, Non-compliant, Not evaluated). Selected
values show as chips with their labels.

**FR-3.7 State**: a multi-select of **Partial, Final, Amended** (none selected = all), shown as
chips with their labels. When Type is Data export, the options are the job states instead
(Queued, Generating, Ready to download, Failed, Expired, Cancelled). When Type is All and at
least one report state is selected, data export rows are left out, because they have no report
state.

**FR-3.7a Print status**: All (default), Unprinted, Printed. Hidden when Type is Data export;
when Type is All and it is not All, data export rows are left out. The two filters combine:
State = Amended with Print status = Unprinted is "amended reports still to send".

**FR-3.8 Time window** (by latest release time): Last 24 hours, Last 7 days (default), Last 30
days, All time, Custom range (reveals From and To date pickers). The window applies **only to
Printed rows** and to finished data export jobs (by submitted time). Unprinted rows in any
state, and Queued or Generating exports, always show, however old, so nothing that still needs
printing ages out. The window is saved per user on the server (r3 FR-5-001).

**FR-3.9** Filtering, sorting and paging run on the server. The page never loads the full
list into the browser.

**FR-3.10** The Type filter lists only the row types in the user's scope (§8), with Data export
last. With one type in scope it is hidden.

### 5.4 Report state, print status and versions

Every per-order report has two independent values: its **report state** (what the report is)
and its **print status** (whether its current content has been printed).

**FR-4.1 Report state** is exactly one of:

| State | Tag kind | Meaning |
|---|---|---|
| Partial | `warm-gray` | At least one counted analysis is not released yet; shows `released/total` ("Partial 3/7") (r3 FR-1-007) |
| Final | `teal` | Every counted analysis is released |
| Amended | `magenta` | A printed result has changed or been removed (FR-4.4), or the report was reissued with a correction (FR-7). Amended wins over Partial and Final and stays once reached, including after the amended version is printed. When not every result is released the Tag reads "Amended 5/7" |

**FR-4.2 Print status** is one of:

| Print status | Tag kind | Meaning |
|---|---|---|
| Unprinted | `purple` | The current released content has not been printed in its current form: never printed, more results released since the last print, or a printed result changed |
| Printed | `green` | The last print matches the current released content |

Examples: a Partial report printed at 09:00 whose last results are released at 14:30 is
**Final, Unprinted**; once printed it is **Final, Printed**. A printed report whose potassium
is corrected is **Amended, Unprinted**; once the amended version is printed it is **Amended,
Printed**.

**FR-4.3 Versions.** Each time a report is printed with content that differs from the last
printed version, a new version is created: version 1 for the first print, then +1. A print
whose content matches the last printed version is a **reprint**: it creates no version and
returns that version's archived PDF (FR-6.3).

**FR-4.4 Amended versions.** A new version is **amended** when, compared with the previous
version, a result that was printed has changed value, flag or unit, or has been removed, or
when it was made by Reissue with correction (FR-7). A new version that only adds results
(completing a partial report) is **not** amended.

**FR-4.5 Change summary.** Every version after the first records a change summary:
- System-written for result changes: the changed results with old and new values ("Potassium
  6.8 → 4.2 mmol/L"), removed results ("Removed: Sodium"), and added results ("Added: Chloride,
  Bicarbonate"). When the result change carried a note, the note is appended.
- User-written for Reissue with correction: the reason typed in FR-7.
The summary shows in the version history (FR-5.4). On an amended version it prints in the
corrected-report banner (OGC-1111 FR-A14 for patient reports; the amendment notice block for
certificates).

**FR-4.6 Printed identity.** Patient reports print "Version {n}" in the corrected banner
(OGC-1111 FR-A15). Certificates keep the shipped identity: lab number, with `/Am.{n}` appended
where n counts amended versions only, and "Supersedes" naming the previous amended identity.
Both numbers come from the same version history.

### 5.5 Row expansion

**FR-5.1** Every row expands inline (`TableExpandRow`). Detail loads on first expand, with an
inline loading state; a failure shows an inline error with a Retry.

**FR-5.2 Patient report expansion:** a Tests table (test, result or pending status, flag,
released at, validated by), the order block (facility, ward, requester, collected, received),
then the version history (FR-5.4) and the Reissue with correction control (FR-7).

**FR-5.3 Certificate expansion:** the shipped `OrderDetail` content unchanged (site
information, collection conditions, compliance summary per parameter, analyst and manager
signatures), then the version history and Reissue with correction.

**FR-5.4 Version history table:** Version, Issued (date and time), By, Change (summary or
"First issue"), Completeness at issue, Fingerprint (first 12 characters of the SHA-256, full
value on hover), and an **Open PDF** link that opens the archived file in a new tab. Reprints
are listed under their version as "Reprinted {date} by {user}" in a compact line. Versions
issued before archiving began show "Not archived (issued before {install date})" instead of a
link.

**FR-5.5** The expansion shows "Nothing printed yet" in place of the history table for a row
that has never been printed.

### 5.6 Printing

**FR-6.1** The Print button on a row prints that order's report. It is disabled only for an
order with nothing released (reached by Lab No lookup), with the reason as its tooltip.

**FR-6.2** When the current content differs from the last printed version (or there is none),
Print renders the report once, creates the new version (FR-4.3, FR-4.4), archives the rendered
bytes with their SHA-256 (FR-8), records the issue, and opens the same bytes in a new browser
tab.

**FR-6.3** When the current content matches the last printed version, Print returns that
version's archived PDF unchanged and records a reprint. For versions issued before archiving
began, it renders the report as today and records the reprint.

**FR-6.4 Print selected.** With rows selected, a Carbon batch toolbar offers Print selected.
It produces **one combined PDF** (each order's report in turn, each numbered from page 1 of its
own) opened in one tab. Each order in the batch gets its own version, archive entry and issue
record, exactly as a single print would.

**FR-6.5 Download selected.** The batch toolbar also offers Download selected, which downloads
a ZIP with one PDF per order. File names: patient reports `{labNo}-v{n}.pdf`; certificates keep
the shipped pattern `LH-{labNo}.pdf`, and `LH-{labNo}-Am{n}.pdf` for amended versions. The ZIP
is named `reports_{YYYY-MM-DD}_{count}.zip`.

**FR-6.6 Partial failures.** If some reports in a batch fail to render, the rest still print
or download; the failed rows keep their status; an error `InlineNotification` names the failed
lab numbers and the reason; a ZIP adds `_ERRORS.txt` listing them (S06 LH-5-004).

**FR-6.7** A batch holds at most 100 orders. Selecting more shows a warning in the batch
toolbar and disables the batch actions until the selection is reduced.

**FR-6.8 One pipeline.** Printing a patient report from Reports › Patient Status Report goes
through the same pipeline (version, archive, issue record). A report printed there shows as
Printed in the queue.

**FR-6.9** A success `InlineNotification` confirms the count printed or downloaded; status,
version and tiles update without reloading the page.

**FR-6.10 Partial certificates.** A certificate printed as Partial shows the pending parameters
as "Pending" and its conclusion as "Provisional: {n} of {m} parameters pending"
(Dependency D2).

**FR-6.11 No standard linked.** An environmental or vector order with no standard prints a
results report on the same letterhead and layout as its certificate: sample and site
information, every released result with its unit (and method where the layout has one), and
signatures. In place of the regulation block it prints "Not evaluated against a standard", and
it has no threshold column, no compliance status column and no compliance conclusion
(Dependency D2). The shipped renderer builds the results table only from compliance
evaluations, so today such an order would print with no results at all.

**FR-6.12 Standard linked after printing.** Linking a standard to an order already printed as
"Not evaluated" creates a new version on the next print. It is **not** amended (results are
unchanged and an evaluation is added); its change summary is "Evaluated against {standard}".
Changing or removing a standard after a certificate was printed with it is an amended version.

### 5.7 Reissue with correction

**FR-7.1** A printed row's expansion shows a **Reissue with correction** tertiary button for
users allowed to use it (§8). For others it is disabled with the tooltip "Only Results,
Validation or Admin users can reissue a report."

**FR-7.2** The button opens an inline form in the expansion (no modal, D-005): a required
TextArea "What was corrected", helper text "This prints on the report as the reason for the
correction. Required for ISO 15189 7.4.1.6 and ISO/IEC 17025 7.8.8.", and two buttons, Reissue
and print, and Cancel.

**FR-7.3** Submitting with an empty or whitespace-only reason shows the TextArea's invalid
state ("Enter what was corrected") and sends nothing.

**FR-7.4** Reissue creates a new amended version with the reason as its change summary,
archives it, records the issue, and opens the PDF, whether or not any result changed.

**FR-7.5** Reissue is offered only on rows whose print status is Printed. A row that is
Unprinted, in any state, uses Print.

### 5.8 Archive

**FR-8.1** Every new version's PDF is stored as rendered, with its SHA-256 hash, the version
number, who issued it and when. Stored versions are never overwritten or deleted (D-002).

**FR-8.2** Open PDF (FR-5.4) returns the stored bytes unchanged. The page shows the hash so a
reviewer can check a file they were given against it.

**FR-8.3** If storing the archive fails, the print still reaches the user, the failure is
logged, and the version is flagged "Archive failed" in its history with a Retry archive action
for Admin users. (The shipped code logs and continues; r4 makes the gap visible.)

### 5.9 Tiles

**FR-9.1** Above the filter bar, up to three Carbon `Tile`s show counts for the current filters
(State and Print status excluded): **To print** (Unprinted, any state), **Amended to print**
(Amended and Unprinted), and **Exports ready** (the user's Ready exports, shown only when
Data export is in scope). Clicking To print sets Print status to Unprinted; Amended to print
sets State to Amended and Print status to Unprinted; Exports ready sets Type to Data export and
State to Ready.

**FR-9.2** Tile accents use Carbon tokens only (no hard-coded colors). A count of zero shows
"0", not an empty tile.

**FR-9.3** The home dashboard's Unprinted Results tile keeps its count, uses the same Unprinted
definition as the queue, and links to `/ReportPrintQueue?type=patient`.

### 5.10 Page states and guidance

**FR-10.1** Under the page title, a non-dismissible info `InlineNotification`: "Reports land
here when their first result is released. Printed reports come back when more results are
released or a printed result changes. Your own data exports show here too." followed by a
legend of the three report states and the two print statuses (each Tag beside one line of
meaning).

**FR-10.2** Empty state (no rows for the filters): "Nothing to print. Every released report in
this view has been printed." with a Clear filters link when filters are set.

**FR-10.3** Loading: Carbon `DataTableSkeleton` for the table, skeleton tiles.

**FR-10.4** List load failure: error `InlineNotification` with Retry; the filters stay as set.

**FR-10.5** Items per page and Time window persist per user on the server (r3 FR-5-001 to
FR-5-003); never in browser storage.

### 5.11 Data export jobs

The Custom Data Export job runner and its rules are unchanged (Custom Data Export FRS
FR-6-001 to FR-6-012, BR-016, BR-018). This section says only how its jobs appear here.

**FR-11.1** Data export rows list the current user's jobs from `GET
/rest/reports/data-export/jobs`, merged into the list by submitted time. They are never shown
to anyone else, including Admin (BR-016: another user's job returns 404).

**FR-11.2 Job state** uses the shipped Tags and `reporting.state.*` labels: Queued `blue`,
Generating `cyan`, Ready to download `green`, Failed `red`, Expired `gray`, Cancelled `gray`.

**FR-11.3 One action per row**, the shipped one for its state: Ready, Download (repeat downloads
allowed until expiry); Queued, Cancel (with the shipped confirmation); Failed, Retry; Expired,
Re-run (opens the Custom Data Export builder pre-filled, date range blank). Generating and
Cancelled rows have no action.

**FR-11.4** Expanding an export row shows the shipped job details: layout, date range, the
selected variables in order, expiry date, and the failure reason for a failed job.

**FR-11.5** While any of the user's jobs is Queued or Generating, the list refreshes those rows
in place on the shipped 15-second poll; polling stops when none is active. The app-wide ready
notification (Custom Data Export FR-6-012) is unchanged.

**FR-11.6** Custom Data Export's My Report Queue panel is removed (tier Merge, D-066). Its menu
link, the builder's "View My Report Queue" link after an asynchronous submit, and the ready
notification all open `/ReportPrintQueue?type=export`. The builder itself does not change.

**FR-11.7** Export rows cannot be selected for batch print or download, and they do not count
in To print or Amended to print.

### 5.12 Non-functional

**NFR-1** With 50,000 orders in the last 30 days and 5,000 unprinted, the first page of the
default view returns in under 2 seconds on the reference server, and a Lab No lookup in under
1 second.

**NFR-2** A batch of 100 patient reports produces its combined PDF in under 60 seconds, with a
progress indicator ("Preparing 37 of 100") while it runs.

**NFR-3** Archive growth must be stated in the server sizing guidance: about 100 to 250 KB per
patient report version and 50 to 200 KB per certificate version, so a laboratory issuing 1,000
reports a day adds roughly 35 to 90 GB a year.

---

## 6. Information & Data

### 6.1 Reused as is

| Information | Source |
|---|---|
| Order, lab number, domain | `Sample` (accession number; domain from the sample, D-004) |
| Results, their status (Finalized, Canceled, SampleRejected), release date, validator | `Analysis`, `Result`, `result_signature` |
| Critical results | Result abnormal flag at or beyond the critical threshold (OGC-1121) |
| Patient, facility, ward, requester | `Patient`, `Organization` (ward is a child of facility), `Provider` |
| Sampling site, GPS, collection method and conditions | Observation history `ENV_*` values, `VectorSamplingSite` |
| Linked standards and compliance evaluation | `SampleComplianceStandard`, `ComplianceEvaluationService` |
| Release signatures (certificates) | `ElectronicSignature` with `VALIDATED_AND_RELEASED` on `VALIDATION_BATCH` |
| Patient-report issue history (existing prints) | `document_track` via `ReportTrackingService` |
| Certificate issue history, archive, amendment data | `compliance_report_generation`, `compliance_report_archive`, `sample.amendment_number` / `amends_lhu_number` / `amendment_reason` |
| Data export jobs, their states, files and ownership | `ExportJob` / `ExportJobState`, `ReportingJobService` (Custom Data Export) |
| Per-user queue preferences | New, as specified in r3 §6 (`UserReportPrintPreference`): time window, items per page |

### 6.2 Issue history (widened, one for all report types)

For each order and report type, the history holds one entry per **print event**, grouped by
**version**. The data elements:

- Report type; order.
- Version number; whether the version is amended; amended count (for `/Am.N`).
- Change summary (system- or user-written, FR-4.5); for a user-written one, that it was a
  reissue with correction.
- What was printed, per analysis: the analysis, and the value, flag and unit printed. This is
  what FR-4.4 compares against to tell "added" from "changed or removed", and what makes
  Status computable without re-rendering.
- Completeness at issue (`released/total`).
- Issued by, issued at; for reprints, the version reprinted.
- Archive: the PDF bytes and SHA-256 per version, or "issued before archiving began" for
  migrated history.

### 6.3 Migration

- Existing `document_track` patient-report rows become version 1 of their order (one version
  per order, marked "issued before archiving began"), so already-printed orders show as
  Printed, not Unprinted. The printed content for these is unknown, so the first later change
  to any result on such an order is treated as amended.
- Existing `compliance_report_archive` rows become the versions they already are (amendment 0
  is version 1); `compliance_report_generation` rows become their issue events.
- The install date is recorded for BR-7.

---

## 7. Business Rules

**BR-1 Released, per type.** Patient report: the analysis is Finalized. Environmental and
vector certificates: the analysis is Finalized and carries a `VALIDATED_AND_RELEASED`
signature, as the shipped `hasBeenReleased` checks today.

**BR-2** An order with nothing released cannot be printed from the queue. Every order with at
least one released result can be printed.

**BR-3** Print status and report state are computed from the current released content and the
printed versions (§6.2). Print status: no printed version, or current content differs from the
last printed version → Unprinted; otherwise Printed. Report state: any printed result changed or
removed since it was printed, or any version reissued with a correction → Amended (and it stays
Amended); otherwise every counted analysis released → Final; otherwise Partial.

**BR-4 No standard.** An environmental or vector order with no linked standard is an ordinary
queue row. Its report states "Not evaluated against a standard" and carries no compliance
evaluation (FR-6.11). The compliance result for filtering and display is Not evaluated.

**BR-5** A reprint returns the archived bytes of the version it reprints and never creates a
version.

**BR-6** Versions and their archived files are never deleted or overwritten. A correction is
always a new version.

**BR-7 Go-live cutoff.** Orders whose latest release predates the install date and that have no
issue record do not appear as Unprinted.

**BR-8** A batch prints each order independently: one order's failure never blocks or rolls
back another's version, archive or issue record.

**BR-9** A user sees only rows whose report type is in their scope (§8), including in tile
counts, lookups and batch actions, and only their own data export jobs.

---

## 8. Access

- **The page:** anyone whose role has the Reports module grant. On upgrade, the new
  `/ReportPrintQueue` module is granted to every role that can open Patient Status Report or
  Compliance Report today. Users without it do not see the menu entry, and the route sends them
  to Home.
- **Which rows:** report types follow the user's lab-unit domains (OGC-1070). A user whose lab
  units are all Clinical sees only patient reports; Environmental sees environmental
  certificates; Vector sees vector certificates; a user with several sees each. Admin sees all.
- **Print, reprint, batch print, download, open archived PDF:** anyone with page access, for
  rows they can see.
- **Reissue with correction:** users with the Results, Validation or Admin role (the rule the
  shipped `ComplianceReportRestController` already enforces). For others the control is
  disabled with its reason (FR-7.1).
- **Retry archive** (FR-8.3): Admin.
- **Data export rows:** shown to users who can use Custom Data Export today, and only their own
  jobs (FR-11.1). Download, Cancel, Retry and Re-run follow the shipped Custom Data Export rules.
- No new permission keys (D-006).

---

## 9. Localization

REUSE marks an existing key; NEW keys are namespaced `reportQueue.*`. Keys under
`laporanHasil.*` that label the old page as a whole (`laporanHasil.title`, `.subtitle`,
`.tile.*`, `.filter.dateFrom`, `.filter.dateTo`, `.filter.generationStatus`, `.filter.generated`,
`.filter.notGenerated`, `.action.generatePdf`, `.action.regeneratePdf`, `.col.lastGenerated`,
`.empty`, `.loading`, `.error`) and the modal keys `lhu.amendment.modal.*` are removed with the
code that used them (Constitution VII key hygiene). `lhu.amendment.reason.*` are replaced by the
`reportQueue.reissue.*` keys below.

| Key | English | Status |
|---|---|---|
| `sidenav.label.reports.printQueue` | Report Print Queue | NEW |
| `common.home` | Home | REUSE (breadcrumb) |
| `common.reports` | Reports | REUSE (breadcrumb) |
| `reportQueue.title` | Report Print Queue | NEW |
| `reportQueue.subtitle` | Print, reprint and reissue released reports | NEW |
| `reportQueue.guidance.lead` | Reports land here when their first result is released. | NEW |
| `reportQueue.guidance.body` | Printed reports come back when more results are released or a printed result changes. | NEW |
| `reportQueue.guidance.exports` | Your own data exports show here too. | NEW |
| `reportQueue.legend.partial` | Some results are not released yet | NEW |
| `reportQueue.legend.final` | Every result is released | NEW |
| `reportQueue.legend.amended` | A printed result changed, or the report was reissued with a correction | NEW |
| `reportQueue.legend.unprinted` | The current content has not been printed yet | NEW |
| `reportQueue.legend.printed` | The last print matches what is released | NEW |
| `reportQueue.tile.toPrint` | To print | NEW |
| `reportQueue.tile.amendedToPrint` | Amended to print | NEW |
| `reportQueue.tile.exportsReady` | Exports ready | NEW |
| `reportQueue.type.patient` | Patient report | NEW |
| `reportQueue.type.environmental` | Environmental | NEW |
| `reportQueue.type.vector` | Vector | NEW |
| `reportQueue.type.export` | Data export | NEW |
| `reportQueue.state.partial` | Partial {released}/{total} | NEW |
| `reportQueue.state.partialName` | Partial | NEW (filter option and legend) |
| `reportQueue.state.final` | Final | NEW |
| `reportQueue.state.amended` | Amended | NEW |
| `reportQueue.state.amendedPartial` | Amended {released}/{total} | NEW |
| `reportQueue.printStatus.unprinted` | Unprinted | NEW |
| `reportQueue.printStatus.printed` | Printed | NEW |
| `laporanHasil.status.compliant` | Compliant | REUSE |
| `laporanHasil.status.borderline` | Borderline | REUSE |
| `laporanHasil.status.nonCompliant` | Non-Compliant | REUSE |
| `reportQueue.compliance.notEvaluated` | Not evaluated | NEW (replaces `laporanHasil.status.ineligible`) |
| `reportQueue.compliance.notEvaluated.long` | Not evaluated against a standard | NEW |
| `reportQueue.change.evaluated` | Evaluated against {standard} | NEW |
| `reportQueue.compliance.provisional` | Provisional: {status} | NEW |
| `reportQueue.col.type` | Type | NEW |
| `reportQueue.col.labNoName` | Lab No / Name | NEW |
| `common.labNumber` | Lab Number | REUSE (Lab No filter label) |
| `reportQueue.col.subject` | Subject | NEW |
| `reportQueue.col.details` | Details | NEW |
| `reportQueue.col.released` | Released / Submitted | NEW |
| `reportQueue.col.state` | State | NEW |
| `reportQueue.col.printStatus` | Print status | NEW |
| `reportQueue.col.version` | Version | NEW |
| `common.action` | Action | REUSE |
| `reportQueue.version.none` | Not printed | NEW |
| `reportQueue.version.value` | v{n} | NEW |
| `common.critical` | Critical | REUSE |
| `reportQueue.action.print` | Print | NEW |
| `reportQueue.action.printSelected` | Print selected | NEW |
| `reportQueue.action.downloadSelected` | Download selected | NEW |
| `reportQueue.batch.tooMany` | Select 100 or fewer orders to print or download at once | NEW |
| `reportQueue.batch.progress` | Preparing {done} of {total} | NEW |
| `reportQueue.print.disabled.nothingReleased` | Nothing released yet on this order | NEW |
| `reportQueue.print.success` | {count, plural, one {# report} other {# reports}} ready | NEW |
| `reportQueue.print.failed` | Could not prepare {count, plural, one {# report} other {# reports}}: {labNumbers} | NEW |
| `reportQueue.filter.labNo.placeholder` | Scan or type lab number | NEW |
| `reportQueue.filter.labNo.helper` | Scanning a barcode applies the filter instantly | NEW |
| `reportQueue.filter.labNo.range` | Range | NEW |
| `reportQueue.filter.labNo.to` | To lab number | NEW |
| `error.printQueue.invalidLabRange` | The first lab number must come before the second | REUSE (r3) |
| `reportQueue.filter.patient` | Search by patient | NEW |
| `common.type` | Type | REUSE |
| `common.all` | All | REUSE |
| `reportQueue.filter.state` | State | NEW |
| `reportQueue.filter.printStatus` | Print status | NEW |
| `reportQueue.filter.window` | Time window | NEW |
| `reportQueue.filter.window.24h` | Last 24 hours | NEW |
| `reportQueue.filter.window.7d` | Last 7 days | NEW |
| `reportQueue.filter.window.30d` | Last 30 days | NEW |
| `reportQueue.filter.window.all` | All time | NEW |
| `reportQueue.filter.window.custom` | Custom range | NEW |
| `common.from` | From | REUSE |
| `reportQueue.filter.window.to` | To | NEW |
| `reportQueue.filter.window.helper` | Applies to printed reports; unprinted ones always show | NEW |
| `reportQueue.filter.facility` | Facility | NEW |
| `reportQueue.filter.ward` | Ward / Dept / Unit | NEW |
| `reportQueue.filter.ward.disabled` | Select a facility first | NEW |
| `common.requester` | Requester | REUSE |
| `common.samplingSite` | Sampling Site | REUSE |
| `common.standard` | Standard | REUSE |
| `laporanHasil.filter.complianceStatus` | Compliance Status | REUSE |
| `reportQueue.filter.typeahead.helper` | Type 2 or more characters to search | NEW |
| `reportQueue.filter.clear` | Clear filters | NEW |
| `reportQueue.search.active.labNo` | Lab No: {labNo} | NEW |
| `reportQueue.search.active.labRange` | Lab No: {from} to {to} | NEW |
| `reportQueue.search.active.patient` | Patient: {name} | NEW |
| `reportQueue.search.clear` | Clear search | NEW |
| `reportQueue.search.disabledHelper` | Other filters are off while you look up a specific order | NEW |
| `reportQueue.empty` | Nothing to print. Every released report in this view has been printed. | NEW |
| `reportQueue.error.load` | Could not load the queue. | NEW |
| `common.retry` | Retry | REUSE |
| `reportQueue.detail.tests` | Tests | NEW |
| `reportQueue.detail.order` | Order | NEW |
| `common.collected` | Collected | REUSE |
| `common.received` | Received | REUSE |
| `reportQueue.detail.validatedBy` | Validated by | NEW |
| `common.pending` | Pending | REUSE |
| `laporanHasil.detail.*` (all 23 keys) | Certificate detail | REUSE |
| `reportQueue.history.title` | Version history | NEW |
| `reportQueue.history.issued` | Issued | NEW |
| `reportQueue.history.by` | By | NEW |
| `reportQueue.history.change` | Change | NEW |
| `reportQueue.history.firstIssue` | First issue | NEW |
| `reportQueue.history.completeness` | Completeness | NEW |
| `reportQueue.history.fingerprint` | Fingerprint | NEW |
| `reportQueue.history.openPdf` | Open PDF | NEW |
| `reportQueue.history.reprinted` | Reprinted {date} by {user} | NEW |
| `reportQueue.history.notArchived` | Not archived (issued before {date}) | NEW |
| `reportQueue.history.archiveFailed` | Archive failed | NEW |
| `reportQueue.history.retryArchive` | Retry archive | NEW |
| `reportQueue.history.none` | Nothing printed yet | NEW |
| `reportQueue.change.added` | Added: {tests} | NEW |
| `reportQueue.change.removed` | Removed: {tests} | NEW |
| `reportQueue.change.changed` | {test} {old} → {new} | NEW |
| `reportQueue.reissue.button` | Reissue with correction | NEW |
| `reportQueue.reissue.disabled` | Only Results, Validation or Admin users can reissue a report. | NEW |
| `reportQueue.reissue.reason.label` | What was corrected | NEW |
| `reportQueue.reissue.reason.helper` | This prints on the report as the reason for the correction. Required for ISO 15189 7.4.1.6 and ISO/IEC 17025 7.8.8. | NEW |
| `reportQueue.reissue.reason.placeholder` | e.g. Collection date was entered as 12/09; the sample was collected 11/09 | NEW |
| `reportQueue.reissue.reason.required` | Enter what was corrected | NEW |
| `reportQueue.reissue.submit` | Reissue and print | NEW |
| `common.cancel` | Cancel | REUSE |
| `common.retry` | Retry | REUSE (export Retry) |
| `reporting.state.QUEUED` to `reporting.state.CANCELLED` (6 keys) | Queued, Generating, Ready to download, Failed, Expired, Cancelled | REUSE, owned by the export job-row component (see note) |
| `reporting.download` | Download CSV | REUSE, same component |
| `reporting.design.jobAction.EXPIRED` | Re-run | REUSE, same component |
| `reporting.rows`, `reporting.design.expires`, `reporting.layout.*` | Rows, expiry, layout in the export details | REUSE, same component |

**Note on `reporting.*` keys.** The export row Tag, action and details are moved out of
`ReportingView.jsx` into one shared job-row component that both Custom Data Export and this page
render, and the `reporting.*` keys travel with that component. The queue page never references
another feature's keys directly (Constitution VII, no cross-feature key references).

Printed-report strings (the corrected banner, "Version {n}", "Provisional", and the printed
"Not evaluated against a standard") belong to the
report templates and are keyed in OGC-1111 (`report.patient.*`) and S06c / S06d.

---

## 10. Dependencies

| # | Dependency | Kind | Needed for |
|---|---|---|---|
| D1 | S06d vector certificate renderer | Not built | Vector rows (listed but Print disabled "Vector certificate template not installed" until it exists; Type option hidden until then) |
| D2 | Environmental renderer changes: partial wording ("Pending", "Provisional" conclusion), and a no-standard mode that prints results from the order's analyses rather than from compliance evaluations | Renderer change (S06c; S06d the same) | FR-6.10, FR-6.11 |
| D3 | Issue history with versions, per-analysis printed values and per-version change summary | New data (§6.2) | FR-4, FR-5.4, FR-6, FR-7 |
| D4 | Patient report corrected banner reading the change summary and version from D3 | OGC-1111 FR-A14, FR-A15 (FR-A15 moves from its V2 to its V1) | FR-4.5, FR-4.6 |
| D5 | Row filtering by lab-unit domain | OGC-1070 (menu filtering exists; row-level reuse to verify) | §8, BR-9 |
| D6 | OGC-776 amendment code deployed to the target release | Confirm (ticket shows Backlog, code on `develop`) | §3.1 |
| D7 | Server sizing guidance updated for archive growth | Docs | NFR-3 |
| D8 | Add Order typeahead endpoints restricted to child wards of chosen facilities | Endpoint extension if missing (r3 §7) | FR-3.5 |
| D9 | Export job row (Tag, one action, details) extracted from `ReportingView.jsx` into a shared component rendered by both Custom Data Export and this page | Refactor of shipped code | §5.11, §9 note |

---

## 11. Out of Scope

- Building exports, and any change to the export job runner, its states, limits or ready
  notification; both stay as shipped in Custom Data Export.
- Other long-running report types that do not run on the export job runner today; they can join
  as further row types once they do.
- Seeing another user's exports, including for Admin (Custom Data Export BR-016).
- Sending reports electronically (email, FHIR DiagnosticReport push, portal).
- A certificate numbering scheme (`LHU-YYYY-NNNN`). Certificates keep the lab number with
  `/Am.N`.
- Printing a preview of an order with nothing released.
- Choosing or versioning report templates (OGC-1111 V2).
- Deleting or replacing an archived version.

---

## 12. Acceptance Criteria

1. Opening `/ReportPrintQueue` shows the list without pressing anything; the first page of the
   default view meets NFR-1 on the fixture data set.
2. Validating the first result of a clinical order makes it appear as Partial 1/n, Unprinted,
   version "Not printed".
3. Printing it creates v1, opens the PDF, stores the PDF with a 64-character SHA-256, and the
   row shows Printed, v1.
4. Releasing the remaining results on that order returns it as Final, Unprinted (not Amended);
   printing creates v2, not amended, change summary "Added: …", no corrected banner, and the row
   shows Final, Printed.
5. Changing a printed result's value returns the order as Amended, Unprinted; printing creates
   v3, amended, with "{test} {old} → {new}" as the change summary, the patient report prints the
   corrected banner with "Version 3", and the row shows Amended, Printed. Releasing a further
   result later keeps the state Amended.
6. Printing a Printed row again returns byte-identical content to the archived version (same
   SHA-256) and adds a reprint line, not a version.
7. Reissue with correction with an empty reason is refused with the TextArea invalid state; with
   a reason it creates an amended version whose change summary is the reason.
8. A user without Results, Validation or Admin sees Reissue with correction disabled with its
   reason, and a direct request to reissue is refused before any validation error is returned.
9. An environmental order with a released result and no standard shows "Not evaluated against
   a standard" and prints its released results under that line, with no threshold, status or
   conclusion. Linking a standard afterwards returns it as Final, Unprinted (not Amended), with
   change summary "Evaluated against {standard}".
10. A partial environmental certificate prints with pending parameters and "Provisional: n of m
    parameters pending".
11. An amended environmental certificate carries `/Am.1` and "Supersedes"; completing a partial
    certificate does not increment `/Am.N`.
12. Selecting 12 rows of mixed types and Print selected opens one PDF with 12 reports, each paged
    from 1; each order gets its own version and archive entry.
13. Download selected produces a ZIP with one correctly named PDF per order; forcing one render
    to fail still delivers the others plus `_ERRORS.txt`, and the failed row keeps its status.
14. Selecting 101 rows disables the batch actions with the warning.
15. Scanning a lab number applies the lookup on the scanner's Enter, clears and disables the
    other filters, ignores the time window, and Clear search restores them.
16. An Unprinted row released 45 days ago shows under Last 7 days; a Printed row released 45
    days ago does not.
17. A user whose lab units are all Clinical never sees a certificate row, tile count or Type
    filter; a user with Clinical and Environmental sees both and the Type filter.
18. Selected Facility, Ward, Requester, Sampling site and Standard values show as chips with
    their labels.
19. Printing a patient report from Patient Status Report makes its queue row Printed with the
    same new version.
20. `/LaporanHasil` redirects to `/ReportPrintQueue?type=environmental`; the Compliance Report
    menu row is gone; Compliance Dashboard remains.
21. After migration, an order printed last month through Patient Status Report shows Printed v1,
    "Not archived (issued before …)"; an unprinted order released before install is not listed
    but is found by Lab No.
22. Every visible string on the page comes from an i18n key in §9; switching to French shows no
    English fallback for NEW keys.
23. The home dashboard Unprinted Results tile count equals the queue's patient Unprinted count
    for today, and clicking it opens the queue filtered to patient reports.
24. State = Amended with Print status = Unprinted lists exactly the amended reports not yet
    reprinted; State = Partial lists only reports with an unreleased result; the chips show the
    selected state names.
25. A user with a Generating export sees it in the queue as Data export, Generating, with no
    action; within one poll after it finishes it shows Ready to download with a Download button,
    and the Exports ready tile counts it. No other user, including Admin, sees the row.
26. A Failed export shows Retry, an Expired export shows Re-run (opening the Custom Data Export
    builder pre-filled with a blank date range), and a Queued export shows Cancel with the shipped
    confirmation.
27. With Type = All, selecting State = Final or Print status = Unprinted leaves export rows out;
    export rows cannot be selected for batch print.
28. Opening the old My Report Queue panel link, or the builder's "View My Report Queue" link after
    an asynchronous submit, lands on `/ReportPrintQueue?type=export`.

---

## 13. Coordination with other specs

| Spec | What changes there |
|---|---|
| OGC-1111 patient report FRS v2.2 | FR-A14 reads the replaced version and change summary from this spec's issue history instead of `document_track` plus the result note (FR-A40). FR-A15 and FR-A41 (version number) move from V2 to V1 because the queue needs them. FR-B7's "reprints use the image current at reprint time" no longer holds for reprints of an archived version (BR-5). N12 is now satisfied by this spec |
| S06 FRS (`S06-laporan-hasil-compliance-report-frs-v1.0.md`) | §5.2 and §5.5 (list page, batch) superseded by this spec; its permission keys (§4) were never built and stay unbuilt (D-006) |
| S06c / S06d | Partial certificate wording (D2); vector renderer (D1) |
| OGC-776 tasks | Its per-sample amendment columns become a cache; the per-version reason lives in the issue history |
| Navigation redesign FRS | Appendix A.1 gains `Reports › Report Print Queue` after Patient Status Report; `menu_reports_environmental` loses Compliance Report (Merge, redirect) |
| Custom Data Export FRS (`custom-data-export.md`, OGC-479 / OGC-481) | My Report Queue page (§4.6, FR-6-001 to FR-6-012) is now rendered inside this queue as the Data export type; its behavior rules stay in that FRS. Its "View My Report Queue" links point here (FR-11.6) |
| OGC-1031 | Epic body re-pointed to this revision; the 12 r3 child stories closed or rewritten by the developer against the slicing guide |
| Docs | The published manual page `laporan-hasil-report` (contracts.json) drifts when this ships and must be re-captured as the Report Print Queue page |

---

## 14. Resolved Questions

1. **Reprint returns the archived PDF (BR-5).** Yes (Casey, 2026-09-29). A reprint shows the
   logos and signature of the day the version was first issued, because that is what the lab
   sent. OGC-1111 FR-B7 is updated accordingly (§13).
2. **Migrated history (§6.3).** Accepted as written: pre-archive prints have no record of what
   was printed, so the first later result change on those orders is treated as amended.
3. **Amended Tag kind.** `magenta`, so Amended is not confused with the `blue` used for In
   progress / Draft elsewhere.

---

## 15. Decisions (added to the decision log as D-139 to D-145, D-149 and D-150)

| ID | Decision |
|---|---|
| D-139 | One Amended state for every report type; what caused the amendment is recorded as its change summary, never a separate status or filter |
| D-140 | Completing a partial report creates a new version, not an amended one; Amended applies only when printed content changed or was removed |
| D-141 | Every released version of every per-order report is archived as rendered with its SHA-256 and never overwritten; reprints return the archived bytes |
| D-142 | Per-order reports share one queue page with typed rows (`/ReportPrintQueue`); `/LaporanHasil` is merged into it |
| D-143 | Certificates join the queue on their first released result and may print as partial with a provisional conclusion, like patient reports |
| D-144 | Nothing that still needs printing ages out of the queue; the time window applies to printed rows only |
| D-145 | An environmental or vector order with no standard is never blocked: it prints its results marked "Not evaluated against a standard"; linking a standard later is an added evaluation, not an amendment |
| D-149 | Data export jobs are a row type in the Report Print Queue, shown only to their owner, with the shipped job states and actions; Custom Data Export keeps the builder and loses its own queue panel (Merge) |
| D-150 | Every per-order report is exactly one of **Partial, Final, Amended** (Amended wins and stays once reached), filterable; whether it still needs printing (Unprinted, Printed) is a separate filter. Amends D-139, which forbade an Amended filter only for the cause of an amendment |
