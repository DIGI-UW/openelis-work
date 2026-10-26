# Microbiology (AMR) v3.2: slicing guide

**FRS:** `amr-micro-v3-frs.md` (v3.2, draft 0.31) · **Shared spec:** `reference-search-frs.md` (built in slice 1)
**Mockup:** `amr-micro-v3-mockup.jsx` (Carbon React) · **Preview:** `amr-micro-v3-preview.html` · **Build map:** `amr-micro-v3-build-map.md`
**Pipeline:** Claude Code (agentic). Each slice is one branch, one PR, one review; slices are sized to a PR a reviewer can read in one sitting, not to story points.
**Status:** a non-binding suggestion for the developer. The developer slices the work; nothing here is a Jira ticket.

## Handoff ticket: [OGC-1528](https://uwdigi.atlassian.net/browse/OGC-1528)

- **Type:** Epic. v3 touches the case view, worklist, three admin areas, the test catalog and new reference data domains, so it is not one screen.
- **Title:** Microbiology (AMR) v3: AST reporting rules, one-click suggestions, AMR for R reference data, infection control alerts and AST QC
- **Assignee:** Samuel Male
- **Links:** "is part of" OGC-899 (PNG / CPHL Phase II umbrella); "relates to" OGC-1383 (V2 Epic); "is blocked by" OGC-730 (Test Rules Authoring MVP), for the slices marked below; "relates to" OGC-1504 (alert rules fire before validation, which R-22 depends on being fixed) and OGC-1200 (Runs, which owns the QC frequency policy)
- **Labels:** `PNG`, `Phase2`, `microbiology`, `amr`, `global`
- **Contract:** CPHL PNG

## Before you start: what exists

Read the build map first. It marks every screen area as **built** (on develop `f72854e`: keep it and change only the listed v3 items), **v2** (build to the v2 FRS first) or **v3** (new). The v2 slices of OGC-1383 (V00 to V16) are still in Backlog, so several v3 slices land on screens that v2 is also changing: coordinate with the V2 sequence instead of racing it.

Three things to check, not assume:

- **Expert rules (M-06) are not built.** OGC-874 shows Done only because it was closed as superseded on 2026-06-11; the live story is OGC-873 (Backlog), and pngtest shows "expert-rule flags are available in Phase 1B". Slices 4 and 5 must not assume an expert rule engine exists.
- **OGC-1504** (test alert rules email at result entry, before validation) must be fixed before slice 8 relies on validated-only firing.
- **OGC-1522 to OGC-1527** (V2 QA server fixes) are separate bugs, already assigned to Samuel; they are not part of these slices.

## Slices, in dependency order

| # | Slice (what a user can do) | FRS | Depends on | Blocked by OGC-730? |
|---|---|---|---|---|
| 1 | **The lab loads AMR for R organisms and antibiotics as a versioned pack and finds organisms by any name or code.** Taxonomy matcher, organism seed with synonyms and codes, antibiotic master, pack licence gate, Import Review preview and apply, and the shared reference search (server type-ahead plus search dialog) swapped into the existing organism and antibiotic pickers. | R-12, R-13, R-19, R-21, FR-R29.5, FR-R29.7, D-286, D-348, D-350; reference search D-318 to D-322 | Reference data pipeline P1a | No |
| 2 | **The lab loads breakpoints in the package's native format and they interpret exactly as AMR for R does.** Native import with test vectors, indication, disk content from the lot, SDD and WT/NWT, ECOFF, dosage notes, QC range domain; local breakpoints as a layer over the pack with reason, history and pack-difference review; breakpoints per disk content (for example 10 or 30 µg). | R-14 to R-18, R-20, R-25, FR-R23.3, D-326 to D-328 | 1 | No |
| 3 | **Identifying an isolate adds the right AST panel by itself.** Panel targeting on the existing AST panels page, a fourth tier (On request) in the panel tier picker, and default panels on the case. | R-01, D-313 | 1 | No |
| 4 | **The lab sets which antibiotics report, on one AST rules page, and the case ticks them.** AST rules page (reporting rules, unconditional interpretation rules such as Always R, one Preview), Report column and reason in the AST table, report summary line, rule notes in run notes, CLSI tiers via the import Tier and Trigger agents columns (Cascade rules with no condition listed under Needs a condition; "X or Y" agents, species limits and specimen exclusions as ordinary rows), Import and Export through Import Review. | R-02, R-06 (unconditional), R-07, R-08, R-09, R-10, D-276, D-287, D-288, D-291, D-314 to D-317 | 2, 3 | No (Cascade rows save but do not evaluate yet) |
| 5 | **The tech gets one-click suggestions for second-line testing, and cascade antibiotics tick when their condition is met.** Cascade evaluation, the suggestion strip with Add and Dismiss (with reasons), conditional interpretation rules (inferred agents and Flag rules, with flags in the isolate alerts and cleared by the built Acknowledge flags), AST input and Suggest mode on reflex rules. | R-03, R-04, R-05, R-06 (conditional, FR-R6.6 to FR-R6.8), D-278, D-290, D-339 | 4 | **Yes** |
| 6 | **The case reads at a glance and releases safely.** Status worked out from releases with Stage as subtitle, referral tags, STAT tag, sticky case bar with section links and both release buttons, final release blocked list and confirmation, worklist Status filter, no sideways scroll, design-notes-free product UI. | D-Q1, D-Q6, D-277, D-281, D-282, D-289 | V2 slice V12 | No |
| 7 | **The tech inoculates, records readings and sees molecular results in one place.** Culture rows grouped under the culture test and Inoculate adding it, Methods identification flag, qualifier in Record reading, forms and notes opening under their row, disk lot per antibiotic, molecular resistance table from any mapped test (with the catalog mapping field). | D-Q2, D-Q3, D-Q4, D-Q5, D-Q7, D-279, D-280, D-284, D-285, R-15 | 2; V2 slices V05, V06, V10 | No |
| 8 | **Infection control hears about resistant organisms by email, and the tech records AST QC.** "Organism or resistance profile" alert trigger, automatic Sent rows in critical communication, Not sent in Needs attention; the Reagents, QC & Controls section on the AST run with one control row per antibiotic and pass setting the lot status. | R-22, R-23, D-292, D-293, D-295 | 2, 4; OGC-1504 fixed; OGC-1200 for QC frequency | No |
| 9 | **A received isolate arrives with its organism coded, and reception can jump to the cases it opened.** Reported-organism line in the built What this order will open panel; case links in the save notification; reported organism on Tested elsewhere through the reference search; bottle containers from the v4 container types. | R-24, D-323 to D-325 | 1 (reference search); Clinical Order Entry v4 container types | No |
| 10 | **Someone who learned WHONET finds each isolate organised the way they expect, in OpenELIS screens.** Merge Isolates and AST / DST into Isolates and susceptibility; each isolate opens with alerts as notifications, one antibiotic list across runs with WHONET codes, panels as Tags with Add panel (the targeting-driven chooser, R-28) and Add antibiotic, keyboard entry of new results, class grouping, expected R not tested, no-breakpoint warnings, the MDR line, and Run details and QC inside (moving built components); worklist Isolates view. Re-QA of the isolate and AST areas. | R-26, R-28 (FR-R28.1 to FR-R28.7), FR-R29.1 to FR-R29.4, FR-R29.6, D-329 to D-334, D-342, D-344 to D-347, D-349 | 1 (reference search), 2 (breakpoints by content), 4 (rules for the alerts), 7; V2 slices V06, V10 | No |
| 11 | **Anyone opening a case can tell what each section is for, what to do next, and which sections are done.** Purpose sentence per section, task names, Next step in the case bar from the readiness blockers, Complete Tag and summary with the collapse rules, empty states, Toggletips, one titled panel open per isolate row that scrolls into view and takes focus. Front end only; no Help link yet (Later). | R-27, FR-R28.8 to FR-R28.10, D-335 to D-338, D-343 | 10 (section layout) | No |

Slices 1 to 4 and 6 to 10 can start without the Test Rules MVP. Only slice 5 waits for OGC-730. Slices 6 and 7 can run in parallel with 1 to 4 once their V2 predecessors have landed.

## Coverage check

- **Every FRS requirement is in a slice:** R-01 to R-29 as listed above; D-Q1 to D-Q7 and D-250 to D-295, D-313 to D-317 and D-323 to D-339 and D-342 to D-350 traced through the requirements they decide. D-340 and D-341 (surveillance analysis, bulk isolate import) are separate epics after v3 and have no slice here.
- **Part C QA carry-forward:** each AC-Q criterion is verified in the slice that touches its area (case and release: 6; culture, isolates, AST entry: 7; reporting: 4; admin and logs: 4 and 8). The tripwires in `tests/amr-v2.spec.ts` flip to pass as their slice lands.
- **Every UI element in the mockup is built by a slice:** case header and bar (6), culture and inoculation (7), AST section (4, 5, 7, 8), report section (4, 6), critical communication rows (8), worklist (6, 8), AST panels (3), AST rules (4, 5), reference data sections (1, 2), test catalog Alerts and result mapping (7, 8), Methods (7).
- **Slices are titled by what a user can do,** not by layer; each includes its own localization keys (FRS Localization table) and access checks (FRS Access table).
- **Docs:** a Feature Doc child is expected on the Epic when it reaches In Review; the manual entry is written at Acceptance from verified behavior.
