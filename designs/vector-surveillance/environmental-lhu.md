# Environmental LHU — Feature Requirements Spec
## Laporan Hasil Uji Lingkungan (Environmental Test Result Report)

**Version:** 2.0
**Date:** 2026-05-26
**Status:** Design Review
**Supersedes:** v1.0 (2026-04-28)
**Scope:** OpenELIS Global, Carbon React printable PDF report for environmental samples
**Related specs:** S-06 Laporan Hasil (base compliance report), patient-report-redesign-spec

---

## Changelog — v1.0 → v2.0

This rewrite incorporates the structural review findings from 2026-05-26 covering ISO/IEC 17025:2017 §7.8 reporting requirements, KAN accreditation conventions, and Permenkes (Indonesia MoH) practice. P1 + P2 items folded in directly; the FRS is now KAN-audit-ready in scope (still pending stakeholder review).

**New report-face content (ISO 17025 §7.8):**
- §5.1.8 Results-apply-only disclaimer (§7.8.2.1(l) — "Hasil pengujian ini hanya berlaku untuk contoh yang diuji")
- §5.1.9 Decision rule statement (§7.8.6.1 — binary acceptance per ILAC-G8 default, configurable)
- §5.1.10 End-of-report marker (§7.8.2.1(d))
- §5.1.11 Reproduction restriction notice (Indonesian Labkesmas convention)
- §11.7 Amendment workflow on report face (§7.8.8)

**New data model fields:**
- `Result.expanded_uncertainty`, `Result.coverage_factor` — measurement uncertainty (§7.8.3.1(c))
- `Result.performed_by_lab` — subcontract disclosure (§7.8.2.1(p))
- `ComplianceContext.sampling_by_lab`, `ComplianceContext.sampling_plan_id` — sampling responsibility (§7.8.5)
- `Method.validation_status` — method validation/verification flag (§7.2)

**New table column:**
- §6.1 Conditional "U" (uncertainty) column on result table

**New footnote blocks (§6.4):**
- Method validation status per row
- Subcontracted tests disclosure
- Sampling responsibility line

**New i18n keys** (§16): `resultsApplyOnlyDisclaimer`, `endOfReport`, `decisionRule`, `expandedUncertainty`, `coverageFactor`, `samplingResponsibility`, `samplingByLab`, `samplingByClient`, `subcontractedTests`, `methodValidationStatus`, `validated`, `verified`, `inHouseMethod`, `reproductionRestriction`, `amendmentNotice`.

Strong-points kept verbatim from v1.0: S-06 inheritance map, configuration inheritance from patient-report-redesign, KAN per-parameter asterisk + `/R` suffix convention, §6.4 Methods + Accreditation Coverage footnote pattern, multi-matrix bundling, real crosswalk data references.

---

## Table of Contents

1. Overview & Scope
2. User Stories / JTBD
2.5 Configuration System Inheritance
3. Inheritance Map from S-06
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
- **Regulatory basis:** Permenkes RI No. 02 Tahun 2023, Permen LHK No. 68/2016, PP 22/2021, SNI standards per parameter
- **Accreditation basis:** ISO/IEC 17025:2017, KAN scope LP-XXX-IDN

### 1.2 Inheritance from S-06

This feature **extends** the S-06 Laporan Hasil (compliance report) base:
- Reuses lab letterhead block (lab name, address, accreditation logo, QR code)
- Reuses report number generation & numbering scheme
- Reuses signature/verification block (analyst + validator e-signatures)
- Reuses page footer ("Halaman X dari Y")
- Reuses Baku Mutu comparison and compliance evaluation logic
- Reuses ISO 17025 §7.8 standard report-face blocks (disclaimer, decision rule, end-of-report marker, reproduction restriction) — these are common across all S-06 derived reports and standardize the accreditation surface

**Unique to Environmental LHU:**
- Per-parameter KAN accreditation flags (asterisk in Parameter column, `/R` suffix in report number)
- Multi-sample-matrix bundling (single report can consolidate water + food + air in separate sub-tables)
- Flexible result table columns to accommodate diverse parameter types (descriptive vs. numeric, range thresholds, LOD markers)
- Dynamic Baku Mutu thresholds based on sample matrix and regulatory authority (SNI vs. Permenkes vs. Permen LHK)
- Conditional measurement uncertainty column (U) for parameters where uncertainty data is captured

### 1.3 Scope In

- Single unified Environmental LHU layout template that flexes via `sample_matrix` field
- Per-parameter KAN accreditation flag rendering
- Result table with columns: No. | Parameter | Hasil Uji | U (optional) | Baku Mutu | Satuan | Ket.
- Multi-matrix bundling (e.g., water + food + air in one report)
- ISO/IEC 17025 §7.8-aligned report-face content: disclaimer, decision rule, end-of-report marker, reproduction restriction
- Amendment workflow rendering (§7.8.8)
- Subcontract disclosure (§7.8.2.1(p))
- Sampling-responsibility flagging (§7.8.5)
- Method validation/verification status (§7.2)
- Edge case handling (below LOD, holding time exceeded, parameter not tested)
- Carbon React mockup with real crosswalk data
- HTML preview showing printable A4 layout

### 1.4 Scope Out

- **No** custom template editor UI (fixed layout for v2)
- **No** inline PDF preview in browser (user downloads and opens externally)
- **No** email/distribution workflow (covered by S-06b)
- **No** automated uncertainty computation — uncertainty values must be entered/imported by the lab; the LHU only displays them
- **No** decision-rule recomputation — the report displays the rule documented at order time; S-05 evaluates against it

---

## 2. User Stories / JTBD

### 2.1 Lab Analyst

**JTBD:** "I need to print a formal environmental test result report to send to the customer and for our compliance file."

- After results are validated and released, I click "Generate PDF" on the order
- The report is assembled from my validated results, pulls header/footer from lab config, applies current accreditation status
- Uncertainty values are included where available; absent where not (the report does not fabricate U)
- I download the PDF, print it, and deliver to customer

### 2.2 KAN Auditor

**JTBD:** "I need to verify that accredited parameters are correctly marked, the report reflects our scope of accreditation, and the report complies with ISO/IEC 17025:2017 §7.8."

- I review printed reports from the lab
- I see asterisks (*) on parameters within KAN scope; the accreditation body + scope number is named in the footnote
- I see optional `/R` suffix in report number confirming full accreditation
- I confirm the report carries: the §7.8.2.1(l) disclaimer, a documented decision rule, measurement uncertainty where required, an end-of-report marker, and a subcontract-disclosure block if any test was subcontracted
- I can trace amendments to prior reports via the amendment notice block

### 2.3 Lab Customer / Regulator

**JTBD:** "I need a clear, official statement of test results and their regulatory compliance status."

- I receive the printed LHU report
- I see clear parameter results, regulatory thresholds (Baku Mutu), measurement uncertainty where reported, and a conclusion statement in Indonesian + English
- I see the decision rule the lab used to declare conformity, so I understand whether the verdict accounts for uncertainty
- I can file this with regulators as proof of compliance or non-compliance

---

## 2.5 Configuration System Inheritance

The Environmental LHU reuses the **patient-report-redesign configuration surface**—it does **not** introduce parallel keys. Specifically, it inherits these JRXML parameters:

- **`headerName`** (String) — subreport selector (default `GeneralHeader.jasper`). Controls which header template is rendered in the page header band (3-column grid: left logo / facility-meta / right logo).
- **`accreditationImage`** (InputStream, PNG/JPEG) — accreditation logo image passed to both header and sign-off bands.
- **`accreditationNumber`** (String) — accreditation registry number (e.g., "KAN LP-042-IDN").
- **`accreditationLogoPosition`** (String enum `TOP` | `BOTTOM`, default `BOTTOM`) — controls whether the accreditation logo appears in the page header (top slot) or the sign-off footer (bottom slot, default).

**New in v2.0 — additional Print Report Configuration entries** (still under the existing admin page, no new namespace):

- **`decisionRule`** (String enum, default `BINARY_ACCEPTANCE`) — controls the decision rule statement printed on every LHU. Allowed values: `BINARY_ACCEPTANCE` (default; conformity declared if point result is within Baku Mutu, uncertainty not considered), `GUARD_BANDED` (conformity declared only if `|result − limit| ≥ U`), `SHARED_RISK` (per ILAC-G8 §4.3, customer-specified rule). The rendered text is keyed via i18n (`decisionRule.BINARY_ACCEPTANCE`, etc.) so deployments can localize the wording.
- **`reproductionRestriction`** (Boolean, default `true`) — controls whether the reproduction-restriction notice prints in the pre-footer.
- **`endOfReportMarker`** (Boolean, default `true`) — controls whether the end-of-report block prints after the signature frame.

These parameters are configured globally in **Admin → General Configuration → Printed Reports Configuration** (see patient-report-redesign-spec §15 + addendum r5 §15.6). The same admin page surfaces control the Environmental LHU's layout, ensuring deployments can standardize header/accreditation presentation across patient reports and environmental LHUs without template-level changes.

**Indonesian Labkesmas deployment note:** The typical configuration for Labkesmas will be `accreditationLogoPosition = BOTTOM` (default), `decisionRule = BINARY_ACCEPTANCE`, `reproductionRestriction = true`, `endOfReportMarker = true` — matching real KAN-audited print conventions.

---

## 3. Inheritance Map from S-06

| Section | Status | Notes |
|---|---|---|
| Lab Letterhead Block (logo, name, address) | Inherited from patient-report spec §7.1 / §7.1b | 3-column grid header band via `$P{headerName}` subreport |
| Report Number & Date | Modified | Optional `/R` suffix if KAN-accredited; supports amendment number suffix (Am.1, Am.2) |
| Customer/Yth Block | Inherited as-is | Same format as S-06 |
| Dates Timeline (Tanggal Penerimaan, Pengujian) | Inherited as-is | Same fields |
| Sample Info Block | Modified | Adds field for sample matrix type, sampling responsibility flag, sampling plan reference |
| Result Table | New | Custom columns for environmental parameters; conditional U column; multi-matrix flex |
| Baku Mutu Citation Block | New | Cites Permenkes/SNI per parameter, separate section above conclusion |
| **Decision Rule Statement (NEW in v2.0)** | New | One-line documented decision rule, §7.8.6.1 compliance |
| **Results-Apply-Only Disclaimer (NEW in v2.0)** | New | ISO 17025 §7.8.2.1(l) mandatory disclaimer |
| Compliance Conclusion | Modified | Handles per-parameter KAN flags; references the declared decision rule |
| Accreditation logo slot (top + bottom) | Inherited from patient-report spec §7.1b / §7.7a | Position-configurable via `$P{accreditationLogoPosition}` parameter |
| Admin config for printed-report layout | Inherited from patient-report spec §15.6 | Same admin page; v2.0 adds `decisionRule`, `reproductionRestriction`, `endOfReportMarker` |
| Verification + Validation Block | Inherited as-is | Same e-signature structure as S-06 |
| **Subcontracted Tests Disclosure (NEW in v2.0)** | New | §7.8.2.1(p) — list of subcontracted tests if any |
| **Amendment Notice (NEW in v2.0)** | New | §7.8.8 — renders when LHU is an amendment to a prior report |
| **Reproduction Restriction (NEW in v2.0)** | New | "Dilarang menggandakan sebagian dari LHU ini..." |
| Page Footer (Halaman X dari Y) | Inherited from patient-report spec §7.8 | Same format |
| **End-of-Report Marker (NEW in v2.0)** | New | Terminal block, §7.8.2.1(d) |

---

## 4. Data Model Touchpoints

### 4.1 Which Entities Feed the Report

| Field/Section | OpenELIS Entity | Notes |
|---|---|---|
| Lab name, address, accreditation | `site_information` table (Report Config) | From S-06 |
| Report number, date | CertificateNumberSequence (S-06) | Optional `/R` suffix if accredited; optional `Am.N` suffix if amended |
| Customer name, address | Order → ComplianceContext → customer | Reused from S-06 |
| Sample collection date, location, method | Order → ComplianceContext (sample_matrix, collectionDateTime, samplingLocation, samplingMethod) | sample_matrix enum: Water variants / Food / Air / Swab / Physical |
| **Sampling responsibility** | ComplianceContext.sampling_by_lab (BOOLEAN) | NEW v2.0 — true if lab performed sampling, false if client delivered sample |
| **Sampling plan reference** | ComplianceContext.sampling_plan_id (FK or text) | NEW v2.0 — required when sampling_by_lab=true (§7.8.5) |
| Sample receipt date | Order → receivedDate | Inherited |
| Parameters & results | Result → value, unit | Inherited |
| **Measurement uncertainty** | Result.expanded_uncertainty (DECIMAL), Result.coverage_factor (default 2) | NEW v2.0 (§7.8.3.1(c)) |
| **Subcontract flag per result** | Result.performed_by_lab (BOOLEAN) | NEW v2.0 — false if test was subcontracted; if false, store subcontractor lab name in `Result.subcontractor_lab` |
| **Subcontractor identification** | Result.subcontractor_lab (Text, nullable) | NEW v2.0 |
| Method per result | Result.analysis.method | Inherited |
| **Method validation status** | Method.validation_status (ENUM) | NEW v2.0 — values: VALIDATED, VERIFIED, IN_HOUSE_VALIDATED, IN_HOUSE_UNVALIDATED |
| Baku Mutu (regulatory threshold) | ComplianceThreshold → thresholdValue, thresholdType, regulatory_source | regulatory_source: SNI / PERMENKES / PERMEN_LHK / IN_HOUSE / OTHER |
| Compliance status | ComplianceEvaluation → status (PASS / MARGINAL / FAIL) | Inherited; evaluation respects the declared decision rule |
| **Declared decision rule** | ComplianceContext.decision_rule (ENUM) or inherited from Print Report Config | NEW v2.0 — values: BINARY_ACCEPTANCE / GUARD_BANDED / SHARED_RISK; order-level override of config default |
| KAN accreditation per parameter | ComplianceThreshold → parameter_kan_accredited | Inherited |
| Analyst name, signature | electronic_signature → (signature_meaning = "Authored") | Inherited from S-06 |
| Validator name, signature | electronic_signature → (signature_meaning = "Validated and Released") | Inherited from S-06 |
| **Amendment metadata** | Order.amends_lhu_number (Text, nullable), Order.amendment_number (Integer, nullable), Order.amendment_reason (Text, nullable) | NEW v2.0 |

### 4.2 New Fields Required (v2.0)

**Result** (extend):
- `expanded_uncertainty` : DECIMAL (nullable) — U value in same unit as result
- `coverage_factor` : DECIMAL (default 2.0) — typically k=2 for 95% coverage
- `performed_by_lab` : BOOLEAN (default true) — false indicates subcontracted
- `subcontractor_lab` : TEXT (nullable) — name of subcontracting lab if performed_by_lab=false

**Method** (extend):
- `validation_status` : ENUM {VALIDATED, VERIFIED, IN_HOUSE_VALIDATED, IN_HOUSE_UNVALIDATED} — VALIDATED for SNI/Standard Methods, VERIFIED for adopted methods, IN_HOUSE_VALIDATED for lab-developed and fully validated per ISO 17025 §7.2, IN_HOUSE_UNVALIDATED otherwise (rare — flag in footnote)

**ComplianceContext** (extend):
- `sample_matrix` : ENUM {WATER_DRINKING, WATER_WASTEWATER, WATER_AMBIENT, FOOD, AIR, SURFACE_SWAB, PHYSICAL_CONDITIONS}
- `sampling_by_lab` : BOOLEAN (default false)
- `sampling_plan_id` : TEXT (nullable; required when sampling_by_lab=true)
- `decision_rule` : ENUM {BINARY_ACCEPTANCE, GUARD_BANDED, SHARED_RISK} (nullable; inherits from Print Report Config when null)

**ComplianceThreshold** (extend):
- `regulatory_source` : ENUM {SNI, PERMENKES, PERMEN_LHK, IN_HOUSE, OTHER}
- `parameter_kan_accredited` : BOOLEAN (default false)

**Order** (extend):
- `amends_lhu_number` : TEXT (nullable) — full LHU number this report amends
- `amendment_number` : INTEGER (nullable) — sequential amendment number (1, 2, ...)
- `amendment_reason` : TEXT (nullable) — narrative reason for amendment

---

## 5. Layout Specification

### 5.1 Page Header Band

**Header band**: See patient-report-redesign-spec §7.1 (configurable subreport `$P{headerName}`, 3-column grid: left logo / facility-meta / right logo). The LHU passes the same parameters (`headerName`, `accreditationImage`, `accreditationNumber`, `accreditationLogoPosition`); no LHU-specific markup.

**Top accreditation logo** (optional): See patient-report-redesign-addendum §7.1b. When `printedReport.accreditationLogoPosition = TOP`, the accreditation image + number render in a 4th column slot. Activated by the parameter; suppresses bottom variant.

**Bottom accreditation logo** (default): See patient-report-redesign-addendum §7.7a. When `printedReport.accreditationLogoPosition = BOTTOM` or null (default), the accreditation image + number render floated right in the sign-off frame.

### 5.2 Page Structure (A4 Portrait, ~794×1123 px)

```
┌─ Header Block (60–80 mm) — inherited patient-report §7.1 ─┐
│ [Lab Logo]  [KAN Logo if TOP]  [Facility Name/Meta]  ... │
├──────────────────────────────────────────────────────────┤
│ LAPORAN HASIL UJI / TEST RESULT REPORT                   │
│ No. [LHU-YYYY-NNNN or LHU-YYYY-NNNN/R]                   │
│ Tanggal Penerbitan: [Date]                               │
├──────────────────────────────────────────────────────────┤
│ [Amendment Notice if applicable — §5.1.5]                │
├──────────────────────────────────────────────────────────┤
│ Yth. [Customer Name/Organization]                        │
│ [Address Line 1]                                          │
│ [Address Line 2]                                          │
├──────────────────────────────────────────────────────────┤
│ INFORMASI SAMPEL / SAMPLE INFORMATION                    │
│ No. Contoh Uji: [sample ID]                              │
│ Jenis Contoh: [Water / Food / Air / etc.]                │
│ Asal Contoh Uji: [location]                              │
│ Pengambil Contoh: [collector name]                       │
│ Tanggung Jawab Pengambilan: [Lab / Pelanggan]            │
│ [If lab:] Referensi Rencana Pengambilan: [plan ID]       │
│ Lokasi Pengambilan: [GPS or description]                 │
│ Tanggal diambil/diterima: [date] / [date]                │
│ Tanggal Pengujian: [start date] to [end date]            │
│ Metode Pengambilan: [method code]                        │
├──────────────────────────────────────────────────────────┤
│ HASIL PENGUJIAN / TEST RESULTS                           │
│ (See § 6 for table structure)                            │
├──────────────────────────────────────────────────────────┤
│ BAKU MUTU / REGULATORY STANDARDS                         │
│ Peraturan Menteri Kesehatan RI No. 02 Tahun 2023         │
│ Standar Nasional Indonesia (SNI) [specific versions]     │
├──────────────────────────────────────────────────────────┤
│ ATURAN KEPUTUSAN / DECISION RULE                         │
│ [One-line decision rule statement, §5.1.7]               │
├──────────────────────────────────────────────────────────┤
│ KESIMPULAN / CONCLUSION                                  │
│ [Bilingual statement of compliance]                      │
├──────────────────────────────────────────────────────────┤
│ TANDA TANGAN / SIGNATURES                                │
│ Diuji oleh / Tested by:   Disahkan oleh / Approved:      │
│ [Name]                    [Name]                          │
│ [Title]                   [Title]                         │
│ [Timestamp]               [Timestamp]                     │
├──────────────────────────────────────────────────────────┤
│ Hasil pengujian ini hanya berlaku untuk contoh yang diuji│
│ Test results apply only to the items tested              │
├──────────────────────────────────────────────────────────┤
│ Dilarang menggandakan sebagian dari LHU ini tanpa izin   │
│ tertulis dari Laboratorium                               │
├──────────────────────────────────────────────────────────┤
│ Ditandatangani secara elektronik / Electronically signed │
│ Halaman [X] dari [Y]                                     │
├──────────────────────────────────────────────────────────┤
│ ─── AKHIR LAPORAN / END OF REPORT ───                    │
└──────────────────────────────────────────────────────────┘
```

### 5.1.5 Amendment Notice (when applicable)

When `Order.amends_lhu_number` is non-null, an amendment block renders immediately below the report number, framed by a thin border for visibility:

```
┌──────────────────────────────────────────────────────────┐
│ AMANDEMEN No. [N] — Menggantikan / Supersedes:           │
│ [Original LHU number]                                    │
│ Alasan / Reason: [amendment reason narrative]            │
└──────────────────────────────────────────────────────────┘
```

The amended report's number also carries the suffix `/Am.N` (e.g., `LHU-2026-0042/R/Am.1`). The original LHU is **not** deleted from the audit trail; both versions are stored, but the original is marked `superseded_by` = new report number per §7.8.8.

### 5.1.7 Decision Rule Statement (NEW in v2.0)

Renders as a one-line statement between the Baku Mutu block and the Conclusion. Text is sourced from the `decision_rule` enum on ComplianceContext (or inherited from Print Report Config). Default text per enum:

| Enum value | Indonesian text | English text |
|---|---|---|
| `BINARY_ACCEPTANCE` | Aturan keputusan: hasil dinyatakan memenuhi baku mutu jika nilai hasil uji (tanpa memperhitungkan ketidakpastian) berada dalam ambang baku mutu (ILAC-G8:09/2019). | Decision rule: a result is declared to conform if the measured value (without uncertainty) lies within the regulatory limit (ILAC-G8:09/2019, binary acceptance). |
| `GUARD_BANDED` | Aturan keputusan: hasil dinyatakan memenuhi baku mutu jika selisih nilai hasil uji terhadap ambang baku mutu lebih besar dari ketidakpastian terluas U (k=2). | Decision rule: a result is declared to conform only if the absolute difference between the measured value and the regulatory limit exceeds the expanded uncertainty U (k=2). |
| `SHARED_RISK` | Aturan keputusan: aturan khusus pelanggan per ILAC-G8 §4.3 — lihat referensi pelanggan. | Decision rule: customer-specified rule per ILAC-G8 §4.3 — see customer reference. |

i18n keys: `decisionRule`, `decisionRuleBinaryAcceptance`, `decisionRuleGuardBanded`, `decisionRuleSharedRisk`.

### 5.1.8 Results-Apply-Only Disclaimer (NEW in v2.0)

Renders immediately above the reproduction restriction in the pre-footer band. Required by ISO/IEC 17025:2017 §7.8.2.1(l). Fixed text:

- **Indonesian:** *Hasil pengujian ini hanya berlaku untuk contoh yang diuji.*
- **English:** *Test results apply only to the items tested.*

i18n key: `resultsApplyOnlyDisclaimer`.

### 5.1.9 Reproduction Restriction (NEW in v2.0)

Renders below the disclaimer when `printedReport.reproductionRestriction = true` (default). Fixed text:

- **Indonesian:** *Dilarang menggandakan sebagian dari LHU ini tanpa izin tertulis dari Laboratorium.*
- **English:** *No part of this report may be reproduced without the written consent of the Laboratory.*

i18n key: `reproductionRestriction`.

### 5.1.10 End-of-Report Marker (NEW in v2.0)

Renders as the terminal block of the report, after the page-numbering footer. Required by ISO/IEC 17025:2017 §7.8.2.1(d) so that recipients can verify they have the complete report.

Rendered as a centered horizontal-rule-flanked marker:

```
─── AKHIR LAPORAN / END OF REPORT ───
```

Controlled by `printedReport.endOfReportMarker` (default `true`). i18n key: `endOfReport`.

### 5.2 Page Break Rules

- Results table for each matrix (Water, Food, Air) breaks to a new page if it would exceed ~70% of available space
- If multiple matrices bundled, each gets a sub-heading and its own table
- Signature block always appears on the same page as the conclusion if possible; otherwise on the final page
- Disclaimer, reproduction restriction, and end-of-report marker must appear together on the final page (no orphan splitting)
- Page numbering: "Halaman 1 dari 2" (Y reflects total pages including final-page disclaimer block)

---

## 6. Result Table Column Spec

### 6.1 Columns

**Paper-conservation note (v1.0, retained):** the wide `Metode` column is removed from the result table and consolidated into a compact "Methods + Accreditation Coverage" footnote below the table (§6.4). This frees ~20% of table width on every report.

**New in v2.0:** a conditional "U" (uncertainty) column renders between Hasil Uji and Baku Mutu **when any row on the report has a non-null `expanded_uncertainty`**. If no rows have uncertainty data, the column is omitted entirely (avoids visual implication that uncertainty is "not measured" — it just wasn't reported for that test). When the column renders for some rows but not others, blank cells display "—" (em dash) rather than zero or "n/a".

| Column | Type | Width (U absent) | Width (U present) | Notes |
|---|---|---|---|---|
| No. | Integer | 6% | 5% | Sequential 1, 2, 3, ... |
| Parameter | Text | 24% | 22% | Test name in Indonesian; trailing `*` when within accredited scope |
| Hasil Uji | Text/Numeric | 16% | 14% | Result value or descriptive |
| **U** (k=2) | Decimal | — | 9% | NEW v2.0: expanded uncertainty, same unit as result; "—" if absent for that row |
| Baku Mutu | Text | 16% | 14% | Regulatory threshold |
| Satuan | Text | 12% | 12% | Unit |
| Ket. | Text | 26% | 24% | Status icon + flags |

### 6.2 Example Data (PT. Unggulrejo Wasono Wastewater) — with uncertainty

| No. | Parameter | Hasil Uji | U (k=2) | Baku Mutu | Satuan | Ket. |
|---|---|---|---|---|---|---|
| 1 | BOD5 * | 11.2 | ±1.8 | 60 | mg/L | ✓ |
| 2 | COD * | 21.5 | ±3.2 | 150 | mg/L | ✓ |
| 3 | Fenol Total | <0.0033 | — | 0.5 | mg/L | ✓ |
| 4 | Amonia Total (NH3 sebagai N) * | 0.255 | ±0.038 | 8.0 | mg/L | ✓ |
| 5 | pH * | 6.7 | ±0.1 | 6.0–9.0 | — | ✓ |
| 6 | TSS | 14 | ±2 | 50 | mg/L | ✓ |
| 7 | Krom Total (Cr) * | <0.0095 | — | 1 | mg/L | ✓ |

### 6.3 Ket. Column + Parameter-Asterisk Flag Legend

| Flag | Where it lives | Meaning |
|---|---|---|
| `*` (after parameter name) | Parameter cell | Parameter is within KAN accreditation scope |
| `✓` | Ket. cell | Result meets Baku Mutu under declared decision rule |
| `⚠` | Ket. cell | Result is within range but approaching threshold (marginal, or guard-band overlap) |
| `✗` | Ket. cell | Result fails Baku Mutu under declared decision rule |
| `#` | Ket. cell (suffix) | Pemeriksaan telah melampaui holding time |
| `<` | Hasil Uji cell (prefix) | Below limit of detection (e.g., "<0.001") |
| `–` | Hasil Uji cell | Parameter listed in the order but not actually tested |
| `S` (suffix in Ket.) | Ket. cell | Subkontrak — test performed by another lab (named in §6.4 footnote) |
| `/R` | Report number suffix | Entire report is KAN-accredited |
| `/Am.N` | Report number suffix | Report is amendment N of the original |

### 6.4 Methods + Accreditation Coverage + Subcontract + Sampling Footnote (replaces wide Metode column)

A compact multi-line footnote renders immediately below each result table (or once per report when multiple tables are present). Lines render in this order:

1. **Metode / Methods.** Inline list of `Parameter: method-code [validation status]` triples separated by semicolons. Validation status shown only when not `VALIDATED` (i.e., `[VERIFIED]`, `[IN-HOUSE]`, `[IN-HOUSE-UNVALIDATED]`). Generated from each result row's `analysis.method`.
2. **Akreditasi / Accreditation coverage.** Names the accrediting body and scope number (e.g., "KAN ISO/IEC 17025 — LP-042-IDN") and lists which tests fall within scope. When tests on the same report are accredited by different bodies, render one line per body — mirrors patient-report-redesign-spec §7.6c.
3. **Subkontrak / Subcontracted tests** (NEW v2.0, conditional). Renders only when any row has `performed_by_lab = false`. Format: "Parameter: subcontractor lab name [accreditation if known]". Required by §7.8.2.1(p).
4. **Tanggung Jawab Pengambilan / Sampling responsibility** (NEW v2.0). One line stating whether the lab or the customer was responsible for sample collection. If lab, references the sampling plan ID (§7.8.5). Format: "Pengambilan dilakukan oleh: [Laboratorium per rencana pengambilan no. X / Pelanggan]".
5. **Baku Mutu / Regulatory reference.** The regulation cited as the threshold source (Permenkes / Permen LHK / SNI). One line, dedup'd.

**Example footnote for the §6.2 wastewater table** (with one subcontracted test added for illustration):

> **Metode / Methods.** BOD5: SNI 6989.72-2009; COD: SNI 6989.2-2019; Fenol Total: SNI 06-6989.21-2004; Amonia Total: SNI 06-6989.30-2005; pH: SNI 6989.11-2019; TSS: In House Method [IN-HOUSE]; Krom Total: SNI 6989.84-2019.
>
> **Akreditasi / Accreditation coverage.** Tests marked `*` are within the lab's accreditation scope: **KAN ISO/IEC 17025 — LP-042-IDN** covers BOD5, COD, Amonia Total, pH, Krom Total (5 of 7 tests). Fenol Total and TSS are not within the accredited scope.
>
> **Subkontrak / Subcontracted tests.** Krom Total: BBLK Surabaya — KAN LP-118-IDN.
>
> **Tanggung Jawab Pengambilan / Sampling responsibility.** Pengambilan dilakukan oleh: Pelanggan / Performed by: Customer.
>
> **Baku Mutu / Regulatory reference.** Peraturan Menteri Lingkungan Hidup dan Kehutanan RI No. 68 Tahun 2016 tentang Baku Mutu Air Limbah.

**Why this footnote layout instead of additional columns.** Methods, validation status, subcontracting, and sampling responsibility are all "report-level + per-row" information that would balloon the table if columnized. The footnote retains per-row precision (parameter-named) while keeping the table compact. This is the same pattern the patient-report-redesign §7.6c uses for accreditation coverage. ISO 15189 §7.4.1.6(a) and ISO/IEC 17025 §7.8.2.1(p), §7.8.5 are all satisfied by the footnote contents.

### 6.5 Result Value Formatting

| Type | Format | Example |
|---|---|---|
| Numeric | Decimal with unit | 7.2 pH, 11.2 mg/L |
| Numeric with U | Value ± U (k=2) | 0.255 ± 0.038 mg/L |
| Below LOD | <X notation; U column "—" | <0.001 mg/L |
| Range | Min–Max | 6.5–8.5 (for pH range threshold) |
| Descriptive | Plain text; U column "—" | Tidak berbau, Negatif |
| Not tested | Dash | – |

**Uncertainty display rule:** when a result is below LOD or qualitative, the U column shows "—" — not zero, not blank. This signals "uncertainty not applicable" rather than "uncertainty zero".

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
| Regulatory citation block | **Yes** | Different standards cited per matrix |
| Decision rule | Optionally per-order | Same default per config, can be overridden per order |
| Conclusion text | **Yes** | References the specific matrix-relevant standard |
| Multi-matrix bundling | **Yes** | Each matrix gets its own sub-heading and result table |
| Disclaimer / Repro restriction / End-marker | No | Always renders, fixed text |

### 7.3 Multi-Matrix Bundling Example

**KL.457 SPPG Mampang Depok (real example from crosswalk):**

```
Report No. KL.457 / [date]

LAPORAN HASIL PENGUJIAN KUALITAS LINGKUNGAN DAN MAKANAN
Report of Environmental & Food Quality Testing

═══════════════════════════════════════════════════════════
AIR MINUM (DRINKING WATER)
[Result table: 8 parameters; U column where reported]
═══════════════════════════════════════════════════════════
MAKANAN (FOOD)
[Result table: 4 parameters]
═══════════════════════════════════════════════════════════
USAP PERMUKAAN (SURFACE SWABS)
[Result table: Bacterial count, species ID]
═══════════════════════════════════════════════════════════

[Single Regulatory Standards section]
[Single Decision Rule statement]
[Single Conclusion]
[Single Signature block]
[Disclaimer + Reproduction restriction]
[Halaman 1 dari 3]

─── AKHIR LAPORAN / END OF REPORT ───
```

---

## 8. Baku Mutu Reference Handling

### 8.1 Regulatory Authority by Standard

| Standard | Authority | Examples | When Used |
|---|---|---|---|
| **PP No. 22/2021** | Presiden RI | Drinking water, surface water quality | Water samples |
| **Permenkes RI No. 02/2023** | Ministry of Health | Environmental health facilities | Air, facility conditions |
| **Permen LHK No. 68/2016** | Ministry of Environment & Forestry | Wastewater discharge limits | Wastewater matrices |
| **SNI 6989.XX-YYYY** | Badan Standardisasi Nasional | Specific test methods | Water chemistry, microbiology |
| **SNI 9099:2024** | BSN | Indoor air microbiology | Ambient air |
| **In House** | Lab-validated method | Lab's own SOP when no SNI exists | Custom matrices |

### 8.2 Threshold Storage & Lookup

**In database:** `ComplianceThreshold` table with:
- `parameter_id` (FK to Test)
- `thresholdValue` (numeric or range)
- `thresholdType` : ENUM {EXACT, RANGE, MIN, MAX, DESCRIPTIVE}
- `regulatory_source` : ENUM
- `standard_name` : Text
- `unit` : Text

**Rendering:** filter to the standard selected for the order (from `ComplianceContext.standardName`); render `thresholdValue` in Baku Mutu column; cite `regulatory_source` + `standard_name` in Baku Mutu block deduplicated per report.

### 8.3 Edge Case: Multiple Thresholds Per Parameter

Different authorities can set different limits for same parameter (e.g., drinking water vs. wastewater Pb). Store separate `ComplianceThreshold` rows per (parameter, standard) pair; filter to the order's selected standard at report generation.

### 8.4 Decision Rule Documentation (NEW in v2.0)

Per ISO/IEC 17025:2017 §7.8.6.1, the decision rule used to declare conformity must be documented on the report. The Environmental LHU does this in two places:

1. **On the report face:** §5.1.7 renders the one-line decision-rule statement between Baku Mutu and Conclusion.
2. **In the database:** `ComplianceContext.decision_rule` records which rule was applied to *this* order. ComplianceEvaluation (S-05) computes PASS/MARGINAL/FAIL against this rule.

**Default behavior per rule:**

- `BINARY_ACCEPTANCE` (default): compare result point estimate to limit. ✓ if within, ✗ if outside, ⚠ never auto-flagged (S-05 may still set MARGINAL for human review).
- `GUARD_BANDED`: compare result point estimate ± U to limit. ✓ if entire interval is within limit. ⚠ if interval straddles limit (guard-band overlap). ✗ if entire interval is outside.
- `SHARED_RISK`: customer-specified rule. ComplianceEvaluation accepts an external verdict; the LHU renders the rule reference from `decision_rule_reference` text field.

### 8.5 Measurement Uncertainty Handling (NEW in v2.0)

Measurement uncertainty is reported per ISO/IEC 17025:2017 §7.8.3.1(c). For environmental compliance reporting, this is in scope because uncertainty *can* affect conformity to the Baku Mutu limit.

**Storage:** `Result.expanded_uncertainty` (DECIMAL, same unit as result), `Result.coverage_factor` (DECIMAL, default 2.0 for 95% coverage).

**Rendering:**
- U column shows `±X` where X is `expanded_uncertainty`. The k=2 (or non-default k) is documented once in the §6.4 footnote when any row in the report has uncertainty data.
- If `decision_rule = GUARD_BANDED`, the compliance evaluation uses the uncertainty interval (point ± U) when comparing to limit. ⚠ is rendered when the interval straddles the limit.
- If `decision_rule = BINARY_ACCEPTANCE`, uncertainty is reported but not used in the conformity decision (per ILAC-G8 binary acceptance).

**When uncertainty is not available** (lab has not computed U for this method): the row's U cell shows "—". A footnote in §6.4 disclaimers state that uncertainty was not reported for those parameters and the decision rule was applied to point estimates.

---

## 9. KAN Accreditation Handling

### 9.1 Per-Parameter Flag

**Storage:** `ComplianceThreshold.parameter_kan_accredited` : BOOLEAN.

**Rendering:**
- Asterisk (`*`) after parameter name in Parameter column when accredited
- Body + scope number cited once in §6.4 footnote
- Tests not within scope: no asterisk

### 9.2 Report-Level `/R` Suffix

If **ALL** parameters on the order have `parameter_kan_accredited = true`, append `/R` to report number. Otherwise omit.

### 9.3 Accreditation Logo

If `/R` suffix, render KAN logo per the position config (TOP or BOTTOM). If not fully accredited, the logo still renders per config; KAN coverage is conveyed by the asterisks in the table and the footnote.

---

## 10. Multi-Matrix Bundling Rules

### 10.1 When to Bundle

Bundle when one order contains samples from multiple matrices, all results are released, and the user selects "bundle" mode (or bundling is auto-applied when ComplianceContext has items for multiple matrices).

### 10.2 Report Assembly

1. Header block — once
2. Customer block — once
3. **Amendment notice** if applicable — once
4. For each matrix: matrix heading, sample info block, result table, footnote block
5. Unified Baku Mutu section
6. **Unified Decision Rule statement** (NEW v2.0)
7. Unified Conclusion
8. Signature block — once
9. Disclaimer + reproduction restriction — once
10. Page footer
11. **End-of-report marker** — once

### 10.3 Certificate Number Assignment

One certificate number per order, regardless of matrix count. `/R` suffix applies if ALL parameters across ALL matrices are KAN-accredited.

---

## 11. Edge Cases & Special Values

### 11.1 Parameter Not Tested

```
| 3 | Amonia | – | — | 8.0 | mg/L | – Tidak diperiksa |
```
Show "–" in Hasil Uji and Keterangan; do NOT include in compliance conclusion count.

### 11.2 Holding Time Exceeded

```
| 5 | BOD5 | 68 | ±5 | 60 | mg/L | ✗# |
```
Add `#` in Ket. column. Footnote: `# Pemeriksaan melampaui holding time maksimum. Hasil mungkin tidak akurat.`

### 11.3 Below Limit of Detection (LOD)

```
| 4 | Fenol Total | <0.0033 | — | 0.5 | mg/L | ✓ |
```
Store as `<X`. U column shows "—". Treat as PASS if threshold is also "negative" or "non-detect".

### 11.4 Range Threshold (e.g., pH)

```
| 2 | pH | 7.2 | ±0.1 | 6.5–8.5 | — | ✓ |
```
PASS if min ≤ result ≤ max under BINARY_ACCEPTANCE. Under GUARD_BANDED, PASS only if `(result − U) ≥ min` AND `(result + U) ≤ max`.

### 11.5 Descriptive Result

```
| 1 | Bau | Tidak berbau | — | Tidak berbau | — | ✓ |
```
String match for compliance; no U computation possible.

### 11.6 Result Override

```
| 7 | Lead (Pb) | 0.032 | ±0.004 | ≤0.03 | mg/L | ✗* |
```
Footnote: `* Status overridden by [name] on [timestamp]. Justification: [reason].` Override is per S-05.

### 11.7 Subcontracted Test (NEW in v2.0)

```
| 6 | Dioksin | <0.001 | — | 0.005 | ng/L | ✓S |
```
The `S` suffix in Ket. flags subcontracted; the §6.4 footnote names the subcontractor lab. Required by §7.8.2.1(p).

### 11.8 Amendment to Prior LHU (NEW in v2.0)

When this LHU amends a prior one:
- Report number: original `LHU-2026-0042/R` becomes `LHU-2026-0042/R/Am.1` (or `Am.2`, etc.)
- §5.1.5 amendment notice block renders below the report number
- The original report is marked `superseded_by` in the audit trail; both are retained
- Compliance evaluations for the amended LHU may differ from the original (e.g., re-evaluation under a different decision rule); the notice should reflect this

### 11.9 Sampling Responsibility Variants

| sampling_by_lab | sampling_plan_id | Sample info renders |
|---|---|---|
| true | required | "Pengambilan dilakukan oleh: Laboratorium per rencana pengambilan no. X" |
| false | nullable (typically null) | "Pengambilan dilakukan oleh: Pelanggan" |

When sampling_by_lab=true, the lab takes ISO 17025 §7.8.5 responsibility for sample integrity and the sampling plan must be referenced. When false, the disclaimer in §5.1.8 is even more important — the lab does not vouch for chain-of-custody.

### 11.10 Method Validation Status Variants

| validation_status | Render in §6.4 footnote |
|---|---|
| `VALIDATED` | (no annotation — default for standard methods) |
| `VERIFIED` | `[VERIFIED]` annotation next to method code |
| `IN_HOUSE_VALIDATED` | `[IN-HOUSE]` annotation |
| `IN_HOUSE_UNVALIDATED` | `[IN-HOUSE-UNVALIDATED]` annotation + footnote disclaiming results for unvalidated methods |

---

## 12. Print/Export Requirements

### 12.1 PDF Output

- A4 Portrait (210×297 mm ≈ 794×1123 px at 96 dpi)
- Margins: 20 mm top/bottom, 15 mm left/right
- Font: IBM Plex Sans (Carbon default)
- Body 10–11 pt; section headings 12–14 pt bold; footnotes 9 pt
- Line height: 1.4

### 12.2 Page Breaks

- Hard page break after each matrix table when multi-matrix
- Soft break: conclusion + signature + disclaimer + repro restriction + end-marker should stay together on final page; if not, repaginate so they ALL move to next page (no orphaned end-marker)

### 12.3 Print Preview & Scaling

When user clicks "Generate PDF": render to A4-sized canvas, apply `@media print` for page breaks, generate PDF server-side, download as `LHU-{certificateNumber}_{siteCode}_{labNumber}.pdf` (amended reports include the Am.N suffix in filename).

### 12.4 Digital vs. Print Distinction

| Aspect | Screen Preview | Printed PDF |
|---|---|---|
| Background | Light gray | White |
| Borders/shadows | Visible | Subtle or none |
| Page numbers | Visible | "Halaman X dari Y" footer |
| End-of-report marker | Visible | Required, centered |
| E-signature placeholder | "Digital signature applied" | Minimal placeholder |
| QR code | Yes | Yes (printable) |

---

## 13. Acceptance Criteria

### Functional (inherited from v1.0)

- [ ] **AC01**: Report renders correctly for single-matrix orders (Water, Food, Air, Swab, Physical)
- [ ] **AC02**: Multi-matrix bundling works
- [ ] **AC03**: KAN accreditation flags appear as `*` on accredited parameters
- [ ] **AC04**: Report number appends `/R` if ALL parameters are KAN-accredited
- [ ] **AC05**: Baku Mutu citation block lists all unique standards (PP/Permenkes/SNI/Permen LHK)
- [ ] **AC06**: Result table renders with proper column widths and text wrapping
- [ ] **AC07**: Edge case values display correctly: `–`, `<X`, ranges, descriptive
- [ ] **AC08**: Compliance conclusion is bilingual (Indonesian primary)
- [ ] **AC09**: PDF downloads with correct filename
- [ ] **AC10**: Page numbering shows "Halaman X dari Y"
- [ ] **AC11**: E-signature block shows analyst + validator with timestamps

### Configuration & Accreditation Logo Position (inherited from v1.0)

- [ ] **AC20**: `accreditationLogoPosition = BOTTOM` (default) places logo in sign-off block
- [ ] **AC21**: `accreditationLogoPosition = TOP` places logo in header band 4th column
- [ ] **AC22**: LHU does not introduce new keys to `printedReport.*` config namespace (only adds values within it)

### ISO/IEC 17025 §7.8 compliance (NEW in v2.0)

- [ ] **AC30** (§7.8.2.1(l)): The "results apply only to items tested" disclaimer renders above the reproduction restriction on every LHU. Indonesian primary, English secondary.
- [ ] **AC31** (§7.8.2.1(d)): The end-of-report marker renders as the terminal block of every LHU when `printedReport.endOfReportMarker = true` (default). Controlled by config; suppressible.
- [ ] **AC32** (§7.8.6.1): The decision rule statement renders between Baku Mutu and Conclusion. Default text per the `decision_rule` enum (BINARY_ACCEPTANCE / GUARD_BANDED / SHARED_RISK). Text is i18n-keyed.
- [ ] **AC33** (§7.8.3.1(c)): When any row has `expanded_uncertainty` non-null, the U column renders. Other rows show "—". The k=2 (or non-default k) is documented in the §6.4 footnote.
- [ ] **AC34** (§7.8.3.1(c) + decision rule): When `decision_rule = GUARD_BANDED` is set, ComplianceEvaluation uses `result ± U` against the limit; `⚠` renders if the uncertainty interval straddles the limit. The LHU does NOT recompute compliance — it displays the verdict that S-05 produced.
- [ ] **AC35** (§7.8.2.1(p)): When any result has `performed_by_lab = false`, the §6.4 Subkontrak line renders with parameter-by-parameter subcontractor lab names. Row Ket. column carries `S` suffix.
- [ ] **AC36** (§7.8.5): The sample info block shows sampling responsibility ("Pengambilan dilakukan oleh: Laboratorium / Pelanggan"). When `sampling_by_lab = true`, the sampling plan reference is also rendered.
- [ ] **AC37** (§7.8.8): When the order has `amends_lhu_number` non-null, the amendment notice block renders below the report number with the amendment number, original LHU number, and amendment reason. The report number suffix becomes `/Am.N`.
- [ ] **AC38** (Reproduction restriction): When `printedReport.reproductionRestriction = true` (default), the restriction line renders in the pre-footer band. Bilingual; i18n-keyed.
- [ ] **AC39** (Method validation): The §6.4 Methods footnote annotates each method with its validation status when not `VALIDATED` (i.e., shows `[VERIFIED]`, `[IN-HOUSE]`, `[IN-HOUSE-UNVALIDATED]`).

### Data Quality (extended in v2.0)

- [ ] **AC40**: All parameter values, units, and Baku Mutu pulled from Order + ComplianceThreshold entities; no hardcoded data
- [ ] **AC41**: KAN flag reflects `ComplianceThreshold.parameter_kan_accredited`
- [ ] **AC42**: Regulatory source (SNI/Permenkes/Permen LHK) matches `ComplianceThreshold.regulatory_source`
- [ ] **AC43**: Expanded uncertainty value matches `Result.expanded_uncertainty`; coverage factor `Result.coverage_factor`
- [ ] **AC44**: Subcontract flag reflects `Result.performed_by_lab`; subcontractor name from `Result.subcontractor_lab`
- [ ] **AC45**: Sampling responsibility reflects `ComplianceContext.sampling_by_lab`; plan ID from `ComplianceContext.sampling_plan_id`
- [ ] **AC46**: Decision rule statement reflects `ComplianceContext.decision_rule` (or inherits from config if null)
- [ ] **AC47**: Amendment metadata reflects `Order.amends_lhu_number`, `amendment_number`, `amendment_reason`

### Layout & Design

- [ ] **AC50**: A4 portrait layout: margins 20/15 mm, fonts readable on print
- [ ] **AC51**: Header block includes lab name, address, accreditation number + logo
- [ ] **AC52**: Sample info block clearly shows Jenis Contoh and sampling responsibility
- [ ] **AC53**: Result table uses Carbon design tokens
- [ ] **AC54**: Compliance symbols render: ✓, ⚠, ✗
- [ ] **AC55**: All section headings bilingual
- [ ] **AC56**: Disclaimer, reproduction restriction, and end-of-report marker render together on final page (no orphan splitting)

### Localization

- [ ] **AC60**: All visible strings use i18n keys (no hardcoded English/Indonesian)
- [ ] **AC61**: Field labels in Indonesian, with English in parentheses or below where helpful
- [ ] **AC62**: Decision rule text resolves per enum value via i18n

### Print/Export

- [ ] **AC70**: PDF generated server-side, downloads cleanly
- [ ] **AC71**: Multi-page reports have correct page break behavior
- [ ] **AC72**: `@media print` CSS hides UI chrome, shows pagination footer
- [ ] **AC73**: QR code (if present) is scannable in printed PDF

---

## 14. Open Questions

1. **Uncertainty backfill:** For methods where the lab has not yet computed U, do we ship LHUs with U column empty ("—") and a disclaimer, or require U-computation before LHU release? (Recommendation: ship with "—" + disclaimer; do not block release. Devs to confirm with QA lead.)
2. **Decision-rule default:** Should BINARY_ACCEPTANCE remain the default in Print Report Config, or should Labkesmas default to GUARD_BANDED for high-risk matrices (drinking water, wastewater)? (Recommendation: BINARY_ACCEPTANCE default, but enable per-matrix override at the ComplianceContext level.)
3. **Subcontractor accreditation display:** Should subcontracted-test rows also show the subcontractor's accreditation flag (e.g., `*` if BBLK Surabaya accredits Dioksin under KAN), or is "subcontracted" sufficient signaling?
4. **Amendment scope:** Does an amendment regenerate the entire report or only the affected sections? (Recommendation: entire report regenerates; the audit trail keeps the original.)
5. **Holding time and decision rule:** If a result exceeds holding time AND the decision rule is GUARD_BANDED, do we still render ⚠ for the guard-band, or does `#` (holding time) override?
6. **Multi-year amendment numbering:** If a 2025 LHU is amended in 2026, what year does the amendment carry? (Recommendation: keep original year; the Am.N suffix conveys the timeline.)

---

## 15. References

### Source Documents (Read-Only)

- **lhu-crosswalk-raw.md** — Crosswalk of 10 real environmental LHUs (PT. Unggulrejo Wasono, RS Permata Depok, SPPG Mampang)
- **S06-laporan-hasil-compliance-report-frs-v1.0.md** — Base FRS for S-06 Laporan Hasil
- **patient-report-redesign-spec.md** — Canonical patient report spec (header band, accreditation logo, footer, admin config)
- **patient-report-redesign-addendum-r5.md** — Accreditation-logo position config
- **environmental-lhu-preview.html** — HTML preview reference
- **openelis-style-guide-v2-patterns-inventory.md** — Carbon tokens and patterns
- **env-vector-lhu-review-2026-05-26.md** — Structural review that drove this v2.0 rewrite

### Accreditation Standards

- **ISO/IEC 17025:2017** — General requirements for the competence of testing and calibration laboratories (esp. §7.2 method validation, §7.8 reporting, §7.8.2.1(d)(l)(p), §7.8.3.1(a)(c), §7.8.5 sampling, §7.8.6.1 decision rules, §7.8.8 amendments)
- **ILAC-G8:09/2019** — Guidelines on Decision Rules and Statements of Conformity
- **KAN DP.01.34** — Persyaratan tambahan untuk akreditasi laboratorium pengujian/kalibrasi
- **ISO 15189:2022** — Medical laboratories §7.4.1.6(a) for accreditation-scope identification (referenced for §6.4 footnote pattern)

### Regulatory Standards (Indonesian Public Health Labs)

- **Peraturan Menteri Kesehatan RI No. 02 Tahun 2023** — Kesehatan Lingkungan
- **Peraturan Presiden RI No. 22/2021** — Baku Mutu Air
- **Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 68/2016** — Baku Mutu Air Limbah
- **SNI 6989.XX series** — Indonesian National Standards for water parameter testing
- **SNI 9099:2024** — Indoor air microbiology
- **KAN (Komite Akreditasi Nasional)** — ISO 17025 accreditation

### Related OpenELIS Specs

- **S-01 (OGC-528):** Compliance Standards Administration
- **S-02 (OGC-531):** Sampling Site Registry
- **S-03 (OGC-537):** Environmental Order Entry — ComplianceContext entity
- **S-05 (OGC-547):** Compliance Evaluation Engine — decision-rule-aware evaluation
- **S-06 (OGC-552):** Laporan Hasil base — certificate numbering, e-signature, audit trail
- **S-06b:** LH Delivery Notification (email/SMS)
- **E-Signature Spec:** electronic_signature table schema

---

## 16. i18n Keys (MessageResources additions)

All English text in the Environmental LHU is keyed for translation via OpenELIS MessageResources. Keys follow the camelCase convention established in patient-report-redesign-spec §8.

### Reused from patient-report-spec §8

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
| `accreditationCoverage` | Accreditation coverage |
| `about` | Page X of Y suffix |

### New keys — v1.0 originals (retained)

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

### NEW v2.0 keys (ISO 17025 §7.8 compliance + decision rule + uncertainty + subcontract + sampling + amendment)

| Key | EN | ID (Bahasa Indonesia) |
|---|---|---|
| `resultsApplyOnlyDisclaimer` | Test results apply only to the items tested | Hasil pengujian ini hanya berlaku untuk contoh yang diuji |
| `reproductionRestriction` | No part of this report may be reproduced without the written consent of the Laboratory | Dilarang menggandakan sebagian dari LHU ini tanpa izin tertulis dari Laboratorium |
| `endOfReport` | End of Report | Akhir Laporan |
| `decisionRule` | Decision rule | Aturan keputusan |
| `decisionRuleBinaryAcceptance` | Binary acceptance per ILAC-G8 | Penerimaan biner per ILAC-G8 |
| `decisionRuleGuardBanded` | Guard-banded (k=2) | Guard-banded (k=2) |
| `decisionRuleSharedRisk` | Shared risk per ILAC-G8 §4.3 | Risiko bersama per ILAC-G8 §4.3 |
| `expandedUncertainty` | Expanded uncertainty (U) | Ketidakpastian terluas (U) |
| `coverageFactor` | Coverage factor (k) | Faktor cakupan (k) |
| `samplingResponsibility` | Sampling responsibility | Tanggung jawab pengambilan |
| `samplingByLab` | Performed by Laboratory | Dilakukan oleh Laboratorium |
| `samplingByClient` | Performed by Customer | Dilakukan oleh Pelanggan |
| `samplingPlanReference` | Sampling plan reference | Referensi rencana pengambilan |
| `subcontractedTests` | Subcontracted tests | Pengujian disubkontrakkan |
| `methodValidationStatus` | Method validation status | Status validasi metode |
| `validated` | Validated | Tervalidasi |
| `verified` | Verified | Terverifikasi |
| `inHouseMethod` | In-house method | Metode in-house |
| `inHouseUnvalidatedMethod` | In-house unvalidated method | Metode in-house belum tervalidasi |
| `amendmentNotice` | Amendment notice | Pemberitahuan amandemen |
| `amendmentNumber` | Amendment No. | Amandemen No. |
| `supersedesLhu` | Supersedes LHU | Menggantikan LHU |
| `amendmentReason` | Amendment reason | Alasan amandemen |

---

## Appendix A — Indonesian Terms Glossary

For non-Indonesian reviewers and developers. The canonical LHU is rendered Indonesian-primary to match real Labkesmas (BBLKM) practice.

| Bahasa Indonesia | English / Meaning |
|---|---|
| Akreditasi | Accreditation |
| Akhir Laporan | End of Report |
| Amandemen | Amendment |
| Asal Contoh Uji | Sample origin / source |
| Aturan Keputusan | Decision rule |
| Baku Mutu | Quality standard / regulatory threshold |
| Diuji oleh | Tested by |
| Disahkan oleh | Approved by |
| Halaman X dari Y | Page X of Y |
| Hasil Pemeriksaan / Hasil Uji | Test result |
| Kadar Maksimum | Maximum permitted level |
| KAN | Komite Akreditasi Nasional |
| Kepala Instalasi | Department / unit head |
| Keterangan / Ket. | Note(s) |
| Ketidakpastian Terluas (U) | Expanded uncertainty |
| Faktor Cakupan (k) | Coverage factor |
| Lokasi Pengambilan | Sampling location |
| Metode | Test method |
| Parameter | Test parameter / analyte |
| Pengambil Contoh | Sample collector |
| Penyelia | Supervisor |
| Permenkes | Peraturan Menteri Kesehatan |
| Permen LHK | Peraturan Menteri Lingkungan Hidup dan Kehutanan |
| Petugas | Officer |
| Rencana Pengambilan | Sampling plan |
| Satuan | Unit |
| SNI | Standar Nasional Indonesia |
| Spesies | Species |
| Subkontrak | Subcontract |
| Tanggal Penerimaan | Date received |
| Tanggal Pengujian | Test date |
| Tanggung Jawab Pengambilan | Sampling responsibility |
| Telah diverifikasi oleh | Verified by |
| Telah divalidasi oleh | Validated by |
| Yth. | Kepada Yth. — Indonesian honorific |

---

**Document Status:** v2.0 ready for design review.
**Next Steps:** Stakeholder review, then push to `designs/vector-surveillance/environmental-lhu.md` on DIGI-UW/openelis-work. Mockup (.jsx) and preview (.html) updates to follow in a separate ticket.
