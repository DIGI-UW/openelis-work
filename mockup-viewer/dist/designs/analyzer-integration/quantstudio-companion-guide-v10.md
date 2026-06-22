# QuantStudio 5 / 7 Flex — Analyzer Setup & Export Guide
**Version:** 1.0  
**Date:** 2026-03-06  
**Confidence:** HIGH — export paths documented from QS D&A software knowledge; validated against real exports  
**Jira:** [OGC-348](https://uwdigi.atlassian.net/browse/OGC-348)

---

## Overview

This guide covers how to export results from the QuantStudio Design & Analysis (QS D&A) software and upload them to OpenELIS. It is intended for laboratory staff at sites using QuantStudio 5 (QS5) or QuantStudio 7 Flex (QS7 Flex) for HIV Viral Load (HIV VL / CV VIH) testing.

**What you will do:**
1. Complete a PCR run on the QuantStudio
2. Open the run in QS D&A Software
3. Export the Results as an XLS file
4. Upload the XLS file to OpenELIS

---

## Requirements

| Requirement | Details |
|---|---|
| **Instrument** | QuantStudio 5 or QuantStudio 7 Flex |
| **Software** | QuantStudio Design & Analysis (QS D&A) v1.5.1 or higher |
| **Computer** | Lab PC connected to the QuantStudio instrument |
| **OpenELIS version** | 3.2.0 or higher (requires OGC-324 Analyzer File Upload Screen) |
| **Export format** | XLS (legacy Excel format — `.xls` NOT `.xlsx`) |

---

## Step 1 — Verify the Run is Complete

Before exporting, confirm the run has finished:

1. Open QS D&A Software on the lab computer
2. Click **File → Open** and locate your run file (`.eds` format)
3. In the Run Information panel, verify that **Experiment Run End Time** shows a date and time — **not** "Not Started"
4. If the run end time shows "Not Started", the run has not completed. **Do not export yet.**

> ⚠️ **Important:** Exporting before a run completes produces an empty file. OpenELIS will reject files where the run end time is "Not Started".

---

## Step 2 — Export Results from QS D&A

### 2.1 Open the Export Menu

1. In QS D&A, with your run file open, click **Export** in the top menu bar
2. Select **Export Results**

### 2.2 Configure Export Settings

In the Export Results dialog:

| Setting | Required Value |
|---|---|
| **Export Type** | Results |
| **File Format** | `.xls` (Microsoft Excel 97–2003) |
| **Sheet to export** | Results (must include this sheet) |
| **Include headers** | Yes |

> ⚠️ **Do not select `.xlsx`** (Excel 2007 format). OpenELIS requires the legacy `.xls` format. If `.xlsx` is the only option in your QS D&A version, contact your site IT coordinator.

### 2.3 Save the File

1. Choose a save location — recommend a dedicated folder: `C:\QS_Exports\HIV_VL\`
2. Name the file clearly, e.g.: `CVVIH_05062024_QS7.xls`
3. Click **Save**

---

## Step 3 — Verify the Export File

Before uploading, do a quick check:

1. Open the exported `.xls` file in Microsoft Excel (or LibreOffice Calc)
2. Confirm three sheets exist: **Sample Setup**, **Amplification Data**, **Results**
3. Click the **Results** sheet
4. Confirm columns `Well`, `Sample Name`, `Target Name`, `Task`, `CT`, and `Quantity Mean` are present
5. Confirm rows with `Target Name = "VIH-1"` have numeric values in the `CT` column (or `"Undetermined"` for negative results)

> ✅ If patient samples show all empty CT and Quantity columns, the run was not complete at export time. Re-run the export after confirming the run end time is populated.

---

## Step 4 — Upload to OpenELIS

### 4.1 Navigate to the File Upload Screen

1. Log in to OpenELIS
2. Navigate to **Analyzer Results** (or **Results → Analyzer Import**, depending on your OpenELIS version)
3. Click **Upload File** (Analyzer File Upload Screen — OGC-324)

### 4.2 Select the Analyzer Type

1. In the **Analyzer** dropdown, select: **QuantStudio 5 / 7 Flex (HIV VL)**
2. If this option is not visible, contact your OpenELIS administrator to confirm the QuantStudio plugin is installed

### 4.3 Upload the File

1. Click **Choose File** and select your exported `.xls` file
2. Click **Upload / Import**
3. Review the import preview:
   - Patient accession numbers should appear in the **Sample Name** column
   - `Task = STANDARD` rows should be listed as standard curve points (not patient results)
   - `Task = NTC` rows should appear as No-Template Controls
   - `Sample Name = "PC"` rows should appear as Positive Control

### 4.4 Review and Accept Results

1. Review the parsing report for any flagged rows (e.g., IC failures, unknown sample names)
2. Click **Accept All** to import valid results, or review individually
3. Results are now associated with orders in OpenELIS

---

## Sample Name Conventions

OpenELIS identifies patient samples by their Sample Name in the export file. For results to import correctly, patient accession numbers must follow your site's format:

| Site | Sample Name Format | Example |
|---|---|---|
| Madagascar (Site 1) | Two uppercase letters + digits | `LM0706001` |
| Madagascar (Site 2) | Two uppercase letters + digits | `LL0706001` |

**Control samples** in the export are identified as follows:

| Sample Name | What it is | How OpenELIS handles it |
|---|---|---|
| `PC` | Positive Control | Routed to QC review, not patient results |
| `NC` or `NTC` | No-Template Control | Routed to QC review |
| `STD1_E7`, `STD2_E6`, etc. | Standard curve calibrators | Routed to standard curve QC |

---

## Troubleshooting

### "Pre-run file detected" error

**Cause:** The exported file has `Experiment Run End Time = "Not Started"` — the run was not complete when exported.  
**Fix:** Wait for the PCR run to complete on the QuantStudio, then re-export.

### "No Results sheet found" error

**Cause:** The file was not exported as a QuantStudio Results export, or the wrong sheet was selected.  
**Fix:** Re-export from QS D&A → Export → Export Results. Confirm the Results sheet is included.

### "Invalid file format" error

**Cause:** The file was saved as `.xlsx` (modern Excel format) instead of `.xls` (legacy Excel).  
**Fix:** In the QS D&A export dialog, select **Microsoft Excel 97–2003 (.xls)** as the format.

### Patient samples not appearing / unknown sample names

**Cause:** Sample names in the export do not match the expected format (e.g., `^[A-Z]{2}\d+$`).  
**Fix:** Check that the plate layout in QS D&A used the correct accession number format. Sample names must be entered accurately during plate setup.

### IC failure warning for a positive sample

**Cause:** In a positive (detected) HIV-1 sample, the Internal Control (IC) amplification is suppressed by the HIV-1 signal — this is expected behaviour.  
**Resolution:** OpenELIS is configured to validate IC only for negative samples. Positive sample IC failures are not blocking — they can be reviewed and accepted.

### Import shows blank quantities for all samples

**Cause:** Run was exported before PCR analysis was complete.  
**Fix:** In QS D&A, run the analysis: **Analysis → Analyze**. Then re-export.

---

## QS D&A Software Download

The QuantStudio Design & Analysis software is available from Thermo Fisher:

- **Download page:** [Thermo Fisher Connect — Software Downloads](https://www.thermofisher.com/us/en/home/technical-resources/software-downloads/quantstudio-design-analysis-desktop-software.html)
- **Compatible with:** QuantStudio 3, 5, 7 Flex, 12K Flex
- **Minimum version:** 1.5.1 (for full column export including Amp Score)

> ℹ️ QS D&A requires installation on a Windows PC that is connected (via USB or network) to the QuantStudio instrument.

---

## Validated Export Files (Reference)

These real export files from Madagascar sites were used to validate the OpenELIS parser:

| File | Instrument | Date | Patient Count | Notes |
|---|---|---|---|---|
| `CVVIH__05062024QS7.xls` | QS7 Flex (S/N 278872828) | Jun 2024 | 78 | Full 31-column set; LM prefix |
| `QS5_CVVIH_27-12-2024_SERIE_01.xls` | QS5 (S/N 272529515) | Dec 2024 | 80 | Full 31-column set; LM prefix |
| `CV_VIH_05_03_2024_serie_01.xls` | QS7 Flex | Mar 2024 | 30 | Reduced 26-column set; LL prefix |

---

## Contact & Support

For OpenELIS import configuration issues, contact your OpenELIS administrator or the UW Digital support team.  
For QuantStudio instrument or QS D&A software issues, contact Thermo Fisher Scientific support.
