# M-13 Antibiogram (Cumulative Susceptibility Report) — Functional Requirements Specification

**Version:** 1.0 (canonical — reuse-first; reads existing AST data; no new clinical entities; no separate addendum)
**Date:** 2026-06-08
**Module:** Microbiology → Reports → Antibiogram
**Route:** `/reports/antibiogram` (Reports area, consistent with M-09 `/reports/whonet-export`)
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

> Self-contained. Key decisions written inline: the antibiogram is a **read/reporting module over existing AST result data — it introduces NO new clinical data** (§7); it **reuses the M-09 first-isolate de-duplication logic unchanged** rather than reinventing it (§4.2); it **reuses the existing Jasper reporting infrastructure** for PDF/CSV output (§5); and it is the **lab's clinical artifact (empiric-therapy guidance), distinct from WHONET/GLASS surveillance (M-09)** — the two share the de-duplicated isolate set but serve different audiences and must not be conflated (§2.4). A **TB drug-resistance summary** is a variant of the same report, because TB DST is Resistant/Susceptible at a critical concentration, not clinical S/I/R (§6). All interaction is inline (no modals).

---

## 1. Lab Context

**Current State.** A clinical lab accumulates thousands of Antimicrobial Susceptibility Testing (AST) results a year, one isolate at a time, in `micro_ast_run` / result rows (M-04 / M-05). Periodically — usually annually — someone is asked "what percent of our *E. coli* is still susceptible to ciprofloxacin?" so clinicians can choose empiric therapy. Today that answer is produced by exporting raw results to a spreadsheet and hand-counting, or it simply isn't produced. WHONET (M-09) can be run for surveillance, but its output is an isolate-level file for a national aggregator, not a clinician-facing percent-susceptible table.

**Pain.** Hand-built antibiograms are slow, inconsistent, and frequently wrong on the methodology that makes them clinically valid: they double-count the same patient's repeat isolates, they report a percent on a handful of isolates (where the number is statistically meaningless), and they mix specimen types and patient populations that should be reported separately (a blood antibiogram and a urine antibiogram guide different decisions). There is no repeatable, auditable artifact the lab can sign off and hand to the wards.

**What Changes.** One **Antibiogram** report page produces the **cumulative susceptibility report** to CLSI M39: for each organism × antibiotic it shows the **percent susceptible (%S)** and the isolate count (**n**), computed over **first isolates per patient per period** (reusing the M-09 dedup), with small-n cells (n < 30, configurable) **suppressed or flagged** because their %S is unreliable, and only routinely-reported (selective/cascade) drugs shown. The lab manager generates it, filters it by period / specimen / location, reviews it on screen, and exports it to PDF or CSV through the existing Jasper infrastructure to circulate to clinicians. A **TB drug-resistance summary** variant covers *M. tuberculosis*. Nothing here creates clinical data — it reads what M-04/M-05 already verified.

---

## 2. Overview

### 2.1 Purpose
A periodic (usually annual) **cumulative antibiogram**: an on-screen, exportable table of **%S and n per organism × antibiotic**, built to CLSI M39 methodology, used to **guide empiric therapy and track resistance trends**. It is read-only reporting over finalized AST data; it neither edits nor creates results.

### 2.2 Navigation & URL
- **SideNav:** `Reports → Antibiogram` (same Reports area as `Reports → WHONET Export`, M-09).
- **Breadcrumb:** `Home / Reports / Antibiogram`.
- **URL:** `/reports/antibiogram` (deep-linkable; the active period/specimen/location/variant may be encoded as query params, e.g. `?from=2025-01-01&to=2025-12-31&specimen=bl&variant=standard`). Run history sub-page at `/reports/antibiogram/history`.

### 2.3 Users
| Role | Use |
|------|-----|
| Lab Manager | Generates the antibiogram; configures the n threshold; signs/exports the artifact |
| Microbiology Supervisor | Generates and reviews; exports for circulation |
| Microbiology Technician / Clinician | **Views** a generated antibiogram (per existing role bundles) to guide empiric therapy |

Generation is a lab-manager/supervisor function; viewing is broad (lab staff and clinicians per existing bundles). **No new per-action permission keys** (§8).

### 2.4 Antibiogram vs. surveillance (do not conflate)
The antibiogram and WHONET/GLASS export **share the underlying de-duplicated, first-isolate set** but are two different deliverables for two different audiences:

| | **M-13 Antibiogram** | **M-09 WHONET / GLASS** |
|---|---|---|
| Purpose | **Clinical artifact** — empiric-therapy guidance, local resistance trend | **Surveillance** — feed the national reference lab / GLASS |
| Audience | The lab's own clinicians and stewardship | National/global aggregator, outside OE |
| Output | Aggregate **%S, n** table (PDF/CSV) | Isolate-level WHONET file (CSV/TXT) |
| Grain | Organism × antibiotic summary | One row per isolate |

They reuse the same dedup (§4.2) so the two artifacts are internally consistent, but the antibiogram is **not** a surveillance submission and the WHONET file is **not** a clinician-facing antibiogram.

### 2.5 Integration
- **M-04 Case Workbench Core** — read source. Reads finalized `micro_case` / `micro_isolate` / `micro_ast_run` data.
- **M-05 AST Entry & Interpretation** — the per-drug S/I/R interpretations in `result` rows are the input; **only final, verified** results are counted (§4.1).
- **M-09 WHONET Export** — **the first-isolate de-duplication logic is reused unchanged** (§4.2); both reports draw on the same de-duplicated isolate set.
- **M-01 AMR Reference Data** — organism/antibiotic masters and the **selective/cascade reporting** configuration that determines which drugs are "routinely reported" (§4.4).
- **M-14 Mycobacteriology / TB** — source of TB DST runs (`micro_ast_run` with `interpretation_method = CRITICAL_CONCENTRATION`) for the TB resistance-summary variant (§6).
- **M-00 Parent** — module scope; reporting-vs-surveillance division of responsibility.
- **Jasper reporting infrastructure** (the existing OE report engine used by M-04 release templates) — renders the PDF/CSV output (§5).

---

## 3. User Stories
- As a lab manager, I want to generate this year's cumulative antibiogram in a few clicks, so I can hand clinicians a valid empiric-therapy table instead of a hand-built spreadsheet.
- As a clinician, I want the %S and n for the organisms I treat empirically, so I can choose a drug likely to work before culture is back.
- As a supervisor, I want repeat isolates from the same patient counted once and tiny-n cells flagged, so the report is statistically honest.
- As a manager, I want separate blood and urine antibiograms (and inpatient vs outpatient), because they guide different decisions.
- As a TB officer, I want a per-drug %resistant summary for *M. tuberculosis*, since TB results are Resistant/Susceptible, not clinical S/I/R.

---

## 4. Methodology (CLSI M39)

### 4.1 Only final, verified results
The denominator includes only AST results that are **final and verified** (released per M-05; preliminary, in-review, or invalidated results are excluded). The %S numerator counts isolates interpreted **Susceptible**; Intermediate and Resistant are not susceptible. Intermediate handling (counted in n, never in numerator) is stated in the method footnote on every export.

### 4.2 First isolate per patient per period (REUSE M-09 dedup — not reinvented)
De-duplication keeps the **first isolate per patient per organism per analysis period** so a single colonized/repeatedly-sampled patient does not skew the percentages. This module **does not define its own dedup** — it **invokes the same first-isolate de-duplication routine M-09 already specifies** (M-09 §5 / `whonet-export-design-review-v1.md` §4: window length, window basis, scope, significance handling, susceptibility-profile sensitivity). The antibiogram calls that routine with the CLSI M39 default profile (first isolate per patient per period, any source, contaminants excluded first) and exposes the same parameters read-only in the run record so the antibiogram and a WHONET run over the same period reconcile. Reuse is explicit and load-bearing: there is exactly one dedup implementation in the module.

### 4.3 Suppress / flag small-n cells (n < 30, configurable)
Per CLSI M39, **%S computed on fewer than 30 isolates is statistically unreliable** and must not be reported as a hard number. For each organism × antibiotic cell where **n is below the threshold (default 30, configurable per deployment)**, the cell is either **suppressed** (drug column omitted for that organism, or cell shown as "—") or **flagged** (%S shown but marked, e.g. parenthesized with a "n < 30 — interpret with caution" footnote), per the deployment's chosen mode. The threshold and suppress-vs-flag mode are report parameters, defaulted but operator-overridable; the chosen values are recorded on the run and printed in the method footnote.

### 4.4 Selective / cascade reporting respected
Only drugs that are **routinely reported** for an organism (the selective/cascade reporting configured in M-01) appear as columns for that organism. Cascade-tier-2 agents that were only reported on a few resistant isolates are not surfaced as if they were routine, matching what clinicians actually see on individual reports.

---

## 5. The Antibiogram report

### 5.1 Filters
A single inline filter panel (no modals), mirroring the M-09 generator's layout conventions:

- **Period / date range** — start/end dates with quick presets (This Year, Last Year, This Quarter, Custom). The analysis period is the dedup period.
- **Specimen type** — produce a combined or specimen-specific antibiogram (e.g. a **blood** antibiogram vs a **urine** antibiogram); multi-select.
- **Patient location / lab unit** — restrict to a ward, unit, or department.
- **Inpatient vs outpatient** — patient-origin filter (reuses the M-01 origin vocabulary).
- **Grouping** — optional **syndromic / Gram-negative vs Gram-positive** sectioning of the organism rows (a display grouping, not a different computation).
- **n threshold** and **suppress vs flag** mode (§4.3), defaulted, overridable.
- **Variant** — Standard antibiogram (default) or **TB drug-resistance summary** (§6).

### 5.2 On-screen table
After **Generate**, the report renders inline as an organism × antibiotic matrix:

- Rows: organisms (optionally sectioned Gram-negative / Gram-positive / syndromic per §5.1), with the total isolate **n** for that organism.
- Columns: routinely-reported antibiotics for those organisms (§4.4).
- Cells: **%S** with **n** (e.g. `88% (n=142)`); small-n cells suppressed or flagged per §4.3.
- A **method footnote** states: first-isolate dedup (reused from M-09) with its parameters, the n threshold and mode, "only final verified results", and the Intermediate-handling rule — so the artifact is self-documenting.
- Empty state when no organism meets the threshold for the chosen filters ("No organism has ≥ n isolates for this period/specimen — widen the period or lower the threshold").

### 5.3 Export (reuse existing Jasper infrastructure)
- **[Export PDF]** and **[Export CSV]** reuse the **existing OE Jasper reporting infrastructure** (the same engine behind the M-04 release templates) — no new reporting stack. The PDF is the circulatable clinical artifact (lab header, period, filters, method footnote, signature line); the CSV carries the same %S/n grid for further analysis.
- Both are downloaded to the user's browser and recorded in run history (§8).

---

## 6. TB drug-resistance summary variant
A variant of the same report for *Mycobacterium tuberculosis*, because **TB drug-susceptibility is reported Resistant/Susceptible at a WHO critical concentration, not as clinical MIC-to-S/I/R** (see M-14 §2.2 and the WHO-TB critical-concentration standard in M-02):

- The matrix shows, per anti-TB drug, the **percent resistant (%R)** and **n** (instead of %S), over first MTB-complex isolates per patient per period.
- Source rows are TB DST runs (`micro_ast_run` with `interpretation_method = CRITICAL_CONCENTRATION`, M-14 §3.2); molecular-only resistance calls are footnoted, not blended into the phenotypic %R.
- The same dedup (§4.2), n-threshold (§4.3), and export (§5.3) rules apply; the method footnote states "%resistant at WHO critical concentration."

---

## 7. Data — read-only, no new clinical data
This module is **read/reporting only over existing entities** (`micro_case`, `micro_isolate`, `micro_ast_run`, `result`). It **introduces NO new clinical data and no new clinical tables or fields.** The only persisted artifact is a non-clinical **run record** for audit/re-download (§8), analogous to `whonet_export_run`:

```
antibiogram_run
├── run_id (UUID PK)
├── generated_at, generated_by (FK to user)
├── period_start, period_end
├── filters_json (specimen, location, origin, grouping, variant)
├── dedup_params_json (the M-09 dedup parameters used — recorded for reconciliation)
├── n_threshold, small_n_mode (SUPPRESS | FLAG)
├── summary_json (organism × drug %S/n grid as rendered)
├── output_file_path, output_file_format (PDF | CSV), output_file_sha256
└── audit columns
```

No row in `micro_*` is created or modified by generating an antibiogram.

## 8. Permissions & Audit
- **View a generated antibiogram:** existing `micro.case.view` bundle (lab staff and clinicians per existing role bundles). **No new per-action key.**
- **Generate an antibiogram:** lab-manager / supervisor function; reuses an existing reporting permission already held by those bundles (e.g. the report-generation permission used by other Reports pages). **No new per-action key is introduced.**
- **Audit:** every **generation** writes an `antibiogram_run` row (§7) — who, when, period, filters, dedup params, n threshold/mode, output file hash. Immutable; retained per NFR-06. History page `/reports/antibiogram/history` lists past runs with re-download. **Reads/views are not audited** (consistent with M-07).

## 9. Non-functional
- Generate (one year, ~5000 isolates) renders the on-screen table < 10 s and exports < 30 s (aligns with NFR-05). WCAG 2.1 AA (NFR-04): the matrix is keyboard-navigable; %S and suppression/flagging conveyed by text (not colour alone); small-n flags have text equivalents. Numbers and method footnotes are localizable.

## 10. i18n keys (pattern `reports.antibiogram.*`)
```
reports.antibiogram.title                     "Antibiogram"
reports.antibiogram.subtitle                  "Cumulative Susceptibility Report"
reports.antibiogram.section.period            "Period"
reports.antibiogram.section.filters           "Filters"
reports.antibiogram.section.output            "Output"
reports.antibiogram.period.quick.thisYear     "This Year"
reports.antibiogram.period.quick.lastYear     "Last Year"
reports.antibiogram.period.quick.thisQuarter  "This Quarter"
reports.antibiogram.period.quick.custom       "Custom"
reports.antibiogram.filter.specimen           "Specimen type"
reports.antibiogram.filter.location           "Patient location / unit"
reports.antibiogram.filter.origin.inpatient   "Inpatient"
reports.antibiogram.filter.origin.outpatient  "Outpatient"
reports.antibiogram.filter.grouping           "Grouping"
reports.antibiogram.filter.grouping.none      "None"
reports.antibiogram.filter.grouping.gram      "Gram-negative / Gram-positive"
reports.antibiogram.filter.grouping.syndromic "Syndromic"
reports.antibiogram.filter.variant            "Variant"
reports.antibiogram.variant.standard          "Standard antibiogram"
reports.antibiogram.variant.tb                "TB drug-resistance summary"
reports.antibiogram.nThreshold.label          "Minimum isolates (n)"
reports.antibiogram.nThreshold.help           "Cells with fewer isolates than this are suppressed or flagged; CLSI M39 advises against reporting %S on fewer than 30 isolates."
reports.antibiogram.smallN.mode.suppress      "Suppress small-n cells"
reports.antibiogram.smallN.mode.flag          "Flag small-n cells"
reports.antibiogram.smallN.flag.note          "n < {{threshold}} — interpret with caution"
reports.antibiogram.table.percentSusceptible  "%S"
reports.antibiogram.table.percentResistant    "%R"
reports.antibiogram.table.isolateCount        "n"
reports.antibiogram.table.cellSuppressed      "—"
reports.antibiogram.footnote.dedup            "First isolate per patient per period (de-duplicated)."
reports.antibiogram.footnote.verifiedOnly     "Includes only final, verified AST results."
reports.antibiogram.footnote.intermediate     "Intermediate (I) results counted in n, not in %S."
reports.antibiogram.footnote.tb               "%resistant at WHO critical concentration."
reports.antibiogram.action.generate           "Generate"
reports.antibiogram.action.exportPdf          "Export PDF"
reports.antibiogram.action.exportCsv          "Export CSV"
reports.antibiogram.empty                     "No organism has the minimum isolates for this period/specimen. Widen the period or lower the threshold."
reports.antibiogram.history.title             "Antibiogram History"
reports.antibiogram.history.action.download   "Re-download"
... (further keys as implemented)
```

## 11. Acceptance criteria
- **AC-M13-01**: %S and isolate **n** are computed and displayed per organism × antibiotic over the chosen period.
- **AC-M13-02**: First-isolate de-duplication is applied **by reusing the M-09 dedup routine** (not a new implementation); the parameters used are recorded on the run.
- **AC-M13-03**: Only **final, verified** AST results are included; Intermediate is counted in n, never in the %S numerator.
- **AC-M13-04**: Cells with **n below the threshold (default 30, configurable)** are **suppressed or flagged** per the deployment's chosen mode, with the threshold/mode shown in the method footnote.
- **AC-M13-05**: Only **routinely-reported (selective/cascade) drugs** (M-01) appear as columns for each organism.
- **AC-M13-06**: Period, specimen-type, patient-location/unit, and inpatient/outpatient filters apply; optional Gram-negative/Gram-positive (syndromic) grouping renders.
- **AC-M13-07**: **PDF and CSV export** are produced via the **existing Jasper reporting infrastructure** (no new reporting stack); both carry the method footnote.
- **AC-M13-08**: The **TB drug-resistance summary** variant shows **%resistant** at WHO critical concentration over MTB-complex isolates, sourced from `CRITICAL_CONCENTRATION` DST runs (M-14).
- **AC-M13-09**: The module is **read-only — it creates/modifies no clinical data**; the only persisted artifact is the non-clinical `antibiogram_run` record.
- **AC-M13-10**: Viewing uses the existing `micro.case.view` bundle and generation uses an existing reporting permission — **no new per-action keys**; every generation is audited; reads are not.
- **AC-M13-11**: The antibiogram is presented as the lab's **clinical artifact** and is distinct from the M-09 surveillance export, while sharing the same de-duplicated isolate set.

## 12. References
- M-00 Microbiology Module Parent Specification (module scope; reporting-vs-surveillance division)
- M-01 AMR Reference Data (organism/antibiotic masters; selective/cascade reporting; origin vocabulary)
- M-04 Case Workbench Core (read source — `micro_case` / `micro_isolate` / `micro_ast_run`)
- M-05 AST Entry & Interpretation (final verified S/I/R results in `result` rows)
- M-09 WHONET Export (**first-isolate de-duplication logic reused unchanged**; shared de-duplicated isolate set; surveillance counterpart)
- M-14 Mycobacteriology / TB (TB DST `CRITICAL_CONCENTRATION` runs for the TB resistance-summary variant)
- CLSI M39 (cumulative antibiogram methodology — first isolate, n ≥ 30, selective reporting)
