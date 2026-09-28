# M-18 Environmental Microbiology: Functional Requirements Specification

| | |
|---|---|
| **Version** | v0.4 (aligned with Microbiology v2 amendments; built on what develop stores today: order-level purpose and replicates in the existing micro order detail, sampling sites for wards, investigation link moved to M-16) |
| **Date** | 2026-09-28 |
| **Author** | Casey (Director of Product), drafted with Claude |
| **Status** | Draft for review |
| **Module** | Microbiology (M-00 parent). Also touches Results Entry v4, Validation v4, Environmental Order Entry v4 |
| **Preview** | `m-18-environmental-microbiology-preview.html` |
| **Checked against** | develop `15cbcb1` (2026-09-27): `UnifiedResults.tsx`, `domainIntl.ts`, `ResultEntryRestController.getUserLabUnits`, `TestSection.domain`, `Test.domain`, `MicroReportProjectionServiceImpl`, `MicroCaseAnalysis`, `MicroCaseOrderDetail`, `MicroCulturePurpose`, `MicroWhonetExportSelection`, `ObservationHistoryServiceImpl` (`envSamplingSiteId`) |
| **Related** | M-03 Order Entry Micro Hook v2.2, M-04 Case Workbench v2.0, M-07 Worklists v2.0, M-09 WHONET Export v2.0, M-13 Antibiogram, M-15 GLASS, M-16 Cluster Detection v1.0, Clinical Order Entry v4 FRS v0.9 (domain switcher, FR-A17 to A22), Environmental and Vector Order Entry v4 FRS v0.2, Lab Units FRS, Locations & Organizations redesign |


> **Aligned with Microbiology v2 (2026-09-28).** `amr-micro-v2-amendments.md` removes the declared workflow and the culture protocol, opens Cases from Program = Microbiology with a lab unit per sample, and moves purpose and replicates to the Case view. FR-C1 to C5, C7, FR-D1, FR-D3, Information & Data and AC-M18-06/07 are updated to match. Proposed D-095 (one domain per lab unit) is unchanged and fits v2.

---

## Lab Context

### Current State

Most laboratory units handle one kind of work. The chemistry bench tests patient blood; the water bench tests drinking water. The microbiology unit is the exception. Its daily work is patient cultures: a wound swab, a urine or a blood culture is plated on growth media, incubated, and any bacteria that grow are identified and tested against antibiotics (antimicrobial susceptibility testing, AST). But the same bench, the same staff and the same incubators also receive **environmental** samples. Examples: infection prevention staff swab bed rails and sinks on a ward during an outbreak; a hospital sends in a reprocessed endoscope to check it is clean; a food inspector brings a sample from a restaurant complaint; a water utility asks for Legionella testing on a cooling tower.

In OpenELIS today every part of the microbiology module assumes a culture belongs to a patient. The Microbiology Case (the record that follows one specimen from plating to final report) shows a patient banner, asks for patient origin and admission date, and exports to WHONET and GLASS as a patient isolate. Environmental samples have their own order entry and results screens, but those screens have no culture workup: no plates, no isolates, no AST. So a microbiology lab either registers an environmental swab against a fake "Environment" patient, or keeps it in a paper logbook.

### Pain

- **Fake patients.** Labs create a patient called "Ward 3 Environment" or "Hospital Surfaces" to get a swab into the culture workflow. That patient then appears in patient searches, pulls environmental isolates into the patient antibiogram (the yearly table of how often each bacterium is resistant to each antibiotic, used to choose treatment), and is exported to WHONET and GLASS as if a person were infected. A single outbreak investigation with 40 surface swabs can shift a hospital's antibiogram and its national surveillance numbers.
- **Cultures show up twice.** Culture tests are worked and released in the Microbiology Case, and final release marks the test finished directly. But nothing keeps them off the ordinary Results and Validation screens, so a blood culture sits there as "Not started" for up to five days, inviting a technician to type a result outside the case.
- **Outbreak swabs distort the counts.** When infection prevention swabs a ward because of a rise in one bacterium, those swabs are recorded exactly like routine monitoring, so nothing can tell them apart when counting how often the bacterium turns up.
- **Samples from outside the hospital have nowhere to go.** A food or water sample arrives with a sampling site, not a ward, and the micro workflow has no place for a site at all.

### What Changes

Environmental microbiology gets its own lab unit, **Environmental Microbiology**, alongside the existing Microbiology unit. Each keeps one domain, so every screen that works by lab unit shows one layout. The same technicians are given both lab units and see both kinds of culture on the Microbiology worklist, each row showing its own subject: a patient for a clinical culture, a site and sampling point for an environmental one. Culture tests are worked only in the Microbiology Case; they no longer appear on the ordinary Results and Validation screens.

An environmental swab whose test is marked "Culture workflow" in the test catalog opens a normal Microbiology Case, the same plates, isolates, AST and expert review as a patient culture, with the sampling site in place of the patient. Every environmental culture has a sampling site: the laboratory sets up a sampling site for each ward it monitors, alongside the sites for food, water and outside samples. Reception records why the samples were taken (routine monitoring, a post-cleaning check, an outbreak investigation or a complaint), so outbreak swabs never count as routine findings. Environmental isolates stay out of the patient antibiogram and GLASS, and go to WHONET only when the lab chooses to send them, coded as environmental.

---

## Overview

This feature makes the microbiology module work for environmental samples without a second workflow. It has four parts:

1. **A separate Environmental Microbiology lab unit.** Environmental culture tests live in their own lab unit with the Environmental domain. Lab units keep exactly one domain. Culture tests linked to a Microbiology Case are kept off the Results and Validation worklists in every domain; the case is where they are entered and released.
2. **Environmental Microbiology Cases.** Program = Microbiology opens a Case in any domain (Microbiology v2 A-02). An environmental Case has a **site** as its subject instead of a patient. Everything else in the case workflow is unchanged.
3. **Environmental micro details.** Environmental Enter Order gains a Microbiology section when Program = Microbiology is chosen, with a lab unit per culture sample. Purpose and replicates are entered on the Case (Microbiology v2 A-03).
4. **Surveillance boundaries.** Environmental isolates are excluded from the antibiogram and GLASS, can be sent to WHONET by choice, and feed cluster detection's environmental stream.

### Design principles

1. **One workflow, two subjects.** A Case is a Case. The subject is a patient or a site; nothing else forks.
2. **One lab unit, one domain.** A lab unit never mixes domains. Work that spans domains is organised by giving people more than one lab unit, not by mixing them.
3. **Routing is the Program pick.** Program = Microbiology opens a Case, in every domain, in the lab unit chosen per sample. No per-domain routing rule (Microbiology v2 D-114).
4. **Surveillance populations never mix silently.** Environmental isolates enter a clinical output only by an explicit, labelled choice.
5. **One place per test.** A culture test is worked in its Case; every other test on Results. Never both.

### Navigation & URL

No new pages. Existing pages change:

| Page | SideNav | Breadcrumb | Route | Change |
|---|---|---|---|---|
| Results | Workplan → Results | `Home / Workplan / Results` | `/Results` | Case-linked tests excluded (section B) |
| Validation | Validation | `Home / Validation` | `/Validation` | Same (section B) |
| Lab Units | Admin → Config → Test Catalog → Lab Units | `Home / Admin Management / Test Catalog Management / Lab Units` | `/admin/TestCatalogList?entity=labunits` | No change to the page; an Environmental Microbiology lab unit is added (section A) |
| Environmental Enter Order | Orders & Patients → Add Order, Environmental (clinical FR-A17) | `Home / Orders / Environmental Orders / Enter Order` | `/order/environmental/enter` | Microbiology section (section C) |
| Microbiology Case | Microbiology → Worklist → a case | existing | `/microbiology/case/:caseId` | Site subject for environmental cases (section D) |
| Microbiology Worklist | Microbiology → Worklist | existing | `/microbiology/worklist` | Subject column, Lab unit filter (section E) |
| Case search | Microbiology → Case search | existing | `/microbiology/case-search` | Search by site (section E) |
| WHONET export | Reports → WHONET export | existing | `/reports/whonet-export` | Include environmental isolates option (section F) |

All routes must be verified against the live app before build.

---

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
| FR-A1 | Environmental culture work uses its **own lab unit**, for example **Environmental Microbiology**, with the domain **Environmental**. Environmental culture tests (surface swab culture, Legionella culture, Salmonella culture on food) are assigned to it. The existing Microbiology lab unit stays Clinical. | Casey, 2026-09-28. D-095. |
| FR-A2 | Lab units keep **exactly one domain** (D-004). A test can only be assigned to a lab unit of its own domain (D-030 guard). | Proposed D-094 (a lab unit serving several domains) is withdrawn. |
| FR-A3 | The lab unit is created in the Lab Units page or loaded through the test catalog CSV loader like any other lab unit. No new admin setting. | Docs impact: catalog guidance names the pattern. |
| FR-A4 | Staff who work both benches are given both lab units through the existing user lab unit assignment. A user who has only one of them sees only that lab unit's cultures. | Existing user and role administration. |
| FR-A5 | Order entry offers Environmental Microbiology tests only on environmental orders, because their sample types are environmental (clinical FR-B14 filters by the order's domain). | No order entry change. |

### B. Results and Validation

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Culture tests stay in the Case.** A test linked to a Microbiology Case (`micro_case_analysis`) never appears on the Results or Validation worklists, in any domain. It is entered in the Case workbench and released by the Case's preliminary and final release, which already marks the test finished. | D-096. Applies to clinical cultures today, not only environmental ones. |
| FR-B2 | When the selected lab unit has culture tests in open Cases, the Results and Validation pages show one line above the table: "{count} cultures in this lab unit are worked in the Microbiology worklist", linking to the worklist filtered to that lab unit. | So a technician never wonders where the cultures went. |
| FR-B3 | A culture test that is **not** linked to a Case (no Program = Microbiology on the order, for example a legacy order) stays on Results as today. | No test is ever unreachable. |
| FR-B4 | Validation follows FR-B1 to FR-B3. | Validation v4 section I. |

### C. Environmental order entry: Microbiology section

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | **Routing (v2).** Choosing **Program = Microbiology** on an environmental order opens one Case per culture sample, in the lab unit chosen for that sample in the Microbiology section (FR-C4). No test catalog attribute and no trigger resolver are involved. The default lab unit is the lab unit of the first test on the sample, which for environmental culture tests is Environmental Microbiology. | Microbiology v2 A-02, D-114. Replaces the Culture-workflow resolver of v0.3. |
| FR-C2 | Without Program = Microbiology no Case opens, in any domain. Water and food counts (for example total coliforms per 100 mL, heterotrophic plate count) stay in environmental results entry with their regulatory limits. | Guidance for catalog managers in the docs impact. |
| FR-C3 | When Program = Microbiology is chosen (env v4 EV-B3, Order defaults), a **Microbiology** section appears on Environmental Enter Order directly below the samples table. It states "This order will create {count} Microbiology Cases." | Env v4 page; section numbering follows. |
| FR-C4 | The section lists one line per culture sample: sample number and field ID, sample type, tests, and a required **Lab unit** dropdown (v2 FR-02.2), with **+ Another lab unit** for a second Case on the same sample. No culture protocol is shown (retired, v2 A-01). **Purpose** and **Replicates** are no longer entered here: they move to the Case's Case information section (v2 A-03), stored in the same micro order detail. | Replicates use the existing `number_of_sets`; clinical wording "Number of sets" becomes "Replicates" (`.env` key). |
| FR-C5 | **Purpose** (entered in Case information, v2 A-03) is the existing micro **culture purpose** (`culture_purpose`). Clinical Cases keep its two values, Clinical diagnostic and Active screening. Environmental Cases offer four new values: **Routine monitoring** (default), **Post-cleaning check**, **Outbreak investigation**, **Complaint**. Each Case offers only its own domain's values. | A code list, not a dictionary: the column is `varchar(32)`, so new values need no schema change. On a culture order, env v4's separate sample purpose (EV-M2) is not shown (X-08). |
| FR-C7 | Clinical-only micro fields never appear for environmental Cases, at order entry or in Case information: patient origin, date of admission, clinical history, prior antibiotics, TB history. | v2 A-03 fields stay clinical. |
| FR-C8 | The Microbiology section saves with the order in the one all-or-nothing Save (D-072). The Cases are created by the existing post-save hook. | |
| FR-C9 | **Site for an environmental culture.** The sample's site is required to complete (env v4 EV-I) and is always a **sampling site**, stored as today (`envSamplingSiteId`). A laboratory that swabs hospital wards sets up a sampling site for each ward it monitors ("Medical Ward 3, Port Moresby General Hospital"), next to its sites for food, water and outside samples. The **sampling point** names the exact spot or object ("Bed 12 rail", "Endoscope EG-4471"). | Casey, 2026-09-28. Once Locations & Organizations makes sampling sites part of Organizations, wards become selectable directly (Dependency 3). |

### D. Microbiology Case with a site subject

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | A Case's **subject** is derived from its sample: the patient for a clinical sample, the site for an environmental one. The Case record gains no subject column; it is keyed to `sample_item_id` + lab unit (v2 A-02). | v2 replaces the `workflow_type` keying. |
| FR-D2 | **Context strip (environmental).** In place of the patient identity: site name, sampling point, field ID, collection date and time, purpose, compliance standard when set, and requester. A teal "Environmental" Tag follows the lab number. | M-04 context strip. |
| FR-D3 | The workbench uses the v2 case layout (Case information, Initial testing, Culture, Growth work-up, Isolates, AST / DST, Additional testing, Report). The clinical-only fields (patient origin, department, admission date, clinical history, prior antibiotics, TB history) are hidden, not shown empty. | Microbiology v2 Overview. |
| FR-D4 | **Expert rules (M-06).** Organism and phenotype rules apply. Rules that read patient data (age, sex, patient origin) are skipped for environmental Cases and the skip is shown in the rule trace ("Not applied: needs patient data"). | |
| FR-D5 | **Critical notification (M-11).** A test's existing notification setting applies. For an environmental Case the recipient is the order's requester contact instead of the provider; the acknowledgment record is the same. | |
| FR-D6 | **Report.** An environmental Case reports through the environmental report layout (site header, no patient block), with the same organism, AST and comment sections as the patient report. | Report Management (OGC-1111) owns the layout per domain. Dependency 5. |
| FR-D7 | **Linked cases.** Sibling Cases on one sample (M-04 §2A) work the same in both domains. | |

### E. Worklists and case search

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | The M-07 **Cultures** and **AST runs** views show Cases from every lab unit the user is assigned to. The Patient column becomes **Patient or site**: a clinical row shows the patient; an environmental row shows the site name, sampling point and field ID, with a teal "Environmental" Tag after the lab number. | |
| FR-E1a | When the user has more than one micro lab unit, a **Lab unit** filter appears (All, Microbiology, Environmental Microbiology, with counts). Default All. | A filter on an existing attribute, not a domain mix. |
| FR-E2 | Due actions, priorities and stage logic are the same for both domains. | |
| FR-E3 | Case search matches site name, site code and sampling point, in addition to lab number, patient, organism and date. Results show the subject per row. | |

### F. Surveillance outputs

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Antibiogram (M-13) and preset analyses built on it:** environmental isolates are always excluded. There is no option to include them. | CLSI M39 antibiograms describe patient isolates. D-098. |
| FR-F2 | **GLASS (M-15):** environmental isolates are always excluded. | GLASS AMR reports human isolates. |
| FR-F3 | **WHONET export (M-09):** a new checkbox, **Include environmental isolates**, off by default. When on, environmental isolates are exported with the environmental origin and specimen codes from the M-01 WHONET dictionary pack and the site in place of patient fields. An environmental specimen with no mapped code is listed in Code Mapping as unmapped and is not exported until mapped. An environmental isolate is never exported as a patient isolate. | D-098. The choice is recorded in the export history. |
| FR-F4 | The M-09 first-isolate de-duplication is per patient and does not apply to environmental isolates; each environmental isolate is its own record, as M-16 §5.4 already states for environmental events. | |

### G. Cluster detection (M-16)

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | Environmental Microbiology Cases contribute to M-16's **environmental** detection stream: agent is the organism, or organism plus resistance phenotype, exactly as clinical isolates; location is the site's coordinates, falling back to the sample's coordinates. They never enter the clinical stream (M-16 §5.6). | |
| FR-G2 | Environmental cultures with Purpose **Outbreak investigation** are excluded from detection counts, for the same reason M-16 excludes screening cultures: samples taken because of a signal must not feed that signal. | Extends M-16 §5.3's screening rule to the environmental stream. |
| FR-G3 | M-16 §5.4's statement that environmental samples have no named sampling-site record is corrected: environmental samples reference a sampling site (FR-C9), and events use that site's coordinates first. | Crosscheck finding X-03. |

---

## Information & Data

### Reused as is

- `Test.domain` (NOT NULL, CLINICAL / ENVIRONMENTAL / VECTOR): the source of every row's domain and of lab unit domains.
- ~~The Culture-workflow test attribute and the M-03 trigger resolver.~~ Retired by Microbiology v2 (A-01, A-02); routing is Program = Microbiology plus a lab unit per sample.
- `micro_case`, keyed to `sample_item_id` + lab unit under v2 (was `sample_item_id` + `workflow_type`; `culture_method_id` no longer read).
- `micro_case_order_detail`, one row per order: `culture_purpose` (purpose) and `number_of_sets` (replicates). Its patient fields stay empty for environmental orders.
- The environmental order's sampling site, stored in observation history (`envSamplingSiteId`).
- The WHONET export's saved selection (`MicroWhonetExportSelection`, stored as JSON).
- Sampling point, field ID and a site per sample come from env v4 (EV-D3, EV-D4, EV-G5), which declares them as its own new data. Without them a Case shows the order's one site.

### Changed or new

| Item | Change |
|---|---|
| Results and Validation worklist queries | Exclude analyses linked through `micro_case_analysis`. |
| M-07 worklist rows | Add the Case's lab unit and, for environmental Cases, site and sampling point. |
| Culture purpose code list | Four environmental values added to `MicroCulturePurpose` and its request validation. Code only. |
| WHONET export selection | New `includeEnvironmental` field in the saved JSON selection. Code only. |

**No schema change.** Every requirement fits the tables develop already has.

### Lifecycle

An environmental Case follows the same stages as a clinical Case (M-00). Nothing is deleted (D-002).

---

## Access

Accessible via existing roles; no new permission names.

- **Reception** enters environmental orders and the Microbiology section.
- **Results role** works environmental Cases in the workbench and on Results, exactly as clinical Cases.
- **Validation role** releases environmental Case results.
- **Test Catalog Manager and Admin** create the Environmental Microbiology lab unit and assign tests, as for any lab unit.
- **Admin** sets up sampling sites for monitored wards in the existing Sampling Sites admin.
- **Admin** assigns the lab unit to users through the existing user administration.
- **WHONET export**: whoever can run the export today can tick Include environmental isolates.

---

## Localization

Keys follow constitution Principle VII. Run `npm run i18n:find` for each NEW key.

| Key | English | Where | Status |
|---|---|---|---|
| `label.results.culturesInCases` | {count} cultures in this lab unit are worked in the Microbiology worklist | Results and Validation | NEW |
| `label.domain.clinical` | Clinical | Tags, filters | REUSE if present |
| `label.domain.environmental` | Environmental | Tags, filters | REUSE if present |
| `label.domain.vector` | Vector | Tags, filters | REUSE if present |
| `order.env.micro.title` | Microbiology | Env Enter Order section | NEW |
| `order.env.micro.summary` | This order will create {count} Microbiology Cases for culture and susceptibility testing. | Section | NEW |
| `order.micro.sets.env` | Replicates | Section | NEW |
| `micro.culturePurpose.routineMonitoring` | Routine monitoring | Purpose | NEW |
| `micro.culturePurpose.postCleaning` | Post-cleaning check | Purpose | NEW |
| `micro.culturePurpose.outbreak` | Outbreak investigation | Purpose | NEW |
| `micro.culturePurpose.complaint` | Complaint | Purpose | NEW |
| `micro.case.subject.site` | Site | Context strip | NEW |
| `micro.case.samplingPoint` | Sampling point | Context strip | NEW |
| `micro.rules.skipped.patientData` | Not applied: needs patient data | Expert rule trace | NEW |
| `micro.worklist.subject` | Patient or site | M-07 column | NEW |
| `micro.worklist.filter.labUnit` | Lab unit | M-07 filter | NEW |
| `reports.whonetExport.includeEnvironmental` | Include environmental isolates | WHONET export | NEW |
| `reports.whonetExport.includeEnvironmental.help` | Coded as environmental, never as patient isolates. Off by default. | WHONET export | NEW |

---

## Dependencies

1. **Worklist changes** (Results, Validation): exclude Case-linked analyses; count open-Case cultures for the FR-B2 line. *Backend, small.*
2. **Culture purpose values:** four environmental values in `MicroCulturePurpose` and its validation; the WHONET purpose filter treats Outbreak investigation like Active screening. *Backend, small.*
3. **Wards as sites (later):** when the Locations & Organizations redesign makes sampling sites part of Organizations, the site picker offers wards directly and the per-ward sampling sites are merged into them. *Owned by Locations & Organizations.*
4. **Environmental case report layout:** Report Management (OGC-1111) provides a site-header layout with the micro sections. *Owned by OGC-1111.*
5. **M-03 on Clinical Order Entry v4:** M-03's tile was written for the old wizard. Its clinical fields need a home on the v4 Enter Order; the environmental section here is the pattern. *Order entry thread.*
6. **M-16 environmental stream reads site coordinates** (FR-G1, FR-G3). *M-16.*
7. **Env v4 per-sample fields:** field ID, sampling point code and a site per sample (env v4 Dependencies 3, 6). *Env v4.*

---

## Crosscheck

**Verdict:** Proceed with coordination. No active GLOBAL decision is violated; D-004 is kept (no combined domain value anywhere). Two sibling specs change shape (Results Entry v4 FR-M1 and Validation v4 FR-I1) and one sibling holds a factual error (M-16 §5.4).

| ID | With | Finding | Severity | Resolution |
|---|---|---|---|---|
| X-02 | Proposed D-094 (lab unit serving one or more domains) in Clinical Order Entry v4 FRS v0.9 | Withdrawn by Casey's call for a separate lab unit | HIGH | D-095; order entry thread to drop D-094 and reword its Dependency 33 |
| X-03 | M-16 §5.4 | Says environmental samples have no sampling-site record; develop stores one (`envSamplingSiteId`) | MEDIUM | FR-G3 |
| X-04 | Test catalog data model reference, D-032 | Say `test_section` has no domain column; develop has one (OGC-1020) | LOW | Update the reference; the column is used as is |
| X-05 | M-03 v2.2 | Written for the old order wizard | MEDIUM | Dependency 6 |
| X-06 | Micro module numbering | M-00 reserves M-17 for Parasitology while the preset reports library was also discussed as M-17 | LOW | This spec takes M-18; renumber the reports library when it is written |
| X-07 | M-04, M-07, Results Entry v4, Validation v4, develop | No spec or code keeps Case-linked culture tests off Results and Validation | HIGH | FR-B1 (D-096) |
| X-08 | Env v4 EV-M2 (sample purpose, planned as new data) | Two purpose fields on an environmental culture order | MEDIUM | Culture orders use `culture_purpose` (FR-C5); env v4 hides EV-M2 on culture samples. Env v4 thread to confirm |
| X-09 | M-16 | The link from environmental samples to a cluster investigation needs M-16's investigation records, which are not built | MEDIUM | Moved to M-16 scope (Out of Scope) |

### Proposed decisions

IDs are provisional; check the highest ID in `openelis-design-skill-src` before writing.

| ID | Decision | Scope |
|---|---|---|
| D-095 | Lab units keep exactly one domain. Work spanning domains, such as environmental microbiology, gets its own lab unit, and staff are given more than one lab unit. Proposed D-094 is withdrawn. | GLOBAL |
| D-096 | A test linked to a Microbiology Case is worked and released only in the Case; it never appears on the Results or Validation worklists. | GLOBAL |
| D-097 | A Microbiology Case can have a patient or a site as its subject. Program = Microbiology routes every domain (Microbiology v2 D-114); there is no second environmental culture workflow. | FEATURE (micro) |
| D-098 | Environmental isolates never enter the antibiogram or GLASS, and enter WHONET only by an explicit per-export choice, coded as environmental. | FEATURE (micro) |

---

## Out of Scope

- Vector cultures (vector pools are tested for pathogens by molecular methods; no case workflow is proposed).
- Food-specific methods (enumeration by most probable number, ISO food standards) beyond what the test catalog already models.
- An environmental antibiogram. If wanted, it is its own specification.
- Re-homing M-03's clinical fields onto Clinical Order Entry v4 (Dependency 5).
- **Linking environmental samples to a cluster investigation** and listing them in the investigation panel. Specified with M-16, which owns the investigation records (X-09).
- Choosing a ward from Locations & Organizations as the site, until that redesign lands (Dependency 3).
- Purpose and replicates per sample. They are per order, as the micro order detail is stored.

---

## Acceptance Criteria

- **AC-M18-01** A clinical blood culture that opened a Case does not appear on Results or Validation; the Results page for Microbiology says how many cultures are worked in the Microbiology worklist and links there.
- **AC-M18-02** A culture test on an order without Program = Microbiology still appears on Results.
- **AC-M18-03** With Environmental Microbiology selected on Results, rows use the environmental layout; with Microbiology selected, the clinical layout.
- **AC-M18-05** A test catalog manager cannot assign an environmental test to the Microbiology lab unit; the Environmental Microbiology lab unit accepts it.
- **AC-M18-06** An environmental order with Program = Microbiology and a surface swab culture creates a Microbiology Case in Environmental Microbiology on save; the same order without the Program creates none, and a coliform count test never opens a Case.
- **AC-M18-06a** A technician assigned to both micro lab units sees clinical and environmental Cases on the worklist with a Lab unit filter; one assigned only to Microbiology sees no environmental Cases.
- **AC-M18-07** The Microbiology section on environmental order entry shows only the Lab unit per culture sample; Purpose and Replicates are edited in Case information, which never shows patient origin, admission date, clinical history, prior antibiotics or TB history.
- **AC-M18-07a** An environmental order offers Routine monitoring, Post-cleaning check, Outbreak investigation and Complaint as purposes; a clinical order offers only Clinical diagnostic and Active screening.
- **AC-M18-09** A sampling site set up for a ward can be chosen as the site of a surface swab culture, and shows on the Case and the worklist.
- **AC-M18-10** An environmental Case's context strip shows site, sampling point, field ID and purpose, and hides every clinical-only field.
- **AC-M18-11** An expert rule that reads patient age is shown as "Not applied: needs patient data" on an environmental Case.
- **AC-M18-12** The antibiogram and GLASS outputs contain no environmental isolates; WHONET contains them only when Include environmental isolates is ticked, coded as environmental.
- **AC-M18-13** An environmental culture with Purpose Outbreak investigation is not counted by cluster detection; a Routine monitoring one is, in the environmental stream only.
- **AC-M18-14** Every new string appears in French when the interface is in French; no raw keys are shown.
