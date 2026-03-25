# QuantStudio 5 / 7 Flex — Field Mapping & Integration Spec
**Version:** 1.3.1  
**Date:** 2026-03-06  
**Confidence:** 🟢 VALIDATED — validated against 3 real XLS exports from Madagascar  
**Jira:** [OGC-348](https://uwdigi.atlassian.net/browse/OGC-348)  
**Pattern:** C — Flat File Export/Import  
**Infrastructure:** Analyzer File Upload Screen (OGC-324)  
**Epic:** OGC-304 (Madagascar Analyzers)

---

## 1. Instrument Overview

| Field | Value |
|---|---|
| **Instrument** | Thermo Fisher QuantStudio 5 (QS5) and QuantStudio 7 Flex (QS7 Flex) |
| **Manufacturer** | Thermo Fisher Scientific |
| **Domain** | Molecular / PCR — HIV Viral Load (Quantitative) |
| **Assay in use (Madagascar)** | HIV-1 Viral Load (VIH-1, French locale) |
| **Chemistry** | TaqMan (FAM reporter for VIH-1 target; CY5 for Internal Control) |
| **Export software** | QuantStudio Design & Analysis (QS D&A) Software |
| **Export format** | XLS (BIFF8 / Legacy Excel) — **NOT CSV** |
| **Integration type** | Manual file upload via OGC-324 Analyzer File Upload Screen |

---

## 2. Architecture Classification

**Pattern C — Flat File Export/Import**

The QuantStudio instruments do not support direct LIS connection (ASTM or HL7). Results are exported from the QuantStudio Design & Analysis (QS D&A) software as XLS files. Lab staff upload these files to OpenELIS via the Analyzer File Upload Screen (OGC-324).

```
[QuantStudio 5 or 7 Flex]
    │
    ▼ PCR run completes
[QS D&A Software]
    │
    ▼ Export Results → Results.xls (BIFF8 format)
[Lab PC / shared folder]
    │
    ▼ Manual upload
[OGC-324 Analyzer File Upload Screen]
    │
    ▼ Parser: XLS → "Results" sheet → data rows
[OpenELIS Result Import Pipeline]
```

---

## 3. File Format

| Property | Value |
|---|---|
| **Format** | Microsoft Excel XLS (BIFF8 / Compound Document File Format v2) |
| **Parser required** | `xlrd` (Python) or Apache POI (Java) — standard CSV readers will fail |
| **Target sheet** | `"Results"` — open by name, not by index |
| **Other sheets present** | `Sample Setup`, `Amplification Data` (ignore these) |
| **File encoding** | UTF-8 compatible via xlrd |
| **Typical filename pattern** | `CVVIH__<date>QS7.xls`, `QS5_CVVIH_<date>.xls` |

### 3.1 File Identification

A file is identified as a QuantStudio XLS export when ALL of the following are true:

1. Extension is `.xls` (not `.xlsx`)
2. File magic bytes: `D0 CF 11 E0 A1 B1 1A E1` (CDFV2 header)
3. Sheet named `"Results"` exists
4. Metadata row 0 contains key `"Block Type"`

---

## 4. Results Sheet Structure

### 4.1 Metadata Block (rows 0–N)

The file begins with a metadata key-value block above the column headers. **Row count varies by instrument/software version:**

| Variant | Metadata Rows | Blank Row | Column Header Row | Data Starts |
|---|---|---|---|---|
| QS7 Jun 2024 / QS5 Dec 2024 | 46–50 | next | next | next+1 |
| QS7 Mar 2024 (reduced) | 16 | 1 blank | row 16 (0-indexed) | row 17 |

**Parser approach:** Scan from row 0 downward until a row is found where the first cell matches `"Well"` — this is the column header row. Do not assume a fixed row number.

### 4.2 Metadata Fields

Key metadata extracted from the header block:

| Key | Example Value | Use |
|---|---|---|
| `Experiment Run End Time` | `"2024-06-05 14:23:00"` or `"Not Started"` | Pre-run detection (see §10) |
| `Instrument Type` | `QuantStudio(TM) 7 Flex System` | Instrument identification |
| `Block Type` | `96fast` | Plate format confirmation |
| `Experiment Name` | `CVVIH_05062024` | Run name |
| `User Name` | `admin` | Operator tracking |
| `Date Created` | `2024-06-05` | Run date |

### 4.3 Column Layout

Column count varies by instrument and software version. **Parser must use name-based column lookup**, not positional index.

#### Core Columns (always present)

| Column Name | Description | Parser Notes |
|---|---|---|
| `Well` | Numeric well index (1–96) | Integer |
| `Well Position` | Alphanumeric well ID (A1, B3, H12) | String |
| `Omit` | Skip flag: `1` = omit this row | Boolean — skip row if value = `1` |
| `Sample Name` | Patient accession number or control ID | See §7 for QC classification |
| `Target Name` | Assay target: `VIH-1` or `IC` | Determines if row is result vs IC |
| `Task` | Sample classification: `UNKNOWN`, `STANDARD`, `NTC` | Primary QC classifier (see §7) |
| `Reporter` | Fluorescent dye: `FAM` (VIH-1) or `CY5` (IC) | Used for target/IC pairing |
| `Quencher` | `NFQ-MGB` (VIH-1) or `None` (IC) | — |
| `CT` | Cycle threshold (primary PCR result) | Float or `"Undetermined"` |
| `Ct Mean` | Mean CT across duplicate wells | Float |
| `Ct SD` | CT standard deviation | Float |
| `Quantity` | Calculated copies/mL (individual well) | Float or empty |
| `Quantity Mean` | Mean copies/mL across duplicates | **Use this for patient result** |
| `Quantity SD` | SD of Quantity across duplicates | Float |
| `Automatic Ct Threshold` | Whether threshold was auto-calculated | Boolean string |
| `Ct Threshold` | CT threshold value (default 0.2) | Float |
| `Automatic Baseline` | Whether baseline was auto-set | Boolean string |
| `Baseline Start` | Baseline start cycle (default 1.0) | Float |
| `Baseline End` | Baseline end cycle (default 50.0) | Float |
| `Comments` | Free-text comments field | String, may be empty |

#### Conditionally Present Columns (may be absent — flag columns)

These columns appear in the full-format variant (QS5 Dec 2024, QS7 Jun 2024) but are **absent** in the reduced variant (QS7 Mar 2024):

| Column Name | Description | When absent |
|---|---|---|
| `NOAMP` | No amplification flag | Rely on CT value for result |
| `EXPFAIL` | Exponential phase failure | Rely on CT value for result |
| `THOLDFAIL` | Threshold failure | Rely on CT value for result |
| `HIGHSD` | High standard deviation flag | Rely on CT value for result |
| `PRFLOW` | Poor ROX flow flag | Ignore |
| `CQCONF` | Cq confidence score | Ignore if absent |
| `Amp Score` | Amplification quality score | Present in QS7; absent in some QS5 |

**Rule:** Check for column presence at parse time using `name in df.columns`. Never assume flag columns exist.

#### Per-File Column Matrix (validated)

| Column | QS7 Jun 2024 (31 cols) | QS5 Dec 2024 (31 cols) | QS7 Mar 2024 (26 cols) |
|---|---|---|---|
| Core columns (20) | ✅ | ✅ | ✅ |
| Amp Score | ✅ | ❌ | ❌ |
| NOAMP | ✅ | ✅ | ❌ |
| EXPFAIL | ✅ | ✅ | ❌ |
| THOLDFAIL | ✅ | ✅ | ❌ |
| HIGHSD | ✅ | ✅ | ❌ |
| PRFLOW | ✅ | ❌ | ❌ |
| CQCONF | ✅ | ✅ | ❌ |
| Y-Intercept | ✅ | ✅ | — |
| R² | ✅ | ✅ | — |
| Slope | ✅ | ✅ | — |
| Efficiency | ✅ | ✅ | — |

---

## 5. Data Row Structure

### 5.1 Two Rows Per Well

Each well produces **two rows** in the Results sheet: one for the target (VIH-1 / FAM) and one for the Internal Control (IC / CY5).

```
Well A1, Target Name = "VIH-1", Reporter = "FAM"  → patient result row
Well A1, Target Name = "IC",    Reporter = "CY5"   → internal control row
```

**Parser action:** Separate rows by `Target Name`. Process VIH-1 rows for patient results; process IC rows for IC validation.

### 5.2 Duplicate Wells

Standard curve points and occasionally patient samples may be plated in duplicate (e.g., `STD1_E7` in wells A1 and A2).

- For **duplicates**, use `Quantity Mean` — it is pre-averaged by the instrument software
- Individual well `Quantity` values are raw; use `Quantity Mean` for the imported result

### 5.3 Row Filtering

Before processing, discard rows where:
- `Omit` column value = `1`
- `Well Position` is blank or null

---

## 6. Patient / Specimen ID Extraction

| Property | Specification |
|---|---|
| **Column** | `Sample Name` |
| **Pattern** | `^[A-Z]{2}\d+$` |
| **Examples** | `LL0706001`, `LL0619001`, `LM2024001`, `LM0000001` |
| **Prefix meaning** | Site-specific — `LL` = one Madagascar lab site; `LM` = another; do not hardcode |
| **Non-patient rows** | `PC`, `NC`, `NTC`, `STD1_E7`, `STD2_E6`, etc. — filtered by Task column (see §7) |

The `patient_pattern` should be configurable per-site or use the broadened default `^[A-Z]{2}\d+$`. Do not restrict to `LM` prefix only.

---

## 7. QC Sample Handling

### 7.1 Task Column as Primary Classifier

The `Task` column is the authoritative classifier for all rows:

| Task Value | Classification | Parser Action |
|---|---|---|
| `STANDARD` | Standard curve calibrator | Route to standard curve QC; do not import as patient result |
| `NTC` | No-Template Control | Route to QC; do not import as patient result |
| `UNKNOWN` | Patient sample **or** Positive Control | Apply secondary filter (see §7.2) |

### 7.2 Positive Control (PC) Identification

**Critical:** PC wells use `Task = UNKNOWN` — they cannot be distinguished from patient samples by Task alone.

**Rule:** A row is classified as a **Positive Control** when:
- `Task = UNKNOWN`  
  **AND**  
- `Sample Name` matches (case-insensitive): `"PC"`, `"pos"`, `"positive"`, `"controle positif"`, or a site-configurable pattern

**Implementation:**
```python
def classify_row(row):
    task = str(row['Task']).strip().upper()
    sample_name = str(row['Sample Name']).strip()
    
    if task == 'STANDARD':
        return 'STANDARD'
    elif task == 'NTC':
        return 'NTC'
    elif task == 'UNKNOWN':
        if is_positive_control(sample_name):  # configurable pattern list
            return 'POSITIVE_CONTROL'
        elif is_patient_id(sample_name):       # ^[A-Z]{2}\d+$
            return 'PATIENT'
        else:
            return 'UNKNOWN_OTHER'
    return 'UNKNOWN_OTHER'
```

**Evidence:** Well A11, Sample Name = `"PC"`, Task = `"UNKNOWN"`, Target = VIH-1. Both the VIH-1 row and the IC row for this well have Task = `UNKNOWN`.

### 7.3 NTC Sample Name Is Not Standardized

**Rule:** Use `Task = NTC` as the authoritative NTC classifier. Do **not** filter on `Sample Name = "NTC"`.

Within a single plate (QS7 Mar 2024), both were observed:
- Well A12: `Sample Name = "NC"`, `Task = NTC`
- Well C11: `Sample Name = "NTC"`, `Task = NTC`

Test fixtures and documentation must include `"NC"` as a valid NTC sample name variant.

### 7.4 Standard Curve Naming and Values

Standard curve points follow the naming pattern `STD1_E7`, `STD2_E6`, etc., where the exponent suffix encodes approximate concentration:

| Sample Name | Approximate Copies/mL |
|---|---|
| `STD1_E7` | 5 × 10⁶ (5,000,000) |
| `STD2_E6` | 5 × 10⁵ (500,000) |
| `STD3_E5` | 5 × 10⁴ (50,000) |
| `STD4_E4` | 5 × 10³ (5,000) |
| `STD5_E3` | 5 × 10² (500) |

**Rule:** Use the `Quantity` column value for calibrator concentration — do not parse the name. Standard points are plated in duplicate; use `Quantity Mean` for QC reporting.

---

## 8. Internal Control (IC) Handling

| Property | Value |
|---|---|
| **Target Name** | `IC` |
| **Reporter** | `CY5` |
| **Per well** | One IC row per well (paired with one VIH-1 row) |
| **IC validation mode** | `negatives_only` — validate IC for wells where VIH-1 `CT = "Undetermined"` (negative result) |
| **IC pass criteria** | IC row has a valid CT value (numeric, not `"Undetermined"`) |
| **IC fail action** | Flag result as invalid; do not import; flag for lab review |

**Rationale for `negatives_only`:** For positive (detectable) samples, the HIV-1 amplification dominates and the IC may appear to fail due to competition — this is expected behaviour, not an error. Only validate IC on samples where no target amplification was detected.

---

## 9. Result Value Extraction

### 9.1 Primary Result Fields

| OpenELIS Field | Source Column | Notes |
|---|---|---|
| `patient_id` | `Sample Name` | Validated by `^[A-Z]{2}\d+$` pattern |
| `result_value` | `Quantity Mean` | Copies/mL; use mean for duplicates |
| `result_raw` | `Quantity` | Individual well raw value |
| `ct_value` | `CT` | Float or `"Undetermined"` |
| `ct_mean` | `Ct Mean` | Mean CT across duplicates |
| `result_flag` | Derived (see §9.2) | |
| `run_date` | `Date Created` (from metadata) | ISO date string |

### 9.2 Result Interpretation Logic

```python
def interpret_result(row, flag_cols_present):
    ct = row['CT']
    qty_mean = row['Quantity Mean']
    
    # Undetermined = negative (below LOD)
    if str(ct).strip() == 'Undetermined':
        return {'result': 'UNDETECTED', 'value': None, 'flag': None}
    
    # If flag columns present, check them
    if flag_cols_present:
        if row.get('NOAMP') == 'Y' or row.get('EXPFAIL') == 'Y':
            return {'result': 'INVALID', 'value': None, 'flag': 'AMPLIFICATION_FAILURE'}
        if row.get('THOLDFAIL') == 'Y':
            return {'result': 'INVALID', 'value': None, 'flag': 'THRESHOLD_FAILURE'}
        if row.get('HIGHSD') == 'Y':
            return {'result': 'REVIEW', 'value': qty_mean, 'flag': 'HIGH_SD'}
    
    # Valid result
    if qty_mean is not None and qty_mean > 0:
        return {'result': 'DETECTED', 'value': qty_mean, 'flag': None}
    
    return {'result': 'REVIEW', 'value': qty_mean, 'flag': 'NO_QUANTITY'}
```

---

## 10. Pre-Run Detection

**Problem:** QS D&A can export a file before a run completes (template or pre-configured plate). These files contain the plate layout but no PCR data — CT and Quantity columns are empty.

**Detection:** Check metadata field `Experiment Run End Time`:
- Value = `"Not Started"` → file is a pre-run export
- Numeric date/time string → run is complete

**Parser action on `"Not Started"`:**
1. Reject the file
2. Return a user-facing error: *"This file appears to be a pre-run template or incomplete export. Please export results after the PCR run has completed."*

**Evidence:** QS7 Mar 2024 file (`CV VIH 05 03 2024 serie 01.xls`) had `Experiment Run End Time = "Not Started"` with all CT and Quantity cells empty.

---

## 11. Parser Configuration

### 11.1 Parser Class

Suggested implementation class: `QuantStudio5_7AnalyzerImplementation`

Inherits from: `AnalyzerImplementation` (OGC-324 base class)

### 11.2 Plugin Configuration Fields

| Config Key | Type | Default | Description |
|---|---|---|---|
| `target_name` | string | `"VIH-1"` | Target Name value for patient result rows |
| `ic_target_name` | string | `"IC"` | Target Name value for internal control rows |
| `patient_id_pattern` | regex | `^[A-Z]{2}\d+$` | Pattern for valid patient IDs in Sample Name |
| `positive_control_names` | list | `["PC", "pos", "positive"]` | Sample Name values that identify PC wells |
| `ic_validation_mode` | enum | `negatives_only` | `all` or `negatives_only` |
| `result_column` | string | `"Quantity Mean"` | Column to use for result value |
| `reject_prerun` | boolean | `true` | Reject files with `Experiment Run End Time = "Not Started"` |

### 11.3 File Type Detection (for OGC-324 plugin registry)

```python
def can_handle(file_path):
    # Check BIFF8 magic bytes
    with open(file_path, 'rb') as f:
        magic = f.read(8)
    if magic != b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1':
        return False
    
    # Check for "Results" sheet and QuantStudio metadata
    try:
        wb = xlrd.open_workbook(file_path)
        if 'Results' not in wb.sheet_names():
            return False
        sheet = wb.sheet_by_name('Results')
        # Check first cell of row 0 for known QS metadata keys
        first_cell = str(sheet.cell_value(0, 0)).strip()
        return first_cell in ('Block Type', 'Experiment Name', 'Date Created')
    except:
        return False
```

---

## 12. OpenELIS Field Mapping

| OE Field | Source | Transform |
|---|---|---|
| `analyzerSampleId` | `Sample Name` | Direct |
| `accessionNumber` | `Sample Name` | Validated by patient_id_pattern |
| `analyzerTestId` | `Target Name` | Map `"VIH-1"` → configured HIV VL test code |
| `result` | `Quantity Mean` | Float; `"Undetermined"` → negative result |
| `resultStatus` | Derived | See §9.2 |
| `units` | Configured | `copies/mL` (standard unit) |
| `completedDate` | `Date Created` (metadata) | ISO date |
| `analyzerName` | File metadata `Instrument Type` | Parsed from metadata |
| `serialNumber` | `Instrument Serial Number` (metadata) | If present |

---

## 13. Error Handling

| Condition | Parser Response |
|---|---|
| File is `.xlsx` (not `.xls`) | Reject with message: "QuantStudio exports must be in legacy XLS format (.xls). Please re-export from QS D&A." |
| No sheet named `"Results"` | Reject with message: "No Results sheet found. Please confirm this is a QuantStudio export." |
| `Experiment Run End Time = "Not Started"` | Reject with message: "Pre-run file detected — export after run completes." |
| `Omit = 1` for a row | Skip row silently; log to parsing report |
| `Sample Name` does not match patient pattern AND is not a known QC type | Log as `UNKNOWN_OTHER`; do not import; include in parsing report |
| IC failure for a negative sample | Flag result as `INVALID_IC`; queue for lab review |
| All flag columns absent | Proceed using CT value only for result interpretation (no flag-based rejection) |
| Duplicate well rows for same `Sample Name` + `Target Name` | Use `Quantity Mean`; log duplicate pair in parsing report |

---

## 14. Test Data Inventory

| File | Instrument | Date | Patients | Columns | Notes |
|---|---|---|---|---|---|
| `CVVIH__05062024QS7.xls` | QS7 Flex (S/N 278872828) | Jun 2024 | 78 | 31 | Full column set; LM prefix |
| `QS5_CVVIH_27-12-2024_SERIE_01.xls` | QS5 (S/N 272529515) | Dec 2024 | 80 | 31 | Full column set; LM prefix; no Amp Score |
| `CV_VIH_05_03_2024_serie_01.xls` | QS7 Flex | Mar 2024 | 30 | 26 | Reduced columns (no flags); LL prefix; pre-run export |

### 14.1 File Collection Checklist — Still Needed

- [ ] QS D&A CSV/TSV export — same assay, to confirm text export format if CSV export becomes available
- [ ] QS D&A export — qualitative/presence-absence run (e.g., TB detection on QuantStudio)
- [ ] QS D&A export — multi-target panel run
- [ ] QS D&A export — failed/invalid run (IC failures, NTC contamination)
- [ ] Export settings screenshot (column selections, delimiter, format options)
- [ ] Completed run with `Experiment Run End Time` populated (the Mar 2024 file was pre-run)

---

## 15. Validation Status

| Validation Checkpoint | Status |
|---|---|
| File format confirmed (XLS BIFF8, not CSV) | ✅ Validated — all 3 files |
| Multi-sheet structure confirmed | ✅ Validated — all 3 files |
| Column layout — full 31-col variant | ✅ Validated — QS7 Jun 2024, QS5 Dec 2024 |
| Column layout — reduced 26-col variant | ✅ Validated — QS7 Mar 2024 |
| Two rows per well (Target + IC) | ✅ Validated — all 3 files |
| Patient ID pattern `^[A-Z]{2}\d+$` | ✅ Validated — LM prefix (2 files), LL prefix (1 file) |
| QC: Task=STANDARD for calibrators | ✅ Validated |
| QC: Task=NTC for no-template controls | ✅ Validated |
| QC: PC uses Task=UNKNOWN + Sample Name="PC" | ✅ Validated — QS7 Mar 2024 |
| QC: NTC Sample Name varies (NC / NTC) | ✅ Validated — QS7 Mar 2024 |
| Duplicate wells: Quantity Mean usage | ✅ Validated — STD1_E7 in A1 and A2 |
| IC pairing via Target Name + Reporter | ✅ Validated |
| Pre-run detection via `Experiment Run End Time` | ✅ Validated — QS7 Mar 2024 shows "Not Started" |
| Standard curve 5-point with copies/mL values | ✅ Validated |

---

## 16. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-01 | Initial spec — based on protocol docs and synthetic data |
| 1.1 | 2026-02 | Updated for XLS format (not CSV); multi-sheet structure; header offset |
| 1.2 | 2026-02 | Validated against QS7 Jun 2024 (78 patients) and QS5 Dec 2024 (80 patients) |
| 1.3 | 2026-03 | Third variant: 26 col / 16 metadata rows / LL prefix / "Not Started" pre-run |
| 1.3.1 | 2026-03-06 | QC rules: PC via Task=UNKNOWN + Sample Name="PC"; NTC via Task=NTC (not Sample Name) |
