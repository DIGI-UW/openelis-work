# Environmental Microbiology functional requirements

> Functional authority: the V2 baseline owns case behavior; this document owns its scoped laboratory outcomes. Technical examples are non-normative. Engineering decisions and verification belong to specs/amr.


**Baseline:** environmental follow-on aligned to Microbiology V2 draft 10.4.
[OGC-1382](https://uwdigi.atlassian.net/browse/OGC-1382) is blocked by
[OGC-1383](https://uwdigi.atlassian.net/browse/OGC-1383). This is functional
scope, not a schema or routing implementation. See the [V2 baseline](amr-micro-v2-amendments.md)
and [preview](m-18-environmental-microbiology.html).

An eligible test opens a case; Program does not. Group samples by **order,
sample type, lab unit and site**, retaining each sampling point. Transfers keep
cases separate. Joining existing cases is deferred; a member without results
may be split with a reason. Media defaults come from catalog test media links;
culture rows record lots without changing stock.

## Lab Context

### Current State

Most laboratory units handle one kind of work. The chemistry bench tests patient blood; the water bench tests drinking water. The microbiology unit is the exception. Its daily work is patient cultures: a wound swab, a urine or a blood culture is plated on growth media, incubated, and any bacteria that grow are identified and tested against antibiotics (antimicrobial susceptibility testing, AST). But the same bench, the same staff and the same incubators also receive **environmental** samples. Examples: infection prevention staff swab bed rails and sinks on a ward during an outbreak; a hospital sends in a reprocessed endoscope to check it is clean; a food inspector brings a sample from a restaurant complaint; a water utility asks for Legionella testing on a cooling tower.

In OpenELIS today every part of the microbiology module assumes a culture belongs to a patient. The Microbiology Case (the record that follows one specimen from plating to final report) shows a patient banner, asks for patient origin and admission date, and exports to WHONET (the WHO microbiology surveillance software) and GLASS (WHO's Global Antimicrobial Resistance and Use Surveillance System) as a patient isolate. Environmental samples have their own order entry and results screens, but those screens have no culture workup: no plates, no isolates, no AST. So a microbiology lab either registers an environmental swab against a fake "Environment" patient, or keeps it in a paper logbook.

### Pain

- **Fake patients.** Labs create a patient called "Ward 3 Environment" or "Hospital Surfaces" to get a swab into the culture workflow. That patient then appears in patient searches, pulls environmental isolates into the patient antibiogram (the yearly table of how often each bacterium is resistant to each antibiotic, used to choose treatment), and is exported to WHONET and GLASS as if a person were infected. A single outbreak investigation with 40 surface swabs can shift a hospital's antibiogram and its national surveillance numbers.
- **Cultures show up twice.** Culture tests are worked and released in the Microbiology Case, and final release marks the test finished directly. But nothing keeps them off the ordinary Results and Validation screens, so a blood culture sits there as "Not started" for up to five days, inviting a technician to type a result outside the case.
- **Outbreak swabs distort the counts.** When infection prevention swabs a ward because of a rise in one bacterium, those swabs are recorded exactly like routine monitoring, so nothing can tell them apart when counting how often the bacterium turns up.
- **Samples from outside the hospital have nowhere to go.** A food or water sample arrives with a sampling site, not a ward, and the micro workflow has no place for a site at all.

### What Changes

Environmental microbiology gets its own lab unit, **Environmental Microbiology**, alongside the existing Microbiology unit. Each keeps one domain, so every screen that works by lab unit shows one layout. The same technicians are given both lab units and see both kinds of culture on the Microbiology worklist, each row showing its own subject: a patient for a clinical culture, a site and sampling point for an environmental one. Culture tests are worked only in the Microbiology Case; they no longer appear on the ordinary Results and Validation screens.

An environmental swab ordered with an environmental culture test opens a normal Microbiology Case, the same plates, isolates, AST and expert review as a patient culture, with the sampling site in place of the patient. Every environmental culture has a sampling site: the laboratory sets up a sampling site for each ward it monitors, alongside the sites for food, water and outside samples. The technician records on the Case why the samples were taken (routine monitoring, a post-cleaning check, an outbreak investigation or a complaint), so outbreak swabs never count as routine findings. Environmental isolates stay out of the patient antibiogram and GLASS, and go to WHONET only when the lab chooses to send them, coded as environmental.

---

## Overview

This feature makes the microbiology module work for environmental samples without a second workflow. It has four parts:

1. **A separate Environmental Microbiology lab unit.** Environmental culture tests live in their own lab unit with the Environmental domain. Lab units keep exactly one domain. Culture tests linked to a Microbiology Case are kept off the Results and Validation worklists in every domain; the case is where they are entered and released.
2. **Environmental Microbiology Cases.** Any eligible micro test opens a case in its domain (Microbiology v2 A-02). An environmental Case has a **site** as its subject instead of a patient. Everything else in the case workflow is unchanged.
3. **Environmental micro details.** Environmental Enter Order adds nothing: the environmental generic culture test is picked in the samples grid like any test. Purpose and replicates are entered on the Case (Microbiology v2 A-03).
4. **Surveillance boundaries.** Environmental isolates are excluded from the antibiogram and GLASS, can be sent to WHONET by choice, and feed cluster detection's environmental stream.

### Design principles

1. **One workflow, two subjects.** A Case is a Case. The subject is a patient or a site; nothing else forks.
2. **One lab unit, one domain.** A lab unit never mixes domains. Work that spans domains is organised by giving people more than one lab unit, not by mixing them.
3. **Routing follows eligible tests.** Group by order, sample type, lab unit and site; Program is independent. Transfers preserve separate cases.
4. **Surveillance populations never mix silently.** Environmental isolates enter a clinical output only by an explicit, labelled choice.
5. **One place per test.** A culture test is worked in its Case; every other test on Results. Never both.

## User Stories

1. As a **microbiology technician** who works both benches, I want patient cultures and environmental swabs on the Microbiology worklist, each showing its own patient or site, so that I work my shift in one pass.
2. As an **infection prevention officer**, I want the ward swabs I send during an outbreak marked as an outbreak investigation, so that they are never counted as routine findings.
3. As a **reception clerk**, I want a food or water sample from outside the hospital to go into the culture workflow with its sampling site, so that I never create a fake patient.
4. As a **microbiology supervisor**, I want environmental isolates kept out of the patient antibiogram and GLASS, so that an outbreak swab campaign does not distort treatment guidance or national figures.
5. As a **test catalog manager**, I want environmental culture tests in their own Environmental Microbiology lab unit, so that every lab unit keeps one domain and every screen that lists a lab unit shows one layout.
6. As a **laboratory technician**, I want culture tests kept off the Results screen, so that I never enter a culture result outside its Case.

---

## Functional Requirements

### A. Environmental Microbiology lab unit

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | Environmental culture work uses its **own lab unit**, for example **Environmental Microbiology**, with the domain **Environmental**. Environmental culture tests (surface swab culture, Legionella culture, Salmonella culture on food) are assigned to it. The existing Microbiology lab unit stays Clinical. | Casey, 2026-09-28. . |
| FR-A2 | Lab units keep **exactly one domain** . A test can only be assigned to a lab unit of its own domain ( guard). | Proposed  (a lab unit serving several domains) is withdrawn. |
| FR-A3 | The lab unit is created in the Lab Units page or loaded through the test catalog CSV loader like any other lab unit. No new admin setting. | Docs impact: catalog guidance names the pattern. |
| FR-A4 | Staff who work both benches are given both lab units through the existing user lab unit assignment. A user who has only one of them sees only that lab unit's cultures. | Existing user and role administration. |
| FR-A5 | Order entry offers Environmental Microbiology tests only on environmental orders, because their sample types are environmental (clinical FR-B14 filters by the order's domain). | No order entry change. |

### B. Results and Validation

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Culture tests stay in the Case.** A test linked to a Microbiology Case  never appears on the Results or Validation worklists, in any domain. It is entered in the Case workbench and released by the case’s partial and final release, which already marks the test finished. | Applies to clinical cultures today, not only environmental ones. |
| FR-B2 | When the selected lab unit has culture tests in open Cases, the Results and Validation pages show one line above the table: "{count} cultures in this lab unit are worked in the Microbiology worklist", linking to the worklist filtered to that lab unit. | So a technician never wonders where the cultures went. |
| FR-B3 | Tests whose Opens a Microbiology case switch is off remain on ordinary Results. Case-owned tests never acquire a second editing path. | No retained legacy routing authority. |
| FR-B4 | Validation follows FR-B1 to FR-B3. | Validation v4 section I. |

### C. Environmental order entry: generic culture tests

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | An environmental test with **Opens a Microbiology case** enabled opens or joins a case on the same order, sample type, lab unit and site. Different sites or lab units produce separate cases. Sampling points remain visible per sample and do not replace the site grouping rule. Program is not set or read for routing. | [V2 grouping](amr-micro-v2-amendments.md#fr-02.4). |
| FR-C2 | A sample with no eligible micro test opens no case. Quantitative water/food tests whose switch is off stay in environmental Results with their regulatory limits. | [Catalog switch](amr-micro-v2-amendments.md#fr-01.1). |
| FR-C3 | **Retired in v0.8.** There is no Microbiology section on Environmental Enter Order. | |
| FR-C4 | Purpose and Replicates are entered in Case information. Environmental order entry retains its normal sample/site fields and adds no Microbiology section or protocol. | [Case information](amr-micro-v2-amendments.md#fr-03.1). |
| FR-C5 | Environmental purposes are **Routine monitoring** (default), **Post-cleaning check**, **Outbreak investigation** and **Complaint**. Each case offers its domain’s values, with no duplicate order-entry culture-purpose field. | [Populations](amr-micro-v2-amendments.md#fr-19.6). |
| FR-C5a | **Purpose per Case, replicates per order.** Purpose is stored per Case and defaults to Routine monitoring (there is no order-level purpose now that order entry shows no micro fields); a technician sets Outbreak investigation or another value on the Case, so an investigation sample on the same order can differ. Replicates apply per order: on Case information they show the helper "Applies to all {count} cases on this order", and a change shows on every Case of that order, recorded on each Timeline. | |
| FR-C7 | Clinical-only micro fields never appear for environmental Cases, at order entry or in Case information: patient origin, date of admission, clinical history, prior antibiotics, TB history. | v2 A-03 fields stay clinical. |
| FR-C8 | The Cases open in the order's one all-or-nothing Save , using the same all-or-nothing order save. | |
| FR-C9 | **Site for an environmental culture (interim).** The sample's site is required to complete (env v4 EV-I). Until Locations & Organizations ships, it is always a **sampling site**, selected from Sampling Sites: a laboratory that swabs hospital wards sets up a sampling site for each ward it monitors ("Medical Ward 3, Port Moresby General Hospital"), next to its sites for food, water and outside samples. The **sampling point** names the exact spot or object ("Bed 12 rail", "Endoscope EG-4471"). **Target :** once Locations & Organizations lands, the site can also be a ward, department or facility chosen directly, and the per-ward sampling sites are merged into those locations (Dependency 3). | Casey, 2026-09-28; , . |

### D. Microbiology Case with a site subject

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | An environmental case has a **site**, not a patient, as its subject. Grouping follows order, sample type, lab unit and site. Replicates retain their sampling points and collection details. | [V2 grouping](amr-micro-v2-amendments.md#fr-02.4). |
| FR-D2 | **Context strip (environmental).** In place of the patient identity: site name, sampling point, field ID, collection date and time, purpose, compliance standard when set, and requester. A teal "Environmental" Tag follows the lab number. | V2 case context strip. |
| FR-D3 | The workbench uses the v2 case layout (Case information, Initial testing, Culture (with tests and subcultures beneath each row), Isolates, AST / DST, Additional testing, Report). The clinical-only fields (patient origin, department, admission date, clinical history, prior antibiotics, TB history) are hidden, not shown empty. | Microbiology v2 Overview. |
| FR-D4 | **Expert rules (M-06).** Organism and phenotype rules apply. Rules that read patient data (age, sex, patient origin) are skipped for environmental Cases and the skip is shown in the rule trace ("Not applied: needs patient data"). | |
| FR-D5 | **Critical notification (V2 callbacks).** A test's existing notification setting applies. For an environmental Case the recipient is the order's requester contact instead of the provider; the acknowledgment record is the same. | |
| FR-D6 | **Report.** An environmental Case prints on the environmental results certificate shipped today (Reports → Environmental Reports → Laporan Hasil, `ComplianceReportRestController`): site information, collection conditions, the compliance table (parameter, result, threshold, status), analyst and manager signatures and numbered amendments. The Case's results print in the compliance table, and isolates with susceptibilities as a susceptibility block after it (v2 FR-11.8). It never prints on the patient report (OGC-1111 FR-A52). | Built certificate; the micro block is v2 work. |
| FR-D7 | Related cases show each other as in the clinical case. A transfer changes worklist/rights but preserves each case’s identity, members and history even when the destination has a matching case. Joining existing cases is deferred. | [Transfers](amr-micro-v2-amendments.md#fr-02.6). |

### E. Worklists and case search

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | The V2 Worklist **Cultures** and **AST runs** views show Cases from every lab unit the user is assigned to. The Patient column becomes **Patient or site**: a clinical row shows the patient; an environmental row shows the site name, sampling point and field ID, with a teal "Environmental" Tag after the lab number. | |
| FR-E1a | When the user has rights in more than one lab unit with a generic culture test, a **Lab unit** filter appears (All, Microbiology, Environmental Microbiology, with counts). Default All. | A filter on an existing attribute, not a domain mix. |
| FR-E2 | Due actions, priorities and stage logic are the same for both domains. | |
| FR-E3 | Case search matches site name, site code and sampling point, in addition to lab number, patient, organism and date. Results show the subject per row. | |

### F. Surveillance outputs

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Antibiogram (M-13) and preset analyses built on it:** environmental isolates are always excluded. There is no option to include them. | CLSI M39 antibiograms describe patient isolates. |
| FR-F2 | **GLASS (M-15):** environmental isolates are always excluded. | GLASS AMR reports human isolates. |
| FR-F3 | **WHONET export (M-09):** a new checkbox, **Include environmental isolates**, off by default. When on, environmental isolates are exported with the environmental origin and specimen codes from the M-01 WHONET dictionary pack and the site in place of patient fields. An environmental specimen with no mapped code is listed in Code Mapping as unmapped and is not exported until mapped. An environmental isolate is never exported as a patient isolate. | The choice is recorded in the export history. |
| FR-F4 | The M-09 first-isolate de-duplication is per patient and does not apply to environmental isolates; each environmental isolate is its own record, as M-16 §5.4 already states for environmental events. | |

### G. Cluster detection (future, outside V2 delivery)

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | Environmental Microbiology Cases contribute to M-16's **environmental** detection stream: agent is the organism, or organism plus resistance phenotype, exactly as clinical isolates; location is the site's coordinates, falling back to the sample's coordinates. They never enter the clinical stream (M-16 §5.6). | |
| FR-G2 | Environmental cultures with Purpose **Outbreak investigation** are excluded from detection counts, for the same reason M-16 excludes screening cultures: samples taken because of a signal must not feed that signal. | Extends M-16 §5.3's screening rule to the environmental stream. |
| FR-G3 | M-16 §5.4's statement that environmental samples have no named sampling-site record is corrected: environmental samples reference a sampling site (FR-C9), and events use that site's coordinates first. | Crosscheck finding X-03. |

---

## Access

Accessible via existing roles; no new permission names.

- **Reception** enters environmental orders, including environmental culture tests, like any other test.
- **Results rights in the case lab unit** permit work on environmental cases in the Case workbench, exactly as clinical Cases. Culture tests never appear on Results; non-culture environmental tests in the lab unit (for example coliform counts) stay on Results.
- **Results rights** permit partial release; **Validation rights** permit validation, final release and amendments in the case lab unit, as in the V2 Access table.
- **Test Catalog Manager and Admin** create the Environmental Microbiology lab unit and assign tests, as for any lab unit.
- **Admin** sets up sampling sites for monitored wards in the existing Sampling Sites admin.
- **Admin** assigns the lab unit to users through the existing user administration.
- **WHONET export**: whoever can run the export today can tick Include environmental isolates.

---

## Localization

Visible text follows the shared localization conventions. Translation implementation belongs to engineering.

| Key | English | Where | Status |
|---|---|---|---|
| `label.results.culturesInCases` | {count} cultures in this lab unit are worked in the Microbiology worklist | Results and Validation | NEW |
| `label.domain.clinical` | Clinical | Tags, filters | REUSE if present |
| `label.domain.environmental` | Environmental | Tags, filters | REUSE if present |
| `label.domain.vector` | Vector | Tags, filters | REUSE if present |
| `microbiology.orderDetail.replicates` | Replicates | Case information (environmental) | NEW (environmental wording of the built `microbiology.orderDetail.numberOfSets`) |
| `microbiology.case.appliesToOrder` | Applies to all {count} cases on this order | Case information, Replicates | REUSE (Microbiology v2) |
| `microbiology.culturePurpose.routineMonitoring` | Routine monitoring | Purpose | NEW |
| `microbiology.culturePurpose.postCleaning` | Post-cleaning check | Purpose | NEW |
| `microbiology.culturePurpose.outbreak` | Outbreak investigation | Purpose | NEW |
| `microbiology.culturePurpose.complaint` | Complaint | Purpose | NEW |
| `microbiology.case.subject.site` | Site | Context strip | NEW |
| `microbiology.case.samplingPoint` | Sampling point | Context strip | NEW |
| `microbiology.rules.skipped.patientData` | Not applied: needs patient data | Expert rule trace | NEW |
| `microbiology.worklist.subject` | Patient or site | V2 Worklist column | NEW |
| `microbiology.worklist.filter.labUnit` | Lab unit | V2 Worklist filter | NEW |
| `reports.whonetExport.includeEnvironmental` | Include environmental isolates | WHONET export | NEW |
| `reports.whonetExport.includeEnvironmental.help` | Coded as environmental, never as patient isolates. Off by default. | WHONET export | NEW |

---

## Dependencies

The V2 case, shared environmental order entry, Inventory, Test Catalog,
Locations & Organizations and environmental certificate remain shared owners.
Future cluster detection, antibiogram and GLASS are not V2 dependencies or
delivery claims.

## Out of Scope

- Vector cultures (vector pools are tested for pathogens by molecular methods; no case workflow is proposed).
- Food-specific methods (enumeration by most probable number, ISO food standards) beyond what the test catalog already models.
- An environmental antibiogram. If wanted, it is its own specification.
- **Linking environmental samples to a cluster investigation** and listing them in the investigation panel. Specified with M-16, which owns the investigation records (X-09).
- Choosing a ward from Locations & Organizations as the site, until that redesign lands (Dependency 3).
- Purpose and replicates per sample. They are per order, as the micro order detail is stored.

---

## Acceptance Criteria

- **AC-M18-01** A clinical blood culture that opened a Case does not appear on Results or Validation; the Results page for Microbiology says how many cultures are worked in the Microbiology worklist and links there.
- **AC-M18-02** A culture test on a legacy order created before Microbiology v2, or a non-generic environmental test such as a coliform count, still appears on Results.
- **AC-M18-03** With Environmental Microbiology selected on Results, rows use the environmental layout; with Microbiology selected, the clinical layout.
- **AC-M18-05** A test catalog manager cannot assign an environmental test to the Microbiology lab unit; the Environmental Microbiology lab unit accepts it.
- **AC-M18-06** An environmental order with an environmental generic culture test on a surface swab, picked in the samples grid, creates one Microbiology Case in Environmental Microbiology on save and leaves Program unchanged; a coliform count test never opens a Case.
- **AC-M18-06a** A technician assigned to both micro lab units sees clinical and environmental Cases on the worklist with a Lab unit filter; one assigned only to Microbiology sees no environmental Cases.
- **AC-M18-07** Environmental order entry shows no Microbiology section; Purpose (default Routine monitoring) and Replicates are edited in Case information, which never shows patient origin, admission date, clinical history, prior antibiotics or TB history.
- **AC-M18-07a** An environmental order offers Routine monitoring, Post-cleaning check, Outbreak investigation and Complaint as purposes; a clinical Case offers only the five clinical purposes of Microbiology v2 FR-19.1.
- **AC-M18-09** A sampling site set up for a ward can be chosen as the site of a surface swab culture, and shows on the Case and the worklist.
- **AC-M18-10** An environmental Case's context strip shows site, sampling point, field ID and purpose, and hides every clinical-only field.
- **AC-M18-11** An expert rule that reads patient age is shown as "Not applied: needs patient data" on an environmental Case.
- **AC-M18-12** The antibiogram and GLASS outputs contain no environmental isolates; WHONET contains them only when Include environmental isolates is ticked, coded as environmental.
- **AC-M18-13** An environmental culture with Purpose Outbreak investigation is not counted by cluster detection; a Routine monitoring one is, in the environmental stream only.
- **AC-M18-07b** On an order with three environmental Cases, changing Purpose on one Case shows the new Purpose on all three, with the helper "Applies to all 3 Cases on this order" and a Timeline entry on each.
- **AC-M18-14** Every new string appears in French when the interface is in French; no raw keys are shown.
