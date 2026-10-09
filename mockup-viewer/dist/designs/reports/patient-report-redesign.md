# Patient Report & Report Management
## Functional Requirements Specification, v2.4.3

| | |
|---|---|
| **Status** | Draft for final review. Ready for `/breakdown` once approved. |
| **Date** | 2026-10-02 (v2.4.3: Microbiology v2 draft 10.4: a received isolate prints "Isolate received from {laboratory}" in the Culture group with †, and the sender's organism only when this laboratory did not confirm it, FR-A47a; "Tested elsewhere" wording, FR-A47; partial releases come from Release partial report, FR-A50 (D-194, D-195, D-201). Also folds in the draft 10.3 changes: tests on a culture are catalog tests whose printing is decided by In lab only, and a Gram stain prints as a multi-component block, FR-A42, FR-A43, FR-A48 (D-183 to D-185). v2.4.2: Part B, Report Management, moved to `admin-redesign-frs.md` §13; this FRS keeps the patient report. v2.4.1: a Microbiology case prints under four group sub-headers, Initial testing, Culture, AST / DST and Additional testing, FR-A42 and FR-A42a, D-181 (Microbiology v2 draft 10.2). v2.4: Samples block listing every sample with its collection and receipt time and condition, rejected tests; FR-A59, FR-A60. v2.3.4 2026-10-02: FR-A42 and FR-A43 follow Microbiology v2 draft 9.4, a Gram stain on a culture prints only when Report this result is on; v2.3.3: FR-A48 any micro note can be internal or external, notes on culture rows, subcultures and microscopy exams print under the culture row; v2.3.2: FR-A42 and FR-A44 follow Microbiology v2 draft 9, tests on a positive culture, cases with no culture, refer to previous susceptibility; v2.3.1: FR-A48 notes on every micro case result and culture row, Microbiology v2 A-13; v2.3: labels from the UI translation catalogue, completed date and time per test; decision IDs renumbered to D-151 to D-161. v2.2 2026-09-29: microbiology results, §7.4) |
| **Owner** | Casey Iiams-Hauser |
| **Jira** | Epic **OGC-1111** covers this whole FRS. **OGC-932** (PNG / CPHL Phase II item 6) is re-scoped to the V1 patient report and linked to OGC-1111. |
| **Related** | OGC-686 Test Accreditation (Acceptance), OGC-720 patient-report accreditation logos, OGC-302 report-level e-signatures (`designs/other/report-level-signatures.md`), OGC-714 critical callback log, OGC-1121 critical flags, OGC-1126 / OGC-1127 multi-component results (Done), OGC-560 date of birth (Done), OGC-1031 Report Print Queue (specced, not built), OGC-1266 Clinical Order Entry v4, OGC-1383 Microbiology v2 (micro results print in this report, §7.4), OGC-1031 Report Print Queue r4 (issue history and versions) |
| **Supersedes** | `designs/reports/patient-report-redesign.md` (rounds 1 to 4 and the PR-13 edit), `patient-report-redesign-addendum-r5.md`, `patient-report-accredited-tests-notes-handoff.md`, `designs/admin-config/report-management.md` v1.0, and the layout parts of `report-level-signatures.md` listed in §14.1 |
| **Verified against** | `DIGI-UW/OpenELIS-Global-2` `develop` at 44dbc44 (2026-09-26): `PatientReportCDI_vreduit.jrxml`, `CDIHeader.jrxml`, `patient.jrxml`, `PatientCILNSPClinical_vreduit.java`, `PatientReport.java`, `Report.java`, `ReportController.java`, `ReportImplementationFactory.java`, `ResultAlertFlags`, `AccreditationReportService`, `CriticalCallback`, `DocumentTrack`, `ResultSignature`, `reportconfiguration.Report`, `SystemConfiguration.properties` |
| **Governing decisions** | D-002, D-005, D-006, D-008, D-009, D-010, D-012, D-013, D-022, D-063, D-064, D-065, D-066, D-079, D-080, D-082, and new D-151 to D-161 (§14) |

**How to read this.** Part A is the printed patient report (a PDF). Part B, the Report Management admin page that controls it, moved to the Admin Redesign FRS §13 on 2026-10-02 (a pointer and crosswalk remain here). Every requirement carries a **V** column: **1** ships in V1, **2** ships in V2, **M** ships with Microbiology v2 (OGC-1383) on top of the V1 templates. §17 maps the report against ISO 15189:2022. The suggested slicing into pull requests is in `patient-report-and-report-management-breakdown.md`; it guides the developer and does not bind them. Appendix A holds the band-by-band Jasper notes.

> **Correction to the earlier spec.** Rounds 1 to 5 targeted `patient.jrxml`, which no report class renders any more. The Patient Status Report menu entry (`/Report?type=patient&report=patientCILNSP_vreduit`) runs `PatientCILNSPClinical_vreduit`, which renders **`PatientReportCDI_vreduit.jrxml`** with the **`CDIHeader`** subreport. That template already prints date of birth, the lab director's signature image, name and title, the OGC-686 accreditation logos and body line, and the BB / EE critical letters. This FRS targets it.

**Three design rules run through Part A.**

1. **Black and white first.** Labs print on monochrome laser printers and photocopy the result. The templates use black and grays only. Meaning is carried by type weight, glyphs, bar thickness and dash style, never by hue.
2. **As few pages as possible.** A typical order (up to about 35 results in 4 sections) fits on one page, Letter or A4. Rows are single-line by default, the method sits in its own column rather than a second line, column headers print once per page, pages after the first use a compact header, and the sign-off flows after the last result instead of being pushed to the page bottom.
3. **Square logos fit.** Most lab, ministry and accreditation marks are square or close to it. Every logo slot is square and scales any shape to fit without distortion.

---

## Lab Context

### Current State

When a validated result is released, someone at the lab (usually a reception clerk or the section supervisor) prints the **patient report**: the PDF the clinician reads to make a treatment decision. They open Reports › Patient Status Report, pick a patient or a range of lab numbers, and OpenELIS renders a PDF from a JasperReports template. The template in use dates from the Côte d'Ivoire deployment and is laid out for US Letter paper only. It is printed on a black-and-white laser printer, often photocopied, and filed on the ward or in the patient's folder. An assessor may pull any report months later and check it against the lab's records.

The report's two header logos and the lab director's signature image are uploaded on **Admin › Printed Report Configuration**. The lab's name, the director's name and title and an "additional site information" line are set elsewhere. No screen shows which template renders the report. A different layout means a developer edits the template and the deployment is rebuilt.

### Pain

- **Critical and abnormal values are easy to miss.** The only signal is a letter in a narrow column at the right edge. A clinician scanning a three-page chemistry panel can miss a potassium of 6.8 mmol/L. A critical value (one that needs a phone call to the clinician now) differs from a slightly high one only by a doubled letter. Results Entry fixed this on screen; the printed report did not.
- **The flag letters are French and untranslated.** The report prints `B` (bas, low), `E` (élevé, high), `BB` and `EE` whatever language the lab uses. An English-speaking clinician reads `E` as "error".
- **Short orders take two pages.** The sign-off box is pinned to the bottom of the last page and the header is repeated in full, so a five-test order often spills onto a second sheet. That doubles paper and toner, and page 2 gets separated from page 1.
- **A4 labs get a Letter layout.** Papua New Guinea, Madagascar, Indonesia and most labs outside the US print on A4. The Letter page is scaled or cropped, and the right-hand flag column goes first.
- **Square logos are squashed.** The logo boxes are wide rectangles. A round ministry seal or a square accreditation mark prints tiny or distorted.
- **The report misses things an ISO 15189 assessor checks.** (ISO 15189 is the international standard medical labs are accredited against.) It does not say who released the results or when, does not identify results outside the lab's accredited scope even though it prints the accreditation logo, can omit page numbers, has no end-of-report mark, and a corrected report does not say which report it replaces. The critical-result phone calls the techs already log in OpenELIS do not print either, so the assessor asks for a separate log.
- **The report is only in English or French.** The screens ship in about 30 languages, including Bahasa Indonesia and Spanish, but the report reads its labels from a separate English and French file. An Indonesian lab works in Bahasa all day and prints its reports in English.
- **The samples are one run-on line.** The report joins every sample's type, number and collection time into a single line ("Specimen collection times: Serum 26-0001-1 24/09/2026 08:10, Whole blood ..."). It never says when each sample reached the lab or that a sample was rejected.
- **You cannot tell when each test was finished.** The report shows when the sample was collected and received, not when each result was completed, so a clinician cannot tell a result from this morning from one finished two days ago on the same order.
- **Who performed a referred test is buried** in the free-text note, and **the method is never shown**, although OpenELIS records it on every analysis.
- **Nobody can tell which template a site is using.** A customized template is a fork. The next upgrade either overwrites it or is skipped to protect it, and no screen shows which happened.

### What Changes

**V1.** The report keeps every field it prints today and reads clearly in black and white: critical values carry a double arrow, a heavy left bar, a bold value and a reversed CRITICAL tag; high and low values carry an arrow, a bold value and a solid or dashed bar. Every label prints in the same language and wording as the screens the lab already uses, in any language OpenELIS ships. Flag letters print in the lab's language. A Samples block lists every sample on the order with when it was collected and received and any rejection. Each test shows the date and time it was completed. Each result shows its method, or the lab that performed it. Critical callbacks print under the result. The report names who validated and released it and when, marks any result outside the accredited scope, numbers every page, ends with "End of report", and a corrected report says which report it replaces and what changed. A typical order fits on one page. The administrator opens **Admin › Report Management** (which replaces Printed Report Configuration), chooses Letter or A4 once for the whole lab, and manages the report's logos, signature and header lines in one place.

**V2.** The same page lists every report and the template behind it. An administrator can switch a report to another template (a bundled variant, or a custom one the server operator placed in the configuration folder), render it with sample data first, and revert at any time; upgrades never silently overwrite a custom choice. Corrected reports also carry a version number, and the last page lists which tests fall within each accreditation.

---

## 1. Overview

1. **The patient report** (the output). V1 replaces `PatientReportCDI_vreduit.jrxml` with two new templates, `patient_letter.jrxml` and `patient_a4.jrxml`, identical except for page size and column widths. They render behind the same report key (`patientCILNSP_vreduit`), so menu links and bookmarks keep working. They carry their own header instead of the shared `CDIHeader` subreport, which pathology, cytology, TB and the program reports also use and must not change.
2. **Report Management** (the control surface). An admin page for the settings that shape printed reports: the global paper size, the report's header and branding, and (V2) which template renders each report. Specified in `admin-redesign-frs.md` §13.

The report's data contract changes only where a requirement names a new field. Each new field is either held by OpenELIS today and only needs passing to the template, or is declared in §11.2.

### 1.1 Navigation & URL

**Report Management (admin page):** navigation, breadcrumb and route are in `admin-redesign-frs.md` §13 (Config › Report Management, `/MasterListsPage/reportManagement`).

**Patient report (the PDF)** keeps its entry point, Reports › Patient Status Report (`/Report?type=patient&report=patientCILNSP_vreduit`). When the Report Print Queue (OGC-1031) is built it prints through the same report, so it gets the new template with no extra work.

---

## 2. User Stories

1. **As a clinician** reading a photocopied report, I want critical and abnormal values to stand out from arm's length, so that I act on a critical potassium without hunting for a letter in the last column.
2. **As a clinician**, I want to see who at the lab called me about a critical result and whether I read it back, so that the paper record matches the phone call.
3. **As a lab director**, I want the report to show who released it, which bodies accredit the lab and which results are outside that scope, so that it passes an ISO 15189 assessment without a separate letter.
4. **As a lab administrator**, I want to choose Letter or A4 once and manage the report's logos and signature on one page, so that the report fits our paper and carries our identity.
5. **As a lab manager**, I want a short order to print on one sheet, so that we save paper and pages do not get separated.
6. **As a lab administrator (V2)**, I want to see which template each report uses, try another with sample data, and revert in one click, so that a layout change is never a one-way door.

---

## 3. Release Plan at a Glance

| | V1 | V2 |
|---|---|---|
| **Patient report** | New black-and-white, page-saving layout; Letter and A4 templates; square logo slots; translated flags with arrows; critical and abnormal treatment; method column with performing lab for referred tests; multi-component block; critical callback line; released-by; Samples block (collection and receipt time, condition, rejection); completed date and time per test; labels from the UI translation catalogue in every shipped language; non-accredited marker; corrected-report reference; page x of y and "End of report"; accreditation marks per order; remove the unused `patient.jrxml` | Version number on corrected reports; per-test accreditation coverage block; specimen-quality (HIL) chip; earlier callback attempts appendix |
| **Report Management** | New page replacing Printed Report Configuration: global paper size; patient report header and branding; read-only list of the other reports | Template registry: switch template, templates from the configuration folder, preview with sample data, revert, upgrade notice, history |
| **New data** | Paper-size setting; template fields filled from data OpenELIS already holds | Template choice per report; issue version stored with each report issue |
| **Microbiology (M)** | Ships after V1, with Microbiology v2 (OGC-1383): case results as ordinary rows, a susceptibility block per isolate, micro callback lines, micro releases as report issues (§7.4) | Unchanged |
| **Depends on** | OGC-686 (built, in Acceptance); `critical_callback` (built); `result_signature` (built) | Engine choosing templates from the registry; HIL specimen-quality work; order entry v4 data for body site and panel changes |

---

# Part A: The Patient Report

## 4. Page, Paper and Type

| ID | Requirement | V |
|---|---|---|
| FR-A1 | Two templates ship: `patient_letter.jrxml` (612 × 792 pt) and `patient_a4.jrxml` (595 × 842 pt), both with 30 pt left and right and 20 pt top and bottom margins. Same bands, same column order, same row heights; only page size and the widths in Appendix A.10 differ. A4 uses its extra height for more result rows. | 1 |
| FR-A2 | `PatientCILNSPClinical_vreduit` renders the template that matches the paper-size setting (RM-2, Admin Redesign FRS): A4 → `patient_a4`, otherwise `patient_letter`. The report key `patientCILNSP_vreduit` is unchanged. | 1 |
| FR-A3 | `PatientReportCDI_vreduit.jrxml` stays in the repository, unreferenced, for one release so a deployment can compare. `patient.jrxml`, which nothing renders, is removed. | 1 |
| FR-A4 | The new templates carry their own header band. `CDIHeader.jrxml` is not changed. | 1 |
| FR-A5 | Every visible string resolves from the same translation catalogue the screens use (§13.1, FR-A53 to FR-A57). No text is hard-coded in the templates. | 1 |
| FR-A6 | The templates use fonts from a JasperReports font extension added with this work: **DejaVu Sans** and **DejaVu Sans Mono**, embedded in the PDF. DejaVu Sans contains the arrow glyphs FR-A21 needs (U+2191, U+2193, U+21C8, U+21CA). PDFs render the same on a server with no system fonts. | 1 |
| FR-A7 | **Monochrome.** The templates use black (`#000000`) and two grays only: `#595959` for secondary text and rules, `#e6e6e6` for the single fill used (critical rows). No other fills. Every meaning survives a photocopy (matrix, Appendix A.11). | 1 |
| FR-A8 | **Size floors.** Result values 9 pt; test names, flags, ranges and units 8.5 pt; method, notes, callback lines and footers 7 pt minimum. Nothing clinical prints below 7 pt. | 1 |
| FR-A9 | **Page economy.** A fixture order of 34 single-line results in 4 sections on 2 samples, with 2 notes and 1 critical callback, fits on one page on both Letter and A4 (AC-2). Rows are single-line unless a value wraps; section titles are one line; column headers print once per page, not per section; there are no blank spacer bands. | 1 |

## 5. Header

| ID | Requirement | V |
|---|---|---|
| FR-A10 | **Page 1 header (56 pt).** One row: left logo in a **48 × 48 pt square** slot; a centre block with the lab name (12 pt bold), the report title, the additional site information line, and the lab director line ("Lab director: {title} {given name} {surname}", composed from the three existing settings as `report-level-signatures.md` §5.8.1 defines); the accreditation marks (FR-A13); the right logo in a 48 × 48 pt square slot. Logos scale to fit their square keeping their shape, centred. An empty setting leaves its space blank without moving anything else. | 1 |
| FR-A11 | **Report title** follows `report-level-signatures.md` §6.2: "Results: final report" when every non-cancelled result on the report is validated, "Results: partial report" otherwise. | 1 |
| FR-A12 | **Continuation header (pages 2+, 30 pt).** Left logo at 24 × 24 pt, lab name and report title on one line, and "Page x of y" at the right; then the patient strip (FR-A17). | 1 |
| FR-A13 | **Accreditation marks.** The up-to-three logos the report already receives (`accredLogo1..3`, in `display_order`) print in square **32 × 32 pt** slots between the centre block and the right logo, and `accredNotesLine` ("Tests on this report are accredited by: ISO 15189, SANAS.") prints as the last line of the centre block at 7 pt. The slots reserve their width whether or not anything qualifies, so the header never reflows. Selection rules are unchanged from OGC-686 (finalized, in-house tests only; gate evaluated as of the release date so a reprint reproduces the original), with one fix: the marks are resolved **per order**, not once per print run, so a multi-order print shows each order its own bodies. | 1 |
| FR-A14 | **Corrected report reference.** When any result on the report was changed after the order's patient report was first issued, a bordered banner (1.5 pt black rule, bold) under the header reads: "Corrected report. Replaces the report issued {date time}. Change: {summary}." The replaced-report date is the latest earlier patient-report issue for this order in the report tracking history (FR-A40); the summary is the note entered when the result was changed, or "See the replaced report" when none was entered. The banner is derived from the data each time the report prints, so reprints keep it (today's one-time flag is cleared at the first print, which loses the banner). | 1 |
| FR-A15 | **Version number.** The corrected banner adds "Version {n}". The version is recorded with each issue when it is generated, so reprints do not count as new versions (§11.2 N6). | 2 |

## 6. Patient and Order Block

| ID | Requirement | V |
|---|---|---|
| FR-A16 | **Page 1 card (about 62 pt), three columns.** **Patient:** name (10 pt bold) with age and sex, date of birth, patient ID, national ID, and when their switches are on billing number (`useBillingNumber`, label from `billingNumberLabel`), ST number (`useSTNumber`), contact-tracing index name and record number (`useContactTracing`). **Order:** lab number (bold), program, requester (`contactInfo`, which holds the requesting provider), referring site and ward (`siteInfo`). **Dates:** order date, completed (FR-A58). Collection and receipt are per sample and print in the Samples block (FR-A59), not here. Rows whose switch is off close up. Every field `PatientReportCDI_vreduit` prints appears (field map, Appendix A.12). | 1 |
| FR-A59 | **Samples block.** Directly under the card and before the first section title, on page 1 only, always printed (one sample included) and never split across pages. A heading row in the card's block-label style ("#", "Samples", "Collected", "Received", "Condition"), then one 8 pt line per sample: **#** the sample number, the same value the results' Sample column prints (FR-A19); **Sample** the localized sample type; **Collected** the sample's collection date and time (`sample_item.collection_date`), or "Not recorded"; **Received** the sample's receipt date and time (`sample_item.received_date`), falling back to the order's received time; **Condition** "Rejected: {reason}" in bold when the sample was rejected (localized name of `reject_reason_id`), otherwise the collection conditions text when entered (`collection_conditions`), otherwise blank, wrapping inside its column. Dates use `dd/MM/yy HH:mm` like the Completed column. **Which samples:** every sample item of the order that is not voided and carries at least one test printed on the report, plus every rejected sample item of the order even when none of its tests print, ordered by sample number. Aliquots do not get their own line; their results print the number of the primary sample they came from. Body site does not print here; it stays with the result (FR-A18). The block replaces today's "Specimen collection times" line (`setCollectionTime`, `report.specimenCollectTimes`). | 1 |
| FR-A17 | **Pages 2+ strip (14 pt).** Patient name, patient code, national ID, lab number, prescriber, referring site and ward, and the collection time of the order's earliest sample ("Collected 25/09/26 07:55"; "Collected 25/09/26 07:55 (first of 3 samples)" when the samples were collected at different times), following `report-level-signatures.md` §5.8.2. | 1 |
| FR-A18 | **Anatomical site.** When the order carries body site and laterality (D-079, from Clinical Order Entry v4), they print after the sample type in the test name ("Wound swab, left forearm"). Until that data exists nothing extra prints. | Dependency |

## 7. Results

### 7.1 Table and rows

| ID | Requirement | V |
|---|---|---|
| FR-A19 | **Columns** (Letter widths): Test 154, Sample 18, Method 80, Result 70, Flag 34, Reference range 78, Units 42, Completed 50 pt. The column-header row prints once at the top of the results on every page. Test names keep the sample type the populator already appends ("Potassium (Serum)"). The Sample column prints the sample number within the order (`sampleSortOrder` today; the shared `{labNo}-{n}` formatter of D-082 once it exists), which is the number of that sample's line in the Samples block (FR-A59); a result on an aliquot prints its primary sample's number. | 1 |
| FR-A58 | **Completed date and time per test.** The Completed column shows, for each test on the report, the date and time its result was validated and released (the analysis release time, stamped by the system at validation), as `dd/MM/yy HH:mm` in the lab's configured date format and 24-hour clock setting, at 7 pt on one line. Panel parent rows leave it blank and each member shows its own; a multi-component test shows it once on its parent line. A pending test shows nothing. In the card, **Completed** shows the time the last test on the order was released when every test is released, and "Not yet complete" otherwise. | 1 |
| FR-A20 | **Section title** (one 11 pt line): the lab section name in bold uppercase over a 0.75 pt rule. A section title never sits alone at the bottom of a page (keep with the first row). | 1 |
| FR-A21 | **Flags.** The populator keeps its internal codes (`B`, `E`, `BB`, `EE`, `*`; `getResultFlag` and `ResultAlertFlags` unchanged) and passes the plain code in a new `flagCode` field. The template prints an arrow and a translated letter: `B` → ↓ + `report.patient.flag.low` (EN "L", FR "B"); `E` → ↑ + `report.patient.flag.high` (EN "H", FR "E"); `BB` → ⇊ + `report.patient.flag.criticalLow` (EN "LL", FR "BB"); `EE` → ⇈ + `report.patient.flag.criticalHigh` (EN "HH", FR "EE"); `*` → `report.patient.flag.abnormal`. Two more markers come from new booleans instead of the `alerts` string (which holds markup and the untranslated letter): `referralPending` (referred out, result not back; today's "R") prints `report.patient.flag.referred`, and `confirmationSample` (today's "C") prints `report.patient.flag.confirm`. When OGC-302 ships, its validated tick (§5.7 of that spec) prints in this column. | 1 |
| FR-A22 | **Abnormal rows** (B, E or *): value bold; a 2 pt black left bar, solid for high and *, dashed (2 pt on, 2 pt off) for low. No fill. | 1 |
| FR-A23 | **Critical rows** (BB or EE): `#e6e6e6` row fill, a 5 pt black left bar, double arrow, value bold at 9.5 pt, and a reversed tag (white on black) reading `report.patient.critical` under the flag. Critical is evaluated before abnormal. | 1 |
| FR-A24 | **Legend.** One 7 pt line in the page footer on every page, from the same keys as FR-A21 (↑ H, ↓ L, ⇈ HH / ⇊ LL critical, * abnormal, R referred, C confirmation), plus "† Not within the laboratory's accredited scope" when FR-A28 marks any row. | 1 |
| FR-A25 | **Method column.** The analysis's method name (new `methodName` field) at 7 pt, wrapping inside the column. Panel parent rows leave it blank. | 1 |
| FR-A26 | **Performing lab.** When the result came back from a reference lab, the Method column shows "Performed by {lab}" in italic (new `performingLabName` field, from the same referral organization `noteWithReferralAttribution` reads, reusing the existing `report.referral.performedBy` key). The new templates stop appending that text to the note, so it prints once. | 1 |
| FR-A27 | **Panels.** A panel prints its name as a bold parent row with its members indented 10 pt beneath, as today. When order entry v4 records that a panel was modified (D-080), the parent row adds "(modified)" and removed members print struck through with "removed by {user}". Until that data exists panels print as today. | 1 (layout), Dependency (modified data) |
| FR-A28 | **Non-accredited marker.** When the header prints at least one accreditation mark, every result row whose test is not within an active accredited scope on the release date (referred tests included) prints "†" after the test name, and the legend explains it. When no mark prints, no marker prints. Needs a per-row `inAccreditedScope` value from `AccreditationReportService` (§11.2 N3). | 1 |
| FR-A29 | **Multi-component tests** keep the OGC-1126 / OGC-1127 rules (components in `display_order`, show-on-report off omitted, primary always kept) and print as a block: the test name on the parent line, then one indented line per component with label, value, flag, range and unit in their columns. Each component is its own row in a sub-list (not newline-joined text), so columns stay aligned when a value wraps, and each component carries its own `flagCode` from its own range (§11.2 N2). | 1 |
| FR-A30 | **Note.** A result note prints as a 7 pt italic line directly under the row, prefixed "Note:", indented to the Test column, no fill. | 1 |
| FR-A31 | **Pending results.** A row whose result is not yet released prints the existing status text ("In progress", "Awaiting validation") in the Result column in italic, and no flag. | 1 |
| FR-A60 | **Rejected tests.** A test whose sample was rejected (`SampleRejected`, which the live report already includes) prints "Sample rejected" in italic in the Result column, with no flag and no Completed time; the reason is on the sample's line in the Samples block (FR-A59). A test rejected at technical or biologist validation (`TechnicalRejected`, `BiologistRejected`) prints "Rejected" the same way, with its rejection-reason note as the note line (FR-A30). Rejected tests do not make the report partial (FR-A11), and neither leaves a blank Result cell. | 1 |
| FR-A32 | **Specimen quality.** When the result carries hemolysis, icterus and lipemia (HIL) flags, they print after the method ("HIL: H+ I- L-"). Empty until the HIL specimen-quality work supplies the value. | 2 |

### 7.2 Critical callbacks

OpenELIS records each critical-result phone call in `critical_callback` (OGC-714): the result, who logged it (`logged_by`), when (`logged_at`), who received it (`recipient_name`), and the outcome (`CONFIRMED`, `REACHED_NO_READBACK`, `UNABLE_TO_REACH`). The report reads it and adds no parallel table (D-155).

| ID | Requirement | V |
|---|---|---|
| FR-A33 | **Callback line.** Under a critical row with at least one callback, a 7 pt italic line with a dotted left rule: "Callback: {recipient}, {date time}, by {user}. {outcome}." for the most recent attempt, followed by "(+{n} earlier attempts)" when there were more. Outcomes: `CONFIRMED` → "Read back confirmed"; `REACHED_NO_READBACK` → "Reached, no read-back"; `UNABLE_TO_REACH` → "Unable to reach". No callback, no line. It prints after the note line when both exist. | 1 |
| FR-A34 | **Earlier attempts appendix.** When any critical result had more than one attempt, the last page lists every attempt in a compact table (test, value called, called to, time, by, outcome). With one attempt per result the appendix does not print, so it costs no space on typical reports. | 2 |

### 7.3 Accreditation coverage

| ID | Requirement | V |
|---|---|---|
| FR-A35 | **Coverage block.** On the last page, per accrediting body with accredited tests on the report, the tests within its scope with a count ("ISO 15189: Hemoglobin, Potassium, Sodium (3 of 5 tests)"). Same rules as FR-A13 and FR-A28 (§11.2 N7). | 2 |

### 7.4 Microbiology results

A Microbiology Case (Microbiology v2, OGC-1383) prints in its lab unit's section of this report; there is no micro-only template. Inside the section the case's results are grouped under sub-headers that follow the Case view: **Initial testing**, **Culture**, **AST / DST** and **Additional testing**. Most of the case prints as ordinary rows; isolates with susceptibility results print as a susceptibility block under AST / DST. Environmental cases print on the environmental results certificate instead (FR-A52).

| ID | Requirement | V |
|---|---|---|
| FR-A42 | **Case rows, grouped** (D-181). A case prints as one block under a section title that is the **case's lab unit label** (for example TB), whatever the catalog sections of its individual tests. Inside the block, every ticked result prints as an ordinary result row in one of four groups, always in this order: **Initial testing**: the direct tests on the specimen (for example Gram stain, smear grade, Xpert MTB/RIF, a screening plate), including a Previous report result with its Performed by. **Culture**: the culture result of each culture or set ("No growth after 5 days", "Positive", "Culture not performed", "In progress", FR-A49), then under it the tests run on that culture that are not In lab only (for example "Gram stain, culture" printed as a multi-component block, FR-A29, with unread components left out; a rapid identification or an Xpert on a culture; Microbiology v2 FR-10.1d, FR-10.1f), then each reported isolate's identification ("Isolate 1: Klebsiella pneumoniae", with quantity and significance at 7 pt). **AST / DST**: one susceptibility block per reported isolate (FR-A44), then any derived result (FR-A46). **Additional testing**: the Additional testing results, for example a line probe assay or sequencing, on the specimen or on an isolate ("on Isolate 1"). A case with no culture test (Xpert or smear only) has no Culture group. Method, flags, critical treatment and † follow FR-A21 to FR-A28. | M |
| FR-A42a | **Group sub-headers** (D-181). Each group with at least one printed row starts with a one-line sub-header in bold 9 pt sentence case, with no rule, indented to the Test column, from `report.patient.micro.group.initial`, `.culture`, `.ast` and `.additional`. A group with nothing to print (nothing ticked, everything In lab only, or no such tests) prints no sub-header. A sub-header never sits alone at the bottom of a page (keep with its first row, like FR-A20), and when a group continues on the next page its sub-header repeats with "(continued)". Two cases in one lab unit section (for example two specimens) each print their own groups, each case starting with a 7 pt line naming the specimen and lab number. | M |
| FR-A43 | **Not printed.** Results marked In lab only, results unticked in the case's Report choices (whose defaults come from each agent's report rule, `report_behavior`, and which the validator can change) never print; that covers internal culture work-up, since microscopy tests on a culture default to In lab only (Microbiology v2 D-184). A panel member withheld this way prints as a member row reading "Not reported", so the panel keeps its full membership (D-080). | M |
| FR-A44 | **Susceptibility block.** For each reported isolate, a bold parent line "Isolate {n}: {organism}", then quantity (from the reading on the culture row the isolate was picked from) and significance at 7 pt ("≥10⁵ CFU/mL, significant"). Under it, one indented row per reported agent, in the report's columns: agent (Test), MIC or zone diameter (Result), interpretation (Flag: S, I or R from `report.patient.micro.*`, printed as a letter, not an arrow), breakpoint standard and version (Reference range, for example "CLSI M100 36th ed."), unit (Units). TB DST rows print the critical concentration in Reference range and "R" or "S". Agents come from all the isolate's reportable runs, one reading per agent (Microbiology v2 FR-07.2b); rows follow the default panel's display order, then any added agents. A block never splits its parent line from its first agent row. An isolate that refers to a previous susceptibility (Microbiology v2 FR-21.2) prints its parent line and, in place of agent rows, one line `report.patient.micro.referPrevious` ("Susceptibility as reported on {lab number} ({date})"). | M |
| FR-A45 | **Resistant rows** get the abnormal treatment of FR-A22 (bold value, solid 2 pt bar). S and I print plain. Intrinsic resistance applied by an expert rule adds the note "Intrinsic resistance" (FR-A30 line). | M |
| FR-A46 | **Derived results.** A TB resistance classification (RR, MDR, pre-XDR, XDR, pan-susceptible, mono- or poly-resistant), or a bacterial resistance profile ticked in Report choices (for example ESBL, MDR), prints as its own row at the end of the AST / DST group ("Resistance classification: MDR-TB", "Resistance profile: ESBL, MDR"). | M |
| FR-A47 | **Performed by.** A case result recorded as Tested elsewhere by another laboratory (Microbiology v2 FR-06.3, D-195) shows "Performed by {lab}" (FR-A26), from the laboratory picked from the Organizations list, and carries † (FR-A28). | M |
| FR-A47a | **Received isolates** (Microbiology v2 FR-02.13, D-194). For a case opened from an isolate sent by another laboratory, the Culture group prints "Isolate received from {laboratory}" (the sending laboratory from the Organizations list) with † (FR-A28) in place of a culture result row, then the isolate's parent line and its identification and AST as usual (FR-A44). The sender's reported organism prints, as "Reported by {laboratory}: {organism}" under the parent line, only when this laboratory has not confirmed the identification; once identified here, only the confirmed organism prints. The sample's collection date prints in the Samples block (FR-A59) as for any sample. | M |
| FR-A48 | **Notes.** Every micro note is In Lab Only (internal) or Send with Result (external), as for any result (Microbiology v2 A-13, D-170). Send with Result notes print as FR-A30 lines under what they belong to: a case test result (Gram stain, smear, Xpert, an Additional test, a test on a positive culture), an isolate's parent line or an agent row. Notes on things with no line of their own on the report (a culture row, a subculture) print under that culture's result row in the Culture group, in the order written; notes on the case itself print under the last row of the case. In Lab Only notes never print, and notes on a result the lab withheld (In lab only or unticked) do not print either. Case test result notes are ordinary analysis notes, so they reach the template exactly as on any other result. | M |
| FR-A49 | **Pending culture.** While the case is not final, the culture row shows "In progress (day {n} of {N})" in italic (FR-A31), where N is the longest open incubation on the case. | M |
| FR-A50 | **Releases and versions.** A partial release of a case (Release partial report, Microbiology v2 D-201) is a partial report version, as for any order (D-150); final release makes its rows final (versions and archiving follow the Report Print Queue issue history, OGC-1031 r4: completing a partial report is a new version, and Amended applies only when something already printed changed). An amendment prints the corrected banner (FR-A14) with the amendment reason as the change summary. Case release writes each reportable analysis's validated and released status, release date and signature, so FR-A11 and FR-A36 treat micro rows like any other. For FR-A11, In lab only and unticked analyses are not counted, and an Additional test still pending when the case is released final prints "To follow" and does not make the report partial (Microbiology v2 D-128); its result arrives as an amendment. | M |
| FR-A51 | **Critical callbacks.** Micro critical calls print as callback lines (FR-A33) under the critical row, or under the isolate parent line when the micro call targeted an isolate. The call is read from `critical_callback` like every other callback (Microbiology v2 writes one row per call, FR-18.2, with the finding text as the called value); only its placement uses the micro record's target. | M |
| FR-A52 | **Environmental cases do not print here.** They print on the environmental results certificate (Reports › Environmental Reports › Laporan Hasil today; the Report Print Queue r4 environmental rows), which already has the site header, compliance table, signatures and numbered amendments. Its renderer (S06c) adds the susceptibility block and callback lines for environmental micro cases (Microbiology v2 FR-11.8). | M |

The legend (FR-A24) adds "S susceptible, I intermediate or susceptible at increased exposure, R resistant" when a susceptibility block prints.

## 8. Closing Sections

### 8.1 Sign-off, end of report and footer

| ID | Requirement | V |
|---|---|---|
| FR-A36 | **Sign-off block** (about 54 pt), placed **directly after the last result** of the patient, not pinned to the page bottom (`report-level-signatures.md` §5.6), and never split across pages. Left cell, **General comments**: the order's conclusion when there is one. Right cell, **Validated and released by**: each distinct validator of the report's results with their latest release time ("Dr. Sarah Chen, 24/09/2026 10:15"), from `result_signature` (supervisor entries) and each analysis's release date; below it the lab director's signature image (existing `useLabDirectorSignature` / `labDirectorSignature`, in a 120 × 30 pt slot) with the director line under it. The lab's name and address are not repeated; they are in the header. The card's Completed date (FR-A16) and the per-test Completed column (FR-A58) use the same release times. | 1 |
| FR-A37 | **Electronic signatures.** When OGC-302 ships and e-signatures are on, its signature entries (authored by, validated and released by, compliance line) replace the right cell's validator list, in the same cell. This FRS sets the cell and its styling; OGC-302 fills it. | 1 (cell) |
| FR-A38 | **End of report.** A centred 7 pt line "End of report" prints immediately after the sign-off block. | 1 |
| FR-A39 | **Page footer** (22 pt, every page): the legend line (FR-A24); then "Issued {date time}" (left), lab number and patient code (centre), "Page {x} of {y}" (right). Page numbering always prints; the old on/off setting is ignored by these templates. The total is evaluated per order group, so a print of several orders numbers each order from 1. | 1 |

### 8.2 Report issue history

`ReportController.trackReports` already writes a `document_track` row each time a report is printed (report time, record, document name, parent link), reprints included.

| ID | Requirement | V |
|---|---|---|
| FR-A40 | For FR-A14, "the replaced report" is the most recent patient-report `document_track` row for the order (filtered by the patient report's document name) whose time is before the change to the result. | 1 |
| FR-A41 | For FR-A15, each patient-report issue stores its version when generated: version 1 for the first issue, +1 only when the report content changed since the previous issue; a reprint of unchanged content keeps the same version. | 2 |

---

# Part B: Report Management (moved)

**Moved 2026-10-02.** The Report Management admin page is now specified in **§13 of the Admin Redesign FRS** (`admin-redesign-frs.md`, gallery `designs/admin-config/admin-redesign.md`), so that one admin FRS owns every admin page. Delivery is unchanged: Epic OGC-1111, V1 through OGC-932, slices 5 to 8 of this FRS's breakdown.

| This FRS (v2.4.1) | Admin Redesign FRS v1.0 |
|---|---|
| §9 Page Layout | §13.1 |
| FR-B1 to FR-B20 | RM-1 to RM-20 (same order; RM-2a adds Page numbers on other reports) |
| §12 Access, Report Management bullet | RM-21 |
| §13.2 Admin page keys | §15.4 |
| AC-17 to AC-23, AC-27 to AC-32 | RM-AC-1 to RM-AC-13 |

What changed in the move: the page sits at Config › Report Management (top level), not inside Workflow Settings; its breadcrumb is `Home / Admin Management / Report Management`; the Patient Status Report row opens through an Edit button; the lab name links to Configuration, where `SiteName` is edited; `admin.reports.save` / `.cancel` give way to `common.save` / `common.cancel`.

---

## 11. Information, Data and Dependencies

### 11.1 Data this feature reuses

| Information | Where it lives today | Used by |
|---|---|---|
| The 41 fields `PatientReportCDI_vreduit` declares, including `dob`, `contactInfo` (prescriber), `siteInfo` (referring site and ward), contact tracing, `completeFlag`, `correctedResult`, `analysisStatus`, `note`, `conclusion` | `ClinicalPatientData`, `PatientReport`, `PatientCILNSPClinical_vreduit` | FR-A16 to FR-A31, FR-A36 |
| Flag codes B / E / BB / EE / *, referral-pending and confirmation markers | `getResultFlag`, `ResultAlertFlags`, `setReferredOutResult`, confirmation-sample branch | FR-A21 to FR-A24 |
| Result components | `test_result_component` (display order, show on report, primary), per-component result limits | FR-A29 |
| Samples | `sample_item`: `sort_order`, type of sample, `collection_date`, `received_date`, `collection_conditions`, `rejected`, `reject_reason_id`, `voided`, parent sample item (aliquots); the order's received time; analysis statuses `SampleRejected`, `TechnicalRejected`, `BiologistRejected` and the rejection-reason note | FR-A17, FR-A59, FR-A60 |
| Method | the analysis's method link | FR-A25 |
| Reference lab | the analysis's referral organization | FR-A26 |
| Critical callbacks | `critical_callback` | FR-A33, FR-A34 |
| Validators and completion time | `result_signature` (system user, supervisor flag); the analysis release date (`releasedDate`) | FR-A16, FR-A36, FR-A58 |
| Accreditation | `AccreditationReportService`, `accrediting_body`, `test_accreditation` (`accredLogo1..3`, `accredNotesLine`) | FR-A13, FR-A28, RM-9 |
| Report issue history | `document_track` via `ReportTrackingService.addReports` | FR-A14, FR-A40, FR-A41 |
| Result-change note | the note entered when a released result is modified | FR-A14 |
| Header images and settings | `image` records `headerLeftImage`, `headerRightImage`, `labDirectorSignature`; `SiteName`, `ADDITIONAL_SITE_INFO`, the three lab-director settings, `BILLING_REFERENCE_NUMBER_LABEL` | FR-A10, FR-A36, RM-7, RM-8 |
| Report list | `reportconfiguration.Report`, `ReportCategory` | RM-4 |
| Audit trail | existing configuration history | RM-20 |

### 11.2 New data and dependencies

| # | Item | Kind | V |
|---|---|---|---|
| N1 | **Paper size**: one lab-wide setting, LETTER or A4, stored with the other printed-report settings (suggested key `printedReport.defaultPaperSize`). | New setting | 1 |
| N2 | **Template fields** passed by the populator from §11.1 data: `flagCode`, `referralPending`, `confirmationSample`, `methodName`, `performingLabName`; a component sub-list per multi-component test (label, value, `flagCode`, range, unit); per-row latest callback and attempt count; the report's validator list with release times. No new stored data. | Populator plumbing | 1 |
| N3 | **Per-row accreditation scope** (`inAccreditedScope`) and **per-order resolution** of the accreditation marks: additions to `AccreditationReportService` and `addAccreditationParameters`. | Populator change | 1 |
| N4 | **Font extension** with DejaVu Sans and DejaVu Sans Mono (FR-A6). | Build dependency | 1 |
| N5 | **Template choice per report** (active template, who set it, when) and the **engine change** that resolves a report's template from it. Engineering coordination in the D-022 class. | New stored data, engine change | 2 |
| N6 | **Issue version** stored with each patient-report issue (FR-A41). | New stored data | 2 |
| N7 | **Per-body test list** from `AccreditationReportService` for the coverage block. | Populator addition | 2 |
| N8 | **Sample order** for Preview: a fixed fictitious patient and order (normal, high, low, critical with a callback, coded-abnormal, referred, pending, multi-component and panel results) shipped as a fixture, never stored as patient data. | Fixture | 2 |
| N9 | **HIL flags** per result from the HIL specimen-quality work (`designs/results-validation/hil-specimen-quality.md`). | Upstream feature | 2 |
| N10 | **Body site and laterality** (D-079) and **panel modification records** (D-080) from Clinical Order Entry v4 (OGC-1266). Printed when present. | Upstream feature | Dependency |
| N11 | **OGC-302** report signature entries, which fill the cell FR-A37 reserves. | Sibling ticket | 1 (cell) |
| N12 | **OGC-1031** Report Print Queue. Not built; when built it prints through this report. | Sibling epic | none |
| N13 | **Micro populator**: builds case rows and susceptibility blocks from the Microbiology Case (isolates, reported agents and readings, report choices, notes) and sets `flagCode` from the interpretation. No new stored data. | Populator addition | M |
| N14 | **Case release writes analysis status**: validated and released, release date and `result_signature` for each reportable analysis linked to the case (FR-A50). | Microbiology v2 dependency | M |
| N15 | **Micro critical calls in `critical_callback`** (FR-A51). | Microbiology v2 dependency | M |
| N16 | **Report reads the UI translation catalogue** (FR-A53): the report engine resolves labels from the shipped frontend language files and the deployment's override files instead of the backend EN / FR bundle. Engineering chooses how (for example packaging the catalogue with the backend at build time and reading the override directory at render). | Engine change | 1 |
| N17 | **Translation fixes** in 13.1.2 and the new keys in 13.1.3, added to the UI catalogue. | Content | 1 |
| N18 | **Per-test completion time** (`completedTime` from the analysis release date) and the order-level completed time, passed to the template. No new stored data. | Populator plumbing | 1 |
| N19 | **Samples sub-list per order** (FR-A59): sample number, localized sample type, collection time, receipt time (with the order fallback), condition text and a rejected flag, built from the order's sample items in place of the `setCollectionTime` string; plus per-row `sampleRejected` and `testRejected` booleans (FR-A60) and the strip's earliest collection time and sample count (FR-A17). No new stored data. | Populator plumbing | 1 |

---

## 12. Access

- **Report Management:** see `admin-redesign-frs.md` RM-21.
- **The patient report:** printed by whoever can print it today. No change.

---

## 13. Localization

### 13.1 One translation source for the report and the screens

Today the report draws its labels from the backend bundle (`languages/message_en.properties`, `message_fr.properties`), which exists only in English and French. The screens draw theirs from the frontend catalogue (`frontend/src/languages/*.json`), which ships about 30 languages, including Bahasa Indonesia, Spanish, Malagasy and Tok Pisin, plus any overrides a deployment mounts (the `overrideDefaultTranslation` mechanism). An Indonesian lab therefore reads its screens in Bahasa and prints its reports in English.

| ID | Requirement | V |
|---|---|---|
| FR-A53 | **The report uses the screens' translations.** Every label on the patient report resolves from the same catalogue the UI uses, for the report's language, in this order: the deployment's override file for that language, the shipped catalogue for that language, the base language (for example `fr` for `fr_MG`), then English. A deployment that has translated or reworded a label for its screens sees the same wording on its reports with no extra work. How the report engine reads the catalogue is an engineering choice (§11.2 N16). | 1 |
| FR-A54 | **Reuse existing keys.** Where the UI already has a key for the same label, the report uses it (table 13.1.1), so the report and the Results Entry and Validation screens use the same words. New keys are added only for labels the UI has no equivalent for (table 13.1.3). New keys are added to the English catalogue with this work and follow the normal translation workflow for other languages; until a language translates one, it falls back as in FR-A53. | 1 |
| FR-A55 | **Report language.** The report prints in the language of the user who generates it, as today. | 1 |
| FR-A56 | **Catalogue names.** Test names, lab section names, sample types, panel names, units and coded (dictionary) results print from their localized names in the report language, as the populator already does for sections, sample types and coded results; test names and panel names follow the same rule. | 1 |
| FR-A57 | **Server-generated text.** Text the populator builds itself (pending status such as "In progress", "Awaiting validation", the accreditation notes line, "Performed by") resolves from the same catalogue, so it matches the labels around it. | 1 |

#### 13.1.1 Existing UI keys the report reuses

Translations shown are what ships today (FR, ID, ES). Items marked **fix** are wrong or odd in the shipped file and are corrected as part of slice 1 (13.1.2).

| Report label | Key | FR | ID | ES |
|---|---|---|---|---|
| Patient | `common.patient` | Patiente (**fix**) | Pasien | Paciente |
| Date of birth | `patient.dob` | (**fix**) | Tanggal Lahir | Fecha de nacimiento |
| Sex | `patient.label.sex` | Sexe | Jenis Kelamin | Sexo |
| Age | `patient.label.age` | Âge | Umur | Edad |
| Patient ID | `patient.merge.patientId` | ID du patient | Nomor Identitas Pasien | ID del paciente |
| National ID | `patient.merge.nationalId` | Numéro d'Identité | NIK | ID Nacional |
| Lab number | `sample.label.labnumber` | Numéro de Laboratoire | Nomor Registrasi | Número de laboratorio |
| Program | `common.program` | Programme | Program | Programa |
| Requester | `common.requester` | Prescripteur | Pemohon | Solicitante |
| Collected | `common.collected` | Prélevé | Diambil | Recopilado |
| Received | `common.received` | Reçu | Diterima | Recibido |
| Order date | `sample.label.orderdate` | Date de Commande | Tanggal Permintaan | Fecha de orden |
| Test | `label.results.test` | Analyses (**fix**) | Pemeriksaan | Prueba |
| Sample | `label.results.sample` | Échantillon | Sampel | Muestra |
| Method | `label.results.method` | Méthodes (**fix**) | Metode | Método |
| Result | `label.results.result` | Résultat | Hasil | Resultado |
| Flag | `label.results.flag` | Drapeau (**fix**) | Bendera | Bandera |
| Reference range | `label.results.range` | Plage de référence | Rentang Referensi | Rango de referencia |
| Units | `label.validation.review.units` | Unités | Unit | Unidades |
| Note | `field.note` | Remarque | Catatan | Nota |
| Critical (tag, printed in capitals) | `label.results.flag.critical` | Critique | Kritis | Crítico |
| Abnormal (legend) | `label.results.flag.abnormal` | Anormal | Tidak normal | Anormal |
| In progress | `dashboard.in.progress.label` | En cours | Dalam Pengerjaan | En progreso |
| "of" in "Page x of y" | `of` | de | dari | de |

The labels "Patient ID" and "Requester" replace the report's current "Patient code" and "Prescriber" so the report reads like the screens.

#### 13.1.2 Translation fixes shipped with slice 1

| Key | Language | Now | Corrected |
|---|---|---|---|
| `common.patient` (and the other "Patient" keys) | fr | Patiente | Patient |
| `patient.dob` | fr | Mettre la date au format francais | Date de naissance |
| `label.results.test` | fr | Analyses | Analyse |
| `label.results.method` | fr | Méthodes | Méthode |
| `label.results.flag` | fr | Drapeau | Alerte |
| `laporanHasil.col.site` and other "Site" keys | es | Sitio web | Sitio |

Other languages get the same review by their translators before release (for example Bahasa `label.results.flag` "Bendera" is a literal "flag"); the report makes these words more visible than the screens do.

#### 13.1.3 New keys (added to the UI catalogue)

| Key | English | French |
|---|---|---|
| `report.patient.title.final` | Results: final report | Résultats : rapport final |
| `report.patient.title.partial` | Results: partial report | Résultats : rapport partiel |
| `report.patient.labDirector` | Lab director | Directeur du laboratoire |
| `report.patient.block.order` | Order | Demande |
| `report.patient.block.dates` | Dates | Dates |
| `report.patient.siteWard` | Site / ward | Site / service |
| `report.patient.completed` | Completed | Terminé |
| `report.patient.completed.pending` | Not yet complete | Pas encore terminé |
| `report.patient.samples` | Samples | Échantillons |
| `report.patient.sample.number` | # | N° |
| `report.patient.sample.condition` | Condition | État |
| `report.patient.sample.rejected` | Rejected: {0} | Rejeté : {0} |
| `report.patient.sample.notRecorded` | Not recorded | Non enregistré |
| `report.patient.strip.collected` | Collected {0} | Prélevé {0} |
| `report.patient.strip.collectedFirst` | Collected {0} (first of {1} samples) | Prélevé {0} (premier de {1} échantillons) |
| `report.patient.result.sampleRejected` | Sample rejected | Échantillon rejeté |
| `report.patient.result.rejected` | Rejected | Rejeté |
| `report.patient.col.sample` | Smp | Éch. |
| `report.patient.col.completed` | Completed | Terminé |
| `report.patient.flag.low` | L | B |
| `report.patient.flag.high` | H | E |
| `report.patient.flag.criticalLow` | LL | BB |
| `report.patient.flag.criticalHigh` | HH | EE |
| `report.patient.flag.abnormal` | * | * |
| `report.patient.flag.referred` | R | R |
| `report.patient.flag.confirm` | C | C |
| `report.patient.legend` | Legend | Légende |
| `report.patient.legend.high` | above normal | supérieur à la normale |
| `report.patient.legend.low` | below normal | inférieur à la normale |
| `report.patient.legend.critical` | critical | critique |
| `report.patient.legend.referred` | referred, result pending | référé, résultat en attente |
| `report.patient.legend.confirm` | confirmation test | test de confirmation |
| `report.patient.notAccredited` | Not within the laboratory's accredited scope | Hors du périmètre d'accréditation du laboratoire |
| `report.patient.awaitingValidation` | Awaiting validation | En attente de validation |
| `report.patient.performedBy` | Performed by {0} | Réalisé par {0} |
| `report.patient.micro.receivedFrom` | Isolate received from {0} | Isolat reçu de {0} |
| `report.patient.micro.reportedBy` | Reported by {0}: {1} | Signalé par {0} : {1} |
| `report.patient.accred.notesLine` | Tests on this report are accredited by: {0}. | Les tests de ce rapport sont accrédités par : {0}. |
| `report.patient.callback.line` | Callback: {0}, {1}, by {2}. {3}. | Appel : {0}, {1}, par {2}. {3}. |
| `report.patient.callback.more` | (+{0} earlier attempts) | (+{0} tentatives précédentes) |
| `report.patient.callback.confirmed` | Read back confirmed | Relecture confirmée |
| `report.patient.callback.noReadback` | Reached, no read-back | Joint, sans relecture |
| `report.patient.callback.unreachable` | Unable to reach | Injoignable |
| `report.patient.callbacks.title` | Critical value callbacks | Appels pour valeurs critiques |
| `report.patient.callbacks.col.value` | Value called | Valeur communiquée |
| `report.patient.callbacks.col.to` | Called to | Destinataire |
| `report.patient.callbacks.col.time` | Time | Heure |
| `report.patient.callbacks.col.by` | By | Par |
| `report.patient.callbacks.col.outcome` | Outcome | Résultat de l'appel |
| `report.patient.corrected.line` | Corrected report. Replaces the report issued {0}. Change: {1}. | Rapport corrigé. Remplace le rapport émis le {0}. Modification : {1}. |
| `report.patient.corrected.seeReplaced` | See the replaced report | Voir le rapport remplacé |
| `report.patient.corrected.version` | Version {0} | Version {0} |
| `report.patient.comments` | General comments | Commentaires généraux |
| `report.patient.releasedBy` | Validated and released by | Validé et libéré par |
| `report.patient.endOfReport` | End of report | Fin du rapport |
| `report.patient.issued` | Issued | Émis le |
| `report.patient.page` | Page | Page |
| `report.patient.hil` | HIL | HIL |
| `report.patient.accred.coverage.title` | Accreditation coverage | Couverture d'accréditation |
| `report.patient.accred.coverage.count` | {0} of {1} tests | {0} sur {1} tests |
| `report.patient.panel.modified` | (modified) | (modifié) |
| `report.patient.panel.removedBy` | removed by {0} | retiré par {0} |
| `report.patient.micro.isolate` | Isolate {0}: {1} | Isolat {0} : {1} |
| `report.patient.micro.susceptible` | S | S |
| `report.patient.micro.intermediate` | I | I |
| `report.patient.micro.resistant` | R | R |
| `report.patient.micro.intrinsic` | Intrinsic resistance | Résistance naturelle |
| `report.patient.micro.classification` | Resistance classification | Classification de la résistance |
| `report.patient.micro.inProgress` | In progress (day {0} of {1}) | En cours (jour {0} sur {1}) |
| `report.patient.micro.notPerformed` | Culture not performed | Culture non réalisée |
| `report.patient.micro.referPrevious` | Susceptibility as reported on {0} ({1}) | Sensibilité telle que rendue sous {0} ({1}) |
| `report.patient.micro.group.initial` / `.culture` / `.ast` / `.additional` | Initial testing / Culture / AST / DST / Additional testing | Examens initiaux / Culture / Antibiogramme / Examens complémentaires |
| `report.patient.micro.group.continued` | {0} (continued) | {0} (suite) |
| `report.patient.micro.profile` | Resistance profile | Profil de résistance |
| `report.patient.micro.legend` | S susceptible, I intermediate or susceptible at increased exposure, R resistant | S sensible, I intermédiaire ou sensible à forte posologie, R résistant |

The backend keys the current template uses (`report.*` in `message_*.properties`) stay in place for the other report templates, which keep using the backend bundle until they are redesigned.

### 13.2 Admin page keys (UI catalogue)

Moved to `admin-redesign-frs.md` §15.4.

---

## 14. Decisions

> **ID note (2026-09-30):** these decisions were drafted as D-085 to D-093, which the log already used for other decisions. They are logged as D-151 to D-159; D-160 and D-161 are new in v2.3.

| ID | Decision | Why |
|---|---|---|
| D-151 | Custom report templates reach OpenELIS only through the server's configuration folder. No browser upload of `.jrxml`. | A JasperReports template runs Java expressions on the server, so an upload is a code-execution path for anyone with admin access. The server operator already holds that trust. |
| D-152 | Paper size is one lab-wide setting that every report with Letter and A4 variants follows. | Matches how a lab buys paper; per-report sizes add configuration with no use case. |
| D-153 | Patient-report accreditation marks print in the header from the shipped OGC-686 parameters, in square slots. Non-accredited results carry a † marker in V1; the per-test coverage list is V2. Supersedes the Apr 27 footer placement. | Consistent with the other templates; ILAC P8 and accrediting bodies' rules require non-accredited results to be identified when the mark is used. |
| D-154 | Printed flag letters are translated labels over unchanged internal codes (B, E, BB, EE, *), always paired with an arrow. | Fixes French-only letters without touching flag logic other features use. |
| D-155 | Critical-callback documentation on any report reads `critical_callback`. No parallel notification table. | That entity already converges the GP47 read-back form and M-11 notifications. |
| D-156 | Report Management replaces Printed Report Configuration (tier Remove, D-066); the old route redirects. | D-065, one destination, one entry. |
| D-157 | The new patient templates carry their own header; the shared `CDIHeader` is not changed for them. | Pathology, cytology, TB and program reports share `CDIHeader`. |
| D-158 | Printed patient reports are designed for monochrome printing and photocopying: black and grays only, meaning carried by weight, glyphs, bar weight and dash style. | Labs print on black-and-white lasers and photocopy; color-coded meaning is lost. |
| D-159 | Patient reports optimize for page count: single-line rows, method as a column, one column header per page, compact continuation header, flowing sign-off, legend in the footer. Target one page for a typical order. | Paper and toner cost; separated pages lose context. |
| D-160 | Printed reports use the same translation catalogue as the screens (with deployment overrides) and reuse the screens' keys; new labels go into that catalogue. | One set of words across screens and paper, and every language OpenELIS ships instead of English and French only. |
| D-161 | "Completed" on a report means the time a result was validated and released (system-stamped), shown per test and for the order. | It is the moment the result became available to the clinician, and unlike the tech-entered test date it cannot be backdated. |
| D-181 | A Microbiology case prints grouped under sub-headers in the Case view's order: Initial testing, Culture (culture results, reportable work-up and isolate identification), AST / DST (one block per isolate and derived results) and Additional testing; empty groups print nothing. | The reader finds each kind of result where the bench recorded it; ordering rows by catalog section scattered a case. |

### 14.1 Where this FRS supersedes `report-level-signatures.md` (OGC-302)

OGC-302 keeps its content (signature entries, meanings, compliance line, row tick, behaviour by report state). These layout points are superseded, and OGC-302's FRS should be updated to point here:

| OGC-302 | This FRS | Reason |
|---|---|---|
| §5.9.2 margins 15 mm | 30 pt left and right, 20 pt top and bottom | Fewer pages (D-159) |
| §5.7 Status column for the row tick | Tick prints in the Flag column (FR-A21), which §5.7 allows | Width for the Method column |
| §5.1 left cell "General Comments" | Kept as "General comments", holding the conclusion (FR-A36) | Same |
| §5.6 legend after the signature block | Legend in the page footer on every page (FR-A24) | Every page stays readable on its own |
| §7.2.3 image upload on Printed Report Configuration | Image upload on Report Management (Admin Redesign FRS RM-7) | D-156 |

Kept from OGC-302: title rule (§6.2), signature block flowing after the last result and never split (§5.6, §5.9.3), continuation header and patient strip (§5.8.2), result rows never split, section title kept with its first row.

---

## 15. Acceptance Criteria

### V1

- [ ] **AC-1** With paper size A4, Patient Status Report produces a 595 × 842 pt PDF from `patient_a4`; with Letter, a 612 × 792 pt PDF from `patient_letter`. Same bands, columns and row heights.
- [ ] **AC-2** The page-economy fixture (34 single-line results in 4 sections on 2 samples, 2 notes, 1 callback) prints on one page on Letter and on A4. A 5-result order prints on one page with the sign-off and "End of report" on that page.
- [ ] **AC-3** Every field `PatientReportCDI_vreduit` prints for a fixture order (including DOB, billing, ST number and contact-tracing fields when on) prints in the new template; the prescriber prints under Order.
- [ ] **AC-4** The Patient Status Report menu link and a bookmarked `/Report?type=patient&report=patientCILNSP_vreduit` produce the new report. Pathology, cytology and TB reports render exactly as before.
- [ ] **AC-5** In English the flags print ↓ L, ↑ H, ⇊ LL, ⇈ HH; in French ↓ B, ↑ E, ⇊ BB, ⇈ EE; R and C print from the new keys. The legend matches.
- [ ] **AC-6** Printed on a monochrome laser and photocopied once, a critical row still shows the fill, the 5 pt bar, the double arrow and the reversed tag; a high row a solid 2 pt bar and ↑; a low row a dashed bar and ↓. The PDF contains no color other than black and the two grays.
- [ ] **AC-7** A square 300 × 300 px logo prints as a 48 × 48 pt square; a 600 × 200 px logo fits inside the same square without distortion; an accreditation mark prints in a 32 × 32 pt square.
- [ ] **AC-8** A result with a method shows it in the Method column; a result returned by a reference lab shows "Performed by {lab}" there, and the note does not repeat it.
- [ ] **AC-9** A multi-component test prints its name, then one indented line per printed component with label, value, flag, range and unit aligned; when one value wraps, the other columns of that component stay on its line. A component with show-on-report off does not print.
- [ ] **AC-10** A critical result with two callbacks (UNABLE_TO_REACH then CONFIRMED) shows the CONFIRMED one and "(+1 earlier attempts)" under the row.
- [ ] **AC-11** With two qualifying bodies, both marks and the notes line print; with none, the slots are empty and nothing moves. In a two-order print, each order's header shows only its own bodies.
- [ ] **AC-12** When marks print, a test outside the accredited scope and a referred test both carry †, and the footer legend explains †; with no marks, no † prints.
- [ ] **AC-13** The sign-off lists each validator with their latest release time; the director signature image prints when set.
- [ ] **AC-14** After a released result is modified and the report reprinted, the corrected banner names the date of the previous issue and the change note. Printing it again still shows the banner.
- [ ] **AC-15** Every page shows "Page x of y"; a two-order print numbers each order from 1; the report ends with "End of report" after the sign-off.
- [ ] **AC-16** With French selected the report has no English text, and with English no French text. Arrows render on a server with no system fonts.
- AC-17 to AC-23 (Report Management) moved to `admin-redesign-frs.md` §19.5 as RM-AC-1 to RM-AC-7.

- [ ] **AC-33** With the UI set to Bahasa Indonesia, the report's labels print in Bahasa from the UI catalogue (for example "Pemeriksaan", "Hasil", "Rentang Referensi"); with French, the corrected French labels (13.1.2) print; a language missing a new key prints that key's English text.
- [ ] **AC-34** A label a deployment reworded in its override file prints with the new wording on the next report.
- [ ] **AC-35** Test names, section names, sample types and coded results print in the report language.
- [ ] **AC-37** An order with three samples (serum, whole blood, urine) collected at different times prints a Samples block on page 1 with one line each: number, type, collection and receipt date and time; each result's Sample column matches a line. A one-sample order also prints the block. A sample with no collection time shows "Not recorded"; a sample with no receipt time shows the order's received time.
- [ ] **AC-38** A rejected sample is listed with "Rejected: {reason}" even when none of its tests print; each of its tests that prints shows "Sample rejected" in the Result column with no flag and no Completed time, and the report title is not made partial by them. A test rejected at validation shows "Rejected" and its reason note.
- [ ] **AC-39** On pages 2+ the strip shows the earliest collection time, with "(first of 3 samples)" when the three samples were collected at different times. Today's "Specimen collection times" line no longer prints.
- [ ] **AC-36** Each released test shows its release date and time in the Completed column; a pending test shows nothing; the card shows the last release time when all tests are released and "Not yet complete" otherwise.

### V2

- [ ] **AC-24** A corrected report shows "Version n"; a reprint without content changes keeps the same n.
- [ ] **AC-25** The last page lists, per accrediting body, the accredited tests with "N of M tests".
- [ ] **AC-26** A result with two or more callback attempts gets the attempts appendix; a report where each critical had one attempt has none.
- AC-27 to AC-32 (Report Management) moved to `admin-redesign-frs.md` §19.5 as RM-AC-8 to RM-AC-13.

### Microbiology (M)

- [ ] **AC-M1** A case with one isolate and 12 reported agents prints in its lab unit's section: the parent line, 12 agent rows with S/I/R in the Flag column, R rows bold with a solid bar, and no suppressed or In lab only agent.
- [ ] **AC-M2** A preliminary release prints "Results: partial report" with the culture row "In progress (day 2 of 5)"; the final release prints "Results: final report" and names the validator in the sign-off.
- [ ] **AC-M3** An amended case prints the corrected banner with the amendment reason and the replaced issue date.
- [ ] **AC-M4** A Gram stain recorded as done by another laboratory prints "Performed by {lab}" and †.
- [ ] **AC-M5** A CRE isolate with a logged call prints the critical treatment and the callback line, read from `critical_callback`.
- [ ] **AC-M6** An environmental case does not print on the patient report; it prints on the Laporan Hasil certificate.
- [ ] **AC-M7** The fixture order (35 rows, 4 sections) plus one micro case with one isolate and 12 agents fits on two pages, Letter and A4.
- [ ] **AC-M8** The blood culture case of Microbiology v2 (two sets, reportable Gram stains, a BCID2 panel, K. pneumoniae with 12 agents) prints under MICROBIOLOGY with the sub-headers Culture and AST / DST only (no Initial testing or Additional testing results): Culture lists set 1 Positive with its two Gram stains and the BCID2 result, set 2 "In progress (day 4 of 5)" and "Isolate 1: Klebsiella pneumoniae"; AST / DST lists the Isolate 1 block and "Resistance profile: ESBL, MDR". The TB case prints all four sub-headers in order. A sub-header never ends a page.
- [ ] **AC-M9** A case opened from an isolate received from Port Moresby General Hospital Laboratory prints "Isolate received from Port Moresby General Hospital Laboratory" with † in the Culture group, then ISO-1 with its AST; before identification here it also prints "Reported by Port Moresby General Hospital Laboratory: Escherichia coli", and after identification here only the confirmed organism.

---

## 16. Out of Scope

- Redesigning the other patient templates (`PatientReportCDI`, `PatientClinicalReport`, TB, ARV, VL, EID, indeterminate, pathology, cytology, immunohistochemistry). They keep working; they follow the paper size only once they get an A4 variant.
- Color printing. The templates are monochrome by design (D-158).
- Visual report authoring or new report data without engineering (D-022). A custom template can use only what the report already supplies.
- Per-report or per-user paper size (D-152).
- Queueing, scheduling and delivery (OGC-1031).
- Accreditation status of external reference labs. OpenELIS does not hold other labs' scopes; referred results are marked † and name the performing lab.
- Flagging research-use-only examinations (ISO 15189 §7.4.1.6 i): OpenELIS has no such attribute on a test today. Revisit if a deployment needs it.

---

## 17. ISO 15189:2022 Report Content Check

| Clause (report content) | Where this report meets it | V |
|---|---|---|
| 7.4.1.6 a: patient ID, collection date and issue date on each page | Samples block on page 1 (FR-A59), continuation strip with earliest collection (FR-A17), footer "Issued" (FR-A39) | 1 |
| 7.4.1.6 b: identity of the issuing lab | Header (FR-A10) | 1 |
| 7.4.1.6 c: requester | Prescriber, referring site and ward (FR-A16) | 1 |
| 7.4.1.6 d: primary sample type and anatomical site | Samples block (FR-A59); sample type in test name (FR-A19); body site when order entry v4 supplies it (FR-A18) | 1 / Dependency |
| 7.4.1.6 e: clear identification of each examination | Test name (FR-A19) | 1 |
| 7.4.1.6 f: examination method where appropriate | Method column (FR-A25) | 1 |
| 7.4.1.6 g, h: results with units, reference intervals | Result, Units, Reference range (FR-A19) | 1 |
| 7.4.1.6 j: who reviewed and authorized release | Validated and released by (FR-A36) | 1 |
| 7.4.1.6 k: results that are preliminary | Partial title (FR-A11), pending status in Result (FR-A31) | 1 |
| 7.4.1.6 l: critical results | Critical treatment (FR-A23), callback line (FR-A33) | 1 |
| 7.4.1.6 m: every page part of one report, clear end | Page x of y always, per order (FR-A39); "End of report" (FR-A38) | 1 |
| 7.4.1.7: referral lab results identified | Performed by (FR-A26), † (FR-A28) | 1 |
| 7.4.1.7: sample condition affecting results | Notes (FR-A30); HIL (FR-A32) | 1 / 2 |
| 7.4.1.7: interpretation and comments | General comments (FR-A36), notes | 1 |
| 7.4.1.3: amended reports identified, referencing the original and what changed | Corrected banner (FR-A14); version number (FR-A15) | 1 / 2 |
| 7.4.1.6: primary sample collection date and time; sample condition that affects results | Samples block: collected, received, condition and rejection per sample (FR-A59); rejected tests (FR-A60) | 1 |
| 7.4.1.6: release date | Completed column per test and Completed in the card (FR-A58, FR-A16), validator times (FR-A36) | 1 |
| Accreditation mark use (ILAC P8, accrediting bodies' rules) | Marks only for in-scope finalized in-house work (FR-A13); non-accredited results marked (FR-A28); coverage list (FR-A35) | 1 / 2 |
| 7.4.1.6 i: research-use examinations | Not supported (§16) | none |

---

## 18. Open Questions (non-blocking)

0. **Completed time source.** This FRS uses the release (validation) time. OpenELIS also stores the test date the technician enters at results entry (`completedDate`), which can be backdated and is often date-only. *Suggested:* keep the release time; if a lab also needs the test date, add it later as a second line.

1. **Lab director settings.** The three existing settings (title, given name, surname) are composed as `report-level-signatures.md` §5.8.1 defines. The builder confirms which property key holds which part before slice 1, and Report Management labels them to match.
2. **`analysisStatus`** for released rows repeats information. *Suggested:* print it only for pending rows (FR-A31).
3. **Unplaced fields.** `dept`, `commune`, `healthRegion`, `healthDistrict`, `patientSiteNumber`, `sampleId` are in the data and not printed today. *Suggested:* keep them off in V1.

---

## 19. Docs Impact

The Printed Report Configuration manual page (retired) and the Patient Status Report output page drift when V1 ships. The Feature Doc child of OGC-1111 re-captures both at Acceptance with the `openelis-user-manual` skill.

---

# Appendix A: Jasper Implementation Notes

For the template developer. Coordinates are `x y w h` in points from the band's top-left, Letter template (column width 552). A.10 gives the A4 widths. This is design intent; adjust by a point or two to fit real data, keeping the hierarchy and the page budget in A.9.

## A.1 Styles (monochrome)

```xml
<!-- Fonts come from the font extension (FR-A6): "DejaVu Sans", "DejaVu Sans Mono", pdfEmbedded="true". -->
<style name="Base"          fontName="DejaVu Sans" fontSize="8.5" forecolor="#000000"/>
<style name="LabName"       style="Base" fontSize="12" isBold="true"/>
<style name="HeaderMeta"    style="Base" fontSize="8"  forecolor="#595959"/>
<style name="BlockLabel"    style="Base" fontSize="6.5" isBold="true" forecolor="#595959"/>
<style name="PatientName"   style="Base" fontSize="10" isBold="true"/>
<style name="FieldLabel"    style="Base" fontSize="7.5" forecolor="#595959"/>
<style name="FieldValue"    style="Base" fontSize="8"/>
<style name="Code"          fontName="DejaVu Sans Mono" fontSize="8" forecolor="#000000"/>
<style name="SectionTitle"  style="Base" fontSize="8.5" isBold="true"/>
<style name="ColHeader"     style="Base" fontSize="6.5" isBold="true" forecolor="#595959"/>
<style name="TestName"      style="Base" fontSize="8.5"/>
<style name="Method"        style="Base" fontSize="7"  forecolor="#595959"/>
<style name="MethodRef"     style="Method" isItalic="true"/>
<style name="Value"         style="Base" fontSize="9"/>
<style name="ValueAbnormal" style="Base" fontSize="9"  isBold="true"/>
<style name="ValueCritical" style="Base" fontSize="9.5" isBold="true"/>
<style name="Flag"          style="Base" fontSize="8.5" isBold="true"/>
<style name="CriticalTag"   style="Base" fontSize="6"  isBold="true" forecolor="#FFFFFF" backcolor="#000000" mode="Opaque"/>
<style name="SubLine"       style="Base" fontSize="7"  isItalic="true" forecolor="#000000"/>
<style name="Muted"         style="Base" fontSize="8"  forecolor="#595959"/>
<style name="Footer"        style="Base" fontSize="7"  forecolor="#595959"/>

<!-- Only fill in the template: critical rows. -->
<style name="ResultRow" mode="Transparent">
  <conditionalStyle>
    <conditionExpression><![CDATA["BB".equals($F{flagCode}) || "EE".equals($F{flagCode})]]></conditionExpression>
    <style mode="Opaque" backcolor="#e6e6e6"/>
  </conditionalStyle>
</style>
```

Bars are `<rectangle>` elements (a `<line>` with width and height both set draws a diagonal): high and `*` = filled black 2 pt wide; low = a `<line>` with `x=1 y=0 width=0 height=h`, pen 2 pt, `lineStyle="Dashed"`; critical = filled black rectangle 5 pt wide. All bars stretch with the row (`stretchType="ContainerHeight"`).

## A.2 Page 1 header (56 pt)

| Element | Position | Content | Notes |
|---|---|---|---|
| Left logo | `0 0 48 48` | `$P{leftHeaderImage}` | `scaleImage="RetainShape" hAlign="Center" vAlign="Middle" onErrorType="Blank"` |
| Lab name | `58 0 318 15` | `$P{siteName}` | LabName |
| Title | `58 15 318 10` | final or partial title (FR-A11) | HeaderMeta, bold |
| Additional info | `58 25 318 10` | `$P{additionalSiteInfo}` | HeaderMeta, remove when blank |
| Director line | `58 35 318 10` | `$R{report.patient.labDirector} + ": " + title + " " + given + " " + surname` | HeaderMeta |
| Accreditation note | `58 45 318 9` | `$P{accredNotesLine}` | Footer style, printWhen non-null |
| Accreditation marks | `384 8 32 32`, `420 8 32 32`, `456 8 32 32` | `accredLogo1..3` | square, RetainShape, printWhen non-null; slots always reserved |
| Right logo | `504 0 48 48` | `$P{rightHeaderImage}` | as left |
| Rule | line `0 54 552 0` pen 0.75 | | black |

Corrected banner (when FR-A14 applies), 16 pt after the header: `rectangle 0 0 552 14` pen 1.5 black, no fill; text `6 2 540 10` bold 8 pt from `report.patient.corrected.line`.

## A.3 Continuation header (pages 2+, 30 pt)

Left logo `0 0 24 24`; lab name + title on one line `30 4 400 12` (bold 9 pt + HeaderMeta); "Page x of y" `432 4 120 12` right; patient strip `0 16 552 12` (7.5 pt): name (bold) · patient code · national ID · lab number · prescriber · site / ward · `report.patient.strip.collected` or `.collectedFirst` with the earliest collection time; rule at y 29.

## A.4 Order card (page 1, about 62 pt)

Three columns, 180 / 180 / 180 pt with 6 pt gutters. Each: BlockLabel heading with a 0.5 pt rule, then label (72 pt, FieldLabel) and value (FieldValue) pairs at a 9.5 pt pitch. Labels wrap to a second line rather than truncating, because several languages run longer than English (Bahasa "Nomor Identitas Pasien"). Patient column starts with the name line (PatientName) and "age · sex" right-aligned. Codes use the Code style. Rows whose switch is off use `printWhenExpression` plus `isRemoveLineWhenBlank="true"`.

## A.4a Samples block (page 1, 9 pt + 9 pt per sample)

In the order group header, after the card; `splitType="Prevent"`. A list component (or subreport) over the `samples` sub-list. Heading row `0 0 552 8` in BlockLabel style with a 0.5 pt rule under it: # `0 0 18 8` centred, Samples `20 0 150 8`, Collected `172 0 62 8`, Received `236 0 62 8`, Condition `300 0 252 8`. Sample rows at a 9 pt pitch, 8 pt: # `0 1 18 8` Code centred; type `20 1 150 8`; collected `172 1 62 8` and received `236 1 62 8` in the Footer style at 7.5 pt, black; condition `300 1 252 8` stretching, bold when rejected. A4: Samples 146, Condition 239, the rest unchanged. A 2 pt gap follows the block.

## A.5 Column header (every page, 12 pt)

At the top of the result area on each page (`columnHeader` band): Test `0 2 154 9`, Smp `156 2 18 9` centred, Method `176 2 80 9`, Result `258 2 70 9` right, Flag `330 2 34 9` centred, Reference range `366 2 78 9`, Units `446 2 42 9`, Completed `490 2 62 9` (the 50 pt column plus padding); rule `0 11 552 0` pen 0.75. Header labels may wrap to two lines in longer languages; the band then grows to 18 pt, which the page budget absorbs.

## A.6 Section title (11 pt)

`0 1 552 9` SectionTitle, uppercase; rule `0 10 552 0` pen 0.5 `#595959`. Group header with `minHeightToStartNewPage="30"` so a title keeps with its first row.

## A.7 Result row (13 pt, stretches)

| Element | Position | Content | Rule |
|---|---|---|---|
| Row fill | rectangle `0 0 552 13` | | style ResultRow (critical only) |
| Bar | rectangle `0 0 2 13` or `0 0 5 13` | | A.1; stretches |
| Test | `8 2 146 10` | test name + " †" when FR-A28 applies | TestName; +10 pt indent for panel members and components |
| Smp | `156 2 18 10` | sample number | Code, centred |
| Method | `176 2 80 10` | method or "Performed by {lab}" | Method / MethodRef; stretches |
| Result | `258 2 70 10` | result or pending status | Value / ValueAbnormal / ValueCritical; pending in italic |
| Flag | `330 1 34 10` | arrow + letter; R / C | Flag |
| Critical tag | `333 10 28 7` | `report.patient.critical` | CriticalTag; row grows to 18 pt on critical rows |
| Range | `366 2 78 10` | `$F{testRefRange}` | Muted |
| Units | `446 2 42 10` | `$F{uom}` | Muted |
| Completed | `490 2 62 10` | `$F{completedTime}` | Footer style (7 pt), black |
| Divider | line `8 12 544 0` pen 0.25 | | `#595959` |

All text fields `isStretchWithOverflow="true"`; the band `splitType="Prevent"` so a row and its note / callback line never split.

**Note line** (printWhen note): `8 0 544 9` SubLine, "Note: " + note, styled markup.
**Callback line** (printWhen a callback): dotted rule `8 0 0 9` pen 1 `lineStyle="Dotted"`; text `12 0 540 9` SubLine from `report.patient.callback.line` (+ `report.patient.callback.more`).
**Components** (FR-A29): a subreport or list component iterating the component sub-list, one 11 pt row per component with the same column geometry and flag / bar logic as a result row, test column indented 10 pt.

## A.8 Sign-off, end of report, footer

**Sign-off** (group footer of the patient, about 54 pt, `footerPosition="Normal"` so it flows after the last row; `splitType="Prevent"`): rule `0 0 552 0` pen 1; left cell `0 4 300 48`: BlockLabel "General comments", conclusion text 8 pt stretch; right cell `308 4 244 48`: BlockLabel "Validated and released by", validator list 8 pt (one per line), signature image `308 30 120 30` RetainShape (printWhen `useLabDirectorSignature`), director line 7.5 pt under it. OGC-302's entries replace the validator list in the same cell when e-signatures are on.
**End of report**: `0 0 552 10` centred, Footer style, directly after the sign-off.
**Page footer** (22 pt): legend `0 1 552 9` (Footer, styled markup, built from the flag keys, with the † line when any row carries it); rule `0 11 552 0` pen 0.5; "Issued {date}" `0 13 200 9`; lab number · patient code `200 13 152 9` centred; "Page x of y" `352 13 200 9` right, the total a text field with `evaluationTime="Group"` on the order group (as the current template does).

## A.9 Page budget (Letter, 792 pt)

| Band | Height |
|---|---|
| Margins | 40 |
| Header | 56 |
| Order card | 62 |
| Samples block (2 samples) | 22 |
| Column header | 12 |
| Page footer | 22 |
| **Left for sections, rows, sign-off** | **578** |

578 pt holds 4 section titles (44), 34 single-line rows (442), 2 notes and 1 callback (27) and the sign-off with end line (64): 577 pt. Each further sample costs 9 pt (about one result row). A4 gives another 50 pt.

## A.10 A4 widths (column width 535)

| Element | Letter | A4 |
|---|---|---|
| Header centre block | 318 | 301 |
| Card columns | 180 × 3 | 174 × 3 |
| Test / Smp / Method / Result / Flag / Range / Units / Completed | 154 / 18 / 80 / 70 / 34 / 78 / 42 / 50 | 148 / 18 / 76 / 68 / 33 / 76 / 40 / 50 |
| Sign-off cells | 300 / 244 | 290 / 237 |

Logo and accreditation slots keep their square sizes; the accreditation slots and right logo shift left by 17 pt.

## A.11 Photocopy matrix

| Meaning | Cues (all monochrome) |
|---|---|
| High | ↑ + H, bold value, solid 2 pt bar |
| Low | ↓ + L, bold value, dashed 2 pt bar |
| Critical | ⇈ / ⇊ + HH / LL, bold 9.5 pt value, 5 pt bar, reversed CRITICAL tag, light gray row |
| Coded abnormal | *, bold value, solid bar |
| Not accredited | † after the test name, legend line |
| Pending | italic status text in the Result column, no flag |
| Callback | italic line with "Callback:" and a dotted rule |
| Corrected | bordered banner with bold text |

Print test before merge: print the page-economy fixture on a monochrome laser, photocopy once, and check every row against this table.

## A.12 Field map

| Field | Prints in |
|---|---|
| `patientName`, `age`, `gender`, `dob`, `subjectNumber`, `nationalId`, `billingNumber`, `stNumber`, `contactTracingIndexName`, `contactTracingIndexRecordNumber` | Card, Patient column; name, code and national ID also in the continuation strip; code in the footer |
| `accessionNumber`, `labOrderType`, `contactInfo` (prescriber), `siteInfo` (site and ward) | Card, Order column; lab number, prescriber and site also in the strip; lab number in the footer |
| `orderDate`, `orderFinishDate` | Card, Dates column |
| `samples` (new sub-list: number, type, collected, received, condition, rejected), replacing the `collectionDateTime` string; `recievedDate` as the receipt fallback | Samples block (FR-A59); earliest collection in the strip |
| `sampleRejected`, `testRejected` (new) | Result cell of rejected rows (FR-A60) |
| `testSection` | Section title |
| `sampleType` | Not printed separately (already appended to the test name) |
| `testName`, `sampleSortOrder`, `result`, `testRefRange`, `uom`, `parentMarker`, `panelName`, `separator` | Result row |
| `alerts`, `abnormalResult` | Replaced for display by `flagCode`, `referralPending`, `confirmationSample`; `abnormalResult` still drives bold |
| `analysisStatus` | Result cell of pending rows (FR-A31) |
| `note` | Note line |
| `completedTime` (new) | Completed column; latest one in the card |
| `completeFlag`, `correctedResult` | Title (FR-A11); corrected banner derived per FR-A14 |
| `conclusion` | Sign-off, General comments |
| New: `flagCode`, `referralPending`, `confirmationSample`, `methodName`, `performingLabName`, `inAccreditedScope`, component sub-list, callback line data, validator list | See §11.2 N2, N3 |
| `dept`, `commune`, `healthRegion`, `healthDistrict`, `patientSiteNumber`, `sampleId` | Not printed (Open Question 3) |

