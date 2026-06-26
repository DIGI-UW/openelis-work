# MinION + TB-Profiler — Field Mapping & Integration Specification

**Target Instrument:** Oxford Nanopore MinION (Mk1C / Mk1B)
**Bioinformatics Pipeline:** TB-Profiler (https://github.com/jodyphelan/TBProfiler)
**Resistance Database:** WHO Catalogue of Mutations in *M. tuberculosis* (2023 edition)
**OpenELIS Module:** Microbiology / AMR — TB Case Workbench (M-14), via the analyzer event channel
**Integration pattern:** A **MinION/TB-Profiler analyzer profile on the existing flat-file plugin**, feeding the analyzer import channel (M-14 §6 / M-04 §7) — *not* a new pipeline-import module
**Version:** 2.2 — *re-anchored on M-14; slimmed to a flat-file-plugin profile + parser*
**Supersedes:** v1.0 (2025-02-19, attached to OGC-318); v2.0/v2.1 (interim drafts)
**Date:** 2026-06-22
**Deployment:** PNG / CPHL (also relevant to Madagascar — OGC-318/334)
**Confidence:** HIGH (TB-Profiler output schema verified against 8 sample files); MEDIUM where it depends on M-14 model additions not yet built (flagged §3, §13)

---

## 0. What changed (and why)

v1.0 specced TB-Profiler import as a **standalone pipeline-import module** with its own four-level result store ("Level 1 classification → Level 2 per-drug S/R → Level 3 mutation detail → Level 4 QC"), its own classification logic, its own import queue, and a dedicated upload + review UI (OGC-318/324/334).

Since v1.0, the **M-14 Mycobacteriology / TB Case Workbench FRS** has been written, and the **existing analyzer import channel** (M-14 §6 / M-04 §7) already does the work that the proposed module would duplicate: it ingests results, matches them to orders, lands them pre-populated, requires review/accept before they count, and routes unmatched results to *Admin → Stuck analyzer events*. GeneXpert, Truenat, and MGIT already ride that channel into `tb_molecular_result`.

**The core correction: TB-Profiler is one more analyzer profile on the existing flat-file plugin — not a new pipeline.** The flat-file plugin already provides the whole import path (watched folder, profile-driven field mapping, accession matching, pushing results onto the channel); TB-Profiler is configured as a profile on it, exactly like any polled-file analyzer. When you subtract what the flat-file plugin + M-14 already provide, the genuinely TB-Profiler-specific work is small:

1. **A MinION/TB-Profiler analyzer profile** (the field/QC/drug mapping in §9 *is* that profile). For the JSON format, the profile relies on a **general JSON reader built into the flat-file plugin** (a sibling to its CSV reader) that handles JSON-path + array-flatten rules declared in the profile (`dr_resistances[]→mutations[]`, `qc.target_median_depth.*`) — **not** a TB-Profiler-specific parser. The **`collate` CSV** path needs no new code at all (§3.5). No new folder-watcher, queue, or subsystem. (§1, §3.5, §7.1, §13 T-1)
2. **A sequencing-QC block** (`tb_sequencing_qc`) — the one real new data structure; Xpert-style QC doesn't carry depth/coverage/mapping/per-target depth. (§2.4, §13 T-3)
3. **Additive enum/field changes** on the existing M-14 molecular result: `assay = WGS_TBPROFILER`, a per-drug `INSUFFICIENT_COVERAGE` value, a place to park sub-threshold (heteroresistance) variants, and pipeline reproducibility fields (`db_version`/`commit`). (§3, §13 T-2/T-4/T-5)

**Decisions locked (2026-06-22):**
- **JSON parsing is a general capability of the flat-file plugin, not a TB-Profiler attachment.** The CSV reader already ships with the plugin; a JSON reader (path + array-flatten grammar, driven by the profile) is the same kind of general capability beside it. TB-Profiler then ships as a **profile only**, and the next JSON analyzer (SeqStudio/HIVdb, OGC-352, or any vendor JSON export) is *also* profile-only. (§7.1, §13 T-1)
- **"TB WGS DST" is modeled as one test.** The order carries a single analysis whose result is the structured `tb_molecular_result`; the per-drug calls, mutations, lineage, QC and classification are its contents (mirrors M-14's Xpert/LPA handling). One test can hold more than one result, so repeats/re-sequences land as additional results on the same test without remodeling. (§7.0)

Everything else falls out by **reuse**: the result lands as a `tb_molecular_result` (assay `WGS_TBPROFILER`) with mutations populating the existing `targets[]` substrate (§3); species ID and the NTM off-ramp are M-14 §4.4; **case-level MDR/Pre-XDR/XDR classification is *derived* by M-14 §4.6, not imported** (TB-Profiler's `drtype` is stored as the pipeline-reported value and reconciled against the derived one — §4); review/accept is the existing inline case-workbench molecular flow (M-14 §4.3/§4.6, D-005); WHONET/GLASS export defers to M-09 (§7.4).

> **Scoped out of this spec — general analyzer-import improvements (separate track).** The richer ideas in OGC-318/324/334 — a custom result-visualization preview (classification banner, per-drug mutation table, QC gauge cards), an import queue, and a manual-upload screen with a preview slot — are **not TB-Profiler-specific**. They are improvements to analyzer import *in general* and should be scoped as their own initiative, applied across all analyzer sources, *after* this spec lands. This spec deliberately does **not** depend on them; TB-Profiler ships on the existing channel, and benefits from those improvements later like every other source. (§7.3, §13 "General-import track")

Everything protocol-level in v1.0 — JSON/CSV field paths, QC thresholds, WHO classification definitions, drug→WHONET map, cross-resistance, alert rules, parser config, localization — **remains valid and is carried forward** (§2, §5, §6, §8, §9, §10). v1.0 was accurate about the *wire format*; this revision corrects only where the data *lands* and removes the redundant module around it.

---

## 1. Overview & data flow (unchanged from v1.0)

OpenELIS does **not** interact with MinION hardware or MinKNOW directly. It imports the structured output of TB-Profiler after bioinformatics analysis.

```
MinION (FAST5/POD5)  →  MinKNOW / Dorado (basecall, demux → FASTQ)
   →  TB-Profiler (map, call variants, predict resistance, lineage, QC)
       →  results/{sample}.results.json   (per-sample, full detail — PRIMARY)
       →  tb-profiler collate → batch CSV  (summary — SECONDARY)
           →  OpenELIS: watched-folder ingest → M-14 analyzer event channel
              → tb_molecular_result (assay = WGS_TBPROFILER), review/accept
              → M-14 reconciliation + classification → M-09 WHONET export
```

The MinION raw artifacts (FAST5/POD5/FASTQ) are **upstream inputs, out of scope** — OpenELIS never sees them. The reportable artifact is the TB-Profiler JSON (primary) or `collate` CSV (secondary).

### Two import formats

| Format | File | Use | Granularity |
|---|---|---|---|
| **JSON** (per-sample) | `results/{sample_id}.results.json` | Primary — full clinical detail | mutations, frequencies, depths, lineage, per-target QC |
| **CSV** (batch) | `tb-profiler collate` output | Secondary — batch surveillance | per-drug S/R/IC, lineage, top-level QC, mutation shorthand |

JSON is preferred for clinical reporting (carries the per-target `targets[]` substrate M-14 needs); CSV is a degraded path that cannot populate per-mutation depth/frequency and so lands a reduced `tb_molecular_result` (§3.5).

> **Format classification (per analyzer-mapping-spec Step 1).** The **`collate` CSV is a delimited flat file** — directly handled by the existing **flat-file plugin** with a TB-Profiler profile, no new parser. The **per-sample JSON is structured/nested**, so it isn't a delimited flat file; importing it at full fidelity means adding a **general JSON reader to the flat-file plugin** (a sibling to its CSV reader, driven by per-profile path/flatten rules) — the one engineering delta (§13, T-1), reused by any future JSON analyzer. Both paths reuse the same plugin's watched-folder + profile + accession-match + push machinery. This spec defines the data contract and the profile mapping; it does not prescribe how the JSON reader is implemented.

---

## 2. JSON per-sample output — field mapping (carried from v1.0, verified against samples)

Verified against the 8 attached sample files (`tbprofiler_25021900{01–07}*.json`, batch CSV). Top-level keys present in every sample: `id, timestamp, pipeline, sequencing, qc, main_lineage, sub_lineage, family, spoligotype, species, drtype, dr_resistances, other_variants, notes`.

### 2.1 Top-level → M-14

| JSON path | Example | M-14 destination |
|---|---|---|
| `id` | `2502190001` | **Accession number** → match to `Sample`/`Analysis` (the order). Unmatched → §12 / Stuck analyzer events |
| `timestamp` | `2025-02-19T09:45:23Z` | `tb_molecular_result.reported_at` |
| `species` | `Mycobacterium tuberculosis` / `Non-tuberculosis Mycobacterium` | `micro_isolate` species ID (MTB complex vs NTM, M-14 §4.4) |
| `drtype` | `MDR-TB` / `Sensitive` / `N/A` | **Pipeline-reported classification** — stored as metadata + preview banner; M-14 derives the authoritative case classification (§4, §7.4) |
| `main_lineage` / `sub_lineage` / `family` | `lineage2` / `lineage2.2.1` / `Beijing` | Epidemiological metadata — displayed, not a test result (M-14 §4.3) |
| `spoligotype` | `SIT1` | Epidemiological metadata (if present) |

### 2.2 Pipeline metadata → reproducibility audit

`pipeline.software`, `pipeline.version` (`6.3.0`), `pipeline.db_version` (`WHO-UCN-GTB-PCI-2023.5`), `pipeline.analysis_date`, `pipeline.commit` (`a8f3c2d`). Store on the `tb_molecular_result` for reproducibility/audit (analogous to M-14's `analyzer_software_version`; `db_version` and `commit` are **new fields** → §13 T-4).

### 2.3 Sequencing metadata → reagent/instrument tracking

`sequencing.platform` (`MinION`), `.instrument_id` (`MN42781`), `.flowcell` (`FLO-MIN114`), `.kit` (`SQK-RBK114.96`), `.basecaller` (`Dorado`), `.basecaller_version`, `.basecaller_model`. Maps to M-14 analyzer/instrument + M-12 reagent-lot tracking (flowcell + kit as consumable lots). Basecaller fields are sequencing-QC metadata (§2.4).

### 2.4 QC metrics → sequencing-QC structure (NEW — §13 T-3)

| JSON path | Example | Gate |
|---|---|---|
| `qc.num_reads` | `245678` | ≥ 50,000 (warn) |
| `qc.num_reads_mapped` | `234521` | — |
| `qc.pct_reads_mapped` | `95.46` | ≥ 90% warn; **< 10% reject (NTM/contam)** |
| `qc.median_depth` | `87` | **≥ 30x** warn; < 10x reject |
| `qc.genome_coverage_10x` | `98.7` | ≥ 95% |
| `qc.genome_coverage_30x` | `96.2` | **≥ 90% — primary gate** |
| `qc.mean_read_length` / `.median_read_length` / `.n50` | `4523` / `3876` / `6234` | quality indicators |
| `qc.target_median_depth.{gene}` | `112` (rpoB) | **≥ 30x per target**; below → that drug = `INSUFFICIENT_COVERAGE` |

M-14's molecular result has analyzer metadata but **no sequencing-QC home**. This is a genuinely-new structure (`tb_sequencing_qc`, 1:1 with the `tb_molecular_result`) — declared as **dependency T-3** (§13). It is the one real new data structure this integration adds; it backs the §6 QC gate (and any future general QC-visualization, §7.3).

### 2.5 Drug resistance array `dr_resistances[]` → `targets[]` + inferred resistance

Each element (14 drugs in every sample): `drug`, `status` (`Sensitive`/`Resistant`/`Insufficient coverage`), `mutations[]`. Verified MDR sample 0002: `rifampicin Resistant [rpoB p.Ser450Leu, freq 1.0, depth 145, "Assoc w R - High confidence"]`; `isoniazid Resistant [katG p.Ser315Thr]`; `ethambutol Resistant [embB p.Met306Val]`; remaining 11 Sensitive.

**Mapping to M-14 (§3.3):**
- Each `dr_resistances[].mutations[]` row → one `tb_molecular_result.targets[]` row: `gene`→`target`, `amino_acid_change`/`nucleotide_change`→`mutation_pattern`, plus `frequency`, `depth`, `who_confidence`. The drug it confers → `targets[].inferred_resistance` (drug FK + RESISTANT/SUSCEPTIBLE/INDETERMINATE).
- Each `dr_resistances[].status` → the per-drug **inferred resistance headline** for that drug. `Sensitive`→SUSCEPTIBLE, `Resistant`→RESISTANT, **`Insufficient coverage`→`INSUFFICIENT_COVERAGE`** (new enum value, §13 T-2).
- Rifampicin result also sets the M-14 `tb_molecular_result.rif_resistance` headline (drives the §4.8 critical).

#### Mutation detail fields (→ `targets[]` columns)
`gene`, `nucleotide_change` (`c.1349C>T`), `amino_acid_change` (`p.Ser450Leu`), `type` (missense/frameshift/promoter/rRNA), `frequency` (0.0–1.0), `depth`, `confidence` (high/moderate/low), `who_confidence` (`Assoc w R - High confidence`), `annotation`.

### 2.6 Other variants `other_variants[]` → sub-threshold store

Sub-threshold / heteroresistance variants below the reporting frequency. Verified sample 0006 (HR-TB): one `other_variants` row — `rpoB c.1349C>T / p.Ser450Leu, freq 0.23, depth 95, "Sub-threshold variant — possible heteroresistance or mixed population"`. These are **not** counted as resistance but **must be stored and surfaced** (heteroresistance is clinically important — emerging MDR). M-14 has no sub-threshold store today → **dependency T-5** (§13): either a flagged subtype of `targets[]` (`call = SUB_THRESHOLD`, not feeding inferred resistance) or a sibling `other_variants[]` collection on the molecular result. Recommended: a `targets[]` row flagged sub-threshold, so heteroresistance shows in the same table with a clinical-review flag.

---

## 3. How TB-Profiler maps onto the M-14 data model

### 3.1 One TB-Profiler sample = one `tb_molecular_result` (assay `WGS_TBPROFILER`)

A TB-Profiler JSON is a single molecular result on the TB case, keyed to the case/`sample_item`, with:
- `assay = WGS_TBPROFILER` (**new enum value** alongside M-14's `XPERT_MTB_RIF`/`XPERT_ULTRA`/`TRUENAT_*`/`LPA_*` — §13 T-2)
- `source = ANALYZER_AUTO` (file-watcher) or `MANUAL_ENTRY` (upload fallback)
- `mtb_detected` derived from `species` (MTB complex → DETECTED; NTM → see §3.6)
- `rif_resistance` from the rifampicin `dr_resistances` headline
- `targets[]` populated from all `mutations[]` across all drugs (§2.5), plus sub-threshold rows (§2.6)
- pipeline + sequencing + db version metadata (§2.2–2.3)
- a linked `tb_sequencing_qc` record (§2.4)

### 3.2 Why a molecular result, not a `micro_ast_run`

M-14 §3.2 reserves `micro_ast_run` + `interpretation_method = CRITICAL_CONCENTRATION` for **phenotypic** DST (growth/no-growth at a WHO critical concentration on MGIT/agar). WGS resistance is a **prediction from genotype**, not a phenotypic reading — it belongs with the other molecular assays (Xpert/LPA) in `tb_molecular_result`, exactly as M-14 §4.3 places LPA. WGS is essentially "LPA across the whole genome": many targets, many drugs, same shape.

### 3.3 The four "levels" of v1.0, re-homed

| v1.0 level | v1.0 plan | v2.0 home in M-14 |
|---|---|---|
| L1 — classification (`drtype`) | new top-level field | **derived** by M-14 §4.6; pipeline `drtype` stored as reported-value metadata (§4) |
| L2 — per-drug S/R | new per-drug store | `targets[]` per-drug `inferred_resistance` (§2.5) |
| L3 — mutation detail | structured comment / dedicated model | `targets[].mutation_pattern` + gene/freq/depth/who_confidence (§2.5) — the substrate M-14 §3.3 was built for |
| L4 — QC metadata | new QC block | `tb_sequencing_qc` (new, dependency T-3) |

### 3.4 Reuse-first audit (D-009)

- **Reuse (no new build):** the **existing analyzer import channel** (M-14 §6 / M-04 §7) for ingest/match/pre-populate/review/Stuck-events; `tb_molecular_result` + `targets[]`; `micro_isolate` species ID; M-14 §4.6 reconciliation + classification; M-11 criticals; M-12 lot tracking; M-09 export; optimistic lock + Envers audit; the existing inline review/accept flow.
- **Genuinely new — TB-Profiler-specific (declared as dependencies, §13):** JSON parser + watched-folder adapter for the channel (T-1); `WGS_TBPROFILER` assay + `INSUFFICIENT_COVERAGE` per-drug value (T-2); `tb_sequencing_qc` structure (T-3); pipeline `db_version`/`commit` reproducibility fields (T-4); sub-threshold/`other_variants` storage (T-5).
- **Out of scope — general analyzer-import improvements (separate track, §13):** custom result visualization, import queue, manual-upload preview-slot UI. Not built for, and not depended on by, this integration.

### 3.5 CSV (`collate`) path — pure flat-file profile, reduced result

The batch CSV (header verified, 35 cols: `sample_id, species, main_lineage, sub_lineage, family, drtype, <14 drug cols S/R/IC>, num_reads, pct_reads_mapped, median_depth, genome_coverage_30x, <7 *_mutations shorthand cols>, other_mutations, pipeline_version, db_version, analysis_date`) is a **plain delimited flat file** — the existing flat-file plugin handles it with the TB-Profiler profile and **no new parser code**. It lands a **reduced** `tb_molecular_result`: per-drug `inferred_resistance` from the drug columns, mutation **shorthand** (`rpoB_S450L`; `;`-separated; heteroresistance `rpoB_S450L(0.23;het)`) parsed into `targets[]` *without* per-variant depth/frequency, and top-level QC only (no per-target depth). Use for batch surveillance; **JSON is required for clinical release** because CSV cannot carry the per-target depth that gates `INSUFFICIENT_COVERAGE` or the variant frequency that gates heteroresistance. This is the JSON-vs-CSV fidelity tradeoff — the JSON parse step (T-1) buys the per-mutation/per-target detail the CSV omits.

### 3.6 NTM and species mismatch

Verified sample 0007: `species = "Non-tuberculosis Mycobacterium"`, `drtype = "N/A"`, `pct_reads_mapped = 2.91`, `dr_resistances = []`. Per M-14 §4.4, an NTM isolate **does not trigger the TB-DST cascade**. The import sets the isolate species to NTM, stores QC only, raises the NTM flag, and imports **no resistance results**. A `pct_reads_mapped < 10%` is auto-rejected as non-MTB (§6.1) regardless of the `species` string.

---

## 4. WHO resistance classification — derived by M-14, reconciled against the pipeline

The WHO 2021 definitions and the parser logic from v1.0 §4 are unchanged and correct:

| Class | Definition |
|---|---|
| Sensitive | susceptible to all first/second-line |
| RR-TB | rifampicin-R (any) |
| HR-TB | isoniazid-R, rifampicin-S |
| MDR-TB | rifampicin-R **and** isoniazid-R |
| Pre-XDR-TB | MDR + any fluoroquinolone-R |
| XDR-TB | MDR + FQ-R + (bedaquiline-R and/or linezolid-R) |

**Authority change in v2.0:** the **case-level classification is derived by M-14 §4.6** from the reconciled per-drug picture across *all* evidence (WGS molecular + any phenotypic DST + Xpert/LPA), not taken from `drtype`. The pipeline's `drtype` is stored as the **pipeline-reported** value and shown on the preview banner; if it disagrees with M-14's derived classification (e.g. because a phenotypic DST result also exists), that **discordance is a §4.6 reconciliation flag** for supervisor attention. For a WGS-only case they will normally agree, and `drtype` is a useful cross-check that the parser mapped every drug correctly.

---

## 5. Drug → WHONET map & cross-resistance (unchanged from v1.0 §5)

14 drugs → WHONET codes: rifampicin RIF, isoniazid INH, ethambutol EMB, pyrazinamide PZA, streptomycin STR, fluoroquinolones FLQ, amikacin AMK, kanamycin KAN, capreomycin CAP, ethionamide ETH, linezolid LZD, bedaquiline BDQ, clofazimine CFZ, delamanid DLM. Organism → `mtu`. (Full gene/WHO-group table in v1.0 §5; carried forward verbatim.)

**Cross-resistance** (TB-Profiler encodes these, but verify they survive into M-14's per-drug inferred resistance): inhA promoter → isoniazid **and ethionamide**; Rv0678 → bedaquiline **and clofazimine**; rrs A1401G → amikacin **+ kanamycin + capreomycin**. These are drug-level inferences M-14 should carry as separate `inferred_resistance` rows from the shared mutation, not silently fold together.

---

## 6. QC validation rules (unchanged from v1.0 §6; gate now lives at M-14 review)

### 6.1 Sample-level gates
`pct_reads_mapped` ≥ 90% (warn) / < 10% reject as non-MTB · `median_depth` ≥ 30x (warn) / < 10x reject · `genome_coverage_30x` ≥ 90% (warn) · `num_reads` ≥ 50,000 (warn).

### 6.2 Per-target
`target_median_depth.{gene}` ≥ 30x else that drug = **Insufficient coverage (IC)**; < 10x cannot call.

### 6.3 Variant-level
frequency ≥ 0.75 → Resistant · 0.25–0.74 → **heteroresistance, clinical-review flag** · < 0.25 → `other_variants` only · variant depth < 10 reads → unreliable. WHO confidence High → call; Moderate → call with note; Low/Uncertain → report variant, do not call resistance.

**Where the gate runs:** QC is evaluated at import (from the `tb_sequencing_qc` block, T-3) and enforced at review/accept in the case workbench. A **QC fail blocks Accept** until resolved — a failed run cannot be accepted as reportable results (M-14 §6). The QC *visualization* (gauges/badges) is a general-import improvement (§7.3), not required for the gate itself.

---

## 7. Integration — a flat-file-plugin profile on the existing channel (replaces v1.0 §7)

### 7.0 Result routing & matching — how a file finds its order and test

TB-Profiler output carries **no LOINC and no test code** — only the sample `id` and the per-drug results. Routing is therefore *not* by an in-message LOINC:

- **Which order/patient → by accession.** `id` → OpenELIS accession/`Sample` (and its TB case). Same as every push on the channel.
- **Which test the result satisfies → by the analyzer profile's source→test binding,** set once at setup (the "Verify" step), not by a code in the file. The flat-file profile binds the TB-Profiler source to the ordered **TB WGS / molecular-DST test**, so a file from this source = that test's result on the matched accession. **LOINC's role is at the catalog/config level** — the ordered TB WGS test should carry a LOINC so it's identifiable on the report and for FHIR/GLASS, and so the verify-first step can 1:1-match it to the lab's catalog. LOINC is used once to bind, **never per drug**.
- **The 14 drugs → by WHONET antibiotic identity, not LOINC.** They are the structured contents of the molecular result (`targets[].inferred_resistance`) and line up with the reflex-ordered **DST drug panel** by drug identity, feeding the M-14 §4.6 reconciliation.

> **Decision (locked 2026-06-22): one test.** "TB WGS DST" is a **single** orderable test whose result is the structured `tb_molecular_result` (drugs as contents) — mirrors how M-14 handles Xpert/LPA. The 14 drugs are *not* 14 separate analyses; they're facets of one sequencing assay (you can't sequence "just rifampicin"). This means one thing to order, one status, one TAT clock, and one report line that expands to per-drug detail — yet the per-drug calls are still stored individually, so they reconcile drug-by-drug against any phenotypic DST (§4.6) and the WHONET export still emits per-drug columns. A test can carry **more than one result**, so a repeat/re-sequence lands as an additional result on the same test (preserving the prior, §12) rather than a new test. (Contrast: phenotypic DST stays a per-drug `micro_ast_run`, M-14 §3.2 — there each drug genuinely is a separate growth reading.)

### 7.1 Ingest — the existing flat-file plugin, fed by a watched folder

TB-Profiler writes `results/*.results.json` (and optional `collate` CSV) to a folder OpenELIS watches. The **existing flat-file plugin** polls that folder and applies the **MinION/TB-Profiler profile** (§9) — the same way it handles any polled-file analyzer; the CSV path uses the plugin's CSV reader, the JSON path uses the plugin's **general JSON reader** (T-1) — both configured by the profile, no TB-specific code. It hands each result to the **analyzer import channel** GeneXpert/Truenat/MGIT already push through (M-14 §6 / M-04 §7), which does the rest unchanged: match `id`→accession, land the result **pre-populated** on the case, and route an unmatched `id` to **Admin → Stuck analyzer events** — never silently dropped. There is **no new import module and no import queue**; the plugin's watched folder + the channel's pending/review/Stuck-events model *are* the queue.

### 7.2 Review / accept — the existing inline case-workbench flow

Imported WGS results land **pre-populated and pending** and do not auto-finalize — exactly as M-14 §6 / M-05 §5.6 already specify for pushed molecular results. The tech reviews and accepts them in the **existing inline molecular section** of the TB Case Workbench (M-14 §4.3 → §4.6), per-drug, with the same accept/override/retest machinery used for Xpert/LPA. No second review surface and no separate "Analyzer Results" page are introduced by this spec. (A general accept/retest UX improvement, if pursued, belongs to the general-import track — §7.3 — and would apply to every source, not just WGS.)

### 7.3 What this spec does NOT build — the general analyzer-import track

The richer ideas attached to OGC-318/324/334 are **general analyzer-import improvements, not TB-Profiler work**, and are deliberately excluded here so this integration ships on the existing channel:

- a **custom result-visualization preview** (classification banner, per-drug mutation table, QC gauge cards);
- an **import queue** UI;
- a **manual-upload screen with a preview-slot framework**.

Each of these, if valuable, improves *all* analyzer sources and should be scoped as its own initiative applied across the board — *after* this spec lands. This integration does not depend on any of them; when they ship, WGS benefits like every other source. The `tb_sequencing_qc` data (T-3) is captured regardless, so a future QC visualization has data to render.

### 7.4 Species ID, classification, export (all M-14 reuse)

- **Species ID (M-14 §4.4):** `species` sets the `micro_isolate` identification (MTB complex vs NTM); NTM off-ramps the TB-DST cascade (§3.6).
- **Reconciliation + classification (M-14 §4.6):** per-drug WGS inferred resistance feeds the existing reconciliation row alongside any phenotypic DST / Xpert / LPA; the case MDR/Pre-XDR/XDR classification is **derived** there. Discordant rows — including WGS `drtype` vs the derived classification (§4) — flag for supervisor review and block final release until resolved.
- **Criticals (M-14 §4.8 / M-11):** rifampicin-R already fires an M-11 critical; **add BDQ-R and LZD-R triggers** for BPaL eligibility (T-6).
- **WHONET / GLASS export (M-14 §7, M-09 owns it):** this integration supplies organism `mtu`, per-drug S/R (blank for IC), `GENOTYPE` = lineage + sub-lineage, `MECHANISM` = mutation shorthand, `METHOD` = `WGS`. **M-09 must add the `WGS` method value and `GENOTYPE`/`MECHANISM` columns** (T-7). GLASS/consolidated-FHIR central reporting is **out of scope** (M-14 §7).

---

## 8. Alert rules (unchanged from v1.0 §8; routed through M-11)

MDR-TB+ → notification · Pre-XDR → urgent · XDR → critical · bedaquiline-R and/or linezolid-R → **critical (BPaL eligibility)** · heteroresistance → clinical-review flag · NTM / `pct_reads_mapped`<10% → not-MTB flag · multiple IC → re-sequence. These route through **M-14 §4.8 / M-11** (rifampicin-resistance already a defined M-11 critical trigger); BDQ/LZD criticals are **new triggers** to add to the M-11 TB trigger set.

---

## 9. Parser configuration schema (unchanged from v1.0 §9)

The JSON and CSV parser-config blocks from v1.0 §9 are carried forward verbatim (field_mapping, qc_field_mapping, resistance/mutation mappings, qc_thresholds, variant_thresholds, status_values, drug_whonet_mapping; CSV column maps + mutation separator/het tag). The config-driven design stands: **TB-Profiler version changes are config updates, not code changes.** Two adjustments for v2.0: add `assay_code: "WGS_TBPROFILER"` and a `source_channel: "file_watcher" | "upload"` field so the parser stamps the M-14 assay value and ingest path.

---

## 10. Localization (unchanged from v1.0 §10 + OGC-334 keys)

v1.0 §10 `label.tb.*` keys (classification, IC, heteroresistance, NTM, QC, WHO confidence, BPaL, lineage, etc.) carry forward. The OGC-334 preview component adds `label.tbprofiler.*` and `label.review.*` keys. **Consolidation note:** v1.0 used `label.tb.*`, OGC-334 uses `label.tbprofiler.*` for overlapping concepts (classification, QC). Pick one namespace before build to avoid duplicate keys — recommend `label.tbprofiler.*` for the preview and `label.tb.*` for case-workbench-shared TB terms, with no concept defined in both.

---

## 11. Test data inventory (verified)

All 8 files parse to the v1.0 §11 expectations. Confirmed: 0001 pan-susceptible (lineage4/Haarlem, 87x, all S); 0002 MDR (Beijing, rpoB S450L + katG S315T + embB M306V); 0003 Pre-XDR (+ gyrA D94A + pncA, BPaL-eligible); 0004 XDR (+ rplC + Rv0678, BDQ/CFZ cross-resistance); 0005 low-QC (8x, many IC); 0006 heteroresistance (rpoB S450L at 0.23 in `other_variants`, drtype HR-TB); 0007 NTM (2.91% mapped, drtype N/A, no dr calls); batch CSV (all 7, header verified §3.5).

---

## 12. Error handling (unchanged from v1.0 §12; mapped to M-14)

JSON parse failure → reject (`label.error.invalidJson`) · missing `id` → reject · `id` unmatched → **Stuck analyzer events** (M-14 §6), not a silent drop · missing `dr_resistances` → reject · unknown drug → accept + flag · NTM/blank species → QC-only, NTM flag · `pct_reads_mapped`<10% → auto-reject non-MTB · `median_depth`<10x → auto-reject, re-sequence · all-IC → metadata only, flag · **duplicate `id` → accept most recent by timestamp as a new version, preserve the prior (D-002 no-delete / M-14 amendments preserve originals)** · unknown pipeline version → accept + warn · missing QC fields → accept + warn.

---

## 13. Dependencies (D-009)

### TB-Profiler-specific — required for this integration

| # | Dependency | Owner | Notes |
|---|---|---|---|
| **T-1** | **General JSON reader built into the flat-file plugin** (sibling to its CSV reader) + a **MinION/TB-Profiler profile** that drives it (CSV path = profile only) | Engineering | The new code is a *general* JSON-path + array-flatten capability in the plugin, configured per-profile — **not** a TB-Profiler parser. TB-Profiler ships as a profile; SeqStudio/HIVdb (OGC-352) and any future JSON analyzer reuse the same reader as profiles. Reuses the plugin's watched folder + accession-match + push; not a new module/queue/watcher. |
| **T-2** | `tb_molecular_result.assay = WGS_TBPROFILER` enum + per-drug `INSUFFICIENT_COVERAGE` value | M-14 / Micro module | Additive enum values on existing structures. |
| **T-3** | `tb_sequencing_qc` structure (reads, depth, coverage, per-target depth) 1:1 with the molecular result | M-14 / Micro module | The one real new data structure; backs the QC gate and any future QC visualization. |
| **T-4** | Pipeline reproducibility fields (`db_version`, `commit`) on the molecular result | M-14 / Micro module | Beyond existing `analyzer_software_version`. |
| **T-5** | Sub-threshold / `other_variants` storage (heteroresistance) | M-14 / Micro module | Recommend a `targets[]` row flagged `SUB_THRESHOLD`, not feeding inferred resistance. |
| **T-6** | M-11 TB critical triggers add BDQ-R and LZD-R (BPaL) | M-11 | Rifampicin-R already a trigger; add BDQ/LZD. |
| **T-7** | WHONET TB export: `METHOD=WGS`, `GENOTYPE`, `MECHANISM` columns | M-09 | Export format is M-09's; this spec supplies the values. |

### General analyzer-import improvements — NOT this spec (separate track)

These improve analyzer import for **all** sources and should be scoped as their own initiative, applied across the board. This integration does not depend on any of them.

| # | Improvement | Origin | Notes |
|---|---|---|---|
| **G-1** | Custom result-visualization preview (classification banner, per-drug mutation table, QC gauges) | OGC-334 | Useful for WGS *and* other rich results; build as a view over the stored result, source-pluggable. |
| **G-2** | Import-queue UI | OGC-318/324 | Redundant with the channel's existing pending/review/Stuck-events model; only build if a cross-source queue view adds value. |
| **G-3** | Manual-upload screen + preview-slot framework | OGC-324/334 | An offline fallback for sites without a pipeline mount; a general capability, not TB-specific. |
| **G-4** | Source-agnostic pipeline-import alignment with SeqStudio/HIVdb | OGC-352 | Same pattern (JSON source on the channel). Share the T-1 adapter; resistance *stores* differ (TB → `tb_molecular_result`; HIV → its own molecular result, different organism/drug classes). |

---

## 14. Open questions

1. **Watched-folder path & permissions:** where does the TB-Profiler host write `results/`, and can OpenELIS mount/watch it at the PNG/CPHL site? (If not, a manual-upload fallback becomes a real prerequisite — but that's the general-import track G-3, not TB-specific.)
2. **`db_version`/`commit` audit retention:** stored on every result, or once per run/batch?
3. **CSV clinical release (§3.5):** confirm CSV is surveillance-only and never the basis for a clinical release, or define the reduced-confidence handling if it can be.
4. **Localization namespace (§10):** confirm `label.tbprofiler.*` vs `label.tb.*` split before build.
5. **Spoligotype:** store when present, or drop? (Epidemiological only; not in every sample.)
6. **General analyzer-import revamp (G-1…G-4):** Casey has a revamp in progress; the plan is to take it up as a cross-source initiative **after** this spec lands (parked in `ideas-backlog.md`). The general JSON reader (T-1) and `tb_sequencing_qc` (T-3) are built so that revamp can render/extend them later.

---

## 15. References

- **M-14 Mycobacteriology / TB Case Workbench FRS** — §3.3 (`tb_molecular_result` + `targets[]`), §4.3 (molecular section by assay), §4.4 (species ID/NTM), §4.6 (reconciliation + classification), §4.8 (M-11 criticals), §6 (analyzer event channel, no manual import), §7 (M-09 WHONET / GLASS out of scope).
- **OGC-318** — MinION/TB-Profiler Pipeline Result Import (this spec's v1.0 home; field-mapping doc + 8 sample files attached).
- **OGC-334** — TB-Profiler Custom Preview Component → re-scope to the **general-import track** (G-1): a result visualization over the stored result, source-pluggable, not TB-only and not bolted to an upload page.
- **OGC-324** — Analyzer File Upload (preview-slot framework; file watcher; import queue) → **general-import track** (G-2/G-3); not a dependency of this integration.
- **OGC-352** — SeqStudio / HIV drug resistance: same pattern (a JSON source on the channel). Share the T-1 adapter (G-4); resistance store differs.
- **OGC-899** — PNG Phase II umbrella (deployment routing for this round).
- TB-Profiler: https://github.com/jodyphelan/TBProfiler · WHO Catalogue 2023.
- Design decisions honored: D-002 (no delete), D-005 (inline not modal), D-009 (reuse / declare new), D-027 (Analyzers IA / routes).
