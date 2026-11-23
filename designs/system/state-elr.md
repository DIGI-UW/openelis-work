# Public Health Reporting (state ELR): Functional Requirements Specification

| | |
|---|---|
| **Version** | v0.3 (2026-11-13: Phase 1 scope and architecture change: reporting as a saved report definition delivered through the FHIR results door, mediator builds ELR; requirement disposition added).  v0.2 (gap review of 2026-11-05 applied: send on release rather than on issue, referred-out results, clinical domain only, resistance-defined conditions, timeliness, proof of reporting, sensitive rows, non-functional requirements). v0.1 (2026-11-04) first draft |
| **Date** | 2026-11-04 |
| **Author** | Casey Iiams-Hauser (Director of Product) |
| **Status** | Draft. v0.3 reduces Phase 1 to the subset in "Phase 1 scope and architecture change"; breakdown follows RPT-1 |
| **First deployment** | SolAura Clinical Laboratory (California): reporting to CalREDIE. Written as a general US capability |
| **Preview** | `state-elr-preview.html` |
| **Builds on** | `ehr-lab-interface-frs.md` (the HL7 v2 engine, profiles as data, the Interfaces admin group, the outbox product model) |
| **Verified against** | `DIGI-UW/OpenELIS-Global-2` `develop` at `1b1acbf` (2026-11-04); Result Delivery FRS v0.3; Clinical Order Entry v4 FRS v0.20; AMR v3 FRS; Users and Roles FRS v0.1 |
| **Decisions** | D-390 to D-394 and D-398 proposed (the EHR spec holds D-384 to D-389 and D-395 to D-397; AMR Surveillance holds D-375 to D-383). Confirm at registration |

---

## Phase 1 scope and architecture change (v0.3, 2026-11-13)

Set by Piotr Mankowski on 2026-11-13 and recorded in the SolAura Build Roadmap (https://claude.ai/artifact/XTi6qdfi6iXgfisbUm7AXR). Jira: OGC-1623. This section governs where it conflicts with the requirements below; the rest of the spec stays as the record for later phases.

### What changed

- **State reporting is a reporting task.** It fits the OpenELIS reporting strategy rather than a separate HL7 engine: a saved report definition in the report builder (OGC-479) selects reportable results by test and result (RPT-1, RPT-3).
- **Delivery as results are released.** A new delivery option on a saved definition sends each newly matching released result through the FHIR results door on the delivery queue, shown in Sent Messages (RPT-2, DOOR-6). The same mechanism is meant to serve AMR surveillance (OGC-1618).
- **The mediator builds the message.** The external HL7 to FHIR mediator turns bundles addressed to the state into ELR 2.5.1 with the lab's name, CLIA number and address, and sends them over the state's direct interface (MED-6). California direct is assumed until SolAura and the state confirm.
- **No destination admin screens.** The single destination, California, is mediator configuration; the reportable list is a shared report definition shipped in the distro, viewable, editable and runnable as CSV.
- **Design before build.** RPT-1 precedes construction (definition expression, trigger on release or sweep, corrections already sent, destination naming, AMR reuse).

### Requirement disposition

| Disposition | Where | Requirements |
|---|---|---|
| Kept | Mediator | D1 to D4, D6 the California report message; I1 test records only during onboarding; I2 export of recent messages for the state's validator |
| Kept | OpenELIS | B1, B4 reportable by test and result, as a saved report definition; F1, F2 send on release, send corrections; F3, H1, H2 through the delivery queue, shown in Sent Messages; E2 send with the data available, never held; E5 race and ethnicity on the patient (RPT-4); D8, E4 questions asked at order carried into the report (RPT-5, OGC-1144); H7 proof of reporting by running the same definition as CSV |
| Moved to config | Mediator files or distro | A1, A2 one destination, California, in the mediator; B1 to B3 the reportable list as a shared report definition shipped in the distro; C1 routing: everything tested at this lab; lab name, CLIA number and address |
| Out of Phase 1 | | A3 other state and national profiles; A4, A5 destination admin screens; B2, B5 code list import with preview, per-test override; B7, B9 referred-out tests, list aging; C2 to C4 routing by patient residence; D5, D7 culture results, separate HIV messages; E3, F4 send-update after late data, batching; G1, G2 phone reporting notices; H3 to H6 sensitive-row masking, counts, timeliness tags; I3 go-live checklist screen |

Sections not listed above (J non-functional, Access, Localization) apply only to the kept requirements. The reportable list for SolAura is expected to cover only the carbapenemase resistance genes on the UTI panel; SolAura confirms it. The disposition was made from the requirement list and is open to correction by the author.

### Roadmap items

RPT-1 to RPT-5, MED-6, DOOR-6. Done when the state accepts test messages; production approval follows the state's timeline.

---

## Lab Context

### Current State

Every US state lists diseases and conditions that laboratories must report to public health: syphilis, chlamydia, gonorrhea, hepatitis B and C, HIV, tuberculosis, salmonella, measles, carbapenem-resistant organisms and dozens more. In California the list is Title 17, section 2505 of the California Code of Regulations, and the law (Health and Safety Code 120130(g)) requires labs to send these reports **electronically** to CalREDIE, the state's disease surveillance system, as HL7 v2.5.1 Electronic Laboratory Reporting (ELR) messages. A result for a condition in the most urgent group must also be phoned to the local health officer within one hour; the electronic report is due within one working day. California's rule covers everyone tested in California and California residents tested elsewhere.

Other states run the same model with their own systems and companion guides (Texas, New York, Florida, Washington and others), and a lab that tests a patient living in another state may owe that state a report too. APHL (the Association of Public Health Laboratories) runs AIMS, a hub that receives standard ELR messages and routes them to many jurisdictions through one connection.

OpenELIS cannot produce ELR today. A US lab using it would have to key each reportable result into a web form, fax it, or buy an interface engine to rebuild messages from a data export.

### Pain

- **It is the law, and the deadline is a working day.** A positive syphilis or hepatitis C result that waits for someone to key it in is a compliance failure, and a lab that cannot show electronic reporting cannot get through CalREDIE onboarding (CDPH asks for an active state license, CLIA number and the ability to submit HL7 2.5.1 before production).
- **Someone has to know what is reportable.** CDPH publishes a code list of reportable tests and result values (LOINC and SNOMED CT, December 2024) and sends letters to labs that change it (non-positive HCV RNA, non-positive TB IGRA, multiplex respiratory panels, syphilis). Keeping a paper list in reception's head does not survive the next letter.
- **Public health needs data the bench does not.** CalREDIE requires race, ethnicity, address, phone, pregnancy status, the ordering provider's NPI and phone, and the ordering facility's address. If any of these is missing, the case investigator spends a day chasing the clinic; if the lab waits for them, the report is late.
- **Rejected messages vanish.** When a state answers with an error, someone has to fix and resend. Without a log, nobody knows a report bounced.

### What Changes

When a validator releases a positive *Chlamydia trachomatis* NAAT for a patient living in Fresno, OpenELIS sees that its LOINC and result are on the CalREDIE code list and, as soon as the report version is issued, sends an ELR message to CalREDIE. Nobody presses anything. If the patient lives in Texas, a second message goes to Texas's ELR route (or, if the lab has not set Texas up, Sent Messages shows "Skipped: no public health route for Texas" so it can be reported another way). If the order had no race or pregnancy status, the message still goes, and Sent Messages lists it under **Sent with missing data** so the lab can get the answer from the clinic and send an update.

For a measles IgM positive, the validation screen also says "Phone the local health officer within 1 hour" and records the call in the existing callback record. The lab's interface analyst keeps reportability current by importing CDPH's updated code list through a preview that shows exactly which tests become reportable or stop being reportable, and can override a single test in the test catalog.

---

## Overview

Public Health Reporting sends reportable results to the public health jurisdictions that need them, as HL7 v2.5.1 ORU^R01 messages following the national ELR implementation guide with each jurisdiction's companion guide on top. It reuses the HL7 engine, the profile model, the Interfaces admin group and the outbox from the EHR Lab Interface spec.

| Part | What it does | Where the user meets it |
|---|---|---|
| **Jurisdictions** | One record per destination (CalREDIE, Los Angeles County, Texas, AIMS...) with its profile, connection, routing rules and required data | Admin, Interfaces, Public Health Reporting |
| **Reportability** | Decides whether a released result is reportable: the jurisdiction's code list plus a per-test override | Code list import; test catalog, test editor |
| **Routing** | Decides which jurisdictions get a reportable result: where the patient lives, where the lab is | Jurisdiction's Routing section |
| **Sending** | Builds and sends one message per report version per jurisdiction, automatically, with corrections as corrected | Automatic; Sent Messages, product Public health |
| **Follow-up** | Lists messages sent with missing data, refused by the state, or skipped with no route; prompts the phone call for urgent conditions | Sent Messages filters; Validation |

### Navigation & URL

| Page | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Public Health Reporting (new, record list of jurisdictions) | Admin, Automation, Interfaces, Public Health Reporting (after EHR Profiles) | `Home / Admin Management / Interfaces / Public Health Reporting` | `/MasterListsPage/interfaces/publicHealth` |
| A jurisdiction (new, record editor, type C) | sections as children while open (AF-7) | `Home / Admin Management / Interfaces / Public Health Reporting / <name> / <section>` | `/MasterListsPage/interfaces/publicHealth/<id>/<section>`; sections `connection`, `profile`, `reportable`, `routing`, `data`, `golive` |
| Test editor, Public health reporting field (existing editor) | Admin, Resources, Test Catalog, Tests | `Home / Admin Management / Test Catalog / Tests / <test> / Results` | existing `/MasterListsPage/TestCatalogEditor/<id>/results` |
| Sent Messages (Result Delivery) | Reports, Sent Messages | `Home / Reports / Sent Messages` | `/SentMessages?product=public_health` plus `&followup=missing\|failed\|skipped` |
| Validation (existing), phone prompt | Testing, Validation | existing | existing |

### Reuse inventory (design-addendum MUST F)

| The design needs | Reuses | Checked |
|---|---|---|
| HL7 v2.5.1 message building, profiles as data, connections, environments, Paste a message, go-live checklist | EHR Lab Interface engine and profile model (sibling spec, FR-A, FR-B, FR-I) | Spec |
| Outbound queue, retry, acknowledgment, log, resend, Skipped with a reason | Result Delivery outbox and Sent Messages (FR-A7 to FR-A9), product `public_health` | Built (OGC-439, #4755): `delivery` package and `/SentMessages` (D-222, D-388) |
| When to send | Report Print Queue issued versions (D-223) | Spec |
| Code list import with preview and decision queue | Import Review pattern (Locations & Organizations import, OGC-1194 framework, AS-33) | Built (OGC-1363, OGC-1194) |
| "Is this test reportable at all" | Test `isReportable` flag (built) stays the lab-report flag; public health reportability is a separate field (FR-B5) | `test/valueholder/Test.java` line 90 |
| Test LOINC, coded result SNOMED CT | `Test.loinc`; coded result options (Dictionary) with SNOMED codes | Built (LOINC); SNOMED on result options to confirm (Dependency 4) |
| Organism SNOMED CT | AMR package organisms with SNOMED (D-262) | Spec (AMR v3) |
| Specimen type and source site codes | Sample type; body site and laterality (D-079) | Spec |
| Race, ethnicity | `Patient.race`, `Patient.ethnicity` columns (built, not shown in the React patient form) | `patient/valueholder/Patient.java` lines 38, 65 |
| Coded value lists (race, ethnicity, pregnancy status) | Dictionary categories | Built |
| Pregnancy status and other order questions | Order questions (Programs questionnaires, order additional information OGC-1144) | Programs built; OGC-1144 Backlog |
| Patient address and phone; provider phone and address; facility address | Person; Provider's Person; Organization | Built |
| Lab CLIA number | Lab's own Organization identifier "CLIA" (L&O identifiers) | Built |
| Phone report record | `CriticalCallback` | `qaevent/criticalcallback/*` |
| Sensitive results (HIV) hidden from general view | Result Delivery's lab-defined sensitive test list (proposed in Result Delivery: no result content to patients for listed tests) | Spec, proposed |
| Who performed a referred test, and whether it reports to public health | Referral record and the referral lab's Organization (Locations & Organizations referral-lab fields) | Built (referral); L&O fields specced |
| Working days for the reporting deadline | Calendar (working week, holidays) | Built (`calendarManagement`) |
| Resistance-defined conditions (carbapenemase-producing organisms) | AMR v3 expert rules and resistance alerts on the isolate (D-292) | Spec (AMR v3) |

New: the **jurisdiction** record, the **reportable code list entry**, the test's **public health reporting** setting, and **routing rules**. Listed under Dependencies.

---

## User Stories

1. As a **lab director**, I want every reportable result sent to CalREDIE automatically when it is released, so that the lab meets the one-working-day requirement without anyone keying reports.
2. As an **interface analyst**, I want to import CDPH's updated code list and see which tests become or stop being reportable before I apply it, so that reportability follows the state's list, not memory.
3. As a **validator**, I want OpenELIS to tell me when a result needs a phone call to the health officer within one hour, and to record that I made it, so that urgent cases are not left to the electronic report alone.
4. As a **quality manager**, I want to see every public health report that the state refused, that went out with missing data, or that had no destination, so that I can fix and resend before an auditor asks.
5. As a **case investigator** at the health department, I want the report to carry the patient's address, phone, race, ethnicity, pregnancy status and the ordering provider's contact, so that I can start the investigation the same day.
6. As a **quality manager facing an inspection**, I want a list of everything reported for a period, with when each result was released, sent and acknowledged, so that I can prove the lab reported on time.

---

## Functional Requirements

### A. Jurisdictions and profiles

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | A **jurisdiction** is one public health destination: name, the health department it belongs to, its ELR profile, its connection (External Connection of type "HL7 interface", inbound for acknowledgments where the jurisdiction sends them), environment (Staging or Production), routing rules (FR-C), required data (FR-E), status (Ready, Not set up, Paused, Failing, as EHR Lab Interface FR-B8) and Active. | |
| FR-A2 | An **ELR profile** is an EHR-profile record (EHR Lab Interface FR-A1) of kind Public health, adding: message profile identifier (MSH-21), receiving application and facility (MSH-5, MSH-6), batch or single messages (FHS/BHS where batched), acknowledgment expected or not, field rules (lengths, allowed characters, phone format), value sets (race, ethnicity, sex, specimen), and special message rules (for example California: HIV results always in their own message). | One profile model for EHRs and jurisdictions (D-390) |
| FR-A3 | OpenELIS ships these profiles, read-only, each with its source and date (Appendix S): **National ELR (HL7 2.5.1 ELR R1 with errata)**, **California CalREDIE**, **Los Angeles County ELR**, **Texas DSHS**, **New York ECLRS**, **Florida DOH**, **Washington DOH (WELRS)**, **APHL AIMS**. A shipped profile carries "Starting values from the jurisdiction's published guide, {date}; confirm during onboarding." Duplicate for a variant (FR-A3 of the EHR spec). | Casey 2026-11-04 shortlist |
| FR-A4 | Public Health Reporting is a type B list of jurisdictions: name, profile, routing summary ("Patients tested here, and California residents"), environment, status, sent in the last 7 days, refused in the last 7 days, Active, Edit. | |
| FR-A5 | Moving a jurisdiction from Staging to Production is a marked change (AS-29: "Reportable results for real patients will be sent to {jurisdiction}") with typed confirmation (AS-30). In Staging, only messages for test patients are sent (FR-I). | CDPH: staging for mock data, production for live |

### B. What is reportable

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | Each jurisdiction holds a **reportable code list**: one entry per reportable test, by LOINC code, with the condition it reports (for display), and **which results to report**: Positive or abnormal only (default), or All results including negative and not detected. An entry may also list result values by SNOMED CT (for coded results, for example "Detected", an organism) that count as positive, and carry two flags: **Phone within 1 hour** (FR-G) and **Separate message** (FR-D6). | |
| FR-B2 | **Import a code list.** The analyst imports the jurisdiction's published list (CalREDIE's LOINC and SNOMED list as Excel or CSV; CDC's Reportable Condition Mapping Table for other states) through the Import Review pattern: column mapping on first use, a preview listing the tests in this lab's catalog that **become reportable**, **stop being reportable** and **change** (for example from positive only to all results), a decision queue, nothing written until applied, and the run kept in history (AS-33). | Most entries in a state list are tests the lab does not run; the preview shows only the lab's |
| FR-B3 | Entries are matched to this lab's tests by the test's LOINC (and, for multi-component tests, each result component's LOINC). A test with no LOINC is listed in the preview as **Cannot be matched: no LOINC** with a link to the test editor. | |
| FR-B4 | A result is **reportable to a jurisdiction** when its test (or result component) matches an entry and: the entry says All results; or the result is coded and its value's SNOMED CT is one the entry lists, or is flagged positive (detected, reactive) by the test's result options; or the result is numeric or text and its abnormal flag is set; or, for an organism, the organism's SNOMED CT is listed. | |
| FR-B5 | **Per-test override.** The test editor's Results section gains **Public health reporting**: Use code lists (default), Always report, Never report; Always and Never need a reason and are listed in each jurisdiction's Reportable section as overrides. It is separate from the existing Reportable setting (`isReportable`), which decides whether the result appears on the patient report. | For a local reportable test not yet on the state list, or a research-use test |
| FR-B6 | A test whose results are never released to the patient report (In lab only, D-184, D-204) is never sent to public health. QC and EQA results are never sent. Only Clinical domain orders are reported (D-004); environmental and vector results never go to ELR. Results entered as **Tested elsewhere** (Clinical Order Entry v4) are never sent: the lab that performed them reports. | |
| FR-B7 | **Referred-out tests.** A reportable result for a test this lab referred to another lab is sent by this lab only when that lab does **not** report to the jurisdiction. Each referral lab Organization gains **Reports to public health in** (states; default: the lab's own state when the referral lab is in it, otherwise none). When this lab sends a referred result, OBX-23 and OBX-24 name the performing lab and its CLIA number. When it does not, the Sent Messages row is **Skipped: reported by {lab}**, so the decision is visible. | D-398; CDPH: the performing lab reports unless it is out of state and does not report to CalREDIE |
| FR-B8 | **Conditions defined by resistance.** An entry may list a resistance condition instead of result values (for example carbapenemase producer, carbapenem resistant). A culture isolate counts as positive for it when AMR v3 marks the isolate with that condition (expert rule or carbapenemase test result), and the message carries the organism, the susceptibility results and the mechanism test results in the parent and child structure (FR-D5). | CDPH CPO ELR FAQ; coordinate with AMR v3 |
| FR-B9 | **Keeping lists current.** Each jurisdiction shows its code list's source, version and import date. Twelve months after the last import, the jurisdiction shows **Check for a newer code list** and raises one Alert to holders of `interface_mapping:manage`. OpenELIS never fetches lists by itself. | |

### C. Routing

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | Each jurisdiction has **routing rules** from this set, combined with OR: **Patient lives in** (states; counties or cities within a state); **Tested at this lab** (true for the lab's own state jurisdiction); **Ordering facility is in** (states, counties). A rule can **exclude** an area (CalREDIE: patients living in Los Angeles County, when the LA County route takes them instead, Open Question 1). | Routing is data on the profile, editable on a duplicate |
| FR-C2 | The patient's residence is the patient address on the order's patient record (state, county from the address hierarchy or ZIP code). When the address has no state, the result routes to the jurisdictions that take **Tested at this lab** and the message is listed as Sent with missing data (address). A patient living outside the United States (for example in Mexico) routes the same way, with the country in PID-11; a patient recorded as having no fixed address routes to Tested at this lab and is not counted as missing data. | California's rule: everyone tested in California |
| FR-C3 | A reportable result for a patient living in a state for which no active Production jurisdiction exists writes a **Skipped** row in Sent Messages with "No public health route for {state}" (Result Delivery FR-A9), so it can be reported another way. It is never silent. | |
| FR-C4 | One reportable result produces at most one message per jurisdiction per report version, even when several rules match. | |

### D. The message

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | **Structure.** ORU^R01, HL7 2.5.1, ELR Release 1 with errata, with the profile's rules on top: MSH (sending facility name and CLIA number, message profile, receiving application and facility), SFT (OpenELIS and its version), PID, ORC, OBR, OBX, SPM, NTE. One patient per message. | CDPH Dec 2024 requires SFT and SPM |
| FR-D2 | **Patient.** Name (profile rule: California strips non-ASCII letters, keeping hyphens), date of birth, sex, race (CDC race codes, several allowed), ethnicity, address with county, phone (digits only where the profile says), and identifiers (lab patient ID; the EHR's medical record number when the order came through an EHR interface). | |
| FR-D3 | **Order and provider.** Ordering facility name, identifier (NPI), address and phone (ORC-21 to ORC-23); ordering provider NPI, name, phone and address (OBR-16, OBR-17, ORC-24); pregnancy status where the profile requires it (California: OBR-13 as Prenatal, Not pregnant or Unknown, never blank); diagnosis codes (ICD-10) as reason for study (OBR-31) when the order has them; result status (OBR-25: P, F, C). | |
| FR-D4 | **Results.** OBR-4 is the ordered test or panel's LOINC; each OBX carries its own LOINC (never the panel's), the value with the right data type (SN for quantitative, CWE with SNOMED CT for coded), UCUM units, reference range, abnormal flag (A or N; S, I or R for susceptibility), result status, method or instrument (OBX-17), result date and time (OBX-19), and the performing lab's name, CLIA number and address (OBX-23, OBX-24). Multiplex panels report every analyte the panel tested, including not detected subtypes where the profile says (California: influenza A and B subtypes and RSV). A combined analyte that the test cannot separate gets the profile's NTE. | |
| FR-D5 | **Microbiology.** Culture and susceptibility follow the ELR parent and child structure in one message (OBR-26 and OBR-29; susceptibility OBX linked to the organism), with a separate SPM after each group when several organisms are reported. | Coordinate with AMR v3 and D-213 |
| FR-D6 | **Specimen.** SPM carries the accession (unique per patient and test order, never reused), specimen type as SNOMED CT, source site as SNOMED CT (from body site, D-079), collection and received date and time. | |
| FR-D7 | **Separate messages.** An entry flagged Separate message (California: HIV) is always sent in a message of its own, never combined with other results of the order. | |
| FR-D8 | **Order questions.** Answers the profile asks for (pregnancy, employed in health care, symptomatic, onset date) are sent where the profile places them (NTE after the OBX for California; OBX groups for others). | |

### E. Required data and follow-up

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | Each profile lists the data the jurisdiction **requires** (for California: race, ethnicity, patient address and phone, pregnancy status for listed conditions, ordering provider NPI and phone, ordering facility address and phone, specimen source site). | |
| FR-E2 | **Never held.** Missing required data never stops or delays a message (D-392, following D-211). The message is sent with what OpenELIS has, and its Sent Messages row reads **Sent with missing data: race, pregnancy status**. | One working day is the legal clock |
| FR-E3 | **Send update.** After the missing data is entered (on the patient or the order), the Sent Messages row offers **Send update**, which sends the same report version again with the new data, using the profile's update rule (default: the same result status). | |
| FR-E4 | **Ask at the right moment.** A test whose code list entry needs pregnancy status (California: syphilis, gonorrhea, chlamydia, HIV, Zika, Listeria and other mother-to-child conditions) asks the pregnancy question at order entry through the order questions mechanism, optional by default (never required to save, FR-E2). Race and ethnicity are captured on the patient (FR-E5). | |
| FR-E5 | **Race and ethnicity on the patient.** The patient form shows Race (multi-select) and Ethnicity, from Dictionary categories seeded with the CDC Race and Ethnicity code set (with Unknown and Declined to answer), when Public Health Reporting has any Production jurisdiction. They store in the existing `race` and `ethnicity` columns. | Today the columns exist but no React form shows them |

### F. When messages are sent

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Automatically, on release.** When a reportable result is released (validated by a person or auto-validated), OpenELIS waits the lab-wide wait before sending a new report version (`deliveryHoldMinutes`, default 10) so that results released together go in one message, then sends one message per routed jurisdiction carrying that order's released reportable results (not its other results). It does not wait for a report to be printed or delivered: reporting depends only on release. The message records the report version current at that moment. There is no review queue and no hold button. | Casey 2026-11-04; D-392 |
| FR-F2 | **Corrections.** An Amended version that changes a reportable result sends it with OBR-25 and OBX-11 set to C. A result that was reportable and is corrected to a non-reportable value is still sent as C, so public health can close it. | CDPH: change F to C for corrected finals |
| FR-F3 | **Through the outbox.** Messages are written to the outbox as product **Public health** (`public_health`) and retried on the Result Delivery schedule. | D-388 |
| FR-F4 | **Batching.** A profile that takes batches (a file per period over file exchange) collects messages into a batch at the profile's interval (default every 15 minutes) and sends it; each message keeps its own Sent Messages row with the batch name. | Texas uses file drops |

### G. Phone reporting

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | When a result that matches an entry flagged **Phone within 1 hour** is validated, the Validation row shows a red notice "Report by phone to the local health officer within 1 hour ({condition})" with **Record call**, which opens the existing critical callback record (who was called, number, time, read-back). The electronic message is sent regardless. | Reuses `CriticalCallback` |
| FR-G2 | A Phone within 1 hour result with no recorded call after one hour raises an Alert to the validator and to holders of the results supervisor role. | Existing Alerts |

### H. Acknowledgments and monitoring

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | Where the profile expects acknowledgments, an accept marks the message **Sent**; an error or reject marks it **Failed** with the jurisdiction's error text, and it is not retried automatically. Where the jurisdiction sends no acknowledgments (Florida), a delivered message is **Sent** when the transport confirms delivery. | CDPH: labs review NAKs and resend |
| FR-H2 | Sent Messages gains the product **Public health**, the jurisdiction as recipient, and three quick filters: **Refused** (Failed), **Sent with missing data**, **No route** (Skipped). Each row shows the lab number, condition, version, jurisdiction, status and the jurisdiction's answer; the detail shows the message and the acknowledgment. **Resend** and **Send update** need `delivery:resend`. | |
| FR-H3 | **Sensitive results.** For a test on the lab's sensitive test list (Result Delivery; for example HIV), the Sent Messages row and its detail show the condition, test and message content only to users holding `delivery:view_sensitive`; others see "Sensitive test" and the status, so they can still see that a report failed. | Needs the sensitive test list (Dependency 11) |
| FR-H4 | Each jurisdiction record shows counts for the last 7 days (sent, refused, sent with missing data, no route, late) linking to the filtered Sent Messages. | |
| FR-H5 | **Timeliness.** Each jurisdiction profile has a **reporting deadline** (California: 1 working day; Phone within 1 hour entries also carry their call deadline). Sent Messages shows, for each public health row, released at, sent at, acknowledged at and the time taken; a row acknowledged after the deadline, or still not acknowledged when it passes, is tagged **Late**. Working days come from the Calendar. | |
| FR-H6 | **No acknowledgment.** Where the profile expects acknowledgments, a message without one after the profile's timeout (default 4 hours) is tagged **Sent, not acknowledged** and counts toward Failing after three in a row. | |
| FR-H7 | **Proof of reporting.** Sent Messages, filtered to Public health and a period, exports as CSV: lab number, patient identifier, condition, test, result, jurisdiction, released, sent, acknowledged, status, answer, late. Sensitive rows follow FR-H3. The export is recorded in the audit trail. | For inspections and the Accreditation Readiness evidence |

### I. Onboarding

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | In Staging, the analyst can mark patients and orders as **test** records; only those are sent. Real reportable results are not sent to a Staging jurisdiction. | |
| FR-I2 | **Export messages for validation** downloads the last 25 messages for a jurisdiction as a text file, to submit to the NIST ELR validation tool or the jurisdiction's onboarding team. | Florida and Washington ask for NIST validation reports |
| FR-I3 | **Go-live checklist** (computed): connection set; code list imported and applied; every lab test on the code list has a LOINC; race and ethnicity capture on; at least one test message accepted in Staging; CLIA number set on the lab's organization. | |

### J. Non-functional

| ID | Requirement |
|---|---|
| NFR-1 | 95% of reportable results leave OpenELIS within 15 minutes of release when the connection is up (the wait of FR-F1 plus sending). |
| NFR-2 | A day of 2,000 reportable results (an outbreak, or "all results" lists such as COVID-19, influenza and RSV) is handled without slowing validation. |
| NFR-3 | Messages are kept with the order's record for as long as the order is kept (D-002). |
| NFR-4 | Viewing a public health message's content is recorded in the audit trail. |

---

## Information & Data

### Reused as is or widened

| Information | Source |
|---|---|
| Released results, versions, corrections | Analysis and results; Report Print Queue issued versions |
| Patient name, birth date, sex, address, phone, race, ethnicity | Patient, Person (race and ethnicity columns now shown, FR-E5) |
| Ordering provider and facility, with addresses and phones | Provider and its Person; Organization |
| Lab name and CLIA number | Lab Organization, identifiers table ("CLIA") |
| Test LOINC; result options; organisms with SNOMED CT | Test, result options, AMR package |
| Specimen type, source site, collection and receipt times | Sample, SampleItem, body site |
| Pregnancy status and other questions | Order questions |
| Diagnosis codes | Billing FRS order diagnosis codes |
| Phone call record | `CriticalCallback` |
| Outbound message, attempts, acknowledgment, status | Result Delivery outbox and Sent Messages, product `public_health` |
| Profiles, connections, environments | EHR Lab Interface profile model; External Connection |

### New (declared in Dependencies)

- **Jurisdiction:** name, health department, profile, connection, environment, routing rules, status, active.
- **Routing rule:** jurisdiction, kind (patient lives in, tested at this lab, ordering facility in), areas (states, counties, cities), include or exclude.
- **Reportable code list entry:** jurisdiction, LOINC, condition, report which results (positive only, all), positive result values (SNOMED CT list), phone within 1 hour, separate message, source list and version, applied in which import run.
- **Test public health reporting setting:** Use code lists, Always, Never; reason.
- **Missing data on a sent message:** the list of required items that were empty (for the Sent with missing data filter).
- **Referral lab setting:** Reports to public health in (states), on the referral lab's Organization.
- **Jurisdiction timing:** reporting deadline (working days or hours), acknowledgment timeout; code list source, version, import date.
- **Public health row timing:** released at, sent at, acknowledged at, late flag (derived).
- **Dictionary categories:** Race (CDC codes), Ethnicity (CDC codes), Pregnancy status (Prenatal, Not pregnant, Unknown).

---

## Access

**Who, in user terms**

- **Validators** see the phone-within-1-hour notice and record the call (as they record critical callbacks today).
- The **interface analyst** sets up jurisdictions, imports code lists and sets per-test overrides.
- **Quality managers and supervisors** watch Sent Messages for refused, missing-data and no-route rows, and resend or send updates.
- Nobody can stop or hold a public health message: there is no such control.

**Nominated privileges**

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Add and edit jurisdictions and ELR profiles; move to Production; export messages for validation | `interface:manage` (NEW in the EHR Lab Interface spec) | Administration | As that spec |
| Import code lists; set a test's public health reporting override | `interface_mapping:manage` (NEW in the EHR Lab Interface spec) | Test catalog and reference data | As that spec |
| See public health messages; resend; send update | `delivery:view`, `delivery:resend` (Result Delivery) | Reports | As Result Delivery |
| See sensitive (HIV) rows unmasked | Result Delivery's sensitive-results privilege | Reports | As Result Delivery |
| See the content of sensitive (for example HIV) public health rows | **NEW** `delivery:view_sensitive` | Reports | Roles holding `delivery:view` and the results validation privilege |
| Set a referral lab's Reports to public health in | `organization:manage` (existing) | Test catalog and reference data | As today |
| Record a phone report | existing critical callback capability (`results` category) | Results | As today |

NEW code: `delivery:view_sensitive` (category `delivery`, already mapped to Reports in Users and Roles Appendix A). The sibling spec's codes are reused. Until PR #3443 merges, the Admin role stands for `interface:manage` and `interface_mapping:manage`, and the Validation role for `delivery:view_sensitive`.

---

## Localization

| Key | English | Context | Status |
|---|---|---|---|
| `sidenav.label.admin.interfaces.publicHealth` | Public Health Reporting | Sidebar child, page title | NEW |
| `admin.interfaces.ph.description` | Where reportable results are sent, and which results are reportable. | Page header | NEW |
| `admin.interfaces.ph.add` | Add jurisdiction | Primary button | NEW |
| `admin.interfaces.ph.col.jurisdiction` | Jurisdiction | Column | NEW |
| `admin.interfaces.ph.col.routing` | Receives | Column | NEW |
| `admin.interfaces.ph.col.sent7` | Sent (7 days) | Column | NEW |
| `admin.interfaces.ph.col.refused7` | Refused (7 days) | Column | NEW |
| `admin.interfaces.ph.env.staging` | Staging | Tag | NEW |
| `admin.interfaces.ehr.env.production` | Production | Tag | REUSE (EHR spec) |
| `admin.interfaces.ph.production.marking` | Reportable results for real patients will be sent to {jurisdiction}. | AS-29 marking | NEW |
| `admin.interfaces.ph.section.reportable` | Reportable results | Section | NEW |
| `admin.interfaces.ph.section.routing` | Routing | Section | NEW |
| `admin.interfaces.ph.section.data` | Required data | Section | NEW |
| `admin.interfaces.ph.import` | Import code list | Button | NEW |
| `admin.interfaces.ph.import.becomes` | Become reportable | Preview group | NEW |
| `admin.interfaces.ph.import.stops` | Stop being reportable | Preview group | NEW |
| `admin.interfaces.ph.import.changes` | Change | Preview group | NEW |
| `admin.interfaces.ph.import.noLoinc` | Cannot be matched: no LOINC | Preview group | NEW |
| `admin.interfaces.ph.which.positive` | Positive or abnormal only | Option | NEW |
| `admin.interfaces.ph.which.all` | All results, including negative | Option | NEW |
| `admin.interfaces.ph.flag.phone` | Phone within 1 hour | Flag | NEW |
| `admin.interfaces.ph.flag.separate` | Separate message | Flag | NEW |
| `admin.interfaces.ph.rule.livesIn` | Patient lives in | Rule | NEW |
| `admin.interfaces.ph.rule.testedHere` | Tested at this lab | Rule | NEW |
| `admin.interfaces.ph.rule.facilityIn` | Ordering facility is in | Rule | NEW |
| `admin.interfaces.ph.rule.except` | Except | Rule | NEW |
| `admin.interfaces.ph.export` | Export messages for validation | Button | NEW |
| `admin.interfaces.ph.profileNote` | Starting values from the jurisdiction's published guide, {date}; confirm during onboarding. | Profile note | NEW |
| `test.publicHealth.label` | Public health reporting | Test editor field | NEW |
| `test.publicHealth.useLists` | Use code lists | Option | NEW |
| `test.publicHealth.always` | Always report | Option | NEW |
| `test.publicHealth.never` | Never report | Option | NEW |
| `test.publicHealth.reason` | Reason | Field | REUSE `common.reason` if present (verify) |
| `delivery.product.publicHealth` | Public health | Sent Messages product | NEW |
| `delivery.followup.refused` | Refused | Quick filter | NEW |
| `delivery.followup.missing` | Sent with missing data | Quick filter | NEW |
| `delivery.followup.noRoute` | No route | Quick filter | NEW |
| `delivery.ph.missingData` | Sent with missing data: {items} | Row text | NEW |
| `delivery.ph.noRoute` | No public health route for {area} | Skipped reason | NEW |
| `delivery.ph.sendUpdate` | Send update | Row action | NEW |
| `validation.ph.phoneNotice` | Report by phone to the local health officer within 1 hour ({condition}). | Validation notice | NEW |
| `validation.ph.recordCall` | Record call | Action | NEW (or REUSE the critical callback action key) |
| `patient.race` | Race | Patient field | NEW (verify none on `develop`) |
| `patient.ethnicity` | Ethnicity | Patient field | NEW (verify) |
| `order.question.pregnancyStatus` | Pregnancy status | Order question | NEW |
| `admin.locations.referral.reportsTo` | Reports to public health in | Referral lab field | NEW |
| `delivery.ph.reportedBy` | Reported by {lab} | Skipped reason | NEW |
| `delivery.ph.late` | Late | Tag | NEW |
| `delivery.ph.sensitive` | Sensitive test | Masked cell | NEW |
| `delivery.ph.exportProof` | Export for inspection | Button | NEW |
| `delivery.ph.col.released` | Released | Column | NEW |
| `delivery.ph.col.acknowledged` | Acknowledged | Column | NEW |
| `admin.interfaces.ph.deadline` | Reporting deadline | Field | NEW |
| `admin.interfaces.ph.checkList` | Check for a newer code list | Notice | NEW |
| `admin.interfaces.ph.flag.resistance` | Resistance condition | Entry type | NEW |

---

## Dependencies

| # | What | Needed by | State |
|---|---|---|---|
| 1 | **EHR Lab Interface**: HL7 engine, profile model, Interfaces admin group, External Connection type, `interface:*` privileges | All | Sibling spec, v0.1 |
| 2 | **Result Delivery** outbox, Sent Messages, Skipped status, sensitive-results privacy | FR-F3, FR-H | Built (OGC-439, merged 2026-10-17); sensitive list still a proposal |
| 3 | **Report Print Queue** issued versions | FR-F1, FR-F2 | Built (OGC-431 V1, merged 2026-10-16) |
| 4 | **SNOMED CT on coded result options** (Dictionary entries or result options carry a SNOMED CT code) | FR-B4, FR-D4 | Confirm; AMR organisms already carry SNOMED (D-262) |
| 5 | **Order questions** for pregnancy status | FR-E4, FR-D8 | Programs built; OGC-1144 Backlog |
| 6 | **Race and ethnicity on the patient form** (FR-E5); Dictionary categories seeded | FR-E5, FR-D2 | NEW UI on built columns |
| 7 | **County on the patient address** (address hierarchy or ZIP to county lookup) | FR-C1, FR-C2 | Confirm address hierarchy holds county for US installs |
| 8 | **Import Review** framework for code lists | FR-B2 | Built pattern (OGC-1194, OGC-1363) |
| 9 | **New data**: jurisdiction, routing rule, code list entry, test public health setting, missing-data list; outbox product `public_health` | All | NEW |
| 10 | **AMR v3** parent and child micro results; carbapenemase and resistance conditions on the isolate | FR-D5, FR-B8 | Specced |
| 11 | **Sensitive test list** (Result Delivery proposal) made a lab-defined list in the test catalog | FR-H3 | Proposed in Result Delivery; confirm it ships |
| 12 | **Referral lab field** Reports to public health in (Locations & Organizations referral-lab section) | FR-B7 | NEW field on a specced section |
| 13 | **Calendar** for working-day deadlines | FR-H5 | Built |
| 14 | **Sent Messages CSV export** with the public health columns | FR-H7 | Extends Result Delivery's Sent Messages |

---

## Decisions (proposed)

| ID | Decision | Why | Scope |
|---|---|---|---|
| D-390 | **Public health reporting is the EHR interface engine with jurisdiction profiles as data** (shipped: National ELR 2.5.1, CalREDIE, LA County, Texas, New York, Florida, Washington, APHL AIMS) | One engine for every outbound HL7 v2; a new state is configuration | FEATURE |
| D-391 | **Reportable means: on the jurisdiction's imported code list, or forced by the test's override (Always, Never with a reason)**. Lists are imported through Import Review | States publish and revise lists; the lab must follow them, with an escape hatch per test | FEATURE |
| D-392 | **ELR sends automatically on release** (after the lab-wide wait, without waiting for any report to be printed or delivered); no review queue, no hold; corrections as C; missing required data never holds a send and is listed for follow-up (extends D-211) | Casey 2026-11-04; the legal clock is one working day | FEATURE |
| D-393 | **Routing is by patient residence, testing location and ordering facility, as rules on the jurisdiction**; a reportable result with no route is Skipped with the reason, never silent | Labs owe reports to the patient's state; a gap must be visible | FEATURE |
| D-394 | **Conditions that must be phoned in prompt the existing critical callback record at validation** | Reuse the built callback record; ELR does not replace the phone call | FEATURE |
| D-398 | **A referred-out reportable result is sent by this lab only when the performing lab does not report to that jurisdiction**, set per referral lab; the skip is visible in Sent Messages | Avoids duplicate and missing reports; follows CDPH's performing-lab rule | FEATURE |

---

## Open Questions

1. **Los Angeles County.** LA County runs its own ELR intake (onboarding by phone, 213-989-7208). Does CalREDIE forward LA County residents' reports to LA County, or must a lab send to both? The same question applies to Long Beach and Pasadena. The routing rules support either answer (FR-C1 exclude rule).
2. **CalREDIE transport.** CDPH describes a direct interface under its ELR2PH Companion Guide, and allows APHL AIMS for multistate labs. Which does SolAura prefer? AIMS could also carry Texas, New York, Florida and Washington through one connection.
3. **Non-positive results.** CDPH letters to labs set extra rules (non-positive HCV RNA, non-positive TB IGRA, COVID-19, influenza and RSV, syphilis). Confirm each is carried in the December 2024 code list as "All results", or set by hand after import.
4. **Out-of-state residents.** How often does SolAura test residents of other states? This sets whether the Texas, New York, Florida and Washington profiles are needed at go-live or later.
5. **Whole genome sequencing.** CDPH accepts variant reporting by separate specification. Out of scope here; revisit with the pathogen WGS work.
6. **Blood lead.** California handles blood lead reporting through its childhood lead program, not the general CalREDIE list (LA County's page also says lead goes to a state program). Does SolAura test blood lead? If so, it is a second California jurisdiction with its own list and rules.
7. **Cancer pathology.** If SolAura runs surgical pathology, California requires pathology reports of cancer to go to the California Cancer Registry (Epic lists NAACCR as a result format). That is a separate message type (NAACCR Volume V) and is not in this spec.
8. **Patients tested at SolAura who live in LA County.** See Open Question 1; until it is answered, the shipped CalREDIE profile does not exclude them.

---

## Acceptance Criteria

1. Importing the CalREDIE December 2024 code list shows, before anything is applied, the lab's tests that become reportable, and tests without a LOINC as "Cannot be matched"; applying it writes the entries and keeps the run in history.
2. Releasing a positive CT/NG NAAT for a Fresno patient sends one ORU^R01 to CalREDIE after the report version is issued, with no user action; it appears in Sent Messages under Public health.
3. The message passes the NIST ELR 2.5.1 validator with no errors, and contains SFT, SPM with SNOMED CT specimen type and source site, OBX LOINC, CWE result with SNOMED CT, the performing lab's CLIA number, and OBR-13 pregnancy status.
4. A negative CT/NG result is not sent when the entry says positive only, and is sent when it says All results.
5. A test set to Never report is never sent; a test set to Always report with a reason is sent though not on the list.
6. Correcting a reported result sends it with OBR-25 and OBX-11 set to C.
7. A patient with no race and no pregnancy status is reported on time, and the row reads "Sent with missing data: race, pregnancy status"; entering them and pressing Send update sends the message again with the data.
8. A positive result for a Texas resident with no Texas jurisdiction set up writes a Skipped row "No public health route for Texas".
9. With a Texas jurisdiction in Production, the same result also sends to Texas, and only one message goes to each jurisdiction.
10. An HIV result is always in its own message, and its Sent Messages row is masked for users without sensitive-results access.
11. A measles IgM positive shows the phone notice at validation; Record call opens the callback record; no call after one hour raises an Alert.
12. A jurisdiction error (AE) marks the row Refused with the error text; Resend queues it again.
13. A Staging jurisdiction receives only test patients' results; moving it to Production asks for its name to be typed.
14. The patient form shows Race and Ethnicity from the CDC code sets when any jurisdiction is in Production.
15. With the interface in French, no English text remains on the new pages and fields.
16. A positive CT/NG result is sent 10 minutes after release even though no report was printed or delivered.
17. A positive syphilis result for a test referred to an in-state reference lab writes "Skipped: reported by {lab}"; the same test referred to an out-of-state lab set to report nowhere is sent with that lab as the performing lab in OBX-23 and OBX-24.
18. An environmental sample positive for Legionella is never sent to ELR.
19. A *K. pneumoniae* isolate marked carbapenemase producer by AMR v3 is reported under the CPO entry with its susceptibilities and the carbapenemase test.
20. A message acknowledged two working days after release is tagged Late; a Friday release acknowledged Monday morning is not.
21. Export for inspection over October produces a CSV whose rows match Sent Messages for that filter, with HIV rows masked for a user without `delivery:view_sensitive`.

---

## Out of Scope

- Electronic case reporting (eCR), which comes from the EHR.
- Immunization registries and syndromic surveillance.
- Reporting by CSV, SimpleReport or web forms.
- Aggregate or national roll-ups (D-041, D-050).
- Whole genome sequencing variant reporting (Open Question 5).
- Blood lead and cancer registry reporting (Open Questions 6 and 7).
- Animal rabies (CDPH paper form) and other non-human reports.
- Choosing transports (EHR Lab Interface D-389 applies).

---

## Docs impact

New manual pages: Public Health Reporting, code list import, the test's Public health reporting field, phone reporting at validation. Changed: patient form (race, ethnicity), Sent Messages (new product and filters).

---

## Crosscheck summary (2026-11-04)

**Verdict: proceed with coordination.** No active decision is contradicted. Depends on the sibling EHR spec and on Result Delivery and the Report Print Queue (specced, unbuilt).

| Check | Finding | Severity | Handled by |
|---|---|---|---|
| D-211 (surveillance data never holds up lab work) | Required ELR data could tempt a hard requirement | n/a | FR-E2, D-392 |
| D-230 (nothing unvalidated leaves) | ELR sends only released results | n/a | FR-F1 |
| D-222 and D-388 | Outbound HL7 reuses the outbox | n/a | FR-F3 |
| D-041, D-050 (roll-up outside OpenELIS) | ELR is per-result reporting from the lab, not aggregation | n/a | Out of Scope |
| D-028 (one sample type per test, own LOINC) | Matching is by test LOINC; tests without LOINC cannot be reported | MEDIUM | FR-B3, go-live checklist |
| `isReportable` (built) | Same word, different meaning | MEDIUM | FR-B5 keeps them separate and labelled differently |
| Result Delivery sensitive tests | HIV rows | MEDIUM | FR-H3 |
| AMR v3 (D-213, D-262) | Micro structure and organism SNOMED | MEDIUM | FR-D5, Dependency 10 |
| AMR Surveillance FRS v0.1 (2026-11-05) | Took D-375 to D-383 | HIGH (ID collision) | Renumbered to D-390 to D-394 and D-398 |
| Result Delivery automatic delivery and report issue | v0.1 sent ELR only when a report version was issued; a lab that never prints for a facility would never report | HIGH | FR-F1 now sends on release |
| Result Delivery sensitive test list | v0.1 named a "sensitive-results access" that does not exist | HIGH (invented privilege) | FR-H3 nominates `delivery:view_sensitive`; Dependency 11 |
| Referral (D-016) and Clinical Order Entry v4 Tested elsewhere | Referred and tested-elsewhere results could be reported twice | HIGH | FR-B6, FR-B7, D-398 |
| Accreditation Readiness | Proof of reporting as evidence | LOW | FR-H7 |

---

## Appendix S: State research and shortlist (2026-11-04)

| Jurisdiction | Published guide | Standard | Transport (as published) | Notable rules |
|---|---|---|---|---|
| **California (CalREDIE)** | CDPH ELR HL7 Specifications Guide, December 2024; CalREDIE ELR LOINC and SNOMED code list, December 2024; CalREDIE HL7 Requirements Quick Guide v5 | HL7 2.5.1 ELR R1 (US Realm), 2.3.1 only in rare cases | Direct interface (ELR2PH Companion Guide); APHL AIMS for multistate labs | Legal basis HSC 120130(g), CCR Title 17 §2505; everyone tested in CA plus CA residents tested elsewhere; (e)(1) diseases: phone within 1 hour and CalREDIE within 1 working day; pregnancy status required in OBR-13; HIV in its own message; SFT and SPM required; MSH-4 name up to 20 characters plus CLIA; no non-ASCII letters in names; staging with mock data before production; onboarding needs an active CA license and CLIA (CalREDIE_Onboarding@cdph.ca.gov). Over 350 labs submit through CalREDIE |
| **Los Angeles County** | No public HL7 guide found; ELR by arrangement | ELR | Set up by phone with Automated Disease Surveillance Systems (213-989-7208) | Covers general communicable diseases and STDs; TB coming; HIV not supported; lead goes to the state program |
| **Texas (DSHS)** | DSHS ELR Onboarding Guide v3.1; Texas implementation guide | HL7 2.5.1 ORU, ELR R1 with errata | SFTP (Globalscape) file drops; PHINMS as an alternative | Five phases: registration, pre-testing (vocabulary mapping), testing, acceptance, production; Texas race and ethnicity value sets; LOINC, SNOMED CT, UCUM; CLIA preferred over OIDs |
| **New York (ECLRS)** | ECLRS HL7 2.5.1 Implementation Manual (NYSDOH, 2013) | HL7 2.5.1 ORU^R01 | Not stated in the manual (confirm with NYSDOH) | One PID per message; profiles PHLabReport-Ack, -NoAck, -Batch; FIPS county codes; NK1 for a minor's guardian (lead); ECLRS stores dates without times |
| **Florida (DOH)** | FLDOH ELR Implementation Guide (2015, reissued April 2026) | HL7 2.5.1 ORU^R01, ELR R1 (2010) with 2011 errata; delimited flat files also accepted | Not stated | Batch processing; one patient and one ORC per message; employer in NK1; FLDOH sends no acknowledgments; NIST validator encouraged; Rule 64D-3 F.A.C. |
| **Washington (DOH, WELRS)** | WA ELR onboarding page; WA MSH supplement (August 2025) | HL7 2.5.1 ELR R1 | OneHealthPort HIE | REDCap registration; NIST SITT validation reports to dataexchange@doh.wa.gov; RCMT and specimen value sets; WAC 246-101 |
| **APHL AIMS** | APHL ELR pages | HL7 2.5.1, LOINC, SNOMED CT | One connection; AIMS validates and routes to participating jurisdictions | Recognized by CDPH for multistate labs; millions of ELR messages a year |

### Sources

- [CDPH, CalREDIE Lab Reporting](https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/CalREDIE-Lab-Reporting.aspx)
- [CDPH Electronic Lab Reporting HL7 Specifications Guide (Dec 2024)](https://www.cdph.ca.gov/Programs/CID/DCDC/CDPH%20Document%20Library/CDPH-Electronic-Lab-Reporting-HL7-Specifications-Guide.pdf)
- [CDPH, About CalREDIE Components](https://cdph.ca.gov/Programs/CID/DCDC/Pages/About-CalREDIE-Components.aspx)
- [California Health and Safety Code 120130](https://law.justia.com/codes/california/code-hsc/division-105/part-1/chapter-2/section-120130/)
- [Los Angeles County, Ways to report lab results](https://admin.publichealth.lacounty.gov/report/lab.htm)
- [Texas DSHS ELR Onboarding Guide v3.1](https://www.dshs.texas.gov/sites/default/files/PHID/Documents/DSHS-ELR-Onboarding-Guide-v3.1.pdf)
- [Texas DSHS, ELR for HL7 submitters](https://www.dshs.texas.gov/PHID/HL7.aspx)
- [New York ECLRS HL7 manual](https://www.health.ny.gov/health_care/medicaid/redesign/ehr/repository/docs/eclrs_hl7_manual.pdf)
- [Florida DOH ELR Implementation Guide](https://www.floridahealth.gov/wp-content/uploads/2026/05/FLDOH-ELR-Implementation-Guide.pdf)
- [Washington DOH, Electronic Laboratory Reporting](https://doh.wa.gov/fa/node/12602)
- [APHL, Electronic Laboratory Reporting](https://aphl.org/focus-areas/informatics/reporting/ELR)
- [HL7 ELR Release 1 errata (HL7 wiki)](https://wiki.hl7.org/ELR_Release_1_Errata)
