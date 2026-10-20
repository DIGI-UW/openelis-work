# Reference Data as Configuration: Architecture and Roadmap

**Status:** v0.6 for Casey's review (breakdown drafted; no Jira yet)
**Date:** 20 Oct 2026
**Owner:** Casey (Director of Product, OpenELIS Global)
**Role of this document:** the architecture, coverage audit and roadmap. User-facing requirements live in one FRS per slice (RD-16). First slice: **Import Review** (`import-review/import-review-frs.md`).
**Changes in v0.6:** design critique of the Import Review (`import-review/import-review-critique.md`). A unit or result-type change on a test with results is a decision with a new version recommended, and a relabel is allowed only between equivalent units (4.11, RD-24); a range-coverage warning (4.10); warnings are checked in place in the Preview, not in the Apply confirmation (4.10); the Import Review layout and Discard decisions (RD-25, RD-26); slicing guide `reference-data-config-breakdown.md` (assigned to Piotr).
**Changes in v0.5:** second `/analyze` and fury pass (`reference-data-config-analyze-2.md`). Local decision IDs renamed RD-1 to RD-23 so they cannot be read as ledger IDs; RD-20 to RD-23 decided by Casey (rows changed since preview wait; later imports do not block Undo; the catalog half of the Import Review is completed in that FRS; "Replace" kept with guardrails). Export escaping rewritten so negative numbers and phone numbers survive (FR-4.4); the unit mix-up warning fires at exactly 10 times; changes made by a national update to the lab's own edits are listed first and sort order and display name are kept without asking (4.4, 4.7); `reference_data` privileges moved to one display group with missing rows added (section 11); new data declared (section 12).
**Changes in v0.4:** gap review of 19 Oct. Added sense checks (4.10), fields that change the meaning of existing results (4.11), the impact check (4.12), what Undo cannot reverse (R-9), comparing and promoting between servers (FR-4.5), export and file hardening (FR-4.4, FR-7.9), personal data in provider files (section 11), the "every new reference data has an import area" design rule (4.13) with the specced-not-importable list (3.6), a readiness and cleanup slice before identifiers are frozen, national list tooling, distro migration guide, and early user research. Change control (approval before apply) deferred for this pass (RD-17, Casey).
**Changes in v0.3:** applied the `/analyze` pass of 19 Oct (`reference-data-config-analyze.md`, findings F-01 to F-36, pre-mortem H-1 to H-17). Decisions RD-12 to RD-16 applied as recommended, marked provisional until Casey confirms. Identity rewritten to match Locations & Organizations (matching identifier vs reporting code); ownership is "explain, don't lock"; one import rule set (4.8); where import lives (4.9); privileges in D-233 form; Dependencies, architecture-level acceptance criteria and Docs Impact added.
**Related:** OGC-1193 / OGC-1194 (catalog CSV v2 + Import page), OGC-1363 and OGC-1420 (Locations & Organizations and its QA findings), OGC-1466 (catalog import QA, Done), OGC-1507 (translatable reference data), OGC-1509 to OGC-1512 (open loader bugs), OGC-787 / OGC-863 (breakpoint import), OGC-1044 (catalog subscription), Document Library (new loader domains), Admin Redesign (Configuration page)

**Evidence basis.** Static read of `DIGI-UW/OpenELIS-Global-2` `develop` at `f72854e` (19 Oct 2026), the shipped import screens, QA tickets OGC-1420 and OGC-1466, and design docs in `openelis-work`. Not live-verified on a running instance.

---

## Lab Context

### Current State
Before a lab can take its first order, OpenELIS needs the lab's reference data: lab units, sample types, tests and their results and normal ranges, panels, units of measure, the coded answer lists (rejection reasons, organisms, and so on), the facilities and wards that send samples, the clinicians who order, analyzer settings, and for microbiology the organisms, antibiotics and breakpoint tables. Today some of this arrives with the software (a 2011 database dump plus about 830 database-upgrade scripts that insert rows), some is loaded from CSV (comma-separated values) files a server administrator copies into a folder before the system starts, some can be uploaded on two admin pages (test catalog, locations), and the rest is typed in by hand, one record at a time.

In practice an engineer from DIGI (the University of Washington group that leads OpenELIS) or a partner implementer prepares the files. For the Central Public Health Laboratory of Papua New Guinea (PNG), someone converted the lab's spreadsheet of active tests into eleven CSV files, loaded them into a test server, read the server logs to find rows that were skipped, and repeated. For the Ministry of Health training, the same loading had to be taught to people who are not developers.

### Pain
- A site lead cannot do it alone. The upload page takes 11 of the 28 kinds of reference data; coded answer lists, results and units cannot be uploaded at all, so a catalog that adds one new answer still needs a server administrator and a restart.
- Nothing can be downloaded back out except organizations, so a lab cannot see its own catalog as a spreadsheet, fix it and load it again.
- What the screen says and what happens differ. QA found a Preview that reported 2 new tests while Apply created 1 and updated 1, and a Preview that saved unresolved rows so that a second Preview doubled them (OGC-1466).
- Mistakes are expensive. Re-importing an exported list of referral labs in Replace mode would have deactivated 44 referring clinics, one with 339 open orders (OGC-1420). Importing 5,000 new facilities raised 5,000 "possible rename" questions, and Apply stayed disabled until each was answered by hand.
- Shipped data disappears silently: dropping one file into a folder hides all the test definitions the software ships for that kind of data.
- Every country's ministry maintains its own national lists (tests, facilities, clinicians) and has no way to send updates to its labs except by email and retyping.

### What Changes
A site lead downloads their lab's reference data as one Excel workbook (pre-filled, with drop-down lists), changes it, and uploads it. OpenELIS shows, in plain words, what will happen: what is new, what changes (before and after), what would be deactivated and how many open orders that affects, and the few things that need the lead's decision, grouped so that 38 similar questions take one answer. Nothing is saved until Apply; Apply does exactly what the Preview said; and an applied import can be undone. Every kind of reference data loads this way, from the same page pattern, and every kind can be downloaded again.

The national lists arrive the same way. Today the ministry sends a national workbook; later a central server sends updates automatically. Either way the site lead sees the same review screen, keeps the local settings they chose, and is never asked the same question twice. New installations get their starting catalog from the same files instead of database scripts, so what ships is visible, versioned and replaceable by each country.

---

## 1. Goal

Every piece of lab-configurable reference data is:

1. **shipped** as versioned CSV packs, not as Liquibase DML or a database dump,
2. **loadable** the same way at start-up, through the reload API, and through the Admin import screens with a Preview,
3. **exportable** back to the same format, so any running national deployment can be captured, compared, versioned and moved, and
4. **overridable** by a distro or instance without forking core.

Liquibase keeps the schema and the rows the Java code depends on by name or id (Section 6).

### Users

| User | What they do | Now / later |
|---|---|---|
| **Site setup lead (primary)** | Stands up the metadata for a new site: catalog, sample types, units, facilities and wards, providers, analyzers, local settings. A lab manager or site IT person, not a developer. Works in Excel, often in French or Spanish, sometimes on poor connectivity. Does this a few times a year, so remembers nothing between sessions. | Now |
| **Central metadata manager** | Maintains the national catalog, facility list, provider list and AMR reference data once, for every site. Works outside OpenELIS. | Now through a national workbook (pack) handed to sites; later through a FHIR subscription from a central server |
| Implementer (DIGI, partner, distro maintainer) | Builds packs and distros, scripts loads | Now; uses raw CSV and the reload API |

**Design rule:** everything is designed for the site setup lead first. The central path reuses the same pipeline, identifiers and review screens, so a site that started from uploaded files can switch to a subscription without re-keying or duplicating anything.

**No multitenancy.** The central server is outside OpenELIS (as for central delivery, D-232, and surveillance aggregation, D-041). OpenELIS never shows one site another site's data and has no site selector (D-001).

### Non-goals (this pass)
- Choosing a storage model for any domain. Data elements are named; storage shape is the implementing engineer's call.
- Replacing the FHIR registry pulls (facility list, provider list). CSV sits alongside them.
- Analyzer protocol profiles, which live in the Analyzer Bridge.

---

## 2. Headline findings (audit)

1. **Liquibase is not the main seed.** The real seed is a 2011-era pg_dump baseline (`db/dbInit/OpenELIS-Global.sql`, 155 `COPY` blocks) loaded before Liquibase: 657 dictionary entries in 54 categories, 98 tests, 222 test results, 111 result limits, 105 menu rows, 88 site_information rows, 136 observation history types and more. About 830 of Liquibase's 1,629 changesets are pure DML, and most find their parent rows **by name** in that dump.
2. **Only 11 of 28 loader domains have the modern engine** (organizations, test-sections, sample-types, tests, result-components, panels, answer-terminology, result-limits, sample-handling, terminology, reflex-rules): per-row transactions, SUMMARY lines, Preview and the import page. The other 17, **including `dictionaries` and `test-results`**, are legacy: file-wide or no transactions, log-only errors, no Preview, not uploadable.
3. **Only organizations can be exported.**
4. **Shipped defaults can silently disappear.** A domain's files load from the filesystem **or** the classpath, never both; the first upload to a domain hides that domain's shipped files permanently.
5. **Providers, micro reference data (organisms, antibiotics, AST panels), units of measure and organization types have no loader.** Breakpoints have a separate admin upload outside the configuration tree.
6. **Many seeded rows are code contracts** (Section 6) and cannot become optional CSV without code changes.
7. **Two shipped domains replace child rows outright:** result limits delete numeric ranges not in the file, and reflex rules rebuild their conditions. 4.8 rule R-5 governs them.

---

## 3. Coverage matrix

Legend. **Seed:** D = baseline dump, L = Liquibase DML, C = classpath CSV/JSON, U = UI only, F = FHIR pull, none. **Engine:** M = modern (per-row, SUMMARY, Preview, import page), Lg = legacy loader, none. **Req:** rows the Java code depends on by name or id.

### 3.1 Test catalog and dictionary

| Domain | Seed today | CSV engine | Import page | Export | i18n | Req | Target |
|---|---|---|---|---|---|---|---|
| test-sections (lab units) | D, L, C | M | yes | no | yes | some (`user`, `Immunohistochemistry`, `TB`, `Hematology`) | Pack + export + matching identifier |
| sample-types | D, L, C | M | yes | no | yes | some (`Variable`, `DBS`, `Whole Blood`, CI types) | Pack + export |
| tests | D, L, C | M | yes | no | yes | some (VL, CD4, `Viral Load`, `DNA PCR`) | Pack + export |
| result-components | L | M | yes | no | **no** (label) | no | Add `localization:xx` for label |
| test-results (select lists, normal flags) | D, L, C | **Lg** | **no** | no | no | no | **Move to M engine (P1a)** |
| result-limits | D, L | M | yes | no | n/a | no | Export; fix `lowCritical` default; R-5 |
| panels | L | M | yes | no | yes | no | Matching identifier; Replace mode for members |
| terminology (test LOINC/SNOMED) | L | M | yes | no | n/a | no | Export |
| answer-terminology | none | M | yes | no | n/a | no | Export |
| sample-handling | none | M | yes | no | no | no | Export; i18n on instructions |
| reflex-rules | L | M | yes | no | **no** (notes) | no | Fix OGC-1511; i18n on notes; R-5 |
| dictionaries (+ categories) | D (657), L (~140), C | **Lg** | **no** | no | yes | **many categories** | **Move to M engine (P1a)**; category identifier; OGC-1507 keys |
| units of measure | D (37), L (9) | **none** | no | no | no | no | **New domain (P1a)** |
| methods | D (13), L | none | no | no | no | no | New domain (P4) |
| documents, document-versions | none | M (Document Library, specced) | yes | no | per that FRS | no | Join the shared pipeline as specced |
| OCL zip | none | Lg (tests and panels only) | no | n/a | from OCL | no | Behind the same pipeline (P5) |

### 3.2 Organizations, locations, providers

| Domain | Seed today | CSV engine | Import page | Export | i18n | Req | Target |
|---|---|---|---|---|---|---|---|
| organizations (facilities, wards, sites, referral labs) | D (few), F, U | M (OGC-1363) | yes (Locations page) | **yes** | no (names in other languages deferred in L&O) | no | First user of the Import Review (P1b) |
| address hierarchy (levels, values) | site_info, F | Lg | Locations page only | areas only | displayKey | `Health Region`/`District` | Move to M engine (P2) |
| organization types | D (6), L | **none** | no | no | no | **yes** (`referralLab`, `dept`, `referring clinic`) | System types stay; domain for custom types (P3) |
| providers | F (hourly), from FHIR orders, U | **none** | no | no | n/a | no | **New domain (P3)** |
| patient identity types | D (18), L | none | no | no | no | **yes** | Stays in Liquibase |

### 3.3 AMR / microbiology

| Domain | Seed today | CSV engine | Import page | Export | Req | Target |
|---|---|---|---|---|---|---|
| organisms | **none** (tables empty) | none | no | no | no | **New domain (P3)**; WHONET-seeded pack |
| antibiotics | **none** | none | no | no | no | **New domain (P3)** |
| AST panels (versioned) | none | none | no | no | no | New domain (P3) |
| breakpoints (CLSI/EUCAST) | none | separate admin upload (`MicroBreakpointImportServiceImpl`) | own page | rejected rows only | no | Re-home into the pipeline (P3); **M-02 owns the column format** |
| expert rules, reporting profiles | not built | n/a | n/a | n/a | n/a | Format owned by M-06 and the v3 reporting profiles (P4) |

### 3.4 Analyzers and QC

| Domain | Seed today | Loader | Export | Target |
|---|---|---|---|---|
| analyzer profiles | Bridge store; legacy OE tables dropped | Bridge, not OE | designed (download only) | **Out of scope here**; the Bridge owns profile packs (RD-5) |
| analyzer instances + revisioned mappings | U | none | no | JSON domain with export and import (P4) |
| QC rule sets (Westgard), control lots | U | none | no | Domain (P4) |

### 3.5 System configuration and other lists

| Domain | Seed today | Engine | Req | Target |
|---|---|---|---|---|
| site-information / settings | D (88), L (~90) | Lg (overwrites blanks) | **yes** (~200 `Property` enum names) | Definitions stay in Liquibase; values loadable (P4); the Admin Redesign Configuration page stays the only editor |
| roles | D, L | Lg (OGC-1510: cannot create) | **yes** (Constants.ROLE_*) | Fix bug; M engine; permissions through Flexible RBAC (P4) |
| system modules / URLs | D, L | none | **yes** | Stays in Liquibase |
| menus | D, L (180 changesets) | `menu_config.json` file | **yes** | Stays; menu editor owns it |
| NCE types / categories | D | Lg | no | M engine + OGC-1507 keys (P4) |
| observation history types | D, L | Lg (create-only) | **yes** (enum dbName) | Stays in Liquibase (OGC-1509 shows the cost of not seeding) |
| status_of_sample, reference_tables | D, L | none | **yes** | Stays in Liquibase |
| locales | C | Lg | no | M engine (P4) |
| vector species / trap types | L + C (two sources) | Lg | some | M engine; drop the Liquibase copy (P4) |
| compliance standards (4 files) | volume only | Lg | no | M engine (P4) |
| EQA programs | L | Lg | no | M engine (P4) |
| programs / questionnaires | JSON at start-up | own autocreate / Lg | no | Leave; already file-driven |
| report definitions, notification templates, label presets | L | none / JSON | some | Later; outside this pass |

### 3.6 Specced or shipping without an import area (gap, see 4.13)

Reference data that designs in progress add, with no loader domain declared yet:

| Data | Owning spec | Target |
|---|---|---|
| Container types, test expected containers | Clinical Order Entry v4 | Catalog area, with tests |
| Body sites (cleaned source of sample) and laterality | Clinical Order Entry v4 | Catalog area |
| QC targets per test (`test_qc_target`), LOD / LOQ on components | Test Catalog QC Targets | Catalog area |
| Test alert rules and their recipients | Test Catalog Alerts, Result Delivery | Catalog area |
| Test-method links, test-reagent links | Methods redesign, Reagent linkage | Catalog area |
| Label preset links per test | Label Presets (OGC-285) | Catalog area |
| Turnaround-time targets | QA Dashboard / TAT model | Catalog area |
| Category and ownership lists, ward service type | Locations & Organizations | Dictionary and organizations areas |
| Distribution lists | Result Delivery | Own area (P4) |
| Microbiology programs, reporting tracks, culture media | Microbiology v2 | Micro areas (P3) |

**Coverage today against the goal's four tests:**

| | Shipped as CSV | Loadable with Preview | Exportable | Layerable without hiding base |
|---|---|---|---|---|
| Domains that pass | ~6 (partial) | 11 of 28 | 1 | 0 |

---

## 4. Target architecture

### 4.1 Two owners
- **Liquibase owns** the schema and **system-required rows**: anything the Java code reads by literal name or id (Section 6). Their **labels** become translatable through OGC-1507 keys.
- **The configuration pipeline owns** everything a lab or ministry would reasonably change. Core ships it as **packs**.

### 4.2 Packs and layers
A **pack** is a named, versioned set of files across domains, with a manifest (title shown to users, publisher, version, domains, depends-on). Proposed core packs:

| Pack | Contents | Default |
|---|---|---|
| `core` | units, the configurable dictionary categories, sample types, lab units, the minimal test set every install needs | always on |
| `clinical-starter` | a small generic clinical catalog (RD-2) | on for new installs unless a distro turns it off |
| `pathology`, `ihc`, `cytology` | catalogs now in `2.8.x.x` changesets | on with the program |
| `vector`, `environmental` | classpath vector files, trap types, species | on with the domain |
| `analyzers-horiba` | Horiba CBC tests, GeneXpert result options | opt-in |
| `amr-whonet` | organisms, antibiotics, default AST panels from WHONET codes | on with micro |
| `amr-breakpoints-clsi-YYYY`, `-eucast-YYYY` | breakpoint tables | opt-in, pending licence clearance |
| `cote-divoire`, Haiti, ARV/EID, RetroCI content | everything behind the `ci_*` contexts and the programme-specific dump lists | move to their distros |

**Layering** replaces today's either/or: `core packs → distro packs → instance files → UI edits`, merged **by matching identifier**, later layers winning field by field. A distro never copies a core file to change one row.

**A newer pack version that no longer lists a record** it previously supplied proposes deactivating it. The proposal appears in the Preview like a Replace deactivation, with in-use counts, is never applied silently, and never touches records the site created itself.

**Words.** The site lead never sees "pack", "layer", "change set", "code system", "domain" or "namespace". A pack appears under its title ("PNG national test list, version 3"); its records are "managed by {publisher}"; the site's own records are "added by this lab".

### 4.3 Identity: matching identifier and reporting code
Two different things, as Locations & Organizations already models them (FR-A5, FR-F4, D-107):

- **Internal identity** (database id, FHIR UUID) never changes through edit or import.
- **Matching identifier**: one or more identifiers, each a **system** and a **value**, used to match an incoming row to an existing record. For organizations this is D-107's identifier list (the label plays the role of the system). Every domain gets at least one matching identifier, issued by whoever created the record: the central publisher for central records, the site (with the site's own system) for local ones. Matching identifiers issued by a central publisher never change.
- **Reporting code**: the code people see and print, which can change. For tests it is today's `localCode`; for organizations, the identifier marked as reporting code.

Matching order everywhere: matching identifier, then any other identifier, then name (normalised, with former names and remembered aliases), as L&O FR-F4. Existing records get a matching identifier by a deterministic backfill so packs match them on first load. Site setup leads never type a system; the workbook carries it in a hidden column.

### 4.4 Protecting local settings
A record carries its **source** (pack and version, file, UI, FHIR registry, subscription) and the fields the lab set locally. When a newer source version changes a field on the local settings list (RD-9) that the lab set, the change goes to **Needs your decision** with both values. Other fields the lab edited on a central record are overwritten by the update, as the screen warned when they were saved (4.7). The lab's answer is remembered: the same field is not asked about again unless the source's value changes again ("Keep mine for this field from now on" is one of the answers).

### 4.5 Export everywhere
Every domain exports to its own import format. Export is how an existing deployment becomes a pack, how labs review what they run, and how parity is tested. An unedited export re-imported produces no changes (round trip).

### 4.6 One pipeline, many sources

```
 Sources (adapters)                         One pipeline                                   Outcome
 ------------------                         ------------                                   -------
 Site workbook / CSV upload  --+
 Shipped or national pack    --+--> change set --> validate + match --> Preview --> decisions --> Apply --> snapshot (Undo)
 Files on disk / reload API  --+    (rows with      (identifiers,      (same code    (grouped)     (background   + source per record
 OCL zip                     --+     identifiers)    dependencies,      path as                     job)          + run history
 FHIR subscription (future)  --+                     any order)         Apply, rolled back)
```

- No source writes reference data directly; every source produces a **change set** and goes through the same steps and screens.
- **Preview runs the same code as Apply** inside a transaction that is rolled back, so its counts are Apply's counts. Apply never writes over a change the Preview did not show: a row whose record changed after the Preview (in a field the row writes) waits in a **Changed since preview** decision showing both values, and the rest applies (RD-20). Preview writes nothing that survives it: unresolved names it finds are held with the run and enter the shared decision queue only on Apply (OGC-1466).
- **Validate and match** sorts dependencies, so one upload or bundle can carry everything in any order.
- **Partial apply:** Apply takes every row that is ready **and does not depend on a row still waiting for a decision**; dependent rows stay pending with that reason.
- **Apply runs as a background job** with progress; the user can leave the page and return to the run. Apply is idempotent per run: a repeated request (a retry after a dropped connection) returns the running or finished run, never a second import. Answers are saved to the run as they are given, so a dropped connection or a closed tab loses nothing.
- **Apply first takes a snapshot** of every record it will change, so an applied run can be undone (4.8 R-9).
- The FHIR subscription adapter (future) translates central resources (test and specimen definitions, value sets, organizations and locations, practitioners, plan definitions for reflex rules and breakpoints) into change sets. It needs no screens of its own.

### 4.7 Central and local records: explain, don't lock (RD-12)
Once a site takes metadata from a central source (a national pack now, a subscription later, or the facility registry today), each record shows where it came from:

| Source | What the site can do | How it looks |
|---|---|---|
| **Central** (pack, subscription, registry) | Edit is allowed. Fields on the **local settings** list (RD-9: active at this site, sort order, local display name, linked analyzer, site-specific reference ranges) are kept as the site's own and survive central updates. Any other field the site edits is overwritten by the next central update, and the screen says so before saving, as L&O FR-H2 does for the facility registry. | "Managed by {publisher}" tag; "From {publisher}" marker on central fields |
| **Added by this lab** | Fully editable; never touched by central updates | No tag |

- **Active at this site** is always a local setting, so a lab can take a test off the order screen today without asking anyone.
- **Sort order and local display name** keep the lab's value without asking when a central update changes them; the Preview lists them as information, not as decisions.
- When a site edits a central field that is not a local setting, the save-time warning offers **Save as this lab's display name** where the field is the name, so the edit survives as a local setting instead of being overwritten.
- A pack can declare a field **locked** when a national programme requires it (for example a notifiable-disease test's LOINC code). Locked fields are read-only with the reason shown. This is per pack and off by default.
- Local additions get the site's own identifier system, so they never collide with a later central record. A site can hand a local record to central management: central publishes a record that carries the site's identifier as a second identifier, and the pipeline merges them without breaking history.
- Central updates that change a local-settings field the site set go to the decision queue (4.4), never silently overwrite. Edits to other central fields are overwritten, as warned at save time; the Preview of a central update starts with **Your lab's edits this version replaces ({count})** so none is lost unseen, and the Changed by {publisher} decisions offer the group answers **Keep all mine** and **Take all from {publisher}**.

### 4.8 One rule set for every import
These rules apply to every domain, every source and every screen. Legacy behaviours that differ are defects (Appendix B).

| # | Rule |
|---|---|
| R-1 | **Blank means unchanged.** A blank cell never changes a stored value. |
| R-2 | **Clearing is explicit (RD-14).** The keyword `(clear)` (localized; English and the user's language both accepted) clears a value. The Preview lists it as "will be cleared". A required field cannot be cleared. |
| R-3 | **Nothing is deleted.** Records are deactivated with `active = N`, by Replace, or by a pack that dropped them; never deleted (D-002). |
| R-4 | **Two modes.** **Add & update** (default) changes only what the file lists. **Replace** also deactivates records the file does not list, within a scope stated in plain words before Preview (generalised from L&O FR-F3 and D-108). Scope is decided **per record, not per type**: a record with several types is in scope only if the file holds rows of every one of its types, so exporting referral labs and re-importing them never touches referring clinics (OGC-1420 2a). Replace needs the tick "I understand N records will be deactivated". When the file is an OpenELIS export, it records the list filters it was exported with (a `#` comment line the loader skips), and Replace scope is further limited to records matching those filters, so re-importing a filtered export never deactivates records outside the filter. The mode keeps the shipped word "Replace" (RD-23); its help text is always shown, translators get the note "deactivate records the file does not list; values are never overwritten by this choice", and when a file lists fewer than a quarter of the records Replace covers, the Preview asks "This file lists 40 of the 452 records in its scope. Did you mean Add & update?". Scope rules for catalog areas are in the Import Review FRS (section O). |
| R-5 | **Child rows that define a parent** (a test's numeric ranges, a reflex rule's conditions and actions, a panel's members in Replace mode) are part of the parent's definition. A file that lists a test's ranges replaces that test's range set; the Preview lists the change per range (Added, Changed, **Removed**), warns when ranges the file does not mention will be removed ("Glucose: the file has 1 range; 4 others, for children and by sex, will be removed"), and the replaced values are kept in history and in the run's snapshot, and Undo restores them. These child rows are not domain records under D-002. |
| R-6 | **Duplicates in one upload are errors.** Two rows carrying the same matching identifier, or the same workbook row signature (a hidden value per exported row), are rejected naming both rows ("Lines 14 and 52 both have local code HB01"). This stops a copied Excel row overwriting the original. |
| R-7 | **Stale downloads are caught.** A workbook records when it was exported. Rows whose record changed after that are flagged in the Preview with both values and the name of who changed it, and need a decision. |
| R-8 | **Nothing is silently ignored.** Unknown columns, unknown values and skipped rows are Preview outcomes with a count and a reason. |
| R-9 | **Undo (RD-13).** An applied run can be undone from its run history: records it created are deactivated, values it changed are restored from the snapshot, records it deactivated are reactivated. Before undoing, records now in use (open orders, results, child records) are listed and the user chooses to keep them; nothing in use is deactivated without being named. Values changed by someone else after the run are shown and kept unless the user chooses otherwise. This includes values changed by a later import; a later import never blocks Undo (RD-21). Undo restores OpenELIS's own records only. Effects outside them cannot be taken back and are listed in the Preview before Apply and again on Undo: copies other systems already took (a FHIR export already pushed or downloaded, a list another system such as OpenMRS already synced; OpenELIS's own FHIR API reads live records, and imports never write to a facility or provider registry), files written for branding, and reports already issued with the old values. |
| R-10 | **Possible matches use one routine** shared with manual creation (D-216): a new row is compared with existing records of the same kind; common words in the domain (Health, Centre, Clinic, Hospital, Laboratory, Test, Serum) are ignored, so "Gerehu Health Centre" is not offered as a rename of "Kaugere Health Centre" (OGC-1420 1a). If more than 50 rows in one run would need a match decision, the Preview says the file probably needs its identifiers and offers to treat them all as new. |
| R-11 | **Outcome words are the shipped L&O words:** New, Updated, Unchanged, Reactivated, Deactivated, Needs decision, Rejected, plus Ignored, Warnings and Will be cleared. |

### 4.9 Where import lives (RD-15)
- One shared **Import Review** component (upload, review, decisions, apply, result, undo, run history) is used by every area's import screen. Its requirements are the Import Review FRS.
- Area pages keep their routes and gain the component: Locations & Organizations Import / Export (`/MasterListsPage/locations/import`, first), Import Catalog (`/MasterListsPage/CatalogImport`, second), then Providers, Microbiology reference data (breakpoints page) and Analyzers.
- A central **Reference Data** page (workbook download and upload across all areas, installed packs, all run history, the decision queue) is added in P2. Its SideNav place and route are declared in the Admin Redesign IA when that slice is written.

### 4.10 Sense checks
Format and matching checks are not enough: a file can be well formed and clinically wrong. Every area defines **sense checks** that run in the Preview on the records as they would be after Apply, including records the file does not touch (a new range can contradict an existing one). Each check is either **blocking** (the row is Rejected) or a **warning** (the row applies, the Preview shows it under Problems, and each warning group is checked where it is shown before Apply is enabled). The table below is the minimum. Where the completeness and catalog-health gate of Test Catalog Completion v2 already defines a check, its rule and message are used, so the editor and imports never disagree.

| Area | Blocking | Warning |
|---|---|---|
| Ranges | Low above high in any pair (normal, critical, valid); minimum age above maximum age; overlapping age or sex bands for the same test, specimen and component | Critical range inside the normal range; normal range outside the valid range; a new range 10 times or more, or one tenth or less, of the range it replaces (a likely unit mix-up such as mg/dL and mmol/L); **range coverage**: an age span or sex that the test's current ranges covered and the new set does not, per test, sample type and component ("After this import, Glucose has no normal range for: children 1 to 17, infants under 1. Their results will not be flagged."). A test that never covered a group raises nothing |
| Tests and components | Numeric result with no unit; coded result with no answers; orderable test with no sample type | Coded test with no answer marked normal, or more than one; a numeric test with no normal range |
| Terminology | LOINC code not in LOINC's format (`nnnnn-n`, check digit valid) | The same LOINC code on two active tests with the same sample type |
| Panels | Panel with no active test | Panel test not linked to any of the panel's sample types |
| Reflex rules | Condition on an answer the test does not have | Rule whose added test cannot run on the condition's specimen |
| Organizations | As L&O FR-F7 | Facility with automatic delivery on and no delivery password (L&O FR-N8); two active records with the same name, type and location (L&O FR-C4). GPS plausibility stays deferred, as L&O decided |

### 4.11 Changes that alter existing results
Results store their value, result type, significant digits and numeric normal range (`Result.minNormal` / `maxNormal`), and a coded result stores the answer's id. They do **not** store the unit, the critical or valid limits, or the answer's text. So some changes to a test that already has results change how past results read, on screen and in reprinted reports.

- **Guarded fields** (Apply needs a tick): a test's significant digits; a coded answer's text and its normal flag; removing a sample type from a test; a component's code; removing a component that has results; an organization's reporting code (it changes national reports and exports, not results).
- **Meaning changes** (a decision, RD-24): a test's **unit** and **result type**. On a test with results, the row goes to Needs your answer with the result count ("Glucose has 12,400 results. Changing its unit would show them in the new unit. A new version keeps past results as they were.") and three answers, none preselected: **Create a new version of this test (recommended)**, **Same measurement, only the label changes**, **Skip this row**. Until answered the row waits; it never applies by default. The relabel answer is offered only when the two units are **equivalent**: the same UCUM unit once case and spelling are normalised (mg/dl and mg/dL; ug, mcg and µg; 10\*9/L and x10^9/L), checked on the UCUM code of the units-of-measure list. Any other pair, including units of the same kind with a conversion factor (mg/dL and mmol/L, g/dL and g/L), is not equivalent. A result-type change is never a relabel. A test with no results changes unit or result type as an ordinary edit.
- When a file changes a guarded field on a test with results, the Preview shows the change under **Will change** with a caution tag and the count (for significant digits, "Ranges shown on past results will use the new number of digits.", since results keep their own digits but reports format the range from the test), and Apply needs the change ticked, once per guarded field across the run.
- **Create a new version of this test** makes a new test with the new definition, and the old test made not orderable (it leaves order entry but stays active, so open analyses complete and its results keep their definition). The new test takes the row's name and reporting code (`localCode`); the old test keeps its matching identifier and gets its name suffixed with the date it was replaced (for example "Glucose (to 2026-11-02)"); the new test gets a new matching identifier that records the old one as its predecessor. Panels, reflex rules, analyzer mappings, alert rules and other dependencies stay on the old test; the Preview lists them (4.12) so the user can move them, since moving them changes what those rules do. A rename or a corrected spelling stays an edit.
- Normal ranges are already kept on each result, so changing a range does not change past results; the Preview says so.
- Effective-dated reference data (every field kept with a date range) is not in this pass (RD-18).

### 4.12 Impact check
"In use" covers more than orders. For every record the Preview will deactivate, recode or rename, and for every guarded change, it lists what depends on it, by name and count, so the user sees what will stop working.

| Record | Dependencies listed |
|---|---|
| Test | Open orders and unreleased analyses; results (count); panels; reflex rules (as condition or action); analyzer test mappings; calculated tests; alert rules; label presets; QC targets and control lots; test-method and reagent links; programs and questionnaires that add it; notification settings; terminology used by order routing from OpenMRS / FHIR (LOINC); WHONET, DHIS2 and Custom Data Export mappings; referral lab test lists |
| Sample type | Tests and panels linked to it; open sample items; vector species and trap types; collection containers |
| Answer (dictionary entry) | Tests offering it; results holding it; reflex rule conditions; analyzer value mappings; answer terminology |
| Organization | As L&O: open orders, active wards / depts, sites located in it; plus pending referrals to it, standing agreements, result delivery settings, EQA participation, shipments |
| Provider | Open orders naming them; result delivery addresses |
| Unit of measure | Tests and components using it |

Records with dependencies are listed first in their section, and their dependencies show in the expanded row. A test with open analyses is never deactivated by an import while they remain: the Preview offers **Make not orderable** (it leaves order entry; open analyses complete and release) or **Keep as is**; deactivating it later is an ordinary edit. This mirrors the guard L&O FR-E2 gives organizations.

### 4.13 Design rule: every new reference data has an import area
Any FRS that adds lab-configurable reference data (a list, a per-test setting, a code mapping) declares, in its Dependencies, the import area that loads it, its columns, its matching identifier and its export. `/analyze` treats a missing declaration as HIGH. Section 3.6 lists the specs that need it now. To add to the design addendum through `/constitution`.

---

## 5. Requirements by capability

These are architecture-level requirements. Screen-level requirements, acceptance criteria and localization are in the slice FRSs.

### FR-1 Pipeline engine parity
- **FR-1.1** `dictionaries` and `test-results` move to the modern engine with Preview, upload, decisions (emitting the unused `TYPE_DICTIONARY` item) and the 4.8 rules.
- **FR-1.2** Every remaining legacy domain moves to the modern engine, ordered by Section 7.
- **FR-1.3** One CSV parser (RFC 4180, quoted multi-line cells, `""` escape, BOM and Windows-1252 handling as `CsvParsingUtil.openCsvReader`) for all domains; `;` accepted as a delimiter when the header uses it.
- **FR-1.4** `#` comment lines are skipped in every domain.
- **FR-1.5** Every domain follows 4.8. Legacy behaviours that reset a value on a blank cell (site-information, roles, compliance standards, dictionary and panel `isActive`, the locale fallback) are fixed as defects.
- **FR-1.6** Apply refreshes the same caches as the reload API.
- **FR-1.7** Checksums are keyed by domain, layer and file path; a file with rejected rows is retried on next start until clean or explicitly accepted.
- **FR-1.8** Import state is per run, so concurrent imports cannot swap results.
- **FR-1.9** Performance: Preview of a 5,000-row upload finishes within 60 seconds on the reference server (4 CPU cores, 8 GB memory, database on the same host, about the size of a national reference lab install) with progress shown; the review list is paged on the server; Apply runs as a background job (4.6).

### FR-2 Layered sources
- **FR-2.1** Core packs, distro packs and instance files load together and merge by matching identifier; no layer hides another's files.
- **FR-2.2** Each pack has a manifest; the Reference Data page lists installed packs by title, publisher, version and per-area counts.
- **FR-2.3** A distro can disable a core pack, or deactivate individual records in its own layer, without editing core.
- **FR-2.4** A pack version that drops a record proposes its deactivation (4.2).

### FR-3 Identity and source
- **FR-3.1** Every domain has a matching identifier (4.3). Domains keyed only by name today (test-sections, panels, dictionary categories and entries, roles, NCE, EQA, organization types) get one by deterministic backfill. Organizations keep D-107 identifiers.
- **FR-3.2** Every record carries its source and the fields set locally (4.4, 4.7).
- **FR-3.3** A source update that conflicts with a local setting is queued; the answer is remembered per field.
- **FR-3.4** Pack-declared locked fields are read-only with the reason shown; all other central fields follow 4.7.

### FR-4 Export
- **FR-4.1** Every modern-engine domain exports to its own import format, filterable as its list screen is.
- **FR-4.2** "Export everything" produces a pack that re-imports into a fresh install with no rejections and into the source install with no changes.
- **FR-4.3** Export includes `localization:xx` for every active locale and the hidden matching-identifier and row-signature columns.
- **FR-4.4** Exports are protected against formula injection (CWE-1236) without corrupting data. In CSV, a **text** value starting with `=`, `+`, `-`, `@`, tab or carriage return gets a leading `'`, except a value that is a plain number (`-9.4705`) or a phone number (`+675 324 8200`), which is written as is; numeric columns are written raw. Import removes one leading `'` before those characters, so a round trip changes nothing. The workbook writes typed cells (text or number), never a prefix. The existing `StringUtil.csvEscape` prefixes every value starting with `-` or `+` and ignores tab and carriage return; it is extended accordingly before exports use it.
- **FR-4.5** **Compare and promote between servers.** An export from one server (for example a training or staging server) can be previewed against another (production) as an ordinary import: the Preview is the comparison. A "Compare only" option shows the differences in both directions (what the file has that this server lacks, and the reverse) without offering Apply, so a lab can check that two servers match.

### FR-5 New domains
- **FR-5.1** `units-of-measure` (identifier, name, type, UCUM code, localization), loaded before tests.
- **FR-5.2** `dictionary-categories` as its own domain (identifier, name, description, active, localization).
- **FR-5.3** `organization-types` for custom types; system types stay in Liquibase.
- **FR-5.4** `providers`: external identifier, NPI or national ID, title, names, phone, email, provider type, active, linked organizations. Matched by identifier, then FHIR UUID, then name and organization. When the Practitioner registry pull is configured, the registry is the source for the providers it supplies (RD-4), and 4.7 applies. Fix: providers that leave the registry are deactivated.
- **FR-5.5** Micro reference: organisms (WHONET code, OCL code, name, group, gram stain, default AST panel), antibiotics (WHONET code, name, class, route), AST panels (identifier, version, members), and breakpoints re-homed from the current admin upload into the pipeline, keeping the breakpoint page as its screen. **M-02 owns the breakpoint column format**; this document does not restate it.
- **FR-5.6** `methods`.
- **FR-5.7** Analyzer instances and their revisioned mappings as an export and import domain (JSON acceptable); QC rule sets. Analyzer protocol profiles stay with the Bridge.

### FR-6 Liquibase seed retirement
- **FR-6.1** **Freeze.** From the freeze date (RD-7), no new changeset inserts into a configurable table (list kept in the repo); a CI check fails a PR that does.
- **FR-6.2** **Tag.** Existing reference-data DML changesets get a `legacy-seed` context. Existing databases are unaffected. The engineer confirms on the pinned Liquibase version that adding a context does not change the checksum; if it does, use `validCheckSum` pins.
- **FR-6.3** **Extract.** Build the packs by exporting a fresh legacy install through FR-4 and splitting by pack, with every inferred split listed for review.
- **FR-6.4** **Slim baseline.** New installs use a baseline holding schema plus system-required rows only, run Liquibase without `legacy-seed`, then load packs.
- **FR-6.5** **Parity gate.** CI builds both paths and compares the configurable tables by matching identifier; release only with no differences or a reviewed allowlist.
- **FR-6.6** **Existing deployments.** First start on the new release loads core packs against the existing database: records matched, no creates for data already present, differences reported as decisions, nothing deleted. A pre-upgrade Preview of all core packs produces a per-site report before the upgrade.
- **FR-6.7** Côte d'Ivoire and other programme-specific seeds move to their distros' packs.
- **FR-6.8** **Readiness report and cleanup before identifiers are frozen.** Before FR-3.1's backfill runs on an existing deployment, a read-only readiness report lists what would make matching unreliable: records sharing a code (OGC-1420 item 8), duplicate names within a type and parent, legacy `Name(Specimen)` test copies, tests with no sample type, inactive duplicates of active records, and dictionary entries repeated within a category. Each line links to the record. The backfill refuses to assign the same matching identifier twice and lists the conflicts instead. **Merging duplicates** (keep one record, re-point its uses, keep the other's names as aliases) is its own slice, scheduled before P4, since the L&O Deferred list already names it the highest-value follow-up.
- **FR-6.9** **Distro migration guide.** For each maintained distro (Indonesia, Madagascar, Côte d'Ivoire, PNG), a guide covering what moves from Liquibase contexts and classpath files into its packs, the deprecation timeline for the `legacy-seed` path (announced one release ahead), and how to run the parity gate on the distro.

### FR-7 Site setup workbook
- **FR-7.1** One Excel workbook (.xlsx) per download, with a sheet per area, an Instructions sheet and an Examples sheet. Apache POI with OOXML is already a dependency.
- **FR-7.2** Drop-down lists for every linked value, referencing the workbook's own sheets, so a value added on one sheet can be used on another in the same workbook.
- **FR-7.3** Every text-like column is formatted as Text (codes keep leading zeros, phone numbers starting with "+" stay text, "1-2" stays text); dates as dates. The Preview warns on values that look converted by a spreadsheet.
- **FR-7.4** A hidden canonical header row carries the column identity; visible headers are translated labels the user may rename without effect. CSV keeps canonical English headers.
- **FR-7.5** Hidden, locked columns carry the matching identifier, the row signature and the export time (4.8 R-6, R-7).
- **FR-7.6** Central fields are shaded and marked in the workbook so the user sees before uploading which changes a central update will overwrite (4.7).
- **FR-7.7** "Download with problems" returns the user's own workbook, rows in original order and values untouched, with Import status and Import message columns added at the left.
- **FR-7.8** Downloads are pre-filled with current data by default; a blank template is the secondary option.
- **FR-7.9** Uploaded files are read defensively: size limit (50 MB), no macros or external links executed, compressed-size and entity-expansion limits on `.xlsx` (zip bomb and XXE protection in the POI reader), formulas read as their stored values, never evaluated.

### FR-8 i18n (required, not deferred)
- **FR-8.1** Every domain with a user-visible label accepts `localization:xx`, including result-component labels, reflex-rule notes, roles, EQA and sample-handling instructions. Organization names in other languages stay deferred, as L&O decided.
- **FR-8.2** Shipped pack rows use message keys per OGC-1507; distro rows may use `localization:xx`.
- **FR-8.3** Export writes every active locale; the workbook's sheet names, labels, instructions and messages follow the user's interface language.

### FR-9 Setup checklist
- **FR-9.1** A **Set up this lab** page lists the steps in order (starting content, lab units and sample types, tests and results, facilities and wards, providers, analyzers, site settings), each with a status (Not started, Needs attention, Done) and counts, linking to its import.
- **FR-9.2** It opens by itself for a user holding `reference_data:import` or `organization:import` only when the catalog and organization lists are both empty; otherwise it is reached from the Admin menu. It is dismissible and never opens on an upgraded system.
- **FR-9.3** It shows **Ready for first order** when there is at least one active lab unit, sample type, orderable test with a sample type, and referring site.

### FR-10 Readiness for central management
- **FR-10.1** Every source writes through the pipeline (4.6).
- **FR-10.2** A national pack (a workbook or CSV set with a manifest naming its publisher and version) is the interim central source; loading it marks its records as from that publisher.
- **FR-10.3** A site can switch an area's source from the national pack to a subscription; records match by identifier with no creates.
- **FR-10.4** Export can produce a site's data as a pack, so a well-configured site (for example a national reference lab) can seed the central catalog.
- **FR-10.5** The identifier systems used in packs are the identifiers the FHIR resources carry, recorded in the OpenELIS FHIR IG.
- **FR-10.6** **Release notes.** A pack carries release notes (what was added, changed and dropped, in plain words, per language). A site loading a new version sees them above the Preview ("What's new in PNG national test list, version 4").
- **FR-10.7** **Pack comparison.** Any two versions of a pack, or a pack and a site's current data, can be compared with the FR-4.5 compare view. This is the central manager's tool for checking a new version before sending it, until a central server exists.
- **FR-10.8** **Local settings report.** A site can export its local settings on centrally sourced records (what it changed, deactivated or added) as a file the central manager can read, so the national list can learn from what sites do. Sending it is the site's choice; nothing is sent automatically.
- **FR-10.9** **Change requests** from a site to the central manager are out of OpenELIS in this pass; the "Managed by {publisher}" explanation shows the publisher's contact from the pack manifest.

---

## 6. System-required rows (stay in Liquibase)

Read by literal name or id in Java. They stay Liquibase-owned until the code reads them by a stable identifier or enum. Examples, not exhaustive:

| Table | Examples | Where read |
|---|---|---|
| dictionary_category | CG, HL, Test Result, HIVResult, resultRejectionReasons, specimen reception condition, REC_STATUS, programs, providerTitle, QAChecklistItem, SampleAcceptanceItem_*, Facility category/ownership, EQA Report Comment, BarCodeType, pathology/IHC/cytology lists, vector lists | `DisplayListService.java:185-294`, `ObservationHistoryList.java:42-65`, service constants |
| dictionary entries by text | 26 call sites (e.g. `SampleEntryByProjectController.java:375-638`, `IndicatorHIV.java:80-126`) | |
| type_of_sample | Variable, DBS, Whole Blood, CI form types | `TestServiceImpl.java:89`, `AnalyzerResultsAcceptServiceImpl.java:1386`, `OclToOpenElisMapper.java:719` |
| test / test_section | VL tests, CD4, Viral Load, DNA PCR; sections user, Immunohistochemistry, TB, Hematology | `TestIdentityService.java:51-60`, `DisplayListService.java:906` |
| organization_type | referring clinic, dept, referralLab, Health Region, Health District, patient referral | `TableIdService.java:96,99`, `DisplayListService.java:844` |
| patient_identity_type | GUID, SUBJECT, NATIONAL, ST, AKA, MOTHER | `PatientServiceImpl.java:107-132` |
| roles | Constants.ROLE_*, Results modifier, Admin | `Constants.java:15-25` |
| site_information | ~200 `Property` enum names | `ConfigurationProperties.java` |
| status_of_sample, reference_tables, observation_history_type, system modules/URLs, menus | | `StatusService.java`, `ObservationHistoryServiceImpl.java:27-60` |

**Follow-on (not this pass):** a code-hardening epic that replaces name lookups with identifiers or enums. Lists tied to retired programmes (Haiti, ARV/EID forms, RetroCI) move to their distros.

---

## 7. Roadmap and slice FRSs

| Phase | Scope | Slice FRS | Exit criterion |
|---|---|---|---|
| **P0 Now** | Fix OGC-1509 to OGC-1512 and the OGC-1420 import items; freeze new seed DML (FR-6.1) as policy now, CI check soon after; refresh the catalog CSV skill and READMEs | none (bugs) | No new reference DML merged after the freeze date |
| **P1a Pipeline completeness** | FR-1 (dictionaries, test-results, parser, caches, checksums, per-run state, performance), FR-5.1, FR-5.2, FR-4.1 and FR-4.4 for catalog areas, FR-8.1 gaps, **FR-6.8 readiness report**, then **FR-3.1 matching identifiers**, 4.6 Preview-equals-Apply, 4.10 sense checks and 4.12 dependency counts in the engine | Pipeline FRS (engine; light UI) | A full catalog, including new answers and coded results, loads from the import page with Preview; Preview and Apply counts agree on every QA file; an unedited export round-trips with no changes; no deployment gets a matching identifier twice |
| **P1b Import Review** | 4.8 rules R-1 to R-11 on screen, sense-check warnings, guarded changes (4.11), impact check (4.12), grouped decisions, Replace scope per record, Undo with its limits, run history, compare only (FR-4.5); on Organizations first, then the catalog page | **Import Review FRS** (v0.4; Organizations and catalog areas, RD-22) | The OGC-1420 and OGC-1466 tripwires pass, and a site lead completes a 300-row organizations update unaided in a usability test |
| **Research (before P2)** | Five to eight conversations with site leads and national managers (PNG, Indonesia, one French-speaking site) on where their lists come from today (Excel, DHIS2, a national facility list, a vendor's LIS export) and how they share updates | Research brief | The workbook and pack design (P2) is confirmed or changed by what they do now |
| **P2 Workbook, layers, central records** | FR-7 (including FR-7.9 hardening), FR-2, FR-3.2 to 3.4, 4.7, FR-10.2, FR-10.4, FR-10.6 to FR-10.9, Reference Data page; address hierarchy to modern engine | Workbook & Reference Data FRS | A national pack plus site additions load together; local settings survive a pack update; a copied workbook row cannot overwrite another; a site sees the release notes of the version it loads |
| **Merge duplicates (before P4)** | Keep one record, re-point its uses, keep the other's names as aliases; organizations first, then tests and answers | Merge Duplicates FRS | Every readiness-report duplicate on one national deployment is resolvable without a database script |
| **P3 New domains** | Providers, organization types, micro organisms, antibiotics, AST panels, breakpoints re-homed, each with workbook sheets and the Import Review | one FRS per area, or added to the owning feature's FRS (M-01, M-02, Providers) | A fresh site, including micro, is configured entirely from the workbook and packs |
| **P4 Seed retirement** | FR-6.2 to 6.7 and FR-6.9 distro guides, remaining legacy domains, the section 3.6 data as each owning spec ships, analyzer instance and mapping and QC export and import, FR-9 checklist | Seed Retirement plan (engineering) and Setup Checklist FRS | Fresh install runs no reference DML; parity gate clean; one national deployment upgraded with no unintended creates; each maintained distro has run the parity gate |
| **P5 FHIR subscription (future)** | Subscription adapter (OGC-1044), FR-10.3, OCL behind the pipeline | Catalog Subscription FRS (update the existing design) | A site switches from national pack to subscription with no creates; a central update and a site upload use the same Preview and decisions |

**Sequencing notes.**
- P1a and P1b are each valuable alone; PNG and training deployments load through these screens today.
- FR-3.1 is the one piece of central readiness that cannot wait: sites configured without matching identifiers will have to be matched by name when the subscription arrives.
- P2 must land before P4: without layering, shipping core as CSV makes "the first upload hides base files" worse.
- The readiness report runs before identifiers are assigned, so that identifiers are never frozen onto duplicates; merging can follow, since the backfill refuses duplicates rather than guessing.
- Change control (prepared by, approved by) is not in any phase (RD-17).
- Placement of requirements not named in the table: FR-4.2 export everything, P2; FR-4.3 localization columns in P1a, hidden identifier and row-signature columns in P2 (so R-6's row-signature check and R-7 arrive with the workbook in P2); FR-5.6 methods, P4; FR-8.2 shipped-row message keys, P4 with pack extraction; FR-8.3 export locales in P1a, workbook language in P2; FR-10.1 every source through the pipeline, P1a for uploads and files, each later source as it arrives; FR-10.5 identifier systems in the FHIR IG, P2.

---

## 8. Architecture-level acceptance criteria

1. Preview and Apply report identical counts for every file in the QA import suites (OGC-1466 TC-CX-IM-04 and the L&O suite).
2. After a Preview, every reference-data table and the decision queue are identical to before it; only the run, its row results and answers are added.
3. A blank cell never changes a stored value in any domain; `(clear)` clears it; no import deletes a domain record.
4. An unedited export of any modern-engine domain, re-imported in Replace mode, gives no new, updated or deactivated records.
5. With a core pack and a distro pack that changes one test's name, both load, the test shows the distro's name, and no shipped file is hidden.
6. A pack version that drops a test proposes its deactivation in the Preview and never deactivates a test the site created.
7. A local-settings field (RD-9) the site set survives a newer pack version that changes it; the conflict is asked once and not again until the pack's value changes again.
8. A fresh install built from the slim baseline and packs matches a legacy-seed install in every configurable table (parity gate).
9. Switching an area's source from a national pack to a subscription creates no records.
10. A file setting a normal range low limit above its high limit is Rejected; a file whose new glucose range is 18 times the range it replaces applies only after its warning is ticked.
11. A file changing the unit of a test with results puts the row under Needs your answer with the result count and no answer preselected; choosing **Create a new version of this test** creates the new test and leaves the old test with its results, active and not orderable; **Same measurement, only the label changes** is offered for mg/dl to mg/dL and not for mg/dL to mmol/L. A ranges file that drops the child bands of a test that had them shows the range-coverage warning.
12. A test about to be deactivated that is mapped on an analyzer, used in a panel and named in a reflex rule lists all three by name in the Preview.
13. An exported cell beginning with `=` opens in Excel as text, and re-importing the file leaves the value unchanged.
14. Running FR-6.8 on a deployment where two organizations share a code lists both, and the identifier backfill gives neither the shared code as a matching identifier.
15. A user with `provider:manage` but not `provider:export` cannot download providers; every provider export appears in the export log.

---

## 9. Success measures
- Configurable tables seeded by Liquibase DML on a fresh install: from ~830 changesets to 0.
- Domains passing all four goal tests: from 0 to every domain in Section 3 not marked "stays".
- Round-trip export and import on a production snapshot: no creates, updates or rejections.
- Time for a site setup lead to stand up a new site's metadata: measured in PNG and training deployments before and after P1b.
- Share of first uploads that apply without help from an implementer (usability target: 4 of 5 participants).

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Later changesets find parents by name with `onFail=MARK_RAN`; a missing seed is skipped silently | Parity gate (FR-6.5) on every PR touching Liquibase or packs |
| Literal ids in seeds (`test_section_id=136`, `sys_user_id=1`, role ids 1 and 2) | Keep those parents in the slim baseline; flagged in extraction review |
| A pack update overwrites ministry or site settings | 4.4 and 4.7; never silent |
| Users answer hundreds of match questions (OGC-1420 1a) | R-10 common-word filter and 50-question cap; grouped answers in Import Review |
| Replace deactivates far more than intended (OGC-1420 2a) | R-4 per-record scope, default Add & update, Undo |
| Breakpoint licence not cleared | Breakpoint packs opt-in and not shipped until cleared |
| Two sources for one domain (vector trap types, sample-collection UOMs) | Remove the Liquibase copy when the pack lands |
| Start-up time for full catalog loads | Packs load only on version change; background job for Apply |
| Sites configured before matching identifiers exist | FR-3.1 in P1a; a one-time "match to national list" review when a site first loads a national pack |
| Undo after later edits | R-9 lists in-use records and others' changes and asks |
| A well-formed file that is clinically wrong (wrong-unit ranges, missing normal answer) | 4.10 sense checks, catalog-health gate reused |
| A unit or result-type change rewrites the meaning of past results | 4.11 guarded fields and "new version" path |
| Deactivating a test silently breaks analyzer mappings, reflex rules, panels or order routing | 4.12 impact check |
| Identifiers frozen onto duplicate records | FR-6.8 readiness report first; backfill refuses duplicates |
| An exported file runs a formula, or a crafted upload exhausts the server | FR-4.4, FR-7.9 |
| A provider export leaks personal data | `provider:export`, export log |
| New features keep adding data nobody can import | 4.13 design rule, `/analyze` HIGH |
| The workbook does not fit how site leads actually get their lists | Research before P2 |

---

## 11. Access (D-233 nominated privileges)

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Import, decide and undo organizations | **NEW** `organization:import` (defined by L&O) | Test catalog and reference data | Roles with `organization:manage` |
| Import, decide and undo test catalog areas (lab units, sample types, tests, results, ranges, panels, answers, units) | **NEW** `reference_data:import` | Test catalog and reference data | Roles with `test:configure` |
| Export any catalog area | **NEW** `reference_data:export` | Test catalog and reference data | Roles with `test:configure`. Organization export stays as L&O defines it; provider export is `provider:export` below |
| Import providers | `provider:manage` (existing) plus `reference_data:import` | Test catalog and reference data | As the two codes |
| Export providers (personal data: names, phone numbers, email addresses) | **NEW** `provider:export` | Test catalog and reference data | Roles with `provider:manage`. Kept separate because a provider list is personal data a lab may not want any catalog editor to download; every export is logged with who, when and the row count |
| Import micro reference data and breakpoints | `reference_data:import` | Test catalog and reference data | Roles with `test:configure` |
| Enable, disable or update packs; switch an area's source (FR-10.3) | **NEW** `reference_data:pack_manage` | Test catalog and reference data | Roles with `reference_data:import` |
| Run the readiness report (FR-6.8); export the local settings report (FR-10.8) | `reference_data:export` | Test catalog and reference data | As that code |
| See and use the setup checklist (FR-9) | `reference_data:import` or `organization:import` (each step shows only to holders of its area's code) | Test catalog and reference data | As those codes |

The `reference_data` category is new to Users and Roles Appendix A and maps to the **Test catalog and reference data** group (Coordination).

Every Preview, Apply and Undo is recorded in the run history (who, when, files, mode, counts). Until PR #3443 merges, the Admin role stands in for all of these.

---

## 12. Dependencies (new data, per MUST A)

Named data elements; storage shape is the engineer's call.

1. **Change set** per run: the rows read, their matched record, outcome, reason and field changes (extends `configuration_import_run`).
2. **Run snapshot**: the before-values of every record and child row an Apply changed, kept for Undo.
3. **Record source**: source type, pack or file, publisher, source version, and the fields set locally, per record.
4. **Matching identifiers** for every domain without one (system, value), with backfill.
5. **Pack manifest and installed packs**: title, publisher, version, domains, depends-on, enabled flag, locked fields.
6. **Workbook stamps**: export time and row signature per exported row.
7. **Remembered answers**: per record and field, the local value kept and the source value it was kept against (extends `reference_alias` for names).
8. **Run job state**: progress and status of a background Apply.
9. **Sense-check results** per run row (check, severity, message) and the warning acknowledgement (4.10).
10. **Guarded-field acknowledgement** per run row, and the link between an old test and its new version when "Create a new version" is chosen (4.11).
11. **Dependency counts** per record for the impact check (4.12), computed at Preview, not stored.
12. **Pack release notes and publisher contact** in the manifest (FR-10.6, FR-10.9).
13. **Export log** for personal-data exports (section 11).
14. **Readiness report** results per deployment (FR-6.8).
15. **Export filter stamp**: the list filters an export was made with, written as a `#` line and read back to limit Replace scope (R-4).
16. **Lab-set active status on registry and other central records**, kept beside the source's own status (4.7, P2).
17. **Setup checklist state**: dismissed by whom and when, and a flag that the system was upgraded rather than freshly installed (FR-9.2).
18. **Uploaded files kept with their run** until the run is purged, so a preview can be re-run and problems downloaded later.
19. **Idempotency of Apply** per run, and answers saved per answer (4.6).

Reused: `configuration_import_run`, `unresolved_reference`, `reference_alias` (OGC-1194), the L&O identifier table (D-107), record history (L&O FR-K1).

---

## 13. Coordination

- **Locations & Organizations (OGC-1363, OGC-1420):** first user of the Import Review. Changes that land in L&O: Undo an import moves from Deferred into the Import Review; clearing through import moves from Out of Scope to R-2; Replace scope becomes per record (R-4); the rename check uses R-10; outcome words unchanged.
- **Catalog import (OGC-1194, OGC-1466):** second user of the Import Review.
- **Document Library:** its `documents` and `document-versions` domains join the pipeline and the Import Review as specced.
- **M-01, M-02, M-06:** own their formats (organisms and antibiotics, breakpoints, expert rules); this roadmap re-homes their imports.
- **Catalog Subscription (OGC-1044):** becomes the P5 adapter; its field-level review is 4.4.
- **Admin Redesign:** Configuration stays the only editor for settings; the Reference Data page gets its place in the Admin IA.
- **D-216 possible-match check:** one routine for import and manual creation (R-10).
- **Facility registry (D-109):** 4.7 generalises it to every central source. One change to L&O FR-H2 and FR-H3, amending D-109 and made in the P2 Workbook & Reference Data FRS (not in the Import Review): active status on a registry record becomes a local setting, so the next registry sync no longer reactivates a record the lab deactivated (it shows the registry's status beside the lab's).
- **Locations & Organizations Replace scope (D-108):** per-record scope and the export filter stamp amend D-108; registered with this FRS.
- **Users and Roles Appendix A:** adds the `reference_data` category to the Test catalog and reference data group; `provider:export` joins the provider codes there.
- **Test Catalog Completion v2:** owns the completeness and catalog-health gate that 4.10 reuses; one set of checks for the editor and for imports.
- **Specs in section 3.6:** each adds its import area per 4.13 before handoff (Clinical Order Entry v4, QC Targets, Test Catalog Alerts, Methods, Reagent linkage, Label Presets, TAT model, Result Delivery, Microbiology v2).
- **Design skill:** 4.13 goes to the design addendum through `/constitution`.

---

## 14. Docs Impact

- Confluence configuration guide (page 1266122780): rewrite as packs and areas lands.
- User manual: "Import a test catalog from CSV" (OGC-1286 review) and "Admin: Import and export locations" (OGC-1468) change with the Import Review.
- `volume/configuration/README.md` and `docs/configuration/README.md`: correct the drift listed in the audit (either/or source precedence, checksum path, test-results transaction model).
- The `openelis-test-catalog-csv` skill: BOM is now handled; update as P1a lands.
- Distro migration guides (FR-6.9), one per maintained distro.
- Release notes convention for national packs (FR-10.6), in the configuration guide.

---

## 15. Decisions

| # | Question | Status |
|---|---|---|
| RD-1 | System-required rows stay in Liquibase (Section 6); separate code-hardening epic | Recommended, open |
| RD-2 | `clinical-starter` is a small generic catalog; Haiti, ARV/EID and RetroCI content moves to distros | Recommended, open |
| RD-3 | Source update vs local setting: queue, and remember the answer | Applied (4.4) |
| RD-4 | Providers with a Practitioner registry: registry wins, CSV for sites without one | Applied (FR-5.4), confirm |
| RD-5 | Analyzer profiles stay in the Bridge; OpenELIS exports and imports instances and mappings | Applied, confirm |
| RD-6 | Superseded by RD-15 | |
| RD-7 | Freeze date for new seed DML: next release branch cut | Recommended, open |
| RD-8 | Excel workbook primary for site leads, CSV for implementers | Applied (FR-7) |
| RD-9 | Local settings list: active at this site, sort order, local display name, analyzer link, site-specific reference ranges | Applied (4.7), confirm |
| RD-10 | Identifier systems: one per publisher (national publisher URL, site system), recorded in the FHIR IG | Applied (4.3), confirm |
| RD-11 | Undo scope: whole run | Applied (R-9) |
| RD-12 | Central sources: explain, don't lock; locking only per pack | **Applied as recommended, provisional** |
| RD-13 | Undo an import in scope now, first on Organizations | **Applied as recommended, provisional** |
| RD-14 | `(clear)` keyword allowed | **Applied as recommended, provisional** |
| RD-15 | Shared Import Review component on each area page; central page for workbook and packs | **Applied as recommended, provisional** |
| RD-16 | This document is architecture and roadmap; one FRS per slice | **Applied as recommended, provisional** |
| RD-17 | Change control (prepared by, approved by, linked SOP version) before Apply | **Deferred for this pass** (Casey, 19 Oct: too heavy). Run history keeps who applied what and when (D-112 holds) |
| RD-18 | Effective-dated reference data | Not in this pass; guarded fields and the new-version path (4.11) instead. Recommended, open |
| RD-19 | Every FRS that adds reference data declares its import area (4.13) | Applied (Casey, 19 Oct: yes to the other fixes); to the design addendum |
| RD-20 | Rows changed after the preview wait in a Changed since preview decision; the rest applies | **Decided** (Casey, 19 Oct) |
| RD-21 | A later import does not block undoing an earlier one; overlapping values are shown, Keep the later value preselected | **Decided** (Casey, 19 Oct) |
| RD-22 | The catalog half of the Import Review is specified in the Import Review FRS itself | **Decided** (Casey, 19 Oct) |
| RD-23 | Keep the mode name "Replace", with always-visible help, a translator note and the under-a-quarter prompt | **Decided** (Casey, 19 Oct) |
| RD-24 | A unit or result-type change on a test with results is a decision with **Create a new version** recommended; a relabel only between equivalent UCUM units; unanswered rows wait (4.11) | **Decided** (Casey, 20 Oct) |
| RD-25 | The Import Review leads with a **Before you apply** panel and collapsible sections with one Show filter, replacing the outcome tiles; no in-page tabs; warnings checked in place | **Decided** (Casey, 20 Oct, critique Z-3, Z-5) |
| RD-26 | **Discard this preview** ends an open preview without applying; the run is kept as Discarded | **Decided** (Casey, 20 Oct, critique Z-16) |

**Ledger mapping.** These are document-local IDs. When registered, RD-12 to RD-26 that are decided, plus the amendments to D-108 (per-record and filtered Replace scope) and D-109 (lab-set active status on registry records), take the next free ledger IDs. Main now carries D-001 to D-249 (next free D-250), and the AMR v3 set waiting in `upload/` holds D-250 to D-295, so these start at D-296 if that set lands first; check main's highest ID at registration. D-233 amends D-006. Spec registry: rows for Reference Data as Configuration (v0.6) and Import Review (v0.4) are added at registration.

---

## Appendix A. Evidence pointers (develop `f72854e`)
- Loader: `configuration/service/ConfigurationInitializationService.java` (either/or source precedence :195-254; checksums :190, :318, :332), `CatalogImportServiceImpl.java:49-55` (importable = `supportsDryRun`), `AbstractCatalogCsvHandler.java`, `RowTransactionRunner.java`, `common/util/CsvParsingUtil.java:40-53` (BOM and Windows-1252).
- Result limits replace semantics: `resultlimit/service/ResultLimitServiceImpl.java:185-192`.
- Organizations import and export: `organization/locations/LocationsImportServiceImpl.java`, `LocationsImportRestController.java:70-120`; shipped review screen `frontend/src/components/admin/locations/ImportExportView.jsx:393-575`.
- Breakpoint upload: `microbiology/service/MicroBreakpointImportServiceImpl.java:37-40`; micro tables created empty in `liquibase/3.5.x.x/051-microbiology-reference-foundations.xml`.
- Providers: `provider/service/ProviderImportServiceImpl.java:36-85` (deactivation commented out at :67).
- Analyzer legacy tables dropped: `liquibase/3.5.x.x/116-remove-pre-bridge-analyzer-storage.xml`.
- Baseline dump: `db/dbInit/OpenELIS-Global.sql`.
- Liquibase contexts: `liquibase/LiquibaseConfig.java:16`; `ci_*` contexts in 2.1, 2.6, 2.7.

## Appendix B. Legacy-engine domains and the defects to fix when they move
| Domain | Defect |
|---|---|
| dictionaries | File-wide transaction; blank `isActive` reactivates; not uploadable |
| test-results | File-wide transaction; log-only; prefix fan-out to `Name(` variants; name-only dictionary fallback can bind the wrong entry |
| site-information | Blank optional cells overwrite; `encrypted=Y` parses as false; `#` lines load as data |
| roles | Cannot create (OGC-1510); blank resets flags; no permissions |
| address hierarchy values | Insert-only; inactive areas duplicated on re-import; header-created types get no level |
| observation-history-types | Create-only; localization rows orphaned |
| compliance standards | Blank `isPreSeeded` removes delete protection; localization ignored |
| NCE types / categories | File-wide transaction; locale prefix case-sensitive |
| vector species / trap types | File-wide transaction; duplicate Liquibase source |
| EQA programs | Bad `schemeType` drops the row with only a log line |
| locales | Every row without `isFallback=Y` clears the fallback |
| OCL zip | No Preview; tests land in a default section and sample type |
