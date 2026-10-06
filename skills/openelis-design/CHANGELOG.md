# openelis-design — Changelog

## v3.27 (2026-10-06): monthly consolidation top-up

**What happened since 2026-10-01.** Design sessions kept writing skill-src, as its SKILL.md tells
them to, and took it from D-170 to **D-217** (v3.17 to v3.26 below: Microbiology v2 drafts 9.2 to
10.5, Patient Report v2.4.x, the reuse MUST F with `/analyze` Pass O, Handling groups). Skill-src
also used **v3.17** for its own 2026-10-01 entry, so the branch's consolidation entry is relabelled
`v3.17-consolidation` below.

**What this pass did (same branch `skill/consolidation-2026-10`, still unmerged):**
- Re-based `SKILL.md`, `decision-log.md`, `spec-registry.md`, `CHANGELOG.md` and
  `design-addendum.md` on skill-src as of 2026-10-03, then re-applied the 2026-10-01 corrections
  (D-017 superseded, EQA V2 / Reagent / Inventory rows, four new registry rows, Sample Type typeahead
  MUST, the re-merge note). Files skill-src has not touched since 2026-09-30 keep the branch version.
- Decision IDs: the four repo-only decisions collided a third time (skill-src now uses D-171 to
  D-174 for Microbiology) and move again: **D-171 → D-218, D-172 → D-219, D-173 → D-220,
  D-174 → D-221**. Next ID **D-222**. Map in the decision log's 2026-10-06 note.
- Constitution pointer re-synced **1.11.2 → 1.12.0** (2026-09-29, new Principle V.7 Test
  Isolation, MANDATORY). Low design impact; noted for acceptance criteria.

**Needs Casey (unchanged, now urgent):** pick one home for the skill source. Sessions number from
skill-src only, so any ID that lives only in the repo copy will keep colliding. Either merge this
branch and rebuild the installed skill from `skills/openelis-design/`, or copy D-218 to D-221 into
skill-src's decision log before the next design session.

---

# skill-src line (v3.17 to v3.26, 2026-10-01 to 2026-10-03), imported 2026-10-06

## v3.26 (2026-10-03)

- **Microbiology v2 draft 10.5** (risk review of 2026-09-30). D-211 to D-215: admission date for inpatients is Needed for
  surveillance and never blocks release; the WHONET field map follows the v2 Case information; susceptibilities keep their
  organism, isolate and specimen links; placements are confirmed at validation; hand-added tests are tagged and on the
  Timeline. Delivery target: the November 2026 CPHL training build, hard final before the December contract end.

## v3.25 (2026-10-02)

- **Reuse check (SKILL v3.12).** New design-addendum MUST F: reuse built OpenELIS mechanisms, no parallel implementation.
  `/analyze` gains Pass O (Parallel Mechanism), `/specify` Stage 2 a Reuse inventory item, and `/checklist` a Reuse of
  built mechanisms category.
- **Microbiology v2 drafts 10.3 and 10.4, Patient Report FRS v2.4.3.** D-183 to D-210: catalog tests on cultures, In lab only
  from Reportable, Dictionary categories, Workplan bench sheet, reflex on the culture result; the Mohamed Gomaa review
  (live order summary, OpenELIS statuses and Block self-validation, explicit sets, received isolates, media lots, Used on
  cultures, one questionnaire record, overdue sorting, Partial releases); media links on the culture test (no Plating
  templates), notes in the note table, Reporting track as a Dictionary category, per-container labels.

## v3.24 (2026-10-02)

- **Microbiology v2 draft 10.2 and Patient Report FRS v2.4.1.** D-181: a micro case prints under the sub-headers Initial
  testing, Culture, AST / DST and Additional testing (FR-A42a). D-182: a Gram stain can wait for its result; a positive blood
  culture bottle adds one by rule. The TB and blood culture examples are one Case view with two data sets.

## v3.23 (2026-10-02)

- **Microbiology v2 draft 10.1.** D-179: Extend incubation on any open culture row, with a reason, and Extend 24 h on
  Final read due. D-180: every positive row records Positive at (analyzer time or server time, editable) and shows the time to
  positivity in days, hours and minutes. The preview and mockup gain a blood culture AMR example case with reportable Gram stains.

## v3.22 (2026-10-02)

- **Microbiology v2 draft 10.** D-178: no culture type. Micro tests are a Yes / No switch with a Case role; a case is one
  order, sample type and lab unit; the case's Program (programs marked Show on Microbiology case, with a reporting track) brings
  its questions and decides the exports; Choose path and Change culture type removed. D-177: any number of case tests per lab unit.
  Clinical Order Entry v4 FR-B12a v0.19 and M-18 v0.10 aligned.

## v3.21 (2026-10-02)

- **Microbiology v2 draft 9.7.** D-177 supersedes D-175: case tests (Case role Case; any number per lab unit) let
  reception assign the case, and the technician chooses the path as step 1 of
  the case. No Program rule, no admin defaults. Clinical Order Entry v4 FR-B12a v0.18 aligned.

## v3.20 (2026-10-02)

- **Microbiology v2 drafts 9.5 and 9.6.** D-174 Print bench sheet and Open sheet on the Micro worklist; D-175 an order
  saved with Program = Microbiology opens a case for each sample (amends D-146); D-176 Inoculated at editable until the first
  reading. Clinical Order Entry v4 FR-B12a v0.17 aligned (Program case per sample; body site and time per sample).

## v3.19 (2026-10-02)

- **Microbiology v2 draft 9.4.** D-173: the culture work-up lives under each culture row (no Growth work-up section);
  every culture and subculture row has an Add menu (Gram stain, Test on this culture, Microscopy exam, Subculture); Gram stain has a
  Report this result switch; a culture can have several subcultures. Patient report FRS v2.3.4 aligned (FR-A42, FR-A43).

## v3.18 (2026-10-01)

- **Microbiology v2 draft 9.3.** D-172 supersedes D-171: bench work stays on the Micro worklist with no run and no batch
  record. Check due and Final read due filters with one-click and bulk No growth (replacing Mark checked and No change), and
  bulk Inoculate with one plating template and one lot per tracked medium.

## v3.17 (2026-10-01)

- **Microbiology v2 draft 9.2.** D-171: micro bench batches are Runs (OGC-1200, WORKPLAN source; methods Culture plating
  and Plate reading). Plate these and Read these on the Micro worklist work like Batch these and use the same run header, chips,
  summary bar, progress, tags and audit; the Bench view and the separate batch number are gone. Amends D-167.

---

## v3.17-consolidation (2026-10-01): monthly consolidation: the two lines re-merged

**What was wrong.** Two copies of this skill had been edited in parallel again. The installed skill
is built from `OpenELIS Feature Design/openelis-design-skill-src/`, and its SKILL.md tells sessions
that copy is the newest, so every design session since 2026-09-22 wrote there (v3.12 to v3.16,
D-067 to D-170). That folder is untracked, so those 104 decisions existed only on one disk. The
repo copy (`skills/openelis-design/`) was declared the single source on 2026-09-22 but stayed at
SKILL.md v3.3 and D-066, and a local 2026-09-09 change had retired it in the opposite direction.

**What this pass did (branch `skill/consolidation-2026-10`, for review):**
- Took the skill-src line as the base for `SKILL.md` (v3.11 body), `decision-log.md`,
  `spec-registry.md`, `verified-data-models.md`, `jira-conventions.md`, `ogc-workflow.md`,
  `module-inventory.md`, and added `docs-spine.md` and `test-catalog-data-model.md`, which the
  repo copy never had.
- Kept the repo copy where it was newer: `current-state-gotchas.md`, `admin-ia-inventory.md`,
  `carbon-anti-patterns.md` (plus the skill-src B8 row), `design-addendum.md` (plus the skill-src
  "labels, not counts" MUST), and the constitution pointer's history.
- Decision log: skill-src numbering kept; D-017 takes the repo status (superseded); repo-only
  decisions re-homed to **D-171** (explicit order-entry saving), **D-172** (lab number consumed on
  load), **D-173** (`/breakdown` one ticket, now marked implemented), **D-174** (API & Data Reuse,
  still missing from `frs-template.md`). Full ID map in the log's 2026-10-01 note. Gallery files
  that cite the repo-side IDs need re-pointing (listed there).
- Constitution pointer re-synced to **v1.11.2** (two PATCH amendments: frontend data-fetching,
  branch strategy; no principle changed).
- Shipped router re-read (bundle `index-DDcS0cc-.js`): EQA and QC moved under `/qa/*` with
  redirects, new Quality menu, Analyzer Error Dashboard gone, first Microbiology routes, and 60+
  admin editorKeys missing from the inventory. Recorded in `current-state-gotchas.md` and
  `admin-ia-inventory.md`.
- spec-registry: EQA V2 and Reagent ↔ Test rows still said *not built*; fixed. Inventory's storage
  dependency is delivered through develop PR #4016. Rows added for OGC-1362, OGC-1138, OGC-781,
  OGC-1194.
- Promoted from memory: Sample Type is a large set (MUST E, anti-pattern C1); "Lab Unit" is
  `test_section` (gotchas); Patient Entry Configuration, Dictionary, Patient form, Address
  hierarchy labels (verified-data-models).

**Needs Casey:** pick one home for the skill source and make the installed SKILL.md's "Registry
upkeep" section and the local checkout agree with it. Until then sessions must write both copies
(SKILL.md now says so and gives the next ID, D-175). 99 decisions are `provisional`, nearly all
from Casey's sessions in the last week; none were re-confirmed unattended.

---

# skill-src line (v3.4 to v3.16), imported 2026-10-01

## v3.16 (2026-10-01)

- **Microbiology v2 draft 9.** Nine provisional decisions, D-162 to D-170: every micro test opens or joins a case
  (one Microbiology case dropdown in the test catalog, with a Case role); blood culture sets as one sample per bottle with
  its own site, one case per order; media as tracked or not tracked Microbiology medium items with Add new (replaces D-148);
  plating templates in micro admin; tests on a positive culture reportable, microscopy exams under their culture, subculture
  from any row; bench batches (proposed); patient micro history and Refer to previous susceptibility; culture rows record the
  lot but never change stock; any note can be internal or external. Registry, data models, Clinical Order Entry v4 FR-B12a
  and M-18 v0.9 aligned.

## v3.15 (2026-09-29)

- **Report Print Queue r4 v2.2.** Two provisional decisions, D-149 and D-150: the user's own data
  export jobs join the queue as owner-only rows (Custom Data Export's My Report Queue panel merges
  in); every per-order report is exactly one of Partial, Final or Amended (GLOBAL), with print status
  as a separate filter. Registry row updated.

## v3.14 (2026-09-29)

- **Microbiology v2 draft 8.** Three provisional decisions, D-146 to D-148: reception orders the generic
  culture test like any other test and microbiology never reads Program (retires D-131; amends D-137
  and D-138); the inoculation medium comes from Inventory (new seeded item type Microbiology medium,
  required lot, one usage per culture row); untracked media are named from a per lab unit list, with
  the Not tracked mode remembered per lab unit. Registry rows for Microbiology v2, M-18 v0.8, Clinical
  Order Entry v4 v0.13 and Env/Vector Order Entry v4 v0.4.2 updated; verified data models gain
  `MicroCaseInoculation` and `InventoryItem`.

## v3.13 (2026-09-29)

- **Report Print Queue r4 registered.** Spec-registry row rewritten: the queue is rebuilt on the
  shipped Compliance Report page (`/LaporanHasil` merged into `/ReportPrintQueue`), covers patient
  reports, environmental and vector certificates, and supersedes the r3 child stories OGC-1032 to 1043.
- **Seven provisional decisions, D-139 to D-145**: one Amended state (GLOBAL); completing a partial
  report is a new version, not an amendment (GLOBAL); every released version archived with SHA-256,
  reprints return the archived bytes (GLOBAL); one typed-row queue page; certificates join on first
  release; nothing unprinted ages out; no-standard orders print "Not evaluated against a standard".

## v3.12 — 2026-09-26

- **Clinical Order Entry v4 registered.** New spec-registry row (OGC-1266, Epic, supersedes OGC-1066);
  Env/Vector order entry row marked to align to v4 section L, with pool numbering still open.
- **Fifteen provisional decisions, D-070 to D-084**: container types as a catalog entity, the sharing
  rule, whole-step atomic save, shared order-entry components, two-level required, server clock and lab
  time zone, "used as" equivalence, edit through the steps, required data on the row, body site and
  laterality end to end, panel integrity, panel code, `-1` / `-1.1` numbering (clinical), product wording
  ("Tested elsewhere", "Sample check", "Ready for testing"), and one Labels section with no print tracking.

## v3.11 — 2026-09-09

- **Runs FRS registered.** New spec-registry row *Runs (shared unit of QC, reagent lot, result review)*
  (OGC-1200, Epic, Samuel) plus the **seven sibling rows that were missing** and made `/crosscheck`
  blind to the whole QC/results neighbourhood: Results Entry (OGC-811), Analyzer Results Import v2
  (OGC-288), Batch Workplan reagent QC (OGC-427), Analyzer Manual QC (OGC-428), Manual & RDT QC
  persistence (OGC-1147), Test Catalog QC Targets, Westgard Phase 2. Registry 38 → 46 rows.
- **Four new decisions, D-052…D-055**: a run is the unit of QC/lot/review with exactly three creation
  sources and a manual save is a run of one (GLOBAL); QC verdicts are per test within a run and a
  later pass does not clear a hold (GLOBAL); control-per-run policy lives on the test in QC Targets;
  the run is information, not a table — `QcRun` is **not** the run record per OGC-1054 (engineering
  repo). D-046…D-048 remain reserved for the pathology decisions.
- **Constitution pointer re-synced to v1.11.1** (was 1.10.0): Principle VII now carries Key Reuse &
  Hygiene (search before minting, `common.*` canonical keys pending PR #3863, CI ratchet); v1.11.1
  corrected the frontend data-fetching stack. Every Localization table must cite REUSE keys.
- **Supersession notes** added at the top of the six sibling specs (analyzer-import-redesign-v2,
  results-entry-multicomponent, batch-workplan-reagent-qc, manual-rdt-qc-persistence,
  test-catalog-qc-targets, analyzer-manual-qc) pointing to the Runs FRS for the parts it now owns.
- **Convention reinforced:** `/breakdown` bodies stay in the four-section minimal style; OGC-428 was
  rewritten to it as the worked example (gallery + FRS + JSX links, no ACs in the ticket).

## v3.10 — 2026-09-09

- **The microbiology bundle is finally in the spec registry.** M-00, M-01, M-02, M-04, M-05, M-07,
  M-09, M-11, M-13, M-14, M-15 and the new **M-16 Cluster Detection** now have rows (26 → 38). Until
  now `/crosscheck` matched *nothing* for any micro feature, so every overlap had to be found by
  reading specs by hand — false confidence, which is worse than no registry. Build state is recorded
  honestly: M-04/M-05 "built on the OGC-782 branch, 2 High UAT findings open"; M-09 "dedup routine
  NOT built"; M-11 "idea / not built".
- **Three new decisions, D-049…D-051** (M-16 Cluster Detection): one isolate-selection/de-duplication
  implementation with M-09 as owner; detection in-app vs analytics external (extends D-041); and an
  alert budget of ~3–6 signals per lab per year as a *design target*, not an outcome.
- **ID-collision caught and corrected.** These three were first written as D-046…D-048, which were
  already claimed twice — by the 2026-08 consolidation plan (Test↔Reagent built / Label Presets built
  / alert ack built) and by `Claude outputs/pathology-v2/closing-actions.md` (Case View Shell, AP
  stage enum, identified-objects-not-counts). Renumbered to D-049…D-051; **D-046…D-048 are left free
  for the pathology decisions**, which have the earlier and more substantive claim. This is the same
  failure mode as the D-028/D-029 collision that blocked three gallery-ledger runs — the log needs a
  "next free ID" marker.
- **Three new registry hotspots**: the single de-duplication implementation; the **three separate GPS
  models** (`Person.gpsLatitude/gpsLongitude` from patient registration, `Sample`/`SampleItem`
  coordinates from order entry, and `VectorSamplingSite`) with **no environmental sampling-site entity
  at all**; and the detection-vs-analytics boundary.
- **Packaging fixed.** The shipped `openelis-design.skill` had been built from the stale
  `skills/openelis-design/` v3.3 fork — it carried a v3.3 SKILL.md and was **missing
  `docs-spine.md` and `test-catalog-data-model.md` entirely**, both cited in the skill's own reference
  table. This release is packaged from the reconciled v3.9 line. The v3.3 fork is retired.
- **Known weakness, not yet fixed.** Re-running the overlap scan against the populated registry
  returned 25 matches for one feature, because generic entity tokens (`Test`, `Sample`) appear in
  almost every row. The real overlaps were all present but buried. The matcher needs weighting or
  more specific entity naming — the same "too many signals" problem D-051 exists to prevent.

## v3.9 — 2026-08-12

- **The v3.7 fork is fully resolved.** The four remaining divergent references were each
  determinate on inspection, so nothing was lost in either direction:
  - `carbon-anti-patterns.md` → **repo copy** (strict superset: adds the *Inventory redesign
    precedents* addendum, +16 lines).
  - `module-inventory.md` → **repo copy** (the Test Catalog row: Reagents tab is **built**,
    Test↔Reagent linkage on develop, OGC-991/992/993 — the account copy still said "not built",
    which `current-state-gotchas.md` already contradicted).
  - `docs-spine.md` → **account copy** (all 9 diffs were one edit repeated, "Epic" → "handoff
    ticket (Epic **or** Story)"; the repo copy predates the one-ticket rewrite).
  - `jira-conventions.md` → **account copy** (adds *One ticket per feature, and it stays short*;
    the repo-only lines described child Stories and per-Epic label propagation, which that rewrite
    replaced).
- **i18n citation warning.** `common.*` does **not** exist on `develop` — it is seeded by
  OpenELIS-Global-2 **PR #3863, still open** (verified 2026-08-12: `en.json` has 7,523 keys and
  exactly one starts with `common`). Any FRS Localization table citing `common.sampleId` and the
  like as REUSE is citing keys that are not there. Cite the develop-real family instead (e.g.
  `label.results.flag.normal` / `.abnormal` / `.critical`) and mark `common.*` rows
  `PENDING #3863`. The companion `openelis-ui-vocabulary` skill carries the full guidance.

## v3.8 — 2026-08-11

- **Merged two divergent v3.7 lines.** The account skill (v3.7, 2026-08-05) carried the one-ticket
  `/breakdown` rewrite; the repo working copy `OpenELIS Feature Design/openelis-design-skill-src`
  (v3.7, 2026-07-22) carried reference data the account copy never received. This release takes the
  account copy's command logic and **ports the missing reference data**: `decision-log.md` **D-035…D-042**
  (Inventory: shared sample Storage model, ±1SD run-out window, local lead time, external BI oversight,
  alert acknowledge-to-quiet, …) and the **Inventory redesign** spec-registry row. Prose references that
  also differ between the two lines (`carbon-anti-patterns.md`, `docs-spine.md`, `jira-conventions.md`,
  `module-inventory.md`) were **left as the account copy's** and are flagged for manual reconciliation —
  they were not auto-merged.
- **Registry upkeep no longer silently fails.** New SKILL.md section *Registry upkeep — the skill
  directory is READ-ONLY in a session*: the synced skill dir cannot be written to, so every closing
  step that updates `spec-registry.md` / `decision-log.md` must (1) write the authoritative copy to the
  repo and (2) emit a re-installable `openelis-design.skill`. If the workspace is unreachable, do (2)
  and say plainly that (1) is outstanding, naming the rows still owed. Both reference files carry a
  writable-copy banner, and `/crosscheck` prefers the repo copy where the two differ.
- **New decisions D-043, D-044, D-045** (analyzer results lab-unit access):
  - **D-043** — two-level access: the analyzer's assigned lab units gate the screen; the test's lab
    unit gates each row. One rule, consumed by the menu, the import page and the Pending Imports inbox.
  - **D-044** — the gate is per-lab-unit `Results` rights only. `Analyser Import` is **not** a gate — it
    belongs to the bridge account instrument software signs in as, not to bench staff.
  - **D-045** — an analyzer with no assigned lab units is unrestricted (fail-open), with initial
    assignments backfilled from its existing test mappings and unassigned analyzers visibly marked.
  > These were first drafted as D-035…D-037 against the stale account copy, which stops at D-034. The
  > repo copy already used D-035…D-042 for Inventory, so they were renumbered before release. **Check
  > the highest D-number in the repo copy, not the synced one, before minting a decision.**
- **New spec-registry row:** Analyzer Results Lab Unit Access (OGC-1178).
- **Two new high-overlap hotspots:** *lab-unit-scoped Results rights* (reuse `getUserTestSections` +
  the existing `filter*ByLabUnitRoles` helpers, honour the `AllLabUnits` sentinel, expect the
  login-lab-unit narrowing) and *menu filtering* (one mechanism shared with OGC-1151, not two).

## v3.7 — 2026-08-05

- **Jira handoff is one ticket with a short, human body.** `/breakdown` now creates **exactly
  one** ticket per mockup: an **Epic**, or a **Story** when the work is one screen, needs no new
  data model, and fits in one reviewable PR.
- **`jira-template.md` rewritten.** The body is a doorway, not a container: 250–400 words in four
  short labelled sections — *What the lab user is trying to do* → *What we're building* → *How it
  fits the lab workflow* → *What it touches in OpenELIS* — then a links block (gallery prototype,
  standalone HTML preview, FRS, mockup JSX source, slicing guide, all in `openelis-work`). Two
  forms — **Form A** links a full narrative doc in place of the prose sections; **Form B**
  (default) writes them.
- **Out of the ticket body:** acceptance criteria, FR tables, story points, version tables, i18n
  key lists, permission matrices. They live in the FRS.
- **Slicing guide ships to the repo.** `[feature]-breakdown.md` goes to `openelis-work` alongside
  the FRS and is linked in one line, non-binding.
- `/breakdown` Stage 5 asks a new first question: *is there a full narrative doc to link?* Plus a
  pre-save body review (orientation clear? anything duplicated from the FRS? any ACs/points/keys
  leaked? any filler?).
- `/analyze` Pass E/F reworded — ACs are checked in the FRS, and the ticket is checked for leaked
  ACs instead.

## v3.6 — 2026-07-15

- **Docs spine integration.** New `references/docs-spine.md`: the Feature Doc Jira child is
  the join point between specs, dev Epics, the Confluence user manual, and drift contracts
  (`openelis-work/docs-manual/contracts.json` + Doc Freshness Tracker). Includes the Feature
  Doc body template and the Epic↔Feature-Doc hygiene reconciliation check.
- `/breakdown`: new Docs handoff step at Epic creation (Feature Doc expectation + template);
  registry upkeep now sets the `Docs` column.
- `/analyze`: new Pass N (Docs Impact) — flags redesigns of built features whose published
  manual pages will drift (Auto-MEDIUM).
- `spec-registry.md`: new `Docs` column (`—` / `pending` / `N/A` / `<pageId>`).
- `ogc-workflow.md` + `jira-conventions.md`: point at docs-spine.md; docs authored at
  Acceptance+ via the `openelis-user-manual` skill, never from the FRS.

## v3.5 — 2026-07-15

- current-state-gotchas: Test↔Reagent linkage and configurable Label Presets are BUILT on
  develop (audit 2026-07-14); D-018/D-019 superseded in the decision log.
- decision-log: +D-033 (explicit variant-link grouping, no name heuristics), +D-034
  (Cascading result type retired).
- spec-registry: +Test Catalog Completion v2 (passed /analyze), +Sample Type v2.1,
  +Panel v2.2, +Lab Units v2.0 rows; Label Presets row updated to built (OGC-285 owns).

## v3.4 — 2026-07-14

- Added `references/test-catalog-data-model.md`: source-verified Test Catalog data model
  (Test, Panel, PanelItem, TypeOfSample, SAMPLETYPE_TEST, SAMPLETYPE_PANEL, TestSection,
  TestSampleHandling) from DIGI-UW/OpenELIS-Global-2 @ develop, incl. junction consumption
  traces (order entry, LOINC routing, FHIR intake) and the five-tension decision table.
- verified-data-models.md: new "Test Catalog core model" section pointing at the full reference.
- decision-log.md: D-028 (specimen-is-identity / reassign-not-attach), D-029 (SAMPLETYPE_PANEL
  backend sync), D-030 (domain build state + guards), D-031 (storage ownership boundary),
  D-032 (OGC-361 not on develop — provisional).

## Shared history (before the lines split)

## design-addendum + carbon-anti-patterns (2026-07-09)

- Added standing UI rule: **selected items show their labels, not just a count** —
  multi-select/chip/selection summaries must render full names, not a bare count
  (design-addendum "Standing UI/IA conventions" + carbon-anti-patterns B8; /analyze Pass C, MEDIUM).
  Source: Product direction (Casey).


## 2026-06-26 (v3.3) — Specs stay implementation-free; tickets scoped to user value

- Removed all implementation direction from the spec path. `/analyze` Passes K (Audit Trail)
  and L (Envers) deleted; remaining passes relabeled so A–M stay contiguous (Breakdown→K,
  Lab Context→L, Cross-Feature→M; "Pass O" references updated).
- `/specify` Stage 2 "Permissions & Audit" brief item is now "Access" — who can use the
  feature and do what, in terms of existing roles; no audit_trail/Envers/permission-key/
  Spring Security/Roles Builder mechanics.
- `/breakdown` now slices and titles strictly by user value: principle 2 forbids splitting a
  version *or a story* by technical layer; new anti-patterns for layer-split stories and
  technical-layer titles; story-point rubric, examples, and coverage check reworded to
  user-facing capabilities; cross-cutting = localization + access only.
- references/permissions-and-audit.md rewritten as "Access & Roles" (no audit/Envers).
- references/frs-template.md: "Data Model" → "Information & Data" (domain terms, traces to
  real data); "Permissions & Audit" → "Access"; URL pattern corrected to /MasterListsPage/
  <editorKey>; Dependencies reworded off "services/entities".
- references/jira-template.md: title-format and rules require user-scoped stories (no
  backend/API vs frontend/UI split); cross-cutting lines drop audit_trail/Envers; route fixed.
- Repackaged the root bundle from the current tree (now includes ogc-workflow.md, previously
  missing).


- 2026-06-23 — Added references/ogc-workflow.md and updated jira-conventions.md for the now-LIVE OGC Lean workflow (Acceptance gate, Reject Count, Contract field, per-Epic Feature Doc).

## 2026-06-18 (round 4) — First /crosscheck run folded back in

- Ran /crosscheck on the Analyzer Types & Mapping FRS (vs Analyzer Maintenance FRS).
- spec-registry.md: added the **Analyzer Maintenance & Service** row; enriched the
  **Analyzer Types & Mapping** row (routes, shared concepts, up/downstream deps); added
  Alerts-model and Analyzers-IA hotspots.
- decision-log.md: added **D-027** (Analyzers is a top-level SideNav group; per-analyzer
  detail uses `/analyzers/{id}/<subpage>`) to resolve the two specs' IA disagreement.
- SKILL.md /crosscheck output format tuned: Verdict now leads with a clear/⚠/blocked call;
  Contradictions section sits above Overlaps; "You may be forgetting" scoped to build-once
  items not already tabled; added a Registry-upkeep section to the template.


## 2026-06-18 (round 3) — Portfolio awareness: /crosscheck + decision log + spec registry

- New command **/crosscheck**: scans a feature (early at brief time, and as /analyze Pass O)
  for (1) overlap with other specs, (2) contradiction of prior decisions, (3) up/downstream
  dependency gaps. Commands table is now Seven; chain is /clarify → /crosscheck → /specify
  → /analyze → /checklist → /breakdown.
- `references/decision-log.md` — ADR-lite ledger seeded with 26 decisions from memory
  (GLOBAL + FEATURE scope, active/superseded/provisional). /crosscheck cites these by ID.
- `references/spec-registry.md` — overlap/dependency index, one row per feature (entities,
  routes, shared concepts, up/downstream deps). Seeded from known specs; many cells TODO.
- /analyze gains Pass O (cross-feature overlap & contradiction).
- /specify and /breakdown now have a closing "registry upkeep" step so the index stays fed.
- Reference Files table lists all 10 references.


## 2026-06-18 (round 2) — Memory promoted into references + verified IA

- Added `references/verified-data-models.md` — field-verified data models (App/Common
  Properties, Site Info, Validation, WorkPlan, Order/Patient Entry, Menu Config, Test
  Notification, Test Catalog Alerts) so /specify reuses real fields (design-addendum MUST A).
- Promoted `references/module-inventory.md` and `references/current-state-gotchas.md` from
  draft stubs to populated (Jira anchors OGC-527/899/1031/556, referral URL, EQA V2,
  reagent linkage, label presets, known-broken routes from QA).
- Added `references/jira-conventions.md` — clickable links, Done≠shipped, PR-sized slicing
  for Claude Code, labels, no-emoji-in-funder-docs, reorg proposal (unapplied).
- Added `references/admin-ia-inventory.md` — self-contained verified admin route snapshot
  (no longer depends on the openelis-test-catalog-qa skill being loaded).
- **Corrected the admin URL pattern** in SKILL.md: live app uses path-segment
  `/MasterListsPage/<editorKey>` (e.g. `/MasterListsPage/commonproperties`), NOT the old
  `?type=` query form. Updated IA section, examples, and JSX route comment.
- Updated the Reference Files table to list all 8 references.


## 2026-06-18 — Reference docs added + governance consolidation
- Added the support files SKILL.md referenced but that weren't shipped in the bundle:
  - `references/carbon-anti-patterns.md` (full catalog)
  - `references/frs-template.md`, `references/jira-template.md` (complete templates)
  - `references/permissions-and-audit.md`, `references/current-state-gotchas.md`,
    `references/module-inventory.md` (DRAFT — populated from known facts, marked for verify)
  - `memory/constitution.md` (pointer to upstream + design-relevant summary)
  - `memory/design-addendum.md` (consolidated)
- Constitution wired in as a pointer to
  `DIGI-UW/OpenELIS-Global-2/.specify/memory/constitution.md` (synced v1.10.0, 2026-04-06),
  with a re-sync trigger so it can't silently drift.
- Removed the "Constitution Amendment (proposed)" block that was pasted into the middle of
  the `/analyze` section; its two principles (No-Hard-Delete, Design-for-Large-Catalogs)
  now live in `memory/design-addendum.md`, referenced from `/analyze` Pass D.
- Updated the top governance-load block and Reference Files table to match.

> DRAFT reference files (`permissions-and-audit`, `current-state-gotchas`,
> `module-inventory`) contain TODO markers — verify against the live app/codebase and
> replace with confirmed content.

---

# repo-side line (2026-07-01 to 2026-09-22), kept for history

## 2026-09-22 — decision-log reconciliation + skill-src fork retired

**Root-caused and closed the recurring decision-log fork.** The repo had two
`references/` folders — the real skill's (`skills/openelis-design/references/`,
full set + `SKILL.md`) and a stray partial duplicate
(`OpenELIS Feature Design/openelis-design-skill-src/references/`) that only ever
held `decision-log.md` and `spec-registry.md`. Sessions updated one or the other,
so the two leapfrogged: the decision log ended up numbered three different ways
(the stale copy stopped at D-050 with `/breakdown`+API-reuse there; the
maintained copy carried micro/runs/order-entry D-049–D-057; a pathology proposal
independently claimed D-046–D-056).

Fixes:
- **Reconciled the decision log** into one canonical D-001–D-066 sequence and
  synced both copies byte-identical (PR reconcile-2026-09-22). Renumbered the
  double-booked clearance/runs decisions to D-058–D-064 (Order Entry keeps
  D-056/D-057, there first); folded `/breakdown` Epic-only + API/i18n reuse in as
  D-065/D-066; D-046–D-048 remain a deliberate skip. Updated the citations in
  `designs/results-validation/runs.md` and `validation-clearance-rule.jsx`.
- **Merged `spec-registry.md`** into the canonical copy (the duplicate's newer
  micro/runs/order-entry rows + the real skill's corrected Inventory PR-3840
  status).
- **Retired the stray duplicate:** deleted its two files and left a README
  pointer. `skills/openelis-design/references/` is now the single source of
  truth; the skill loads `references/*` relative to its own directory, so nothing
  reads the retired folder.

**Still open (needs Casey, unchanged):** `designs/pathology/closing-actions.md`
is an unmerged proposal claiming D-046–D-056 — renumber to D-067+ on adoption.
The `/breakdown` Epic-only (now D-065) and API & Data Reuse (now D-066) decisions
are still NOT implemented in the shipped `SKILL.md`/`frs-template.md` body.


## 2026-09-02 — monthly consolidation

**Constitution:** re-verified against upstream raw file — still v1.11.0, no re-sync needed.

**Decision log fixed, not just appended.** D-017 (EQA V2) had been left `provisional` even
though `current-state-gotchas.md` already recorded EQA V2 as built (verified 2026-08-01) —
marked **superseded**. More importantly: recovered two of Casey's real 2026-07-01 decisions
(`/breakdown` Epic-only, API & i18n reuse) that the 2026-08-01 pass's own CHANGELOG *claimed*
would land as D-043/D-044, but never actually did — those IDs were reused a few days later by
the unrelated analyzer-results-lab-unit-access work (D-043–D-045) without cross-checking the
earlier promise, so the two decisions had no row at all. Re-recorded as **D-049**/**D-050** —
and, checked against the actual shipped `SKILL.md`/`frs-template.md`, **neither is implemented**
yet (`/breakdown` still creates child Stories; the FRS template has no API & Data Reuse
section). This is the same "needs Casey, not an unattended judgment call" gap the 2026-08-01
CHANGELOG flagged for the `openelis-design-skill-src/` divergence — now pinned to exact
line numbers instead of a vague "SKILL.md bodies diverged" note.

**spec-registry.md corrected against GitHub**, not just left with stale `?`s: the Inventory
redesign's OGC-657 dependency (`PR #3840`) was recorded as "open" — it is actually **closed,
not merged** (2026-08-09, `mergeable_state: blocked`), no successor PR found. The Inventory
FRS's Storage-model dependency is therefore not delivered; flagged rather than silently carried
as "open."

**Not done (still needs Casey, carried forward again):** the SKILL.md `/breakdown` and
`frs-template.md` edits implementing D-049/D-050 — same class of judgment call the 2026-08-01
pass deferred for the `openelis-design-skill-src/` divergence, now scoped precisely (see
decision-log.md's 2026-09-02 note for exact line numbers). Recommend a dedicated session,
not another unattended pass, since it changes what `/breakdown` and `/specify` actually output.

**Live-app re-verification deferred this cycle** (unattended run — authenticated session/JS
extraction blocked by tool-use policy in the browser tool; cross-confirmed the front-end build
hash is unchanged since 2026-08-26 via the `openelis-qa-tracker` artifact's own 2026-09-01
probe instead of re-probing directly). Route table, admin-ia-inventory, and verified-data-models
carry their 2026-08-01 last-confirmed status.


## 2026-08-01 — monthly consolidation

**Decision log unblocked.** Applied `upload/decision-log-additions.md` (D-035…D-042) *and* the
missing D-028…D-034 test-catalog data-model rows, both of which existed only in the untracked
working copy at `OpenELIS Feature Design/openelis-design-skill-src/`. Resolved the
D-028/D-029 **ID collision** that had blocked three consecutive gallery-ledger runs: the
test-catalog rows keep D-028/D-029 (cited by ID elsewhere) and the two orphaned 2026-07-01
process decisions land as **D-043** (Epic-only `/breakdown`) and **D-044** (API & i18n reuse).

**Three decisions superseded against live verification** on `testing.openelis-global.org`:
- D-017 → **D-045**: EQA V2 is built (`/rest/eqa/programs`, `/…/enrollments`, `/my-programs`, `/orders/summary` all 200).
- D-018 → **D-046**: Test↔Reagent linkage is built (`/rest/test-catalog/{testId}/reagents` 200; the flat `/rest/reagents` 404s).
- D-019 → **D-047**: configurable Label Preset Management is built (`/MasterListsPage/labelPresets`).
- New **D-048**: alert acknowledgment is built; only per-*result* critical ack remains.

**Route inventory rebuilt from the shipped router.** Extracted all `Route,{path:…}`
declarations from the live bundle instead of guessing at HTTP status (a SPA 200s on
everything). Six documented routes are wrong or nonexistent — `/Inventory` (really
`/inventory`), `/Storage/samples` (really `/Storage/sample-items`), `/AuditLog` + `/SystemLog`
(really `/AuditTrailReport`), `/ResultsByPatient`, `/ResultsByOrder`, `/LOINCManagement` — and
three admin `editorKey`s are stale (`eqaProgram`, `barcodeConfiguration`, `testManagement`).
`/MasterListsPage/menuConfiguration` is genuinely absent, which explains BUG-49.

**Constitution pointer resynced 1.10.0 → 1.11.0.** The re-sync trigger fired: upstream
amended Principle VII on 2026-07-15 (commit `496c910`) with a mandatory **i18n Key Reuse &
Hygiene** section, after finding `en.json` had grown 2,385 → 7,133 keys with ~25% duplicates
and ~35% orphans. This makes D-044's reuse-first Localization table a *constitutional*
requirement — minting a near-synonym key is now a CRITICAL `/analyze` finding, and
`openelis-ui-vocabulary` is the tool for it. The July label discrepancy (footer 1.9.1 vs
pointer 1.10.0) resolved itself upstream; noted separately that upstream's amendment log
still stops at v1.9.1, so read the `**Version**` line rather than that list.

**Also:** spec-registry gained Inventory redesign, QA/QC (Westgard) and Test catalog data
model rows; carbon-anti-patterns gained the D-042 acknowledge-to-quiet refinement of P-16 and
the D-037 managed-lookup-vs-tag guidance.

**Not done (needs Casey):** the untracked `openelis-design-skill-src/` SKILL.md has diverged
from the committed one (63KB vs 60KB, plus `docs-spine.md` and `test-catalog-data-model.md`
that don't exist in the repo). Only the decision rows were promoted this cycle; reconciling
the SKILL.md bodies is a judgement call, not an unattended one.


## 2026-07-01 — Monthly consolidation pass

- constitution.md pointer: added a **2026-07-01 verification note**. Upstream governance footer
  currently reads Version 1.9.1 (Last Amended 2026-04-05) with Principle X present; that label is
  lower than the recorded 1.10.0, so the re-sync trigger did not fire. Flagged the version-label
  mismatch to reconcile with repo owners; principles I–X unchanged.
- current-state-gotchas.md: promoted the **home-dashboard domain-filtering gap** from auto-memory
  (order entry is domain-scoped today; dashboard Domain filtering is not built). Noted order-entry
  domain scoping on the Domain-enum line. Added a dated re-confirmation footer; live-app route
  re-verification deferred (unattended run, instance gated at login).
- decision-log.md: re-confirmed provisional **D-017** (EQA V2 still not built); no decisions
  superseded, none newly promoted (domain delta is a current-state fact, not a new decision).
- spec-registry.md: reviewed; no new FRS this cycle, `?` cells left as-is (no confirmed values).
- Repackaged the root openelis-design.skill bundle from the current tree.
