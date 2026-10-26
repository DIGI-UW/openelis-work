# Reference search: a picker for very large reference lists

| | |
|---|---|
| **Version** | v0.2 draft (2026-10-21): "Seen here" defined (D-322); mockup on the AMR v3 preview, Isolates › Identify |
| **Status** | Draft for review |
| **Owner** | Casey Iiams-Hauser (Director of Product) |
| **First adopter** | Microbiology (AMR) v3.2, [OGC-1528](https://uwdigi.atlassian.net/browse/OGC-1528), slice 1 |
| **Checked against** | OpenELIS-Global-2 `codex/amr-v2-ast-reporting` (2026-10-14, the build on pngtest) and develop `f72854e` |
| **Decisions** | D-318 to D-322 |

## Why

AMR v3 seeds the whole AMR for R organism list (about 103,000 organisms, 27,000 of them synonyms, D-268) and the full antibiotic master (506 agents, FR-R19.2), each with codes (WHONET, SNOMED, LOINC, ATC) and a taxonomy. Every micro picker today loads its whole list into the browser and filters it there:

| Where | Control today | List |
|---|---|---|
| Isolate Identify and Reidentify, reported organism (`CaseIsolateWorkspace.jsx`) | `ComboBox`, client filter on the name | All organisms |
| Breakpoint rule editor (`BreakpointRuleModal.jsx`) | `Select` | All organisms |
| Surveillance filters (`MicrobiologySurveillanceFilters.jsx`) | `FilterableMultiSelect` | Organisms, antibiotics |
| AST entry, add antibiotic (`AstEntryPanel.jsx`) | `FilterableMultiSelect` | All antibiotics |
| AST panel editor (`AstPanelPage.jsx`) | `ComboBox` | All antibiotics |
| Case nonconformance (`CaseNonconformancePanel.jsx`) | Loads all antibiotics | All antibiotics |

At 103,000 rows that means a slow first load, a list nobody can scroll, and matching only on the displayed name, so a synonym, a WHONET code or a genus finds nothing. The v3 rules pages add more organism and antibiotic pickers (reporting rule organism level, trigger agents, expert rules, molecular resistance mapping).

## Scope

- **In:** organism and antibiotic pickers in Microbiology and Microbiology reference data, and any other screen that picks an organism or antibiotic (analyzer and incoming result mapping, test catalog molecular resistance mapping).
- **Built so others can reuse it:** the component and the search contract are generic. Test catalog, analyzer mapping or patient-facing lists can adopt it later; they are not changed by this spec.
- **Out:** short lists (AST panels, methods, media, sample types, alert recipients) keep their current `Select`, `ComboBox` or `FilterableMultiSelect` (D-318).

## Behaviour

### R-1. The field: type ahead against the server

| ID | Requirement |
|---|---|
| FR-1.1 | The field looks and behaves like today's Carbon `ComboBox` (single) or `FilterableMultiSelect` (multiple), so screens keep their layout. |
| FR-1.2 | After 2 characters (1 for a code field), the field asks the server and shows the **best 20 matches**. It never loads the whole list. |
| FR-1.3 | A match can come from the current name, a synonym or former name, or a code (AMR code, WHONET, SNOMED, LOINC, ATC). A row matched on a synonym shows the current name with "Formerly {synonym}" under it; a row matched on a code shows the code. Choosing it always stores the current record (FR-R13.3). |
| FR-1.4 | **Ranking:** exact code or exact name first, then names that start with the text, then words that start with it, then anywhere. Within each band: items the lab has pinned (FR-R13.1a), then **how often this lab has seen it** (D-322), then commonness (organism `prevalence`, FR-R13.1a), then name. |
| FR-1.4a | **"Seen here" is a count, and it ranks rather than hides** (D-322). For an organism it is the number of this lab's isolates identified as that organism in the last 12 months; for an antibiotic, the number of AST runs in the last 12 months that included it, with agents on the lab's active panels counted as seen. A busy lab typically sees a few hundred organisms in a year out of about 103,000, so frequent organisms rise to the top and an organism seen once gets only a small lift. A lab with no history yet falls back to commonness. Nothing is ever left out because it has not been seen. |
| FR-1.5 | Hidden (FR-R13.1a) and inactive items are left out unless the screen asks for them (admin screens and historical filters do). |
| FR-1.6 | The list ends with **Search all {count} matches** when there are more than 20. It opens the dialog (R-2) with the typed text. |
| FR-1.7 | The field shows a loading indicator while it waits, "No matches for {text}" when nothing matches, and "Search is unavailable; try again" if the server does not answer. It never shows an empty list without saying why. |
| FR-1.8 | Keyboard and screen reader behaviour is Carbon's: arrows move, Enter picks, Escape closes; the result count is announced ("20 of 312 matches"). |

### R-2. The search dialog

| ID | Requirement |
|---|---|
| FR-2.1 | A **Search** link beside the field (and Search all, FR-1.6) opens a Carbon modal with a search box, filters and a results table. No tabs. |
| FR-2.2 | **Organism filters:** taxonomy level (species, genus, family and up), within taxon (for example genus *Klebsiella*), Gram stain, organism group (including lab-defined groups), and **Seen here in the last 12 months** (off by default; useful for surveillance and admin work). **Antibiotic filters:** class, AWaRe category where loaded (FR-R19.4), and **On this lab's panels** (on by default where the screen says so). The table shows the Seen here count as a column, so the user sees why an item ranks where it does. |
| FR-2.3 | The results table shows name, rank or class, the matched code or synonym, and commonness; it pages in 50s and sorts by any column. A row's details (parent taxa or class, all codes, synonyms) open under the row. |
| FR-2.4 | **Pick** returns the item to the field and closes the dialog. In a multiple field, rows have checkboxes and **Add {n}** returns them all. |
| FR-2.5 | The dialog remembers the last filters per field for the user's session. |
| FR-2.6 | A field may be limited by its screen (for example, the breakpoint rule organism to a group, or Identify to organisms of the culture's Gram stain once recorded). The dialog shows the limit as a removable filter tag, so the user can see why something is missing and widen it. |

### R-3. The search service

| ID | Requirement |
|---|---|
| FR-3.1 | One search service per list, with the same contract: text, filters, page, page size (20 for the field, 50 for the dialog), and "include inactive". It returns the matches, the total count, and for each match the field it matched on. |
| FR-3.2 | **Speed:** the first 20 matches return in under 300 ms at the 95th percentile with the full organism seed, on the reference server spec. The field waits 200 ms after the last keystroke before asking. |
| FR-3.3 | Matching ignores case, accents and punctuation ("e coli", "E. coli" and "Escherichia coli" all match), and accepts the abbreviated genus ("K. pneumo"). |
| FR-3.4 | How the index is built is the engineer's choice. OpenELIS already runs Hibernate Search (Lucene) for patient search, with a reindex page under Admin; a database text index is also acceptable if it meets FR-3.2. The index must include synonyms and codes and must be refreshed when a seed pack or Import Review run is applied. |
| FR-3.5 | The service never returns patient data and needs only the read permission of the list it searches (Access). |

## Data elements

Nothing new is stored for the search itself. It reads, per organism: current name, synonyms and former names, codes, rank, parent taxa, Gram stain, groups, prevalence, active and hidden flags. Per antibiotic: name, synonyms and abbreviations, codes, class, AWaRe category, active flag. "Seen here" is worked out from data OpenELIS already holds (the lab's isolate identifications and AST runs, and its active panels); picks in the field are not logged. It can be computed when the index refreshes or cached nightly; that is the engineer's choice.

## Adopters in AMR v3

| Picker | Field type | Default limit |
|---|---|---|
| Isolate Identify, Reidentify, reported organism; organism in the isolate (AMR v3 R-26) | Single, organism | None; Gram stain once recorded (FR-2.6) |
| Breakpoint rule editor | Single, organism | None (admin: inactive included) |
| AST rules: reporting rule and expert rule organism level | Single, organism at any taxonomy level | None |
| AST rules: antibiotic, trigger agents | Single and multiple, antibiotic | "On this lab's panels" on |
| AST entry: add antibiotic | Multiple, antibiotic | "On this lab's panels" on |
| AST panel editor: antibiotics | Single, antibiotic | None |
| Surveillance filters | Multiple, organism and antibiotic | None (inactive included) |
| Case nonconformance | Single, antibiotic | Agents on the isolate's runs first |
| Test catalog molecular resistance mapping (D-285) | Single, antibiotic or class | None |
| Incoming results and analyzer organism mapping | Single, organism | None |
| Enter Order: Tested elsewhere reported organism on a culture test (AMR v3 FR-R24.4) | Single, organism | None |

## Localization

All labels, messages and filter names are localized (English and French at least). Organism and antibiotic names are shown as stored; antibiotic names use the translations the AMR for R package provides where the lab's language has them.

| Key | English |
|---|---|
| `referenceSearch.search` | Search |
| `referenceSearch.searchAll` | Search all {count} matches |
| `referenceSearch.noMatches` | No matches for {text} |
| `referenceSearch.unavailable` | Search is unavailable; try again |
| `referenceSearch.loading` | Searching |
| `referenceSearch.count` | {shown} of {total} matches |
| `referenceSearch.formerly` | Formerly {name} |
| `referenceSearch.matchedCode` | {system} code {code} |
| `referenceSearch.pick` | Pick |
| `referenceSearch.addSelected` | Add {count} |
| `referenceSearch.filter.seenHere` | Seen here in the last 12 months |
| `referenceSearch.col.seen` | Seen here |
| `referenceSearch.seenCount` | {count} in 12 months |
| `referenceSearch.notSeen` | Not seen here |
| `referenceSearch.noMatchesInLimit` | No {limit} matches for {text}. {count} outside the limit: search everything |
| `referenceSearch.gramMismatch` | {organism} is {orgGram}; this isolate is recorded as {isoGram}. Check the Gram stain before saving. |
| `referenceSearch.filter.onPanels` | On this lab's panels |
| `referenceSearch.filter.level` | Taxonomy level |
| `referenceSearch.filter.within` | Within |
| `referenceSearch.filter.gram` | Gram stain |
| `referenceSearch.filter.group` | Organism group |
| `referenceSearch.filter.class` | Class |
| `referenceSearch.filter.aware` | AWaRe category |
| `referenceSearch.filter.includeInactive` | Include inactive |
| `referenceSearch.limit.removable` | Limited to {limit}. Remove to search everything. |

## Access

| Action | Who | Privilege |
|---|---|---|
| Search organisms and antibiotics from any micro screen | Anyone who can open that screen | The screen's own privilege; the search adds none |
| Include inactive and hidden items | Microbiology lab manager, administrator | `micro.referenceData.edit` (existing) |
| Rebuild the search index | Administrator | Existing Admin › Search index management |

## Acceptance criteria

- **AC-S-01** With the full organism seed loaded, opening Identify on an isolate does not download the organism list; typing "kleb pn" shows *Klebsiella pneumoniae* first within 300 ms.
- **AC-S-02** Typing "Enterobacter aerogenes" shows *Klebsiella aerogenes* with "Formerly Enterobacter aerogenes"; picking it stores *Klebsiella aerogenes*.
- **AC-S-03** Typing the WHONET code "eco" shows *Escherichia coli* with "WHONET code eco"; typing "AMC" in an antibiotic field shows amoxicillin/clavulanic acid first.
- **AC-S-04** In a lab that identified 288 *P. aeruginosa* and 4 *P. putida* isolates in the last 12 months, typing "pseudo" ranks *P. aeruginosa* first and shows "288 in 12 months"; in a new lab with no isolates the same text ranks by commonness, and *P. fluorescens* (never seen) is still listed (D-322).
- **AC-S-05** Typing "staph" shows 20 matches and "Search all {n} matches"; choosing it opens the dialog with "staph" filled in, where filtering Level = species and Gram stain = positive narrows the table, and Pick returns the choice to the field.
- **AC-S-06** In the AST entry add-antibiotic field, the dialog opens with "On this lab's panels" on; turning it off shows all agents; checking three rows and Add 3 adds all three.
- **AC-S-07** With the server stopped, the field says "Search is unavailable; try again" and does not show an empty list.
- **AC-S-08** After an Import Review run adds a synonym, the field finds the organism by that synonym without a manual reindex.
- **AC-S-09** All labels appear in French when the user's locale is French; a screen reader announces "20 of 312 matches".

## Decisions

| ID | Decision |
|---|---|
| D-318 | **Only the large lists get the search.** Organisms and antibiotics use the reference search; panels, methods, media, sample types and recipients keep their current pickers (Casey, 2026-10-21). |
| D-319 | **Type ahead against the server, plus a search dialog.** The field asks the server for the best 20 by name, synonym or code, ranked by the lab's own use and commonness; Search opens a dialog with filters and a results table. Nothing loads the whole list (Casey, 2026-10-21). |
| D-320 | **A shared component and search contract, specced once.** AMR v3 is the first adopter and builds it in slice 1; other modules can adopt it without a new design (Casey, 2026-10-21). |
| D-321 | **A screen's limit on a picker is visible and removable** in the dialog, so a missing item is never a mystery (Casey, 2026-10-21). |
| D-322 | **"Seen here" is a 12-month count that ranks and never hides.** Worked out from the lab's own isolates and AST runs (and its panels for antibiotics), not from logged picks; a new lab falls back to commonness (Casey, 2026-10-21). |

## Open questions

1. ~~What does "used by this lab" mean in practice?~~ **Resolved (D-322):** a 12-month count from the lab's own isolates and AST runs, used to rank, never to hide. On a server shared by several labs, each lab counts its own (Casey, 2026-10-21).
