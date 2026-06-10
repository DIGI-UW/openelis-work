# M-09 WHONET Export — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology → WHONET Export + Admin → WHONET Mapping
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec implements the WHONET surveillance export. It builds on the substantive design review in `whonet-export-design-review-v1.md` — that doc enumerates the column set, dedup algorithm, validation rules, and file format details. This FRS formalizes those into spec form aligned with the M-* bundle structure.

GLASS direct submission is **out of scope** per single-tenancy constraints (M-00 §7). OpenELIS exports WHONET files; central aggregation happens outside OE.

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
- **M-07 Worklists** — AST Worklist "Export to WHONET" quick action invokes M-09.
- **M-10 Hub Subscription** — provides code updates.

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

### 2.4 Eight coded vocabularies

| Vocabulary | OE source | WHONET code | Notes |
|------------|-----------|-------------|-------|
| Organisms | `organism_master` | `whonet_code` field | Per M-01 §2.4; 3-5 lowercase char |
| Antibiotics | `antibiotic_master` | `whonet_code` field | Per M-01 §3.3; 3-4 uppercase char |
| Specimens | existing OE sample type vocab | new `whonet_code` field | E.g., `bl` (blood), `ur` (urine) — per M-01 §6.1 |
| Origins | (new) `patient_origin` | new `whonet_code` field | INP / OUT / ICU / EME / LTC / UNK per M-01 §6.2 |
| Patient Types | (new) `patient_type` (small enum) | `whonet_code` field | Adult / Pediatric / Neonate / Unknown |
| Departments | existing OE department vocab | new `whonet_code` field | Per M-01 §6.3 |
| Breakpoint Standards | `breakpoint_standard` | `whonet_label` field | E.g., `CLSI24`, `EUCAST14` |
| Phenotypes | (new) `phenotype_flag_definition` (small fixed set) | `whonet_column` field | Maps OE phenotype names to WHONET column names: ESBL_SCREEN, MRSA, VRE, CRE, CARBAPENEMASE, MDR, XDR, PDR |

### 2.5 Import from Hub

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
│  └─ Window basis: (•) Collection date   ( ) Result release date            │
│  └─ Scope: (•) Any source   ( ) Same source only                            │
│  └─ Significance handling: (•) Exclude probable contaminants first          │
│  └─ Repeat row handling: (•) Drop repeats   ( ) Include with R marker      │
│  └─ Susceptibility profile: (•) Insensitive   ( ) Sensitive                │
│                                                                              │
│  ═══════ OUTPUT ═══════                                                      │
│                                                                              │
│  Format: (•) WHONET CSV   ( ) WHONET TXT   ( ) Custom delimited             │
│                                                                              │
│  ☑ Include intermediate (I) results                                         │
│  ☑ Include phenotype flag columns                                           │
│  ☐ Include patient demographics (last name, first name)                     │
│  ☑ Include lab profile file (one-time bootstrap)                            │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [Preview]                                                       [Generate]  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

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

### 3.3 Generate mode

Clicking "Generate" produces the file (per §4 output format) and the audit row:

- File downloaded to the user's browser.
- `whonet_export_run` row written (per §6 audit).
- Optional lab profile file `(LAB_CODE)_profile.wri` packaged together (if checkbox enabled).
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

### 4.4 Lab profile file

Optional `.wri` lab profile (or current WHONET profile format `VERIFY:`) packaged with the data file on first export. Contains lab metadata, antibiotic panel definitions, and column structure. The receiving aggregator's WHONET install uses this to set up the lab's profile before importing data files.

---

## 5. Deduplication algorithm

Per `whonet-export-design-review-v1.md` §4. Default: WHO GLASS-aligned 7-day window. Parameters configurable per §3.1 UI.

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
├── delivery_destination (nullable — Phase 2 SFTP / email)
├── delivery_status (PENDING, SUCCESS, FAILED)
├── delivery_attempts (int)
└── audit columns
```

Immutable. Retained ≥ 5 years per NFR-06.

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

---

## 10. i18n keys

Estimated 80-100 keys. Pattern:

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
reports.whonetExport.dedup.applyToggle           "Apply first-isolate dedup"
reports.whonetExport.dedup.windowLength.label    "Window length"
reports.whonetExport.dedup.windowLength.option.7days "7 days"
reports.whonetExport.dedup.windowLength.option.14days "14 days"
reports.whonetExport.dedup.windowLength.option.30days "30 days"
reports.whonetExport.dedup.windowLength.option.episode "Episode-based"
reports.whonetExport.dedup.windowBasis.label     "Window basis"
reports.whonetExport.dedup.windowBasis.collection "Collection date"
reports.whonetExport.dedup.windowBasis.release   "Result release date"
reports.whonetExport.dedup.scope.anySource       "Any source"
reports.whonetExport.dedup.scope.sameSource      "Same source only"
reports.whonetExport.dedup.repeatHandling.drop   "Drop repeats"
reports.whonetExport.dedup.repeatHandling.include "Include with R marker"
reports.whonetExport.output.format               "Format"
reports.whonetExport.output.format.csv           "WHONET CSV"
reports.whonetExport.output.format.txt           "WHONET TXT"
reports.whonetExport.output.format.custom        "Custom delimited"
reports.whonetExport.output.includeIntermediate  "Include intermediate (I) results"
reports.whonetExport.output.includePhenotypeFlags "Include phenotype flag columns"
reports.whonetExport.output.includeDemographics  "Include patient demographics (last name, first name)"
reports.whonetExport.output.includeLabProfile    "Include lab profile file (one-time bootstrap)"
reports.whonetExport.action.preview              "Preview"
reports.whonetExport.action.generate             "Generate"
reports.whonetExport.action.backToFilters        "Back to filters"
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

- Current WHONET column set + method suffix conventions
- CLSI M39 / WHO M-AMR-9 first-isolate algorithm specifics
- WHONET lab profile file format (current version)
- Per-deployment national reference lab intake protocols

---

## 12. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (organism/antibiotic WHONET codes)
- M-02 Breakpoint Catalog (breakpoint standard codes)
- M-04 Case Workbench Core (read source)
- M-05 AST Entry & Interpretation (AST results in `result` table)
- M-06 Expert Rules Engine (phenotype flag values)
- M-10 Hub Subscription (provides code updates)
- **`whonet-export-design-review-v1.md`** — comprehensive design review; this FRS formalizes it
- `amr-pre-frs-planning-v1.md` §7 (GLASS direction; M-13 removed; M-09 stays)
