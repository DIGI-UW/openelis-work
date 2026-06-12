# Bruker MALDI Biotyper — Microbial Identification Analyzer Integration Spec
**OpenELIS Global | Analyzer Integration | PNG / CPHL Port Moresby Deployment**

Version: v1.1
Date: 2026-06-08
Protocol: ASTM LIS2-A2 socket (primary) OR CSV flat file — both supported by MBT Compass IVD
Plugin: `generic-astm` (ASTM mode) or `flat-file` (CSV mode)
Jira: OGC-323
Confidence: MEDIUM-HIGH (configuration grounded in BD/Bruker SN040; exact ASTM field layout pending the ASTM Communication Interface Spec v4.3 + the site's `project2lims.xsl`)

## Source documents
| Document | What it provides |
|---|---|
| **BD/Bruker MBT Service Note 40 — "Information on LIMS Integration"** (MBT_SN40, Rev A, 2021-09-23) | How to *configure* the connection (CSV vs ASTM socket) per software version, folders, web-interface, activation tools. **In hand.** |
| **MALDI Biotyper ASTM Communication Interface Specification, Version 4.3** | The actual ASTM record/field layout (H/P/O/R/L positions). **Needed for field-level mapping — obtain from Bruker.** |
| **MALDI Biotyper2 LIMS-Integration, Version 1.1.1** (KOK, 2008-10-10) | CSV column-format reference (import/target layout). |
| **`project2lims.xsl`** transformation script | Bruker XSL that composes the export payload (ASTM or CSV). The output field composition is **driven by this transform** and is site-adjustable — the OpenELIS parser must match whatever the deployed transform emits. |

> **Grounding caveat.** Connection mechanics below are confirmed from SN040. The per-field ASTM record positions are still best-estimate until the ASTM Communication Interface Spec v4.3 (and/or the deployed `project2lims.xsl`) is reconciled. Promote to VALIDATED after a production message capture at CPHL.

---

## 1. Overview

The **Bruker MALDI Biotyper** (running **MBT Compass IVD**) is a MALDI-TOF mass-spectrometry instrument that identifies bacteria and fungi from cultured isolates. For CPHL it is **identification-only** — organism ID + Bruker log(score); no AST (AST is done on Phoenix/MGIT via BD EpiCenter, OGC-434).

**Two connection modes** (SN040 §5 — MBT Compass IVD); pick one with CPHL:

| Mode | Direction | Mechanics | OpenELIS role |
|---|---|---|---|
| **ASTM socket** (primary) | Import (target/worklist LIMS→MBT) + Export (results MBT→LIMS) | `astm://<LIMS-IP>:<port>`; activated via `MBT-Compass-IVD-Activate-LIMSImport.exe`; export configured at web interface `localhost:8280/mbt-admin` | **SERVER** — OpenELIS listens; **MBT is the client** and connects |
| **CSV flat file** | Import via folder; Export via folder | Import folder default `MBT-IN`; export folder set by `file:///` URI; `;` delimiter; activated via `MBT-Compass-IVD-Activate-CSVImport.exe` | Polls the shared export folder |

- **Default TCP port (ASTM):** none fixed — site-configured; CPHL must supply the LIMS port.
- **Export composition:** processed by the `project2lims.xsl` transform — so the emitted fields are configurable. Lock the transform config with CPHL/Bruker and parse to match.
- **Deployment:** CPHL Bacteriology / AMR bench; feeds the AMR/Microbiology module isolate-identification step (OGC-782). MALDI ID precedes AST and selects the AST panel.

## 2. Message Flow (ASTM mode)

```
(optional) LIMS→MBT: target/worklist for queried target ID
MBT→LIMS results:  H → P → O → R (organism) → R (score) → (C comment) → L
```

- ASTM mode is **bidirectional**: MBT can request a target layout/worklist for a target ID (OpenELIS answers as server), then push results after analysis. Trigger is configurable (`After Analyte Result` / `After Project Result` / `Manual`).
- Each isolate = one `O`, keyed to the culture/isolate accession; an identification emits the organism + score (and optionally top-N candidates).
- **Isolate linkage:** attach the ID to the parent microbiology case/isolate (OGC-782), mirroring EpiCenter isolate handling (OGC-434 §8).

## 3. ASTM Record Field Mapping (representative — confirm against Comm Interface Spec v4.3 / deployed transform)

| Record | Field | Field Name | Example | OpenELIS Mapping | Notes |
|---|---|---|---|---|---|
| H | H.5 | Sender | `MBT Compass IVD^Bruker` | instrument_id | |
| P | P.3 | Patient ID | `PAT-2026-0412` | patient_uid | May be blank if isolate-keyed only |
| O | O.3 | Specimen / Isolate (target) ID | `CPHL-2026-0412-I1` | sample_id | Bruker "target ID" / spot sample ID; resolve parent culture |
| O | O.16 | Sample type | `MycobacteriaSample` | specimen_source | Bruker sample-type categories (see §5/CSV) |
| R | R.2 | Test Code | `^^^ORGANISM` | test_code | Identification result |
| R | R.3 | Organism | `Escherichia coli` | result_value | → Organism Master (WHONET) via CODED_LOOKUP |
| R | R.2 | Test Code (2nd R) | `^^^SCORE` | test_code | |
| R | R.3 | Score | `2.31` | result_value | Bruker log(score) 0.00–3.00 |
| C | C.4 | Comment | `2nd: Shigella flexneri 2.05` | result_comment | Runner-up candidates / spectrum note |
| L | L.3 | Termination | `N` | — | |

*Field positions are governed by the v4.3 ASTM spec and the `project2lims.xsl` transform — verify before build; the transform can add/reorder fields.*

## 4. Test Code Reference Table

| Analyzer Code | Test Name | Result Type | Transform | OE Test ID |
|---|---|---|---|---|
| `MALDI_ID` / `ORGANISM` | MALDI-TOF organism identification | ALPHANUMERIC (species) | CODED_LOOKUP → Organism Master (WHONET) | TBD |
| `SCORE` | Identification log(score) | NUMERIC (0.00–3.00) | THRESHOLD_CLASSIFY (below) | TBD |

**Score → confidence** (Bruker MBT standard thresholds):

| log(score) | OpenELIS classification | Meaning |
|---|---|---|
| ≥ 2.00 | HIGH — secure species ID | High-confidence species |
| 1.70 – 1.99 | LOW — genus-level | Probable genus; species uncertain |
| < 1.70 | NO RELIABLE ID | Not reportable |

## 5. QC Identification Rules (OR logic — any match = QC)

| Rule Type | Field | Value / Pattern | Notes |
|---|---|---|---|
| sampleTypeEquals | O.16 / CSV `SampleType` | `Bts` | **BTS = Bacterial Test Standard**, Bruker's calibrant (SN040 §8 example row `A1;BTS;Standard;Bts;…`) |
| specimenIdEquals | O.3 / CSV `ID` | `BTS` | BTS spot |
| specimenIdPrefix | O.3 | `QC-` / `CTRL-` | CPHL convention |
| specimenIdRegex | O.3 | `^(QC\|CTRL\|BTS\|ATCC).*` | Catch-all |

## 6. Result Aggregation
- Mode: **BY_SPECIMEN** — group ORGANISM + SCORE (+ candidate comments) per isolate.
- Window: 5–10 s. Attach to parent case/isolate (OGC-782), do not create a new sample.

---

## CSV mode (alternative to ASTM) — SN040 §3.1.1 / §8

If CPHL uses CSV instead of the ASTM socket:

- **Import (worklist, OpenELIS→MBT) folder:** default `MBT-IN`; **export (results, MBT→OpenELIS):** folder set by `file:///` URI.
- **Delimiter:** `;` (semicolon). Suffix may differ from `.csv` (configurable: `in`, `csv`).
- **Import column layout** (each row = one spot on the target plate). Mandatory: **Position**, **ID**. Optional: **Name**, **SampleType**, **Description**:

```
Position;ID;Name;SampleType;Description
A1;BTS;Standard;Bts;This is the standard
A2;0000 1-1;Name A;Sample;This is sample A
A6;0000 4-1;Name D;Bloodculture;This is blood culture sample D
A7;0000 5-1;Name E;MycobacteriaSample;This is mycobacteria sample E
A8;0000 6-1;Name F;FilamentousFungiSample;This is filamentous fungi sample F
```

- **Sample types** observed: `Sample`, `Bloodculture`, `MycobacteriaSample`, `FilamentousFungiSample`, `NegativeIonModeSample`, `Bts`.
- The **results export** CSV layout is shaped by `project2lims.xsl` (set `outputType=CSV`) — confirm the columns the deployed transform emits (organism, score, target ID) and map accordingly.
- Encoding/locale: confirm (semicolon-delimited; no French-locale assumption for CPHL but verify decimal separator on the score field).

---

## 7. Implementation Notes
- **ID-only instrument** — no AST records; organism feeds AST panel selection on EpiCenter-fed instruments.
- Ensure the case/isolate exists (culture setup) before the MALDI ID arrives so it attaches rather than orphaning.
- Organism names must reconcile to the AMR module's Organism Master / WHONET vocabulary (OGC-782).
- Decide ASTM-socket vs CSV with CPHL — both are first-class in MBT Compass IVD; ASTM gives real-time bidirectional, CSV is simpler but folder/share-dependent.

## 8. Sample ASTM Message (representative)
```
H|\^&|||MBT Compass IVD^Bruker|||||||LIS2-A2|20260608113000
P|1||PAT-2026-0412||Doe^Jane||19850315|M
O|1|CPHL-2026-0412-I1||^^^MALDI_ID|R|20260608113000||||||||MycobacteriaSample||||||||||F
R|1|^^^ORGANISM|Mycobacterium tuberculosis complex||||F
R|2|^^^SCORE|2.18||||F
C|1|I|Top match MTBC (2.18)|G
L|1|N
```

---

## Spec Versioning
| Version | Date | Changes |
|---|---|---|
| v1.0 | 2026-06-08 | Initial draft from MBT Compass IVD conventions + OGC-323 |
| v1.1 | 2026-06-08 | Grounded in BD/Bruker SN040; added CSV mode, source-doc table, BTS QC, XSL-transform note; confidence → MEDIUM-HIGH |

## Open items to confirm before build
- [ ] Obtain **MALDI Biotyper ASTM Communication Interface Specification v4.3** (field-level layout) from Bruker
- [ ] Decide **ASTM socket vs CSV** with CPHL; confirm TCP port (ASTM) or shared-folder paths (CSV)
- [ ] Obtain the deployed **`project2lims.xsl`** (or set one) to lock the export field composition
- [ ] Confirm organism transport: plain species name vs Bruker taxonomy code (Organism Master mapping)
- [ ] Confirm whether top-N candidate hits are emitted and how runners-up display
- [ ] Confirm score decimal separator / encoding
- [ ] Promote to VALIDATED after first production capture
