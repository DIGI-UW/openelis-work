# Bruker FluoroCycler XT — Molecular PCR Flat File Import Spec

**OpenELIS Global | Analyzer Integration | Madagascar Deployment**

| Field | Value |
|---|---|
| Version | v1.0 |
| Date | 2026-03-06 |
| Protocol | Excel Flat File (manual copy-paste workflow) |
| Plugin | flat-file |
| Jira | TBD |
| Author | Casey / Claude |
| Confidence | MEDIUM-HIGH |

> **Confidence rationale:** Spec built from actual lab-exported Excel files and Bruker product documentation. FluoroSoftware XT-IVD result sheet structure confirmed from real data. Menu paths for instrument-side configuration are not verified on a live unit. No vendor LIS interface manual exists — this instrument has no standard LIS connectivity.

---

## 1. Overview

### 1.1 Instrument

The **Bruker FluoroCycler XT** (originally Hain Lifescience, now Bruker Molecular Diagnostics) is a high-performance real-time PCR thermocycler supporting up to 96 samples. It runs FluoroType® IVD assays (TB, HIV, HBV, STI, respiratory, etc.) and third-party LightMix® Modular assays via the **FluoroSoftware XT-IVD** companion application.

### 1.2 Deployment Context

- **Site:** Madagascar (French locale)
- **Lab unit:** Molecular Biology / PCR
- **Assay mix:** FluoroType® assays (e.g., MTBDR, MTB, SARS-CoV-2/Flu/RSV, HIV-1 Viral Load, HBV Viral Load) and LightMix® Modular assays (e.g., Monkeypox/MPox)
- **Manufacturer:** Bruker (Hain Lifescience GmbH)

### 1.3 Integration Path

The FluoroCycler XT has **no standard LIS connectivity** — no ASTM, no HL7, no CSV/flat-file export. The FluoroSoftware XT-IVD application does not support export to Excel, CSV, or any interoperable format. Microsoft Office is **not installed** on the instrument PC.

**Workaround adopted by the lab:** Staff manually copy-paste final results from FluoroSoftware XT-IVD into a **standardized Excel workbook** on a networked PC. OpenELIS imports these workbooks via the flat-file plugin's watch-folder mechanism.

This spec defines:
1. The **standardized Excel template** structure that the lab must use
2. The **column mapping** from that template to OpenELIS fields
3. QC identification and result interpretation rules

> **UI Note:** This integration does **not** require a custom UI or new screens. It uses the **existing flat-file upload interface** already built into OpenELIS Global. The analyzer is configured through the standard Analyzer Management screens (Add Analyzer → select Flat File plugin → configure watch folder, column mappings, test codes, and QC rules). No new UI components are needed.

### 1.4 Data Flow

```
FluoroCycler XT
    │
    ▼
FluoroSoftware XT-IVD (on instrument PC)
    │  ← Lab staff reads results from screen
    │  ← Manually copies into Excel template on networked PC
    ▼
Standardized .xlsx workbook
    │  ← Saved to OpenELIS watch folder
    ▼
OpenELIS flat-file plugin
    │  ← Parses the "Results" sheet
    ▼
OpenELIS result import pipeline
```

---

## 2. Source Data Analysis

### 2.1 Raw FluoroSoftware Output Structure

The Excel files produced by the current lab workflow contain two categories of data sheets:

**Category A — Raw qPCR fluorescence curves (NOT imported):**
- Sheet names follow the pattern: `N_N_qPCR` (e.g., `2_2_qPCR`, `4_4_qPCR`, `3_3_qPCR`, `1_1_qPCR`)
- Each channel number corresponds to a detection channel (excitation/emission filter pair)
- Structure: Column A = well position (e.g., A1, A2, … H12); Columns B–AT = 45 fluorescence intensity readings, one per PCR cycle
- These are the amplification curve data points — useful for manual review but **not needed for result import**

**Category B — Interpreted results (IMPORTED):**
- Sheet name example: `LightMix_Modular_MPox` (assay-specific)
- Structure:

| Column | Header | Example | Description |
|---|---|---|---|
| A | *(well position)* | `A1`, `A7`, `H12` | Well address on 96-well plate |
| B | `CP` | `14.48`, `-1.00`, `0.00` | Crossing point (Ct value); `-1.00` or `0.00` = no amplification |
| C | `Calc.Conc` | `0.00` | Calculated concentration (if standard curve available) |
| D | `TargetNo` | `0.0` | Target number within multiplex assay (0-indexed) |

**Key observations from actual data:**
- Each well position appears **multiple times** — once per target in the multiplex assay (2 rows per well in the MPox data = 2-target multiplex)
- `CP = -1.00` or `CP = 0.00` indicates **no amplification detected** (negative result)
- `CP > 0` indicates amplification detected; the value is the cycle threshold
- The `Calc.Conc` column is `0.00` for all entries in the observed data (no quantification standard curve loaded)

### 2.2 Observations on Current Workflow

- The current Excel files have **no patient/sample identifiers** — only well positions. Lab staff must link well positions to patient samples using a separate worklist/plate map.
- There is no run ID, date, or assay name embedded in the result sheet.
- Multiple detection channels (1_1, 2_2, 3_3, 4_4) may each have their own result interpretation rules depending on the assay.

---

## 3. Standardized Excel Template Design

To enable reliable automated import, the lab must use a **standardized template** rather than the raw copy-paste output. This section defines the template.

### 3.1 Template File Requirements

| Property | Value |
|---|---|
| Format | `.xlsx` (Office Open XML) |
| Sheet name | `Results` (must be exact) |
| Encoding | UTF-8 |
| Header row | Row 1 (required) |
| Data rows | Row 2+ |
| File naming | `FC-XT_YYYYMMDD_HHMMSS.xlsx` |

### 3.2 Template Column Definitions

| Column | Header (Row 1) | Required | Example | Description |
|---|---|---|---|---|
| A | `SampleID` | **Yes** | `LAB-2026-0412` | OpenELIS accession number; for QC samples use `QC-` prefix |
| B | `WellPosition` | Yes | `A1` | Plate well (A1–H12); informational, not used for matching |
| C | `AssayName` | **Yes** | `FluoroType MTBDR 2.0` | Assay kit name — maps to test code group |
| D | `TargetName` | **Yes** | `MTB` | Target within multiplex (e.g., MTB, rpoB, katG, inhA, IC, MPox, VACV) |
| E | `TargetNo` | No | `0` | Target index (from instrument); informational |
| F | `CP` | **Yes** | `14.48` | Crossing point / Ct value; `-1.00` or `0.00` = negative |
| G | `Interpretation` | **Yes** | `DETECTED` | Final qualitative call: `DETECTED`, `NOT DETECTED`, `INVALID`, `INDETERMINATE` |
| H | `CalcConc` | No | `1250.5` | Calculated concentration (IU/mL or copies/mL) for viral load assays; blank for qualitative assays |
| I | `CalcConcUnit` | No | `IU/mL` | Unit for CalcConc; blank if CalcConc is blank |
| J | `RunDate` | **Yes** | `2026-02-06` | Date of PCR run (YYYY-MM-DD format) |
| K | `RunID` | No | `RUN-20260206-001` | Lab-assigned run identifier |
| L | `Notes` | No | `Retest requested` | Free-text notes |

### 3.3 Interpretation Rules for Template Population

Lab staff determine the `Interpretation` column based on FluoroSoftware XT-IVD result display. General rules:

| FluoroSoftware Result | Template `Interpretation` Value | `CP` Value |
|---|---|---|
| Positive / Detected | `DETECTED` | > 0 (actual Ct value) |
| Negative / Not Detected | `NOT DETECTED` | `-1.00` or `0.00` |
| Invalid (IC failure) | `INVALID` | any |
| Indeterminate / Equivocal | `INDETERMINATE` | may be low positive |

For **FluoroType assays**, the software provides a pre-interpreted result (Positive/Negative/Invalid) — staff transcribe directly.

For **LightMix Modular assays**, staff may need to apply the assay-specific interpretation algorithm (Ct cutoff thresholds, melting curve analysis) before entering the `Interpretation` value.

---

## 4. Column Mapping — OpenELIS Import

### 4.1 Field Mapping Table

| Template Column | OpenELIS Field | Transform | Notes |
|---|---|---|---|
| `SampleID` | `sample_id` | None | Must match existing OE accession number |
| `WellPosition` | *(metadata only)* | None | Stored in result notes, not used for matching |
| `AssayName` | `test_group` | Lookup | Maps to assay-level test in OpenELIS |
| `TargetName` | `test_code` | Composite key | Combined with `AssayName` → unique test code |
| `CP` | `result_value` (secondary) | Numeric | Stored as supporting data; `-1.00` → null |
| `Interpretation` | `result_value` (primary) | Value map | See §4.2 |
| `CalcConc` | `result_value` (quantitative) | Numeric | For viral load assays only; overrides Interpretation as primary result |
| `CalcConcUnit` | `result_units` | None | `IU/mL` or `copies/mL` |
| `RunDate` | `result_datetime` | Date parse | `YYYY-MM-DD` |
| `RunID` | *(metadata only)* | None | Stored in result notes |
| `Notes` | `result_notes` | None | Free text |

### 4.2 Interpretation Value Map (Qualitative Assays)

| Template Value | OpenELIS Value | Meaning |
|---|---|---|
| `DETECTED` | `Positive` | Target detected |
| `NOT DETECTED` | `Negative` | Target not detected |
| `INVALID` | `Invalid` | Run failed (IC failure or other error) |
| `INDETERMINATE` | `Indeterminate` | Equivocal result, retest recommended |

### 4.3 Result Type Routing

The plugin must determine result type based on assay context:

| Condition | Primary Result | Type |
|---|---|---|
| `CalcConc` is populated and > 0 | `CalcConc` + `CalcConcUnit` | NUMERIC (quantitative) |
| `CalcConc` is empty or 0 | `Interpretation` (value-mapped) | DICTIONARY (qualitative) |

This handles the dual nature of the FluoroCycler XT test menu: quantitative viral load assays (HIV-1, HBV) report numeric concentrations, while detection assays (TB, MPox, STI) report qualitative results.

---

## 5. Test Code Reference Table

### 5.1 FluoroType® Assays (IVD)

| AssayName | TargetName | Analyzer Test Code | Result Type | Unit | OE Test ID |
|---|---|---|---|---|---|
| FluoroType MTB 1.0 | MTB | `FTYPE_MTB_MTB` | DICTIONARY | — | TBD |
| FluoroType MTB 1.0 | IC | `FTYPE_MTB_IC` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | MTB | `FTYPE_MTBDR_MTB` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | rpoB-WT | `FTYPE_MTBDR_RPOB_WT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | rpoB-MUT | `FTYPE_MTBDR_RPOB_MUT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | katG-WT | `FTYPE_MTBDR_KATG_WT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | katG-MUT | `FTYPE_MTBDR_KATG_MUT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | inhA-WT | `FTYPE_MTBDR_INHA_WT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | inhA-MUT | `FTYPE_MTBDR_INHA_MUT` | DICTIONARY | — | TBD |
| FluoroType MTBDR 2.0 | IC | `FTYPE_MTBDR_IC` | DICTIONARY | — | TBD |
| Generic HIV-1 Viral Load 2.0 | HIV-1 | `FTYPE_HIV1VL_HIV1` | NUMERIC | IU/mL | TBD |
| Generic HIV-1 Viral Load 2.0 | IC | `FTYPE_HIV1VL_IC` | DICTIONARY | — | TBD |
| Generic HBV Viral Load 2.0 | HBV | `FTYPE_HBVVL_HBV` | NUMERIC | IU/mL | TBD |
| Generic HBV Viral Load 2.0 | IC | `FTYPE_HBVVL_IC` | DICTIONARY | — | TBD |
| FluoroType SARS-CoV-2/Flu/RSV 1.0 | SARS-CoV-2 | `FTYPE_RESP_SARS2` | DICTIONARY | — | TBD |
| FluoroType SARS-CoV-2/Flu/RSV 1.0 | FluA | `FTYPE_RESP_FLUA` | DICTIONARY | — | TBD |
| FluoroType SARS-CoV-2/Flu/RSV 1.0 | FluB | `FTYPE_RESP_FLUB` | DICTIONARY | — | TBD |
| FluoroType SARS-CoV-2/Flu/RSV 1.0 | RSV | `FTYPE_RESP_RSV` | DICTIONARY | — | TBD |
| FluoroType SARS-CoV-2/Flu/RSV 1.0 | IC | `FTYPE_RESP_IC` | DICTIONARY | — | TBD |

### 5.2 LightMix® Modular Assays

| AssayName | TargetName | Analyzer Test Code | Result Type | Unit | OE Test ID |
|---|---|---|---|---|---|
| LightMix Modular MPox | MPox | `LMIX_MPOX_MPOX` | DICTIONARY | — | TBD |
| LightMix Modular MPox | VACV | `LMIX_MPOX_VACV` | DICTIONARY | — | TBD |

> **Note:** The test code table above covers the **Bruker-compatible assay menu** for the FluoroCycler XT. The actual assays deployed at the Madagascar site should be confirmed during implementation. Additional LightMix Modular assays can be added by following the `LMIX_[ASSAYABBREV]_[TARGET]` naming convention.

### 5.3 Test Code Construction Rule

The analyzer test code is a composite key derived from two template columns:

```
test_code = PREFIX + "_" + ASSAY_ABBREV + "_" + TARGET
```

Where:
- `PREFIX`: `FTYPE` (FluoroType) or `LMIX` (LightMix Modular)
- `ASSAY_ABBREV`: Short name for the assay kit
- `TARGET`: Target name from the multiplex

This composite key is mapped at configuration time in the OpenELIS Field Mappings screen.

---

## 6. QC Identification Rules

QC samples are identified using OR logic — any rule match classifies the row as QC.

| Rule Type | Field | Value / Pattern | Notes |
|---|---|---|---|
| specimenIdPrefix | `SampleID` | `QC-` | Lab QC convention |
| specimenIdPrefix | `SampleID` | `CTRL-` | Control samples |
| specimenIdPrefix | `SampleID` | `NC-` | Negative control |
| specimenIdPrefix | `SampleID` | `PC-` | Positive control |
| specimenIdRegex | `SampleID` | `^(QC\|CTRL\|NC\|PC\|CAL).*` | Catch-all pattern |

### 6.1 Internal Control (IC) Targets

Most FluoroType assays include an **Internal Control (IC)** target in the multiplex. The IC monitors extraction and amplification quality per sample. It is reported as a separate row in the template with `TargetName = IC`.

OpenELIS should:
- Import IC results alongside other targets for the same sample
- Flag the sample if IC = `NOT DETECTED` (indicates extraction or amplification failure)
- IC results are **not reportable** — they are used for internal QC validation only

---

## 7. Result Aggregation

| Property | Value |
|---|---|
| Mode | `PER_FILE` |
| Grouping | All rows in one `.xlsx` file belong to the same PCR run |
| Sample grouping | Group rows by `SampleID` — each sample may have multiple target rows |
| Import trigger | New `.xlsx` file detected in watch folder |

Unlike real-time protocol integrations (ASTM/HL7) which use time-window aggregation, the flat-file import processes an entire file as a single batch.

---

## 8. File Discovery Configuration

| Property | Value |
|---|---|
| Watch folder | `/opt/openelis/analyzer-import/fluorocycler-xt/` |
| File pattern | `FC-XT_*.xlsx` |
| Poll interval | 60 seconds |
| Archive path | `/opt/openelis/analyzer-archive/fluorocycler-xt/` |
| Post-import action | Move to archive |
| Encoding | UTF-8 (Excel .xlsx is inherently UTF-8) |

---

## 9. French Locale Considerations

| Concern | Handling |
|---|---|
| Decimal separator | The template mandates `.` (period) as decimal separator, regardless of Windows locale. Lab staff must be trained on this. |
| Date format | Template mandates `YYYY-MM-DD` (ISO 8601) in the `RunDate` column, not `DD/MM/YYYY`. |
| Column headers | English headers are required in the template (not French). This simplifies parsing and avoids locale-dependent header matching. |
| Excel auto-formatting | Excel may auto-convert `CP` values like `-1.00` to a date or change decimal separators. The template should use explicit text formatting for numeric columns as needed. |

---

## 10. Implementation Notes

### 10.1 Known Constraints

1. **No electronic data transfer:** The FluoroCycler XT / FluoroSoftware XT-IVD has no LIS interface. All data transfer is manual copy-paste. This introduces transcription risk.
2. **No Microsoft Office on instrument PC:** Lab must have a separate networked PC with Excel (or LibreOffice) for template population.
3. **Plate map linkage is manual:** FluoroSoftware does not embed patient/sample IDs in results. Lab staff must maintain a separate plate map (paper or digital) linking well positions to accession numbers.
4. **Multiplex complexity:** Some assays have 4+ targets per well, each requiring a separate result row. Staff training on correct template population is critical.
5. **FluoroCycler .at files:** The native output format (`.at` files) is a proprietary binary format that cannot be programmatically parsed without vendor tooling. These files crash Claude when uploaded due to encoding issues. They are not part of this integration path.

### 10.2 Risk Mitigations

| Risk | Mitigation |
|---|---|
| Transcription errors (copy-paste) | Template includes `WellPosition` for cross-reference with plate map; OpenELIS validates SampleID against existing accessions |
| Wrong assay name entered | Dropdown validation in Excel template (Data Validation list) |
| Locale-related numeric parsing | Template enforces English-locale formatting; parser validates decimal format |
| Missing IC result | Parser flags samples where expected IC row is absent |

### 10.3 Future Improvements

- **FluoroSoftware API investigation:** Determine if Bruker/Hain offers any programmatic access or database export from FluoroSoftware XT-IVD (unlikely for current version, but worth confirming with vendor)
- **PDF report parsing:** FluoroSoftware generates PDF reports with tabulated results. A PDF-to-structured-data parser could automate extraction in future iterations.
- **Barcode scanner integration:** If the lab adopts barcode-labeled tubes, a plate setup step could auto-populate the `SampleID` column from a barcode scanner, reducing manual entry.

---

## 11. Sample Template File

### 11.1 Qualitative Assay Example (LightMix Modular MPox)

```
SampleID       | WellPosition | AssayName              | TargetName | TargetNo | CP    | Interpretation | CalcConc | CalcConcUnit | RunDate    | RunID             | Notes
LAB-2026-0100  | A1           | LightMix Modular MPox  | MPox       | 0        | 14.48 | DETECTED       |          |              | 2026-01-26 | RUN-20260126-001  |
LAB-2026-0100  | A1           | LightMix Modular MPox  | VACV       | 1        | 0.00  | NOT DETECTED   |          |              | 2026-01-26 | RUN-20260126-001  |
LAB-2026-0101  | A2           | LightMix Modular MPox  | MPox       | 0        | 0.00  | NOT DETECTED   |          |              | 2026-01-26 | RUN-20260126-001  |
LAB-2026-0101  | A2           | LightMix Modular MPox  | VACV       | 1        | 0.00  | NOT DETECTED   |          |              | 2026-01-26 | RUN-20260126-001  |
NC-001         | A7           | LightMix Modular MPox  | MPox       | 0        | 0.00  | NOT DETECTED   |          |              | 2026-01-26 | RUN-20260126-001  | Negative control
PC-001         | A8           | LightMix Modular MPox  | MPox       | 0        | 33.81 | DETECTED       |          |              | 2026-01-26 | RUN-20260126-001  | Positive control
```

### 11.2 Quantitative Assay Example (HIV-1 Viral Load)

```
SampleID       | WellPosition | AssayName                    | TargetName | TargetNo | CP    | Interpretation | CalcConc | CalcConcUnit | RunDate    | RunID             | Notes
LAB-2026-0200  | A1           | Generic HIV-1 Viral Load 2.0 | HIV-1      | 0        | 28.5  | DETECTED       | 1250.5   | IU/mL        | 2026-02-06 | RUN-20260206-001  |
LAB-2026-0200  | A1           | Generic HIV-1 Viral Load 2.0 | IC         | 1        | 22.3  | DETECTED       |          |              | 2026-02-06 | RUN-20260206-001  |
LAB-2026-0201  | A2           | Generic HIV-1 Viral Load 2.0 | HIV-1      | 0        | 0.00  | NOT DETECTED   | 0.00     | IU/mL        | 2026-02-06 | RUN-20260206-001  | Below detection limit
LAB-2026-0201  | A2           | Generic HIV-1 Viral Load 2.0 | IC         | 1        | 23.1  | DETECTED       |          |              | 2026-02-06 | RUN-20260206-001  |
QC-HIGH        | H12          | Generic HIV-1 Viral Load 2.0 | HIV-1      | 0        | 18.2  | DETECTED       | 50000.0  | IU/mL        | 2026-02-06 | RUN-20260206-001  | High positive QC
```

---

## Appendix A: Assay-to-Detection-Channel Mapping

From the observed Excel data, the FluoroCycler XT reports raw fluorescence data across numbered channels. The channel-to-target mapping is assay-specific:

| Sheet Name Pattern | Channel | Typical Target Assignment (assay-dependent) |
|---|---|---|
| `1_1_qPCR` | Channel 1 | Primary target (e.g., MTB, MPox) |
| `2_2_qPCR` | Channel 2 | Secondary target or IC |
| `3_3_qPCR` | Channel 3 | Additional target (resistance gene, etc.) |
| `4_4_qPCR` | Channel 4 | Additional target or IC |

> These raw curve sheets are **not imported** by OpenELIS. They are documented here for reference in case future integration work needs to parse raw data directly.

---

## Appendix B: Spec Versioning

| Version | Date | Changes |
|---|---|---|
| v1.0 | 2026-03-06 | Initial spec — manual copy-paste Excel flat-file workflow |
