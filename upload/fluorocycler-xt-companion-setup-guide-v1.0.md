# Bruker FluoroCycler XT — Analyzer Setup Guide

**OpenELIS Global | Analyzer Setup | Madagascar Deployment**

| Field | Value |
|---|---|
| Version | v1.0 |
| Date | 2026-03-06 |
| Confidence | MEDIUM-HIGH |
| Audience | Lab IT, Lab Manager, OpenELIS Administrator |

> **Confidence rationale:** UI navigation paths are based on the OpenELIS analyzer management design spec, not a live production instance. Instrument-side steps are inferred from the FluoroSoftware XT-IVD product documentation. Menu paths should be verified during site deployment.

---

## 1. Prerequisites

| Requirement | Details |
|---|---|
| OpenELIS version | 3.2+ (with flat-file plugin support) |
| Instrument | Bruker FluoroCycler XT with FluoroSoftware XT-IVD |
| Networked PC | Separate PC with Excel or LibreOffice, connected to OpenELIS server network share |
| Watch folder | `/opt/openelis/analyzer-import/fluorocycler-xt/` accessible from the networked PC |
| Excel template | `FC-XT_Template.xlsx` distributed to the lab (see Section 3) |
| User role | OpenELIS Administrator (for initial setup); Lab Technician (for daily workflow) |

---

## 2. Instrument-Side Configuration

The FluoroCycler XT has **no LIS connectivity settings** to configure. There is no network interface, no ASTM/HL7 setup, and no export function to enable.

The only instrument-side preparation is:

1. **Ensure FluoroSoftware XT-IVD displays final results.** After a PCR run completes, verify that the Results tab shows:
   - Well positions with associated sample names (if entered during plate setup)
   - CP (Crossing Point) values for each target
   - Qualitative interpretation (Positive / Negative / Invalid) for FluoroType assays
   - For LightMix assays: CP values and calculated concentrations (if applicable)

2. **Confirm the assay kits in use.** The OpenELIS test code mappings must match the assays loaded on the instrument. Document which FluoroType and LightMix kits are currently in use at the site.

3. **Set up the networked PC.** Ensure a Windows or Linux PC with spreadsheet software is accessible from the FluoroCycler XT workstation (may be the same room) and has write access to the OpenELIS watch folder via network share (SMB/CIFS or NFS).

---

## 3. Excel Template Distribution

### 3.1 Template File

The standardized template (`FC-XT_Template.xlsx`) must be pre-loaded on the networked PC. It contains:

- **Sheet 1: `Results`** — the import sheet with column headers in Row 1
- **Sheet 2: `Instructions`** — French-language instructions for lab staff
- **Sheet 3: `AssayList`** — dropdown source data for the `AssayName` column (Data Validation)

### 3.2 Required Column Headers (Sheet: Results)

| Column | Header | Format |
|---|---|---|
| A | `SampleID` | Text |
| B | `WellPosition` | Text (e.g., A1–H12) |
| C | `AssayName` | Text (from dropdown) |
| D | `TargetName` | Text |
| E | `TargetNo` | Number |
| F | `CP` | Number (use `.` as decimal; `-1.00` = negative) |
| G | `Interpretation` | Text: DETECTED / NOT DETECTED / INVALID / INDETERMINATE |
| H | `CalcConc` | Number (blank for qualitative assays) |
| I | `CalcConcUnit` | Text (IU/mL, copies/mL, or blank) |
| J | `RunDate` | Date: YYYY-MM-DD |
| K | `RunID` | Text |
| L | `Notes` | Text |

### 3.3 Lab Staff Workflow (Daily)

1. Complete the PCR run on the FluoroCycler XT
2. Open the Results screen in FluoroSoftware XT-IVD
3. Open a fresh copy of the template on the networked PC
4. For each sample well:
   a. Enter the `SampleID` from the paper/digital plate map
   b. Enter the `WellPosition` (e.g., A1)
   c. Select the `AssayName` from the dropdown
   d. Enter one row per target: `TargetName`, `CP`, `Interpretation`
   e. For viral load assays: enter `CalcConc` and `CalcConcUnit`
5. Enter `RunDate` and `RunID` for all rows
6. Save as: `FC-XT_YYYYMMDD_HHMMSS.xlsx`
7. Copy/move the file to the OpenELIS watch folder

---

## 4. OpenELIS Configuration — Step by Step

> **Note:** This integration uses the **existing flat-file upload UI** already built into OpenELIS Global. No custom screens or new UI components are required. All configuration below is done through the standard Analyzer Management interface.

### Step 1: Add the Analyzer

Navigate to: **Admin → Analyzer Management → Analyzers List**

Click **"Add Analyzer"** and complete:

| Field | Value |
|---|---|
| Name | `FluoroCycler XT #1` |
| Plugin | `Flat File` |
| Profile | `Bruker FluoroCycler XT — Molecular PCR v1.0` |
| Lab Unit | `Molecular Biology` |
| Status | `Setup` |

### Step 2: Configure File Import Settings

Under the **Communication** tab (which becomes **File Import** for flat-file plugins):

| Setting | Value |
|---|---|
| Watch Folder Path | `/opt/openelis/analyzer-import/fluorocycler-xt/` |
| File Name Pattern | `FC-XT_*.xlsx` |
| Column Delimiter | *(N/A — Excel uses native cell structure)* |
| File Encoding | `UTF-8` |
| First Row is Header | `Yes` |
| Poll Interval | `60 seconds` |
| Archive Folder Path | `/opt/openelis/analyzer-archive/fluorocycler-xt/` |

Click **"Validate Path"** to confirm the watch folder is accessible.

### Step 3: Assign Profile and Verify Field Mappings

Navigate to: **Field Mappings** tab

The assigned profile pre-loads the column-to-field mappings from the spec. Verify:

| Template Column | Mapped To | Status |
|---|---|---|
| `SampleID` | `sample_id` | ✅ Auto-mapped |
| `AssayName` + `TargetName` | `test_code` (composite) | ✅ Auto-mapped |
| `CP` | `result_value_secondary` | ✅ Auto-mapped |
| `Interpretation` | `result_value` (dictionary) | ✅ Auto-mapped |
| `CalcConc` | `result_value` (numeric, when populated) | ✅ Auto-mapped |
| `CalcConcUnit` | `result_units` | ✅ Auto-mapped |
| `RunDate` | `result_datetime` | ✅ Auto-mapped |

### Step 4: Configure Test Code Mappings

Navigate to: **Test Codes** tab

Map each composite analyzer test code to an OpenELIS test:

| Analyzer Code | OpenELIS Test | Result Type |
|---|---|---|
| `FTYPE_MTB_MTB` | M. tuberculosis Detection | Dictionary |
| `FTYPE_MTB_IC` | *(IC — internal, non-reportable)* | Dictionary |
| `FTYPE_MTBDR_MTB` | MTB Detection (MTBDR panel) | Dictionary |
| `FTYPE_MTBDR_RPOB_WT` | rpoB Wild-Type | Dictionary |
| `FTYPE_MTBDR_RPOB_MUT` | rpoB Mutation (RIF resistance) | Dictionary |
| `FTYPE_HIV1VL_HIV1` | HIV-1 Viral Load | Numeric |
| `FTYPE_HIV1VL_IC` | *(IC — internal, non-reportable)* | Dictionary |
| `LMIX_MPOX_MPOX` | Monkeypox Virus Detection | Dictionary |
| … | *(complete for all deployed assays)* | … |

### Step 5: Configure QC Rules

Navigate to: **QC Config** tab

Add the following rules (OR logic — any match = QC):

| Rule | Field | Pattern |
|---|---|---|
| Specimen ID Prefix | `SampleID` | `QC-` |
| Specimen ID Prefix | `SampleID` | `CTRL-` |
| Specimen ID Prefix | `SampleID` | `NC-` |
| Specimen ID Prefix | `SampleID` | `PC-` |
| Catch-all Regex | `SampleID` | `^(QC\|CTRL\|NC\|PC\|CAL).*` |

Also configure:
- **IC Target Handling:** Mark `TargetName = IC` rows as non-reportable QC metadata
- **IC Failure Alert:** If IC result = `NOT DETECTED`, flag all targets for the same `SampleID` in the same file

### Step 6: Activate and Test

1. Change analyzer status from `Setup` to `Active`
2. Place a test file (`FC-XT_TEST_20260306.xlsx`) in the watch folder
3. Navigate to: **Analyzer Management → FluoroCycler XT #1 → Preview**
4. Verify:
   - File detected and parsed
   - All rows appear with correct SampleID, test code, and result
   - QC samples (NC-, PC-, QC-) classified correctly
   - Patient samples classified as Patient
   - Interpretation values mapped correctly (DETECTED → Positive, etc.)
5. Accept results to push into OpenELIS workflow

---

## 5. Verifying a Live Result

After the first real PCR run import:

1. Go to **Analyzer Management → FluoroCycler XT #1 → Preview**
2. Confirm the most recent file is displayed with parse status "Success"
3. Check each sample row:
   - Accession number matches the lab plate map
   - All expected targets are present (e.g., MTBDR should have MTB + rpoB-WT + rpoB-MUT + katG-WT + katG-MUT + inhA-WT + inhA-MUT + IC = 8 rows per sample)
   - Interpretation values are correct
   - QC samples are flagged appropriately
4. Accept results to finalize import

---

## 6. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| File not detected | Wrong folder path, file name doesn't match pattern, or permissions | Verify watch folder path; check file is named `FC-XT_*.xlsx`; check file system permissions |
| Parse error: "Invalid header" | Column headers don't match expected names | Ensure Row 1 has exact headers: `SampleID`, `WellPosition`, `AssayName`, etc. |
| SampleID not found in OpenELIS | Accession number doesn't exist or has a typo | Verify the accession number was entered correctly in the template |
| Test code unmapped | New assay or target not yet configured | Add the new test code mapping in the Test Codes tab |
| All samples marked as QC | QC regex rule is too broad | Review regex pattern; ensure patient IDs don't start with QC/CTRL/NC/PC |
| Numeric parse error on CP | Decimal separator is `,` instead of `.` | Lab PC locale issue — ensure Excel is saving with `.` decimal separator |
| Duplicate import | Same file processed twice | Check if archive move failed; verify archive folder permissions |
| Missing targets | Not all target rows entered by staff | Compare expected target count per assay against rows in file; retrain staff |
| IC failure not flagged | IC handling rule not configured | Add IC target handling rule in QC Config |

---

## 7. Daily Checklist for Lab Staff

- [ ] Complete PCR run on FluoroCycler XT
- [ ] Open fresh copy of `FC-XT_Template.xlsx`
- [ ] Enter all sample results from FluoroSoftware XT-IVD
- [ ] Verify: every sample has all expected target rows
- [ ] Verify: QC samples use correct prefix (NC-, PC-, QC-)
- [ ] Verify: decimal separator is `.` (not `,`)
- [ ] Verify: RunDate is in `YYYY-MM-DD` format
- [ ] Save as `FC-XT_YYYYMMDD_HHMMSS.xlsx`
- [ ] Move file to watch folder
- [ ] Check OpenELIS Preview tab — confirm all results parsed correctly
- [ ] Accept results in OpenELIS
