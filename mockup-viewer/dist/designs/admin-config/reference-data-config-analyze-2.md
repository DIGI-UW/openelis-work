# Spec Analysis, Round 2: Reference Data Architecture v0.4 and Import Review FRS v0.2

**Date:** 2026-10-19
**Scope:** `reference-data-config-frs.md` v0.4 (Arch), `import-review/import-review-frs.md` v0.2 (IR); governance (constitution, design addendum, frs-template, permissions-and-audit, admin-ia-inventory, current-state-gotchas); decision log and spec registry from `openelis-design-skill-src` (Mac); L&O FRS v0.6, Users and Roles v0.1 Appendix A, Admin Redesign (AS-33, AS-36); develop `f72854e`.
**Passes:** `/analyze` A, D, E, F, G, H, J, L, M, N (B, C, I limited to what the FRS prescribes; no preview yet), plus a second **fury pass** (Part 2), walking eight concrete scenarios.
**Round 1:** `reference-data-config-analyze.md`; nothing here repeats it unless its fix was incomplete.

**Status (2026-10-19, later the same day):** applied in Architecture v0.5 and Import Review FRS v0.3. Casey decided RD-20 (hold changed rows), RD-21 (later imports do not block Undo), RD-22 (complete the catalog half in the Import Review FRS itself, now section O, rather than a separate FRS as recommended) and RD-23 (keep "Replace" with guardrails). A verification pass found 14 residual items (registry note, two spliced keys, split L&O count clauses, duplicate keys, missing catalog dependency keys, wording drift); all fixed.

## Summary

The specs are close. Two things block delivery: the Localization table does not reuse existing keys and splices nouns into shared sentences (Constitution VII, Admin Redesign AS-36), and two new data elements (the export's filter stamp, a lab-set active status on registry records) are undeclared. The privilege category `reference_data` has no display group yet, and the catalog half of the Import Review is only half specified.

The fury pass found the bigger risks: on a dropping link, Apply can run twice and 40 minutes of answers can vanish; one group button can silently answer 300 rows; a 1,800-row national list on an empty system produces 1,800 identical rejection lines; French Excel files (semicolons, decimal commas) still fail, and a decimal-comma misread is exactly 10 times the old value, which the "more than 10 times" warning misses; and the counts on the summary, tiles, Apply bar and Done can disagree. Each has a concrete fix below.

**Code checked:** `StringUtil.csvEscape` (`StringUtil.java:105-119`) prefixes `'` to any value starting with `-` or `+`, so reusing it as Arch FR-4.4 says would corrupt negative GPS coordinates, negative range limits and `+675` phone numbers on every round trip, and it does not handle tab or carriage return (H-4). The shipped catalog breadcrumb has no group crumb (`CatalogImport.jsx:34-38`) (M-8).

---

## Part 1. `/analyze` findings

### CRITICAL

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| C-1 | A (Constitution VII, key reuse) | IR Localization, table 1 | No Reuse/New column. Generic words are minted as new keys (Name, Code, Back, Apply, Area, Files, Status, Mode, Kind, When, Who, Line, Outcome, empty, OK). `button.importReview.template` duplicates the shipped `button.locations.template`, which is neither reused nor retired. | Add a Status column (Reuse / New / Shipped). Map generic words to existing `common.*` / `label.*` keys after running the repo's key search; mint only what does not exist. Reuse `button.locations.template` on L&O. |
| C-2 | G (MUST A) | IR FR-D4, Arch R-4; IR Coordination | Two new data elements are undeclared: (1) the export's filter stamp (a `#` line written by the L&O export and read back by Replace scope; the organizations handler must also skip `#` lines, Arch FR-1.4); (2) a lab-set active status on registry records shown beside the registry's own status. | IR Dependencies 16: export filter stamp. (2) moves with H-2 to the P2 FRS, declared there. |

### HIGH

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| H-1 | J | Arch §11 | Category `reference_data` is not in Users and Roles Appendix A (it would fall under Other). Display group is set per category, so `reference_data:pack_manage` cannot sit in Administration while its siblings sit in Test catalog; pack management is not administrator power under UR-F5; "Roles with Admin today" is not D-233 form. | Coordination: Appendix A adds `reference_data` to "Test catalog and reference data". `pack_manage` in that group, default "Roles with `reference_data:import`". |
| H-2 | M (D-108, D-109) | Arch R-4, §13; IR FR-D4, Coordination | Per-record and filtered Replace scope amends D-108; making active status local on registry records amends D-109. Neither is registered. IR pushes the D-109 change into L&O v0.7 (P1b), but Arch places central ownership in P2, and IR has no FR or AC for it. | Register two decisions amending D-108 and D-109 (next free ledger IDs, see M-1). Move the registry active-status change out of IR into the P2 Workbook & Reference Data FRS. |
| H-3 | E, F | IR FR-D6, D-7, E6, AC-32, 40, 42, table 3 | The catalog screen is half specified: no Replace scope rule for catalog areas (R-4 is defined by organization types), one noun ("tests") for 11 areas, dependency labels and sense-check keys deferred to a "catalog adoption FRS" the roadmap does not list. | **Decide (RD-22).** Recommended: IR covers the shared component and the Organizations adoption only; a separate **Import Review: catalog adoption** FRS (P1b, second) carries catalog Replace scope, per-area nouns, dependency labels, sense checks, guarded fields and AC-32/40/42. |
| H-4 | Code | Arch FR-4.4; IR Coordination (L&O export) | `StringUtil.csvEscape` prefixes `'` to values starting with `-` or `+`: GPS `-9.4705`, negative limits and `+675` phones would round-trip corrupted (breaks L&O AC-12, IR AC-5). It does not handle tab or CR. An apostrophe prefix in `.xlsx` is wrong; typed cells are the right fix there. | Rewrite FR-4.4: "Text columns in CSV are escaped against formula injection; numeric columns are written raw. Import removes one leading `'` before `= + - @`, tab or CR. The workbook writes typed string and number cells, never a prefix. Extend the helper to tab and CR, and stop escaping a leading `-` or `+` when the rest of the value is a number." |
| H-5 | F (Admin Redesign AS-36) | IR table 1 | AS-36 forbids a noun dropped into a shared template; `summary.adds`, `result.added`, `group.children`, `decision.withChildren`, `column.children`, `childrenNotInFile` splice `{noun}` / `{childNoun}`, so French and Spanish agreement breaks ("actifs / actives"). New admin keys use `admin.{page}.*`. | Make these whole-sentence area keys supplied through FR-L4: `admin.locations.import.*` (new L&O keys; shipped `label.locations.import.*` keep their names) and `catalog.import.*`. `importReview` keeps only noun-free texts; record the namespace exception against AS-36. |
| H-6 | J | IR Access; FR-G3, I1, M3 | Result report, Download with problems and Download differences are exports, but IR gates them by history access; Arch requires `reference_data:export` (and `provider:export`, logged, for providers). | IR: those downloads need the area's export privilege; fill the empty Group cell. |

### MEDIUM

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| M-1 | M | Arch §15; IR header | Local D-1 to D-19 read as ledger D-001 to D-019 (D-012 is the admin URL pattern, D-013 the breadcrumb quirk). The ledger file stops at D-233 though specs already cite D-240 to D-248; next free is D-249. IR FR-E4 cites D-007 for "names shown", which is the addendum rule, not D-007. | Prefix local IDs `RD-1` to `RD-19` (new ones continue at RD-20). Register RD-12 to RD-19 and the two H-2 amendments at D-249 and up, with a mapping line in Arch §15. Fix the FR-E4 citation. |
| M-2 | E | IR | ACs missing for FR-A3 (preselect, scope sentence), FR-B2 `show=`, FR-B4, FR-C2, FR-C4 (no preselect), FR-E5, FR-J2 (Keep the later value) and R-2 `(clear)`. | Add ACs, for example: "`(effacer)` in a French session shows Will be cleared and Apply clears the value; `(clear)` on name is Rejected." |
| M-3 | E | IR FR-K3 vs FR-H3, K2 | Rows waiting after Apply have no expiry, and answering them weeks later has no defined change check. | "Answering waiting rows re-previews those rows; rows whose record changed since the run show both values" (see Y-3, Y-19d). |
| M-4 | E | IR FR-H5, BR-1 | Answers update counts "in place", but sense checks, dependent rows and warnings come from Preview. | "Each answer re-evaluates its row, its dependants and their sense checks on the server, in place." |
| M-5 | E | IR FR-M2 vs FR-H5 | **Use this file to update** changes mode, which FR-H5 says needs a refresh. | "starts a new preview automatically, keeping answers (FR-C9)." |
| M-6 | F | IR FR-E6, `label.importReview.guarded` | Tag "Changes past results" on an organization's reporting code, which changes no result. | Area-supplied tag (organizations: "Changes reports"). |
| M-7 | A | IR | Missing keys: dependent-row pending reason (FR-C8), "required field cannot be cleared" (R-2), accessible-name pattern (FR-L3), differences report headers (AC-48), Apply success notification (FR-L2). FR-G5's example text differs from `row.converted`. The old test's "(to {date})" suffix is stored data, so it needs a language-neutral form or `localization:xx`. Server-side `(clear)` resolution in the user's language needs a Dependency. | Add the keys and the Dependency; store the suffix with `localization:xx`. |
| M-8 | IA | IR Navigation | Shipped catalog breadcrumb is `Home / Admin Management / Import Catalog (CSV)` (no group crumb). | State the shipped crumb (no change). |
| M-9 | J | Arch §11 | No privilege for switching an area's source (FR-10.3), the local settings report (FR-10.8), the readiness report (FR-6.8) or the setup checklist (FR-9.2 names a role). "Set local-settings policy" is undefined, since RD-9 fixes the list. | Add rows; drop "set local-settings policy". |
| M-10 | M | Spec registry | No rows for Reference Data or Import Review (round-1 upkeep not yet done). | Add both rows at registration. |

### LOW

| ID | Location | Issue | Fix |
|---|---|---|---|
| L-1 | Lab Context, both docs | CSV, PNG and DIGI not expanded on first use. | Expand inline. |
| L-2 | Arch 4.11 | Results keep `significantDigits` (`Result.java:55`), but reports format the range from the test's digits (`PatientReport.java:1061`). | Say "ranges on past results" for the digits case. |
| L-3 | Arch FR-9.2 | Checklist dismissed state and "upgraded system" flag undeclared. | Add to §12. |
| L-4 | Ledger | D-006 still active while D-233 mints codes. | Note "D-233 amends D-006" at registration. |

---

## Part 2. Fury pass 2

Eight scenarios: a PNG provincial IT officer loading 1,800 facilities on a 1 Mbps link that drops twice; a French-speaking manager in Côte d'Ivoire updating 40 ranges from French-locale Excel; undoing yesterday's import after others edited 3 records and placed 20 orders; two admins importing the same afternoon; national list v4 arriving at a site with local changes; a first-time user on an empty system; screen-reader and keyboard users with 30 decisions; a developer building it. The shipped screen (`ImportExportView.jsx`) re-uploads files on Apply and holds every answer in browser state until Apply.

L = likelihood, S = severity.

| ID | L×S | Who, when | What goes wrong | Spec cause | Fix |
|---|---|---|---|---|---|
| Y-1 | H×H | PNG officer, link drops during Apply | The page loses its poll, says "could not finish, nothing was saved"; the server finishes anyway; the officer retries and the import runs twice. | FR-L1, H3, A5: one failure message, no connection-loss rule, Apply not idempotent. | **FR-L1a**: on connection loss, "Connection lost. Your import is still running on the server. This page will reconnect."; the failure text only when the job failed. Apply is idempotent per run. AC: cut the network 30 s mid-Apply; Done, one Applied run. |
| Y-2 | H×H | Same officer, 40 minutes into answering | Every answer is lost on a drop or session timeout. | FR-C9 says answers are kept with the run, not when. | Each answer, Keep active and tick is saved to the run as given; the bar shows "All answers saved" or "Not saved yet, reconnecting". AC: answer 20, close the tab, reopen `?run=`; all 20 there. |
| Y-3 | H×H | Any large run, hourly registry sync | Apply stops and demands a full re-preview because 1 of 1,800 records changed, possibly on every attempt. | FR-H3, BR-1. | **Decide (RD-20).** The check covers only fields this run writes; changed rows move to a new Needs you group **Changed since preview** (both values), the rest applies. AC: edit 1 of 300 after preview; 299 apply, 1 waits. |
| Y-4 | H×H | National list missing codes; a 300-row group | One click on **Treat all as new** or a group answer silently answers 275 rows on unseen pages; hundreds of duplicates or wrong renames. | FR-C3, C6: no reach, no sample, no undo of a group answer. | Buttons name their reach ("Answer all 300 (25 on this page)"); above 25 rows, show the 5 closest pairs with what they share before confirming; **Clear this group's answers** (earlier per-row answers return); the cap screen adds **Leave them waiting**, nothing preselected. |
| Y-5 | H×M | First-time user, empty system | 1,800 rejections, one line each, all "nothing has the {label} Morobe". | FR-G1 per-row only; import order (areas first) stated nowhere. | Problems grouped by reason with count, 3 sample lines and one fix ("1,792 rows: region not found. Import geographic areas first."); when one reason covers more than half the rows, the summary says so above the tiles. |
| Y-6 | H×H | Côte d'Ivoire manager, French Excel | Semicolon file: "no 'name' column". Then "4,5" rejected or read as 45; 45 for 4.5 is exactly 10 times, so the "more than 10 times" warning stays silent. The problems file comes back comma-separated UTF-8 and opens in one column. | Delimiter only in Arch FR-1.3; decimal comma undefined; threshold exclusive; output format unspecified. | Detect the delimiter before column checks. In numeric columns accept a decimal comma when the delimiter is `;` or the user's locale uses one, shown as "Read 4,5 as 4.5"; reject a value with both separators. Warn at **10 times or more**. Download with problems keeps the file's delimiter and encoding. AC: a French Excel CSV previews with 4,5 shown as 4.5. |
| Y-7 | M×H | Same manager, adult ranges only | The file replaces the whole range set: children's and sex-specific bands disappear; the preview says "2 fields changing". | Arch R-5; FR-E2 shows fields, not bands. | Range changes listed per band as Added, Changed, **Removed**; warning "Glucose: the file has 1 range; 4 others (children, by sex) will be removed"; summary part "removes {n} ranges". |
| Y-8 | H×M | National recode of facility codes | 300 separate ticks before Apply. | FR-E6, H2 per-row only. | One tick per guarded field across the run ("I have checked all 300 reporting-code changes", list expandable); per-row ticks remain. |
| Y-9 | H×M | Anyone answering decisions | Summary "deactivates 4", bar "Apply 53 changes" (wards included), tiles still show preview counts, Done differs from all. A row answered **Use X** needs field changes the preview never computed. | FR-B1, B2, H1, H5: no defined count unit. | One count model in records per kind, children counted separately ("4 facilities and 6 wards / depts"); summary, tiles, bar, confirmation, Done and history read the same numbers and recompute on every answer; the preview computes field changes for every candidate. AC: after 12 answers all six places agree. |
| Y-10 | M×H | French user who wants to "replace the ranges" | Picks Remplacer (Replace); on the catalog screen its scope is undefined. | FR-A3, D4. | **Decide (RD-23)** on the label. When the file lists under 25% of what Replace covers: "This file lists 40 of 452 tests. Did you mean Add & update?" Catalog scope goes to the catalog FRS (H-3). |
| Y-11 | H×M | Lead returning after leave or after leaving the page | An expired preview cannot be re-run; Download with problems not reachable from history; waiting rows forgotten; nothing says the background job finished. | Uploaded files not stored (and not declared); no notification. | Store uploaded files with the run (purged with it); Expired offers **Preview again with my answers**; every run offers Download with problems; import page and L&O list show "N rows waiting since {date}"; in-app notice when a job finishes. |
| Y-12 | M×M | Lead undoing yesterday's import | Blocked by "Undo the later import first", which is a colleague's good import. | FR-J1: later runs block, later edits do not. | **Decide (RD-21).** Treat later runs like later edits: overlapping values shown, **Keep the later value** preselected. |
| Y-13 | M×M | Same lead after Undo | Done says "Undone", but in-use facilities kept by default are still live. | FR-J2, J3. | Result "Undone, except 12 facilities kept because they are in use", each linked; history "Undone, 12 kept". |
| Y-14 | M×M | Two admins, same afternoon | Neither knows about the other; the second Apply sits at "0 of 1,800". | No visibility of other open runs or queued jobs. | Upload and the Apply bar show "Open: Joseph's preview of facilities.csv, 14:02"; a queued run says "Waiting for Joseph's import to finish." |
| Y-15 | M×H | Site receiving national v4 (P2) | A local rename of a central field is silently reverted among 200 updates; renumbered sort orders raise dozens of questions. | Arch 4.4, 4.7; no group answers for Changed by publisher. | Will change starts with "Your lab's edits this version replaces (n)"; sort order and display name keep the lab's value without asking (shown as information); group answers **Keep all mine**, **Take all from {publisher}**; the save-time warning offers **Save as this lab's display name**. (P2 FRS.) |
| Y-16 | M×M | Screen-reader and keyboard users, 30 decisions | Group answers and count changes are silent; 90 radios to tab through; the sticky bar covers the focused row. | FR-L3 covers names only. | **FR-L5**: live-region announcements ("12 answered, 18 left"); **Next unanswered** control; each row a fieldset whose legend is line and name; section landmarks; the bar never covers focus; progress announced at most every 10 s. |
| Y-17 | H×L | Non-native readers | "Needs you" is idiomatic; "Kind" vs the file's "type"; "Different places" vs "All are new places"; French "Annuler" means both Undo and Cancel; "Windows-1252" means nothing. | Tables 1 and 2. | "Needs your answer"; "Type"; **New place / All new places**; translator note: Undo reverts an applied import ("Revenir sur l'importation"); encoding shown as "Excel CSV (Western European)". |
| Y-18 | M×L | Wrong file uploaded | A 60 s preview cannot be stopped; nobody says whether Apply can be. | FR-A5, H3. | **Stop** on Preview; Apply states "Cannot be stopped once started; use Undo." |
| Y-19 | H×M | Developer | Four rules to guess: (a) code matches nothing but the name matches a record with no code or another code; (b) a batch mixing address and organization files; (c) the 50-question cap per group or per run; (d) waiting rows answered weeks later. | FR-C1, C6, K3, Overview. | (a) Add the code if the record has none; a different code sends the row to Several possible matches. (b) Address files preview first, then hand off. (c) Per run, all groups. (d) Answering re-previews those rows; Y-3 applies. |

**The five that most change the first preview screen:** Y-4 (group reach, sample pairs, Clear, Leave them waiting), Y-5 (problems grouped by reason, dominant reason in the summary), Y-9 (one count model everywhere), Y-1 and Y-2 (saved and connection state in the Apply bar), Y-8 (one tick per guarded field).

---

## Constitution and addendum violations (block delivery)

- C-1: key reuse (Constitution VII).
- C-2: undeclared data (MUST A).
- H-5: nouns spliced into shared sentences (Admin Redesign AS-36; also a Constitution VII i18n issue).

## Decisions needed from Casey

| # | Question | Recommendation |
|---|---|---|
| RD-20 | Rows whose record changed after the preview: stop the whole Apply (BR-1 today), or let them wait while the rest applies? | Let them wait in a Changed since preview group; narrows BR-1 to "never writes over a change it did not show". |
| RD-21 | Should a later import block undoing an earlier one? | No; show overlapping values with Keep the later value preselected, as for later manual edits. |
| RD-22 | Catalog half of the Import Review: specify it in this FRS, or in its own catalog adoption FRS? | Own FRS (second in P1b); this FRS becomes the component plus Organizations. |
| RD-23 | The mode label "Replace" (read as "overwrite values", French "Remplacer"): keep, or rename? | Keep "Replace" (shipped, matches the L&O manual) with its help text always visible, a translator note, and the under-25% prompt. |

## Verified accurate

- Routes `/MasterListsPage/locations/import` and `/MasterListsPage/CatalogImport` (`AdminSideNav.jsx:408, 710`); SideNav labels match `en.json`; the L&O breadcrumb matches `LocationsPage.jsx:174-178`.
- The retired L&O key list matches `ImportExportView.jsx` and `en.json`; keys marked shipped exist; `catalog.import.*` is the shipped catalog namespace.
- POI and poi-ooxml are dependencies; `UnresolvedReference.TYPE_DICTIONARY` exists; Test has `orderable` (`Test.java:110`); Result stores `resultType`, `minNormal`, `maxNormal`, and the unit comes from the test (`PatientReport.java:705`).
- D-001, D-002, D-041, D-103, D-107, D-108, D-109, D-112, D-216, D-232 and D-233 are cited correctly. No multitenancy. Both docs have Lab Context with all three parts and Docs Impact.

## Recommended fix order

1. RD-20 to RD-23.
2. C-1, C-2, H-5 (localization table rebuilt with Reuse/New, whole-sentence area keys, declared data).
3. HIGH H-1 to H-6 and fury Y-1 to Y-9 (these shape the first preview).
4. MEDIUM, LOW and Y-10 to Y-19.
5. Registry and ledger upkeep (M-1, M-10, H-2, L-4).
