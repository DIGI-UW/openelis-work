# EHR Lab Interface (HL7 v2 orders and results): Functional Requirements Specification

| | |
|---|---|
| **Version** | v0.2 (2026-11-05: OpenEMR profile added; gap review of 2026-11-05 applied: reflex and added tests, downtime linking, EHR specimen labels, interface verification under CLIA, release trigger, criticals, narrative results, non-functional requirements, admin register rows). v0.1 (2026-11-04) first draft |
| **Date** | 2026-11-04 |
| **Author** | Casey Iiams-Hauser (Director of Product) |
| **Status** | Draft. Clarify, crosscheck and a gap review done (`ehr-elr-review-2026-11-05.md`); ready for `/breakdown` after Casey reviews |
| **First deployment** | SolAura Clinical Laboratory (California): clinics that order on Epic and other EHRs. Written as a general US capability |
| **Preview** | `ehr-lab-interface-preview.html` |
| **Sibling spec** | `state-elr-frs.md` (public health reporting), which reuses the HL7 engine, the outbox and the profiles model defined here |
| **Verified against** | `DIGI-UW/OpenELIS-Global-2` `develop` at `1b1acbf` (2026-11-04) for built mechanisms; Clinical Order Entry v4 FRS v0.20; Result Delivery FRS v0.3; Billing FRS; Users and Roles FRS v0.1; Admin Redesign FRS v1.1 |
| **Decisions** | D-384 to D-389 and D-395 to D-397 proposed. Renumbered on 2026-11-05: the ledger on `main` ends at D-374 and AMR Surveillance FRS v0.1 holds D-375 to D-383; the State ELR spec holds D-390 to D-394 and D-398. Confirm at registration |

---

## Lab Context

### Current State

A US clinical reference laboratory such as SolAura receives most of its work from physician practices, clinics and hospitals. Those clients order tests in their own electronic health record (EHR): Epic in health systems, Oracle Health (formerly Cerner) in many hospitals, athenahealth, eClinicalWorks, NextGen and the open-source OpenEMR in physician offices, MEDITECH in community hospitals. The clinician picks tests from a list in the EHR, answers a few questions the lab needs (fasting? pregnant? collection source?), and the practice prints a paper requisition that travels with the specimen in a courier bag. Results are expected back inside the EHR, filed against the original order, so the clinician sees them in their inbox the same day.

In OpenELIS today none of that is electronic. A receptionist types each requisition into Add Order: patient demographics, insurance, ordering provider, diagnosis codes and the tests. Results go back as a PDF by fax or email, and someone at the clinic scans or attaches it to the chart by hand. OpenELIS can already receive electronic orders over FHIR from OpenMRS, and its code still carries an HL7 v2 order type and an ORU^R01 result builder from the Haiti iSante integration, but nothing receives HL7 v2 orders from a US EHR today, and US EHRs do not send lab orders over FHIR.

### Pain

- **Every order is typed twice.** The clinic already entered it in the EHR. A receptionist re-keying 300 requisitions a day spends most of the shift on transcription, and a transposed date of birth or a wrong test code turns into a wrong-patient result or a recollection.
- **Results do not land in the chart.** A faxed PDF is not a result in the EHR: the clinician cannot trend a creatinine, the EHR cannot fire its own critical-value rules, and the clinic's staff file paper. Clinics choose labs that interface; a lab that cannot is not shortlisted, which is a sales problem for SolAura from day one.
- **Insurance and diagnosis are re-keyed too.** Claims need the member number and ICD-10 (International Classification of Diseases, 10th revision) codes from the order. Re-keying them is where denials start.
- **Each EHR is different.** Epic, athenahealth and eClinicalWorks each publish their own variant of HL7 v2 (Health Level Seven version 2, the message standard US labs and EHRs use). A lab that builds each interface as custom code pays again for every new client.

### What Changes

When Valley Family Clinic orders a lipid panel and a hemoglobin A1c in Epic, the order arrives in OpenELIS within seconds and shows on the normal order dashboard with an **External** tag and the source "Epic, Valley Family Clinic". When the courier bag arrives, the receptionist scans the requisition barcode; the order opens in Enter Order with the patient, provider, tests, answers, insurance and diagnosis already filled. They confirm the samples and save. Nothing is typed.

When the results are released, OpenELIS sends them back to Epic as one result message per report version, with every released value coded in LOINC (Logical Observation Identifiers Names and Codes), units, reference ranges, flags and the PDF of the same report version, so the chart and the paper always match. A corrected result goes back marked as corrected. The lab's interface analyst sets up each new client by choosing the EHR profile (Epic, Oracle Health, athenahealth, eClinicalWorks, NextGen, MEDITECH), mapping the clinic's order codes to OpenELIS tests in a search-based mapping screen, and sending a test message, without code changes. When something fails, it shows on the order dashboard ("Needs attention") or in Sent Messages, with the message and the EHR's answer.

---

## Overview

The EHR Lab Interface lets OpenELIS receive laboratory orders from an EHR and return results to it, over HL7 v2 messages built on the US laboratory implementation guides (Lab US Realm: LOI for orders, LRI for results, eDOS for the test compendium). One engine serves every EHR. What differs between Epic, Oracle Health, athenahealth, eClinicalWorks, NextGen and MEDITECH is held as an **EHR profile** (data): message version, message types, where fields sit, whether a PDF is embedded, batching and acknowledgment style. Each connected client is an **EHR interface** record that names a profile, a transport and the client's codes.

It has five parts:

| Part | What it does | Where the user meets it |
|---|---|---|
| **Receive orders** | Accepts order messages, acknowledges them, stores each as an electronic order, matches patient, provider, facility and tests | Order dashboard (incoming orders), Enter Order prefilled |
| **Map** | Maps the client's order codes, question codes and facility codes to OpenELIS tests, panels, questions and organizations | Admin, EHR Interfaces, the interface's Codes section |
| **Send results** | Sends one result message per issued report version, with the version's PDF; sends cancellations and specimen rejections | Automatic; visible in Sent Messages |
| **Monitor** | Shows inbound problems on the order dashboard and outbound messages, retries and acknowledgments in Sent Messages | Order dashboard filter; Reports, Sent Messages |
| **Compendium** | Exports the lab's orderable test list in a form the EHR team can build from | Admin, EHR Interfaces, Compendium export |
| **Verify** | Records that results show correctly in each EHR, at go-live and again after changes and on a schedule (CLIA 42 CFR 493.1291(a)) | Admin, EHR Interfaces, the interface's Verification section |

### Navigation & URL

| Page | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Order dashboard (existing, gains Source filter and incoming states) | Orders & Patients, Add Order | `Home / Orders / Clinical Orders` | `/order/clinical` (existing); filters `?source=all\|local\|external&sourceId=<interfaceId>&attention=1` |
| Enter Order from an incoming order (existing step) | step within the order | `Home / Orders / Clinical Orders / Enter Order` | `/order/clinical/enter?eorder=<electronicOrderId>` (FR-B17 of Clinical Order Entry v4) |
| EHR Interfaces (new, record list) | Admin, Automation, **Interfaces**, EHR Interfaces | `Home / Admin Management / Interfaces / EHR Interfaces` | `/MasterListsPage/interfaces/ehr` |
| An EHR interface (new, record editor, type C) | sections show as children of EHR Interfaces while the record is open (AF-7) | `Home / Admin Management / Interfaces / EHR Interfaces / <name> / <section>` | `/MasterListsPage/interfaces/ehr/<id>/<section>`; sections `connection`, `profile`, `facilities`, `orderCodes`, `questions`, `results`, `verification`, `golive` |
| EHR Profiles (new, record list, read-mostly) | Admin, Automation, Interfaces, EHR Profiles | `Home / Admin Management / Interfaces / EHR Profiles` | `/MasterListsPage/interfaces/profiles` |
| Sent Messages (Result Delivery, existing spec) | Reports, Sent Messages | `Home / Reports / Sent Messages` | `/SentMessages?product=ehr_result` (new product value) |

Notes:

- **Interfaces** is a new group in the Admin **Automation** section, after External Connections. It has no route of its own (D-065). The sibling spec adds **Public Health Reporting** as its third child. This follows the admin audit's proposal to gather the lab's outside connections in one place (Admin page audit 2026-10-12, item 3); the group can later absorb Result Reporting (A-03).
- The interface record is **type C** (seven sections, AS-18). Each section saves on its own.
- Endpoint addresses and secrets live on an **External Connection** row (A-01) of a new type, referenced from the interface (AS-20: one editor per value).

### Reuse inventory (design-addendum MUST F)

| The design needs | Reuses | Checked |
|---|---|---|
| A store for each incoming order and its raw message | `ElectronicOrder` (`externalId`, `patient`, `status`, `orderTimestamp`, `data`) with `ElectronicOrderType.HL7_V2` | `dataexchange/order/valueholder/ElectronicOrder.java`, `ElectronicOrderType.java` on `1b1acbf` |
| A list where incoming orders wait and are accepted | Order dashboard `/order/clinical`: "Include external sources" toggle, purple **External** tag, **Accept** action | `components/order/OrderDashboard.jsx` lines 64, 286, 533, 645 |
| Turning an accepted order into a lab order | Enter Order prefill from an electronic order (Clinical Order Entry v4 FR-B17, OGC-1239 Part A) | Spec |
| HL7 v2 parsing and building | HAPI v2 (`hapi-base`, `hapi-structures-v251`, `hapi-hl7overhttp` 2.5.1); `OrderResponseWorker` builds ORU^R01 from an OML^O21 | `pom.xml` lines 264 to 310; `dataexchange/orderresult/OrderResponseWorker.java` |
| Endpoint, credentials, certificates | External Connection (`ExternalConnection`, basic and certificate authentication) | `externalconnections/*` |
| Outbound queue, retries, log, resend | Result Delivery foundation: persistent outbox, retry, Sent Messages (D-222) | Built on `develop` (OGC-439, #4755, 2026-10-17): `delivery` package, `DeliveryOutboxService`, `DeliveryWorker`, `DeliverySender` (email, SMS, WhatsApp), `NotificationLog.Product`, `DeliverySettings` (retry delays, hold minutes), `/SentMessages`. An HL7 sender is one more `DeliverySender`; `ehr_result` one more product |
| What to send and when | Report Print Queue issue history: report versions Partial, Final, Amended (D-223) | Built on `develop` (OGC-431, #4753, 2026-10-16): `reportqueue` package, `ReportVersion`, `ReportVersionItem`, `ReportPrintEvent` |
| PDF of a report version | Report archive (Patient Report FRS, issue history) | Spec |
| Patient match | Patient search with the possible-match check before create (Clinical Order Entry v4 v0.20) and patient identifiers | Spec; `Patient.externalId`, identifiers |
| Provider match | `Provider.npi` | `provider/valueholder/Provider.java` |
| Ordering facility match | Organizations and their identifiers table (Locations & Organizations, OGC-1363) | Built (OGC-1363) |
| Test and panel identity | Test LOINC (`Test.loinc`), panel code (D-081) | `test/valueholder/Test.java` line 68 |
| Code mapping screen | Analyzer test mapping editor pattern (code from an outside system to an OpenELIS test, with suggestions) | `analyzer/service/AnalyzerMappingEditorServiceImpl.java`; pattern reused, storage separate |
| Order questions (AOE) | Programs and questionnaires; order additional information (OGC-1144) | Programs Management (built), OGC-1144 (Backlog) |
| Insurance, diagnosis, who bills | Billing FRS order fields: Bill to, member number, diagnosis codes (ICD-10), "who bills these orders" on an external order source | Billing FRS (spec) |
| Medicare and Medicaid numbers | `Patient.medicareId`, `Patient.medicaidId` | `patient/valueholder/Patient.java` |
| Body site and laterality on the specimen | Clinical Order Entry v4 FR-N9 matching (D-079) | Spec |
| Free-text that does not map | `note` on the order | Built |
| Requisition number on an order typed at the lab | Requester's order number on the order (`Sample.referringId`, Result Delivery analyze, confirmed on `develop`) | Built |
| Critical result call record | `CriticalCallback` | `qaevent/criticalcallback/*` |
| Working days (verification schedule) | Calendar (holidays, working week) | Built (`calendarManagement`) |
| Shipping and updating the vendor profiles | Reference data packs (D-296 to D-302), not code and not a module | Spec (Reference Data as Configuration); the module system (OGC-1577, merged 2026-11-05) is for workflows, profiles are data |
| Code list and compendium files | Catalog CSV export of the configuration loader (OGC-1194) | Built |

New mechanisms: the **EHR profile** and **EHR interface** records, the **code map** per interface, and two new **product values** in the outbox. Each is listed under Dependencies.

---

## User Stories

1. As a **receptionist**, I want orders that clinics placed in their EHR to be waiting on my order dashboard, so that when the specimen arrives I scan the requisition and confirm instead of typing.
2. As an **ordering clinician** at a client clinic, I want the lab's results in my EHR inbox against my original order, coded and with the lab's PDF, so that I can act on them and trend them like any in-house result.
3. As the lab's **interface analyst**, I want to set up a new client by picking its EHR profile, mapping its order codes with search and suggestions, and sending a test message, so that onboarding a clinic takes days, not a development project.
4. As a **billing specialist**, I want insurance, guarantor and diagnosis codes from the electronic order to arrive with the order, so that claims are built from what the clinic sent.
5. As a **lab supervisor**, I want to see every order that could not be imported and every result message the EHR refused, with the reason, so that nothing silently goes missing.
6. As a **receptionist during an interface outage**, I want to type the paper requisition with its requisition number and have the electronic order join it when it arrives, so that results still file against the clinic's order.
7. As the **lab director**, I want a record that results show correctly in each client's EHR, checked again whenever the interface changes, so that I can show an inspector the lab meets CLIA's result-reporting requirement.

---

## Functional Requirements

### A. EHR profiles

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | An **EHR profile** describes how one family of EHRs speaks HL7 v2 to a lab: name, vendor, inbound order message types accepted (ORM^O01, OML^O21), HL7 versions accepted (2.3, 2.3.1, 2.4, 2.5.1), result message version and structure (ORU^R01, LRI or 2.3.1 style), acknowledgment mode (original or enhanced), whether results carry an embedded PDF and how (a separate OBR with one OBX of type ED, or an OBX of type ED in the same OBR), batch or one message at a time, field placements that differ from the standard (for example where the requisition number sits), and identifier expectations (MSH-3 to MSH-6 values agreed at build). | Profiles are data, not code paths (D-385) |
| FR-A2 | OpenELIS ships eight profiles: **Lab US Realm (LOI/LRI)** (the default), **Epic**, **Oracle Health (Cerner Millennium)**, **athenahealth**, **eClinicalWorks**, **NextGen**, **MEDITECH Expanse**, **OpenEMR**. Their starting values are in Appendix R. Each shipped profile carries "Starting values from the vendor's published specification; confirm at interface build." Shipped profiles arrive as a reference data pack (D-296), so a corrected or new vendor profile is a pack update, not a release. | The HL7 engine itself is not US-specific: other HL7 v2 EMRs can be added the same way |
| FR-A3 | Shipped profiles are read-only. **Duplicate** creates a custom profile from one, for a site variant (an Epic customer whose build puts the requisition in OBR-2 instead of ORC-2). Custom profiles are editable and can be switched off (D-002). | Same model as shipped and custom roles (Users and Roles D-203) |
| FR-A4 | A profile change takes effect on the next message. The interface record shows which profile and which profile version it uses; History records profile changes (AS-32). | |

### B. EHR interfaces (one per connected client or EHR instance)

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **EHR Interfaces** is a type B record list: name, profile, client organizations served, direction (Orders in, Results out, both), environment (Test or Production), status (Ready, Not set up, Paused, Failing), last message in, last message out, Active switch, Edit. Search by name and organization; Status filter (AS-10). | |
| FR-B2 | **Add EHR interface** opens a blank record in the editor (type C, AS-17). The sections, in order: **Connection**, **Profile and options**, **Facilities and providers**, **Order codes**, **Questions**, **Results**, **Verification**, **Test and go-live**. | |
| FR-B3 | **Connection** names the External Connection row that holds the endpoint and credentials for each direction, inbound and outbound (a new External Connection type, "HL7 interface"). Which transports OpenELIS supports, and how (for example MLLP over TCP with TLS, file exchange over SFTP, HTTPS), is the implementing engineer's choice (D-389). The research behind that choice is in Appendix R. Secrets follow AS-31. Some EHRs fix the transport on their side: OpenEMR writes orders to, and polls results from, folders on an SFTP server that the **lab** hosts (or a shared file system), so the chosen transports must include that folder exchange. | Network VPNs are outside OpenELIS |
| FR-B4 | **Profile and options** picks the profile (FR-A1) and the interface's options: **Accept orders** (on or off); **Send results** (on or off); **Send results for orders entered at the lab** for this client's facilities, with no electronic order (unsolicited results; off by default); **Embed the report PDF** (default from the profile); **Send preliminary versions** (Partial report versions; default on); **Patient identifier to send back** (the EHR's medical record number from the order; the lab's patient ID as a second identifier); **Send received status** (FR-C7; off by default); **Send results for lab-added tests** (FR-G11; on by default); **Keep SSN for billing** (FR-C4a; off by default). | |
| FR-B5 | **Facilities and providers** lists the client facilities this interface serves: each is an Organization (Locations & Organizations) with the identifier the EHR sends for it (the sending facility, MSH-4, and the ordering facility, ORC-21), added by search (D-007). Unknown facility identifiers on incoming orders are listed here for the analyst to link (FR-D4). Providers match on NPI (National Provider Identifier) and need no list. | Facility identifiers reuse the L&O identifiers table with the label "EHR facility code" |
| FR-B6 | **Environment.** An interface is in **Test** or **Production**. In Test, incoming orders are labelled "Test interface" on the dashboard, cannot be accepted into a real order, and results are sent only from orders the analyst marks as test orders. Moving to Production is a marked change (AS-29: "Orders from this interface will create real patient orders") with typed confirmation (AS-30). | |
| FR-B7 | **Pause.** A Production interface can be paused. While paused, inbound messages are still received and acknowledged and stored, but held (not shown as incoming orders), and outbound messages queue in the outbox. Resume releases both. The dashboard and Sent Messages show "Paused since {time}". | For an EHR upgrade weekend or a mapping fix |
| FR-B8 | **Status** is worked out, never typed: **Not set up** (no connection), **Ready**, **Paused**, **Failing** (three outbound attempts in a row failed, or the inbound side has refused or failed to parse three messages in a row, matching Result Delivery FR-A1). A Failing interface raises an Alert to holders of `interface:manage` (existing Alerts). | |

### C. Receiving orders

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | OpenELIS accepts **ORM^O01** (HL7 2.3, 2.3.1, 2.4) and **OML^O21** (HL7 2.5.1, LOI) order messages on an interface whose profile allows them. One message may carry one or several orders (ORC/OBR groups) for one patient. | Epic, eClinicalWorks, athenahealth, MEDITECH send ORM; LOI senders send OML |
| FR-C2 | **Store first, then acknowledge.** Every received message is written, unchanged, to an electronic order record (`ElectronicOrder.data`, type HL7_V2) before the acknowledgment is sent. A message that cannot be parsed, or comes from an unknown sender, is stored as a rejected message with the reason and answered with an application reject (AR); a message that parses but fails a business rule (no patient name, no order code) is stored and answered with an application error (AE) naming the field; everything else is answered with application accept (AA) as soon as it is stored. Mapping problems (unknown test code) never cause a reject: they make the order **Needs attention** (FR-D). | The EHR must never have to resend a message because OpenELIS could not map it |
| FR-C3 | **One order per requisition.** Orders are keyed on the interface plus the placer order number (ORC-2, or the field the profile names) plus the placer group number when present (ORC-4, the requisition that groups several orders). A repeated message with the same key and content is a duplicate: it is acknowledged and recorded on the order's history, and nothing else changes. Orders that share a placer group number on one interface become **one lab order** at Accept (one requisition, one lab number), even when the EHR sent one message per test. | athenahealth sends one test per message with a shared encounter ID (Appendix R) |
| FR-C4 | **What is kept from the message.** Patient (PID: name, date of birth, sex, address, phone, race, ethnicity, the EHR's medical record number with its assigning authority, Medicare or Medicaid number when sent); visit (PV1: patient class, attending and referring providers); ordering provider (ORC-12 or OBR-16, NPI); ordering facility (ORC-21 to ORC-23); order (placer number, group number, priority, ordered date and time, order codes, collection date and time when sent); specimen (SPM in 2.5.1, OBR-15 in earlier versions: type, source site, laterality, collection time, container, and the **EHR specimen ID** printed on the tube label when the EHR labels specimens: SPM-2 placer specimen ID, or the field the profile names); diagnosis codes (DG1, ICD-10); order questions (OBX under the OBR, AOE answers); notes (NTE); insurance (IN1, IN2), guarantor (GT1); copies to (OBR-28). | |
| FR-C4a | **Minimum necessary.** Social Security number (PID-19) and driver's licence (PID-20) are not stored and are blanked in the stored copy of the message, unless the interface option Keep SSN for billing is on. | HIPAA minimum necessary; eClinicalWorks sends SSN |
| FR-C5 | **Cancel and change.** An order control of cancel (ORC-1 CA, or OBR-25 X where the profile uses it) on an incoming order that has not been accepted marks it **Cancelled by sender**; it leaves the default dashboard view. On an order already accepted, the cancel is not applied automatically: the order shows **Sender cancelled after receipt** in Needs attention, and Reception decides (cancel the tests with the reason "Cancelled by ordering clinic", or keep them if the specimen was already tested). A change (ORC-1 XO or a resend with new content) on an incoming order replaces it, and the history shows what changed; on an accepted order it becomes a Needs attention item listing the differences. | |
| FR-C6 | **Add-on tests.** A new order message for a placer group that was already accepted (an add-on ordered after the specimen arrived) appears as an incoming order linked to the existing lab number ("Add-on to {labNo}"). Accepting it adds the tests to that order in Enter Order. | |
| FR-C7 | **Answering back.** When an incoming order is accepted, rejected or cancelled at the lab, OpenELIS can tell the EHR (an order response, ORR^O02 or ORL^O22, or a status-only result message, as the profile says; off by default). With **Send received status** on, OpenELIS also sends a status-only result message (OBR-25 I, no OBX) when the order's samples are received, so the clinician sees "In process" instead of "Ordered". | Not every EHR files these; the profile decides |
| FR-C8 | **Standing and future orders.** Each occurrence the EHR releases arrives as its own order and waits as Incoming until its specimen arrives; future-dated orders show their scheduled date on the row. OpenELIS does not expand a standing order into occurrences itself. | Epic releases standing order occurrences one by one |
| FR-C9 | **Domain.** Orders from an EHR interface are always Clinical domain orders (D-004). | |

### D. Matching and Needs attention

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | **Patient.** OpenELIS looks for the patient by the EHR's medical record number and assigning authority first. If none is found, it runs the possible-match check of Clinical Order Entry v4 (name, date of birth, sex) and shows the candidates at Accept: Reception picks one, or creates a new patient prefilled from the message. A sure match on identifier never creates a duplicate patient. The EHR's identifier is stored as a patient identifier labelled with the interface's assigning authority. | Patient merge stays a separate tool |
| FR-D2 | **Provider.** The ordering provider is matched on NPI to a Provider. If none exists, Accept creates the provider from the message (name, NPI, phone) after showing it, so that providers never need to be loaded in advance. | |
| FR-D3 | **Tests.** Each order code is mapped in this order: the interface's code map (FR-E), then a panel code (D-081) or test whose code equals it, then a test whose LOINC equals it. An order code that maps to nothing makes the order **Needs attention: unmapped test code {code} {text}** and offers **Map this code**, which opens the Order codes section with the code selected and returns to the order afterwards. | Mapping by LOINC alone is a fallback, never the only route: LOINC is often absent on orders |
| FR-D4 | **Facility.** An unknown sending or ordering facility code makes the order Needs attention with **Link facility**, which searches Organizations (D-007) and stores the code as that organization's identifier for this interface. | |
| FR-D5 | **Needs attention** is one state with a list of reasons: unmapped test code; unknown facility; patient possible match; required question missing (the test's question is required and the EHR did not answer it); specimen type not allowed for the test (Clinical Order Entry v4 container rules); sender cancelled or changed after receipt; add-on to an order that is complete. The dashboard row shows the first reason and a count ("Unmapped test code 82947, and 1 more"). | |
| FR-D6 | **Never block on surveillance or billing data.** Missing race, ethnicity, insurance or diagnosis never makes an order Needs attention and never blocks Accept. They are shown on the Enter Order summary as missing, as Billing and the sibling ELR spec require. | Follows D-211 |

### E. Code maps

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | **Order codes** lists every order code this interface has sent or the analyst has loaded: code, the EHR's text, mapped to (a test or panel, shown by name, sample type and code), times received, last received, status (Mapped, Not mapped, Ignored). Search by code and text; filter Not mapped first. | |
| FR-E2 | Mapping uses a typeahead over tests and panels (D-007). OpenELIS suggests matches from the EHR text, LOINC when sent, and the panel code; a suggestion is applied only when the analyst accepts it (as analyzer mapping does, D-348). | |
| FR-E3 | A code can map to one test or one panel. A code that the lab never performs can be marked **Refer out** (accept it and refer the test, from the Referral setup) or **Reject** (the order is refused back to the EHR with "Test not offered", FR-C7). | |
| FR-E4 | **Load codes from a file.** The analyst can load the client's order list as a CSV (code, text, optional LOINC, optional suggested OpenELIS code). Loading follows the Import Review pattern: a preview, a decision queue, nothing written until applied (AS-33). | Most EHR builds start from a spreadsheet |
| FR-E5 | **Questions** maps the EHR's order question codes (AOE) to the questions OpenELIS asks for the test (Programs questionnaires or order additional information). An answer to an unmapped question is kept as an order note with the question's text, so nothing the clinician wrote is lost. | |
| FR-E6 | **Result codes.** By default each result goes out with the test or analyte's LOINC as the identifier, and the lab's own code as the alternate. Where a client's EHR was built on its own result codes, the Results section maps OpenELIS tests or result components to the EHR's result codes, with the same search and suggestions. | |
| FR-E7 | Mapping changes are recorded in History (AS-32) and take effect for the next message. An order already received is re-mapped when the analyst presses **Map this code** from it (FR-D3). | |

### F. The order dashboard (incoming orders)

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | The order dashboard of Clinical Order Entry v4 gains a **Source** filter: All, Entered at the lab, From an external system; and, under From an external system, each active interface and the FHIR source by name. It replaces the "Include external sources" toggle and is kept in the URL (`?source=`, `?sourceId=`). | Casey 2026-11-04: incoming orders live on the normal dashboard with a filter |
| FR-F2 | An electronic order that has not been accepted shows as a dashboard row with the **External** tag (existing, purple), a status Tag **Incoming** (purple), the source ("Epic, Valley Family Clinic"), the placer order or requisition number, patient name and date of birth, test count, ordered time and age ("ordered 2 h ago"). | The lab number column is empty until Accept |
| FR-F3 | Quick filters gain **Incoming** and **Needs attention**, each with a count. Needs attention rows show their reason (FR-D5) under the patient name, in red text, with the action that fixes it (Map this code, Link facility, Choose patient). | |
| FR-F4 | The search box (Clinical Order Entry v4 FR-H2a) also matches the placer order number, requisition number, the EHR specimen ID on the tube label (FR-C4) and the EHR's medical record number, so scanning the barcode printed on the requisition finds the incoming order. A scan that finds exactly one incoming order opens it in Enter Order (FR-F5). | The existing barcode scan bar |
| FR-F5 | **Accept** opens Enter Order prefilled from the electronic order (Clinical Order Entry v4 FR-B17): patient (after FR-D1), requester, facility, tests, priority, questions, diagnosis, insurance and Bill to, notes, collection details. If the specimen has not arrived, section 6 opens with Add sample focused. Saving creates the lab order and links it to the electronic order; the row then shows the lab number and the order's progress like any other order, keeping the External tag and the source. | Accept with Needs attention reasons is allowed only for reasons that Enter Order itself resolves (patient choice); unmapped tests must be mapped or removed first |
| FR-F6 | **Reject** (row action on an incoming order) asks for a reason from a short list (Specimen not received, Duplicate order, Test not offered, Patient not ours, Other with text) and marks it **Rejected at the lab**. When the profile allows it, the EHR is told (FR-C7). Nothing is deleted (D-002). | |
| FR-F7 | **Waiting too long.** An incoming order not accepted after the interface's **specimen expected within** (days, default 7) shows a gray "Specimen not received" note; it stays until accepted, rejected or cancelled by the sender. | Clinics order ahead for future visits |
| FR-F8 | **Test interface orders** (FR-B6) show only when the Source filter selects that interface, labelled "Test interface". | |
| FR-F9 | An order's page and its history show its source, the electronic order it came from, and **View message** (the raw HL7 message as received, rendered one segment per line), for users with `eorder:view_message`. | |
| FR-F10 | **Typed during downtime.** Enter Order's requester's order number field (existing) is labelled **Requisition number** when the order's facility is served by an EHR interface, and accepts a scan. An order saved with a requisition number and a served facility is linked to that interface: its results go back with that placer number, as for an accepted electronic order, without needing the unsolicited results option. | D-396 |
| FR-F11 | **The late electronic order.** When an electronic order arrives whose interface, requisition (placer) number and patient (identifier, or name, date of birth and sex) match an order already entered at the lab, it is linked automatically: it never shows as Incoming, the lab order shows its source, and the order's history says "Linked to electronic order {placer} received {time}". Tests on the electronic order that are not on the lab order, or the other way round, make the lab order **Needs attention: differs from the electronic order** with a list of the differences; Reception adds or cancels tests from Enter Order. A number match with a different patient is never linked: it shows as Incoming with Needs attention "Requisition number already used for {labNo}, different patient". | D-396 |

### G. Sending results

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **What triggers a send.** For an order that came from an interface with Send results on, or for an order entered at the lab for a facility served by an interface with unsolicited results on (FR-B4), each **issued report version** (Partial, Final, Amended; Report Print Queue issue history) creates one result message. For an order on an interface, release issues the version on its own, after the lab-wide wait before sending a new report version (`deliveryHoldMinutes`, default 10), exactly as automatic delivery does; nobody has to print or press Send, and the interface send appears in the report's issue history. Partial versions are sent only when Send preliminary versions is on. The message carries every released result of the order at that version, not only the new ones. | D-386; follows D-223 |
| FR-G2 | **Message.** ORU^R01, HL7 2.5.1 following the LRI guide unless the profile sets otherwise. One ORC/OBR group per ordered test or panel, keyed on the placer order number the EHR sent (ORC-2, OBR-2) and the lab number as filler number (ORC-3, OBR-3). OBR-25 is the order's result status: P when some of its results are released and others are not, F when all are released, C on an amended version that changed a result. OBX per result component: value with the right data type (NM, SN, CWE coded with SNOMED CT where the test has coded results, ST, TX), UCUM units, reference range, abnormal flag (HL7 table 0078: L, H, LL, HH, A, AA, N), result status (F, C), observation and release times, the performing organization (OBX-23 to OBX-25: name, CLIA number, address and medical director), and the method where the test has one. Times: collection (OBR-7 and SPM-17), received (SPM-18; OBR-14 in 2.3.x profiles), result reported (OBR-22), observation (OBX-14), analysis (OBX-19). Notes go in NTE. Field content is escaped (`\F\`, `\S\`, `\T\`, `\R\`, `\E\`) and line breaks are sent as `\.br\` or repeated NTE lines as the profile says. | |
| FR-G3 | **Embedded PDF.** When Embed the report PDF is on, the message carries the PDF of the same report version, base64 encoded in an OBX of type ED, placed as the profile says (FR-A1). The PDF is the one the lab archived for that version, unprotected (D-387). | |
| FR-G4 | **Released only.** Nothing unvalidated leaves the lab (D-230). Tests that are In lab only (D-184, D-204) or QC never appear. | |
| FR-G5 | **Corrections.** An Amended version marks each changed result C and keeps the unchanged ones F, with the correction reason in NTE when the lab recorded one. | |
| FR-G6 | **Cancelled tests and rejected specimens.** A test cancelled at the lab, or a specimen rejected (non-conformity with rejection), sends a result message for that test with OBR-25 X and an NTE giving the reason the lab recorded ("Specimen hemolyzed; please recollect"), so the clinician's open order closes with a reason. | athenahealth processes specimen-rejected messages (Appendix R) |
| FR-G7 | **Referred tests.** A result from a reference lab carries that lab's name, CLIA number and address in OBX-23 to OBX-25 when the referral record holds them; otherwise this lab's, with an NTE "Performed by {lab}". | |
| FR-G8 | **Microbiology.** Culture and susceptibility results follow the LRI parent and child structure (OBR-26 and OBR-29 link the susceptibility OBR to the culture's organism OBX). Outgoing micro results follow Partial, Final and Amended as D-213 requires. | Coordinate with AMR v3 |
| FR-G9 | **Through the outbox.** Every result message is written to the Result Delivery persistent outbox as product **EHR results** (`ehr_result`) before sending, retried on the same schedule (FR-A8 of Result Delivery), and listed in Sent Messages. An application accept (AA or CA) from the EHR marks it **Sent**; an application error or reject (AE, AR, CE, CR) marks it **Failed** with the EHR's error text, and it is not retried automatically. | D-388 |
| FR-G10 | **One at a time per order.** Messages for one order go out in version order; a later version waits while an earlier one is still Queued for that order. | EHRs file versions in arrival order |
| FR-G11 | **Lab-added and reflex tests.** A test the lab added to the order (a reflex rule, a technician's add-on, a confirmation test) goes back as its own OBR inside the original requisition: ORC-2 and OBR-2 carry the original placer number, OBR-3 the lab's filler number for the added test, OBR-11 G (generated order), and OBR-26 and OBR-29 link it to the parent result and order (LRI parent and child). It is sent when Send results for lab-added tests is on (default). | D-395 |
| FR-G12 | **Substituted tests.** When the lab performs a different test than the one ordered (a retired test replaced, or a method change), the result goes back under the ordered test's placer number with the performed test's LOINC in OBX-3 and an NTE "Ordered {test}; performed {test}". | |
| FR-G13 | **Critical results.** A result with a critical flag (LL, HH, AA) carries the critical callback record as an NTE: "Critical value called to {name} at {time} by {user}; read back" (existing `CriticalCallback`). If the call is not yet recorded when the version is sent, the NTE says "Critical value: notification in progress", and the next version carries the record. | CLIA expects documented notification; EHRs show NTE with the result |
| FR-G14 | **Narrative results.** Pathology, cytology and immunohistochemistry reports, microbiology comments and long interpretive text go as FT (formatted text) or TX, split at the profile's maximum line length, with the PDF as well when Embed the report PDF is on. A profile can set a maximum message size; a PDF that would exceed it is left out and the message says so in an NTE, and the version still goes by Result Delivery to the facility. | Epic and others file long text as FT |

### H. Monitoring

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | **Sent Messages** (Result Delivery) gains the product **EHR results**, filterable, with the interface as the recipient. A row's detail shows the HL7 message as sent (segment per line, base64 PDF shortened to "PDF, 214 KB"), each attempt, and the acknowledgment received. **Resend** (existing `delivery:resend`) queues the same version again. | |
| FR-H2 | Inbound problems never go to Sent Messages. They live on the order dashboard: rejected messages (FR-C2) show under the Needs attention filter as **Could not read message** rows with the reason and View message, and can be **Dismissed** with a reason (kept, filtered out by default). | |
| FR-H3 | The interface record's **Test and go-live** section shows counts for the last 7 days (orders received, accepted, needing attention, rejected; results sent, failed) with links to the filtered dashboard and Sent Messages. | |
| FR-H4 | **Quiet interface.** Each interface has **Expect orders between** (days and hours, default weekdays 07:00 to 19:00 in the laboratory time zone, Calendar holidays excluded) and **Alert after no orders for** (minutes, default 120). When no order arrives in that window for that long, an Alert goes to holders of `interface:manage`. | The most common interface failure is silence |
| FR-H5 | **No acknowledgment.** A result message the transport delivered but the EHR has not acknowledged within the profile's acknowledgment timeout (default 5 minutes) is marked **Sent, not acknowledged** in Sent Messages and is retried on the Result Delivery schedule; three in a row set the interface Failing (FR-B8). | |
| FR-H6 | Every View message (FR-F9, FR-H1) is recorded in the audit trail with user and time, because the raw message holds protected health information. | HIPAA access logging |

### I. Test and go-live

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | **Send test result** sends a result message built from a test order (FR-B6) to the outbound connection and shows the acknowledgment or error in place. | |
| FR-I2 | **Paste a message** lets the analyst paste an order message and see how OpenELIS would read it: each segment, what it maps to, and the Needs attention reasons, without storing anything. | For build meetings with the EHR team |
| FR-I3 | **Go-live checklist** (read-only, computed): connection set; profile chosen; every order code received in Test mapped or marked Ignored; at least one test order accepted; at least one test result acknowledged; facilities linked; every test mapped on this interface has a LOINC on each reported result component (LRI expects LOINC; the rest go with the local code only); trading-partner or business associate agreement on file (a tick with date, recorded); a Passed verification (FR-L). Moving to Production (FR-B6) shows any unmet item and allows proceeding. | |

### J. Compendium

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | **Compendium export** on EHR Interfaces downloads the lab's orderable tests and panels as a CSV the EHR team can build from: order code (panel code or test code), name, LOINC, sample type and container, minimum volume, storage and transport, questions asked at order (code, text, answer type, allowed answers, required), turnaround, CPT code where the Billing section holds one, and active. It reuses the catalog CSV export (OGC-1194) columns where they exist. | eDOS (the HL7 compendium message) is Later |
| FR-J2 | The export can be limited to the tests one interface has mapped (for a client's build) or the whole active catalog. | |
| FR-J3 | **What changed.** The export can be limited to tests added, changed (name, specimen, container, questions, LOINC) or deactivated since a chosen date or the last export, so the lab can send clients a compendium update. Each export is kept with its date and who made it. | |

### K. States and errors

| ID | Requirement |
|---|---|
| FR-K1 | Every list loads with a skeleton, names a load failure and offers Retry (AS-34). |
| FR-K2 | A message received while OpenELIS is starting or the database is unavailable is not acknowledged, so the sender retries; OpenELIS never acknowledges a message it has not stored. |
| FR-K3 | Order and result messages are processed in the order received per interface. |
| FR-K4 | All times in messages are the laboratory time zone with offset (D-075). |
| FR-K5 | Messages use the character encoding the profile sets (MSH-18), default UTF-8; names with accents survive the round trip. |

---

### L. Verification (CLIA 42 CFR 493.1291(a))

The lab must have a system that ensures results reach the final report destination accurately, interfaced or not. For an EHR interface the destination is the EHR, so the lab checks, and keeps evidence, that what it released is what the clinician sees.

| ID | Requirement | Notes |
|---|---|---|
| FR-L1 | The interface's **Verification** section lists verifications: date, verified by, reason (Go-live, Profile changed, Mapping changed, Scheduled, Other), the orders checked, outcome (Passed, Failed), evidence (uploads such as screenshots of the EHR result view, or a link), and notes. Records are never deleted (D-002). | D-397 |
| FR-L2 | **Record a verification** picks sample orders sent through this interface (suggested: one per lab unit and one each with a numeric, coded, narrative, critical, corrected and PDF result) and shows, for each, what OpenELIS sent: result, units, range, flag, status, notes, the PDF. The verifier ticks each as **Matches the EHR** or notes a difference, and attaches evidence. | |
| FR-L3 | **Re-verification due.** A change to the interface's profile, its result code map (FR-E6), the profile options that change message content, or an upgrade that changes the result message builder, marks the interface **Verification due** with the reason. A scheduled re-check is due after the interface's **Re-verify every** (months, default 12). Due shows on the interface list and raises an Alert to holders of `interface_check:record`; it never stops messages. | |
| FR-L4 | Moving an interface to Production (FR-B6) shows whether a Passed verification exists; proceeding without one is allowed and recorded. | |
| FR-L5 | Each interface's latest verification (date, outcome, next due) is available to Accreditation Readiness as evidence for its CLIA item on result reporting. | Coordinate with the Accreditation Readiness FRS |
### M. Non-functional

| ID | Requirement |
|---|---|
| NFR-1 | **Volume.** One interface handles at least 5,000 orders and 15,000 result messages a day, with bursts of 10 messages a second, on the reference server, without slowing order entry or results entry. |
| NFR-2 | **Acknowledgment time.** 95% of order messages are acknowledged within 2 seconds of receipt; storing comes before acknowledging (FR-C2). |
| NFR-3 | **Result latency.** A result message leaves within 1 minute after its report version is issued, when the connection is up. |
| NFR-4 | **Retention.** Received and sent messages are kept as part of the order's record for as long as the order is kept; they are never purged on their own (D-002). |
| NFR-5 | **Security.** Messages travel only over encrypted channels or inside a VPN the lab manages; secrets follow AS-31; raw messages are visible only with `eorder:view_message` and every view is logged (FR-H6). |
| NFR-6 | **Restart safety.** No message is lost or sent twice for a different version because of a restart; duplicates of the same version are possible and are acknowledged as duplicates by the receiver (at least once, as Result Delivery FR-A7). |
## Information & Data

Specs name the information; storage shape is the engineer's call.

### Reused as is or widened

| Information | Source |
|---|---|
| Incoming order and raw message | `ElectronicOrder` (type HL7_V2), widened with: interface, placer order number, placer group number, state (Incoming, Needs attention with reasons, Accepted, Rejected at the lab, Cancelled by sender, Could not read), linked lab order |
| Lab order, tests, samples | Sample, Analysis, SampleItem (Clinical Order Entry v4) |
| Patient, identifiers, Medicare and Medicaid numbers, race, ethnicity, address, phone | Patient, Person, patient identifiers |
| Provider | Provider (`npi`) |
| Ordering facility and its codes | Organization, identifiers table (L&O) |
| Tests, panels, LOINC, panel code | Test, Panel |
| Order questions and answers | Programs questionnaires; order additional information (OGC-1144) |
| Insurance, Bill to, diagnosis codes | Billing FRS order fields |
| Report versions and archived PDFs | Report Print Queue issue history, report archive |
| Outbound message, attempts, acknowledgment | Result Delivery outbox and Sent Messages, widened with product `ehr_result`, the HL7 payload and the acknowledgment |
| Endpoint and secrets | External Connection, new type "HL7 interface" |
| History | Audit trail (AS-32) |

### New (declared in Dependencies)

- **EHR profile:** name, vendor, shipped or custom, version, inbound message types and versions, result message version and structure, acknowledgment mode, PDF placement, batching, field placement overrides, identifier expectations, active.
- **EHR interface:** name, profile, inbound and outbound External Connections, accept orders, send results, unsolicited results, embed PDF, send preliminary, patient identifier to send back, specimen expected within (days), assigning authority for the EHR's patient identifiers, environment (Test, Production), paused since, active.
- **Code map entry:** interface, kind (order code, question code, result code), outside code, outside text, OpenELIS target (test, panel, question, result component), status (Mapped, Not mapped, Ignored, Refer out, Reject), times received, last received, changed by and when.
- **Guarantor** on the order (from GT1): name, relationship, address, phone. Not in the Billing FRS today; confirm with Billing (Open Question 3).
- **EHR specimen ID** on the sample (the EHR's tube label number), searchable.
- **Link** between a lab order and the electronic order or orders it came from or was joined to (FR-F11), with how it was linked (accepted, linked automatically) and when.
- **Interface options added in v0.2:** send received status, send results for lab-added tests, keep SSN for billing, expect orders between, alert after no orders for, acknowledgment timeout (on the profile), maximum message size (on the profile), re-verify every (months), trading-partner agreement on file (date, by).
- **Verification record:** interface, date, verified by, reason, orders checked with each outcome, outcome, evidence (uploads, links), notes; derived Verification due with its reason.
- **Compendium export record:** date, by, scope (all, one interface, changed since).

---

## Access

**Who, in user terms**

- **Reception** sees incoming orders on the dashboard (as it sees orders today), accepts them into Enter Order, rejects them with a reason, and resolves Needs attention items that Enter Order resolves (patient choice, provider creation). Reception cannot map codes.
- The lab's **interface analyst** (usually a lab administrator or an IT person) sets up interfaces and profiles, maps codes, links facilities, runs tests and moves an interface to Production. They also see raw messages.
- **Supervisors and billing staff** can see raw messages (View message) and the interface counts.
- **Results** are sent by the system; anyone with Sent Messages access sees them; resending needs the existing resend privilege.
- A user without a privilege does not see the matching control: no Map this code link, no Edit on interfaces, no View message.

**Nominated privileges**

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| See incoming orders on the dashboard; accept one into Enter Order | existing order create privilege (`orders` category; confirm exact code in #3443) | Orders, samples and patients | As today |
| Reject an incoming order; dismiss a message that could not be read | **NEW** `eorder:reject` | Orders, samples and patients | Roles holding the order create privilege |
| See raw HL7 messages and interface counts | **NEW** `eorder:view_message` | Orders, samples and patients | Roles holding the order create privilege, `report:run` or `extconnection` manage |
| Map order, question and result codes; link facility codes | **NEW** `interface_mapping:manage` | Test catalog and reference data | Roles holding the test catalog manage privilege (`test` category) |
| Add and edit EHR interfaces and custom profiles; pause and resume; move to Production; run tests; export the compendium | **NEW** `interface:manage` | Administration | Roles holding the `extconnection` manage privilege |
| See EHR result messages in Sent Messages; resend one | `delivery:view`, `delivery:resend` (Result Delivery, NEW there) | Reports | As Result Delivery |
| Record an interface verification; attach evidence | **NEW** `interface_check:record` | Quality | Roles holding `interface:manage` or the results validation privilege (`results` category) |
| Link or unlink a lab order and an electronic order by hand (FR-F11 differences) | existing order edit privilege (`orders` category) | Orders, samples and patients | As today |

NEW codes: `eorder:reject`, `eorder:view_message`, `interface_mapping:manage`, `interface:manage`, `interface_check:record`. Users and Roles Appendix A gains four categories: `eorder` (Orders, samples and patients), `interface_mapping` (Test catalog and reference data), `interface_check` (Quality) and `interface` (Administration); N-UR-6's test must cover them. `interface:manage` is placed in Administration on purpose: it can point the lab's patient data at an outside system. Until PR #3443 merges, `interface:manage` and `interface_mapping:manage` stand on the Admin role, `eorder:reject` and `eorder:view_message` on the Reception role, `interface_check:record` on the Admin and Validation roles.

---

## Localization

Keys follow Constitution VII (Key Reuse and Hygiene). REUSE keys must be confirmed with `npm run i18n:find` before build; NEW keys are domain-namespaced. French is in the definition of done.

| Key | English | Context | Status |
|---|---|---|---|
| `sidenav.label.admin.interfaces` | Interfaces | Admin sidebar group | NEW |
| `sidenav.label.admin.interfaces.ehr` | EHR Interfaces | Sidebar child, page title | NEW |
| `sidenav.label.admin.interfaces.profiles` | EHR Profiles | Sidebar child, page title | NEW |
| `admin.interfaces.ehr.description` | Connections that receive orders from clinics' electronic health records and send results back. | Page header | NEW |
| `admin.interfaces.ehr.add` | Add EHR interface | Primary button | NEW |
| `admin.interfaces.ehr.col.profile` | Profile | Column | NEW |
| `admin.interfaces.ehr.col.clients` | Clients | Column | NEW |
| `admin.interfaces.ehr.col.direction` | Direction | Column | NEW |
| `admin.interfaces.ehr.direction.both` | Orders in, results out | Cell | NEW |
| `admin.interfaces.ehr.direction.ordersIn` | Orders in | Cell | NEW |
| `admin.interfaces.ehr.direction.resultsOut` | Results out | Cell | NEW |
| `admin.interfaces.ehr.col.environment` | Environment | Column | NEW |
| `admin.interfaces.ehr.env.test` | Test | Tag | NEW |
| `admin.interfaces.ehr.env.production` | Production | Tag | NEW |
| `admin.interfaces.ehr.col.lastIn` | Last order received | Column | NEW |
| `admin.interfaces.ehr.col.lastOut` | Last result sent | Column | NEW |
| `admin.interfaces.ehr.status.ready` | Ready | Tag | NEW (or reuse `admin.notifications.channels.status.ready` if shared) |
| `admin.interfaces.ehr.status.notSetUp` | Not set up | Tag | NEW (same note) |
| `admin.interfaces.ehr.status.paused` | Paused | Tag | NEW |
| `admin.interfaces.ehr.status.failing` | Failing | Tag | NEW (same note) |
| `admin.interfaces.ehr.section.connection` | Connection | Section | NEW |
| `admin.interfaces.ehr.section.profile` | Profile and options | Section | NEW |
| `admin.interfaces.ehr.section.facilities` | Facilities and providers | Section | NEW |
| `admin.interfaces.ehr.section.orderCodes` | Order codes | Section | NEW |
| `admin.interfaces.ehr.section.questions` | Questions | Section | NEW |
| `admin.interfaces.ehr.section.results` | Results | Section | NEW |
| `admin.interfaces.ehr.section.golive` | Test and go-live | Section | NEW |
| `admin.interfaces.ehr.opt.acceptOrders` | Accept orders | Toggle | NEW |
| `admin.interfaces.ehr.opt.sendResults` | Send results | Toggle | NEW |
| `admin.interfaces.ehr.opt.unsolicited` | Send results for orders entered at the lab | Toggle | NEW |
| `admin.interfaces.ehr.opt.embedPdf` | Embed the report PDF | Toggle | NEW |
| `admin.interfaces.ehr.opt.preliminary` | Send preliminary (partial) report versions | Toggle | NEW |
| `admin.interfaces.ehr.opt.expectedDays` | Specimen expected within (days) | Number | NEW |
| `admin.interfaces.ehr.production.marking` | Orders from this interface will create real patient orders. | AS-29 marking | NEW |
| `admin.interfaces.ehr.pause` | Pause | Button | NEW |
| `admin.interfaces.ehr.resume` | Resume | Button | NEW |
| `admin.interfaces.ehr.pausedSince` | Paused since {time} | Status line | NEW |
| `admin.interfaces.codes.col.code` | EHR code | Column | NEW |
| `admin.interfaces.codes.col.text` | EHR text | Column | NEW |
| `admin.interfaces.codes.col.mappedTo` | Mapped to | Column | NEW |
| `admin.interfaces.codes.col.received` | Times received | Column | NEW |
| `admin.interfaces.codes.status.mapped` | Mapped | Tag | NEW |
| `admin.interfaces.codes.status.notMapped` | Not mapped | Tag | NEW |
| `admin.interfaces.codes.status.ignored` | Ignored | Tag | NEW |
| `admin.interfaces.codes.status.referOut` | Refer out | Tag | NEW |
| `admin.interfaces.codes.status.reject` | Reject (not offered) | Tag | NEW |
| `admin.interfaces.codes.suggest` | Suggested: {name} | Suggestion | NEW |
| `admin.interfaces.codes.accept` | Use suggestion | Button | NEW |
| `admin.interfaces.codes.load` | Load codes from a file | Button | NEW |
| `admin.interfaces.golive.sendTest` | Send test result | Button | NEW |
| `admin.interfaces.golive.paste` | Paste a message | Button | NEW |
| `admin.interfaces.golive.checklist` | Go-live checklist | Heading | NEW |
| `admin.interfaces.profile.shippedNote` | Starting values from the vendor's published specification; confirm at interface build. | Profile note | NEW |
| `admin.interfaces.compendium.export` | Export compendium | Button | NEW |
| `order.dashboard.filter.source` | Source | Filter | NEW |
| `order.dashboard.source.all` | All | Option | REUSE `common.all` |
| `order.dashboard.source.local` | Entered at the lab | Option | NEW |
| `order.dashboard.source.external` | From an external system | Option | NEW |
| `order.external` | External | Tag | REUSE (on `develop`) |
| `order.accept` | Accept | Row action | REUSE (on `develop`) |
| `order.dashboard.status.incoming` | Incoming | Status tag | NEW |
| `order.dashboard.filter.incoming` | Incoming | Quick filter | NEW |
| `order.dashboard.filter.attention` | Needs attention | Quick filter | NEW |
| `order.incoming.reason.unmappedCode` | Unmapped test code {code} {text} | Reason | NEW |
| `order.incoming.reason.unknownFacility` | Unknown facility {code} | Reason | NEW |
| `order.incoming.reason.possibleMatch` | Choose the patient: {n} possible matches | Reason | NEW |
| `order.incoming.reason.questionMissing` | Required answer missing: {question} | Reason | NEW |
| `order.incoming.reason.specimenNotAllowed` | {sampleType} is not accepted for {test} | Reason | NEW |
| `order.incoming.reason.cancelledAfter` | Sender cancelled after receipt | Reason | NEW |
| `order.incoming.reason.changedAfter` | Sender changed the order after receipt | Reason | NEW |
| `order.incoming.reason.unreadable` | Could not read message: {error} | Reason | NEW |
| `order.incoming.moreReasons` | and {n} more | Reason suffix | NEW |
| `order.incoming.mapCode` | Map this code | Action | NEW |
| `order.incoming.linkFacility` | Link facility | Action | NEW |
| `order.incoming.reject` | Reject | Row action | NEW |
| `order.incoming.reject.reason.notReceived` | Specimen not received | Reason option | NEW |
| `order.incoming.reject.reason.duplicate` | Duplicate order | Reason option | NEW |
| `order.incoming.reject.reason.notOffered` | Test not offered | Reason option | NEW |
| `order.incoming.reject.reason.notOurs` | Patient not ours | Reason option | NEW |
| `common.other` | Other | Reason option | REUSE (verify) |
| `order.incoming.rejectedAtLab` | Rejected at the lab | Status | NEW |
| `order.incoming.cancelledBySender` | Cancelled by sender | Status | NEW |
| `order.incoming.addOn` | Add-on to {labNo} | Row note | NEW |
| `order.incoming.notReceived` | Specimen not received | Row note | NEW |
| `order.incoming.testInterface` | Test interface | Row tag | NEW |
| `order.incoming.viewMessage` | View message | Action | NEW |
| `delivery.product.ehrResult` | EHR results | Sent Messages product | NEW (follows Result Delivery's product keys) |
| `delivery.status.notAcknowledged` | Sent, not acknowledged | Sent Messages status | NEW |
| `admin.interfaces.ehr.section.verification` | Verification | Section | NEW |
| `admin.interfaces.ehr.opt.receivedStatus` | Send received status | Toggle | NEW |
| `admin.interfaces.ehr.opt.addedTests` | Send results for lab-added tests | Toggle | NEW |
| `admin.interfaces.ehr.opt.keepSsn` | Keep SSN for billing | Toggle | NEW |
| `admin.interfaces.ehr.opt.expectOrders` | Expect orders between | Field | NEW |
| `admin.interfaces.ehr.opt.quietAlert` | Alert after no orders for (minutes) | Field | NEW |
| `admin.interfaces.ehr.opt.reverify` | Re-verify every (months) | Field | NEW |
| `admin.interfaces.ehr.opt.agreement` | Trading-partner agreement on file | Checkbox | NEW |
| `admin.interfaces.verify.record` | Record a verification | Button | NEW |
| `admin.interfaces.verify.reason.golive` | Go-live | Option | NEW |
| `admin.interfaces.verify.reason.profile` | Profile changed | Option | NEW |
| `admin.interfaces.verify.reason.mapping` | Mapping changed | Option | NEW |
| `admin.interfaces.verify.reason.scheduled` | Scheduled | Option | NEW |
| `admin.interfaces.verify.matches` | Matches the EHR | Checkbox | NEW |
| `admin.interfaces.verify.passed` | Passed | Tag | NEW |
| `admin.interfaces.verify.failed` | Failed | Tag | NEW |
| `admin.interfaces.verify.due` | Verification due: {reason} | Tag and alert | NEW |
| `admin.interfaces.compendium.changedSince` | Only tests changed since {date} | Option | NEW |
| `order.requisitionNumber` | Requisition number | Enter Order label when the facility has an interface | NEW |
| `order.incoming.reason.differs` | Differs from the electronic order: {differences} | Reason | NEW |
| `order.incoming.reason.numberUsed` | Requisition number already used for {labNo}, different patient | Reason | NEW |
| `order.incoming.linkedTo` | Linked to electronic order {placer} received {time} | History line | NEW |
| `order.incoming.scheduledFor` | Scheduled for {date} | Row note | NEW |
| `order.ehrSpecimenId` | EHR specimen ID | Field and search | NEW |

---

## Dependencies

| # | What | Needed by | State |
|---|---|---|---|
| 1 | **Clinical Order Entry v4**: order dashboard (section H), Enter Order prefill from an electronic order (FR-B17, OGC-1239 Part A), possible-match check | FR-D1, FR-F | Merged to `develop` 2026-10-01 (OGC-1266, follow-ups through 2026-10-20); FR-B17 prefill to confirm |
| 2 | **Result Delivery foundation**: persistent outbox, retry, Sent Messages, products | FR-G9, FR-H1 | Built (OGC-439, merged 2026-10-17); add the product and the HL7 sender |
| 3 | **Report Print Queue issue history** and report archive: issued versions Partial, Final, Amended, with their PDFs | FR-G1, FR-G3 | Built (OGC-431 V1, merged 2026-10-16); confirm automatic issue on release |
| 4 | **Billing**: order Bill to, member number, diagnosis codes, who bills external orders | FR-C4, FR-F5 | Specced |
| 5 | **Order questions**: Programs questionnaires on orders, or order additional information (OGC-1144) | FR-C4, FR-E5 | Programs built; OGC-1144 Backlog |
| 6 | **Locations & Organizations identifiers** for EHR facility codes | FR-B5, FR-D4 | Built (OGC-1363) |
| 7 | **PR #3443** privilege catalogue | Access | In review |
| 8 | **New data**: EHR profile, EHR interface, code map entry, guarantor (Information & Data); `ElectronicOrder` widened; External Connection type "HL7 interface"; outbox product `ehr_result` | All | NEW |
| 9 | **Transport listeners and senders** chosen by engineering (D-389); the analyzer MLLP listener design (OGC-325) is a candidate to share | FR-B3, FR-C2 | Engineering |
| 10 | **Patient identifier with assigning authority** (store the EHR's MRN per interface) | FR-D1 | Confirm the patient identifiers model holds an assigning authority |
| 11 | **Test catalog CPT code** for the compendium | FR-J1 | Billing section of the test (Billing FRS) |
| 12 | **Requester's order number** shown and scannable on Enter Order as Requisition number (exists as `Sample.referringId`) | FR-F10, FR-F11 | Built field; Clinical Order Entry v4 owns the label |
| 13 | **Reflex and add-on tests recorded as added by the lab, with their parent result** | FR-G11 | Reflex engine records the trigger (built); confirm the parent result is kept on the analysis |
| 14 | **Accreditation Readiness** CLIA item reads the latest verification | FR-L5 | In design (clarify brief 2026-11-05) |
| 15 | **Reference data pack** format for shipped profiles | FR-A2 | Specced (Reference Data as Configuration) |
| 16 | **Calendar** working week and holidays for the quiet-interface window | FR-H4 | Built |

---

## Decisions (proposed)

| ID | Decision | Why | Scope |
|---|---|---|---|
| D-384 | **Incoming electronic orders, HL7 and FHIR, live on the normal order dashboard** as Incoming rows with the External tag, a Source filter and a Needs attention filter; Accept opens Enter Order prefilled. No separate incoming-orders page. Delivers OGC-1073 | Casey 2026-11-04; one list for reception, as the dashboard already shows External and Accept | FEATURE |
| D-385 | **One HL7 v2 engine built on the Lab US Realm guides (LOI, LRI) with per-EHR profiles held as data**; vendor differences never become code paths | Each new client must be configuration, not development | FEATURE |
| D-386 | **Results go to the EHR per issued report version** (Partial, Final, Amended), each message carrying every released result and that version's PDF | The EHR and the paper report always match; follows D-223 | FEATURE |
| D-387 | **D-224 applies to email, SMS and WhatsApp.** A PDF embedded in an HL7 result to a contracted EHR interface is sent unprotected | An EHR cannot open a protected PDF; the interface is a point-to-point channel under a trading-partner agreement | FEATURE (amends D-224's reach) |
| D-388 | **Outbound HL7 messages (EHR results, and public health reports in the sibling spec) go through the Result Delivery outbox and appear in Sent Messages** with their acknowledgment. Inbound problems show on the order dashboard | Extends D-222: no feature adds its own sender or log | FEATURE |
| D-389 | **Transport is the engineer's choice.** The spec records the transports US EHRs publish (Appendix R) but does not mandate MLLP, file exchange or HTTPS | Casey 2026-11-04 | FEATURE |
| D-395 | **Lab-added and reflex tests go back to the EHR inside the original requisition**, as generated child orders linked to their parent (LRI), on by default per interface | Clinicians must see a reflex HCV RNA or a susceptibility in the chart, filed with the order that caused it | FEATURE |
| D-396 | **An order typed during an outage carries the requisition number, and the late electronic order joins it automatically** when interface, number and patient match; any difference is a Needs attention item, never a silent merge | Downtime is routine; results must still file against the clinic's order | FEATURE |
| D-397 | **Each EHR interface keeps a verification record** (go-live, after changes, on a schedule) with evidence, which feeds Accreditation Readiness; a due verification never stops messages | CLIA 42 CFR 493.1291(a) makes the lab answer for results arriving accurately in the EHR | FEATURE |

---

## Open Questions

1. **Order response messages.** Which EHRs actually file ORR^O02 or ORL^O22 from a reference lab? Default off (FR-C7); confirm with SolAura's first Epic client.
2. **Epic Aura.** Epic's Aura network lets a lab connect once to many Epic health systems. Is joining Aura a SolAura goal? It changes onboarding (one connection, Epic-normalized compendium) but not this engine. Out of scope for now.
3. **Guarantor.** The Billing FRS has no guarantor. Add it there (preferred), or keep it on the electronic order only?
4. **ABN (Advance Beneficiary Notice).** US billing handoff says capture ABN only. Do EHRs send an ABN indicator on the order, and where? Confirm on the first build.
5. **Copies to.** OBR-28 copy-to providers: should results also go to them through this interface (same EHR) or through Result Delivery?
6. **Confidential results for minors.** California lets minors consent to some tests (for example sexually transmitted infections); some EHRs hide such results from proxy portal access when the order or result is marked confidential. HL7 v2.5.1 has no standard field for this in ORU^R01. Does SolAura's first Epic client need a confidentiality marker, and where does their build expect it?
7. **First client's details.** Which EHR, which version, how many order codes, and who builds the interface on their side (the health system's Epic team, an interface engine vendor, or Epic Aura)? This sets the first profile check and the go-live plan.

---

## Acceptance Criteria

1. With the Epic profile, an ORM^O01 for two tests from Valley Family Clinic is acknowledged AA within 2 seconds of receipt and shows on `/order/clinical?source=external` as one Incoming row with the External tag and "Epic, Valley Family Clinic".
2. Sending the same message twice creates one incoming order; its history shows "Duplicate received".
3. A message with an unknown order code is acknowledged AA, shows Needs attention "Unmapped test code 82947 Glucose, serum", and Map this code opens the Order codes section with that code selected; after mapping, the order loses the reason without the clinic resending.
4. A message that is not HL7 is stored, answered AR, and shows under Needs attention as "Could not read message" with View message.
5. Scanning the requisition barcode on the dashboard opens that order in Enter Order with patient, provider, facility, tests, answers, diagnosis codes, insurance and notes filled.
6. A patient whose EHR medical record number is already on file is matched without a prompt; a patient matching only on name, date of birth and sex is offered as a possible match and never created twice.
7. An ordering provider whose NPI is not on file is created at Accept with the name and NPI from the message.
8. A cancel for an incoming order removes it from the default view as Cancelled by sender; a cancel for an accepted order shows Sender cancelled after receipt and changes nothing until Reception acts.
9. Releasing the order's first result with Send preliminary on queues one ORU^R01 with OBR-25 P and that result; releasing the rest queues a second message with OBR-25 F and all results; both appear in Sent Messages under EHR results in that order.
10. Each OBX carries LOINC, the value with the right data type, UCUM units, the reference range, the abnormal flag, the result status and the performing lab's CLIA number.
11. With Embed the report PDF on, the message carries the PDF of the same report version, and it opens unprotected.
12. Amending one result sends a message where that result is C, the others F, and the correction reason in NTE.
13. Rejecting a specimen for hemolysis sends OBR-25 X with the reason in NTE.
14. An EHR answer AE marks the message Failed with the EHR's text; Resend queues it again.
15. An In lab only test and a QC result never appear in any result message.
16. With unsolicited results on, an order entered at the lab for Valley Family Clinic sends results to that clinic's interface; with it off, nothing is sent.
17. A Test interface's orders show only with that source selected, cannot be accepted into a real order, and moving the interface to Production asks for its name to be typed.
18. Pausing an interface keeps acknowledging and storing orders without showing them, queues results without sending them, and Resume releases both in order.
19. Duplicating the Epic profile and moving the requisition field changes how the next message is read, with no code change.
20. A user without `interface_mapping:manage` sees Needs attention reasons but no Map this code; a user without `eorder:view_message` sees no View message.
21. With the interface in French, no English text remains on the dashboard additions or the interface pages.
22. A reflex HCV RNA added after a reactive HCV antibody goes back inside the original requisition as an OBR with OBR-11 G, linked to the antibody result by OBR-26 and OBR-29.
23. An order typed during an outage with requisition REQ-90011 is joined automatically when the electronic order REQ-90011 for the same patient arrives; it never shows as Incoming. The same number for a different patient shows Needs attention.
24. Scanning the EHR's tube label finds the incoming order by its EHR specimen ID.
25. Releasing results on an interface order sends the result message 10 minutes later (the default wait) without anyone printing or pressing Send, and the send shows in the report's issue history.
26. A critical potassium sends an NTE naming who was called and when; a result sent before the call is recorded says "notification in progress".
27. A cytology report goes as FT text with line breaks preserved and the PDF.
28. No order for two working hours on a weekday raises a quiet-interface Alert; a Saturday or a Calendar holiday does not.
29. Changing the interface's result code map marks it Verification due; recording a Passed verification with two screenshots clears it; the record cannot be deleted.
30. An SSN sent in PID-19 is not stored and is blanked in View message unless Keep SSN for billing is on.
31. 5,000 orders in a day on one interface are acknowledged within 2 seconds at the 95th percentile on the reference server.
32. With an OpenEMR Docker instance whose procedure provider points at the lab's SFTP folders, an order placed and transmitted in OpenEMR shows as Incoming; after release, the result imports in OpenEMR's Electronic Reports against the same order, with the PDF attached. This runs as an automated end-to-end test.

---

## Out of Scope

- FHIR lab ordering from US EHRs (no US EHR sends lab orders to outside labs over FHIR today; the FHIR intake from OpenMRS is unchanged).
- Joining Epic Aura (Open Question 2).
- eDOS compendium messages (CSV export instead, FR-J1).
- A native claims engine (US billing handoff: DFT^P03 and FHIR ChargeItem out of the Billing work).
- Electronic case reporting (eCR), which the EHR sends.
- Patient portal and provider portal (SolAura scope, separate specs).
- Analyzer interfaces (OGC-325 family).
- ADT feeds (admissions, demographic updates, patient merges from the EHR). Demographics are refreshed by the next order; merges are done in OpenELIS.
- Expanding standing orders into occurrences (FR-C8).
- Printing requisitions for clinics.

---

## Register update (Admin Redesign FRS §9)

| Row | Change |
|---|---|
| A-10 | Automation › Interfaces › EHR Interfaces · `interfaces/ehr` · C Record editor (list type B) · Planned · this FRS |
| A-11 | Automation › Interfaces › EHR Profiles · `interfaces/profiles` · B Record list · Planned · this FRS |
| A-12 | Automation › Interfaces › Public Health Reporting · `interfaces/publicHealth` · C Record editor (list type B) · Planned · State ELR FRS |
| §3.1 | Automation gains the Interfaces group (three children) after External Connections, with its own icon (AF-4) |
| A-01 | External Connections gains the type "HL7 interface" |

---

## Docs impact

New manual pages: EHR Interfaces, EHR Profiles, incoming orders on the order dashboard. Changed: the order dashboard page (Source filter replaces Include external sources), Sent Messages (new product). Feature Doc at Acceptance via `openelis-user-manual`.

---

## Crosscheck summary (2026-11-04)

**Verdict: proceed with coordination.** No active decision is contradicted once D-387 records how far D-224 reaches; the work leans on four specced but unbuilt foundations, declared as Dependencies 1 to 4.

| Check | Finding | Severity | Handled by |
|---|---|---|---|
| D-224 (full reports only as protected PDFs) | Embedding a plain PDF in HL7 would contradict it | HIGH | D-387 scopes D-224 to email, SMS, WhatsApp |
| D-222 (one sender, one log) | Outbound HL7 needs a queue and a log | HIGH if a new log | D-388: reuse the outbox and Sent Messages |
| D-223 (unit is a report version) | Result timing | n/a | D-386 follows it |
| D-230 (nothing unvalidated leaves) | LRI allows preliminary results | n/a | FR-G4: preliminary means a Partial version of released results |
| D-002, D-007, D-081, D-211 | Reject and dismiss never delete; all pickers typeahead; panel code used for mapping; missing billing and surveillance data never blocks | n/a | FR-F6, FR-E2, FR-D3, FR-D6 |
| Clinical Order Entry v4 FR-H1 and FR-B17 | Its incoming-orders queue (OGC-1073) is out of its scope; this spec delivers it on the same dashboard | HIGH (shared page) | FR-F; coordinate with OGC-1266 |
| Billing FRS | Shares order intake for insurance and diagnosis; "who bills these orders" on an external source | HIGH | Dependency 4; Open Question 3 |
| Admin Redesign A-01, A-03 | External Connections gains a type; new Interfaces group in Automation | MEDIUM | Navigation notes |
| Analyzer HL7 MLLP listener (OGC-325) | Same transport problem | MEDIUM | Dependency 9 |
| Module system (OGC-1577, merged to `develop` 2026-11-05) | US-only profiles could ship as a module | LOW | Profiles are data and ship as a reference data pack (FR-A2); the engine stays in core |
| AMR Surveillance FRS v0.1 (2026-11-05) | Took D-375 to D-383 | HIGH (ID collision) | Renumbered here to D-384 to D-389 and D-395 to D-397 |
| Accreditation Readiness (clarify brief 2026-11-05) | CLIA baseline profile needs evidence of accurate result transmission | MEDIUM | FR-L5, Dependency 14 |
| Result Delivery `deliveryHoldMinutes` and automatic delivery | Report versions are issued by print, Send or automatic delivery; an interface order needs no print to send | HIGH (without FR-G1's fix, nothing would send) | FR-G1 |

**Build once:** one HL7 v2 engine and profile model for this spec, the sibling ELR spec and the US billing DFT^P03 handoff; one Interfaces group for all three.

---

## Appendix R: Research (2026-11-04)

### Standards

| Guide | What it covers | Current edition |
|---|---|---|
| HL7 v2.5.1 IG: Laboratory Orders from EHR (LOI), US Realm | Orders from an EHR to a lab: OML^O21, acknowledgments | Edition 5, STU, published 2024-05-16 |
| HL7 v2.5.1 IG: Laboratory Results Interface (LRI), US Realm | Results from a lab to an EHR: ORU^R01 | Edition 5 published after LOI Edition 5 (date not confirmed); Release 1 STU Release 4 published 2022-10 |
| HL7 v2.5.1 IG: eDOS (Laboratory Test Compendium Framework) | The lab's test menu sent to the EHR | Release 2 |
| Lab US Realm | The suite that continued LOI, LRI and eDOS, with a Laboratory Value Set Companion Guide | ONC project page |

### EHRs (starting values for the shipped profiles)

| EHR | What the vendor publishes | Orders in | Results out | Transport noted | Notes |
|---|---|---|---|---|---|
| **Epic** | open.epic "Ancillary Systems" lists lab interface specs: Incoming Ancillary Results (HL7v2), Outgoing Results and Orders (HL7 2.5.1 in LRI or ELR format; Epic recommends LRI), Outgoing Ancillary Orders, Incoming Orders from CPOE Systems, Discrete Genomic Results (LRI, ORU^R01) | Outgoing Ancillary Orders (ORM or OML per build) | ORU^R01, LRI preferred | Per build | Epic Aura (formerly Orders and Results Anywhere) is a network where a health system connects once to participating labs; Labcorp joined with its full menu in 2026 |
| **Oracle Health (Cerner Millennium)** | No public spec found; certified to the ONC lab criteria; interfaces built per client | ORM^O01 commonly | ORU^R01 | Per build | Treat as LOI/LRI default until the client's build team supplies their spec |
| **athenahealth** | Outbound Lab Orders scope document v1.4; Lab Results Interface implementation guide v15.5/15.7 | ORM, HL7 2.3.1, one OBR (one test) per message, shared Clinical Encounter ID for the order group; unmapped codes sent as "MISC" with text | ORU^R01 2.3.1 or 2.5; R01 and R03 processed; PDF as base64 in OBX-5.5 type ED, a second OBR for the PDF; preliminary, final, corrected and specimen-rejected handled | Orders: file transfer (FTP, SFTP, VPN preferred); results: TCP/IP socket over SSH or VPN; down 1:00 to 6:00 ET daily | Patient match on last name, first name, date of birth exactly; receiver pays $1 per order under Coordinator Receiver |
| **eClinicalWorks** | HL7 Lab Orders Specifications (Aug 2022) | ORM^O01, HL7 2.3; PID, PV1, IN1, GT1, ORC, OBR, DG1 (ICD-10), OBX for AOE (type ST), NTE; requisition number in ORC-2 and OBR-2; cancel as ORC-1 CA or OBR-25 X/CA; no filler number | Separate result spec (not reviewed) | Not stated | Lab category in OBR-20 must match the EMR's name exactly |
| **NextGen** | Interfaces page: lab interfaces on HL7 2.3 and 2.5, 2.5 preferred | ORM | ORU | Not stated | Quest and Labcorp named as national reference lab interfaces |
| **MEDITECH Expanse** | "Order Management Orders to Other Vendor Ancillary System" v2.4 (2018); Lab result reports outbound (2024) | ORM, HL7 2.4 framing; MSH, PID, PV1, AL1, ORC, OBR, ODS, OBX, NTE | Not covered by that document | TCP/IP with MLLP; expects an ACK per message before sending the next | ORR and deferred acknowledgments not accepted |
| **OpenEMR** (open source) | Order and result code on GitHub (`gen_hl7_order.inc.php`, `receive_hl7_results.inc.php`); procedure provider settings; community notes | ORM^O01, HL7 2.3: PID, NTE (medications), PV1, IN1 per payer, GT1 (the patient), ORC (NW), OBR per procedure, DG1 (ICD-10 only), OBX for order-time questions; placer number is OpenEMR's order ID, zero-padded, in ORC-2 and OBR-2 | ORU^R01 (and MDM documents); statuses P, F, C, X; base64 PDF in an ED OBX saved to the patient's documents; performing lab from OBX-23 to OBX-25; results-only mode matches patients by name, birth date, sex, SSN | Per lab ("procedure provider"): orders path and results path over SFTP to a lab-hosted server, or a local file system; OpenEMR polls for results | Compendium configured per lab; open source with an official Docker image, so testable end to end in CI; used in small US practices and abroad |

### Sources

- [Epic, Ancillary Systems (lab interfaces)](https://open.epic.com/Ancillary/Results)
- [Epic Aura practical guide (Mindbowser)](https://www.mindbowser.com/epic-aura-a-practical-guide-to-lab-genomics/)
- [Labcorp and Epic Aura expansion (MLO)](https://www.mlo-online.com/management/news/55377338/labcorp-and-epic-announce-expanded-diagnostic-integration-collaboration)
- [HL7: LOI Edition 5 STU publication](https://standups.hl7.org/2024/05/16/stu-publication-of-hl7-version-2-5-1-implementation-guide-laboratory-orders-from-ehr-loi-edition-5-us-realm/)
- [HL7: LRI R1 STU Release 4 publication](https://standups.hl7.org/2022/10/07/stu-publication-of-hl7-version-2-5-1-implementation-guide-laboratory-results-interface-release-1-stu-release-4-us-realm/)
- [ONC: LOI/LRI continued as Lab US Realm](https://oncprojectracking.healthit.gov/wiki/x/O4DWAQ)
- [athenahealth outbound lab orders scope document v1.4](https://www.athenahealth.com/~/media/athenaweb/files/developer-portal/outbound_lab_orders_scope_documentv14.pdf?la=en)
- [athenahealth lab results interface implementation guide](https://www.athenahealth.com/~/media/athenaweb/files/developer-portal/lab_results_interface_implementation_guide.pdf?la=en)
- [eClinicalWorks HL7 Lab Orders Specifications, Aug 2022](https://www.eclinicalworks.com/wp-content/uploads/2023/09/eCW-HL7-Lab-Orders-Specifications-Aug-2022.pdf)
- [NextGen interfaces](https://www.nextgen.com/solutions/interoperability/interfaces)
- [MEDITECH Orders to Other Vendor Ancillary System v2.4](https://home.meditech.com/en/d/greenfield/otherfiles/omorders24.pdf)
- [OpenEMR gen_hl7_order.inc.php](https://github.com/openemr/openemr/blob/master/interface/orders/gen_hl7_order.inc.php)
- [OpenEMR receive_hl7_results.inc.php](https://github.com/openemr/openemr/blob/master/interface/orders/receive_hl7_results.inc.php)
- [OpenEMR procedure_providers table](https://www.open-emr.org/documentation/8.2.0/b10/tables/procedure_providers.html)
- [OpenEMR community: LIS integration](https://community.open-emr.org/t/lis-integration-with-open-emr/10557)
