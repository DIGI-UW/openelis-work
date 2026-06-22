# MinION + TB-Profiler — Analyzer Setup Guide

**OpenELIS Global | Analyzer Setup | PNG / CPHL (also applicable to Madagascar)**
Version: v1.0
Date: 2026-06-22
Confidence: MEDIUM-HIGH (instrument/pipeline steps from vendor + TB-Profiler docs; OpenELIS-side flow follows the Analyzer Types & Mapping FRS, not verified on a live instance)
Audience: Lab IT, Bioinformatics/Sequencing lead, Lab Manager, OpenELIS Administrator

> **Read this first.** OpenELIS does **not** connect to the MinION or to MinKNOW. It picks up the **TB-Profiler result files** after sequencing and analysis are complete. There is no instrument cable, IP, or port to configure on the sequencer side — the "connection" is a **folder OpenELIS watches** for TB-Profiler output. TB-Profiler is treated as **one more source on the analyzer import you already use**, not a separate import tool.

---

## 1. Prerequisites

- OpenELIS Global with the **TB Case Workbench (M-14)** and the **analyzer import channel** available (the same mechanism GeneXpert/Truenat/MGIT results already arrive through).
- The **flat-file analyzer plugin** available, with the **MinION/TB-Profiler profile** loaded — and, for JSON import, the plugin's JSON parse step enabled (spec dependency **T-1**; the `collate` CSV path needs only the profile). Confirm with your OpenELIS administrator that the `WGS_TBPROFILER` source is configured.
- A sequencing workstation running MinKNOW/Dorado and **TB-Profiler 5.x or 6.x** with the **WHO 2023 catalogue** database.
- A **shared folder** the TB-Profiler host writes results to and OpenELIS can read (network mount, or the same server). Decide its path before you start (§3).
- OpenELIS roles: an **Administrator** to register the source and the watched folder; a **TB/Mycobacteriology Technician** to review and accept imported results.
- Sample accessioning convention agreed: the **TB-Profiler sample `id` must equal the OpenELIS accession number** (see §4).

---

## 2. Instrument + pipeline side — producing TB-Profiler output

This half is owned by the sequencing/bioinformatics workflow, not OpenELIS.

1. **Sequence on the MinION** (MinKNOW), basecall and demultiplex (Dorado) → per-barcode FASTQ.
2. **Run TB-Profiler** on each sample's FASTQ:
   ```
   tb-profiler profile --read1 <sample>.fastq.gz --prefix <ACCESSION> --dir <run_dir>
   ```
   - Set `--prefix` to the **OpenELIS accession number** so the output `id` matches the order (§4).
   - This writes `<run_dir>/results/<ACCESSION>.results.json` — the **primary import file**.
3. **(Optional) Batch summary** for surveillance:
   ```
   tb-profiler collate --dir <run_dir>
   ```
   produces a batch CSV (secondary import; summary only — no per-mutation depth/frequency).
4. **Write results into the watched folder** (§3) — copy or symlink `results/*.results.json` (and the `collate` CSV if used) into the folder OpenELIS watches.

> **Version check.** Note the TB-Profiler version and `db_version` (e.g. `WHO-UCN-GTB-PCI-2023.5`) — they travel in the JSON and are stored for audit. If you upgrade TB-Profiler, confirm the JSON field names still match the parser config; field names can drift between major versions. No code change is needed for a version bump — only a parser-config check.

---

## 3. OpenELIS side — register the source and the watched folder

> Follow the **Analyzer Types & Mapping FRS** and the live app for the actual screens; the steps below describe *what to set*, not a frozen UI. The flow is **inline in the Analyzers list** (Instrument → Verify → Connect), not a modal.

- **Instrument** — in the Analyzers area, add/select **MinION + TB-Profiler** (source key `tbprofiler-json`). Assign the lab unit(s) that run TB WGS.
- **Verify** — confirm the source's mappings: the 14 WHO drugs (rifampicin, isoniazid, ethambutol, pyrazinamide, streptomycin, fluoroquinolones, amikacin, kanamycin, capreomycin, ethionamide, linezolid, bedaquiline, clofazimine, delamanid) map to your catalog's TB drugs, and species maps to MTB-complex / NTM. Anything that doesn't match routes to Resolve → map-to-existing/add — it is **never dropped**.
- **Connect** — instead of a TCP port, set the **watched folder path** (where TB-Profiler writes `results/*.json`), the poll interval, and the post-import action (e.g. move processed files to an archive subfolder). One-way (results-only).

There is **no upload screen to configure** for the normal path — results flow from the folder automatically. (A manual-upload fallback is a separate, general analyzer-import capability and is only relevant if your pipeline host cannot write to a mounted folder.)

---

## 4. Verifying a live result

1. Run one known sample through TB-Profiler with `--prefix` set to a **real OpenELIS accession** that has a TB order open.
2. Drop its `<accession>.results.json` into the watched folder.
3. In OpenELIS, confirm the result arrives on that TB case, **pre-populated and pending review**, in the case workbench molecular section — with:
   - **Species** (MTB complex vs NTM) set on the isolate;
   - **Per-drug S / R / Insufficient-coverage** calls, resistant drugs showing their mutation(s);
   - **Sequencing QC** (reads mapped, median depth, coverage at 30×) captured;
   - the pipeline's **classification** (e.g. MDR-TB) shown as the reported value — OpenELIS derives the case classification from all evidence.
4. **Review and accept** the result (per resistant drug) in the same inline flow used for Xpert/LPA. Only accepted results count toward the report. A **QC failure blocks acceptance** until resolved.
5. Confirm an **unmatched accession** lands in **Admin → Stuck analyzer events** (not silently dropped).

A correct first message: `id` = the accession, `species` = *Mycobacterium tuberculosis* (or NTM), 14 `dr_resistances` entries, populated `qc` block.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Results never appear | Watched-folder path wrong, or OpenELIS lacks read access | Check the folder path and mount permissions; confirm TB-Profiler is writing `results/*.results.json` there |
| Result lands in Stuck analyzer events | `id` ≠ an OpenELIS accession | Re-run TB-Profiler with `--prefix <accession>`, or correct the accession; re-drop the file |
| Drug shows "Insufficient coverage" (IC) | That gene's sequencing depth < 30× | Expected for low-depth runs; re-sequence if the drug is clinically needed |
| Whole run won't accept | QC failed (low mapping %, low depth, or low coverage) | Review the QC metrics; re-sequence — a failed run can't be released |
| Sample flagged NTM / not-MTB | `pct_reads_mapped` < 10% (organism isn't *M. tuberculosis*) | Expected; no TB resistance results apply — refer for NTM workup |
| Rifampicin shows a low-level "het" variant | Heteroresistance (variant 25–74% frequency) | Flagged for clinical review — possible emerging/mixed resistance |
| Classification (MDR/XDR) looks wrong | Pipeline `drtype` disagrees with OpenELIS-derived classification | Open the reconciliation row — discordance is flagged for supervisor review before final release |
| Drug calls missing after a TB-Profiler upgrade | JSON field names drifted between versions | Have the administrator check the parser config against the new output; no code change needed |

---

## 6. What this guide does not cover

The richer result visualization (classification banner, per-drug mutation table, QC gauge dashboards), an import-queue screen, and a manual-upload page are **general analyzer-import improvements** being scoped separately — they are not specific to TB-Profiler and are not required for it to work on the existing channel. When they ship, TB WGS results benefit alongside every other analyzer source.

---

## References

- Field mapping & integration spec: `minion-tbprofiler-field-mapping-v2.2.md`
- M-14 TB Case Workbench FRS (molecular section, analyzer event channel, reconciliation)
- Analyzer Types & Mapping FRS (the OpenELIS-side setup flow)
- TB-Profiler: https://github.com/jodyphelan/TBProfiler · WHO Catalogue 2023
- Related Jira: OGC-318 (import), OGC-334 (→ general-import visualization), OGC-352 (SeqStudio/HIV, same pattern)
