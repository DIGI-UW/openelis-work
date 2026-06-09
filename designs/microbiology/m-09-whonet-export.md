# M-09 WHONET Export — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Microbiology → WHONET Export + Admin → WHONET Mapping
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec implements the WHONET surveillance export. It builds on the substantive design review in `whonet-export-design-review-v1.md` — that doc enumerates the column set, dedup algorithm, validation rules, and file format details. This FRS formalizes those into spec form aligned with the M-* bundle structure.

GLASS direct submission is **out of scope** per single-tenancy constraints (M-00 §7). OpenELIS exports WHONET files; central aggregation happens outside OE.

> This FRS is self-contained. There is no separate addendum — every decision from the design review (dedup-parameter helper text; "Map now" deep-link pre-filtered to the unmapped item; lab-profile "first export" scope; AST-worklist quick-action filter contract; Phase-1B surfacing) is written inline below.

> **Phase note.** Export-to-WHONET is a **Phase 1B** capability. In Phase 1A the AST-worklist "Export to WHONET" quick action and the Reports → WHONET Export entry are **surfaced but disabled**, with a "coming in Phase 1B" tooltip (matches M-07 §4.5 / AC-M07-08). The full generator described here activates in 1B.

---

## 0. Design goal — least operator effort ("painless WHONET")

Surveillance export is a chore labs skip when it's painful. The design target is that a routine export costs **three clicks and zero decisions**, and that the upfront mapping burden is **near-zero out of the box**. Six levers, each reuse-first:

### 0.1 Reuse the WHONET export that already exists (verified in code)
OpenELIS-Global **already ships a WHONET export**: `WHONetReportService` / `WHONETCSVRoutineColumnBuilder` / `WHONETExportRoutineByDate`, reached from the live **Reports → WHONET Export** menu (`menu_reports_whonet_export`), building rows off `Sample`/**`SampleItem`** by date range. **M-09 extends this seam — it does not build a parallel generator.** What exists today is a rudimentary precursor: a flat **long-format** dump (one row per antibiotic result; columns NATIONAL_ID, …, SPECIMEN_TYPE, ANTIBIOTIC, ORGANISM, RESULT, TEST_METHOD, GPS) with organism/antibiotic as **names, no WHONET code mapping, no first-isolate dedup, no isolate-wide pivot, no phenotype/profile/TB**. M-09's job is to upgrade that builder to true WHONET output; the **query, CSV plumbing, and menu entry are reused**, and the existing `SampleItem` keying matches M-04 §2A. (Reframes §3/§5/§6 as extensions of `WHONetReportService`; see §11.)

### 0.2 Kill the mapping chore — most of it is already mapped elsewhere
Mapping vocabularies by hand is the single biggest pain and the usual reason exports stall. But most of the mapping **already exists** and should be read, not rebuilt:
- **Antibiotic + breakpoint-standard WHONET codes already live in the Test Catalog.** The v2.5 AMR flag carries the **WHONET antibiotic code, class, breakpoint standard, and disk potency in `test_amr_config`** (OGC-748). M-09 **reads these through** — it does **not** maintain a separate Antibiotics mapping. (So the M-09 mapping admin shrinks to the vocabularies the catalog doesn't cover — see §2.) Where the catalog is the source, the M-09 "Antibiotics" / "Breakpoint Standards" views are **read-through with an "edit in Test Catalog" deep-link**, not an editable parallel store.
- **Ship WHONET organism/specimen/origin codes in the M-01 seed data** from a bundled **WHONET dictionary** reference pack, so the common catalog is already mapped on install — the operator never maps *Escherichia coli*.
- **Suggestions are a deterministic lookup, not a matcher we build (keep the lift small).** For the residue that isn't pre-seeded, a suggestion is produced by, in order: **(a)** exact match on **normalized name** (lowercase, trim, strip punctuation/qualifiers) between the OE entity and the bundled WHONET dictionary; **(b)** a **join on a shared terminology code** the entity already carries — SNOMED/LOINC via the existing **OCL/CIEL** link, since the WHONET dictionary crosswalks to those. Both are plain dictionary lookups against the bundled pack — **no fuzzy/ML matching in MVP**. Anything that matches neither has **no suggestion** and falls to manual mapping. Because a human **confirms every suggestion before it is applied**, a wrong-but-exact name collision is caught at confirm time — there's no correctness risk and nothing to "train."
- Surfaced as **bulk "confirm suggested mappings"** (accept-all / per-row) rather than per-row data entry.
- **The real lift is the bundled WHONET dictionary pack + keeping it current** (the **M-10 Hub** refreshes it and fills new entries) — not matching logic. *Optional later:* fuzzy/token-similarity suggestions for near-miss names, explicitly out of MVP scope.
- Net effect: the operator confirms a short list and manually maps only genuinely local/custom items in a few non-catalog vocabularies — a handful, not hundreds.

> **Open reconciliation (flag, do not silently restructure).** In OpenELIS an antibiotic susceptibility *is a Test*, so its WHONET code naturally lives on `test_amr_config` (Test Catalog), which **overlaps with M-01's proposed `antibiotic_master.whonet_code`**. Source of truth should be **one** of them — recommend the Test Catalog AMR config (where the lab already configures the test), with M-01/M-09 reading it. Resolve before build; M-01's antibiotic-master mapping may collapse into a read-through. (Organisms still need the M-01 `organism_master` code, since an organism is not a Test.)

### 0.3 Surface readiness against the right denominator — what you're actually exporting
The readiness number is only meaningful against a **target set**, and the target is **not** the whole master (labs carry hundreds of organisms they never report). The denominator is the **distinct codes that actually appear in the results in scope to export** — the organisms on finalized isolates, the antibiotics with AST results, the specimen types, origins, and phenotypes present in the cases for the selected period (or the unexported backlog). So readiness reads, e.g., *"of the 47 organisms you reported this period, 45 are WHONET-mapped — 2 isolates would be dropped"* — computed from real data (`SELECT DISTINCT organism_id FROM micro_isolate` on finalized cases in range, etc.), answering the only question that matters: **will the export drop anything?** A secondary "whole active catalog" coverage figure is an optional forward-looking view; the **used-set** figure is the actionable one and the one the export preview already needs to compute. Surfaced on the WHONET Mapping landing and as a small management-dashboard tile (reuse), so unmapped items are handled proactively, not discovered mid-export.

### 0.4 One-click happy path — sensible defaults, advanced hidden
The dedup block (§3.1, six surveillance-statistics controls) **collapses to a single line** — *"First-isolate de-duplication: WHO GLASS standard (7-day)"* — behind an **"Adjust (advanced)"** disclosure. Date range defaults to **Last Month**; filters default to **all clinically-significant**. The routine path is **open → Preview → Generate**, no parameter decisions. The six controls and their helper text (§3.1) remain, just not in the operator's face.

### 0.5 Configure-once, then unattended (the real endgame)
The genuinely painless steady state is **scheduled auto-delivery** (§7): set destination + monthly cadence + a saved filter once, and it runs and delivers (SFTP/email) with **no operator action**, pinging someone only on failure or when new unmapped items appear. Reuse OpenELIS's existing scheduled-job mechanism if present (verify — see §11); otherwise a scheduled task. This turns the monthly chore into an exception-only notification.

### 0.6 Where a consolidated FHIR server exists, the lab does almost nothing (M-15)
The least-effort path of all: on a deployment wired to the consolidated FHIR server, results flow out as **FHIR (M-15)** and the **central server performs the WHONET code mapping + cross-lab aggregation + GLASS generation** — so the lab does **no per-lab WHONET mapping and no file handling**. The WHONET file path here is the **fallback** for labs / NCCs without that server. Effort ranking: **FHIR push (M-15) < scheduled file (§0.5) < manual file (§3)**. Pick the lowest a deployment can support.

> **Net:** out of the box the catalog is mostly pre-mapped (§0.2); readiness keeps it that way (§0.3); a routine run is three clicks (§0.4); a configured lab runs unattended (§0.5); a FHIR-connected lab barely touches it (§0.6) — all extending the export already in the codebase (§0.1).

---

## 1. Overview

### 1.1 Purpose

Generate WHONET-format CSV/TXT files from finalized Cases for submission to the country's national reference lab (which aggregates from multiple labs and produces the country's GLASS submission). Plus the admin surface for code mapping (organism, antibiotic, specimen, origin, patient type, phenotype) to WHONET codes.

### 1.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| WHONET Export Generator | `/reports/whonet-export` | Reports → WHONET Export |
| WHONET Mapping admin | `/admin/whonet-mapping` | Admin → WHONET Mapping |
| Export run history / audit | `/reports/whonet-export/history` | (sub-page) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Surveillance Officer | Generate exports; manage code mappings |
| Lab Manager | All of the above; configure scheduled exports |
| Microbiology Supervisor | Generate exports; view mappings |
| System Administrator | All actions |

### 1.4 Integration

- **M-04 Case Workbench Core** — read source. Reads finalized `micro_case` + `micro_isolate` + `micro_ast_run` data.
- **M-05 AST Entry & Interpretation** — `result` rows with AST data and overrides.
- **M-01 AMR Reference Data** — organism/antibiotic/specimen/origin WHONET codes.
- **M-02 Breakpoint Catalog** — breakpoint standard codes for the export column.
- **M-06 Expert Rules Engine** — phenotype flags populate phenotype columns.
- **M-07 Worklists** — the AST Worklist "Export to WHONET" quick action invokes M-09 with filters pre-populated (Phase 1B; disabled in 1A). The route + param contract is defined in §1.5.
- **M-10 Hub Subscription** — provides code updates.
- **M-14 Mycobacteriology / TB** — source of TB species ID, phenotypic DST (R/S by WHO critical concentration), and molecular resistance flags (Xpert MTB/RIF, LPA) for the WHONET TB export (§4.5).

### 1.5 AST-Worklist quick-action contract

The AST-Worklist "Export to WHONET" quick action (M-07 §4.5) is a deep-link into the Export Generator with filters pre-populated, so an operator viewing a filtered AST list can carry that scope straight into an export:

- **Route:** `/reports/whonet-export`
- **Query params:**
  - `from`, `to` — date range (ISO `YYYY-MM-DD`); derived from the worklist's active date scope, else defaults to "This Month".
  - `specimen` — repeatable specimen-type code(s) matching the worklist filter (omitted = all).
  - `origin` — repeatable patient-origin code(s) (omitted = all).
  - `organism` — repeatable organism id(s) when the worklist is filtered to specific organisms (omitted = all organisms).
  - `significance` — `SIGNIFICANT` (default) | `NOT_SIGNIFICANT` | `CONTAMINANT`, repeatable.
  - `source=ast-worklist` — provenance marker so the generator can show a "pre-filled from AST Worklist" note and a "clear filters" reset.
- On arrival the generator populates the filter controls (§3.1) from these params; the operator can edit any of them before Preview/Generate. In Phase 1A the action renders disabled with the "coming in Phase 1B" tooltip and does not navigate.

---

## 2. WHONET Mapping admin

### 2.1 Purpose

Code Mapping ensures every organism, antibiotic, specimen type, patient origin, department, breakpoint standard, and phenotype flag in the lab's data has a WHONET equivalent code before export. Unmapped items get warned about in the export preview.

### 2.2 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / WHONET Mapping                                                       │
│                                                                              │
│ WHONET Code Mapping                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tabs: [Organisms] [Antibiotics] [Specimens] [Origins]                        │
│       [Patient Types] [Departments] [Breakpoints] [Phenotypes]              │
├─────────────────────────────────────────────────────────────────────────────┤
│ (selected tab content)                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note on tabs vs. sidenav:** Per `feedback_openelis_sidenav_submenus`, multi-view admin pages should use sidenav submenus, not in-page Carbon Tabs. M-09 admin lists each of the 8 vocabularies as a sidenav sub-item under "WHONET Mapping" rather than tabs.

Corrected sidenav:

```
Admin
└── WHONET Mapping
    ├── Organisms
    ├── Antibiotics
    ├── Specimens
    ├── Origins
    ├── Patient Types
    ├── Departments
    ├── Breakpoint Standards
    └── Phenotypes
```

### 2.3 Per-vocabulary list view

Each sub-page is a `DataTable` showing OE entity → WHONET code mapping:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / WHONET Mapping / Organisms                          [Import Hub]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All ▼]  ☐ Show unmapped only                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ OpenELIS Organism          │ WHONET Code │ WHONET Name              │ ⋮     │
├────────────────────────────┼─────────────┼──────────────────────────┼───────┤
│ Escherichia coli           │ eco         │ Escherichia coli         │ ⋮     │
│ Klebsiella pneumoniae      │ kpn         │ Klebsiella pneumoniae    │ ⋮     │
│ Staphylococcus aureus      │ sau         │ Staphylococcus aureus    │ ⋮     │
│ Local Organism XYZ         │ —           │ — (unmapped)             │ ⋮ Map │
├────────────────────────────┴─────────────┴──────────────────────────┴───────┤
│ ⚠ 1 organism(s) not mapped. These will be excluded from WHONET exports     │
│   unless mapped.                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

Row actions: Edit Mapping · Clear Mapping. "Map" appears as a quick-action button on unmapped rows.

### 2.4 "Map now" deep-link from the export preview

When the export preview (§3.2) warns about an unmapped item, clicking **"Map now"** must open the WHONET Mapping admin **pre-filtered to that exact item** — not a blank search. The deep-link encodes the vocabulary and the specific item:

- **Route:** `/admin/whonet-mapping/{vocabulary}` (e.g., `organisms`, `antibiotics`, `specimens`, `origins`, `patient-types`, `departments`, `breakpoint-standards`, `phenotypes`).
- **Query params:** `focus={oe_entity_id}` and `unmappedOnly=true`. On arrival the list scrolls to and highlights the focused row with its Map editor expanded, and the "Show unmapped only" filter is pre-checked so the operator lands directly on the row that blocked the export.
- After mapping, a "Back to export preview" affordance returns the operator to the in-progress export (the preview re-runs validation so the warning clears).

### 2.5 Eight coded vocabularies

| Vocabulary | OE source | WHONET code | Notes |
|------------|-----------|-------------|-------|
**M-09 owns the mapping only for the vocabularies the Test Catalog does not already carry.** Antibiotics and Breakpoint Standards are **sourced read-through from the Test Catalog AMR config** (`test_amr_config`, OGC-748) — M-09 shows them with an "edit in Test Catalog" deep-link, not an editable parallel store.

| Vocabulary | Owner / source | WHONET code | Notes |
|------------|----------------|-------------|-------|
| Organisms | `organism_master` (M-01) | `whonet_code` field | M-09-owned mapping; an organism is not a Test. Per M-01 §2.4; 3-5 lowercase char |
| **Antibiotics** | **Test Catalog AMR config (`test_amr_config`, OGC-748)** | WHONET antibiotic code (already there) | **Read-through, not re-mapped here** — an antibiotic *is* a Test; edit in Test Catalog. (See §0.2 reconciliation re: M-01 `antibiotic_master`.) |
| Specimens | existing OE sample type vocab | new `whonet_code` field | M-09-owned. E.g., `bl` (blood), `ur` (urine) — per M-01 §6.1 |
| Origins | (new) `patient_origin` | new `whonet_code` field | M-09-owned. INP / OUT / ICU / EME / LTC / UNK per M-01 §6.2 |
| Patient Types | (new) `patient_type` (small enum) | `whonet_code` field | M-09-owned. Adult / Pediatric / Neonate / Unknown |
| Departments | existing OE department vocab | new `whonet_code` field | M-09-owned. Per M-01 §6.3 |
| **Breakpoint Standards** | **Test Catalog AMR config / `breakpoint_standard` (M-02)** | `whonet_label` | **Read-through** from the catalog/M-02; e.g., `CLSI24`, `EUCAST14`, `WHO_TB_2023` |
| Phenotypes | (new) `phenotype_flag_definition` (small fixed set) | `whonet_column` field | M-09-owned. Maps OE phenotype names to WHONET column names: ESBL_SCREEN, MRSA, VRE, CRE, CARBAPENEMASE, MDR, XDR, PDR |

### 2.6 Import from Hub

When M-10 Hub Subscription ships, the "Import Hub" button pulls the latest official code lists and merges with the local mapping. Local edits are preserved; new entries from Hub are added.

---

## 3. WHONET Export Generator

### 3.1 Layout

`/reports/whonet-export`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Reports / WHONET Export                                                      │
│                                                                              │
│ WHONET Export Generator                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ═══════ DATE RANGE ═══════                                                  │
│                                                                              │
│  Start Date: *  ┌──────────────────┐    End Date: *  ┌──────────────────┐   │
│                 │ 2026-04-01    📅 │                  │ 2026-04-30    📅 │   │
│                 └──────────────────┘                  └──────────────────┘   │
│                                                                              │
│  Quick: [This Month] [Last Month] [This Quarter] [Custom]                   │
│                                                                              │
│  ═══════ FILTERS ═══════                                                     │
│                                                                              │
│  Specimen Types:                            Organisms:                       │
│  ☑ Blood        ☑ Urine                     (•) All organisms                │
│  ☑ Respiratory  ☑ Wound                     ( ) Select specific...           │
│  ☑ CSF          ☐ Stool                                                      │
│                                                                              │
│  Patient Origins:                                                            │
│  ☑ Inpatient   ☑ Outpatient   ☑ ICU   ☐ Emergency   ☐ Long-term Care        │
│                                                                              │
│  Significance:                                                               │
│  ☑ Clinically Significant   ☐ Not Significant   ☐ Probable Contaminant      │
│                                                                              │
│  ☐ Include screening / surveillance cultures                                │
│                                                                              │
│  ═══════ DEDUPLICATION ═══════                                               │
│                                                                              │
│  Apply first-isolate dedup: ☑                                               │
│  └─ Window length: [7 days ▼]   (options: 7, 14, 30, episode-based)        │
│     ⓘ How long after the first isolate repeats are collapsed. WHO GLASS     │
│        default is 7 days; longer windows count fewer repeats as new.        │
│  └─ Window basis: (•) Collection date   ( ) Result release date            │
│     ⓘ Which date starts the window — when the specimen was collected        │
│        (recommended) or when the result was released.                       │
│  └─ Scope: (•) Any source   ( ) Same source only                            │
│     ⓘ "Any source" counts one isolate per patient+organism across all       │
│        specimen types; "Same source only" dedups within each source.        │
│  └─ Significance handling: (•) Exclude probable contaminants first          │
│     ⓘ Drops likely contaminants before choosing the first isolate, so a     │
│        contaminant doesn't become the representative result.                │
│  └─ Repeat row handling: (•) Drop repeats   ( ) Include with R marker      │
│     ⓘ Whether collapsed repeats are removed entirely or kept and flagged    │
│        as repeats (FIRST_OR_REPEAT = R) for the aggregator.                 │
│  └─ Susceptibility profile: (•) Insensitive   ( ) Sensitive                │
│     ⓘ "Sensitive" treats a changed S/I/R profile as a new isolate even      │
│        within the window; "Insensitive" ignores profile changes.           │
│                                                                              │
│  ═══════ OUTPUT ═══════                                                      │
│                                                                              │
│  Format: (•) WHONET CSV   ( ) WHONET TXT   ( ) Custom delimited             │
│                                                                              │
│  ☑ Include intermediate (I) results                                         │
│  ☑ Include phenotype flag columns                                           │
│  ☐ Include patient demographics (last name, first name)                     │
│  ☑ Include lab profile file (first export to this destination)              │
│     ⓘ Sent once to bootstrap the destination's WHONET profile (see §4.4).   │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [Preview]                                                       [Generate]  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Dedup helper text (required).** Each deduplication parameter carries the inline `ⓘ` one-line explanation shown above. These are surveillance-statistics decisions most operators won't know cold — window length, window basis, scope, significance handling, repeat-row handling, and susceptibility-profile sensitivity each get a plain-language helper so the operator can pick correctly without external reference.

### 3.2 Preview mode

Clicking "Preview" runs the query + dedup + validation pass and shows results.

```
┌─ Preview ───────────────────────────────────────────────────────────────────┐
│                                                                              │
│ Summary:                                                                     │
│   Total isolates in date range: 489                                          │
│   After significance filter:    412                                          │
│   After deduplication:          312                                          │
│   Validation: 0 errors, 4 warnings                                           │
│                                                                              │
│ ⚠ Warnings:                                                                  │
│   • 1 organism unmapped (Burkholderia cepacia complex) — [Map now]          │
│   • 3 isolates older than 5 years (review for inclusion)                    │
│                                                                              │
│ Sample rows (first 25 of 312):                                               │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ COUNTRY │ LABORATORY │ PATIENT_ID │ SEX │ AGE │ AGE_UNIT │ SPEC_NUM │   │ │
│ ├─────────┼────────────┼────────────┼─────┼─────┼──────────┼──────────┤   │ │
│ │ PNG     │ CPHL       │ 12345678   │ M   │ 56  │ Y        │ BC24-0892│   │ │
│ │ PNG     │ CPHL       │ 12345679   │ F   │ 34  │ Y        │ UC24-0455│   │ │
│ │ ...                                                                       │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ [Back to filters]                                              [Generate]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

The unmapped-item warning's **"Map now"** action deep-links to the WHONET Mapping admin pre-filtered to that exact item per §2.4 (route `/admin/whonet-mapping/{vocabulary}?focus={id}&unmappedOnly=true`), and returns to the preview afterward so the warning re-clears.

### 3.3 Generate mode

Clicking "Generate" produces the file (per §4 output format) and the audit row:

- File downloaded to the user's browser.
- `whonet_export_run` row written (per §6 audit).
- Optional lab profile file `(LAB_CODE)_profile.wri` packaged together when it is the **first export to the chosen destination** (§4.4).
- Success notification with link to audit history.

---

## 4. Output file format

Per `whonet-export-design-review-v1.md` §3. Summary:

### 4.1 File structure

- UTF-8 encoded
- Unix line endings (LF)
- First row: header column names
- Subsequent rows: one isolate per row
- Empty cells for missing values (no `NULL` / `NA` / `-`)
- Quoting: minimal — only for cells containing delimiter or newline
- Separator: comma (CSV) or tab (TXT)

### 4.2 Column blocks

| Block | Columns | See design review §3 |
|-------|---------|----------------------|
| Demographic / Lab | COUNTRY, LABORATORY, PATIENT_ID, SEX, AGE, AGE_UNIT, DATE_OF_BIRTH | §3.1 |
| Specimen | SPEC_NUM, SPEC_DATE, SPEC_TYPE, SPECIMEN_SOURCE, INST_TYPE, WARD, WARD_TYPE, INFECTION_ORIGIN, DATE_ADMIS | §3.2 |
| Organism / Isolate | ORG, FIRST_OR_REPEAT, SIGNIFICANCE, ISOLATE_SCREENING, DATE_DATA, RESULT_ENTRY_DATE | §3.3 |
| AST results | one or more columns per antibiotic tested (with method suffix); per (`AMP`, `AMP_NM`, `AMP_NE`, etc.) | §3.4 |
| Phenotype flags | ESBL_SCREEN, ESBL_CONFIRM, MRSA, VRE, CRE, CARBAPENEMASE, MDR, XDR, PDR | §3.5 |
| Comment / metadata | BREAKPOINT_STANDARD, COMMENT | §3.6 |

### 4.3 File naming

Default template: `{COUNTRY}_{LAB_CODE}_{YYYY-MM-DD}_to_{YYYY-MM-DD}.csv`

Lab manager can override the template per deployment.

### 4.4 Lab profile file — "first export" scope

An optional `.wri` lab profile (or current WHONET profile format `VERIFY:`) is packaged with the data file so the receiving aggregator's WHONET install can set up the lab's profile before importing data files. It contains lab metadata, antibiotic panel definitions, and column structure.

**Scope of "first export": first export *per destination*, not "ever."** The profile is bootstrap data each receiving aggregator needs once; a deployment may export to more than one destination over time (e.g., a national reference lab plus a regional one), and each needs the profile on its own first receipt. Accordingly:

- The system tracks, per `delivery_destination`, whether the profile has already been sent (derived from `whonet_export_run` history for that destination).
- The "Include lab profile file" checkbox **defaults checked for the first export to a destination and unchecked thereafter**, and is **always operator-toggleable** — the operator can see whether this is treated as a first export and force-include or force-exclude the profile (e.g., to re-send after a profile change).
- When no destination is configured (manual download), "first export" is evaluated against the manual-download pseudo-destination so a one-off download still offers the profile once.

### 4.5 WHONET TB export

WHONET natively supports tuberculosis surveillance data, and the national AMR surveillance requirement explicitly calls for TB to be included ("including TB"). M-09 therefore exports TB results in the **WHONET TB format** so TB flows through the same national-surveillance pipeline as bacterial AMR — there is no separate TB export tool.

TB results originate in **M-14 (Mycobacteriology / TB)**. The export carries three TB-specific result kinds:

- **Species identification** — *M. tuberculosis* complex vs. specific NTM species, mapped to the WHONET organism code (the same `whonet_code` mapping vocabulary as bacterial organisms, §2.5, extended with the mycobacterial species the lab reports).
- **Phenotypic DST as R/S by critical concentration** — per anti-TB drug × DST method (MGIT / LJ / agar proportion). Because TB DST is interpreted against a **WHO critical concentration** (M-02 §3.5, §7.4) and is binary (R/S, no Intermediate), each tested drug maps to a WHONET TB AST column carrying the R/S call plus the method, exactly as bacterial AST results map to per-antibiotic columns (§4.2 AST-results block). The exported `BREAKPOINT_STANDARD` column records the WHO TB standard version used (e.g., `WHO_TB_2023`), reusing the breakpoint-standard mapping vocabulary.
- **Molecular resistance from Xpert / LPA** — genotypic resistance verdicts from GeneXpert MTB/RIF (rifampicin) and line probe assays (isoniazid, rifampicin, fluoroquinolones, aminoglycosides) are carried as **molecular resistance flag columns** (e.g., `RIF_XPERT`, `INH_LPA`, `FQ_LPA`), distinct from the phenotypic DST columns so the aggregator can see genotype and phenotype side by side. These reuse the phenotype/flag-mapping machinery (§2.5 Phenotypes vocabulary), extended with the TB molecular flags rather than a new mechanism.

**This reuses the existing export machinery.** The same query → dedup → field-mapping → file-generation pipeline (§3, §5) produces the TB file; only the **code-mapping tables** (organisms extended with mycobacterial species, a TB-drugs antibiotic mapping, the WHO_TB breakpoint-standard label, and the TB molecular flags) are extended. Deduplication (first-isolate logic, §5) applies per patient + *M. tuberculosis* complex over the configured window the same way it applies to bacterial isolates. TB cases are included in the standard export filters (specimen, origin, significance) and surface in the same preview/validation/audit surfaces. Operators do not configure a separate TB pipeline.

> **Forward reference.** Centralized GLASS reporting (WHONET aggregation and a consolidated-FHIR path) is specified separately. This section covers only the WHONET TB file export from a single OpenELIS deployment.

---

## 5. Deduplication algorithm

Per `whonet-export-design-review-v1.md` §4. Default: WHO GLASS-aligned 7-day window. Parameters configurable per §3.1 UI, each with the inline helper text defined there.

---

## 6. Audit

Every export run writes:

```
whonet_export_run
├── run_id (UUID PK)
├── started_at, completed_at
├── started_by (FK to user)
├── date_range_start, date_range_end
├── filters_json (JSON of all filter parameters)
├── dedup_params_json (JSON of dedup parameters)
├── validation_summary (JSON: error count, warning count, row counts before/after dedup)
├── output_file_path (relative path or storage URL)
├── output_file_size (bytes)
├── output_file_sha256 (for integrity verification)
├── lab_profile_included (bool — whether the profile file was packaged this run)
├── delivery_destination (nullable — Phase 2 SFTP / email; also the key for first-export-per-destination tracking)
├── delivery_status (PENDING, SUCCESS, FAILED)
├── delivery_attempts (int)
└── audit columns
```

Immutable. Retained ≥ 5 years per NFR-06. `lab_profile_included` + `delivery_destination` together drive the §4.4 first-export determination.

Audit history page at `/reports/whonet-export/history` shows all past runs with re-download capability.

---

## 7. Phase 2 — Scheduled export

Phase 2 within Phase 1B (or post-1B):

- Cron-like scheduling: monthly auto-run on the Nth day
- Same filter / dedup parameters reused per schedule
- Delivery via SFTP to a configured destination (national reference lab intake)
- Delivery via email to a configured address (fallback)
- Failure handling: retry up to N times; on persistent failure, surface in admin alerts

Phase 1B Phase 1: manual export with download. Phase 2: scheduled + auto-delivery.

---

## 8. Permissions

| Action | Permission |
|--------|-----------|
| View Export Generator | `micro.surveillance.export` |
| Generate exports | `micro.surveillance.export` |
| View Export History | `micro.surveillance.export` AND `audit.read` |
| Manage WHONET mappings | `micro.surveillance.mapping` |

---

## 9. Acceptance criteria

Per `whonet-export-design-review-v1.md` §8 plus:

- **AC-M09-01**: Export Generator UI captures all filter, dedup, and output parameters.
- **AC-M09-02**: Preview shows accurate row count after filter + dedup.
- **AC-M09-03**: Validation pass surfaces errors (block) and warnings (advisory).
- **AC-M09-04**: Unmapped item warnings include inline "Map now" action.
- **AC-M09-05**: Generated CSV file passes validation against WHONET column schema.
- **AC-M09-06**: Generated TXT file uses tabs as separator.
- **AC-M09-07**: Phenotype flag columns populated from M-06 Expert Rules outputs (when available).
- **AC-M09-08**: First-or-repeat marker accurate per dedup rule.
- **AC-M09-09**: Lab profile file packaged when checkbox enabled.
- **AC-M09-10**: File naming follows configured template.
- **AC-M09-11**: Audit row written for every export run.
- **AC-M09-12**: Re-download from history works.
- **AC-M09-13**: AST Worklist quick action opens M-09 with filters pre-populated.
- **AC-M09-14**: Code Mapping admin pages (8 vocabularies) work with bulk operations.
- **AC-M09-15**: All actions respect permissions.
- **AC-M09-16**: NFR-05 (preview < 5s for 1000 isolates; generate < 30s for 5000), NFR-04 (a11y).
- **AC-M09-17** *(folds E1)*: Every deduplication parameter (window length, window basis, scope, significance handling, repeat-row handling, susceptibility-profile sensitivity) shows an inline one-line helper explaining the surveillance-statistics choice.
- **AC-M09-18** *(folds E2)*: "Map now" opens the WHONET Mapping admin pre-filtered to the exact unmapped item via `/admin/whonet-mapping/{vocabulary}?focus={id}&unmappedOnly=true`, not a blank search, and returns to the preview afterward.
- **AC-M09-19** *(folds E3)*: The lab-profile inclusion is scoped to **first export per destination**; the checkbox defaults checked on a destination's first export and unchecked thereafter, is operator-toggleable, and the run records `lab_profile_included`.
- **AC-M09-20** *(folds E4)*: The AST-Worklist "Export to WHONET" quick action deep-links to `/reports/whonet-export` with `from/to/specimen/origin/organism/significance/source` params per §1.5, pre-populating the generator's filters.
- **AC-M09-21** *(Phase 1B surfacing)*: In Phase 1A the export entry points (worklist quick action, Reports menu) render disabled with a "coming in Phase 1B" tooltip and do not navigate.
- **AC-M09-22** *(WHONET TB export)*: TB results from M-14 export in the WHONET TB format — species ID (mapped organism code), phenotypic DST as R/S by WHO critical concentration per drug × method (MGIT / LJ / agar proportion) with the WHO_TB breakpoint-standard version in `BREAKPOINT_STANDARD`, and molecular resistance flags from Xpert/LPA in dedicated flag columns distinct from the phenotypic DST columns — reusing the existing dedup, field-mapping, preview, validation, and audit machinery (no separate TB pipeline).
- **AC-M09-23** *(WHONET TB export)*: TB code mappings (mycobacterial species, anti-TB drugs, WHO_TB standard label, TB molecular flags) are configured through the same WHONET Mapping admin vocabularies (§2.5), with unmapped TB items surfaced via the standard preview warning + "Map now" deep-link.

---

## 10. i18n keys

Estimated 95-115 keys. Pattern:

```
reports.whonetExport.title                       "WHONET Export Generator"
reports.whonetExport.section.dateRange           "Date Range"
reports.whonetExport.section.filters             "Filters"
reports.whonetExport.section.dedup               "Deduplication"
reports.whonetExport.section.output              "Output"
reports.whonetExport.dateRange.start             "Start Date"
reports.whonetExport.dateRange.end               "End Date"
reports.whonetExport.dateRange.quick.thisMonth   "This Month"
reports.whonetExport.dateRange.quick.lastMonth   "Last Month"
reports.whonetExport.dateRange.quick.thisQuarter "This Quarter"
reports.whonetExport.dateRange.quick.custom      "Custom"
reports.whonetExport.filter.specimenTypes        "Specimen Types"
reports.whonetExport.filter.organisms            "Organisms"
reports.whonetExport.filter.organisms.all        "All organisms"
reports.whonetExport.filter.organisms.specific   "Select specific..."
reports.whonetExport.filter.patientOrigins       "Patient Origins"
reports.whonetExport.filter.significance         "Significance"
reports.whonetExport.filter.includeScreening     "Include screening / surveillance cultures"
reports.whonetExport.fromAstWorklist.note        "Filters pre-filled from the AST Worklist"
reports.whonetExport.fromAstWorklist.clear       "Clear pre-filled filters"
reports.whonetExport.dedup.applyToggle           "Apply first-isolate dedup"
reports.whonetExport.dedup.windowLength.label    "Window length"
reports.whonetExport.dedup.windowLength.option.7days "7 days"
reports.whonetExport.dedup.windowLength.option.14days "14 days"
reports.whonetExport.dedup.windowLength.option.30days "30 days"
reports.whonetExport.dedup.windowLength.option.episode "Episode-based"
reports.whonetExport.dedup.windowLength.help     "How long after the first isolate repeats are collapsed. WHO GLASS default is 7 days; longer windows count fewer repeats as new."
reports.whonetExport.dedup.windowBasis.label     "Window basis"
reports.whonetExport.dedup.windowBasis.collection "Collection date"
reports.whonetExport.dedup.windowBasis.release   "Result release date"
reports.whonetExport.dedup.windowBasis.help      "Which date starts the window — when the specimen was collected (recommended) or when the result was released."
reports.whonetExport.dedup.scope.anySource       "Any source"
reports.whonetExport.dedup.scope.sameSource      "Same source only"
reports.whonetExport.dedup.scope.help            "\"Any source\" counts one isolate per patient+organism across all specimen types; \"Same source only\" dedups within each source."
reports.whonetExport.dedup.significance.help      "Drops likely contaminants before choosing the first isolate, so a contaminant doesn't become the representative result."
reports.whonetExport.dedup.repeatHandling.drop   "Drop repeats"
reports.whonetExport.dedup.repeatHandling.include "Include with R marker"
reports.whonetExport.dedup.repeatHandling.help   "Whether collapsed repeats are removed entirely or kept and flagged as repeats for the aggregator."
reports.whonetExport.dedup.suscProfile.label     "Susceptibility profile"
reports.whonetExport.dedup.suscProfile.insensitive "Insensitive"
reports.whonetExport.dedup.suscProfile.sensitive "Sensitive"
reports.whonetExport.dedup.suscProfile.help      "\"Sensitive\" treats a changed S/I/R profile as a new isolate even within the window; \"Insensitive\" ignores profile changes."
reports.whonetExport.output.format               "Format"
reports.whonetExport.output.format.csv           "WHONET CSV"
reports.whonetExport.output.format.txt           "WHONET TXT"
reports.whonetExport.output.format.custom        "Custom delimited"
reports.whonetExport.output.includeIntermediate  "Include intermediate (I) results"
reports.whonetExport.output.includePhenotypeFlags "Include phenotype flag columns"
reports.whonetExport.output.includeDemographics  "Include patient demographics (last name, first name)"
reports.whonetExport.output.includeLabProfile    "Include lab profile file (first export to this destination)"
reports.whonetExport.output.includeLabProfile.help "Sent once to bootstrap the destination's WHONET profile."
reports.whonetExport.action.preview              "Preview"
reports.whonetExport.action.generate             "Generate"
reports.whonetExport.action.backToFilters        "Back to filters"
reports.whonetExport.action.backToPreview        "Back to export preview"
reports.whonetExport.phase1b.tooltip             "Coming in Phase 1B"
reports.whonetExport.preview.summary.total       "Total isolates in date range"
reports.whonetExport.preview.summary.afterFilter "After significance filter"
reports.whonetExport.preview.summary.afterDedup  "After deduplication"
reports.whonetExport.preview.summary.validation  "Validation"
reports.whonetExport.preview.warning.unmapped    "{{count}} organism(s) unmapped"
reports.whonetExport.preview.warning.unmapped.action "Map now"
reports.whonetExport.preview.warning.olderThan5  "{{count}} isolates older than 5 years"
reports.whonetExport.preview.error.missingRequired "{{field}} is missing on {{count}} rows"
reports.whonetExport.history.title               "Export History"
reports.whonetExport.history.column.startedAt    "Date"
reports.whonetExport.history.column.user         "User"
reports.whonetExport.history.column.rowCount     "Rows"
reports.whonetExport.history.column.fileSize     "Size"
reports.whonetExport.history.column.status       "Status"
reports.whonetExport.history.action.download     "Re-download"
admin.whonetMapping.title                        "WHONET Code Mapping"
admin.whonetMapping.section.organisms            "Organisms"
admin.whonetMapping.section.antibiotics          "Antibiotics"
admin.whonetMapping.section.specimens            "Specimens"
admin.whonetMapping.section.origins              "Origins"
admin.whonetMapping.section.patientTypes         "Patient Types"
admin.whonetMapping.section.departments          "Departments"
admin.whonetMapping.section.breakpoints          "Breakpoint Standards"
admin.whonetMapping.section.phenotypes           "Phenotypes"
admin.whonetMapping.list.column.oeName           "OpenELIS {{vocabularyType}}"
admin.whonetMapping.list.column.whonetCode       "WHONET Code"
admin.whonetMapping.list.column.whonetName       "WHONET Name"
admin.whonetMapping.list.filter.unmappedOnly     "Show unmapped only"
admin.whonetMapping.unmappedWarning              "{{count}} {{type}}(s) not mapped. These will be excluded from WHONET exports unless mapped."
admin.whonetMapping.action.importHub             "Import Hub"
admin.whonetMapping.action.map                   "Map"
admin.whonetMapping.action.clearMapping          "Clear Mapping"
```

---

## 11. Open verification items

Carried from design review:

- **Reconcile with the existing export (§0.1).** Inventory `WHONetReportService` / `WHONETCSVRoutineColumnBuilder` / `WHONETExportRoutineByDate` and the `getWHONetRows(low, high)` query; decide the upgrade path (extend the column builder to wide isolate-format + code mapping + dedup, vs. a new builder reusing the service+menu). The existing long-format dump and its column set are the starting point, not a competing design.
- **WHONET dictionary pack (§0.2 — the real lift; partly de-risked).** WHONET's organism/specimen/antibiotic code lists are **published and free** (WHONET/BacLink are distributed free by WHO; codes appear in the WHONET Antimicrobial Codes document and the WHONET-for-GLASS materials) — so a bundled pack is feasible. **Still to confirm:** a **machine-readable** form (the public artifact is a PDF) and explicit **redistribution terms** for shipping the codes in M-01 seed. **Concrete crosswalk source found:** the open-source **AMR package for R** maintains code mappings for ~79,000 microbial species and ~620 antimicrobials **including LOINC and SNOMED CT, and supports WHONET data** — a ready, maintained dataset for both the seed pack and the shared-code suggestion join, rather than assembling a crosswalk by hand. Evaluate its licence (GPL-family) and packaging for use as the reference source. Suggestions remain deterministic exact-name + shared-code lookups against this pack — **no matcher to build**; fuzzy matching is explicitly deferred.
- **Scheduler for unattended delivery (§0.5).** Verify whether OpenELIS already has a scheduled-job / cron mechanism (and SFTP/email delivery) to reuse, or whether a scheduled task must be added.
- Current WHONET column set + method suffix conventions
- CLSI M39 / WHO M-AMR-9 first-isolate algorithm specifics
- WHONET lab profile file format (current version)
- Per-deployment national reference lab intake protocols
- Confirm the route shape for the "Map now" deep-link (`/admin/whonet-mapping/{vocabulary}?focus=…`) against the final admin sidenav structure.

---

## 12. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (organism/antibiotic WHONET codes)
- M-02 Breakpoint Catalog (breakpoint standard codes)
- M-04 Case Workbench Core (read source)
- M-05 AST Entry & Interpretation (AST results in `result` table)
- M-06 Expert Rules Engine (phenotype flag values)
- M-07 Worklists (AST-Worklist "Export to WHONET" quick action; Phase-1B disabled in 1A)
- M-10 Hub Subscription (provides code updates)
- M-14 Mycobacteriology / TB (source of TB species ID, phenotypic DST, and Xpert/LPA molecular flags for the WHONET TB export, §4.5)
- **`whonet-export-design-review-v1.md`** — comprehensive design review; this FRS formalizes it
- `amr-pre-frs-planning-v1.md` §7 (GLASS direction; M-13 removed; M-09 stays)
