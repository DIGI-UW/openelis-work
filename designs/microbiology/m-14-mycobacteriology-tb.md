# M-14 Mycobacteriology / TB Case Workbench — Functional Requirements Specification

**Version:** 1.0 (canonical — inline interactions per Principle 3; reuses the M-04 Case/Isolate/Timeline substrate; no separate addendum)
**Date:** 2026-06-08
**Module:** Microbiology → Case Workbench → TB (a specialized case profile of M-04)
**Route:** `/microbiology/case/:caseId` (TB profile; same route family as M-04)
**Phase:** MVP-1A (smear, molecular, culture, species ID, interim reporting) + Phase 1A+ (analyzer ingest, second-line cascade)
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

> Self-contained. Key decisions written inline: **TB is its own workbench profile, not a bacterial case** (different timeline length, molecular-first ordering, species ID, and a drug-susceptibility method that is *not* CLSI/EUCAST clinical S/I/R — §1, §3); the workbench **reuses the existing M-04 Case / Isolate / Timeline shape, the reflex/test-rules cascade, M-08 macros, M-11 critical notify, M-12 reagent lots, and optimistic locking** rather than inventing parallel structures (§3, §10); **drug-susceptibility testing reuses `micro_ast_run` + result rows with `interpretation_method = CRITICAL_CONCENTRATION`** rather than a parallel DST table — flagged as a data-model decision (§3.2); the only genuinely new entities are `tb_smear` and `tb_molecular_result` (§3.3, flagged explicitly); all data entry is **inline section/row expansion, not pop-up modals** (Principle 3). **GLASS / consolidated-FHIR central reporting is out of scope of this FRS** (being designed separately as the final step); TB results are exportable via the M-09 WHONET TB export (§7).

---

## 1. Lab Context

**Current State.** Tuberculosis (TB) work is run on a separate bench from routine bacteriology and on a much longer clock. A specimen (usually sputum) is decontaminated, then put through several tests that report out over weeks: an **acid-fast bacilli (AFB) smear** read same-day (Ziehl-Neelsen [ZN] or fluorescence microscopy, graded against the World Health Organization [WHO] scale); a **rapid molecular** test same-day (GeneXpert MTB/RIF or Ultra, or Truenat) that says whether *Mycobacterium tuberculosis* (MTB) DNA is present and whether rifampicin resistance is detected; a **culture** on solid (Löwenstein-Jensen [LJ]) or liquid (Mycobacteria Growth Indicator Tube [MGIT]) media that can take **up to 6-8 weeks** to turn positive or be called negative; a **species identification** to separate the *M. tuberculosis* complex from non-tuberculous mycobacteria (NTM); and **drug-susceptibility testing (DST)** — phenotypic at WHO critical concentrations and/or molecular by Line Probe Assay (LPA). Today each stage is a paper register entry and an instrument printout, reconciled by hand, with results phoned out as they come.

**Pain.** No single record follows a TB specimen across the weeks from smear to DST; the bench reconstructs "where is this case" from registers and the GeneXpert log each time. The clinically urgent results — a positive smear and a rifampicin-resistance call — are the ones most likely to be delayed in a paper flow. Phenotypic DST is recorded as raw "growth / no growth at the critical concentration" with no structured Resistant/Susceptible call, and there is no clean place to **reconcile** the molecular resistance prediction (from GeneXpert/LPA) against the phenotypic result, nor to classify the case (multidrug-resistant [MDR] / pre-extensively-drug-resistant [pre-XDR] / extensively-drug-resistant [XDR]). The bacterial Case Workbench (M-04) doesn't fit: its timeline assumes days, its susceptibility model assumes clinical MIC-to-S/I/R interpretation, and it has no smear / molecular / species-ID stages.

**What Changes.** A TB case becomes a first-class **Case** (the same record as M-04) with a **long, staged timeline** the system keeps automatically and **interim reports at each stage**: smear out same-day → molecular (MTB ± rifampicin resistance) out same-day → culture positivity weeks later → species ID → DST weeks after that. Each stage reports out on its own; the smear-positive and rifampicin-resistance results fire an immediate critical notification (M-11). Phenotypic DST is recorded as a structured **Resistant / Susceptible call at a stated WHO critical concentration**, reconciled inline against the molecular prediction, and the case is auto-classified (mono / poly / MDR / pre-XDR / XDR). No paper register, no hand reconciliation; results are exportable to surveillance via M-09.

---

## 2. Overview

### 2.1 Purpose
The TB Case Workbench is a **profile of the M-04 Case** for mycobacteriology: one record per specimen, with a TB-shaped lifecycle (state machine), the M-04 timeline, zero-or-many isolates (the cultured MTB-complex/NTM isolate), zero-or-many DST runs per isolate, and one-or-more interim/final report versions. It is *not* a new page — it is the M-04 Case Detail page rendered with TB sections (smear, molecular, culture, species ID, DST) instead of bacterial sections, **keyed off the case's `workflow_type = MYCOBACTERIOLOGY_TB`** (set from the ordered test's Culture-workflow designation, M-03 §2.1a; its default Method is a TB culture Method, §3.1 / M-04 §8). A case mis-routed or left `UNASSIGNED` can be moved into (or out of) the TB profile by the tech via M-04 *Change workflow*.

### 2.2 Why TB is its own workbench (differences from M-04)
A reader should understand why this is a distinct profile and not just "a bacterial case":

| Dimension | M-04 bacterial case | M-14 TB case |
|---|---|---|
| **Timeline length** | Days (positive signal → ID → AST → report) | **Weeks** — culture up to 6-8 weeks; DST weeks beyond that; many interim reports |
| **Ordering** | Culture-first; AST after organism ID | **Molecular-first** — smear + GeneXpert/Truenat same-day, *before* culture is back; results drive empiric therapy |
| **Susceptibility method** | Clinical MIC/zone → **S/I/R** vs CLSI/EUCAST breakpoints (M-05) | **Resistant/Susceptible at a WHO critical concentration** (phenotypic) + **molecular resistance** (Xpert/LPA mutations) — *not* a clinical MIC interpretation |
| **Organism step** | Identify the organism, set up AST | **Species ID** — MTB complex vs NTM (MPT64 antigen / molecular); NTM diverts off the TB-DST path |
| **Critical results** | Phenotype-driven (e.g. carbapenemase) | **Smear-positive** and **rifampicin-resistance** — urgent the same day, before culture |
| **Classification** | Per-drug S/I/R on the report | Whole-case **resistance pattern**: mono / poly / MDR / pre-XDR / XDR |

Everything else — the Case record, isolates, the auto-logging timeline, optimistic locking, macros, critical-notify, reagent lots, the reflex cascade — is **reused unchanged** (§3, §10).

### 2.3 Surfaces (inline, not modals)
All TB data entry renders as **inline panels/rows within the Case Detail sections** (Carbon row/section expansion), reachable from the Worklist (M-07). Per Principle 3 there are **no pop-up modals**; modals are reserved only for destructive confirmations (e.g. invalidate a contaminated culture). Smear grading, molecular result entry, LPA mutation capture, species ID, and DST entry are all inline.

### 2.4 Users
| Role | Primary actions |
|------|-----------------|
| TB / Mycobacteriology Technician | Specimen processing, smear grading, molecular result entry (or analyzer review), culture read, species ID, DST entry, interim release |
| Microbiology Supervisor | Review/accept results, reconcile molecular vs phenotypic, release final, authorize amendments, override a contaminated/QC-fail call |
| Lab Manager | Full access; reclassification of a finalized case |

### 2.5 Integration
- **M-00** parent (module scope; reflex-vs-workbench-vs-phenotype division of responsibility).
- **M-01 Reference Data** — TB drug list (isoniazid, rifampicin, ethambutol, pyrazinamide; fluoroquinolones, injectables, bedaquiline, linezolid, etc. as `antibiotic_master` rows), MTB-complex / NTM species (`organism_master`), TB DST panels (`ast_panel`), TB culture protocol (a Method, §3.1).
- **M-02 Breakpoint Catalog** — **WHO-TB critical concentrations** come from a **new WHO-TB standard type** in M-02 (assumed to exist; referenced here). The DST lookup is keyed by drug + medium (MGIT / agar proportion) → the critical concentration, snapshotted on the run.
- **M-04 Case Workbench Core** — the Case / Isolate / Timeline / state-machine substrate; this FRS specializes it.
- **M-05 AST Entry & Interpretation** — DST **reuses** `micro_ast_run` + result rows and the inline-entry / override / accept patterns, with `interpretation_method = CRITICAL_CONCENTRATION` instead of breakpoint S/I/R (§3.2).
- **M-06 Expert/Reflex** — the reflex/test-rules engine drives the TB cascade (§3.4).
- **M-08 Macro Library** — macro-enabled comment/justification fields (smear comments, contamination notes, DST justifications).
- **M-09 WHONET Export** — TB report results (smear, Xpert, culture, species, DST) are exportable via the WHONET TB export; M-09 owns the export (§7).
- **M-11 Critical-Result Acknowledgment** — smear-positive and rifampicin-resistance criticals logged from the header / isolate tiles (`target_type = CASE` / `ISOLATE`).
- **M-12 Test → Reagent Linkage** — reagent/kit lot selection (decontamination reagents, ZN/auramine stains, GeneXpert cartridges, LPA kits, MGIT tubes, LJ slopes) with FIFO + QC, expired/locked blocked.

---

## 3. Data model

### 3.1 Reuse the M-04 case substrate (no parallel structures)
A TB case is a `micro_case` (**keyed to `sample_item_id` + `workflow_type = MYCOBACTERIOLOGY_TB`**, M-04 §2A/§8) whose `culture_protocol` resolves to a **TB Method** (extends the existing `method` entity per M-04's culture-protocol reuse decision: long `incubation_hours` for MGIT/LJ, media via `method_reagent`). Because the key is the **`SampleItem`**, a TB case and a bacterial case can coexist on the **same physical specimen** (one sputum) without a second accessioning — they share the `sample_item_id` and surface each other via the §4.1a sibling chip. The cultured organism is a `micro_isolate` (versioned). The activity log is the **M-04 Timeline layered on the existing History/Note infrastructure** — *not* a new TB log. Stage transitions write the existing `micro_case_stage_transition`. Concurrency reuses the existing **optimistic lock** (`@Version`/`lastupdated`). All of this is unchanged from M-04.

### 3.2 DST reuses `micro_ast_run` (data-model decision — flagged)
**Decision:** TB phenotypic DST is modelled on the existing **`micro_ast_run`** header + per-drug rows in the existing `result` table (M-05 §3), **not** a parallel `tb_dst` table. The fit is good because a DST run is conceptually an AST run: one isolate, a drug panel, a reagent lot, a status lifecycle, analyzer metadata, override/accept, and retest-as-new-run — all already in `micro_ast_run`. The **only difference is the interpretation method**:

- `micro_ast_run.method` carries the technique: `MGIT_DST` or `AGAR_PROPORTION` (phenotypic), or `LPA_FIRST_LINE` / `LPA_SECOND_LINE` (molecular, which lands as a `tb_molecular_result`, §3.3, and is *summarized* onto the run for reconciliation).
- A new **`interpretation_method` enum value `CRITICAL_CONCENTRATION`** (alongside M-05's `BREAKPOINT`) tells the entry UI and lookup that the result is **Resistant / Susceptible at a critical concentration**, not S/I/R against a clinical MIC breakpoint.
- Each per-drug reading records: `result` (R / S — and `R/S indeterminate` / `contaminated` / `not done`), the **critical concentration tested** (`critical_concentration` numeric + unit, snapshotted from the WHO-TB standard in M-02), the **medium** (MGIT / agar proportion), and `source` (ANALYZER_AUTO / MANUAL_ENTRY / OVERRIDE) — the same multi-reading + override + audit machinery as M-05.
- The run snapshots `breakpoint_standard_id` + `breakpoint_version` pointing at the **WHO-TB standard** (M-02), exactly as a bacterial run snapshots CLSI/EUCAST.

> **Flagged for review:** this reuses M-05's tables with an added `interpretation_method = CRITICAL_CONCENTRATION` and a few TB columns on the DST reading (`critical_concentration`, `medium`). If the review prefers a thin specialized DST view it can be a projection over the same rows; we deliberately do **not** create a second susceptibility store.

### 3.3 New TB-specific entities (genuinely new — flagged) — but reuse coded results first

> **⚑ REUSE-FIRST (verify before building these tables).** OpenELIS already stores coded clinical values as **dictionary results** (`result` rows with result type **`D` = Dictionary`**, against a `TestResult`/dictionary vocabulary — confirmed in the codebase, `TypeOfTestResultServiceImpl.ResultType`). Much of what these two tables hold is exactly that:
> - **AFB smear** — `stain_method` and the WHO **grade** (NEGATIVE/SCANTY/1+/2+/3+) are textbook **coded results**. The smear can very likely be a standard `Analysis`+`Result` on an "AFB smear" Test with dictionary-coded values (grade), a numeric/optional `scanty_count`, and a macro comment — **no `tb_smear` table** — reusing entry, audit, history, and reporting for free.
> - **Molecular** — the headline calls (`mtb_detected`, `rif_resistance`, per-drug `inferred_resistance`) are equally coded results. The part that does *not* fit a single coded result is the **per-target `targets[]` substrate** (rpoB/katG/… each with WT/mutant call + mutation pattern) and the Ultra **semi-quant** band — that's genuinely multi-valued and is the real justification for *any* new structure.
>
> **Decision for build:** model smear and the molecular *headline* values as **dictionary-coded results on Tests** (reuse), and only introduce a thin new structure for the **molecular `targets[]`** rows that have no coded-result home (mirror the M-05 multi-reading approach if it lands). Treat the `tb_smear` / `tb_molecular_result` tables below as the **fallback design** if the coded-result path can't carry them — a **verification dependency**, not a settled schema. This keeps M-14 consistent with the module's data-reuse MUST.

Two stages have limited analogue in M-04. The structured records below are the **fallback** shape (build only the parts that coded results can't carry — see the reuse note above):

```
tb_smear                                                   (NEW)
├── smear_id (PK)
├── micro_case_id (FK)              · sample_item_id (FK, the processed aliquot)
├── stain_method (enum: ZN, FLUORESCENCE_AURAMINE)
├── grade (enum, WHO scale: NEGATIVE, SCANTY, ONE_PLUS, TWO_PLUS, THREE_PLUS)
│        SCANTY records an exact count when entered (e.g. "1-9 AFB / 100 fields")
├── scanty_count (text, nullable)   · fields_examined (nullable)
├── result_comment (text, macro `tb`)
├── source (MANUAL_ENTRY | ANALYZER_AUTO for digital-microscopy/LED readers)
├── read_by, read_at                · is_critical (derived: grade ≠ NEGATIVE)
└── audit columns                                          (Envers @Audited)

tb_molecular_result                                        (NEW)
├── molecular_id (PK)
├── micro_case_id (FK)              · sample_item_id (FK)
├── assay (enum: XPERT_MTB_RIF, XPERT_ULTRA, TRUENAT_MTB, TRUENAT_RIF,
│        LPA_FIRST_LINE, LPA_SECOND_LINE)
├── mtb_detected (enum: DETECTED, NOT_DETECTED, INVALID, ERROR, NO_RESULT)
│        Ultra adds a semi-quant: TRACE / VERY_LOW / LOW / MEDIUM / HIGH (nullable)
├── targets[]   (per-target rows — the molecular substrate)
│     ├── target (enum/text: rpoB, katG, inhA, gyrA, rrs, eis, …)
│     ├── call (enum: WT_PRESENT, WT_ABSENT, MUTATION_DETECTED, INDETERMINATE)
│     ├── mutation_pattern (text, nullable — e.g. "rpoB MUT3 / WT absent")
│     └── inferred_resistance (enum: RESISTANT, SUSCEPTIBLE, INDETERMINATE, drug FK)
├── rif_resistance (enum: DETECTED, NOT_DETECTED, INDETERMINATE)   ← Xpert/Truenat headline
├── reagent_lot_id (FK via M-12 — cartridge / LPA kit)
├── analyzer_instrument_id, analyzer_software_version (nullable — GeneXpert/Truenat push)
├── source (ANALYZER_AUTO | MANUAL_ENTRY)
├── reported_by, reported_at        · is_critical (derived: rif_resistance = DETECTED)
└── audit columns                                          (Envers @Audited)
```

The **`tb_molecular_result.targets[]`** rows are the LPA/Ultra mutation substrate: each band/probe is one target with its wild-type/mutant call, the reported **mutation pattern**, and the **inferred resistance** per drug. An LPA first-line run produces rpoB/katG/inhA targets → inferred rifampicin / isoniazid resistance; second-line produces gyrA/rrs → inferred fluoroquinolone / injectable resistance. The headline `rif_resistance` mirrors the GeneXpert printout.

Species ID needs **no new entity**: it is the existing `micro_isolate` identification (M-04 §4.4 / §6), with `organism_id` set to an MTB-complex or NTM species from `organism_master` and `method` = `MPT64_ANTIGEN` / `MOLECULAR` / `LPA`. NTM diverts the case off the TB-DST path (§4.4).

### 3.4 Cascade via the existing reflex/test-rules engine (no new orchestrator)
The staged TB workflow is driven by the **existing reflex/test-rules engine** (M-06 §1.2 / M-04 §8), not a bespoke TB orchestrator:
- **smear-positive → reflex orders GeneXpert** (if not already ordered).
- **GeneXpert MTB DETECTED → reflex orders culture + (on positivity) DST**, against the organism's default TB DST panel (M-01), exactly as bacterial AST is reflex-ordered from the organism default (M-06 §1.2).
- **rifampicin-resistance DETECTED (Xpert/LPA) → reflex orders second-line LPA / second-line phenotypic DST.**
Each reflex fires an `OrderAction` through the existing test-rules action API. The Case Workbench owns *workup state*; the reflex engine owns *what-to-order-next*; M-02 owns the *critical concentrations*. This is the same division stated in M-00 / M-06.

---

## 4. TB Case Detail — sections (inline)
Same M-04 page shell (left SideNav with state-machine progress dots, scrollable main column, sticky footer, stage-keyed next-step banner, opens focused on the current step). TB renders these sections in place of the bacterial AST flow.

### 4.1 Specimen processing — reuse the existing aliquoting workflow
Decontamination/concentration of the raw specimen into a processed aliquot **is an aliquot**, so it **reuses OpenELIS's existing sample-management aliquoting workflow — it does not invent a TB-specific derived sample.** Saving "Record processing" calls the existing **`CreateAliquot`** path: it creates a child `SampleItem` from the collected (parent) specimen via the **`sample_item_aliquot_relationship`** (parent → child) with **volume/quantity tracking** (so remaining specimen is known for repeats), and the smear, molecular, and culture sections are set up from that processed-aliquot child. TB adds only the processing metadata on top: decontamination **method** (NALC-NaOH, etc.), **reagent lot** — recorded as an **`InventoryUsage`** against the consumed `InventoryLot` (M-12 reuse), date/time, and processed-by. Saving writes an AUTO timeline event.

Because the aliquot relationship is the parent→child link, the **two-cases-one-specimen model and the aliquot lineage are the same mechanism**: a sibling bacterial Case uses the **raw** collected `SampleItem` (or its own aliquot); the TB Case uses the processed-aliquot child of that same collected `SampleItem`. The processed aliquot inherits the collected specimen's identity (derived ID, e.g. `…​.1`) for barcode/traceability. Decontamination therefore never affects the bacterial case — it operates on a separate child aliquot.

> **Open granularity choice:** one processed aliquot feeding all three TB methods, or a child aliquot **per method** (smear slide / culture inoculum / molecular cartridge). The aliquot workflow supports nested + bulk aliquots either way; volume tracking matters when a repeat needs leftover specimen. Decide at build. **Note:** this is *specimen* aliquoting and is distinct from **subculture** (media-grown-from-media), which stays on M-04's `micro_case_inoculation.source_inoculation_id` — see M-04 §4.2.

### 4.2 AFB smear — inline grading
**+ Record smear** opens an inline panel: stain method (ZN / auramine fluorescence) + **WHO grade** (Negative / Scanty / 1+ / 2+ / 3+); selecting **Scanty** reveals the exact-count field (e.g. "1-9 AFB per 100 fields"); macro-enabled comment (M-08). On save: write `tb_smear`, an AUTO timeline event, and — **if grade ≠ Negative** — surface a **Log critical notification** prompt on the case header (M-11, §4.8). A smear releases as an **interim report** the same day (§5).

### 4.3 Rapid molecular — Xpert / Truenat / LPA inline
**+ Record molecular** (or auto-populated from the analyzer, §6) opens an inline panel keyed by assay:
- **GeneXpert MTB/RIF, Xpert Ultra, Truenat:** MTB result (Detected / Not detected / Invalid / Error; Ultra semi-quant Trace…High) + **rifampicin resistance** (Detected / Not detected / Indeterminate). A **rifampicin-resistance = Detected** result is clinically urgent → critical prompt (M-11) and a reflex to order second-line work (§3.4).
- **Line Probe Assay (first-line: rpoB / katG / inhA; second-line: gyrA / rrs):** an inline **per-target table** — each target's wild-type/mutant call + observed **mutation pattern** → **inferred resistance** per drug. The panel shows the rolled-up inferred resistances (e.g. "rpoB MUT → rifampicin R; katG MUT → isoniazid R").
On save: write `tb_molecular_result` (+ `targets[]`), AUTO timeline event, interim report eligibility (§5), and the molecular **inferred resistance is carried into DST reconciliation** (§4.6).

### 4.4 Culture & species ID
Culture is set up against the TB Method (MGIT liquid / LJ solid) with its long incubation (`max_incubation_days`). The section tracks **time-to-detection**, a positivity event (analyzer MGIT push or manual read), **contamination handling** (mark contaminated → invalidate that bottle, prompt repeat — the one place a destructive-confirm modal is allowed), and a **negative-at-day-N** call.
On a positive culture, **+ Add isolate** creates the cultured isolate (reusing M-04 §4.4 two-pass identification). **Species ID** is the isolate's identify step: MTB complex vs NTM via MPT64 antigen / molecular / LPA. **If the isolate is NTM, the TB-DST cascade does not fire** — the case is flagged NTM, NTM-appropriate workup/reporting applies, and first-line TB DST is not auto-ordered. Only MTB-complex isolates proceed to TB DST (§4.5).

### 4.5 Drug-susceptibility testing (DST) — inline, reuses M-05 (critical concentration)
Per MTB-complex isolate, DST runs render as inline `micro_ast_run` tables (the M-05 shape), one for phenotypic (MGIT / agar proportion) and, where done, one summarizing molecular DST (LPA). Setup mirrors M-05 §4 (panel pre-filled from the organism's default TB panel via the reflex; method; reagent lot via M-12; standard = the **WHO-TB** standard from M-02, snapshotted). First-line drugs: **isoniazid, rifampicin, ethambutol, pyrazinamide**; second-line: **fluoroquinolones, injectables (amikacin/kanamycin/capreomycin), bedaquiline, linezolid, clofazimine,** etc.

Entry (inline rows, the M-05 mechanism with `interpretation_method = CRITICAL_CONCENTRATION`): per drug, the tech records **Resistant / Susceptible** at the **critical concentration shown** (snapshotted from M-02; medium shown). No MIC-to-S/I/R lookup — the call *is* growth/no-growth at the critical concentration. Overrides, original-value preservation, review/accept, and **retest = a new run** all reuse M-05 (§5.2-§5.7) unchanged. A run is not "complete" until reviewed/accepted (M-05 §5.6); only complete DST counts toward the final-report checklist.

### 4.6 Phenotypic ↔ molecular reconciliation + resistance classification
Because resistance can be called two ways (molecular prediction from Xpert/LPA, §4.3; phenotypic DST, §4.5), the DST section shows an inline **reconciliation row per drug**: molecular inferred-resistance beside phenotypic R/S. **Concordant** rows are shown plainly; **discordant** rows (e.g. molecular rifampicin-R but phenotypic S, or vice versa) are **flagged for supervisor attention** and must be looked at before final release (reusing the M-05 flagged-row → blocks-accept pattern). A macro-enabled reconciliation note (M-08) records the lab's resolution.

From the reconciled per-drug picture the case is **auto-classified** into a resistance pattern, shown on the isolate tile and the report:
- **Pan-susceptible**, **mono-resistant** (one first-line), **poly-resistant** (>1 first-line, not MDR), **MDR-TB** (resistant to at least isoniazid + rifampicin), **pre-XDR** (MDR + fluoroquinolone resistance), **XDR-TB** (per the current WHO definition — MDR/pre-XDR plus resistance to bedaquiline or linezolid).
The classification is **derived** (a function of the reconciled results), recomputed on change, and stamped on the isolate; it is editable-with-reason by a supervisor (audited) for edge cases.

### 4.7 Reports — staged interim + final, checklist-gated
TB reports out in stages; each stage is a **report version** on the Reports section (reusing M-04 §4.6 versioned reports):
1. **Smear interim** — same day (§4.2).
2. **Molecular interim** — same day: MTB ± rifampicin resistance (§4.3).
3. **Culture interim** — weeks later: culture positive/negative + time-to-detection.
4. **Species-ID interim** — MTB complex vs NTM.
5. **DST interim/final** — weeks later: per-drug R/S at critical concentration + molecular reconciliation + resistance classification.
Each interim release is allowed as soon as its stage's result exists (e.g. smear interim needs only a saved smear). **Final release** is gated by a pass/fail readiness checklist (species ID done; DST complete-and-reviewed for MTB-complex isolates; discordant molecular/phenotypic rows resolved; no pending tests). Amendments preserve originals (M-04 §3). All five reports are **WHONET-exportable via M-09** (§7).

### 4.8 Critical notification (reuses M-11)
A **Log critical notification** action sits in the case header (`target_type = CASE`) and on each isolate tile (`target_type = ISOLATE`), reusing M-11 unchanged. Two TB triggers **prompt** it automatically (the lab still confirms the call): **smear-positive** (any non-negative grade) and **rifampicin-resistance detected** (Xpert/Truenat/LPA). On save: M-11 record + AUTO timeline event + unacknowledged badge (optimistic).

---

## 5. State machine (TB profile of M-04 §3)
Reuses the M-04 `micro_case` state machine and `micro_case_stage_transition`; the TB profile adds molecular/smear/species stages. Non-terminal TB stages:

`RECEIVED → PROCESSED → SMEAR_DONE → MOLECULAR_DONE → CULTURING → CULTURE_POSITIVE → SPECIES_ID → DST_IN_PROGRESS → READY_REVIEW → (interim reports at each stage) → FINAL_REPORTED → AMENDED`.

Branches/terminals reuse M-04: `NO_GROWTH_FINAL` (negative-at-day-N), `CONTAMINATED` (repeat), `NTM_IDENTIFIED` (off-ramp from SPECIES_ID), plus the M-04 cancellation/lost-specimen terminals. Smear and molecular stages can complete and report **before** culture is back (molecular-first), and a stage entering can fire the §3.4 reflexes. Each transition is atomic + audited, exactly as M-04 §3.

---

## 6. Analyzer event channel (Phase 1A+)
Reuses the M-04 analyzer event channel (M-04 §7) — no new mechanism. GeneXpert / Truenat push molecular results → populate `tb_molecular_result` (`source = ANALYZER_AUTO`); MGIT instruments push positivity / time-to-detection and `AST_RESULT_AVAILABLE` for MGIT DST → land the DST run in `RESULTS_IN` (M-05 §5.3); LED/digital-microscopy readers may push smear reads. **No manual import** anywhere; an unmatched push lands `FAILED` on **Admin → Stuck analyzer events** (M-04 §7). Pushed results are pre-populated and require review/accept (M-05 §5.6) before they count.

---

## 7. Reporting & export (GLASS out of scope)
TB results (smear, Xpert/Ultra/Truenat, culture, species, phenotypic + molecular DST, resistance classification) are reportable on the case (§4.7) and **exportable via the M-09 WHONET TB export** — M-09 owns the export format, dedup, and mapping (including the TB-specific columns); this FRS only produces the data and references M-09. **GLASS / consolidated-FHIR central reporting is explicitly out of scope of this FRS** — it is being designed separately as the last step of the module. Within this FRS, "report out" means the case's interim/final report versions plus availability to the M-09 exporter.

---

## 8. Override, audit, permissions (reused)
DST overrides, original-value preservation, review/accept, and retest-as-new-run reuse M-05 §5-§6 unchanged. Smear, molecular, and species entries are `@Audited` (Envers); edits append/version, never silently overwrite. Resistance reclassification by a supervisor is audited with a reason. **Permissions reuse existing role bundles** (no new per-action keys): bench entry via the Analyst bundle; review/accept, reconciliation resolution, reclassification, and final release via Supervisor/Manager; critical-notify and NCE reuse their existing M-11 / NCE permissions. Every state-changing action is enforced server-side and audited; reads are not.

---

## 9. Non-functional
Reuses M-NFR. TB Case Detail (smear + several molecular results + 1-2 isolates × ~15 DST drugs × weeks of timeline events) renders < 1 s; saves < 500 ms. WCAG 2.1 AA: WHO grade and R/S status conveyed by **text + colour** (never colour alone); inline panels keyboard-navigable; macro dropdowns accessible. Offline forms queue with reconnect conflict resolution. Long-running cases (6-8 week culture) must remain performant and re-openable across that span.

---

## 10. Reuse confirmations (no parallel structures)
- **Case / Isolate / Timeline / state machine / stage transitions** → reused from M-04 (TB is a profile).
- **DST** → reused `micro_ast_run` + `result` multi-reading + override/accept/retest, with `interpretation_method = CRITICAL_CONCENTRATION` (§3.2) — **not** a parallel DST table.
- **Critical concentrations** → M-02 WHO-TB standard (new standard type, assumed), snapshotted on the run like CLSI/EUCAST.
- **Cascade** → existing reflex/test-rules engine (§3.4), **not** a TB orchestrator.
- **Critical notify** → M-11 (`CASE`/`ISOLATE`); **reagent/kit lots** → M-12 FIFO+QC; **macros** → M-08; **timeline** → existing History/Note substrate; **concurrency** → existing optimistic lock.
- **New entities limited to** `tb_smear` and `tb_molecular_result` (+ `targets[]`) and the `interpretation_method`/DST-reading additions — all flagged in §3.

---

## 11. Acceptance criteria
- **AC-M14-01**: TB is a **profile of the M-04 Case** (reuses `micro_case`, isolate, timeline, state machine, stage transitions, optimistic lock); no parallel case/timeline store is created.
- **AC-M14-02**: All TB data entry is **inline section/row expansion, not pop-up modals** (Principle 3); modals only for destructive confirmation (e.g. mark culture contaminated).
- **AC-M14-03**: **AFB smear grading** is captured against the WHO scale (Negative / Scanty / 1+ / 2+ / 3+), with stain method (ZN / fluorescence) and an exact count when Scanty; saved to `tb_smear`, audited, AUTO-logged; a non-negative grade prompts a critical notification.
- **AC-M14-04**: **GeneXpert/Truenat result** captures MTB Detected/Not-detected (+ Ultra semi-quant) and **rifampicin resistance** Detected/Not-detected/Indeterminate; rifampicin-resistance = Detected prompts a critical notification and fires the second-line reflex.
- **AC-M14-05**: **LPA mutation capture** records per-target wild-type/mutant calls and mutation pattern (rpoB/katG/inhA first-line; gyrA/rrs second-line) → inferred per-drug resistance, in `tb_molecular_result.targets[]`.
- **AC-M14-06**: **Phenotypic DST** is recorded as **Resistant / Susceptible at a stated WHO critical concentration** (medium shown), via `micro_ast_run` + result rows with `interpretation_method = CRITICAL_CONCENTRATION` — **not** CLSI/EUCAST MIC S/I/R, and **not** a parallel DST table; the critical concentration is snapshotted from the M-02 WHO-TB standard.
- **AC-M14-07**: Molecular and phenotypic resistance are **reconciled per drug**; discordant rows are flagged and block final release until resolved (with a macro note).
- **AC-M14-08**: The case is **auto-classified** (pan-susceptible / mono / poly / **MDR** / pre-XDR / **XDR**) from the reconciled results; derived, recomputed on change, supervisor-editable-with-reason (audited).
- **AC-M14-09**: **Staged interim reporting** — smear (same day), molecular (same day), culture (weeks), species ID, DST (weeks) each release as their own report version; each interim is allowed as soon as its stage's result exists; final is checklist-gated.
- **AC-M14-10**: **Species ID** distinguishes MTB complex vs NTM (MPT64 antigen / molecular) on the isolate; an **NTM** isolate does **not** trigger the TB-DST cascade.
- **AC-M14-11**: **Critical-result triggers** (smear-positive, rifampicin-resistance) reuse **M-11**; the only new TB entities are `tb_smear` and `tb_molecular_result`.
- **AC-M14-12**: The **cascade** (smear+→Xpert; MTB+→culture+DST; Rif-R→second-line LPA/DST) is driven by the **existing reflex/test-rules engine**, not a TB-specific orchestrator.
- **AC-M14-13**: Analyzer results (GeneXpert/Truenat/MGIT/digital microscopy) ingest via the M-04 channel (**no manual import**), land pre-populated, and require review/accept before counting; unmatched pushes go to Stuck analyzer events.
- **AC-M14-14**: TB results are **exportable via M-09** (WHONET TB export); **GLASS / consolidated-FHIR central reporting is out of scope** of this FRS.
- **AC-M14-15**: **Reuse confirmations** hold (§10): reagent/kit lots via M-12 (FIFO+QC, expired/locked blocked), macros via M-08, timeline via the existing History/Note substrate, overrides/accept/retest via M-05, optimistic locking and per-action accountability via M-04/M-10.

## 12. i18n (pattern `micro.tb.*`)
~120-160 keys: stage labels, section headers (processing, smear, molecular, culture, species, DST, reconciliation, reports), WHO smear grades + scanty count helper, stain methods, assay names + MTB/rif result values, Ultra semi-quant levels, LPA target/mutation/inferred-resistance labels, critical-concentration + medium labels, R/S values, resistance-classification labels (mono/poly/MDR/pre-XDR/XDR), reconciliation discordance messages, interim-report labels, critical prompts, NTM off-ramp, error strings. (Maintained with implementation.)

## 13. References
M-00 (parent; reflex-vs-workbench division) · M-01 (TB drugs, MTB/NTM species, TB panels, TB Method) · M-02 (**WHO-TB critical-concentration standard** — new standard type) · M-04 (Case/Isolate/Timeline/state-machine substrate this FRS specializes) · M-05 (DST reuses `micro_ast_run` + override/accept/retest; `interpretation_method = CRITICAL_CONCENTRATION`) · M-08 (macros) · M-09 (WHONET TB export; GLASS out of scope) · M-11 (smear-positive / rifampicin-resistance criticals) · M-12 (reagent/kit lot FIFO + QC). Existing OE Sample/SampleItem/Result/Method/test-rules/History/Note/optimistic-lock infrastructure.
