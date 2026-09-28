# Microbiology (AMR) Module v2 Amendments

| | |
|---|---|
| **Version** | v2.0 draft 3 (M-18 folded in; reconciled with the full CPHL workflow breakdown) |
| **Date** | 2026-09-28 |
| **Author** | Casey (Director of Product), drafted with Claude |
| **Status** | Draft for review. Changes in-flight work: read the Impact summary first |
| **Sources** | CPHL Port Moresby workflow breakdown "Microbiology & Mycobacteriology laboratory workflow" (JDHS for UW DIGI, September 2026); Casey's feedback and decisions, 2026-09-28 |
| **Amends** | M-00 Parent, M-01 Reference Data, M-03 Order Entry Micro Hook v2.2, M-04 Case Workbench v2.0, M-05 AST Entry, M-07 Worklists v2.0, M-14 Mycobacteriology/TB, M-18 Environmental Microbiology v0.3, Test Catalog "Culture workflow" attribute |
| **Consumes** | Clinical Order Entry v4 (Program, Tested elsewhere FR-B20, required marking FR-A8, body site section N / D-079), Environmental and Vector Order Entry v4 |
| **Checked against** | develop `d4a8559`: `MicroCase` (`workflow_type` NOT NULL, `culture_method_id`), `MicroWorkflowType` (BACTERIOLOGY, MYCOBACTERIOLOGY_TB, MYCOLOGY, UNASSIGNED), `MicroCultureSetup` (per-workflow culture setups), `MicroAstPanel.workflowType`, `MicroCaseOrderDetail`, `MicroCaseAnalysis`, `MicroCaseInoculation` (`incubation`, `atmosphere` free text), `MicroCaseStage`, `MicroOrderRoutingServiceImpl`, `MicroCaseWorkflowServiceImpl` |
| **Preview** | `amr-micro-v2-preview.html` |

> **Reconciled against** all six sections of the CPHL workflow breakdown (JDHS draft v1.0, 28 September 2026). See **Workflow breakdown reconciliation** near the end for where each part lands.

---

## How to read this document

This is a delta, not a rewrite. The V1 specs stay the reference for everything this document does not touch. Each amendment (A-01 to A-15) states the new behaviour, then a **Contradicts V1** box wherever it reverses something already specced or built:

> **Contradicts V1**
> **Where:** spec and section. **V1 said:** what it said. **v2 says:** the replacement.
> **Build state:** Built (on develop) / Specced / Not started. **Rework:** what has to change.

Build state was read from `develop` on 2026-09-28. "Built" means the code is on `develop`, not that it has passed acceptance.

---

## Impact summary

| V1 item | Change | Build state | Rework |
|---|---|---|---|
| `workflow_type` on the case, culture setups, AST panels, and the enum | **Removed** (A-01) | Built | Drop the column from case keying and the panel filter; retire the culture setup admin; migrate existing cases (all become "no workflow") |
| Culture setups ("protocol lanes") admin and the culture protocol derived from the test's Method | **Removed** (A-01) | Built | Retire `micro_culture_setup` screens and the derivation in `MicroOrderRoutingServiceImpl`; keep the table read-only for history |
| M-03 trigger resolver and the test catalog "Culture workflow" attribute | **Replaced** by Program = Microbiology plus a Lab unit dropdown (A-02) | Built (resolver); Specced (catalog attribute page) | Simplify routing to "Program chosen → case per sample"; drop the catalog attribute page from the Test Catalog v2.5 work |
| UNASSIGNED case state, **Change workflow** (M-04 §4.9), **Set / change protocol** (§4.9a) | **Removed**; replaced by **Change lab unit** (A-02) | Built | UAT F-1 (classify returns 500) becomes moot; remove both panels |
| M-03 Step 1 micro fields (patient origin, admission date, sets, clinical history, antibiotic exposure) | **Moved** to a Case information section on the Case view (A-03) | Built (`MicroCaseOrderDetail` written at order entry) | Order entry stops showing them; Case view edits the same record |
| M-18 environmental micro section at order entry (purpose, replicates, derived protocol) | **Moved** to Case information (A-03) | Specced | Done: M-18 v0.5 aligned (2026-09-29) |
| Incubation as free text; incubation clock from `max_incubation_days` of the Method/culture setup | **Replaced** by a number + unit per inoculation, with optional check reminders (A-05) | Built (free text); Built (clock) | New structured fields; Worklist timing reads them instead of the setup |
| Gram stain captured only by creating a preliminary isolate; preliminary release gated on an isolate Gram stain | **Replaced** by an Initial testing section on the specimen (A-06) and a release gate on any reportable result (A-11) | Built | Move direct Gram into Initial testing; change the preliminary gate |
| Fixed per-profile sections (M-04 bacterial vs M-14 TB) | **Replaced** by one case layout where techs add tests and panels (A-07) | Built (bacterial); Specced (TB) | M-14 becomes a set of tests and panels, not a profile |
| Analyzer results fill only an existing AST run (`RESULTS_IN`) | **Extended**: an Incoming results panel places results that have no matching row (A-09) | Built (existing-run path) | Existing path stays; add the holding panel |
| Report content decided by readiness checklist and M-01 cascade rules only | **Extended**: per-result Report choice on the case (A-11) | Built (checklist) | Add the per-result choice, defaulting from M-01 |
| Referral after microscopy | **New** (A-08) | Not started | Uses existing referral |
| Body site on the micro case | **New link** to D-079 (A-04) | Specced (order entry v4) | Case header and report read it |
| Culture readings | **New** coded, dated read log and time to positivity (A-05) | Not started | New fields on the inoculation |
| TB resistance classification inside the TB profile | **Derived from drug results on any case** (A-14) | Specced (M-14) | Update M-14 |
| Report versions Final / Amended only | **Add Interim** (A-11) | Built (Final, Amended) | New version type |
| Notes | **Internal / External at case, isolate, drug** (A-13) | Built (manual note on case only) | Extend notes |
| Tests added after AST/DST; tests kept off the report | **New** Additional testing section and reversible In lab only flag (A-15) | Not started | New section; flag on case-linked tests |

**Tickets and documents to re-review:** OGC-782 family and OGC-926 (built micro module), M-18 (now v0.5, aligned), Clinical Order Entry v4 FRS (Program section), Environmental and Vector Order Entry v4 FRS (micro section), the Test Catalog micro workflow attribute page (`designs/admin-config/test-catalog-microbiology-workflow-attribute.*`), `OGC-782-amr-uat-findings*` (F-1 and the routing findings no longer apply).

---

## Lab Context

### Current State

A microbiology specimen (a sputum, a urine, a wound swab) is received once and then worked for days or weeks. At the Central Public Health Laboratory (CPHL) in Port Moresby it goes to one of three benches, each its own lab unit: the TB unit, the Microbiology unit, or the Environmental Microbiology unit. Other laboratories split the work differently. The technician first looks at the specimen directly: a wet preparation, a Gram stain, an acid-fast bacilli (AFB) smear for TB, or a GeneXpert run (a molecular test that detects TB and rifampicin resistance in about two hours). Only then is it plated on growth media (inoculation) and left in the incubator. If something grows, the technician examines the colonies under the microscope, subcultures them, identifies each organism, and tests it against antibiotics: antimicrobial susceptibility testing (AST) for bacteria, drug susceptibility testing (DST) for TB.

OpenELIS today models this as fixed "workflows". Each culture test declares Bacteriology or TB, and a culture setup attached to it (media, incubation hours, maximum days) decides how the case behaves. Reception fills a Microbiology box of clinical details at order entry.

### Pain

- **The workflow is declared in advance, and the bench does not work that way.** A technician decides at the bench whether a sputum needs a GeneXpert, a smear, a culture, or all three. When the declared workflow is missing or wrong, the case lands "Unassigned" and has to be reclassified. On the test server that reclassification returns an error (UAT finding F-1), so the case is stuck.
- **Direct microscopy has no home.** A Gram stain on the specimen itself can only be recorded by creating a preliminary isolate, even when nothing has grown yet. A GeneXpert result has no place on a bacterial case at all.
- **Incubation is free text.** "48h" and "2 days" are both typed into a text box, so nothing can tell a technician that a plate is due to be read, or that a TB culture has reached its 42 days.
- **Reception is asked for things it does not know.** Prior antibiotics, TB treatment history and the reason for an environmental swab are on the request form, but typing them at the reception desk slows the queue and they are often skipped.
- **Smaller sites cannot hand over.** A district laboratory that can do microscopy but not culture has no way to send the rest of the work to CPHL and receive the results back on the same case.
- **Analyzer results can only land where a row already exists.** A GeneXpert or an identification instrument that sends a result for a test not yet on the case has nowhere to go.

### What Changes

Reception picks **Program = Microbiology** and a lab unit, and the case opens. Everything else happens on the Case view. The technician fills in the case details from the request form, records the direct tests in a new **Initial testing** section (adding any test from the catalog, or a result that was already reported elsewhere), and either refers the specimen to CPHL or plates it. Incubation is recorded as a number and a unit, with an optional reminder to check, so the Worklist shows "check due" and "incubation complete" without anyone counting days. Growth leads to a colony microscopy exam (internal notes only) and subcultures. Isolates get AST or DST panels added as needed. An analyzer result with no matching row waits in one **Incoming results** panel until the technician places it. At release, the technician ticks which results go on the report.

---

## Overview

One case layout serves every micro lab unit. What makes a case "TB" or "bacteriology" is the tests and panels on it, not a declared workflow: a DST panel interprets against WHO critical concentrations, an AST panel against CLSI or EUCAST, because breakpoints are already mapped to the panel, test or antibiotic (M-02).

**Case view section order (v2):**

1. Case header (lab number, patient or site, sample type, **body site and side**, lab unit, stage, priority)
2. **Incoming results** (shown only when something is waiting)
3. **Case information** (moved from order entry)
4. **Initial testing** (new: microscopy, wet prep, Gram stain, GeneXpert, any added test)
5. **Referral point** (new: refer the rest of the work-up)
6. **Culture**: inoculation and incubation (restructured)
7. **Growth work-up**: colony microscopy exam (internal) and subcultures (new exam; subculture existing)
8. **Isolates** (existing)
9. **AST / DST** (existing, plus add panel or test)
10. **Additional testing** (new: tests added at the end of the work-up, for example whole genome sequencing)
11. **Report** (existing versions, plus per-result Report choice)
12. Timeline (existing)

### Navigation & URL

No new pages. All changes sit on existing routes.

| Surface | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Case view | Microbiology → Worklist → (row) | `Home / Microbiology / Worklist / Case {labNumber}` | `/microbiology/case/:caseId` (existing) |
| Worklist, Needs attention filter | Microbiology → Worklist | `Home / Microbiology / Worklist` | `/microbiology/worklist?status=attention` (existing page, new filter value) |
| Order entry Microbiology section | Orders & Patients → Add Order | existing order entry breadcrumb | existing Enter Order route (Clinical Order Entry v4) |
| Culture setups admin | (removed from Admin → Microbiology Reference Data) | n/a | existing route retired; redirects to Microbiology Reference Data |

---

## User Stories

1. As a **reception clerk**, I want to choose Program = Microbiology and a lab unit and nothing else, so that micro requests move through reception as fast as any other order.
2. As a **microbiology technician**, I want to add the tests I decide to do (smear, GeneXpert, Gram, a DST panel) to the case at the point I do them, so that I am not blocked by a workflow someone declared in advance.
3. As a **technician at a district laboratory**, I want to record my microscopy and refer the rest of the work to CPHL, so that the results come back to the same case and the clinician gets one report.
4. As a **technician on the culture bench**, I want to be told when plates are due to be checked and when incubation is complete, so that no culture is read late or forgotten.
5. As a **microbiology validator**, I want to choose which results appear on the patient report, so that internal work-up and suppressed antibiotics never reach the clinician.

---

## Amendments

### A-01. Remove the declared workflow and the culture setups

| ID | Requirement |
|---|---|
| FR-01.1 | A case has **no workflow type**. Nothing on the case, its sections, its AST/DST panels, the Worklist or exports is selected by a Bacteriology / TB / Mycology value. |
| FR-01.2 | **Culture setups** (the per-workflow media and incubation recipes, "protocol lanes") are retired. The admin screen is removed. Existing setup rows are kept read-only for the history of cases that used them (No Hard Delete). |
| FR-01.3 | The culture protocol is no longer derived at order entry and is no longer shown or set on the case. Media, incubation and atmosphere are recorded per inoculation by the technician (A-05). |
| FR-01.4 | AST and DST panels are offered by the lab unit and organism they apply to (M-01), not by workflow type. |
| FR-01.5 | **Migration.** Existing cases keep their data. Their workflow type and culture setup stay stored but are no longer read by any screen; their lab unit is set from the lab unit of their routed test (A-02). |

> **Contradicts V1**
> **Where:** M-00 (decision "the ordered test carries a workflow_type"); M-03 §2.1a, §2.3 (Culture Protocol row), §2.3b; M-04 §2A, §3 (UNASSIGNED rows), §4.9, §4.9a, §8, AC-M04-21 to AC-M04-24; M-14 §2 ("TB is its own workbench profile"); M-15 (config "included workflow_types"); M-18 FR-C4; `test-catalog-microbiology-workflow-attribute`.
> **V1 said:** the ordered test declares `workflow_type`; it selects the case profile, breakpoint family, organism vocabulary and WHONET flavour; the protocol is the test's default Method with culture parameters.
> **v2 says:** no workflow type and no protocol. Behaviour follows the tests and panels on the case.
> **Build state:** Built (`MicroWorkflowType`, `MicroCase.workflow_type` NOT NULL, `MicroCultureSetup`, `MicroAstPanel.workflowType`, `MicroCaseWorkflowServiceImpl`, `MicroCaseProtocolServiceImpl`).
> **Rework:** stop reading these fields; relax the NOT NULL; remove the Change workflow and Set protocol panels; retire the culture setup admin; M-15 selects by lab unit instead.

### A-02. The case opens from Program = Microbiology; lab unit by dropdown

| ID | Requirement |
|---|---|
| FR-02.1 | Choosing **Program = Microbiology** on an order opens one case per sample on that order. No test catalog attribute is needed. |
| FR-02.2 | Under the Program, the Microbiology section shows one row per sample with a **Lab unit** dropdown. It lists the active lab units of the order's domain and defaults to the lab unit of the first test on that sample. It is required. |
| FR-02.3 | **Lab units are the laboratory's own configuration.** No lab unit is marked as "micro". CPHL, for example, uses TB, Microbiology and Environmental Microbiology; another laboratory may have one Microbiology unit. |
| FR-02.4 | **One case per specimen per lab unit.** A sample row offers **+ Another lab unit** to open a second case on the same specimen (for example a sputum for both TB and bacteriology). The two cases show each other as related cases (M-04 §4.1a, now keyed on lab unit). |
| FR-02.5 | The lab unit can be changed in **Edit order** and on the Case view (**Change lab unit** in the case header). The change moves the case to the new lab unit's Worklist, is recorded on the Timeline with who, when, from and to, and needs no reason. A lab unit that already has a case for that specimen is not offered. |
| FR-02.6 | If Program = Microbiology is not chosen, no case opens. A technician can still open a case later from the Case search page for a received sample (existing M-04 path). |

> **Contradicts V1**
> **Where:** M-03 §2.1 ("Program is a derived signal, not the trigger"), §2.1a (trigger resolver, deployment default workflow), M-03 v2.0 design review item A-TC; M-04 §2A and §9 (keying `sample_item_id` + `workflow_type`); M-18 FR-C1 (resolver on environmental orders).
> **V1 said:** a catalog attribute on the test opens the case, so a clerk's missed Program pick cannot lose a culture; the case is keyed on specimen × workflow type.
> **v2 says:** the Program pick opens the case; the case is keyed on specimen × lab unit.
> **Build state:** Built (`MicroOrderRoutingServiceImpl`).
> **Accepted risk (Casey, 2026-09-28):** a clerk who forgets the Program leaves the culture without a case. Accepted because the specimen is physically delivered to the micro bench, which prompts the correction in Edit order.

### A-03. Case details move from order entry to the Case view

| ID | Requirement |
|---|---|
| FR-03.1 | Order entry shows only the Program and the Lab unit rows (A-02). All other micro fields move to a **Case information** section on the Case view, edited by the technician from the request form. |
| FR-03.2 | **Clinical cases:** patient origin, date of admission, number of sets, clinical diagnosis and reason for test, clinical history, **prior antibiotics** (agent and date, repeatable), **TB history** (new / previously treated / DR-TB contact, treatment month), specimen collection method (for example midstream, catheter, aspirate, first-void) and TB specimen number (spot / early morning). |
| FR-03.3 | **Environmental cases:** purpose and replicates (M-18; stored per order, so they apply to every Case on the order, M-18 FR-C5a), sampling site (interim) or ward (D-101, once Locations & Organizations lands). No patient fields. |
| FR-03.4 | **Required fields are marked where they are** (Clinical Order Entry v4 FR-A8), at two levels: **required to save** (asterisk) and **required before final report** (the same marker plus the helper text "Needed before final report"). The final-report checklist (M-04 §4.6) names every missing field and links to it. |
| FR-03.5 | Proposed levels, to confirm with CPHL: required before final report are patient origin and, when the case has a DST panel or a GeneXpert test, TB history. All other Case information fields are optional. Nothing in Case information blocks the case from opening. |
| FR-03.6 | The existing TB Program order questions are shown in Case information for cases in the lab unit they belong to, instead of at order entry, so an order never needs both the TB Program and the Microbiology Program. |

> **Contradicts V1**
> **Where:** M-03 §2.2, §2.3 (Step 1 micro fields), §2.3a ("M-03 owns Date of Admission because reception has it in front of them"); M-18 §C (environmental micro section at order entry), AC-M18-07; Clinical Order Entry v4 FR-B12 (program questions shown under Program).
> **V1 said:** reception captures the micro details at Step 1.
> **v2 says:** the technician captures them on the Case view.
> **Build state:** Built (`MicroCaseOrderDetail` written at order entry).
> **Rework:** order entry stops showing the fields; the Case view edits the same record; new fields in FR-03.2 are declared in Dependencies.

### A-04. Case header shows lab unit and body site

| ID | Requirement |
|---|---|
| FR-04.1 | The header shows the lab unit (with **Change lab unit**), sample type, **body site and side** (D-079), and the stage. |
| FR-04.2 | Body site is edited in Case information when the sample type uses body site, with the same picker as order entry (Clinical Order Entry v4 FR-D4, FR-N4). It travels to the report and WHONET export unchanged. |

### A-05. Incubation becomes computable, with check reminders

| ID | Requirement |
|---|---|
| FR-05.1 | Each inoculation row records **medium** (coded list from M-01 media), **atmosphere** (coded: Aerobic, CO₂, Anaerobic, Microaerophilic), **temperature** (°C), **incubation duration** (number) with a **unit** dropdown (Hours, Days), and optionally **Check every** (number + unit). Duration and unit are required. |
| FR-05.2 | A new row pre-fills from the previous row on the same case; there are no protocol defaults. |
| FR-05.3 | The system computes **Incubation ends** (inoculated at + duration) and, when Check every is set, **Next check** (last check or inoculation + interval). |
| FR-05.4 | When a check falls due, the row shows **Check due** and the case appears under **Needs attention** on the Worklist with the reason "Check due". **Record reading** (on the row, or **Mark checked** directly on the Worklist row) records a coded reading: **No growth**, **Normal flora**, **Mixed growth**, **Significant growth**, with an optional quantity (CFU/mL for urine, or scanty / + / ++ / +++) and note. Each reading is kept with its date, who and the incubation day, so Day 1, Day 2 and extended reads stay visible as a **read log** on the row and on the Timeline. It sets the next check. |
| FR-05.4a | **Time to positivity / detection** is recorded per inoculation (blood culture bottles, MGIT): from the analyzer's positive signal where it sends one (M-04 §7), otherwise when the technician records the first growth reading. It is shown in hours or days from inoculation. |
| FR-05.5 | When incubation ends, the row shows **Incubation complete** and the case appears under Needs attention with that reason until the technician records an outcome: **Growth** (opens the Growth work-up, A-10), **No growth** (on the last open row, allows the final negative report), or **Contaminated** (TB). **Mixed growth** and **Contaminated** offer **Request repeat specimen**, which uses the existing NCE and repeat request path. |
| FR-05.6 | Extending incubation (for example to 7 days for a suspected slow grower) is an edit of the duration, recorded on the Timeline. The clock never resets: it always measures from the inoculation time. |

> **Contradicts V1**
> **Where:** M-04 §4.2, §4.9a ("the incubation clock recomputes against the new Method's max_incubation_days"), AC-M04-24; M-07 §3 ("Day n of max" from the culture setup).
> **V1 said:** incubation hours and maximum days come from the Method / culture setup; the inoculation `incubation` field is free text.
> **v2 says:** duration is entered per inoculation as number + unit and drives the Worklist.
> **Build state:** Built (`MicroCaseInoculation.incubation` and `.atmosphere` are free text; `MicroWorklistCultureTimingContext` reads the setup).
> **Rework:** structured fields on the inoculation; Worklist timing reads the inoculation rows.

### A-06. New Initial testing section, before inoculation

| ID | Requirement |
|---|---|
| FR-06.1 | A new **Initial testing** section sits after Case information and before Culture. It holds the tests done directly on the specimen. Typical CPHL examples: **Macroscopy** (appearance, colour, clarity, consistency; blood, mucus, pus; stool form; for TB, sputum quality and volume), **Wet preparation** (pus, red and epithelial cells; yeasts, *T. vaginalis*, clue cells; ova, cysts, parasites; casts and crystals), **Gram stain**, special stains (India ink, KOH, cryptococcal antigen), **AFB microscopy** (Ziehl-Neelsen or auramine, WHO/IUATLD grade negative / scanty with count / 1+ / 2+ / 3+) and **Xpert MTB/RIF Ultra** (MTB detected with level / trace / not detected; rifampicin resistance). |
| FR-06.1a | **Structured results, no free text.** Every direct observation is a coded, semi-quantitative select list from the test's result type, with free text only in notes. The **Gram stain** holds several organism morphologies (GPC clusters, GPC chains, GNB, GPB, GNDC, yeasts), each with its own grade (none / rare / few / moderate / many), plus graded cells. This needs a result type that repeats graded rows (see Dependencies). |
| FR-06.2 | These are ordinary catalog tests with their own result types, linked to the case (existing `MicroCaseAnalysis`), worked inline on the case and kept off the ordinary Results screen (M-18 FR-B2 rule). |
| FR-06.3 | Each row offers **Previous report**: the result was already produced, earlier or by another laboratory. It reveals **Performed by** (a laboratory, defaulting to the referring facility, or a person) and **Date performed**, and the result. It reuses Clinical Order Entry v4 FR-B20 "Tested elsewhere". A result produced in this laboratory records the technician who entered it as Performed by, changeable to another user. |
| FR-06.4 | Initial testing results can be released on a preliminary report (A-11). Critical results that prompt the phone call and preliminary report (M-11): organisms seen in CSF or blood culture, AFB positive, rifampicin resistance detected. |

> **Contradicts V1**
> **Where:** M-04 §4.4 ("+ Add isolate creates a preliminary isolate from Gram stain + colony morphology"), §3.3 ("Preliminary release on Gram stain ... once at least one isolate has a Gram-stain observation"), AC-M04-08; M-14 §3 (smear and molecular steps inside the TB profile).
> **V1 said:** a direct Gram stain is recorded on a preliminary isolate; smear and GeneXpert exist only on TB cases.
> **v2 says:** direct tests are rows in Initial testing, on any case.
> **Build state:** Built (isolate-based Gram).
> **Rework:** direct Gram moves to Initial testing; colony Gram stays on the isolate / Growth work-up.

### A-07. Add any test or panel at Initial testing and at AST / DST

| ID | Requirement |
|---|---|
| FR-07.1 | Initial testing and AST / DST each have **+ Add test or panel**: a server-side search over the catalog (name, code, LOINC), offering the tests and panels of the case's lab unit first and all active tests on request. No static list (large catalogs). |
| FR-07.2 | An added test creates an analysis on the case's specimen, linked to the case, with the optional previous-report fields (FR-06.3). An added AST or DST panel creates a run on the chosen isolate (M-05). |
| FR-07.3 | The breakpoint standard follows the panel, test or antibiotic, as today (M-02): a DST panel interprets against WHO critical concentrations, an AST panel against CLSI or EUCAST. |
| FR-07.4 | **Reflex rules add tests on their own** (M-06). For example, rifampicin resistance detected on Xpert MTB/RIF adds Xpert MTB/XDR and a first-line DST panel. A reflex-added test lands in the section it belongs to, tagged **Added by rule** with the rule's name, and is recorded on the Timeline. It can be cancelled like any added test (FR-07.5). Expert rules that only advise (for example phenotype flags) still suggest rather than add. |
| FR-07.4a | **Analyzer results for tests not on the order** are added to the order with one click by a technician. This is the general OpenELIS behaviour for analyzer results; on a case it is the **Accept** in Incoming results (FR-09.3), which adds the test to the order and to the case section together. |
| FR-07.4b | **Analyzer-driven reflex needs no rule.** Some analyzers do their own follow-on testing and send the extra result unasked; for example, when Xpert MTB/RIF Ultra detects MTB it also sends the rifampicin result. That result arrives like any other: into its row if the test is already on the case (FR-09.1), otherwise into Incoming results for a one-click Accept (FR-07.4a). A laboratory configures a reflex rule only for follow-on testing the analyzer does not do itself. |
| FR-07.4c | **No duplicates.** A reflex rule does not add a test that is already on the case, whether it was ordered, added by hand, added by another rule, or is waiting in Incoming results. If a rule has added a test and an analyzer then sends that result, the result fills the rule's row. |
| FR-07.5 | Removing an added test that has no result cancels it; one with a result can only be cancelled with a reason (No Hard Delete). |

> **Contradicts V1**
> **Where:** M-04 §4 (fixed sections per profile), M-14 §3.4 (TB cascade driven by the reflex engine), M-06 (confirmation orders flow through the reflex engine).
> **V1 said:** the profile decides which sections and next tests exist; reflex rules order confirmation tests.
> **v2 says:** technicians add tests and panels at any stage; reflex rules still add tests automatically (unchanged from V1), now into the section they belong to.
> **Build state:** Built (bacterial sections); Specced (M-06, M-14).

### A-08. Referral point after initial testing

| ID | Requirement |
|---|---|
| FR-08.1 | After Initial testing, **Refer remaining work** sends the specimen to another laboratory (for example CPHL) through the existing referral, with the culture and AST/DST work as the referred tests. |
| FR-08.1a | Referral is also available later for a single test or an **isolate**, for example CPHL sending an MTB isolate to a supranational reference laboratory (QMRL) for second-line DST not done in-country. The referral is tracked to receipt (existing referral status) and shows on the case. |
| FR-08.2 | The case stays open with the stage **Referred**. A preliminary report with the local Initial testing results can be released. |
| FR-08.3 | Results returned by the receiving laboratory arrive in **Incoming results** (A-09) on the same case. The referring laboratory reviews them, places them, and releases the final report. The clinician receives one report from one laboratory. |

### A-09. Incoming results panel for analyzer and referral results

| ID | Requirement |
|---|---|
| FR-09.1 | A result for a test that **already exists** on the case goes straight to that row, marked for review, exactly as today (M-05 `RESULTS_IN`; D-059 accept semantics). |
| FR-09.2 | A result for a test **not yet on the case** (from an analyzer or a referral return) waits in **Incoming results** at the top of the case. Each item shows the test, value, source (analyzer name or laboratory), received time and a **suggested destination**: **AST / DST** on a named isolate for a susceptibility result; **Isolate identification** for an identification result (MALDI-TOF Biotyper, BD Phoenix ID, MPT64 antigen), written into that isolate's organism, method and date; otherwise **Initial testing**. |
| FR-09.3 | **Accept** places it at the suggested destination and adds the test to the case. **Place elsewhere** lets the technician choose the other section or another isolate. Nothing is placed without a person accepting it. |
| FR-09.4 | A placed result can later be **moved** to another section or isolate with a required reason; the move is on the Timeline. There is only ever one copy of a result, so it cannot be reported twice. |
| FR-09.5 | A case with items waiting shows under Needs attention on the Worklist with the reason "Incoming results". |

> **Contradicts V1**
> **Where:** M-05 §5 (analyzer results populate an existing run only); M-04 §7 (analyzer event channel).
> **V1 said:** an analyzer result needs an existing AST run.
> **v2 says:** it can also wait in Incoming results for placement.
> **Build state:** Built (existing-run path; unchanged).

### A-10. Growth work-up: colony microscopy exam and subculture

| ID | Requirement |
|---|---|
| FR-10.1 | When an inoculation row is marked Growth, the Growth work-up offers **+ Microscopy exam** (stain, observations, **internal notes**) and **+ Subculture** (existing, records its parent plate). |
| FR-10.2 | A Growth work-up microscopy exam is **internal only**: it never appears on a patient report, a WHONET export or a surveillance submission, and it does not unlock preliminary release. |
| FR-10.3 | The TB positive-signal work-up fits this split: **ZN on culture** (cording) and the **purity check on blood agar** are Growth work-up exams (internal); **MPT64 antigen** (MTBC vs NTM) and **NTM species ID** (line probe assay or MALDI-TOF) are identification results on the isolate, and are reportable. |

### A-11. Choose which results go on the report

| ID | Requirement |
|---|---|
| FR-11.1 | Every reportable result on the case (Initial testing rows, isolates, AST/DST antibiotics) has a **Report** checkbox, shown in the Report section as one list grouped by section. |
| FR-11.2 | In lab only tests (FR-15.3) are not listed. Defaults for the rest: Initial testing and Additional testing results on; isolates marked significant on; antibiotics per M-01 `report_default` (Always on; Cascade per the cascade rule; Suppress unless R on only when R). Growth work-up exams are never listed (FR-10.2). |
| FR-11.3 | Changing a default is recorded on the Timeline (who, when, which result). Unticking a critical result asks for confirmation. |
| FR-11.4 | **Preliminary release** is allowed once at least one reportable result is ticked. **Final release** keeps the M-04 §4.6 checklist, plus the "required before final report" fields (FR-03.4). |
| FR-11.5 | The per-antibiotic choice extends what is already built for AST (`AST_REPORTABLE_SELECTED`) to every reportable result on the case. |
| FR-11.6 | Report versions are **Preliminary** (for example Gram, AFB smear, Xpert), **Interim** (growth detected, identification or AST/DST to follow), **Final** and **Amended** (new version with a reason; superseded results kept in the audit, not printed). Each version records its release date and time and who validated it. |

> **Contradicts V1**
> **Where:** M-04 §3.3, §4.6, AC-M04-08 (preliminary gated on an isolate Gram stain); M-01 §5 (report_default is the only selection mechanism).
> **v2 says:** a per-result choice, defaulted from M-01, on top of the existing rules.
> **Build state:** Built (checklist, report versions).

### A-12. Worklist: Needs attention

| ID | Requirement |
|---|---|
| FR-12.1 | The Worklist gains a **Needs attention** summary card and filter. A case is listed with each reason that applies: Check due, Incubation complete, Incoming results, Referral returned, Missing required-before-final fields when final is otherwise ready. |
| FR-12.2 | **Mark checked** is available on the Worklist row for "Check due" without opening the case. |
| FR-12.3 | The Worklist shows cases for the lab units the user is assigned to, with a Lab unit filter when there is more than one (M-18 FR-E1a). |
| FR-12.4 | "Day n of max" becomes "Day n of N" computed from the inoculation rows (A-05). |

### A-15. Additional testing at the end of the case, and "In lab only" tests

| ID | Requirement |
|---|---|
| FR-15.1 | A new **Additional testing** section sits after AST / DST and before Report. It has **+ Add test or panel** with the same catalog search as FR-07.1, for work done after identification and susceptibility: for example **whole genome sequencing**, carbapenemase gene PCR, or toxin testing. A test can be added on the specimen or on a named isolate. |
| FR-15.2 | Added tests support everything other added tests do: Previous report (FR-06.3), referral of that test or isolate (FR-08.1a), and analyzer or referral results arriving through Incoming results (A-09, with Additional testing as a suggested destination when the test was added there). |
| FR-15.3 | Any test added to the case, in Initial testing, AST / DST or Additional testing, can be marked **In lab only**. An In lab only test and its results never appear on the patient report or in results sent to the requester, and are not listed in the Report choices (FR-11.1). They stay visible on the case, in case search and on the Timeline. |
| FR-15.4 | **In lab only is reversible.** Turning it off puts the test's results back in the Report list, unticked, so the validator chooses whether to report them. Turning it on for a result already on a released report is allowed, takes effect on the next report version, and asks for confirmation. Every change is on the Timeline (who, when, on or off). |
| FR-15.5 | The generic culture test that opened the case cannot be marked In lab only. |
| FR-15.6 | In lab only affects the patient report and results sent to the requester only. Whether a test feeds WHONET, antibiogram or surveillance outputs is decided by those exports' own mappings (M-09, M-13, M-15), not by this flag. |

### A-13. Internal and external notes at case, isolate and drug level

| ID | Requirement |
|---|---|
| FR-13.1 | Notes can be added to the case, to an isolate, and to a single drug result. Each note is **Internal** (bench only, never printed) or **External** (printed on the report next to what it is attached to). Default Internal. |
| FR-13.2 | External notes can use the macro library (M-08), for example "Mixed growth, likely contamination, please repeat", "I = susceptible, increased exposure", notifiable condition and referral pending notices. |
| FR-13.3 | Growth work-up exams (A-10) are always Internal and cannot be switched. |

### A-14. TB resistance classification follows the drug results, not a profile

| ID | Requirement |
|---|---|
| FR-14.1 | When a case has phenotypic or genotypic DST results, the case shows a derived **resistance classification**: RR-TB, MDR-TB, pre-XDR-TB or XDR-TB (WHO 2021 definitions), from the per-drug results. Genotypic results (Xpert MTB/XDR, line probe assay: mutation detected / not detected, with gene or band) count alongside phenotypic ones. |
| FR-14.2 | The classification is derived, never typed, and recomputes when a drug result changes. RR, MDR and XDR are critical results with the National TB Programme notification (M-11). |

> **Contradicts V1**
> **Where:** M-14 §2 and §3 (derivation inside the TB profile, selected by `workflow_type = MYCOBACTERIOLOGY_TB`).
> **v2 says:** derived wherever DST results exist, on any case.
> **Build state:** Specced.

---

## Access

Accessible through the existing roles; no new roles.

- **Reception clerk:** chooses Program and Lab unit at order entry and in Edit order.
- **Microbiology technician** (Results rights in the case's lab unit, D-043): everything on the Case view, including Change lab unit, adding tests and panels, Previous report, Mark checked, placing and moving incoming results, referral, and the Report choices for a preliminary report.
- **Microbiology validator:** final release, including the Report choices on the final report.
- A user without rights in the case's lab unit does not see the case on the Worklist; opening its link shows it read-only.

---

## Localization

REUSE keys are cited where they exist; NEW keys are domain-namespaced (constitution VII, key reuse). Every visible string listed; search with `npm run i18n:find` before minting.

| Key | English | Where | Status |
|---|---|---|---|
| `common.program` | Program | Order entry | REUSE |
| `micro.order.labUnit` | Lab unit | Order entry Microbiology section | NEW |
| `micro.order.anotherLabUnit` | Another lab unit | Order entry | NEW |
| `micro.case.changeLabUnit` | Change lab unit | Case header | NEW |
| `micro.case.labUnitChanged` | Lab unit changed from {from} to {to} | Timeline | NEW |
| `micro.case.section.incoming` | Incoming results | Case | NEW |
| `micro.case.section.caseInfo` | Case information | Case | NEW |
| `micro.case.section.initialTesting` | Initial testing | Case | NEW |
| `micro.case.section.culture` | Culture | Case | NEW |
| `micro.case.section.growthWorkup` | Growth work-up | Case | NEW |
| `micro.case.section.astDst` | AST / DST | Case | NEW |
| `micro.case.requiredBeforeFinal` | Needed before final report | Field helper | NEW |
| `micro.case.priorAntibiotics` | Prior antibiotics | Case information | NEW |
| `micro.case.tbHistory` | TB history | Case information | NEW |
| `micro.case.tbHistory.new` / `.previouslyTreated` / `.drtbContact` | New / Previously treated / DR-TB contact | Case information | NEW |
| `micro.case.treatmentMonth` | Treatment month | Case information | NEW |
| `micro.case.collectionMethod` | Collection method | Case information | NEW |
| `micro.case.specimenNumber` | Specimen number | Case information | NEW |
| `micro.case.addTestOrPanel` | Add test or panel | Initial testing, AST / DST | NEW |
| `micro.case.previousReport` | Previous report | Initial testing row | NEW |
| `micro.case.performedBy` | Performed by | Initial testing row | NEW |
| `micro.case.datePerformed` | Date performed | Initial testing row | NEW |
| `micro.case.referRemaining` | Refer remaining work | Referral point | NEW |
| `micro.case.stage.referred` | Referred | Stage tag | NEW |
| `micro.case.inoc.duration` | Incubation duration | Inoculation row | NEW |
| `micro.case.inoc.unit.hours` / `.days` | Hours / Days | Unit dropdown | NEW |
| `micro.case.inoc.checkEvery` | Check every | Inoculation row | NEW |
| `micro.case.inoc.ends` | Incubation ends | Inoculation row | NEW |
| `micro.case.inoc.nextCheck` | Next check | Inoculation row | NEW |
| `micro.case.inoc.checkDue` | Check due | Row tag, Worklist reason | NEW |
| `micro.case.inoc.complete` | Incubation complete | Row tag, Worklist reason | NEW |
| `micro.case.inoc.markChecked` | Mark checked | Row, Worklist | NEW |
| `micro.case.inoc.growth` / `.noGrowth` | Growth / No growth | Outcome | NEW |
| `micro.case.growth.microscopyExam` | Microscopy exam | Growth work-up | NEW |
| `micro.case.growth.internalOnly` | Internal only, not reported | Growth work-up | NEW |
| `micro.case.incoming.suggested` | Suggested: {destination} | Incoming results | NEW |
| `micro.case.incoming.accept` | Accept | Incoming results | NEW |
| `micro.case.incoming.placeElsewhere` | Place elsewhere | Incoming results | NEW |
| `micro.case.moveResult` | Move result | Result row | NEW |
| `micro.case.moveReason` | Reason for move | Move panel | NEW |
| `micro.case.report.include` | Report | Report list | NEW |
| `micro.case.inoc.recordReading` | Record reading | Inoculation row | NEW |
| `micro.case.reading.noGrowth` / `.normalFlora` / `.mixedGrowth` / `.significantGrowth` | No growth / Normal flora / Mixed growth / Significant growth | Reading | NEW |
| `micro.case.reading.quantity` | Quantity | Reading | NEW |
| `micro.case.reading.contaminated` | Contaminated | Outcome | NEW |
| `micro.case.inoc.timeToPositivity` | Time to positivity | Inoculation row | NEW |
| `micro.case.requestRepeat` | Request repeat specimen | Outcome | NEW |
| `micro.case.note.internal` / `.external` | Internal / External | Notes | NEW |
| `micro.case.report.interim` | Interim | Report versions | NEW |
| `micro.case.tbClassification` | Resistance classification | AST / DST | NEW |
| `micro.case.tbClassification.rr` / `.mdr` / `.preXdr` / `.xdr` | RR-TB / MDR-TB / pre-XDR-TB / XDR-TB | AST / DST | NEW |
| `micro.case.section.additionalTesting` | Additional testing | Case | NEW |
| `micro.case.addedByRule` | Added by rule: {rule} | Test row | NEW |
| `micro.case.inLabOnly` | In lab only | Test row | NEW |
| `micro.case.inLabOnly.helper` | Not shown on the patient report | Test row | NEW |
| `micro.case.inLabOnly.confirmReleased` | This result is on a released report. It will be left off the next report version. | Confirmation | NEW |
| `micro.worklist.card.attention` | Needs attention | Worklist | NEW |
| `micro.worklist.reason.checkDue` / `.incubationComplete` / `.incoming` / `.referralReturned` / `.missingRequired` | Check due / Incubation complete / Incoming results / Referral returned / Missing required fields | Worklist | NEW |

---

## Dependencies (data elements)

Named data elements only; storage is the implementing engineer's call.

**New**
- Case lab unit (the lab unit a case belongs to; replaces workflow type in case keying).
- Prior antibiotics: agent and date, repeatable (today a single yes/no).
- TB history: category and treatment month.
- Specimen collection method; TB specimen number (spot / early morning).
- Inoculation: coded medium, coded atmosphere, temperature, duration value, duration unit, check interval value and unit; check events (who, when, note); outcome.
- Result provenance: performed by (person or laboratory) and date performed, for results recorded as a previous report (shared with Clinical Order Entry v4 FR-B20).
- Incoming result holding item: source, received time, suggested destination, placement.
- Per-result report inclusion on the case.
- Growth work-up microscopy exam (internal).
- Stage value Referred.
- Culture readings: coded reading, quantity, note, who, when, incubation day; time to positivity / detection per inoculation.
- A result type that repeats graded rows (Gram stain morphologies, each with a grade). Check first whether the test catalog's result components already cover it.
- Notes with Internal / External type attached to case, isolate or drug result.
- Report version type Interim (today the stored types are Final and Amended; preliminary is an activity).
- Derived TB resistance classification (computed, not stored as entered data).
- In lab only flag on a test linked to the case, with its change history; the section a case test was added in (Initial testing, AST / DST, Additional testing).

**Reused**
- `MicroCaseOrderDetail` fields (edited on the Case view instead of order entry).
- `MicroCaseAnalysis` (links added tests to the case).
- `MicroCaseInoculation.source_inoculation_id` (subcultures).
- Existing referral and referral results return.
- M-01 `report_default`; M-02 breakpoint mapping per panel, test and antibiotic.
- Body site and laterality (D-079, Clinical Order Entry v4 section N).
- Analyzer accept semantics (D-059); lab-unit gating (D-043).

**Retired (kept read-only)**
- Workflow type on case, culture setup and AST panel; culture setups; culture protocol on the case.

---

## Acceptance Criteria

- **AC-V2-01** Choosing Program = Microbiology on an order with one sample opens exactly one case, in the lab unit chosen in the Microbiology section.
- **AC-V2-02** The Lab unit dropdown defaults to the lab unit of the first test on the sample and lists only active lab units of the order's domain.
- **AC-V2-03** + Another lab unit opens a second case on the same specimen; a lab unit already used for that specimen is not offered.
- **AC-V2-04** Changing the lab unit in Edit order or on the case moves the case to the new lab unit's Worklist and writes a Timeline entry.
- **AC-V2-05** No screen, filter, panel list or export reads a workflow type; the Culture setups admin screen is gone and its route redirects.
- **AC-V2-06** Order entry shows no micro fields other than Program and Lab unit; Case information shows them and saves to the same record.
- **AC-V2-07** Fields required to save show an asterisk; fields required before final report show the marker and "Needed before final report"; the final checklist lists each missing one with a link.
- **AC-V2-08** Initial testing appears between Case information and Culture and accepts any catalog test through the search.
- **AC-V2-09** Ticking Previous report reveals Performed by and Date performed; the saved result shows its provenance on the case and the report.
- **AC-V2-10** An inoculation cannot be saved without duration and unit; Incubation ends is shown and computed from the inoculation time.
- **AC-V2-11** With Check every set, the case appears under Needs attention with "Check due" at the due time; Mark checked on the Worklist clears it and sets the next check.
- **AC-V2-12** At incubation end the case appears under Needs attention with "Incubation complete" until Growth or No growth is recorded.
- **AC-V2-13** Extending the duration does not reset the clock.
- **AC-V2-14** A Growth work-up microscopy exam never appears on a report, a WHONET export or a surveillance submission.
- **AC-V2-15** Refer remaining work sets the stage to Referred and allows a preliminary report with local results.
- **AC-V2-16** A returned referral result or an analyzer result for a test not on the case appears in Incoming results with a suggested destination; nothing is placed until a person accepts it.
- **AC-V2-17** A result for a test already on the case goes to that row, marked for review, without passing through Incoming results.
- **AC-V2-18** Moving a placed result requires a reason and leaves one copy of the result.
- **AC-V2-19** The Report list defaults follow FR-11.2; a changed default is on the Timeline; unticking a critical result asks for confirmation.
- **AC-V2-20** Preliminary release is enabled once any reportable result is ticked, with no isolate needed.
- **AC-V2-21** A DST panel added to an isolate interprets against WHO critical concentrations; an AST panel against CLSI or EUCAST, with no workflow type involved.
- **AC-V2-22** Every visible string in the Localization table is a translation key.
- **AC-V2-23** Each culture reading is kept with its date, user and incubation day; a case read on Day 1 and Day 2 shows both readings.
- **AC-V2-24** A Gram stain result holds at least two organism morphologies, each with its own grade, with no free-text result field.
- **AC-V2-25** An identification result from MALDI-TOF or Phoenix for a case isolate is offered in Incoming results with the isolate as the suggested destination, and accepting it fills that isolate's organism, method and date.
- **AC-V2-26** An isolate can be referred on its own and its referral status is shown on the case.
- **AC-V2-27** Rifampicin and isoniazid resistant results show MDR-TB; the classification updates when a fluoroquinolone result is added.
- **AC-V2-28** An External note prints on the report beside its case, isolate or drug; an Internal note never prints.
- **AC-V2-29** An Interim report version can be released between Preliminary and Final.
- **AC-V2-30** Additional testing appears after AST / DST and accepts any catalog test, on the specimen or on an isolate.
- **AC-V2-31** A test marked In lab only is absent from the Report list, the printed report and results sent to the requester, and remains on the case.
- **AC-V2-32** Turning In lab only off returns the test's results to the Report list unticked; each change is on the Timeline.
- **AC-V2-33** The test that opened the case offers no In lab only option.
- **AC-V2-34** A rifampicin-resistance-detected Xpert result adds the reflex tests configured for it without user action; each shows Added by rule and a Timeline entry.
- **AC-V2-35** Accepting an incoming analyzer result for a test that was not ordered adds the test to the order and to the case in one action.
- **AC-V2-36** With no reflex rule configured, an Xpert MTB/RIF Ultra run that detects MTB and sends a rifampicin result shows that result on the case (in its row, or in Incoming results if the test is not on the case).
- **AC-V2-37** A reflex rule never adds a second copy of a test already on the case or waiting in Incoming results.

---

## Crosscheck

**Verdict:** Proceed with coordination. No active GLOBAL decision is contradicted, but v2 reverses several built behaviours and today's M-18 draft; M-18 and both order entry v4 FRSs must be updated in step.

### Contradictions (vs decision log)

None against an active decision. The reversals are of spec-level decisions in M-00, M-03, M-04 and M-14 (boxed above), which were never logged as D-rows. Proposed decisions below record the new direction so `/crosscheck` catches future drift.

### Overlaps

| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| M-18 Environmental Microbiology | env micro section at order entry, resolver, derived protocol | v0.3 was written against V1; **resolved in v0.5** (FR-C1 to C5a, FR-D1, FR-D3, AC-M18-06/07; decisions D-120 to D-123) | HIGH, resolved |
| Clinical Order Entry v4 | Program section (FR-B12), Tested elsewhere (FR-B20), required marking (FR-A8), body site (section N) | micro section shrinks to Lab unit rows; Previous report reuses FR-B20 | HIGH |
| Environmental and Vector Order Entry v4 | micro section | same shrink as clinical | MEDIUM |
| M-09 WHONET export, first-isolate de-duplication (D-049) | grouping by workflow type (TB vs bacterial) | must group by lab unit or organism instead | MEDIUM |
| M-13 Antibiogram / M-17 presets | TB variant selected by workflow type | select by breakpoint standard type (critical concentration) | MEDIUM |
| M-15 GLASS | "included workflow_types" config | becomes included lab units | MEDIUM |
| M-16 Cluster detection | scan populations | unaffected (uses domain); confirm no workflow-type filter | LOW |
| Analyzer Pending Imports inbox (D-043 to D-045) | results with no matching order | Incoming results is per case; unmatched-to-any-case results stay in Pending Imports | MEDIUM |

### Dependencies

- Upstream: Clinical Order Entry v4 Program section and FR-B20; body site (D-079); existing referral return path.
- Downstream (re-review): M-09, M-13, M-15, M-17, M-18, test catalog workflow attribute page (withdraw).

### Proposed decisions (numbering to verify against `openelis-design-skill-src` before landing; last seen D-112)

| ID | Decision | Scope |
|---|---|---|
| D-113 | **No declared microbiology workflow.** A case's behaviour follows the tests and panels on it. Workflow type, culture setups and case profiles are retired. | FEATURE (micro) |
| D-114 | **A case opens when Program = Microbiology is chosen**, one per specimen per lab unit. The lab unit defaults from the first test and can be changed in Edit order and on the case. No lab unit is marked as "micro". | FEATURE (micro, order entry) |
| D-115 | **Micro case details are captured on the Case view**, not at order entry. | FEATURE (micro, order entry) |
| D-116 | **Unplaced results wait in one Incoming results panel per case.** One copy of every result; moves are audited. | FEATURE (micro, analyzers, referrals) |
| D-117 | **Report content is chosen per result on the case**, defaulting from M-01 report rules; internal work-up is never reportable. | FEATURE (micro, reports) |
| D-118 | **Incubation is a number and a unit per inoculation**, with an optional check interval feeding Needs attention; the clock never resets. | FEATURE (micro) |
| D-119 | **Any test added to a case can be marked In lab only**, reversibly: it never reaches the patient report or the requester; export inclusion stays with each export's own mapping. | FEATURE (micro, reports) |

### Registry upkeep (at approval)

Update the M-00, M-03, M-04, M-07, M-14, M-18 rows in `spec-registry.md` (entities, "workflow_type" removed, lab unit keying), add this document as the M-v2 row, add D-113 to D-119 to `decision-log.md`, in both in-repo copies.

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
| 2 Direct testing | Macroscopy, wet prep, Gram, special stains, AFB, Xpert Ultra | A-06 Initial testing |
| 2 Direct testing | Structured semi-quantitative lists; several graded morphologies per Gram | FR-06.1a (needs repeating graded result rows) |
| 2 Direct testing | Direct result triggers preliminary report and critical call | FR-06.4, A-11, M-11 |
| 2 Direct testing | RR detected → reflex Xpert MTB/XDR and DST | FR-07.4 (reflex adds automatically, tagged Added by rule) |
| 3 Culture | Media, atmosphere, temperature | A-05 |
| 3 Culture | Blood culture time to positivity; TB time to detection | FR-05.4a |
| 3 Culture | Day 1 / Day 2 / extended readings with quantity; dated read log | FR-05.4 |
| 3 Culture | No growth → final negative; mixed growth or contaminated → repeat | FR-05.5 |
| 3 Culture | NALC-NaOH decontamination; MGIT 42 days, LJ 8 weeks | A-05 (decontamination as a Growth work-up or Initial testing entry; duration per inoculation) |
| 3 Culture | ZN on culture, purity check | A-10 (internal) |
| 3 Culture | MPT64, NTM species ID, MALDI-TOF, Phoenix ID, biochemicals; WHONET organism code | Isolate identification, existing M-04 + FR-09.2 analyzer placement |
| 4 AST/DST | Phoenix MIC, disc zone, gradient strip; raw value kept; EUCAST 2025 v15 | Existing M-05, M-02 |
| 4 AST/DST | Expert rules, intrinsic resistance, MRSA / ESBL / AmpC / CPE / VRE flags | Existing M-06 |
| 4 AST/DST | Selective / cascade reporting, per-drug suppress | Existing M-01 + A-11 |
| 4 AST/DST | MGIT first- and second-line DST at WHO critical concentrations; Xpert MTB/XDR, LPA per-drug mutations | A-07 (panels added on the isolate), M-02 |
| 4 AST/DST | RR / MDR / pre-XDR / XDR classification | A-14 |
| 4 AST/DST | Referral to QMRL, tracked to receipt | FR-08.1a |
| 4 AST/DST | CPE / alert organism → IPC; RR/MDR/XDR → NTP | M-11 critical notification |
| 5 Reporting | Preliminary, interim, final, amended; release time and validator | FR-11.6 |
| 5 Reporting | Critical call log with read-back | Existing M-11 |
| 5 Reporting | Interpretive comment macros | Existing M-08, FR-13.2 |
| 6 Notes | Internal / external notes at sample, isolate, drug | A-13 |
| 6 QC | Media and stain QC by lot; ATCC control strains vs EUCAST ranges; MGIT controls; EQA | **Gap**, not in v2 (see Out of scope) |
| 6 Surveillance | WHONET export, antibiogram (first isolate), DR-TB to NTP, alerts to IPC | Existing M-09, M-13, M-15, M-11 |
| 6 Storage | Isolate storage at -80 °C with location | **Gap**, not in v2 (see Out of scope) |

## Out of scope

- Colony counts and quantity scales beyond what M-04 isolates already hold.
- Changes to breakpoint content (M-02).
- A lab-unit "type" or micro marker (explicitly rejected, D-114).
- Automatic placement of incoming results without a person accepting them.
- **Micro QC** (media and stain QC by lot, ATCC control strains against EUCAST QC ranges, MGIT positive and negative controls, EQA). Belongs with M-12 reagent linkage and the manual QC work; flagged as a gap from the CPHL breakdown.
- **Isolate storage** (-80 °C with freezer location). Candidate for the existing sample storage feature applied to isolates; flagged as a gap.
