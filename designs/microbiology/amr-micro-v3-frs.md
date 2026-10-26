# Microbiology (AMR) Module v3.2: AMR Reference Data, AST Rules, Default Panels and Suggestions

| | |
|---|---|
| **Version** | **v3.2** (draft 0.31, 2026-10-26; replaces the gallery's v3.0, draft 0.21, and the v3.1 working drafts 0.22 to 0.31). Draft 0.31 (reference metadata put to work at the bench, R-29: expected resistance shown as R without testing, D-344; a warning before testing when no breakpoint exists, D-345; the isolate's antibiotics grouped by class, D-346; MDR, XDR and PDR on the isolate in v3, D-347; LOINC on AST results and suggested analyzer mappings, D-348; the EUCAST dose beside an I, D-349; French and Spanish antibiotic, class and group names seeded from the package, D-350). Draft 0.30 (adding panels when a lab has hundreds, R-28: Add panel opens a chooser under the isolate's panels that lists only panels whose targeting matches the isolate's organism and sample type, grouped from the most specific level, with server-side search, Method and Standard filters and an All panels scope that warns when a panel is not set up for the organism, D-342; everything that opens under a row is titled, comes into view, takes focus and briefly outlines itself, and only one panel is open per isolate row, so Re-identify opens directly under its isolate, D-343). Draft 0.29 (WHONET primer review of 2026-10-24: expert rules gain a Flag action for WHONET-style quality, microbiological and clinical alerts that never change a result and are acknowledged before validation, FR-R6.6 to FR-R6.8, D-339; surveillance analysis and bulk isolate import are separate epics after v3, D-340, D-341; a Help link per section held until there is an in-app help menu and the docs exist, D-338). Draft 0.28 (sections say what they are for and when they are done, R-27: a one-sentence purpose under each heading, task names "Culture and readings" and "Report and release", a Next step in the case bar, a section is Complete when no final-release check is left for it and then starts closed with a summary, never closing while in use and reopening when new work arrives, empty states and toggletips, D-335 to D-338; a Help link per section is held until the in-app help viewer and the user documentation exist; panels on the isolate shown as tags with Add panel and Add antibiotic, no WHONET display filter, "Run details and QC", D-334). Draft 0.27 (isolates organised like WHONET in OpenELIS screens, R-26: Isolates and AST / DST merged into one section; each isolate opens with alerts, one antibiotic list across runs with WHONET codes and keyboard entry, and its runs and QC inside; worklist Isolates view; every function kept; D-329 to D-333, replacing draft 0.26's separate Record). Draft 0.25 (labs change breakpoints and concentrations, R-25: local breakpoints as a layer over the pack with a reason and history, differences listed when a new pack loads, D-326; disk contents (for example 10 or 30 µg) each with its own breakpoints, D-327; validated results keep their interpretation, D-328). Draft 0.24 (order entry, R-24: the built "What this order will open" summary kept, with case links after Save, D-323; received isolates through Tested elsewhere on the culture test row with the reported organism coded, no AST panel at order entry, D-324; blood culture bottles as container types, D-325). Draft 0.23 (organism and antibiotic pickers use the shared reference search, server type-ahead plus a search dialog, `reference-search-frs.md`, D-318 to D-322; drawn on Isolates › Identify; FR-R13.1b, AC-R-44). Draft 0.22 (CLSI Table 1 checked against M100 Ed36: panel tier 1 to 4, D-313; a Cascade rule with no condition yet, D-314; import carries trigger agents and chains Tier 3 on Tier 2, D-315; "X or Y" agents as one rule per agent with either satisfying a trigger, D-316; species limits and specimen exclusions as ordinary best-match rows, D-317; rule notes cannot be removed, FR-R2.6 aligned with D-291). Draft 0.21 (automatic alert emails need no acknowledgement, D-295; AST QC recorded through the built Reagents, QC & Controls section of Results Entry instead of a new QC list, D-293 revised). Draft 0.20 (resistant-organism alerts by email through the existing test alert rules and critical communication, R-22, D-292; AST quality control on QC strains against expected ranges, R-23, D-293; the remaining best-in-class gaps recorded under Later, D-294). Draft 0.19 (rule notes follow the same rules as every note and cannot be removed, D-291; C-13 bugs filed as OGC-1522 to OGC-1527). Draft 0.18 (one AST rules page for reporting and interpretation rules, no tabs, D-287; CLSI tier content entered by each lab from its own M100, D-288; one reporting table per lab confirmed; C-13 mapped to the existing V2 Jira slices; no sideways scrolling and a text expansion check, D-289; Dismiss reasons, undo on rule note removal, develop's admin names, D-290). Draft 0.17 (molecular resistance from any mapped test result, the method being the Method linked to the test, D-285; AMR for R data loaded as versioned seed packs in v3, central streaming updates after v3, D-286). Draft 0.16 (forms and notes open under their row, routine report reasons hidden, labels and 32 px targets, D-284). Draft 0.15 (critique fixes: one status tag with Stage as subtitle, STAT tag, sticky case bar with release actions, D-281; design notes layer and build map for builders, D-282; one meaning per tag colour, Carbon status icons, contrast fixes, Carbon modal, D-283). Draft 0.14 (second simplification pass against the V2 screens: notes on each AST run and rule notes as ordinary notes, D-275; Report tick in the AST table so R, I and S show once, D-276; status worked out from releases, one Status filter, D-277; suggestions only in the AST strip, v2 chooser unchanged, D-278; qualifier in the v2 Record reading form, D-279; Inoculate always visible, D-280). Draft 0.13 (keep the V2 UI and UX, D-274; simplification pass: one Cascade rule tests and reports; Always R and inferred agents are M-06 expert rules; disk content from the disk lot; one reporting table per lab, no profile lifecycle; no case Clinical context; suggestions computed, Dismiss on the Timeline; D-269 to D-273). Draft 0.12 (D-Q5 revised: no Culture checkbox; Inoculate adds the culture test from media links; inoculations belong to their culture test). Draft 0.11 (Case role removed, D-Q5). Draft 0.10 (D-Q5 simplified: direct and culture tests stay separate, no paired creation; partial reports release validated direct results as in v2). Draft 0.9 (status allows for referrals: Referred and Referral returned tags, D-Q6). Draft 0.8 (QA decisions Q-1 to Q-7 decided, D-Q1 to D-Q7). Draft 0.7 (Part C: V2 QA handoff of 2026-10-19 carried in, QA IDs traced to AC-Q-nn; Casey, 2026-10-19). Draft 0.6 (Clinical context in Case information only, D-267; full organism and antibiotic lists seeded, D-268; Casey, 2026-10-19). Draft 0.5 (AMR reference data brought into v3: organism taxonomy and hierarchy matcher, organism seed with synonyms and codes, breakpoint indication, disk content, SDD and WT/NWT, ECOFFs, native AMR import with boundary test vectors, antibiotic master, dosage notes, licensing gate, R-12 to R-21; Casey, 2026-10-19). Draft 0.4 (Test Rules Authoring MVP made a blocker, to be included in the v3 Jira; Casey, 2026-10-19). Draft 0.3 (reuse pass against develop: defaults on AST panel targeting, follow-ons as reflex rules with a Suggest mode, sample types instead of specimen groups, shared import pipeline, R-12 dropped as already true; Casey, 2026-10-19). Draft 0.2 added testing rules; draft 0.1 the reporting profile |
| **Date** | 2026-10-19 |
| **Author** | Casey (Director of Product), drafted with Claude |
| **Status** | Draft for review. Builds on v2, which is mostly shipped; v2 is not reopened |
| **Sources** | Casey's decisions, 2026-10-19; V2 QA handoff "Microbiology / AMR v3 redesign: QA handoff" (2026-10-19, findings A1 to A32, `tests/amr-v2.spec.ts`); AMR for R package, DIGI-UW fork v3.1.0.9004 (2026-10-17; identical to upstream `msberends/AMR` main, commit `5fc152a`); Test Rules Authoring MVP FRS (`designs/admin-config/test-rules-mvp-frs.md`); Reference Data as Configuration FRS (project doc `reference-data-config/reference-data-config-frs.md`). Real-world example only (not a seed): CPHL Port Moresby "2019 Breakpoint reporting doc for PNG" and SOP page 9.5.2.4 *Pseudomonas spp.* |
| **Checked against** | OpenELIS-Global-2 develop `f72854e` (2026-10-19): `MicroAstPanel` (`organism_group`, `specimen_type_id`), `MicroOrganism.defaultAstPanelId`, `MicroAstServiceImpl.getSetup` (`ORGANISM_DEFAULT`), `MicroBreakpointRuleDAOImpl.findBestRule`, `MicroAstPanelAntibiotic` and `MicroAstRunAntibiotic` (`tier`, `reportBehavior`), `MicroAstReading` (`overrideInterpretation`), `MicroAstOverrideEvent`, `MicroCaseActivityType` (`AST_REPORTABLE_SELECTED`), `ReflexRule` / `ReflexRuleCondition` / `ReflexRuleAction`, legacy `TestReflex` user-choice reflex (`TestReflexUserChoiceProvider`) |
| **Blocked by** | **Test Rules Authoring MVP** (`designs/admin-config/test-rules-mvp-frs.md`, draft 2026-05-11, not built; no Jira key yet). R-02, R-03 and the cascade condition (FR-R5.2) are built on its condition tree, Order action and editor. It is included in the v3 Jira as a blocking piece (see Delivery and Jira) |
| **Amends** | v2 Amendments draft 10.6 (FR-07.1, FR-07.1a, FR-07.1b, FR-07.4, FR-11.2, FR-11.5); M-01 §3 (Organisms), §4 (Antibiotics), §5 (AST Panels); M-02 (breakpoint key, interpretation categories, CSV import); M-05 (AST entry: disk content, categories, dual interpretation); M-18 (ECOFF use for environmental isolates); Reference Data as Configuration FRS §3.3 (AMR domains); M-06 Expert Rules (`CASCADE_URINE`; confirmation orders); Test Rules MVP §4 (new condition input, action target and Suggest mode) |
| **Consumes** | M-01 organisms, organism groups, antibiotics, AST panels; M-02 breakpoints and their notes; v2 Report choices (A-11), Timeline, notes (A-13), Worklist Needs attention (A-12); reflex rule engine; reference data import pipeline and Import Review |
| **Jira** | Epic [OGC-1528](https://uwdigi.atlassian.net/browse/OGC-1528) (assigned to Samuel; blocked by OGC-730 Test Rules Authoring MVP for cascade and suggestions); slicing guide `amr-micro-v3-breakdown.md` |
| **Build map** | `amr-micro-v3-build-map.md`: every screen area marked built (on develop `f72854e`, keep and change only what is listed), v2 (build to the v2 FRS) or v3 (new). The preview carries the same map as `BUILD_MAP` and `data-build` attributes. **Read it before building** (D-282). |
| **Mockup** | `amr-micro-v3-mockup.jsx` (Carbon React, developer handoff) and `amr-micro-v3-preview.html` (review preview); both carry the build map |
| **Companion file** | `png-cphl-reporting-profile-draft.csv`: the 2019 CPHL SOP transcribed into reporting rows (124 rows). A **test fixture**, not shipped rules. Its Report as and Always R columns now map to M-06 expert rules (D-270) |

---

## How to read this document

Same convention as v2: this is a delta. The V1 specs and the v2 amendments stay the reference for everything this document does not touch. Each amendment (R-01 to R-21) states the new behaviour, then a **Contradicts v2** box wherever it changes something already specced or built.

**Design rule for v3: extend what exists.** Every amendment says what it reuses. The genuinely new pieces are the reporting rules table, the suggestion strip on the isolate, starter content generated from the AMR package, and the reference data model changes the package's data needs (R-12 to R-21).

**Four parts.** Part A (R-01 to R-11) is AST testing and reporting. Part B (R-12 to R-21) brings the AMR for R reference data in properly: the organism, antibiotic and breakpoint model changes it needs, and how it is seeded. Part A's matching depends on Part B's taxonomy matcher (R-12). Part D (R-22, R-23) adds infection control alerts by email and AST quality control. Part C carries the V2 QA requirements (QA IDs R-CASE-1 and so on) with a v3 acceptance criterion for each (AC-Q-nn).

**Terms used throughout:**

- **Reporting rules:** a lab's single table of rules that decides, for each antibiotic on an isolate, whether its result starts ticked (prints) or unticked (does not print) on the patient report; a Cascade rule also suggests testing the agent when its condition is met.
- **Report default:** the starting tick for one agent. It is only a default: the technician or validator can always change it.
- **Cascade:** an agent that prints only when other agents on the same isolate meet a condition, for example "report meropenem only if ceftazidime and piperacillin-tazobactam are R".
- **Default panel:** an AST panel added automatically when an isolate is identified, picked by organism and sample type from the panel's own targeting.
- **Follow-on:** a panel or single agent that a **reflex rule** suggests (or adds) on an isolate when its trigger is met, for example "MDR extras" when ceftriaxone or gentamicin is R.

---

## Lab Context

### Current State

Every lab doing AST follows a written AST SOP. CPHL's SOP is typical: one table per organism group and site, listing the discs to set up, the zone criteria, which agents to report, conditions for testing and reporting second-line agents, results to always report as R, and the comment to add. Labs follow either CLSI or EUCAST, and adapt both to the national formulary.

In OpenELIS today:

- Each organism points to **one** default AST panel (`MicroOrganism.defaultAstPanelId`), added when the isolate is identified. The panel's own `organism_group` and `specimen_type_id` fields exist but do not pick the default.
- Each agent on a panel carries `tier` and `reportBehavior` (Always, Cascade, Suppress unless R), copied onto the run at setup. v2 FR-11.5 applies them as the Report choices default.
- Follow-on testing is a reflex rule that adds a test silently, or a search in the case chooser.
- AST panels live in their own table (`micro_ast_panel`) and never appear in order entry choosers.

### Pain

1. **Reportability sits on the panel.** An analyzer often runs more agents than the panel holds, and the same agent on two panels can get two defaults. The SOP decides by agent, organism and site.
2. **The tier model cannot say what the SOP says:** "report meropenem if CAZ R and TZP R", "nitrofurantoin only if ampicillin S", "always report Klebsiella as ampicillin R", "cefoxitin is reported as flucloxacillin", "ceftriaxone for Salmonella only from blood".
3. **The wrong default panel.** One panel per organism cannot express Urine stamp vs Gram neg stamp for the same organism, or two disc sets set up together (Pseudomonas GNR and MRGN).
4. **Follow-on testing is hidden.** "If CRO or CN R, test MDR extras" should show on the isolate as a one-click suggestion, not happen silently or need a search.
5. **Nothing is seeded** for CLSI or EUCAST labs.

### What Changes

- Default panels are picked by the **panel's own targeting** (organism or group, one or more sample types), with the same best-match logic breakpoints already use; several panels can be defaults together.
- Follow-ons are **reflex rules** that can read an AST agent's interpretation and either **suggest** a panel on the isolate (one click to add) or add it automatically.
- A lab-level **reporting table** sets each agent's starting tick and writes it into the field the report already reads; one Cascade rule both suggests a second-line test and ticks it, as the SOP's "test and report if" says. Interpretation changes (always R, inferred agents) are expert rules (M-06).
- Starter content for CLSI and EUCAST is generated from the AMR package where it can be; import goes through the shared reference data pipeline.

---

## What the AMR for R package does and does not give us

Checked on 2026-10-19 against the DIGI-UW fork, v3.1.0.9004 (2026-10-17). The fork has a single branch, `main`, at the same commit as upstream `msberends/AMR` main (`5fc152a`): DIGI has added no data of its own. Every dataset's columns, the R sources, the docs and `data-raw/` were searched for reporting, tier, cascade, selective-reporting and WHO AWaRe content.

| Need | In the package? | Use in v3 |
|---|---|---|
| Which agents to report (reportable, tier, cascade, selective reporting) | **No.** No dataset has a report, tier or cascade field. `antimicrobials` columns: `ab`, `cid`, `name`, `group`, `atc`, `atc_group1`, `atc_group2`, `abbreviations`, `synonyms`, DDDs, `loinc`. No WHO AWaRe classification either | Configured in OpenELIS; starters per R-08 |
| CLSI and EUCAST breakpoints | Yes, `clinical_breakpoints`: about 37,000 EUCAST rows and 24,000 CLSI rows, through EUCAST 2026 and CLSI 2026, with `site` (for example meningitis) | Already used by M-02; not changed here |
| Urine-only breakpoints | Yes, the `uti` flag, for **both** standards (about 1,780 EUCAST and 940 CLSI rows across all years) | Seeds "Don't report outside urine" rows in both starters |
| Intrinsic resistance | Yes, `intrinsic_resistant` (organism, antibiotic pairs from the EUCAST expected resistant phenotypes) | Backs the M-06 intrinsic verification check; Always R comes from the expected-phenotype rules (R-06) |
| Inferred and overridden results | **EUCAST only**: `data-raw/interpretive_rules.tsv`, 1,266 rules (expected phenotypes v1.2, expert rules v3.3, breakpoint-table rules v10 to 16) of the form "for organism X, if agents Y are S/I/R, then set agents Z to S/I/R" | Expected phenotypes seed "Always report as R" in the EUCAST starter; inference rules stay with M-06 |
| Reporting instructions | Only as free text in the breakpoint notes, for example "do not report benzylpenicillin susceptibility" | Shown read-only beside a reporting rule (FR-R5.5) |

**What this means.** CLSI publishes reporting tiers per organism group in M100 Table 1 (Tier 1 to 4); that content is **not** in the package and would have to be entered from M100, subject to licensing. EUCAST publishes no reporting list and leaves selective reporting to national AST committees. The package helps with *what is always R* and *what is urine-only*; whether an agent is reportable is local configuration.

---

## What v3 reuses

| Need | Already built or specced | v3 use |
|---|---|---|
| Most-specific match by organism and sample type | `MicroBreakpointRuleDAOImpl.findBestRule`: one organism, then organism group, then any; then sample type, then any. An organism has one group (`MicroOrganism.organismGroup`) | **Extended once** into the taxonomy matcher (R-12), then shared by breakpoints, default panels (R-01), reporting rules (R-02), reflex scope (R-05) and expert rules (R-06) |
| Panel targeting | `MicroAstPanel.organism_group`, `specimen_type_id` | Extended to pick defaults (R-01) |
| Default panel added on identification | `MicroAstServiceImpl.getSetup`, `panelProvenance = ORGANISM_DEFAULT` | Same code path, now returning several panels (R-01) |
| "Test and report if" | The SOP's own instruction is one rule | One **Cascade** reporting rule both suggests the test and decides the tick (R-03); no separate follow-on rule |
| Trigger then action for non-antibiotic follow-ons | Reflex engine; Test Rules MVP condition tree and Order action | Reflex rules gain an AST condition input only (R-05) |
| Suggest instead of add | Legacy user-choice reflex (`TestReflexUserChoiceProvider`) | Suggest mode on reflex Order actions (R-05); cascade suggestions use the same strip (R-04) |
| Interpretation changes | M-06 expert rules (specced); AMR package `interpretive_rules.tsv`; `MicroAstReading.overrideInterpretation` and `MicroAstOverrideEvent` | "Always R" and "report as" are **expert rules**, applied as automatic overrides (R-06); the reporting table only decides the tick |
| Report default per agent | `MicroAstRunAntibiotic.reportBehavior`, read by the report projection | Filled from the reporting table (R-07) |
| Disk content | AST setup disk lots (`ReagentLotPicker`, M-12; `AST_SETUP` inventory usage) | Content comes from the disk item picked (R-15) |
| Audit and suggestion state | Case Timeline (`MicroCaseActivity`, `AST_REPORTABLE_SELECTED`) | New activity types; a Dismiss is a Timeline entry, suggestions are not stored (R-04) |
| Versioning, import, distribution | Reference data pipeline (Preview runs Apply, Undo, run history; packs and local layers) | One reporting table per lab, no profile lifecycle; starters, imports and national packs go through the pipeline (R-09) |
| Comments on the report | External notes (reflex actions, v2 A-13) | Reporting notes are external notes; M-08 macros later |
| Not cluttering order entry | AST panels are a separate table, never in order entry choosers | No work; AC guards it (AC-R-21) |
| Needs attention list | v2 Worklist A-12 | Counts unactioned suggestions (R-04) |

---

## Overview

```
  Isolate identified ──► AST panel targeting (best match) ──► default panel(s) added
  + sample type          organism level × sample types

  Readings saved ──────► Expert rules (M-06) ──► automatic overrides: always R, inferred agents
                    ├──► Reporting table, Cascade rules ──► condition met:
                    │       agent not on isolate → Suggest agent or panel [Add]
                    │       agent on isolate     → ticked for the report
                    └──► Reflex rules (AST input) ──► other tests: Suggest or Add (CIM, Xpert XDR)

  Report choices: starting tick per agent from the reporting table; tech or validator can change it.
  Every result is stored, exported to WHONET and counted for surveillance, whatever the tick.
```

### Navigation & URL

- Default panels: Admin › Microbiology reference data › **AST panels** (existing section, new fields).
- Reporting and interpretation rules: Admin › Microbiology reference data › **AST rules**, a new section beside AST panels in the existing `sectionConfig` (D-287). One page, no tabs.
- Organisms, Antibiotics, Breakpoint standards: the existing sections of Microbiology reference data, with the Part B fields.
- Non-antibiotic follow-ons: Admin › **Reflex Tests** / Test Rules (existing page), with an "AST result" input.

---

## User Stories

- As a **technician**, I want the right disc sets added when I identify an isolate, and second-line agents or panels suggested on the isolate when the first-line results call for them, so that I add them with one click instead of searching.
- As a **lab manager**, I want to enter my lab's AST reporting SOP once, by antibiotic, organism and sample type, with "test and report if" written as one rule, so that every report follows it.
- As an **implementer** without micro training, I want to start from a CLSI or EUCAST starter loaded through the normal import, so that I do not design tiers.
- As a **technician**, I want unreported results to stay recorded and visible to me, and to see why an agent is unticked, so that I can override when the clinician needs it.
- As a **validator**, I want intrinsic resistances and surrogate results applied the same way on every isolate, so that a susceptible Klebsiella ampicillin never reaches a clinician.

---

## Amendments

**Part A. AST testing and reporting**

### R-01. Default panels from the panel's own targeting

| ID | Requirement |
|---|---|
| FR-R1.1 | An AST panel's targeting (M-01 §5.3) becomes: **Organism level** (any taxon from R-12: a species, species group, genus, family, order or Gram stain), **Sample types** (none = any, or one or more; replaces the single `specimen_type_id`), and a **Default** switch. |
| FR-R1.2 | When an isolate is identified, every active, current-version panel with Default on whose targeting is the **best match** for the isolate's organism and the case's sample type is added automatically (`panelProvenance: ORGANISM_DEFAULT`, as built). Best match uses the shared taxonomy matcher (R-12). Every panel at the best level is added, so two panels can be defaults together (Pseudomonas GNR and MRGN sets). |
| FR-R1.3 | Example: "Urine stamp", Enterobacterales, Urine, Default; "Gram neg stamp", Enterobacterales, any sample type, Default. *E. coli* from urine gets Urine stamp only; from blood, Gram neg stamp only. |
| FR-R1.4 | When nothing matches, no panel is added and the isolate shows "No default panel for {organism} from {sample type}"; the technician adds one from the chooser. On re-identification, panels already added stay and the new defaults are **suggested** (R-04), not added. |
| FR-R1.5 | `MicroOrganism.defaultAstPanelId` is kept for one release as a fallback when no panel targeting matches, then retired. On upgrade, each organism's default panel gets that organism in its targeting with Default on. |
| FR-R1.6 | **Panel agent tier is 1 to 4** (D-313). The built tier picker on the AST panel editor offers 1 to 3; it gains 4 ("On request"). Tier 4 agents start unticked, sit last on the AST run, and are ticked by hand when a clinician asks. |

> **Contradicts v2**
> **Where:** v2 FR-07.1b; M-01 §5.3 (`target_specimen_type_id` single value), AC-M01-P-05.
> **v2 said:** the organism's one default panel is added on identification.
> **v3 says:** the best-matching panels with Default on are added; several can be added; sample types are a list.
> **Build state:** built (`defaultAstPanelId`, `getSetup`). **Rework:** panel targeting fields and a best-match lookup through the R-12 matcher; `getSetup` returns a list; migration per FR-R1.5.

### R-02. Reporting rules: one table per lab

| ID | Requirement |
|---|---|
| FR-R2.1 | Each lab has **one reporting table** (no profiles, versions, Draft or Active states). Its header holds: the breakpoint standard it was written for (CLSI, EUCAST or Local) and the **default for agents with no matching rule** (Report or Don't report; seeded Report). |
| FR-R2.2 | Each rule has: **Antibiotic** (from M-01, or "(isolate)" for an isolate-level note), **Organism level** (any, or any taxon from R-12), **Sample types** (any, or one or more), **Indication** (any, or one breakpoint indication from R-14, for agents interpreted twice), **Report default** (R-03), **Condition** (Cascade only), **Add automatically** (Cascade only, FR-R3.4) and **Note** with **when** (Always, When R, When S). |
| FR-R2.3 | **Best match** uses the shared taxonomy matcher (R-12). Example: Salmonella / any / Ceftriaxone = Don't report, and Salmonella / Blood / Ceftriaxone = Report. "Sites other than urine" is an any-sample-type rule plus a Urine rule. Empty settings fall through to the next best match. |
| FR-R2.4 | Rules are edited in place. Every change is audited (who, when, before, after). Released cases keep what printed; unreleased cases take the new default only for agents nobody changed by hand. |
| FR-R2.5 | If the table's standard differs from the lab's active standard (M-02), the table and the case show a warning; it does not block. |
| FR-R2.6 | **Note**: an external note added to the agent (or the isolate for "(isolate)"), the way reflex actions add notes today. Like every note it cannot be removed (D-291); it shows while the rule's condition is met. When the M-08 macro library ships, a note can pick a macro. |
| FR-R2.7 | The rule editor shows the M-02 breakpoint note for that organism and agent, read-only, because it sometimes carries reporting advice. |
| FR-R2.8 | **Species limits** (D-317). A guideline note that limits an agent to some species of a group ("*S. aureus* only", "*E. coli* from urine only", "consider Tier 1 for these genera") is written as ordinary rows: the group row with the group default, and a species-level row that best match prefers (FR-R2.3). No restriction field. |
| FR-R2.9 | **Specimen exclusions** (D-317). "Not routinely reported from urine" or "from the lower respiratory tract" is an any-sample-type row plus a Don't report row listing those sample types. Labs pick the sample types that make up "lower respiratory tract" in their own list. |

### R-03. Report default and Cascade: one rule to test and report

| ID | Requirement |
|---|---|
| FR-R3.1 | Report default values: **Report**, **Don't report**, **Report only if R**, **Cascade**. These extend the built `reportBehavior` values (Always = Report, Suppress unless R = Report only if R, Cascade; Don't report is new). |
| FR-R3.2 | **Cascade** carries a condition built with the Test Rules MVP condition tree (blocker) and the AST predicates of R-05: for example CAZ is R AND TZP is R; CRO is R OR GEN is R; all other tested agents are R; AMP is S. |
| FR-R3.3 | **When the condition is met:** an agent already on the isolate is **ticked** for the report; an agent **not on the isolate** is **suggested** (R-04). If an AST panel whose targeting matches the isolate holds every agent that a Cascade rule with the same condition names, the **panel** is suggested ("MDR extras") instead of single agents. |
| FR-R3.4 | **Add automatically** on a Cascade rule adds the agent or panel without a click, tagged **Added by rule** with the rule's antibiotic and condition, recorded on the Timeline, never twice (v2 FR-07.4c). Off by default. |
| FR-R3.5 | The condition is evaluated on the isolate's reportable AST attempt (v2 Use for reporting) whenever a reading is saved or changed, and on validation, until someone changes that agent's tick by hand. An untested trigger agent does not meet the condition. |
| FR-R3.6 | Example, one row each: Enterobacterales / any / Meropenem / Cascade / CRO is R OR GEN is R (with Ceftazidime, Piperacillin, Amikacin on the same condition, all in the "MDR extras" panel): CRO R suggests "MDR extras, CRO R [Add]"; once the panel's results are in, the four agents are ticked. Enterobacterales / Urine / Ciprofloxacin / Cascade / NOR is R: suggests ciprofloxacin, then ticks it. |
| FR-R3.7 | **Cascade with no condition yet** (D-314). A Cascade rule may be saved without a condition, for example a CLSI Tier 2 agent with no Tier 1 agent in its row. It never ticks or suggests, so the agent starts unticked, and the AST rules page lists it under **Needs a condition** with a count in the page header. The case shows the reason "Cascade: no condition set". |
| FR-R3.8 | **"X or Y" agents** (D-316). Where a guideline says "test one of these" (cefotaxime or ceftriaxone; azithromycin, clarithromycin or erythromycin), each agent gets its own rule with the same settings; the lab keeps only the one it tests on its panel. A condition naming both ("CTX is R OR CRO is R") is met by whichever was tested (FR-R3.5: an untested agent does not meet it). No group field. |

### R-04. Suggestions on the isolate, one click to add

| ID | Requirement |
|---|---|
| FR-R4.1 | Each isolate shows a **Suggested** strip in its AST / DST section when anything is suggested: Cascade rules whose condition is met for an agent not on the isolate (R-03), reflex Suggest actions whose condition is met (R-05), and default panels not on the isolate (FR-R1.4). Each item shows the panel, agent or test, the reason ("CRO R", "Default for Enterobacterales from Urine") and **Add**. |
| FR-R4.2 | **Add** adds it on that isolate in one click with no chooser (a panel creates a run; single agents go to the supplementary run, v2 FR-07.1a; a test is added to the order), tagged **Added by {user}**, Timeline "from suggestion: {reason}". |
| FR-R4.3 | **Suggestions are not stored.** They are worked out from the rules and the current results each time the isolate is shown. **Dismiss** writes a Timeline entry; a suggestion with a Dismiss entry stays hidden until its condition stops being met and is met again (a later reading change ends the dismissal). |
| FR-R4.4 | The **Add panel** chooser is specified in R-28 (it replaces the v2 + Add test or panel chooser for AST panels, D-342): it lists the panels whose targeting matches the isolate, with **All panels** for the rest, and search covers everything. Suggestions show only in the strip on the isolate (FR-R4.1 to FR-R4.3), not again in the chooser (D-278). |
| FR-R4.5 | Worklist **Needs attention** (v2 A-12) counts isolates with a suggestion that is neither added nor dismissed. |

> **Contradicts v2**
> **Where:** v2 FR-07.1, FR-07.1a, FR-07.4; M-01 §5.4 (`tier`).
> **v3 says:** second-line testing is suggested from the same Cascade rule that decides reporting; suggestions add with one click from the strip on the isolate; the chooser stays as in v2.
> **Build state:** chooser specced in v2; tiers stored, unused. **Rework:** suggestion strip computed from rules; Dismiss as a Timeline activity type.

### R-05. Reflex rules: an AST result input for non-antibiotic follow-ons

Cascade covers "test and report" for antibiotics. Reflex rules stay for follow-on **tests** that are not antibiotics.

| ID | Requirement |
|---|---|
| FR-R5.1 | **New condition input: AST agent.** A condition can read an antibiotic's interpretation (S, SDD, I, R, and WT/NWT for ECOFF readings, R-16) on an isolate, with the `is` / `isNot` predicates and one micro predicate, **all other tested agents are R**. Scope fields: organism level and sample types (R-12). The same predicates are used by Cascade conditions (FR-R3.2). |
| FR-R5.2 | Actions are the existing Order action (a catalog test added to the order on the isolate's sample, for example "Carbapenem inactivation method" or "Xpert MTB/XDR") and notes. No new action targets. |
| FR-R5.3 | **Add or Suggest mode** on the Order action. Add behaves as reflex does today (tagged Added by rule, Timeline, never twice, v2 FR-07.4, FR-07.4c). **Suggest** puts it on the isolate's suggestion strip (R-04): the legacy user-choice reflex brought to the rule engine. |
| FR-R5.4 | Example: *P. aeruginosa*: MEM is R, then Add "Carbapenem inactivation method" with note "Refer to CPHL". |

> **Contradicts v2**
> **Where:** v2 FR-07.4; M-06 confirmation orders.
> **v3 says:** reflex rules can read AST agents and Suggest instead of Add.
> **Build state:** reflex engine built for catalog tests; Test Rules MVP specced, not built; micro not wired to reflex. **Rework:** AST condition input, Suggest mode, evaluation hook on reading save, as extensions of the Test Rules MVP. **Blocked by the Test Rules MVP** (D-259).

### R-06. Interpretation changes are expert rules (M-06)

"Always report as R" and "report as" change what an interpretation is, not whether it prints, so they live with the expert rules, not in the reporting table.

| ID | Requirement |
|---|---|
| FR-R6.1 | **Always R** (expected resistant phenotypes, for example Klebsiella ampicillin, ESCPPM ampicillin and amoxicillin-clavulanate): an M-06 rule with no condition, at any taxon level (R-12), that sets the agent's interpretation to R. |
| FR-R6.2 | **Inferred agents** (the "report as" cases: cefoxitin R means flucloxacillin and all beta-lactams R; pefloxacin screen gives ciprofloxacin for *Salmonella*; oxacillin gives penicillin and amoxicillin for *S. pneumoniae*): an M-06 rule "if agent X is S/I/R, then agent Y is S/I/R". The inferred agent Y gets its own reading on the isolate, marked "Inferred from {X}"; the reporting table then ticks Y and unticks X as for any agent. |
| FR-R6.3 | Expert rules are applied as **automatic overrides** through the built override path (`overrideInterpretation`, `MicroAstOverrideEvent` with source "expert rule" and the rule named). The measured value and interpretation stay visible to staff; a validator can revert it like any override. |
| FR-R6.4 | If the measured interpretation contradicts an Always R rule (S or I), the M-06 intrinsic verification flag fires (possible misidentification). |
| FR-R6.5 | Seeded from the AMR package `interpretive_rules.tsv` (EUCAST: 58 expected-phenotype rules, 57 expert rules, breakpoint-table rules such as "Staphylococcus: FOX R, then beta-lactams R"); labs add local rules (for example *S. marcescens* amikacin R; *Salmonella* pefloxacin to ciprofloxacin). |
| FR-R6.6 | **Flag** (D-339), a third rule action beside Set to R (FR-R6.1) and Infer (FR-R6.2): "if {condition}, flag {message}". It never changes an interpretation. Uses: unlikely results (a measured S on an expected-R pair; *A. baumannii* susceptible to a penicillin), methods not recommended for an organism (vancomycin by disk diffusion on *Staphylococcus*), important resistances to confirm, save or refer (carbapenem non-susceptible Enterobacterales), and infection control prompts. The condition uses the same editor as Cascade and inferred rules (Test Rules condition editor, D-259) and may also test the run's method. |
| FR-R6.7 | **Where a flag shows and how it clears.** A flag shows in the isolate's alerts (FR-R26.3) as a warning notification starting "Flag:" with the rule's message, as soon as the reading that meets it is saved. It joins the run's expert flags (built: instrument expert flags block validation until acknowledged), so the built **Acknowledge flags** step, with its reason, clears it before the run can be validated. The acknowledgement is written to the Timeline with the rule named. A flag emails no one; an alert email is an R-22 alert rule. |
| FR-R6.8 | **Starter flags.** Each seeded Set to R rule (FR-R6.5) comes with the flag "Unlikely result: check the identification and repeat the test" for a measured S or I; this is how the intrinsic verification flag of FR-R6.4 is delivered. Other flags are written by the lab. No predefined WHONET alert library is shipped: the WHONET AMRIE files are licensed for non-commercial use only. |

> **Contradicts draft 0.11 of this document and M-06**
> **Where:** earlier v3 drafts put Always R and Report as in the reporting profile; M-06 rule types.
> **v3 says:** both are M-06 expert rules; M-06 gains an "inferred agent" rule shape and a Flag action, and is seeded from the package.
> **Build state:** M-06 specced, not built; override path and run expert flags with Acknowledge flags built. **Rework:** M-06 rules and their seed; inferred readings on the isolate; rule flags written as run expert flags.

### R-07. Applying the reporting table on the case; overrides

| ID | Requirement |
|---|---|
| FR-R7.1 | When a run is set up or a reading is added, the reporting table's result for each agent is written into the run agent's `reportBehavior` (and the cascade decision into its tick), so the report projection and v2 Report choices (A-11, FR-11.2) read what they read today. Every result is still saved, exported to WHONET and counted for surveillance, whatever the tick. |
| FR-R7.2 | The tick for each antibiotic sits in a **Report** column of the AST / DST table, beside its reading and interpretation, with the **reason** for its starting tick under it (the rule that decided it, or "No rule: lab default Report"); an inferred agent shows "Inferred from {X}". Changing it writes the same Timeline entry as v2 Report choices (D-276). |
| FR-R7.3 | In the Report section, Report choices lists each isolate's AST / DST as **one summary line** ("{reported} of {total} antibiotics reported"), so R, I and S are not listed a second time; derived lines (resistance profile, TB classification) stay as their own rows. The print preview is unchanged (D-276). |
| FR-R7.4 | Each AST run row has a **Notes ({count})** button that opens the v2 notes panel (In Lab Only or Send with Result). A reporting rule's note (M-02 note or a rule's "When R" note) shows in the run's notes as a Send with Result note tagged **From rule**, naming the rule, **while the rule's condition is met**; if a reading change means the condition is no longer met before release, the note no longer applies and does not print. At release it is stored with the report like any other note. Rule notes follow the same rules as every note: **no one can remove or edit them** (D-291); a note that should not apply is fixed by changing the reporting rule. Send with Result run notes print under that isolate's AST results. There is no separate route for rule notes (D-275). |
| FR-R7.3 | **Overrides.** Anyone with Results or Validation rights in the case lab unit can tick or untick any agent. A manual change sticks and is recorded on the Timeline (`REPORT_CHOICE_CHANGED`: who, when, agent, from, to). No reason is required. |
| FR-R7.4 | **Reset to defaults** on the isolate returns every agent to the reporting table's default (Timeline). |
| FR-R7.5 | Electronic results (FHIR, HL7) carry the same selection as the printed report. |

> **Contradicts v2**
> **Where:** v2 FR-11.2 and FR-11.5; M-01 §5.4 (`tier`, `report_default` on panel agents), AC-M01-P-03, AC-M01-P-07; M-06 `CASCADE_URINE`, AC-M06-01, AC-M06-06.
> **v2 said:** agents start ticked per the panel's `reportBehavior`; cascade urine is an M-06 rule.
> **v3 says:** the reporting table fills the run agent's `reportBehavior`; the panel editor no longer shows Tier or Report Default; cascade is a reporting rule.
> **Build state:** `reportBehavior` built on panel and run agents. **Rework:** resolve from the reporting table at run setup instead of copying from the panel; hide two panel-editor columns; on upgrade, generate reporting rules from existing panel values through an Import Review preview (Always = Report, Suppress unless R = Report only if R, Cascade = Cascade on "any Tier 1 agent of the panel is R"); retire `CASCADE_URINE`. Keep the columns in the database for history.

### R-08. Starter content

| ID | Requirement |
|---|---|
| FR-R8.1 | **EUCAST starter**, generated from the AMR package: reporting rules (lab default Report; `uti` agents Don't report outside urine; EUCAST high-dose notes, R-20) and the M-06 expert rules of FR-R6.5. The expanded `intrinsic_resistant` table (about 308,000 pairs) is not turned into rules; it backs the M-06 intrinsic verification check. |
| FR-R8.2 | **CLSI starter**: generated `uti` rules from the package only. CLSI Table 1 tiers are entered by each lab from its own M100 through the Tier and Trigger agents columns (FR-R9.4 to FR-R9.6, D-288). **Gate:** a CLSI licence before any tier content ships (Later). |
| FR-R8.3 | Starters arrive as an **Import Review preview** (R-09) against the lab's current table: nothing changes until the lab applies them, and Undo is available. They are regenerated when the AMR package version used by M-02 is updated. |
| FR-R8.4 | Starter default panels are **not** shipped; panels and disc sets are lab-specific. |

### R-09. Import and distribution through the reference data pipeline

| ID | Requirement |
|---|---|
| FR-R9.1 | Reporting rules, AST panel targeting, expert rules and micro reflex rules are **domains of the reference data import pipeline** (Reference Data as Configuration FRS, P3 and P4): workbook sheets, Preview that runs the Apply path, the Import Review screen, run history and Undo. No bespoke CSV import and no profile lifecycle: the pipeline's run history is the version history. |
| FR-R9.2 | The companion CSV's columns, minus Report as and Always R (now expert rules), define the reporting rules sheet. |
| FR-R9.3 | National distribution (later) uses the pipeline's packs and local layers (P2): a national reference lab's rules arrive as a pack; a lab's local rules stay as local overrides and are not re-asked. |
| FR-R9.4 | **Tier column** (D-288, D-315). The reporting rules sheet takes an optional **Tier** (1 to 4). On import it fills the Report default when Report default is blank: Tier 1 Report; Tier 2 and Tier 3 Cascade; Tier 4 Don't report. An explicit Report default wins. The tier is also written to the agent on any panel whose targeting matches the rule's organism level. |
| FR-R9.5 | **Trigger agents column** (D-315). A semicolon-separated list of antibiotic codes. On a Cascade row it becomes the condition "any of these is R" (`cascade_when` ANY_R; ALL_R makes it "all of these are R"). Triggers may be Tier 2 agents, so a Tier 3 agent can cascade on a Tier 2 agent (carbapenem combinations on carbapenems). A richer condition is edited on the page afterwards. |
| FR-R9.6 | A Cascade row with no trigger agents imports as a Cascade rule with no condition (FR-R3.7). Import Review shows these rows in a "Needs a condition" group so the lab sees them before it applies. |
| FR-R9.7 | Import Review flags a trigger agent that has no rule for the same organism level ("FEP cascades on CRO, which this sheet does not include"); it warns and does not block. |

### R-10. AST rules admin page

| ID | Requirement |
|---|---|
| FR-R10.1 | **One page, no tabs** (D-287), a new section of Microbiology reference data. Top: the table header (FR-R2.1: written for, agents with no matching rule) and shared filters (organism level, sample type, antibiotic), Import, Export and History, which act on both kinds of rule. |
| FR-R10.2 | **Reporting rules**: a `DataTable` laid out like a lab SOP, grouped by organism: Antibiotic, Sample types, Indication, Report default, Condition, Add automatically, Note. Edit in place by expanding the row; the Cascade condition uses the Test Rules condition editor (D-259). |
| FR-R10.3 | **Interpretation rules** (M-06 expert rules, R-06) below it on the same page, filtered by the same organism filter: Organism, When, Action (Set to R, Infer or Flag), Then, Source (package or local), Status. They change what a result is; the reporting rules above decide only whether it starts ticked. |
| FR-R10.4 | **Preview** at the bottom: pick an organism, a sample type and S/I/R values; it shows the default panels (R-01), the interpretation rule overrides (R-06), what would be suggested (R-03, R-05), what would print and why. |
| FR-R10.5 | Import and export open the shared Import Review (R-09); one workbook carries both rule kinds as separate sheets. |

### R-11. What stays with other modules

| SOP instruction | Owner |
|---|---|
| Which discs to set up for which organism and site (Urine stamp, Gram neg stamp, GNR + MRGN) | **AST panel targeting** (R-01) |
| "If CRO or CN R, test and report MDR extras"; "if NOR R, test and report CIP" | **One Cascade reporting rule** (R-03), suggested on the isolate (R-04) |
| "Report", "Do not report", "Yes if CAZ R, TZP R", "Report VA only if AMP R" | **Reporting rules** (R-02, R-03) |
| "Always report Klebsiella as AMP R", "cefoxitin reported as flucloxacillin" | **Expert rules** (R-06, M-06) |
| "Add comment (5) if CRO R from blood or CSF" | **Reporting rule** note (FR-R2.6) |
| "If Mero R, perform CIM and refer to CPHL" | **Reflex rule** Add (R-05) with note; referral per v2 A-08 |
| Zone criteria; meningitis vs non-meningitis breakpoints; AMP 2 µg vs 10 µg | Values: **M-02**; indication and disk content keys: **v3 R-14, R-15** |
| "Work up from blood cultures, sterile sites, ICU respiratory, urine if pure" | Isolate significance (v2) |
| "Store (freeze) all CRO or CAZ R Enterobacteriaceae" | Reflex rule internal note now; storage tracking later |

---

**Part B. AMR reference data from the AMR for R package**

Facts below are from the DIGI-UW fork, v3.1.0.9004, 2026 guideline rows unless stated. Built-state checks are against develop `f72854e`.

### R-12. Organism taxonomy and one shared matcher

The 2026 breakpoints target 273 organisms at different levels: 196 species, 45 genera (for example *Pseudomonas*, *Acinetobacter*), 17 species groups (coagulase-negative staphylococci, *B. cepacia* complex), 11 subspecies, and family or order (Enterobacterales). 26 species belong to more than one of the package's 33 groups. One free-text group per organism cannot express this.

| ID | Requirement |
|---|---|
| FR-R12.1 | Each organism carries its **taxonomy**: rank, species, genus, family, order, class, phylum, Gram stain (from the package's `morphology`), oxygen tolerance, and its **parent taxa** as organism records (a genus, family and order are organisms too, so rules can target them). |
| FR-R12.2 | Organisms belong to **zero or more groups** (species groups and complexes from `microorganisms.groups`, plus lab-defined groups such as "Enterobacterales ESCPPM"). A group is itself a targetable taxon. |
| FR-R12.3 | **One shared matcher** finds the most specific rule for an organism: subspecies, species, species group, genus, family, order, class, Gram stain, any. Within the same level, a listed sample type beats any (and, for breakpoints, a matching indication and disk content, R-14, R-15). It is used by breakpoints (M-02), default panels (R-01), reflex rule scope (R-02) and reporting rules (R-04). |
| FR-R12.4 | When an organism is in two groups and both have a rule at the group level for the same agent, the smaller group wins (fewer members), then group name order; the rule editor warns when it saves a rule that creates such an overlap. |
| FR-R12.5 | The package's `rank_index` on breakpoint rows is kept as imported and used as a tie-break check: OpenELIS matching and the package must pick the same row for the test vectors of R-18. |
| FR-R12.6 | The admin organism page shows the taxonomy path and groups read-only for seeded organisms; lab-defined groups are editable. |

> **Contradicts v2**
> **Where:** M-01 §3 (`organism_group` single value); M-02 breakpoint key; `MicroOrganism.organismGroup`; `MicroBreakpointRuleDAOImpl.findBestRule`.
> **v2 said:** one group per organism; match organism, then group, then any.
> **v3 says:** taxonomy and many groups; one matcher walks the hierarchy.
> **Build state:** single group and two-level matcher built. **Rework:** taxonomy and group membership; matcher rewrite with tests; migrate each existing `organismGroup` value to a lab-defined group (or to the matching package group when the name matches).

### R-13. Organism master seed, synonyms and codes

The organism table ships empty today. The package has 103,222 taxa: 69,915 accepted, 27,042 synonyms (7,736 with a "renamed to" link), with a `prevalence` score, SNOMED codes for 10,583 species, LPSN, MycoBank and GBIF identifiers, and WHONET and other lab codes (`microorganisms.codes`).

| ID | Requirement |
|---|---|
| FR-R13.1 | **Seed set: the whole package list** (103,222 taxa, including synonyms and parent taxa), so any identification an analyzer, MALDI-TOF, VITEK, a referral or a WHONET file sends resolves without manual setup (D-268). |
| FR-R13.1a | **Pickers rank by commonness.** Organism search ranks by the package's `prevalence` (common human pathogens first), then name; synonyms are not listed as separate choices but match and resolve to the current name (FR-R13.3). A lab can hide organisms it never reports, and pin its own shortlist to the top. |
| FR-R13.1b | **Every organism and antibiotic picker uses the shared reference search** (`reference-search-frs.md`, D-318 to D-322): the field types ahead against the server (best 20 by name, synonym or code; pinned, then seen here in the last 12 months (D-322), then commonness), and **Search** opens a dialog with taxonomy, Gram stain, group, class and "on this lab's panels" filters. No picker loads the whole list. The adopters are listed in that spec; shorter lists (panels, methods, media, sample types) keep their pickers. |
| FR-R13.1b | Organism lookups are indexed on name, synonyms and codes so search stays fast on the full list. |
| FR-R13.2 | Each organism stores the package's stable **`mo` code** as its reference-data identifier, beside `whonetCode` and `oclCode`, plus **SNOMED CT** codes (used by M-15 FHIR and GLASS output), and the LPSN or MycoBank identifier. |
| FR-R13.3 | **Synonyms and renames.** A synonym is stored as an alias of its current name. Any lookup by name or code (analyzer results, WHONET import, the reference data import, the organism picker) resolves an old name to the current organism and shows "formerly {old name}". |
| FR-R13.4 | **History is kept.** When a seed update renames an organism, isolates already reported keep the name they were reported with; new isolates use the new name; surveillance exports use the code for the current name. |
| FR-R13.5 | **Other codes** (WHONET, laboratory codes) from `microorganisms.codes` are loaded as code aliases; the existing `whonetCode` stays the primary WHONET export code. |
| FR-R13.6 | Seeded organisms keep the lab's local settings (initial significance, active flag, display name override) across seed updates, per the pipeline's local layer (R-09). |

> **Contradicts v2**
> **Where:** M-01 §3 ("seed the standard list from WHONET"); Reference Data FRS §3.3 (organisms: none).
> **v3 says:** seed from the AMR package with synonyms, parent taxa and codes; WHONET codes come from the same source.
> **Build state:** organism table built, empty. **Rework:** seed pack, alias table, name resolution in the analyzer and import paths.

### R-14. Breakpoint indication, and agents interpreted twice

The package's `site` is a clinical indication or route, not a sample type: Meningitis, Non-meningitis, Oral, Intravenous, Uncomplicated urinary tract infection, Infections originating from the urinary tract, Respiratory, Skin and soft tissue, Screen, Topical. OpenELIS keys breakpoints by sample type.

| ID | Requirement |
|---|---|
| FR-R14.1 | Breakpoint rules gain an **indication** (the package's `site` values, translated), replacing `specimen_type_id` as the clinical key. Sample type stays available for local custom rules. |
| FR-R14.2 | Each sample type has a **default indication** set on the sample type admin (seeded: CSF to Meningitis; urine to Uncomplicated urinary tract infection; others none). |
| FR-R14.4 | **Interpreted twice.** When breakpoints exist for more than one indication of an agent and the sample type's default indication does not pick one (there is no case-level clinical context field, D-272) (for example *S. pneumoniae* penicillin: meningitis and non-meningitis; *P. aeruginosa* meropenem in the CPHL SOP), the reading shows one interpretation per indication: "Penicillin (meningitis) R, Penicillin (non-meningitis) S". Each is a reportable line on Report choices; a reporting rule's Indication field (FR-R2.2) sets which starts ticked, and the technician unticks the line that does not apply to the patient (for example the meningitis line for a blood isolate from a patient without meningitis). |
| FR-R14.5 | **Screen** breakpoints (for example oxacillin screen, high-level aminoglycoside screen) are used only by panels or agents marked as screen tests, never for a treatment interpretation. |

> **Contradicts v2**
> **Where:** M-02 breakpoint key (`specimen_type_id`); M-05 one interpretation per agent.
> **v3 says:** indication on breakpoints, defaulted from the sample type; two interpretations where the guideline has two, chosen on Report choices; no case clinical context field.
> **Build state:** sample type key built. **Rework:** indication column and mapping, sample type default indication, reading with more than one interpretation, report projection lines.

### R-15. Disk content

The package's `disk_dose` (for example 2, 5, 10, 30 µg; 1.25/23.75 µg) is part of each disk breakpoint. The CPHL SOP uses ampicillin 2 µg for *Haemophilus* and Enterococcus but 10 µg elsewhere, and vancomycin 5 vs 30 µg.

| ID | Requirement |
|---|---|
| FR-R15.1 | **Disk content comes from the disk picked at AST setup.** The disk inventory item (built: AST setup records disk lots through `ReagentLotPicker`, M-12, inventory usage `AST_SETUP`) carries its antibiotic and content (for example "Ampicillin 10 µg"); the run agent takes its content from the lot chosen, which also gives lot traceability. |
| FR-R15.1a | For labs that do not track disks in Inventory, a disk agent on an AST panel has a **default content**, used when no disk lot is picked. |
| FR-R15.2 | Disk breakpoints are keyed by disk content. A zone reading is interpreted only with a breakpoint for the same content; otherwise "No breakpoint for {agent} {content}". |
| FR-R15.3 | The disk content shows next to the agent in AST entry, on worksheets and in WHONET export (which already encodes content in its antibiotic column codes). |

> **Contradicts v2**
> **Where:** M-01 §5.4 panel agent; M-02 breakpoint key; M-09 export columns.
> **Build state:** not modelled. **Rework:** antibiotic and content on the disk inventory item; content on the run agent from the picked lot, or the panel default; breakpoint key.

### R-16. Interpretation categories

| ID | Requirement |
|---|---|
| FR-R16.1 | Categories become: **S**, **SDD** (susceptible dose-dependent, CLSI; 24 rows in 2026), **I**, **R**, **WT** and **NWT** (wild type and non-wild type, for ECOFF readings, R-17), and No breakpoint. |
| FR-R16.2 | The wording of I follows the standard: CLSI "Intermediate"; EUCAST "Susceptible, increased exposure". The code stays I for exports and rules. |
| FR-R16.3 | Results reported with a cap (for example "≤0.5" or ">32") are interpreted the way the package does (R-18): a capped value that cannot decide the category returns No breakpoint with "Result range does not allow interpretation". |
| FR-R16.4 | WHONET, FHIR and surveillance exports map SDD and WT/NWT to their own codes. |

> **Contradicts v2**
> **Where:** `MicroAstInterpretation` (S, I, R, No breakpoint); M-05; M-09; M-15.
> **Build state:** four values built. **Rework:** enum values, labels, export mappings, rules and reporting conditions (R-02, R-05).

### R-17. Epidemiological cut-offs (ECOFF)

2,466 of the 7,855 rows for 2026 are ECOFFs; 391 are veterinary (dogs, cattle, cats, swine, horses, aquatic, poultry).

| ID | Requirement |
|---|---|
| FR-R17.1 | ECOFF rows are imported as their own breakpoint type and give **WT** or **NWT**. |
| FR-R17.2 | **Environmental isolates** (M-18) are interpreted with ECOFFs by default, since clinical breakpoints do not apply; the lab can switch an environmental lab unit to clinical breakpoints. |
| FR-R17.3 | For clinical isolates, the ECOFF interpretation is computed alongside the clinical one and shown to staff, never printed on the patient report. Surveillance outputs that ask for it can include it. |
| FR-R17.4 | **Veterinary rows are not imported** in v3. |

### R-18. Breakpoint import from the package's native format

The current importer takes organism by display name or `group:`, antibiotic by WHONET code, and explicit S, I-lower, I-upper and R values; it drops notes, the urine-only flag, site, disk content and SDD. The package stores only S and R, and its interpretation code treats boundaries differently for CLSI and EUCAST (for example EUCAST "S ≤ 8, R > 8") and handles capped results specially.

| ID | Requirement |
|---|---|
| FR-R18.1 | The breakpoint domain of the reference data pipeline (R-09) reads the package's native columns: `guideline`, `type`, `host`, `method`, `site`, `mo`, `rank_index`, `ab`, `ref_tbl`, `disk_dose`, `breakpoint_S`, `breakpoint_R`, `uti`, `is_SDD`, `note`. M-02 owns the mapping. |
| FR-R18.2 | Conversion to OpenELIS boundaries follows the package's rules per guideline family (open or closed R boundary, SDD rows, missing R breakpoint). |
| FR-R18.3 | **Test vectors.** Each seed pack ships with expected interpretations generated by the package's own `as.sir()` over a grid of MIC dilutions and zone sizes for every row. The import runs them and refuses the pack if any OpenELIS interpretation differs. |
| FR-R18.4 | The `note` and `ref_tbl` are stored on the rule and shown in AST entry, validation and the reporting rule editor (FR-R2.7). |
| FR-R18.5 | The existing CSV format stays for **local** breakpoints (the `locally_customized` path), now with indication and disk content columns. |

> **Contradicts v2**
> **Where:** M-02 §7 CSV import; `MicroBreakpointImportServiceImpl`.
> **Build state:** importer built for the local format. **Rework:** native-format domain in the pipeline, conversion, test-vector gate.

### R-19. Antibiotic master

The package lists 506 antimicrobials (183 used by 2026 breakpoints; 139 by human clinical rows), with its own code, ATC code (375), class and ATC groups, abbreviations and synonyms, LOINC codes (255), and defined daily doses.

| ID | Requirement |
|---|---|
| FR-R19.1 | Each antibiotic stores: the package's **`ab` code** (reference-data identifier), WHONET code, **ATC code**, class and ATC groups, **synonyms and abbreviations**, **LOINC codes** (several per drug, by method), and the existing route and notes. |
| FR-R19.2 | **Seed**: the full package list (506 antimicrobials), as for organisms (D-268); pickers show the ones used by the lab's panels first, through the shared reference search (FR-R13.1b). |
| FR-R19.3 | Synonyms and abbreviations are used for name matching in analyzer results and imports, the same way organism synonyms are (FR-R13.3). |
| FR-R19.4 | **Optional WHO AWaRe** classification (Access, Watch, Reserve) as a field, loaded from WHO's published list (not in the package; licence to check). When present, it offers a third starter set of reporting rules: Access Report, Watch Cascade on any Access agent of the same class R, Reserve Report only if R. |

> **Contradicts v2**
> **Where:** M-01 §4 (antibiotic fields).
> **Build state:** name, WHONET code, class, route built. **Rework:** fields, seed, name matching.

### R-20. Dosage notes from the package

The package's `dosage` table holds EUCAST standard and high doses per agent (759 rows: 503 standard, 216 high, 40 uncomplicated UTI).

| ID | Requirement |
|---|---|
| FR-R20.1 | The EUCAST starter (FR-R8.1) adds a reporting note per agent "When this agent is I": "Susceptible, increased exposure: high dose {dose}". |
| FR-R20.2 | Dosage text is stored per EUCAST version and refreshed with the seed pack; the lab can edit or remove the generated notes. |

### R-21. Licensing gate for every seed from the package

| ID | Requirement |
|---|---|
| FR-R21.1 | The AMR package is GPL-2.0; OpenELIS Global is MPL-2.0. The existing legal-clearance residual covers **all** seeds in Part B (organisms, synonyms, groups, antibiotics, breakpoints, expected phenotypes, dosage), not only breakpoints. |
| FR-R21.2 | Until cleared, seed packs are built and distributed as **separate data packs** loaded through the pipeline at install, not committed into the OpenELIS source tree. |
| FR-R21.3 | CLSI tier content (FR-R8.2) and WHO AWaRe (FR-R19.4) have their own licence checks. |

---

**Part D. Infection control alerts and AST quality control**

### R-22. Resistant-organism alerts by email (infection control)

Labs tell the infection prevention and control team about resistant organisms the same way they tell anyone about a critical result: by email, logged and acknowledged. v3 reuses the built test alert rules (Test catalog › Alerts: `TestAlertRule` with notify email, custom email, role and acknowledgement; `AlertsSection.jsx`, `AlertRuleModal.jsx`; evaluation in `TestAlertEvaluationServiceImpl`) and the built case critical communication log (`MicroCriticalCommunication`, which already carries an `alertId`), as designed in M-11 Critical result acknowledgment. No new alert store, recipient list or screen.

| ID | Requirement |
|---|---|
| FR-R22.1 | The test alert rule gains one trigger type, **Organism or resistance profile**, offered on microbiology culture tests. Its value is an organism or organism group (matched with the shared taxonomy matcher, R-12) or a resistance profile from the existing classification (v2 A-14: for example ESBL, CRE, MRSA, VRE, MDR, MDR-TB). Several values may be listed in one rule. |
| FR-R22.2 | The rule fires **on validated results only**: when the isolate's identification is validated (organism triggers) or its AST run is validated (profile triggers). It fires once per isolate and rule; a later amendment that changes the organism or profile fires again with "Amended" in the subject. |
| FR-R22.3 | Recipients and delivery are the rule's existing settings: custom email (for example the infection control team's list), role (in-app), and acknowledgement required. Email goes through the existing email engine (OGC-439). |
| FR-R22.4 | The email never carries the patient's name or national ID. It carries the lab number, organism, resistance profile, sample type, ward or requesting facility, and the validation time, with a link to the case for staff who can sign in. |
| FR-R22.5 | Each sent alert adds a row to the case's **Critical communication** with method "Email, automatic", the recipient, the message and the linked alert, status **Sent**. An automatic email needs **no acknowledgement**: the row is the record that it went, and it counts in the critical callback reports as delivered (D-295). The rule's existing "acknowledgement required" setting stays available for a lab that wants read-back, and is off by default for this trigger. |
| FR-R22.6 | A failed send (no email configured, server error) is shown on the case row as "Not sent" with the reason, and in Needs attention, so the lab can phone instead. |

> **v2 said:** critical communication is entered by hand after a phone call.
> **v3 says:** resistant organisms reach infection control by email automatically, through the test alert rules, and the case log records it.
> **Build state:** test alert rules with email and acknowledgement are built; micro critical communication is built. **Rework:** one trigger type, its evaluation on micro validation events, the automatic critical communication row.

### R-23. AST quality control through the Results Entry QC section

A new lot of AST cards, panels or disks is tested on a reference QC strain (for example *E. coli* ATCC 25922), and every antibiotic must read within the published range before the lot is used on patient isolates; labs also repeat QC on a schedule. OpenELIS already has the pieces: the **Reagents, QC & Controls** section of Results Entry (`ReagentsQcSection.tsx`, OGC-1024 and OGC-1025) records reagent lots and manual control results through `POST /rest/qc/results` (OGC-1147); a failing control opens an NCE and holds the covered results at validation; QC strains can be control lots (`QCControlLot`, QC › Control Lots); history sits in the QC dashboard; lot QC status (`MicroReagentLot.qcStatus`) already keeps QC Pending and failed lots out of the pickers (R-CULT-2); and analyzers report run QC (`qcPassed`). v3 starts there instead of building a new QC list (D-293).

| ID | Requirement |
|---|---|
| FR-R23.1 | The AST run shows the built **Reagents, QC & Controls** section (the same component as Results Entry): the lots used, the lot QC status, and the analyzer QC state where the run came from an analyzer (read-only, as built). |
| FR-R23.2 | **Record control result** on an AST run takes a control lot (the QC strain, set up in QC › Control Lots as built) and records **one control result per antibiotic** on the panel: measured value, expected range, and Pass or Fail computed from the range. This is the one extension to the built manual capture, which today records a single measured and expected value. |
| FR-R23.3 | The **expected range** is filled from a **QC range** domain of the reference data packs (R-09): QC strain, antibiotic, method, disk content, guideline and version, low, high. EUCAST QC tables ship in the EUCAST pack (subject to R-21); CLSI ranges are entered by the lab from its own M100, as for the tiers (D-288). |
| FR-R23.4 | A failing control behaves as built: it opens an NCE and holds the covered results at validation until a passing repeat is recorded. A passing control on a lot in QC Pending sets the lot's QC status to Passed, so the lot appears in the pickers. |
| FR-R23.5 | How often a control is needed (each new lot, a schedule, or every run) is the per-test control policy of the Runs model (Test Catalog QC Targets, OGC-1200), not a new micro setting. |
| FR-R23.6 | QC results are QC records, never isolates, so they never reach antibiograms, WHONET, GLASS or surveillance counts. |

> **v2 said:** lot QC status and analyzer QC state only.
> **v3 says:** manual QC strain results per antibiotic through the Results Entry QC section, with expected ranges from the packs.
> **Build state:** Reagents, QC & Controls section, `/rest/qc/results`, control lots, NCE hold and lot QC gating are built. **Rework:** one control row per antibiotic, the QC range domain, the lot status update on pass.

### R-24. Order entry: received isolates through Tested elsewhere

Order entry is the stepped Enter Order on develop (`ClinicalOrderEnter.jsx`, built to Clinical Order Entry v4), with the v2 microbiology rules (v2 FR-02.3 to FR-02.13). v3 changes little.

| ID | Requirement |
|---|---|
| FR-R24.1 | **The live summary stays as built** (D-323). The v2 "What this order will open" panel (v2 FR-02.3b, D-190) is on develop as `MicroOrderPreview.jsx` over `POST /rest/microbiology/order-preview`, which applies the save's own routing rules on the server, so it stays in step with v3 without extra work. v3 adds one line to it: for a received isolate, "ISO-1 reported as {organism}" when a reported organism is entered (FR-R24.4). |
| FR-R24.2 | **After Save**, the success notification lists the cases the save opened, one line each with a link to the case: "{test}: case {case} in {lab unit}", so reception can go straight to them. It comes from the save response; nothing new is computed. |
| FR-R24.3 | **Blood culture bottles are container types, not sample types** (D-325). Aerobic, anaerobic and paediatric bottles are container types of the one sample type Blood (culture) (v4 container types). So v2 FR-02.4, one case per order, sample type and lab unit, groups the bottles of a set on its own, and the v2 FR-02.4a exception "whatever their sample type" is no longer needed. Set number, container and body site stay on each bottle's sample row (v2 FR-02.4a, D-192; built as `CultureBottleFields.jsx`), wherever the bottle is recorded: at Enter Order when it arrives collected, otherwise at Collect. The bottle's container list moves from the vector sample-container dictionary it reads today to the v4 container types. |
| FR-R24.4 | **Received isolates use Tested elsewhere on the culture test row** (D-324; v4 FR-B20; v2 FR-02.13). Reception orders the generic culture test on the Isolate sample and chooses **Mark tested elsewhere** in the row's overflow menu. The row then asks for the performing laboratory (Organizations list, required) and the **reported organism** (optional), picked with the shared reference search (FR-R13.1b), so it is coded and synonyms resolve. Today the reported value is free text (`TestedElsewhereFields.jsx`, a `TextInput`); for a test whose result is an organism it becomes the reference search field; for other tests it stays as built. "Received at {laboratory}" stays as v2 FR-02.13a. |
| FR-R24.5 | **No AST panel at order entry** (D-324, D-258, AC-R-21). Reception never orders an AST panel, the lab's own or the sender's. The lab's panels are added on the case (default panels, R-01; suggestions, R-04). The sender's AST is entered on the case in AST / DST as a Tested elsewhere panel (v2 FR-02.13b, FR-06.3); v2 FR-02.13b's option to order it at reception is withdrawn. |
| FR-R24.6 | The case opens with **ISO-1** holding the reported organism as **Reported identification** (v2 FR-02.13). Because the reported organism is coded, ISO-1's default AST panel can be suggested at once from it (R-01, R-04, reason "Reported by {laboratory}"), before the lab's own identification; it is never added automatically from a reported organism. |

> **Contradicts v2**
> **Where:** v2 FR-02.4a ("whatever their sample type"); FR-02.13 (example orders an AST panel); FR-02.13b (sender's panel ordered at reception).
> **v3 says:** the built live summary stays, plus links to the opened cases after Save; bottles are container types; received isolates carry the sender's organism on the culture test row through Tested elsewhere, coded; AST panels only on the case.
> **Build state:** on develop `f72854e`: stepped Enter Order, routing (`MicroOrderRoutingServiceImpl`), the live summary (`MicroOrderPreview.jsx`, `/rest/microbiology/order-preview`), Tested elsewhere with an Organizations picker and a free-text value (`TestedElsewhereFields.jsx`), and culture bottles with set number and container (`CultureBottleFields.jsx`). **Rework:** a reported-organism line in the live summary and case links in the save notification; an organism value on Tested elsewhere through the reference search; bottle containers from the v4 container types.

### R-25. Lab changes to breakpoints and disk content

Labs change breakpoints and test concentrations to follow national guidance, a newer guideline than the loaded pack, or their own validated methods (Mohamed, 2026-10-23). Develop already lets an admin add or edit a breakpoint rule; editing an imported row turns it into a local row (`locallyCustomized`), and a later import refuses to touch it. v3 keeps the lab's value but never loses the pack's.

| ID | Requirement |
|---|---|
| FR-R25.1 | **Local breakpoints are a layer over the pack** (D-326). A lab breakpoint has the same key as a pack row (standard, organism level, antibiotic, method, indication, sample types, disk content) and its own S, SDD, I and R values. Saving one never edits the pack row. **Change** on a pack row opens the editor prefilled with the pack values; **Add local breakpoint** covers a key the pack does not have. |
| FR-R25.2 | **Which value interprets.** Best match (R-12, FR-R2.3) chooses the most specific row from pack and local rows together; at the same specificity the local row wins. A local row can be switched off, which returns that key to the pack value. |
| FR-R25.3 | **Reason and history.** Every add, change or switch-off asks for a reason (required) and is kept in the rule's history: who, when, the values before and after, the reason. History is shown on the rule and in the AST rules History (FR-R10.1). |
| FR-R25.4 | **Visible everywhere it matters.** The breakpoint list shows a **Local** Tag with the pack value beside the lab's value. In AST entry and validation, the interpretation's source reads "{standard}, local: {reason}" on hover, so the validator knows the result did not come from the published table. Local rows are listed in the report's breakpoint reference as "{standard} (local changes)". |
| FR-R25.5 | **New pack version.** Import Review (R-09) lists every local row whose pack value changed in the new version ("Pack now 2/4; local 1/2, reason: national guideline 2025"), each with **Keep local** or **Use pack value**; nothing changes silently. This replaces today's import refusal for locally customized rows. |
| FR-R25.6 | **Test vectors stay valid.** The pack's test vectors (FR-R18.3) run against pack rows only, so local rows never make a pack fail. Saving a local row runs a boundary check on its own values (S below R, an I range between them, units matching the method) and refuses inconsistent values. |
| FR-R25.7 | **Results already validated keep their interpretation.** A change applies to readings saved or edited after it; unvalidated readings on open runs are re-interpreted on the next save, with a Timeline entry naming the change. Listing past results that would now differ stays in Later (D-294). |
| FR-R25.8 | **Upgrade.** Each rule develop marks `locallyCustomized` becomes a local row: over the matching pack row when one exists, otherwise a local rule. Its history starts with "Carried over from before v3". |
| FR-R25.9 | **Disk content and its breakpoints** (D-327). Labs choose the disk content they use per antibiotic (for example 10 or 30 µg), and each content has its own breakpoints. The antibiotic's breakpoint list shows one row per content (pack and local), so a lab using a content the pack does not cover, or a different breakpoint for a content it does, adds or changes that row (FR-R25.1). The disk lot carries the content and the panel agent has a default content (R-15); a zone is interpreted only with a breakpoint for the same content (FR-R15.2). |
| FR-R25.10 | **Who.** Adding, changing or switching off a local breakpoint or a panel agent's default disk content needs the new privilege `micro.breakpoint.local` (Microbiology lab manager by default; administrator). Viewing stays as today (Admin › Microbiology reference data). |

> **Contradicts develop**
> **Where:** `MicroBreakpointAdminServiceImpl.saveRule` (editing a seeded row clears `seeded` and sets `locallyCustomized`); `MicroBreakpointImportServiceImpl` (refuses rows where a locally customized rule exists).
> **v3 says:** local rows sit over pack rows with a reason and history; a new pack lists the differences for the lab to decide; each disk content has its own breakpoints.
> **Build state:** local add and edit built, without reason or history. **Rework:** local layer and best match across both; reason, history and Local Tag; Import Review differences; breakpoints keyed by disk content (R-15); privilege.

### R-26. Isolates organised like WHONET, in OpenELIS screens

Many microbiologists learned AST in WHONET, and Mohamed asked that the case feel familiar to them (2026-10-23). WHONET organises everything around the isolate: one form per isolate with the organism, then one list of antibiotics where a zone or MIC is typed and its interpretation appears at once, alerts beside it, and a database view with one row per isolate ([WHONET data entry tutorial](https://whonet.org/WebDocs/WHONET%203.Data%20entry.html); [WHONET for GLASS manual](https://whonet.org/WebDocs/WHONET_for_GLASS.English.pdf)). v3 takes that organisation and keeps OpenELIS's components and workflow: Carbon tables and notifications, rows that open in place, the case, the worklist and validation (D-329). Every v2 and v3 function stays; some move inside the isolate.

| ID | Requirement |
|---|---|
| FR-R26.1 | **One section, "Isolates and susceptibility"**, replaces the separate Isolates (v2 section 5) and AST / DST (section 6) sections. The case bar's section links follow. Requirements elsewhere that say "the AST / DST section" mean the isolate's panels row (FR-R26.4a) and its Run details and QC block (FR-R26.6). |
| FR-R26.2 | **Each isolate is a row that opens in place** (Open, Close; D-284), with its row actions as built (Re-identify, Log critical, Print label, Notes). The first isolate opens by default. Opened, it shows, in order: alerts, its panels, the antibiotic list, entry of new results, and Run details and QC. |
| FR-R26.3 | **Alerts at the top of the isolate**, as Carbon inline notifications (D-332): expert rule findings (R-06), including Flag rules (FR-R6.6, D-339), cascades met (R-03), resistance profiles with the alert email they send on validation (R-22), QC out of range (R-23), differences from a sender (v2 FR-02.13c), and S, I or R entered without a measurement. Apart from Flag rules, they are findings OpenELIS already works out. The suggestion strip (R-04) sits at the top of the section with Add and Dismiss, as specified. |
| FR-R26.4 | **One antibiotic list per isolate, across all its runs** (D-330). One row per antibiotic: name, with its WHONET code under it in small text (antibiotic, guideline N or E, method D, M or E, disk content: CRO_ND30; built from `MicroAntibiotic.whonetCode`, the run's guideline and method, and the disk lot); the value; the interpretation; **From** (a Tag naming the panel or run the value came from: VITEK 2, Enterobacterales disk diffusion supplement, Supplementary, Sender; with a toggletip, FR-R27.6); and the **Report** tick (FR-R7.2). When two runs tested the same antibiotic, the run marked Use for reporting gives the row and the other shows under it. Every row comes from a panel on the isolate or from Add antibiotic: there is no display filter (D-334). Antibiotics of a panel with no results yet are listed as untested rows marked "not started". |
| FR-R26.4a | **Panels on this isolate**, a row above the list (D-334): one Tag per AST panel on the isolate with its run state ("VITEK 2 AST-N405: Run 1, results in"; "Enterobacterales disk diffusion supplement: Not started"); **+ Add panel** opens the panel chooser for this isolate directly under this row (R-28); **+ Add antibiotic** picks one antibiotic from the lab's list and adds it to the isolate's supplementary run (v2 FR-07.1a). Accepting a suggestion (R-04) adds a panel Tag and its antibiotics as untested rows. With no panel yet: "None yet. A default panel is added when the isolate is identified." "Panel" always means an AST panel; WHONET's Panel display choice is not used. |
| FR-R26.5 | **Entering new results in the list, as in WHONET** (D-331). "Enter new results as" Disk diffusion, MIC or Etest; untested rows take a value; **Enter** moves to the next row. Off-scale MICs are typed "<=0.5" or ">64" (qualifier, D-Q7); a zone below 6 mm is stored as 6; S, I or R typed without a measurement is accepted, shown with an asterisk and flagged. The interpretation appears as the value is typed (lab breakpoints for that organism, method, sample type and disk content, R-15, R-25). **Save results** writes them as readings on the isolate's manual run for that method, creating it when needed (panel and standard as v2 FR-07.x). Values from an analyzer are changed with Record reading in Run details and QC, as built. Saving never validates. |
| FR-R26.6 | **Run details and QC** (closed by default; opens by itself when Add panel is used) holds everything else the AST / DST section held, for this isolate: the panels table with who added each panel and why, run setup (method, standard, entry mode, analyzer, card, lots, disk lots), Reagents, QC & Controls (R-23), the per-run readings with Record reading, overrides and expert sources, attempts and Use for reporting, sender differences and their acknowledgement, the resistance profile, molecular resistance (D-285) and run notes. Nothing is removed. |
| FR-R26.7 | **Worklist "Isolates" view** (D-333), beside Cultures and AST: one row per isolate with lab number, isolate, organism, specimen, location and date, the lab's antibiotics as columns showing S, I or R, and status; filters for organism, "Resistant to" an antibiotic and specimen dates; sortable; a row opens the case at that isolate. It shows interpretations only and counts nothing for surveillance; WHONET export stays as built. A wide table scrolls inside its section (D-289). |
| FR-R26.8 | **Organism** is picked with the reference search everywhere (FR-R13.1b), so WHONET organism codes ("kpn", "eco") work in Identify. |

> **Contradicts v2**
> **Where:** v2 case sections 5 Isolates and 6 AST / DST (FR-06.x, FR-07.x); D-274 (keep the v2 screens), in part.
> **v3 says:** one section organised per isolate: alerts, panels as tags, one antibiotic list across runs with WHONET codes and keyboard entry, and the run details and QC inside the isolate; plus an Isolates view on the worklist.
> **Build state:** Isolates and AST / DST built as separate sections. **Rework:** merge into one section; the consolidated list and in-list entry; alerts as notifications; the panels row; Run details and QC as the isolate's inner block (moves built components, does not rewrite them); worklist Isolates view (new). Needs re-QA of the case's isolate and AST areas.

### R-27. Each section says what it is for and when it is done

Users new to the case, and WHONET users in particular, could not tell what each numbered section was for, which one needed them next, or when a section was finished (Casey, 2026-10-26). R-27 adds that guidance with built parts only: the readiness check behind Release final (the built readiness endpoint's blockers, such as CULTURE_OUTCOME_REQUIRED, ISOLATE_REQUIRED, CLINICAL_FIELD_REQUIRED, PROGRAM_REQUIRED, CRITICAL_FOLLOW_UP_REQUIRED) decide what is complete, so nothing new is calculated (D-337).

| ID | Requirement |
|---|---|
| FR-R27.1 | **A one-sentence purpose under every section heading** (D-335), in the section body, as body text (not helper text). Texts in Localization (`micro.intro.*`). Sections: Incoming results, Case information, Initial testing, Referral point, Culture and readings, Isolates and susceptibility, Additional testing, Critical notifications, NCE, Report and release, Amendment, Timeline. |
| FR-R27.2 | **Task names for two sections** (D-335): "Culture" becomes **Culture and readings** and "Release" becomes **Report and release**. The case bar's section links use the same names. Section numbers stay as built. |
| FR-R27.3 | **Next step in the case bar** (D-336), before Release partial and Release final: "Next:" and a link that scrolls to the section. Order: (1) "Place {count} incoming results" when results are waiting; (2) otherwise the first unmet final-release check, worded as the readiness blocker's message, linking to the section it belongs to; (3) otherwise "Validate the AST run" while an AST run on the case is unvalidated; (4) otherwise "Release the final report" until the case is Final. Nothing is shown on a Final case with nothing left. The link is never a button and does nothing but move to the section. |
| FR-R27.4 | **When a section is Complete** (D-337): Incoming results when nothing is waiting; Case information when no CLINICAL_FIELD_REQUIRED or PROGRAM_REQUIRED blocker is left; Initial testing when every direct test has a result; Culture and readings when no CULTURE_OUTCOME_REQUIRED blocker is left; Isolates and susceptibility when no isolate or AST blocker is left and every AST run is validated; Report and release when the case is Final. Other sections (Referral point, Additional testing, Critical notifications, NCE, Amendment, Timeline) have no Complete state. A Complete section shows a green "Complete" Tag beside its heading. |
| FR-R27.5 | **How Complete sections collapse** (D-337): when the case opens, a Complete section starts closed with a one-line summary under the heading (for example "Bacterial culture: Growth (received isolate)", "ISO-1 Klebsiella pneumoniae · AST validated", "None waiting."). A section the user has opened never closes by itself, even when it becomes Complete while open. A Complete section loses its Tag and opens when new work arrives for it: an incoming result, a new isolate or panel, a new culture reading, or an amendment opened. Every section header is keyboard operable (Enter or Space) with `aria-expanded`. |
| FR-R27.6 | **Empty states and term explanations** (D-338). Empty sections say what will appear and how: Incoming results "None waiting. Results that arrive for tests not on this case appear here to be placed."; Isolates "No isolates yet. Add one when a culture grows."; panels row "None yet. A default panel is added when the isolate is identified." Terms that WHONET and new users read differently get a Carbon Toggletip (an "i" button, opened by click or keyboard, closed with Escape): **From** (the panel or run a value came from), **Report** (the tick that decides what prints, starting from the reporting rules), and **Cascade** (in the cascade alert). |

> **Contradicts v2**
> **Where:** v2 case section names "Culture" and "Release"; v2 sections open or closed by fixed defaults.
> **v3 says:** task names, a purpose sentence per section, a Next step, Complete sections that start closed and reopen when new work arrives.
> **Build state:** sections built with fixed open defaults; readiness endpoint built and used by Release final. **Rework:** front end only: section header (Tag, summary, keyboard), case bar Next step from the readiness response, empty states, Toggletips. No server change.

### R-28. Adding panels when the lab has hundreds, and keeping what opens in view

A lab's panel catalog grows to hundreds of AST panels: analyzer cards, disk sets per organism group and sample type, confirmation panels, EUCAST and CLSI variants, TB DST sets. Each panel already carries **targeting** in its metadata: an organism level (species, species group, genus, order or Gram stain) and sample types, plus Default (R-01; loaded with the built panel loader). The chooser uses that targeting to show the few that fit; nothing new is stored.

Separately, Casey found that Re-identify opened far down the page, under the open isolate, so it was unclear what had happened (2026-10-26). Everything that opens in place now behaves the same way.

| ID | Requirement |
|---|---|
| FR-R28.1 | **Where it opens.** **+ Add panel** on the isolate's panels row (FR-R26.4a) opens the chooser directly under that row, inside the isolate. The Add panel button in Run details and QC opens the same chooser in the same place. The chooser replaces the v2 test and panel chooser for AST panels (D-342); Additional testing keeps the standard chooser. |
| FR-R28.2 | **Context.** Title "Add AST panels to {isolate}" with the organism, sample type and breakpoint standard under it, and Close. |
| FR-R28.3 | **For this isolate (default scope).** Only panels whose targeting matches the isolate's organism through the shared matcher (R-12) and whose sample types are empty or include the case's sample type. They are grouped by targeting level from the most specific to the broadest ("For *Klebsiella pneumoniae* complex", "For *Klebsiella*", "For Enterobacterales", "For Gram-negative"); within a group, Default panels first, then by name. The scope label shows the count. Suggestions from reporting rules stay in the strip and are not repeated here (D-278). |
| FR-R28.4 | **All panels.** The second scope searches the whole catalog, with the total in its label ("All panels (214)"). Rows that match the isolate come first. A panel not targeted at the organism says "Not targeted at {organism}. Some antibiotics may have no breakpoint for it."; a panel set up for other sample types says "Set up for {types}, not {sample type}." Both can still be added (the built organism mismatch warning then applies on the run). |
| FR-R28.5 | **Search and filters.** Search panels (name, code, or an antibiotic the panel contains), **Method** (disk diffusion, MIC broth, Etest, analyzer card, MGIT, phenotypic test) and **Standard** (CLSI, EUCAST, WHO), all applied on the server. Any search or filter turns the grouped view into one ranked list with "Showing {shown} of {total}", 20 per page with Show more. Nothing loads the whole catalog. With nothing matching in For this isolate: "No panel set up for this isolate matches." with a link to search all panels. With no targeted panel at all: "No panel is set up for {organism} from {sample type}. Choose All panels to pick any panel." |
| FR-R28.6 | **Each row**: a checkbox, the panel name, a Default Tag when it is a default at its level, "On {isolate}" (checked and disabled) when already on the isolate, and a line with method, standard, number of antibiotics and the targeting ("For Enterobacterales, Urine"). **Antibiotics** expands the row to list its antibiotics. Several panels can be picked; the button says "Add panel" or "Add {count} panels". |
| FR-R28.7 | **After Add.** The chooser closes; the new panel Tags on the isolate are outlined briefly; a success notification says "Added {panels} to {isolate}. Their antibiotics are listed below as not started."; their antibiotics join the list as untested rows (FR-R26.4). Each panel becomes its own run (as built) and the Timeline records who added it. |
| FR-R28.8 | **One open panel per isolate row** (D-343). Open, Re-identify (or Identify) and Notes on an isolate row each open directly under that row, and opening one closes the others on the row. Re-identify therefore never opens below the isolate's antibiotic list. The row's buttons carry `aria-expanded`. |
| FR-R28.9 | **Everything that opens in place** (Identify, Re-identify, Notes, Add panel, Record reading, and the forms of D-284) has a title naming the action and the record ("Re-identify ISO-1", "Notes on ISO-1") with a one-line context under it (for Re-identify: the current organism and ID method), and Close. When it opens it scrolls into view only if it is not already visible, leaving it below the sticky case bar; keyboard focus moves to its title; a 2 px outline shows for about 1.5 seconds (no animation with reduced motion). Closing returns focus to the button that opened it. |
| FR-R28.10 | **Re-identify says what it changes**: "Panels and results already on {isolate} stay. Default panels for the new organism are suggested, not added, and interpretations are checked against it." (FR-R1.4). |

> **Contradicts v2**
> **Where:** v2 FR-07.1a (the standard test and panel chooser in AST / DST); D-284 in part (forms opened below the table).
> **v3 says:** an AST panel chooser driven by panel targeting, opened under the isolate's panels; one titled panel open per isolate row, scrolled into view with focus.
> **Build state:** chooser and Identify form built; panel targeting fields come with R-01. **Rework:** the chooser (server endpoint for panels by isolate with paging, search and filters); the shared expand behaviour on isolate rows and other in-place forms.

### R-29. Reference metadata put to work at the bench

A review of the AMR package's datasets against this document (2026-10-26) found metadata that v3 loads but does not use to help the technologist. R-29 uses it. Nothing here adds reference data; every item reads what R-12 to R-20 already seed. Two other ideas from the review were not taken into v3: an identification plausibility check from shape, oxygen tolerance and how common the organism is, and a blood culture contaminant prompt.

| ID | Requirement | Package data |
|---|---|---|
| FR-R29.1 | **Expected resistance is not tested** (D-344). When an antibiotic on the isolate's panels is an expected resistant phenotype for the identified organism (an Always R rule, FR-R6.1), its row shows R, "Expected R, no test needed" in place of the value field, and "Expected resistant phenotype" under the interpretation. It has no input, Enter skips it, and it reports as R through the rule, as built. The panel chooser says which of a panel's antibiotics will not be tested ("Amoxicillin, Ticarcillin: expected R for *Klebsiella pneumoniae*, not tested"). Each Always R rule has **Skip testing** (on by default); a lab that tests such agents on purpose (for example to check an identification) turns it off for that rule, and the row is then an ordinary untested row whose S or I raises the Flag of FR-R6.8. An antibiotic already measured (by an analyzer) keeps its value; the rule and flag apply as built. | `intrinsic_resistant`; expected phenotypes in `interpretive_rules.tsv` |
| FR-R29.2 | **No breakpoint, said before testing** (D-345). For each untested row, Add antibiotic option and panel in the chooser, the server checks whether a breakpoint exists for the organism (through the matcher, R-12), the guideline in use, the method and disk content (R-15), and the indication (R-14). Where none exists, it says so with what to do instead: "No disk breakpoint for colistin. Test by broth microdilution (MIC)."; "No CLSI breakpoint for Klebsiella (only E. coli from urine). Result will have no interpretation." Add antibiotic labels such options "(no breakpoint for this method)". The warning never blocks; the built no-breakpoint warning after a reading stays. Where another method has a breakpoint, the message names it. | `clinical_breakpoints` (`mo`, `method`, `disk_dose`, `site`, `guideline`) |
| FR-R29.3 | **Antibiotics grouped by class** (D-346). The isolate's antibiotic list is grouped under class headings (Penicillins, Beta-lactam/beta-lactamase inhibitor combinations, Cephalosporins, Carbapenems, Aminoglycosides, Fluoroquinolones, Folate pathway inhibitors, Polymyxins and so on), in a fixed class order, then by the panel's agent order within a class. Non-antibiotic tests on the run (ESBL test) sit last under "Other tests". Keyboard entry follows the displayed order. Class names are translated (FR-R29.7). | `antimicrobials` `group`, `atc_group1`, `atc_group2` |
| FR-R29.4 | **MDR, XDR and PDR on the isolate** (D-347). A line at the top of the isolate: "Resistance [MDR] Non-susceptible in {n} of {m} antibiotic categories tested", with a toggletip giving the definitions. Categories follow Magiorakos et al. 2012 for the organism group (Enterobacterales, *S. aureus*, *Enterococcus*, *P. aeruginosa*, *Acinetobacter*), mapped from the antibiotic class metadata in a category table the lab can review. Expected resistance is not counted. MDR is non-susceptible (I or R) in at least 3 categories; XDR and PDR are given only when every category for the group was tested, otherwise the line says "XDR and PDR need all {total} categories tested." The result is the resistance profile's MDR, XDR or PDR value used by alert rules (R-22), the report's resistance profile line and exports; TB keeps its own classification. Implemented from the published definitions, not from the package's code. | `antimicrobials` classes; Magiorakos categories |
| FR-R29.5 | **LOINC and suggested mappings** (D-348). Each AST result is coded with the antibiotic's LOINC for its method (MIC, disk, gradient) when it is saved, for HL7 and FHIR results and exports; a result with no matching LOINC is sent without one, as today. Analyzer mapping screens (BD EpiCenter, MALDI-TOF profiles) suggest a mapping for each unmapped analyzer code from the package's organism codes, antibiotic abbreviations, synonyms and LOINC, ranked by match; an administrator accepts or changes each suggestion, and nothing is mapped without acceptance. | `antimicrobials` `loinc`, `abbreviations`, `synonyms`; `microorganisms.codes` |
| FR-R29.6 | **Dose beside I** (D-349). On a EUCAST lab, an I ("Susceptible, increased exposure") in the isolate list and at validation shows "High dose: {dose}" from the dosage data for that antibiotic and EUCAST version, the same text as the R-20 report note. CLSI SDD shows no dose (not in the package). | `dosage` |
| FR-R29.7 | **Translated names seeded** (D-350). French and Spanish names for antibiotics, antibiotic classes and organism groups (for example "Staphylocoque à coagulase négative") are loaded with the seed pack as the starting translations of those names; translators and labs can change them, and a lab's change is kept when the pack is reloaded. Latin organism names are not translated. Other languages in the package (Swahili, Indonesian and about 30 more) load the same way when a lab's locale needs them. | `translations.tsv` (about 255 antibiotic and class rows, 22 organism group rows) |

> **Contradicts v2**
> **Where:** v2 AST list order (panel order); v2 resistance profile (MDR shown in the AST section only); D-340 (bacterial MDR, XDR and PDR under the surveillance epic).
> **v3 says:** expected resistance not tested; no-breakpoint warnings before testing; list grouped by class; MDR, XDR and PDR on the isolate from published categories; LOINC on AST results and mapping suggestions; dose beside I; seeded translations.
> **Build state:** expected-phenotype data, breakpoints, antibiotic classes, LOINC and dosage are seeded by R-13 to R-20; the no-breakpoint warning after a reading and the resistance profile are built. **Rework:** breakpoint-availability lookup endpoint; row states on the isolate list; Skip testing on Always R rules; category table and classification; LOINC on result save; mapping suggestions on the analyzer mapping screen; translation seed.

**Part C. Requirements carried from V2 QA**

Source: "Microbiology / AMR v3 redesign: QA handoff" (QA of V2, OGC-1383, Piotr's stack PRs #4671 to #4734, pngtest.openelis-global.org 3.3.0-SNAPSHOT, two sweeps on 2026-10-19). Evidence: project doc `claude/qa-session-2026-10-19-amr-v2-pngtest.md`; automated checks `tests/amr-v2.spec.ts` (tripwires AMR-T01 to T12, guards AMR-G01 to G15). AC-Vnn numbers refer to the 112 V2 acceptance criteria.

**How this part is used.** Each QA requirement keeps its QA ID (R-CASE-1 and so on; these are QA IDs, distinct from this document's amendments R-01 to R-21) and gets a v3 acceptance criterion (AC-Q-nn) written beside it, so QA can trace it. When v3 meets a requirement its tripwire flips to pass and becomes a guard. Requirements without a tripwire get one from QA once this spec is reviewed. Rows that depended on a QA decision now cite it (D-Q1 to D-Q7, in "Decisions from QA"). Out of scope: A1 (date shown a day early west of UTC; server clock fix ready, recheck with AMR-T01) and A19 (Inventory list refresh).

### C-0. Context the whole design assumes

| ID | Requirement | v3 acceptance criterion |
|---|---|---|
| R-CTX-1 | Poor connectivity is normal: requests fail, stall or lose their response. | **AC-Q-01** Every save in the case is safe to retry (a repeated request does not duplicate a reading, isolate, run, suggestion or release); a lost response shows "Not confirmed, checking" and re-reads state instead of an error. |
| R-CTX-2 | Every user-visible string is translatable, French at launch. | **AC-Q-02** Errors, empty states, Timeline entries, toasts and report text all come from translation keys; a French session shows no English. |
| R-CTX-3 | Search, not scroll, wherever the user picks from a list. | **AC-Q-03** Organism, antibiotic, panel, method, medium and recipient pickers filter by typed text (and synonyms, R-13, R-19). |
| R-CTX-4 | One locale date format everywhere. | **AC-Q-04** Case header, Timeline, worklists, dialogs and reports use the locale format set for the site (dd/mm/yyyy on pngtest). |
| R-CTX-5 | A fresh deployment has no micro reference data; every screen has a useful empty state naming the admin setting. | **AC-Q-05** With empty organisms, antibiotics, panels, breakpoints, media or culture tests, each affected screen names what is missing and links to the admin page that fixes it. With the R-13 and R-19 seed packs loaded, organisms and antibiotics are no longer empty. |

### C-1. Case header, status and wording

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-CASE-1 | **AC-Q-10** "Preliminary" and "Interim" never appear; header, version list, Amendments, Timeline and reports say Partial. | A2, A28; AMR-T02 |
| R-CASE-2 | **AC-Q-11** While an amendment is open the stage is not "Amended"; after the amended report is released the header shows the amended state, not "Final Released". | A28 |
| R-CASE-3 | **AC-Q-12** The case and worklist status is one of **In progress** (until the first release), **Partial** (after a partial report), **Final** (after final release) or **Amended** (after an amended report is released); tags beside the status show concurrent states: **Referred** while any referral of the case, a test or an isolate is open (v2 FR-08.2, FR-08.5; local work and partial release continue alongside it), **Referral returned** while returned results await review or placement, and **Amendment open**. A transfer is a Timeline event, not a status (D-Q6). Status and tags are **worked out, not stored**: status from the case's releases (none, partial, final, amended) and tags from open referrals, returned referral results and open amendments (D-277). The worklist has **one Status filter** that lists the statuses and then the tags. "Active" is not used. Each referred test or isolate row also shows the existing referral status tag (`ReferralStatusTag`: sent, received, results returned).  | A16, A25 |
| R-CASE-4 | **AC-Q-13** Number of sets shows only for set-collected cultures; Questionnaire hidden when the Program has no questions; patient name in one format. | A16 |
| R-CASE-5 | **AC-Q-14** A 4-bottle, 2-set order reads "2 sets, 4 bottles" with sites (for example "Left arm, Right arm"); Number of sets is computed from collected bottles, not typed. Needs the server fix in C-13. | A20; AMR-T09 |

### C-2. Opening cases from orders

| QA ID | v3 acceptance criterion | V2 finding |
|---|---|---|
| R-OPEN-1 | **AC-Q-20** Culture tests appear as the culture work of the case, not as free-text rows under Initial testing. Each culture test is the **heading of the Culture section** it drives (for example "Bacterial culture, urine" or "TB culture, sputum"), and its result is the culture result (No growth, Growth, organisms); bottles, plates and readings sit under it. Culture tests never appear in Initial testing (D-Q4). A case with two culture tests shows two Culture sections. | A26 |
| R-OPEN-2 | **AC-Q-21** The "new lab unit" note at order entry appears for every lab unit the order opens work in for the first time. | A32 |
| R-OPEN-3 | **AC-Q-22** An empty Container type list says so and names the admin setting. | A32 |

### C-3. Culture setup, media and incubation

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-CULT-1 | **AC-Q-30** Inoculate culture offers "Add new" medium (AC-V65) and shows which culture test each chosen medium adds to the order (D-Q5); with no medium configured the case explains what is missing and how to add it, and does not dead-end. | A4 |
| R-CULT-2 | **AC-Q-31** Lots that are QC Pending, expired or out of stock are listed disabled with the reason (AC-V64). | A4 |
| R-CULT-3 | **AC-Q-32** The medium item form has Usual atmosphere; the Items list can filter or tag microbiology media (AC-V66). | A4 |
| R-CULT-4 | **AC-Q-33** Time to positivity reads "1 day 3 hours 4 minutes", label without "(hours)"; the report prints the same (AC-V95). | A8; AMR-T04 |
| R-CULT-5 | **AC-Q-34** Extension reason Other with no note is refused by the UI and by the API (4xx naming the missing note) (AC-V93). | A23; AMR-T10 |
| R-CULT-6 | **AC-Q-35** A 24 h extension reads "+24 hours extended" with the count of extensions. | A23 |
| R-CULT-7 | **AC-Q-36** Reading and Outcome dialogs show no help text that does not apply to them. | A11 |

### C-4. Isolates and identification

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-ISO-1 | **AC-Q-40** Identification methods are microbiology methods with readable names (for example MALDI-TOF, VITEK 2, biochemical, molecular); no HIV or syphilis kits, no raw codes. The list is the shared Method dictionary filtered by a new **Microbiology identification** flag on each method (D-Q2); MALDI-TOF, VITEK 2, biochemical and molecular identification are seeded with the flag on, with readable translated names. With no flagged method, the dialog names the Method admin setting. | A5; AMR-T06 (needs the open-case fixture) |
| R-ISO-2 | **AC-Q-41** "Re-identification reason" appears only when an organism was already set. With the R-13 seed, re-identifying to a renamed organism shows "Formerly {old name}". | A11 |
| R-ISO-3 | **AC-Q-42** No placeholder copy such as "Choose an isolate workspace option". | A11 |

### C-5. AST and DST

| QA ID | v3 acceptance criterion | V2 finding |
|---|---|---|
| R-AST-1 | **AC-Q-50** MIC entry takes ≤ and > qualifiers (≤0.25, >32), interpreted as in FR-R16.3 (capped values that cannot decide return "Result range does not allow interpretation"); the reading dialog names the agent (and disk content, R-15). **Entry (D-Q7, D-279):** the v2 **Record reading** form (antibiotic, value) gains a qualifier dropdown (=, ≤, <, ≥, >; default =) beside the number field; there is no separate per-row entry panel, because ≤ and ≥ are hard to type; the field also accepts "<=" and ">=" typed and sets the dropdown. **Analyzer results land inline**: a reading from an analyzer fills the same row with its value and qualifier (for example ">32") and its source shown, without retyping, and the tech can accept or override it in place. | A6 |
| R-AST-2 | **AC-Q-51** Empty values show blank or a dash, never "None", including superseded rows after a retest and Selected for report. | A9; AMR-T05 |
| R-AST-3 | **AC-Q-52** Start AST run asks for a reason only for a non-default standard, and marks it required then (AC-V21). The default panels from R-01 are preselected; the chooser lists only panels whose targeting matches the organism (FR-R3.5), and "Show all panels" is a deliberate second step, so a Staphylococcus panel is never offered for *E. coli* by default. | A10 |
| R-AST-4 | **AC-Q-53** An MTB complex isolate offers TB methods (MGIT, proportion, molecular) and **WHO critical concentrations** as its interpretation model, and readings interpret without overrides (AC-V21, V11). WHO critical concentrations are **not** in the AMR package (it has only a few EUCAST *M. tuberculosis* MIC rows), so they load as a separate breakpoint source through the same pipeline domain as R-18 (M-14, OGC-916). | A24 |
| R-AST-5 | **AC-Q-54** A molecular resistance result is reflected in the DST or AST picture for the isolate. It comes from **any catalog test** whose coded result component is mapped to an antibiotic or an antibiotic class (for example the MTB/RIF Ultra test's "Rifampicin resistance" component, an MTBDRsl line probe assay, the CTX-M and KPC components of a BCID2 panel). The instrument or technique (GeneXpert, line probe assay, multiplex PCR, sequencing) is the **Method linked to the test**, not part of the mapping, so no rule or screen names a vendor. The result shows in a **Molecular resistance** table next to the DST or AST table (antibiotic or class, result, test, method, where and when performed, phenotypic result, agreement), not as a DST row (D-Q3, D-285). There is no row without a result and no table when no mapped result exists. The coded value maps to R or S (for example Detected to R, Not detected to S, Indeterminate to no interpretation), never free text. The resistance classification (v2 A-14) uses molecular and phenotypic results together, and a molecular R with a phenotypic S (or the reverse) is flagged as a discordance for the validator. | A24 |
| R-AST-6 | **AC-Q-55** The AST runs view has no developer text, opens on a useful default, and status All returns every run. | A31 |
| R-AST-7 | **AC-Q-56** Validate run says what validation does, and its button says "Validate". | A11 |

### C-6. Release, amendments and the patient report

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-REL-1 | **AC-Q-60** Final release (which locks the case) opens a confirmation that states what will happen (the case locks, which results and report version are released, that changes then need an amendment) and releases only on Confirm. Partial release stays one click with no confirmation (D-Q1). | A7 |
| R-REL-2 | **AC-Q-61** Final release with missing required information answers 4xx naming the missing items; the UI lists them next to the button. | A3; AMR-T03 (needs the partial-release fixture) |
| R-REL-3 | **AC-Q-62** Required-information messages are sentences: "Patient origin is required before final release." | A11 |
| R-REL-4 | **AC-Q-63** The patient PDF marks amended results as Amended (AC-V52). | A30 |
| R-REL-5 | **AC-Q-64** Empty Initial testing and Additional testing headings do not print; specimens print in order (-1 before -2); incubation prints per AC-Q-33. Only agents ticked by the reporting rules or by the user print (FR-R7.1); inferred agents print under their own name with the expert rule applied (R-06); reporting notes print beside their agent (FR-R2.6). | A30 |

### C-7. Case relationships

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-LINK-1 | **AC-Q-70** A sputum TB case and a urine case from the same order each list the other under Related cases, before and after a transfer (AC-V03, V63). | A22; AMR-T11 |
| R-LINK-2 | **AC-Q-71** A case with more than one sample offers Split; "Correct sample details" does not open the legacy Modify Order (AC-V63). | A21; AMR-T12 |

### C-8. Bench and worklist

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-BENCH-1 | **AC-Q-80** The bench exists in the UI: Due column, Needs attention (including isolates with unactioned suggestions, FR-R4.5), Check due, bulk No growth and Inoculate, bench sheets and labels (AC-V11, 12, 76 to 81, 85 to 87, 94, 112). | A25 |
| R-BENCH-2 | **AC-Q-81** The bench excludes final-released cases, lists each culture test once, and its lab-unit filter lists only active, visible units. | A15; AMR-T07 |

### C-9. Timeline and communications

| QA ID | v3 acceptance criterion | V2 finding |
|---|---|---|
| R-LOG-1 | **AC-Q-90** Timeline entries are translated sentences with organisms, samples and users by name; no codes or ids. This applies to the new v3 entries (report choice changed, added from suggestion, suggestion dismissed, override by expert rule). | A27 |
| R-LOG-2 | **AC-Q-91** A critical call records its outcome (for example "Read back confirmed"); each logged entry shows its time; the target is chosen from the case, not typed (AC-V48). | A29 |

### C-10. Admin and reference data

| QA ID | v3 acceptance criterion | V2 finding, tripwire |
|---|---|---|
| R-ADM-1 | **AC-Q-100** Required fields are marked (organism Initial significance); errors name the field by its label, from the UI and from the server. | A12; AMR-T08 |
| R-ADM-2 | **AC-Q-101** **No Case role and no Culture checkbox (D-Q5).** The catalog keeps only "Opens a Microbiology case" (on the create form, not only on edit) and "Collected in sets". A test is a culture because it has **culture media linked** (the existing media links on a test, v2 FR-05.2a), and cultures come into being by **inoculating**: Inoculate on a specimen picks one or more media; the culture test linked to each medium is used if it is already on the order for that sample, otherwise it is **added to the order** on that sample, tagged Added by {user} with a Timeline entry (v2 FR-07.2c). Several media for the same culture test are plates under one culture test; media for different culture tests (for example aerobic and fungal, or MGIT and LJ) add separate culture tests, each with its own readings, status, referral and release, all traced to the same sample and order. A medium with no linked culture test asks the user to pick one (search) and offers to save the link. Direct tests (Gram stain, AFB smear, Xpert, India ink) are separate tests ordered at reception or added with Add test, each validated and released on its own (partial reports per v2 FR-17.6). Nothing is created in advance, so work that is never done never appears on the order or the report. A culture can be released as No growth with no AST/DST. The micro setup empty state (AC-Q-05) flags a lab unit that has no medium linked to a culture test. | A14 |
| R-ADM-3 | **AC-Q-102** Toasts show values, not templates ("Test QA_AMR Gram stain created."). | A13 |
| R-ADM-4 | **AC-Q-103** Breakpoint import offers a column guide or downloadable template, and errors name the accepted values ("Method must be MIC or Zone"). For the native AMR packs (R-18) this is the shared Import Review; for local breakpoints (FR-R18.5) a template with indication and disk content columns. | A17 |
| R-ADM-5 | **AC-Q-104** The AST panel editor's antibiotic picker filters by typed text and synonyms, is not clipped in the modal, and says so when a duplicate is added. The same editor holds the new targeting fields (FR-R1.1). | A18 |
| R-ADM-6 | **AC-Q-105** Switch labels describe the setting ("Require tracked media": On/Off or Required/Not required, never "Inactive"). | A18 |

> **Contradicts v2**
> **Where:** v2 FR-01.1 and FR-01.1b (Case role Culture / Direct / Case; case tests, D-177, D-178); `MicroCaseRole`; `MicroCaseRequest.caseRole`, `MicroCaseAnalysis.caseRole`; `MicroOrderRoutingServiceImpl.routeCaseTest`; `MicroCaseInoculation` (linked to the case only).
> **v2 said:** a three-value Case role on every micro test; a Case-role test opens a case with no result; an inoculation belongs to the case, not to a test.
> **v3 says:** no Case role and no checkbox; a culture test is one with media linked; the **Inoculate** button shows in + Start inoculation from the start, disabled until a medium is picked (D-280); Inoculate adds the culture test for the medium to the order when it is not there, and each inoculation (plate, bottle, tube) belongs to that culture test (D-Q5).
> **Build state:** built; on develop the only behaviour reading Culture vs Direct is "Collected in sets requires Culture", and both are placed in Initial testing (the cause of A26). **Rework:** drop the role from the catalog form and routing; link each inoculation to its culture test analysis; Inoculate adds the culture test to the order through the existing add-test path; placement of a culture test as the heading of its Culture section (D-Q4); migration: existing inoculations are linked to the case's culture test for their sample (or listed for review when there are several), Case-role tests are deactivated and open orders that use one are listed for review; keep the role columns for history.

### C-12. Must keep working (regression baseline)

All pass on V2 today; guards AMR-G01 to G15 must stay green on v3. **AC-Q-120** covers the whole list.

1. Two urines with a bacterial culture open one Bacteria case; "What this order will open" shows it live, says "Gram stain stays in Results", and saves nothing before Save (AC-V01, V103; G04).
2. TB culture and Xpert on one sputum open one Mycobacteriology case; a urine culture and a sputum TB culture on one order open two cases in their own lab units (AC-V03, V91; G05, G06).
3. No microbiology fields at order entry (AC-V02, V06). Collect has Set number and Body site per bottle (AC-V104).
4. Wrong set assignment warns (REPEATED_CONTAINER, SINGLE_BOTTLE) and does not block (AC-V104; G07).
5. Catalog has Opens a Microbiology case and Case role (**v3:** Case role removed, D-Q5; cultures come from Inoculate and media links; the guard G03 is updated); Program has Show on Microbiology case and Reporting track (AC-V05, V92; G03). No separate Culture setups screen.
6. Identifying an isolate adds the organism's default panel (AC-V43). **v3 note:** still true; the default now comes from panel targeting (R-01), with the legacy organism default as fallback (FR-R1.5).
7. Interpretation against imported breakpoints: AMP 32 R, CIP 0.12 S, CRO 2 I, CRO 8 R (G09). **v3 note:** must stay true after the R-12 matcher, R-14 indication and R-15 disk content changes, and after the native import (R-18).
8. Inoculation never consumes media stock (lot still 20 after six inoculations; G10). Incubation end = inoculated + 18 h.
9. Inoculation before receipt or in the future is refused (AC-V95; G12). Extension without a reason is refused (AC-V93).
10. One bottle positive while the others keep incubating; case stage Growth detected (AC-V54; G13).
11. RIF R + INH R validated classifies Multidrug resistant (AC-V27; G14).
12. Transfer moves the case to another lab unit with a Timeline entry (AC-V04; G15).
13. After final release, writes return 409 MICROBIOLOGY_CASE_LOCKED (AC-V45; G08). Amendment opens on a final case; retest, Use for report and release give version 3 Amended; the PDF prints the corrected value (AC-V45, V52).
14. Report versions read "1 · Partial", "2 · Final" (G11).
15. Critical communication logs recipient, contact, method, message and follow-up (AC-V48). Case note Send with Result saves and is typed (AC-V28).
16. Patient PDF prints the microbiology block under its lab unit with one susceptibility table per isolate (AC-V53). WHONET export works through Preview.
17. UAT scenario endpoint is not exposed (404; G02). Worklist route is in the side nav (G01).

### C-13. Server fixes that should not wait for v3

The v3 UI calls the same endpoints, and none of these is removed or changed by the redesign, so all are still needed. Most belong to an existing V2 slice of OGC-1383 (all in Backlog on 2026-10-20), where they can be added as acceptance items instead of new tickets. **Filed 2026-10-20** as bugs under OGC-1383, assigned to Samuel, each linked to its slice: OGC-1522 (R-REL-2), OGC-1523 (R-CASE-5), OGC-1524 (R-CULT-5), OGC-1525 (R-BENCH-2), OGC-1526 (R-AST-6, also linked to OGC-1411), OGC-1527 (R-ADM-1). R-AST-4 was already OGC-916.

| QA ID | Fix | Finding | Still needed with v3? | Existing home in Jira |
|---|---|---|---|---|
| R-REL-2 | Blocked final release returns 4xx with the missing items, not 500 | A3 | Yes: v3 disables Release final when items are missing, but the server must still refuse cleanly (the case bar and API clients call it) | V12 Releases, reports and immutable history (OGC-1436) |
| R-CASE-5 | Case shell returns `collectedInSets: true` on set-collected bottles | A20 | Yes: the header's "2 sets, 4 bottles" depends on it | V03 Case information (OGC-1428) |
| R-CULT-5 | API refuses extension reason Other without a note | A23 | Yes | V06 Independent culture readings (OGC-1431) |
| R-BENCH-2 | Bench excludes final cases, de-duplicates culture tests, lists only active visible lab units | A15 | Yes, and more visible in v3: culture rows are grouped under their culture test (D-Q4) | V07 Bench work and labels (OGC-1438) |
| R-AST-6 | AST worklist status ALL returns every run | A31 | Yes | V07 (OGC-1438), beside the AST worklist date bug OGC-1411 |
| R-ADM-1 | Server validation errors use field labels, not keys | A12 | Yes | **None**: cross-cutting, the only one that would be a new bug |
| R-AST-4 | WHO TB critical concentrations as a breakpoint source (M-14) | A24 | Yes; the AMR for R package has no WHO critical concentrations, so this stays outside the packs (D-286) | **Already filed:** OGC-916 (epic OGC-787), verified in V11 TB susceptibility rules (OGC-1434) |

### C-15. Not tested yet: v3 defines, QA will test

| Area | Where v3 defines it |
|---|---|
| Roles and lab-unit rights (AC-V49, V60) | v2 Access table plus v3 Access rows; QA needs a non-admin pngtest account (for example a Bacteria technician without Mycobacteriology rights), created by Casey or Piotr |
| Incoming results placement from analyzers | v2 A-09; name matching now uses organism and antibiotic synonyms (R-13, R-19, AC-R-33) |
| Referral dispatch from a case | v2 A-08 |
| Labels and bench sheets | v2 A-20, AC-Q-80 |
| Reflex rules on cultures | R-02 (blocked by the Test Rules MVP) |
| NCE submit from the case | v2 (unchanged) |
| French, offline behavior and narrow layout | AC-Q-01, AC-Q-02. Narrow layout and text expansion are now defined (D-289, AC-R-34) and checked on the v3 preview; translations themselves and offline behavior remain for QA |
| Comparison with the mockups | The v3 preview (`amr-micro-v3-preview.html`, with the build map) is drawn and can be compared against; the JSX mockup follows at handoff |

### C-16. Verification

QA reruns `tests/amr-v2.spec.ts` against the v3 build. A requirement is met when its tripwire flips to pass (AMR-T01 to T12) and every C-12 guard still passes. Fixture additions planned by QA: one case left at partial release without Patient origin (for T03) and one open case with an unidentified isolate (for T06).

---

## Worked example: CPHL SOP 9.5.2.4 *Pseudomonas spp.* (newer revision)

**AST panels:** "GNR disc set" and "MRGN disc set", both organism group *Pseudomonas*, any sample type, Default on: both added on identification.

**Reporting rules** (organism group *Pseudomonas*, any sample type):

| Antibiotic | Report default | Condition | Other |
|---|---|---|---|
| Gentamicin | Report | | Note, Always (text to be supplied) |
| Ciprofloxacin | Report | | |
| Tobramycin | Report | | |
| Meropenem | Cascade | CAZ is R AND TZP is R | |
| Ceftazidime | Report | | |
| Piperacillin-tazobactam | Report | | |
| Amikacin | Cascade | all other tested agents are R | |

**Reflex rule:** *Pseudomonas*, MEM is R, then Add test "Carbapenem inactivation method" with note "Refer to CPHL".

This page differs from the 2019 SOP transcribed in the companion CSV; both are used only as examples.

---

## Access

Nominated for the role builder (Flexible RBAC). Until it lands, the existing rights in brackets apply.

| Action | Who | Privilege (nominated) [existing] |
|---|---|---|
| View AST rules (reporting and interpretation), their history and the preview | Microbiology technician, validator, administrator | `micro.astRules.view` [Admin › Microbiology reference data] |
| Add or change an "Organism or resistance profile" alert rule | Test catalog administrator | As the existing test catalog alert rules [Test catalog › Alerts] |
| Record an AST control result | Microbiology technician | As the existing control capture in Results Entry (results entry rights; `POST /rest/qc/results` checks them on the server) |
| Edit or import QC ranges | Microbiology lab manager, administrator | `micro.astRules.edit` [Global Administrator] |
| Edit or import AST rules (reporting and interpretation, M-06) | Microbiology lab manager, administrator | `micro.astRules.edit` [Global Administrator] |
| Edit AST panel targeting and Default | Administrator | [existing AST Panels admin rights] |
| Create reflex rules with an AST result input | Administrator | [existing Reflex Tests admin rights] |
| Add or dismiss a suggestion; tick or untick an agent; Reset to defaults; revert an expert rule override | Microbiology technician, validator | [Results or Validation in the case lab unit, as v2] |
| Load or update AMR seed packs; hide or pin organisms and antibiotics | Administrator | `micro.referenceData.loadPack` [Global Administrator; reference data import rights] |
| Edit lab-defined organism groups; sample type default indication | Microbiology lab manager, administrator | `micro.referenceData.edit` [Admin › Microbiology reference data] |
| Add, change or switch off a local breakpoint; set a panel agent's default disk content (R-25) | Microbiology lab manager, administrator | `micro.breakpoint.local` [Global Administrator; breakpoint admin rights] |

---

## Localization

All labels below are new keys; each needs English, French and Spanish at minimum. Organism, antibiotic and panel names come from their own translated tables.

| Key | English |
|---|---|
| `order.micro.saved.casesOpened` | {count, plural, one {Saved. This order opened # microbiology case:} other {Saved. This order opened # microbiology cases:}} |
| `order.micro.saved.caseLine` | {test}: case {case} in {labUnit} |
| `micro.case.suggested.reason.reported` | Reported by {laboratory} |
| `order.micro.summary.reportedOrganism` | ISO-1 reported as {organism} |
| `micro.breakpoint.local.tag` | Local |
| `micro.breakpoint.local.change` | Change |
| `micro.breakpoint.local.add` | Add local breakpoint |
| `micro.breakpoint.local.reason` | Reason for the change |
| `micro.breakpoint.local.packValue` | Pack value |
| `micro.breakpoint.local.labValue` | This lab's value |
| `micro.breakpoint.local.switchOff` | Use pack value |
| `micro.breakpoint.local.keep` | Keep local |
| `micro.breakpoint.local.source` | {standard}, local: {reason} |
| `micro.breakpoint.local.packChanged` | Pack now {pack}; local {local}, reason: {reason} |
| `micro.breakpoint.local.carriedOver` | Carried over from before v3 |
| `micro.breakpoint.local.invalidOrder` | Susceptible must be below resistant |
| `micro.case.section.isolatesSusceptibility` | Isolates and susceptibility |
| `micro.isolate.open` | Open |
| `micro.isolate.close` | Close |
| `micro.isolate.antibiotic` | Antibiotic |
| `micro.isolate.value` | Zone or MIC |
| `micro.isolate.run` | From |
| `micro.isolate.sender` | Sender |
| `micro.isolate.notTested` | Not tested |
| `micro.isolate.enterAs` | Enter new results as |
| `micro.isolate.saveResults` | Save results |
| `micro.isolate.runDetails` | Run details and QC |
| `micro.isolate.panels` | Panels on this isolate |
| `micro.isolate.noPanels` | None yet. A default panel is added when the isolate is identified. |
| `micro.isolate.addPanel` | Add panel |
| `micro.isolate.addAntibiotic` | Add antibiotic |
| `micro.isolate.supplementary` | Supplementary |
| `micro.isolate.notStarted` | not started |
| `micro.isolates.empty` | No isolates yet. Add one when a culture grows. |
| `micro.incoming.none` | None waiting. Results that arrive for tests not on this case appear here to be placed. |
| `micro.case.section.cultureReadings` | Culture and readings |
| `micro.case.section.reportRelease` | Report and release |
| `micro.section.complete` | Complete |
| `micro.section.expand` | Expand |
| `micro.section.collapse` | Collapse |
| `micro.summary.initial` | All direct tests have results |
| `micro.next.label` | Next |
| `micro.next.incoming` | Place {count} incoming results |
| `micro.next.validateAst` | Validate the AST run |
| `micro.next.releaseFinal` | Release the final report |
| `micro.intro.incoming` | Results that arrived for tests not yet on this case. Place each one where it belongs. |
| `micro.intro.caseInfo` | Who the patient is and why the sample came in. Fields marked ◆ are needed before the final report. |
| `micro.intro.initial` | Tests done directly on the sample, such as Gram stain, smear or Xpert, before anything grows. |
| `micro.intro.referral` | Send remaining work to another laboratory and track it until results return. |
| `micro.intro.culture` | Inoculate media, then record what grows at each check until every culture has an outcome. |
| `micro.intro.isolates` | Identify each organism that grew and record its antibiotic results. Open an isolate to work on it. |
| `micro.intro.additional` | Tests added later, on the sample or on an isolate, outside the culture work. |
| `micro.intro.critical` | Calls and automatic emails about critical results, and who acknowledged them. |
| `micro.intro.nce` | Problems with the sample or the work, recorded as nonconformance events. |
| `micro.intro.report` | Choose what prints, check what is missing, and release a partial or final report. |
| `micro.intro.amendment` | Changes after a final report, released as an amended report. |
| `micro.intro.timeline` | Everything done on this case, by whom and when. |
| `micro.tip.whatIs` | What is {term}? |
| `micro.tip.from` | The panel or run the value came from. Two runs can test the same antibiotic; the one marked Use for reporting is shown. |
| `micro.tip.report` | Ticked antibiotics print on the report. The tick starts from the lab's reporting rules; you can change it until release. |
| `micro.tip.cascade` | A cascade antibiotic is reported only when the rule's condition is met, usually when the first-line antibiotics are resistant. |
| `micro.isolate.alert.label` | Alert |
| `micro.isolate.alert.cre` | Flag: important resistance. Confirm, save the isolate and refer to the reference laboratory. |
| `micro.rules.action.setR` | Set to R |
| `micro.panelChooser.title` | Add AST panels to {isolate} |
| `micro.panelChooser.expectedR` | {agents}: expected R for {organism}, not tested |
| `micro.panelChooser.noBp` | No breakpoint for {organism} by this method: {agents} |
| `micro.isolate.expectedR` | Expected R, no test needed |
| `micro.isolate.expectedRule` | Expected resistant phenotype |
| `micro.isolate.noBpShort` | (no breakpoint for this method) |
| `micro.bp.none.method` | No {method} breakpoint for {antibiotic}. Test by {otherMethod}. |
| `micro.bp.none.organism` | No {guideline} breakpoint for {organism}. Result will have no interpretation. |
| `micro.isolate.resistanceClass` | Resistance |
| `micro.isolate.resistanceClass.count` | Non-susceptible in {ns} of {cats} antibiotic categories tested |
| `micro.isolate.resistanceClass.partial` | XDR and PDR need all {total} categories tested. |
| `micro.tip.mdr` | MDR: non-susceptible to at least one agent in 3 or more categories. XDR: susceptible in no more than 2 categories. PDR: non-susceptible to every agent. XDR and PDR are given only when every category for the organism group was tested. Categories follow Magiorakos et al. 2012; expected resistance is not counted. |
| `micro.isolate.highDose` | High dose: {dose} |
| `micro.class.otherTests` | Other tests |
| `micro.rules.skipTesting` | Skip testing |
| `micro.panelChooser.search` | Search panels |
| `micro.panelChooser.searchPlaceholder` | Panel name, code or antibiotic |
| `micro.panelChooser.method` | Method |
| `micro.panelChooser.anyMethod` | Any method |
| `micro.panelChooser.standard` | Standard |
| `micro.panelChooser.anyStandard` | Any standard |
| `micro.panelChooser.scope` | Which panels |
| `micro.panelChooser.scope.isolate` | For this isolate ({count}) |
| `micro.panelChooser.scope.all` | All panels ({count}) |
| `micro.panelChooser.group.level` | For {level} |
| `micro.panelChooser.onIsolate` | On {isolate} |
| `micro.panelChooser.default` | Default |
| `micro.panelChooser.antibiotics` | {count, plural, one {# antibiotic} other {# antibiotics}} |
| `micro.panelChooser.for` | For {level} |
| `micro.panelChooser.notTargeted` | Not targeted at {organism}. Some antibiotics may have no breakpoint for it. |
| `micro.panelChooser.otherSample` | Set up for {types}, not {sample}. |
| `micro.panelChooser.showAntibiotics` | Antibiotics |
| `micro.panelChooser.hideAntibiotics` | Hide antibiotics |
| `micro.panelChooser.andMore` | and {count} more |
| `micro.panelChooser.count` | Showing {shown} of {total} |
| `micro.panelChooser.more` | Show more |
| `micro.panelChooser.noneHere` | No panel set up for this isolate matches. |
| `micro.panelChooser.searchAll` | Search all panels |
| `micro.panelChooser.none` | No panels match. |
| `micro.panelChooser.noTargeting` | No panel is set up for {organism} from {sample}. Choose All panels to pick any panel. |
| `micro.panelChooser.nothing` | Nothing selected |
| `micro.panelChooser.add` | Add panel |
| `micro.panelChooser.addN` | Add {count} panels |
| `micro.isolate.panelsAdded` | Added {panels} to {isolate}. Their antibiotics are listed below as not started. |
| `micro.runDetails.addPanelHelp` | Opens the panel chooser under Panels on this isolate. |
| `micro.isolate.currently` | Currently |
| `microbiology.isolate.reidentifyTitle` | Re-identify {isolate} |
| `microbiology.isolate.identifyTitle` | Identify {isolate} |
| `microbiology.isolate.reidentifyEffect` | Panels and results already on {isolate} stay. Default panels for the new organism are suggested, not added, and interpretations are checked against it. |
| `microbiology.case.notes.title` | Notes on {item} |
| `micro.rules.action.infer` | Infer |
| `micro.rules.action.flag` | Flag |
| `microbiology.admin.astRules.action` | Action |
| `microbiology.admin.astRules.interpretation.intro` | Rules about what a result is. Set to R and Infer change an interpretation as an automatic override with the rule named; the measured value stays visible and a validator can revert it. Flag never changes a result: it raises an alert on the isolate that must be acknowledged before the run is validated. Whether an agent prints is decided by the reporting rules above. |
| `micro.record.method.disk` | Disk diffusion |
| `micro.record.method.mic` | MIC |
| `micro.record.method.etest` | Etest |
| `micro.record.keys` | Enter moves to the next antibiotic. Off-scale: <=0.5 or >64. Letters S, I, R are accepted but flagged. |
| `micro.record.interp` | Interpretation |
| `micro.record.alert.letterOnly` | Entered as S, I or R without a measurement: not used for the antibiogram or WHONET values. |
| `micro.worklist.mode.isolates` | Isolates |
| `micro.isolates.filter.organism` | Organism |
| `micro.isolates.filter.resistantTo` | Resistant to |
| `micro.isolates.filter.dates` | Specimen dates |
| `admin.micro.panel.targetOrganism` | Organism or group |
| `admin.micro.panel.targetSampleTypes` | Sample types |
| `admin.micro.panel.default` | Add automatically when identified |
| `rules.input.astAgent` | AST result on the isolate |
| `rules.predicate.allOtherR` | All other tested agents are R |
| `rules.action.mode.add` | Add |
| `rules.action.mode.suggest` | Suggest |
| `microbiology.admin.astRules.title` | AST rules |
| `microbiology.admin.astRules.subtitle` | Everything the lab decides about an AST result, on one page. Reporting rules decide whether an antibiotic starts ticked on the report; interpretation rules change what the result is. Every result is still saved and exported, whatever the tick. |
| `microbiology.admin.astRules.reporting` | Reporting rules |
| `microbiology.admin.astRules.reportingHelp` | Whether an antibiotic starts ticked on the report, and what to suggest testing next |
| `microbiology.admin.astRules.interpretation` | Interpretation rules |
| `micro.case.suggested.dismiss.noReason` | Dismiss |
| `micro.case.suggested.reason.notIndicated` | Not indicated |
| `micro.case.suggested.reason.elsewhere` | Tested elsewhere |
| `micro.case.suggested.reason.notAvailable` | Not available in this lab |
| `micro.ast.methodStandard` | Method · standard |
| `micro.molecularResistance.testMethod` | Test · method |
| `label.testCatalog.alerts.trigger.MICRO_PROFILE` | Organism or resistance profile |
| `label.testCatalog.alerts.ack.notRequired` | Not required |
| `micro.critical.status.sent` | Sent |
| `micro.lot.qcPassed` | Lot QC passed |
| `micro.astQc.when` | For a new lot, and on the schedule your QC policy sets for this panel |
| `micro.astQc.strainHelp` | QC strains are control lots in QC › Control Lots |
| Reused as built | `label.results.section.reagents`, `label.results.reagents.lotsUsed`, `label.results.control.capture.lot`, `.measured`, `.expected`, `.outcome`, `.pass`, `.fail`, `.record`, `.recorded`, `.recordedBlocked`, `.blockedHint` |
| `micro.alert.email.subject` | Resistant organism: {profile} {organism}, {labNumber} |
| `micro.alert.email.subjectAmended` | Amended: resistant organism {profile} {organism}, {labNumber} |
| `micro.alert.email.body` | {profile} {organism} was validated on {labNumber} ({sampleType}, {location}) at {validatedAt}. Open the case: {link} |
| `micro.critical.method.emailAutomatic` | Email, automatic |
| `micro.critical.notSent` | Not sent: {reason} |
| `microbiology.worklist.mode.cultures` | Cultures |
| `microbiology.worklist.mode.ast` | AST |
| `microbiology.admin.astRules.empty` | No reporting rules yet. Every agent is reported. Load the CLSI or EUCAST starter, or import your lab's SOP. |
| `microbiology.admin.astRules.standard` | Written for |
| `microbiology.admin.astRules.unmatchedDefault` | Agents with no matching rule |
| `microbiology.admin.astRules.col.antibiotic` | Antibiotic |
| `microbiology.admin.astRules.col.organism` | Organism |
| `microbiology.admin.astRules.col.sampleTypes` | Sample types |
| `microbiology.admin.astRules.col.reportDefault` | Report default |
| `microbiology.admin.astRules.col.condition` | Condition |
| `microbiology.admin.astRules.col.indication` | Indication |
| `microbiology.admin.astRules.col.autoAdd` | Add automatically |
| `microbiology.admin.astRules.col.note` | Note |
| `microbiology.admin.astRules.value.report` | Report |
| `microbiology.admin.astRules.value.dontReport` | Don't report |
| `microbiology.admin.astRules.value.reportIfR` | Report only if R |
| `microbiology.admin.astRules.value.cascade` | Cascade |
| `microbiology.admin.astRules.standardMismatch` | These reporting rules were written for {tableStandard}; the lab interprets with {labStandard}. |
| `microbiology.admin.astRules.preview` | Preview |
| `microbiology.admin.astRules.history` | History |
| `micro.case.suggested.reason.cascade` | {condition}: test and report {antibiotic} |
| `micro.case.reading.inferredFrom` | Inferred from {antibiotic} |
| `micro.case.suggested.title` | Suggested |
| `micro.case.suggested.add` | Add |
| `micro.case.suggested.dismiss` | Dismiss |
| `micro.case.suggested.reason.default` | Default for {organism} from {sampleType} |
| `micro.case.suggested.noDefault` | No default panel for {organism} from {sampleType} |
| `micro.case.reportChoice.reason.rule` | {reportDefault}: {organism}, {sampleTypes} |
| `micro.case.reportChoice.reason.cascade` | Cascade: {condition} |
| `micro.case.reportChoice.reason.default` | No rule: lab default {reportDefault} |
| `micro.case.report.astSummary` | {reported} of {total} antibiotics reported |
| `micro.case.report.astSummaryHelp` | Ticked in the Report column of AST / DST, from the reporting rules |
| `micro.notes.fromRule` | From rule |
| `micro.case.bar` | Case summary |
| `micro.case.reportChoice.changed` | Changed by you |
| `micro.case.jumpTo` | Jump to section |
| `micro.release.final.missingCount` | Release final ({count} missing) |
| `micro.notes.ruleSource` | Added by the reporting rule {rule} while its condition is met. Like every note it cannot be removed; if it should not apply, change the rule. |
| `micro.ast.recordReading` | Record reading |
| `micro.inoculate.pickMediumFirst` | Pick a medium to inoculate |
| `micro.case.reportChoice.resetToDefaults` | Reset to defaults |
| `micro.case.override.source.expertRule` | Expert rule: {rule} |
| `micro.case.timeline.reportChoiceChanged` | {user} changed {antibiotic} on {isolate} from {from} to {to} |
| `micro.case.timeline.addedFromSuggestion` | {user} added {panel} to {isolate} from suggestion: {reason} |
| `micro.case.timeline.suggestionDismissed` | {user} dismissed suggestion {panel} on {isolate} |
| `admin.micro.organism.taxonomy` | Taxonomy |
| `admin.micro.organism.groups` | Groups |
| `admin.micro.organism.formerly` | Formerly {oldName} |
| `admin.micro.organism.hide` | Hide in pickers |
| `admin.micro.organism.pin` | Pin to top |
| `admin.micro.antibiotic.atc` | ATC code |
| `admin.micro.antibiotic.synonyms` | Other names |
| `admin.micro.antibiotic.loinc` | LOINC codes |
| `admin.micro.antibiotic.aware` | WHO AWaRe group |
| `admin.micro.antibiotic.aware.access` | Access |
| `admin.micro.antibiotic.aware.watch` | Watch |
| `admin.micro.antibiotic.aware.reserve` | Reserve |
| `admin.micro.breakpoint.indication` | Indication |
| `admin.micro.breakpoint.diskContent` | Disk content |
| `admin.micro.breakpoint.type.ecoff` | Epidemiological cut-off (ECOFF) |
| `admin.micro.breakpoint.testVectorsFailed` | {count} test results differ from the reference interpretation. The pack was not loaded. |
| `admin.micro.sampleType.defaultIndication` | Default indication |
| `micro.indication.meningitis` | Meningitis |
| `micro.indication.nonMeningitis` | Non-meningitis |
| `micro.indication.oral` | Oral |
| `micro.indication.intravenous` | Intravenous |
| `micro.indication.uncomplicatedUti` | Uncomplicated urinary tract infection |
| `micro.indication.urinaryOrigin` | Infections originating from the urinary tract |
| `micro.indication.respiratory` | Respiratory |
| `micro.indication.skinSoftTissue` | Skin and soft tissue |
| `micro.indication.screen` | Screen |
| `micro.indication.topical` | Topical |
| `micro.interp.sdd` | Susceptible dose-dependent |
| `micro.interp.i.clsi` | Intermediate |
| `micro.interp.i.eucast` | Susceptible, increased exposure |
| `micro.interp.wt` | Wild type |
| `micro.interp.nwt` | Non-wild type |
| `micro.interp.noBreakpointContent` | No breakpoint for {antibiotic} {content} |
| `micro.interp.cappedUndetermined` | Result range does not allow interpretation |
| `micro.reading.perIndication` | {antibiotic} ({indication}) |
| `micro.molecularResistance.title` | Molecular resistance |
| `micro.molecularResistance.help` | From results of tests on this case whose results are mapped to an antibiotic |
| `micro.molecularResistance.drug` | Antibiotic |
| `micro.molecularResistance.phenotypic` | Phenotypic result |
| `micro.molecularResistance.discordant` | Molecular and phenotypic results disagree for {drug} |
| `micro.inoculate.addsCultureTest` | {cultureTest} will be added to this order for {sample} |
| `micro.inoculate.pickCultureTest` | {medium} is not linked to a culture test. Choose one. |
| `micro.inoculate.saveMediumLink` | Link {medium} to {cultureTest} for next time |
| `micro.timeline.cultureTestAdded` | {user} added {cultureTest} to the order for {sample} by inoculating {medium} |
| `admin.micro.setup.missingCulture` | {labUnit} has no medium linked to a culture test. Link one in the Test Catalog. |
| `micro.case.status.inProgress` | In progress |
| `micro.case.status.partial` | Partial |
| `micro.case.status.final` | Final |
| `micro.case.status.amended` | Amended |
| `micro.case.tag.amendmentOpen` | Amendment open |
| `micro.case.tag.referred` | Referred |
| `micro.case.tag.referralReturned` | Referral returned |
| `micro.ast.qualifier` | Qualifier |
| `micro.ast.source.analyzer` | From {analyzer} |
| `admin.method.microIdentification` | Used for microbiology identification |
| `micro.release.final.confirmTitle` | Release final report? |
| `micro.release.final.confirmBody` | The case will be locked. {count} results will be released as report version {version}. Any later change needs an amendment. |

---

## Dependencies (data elements)

Named, not modelled (storage shape is the engineer's call).

- AST panel: targeting organism or group, list of sample types, Default switch (extends existing fields).
- Reflex rule: AST agent condition input with organism level and sample type scope; Order action mode Add or Suggest. No new action targets.
- Suggestions: none stored; computed from rules and results. A Dismiss is a Timeline activity (isolate, suggestion, who, when).
- Reporting table (one per lab): standard written for, unmatched-agent default; edits audited.
- Reporting rule: antibiotic or isolate marker, organism level and reference, sample types, indication, report default, cascade condition (shared condition tree), add-automatically flag, note text and when.
- Expert rule (M-06): organism level, sample types, condition (or none), target agents and interpretation; inferred readings marked with their source agent.
- Disk inventory item: antibiotic and disk content; run agent takes content from the picked lot, or the panel agent default content.
- Run agent: existing `reportBehavior`, plus the rule that decided it and a manual-change flag.
- Reading override: existing fields, plus source "expert rule".
- New Timeline activity types: report choice changed, added from suggestion, suggestion dismissed.
- Organism: AMR `mo` code, rank, parent taxa, Gram stain, oxygen tolerance, SNOMED codes, LPSN or MycoBank identifier, group memberships, aliases (synonyms, renames, other codes), seeded flag, local overrides.
- Organism group: name, source (package or lab), members.
- Antibiotic: AMR `ab` code, WHONET code, ATC code, class and ATC groups, synonyms and abbreviations, LOINC codes by method, AWaRe group (optional), route, notes.
- Breakpoint rule: type (clinical or ECOFF), indication, disk content, SDD flag, urine-only flag, note, reference table, package `rank_index`, plus existing fields.
- Sample type: default indication.
- Reading: one interpretation per indication where two apply; categories SDD, WT, NWT.
- Method: Microbiology identification flag (D-Q2).
- Test result component (coded): optional resistance mapping, antibiotic or antibiotic class, and each coded value to R, S or no interpretation (D-285). The test's linked Method names the technique.
- Inoculation: the culture test analysis it belongs to (D-Q5).
- Seed pack: package version, guideline versions, test vectors, licence status.
- Test alert rule: new trigger type "Organism or resistance profile" with its values (organisms, groups or profiles); existing notify and acknowledgement fields (R-22).
- Critical communication: method "Email, automatic", linked alert (existing `alertId`), status Sent or Not sent with reason (R-22, D-295).
- QC range: QC strain, antibiotic, method, disk content, guideline and version, low, high (R-23).
- QC result (built, OGC-1147): one per antibiotic for an AST control, linked to the AST run, the control lot and the antibiotic (R-23).

---

## Acceptance Criteria

- **AC-R-01** Panels "Urine stamp" (Enterobacterales, Urine, Default) and "Gram neg stamp" (Enterobacterales, any, Default): identifying *E. coli* on a urine case adds only Urine stamp; on a blood case only Gram neg stamp.
- **AC-R-02** Two Default panels at the same best-match level (Pseudomonas GNR and MRGN) are both added on identification.
- **AC-R-03** An organism with only the legacy `defaultAstPanelId` and no panel targeting still gets that panel (FR-R1.5).
- **AC-R-04** Cascade rules for Meropenem, Ceftazidime, Piperacillin and Amikacin on Enterobacterales with condition "CRO is R OR GEN is R", all four agents in the "MDR extras" panel: entering CRO R shows "MDR extras, CRO R [Add]" on the isolate; one click adds the run with no chooser, tagged Added by {user}, with a Timeline entry; once its readings are in, the four agents are ticked. Changing CRO back to S before adding removes the suggestion. No reflex rule is involved.
- **AC-R-05** The same Cascade rules with Add automatically on add the panel without a click, tagged Added by rule, and never twice. A reflex rule "*P. aeruginosa*: MEM is R, Add Carbapenem inactivation method" adds that test to the order on the isolate's sample.
- **AC-R-06** A dismissed suggestion stays hidden until its condition stops and starts being met again; no suggestion record exists other than the Dismiss Timeline entry.
- **AC-R-07** The Add panel chooser lists matching panels first, All panels for the rest (R-28); suggestions do not appear in it (D-278). The Report column in the AST table ticks and unticks an antibiotic, and the Report section shows one summary line per isolate (D-276). A rule note appears in the run's Notes tagged From rule while its condition is met, has no Remove or Edit action, and prints under the AST results (D-275, D-291).
- **AC-R-08** An isolate with unactioned suggestions is counted in Worklist Needs attention.
- **AC-R-09** Reporting rule "Acinetobacter / any / Ceftriaxone = Don't report": ceftriaxone is unticked with the reason shown; the result is still on the case and in the WHONET export.
- **AC-R-10** "Salmonella / any / Ceftriaxone = Don't report" plus "Salmonella / Blood / Ceftriaxone = Report": ticked from blood, unticked from faeces.
- **AC-R-11** Meropenem Cascade "CAZ is R AND TZP is R" is unticked while either is S or untested, and ticks when both are R, without a reload.
- **AC-R-12** Amikacin Cascade "all other tested agents are R" ticks only when every other tested agent is R.
- **AC-R-13** Enterococcus / Urine / Nitrofurantoin Cascade "AMP is S" ticks when ampicillin is S and not when R.
- **AC-R-14** A manual untick is not re-ticked by a later reading change; the Timeline shows it; Reset to defaults restores it.
- **AC-R-15** Expert rule "*S. aureus*: FOX is R, then FLC and beta-lactams R" with reporting rules FOX = Don't report and FLC = Report with note When R: cefoxitin R prints "Flucloxacillin R", marked Inferred from cefoxitin for staff, and the note; "Cefoxitin" does not print.
- **AC-R-16** Expert rule "Klebsiella: ampicillin always R": ampicillin measured S prints R, shows the measured S to staff with an override event sourced "Expert rule: {rule}", raises the M-06 intrinsic verification flag, and a validator can revert it.
- **AC-R-17** The report projection code path is unchanged: it reads the run agent's `reportBehavior`, now filled from the reporting rules.
- **AC-R-18** Importing the companion CSV through the reference data import shows its rows in the Import Review; an unknown antibiotic code is listed there and nothing is applied.
- **AC-R-19** A lab upgraded with panel tier and report default values sees reporting rules generated from them in an Import Review preview, applied only on Apply; the panel editor no longer shows Tier or Report Default.
- **AC-R-20** Reporting rules written for CLSI in a lab interpreting with EUCAST shows the mismatch warning and does not block.
- **AC-R-21** No AST or DST panel appears in the order entry, Sample Collection or Add order choosers (guard; true today).
- **AC-R-22** A released case keeps its printed selection after a reporting rule is edited; the rule's History shows who changed it, when, before and after.
- **AC-R-23** All new labels render in English, French and Spanish.
- **AC-R-24** A breakpoint row for genus *Pseudomonas* and one for *P. aeruginosa*: a *P. aeruginosa* isolate uses the species row; a *P. putida* isolate uses the genus row; an *E. coli* isolate uses neither.
- **AC-R-25** An Enterobacterales (order) rule applies to *E. coli*, *K. pneumoniae* and *Enterobacter cloacae* without listing them.
- **AC-R-26** Entering "Enterobacter aerogenes" in the organism picker, an analyzer result or an import resolves to *Klebsiella aerogenes* and shows "Formerly Enterobacter aerogenes"; an isolate reported before a rename keeps its reported name.
- **AC-R-27** A CSF isolate of *S. pneumoniae* is interpreted with meningitis breakpoints (sample type default indication); a blood isolate shows both meningitis and non-meningitis penicillin lines on Report choices, and the technician can untick either. The case has no Clinical context field.
- **AC-R-28** Picking an "Ampicillin 2 µg" disk lot at AST setup sets the agent's content to 2 µg and its zone uses the 2 µg breakpoint; a 10 µg lot with only a 2 µg breakpoint shows "No breakpoint for Ampicillin 10 µg"; with no disk lot picked, the panel's default content is used.
- **AC-R-29** A CLSI SDD row gives SDD; a EUCAST I shows "Susceptible, increased exposure"; WHONET export carries the SDD code.
- **AC-R-30** An environmental isolate is interpreted with ECOFFs (WT/NWT) by default; a clinical isolate's ECOFF result is visible to staff but never printed.
- **AC-R-31** A seed pack whose OpenELIS interpretations differ from the package's `as.sir()` test vectors for any row is refused with the count of differences.
- **AC-R-32** No veterinary breakpoint rows are loaded.
- **AC-Q-01 to AC-Q-120**: the V2 QA carry-forward criteria are in Part C, each beside its QA requirement ID.
- **AC-R-33** An analyzer result with an antibiotic abbreviation from the package's synonyms list maps to the right antibiotic without a manual mapping.
- **AC-R-34** At 1024 px the Case view, Worklist and every Microbiology reference data page show no horizontal page scroll; with a 130% pseudo-locale no button, tag, table heading or field label is clipped (D-289).
- **AC-R-36** A rule "Resistance profile is CRE, ESBL, MRSA or VRE" with a custom email: validating an ESBL *K. pneumoniae* AST run sends one email with the lab number, organism, profile, sample type and ward and no patient name, and adds a "Sent" row with method "Email, automatic" to the case's Critical communication that needs no acknowledgement; nothing is sent before validation (R-22, D-295).
- **AC-R-37** With no email configured or a failed send, the case row reads "Not sent" with the reason and the case appears in Needs attention (R-22).
- **AC-R-38** On a VITEK AST run, Record control result with the *E. coli* ATCC 25922 control lot shows one row per antibiotic with its expected range; all in range records Pass and, for a lot in QC Pending, sets the lot to QC passed; one out of range records Fail, opens an NCE and holds the covered results at validation, as built (R-23).
- **AC-R-39** AST control results are stored as QC results and never appear in the antibiogram, WHONET, GLASS or surveillance counts (R-23).
- **AC-R-40** On the AST panel editor, an agent's Tier offers 1, 2, 3 and 4 (On request); a Tier 4 agent is last on the AST run and starts unticked (D-313).
- **AC-R-41** Importing Enterobacterales rows Cefotaxime (Tier 1), Ceftriaxone (Tier 1), Cefepime (Tier 2, triggers CTX;CRO), Meropenem (Tier 2, triggers CTX;CRO) and Ceftazidime-avibactam (Tier 3, triggers ETP;IPM;MEM): with only ceftriaxone tested and R, cefepime and meropenem are suggested; with meropenem then R, ceftazidime-avibactam is suggested; with ceftriaxone S nothing is suggested (D-315, D-316).
- **AC-R-42** Importing Tetracycline (Tier 2, no trigger agents) shows it under "Needs a condition" in Import Review; after Apply it appears in the AST rules page's Needs a condition list, and on a case it starts unticked with the reason "Cascade: no condition set" (D-314).
- **AC-R-43** With Staphylococcus spp. / Ceftaroline Don't report and *S. aureus* / Ceftaroline Cascade (OXA is R), an MRSA isolate suggests ceftaroline and an oxacillin-resistant *S. epidermidis* does not; with Staphylococcus spp. / any / Clindamycin Report and Staphylococcus spp. / Urine / Clindamycin Don't report, clindamycin starts unticked on a urine isolate only (D-317).
- **AC-R-44** With the full organism seed loaded, opening Identify does not download the organism list; "kleb pn" shows *Klebsiella pneumoniae* first, the WHONET code "eco" finds *Escherichia coli*, and Search all opens the search dialog with the text filled in (FR-R13.1b; reference search AC-S-01 to AC-S-05).
- **AC-R-45** An order with Blood culture on four bottles (aerobic and anaerobic container types, sets 1 and 2) and RPR shows in What this order will open one Blood culture case with 2 sets and 4 bottles and "RPR stays in Results", as built; after Save the notification reads "Blood culture: case {case} in Microbiology" with a link, and the case holds four culture rows (D-323, D-325).
- **AC-R-46** On an Isolate sample, Bacterial culture marked tested elsewhere by Port Moresby General Hospital Laboratory with the reported organism "Enterobacter aerogenes" stores *Klebsiella aerogenes* (Formerly Enterobacter aerogenes); the case opens with ISO-1, Reported identification *K. aerogenes*, and suggests the Enterobacterales default panel with the reason "Reported by Port Moresby General Hospital Laboratory" without adding it (D-324, FR-R24.6).
- **AC-R-47** The order entry test chooser offers no AST panel, the lab's or a sender's; the sender's AST is entered on the case as a Tested elsewhere panel (D-324, AC-R-21).
- **AC-R-48** With CLSI 2026 loaded, changing *Enterobacterales* / ciprofloxacin / MIC to S ≤0.06, R ≥0.5 with reason "National guideline 2025" leaves the pack row unchanged, shows the row with a Local Tag and both values, and records the change in History; a ciprofloxacin MIC of 0.25 then reads R, with the source "CLSI M100 36th ed., local: National guideline 2025" (D-326).
- **AC-R-49** Loading a new CLSI pack version in which that row changed lists it in Import Review with Keep local and Use pack value; choosing Use pack value switches the local row off and the History records it; the pack's test vectors still report 0 differences (FR-R25.5, FR-R25.6).
- **AC-R-50** A local breakpoint with S ≥ R is refused with "Susceptible must be below resistant"; saving without a reason is refused (FR-R25.3, FR-R25.6).
- **AC-R-51** For an antibiotic with pack breakpoints at 10 µg only, adding a local 30 µg disk breakpoint (reason given) makes a zone read on a 30 µg disk lot interpret with it; a 30 µg zone before that change reads "No breakpoint for {agent} 30 µg"; the antibiotic's breakpoint list shows both contents, the 30 µg row Local (D-327, FR-R15.2).
- **AC-R-52** On the blood culture case there is no separate AST / DST section; Isolates and susceptibility shows ISO-1 opened, with the ESBL, cascade and intrinsic ampicillin alerts as notifications, then one list of 12 antibiotics from the VITEK 2 run, each with its WHONET code under the name (for example CRO_NM), its MIC, interpretation, the From Tag VITEK 2 and its Report tick (D-329, D-330, D-332).
- **AC-R-53** With Enter new results as Disk diffusion, after adding the suggested Enterobacterales disk diffusion supplement, typing 18 for ceftazidime-avibactam shows its interpretation at once and From shows that panel; Enter moves to the next untested antibiotic; "R" typed alone shows "R*" and a flag; Save results creates a manual disk diffusion run on ISO-1 and writes the Timeline; nothing is validated (D-331, FR-R26.5).
- **AC-R-54** Run details and QC on ISO-1 opens to the panels table, run setup, Reagents, QC & Controls, the per-run readings with Record reading, attempts, the resistance profile and run notes, each working as before the merge (FR-R26.6).
- **AC-R-55** On the received isolate case, the list shows the sender's interpretation under each row and a notification that some antibiotics differ from the sender; acknowledging at validation works as v2 FR-02.13c (FR-R26.3, FR-R26.4).
- **AC-R-56** Worklist › Isolates lists one row per isolate with S, I, R columns for the lab's antibiotics; filtering Resistant to MEM leaves only isolates with meropenem R; a row opens its case with that isolate open (D-333).
- **AC-R-57** On the blood culture case ISO-1 shows "Panels on this isolate" with the VITEK 2 Tag; there is no Panel for this organism or All antibiotics choice. Adding the suggested supplement adds a second Tag "Not started" and ceftazidime-avibactam, fosfomycin and colistin as untested rows; Add antibiotic › Tigecycline adds a row From "Supplementary · not started" (D-334, FR-R26.4a).
- **AC-R-58** Every section shows its purpose sentence when open; the case bar links read Culture and readings and Report and release (FR-R27.1, FR-R27.2).
- **AC-R-59** On the blood culture case with one incoming result, the case bar shows "Next: Place 1 incoming results" and the link scrolls to Incoming results. On the received isolate case, with nothing incoming and the AST run unvalidated, it shows the AST validation blocker and links to Isolates and susceptibility (FR-R27.3).
- **AC-R-60** On the received isolate case, Incoming results, Case information, Initial testing and Culture and readings open closed with a green Complete Tag and a summary line; Isolates and susceptibility and Report and release are open with no Tag. Opening a Complete section by click, Enter or Space works and it stays open (FR-R27.4, FR-R27.5).
- **AC-R-61** With Culture and readings Complete and closed, a new incoming culture reading removes its Complete Tag and opens it; a section opened by the user is never closed by the page (FR-R27.5).
- **AC-R-62** The From, Report and Cascade Toggletips open by click and keyboard, close with Escape and read their localized text (FR-R27.6). No section shows a Help link.
- **AC-R-64** On AST rules, Interpretation rules show an Action column; a Klebsiella isolate with ampicillin measured S shows "Flag: Unlikely result: check the identification and repeat the test" in its alerts, validation is blocked until Acknowledge flags is done with a reason, and the Timeline names the rule (FR-R6.6 to FR-R6.8).
- **AC-R-65** A lab-written Flag "Vancomycin tested by disk diffusion" on *Staphylococcus* fires when a vancomycin disk reading is saved on an *S. aureus* isolate, does not change its interpretation and sends no email (FR-R6.6, FR-R6.7).
- **AC-R-66** On the blood culture case, Add panel opens "Add AST panels to ISO-1" directly under Panels on this isolate, in view and with focus on its title; For this isolate lists only panels targeted at *K. pneumoniae* complex, *Klebsiella*, Enterobacterales or Gram-negative for blood or any sample type, grouped in that order, with VITEK 2 AST-N405 shown as On ISO-1 (FR-R28.1 to FR-R28.3, FR-R28.6).
- **AC-R-67** All panels shows the catalog total; searching "staph" lists the Staphylococcus panels, each with "Not targeted at Klebsiella pneumoniae"; the urine disk set shows "Set up for Urine, not Blood culture bottle"; Method Disk diffusion narrows the list and shows a count; no request loads more than 20 panels (FR-R28.4, FR-R28.5).
- **AC-R-68** Picking two panels and Add panels closes the chooser, outlines the two new Tags, shows "Added ... to ISO-1" and lists their antibiotics as not started; the Timeline has one entry per panel (FR-R28.7).
- **AC-R-69** With ISO-1 open, Re-identify closes the isolate work and opens "Re-identify ISO-1" directly under the ISO-1 row, scrolled into view below the case bar, focus on its title, with the current organism shown and the note on what re-identifying changes; Notes and Open behave the same way, one at a time; Close returns focus to the button (FR-R28.8 to FR-R28.10).
- **AC-R-70** On the blood culture case, adding Klebsiella extended disk set lists Amoxicillin and Ticarcillin as R with "Expected R, no test needed" and no input; Enter from Cefoxitin skips them; the chooser row said they would not be tested. With Skip testing off on the Klebsiella Always R rule, they appear as ordinary untested rows (FR-R29.1).
- **AC-R-71** Adding the Enterobacterales disk diffusion supplement shows, before anything is typed, "No disk breakpoint for colistin. Test by broth microdilution (MIC)." on the colistin row and the fosfomycin warning on its row; the chooser row listed both; Add antibiotic labels Tigecycline "(no breakpoint for this method)" (FR-R29.2).
- **AC-R-72** ISO-1's list is grouped under class headings in the fixed order with the ESBL test last; the top line reads "Resistance MDR Non-susceptible in 5 of 7 antibiotic categories tested. XDR and PDR need all 17 categories tested."; ampicillin (expected R) is not counted; an alert rule on MDR fires on validation as before (FR-R29.3, FR-R29.4).
- **AC-R-73** A saved ceftriaxone MIC result carries the LOINC for ceftriaxone by MIC in the FHIR Observation; the BD EpiCenter mapping screen suggests Ceftriaxone for an unmapped "CRO" code and maps it only after Accept (FR-R29.5).
- **AC-R-74** On a EUCAST lab, ciprofloxacin I shows "High dose: 0.75 g x 2 oral or 0.4 g x 3 iv" in the isolate list and at validation; on a CLSI lab nothing is shown (FR-R29.6).
- **AC-R-75** With the seed pack loaded and the locale French, Gentamicin reads "Gentamicine", the class heading shows the seeded French class name (Spanish: "Aminoglucósidos"), and Coagulase-negative Staphylococcus reads "Staphylocoque à coagulase négative"; a lab's edit to a name survives a pack reload (FR-R29.7).
- **AC-R-63** A case with no isolates shows "No isolates yet. Add one when a culture grows." and with nothing waiting, Incoming results reads "None waiting." (FR-R27.6).
- **AC-R-35** Dismiss with a reason writes "Dismissed {suggestion} on {isolate}: {reason}" to the Timeline (D-290). A rule note has no Remove action; when an override changes ceftriaxone from R to S before release, the "When R" note no longer shows or prints (D-291).

---

## Decisions

Decision numbers to be confirmed at registry upkeep (the repo's highest is D-249).

| ID | Decision |
|---|---|
| D-250 | Reportability is a lab-level **reporting table** keyed on antibiotic, with optional organism level and sample types; not a per-panel setting (Casey, 2026-10-19; table form per D-271). |
| D-251 | Reporting rules set only the **starting tick**; every result is still collected, stored and exported; technicians and validators can always override (Casey, 2026-10-19). |
| D-252 | Report default values are Report, Don't report, Report only if R and **Cascade** (Casey, 2026-10-19). |
| D-253 | Starters for CLSI and EUCAST, generated from the AMR package where it can; the CPHL SOP is a real-world example and test fixture, not a seed (Casey, 2026-10-19). |
| D-254 | Written as a **v3** delta; v2 is mostly shipped and stays as is (Casey, 2026-10-19). |
| D-255 | Default panels come from the **AST panel's own targeting** (organism or group, sample types, Default), matched like breakpoints; several can be added; added automatically (Casey, 2026-10-19). |
| D-256 | ~~Follow-ons are reflex rules with AST action targets~~ **Superseded by D-269**: antibiotic follow-ons come from Cascade reporting rules; reflex rules keep an AST input and a Suggest mode for non-antibiotic tests only. |
| D-257 | Reuse over new: one matcher for breakpoints and rules, sample types instead of a specimen group entity, `reportBehavior` filled by the reporting rules, reading overrides for expert rules, external notes for comments, the shared import pipeline for import, history and national packs (Casey, 2026-10-19). |
| D-258 | AST panels already stay out of order entry; no work beyond a guard AC (Casey, 2026-10-19). |
| D-259 | The **Test Rules Authoring MVP is a blocker** for Cascade (R-03), suggestions (R-04), the reflex AST input (R-05) and conditional expert rules (R-06), and is included in the v3 Jira; no interim extension of the legacy reflex model (Casey, 2026-10-19). |
| D-260 | Bring the AMR reference data model and seed into v3 (Part B) rather than a separate spec (Casey, 2026-10-19). |
| D-261 | Organisms carry taxonomy and several groups; **one shared hierarchy matcher** replaces the organism, group, any lookup everywhere (R-12). |
| D-262 | Organisms and antibiotics are seeded from the AMR package with synonyms, renames, SNOMED, LOINC and codes; reported history keeps old names (R-13, R-19). |
| D-263 | Breakpoints key on **indication** and **disk content**; the sample type gives the default indication; agents with two indications are interpreted twice and chosen on Report choices (R-14, R-15; see D-272). |
| D-264 | Categories add SDD and WT/NWT; EUCAST "I" wording; ECOFFs for environmental isolates; veterinary rows not imported (R-16, R-17). |
| D-265 | Breakpoints import from the package's native columns with **test vectors** from `as.sir()` as a release gate (R-18). |
| D-266 | Seed packs ship as separate data packs until the GPL-2.0 vs MPL-2.0 clearance is done (R-21). |
| D-267 | ~~Clinical context in Case information only~~ **Superseded by D-272**: no Clinical context field. |
| D-268 | Seed the **whole** organism list from the package, not a subset; pickers rank by commonness and resolve synonyms (Casey, 2026-10-19). |
| D-269 | **One Cascade rule tests and reports.** When its condition is met, an agent not on the isolate (or the matching panel holding all agents on that condition) is suggested; an agent on the isolate is ticked. Optional Add automatically. Reflex rules are needed only for non-antibiotic follow-on tests (Casey, 2026-10-19). |
| D-270 | **Interpretation changes are M-06 expert rules**, not reporting rules: Always R and inferred agents ("report as"), seeded from the package's interpretive rules, applied through the built override path. Reporting rules only decide the tick (Casey, 2026-10-19). |
| D-271 | **One reporting table per lab**, edited in place and audited; no profiles, versions, Draft or Active states. Starters and imports arrive as Import Review previews; the pipeline's run history is the version history (Casey, 2026-10-19). |
| D-272 | **No case Clinical context field.** The sample type gives the default indication; where two interpretations apply, both lines show on Report choices and the technician unticks the one that does not fit (Casey, 2026-10-19). |
| D-273 | **Disk content comes from the disk lot** picked at AST setup (disk inventory item carries antibiotic and content); the panel holds a default content only for labs that do not track disks. **Suggestions are not stored**: computed from rules and results; a Dismiss is a Timeline entry (Casey, 2026-10-19). |
| D-274 | **Keep the V2 UI and UX.** v3 changes extend the shipped V2 screens and components (Case view, isolate and AST tables, Report choices, Worklist, catalog and micro admin pages) rather than redesigning them; new screens reuse V2 patterns (Casey, 2026-10-19). |
| D-275 | **One notes mechanism.** AST runs get the v2 Notes panel; reporting-rule notes land there as Send with Result notes tagged From rule (no Remove; see D-291) (Casey, 2026-10-20). |
| D-276 | **R, I and S shown once on the case.** The Report tick and its reason move into a Report column of the AST / DST table (where `reportBehavior` already lives on the run agent); Report choices shows one summary line per isolate's AST (Casey, 2026-10-20). |
| D-277 | **Status worked out, not stored.** Status comes from releases, tags from open referrals and amendments; one worklist Status filter covers both (Casey, 2026-10-20). |
| D-278 | **Suggestions in one place.** The strip on the isolate only; the v2 chooser is unchanged (Casey, 2026-10-20). |
| D-279 | **Readings use the v2 Record reading form**, with the qualifier dropdown added; no per-row entry panel (Casey, 2026-10-20). |
| D-280 | **Inoculate always visible** in + Start inoculation, disabled until a medium is picked (also closes the missing save button in the v2 drawing) (Casey, 2026-10-20). |
| D-281 | **Case state on top.** One status tag with Stage (the existing current step) as its subtitle, not two fields; STAT as a red tag beside the case number; a sticky case bar with case number, patient, status, STAT, section links, Release partial and Release final ("{count} missing" when blocked) (Casey, 2026-10-20). |
| D-282 | **Design notes kept apart from the product, and a build map for builders.** Product messages are Carbon inline notifications; design commentary and version chips sit in a layer that is off by default. Every area is marked built, v2 or v3 with the existing files and the only v3 changes allowed, in the preview (`BUILD_MAP`, `data-build`) and in `amr-micro-v3-build-map.md` (Casey, 2026-10-20). |
| D-283 | **One meaning per tag colour** (teal set by the system, purple referral or elsewhere, red R or STAT, green S or done, gray provenance and visibility; status colours fixed), Carbon status icons with text in the checklist, helper text in the secondary text colour, warning text at 4.5:1, and the final release confirmation as a Carbon Modal with focus trap, Escape and focus return (Casey, 2026-10-20). |
| D-284 | **Open in place, say only what is unusual.** Record reading and every Notes panel (culture row, test on a culture, isolate, AST run) open as an expanded row under the row that opened them, not below the table; Record reading scrolls into view and focuses its first field. The Report column shows a reason only when it is not the routine one (a cascade, an expert rule, an inferred agent, Don't report, or Changed by you); the full reason stays on the tick as a tooltip. Every input has a label, and every control is at least 32 px (Casey, 2026-10-20). |
| D-285 | **Molecular resistance is generic.** Any test whose coded result component is mapped to an antibiotic or class feeds the Molecular resistance table; the method (GeneXpert, line probe assay, multiplex PCR, sequencing) is the Method linked to the test, and an isolate may have none (Casey, 2026-10-20). |
| D-286 | **AMR for R data comes into v3 as versioned seed packs** through the reference data pipeline (organisms, synonyms and codes, groups, antibiotics, breakpoints with test vectors, intrinsic resistance and EUCAST interpretive rules as expert rules, dosage notes; R-08, R-12 to R-21); a newer package release is a new pack, previewed and applied through Import Review. **Streaming updates from a central source are after v3** (Casey, 2026-10-20). |
| D-287 | **One AST rules page, no tabs.** Reporting rules and interpretation rules (M-06) share one page in Microbiology reference data, with shared filters, Import, Export, History and one Preview (Casey, 2026-10-20). |
| D-288 | **CLSI tier content is entered by each lab from its own M100.** No open source exists and M100 cannot be redistributed; the existing panel agent tier field and a Tier column in the reporting rules import fill the report defaults. No CLSI pack ships in v3 (Casey asked for a source, 2026-10-20). |
| D-289 | **No sideways scrolling.** At 1024 px and wider the page never scrolls sideways; a table wider than its section scrolls inside that section. Status sits under the lab number on the worklist; method and standard share a column in AST. Text 30% longer (pseudo-locale) clips no button, tag, heading or label (Casey, 2026-10-20). |
| D-290 | **Small fixes.** Dismiss offers an optional reason in the same click (Not indicated, Tested elsewhere, Not available in this lab), written to the Timeline; admin names follow develop (Microbiology reference data, AST panels, Breakpoint standards) (Casey, 2026-10-20). |
| D-291 | **Rule notes follow the rules for every note.** Notes are not removed in OpenELIS, so a rule note has no Remove or Edit; it shows while its rule's condition is met, is stored with the report at release, and a wrong note is fixed in the rule. Supersedes the Remove and Undo of D-290 (Casey, 2026-10-20). |
| D-292 | **Resistant-organism alerts reach infection control by email, the way critical results already do.** Built test alert rules gain an "Organism or resistance profile" trigger; they fire on validated results, email the configured recipients without patient names, and log a row in the case's critical communication (Casey, 2026-10-20). |
| D-293 | **AST QC starts from the built Results Entry QC section.** The Reagents, QC & Controls section (control lots, `/rest/qc/results`, NCE hold) is reused on the AST run with one control row per antibiotic and expected ranges from the packs; no separate QC list. EUCAST QC ranges ship, CLSI ranges are lab-entered (Casey, 2026-10-20). |
| D-294 | **Remaining best-in-class gaps go to Later:** a CLSI licence for tier and QC content, re-interpretation when breakpoints change, outbreak and cluster detection, and central streaming updates (Casey, 2026-10-20). |
| D-295 | **Automatic alert emails need no acknowledgement.** The critical communication row records the email as Sent; only a failed send needs action (Needs attention). The rule's existing acknowledgement option stays available, off by default (Casey, 2026-10-20). |
| D-313 | **The panel agent tier is 1 to 4.** CLSI M100 has four tiers; the built tier picker stops at 3. Tier 4 ("On request") starts unticked and sits last on the run (Casey, 2026-10-21). |
| D-314 | **A Cascade rule can exist without a condition.** CLSI Tier 2 agents with no Tier 1 agent in their row (cefoxitin, tetracycline, penicillin, linezolid) leave the cascade to the lab. Such a rule never fires, starts the agent unticked, and is listed under Needs a condition until the lab writes one (Casey, 2026-10-21). |
| D-315 | **The reporting rules import carries Trigger agents as well as Tier.** M100 shows cascades as row boxes, and Tier 3 agents cascade on Tier 2 agents, so a Tier column alone cannot express them; "any of these is R" is generated from the trigger list. Replaces the "same class" wording of FR-R8.2 (Casey, 2026-10-21). |
| D-316 | **"X or Y" agents need no group field.** Each agent gets its own rule; the lab keeps the one it tests on its panel, and a condition naming both is met by whichever was tested (Casey, 2026-10-21). |
| D-317 | **Species limits and specimen exclusions are ordinary rows.** Footnotes such as "*S. aureus* only" or "not routinely reported from urine" become a species-level row or a Don't report row for those sample types, which best match already handles; no restriction or exclusion field (Casey, 2026-10-21). |
| D-323 | **Keep the built "What this order will open" summary.** It is already on develop and reads the save's rules on the server, so it needs no rework; v3 adds a reported-organism line for received isolates and links to the opened cases after Save (Casey, 2026-10-21). |
| D-324 | **Received isolates come in through Tested elsewhere on the culture test row.** Performing laboratory from Organizations and the reported organism from the reference search, so it is coded; no AST panel is ordered at reception, the lab's or the sender's; both are added on the case. Amends v2 FR-02.13 and FR-02.13b (Casey, 2026-10-21). |
| D-325 | **Blood culture bottles are container types of one sample type** (Clinical Order Entry v4), so one case per order, sample type and lab unit groups a set without the "whatever their sample type" exception (Casey, 2026-10-21). |
| D-326 | **Local breakpoints are a layer over the pack, with a reason and history.** The pack row is never edited; at equal specificity the local row wins; a new pack version lists where it now differs, for the lab to keep or drop. Replaces develop's edit-in-place and import refusal (Casey, from Mohamed, 2026-10-23). |
| D-327 | **The concentrations labs change are disk contents, each with its own breakpoints** (for example 10 or 30 µg). Labs pick the content they use per antibiotic and add or change the breakpoint for each; MIC ranges and TB critical concentrations are not part of this change (TB critical concentrations stay with OGC-916) (Casey, from Mohamed, 2026-10-23). |
| D-328 | **A breakpoint change does not alter validated results.** It applies to readings saved after it; unvalidated readings re-interpret on their next save with a Timeline entry; re-interpreting past results stays in Later (D-294) (Casey, 2026-10-23). |
| D-329 | **Isolates are organised like WHONET, in OpenELIS screens.** Isolates and AST / DST become one section; each isolate opens in place with alerts, one antibiotic list across its runs and its runs and QC inside. Every built function stays. Replaces the separate WHONET-style Record of draft 0.26 and reverses D-274 for these two sections (Casey, from Mohamed, 2026-10-23). |
| D-330 | **One antibiotic list per isolate, names first, WHONET codes under them** (antibiotic, guideline, method, disk content: CRO_ND30), each value tagged with the run it came from (Casey, 2026-10-23). |
| D-331 | **WHONET's keyboard entry inside the list**: Enter moves to the next antibiotic, off-scale values typed with their qualifier, zones below 6 mm stored as 6, and S, I or R accepted without a measurement but flagged (Casey, 2026-10-23). |
| D-332 | **The isolate's alerts are Carbon notifications that gather what OpenELIS already works out** (expert rules, cascades, resistance profiles and alert emails, QC, sender differences); no new alert logic (Casey, 2026-10-23). |
| D-333 | **The worklist gains an Isolates view**, one row per isolate with the lab's antibiotics as S, I, R columns, like WHONET's database view; interpretations only, nothing counted for surveillance (Casey, 2026-10-23). |
| D-334 | **Panels on the isolate are AST panels, shown as Tags with Add panel and Add antibiotic; no WHONET-style display filter.** Every antibiotic row comes from a panel on the isolate or from Add antibiotic (supplementary run). WHONET's Panel choice only filtered which antibiotics were displayed, which clashed with OpenELIS panels that are ordered and run; the block below the list is renamed Run details and QC (Casey, 2026-10-26). |
| D-335 | **Every section starts with one sentence saying what it is for, and two sections take task names**: Culture and readings, Report and release (Casey, 2026-10-26). |
| D-336 | **The case bar shows the next step**, worked out from incoming results and the final-release checks; it only links to the section (Casey, 2026-10-26). |
| D-337 | **A section is Complete when no final-release check is left for it** (the readiness blockers behind Release final; Incoming results when nothing is waiting; Report and release when Final). Complete sections start closed with a summary, never close while someone has them open, and reopen when new work arrives. Replaces "collapse sections when done" as first proposed (Casey, 2026-10-26). |
| D-338 | **Empty states say what will appear, and WHONET-sensitive terms get Carbon Toggletips.** A Help link per section waits until OpenELIS has an in-app help menu and the user documentation is written (Later) (Casey, 2026-10-26). |
| D-339 | **Expert rules gain a Flag action** for WHONET-style alerts (unlikely results, methods not recommended, important resistances, infection control prompts). A flag never changes a result, shows in the isolate's alerts and is acknowledged through the built Acknowledge flags step before validation. Starter flags come from the expected phenotypes; no WHONET alert library is shipped (AMRIE is non-commercial). Amends D-332, which said no new alert logic (Casey, from the WHONET primer, 2026-10-26). |
| D-340 | **Surveillance analysis is a separate epic after v3**: first-isolate statistics and the cumulative antibiogram first, then a GLASS export with a data check report. v3 stays focused on the bench; the WHONET export covers analysis until then (Casey, 2026-10-26). |
| D-341 | **Bulk isolate import is a separate epic**, scoped with the surveillance epic, so labs can import historical and third-party isolate files the way WHONET's BacLink does (Casey, 2026-10-26). |
| D-342 | **Add panel uses the panel's own targeting to narrow a large catalog.** For this isolate shows only panels targeted at the organism (best to broadest level) and sample type; All panels searches everything with a warning on panels not set up for the organism; search and filters run on the server. Replaces the v2 test and panel chooser for AST panels; suggestions stay in the strip (D-278) (Casey, 2026-10-26). |
| D-343 | **Whatever opens in place says what it is and comes into view.** One panel open per isolate row, directly under it; a title naming the action and record, scroll into view below the case bar, focus on the title, a brief outline, focus back on Close. Extends D-284 (Casey, 2026-10-26). |
| D-344 | **Expected resistance is shown as R and not tested**, with a per-rule Skip testing switch (on by default) for labs that test such agents on purpose (Casey, 2026-10-26). |
| D-345 | **Say before testing when no breakpoint exists** for the organism, guideline, method, disk content and indication, with what to do instead; never blocking (Casey, 2026-10-26). |
| D-346 | **The isolate's antibiotics are grouped by class** from the antibiotic master, in a fixed class order (Casey, 2026-10-26). |
| D-347 | **MDR, XDR and PDR are worked out on the isolate in v3** from the Magiorakos 2012 categories mapped to antibiotic classes; XDR and PDR only when every category was tested; expected resistance not counted. Moves this item out of the surveillance epic (D-340) (Casey, 2026-10-26). |
| D-348 | **AST results carry the antibiotic's LOINC for their method, and analyzer mapping screens suggest mappings** from the package's codes, abbreviations, synonyms and LOINC, applied only when accepted (Casey, 2026-10-26). |
| D-349 | **On EUCAST labs, an I shows its high dose** from the package dosage data (Casey, 2026-10-26). |
| D-350 | **French and Spanish names for antibiotics, classes and organism groups are seeded from the package** as editable starting translations (Casey, 2026-10-26). |
| D-Q1 | Final release asks for confirmation and states what will happen; partial release stays one click (Casey, 2026-10-19). |
| D-Q2 | Identification methods come from the shared Method dictionary filtered by a Microbiology identification flag; no separate list (Casey, 2026-10-19). |
| D-Q3 | Molecular resistance results (from any mapped test, D-285) show in a Molecular resistance block alongside DST, feed the TB classification, and discordance with phenotypic DST is flagged (Casey, 2026-10-19). |
| D-Q4 | A culture test is the heading of its Culture section and carries the culture result; never listed in Initial testing (Casey, 2026-10-19). |
| D-Q5 | **No Case role and no Culture checkbox.** A culture test is one with culture media linked; Inoculate adds the culture test for the chosen medium to the order on that sample when it is not already there, so several cultures from one sample are separate tests traced to the sample; inoculations belong to their culture test. Direct tests stay separate tests ordered or added as needed. Nothing is pre-created, so unused work never appears. The component model (one test with direct and culture components) was considered and rejected because validation, release, referral and analyzer mapping are per test in OpenELIS (Casey, 2026-10-19). |
| D-Q6 | Case and worklist statuses are In progress, Partial, Final and Amended. Referred, Referral returned and Amendment open are tags that can sit beside any status, because referrals run alongside local work and partial release; referred rows keep the existing referral status tag. Transfer is not a status (Casey, 2026-10-19). |
| D-Q7 | MIC qualifiers are picked from a dropdown beside the number; analyzer readings fill the same row inline with value, qualifier and source (Casey, 2026-10-19). |

---

## Delivery and Jira

The v3 Jira Epic includes the Test Rules MVP as a blocking story group. What can start before it lands and what cannot:

| Work | Depends on Test Rules MVP? | Notes |
|---|---|---|
| Test Rules Authoring MVP (rule list, compose editor, condition tree, Order action, migration of existing reflex rules) | **It is the blocker** | Scope as in its FRS; the micro additions below are separate stories that extend it |
| R-01 Default panels from panel targeting | No | Can start now |
| R-02 Reporting rules (Report, Don't report, Report only if R, notes), R-07 applying to the case | No | Can start now; Cascade rows are saved but evaluate only once the condition tree exists |
| R-06 Expert rules (M-06): Always R and inferred agents | Partly | Unconditional Always R rules can ship before the MVP; inferred-agent rules ("if X is R then Y is R") use the condition tree |
| R-08 Starter content, R-09 import through the pipeline, R-10 admin page | No (R-09 depends on the reference data pipeline P1a/P1b) | Admin page's Cascade condition editor reuses the MVP compose mode |
| R-03 Cascade evaluation and Cascade suggestions | **Yes** | Uses the MVP condition tree plus the AST predicates (FR-R5.1) |
| R-05 AST condition input and Suggest mode on reflex rules | **Yes** | Extensions to the MVP; no new action targets |
| R-04 Suggestion strip (computed), Needs attention | **Yes** (needs R-03) | Default-panel suggestions after re-identification (FR-R1.4) can ship with R-01 |
| R-12 Taxonomy and shared matcher | No | **Foundation for Part A matching**: R-01, R-02 scope, R-04 and M-02 all use it, so it goes first |
| R-13 Organism seed, R-19 Antibiotic master | No (pipeline P1a for loading) | Seed packs gated by R-21 |
| R-14 Indication, R-15 Disk content, R-16 Categories, R-17 ECOFF | No | Change AST entry (M-05) and exports (M-09, M-15) |
| R-18 Native breakpoint import with test vectors | No (pipeline P1a) | Test vectors generated with the package in the pack build |
| R-20 Dosage notes | No | With R-08 starters |
| R-21 Licensing | Gate on shipping any seed pack | Legal clearance, not engineering |
| R-22 Resistant-organism alerts (trigger type, evaluation on micro validation, automatic critical communication row) | No | Uses the built test alert rules and the OGC-439 email engine; profiles come from the existing classification |
| R-23 AST QC (Reagents, QC & Controls section on the AST run, one control row per antibiotic, QC range domain) | No (QC range domain needs pipeline P1a) | Reuses OGC-1024, OGC-1025 and OGC-1147; frequency comes from the Runs control policy (OGC-1200) |
| AMR for R seed packs (D-286): build the packs from the package release (organisms, groups, antibiotics, breakpoints with test vectors, intrinsic resistance, interpretive rules, dosage notes) and load them through the pipeline | No (pipeline P1a; R-12, R-13, R-18, R-19) | One story per pack domain, each with its test vectors; re-running on a new package release produces a new pack version |
| R-AST-5 Molecular resistance mapping on test result components (D-285) | No | Catalog editor field plus the case table |

Jira link types: the MVP stories **block** R-03, R-04, R-05 and the conditional part of R-06; R-12 **blocks** R-01, R-04 and the M-02 matcher change; R-21 **blocks** release of any seed pack (not development).

---

## Decisions from QA (asked one at a time; all seven decided 2026-10-19)

Not decided in this spec. Each affects the Part C rows marked Pending.

| # | Decision | Affects |
|---|---|---|
| Q-1 | ~~Release confirmation (A7)~~ **Decided (D-Q1):** confirm final release only; partial release stays one click. | R-REL-1, AC-Q-60 |
| Q-2 | ~~Identification methods (A5)~~ **Decided (D-Q2):** the shared Method dictionary, filtered by a Microbiology identification flag. | R-ISO-1, AC-Q-40 |
| Q-3 | ~~Molecular TB results (A24)~~ **Decided (D-Q3):** shown alongside the DST table in a Molecular resistance block; the classification uses both and flags discordance. | R-AST-5, AC-Q-54 |
| Q-4 | ~~Culture tests in the case (A26)~~ **Decided (D-Q4):** as the heading of the Culture section, carrying the culture result. | R-OPEN-1, AC-Q-20 |
| Q-5 | ~~Catalog default Case role (A14)~~ **Decided (D-Q5):** no Case role, no checkbox; cultures are added by Inoculate from media links. | R-ADM-2, AC-Q-101 |
| Q-6 | ~~Status pill (A16)~~ **Decided (D-Q6):** In progress, Partial, Final, Amended; Referred, Referral returned and Amendment open as tags; no Transferred status. | R-CASE-3, AC-Q-12 |
| Q-7 | ~~MIC qualifiers (A6)~~ **Decided (D-Q7):** qualifier dropdown beside the number; analyzer values and qualifiers fill the row inline. | R-AST-1, AC-Q-50 |

## Open Questions

1. ~~Where does the CLSI tier content come from?~~ **Resolved (D-288):** the only source is CLSI M100 Table 1 (Tables 1A to 1D; Tier 1 routine testing and reporting, Tier 2 routine testing with cascade reporting, Tier 3 routine testing in institutions serving patients at high risk of MDROs with cascade reporting, Tier 4 on clinician request). No open, machine-readable copy exists: the AMR for R package has none, and WHONET's AMRIE data covers breakpoints, ECOFFs and QC ranges but not tiers. M100 is copyrighted, and CLSI's free read-only access does not grant redistribution, so v3 ships **no CLSI tier pack**. Each lab enters the tiers from its own M100 into the existing **tier field on the AST panel agent** (`MicroAstPanelAntibiotic.tier`), and the reporting rules import offers a Tier column that fills the report default: Tier 1 Report, Tier 2 and Tier 3 Cascade on the row's Trigger agents (FR-R9.5; no triggers gives a Cascade rule with no condition, FR-R3.7), Tier 4 Don't report. The panel tier picker takes 1 to 4 (FR-R1.6, D-313). Checked against M100 Ed36 Tables 1A-1, 1B-1 and 1C on 2026-10-21 (D-313 to D-317); `clsi-reporting-rules-setup-guide.md` walks a lab through it. The EUCAST starter still ships from the package (R-08, R-21). A CLSI starter pack would need a licence from CLSI; whether to seek one is a business decision, not a v3 requirement.
2. ~~Test Rules MVP sequencing~~ **Resolved (D-259):** the Test Rules MVP is a blocker and part of the v3 Jira.
3. ~~One reporting table per lab or per lab unit?~~ **Resolved (D-271, confirmed by Casey 2026-10-20):** one reporting table per lab.
4. ~~Antibiogram~~ **Resolved:** M-13 §4.4 already says the selective and cascade reporting configuration decides which agents are "routinely reported". The antibiogram uses the lab's reporting profile (agents whose default is Report for that organism and sample type).
6. ~~Clinical context capture~~ **Resolved (D-272):** no Clinical context field.
7. ~~Organism seed size~~ **Resolved (D-268):** seed the whole list; rank pickers by commonness.
5. **CPHL example only:** rows marked "confirm" in the companion CSV matter only if CPHL adopts reporting rules built from it.
8. ~~Which concentrations do labs change?~~ **Resolved (D-327):** disk contents, for example 10 or 30 µg, each with its own breakpoints (Mohamed, via Casey, 2026-10-23).
9. **WHONET-style admin screens.** Should Microbiology reference data also follow WHONET's Laboratory configuration (a local antibiotic list chosen from the full list, each with guideline, method and disk content, and General and Species-specific breakpoint tables)? Not in v3 yet; the case record (R-26) does not depend on it.

---

## Later (not in v3)

- **CLSI content licence** for Table 1 tiers and QC ranges, so CLSI labs do not start empty (D-288, D-294). A business decision.
- **Re-interpretation after a breakpoint change**: when a new pack version lands, list past results whose interpretation would now differ, for review and an amendment where needed (D-294).
- **Outbreak and cluster detection** across isolates (also listed as future work on the V2 epic OGC-1383) (D-294).
- **Streaming updates from a central source** (a hub or subscription that pushes new AMR for R releases and national packs to labs). In v3 a lab loads a new pack version by import (D-286).
- **National packs** of reporting rules, expert rules and panel targeting through the pipeline layers (R-09).
- **M-08 macros** for reporting notes.
- **Help link per case section** (held from R-27, D-338): a link in each section header to that section's page of the user manual, once OpenELIS has an in-app help menu and the Microbiology documentation is written.
- **Surveillance analysis epic** (D-340): first-isolate de-duplication (CLSI M39), percent R, I and S with distributions, isolate listings, the cumulative antibiogram (using the reporting table to pick routinely reported agents), then a GLASS export with a data check report. Low-frequency alerts learned from the lab's history follow; MDR, XDR and PDR on the isolate are in v3 (R-29). Until then labs analyse in WHONET through the built WHONET export.
- **Bulk isolate import epic** (D-341), scoped with the surveillance epic: import isolate files from spreadsheets, instrument exports and other LIS (the role of WHONET's BacLink), mapped to OpenELIS organism and antibiotic codes, so a lab can report surveillance from OpenELIS before moving its bench work.
- **Isolate storage tracking** ("store all CRO or CAZ R Enterobacteriaceae").

## Out of scope

- Veterinary breakpoints (animal hosts).

- Changes to how breakpoints interpret readings (M-02) and to M-06 expert rule logic; local breakpoint values and disk contents are in scope (R-25).
- Clinical significance and work-up criteria.
- Order entry choosers (already exclude AST panels).
