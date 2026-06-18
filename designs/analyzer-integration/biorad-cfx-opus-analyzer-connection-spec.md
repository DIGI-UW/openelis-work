# Analyzer Connection Specification: BioRad CFX Opus Real-Time PCR System

**Document Version:** 1.2 (Real-Sample Validated — Format)
**Date:** 2026-06-18
**Status:** Draft — Updated with a real CFX Maestro 5.2 XLSX export (Indonesia deployment)
**Author:** Casey / DIGI-UW
**Confidence:** MEDIUM-HIGH — export **file format** confirmed against a real CFX Maestro v5.2.008 workbook; production lab-number mapping not yet observed (sample run was pre-LIS, see §3.6)

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| 1.0 | (initial) | Spec built from vendor product pages and general qPCR knowledge. |
| 1.1 | 2026-03-05 | Verified connectivity, file storage, and transfer pathways against CFX Opus Instrument Guide (Doc #10000119983). |
| **1.2** | **2026-06-18** | **Validated export format against a real CFX Maestro v5.2.008 workbook** (`sample export CFX OPUS.xlsx`, Indonesia, 4-plex SARS-CoV-2 + Influenza A/B run, 2026-06-18). Added a first-class **multi-sheet XLSX export path** (§3.2). Corrected software version (v2.3 → also v5.2), data-file extension (`.zpcr` → `.pcrd`/`.prcl`/`.pltd`), and the real column set (no `Biological Set Name`, no `Call`; `SQ` present). Established the **`Sample` field = OpenELIS lab number** rule and documented the pre-LIS blank-`Sample` scenario (§3.6). Corrected empty-Cq handling (blank cell, not literal `N/A`). Documented the **Run Information** metadata sheet and instrument serial capture (§3.5). Resolved open questions #1, #8, #10; reframed #2. |

---

## 1. Analyzer Overview

| Field | Value |
|---|---|
| **Analyzer Name** | BioRad CFX Opus |
| **Manufacturer** | Bio-Rad Laboratories |
| **Analyzer Type** | Real-Time PCR (qPCR) |
| **Models Covered** | CFX Opus 96 (#12011319), CFX Opus 384 (#12011452), CFX Opus Deepwell (#12016658) |
| **Software** | CFX Maestro Software (**v5.2.008 confirmed in real export**; v2.3 per Instrument Guide era) / BR.io Cloud Platform |
| **Test Category** | Molecular / RT-PCR |
| **Use Cases** | SARS-CoV-2, Influenza A/B, TB/MTB, HIV Viral Load, HCV, HPV, other molecular assays |
| **Manual Reference** | CFX Opus Instrument Guide, Doc #10000119983, © 2021 Bio-Rad |
| **Real Sample on File** | `sample export CFX OPUS.xlsx` — CFX Maestro v5.2.008.0222, 4-channel multiplex (Cy5/FAM/Texas Red/VIC) influenza + SARS-CoV-2 panel, 96-well, S/N 795BR03561, run 2026-06-18, Indonesia (DIY/Yogyakarta site) |

### 1.1 Instrument Capabilities

The CFX Opus is Bio-Rad's current-generation real-time PCR platform. It supports standalone operation with onboard touchscreen, USB data transfer, Ethernet, and Wi-Fi connectivity. The instrument is controlled and analyzed through CFX Maestro Software, which provides LIMS integration, data analysis, and multi-format export.

### 1.2 Connectivity & Ports (Verified from Instrument Guide)

| Interface | Specification | Location |
|---|---|---|
| **Ethernet** | 10/100 BASE-T (RJ45), DHCP default, IPv4 only | Rear panel |
| **USB Type B** | USB 2.0, connects to computer running CFX Maestro | Rear panel (1 port) |
| **USB Type A** | USB 2.0, for USB drives / barcode scanners | Rear panel (2 ports), Front panel (1 port) |
| **Wi-Fi** | IEEE 802.11b/g/n 2.4 GHz + IEEE 802.11a/n/ac 5 GHz | Requires locale-specific Wi-Fi adapter |
| **Network Drive** | SMB/CIFS shared folder via UNC path (`\\server\share\folder`) | Via Ethernet or Wi-Fi |

> **Note:** Bio-Rad requires use of their approved USB cable (#12012942) and Ethernet cable (#12013205) for EMC compliance.

### 1.3 Optical Detection Specifications

| Model | LEDs | Photodiodes | Wavelength Range | Max Targets/Well |
|---|---|---|---|---|
| CFX Opus 96 | 6 | 6 | 450–730 nm | 5 |
| CFX Opus 384 | 5 | 5 | 450–690 nm | 4 |
| CFX Opus Deepwell | 6 | 6 | 450–730 nm | 5 |

> **Confirmed in real export:** the 96-well run used 4 of the 5/6 available channels — `Cy5`, `FAM`, `Texas Red`, `VIC` — as a single 4-plex assay. Channel names in the export are the **fluorophore** names, not the dye-slot numbers.

### 1.4 File Storage Capacity (Onboard)

| Model | Total Files | My Files | Run Reports |
|---|---|---|---|
| CFX Opus 96 | 1,000 | 900 | 100 |
| CFX Opus Deepwell | 1,000 | 900 | 100 |
| CFX Opus 384 | 500 | 400 | 100 |

> **Note:** Folder and file names have a 32-character limit on the instrument.

---

## 2. Communication Protocol

### 2.1 Integration Method: File-Based (XLSX / CSV)

The BioRad CFX Opus does **not** use ASTM or HL7 natively. Integration with OpenELIS Global uses a **file-based approach** where CFX Maestro Software exports result data to a monitored directory. The real export on file is a **multi-sheet Excel workbook (`.xlsx`)**; CFX Maestro can also produce a single-sheet LIMS CSV. Both paths are documented in §3.

| Parameter | Value |
|---|---|
| **Protocol** | File-based (XLSX or CSV export to shared/watched folder) |
| **Direction** | Unidirectional (Analyzer → OpenELIS) |
| **Transport** | Local filesystem / Network shared folder |
| **Middleware** | OpenELIS Analyzer Bridge (file watcher transport) or direct plugin file reader |

### 2.2 Data File Types (Verified — corrected for CFX Maestro 5.x)

| File Type | Extension | Description | Integration Relevance |
|---|---|---|---|
| **Run data** | `.pcrd` | Plate-centric run data file (CFX Maestro 5.x). *Older CFX Manager used `.zpcr`.* | Primary raw file; opened in CFX Maestro for analysis and export |
| **Protocol** | `.prcl` | PCR protocol definition (thermal program) | Not directly relevant; name appears in Run Information sheet |
| **Plate setup** | `.pltd` | Plate layout / well content / sample IDs | **Source of sample-to-well mapping**; name appears in Run Information sheet |
| **Exported results** | `.xlsx` / `.csv` | What CFX Maestro writes for downstream/LIMS use | **Primary integration input** (see §3) |
| **JSON** | `.json` | Auto-generated after run (read-only) | Potential alternative data source (structure TBD) |

> **Correction (v1.2):** v1.1 listed the raw data file as `.zpcr`. The real Run Information sheet references `.pcrd` (run), `.prcl` (protocol), and `.pltd` (plate setup), which are the CFX Maestro 5.x extensions. `.zpcr` belongs to the legacy CFX Manager generation.

### 2.3 Integration Architecture Options

**Option A — Direct Plugin (Recommended for simplicity)**
CFX Maestro exports XLSX/CSV → shared folder → OpenELIS file-based analyzer plugin reads and parses the file.

**Option B — Analyzer Bridge Middleware**
CFX Maestro exports XLSX/CSV → shared folder → OpenELIS Analyzer Bridge (file watcher) → forwards parsed data to OpenELIS via HTTP.

### 2.4 Data Transfer Pathways (Verified from Instrument Guide)

1. **USB Type B → CFX Maestro (primary)**: Instrument connects directly to CFX Maestro computer; CFX Maestro receives run data.
2. **Shared Network Drive**: Run files copied to a network drive via the instrument File Browser; CFX Maestro opens them.
3. **USB Drive**: Run files copied to a USB Type A flash drive for manual transfer.
4. **Email**: Instrument emails data files after run completion (via configured SMTP).
5. **BR.io Cloud**: Results upload to Bio-Rad's cloud platform for remote analysis.

> **Recommended LIMS flow:** CFX Opus → USB/Network → CFX Maestro → XLSX/CSV export → Shared folder → OpenELIS

### 2.5 Shared Network Drive Configuration (Verified from Instrument Guide)

| Parameter | Format | Example |
|---|---|---|
| **Folder Path** | `\\server_name\folder_name\...\target_folder` | `\\usherfs\users\023748` |
| **Credentials** | `global_domain_name\user_name` | `Global\CarIn` |
| **Password** | Network password (saved optionally on instrument) | — |
| **Prerequisites** | Ethernet or Wi-Fi configured; CFX Opus user password set | — |

> **Note:** The CSV/XLSX export to LIMS happens from **CFX Maestro Software**, not the instrument directly. The instrument's own network folder is separate from CFX Maestro's export folder.

### 2.6 Bidirectional Considerations (Future)

CFX Maestro supports a LIMS input file (`.plrn`) for plate setup. A future enhancement could let OpenELIS push work orders (sample IDs, targets, protocol references) to the analyzer by generating `.plrn` files. **Out of scope** for the initial implementation.

---

## 3. Data Format Specification

> **v1.2 note:** This section is rewritten around the **real export on file**. The instrument's "Export All Data Sheets" function produces a **multi-sheet XLSX** (§3.2), which is the format the Indonesia site actually generated. CFX Maestro's single-sheet **LIMS CSV** export (§3.3) remains the simpler alternative. The plugin should detect and handle whichever it receives (§4.4).

### 3.1 Observed Export at a Glance

| Property | Real value observed |
|---|---|
| **File** | `sample export CFX OPUS.xlsx` |
| **Format** | Excel workbook (`.xlsx`), **two sheets**: `"0"` (results) + `"Run Information"` (metadata) |
| **Software** | CFX Maestro v5.2.008.0222 |
| **Encoding** | Native XLSX (no codepage concerns); column headers and content values in **English** despite an Indonesian-locale site |
| **Decimal separator** | Period (`.`) — native Excel float |
| **Run** | 96-well, 4-plex (Cy5/FAM/Texas Red/VIC), SARS-CoV-2 + Influenza A/B |

### 3.2 XLSX Export — Results Sheet (sheet `"0"`)

The results sheet has a **leading empty column A**; data begins in column B. Header row is row 1.

| Col | Header | Description | Real example | Maps To (OpenELIS) |
|---|---|---|---|---|
| A | *(blank)* | Empty spacer column | — | ignore |
| B | `Well` | Plate well position | `A01`, `B10`, `C11` | Plate position → sample mapping (see §3.6) |
| C | `Fluor` | Fluorophore / detection channel | `Cy5`, `FAM`, `Texas Red`, `VIC` | Channel → test mapping (see §4.6) |
| D | `Target` | Target gene / assay name | *(empty in this run)* | Test name, **when populated** |
| E | `Content` | Well content type | `Unkn`, `Neg Ctrl`, `Pos Ctrl` | Filter: process `Unkn` only |
| F | `Sample` | Sample identifier | *(empty in this run — pre-LIS)* | **OpenELIS lab number / accession** (see §3.6) |
| G | `Cq` | Quantification cycle | `35.5609657288368`, *(blank)* | Result value |
| H | `SQ` | Starting Quantity | *(empty in this run)* | Result value (quantitative assays only) |

**Key differences from the v1.1 assumed CSV layout:**

- **No `Biological Set Name` column** (v1.1 assumed one). Do not depend on it.
- **No `Call` column** in this export. Qualitative interpretation must be derived from `Cq` presence/threshold (§5), not read from a `Call` field.
- **`SQ` is a first-class column** (was only in the "extended" list in v1.1). It is present but empty for this qualitative run.
- The header set is `Well, Fluor, Target, Content, Sample, Cq, SQ`.

### 3.3 CSV Export — LIMS single-sheet (alternative path)

CFX Maestro's dedicated **LIMS CSV** export produces a single delimited file. Where a site uses it instead of XLSX:

| Property | Value |
|---|---|
| **Format** | CSV (`.csv`) |
| **Encoding** | UTF-8 (verify; locale exports may differ — see §3.7) |
| **Delimiter** | Comma (`,`) |
| **Header Row** | Yes (first row) |

Column semantics match §3.2. The exact LIMS-CSV header set can differ slightly by CFX Maestro configuration; the plugin identifies the file by the presence of the core columns (§4.4), not by an exact header string.

### 3.4 Cq Value Handling (corrected in v1.2)

| Situation | Real representation | Interpretation |
|---|---|---|
| Amplification detected | Full-precision float, e.g. `20.2149208315001`, `35.5609657288368` | Numeric Cq; **round for display/storage** (e.g. 2 dp) |
| No amplification | **Blank / empty cell** | No Cq — treat as "Not Detected" / negative for that channel |

> **Correction (v1.2):** v1.1 stated empty Cq is the literal string `"N/A"`. In the real CFX Maestro 5.2 XLSX, a no-amplification well is an **empty cell** (null), not `"N/A"`. The parser must treat null/blank/`"N/A"` all as "no Cq". Cq is exported at full floating-point precision; rounding is the plugin's responsibility.

### 3.5 XLSX Export — Run Information Sheet (metadata)

The second sheet (`"Run Information"`) is a key/value table. It is valuable for audit trail and analyzer identification and should be captured even though it carries no per-well results.

| Key | Real value | Use |
|---|---|---|
| `File Name` | `Hasil PCR Multiplex Influenza BKK DIY 18 Juni 2026 pk.12.40....edit.pcrd` | Run identity / provenance |
| `Created By User` | `admin` | Operator audit |
| `Notes` | *(empty)* | Free text |
| `ID` | *(empty)* | Optional run ID |
| `Run Started` | `06/18/2026 05:41:37 UTC` | Result/run timestamp (**US `MM/DD/YYYY`, UTC**) |
| `Run Ended` | `06/18/2026 07:00:58 UTC` | Run end timestamp |
| `Sample Vol` | `25` | Reaction volume (µL) |
| `Lid Temp` | `105` | Thermal lid temp (°C) |
| `Protocol File Name` | `Protokol INStest multiplex SARSCov2, Influenza A, dan B.prcl` | Assay/protocol provenance |
| `Plate Setup File Name` | `Peta PCR Multiplex Influenza BKK DIY 18 Juni 2026 pk.12.40.pltd` | **Plate layout source** (well↔sample) |
| `Base Serial Number` | `795BR03561` | **Instrument serial → analyzer identification** |
| `Optical Head Serial Number` | `795BR03561` | Optical head serial (matched base here) |
| `CFX Maestro Version` | `5.2.008.0222` | Export format version |

> **Recommended use:** map `Base Serial Number` to the registered analyzer instance, store `Run Started` as the result timestamp, and retain `File Name` / `Protocol File Name` for traceability.

### 3.6 Sample Identity Mapping — the `Sample` field is the lab number

In production, the **`Sample` column must carry the OpenELIS lab number (accession)**. This is the canonical accession carrier and the basis for matching analyzer results to orders.

**Why the real export shows a blank `Sample` column:** the sample run on file was performed **pre-LIS** — before OpenELIS integration, with no labelled accessions — so neither `Sample` nor `Target` was populated by the operator. Sample identity in that file exists only implicitly via well position (the plate layout file `.pltd`).

**Production requirement / parsing rule:**

1. **Primary:** read the OpenELIS lab number from the `Sample` column and match to the open order.
2. **Operational requirement:** sites must enter the OpenELIS lab number into the **Sample field of the CFX Maestro plate setup** (`.pltd`) before the run, so it flows into the export. This must be stated in the companion setup guide.
3. **Blank `Sample` handling:** if `Sample` is empty (as in a pre-LIS run), the plugin must **not silently import**. It should route the file/well to a manual-mapping or review state (operator maps wells to accessions), or reject with a clear "unmapped sample" message. Well position alone is **not** a reliable accession.

### 3.7 Locale Considerations

- **Column headers and content values are English** (`Well`, `Fluor`, `Unkn`, `Neg Ctrl`, `Pos Ctrl`) even on an Indonesian-locale site — good for parser stability. Only the **operator-entered file names** are localized (`Hasil`, `Peta`, `Protokol`, `18 Juni 2026`).
- **Timestamps** are US `MM/DD/YYYY HH:MM:SS UTC`.
- **XLSX numbers** use a period decimal separator natively. **However**, if a site exports **CSV** under an Indonesian/European Windows locale, the decimal separator may become a comma and the field delimiter may shift to semicolon — the same hazard seen on the Thermo Multiskan FC integration. Prefer XLSX, or verify CSV delimiter/decimal per site.

### 3.8 Multiplex Row Structure (confirmed)

Each well is emitted **once per fluorophore** as a separate row (well `A01` appears for `Cy5`, `FAM`, `Texas Red`, and `VIC` = 4 rows). Empty/unused wells are **omitted** (e.g., `A02` does not appear; wells are not contiguous). The parser must group rows by `Well` to reconstruct a multiplex result and must not assume a full or contiguous plate.

### 3.9 Sample Output Example (reconstructed from the real export)

Results sheet (`"0"`), showing the leading blank column A and real values:

```
,Well,Fluor,Target,Content,Sample,Cq,SQ
,A01,Cy5,,Neg Ctrl,,,
,A04,FAM,,Unkn,,24.3148953876866,
,A04,Texas Red,,Unkn,,23.2024656563698,
,A04,VIC,,Unkn,,34.8746617770273,
,B10,Cy5,,Unkn,,35.5609657288368,
,C11,FAM,,Pos Ctrl,,18.5256409112234,
```

> Note: in this pre-LIS run `Target` and `Sample` are blank, `Cy5`/`FAM`/`Texas Red`/`VIC` carry the multiplex channels, blank `Cq` = no amplification, and `SQ` is unused.

---

## 4. OpenELIS Plugin Specification

### 4.1 Plugin Identity

| Property | Value |
|---|---|
| **Plugin Name** | `BioRadCFXOpus` |
| **Analyzer Name (DB)** | `BioRadCFXOpus` |
| **Package** | `oe.plugin.analyzer` |
| **Reference Plugin** | `GeneXpertFile` / the QuantStudio flat-file plugin (similar multi-sheet XLSX PCR analyzer) |
| **Menu Label** | `Bio-Rad CFX Opus` |
| **Action URL** | `/AnalyzerResults?type=BioRadCFXOpus` |

### 4.2 Required Plugin Classes

| Class | Extends / Implements | Purpose |
|---|---|---|
| `BioRadCFXOpusAnalyzerImplementation` | `AnalyzerImporterPlugin` | Registers analyzer, maps test names, provides line inserter |
| `BioRadCFXOpusMenu` | `MenuPlugin` | Adds menu entry under Analyzer Results |
| `BioRadCFXOpusPermission` | `PermissionPlugin` | Binds role-based access |
| `BioRadCFXOpusAnalyzer` | (Analyzer line inserter) | Parses XLSX/CSV, extracts results, inserts into OpenELIS |

### 4.3 Configuration XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin>
  <extension point="org.openelisglobal.analyzerimporter">
    <analyzer name="BioRadCFXOpusAnalyzerImplementation"/>
  </extension>
  <extension point="org.openelisglobal.menu">
    <menu name="BioRadCFXOpusMenu"/>
  </extension>
  <extension point="org.openelisglobal.permission">
    <permission name="BioRadCFXOpusPermission"/>
  </extension>
</plugin>
```

### 4.4 File Identification Logic

`isTargetAnalyzer()` should identify a CFX Opus file by:

1. **XLSX path:** workbook contains a results sheet whose header row includes the core columns `Well`, `Fluor`, `Content`, `Cq` (allowing a leading blank column), **and/or** a `Run Information` sheet whose keys include `CFX Maestro Version` / `Base Serial Number`. The presence of the `Run Information` sheet is a strong CFX Maestro signature.
2. **CSV path:** header row contains the core columns `Well`, `Fluor`, `Content`, `Cq` (in any order; `Target`, `Sample`, `SQ` optional/possibly empty).
3. **Optional secondary check:** filename convention if configured.

> Do not require `Target`, `Sample`, or `Biological Set Name` to be present or populated — the real export omits/empties them.

### 4.5 Parsing Logic

```
PARSE Run Information sheet (if XLSX):
  - capture Base Serial Number → analyzer instance
  - capture Run Started → result timestamp
  - capture File Name / Protocol File Name → provenance

FOR each row in results sheet/CSV (skip leading blank column):
  1. SKIP if Content != "Unkn"            (ignore Neg Ctrl / Pos Ctrl / NTC / Std → route to QC, §5.3)
  2. READ Sample:
       - if non-empty  → OpenELIS lab number (accession); match to order
       - if empty      → DO NOT import; route to manual well↔accession mapping / review (§3.6)
  3. DETERMINE test:
       - if Target non-empty → map (Target [+ Fluor]) → OpenELIS test name
       - else                → map Fluor channel → OpenELIS test name (§4.6)
  4. READ Cq:
       - blank / null / "N/A"  → "Not Detected" / negative for that channel
       - numeric               → quantitative Cq (round for display)
  5. READ SQ (if present and numeric) → quantitative result for quantitative assays
  6. GROUP rows by Well to assemble the multiplex result for the sample
  7. INSERT into analyzer_results table (pending review)
```

### 4.6 Test / Channel Name Mapping

Because `Target` may be empty, the deployment mapping must support **mapping by `Fluor` channel** (the assay's channel→target assignment), with `Target` used when present. Mappings are **deployment-specific** and configured per site/assay kit.

Example for the real 4-plex influenza/SARS-CoV-2 panel on file (channel assignments are assay-kit specific and must be confirmed from the kit insert):

| Fluor | `Target` (if present) | OpenELIS Test Name (example) | Notes |
|---|---|---|---|
| `FAM` | (assay-defined) | e.g. `SARS-CoV-2` | Confirm from kit insert |
| `Texas Red` | (assay-defined) | e.g. `Influenza A` | Confirm from kit insert |
| `VIC` | (assay-defined) | e.g. `Influenza B` | Confirm from kit insert |
| `Cy5` | (assay-defined) | e.g. `RNase P (IC)` | Likely internal control — confirm |

> **Note:** Channel→target assignment is defined by the PCR protocol/kit, not by OpenELIS. The site must provide the kit insert so the `Fluor`→test crosswalk can be locked down. The mapping should be configurable (properties file or DB).

---

## 5. Result Interpretation

### 5.1 Qualitative Assays (Detection)

| Condition | Result | OpenELIS Value |
|---|---|---|
| Target Cq numeric AND < cutoff | Detected / Positive | `Positive` or `Detected` |
| Target Cq blank/`N/A` or > cutoff | Not Detected / Negative | `Negative` or `Not Detected` |
| Internal control Cq blank/absent | Invalid | `Invalid` — flag for repeat |

### 5.2 Quantitative Assays (Viral Load)

| Condition | Result | OpenELIS Value |
|---|---|---|
| `SQ` value present and numeric | Quantified | Store numeric value + units (e.g. copies/mL) |
| Cq present but below quantification range | Detected, below LOQ | `Detected < LOQ` |
| Cq blank/`N/A` | Not Detected | `Not Detected` or `< LOD` |

### 5.3 Quality Control Validation

Controls appear in the `Content` column (`Neg Ctrl`, `Pos Ctrl`, and where used `NTC`, `Std`). Validate before accepting patient results:

| QC Check | `Content` | Expected | Action on Failure |
|---|---|---|---|
| Positive Control | `Pos Ctrl` | Cq within expected range (real run: C11 amplified on all 4 channels, Cq ≈ 18–21) | Reject entire run |
| Negative Control | `Neg Ctrl` | Cq blank (no amplification) (real run: A01 blank on all channels) | Reject entire run |
| No Template Control | `NTC` | Cq blank | Reject entire run |
| Internal Control (per sample) | (channel) | Cq within expected range | Reject individual sample |

> **Confirmed in real export:** `Pos Ctrl` (well C11) amplified across all four channels and `Neg Ctrl` (well A01) was blank across all channels — the expected QC behaviour.

---

## 6. Deployment Configuration

### 6.1 CFX Maestro Software Setup

1. Connect CFX Opus to the CFX Maestro computer via USB Type B cable (#12012942).
2. Start CFX Maestro — verify the instrument appears in "Detected Instruments".
3. **Populate the `Sample` field with the OpenELIS lab number** for each well in the Plate Setup (`.pltd`) before running. *(Critical — see §3.6. The pre-LIS sample on file omitted this.)*
4. Configure export:
   - **Preferred:** export the **LIMS CSV** (single sheet) to the OpenELIS-accessible folder, *or*
   - **Observed/fallback:** "Export All Data Sheets" → XLSX (multi-sheet; the plugin reads sheet `"0"` + `Run Information`).
5. Enable **auto-export after run completion** to the watched folder.
6. Ensure the exported columns include at minimum: `Well`, `Fluor`, `Target`, `Content`, `Sample`, `Cq` (and `SQ` for quantitative assays).

> **Tip:** If the instrument is missing from Detected Instruments, verify the USB cable and use Tools → Reinstall Instrument Drivers. Disconnect the CFX Opus before installing/reinstalling CFX Maestro.

### 6.2 OpenELIS Configuration

1. Deploy the `BioRadCFXOpus` plugin JAR to the OpenELIS `/plugin` directory.
2. Restart OpenELIS (or the app server) to load the plugin.
3. Configure the watched folder to match the CFX Maestro export folder.
4. Configure the **`Fluor`/`Target` → test name** mapping per the deployed assay kit (§4.6).
5. Assign appropriate user roles/permissions for the analyzer module.

### 6.3 Network / Filesystem Requirements

| Requirement | Details |
|---|---|
| **Shared folder** | CFX Maestro export folder readable by OpenELIS |
| **File permissions** | OpenELIS service account needs read; optional write to archive processed files |
| **Polling interval** | 30–60 seconds recommended |
| **File archival** | Move processed files to an archive folder, don't delete |
| **Network protocol** | SMB/CIFS, UNC path (`\\server\share\folder`) |
| **IP configuration** | IPv4 only; DHCP or static |
| **EMC compliance** | Use Bio-Rad approved USB (#12012942) and Ethernet (#12013205) cables |

---

## 7. Data Flow Diagram

```
┌─────────────────────┐  USB Type B   ┌──────────────────────┐
│  BioRad CFX Opus    │──────────────►│  CFX Maestro         │
│  (runs PCR,         │  .pcrd file   │  Software (v5.2)     │
│   saves .pcrd)      │               │  (analyzes data)     │
└─────────────────────┘               └──────────┬───────────┘
                                                  │
                                XLSX (multi-sheet) / LIMS CSV auto-export
                                                  │
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Shared / Watched    │
                                      │  Folder (SMB/CIFS)   │
                                      └──────────┬───────────┘
                                                  │  file watcher
                                                  ▼
                                      ┌──────────────────────┐
                                      │  OpenELIS Global     │
                                      │  (Analyzer Plugin /  │
                                      │   Analyzer Bridge)   │
                                      └──────────┬───────────┘
                                                  │  parse + validate + QC
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Results Review      │
                                      │  Queue               │
                                      └──────────┬───────────┘
                                                  │  technician review
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Validated Patient   │
                                      │  Results             │
                                      └──────────────────────┘
```

> **Key clarification:** CSV/XLSX export happens from **CFX Maestro Software**, not the instrument. The instrument produces `.pcrd` data files transferred to CFX Maestro via USB, network, or USB flash drive; CFX Maestro analyzes and exports for LIMS.

---

## 8. Open Questions & Verification Status

> ✅ = verified from Instrument Guide / real sample · 🟢 = resolved by real export (v1.2) · ⚠️ = still site-specific or pending

1. 🟢 **Exact export columns** — Resolved by real export: results sheet is `Well, Fluor, Target, Content, Sample, Cq, SQ` with a leading blank column A. No `Biological Set Name`, no `Call`. (Note: LIMS-CSV header set may vary slightly; identify by core columns.)

2. ⚠️→🟢 **Sample ID field mapping** — Resolved as a rule: the `Sample` column carries the OpenELIS lab number. The real run was pre-LIS so `Sample` was blank; production requires populating it in the `.pltd` plate setup (§3.6). Blank `Sample` → manual mapping / review, not silent import.

3. ⚠️ **PLRN template format** — Future bidirectional scope; obtain `.plrn` templates if pursued.

4. ⚠️ **Assay-specific target names / channel assignments** — `Target` was empty in the real run; channel→target crosswalk (Cy5/FAM/Texas Red/VIC) must be confirmed from the deployed kit insert (§4.6).

5. ⚠️ **Cq cutoff values** — Per-assay positive/negative cutoffs; site-specific.

6. ⚠️ **QC acceptance criteria** — Expected Pos Ctrl Cq ranges per assay; site-specific (real Pos Ctrl Cq ≈ 18–21 observed).

7. ⚠️ **BR.io Cloud export** — Confirm BR.io CSV/XLSX format matches desktop CFX Maestro.

8. 🟢 **Multiple fluorophore handling** — Resolved: each `Well`×`Fluor` is a separate row; group by `Well`; unused wells omitted; plate not contiguous (§3.8).

9. ✅ **Connectivity ports** — Ethernet 10/100 BASE-T (RJ45), USB 2.0 Type A ×3 / Type B ×1, Wi-Fi 802.11b/g/n + a/n/ac, IPv4 only.

10. 🟢 **Data/export file format** — Resolved: instrument run file is `.pcrd` (not `.zpcr`); CFX Maestro export observed as **multi-sheet XLSX** (`"0"` + `Run Information`). Also supports LIMS CSV.

11. ✅ **Network drive support** — SMB/CIFS via UNC path; Ethernet/Wi-Fi + instrument user password.

12. ✅ **File storage limits** — 96/Deepwell 1,000; 384 500; Run Reports 100.

13. ✅ **CFX Maestro connection method** — USB Type B (#12012942), auto-detection; disconnect before (re)installing software.

14. ✅ **Catalog numbers** — CFX Opus 96 (#12011319), 384 (#12011452), Deepwell (#12016658), USB cable (#12012942), Ethernet cable (#12013205).

15. ⚠️ **Software version spread** — Real export from CFX Maestro **v5.2.008**; Instrument Guide era was v2.3. Confirm export-format stability across versions deployed at sites.

---

## 9. References

- **[PRIMARY]** CFX Opus Instrument Guide, Doc #10000119983 — Bio-Rad Laboratories, © 2021.
- **[REAL SAMPLE]** `sample export CFX OPUS.xlsx` — CFX Maestro v5.2.008.0222, Indonesia (DIY), 4-plex SARS-CoV-2 + Influenza A/B, S/N 795BR03561, 2026-06-18.
- [Bio-Rad CFX Opus Real-Time PCR Systems](https://www.bio-rad.com/en-us/product/cfx-opus-real-time-pcr-systems?ID=QBJBMKRT8IG9)
- [CFX Opus Instrument Guide (PDF)](https://www.bio-rad.com/sites/default/files/webroot/web/pdf/lsr/literature/10000119983.pdf)
- [CFX Maestro Software User Guide v2.3 (PDF)](https://www.bio-rad.com/webroot/web/pdf/lsr/literature/10000126764.pdf)
- [CFX Maestro LIMS Integration User Guide (Scribd)](https://www.scribd.com/document/605784563/User-guide-CFX-Maestro-software-LIMS-Integration)
- [OpenELIS Global Analyzer Plugin Wiki](https://github.com/openelisglobal/openelisglobal-core/wiki/Analyzer-plugins)
- [OpenELIS Global Analyzer Plugins Repository](https://github.com/DIGI-UW/openelisglobal-plugins)
- [OpenELIS Analyzer Bridge](https://github.com/DIGI-UW/openelis-analyzer-bridge)
