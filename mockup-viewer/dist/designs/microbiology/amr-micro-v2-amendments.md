# Microbiology (AMR) Module v2 Amendments

| | |
|---|---|
| **Version** | v2.0 draft 10.4 (response to the Mohamed Gomaa design review of 2026-10-01: a live summary of the cases an order will open, shown before saving, D-190; case results show the OpenELIS analysis statuses with who entered and who validated, and a lab can block self-validation, D-191; reception gives each blood culture bottle its set number, D-192; a received isolate is an Isolate sample whose culture was tested elsewhere, D-194; Tested elsewhere replaces the Previous report wording, D-195; in-house media batches are Inventory lots and a lab unit can require tracked media, D-196; Inventory shows how often each lot was used on cultures, D-197; questionnaire answers are one record whether entered at order entry or on the case, with its FHIR copy kept current, D-198; the Worklist shows how late a row is and sorts STAT first, then most overdue, D-199; urine and other quantitative cultures are test catalog setup, D-200; configurable release rules, case regrouping after results, bench privacy, a six-area Worklist, a CSV of questionnaire answers, fill volume and separate release permissions are for later; see Review response; report FRS v2.4.3 (FR-A47a received isolates). Analyze follow-up: releases are Partial, Final and Amended, D-201; the medium type is an Inventory tag with the per-item Track lots property, D-202; Incoming results keeps its holding item, D-203; Reportable sets In lab only, D-204; notes in the note table, D-205; patient history and repeat isolates reuse what exists, D-206; Reporting track is a Dictionary category, D-207; plating is the culture test's media links in the Test catalog, D-208; the bench sheet is a Workplan print record, never a batch, D-209; plate and panel labels use a new per-container preset scope and isolate labels print as the isolate sample item, D-210. Draft 10.3: reuse what OpenELIS already has: every test on a culture, including microscopy and the Gram stain, is a catalog test picked with the standard chooser, D-183; In lab only replaces the Report this result switch, D-184; Gram stains and other graded observations are multi-component results, D-185; Program questions are the Program's own questionnaire, D-186; coded lists are Dictionary categories, D-187; the bench sheet is a Workplan print, D-188; the positive-bottle Gram stain is an ordinary reflex rule on the culture result, D-189; draft 10.2: the patient report groups a case under four sub-headers, Initial testing, Culture, AST / DST and Additional testing, D-181, report FRS v2.4.1; a Gram stain with no result yet (ordered, or added by the reflex rule when a blood culture bottle turns positive) shows Enter result, D-182; the AST / DST chooser opens on an isolate with the standard two lists, FR-07.1a; the TB and blood culture examples are drawn by the same Case view; draft 10.1: **Extend incubation** with a reason on any open culture row, and Extend 24 h on Final read due, D-179; **Positive at** recorded on every positive row with its exact date and time, defaulting to the server time and editable, with the time to positivity shown in days, hours and minutes, D-180; a blood culture AMR example case in the preview and mockup; draft 10: no culture type: no culture type: a test either opens a Microbiology case or not, a case is one order, sample type and lab unit, and the case's **Program** (shown on micro cases from the Programs admin, with a reporting track) brings its questions and decides the exports; the Choose path step and Change culture type are gone, D-178; draft 9.7: reception assigns a case to a lab unit by ordering one of its **case tests** (any number per lab unit), and the technician chooses the path as step 1 of the case; replaces the Program rule and the admin defaults, D-177 supersedes D-175; draft 9.6: Inoculated at is editable so rows can be set up before plating, D-176; a body site and collection time per sample on the case; draft 9.5: Print bench sheet from any Worklist filter, with name, lab number, tick and reading boxes, grouped by medium, and Open sheet to enter the results in the printed order, D-174; draft 9.4: culture work-up lives under each culture row and the separate Growth work-up section is removed; + Gram stain on every culture and subculture row with a Report this result switch; several subcultures per culture, D-173; draft 9.3: bench work stays on the Worklist, with no run and no batch record: Check due and Final read due filters with one-click and bulk No growth, replacing Mark checked; bulk Inoculate from Awaiting inoculation; D-172, which supersedes D-171 (bench batches as Runs, draft 9.2); draft 9.1: bench batches approved, D-167; draft 9: culture rows record the medium lot but never change inventory stock; real-workflow review: every micro test opens a case, including Xpert or smear alone; blood culture sets recorded as one sample per bottle with its own site; media as tracked or not tracked Microbiology medium items, search first with Add new; plating templates in Microbiology admin; tests on a positive culture (Gram stain) reportable; subculture from any culture; instrument negatives; plate and isolate labels; patient microbiology history and Refer to previous susceptibility; screening plates in Initial testing; batch bench work proposed; draft 8: notes on every case result and culture row, the Results Entry Notes pattern; reception orders the generic culture test in the ordinary test picker, with no micro section and no Program coupling; culture sets grouped automatically with Split on the Case view; the medium comes from Inventory (new seeded item type Microbiology medium) with a Not tracked mode remembered per lab unit; draft 7: crosscheck fixes: blood culture sets as one case, isolate sample items shared with Pathogen WGS, culture purpose per case, access on existing role bundles, callback and Runs dependencies declared; draft 6: drift audit folded in: the generic culture test sets the case scope and culture type; cases keyed on specimen and culture type, with the lab unit as a label; Program safety net kept (retired in draft 8); culture purpose required with five values; case stages, validation and release; final-release lock; critical calls in the shared callback log; report printed inside the patient report redesign; V1 behaviour restored where it was dropped by accident; several cultures per case, each marked positive or no growth, subcultures and isolates tied to their source culture, several AST panels per positive culture) |
| **Date** | 2026-10-02 |
| **Author** | Casey (Director of Product), drafted with Claude |
| **Status** | Draft for review. Changes in-flight work: read the Impact summary first |
| **Sources** | CPHL Port Moresby workflow breakdown "Microbiology & Mycobacteriology laboratory workflow" (JDHS for UW DIGI, September 2026); Casey's feedback and decisions, 2026-09-28 to 2026-10-02; Mohamed Gomaa, "Microbiology v2: Design Review and Recommendations" (UW DIGI, 2026-10-01), decided with Casey on 2026-10-02 (see Review response); `amr-micro-v2-drift-audit.md` (2026-09-29) |
| **Amends** | M-00 Parent, M-01 Reference Data, M-02 Breakpoints, M-03 Order Entry Micro Hook v2.2, M-04 Case Workbench v2.0, M-05 AST Entry, M-06 Expert Rules, M-07 Worklists v2.0, M-08 Macros, M-11 Critical Results, M-12 Reagent Linkage, M-14 Mycobacteriology/TB, M-18 Environmental Microbiology v0.5, Test Catalog "Culture workflow" attribute |
| **Consumes** | Clinical Order Entry v4 (test picker FR-B14, Tested elsewhere FR-B20, required marking FR-A8, body site section N / D-079), Environmental and Vector Order Entry v4, Inventory (item types, lots, usage, `InventoryItemForm`), Patient Report & Report Management v2.2 (OGC-1111, §7.4), Report Print Queue r4 (OGC-1031), Runs (OGC-1200), Pathogen WGS (clarify brief) |
| **Checked against** | develop `889166b` and `340599a` (2026-09-29): `MicroCase` (`workflow_type` NOT NULL, `uq_micro_case_sample_workflow`), `MicroWorkflowType`, `MicroCultureSetup`, `MicroAstPanel.workflowType`, `MicroCaseOrderDetail`, `MicroCulturePurpose`, `MicroCaseAnalysis.reportableTestAnalyteId`, `MicroCaseStateServiceImpl.ALLOWED_TRANSITIONS`, `MicroReportProjectionServiceImpl`, `MicroCriticalCommunication`, `CriticalCallback`, `MicrobiologyCaseAccessServiceImpl`, `MicroWorklistServiceImpl`, `ProgramSection.jsx`, `MicroOrderRoutingServiceImpl.isMicrobiologyOrder`, `MicroCaseInoculation.media` (free text), `MicroInventoryUsageLink`, `InventoryEnums.ItemType` and `chk_item_type`, `ComplianceReportRestController` |
| **Preview** | `amr-micro-v2-preview.html` (updated to draft 10.4; the TB example and the blood culture AMR example are the same Case view with two data sets; what is still to draw is listed in "Preview follow-ups" at the end) |
| **Mockup** | `amr-micro-v2-mockup.jsx` (developer handoff, `@carbon/react`; renders with no errors or warnings; fences mark the shipped M-04 panels, D-063) |

> **Reconciled against** all six sections of the CPHL workflow breakdown (JDHS draft v1.0, 28 September 2026) and against the drift audit of 2026-09-29 (built code on develop, the V1 specs M-00 to M-18, the UAT findings and the decision log). See **Workflow breakdown reconciliation** near the end.

---

## How to read this document

This is a delta, not a rewrite. The V1 specs stay the reference for everything this document does not touch. Each amendment (A-01 to A-21) states the new behaviour, then a **Contradicts V1** box wherever it reverses something already specced or built:

> **Contradicts V1**
> **Where:** spec and section. **V1 said:** what it said. **v2 says:** the replacement.
> **Build state:** Built (on develop) / Specced / Not started. **Rework:** what has to change.

Build state was read from `develop` on 2026-09-29. "Built" means the code is on `develop`, not that it has passed acceptance. A-16 lists every built capability v2 keeps; anything marked Kept there and missing from a v2 build is a regression.

**Three terms used throughout:**

- **Generic culture test:** a micro test whose Case role is Culture, for example "Bacterial culture" or "TB culture". It holds the culture result and prints it on the report.
- **Program (on the case):** the case's program, chosen in Case information from the programs shown on micro cases (Programs admin). It brings the program's questions and gives the case its **reporting track** (Bacterial, TB or Mycology) for exports. It replaces the culture type of drafts 6 to 9 (D-178).
- **Case lab unit:** the lab unit working the case. It is a label on the case, changeable at any time, that decides the Worklist and who may edit.

---

## Impact summary

| V1 item | Change | Build state | Rework |
|---|---|---|---|
| `workflow_type` on the case, AST panels and the test catalog | **Retired as a rule** (A-01, D-178): kept stored for history and migration only; nothing reads it | Built | Stop reading it; the case key becomes order + sample type + lab unit (FR-02.4); AST panels are offered by organism group |
| Culture setups ("protocol lanes") and the culture protocol derived from the test's Method | **Removed** (A-01) | Built | Retire `micro_culture_setup` screens and the derivation; keep rows read-only for history. The report mapping they held is no longer needed for printing (A-11) |
| M-03 trigger resolver and the test catalog "Culture workflow" attribute | **Replaced** (A-01, A-02): one Yes / No switch, Opens a Microbiology case, with a Case role; reception orders micro tests like any other test | Built (resolver, attribute) | Routing opens one case per order, sample type and lab unit |
| Program = Microbiology, the `ProgramSection` guard and the order entry Microbiology section | **Removed** (A-02, D-146); a case is assigned to a lab unit by its case test (FR-01.1b, D-177) | Built (`ProgramSection.jsx`, `MicrobiologyOrderEntrySection`, `isMicrobiologyOrderReady`, `microbiologyProgramSelected` in routing) | Remove the auto-set, the save guard and the section; routing reads only the tests |
| UNASSIGNED case state, **Change workflow** (M-04 §4.9), **Set / change protocol** (§4.9a) | UNASSIGNED and Set protocol **removed**; Change workflow is **removed** with no replacement (there is no culture type, D-178); new **Change lab unit** moves the case (A-02) | Built | UAT F-1 (classify returns 500) becomes moot |
| Inoculation medium (free text) | **From Inventory** (A-05, D-147): a Microbiology medium item, tracked (with a lot) or not tracked, from one search with Add new | Built (`MicroCaseInoculation.media` free text; reagent lot picker from test reagent links) | Type tag "Microbiology medium" and the Inventory v1.9 per-item Track lots property (D-202), one medium search with Add new, lot recorded on the row (no stock change) |
| M-03 Step 1 micro fields | **Moved** to Case information on the Case view (A-03); **Culture purpose stays required** with a default and gains three values (A-03, A-19) | Built (`MicroCaseOrderDetail` written at order entry) | Order entry stops showing them; Case view edits the same record |
| M-18 environmental micro section at order entry | **Moved** to Case information (A-03) | Specced | Done: M-18 v0.5 aligned; v0.6 follow-ups listed in Crosscheck |
| Incubation as free text; clock from `max_incubation_days` | **Replaced** by number + unit per inoculation, with check reminders and a read log (A-05) | Built | New structured fields; Worklist timing reads the inoculation rows |
| Gram stain only on a preliminary isolate; preliminary gated on an isolate Gram stain | **Replaced** by Initial testing on the specimen (A-06) and the release rules in A-17 | Built | Move direct Gram to Initial testing |
| Fixed per-profile sections (M-04 bacterial vs M-14 TB) | **Replaced** by one case layout with added tests and panels (A-07); TB behaviour follows the case Program and the organism (FR-01.2) | Built (bacterial); Specced (TB) | M-14 rules key on an MTB complex isolate and the TB Program questionnaire |
| Organism's default AST panel ordered on identification | **Kept** (A-07, A-16) | Built (`panelProvenance: ORGANISM_DEFAULT`) | None |
| Analyzer results fill only an existing AST run | **Extended** by Incoming results (A-09) | Built (existing-run path) | Add the holding panel |
| Case stages (linear `ALLOWED_TRANSITIONS`, PRELIM_RELEASED goes only to FINAL) | **Reworked** (A-17): stages for initial testing, referral, no culture, contaminated; culture keeps progressing after a partial release; Awaiting validation and Validated follow the normal OpenELIS statuses (D-191), with expert review as validation | Built | New transition table |
| Final-release lock | **Kept and widened** (A-17): every change after final goes through an amendment | Built (409 `FINAL_CASE_LOCKED`) | Apply to the new actions |
| Micro report: one REMARK result of up to 200 characters | **Replaced** on the printed report by the patient report redesign's micro blocks (A-11; OGC-1111 addendum) | Built (projection) | The patient report reads the case; the projection is kept only for electronic results until checked |
| Critical communications in `micro_critical_communication` only | **Also written to `critical_callback`** (A-18), so every critical call is in one log and on the report | Built (both tables) | Write a callback row per call |
| Lab-unit access checked only when a case is opened | **Also checked on every edit** (Access) | Built (GET only) | Add the check to mutations and the Worklist |
| Referral after microscopy | **New** (A-08) | Not started | Referral of the specimen or an isolate |
| Body site on the micro case | **New link** to D-079 (A-04) | Specced (order entry v4) | Case header and report read it |
| Culture readings, time to positivity | **New** (A-05) | Not started | New fields on the inoculation |
| TB resistance classification inside the TB profile | **Derived from drug results** with the V1 reconciliation gate kept (A-14) | Specced (M-14) | Update M-14 |
| Report release types Final and Amended only; preliminary release as an activity | **Partial, Final and Amended**, the OpenELIS report states (A-17, D-201): Release preliminary becomes Release partial report, recorded as a Partial report version | Built (Final, Amended; preliminary is an activity) | Record partial releases as Partial versions; no new release types |
| Notes | **Internal / External at case, isolate, drug** (A-13) | Built (case note only) | Extend notes; rebind M-08 macro categories |
| Tests added after AST/DST; tests kept off the report | **New** Additional testing and In lab only (A-15) | Not started | New section and flag |
| Translation keys | **`microbiology.*` namespace** (Localization) | Built (709 keys under `microbiology.*`) | New keys follow the built namespace |
| "Previous report" on a case test | **Renamed Tested elsewhere** (D-195), the order entry wording (D-083) | Specced | Wording and key only |
| Case result status Pending / Entered / Validated | **Replaced** by the OpenELIS analysis statuses with who entered and validated (D-191) | Specced | Read the built status; new Block self-validation setting |
| Number of sets computed from site and time | **Replaced** by an explicit set number per bottle, with warnings (D-192) | Specced | New sample field at order entry |

**Tickets and documents to re-review:** OGC-782 family and OGC-926 (built micro module), OGC-1111 (patient report: microbiology addendum), M-18 (v0.6 follow-ups), Clinical Order Entry v4 FRS (FR-B12a, FR-B14, FR-B20), Environmental and Vector Order Entry v4 FRS, the Test Catalog micro workflow attribute page (`designs/admin-config/test-catalog-microbiology-workflow-attribute.*`: narrowed to generic culture tests, not withdrawn), `OGC-782-amr-uat-findings*` (F-1 moot; F-2, F-3, P-1, P-2 carried into this draft).

---

## Lab Context

### Current State

A microbiology specimen (a sputum, a urine, a wound swab) is received once and then worked for days or weeks. At the Central Public Health Laboratory (CPHL) in Port Moresby it goes to one of three benches, each its own lab unit: the TB unit, the Microbiology unit, or the Environmental Microbiology unit. Other laboratories split the work differently, and some have one Microbiology section that does everything. The technician first looks at the specimen directly: a wet preparation, a Gram stain, an acid-fast bacilli (AFB) smear for TB, or a GeneXpert run (a molecular test that detects TB and rifampicin resistance in about two hours). Only then is it plated on growth media (inoculation) and left in the incubator. If something grows, the technician examines the colonies under the microscope, subcultures them, identifies each organism, and tests it against antibiotics: antimicrobial susceptibility testing (AST) for bacteria, drug susceptibility testing (DST) for TB.

OpenELIS today models this as fixed "workflows". Each culture test declares Bacteriology or TB, and a culture setup attached to it (media, incubation hours, maximum days) decides how the case behaves. Reception fills a Microbiology box of clinical details at order entry.

### Pain

- **The workflow is declared in advance, and the bench does not work that way.** A technician decides at the bench whether a sputum needs a GeneXpert, a smear, a culture, or all three. When the declared workflow is missing or wrong, the case lands "Unassigned" and has to be reclassified. On the test server that reclassification returns an error (user acceptance testing finding F-1), so the case is stuck.
- **Direct microscopy has no home.** A Gram stain on the specimen itself can only be recorded by creating a preliminary isolate, even when nothing has grown yet. A GeneXpert result has no place on a bacterial case at all.
- **Incubation is free text.** "48h" and "2 days" are both typed into a text box, so nothing can tell a technician that a plate is due to be read, or that a TB culture has reached its 42 days.
- **Reception is asked for things it does not know.** Prior antibiotics, TB treatment history and the reason for an environmental swab are on the request form, but typing them at the reception desk slows the queue and they are often skipped.
- **Smaller sites cannot hand over.** A district laboratory that can do microscopy but not culture has no way to send the rest of the work to CPHL and receive the results back on the same case.
- **Analyzer results can only land where a row already exists.** A GeneXpert or an identification instrument that sends a result for a test not yet on the case has nowhere to go.
- **The printed micro result is one line of text.** Isolates and susceptibilities are joined into a single remark of up to 200 characters on the patient report.

### What Changes

Reception orders micro tests (for example "Xpert MTB/RIF Ultra", "Bacterial culture" or "Blood culture", one sample per bottle) in the ordinary test picker, like any other test, and the first one opens the case. Everything else happens on the Case view. The technician fills in the case details from the request form, records the direct tests in a new **Initial testing** section (adding any test from the catalog, or a result that was already reported elsewhere), and either refers the specimen or plates it. The culture test's linked media propose the standard plating, each plate or bottle records its medium (with a lot when the medium is tracked), labels print for plates and isolates, and incubation is recorded as a number and a unit, with an optional reminder to check, so the Worklist shows "check due" and "incubation complete" without anyone counting days. Growth leads to tests on that culture picked from the catalog (a Gram stain, a ZN stain, a rapid identification), which can be kept In lab only, and to subcultures. Isolates get their default AST or DST panel automatically, and more can be added. An analyzer result with no matching row waits in one **Incoming results** panel until the technician places it. Results are entered, pass expert review (validation) and are released; the technician ticks which results go on the report, which prints inside the redesigned patient report. The case has its own Program, whose questionnaire holds the program questions, and bench sheets print from the existing Workplan.

---

## Overview

One case layout serves every micro lab unit, and nothing on it depends on a type (D-178). The case holds whatever tests, cultures and panels the bench adds; the breakpoints are chosen per panel; TB behaviour (resistance classification, the NTM outcome) follows the organism; and the case's **Program**, chosen in Case information, brings its questions (the TB Program's TB history) and its reporting track decides the exports.

**Case view section order (v2):**

1. Case header (lab number, patient or site, sample type, **body site and side**, **Program** and its reporting track, **case lab unit** with Change, related cases on the same sample in other lab units with a switcher, stage, priority)
2. **Incoming results** (shown only when something is waiting)
3. **Case information** (moved from order entry)
4. **Initial testing** (new: microscopy, wet prep, Gram stain, GeneXpert, molecular DST on the specimen, any added test)
5. **Referral point** (new: refer the rest of the work-up)
6. **Culture**: inoculation, incubation and the work-up of each culture (restructured). Each culture row lists under it, as a tree, the catalog tests run on it (a Gram stain, a ZN, a rapid identification) and its subcultures (A-10); there is no separate Growth work-up section (D-173, D-183)
7. **Isolates** (existing)
8. **AST / DST** (existing, plus add panel or test)
9. **Additional testing** (new: tests added at the end of the work-up, for example whole genome sequencing)
10. **Critical communication** (existing; calls also go to the shared callback log, A-18)
11. **Nonconformance** (existing)
12. **Report** (existing readiness and release, plus per-result Report choice; prints inside the patient report, A-11)
13. **Amendment** (existing)
14. Timeline (existing)

Expert review is not a separate section: it is the case's validation step (A-17).

### Navigation & URL

No new pages. All changes sit on existing routes.

| Surface | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Case view | Microbiology → Worklist → (row) | `Home / Microbiology / Worklist / Case {labNumber}` | `/Microbiology/cases/:caseId` (existing) |
| Worklist, Needs attention filter | Microbiology → Worklist | `Home / Microbiology / Worklist` | `/Microbiology/worklist?status=attention` (existing page; `attention` added to the server and client `status` allow-lists) |
| Order entry Microbiology section | Orders & Patients → Add Order | existing order entry breadcrumb | existing Enter Order route (Clinical Order Entry v4) |
| Culture setups admin | (removed from Admin → Microbiology Reference Data) | n/a | existing route retired; redirects to Microbiology Reference Data |

---

## User Stories

1. As a **reception clerk**, I want to add micro tests in the same test picker as every other test, and nothing else, so that micro requests move through reception as fast as any other order.
2. As a **microbiology technician**, I want to add the tests I decide to do (smear, GeneXpert, Gram, a DST panel) to the case at the point I do them, so that I am not blocked by a workflow someone declared in advance.
3. As a **technician at a district laboratory**, I want to record my microscopy and refer the rest of the work to CPHL, so that the results come back to the same case and the clinician gets one report.
4. As a **technician on the culture bench**, I want to be told when plates are due to be checked and when incubation is complete, so that no culture is read late or forgotten.
5. As a **technician working at a bench with no computer**, I want to print the plates due today with each patient's name and lab number, tick them off and write the readings, and then enter them in the same order, so that nothing is missed between the bench and the screen.
6. As a **microbiology validator**, I want expert rule flags resolved before I accept results, and to choose which results appear on the patient report, so that impossible phenotypes, internal work-up and suppressed antibiotics never reach the clinician.
7. As a **laboratory manager** whose one Microbiology section does bacteriology and TB, I want a sputum's TB culture and bacterial culture to stay separate cases, so that each follows its own rules whatever our lab units are called.

---

## Amendments

### A-01. One catalog switch, Opens a Microbiology case; no culture type; culture setups are removed

| ID | Requirement |
|---|---|
| FR-01.1 | **One catalog switch: Opens a Microbiology case** (D-178, replacing the Microbiology case dropdown of D-162). The test catalog's Culture workflow attribute is replaced by a **Yes / No** switch, **Opens a Microbiology case** (default No). No means the test never opens or joins a case (serology such as RPR or Widal, a CBC, even in a micro lab unit). Yes makes it a **micro test**: culture tests (Bacterial culture, Blood culture, TB culture, Fungal culture), direct tests (Gram stain, wet preparation, AFB smear, Xpert MTB/RIF Ultra, line probe assay, screening plates) and case tests (FR-01.1b). There is no culture type: a case is not TB or bacterial by configuration. A second field, **Case role** (shown when the switch is Yes; default Direct), says what the test is on the case: **Culture** holds a culture result (a generic culture test), **Direct** is a test on the specimen, **Case** is a case test. UNASSIGNED is retired. |
| FR-01.1a | **Collected in sets.** A generic culture test can be marked **Collected in sets** in the catalog (Blood culture). Its samples on one order form one case (FR-02.4a). |
| FR-01.1b | **Case tests** (D-177, as amended by D-178). A micro test with Case role **Case** is a case test (for example "Microbiology case", "Wound swab for culture" or "TB case"): reception orders it on a sample to send that sample to the test's lab unit (its catalog test section) as a micro case before anyone knows which tests will be done. It holds no result of its own and prints nothing; the results added on the case print as usual (A-11), and it is complete when the case is finally released. A lab unit can have **any number of case tests**, each with its own name and sample types, so reception picks the one that reads like the request form. A new one is made by **Duplicate** on an existing case test (a copy whose name and lab unit the administrator edits) or by creating a test with the switch on and Case role Case. No other configuration is involved. |
| FR-01.2 | **What used to depend on the culture type now follows what is on the case** (D-178). **TB questions** (TB history, treatment month) come from the case Program's questionnaire (FR-03.7). **TB resistance classification and the NTM outcome** (A-14) apply to isolates identified as *M. tuberculosis* complex or as a non-tuberculous mycobacterium. **Breakpoints** are chosen per panel; the default follows the organism (FR-07.3). **Contaminated** is an outcome on every culture row. **Exports and surveillance** (WHONET, the antibiogram, GLASS, National TB Programme reports) choose cases by the reporting track of the case Program (FR-19.3). Sections, tests and panels never depend on a type. |
| FR-01.3 | **Culture setups** (the per-workflow media and incubation recipes, "protocol lanes") are retired. The admin screen is removed. Existing setup rows are kept read-only for the history of cases that used them (No Hard Delete). |
| FR-01.4 | The culture protocol is no longer derived at order entry and is no longer shown or set on the case. Media, incubation and atmosphere are recorded per inoculation by the technician (A-05). |
| FR-01.5 | **AST and DST panels** are offered by organism group (M-01), not by workflow type. The panel's required `workflow_type` is replaced by its **interpretation model** (clinical breakpoints or TB critical concentrations, FR-07.3). |
| FR-01.6 | **Migration.** The case key becomes order + sample type + lab unit (FR-02.4). Existing cases keep their identity and members; two existing cases that now share a key are not merged, and the migration lists them for review. `MicroCase.workflow_type` stays stored and read-only: a case with no Program gets the program mapped to its old value (BACTERIOLOGY to the deployment's bacterial program, MYCOBACTERIOLOGY_TB to the TB Program, MYCOLOGY to the mycology program, or the bacterial one when there is none) with the Timeline note "Program set by migration", and the migration lists them for review. UNASSIGNED cases are treated the same way. A test with a non-empty `test.culture_workflow_type` gets the switch on; today's generic culture tests get Case role Culture; direct tests used on cases today get the switch on with Case role Direct. Every case's lab unit label is set from its generic culture test's lab unit, otherwise from its first linked analysis. Culture setup references stay stored and are not read. |
| FR-01.7 | **History stays readable.** Timeline events WORKFLOW_CHANGED, CULTURE_PROTOCOL_CHANGED and CULTURE_PURPOSE_CHANGED keep rendering with their labels. |
| FR-01.8 | **Retired endpoints and configuration:** `PUT /cases/{id}/workflow` (no replacement: there is no culture type, FR-02.7), `PUT /cases/{id}/protocol`, `/admin/reference/culture-setups`, the `workflow` parameter on `/reference/ast-panels` and `/reference/culture-methods`, the `org.openelisglobal.microbiology.defaultWorkflow` property, and the culture setup and UNASSIGNED seeding in `MicrobiologyUatScenarioService`. |

> **Contradicts V1**
> **Where:** M-00 (decision "the ordered test carries a workflow_type"); M-03 §2.1a, §2.3 (Culture Protocol row), §2.3b; M-04 §2A, §3 (UNASSIGNED rows), §4.9a, §8, AC-M04-22 to AC-M04-24; M-14 §2 ("TB is its own workbench profile"); M-01 §6 and AC-M01-C-* (culture protocols); `test-catalog-microbiology-workflow-attribute` (every culture test carries the attribute).
> **V1 said:** every ordered culture test declares `workflow_type`; it selects the case profile, breakpoint family, organism vocabulary and WHONET flavour; the protocol is the test's default Method with culture parameters; a case can be UNASSIGNED.
> **v2 says:** one Yes / No switch marks micro tests (cultures, direct tests such as Gram, AFB smear and Xpert, and case tests), with a Case role; there is no workflow or culture type: TB behaviour follows the Program and the organism, breakpoints are chosen per panel, and exports follow the Program's reporting track. No protocol, no UNASSIGNED, no profile-specific sections.
> **Build state:** Built (`MicroWorkflowType`, `MicroCase.workflow_type` NOT NULL, `uq_micro_case_sample_workflow`, `MicroCultureSetup`, `MicroAstPanel.workflowType`, `test.culture_workflow_type`, `MicroCaseWorkflowServiceImpl`, `MicroCaseProtocolServiceImpl`).
> **Rework:** replace the attribute with the Yes / No switch and add Case role and Collected in sets; stop reading `workflow_type` (kept for history); change the case key to order + sample type + lab unit; drop UNASSIGNED; replace the panel's `workflow_type` with its interpretation model.

### A-02. The case opens for the first micro test on a sample type in a lab unit; the lab unit decides who works it

| ID | Requirement |
|---|---|
| FR-02.1 | **Eligible lab units** are those with at least one active micro test (FR-01.1). Nothing else marks a lab unit as microbiology. CPHL, for example, has "Bacterial culture" in Microbiology, "TB culture" in TB and an environmental culture in Environmental Microbiology; a laboratory with one Microbiology section puts all its generic culture tests there. Environmental and clinical cultures stay in separate lab units (D-120). |
| FR-02.2 | **Routing does not read the order's Program** (D-146, retiring D-131). Adding a micro test does not set or lock Program, and a case opens whatever Program the order has. The built auto-set, the save guard in `ProgramSection` and the order entry Microbiology section are removed. The case has its own **Program** in Case information (FR-03.7), which defaults from the order's Program when that program is shown on micro cases. |
| FR-02.3 | **Reception orders micro tests like any other test, and the first one opens the case** (D-162). There is no micro section at order entry. Micro tests are picked in the ordinary test and panel picker (Clinical Order Entry v4 FR-B14) on the sample they apply to, offered for the sample types they accept, including "used as" sample types (D-076). The first micro test on a sample opens its case (FR-02.4), whether or not a culture is ordered: a sputum for Xpert MTB/RIF Ultra alone, an AFB smear alone or a Gram stain alone is a case. This is the default workflow for all microbiology work. A culture ordered later, by a reflex rule, in Edit order or with **+ Add culture** on the case, joins that case. A sample with no micro test opens no case. |
| FR-02.3a | **Reception can assign a sample to a lab unit with a case test** (FR-01.1b, D-177). Ordering a case test on a sample opens a case in that test's lab unit on save, with no tests yet; the technician fills in Case information (including the Program) and adds the tests. Program on the order plays no part (D-146). Users see the case by its lab unit, as for every case (FR-12.3): a user with rights in several lab units sees the cases of all of them, and **Change lab unit** transfers it (FR-02.6). |
| FR-02.3b | **Live summary before saving** (D-190, Mohamed review 3.1, 3.4). While micro tests are on the order, order entry shows a **What this order will open** panel beside the Ordered tests table (Clinical Order Entry v4 FR-B18), updated as tests and samples change, in plain sentences: one line per case it will open ("Blood culture case in Microbiology: 2 sets, 4 bottles", "TB case in TB unit: sputum -1"), the tests that stay in ordinary Results ("RPR stays in Results"), and the reflex rules that may add tests later, with the rule name ("If Blood culture result = Positive: adds Gram stain, culture"). It warns, without blocking, when a micro test will open a case in a lab unit the order has no other work in, or when a sample's tests split across lab units ("This sample opens 2 cases: TB unit and Microbiology"). Each line has a text Tag (Opens a case, Stays in Results, Referred, Tested elsewhere), never colour alone. It reads the same rules the save applies (FR-02.4, FR-02.4a, the catalog switch); it saves nothing. |
| FR-02.4 | **One case per order, sample type and lab unit** (D-178). The micro tests of one order on samples of the same **sample type** whose tests belong to the same **lab unit** (their catalog test section) form one case: a spot and an early-morning sputum on one order are one case; replicate environmental swabs of one type from one site are one case. For environmental samples the site is part of the key, because it is the case's subject (M-18 FR-D1): swabs of one type from two sites on one order open two cases. Micro tests of another lab unit on the same sample open that lab unit's case (at CPHL, the TB culture in TB and the bacterial culture in Microbiology), and the two show each other as related cases. A sample of another sample type opens its own case. A later order (a follow-up sputum next week) opens a new case, and Patient history links them (A-21). |
| FR-02.4a | **Culture sets** (D-163). For a generic culture test marked Collected in sets (FR-01.1a, Blood culture), reception records **each bottle as its own sample** with its own container type, body site and collection time (Clinical Order Entry v4; for example two sets from two venipunctures are four samples: -2 aerobic and -3 anaerobic from the left arm, -4 aerobic and -5 anaerobic from the right arm). All samples of one order that carry that test form **one case**, whatever their sample type (aerobic and anaerobic bottles), site or collection time, so "coagulase-negative staphylococci in 1 of 2 sets" is read on one case and prints as one culture block. Each sample becomes its own culture row with its sample label as container identifier and its own site shown on the row (FR-05.4c). **Set number** (D-192, Mohamed review 3.2): reception gives each bottle its set (Set 1, Set 2, ...) in the sample's row at order entry, a required field on samples carrying a test collected in sets (Clinical Order Entry v4 section N); the first bottle defaults to Set 1 and each later bottle to the set of the bottle above it. Site and collection time check the grouping but never decide it: at save, a warning (never a block) names a set with one bottle, two bottles of the same container type in one set, bottles of one set collected at different sites or more than 30 minutes apart (a lab setting), and a paediatric bottle in a set with adult bottles. **Number of sets** is the count of set numbers, shown read-only in Case information. One order is one collection episode: bottles drawn later for a new clinical episode are a new order, which opens a new case (FR-02.4). Other tests follow FR-02.4 (one case per order, sample type and lab unit); environmental replicate swabs stay one case (M-18). The case header shows the set ("Blood culture: 2 sets, 4 bottles") with one line per set ("Set 1: left arm, 07:25, aerobic and anaerobic | Set 2: right arm, 07:31, aerobic and anaerobic"), and a warning Tag on a set that drew a set warning and the header overflow menu offers **Split into separate cases** (a member sample with no results on the case moves to its own related case; reason required; recorded on both Timelines). |
| FR-02.5 | **Which tests join a case.** A case holds the micro tests on its samples that belong to its lab unit when they are ordered. Tests with the switch off (a CBC on the same tube, a chemistry on the same fluid, serology in the micro lab unit) are not part of the case and stay on the ordinary Results and Validation screens. Changing the case's lab unit (FR-02.6) never moves tests in or out. When a test could join either of two related cases, it joins the one opened first, and the technician can **Move to related case** (reason required, on both Timelines). |
| FR-02.6 | **Change lab unit** (case header) relabels the case: it moves to that lab unit's Worklist and to the rights of that lab unit's users (Access). It is recorded on the Timeline (who, when, from, to) and needs no reason. It does not change the case's identity, Program or tests, and linked analyses keep their catalog test section. It is blocked after final release (A-17). Only eligible lab units of the case's domain (FR-02.1) are offered. If the target lab unit already has a case for the same order and sample type, Change lab unit offers to **join it** instead (reason required, on both Timelines); splitting, merging or renaming lab units never splits or merges cases by itself. A case whose lab unit is later deactivated stays reachable from case search and the Worklist of users with rights in it, with the header prompt to relabel. |
| FR-02.7 | **Change culture type is retired** (D-178): a case has no type. What is done changes by adding or cancelling tests; how the case is reported changes by changing its Program (FR-03.7). |
| FR-02.8 | **Edit order** (inside the step's all-or-nothing save, D-072). Adding a micro test after save opens the case or joins it. Cancelling the last micro test on a case with no results cancels the case after a confirmation (No Hard Delete); with results, it needs a reason and the case keeps its results as cancelled. Cancelling every test on the sample does the same. |
| FR-02.9 | **Electronic orders** arriving with a micro test open the case when the order is accepted, like a manual order. |
| FR-02.10 | **Reflex across cases.** A reflex rule that adds a micro test of another lab unit opens that lab unit's related case on the same sample (M-03 §2A); one that adds a culture to an Xpert-only case (rifampicin resistance detected) adds it to that case. A reflex that adds an ordinary test places it in the case whose result triggered it. |
| FR-02.11 | **A Tested elsewhere test** (Clinical Order Entry v4 FR-B20; no sample) is not part of a case. To bring such a result into a case, the technician records the result as Tested elsewhere on the case (FR-06.3). A received isolate is the exception (FR-02.13). |
| FR-02.12 | **UAT P-1 and P-2** (the duplicate "Microbiology" program and the Bacteriology program wired to the wrong test section) no longer affect routing, since routing never reads Program; the duplicates are cleaned up in the migration as data hygiene. |
| FR-02.13 | **Received isolates** (D-194). An isolate sent by another laboratory for identification, AST or referral is ordered like any sample: reception picks the **Isolate** sample type (FR-10.1c) and the micro tests to do here (for example the generic culture test and an AST panel), and ticks **Tested elsewhere** on the generic culture test (Clinical Order Entry v4 FR-B20). Tested elsewhere asks for the **sending laboratory** (required, the Organizations list picker, defaulting to the referring facility; no free text) and offers the **reported organism** (optional, the organism list), which is the culture result the sender reported. Unlike FR-02.11, this Tested elsewhere test has a sample, so it opens the case (one case per order, sample type and lab unit, FR-02.4). The case opens with **ISO-1** already present, tagged **Received from {laboratory}**, and its culture side closed as **Growth (received isolate)**: there is no inoculation of a primary specimen, and a purity or identification subculture is added as on any isolate (A-10). Case information adds **Original specimen type** (required before final report, FR-03.4; the sample types list, no free text), which surveillance uses (FR-19.5a); the collection date is the sample's collection date. The sender's reported organism stays on ISO-1 as **Reported identification**, separate from the identification made here; when they differ, validation shows "Identification differs from the sender's" for the validator to acknowledge (A-17). |

> **Contradicts V1**
> **Where:** M-03 §2.1 ("Program is a derived signal, not the trigger"), §2.1a (resolver catches any culture test, deployment default workflow), §2.2 (Microbiology section at Step 1); M-04 §4.9 (Change workflow); M-18 FR-C1; Clinical Order Entry v4 FR-B12a (v0.12 Culture rows).
> **V1 said:** every culture test declares a workflow, and the resolver opens the case from it; Program = Microbiology is set by a culture test, blocks other Programs and shows a Microbiology section; the bench changes the workflow with Change workflow.
> **v2 says:** only micro tests (switch on: culture, direct or case test) open cases, ordered in the ordinary test picker; one case per order, sample type and lab unit; the order's Program plays no part, and the case has its own Program in Case information; there is no culture type to change; the lab unit decides who works the case and can be changed.
> **Build state:** Built (`MicroOrderRoutingServiceImpl`, `ProgramSection.jsx`, `isMicrobiologyOrderReady`, `ChangeWorkflowPanel`). Not built: Edit order routing (`SampleEditServiceImpl` never routes micro cases) and a way to open a case after order entry.
> **Rework:** route on micro tests (switch on) by order, sample type and lab unit; remove the Program auto-set, guard and order entry Microbiology section (`isMicroOrder` stops reading the Program); add Edit order routing (FR-02.8) and Split into separate cases as new work.

### A-03. Case details move from order entry to the Case view

| ID | Requirement |
|---|---|
| FR-03.1 | Order entry shows no micro fields (A-02). All micro fields move to a **Case information** section on the Case view, edited by the technician from the request form. |
| FR-03.2 | **Clinical cases:** **culture purpose** (A-19), patient origin (defaulting from the requesting organization, as built), date of admission, number of sets (computed for tests collected in sets, FR-02.4a), clinical diagnosis and reason for test, **clinical history** (a multi-line text area about six lines tall with a character counter, up to 4000 characters; the column is already `text`, so only the built 1000-character check changes), **prior antibiotics** (agent and date, repeatable), and specimen **collection method** (for example midstream, catheter, aspirate, first-void, peripheral or line). Sputum **collection timing** (Spot or Early morning) is recorded per sample in the Samples list (FR-04.3). TB history, treatment month and the TB register specimen number are questions in the TB Program's questionnaire (FR-03.6, D-186), not case fields. |
| FR-03.3 | **Environmental cases:** purpose (per case, defaulting to Routine monitoring, FR-03.3a) and replicates (per order, M-18 FR-C5a), sampling site (interim) or ward (D-101, once Locations & Organizations lands). No patient fields. |
| FR-03.3a | **Clinical details shared by related cases.** Patient origin, admission date, clinical diagnosis, clinical history and prior antibiotics describe the patient, as do the Program questionnaire answers (one record per order, FR-03.6), so an edit on one case shows on every case of the same order, with the helper "Applies to all {count} cases on this order", and is recorded on each Timeline. Culture purpose, number of sets and collection method describe the specimen and are per case; clinical purpose defaults to Diagnostic (there is no order-level purpose now that order entry shows no micro fields) and environmental purpose defaults to Routine monitoring (M-18 FR-C5a), so a screening rectal swab and a diagnostic blood culture on one order can differ. |
| FR-03.4 | **Required fields are marked where they are** (Clinical Order Entry v4 FR-A8), at two levels: **required to save** (asterisk) and **required before final report** (the same marker plus the helper text "Needed before final report"). The final-report checklist (M-04 §4.6) names every missing field and links to it. |
| FR-03.5 | **Levels:** Culture purpose is required to save and defaults to Diagnostic, so it never blocks and is never blank. Required before final report, to confirm with CPHL: patient origin, the **Program** (FR-03.7), and the questions its questionnaire marks required before final report (TB history for the TB Program). All other Case information fields are optional. Nothing in Case information blocks the case from opening. |
| FR-03.6 | **Program questions are the Program's questionnaire** (D-186). Case information renders the questionnaire attached to the case's Program in the existing Programs admin, with the same questionnaire component order entry uses for program questions (no micro-specific question fields). For example, the TB Program's questionnaire holds TB history, treatment month and the TB register specimen number; an AMR surveillance programme's might hold device in place and antibiotics in the last 48 hours. A question marked required in the questionnaire is required before final report (FR-03.4). When the order was filed under that Program and the questionnaire was answered at order entry, the answers show here, editable until final release; changing the Program swaps the questionnaire and keeps earlier answers on the Timeline. **One record, wherever it is answered** (D-198): the answers are the order's built QuestionnaireResponse (`questionnaire_response`, linked through `program_sample.questionnaire_response_uuid`), whether answered at order entry or on the case. The case reads and writes that same record through the built `QuestionnaireStorageService`, so an edit on the case also updates the FHIR store copy when one is configured (the built local-first write, then the FHIR mirror), and order entry shows the case's edits. Each answer shows where it was last changed (Order entry or Case), by whom and when, from the audit trail. A CSV export of questionnaire answers is an Open Question. The case's own fields stay: culture purpose, patient origin, date of admission, clinical diagnosis, clinical history and prior antibiotics (FR-03.2), and the derived infection origin for Bacterial-track Programs. |
| FR-03.6a | **What the order's clinical information drives** (D-198; Mohamed review Q1, Q2). **Provisional diagnosis** (order entry) is informational: it shows in Case information and prints where the report template prints it, and drives no routing, priority, reflex rule or alert. The case **Program** drives two things only: its **Reporting track** decides the surveillance exports (FR-19.3), and its questionnaire's required questions are required before final report (FR-03.4). Nothing about the Program routes work: routing follows the micro tests and the lab unit (FR-02.2). **Priority** is the order's priority (Routine or STAT), shown in the case header and on the Worklist. |
| FR-03.7 | **Program on the case** (D-178). Case information has a **Program** dropdown listing the programs that have **Show on Microbiology case** on in the existing Programs admin (no separate admin screen). Each of those programs has a **Reporting track** set beside the toggle, from the Dictionary category **Reporting track** (D-187, D-207; seeded **Bacterial**, **TB** and **Mycology**, extendable by the laboratory), not a hard-coded list. Each export says which tracks it takes. The Program defaults to the order's Program when that program is shown on micro cases, otherwise it is empty; it is required before final report (FR-03.4) and can be changed until final release (Timeline; flags the case for re-export, FR-19.7). It brings its questionnaire into Case information (FR-03.6), and its track decides which exports and reports include the case (FR-19.3). When an isolate is identified as *M. tuberculosis* complex on a case whose Program is not on the TB track, the case shows "MTB identified: check the Program for TB reporting". |

> **Contradicts V1**
> **Where:** M-03 §2.2, §2.3 (Step 1 micro fields), §2.3a ("M-03 owns Date of Admission because reception has it in front of them"); M-18 §C, AC-M18-07; Clinical Order Entry v4 FR-B12.
> **V1 said:** reception captures the micro details at Step 1.
> **v2 says:** the technician captures them on the Case view; culture purpose stays required, with a default.
> **Build state:** Built (`MicroCaseOrderDetail` written at order entry, copied per routed case; `culture_purpose` required by `validateOrderDetail`).
> **Rework:** order entry stops showing the fields; the Case view edits the same records; patient-level fields propagate across the order's cases (FR-03.3a).

### A-04. Case header shows what the case is and who works it

| ID | Requirement |
|---|---|
| FR-04.1 | The header shows the **Program** and its reporting track (or "Program not set"), the **case lab unit** (with Change lab unit), sample type, **body site and side** (D-079; for a case with several samples, "4 samples, 2 sites" linking to the Samples list, FR-04.3), the stage, and the **related cases** on the same sample in other lab units as a switcher ("Also on this sample: TB unit"), so the user always knows which case they are in and who is working it. |
| FR-04.2 | Body site is captured at order entry (D-079). Correcting it from the Case opens the order's steps at that sample (D-077: a saved order is changed only through its order entry steps), with the same picker (Clinical Order Entry v4 FR-D4, FR-N4): a **search-first ComboBox** over the sample type's allowed body sites (type to filter; the list can hold hundreds of sites, D-007), with Side when the site has one; the correction offers a label reprint and is recorded on the case Timeline. It travels to the report and WHONET export unchanged. |
| FR-04.3 | **Every sample keeps its own body site and collection time.** Case information lists the case's **Samples** (sample number, sample type and container, body site and side, collected at, collector), one row per sample, so a blood culture case with two sets from two arms shows four bottles with their own sites and times. Each sample's site and time are recorded at order entry per sample (Clinical Order Entry v4 section N) and corrected the FR-04.2 way, sample by sample. A case with one sample shows the same list with one row. Culture rows show the sample they were inoculated from. |
| FR-04.4 | *Retired (draft 10, D-178).* The Choose path step of draft 9.7 is removed: there is no path or culture type. A case opened by a case test starts at Case information, where the technician sets the Program, and its tests are added on the case. |

### A-05. Incubation becomes computable, with check reminders

| ID | Requirement |
|---|---|
| FR-05.1 | Each inoculation row records the **container identifier** (required, as today), **medium and lot** (FR-05.1b, or a Not tracked medium, FR-05.1c), **atmosphere** (required dropdown, FR-05.1a), **temperature** (°C), **incubation duration** (number) with a **unit** dropdown (Hours, Days), optionally **Check every** (number + unit), and, for any other reagent linked to the test, the **reagent lot** (existing reagent lot picker, M-12). Duration and unit are required. Subcultures keep their required parent inoculation. |
| FR-05.1a | **Atmosphere dropdown.** Required on every inoculation and subculture row. The values are the **Dictionary** category **Culture atmosphere** (D-187), seeded with **Aerobic (ambient air)**, **CO₂-enriched (5 to 10%)**, **Candle jar**, **Anaerobic**, **Microaerophilic**; the laboratory adds or deactivates values in Admin › Dictionary (No Hard Delete), not free text. It pre-fills from the medium's usual atmosphere when its Inventory item records one (FR-05.1d), otherwise from the previous row (FR-05.2). The chosen value shows in the row's Atmosphere column and on the Timeline, and a change after inoculation is recorded with who and when. |
| FR-05.1b | **Medium** (D-164). The technician sets the medium on every row, including blood culture bottles (nothing is taken from the sample's container type). **Medium** is a search-first ComboBox (D-007) over active **Microbiology medium** items (FR-05.1d), each shown with a **Tracked** or **Not tracked** tag. A **tracked** medium shows **Lot**, required: that item's lots, usable lots first by earliest expiry, with the lot last used in the case lab unit preselected; expired, QC failed, quarantined and consumed lots are shown disabled with their reason (existing inventory lot rules and the reagent lot picker's messages). Scanning a lot barcode fills Medium and Lot together. **No automatic stock change** (D-169): saving the row records the medium and lot on the row for traceability (which lot was on which plate), and writes no inventory usage or transaction; stock is kept in Inventory with its own receipt, consumption and adjustment actions, as today. Each subculture records its own lot. A **not tracked** medium has no lot; the row shows the Not tracked tag and the Timeline records it. |
| FR-05.1c | **Add new when a medium is not found** (D-164). When the search has no match, **Add new: {name}** creates a **not tracked** Microbiology medium item with that name (no lot, no count) and uses it on the row; everyone sees it in the search from then on. Inventory staff can later make an item tracked by receiving a lot, and can deactivate duplicates (No Hard Delete). There is no separate untracked list. When the case lab unit has **Require tracked media** on (FR-05.1f), Add new is not offered and a not tracked medium cannot be used. |
| FR-05.1d | **Microbiology medium items** (D-202, following D-037). "Microbiology medium" is an Inventory **type tag** (seeded, so the medium search can filter on it), not a new item type enum value; **Tracked** is the Inventory redesign v1.9 per-item **Track lots** property, not a micro-only flag. Micro depends on that property landing, or ships it as the first slice of Inventory v1.9. An item is **Tracked** (it has lots in Inventory, received as for reagents; the culture row records which lot was used but never changes stock, FR-05.1b) or **Not tracked** (a name only, no lots, no count, never in stock reports); an item created by Add new (FR-05.1c) starts Not tracked. The form uses the reagent fields (name, code, manufacturer, catalog number, units such as plate, tube, bottle or slant, storage, stability after opening, low stock and expiry alerts) and adds two optional fields shown only for this type: **Usual atmosphere** (the FR-05.1a list) and **Usual temperature (°C)**, which pre-fill the inoculation row. Lots are received as for reagents; a batch prepared in-house is received as a lot with its batch number (D-196, Mohamed review 1.4): the preparing laboratory is the lot's supplier or manufacturer, the preparation date is its received date, and its expiry date, QC status and storage location are the built lot fields (developer to confirm the field mapping). Lot QC status uses the existing inventory QC states; a media QC workflow stays out of scope. |
| FR-05.1e | **Inoculated at is editable** (D-176). Each culture row's **Inoculated at** defaults to the save time and can be changed to the time the plate or bottle was actually inoculated (rows are often set up and labelled on the case before the technician goes into the inoculation room), up to the current time and not before the sample was received. It can be edited until the row's first reading; **Incubation ends** and **Next check** recompute (FR-05.3), and the change is recorded on the Timeline with who, when and the old and new times. Start inoculation and Inoculate on the Worklist (FR-12.6c) have the same field, applied to every row they create. |
| FR-05.1f | **Require tracked media** (D-196). A lab unit setting, default off. When on, every culture row in that lab unit needs a tracked medium and a usable lot (not expired, QC not failed); the medium search lists only tracked items, Add new is hidden (FR-05.1c), and the Worklist Inoculate panel requires a lot for every medium (FR-12.6c). Rows saved before it was turned on keep their not tracked media. |
| FR-05.1g | **Used on cultures** (D-197, keeps D-169). Inventory shows, for each Microbiology medium lot, a read-only **Used on cultures** count with a date range and a list of the culture rows that recorded it (lab number, container identifier, date, technician), for the stock keeper to reconcile against stock. It is computed from the culture rows; nothing at the bench changes stock or asks for a quantity. |
| FR-05.2 | **Pre-fill.** A new row pre-fills from the culture test's linked media for the sample type (FR-05.2a) when there are any, otherwise from the previous row on the same case. |
| FR-05.2a | **Plating is the culture test's media links** (D-208, amends D-165; analyze F-16). There is no Plating templates admin. The Test catalog's built Reagents section (`test_reagent_link`, `/rest/test-catalog/{testId}/reagents`) becomes **Reagents and media** and also accepts Microbiology medium items. A medium link carries, beside the built fields: **Sample type** (optional; blank means any, because one generic culture test serves many sample types), **Order**, **Duration** with unit, optional **Check every**, and optional **Loop volume**; atmosphere and temperature come from the medium item's usual values (FR-05.1d) and can be overridden on the link. A medium link has no quantity and never consumes stock (D-169, D-197). For example, Bacterial culture links CLED agar and blood agar for Urine; blood agar, chocolate agar and MacConkey agar for Sputum; XLD, MacConkey and selenite broth for Stool; Blood culture links the bottle only. On **Start inoculation** the culture test's media for the case's sample type are proposed as ticked rows; the technician unticks, adds or changes rows and picks a lot for each tracked medium. The links are a suggestion, not a gate: nothing on the case depends on them, no protocol is stored (A-01), and the Timeline notes that the linked media were applied. Removing a link is the Reagents section's existing remove; rows already made keep their media. |
| FR-05.3 | The system computes, from the server clock in the laboratory time zone (D-075), **Incubation ends** (inoculated at + duration) and, when Check every is set, **Next check** (last check or inoculation + interval). |
| FR-05.3a | **Extend incubation** (D-179). Every open culture or subculture row (Incubating, Check due, or a plate with growth, but not a bottle that has flagged positive or a row with an outcome) has **Extend incubation** in its row menu, for when colonies are not mature enough to read, identify or pick, or a slow-growing or fastidious organism is suspected. The technician enters **Extend by** (number, Hours or Days) and a required **Reason** from the Dictionary category **Extend incubation reason** (D-187; seeded **Colonies too small to identify or pick**, **Slow-growing organism suspected**, **Fastidious organism suspected**, **Clinician request**, **Other** with a note). The form shows the **New incubation end** before saving. Saving adds the time to the row's incubation: **Incubation ends** moves, **Next check** keeps its interval, the row shows a "+ {n} {unit} extended" tag next to its duration (one per extension, so the history stays visible), and the read log and Timeline record who, when, how long and why. A row can be extended more than once. Extending clears a pending Final read due for that row. |
| FR-05.4 | When a check falls due, the row shows **Check due** and the case appears under **Needs attention** on the Worklist with the reason "Check due". **Record reading** on the row records a coded reading from the Dictionary category **Culture reading** (D-187; seeded **No growth**, **Normal flora**, **Mixed growth**, **Significant growth**), with an optional quantity from the category **Culture quantity** (seeded CFU/mL bands for urine, and scanty / + / ++ / +++) and a note. The bench sheet's reading codes are the dictionary entries' short codes. Each reading is kept with its date, who and the incubation day, so Day 1, Day 2 and extended reads stay visible as a **read log** on the row and on the Timeline. It sets the next check. |
| FR-05.4a | **No growth from the Worklist.** A due culture row can be read No growth from the Worklist without opening the case (FR-12.6a, FR-12.6b): a check records the reading and sets the next check; a final read also records the row outcome. Every other reading is recorded on the case. The Worklist writes need a connection (disabled while offline). |
| FR-05.4b | **Positive at and time to positivity** (D-180). Every row that turns positive records **Positive at**, an exact date and time to the minute: from the analyzer's positive signal where it sends one (M-04 §7, matched by container identifier), otherwise defaulting to the **server time** when the technician uses **Mark positive** or records the first Significant growth reading. Mark positive opens a small form with Positive at pre-filled to now and editable (not before Inoculated at and not in the future) and the computed time to positivity, before it saves. A positive row shows **Positive**, the date and time ("29 Sep 22:18"), who or which analyzer, and **Time to positivity** from Inoculated at in days, hours and minutes ("13 hours 48 minutes", "1 day 3 hours 4 minutes"; days only when there is at least one). **Edit positive time** on the row changes Positive at later, with the same limits; the Timeline keeps the old and new times and, for an analyzer time, that it was edited by hand. This applies to every positive culture and subculture row, whatever the medium or incubation length. |
| FR-05.4c | **Several cultures on one case, each with its own outcome.** A case can hold several inoculation rows at once (for example two blood culture bottles, aerobic and anaerobic; a sputum on MGIT and on LJ; a urine on blood agar and on a chromogenic plate). Each row has its own **Mark positive** and **Mark no growth** (with the built confirm step), its own readings, time to positivity and outcome. Marking one row positive does not touch the others: an anaerobic bottle can still be incubating after the aerobic one flagged. An analyzer positive signal marks only the row whose container identifier it matches. |
| FR-05.4d | **Instrument negatives** (blood culture and MGIT instruments that send "negative, protocol complete" at the end of the protocol, for example 5 days or 42 days). Matched by container identifier, the signal shows on that row as a proposed reading "No growth, protocol complete (instrument)" with **Confirm**. Confirming records the No growth reading and the row's outcome with who and when; nothing is recorded without a person. The case lists the proposal under Needs attention ("Instrument negative to confirm"). |
| FR-05.4e | **Quantitative cultures are catalog setup** (D-200, Mohamed review 2.6). A urine culture needs no micro-specific fields: the loop volume is part of the medium link (FR-05.2a); the colony count and CFU/mL are components of a multi-component culture result or a reading quantity from the **Culture quantity** dictionary (D-187); CFU/mL from loop volume and colony count can be a calculated value set up in the existing calculated value test admin (developer to confirm it applies to case results); the number of colony types and a preliminary description are reading notes or result components; significance is a reflex or expert rule on the quantity (M-06). An isolate keeps its source row (FR-05.4c). |
| FR-05.5 | When a row's incubation ends, the row shows **Incubation complete** and the case appears under Needs attention with that reason until the technician records that row's outcome: **Growth** (the row's work-up actions, A-10), **No growth** (when it is the last open row, allows the final negative report), or **Contaminated**. **Mixed growth** and **Contaminated** offer **Request repeat specimen**, which uses the existing NCE and repeat request path. Row outcomes roll up to the case stage as defined in A-17. |
| FR-05.5a | **The culture result is a result** (D-189). Each culture row's outcome (**Positive** with its Positive at, FR-05.4b; **No growth**; **Contaminated**) and the case's rolled-up culture result are stored as results of the generic culture test (for example "Blood culture: Positive"), not only as row states. That is what the existing reflex engine (M-06) and the M-11 critical rules read, so "Blood culture result = Positive, then add Gram stain, culture on that bottle" is an ordinary reflex rule in Admin › Reflex Tests, configured and switched off like any other, not seeded code (FR-10.1g). |
| FR-05.6 | Extending incubation is the Extend incubation action with a reason (FR-05.3a, D-179), never an edit of the duration. The clock never resets: it always measures from the inoculation time. |
| FR-05.7 | **Late growth revives the case.** A growth reading or analyzer positive signal on a row already marked No growth reopens the culture (case stage back to Growth detected, AC-M04-10). If the negative report was already final, the revival opens an amendment (A-17). |
| FR-05.8 | **TB decontamination** (NALC-NaOH) keeps the built aliquot path: the decontaminated sediment is a child aliquot of the specimen, with volume and parent link, and inoculations record which aliquot they used. Aliquots belong to the parent specimen's case; they are not related cases. |

> **Contradicts V1**
> **Where:** M-04 §4.2, §4.9a ("the incubation clock recomputes against the new Method's max_incubation_days"), AC-M04-24; M-07 §3 ("Day n of max" from the culture setup); AC-M07-10 (the Worklist makes no writes).
> **V1 said:** incubation hours and maximum days come from the Method / culture setup; the inoculation `incubation` field is free text; positive and no growth are marked once for the whole case; the Worklist is read-only.
> **v2 says:** duration is entered per inoculation as number + unit and drives the Worklist; each culture row is marked positive or no growth on its own; the Worklist can record No growth readings and inoculate many cases at once.
> **Build state:** Built (`MicroCaseInoculation.incubation` and `.atmosphere` are free text; `MicroWorklistCultureTimingContext` reads the setup; the analyzer positive-signal event carries no signal time and applies to the case).
> **Rework:** structured fields on the inoculation; Worklist timing reads the inoculation rows; analyzer signal time and per-inoculation targeting (Dependencies).

### A-06. New Initial testing section, before inoculation

| ID | Requirement |
|---|---|
| FR-06.1 | A new **Initial testing** section sits after Case information and before Culture. It holds the tests done directly on the specimen. Typical CPHL examples: **Macroscopy** (appearance, colour, clarity, consistency; blood, mucus, pus; stool form; for TB, sputum quality and volume), **Wet preparation** (pus, red and epithelial cells; yeasts, *T. vaginalis*, clue cells; ova, cysts, parasites; casts and crystals), **Gram stain**, special stains (India ink, KOH, cryptococcal antigen), **AFB microscopy** (Ziehl-Neelsen or auramine, WHO/IUATLD grade negative / scanty with count / 1+ / 2+ / 3+), **Xpert MTB/RIF Ultra** (MTB detected with level / trace / not detected; rifampicin resistance), and **molecular DST run directly on the specimen** (line probe assay, Xpert MTB/XDR). |
| FR-06.1c | **Screening plates** (MRSA, CRE, VRE on chromogenic media) are direct tests in Initial testing, read Positive or Negative (with the organism screened for). The plate's incubation is not a Culture row. A negative is validated and released like any other Initial testing result, and the case needs no culture. A positive is worked up by creating an isolate from the result (Create isolate and place, FR-09.2a) or by adding the culture. |
| FR-06.1a | **Structured results, no free text.** Every direct observation is a coded, semi-quantitative select list from the test's result type, with free text only in notes. A **Gram stain** (direct or on a culture) and other graded observations (wet preparation, ZN with cording) are **multi-component tests** (OGC-1126, OGC-1127, developer to confirm on develop; D-185): one component per morphology or cell type (Gram-positive cocci in clusters, in chains, Gram-negative bacilli, Gram-positive bacilli, Gram-negative diplococci, yeasts, pus cells, epithelial cells), each with a dictionary result from the category **Microscopy grade** (None, Rare, Few, Moderate, Many; D-187). Components left blank are not reported (the component's show-on-report rule, as built). No new result type is needed. |
| FR-06.1b | Molecular DST results on the specimen (per drug: mutation detected / not detected, with gene or band) count toward the TB resistance classification (A-14) exactly as isolate-level results do, and keep the M-09 §4.5 molecular flag columns in the WHONET export. |
| FR-06.2 | These are ordinary catalog tests with their own result types, linked to the case (existing `MicroCaseAnalysis`), worked inline on the case and kept off the ordinary Results and Validation screens (D-121; M-18 FR-B1). A Run view (`/Results?run=`, OGC-1200) that includes a case-linked result shows it as a read-only row, "Worked in Microbiology case {labNumber}", with a link to the case. |
| FR-06.2a | **Reagent lots.** Each Initial testing row offers the reagent lot picker (M-12) for its stain, cartridge or kit. A lot link marked **Required** for that test blocks saving the result without a lot, as it does on Results Entry today (M-12 §3.3). A link that depends on a method (AC-M12-05) uses the row's method. |
| FR-06.3 | Each row offers **Tested elsewhere** (D-195, the order entry wording, D-083): the result was already produced, earlier or by another laboratory. It reveals **Performed by** and **Date performed**, and the result. Performed by is either **a laboratory, picked from the Organizations list** (Locations & Organizations, search-first, defaulting to the order's referring facility; the same picker as Clinical Order Entry v4 FR-B20 "Tested elsewhere") or **a person** (a searchable user ComboBox, D-007). A result produced in this laboratory records the technician who entered it as Performed by, changeable to another user. No free-text laboratory names. A result from another laboratory is **external** (A-19). |
| FR-06.4 | Initial testing results can be released on a partial report once validated (A-17). Critical findings that prompt the phone call and a partial report are raised by M-11 rules (A-18): organisms seen in CSF or a positive blood culture Gram, AFB smear positive, rifampicin resistance detected. |
| FR-06.5 | **One result entry pattern for every case test row.** Initial testing, Additional testing and results placed from Incoming results use the same table and the same editor. Columns, in this order: **Test** (with On {isolate} when on an isolate, and External and In lab only tags), **Result** (the widest column; long results wrap, never truncate), **Flag** (from the test catalog), **Performed by**, **Reagent lot**, **Status** (the OpenELIS analysis status, D-191: Not started, Awaiting validation, Returned (rejected by the validator, with the reason), Validated, Cancelled; Referred and Tested elsewhere show as Tags beside it), and two row actions, **Enter** or **Edit** and a **⋯** menu (Mark In lab only, Move result, Cancel test; D-104). Enter or Edit opens a **full-width inline editor** under the row that renders the test's result type as Results Entry does: a coded list, several components (for example a Gram stain: one graded component per morphology, FR-06.1a; Xpert: MTB and rifampicin resistance; a line probe assay per drug), or a number with unit and reference range. The editor also holds Tested elsewhere (Performed by, Date performed), the reagent lot and the **Notes** section (FR-13.1a). Saving records the result as Awaiting validation (the built `TechnicalAcceptance` status). The result input controls are the Results Entry ones (including multi-component results, OGC-1126, OGC-1127), not a second implementation. |
| FR-06.5a | **Who did what** (D-191, Mohamed review 1.3). Each case result shows, in its row's expanded history, who entered it and when, who validated or returned it and when, and every later change (amendment, move, In lab only) with who, when and the reason, from the built analysis and audit records. Pending readings and unacknowledged analyzer flags show as row Tags ("Reading due", "Analyzer flag") until cleared. There are no micro-specific statuses: the case uses the statuses Results Entry and Validation already use (`StatusService.AnalysisStatus`). |

> **Contradicts V1**
> **Where:** M-04 §4.4 ("+ Add isolate creates a preliminary isolate from Gram stain + colony morphology"), §3.3 ("Preliminary release on Gram stain ... once at least one isolate has a Gram-stain observation"), AC-M04-08; M-14 §3 and §3.3 (smear and molecular steps inside the TB profile; LPA results belong to the case).
> **V1 said:** a direct Gram stain is recorded on a preliminary isolate; smear and GeneXpert exist only on TB cases.
> **v2 says:** direct tests, including molecular DST on the specimen, are rows in Initial testing, on any case.
> **Build state:** Built (isolate-based Gram).
> **Rework:** direct Gram moves to Initial testing; colony Gram is a + Gram stain under its culture row (FR-10.1f).

### A-07. Add any test or panel; the organism's default panel is still added automatically

| ID | Requirement |
|---|---|
| FR-07.1 | Initial testing, AST / DST and Additional testing each have **+ Add test or panel**, which opens **the normal OpenELIS test and panel chooser**: the same two-list component as order entry (Clinical Order Entry v4 FR-B14, the Sample Collection Redesign chooser), with **Order Panels** and **Order Tests**, search by name, code or LOINC, server-side paging and selected items as removable chips. It is pre-filtered to the case specimen's sample type (with "used as" types, D-076) and lists the case's lab unit first, with a toggle for all lab units. No second chooser is built for the Case. The chooser shows **No matching tests** with the search term when nothing matches. |
| FR-07.1a | In **AST / DST**, the chooser opens with a required **On** field for the isolate (the only isolate, or the one the panel table row was opened from, preselected) and is pre-filtered to the organism on that isolate. Its **Order Panels** list offers the AST and DST panels from M-01 for that organism alongside catalog panels, and its **Order Tests** list offers single antibiotics or drugs (for example colistin by broth microdilution, bedaquiline by MGIT). Choosing a panel creates a run on that isolate; choosing single agents adds them to a supplementary run on that isolate (FR-07.2). Panels already on the isolate are listed as "(already on ISO-1)" and cannot be added twice. The selected panels and tests show as dismissible tags above Add, exactly as in order entry. |
| FR-07.1b | **Default panel (kept from V1).** When an isolate is identified, its organism group's default AST or DST panel is added to the isolate automatically (`panelProvenance: ORGANISM_DEFAULT`, M-00 A-REUSE-2, AC-M05-10), as built. The chooser is for additional panels; **Adjust panel** with a reason stays for changing the default one. An NTM identification does not add the TB DST panel (A-14). |
| FR-07.2 | An added test creates an analysis on the case's specimen, linked to the case, with the optional previous-report fields (FR-06.3). An added AST or DST panel creates a run on the chosen isolate (M-05). |
| FR-07.2a | **Several AST / DST panels per positive culture.** One positive culture can lead to several panels: one or more per isolate when it gives several isolates, and more than one on the same isolate (for example the organism default VITEK card plus a supplementary disk diffusion panel, or a gradient strip for colistin). Each panel is its own run with its own method, breakpoint standard, readings, QC and validation. |
| FR-07.2b | **One reading per agent on the report.** When two validated runs on the same isolate both test an agent, the report uses the reading from the run marked **Use for reporting** for that agent, defaulting to the organism default panel's run; the technician can pick the other run per agent, recorded on the Timeline. The Report list shows the run each agent comes from. |
| FR-07.3 | **Breakpoint standard.** Each panel has an **interpretation model**: clinical breakpoints (CLSI or EUCAST) or TB critical concentrations (WHO). A run defaults to the laboratory's active standard for its model, and the model itself defaults from the organism: WHO critical concentrations for *M. tuberculosis* complex, clinical breakpoints otherwise; the technician can change both. The built **Breakpoint standard** select on the run stays (A-16); choosing a standard of another model, or another version than the active one, requires a reason, recorded on the run. |
| FR-07.4 | **Reflex rules add tests on their own** (M-06). For example, rifampicin resistance detected on Xpert MTB/RIF adds Xpert MTB/XDR and a first-line DST panel. A reflex-added test lands in the section it belongs to, tagged **Added by rule** with the rule's name, and is recorded on the Timeline. It can be cancelled like any added test (FR-07.5). Expert rules that only advise (for example phenotype flags) still suggest rather than add. |
| FR-07.4a | **Analyzer results for tests not on the order** are added to the order with one click by a technician. This is the general OpenELIS behaviour for analyzer results; on a case it is the one-click place button in Incoming results (FR-09.3), which adds the test to the order and to the case section together. |
| FR-07.4b | **Analyzer-driven reflex needs no rule.** Some analyzers do their own follow-on testing and send the extra result unasked; for example, when Xpert MTB/RIF Ultra detects MTB it also sends the rifampicin result. That result arrives like any other: into its row if the test is already on the case (FR-09.1), otherwise into Incoming results for a one-click Accept (FR-07.4a). A laboratory configures a reflex rule only for follow-on testing the analyzer does not do itself. |
| FR-07.4c | **No duplicates.** A reflex rule does not add a test that is already on the case, whether it was ordered, added by hand, added by another rule, or is waiting in Incoming results. If a rule has added a test and an analyzer then sends that result, the result fills the rule's row. |
| FR-07.5 | Removing an added test that has no result cancels it; one with a result can only be cancelled with a reason (No Hard Delete). |
| FR-07.6 | **Results take their flags from the test catalog.** Every result on the case, whether typed at the bench, recorded as tested elsewhere, accepted from Incoming results (analyzer or referral) or added by a reflex rule, is evaluated exactly as on Results Entry: normal range and abnormal flag (High, Low, Abnormal), the abnormal flag of a dictionary (coded) result, critical range and critical flag, valid range checks, and reflex rules. The flag shows on the row and on the report. No flag logic is re-implemented for the Case. Organism and phenotype criticals, which have no numeric range, come from M-11 rules (A-18). |

> **Contradicts V1**
> **Where:** M-04 §4 (fixed sections per profile), M-14 §3.4 (TB cascade driven by the reflex engine), M-06 (confirmation orders flow through the reflex engine), M-02 §2.1 and M-03 §2.3b (breakpoint family chosen by workflow type).
> **V1 said:** the profile decides which sections and next tests exist; reflex rules order confirmation tests; the workflow picks the breakpoint family.
> **v2 says:** technicians add tests and panels at any stage; reflex rules and the organism's default panel still add automatically; the panel's interpretation model and the organism pick the breakpoint default.
> **Build state:** Built (bacterial sections, default panel, per-run standard select; the breakpoint authority allows only CLSI and EUCAST); Specced (M-06, M-14).
> **Rework:** add the WHO critical-concentration authority and the panel interpretation model (Dependencies); reason on a non-default standard.

### A-08. Referral point after initial testing

| ID | Requirement |
|---|---|
| FR-08.0 | **Referral on the case is the order entry Refer out.** It uses the same inline panel, form, fields, record and workflow as Clinical Order Entry v4 FR-E2 and FR-E3a (built `OrderReferOutSection`, `OrderReferOutForm` and `ReferralStatusTag`): **Reference laboratory** (search picker over the Organizations list), **Tests to refer** (ticked by default), **Reason** (the existing referral reason list), **Referrer**, **Hand-off date and time**, **Expected return date**, **Notes**, and for environmental cases the agreement reference and chain-of-custody contact (FR-L4). It saves the existing referral per test and referral set, shows the same statuses (Draft, Requested, Received, In progress, Completed, Cancelled, Rejected) with the same Tags, shows "Already referred to {laboratory} on {date}" for a test with an open referral, offers **Aliquot first** when some tests stay here, and is dispatched from Sample Shipment like any other referral. The case adds only what to refer (FR-08.1, FR-08.1a) and the Referred marker (FR-08.2). |
| FR-08.1 | After Initial testing, **Refer remaining work** opens that Refer out panel with the case's culture and AST/DST work ticked as the tests to refer, for example to CPHL. |
| FR-08.1a | Referral is also available later for a single test or an **isolate**, for example CPHL sending an MTB isolate to a supranational reference laboratory (QMRL) for second-line DST not done in-country. An isolate is referred through its **isolate sample item** (FR-10.1c), so the existing referral on sample items is reused. The referral is tracked to receipt (existing referral status) and shows on the case. |
| FR-08.2 | The case shows **Referred** while any referral is open (A-17). Local work can continue alongside it. A partial report with the local Initial testing results can be released. |
| FR-08.3 | **Returned results for referred tests** fill those tests' rows on the case, marked for review and shown as **Performed by {laboratory}** (FR-09.1 applies: a result for a test already on the case goes to its row). |
| FR-08.4 | **Returned results with no row** (an isolate the receiving laboratory identified, its susceptibility results, a test it added) arrive in **Incoming results** (A-09): identifications offer **Create isolate** or placement on an existing isolate, susceptibilities offer placement on an isolate. |
| FR-08.5 | The Worklist reason **Referral returned** is set when a referral result arrives and cleared when every returned result is reviewed or placed. The case leaves Referred when every referred test has a result or its referral is cancelled. The referring laboratory validates and releases the final report; the clinician receives one report from one laboratory, with the performing laboratory named on each referred result. |

> **Contradicts V1**
> **Where:** M-00 §7 (reference-laboratory referral listed as out of scope).
> **V1 said:** referral was out of scope for the micro module.
> **v2 says:** referral of the specimen, a test or an isolate is part of the case.
> **Build state:** Not started (the general referral module is built for sample items).
> **Rework:** reuse the order entry Refer out on the case (FR-08.0); isolate sample items (FR-10.1c); referral returns routed per FR-08.3 and FR-08.4; coordinate with the referral redesign (OGC-796, D-016).

### A-09. Incoming results panel for analyzer and referral results

| ID | Requirement |
|---|---|
| FR-09.1 | A result for a test that **already exists** on the case goes straight to that row, marked for review, exactly as today (M-05 `RESULTS_IN`; D-059 accept semantics). |
| FR-09.2 | A result for a test **not yet on the case** (from an analyzer or a referral return) waits in **Incoming results** at the top of the case. Each item shows the test, value, source (analyzer name or laboratory) and received time, and the same row of **one-click place buttons** for every item: **Initial testing**, **Isolate** (identification: writes the isolate's organism, method and date), **AST / DST** and **Additional testing**. The system does not guess where a result belongs, and no result type or catalog setting is needed: the technician decides by clicking. |
| FR-09.2a | **Isolate buttons.** Isolate and AST / DST place the result on an isolate. With one isolate on the case the button names it ("AST / DST: ISO-1") and places in one click; with several it opens a short isolate menu; with none it reads **Create isolate and place**, which creates the isolate (Picked from is asked in the same step, FR-10.1b) and places the result on it. |
| FR-09.3 | **One click places it** in that section or on that isolate and adds the test to the case (and to the order, FR-07.4a). If placement fails (the test is inactive, or not valid for the sample type), the item stays waiting with the reason shown. A result placed in the wrong section is moved with FR-09.4. |
| FR-09.4 | A placed result can later be **moved** to another section or isolate with a required reason; the move is on the Timeline. There is only ever one copy of a result, so it cannot be reported twice. A move after final release needs an open amendment (A-17). |
| FR-09.4a | A repeat send of an identical result (same source, test, value and run) is recorded on the Timeline and not queued twice. |
| FR-09.4b | **After final release**, arriving results still wait in Incoming results, marked **Needs amendment**; placing them requires an open amendment (A-17). |
| FR-09.5 | A case with items waiting shows under Needs attention on the Worklist with the reason "Incoming results". |

> **Contradicts V1**
> **Where:** M-05 §5 (analyzer results populate an existing run only); M-04 §7 (analyzer event channel only while INCUBATING).
> **V1 said:** an analyzer result needs an existing AST run.
> **v2 says:** it can also wait in Incoming results, placed with one click on the destination, at any stage.
> **Build state:** Built (existing-run path; `MicroCultureAnalyzerEventService` rejects cases not INCUBATING).
> **Rework:** add the holding panel; accept events in the stages A-17 allows.

### A-10. Culture work-up under each culture row: tests on a culture (Gram stain, microscopy, rapid identification) and subculture

| ID | Requirement |
|---|---|
| FR-10.1 | **The work-up sits under each culture row** (D-173, D-183). There is no separate Growth work-up section. Every culture and subculture row has an **Add** menu in its row actions with **Gram stain** (a shortcut, FR-10.1f), **Test on this culture** (FR-10.1d) and **Subculture** (FR-10.1a). What they create is listed directly under that row, indented, in the order recorded, so each specimen culture reads as one tree: the culture, then its tests, and its subcultures, and under each subculture its own. Marking a row positive or Growth does not gate these actions; the menu is the same on every row. |
| FR-10.1e | **Microscopy on a culture is a catalog test** (D-183; replaces the hard-coded microscopy exam of D-166). A ZN for cording, an auramine, a lactophenol cotton blue or India ink mount, a wet mount or a motility test on a colony is a test in the test catalog (for example "ZN stain, culture"), picked with **Test on this culture** like any other, with its own result type and dictionary results from the catalog (FR-06.1a), its reagent lot link (M-12) and its notes (A-13). Their catalog **Reportable** setting is off (D-184, D-204), so they stay internal unless someone turns In lab only off (FR-15.4). The laboratory adds a new stain or preparation by adding a catalog test, not by editing a list in the micro module. |
| FR-10.1a | **Subculture from any culture** (D-166). + Subculture asks **From culture**, a required dropdown of all the case's culture rows, including earlier subcultures, with rows marked positive or Growth listed first (shown as container identifier, medium and outcome, for example "BC-004812-A, aerobic bottle, positive at 14 h"). A subculture from a row with no growth asks a **Purpose**: Enrichment (for example selenite broth to XLD), Blind or terminal subculture, Purity, Other. **Subculture** from a row's Add menu presets From culture to that row. A culture can have **several subcultures** (for example a purity plate and a Löwenstein-Jensen slope from one positive MGIT tube, or one plate per colony type); each gets the next container identifier for its parent (LJ-SUB-004812-A1, BA-SUB-004812-A2, editable), and the form can add more than one medium in one save (**+ Add another medium**, one subculture row each). The subculture is its own row with its own medium, atmosphere, duration, readings and outcome, and records its parent (built `source_inoculation_id`; a parent may have any number of children). In the Culture list each subculture is shown **directly under its parent culture**, indented, and a subculture of a subculture sits under its own parent, so the list reads as a tree from each specimen culture. |
| FR-10.1b | **Isolates record where they were picked from.** + Add isolate asks **Picked from**, a required dropdown of the culture and subculture rows with growth. One positive culture can give several isolates (for example *E. coli* and *Enterococcus faecalis* from one urine plate), and each isolate shows its source on the case and in its label ("Isolate 2, from SUB-004812-A1"). The isolate's quantity on the report comes from the reading on its source row (FR-05.4), not a separate isolate field. |
| FR-10.1c | **Isolate sample item (shared with Pathogen WGS).** When an isolate needs work of its own beyond identification and AST (whole genome sequencing, a PCR, a referral, storage), it becomes a **derived sample item**: a child of the specimen's sample item (built `parent_sample_item_id` and aliquot relationship, FHIR `Specimen.parent`) with the **Isolate** sample type, linked to its `micro_isolate`. Tests and referrals on it belong to the case and are worked in the case (D-121). The same model is used by the Pathogen WGS spec, so a WGS test on an isolate is one design. |
| FR-10.1d | **Tests on a culture** (D-166, D-183). **Test on this culture** opens the standard test and panel chooser (FR-07.1) pre-filtered the normal way, by sample type: tests set up for the case's sample type or for the **Isolate** sample type (FR-10.1c), with the case's lab unit first (for example a Gram stain, microscopy tests, rapid identification such as BCID2, catalase, coagulase, oxidase, an Xpert on a positive MGIT tube, MPT64); no new catalog attribute is needed and adds each pick as a case test run on that culture row ("From BC-004812-A"), listed under its culture row with its value and state; Enter or Edit opens the FR-06.5 editor in place, with notes (A-13), reagent lot and validation. Whether it reports is In lab only (FR-15.3), defaulted from the catalog (D-184). A reported result can be released on a partial report once validated (FR-06.4), M-11 rules raise criticals on it (a positive blood culture Gram, FR-18.1), and it prints in the Culture group under its culture (report FRS FR-A42). |
| FR-10.1f | **Gram stain shortcut** (D-173, D-183, D-185). **Gram stain** in the Add menu is the chooser with the catalog test **Gram stain, culture** already picked: it adds that test under the row and opens its result editor (FR-06.5): a multi-component result, one component per morphology with a Microscopy grade (FR-06.1a), the Gram stain kit lot (M-12) and who and when. A culture can have several (Day 1, then a repeat). There is no Report this result switch (D-184): **In lab only** decides whether it reports, defaulting from the catalog setting of Gram stain, culture (seeded off, so a Gram on a culture reports unless marked In lab only); a laboratory that keeps plate Grams internal sets the default on, and the reflex rule for positive bottles (FR-10.1g) adds its Gram stain with In lab only off. It is validated like any result (A-17), released on a partial report (FR-06.4), evaluated by M-11 (FR-18.1) and prints in the Culture group (report FRS FR-A42). Notes follow A-13. |
| FR-10.1g | **A Gram stain waiting for its result** (D-182, D-189). A test on a culture can exist before it has a result: when it was added and not yet read, or when a **reflex rule** added it. The seeded reflex rule "Blood culture result = Positive: add Gram stain, culture on that bottle, not In lab only" is an ordinary M-06 rule on the culture result (FR-05.5a), shown in Admin › Reflex Tests and switched off or changed there; the row is tagged **Added by rule** with the rule's name. The row reads "No result yet" with a **Pending** tag and **Enter result**, which opens its result editor (FR-06.5); saving makes it Awaiting validation and **Validate** makes it reportable. A pending test on a culture that is not In lab only blocks final release (on the final report checklist as "Gram stain {id} has no result") and does not print. The rule does not add the test again when the bottle already has one (FR-07.4c). |
| FR-10.2 | A test on a culture marked **In lab only** (FR-15.3), for example a ZN for cording or a purity plate Gram, is internal: it never appears on a patient report, a WHONET export or a surveillance submission, and it does not unlock a partial release. Turning In lab only off makes it a reportable result like any other (FR-15.4). |
| FR-10.3 | The TB positive-signal work-up fits this split: **ZN stain, culture** (cording) and the **purity plate** are tests on the MGIT row that default to In lab only; **MPT64 antigen** (MTBC vs NTM) and **NTM species ID** (line probe assay or MALDI-TOF) are identification results on the isolate, and are reportable. |

### A-11. The micro report prints inside the patient report; choose which results go on it

The printed report is the redesigned patient report (Patient Report & Report Management v2.2, OGC-1111), not a micro-only template. The micro content is specified in that FRS's microbiology addendum (FR-A42 to FR-A52): case results print as ordinary rows under the case lab unit's section, and each reported isolate prints as a **susceptibility block** (organism line, then one row per reported agent with MIC or zone, S/I/R in the Flag column, and the breakpoint standard). This amendment says what the case sends to it.

| ID | Requirement |
|---|---|
| FR-11.1 | Every reportable result on the case (Initial testing rows, the culture result, reported Gram stains and tests on a culture, isolates, AST/DST agents, Additional testing rows, the TB resistance classification or the bacterial resistance profile) has a **Report** checkbox, shown in the Report section as one list under the same four group headers the report prints (FR-11.4a). |
| FR-11.2 | In lab only tests (FR-15.3) are not listed. Defaults for the rest: Initial testing, culture and Additional testing results on; tests on a culture on; isolates marked significant on; agents per their M-01 report rule (`report_behavior`: Always on; Cascade per the cascade rule; Suppress unless resistant on only when R). |
| FR-11.3 | Changing a default is recorded on the Timeline (who, when, which result). Unticking a critical result asks for confirmation. After final release, changing a choice needs an open amendment (A-17). |
| FR-11.4 | **What prints.** The patient report reads the case: only ticked results print, from the reportable AST attempt (**Use for reporting**) when there are several; Send with Result notes print beside what they belong to (A-13); results from another laboratory show "Performed by {laboratory}"; critical calls print as callback lines (A-18). |
| FR-11.4a | **Grouped on the report** (D-181; report FRS FR-A42, FR-A42a). Inside the case's lab unit section, the printed results follow the Case view: **Initial testing**; **Culture** (each culture or set result, then its reported Gram stains and tests, then each reported isolate's identification); **AST / DST** (one susceptibility block per reported isolate, then the TB resistance classification or bacterial resistance profile); **Additional testing**. Each group with something to print starts with a sub-header; an empty group prints nothing. The Report section's choice list uses the same groups and order, and its print preview shows the result. |
| FR-11.5 | **Per-agent report rules are new work.** The built `report_behavior` (Always, Cascade, Suppress unless resistant) is stored on panel and run agents but never applied; v2 applies it as the default in FR-11.2. The built `AST_REPORTABLE_SELECTED` is the run-level Use for reporting and stays as it is. |
| FR-11.6 | **The REMARK projection stops printing.** The built projection (`MicroReportProjectionServiceImpl`, one REMARK result of up to 200 characters) no longer feeds the printed report and no longer needs a report mapping per linked analysis (`REPORT_MAPPING_REQUIRED` is retired for printing). It is kept only as the plain-text summary for electronic result delivery until structured micro results exist (M-15); that use is confirmed against the electronic results code before the projection is retired. |
| FR-11.7 | **Release writes the normal result status.** Validation and release of the case set its reportable linked analyses to validated and released, with release date and signature (`result_signature`), so the patient report's partial or final title and its "Validated and released by" block treat micro rows like any other. |
| FR-11.8 | **Environmental cases** print on the environmental results certificate shipped today (Reports → Environmental Reports → Laporan Hasil, `ComplianceReportRestController`), which already carries the site information, collection conditions, compliance table, analyst and manager signatures, and numbered amendments with the superseded certificate number. The case's results print in its compliance table (parameter, result, threshold, status) and isolates with susceptibilities as a susceptibility block after it. Critical calls on an environmental case print as callback lines under the result, and an order with no standard linked uses the certificate's no-standard layout (Report Print Queue r4, S06c). See Dependencies for the certificate's localization. |
| FR-11.9 | **Amended results on screen.** After an amendment, the patient results views (`/PatientResults`) show only the current version of each micro result, labelled Amended (UAT F-2). |

> **Contradicts V1**
> **Where:** M-04 §3.3, §4.6, AC-M04-08 (preliminary gated on an isolate Gram stain); M-01 §5 (`report_default` as the only selection mechanism); M-04 report projection (one reportable test-analyte per culture setup).
> **V1 said:** the report is a projection of the case into the reportable test's result; content is decided by the readiness checklist and M-01 rules.
> **v2 says:** the patient report reads the case directly and prints structured micro blocks; the validator chooses per result, with M-01 rules as defaults.
> **Build state:** Built (checklist, projection, report versions Final and Amended).
> **Rework:** populator in the patient report (OGC-1111 addendum N13); apply `report_behavior`; release writes analysis status (FR-11.7); environmental certificate block.

### A-12. Worklist: Needs attention, bench work, and what it keeps

| ID | Requirement |
|---|---|
| FR-12.1 | The Worklist gains a **Needs attention** summary card and filter (`status=attention`). A case is listed with each reason that applies: Check due, Incubation complete, Incoming results, Referral returned, Needs amendment, Missing required-before-final fields when final is otherwise ready. |
| FR-12.1b | **Sort order** (D-199, Mohamed review 2.1). Needs attention and the Check due and Final read due filters sort STAT orders first, then the most overdue first, then the earliest due. There is no fixed ranking of reasons, because labs prioritise them differently; each reason is a text Tag with an icon, never colour alone. Critical findings are worked in Alerts and the critical callback log (A-18), not repeated here. |
| FR-12.2 | **No growth** is available on the Worklist for culture rows with a check or final read due, without opening the case (FR-05.4a, FR-12.6a). |
| FR-12.3 | The Worklist shows only cases whose **case lab unit** is one the user holds rights in, with a Lab unit filter when there is more than one (M-18 FR-E1a). The built **workflow** filter and sort become **Program**. |
| FR-12.4 | "Day n of max" becomes "Day n of N": n is the days since the earliest open inoculation; N is the longest open incubation on the case. |
| FR-12.4a | **Overdue** (D-199, Mohamed review 2.5). The Due column shows how late a row is once its check or final read is past due ("Overdue 6 h", a red Tag with text). **Check due** keeps covering rows that are due and rows that are overdue: there is no separate overdue chip or count. A reading recorded late keeps its actual time, so the delay stays visible on the culture row's reading log. |
| FR-12.5 | **Due action** is redefined for v2: Received with no Initial testing result, "Start initial testing"; Initial testing done and no inoculation, "Inoculate or refer"; Check due, "Read plates"; Incubation complete, "Record outcome"; Growth detected, "Work up growth"; results entered, "Validate"; validated, "Release". |
| FR-12.6 | **Bench work on the Worklist** (D-167, amended by D-172). Plating and reading many cases happen on the Cultures view of the Worklist, with no run, no batch record and no separate Bench view. Every write is an ordinary write to each case (culture rows, readings), with who and when, one Timeline entry per case and the normal audit trail. The Cultures view gains three filter chips with live counts, beside Needs attention: **Awaiting inoculation** (cases with a culture test and no culture row; one row per case), **Check due** and **Final read due** (culture rows whose check is due, or whose incubation is complete; one row per culture row: lab number, patient or site, container ID, medium, incubation day, due). Rows on these filters are selectable, with "Select all in this filter". |
| FR-12.6a | **No growth, one click.** Each row on Check due and Final read due has a **No growth** action. On a **Check due** row it records the reading No growth with who, when and the incubation day, and sets the next check (FR-05.4). On a **Final read due** row it records the reading No growth and the row outcome **No growth** (FR-05.5); when every culture row of the case has an outcome, the case moves on as it does today (validation and release still happen on the case, A-17). Each click shows a toast with **Undo**, which reverses that write (both are kept in the audit trail). Any other reading (Normal flora, Mixed growth, Significant growth, Contaminated) is recorded on the case: the row's **Open case** link opens the Case view at that culture row. |
| FR-12.6b | **No growth for many.** Selecting rows shows **No growth ({count})** above the table with what it will do ("Records No growth on 14 rows: 11 checks, 3 final reads"). Rows that cannot take it are skipped and named with the reason: an instrument negative (it needs Confirm, FR-05.4d), a row with growth already recorded (open the case), a row in a case the user cannot edit. A toast with Undo follows. |
| FR-12.6c | **Inoculate many.** Selecting cases on Awaiting inoculation shows **Inoculate ({count})**. All selected cases must share one sample type (and culture test), because one set of linked media applies; a mixed selection is refused with the reason ("Inoculate needs one sample type: 1 selected case is Wound swab"). Inoculate opens an inline panel above the table (a Tile, not a modal) with: the culture test's **media** for the sample type (FR-05.2a, with Change); one **lot** field per tracked medium (expiring and expired lots flagged, nothing preselected; not tracked media read "Not tracked"); the container identifiers that will be generated (lab number, medium code, sequence); and **Inoculated at** (the save time unless changed, FR-05.1e). **Save** creates those rows on every selected case with the medium, lot (no stock change, D-169), container identifier and incubation, records one Timeline entry per case, and offers **Print plate labels** (A-20). A case that needs different plating is inoculated from its own Culture section. |
| FR-12.6d | The Worklist writes in FR-12.6a to FR-12.6c need a connection (disabled while offline) and the user's rights in each case's lab unit (Access). They replace **Mark checked** and the reading "No change". |
| FR-12.6e | **Extend 24 h from the Worklist** (D-179). Each row on Final read due, including a plate with growth on it, has **Extend 24 h**, which asks only for the Reason (FR-05.3a, without Other) and extends that row by 24 hours; the row leaves Final read due and comes back when the new end is reached. The toast offers Undo. Other lengths and the Other reason are done on the case. Instrument-read bottles are confirmed, not extended, from the Worklist. |
| FR-12.7 | **The bench sheet is a Workplan print** (D-174, D-188). Each Cultures view filter (Needs attention, Awaiting inoculation, Check due, Final read due) has **Print workplan**, which opens the existing **Workplan** print with a new **Microbiology bench** layout and the filter's rows: the rows of that filter with the Program and Lab unit filters applied, or only the selected rows when some are selected. The existing Workplan page (by test section, test, panel or priority) gains **Microbiology bench** as a workplan type with the same four filters and a Lab unit filter, so the sheet can also be printed from Workplan. It reuses the Workplan print pipeline and paper size; nothing on any case changes when it is printed. The sheet number and its row list are the Workplan's **print record** (who, when, filters, rows), not a Workplan batch: the Microbiology bench type never creates a batch or a run (D-209, a stated exception to D-052, which covers batches). FR-12.7a and FR-12.7b describe the layout; only FR-12.7c (Open sheet) and the sheet number are new beyond the Workplan. |
| FR-12.7a | **What every sheet shows.** A header with the laboratory name, the lab unit or units, the sheet title (the filter, for example "Final read due"), the **sheet number** (for example BS-261002-03, large, with its barcode), who printed it and when, and page *n* of *N*. Every row shows the two identifiers the technician checks against the plate or tube: the **lab number** (bold, with the container ID on reading sheets) and the **patient name** (or the site name for environmental samples). Each row has a **tick box** and an **Initials** box. The footer reads "Contains patient information. Shred after use." and repeats the sheet number on every page. |
| FR-12.7b | **By filter.** **Check due** and **Final read due** sheets list culture rows **grouped by medium** (a group header with the medium and its row count), then by lab number; each row shows the container ID, the incubation day ("Day 2 of 2"), Check or Final, a **Reading** box and a **Quantity** box, and the footer prints the reading codes (NG No growth, NF Normal flora, MG Mixed growth, SG Significant growth with quantity, C Contaminated). An instrument negative prints with "Confirm on screen". **Awaiting inoculation** sheets list cases **grouped by sample type**, then by lab number; each row shows the specimen and a tick box per medium linked to the culture test for that sample type (FR-05.2a), or "No media linked: write the media" with blank lines; each group ends with a "Lot used" line per tracked medium. **Needs attention** sheets list cases by lab number with their reasons and a Notes column. |
| FR-12.7c | **Open sheet.** The Cultures view has **Open sheet**, which takes a sheet number (typed or scanned from the sheet) or picks from the user's sheets of the last 7 days. It shows exactly that sheet's rows in the printed order and grouping, with each row's current state (rows already recorded show what was recorded, and by whom), and the usual row and selection actions (No growth, Open case, Inoculate, Confirm). A banner names the sheet with **Close sheet** and **Reprint**; a reprint keeps the number and prints "Reprint" in the header. A sheet is a saved list of rows, not a batch: it has no state, nothing completes or closes it, and it never changes what a row is or who may work it. |

**Kept from the built Worklist:** the Cultures and AST views (content switcher); the culture summary tiles (Total pending, Incubating, Positive, Growth detected, Case review) and AST tiles (In queue, Pending setup, In progress, Results in), each joined by Needs attention; filters with Clear filters; the Due column; pagination; row overflow actions; Refresh; the shared-queue indicator. Removing any of these is a regression.

> **Contradicts V1**
> **Where:** AC-M07-10 (the Worklist makes no writes); M-07 §3 (day count from the culture setup); built `MicroWorklistServiceImpl.dueAction` (culture-first).
> **V1 said:** the Worklist is read-only and counts days from the setup.
> **v2 says:** the Worklist records No growth readings and inoculates many cases at once (FR-12.6); days and due actions come from the case rows.
> **Build state:** Built (worklist, tiles, due action; not filtered by lab unit).
> **Rework:** lab-unit filtering, attention filter, due action, Program filter replacing workflow (including the `MicroAstRunDAOImpl` sort).

### A-13. Internal and external notes on the case, every result, culture row, isolate and drug

| ID | Requirement |
|---|---|
| FR-13.1 | Notes can be added to the **case**, to **every case test result** (Initial testing, Additional testing, tests on a culture, results placed from Incoming results), to **every culture row** (inoculation or subculture), to an **isolate** and to a single **drug result**. Any note anywhere on the case can be either type, as on the patient report (D-170). Each note is **In Lab Only** (internal, bench only, never printed; the default) or **Send with Result** (external, printed on the report next to what it is attached to). |
| FR-13.1a | **Same pattern as Results Entry** (Results Entry FRS v2.1, Notes section). Wherever a note can be added, a **Notes** section shows a table of the notes already saved (**Date/time**, **Author**, **Type** as a tag, **Note**) and a **New note** button at the bottom right. New note opens a form with the type as radio buttons (In Lab Only preselected), the note text, and **Save note** / **Cancel**. On a case test result the section sits inside the result editor (FR-06.5) and the row shows a note count beside Edit; on culture rows and isolates it opens from **Notes ({count})** in the row actions; for the case it sits in the Timeline area; for a drug result it opens from the drug row. Saved notes are kept with who and when and appear on the Timeline. |
| FR-13.1b | **Storage.** Notes on case test results are ordinary analysis notes in the existing `note` table (`note_type` I or E, as Results Entry and Validation write them), so Validation and the patient report read them with no micro-specific path. Culture row, isolate, drug and case notes go in the same `note` table (it is polymorphic: a reference table and a reference id), with new reference tables for the culture row, isolate, drug result and case (D-205), and the same two types. There is no separate micro note store. |
| FR-13.1c | **Where a Send with Result note prints.** Beside what it is attached to: a case test result, an isolate's parent line, a drug row. Things that have no line of their own on the report (a culture row, a subculture, the case itself) print their Send with Result notes under that culture's result row in the Culture group, and notes on the case itself under the last row of the case (report FR-A48), in the order they were written. The only exception is a result the lab has chosen to withhold (marked In lab only or unticked in the Report choices): its notes do not print, and the form shows the warning "This result is not on the report, so this note will not print" and still saves. |
| FR-13.2 | External notes can use the macro library (M-08), for example "Mixed growth, likely contamination, please repeat", "I = susceptible, increased exposure", notifiable condition and referral pending notices. M-08's categories are rebound: the `gramStain` and `culture` macros, which filled free-text fields that are now coded (FR-06.1a, FR-05.4), become note macros for Initial testing and Culture; clinical-history macros (AC-M03-06) stay on Clinical history in Case information. |
| FR-13.3 | A test on a culture marked In lab only (FR-10.2) never prints itself; its notes follow FR-13.1 and FR-13.1c like any other withheld result. |

### A-14. TB resistance classification follows the drug results, with reconciliation

| ID | Requirement |
|---|---|
| FR-14.1 | When a case has phenotypic or genotypic DST results, the case shows a derived **resistance classification**: RR-TB, MDR-TB, pre-XDR-TB or XDR-TB (WHO 2021 definitions), plus the M-14 categories pan-susceptible, mono-resistant and poly-resistant, from the per-drug results. Genotypic results (Xpert MTB/XDR, line probe assay: mutation detected / not detected, with gene or band), on the specimen or the isolate, count alongside phenotypic ones. |
| FR-14.2 | The classification is derived, never typed, and recomputes when a drug result changes. A supervisor can edit it with a reason (AC-M14-08), shown as edited. |
| FR-14.3 | **Reconciliation gate (kept from V1).** When the molecular and phenotypic results for the same drug disagree (for example Xpert rifampicin resistance detected and MGIT rifampicin susceptible), the drug shows **Discordant** and the case cannot pass validation until a supervisor records the resolution and reason (AC-M14-07). |
| FR-14.4 | **NTM off-ramp (kept from V1).** An isolate identified as a non-tuberculous mycobacterium records the outcome NTM identified, does not add the TB DST panel, and is not counted in the TB classification (AC-M14-10). |
| FR-14.5 | RR, MDR, pre-XDR and XDR are critical findings with the National TB Programme as a recipient (M-11, A-18). |

> **Contradicts V1**
> **Where:** M-14 §2 and §3 (derivation inside the TB profile, selected by `workflow_type = MYCOBACTERIOLOGY_TB`); M-14 §4.6 (reconciliation stays, now on any case with DST).
> **v2 says:** derived wherever DST results exist, on any case, with the M-14 reconciliation gate and categories kept.
> **Build state:** Specced.

### A-15. Additional testing at the end of the case, and "In lab only" tests

| ID | Requirement |
|---|---|
| FR-15.1 | A new **Additional testing** section sits after AST / DST and before Report. It has **+ Add test or panel** with the same test and panel chooser as FR-07.1, for work done after identification and susceptibility: for example **whole genome sequencing**, carbapenemase gene PCR, or toxin testing. A test can be added on the specimen or on a named isolate, through its isolate sample item (FR-10.1c). |
| FR-15.1a | **Sequencing results are reviewed in the case.** A WGS test on the case follows the Pathogen WGS design for its data (headline calls as result components, per-target detail, pipeline provenance) and its sequencing Run (OGC-1200: barcode, run controls, flowcell and kit lots, sequencing QC hold, D-056). The result arrives through the analyzer profile into its row, or into Incoming results, and is validated in the case like any other result (A-17), with the same result component and target detail display as the WGS spec. |
| FR-15.2 | Added tests support everything other added tests do: Tested elsewhere (FR-06.3), referral of that test or isolate (FR-08.1a), and analyzer or referral results arriving through Incoming results (A-09, placed with its Additional testing button). |
| FR-15.3 | Any test on the case except its generic culture test can be marked **In lab only**, whether it was ordered, added or added by a rule, in Initial testing, on a culture, in AST / DST or in Additional testing. A test starts In lab only when its catalog **Reportable** setting is off (the built `test.is_reportable`, D-204; for example off for microscopy tests on a culture, on for Gram stain, culture); there is no separate In lab only by default attribute. A reflex rule can set In lab only for the test it adds. In lab only on a test and the In Lab Only note type (Results Entry, A-13) mean the same thing, kept in the lab and never printed. An In lab only test and its results never appear on the patient report or in results sent to the requester, and are not listed in the Report choices (FR-11.1). They stay visible on the case, in case search and on the Timeline. A panel member withheld this way still prints as a member row reading "Not reported", so the panel shows its full membership (D-080). |
| FR-15.4 | **In lab only is reversible.** Turning it off puts the test's results back in the Report list, unticked, so the validator chooses whether to report them. Before final release either change is immediate. After final release either change needs an open amendment and takes effect in the amended report; results already sent electronically are corrected by that amendment. Every change is on the Timeline (who, when, on or off). |
| FR-15.5 | The generic culture test cannot be marked In lab only. |
| FR-15.6 | In lab only affects the patient report and results sent to the requester only. Whether a test feeds WHONET, antibiogram or surveillance outputs is decided by those exports' own rules (A-19), not by this flag. |
| FR-15.7 | **Pending Additional tests do not block final release** (A-17). A result that arrives after final is placed through an amendment. |

### A-16. Built capabilities carried forward (nothing on develop is dropped silently)

v2 changes how a case is routed and adds sections; it does **not** remove what the Case view already does unless an amendment says so. This table is the checklist, taken from the built Case view on develop (`frontend/src/components/microbiology`, 2026-09-29) and the V1 behaviour the drift audit found missing from draft 5. **Kept** means the capability stays as built, in the v2 section shown. The Worklist's kept features are listed under A-12.

| Built today (panel) | Capability | v2 status | v2 section |
|---|---|---|---|
| Case header | Related cases, stage tag, NCE count tag, last activity; Report NCE, Mark specimen lost, Log critical notification; final-released and amendment banners | Kept; related cases (same sample, other lab units) shown as a switcher; header adds Program and case lab unit (A-04); "workflow must be classified" banner retired (A-01) | Header |
| Case header | Progress rail, Next step card (Start inoculation, Mark positive), open-step footer | Kept; rail gains the new sections; next step follows the due action (FR-12.5) | Header |
| Order detail | Culture purpose (required), patient origin with default from the requesting organization, admission date (no future date; disabled for outpatients), number of sets (1 to 10), clinical history (1000 characters), antibiotic exposure; Save hidden once final | Kept, moved into Case information and extended (A-03); purpose gains three values (A-19) | Case information |
| Change workflow | Workflow select, culture method select, reason, preserve-work confirmation, blocked after final | **Removed** (FR-02.7, D-178); Change lab unit added (FR-02.6) | Header |
| Culture protocol | Set / change protocol with reason | **Retired** (A-01) | n/a |
| Inoculation | Start inoculation, Add subculture (parent required), **container identifier (required)**, media, incubation, atmosphere, **reagent lot picker**, reagent usage history; read-only once final unless an amendment is open | Kept; incubation and atmosphere become coded with duration, unit and check interval; the free-text medium becomes an Inventory medium and lot or a Not tracked name (A-05) | Culture |
| Culture transition | Mark positive (to POSITIVE_SIGNAL), Mark no growth (to NO_GROWTH_READY), with a confirm step | Kept with its confirm step, but **per inoculation row** instead of per case (FR-05.4c); the case stage rolls up from the rows (A-17) | Culture |
| Decontamination (M-14 §4.1) | Decontaminated sediment as a child aliquot with volume and parent link | Kept (FR-05.8) | Culture |
| Slow-grower revival (AC-M04-10) | A late positive reopens a No growth culture | Kept (FR-05.7) | Culture |
| Timeline | Add note, Auto / Manual tags, event details, last 30 events with Show all; historic workflow and protocol events | Kept; historic events keep rendering (FR-01.7); new events (lab unit change, Program change, readings, placements, moves, In lab only) | Timeline |
| Nonconformance | Report NCE and Mark lost: category, type, reporting unit, title, severity (Minor, Major, Critical), description, immediate action; disposition Flag only, Reject tests, Retest (source AST run, whole panel or single antibiotic) | Kept | Nonconformance |
| Isolates | Create isolate: label, gram stain (required), colony morphology, significance (Unknown, Clinically significant, Contaminant, Normal flora); Identify: organism, ID method (MALDI-TOF, VITEK 2, manual biochemistry, PCR), confidence, reason during an amendment; identification history; Log critical for isolate | Kept; analyzer identification can arrive through Incoming results (FR-09.2); direct Gram on the specimen moves to Initial testing (A-06), colony Gram stays here | Isolates |
| Default AST panel | The organism group's default panel is added on identification (`panelProvenance: ORGANISM_DEFAULT`) | Kept (FR-07.1b) | AST / DST |
| AST setup | Isolate select; ordered panel with version and provenance; **Adjust panel** (panel, antibiotic set, reason when changed); **method** (VITEK 2, Phoenix, Etest, broth microdilution, disk diffusion; zone vs MIC); **breakpoint standard select**; **entry mode** Manual or Analyzer (analyzer and card ID required); reagent lot picker; start-run guards (isolate confirmed, panel selected, reason given) | Kept; extra panels through the normal chooser (FR-07.1a); standard default from the panel's interpretation model, reason for another (FR-07.3); DST panels use the same setup | AST / DST |
| AST analyzer and QC | Awaiting / results-ready banners; provenance (analyzer, card, software, organism and confidence); organism mismatch warning; **QC failed**: invalidate and repeat (reason, replacement card) or override QC (reason); **expert flags** acknowledge (reason) | Kept; acknowledging flags is part of validation (A-17) | AST / DST |
| AST readings | Record reading (antibiotic, MIC or zone); table with method, raw value and units, source, **matched by**, interpretation vs instrument interpretation; **no-breakpoint warning** | Kept | AST / DST |
| AST override | Override interpretation (S, I, R) with reason; **revert override** with reason; override history; show or hide original | Kept | AST / DST |
| AST review | Review run / Accept results, blocked until every antibiotic has a reading and QC, mismatch, no-breakpoint and flags are resolved | Kept as the run's **validation** (A-17) | AST / DST |
| AST attempts | New attempt (Repeat or Retest; whole panel or single antibiotic; reason; method); attempts table; **Use for reporting** when several reviewed runs exist | Kept; several panels per isolate and per positive culture (FR-07.2a), with Use for reporting per agent when two runs overlap (FR-07.2b); the reportable run feeds the Report list (A-11). UAT F-3 (AST corrections return 500 during an amendment) is fixed as part of this work | AST / DST, Report |
| Expert review (M-06 §5.0) | Expert rule flags, intrinsic resistance, unusual phenotype confirmation before reporting | Kept as the case's **validation step**, not a separate section (A-17) | AST / DST, Initial testing |
| NTM off-ramp (AC-M14-10) | NTM does not trigger the TB DST cascade | Kept (FR-14.4) | Isolates |
| TB reconciliation (M-14 §4.6) | A discordant drug blocks final; supervisor resolution with reason | Kept (FR-14.3) | AST / DST |
| Critical communication | Target (case, isolate, sample item, result), recipient (required), contact, method (phone, SMS, in person, email), message, follow-up; Acknowledge; Close with resolution note; MICROBIOLOGY_CRITICAL alerts synced with the Alerts dashboard | Kept; each call also writes a `critical_callback` row with its outcome (A-18) | Critical communication |
| Reports | Release state; readiness checks; **WHONET checks** and mapping tag; patient report preview; Release preliminary and final (now Release partial report and Release final) | Kept; release rules in A-17; the preview is the patient report with its micro blocks (A-11) | Report |
| Amendment | Open amendment (reason), cancel (reason), release amended report; history; report versions with "corrects version N" | Kept; every post-final change routes through it (A-17) | Amendment |
| Final-release lock | Server rejects changes to a final case (409 `FINAL_CASE_LOCKED`) | Kept and applied to every v2 action (A-17) | All sections |

**Rule for implementers and reviewers:** any row marked Kept that is missing from a v2 build is a regression, not a simplification. The v2 preview draws the changed and new parts in full and the kept parts in summary; the built panels above are the reference for the kept parts.

### A-17. Case stages, validation and release

The built stage list is linear and ends at the first release (`MicroCaseStateServiceImpl.ALLOWED_TRANSITIONS`: after PRELIM_RELEASED the only next stage is FINAL_RELEASED). v2 separates **where the work is** from **what has been released**, so a culture keeps progressing after a partial report.

| ID | Requirement |
|---|---|
| FR-17.1 | **Work stage** is the furthest point any open part of the case has reached (each inoculation row, subculture and isolate counts separately, FR-05.4c): **Received**, **Initial testing**, **Incubating** (an inoculation is open), **Growth detected** (a row has growth), **Identification**, **AST / DST in progress**, **Results entered** (no open work; results await validation), **Validated**. It moves back when late work reopens it (FR-05.7) or a new test is added. |
| FR-17.2 | **Culture outcome** closes the culture side: **Growth** (with isolates), **No growth** (every row No growth), **Contaminated** (every row contaminated and no repeat pending), **NTM identified** (an isolate identified as a non-tuberculous mycobacterium, FR-14.4), or **No culture ordered** / **No culture performed** (FR-17.3). |
| FR-17.3 | **No culture ordered or performed.** A case with no culture test (Xpert only, smear only, a negative screening plate) closes its culture side automatically as **No culture ordered**: nothing about culture prints, and the case is validated and released on its direct results. When a culture test is on the case but was not done, the technician records **No culture performed** with a reason; the culture row prints "Culture not performed". Both are left out of surveillance culture denominators (A-19). |
| FR-17.4 | **Referred** is shown beside the work stage while any referral is open (FR-08.2); it does not replace it. |
| FR-17.5 | **Validation (expert review).** Results are **Awaiting validation** when recorded and **Validated** when a validator accepts them (or **Returned** with a reason), the OpenELIS analysis statuses used elsewhere (D-191). On a case, validation is where expert review happens: expert rule flags acknowledged with a reason, overrides reasoned, QC, organism mismatch and no-breakpoint warnings resolved, and discordant TB drugs resolved (FR-14.3). An AST or DST run is validated with the built Review run / Accept results; Initial testing, culture and Additional testing results are validated per result. A lab can block self-validation (D-191): with the new site setting **Block self-validation** on, the user who entered a result cannot validate it, here or on the Validation page, and the action says why ("You entered this result; another validator must validate it"). This is the case-level stand-in for the Validation worklist (D-121) and runs the same clearance rule as D-059, including auto-validation where configured. A result typed on the case is saved as a **run of one** (D-052, OGC-1200), so reagent lots, per-test control policy and QC holds (D-054, D-056) apply exactly as on Results; an analyzer result keeps its analyzer Run. |
| FR-17.6 | **Releases** are separate from the work stage and use the report states every OpenELIS report has (D-150, D-201): **Partial**, **Final** and **Amended**; there are no micro-only release types. **Release partial report** can be used as often as needed before final (for example after the Gram stain, AFB smear or Xpert, and again after identification with AST/DST to follow) and needs at least one validated, ticked result; what is still pending prints "To follow" or "In progress", so the content shows how far the work has got. **Final** needs: a culture outcome (FR-17.2), every ticked result validated, the "required before final report" fields (FR-03.4), every referral for referred culture or AST/DST work returned or cancelled, and the M-04 §4.6 checks that still apply. Pending Additional tests and In lab only tests never block final (FR-15.7). Results waiting in Incoming results ask for confirmation before final. Each release is recorded with its type, time and validator, and is a report version in the Report Print Queue issue history (OGC-1031 r4): completing a partial report is a new version, and Amended applies only when something already printed changed or was removed. |
| FR-17.7 | **After final release nothing changes without an amendment.** Case information, results, readings, placements and moves, Report choices, In lab only, lab unit and Program are read-only; arriving results wait as Needs amendment (FR-09.4b). Opening an amendment (reason) unlocks the change; releasing it prints the corrected report with the amendment reason (OGC-1111 FR-A14). The server enforces this (409 `FINAL_CASE_LOCKED`), not only the screen. |
| FR-17.8 | **Stage transitions** replace the built linear table with the rules above: any work stage can move to the next when its condition is met; Growth detected and later stages can move back when work reopens; releases are allowed from any work stage that meets FR-17.6; Rejected and Cancelled are terminal (No Hard Delete). |

> **Contradicts V1**
> **Where:** M-04 §3.1 and §4.6 (stage list; final needs an isolate or NO_GROWTH_READY); built `ALLOWED_TRANSITIONS`, `MicroCaseReadinessServiceImpl`; M-06 §5.0 (Expert review as its own section).
> **V1 said:** one linear stage list, released stages terminal for the culture; final needs a culture result; expert review is a section.
> **v2 says:** work stage and releases are separate; No culture performed can be final; expert review is the validation step.
> **Build state:** Built (stage machine, readiness, preliminary release endpoint, final lock).
> **Rework:** new transition rules; partial releases recorded as Partial report versions (D-150, D-201); readiness per FR-17.6.

### A-18. Critical results and callbacks

Critical calls from microbiology go into the same callback log as every other critical result (`critical_callback`, OGC-714), so they print on the patient report and count in the callback reports. The micro Critical communication record keeps what only micro needs.

| ID | Requirement |
|---|---|
| FR-18.1 | **Raising a critical.** Numeric and coded criticals come from the test catalog (FR-07.6). Organism and phenotype criticals (for example CRE, MRSA or *N. meningitidis* in blood or CSF, a positive blood culture Gram, a positive AFB smear, rifampicin resistance, MDR-TB and above) come from M-11 rules (`ORGANISM_PHENOTYPE`, M-14 §4.8, FR-14.5), targeting the case, isolate, result or sample item. Recipients follow M-11, including the National TB Programme and infection prevention and control for alert organisms. |
| FR-18.2 | **Every call writes a callback row.** Logging a call in Critical communication (or Log critical in the header or on an isolate) writes one `critical_callback` row per attempt: `analysis_id` and `result_id` of the result the finding belongs to (a result target: that result; an isolate, case or sample item target: the case's culture result on its generic culture test); `result_value` the finding as reported ("Klebsiella pneumoniae, carbapenem resistant"; 200 characters); `logged_by` and `logged_at` the caller and time; `recipient_name` the recipient; `status` the outcome. The culture result row exists from the first growth reading or the first critical finding ("Growth detected", "AFB seen"; entered, not validated), so there is always a result to point at. |
| FR-18.2a | **Callback log changes (OGC-714, built).** Today `CriticalCallbackRestController` accepts only a result at or beyond its catalog critical limits, copies `result_value` from the result, and counts only those in its summary and timing reports. It gains a **criticality source**: the catalog limits (as today) or an M-11 rule (organism, phenotype, TB classification), and accepts the finding text from the micro call. The Validation clearance acknowledgment (`ackPending`, OGC-1226) treats `MICROBIOLOGY_CRITICAL` like `CRITICAL_RESULT`. |
| FR-18.3 | **Outcome is required on each call**, with the callback values: **Read back confirmed**, **Reached, no read-back**, **Unable to reach**. A second attempt is a second call and a second callback row. |
| FR-18.4 | **Micro keeps its detail.** The micro record keeps target, method, contact, message, follow-up needed, acknowledge and close, the Alerts dashboard link and corrections, and links to its callback rows. A call is entered once, on the case; nothing is entered twice. A correction writes a new callback row and keeps the original. |
| FR-18.5 | **On the report and in the callback reports.** The latest call prints as the callback line under the critical row, or under the isolate line when the micro call targeted an isolate (placement uses the micro record's target; the call itself is read from `critical_callback`; OGC-1111 FR-A33, FR-A51). Micro calls count in the callback summary and timing reports; for a micro finding the clock starts when the finding is validated, the micro equivalent of release (to confirm with the callback report owner). |

> **Contradicts V1**
> **Where:** M-11 §3 (micro critical notifications stored in the micro module only); built `MicroCriticalCommunication` with no link to `critical_callback`.
> **V1 said:** micro calls live in the micro record.
> **v2 says:** each call is also a callback row, so there is one log.
> **Build state:** Built (both tables, unlinked).
> **Rework:** write callback rows from the micro call; add Outcome; link the records.

### A-19. Culture purpose and surveillance outputs

| ID | Requirement |
|---|---|
| FR-19.1 | **Culture purpose values (clinical).** Diagnostic (default, `CLINICAL_DIAGNOSTIC`, built), Screening (colonization and infection prevention, `ACTIVE_SCREENING`, built), **Treatment follow-up** (TB monitoring cultures, test of cure, `TREATMENT_FOLLOW_UP`), **Survey or study** (for example a TB drug resistance survey, `SURVEY_STUDY`), **EQA / proficiency** (`EQA`; a purpose tag only until the EQA V2 controller exists, D-017). Environmental cases keep their four M-18 values. |
| FR-19.2 | **Where each purpose counts** (CLSI M39 counts only diagnostic isolates in cumulative antibiograms; WHO GLASS-AMR uses routine clinical samples): |

| Purpose | WHONET (M-09) | Antibiogram (M-13) | GLASS (M-15) | Cluster detection (M-16) |
|---|---|---|---|---|
| Diagnostic | Included | Included | Included | Included |
| Screening | Only when chosen (built `includeScreening`) | Excluded | Excluded | Excluded (M-16 §5.3) |
| Treatment follow-up | Included, coded as follow-up | Excluded | Excluded | Excluded |
| Survey or study | Only when that survey is chosen | Excluded | Excluded from routine counts | Excluded |
| EQA / proficiency | Excluded | Excluded | Excluded | Excluded |

| ID | Requirement |
|---|---|
| FR-19.3 | **Which exports include a case.** WHONET, the antibiogram and GLASS-AMR take the cases whose Program is on the **Bacterial** track; GLASS-TB and the National TB Programme reports take the **TB** track; Mycology-track cases go to the antifungal antibiogram. Each export's track list is part of its configuration (the seeded tracks as listed; a laboratory that adds a track chooses which exports take it). One rule, owned by M-09 and reused by M-13 and M-15, with one first-isolate de-duplication (D-049). |
| FR-19.4 | **Outcomes in exports.** A Contaminated TB culture exports nothing; a bacterial culture with contaminants only exports as negative (M-14 §7.1). NTM identified exports as NTM, not as MTB. No culture performed is left out of positive and negative counts. |
| FR-19.5 | **Only the laboratory's own results.** Results recorded as tested elsewhere by another laboratory, and results returned by a referral laboratory, are marked **external**. WHONET exports them only with an external marker; the antibiogram and GLASS leave them out, so a result is counted once, where it was produced. |
| FR-19.5a | **Received isolates count where the work is done** (D-194). Identification and AST performed here on a received isolate (FR-02.13) count in WHONET, the antibiogram and GLASS like the laboratory's own results, marked **referred-in**, under the case's **Original specimen type** (not "Isolate"). The first-isolate de-duplication (D-049) runs on patient, organism and period as usual, so the same isolate counted by the sender and by this laboratory is counted once in a combined dataset. The sender's reported organism is external (FR-19.5) and never counted. |
| FR-19.6 | **Environmental isolates** follow D-123 (never in the antibiogram or GLASS; WHONET only by explicit choice, coded as environmental). |
| FR-19.7 | Changing a case's Program, and a late revival, flag the case for surveillance re-export (FR-03.7, FR-05.7). |

> **Contradicts V1**
> **Where:** M-09 §4.5 and §4.6, M-13 §6, M-15 §4.9 (selection by workflow type); built `MicroCulturePurpose` (two values).
> **V1 said:** exports select by workflow type; two purposes.
> **v2 says:** exports select by the Program's reporting track, purpose and external marker; five purposes.
> **Build state:** Built (WHONET export with purpose filters; M-13 and M-15 specced only).
> **Rework:** three enum values and their validation; WHONET dataset filters; M-13 and M-15 spec edits.

---

### A-20. Labels for plates, subcultures, isolates and AST

| ID | Requirement |
|---|---|
| FR-20.1 | **Print label** is a row action on every culture row and subculture, on each isolate and on each AST or DST panel, and **Print labels** follows Save in Start inoculation, + Subculture and Inoculate on the Worklist (FR-12.6c). Labels reprint at any time. |
| FR-20.2 | Labels use the Clinical Order Entry v4 Labels section and label presets (`LabelPreset`, D-084: no print tracking). Three presets ship: **Culture plate** (lab number and container identifier as barcode, medium, inoculated date and time, sample number), **Isolate** (lab number, isolate number, organism once identified, date; for storage and referral), **AST panel** (lab number, isolate, panel, date). A laboratory can edit the presets like any other. **Scope** (D-210, analyze F-20): the built presets print per order or per sample. An **Isolate** label prints as the isolate's sample item (FR-10.1c), created on the first print if it does not exist yet, so it uses the per-sample scope. **Culture plate** and **AST panel** labels use one new preset scope, **per container** (beside per order and per sample), whose fields are the container identifier as barcode, medium or panel, inoculated date and time, and lab number. This is an extension of the built label presets for every lab, not a micro-only printer. |
| FR-20.3 | Scanning a plate, isolate or panel label anywhere a sample can be scanned opens its case at that row. |

### A-21. The patient's microbiology history on the case

| ID | Requirement |
|---|---|
| FR-21.1 | **Patient history** in the case header opens a panel listing the patient's earlier micro cases, read through the existing patient results query and view (`/PatientResults`, D-206) filtered to micro tests and grouped by case, not a new history query; it lists them from any order and in any lab unit the user holds rights in: date, lab number, specimen and site, Program, organisms, key resistance (MRSA, ESBL, CRE, VRE, RR, MDR and above) and state, each linking to its case. Related cases (same specimen) keep their own switcher. |
| FR-21.2 | **Repeat isolate** (D-168). When an isolate is identified as the same organism as an isolate of the same patient from the same specimen type with AST in the last **N days** (Admin › Microbiology Reference Data, default 14 days; the match is made by the M-09 first-isolate matcher, D-049, called with this clinical window, not by a second matcher, D-206), the isolate shows "Same organism on {labNumber}, {n} days ago, AST done" and offers **Refer to previous susceptibility**. Choosing it cancels the organism default panel (FR-07.1b; the panel is kept, cancelled, No Hard Delete) with that reason on the Timeline, the validator reviews the choice at validation (nothing is suppressed automatically, Mohamed review 1.5), and the report prints "Susceptibility as reported on {labNumber} ({date})" in place of a susceptibility block. The technician can still add a panel. The surveillance first-isolate rule (D-049) is unchanged. |
| FR-21.3 | **TB follow-up.** A case on a TB-track Program with purpose Treatment follow-up shows the patient's baseline TB case (the earliest case with MTB detected, or with RR / MDR classification, in the history) and, read-only, the series of follow-up smear, Xpert and culture results by treatment month, so culture conversion can be read at a glance. |

## Access

Accessible through the existing role bundles (D-006: no new per-action permission keys). Case work is gated like the other lab-unit screens: **Results** rights in the case lab unit for entering and working, **Validation** rights in the case lab unit for validating, releasing final and amending (D-044); a partial report can also be released with Results rights (table below). When the flexible RBAC work lands, releasing a partial report and releasing final must be separately assignable permissions. **Every read and every edit checks the case lab unit**, not only opening the case; today mutations check only the global role. The M-00 §4.1 permission codes (`micro.report.final` and others) were never built and are not used (Contradicts V1 below).

| Action | Who | Rights |
|---|---|---|
| Ordering or cancelling a micro test at order entry and in Edit order | Reception clerk | Order entry (Reception), as for any test |
| Media links on a culture test (Reagents and media); repeat-isolate window | Administrator | Existing Test Catalog rights; Admin › Microbiology Reference Data |
| Test catalog: Opens a Microbiology case, Case role, Collected in sets, Reportable; label presets | Administrator | Existing Test Catalog and label admin rights (Global Administrator) |
| Programs admin: Show on Microbiology case, Reporting track, the Program questionnaire | Administrator | Existing Programs admin rights (Global Administrator) |
| Dictionary categories and their entries (D-187); reflex rules, including the seeded positive-bottle rule (D-189) | Administrator | Existing Dictionary and Reflex Tests admin rights (Global Administrator) |
| Worklist No growth and Inoculate (FR-12.6), Print workplan and Open sheet (FR-12.7, only rows the user can see), Print label, Refer to previous susceptibility, Confirm instrument negative | Technician | Results in the lab unit of each case written |
| Split into separate cases | Technician | Results in the case lab unit |
| Pick a medium and lot; Add new medium (created not tracked; not offered when the lab unit requires tracked media) | Technician | Results in the case lab unit |
| Require tracked media (lab unit setting), Block self-validation (site setting), set warning interval | Administrator | Admin (existing site and lab unit settings) |
| View Used on cultures for a medium lot | Inventory staff | Existing Inventory rights |
| Order a received isolate, tick Tested elsewhere, pick the sending laboratory | Reception clerk | Order entry (Reception), as for any test |
| Make a medium tracked (receive a lot), deactivate duplicates | Inventory staff | Existing Inventory rights |
| Add Microbiology medium items and receive lots | Inventory staff | Existing Inventory rights |
| Everything on the Case view before release: Case information, Initial testing, adding tests and panels, Tested elsewhere, readings and No growth from the Worklist, placing and moving incoming results, referral, notes, Report choices, In lab only, Release partial report | Microbiology technician | Results in the case lab unit |
| Change lab unit | Technician | Results in both the current and the new lab unit |
| Refer out (remaining work, a test or an isolate) | Staff with referral access, as for order entry Refer out | The Sample Shipment Management module (Reception) or Global Administrator; others see Refer out disabled with "You need referral access" (Clinical Order Entry v4 Access) |
| Validate results (expert review), override an interpretation, re-identify an isolate, resolve a TB discordance, edit the TB classification | Microbiology validator | Validation in the case lab unit |
| Release final, open, release or cancel an amendment | Microbiology validator | Validation in the case lab unit |

A user without rights in the case lab unit does not see the case on the Worklist; opening its link shows it read-only, and the server rejects any change (403).

> **Contradicts V1**
> **Where:** M-00 §4.1 and §4.2 (micro permission codes and a Micro Supervisor role).
> **V1 said:** dedicated micro permission codes.
> **v2 says:** the existing Results and Validation rights per lab unit (D-006, D-044).
> **Build state:** Not built (the codes never existed; the micro routes already gate on Results or Validation).

---

## Localization

REUSE keys are cited where they exist; NEW keys follow the built namespace, **`microbiology.*`** (709 built keys; none under `micro.*`, UAT §4, spec-delta Δ-2). Every visible string is listed; search with `npm run i18n:find` before minting, because some of these may already exist under the built names. Patient report keys are in the OGC-1111 microbiology addendum.

| Key | English | Where | Status |
|---|---|---|---|
| `microbiology.case.program` / `.programNotSet` | Program / Program not set | Case header, Case information | NEW |

| `admin.program.showOnMicroCase` / `.reportingTrack` | Show on Microbiology case / Reporting track | Programs admin | NEW |
| `microbiology.case.mtbProgramCheck` | MTB identified: check the Program for TB reporting | Case prompt | NEW |
| `microbiology.case.labUnit` | Lab unit | Case header | NEW |
| `microbiology.case.changeLabUnit` | Change lab unit | Case header | NEW |
| `microbiology.case.labUnitChanged` | Lab unit changed from {from} to {to} | Timeline | NEW |
| `microbiology.case.joinCase` | Join the existing case for this order and sample type | Change lab unit | NEW |
| `microbiology.case.relatedOnSpecimen` | Also on this sample: {cases} | Case header | NEW |
| `microbiology.case.moveToRelated` | Move to related case | Test row | NEW |
| `microbiology.case.migrationProgram` | Program set by migration | Timeline | NEW |
| `microbiology.case.section.incoming` | Incoming results | Case | NEW |
| `microbiology.case.section.caseInfo` | Case information | Case | NEW |
| `microbiology.case.section.initialTesting` | Initial testing | Case | NEW |
| `microbiology.case.section.referral` | Referral point | Case | NEW |
| `microbiology.case.section.culture` | Culture | Case | NEW |
| `microbiology.case.section.astDst` | AST / DST | Case | NEW |
| `microbiology.case.section.additionalTesting` | Additional testing | Case | NEW |
| `microbiology.case.requiredBeforeFinal` | Needed before final report | Field helper | NEW |
| `microbiology.case.appliesToOrder` | Applies to all {count} cases on this order | Case information | NEW |
| `microbiology.culturePurpose.label` | Culture purpose | Case information | REUSE (built) |
| `microbiology.culturePurpose.clinical` / `.screening` | Diagnostic / Screening | Case information | REUSE (built; the English for `.clinical` becomes "Diagnostic") |
| `microbiology.culturePurpose.followUp` / `.surveyStudy` / `.eqa` | Treatment follow-up / Survey or study / EQA / proficiency | Case information | NEW |
| `microbiology.orderDetail.patientOrigin`, `.admissionDate`, `.clinicalHistory`, `.antibioticExposure`, `.numberOfSets` | as built | Case information | REUSE (built) |
| `microbiology.case.splitCases` | Split into separate cases | Case header overflow | NEW |
| `microbiology.case.cultureSet` | Culture set: {samples} | Case header | NEW |
| `microbiology.case.splitCases.reason` | Reason for splitting | Split dialog | NEW |
| `microbiology.case.splitCases.help` | Reason required. Only a sample with no results on the case can be split off. | Split dialog | NEW |
| `microbiology.case.panelMemberNotReported` | Not reported | Report, panel member | NEW |
| `microbiology.case.runView.workedInCase` | Worked in Microbiology case {labNumber} | Run view row | NEW |
| `microbiology.case.isolate.sampleItem` | Isolate sample | Isolate, Additional testing | NEW |
| `microbiology.case.priorAntibiotics` | Prior antibiotics | Case information | NEW |
| `microbiology.case.collectionMethod` | Collection method | Case information | NEW |
| `microbiology.case.collectionTiming` | Collection timing | Case information (sputum) | NEW |
| `microbiology.case.collectionTiming.spot` / `.earlyMorning` | Spot / Early morning | Case information | NEW |
| `microbiology.case.clinicalHistory.counter` | {n} of {max} characters | Clinical history | NEW |
| `microbiology.case.bodySite.search` | Search body sites | Body site picker | NEW |
| `microbiology.case.addTestOrPanel` | Add test or panel | Initial testing, AST / DST, Additional testing | NEW |
| Order entry chooser keys (Order Panels, Order Tests, search, selected, no match) | as in Clinical Order Entry v4 FR-B14 | Add test or panel | REUSE |
| `microbiology.case.chooser.allLabUnits` | Show all lab units | Add test or panel | NEW |
| Result flag keys (High, Low, Abnormal, Critical) | as on Results Entry | Result rows | REUSE |
| `microbiology.case.testedElsewhere` | Tested elsewhere | Test row (replaces `microbiology.case.previousReport`, D-195) | NEW |
| `order.micro.summary.title` | What this order will open | Order entry summary panel (FR-02.3b) | NEW |
| `order.micro.summary.opensCase` | {0} case in {1}: {2} | Summary line | NEW |
| `order.micro.summary.staysInResults` | {0} stays in Results | Summary line | NEW |
| `order.micro.summary.reflex` | If {0}: adds {1} | Summary line | NEW |
| `order.micro.summary.splitWarning` | This sample opens {0} cases: {1} | Summary warning | NEW |
| `order.micro.tag.opensCase` / `.staysInResults` | Opens a case / Stays in Results | Summary Tags | NEW |
| `order.sample.setNumber` | Set | Sample row, tests collected in sets | NEW |
| `order.sample.set.option` | Set {0} | Set dropdown | NEW |
| `order.sample.set.warn.single` | Set {0} has one bottle | Save warning | NEW |
| `order.sample.set.warn.sameType` | Set {0} has two {1} bottles | Save warning | NEW |
| `order.sample.set.warn.siteTime` | Set {0} bottles were collected at different sites or {1} minutes apart | Save warning | NEW |
| `order.sample.set.warn.paediatric` | Set {0} mixes a paediatric bottle with adult bottles | Save warning | NEW |
| `microbiology.case.header.setLine` | Set {0}: {1}, {2}, {3} | Case header | NEW |
| `microbiology.case.receivedFrom` | Received from {0} | Isolate Tag, culture row | NEW |
| `microbiology.case.receivedIsolateOutcome` | Growth (received isolate) | Culture outcome | NEW |
| `microbiology.case.reportedIdentification` | Reported identification | Isolate field | NEW |
| `microbiology.case.reportedIdDiffers` | Identification differs from the sender's | Validation check | NEW |
| `microbiology.case.originalSpecimenType` | Original specimen type | Case information, received isolate | NEW |
| `microbiology.case.answerSource` | Last changed in {0} by {1}, {2} | Questionnaire answer helper | NEW |
| `microbiology.case.answerSource.order` / `.case` | Order entry / Case | Answer source | NEW |
| `microbiology.case.history.enteredBy` / `.validatedBy` / `.returnedBy` | Entered by {0}, {1} / Validated by {0}, {1} / Returned by {0}, {1}: {2} | Result history | NEW |
| `microbiology.case.tag.readingDue` / `.analyzerFlag` | Reading due / Analyzer flag | Result row Tags | NEW |
| `validation.selfValidationBlocked` | You entered this result; another validator must validate it | Validate action | NEW |
| `siteInfo.blockSelfValidation` | Block self-validation | Site setting | NEW |
| `microbiology.labUnit.requireTrackedMedia` | Require tracked media | Lab unit setting | NEW |
| `microbiology.case.inoc.lotRequired` | This lab unit requires a tracked medium with a lot | Medium validation | NEW |
| `inventory.lot.usedOnCultures` | Used on cultures | Inventory lot view | NEW |
| `microbiology.worklist.overdue` | Overdue {0} | Due column Tag | NEW |

| `microbiology.case.performedBy` | Performed by | Test row | NEW |
| `microbiology.case.performedBy.laboratory` / `.person` | Laboratory / Person | Performed by type | NEW |
| `microbiology.case.datePerformed` | Date performed | Test row | NEW |
| `microbiology.case.external` | External result | Test row tag | NEW |
| `microbiology.case.referRemaining` | Refer remaining work | Referral point (opens the Refer out panel) | NEW |
| `label.referOut.*` (section, columns, fields, statuses, actions) | as built | Referral point | REUSE |
| `order.referral.testsToRefer`, `.reason`, `.partial`, `.aliquotFirst`, `.existing`, `.dispatchLater` | as in Clinical Order Entry v4 | Referral point | REUSE |
| `microbiology.case.referIsolate` | Refer isolate | Isolate | NEW |
| `microbiology.case.stage.referred` | Referred | Stage tag | NEW |
| `microbiology.case.stage.initialTesting` / `.resultsEntered` / `.validated` | Initial testing / Results entered / Validated | Stage tag | NEW |
| `microbiology.case.outcome.noCulture` | No culture performed | Culture outcome | NEW |
| `microbiology.case.outcome.ntm` | NTM identified | Culture outcome | NEW |
| `microbiology.case.inoc.duration` | Incubation duration | Inoculation row | NEW |
| `microbiology.case.inoc.unit.hours` / `.days` | Hours / Days | Unit dropdown | NEW |
| `microbiology.case.inoc.medium` | Medium | Inoculation row | NEW |
| `microbiology.case.inoc.lot` | Lot | Inoculation row | NEW |
| `microbiology.case.inoc.notTrackedTag` | Not tracked | Culture row tag | NEW |
| `microbiology.case.inoc.addMedium` | Add new: {name} | Medium search, no match | NEW |
| `microbiology.case.inoc.tracked` | Tracked | Medium option tag | NEW |
| `microbiology.case.inoc.noUsableLot` | No usable lot in Inventory. Receive a lot, or choose another medium. | Medium helper | NEW |
| `microbiology.case.inoc.searchMedium` | Search media | Medium ComboBox | NEW |
| `microbiology.case.inoc.mediumHelp` | Microbiology medium items. Tracked media need a lot; not tracked media have none. | Medium helper | NEW |
| `microbiology.case.inoc.selectLot` / `.pickMediumFirst` | Select a lot / Pick a medium first | Lot dropdown | NEW |
| `microbiology.case.inoc.lotHelp` | Recorded on the row for traceability; stock is not changed here. Usable lots first, earliest expiry first. | Lot helper | NEW |
| `microbiology.case.inoc.scanHelp` | Scan a lot barcode to fill Medium and Lot. | Lot helper | NEW |
| `microbiology.case.inoc.notTrackedTimeline` | Recorded on the Timeline as not tracked in inventory. | Lot area, not tracked medium | NEW |
| `microbiology.case.inoc.atmosphere.prefill` | Pre-filled from the medium's usual atmosphere when Inventory records one | Atmosphere helper | NEW |
| Lot unavailable reasons (expired, QC failed, quarantined, consumed) | as built | Lot dropdown | REUSE (`microbiology.reagentLots.conflict.*`) |
| `inventory.itemType.microbiologyMedium` | Microbiology medium | Inventory item form | NEW |
| `inventory.item.usualAtmosphere` / `.usualTemperature` | Usual atmosphere / Usual temperature (°C) | Inventory item form | NEW |
| `microbiology.case.inoc.atmosphere` | Atmosphere | Inoculation row | NEW |
| `microbiology.case.inoc.atmosphere.aerobic` / `.co2` / `.candleJar` / `.anaerobic` / `.microaerophilic` | Aerobic (ambient air) / CO₂-enriched (5 to 10%) / Candle jar / Anaerobic / Microaerophilic | Atmosphere dropdown | NEW |
| `microbiology.case.inoc.temperature` | Temperature (°C) | Inoculation row | NEW |
| `microbiology.case.inoc.checkEvery` | Check every | Inoculation row | NEW |
| `microbiology.case.inoc.ends` | Incubation ends | Inoculation row | NEW |
| `microbiology.case.inoc.nextCheck` | Next check | Inoculation row | NEW |
| `microbiology.case.inoc.checkDue` | Check due | Row tag, Worklist reason | NEW |
| `microbiology.case.inoc.applyTemplate` | Apply template: {name} | Start inoculation | NEW |
| `microbiology.case.inoc.instrumentNegative` | No growth, protocol complete (instrument) | Culture row proposal | NEW |
| `microbiology.case.inoc.confirm` | Confirm | Instrument negative | NEW |
| `microbiology.case.attention.instrumentNegative` | Instrument negative to confirm | Needs attention reason | NEW |
| `microbiology.case.subculture.purpose` | Purpose | Subculture from a row with no growth | NEW |
| `microbiology.case.subculture.purpose.enrichment` / `.blind` / `.purity` / `.other` | Enrichment / Blind or terminal subculture / Purity / Other | Subculture purpose | NEW |
| `microbiology.case.growth.testOnCulture` | Test on this culture | Culture row Add menu | NEW |
| `microbiology.case.culture.add` | Add | Culture row menu (Gram stain, Test on this culture, Subculture) | NEW |
| `microbiology.case.gram.add` / `.title` | Gram stain / Gram stain on {container} | Culture row Add menu, form | NEW |
| `microbiology.case.subculture.addMedium` | + Add another medium | Subculture form | NEW |
| `microbiology.case.notes.printsUnderCulture` | Prints under the culture result on the report. | Send with Result on a culture row, microscopy exam or the case | NEW |
| `microbiology.case.growth.fromCulture` | From {container} | Case test row | NEW |
| `microbiology.case.outcome.noCultureOrdered` | No culture ordered | Culture outcome | NEW |
| `microbiology.case.addCulture` | Add culture | Culture section, no culture ordered | NEW |
| `microbiology.case.cultureSet.summary` | {test}: {sets} sets, {bottles} bottles | Case header | NEW |
| `microbiology.case.numberOfSets.computed` | Counted from the samples on the order | Case information helper | NEW |
| `microbiology.case.printLabel` / `.printLabels` | Print label / Print labels | Row action, after save | NEW |
| `microbiology.label.preset.culturePlate` / `.isolate` / `.astPanel` | Culture plate / Isolate / AST panel | Label presets | NEW |
| `microbiology.case.patientHistory` | Patient history | Case header | NEW |
| `microbiology.case.patientHistory.empty` | No earlier microbiology cases for this patient. | Patient history | NEW |
| `microbiology.case.repeatIsolate` | Same organism on {labNumber}, {days} days ago, AST done | Isolate | NEW |
| `microbiology.case.referPreviousAst` | Refer to previous susceptibility | Isolate action | NEW |
| `report.patient.micro.referPrevious` | Susceptibility as reported on {0} ({1}) | Patient report | NEW (report FRS §13.1.3) |
| `microbiology.case.tbFollowUp` | Follow-up results by treatment month | TB follow-up panel | NEW |
| `microbiology.worklist.awaitingInoculation` | Awaiting inoculation | Cultures view filter chips | NEW |
| `microbiology.worklist.checkDue` / `.finalReadDue` | Check due / Final read due | Cultures view filter chips | NEW |
| `microbiology.worklist.noGrowth` | No growth | Worklist row action | NEW |
| `microbiology.worklist.noGrowthBulk` | No growth ({count}) | Worklist selection action | NEW |
| `microbiology.worklist.noGrowthSummary` | Records No growth on {count} rows: {checks} checks, {finals} final reads | Worklist selection | NEW |
| `microbiology.worklist.skipped` | {count} will be skipped: {reasons} | Worklist selection | NEW |
| `microbiology.worklist.skip.instrumentNegative` / `.growthRecorded` / `.noRights` | needs Confirm (instrument negative) / growth already recorded, open the case / not in your lab units | Skip reasons | NEW |
| `microbiology.worklist.recorded` | No growth recorded on {count} rows | Toast | NEW |
| `common.undo` | Undo | Toast | REUSE, PENDING #3863 |
| `microbiology.worklist.inoculate` | Inoculate ({count}) | Awaiting inoculation selection action | NEW |
| `microbiology.worklist.oneSampleType` | Inoculate needs one sample type: {count} selected cases are {sampleType} | Refusal | NEW |
| `microbiology.worklist.inoculateSummary` | Creates {plates} plates on {cases} cases: {byMedium} | Inoculate panel | NEW |
| `catalog.test.reagentsAndMedia` | Reagents and media | Test catalog section (relabels Reagents) | NEW |
| `catalog.test.mediaLink.sampleType` / `.order` / `.duration` / `.checkEvery` / `.loopVolume` | Sample type / Order / Duration / Check every / Loop volume | Medium link fields | NEW |
| `catalog.test.mediaLink.anySampleType` | Any sample type | Medium link | NEW |
| `microbiology.worklist.linkedMedia` / `.notTracked` / `.chooseLot` | Linked media / Not tracked / Choose a lot | Inoculate panel | NEW |
| `microbiology.worklist.openCase` | Open case | Worklist row link | NEW |
| `microbiology.worklist.printSheet` | Print workplan | Cultures view filters | NEW |
| `workplan.type.microBench` | Microbiology bench | Workplan type (existing Workplan page) | NEW |
| `catalog.test.reportable.microHelp` | When off, this test starts In lab only on a Microbiology case. | Test catalog Reportable helper | NEW |
| Dictionary categories `Culture atmosphere`, `Culture reading`, `Culture quantity`, `Subculture purpose`, `Extend incubation reason`, `Microscopy grade` | Category names and seeded entries as in FR-05.1a, FR-05.4, FR-10.1a, FR-05.3a, FR-06.1a | Admin › Dictionary (existing) | NEW (seed data) |
| `microbiology.worklist.openSheet` / `.closeSheet` / `.reprint` | Open sheet / Close sheet / Reprint | Cultures view | NEW |
| `microbiology.sheet.number` / `.printedBy` / `.page` | Sheet {number} / Printed by {user}, {dateTime} / Page {n} of {N} | Bench sheet header | NEW |
| `microbiology.sheet.reprintMark` | Reprint | Bench sheet header | NEW |
| `microbiology.sheet.col.tick` / `.reading` / `.quantity` / `.initials` / `.notes` | Done / Reading / Quantity / Initials / Notes | Bench sheet columns | NEW |
| `microbiology.sheet.codes` | Reading codes: NG No growth, NF Normal flora, MG Mixed growth, SG Significant growth (write the quantity), C Contaminated | Bench sheet footer | NEW |
| `microbiology.sheet.confirmOnScreen` / `.noTemplate` / `.lotUsed` | Confirm on screen / No template: write the media / Lot used | Bench sheet rows | NEW |
| `microbiology.sheet.confidential` | Contains patient information. Shred after use. | Bench sheet footer | NEW |
| `microbiology.sheet.banner` | Sheet {number}: {title}, printed by {user}, {dateTime} | Open sheet banner | NEW |
| `catalog.test.caseTest.help` | A case test: reception orders it to send a sample to this lab unit as a micro case before the tests are known. | Test catalog | NEW |
| `catalog.test.duplicate` | Duplicate | Test catalog row action | NEW (check the catalog for an existing Copy key first) |
| `microbiology.case.inoc.inoculatedAt` / `.editTime` / `.timeChanged` | Inoculated at / Edit time / Inoculated at changed from {old} to {new} | Culture row, Timeline | NEW |
| `microbiology.case.inoc.extend` / `.extendBy` / `.extendReason` / `.newEnd` / `.extended` / `.extendedLog` | Extend incubation / Extend by / Reason / New incubation end / extended / Incubation extended {n} {unit} ({reason}); now ends {dateTime} | Culture row menu and form, row tag, read log | NEW |
| `microbiology.case.inoc.extendReason.immature` / `.slow` / `.fastidious` / `.clinician` / `.other` | Colonies too small to identify or pick / Slow-growing organism suspected / Fastidious organism suspected (for example endocarditis) / Clinician request / Other | Extend incubation reason | NEW |
| `microbiology.case.inoc.positiveAt` / `.ttp` / `.editPositiveAt` / `.positiveAt.help` / `.positiveAt.invalid` | Positive at / Time to positivity / Edit positive time / Defaults to now (server time); change it to when growth was seen / Not before Inoculated at and not in the future | Culture row, Mark positive form | NEW |
| `microbiology.case.gram.enterResult` / `.noResult` / `.reflexBottle` / `.result` / `.grade` / `.save` | Enter result / No result yet / Positive blood culture bottle / Result / Grade / Save Gram stain | Gram stain row and form | NEW |
| `microbiology.case.chooser.on` / `microbiology.case.ast.panels` | On / Panels | AST / DST chooser and panel table | NEW |
| `report.patient.micro.group.initial` / `.culture` / `.ast` / `.additional` | Initial testing / Culture / AST / DST / Additional testing | Report choices and print preview (shared with the report FRS) | NEW (report FRS §13.1) |
| `time.day` / `.days` / `.hour` / `.hours` / `.minute` / `.minutes` | day / days / hour / hours / minute / minutes | Time to positivity text (check for existing duration keys first) | NEW |
| `microbiology.worklist.extend` / `.extendHelp` | Extend 24 h / Other lengths and the Other reason: Extend incubation on the case. | Worklist, Final read due | NEW |
| `microbiology.case.samples` / `.samplesSummary` | Samples / {count} samples, {sites} sites | Case information, header | NEW |
| `microbiology.case.inoc.templateHelp` | The culture test's linked media for this sample type; untick or change rows. Nothing on the case depends on them. | Start inoculation | NEW |
| `microbiology.case.inoc.addRows` | Add {count} rows | Start inoculation | NEW |
| `microbiology.case.inoc.oneRow` | Or add one row (pre-filled from the previous row): | Start inoculation | NEW |
| `microbiology.case.inoc.instrumentNegativeConfirmed` | No growth, protocol complete: confirmed | Worklist, culture row | NEW |
| `microbiology.case.subculture.select` | Select a culture | Subculture | NEW |
| `microbiology.case.patientHistory.findings` / `.help` | Organisms and key resistance / Earlier micro cases for this patient, any order, lab units you hold rights in. A Treatment follow-up case also shows its baseline TB case and the results by treatment month. | Patient history | NEW |
| `microbiology.case.inoc.reading` | Reading | Record reading | NEW |
| `catalog.test.opensMicroCase` | Opens a Microbiology case | Test catalog field | NEW |
| `catalog.test.opensMicroCase.yes` / `.no` | Yes / No | Opens a Microbiology case switch | NEW |
| `catalog.test.caseRole` / `.caseRole.culture` / `.caseRole.direct` / `catalog.test.collectedInSets` | Case role / Culture / Direct / Collected in sets | Test catalog | NEW |
| `microbiology.case.inoc.complete` | Incubation complete | Row tag, Worklist reason | NEW |
| `microbiology.case.inoc.recordReading` | Record reading | Inoculation row | NEW |
| `microbiology.case.inoc.dayOf` | Day {n} of {N} | Row, Worklist | NEW |
| `microbiology.case.inoc.timeToPositivity` | Time to positivity | Inoculation row | NEW |
| `microbiology.case.inoc.growth` / `.noGrowth` | Growth / No growth | Outcome | NEW |
| `microbiology.case.reading.noGrowth` / `.normalFlora` / `.mixedGrowth` / `.significantGrowth` | No growth / Normal flora / Mixed growth / Significant growth | Reading | NEW |
| `microbiology.case.reading.quantity` | Quantity | Reading | NEW |
| `microbiology.case.reading.quantity.scanty` / `.plus1` / `.plus2` / `.plus3` | Scanty / + / ++ / +++ | Quantity scale | NEW |
| `microbiology.case.reading.contaminated` | Contaminated | Outcome | NEW |
| `microbiology.case.requestRepeat` | Request repeat specimen | Outcome | NEW |
| `microbiology.case.inoc.markPositive` / `.markNoGrowth` | Mark positive / Mark no growth | Inoculation row | REUSE if built, else NEW |
| `microbiology.case.subculture.fromCulture` | From culture | Subculture | NEW |
| `microbiology.case.isolate.pickedFrom` | Picked from | Add isolate | NEW |
| `microbiology.case.isolate.fromSource` | from {source} | Isolate label | NEW |
| `microbiology.case.ast.runForAgent` | Reading from | Report list | NEW |
| `microbiology.case.growth.internalOnly` | Internal only, not reported | Culture row child tag | NEW |
| `microbiology.case.incoming.waiting` | {n} waiting | Incoming results | NEW |
| `microbiology.case.incoming.col.test` / `.value` / `.source` / `.received` / `.placeIn` | Test / Value / Source / Received / Place in | Incoming results | NEW |
| `microbiology.case.incoming.placeIn` | Place in | Incoming results, button group label | NEW |
| `microbiology.case.incoming.isolate` / `.isolateNamed` | Isolate / Isolate: {isolate} | Incoming results, place button | NEW |
| `microbiology.case.incoming.ast` / `.astNamed` | AST / DST / AST / DST: {isolate} | Incoming results, place button | NEW |
| `microbiology.case.incoming.createIsolate` | Create isolate and place | Incoming results | NEW |
| `microbiology.case.incoming.chooseIsolate` | Choose isolate | Incoming results, isolate menu (several isolates) | NEW |
| `microbiology.case.incoming.needsAmendment` | Needs amendment | Incoming results | NEW |
| `microbiology.case.incoming.placeFailed` | Could not place: {reason} | Incoming results | NEW |
| `microbiology.case.moveResult` | Move result | Result row | NEW |
| `microbiology.case.moveReason` | Reason for move | Move panel | NEW |
| `microbiology.case.report.include` | Report | Report list | NEW |
| `microbiology.case.report.untickCritical` | This is a critical result. Leave it off the report? | Confirmation | NEW |
| `microbiology.case.report.releasePartial` | Release partial report | Report (replaces the built Release preliminary) | NEW |
| `report.state.partial` / `.final` / `.amended` | Partial / Final / Amended | Release history | REUSE (Report Print Queue) |
| `microbiology.case.report.incomingWaiting` | {n} incoming results are waiting. Release the final report anyway? | Confirmation | NEW |
| `microbiology.case.bpStandard.reason` | Reason for another breakpoint standard | AST / DST | NEW |
| `label.results.notes.inLabOnly` / `label.results.notes.sendWithResult` | In Lab Only / Send with Result | Note type (all micro notes) | REUSE (Results Entry v2.1) |
| `button.results.notes.newNote` / `label.results.notes.newNote` | New Note | Notes section | REUSE (Results Entry v2.1) |
| `microbiology.case.notes.title` | Notes | Notes section on culture rows, isolates, case | NEW |
| `microbiology.case.notes.count` | Notes ({count}) | Row action | NEW |
| `microbiology.case.notes.save` | Save note | Note form | NEW |
| `microbiology.case.notes.none` | No notes yet. | Notes section, empty | NEW |
| `microbiology.case.notes.notPrinted` | This result is not on the report, so this note will not print | Note form warning | NEW |
| `microbiology.case.tbClassification` | Resistance classification | AST / DST | NEW |
| `microbiology.case.tbClassification.rr` / `.mdr` / `.preXdr` / `.xdr` / `.pan` / `.mono` / `.poly` | RR-TB / MDR-TB / pre-XDR-TB / XDR-TB / Pan-susceptible / Mono-resistant / Poly-resistant | AST / DST | NEW |
| `microbiology.case.tb.discordant` | Discordant | AST / DST | NEW |
| `microbiology.case.addedByRule` | Added by rule: {rule} | Test row | NEW |
| `microbiology.case.inLabOnly` | In lab only | Test row | NEW |
| `microbiology.case.inLabOnly.helper` | Not shown on the patient report | Test row | NEW |
| `microbiology.case.critical.outcome` | Outcome | Critical communication | NEW |
| Callback outcome keys (Read back confirmed, Reached no read-back, Unable to reach) | as in the critical callback log (OGC-714) | Critical communication | REUSE |
| `microbiology.worklist.card.attention` | Needs attention | Worklist | NEW |
| `microbiology.worklist.reason.checkDue` / `.incubationComplete` / `.incoming` / `.referralReturned` / `.needsAmendment` / `.missingRequired` | Check due / Incubation complete / Incoming results / Referral returned / Needs amendment / Missing required fields | Worklist | NEW |
| `microbiology.worklist.filter.program` | Program | Worklist filter | NEW |
| `microbiology.worklist.due.startInitial` / `.inoculateOrRefer` / `.readPlates` / `.recordOutcome` / `.workUpGrowth` / `.validate` / `.release` | Start initial testing / Inoculate or refer / Read plates / Record outcome / Work up growth / Validate / Release | Worklist Due | NEW |

---

## Dependencies (data elements)

Named data elements only; storage is the implementing engineer's call.

**New**
- Case lab unit label (the lab unit working a case; changeable; used for Worklist and access). Not part of the case key.
- Panel interpretation model (clinical breakpoints or TB critical concentrations), replacing the panel's workflow type; a WHO critical-concentration breakpoint authority (today the authority CHECK allows CLSI and EUCAST only).
- Prior antibiotics: agent and date, repeatable (today a single yes/no).
- TB history, treatment month, specimen number and the other Program questions: questionnaire answers in the order's QuestionnaireResponse (D-186, D-198), not micro_case columns; they apply to every case of the order.
- Specimen collection method (per case); sputum collection timing (Spot, Early morning) per sample in the Samples list; clinical history limit raised from 1000 to 4000 characters (validation only).
- Culture purpose values Treatment follow-up, Survey or study, EQA / proficiency.
- Inoculation outcome per row (positive, growth, no growth, contaminated) with who and when; isolate source row (the culture or subculture an isolate was picked from).
- Inoculation: medium as a Microbiology medium item, with the lot recorded as a reference when tracked (no usage row); atmosphere from a laboratory-extendable coded list (shipped values in FR-05.1a), temperature, duration value, duration unit, check interval value and unit; readings (coded reading, quantity, note, who, when, incubation day); outcome; aliquot used; time to positivity.
- Analyzer positive signal with its signal time, matched to one inoculation by container identifier.
- **Positive at** per culture row (FR-05.4b, D-180): date and time to the minute, its source (analyzer or manual), and each edit (old and new time, who, when); time to positivity is computed from it and Inoculated at.
- **Incubation extension** per culture row (FR-05.3a, D-179): one record per extension with the amount and unit, the reason (Extend incubation reason dictionary entry, or Other with text), who and when, and whether it was undone; the row's new end is computed from them.
- **Reflex rule action attributes** (FR-05.5a, FR-10.1g, FR-15.3): an added test can target the culture row whose result fired the rule (matched by container identifier) and can be added In lab only. Each culture row's outcome is stored as a row result (the inoculation outcome above) carrying the generic culture test's analysis; the case result is the roll-up. Two plates of one urine share the analysis and keep their own row results.
- Result provenance: performed by (a person, or a laboratory from the Organizations list), date performed, external marker (shared with Clinical Order Entry v4 FR-B20).
- Incoming result holding item: source, received time, placement, Needs amendment marker.
- Per-result report inclusion on the case.
- Tests on a culture row (Gram stain, microscopy, rapid ID): case-linked analyses with a reference to the culture row they were run on (D-183); In lab only as for any case test, starting from the catalog Reportable setting (D-204).
- Case work stage values (FR-17.1), culture outcome values including No culture performed and NTM identified, Referred marker.
- Partial releases recorded as Partial report versions with validator and time (D-150, D-201; today preliminary is an activity only).
- Isolate sample item: a link from `micro_isolate` to a derived sample item, and an Isolate sample type (shared with Pathogen WGS; parent and child sample items are built).
- Case member samples (the other samples of a culture set, FR-02.4a), with split history; a **set number** per sample (D-192), from which the number of sets is counted.
- Received isolate (D-194): Tested elsewhere on a test that has a sample (the sending laboratory and reported value already exist for FR-B20); **Original specimen type** on the case; isolate **Reported identification** and the **Received from** source; the received isolate culture outcome; the **referred-in** marker in surveillance exports.
- Settings: lab unit **Require tracked media** (D-196); site **Block self-validation** (D-191); set warning interval (default 30 minutes) (D-192).
- Inventory **Used on cultures** (D-197): a read-only count and list per Microbiology medium lot, computed from culture rows.
- Test catalog: one **Opens a Microbiology case** switch (Yes / No, replacing `test.culture_workflow_type`) allowed on culture, direct and case tests; **Case role** (Culture / Direct / Case) and **Collected in sets** fields (FR-01.1, FR-01.1a, FR-01.1b).
- Not tracked Microbiology medium items with no lots (FR-05.1d), using the Inventory v1.9 per-item Track lots property (D-037, D-202).
- Media links (D-208): on the built `test_reagent_link`, an optional sample type, order, duration and unit, check interval, loop volume and optional atmosphere and temperature overrides, for links to Microbiology medium items; no quantity.
- Instrument negative signal matched by container identifier, held as a proposal until confirmed.
- Subculture purpose.
- Nothing new for Worklist bench work: readings, culture rows and Timeline entries are the case's own (D-172); no run or batch record.
- **Opens a Microbiology case (D-178):** a Yes / No test catalog attribute replacing `test.culture_workflow_type` (kept for migration), and Case role (`CULTURE`, `DIRECT`, `CASE`).
- **Program on the case (D-178):** a reference from `micro_case` to a program; on the existing program record, **Show on Microbiology case** (Yes / No) and **Reporting track** (a Dictionary category entry, D-207). Program questionnaires are the existing ones.
- **Case key (D-178):** order + sample type + lab unit (a new uniqueness rule replacing `uq_micro_case_sample_workflow`; culture sets per FR-02.4a).
- **Bench sheet (D-174, D-188, D-209):** printed through the existing Workplan print with the Microbiology bench layout; stored as the Workplan **print record** (never a Workplan batch, so no run is created, D-052, D-172): sheet number, title (the filter), filters applied, printed by and at, reprint count, and the ordered row list (case and culture row references with their group), for Open sheet (last 7 days) and audit.
- Label presets Culture plate, Isolate and AST panel; a new **per container** scope on the built `LabelPreset` (beside `printsPerOrder` and `printsPerSample`) for plate and panel labels (D-210); isolate labels print from the isolate sample item.
- Repeat-isolate window setting; isolate "refer to previous susceptibility" link to the earlier isolate.
- The seeded Inventory type tag "Microbiology medium" (D-037: type is a tag, no enum value), and the item's optional usual atmosphere and usual temperature.
- Dictionary categories seeded for micro (D-187): Culture atmosphere, Culture reading, Culture quantity, Subculture purpose, Extend incubation reason, Microscopy grade, Reporting track. Gram stain and other graded observations use built multi-component results (D-185); no new result type.
- Notes with In Lab Only / Send with Result type attached to the case, a culture row, an isolate or a drug result: rows in the existing `note` table with new reference tables (D-205).
- Derived TB resistance classification (computed, with supervisor edit and reason), per-drug discordance resolution.
- In lab only flag on a case test, with its change history; the section a case test was added in.
- Link from a micro critical communication to its `critical_callback` rows; call outcome.

**Reused**
- `MicroCase.workflow_type` kept stored for history and migration (A-01); `uq_micro_case_sample_workflow` replaced by the FR-02.4 key.
- `test.culture_workflow_type`, kept stored for migration only (D-178); nothing reads it.
- `MicroCaseOrderDetail` fields (edited on the Case view instead of order entry); `culture_purpose`; the patient origin default from the requesting organization.
- `MicroCaseAnalysis` (links tests to the case).
- Inventory items, lots and lot rules (read only from the culture row; stock actions stay in Inventory). `micro_inventory_usage_link` stays for reagent lots from the M-12 picker, unchanged.
- `MicroCaseInoculation.source_inoculation_id` (subcultures from any culture row, any number per parent); several `MicroAstRun` rows per isolate (built); the CreateAliquot path (decontamination).
- Existing referral and referral results return: the order entry Refer out section and form (`OrderReferOutSection`, `OrderReferOutForm`, `ReferralStatusTag`), referral per test and referral set, Sample Shipment dispatch.
- M-01 `report_behavior` (now applied); `AST_REPORTABLE_SELECTED` (Use for reporting).
- Body site and laterality (D-079, Clinical Order Entry v4 section N).
- Analyzer accept semantics (D-059); per-lab-unit Results and Validation rights (D-044).
- Organizations list (Locations & Organizations) for the performing laboratory.
- Test catalog result limits, dictionary abnormal flags, critical ranges and reflex rules, applied as on Results Entry.
- Program questionnaire answers: `questionnaire_response` and `program_sample.questionnaire_response_uuid`, written through `QuestionnaireStorageService` (local first, FHIR store mirror when configured) (D-198).
- Analysis statuses (`StatusService.AnalysisStatus`: NotStarted, TechnicalAcceptance, TechnicalRejected, BiologistRejected, Finalized, Canceled) shown on case results (D-191).
- Inventory lot fields (supplier or manufacturer, received date, expiry, QC status, storage location) for prepared media batches (D-196).
- Calculated value tests admin, for CFU/mL where a lab wants it (D-200; developer to confirm on case results).
- `critical_callback` (OGC-714) for every critical call.
- `result_signature` and analysis release dates, written by case release.
- The environmental results certificate (`ComplianceReportRestController`, Laporan Hasil).

**Upstream, not built (must land first or with this work)**
- Inventory redesign v1.9: type as a tag and the per-item Track lots property (D-037, D-202).
- Clinical Order Entry v4 (specced): the test and panel chooser (FR-B14), Tested elsewhere (FR-B20), required marking (FR-A8), body site (section N), the Labels section; and the draft 10.4 additions (summary panel, Set field, FR-02.3b, FR-02.4a).
- Patient Report & Report Management v2.2 (OGC-1111, specced) with its microbiology addendum.
- Multi-component results on Results Entry (OGC-1126, OGC-1127): the registry lists them in progress; developer to confirm what is on develop before relying on them (D-185).
- OGC-714 callback log changes (FR-18.2a): criticality source, finding text, metrics and clearance for rule-flagged criticals.
- M-11 `ORGANISM_PHENOTYPE` critical rules (specced; `MicroCriticalCommunication` itself is built).
- M-06 reflex engine with rule provenance for "Added by rule" (specced).
- WHO critical-concentration breakpoint authority (OGC-916).
- Runs (OGC-1200): run of one for case results; Run view read-only case rows.
- Per-agent Use for reporting (FR-07.2b; today it is per run).
- Surveillance re-export flag (FR-03.7, FR-19.7).
- Report Print Queue issue history (OGC-1031 r4) for report versions.
- Locations & Organizations admin, so a performing laboratory can be added to the Organizations list (AC-V2-39).

**Retired (kept read-only)**
- Culture setups; culture protocol on the case; the case's UNASSIGNED value; the per-analysis report mapping for printing (`reportable_test_analyte_id`); the REMARK projection on the printed report (kept for electronic results until confirmed).

**Coordination**
- The environmental certificate is built in Java with hard-coded English labels, outside the report registry. Adding the micro block is the moment to move its labels to translation keys; registering it in Report Management is OGC-1111 V2 work.

---

## Acceptance Criteria

Each criterion also meets the M-NFR baseline it touches (NFR-01 offline reads, NFR-02 audit, NFR-04 localization).

- **AC-V2-01** Ordering "Bacterial culture" on a urine from the ordinary test picker opens exactly one case in the test's lab unit; a second urine on the same order joins it; the order saves under any Program, and the order's Program is not changed.
- **AC-V2-02** Order entry shows no Microbiology section; a sputum with only Xpert MTB/RIF Ultra opens one TB case, which releases on the Xpert result with culture "No culture ordered"; a reflex TB culture on rifampicin resistance joins that case; an RPR on a serum and a CBC tube on the same order open no case.
- **AC-V2-03** Ordering TB culture and Bacterial culture on one sputum opens two related cases; a second Bacterial culture on that sputum joins the existing case; each case shows the other in its header switcher.
- **AC-V2-04** Change lab unit moves the case to the new lab unit's Worklist, writes a Timeline entry, leaves the Program and tests unchanged, offers to join when the target lab unit already has a case for the same order and sample type, and is refused after final release.
- **AC-V2-05** No screen, filter, rule or export reads a workflow type or culture type; the test catalog shows the Opens a Microbiology case switch and Case role; the Culture setups admin screen is gone and its route redirects; UNASSIGNED cannot be created.
- **AC-V2-06** Order entry shows no micro fields; Case information shows them and saves to the same record; editing clinical history on one case shows on its related case with the "Applies to all" helper.
- **AC-V2-07** Fields required to save show an asterisk; fields required before final report show the marker and "Needed before final report"; the final checklist lists each missing one with a link.
- **AC-V2-08** Initial testing appears between Case information and Culture and accepts any catalog test through the chooser.
- **AC-V2-09** Ticking Tested elsewhere on a case test reveals Performed by and Date performed; the saved result shows its provenance and the External tag on the case and "Performed by {laboratory}" on the report.
- **AC-V2-10** An inoculation cannot be saved without duration, unit and atmosphere; Atmosphere is a dropdown with the FR-05.1a values and no free text; Incubation ends is shown and computed from the inoculation time.
- **AC-V2-11** With Check every set, the case appears under Needs attention with "Check due" at the due time; No growth on that row in the Worklist's Check due filter records a No growth reading with user and time, clears the reason and sets the next check; offline, No growth is disabled.
- **AC-V2-12** At incubation end the case appears under Needs attention with "Incubation complete" until an outcome is recorded.
- **AC-V2-13** Extend incubation on a row does not reset its clock: Day n still counts from Inoculated at.
- **AC-V2-14** A test on a culture marked In lab only (for example ZN stain, culture, whose catalog Reportable setting is off) never appears on a report, a WHONET export or a surveillance submission.
- **AC-V2-15** Refer remaining work shows Referred beside the work stage and allows a partial report with validated local results.
- **AC-V2-16** A returned referral result or an analyzer result for a test not on the case appears in Incoming results with the four place buttons (Initial testing, Isolate, AST / DST, Additional testing), none preselected; one click places it; nothing is placed until a person clicks.
- **AC-V2-17** A result for a test already on the case, including a returned referral result for a referred test, goes to that row, marked for review, without passing through Incoming results.
- **AC-V2-18** Moving a placed result requires a reason and leaves one copy of the result.
- **AC-V2-19** The Report list defaults follow FR-11.2, including Suppress unless resistant agents off when S; a changed default is on the Timeline; unticking a critical result asks for confirmation.
- **AC-V2-20** Release partial report is enabled once any validated result is ticked, with no isolate needed; after it, inoculations, readings and AST can still be recorded.
- **AC-V2-21** A DST panel on a TB case interprets against WHO critical concentrations by default; an AST panel on a bacterial case against the laboratory's active CLSI or EUCAST standard; choosing another standard requires a reason.
- **AC-V2-22** Every visible string is a translation key from the Localization table (under `microbiology.*`, or the `order.*`, `catalog.*`, `inventory.*`, `validation.*` and `siteInfo.*` keys this table lists for those screens) or a cited REUSE key; dictionary entries use Dictionary localization, not keys.
- **AC-V2-23** Each culture reading is kept with its date, user and incubation day; a case read on Day 1 and Day 2 shows both readings.
- **AC-V2-24** A Gram stain result is the catalog test's fixed components (one per morphology, for example Gram-positive cocci in clusters, Gram-negative bacilli, pus cells), each graded from the Microscopy grade dictionary, with no free-text result field (D-185).
- **AC-V2-25** On a case with one isolate, clicking Isolate on an incoming MALDI-TOF or Phoenix identification fills ISO-1's organism, method and date in one click; with no isolate the button reads Create isolate and place.
- **AC-V2-26** An isolate can be referred on its own and its referral status is shown on the case.
- **AC-V2-27** Rifampicin and isoniazid resistant results show MDR-TB; the classification updates when a fluoroquinolone result is added.
- **AC-V2-28** A Send with Result note prints on the report beside its case, result, culture row, isolate or drug; an In Lab Only note never prints.
- **AC-V2-29** Release partial report can be used twice before final (after the Gram stain, then after identification); each is recorded as a Partial report version with its validator and time, and the release history shows Partial, Partial, Final; no release is labelled Preliminary or Interim.
- **AC-V2-30** Additional testing appears after AST / DST and accepts any catalog test, on the specimen or on an isolate.
- **AC-V2-31** A test marked In lab only is absent from the Report list, the printed report and results sent to the requester, and remains on the case.
- **AC-V2-32** Turning In lab only off returns the test's results to the Report list unticked; each change is on the Timeline; after final release the toggle is disabled until an amendment is open.
- **AC-V2-33** The generic culture test offers no In lab only option; an ordered AFB smear does.
- **AC-V2-34** A rifampicin-resistance-detected Xpert result adds the reflex tests configured for it without user action; each shows Added by rule and a Timeline entry.
- **AC-V2-35** Accepting an incoming analyzer result for a test that was not ordered adds the test to the order and to the case in one action.
- **AC-V2-36** With no reflex rule configured, an Xpert MTB/RIF Ultra run that detects MTB and sends a rifampicin result shows that result on the case (in its row, or in Incoming results if the test is not on the case).
- **AC-V2-37** A reflex rule never adds a second copy of a test already on the case or waiting in Incoming results.
- **AC-V2-38** + Add test or panel opens the same two-list test and panel chooser as order entry, pre-filtered to the specimen's sample type; in AST / DST it also lists the M-01 AST and DST panels for the isolate's organism.
- **AC-V2-39** Performed by on a Tested elsewhere result offers only laboratories from the Organizations list (or a user); a laboratory not in the list is added through Locations & Organizations, not typed in.
- **AC-V2-40** A result outside the test's normal range shows the catalog's High or Low flag on the case and the report; a result in the critical range shows the critical flag and raises the critical notification, whether it was typed, recorded as tested elsewhere, or accepted from an analyzer or referral.
- **AC-V2-41** Every capability marked Kept in A-16 and in the A-12 Worklist list is present and works as on develop, including breakpoint standard selection, method, entry mode, panel adjustment, QC handling, expert flag acknowledgment, override and revert, review gating, repeat and retest attempts, Use for reporting, reagent lot selection, critical communication, NCE dispositions and amendments.
- **AC-V2-42** Migration: every existing case keeps its identity; a case with no Program gets the program mapped from its old workflow type with the Timeline note and appears in the review list, as do cases that now share a key; every case has a lab unit label.
- **AC-V2-43** Identifying an isolate adds its organism group's default panel automatically (`ORGANISM_DEFAULT`); an NTM identification adds no TB DST panel.
- **AC-V2-44** A case with only an AFB smear and an Xpert result can record No culture performed, pass validation and be released as final; it is not counted in WHONET, antibiogram or GLASS denominators.
- **AC-V2-45** After final release, every edit on the case is refused by the server (409) until an amendment is opened; an analyzer result arriving then waits in Incoming results as Needs amendment.
- **AC-V2-46** A pending whole genome sequencing test does not block final release; its later result is placed through an amendment.
- **AC-V2-47** An unacknowledged expert rule flag, an unresolved QC failure or a discordant TB drug keeps the case from passing validation.
- **AC-V2-48** Logging a critical call for a CRE isolate with outcome Read back confirmed writes one `critical_callback` row with the culture result's analysis, the finding text, the caller, time, recipient and outcome; the patient report prints the callback line under the isolate; the callback report counts it.
- **AC-V2-49** A user without rights in the case lab unit cannot change anything on the case (the server returns 403), and does not see it on the Worklist.
- **AC-V2-50** Culture purpose defaults to Diagnostic and cannot be blank; a Screening or Treatment follow-up case is exported to WHONET per FR-19.2 and never counted in the antibiogram or GLASS.
- **AC-V2-51** An Initial testing row whose test has a Required reagent lot link cannot be saved without a lot.
- **AC-V2-52** After an amendment, `/PatientResults` shows only the current version of each micro result, labelled Amended.
- **AC-V2-53** A final micro case prints on the patient report with its rows under the case lab unit's section and one susceptibility block per reported isolate, as in the OGC-1111 microbiology addendum (AC-M1 to AC-M7); an environmental case prints on the Laporan Hasil certificate.

- **AC-V2-54** An order with two blood culture sets (-2 aerobic and -3 anaerobic from the left arm, -4 aerobic and -5 anaerobic from the right arm) opens one case with four culture rows, each showing its site; Number of sets reads 2 (computed); the aerobic left-arm bottle can be marked positive while the others keep incubating; the case reaches No growth only if every row is No growth.
- **AC-V2-55** + Subculture cannot be saved without choosing From culture, and lists every culture row with positive rows first; the new subculture appears in the Culture list directly under its parent, indented, and a subculture of that subculture appears under it.
- **AC-V2-56** One positive urine plate gives two isolates, each showing "from" that plate; one isolate carries two AST panels (organism default and a supplementary disk panel) with separate runs, and the report prints one reading per agent from the run chosen for it.

- **AC-V2-57** A whole genome sequencing test added to ISO-1 creates an isolate sample item (Isolate sample type, parent = the specimen's sample item) linked to ISO-1; its result is validated on the case, not on Results.
- **AC-V2-58** A clinical order with a diagnostic blood culture and a screening rectal swab opens two cases whose Culture purpose differs (Diagnostic, Screening); both default to Diagnostic and the swab is changed to Screening.
- **AC-V2-59** A case result typed by hand is saved as a run of one: a QC failure recorded for that test's control holds it at validation exactly as on Results.
- **AC-V2-60** A user with Results rights (no Validation) in the case lab unit can enter and release a partial report but cannot validate, release final or open an amendment; no micro-specific permission key is checked.

- **AC-V2-61** Initial testing and Additional testing show the same columns in the same order; Enter or Edit on a Gram stain opens a full-width editor with one graded component per morphology (D-185); on an Xpert row it opens one row per component; nothing in the Result column is truncated.
- **AC-V2-62** Refer remaining work opens the same Refer out panel as order entry, with the same fields and statuses, the culture and AST/DST tests ticked; after save the referral appears in Sample Shipment for dispatch.

- **AC-V2-63** The case header of AC-V2-54 reads "Blood culture: 2 sets, 4 bottles"; Split into separate cases moves -4 and -5 to a related case with a reason on both Timelines, and is not offered for a sample with results.
- **AC-V2-64** Picking the tracked medium "Blood agar (sheep) plate" requires a Lot, with the lab unit's last lot preselected; an expired lot is shown disabled with its reason; saving the row records that lot on the row, and the lot's stock in Inventory is unchanged.
- **AC-V2-65** Searching "LJ slope (in-house)" finds nothing; Add new creates a not tracked Microbiology medium item and uses it on the row with no lot; the next technician in any lab unit finds it in the search with the Not tracked tag; no stock changes.
- **AC-V2-66** Inventory offers the item type Microbiology medium; an item with Usual atmosphere CO₂-enriched pre-fills Atmosphere on the inoculation row.
- **AC-V2-67** Edit on the Gram stain row shows a Notes section with the saved notes (date and time, author, type tag, text); New note with Send with Result and "Pus cells present, repeat advised" saves, shows the row's note count, appears on the Timeline, is readable in the case validation step (D-121), and prints under the Gram stain row.
- **AC-V2-68** Notes (1) on a culture row opens the same Notes section; an In Lab Only note there never prints; a Send with Result note on a result marked In lab only shows the "will not print" warning, saves, and does not print.
- **AC-V2-69** With Bacterial culture linked to CLED agar and blood agar for Urine in Reagents and media, Start inoculation on a urine proposes those two as ticked rows; unticking one and saving creates one row; the Timeline notes the linked media were applied; the lots' stock is unchanged.
- **AC-V2-70** On a blood culture bottle, Add, Gram stain adds "Gram stain, culture" (From BC-...-A) and opens its multi-component editor; it is not In lab only; once validated it releases on a partial report and raises the positive blood culture critical. A laboratory that turns Reportable off on Gram stain, culture gets plate Grams that never print until In lab only is turned off.
- **AC-V2-77** Test on this culture on LJ-004812-B opens the standard chooser pre-filtered to tests allowed on a culture; picking ZN stain, culture adds it under LJ-004812-B, beside its subcultures, tagged In lab only; it never prints; a Send with Result note on it does not print either, with the not-on-report warning. A new stain is added in the test catalog, not in the micro module.
- **AC-V2-71** + Subculture offers every culture row with positive rows first; a subculture from a selenite broth with no growth reading asks Purpose and saves with Enrichment.
- **AC-V2-72** A BACTEC "negative, protocol complete" signal on BC-...-B shows the proposed No growth reading and a Needs attention reason; nothing changes until Confirm, which records the reading and the row outcome with who and when.
- **AC-V2-73** Print label on a culture row prints the Culture plate preset with the container identifier barcode; scanning it opens the case at that row; the isolate prints the Isolate preset.
- **AC-V2-74** Patient history lists the patient's earlier cases across orders; an *E. coli* urine isolate 6 days after an *E. coli* urine isolate with AST shows the repeat notice; Refer to previous susceptibility removes the default panel and the report prints "Susceptibility as reported on {labNumber} ({date})".
- **AC-V2-75** An MRSA screening plate in Initial testing read Negative is validated and released with no culture on the case; one read Positive creates an isolate with Create isolate and place.
- **AC-V2-76** On Awaiting inoculation, three urines selected, Inoculate opens the inline panel with the Urine template and one lot field per tracked medium, nothing preselected; Save creates two rows on each case with the lot recorded and no stock change, one Timeline entry per case, and Print plate labels prints six labels.
- **AC-V2-78** Selecting two urines and a wound swab and choosing Inoculate is refused with "Inoculate needs one sample type"; no rows are created.
- **AC-V2-79** On Check due, No growth on CPHL26-004790-CLED-1 records "No growth, Day 1" with user and time and sets the next check; Undo removes the reading and the audit trail keeps both.
- **AC-V2-80** On Final read due, four rows selected (one a BACTEC instrument negative, one with Significant growth recorded on Day 1), No growth (4) records No growth and the row outcome on two rows and names the other two as skipped with their reasons; a case whose rows all have an outcome moves to validation as before.
- **AC-V2-81** No run, batch number or Bench view exists; Mark checked and the "No change" reading are gone; every Worklist write appears on each case's Timeline.
- **AC-V2-82** The Case view has no Growth work-up section; every culture and subculture row has the Add menu (Gram stain, Test on this culture, Subculture), and what each creates is listed under that row only.
- **AC-V2-83** From MGIT-004812-A, which already has LJ-SUB-004812-A1, Subculture with two media saves BA-SUB-004812-A2 and BA-SUB-004812-A3, both listed under MGIT-004812-A; each has its own readings, outcome and label.
- **AC-V2-84** Turning In lab only off on a ZN stain, culture puts it in the Report choices, unticked, and the change is on the Timeline; after final release it needs an amendment.
- **AC-V2-85** On Final read due, with Lab unit Microbiology, Print workplan opens the Workplan print in the Microbiology bench layout with the rows grouped by medium (CLED agar plate 2, Blood agar (sheep) plate 1, BACTEC bottle 1), each with lab number, patient name, container ID, tick, Reading, Quantity and Initials boxes; the BACTEC row prints "Confirm on screen"; the header shows the sheet number and its barcode, the footer the reading codes from the Culture reading dictionary and "Contains patient information. Shred after use."; no case changes. The same sheet can be printed from Workplan, type Microbiology bench.
- **AC-V2-86** On Awaiting inoculation with three urines and a wound swab selected, the sheet groups them by sample type: the urines with a tick box each for CLED agar plate and Blood agar (sheep) plate and a "Lot used" line per medium, the wound swab with "No template: write the media".
- **AC-V2-87** Open sheet with the scanned sheet number shows the same rows in the printed order and groups; a row recorded since printing shows its reading and who recorded it; No growth and Open case work as on the filter; Reprint prints the same rows marked "Reprint"; Close sheet returns to the filter.
- **AC-V2-88** Reception orders "Microbiology case" (a Microbiology case test) on a wound swab: on save a case opens in Microbiology with no tests and appears only for users with Microbiology rights; Case information asks the Program; Change lab unit moves it to another lab unit's Worklist. A second Microbiology case test ("Wound swab for culture") can be active beside it; ordering both on one sample opens one case.
- **AC-V2-89** A urine set up at 08:05 and plated at 09:30: Edit time on each row to 09:30 recomputes Incubation ends and Next check, and the Timeline shows the old and new times; after the first reading Edit time is no longer offered; Inoculate on the Worklist with Inoculated at 09:30 applies it to every row it creates.
- **AC-V2-90** A blood culture case from two sets (left and right arm) lists four samples in Case information, each with its own body site and collection time; the header reads "4 samples, 2 sites"; correcting the site of one bottle changes only that sample.
- **AC-V2-91** A sputum with Xpert MTB/RIF Ultra and TB culture (TB unit) and a bacterial culture (Microbiology) opens two related cases; on a single-section laboratory where both tests are in Microbiology, they share one case and the bacterial culture result is released on an interim report while the TB culture continues.
- **AC-V2-92** The Programs admin shows Show on Microbiology case and Reporting track; only those programs appear in Case information; the TB Program brings TB history and treatment month; a case on a Bacterial-track program is in the WHONET export and not in the NTP report; an MTB isolate on a Bacterial-track case shows the Program check prompt.
- **AC-V2-93** A chocolate agar subculture at 24 hours has pinpoint colonies: Extend incubation by 24 Hours with Colonies too small to identify or pick moves Incubation ends from 02 Oct 07:30 to 03 Oct 07:30, shows "+ 24 Hours extended" next to the duration and writes the reason to the read log and Timeline; Save stays disabled with no reason, or with Other and no note.
- **AC-V2-94** On Final read due, Extend 24 h on a CLED plate with growth asks for a reason, removes the row from the filter and offers Undo; the row returns to Final read due after 24 hours.
- **AC-V2-95** Mark positive on an LJ slope inoculated 23 Sep 08:30 pre-fills Positive at with the server time; changing it to 24 Sep 11:34 shows Time to positivity "1 day 3 hours 4 minutes" and saves; 20 Sep 11:34 or a future time cannot be saved. A blood culture bottle that flagged at 29 Sep 22:18 shows "29 Sep 22:18 · BacT/ALERT signal" and "13 hours 48 minutes"; Edit positive time keeps the old and new times on the Timeline.
- **AC-V2-96** The blood culture case prints under MICROBIOLOGY with the sub-headers Culture and AST / DST only: Culture lists set 1 positive, Gram stain GS-1, the BCID2 result, set 2 in progress and "Isolate 1: Klebsiella pneumoniae"; AST / DST repeats "Isolate 1: Klebsiella pneumoniae" over its 12 agents and ends with "Resistance profile: ESBL, MDR". Unticking the profile removes that line; the TB case prints all four sub-headers in order.
- **AC-V2-97** When BC-004831-2A turns positive, a Gram stain tagged Added by rule appears under it with No result yet; Enter result opens the Gram stain, culture result editor (not In lab only); after Save and Validate it prints in the Culture group. A second positive signal on the same bottle adds no second Gram stain.
- **AC-V2-98** In AST / DST, + Add test or panel opens the two-list chooser with On set to ISO-1, pre-filtered to Enterobacterales panels and antibiotics; adding "Enterobacterales disk diffusion supplement" adds a panel row on ISO-1, Added with the chooser; the VITEK panel already on ISO-1 cannot be added again.
- **AC-V2-99** Case information on a TB Program case shows the TB Program's questionnaire (TB history, treatment month, specimen number, collection timing and method) rendered by the order entry questionnaire component; switching the Program to AMR surveillance shows that programme's questionnaire instead and the infection origin; no TB fields exist outside the questionnaire.
- **AC-V2-100** A Gram stain, culture result is entered as components (Gram-negative bacilli: Many; others blank); the blank components do not print; the grades come from the Microscopy grade dictionary, and a value added there appears in the editor.
- **AC-V2-101** Adding "Extended spectrum" to the Culture reading dictionary in Admin › Dictionary makes it a choice in Record reading and on the bench sheet's reading codes; deactivating a value removes it from new readings and keeps it on old ones.
- **AC-V2-102** Switching off the reflex rule "Blood culture result = Positive: add Gram stain, culture" in Admin › Reflex Tests stops new positive bottles from getting a Gram stain by rule; turning it back on applies to the next positive bottle only.
- **AC-V2-103** On Enter Order with a Bacterial culture on four blood culture bottles, a sputum with TB culture and an RPR, the What this order will open panel reads "Blood culture case in Microbiology: 2 sets, 4 bottles", "TB case in TB unit: sputum -1", "RPR stays in Results" and names the positive-bottle reflex rule; removing the TB culture removes its line immediately; nothing is saved until Save.
- **AC-V2-104** Reception sets bottles -2 and -3 to Set 1 and -4 and -5 to Set 2; Case information shows Number of sets 2 and the header shows one line per set; saving with -5 changed to Set 1 shows the warnings "Set 1 has two aerobic bottles" and "Set 2 has one bottle" and still saves.
- **AC-V2-105** A case result shows Awaiting validation after entry, Validated after validation, and Returned with the validator's reason after a return; its history lists who entered, validated or returned it and when. With Block self-validation on, the user who entered a result sees the Validate action disabled with "You entered this result; another validator must validate it", on the case and on the Validation page.
- **AC-V2-106** An order with an Isolate sample, Bacterial culture ticked Tested elsewhere (sending laboratory Port Moresby General Hospital, reported organism Escherichia coli) and an AST panel opens one case whose ISO-1 is tagged Received from Port Moresby General Hospital, whose culture outcome is Growth (received isolate), and which asks for Original specimen type before final. Identifying ISO-1 here as Klebsiella pneumoniae shows "Identification differs from the sender's" at validation until acknowledged.
- **AC-V2-107** The WHONET export includes the AST of AC-V2-106 marked referred-in with specimen type Urine (its Original specimen type), and never includes the sender's reported organism as a result.
- **AC-V2-108** "Previous report" no longer appears anywhere on the case; each case test row offers Tested elsewhere with Performed by and Date performed.
- **AC-V2-109** With Require tracked media on in the Microbiology lab unit, the medium search lists only tracked media, Add new is absent, saving a culture row without a lot is refused with "This lab unit requires a tracked medium with a lot", and existing rows with not tracked media are unchanged.
- **AC-V2-110** Inventory shows Used on cultures 14 for a Blood agar lot used on 14 culture rows in the chosen dates, listing each row's lab number and container identifier; the lot's stock count is unchanged.
- **AC-V2-111** An answer to "Antibiotics in the last 48 hours" changed on the case shows "Last changed in Case" with user and time, appears changed when the order is opened in order entry, and the QuestionnaireResponse read through `/fhir` carries the new answer when a FHIR store is configured.
- **AC-V2-112** A Check due row 6 hours past due shows "Overdue 6 h" in the Due column and sorts above a row due now; a STAT case sorts above routine cases in Needs attention and in Check due.
---

## Crosscheck

**Verdict:** Proceed with coordination. The portfolio crosscheck of 2026-09-29 (`amr-micro-v2-crosscheck.md`) found no design-addendum MUST broken; its HIGH findings are fixed in this draft (access on existing role bundles, D-006; culture sets, D-138; isolate sample items shared with Pathogen WGS, D-136; callback log and Runs dependencies declared; Env/Vector OE v4 and M-18 aligned). v2 reverses several built behaviours and V1 spec decisions (boxed above) and amends its own D-113, D-114, D-124 and D-138, and retires D-131 (draft 8: Program plays no part). The patient report FRS (OGC-1111 v2.2), Report Print Queue r4 (OGC-1031), M-18 v0.8, Clinical Order Entry v4 v0.13, Env/Vector Order Entry v4 v0.4.2, Inventory and the environmental certificate renderer move in step.

### Contradictions (vs decision log)

| Decision | Conflict | Resolution |
|---|---|---|
| D-113 (no declared workflow) | Drafts 6 to 9 brought back a culture type | Restored by D-178: no workflow and no culture type; Program on the case for reporting |
| D-114 (one case per specimen per lab unit; no micro marker) | Cases are keyed on order, sample type and lab unit; eligibility comes from micro tests | Largely restored by D-178 (sample type instead of specimen) |
| D-121 (case-linked tests never on Results or Validation) vs D-059 and D-057 (single clearance rule for accepted analyzer results) | Case tests skip the Validation worklist | Reconciled by D-135: the case's validation step runs the same clearance rule |
| A-02 accepted risk (draft 5: a missed Program loses the culture) | Routing reads only the micro tests, so a missed Program loses nothing | Moot; D-131 retired by D-146 |
| D-131 (Program safety net) | Order entry works as for any test; the guard blocked TB programme orders with a TB culture | Retired by D-146 |
| Patient report FRS decision on critical callbacks (numbered D-089 in that FRS; the ID is taken in the log) | Micro calls were outside `critical_callback` | Applied by D-134; the report FRS's decisions D-085 to D-093 need new IDs when logged |

### Overlaps

| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| Patient Report & Report Management v2.2 (OGC-1111) | Micro rows, susceptibility block, callback lines, release status | The printed micro report is specified there (microbiology addendum FR-A42 to FR-A52) | HIGH |
| Environmental results certificate (Laporan Hasil, built) | Site header, compliance table, amendments | Environmental cases print there (FR-11.8); M-18 FR-D6 and its Dependency 5 point to it instead of OGC-1111 | MEDIUM |
| M-18 Environmental Microbiology v0.5 | Order entry, keys, report, media | Done in v0.6 and v0.7; v0.8 drops the Culture rows (the environmental culture test is ordered like any test) and takes the medium from Inventory | MEDIUM |
| Clinical Order Entry v4 | Program section (FR-B12a), Tested elsewhere (FR-B20), chooser (FR-B14), required marking (FR-A8), body site (section N) | v0.13: FR-B12a no longer has a Microbiology section or Program lock; v0.19: micro tests are a Yes / No switch, one case per order, sample type and lab unit, case tests assign the case (D-177, D-178), and each sample keeps its own body site and time; generic culture tests are ordered in the chooser like any test; culture sets are grouped after save | HIGH |
| Environmental and Vector Order Entry v4 | micro section (EV-B3a) | v0.4.2: no micro section; the environmental culture test is ordered like any test; purpose per order stays (EV-M2a) | MEDIUM |
| Inventory (built) | Item types, lots, lot rules, usage | New seeded item type Microbiology medium with usual atmosphere and temperature; the culture row records the lot but never changes stock (FR-05.1b, FR-05.1d, D-169); prepared batches are lots (D-196); a read-only Used on cultures count per lot (FR-05.1g, D-197) | MEDIUM |
| Clinical Order Entry v4 (draft 10.4 additions) | Summary panel, set number, Tested elsewhere on an Isolate sample | FR-02.3b needs a panel beside Ordered tests; FR-02.4a needs a Set field on sample rows of tests collected in sets (section N); FR-02.13 lets Tested elsewhere on a test with a sample offer a reported organism. Order entry v4 to pick these up in its next revision | HIGH |
| Programs and questionnaires (built) | QuestionnaireResponse storage and FHIR mirror | The case edits the order's response through the built storage service (FR-03.6, D-198) | MEDIUM |
| Validation (built) | Block self-validation | A new site setting applied on the Validation page and on case validation alike (FR-17.5, D-191) | MEDIUM |
| M-09 WHONET export, first-isolate de-duplication (D-049) | TB vs bacterial split | one rule by the Program's reporting track (FR-19.3) | MEDIUM |
| M-13 Antibiogram / M-17 presets | TB variant | selected by reporting track; purpose filter (FR-19.2) | MEDIUM |
| M-15 GLASS | included cases | by reporting track, purpose and external marker | MEDIUM |
| M-16 Cluster detection | scan populations | purpose exclusions (FR-19.2); unaffected otherwise | LOW |
| Callback reports (OGC-714) | timing and summary metrics | micro calls counted; clock start for micro to confirm (FR-18.5) | MEDIUM |
| Report Print Queue r4 (OGC-1031) | Issue history, versions, archived PDFs, environmental certificate renderer (S06c) | Micro releases are queue rows and versions; the certificate renderer gains the susceptibility block and callback lines | HIGH |
| Pathogen WGS (clarify brief) | Isolate sample item, sequencing Run, result components and target detail | One isolate model and one WGS result display, worked in the case (FR-10.1c, FR-15.1a) | HIGH |
| Runs (OGC-1200) | Run of one, QC holds, Run view | Case results are runs of one; Run view shows case rows read-only; bench reading and plating are not runs (D-172) | HIGH |
| Critical callback log (OGC-714, built) | Write guard, metrics | FR-18.2a changes the built guard | HIGH |
| Referral redesign (OGC-796, D-016) | Isolate referral, return routing | Isolates referred through their sample item | MEDIUM |
| Test Catalog Completion v2 (OGC-949) | Opens a Microbiology case switch and Case role; Reportable starts a case test In lab only (D-204); tests on a culture set up for the Isolate sample type; graded Gram stain as a multi-component test (no new result type) | Must not revive cascading result types (D-034) | MEDIUM |
| Validation clearance (OGC-1226) | Critical acknowledgment | `MICROBIOLOGY_CRITICAL` counts like `CRITICAL_RESULT` | MEDIUM |
| Analyzer Pending Imports inbox (D-043 to D-045) | results with no matching order | Incoming results is per case; results unmatched to any case stay in Pending Imports | MEDIUM |

### Dependencies

- Upstream: Clinical Order Entry v4 chooser (FR-B14) and FR-B20; Inventory item type and constraint change (FR-05.1d); body site (D-079); existing referral return path; OGC-1111 V1 templates.
- Downstream (re-review): M-09, M-13, M-15, M-17, M-18, the test catalog Culture workflow attribute page (narrowed, not withdrawn), the callback reports.

### Decisions

Logged 2026-09-28 and 2026-09-29: D-113 to D-123 (D-113 and D-114 amended below). Proposed with this draft:

| ID | Decision | Scope |
|---|---|---|
| D-124 | **Generic culture tests define microbiology.** A lab unit is eligible when it has one; a sample opens a case per generic culture test; only tests in the case's lab unit join it. Amends D-114 **Superseded by D-178** (draft 10: no culture type). | FEATURE (micro, order entry) |
| D-125 | **Culture type is set only on the generic culture test** and selects the TB rules, the breakpoint default and the TB or bacterial side of every export; the bench never picks it. Amends D-113 **Superseded by D-178** (draft 10: no culture type). | FEATURE (micro, test catalog, exports) |
| D-126 | **No culture performed is a releasable outcome**, left out of surveillance denominators | FEATURE (micro, exports) |
| D-127 | **Nothing on a final case changes without an amendment**, enforced by the server | FEATURE (micro) |
| D-128 | **Pending Additional tests and In lab only tests never block final release** | FEATURE (micro) |
| D-129 | **Cases are keyed on specimen and culture type; the lab unit is a changeable label**, so lab unit reorganizations never split or merge cases. Amends D-114 **Amended by D-178:** keyed on order, sample type and lab unit. | FEATURE (micro) |
| D-130 | **Culture purpose is required, defaults to Diagnostic, and has five clinical values**; only Diagnostic counts in the antibiogram and GLASS (CLSI M39, WHO GLASS) | FEATURE (micro, exports) |
| D-131 | ~~A generic culture test on an order sets Program = Microbiology~~ **Retired by D-146** (draft 8) | FEATURE (micro, order entry) |
| D-132 | **The case header shows culture type, lab unit and related cases; every edit checks the case lab unit's rights** **Amended by D-178:** Program instead of culture type. | FEATURE (micro) |
| D-133 | **Microbiology prints inside the patient report** (OGC-1111) and environmental microbiology on the environmental results certificate; no micro-only template | FEATURE (micro, reports) |
| D-134 | **Every microbiology critical call is a `critical_callback` row**, with the micro record keeping micro-only detail | FEATURE (micro, criticals, reports) |
| D-135 | **Expert review is the case's validation step**: results are Entered, then Validated, with the same clearance rule as the Validation worklist | FEATURE (micro, validation) |
| D-136 | **An isolate that needs its own tests becomes a derived sample item** (Isolate sample type, child of the specimen, linked to its `micro_isolate`), worked in the case; shared with Pathogen WGS | FEATURE (micro, WGS, referrals) |
| D-137 | **Culture purpose is per case**, in every domain; replicates stay per order. **Amended by D-146:** with no order-level purpose, it defaults to Diagnostic (clinical) or Routine monitoring (environmental) | FEATURE (micro) |
| D-138 | **A culture set is one case:** samples of one order with the same generic culture test, sample type, collection time and body site or sampling point (a blood culture set, replicate swabs) open one case, each sample its own culture row; split is allowed. Amends D-124. **Amended by D-146:** grouped automatically after save, split on the Case view | FEATURE (micro, order entry) |
| D-146 | **Reception orders micro tests like any other test; microbiology does not read Program.** (Amended by D-162: any micro test, not only the culture, opens the case. D-175, a Program rule, was superseded by D-177: a lab unit case test.) No order entry Microbiology section, no Program auto-set or guard; culture sets are grouped after save and split on the Case view. Retires D-131; amends D-137 and D-138 | FEATURE (micro, order entry) |
| D-147 | **The inoculation medium comes from Inventory**: a seeded Microbiology medium item type, a required lot, one usage per culture row (**amended by D-169:** no automatic stock change) | FEATURE (micro, inventory) |
| D-148 | ~~Media not tracked in Inventory are named from a per lab unit list, and the Not tracked mode is remembered per lab unit~~ **Replaced by D-164** (draft 9) | FEATURE (micro, inventory) |
| D-162 | **Every micro test opens or joins a case.** One catalog dropdown, **Microbiology case** (None, Bacteriology, Mycobacteriology, Mycology), set on direct tests (Gram, AFB smear, Xpert, screening plates) as well as cultures, with a Case role (Culture or Direct); the first micro test on a specimen opens its case, so Xpert or smear alone is a case; tests set to None never join. Amends D-124, D-125, D-146 **Superseded by D-178** (draft 10: no culture type). | FEATURE (micro, test catalog, order entry) |
| D-163 | **Blood culture sets are one sample per bottle, each with its own site and time, and one case per order** for a culture test marked Collected in sets; number of sets is computed. Amends D-138 | FEATURE (micro, order entry) |
| D-164 | **Media are Microbiology medium items, tracked or not tracked**; the technician sets the medium on every row from one search, and Add new creates a not tracked item. Amends D-147, replaces D-148. **Amended by D-169:** no automatic stock change **Amended by D-202:** type tag and per-item Track lots | FEATURE (micro, inventory) |
| D-165 | **Plating templates per sample type live in Microbiology admin and only pre-fill rows**; no protocol is stored on the case **Amended by D-208:** plating is the culture test's media links in the Test catalog. | FEATURE (micro) |
| D-166 | **Tests run on a positive culture (Gram stain from a bottle, rapid ID) are reportable case results; colony microscopy stays internal and is listed under its culture like a subculture; a subculture can come from any culture row**. **Amended by D-173:** Gram stain with a Report this result switch; no Growth work-up section **Amended by D-183:** microscopy on a culture is a catalog test, not a hard-coded exam. | FEATURE (micro, reports, criticals) |
| D-167 | **Bench batches** (Plate a batch, Read plates) on the Worklist. Approved by Casey 2026-10-01. **Amended by D-172:** no batch record; Worklist filters with one-click No growth and bulk Inoculate | FEATURE (micro) |
| D-168 | **The case shows the patient's microbiology history, and a repeat isolate within N days (default 14) can refer to the previous susceptibility** instead of repeating AST | FEATURE (micro, reports) |
| D-169 | **Culture rows never change inventory stock.** The medium and lot are recorded on the row for traceability; stock is managed in Inventory as today. Amends D-147, D-164 | FEATURE (micro, inventory) |
| D-170 | **Any note anywhere on a micro case can be In Lab Only or Send with Result, as on the patient report**; notes on things with no report line of their own (culture rows, subcultures, microscopy exams, the case) print under the culture result row; only notes on a withheld result do not print **Amended by D-183** (no microscopy exam; notes on tests on a culture print under that culture's result row) and FR-A48 (case notes under the last row of the case). | FEATURE (micro, reports) |
| D-171 | ~~Micro bench batches are Runs (OGC-1200, WORKPLAN source)~~ **Superseded by D-172** (draft 9.3): a run adds nothing to reading plates (no lot, no QC gate, no review) | FEATURE (micro, runs) |
| D-172 | **Bench work stays on the Worklist, with no run and no batch record**: Check due and Final read due filters with one-click and bulk **No growth** (a final read also records the row outcome; Undo on every write; other readings on the case), replacing Mark checked and the reading No change; **Inoculate** many cases of one sample type with one plating template and one lot per tracked medium. Amends D-167, supersedes D-171 | FEATURE (micro) |
| D-173 | **The culture work-up lives under each culture row**: no separate Growth work-up section; every culture and subculture row has an Add menu (Gram stain, Test on this culture, Microscopy exam, Subculture) and lists what it creates beneath it; **+ Gram stain** with a **Report this result** switch (default on for blood culture bottles, off otherwise; on = reportable result with validation, preliminary release and critical rules; off = internal); a culture can have several subcultures. Amends D-166. **Amended by D-183 and D-184:** the Add menu is Gram stain (a chooser shortcut), Test on this culture and Subculture; In lab only replaces the Report this result switch | FEATURE (micro) |
| D-174 | **Print bench sheet** from any Worklist filter (rows on screen, or the selection) for work at a bench with no computer: lab number and patient name on every row, tick, reading and initials boxes, reading sheets grouped by medium and inoculation sheets by sample type with the template media; a sheet number lets **Open sheet** show the same rows in the printed order to enter the results. A sheet is a saved row list, not a batch **Amended by D-188:** printed through the existing Workplan print (Microbiology bench layout) | FEATURE (micro) |
| D-175 | ~~An order saved with Program = Microbiology opens a case for each sample~~ **Superseded by D-177** (draft 9.7): reception orders the lab unit's case test instead; no admin defaults | FEATURE (micro, order entry) |
| D-176 | **Inoculated at is editable until the first reading**, defaulting to the save time, so rows can be set up and labelled before plating; the incubation clock follows the edited time; every change is on the Timeline | FEATURE (micro) |
| D-177 | **Case tests assign a sample to a lab unit as a micro case** (Case role Case; any number per lab unit, made by Duplicate or new): reception orders one, the technician **chooses the path as step 1 of the case**, and the case lab unit decides who sees it and can be transferred. No Program rule and no admin defaults. Supersedes D-175 **Amended by D-178:** no Choose path step. | FEATURE (micro, order entry, test catalog) |
| D-178 | **No culture type.** A test either opens a Microbiology case or not (Yes / No, with Case role Culture, Direct or Case); a case is one order, sample type and lab unit; the case's **Program**, chosen in Case information from the programs marked Show on Microbiology case in the Programs admin, brings its questions and its **reporting track** (Bacterial, TB, Mycology) decides the exports; TB classification and NTM follow the organism; breakpoints are chosen per panel. Choose path and Change culture type are removed. Supersedes D-124, D-125 and D-162 (dropdown), amends D-129, D-138, D-163 and D-177 **Amended by D-207:** Reporting track is a Dictionary category. | FEATURE (micro, test catalog, exports) |
| D-179 | **Extend incubation** from any open culture row (including a plate with immature growth), by hours or days with a coded reason; each extension stays visible on the row and Timeline. Final read due offers Extend 24 h | FEATURE (micro) |
| D-180 | **Positive at** is recorded on every positive row as an exact date and time: the analyzer signal time, otherwise the server time when marked, editable within Inoculated at and now; time to positivity is shown in days, hours and minutes as well as the date and time | FEATURE (micro) |
| D-181 | **The report groups a case under four sub-headers in the Case view's order**: Initial testing, Culture (culture results, reported work-up, isolate identification), AST / DST (one block per isolate, then derived results) and Additional testing; empty groups print nothing; the Report choices use the same groups | FEATURE (micro, report) |
| D-182 | **A Gram stain can wait for its result**: a row added by hand or by a reflex rule (a positive blood culture bottle adds one) shows No result yet and Enter result; it blocks final release until entered and does not print until validated **Amended by D-189** (the reflex is an ordinary M-06 rule on the culture result). | FEATURE (micro) |
| D-183 | **Every test on a culture is a catalog test** picked with the standard chooser (Test on this culture), including microscopy (ZN, auramine, mounts, motility) and the Gram stain (Gram stain in the Add menu is a shortcut that preselects Gram stain, culture); the hard-coded microscopy exam and its stain list are removed. Amends D-166, D-173 | FEATURE (micro, test catalog) |
| D-184 | **In lab only replaces the Report this result switch**: a catalog setting In lab only by default (on for microscopy tests, off for Gram stain, culture) sets it; a reflex rule can set it for the test it adds. Amends D-173 **Amended by D-204:** the default comes from the catalog Reportable setting. | FEATURE (micro, test catalog, report) |
| D-185 | **Gram stains and other graded observations are multi-component tests** (OGC-1126, OGC-1127; developer to confirm they are on develop) with Microscopy grade dictionary results; no new repeating graded result type | FEATURE (micro, test catalog) |
| D-186 | **Program questions are the Program's own questionnaire** from the existing Programs admin, rendered with the order entry questionnaire component; no micro-specific question fields (TB history and treatment month are questionnaire items) | FEATURE (micro, programs) |
| D-187 | **Micro coded lists are Dictionary categories** (Culture atmosphere, Culture reading, Culture quantity, Subculture purpose, Extend incubation reason, Microscopy grade, Reporting track), seeded and edited in Admin › Dictionary | FEATURE (micro, dictionary) |
| D-188 | **The bench sheet is a Workplan print**: the existing Workplan gains a Microbiology bench type and layout; the Worklist's Print workplan uses it; only Open sheet and the sheet number are new. Amends D-174 | FEATURE (micro, workplan) |
| D-189 | **The culture result is a result** of the generic culture test (row outcomes and the case roll-up), so the positive-bottle Gram stain is an ordinary M-06 reflex rule on "Blood culture result = Positive", configured in Admin › Reflex Tests. Amends D-182 | FEATURE (micro, reflex) |
| D-190 | **Order entry shows what an order will open before saving**: a live summary panel of the cases (lab unit, sets and bottles), the tests that stay in Results and the reflex rules that may add tests, with warnings for unexpected cases; it saves nothing (Mohamed review 3.1, 3.4) | FEATURE (micro, order entry) |
| D-191 | **Case results use the OpenELIS analysis statuses** (Not started, Awaiting validation, Returned, Validated, Cancelled) with who entered, validated or returned each result; a new site setting Block self-validation stops the person who entered a result from validating it, everywhere validation happens (Mohamed review 1.3) | FEATURE (micro, validation) |
| D-192 | **Blood culture sets are explicit**: reception gives each bottle a set number; site and time only warn; one order is one collection episode (Mohamed review 3.2). Amends D-163 | FEATURE (micro, order entry) |
| D-193 | **Batch reading needs a scan or a tick on each row** and has no default outcome; "No change" stays retired (confirms FR-12.6, Mohamed review 2.6) | FEATURE (micro) |
| D-194 | **A received isolate is an Isolate sample whose culture was tested elsewhere**: the sending laboratory (required) and reported organism come from Tested elsewhere, the case opens with ISO-1 Received from that laboratory and asks for the original specimen type; local identification and AST count in surveillance as referred-in under that specimen type; the sender's organism stays external | FEATURE (micro, order entry, surveillance) |
| D-195 | **"Tested elsewhere" replaces "Previous report"** on case tests, matching order entry (D-083) | FEATURE (micro, wording) |
| D-196 | **In-house media batches are Inventory lots** (preparing laboratory, preparation and expiry dates, QC status, storage on the built lot fields); not tracked media stay, and a lab unit setting Require tracked media hides them (Mohamed review 1.4) | FEATURE (micro, inventory) |
| D-197 | **Inventory shows Used on cultures per medium lot**, computed from culture rows, for reconciliation; culture rows still never change stock (keeps D-169; Mohamed review 2.4) | FEATURE (micro, inventory) |
| D-198 | **Questionnaire answers are one record** (the order's QuestionnaireResponse) whether answered at order entry or on the case, written through the built storage service so the FHIR copy stays current; Provisional diagnosis is informational; the Program decides exports and required data, never routing (Mohamed review 3.5, Q1, Q2) | FEATURE (micro, programs, FHIR) |
| D-199 | **The Worklist shows how late a row is and sorts STAT first, then most overdue**: Check due keeps covering due and overdue rows (no separate chip or count); no ranked order of reasons, since labs prioritise differently; critical calls stay in Alerts and the critical callback log, not in Needs attention; the six-area Worklist is deferred (Mohamed review 2.1, 2.5) | FEATURE (micro, worklist) |
| D-200 | **Urine and other quantitative cultures are test catalog setup** (medium link loop volume, result components or the Culture quantity dictionary, calculated values, reflex rules); no micro-specific quantity fields and no third Case view example (Mohamed review 2.6) | FEATURE (micro, test catalog) |
| D-201 | **Micro releases use the OpenELIS report states Partial, Final and Amended** (D-150): Release preliminary becomes Release partial report, usable as often as needed before final; no Preliminary or Interim release types | FEATURE (micro, report) |
| D-202 | **Microbiology medium is an Inventory type tag and Tracked is the per-item Track lots property** of Inventory v1.9 (D-037), not an enum value and a micro-only flag. Amends D-164 | FEATURE (micro, inventory) |
| D-203 | **Incoming results keeps its own holding item** for unplaced analyzer and referral results on a case (Casey, 2026-10-02, over the analyze suggestion to reuse import staging); results matching no case stay in the analyzer Pending Imports queue | FEATURE (micro, analyzer) |
| D-204 | **A case test starts In lab only when the catalog test's Reportable setting is off** (built `is_reportable`); no In lab only by default attribute. Amends D-184 | FEATURE (micro, test catalog) |
| D-205 | **Every micro note is a row in the existing `note` table**, with new reference tables for the culture row, isolate, drug result and case; no micro note store | FEATURE (micro, notes) |
| D-206 | **Patient history and the repeat-isolate check reuse what exists**: the patient results query filtered to micro, and the M-09 first-isolate matcher with a clinical window | FEATURE (micro, surveillance) |
| D-207 | **Reporting track is a Dictionary category** (seeded Bacterial, TB, Mycology), not a hard-coded enum; each export lists the tracks it takes. Amends D-178 | FEATURE (micro, dictionary, surveillance) |
| D-208 | **Plating is the culture test's media links**: the Test catalog Reagents section (built `test_reagent_link`) becomes Reagents and media and accepts Microbiology medium items with an optional sample type, order, duration, check interval and loop volume; no Plating templates admin; media links never consume stock (keeps D-169, D-197). Amends D-165 (analyze F-16, Casey 2026-10-02) | FEATURE (micro, test catalog, inventory) |
| D-209 | **The bench sheet is a Workplan print record, never a batch**: the sheet number and row list are stored as the print record; the Microbiology bench type creates no batch and no run. Stated exception to D-052 (analyze F-17; Casey 2026-10-02) | FEATURE (micro, workplan) |
| D-210 | **Labels for things that are not samples**: an isolate label prints as its isolate sample item (per-sample scope, created on first print); culture plates and AST panels use a new per-container preset scope added to the built label presets (analyze F-20; Casey 2026-10-02) | FEATURE (micro, labels) |

### Docs impact

The user manual pages to re-capture when this ships: Program Entry (1439006727, Program questionnaire on the case), Dictionary Menu (1438973976, the micro categories), Reflex Testing (1439137808, the positive-bottle rule and its In lab only and culture row targets), the Test Catalog editor (1432453132) and Add a test (1643872278) for the Opens a Microbiology case switch and the Reportable helper, and Enter a clinical order (1648787462) for the summary panel, the Set field and received isolates.

### Registry upkeep (at approval)

Update the M-00, M-03, M-04, M-07, M-11, M-14, M-18 rows in `spec-registry.md` (Opens a Microbiology case switch and Case role, case keyed on order, sample type and lab unit, Program on the case with a reporting track), keep this document as the Microbiology v2 row (OGC-1383), add D-124 to D-138, D-146 to D-148 and D-162 to D-210 to `decision-log.md` (the log on the repository ends at D-182; D-183 to D-210 are in this FRS only until then), mark D-113, D-114, D-122, D-124, D-125, D-138, D-146 and D-147 amended and D-131 and D-148 retired or replaced, and give the patient report FRS's decisions new IDs when they are logged.

---

## Workflow breakdown reconciliation

Where each part of the CPHL breakdown (JDHS draft v1.0) lands. "Existing" means already specced in V1 and unchanged by v2.

| Breakdown section | Item | Lands in |
|---|---|---|
| Core record | Sample → direct results → isolates 1..n → AST/DST per isolate → report versions | v2 case layout (Overview); isolates and AST/DST existing (M-04, M-05) |
| 1 Reception | Demographics, requester, ward, priority | Existing order entry |
| 1 Reception | Clinical diagnosis, prior antibiotics (agent, date), TB history, specimen number | A-03 Case information |
| 1 Reception | Specimen type and anatomical site (coded) | A-04, D-079 |
| 1 Reception | Collection method | A-03 |
| 1 Reception | Collection and receipt time, collection to receipt interval | Existing order entry v4 (interval computed, not entered) |
| 1 Reception | Volume, container, transport medium | Order entry v4 container types |
| 1 Reception | Acceptance checklist, rejection reason, repeat request | Order entry v4 Sample check; existing NCE |
| 2 Direct testing | Macroscopy, wet prep, Gram, special stains, AFB, Xpert Ultra, LPA on the specimen | A-06 Initial testing |
| 2 Direct testing | Structured semi-quantitative lists; several graded morphologies per Gram | FR-06.1a (needs repeating graded result rows) |
| 2 Direct testing | Direct result triggers a partial report and critical call | FR-06.4, A-17, A-18 |
| 2 Direct testing | RR detected → reflex Xpert MTB/XDR and DST | FR-07.4 (reflex adds automatically, tagged Added by rule) |
| 3 Culture | Media, atmosphere, temperature | A-05 |
| 3 Culture | Blood culture time to positivity; TB time to detection | FR-05.4b |
| 3 Culture | Day 1 / Day 2 / extended readings with quantity; dated read log | FR-05.4 |
| 3 Culture | No growth → final negative; mixed growth or contaminated → repeat | FR-05.5, A-17 |
| 3 Culture | NALC-NaOH decontamination; MGIT 42 days, LJ 8 weeks | FR-05.8 (aliquot path kept); duration per inoculation (A-05) |
| 3 Culture | ZN on culture, purity check | A-10 (internal) |
| 3 Culture | MPT64, NTM species ID, MALDI-TOF, Phoenix ID, biochemicals; WHONET organism code | Isolate identification, existing M-04 + FR-09.2 analyzer placement; NTM off-ramp FR-14.4 |
| 4 AST/DST | Phoenix MIC, disc zone, gradient strip; raw value kept; EUCAST 2025 v15 | Existing M-05, M-02; default panel FR-07.1b |
| 4 AST/DST | Expert rules, intrinsic resistance, MRSA / ESBL / AmpC / CPE / VRE flags | Existing M-06, as validation (A-17) |
| 4 AST/DST | Selective / cascade reporting, per-drug suppress | M-01 `report_behavior`, now applied (A-11) |
| 4 AST/DST | MGIT first- and second-line DST at WHO critical concentrations; Xpert MTB/XDR, LPA per-drug mutations | A-07 (panels on the isolate, interpretation model), FR-06.1b (on the specimen), M-02 |
| 4 AST/DST | RR / MDR / pre-XDR / XDR classification | A-14, with the reconciliation gate |
| 4 AST/DST | Referral to QMRL, tracked to receipt | FR-08.1a |
| 4 AST/DST | CPE / alert organism → IPC; RR/MDR/XDR → NTP | A-18, M-11 |
| 5 Reporting | Preliminary, interim, final, amended; release time and validator | A-17, printed by the patient report (A-11) |
| 5 Reporting | Critical call log with read-back | A-18 (`critical_callback`) |
| 5 Reporting | Interpretive comment macros | Existing M-08, FR-13.2 |
| 6 Notes | Internal / external notes at sample, isolate, drug | A-13 |
| 6 QC | Media and stain QC by lot; ATCC control strains vs EUCAST ranges; MGIT controls; EQA | **Gap**, not in v2 (see Out of scope); EQA samples are marked by purpose (A-19) |
| 6 Surveillance | WHONET export, antibiogram (first isolate), DR-TB to NTP, alerts to IPC | A-19; existing M-09, M-13, M-15, M-11 |
| 6 Storage | Isolate storage at -80 °C with location | **Gap**, not in v2 (see Out of scope); isolate labels print (A-20) |
| Real-workflow review (2026-10-01) | Xpert-only and smear-only work, blood culture sets from two sites, bottle media, plating standards, positive bottle Gram, enrichment and blind subcultures, instrument negatives, labels, repeat isolates, TB follow-up, screening plates, bench throughput | FR-02.3, FR-02.4a, FR-05.1b, FR-05.2a, FR-10.1d, FR-10.1a, FR-05.4d, A-20, A-21, FR-06.1c, FR-12.6 |

## Review response: Mohamed Gomaa, 2026-10-01

Mohamed's review ("Microbiology v2: Design Review and Recommendations", UW DIGI) was walked through with Casey on 2026-10-02. **Done** means the design already does it (with where); **Adopted** means draft 10.4 adds it; **Later** means agreed for after v2 (Later, below); **Open** means still an Open Question; **Declined** gives the reason.

| Review item | Response | Where |
|---|---|---|
| Top 1, 3.1, 3.4: pre-save preview of cases, sets, routing and reflex | Adopted | FR-02.3b, D-190 |
| Top 2, 1.3: specific statuses; entry separate from validation; who did what; block self-validation; pending readings and analyzer flags visible | Adopted, with the OpenELIS statuses rather than new ones | FR-06.5, FR-06.5a, FR-17.5, D-191 |
| Top 3, 1.2, 1.6: options follow organism and method; standard stored with each result | Done: AST and DST panels are offered for the isolate's organism (M-01), TB DST uses the WHO critical-concentration interpretation model, and each run keeps its breakpoint standard and version (M-02, M-05). A "Why?" view for derived classifications is in A-14 | A-07, A-14, M-02 |
| Top 4, 2.6: per-plate verification in batch reading, no default outcome | Done: scan or tick each row, no default, "No change" retired | FR-12.6, D-193 |
| Top 5, 1.5: never auto-suppress AST; patient-level repeat rules | Done: a repeat isolate only offers "Refer to previous susceptibility"; nothing is suppressed; de-duplication is patient level (D-049) | A-16, D-049 |
| Top 6, 3.2: bottle identity, explicit set number, collection episode, warnings, header detail | Adopted: set number and warnings; header lines per set; one order is one episode. Bottle barcode, type, site, time and collector are already per sample | FR-02.4a, FR-04.3, D-192 |
| 3.2: fill volume | Later, not in v2 | Later (not in v2) |
| Top 7, 1.1: start usability tests with a routine culture | Done: the blood culture example is the routine case; urine is catalog setup | Case view examples, FR-05.4e |
| 1.4: more culture outcomes | Done: outcomes are Growth, No growth, Contaminated, NTM identified, No culture; finer findings (mixed growth, overgrowth, unable to interpret) are Culture reading dictionary entries a lab extends | FR-05.4, FR-05.5, D-187 |
| 1.4: medium-dependent incubation fields | Done: the medium's usual atmosphere and temperature prefill the row; instrument bottles have no atmosphere choice | FR-05.1d |
| 1.4: media traceability | Adopted | FR-05.1d, FR-05.1f, D-196 |
| 1.4: Check due shows due time, overdue time, escalation | Adopted: the Due column shows how late a row is and overdue rows sort first; escalation stays with Alerts | FR-12.4a, FR-12.1b, D-199 |
| 1.4: purity and contamination as structured results | Done: purity plate and stains are catalog tests on the culture | FR-10.1d, FR-10.3 |
| 1.5: preliminary vs confirmed identification | Done: MPT64, line probe, MALDI-TOF and the final ID are separate tests or results, validated separately | FR-10.3, FR-14.4 |
| 1.6: PZA its own workflow | Done: PZA is its own DST test or panel in the catalog, with its own controls and results | A-07, M-14 |
| 1.6: molecular vs phenotypic discordance alert | Done | FR-14.3 |
| 1.7: configurable release rules (Q3) | Later, not in v2; direction agreed | Later (not in v2) |
| 1.7: critical detection and communication recorded separately | Done | A-18 |
| 1.7: external results (laboratory, accession, method, report, verifier) | Done in part: Tested elsewhere records the laboratory and date, the validator verifies; an attached original report uses order attachments | FR-06.3, D-195 |
| 1.7: Timeline sort; event time vs entry time | Done in part: readings, positives and inoculation keep their actual time and the audit keeps entry time. Sort order is a preview follow-up | FR-05.1e, FR-05.4b |
| 2.1: six Worklist areas; critical, overdue and due-soon counts; prioritized Needs attention | Six areas later. Overdue shown on the row and sorted first; Check due already covers due and overdue, so no separate count. Criticals are worked in Alerts and the critical callback log (A-18), not duplicated in Needs attention. Needs attention sorts STAT first, then most overdue; a fixed ranking of reasons is declined because it differs between labs | FR-12.1b, FR-12.4a, Later (not in v2) |
| 2.2: batch eligibility beyond sample type | Declined: one set of linked media per culture test and sample type keeps Inoculate many simple; a case that needs different plating is inoculated from its own Culture section | FR-12.6c |
| 2.2: scanning and duplicate checks | Done in part: Open sheet scans sheets; scanning cases into the Inoculate selection is a preview follow-up | FR-12.7c |
| 2.2, 2.4: batch summary and template visibility | Done: the Inoculate panel shows the template, lots, container identifiers and time before Save | FR-12.6c |
| 2.3: save before labels; reprints marked | Done | FR-12.6c, A-20 |
| 2.4: media lot checks (QC, expiry, quantity) | Done for QC and expiry; quantity declined (no stock change, D-169) | FR-05.1b |
| 2.4: media consumption | Adopted as a read-only count | FR-05.1g, D-197 |
| 2.4: rack, tray or plate position | Declined for v2 | |
| 2.4: partial failure | Done: rows that cannot take an action are skipped and named | FR-12.6b |
| 2.5: rename "Mark checked"; missed readings visible; end of incubation actions; instrument negatives bottle by bottle | Done (Mark checked retired; late readings keep their actual time; Extend, outcomes and Confirm) | FR-12.6a, FR-12.4a, FR-05.5, FR-05.4d |
| 2.6: urine cultures | Catalog setup | FR-05.4e, D-200 |
| 2.6: pause and resume | Done: there is no batch to close; a printed sheet is reopened with Open sheet | FR-12.7c |
| 2.7: batch ID everywhere | Declined: there is no batch (D-172); the sheet number identifies a printed sheet | D-172, FR-12.7a |
| 2.7: controlled corrections | Done: edits before final carry who, when and a reason where the action asks one; after final through an amendment | A-17 |
| 2.7: not colour alone | Done (Tags carry text) | FR-12.4a, FR-02.3b |
| 2.7: patient privacy on shared screens | Later, not in v2; direction agreed | Later (not in v2) |
| 2.7: sort and filter | Done in part (Program, Lab unit, status filters, Due sort) | FR-12.3 |
| 3.1: Program information not silently ignored | Adopted | FR-03.6a, D-198 |
| 3.3: case regrouping after results (Q4) | Later, not in v2; direction agreed | Later (not in v2) |
| 3.5: minimal clinical information at order entry | Done: the Program questionnaire is answered at order entry and on the case, one record | FR-03.6, D-198 |
| 3.6: specimen compatibility; catalog defines eligible specimens, lab, case, reflex, required information | Done: the chooser offers tests for the sample type; the catalog switch, test section, reflex rules and questionnaire do the rest | FR-02.3, FR-01.1 |
| 3.6: RPR routing explained; serology worklist (Q5) | Done: a test with the switch off stays in Results, and the summary panel says so; serology uses the ordinary Results worklist by test section | FR-02.5, FR-02.3b |
| Not in the review: isolates received from another laboratory | Adopted (Casey, 2026-10-02) | FR-02.13, FR-19.5a, D-194 |

## Open Questions

None. Every review and analyze item is decided for v2, Later, Done or Declined (see Review response).

## Later (not in v2)

Agreed direction for work after v2, so it is not lost. Nothing here is built in v2.

- **Configurable final-release rules** (Mohamed review 1.7, Q3; Casey 2026-10-02). Follow the rule of the rest of OpenELIS: every reportable test on the case must be validated or cancelled before Final, so a laboratory that wants solid culture or PZA finished first simply has them on the case. A validator can release Final past named pending tests with a reason; they print "To follow" and arrive by amendment. No rule builder and no new setting. This would replace the v2 exemption for Additional tests (FR-15.7, D-128).
- **Six Worklist areas** (Mohamed 2.1): Plate setup, Culture monitoring, Plate reading, Identification, AST, Final review, each with critical, overdue and due-soon counts. Most already exist as the Cultures and AST views, their tiles and chips (draft 10.4 adds the overdue time and STAT-first sorting, D-199). Whether labs share any ranking of Needs attention reasons is part of this question.
- **CSV export of Program questionnaire answers.** FHIR already carries them (D-198). No CSV or report reads them today, so questions moved into a questionnaire (TB history, recent antibiotics) reach no CSV. One option: "Include Program questions" in the micro export, one column per question link ID.
- **Blood culture fill volume** (Mohamed 3.2), entered or from the instrument, with under- and overfill flags by local policy.
- **Release rights under the flexible RBAC.** Partial release with Results rights, final and amendments with Validation (kept for now); the new RBAC must let each be assigned separately.
- **Patient privacy on shared screens** (Mohamed review 2.7; Casey 2026-10-02). One site setting, "Hide patient names on worklists" (default off), for every OpenELIS worklist, not only micro: rows show the lab number, sample type, and age and sex, and the name shows after opening the case or result. Printed Workplan sheets keep names.
- **Case regrouping after results** (Mohamed review 3.3, Q4; Casey 2026-10-02). Before final release, a user with Validation rights in the case lab unit (a separately assignable permission under the flexible RBAC) could Split a member sample that has results into its own related case, or Merge two cases of the same order, sample type and lab unit. Each needs a reason and first shows an impact preview (results, readings, isolates, AST and DST runs, referrals, critical calls and report versions that move); every result stays linked to its sample; both Timelines record it. Cases on different orders are not merged but Linked as related. After final, only through an amendment. In v2, Split stays limited to a sample with no results (FR-02.4a).

## Out of scope

- Micro-specific colony count or CFU/mL fields: quantitative cultures are catalog setup (FR-05.4e, D-200).
- Changes to breakpoint content (M-02).
- A lab-unit "type" or micro marker (explicitly rejected, D-114; generic culture tests do this job, D-124).
- Automatic placement of incoming results without a person accepting them.
- **Micro QC** (media and stain QC by lot, ATCC control strains against EUCAST QC ranges, MGIT positive and negative controls, EQA scoring). Belongs with M-12 reagent linkage and the manual QC work; flagged as a gap from the CPHL breakdown.
- **Isolate storage** (-80 °C with freezer location). Candidate for the existing sample storage feature applied to isolates; flagged as a gap.
- Structured micro results in electronic result delivery (FHIR DiagnosticReport); M-15 territory. Until then the REMARK projection carries the summary (FR-11.6).

## Preview follow-ups

`amr-micro-v2-preview.html` and the mockup are updated to draft 10.4: order entry shows the What this order will open panel and the Set column on blood culture bottles; the blood culture case header lists each set; case results show the OpenELIS statuses and who entered and validated them; Tested elsewhere replaces Previous report; the Worklist shows how late a row is and sorts STAT first, then most overdue; Admin shows Require tracked media and Block self-validation; Order entry shows a received isolate ordered with Tested elsewhere. Draft 10.3: tests on a culture (Gram stain, ZN, BCID2) come from the catalog through the standard chooser and use In lab only; the Gram stain is a multi-component result; Case information renders the Program's questionnaire; the coded lists show their Dictionary category, and the admin view lists the categories; Print workplan opens the Workplan print, and Workplan has a Microbiology bench type; the reflex Gram stain names its rule. Draft 10.2: the TB example and the blood culture example are now one Case view with two data sets, so every section (Incoming results, Case information by Program, Initial testing, Referral point, Culture, Isolates with Add isolate, AST / DST, Additional testing, Critical communication, Nonconformance, Report, Amendment, Timeline) is in both; the report choices and print preview are grouped under the four sub-headers; a reflex Gram stain with Enter result; and the standard chooser in Initial testing, AST / DST and Additional testing. Draft 10.1 added: a blood culture AMR example case (two sets in one case, Program AMR surveillance on the Bacterial track, reportable Gram stains with their results under the positive bottles, a rapid panel on the bottle, three subcultures, K. pneumoniae ESBL on VITEK 2 with CLSI M100, the resistance profile, and the report block); Extend incubation on the case and Extend 24 h on Final read due; and Positive at with the time to positivity. Earlier, it was updated to draft 9 for: an Xpert-only sputum opening a case and two blood culture sets as four samples with their sites; the medium search with Tracked and Not tracked tags and Add new; Apply template; + Test on this culture (Gram stain from a positive bottle); microscopy exams listed under their culture with notes of either type; subculture from any row with Purpose; an instrument negative to confirm; Print label; Patient history and the repeat isolate notice; bench work on the Worklist (Awaiting inoculation, Check due and Final read due filters, No growth per row and for a selection with Undo, Inoculate with one template and one lot per medium); the Plating templates admin list; and, from draft 8: order entry as the ordinary test picker (Bacterial culture added like any test, a blood culture set on -2 and -3, a CBC sample with no case, no Microbiology section); Culture medium and lot from Inventory; Notes (Results Entry pattern) in the result editor, on culture rows and on the isolate; Split into separate cases in the header; and, from draft 6, the case header (Program, lab unit with Change, related-case switcher); Case information (Culture purpose with five values and default, "applies to all cases on this order", priority from the order); Initial testing (reagent lot, In lab only, External and Validated tags); Culture (Atmosphere dropdown, Mark positive and Mark no growth per row, subcultures listed under their parent, + Subculture with From culture); Isolates (Picked from, + Add isolate); AST / DST (panels on the isolate with the organism default, breakpoint default helper, Validate run); Report (how the micro block prints inside the patient report; final checklist); Critical communication (Outcome, National TB Programme call); Worklist (Culture type filter); referral mock data (an isolate to QMRL, not CPHL to itself).

Still to draw:

- Incoming results: Create isolate when none exists and an isolate picker when there are several; the MALDI-TOF item matched to a MALDI-identified isolate; Needs amendment after final; a failed placement with its reason; a reason on Move result.
- Culture: Contaminated and Request repeat specimen outcomes.
- Initial testing: a line probe assay row run on the specimen.
- Report: a second Release partial report after identification.
- Timeline: ascending and descending sort.
- Worklist: scanning cases into the Inoculate selection, with duplicate, rejected and already-plated checks.
- A case opened from a received isolate (ISO-1 Received from, Original specimen type, Reported identification).
