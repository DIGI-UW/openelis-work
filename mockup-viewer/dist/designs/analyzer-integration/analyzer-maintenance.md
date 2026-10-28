# Instruments: Maintenance, Certificates and Service Status

## Functional Requirements Specification

**Version:** 2.0 (approved for handoff, 2026-10-21). Replaces v1.0 (2026-06-05) in place; v1.0 was never built.
**Author:** Casey Iiams-Hauser
**Jira:** OGC-1015 (Epic, Ready; re-scoped to this version 2026-10-21)
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`) frontend
**Owns:** the instrument register (connected and not connected), the maintenance log with certificates, required checks per instrument, the derived **service status**, and the **instrument-test QC lock**.
**Does not own:** what a hold does to results. Runs (`designs/results-validation/runs.md`, OGC-1200) owns the hold, its actions and its rendering; this FRS publishes the status that Runs reads.
**Companion artifacts:** `analyzer-maintenance-preview.html` (replaces the v1.0 preview), `analyzer-maintenance.jsx` (Carbon handoff mockup), `analyzer-maintenance-breakdown.md` (slicing guide).
**What changed from v1.0:** non-connected instruments (balances, pipettes, spectrophotometers, incubators) join the register; certificates are recorded on maintenance events; each instrument has required checks; an overdue required check, a failed control, or a manual decision changes the instrument's service status, and that status holds results through Runs. The menu label becomes **Instruments**. The IA section is rewritten to match D-069 (QC lives under Quality, not under Analyzers). The prescriptive data model is replaced by an information description, per the standing convention that storage is the implementing engineer's decision.
**Origin:** SENAITE parity review (2026-10-21): SENAITE invalidates an instrument when its calibration certificate expires, while it is under calibration or validation, or when its latest QC fails, and refuses results from it. This FRS brings the same protection to OpenELIS while keeping OpenELIS's per-test QC model and override path.

---

## Lab Context

### Current State

A laboratory depends on dozens of instruments. Some are analyzers connected to OpenELIS (a Sysmex XN-550 hematology analyzer, an Abbott Architect chemistry analyzer, a GeneXpert for tuberculosis) and send results electronically. Many more are never connected: the analytical balance used to weigh samples for environmental metals testing, the pipettes that measure every volume, the spectrophotometer read by hand, the incubators that grow cultures, the HemoCue read at the bench. Every one of them must be calibrated or checked on a schedule, often by an outside vendor who issues a **calibration certificate**: a signed document stating the instrument was within specification on a date, and valid until a date, usually twelve months later.

Today that schedule lives on paper. A binder per instrument holds the certificates; a wall chart or a spreadsheet tracks due dates; the quality officer checks it before an audit. OpenELIS knows the connected analyzers exist, because it receives their messages, but knows nothing about their calibration, and does not know the non-connected instruments exist at all. When a control fails on an instrument, the technician recalibrates, re-runs the control and carries on; nothing in OpenELIS records that the instrument was unfit between the failure and the fix.

### Pain

An expired certificate is found by an auditor, not by the lab. In a typical ISO/IEC 17025 (the accreditation standard for testing laboratories) surveillance visit, the assessor picks a reported result, asks which balance weighed the sample, and asks for that balance's certificate. If the certificate expired three weeks before the result date, every result weighed on that balance in those three weeks is unsupported, and the lab must recall or qualify them. The lab had no warning, because the due date was on a spreadsheet nobody opened that month.

A failed control on Monday morning protects Monday morning's run, but not the run a second technician starts on the same analyzer at 10:00 before anyone has recalibrated. Nothing tells the second technician the analyzer failed QC two hours earlier. Service history is reconstructed from binders and vendor emails when an assessor asks for it ("we think it was serviced in March"), and the lab manager cannot answer "which of our instruments are fit for use today" without walking the bench.

### What Changes

Every instrument the lab uses is in OpenELIS, connected or not, with its required checks: "calibration by an accredited vendor every 12 months, out of service if overdue", "daily verification with check weights". A technician who receives a new certificate logs a Calibration event, types the certificate number, attaches the PDF and enters the valid-until date. Seven days before a certificate or check is due, an alert appears on the Home page. The day it lapses, the instrument shows **Out of service**, and any result produced on it is held on the technician's worklist with the reason "Balance B-02: calibration certificate expired 14 Oct", until a new certificate is logged or a validator accepts the result with a non-conformance record.

When a potassium control fails on the chemistry analyzer, the analyzer shows **Restricted: potassium**. Every potassium result from that analyzer is held, in this run and in any later run, until a potassium control passes on it again. Glucose on the same analyzer keeps flowing. The lab manager opens one page and sees every instrument with a green, amber or red status, and the assessor's question is answered from the instrument's log in under a minute.

---

## Overview

This FRS turns the analyzer area into the lab's **instrument register**. An instrument is either connected (an analyzer that sends messages, configured as today) or not connected (registered with a name, kind, location, serial number and the tests it is used for). Every instrument has a maintenance log, carried forward from v1.0, which now records certificates. Every instrument may have **required checks**, each with an interval or a certificate validity, and a choice of whether being overdue takes the instrument out of service.

From those checks, from manual decisions, and from control failures, OpenELIS derives one **service status** per instrument: **In service**, **Restricted** (one or more tests locked by a failed control) or **Out of service**. The status is computed once on the server and read by every surface: the Instruments list, the Maintenance page, the Results Entry instrument field, Runs, Alerts, the Home attention feed and the Management Dashboard. Runs turns an unfit status into a hold on the affected results, with the same Retest, Reject and Accept despite (with an NCE, a non-conformance event) actions it already defines for failed controls.

The FRS is version-agnostic; slicing happens at handoff.

### Navigation & URL

- **SideNav placement:** the Analyzers group is relabelled **Instruments** and becomes, in order: **Instruments** (the list, `/analyzers`), **Analyzer Types** (`/analyzers/types`), **Import Issues** (as D-069), **Maintenance** (`/analyzers/maintenance`, new). Amends D-069 (labels and one added child). QC stays under Quality › Quality Control.
- **Breadcrumb:** `Home / Instruments / Maintenance`; `Home / Instruments` for the list. Per-instrument pages keep `Home / Instruments / [instrument name] / <subpage>`.
- **URL routes:** routes do not change with the label. `/analyzers` (list), `/analyzers/maintenance` (log, all instruments), `/analyzers/maintenance?analyzerId=<id>` (one instrument: status panel, required checks, its log). Deep-linkable: the `analyzerId` and the **Show archived** toggle are carried in the query string. Per-instrument configuration keeps `/analyzers/{id}/<subpage>` (D-069). Verify each route against the live app before build (design-addendum MUST C).

---

## User Stories

- **As a bench technician,** I want to log a calibration with its certificate number and PDF the day the vendor leaves, so the certificate is where the assessor will look and the due date is tracked for me.
- **As a bench technician,** I want to see before I start a run that the instrument is out of service or restricted for my test, so I do not produce results that will be held.
- **As a quality officer,** I want an instrument to go out of service automatically when its certificate lapses, and its results to be held, so no result is reported from an instrument the lab cannot show was in specification.
- **As a lab supervisor,** I want a failed control to restrict that test on that instrument until a control passes again, so a second technician cannot run patients on it in the meantime.
- **As a lab manager,** I want one list of every instrument with its service status and next due check, so I can answer "what is fit for use today" without walking the bench.

---

## Functional Requirements

### A. The instrument register

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | The register holds every instrument the lab uses. An instrument is **Connected** (an analyzer configured with a bridge connection and test mapping, as today) or **Not connected** (no connection; results are entered by hand). Both are the same kind of record and appear in one list. | Reuses the `Analyzer` record (`org.openelisglobal.analyzer.valueholder.Analyzer`, develop `965d6d1`): a not-connected instrument has no `bridge_connection_id` and no mapping. D-360. |
| FR-A2 | **Add a not-connected instrument** from the Instruments list with a short inline form: Name (required, unique among active instruments), Kind (required, searchable list, see FR-A3), Manufacturer and model (text), Serial number, Asset tag, Location (room), Lab units (as for analyzers, D-043/D-045), and **Used for** (the tests performed with it, searchable multi-select over the test catalog, labels shown). Adding a connected analyzer keeps today's flow unchanged. | Used for is what lets a lock or an out-of-service status reach the right results (FR-E, FR-F). For a connected analyzer it is derived from the test mapping and shown read-only. |
| FR-A3 | **Kind** is a Dictionary category `INSTRUMENT_KIND`, seeded with Analyzer, Analytical balance, Pipette, Spectrophotometer, Incubator, Centrifuge, Microscope, Thermometer, Water bath, Biosafety cabinet, Refrigerator or freezer, Other. Labs extend it through the existing Dictionary admin. A connected instrument is Kind Analyzer by default and may be changed. | Dictionary reuse (MUST F). Refrigerators and freezers may be registered for their calibration certificates; their temperature monitoring stays with the existing cold storage alerts. |
| FR-A4 | The **Instruments list** (`/analyzers`) shows, per instrument: Name (with kind as secondary text), Connection (Connected / Not connected, plus today's connection state for connected analyzers), **Service status** (FR-D1, as a Tag with icon and word), Next due (the earliest due required check, red when overdue, amber within 7 days), Location, Lab units. Filters: Connection, Service status, Kind, Lab unit, search by name, serial number or asset tag. Deactivated instruments are hidden by default with a **Show deactivated** toggle (D-002). | The existing connection state (`Analyzer.status`: SETUP, VALIDATION, ACTIVE, ERROR_PENDING, OFFLINE, INACTIVE) is shown as it is today and never merged with service status (FR-D6). |
| FR-A5 | Instruments are deactivated and reactivated, never deleted. Deactivating an instrument with open runs or open locks is allowed and states how many runs reference it; its history stays readable. | D-002. |

### B. Maintenance log (carried from v1.0, extended)

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | One **Maintenance** page (`/analyzers/maintenance`) lists events for all instruments or, with an instrument selected, for that one. The scope filter is a filterable multi-select over instruments that shows selected names as removable chips. With nothing selected the summary strip shows lab-wide counts (events this period, overdue checks, due in the next 30 days, instruments out of service); with one instrument selected the status panel (FR-D4) replaces it. | v1.0 FR-MAINT-001, with the status panel added. |
| FR-B2 | The event table columns are: Instrument (hidden when exactly one is selected), Date, Type, Outcome, Certificate (number, with a PDF icon when one is attached), Valid until or Next due, and the row's Edit button. Every column sorts. Toolbar filters: date range, type, outcome, **Has certificate**, vendor. | v1.0 FR-MAINT-002; Certificate column and filter are new. D-111: Edit is the only row action; Archive is inside the expanded row. |
| FR-B3 | **Log new event** opens an inline row with: Instrument (search), Event type (Dictionary `EQUIPMENT_MAINTENANCE_TYPE`), Date performed, Performed by (user search) or Vendor, Outcome (Completed, In progress, Failed, Needs follow-up), Downtime hours, Cost, Parts replaced, Notes, **Valid until / Next due**, Verified by. When the event type is linked to a required check that is certificate-based (FR-C2), the row also shows **Certificate number**, **Issued by** (defaults to Vendor) and **Certificate file** (PDF upload). | v1.0 FR-MAINT-003 plus the certificate fields. The seeded event types gain Verification and Performance check beside Service, Calibration, Repair, Inspection, Cleaning. |
| FR-B4 | A certificate file is a PDF of at most 10 MB, stored and served with the existing attachment pattern (view and download from the event row). Once the event is verified (FR-B6) the file cannot be replaced; a corrected certificate is a new event that states which event it corrects. | D-086. |
| FR-B5 | Saving an event writes the audit trail and, when it is Completed and linked to a required check, recalculates that check's next due date and the instrument's service status at once (FR-D2). | |
| FR-B6 | **Verified by** records a second person. When the linked required check says verification is required (FR-C1), a Completed event does not satisfy the check until it is verified; until then the check shows **Awaiting verification** and the status panel says so. The verifier cannot be the person who performed or logged the event. | v1.0 left this optional and global; it becomes per check. ISO 15189 and ISO/IEC 17025 ask for review of calibration results before use. |
| FR-B7 | Events are archived, never deleted. Archive sits inside the expanded row with a confirmation; **Show archived** reveals archived rows, which can be unarchived. An archived event no longer satisfies a required check, and the status recalculates. | v1.0 FR-MAINT-005; D-002. |
| FR-B8 | Validation messages: Valid until earlier than Date performed is an error for a certificate-based check and a warning otherwise; negative cost or downtime is an error; a certificate-based check requires a certificate number and a Valid until date to be saved as Completed. | |

### C. Required checks per instrument

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | With one instrument selected, the Maintenance page shows a **Required checks** tile listing the checks this instrument must have. Each check has: Event type; Due by (**Certificate validity**, meaning the Valid until date on the last completed event, or **Interval**, a number of days or months after the last completed event); **Out of service when overdue** (Yes / No); **Verification required** (Yes / No). Checks are added and edited as inline rows; a check is deactivated, not deleted. | New information (Dependencies 3). Example for a balance: Calibration, Certificate validity, Out of service when overdue Yes, Verification required Yes; Performance check, Interval 1 day, Out of service when overdue No. |
| FR-C2 | A check's **next due date** is the Valid until of its most recent completed (and, where required, verified) linked event for certificate-based checks, or that event's date plus the interval. A check with no event yet is **Never done** and counts as overdue from the day the check is added, unless the user who adds it sets a first due date. | Lets a lab register existing instruments without being taken out of service on day one. |
| FR-C3 | Each check shows its state: **Current** (green), **Due soon** (within 7 days, amber), **Overdue** (red), **Awaiting verification** (amber), **In progress** (an In progress or Failed event of this type is the most recent one, amber or red per FR-D2). | Tag with icon and word, never colour alone. |
| FR-C4 | Alerts reuse the `EQUIPMENT_MAINTENANCE_DUE` alert type from v1.0: warning 7 days before a check falls due, critical on the due date, resolved automatically when a completed (and verified where required) event satisfies the check. A second alert type `INSTRUMENT_OUT_OF_SERVICE` is raised when an instrument enters Out of service and resolved when it leaves it. Both reach the Home attention feed and the Management Dashboard through the Alert table, as v1.0 FR-ALERT-002 specified. | One alert per instrument and check (existing Alert dedup). |
| FR-C5 | A daily job and every relevant save (event, verification, check edit, control recording) recalculate check states. A check that falls overdue at midnight local time takes effect for results produced from then on. | |

### D. Service status

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | Every active instrument has exactly one **service status**: **Out of service**, **Restricted**, or **In service**, in that order of precedence. Out of service applies to every test the instrument is used for. Restricted names the tests that are locked (FR-E). | D-361. |
| FR-D2 | An instrument is **Out of service** while any of these is true: (a) a required check with Out of service when overdue = Yes is Overdue or Never done; (b) the most recent event of such a check is In progress or Failed (the instrument is under calibration, or failed it); (c) a user took it out of service manually (FR-D3). Each true reason is listed; the status lifts only when none remains. | SENAITE equivalents: certificate expired, calibration or validation in progress. |
| FR-D3 | **Take out of service** and **Return to service** are actions on the status panel. Taking out requires a note (stored in the existing `note` table against the instrument). Return to service clears only the manual reason; if an automatic reason still stands, the panel says which one and the status stays Out of service. | Notes are never removed (project convention). |
| FR-D4 | The **status panel** (Maintenance page, one instrument selected) shows: the status Tag; each active reason as a sentence with its date and a link to the event, check or run behind it ("Calibration certificate C-4471 expired 14 Oct 2026", "Potassium locked: control L2 failed in RUN-2026-10-21-004 at 07:12"); the Required checks tile; and the actions the user may take. | One signal per problem (D-105): the list and other surfaces link here rather than restating the reasons. |
| FR-D5 | Service status is computed once, on the server, and exposed with its reasons to every consumer (FR-F). No screen derives it on its own. | Build-once rule from the crosscheck. |
| FR-D6 | Service status is separate from the analyzer **connection** state. An analyzer can be connected and Out of service (certificate lapsed, still sending results, which are held), or In service and offline (no messages arriving). Labels never mix the two. | `Analyzer.status` keeps its current meaning. |
| FR-D7 | Every change of service status is written to the audit trail with the reason that caused it (event, check, control, or user). | |

### E. Instrument-test QC lock

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | A **lock** on an instrument and a test is set when any of these is recorded: a control covering that test fails on a run whose instrument is this one (Runs FR-C2, FR-C3); a statistical QC rule rejects a control result for this instrument and test (a Westgard rejection rule, not a warning such as 1-2s); an instrument-level periodic check recorded through Analyzer Manual QC (OGC-428) fails, which locks every test the instrument is used for. | D-364. Blank and duplicate failures do not lock the instrument (D-368): they point at contamination or precision of a batch, not the instrument. |
| FR-E2 | While a lock stands, the instrument's status is Restricted (unless Out of service), the status panel names the test, the failing control and its run, and Runs holds the locked test's rows on this instrument in every run that does not carry a passing control for that test recorded after the lock was set (Runs FR-C9). | The run that failed is already held by Runs FR-C4; the lock extends protection to other open and later runs. |
| FR-E3 | A lock lifts automatically when a control for that test passes on this instrument in a later run (for a periodic-check lock: when the next periodic check passes). The passing run is not held by the lock it lifts. Rows already held by the lock in other runs stay held until a user dispositions them (Retest, Reject or Accept despite), because they were produced while the instrument was unfit. | D-364. Same principle as Runs FR-C6: a later pass does not release earlier results. |
| FR-E4 | A lock cannot be released by hand. The only override is per result, through Runs' **Accept despite QC failure** with its mandatory NCE. | Keeps "run controls until one passes" and "release the lock to get the morning out" from being paths. |
| FR-E5 | Results already accepted before the lock was set are not changed. The NCE that a failed control opens (Runs FR-C5, QA NCE trigger) is where the lab assesses earlier results. | Look-back stays with NCE and the Westgard affected-samples window (OGC-728). |

### F. What other features read from service status (consumption contracts)

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Runs.** At run creation and whenever the status changes, Runs reads the instrument's status and locks for the run's tests and applies the holds of Runs FR-C8 and FR-C9. Runs owns the hold, its tag, its actions and its audit events. | |
| FR-F2 | **Results Entry instrument field.** The Analyzer field on a result row (and the run header's instrument field) is a search over active instruments used for the row's test, each shown with its service status Tag. An Out-of-service or locked instrument stays selectable, because the result may still need recording, and selecting it shows one inline warning that the result will be held, with the reason. | Results Entry v4 D4 (Method and Analyzer split). |
| FR-F3 | **Instrument required per test.** Where the test's QC section says the instrument used must be recorded (Runs FR-H1), a result cannot be saved without naming an instrument. Otherwise naming one stays optional, and a result with no instrument named is not affected by service status. | Without this setting a technician could avoid a hold by leaving the field empty; the setting is per test so labs turn it on where it matters (gravimetric and volumetric methods, manual photometry). |
| FR-F4 | **Alerts, Home attention feed and Management Dashboard** read the two alert types (FR-C4) and the status; the Dashboard's equipment cards show status, next due check and last service. | OGC-897, OGC-896. |
| FR-F5 | **QC dashboard** shows open locks per instrument and test and links to the instrument's status panel. | Quality › Quality Control. |

---

## Information & Data

Described as information, not storage. Items marked **new** are listed in Dependencies.

- **Instrument (existing record, extended).** The `Analyzer` record: name, active flag, lab units (`test_unit_ids`), connection (`bridge_connection_id`, mapping, connection state). **New attributes:** kind (Dictionary `INSTRUMENT_KIND`), manufacturer and model text, serial number, asset tag, location (room), Used for tests (for not-connected instruments; derived from the mapping for connected ones).
- **Maintenance event (new, specified in v1.0 and not yet built).** Instrument, event type (Dictionary `EQUIPMENT_MAINTENANCE_TYPE`), date performed, performed by or vendor, outcome, downtime, cost, parts replaced, notes, valid until or next due, verified by and when, archived by and when. **New in v2.0:** certificate number, issued by, certificate file (attachment pattern, D-086), corrects-event link, linked required check.
- **Required check (new).** Instrument, event type, due-by rule (certificate validity, or interval in days or months), out of service when overdue, verification required, optional first due date, active flag. State is derived (FR-C3).
- **Service status (derived, never stored as an editable field).** Status plus its list of reasons, each pointing to a check, an event, a lock, or a manual decision. The manual out-of-service decision is new information: who, when, note.
- **Instrument-test lock (new).** Instrument, test (or all tests, for a periodic-check failure), set by (control on a run, statistical rule violation, or periodic check), set at, lifted by (the passing control or check), lifted at.
- **Alerts (existing entity).** `EQUIPMENT_MAINTENANCE_DUE` (specified in v1.0) and `INSTRUMENT_OUT_OF_SERVICE` (new value).
- **Audit events (existing audit trail, new vocabulary).** instrument added, updated, deactivated, reactivated; event logged, updated, verified, archived, unarchived; check added, updated, deactivated; status changed (with reason); taken out of service; returned to service; lock set; lock lifted.
- **Uniqueness.** Instrument name unique among active instruments; serial number unique per kind when entered; one active required check per instrument and event type; at most one open lock per instrument and test.

---

## Access

Who can do what, in user terms:

- Anyone who can see the analyzer area today sees the Instruments list, the Maintenance page and every instrument's status panel, read-only.
- Bench technicians (users with Results rights for at least one lab unit) can log maintenance events, attach certificates, and record a periodic check.
- A different user with validation rights verifies an event; the performer and logger cannot verify their own event.
- Lab supervisors and quality officers (validation rights or analyzer management) can take an instrument out of service and return it.
- Analyzer administrators add, edit, deactivate and reactivate instruments, edit required checks, and archive events.
- Nobody can release a lock or an out-of-service hold by hand. A user with Results rights for the lab unit can accept an individual held result with a mandatory NCE, through Runs.
- A user without a privilege sees the related button disabled with a tooltip naming what is needed, not hidden, so the status panel reads the same for everyone.

### Nominated privileges

Codes follow the PR #3443 catalogue form (D-235). The `analyzer` category shows under **Results** (Users and Roles Appendix A). Codes marked NEW must be checked against the catalogue on `develop` before minting. Until #3443 merges, the stand-in check is named in the last column.

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| See Instruments list, Maintenance page, status panels | `analyzer:view` (confirm in catalogue) | Results | As today (analyzer area access) |
| Add, edit, deactivate instruments; edit required checks; archive events | `analyzer:manage` (confirm in catalogue) | Results | As today (analyzer administration, Admin bundle) |
| Log maintenance events, attach certificates, record periodic checks | `analyzer:log_maintenance` **NEW** | Results | Roles that hold `result:enter` for any lab unit, and roles that hold `analyzer:manage`. Stand-in: Results rights |
| Verify a maintenance event | `analyzer:verify_maintenance` **NEW** | Results | Roles that hold `result:validate`. Stand-in: Validation rights |
| Take an instrument out of service, return it to service | `analyzer:set_service_status` **NEW** | Results | Roles that hold `result:validate` or `analyzer:manage`. Stand-in: Validation rights or Admin |
| Accept a held result despite an instrument hold | as Runs FR-C5 (`result:enter` per lab unit, with NCE) | Results | As Runs |

NEW codes: `analyzer:log_maintenance`, `analyzer:verify_maintenance`, `analyzer:set_service_status`. Each needs a translated label (Users and Roles N-UR-6) and a server-side check, not only a hidden control.

---

## Localization

Constitution Principle VII applies: search before minting (`npm run i18n:find`), reuse `common.*` where it exists (PR #3863). v1.0's keys are kept where the string survives. New keys are namespaced `analyzer.*`. The menu keys keep their names and change their English value; French, Spanish, Portuguese and Bahasa Indonesia values change with them.

| UI text | Key | Status |
|---|---|---|
| Instruments (menu group, list title, breadcrumb) | `sidenav.analyzers`, `sidenav.analyzers.all`, `breadcrumb.analyzers` | REUSE key, value changes from "Analyzers" |
| Maintenance | `sidenav.analyzers.maintenance`, `breadcrumb.analyzers.maintenance` | REUSE (v1.0) |
| Add instrument / Connected analyzer / Not connected instrument | `analyzer.add.title`, `analyzer.add.connected`, `analyzer.add.notConnected` | NEW |
| Kind, Manufacturer and model, Serial number, Asset tag, Location, Used for | `analyzer.field.kind`, `.makeModel`, `.serialNumber`, `.assetTag`, `.location`, `.usedFor` | NEW |
| Connection: Connected / Not connected | `analyzer.connection.label`, `.connected`, `.notConnected` | NEW |
| Service status | `analyzer.service.label` | NEW |
| In service / Restricted / Out of service | `analyzer.service.inService`, `.restricted`, `.outOfService` | NEW |
| Restricted: {tests} | `analyzer.service.restrictedTests` | NEW |
| Take out of service / Return to service | `analyzer.service.takeOut`, `analyzer.service.return` | NEW |
| Why is it out of service? (note label) | `analyzer.service.takeOutNote` | NEW |
| Still out of service: {reason} | `analyzer.service.stillOut` | NEW |
| Reasons: calibration certificate {number} expired {date}; {check} overdue since {date}; {check} in progress since {date}; {check} failed on {date}; taken out of service by {user} on {date}; {test} locked: {control} failed in {runId} at {time}; all tests locked: periodic check failed on {date} | `analyzer.service.reason.certExpired`, `.checkOverdue`, `.checkInProgress`, `.checkFailed`, `.manual`, `.testLocked`, `.periodicFailed` | NEW |
| Next due | `label.analyzer.maintenance.column.nextDue` | REUSE (v1.0) |
| Certificate, Certificate number, Issued by, Certificate file, Valid until, Has certificate | `analyzer.maintenance.certificate`, `.certificateNumber`, `.issuedBy`, `.certificateFile`, `.validUntil`, `.filter.hasCertificate` | NEW |
| Corrects event of {date} | `analyzer.maintenance.corrects` | NEW |
| Required checks, Add check, Event type, Due by, Certificate validity, Interval, Every {n} days / months, Out of service when overdue, Verification required, First due date | `analyzer.check.title`, `.add`, `.eventType`, `.dueBy`, `.certificateValidity`, `.interval`, `.everyDays`, `.everyMonths`, `.outOfServiceWhenOverdue`, `.verificationRequired`, `.firstDue` | NEW |
| Current / Due soon / Overdue / Awaiting verification / In progress / Never done | `analyzer.check.state.current`, `.dueSoon`, `.overdue`, `.awaitingVerification`, `.inProgress`, `.neverDone` | NEW |
| Verification and Performance check (seeded event types) | Dictionary entries in `EQUIPMENT_MAINTENANCE_TYPE` | NEW dictionary values |
| Instrument kinds (seeded) | Dictionary entries in `INSTRUMENT_KIND` | NEW dictionary values |
| Event outcomes, form labels, archive, show archived, summary strings, v1.0 validation messages | `label.analyzer.maintenance.*`, `validation.analyzer.maintenance.*` | REUSE (v1.0); "Filter by analyzer" and "All analyzers" values change to "instrument" |
| {n} instruments out of service | `analyzer.maintenance.summary.outOfService` | NEW |
| You cannot verify an event you performed or logged | `validation.analyzer.maintenance.selfVerify` | NEW |
| A certificate-based check needs a certificate number and a valid-until date | `validation.analyzer.maintenance.certificateRequired` | NEW |
| This instrument is {status}: results will be held ({reason}) | `analyzer.picker.willBeHeld` | NEW (shown in Results Entry and the run header) |
| Show deactivated, Deactivate, Reactivate, Edit, Save, Cancel, Search | `common.*` | REUSE, PENDING #3863 |
| Alert titles and messages: Instrument out of service; {instrument} is out of service: {reason} | `label.alert.instrumentOutOfService.title`, `.message` | NEW (alongside the v1.0 `label.alert.equipmentMaintenanceDue.*`) |

Audit events use the `analyzer.audit.*` namespace (instrumentAdded, instrumentUpdated, instrumentDeactivated, instrumentReactivated, eventLogged, eventUpdated, eventVerified, eventArchived, eventUnarchived, checkAdded, checkUpdated, checkDeactivated, statusChanged, takenOutOfService, returnedToService, lockSet, lockLifted).

---

## Dependencies

1. **Maintenance event record** (v1.0, not built) with the v2.0 certificate attributes. Storage is the implementing engineer's decision.
2. **Instrument attributes** on the `Analyzer` record: kind, manufacturer and model, serial number, asset tag, location, Used for tests (not-connected instruments). The v1.0 spec referred to `Analyzer.type` and `Analyzer.location`; neither is on the entity at develop `965d6d1`, so all are new.
3. **Required check** information (FR-C).
4. **Instrument-test lock** information and the evaluator that sets and lifts it (FR-E), fed by run controls, `qc_rule_violation` (Westgard, existing) and Analyzer Manual QC (OGC-428, not built).
5. **Runs** (OGC-1200, Backlog): every hold effect. Until Runs ships, service status and locks are visible (list, status panel, picker warning, alerts) but hold nothing. Declared so no slice promises a hold before Runs exists.
6. **Attachment storage pattern** (OGC-811, D-086) for certificate files.
7. **Dictionary categories** `INSTRUMENT_KIND` (new) and `EQUIPMENT_MAINTENANCE_TYPE` (v1.0, plus two seeded values).
8. **Alert type** `INSTRUMENT_OUT_OF_SERVICE` (new value on the existing enum).
9. **Privilege catalogue** PR #3443 (not merged) for the nominated codes.
10. **Test Catalog QC section** (OGC-1148, In Review) for the "Record the instrument used" setting, owned by Runs FR-H1.

Feature flags: none. A lab that defines no required checks and records no controls sees every instrument In service and no holds.

---

## Out of Scope

- What a hold does, how it renders on the worklist and in Validation, and its override actions: Runs owns them.
- Cold-storage temperature monitoring (existing freezer alerts).
- Asset procurement, depreciation, vendor contracts and a vendor master list (vendor stays text).
- Reading a certificate PDF automatically (dates and numbers are typed).
- Reminder delivery by email or SMS; Result Delivery's foundation can carry it later.
- Parts inventory linkage (parts replaced stays text).
- Pre- and post-calibration QC linkage beyond what the lock already does.
- Equipment that never produces or supports a result and has no calibration (furniture, computers).

Anything listed here is absent from `analyzer-maintenance-preview.html`; it has no stubbed sections.

---

## Acceptance Criteria

Register

- [ ] A not-connected instrument can be added from the Instruments list with Name, Kind, Used for and the optional fields; it appears in the same list as connected analyzers with Connection = Not connected (FR-A1, FR-A2).
- [ ] Kind is a Dictionary category with the seeded values; a lab-added kind appears in the picker (FR-A3).
- [ ] The list shows Service status and Next due per instrument, filters by Connection, Service status, Kind and Lab unit, searches name, serial number and asset tag, and hides deactivated instruments behind Show deactivated (FR-A4, FR-A5).
- [ ] The menu reads Instruments, Analyzer Types, Import Issues, Maintenance; routes are unchanged; breadcrumbs read Home / Instruments / ... (Navigation & URL).

Maintenance and certificates

- [ ] An event linked to a certificate-based check cannot be saved as Completed without a certificate number and Valid until; the PDF uploads, views and downloads; it cannot be replaced after verification (FR-B3, FR-B4, FR-B8).
- [ ] When verification is required, a completed event satisfies its check only once a different user verifies it; the performer and logger cannot verify (FR-B6).
- [ ] Archiving an event that satisfied a check makes the check due again and recalculates status (FR-B7).

Required checks and status

- [ ] A check's next due date follows FR-C2 for both certificate-validity and interval checks; a new check with no event and no first due date is Never done and overdue (FR-C2, FR-C3).
- [ ] 7 days before due a warning alert appears; on the due date it becomes critical; a satisfying event resolves it (FR-C4).
- [ ] An instrument becomes Out of service the day an Out-of-service-when-overdue check lapses, while such a check's latest event is In progress or Failed, or when taken out manually; it lists every reason; it returns to In service only when no reason remains (FR-D2, FR-D3).
- [ ] Return to service with an automatic reason still standing leaves the instrument Out of service and says which reason (FR-D3).
- [ ] A connected analyzer that is Out of service keeps its connection state, and the two are shown separately (FR-D6).
- [ ] Every status change appears in the audit trail with its cause (FR-D7).

Locks

- [ ] A failed control for potassium on a run on analyzer A sets a lock on (A, potassium); A shows Restricted: Potassium; glucose on A is unaffected (FR-E1, FR-E2).
- [ ] A Westgard rejection on (A, potassium) sets the lock; a 1-2s warning does not (FR-E1).
- [ ] A failed periodic check on A locks every test A is used for (FR-E1).
- [ ] A later run on A whose own potassium control passes is not held and lifts the lock; potassium rows in other runs held during the lock stay held until dispositioned (FR-E3).
- [ ] No screen offers a way to release a lock by hand (FR-E4).

Consumers

- [ ] With Runs built, a result on an Out-of-service instrument, or a locked test on a Restricted instrument, is held with the reason from the status panel (FR-F1; Runs FR-C8, FR-C9).
- [ ] The Results Entry instrument field shows each instrument's status and warns inline before a held result is saved (FR-F2).
- [ ] Where the test requires the instrument to be recorded, a result cannot be saved without one (FR-F3).
- [ ] The Home attention feed and Management Dashboard show out-of-service instruments and due checks from the Alert table (FR-F4).

Non-functional

- [ ] Instruments list and Maintenance page load in under 1.5 s for 200 instruments and five years of events; status for one instrument is returned with its reasons in one request.
- [ ] The daily recalculation completes in under 30 s for 500 instruments and 2,000 checks.
- [ ] All visible strings use the Localization keys; status is always icon plus word, never colour alone; keyboard and screen reader access meets WCAG 2.1 AA.
- [ ] Every write in the audit vocabulary appears in the audit trail with user and time.

---

## Decisions (provisional IDs; renumber from main's next free ID at registration)

| ID | Decision | Scope |
|---|---|---|
| D-360 | **One instrument register on the `Analyzer` record, connected or not.** The UI noun is Instruments; routes stay `/analyzers`. Amends D-069: the group is labelled Instruments and gains Maintenance as its fourth child | GLOBAL |
| D-361 | **Service status (In service, Restricted, Out of service) is derived on the server, once**, with its reasons, and is never the analyzer connection state | GLOBAL |
| D-362 | **A certificate is a maintenance event** with a number, issuer, PDF and valid-until date; no separate certificate record | FEATURE |
| D-363 | **An unfit instrument holds results through the Runs gate**; the only override is per result with an NCE. No hard block and no manual release | GLOBAL |
| D-364 | **A failed control (or Westgard rejection, or failed periodic check) locks that test on that instrument across runs; the next passing control for that test on that instrument lifts it.** Reverses Analyzer Manual QC BR-AQC-005 (non-blocking) | GLOBAL |
| D-368 | **Blank and duplicate failures never lock an instrument**; they hold their run only (Runs) | FEATURE |

## Supersession notes (add at the top of each affected spec)

- **`analyzer-manual-qc.md` (OGC-428).** BR-AQC-005 is reversed: a failed periodic check locks every test the instrument is used for (this FRS FR-E1, D-364). Recording stays as specified.
- **`runs.md` (OGC-1200).** Reads service status and locks (Runs FR-C8, FR-C9, FR-F1 here).
- **Decision log D-069.** Labels and children amended by D-360.
- **`lab-management-dashboard.md` (OGC-897) and Home redesign (OGC-896).** Equipment cards and the attention feed gain service status and the `INSTRUMENT_OUT_OF_SERVICE` alert.

## Open questions

1. Should an **overdue periodic check** (OGC-428 daily QC not done) restrict the instrument, or only raise an alert? Default: alert only; a failed check restricts, a missing one does not. A lab that wants stricter behaviour adds the periodic check as a required check with Out of service when overdue.
2. Should a lab be able to set the 7-day warning lead time per check (a vendor visit needs weeks of notice)? Default: fixed at 7 days, plus the 30-day count in the summary strip.
3. Does the user manual's analyzer chapter (OGC-1297 doc review) retitle to Instruments in the same release? Default: yes, flagged for the Feature Doc.
