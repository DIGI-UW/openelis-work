# Spec Analysis: Reference Data as Configuration FRS v0.2

**Date:** 2026-10-19
**Scope:** `reference-data-config-frs.md` v0.2; Locations & Organizations FRS v0.6 (L&O); decision log to D-233 and spec registry (`openelis-design-skill-src`, 15 Oct); design addendum; shipped import UI on develop `f72854e` (`frontend/src/components/admin/locations/ImportExportView.jsx`, `catalogImport/CatalogImport.jsx`); QA evidence OGC-1420 (L&O deep test, In Review) and OGC-1466 (catalog import, Done).
**Passes run:** A, D, E, F, G, H, J, L, M, N, plus a user pre-mortem (Part 2). B, C and I skipped (no preview yet). K skipped (no breakdown).

**Status (2026-10-19, later the same day):** applied. Architecture v0.3 then v0.4 and Import Review FRS v0.1 then v0.2 carry every finding; D-12 to D-16 applied as recommended (provisional). A follow-up gap review added sense checks, changes that alter existing results, the impact check, Undo's limits, compare between servers, export and file hardening, personal-data export, the import-area design rule, a readiness report before identifiers, national list tooling, distro guides and early research. Casey deferred change control (D-17). A fresh-eyes consistency review of both specs found 22 issues; all were fixed in the same versions.

## Summary

The architecture holds up: one pipeline for every source, codes before subscriptions, export everywhere, no hard delete. Three problems need attention before any mockup is final.

1. **It is a strategy document, not yet an FRS.** It has no Lab Context, user stories, navigation and URL, access section in the D-233 form, localization table, Dependencies section or acceptance criteria. Recommendation: keep this file as the **architecture and roadmap**, and write one FRS per slice. The first slice is the shared **Import Review** experience, starting on the Organizations import (Part 3).
2. **It contradicts five things Locations & Organizations already decided and shipped:** identity (codes for reporting, identity internal), clearing values through import (out of scope there), Undo an import (deferred there), registry records (explained, not locked, D-109), and the outcome vocabulary. Each is a product call (decisions D-12 to D-15 below).
3. **It contradicts itself on blank cells and deletion.** FR-1.5 lets each domain declare "keep vs clear"; FR-10.10 says blank always means unchanged and nothing is ever deleted. Result limits hard-delete ranges and reflex rules rebuild their conditions today, so FR-10.10 is false for two shipped domains unless they change.

The pre-mortem (Part 2) adds the user-facing risks. The biggest, all already seen in QA, are being asked hundreds of questions before Apply is allowed, a Preview that disagrees with what Apply does, Replace deactivating far more than the user meant, and Excel quietly changing the user's data.

---

## Part 1. Findings

### CRITICAL

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-01 | A (Constitution VII) | Whole FRS | No Localization table. FR-8 and FR-10.11 require localized templates, sheet names, headers, messages and the `(clear)` keyword, but no key exists. OGC-1420 9e shows the cost: the L&O page shipped with 5 of 244 keys in fr.json and es.json. | Each slice FRS carries its own table. The Import Review FRS reuses `label.locations.import.*` only where L&O owns the words; shared review words get their own namespace (F-15). |
| F-02 | G (MUST A) | 4.4, 4.6, 4.7, FR-2.2, FR-3.2, FR-10.9, FR-11.2 | New data is named in passing but never declared: change set, pre-apply snapshot, per-record source / owner / locally set fields, pack manifest and installed-pack list, code system per record, workbook export stamp. | Add a Dependencies section listing each as a named data element (storage shape left to the engineer, per standing convention). |
| F-03 | J (D-233) | FR-9 | Privileges are prose ("Reference data: export") and invent roles (Catalog Manager, Registry Manager, Microbiology Supervisor). D-233 requires `category:action` codes, a display group and a default grant by held privilege. | Reuse `organization:import` (NEW in L&O), `organization:manage`, `provider:manage`, `test:configure`. Nominate **NEW** `reference_data:import`, `reference_data:export` and `reference_data:pack_manage` in "Test catalog and reference data", default "roles with `test:configure`" (pack management: roles with Admin). Drop the invented roles. |
| F-04 | D, M | FR-10.10, FR-1.5 vs result-limits and reflex-rules handlers | "Nothing is ever deleted by an upload" is false today: result limits hard-delete numeric ranges not in the file (`ResultLimitServiceImpl.java:185-192`) and reflex rules replace their conditions. D-002 forbids hard delete on domain records. | Decide whether a range or rule condition is a record (then deactivate, D-002) or part of its test's definition (then replace is allowed, recorded in history and covered by Undo). Recommended: part of the definition, stated explicitly in the FRS, with the before-values kept in the snapshot. |

### HIGH

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-05 | L | Whole FRS | No Lab Context section. A developer cannot tell from it what a site setup lead does today (hand-keying, spreadsheets emailed to DIGI, restarts) or what changes. | Add Lab Context to each slice FRS. The PNG CPHL catalog load and the PNG training are the concrete examples. |
| F-06 | E | Whole FRS | No acceptance criteria. Success measures (Section 8) are outcomes, not testable criteria. | Each slice FRS gets ACs. The QA tripwires in OGC-1420 and OGC-1466 are ready-made ones (Part 2 maps them). |
| F-07 | M (L&O FR-A5, FR-F4, D-107) | 4.3, FR-3.1, 4.7 | "Every domain gets a stable code used as the primary identity" and "central codes never change" contradict L&O: identity is internal and never changes; codes are for reporting and can change; matching uses any identifier, then name. | Separate the two ideas. **Matching identifier**: a system-issued `identifier` with a system (for organizations this is D-107's label + value; the label plays the role of the code system). **Reporting code**: editable, shown as Code. FR-3.1 adds a matching identifier to every domain, not a primary key. Update 4.3 and 4.7 wording. |
| F-08 | M (D-109) | 4.7, FR-3.4, FR-10.13 | Centrally owned fields are "refused" from uploads and edits. D-109 and L&O FR-H2 chose "explain, don't lock" for the facility registry, and L&O lists locking as out of scope. Two different rules for "a central source owns this record" in one product. | **Decide (D-12).** Recommended: one rule for every central source. Explain, keep the edit as a local override where the field is on the local-settings list, otherwise warn that the next central update will overwrite it. Locking only when a national programme asks for it, as a per-pack setting. |
| F-09 | M (L&O Deferred) | FR-10.9 | Undo an import is in scope here but deferred in L&O ("needs before-values stored per run"). | **Decide (D-13).** If kept, L&O moves it from Deferred to this FRS, and the L&O Organizations import is the first place it ships. |
| F-10 | M (L&O Out of Scope) | FR-10.10 | Clearing a stored value through import (`(clear)`) is out of scope in L&O ("clear it in the form"). | **Decide (D-14).** Recommended: allow it, since the site lead cannot "clear it in the form" for 300 rows. One keyword, localized, shown in the Preview as "will be cleared". |
| F-11 | Consistency | FR-1.5 vs FR-10.10 | One requirement says each domain declares keep or clear on blank; the other says blank always means unchanged. | Keep FR-10.10. Rewrite FR-1.5 as "every domain follows FR-10.10; legacy behaviours that reset on blank are defects" and list them (Appendix B already does). |
| F-12 | Coverage | FR-2, FR-11 | What happens to a record when a **newer pack no longer contains it** is undefined. A national catalog v4 that drops a test: deactivate, ask, or leave alone? Same for the L&O Replace question at national scale. | Add a requirement. Recommended: a pack update proposes deactivation of records it previously supplied and no longer lists, shown in the Preview like Replace, never applied silently, never touching local records. Scope rule mirrors D-108. |
| F-13 | Coverage | FR-10 | Replace mode exists only in L&O; the generic pipeline has no mode. A site lead loading a revised lab list needs the same choice for tests and panels, with the same plain-words scope sentence. OGC-1420 2a shows how dangerous a loose scope is. | Generalise L&O FR-F3 and D-108 as the pipeline's Replace mode, with per-domain scope rules, default Add & update, and the "I understand N records will be deactivated" tick. |
| F-14 | Coverage | FR-10.2 | Hidden code columns plus Excel copy-paste: a user copies an existing test row to make a new one and the hidden code comes with it, so the new row **overwrites** the original. | The workbook carries a hidden row signature; two rows with the same code in one upload are an error naming both rows ("Rows 14 and 52 both claim Hemoglobin"). Add an AC. |
| F-15 | M, A | FR-7.1, FR-10.12, L&O import page | Where Import lives is undecided: one central Reference Data page, the L&O Import / Export page (`/MasterListsPage/locations/import`, shipped), the Catalog Import page (`/MasterListsPage/CatalogImport`, shipped), and the breakpoint page. No SideNav, breadcrumb or route is declared for anything new. | **Decide (D-15).** Recommended: one shared **Import Review** component (upload, review, decisions, apply, result, history) used by every area page; area pages keep their routes. A central page is only for full-workbook and pack work. Declare its route in the Admin Redesign IA. |
| F-16 | G, F | FR-10.6, FR-10.7 | "Apply what is ready, leave the rest pending" has no dependency rule: a panel row ready while one of its tests waits on a decision. | Apply what is ready **and everything it does not depend on**. Rows that depend on a pending row stay pending with that reason. |
| F-17 | Coverage | FR-10.3 | A workbook downloaded on Monday and uploaded on Friday after another admin changed records: the Preview shows the other admin's changes as the uploader's "changes back". | The workbook stores its export time. Preview flags rows whose record changed since then, shows both values, and asks. |
| F-18 | Coverage | FR-10.9 | Undo after use: an imported test already has orders, or an imported facility has open orders. | Undo runs the L&O deactivation guard (FR-E2) and lists what is in use; it never retires an in-use record without saying so. |

### MEDIUM

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-19 | Non-functional | FR-10.5, Section 9 | No performance target. CPHL took minutes to load at start-up; the L&O preview rendered an unpaged 5,000-row table. | Targets: Preview of 5,000 rows within 60 seconds with progress shown; the review list server-paged; Apply runs as a background job the user can leave and return to. |
| F-20 | Terminology | FR-10.5 vs L&O FR-F6 | "Changed" and "retired" here; L&O shipped New, Updated, Unchanged, Reactivated, Deactivated, Needs decision, Rejected. D-002 says Deactivate. | Use the L&O outcome words everywhere. |
| F-21 | Terminology | FR-10, 4.2 | Words the site lead should never see: pack, layer, change set, code system, domain, namespace, owner. | UI words: "starter content" or the pack's own title ("PNG national test list v3"), "managed by {publisher}", "your lab's own". Glossary in each slice FRS. |
| F-22 | A | FR-10.11 | Headers accepted "in any supported language" can collide between languages and break if a user renames a header. | The workbook carries a hidden canonical header row; visible headers are labels only. CSV keeps canonical English headers. |
| F-23 | G | FR-10.2 | Dropdowns "filled from current data" reject values the same workbook is adding (a new sample type used on the Tests sheet). | Dropdowns reference the workbook's own sheets, not a static list. |
| F-24 | Coverage | FR-10.2 | Excel changes values as they are typed: codes lose leading zeros ("007"), phone numbers starting with "+" become formulas, "1-2" becomes a date, long IDs become scientific notation. | Every text-like column is formatted as Text in the workbook; dates as real dates; Preview warns on values that look converted. |
| F-25 | H (MUST B) | 4.7, FR-11 | Central management could be read as OpenELIS managing several sites. | State that the central server is outside OpenELIS (as D-232 and M-15's D-041 do for delivery and surveillance) and that no OpenELIS screen shows another site's data. |
| F-26 | M (D-216) | FR-5.4, FR-10 | Creating providers or facilities by import skips the possible-match check that D-216 requires when creating them by hand. L&O's rename check (FR-F12) is the import equivalent, but OGC-1420 1a shows it matching on shared common words. | Reuse one possible-match routine for import and manual create; "share at least 60% of words" ignores stop words such as Health, Centre, Clinic, Hospital. |
| F-27 | M (registry) | Coverage matrix | Document Library already registered two new loader domains (`documents`, `document-versions`). | Add them to the matrix and to the shared pipeline's domain list. |
| F-28 | M | FR-5.4 | Providers: D-109's "registry wins" applies to facilities; nothing says the same for the Practitioner pull. | Covered by D-4; once decided, record it as a decision. |
| F-29 | Coverage | FR-10.1 | "First page a Global Administrator sees on a new instance" needs a definition of new, and can trap an upgrade. | Show the checklist when the catalog and organization lists are empty or when an admin opens it; always dismissible; never on upgrade. |
| F-30 | E | FR-10.8 | The annotated return file is the main recovery path but has no format rule. | Same workbook, two columns added at the left (Status, Message), the user's own values untouched, rows in original order. |
| F-31 | N (Docs) | Whole FRS | Published manual pages drift: Import a test catalog from CSV (OGC-1286 doc review), Admin Import and export locations (OGC-1468), the Confluence configuration guide (page 1266122780). | Add a Docs Impact section to each slice FRS. |
| F-32 | M | FR-6, Admin Redesign | Site-information values loadable from files overlaps the Admin Redesign Configuration page (one editor per value). | Coordinate in P4; Configuration stays the only editor, the loader writes the same values. |

### LOW

| ID | Location | Issue | Fix |
|---|---|---|---|
| F-33 | 3.2 | "Health Region / Health District" are listed as required org types; L&O Information & Data says the same. Consistent, no change. | None. |
| F-34 | FR-5.5 | Breakpoint column names differ from M-02. Stated, but no owner. | M-02 owns the format; this FRS points to it. |
| F-35 | Appendix A | Line references are to `f72854e`. | Keep; re-verify at slice handoff. |
| F-36 | 2, finding 2 | "17 of 28 domains are legacy" counts handlers, while the matrix counts domains. | Say "17 of 28 domains" consistently (verified). |

## Constitution and addendum violations (block delivery of any slice)

- F-01: i18n, no keys.
- F-02: undeclared new data (MUST A).
- F-03: privileges not nominated in the required form.
- F-04: hard delete of ranges and reflex conditions unless reclassified (MUST D / D-002).

## Verified accurate (develop `f72854e`)

- The importable domain list is computed from `supportsDryRun()` (`CatalogImportServiceImpl.java:49-55`): 11 domains, dictionaries and test-results excluded.
- BOM stripping and Windows-1252 fallback exist in `CsvParsingUtil.openCsvReader` and the tests loader now uses it (OGC-1466 Done), so the BOM part of OGC-1420 1b should also be fixed for organizations once that branch uses the same reader.
- Result limits delete numeric ranges not in the file (`ResultLimitServiceImpl.java:185-192`).
- The provider registry pull never deactivates (`ProviderImportServiceImpl.java:67`, commented out).
- The baseline dump has 155 `COPY` blocks.
- The shipped L&O preview shows count tiles, a rename list, a decision list, a deactivation list and an **unpaged, unfiltered** row table whose change detail is raw field names (`gpsLatitude: (none) → -9.47`) (`ImportExportView.jsx:393-575`).

---

## Part 2. What will make users hate this (pre-mortem)

Imagine it is mid-2027 and a site lead in a provincial hospital lab has just spent a day setting up OpenELIS with the workbook, and hates it. These are the most likely reasons, ranked by how likely and how bad. "Seen" means QA has already hit it on develop.

| # | Why they hate it | Evidence | Design response | Lands in |
|---|---|---|---|---|
| H-1 | **Interrogated before they can do anything.** Apply stays disabled until every possible match and rename is answered one by one. 5,000 new facilities produced 5,000 rename questions. | Seen: OGC-1420 1a | Smarter matching (F-26). Decisions grouped by kind with one answer for the group ("All 38: these are new places"). Answers can be deferred: Apply what is ready, the rest stays in the queue (FR-10.7). A cap: more than 50 questions means the matcher is wrong, so say so instead of asking. | Import Review FRS |
| H-2 | **The Preview lied.** It said 2 new and Apply created 1 and updated 1. Or Preview wrote things and a second Preview doubled the problems. One of these and they never trust the screen again. | Seen: OGC-1466 | Preview runs the exact Apply code path and is rolled back; an AC that Preview and Apply counts are equal for every QA file. Preview writes nothing to the decision queue until Apply (F-scope from OGC-1466). | Pipeline (P1a) |
| H-3 | **Replace took out half the province.** They exported referral labs, re-imported, and 44 referring clinics were about to be deactivated, one with 339 open orders. | Seen: OGC-1420 2a, 2b | Default to Add & update. Replace scope by record, never by type when a record has several types. The deactivation list is the first thing on screen in Replace mode, with real open-order counts, and needs the tick. Undo. | Import Review FRS, L&O fix |
| H-4 | **Excel changed my data.** Codes lost leading zeros, phone numbers turned into formulas, accents became question marks, the file "was not formatted right". | Seen: OGC-1420 1b, OGC-1466 | Workbook with Text-formatted columns (F-24); BOM and encoding handled everywhere (done for most loaders); Preview flags values that look converted. | Workbook FRS |
| H-5 | **A wall of rows.** The Preview lists every row, including the 400 unchanged ones, in file order, with database field names. The three problems are somewhere in there. | Seen: shipped `ImportExportView.jsx` | Problems first, then what will change, then unchanged (collapsed). Grouped by outcome, paged, filterable, human field labels, before and after side by side. | Import Review FRS |
| H-6 | **Errors written for a developer, and they vanish.** "Unexpected token '<'", "must have a 'type' column", an error that closes after 6 seconds, at the top of a page scrolled 3,000 px down. | Seen: OGC-1420 4a to 4c | Every message says what is wrong, where (sheet, row, column), and what to do. Errors stay until dismissed and appear next to what they are about. | All slices |
| H-7 | **Things silently ignored.** An unknown column, an unknown unit, a row skipped but the file marked done. | Seen: OGC-1420 1d; loader audit | "Ignored" is an outcome in the Preview with a count; nothing is dropped without a line in the review. | Pipeline |
| H-8 | **Starting over after one mistake.** Fix one cell, upload again, re-answer every question. | Likely | Decisions persist per row signature across re-uploads of the same workbook; fixing a value in place re-previews only that row (FR-10.7). | Import Review FRS |
| H-9 | **"Managed centrally. Request a change there."** with nobody to ask, while a reagent shortage means a test must come off the order screen today. | Likely, as soon as national packs exist | "Active at this site" is always a local setting; explain-don't-lock (F-08). A local override is visible to the central team in its next report, never blocked. | Ownership FRS (P2) |
| H-10 | **Every national update is a pile of questions.** Each new pack version asks again about the 20 things they changed locally. | Likely | A local setting is remembered, not re-asked, unless the central value changed since the last answer. "Keep mine for this field from now on." | Ownership FRS (P2) |
| H-11 | **Copy a row, lose a test.** Copying an existing row to make a new test overwrites the original via its hidden code. | Likely (F-14) | Duplicate-signature check. | Workbook FRS |
| H-12 | **No idea what happened, or when.** Recent imports does not name the file or tell a Preview from an Apply; a record does not say which import changed it. | Seen: OGC-1420 9b | Run history names files, user, mode, Preview vs Apply, counts. Each record's history links to the run that changed it (L&O FR-K2 already does this). | Import Review FRS |
| H-13 | **It is slow and the tab dies.** A full catalog took minutes at start-up; a large Preview in the browser freezes. | Seen: CPHL timings | Background job, progress, leave and come back, server-paged review (F-19). | Pipeline |
| H-14 | **Half in English.** The page or the workbook shows English labels in a French-speaking lab. | Seen: OGC-1420 9e | Keys in every slice FRS; workbook labels from the same keys; AC per language. | All slices |
| H-15 | **Too many concepts.** Packs, layers, owners, domains, modes, code systems. | Likely | None of these words reach the site lead (F-21). The site lead sees: their file, what will change, what needs them, Apply, Undo. | All slices |
| H-16 | **Undo that cannot undo.** They undo an import and find the tests are in orders already, or Undo silently retires things in use. | Likely | Undo shows what is in use and asks (F-18). | Import Review FRS |
| H-17 | **No finish line.** They do not know when the lab is ready to take its first order. | Likely | The setup checklist (FR-10.1) shows counts per step and a "Ready for first order" state: at least one lab unit, sample type, orderable test, referring site. | Setup FRS |

The five that matter most for the first mockup are H-1, H-2, H-3, H-5 and H-6: they all live on the review screen.

---

## Part 3. Recommended next step: the Import Review, starting on Organizations

The Organizations import is the right place to start. It is shipped, it has real QA findings against it, it is the most dangerous import (Replace deactivates places that orders come from), and its review screen is the one every other area will reuse.

**Design brief (draft, for the first preview)**

- **Purpose:** let a site lead see what a file will do to their organizations, deal with what needs them, and apply with confidence, in minutes rather than an afternoon.
- **Primary user action:** read the summary, clear the "Needs you" items, Apply.
- **Layout:** the existing Import / Export page with three steps shown at the top (Upload, Review, Done). Review is ordered by urgency: a one-sentence summary; **Needs you** (decisions and possible renames, grouped, with group answers); **Will be deactivated** (Replace only, first and prominent, with open orders); **Will change** (updated rows, before and after with human labels, expandable); **New**; **Problems** (rejected and ignored, with what to do); **Unchanged** (collapsed, count only).
- **Interaction model:** grouped DataTables with expandable rows, filters by outcome and type, server paging; inline decisions; sticky Apply bar showing what is still open; Apply confirmation restating counts; Done shows the result and **Undo this import**.
- **Scope boundary:** no workbook (CSV as today), no packs, no central ownership. Those are later slices; the review component must not need changing when they arrive.
- **Carbon components:** ProgressIndicator, Tile (summary), DataTable with expandable rows and batch actions, RadioButtonGroup / ContentSwitcher for group decisions, InlineNotification, Modal (danger) for Replace confirm, Pagination.
- **IA:** unchanged. `Admin → Locations & Organizations → Import / Export`; breadcrumb `Home / Admin Management / Locations & Organizations / Import / Export`; route `/MasterListsPage/locations/import` (L&O, shipped).
- **Access:** `organization:import` (NEW in L&O) to preview, decide and apply; Undo needs the same.
- **Sample data:** PNG facilities (the L&O example file), one Replace file that would wrongly deactivate referring clinics, one file with 38 near-name matches, one with Excel-mangled codes.

Decisions D-12 to D-15 affect what this screen shows (Undo, `(clear)`, registry rows, where the component lives), so they come first.

---

## Decisions needed from Casey

| # | Question | Recommendation |
|---|---|---|
| D-12 | One rule when a central source owns a record: lock, or explain and allow local overrides (D-109)? | Explain, don't lock, for every central source; locking only as a per-pack option a national programme turns on. |
| D-13 | Undo an import: in scope now (moves out of L&O Deferred) or later? | In scope, first on Organizations; it is the safety net that makes Replace tolerable. |
| D-14 | Clearing a value through import with a `(clear)` keyword (L&O lists it out of scope)? | Allow it, shown in the Preview as "will be cleared". |
| D-15 | Where Import lives: one shared review component on each area page, or a central page? | Shared component on each area page; central page only for full workbook and packs. |
| D-16 | Split this document into an architecture and roadmap doc plus one FRS per slice? | Yes. First slice FRS: Import Review (Organizations first, then the catalog page). |

## Recommended fix order

1. Decisions D-12 to D-16.
2. Rename this file's role (architecture and roadmap) and fix F-04, F-07, F-11 in it.
3. Write the Import Review FRS with Lab Context, ACs (OGC-1420 and OGC-1466 tripwires as ACs), privileges, localization and Dependencies (F-01 to F-03, F-05, F-06), and build its preview on Organizations.
4. HIGH findings F-12 to F-18 go into the slice FRSs they belong to.
5. MEDIUM and LOW as each slice is written.

## Registry upkeep

- Add a spec-registry row: "Reference Data as Configuration (architecture)" with entities `configuration_import_run`, `unresolved_reference`, `reference_alias`, change set (NEW), snapshot (NEW), record source and owner (NEW), pack manifest (NEW); routes `/MasterListsPage/CatalogImport`, `/MasterListsPage/locations/import`; shared concepts: import review, outcome vocabulary, Replace scope (D-108), matching identifiers (D-107); downstream: L&O, Document Library, M-01, M-02, Catalog Subscription, Admin Redesign.
- Candidate decisions once answered: D-12 to D-16, plus "blank always means unchanged in every import" and "a range set or rule's conditions are part of the test's definition".
