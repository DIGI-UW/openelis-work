# Analyzer Connection Specification: Tecan Infinite F50 ELISA Reader

**Document Version:** 2.0 (Validated)
**Date:** 2026-03-06
**Status:** VALIDATED — Updated with real export files from Madagascar site
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
| **Kits Validated (Madagascar)** | Wantai (HBsAg/HIV), Pareekshak HIV-1/2 ELISA Kit (Bhat Bio-Tech India) |
| **Manual Reference** | Infinite F50 Plus IFU, Doc #30186912 — Tecan, © 2021 |

### 1.1 Instrument Capabilities

The Tecan Infinite F50 is a compact, filter-based absorbance microplate reader optimized for ELISA assays. It uses innovative LED technology with 8 measurement channels for fast parallel reading of 96-well microtiter plates. The instrument is controlled and analyzed through Magellan data analysis software, which provides ELISA-specific analysis (curve fitting, cutoff calculations, qualitative/quantitative interpretation) and multi-format data export.

**Note on Madagascar site integration:** The Madagascar laboratory does not use standard Magellan ASCII/CSV exports for LIMS integration. Instead, the lab has built custom Excel workbook templates that process raw OD data exported from Magellan. The OpenELIS parser is designed to target these lab-specific Excel templates rather than native Magellan exports.

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

### 2.1 Integration Method: Custom Excel Template Import

The Tecan Infinite F50 at the Madagascar site uses a **custom Excel template workflow** rather than standard Magellan exports. The integration process is:

1. **Magellan raw export** → OD values exported to Excel workbook (DO_palque sheet)
2. **Lab template processing** → Excel formulas (in Resultat sheet) process OD values to calculate S/CO ratios and qualitative results
3. **OpenELIS import** → Custom XLSX parser reads the Resultat sheet and imports OD + calculated results

| Parameter | Value |
|---|---|
| **Protocol** | File-based (XLSX import to shared/watched folder) |
| **File Type** | Custom Excel workbook (lab-built templates, not native Magellan export) |
| **Direction** | Unidirectional (Excel Template → OpenELIS) |
| **Transport** | Local filesystem / Network shared folder |
| **Middleware** | OpenELIS file-based analyzer plugin (XLSX parser) |

### 2.2 Data File Types

| File Type | Extension | Description | Integration Relevance |
|---|---|---|---|
| **Magellan Workspace** | `.wsp` | Proprietary run data + analysis | Not directly used; raw data source |
| **Lab Excel Template** | `.xlsx` | Lab-built workbook with multi-sheet structure | **Primary integration file** |
| **ASCII Export (Legacy)** | `.csv` / `.tsv` / `.txt` | Magellan ASCII export (for reference) | Not used at Madagascar site |

**Madagascar Site File Structure:**
The custom Excel templates contain 3–4 sheets:
- **Plan_plaque**: Plate layout (controls + patient sample IDs in grid format)
- **DO_palque**: Magellan OD values grid (+ optional duplicate grid)
- **Resultat**: Results table (well-per-row with OD, S/CO, qualitative results)
- **Resultat_2** (optional): Corrected results if Resultat has formula errors

### 2.3 Integration Architecture (Madagascar Site)

**Recommended: Direct Plugin (XLSX Parser)**
Lab Excel template → shared folder → OpenELIS file-based analyzer plugin (XLSX parser) reads and parses the file.

This approach:
- Targets the multi-sheet XLSX structure directly
- Extracts both raw OD and calculated results from the Resultat sheet
- Handles formula errors gracefully (falls back to Resultat_2 if available)
- Supports both kit types (Wantai and Pareekshak) via kit-specific column mappings

### 2.4 Data Transfer Pathways (Madagascar Site)

The data flow is distinct from standard Magellan exports:

1. **USB → Magellan**: Instrument connects to PC running Magellan via USB. Magellan controls the instrument and receives raw OD measurement data.
2. **Magellan → Excel DO_palque Sheet**: The lab manually (or via macro) exports raw OD values from Magellan into the "DO_palque" sheet of the custom Excel template.
3. **Excel Formulas → Resultat Sheet**: The template contains Excel formulas that process the OD values in DO_palque to calculate:
   - Cutoff (CO) from negative control mean
   - S/CO ratio (Sample OD / Cutoff)
   - Qualitative results (0 = Non-reactive, 1 = Reactive)
4. **Excel File → Shared Folder**: The completed Excel template is saved to a shared folder accessible by OpenELIS.
5. **OpenELIS Plugin → Resultat Sheet**: The OpenELIS XLSX parser reads the Resultat sheet and imports OD + calculated results.

> **For LIMS integration, the flow is:** Infinite F50 → USB → Magellan → Lab Excel Template (DO_palque) → Excel Formulas (Resultat) → Shared folder → OpenELIS

### 2.5 Excel Template Configuration (Madagascar Site)

The Madagascar lab has built custom Excel templates specific to each ELISA kit. Template structure:

| Sheet | Purpose | Content |
|---|---|---|
| **Plan_plaque** | Plate layout metadata | Date, kit name (nom du réactif), LOT, technician name (Manipulateur), plate number; 8×12 grid of sample IDs |
| **DO_palque** | Raw OD values | Metadata header + 8×12 OD grid from Magellan (+ optional duplicate grid below) |
| **Resultat** | Calculated results | Well-per-row table with Sample ID, DO_sample, DO/Cut-off ratio, Results (0/1), QC metadata (NC, cutoff value) |
| **Resultat_2** | Corrected results (optional) | Same as Resultat, but with formula errors fixed (appears when Resultat contains #VALUE! errors) |

**Data Entry Process:**
1. Run plate on Magellan
2. Export OD values to DO_palque sheet
3. Excel formulas automatically calculate results in Resultat sheet
4. If formulas have errors (e.g., "NoCalc" in OD grid), manually correct and save to Resultat_2
5. Save Excel file to shared folder for OpenELIS pickup

### 2.6 Sample ID Input (Madagascar Site)

Sample IDs are entered in the Plan_plaque sheet:

- **Control wells** are identified by well ID: NEG (negative), POS (positive), BLANK, NEG1, NEG2, PC1–PC3 (positive controls)
- **Patient samples** are entered in the remaining wells in column-major order (starting F1 for 8-sample wells, or after control block)
- Accession number formats vary by kit:
  - **Wantai**: CG-M4-00-001 through CG-M4-00-091 (column-major, 91 samples)
  - **Pareekshak**: FE-format (FE082031, FE080040, etc., up to 88 samples per plate)
- The Resultat sheet lists all samples (controls + patients) in the well-per-row table with full accession numbers

### 2.7 Multi-Kit Support (Madagascar Site)

Two ELISA kits have been validated with the custom Excel templates:

1. **Wantai Kit** (likely HBsAg or HIV)
   - Control layout: NEG (A1–C1), POS (D1–E1)
   - Patient samples: CG-M4-00-001 through CG-M4-00-091
   - Plate format: Full 96-well plate (91 patients + 5 controls)
   - Cutoff example: 0.221566

2. **Pareekshak HIV-1/2 ELISA Kit** (Bhat Bio-Tech India)
   - Control layout: BLANK (A1), NEG1 (B1), NEG2 (C1), PC1 (D1), PC2 (E1), PC3 (F1)
   - Patient samples: FE-format accession numbers (up to 88 samples)
   - Plate format: Full 96-well plate
   - Cutoff examples: 0.47795, 0.45031
   - Special handling: Optional Resultat_2 sheet for corrected results if Resultat has formula errors

---

## 3. Data Format Specification (Madagascar Site)

### 3.1 Custom Excel Template Structure

The Madagascar lab uses multi-sheet Excel workbooks (.xlsx) with the following structure:

| Property | Value |
|---|---|
| **File Format** | Excel workbook (`.xlsx`) |
| **Sheet Count** | 3–4 sheets (Plan_plaque, DO_palque, Resultat, optionally Resultat_2) |
| **Encoding** | UTF-8 (XLSX standard) |
| **Decimal Separator** | Period (.) |
| **Source** | Magellan OD export → Lab Excel template processing |

### 3.2 Sheet 1: Plan_plaque (Plate Layout)

Metadata header rows followed by 8×12 grid of sample IDs.

**Header rows (example for Wantai kit):**

```
Date:           2026-03-05
nom du réactif: WANTAI
LOT:            AW
Manipulateur:   [Technician Name]
numéro de plaque: [Plate Number]
```

**Sample ID grid (8 rows A–H, 12 columns 1–12):**

```
        1           2           3           4           5       ...
A       NEG         NEG         NEG         ...
B       ...
C       ...
D       POS         POS         ...
E       ...
F       CG-M4-00-001 CG-M4-00-009 CG-M4-00-017 ...
G       CG-M4-00-002 CG-M4-00-010 CG-M4-00-018 ...
H       CG-M4-00-003 CG-M4-00-011 CG-M4-00-019 ...
```

Sample IDs are arranged in column-major order (A3, B3, C3, ... fill column 3 first, then column 4, etc.).

### 3.3 Sheet 2: DO_palque (OD Values)

Same metadata header + 8×12 grid of optical density values from Magellan. Optional duplicate OD grid may appear below (rows 20–28 with "<>" header).

**Header rows (same as Plan_plaque):**

```
Date:           2026-03-05
nom du réactif: WANTAI
LOT:            AW
Manipulateur:   [Technician Name]
numéro de plaque: [Plate Number]

DO Samples      [wavelength info if present]
```

**OD grid (8 rows A–H, 12 columns 1–12):**

```
<>      1       2       3       4       5       6       7       8       9       10      11      12
A       0.0608  0.0612  0.0574  0.0580  0.0620  ...
B       2.156   2.189   0.123   0.456   0.789   ...
C       1.902   1.876   0.234   0.567   0.890   ...
...
H       0.098   0.101   0.234   0.567   0.890   ...
```

**Special value: "NoCalc"** — appears when Magellan reader failed to capture OD (optical error). This breaks downstream Excel formulas.

### 3.4 Sheet 3: Resultat (Results Table — Well-Per-Row)

Core results table with one row per sample (control or patient).

**Column structure:**

| Column | Header (Example) | Data Type | Description | Example |
|---|---|---|---|---|
| A | Sample ID | String | Well/Sample identifier | NEG, POS, CG-M4-00-001 |
| B | DO_sample | Float | Raw OD value | 0.0608 |
| C | DO/Cut-off | Float | S/CO ratio (OD divided by cutoff) | 0.274 (NEG), 7.866 (patient) |
| D | Results | Integer | Qualitative result (0 = Non-reactive, 1 = Reactive) | 0 or 1 |
| G | Calculation Nc | Float | Mean of negative control OD | 0.0615666 |
| H | valeur Nc | Float | Negative control value (same as G) | 0.0615666 |
| I | Cut-off | Float | Calculated cutoff value | 0.221566 |

**Data rows:**
- Rows 2–N: Control samples (NEG, POS, BLANK, etc.), then patient samples
- Total rows: 93 for Wantai (3 NEG + 2 POS + 88 patients), varies for other kits

**Example Resultat data (Wantai):**

```
Sample ID           DO_sample   DO/Cut-off  Results  Calculation Nc   valeur Nc   Cut-off
NEG                 0.0608      0.274       0        0.0615666        0.0615666   0.221566
NEG                 0.0612      0.276       0
NEG                 0.0574      0.259       0
POS                 2.156       9.731       1
POS                 2.189       9.879       1
CG-M4-00-001        1.234       5.570       1
CG-M4-00-002        0.456       2.058       1
...
```

### 3.5 Sheet 4: Resultat_2 (Optional — Corrected Results)

Identical structure to Resultat, but with formula errors corrected. This sheet appears only when Resultat contains #VALUE! errors (caused by "NoCalc" or reader failures).

**Example scenario:**
- If DO_palque contains "NoCalc" values
- Excel formulas in Resultat reference these cells → #VALUE! errors
- Lab manually corrects OD values and recalculates → Resultat_2 sheet created
- OpenELIS parser detects #VALUE! in Resultat and falls back to Resultat_2

### 3.6 OD Grid Layout & Well Mapping

Both DO_palque and Plan_plaque grids use the same well position mapping:

```
Well position = Row letter (A–H) + Column number (1–12)
Column-major ordering (for samples): Fill column 1, then column 2, etc.
```

Example mapping (Wantai, 91 patients):
```
A1–C1: NEG controls
D1–E1: POS controls
F1–H1: Patients 1–3
F2–H2: Patients 4–6
...
F12–H12: Patients 88–90
(Patient 91 in another well, depending on exact layout)
```

### 3.7 Error Handling & Special Cases

**"NoCalc" Values:**
When Magellan reader fails (optical error, bubble, etc.), the exported OD cell contains the string "NoCalc" instead of a float. This breaks downstream Excel formulas (results in #VALUE! error).

**Formula Error Recovery:**
When Resultat sheet contains #VALUE! errors:
1. Lab identifies the cause (usually NoCalc in DO_palque)
2. Lab corrects the OD value or re-measures the well
3. Lab copies corrected formulas to Resultat_2 sheet
4. OpenELIS parser detects #VALUE! and falls back to Resultat_2

**Accession Number Annotations:**
Some samples may have manual annotations appended:
- Example: "FE040121H+++" (Pareekshak, H+++ possibly indicates highly positive)
- OpenELIS parser should extract the base accession number and flag the annotation for review

### 3.8 Kit-Specific Column Mappings

**Wantai Kit Template:**
- Resultat columns: A (Sample ID), B (DO_sample), C (DO/Cut-off), D (Results), G (Calculation Nc), H (valeur Nc), I (Cut-off)
- Cutoff formula: Typically NC_mean + Factor (e.g., 0.0616 + 0.160 ≈ 0.2216)
- Control IDs: NEG, POS

**Pareekshak Kit Template:**
- Resultat columns: Same as Wantai (A, B, C, D, plus QC columns G, H, I)
- Cutoff formula: Similar to Wantai (NC_mean + Factor)
- Control IDs: BLANK, NEG1, NEG2, PC1, PC2, PC3
- QC validation criteria (visible in side columns):
  - DO_BLANK < 0.150
  - DO_NEG < 0.250
  - PC − NC > 0.6
  - Mean_DO_POS_PC (positive control mean)
- Optional Resultat_2 for corrected results

---

## 4. OpenELIS Plugin Specification (XLSX Parser)

### 4.1 Plugin Identity

| Property | Value |
|---|---|
| **Plugin Name** | `TecanInfiniteF50` |
| **Analyzer Name (DB)** | `TecanInfiniteF50` |
| **Package** | `oe.plugin.analyzer` |
| **Reference Plugin** | `BioRadCFXOpus` (similar file-based analyzer) |
| **Menu Label** | `Tecan Infinite F50` |
| **Action URL** | `/AnalyzerResults?type=TecanInfiniteF50` |
| **File Type** | XLSX (Excel workbook) |
| **Parser Type** | Custom multi-sheet XLSX parser |

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

The `isTargetAnalyzer()` method should identify Tecan Infinite F50 XLSX files by checking for:

1. **File extension**: `.xlsx` (Excel workbook)
2. **Sheet detection**: Presence of sheets named "Plan_plaque", "DO_palque", and "Resultat"
3. **Content validation**:
   - Plan_plaque: Metadata header (date, nom du réactif, LOT, Manipulateur, numéro de plaque) + 8×12 grid of sample IDs
   - DO_palque: Same metadata + 8×12 grid of OD values (numeric or "NoCalc")
   - Resultat: Well-per-row table with columns: Sample ID, DO_sample, DO/Cut-off, Results
4. **Optional secondary check**: Metadata keywords in French (nom du réactif, Manipulateur, numéro de plaque) indicate Madagascar site template

### 4.5 Parsing Logic (XLSX Multi-Sheet)

```
1. OPEN XLSX file
2. VALIDATE sheet presence: Plan_plaque, DO_palque, Resultat (or Resultat_2)
3. READ Plan_plaque sheet:
   - Extract metadata: Date, kit name (nom du réactif), LOT, technician (Manipulateur), plate number
   - Extract 8×12 grid of sample IDs
4. READ DO_palque sheet:
   - Extract same metadata (for cross-validation)
   - Extract 8×12 OD grid (or grids if duplicate present)
   - Handle "NoCalc" values (mark for error)
5. READ Resultat sheet (primary results):
   - Check for #VALUE! errors in column D (Results) or C (DO/Cut-off)
   - If #VALUE! errors detected:
     a. Log error
     b. Attempt to read Resultat_2 sheet instead
6. PARSE well-per-row results table:
   - FOR each row (starting row 2):
     a. EXTRACT Sample ID (Column A)
     b. EXTRACT DO_sample (Column B, raw OD float)
     c. EXTRACT DO/Cut-off (Column C, S/CO ratio float)
     d. EXTRACT Results (Column D, 0 or 1)
     e. EXTRACT QC metadata: Nc (Column G), Cut-off (Column I)
7. CLASSIFY samples:
   - IF Sample ID matches control pattern (NEG, POS, BLANK, PC*, NC*, etc.):
     a. Mark as QC/Control
     b. Skip from patient import (or flag for review)
   - IF Sample ID is patient accession:
     a. Parse accession format (CG-M4-00-xxx or FE-format)
     b. Handle annotations (e.g., "H+++") by extraction base ID + flag
8. FOR each patient sample:
   a. MAP Sample ID → OpenELIS accession number
   b. MAP OD value (Column B) → Result value (test: "Tecan Infinite F50 OD 450")
   c. MAP S/CO ratio (Column C) → Optional numeric result (test: "Tecan Infinite F50 S/CO")
   d. MAP Results (Column D) → Optional qualitative result (0/1)
   e. INSERT into analyzer_results table (with both raw OD and interpreted results)
9. QC VALIDATION:
   - Extract control OD values from Results table
   - Check Blank, Negative, Positive control ranges (kit-specific)
   - If QC fails: Mark plate/batch with warning
10. FILE TRACKING:
    - Check for duplicate file (filename + checksum + date)
    - Move/archive processed file
```

### 4.6 Test Name Mapping (Kit-Specific)

The plugin's `connect()` method must register mappings between kit/wavelength combinations and OpenELIS test names. These mappings are **kit and site-specific**.

| Kit | Wavelength | OpenELIS Test Name (Raw OD) | OpenELIS Test Name (S/CO) | OpenELIS Test Name (Qualitative) | Notes |
|---|---|---|---|---|---|
| Wantai (HBsAg/HIV) | 450 nm | `Tecan Wantai OD 450` | `Tecan Wantai S/CO` | `Tecan Wantai Result` | Madagascar validated |
| Pareekshak HIV-1/2 | 450 nm | `Tecan Pareekshak OD 450` | `Tecan Pareekshak S/CO` | `Tecan Pareekshak Result` | Madagascar validated |
| Generic (HIV ELISA) | 450 nm | `Tecan Infinite F50 OD 450` | `Tecan Infinite F50 S/CO` | `Tecan Infinite F50 Result` | Fallback mapping |

**Mapping Logic:**
1. Identify kit from metadata (nom du réactif in Plan_plaque)
2. Map to corresponding test name combination
3. For each patient result row:
   - Column B (DO_sample) → Raw OD test result
   - Column C (DO/Cut-off) → S/CO test result
   - Column D (Results) → Qualitative result (0 = Non-reactive, 1 = Reactive)

> **Note:** Actual mappings are deployment-specific and configured via the standard analyzer test name mapping UI in OpenELIS.

---

## 5. Result Interpretation (Madagascar Site)

### 5.1 ELISA Result Interpretation — Pre-Calculated by Excel Template

Unlike standard Magellan exports, the Madagascar custom templates **already contain calculated results**. The Excel formulas in the Resultat sheet provide:

1. **Raw OD values** (Column B: DO_sample)
2. **S/CO ratios** (Column C: DO/Cut-off, calculated by formula)
3. **Qualitative results** (Column D: Results, 0 = Non-reactive, 1 = Reactive)
4. **Cutoff values** (Column I: calculated from negative control mean + factor)

The OpenELIS plugin imports **all three levels** of results:
- Raw OD for reference and validation
- S/CO ratio for quantitative interpretation
- Qualitative results (0/1) for clinical use

### 5.2 Cutoff Calculation (By Excel Template)

The Excel templates implement kit-specific formulas:

| Kit | Formula | Nc Value | Factor | Cut-off Example |
|---|---|---|---|---|
| **Wantai** | CO = NC_mean + 0.160 (approx.) | 0.0616 | ~0.160 | 0.2216 |
| **Pareekshak** | CO = NC_mean + Factor (similar) | ~0.047 | ~0.401 | 0.4780, 0.4503 |

- **NC_mean** (Column G): Calculated as mean of negative control OD values
- **S/CO ratio**: Sample_OD / Cut-off_OD
- **Interpretation threshold**: S/CO ≥ 1.0 → Reactive (Results = 1); S/CO < 1.0 → Non-reactive (Results = 0)

### 5.3 Quality Control Validation

The Excel templates include QC criteria in side columns (visible but not parsed by OpenELIS):

**Pareekshak QC Example:**
- DO_BLANK < 0.150 (substrate blank)
- DO_NEG < 0.250 (negative control)
- PC − NC > 0.6 (positive − negative delta)
- Mean_DO_POS_PC (positive control mean)

**OpenELIS Plugin QC Handling:**
1. Extract control OD values from Resultat sheet (NEG, BLANK, PC rows)
2. Compare against kit-specific thresholds
3. If any QC fails:
   - Log warning in analyzer result batch
   - Flag entire plate for technician review
   - Still import results (with QC-failed marker)
4. If all QC passes:
   - Mark batch as QC-approved
   - Results ready for validation queue

---

## 6. Deployment Configuration (Madagascar Site)

### 6.1 Magellan Software Setup

1. Connect Infinite F50 to PC via USB cable
2. Start Magellan — verify instrument is detected
3. Run plate measurement (plate layout configured in Magellan or external)
4. **Export raw OD data**:
   - Magellan → Export → Select Excel format or use Magellan's data export function
   - Export OD values to the **DO_palque sheet** of the lab's custom Excel template
   - Method: Manual copy/paste or Magellan export → Excel import (depending on workflow)

### 6.2 Lab Excel Template Workflow

1. Open lab's custom Excel template (for appropriate kit: Wantai or Pareekshak)
2. Enter plate metadata in Plan_plaque sheet (date, LOT, technician, plate number)
3. Enter sample IDs in Plan_plaque grid (controls + patient accession numbers)
4. Paste/import raw OD values from Magellan into DO_palque sheet
5. Excel formulas in Resultat sheet auto-calculate:
   - Negative control mean (NC)
   - Cutoff value (CO)
   - S/CO ratios
   - Qualitative results (0/1)
6. **Validation:**
   - If Resultat contains #VALUE! errors (due to "NoCalc" or reader failures):
     a. Correct OD values in DO_palque
     b. Recalculate or copy corrected formulas to Resultat_2
   - If all results valid: Proceed
7. Save Excel file to shared folder for OpenELIS pickup

### 6.3 OpenELIS Configuration

1. Deploy the `TecanInfiniteF50` plugin JAR to the OpenELIS `/plugin` directory
2. Restart OpenELIS (or the application server) to load the plugin
3. Configure the file input path (watched folder) to match the lab's Excel template save folder
4. Configure analyzer-specific settings:
   - **File type**: XLSX
   - **Target sheets**: Plan_plaque, DO_palque, Resultat (with fallback to Resultat_2)
5. Configure test name mappings:
   - Map kit names (from metadata) to OpenELIS test combinations (OD, S/CO, qualitative)
   - Example: Wantai → Tecan Wantai OD 450 + S/CO + Result
6. Configure QC validation thresholds (kit-specific):
   - Negative control OD range
   - Positive control OD minimum
   - Blank OD maximum
7. Assign appropriate user roles/permissions for the analyzer module

### 6.4 Network / Filesystem Requirements

| Requirement | Details |
|---|---|
| **Shared folder** | Lab Excel template folder must be readable by OpenELIS |
| **File permissions** | OpenELIS service account needs read access; optionally write to archive processed files |
| **Polling interval** | Configure file watcher polling (recommend 30–60 seconds) |
| **File archival** | Processed files should be moved to an archive folder, not deleted |
| **Network protocol** | SMB/CIFS for shared network folders if PC and OpenELIS server are separate |
| **File naming convention** | Lab should use consistent naming (e.g., WANTAI_2026-03-05_plate01.xlsx) for tracking |

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

> **Key clarification (Madagascar Site):**
> 1. Magellan captures raw OD values from the Infinite F50
> 2. Lab personnel export OD to custom Excel template
> 3. Excel template formulas auto-calculate cutoff, S/CO, and results
> 4. OpenELIS plugin parses the completed Excel template (not Magellan directly)
> 5. Both raw OD and calculated results are imported for validation and use

---

## 8. Questions & Validation Status (Madagascar Site)

### 8.1 Resolved by Validation

The following questions were answered by analyzing real export files from the Madagascar site:

1. ✅ **Integration method**: Uses **custom Excel template** (not native Magellan ASCII export)
   - Files analyzed: INFINITE F50 MAGELLAN.xlsx, ESN_HIV_PAREEKSHAK_1.xlsx, ESN_HIV_PAREEKSHAK_2.xlsx

2. ✅ **Data structure**: Multi-sheet XLSX with Plan_plaque + DO_palque + Resultat (+ optional Resultat_2)
   - Metadata in French (nom du réactif, Manipulateur, numéro de plaque)
   - Well-per-row results table with OD, S/CO, qualitative results

3. ✅ **Sample ID mapping**: Entered in Plan_plaque sheet (8×12 grid); replicated in Resultat sheet (well-per-row)
   - Wantai: CG-M4-00-001 through CG-M4-00-091
   - Pareekshak: FE-format (FE082031, etc.)
   - Controls identified by ID prefix: NEG, POS, BLANK, PC1–PC3

4. ✅ **Calculated results**: Excel template already provides S/CO ratios and qualitative results
   - Column B: Raw OD (from Magellan)
   - Column C: S/CO ratio (calculated by Excel formula)
   - Column D: Results (0 = Non-reactive, 1 = Reactive)

5. ✅ **ELISA kits**: Two confirmed for Madagascar site:
   - **Wantai** (likely HBsAg or HIV)
   - **Pareekshak HIV-1/2 ELISA Kit** (Bhat Bio-Tech India)

6. ✅ **Error handling**: Template supports Resultat_2 for corrected results when formulas fail
   - "NoCalc" string appears when Magellan reader fails
   - #VALUE! errors in Resultat → fall back to Resultat_2

7. ✅ **QC validation**: Excel templates include QC criteria columns for control thresholds
   - Pareekshak: DO_BLANK, DO_NEG, PC-NC delta, Mean_DO_POS_PC

### 8.2 Remaining Site-Specific Questions

These questions are deployment-specific and should be confirmed with each new site:

1. **Kit identification**: Which kits correspond to which template versions? Is there a single template per kit or a universal template adaptable to all kits?
   - *Required for test name mapping and control classification*

2. **Data transfer workflow**: How are Magellan OD values transferred to the Excel template?
   - Manual copy/paste?
   - Automated export → Excel import macro?
   - Network file transfer?
   - *Required for documentation of lab procedures*

3. **Accession number annotations**: What do annotations like "H+++" mean?
   - Highly positive? Repeat testing required? Manual flag?
   - *Required for result interpretation rules*

4. **Resultat_2 presence**: Is Resultat_2 always created, or only when Resultat has errors?
   - If optional: What is the lab's protocol for correction/validation?
   - *Required for parser fallback logic*

5. **Other ELISA kits**: Will other kits (HCV, Malaria Ag, etc.) be run on this Infinite F50?
   - What are their cutoff calculation formulas?
   - What are their control layouts?
   - *Required for future template support*

---

## 9. References

### 9.1 Tecan Hardware & Software
- [Tecan Infinite F50 Product Page](https://lifesciences.tecan.com/products/microplate_readers/infinite_f50)
- [Tecan Magellan Data Analysis Software](https://lifesciences.tecan.com/software-magellan)
- [Magellan Data Export Guide](https://www.tecan.com/knowledge-portal/how-to-export-data-in-magellan-pro-/sparkcontrol-magellan)
- [Magellan IFU Doc #30143531](https://www.tecan.com/hubfs/30143531_IFU_MAGELLAN_ENGLISH_V1_4.pdf)
- [Tecan Magellan Sample ID Import](https://www.tecan.com/knowledge-portal/how-to-import-sample-id-lists)

### 9.2 ELISA Kits (Madagascar Site)
- **Wantai Kit** (HBsAg/HIV) — validated with custom Excel template, file: INFINITE F50 MAGELLAN.xlsx
  - Control layout: NEG (A1–C1), POS (D1–E1)
  - Cutoff: 0.221566 (example)
  - Accession format: CG-M4-00-001 through CG-M4-00-091

- **Pareekshak HIV-1/2 ELISA Kit** (Bhat Bio-Tech India) — validated with custom Excel template, files: ESN_HIV_PAREEKSHAK_1.xlsx, ESN_HIV_PAREEKSHAK_2.xlsx
  - Control layout: BLANK (A1), NEG1 (B1), NEG2 (C1), PC1–PC3 (D1–F1)
  - Cutoff: 0.47795, 0.45031 (examples)
  - Accession format: FE-format (FE082031, etc.)
  - QC criteria: DO_BLANK < 0.150, DO_NEG < 0.250, PC−NC > 0.6

### 9.3 OpenELIS Integration
- [elisar R Package — Tecan ELISA File Parser](https://github.com/koncina/elisar)
- [OpenELIS Global Analyzer Plugin Wiki](https://github.com/openelisglobal/openelisglobal-core/wiki/Analyzer-plugins)
- [OpenELIS Global Analyzer Plugins Repository](https://github.com/DIGI-UW/openelisglobal-plugins)
- [OpenELIS Analyzer Bridge](https://github.com/DIGI-UW/openelis-analyzer-bridge)

### 9.4 Validation Files (Madagascar Site — 2026-03-06)

**Analyzed files:**
1. `INFINITE F50 MAGELLAN.xlsx` — Wantai kit, 3 sheets (Plan_plaque, DO_palque, Resultat), 91 patient samples + 5 controls
2. `ESN_HIV_PAREEKSHAK_1.xlsx` — Pareekshak HIV-1/2, 4 sheets (includes Resultat_2), formula errors present
3. `ESN_HIV_PAREEKSHAK_2.xlsx` — Pareekshak HIV-1/2, 4 sheets (includes Resultat_2), mixed reactive/non-reactive results

**Data validation findings:**
- Multi-sheet XLSX structure confirmed (Plan_plaque + DO_palque + Resultat ± Resultat_2)
- Well-per-row results table with columns: Sample ID, DO_sample, DO/Cut-off, Results, QC metadata
- Control identification by sample ID prefix (NEG, POS, BLANK, PC*, NC*)
- S/CO ratios and qualitative results pre-calculated by Excel formulas
- Error handling: #VALUE! and "NoCalc" with fallback to Resultat_2
- Accession number formats: CG-M4-00-xxx (Wantai), FE-format (Pareekshak), with optional annotations (e.g., H+++)
