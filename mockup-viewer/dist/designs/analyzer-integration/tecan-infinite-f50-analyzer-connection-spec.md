# Analyzer Connection Specification: Tecan Infinite F50 ELISA Reader

**Document Version:** 1.0 (Draft)
**Date:** 2026-03-05
**Status:** Draft — Requires sample export files for verification
**Author:** Casey / DIGI-UW

---

## 1. Analyzer Overview

| Field | Value |
|---|---|
| **Analyzer Name** | Tecan Infinite F50 |
| **Manufacturer** | Tecan Group Ltd. |
| **Analyzer Type** | Absorbance Microplate Reader (ELISA) |
| **Models Covered** | Infinite F50 Plus, Infinite F50 Robotic |
| **Software** | Magellan™ Data Analysis Software |
| **Test Category** | Immunology / ELISA |
| **Use Cases** | HIV ELISA, HBsAg, HCV, Malaria Ag, Syphilis, other immunoassay ELISAs |
| **Manual Reference** | Infinite F50 Plus IFU, Doc #30186912 — Tecan, © 2021 |

### 1.1 Instrument Capabilities

The Tecan Infinite F50 is a compact, filter-based absorbance microplate reader optimized for ELISA assays. It uses innovative LED technology with 8 measurement channels for fast parallel reading of 96-well microtiter plates. The instrument is controlled and analyzed through Magellan data analysis software, which provides ELISA-specific analysis (curve fitting, cutoff calculations, qualitative/quantitative interpretation) and multi-format data export.

### 1.2 Connectivity & Ports

| Interface | Specification | Notes |
|---|---|---|
| **USB** | USB 2.0 (connection to PC running Magellan) | Primary computer interface; supplied cable required for EMC compliance |
| **Standalone Operation** | No | Requires PC with Magellan software for operation and data export |

> **Note:** The Infinite F50 connects to a PC running Magellan software via USB. It does not have Ethernet, Wi-Fi, or serial connectivity. All data export happens through Magellan software on the connected PC, not from the instrument directly.

### 1.3 Optical Detection Specifications

| Parameter | Specification |
|---|---|
| **Detection Method** | Absorbance (filter-based) |
| **Light Source** | 8 LEDs (long-life, 10× longer than halogen) |
| **Measurement Channels** | 8 measurement + 1 reference |
| **Wavelength Range** | 400–750 nm |
| **Standard Filters** | 405 nm, 450 nm, 492 nm, 620 nm |
| **Plate Format** | 96-well microtiter plates |
| **Read Speed** | ~8 seconds for full 96-well plate |

### 1.4 Standard ELISA Filters

| Filter Wavelength | Common ELISA Use |
|---|---|
| 405 nm | pNPP substrate (alkaline phosphatase) |
| 450 nm | TMB substrate (HRP conjugate) — most common |
| 492 nm | OPD substrate |
| 620 nm | Reference wavelength (background subtraction) |

---

## 2. Communication Protocol

### 2.1 Integration Method: File-Based (CSV / XLSX)

The Tecan Infinite F50 does **not** use ASTM or HL7 natively. Integration with OpenELIS Global will use a **file-based approach** where Magellan software exports result data as CSV/TSV or Excel files to a monitored directory.

| Parameter | Value |
|---|---|
| **Protocol** | File-based (ASCII or XLSX export to shared/watched folder) |
| **Direction** | Unidirectional (Analyzer → OpenELIS) |
| **Transport** | Local filesystem / Network shared folder |
| **Middleware** | OpenELIS Analyzer Bridge (file watcher transport) or direct plugin file reader |

### 2.2 Data File Types

| File Type | Extension | Description | Integration Relevance |
|---|---|---|---|
| **Magellan Workspace** | `.wsp` | Proprietary run data + analysis | Not directly parseable; used by Magellan internally |
| **ASCII Export** | `.csv` / `.tsv` / `.txt` | Tab or comma-delimited results export | **Primary integration file** |
| **Excel Export** | `.xlsx` | Excel workbook with plate data | **Alternative integration file** |

### 2.3 Integration Architecture Options

**Option A — Direct Plugin (Recommended for simplicity)**
Magellan exports CSV/XLSX → shared folder → OpenELIS file-based analyzer plugin reads and parses the file.

**Option B — Analyzer Bridge Middleware**
Magellan exports CSV → shared folder → OpenELIS Analyzer Bridge (file watcher) → forwards parsed data to OpenELIS via HTTP.

### 2.4 Data Transfer Pathways

Data files leave the Tecan Infinite F50 system through Magellan software:

1. **USB → Magellan (primary)**: Instrument connects to PC running Magellan via USB. Magellan controls the instrument, receives measurement data, and performs analysis.
2. **Magellan → File Export**: After measurement and analysis, Magellan exports results to ASCII or Excel format. Export can be configured to happen automatically after each run or performed manually.

> **For LIMS integration, the recommended flow is:** Infinite F50 → USB → Magellan → ASCII/Excel Export → Shared folder → OpenELIS

### 2.5 Export Configuration in Magellan

Magellan export is configured in the method definition via the "Create/edit a method" wizard:

| Setting | Options | Recommended |
|---|---|---|
| **Export Format** | ASCII (text) or Excel | ASCII (CSV) for simplicity |
| **Delimiter** | Tab, comma, semicolon (configurable) | Tab (default) or comma |
| **Export Trigger** | Automatic after measurement or manual | Automatic |
| **Export Location** | Configurable directory path | Network share accessible by OpenELIS |
| **File Naming** | Same name as .wsp file (for ASCII) | Ensure unique names per run |

### 2.6 Sample ID Input

Magellan supports importing sample ID lists to associate well positions with patient identifiers:

- Sample IDs can be entered manually in the plate layout
- Sample ID lists can be imported from text files
- When sample IDs are configured, they appear in the export alongside OD values

### 2.7 Bidirectional Considerations (Future)

Magellan supports importing sample ID lists from external files. A future enhancement could support OpenELIS sending worklists to Magellan by generating sample ID list files. This is **out of scope** for the initial implementation.

---

## 3. Data Format Specification

### 3.1 Export File Format

| Property | Value |
|---|---|
| **File Format** | ASCII (CSV/TSV) or Excel (`.xlsx`) |
| **Encoding** | UTF-8 or system locale |
| **Delimiter** | Tab (default) or comma (configurable) |
| **Layout** | Metadata header rows + 8×12 plate grid |
| **Source Software** | Magellan → Export (Automatic or Manual) |

### 3.2 ASCII Export Structure (Plate Grid Layout)

The standard Magellan ASCII export for an ELISA measurement follows this structure:

**Header Section (metadata rows):**

```
Application: Magellan
Instrument: Infinite F50
Method: [Method Name]
Date: [YYYY-MM-DD]
Time: [HH:MM:SS]
Wavelength: 450 nm
Plate: [Plate ID]
```

**Data Section (OD plate grid):**

```
<>	1	2	3	4	5	6	7	8	9	10	11	12
A	0.052	0.048	1.234	0.876	0.543	...
B	0.051	0.047	0.987	0.654	0.321	...
C	2.345	2.401	0.123	0.456	0.789	...
...
H	0.098	0.101	0.234	0.567	0.890	...
```

> **⚠️ NOTE:** The exact header format and column/row delimiters must be verified against sample export files from the target site's Magellan version. The structure above is representative based on documentation and community references.

### 3.3 Excel Export Structure

When exported to Excel, the data follows a similar layout within a worksheet:

- Row 1–N: Metadata (instrument, method, date, wavelength, etc.)
- Plate grid: Row labels (A–H) in column 1, column numbers (1–12) in header row, OD values in the grid cells
- Multiple wavelength reads may appear as separate grids (stacked vertically) or separate worksheets

### 3.4 Export Column Mapping

| Export Field | Description | Data Type | Example | Maps To (OpenELIS) |
|---|---|---|---|---|
| Row label | Plate row (A–H) | String | `A`, `B` | — (well position, part 1) |
| Column number | Plate column (1–12) | Integer | `1`, `12` | — (well position, part 2) |
| Well position | Combined row+column | String | `A1`, `H12` | — (used for sample mapping) |
| OD value | Absorbance reading | Float | `1.234`, `0.052` | Result value |
| Wavelength | Measurement wavelength | Integer (nm) | `450` | — (used for test mapping) |
| Sample ID | Patient/sample identifier (if configured) | String | `24-00001234` | Accession number |

### 3.5 Sample CSV Output Example

```
Application:	Magellan
Instrument:	Infinite F50
Method:	HIV_ELISA_450
Date:	2026-03-05
Time:	14:23:45
Wavelength:	450 nm

<>	1	2	3	4	5	6	7	8	9	10	11	12
A	2.345	2.401	1.234	0.876	0.543	0.234	0.567	0.890	1.123	0.456	0.789	0.321
B	0.052	0.048	0.987	0.654	0.321	0.123	0.456	0.789	1.012	0.345	0.678	0.210
C	0.051	0.047	0.234	0.567	0.890	1.123	0.456	0.789	0.321	0.654	0.987	0.543
D	1.567	1.601	0.345	0.678	0.210	0.543	0.876	1.209	0.432	0.765	1.098	0.654
E	0.098	0.101	0.456	0.789	0.321	0.654	0.987	0.543	0.876	1.209	0.432	0.765
F	0.099	0.103	0.567	0.890	0.432	0.765	1.098	0.654	0.987	0.321	0.543	0.876
G	0.050	0.049	0.678	0.210	0.543	0.876	1.209	0.765	1.098	0.432	0.654	0.987
H	0.048	0.051	0.789	0.321	0.654	0.987	0.543	0.876	1.209	0.543	0.765	1.098
```

Where (in a typical HIV ELISA plate layout):

| Well(s) | Content | Role |
|---|---|---|
| A1–A2 | Positive Control (high) | QC |
| B1–B2 | Negative Control | QC |
| C1–C2 | Positive Control (low / cutoff calibrator) | QC |
| D1–D2 | Cutoff Calibrator | QC / Cutoff calculation |
| E1–E2, F1–F2 | Conjugate/Substrate Blank | QC |
| G1–H2 | Additional controls or empty | QC |
| A3–H12 | Patient samples | Unknown / test samples |

> **⚠️ NOTE:** Plate layout conventions vary by ELISA kit manufacturer. The above is illustrative. Actual layouts must be confirmed per assay kit.

---

## 4. OpenELIS Plugin Specification

### 4.1 Plugin Identity

| Property | Value |
|---|---|
| **Plugin Name** | `TecanInfiniteF50` |
| **Analyzer Name (DB)** | `TecanInfiniteF50` |
| **Package** | `oe.plugin.analyzer` |
| **Reference Plugin** | `BioRadCFXOpus` (similar file-based analyzer) |
| **Menu Label** | `Tecan Infinite F50` |
| **Action URL** | `/AnalyzerResults?type=TecanInfiniteF50` |

### 4.2 Required Plugin Classes

| Class | Extends / Implements | Purpose |
|---|---|---|
| `TecanInfiniteF50AnalyzerImplementation` | `AnalyzerImporterPlugin` | Registers analyzer, maps test names, provides line inserter |
| `TecanInfiniteF50Menu` | `MenuPlugin` | Adds menu entry under Analyzer Results |
| `TecanInfiniteF50Permission` | `PermissionPlugin` | Binds role-based access |
| `TecanInfiniteF50Analyzer` | (Analyzer line inserter) | Parses CSV/XLSX, extracts OD results, inserts into OpenELIS |

### 4.3 Configuration XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin>
  <extension point="org.openelisglobal.analyzerimporter">
    <analyzer name="TecanInfiniteF50AnalyzerImplementation"/>
  </extension>
  <extension point="org.openelisglobal.menu">
    <menu name="TecanInfiniteF50Menu"/>
  </extension>
  <extension point="org.openelisglobal.permission">
    <permission name="TecanInfiniteF50Permission"/>
  </extension>
</plugin>
```

### 4.4 File Identification Logic

The `isTargetAnalyzer()` method should identify Tecan Infinite F50 files by checking for:

1. **Header content match**: Presence of keywords `Magellan` or `Infinite F50` or `Tecan` in the first 10 lines of the file
2. **Plate grid detection**: Row labels A–H followed by 12 numeric values (tab or comma separated)
3. **Optional secondary check**: File naming convention if configured by site

### 4.5 Parsing Logic

```
1. READ file (detect delimiter: tab or comma)
2. SCAN header rows for metadata:
   - Extract Wavelength (e.g., "450 nm")
   - Extract Method Name (e.g., "HIV_ELISA_450")
   - Extract Date/Time
   - Extract Sample IDs if present in header section
3. LOCATE plate grid:
   - Find row starting with "<>" or column header row (1, 2, 3...12)
   - Next 8 rows are A–H with 12 OD values each
4. FOR each well position (A1–H12):
   a. DETERMINE if well is a patient sample or control:
      - If Sample ID mapping available → use mapping
      - If plate layout template configured → use template
      - Otherwise → import all wells, let technician classify
   b. EXTRACT OD value for the well
   c. MAP Wavelength → OpenELIS test name via analyzer-test mapping
   d. MAP Sample ID / Well Position → OpenELIS accession number
   e. INSERT into analyzer_results table
5. IF multiple wavelength grids present:
   - Parse each grid separately
   - Associate wavelength with each set of OD values
6. VALIDATE: Check for duplicate file (filename + checksum)
```

### 4.6 Test Name Mapping

The plugin's `connect()` method must register mappings between Magellan method/wavelength combinations and OpenELIS test names. These mappings are **deployment-specific**.

| Magellan Method / Wavelength | OpenELIS Test Name (Example) | Notes |
|---|---|---|
| `450 nm` (HIV ELISA method) | `HIV ELISA OD` | Primary measurement |
| `620 nm` (reference) | `Reference OD 620` | Background subtraction |
| `450 nm` (HBsAg method) | `HBsAg ELISA OD` | Hepatitis B |
| `450 nm` (HCV method) | `HCV ELISA OD` | Hepatitis C |

> **Note:** Actual mappings depend on the ELISA kits and methods configured at each site. The plugin should support configurable mappings via the standard analyzer test name mapping UI.

---

## 5. Result Interpretation

### 5.1 ELISA Result Interpretation

ELISA results from the Infinite F50 are **optical density (OD) values**. The interpretation (positive/negative/equivocal) is typically performed by one of:

1. **Magellan software** — can perform cutoff calculations and export interpreted results
2. **OpenELIS** — receives raw OD values and applies cutoff logic (future scope)
3. **Manual review** — technician reviews OD values against kit-defined cutoffs

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
| Positive Control (high) | OD above kit-defined minimum | Reject entire plate |
| Negative Control | OD below kit-defined maximum | Reject entire plate |
| Cutoff Calibrator | OD within expected range | Reject entire plate |
| Substrate Blank | OD ≈ 0.000 (minimal background) | Flag for review |

---

## 6. Deployment Configuration

### 6.1 Magellan Software Setup

1. Connect Infinite F50 to PC via USB cable
2. Start Magellan — verify instrument is detected
3. Open Magellan → **Create/Edit Method** → **Data Export** section
4. Configure export settings:
   - **Export Format**: ASCII (tab-delimited) or Excel
   - **Export Folder**: Path accessible by OpenELIS server (network share or local directory)
   - **Auto-export**: Enable "Export data after measurement"
5. If using sample IDs: Configure sample ID import from text file or manual entry
6. Save method — export will trigger after each plate measurement

### 6.2 OpenELIS Configuration

1. Deploy the `TecanInfiniteF50` plugin JAR to the OpenELIS `/plugin` directory
2. Restart OpenELIS (or the application server) to load the plugin
3. Configure the file input path (watched folder) to match the Magellan export folder
4. Configure test name mappings in the analyzer configuration (map wavelengths/methods to OpenELIS tests)
5. If using plate map templates: Configure well-to-accession mapping
6. Assign appropriate user roles/permissions for the analyzer module

### 6.3 Network / Filesystem Requirements

| Requirement | Details |
|---|---|
| **Shared folder** | Magellan export folder must be readable by OpenELIS |
| **File permissions** | OpenELIS service account needs read access; optionally write to archive processed files |
| **Polling interval** | Configure file watcher polling (recommend 30–60 seconds) |
| **File archival** | Processed files should be moved to an archive folder, not deleted |
| **Network protocol** | SMB/CIFS for shared network folders if PC and OpenELIS server are separate |

---

## 7. Data Flow Diagram

```
┌─────────────────────┐     USB       ┌──────────────────────┐
│  Tecan Infinite F50  │─────────────►│  Magellan Software   │
│  (reads plate,       │  OD values   │  (analyzes data,     │
│   measures OD)       │              │   calculates results)│
└─────────────────────┘              └──────────┬───────────┘
                                                 │
                                    ASCII/Excel auto-export
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

> **Key clarification:** The CSV/Excel export happens from **Magellan Software** (running on a PC), not from the Infinite F50 instrument directly. The instrument produces raw absorbance data which is transferred to Magellan via USB. Magellan performs analysis and exports for LIMS integration.

---

## 8. Open Questions & Items Requiring Verification

> **Items requiring hands-on testing or site-specific configuration.**

1. **Exact ASCII export format**: Confirm exact header structure, delimiter, and plate grid format from your Magellan version. Export a sample file and verify. ⚠️ *Requires sample file from target site*

2. **Sample ID field in export**: Confirm whether sample IDs appear in the export and in what format. If Magellan is configured with sample ID lists, do they appear as an additional column or row in the export? ⚠️ *Requires Magellan configuration review*

3. **Well-to-accession mapping strategy**: Do the target sites enter accession numbers in Magellan before the run, or do they use a separate plate map? ⚠️ *Site-specific workflow decision*

4. **What ELISA kits are being run?** (HIV, HBsAg, HCV, Malaria Ag, Syphilis?) This determines the default test mappings and plate layouts to ship with the plugin. ⚠️ *Site-specific*

5. **Multi-wavelength handling**: Do sites use dual-wavelength reads (e.g., 450 nm measurement + 620 nm reference)? If yes, does Magellan export the differential or both raw values? ⚠️ *Requires sample file*

6. **Magellan version**: What version of Magellan is installed at target sites? Export format may vary between versions. ⚠️ *Site-specific*

7. **Auto-export configuration**: Confirm that Magellan at target sites supports auto-export after measurement. Some older versions may require manual export. ⚠️ *Requires Magellan version check*

8. **Interpreted results vs. raw OD**: Does the site want OpenELIS to receive raw OD values only, or also Magellan's calculated results (S/CO ratio, qualitative calls)? ⚠️ *Site-specific workflow decision*

---

## 9. References

- [Tecan Infinite F50 Product Page](https://lifesciences.tecan.com/products/microplate_readers/infinite_f50)
- [Tecan Magellan Data Analysis Software](https://lifesciences.tecan.com/software-magellan)
- [Magellan Data Export Guide](https://www.tecan.com/knowledge-portal/how-to-export-data-in-magellan-pro-/sparkcontrol-magellan)
- [Magellan IFU Doc #30143531](https://www.tecan.com/hubfs/30143531_IFU_MAGELLAN_ENGLISH_V1_4.pdf)
- [Tecan Magellan Sample ID Import](https://www.tecan.com/knowledge-portal/how-to-import-sample-id-lists)
- [elisar R Package — Tecan ELISA File Parser](https://github.com/koncina/elisar)
- [OpenELIS Global Analyzer Plugin Wiki](https://github.com/openelisglobal/openelisglobal-core/wiki/Analyzer-plugins)
- [OpenELIS Global Analyzer Plugins Repository](https://github.com/DIGI-UW/openelisglobal-plugins)
- [OpenELIS Analyzer Bridge](https://github.com/DIGI-UW/openelis-analyzer-bridge)
