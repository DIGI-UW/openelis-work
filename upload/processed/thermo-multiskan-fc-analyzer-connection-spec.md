# Analyzer Connection Specification: Thermo Scientific Multiskan FC ELISA Reader

**Document Version:** 2.0
**Date:** 2026-03-06
**Status:** v2.0 — Validated against real SkanIt export (Nov 2025 ELISA run from Madagascar site)
**Author:** Casey / DIGI-UW

---

## 1. Analyzer Overview

| Field | Value |
|---|---|
| **Analyzer Name** | Thermo Scientific Multiskan FC |
| **Manufacturer** | Thermo Fisher Scientific |
| **Analyzer Type** | Filter-Based Microplate Photometer (ELISA) |
| **Models Covered** | Multiskan FC (#51119000), Multiskan FC with Incubator (#51119100) |
| **Software** | SkanIt™ Software for Microplate Readers |
| **Test Category** | Immunology / ELISA |
| **Use Cases** | HIV ELISA, HBsAg, HCV, Malaria Ag, Syphilis, protein quantification, enzyme assays |
| **Manual Reference** | Multiskan FC User Manual, Cat. No. N07710, Rev. 2.4 — Thermo Scientific |

### 1.1 Instrument Capabilities

The Thermo Scientific Multiskan FC is a filter-based microplate photometer designed for ELISA and other absorbance-based assays. It supports both 96-well and 384-well plate formats, features an 8-position filter wheel, and can operate as a standalone instrument (with onboard display and programming) or under PC control via SkanIt software. The instrument includes built-in incubation capability (optional model), shaking, and comprehensive onboard data analysis.

### 1.2 Connectivity & Ports

| Interface | Specification | Notes |
|---|---|---|
| **USB (Computer)** | USB 2.0 (connection to PC running SkanIt) | Primary computer interface |
| **USB (Memory Stick)** | USB Type A port for USB flash drives | Data export to removable media |
| **Standalone Operation** | Yes | Onboard color display (480×272, 256 colors), internal programming and analysis for most assays |
| **Internal Memory** | ≥100 assay protocols + ≥100 test results (96-well) | Stores protocols and results onboard |

> **Note:** The Multiskan FC connects to a PC via USB for SkanIt software control. It does **not** have Ethernet, Wi-Fi, or serial connectivity. Data export can happen either through SkanIt on the connected PC or via USB flash drive from the instrument's standalone mode.

### 1.3 Optical Detection Specifications

| Parameter | Specification |
|---|---|
| **Detection Method** | Absorbance (filter-based) |
| **Light Source** | Halogen lamp |
| **Filter Wheel** | 8-position (3 filters pre-installed, up to 5 additional) |
| **Wavelength Range** | 340–850 nm |
| **Pre-installed Filters** | 405 nm, 450 nm, 620 nm |
| **Additional Filters Available** | 340, 375, 414, 492, 520, 530, 540, 550, 560, 570, 595, 630, 650, 690, 740, 750, 820 nm |
| **Filter Half-Bandwidth** | 3–9 nm |
| **Plate Formats** | 96-well and 384-well |
| **Read Speed (Fast mode)** | 7 seconds (96-well), 13 seconds (384-well) |

### 1.4 Measurement Performance

| Parameter | 96-well | 384-well |
|---|---|---|
| **Reading Range** | 0–6 Abs | 0–6 Abs |
| **Linearity** | 0–3 Abs, ±2% | 0–2.5 Abs, ±2% |
| **Accuracy** | ±1% or 0.003 Abs (whichever greater), 0–3 Abs | — |
| **Precision** | CV ≤ 0.2% (0.3–3 Abs) | — |

### 1.5 Standard ELISA Filters

| Filter Wavelength | Common ELISA Use | Pre-installed |
|---|---|---|
| 405 nm | pNPP substrate (alkaline phosphatase) | ✅ Yes |
| 450 nm | TMB substrate (HRP conjugate) — most common | ✅ Yes |
| 492 nm | OPD substrate | ❌ Optional |
| 620 nm | Reference wavelength (background subtraction) | ✅ Yes |
| 630 nm | Alternative reference wavelength | ❌ Optional |

---

## 2. Communication Protocol

### 2.1 Integration Method: File-Based (CSV / XLSX)

The Multiskan FC does **not** use ASTM or HL7 natively. Integration with OpenELIS Global will use a **file-based approach** where SkanIt software exports result data as CSV or Excel files to a monitored directory.

| Parameter | Value |
|---|---|
| **Protocol** | File-based (CSV/XLSX export to shared/watched folder) |
| **Direction** | Unidirectional (Analyzer → OpenELIS) |
| **Transport** | Local filesystem / Network shared folder / USB flash drive |
| **Middleware** | OpenELIS Analyzer Bridge (file watcher transport) or direct plugin file reader |

### 2.2 Data File Types

| File Type | Extension | Description | Integration Relevance |
|---|---|---|---|
| **SkanIt Session** | (proprietary) | Native SkanIt session file with raw data + analysis | Not directly parseable |
| **Excel Export** | `.xlsx` | Excel workbook with plate data (well-per-row or grid) | **Primary integration file** |
| **CSV/Text Export** | `.csv` / `.txt` | Comma or tab-delimited results | **Alternative integration file** |
| **USB Export** | `.csv` / `.txt` | Export from standalone mode to USB flash drive | Backup integration path |

### 2.3 Integration Architecture Options

**Option A — Direct Plugin via SkanIt Export (Recommended)**
SkanIt exports CSV/XLSX → shared folder → OpenELIS file-based analyzer plugin reads and parses the file.

**Option B — Analyzer Bridge Middleware**
SkanIt exports CSV → shared folder → OpenELIS Analyzer Bridge (file watcher) → forwards parsed data to OpenELIS via HTTP.

**Option C — USB Flash Drive (fallback for sites without network)**
Standalone measurement → USB export → technician transfers file to OpenELIS import → plugin parses.

### 2.4 Data Transfer Pathways

Data files leave the Multiskan FC system through two paths:

1. **USB → SkanIt Software (primary)**: Instrument connects to PC running SkanIt via USB. SkanIt controls the instrument, receives measurement data, performs analysis, and exports to file.
2. **Standalone → USB Flash Drive**: The instrument can run measurements independently using its onboard software and export results to a USB memory stick. This file can then be manually copied to the OpenELIS import directory.

> **For LIMS integration, the recommended flow is:** Multiskan FC → USB → SkanIt → Excel/CSV Export → Shared folder → OpenELIS

### 2.5 Export Configuration in SkanIt

SkanIt software supports flexible data export:

| Setting | Options | Recommended |
|---|---|---|
| **Export Format** | Excel (.xlsx) or text (CSV/TSV) | Excel (.xlsx) — avoids encoding/delimiter issues |
| **Export Layout** | Plate grid (dual grid: OD values + Sample IDs) | Plate grid (dual grid: OD values + Sample IDs) — this is what the site actually produces; well-per-row may not be available in their SkanIt version |
| **Export Trigger** | Manual after session completion | Manual (auto-export TBD per SkanIt version) |
| **Export Location** | Configurable directory path | Network share accessible by OpenELIS |

**VALIDATED:** The Madagascar site exports in plate grid format with French locale labels. The export contains TWO grids: (1) absorbance values grid and (2) sample ID grid.

### 2.6 Sample ID Input

SkanIt supports associating sample IDs with well positions:

- Sample IDs can be entered in the plate layout configuration
- When configured, sample IDs appear in the export alongside well positions and OD values
- The standalone instrument mode also supports sample ID entry via the onboard interface

### 2.7 Bidirectional Considerations (Future)

SkanIt supports plate layout import. A future enhancement could support OpenELIS generating plate layouts with accession numbers for import into SkanIt. This is **out of scope** for the initial implementation.

---

## 3. Data Format Specification

### 3.1 Export File Format

| Property | Value |
|---|---|
| **File Format** | Excel (`.xlsx`) or CSV/TSV |
| **Encoding** | Windows-1252 (Latin-1) for CSV; standard Excel encoding for XLSX |
| **Delimiter** | Semicolon (`;`) for CSV (European locale — comma used as decimal separator) |
| **Layout Options** | Plate grid format (dual grid: OD values + Sample IDs) |
| **Source Software** | SkanIt → Export (Manual or configured auto-export) |

### 3.2 Validated Export Structure (from real file)

**Source file:** `temporarySkanitExport mars ven. 6 2026 16-18-06-7384124.xlsx`
**Session:** Merilisa 17 11 2025 (1).skax
**Date:** 17/11/2025 12:38:43
**Wavelength:** 450 nm
**Plate:** 96-well (15 wells used in columns 1-2)
**Language:** French (Madagascar site)

#### File Structure (row by row):

| Row | Content | Example |
|---|---|---|
| 1 | Fixed label | `Résultats de mesure` |
| 2 | Session filename (.skax) | `Merilisa 17 11 2025 (1).skax` |
| 3 | Date/time (DD/MM/YYYY HH:MM:SS) | `17/11/2025 12:38:43` |
| 4 | Blank row | |
| 5 | Measurement type | `Absorbance 1` |
| 6 | Wavelength | `Longueur d'onde: 450 nm` |
| 7 | Blank row | |
| 8 | Plate identifier | `Plaque 1` |
| 9 | Blank row | |
| 10 | **OD Grid header** | `Abs \| 1 \| 2 \| 3 \| ... \| 12` |
| 11-18 | **OD Grid data** (rows A-H) | `A \| 0.0451 \| 0.0756 \| ...` |
| 19 | Blank row | |
| 20 | **Sample ID Grid header** | `Échantillon \| 1 \| 2 \| ... \| 12` |
| 21-28 | **Sample ID Grid data** (rows A-H) | `A \| Blanc1 \| Échantillon0003 \| ...` |
| 29 | Blank row | |
| 30 | Autoloader range | `Plage d'autochargement A1 - M28` |

#### Sample ID Naming Conventions (French locale):

| Prefix | Well Type | Example | Parser Action |
|---|---|---|---|
| `Blanc` | Substrate Blank | `Blanc1` | Skip — QC only |
| `NC` | Negative Control | `NC0001`, `NC0002`, `NC0003` | Extract for QC validation |
| `PC` | Positive Control | `PC0001`, `PC0002` | Extract for QC validation |
| `Échantillon` | Patient Sample (placeholder) | `Échantillon0001` | **In production: will be OpenELIS accession numbers** |
| (accession number) | Patient Sample (production) | `24-00001234` | Map to OpenELIS accession |

### 3.3 Well-Per-Row Export Format (Alternative)

SkanIt can export data in a well-per-row format where each row represents one well:

| Column Name | Description | Data Type | Example | Maps To (OpenELIS) |
|---|---|---|---|---|
| `Well` | Well position on the plate | String | `A1`, `B03`, `H12` | — (metadata) |
| `Sample ID` | Sample/patient identifier (if configured) | String | `24-00001234` | Accession number |
| `Absorbance` | OD reading at measurement wavelength | Float | `1.234`, `0.052` | Result value |
| `Wavelength` | Filter wavelength used | Integer (nm) | `450` | — (used for test mapping) |
| `Content` | Well type (if plate layout configured) | String | `Unknown`, `Standard`, `Control`, `Blank` | — (filter: process `Unknown`) |
| `Concentration` | Calculated concentration (if standard curve applied) | Float or empty | `2.5` | Result value (quantitative) |

### 3.4 Plate Grid Export Format (VALIDATED — confirmed as primary export format)

Similar to Magellan, SkanIt can export in a plate grid layout:

**Header Section:**
```
Instrument: Multiskan FC
Protocol: [Protocol Name]
Date: [YYYY-MM-DD]
Time: [HH:MM:SS]
Filter: 450 nm
Plate Type: 96-well
```

**Data Section:**
```
	1	2	3	4	5	6	7	8	9	10	11	12
A	2.345	2.401	1.234	0.876	0.543	0.234	0.567	0.890	1.123	0.456	0.789	0.321
B	0.052	0.048	0.987	0.654	0.321	0.123	0.456	0.789	1.012	0.345	0.678	0.210
...
H	0.048	0.051	0.789	0.321	0.654	0.987	0.543	0.876	1.209	0.543	0.765	1.098
```

### 3.5 Sample Well-Per-Row CSV Output Example

```csv
Well,Sample ID,Absorbance (450 nm),Content
A1,,2.345,Positive Control
A2,,2.401,Positive Control
B1,,0.052,Negative Control
B2,,0.048,Negative Control
C1,,1.567,Cutoff Calibrator
C2,,1.601,Cutoff Calibrator
D1,24-00001234,0.876,Unknown
D2,24-00001234,0.654,Unknown
E1,24-00001235,0.543,Unknown
E2,24-00001235,0.321,Unknown
F1,24-00001236,1.234,Unknown
F2,24-00001236,0.987,Unknown
G1,24-00001237,0.234,Unknown
G2,24-00001237,0.123,Unknown
H1,24-00001238,0.567,Unknown
H2,24-00001238,0.456,Unknown
```

> **⚠️ NOTE:** The exact column names and format must be verified against sample export files from the target site's SkanIt version. The structure above is representative based on documentation.

---

## 4. OpenELIS Plugin Specification

### 4.1 Plugin Identity

| Property | Value |
|---|---|
| **Plugin Name** | `ThermoMultiskanFC` |
| **Analyzer Name (DB)** | `ThermoMultiskanFC` |
| **Package** | `oe.plugin.analyzer` |
| **Reference Plugin** | `BioRadCFXOpus` / `TecanInfiniteF50` (similar file-based analyzers) |
| **Menu Label** | `Thermo Multiskan FC` |
| **Action URL** | `/AnalyzerResults?type=ThermoMultiskanFC` |

### 4.2 Required Plugin Classes

| Class | Extends / Implements | Purpose |
|---|---|---|
| `ThermoMultiskanFCAnalyzerImplementation` | `AnalyzerImporterPlugin` | Registers analyzer, maps test names, provides line inserter |
| `ThermoMultiskanFCMenu` | `MenuPlugin` | Adds menu entry under Analyzer Results |
| `ThermoMultiskanFCPermission` | `PermissionPlugin` | Binds role-based access |
| `ThermoMultiskanFCAnalyzer` | (Analyzer line inserter) | Parses CSV/XLSX, extracts OD results, inserts into OpenELIS |

### 4.3 Configuration XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin>
  <extension point="org.openelisglobal.analyzerimporter">
    <analyzer name="ThermoMultiskanFCAnalyzerImplementation"/>
  </extension>
  <extension point="org.openelisglobal.menu">
    <menu name="ThermoMultiskanFCMenu"/>
  </extension>
  <extension point="org.openelisglobal.permission">
    <permission name="ThermoMultiskanFCPermission"/>
  </extension>
</plugin>
```

### 4.4 File Identification Logic

The `isTargetAnalyzer()` method should identify Multiskan FC files by checking for:

1. **Primary check**: Presence of `Résultats de mesure` OR `Measurement results` in row 1
2. **Secondary check**: `Absorbance` in row 5 area (e.g., `Absorbance 1` or `Absorbance`)
3. **Tertiary check**: `Abs` as first cell of grid header row, followed by column numbers 1-12
4. **Language-aware**: Support both French (`Échantillon`, `Longueur d'onde`, `Plaque`) and English equivalents

### 4.5 Parsing Logic

```
1. DETECT file format (.xlsx preferred, .csv fallback)
2. For CSV: use semicolon delimiter, comma decimal separator
3. SCAN rows 1-9 for metadata:
   - Row 1: Confirm "Résultats de mesure" or "Measurement results"
   - Row 2: Extract session name
   - Row 3: Extract date (DD/MM/YYYY HH:MM:SS)
   - Row 5-6: Extract measurement type and wavelength
4. LOCATE OD grid: Find row starting with "Abs" followed by column numbers 1-12
5. READ OD grid: 8 rows (A-H), up to 12 columns of float values
6. LOCATE Sample ID grid: Find row starting with "Échantillon" or "Sample"
7. READ Sample ID grid: 8 rows (A-H), up to 12 columns of string values
8. PAIR grids: For each well position, combine OD value + Sample ID
9. CLASSIFY wells by Sample ID prefix:
   - Blanc* → BLANK (skip)
   - NC* → NEGATIVE_CONTROL (use for QC validation)
   - PC* → POSITIVE_CONTROL (use for QC validation)
   - All others → PATIENT_SAMPLE (map to OpenELIS accession)
10. For PATIENT_SAMPLE wells:
    - MAP Sample ID → OpenELIS accession number
    - MAP wavelength → OpenELIS test name
    - INSERT into analyzer_results table
11. VALIDATE: Check for duplicate file (filename + date checksum)
```

### 4.6 Test Name Mapping

The plugin's `connect()` method must register mappings between SkanIt protocol/wavelength combinations and OpenELIS test names. These mappings are **deployment-specific**.

| SkanIt Protocol / Wavelength | OpenELIS Test Name (Example) | Notes |
|---|---|---|
| `450 nm` (HIV ELISA protocol) | `HIV ELISA OD` | Primary measurement |
| `620 nm` (reference) | `Reference OD 620` | Background subtraction |
| `450 nm` (HBsAg protocol) | `HBsAg ELISA OD` | Hepatitis B |
| `450 nm` (Malaria Ag protocol) | `Malaria Ag ELISA OD` | Malaria antigen |

> **Note:** Actual mappings depend on the ELISA kits and protocols configured at each site. The plugin should support configurable mappings via the standard analyzer test name mapping UI.

---

## 5. Result Interpretation

### 5.1 ELISA Result Interpretation

ELISA results from the Multiskan FC are **optical density (OD) values**. The interpretation (positive/negative/equivocal) is typically performed by one of:

1. **SkanIt software** — can perform cutoff calculations and export interpreted results
2. **Standalone instrument** — onboard analysis can calculate results against standard curves
3. **OpenELIS** — receives raw OD values and applies cutoff logic (future scope)
4. **Manual review** — technician reviews OD values against kit-defined cutoffs

For the initial implementation, the plugin should import **raw OD values**. Qualitative interpretation is handled outside the plugin.

### 5.2 Typical Cutoff Calculation (Reference)

| Method | Formula | Notes |
|---|---|---|
| **Kit Cutoff Value** | `CO = NC_mean + Factor` or `CO = (PC + NC) / 2 × Factor` | Factor provided by kit manufacturer |
| **Sample Ratio** | `S/CO = Sample_OD / Cutoff_OD` | Ratio determines pos/neg/equivocal |
| **Interpretation** | `S/CO ≥ 1.0 → Reactive` / `S/CO < 1.0 → Non-Reactive` | Kit-specific thresholds |

### 5.3 Quality Control Validation

Before accepting patient results, the plugin should validate QC wells (if plate layout is configured):

| QC Check | Expected | Action on Failure |
|---|---|---|
| Positive Control | OD above kit-defined minimum | Reject entire plate |
| Negative Control | OD below kit-defined maximum | Reject entire plate |
| Cutoff Calibrator | OD within expected range | Reject entire plate |
| Substrate Blank | OD ≈ 0.000 (minimal background) | Flag for review |

---

## 6. Deployment Configuration

### 6.1 SkanIt Software Setup

1. Connect Multiskan FC to PC via USB cable
2. Start SkanIt — verify instrument is detected and connected
3. Configure measurement protocol for the ELISA assay:
   - Set wavelength filter (e.g., 450 nm)
   - Set plate type (96-well or 384-well)
   - Configure plate layout with sample IDs if applicable
4. Configure export settings:
   - **Export Format**: Excel (.xlsx) or CSV
   - **Export Layout**: Well-per-row (recommended) or plate grid
   - **Export Folder**: Path accessible by OpenELIS server
5. After each run, export results to the configured folder

### 6.2 Standalone Mode Setup (Alternative)

1. Program assay protocol on the instrument via touchscreen
2. Run measurement
3. Insert USB flash drive into the front USB port
4. Export results to USB drive
5. Transfer file to OpenELIS import directory (manual step)

### 6.3 OpenELIS Configuration

1. Deploy the `ThermoMultiskanFC` plugin JAR to the OpenELIS `/plugin` directory
2. Restart OpenELIS (or the application server) to load the plugin
3. Configure the file input path (watched folder) to match the SkanIt export folder
4. Configure test name mappings in the analyzer configuration
5. If using plate map templates: Configure well-to-accession mapping
6. Assign appropriate user roles/permissions for the analyzer module

### 6.4 Network / Filesystem Requirements

| Requirement | Details |
|---|---|
| **Shared folder** | SkanIt export folder must be readable by OpenELIS |
| **File permissions** | OpenELIS service account needs read access; optionally write to archive processed files |
| **Polling interval** | Configure file watcher polling (recommend 30–60 seconds) |
| **File archival** | Processed files should be moved to an archive folder, not deleted |
| **Network protocol** | SMB/CIFS for shared network folders if PC and OpenELIS server are separate |
| **USB fallback** | If no network: USB flash drive transfer from instrument to import directory |

---

## 7. Data Flow Diagram

### 7.1 SkanIt Software Path (Primary)

```
┌─────────────────────┐     USB       ┌──────────────────────┐
│  Thermo Multiskan FC │─────────────►│  SkanIt Software     │
│  (reads plate,       │  OD values   │  (analyzes data,     │
│   measures OD)       │              │   calculates results)│
└─────────────────────┘              └──────────┬───────────┘
                                                 │
                                    Excel/CSV export
                                                 │
                                                 ▼
                                     ┌──────────────────────┐
                                     │  Shared / Watched    │
                                     │  Folder (SMB/CIFS)   │
                                     └──────────┬───────────┘
                                                 │
                                                 │ file watcher
                                                 ▼
                                     ┌──────────────────────┐
                                     │  OpenELIS Global     │
                                     │  (Analyzer Plugin /  │
                                     │   Analyzer Bridge)   │
                                     └──────────┬───────────┘
                                                 │
                                                 │ parse + validate
                                                 ▼
                                     ┌──────────────────────┐
                                     │  OpenELIS Results    │
                                     │  Review Queue        │
                                     └──────────────────────┘
                                                 │
                                                 │ technician review
                                                 ▼
                                     ┌──────────────────────┐
                                     │  Validated Patient   │
                                     │  Results             │
                                     └──────────────────────┘
```

### 7.2 Standalone / USB Path (Fallback)

```
┌─────────────────────┐  USB drive   ┌──────────────────────┐
│  Thermo Multiskan FC │─────────────►│  USB Flash Drive     │
│  (standalone mode,   │  CSV export  │                      │
│   onboard analysis)  │              └──────────┬───────────┘
└─────────────────────┘                          │
                                                 │ manual transfer
                                                 ▼
                                     ┌──────────────────────┐
                                     │  OpenELIS File       │
                                     │  Import UI           │
                                     └──────────┬───────────┘
                                                 │
                                                 │ plugin parses
                                                 ▼
                                     ┌──────────────────────┐
                                     │  OpenELIS Results    │
                                     │  Review Queue        │
                                     └──────────────────────┘
```

> **Key clarification:** The Multiskan FC supports two data paths: (1) SkanIt software on a connected PC (recommended), and (2) standalone operation with USB flash drive export (fallback for sites without reliable PC/network). The plugin should handle files from both paths.

---

## 8. Open Questions & Items Requiring Verification

> **Items requiring hands-on testing or site-specific configuration.**

1. **Exact SkanIt export format**: ✅ RESOLVED — plate grid format with dual grids confirmed

2. **SkanIt version**: Still unknown — need to ask site

3. **Standalone export format**: If using standalone mode with USB export, confirm the file format and structure differ from SkanIt export. ⚠️ *Requires sample file from standalone export*

4. **Sample ID in export**: ✅ RESOLVED — Sample IDs appear in second grid; will be OpenELIS accession numbers in production

5. **Well-to-accession mapping strategy**: ✅ RESOLVED — accession numbers entered directly as sample IDs

6. **What ELISA kits are being run?** Still unknown (Merilisa = brand name?)

7. **Multi-wavelength handling**: Do sites use dual-wavelength reads (e.g., 450 nm + 620 nm reference)? If yes, does SkanIt export both values or the differential? ⚠️ *Requires sample file*

8. **384-well plate support**: Are any target sites using 384-well plates? If yes, the parser must handle both 96 and 384 layouts. ⚠️ *Site-specific*

9. **Interpreted results vs. raw OD**: ✅ RESOLVED — raw OD only; S/CO calculation must be in OpenELIS plugin

10. **Catalog numbers**: Confirm the exact model numbers at target sites — Multiskan FC (#51119000) vs. Multiskan FC with Incubator (#51119100). ⚠️ *Site-specific*

11. **What SkanIt version is installed?** Need to ask site — affects available export options and column naming.

12. **Can SkanIt export well-per-row format, or is plate grid the only option?** Madagascar site only produced plate grid format; verify if this is a limitation of their SkanIt version.

13. **What is the ELISA kit?** Merilisa appears to be the brand name, but need to confirm the actual kit type (HIV, HBsAg, HCV, Malaria Ag, etc.) and manufacturer.

---

## 9. References

- [Thermo Multiskan FC Product Page](https://www.thermofisher.com/us/en/home/life-science/lab-equipment/microplate-instruments/plate-readers/models/multiskan-fc.html)
- [Multiskan FC Catalog — Standard (#51119000)](https://www.thermofisher.com/order/catalog/product/51119000)
- [Multiskan FC Catalog — With Incubator (#51119100)](https://www.thermofisher.com/order/catalog/product/51119100)
- [Multiskan FC User Manual, Cat. No. N07710 (PDF)](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/N07710_Multiskan_FC_UserManual_EN.pdf)
- [Multiskan FC Feature Specification (PDF)](https://assets.fishersci.com/TFS-Assets/BID/Reference-Materials/thermo-scientific-multiskan-fc-microplate-photometer-specifications.pdf)
- [SkanIt Software for Microplate Readers](https://www.thermofisher.com/us/en/home/life-science/lab-equipment/microplate-instruments/plate-readers/software.html)
- [SkanIt 6.1 User Manual (PDF)](https://documents.thermofisher.com/TFS-Assets/LPD/manuals/SkanIt_6.1_UserManual_EN.pdf)
- [OpenELIS Global Analyzer Plugin Wiki](https://github.com/openelisglobal/openelisglobal-core/wiki/Analyzer-plugins)
- [OpenELIS Global Analyzer Plugins Repository](https://github.com/DIGI-UW/openelisglobal-plugins)
- [OpenELIS Analyzer Bridge](https://github.com/DIGI-UW/openelis-analyzer-bridge)
