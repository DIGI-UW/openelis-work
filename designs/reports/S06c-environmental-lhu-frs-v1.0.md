# Environmental LHU — Feature Requirements Spec
## Laporan Hasil Uji Lingkungan (Environmental Test Result Report)

**Version:** 1.0  
**Date:** 2026-04-28  
**Status:** Design Review  
**Scope:** OpenELIS Global, Carbon React printable PDF report for environmental samples  
**Related specs:** S-06 Laporan Hasil (base compliance report)

---

## Table of Contents

1. Overview & Scope
2. User Stories / JTBD
3. Inheritance Map from S06
4. Data Model Touchpoints
5. Layout Specification
6. Result Table Column Spec
7. Sample Matrix Variants
8. Baku Mutu Reference Handling
9. KAN Accreditation Handling
10. Multi-Matrix Bundling
11. Edge Cases & Special Values
12. Print/Export Requirements
13. Acceptance Criteria
14. Open Questions
15. References
16. i18n Keys (MessageResources additions)

---

## 1. Overview & Scope

### 1.1 What is the Environmental LHU?

The Environmental Laporan Hasil Uji (LHU) is a formal, printable PDF report issued by Indonesian public health laboratories (Labkesmas/BBLKM) for environmental samples tested against regulatory standards. It documents:

- **Sample matrices:** Water (air minum, air limbah), Food (makanan), Ambient Air (udara ruang), Surface Swabs (usap), Physical Conditions (pencahayaan, kebisingan, kelembaban)
- **Parameters:** Chemistry, microbiology, physical properties — varies by matrix
- **Regulatory basis:** Permenkes RI No. 02 Tahun 2023, Permenkes RI No. 68/2016 (Environment Ministry), SNI standards per parameter

### 1.2 Inheritance from S-06

This feature **extends** the S-06 Laporan Hasil (compliance report) base:
- Reuses lab letterhead block (lab name, address, accreditation logo, QR code)
- Reuses report number generation & numbering scheme
- Reuses signature/verification block (analyst + validator e-signatures)
- Reuses page footer ("Halaman X dari Y")
- Reuses Baku Mutu comparison and compliance evaluation logic

**Unique to Environmental LHU:**
- Per-parameter KAN accreditation flags (asterisk in Keterangan column, optional "/R" suffix in report number)
- Multi-sample-matrix bundling (single report can consolidate water + food + air in separate sub-tables)
- Flexible result table columns to accommodate diverse parameter types (descriptive vs. numeric, range thresholds, LOD markers)
- Dynamic Baku Mutu thresholds based on sample matrix and regulatory authority (SNI vs. Permenkes vs. Permen LHK)

### 1.3 Scope In

- Single unified Environmental LHU layout template that flexes via `sample_matrix` field
- Per-parameter KAN accreditation flag rendering
- Result table with columns: No. | Parameter | Hasil Uji | Baku Mutu | Satuan | Metode | Keterangan
- Multi-matrix bundling (e.g., water + food + air in one report)
- Edge case handling (below LOD, holding time exceeded, parameter not tested)
- Carbon React mockup with real crosswalk data
- HTML preview showing printable A4 layout

### 1.4 Scope Out

- **No** custom template editor UI (fixed layout for v1)
- **No** inline PDF preview in browser (user downloads and opens externally)
- **No** email/distribution workflow (future v2)
- **No** historical report regeneration tracking (S-06 handles audit trail)

---

## 2. User Stories / JTBD

### 2.1 Lab Analyst

**JTBD:** "I need to print a formal environmental test result report to send to the customer and for our compliance file."

- After results are validated and released, I click "Generate PDF" on the order
- The report is assembled from my validated results, pulls header/footer from lab config, applies current accreditation status
- I download the PDF, print it, and deliver to customer

### 2.2 KAN Auditor

**JTBD:** "I need to verify that accredited parameters are correctly marked and the report reflects our scope of accreditation."

- I review printed reports from the lab
- I see asterisks (*) on parameters that are within KAN scope
- I see optional "/R" suffix in report number confirming accreditation
- I can trace the accreditation flag to the lab's accreditation registry

### 2.3 Lab Customer / Regulator

**JTBD:** "I need a clear, official statement of test results and their regulatory compliance status."

- I receive the printed LHU report
- I see clear parameter results, regulatory thresholds (Baku Mutu), and a conclusion statement in Indonesian + English
- I can file this with regulators as proof of compliance or non-compliance

---

## 2.5 Configuration System Inheritance

The Environmental LHU reuses the **patient-report-redesign configuration surface**—it does **not** introduce parallel keys. Specifically, it inherits these JRXML parameters:

- **`headerName`** (String) — subreport selector (default `GeneralHeader.jasper`). Controls which header template is rendered in the page header band (3-column grid: left logo / facility-meta / right logo).
- **`accreditationImage`** (InputStream, PNG/JPEG) — accreditation logo image passed to both header and sign-off bands.
- **`accreditationNumber`** (String) — accreditation registry number (e.g., "KAN LP-042-IDN").
- **`accreditationLogoPosition`** (String enum `TOP` | `BOTTOM`, default `BOTTOM`) — controls whether the accreditation logo appears in the page header (top slot) or the sign-off footer (bottom slot, default).

These parameters are configured globally in **Admin → General Configuration → Printed Reports Configuration** (see patient-report-redesign-spec §15 + addendum r5 §15.6). The same admin page surfaces control the Environmental LHU's layout, ensuring deployments can standardize header/accreditation presentation across patient reports and environmental LHUs without template-level changes.

**Indonesian Labkesmas deployment note:** The typical configuration for Labkesmas will be `accreditationLogoPosition = BOTTOM` (default) to match real print conventions — the KAN logo prints near the validator signature in the sign-off block, aligning with regulator expectations. The top variant is supported but not the default expectation.

---

## 3. Inheritance Map from S-06

| Section | Status | Notes |
|---|---|---|
| Lab Letterhead Block (logo, name, address) | Inherited from patient-report spec §7.1 / §7.1b | 3-column grid header band via `$P{headerName}` subreport, same parameters |
| Report Number & Date | Modified | Optional "/R" suffix if KAN-accredited; same numbering scheme |
| Customer/Yth Block | Inherited as-is | Same format as S-06 |
| Dates Timeline (Tanggal Penerimaan, Pengujian) | Inherited as-is | Same fields |
| Sample Info Block | Modified | Adds field for sample matrix type (Water/Food/Air/Swab/Physical) |
| Result Table | New | Custom columns for environmental parameters; multi-matrix flex |
| Baku Mutu Citation Block | New | Cites Permenkes/SNI per parameter, separate section above conclusion |
| Compliance Conclusion | Modified | Must handle per-parameter KAN flags in the text |
| Accreditation logo slot (top + bottom) | Inherited from patient-report spec §7.1b / §7.7a | Position-configurable via `$P{accreditationLogoPosition}` parameter |
| Admin config for printed-report layout | Inherited from patient-report spec §15.6 | Same `Admin → General Configuration → Printed Reports Configuration` page controls header + accreditation placement |
| Verification + Validation Block | Inherited as-is | Same e-signature structure as S-06 |
| Page Footer (Halaman X dari Y) | Inherited from patient-report spec §7.8 | Same format |

---

## 4. Data Model Touchpoints

### 4.1 Which Entities Feed the Report

| Field/Section | OpenELIS Entity | Notes |
|---|---|---|
| Lab name, address, accreditation | `site_information` table (Report Config) | From S-06 |
| Report number, date | CertificateNumberSequence (S-06) | Optional "/R" suffix if accredited |
| Customer name, address | Order → ComplianceContext → customer | Reused from S-06 |
| Sample collection date, location, method | Order → ComplianceContext (sample_matrix, collectionDateTime, samplingLocation, samplingMethod) | sample_matrix is NEW field: enum Water / Food / Air / Swab / Physical |
| Sample receipt date | Order → receivedDate | Inherited |
| Parameters & results | Result → value, unit | Inherited |
| Baku Mutu (regulatory threshold) | ComplianceThreshold → thresholdValue, thresholdType (RANGE / MIN / MAX / EXACT), regulatory_source (SNI / Permenkes / Permen LHK) | NEW fields: regulatory_source, parameter_kan_accredited (boolean) |
| Compliance status | ComplianceEvaluation → status (PASS / MARGINAL / FAIL) | Inherited |
| KAN accreditation per parameter | ComplianceThreshold → parameter_kan_accredited | NEW boolean field |
| Analyst name, signature | electronic_signature → (signature_meaning = "Authored") | Inherited from S-06 |
| Validator name, signature | electronic_signature → (signature_meaning = "Validated and Released") | Inherited from S-06 |

### 4.2 New Fields Required

**ComplianceThreshold** (extend):
- `regulatory_source` : ENUM {SNI, PERMENKES, PERMEN_LHK, IN_HOUSE, OTHER}  
- `parameter_kan_accredited` : BOOLEAN (default false)

**Sample / Order** (extend):
- `sample_matrix` : ENUM {WATER_DRINKING, WATER_WASTEWATER, WATER_AMBIENT, FOOD, AIR, SURFACE_SWAB, PHYSICAL_CONDITIONS} (on Order or ComplianceContext)

---

## 5. Layout Specification

### 5.1 Page Header Band

**Header band**: See patient-report-redesign-spec §7.1 (configurable subreport `$P{headerName}`, 3-column grid: left logo / facility-meta / right logo). The LHU passes the same parameters (`headerName`, `accreditationImage`, `accreditationNumber`, `accreditationLogoPosition`); no LHU-specific markup.

**Top accreditation logo** (optional): See patient-report-redesign-addendum §7.1b. When `printedReport.accreditationLogoPosition = TOP`, the accreditation image + number render in a 4th column slot between the left header logo and center facility-meta block (coordinates `85 5 70 40` in JRXML). Activated by the parameter; suppresses bottom variant.

**Bottom accreditation logo** (default): See patient-report-redesign-addendum §7.7a. When `printedReport.accreditationLogoPosition = BOTTOM` or null (default), the accreditation image + number render floated right in the sign-off frame (coordinates `472 2 70 40`). Suppresses top variant.

---

### 5.2 Page Structure (A4 Portrait, ~794×1123 px)

```
┌─ Header Block (60–80 mm) — inherited patient-report §7.1 ─┐
│ [Lab Logo]  [KAN Logo if TOP]  [Facility Name/Meta]  ... │
├──────────────────────────────────────────────────────────┤
│ LAPORAN HASIL UJI / TEST RESULT REPORT                │
│ No. [LHU-YYYY-NNNN or LHU-YYYY-NNNN/R]                │
│ Tanggal Penerbitan: [Date]                            │
├──────────────────────────────────────────────────────┤
│ Yth. [Customer Name/Organization]                     │
│ [Address Line 1]                                       │
│ [Address Line 2]                                       │
├──────────────────────────────────────────────────────┤
│ INFORMASI SAMPEL / SAMPLE INFORMATION                 │
│ No. Contoh Uji: [sample ID]                           │
│ Jenis Contoh: [Water / Food / Air / etc.]             │
│ Asal Contoh Uji: [location]                           │
│ Pengambil Contoh: [collector name]                    │
│ Lokasi Pengambilan: [GPS or description]              │
│ Tanggal diambil/diterima: [date] / [date]             │
│ Tanggal Pengujian: [start date] to [end date]         │
│ Metode Pengambilan: [method code]                     │
├──────────────────────────────────────────────────────┤
│ HASIL PENGUJIAN / TEST RESULTS                        │
│ (See § 5.3 for table structure)                       │
├──────────────────────────────────────────────────────┤
│ BAKU MUTU / REGULATORY STANDARDS                      │
│ Peraturan Menteri Kesehatan RI No. 02 Tahun 2023      │
│ Standar Nasional Indonesia (SNI) [specific versions]  │
├──────────────────────────────────────────────────────┤
│ KESIMPULAN / CONCLUSION                               │
│ [Bilingual statement of compliance]                   │
├──────────────────────────────────────────────────────┤
│ TANDA TANGAN / SIGNATURES                             │
│ Diuji oleh / Tested by:   Disahkan oleh / Approved:   │
│ [Name]                    [Name]                       │
│ [Title]                   [Title]                      │
│ [Timestamp]               [Timestamp]                  │
├──────────────────────────────────────────────────────┤
│ Ditandatangani secara elektronik / Electronically...  │
│ [Footer text from config]                             │
│ Halaman [X] dari [Y]                                  │
└──────────────────────────────────────────────────────┘
```

### 5.2 Page Break Rules

- Results table for each matrix (Water, Food, Air) breaks to a new page if it would exceed ~70% of available space
- If multiple matrices bundled (e.g., KL.457 SPPG Mampang), each gets a sub-heading and its own table
- Signature block always appears on final page
- Page numbering: "Halaman 1 dari 2" (only update Y when all matrices fit or are split)

---

## 6. Result Table Column Spec

### 6.1 Columns

**Paper-conservation note (round 2):** the wide `Metode` column is removed from the result table itself and consolidated into a compact "Methods + Accreditation Coverage" footnote below the table (§6.4). This frees ~20% of table width on every report — material savings on multi-page LHUs. Methods are still cited per-test, just in prose form. The `Akr.` (accreditation) column is reduced to a single-character flag (`*` or blank); the body that issued the accreditation (KAN ISO/IEC 17025, scope number) is named once in the footnote.

| Column | Type | Width | Notes |
|---|---|---|---|
| No. | Integer | 6% | Sequential 1, 2, 3, ... |
| Parameter | Text | 24% | Test name in Indonesian (e.g., "pH", "E. coli", "BOD5"). Parameter name shows trailing `*` when within accredited scope (matches real Labkesmas convention). |
| Hasil Uji | Text/Numeric | 16% | Result value or descriptive (e.g., "7.2", "Tidak berbau", "<0.001") |
| Baku Mutu | Text | 16% | Regulatory threshold (e.g., "≤8.0", "6.5–8.5", "Tidak berbau", "Negative") |
| Satuan | Text | 12% | Unit (e.g., "pH", "mg/L", "CFU/100mL", "—" for descriptive) |
| Ket. | Text | 26% | Status icon (✓ pass / ⚠ marginal / ✗ fail) plus optional flags (#, <, –). KAN accreditation lives in the footnote, not this column. |

### 6.2 Example Data (PT. Unggulrejo Wasono Wastewater)

| No. | Parameter | Hasil Uji | Baku Mutu | Satuan | Ket. |
|---|---|---|---|---|---|
| 1 | BOD5 * | 11.2 | 60 | mg/L | ✓ |
| 2 | COD * | 21.5 | 150 | mg/L | ✓ |
| 3 | Fenol Total | <0.0033 | 0.5 | mg/L | ✓ |
| 4 | Amonia Total (NH3 sebagai N) * | 0.255 | 8.0 | mg/L | ✓ |
| 5 | pH * | 6.7 | 6.0–9.0 | — | ✓ |
| 6 | TSS | 14 | 50 | mg/L | ✓ |
| 7 | Krom Total (Cr) * | <0.0095 | 1 | mg/L | ✓ |

Below the table, the compact footnote renders (§6.4):

> **Metode / Methods.** BOD5: SNI 6989.72-2009; COD: SNI 6989.2-2019; Fenol Total: SNI 06-6989.21-2004; Amonia Total: SNI 06-6989.30-2005; pH: SNI 6989.11-2019; TSS: In House Method; Krom Total: SNI 6989.84-2019.
>
> **Akreditasi / Accreditation coverage.** Tests marked `*` are within the lab's accreditation scope: **KAN ISO/IEC 17025 — LP-042-IDN** covers BOD5, COD, Amonia Total, pH, Krom Total (5 of 7 tests). Fenol Total and TSS are not within the accredited scope.
>
> **Baku Mutu / Regulatory reference.** Peraturan Menteri Lingkungan Hidup dan Kehutanan RI No. 68 Tahun 2016 tentang Baku Mutu Air Limbah.

### 6.3 Ket. Column + Parameter-Asterisk Flag Legend

| Flag | Where it lives | Meaning |
|---|---|---|
| `*` (after parameter name) | Parameter cell | Parameter is within KAN accreditation scope (real-Labkesmas convention). Body + scope number cited in §6.4 footnote. |
| `✓` | Ket. cell | Result meets Baku Mutu (pass) |
| `⚠` | Ket. cell | Result is within range but approaching threshold (marginal) |
| `✗` | Ket. cell | Result fails Baku Mutu |
| `#` | Ket. cell (suffix) | Pemeriksaan telah melampaui holding time |
| `<` | Hasil Uji cell (prefix) | Below limit of detection (e.g., "<0.001") |
| `–` | Hasil Uji cell | Parameter listed in the order but not actually tested |
| `/R` | Report number suffix | Entire report is KAN-accredited (e.g., "LHU-2026-0042/R") |

### 6.4 Methods + Accreditation Coverage Footnote (replaces wide Metode column)

A compact three-line footnote renders immediately below each result table (or once per report when multiple tables are present):

1. **Metode / Methods.** Inline list of `Parameter: method-code` pairs separated by semicolons. Generated from each result row's `analysis.method.code`. No wide column needed.
2. **Akreditasi / Accreditation coverage.** Names the accrediting body and scope number (e.g., "KAN ISO/IEC 17025 — LP-042-IDN") and lists which tests fall within scope. When tests on the same report are accredited by different bodies, render one line per body — mirrors patient-report-redesign-spec §7.6c "Accreditation coverage" pattern. Body sourced from the Test Accreditation epic (Sub-4) when wired, or from a single deployment-level config until then.
3. **Baku Mutu / Regulatory reference.** The regulation cited as the threshold source (Permenkes / Permen LHK / SNI). One line, dedup'd.

**Why this footnote instead of a Metode column.** The Metode column on real Labkesmas LHUs averages ~20% of table width — wide enough to force two-line wrapping on 7-column tables. Moving methods to a per-test inline list in a single footnote line saves the column without losing the per-test traceability. The accreditation coverage line also satisfies ISO 15189 §7.4.1.6(a) — the report identifies *which* tests fall within the accredited scope, by name, with body + scope number — mirroring the patient-report's own §7.6c block.

**Inheritance.** The footnote layout, body-grouping rules, and i18n keys mirror patient-report-redesign-addendum §4 (`accreditedTestsByBody` populator). The LHU populator passes the same data structure; the JRXML wiring is parallel. No new keys.

### 6.4 Result Value Formatting

| Type | Format | Example |
|---|---|---|
| Numeric | Decimal with unit | 7.2 pH, 11.2 mg/L, 0.008 mg/L |
| Below LOD | <X notation | <0.001 mg/L |
| Range | Min–Max | 6.5–8.5 (for pH range threshold) |
| Descriptive | Plain text | Tidak berbau (No odor), Negatif (Negative), Tidak ada kuman (No germs) |
| Not tested | Dash | – |

---

## 7. Sample Matrix Variants

### 7.1 Matrix Types & Parameter Groups

| Matrix | Sample Type | Parameter Groups | Example Standards |
|---|---|---|---|
| **Water (Drinking)** | Air Minum | Physical, Chemical (inorganic, organic), Microbiological | PP No. 22/2021, Permenkes 02/2023 |
| **Water (Wastewater)** | Air Limbah | Physical, Chemical, Microbiological, Nutrient | Permen LHK 68/2016 |
| **Water (Ambient)** | Air Permukaan | Physical, Chemical, Microbiological | PP No. 22/2021 for surface water |
| **Food** | Makanan | Microbiological, Chemical (heavy metals, additives), Pathogenic | SNI food safety, Permenkes additives |
| **Ambient Air** | Udara Ruang | Microbiological (CFU, species), Physical (lighting, noise, humidity, CO2) | SNI 9099:2024, Permenkes 02/2023 |
| **Surface Swab** | Usap Permukaan | Microbiological count + species ID | SNI standards, healthcare facility norms |
| **Physical Conditions** | Kondisi Fisik | Pencahayaan, Kebisingan, Kelembaban, Suhu | Permenkes 02/2023 for facilities |

### 7.2 What Changes Per Matrix

| Aspect | Varies? | How |
|---|---|---|
| Report number | No | Same format for all matrices |
| Lab letterhead | No | Same for all |
| Sample info block | Yes | "Jenis Contoh" field shows matrix type |
| Result table | **Yes** | Different parameter list, different units, different Baku Mutu per matrix |
| Regulatory citation block | **Yes** | Different standards cited per matrix (PP/Permenkes/SNI/Permen LHK) |
| Conclusion text | **Yes** | References the specific matrix-relevant standard |
| Multi-matrix bundling | **Yes** | Each matrix gets its own sub-heading and result table in same report |

### 7.3 Multi-Matrix Bundling Example

**KL.457 SPPG Mampang Depok (real example from crosswalk):**

```
Report No. KL.457 / [date]

LAPORAN HASIL PENGUJIAN KUALITAS LINGKUNGAN DAN MAKANAN
Report of Environmental & Food Quality Testing

═══════════════════════════════════════════════════════════

AIR MINUM (DRINKING WATER)
Jenis Contoh: Air Minum
Asal: SPPG facility, Kitchen supply

[Result table: 8 parameters — pH, turbidity, bacteria, etc.]

═══════════════════════════════════════════════════════════

MAKANAN (FOOD)
Jenis Contoh: Makanan siap saji
Asal: Kitchen, SPPG facility

[Result table: 4 parameters — microbial count, heavy metals, etc.]

═══════════════════════════════════════════════════════════

USAP PERMUKAAN (SURFACE SWABS)
Jenis Contoh: Usap dinding, lantai
Asal: Kitchen surfaces

[Result table: Bacterial count, species ID]

═══════════════════════════════════════════════════════════

[Single Regulatory Standards section citing all 3 standards]
[Single Conclusion: overall compliance statement for all 3 matrices]
[Single Signature block]

Halaman 1 dari 2
```

---

## 8. Baku Mutu Reference Handling

### 8.1 Regulatory Authority by Standard

| Standard | Authority | Examples | When Used |
|---|---|---|---|
| **PP No. 22/2021** | Presiden RI (Presidential Decree) | Drinking water, surface water quality | Water samples |
| **Permenkes RI No. 02/2023** | Ministry of Health | Environmental health facilities (lighting, noise, microbio air) | Air, facility conditions |
| **Permen LHK No. 68/2016** | Ministry of Environment & Forestry | Wastewater discharge limits | Wastewater matrices |
| **SNI 6989.XX-YYYY** | Badan Standardisasi Nasional | Specific test methods | Water chemistry, microbiology |
| **SNI 9099:2024** | BSN | Indoor air microbiology | Ambient air (CFU/m³) |
| **In House** | Lab-validated method | Lab's own SOP when no SNI exists | TSS (Hilda example), custom matrices |

### 8.2 Threshold Storage & Lookup

**In database:**
- `ComplianceThreshold` table should have:
  - `parameter_id` (FK to Test)
  - `thresholdValue` (numeric or range "6.5–8.5")
  - `thresholdType` : ENUM {EXACT, RANGE, MIN, MAX, DESCRIPTIVE}
  - `regulatory_source` : ENUM {SNI, PERMENKES, PERMEN_LHK, IN_HOUSE, OTHER}
  - `standard_name` : Text (e.g., "PP No. 22/2021 — Baku Mutu Air Permukaan")
  - `unit` : Text

**Rendering:**
- When building result table, for each parameter:
  1. Look up `ComplianceThreshold` matching the order's `standard` + `parameter`
  2. Render `thresholdValue` in "Baku Mutu" column
  3. Cite `regulatory_source` + `standard_name` in "Baku Mutu Citation Block" (deduplicated per report)

### 8.3 Edge Case: Multiple Thresholds Per Parameter

**Scenario:** Different regulatory authorities set different limits for same parameter (e.g., drinking water vs. wastewater Pb limit).

**Resolution:**
- Store separate `ComplianceThreshold` rows per (parameter, standard) pair
- At report generation, filter to the standard selected for the order (from `ComplianceContext.standardName`)
- Render only the threshold for that standard

---

## 9. KAN Accreditation Handling

### 9.1 Per-Parameter Flag

**Storage:**
- `ComplianceThreshold.parameter_kan_accredited` : BOOLEAN
- Set to `true` for parameters within lab's KAN scope

**Rendering:**
- If `parameter_kan_accredited = true`:
  - Add asterisk (*) at end of parameter name in result table
  - In Keterangan column, also show "*"
  - Example: "BOD5 *" in Parameter column, "*" in Keterangan

### 9.2 Report-Level "/R" Suffix

**Logic:**
- If **ALL** parameters on the order have `parameter_kan_accredited = true`, append "/R" to report number
- Example:
  - All 7 parameters accredited: "LHU-2026-0042/R"
  - Some parameters not accredited: "LHU-2026-0042" (no suffix)

**Rendering:**
- In report title block, show: "No. LHU-2026-0042/R" if fully accredited
- In audit trail & certificate number storage, preserve the "/R" suffix

### 9.3 Accreditation Logo

- If order is fully accredited ("/R" suffix), render KAN logo in header (top-right, same as S-06)
- If partially accredited or not accredited, suppress KAN logo but keep asterisks on individual parameters

---

## 10. Multi-Matrix Bundling Rules

### 10.1 When to Bundle

**Single Report Contains Multiple Matrices When:**
- One order contains samples from multiple matrices (water + food + air, as in KL.457)
- Order status is "Released" for all results across all matrices
- User explicitly selects "bundle" mode (or bundling is default if order has ComplianceContext items for multiple matrices)

### 10.2 Report Assembly

1. **Header block** — once for the entire report
2. **Customer block** — once
3. **For each matrix in the order:**
   - **Matrix heading** (e.g., "AIR MINUM / DRINKING WATER")
   - **Sample info block** — Jenis Contoh shows the specific matrix type
   - **Result table** — only parameters for that matrix
   - **Blank line**
4. **Unified "Baku Mutu / Regulatory Standards" section** — list all standards cited across all matrices
5. **Unified "Kesimpulan / Conclusion"** — overall compliance statement for all matrices combined
6. **Signature block** — once
7. **Page numbering** — "Halaman 1 dari 2" or "Halaman 2 dari 2" as appropriate

### 10.3 Certificate Number Assignment

- **One certificate number per order**, regardless of matrix count
- Example: "LHU-2026-0042" for an order with water + food + air bundled
- Sequential numbering is per calendar year (inherited from S-06)

---

## 11. Edge Cases & Special Values

### 11.1 Parameter Not Tested

**Symptom:** Parameter appears in the test catalog but was not ordered or result was not entered.

**Display:**
```
| 3 | Amonia | – | 8.0 mg/L | mg/L | SNI 06-6989.30-2005 | — Tidak diperiksa |
```

**Rule:** Show "–" in Hasil Uji and Keterangan columns; do NOT include in compliance conclusion count.

### 11.2 Holding Time Exceeded

**Symptom:** Result was entered after the maximum holding time for that parameter.

**Display:**
```
| 5 | BOD5 | 68 | 60 mg/L | mg/L | SNI 6989.72-2009 | #* |
```

**Rule:** Add "#" flag in Keterangan column. Mark as non-compliant (FAIL) in status, OR show "⚠" (pending validator override).

**Footnote at bottom of table:**
```
# Hasil pengujian melampaui holding time maksimum. Hasil mungkin tidak akurat.
# Test results exceed maximum holding time. Results may not be accurate.
```

### 11.3 Below Limit of Detection (LOD)

**Symptom:** Result is below the lab's method's minimum detectable concentration.

**Display:**
```
| 4 | Fenol Total | <0.0033 | 0.5 mg/L | mg/L | SNI 06-6989.21-2004 | Batas deteksi |
```

**Rule:**
- Store result value as "<X" (e.g., `<0.0033`)
- Render with "< " prefix in Hasil Uji column
- In Keterangan: "Batas deteksi" (below detection limit) or omit if obvious from notation
- Treat as PASS if threshold is also "negative" or "non-detect"

### 11.4 Range Threshold (e.g., pH)

**Symptom:** Regulatory threshold is a range (min–max) not a single limit.

**Display:**
```
| 2 | pH | 7.2 | 6.5–8.5 | — | SNI 6989.11-2019 | ✓ |
```

**Rule:**
- Store threshold as "6.5–8.5" in database
- Render as "6.5–8.5" in Baku Mutu column
- Compliance logic: PASS if 6.5 ≤ result ≤ 8.5; FAIL otherwise

### 11.5 Descriptive Result (e.g., Odor, Color)

**Symptom:** Test result is qualitative (Tidak berbau, Warna pucat, Jernih) not numeric.

**Display:**
```
| 1 | Bau | Tidak berbau | Tidak berbau | — | Organoleptik | ✓ |
```

**Rule:**
- Result value is text string (from controlled vocabulary)
- Threshold (Baku Mutu) is also text
- Compliance: exact string match (case-sensitive in ID) = PASS, otherwise FAIL
- Satuan column shows "—" (not applicable)
- No numeric comparisons

### 11.6 Result Override

**Symptom:** Lab manager overrode automatic compliance evaluation (per S-05).

**Display:**
```
| 7 | Lead (Pb) | 0.032 | ≤0.03 mg/L | mg/L | SNI 6989.84-2019 | ✗* |
```

**Footnote at bottom of table:**
```
* Status overridden by Dr. Bambang Sutrisno on 2026-04-04 16:45. 
  Justification: Equipment malfunction; result repeats at 0.028 mg/L.
```

**Rule:**
- Include override reason + timestamp in footnote
- Show the override status (not auto-evaluation) in Keterangan column
- Still render "✗" symbol for FAIL status

---

## 12. Print/Export Requirements

### 12.1 PDF Output

- **Format:** A4 Portrait (210×297 mm ≈ 794×1123 px at 96 dpi)
- **Page margins:** 20 mm (top/bottom), 15 mm (left/right)
- **Font:** IBM Plex Sans (inherited from Carbon)
- **Font sizes:**
  - Header: 18–22 pt (lab name)
  - Section headings: 12–14 pt bold
  - Body text, table: 10–11 pt
  - Footnotes: 9 pt
- **Line height:** 1.4 × font size (readable on print)
- **Colors:** Use Carbon tokens but ensure print-safe (dark text on white, avoid light grays that may not print)

### 12.2 Page Breaks

- **Hard page break** after result table for each matrix (if multi-matrix)
- **Soft page break:** Conclusion + Signature blocks should fit on same page; if not, move to next page
- **Orphan/widow:** Avoid isolated section headings or single table row at page bottom

### 12.3 Print Preview & Scaling

- When user clicks "Generate PDF":
  1. Render component to A4-sized canvas
  2. Apply `@media print { ... }` CSS for page breaks and hiding UI chrome
  3. Generate PDF server-side (via headless browser or TCPDF-style lib)
  4. Initiate browser download with filename: `LHU-{certificateNumber}_{siteCode}_{labNumber}.pdf`

### 12.4 Digital vs. Print Distinction

| Aspect | Screen Preview | Printed PDF |
|---|---|---|
| Background | Light gray | White |
| Borders/shadows | Visible | Subtle or none |
| Page numbers | Visible | "Halaman X dari Y" footer |
| E-signature placeholder | "Digital signature applied" text | Minimal placeholder (can be stamped if hardcopy signed) |
| QR code (if present) | Yes | Yes (printable) |

---

## 13. Acceptance Criteria

### Functional

- [ ] Report renders correctly for single-matrix orders (Water, Food, Air, Swab, Physical)
- [ ] Multi-matrix bundling works: one report contains water + food + air sub-tables with unified conclusion
- [ ] KAN accreditation flags appear as asterisk (*) on accredited parameters in Keterangan column
- [ ] Report number appends "/R" suffix if ALL parameters are KAN-accredited
- [ ] Baku Mutu citation block lists all unique standards (PP/Permenkes/SNI/Permen LHK) per report
- [ ] Result table renders correctly with proper column widths and text wrapping
- [ ] Edge case values display correctly: "–" for not tested, "<X" for below LOD, "6.5–8.5" for ranges, text for descriptive
- [ ] Compliance conclusion is bilingual (Indonesian primary, English secondary)
- [ ] PDF file downloads with correct naming: `LHU-{certificateNumber}_{siteCode}_{labNumber}.pdf`
- [ ] Page numbering shows "Halaman X dari Y" in footer
- [ ] E-signature block shows analyst + validator names/timestamps from database

### Configuration & Accreditation Logo Position

- [ ] **AC20**: When `accreditationLogoPosition = BOTTOM` (default), the LHU's sign-off block renders the accreditation image + number floated right; the top header slot suppresses. Behavior is identical to patient-report-redesign pattern.
- [ ] **AC21**: When `accreditationLogoPosition = TOP`, the LHU's header band expands to 4 columns (left logo / accreditation logo / center facility-meta / right logo), and the accreditation image + number render between the left logo and center meta block; the bottom sign-off slot suppresses.
- [ ] **AC22**: The LHU does not introduce new keys to the `printedReport.*` config namespace. It reuses `accreditationLogoPosition`, `accreditationImage`, `accreditationNumber`, and `headerName` from the patient-report-redesign admin configuration page.

### Data Quality

- [ ] All parameter values, units, and Baku Mutu pulled from Order + ComplianceThreshold entities
- [ ] KAN accreditation flag correctly reflects `ComplianceThreshold.parameter_kan_accredited` boolean
- [ ] Regulatory source (SNI/Permenkes/Permen LHK) matches `ComplianceThreshold.regulatory_source`
- [ ] No hardcoded data in template; all values from database

### Layout & Design

- [ ] A4 portrait layout: margins 20/15 mm, fonts readable on print (≥10 pt body)
- [ ] Header block includes lab name, address, accreditation number + logo (if accredited)
- [ ] Sample info block clearly shows Jenis Contoh (matrix type)
- [ ] Result table uses Carbon design tokens (gray100 text, gray20 borders)
- [ ] Compliance symbols render: ✓ (pass), ⚠ (marginal), ✗ (fail)
- [ ] All section headings bilingual (Indonesian / English subtitle in smaller text)

### Localization

- [ ] All visible strings use i18n keys (no hardcoded English/Indonesian)
- [ ] Field labels in Indonesian, with English in parentheses or below where helpful
- [ ] Regulatory authority names, parameter names unchanged (preserve as-is in database)

### Print/Export

- [ ] PDF generated server-side and downloads cleanly
- [ ] Multi-page reports have correct page break behavior
- [ ] @media print CSS hides UI chrome, shows pagination footer
- [ ] QR code (if present) is scannable in printed PDF

---

## 14. Open Questions

1. **Holding time enforcement:** Should we block report generation if any result exceeded holding time, or just flag it with "#"?
2. **Result override UX:** Who initiates override — analyst or manager? Where is the override reason/timestamp captured in the form?
3. **Multi-year certificate numbering:** Should sequence reset Jan 1 each year, or use a global sequence? (S-06 handles this; confirm scope here.)
4. **QR code on report:** Should we render a QR code in the header that links to online result verification? (Future feature?)
5. **Customer billing:** Should the report include a "Estimated billing" or "Invoice" section? (Scoped out v1, but confirm.)
6. **Report retention:** How long are PDFs stored server-side? (Governed by audit trail, per S-06.)

---

## 15. References

### Source Documents (Read-Only)

- **lhu-crosswalk-raw.md** — Crosswalk of 10 real environmental LHUs, with detailed examples of PT. Unggulrejo Wasono (wastewater), RS Permata Depok (facility air + surface), and SPPG Mampang (multi-matrix water + food).
- **S06-laporan-hasil-compliance-report-frs-v1.0.md** — Base FRS for S-06 Laporan Hasil; Environmental LHU extends §5.3–5.4 (PDF structure, e-signature integration, audit trail).
- **S06-laporan-hasil-mockup.jsx** — Carbon React mockup for S-06; Environmental LHU mockup follows same component structure and styling conventions.
- **patient-report-redesign-spec.md** — Canonical patient report spec. Environmental LHU inherits header band (§7.1), accreditation logo placement logic (§7.1b / §7.7a), admin config surface (§15), and page footer (§7.8).
- **patient-report-redesign-addendum-r5.md** — Round 5 addendum clarifying accreditation-logo position config (§7.1b TOP variant, §7.7a BOTTOM default, §15.6 admin config). Environmental LHU reuses this parameter set.
- **S06c-environmental-lhu-preview.html** — HTML preview demonstrating configurable header + accreditation logo position toggle; reference for JSX mockup pattern.
- **openelis-style-guide-v2-patterns-inventory.md** — Carbon Design System tokens and table/form patterns used in OpenELIS Global.

### Regulatory Standards (Indonesian Public Health Labs)

- **Peraturan Menteri Kesehatan RI No. 02 Tahun 2023** — Environmental health facilities, drinking water, air quality, microbiological thresholds
- **Peraturan Presiden RI No. 22/2021** — Drinking water and surface water quality standards (Baku Mutu Air)
- **Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 68/2016** — Wastewater discharge quality limits (PERMEN LHK)
- **SNI 6989.XX series** — Indonesian National Standards for water parameter testing methods
- **SNI 9099:2024** — Microbiological testing of indoor air (CFU/m³, species identification)
- **KAN (Komite Akreditasi Nasional)** — Indonesian Accreditation Committee; ISO 17025 equivalence for laboratories

### Related OpenELIS Specs

- **S-01 (OGC-528):** Compliance Standards Administration — compliance standard definitions, versions, regulatory references
- **S-02 (OGC-531):** Sampling Site Registry — site names, GPS coordinates, sampling location metadata
- **S-03 (OGC-537):** Environmental Order Entry — ComplianceContext entity, order creation wizard, sample matrix selection
- **S-05 (OGC-547):** Compliance Evaluation Engine — ComplianceEvaluation records, threshold lookup, override logic
- **S-06 (OGC-552):** Laporan Hasil (base report) — certificate numbering, e-signature integration, audit trail, shared print config
- **E-Signature Spec:** electronic_signature table schema, signature meanings (Authored, Validated & Released)

---

**Document Status:** Ready for design review and component development.  
**Next Steps:** Review FRS with stakeholders, approve data model changes, begin React mockup + HTML preview development.

---

## 16. i18n Keys (MessageResources additions)

All English text in the Environmental LHU is keyed for translation via OpenELIS MessageResources. Keys follow the camelCase convention established in patient-report-redesign-spec §8. When wiring the JRXML or Carbon React report template, devs will use these keys to localize the UI.

### Reused from patient-report-spec §8

The following keys are already defined in `MessageResources_*.properties` and reused without change:

| Key | EN |
|---|---|
| `outcome` | Result |
| `method` | Method |
| `unit` | Unit |
| `note` | Note |
| `accreditedBy` | Accredited by |
| `test` | Test |
| `date` | Date |
| `status` | Status |
| `accreditationCoverage` | Accreditation coverage (from addendum r5 §8) |
| `about` | Page X of Y suffix |

### New keys to add to MessageResources_*.properties

These keys are specific to the Environmental LHU and do not exist in the patient-report spec. Add to all language bundles (minimum: English, Bahasa Indonesia, French).

| Key | EN | ID (Bahasa Indonesia) |
|---|---|---|
| `testResultReportTitle` | Test Result Report | LAPORAN HASIL UJI |
| `sampleNo` | Sample No. | No. Contoh Uji |
| `sampleType` | Sample Type | Jenis Contoh |
| `sampleOrigin` | Sample Origin | Asal Contoh Uji |
| `samplingLocation` | Sampling Location | Lokasi Pengambilan |
| `samplingMethod` | Sampling Method | Metode Pengambilan |
| `collectedDate` | Collected Date | Tanggal diambil |
| `receivedDate` | Received Date | Tanggal diterima |
| `testDate` | Test Date | Tanggal Pengujian |
| `sampleInformation` | Sample Information | Informasi Sampel |
| `testResults` | Test Results | Hasil Pengujian |
| `regulatoryLimit` | Limit / Threshold | Baku Mutu |
| `maxLimit` | Maximum Limit | Kadar Maksimum |
| `complianceConclusion` | Conclusion | Kesimpulan |
| `testedBy` | Tested by | Diuji oleh |
| `approvedBy` | Approved by | Disahkan oleh |
| `verifiedBy` | Verified by | Telah diverifikasi oleh |
| `validatedBy` | Validated by | Telah divalidasi oleh |
| `regulatoryReference` | Regulatory reference | Peraturan / Standar |

---

## Appendix A — Indonesian Terms Glossary

For non-Indonesian reviewers and developers. The canonical LHU is rendered Indonesian-primary to match real Labkesmas (BBLKM) practice; this glossary is a one-page reference for terms appearing in field labels, table columns, and signature blocks. The annotated sibling preview (`*-preview-annotated.html`) shows these terms inline as bilingual column headers and `title` tooltips — but production output stays Indonesian-only.

| Bahasa Indonesia | English / Meaning |
|---|---|
| Akreditasi | Accreditation |
| Asal Contoh Uji | Sample origin / source |
| Baku Mutu | Quality standard / regulatory threshold |
| Diuji oleh | Tested by |
| Disahkan oleh | Approved by |
| Halaman X dari Y | Page X of Y |
| Hasil Pemeriksaan / Hasil Uji | Test result |
| Indetermin | Indeterminate (PCR result) |
| Kadar Maksimum | Maximum permitted level |
| KAN | Komite Akreditasi Nasional — Indonesian National Accreditation Committee |
| Kepadatan Koleksi | Collection density (organisms/trap/day) |
| Kepala Instalasi | Department / unit head |
| Kepercayaan Tinggi | High confidence |
| Keterangan / Ket. | Note(s) |
| Lokasi Pengambilan | Sampling location |
| Metode | Test method |
| Moderat | Moderate |
| Parameter | Test parameter / analyte |
| Pengambil Contoh | Sample collector |
| Penyelia | Supervisor |
| Permenkes | Peraturan Menteri Kesehatan — Ministry of Health regulation |
| Permen LHK | Peraturan Menteri Lingkungan Hidup dan Kehutanan — Ministry of Environment & Forestry regulation |
| Petugas | Officer (the staff member who performed the activity) |
| Risiko Tinggi | High risk |
| Satuan | Unit |
| SNI | Standar Nasional Indonesia — Indonesian National Standard |
| Spesies | Species |
| Survei Jentik | Larval survey |
| Tanggal Penerimaan | Date received |
| Tanggal Pengujian | Test date |
| Telah diverifikasi oleh | Verified by |
| Telah divalidasi oleh | Validated by |
| Yth. | Kepada Yth. — "To the honored"; Indonesian honorific used to address recipients |
