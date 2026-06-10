# Microbiology in the Lab — A Workflow Walk-through (v2, for developers)

**Audience:** Developers building features in the OpenELIS Global Microbiology module who have **no microbiology background**. By the end of this doc you should be able to look at any feature in the micro / AMR release and know (1) what the lab actually does that the feature is modeling, (2) what subsystem in OpenELIS the feature lives in, (3) what data it reads and writes, and (4) how it composes with the rest of OpenELIS.

**Author:** Casey Iiams-Hauser
**Date:** 2026-06-08
**Version:** 2.0 — adds the workflow-selection routing rule, a TB / Mycobacteriology walkthrough phase, an Antibiogram note, and the forthcoming GLASS / consolidated-FHIR surveillance step. Supersedes v1.0 (2026-05-15, first dev-facing pass post-critique of the v1.1 AMR FRS trio).
**Companion docs:** `amr-design-critique-v1.md`, `microbiology-case-workbench-frs-v1.1.md`, `amr-configuration-frs-v1.1.md`, `whonet-integration-frs-v1.1.md`, plus the M-\* FRS bundle (M-01 … M-14).
**Sibling doc style:** Modeled on `qa-qc-narrative-v3-for-devs.md`.

---

## How to read this doc

Microbiology, unlike chemistry or hematology, is not a one-row-per-result workflow. A single specimen can produce zero, one, or several results across **multiple days**, and the workflow is shaped by the biology of the organisms inside the specimen as much as by the lab's procedures. This doc walks the workflow as a sequence of **phases**, in the order they unfold in a real lab.

Each phase section is structured the same way:

1. **What this phase is, in software terms.** What you're actually building — modules, controllers, services, data model, integration points.
2. **Lab primer.** Two to four paragraphs explaining the lab activity the phase models, written for someone who has never worked in a lab. Includes the vocabulary that will appear in the rest of the section.
3. **A walked-through scenario.** A concrete lab workflow narrated alongside what happens in code — request paths, table writes, event emissions, UI surfaces.
4. **How this phase composes.** Integration points with the rest of OpenELIS (Sample Collection, Test Catalog, Results, Validation, QA/QC, Reports, Alerts). Which events leave the phase, which events enter it, which shared data model rows it touches.
5. **What you're building, by release version.** A table mapping each feature to its status (shipped / in-progress / scheduled / future) and the release phase it ships in.

Read in order if you're new to micro. Skip to a single phase if you're sized to one piece of the release.

**Mockup references:** Each phase section now points to a rendered HTML preview of the relevant UI surface. Open the HTML file in a browser to see what the workflow narrated below actually looks like once built. The mockups use Carbon design tokens; they are visual references, not production React.

---

## How this maps to the release cycles

The bundle ships in three cycles, with each phase below tagged accordingly:

* **MVP-1A** — the minimum a lab needs to run a culture end-to-end: register an order, inoculate, log positive detection manually, identify isolates, enter AST manually, release a report. Phases 1-3 and 5 of this narrative are MVP scope at a basic level.
* **Phase 1A+** — productivity amplifiers: macros, analyzer integration (BacT/Alert + VITEK), amendment workflow, reidentification versioning, AST Worklist + Dashboard, polymorphic critical-result rework. The narrative describes these inline; they're built once MVP-1A is in real use.
* **Phase 1B** — surveillance + expert rules: Expert Rules engine (Phase 4 of this narrative), WHONET Export (Phase 6), Hub Subscription, additional analyzer profiles.

The TB / Mycobacteriology phase (Phase 7) is a later cycle — see that section for its placement. If you're sized to MVP-1A, focus on Phases 1-3 and 5 with **manual-entry only** assumptions. Skip the macro-related details and the Expert Rules section.

---

## Preamble — what the Microbiology module is, in software terms

The OpenELIS Global Microbiology module is a new top-level section in the application's sidenav. It models a workflow that **does not fit** the existing OpenELIS pattern of "Sample → Analysis → Result," and that is the central design challenge. Specifically:

* A chemistry analysis produces one result per analyte (e.g., one potassium value per blood draw). A micro analysis produces a variable number of **isolates** (organisms grown from the specimen), and each isolate produces its own variable number of **AST results** (susceptibility to antibiotics).
* A chemistry analysis is point-in-time (the analyzer reports in minutes). A micro analysis is a **multi-day process** with intermediate readings that may or may not produce results (e.g., "no growth at 24 hours, continue incubation").
* A chemistry analysis is mostly numeric. A micro analysis is heavily **narrative** — the tech writes "Mixed flora isolated, suggestive of contamination. Clinical correlation recommended" rather than a number with units.

The module introduces three new top-level concepts beyond Sample / Analysis / Result:

* **Case** — a container that wraps a single Sample's entire micro workup, from arrival through final report. One Case per Sample. Maps roughly to a Sample-level "session" but with explicit stage tracking and a timeline.
* **Isolate** — a distinct organism identified from the Sample. Zero, one, or many per Case. Each Isolate has its own identity, significance assessment, and AST run.
* **AST Run** — a set of antibiotic susceptibility results for one Isolate against one configured panel of antibiotics, interpreted against one breakpoint standard. One or more per Isolate.

These new entities sit alongside Sample (existing), Analysis (existing), and Result (existing). The mapping between them — which AST results write to the existing `result` table, which write to a new `ast_result` table, where the Case fits relative to Sample — is the single highest-stakes data-model decision in this release. We have not yet committed to that mapping; the crosswalk doc (companion to this narrative) is where we resolve it.

A small but capable clinical lab is a lab that runs roughly thirty to a hundred and fifty specimens a day, has one to three benches, one supervisor who reviews everything, and one or two analyzers (typically VITEK 2 or BD Phoenix for AST, plus a blood culture instrument like BacT/Alert or BACTEC). The workflow this doc describes applies to that band; it is not specific to PNG, Côte d'Ivoire, Madagascar, or any other deployment. Larger reference labs do the same shape of work at higher volume; very small district labs may skip AST and only do culture identification. The design needs to work for any lab in this band, with optional features off when not needed.

The module composes with the rest of OpenELIS in five places:

```
Order Entry ── adds Step 1 "Microbiology Program" branch ──┐
                                                            │
Test Catalog ── Micro tests live here, with WHONET codes ──┤
                                                            ▼
Sample Collection ── Sample row created as usual ──────► Case (new) ──► Isolate(s) (new) ──► AST Run(s) (new)
                                                            │
QA / QC ── AST QC failures, expert-rule overrides ─────────┤
                                                            │
Patient Reports ── Multi-isolate preliminary + final ──────┘
                                                            │
WHONET Export (new) ── reads completed Cases ──────────────┘
                                                            │
Alerts Dashboard ── critical resistance findings push here ┘
```

These five integration points are where most of the leakage in the current FRS trio lives. The narrative below makes each one explicit at the phase where it matters.

The rest of this doc walks the workflow in phases, in the order a specimen moves through the lab. But before any of those phases run, the module has to answer one routing question: **which kind of micro workup is this?** That question is answered by the workflow-selection rule, immediately below.

---

## Phase 0 — Workflow selection: how the module routes a micro order

**MVP cycle:** MVP-1A for `BACTERIOLOGY`; `MYCOBACTERIOLOGY_TB` lights up in the TB cycle (Phase 7). · **Refs:** M-03 (Order Entry hook), M-04 (Case Workbench), M-01/M-02 (reference data).

### What this phase is, in software terms

This is the routing rule that everything else hangs off. **There is no clerk decision and no per-bench guesswork — the routing is data, carried on the ordered test.**

Every micro-capable test in the Test Catalog declares a **`workflow_type`**:

* **`BACTERIOLOGY`** → instantiates the **M-04 bacterial Case profile** (the routine culture-and-AST workflow that Phases 1-6 walk through).
* **`MYCOBACTERIOLOGY_TB`** → instantiates the **M-14 TB Case profile** (Phase 7).
* **`MYCOLOGY`** → **future** (M-15 fungal mold module); reserved in the enum, not yet wired.

When the order saves and the Sample-save hook fires (the same hook from Phase 1), the **M-03 trigger resolver** reads the ordered test's `workflow_type` and calls `MicroCaseService.createCaseForSample(sampleId, workflowType)`. That `workflowType` selects a **Case profile**, and the Case profile is the single source of truth that drives everything downstream:

* **Which sections render** in the Case Workbench (e.g., a TB Case surfaces an AFB-smear and a molecular section; a bacterial Case does not).
* **Which breakpoint family** the interpretation service uses — CLSI / EUCAST **clinical MIC** S/I/R for bacteriology, vs. **WHO-TB critical concentrations** (Resistant / Susceptible at a fixed concentration) for TB.
* **Which culture-protocol Method** the inoculation step offers — standard bacterial media (BAP / MAC / CHOC / broth) vs. **MGIT liquid culture / Löwenstein–Jensen (LJ) slants** for mycobacteria.
* **Which reflex cascade** fires (the bacterial expert-rules cascade of M-06, vs. the TB molecular-to-phenotypic-DST cascade of Phase 7).
* **Which WHONET export flavor** the completed Case feeds (routine AMR vs. the TB-specific export shape).

One source of truth — the test — and no clerk has to "know" that a sputum for TB is handled differently from a sputum for routine culture. The catalog already knows, because the test the clinician ordered already knows.

### Lab primer

A lab does not have one micro workflow; it has a small number of **distinct disciplines** that happen to share a building, some instruments, and a lot of vocabulary. Routine **bacteriology** (the E. coli, staph, klebsiella world of Phases 1-6) and **mycobacteriology** (TB and its non-tuberculous cousins) are run on different media, on different timescales (days vs. weeks), graded against different rule books (CLSI/EUCAST clinical breakpoints vs. WHO critical concentrations), and reported in different shapes. They are recognizably "micro," but they are not the same workflow.

The thing that decides which discipline a specimen belongs to is **the test the clinician ordered**, not the specimen type. The same sputum cup can be the input to a routine respiratory culture *and* to a TB workup — those are two different clinical questions, ordered as two different tests. The lab does not look at the cup and guess; it reads the order.

A practical consequence the data model has to honor: **a specimen that needs both routine culture AND a TB workup is two ordered tests, and therefore two Cases — one per profile.** This is the **one-protocol-per-case rule**: a Case carries exactly one culture protocol and one workflow profile, so "culture this for ordinary bacteria *and* for mycobacteria" is structurally two Cases sharing one Sample, not one Case running two protocols. That keeps each Case's sections, breakpoints, reflexes, and export flavor unambiguous.

### Walked-through scenario

A sputum arrives with two tests ordered: "Sputum Culture & Sensitivity" (`workflow_type = BACTERIOLOGY`) and "AFB Smear & TB Culture" (`workflow_type = MYCOBACTERIOLOGY_TB`).

In code:

* Sample Collection writes one `sample` row, as usual.
* The post-save hook iterates the ordered micro tests. For each, the M-03 trigger resolver reads `workflow_type` and calls `MicroCaseService.createCaseForSample(sampleId, workflowType)`.
* Two `micro_case` rows are written against the one Sample: one with profile `BACTERIOLOGY` (protocol `RESPIRATORY_STD`), one with profile `MYCOBACTERIOLOGY_TB` (protocol `TB_MGIT_LJ`).
* The bacterial Case renders the Phases 1-6 surfaces. The TB Case renders the Phase 7 surfaces — AFB smear, GeneXpert, MGIT/LJ culture, DST. Each Case interprets against its own breakpoint family and feeds its own export flavor.

The two Cases run on their own timelines and never collide. The Sample is the only thing they share.

### How this phase composes

* **← Test Catalog:** `workflow_type` is a column on the micro-capable test. This is the one piece of config that makes routing automatic.
* **← Order Entry (M-03):** the trigger resolver reads `workflow_type` at Sample-save and is the only place the routing decision is made.
* **→ Case Workbench (M-04 / M-14):** the resolved profile selects sections, breakpoint family, culture-protocol Method, reflex cascade, and export flavor.
* **→ everything downstream:** Phases 1-7 all read the Case's profile rather than re-deriving the discipline.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| `workflow_type` column on micro tests (`BACTERIOLOGY` / `MYCOBACTERIOLOGY_TB` / `MYCOLOGY`) | New | MVP-1A (BACTERIOLOGY); TB value in Phase 7 |
| M-03 trigger resolver reads `workflow_type`, selects Case profile | New | MVP-1A |
| Case profile mechanism (sections / breakpoints / method / reflex / export) | New | MVP-1A (bacterial profile); TB profile in Phase 7 |
| One-protocol-per-case enforcement (two ordered tests → two Cases) | New | MVP-1A |
| `MYCOLOGY` profile | Future | M-15 |

---

## Phase 1 — Pre-analytical: Order, sample arrival, accessioning, culture setup

**MVP cycle:** MVP-1A · **Mockups:** `m-03-order-entry-step1-preview-v1.html`, `m-07-pending-cultures-preview-v1.html`, `m-01-organism-master-preview-v1.html`.

### What this phase is, in software terms

This phase reuses three OpenELIS subsystems that already exist, plus one new entity:

* **Order Entry** — the existing 4-step wizard. Step 1 (Program Selection) gains a new "Microbiology" program option, which surfaces six micro-specific fields _inside Step 1's existing surface area_. No new step. (This is a discrete amendment to the existing Order Entry FRS, not a Micro-owned page.)
* **Sample Collection** — the existing Sample Collection redesign (the COL-\* epic). A micro Sample is created in the same table as a chemistry Sample; the difference is that a micro Sample triggers Case creation on save.
* **Test Catalog** — existing. Micro tests ("Blood Culture," "Urine Culture and Sensitivity," "Sputum Culture") live in the catalog with WHONET tagging on the AMR flag, and now also carry the `workflow_type` that Phase 0 routes on.
* **Case (new)** — first new entity. Written on Sample save when the Sample's Program is Microbiology. Initial stage `RECEIVED`. The profile is set by the Phase 0 resolver.

### Lab primer

A specimen — a tube of blood, a urine cup, a swab of pus from a wound, a sputum sample — arrives in the lab from a clinician who has ordered "culture." Culture means "try to grow whatever organisms are in this sample so we can identify them and figure out which antibiotics will kill them." Unlike a chemistry test where the analyzer runs in minutes, culture takes days.

The lab accessions the specimen (logs it in, gives it a lab number) and looks at the specimen type to decide what **culture protocol** to apply. A culture protocol is a recipe: which agar plates to inoculate, which liquid media to inoculate, how long to incubate, at what temperature, in what atmosphere. A urine culture protocol is different from a blood culture protocol, which is different from a sputum culture protocol. The lab maintains a small library of protocols, typically one per common specimen type plus a few specialties.

The tech doing accessioning physically picks up plates and bottles, writes the lab number on them, streaks the specimen across the plate's surface or injects it into the bottle (this act is called **inoculation**), puts them in the incubator, and notes what was set up — in a real lab, often on a paper worksheet that lives next to the incubator. The system needs to capture that same information: which Sample, which protocol, which plates / bottles, who did it, when, and what their initial observations were.

The vocabulary: **specimen type** (urine, blood, sputum, wound, CSF, stool, other), **culture protocol** (Blood Culture Standard, Urine Routine, Respiratory Standard, Wound Culture, CSF Urgent, Stool Enteric), **agar plate** (BAP = blood agar, MAC = MacConkey, CHOC = chocolate agar, CNA = colistin-nalidixic acid agar, THIO = thioglycollate broth), **bottle** (blood culture goes into FA / FN — aerobic / anaerobic bottles), **lot number** (each plate or bottle came from a manufacturer batch).

### Walked-through scenario

It is 7:42 AM. A blood culture set arrives from the ER: two bottles labeled `MARTINEZ, Carlos, BC24-0892`, one aerobic (`FA24012`) and one anaerobic (`FN24012`). The clinician's order reads "blood culture, sepsis workup." The lab tech, Olivia, scans the lab number into OpenELIS.

In code:

* Order Entry was already completed by the ER clerk at 7:18 AM. The Order row was written with `program = MICROBIOLOGY`, Step 1 micro fields captured. Priority `URGENT` was set on Step 3, not Step 1.
* The Sample row was written by Sample Collection at 7:18 AM with the standard fields plus a foreign key to the Order. `sample.program = MICROBIOLOGY` triggers a post-save hook.
* The post-save hook calls the M-03 resolver, which reads the ordered test's `workflow_type` (`BACTERIOLOGY`) and calls `MicroCaseService.createCaseForSample(sampleId, BACTERIOLOGY)`. A new `micro_case` row is written: profile `BACTERIOLOGY`, stage `RECEIVED`, protocol `BLOOD_CULTURE_STD`.
* Olivia opens `/MicrobiologyPendingCultures` at 7:42 AM. The new Case shows up with stage `RECEIVED`, Due Action = "Inoculate."
* Olivia clicks the row, lands on `/MicrobiologyCase/:caseId`. She inoculates the two bottles, sticks them in the BacT/Alert, then clicks "Add Inoculation Event" on the Timeline section. Save writes a `micro_case_inoculation` row per bottle and a `micro_timeline_event` row of type `INOCULATION`. Case stage updates to `INCUBATING`.

The bottles are now in the BacT/Alert. They sit there. There is nothing more for Olivia to do until either (a) the instrument detects growth and signals positive, or (b) five days elapse with no signal and the bottles are finalized negative.

This is the rhythm of micro: a tech does a burst of setup work at the start of the day, then everything goes quiet until the next morning when the readings happen.

### How this phase composes

* **← Order Entry:** Step 1 surfaces six micro fields when the Program dropdown is set to `MICROBIOLOGY`. Priority is _not_ among them — it lives on Step 3. The `workflow_type` routing happens at Sample-save (Phase 0), invisible to the clerk.
* **← Sample Collection:** Standard Sample row, no Sample-Collection-specific changes. The Sample-save hook is the integration point.
* **← Test Catalog:** Each micro test in the catalog has the AMR flag, a default culture protocol, and a `workflow_type`.
* **← QA / QC:** Lot numbers come from `qc_lot`. If the tech tries to log an inoculation against a lot that is locked or expired, the system blocks the save.
* **→ Alerts Dashboard:** No alerts in this phase.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| Order Entry Step 1 Micro fields | New | MVP-1A |
| `micro_case` table + service (profile-aware) | New | MVP-1A |
| Pending Cultures worklist (basic) | New | MVP-1A |
| Timeline section on Case | New | MVP-1A |
| Inoculation modal | New | MVP-1A |
| QC lot lookup on inoculation save | New | MVP-1A |
| Test Catalog default-protocol field | Existing | Test Catalog v2.5 |

---

## Phase 2 — Analytical Day 1: Incubation, positive detection, gram stain, preliminary identification

**MVP cycle:** MVP-1A (manual positive logging; analyzer event channel is Phase 1A+) · **Mockups:** `m-07-pending-cultures-preview-v1.html`, `m-04-case-detail-preview-v1.html`, `m-04-isolate-modal-preview-v1.html`, `m-11-critical-notifications-preview-v1.html`.

### What this phase is, in software terms

This is where Case stage progresses through `INCUBATING → POSITIVE_SIGNAL → GROWTH_DETECTED → ORGANISM_ID` and where the first **Isolate** entities are written.

* **Pending Cultures Worklist** — main work surface. Tech opens it first thing in the morning, sees every Case awaiting action.
* **Timeline Event types added:** `POSITIVE_SIGNAL`, `GRAM_STAIN`, `PLATE_READING`, `SUBCULTURE`.
* **Isolate (new entity)** — written when growth is observed.
* **Macro-enabled fields** appear for the first time in this phase: Gram Stain Observations, Colony Morphology, Preliminary ID Notes.

### Lab primer

Morning rounds. The micro tech walks to the incubator at 7:30 AM, pulls each plate or bottle, and looks. Three things can be true for each one:

**No growth.** The plate looks the same as yesterday — clear agar surface, no colonies. The tech notes "no growth at 24 hours" and puts it back in the incubator.

**Growth.** Colonies are visible. The tech now needs to figure out what's growing. The first move is a **Gram stain**: a smear of one colony, stained with two dyes that reveal whether the organism is **Gram-positive** (purple, thick cell wall — usually staph, strep, enterococci) or **Gram-negative** (pink, thin cell wall — usually enteric Gram-negative rods like E. coli, klebsiella, pseudomonas). The Gram stain also reveals **morphology**: cocci (spheres) or bacilli (rods), and arrangement (clusters, chains, pairs). This 30-second observation is the lab's first useful information for the clinician.

**Positive signal (blood cultures only).** A blood culture bottle in an instrument like BacT/Alert is monitored continuously for CO2 production. When the instrument's sensor sees rising CO2, it flags the bottle "positive" and alerts the lab — usually within 12-36 hours of incubation start. The lab pulls the positive bottle, does a Gram stain immediately (this is the _single highest-clinical-impact moment in the entire micro workflow_ — a positive gram stain from blood means probable sepsis), and subcultures the bottle's contents onto plates.

The vocabulary: **gram stain**, **colony morphology**, **subculture**, **preliminary identification**, **final identification**, **mixed flora**, **normal flora**.

A note on time: the work in this phase happens in a burst, in the morning, on a shared rhythm across all open Cases. A tech reads all twenty plates that came up overnight in about an hour. The UI needs to support that batched rhythm — one click per plate per row, not a deep dive into a Case for every reading.

### Walked-through scenario

It is 7:15 AM the morning after Olivia inoculated Carlos Martinez's blood culture. The worklist shows 14 Cases. Three of them have changed state — the BacT/Alert pushed positive signals overnight.

Olivia clicks the first positive row. She pulls the FA bottle from the BacT/Alert, does the Gram stain at her bench, looks under the microscope, and sees Gram-negative rods.

She opens the Case page, clicks "Add Isolate."

The Isolate modal opens. Olivia clicks into the Gram Stain Observations field. The hint reads "Type period for macros." She types `.gnr` and tabs out — the field expands to "Gram negative rods." She adds ", many" by hand. She types preliminary ID notes, sets Significance = "Clinically Significant," saves.

A new `micro_isolate` row is written.

Olivia then needs to **call the clinician**. A Gram-negative rod in blood from a septic patient is a critical preliminary result. She picks up the phone, gets the ER, tells them "I have Gram-negative rods growing in the blood culture you sent at 0700 yesterday. The patient should be on broad-spectrum coverage _now_."

She returns to the Case, clicks "Critical Value Notification," logs the call. The Case stage advances to `ORGANISM_ID`. Olivia subcultures the bottle to BAP and MAC plates, logs the Subculture timeline event, moves to the next positive row.

### How this phase composes

* **← Analyzer Interface:** Blood culture instruments push POSITIVE_SIGNAL events. **This is a major dependency.** Blood culture instruments use the same ASTM / HL7 protocols as chemistry analyzers but with different message structures. A new analyzer profile is needed per instrument family.
* **→ Critical Result Acknowledgment:** Phase 2 produces critical results that plug into the existing critical-result mechanism.
* **→ Patient Reports:** A preliminary report can be released as soon as the Gram stain is logged. The narrative argues for prelim release on Isolate save with Gram stain present, not on Isolate save with final ID.
* **→ Macros (Macro Library, cross-cutting):** Three macro-enabled fields appear in this phase. The Macro Library has to be in place before Phase 2 ships.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| Pending Cultures worklist (full multi-stage view) | New | MVP-1A |
| Stage badge rendering + filtering | New | MVP-1A |
| `micro_isolate` table + service | New | MVP-1A |
| Isolate modal | New | MVP-1A |
| Timeline event types: POSITIVE_SIGNAL, GRAM_STAIN, PLATE_READING, SUBCULTURE | New | MVP-1A |
| Macro Library (CRUD + runtime expansion service) | New | Phase 1A+ |
| Analyzer profile for BacT/Alert family | New | Phase 1A+ |
| Analyzer profile for BACTEC | New | Phase 1B |
| Critical-result notification on Case | Reuse | MVP-1A |
| Preliminary report release on Gram stain | New | MVP-1A |

---

## Phase 3 — Analytical Day 2: Subculture reading, final identification, AST setup

**MVP cycle:** MVP-1A (manual AST entry; analyzer-ingested AST is Phase 1A+) · **Mockups:** `m-04-case-detail-preview-v1.html`, `m-05-ast-edit-modal-preview-v1.html`, `m-04-isolate-modal-preview-v1.html`, `m-07-ast-worklist-preview-v1.html`, `m-02-breakpoint-catalog-preview-v1.html`.

### What this phase is, in software terms

This is where Isolates get their `organism_id` populated and where **AST Run (new entity)** rows are first written.

* **Final identification** writes back to `micro_isolate.organism_id`. Stage transition `ORGANISM_ID → AST_IN_PROGRESS`.
* **AST Panel** — the lab has pre-configured which antibiotics to test against which organism / specimen combinations.
* **AST Run (new)** — a row keyed by `(case_id, isolate_id, ast_panel_id, breakpoint_standard_id, method)`.

### Lab primer

By Day 2 morning, the subcultures Olivia set up yesterday have produced _isolated colonies_ — individual round colonies of bacteria, each colony descended from a single original cell. Now she can do two things she couldn't do yesterday: (1) identify the organism precisely, and (2) test its susceptibility to antibiotics.

**Identification.** The lab's choice of ID method depends on what equipment is available:

* **Manual biochemistry** (cheapest, slowest): a panel of small tubes with specific chemicals. Identifies by the pattern of reactions.
* **VITEK 2 or BD Phoenix automated identification** (mid-cost, 2 to 6 hours): the tech suspends a colony, fills an ID card, drops it in the instrument.
* **MALDI-TOF mass spectrometry** (highest capital cost, minutes): a colony is smeared on a target, analyzed by mass spec. Confidence is typically 99%+ when it works.

**AST setup.** Once an organism is identified, the lab decides which antibiotics to test. The choice depends on the organism and the specimen type. A urinary E. coli gets tested against a panel of oral antibiotics suitable for treating UTIs. The same organism from a bloodstream gets a wider panel including IV-only drugs.

AST itself uses one of three methods: **disk diffusion** (Kirby-Bauer), **MIC by broth microdilution or Etest**, or **automated AST card** (VITEK 2, BD Phoenix, Sensititre).

The **breakpoint table** — published annually by CLSI in the US and updated by EUCAST in Europe — is the lookup that converts a raw MIC or zone diameter to S/I/R.

### Walked-through scenario

It is 7:30 AM, Day 2. Olivia pulls the BAP plate. She sees \~30 pinpoint, gray, non-hemolytic colonies. The MAC plate has \~30 lactose-fermenting (pink) colonies. Probably E. coli or Klebsiella.

She picks a colony, makes a suspension, fills a VITEK 2 GN ID card and a VITEK 2 AST-GN card, drops both in the instrument.

She opens the Case page, updates Colony Morphology with `.lact, many` and sets ID Method = "VITEK 2." She clicks "Set up AST."

A `micro_ast_run` row is written with status `PENDING_SETUP`.

Around 11:15 AM, the VITEK pushes results. The ID card returns "Escherichia coli, 99.5% confidence." The AST card returns MICs for 16 antibiotics. The Analyzer Interface integration routes both to the Micro module. The Isolate gets `organism_id` populated. AST Result rows are written with interpretations computed by `BreakpointLookupService`.

Around 11:45 AM, Olivia comes back. Most antibiotics are Susceptible. Three are flagged:

* **Ampicillin: R** — expected.
* **Ceftriaxone: R** — unusual. Suggests an ESBL producer.
* **Ciprofloxacin: I** — borderline.

The Ceftriaxone R triggers a flag in the Expert Rules section (Phase 4).

### How this phase composes

* **← Reference Data:** AST Panels and breakpoint tables live in M-01 / M-02 admin.
* **← Analyzer Interface:** VITEK 2, BD Phoenix, Sensititre, MALDI-TOF each need an analyzer profile.
* **→ Expert Rules (Phase 4):** AST results emit interpretation events that the Expert Rules engine subscribes to.
* **→ Patient Reports:** AST results modify the preliminary report content.
* **← QA / QC:** AST QC is a separate workflow. Each AST card run includes QC organism results that have to be in spec.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| Isolate final ID update | New | MVP-1A |
| Organism Master (admin) | New | MVP-1A |
| Antibiotic Master (admin) | New | MVP-1A |
| AST Panel configuration (admin) | New | MVP-1A |
| Breakpoint Catalog (admin, versioning) | New | MVP-1A |
| `micro_ast_run` + AST results | New | MVP-1A |
| AST Setup modal | New | MVP-1A |
| `BreakpointLookupService` | New | MVP-1A |
| AST Worklist | New | Phase 1A+ |
| Analyzer profile for VITEK 2 | New | Phase 1A+ |
| Analyzer profile for BD Phoenix, Sensititre, MALDI-TOF | New | Phase 1B |
| AST QC integration | New | Phase 1B |

---

## Phase 4 — Analytical Day 2 (later): Expert Rules, supervisor review

**MVP cycle:** **Phase 1B** — the Expert Rules engine is not in MVP-1A or 1A+. In MVP-1A, the tech and supervisor apply rules manually via overrides in the AST Edit modal (see `m-05-ast-edit-modal-preview-v1.html`, the two highlighted override rows for Ceftriaxone-ESBL and Gentamicin-cascade are exactly the kind of overrides that Phase 1B's engine will eventually auto-apply or suggest). The Expert Review section is empty in MVP-1A; populated in Phase 1B.

### What this phase is, in software terms

Expert Rules is a configurable rules engine that runs against AST Run results and flags conditions that require manual review. Five common rule types:

* **Resistance phenotype inference** (e.g., "If S. aureus is oxacillin-R, mark as MRSA and flag all beta-lactams as R").
* **D-test required** (e.g., "If S. aureus is erythromycin-R but clindamycin-S, require a D-test before reporting clindamycin").
* **ESBL screen / confirmation**.
* **Cascade reporting** (e.g., "For urines, only report ampicillin and TMP/SMX unless both are R").
* **Intrinsic resistance verification**.

Each rule has a definition, an action, and a justification field. Rules are evaluated server-side after AST results land, and produce **flags** that surface on the Case's Expert Review section.

### Lab primer

Modern micro lab AST reports are not just "here are 16 antibiotic results." They're filtered, edited, and annotated based on a body of expert knowledge codified by CLSI as M100 _expert rules_. These rules exist because (a) raw AST results can mislead clinicians, and (b) the lab has obligations beyond reporting raw numbers.

**MRSA inference.** S. aureus that's oxacillin-R is methicillin-resistant. MRSA is resistant to _every_ beta-lactam regardless of what the lab's beta-lactam MICs show — the resistance mechanism (mecA-encoded PBP2a) means the cell wall target is altered. So the lab over-rides every beta-lactam result to R. This is non-negotiable patient safety.

**Inducible clindamycin resistance (D-test).** S. aureus that's erythromycin-R but clindamycin-S _might_ still develop clindamycin resistance during therapy. The lab tests with a "D-test": placing disks side by side and looking for a D-shaped zone. If positive, clindamycin is reported as R.

**Cascade reporting (urine).** A simple urinary E. coli that's susceptible to ampicillin should get treated with ampicillin — narrow-spectrum, cheap. Reporting carbapenems for a simple UTI encourages overuse. CLSI's cascade rule: for urine E. coli, only report the second-tier panel if the first-tier is all-R.

The expert rules layer sits between raw AST and the report.

### Walked-through scenario

It is 11:55 AM. Olivia is back at Carlos Martinez's Case. The Expert Review section shows three flags:

* **Flag 1: ESBL screen positive.** Ceftriaxone-R E. coli triggers ESBL-suspected.
* **Flag 2: Cascade — third-line drugs unlocked.**
* **Flag 3: Intrinsic resistance verification.** N/A for this case.

Olivia clicks "Review & Decide" on Flag 1. She chooses "Order ESBL confirmation." After lunch, the confirmation comes back positive. She clicks "ESBL confirmed" on Flag 1. The system applies the ESBL phenotype rule: all penicillins, cephalosporins, and aztreonam are over-ridden to R.

Olivia clicks "Mark Ready for Review." Case stage advances to `READY_REVIEW`. Dr. Adeyemi opens the Case at 3:12 PM, walks the AST results, clicks "Release Final Report."

### How this phase composes

* **← AST Results (Phase 3):** Expert Rule evaluation runs on AST Run state-change events.
* **→ Patient Reports:** The over-ride mechanism means the report shows expert-adjusted values, not raw AST values.
* **→ QMS / NCE:** A failed expert rule application generates an NCE.
* **→ Alerts Dashboard:** Critical resistance findings generate alerts.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| Expert Rule Engine | New | Phase 1B |
| Expert Rule definition admin page | New | Phase 1B |
| MRSA, D-test, ESBL, cascade, intrinsic rules (built-in) | New | Phase 1B |
| Expert Review modal | New | Phase 1B |
| AST result override mechanism (preserve original) | New | MVP-1A (manual); Phase 1B (engine-driven) |
| Supervisor review queue + final release | New | MVP-1A |
| Critical-resistance alert integration | New | Phase 1B |

---

## Phase 5 — Post-analytical: Final report, amendments, communication

**MVP cycle:** MVP-1A (Final release only; amendment workflow is Phase 1A+) · **Mockups:** `m-04-case-detail-preview-v1.html`, `m-11-critical-notifications-preview-v1.html`.

### What this phase is, in software terms

Three behaviors collapse into this phase:

* **Final report release** — Supervisor approves, system generates the patient report PDF, sends to ordering provider, locks the Case.
* **Amendment** — A released Final can be amended. The amendment is a new version of the report, with audit-trailed delta. The original is never deleted.
* **Critical-result communication audit** — Every critical phone-call notification must be logged. ISO 15189 §7.4 compliance.

### Lab primer

The final report is the lab's contractual deliverable. The clinician ordered "blood culture and susceptibility"; the lab owes them an answer. The format is constrained by what the clinician needs (organism, drug list with S/I/R, interpretation) and by what the lab has to record for compliance.

A micro final report is typically two pages: Page 1 has patient demographics, specimen info, organism(s), AST results table, interpretation. Page 2 has the full audit trail — every event in the Case timeline, every override and justification, the QC status. Most clinicians read Page 1; inspectors read Page 2.

**Amendments** are unusual but critical. Reasons to amend: the organism ID was wrong; a QC failure was caught after release; the lab received additional clinical info that changed significance; a second isolate was identified after the initial report. An amendment is a new version, not an edit. The clinician sees both with the delta clearly marked.

### Walked-through scenario

3:15 PM, Day 2. Dr. Adeyemi opens the Case in the supervisor queue. He reviews Isolate 1 (E. coli, ESBL-confirmed), the AST Run (16 antibiotics tested, five over-ridden to R via ESBL phenotype, two remain S, one I), the Critical Value Notification log, the Expert Review decisions.

He adds an interpretation comment using macros. He clicks "Release Final Report."

The PDF is generated and distributed via existing channels (email to ordering provider, print queue, FHIR push). The Case stage advances to `FINAL_REPORTED`. The Case is now read-only.

Two days later, the lab is contacted by the ER: "Was this really E. coli?" Dr. Adeyemi re-runs the colony on MALDI-TOF. MALDI returns Klebsiella pneumoniae. He clicks "Amend Report." He selects "Organism identification corrected," provides justification, triggers Release Final v2.

### How this phase composes

* **← Existing Patient Reports module:** Reuses PDF generation, distribution pipeline, FHIR push. No new infrastructure; new Jasper template registered with existing template library.
* **→ Patient chart (downstream):** Both report versions are accessible. Audit trail intact.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| Final Report modal (checklist + comments) | New | MVP-1A |
| Micro report PDF Jasper template | New | MVP-1A |
| `MicroReportService.releaseFinal()` | New | MVP-1A |
| Amendment workflow + reason capture | New | Phase 1A+ |
| Multi-version report rendering | New | Phase 1A+ |
| FHIR push for micro reports | New | Phase 1B |
| Critical-comm audit log per Case | Reuse | MVP-1A |

---

## Phase 6 — Surveillance: WHONET export

**MVP cycle:** **Phase 1B** — surveillance is out of MVP-1A and 1A+. Labs that need to submit AMR data during MVP use their existing process. **Mockups:** `m-09-whonet-export-preview-v1.html`. **GLASS direct submission is a forthcoming final step — see Phase 8 below.**

### What this phase is, in software terms

WHONET is a **read-only consumer** of completed Cases. Three surfaces:

* **WHONET Export Generator** — date range filter, specimen / organism / origin filters, output formats (CSV, TXT), deduplication.
* **Code Mapping Admin** — confirm every organism and antibiotic in use has a WHONET code; warn on unmapped.
* **Hub Subscription** — pull updates to WHONET code tables, organism / antibiotic masters, breakpoint tables.

### Lab primer

Surveillance is the lab's contribution to public health. Each lab's AMR data is one data point in a national or regional resistance picture. Aggregating across labs, a country can see "ceftriaxone resistance in E. coli is climbing in Region 4" and respond.

The export format that almost every surveillance system reads is **WHONET**. The country's reference lab aggregates from WHONET files.

The export is a flat table: one row per Isolate, with patient demographics, specimen, organism (in WHONET coding), and one column per antibiotic with the S/I/R value.

**Deduplication** is critical. A single septic patient might have three blood cultures growing the same E. coli. That's one infection, three specimens. WHO's convention: "one isolate per patient per organism per 7 days, taking the earliest."

### Walked-through scenario

It is the third day of the month. The lab's QA lead, Asha, opens `/reports/whonet-export`. She picks last month's date range. She clicks Preview. 312 isolates after dedup, down from 489 before. She notices one organism shows as "unmapped WHONET code" — Burkholderia cepacia complex. She maps it inline. Re-runs preview. Clicks Generate. The CSV file downloads. She emails it to the national reference lab.

### How this phase composes

* **← Completed Cases:** WHONET export is read-only over `micro_case`, `micro_isolate`, `micro_ast_result`.
* **← Reference data masters.**
* **← Hub Subscription:** Code tables are kept current via Hub.
* **→ National reference lab → GLASS:** Downstream of OpenELIS today via the manual WHONET file; a direct consolidated-FHIR path is the forthcoming final step (Phase 8).

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| WHONET Export Generator page | New | Phase 1B |
| WHONET CSV/TXT export format | New | Phase 1B |
| Deduplication rule | New | Phase 1B |
| Unmapped organism warning + inline mapping | New | Phase 1B |
| WHONET Code Mapping admin page | New | Phase 1B |
| Hub Subscription admin page (unified) | New | Phase 1B |
| Export from AST Worklist quick action | New | Phase 1B |
| Scheduled export (monthly auto-generation) | New | Phase 2+ |

---

## Phase 7 — Mycobacteriology / TB: the same Case Workbench, in "TB profile"

**MVP cycle:** TB cycle (after the bacterial bundle is in real use). · **Refs:** M-14 (TB Case profile), M-02 WHO-TB (critical-concentration breakpoint family). · **Reuses:** M-04 (Case / Isolate / Timeline), M-05 (`micro_ast_run`), M-08 (macros), M-11 (critical notifications), M-12 (reagent / lot linkage), and the reflex cascade.

### What this phase is, in software terms

TB is **not a separate build.** It is the **same M-04 Case Workbench, instantiated with the M-14 "TB profile."** Phase 0's resolver sets `workflow_type = MYCOBACTERIOLOGY_TB`, and the TB profile selects a different set of rendered sections, a different breakpoint family, a different culture-protocol Method, and a different reflex cascade — but the underlying entities are the bacterial ones you already built:

* **Case / Isolate / Timeline** are the same M-04 tables. The TB profile just renders TB-flavored sections on them.
* **DST results** write to the same M-05 `micro_ast_run` / AST-result tables, with `interpretation_method = CRITICAL_CONCENTRATION` instead of the clinical-MIC method. This is the key data-model reuse: a DST is an AST run interpreted against a WHO critical concentration rather than a CLSI/EUCAST clinical breakpoint.
* **Macros (M-08), critical notifications (M-11), reagent/lot linkage (M-12)** all apply unchanged.
* **Stages** progress through TB-specific values: `RECEIVED → SMEAR_DONE → MOLECULAR_DONE → CULTURE_INCUBATING → SPECIES_ID → DST_IN_PROGRESS → READY_REVIEW → FINAL_REPORTED`.

The build is mostly **profile configuration plus the TB breakpoint family**, not net-new infrastructure.

### Lab primer

TB is its own world inside micro because *Mycobacterium tuberculosis* grows extraordinarily slowly (weeks, not days), is a biohazard requiring containment, and is graded against a rule book — WHO critical concentrations — that is structurally different from the CLSI/EUCAST clinical breakpoints used everywhere else. A TB workup unfolds in distinct steps, each producing its own report:

* **AFB smear** (acid-fast bacilli smear) — a stained slide, read the **same day**, graded by the WHO scale (0, scanty, 1+, 2+, 3+). It tells you roughly how many bacilli are present — an infectiousness signal — but not the species and not drug susceptibility.
* **GeneXpert MTB/RIF Ultra** — a same-day molecular cartridge that answers two questions at once: is *M. tuberculosis* complex present (MTB detected / not detected), and is there a **rifampicin-resistance** mutation. Rifampicin resistance is the sentinel marker for multidrug-resistant TB, so a positive Ultra with rif-resistance is **clinically urgent** and fires a critical notification immediately.
* **Culture on MGIT / LJ** — liquid MGIT tubes and Löwenstein–Jensen slants, incubated for **weeks**. Culture is the gold standard and is what makes phenotypic DST possible.
* **Species ID** — once something grows, confirm whether it is **MTB-complex** (the pathogen) or an **NTM** (non-tuberculous mycobacterium — environmental, usually not treated as TB). An NTM result **off-ramps the DST cascade**: NTM does not get the TB drug-susceptibility workup.
* **DST (drug-susceptibility testing)** — for confirmed MTB-complex, test the key TB drugs. The readout is **Resistant / Susceptible at a WHO critical concentration** — a single fixed concentration per drug, pass/fail — **not** an MIC graded S/I/R. The phenotypic DST is then **reconciled with the molecular prediction** from GeneXpert (e.g., molecular said rif-resistant; phenotypic confirms). The Case is **auto-classified** from the combined drug profile: **MDR** (resistant to at least isoniazid + rifampicin), **pre-XDR**, or **XDR**.

The throughline: each step produces a **staged interim report**, because clinicians cannot wait weeks for the final. A same-day "AFB smear 2+, GeneXpert MTB detected, rifampicin resistance detected" report drives treatment immediately; the culture and DST results follow weeks later and refine it.

### Walked-through scenario

A sputum arrives ordered as "AFB Smear & TB Culture" (`workflow_type = MYCOBACTERIOLOGY_TB`). Phase 0 instantiates a `micro_case` with the M-14 TB profile, protocol `TB_MGIT_LJ`, stage `RECEIVED`.

* **Same day — AFB smear.** The tech stains and reads the slide: 2+. She logs a `GRAM_STAIN`-equivalent smear timeline event (TB profile labels it "AFB Smear," WHO grading), stage → `SMEAR_DONE`. An interim report can release now.
* **Same day — GeneXpert Ultra.** She runs the cartridge: **MTB detected, rifampicin resistance detected.** This is clinically urgent. The TB profile fires the M-11 critical-notification path (same mechanism as a positive blood-culture Gram stain). She logs the call, stage → `MOLECULAR_DONE`. A second interim report releases: smear 2+, MTB detected, rif-resistant.
* **Weeks — culture.** MGIT flags positive at, say, 18 days. Stage → `CULTURE_INCUBATING` → growth. An Isolate is written (same `micro_isolate` table).
* **Species ID.** Confirmed **MTB-complex** (if it had been NTM, the DST cascade would off-ramp here and the Case would close with an NTM report). Stage → `SPECIES_ID`.
* **DST.** A `micro_ast_run` is created with `interpretation_method = CRITICAL_CONCENTRATION`. Each TB drug returns **Resistant** or **Susceptible** at its WHO critical concentration. The phenotypic rif result is reconciled against the earlier molecular rif-resistance call. The combined isoniazid + rifampicin resistance auto-classifies the Case as **MDR**. Stage → `DST_IN_PROGRESS` → `READY_REVIEW`.
* **Final report.** Supervisor reviews and releases, same M-04 release path; the report carries the full staged history.

### How this phase composes

* **← Phase 0:** the TB profile is selected by `workflow_type = MYCOBACTERIOLOGY_TB`. A specimen needing both routine culture and TB is two Cases (one-protocol-per-case rule).
* **← Reference data (M-02 WHO-TB):** the WHO critical-concentration breakpoint family is loaded alongside CLSI/EUCAST; the TB profile binds to it.
* **↺ Reuses M-04 / M-05 / M-08 / M-11 / M-12:** Case / Isolate / Timeline, the `micro_ast_run` AST tables (with `interpretation_method = CRITICAL_CONCENTRATION`), macros, critical notifications, reagent / lot linkage.
* **→ Reflex cascade:** GeneXpert rif-resistance and the NTM off-ramp are reflex decisions; the molecular-to-phenotypic reconciliation and MDR/pre-XDR/XDR classification are cascade outputs.
* **→ Patient Reports:** staged interim reports release at smear, molecular, and final, all via the M-04 release path.
* **→ Surveillance:** completed TB Cases feed the TB-specific WHONET / GLASS export flavor (Phases 6 and 8).

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| M-14 TB Case profile (sections, stages, reflex cascade) | New | TB cycle |
| `MYCOBACTERIOLOGY_TB` wired into the Phase 0 resolver | New | TB cycle |
| WHO-TB critical-concentration breakpoint family (M-02 WHO-TB) | New | TB cycle |
| `interpretation_method = CRITICAL_CONCENTRATION` on `micro_ast_run` | New | TB cycle |
| AFB smear section (WHO grading) | New | TB cycle |
| GeneXpert MTB/RIF Ultra section + critical-notify on rif-R | New (reuses M-11) | TB cycle |
| MGIT / LJ culture protocol + multi-week incubation timeline | New | TB cycle |
| Species ID (MTB-complex vs NTM) + NTM DST off-ramp | New | TB cycle |
| Molecular-to-phenotypic reconciliation + MDR/pre-XDR/XDR auto-classification | New | TB cycle |
| Staged interim report release at each step | New (reuses M-04 release) | TB cycle |
| Case / Isolate / Timeline, AST tables, macros, reagent linkage | Reuse | M-04 / M-05 / M-08 / M-12 |

---

## Cross-cutting: The Antibiogram (cumulative susceptibility report)

**Refs:** M-13 (Antibiogram). · **Reads:** AST results across completed Cases. · **Shares:** the M-09 first-isolate de-duplication.

The **antibiogram** is the lab's clinical empiric-therapy artifact — a **cumulative %-susceptible report** (per CLSI M39): for each organism, the percentage of isolates susceptible to each antibiotic over a period (typically a year). A clinician treating a suspected E. coli UTI before culture results are back reads the antibiogram to pick the drug most likely to work locally. It is **read-only over AST results** and produces no new clinical data of its own.

It **shares the M-09 first-isolate de-duplication rule** (one isolate per patient per organism per period) so that a single heavily-cultured patient does not skew the percentages. It is, however, **distinct from WHONET / GLASS surveillance**: the antibiogram is an *internal clinical* artifact (guides this lab's prescribing), while WHONET/GLASS are *external surveillance* feeds (national / global resistance tracking). Same underlying AST data, different consumer, different de-dup framing only in that the antibiogram is computed and read locally rather than exported.

| Feature | Status | Release |
| --- | --- | --- |
| Antibiogram generator (cumulative %S, CLSI M39) | New | Phase 2+ (M-13) |
| First-isolate de-dup (shared with M-09) | Reuse | Phase 1B (M-09) |

---

## Phase 8 — Central surveillance: GLASS / consolidated-FHIR (M-15 — the last module)

The **GLASS / consolidated-FHIR central-surveillance** path is now specified in **M-15** (`m-15-glass-fhir-surveillance.md`). Each OpenELIS deployment **transforms and pushes its own finalized AMR + TB results** as FHIR (`DiagnosticReport` + per-drug `Observation`s, WHO AMR profiles) to a **consolidated FHIR server**, reusing OE's existing FHIR stack (`FhirTransformService`, `FhirPersistanceService`, `FhirConfig`, and the EQA submission pattern) plus M-09's dedup/validation. The consolidated server — the only place that sees all labs — does cross-lab first-isolate de-duplication and **generates the GLASS submission** (or a WHONET extract for a National Coordinating Centre). This is **complementary to, not a replacement for,** the manual WHONET file path (Phase 6); a deployment may use either or both. Because cross-lab aggregation stays **outside** any OE instance, single-tenancy is preserved. It is the bundle's **final** module and depends on everything above it.

---

## Cross-cutting: The Macro Library

**MVP cycle:** **Phase 1A+** — macros are not in MVP-1A. In MVP-1A, all macro-enabled fields are plain `TextArea` fields where techs type manually. Macros are the first 1A+ feature because they're a small build with disproportionate UX impact — techs will start asking for them within a week of MVP launch. **Mockups:** `m-08-macro-library-preview-v1.html`.

### What this is, in software terms

A Macro is a typing shortcut. Type `.gpc`, get "Gram positive cocci in clusters." Macros are bound to **categories** (`clinical`, `gramStain`, `colony`, `culture`, `organisms`, `ast`, `reporting`, `timeline`). Macro-enabled fields declare which category they accept; the runtime macro expansion service filters the dropdown to that category.

Architecturally, the Macro Library is **not micro-specific**. The same mechanism could later expand text in chemistry reports, hematology notes, or pathology reports. The library is a cross-cutting OpenELIS feature; the first consumer is micro.

### Lab primer

Micro generates a lot of narrative. A complete preliminary report on an infected wound might read: "Gram stain shows many gram positive cocci in clusters and many white blood cells. Beta-hemolytic colonies on blood agar, mucoid. Identification pending. Subcultured to BAP at 24 hours. Preliminary identification suggests Staphylococcus aureus."

That paragraph has six discrete phrases the tech writes hundreds of times a year. Typing them all out is slow and prone to typos. A macro library is the LIS analog of dot-phrases in clinical EHRs — the tech types `.gpc .wbc+ .bhemo .muc .pre .sub24 .saur prelim` and gets the full text in three seconds.

### What you're building, by release version

| Feature | Status | Release |
| --- | --- | --- |
| `macro_library` table + service | New | Phase 1A+ |
| Macro Library admin page | New | Phase 1A+ |
| `MacroExpansionService` (runtime) | New | Phase 1A+ |
| `MacroTextarea` / `MacroInput` Carbon primitives | New | Phase 1A+ |
| Default macros (85 across 8 categories) | New | Phase 1A+ |
| Import/Export/Bulk Edit | New | Phase 1A+ |

---

## How the phases compose — a single diagram

```
                                ┌─────────────────────────────────┐
                                │  Order Entry (existing)         │
                                │  Step 1 Program = MICROBIOLOGY  │
                                └────────────┬────────────────────┘
                                             │
                                             ▼ Sample row written
                                ┌─────────────────────────────────┐
                                │  Sample Collection (existing)   │
                                └────────────┬────────────────────┘
                                             │
              Phase 0                        ▼ post-save hook
                        ┌─────────────────────────────────────────┐
                        │  M-03 resolver reads test.workflow_type │
                        │  BACTERIOLOGY ──► M-04 bacterial profile│
                        │  MYCOBACTERIOLOGY_TB ──► M-14 TB profile│
                        │  (one profile per Case)                 │
                        └─────────────────┬───────────────────────┘
                                          │
              Phase 1   ┌─────────────────▼───────────────────────┐
                        │   Case created (RECEIVED)               │
                        │   Tech logs Inoculation                 │
                        │   Stage → INCUBATING                    │
                        └─────────────────┬───────────────────────┘
                                          │
                       ┌──────────────────┴────────────────┐
                       │                                    │
              instrument signals positive          24h elapses, tech reads plate
                       │                                    │
              Phase 2  ▼                                    ▼
                  Stage → POSITIVE_SIGNAL          Stage → GROWTH_DETECTED
                  Gram stain, Subculture           Colony observation
                  Isolate created with prelim ID
                  Critical comm logged (if blood)
                                          │
                                          ▼
              Phase 3  ┌─────────────────────────────────────────┐
                       │   ID method run (manual / VITEK / MALDI)│
                       │   Isolate.organism_id populated         │
                       │   AST Run created                       │
                       │   AST results land (auto or manual)     │
                       │   BreakpointLookupService → S/I/R       │
                       └────────────────┬────────────────────────┘
                                        │
              Phase 4  ┌─────────────────▼───────────────────────┐
                       │  Expert Rule Engine evaluates (1B)      │
                       │  Tech reviews, decides, justifies       │
                       │  Overrides written                      │
                       │  Stage → READY_REVIEW                   │
                       └────────────────┬────────────────────────┘
                                        │
              Phase 5  ┌─────────────────▼───────────────────────┐
                       │  Supervisor opens Case                  │
                       │  Releases Final → PDF generated         │
                       │  Distribution: email, print, FHIR push  │
                       │  Stage → FINAL_REPORTED                 │
                       │  (Optional amendment path → v2 report)  │
                       └────────────────┬────────────────────────┘
                                        │
              Phase 6  ┌─────────────────▼───────────────────────┐
                       │  Monthly: WHONET Export run (1B)        │
                       │  Reads completed Cases, dedupes         │
                       │  Sent to national reference lab         │
                       └────────────────┬────────────────────────┘
                                        │
              Phase 8  ┌─────────────────▼───────────────────────┐
                       │  GLASS / consolidated-FHIR central      │
                       │  surveillance (forthcoming, final step) │
                       └─────────────────────────────────────────┘

Alternate profile (Phase 0 routes here when workflow_type = MYCOBACTERIOLOGY_TB):
   Phase 7  TB profile on the SAME M-04 Workbench —
            AFB smear (same-day, WHO grade) → GeneXpert Ultra (same-day; MTB ± rif-R,
            critical notify) → MGIT/LJ culture (weeks) → species ID (MTB vs NTM;
            NTM off-ramps DST) → DST at WHO critical concentration → reconcile with
            molecular → auto-classify MDR/pre-XDR/XDR. Staged interim reports throughout.

Cross-cutting (parallel to Phases 1-7):
   Macro Library — type `.code`, expand to full text in any opted-in field.
   Antibiogram (M-13) — cumulative %S clinical empiric-therapy report, read-only over AST.
   Alerts Dashboard — critical resistance findings raise alerts.
   QA / QC — AST run QC, expert-rule audit, NCE auto-create on out-of-spec.
```

---

## Recommended phasing for the release

The narrative supports a **three-cycle slice** for bacteriology, with TB and the central-surveillance step following. Each cycle is shippable on its own.

**MVP-1A — the lab can run a culture end-to-end.**

* Order Entry Step 1 micro fields (M-03), including the `workflow_type` resolver (BACTERIOLOGY path)
* Case + Isolate + AST Run data model, basic (M-04 core; no versioning, no amendment workflow)
* Inoculation, Gram stain, Subculture timeline events (M-04)
* Isolate modal — single-version, simple update
* Pending Cultures worklist only (M-07a) — AST work shows up in this view filtered by stage
* AST Setup + AST Edit modals (M-04 + M-05) — **manual entry only**, no analyzer integration
* BreakpointLookupService (M-05) — version-aware, one CLSI + one EUCAST loaded
* Final Report release (M-04) — single Final version, no amendment workflow
* Reference data: Organism / Antibiotic / AST Panel / Culture Protocol masters (M-01)
* Breakpoint Catalog (M-02) — basic admin, manual CSV import only
* M-NFR — spec only
* Cross-cutting: M-12 Test → Reagent Linkage (parallel pre-track, lands by MVP launch)

**Phase 1A+ — productivity amplifiers built on top of working MVP.**

* M-08 Macro Library — full admin + runtime + 85 seeded defaults
* Analyzer event channel + BacT/Alert profile + VITEK 2 profile (M-04 §10)
* M-04 amendment workflow with reason capture + multi-version reports
* M-04 reidentification versioning
* AST Worklist (M-07b) — focused susceptibility queue
* Microbiology Dashboard (M-07 §4) — manager view
* M-11 Critical-Result Acknowledgment polymorphic rebuild
* Alerts Dashboard wiring (NFR + M-11)

**Phase 1B — surveillance and expert rules.**

* Expert Rule Engine (M-06) + built-in MRSA / D-test / ESBL / cascade / intrinsic rules
* WHONET Export Generator + Code Mapping (M-09)
* Hub Subscription (M-10) — unified breakpoint + organism + WHONET code updates
* Additional analyzer profiles: BD Phoenix, Sensititre, BACTEC, MALDI-TOF
* AST Run QC integration (M-04 + QA module)
* FHIR push for micro reports

**TB cycle — Mycobacteriology / TB (Phase 7).**

* M-14 TB Case profile on the M-04 Workbench; `MYCOBACTERIOLOGY_TB` wired into the Phase 0 resolver
* WHO-TB critical-concentration breakpoint family (M-02 WHO-TB); `interpretation_method = CRITICAL_CONCENTRATION`
* AFB smear, GeneXpert MTB/RIF Ultra (with critical-notify on rif-R), MGIT/LJ culture, species ID + NTM off-ramp, DST, molecular-phenotypic reconciliation, MDR/pre-XDR/XDR auto-classification
* Staged interim report release (reuses M-04 release path)

**Phase 2+ — long-tail features.**

* Antibiogram generator (cumulative susceptibility reports, M-13)
* Scheduled WHONET export (auto-monthly)
* GLASS / consolidated-FHIR central surveillance (Phase 8 — being specified now as the bundle's final step)
* Outbreak detection
* Mobile bottle barcode scanning
* Image attachments
* Fungal mold module (M-15, `MYCOLOGY` workflow_type)
* Parasitology module (M-16)
* Reference lab referral workflow

The phasing principle: **anything that's an opt-in amplifier or replacement of a simpler path defers until MVP is in real use.** Manual entry works without macros; manual blood-culture logging works without BacT/Alert integration; lock-on-Final works without amendments. The amplifiers come from feedback after MVP launch, not from guessing now.

The GLASS / consolidated-FHIR submission path (Phase 8) is **being specified as the final step of the bundle.** OpenELIS is single-tenant per deployment; aggregation across labs happens centrally outside OE, with the central consumer reading either the WHONET exports (today) or the forthcoming consolidated-FHIR feed (Phase 8) from each OE deployment.

---

## Open questions for crosswalk

These items need explicit answers from the codebase before the modular FRS bundle is locked:

1. **Where does** `micro_case` sit relative to `sample`? Same row with new columns? Sibling table with 1:1 FK? Sibling with 1:N? The 1:1 sibling pattern is the cleanest but doubles row writes. Note the one-protocol-per-case rule means one Sample can have N Cases (e.g., routine culture + TB), so a strict 1:1 Sample↔Case constraint is wrong.
2. **Where do AST results go?** New `micro_ast_result` table, or extend the existing `result` table with a discriminator column? Trade-off: separate table is cleaner schema but separates micro from existing result-validation pipeline; extending `result` reuses validation but pollutes the chemistry-shape table. The TB profile reuses this same table with `interpretation_method = CRITICAL_CONCENTRATION`, so the column must accommodate both clinical-MIC and critical-concentration interpretations.
3. **Is the analyzer integration pattern reusable for blood culture instruments?** Existing analyzer integrations target chemistry-shape one-result-per-test outputs. Blood culture pushes events, not results. Probably needs a new "analyzer event" channel parallel to "analyzer result." GeneXpert (TB molecular) is a similar event-shaped source.
4. **Where do Cases write criticals?** Existing `critical_result_notification` table is keyed on Result, not Sample. Micro criticals are typically Sample-level (preliminary call) and Case-level (per-isolate findings, e.g., GeneXpert rif-R). Schema extension needed?
5. **Reagent / lot linkage to AST cards.** Test→Reagent linkage doesn't exist today. AST cards, discs, and MGIT/LJ media are reagents with lot numbers. Either Phase 1 of Micro builds the Test→Reagent linkage (heavy lift) or it ships without lot tracking on AST runs (compliance gap).
6. **Existing organism vocabulary in OpenELIS.** Does anything resembling an organism master exist today? If yes, this is a migration; if no, it's greenfield. The organism master must also represent MTB-complex vs NTM for the TB species-ID step.
7. **Existing WHONET hooks.** Per Test Catalog v2.5, AMR-tagged tests already carry a WHONET antibiotic code field. Is there a sibling field on organism?
8. **Default culture protocols.** Where do they live? In the Test Catalog (as a default protocol field on each micro test) or as a separate Culture Protocol master? The `workflow_type` selects the protocol *family* (bacterial media vs MGIT/LJ); the specific protocol is still per-test.
9. **Patient report template registration.** New Jasper template — what's the engine's contract for new templates? TB needs staged interim templates as well as a final.
10. **Multi-language coverage.** Every new string needs an i18n key. The narrative names \~200 user-visible strings (more once TB sections are added).

---

## What this narrative is for

This doc is not a spec. It's the developer's mental model of the workflow, in their own software vocabulary, anchored to a concrete tech and supervisor walking through a real day. The FRSes (the M-\* bundle) will reference back to this narrative for "why are we doing it this way" — and devs should read this _first_, before opening any FRS.

The narrative is also a contract for the lab realism check. If a lab director reads this and says "no, that's not how blood cultures work in our lab" — or "no, that's not how a TB DST is graded" — that's a defect in the design that needs to be fixed before any code lands. The narrative is the artifact most likely to surface those defects early.
