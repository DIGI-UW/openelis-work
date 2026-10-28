# Import Review: Functional Requirements Specification

**Version:** 0.4 (design critique and rage pass 3, `import-review-critique.md`, Z-1 to Z-16: a **Before you apply** panel lists everything that needs the user, replacing the outcome tiles; review sections collapse, with one **Show** filter; every decision group uses one table; a unit or result-type change on a test with results is a decision with **Create a new version of this test** recommended (RD-24); a range-coverage warning; warnings checked in place; one control per record to be deactivated; a What changes column; **Discard this preview**; **Export with codes** and an Export panel; one term, "Not answered yet". v0.3: second `/analyze` and fury pass, `reference-data-config-analyze-2.md`: answers saved as given and Apply safe on a dropping connection; rows changed after the preview wait instead of blocking Apply (RD-20); later imports no longer block Undo (RD-21); catalog areas fully specified in section O (RD-22); "Replace" kept with always-visible help and an under-a-quarter question (RD-23); one count model; group answers show their reach and can be cleared; problems grouped by reason; French Excel files (semicolons, decimal commas); range bands shown as added, changed, removed; one tick per guarded field; localization rebuilt with reuse, whole-sentence area keys and translator notes. v0.2: sense checks, guarded changes, impact check, Undo's limits, Compare only. v0.1: first draft)
**Date:** 2026-10-20
**Author:** Casey, Director of Product (drafted with Claude)
**Status:** Draft, awaiting review
**Parent:** Reference Data as Configuration, Architecture and Roadmap v0.6 (`reference-data-config/reference-data-config-frs.md`), slice P1b. Import rules R-1 to R-11 are defined there (section 4.8) and apply here, except R-7 (stale downloads) and R-6's row-signature check, which arrive with the workbook in P2; R-6's duplicate-identifier check applies now.
**First screen:** Locations & Organizations, Import / Export (OGC-1363). **Second:** Import Catalog (OGC-1194).
**Mockup:** `import-review-mockup.jsx` (developer handoff, `@carbon/react` 1.118). **Preview:** `import-review-preview.html` v0.4. **Critique:** `import-review-critique.md`.
**Evidence:** OGC-1420 (L&O deep test), OGC-1466 (catalog import), shipped `ImportExportView.jsx` and `CatalogImport.jsx` on develop `f72854e`, `/analyze` of 19 Oct (`reference-data-config-analyze.md`, pre-mortem H-1 to H-17).
**Decisions:** RD-12 to RD-23 of the architecture document (RD-12 to RD-16 applied as recommended, provisional; RD-17 change control deferred; RD-18 no effective dating; RD-20 to RD-26 decided by Casey).

---

## Lab Context

### Current State
When a lab sets up OpenELIS or receives an updated list from the Ministry of Health (new health centres, a renamed hospital, closed clinics, a revised test list), an administrator uploads it as a CSV (comma-separated values) file on an admin page. Two pages do this today: **Locations & Organizations → Import / Export** for facilities, wards and sampling sites, and **Import Catalog** for the test catalog. Both show a preview before anything is saved. The Locations preview shows a row of counts (new, updated, deactivated and so on), then a list of possible renames, then a list of rows that need a decision, then, in Replace mode, a bulleted list of records that will be deactivated, then every row of the file in one long table. The person doing this is usually the lab's IT focal person or lab manager, a few times a year, often in French or Spanish.

### Pain
- **Hundreds of questions before Apply.** A 5,000-row file of new facilities produced 5,000 "possible rename" questions, because "Gerehu Health Centre" was paired with "Kaugere Health Centre" for sharing two common words. Apply stays disabled until every one is answered, one radio button at a time (OGC-1420).
- **Replace takes out more than the user meant.** Exporting the referral labs and re-importing that same file in Replace mode would have deactivated 44 referring clinics, one with 339 open orders, because a hospital that is both a referral lab and a referring clinic put every referring clinic in scope. The preview also showed 0 open orders for a site that had 44.
- **The preview cannot be trusted.** On the catalog page, the preview said 2 tests would be created and Apply created 1 and updated 1; a second preview doubled the problems because the first one had saved them (OGC-1466).
- **The problems are hidden in the file.** All rows, including hundreds of unchanged ones, are shown in file order with database field names ("gpsLatitude: (none) → -9.47"). Unknown columns are dropped without a word.
- **Messages are written for developers** ("Unexpected token '<' ... is not valid JSON") and close after six seconds at the top of a page scrolled 3,000 pixels down.
- **No way back.** Once applied, the only recovery is to fix records one by one.

### What Changes
The review screen leads with one sentence ("This file adds 12 facilities, updates 31 and deactivates 4. 2 need your answer."), then a short **Before you apply** list of the things that need the user, each one link away, grouped so that 38 look-alike names take one answer, not 38. Everything else sits in sections that open on demand, so the page does not grow with the file. In Replace mode, the records that will be deactivated come next, each with its real open-order count and a way to keep it. Updated records show before and after with the field names users see on the form. Problems say what is wrong, where, and what to do, and can be downloaded as the user's own file with a status column to fix in Excel. Apply does exactly what the preview said, can apply what is ready while a few questions wait, and runs in the background. Every applied import can be undone from the import history. The same screen serves facilities today and the test catalog next, so a lab learns it once.

---

## Overview

The Import Review is one shared screen component used by every area's import page. It takes one or more uploaded files for an area, runs them through the reference-data pipeline in Preview, presents the outcome, collects decisions, applies, and keeps a history with Undo. This version covers CSV files on the Locations & Organizations page and then the Import Catalog page. The Excel workbook, packs and central sources are later slices; the screen is designed so they add sections without changing these. Address-hierarchy files (levels and values) keep the shipped review until they move to the modern engine in P2; when an upload mixes them with organization files, the address files are previewed and applied first in the shipped review, then the organization files open in this one. Catalog areas are specified in section O.

### Navigation & URL

No new pages. The component replaces the review part of two existing pages.

| Page | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Locations & Organizations import | `Admin → Locations & Organizations → Import / Export` | `Home / Admin Management / Locations & Organizations / Import / Export` | `/MasterListsPage/locations/import` (shipped) |
| Catalog import | `Admin → Test Catalogue Management → Import Catalog (CSV)` | `Home / Admin Management / Import Catalog (CSV)` (shipped, `CatalogImport.jsx`; unchanged) | `/MasterListsPage/CatalogImport` (shipped) |

- **Deep links:** `?run=<runId>` opens a run (its review if it is a preview still open, its result if applied). `?run=<runId>&show=<outcome>` opens the review filtered to one outcome (`decision`, `deactivated`, `updated`, `reactivated`, `new`, `rejected`, `warning`, `ignored`, `unchanged`, and `onlyHere` in Compare only). `?area=<area>` preselects the area (extends L&O FR-F2, which opens the page from a list's Import button).
- **Steps** are shown at the top (Upload, Review, Done) but are not separate routes; the run id carries the state.

---

## User Stories

1. The review opens with the summary sentence and the Before you apply panel; sections appear in the order of FR-B4, Needs your answer open and the others closed unless they hold an open item; empty sections are absent; there are no outcome tiles and no in-page tabs.
2. As a **site setup lead**, I want to answer a whole group of similar questions at once, so that a file of new health centres does not stop me with hundreds of look-alike names.
3. As a **site setup lead** using Replace, I want to see exactly which records will be deactivated and how many open orders each has, and keep any of them, so that I never cut off a clinic that is still sending samples.
4. As a **site setup lead**, I want to download my own file back with a message on each problem row, so that I can fix it in Excel and upload it again.
5. As a **lab manager**, I want to undo an import that turned out to be wrong, so that a bad file costs minutes, not a day of manual repairs.
6. As a **quality manager**, I want every import, preview and undo listed with who, when, which file and what changed, so that I can show an assessor that our reference data is controlled.

---
## Functional Requirements

### A. Upload

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | The page shows three steps at the top: **Upload**, **Review**, **Done**. The current step is highlighted; earlier steps can be revisited without losing answers (FR-C9). | Carbon ProgressIndicator |
| FR-A2 | **Files:** a drop zone accepts one or more `.csv` files for the page's areas. Each file shows its name, size, detected area (from the file name, changeable, as L&O FR-F1 and the shipped catalog page), row count, detected separator (comma or semicolon) and detected encoding, named for people ("Excel CSV UTF-8", "Excel CSV (Western European)"). Two files with the same name in one batch are refused with "Two files are called {name}. Rename one and add it again." (OGC-1466). Uploaded files are kept with the run until the run is purged (FR-K2). | |
| FR-A3 | **Mode:** **Add & update** is preselected; **Replace** and **Compare only** (section M) are the other choices. Each mode's help text is always visible, not behind a tooltip. Choosing **Replace** shows, as soon as files are added, the scope sentence for the actual files (R-4, FR-D4, section O), in plain words. Areas where Replace has nothing to deactivate (section O) show Replace disabled with the reason. | RD-23: the word "Replace" stays; translator note in table 1 |
| FR-A4 | **File checks before Preview**, each shown under the file, never as a page-level error. The separator is detected first (comma, or semicolon as saved by Excel in French, Spanish and other locales), then: a missing required column names the column and the area's template ("This file has no 'name' column. Facilities, wards and sites files need type and name. Download the template."; the first sentence is shared, the second is the area's); unknown columns are listed ("These columns are not used and will be ignored: Region2, Notes"); a file saved as UTF-16 (detected by its byte order mark or zero bytes) is refused with "This file is saved as Unicode (UTF-16). Save it as CSV UTF-8 and add it again."; any other file that is not valid UTF-8 is read as Excel CSV (Western European), as `CsvParsingUtil.openCsvReader` does. | R-8; replaces "must have a 'type' column" |
| FR-A5 | **Preview** starts the run. Progress shows rows checked out of total, and a **Stop** button ends the preview (the run is kept as Stopped and can be previewed again). The user can leave the page; the run continues, appears in Recent imports (FR-K1), and an in-app notification says when it is ready ("Your preview of facilities.csv is ready to review."). | Background job; Y-18, Y-11 |
| FR-A6 | **Numbers in the user's format:** in numeric columns, a decimal comma is accepted when the file's separator is a semicolon or the user's interface language writes decimals with a comma, and the Preview shows the reading as information ("Read 4,5 as 4.5"). A value containing both a comma and a point (for example "1.234,5") is Rejected with "Line {line}, {column}: write the number without thousands separators." | Y-6 |
| FR-A7 | **Other open runs:** when another user has an open preview or a running Apply on the same area, the Upload step and the Apply bar say so ("Open: Joseph Kila's preview of facilities.csv, 14:02"). A run that has to wait for another to finish says "Waiting for Joseph Kila's import to finish." | Y-14 |
| FR-A8 | **Export** (Locations & Organizations only, since the page is Import / Export): the Upload step has an Export panel: **What to export** (an area of the page) and **Download CSV**, with the area's help on the filter line ("The file starts with a line that records the filters used. If you import it back with Replace, only those records can be deactivated. Filter a list first to export part of it."). It writes the same file as the list's Export (L&O FR-G1, architecture FR-4.4) and needs L&O's export access. The catalog page keeps its shipped export. | Z-4 |

### B. Review: summary and counts

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | A summary heads the review in the user's words, built from area-supplied clauses (FR-L4) joined in the locale's list format: "This file adds 12 facilities and 6 wards / depts, updates 31, deactivates 4 and leaves 1,712 unchanged." Clauses with a zero count are left out. A second sentence gives the decisions: "2 need your answer before they can be applied." On the catalog screen a range clause is added when ranges are removed ("removes 4 ranges"). | Y-9, Y-7 |
| FR-B2 | **One count model.** Every count on the page counts records per kind, with children counted as their own kind ("4 facilities and 6 wards / depts"), and reads the run's current state: the summary, the Before you apply panel, section headers, the Apply bar, the Apply confirmation, Done and the run history always show the same numbers, recalculated on the server after every answer, Keep active or tick. | Y-9 |
| FR-B3 | **Before you apply** panel, below the summary (replaces the outcome tiles). One row per open item: each decision group ("Several possible matches: 3 not answered yet", **Answer**), each guarded-field tick ("Reporting code changes: 4 to check", **Check**), each warning group ("Warnings: Range coverage: 1 to check", **Check**), the too-many group, and in Replace the records to be deactivated (**Show**). Each row shows its progress ("6 answered", "3 checked") and an icon for open or done; its action opens the section, scrolls to the first open item and moves focus there. Rows that do not block Apply (decisions, FR-C8) are marked "(can wait)", and the footer says "Questions you leave unanswered do not stop Apply. Those rows wait, and you can answer them later from Recent imports." The header shows "{done} of {total} done". The panel is absent when nothing needs the user. **Next unanswered** sits in the panel. | Z-3, Z-5, Z-13 |
| FR-B4 | **Sections.** The review sections appear in this order, each a collapsible section whose header is a disclosure button with its count in the summary's words ("Will change: 32 records: 31 updated, 1 reactivated"): **Needs your answer** (section C, "3 not answered yet" or "all answered"), **Will be deactivated** (section D, Replace only; in Compare only, **Only on this server** takes its place), **Will change** (section E), **New** (section F), **Problems** (section G: rejected, warnings, ignored), **Unchanged**. Needs your answer is open on arrival, and so is any section holding an open panel item; the others start closed, and Unchanged loads only when opened. Empty sections are left out. One **Show** dropdown above the sections ("All outcomes", then each outcome with its count) filters the review to one outcome and is the `show=` deep link. OpenELIS does not use in-page tabs. | Z-7, Z-15; decisions first, then impact |
| FR-B5 | **One problem dominates:** when one rejection reason covers more than half the rows, a notification above the panel says so with its fix ("1,792 of 1,800 rows: the region was not found. Import the geographic areas first."), linking to the Problems group. | Y-5 |
| FR-B6 | A "Nothing is saved yet" line stays under the summary until Apply. | |

### C. Needs your answer (decisions)

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | Decisions are grouped by kind: **Possible renames** (a new row that looks like an existing record the file does not otherwise match, L&O FR-F12), **Several possible matches** (a row matching two or more records, L&O FR-F4 (4)), **Has active {children} not in this file** (a record Replace would deactivate whose children the file's scope does not cover, FR-D5), and **Changed since preview** (a row whose record someone changed after the preview, in a field the row writes, FR-H3; RD-20). Later slices add **Changed since you downloaded** (R-7) and **Changed by {publisher}** (architecture 4.4) in the same pattern. Group headings, help and answers that need the area's words come from the area (FR-L4). On the catalog screen, **Changes what past results mean** (a unit or result-type change on a test with results, FR-O8) is a decision group too. | |
| FR-C2 | **One table for every decision group.** One row per line, with the columns Line, In your file (name, code, location or parent), Already in OpenELIS (or Candidates, one per line), Why matched (or Why asked: "They share: Tokarara, same district"; "The unit changes from mg/dL to mmol/L"), and Answer (the row's radio group). Each candidate shows its code, location, status and open orders. Differences between the file and a candidate are marked in text, not colour alone. Changed since preview shows the field, the value in the file, the value at preview and the value now, with who changed it and when. Each row carries the tag **Not answered yet** until answered. | Z-10 |
| FR-C3 | **Group answers:** above each group's table, the group's answers (Possible renames: the area's two answers, for organizations **All new places** and **All the same place, renamed**; Several possible matches: **Create all as new**, **Skip all**; Has active children: **Keep all active**; Changed since preview: **Use the file for all**, **Keep current for all**). Each answer states its reach under it ("Answers all 300 rows, 25 on this page"). When a group has more than 25 unanswered rows, choosing a group answer first shows the 5 closest pairs and what they share, with **Answer all 300** and **Cancel**. **Clear this group's answers** removes the group answer; per-row answers given before it come back. Per-row answers can still be changed after a group answer. All group answers are tertiary buttons of equal weight; none is styled as the next step, because each one answers many rows at once. | Y-4 |
| FR-C4 | **Per-row answers:** Possible rename: the area's two answers (organizations: **Same place, renamed** or **New place**). Several possible matches: **Use** one of the candidates (each with its code, location, status and open orders), **Create new**, or **Skip row**. Has active children: **Deactivate with its {count} {children}**, **Deactivate {name} only**, **Keep active** (area clauses, as L&O FR-E2). Changed since preview: **Use the file's value** or **Keep the current value**. No answer is preselected in any group. Changes what past results mean: FR-O8. | As L&O FR-F8, FR-F12 |
| FR-C5 | **Remember this name** (when a candidate is used) stores the spelling as an alias so it resolves by itself next time, as L&O FR-F8. | `reference_alias` |
| FR-C6 | **Too many questions:** when the run, across all groups, would need more than 50 match decisions, the section opens with the area's explanation instead of the list (organizations: "{count} rows look like places you already have but carry no code. If this file lists new places, treat them all as new. If they are the same places, add a code column (export first to get the codes) and upload again."), with three choices and none preselected: **Treat all as new**, **Leave them waiting** (they stay in Needs your answer and the rest can apply), **Show them anyway**. Beside the explanation, **Export with codes** downloads the waiting rows in the file's own columns and separator, with a code column filled with the code of the record each row most closely matches (blank when none) and a column naming that record, so the user can check the codes and upload the file again. It needs the area's export privilege. | R-10 cap per run; Y-4, Y-19c |
| FR-C7 | Matching ignores the area's common words (organizations: Health, Centre, Center, Clinic, Hospital, Laboratory, Lab, Aid Post, General, District, Provincial, Urban, Rural; catalog areas in section O; translatable), so names that share only those words are not offered as renames. | R-10, OGC-1420 1a |
| FR-C8 | **Apply what is ready:** unanswered decisions do not block Apply. Rows waiting for an answer, and rows that depend on them (a ward whose parent row is waiting), stay waiting and are listed as such in the result with that reason; their answers can be given later from the run (FR-K3). | Architecture 4.6 partial apply |
| FR-C9 | **Answers are saved as they are given.** Every answer, Keep active, tick and new-version choice is saved to the run on the server immediately; the Apply bar shows "All answers saved" or "Not saved yet, reconnecting". Closing the tab, a dropped connection or a session timeout loses nothing: opening the run again shows every answer. Going back to Upload and re-previewing the same files keeps every answer whose row is unchanged. | Y-2 |
| FR-C10 | **Code rules** (each area's matching order otherwise as L&O FR-F4): a row whose code matches no record but whose name matches one record that has **no code** updates that record and adds the code (shown under Will change); if the matched record has a **different code**, the row goes to Several possible matches. | Y-19a |
| FR-C11 | Each answer re-evaluates, on the server, its row, the rows that depend on it and their sense checks, and updates every count in place (FR-B2). No answer ever needs a refresh. | M-4 |

### D. Will be deactivated (Replace only)

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | In Replace mode this section comes straight after Needs your answer and is expanded. It restates the scope sentence (FR-A3) and lists every record that will be deactivated: name, code, type, location or parent, **open orders** (real count) and active children. | OGC-1420 2b |
| FR-D2 | Records with open orders or active children are listed first, flagged "In use", with the counts in text. | |
| FR-D3 | **One control per record:** each row has a radio group, **Deactivate** (preselected, as Replace means) or **Keep active**; a test with open analyses has **Make not orderable** (preselected) or **Keep active** instead (FR-O1). A group answer **Keep all active** above the table states its reach ("Answers all 47 records") and has **Clear this answer**. There are no selection checkboxes. In-use records (FR-D2) make one Before you apply item, done once the section has been opened; the Replace confirmation still asks for its check (FR-H2). | Z-9 |
| FR-D4 | **Scope is per record** (R-4). For organizations, a record with several organization types is in scope only when the file holds rows of every one of its types; facility-registry records are never in scope (L&O FR-F11). Catalog scope rules are in section O. In every area, system-required records (architecture section 6) are never in scope, and when the file is an OpenELIS export, scope is further limited to the list filters recorded in its `#` filter line (architecture R-4), so re-importing a filtered export never touches records outside the filter. | OGC-1420 2a |
| FR-D5 | Deactivating a record with active children follows L&O FR-E2: the run deactivates the children with it only if the file's scope includes them; otherwise the record moves to Needs your answer, group Has active {children} not in this file (FR-C1). | |
| FR-D6 | **Impact.** Each record to be deactivated shows a **Used by** summary in its row ("44 open orders, 3 wards / depts, 2 pending referrals") and the full list by name in its expanded row, from the area's dependency list (architecture 4.12). Organizations: open orders, active wards / depts, sites located in it, pending referrals to it, result delivery settings, EQA participation, shipments, and standing agreements once Environmental and Vector Order Entry v4 adds them (D-103). Catalog areas: section O. | Architecture 4.12 |
| FR-D7 | **Under a quarter:** when a Replace file lists fewer than a quarter of the records its scope covers, the section opens with the area's question ("This file lists 40 of the 452 records in its scope. Replace would deactivate the other 412. Did you mean Add & update?") and **Switch to Add & update** (a new preview, answers kept) or **Continue with Replace**. | RD-23 guardrail |

### E. Will change

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | A table of updated and reactivated records: name, code, type, **What changes** and an outcome tag (Updated, Reactivated). What changes names the changed fields with their form labels ("Phone, Address"); a single changed field is shown in full in the row ("Phone: +675 325 1190 → +675 325 1199"), and a replaced set is summarised ("Ranges: 1 added, 2 removed"). Only rows with several changes, a replaced set or children expand; the expand control is a 32-pixel button. | Z-8; DataTable with expandable rows |
| FR-E2 | Field changes are shown as **field label, now, after import**, using the labels of the record's edit form ("GPS latitude", not `gpsLatitude`); an empty value reads "empty". A value cleared with the clear keyword shows "will be cleared" (R-2). A clear on a required field is Rejected with "Line {line}, {field}: this field is required and cannot be cleared." Sets of child rows that a file replaces (ranges, answer lists, panel members, sample types of a test, terminology codes) are shown per item as **Added**, **Changed** or **Removed**. | Y-7 |
| FR-E3 | A change to a field the facility registry supplies, on a registry record, shows "Will be overwritten by the next registry sync" next to that field (L&O FR-F11). A registry record's **Registry** tag has a toggletip: "From the facility registry. Name, code and location come from the registry and are not changed by this file. Active status and local settings are." (Z-11) | |
| FR-E4 | Filters above the table: type (multi-select showing the chosen names as tags, per the design addendum's "selected items show their labels"), field changed (multi-select), and search by name or code. The table is server-paged (25, 50, 100). | |
| FR-E5 | Records with changes under FR-E6 or FR-E7 sort to the top of Will change. | |
| FR-E6 | **Changes that need checking** (architecture 4.11). A change to a guarded field shows the area's caution tag (catalog: "Changes past results", red; organizations: "Changes reports", magenta) and the area's explanation with the count affected (for significant digits, "Ranges shown on past results will use the new number of digits."; for an organization's reporting code, "National reports and exports will show the new code from now on; past exports keep the old one."). Apply needs **one tick per guarded field across the run** ("I have checked all 300 changes to Reporting code", with the list expandable; "I have checked the change to {field}" when there is one); a per-row tick is also offered and either satisfies it. Each guarded field is one Before you apply item. A test's **unit or result type** is not ticked: on a test with results it is a decision (FR-O8, RD-24). A changed normal range says "Past results keep the range they were reported with." | Y-8, M-6, L-2, Z-1 |
| FR-E7 | **Impact of a rename or recode.** A changed name or code on a record with dependencies shows the same **Used by** summary as FR-D6. | Architecture 4.12 |

### F. New

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | A table of records that will be created: name, code, type, location or parent, and the number of other fields set; rows expand to every value. Same filters and paging as FR-E4. | |
| FR-F2 | A new row that the possible-match routine finds close to an existing record, but not close enough for a decision, shows "Similar to {name}" as information, never a block. | D-216 shared routine |

### G. Problems

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Rejected rows, grouped by reason:** each reason is a row with its count, three sample lines and its fix ("1,792 rows: the region was not found. Import the geographic areas first."); expanding shows every line. Each message says what is wrong, where (line and column) and what to do. Reasons are the area's (L&O FR-F7; catalog in section O) plus duplicates in the file (R-6: "Lines 14 and 52 both have DHIS2 ID Rp1k2mPqH3x"). | Y-5, OGC-1420 1c |
| FR-G2 | **Ignored:** unknown columns (named, with the number of rows that had a value) and values the area does not use (for example an address on a ward / dept row) with the lines affected. | R-8, OGC-1420 1d |
| FR-G3 | **Download with problems:** returns the user's file with two columns added at the left, **Import status** and **Import message**, every row in original order and every original value untouched, **in the file's own separator and encoding**, so it opens in Excel exactly as the user saved it. Rows with no problem read "OK". | Y-6 |
| FR-G4 | Rejected and ignored rows never block Apply; they are left out and listed in the result. | As L&O FR-F7 |
| FR-G5 | **Warnings:** rows that will apply but fail a sense check (architecture 4.10) are grouped by check, with the area's message and a link to the row ("Line 23, Glucose, normal range: the new range is 18 times the current one. Check the unit (mg/dL or mmol/L)."). Values that look changed by a spreadsheet are warnings too ("Line 9, phone: looks like a spreadsheet changed it (=+675 324 8200). Check the cell in Excel."). Blocking checks make the row Rejected instead. Organizations in this release: automatic delivery with no delivery password, two active records with the same name, type and location, and spreadsheet-changed values. Catalog: section O. **Warnings are checked where they are shown:** each check group has its own tick ("I have checked this warning", "I have checked these {count} warnings") and is one Before you apply item; Apply stays disabled until every warning group is checked (Z-5). The confirmation only restates them (FR-H2). | Architecture 4.10 |

### H. Apply

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | A sticky bar at the bottom of the review shows what Apply will do and what is still open, on separate lines: "Apply 53 changes." / "3 rows are not answered yet and will wait." / "All answers saved." When something blocks Apply it says "{count} things left before you can apply" with **Show**, which moves focus to the first open item in the panel. **Back** (secondary) is on the left and **Apply** (primary) on the right, as in every Carbon form; an overflow menu (**More actions**) holds **Discard this preview** (FR-H7). The bar never covers the focused control: the page scrolls the focused element above it. | Z-3, Z-11 |
| FR-H2 | **Apply** opens a confirmation restating the counts (FR-B2) and the warnings already checked ("3 warnings were checked and will be applied."). In Replace mode it lists the in-use records that will be deactivated by name (up to 10, then "and {n} more") and requires "I understand {count} records will be deactivated" (L&O FR-F9); nothing else is asked there. Apply stays disabled while any Before you apply item that does not say "(can wait)" is open (guarded ticks, warning groups); the bar says how many and links to them. The confirmation lists what Undo cannot take back (FR-J4) and says "Apply cannot be stopped once it starts. You can undo it afterwards." | Modal, danger kind in Replace; Y-18, Z-5 |
| FR-H3 | Apply runs in the background with progress. Before writing each row it checks whether the record changed after the preview **in a field this row writes**; such rows are not written and move to Needs your answer, group Changed since preview, and every other row applies (RD-20). The result counts equal the counts shown at confirmation, less any rows moved this way, which the result lists. | RD-20, Y-3 |
| FR-H4 | **Apply is idempotent per run.** Pressing Apply again, or a retry after a dropped connection, returns the run already running or finished; it never imports twice. | Y-1 |
| FR-H5 | Before writing, Apply records a snapshot of every value it will change, for Undo (R-9). | |
| FR-H6 | After a change to the files, the mode or a file's area, Apply is disabled until the preview is refreshed (**Refresh preview** in the bar); answers are kept (FR-C9). Answers, Keep active, ticks and new-version choices never need a refresh (FR-C11). | OGC-1466 TC-CX-IM-07 |
| FR-H7 | **Discard this preview** (bar overflow menu) asks "Discard this preview?" with "Your answers are discarded and nothing is applied. The run stays in Recent imports as Discarded, so others no longer see it as open." and **Discard preview**. The run becomes Discarded (FR-K1), its open-run notice (FR-A7) disappears, and the page returns to Upload. A user can discard their own preview; discarding another user's needs the area's import privilege and is recorded with who discarded it. | Z-16 |

### I. Done

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | Done shows the result in the past tense from area clauses ("Added 12 facilities and 6 wards / depts, updated 31, deactivated 4. 2 rows are waiting for your answer."), the result sections with their counts (FR-B4), and **Answer the waiting rows** (when any), **Download result report** (each row with its outcome), **Undo this import**, **View history**. An in-app notification also says when a background Apply has finished. | Y-11 |
| FR-I2 | Lists and pickers that show the imported records reflect the change without a restart (architecture FR-1.6). | |

### J. Undo

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | **Undo this import** is offered on Done and on every applied run in history. A later import that changed the same records does not block it (RD-21): those records are shown as in FR-J2 with the later value kept by default. | RD-21, Y-12 |
| FR-J2 | Undo opens a review in the same pattern, in three sections: **Will be deactivated** (records the run created), **Will be restored** (values it changed) and **Will be reactivated** (records it deactivated). Records created by the run that are now in use (orders, results, wards added later) are listed first with their counts and **Keep** preselected; the user can choose **Deactivate anyway**. A test created by the run that has open analyses can only be made not orderable (section O). Values changed after the run, by a person or a later import, show both values with **Keep the later value** preselected. The review ends with **Undo import** and the same confirmation pattern as Apply (FR-H2). | |
| FR-J3 | The Undo result says what it kept ("Undone, except 12 records kept because they are in use"), each kept record linked to its edit form; the run history status reads "Undone, 12 kept". Undo is recorded as its own run, linked to the run it undid, and each record's history shows it (L&O FR-K1). An undo can itself be undone. | Y-13 |
| FR-J4 | **What Undo cannot reverse** is stated in the Apply confirmation and again in the Undo review, in the area's words: copies other systems already took (organizations: a FHIR organization export already downloaded or pushed, or a list another system such as OpenMRS already synced; OpenELIS's own FHIR API reads its records live, and an import never writes to a facility registry), and reports already issued with the old values. | Architecture R-9 |

### K. Recent imports (run history)

| ID | Requirement | Notes |
|---|---|---|
| FR-K1 | A **Recent imports** table on each import page: date, user, file names, area, mode, type (**Import**, **Undo**, **Compare**), status (Running, Stopped, Preview ready, Applied, Applied with rows waiting, Undone, Undone with records kept, Expired, Discarded, Failed), counts. Sorted newest first, paged. | OGC-1420 9b |
| FR-K2 | Opening a run shows its review (a preview not yet applied and less than 7 days old) or its result. A preview older than 7 days is Expired: it offers **Preview again with my answers**, which re-runs the kept files (FR-A2) with every answer whose row is unchanged. Every run offers **Download with problems** and, for applied runs, **Download result report**. Files are purged with their run after 90 days. | Y-11 |
| FR-K3 | A run with rows waiting shows them in Needs your answer. Answering them re-previews only those rows (a row whose record changed since the run moves to Changed since preview), and applying applies only them, as a new run linked to the first. | M-3, Y-19d |
| FR-K4 | **Waiting rows are not forgotten:** the import page and the area's list page (for L&O, the Organizations list) show "{count} rows have been waiting for your answer since {date}" with a link, while any exist. | Y-11 |

### L. Messages, language and accessibility

| ID | Requirement | Notes |
|---|---|---|
| FR-L1 | Every message says what happened and what to do, in the user's language, without technical text. A failure the user cannot fix says "The import could not finish. Nothing was saved. Try again, and if it fails again send this reference to your administrator: {runId}." This text appears only when the job itself failed. | OGC-1420 4c |
| FR-L2 | **Connection lost:** when the page loses contact with the server during a Preview or Apply, it says "Connection lost. Your import is still running on the server. This page will reconnect." and reconnects to the run by itself; it never shows the failure text for a lost connection. | Y-1 |
| FR-L3 | Errors stay until dismissed and appear next to what they concern (under the file, in the row, in the bar), never only at the top of the page. Success messages may close after 10 seconds and are announced to screen readers. | OGC-1420 4a, 4b |
| FR-L4 | Each area supplies, through its own keys, every text that needs its words, as whole sentences or clauses (never a noun dropped into a shared sentence, Admin Redesign AS-36): summary and result clauses, children texts, group headings, help and answers for Possible renames, the too-many explanation, the under-a-quarter question, the scope sentence, dependency labels, guarded-field tags and messages, sense-check messages, rejection reasons, the outside-effects text and the common-word list. The component's own texts contain no area words. | Localization tables 2 and 3 |
| FR-L5 | **Screen reader and keyboard:** every table, panel row, section header, group answer and the Apply bar is reachable in reading order; section headers are disclosure buttons with `aria-expanded`; each decision row is a group whose name is its line and record ("Line 14, Tokarara Urban Clinic", in every group including Several possible matches); sections are landmarks; a **Next unanswered** control moves focus to the next row without an answer; answers, group answers and count changes are announced in a polite live region ("12 answered, 18 left"); progress is announced at most every 10 seconds; outcome tags are text plus colour. The page fits 1280 pixels wide without sideways scrolling; wide tables scroll inside their container. | WCAG 2.1 AA; Y-16, OGC-1420 9c |

### M. Compare only

| ID | Requirement | Notes |
|---|---|---|
| FR-M1 | **Compare only** previews the file as in Replace mode but offers no Apply. The review shows, in both directions, what the file has that this server lacks (New), what differs (Will change), and what this server has that the file lacks (**Only on this server**, in place of Will be deactivated). | Architecture FR-4.5 |
| FR-M2 | **Use this file to update** chooses Add & update or Replace and starts a new preview of the same files at once, keeping every answer (FR-C9). | M-5 |
| FR-M3 | A compare run is listed in Recent imports as type Compare and can be downloaded as a differences report (CSV: record, field, value here, value in file, or Only on this server / Only in file). | |

### N. Performance

| ID | Requirement | Notes |
|---|---|---|
| FR-N1 | A preview of a 5,000-row file completes within 60 seconds on the reference server (architecture FR-1.9: 4 CPU cores, 8 GB memory, database on the same host), with progress shown from the start. | |
| FR-N2 | Review tables are paged on the server; opening any section or filter, and recalculating counts after an answer, returns within 2 seconds for a 5,000-row run. | |

### O. Catalog areas (second screen, RD-22)

The Import Catalog page adopts the component for every catalog area it takes (architecture section 3.1). `dictionaries` and `test-results` join when P1a moves them to the modern engine; units of measure and answer categories when they exist (P1a). Each area below states its matching, Replace scope, children, dependencies (Used by), guarded fields, sense checks and rejection reasons. **In every area, system-required records (architecture section 6) are never in Replace scope.** The Replace scope sentence names the parts of the catalog the file covers ("This file has tests in Hematology and Chemistry. Tests in other lab units will not change.").

| Area (file prefix) | Matching | Replace scope (what can be deactivated) | Children (FR-D5) | Used by (FR-D6) |
|---|---|---|---|---|
| Lab units (`test-sections`) | name, normalised | lab units of the domains (Clinical, Environmental, Vector) present in the file | active tests in the lab unit | tests, workplans, users' lab-unit access |
| Sample types (`sample-types`) | abbreviation then description, within domain | sample types of the domains present in the file | active tests linked only to this sample type | tests and panels linked to it, open sample items, vector species and trap types, collection containers |
| Tests (`tests`) | local code, then name (exact, then normalised), FR-C10 | tests whose lab unit appears in the file's rows; in Replace mode a row's sample types replace the test's sample-type links (removing one is guarded) | none | architecture 4.12 list for a test |
| Result components (`result-components`) | test plus component code | components of the tests the file lists, in Replace mode (a component with results is guarded) | none | results |
| Answer lists per test (`test-results`) | test plus answer | answers offered by the tests the file lists, in Replace mode | none | results holding the answer, reflex conditions |
| Answers (`dictionaries`) | category plus answer text | answers in the categories present in the file | none | tests offering it, results holding it, reflex conditions, analyzer value mappings, answer terminology |
| Answer categories (`dictionary-categories`) | category identifier, then name | Replace not offered | none | answers in it, the code that reads it (section 6) |
| Units of measure (`units-of-measure`) | unit identifier, then name | Replace not offered (units in use are never deactivated by import) | none | tests and components using it |
| Ranges (`result-limits`) | test, sample type, component, sex, age band | each listed test's range set is replaced in both modes (architecture R-5); Replace adds nothing | none | results keep their own range |
| Panels (`panels`) | name, normalised | panels of the domains present in the file; in Replace mode a listed panel's members are replaced | none | order entry, programs |
| Test terminology (`terminology`) | test plus source plus code | in Replace mode, a listed test's codes of each source in the file are replaced | none | order routing from OpenMRS / FHIR (LOINC), export mappings |
| Answer terminology (`answer-terminology`) | answer plus source plus code | as test terminology, per answer | none | export mappings |
| Sample handling (`sample-handling`) | test plus sample type | Replace not offered | none | none |
| Reflex rules (`reflex-rules`) | rule name | rules whose condition test's lab unit appears in the file and that the file does not list; listed rules are rebuilt (R-5) | none | none |

| ID | Requirement | Notes |
|---|---|---|
| FR-O1 | **Tests with open analyses** are never deactivated by an import while they remain: the row offers **Make not orderable** (preselected: the test leaves order entry, stays active, and its open analyses can be completed and released) or **Keep active**, with "It has {count} open analyses, so it cannot be deactivated now." | Architecture 4.12 |
| FR-O2 | **Guarded fields** (FR-E6): a test's significant digits; removing a sample type from a test; a component's code; removing a component that has results; an answer's text and its normal flag. A test's unit and result type are decisions instead (FR-O8). | RD-24 |
| FR-O3 | **Sense checks** (FR-G5) are architecture 4.10's catalog rows, using the Test Catalog Completion v2 gate's rule and message wherever it defines one. They include **Range coverage** (architecture 4.10): "After this import, {test} has no normal range for: {groups}. Their results will not be flagged." (Z-2) | |
| FR-O4 | **Rejection reasons:** missing test name or lab unit; unknown lab unit, sample type or unit of measure (each also offered as a Possible match or, for units, **Add as a new unit**); a name longer than its limit (test 60, local code 10, sample type 40, abbreviation 10, lab unit 20, panel 20, answer category 50, unit 26 characters); unknown result type; a number that cannot be read; a coded answer with no category where the answer text exists in several categories; a reflex condition on an answer the test does not have; a "between" condition with one value; a range whose low limit is above its high limit (architecture 4.10). | Shipped loader limits |
| FR-O5 | **Common words** for catalog matching: Test, Assay, Level, Total. Specimen words (Serum, Urine, Blood) are deliberately excluded, so tests that differ only by specimen are never offered as renames of each other. | |
| FR-O6 | **Outside effects** (FR-J4): copies of the catalog other systems already took (an OpenMRS concept sync, an exported file, a FHIR export) keep the old values until they read again; reports already issued keep theirs. | |
| FR-O7 | When one upload carries several catalog areas, each area's scope is computed from its own files, and the review groups records by area (a filter and a column), so "Will be deactivated" never mixes lab units and tests without saying which is which. | |
| FR-O8 | **Changes what past results mean** (RD-24, architecture 4.11). A row that changes the unit or result type of a test with results goes to Needs your answer in this group, with the help "{name} has {count} results. Changing its {field} would show them in the new {field}. A new version keeps past results as they were." and three answers, none preselected: **Create a new version of this test (recommended)**; **Same measurement, only the label changes**, offered only when the two units are equivalent (architecture 4.11) and otherwise disabled with "{from} and {to} are different measurements. Choose a new version."; **Skip this row**. Until answered the row waits (FR-C8); it never applies by default. Choosing a new version shows what will happen ("A new test "Glucose, fasting" (CHE-GLU, mmol/L) is created with the file's ranges. The current test becomes "Glucose, fasting (to 2026-10-20)", is made not orderable and keeps its 12,400 results as they were. These stay on the current test until you move them: 2 panels, 1 analyzer mapping, LOINC 1558-6.") and the summary counts the new test and the test made not orderable. A test with no results changes unit or result type as an ordinary edit. | Z-1 |

---

## Business rules

R-1 to R-11 of the architecture document apply, except R-7 and R-6's row-signature check, which arrive with the workbook in P2. This FRS adds:

- **BR-1** A preview is a promise: Apply writes what the preview showed for every row the user did not change, and never writes over a change the preview did not show; such rows wait (FR-H3, RD-20).
- **BR-2** Nothing the preview finds is written to reference data or to the shared decision queue until Apply; the run, its row results and its answers are the only things a preview saves (OGC-1466 TC-CX-IM-03).
- **BR-3** Rows the user skipped are never written and are listed in the result.
- **BR-4** Apply runs at most once per run (FR-H4).

---

## Information & Data

**Reused:** `configuration_import_run` (runs), `unresolved_reference` (decision queue), `reference_alias` (remembered names), Organization and its identifiers (D-107), Test (`orderable`, `isActive`), record history (L&O FR-K1), the existing preview transaction.

**New (declared in Dependencies):** per-run row results, answers saved per answer (including new-version choices), per-record deactivation answers, guarded-field ticks, warning-group checks, uploaded files kept with the run, run snapshot for Undo, run type, status (including Discarded) and links, job progress and idempotency, the export filter line.

---

## Access

- **Organizations:** users with `organization:import` (NEW, defined by L&O) can upload, preview, answer, apply, keep records active and undo. Users with `organization:view` see Recent imports and results read-only (a change to L&O, which has no read-only variant; see Coordination). Others do not see the page.
- **Catalog:** users with `reference_data:import` (NEW, architecture section 11) do the same for catalog areas; users with `test:configure` see history read-only.
- **Discard:** anyone who can preview can discard their own preview; discarding another user's needs the area's import privilege.
- **Downloads** of a result report, Download with problems and a differences report are exports: they need the area's export privilege (organizations as L&O defines export; catalog `reference_data:export`; providers, when they adopt the component, `provider:export`, logged).

### Nominated privileges

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Preview, answer, apply and undo an organizations import; Compare only | **NEW** `organization:import` (L&O) | Test catalog and reference data | Roles with `organization:manage` |
| Preview, answer, apply and undo a catalog import; Compare only | **NEW** `reference_data:import` | Test catalog and reference data | Roles with `test:configure` |
| See import history and results | `organization:view` / `test:configure` (existing) | Test catalog and reference data | As today |
| Download result reports, problems files and differences reports | `organization:view` with L&O's export access / **NEW** `reference_data:export` | Test catalog and reference data | As L&O export / roles with `test:configure` |
| Export with codes, and the Export panel (FR-A8) | As downloads above | Test catalog and reference data | As downloads above |
| Discard another user's open preview | `organization:import` / `reference_data:import` | Test catalog and reference data | As import |
| Download templates | Same as seeing history | Test catalog and reference data | As today |

Until PR #3443 merges, the Admin role stands in for all of these.

---

## Localization

**Ownership.** The Import Review is a shared component. It owns the `importReview` keys in table 1, whose texts contain no area words; the namespace is a recorded exception to Admin Redesign AS-36's `admin.{page}.*` rule, because the component serves several admin pages. Each area owns every text that needs its words, as whole sentences or clauses (FR-L4): Locations & Organizations in table 2 (`admin.locations.import.*` for new keys, AS-36; shipped `label.locations.import.*` keys keep their names), the catalog in table 3 (`catalog.import.*`, the shipped catalog namespace). Neither references the other's keys. Assembled sentences (summary, result) join area clauses with the locale's list format; counts use ICU plurals.

**Status column:** **Reuse** = an existing key used as is; **Moved** = new key replacing a shipped L&O key that retires (old key named); **New**.

**Translator notes.** "Replace" (mode): deactivates records the file does not list; it never overwrites values (French: keep "Remplacer" only with this help). "Undo" (`importReview.undo*`): reverses an applied import, not "cancel" (French: "Revenir sur l'importation", not "Annuler"). "Needs your answer": a decision the user must take. The tile keeps the shipped outcome word "Needs decision"; the section heading is "Needs your answer".

### Table 1. Shared component keys

| Key | English fallback | Status | Context |
|---|---|---|---|
| `label.importReview.step.upload` | Upload | New | Step |
| `label.importReview.step.review` | Review | New | Step |
| `label.importReview.step.done` | Done | New | Step |
| `label.importReview.files` | Files | Moved (`label.locations.import.files`) | Upload, history column |
| `help.importReview.drop` | Drop CSV files here, or browse | Moved (`label.locations.import.drop`) | Drop zone |
| `label.importReview.area` | Area | Moved (`label.locations.import.area`) | File row selector |
| `label.importReview.file.detected` | {rows, plural, one {# row} other {# rows}}, {separator}, {encoding}, read as {area} | New | File line |
| `label.importReview.separator.comma` | comma separated | New | File line |
| `label.importReview.separator.semicolon` | semicolon separated | New | File line |
| `label.importReview.encoding.utf8` | Excel CSV UTF-8 | New | File line |
| `label.importReview.encoding.western` | Excel CSV (Western European) | New | File line |
| `error.importReview.file.sameName` | Two files are called {name}. Rename one and add it again. | New | File check |
| `error.importReview.file.missingColumn` | This file has no "{column}" column. | New | File check |
| `button.locations.template` | Download template | Reuse (shipped L&O key, used on L&O; catalog uses `catalog.import.template`) | File check link |
| `warning.importReview.file.ignoredColumns` | These columns are not used and will be ignored: {columns} | Moved (`warning.locations.import.ignoredColumns`) | File check |
| `error.importReview.file.utf16` | This file is saved as Unicode (UTF-16). Save it as CSV UTF-8 and add it again. | New | File check |
| `label.importReview.mode` | Import mode | Moved (`label.locations.import.mode`) | Upload |
| `label.importReview.mode.merge` | Add & update | Moved (`label.locations.import.mode.merge`) | Mode |
| `help.importReview.mode.merge` | Add new records and update matching ones. Nothing else changes. | Moved (`help.locations.import.mode.merge`) | Mode, always visible |
| `label.importReview.mode.replace` | Replace | Moved (`label.locations.import.mode.replace`) | Mode (translator note) |
| `help.importReview.mode.replace` | Also deactivate records that this file covers but does not list. Values are not overwritten by this choice, and nothing is deleted. | Moved (`help.locations.import.mode.replace`) | Mode, always visible |
| `label.importReview.mode.compare` | Compare only | New | Mode |
| `help.importReview.mode.compare` | Show the differences between this file and this server. Nothing can be applied. | New | Mode |
| `help.importReview.mode.replaceDisabled` | Nothing in this area is deactivated by an import. | New | Replace disabled (section O) |
| `button.importReview.preview` | Preview | Moved (`button.locations.import.preview`) | Upload |
| `button.importReview.stop` | Stop | New | Preview progress |
| `message.importReview.previewing` | Checking {done} of {total} rows. You can leave this page; we will tell you when the preview is ready. | New | Progress |
| `message.importReview.previewReady` | Your preview of {files} is ready to review. | New | In-app notification |
| `message.importReview.applied` | Your import of {files} has been applied. | New | In-app notification |
| `info.importReview.decimalComma` | Read {value} as {number} | New | Field note (FR-A6) |
| `error.importReview.row.thousands` | Line {line}, {column}: write the number without thousands separators. | New | Rejected |
| `message.importReview.otherRun` | Open: {user}'s preview of {files}, {time} | New | Upload, Apply bar |
| `message.importReview.waitingFor` | Waiting for {user}'s import to finish. | New | Progress |
| `message.importReview.summary.lead` | This file {clauses}. | New | Summary frame; clauses from the area |
| `message.importReview.summary.updates` | updates {count} | New | Summary clause (noun-free) |
| `message.importReview.summary.reactivates` | reactivates {count} | New | Summary clause |
| `message.importReview.summary.deactivates` | deactivates {count} | New | Summary clause |
| `message.importReview.summary.unchanged` | leaves {count} unchanged | New | Summary clause |
| `message.importReview.summary.decisions` | {count, plural, one {# needs your answer before it can be applied.} other {# need your answer before they can be applied.}} | New | Summary second sentence |
| `message.importReview.dominantReason` | {count} of {total} rows: {reason} | New | FR-B5 notification |
| `message.importReview.nothingSaved` | Nothing is saved yet. | Moved (`message.locations.import.nothingSaved`) | Under summary |
| `label.importReview.outcome.decision` | Needs decision | **Retired in v0.4** (tiles removed (FR-B3)) | Tile, tag |
| `label.importReview.outcome.deactivated` | Deactivated | Moved (`…outcome.deactivated`) | Tile, tag |
| `label.importReview.outcome.updated` | Updated | Moved (`…outcome.updated`) | Tile, tag |
| `label.importReview.outcome.new` | New | Moved (`…outcome.new`) | Tile, tag |
| `label.importReview.outcome.reactivated` | Reactivated | Moved (`…outcome.reactivated`) | Tile, tag |
| `label.importReview.outcome.rejected` | Rejected | Moved (`…outcome.rejected`) | Tile, tag |
| `label.importReview.outcome.warning` | Warnings | New | Tile, Problems group |
| `label.importReview.outcome.ignored` | Ignored | New | Tile, tag |
| `label.importReview.outcome.unchanged` | Unchanged | Moved (`…outcome.unchanged`) | Tile, tag |
| `label.importReview.outcome.cleared` | Will be cleared | New | Field change |
| `label.importReview.clearKeyword` | (clear) | New | Clear keyword (R-2); the English keyword is always accepted too; resolved on the server in the user's language |
| `error.importReview.row.requiredClear` | Line {line}, {field}: this field is required and cannot be cleared. | New | Rejected |
| `label.importReview.item.added` | Added | New | Child-row change |
| `label.importReview.item.changed` | Changed | New | Child-row change |
| `label.importReview.item.removed` | Removed | New | Child-row change |
| `label.importReview.section.needsAnswer` | Needs your answer | New | Section |
| `label.importReview.section.willDeactivate` | Will be deactivated | Moved (`label.locations.import.willDeactivate`) | Section, Undo review section |
| `label.importReview.section.willChange` | Will change | New | Section |
| `label.importReview.section.new` | New | New | Section |
| `label.importReview.section.problems` | Problems | New | Section |
| `label.importReview.section.unchanged` | Unchanged | New | Section |
| `label.importReview.section.onlyHere` | Only on this server | New | Compare section |
| `button.importReview.showUnchanged` | Show {count} unchanged | New | Section link |
| `label.importReview.group.match` | Several possible matches | New | Decision group |
| `help.importReview.group.match` | Each of these rows matches more than one existing record. | New | Decision group |
| `label.importReview.group.changed` | Changed since preview | New | Decision group (RD-20) |
| `help.importReview.group.changed` | Someone changed these records after this preview. Choose which value to keep. | New | Decision group |
| `button.importReview.group.createAll` | Create all as new | New | Group answer |
| `button.importReview.group.skipAll` | Skip all | New | Group answer |
| `button.importReview.group.keepAllActive` | Keep all active | New | Group answer |
| `button.importReview.group.useFileAll` | Use the file for all | New | Group answer (changed) |
| `button.importReview.group.keepCurrentAll` | Keep current for all | New | Group answer (changed) |
| `help.importReview.group.reach` | Answers all {total} rows, {onPage} on this page | New | Under each group answer |
| `label.importReview.group.samples` | The {count} closest pairs. Check them before answering all {total}. | New | Group answer check |
| `button.importReview.group.answerAll` | Answer all {total} | New | Group answer check |
| `button.importReview.group.clear` | Clear this group's answers | New | Group |
| `label.importReview.group.unanswered` | {count} without an answer | **Retired in v0.4** (`label.importReview.notAnswered`) | Group header |
| `label.importReview.column.inFile` | In your file | New | Decision table |
| `label.importReview.column.existing` | Already in OpenELIS | New | Decision table |
| `label.importReview.column.atPreview` | At preview | New | Changed since preview |
| `label.importReview.column.now` | Now | New | Changed since preview, field changes |
| `label.importReview.changedBy` | Changed by {user}, {time} | New | Changed since preview |
| `label.importReview.decision.use` | Use {name} | Moved (`label.locations.import.decision.use`) | Row answer |
| `label.importReview.decision.new` | Create new | Moved (`…decision.new`) | Row answer |
| `label.importReview.decision.skip` | Skip row | Moved (`…decision.skip`) | Row answer |
| `label.importReview.decision.remember` | Remember this name | Moved (`…decision.remember`) | Row option |
| `label.importReview.decision.useFile` | Use the file's value | New | Row answer (changed) |
| `label.importReview.decision.keepCurrent` | Keep the current value | New | Row answer (changed) |
| `button.importReview.treatAllNew` | Treat all as new | New | Too many questions |
| `button.importReview.leaveWaiting` | Leave them waiting | New | Too many questions |
| `button.importReview.showAnyway` | Show them anyway | New | Too many questions |
| `button.importReview.nextUnanswered` | Next unanswered | New | FR-L5 |
| `message.importReview.answeredCount` | {answered} answered, {left} left | New | Live region (FR-L5) |
| `common.name` | Name | Reuse | Column |
| `label.code` | Code | Reuse | Column |
| `common.type` | Type | Reuse | Column, filter |
| `common.location` | Location | Reuse | Column (with parent for wards) |
| `label.importReview.column.line` | Line | Moved (`label.locations.import.column.line`) | Column |
| `label.importReview.column.fieldsChanging` | Fields changing | **Retired in v0.4** (`label.importReview.column.whatChanges`) | Will change |
| `label.importReview.column.fieldsSet` | Other fields set | New | New |
| `label.importReview.column.outcome` | Outcome | Moved (`label.locations.import.column.outcome`) | Column, report |
| `label.importReview.column.openOrders` | Open orders | New | Deactivation |
| `label.importReview.column.message` | What to do | New | Problems |
| `label.importReview.inUse` | In use | New | Deactivation flag |
| `label.importReview.openOrders` | {count, plural, one {# open order} other {# open orders}} | New | Candidates |
| `button.importReview.keepActive` | Keep active | New | Deactivation row |
| `button.importReview.keepSelectedActive` | Keep selected active | **Retired in v0.4** (one control per record (FR-D3)) | Deactivation batch |
| `button.importReview.switchMerge` | Switch to Add & update | New | Under a quarter (FR-D7) |
| `button.importReview.continueReplace` | Continue with Replace | New | Under a quarter |
| `label.importReview.usedBy` | Used by | New | Impact label |
| `label.importReview.column.field` | Field | New | Field changes |
| `label.importReview.column.afterImport` | After import | New | Field changes |
| `label.importReview.empty` | empty | New | Field value |
| `label.importReview.guarded.tickRow` | I have checked this change | New | Row tick |
| `label.importReview.guarded.tickField` | I have checked all {count} changes to {field} | New | Run tick (FR-E6) |
| `label.importReview.similarTo` | Similar to {name} | New | New row note |
| `error.importReview.row.duplicate` | Lines {first} and {second} both have {label} {value}. | New | Rejected |
| `warning.importReview.row.converted` | Line {line}, {column}: looks like a spreadsheet changed it ({value}). Check the cell in Excel. | New | Warning |
| `label.importReview.problems.group` | {count, plural, one {# row} other {# rows}}: {reason} | New | Problems group row |
| `button.importReview.problems.showAll` | Show all {count} | New | Problems group |
| `label.importReview.ignored.column` | Column "{column}" ({count, plural, one {# row had a value} other {# rows had a value}}) | New | Ignored |
| `button.importReview.downloadProblems` | Download with problems | New | Problems, history |
| `label.importReview.file.status` | Import status | New | Annotated file header |
| `label.importReview.file.message` | Import message | New | Annotated file header |
| `label.importReview.file.ok` | OK | New | Annotated file value |
| `message.importReview.bar.ready` | Apply {count, plural, one {# change} other {# changes}}. | New | Apply bar |
| `message.importReview.bar.pending` | {count, plural, one {# row waits for your answer and will not be applied.} other {# rows wait for your answer and will not be applied.}} | **Retired in v0.4** (`message.importReview.bar.notAnswered`) | Apply bar |
| `message.importReview.bar.guarded` | {count, plural, one {# change needs your tick.} other {# changes need your tick.}} | **Retired in v0.4** (`message.importReview.bar.blocked`) | Apply bar |
| `message.importReview.bar.saved` | All answers saved. | New | Apply bar |
| `message.importReview.bar.unsaved` | Not saved yet, reconnecting. | New | Apply bar |
| `button.importReview.apply` | Apply | Moved (`button.locations.import.apply`) | Apply bar |
| `button.importReview.refresh` | Refresh preview | New | Apply bar |
| `common.back` | Back | Reuse | Apply bar |
| `label.importReview.confirm.title` | Apply this import? | Moved (`label.locations.import.confirm.title`) | Confirmation |
| `label.importReview.confirm.replace` | I understand {count, plural, one {# record will be deactivated} other {# records will be deactivated}} | Moved (`label.locations.import.confirm.replace`) | Confirmation tick |
| `label.importReview.confirm.warnings` | I have checked {count, plural, one {# warning} other {# warnings}} | **Retired in v0.4** (warnings are checked in place (FR-G5)) | Confirmation tick |
| `label.importReview.confirm.andMore` | and {count} more | New | Confirmation list |
| `message.importReview.confirm.noStop` | Apply cannot be stopped once it starts. You can undo it afterwards. | New | Confirmation |
| `label.importReview.outside.title` | Undo cannot take these back | New | Confirmation, Undo review |
| `message.importReview.outside.reports` | Reports already issued keep the values they were issued with. | New | Outside effects |
| `message.importReview.applying` | Applying {done} of {total}. You can leave this page; we will tell you when it is done. | Moved (`label.locations.import.working`) | Progress |
| `message.importReview.connectionLost` | Connection lost. Your import is still running on the server. This page will reconnect. | New | FR-L2 |
| `message.importReview.result.lead` | {clauses}. | New | Result frame; clauses from the area |
| `message.importReview.result.updated` | updated {count} | New | Result clause |
| `message.importReview.result.reactivated` | reactivated {count} | New | Result clause |
| `message.importReview.result.deactivated` | deactivated {count} | New | Result clause |
| `message.importReview.result.waiting` | {count, plural, one {# row is waiting for your answer.} other {# rows are waiting for your answer.}} | New | Result second sentence |
| `message.importReview.result.movedChanged` | {count, plural, one {# row was not applied because its record changed after the preview.} other {# rows were not applied because their records changed after the preview.}} | New | Result (RD-20) |
| `button.importReview.answerWaiting` | Answer the waiting rows | New | Done |
| `button.importReview.report` | Download result report | Moved (`button.locations.import.report`) | Done, history |
| `button.importReview.undo` | Undo this import | New | Done, history (translator note) |
| `button.importReview.history` | View history | New | Done |
| `message.importReview.waitingSince` | {count, plural, one {# row has been waiting for your answer since {date}.} other {# rows have been waiting for your answer since {date}.}} | New | Import page, area list (FR-K4) |
| `label.importReview.undo.title` | Undo the import of {date} | New | Undo review |
| `label.importReview.undo.section.restore` | Will be restored | New | Undo review section |
| `label.importReview.undo.section.reactivate` | Will be reactivated | New | Undo review section |
| `label.importReview.undo.keep` | Keep | New | Undo row choice |
| `label.importReview.undo.deactivateAnyway` | Deactivate anyway | New | Undo row choice |
| `label.importReview.undo.keepLater` | Keep the later value | New | Undo row choice |
| `button.importReview.undo.confirm` | Undo import | New | Undo review |
| `message.importReview.undo.result` | Undone{kept, plural, =0 {.} one {, except # record kept because it is in use.} other {, except # records kept because they are in use.}} | New | Undo result |
| `label.importReview.recent` | Recent imports | Moved (`label.locations.import.recent`) | History |
| `common.date` | Date | Reuse | History column |
| `common.user` | User | Reuse | History column |
| `label.importReview.column.mode` | Mode | New | History |
| `label.status` | Status | Reuse | History column |
| `label.importReview.column.counts` | Counts | New | History |
| `label.importReview.type.import` | Import | New | History type |
| `label.importReview.type.undo` | Undo | New | History type |
| `label.importReview.type.compare` | Compare | New | History type |
| `label.importReview.status.running` | Running | New | History status |
| `label.importReview.status.stopped` | Stopped | New | History status |
| `label.importReview.status.ready` | Preview ready | Moved (`label.locations.import.run.preview`) | History status |
| `label.importReview.status.applied` | Applied | Moved (`label.locations.import.run.applied`) | History status |
| `label.importReview.status.waiting` | Applied with rows waiting | New | History status |
| `label.importReview.status.undone` | Undone | New | History status |
| `label.importReview.status.undoneKept` | Undone, {count} kept | New | History status |
| `label.importReview.status.expired` | Expired | New | History status |
| `label.importReview.status.failed` | Failed | New | History status |
| `button.importReview.previewAgain` | Preview again with my answers | New | Expired run |
| `button.importReview.useToUpdate` | Use this file to update | New | Compare |
| `button.importReview.differences` | Download differences | New | Compare result |
| `label.importReview.differences.onlyHere` | Only on this server | New | Differences report |
| `label.importReview.differences.onlyInFile` | Only in file | New | Differences report |
| `label.importReview.differences.valueHere` | Value here | New | Differences report header |
| `label.importReview.differences.valueInFile` | Value in file | New | Differences report header |
| `label.importReview.accessibleRow` | Line {line}, {name} | New | Decision row group name (FR-L5) |
| `message.importReview.dependentWaiting` | Waits for line {line} | New | Pending reason (FR-C8) |
| `message.importReview.complete` | Import applied. | Moved (`label.locations.import.complete`) | Success notification |
| `error.importReview.failed` | The import could not finish. Nothing was saved. Try again, and if it fails again send this reference to your administrator: {runId}. | Moved (`message.locations.import.failed`) | Failure |
| `label.importReview.todo.title` | Before you apply | New (v0.4) | Before you apply panel (FR-B3) |
| `label.importReview.todo.progress` | {done} of {total} done | New (v0.4) | Panel header |
| `label.importReview.todo.canWait` | (can wait) | New (v0.4) | Panel row marker (FR-C8) |
| `message.importReview.todo.foot` | Questions you leave unanswered do not stop Apply. Those rows wait, and you can answer them later from Recent imports. | New (v0.4) | Panel footer (FR-C8) |
| `label.importReview.notAnswered` | {count} not answered yet | New (v0.4) | Panel row, section header, group header |
| `label.importReview.todo.answered` | {count} answered | New (v0.4) | Panel row |
| `label.importReview.todo.toCheck` | {count} to check | New (v0.4) | Panel row |
| `label.importReview.todo.checked` | {count} checked | New (v0.4) | Panel row |
| `label.importReview.todo.leftToWait` | {count} left to wait | New (v0.4) | Panel row |
| `button.importReview.todo.answer` | Answer | New (v0.4) | Panel row action |
| `button.importReview.todo.check` | Check | New (v0.4) | Panel row action |
| `button.importReview.todo.show` | Show | New (v0.4) | Panel row action, Apply bar |
| `label.importReview.todo.guarded` | {field} changes | New (v0.4) | Panel row for a guarded field |
| `label.importReview.todo.warnings` | Warnings: {check} | New (v0.4) | Panel row for a warning group |
| `label.importReview.todo.capRows` | {count} rows without a code | New (v0.4) | Panel row for the too-many group |
| `label.importReview.tag.notAnswered` | Not answered yet | New (v0.4) | Row tag |
| `label.importReview.section.allAnswered` | all answered | New (v0.4) | Section header |
| `label.importReview.section.records` | {total, plural, one {# record} other {# records}}: {parts} | New (v0.4) | Section header: count and parts |
| `label.importReview.section.part.updated` | {count} updated | New (v0.4) | Section header part |
| `label.importReview.section.part.reactivated` | {count} reactivated | New (v0.4) | Section header part |
| `label.importReview.section.part.deactivated` | {count} deactivated | New (v0.4) | Section header part |
| `label.importReview.section.part.kept` | {count} kept active | New (v0.4) | Section header part |
| `label.importReview.show` | Show | New (v0.4) | Show filter (FR-B3) |
| `label.importReview.show.all` | All outcomes | New (v0.4) | Show filter |
| `label.importReview.show.option` | {label} ({count}) | New (v0.4) | Show filter option |
| `label.importReview.column.whyMatched` | Why matched | New (v0.4) | Decision table |
| `label.importReview.column.whyAsked` | Why asked | New (v0.4) | Decision table |
| `label.importReview.column.candidates` | Candidates | New (v0.4) | Decision table |
| `label.importReview.column.answer` | Answer | New (v0.4) | Decision table |
| `label.importReview.column.whatChanges` | What changes | New (v0.4) | Will change (FR-E1) |
| `message.importReview.bar.notAnswered` | {count, plural, one {# row is not answered yet and will wait.} other {# rows are not answered yet and will wait.}} | New (v0.4) | Apply bar |
| `message.importReview.bar.blocked` | {count, plural, one {# thing left before you can apply} other {# things left before you can apply}} | New (v0.4) | Apply bar (FR-H1) |
| `button.importReview.bar.more` | More actions | New (v0.4) | Apply bar overflow menu |
| `button.importReview.discard` | Discard this preview | New (v0.4) | Overflow menu (FR-H7) |
| `label.importReview.discard.title` | Discard this preview? | New (v0.4) | Discard confirmation |
| `message.importReview.discard.body` | Your answers are discarded and nothing is applied. The run stays in Recent imports as Discarded, so others no longer see it as open. | New (v0.4) | Discard confirmation |
| `button.importReview.discard.confirm` | Discard preview | New (v0.4) | Discard confirmation |
| `message.importReview.discard.done` | Preview discarded. Nothing was applied. It stays in Recent imports as Discarded. | New (v0.4) | Notification after discard |
| `label.importReview.status.discarded` | Discarded | New (v0.4) | Run status (FR-K1) |
| `label.importReview.warnings.ackOne` | I have checked this warning | New (v0.4) | Warning group tick (FR-G5) |
| `label.importReview.warnings.ackMany` | I have checked these {count} warnings | New (v0.4) | Warning group tick (FR-G5) |
| `label.importReview.warnings.heading` | Warnings (will be applied; check each group) | New (v0.4) | Problems section |
| `message.importReview.confirm.warningsChecked` | {count, plural, one {# warning was checked and will be applied.} other {# warnings were checked and will be applied.}} | New (v0.4) | Apply confirmation restates |
| `label.importReview.guarded.tickOne` | I have checked the change to {field} | New (v0.4) | Run tick when one change |
| `button.importReview.exportCodes` | Export with codes | New (v0.4) | Too many questions (FR-C6) |
| `message.importReview.exportCodes.started` | Export with codes started | New (v0.4) | Notification |
| `message.importReview.exportCodes.body` | {file}: your {count} rows in your file's columns, plus the code of the record each one looks like. It will download when it is ready. | New (v0.4) | Notification |
| `label.importReview.export.title` | Export | New (v0.4) | Upload step, Export panel (FR-A8) |
| `label.importReview.export.area` | What to export | New (v0.4) | Export panel |
| `button.importReview.export.download` | Download CSV | New (v0.4) | Export panel |
| `message.importReview.export.started` | Export started | New (v0.4) | Notification |
| `label.importReview.deactivate` | Deactivate | New (v0.4) | Deactivation row answer (FR-D3) |
| `label.importReview.deactivate.keepAllReach` | Answers all {count} records | New (v0.4) | Group answer reach |
| `button.importReview.clearAnswer` | Clear this answer | New (v0.4) | Clear a group answer |

**Shipped L&O keys retired** (each replaced by the Moved key above, or no longer used): `label.locations.import.files`, `.drop`, `.area`, `.mode`, `.mode.merge`, `.mode.replace`, `.outcome.*` (including `.rename`), `.decision.use`, `.decision.new`, `.decision.skip`, `.decision.remember`, `.willDeactivate`, `.rows`, `.column.*`, `.confirm.title`, `.confirm.replace`, `.complete`, `.recent`, `.working`, `.run.applied`, `.run.preview`; `help.locations.import.mode.merge`, `.mode.replace`; `button.locations.import.preview`, `.apply`, `.report`; `warning.locations.import.ignoredColumns`; `message.locations.import.nothingSaved`, `.failed`.

### Table 2. Locations & Organizations keys (owned by L&O; new keys added in L&O v0.7)

| Key | English fallback | Status | Context |
|---|---|---|---|
| `admin.locations.import.summary.adds.facilities` | adds {count, plural, one {# facility} other {# facilities}} | New | Summary clause |
| `admin.locations.import.summary.adds.wards` | adds {count, plural, one {# ward / dept} other {# wards / depts}} | New | Summary clause |
| `admin.locations.import.summary.adds.sites` | adds {count, plural, one {# sampling site} other {# sampling sites}} | New | Summary clause |
| `admin.locations.import.result.added.facilities` | Added {count, plural, one {# facility} other {# facilities}} | New | Result clause |
| `admin.locations.import.result.added.wards` | added {count, plural, one {# ward / dept} other {# wards / depts}} | New | Result clause |
| `admin.locations.import.result.added.sites` | added {count, plural, one {# sampling site} other {# sampling sites}} | New | Result clause |
| `admin.locations.import.requiredColumns` | Facilities, wards and sites files need type and name. | New | File check, after the missing-column message |
| `admin.locations.import.group.children` | Has active wards / depts not in this file | New | Decision group |
| `admin.locations.import.childrenNotInFile` | {name} has {count, plural, one {# active ward / dept} other {# active wards / depts}} not in this file. | New | Decision row |
| `admin.locations.import.decision.withChildren` | Deactivate with its {count, plural, one {# ward / dept} other {# wards / depts}} | New | Row answer |
| `admin.locations.import.decision.parentOnly` | Deactivate {name} only | New | Row answer |
| `admin.locations.import.column.children` | Active wards / depts | New | Deactivation column |
| `label.locations.import.rename.title` | Possible renames | Reuse (shipped) | Decision group |
| `admin.locations.import.group.rename.help` | These rows look like places you already have under another name. | New | Decision group |
| `admin.locations.import.group.allNew` | All new places | New | Group answer |
| `admin.locations.import.group.allRenamed` | All the same place, renamed | New | Group answer |
| `label.locations.import.rename.same` | Same place, renamed | Reuse (shipped) | Row answer |
| `admin.locations.import.rename.new` | New place | New (replaces shipped `label.locations.import.rename.different`, "Different places", which retires) | Row answer |
| `admin.locations.import.tooMany` | {count} rows look like places you already have but carry no code. | Changed in v0.4 (the advice moved to `.tooMany.help`) | FR-C6 |
| `admin.locations.import.tooMany.help` | If this file lists new places, treat them all as new. If they are the same places, add the code column and upload again: Export with codes gives you this file's rows with the matching codes filled in. | New (v0.4) | FR-C6 |
| `admin.locations.export.help` | The file starts with a line that records the filters used. If you import it back with Replace, only those records can be deactivated. Filter a list first (Organizations, Sampling Sites) to export part of it. | New (v0.4) | Export panel (FR-A8) |
| `admin.locations.import.registry.label` | About registry records | New (v0.4) | Toggletip button name |
| `admin.locations.import.registry.help` | From the facility registry. Name, code and location come from the registry and are not changed by this file. Active status and local settings are. | New (v0.4) | Toggletip (FR-E3) |
| `admin.locations.import.underQuarter` | This file lists {listed} of the {total} records in its scope. Replace would deactivate the other {others}. Did you mean Add & update? | New | FR-D7 |
| `label.locations.import.replaceScope` | This file has {types} rows. {untouched} will not change. Wards / depts will only be replaced at {parents}. | Reuse (shipped) | Scope sentence |
| `label.locations.import.forThisFile` | For this file | Reuse (shipped) | Scope sentence lead |
| `label.locations.import.area.organizations` | Facilities, wards & sites | Reuse (shipped) | Area option |
| `label.locations.import.area.levels` | Geographic levels | Reuse (shipped) | Area option |
| `label.locations.import.area.values` | Geographic areas | Reuse (shipped) | Area option |
| `admin.locations.import.commonWords` | Health, Centre, Center, Clinic, Hospital, Laboratory, Lab, Aid Post, General, District, Provincial, Urban, Rural | New | FR-C7, translatable |
| `warning.locations.import.registryOverwrite` | Will be overwritten by the next registry sync | Reuse (shipped) | FR-E3 |
| `warning.locations.import.wardAddressIgnored` | Line {line}: address is ignored for wards / depts, which use their organization's address | Reuse (shipped) | Ignored |
| `admin.locations.import.dependency.openOrders` | {count, plural, one {# open order} other {# open orders}} | New | Used by |
| `admin.locations.import.dependency.wards` | {count, plural, one {# ward / dept} other {# wards / depts}} | New | Used by |
| `admin.locations.import.dependency.sites` | {count, plural, one {# site located here} other {# sites located here}} | New | Used by |
| `admin.locations.import.dependency.referrals` | {count, plural, one {# pending referral} other {# pending referrals}} | New | Used by |
| `admin.locations.import.dependency.agreements` | {count, plural, one {# standing agreement} other {# standing agreements}} | New | Used by (once Env/Vector v4 ships) |
| `admin.locations.import.dependency.delivery` | Result delivery settings | New | Used by |
| `admin.locations.import.dependency.eqa` | EQA participation | New | Used by |
| `admin.locations.import.dependency.shipments` | {count, plural, one {# shipment} other {# shipments}} | New | Used by |
| `admin.locations.import.guarded.tag` | Changes reports | New | Caution tag |
| `admin.locations.import.guarded.code` | National reports and exports will show the new code from now on; past exports keep the old one. | New | Guarded change |
| `admin.locations.import.outside` | Other systems that already copied these organizations (from a FHIR export or their own sync) keep the old values until they read them again. Undo restores OpenELIS's records. | New | Outside effects |
| `admin.locations.import.warning.autoNoPassword` | Line {line}, {name}: automatic delivery is on and there is no delivery password. Patient reports will not be sent until one is set. | New | Sense check |
| `admin.locations.import.warning.duplicateName` | Line {line}: another active record named "{name}" of the same type is in the same location. | New | Sense check |
| `admin.locations.import.reject.missingName` | Line {line}: name is empty. Every row needs a name. | New | Rejection (L&O FR-F7) |
| `admin.locations.import.reject.missingType` | Line {line}: type is empty. Use one of: {types}. | New | Rejection |
| `admin.locations.import.reject.unknownType` | Line {line}, type: "{value}" is not an organization type here. Use one of: {types}. | New | Rejection |
| `admin.locations.import.reject.areaType` | Line {line}: "{value}" is a geographic level. Geographic areas are imported with the geographic levels and areas files. | New | Rejection |
| `admin.locations.import.reject.parentNotFound` | Line {line}, {column}: nothing has the {label} {value}. Check it, or add that record first. | New | Rejection |
| `admin.locations.import.reject.regionFirst` | the region was not found. Import the geographic areas first. | New | Dominant-reason fix (FR-B5) |
| `admin.locations.import.reject.parentKind` | Line {line}: a ward / dept's parent must be a facility. | New | Rejection |
| `admin.locations.import.reject.gps` | Line {line}, {column}: enter decimal degrees, latitude -90 to 90 and longitude -180 to 180. | New | Rejection |
| `admin.locations.import.reject.typeCombination` | Line {line}: {types} cannot be combined on one record. | New | Rejection |
| `button.locations.import` | Import | Reuse (shipped) | List toolbar button |

Retired with the L&O v0.7 update: `label.locations.import.rename.different` (replaced by `admin.locations.import.rename.new`).

### Table 3. Catalog keys (owned by the catalog import, shipped namespace `catalog.import.*`)

Count clauses, one pair per area (the summary and result join them; each is a whole clause so languages can agree nouns):

| Key | English fallback | Status |
|---|---|---|
| `catalog.import.summary.adds.labUnits` / `catalog.import.result.added.labUnits` | adds / Added {count, plural, one {# lab unit} other {# lab units}} | New |
| `catalog.import.summary.adds.sampleTypes` / `…result.added.sampleTypes` | adds / Added {count, plural, one {# sample type} other {# sample types}} | New |
| `catalog.import.summary.adds.tests` / `…result.added.tests` | adds / Added {count, plural, one {# test} other {# tests}} | New |
| `catalog.import.summary.adds.components` / `…result.added.components` | adds / Added {count, plural, one {# result component} other {# result components}} | New |
| `catalog.import.summary.adds.answerLists` / `…result.added.answerLists` | adds / Added {count, plural, one {# answer to a test} other {# answers to tests}} | New |
| `catalog.import.summary.adds.answers` / `…result.added.answers` | adds / Added {count, plural, one {# answer} other {# answers}} | New |
| `catalog.import.summary.adds.categories` / `…result.added.categories` | adds / Added {count, plural, one {# answer category} other {# answer categories}} | New |
| `catalog.import.summary.adds.units` / `…result.added.units` | adds / Added {count, plural, one {# unit} other {# units}} | New |
| `catalog.import.summary.adds.ranges` / `…result.added.ranges` | adds / Added {count, plural, one {# range} other {# ranges}} | New |
| `catalog.import.summary.removes.ranges` / `…result.removed.ranges` | removes / Removed {count, plural, one {# range} other {# ranges}} | New |
| `catalog.import.summary.adds.panels` / `…result.added.panels` | adds / Added {count, plural, one {# panel} other {# panels}} | New |
| `catalog.import.summary.adds.terminology` / `…result.added.terminology` | adds / Added {count, plural, one {# code mapping} other {# code mappings}} | New |
| `catalog.import.summary.adds.handling` / `…result.added.handling` | adds / Added {count, plural, one {# sample handling rule} other {# sample handling rules}} | New |
| `catalog.import.summary.adds.reflex` / `…result.added.reflex` | adds / Added {count, plural, one {# reflex rule} other {# reflex rules}} | New |

(Each pair is two keys; the English shows "adds" for the summary key and "Added" for the result key.)

| Key | English fallback | Status | Context |
|---|---|---|---|
| `catalog.import.template` | Download template | New | File check link |
| `catalog.import.requiredColumns.tests` | Tests files need testName and testSection. | New | File check (one key per catalog area, naming that area's required columns from architecture section 3.1) |
| `catalog.import.dependency.containers` | Collection containers | New | Used by (sample types) |
| `catalog.import.dependency.answerTerminology` | Answer codes | New | Used by (answers) |
| `catalog.import.dependency.answers` | {count, plural, one {# answer} other {# answers}} | New | Used by (answer categories) |
| `catalog.import.group.rename` | Possible renames | New | Decision group |
| `catalog.import.group.rename.help` | These rows look like records you already have under another name. | New | Decision group |
| `catalog.import.group.allNew` | All are new | New | Group answer |
| `catalog.import.group.allRenamed` | All are the same, renamed | New | Group answer |
| `catalog.import.rename.same` | Same, renamed | New | Row answer |
| `catalog.import.rename.new` | New record | New | Row answer |
| `catalog.import.group.children.labUnit` | Lab units with active tests not in this file | New | Decision group |
| `catalog.import.group.children.sampleType` | Sample types whose tests are not in this file | New | Decision group |
| `catalog.import.childrenNotInFile.labUnit` | {name} has {count, plural, one {# active test} other {# active tests}} not in this file. | New | Decision row |
| `catalog.import.childrenNotInFile.sampleType` | {count, plural, one {# active test uses} other {# active tests use}} only {name} and {count, plural, one {is} other {are}} not in this file. | New | Decision row |
| `catalog.import.decision.withChildren` | Deactivate with {count, plural, one {its # test} other {its # tests}} | New | Row answer |
| `catalog.import.decision.parentOnly` | Deactivate {name} only | New | Row answer |
| `catalog.import.column.children` | Active tests | New | Deactivation column |
| `catalog.import.tooMany` | {count} rows look like records you already have but carry no code. | Changed in v0.4 (advice moved to `.tooMany.help`) | FR-C6 |
| `catalog.import.underQuarter` | This file lists {listed} of the {total} records in its scope. Replace would take the other {others} out of use (tests with open analyses are made not orderable instead of deactivated). Did you mean Add & update? | Changed in v0.4 (Z-7) | FR-D7 |
| `catalog.import.replaceScope.tests` | This file has tests in {labUnits}. Tests in other lab units will not change. | New | Scope sentence |
| `catalog.import.replaceScope.domain` | This file has {area} for {domains}. Other domains will not change. | New | Scope sentence (lab units, sample types, panels) |
| `catalog.import.replaceScope.categories` | This file has answers in {categories}. Other categories will not change. | New | Scope sentence |
| `catalog.import.replaceScope.children` | Replace changes only the {items} of the {count} records listed in this file. | New | Scope sentence (components, answer lists, terminology) |
| `catalog.import.replaceScope.reflex` | This file has reflex rules for tests in {labUnits}. Other rules will not change. | New | Scope sentence |
| `catalog.import.commonWords` | Test, Assay, Level, Total | New | FR-O5, translatable |
| `catalog.import.makeNotOrderable` | Make not orderable | New | FR-O1 |
| `catalog.import.makeNotOrderable.help` | The test leaves order entry. Open analyses can still be completed and released. | New | FR-O1 |
| `catalog.import.keepAsIs` | Keep as is | **Retired in v0.4** (`button.importReview.keepActive` (FR-O1)) | FR-O1 |
| `catalog.import.guarded.tag` | Changes past results | New | Caution tag |
| `catalog.import.guarded.unit` | This test has {count, plural, one {# result} other {# results}}. Past results will show the new unit. | **Retired in v0.4** (`catalog.import.meaning.help` (FR-O8)) | Guarded change |
| `catalog.import.guarded.resultType` | This test has {count, plural, one {# result} other {# results}}. Past results will be read with the new result type. | **Retired in v0.4** (`catalog.import.meaning.help` (FR-O8)) | Guarded change |
| `catalog.import.guarded.digits` | Ranges shown on past results will use the new number of digits. | New | Guarded change |
| `catalog.import.guarded.sampleType` | {count, plural, one {# result was} other {# results were}} on this sample type. Past results keep it; it can no longer be ordered with this test. | New | Guarded change |
| `catalog.import.guarded.component` | {count, plural, one {# result uses} other {# results use}} this component code. | New | Guarded change |
| `catalog.import.guarded.answer` | {count, plural, one {# result shows} other {# results show}} this answer. Past results will show the new text. | New | Guarded change |
| `catalog.import.guarded.range` | Past results keep the range they were reported with. | New | Range note |
| `catalog.import.newVersion` | Create a new version of this test (recommended) | Changed in v0.4 (FR-O8) | Guarded change option |
| `catalog.import.newVersion.suffix` | {name} (to {date}) | New | Old test's name after a new version; stored per locale with `localization:xx` |
| `catalog.import.rangesRemoved` | Line {line}, {test}: the file has {listed, plural, one {# range} other {# ranges}}; {removed, plural, one {# other will be removed} other {# others will be removed}}. | New | Warning (Y-7) |
| `catalog.import.dependency.openAnalyses` | {count, plural, one {# open analysis} other {# open analyses}} | New | Used by |
| `catalog.import.dependency.results` | {count, plural, one {# result} other {# results}} | New | Used by |
| `catalog.import.dependency.panels` | {count, plural, one {# panel} other {# panels}} | New | Used by |
| `catalog.import.dependency.reflex` | {count, plural, one {# reflex rule} other {# reflex rules}} | New | Used by |
| `catalog.import.dependency.analyzers` | {count, plural, one {# analyzer mapping} other {# analyzer mappings}} | New | Used by |
| `catalog.import.dependency.calculated` | {count, plural, one {# calculated test} other {# calculated tests}} | New | Used by |
| `catalog.import.dependency.alerts` | {count, plural, one {# alert rule} other {# alert rules}} | New | Used by |
| `catalog.import.dependency.labels` | {count, plural, one {# label preset} other {# label presets}} | New | Used by |
| `catalog.import.dependency.qc` | QC targets and control lots | New | Used by |
| `catalog.import.dependency.methods` | Method and reagent links | New | Used by |
| `catalog.import.dependency.programs` | {count, plural, one {# program} other {# programs}} | New | Used by |
| `catalog.import.dependency.notifications` | Notification settings | New | Used by |
| `catalog.import.dependency.routing` | Order routing codes (LOINC) | New | Used by |
| `catalog.import.dependency.exports` | Export mappings | New | Used by |
| `catalog.import.dependency.referrals` | Referral lab test lists | New | Used by |
| `catalog.import.dependency.tests` | {count, plural, one {# test} other {# tests}} | New | Used by (sample types, lab units, units, answers) |
| `catalog.import.dependency.sampleItems` | {count, plural, one {# open sample} other {# open samples}} | New | Used by (sample types) |
| `catalog.import.dependency.workplans` | Workplans | New | Used by (lab units) |
| `catalog.import.dependency.access` | {count, plural, one {# user's lab-unit access} other {# users' lab-unit access}} | New | Used by (lab units) |
| `catalog.import.dependency.vector` | Vector species and trap types | New | Used by (sample types) |
| `catalog.import.dependency.orderEntry` | Order entry | New | Used by (panels) |
| `catalog.import.reject.missingTest` | Line {line}: test name is empty. | New | Rejection |
| `catalog.import.reject.missingLabUnit` | Line {line}: lab unit is empty. | New | Rejection |
| `catalog.import.reject.unknownLabUnit` | Line {line}, lab unit: "{value}" was not found. Check the name, or add the lab unit first. | New | Rejection (also a Possible match) |
| `catalog.import.reject.unknownSampleType` | Line {line}, sample type: "{value}" was not found. Check the name, or add the sample type first. | New | Rejection (also a Possible match) |
| `catalog.import.reject.unknownUnit` | Line {line}, unit: "{value}" is not a known unit. | New | Rejection, with **Add as a new unit** |
| `catalog.import.addUnit` | Add "{value}" as a new unit | New | Fix offered |
| `catalog.import.reject.tooLong` | Line {line}, {column}: {length} characters; the limit is {limit}. | New | Rejection |
| `catalog.import.reject.resultType` | Line {line}, result type: "{value}" is not one of {types}. | New | Rejection |
| `catalog.import.reject.number` | Line {line}, {column}: "{value}" is not a number. | New | Rejection |
| `catalog.import.reject.ambiguousAnswer` | Line {line}: "{value}" is in {count} answer categories. Add the category column. | New | Rejection |
| `catalog.import.reject.reflexAnswer` | Line {line}: {test} has no answer "{value}". | New | Rejection |
| `catalog.import.reject.between` | Line {line}: a "between" condition needs two values. | New | Rejection |
| `catalog.import.reject.rangeOrder` | Line {line}, {range}: the low limit is above the high limit. | New | Rejection (architecture 4.10) |
| `catalog.import.reject.ageOrder` | Line {line}: the minimum age is above the maximum age. | New | Rejection |
| `catalog.import.reject.overlap` | Line {line}: this range overlaps line {other} for the same test, sample type, component, sex and age. | New | Rejection |
| `catalog.import.reject.noUnit` | Line {line}: a numeric result needs a unit. | New | Rejection |
| `catalog.import.reject.noAnswers` | Line {line}: a coded result needs at least one answer. | New | Rejection |
| `catalog.import.reject.noSampleType` | Line {line}: an orderable test needs a sample type. | New | Rejection |
| `catalog.import.reject.loincFormat` | Line {line}, LOINC: "{value}" is not a valid LOINC code. | New | Rejection |
| `catalog.import.reject.emptyPanel` | Line {line}: this panel has no active test. | New | Rejection |
| `catalog.import.warning.rangeScale` | Line {line}, {test}, {range}: the new range is {factor} times the current one. Check the unit (for example mg/dL or mmol/L). | New | Warning |
| `catalog.import.warning.criticalInside` | Line {line}, {test}: the critical range is inside the normal range. | New | Warning |
| `catalog.import.warning.normalOutsideValid` | Line {line}, {test}: the normal range is outside the valid range. | New | Warning |
| `catalog.import.warning.normalAnswer` | Line {line}, {test}: {count, plural, =0 {no answer is marked normal} other {more than one answer is marked normal}}. | New | Warning |
| `catalog.import.warning.noRange` | Line {line}, {test}: this numeric test has no normal range. | New | Warning |
| `catalog.import.warning.loincShared` | Line {line}: LOINC {code} is also on {other} with the same sample type. | New | Warning |
| `catalog.import.warning.panelSampleType` | Line {line}, {panel}: {test} is not linked to any of the panel's sample types. | New | Warning |
| `catalog.import.warning.reflexSpecimen` | Line {line}, {rule}: the added test cannot run on the condition's sample type. | New | Warning |
| `catalog.import.outside` | Systems that already copied this catalog (an OpenMRS concept sync, an exported file, a FHIR export) keep the old values until they read them again. | New | Outside effects |
| `catalog.import.section.part.notOrderable` | {count} made not orderable | New (v0.4) | Section header part |
| `catalog.import.whatChanges.ranges` | Ranges: {parts} | New (v0.4) | Will change summary for range sets |
| `catalog.import.meaning.group` | Changes what past results mean | New (v0.4) | Decision group (FR-O8) |
| `catalog.import.meaning.help` | {name} has {count} results. Changing its {field} would show them in the new {field}. A new version keeps past results as they were. | New (v0.4) | Decision group help |
| `catalog.import.meaning.why` | The {field} changes from {from} to {to} | New (v0.4) | Why asked |
| `catalog.import.meaning.relabel` | Same measurement, only the label changes | New (v0.4) | Answer |
| `catalog.import.meaning.notEquivalent` | {from} and {to} are different measurements. Choose a new version. | New (v0.4) | Reason the relabel answer is disabled |
| `catalog.import.meaning.skip` | Skip this row | New (v0.4) | Answer |
| `catalog.import.meaning.result` | A new test "{name}" ({code}, {to}) is created with the file's ranges. The current test becomes "{name} (to {date})", is made not orderable and keeps its {count} results as they were. These stay on the current test until you move them: {deps}. | New (v0.4) | Shown after choosing a new version |
| `catalog.import.warning.coverage.check` | Range coverage | New (v0.4) | Warning group name |
| `catalog.import.warning.coverage` | After this import, {test} has no normal range for: {groups}. Their results will not be flagged. | New (v0.4) | Warning (architecture 4.10) |
| `catalog.import.openAnalyses` | It has {count} open analyses, so it cannot be deactivated now. | New (v0.4) | Deactivation row help (FR-O1) |
| `catalog.import.tooMany.help` | If they are new, treat them all as new. If they are the same, add the local code column and upload again: Export with codes gives you this file's rows with the matching codes filled in. | New (v0.4) | FR-C6 |
| `catalog.import.area.labUnits` … `catalog.import.area.reflex` | Lab units, Sample types, Tests, Result components, Answers to tests, Answers, Answer categories, Units, Ranges, Panels, Test codes, Answer codes, Sample handling, Reflex rules | New (one key per area) | Area option, column, filter |

---

## Dependencies

1. **Preview-equals-Apply** in the pipeline (architecture 4.6, BR-1, BR-2): unresolved names held with the run until Apply.
2. **Per-run row results and answers**, each answer saved to the server as given (FR-C9), re-used on re-preview and for rows waiting (FR-K3).
3. **Per-record deactivation answers** per run (FR-D3), **guarded-field ticks** per run and per row (FR-E6) and **warning-group checks** (FR-G5).
4. **Run snapshot** of before-values for Undo (FR-H5, section J).
5. **Run type, status and links** (Import, Undo, Compare; Stopped, Expired, Undone with records kept; follow-up and undone-by links).
6. **Background job, progress, stop and idempotency** for Preview and Apply (FR-A5, FR-H3, FR-H4), with in-app notifications when a job finishes and a reconnecting page (FR-L2).
7. **Uploaded files kept with their run** and purged after 90 days (FR-A2, FR-K2).
8. **Per-record Replace scope** for multi-type organizations (FR-D4) and per catalog area (section O), excluding system-required records.
9. **Export filter line**: L&O and catalog exports write the list filters as a `#` line; Replace reads it back to limit scope (FR-D4); the organizations handler skips `#` lines (architecture FR-1.4).
10. **Shared possible-match routine** with per-area common-word lists (FR-C7, FR-O5, D-216), and the code rule of FR-C10.
11. **Changed-since-preview check per written field** at Apply (FR-H3, RD-20).
12. **Open-order counts** that match the real count for sites and facilities (OGC-1420 2b).
13. **One count model** computed on the server after every answer (FR-B2, FR-C11).
14. **Server paging and filters** on run rows (FR-E4, FR-N2).
15. **Sense-check results** per row with severity, and the warning-group checks (FR-G5, FR-O3), including **range coverage** before and after (architecture 4.10).
16. **Dependency counts** per record at Preview, from each area's list (FR-D6, section O); for organizations this includes pending referrals, standing agreements, EQA participation and shipments, which the shipped in-use count does not.
17. **Guarded-field list per area** (FR-E6, FR-O2); for tests, the **meaning-change decision** and the new-version link, and a **unit equivalence check** on UCUM codes (architecture 4.11, FR-O8).
18. **Outside-effects text per area** (FR-J4, FR-O6).
19. **Compare runs** and the differences report (section M).
20. **Numbers in the user's format** (FR-A6) and the clear keyword resolved on the server in the user's language (R-2).
21. **Other open runs** visible per area (FR-A7).
22. **Waiting-rows reminder** on the import page and the area's list (FR-K4).
23. **Export with codes** (FR-C6): the waiting rows written back in the file's columns with the closest record's code, using the possible-match routine (dependency 10).
24. **Discarded** run status and who discarded it (FR-H7).
25. **Before you apply** items computed on the server with the counts (FR-B3, FR-C11).

---

## Coordination

- **Locations & Organizations FRS v0.6 → v0.7** (this FRS supplies the text):
  - FR-F6 (preview content) and FR-F9 (Apply and the result report) are replaced by sections B to I.
  - FR-F3: Add & update is preselected, Compare only is a third mode, and Replace scope is per record (FR-D4).
  - FR-F8's last sentence ("Apply is enabled only when every queued row ... has a decision") and AC-9's "Apply stays disabled until it is decided" are replaced by FR-C8.
  - FR-F10 run history is replaced by section K.
  - FR-F12 possible renames gains the common-word list (FR-C7), the cap (FR-C6) and group answers (FR-C3); its answer "Different places" becomes "New place".
  - FR-G1 and AC-12: an export writes its filters, and Replace scope is limited to them (FR-D4). The Upload step gains the Export panel (FR-A8).
  - FR-F11: the Registry tag gets its toggletip (FR-E3).
  - **Deferred → in scope:** "Undo an import" (section J). **Out of scope → in scope:** "Clearing a stored value through import" (R-2).
  - Access: `organization:view` gains read-only import history and results; the rest of "no read-only variant" stands.
  - Localization: L&O v0.7 adds the table 2 keys and retires the shipped keys listed under table 1.
  - Address-hierarchy files (levels and values) keep the shipped review until P2 (Overview).
  - Registry records' active status is **not** changed by this FRS; that amendment of D-109 belongs to the P2 Workbook & Reference Data FRS (architecture section 13).
- **Import Catalog (OGC-1194):** adopts the component as section O states; the shipped breadcrumb stays.
- **Users and Roles Appendix A:** adds the `reference_data` category to the Test catalog and reference data group.
- **Admin Redesign AS-36:** records the `importReview` namespace as the exception for a component shared by several admin pages.
- **Result Delivery:** organization imports carry `reportEmail`, `reportPhone`, `autoDelivery` (L&O FR-N5); they show in Will change like any field. The delivery password never imports.
- **D-216:** the possible-match routine here and in manual creation is one routine.
- **L&O and catalog exports:** apply architecture FR-4.4 (formula-injection escaping that leaves numbers and phone numbers intact) and write the filter line.
- **Test Catalog Completion v2:** its completeness and catalog-health gate supplies the catalog sense checks (FR-O3).
- **Analyzer Types & Mapping, Reflex rules, Panels, Label Presets, QC Targets, Test Catalog Alerts, Programs, Workplans:** each exposes a count query for the impact check (section O).
- **Decision ledger and registry:** the amendments to D-108 (per-record and filtered Replace scope) and RD-20 to RD-26 are registered from the next free ledger ID: main stops at D-249 and the AMR v3 set holds D-250 to D-295, so from D-296 if that set lands first (architecture section 15); spec registry rows for this FRS and the architecture are added at registration.

---

## Acceptance Criteria

1. The review opens with the summary sentence; sections appear in the order of FR-B4; empty sections are absent; zero-count tiles are greyed.
2. A file of 300 new facilities, 38 of which share only common words with existing facilities, produces no Possible renames (FR-C7). (OGC-1420 TC-LORG-29b)
3. A file whose rows produce 60 match decisions opens Needs your answer with the cap explanation and three choices, none preselected; **Treat all as new** answers all 60; **Leave them waiting** leaves them waiting and the rest can apply.
4. In a group of 12 possible renames, **All new places** answers all 12; changing one row afterwards to **Same place, renamed** keeps the other 11.
5. Exporting the referral labs and re-importing that file unchanged in Replace mode gives 0 new, 0 updated, 0 deactivated; no referring clinic is in scope. (OGC-1420 TC-LORG-28t)
6. In Replace mode, a sampling site with 44 open orders appears under Will be deactivated flagged In use with "44 open orders". (OGC-1420 TC-LORG-24t)
7. **Keep active** on a listed record removes it from the deactivations, and Apply leaves it active.
8. An updated facility's GPS change reads "GPS latitude, Now: empty, After import: -9.4705".
9. A file with a column `Region2` lists it under Ignored with its row count. (OGC-1420 TC-LORG-29w)
10. Two rows with the same DHIS2 ID are both Rejected with the message naming both lines. (OGC-1420 TC-LORG-29d)
11. A file saved from Excel as CSV UTF-8, and one saved as plain CSV with "Clinique Sainte-Thérèse", both preview with the name intact, and the file line names the encoding in people's words. (OGC-1420 TC-LORG-29e, OGC-1466 TC-CX-IM-01, -02)
12. Two files with the same name in one batch are refused with the file-check message. (OGC-1466 TC-CX-IM-05)
13. Preview, then preview again with an unknown parent code: every reference-data table and the decision queue are identical before and after each preview; only the run, its row results and answers are added. (OGC-1466 TC-CX-IM-03)
14. A file listing the same facility twice (same code) has both lines Rejected; preview and Apply counts are equal. (OGC-1466 TC-CX-IM-04)
15. Changing a file's area after a preview disables Apply until **Refresh preview**, and the refreshed preview keeps every answer. (OGC-1466 TC-CX-IM-07)
16. With 3 rows unanswered, Apply applies the rest; Done says "3 rows are waiting for your answer"; answering them from the run applies only those 3 as a new linked run.
17. A ward row whose parent row is unanswered stays waiting with "Waits for line {n}".
18. Another admin edits one facility in the file, in a field the file changes, between preview and Apply: that row is not written and appears under Changed since preview with the file's value, the value at preview, the value now and who changed it; the other rows apply, and Done says 1 row was not applied. An edit to a field the file does not change does not hold the row.
19. **Undo this import** after adding 12 facilities and updating 31: the 12 are deactivated, the 31 restored, and history lists the Undo run linked to the original. A facility added by the import that now has an open order is listed first with **Keep** preselected; keeping it gives "Undone, except 1 record kept because it is in use" and history status "Undone, 1 kept".
20. **Download with problems** returns the uploaded file with Import status and Import message columns at the left, rows in original order, original values unchanged, in the file's own separator and encoding.
21. Recent imports names the files and tells a preview that was not applied (Preview ready, Stopped or Expired), an applied import and an undo apart. (OGC-1420 TC-LORG-30t)
22. A job failure shows the plain failure message with a reference, stays until dismissed, and shows next to the Apply bar. (OGC-1420 TC-LORG-04m, 04p)
23. At 1280 pixels wide the page has no sideways scroll. (OGC-1420 TC-LORG-40t)
24. In French, every string on the page comes from a key in tables 1 to 3 or a reused key; none shows in English when a French translation exists; the mode, Undo and summary read naturally (checked by a French-speaking reviewer).
25. A 5,000-row preview completes within 60 seconds with progress shown; opening a section or recalculating counts after an answer takes under 2 seconds.
26. Keyboard only: a user can answer a group, use **Next unanswered**, keep a record active, apply and undo; a screen reader announces each decision row by line and name, and "12 answered, 18 left" after each answer; the Apply bar never hides the focused control.
27. A Replace file that would deactivate Port Moresby General Hospital shows "Used by: 44 open orders, 6 wards / depts, 2 pending referrals" in its row and every one of them by name when the row is expanded.
28. A file changing 300 organizations' reporting codes shows the "Changes reports" tag and the national-reports message; one tick "I have checked all 300 changes to Reporting code" enables Apply; the bar says how many ticks remain before that.
29. A file turning on automatic delivery for a facility with no delivery password applies, is listed under Warnings with the message naming the line, and Apply stays disabled until that warning group is checked in place; the confirmation only says "1 warning was checked and will be applied."
30. The Apply confirmation for an organizations import shows the outside-effects text and "Apply cannot be stopped once it starts"; the Undo review shows the outside-effects text again.
31. **Compare only** with a staging server's export lists New, Will change and Only on this server, offers no Apply, appears in Recent imports as Compare, and **Use this file to update** starts an Add & update preview at once with the same answers.
32. Catalog: a file changing the unit of a test with results puts the row under Needs your answer, Changes what past results mean, with the result count and no answer preselected; a new glucose range 18 times the current one, and one exactly 10 times, appear under Warnings; a normal range with low above high is Rejected.
33. A file with no `name` column shows the missing-column message under the file, naming the template; a UTF-16 file is refused with the UTF-16 message; neither reaches Preview.
34. Leaving the page during a 5,000-row preview, the in-app notification says when it is ready, and opening it from Recent imports shows the finished review.
35. Using a candidate with **Remember this name** ticked, then importing the same spelling again, matches it with no decision.
36. Answering 10 decisions, going back to Upload and re-previewing the same files keeps all 10 answers; changing one row in the file keeps the other 9.
37. A facility-registry record of a type in the file never appears under Will be deactivated in Replace mode.
38. Re-importing an export filtered to Morobe Province in Replace mode deactivates nothing outside Morobe Province.
39. A Replace file that would deactivate Port Moresby General Hospital, whose 6 wards / depts are not in the file, puts it under Has active wards / depts not in this file with the three answers.
40. Catalog: a test with open analyses that the file would deactivate offers Make not orderable (preselected) and Keep active; after Apply it is missing from order entry and its open analyses can still be resulted and released.
41. A change to a registry-supplied field on a registry record shows "Will be overwritten by the next registry sync" beside that field.
42. Catalog: renaming a test that an analyzer mapping and a reflex rule use lists both under Used by in its Will change row.
43. A new row "Kilakila Health Center" next to the existing "Kilakila Health Centre" shows "Similar to Kilakila Health Centre" and is not a decision.
44. After Apply, the new facilities appear in the order entry referring-site picker without a restart.
45. After run B changes records run A also changed, **Undo this import** on run A is offered; its review shows those records with run B's value and **Keep the later value** preselected.
46. An Undo appears in Recent imports as type Undo, linked to the run it undid, and each affected record's history shows it.
47. A preview not applied for 7 days shows as Expired; **Preview again with my answers** re-runs the kept files and keeps every unchanged row's answer.
48. **Download differences** on a Compare run returns a CSV with record, field, value here and value in file, and the Only on this server and Only in file rows.
49. Answering a decision, choosing Keep active or ticking a guarded change or a warning group updates every count in place (summary, Before you apply panel, section headers, bar) and leaves Apply enabled once no blocking item is open.
50. With the network cut for 30 seconds during Apply, the page shows the connection-lost message, reconnects, and ends on Done; history shows one Applied run. Pressing Apply twice also produces one run.
51. After answering 20 decisions, closing the tab and opening the run's link shows all 20 answers; the bar said "All answers saved" before closing.
52. Choosing a group answer on a group of 300 shows "Answers all 300 rows, 25 on this page" and first shows the 5 closest pairs; **Clear this group's answers** restores the per-row answers given before.
53. On an empty system, an organizations file of 1,800 rows referring to unknown regions shows one Problems group "1,792 rows: the region was not found" with three sample lines, and the notification above the panel says to import the geographic areas first.
54. A French Excel CSV (semicolon separated) with a range "4,5" previews with the separator detected and "Read 4,5 as 4.5"; "1.234,5" is Rejected with the thousands-separator message; Download with problems comes back semicolon separated.
55. Catalog: a ranges file giving Glucose one adult range, where Glucose has 4 other ranges by age and sex, shows those 4 as Removed, a warning naming the 4, and "removes 4 ranges" in the summary.
56. After 12 answers, the summary, Before you apply panel, section headers, Apply bar, confirmation and Done show the same numbers.
57. A Replace file listing 40 of the 452 tests in its scope opens Will be deactivated with the under-a-quarter question; **Switch to Add & update** starts a new preview with answers kept.
58. With rows waiting from a run three days old, the import page and the Organizations list show "3 rows have been waiting for your answer since {date}".
59. While another admin has an open preview of the same area, the Upload step shows "Open: {user}'s preview of {files}, {time}".
60. **Stop** during a preview ends it; the run shows as Stopped and can be previewed again.
61. A row whose code matches nothing and whose name matches one facility with no code updates that facility and adds the code; if that facility has a different code, the row goes to Several possible matches.
62. With files added and Replace chosen, the scope sentence appears before Preview; Add & update is preselected and each mode's help is visible without hovering.
63. `?run=<id>&show=warning` opens the review filtered to Warnings; the Show dropdown shows Warnings.
64. Several possible matches shows the file's values and the candidate's side by side, with differences marked in text; no answer is preselected in any group.
65. Will change lists rows with guarded changes or dependencies first.
66. Writing `(effacer)` in a French session, or `(clear)`, in an optional field shows "Will be cleared" and Apply clears the value; either keyword in a required field is Rejected with the required-field message.
67. Catalog: a Replace file of tests in Hematology deactivates only unlisted Hematology tests; a Replace file of answers in one category deactivates only unlisted answers of that category; system-required answers (architecture section 6) are never listed; Replace is disabled for units of measure, answer categories and sample handling.
68. A user with `organization:import` but without L&O export access cannot download a result report or problems file; a user with `reference_data:import` but without `reference_data:export` cannot download the catalog's.
69. Catalog: an upload carrying lab units and tests shows the area of each record in the review, and a filter by area.
70. A catalog file with unit "mg/dl" where only "mg/dL" exists offers "mg/dL" as a Possible match and **Add "mg/dl" as a new unit**.
71. Catalog: answering the Glucose unit change with **Create a new version of this test** creates "Glucose, fasting" with mmol/L and the file's ranges, renames the current test "Glucose, fasting (to {date})", makes it not orderable, leaves its 12,400 results unchanged and lists 2 panels, 1 analyzer mapping and LOINC 1558-6 as staying on it; **Same measurement, only the label changes** is disabled with the different-measurements message.
72. Catalog: a unit change from "mg/dl" to "mg/dL" on a test with results offers **Same measurement, only the label changes**; choosing it changes the label only.
73. Catalog: a ranges file that leaves Glucose with only an adult band, where the current set covered children and infants, shows the Range coverage warning naming "children 1 to 17, infants under 1"; a test that never had a child band raises no coverage warning.
74. With a guarded tick and a warning group open, the bar says "2 things left before you can apply"; **Show** moves focus to the first open item in the panel, and each panel action opens its section, scrolls to the item and moves focus there.
75. The Before you apply panel shows "(can wait)" on decision groups; with only those open, Apply is enabled.
76. **Discard this preview** asks for confirmation, returns to Upload, removes the "Open: …" notice for other users, and lists the run as Discarded in Recent imports.
77. In the 312-question case, **Export with codes** downloads the 312 rows in the file's columns and separator with a code column filled from the closest match.
78. The Export panel on the Locations & Organizations Import / Export page downloads the chosen area with the filter line, and is absent for a user without L&O export access.
79. Will change shows "Phone: +675 325 1190 → +675 325 1199" in the row for a single-field change, and "Phone, Address" for two; only rows with several changes, a replaced set or children expand.
80. In a catalog Replace that would take 47 tests out of use, the under-a-quarter question, the summary, the section header and the confirmation all say 47; **Keep all active** says "Answers all 47 records" and clears with **Clear this answer**.
81. Every decision group (Possible renames, Several possible matches, Has active children, Changed since preview, Changes what past results mean, Possible matches) renders as one table with the columns of FR-C2, and every group answer is a tertiary button.
82. The Apply bar shows Back on the left and Apply on the right; a Registry tag opens its toggletip by keyboard and mouse.

---

## Out of Scope

- The Excel workbook, packs, central sources and Changed by {publisher} decisions (later slices; the decision-group pattern in FR-C1 is where they land).
- The registry active-status change (P2 FRS).
- Merging duplicate records (L&O Deferred; its own slice).
- Address-hierarchy files in this review (P2).
- Change control: a second person approving an import before Apply (architecture RD-17, deferred).
- Effective-dated reference data (architecture RD-18).
- GPS plausibility checks (L&O Deferred).

---

## Docs Impact

- User manual "Admin: Import and export locations" (OGC-1468) and "Import a test catalog from CSV" (OGC-1286): re-capture after each page adopts the component.
- Confluence configuration guide (page 1266122780): add the review, Undo, history, Replace scope per area and the French Excel guidance.
- The `openelis-test-catalog-csv` skill: Replace scope per catalog area and the clear keyword.
