# Companion Guide: Thermo Multiskan FC — SkanIt Export Configuration for OpenELIS

**Document Version:** 2.0
**Date:** 2026-03-06
**Status:** VALIDATED — Updated with real SkanIt export data from Madagascar site
**Author:** Casey / DIGI-UW
**Related Spec:** `thermo-multiskan-fc-analyzer-connection-spec.md` (v2.0)

---

## Purpose

This guide walks lab staff through configuring the Thermo Scientific Multiskan FC's **SkanIt™ Software** to export **ELISA measurement data** in the format that OpenELIS Global can import.

It also covers the **standalone USB flash drive export** as a fallback for sites without a reliable PC/network connection.

> **✅ VALIDATED FORMAT: Dual Plate-Grid (OD Grid + Sample ID Grid)**
>
> Real SkanIt export files from the Madagascar site confirm that SkanIt produces a **dual plate-grid format**:
>
> 1. **First Grid** — labeled "Abs" (Absorbance): An 8×12 table of raw OD values with row letters (A–H) and column numbers (1–12).
> 2. **Second Grid** — labeled "Échantillon" (Sample): An 8×12 table of sample IDs mapped to the same plate positions.
>
> This is the **expected and correct format** for SkanIt exports. The export includes all the information we need: raw absorbance values linked to sample identifiers. Cutoff calculations and S/CO ratios are NOT included in the export — these will be calculated by the OpenELIS plugin.

---

## What You Will Need

- Thermo Multiskan FC instrument connected to a PC via USB
- SkanIt™ Software for Microplate Readers installed on the PC (version and exact filename — please report both)
- The ELISA kit's package insert (for QC acceptance criteria — cutoff will be calculated by the OpenELIS plugin)
- A network folder or USB drive path where export files will be saved
- Sample accession numbers (from OpenELIS or paper worklist)
- *(For standalone USB export only):* A USB flash drive formatted as FAT32

---

## Step 1: Verify Instrument Connection

### Option A — PC with SkanIt (Recommended)

1. Power on the Multiskan FC.
2. Connect the instrument to the PC using the Thermo-supplied USB cable.
3. Open SkanIt software.
4. Confirm that SkanIt detects the instrument — the status bar should show the instrument name and "Connected" (or a green indicator).

> **If SkanIt does not detect the instrument:** Check the USB cable, try a different USB port, and verify the SkanIt USB driver is installed. Consult the Multiskan FC User Manual (Cat. No. N07710, Rev. 2.4).

### Option B — Standalone Mode (Fallback)

1. Power on the Multiskan FC.
2. The onboard color display should show the main menu.
3. Verify you can navigate to the measurement and export screens using the touchscreen.

**📸 Take a screenshot of:** SkanIt main window showing the instrument connection status (Option A) **or** a photo of the Multiskan FC onboard display at the main menu (Option B). Send to the integration team.

---

## Step 2: Create or Edit the ELISA Protocol in SkanIt

Each ELISA kit (HIV, HBsAg, HCV, Malaria, Syphilis, etc.) needs its own SkanIt session protocol. The protocol defines the measurement parameters and how results are processed.

### 2.1 Create a New Session / Protocol

1. In SkanIt, go to **Session → New** (or **Protocol → New**, depending on your version).
2. Select **Absorbance** as the measurement type.
3. Set the measurement parameters:

| Setting | Recommended Value | Notes |
|---|---|---|
| **Plate Type** | 96-well | Unless your site uses 384-well plates |
| **Measurement Wavelength** | Per kit (e.g., 450 nm for TMB substrate) | Check package insert |
| **Reference Wavelength** | Per kit (e.g., 620 nm or 630 nm) | Optional — for background subtraction |
| **Shaking** | Per kit instructions (typically 5–10 seconds before read) | — |

### 2.2 Configure the Plate Layout

This is where you define which wells are blanks, controls, and patient samples. **This step is important** — it helps with QC validation in SkanIt and provides context for OpenELIS.

1. In the session/protocol editor, go to the **Plate Layout** section.
2. Define well assignments according to the ELISA kit's package insert:

| Well(s) | Type in SkanIt | Sample ID Format | Description |
|---|---|---|---|
| A1 (or per kit) | **Blank** | `Blanc1` | Substrate/conjugate blank |
| B1, C1, D1 (or per kit) | **Control** (Negative) | `NC0001`, `NC0002`, `NC0003` | Negative controls (provided with kit) |
| E1, F1 (or per kit) | **Control** (Positive) | `PC0001`, `PC0002` | Positive controls (provided with kit) |
| Remaining wells | **Unknown** or **Sample** | OpenELIS accession number or `Échantillon0003`, `Échantillon0014`, etc. | Patient samples (or test placeholders) |

> **Note:** The exact plate layout varies by kit manufacturer. Follow the package insert. In Madagascar test data, the sample naming convention uses `Blanc`, `NC`, `PC`, and `Échantillon` prefixes. In production, accession numbers from OpenELIS will replace the placeholder sample names.

### 2.3 Enter Sample IDs (Accession Numbers or Test Identifiers)

**This is critical for OpenELIS integration.** Every patient sample well must have a unique identifier entered so it appears in the export.

**Option A — Manual Entry in SkanIt (simplest, always works):**
1. In the plate layout view, click on the first patient sample well (marked as "Unknown" or "Sample").
2. Enter the identifier (e.g., OpenELIS accession number `24-00001234`, or test placeholder `Échantillon0003`) in the **Sample ID** or **Name** field.
3. Repeat for all patient sample wells.

**Option B — Import from File (faster for large batches):**
1. Create a simple text file listing identifiers in order, one per line:
   ```
   24-00001234
   24-00001235
   24-00001236
   ...
   ```
2. In SkanIt, use **Plate Layout → Import** or **Import Sample IDs** (exact menu path depends on version).
3. Select the text file and verify the mapping.

**Option C — Standalone Instrument Entry (if not using SkanIt):**
1. On the Multiskan FC touchscreen, navigate to the protocol's plate layout.
2. Use the onboard keyboard to enter identifiers for each patient well.
3. This is slow but works when no PC is available.

> **⚠️ If sample IDs are not entered, the export will only have empty well positions in the sample ID grid.** This makes linking results to patients in OpenELIS impossible.

**📸 Take a screenshot of:** The SkanIt plate layout showing well assignments (color-coded by type) and at least one sample ID entered. Send to the integration team.

---

## Step 3: Configure QC Acceptance Criteria (Quality Control)

The validated SkanIt export contains **raw OD values only** — no S/CO ratios or qualitative interpretations. Cutoff calculations will be performed by the OpenELIS plugin.

However, you can still configure QC acceptance criteria in SkanIt to help validate plate quality during measurement.

### 3.1 Set Up QC Acceptance Criteria (if supported)

1. In the session/protocol editor, go to the **Analysis**, **Calculations**, or **QC** section.
2. Set acceptance criteria for control wells based on the ELISA kit package insert:
   - **Positive Control OD**: Must be above the kit-defined minimum (e.g., ≥ 0.5)
   - **Negative Control OD**: Must be below the kit-defined maximum (e.g., ≤ 0.15)
   - **Blank well OD**: Must be below the kit-defined threshold (e.g., ≤ 0.05)
3. If SkanIt supports it, enable automatic QC validation to flag failed plates.

### 3.2 Cutoff Calculation — Performed by OpenELIS

The validated export does **NOT include** S/CO ratios, qualitative results (Reactive/Non-Reactive), or cutoff calculations. This is expected and correct.

**The OpenELIS plugin will:**
- Receive the raw OD values and sample IDs from the SkanIt export
- Calculate the cutoff using the formula for the ELISA kit
- Compute S/CO ratios for each sample
- Generate qualitative interpretations (Reactive, Non-Reactive, Equivocal)
- Display results in OpenELIS

You do not need to configure cutoff calculations in SkanIt.

---

## Step 4: Configure the Data Export

This is where you tell SkanIt what format to export and where to save it. The validated format from Madagascar shows that **SkanIt produces a dual plate-grid export by default** — this is exactly what we want.

### 4.1 Open Export Settings

1. In SkanIt, go to **Session → Export** or **File → Export** or the **Export** tab (varies by version).
2. Select **Export to File** (not just display on screen or print).

### 4.2 Set the Export Format

| Setting | What to Choose | Why |
|---|---|---|
| **Format** | **Excel (.xlsx)** — **preferred** | Uses standard period decimals (0.0451) and avoids encoding issues. CSV also works but requires Windows-1252 encoding. |
| **Layout** | SkanIt default (dual plate-grid) | SkanIt produces the correct format by default: OD grid + Sample ID grid. This is what we want. |
| **Content** | All available fields | The export should include both the Absorbance grid (OD values) and the Échantillon (Sample ID) grid. |

> **✅ EXPECTED FORMAT:** SkanIt's default export produces a dual plate-grid layout with:
> - **Grid 1 (header "Abs")**: An 8×12 table of raw OD absorbance values
> - **Grid 2 (header "Échantillon")**: An 8×12 table of sample IDs at the same plate positions
>
> This is the validated format from Madagascar. Do NOT change the layout settings — the default is correct.

### 4.3 Set the Export Location

| Setting | Recommended Value |
|---|---|
| **Export Folder** | A shared network folder that the OpenELIS server can read (e.g., `\\server\elisa-exports\multiskan\`) |
| **Fallback** | A local folder (e.g., `C:\SkanItExports\`) if no network share is available — files will need to be manually transferred |
| **File Naming** | Use SkanIt's default naming (includes date/time stamp) or configure to include the date and protocol name |

### 4.4 Set the Export Trigger

| Setting | Recommended |
|---|---|
| **Auto-export after measurement** | ✅ Enable this if available in your SkanIt version |
| **Manual export** | If auto-export is not available, the technician must go to **Session → Export** (or **File → Export**) after every run |

**📸 Take a screenshot of:** The SkanIt export settings page showing format, layout, and export folder. Send to the integration team.

---

## Step 5: Run a Test Plate and Verify the Export

Before using this in production, run one plate and verify the export file looks correct. The validated format is a **dual plate-grid** with two grids: one for OD absorbance values and one for sample IDs.

### 5.1 Run the Measurement

1. Load the ELISA plate into the Multiskan FC.
2. In SkanIt, open the configured protocol/session.
3. Verify the plate layout and sample IDs are correct.
4. Click **Start** or **Measure** (or equivalent).
5. Wait for the measurement to complete (~7 seconds for 96-well, ~13 seconds for 384-well).

### 5.2 Trigger the Export

- If auto-export is configured: The file should appear in the export folder automatically.
- If manual: Go to **Session → Export** → confirm format (XLSX or CSV) → confirm path → click **Export**.

### 5.3 Verify the Export File

Open the exported file (in Excel for .xlsx, or a text editor for CSV) and check:

**✅ GOOD export (what we want — dual plate-grid with OD + Sample IDs):**
```
Résultats de mesure;;;;;;;;;;;;
Merilisa 17 11 2025 (1).skax;;;;;;;;;;;;
17/11/2025 12:38:43;;;;;;;;;;;;
 ;;;;;;;;;;;;
Absorbance 1;;;;;;;;;;;;
Longueur d'onde: 450 nm;;;;;;;;;;;;
 ;;;;;;;;;;;;
Plaque 1;;;;;;;;;;;;
 ;;;;;;;;;;;;
Abs;1;2;3;4;5;6;7;8;9;10;11;12
A;0,0451;0,0756;;;;;;;;;;
B;0,0579;0,0645;;;;;;;;;;
C;0,0590;0,0797;;;;;;;;;;
D;0,0768;0,0694;;;;;;;;;;
E;4,3451;0,0738;;;;;;;;;;
F;4,0382;0,0717;;;;;;;;;;
G;0,0632;0,0922;;;;;;;;;;
H;0,0627;;;;;;;;;;;
;;;;;;;;;;;;
Échantillon;1;2;3;4;5;6;7;8;9;10;11;12
A;Blanc1;Échantillon0003;;;;;;;;;;
B;NC0001;Échantillon0014;;;;;;;;;;
C;NC0002;Échantillon0025;;;;;;;;;;
D;NC0003;Échantillon0036;;;;;;;;;;
E;PC0001;Échantillon0047;;;;;;;;;;
F;PC0002;Échantillon0058;;;;;;;;;;
G;Échantillon0001;Échantillon0069;;;;;;;;;;
H;Échantillon0002;;;;;;;;;;;
;;;;;;;;;;;;
Plage d'autochargement A1 - M28
```

**❌ BAD export (missing Sample ID grid):**

An export file with ONLY the absorbance grid (Abs) and no sample ID grid (Échantillon) below it:
```
Abs;1;2;3;4;5;6;7;8;9;10;11;12
A;0,0451;0,0756;;;;;;;;;;
B;0,0579;0,0645;;;;;;;;;;
...
(no second grid with sample IDs below)
```

> If your export is missing the second grid with sample IDs, check that you entered sample IDs in the plate layout (Step 2.3) and that they were saved before running the measurement.

### 5.4 Send the File to the Integration Team

**📨 Email the first test export file to the integration team.** This verifies that your SkanIt setup is configured correctly and produces the expected dual plate-grid format.

Include:
- The export file itself (CSV or XLSX)
- Your SkanIt version number and filename (Help → About, or the SkanIt window title)
- The ELISA kit name and manufacturer (e.g., "Merilisa HIV" or "Murex HBsAg")
- The SkanIt session filename (e.g., "Merilisa 17 11 2025 (1).skax")
- Whether auto-export or manual export was used
- Whether you used SkanIt (PC) or standalone mode (USB)
- Any notes about the plate layout or sample ID entry method
- Date and time the measurement was taken

---

## Step 6: USB Flash Drive Export (Standalone Mode — Fallback)

If the Multiskan FC is not connected to a PC, or if SkanIt is unavailable, you can use the instrument's standalone mode to export results to a USB flash drive.

### 6.1 Set Up the Protocol on the Instrument

1. On the Multiskan FC touchscreen, navigate to **Protocols** or **Assay Setup**.
2. Create or select the ELISA protocol:
   - Set wavelength filter (e.g., 450 nm)
   - Set plate type (96-well)
   - Enter sample IDs using the onboard keyboard (if supported by your firmware version)
3. Configure plate layout and well assignments on the touchscreen.

### 6.2 Run the Measurement

1. Load the ELISA plate.
2. On the touchscreen, select the protocol and press **Start** / **Measure**.
3. Wait for the measurement to complete.

### 6.3 Export to USB Flash Drive

1. Insert a FAT32-formatted USB flash drive into the **front USB port** of the Multiskan FC.
2. Navigate to **Results → Export** (or similar — consult the instrument's onboard help).
3. Select the results to export and confirm.
4. Wait for the export to complete (a confirmation message should appear).
5. Remove the USB flash drive.

### 6.4 Transfer to OpenELIS

1. Plug the USB flash drive into a PC with access to the OpenELIS server.
2. Copy the export file to the OpenELIS import directory (or upload via the **Analyzer File Upload** screen in OpenELIS — see OGC-324).
3. OpenELIS will parse and import the results.

> **⚠️ The standalone USB export format may differ from the SkanIt export format.** Please send a sample file from the standalone USB export as well so the integration team can verify the parser handles both formats.

**📸 Take a photo of:** The Multiskan FC touchscreen showing the export confirmation (or the USB export menu). Send to the integration team.

---

## Step 7: Ongoing Workflow (Daily Use)

Once everything is configured, the daily workflow is:

### Workflow A — SkanIt on PC (Recommended)

```
1. Prepare ELISA plate per kit instructions (incubation, washing, substrate, stop)
2. Open SkanIt → select the protocol for the ELISA kit
3. Enter sample IDs / accession numbers in the plate layout
   (or import from text file if using Option B)
4. Load plate into Multiskan FC → click Start / Measure
5. Multiskan FC reads the plate (~7 sec) → SkanIt receives data → processes results
6. SkanIt auto-exports to folder
   (or technician manually exports if auto-export is not available)
7. OpenELIS imports the file automatically from the watched folder
   (or technician uploads via the Analyzer File Upload screen)
8. Technician reviews results in OpenELIS → validates → results go to patient record
```

### Workflow B — Standalone + USB (Fallback)

```
1. Prepare ELISA plate per kit instructions
2. On the Multiskan FC touchscreen → select the protocol
3. Enter sample IDs on the touchscreen (if supported)
4. Load plate → press Start / Measure
5. Instrument reads and processes the plate
6. Insert USB flash drive → export results
7. Transfer USB file to OpenELIS import directory (manual step)
8. Technician reviews results in OpenELIS → validates → results go to patient record
```

---

## What the Export File Must Contain

The validated SkanIt export is a **dual plate-grid** containing:

| Element | Format | Required? | Why |
|---|---|---|---|
| **Absorbance Grid** (header "Abs") | 8×12 table of OD values with row letters (A–H) and column numbers (1–12) | ✅ **Required** | Raw measurement data from the instrument |
| **Sample ID Grid** (header "Échantillon") | 8×12 table of sample identifiers at the same plate positions | ✅ **Required** | Links absorbance values to samples or controls in OpenELIS |
| **Metadata** (date, time, wavelength, session name) | Header lines in the export | ✅ Required | Traceability and audit trail |
| **S/CO ratio** | Calculated value per sample | ❌ **Not in export** | The OpenELIS plugin will calculate this from raw OD and QC results |
| **Qualitative result** (Reactive/Non-Reactive) | Interpretation per sample | ❌ **Not in export** | The OpenELIS plugin will generate this based on S/CO |
| **Concentration** | Calculated value (quantitative assays) | ❌ **Not in export** | The OpenELIS plugin will calculate this if needed |

**Key Point:** The validated export contains **only the dual OD and Sample ID grids** — no calculated fields. This is correct. The OpenELIS plugin will perform all cutoff calculations and interpretations.

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---|---|---|
| Sample ID grid (Échantillon) is missing from the export | Sample IDs were not entered in the plate layout before the measurement | Go back to Step 2.3, enter sample IDs, and save the protocol before running the next plate |
| Sample ID grid is present but cells are empty | Sample IDs were entered but not saved in the protocol before measurement | Ensure you click Save or Apply after entering sample IDs in the plate layout |
| Absorbance grid (Abs) shows all zeros or blanks | Instrument measurement failed or plate was not read | Check that the plate loaded correctly; retry the measurement |
| Export file has French text but unclear spacing (CSV) | CSV encoding issue — file is Windows-1252, not UTF-8 | Open the file in Excel instead of a text editor; or re-export as XLSX |
| Export file uses comma as decimal separator (e.g., 0,0451) | This is correct for CSV exports from SkanIt with French locale | No action needed; the OpenELIS parser handles this. For easier viewing, export as XLSX instead (uses standard period decimals) |
| File does not appear in the export folder | Auto-export not enabled, or wrong folder path | Check export settings (Step 4.3–4.4); try manual export via Session → Export |
| SkanIt does not detect the instrument | USB cable issue or driver not installed | Check cable, try a different USB port, reinstall SkanIt drivers. Consult the Multiskan FC User Manual |
| USB flash drive not recognized by instrument | Drive not formatted as FAT32 or too large | Format the drive as FAT32; use a drive ≤ 32 GB |
| Standalone USB export has no sample IDs in the sample grid | Onboard firmware may not support sample ID entry, or IDs were not entered | Use SkanIt on a PC instead (Workflow A) for full sample ID support |
| QC controls (Blanc, NC, PC) show unexpected OD values | Kit reagent issue or plate incubation problem, not a software issue | Check kit lot expiry dates, verify incubation times per package insert, re-run the plate with fresh reagents |
| Export filename is hard to read or doesn't match expected format | SkanIt uses a timestamp and random ID in the filename (e.g., `temporarySkanitExport mars ven. 6 2026 16-18-06-7384124.csv`) | This is normal. File content is what matters. Rename the file to a meaningful name (e.g., `HIV_Plate_2026-03-06.xlsx`) for easier tracking |

---

## Information We Need From Your Site

The validated findings from Madagascar show the dual plate-grid format is correct. However, to finalize OpenELIS integration, please collect and send the following:

| Item | How to Get It | Priority |
|---|---|---|
| **First export file from SkanIt** (test plate with Blanc, NC, PC, and sample wells) | Follow Steps 1–5 above | 🔴 **High** — validates your setup produces the correct format |
| **SkanIt version number and filename** | Help → About in SkanIt; also note the window title or About dialog | 🔴 **High** — needed to ensure compatibility |
| **ELISA kit name and manufacturer** | Kit package insert or box label (e.g., "Merilisa HIV", "Murex HBsAg") | 🔴 **High** — needed to configure cutoff calculations in the OpenELIS plugin |
| **SkanIt session filename** | Example: "Merilisa 17 11 2025 (1).skax" — shown in the export file header | 🟡 Medium |
| **Screenshot of SkanIt plate layout** | Step 2.2 screenshot showing well assignments (Blanc, NC, PC, Échantillon) | 🟡 Medium |
| **First export file from USB standalone** (if you use standalone mode) | Follow Step 6 above | 🟡 Medium (if applicable) |
| **Model number** | Check label on back of instrument: #51119000 (standard) or #51119100 (with incubator) | 🟡 Medium |
| **Firmware version** (standalone mode) | Instrument touchscreen → Settings → About | 🟡 Medium |
| **Sample ID entry workflow** | How do you currently get accession numbers? Paper worklist? Barcode scanner? | 🟡 Medium |
| **Do you use 384-well plates?** | Ask lab supervisor | 🟡 Low |
| **Network share path** (if available) | Ask IT — is there a shared folder the OpenELIS server can access? | 🟡 Low |

---

## Key Differences: SkanIt vs Standalone USB Export

| Feature | SkanIt (PC) | Standalone (USB) |
|---|---|---|
| **Sample ID entry** | Easy — keyboard/import | Limited — onboard touchscreen keyboard |
| **Export format options** | Excel, CSV, configurable layout | CSV/text, limited format options |
| **Cutoff calculations** | Full analysis capabilities | Basic onboard calculations |
| **Auto-export** | Possible (version-dependent) | Not available — manual USB export required |
| **Recommended for OpenELIS?** | ✅ Yes — preferred | 🟡 Acceptable as fallback |

> **Recommendation:** Use SkanIt on a connected PC whenever possible. The standalone USB export should only be used when a PC is not available or not functioning. The SkanIt export is more complete, more configurable, and easier to enter sample IDs.

---

## References

- Multiskan FC User Manual, Cat. No. N07710, Rev. 2.4 — Thermo Scientific
- [SkanIt Software for Microplate Readers — Thermo Fisher](https://www.thermofisher.com/us/en/home/life-science/lab-equipment/microplate-instruments/plate-readers/software.html)
- [SkanIt 6.1 User Manual (PDF)](https://documents.thermofisher.com/TFS-Assets/LPD/manuals/SkanIt_6.1_UserManual_EN.pdf)
- [Multiskan FC Specifications (PDF)](https://assets.fishersci.com/TFS-Assets/BID/Reference-Materials/thermo-scientific-multiskan-fc-microplate-photometer-specifications.pdf)
- Real SkanIt export file from Madagascar site (validated January–February 2026): Dual plate-grid format with Absorbance grid and Échantillon (Sample ID) grid
- Related: `thermo-multiskan-fc-analyzer-connection-spec.md` (Integration Spec v2.0)
