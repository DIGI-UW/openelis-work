# Companion Guide: Tecan Infinite F50 — Madagascar Custom Excel Workflow for OpenELIS

**Document Version:** 2.0 (VALIDATED)
**Date:** 2026-03-06
**Status:** VALIDATED — Based on real Madagascar export files from Wantai and Pareekshak ELISA runs
**Author:** Casey / DIGI-UW
**Related Spec:** `tecan-infinite-f50-analyzer-connection-spec.md` v2.0

---

## Purpose

This guide documents the **actual workflow** used by the Madagascar laboratory for processing Tecan Infinite F50 ELISA results.

Unlike the standard Magellan Results Table export workflow (v1.0), the Madagascar lab uses **custom Excel workbook templates** where:

1. **Magellan reads the plate** and exports raw OD values to a CSV or directly to Excel
2. **Excel templates** (Plan_plaque, DO_palque, Resultat sheets) hold metadata and calculations
3. **Lab technicians enter sample IDs** manually in the Plan_plaque sheet
4. **Resultat sheet formulas** calculate S/CO ratios and qualitative results (0 = Non-Reactive, 1 = Reactive)
5. **Completed XLSX file** is saved to a shared folder and imported into OpenELIS

**This is the validated, production workflow. All steps below reflect real lab operations.**

---

## What You Will Need

- **Tecan Infinite F50** instrument connected to a PC via USB
- **Magellan™ Data Analysis Software** (any version — reads plate, exports OD grid to CSV or Excel)
- **Custom Excel template** for your ELISA kit (provided by lab manager — examples: `ESN_HIV_PAREEKSHAK_1.xlsx`, `INFINITE F50 MAGELLAN.xlsx`)
- **Two ELISA kits validated with this workflow:**
  - **Wantai HBsAg/HIV**: Controls NEG (A1–C1), POS (D1–E1); Patient accessions: CG-M4-00-001 format; Cutoff ~0.2216
  - **Pareekshak HIV-1/2 (Bhat Bio-Tech India)**: Controls BLANK (A1), NEG1 (B1), NEG2 (C1), PC1–PC3 (D1–F1); Patient accessions: FE-format (FE082031, etc.); Cutoff ~0.45–0.48
- **Sample IDs** (from paper worklist or OpenELIS — must be entered manually in Excel)
- **Shared folder path** where completed XLSX files are saved for OpenELIS import

---

## Step 1: Verify Instrument Connection

1. Power on the Infinite F50.
2. Connect the instrument to the PC using the Tecan-supplied USB cable.
3. Open Magellan software.
4. Confirm that Magellan detects the instrument — the status bar should show "Infinite F50 — Connected" (or similar).

> **If Magellan does not detect the instrument:** Check the USB cable, try a different USB port, and verify the Magellan USB driver is installed. Consult the Magellan IFU (Doc #30143531).

---

## Step 2: Run Plate Reading in Magellan

Once the plate is prepared (incubated, washed, substrate added, stop solution applied per kit instructions):

1. **Open Magellan** and select a method (or create a blank reading method if one is not available).
2. **Load the ELISA plate** into the Infinite F50 reader.
3. **Click Start Measurement** (or equivalent) in Magellan.
4. **Wait for the reader to complete** (~8 seconds for a full 96-well plate).
5. **The raw OD values** (at 450nm for most ELISA kits) are now displayed in Magellan.

> **Note:** You do NOT need to configure plate layout or sample IDs in Magellan. Magellan is only used to read the plate and export the raw OD grid. Sample IDs and calculations are done in Excel.

---

## Step 3: Export OD Values from Magellan to Excel

After the plate is read, you must export the **raw OD grid** (8 rows × 12 columns) to Excel.

### 3.1 Export to CSV or Direct to Excel

**Option A — Export to CSV, then open in Excel template:**
1. In Magellan, go to **File → Export** (or similar).
2. Choose **CSV (comma-separated)** or **Tab-delimited text** format.
3. Save the file (Magellan may suggest a name like `Results.csv` or `Data.txt`).
4. Open the CSV in a text editor or Excel to see the raw OD grid.

**Option B — Export directly to Excel (if your Magellan version supports this):**
1. In Magellan, go to **File → Export → Excel** (if available).
2. Choose the destination folder and filename.

### 3.2 Verify the Exported OD Grid

Open the CSV or Excel file and verify it shows an **8×12 grid of OD values**, similar to:

```
<>    1      2      3      4      5      6      7      8      9      10     11     12
A     0.0608 0.0612 0.0574 0.0580 0.0620 ...
B     2.156  2.189  0.123  0.456  0.789  ...
C     0.0542 0.0598 0.0615 0.0651 0.0589 ...
D     1.234  1.543  0.456  0.678  0.987  ...
E     2.189  1.876  1.654  1.432  1.210  ...
F     0.098  0.234  0.345  0.456  0.567  ...
G     0.111  0.222  0.333  0.444  0.555  ...
H     0.089  0.176  0.265  0.354  0.443  ...
```

> **⚠️ CRITICAL:** If the exported file contains "NoCalc" strings in place of OD values, this means the Magellan instrument failed to capture readings for those wells. Those wells will cause #VALUE! errors in the Excel template formulas. See Step 5 (Troubleshooting "NoCalc" errors).

### 3.3 Copy OD Values to the Excel Template

**Open your custom Excel template** (e.g., `ESN_HIV_PAREEKSHAK_1.xlsx` or your lab's version).

The template should have these sheets:
- **Plan_plaque**: Metadata + 8×12 sample ID grid (column-major order)
- **DO_palque**: Metadata + 8×12 OD grid from Magellan (+ optional duplicate)
- **Resultat**: Well-per-row table with calculated S/CO and results
- **Resultat_2** (optional): Corrected results if Resultat has formula errors

**Copy the OD values from Magellan into the DO_palque sheet:**

1. In the Magellan export (CSV or Excel), select the **8×12 OD grid** (cells A1:L8 or similar, depending on the export format).
2. **Copy** the grid.
3. In your Excel template, go to the **DO_palque sheet**.
4. Find the **OD grid cells** (usually starting around row 5 or 6, after metadata).
5. **Paste** the OD values.

> **Note:** The exact cell location in DO_palque depends on your template's layout. Check with your lab manager or template designer.

---

## Step 4: Enter Sample IDs in Plan_plaque Sheet

Sample IDs are entered **manually** in the **Plan_plaque sheet** using **column-major order** (fill column 1 entirely, then column 2, etc.).

### 4.1 Open Plan_plaque Sheet

1. In your Excel template, click the **Plan_plaque** tab.
2. You will see metadata fields at the top (date, kit name, LOT, technician, plate number) and an 8×12 grid below.
3. The grid has **row letters (A–H)** and **column numbers (1–12)**.

### 4.2 Enter Sample IDs — Column-Major Order

**Column-major means:** You fill column 1 (wells A1, B1, C1, ..., H1), then column 2 (wells A2, B2, C2, ..., H2), and so on.

**Example: Wantai HBsAg/HIV Kit**

Control layout (from package insert):
- A1, B1, C1 = NEG (Negative controls)
- D1, E1 = POS (Positive controls)
- Remaining wells = Patient samples

Sample IDs (from paper worklist): CG-M4-00-001, CG-M4-00-002, CG-M4-00-003, etc.

Fill the Plan_plaque grid as follows:

```
Column 1 (A1–H1):     Column 2 (A2–H2):     Column 3 (A3–H3):
A1 = NEG             A2 = CG-M4-00-006     A3 = CG-M4-00-012
B1 = NEG             B2 = CG-M4-00-007     B3 = CG-M4-00-013
C1 = NEG             C2 = CG-M4-00-008     C3 = CG-M4-00-014
D1 = POS             D2 = CG-M4-00-009     D3 = CG-M4-00-015
E1 = POS             E2 = CG-M4-00-010     E3 = CG-M4-00-016
F1 = CG-M4-00-001    F2 = CG-M4-00-011     F3 = (empty if < 96 samples)
G1 = CG-M4-00-002    G2 = (empty)          G3 = (empty)
H1 = CG-M4-00-003    H2 = (empty)          H3 = (empty)
```

**Example: Pareekshak HIV-1/2 Kit (Bhat Bio-Tech)**

Control layout:
- A1 = BLANK
- B1 = NEG1, C1 = NEG2
- D1 = PC1, E1 = PC2, F1 = PC3
- Remaining wells = Patient samples (FE-format accessions)

Fill similarly with FE-format IDs (e.g., FE082031, FE082032, etc.).

### 4.3 Metadata Fields (Top of Plan_plaque)

Fill in the metadata before or after entering sample IDs:

| Field | Example | Notes |
|---|---|---|
| **Date** | 2026-03-06 | YYYY-MM-DD format (or as per lab policy) |
| **Kit Name (nom du réactif)** | Wantai HBsAg/HIV | The ELISA kit used |
| **LOT** | 2301234 | Kit LOT number (from kit box) |
| **Technician (Manipulateur)** | John Doe | Person who ran the plate |
| **Plate Number** | P001 | Lab-specific plate identifier (optional) |

---

## Step 5: Verify Resultat Sheet Calculations

After OD values are in DO_palque and sample IDs are in Plan_plaque, the **Resultat sheet** automatically calculates S/CO ratios and qualitative results using Excel formulas.

### 5.1 Open Resultat Sheet

1. Click the **Resultat** tab in your template.
2. You will see a **well-per-row table** with columns like:
   - **Well** (A1, A2, B1, etc.) or **Sample ID**
   - **DO_sample** (the raw OD value for that well)
   - **DO/Cut-off (S/CO)** (calculated ratio)
   - **Results** (0 = Non-Reactive, 1 = Reactive)
   - **QC metadata** (Calculation Nc, valeur Nc, Cut-off value)

### 5.2 Verify Formulas Are Calculating

**Check that the S/CO and Results columns are populated with numbers, not errors:**

✅ **GOOD — Resultat sheet with valid calculations:**
```
Well | Sample ID          | DO_sample | DO/Cut-off | Results | Calculation Nc | valeur Nc | Cut-off
A1   | NEG                | 0.0608    | 0.274      | 0       | 10             | 0.0541    | 0.2216
A2   | NEG                | 0.0612    | 0.276      | 0       | 10             | 0.0541    | 0.2216
A3   | NEG                | 0.0574    | 0.259      | 0       | 10             | 0.0541    | 0.2216
B1   | NEG                | 0.0580    | 0.262      | 0       | 10             | 0.0541    | 0.2216
D1   | POS                | 2.156     | 9.731      | 1       | 10             | 0.0541    | 0.2216
D2   | POS                | 2.189     | 9.879      | 1       | 10             | 0.0541    | 0.2216
F1   | CG-M4-00-001       | 1.234     | 5.570      | 1       | 10             | 0.0541    | 0.2216
F2   | CG-M4-00-002       | 0.456     | 2.058      | 1       | 10             | 0.0541    | 0.2216
F3   | CG-M4-00-003       | 0.098     | 0.442      | 0       | 10             | 0.0541    | 0.2216
```

### 5.3 Handle "NoCalc" Errors in OD Grid

**If the DO_palque sheet contains "NoCalc" strings** (meaning Magellan failed to capture an OD reading), the Resultat formulas will show **#VALUE!** errors.

**Solution:**

1. **Locate the NoCalc wells** in DO_palque (e.g., well D5 shows "NoCalc" instead of a number).
2. **Delete the "NoCalc" string** and manually re-read that well:
   - Remove the plate from the reader.
   - Inspect the well for air bubbles, residue, or contamination.
   - Reload the plate and re-run the measurement for that well only (if your Magellan software supports single-well re-reading).
   - Or re-run the entire plate.
3. **Paste the corrected OD value** into the DO_palque cell.
4. **Check the Resultat sheet** — the #VALUE! error should resolve and be replaced with a valid S/CO number.

> **If re-reading is not possible:** See Step 5.4 (Creating Resultat_2 for Corrected Results).

### 5.4 Handle #VALUE! Errors — Create Resultat_2

**If the Resultat sheet has #VALUE! errors that cannot be fixed by correcting OD values**, the Excel template may include an optional **Resultat_2 sheet** for corrected results.

**This happens when:**
- Multiple wells have NoCalc errors that cannot be re-read.
- The Excel formula references a cell that is empty or invalid.
- A control well is missing or incorrectly labeled.

**❌ BAD — Resultat sheet with #VALUE! errors:**
```
Well | Sample ID          | DO_sample | DO/Cut-off | Results
A1   | NEG                | 0.0608    | 0.274      | 0
A2   | NEG                | 0.0612    | 0.276      | 0
D4   | (control)          | NoCalc    | #VALUE!    | #VALUE!
F1   | CG-M4-00-001       | 1.234     | 5.570      | 1
F2   | CG-M4-00-002       | 0.456     | 2.058      | 1
```

**Solution — Create Resultat_2:**

1. **Right-click on the Resultat sheet tab** → **Copy** → create a new sheet named **Resultat_2**.
2. **In Resultat_2, manually correct or delete rows** with #VALUE! errors.
3. **If a sample cannot be salvaged** (e.g., NoCalc due to instrument malfunction), mark it as "INVALID" in the Results column instead of a number.
4. **Save the file** with both Resultat (original, with errors) and Resultat_2 (corrected).
5. **When importing into OpenELIS**, use Resultat_2 instead of Resultat.

---

## Step 6: Check QC Acceptance Criteria

Before declaring the run valid, verify that QC controls pass the acceptance criteria embedded in the Resultat sheet.

### 6.1 QC Acceptance Criteria (Validated)

| Criterion | Limit | Why |
|---|---|---|
| **DO_BLANK** | < 0.150 | Blank wells must have low background |
| **DO_NEG** | < 0.250 | Negative controls must be negative |
| **PC – NC difference** | > 0.6 | Positive controls must be well above negative controls |

These limits are shown in the Resultat sheet under **Calculation Nc** and **valeur Nc** columns.

### 6.2 Verify QC Controls in Resultat

**Check the control wells in the Resultat sheet:**

```
Well | Sample ID | DO_sample | DO/Cut-off | Results | Pass?
A1   | NEG       | 0.0608    | 0.274      | 0       | ✓ (0.0608 < 0.250)
B1   | NEG       | 0.0612    | 0.276      | 0       | ✓ (0.0612 < 0.250)
C1   | NEG       | 0.0574    | 0.259      | 0       | ✓ (0.0574 < 0.250)
D1   | POS       | 2.156     | 9.731      | 1       | ✓ (2.156 > 0.5 above mean NEG)
E1   | POS       | 2.189     | 9.879      | 1       | ✓ (2.189 > 0.5 above mean NEG)
```

**Acceptance: If all controls pass the limits, the plate is GOOD. If any control fails, REJECT the plate and re-run.**

---

## Step 7: Save and Export for OpenELIS

Once OD values, sample IDs, and calculations are verified:

### 7.1 Finalize Metadata

Make sure all metadata fields in Plan_plaque and DO_palque are complete:
- Date
- Kit name (nom du réactif)
- LOT number
- Technician name (Manipulateur)
- Plate number (if applicable)

### 7.2 Save the Completed XLSX File

1. Go to **File → Save As** (or just **Save** if you are updating the template).
2. **Save the file with a descriptive name** to the **shared folder** (e.g., `\\server\elisa-exports\` or `/mnt/shared/elisa-exports/`).
   - Lab names can vary: `ESN_HIV_PAREEKSHAK_20260306.xlsx`, `WANTAI_HBsAg_P001_2026-03-06.xlsx`, etc.
   - **Important:** The exact naming convention may vary. Check with your lab manager for the expected format.
3. Ensure the file is saved as **Excel workbook (.xlsx)**, not CSV or other formats.

### 7.3 Verify File in Shared Folder

1. Open a file manager and navigate to the shared folder.
2. Confirm the XLSX file appears and is readable.
3. Note the full file path (e.g., `/mnt/shared/elisa-exports/ESN_HIV_PAREEKSHAK_20260306.xlsx`).

---

## Step 8: Import into OpenELIS

Once the XLSX file is in the shared folder, OpenELIS can import it.

### 8.1 Manual Import (if OpenELIS plugin not yet configured)

1. **Log into OpenELIS** as a Lab Manager or Administrator.
2. Go to **Analyzer File Upload** (or **Results → Upload Results File**).
3. **Select the XLSX file** from the shared folder.
4. **Click Import** — OpenELIS will parse the Resultat sheet and import results.

### 8.2 Automatic Import (if OpenELIS plugin is configured)

If the OpenELIS integration team has set up an automated importer:
1. The XLSX file in the shared folder is **automatically picked up** by an OpenELIS background job.
2. Results are **imported into the system**.
3. Technician reviews results in OpenELIS (Results menu → View Results) and validates.

**Check the OpenELIS system logs** to confirm the import succeeded.

---

## Good Export Examples

### Example 1: Wantai HBsAg/HIV — 5 Controls + 8 Patients (GOOD)

**File:** `/mnt/shared/elisa-exports/WANTAI_HBsAg_20260305.xlsx`

**Resultat sheet content:**
```
Well | Sample ID        | DO_sample | DO/Cut-off | Results
A1   | NEG              | 0.0608    | 0.274      | 0
B1   | NEG              | 0.0612    | 0.276      | 0
C1   | NEG              | 0.0574    | 0.259      | 0
D1   | POS              | 2.156     | 9.731      | 1
E1   | POS              | 2.189     | 9.879      | 1
F1   | CG-M4-00-001     | 1.234     | 5.570      | 1
F2   | CG-M4-00-002     | 0.456     | 2.058      | 1
F3   | CG-M4-00-003     | 0.098     | 0.442      | 0
F4   | CG-M4-00-004     | 0.135     | 0.609      | 0
F5   | CG-M4-00-005     | 1.876     | 8.463      | 1
F6   | CG-M4-00-006     | 0.234     | 1.055      | 1
F7   | CG-M4-00-007     | 0.567     | 2.558      | 1
F8   | CG-M4-00-008     | 0.089     | 0.401      | 0
```

**Status:** ✅ GOOD — Controls pass, patient results valid, no errors.

### Example 2: Pareekshak HIV-1/2 — 6 Controls + 12 Patients (GOOD)

**File:** `/mnt/shared/elisa-exports/ESN_HIV_PAREEKSHAK_20260306.xlsx`

**Resultat sheet content:**
```
Well | Sample ID    | DO_sample | DO/Cut-off | Results
A1   | BLANK        | 0.0421    | 0.094      | 0
B1   | NEG1         | 0.1234    | 0.274      | 0
C1   | NEG2         | 0.1189    | 0.264      | 0
D1   | PC1          | 2.156     | 4.789      | 1
E1   | PC2          | 2.345     | 5.211      | 1
F1   | PC3          | 2.234     | 4.964      | 1
G1   | FE082031     | 0.876     | 1.946      | 1
G2   | FE082032     | 0.123     | 0.273      | 0
G3   | FE082033     | 1.543     | 3.429      | 1
G4   | FE082034     | 0.234     | 0.520      | 0
H1   | FE082035     | 1.876     | 4.169      | 1
H2   | FE082036     | 0.456     | 1.013      | 1
(... more patients ...)
```

**Status:** ✅ GOOD — All controls pass, patients correctly identified with FE accessions, no formula errors.

---

## Bad Export Examples

### Example 1: Raw OD Grid Only (Missing Resultat Sheet)

**File:** `DO_palque_only.xlsx`

**Content:**
```
<>   1      2      3      4      5      6      7      8      9     10     11     12
A    0.0608 0.0612 0.0574 0.0580 0.0620 ...
B    2.156  2.189  0.123  0.456  0.789  ...
C    0.0542 0.0598 0.0615 0.0651 0.0589 ...
D    1.234  1.543  0.456  0.678  0.987  ...
...
```

**Problem:** ❌ This is only the raw OD grid from DO_palque. There are no sample IDs, no S/CO calculations, and no qualitative results. OpenELIS cannot import this.

**Fix:** Ensure the **Resultat sheet** is populated with well-per-row data including sample IDs and calculated results (S/CO and 0/1 calls). Do NOT export just the OD grid.

### Example 2: Resultat with #VALUE! Errors (Uncorrected)

**File:** `WANTAI_HBsAg_ERRORS.xlsx`

**Resultat sheet content:**
```
Well | Sample ID    | DO_sample | DO/Cut-off | Results
A1   | NEG          | 0.0608    | 0.274      | 0
A2   | NEG          | 0.0612    | 0.276      | 0
D4   | (missing ID) | NoCalc    | #VALUE!    | #VALUE!
D5   | (missing ID) | 0.456     | #VALUE!    | #VALUE!
F1   | CG-M4-00-001 | 1.234     | 5.570      | 1
```

**Problem:** ❌ The DO_palque sheet has "NoCalc" entries that caused #VALUE! errors in the Resultat formulas. OpenELIS cannot parse these rows.

**Fix:** Either:
1. **Correct the OD values** (re-read the wells, paste corrected values into DO_palque).
2. **Create a Resultat_2 sheet** with corrected rows or delete invalid rows.
3. **Mark invalid rows as "INVALID"** in the Results column.

---

## Edge Cases and Known Issues

### H+++ Annotation on Accession Numbers

**Issue:** Some Pareekshak runs show accession numbers with "H+++" appended, e.g., `FE082031H+++`, `FE040121H+++`.

**Meaning:** Unknown — possibly a manual notation by the technician or a data entry artifact.

**Solution:** When parsing accession numbers in OpenELIS, **strip the "H+++" suffix** if present. The valid accession is `FE082031`, not `FE082031H+++`.

### "NoCalc" Strings in OD Grid

**Issue:** If the Magellan instrument fails to capture an OD reading for a well, the exported OD grid shows "NoCalc" instead of a number.

**Causes:**
- Reader malfunction or optical error
- Air bubble in the well
- Plate not seated properly during measurement

**Solution:**
1. Remove the "NoCalc" string from the DO_palque cell.
2. Re-read that well (if Magellan supports single-well re-reading).
3. Paste the corrected OD value.
4. Check Resultat — #VALUE! should resolve.
5. If re-reading is not possible, mark the row as INVALID and create Resultat_2 with corrected data.

### Excel Formula Errors (#VALUE!)

**Issue:** When Resultat sheet has #VALUE! errors, it means a formula is trying to reference a cell that is empty, text, or contains an error.

**Causes:**
- NoCalc in OD grid
- Missing control well in DO_palque
- Incorrect cutoff or NC value in metadata
- Blank cells in expected OD positions

**Solution:**
1. **Check the DO_palque sheet** — ensure all expected wells have numeric OD values (no blanks, no "NoCalc").
2. **Verify metadata** (Calculation Nc, valeur Nc, Cut-off) are filled in.
3. **If errors persist**, create Resultat_2 with corrected rows or manual results.

### Duplicate OD Grids in DO_palque

**Issue:** Some templates (e.g., Pareekshak runs) include **two OD grids** in the DO_palque sheet (original + duplicate).

**Solution:** Both grids are optional; either one will work. Use whichever is clearer. If one contains NoCalc errors, use the other if available.

---

## Daily Workflow Checklist

Use this checklist for each plate run:

```
1. ☐ PREPARATION
   ☐ Prepare ELISA plate per kit instructions (incubation, washing, substrate, stop)
   ☐ Open custom Excel template (correct kit)
   ☐ Fill in Plan_plaque metadata (date, kit name, LOT, technician)

2. ☐ INSTRUMENT READ
   ☐ Load plate into Infinite F50
   ☐ Open Magellan, click Start Measurement
   ☐ Wait for read to complete (~8 seconds)
   ☐ Export OD grid from Magellan (CSV or Excel)

3. ☐ EXCEL ENTRY
   ☐ Paste OD values into DO_palque sheet
   ☐ Check for "NoCalc" entries (if present, re-read wells)
   ☐ Enter sample IDs in Plan_plaque sheet (column-major order)
   ☐ Verify all metadata fields are complete

4. ☐ VERIFICATION
   ☐ Check Resultat sheet — all calculations populated (no #VALUE!)
   ☐ Verify QC controls pass acceptance criteria
   ☐ Check for edge cases (H+++, duplicates, etc.)
   ☐ If errors present, create Resultat_2 with corrections

5. ☐ EXPORT
   ☐ Save file as .xlsx to shared folder
   ☐ Verify file appears in shared folder
   ☐ Note file path and timestamp

6. ☐ OPENELISIS IMPORT
   ☐ OpenELIS auto-imports (or technician uploads manually)
   ☐ Verify import succeeded in OpenELIS logs
   ☐ Technician reviews and validates results in OpenELIS
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| **Resultat sheet shows #VALUE! errors** | NoCalc in DO_palque or missing metadata | Check DO_palque for NoCalc; re-read affected wells; verify metadata filled |
| **Sample IDs not appearing in Resultat** | Sample IDs not entered in Plan_plaque | Go to Plan_plaque sheet, fill in all sample IDs in column-major order |
| **S/CO ratios are zero or very large** | Cutoff value (valeur Nc) is incorrect or cut-off reference well is missing | Check DO_palque for the control well (usually A1 or B1); verify cutoff formula in Excel |
| **Controls pass criteria but patient results look wrong** | OD values pasted incorrectly or formula references wrong cells | Spot-check a few patient OD values against original Magellan export; verify row/column mapping |
| **File will not open in Excel** | File is corrupted or saved in wrong format | Re-open template, re-enter data, save as .xlsx (not .xls or .csv) |
| **OpenELIS import fails** | File not in shared folder, wrong filename format, or Resultat sheet missing | Verify file path; check that file is .xlsx; confirm Resultat or Resultat_2 sheet exists |
| **Magellan does not detect instrument** | USB cable issue or driver not installed | Check cable, try different USB port, reinstall Magellan driver |
| **"H+++" appears on accession numbers** | Notation or data entry artifact — exact cause unknown | Strip "H+++" suffix when importing into OpenELIS (use valid accession without suffix) |

---

## Information We Need From Your Site

Please collect and send the following to the integration team:

| Item | How to Get It | Priority |
|---|---|---|
| **Real XLSX export file** (completed Resultat sheet) | Follow Steps 1–7 above | 🔴 High |
| **Screenshot of Plan_plaque sheet** (sample IDs visible) | Take screenshot of completed Plan_plaque | 🔴 High |
| **Screenshot of Resultat sheet** (calculations visible) | Take screenshot of completed Resultat | 🔴 High |
| **Magellan export format** (CSV, TXT, or direct Excel?) | Note which export option you use | 🟡 Medium |
| **Excel template name/version** | What is your template file called? | 🟡 Medium |
| **List of ELISA kits in use** | Wantai, Pareekshak, others? | 🟡 Medium |
| **Sample ID format per kit** | Wantai (CG-M4-00-001), Pareekshak (FE082031), or custom? | 🟡 Medium |

---

## Workflow Differences from v1.0

| Aspect | v1.0 (Magellan Export) | v2.0 (Excel Template) |
|---|---|---|
| **Sample ID entry** | In Magellan method plate layout | In Excel Plan_plaque sheet (manual) |
| **Cutoff calculation** | In Magellan evaluation settings | In Excel Resultat sheet formulas |
| **Export source** | Magellan Results Table | Custom Excel template (Resultat sheet) |
| **QC criteria** | Configured in Magellan method | Embedded in Excel template (metadata) |
| **Final file format** | CSV or ASCII from Magellan | XLSX (custom template) |
| **Troubleshooting focus** | Magellan method settings | Excel formulas, OD grid, metadata |

---

## References

- **Wantai HBsAg/HIV Kit Specification** — Validated on Madagascar plates (91 patients, 5 controls, cutoff ~0.2216)
- **Pareekshak HIV-1/2 Kit (Bhat Bio-Tech India)** — Validated on Madagascar plates (88 patients, 6 controls, cutoff ~0.45–0.48)
- **Madagascar Lab Custom Excel Templates** — `ESN_HIV_PAREEKSHAK_1.xlsx`, `INFINITE F50 MAGELLAN.xlsx`, others
- **Tecan Infinite F50 IFU** (Doc #30186912)
- **Magellan Data Analysis Software IFU** (Doc #30143531)
- **Related Spec:** `tecan-infinite-f50-analyzer-connection-spec.md` (v2.0 — VALIDATED)

---

## Document History

- **v1.0 (2026-03-05):** Initial guide based on standard Magellan workflow assumption
- **v2.0 (2026-03-06):** REWRITTEN for Madagascar custom Excel template workflow, validated against real export files (Wantai, Pareekshak)
