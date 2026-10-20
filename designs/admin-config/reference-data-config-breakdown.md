# Reference Data as Configuration: Slicing Guide

**Architecture:** `reference-data-config-frs.md` (v0.6)
**First slice FRS:** `import-review-frs.md` (v0.4)
**Mockup:** `import-review-mockup.jsx` (`@carbon/react` 1.118)
**Preview:** `import-review-preview.html` (v0.4)
**Critique:** `import-review-critique.md`
**Assignee:** Piotr Mankowski (all slices)
**Pipeline:** Claude Code, one branch and one PR per slice. Points are for human planning only.
**Status:** Suggested and non-binding. The developer owns the final slicing. No Jira is created until Casey approves this plan.

## How to read this

The roadmap has nine phases (architecture section 7). Only two of them can be built now:

- **P0 and P1a** are engine work. The architecture FRs (FR-1, FR-3.1, FR-4, FR-5.1, FR-5.2, FR-6.1, FR-6.8) are specific enough to build from.
- **P1b** is the Import Review. It has its own FRS, a preview and a mockup.

Every later phase needs its own slice FRS first. For those phases this guide lists the expected slices so the order and dependencies are visible, but it does not size them.

Each slice can be used by a lab admin, or by a deployer for engine work, once it merges. Backend, migration and UI ship together in one PR. Localization keys (FRS Localization tables) and privilege checks (FRS Access, architecture section 11) are part of every slice, not separate work. The ACs listed for a slice are what the reviewer and CI check on that PR.

## Handoff tickets (proposed, not created)

| # | Type | Title | Covers | Links |
|---|---|---|---|---|
| A | Epic | Reference data imports: complete the engine | P0 slices 0.1 and 0.2, P1a slices 1 to 8 | Architecture FRS, this guide |
| B | Epic | Import Review: preview, answer, apply and undo reference data imports | P1b slices 9 to 17 | Import Review FRS, preview, mockup (attached), critique, this guide |

- **Why two Epics:** A has no screens of its own; B is the mockup's single ticket (one mockup, one ticket). Phases P2 to P5 get their own Epic when their slice FRS is approved.
- **Related tickets ("relates to" links):** OGC-1194 (catalog CSV and Import page), OGC-1363 (Locations & Organizations), OGC-1420 and OGC-1466 (QA findings), OGC-1507 (translatable reference data), OGC-1509 to OGC-1512 (P0 bugs), OGC-1044 (subscription, P5).
- **Suggested labels:** `reference-data`, `csv-import`, `admin-config`, `global`.
- **Assignee:** Piotr Mankowski on both.

## P0: Stop the bleeding (now)

| # | Slice (what changes for the user) | Points | Requirements | Checks | Notes |
|---|---|---|---|---|---|
| 0.1 | Fix the shipped import bugs | n/a | OGC-1509 to OGC-1512, OGC-1420 import items | Each ticket's own tests | Already ticketed; listed here for order only |
| 0.2 | No new reference data can be added through Liquibase | 2 | FR-6.1 | Architecture AC on the freeze | CI check that fails a changeset inserting into a configurable table (the list is kept in the repo); the freeze date is set by Casey (RD-7) |

The refresh of the catalog CSV skill and the READMEs is documentation work (Casey); it is not a PR here.

## P1a: The engine every import needs (Epic A)

The order matters: slices 1 to 3 make every catalog area loadable with Preview, and slices 6 to 8 create the run model that the Import Review builds on.

| # | Slice | Points | Requirements | Checks | Data / backend in the same PR |
|---|---|---|---|---|---|
| 1 | Load and preview dictionaries (answers and their categories) from the import page | 5 | FR-1.1 (dictionaries), FR-5.2, FR-8.1 (dictionaries), Appendix B row | A full answers file previews and applies; a blank `isActive` leaves the value unchanged | `dictionaries` and `dictionary-categories` on `AbstractCatalogCsvHandler`; category identifier; per-row transactions |
| 2 | Load and preview coded results (which answers each test allows) | 5 | FR-1.1 (test-results), Appendix B row | A coded-results file previews; the `Name(` prefix fan-out and name-only fallback are gone | `test-results` on the modern engine; binds answers by identifier |
| 3 | One parser and one set of rules for every modern domain | 5 | FR-1.3 to FR-1.8 | French Excel file (semicolons, decimal commas) reads correctly; `#` lines skipped; blank means unchanged; two concurrent imports keep their own results; checksums keyed by domain, layer and path | Shared parser on `CsvParsingUtil`; per-run import state; cache refresh as the reload API |
| 4 | Manage units of measure as reference data | 3 | FR-5.1 | Units load before tests; each unit has a UCUM code | `units-of-measure` domain with UCUM code; needed by slice 17 |
| 5 | Export every catalog area in its import format, safely | 5 | FR-4.1, FR-4.4, FR-4.3 (localization columns), FR-8.3 (export locales) | An unedited export re-imports with no changes; `-9.4705` and `+675 325 1190` survive the round trip; a value starting with `=` is escaped | Export per area with list filters and the `#` filter line (Import Review dependency 9) |
| 6 | See what would collide before identifiers are assigned | 5 | FR-6.8 | The readiness report lists duplicates and near-duplicates per area on a copy of a national deployment | Report runs read-only; results kept per deployment (architecture dependency 14) |
| 7 | Every record gets a matching identifier | 8 | FR-3.1, 4.3 | Backfill assigns one identifier per record, refuses duplicates instead of guessing, and never runs twice | Identifiers for test sections, panels, dictionary categories and the other name-keyed domains; migration with backfill |
| 8 | Preview shows exactly what Apply will do, with sense checks and impact counts | 8 | 4.6 (Preview equals Apply), 4.10, 4.12, FR-1.9, FR-10.1 (uploads) | Preview and Apply counts agree on every QA file; a 5,000-row preview finishes in 60 seconds; the 10-times range check fires at exactly 10 | Change set per run (architecture dependency 1); sense-check results per row (9); dependency counts at Preview (11); background job state (8) |

**Epic A total:** 46 points across 9 PRs (slice 0.2 and slices 1 to 8), plus the ticketed P0 bugs. The pipeline does not use sprints; at about 20 points per sprint this would be roughly 2 to 3 sprints of human work.

## P1b: Import Review (Epic B)

Organizations first, on the shipped Locations & Organizations Import / Export page. The catalog page adopts the review in slices 16 and 17. Slices 9 to 15 replace L&O breakdown slices 9 and 10 (L&O FR-F6 and FR-F9 are replaced by this FRS, Coordination section).

| # | Slice | Points | FRs | ACs | Data / backend in the same PR |
|---|---|---|---|---|---|
| 9 | Upload a file and get a background preview I can leave and come back to, or discard | 8 | A1 to A8, K1, K2, H7, L2 | 11, 12, 21, 33, 34, 47, 54, 59, 60, 76, 78 | Runs with type, status (including Discarded) and links; uploaded files kept with the run (dependencies 5, 7, 24); other open runs (21); Export panel uses slice 5 |
| 10 | See what my file will do in one sentence, and look through it section by section | 8 | B1, B2, B4, B5, B6, E1 to E5, E7, F1, F2, G1 to G4, L1, L3, L4, N1, N2 | 1, 8, 9, 10, 14, 20, 23, 25, 41, 42, 43, 53, 56, 63, 65, 66, 79 | One count model on the server (13); server paging and filters (14); What changes column; Download with problems in the user's own format |
| 11 | Answer the questions, one at a time or a whole group at once, with a list of what is left | 8 | B3, C1 to C11, L5 | 2, 3, 4, 17, 26, 35, 36, 51, 52, 61, 64, 74, 75, 77, 81 | Answers saved as given (2); possible-match routine with common words (10); Before you apply items on the server (25); Export with codes (23) |
| 12 | Apply what is ready, safely, and see the result | 8 | C8, E6, G5, H1 to H6, I1, I2 | 13, 15, 16, 18, 22, 28, 29, 30, 44, 49, 50, 82 | Changed-since-preview check per field (11); idempotent Apply (6); guarded-field ticks and warning-group checks (3, 15); run snapshot for Undo (4) |
| 13 | Replace a set of records without cutting off a clinic that is still in use | 8 | D1 to D7, A3 (scope sentence) | 5, 6, 7, 27, 37, 38, 39, 57, 62 | Per-record scope for multi-type organizations (8); filter line read back (9); real open-order counts (12); dependency counts (16) |
| 14 | Undo an import, and come back to rows that were left waiting | 5 | J1 to J4, K3, K4 | 19, 45, 46, 58 | Undo as its own run from the snapshot; waiting-rows reminder on the import page and the Organizations list (22) |
| 15 | Compare my file with this server without changing anything | 3 | M1 to M3 | 31, 48, 68 | Compare runs and the differences report (19); export privilege on every download |
| 16 | Review catalog imports the same way | 8 | O1 to O7, C1 to C4 (catalog groups), D7 (catalog wording) | 24, 40, 55, 67, 69, 70, 80 | Catalog areas adopt the component on the Import Catalog page; per-area scope and dependencies; catalog sense checks including Range coverage; needs slices 1, 2, 4, 7, 8 |
| 17 | Change a test's unit or result type without changing what past results mean | 5 | O8, E6 (catalog guarded fields), architecture 4.11 | 32, 71, 72, 73 | Meaning-change decision; new version with the predecessor link and dated name; UCUM equivalence check on slice 4's unit list (17) |

**Epic B total:** 61 points across 9 PRs.

- **Every PR:** AC-24 (every string comes from the Localization tables) and the privilege checks in the FRS Access section (`organization:import`, `reference_data:import`, `reference_data:export`). Discard of another user's preview is checked in slice 9.
- **Slice size:** slices 10 to 13 are the largest. If a PR gets too big to review in one sitting, split slice 10 at Problems (G1 to G4 into their own PR) and slice 11 at group answers (C3 into its own PR).

## Research (before P2, Casey)

Five to eight conversations with site leads and national managers, as listed in the roadmap. This is not development work; its findings decide the P2 slice FRS.

## Later phases (each needs its slice FRS before slicing for real)

| Phase | Expected slices (one PR each) | Waits for |
|---|---|---|
| **P2 Workbook, layers, central records** | (a) Core, distro and instance packs load together and merge by identifier (FR-2); (b) each record keeps its source and local settings, and a central update asks before overwriting a local one (FR-3.2 to 3.4, 4.7); (c) download and upload the site setup workbook (FR-7, including the FR-7.9 hardening); (d) the Reference Data page with installed packs, release notes, pack comparison and the local settings report (FR-10.2, 10.4, 10.6 to 10.8); (e) the address hierarchy on the modern engine; (f) Export everything, with hidden identifier and row-signature columns, R-6 and R-7 (FR-4.2, 4.3) | Workbook & Reference Data FRS, research findings, Epic A |
| **Merge duplicates** | (a) Merge two organizations, keeping one and moving its uses; (b) the same for tests and answers | Merge Duplicates FRS, slice 6 |
| **P3 New domains** | (a) Providers, with the personal-data export log (FR-5.4, section 11); (b) organization types (FR-5.3); (c) organisms, antibiotics, AST panels and breakpoints moved onto the pipeline (FR-5.5) | One FRS per area, or the owning FRS (M-01, M-02, Providers) |
| **P4 Seed retirement** | (a) Tag legacy seed changesets and extract the core packs (FR-6.2, 6.3, 8.2); (b) slim baseline and the CI parity gate (FR-6.4, 6.5); (c) upgrade existing deployments by matching, with no unintended creates (FR-6.6); (d) distro packs and migration guides for Indonesia, Madagascar, Côte d'Ivoire and PNG (FR-6.7, 6.9); (e) the remaining legacy domains (FR-1.2, Appendix B); (f) analyzer instances, mappings and QC rules, and methods (FR-5.6, 5.7); (g) the Set up this lab checklist (FR-9) | Seed Retirement plan and Setup Checklist FRS, P2 |
| **P5 FHIR subscription (future)** | The subscription adapter (OGC-1044), switching an area's source (FR-10.3), OCL behind the pipeline | Catalog Subscription FRS update |

Piotr's distro and infrastructure work makes P4 (a) to (d) a natural fit; that phase is also where the distros change most.

## Sequencing

- 0.2 can merge at any time; the earlier, the fewer seed changesets to tag in P4.
- 3 before 9: the review needs per-run state and the shared parser (French Excel files, AC-54).
- 8 before 9: the review shows the change set, sense checks and impact counts that slice 8 computes. Slices 9 to 15 then run on Organizations, which already have identifiers (D-107).
- 5 before 9 (Export panel and Export with codes) and before 13 (the filter line limits Replace scope).
- 1, 2, 4 and 7 before 16; 4 before 17 (UCUM codes).
- 6 before 7: identifiers are never frozen onto duplicates.
- 12 before 14: Undo uses the snapshot Apply records.
- P2 before P4: without layers, shipping core as CSV makes "the first upload hides the shipped files" worse.
- **Docs:** the user manual pages "Admin: Import and export locations" (OGC-1468) and "Import a test catalog from CSV" (OGC-1286) are re-captured after slices 13 and 17 merge.

## Coverage check

- Every Import Review FR (A1 to A8, B1 to B6, C1 to C11, D1 to D7, E1 to E7, F1 and F2, G1 to G5, H1 to H7, I1 and I2, J1 to J4, K1 to K4, L1 to L5, M1 to M3, N1 and N2, O1 to O8) is in at least one of slices 9 to 17: ✅
- Every Import Review AC (1 to 82) maps to a slice: ✅ (AC-24 to every slice)
- Every Import Review dependency (1 to 25) is built in a slice: ✅ (1 and 13 in slice 8 and 10; 2 in 11; 3, 6, 11 and 15 in 12; 4 in 12 and 14; 5, 7, 21 and 24 in 9; 8, 9, 12 and 16 in 13; 10, 23 and 25 in 11; 14 in 10; 17 in 17; 18 in 12 and 14; 19 in 15; 20 in 3 and 10; 22 in 14)
- Every mockup screen is built by a slice: Upload and Export (9), Review (10 to 13, 16, 17), Done (12), Undo (14), Compare (15), Recent imports (9, 14): ✅
- Every architecture requirement placed in P0 or P1a by the roadmap is in slices 0.2 to 8: ✅. Requirements placed in P2 to P5 are listed under Later phases: ✅
- Every slice is titled around what a user can do, not a technical layer: ✅ (P1a slices are engine work, so they are titled around what a deployer or lab admin can then do)
- Localization and access are folded into each slice: ✅
