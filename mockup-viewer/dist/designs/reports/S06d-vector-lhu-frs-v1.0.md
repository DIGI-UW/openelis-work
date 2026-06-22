# Vector Laporan Hasil (LHU) — Feature Requirements Specification v1.0

## 1. Overview

The **Vector Laporan Hasil (LHU)** is a printable, Carbon-styled result report for vector surveillance samples in the Indonesian public health lab network (Labkesmas/BBLKM). It reports on entomological surveillance activities: mosquito species identification via PCR, larval/imaginal population surveys, and infection indices (dengue, malaria, Japanese encephalitis).

**Scope**: Extends the S06 Laporan Hasil baseline. Inherits letterhead, customer block, e-signature integration, and page footer. Introduces three flexible result-table modes and vector-specific data model touchpoints.

**Users**: Lab analysts (BBLKM), provincial epidemiologists, district vector control officers.

---

## 2. User Stories

### Story 1: Species ID Report
*As a BBLKM analyst, I want to print a report showing PCR-confirmed mosquito species from a trap event so that epidemiologists can verify species distribution in the district.*

**Acceptance**: Report shows specimen barcode, collection date/location, genus/species, PCR Ct value, quality flag (passed/failed), analyst signature.

### Story 2: Surveillance Indices Report
*As a provincial epidemiologist, I want to see Minimum Infection Rate (MIR) and collection density per district so that I can assess dengue risk and evaluate vector control effectiveness.*

**Acceptance**: Report shows MIR (infected pools per 1000 tested), infection rate per individual organism, collection density (organisms/trap/day), positive resolution %, accreditation flags, date range.

### Story 3: Population Count Report
*As a district vector control officer, I want a report summarizing larval habitat survey counts (house, container, Breteau indices) so that I can track seasonal trends and justify control resource allocation.*

**Acceptance**: Report shows survey type, index values, confidence flag, regional baseline comparison, analyst/supervisor signatures.

---

## 2.5 Configuration System Inheritance

The Vector LHU reuses the **patient-report-redesign configuration surface**—it does **not** introduce parallel keys. Specifically, it inherits these JRXML parameters:

- **`headerName`** (String) — subreport selector (default `GeneralHeader.jasper`). Controls which header template is rendered in the page header band (3-column grid: left logo / facility-meta / right logo).
- **`accreditationImage`** (InputStream, PNG/JPEG) — accreditation logo image passed to both header and sign-off bands.
- **`accreditationNumber`** (String) — accreditation registry number (e.g., "KAN LP-042-IDN").
- **`accreditationLogoPosition`** (String enum `TOP` | `BOTTOM`, default `BOTTOM`) — controls whether the accreditation logo appears in the page header (top slot) or the sign-off footer (bottom slot, default).

These parameters are configured globally in **Admin → General Configuration → Printed Reports Configuration** (see patient-report-redesign-spec §15 + addendum r5 §15.6). The same admin page surfaces control the Vector LHU's layout, ensuring deployments can standardize header/accreditation presentation across patient reports and vector LHUs without template-level changes.

---

## 3. Inheritance Map: S06 → Vector LHU

| Section | Status | Notes |
|---------|--------|-------|
| Lab Letterhead | Inherited from patient-report spec §7.1 / §7.1b | 3-column grid header band via `$P{headerName}` subreport, same parameters |
| Report Number | Modified | Format: `LHU-NNN.EN.XXX/SN/YYYY` where EN = Entomological, XXX = district code |
| Customer/Yth Block | Inherited as-is | Provincial health office or epidemiological unit |
| Report Header Info | Modified | Adds Vector Type, Surveillance Objective, Date Range (vs. single sample date in S06) |
| Sample Info Block | Modified | Maps to vector specimen fields: collection_lot, genus, species, lifecycle_stage, sex, condition, pool_id |
| Result Tables | **New** | Three modes: A (Species ID), B (Surveillance Indices), C (Population Counts) |
| Standards/References | Modified | Vector-specific: PCR assay SOP, WHO surveillance protocol, local Baku Mutu indices |
| Accreditation logo slot (top + bottom) | Inherited from patient-report spec §7.1b / §7.7a | Position-configurable via `$P{accreditationLogoPosition}` parameter |
| Admin config for printed-report layout | Inherited from patient-report spec §15.6 | Same `Admin → General Configuration → Printed Reports Configuration` page controls header + accreditation placement |
| Compliance Conclusion | Inherited as-is | KAN accreditation statement + /R suffix logic |
| E-Signature Block | Inherited as-is | electronic_signature table + timestamp |
| Page Footer | Inherited from patient-report spec §7.8 | "Halaman X dari Y" + QR code (optional) |

---

## 4. Vector-Specific Data Model

### VectorSpecimen Entity
```
VectorSpecimen
  - specimen_id (PK)
  - collection_lot_id (FK)
  - genus [Aedes | Anopheles | Culex | Mansonia | ...]
  - species (e.g., aegypti, albopictus, subpictus)
  - lifecycle_stage [EGG | LARVA | PUPA | NYMPH | ADULT | ENGORGED_ADULT]
  - sex [MALE | FEMALE | MIXED | UNKNOWN]
  - condition [VIABLE | DEAD | DAMAGED]
  - pool_number [X-Y notation for deconvolution: LABNO.X-Y]
  - count (organisms in pool/specimen)
  - pcr_ct_value (Ct or indeterminate)
  - pcr_target [gene_name: e.g., dengue NS5, malaria 18S]
  - infection_status [POSITIVE | NEGATIVE | INDETERMINATE]
  - quality_flag [PASSED | FAILED | BORDERLINE]
```

### SurveillanceMetrics (summarized per event or date range)
```
SurveillanceEvent
  - event_id (PK)
  - collection_lot_id (FK)
  - genus / species filter
  - total_pools_tested (count)
  - positive_pools (count)
  - mir = (positive_pools / total_pools_tested) × 1000
  - infection_rate_per_1000 (for deconvoluted individuals)
  - collection_density (organisms / trap / day)
  - positive_resolution_% (confidence metric)
  - date_range_start, date_range_end
```

### PopulationSurvey (larval indices)
```
LarvalSurvey
  - survey_id (PK)
  - survey_type [HOUSE | CONTAINER | BREEDING_SITE]
  - houses_examined (count)
  - houses_positive (count)
  - house_index = (houses_positive / houses_examined) × 100
  - containers_examined (count)
  - containers_positive (count)
  - container_index = (containers_positive / containers_examined) × 100
  - breteau_index = (containers_positive / houses_examined) × 100
  - collection_date, location_name, analyst_id
```

---

## 5. Result Table Modes

### Mode A: Species Identification (PCR)
**When**: Specimen-level molecular typing; confirms species from trap samples.

**Columns**:
| Kode Barcode | Tanggal Koleksi | Lokasi | Genus | Spesies | Target PCR | Ct Value | Status | Keterangan |
|---|---|---|---|---|---|---|---|---|
| 500133 | 2026-01-15 | Kelurahan X | *Aedes* | *aegypti* | dengue NS5 | 18.5 | Positif | Tersertifikat KAN |
| 500134 | 2026-01-15 | Kelurahan X | *Aedes* | *aegypti* | dengue NS5 | 31.2 | Positif* | – |
| 500135 | 2026-01-15 | Kelurahan X | *Aedes* | *albopictus* | dengue NS5 | Indetermin | Negatif | – |

**Notes**: 
- Ct < 30 = reliable; 30–37 = borderline; > 37 = negative.
- Keterangan carries per-parameter KAN asterisk (*) when accredited.
- Report-level /R suffix when all parameters accredited.

---

### Mode B: Surveillance Indices (Entomological Risk)
**When**: Aggregate risk assessment across multiple trap/pool events; supports epidemiological decision-making.

**Column Set 1: Indices Header**
| Objective | Start Date | End Date | Genus | Spesies | Geographic Coverage |
|---|---|---|---|---|---|
| Surveilans Endemis Dengue | 2026-01-01 | 2026-03-31 | *Aedes* | *aegypti* | Jakarta Barat |

**Column Set 2: Metrics Table**
| Metric | Value | Unit | Interpretasi |
|---|---|---|---|
| Total Pools Diuji | 157 | pools | – |
| Pools Positif | 23 | pools | – |
| MIR | 146.5 | per 1000 | Risiko Tinggi (>100) |
| Infection Rate / Individu | 8.7 | per 1000 organism | – |
| Kepadatan Koleksi | 12.3 | organism/trap/hari | High productivity |
| Positive Resolution % | 87.2 | % | High confidence |

**Notes**:
- MIR > 100 = high dengue risk; 50–100 = moderate; < 50 = low.
- Indices support epidemiological zoning and vector control resource allocation.
- Keterangan row shows accreditation flags.

---

### Mode C: Larval Population (Habitat Index)
**When**: Active surveillance via house-to-house larval surveys; tracks seasonal trends and breeding site density.

**Columns**:
| Survey Type | Houses Examined | Houses Positive | House Index % | Containers Examined | Containers Positive | Container Index % | Breteau Index % | Confidence | Keterangan |
|---|---|---|---|---|---|---|---|---|---|
| Survei Jentik Rutin | 450 | 92 | 20.4 | 1280 | 156 | 12.2 | 34.7 | Tinggi | Tersertifikat KAN* |

**Field Definitions**:
- **House Index** = (houses_positive / houses_examined) × 100. Target: < 5%.
- **Container Index** = (containers_positive / containers_examined) × 100. Target: < 5%.
- **Breteau Index** = (containers_positive / houses_examined) × 100. Target: < 5%.
- **Confidence**: Tinggi (high), Sedang (medium), Rendah (low).

---

## 6. Multi-LHU Bundling

A single Vector LHU report may bundle two sequential LHU numbers (e.g., covering multiple trapping events or survey rounds merged for epidemiological review):

```
Nomor Laporan: 201-220.EN.JKT/SN/2026 dan 221-240.EN.JKT/SN/2026
Periode: 2026-01-01 s.d. 2026-03-31
```

When bundled:
- Show both numbers in report header.
- Use single result table (data already aggregated by upstream backend).
- Compliance conclusion applies to entire bundle.
- Single signature block (analyst and supervisor sign once).

---

## 7. KAN Accreditation & Report Suffix

### Paper-conservation note (round 2)
The wide method/Metode column is removed from the result tables themselves and consolidated into a compact "Methods + Accreditation Coverage" footnote that renders below each mode's table. Per-parameter accreditation is shown as an asterisk on the parameter name (matches real Labkesmas convention); the issuing body and scope number live once per report in the footnote. This is the same paper-saving pattern used by the patient-report-redesign §7.6c "Accreditation coverage" block.

**Footnote shape (renders once per result table):**

> **Metode / Methods.** Inline list of `Parameter: method` pairs, semicolon-separated. (Mode A: PCR primer-spesifik. Mode B: pool deconvolution + RT-PCR. Mode C: house-to-house larval survey per WHO 2003.)
>
> **Akreditasi / Accreditation coverage.** Names the body + scope number (e.g., "KAN ISO/IEC 17025 — LP-XXX-IDN") and lists which rows fall within scope. Mode A and B's PCR rows are testing-accredited; Mode C field surveys are surveillance activities and explicitly note KAN does not apply.
>
> **Reference / Standards.** Permenkes / WHO entomological surveillance protocol citation.

**Inheritance.** Mirrors patient-report-redesign-addendum §4 (`accreditedTestsByBody` populator). The Vector LHU populator passes the same data structure; the JRXML wiring is parallel. No new keys.

### Per-Parameter Asterisk (*)
In Keterangan column: `*` denotes accredited parameter (still shown on the parameter name itself in Mode A/B; suppressed for Mode C indices because surveillance metrics are not accredited testing).

Example (Mode A):
```
Keterangan: Identifikasi Spesies Tersertifikat KAN*
```

### Report-Level /R Suffix
If **all** parameters in the report are accredited:
```
Nomor Laporan: 201-220.EN.JKT/SN/2026/R
```

Otherwise, omit /R; rely on per-parameter asterisks in result table.

---

## 7.5 Page Header Band & Accreditation Logo Placement

**Header band**: See patient-report-redesign-spec §7.1 (configurable subreport `$P{headerName}`, 3-column grid: left logo / facility-meta / right logo). The Vector LHU passes the same parameters (`headerName`, `accreditationImage`, `accreditationNumber`, `accreditationLogoPosition`); no LHU-specific markup.

**Top accreditation logo** (optional): See patient-report-redesign-addendum §7.1b. When `printedReport.accreditationLogoPosition = TOP`, the accreditation image + number render in a 4th column slot between the left header logo and center facility-meta block (coordinates `85 5 70 40` in JRXML). Activated by the parameter; suppresses bottom variant.

**Bottom accreditation logo** (default): See patient-report-redesign-addendum §7.7a. When `printedReport.accreditationLogoPosition = BOTTOM` or null (default), the accreditation image + number render floated right in the sign-off frame (coordinates `472 2 70 40`). Suppresses top variant.

---

## 8. Page Layout & Print Requirements

### A4 Portrait Dimensions
- Container: 794 × 1123 px (100% of A4 at 96 DPI).
- Margins: 20 mm top/bottom, 15 mm left/right.
- Font: IBM Plex Sans (Carbon default), 11pt body, 14pt headings.
- Line height: 1.5 (readability in print).

### Page Breaks
- Explicit page break after signature block.
- Multi-page reports: footer shows "Halaman X dari Y" and QR code (if implemented).
- Mode-specific result tables do not break mid-table; move to next page if insufficient space.

### Print CSS
```css
@media print {
  body { margin: 0; }
  .page-break { page-break-after: always; }
  .no-print { display: none; }
  .signature-block { margin-top: 2rem; }
}
```

---

## 9. Mode Selection Logic

**Backend-Driven**: OpenELIS application determines which mode to render based on:
1. **Sample data presence**: If PCR Ct values present → Mode A.
2. **Aggregate metrics present**: If MIR/infection_rate_per_1000/density fields → Mode B.
3. **Larval survey data present**: If house/container/Breteau indices → Mode C.

**Frontend**: VectorLHU component receives `mode` prop and result data; renders appropriate result table and metrics summary.

---

## 10. Bilingual Labeling

**Primary**: Indonesian (Bahasa Indonesia).
**Secondary**: English subtitles or field descriptions in smaller font.

Example:
```
Genus Nyamuk (Mosquito Genus): Aedes
Spesies (Species): aegypti
```

---

## 11. E-Signature Integration

Uses existing OpenELIS `electronic_signature` table. Vector LHU includes:
- **Analyst** (Lab analyst who performed testing/analysis).
- **Supervisor** (Lab supervisor or QA lead who reviewed results).
- **Timestamp** (ISO 8601, with timezone).

Signature block layout inherited from S06; content unchanged.

---

## 12. Sample Matrix Variants

Vector LHU supports three collection substrate types (unlike Environmental LHU which supports 5+):

| Matrix Type | Example Specimen | Mode(s) | Notes |
|---|---|---|---|
| Trap Sample (adult) | Ovitrap, CDC bottle trap | A, B | PCR ID and surveillance indices |
| Larval Sample | House breeding site | C | Larval population indices |
| Pool Sample | Deconvoluted pool | A, B | Multi-organism pools for MIR calculation |

---

## 13. Edge Cases & Constraints

1. **Missing Ct Value**: Show as "Indetermin" (indeterminate) in Mode A; mark quality_flag FAILED.
2. **Zero Positive Pools**: MIR = 0 per 1000; Interpretasi = "Tidak terdeteksi risiko" (no risk detected).
3. **Single-Specimen Mode B**: If only one pool tested, calculate MIR = 1000 (100% positive); flag with note "Interpretasi terbatas pada sampel tunggal" (limited interpretation on single sample).
4. **Mixed-Sex Pool**: lifecycle_stage = MIXED; sex = MIXED; do not attempt to disambiguate.
5. **Damaged Specimen**: condition = DAMAGED; include in count but note in Keterangan "Spesimen rusak" (damaged specimen).

---

## 14. Real-World Data & Synthesis Notes

**Real LHU**: One Aedes aegypti PCR report from BBLKM Jakarta (Jan 2026, Kelurahan X) provided in crosswalk (LHU 201-374). Mode A deliverable uses this specimen data directly.

**Synthesized Data**:
- **Mode B** (Surveillance Indices): Derived from vector-surveillance-reporting.md metrics formulas; plausible Jakarta district dengue surveillance aggregation (23 positive pools from 157 tested; Jan–Mar 2026 timeframe).
- **Mode C** (Larval Population): Synthesized from WHO larval survey protocols; plausible Jakarta urban environment house/container/Breteau indices; Indonesian context.

Both modes marked clearly as synthesized examples in mockup and preview.

---

## 15. Acceptance Criteria

- [ ] FRS sections map explicitly to S06 inheritance.
- [ ] Three modes (A, B, C) are fully specified with example data and column definitions.
- [ ] Vector specimen and surveillance metrics data model sections map to upstream entities.
- [ ] KAN accreditation logic (per-parameter asterisk + report /R suffix) matches S06 baseline.
- [ ] Multi-LHU bundling scenario is documented.
- [ ] Page layout / print CSS meets A4 portrait specification.
- [ ] Mode selection logic is documented.
- [ ] Edge cases (missing Ct, zero positives, single specimen) are addressed.
- [ ] Real vs. synthesized data is clearly noted.

### Configuration & Accreditation Logo Position

- [ ] **AC20**: When `accreditationLogoPosition = BOTTOM` (default), the Vector LHU's sign-off block renders the accreditation image + number floated right; the top header slot suppresses. Behavior is identical to patient-report-redesign pattern.
- [ ] **AC21**: When `accreditationLogoPosition = TOP`, the Vector LHU's header band expands to 4 columns (left logo / accreditation logo / center facility-meta / right logo), and the accreditation image + number render between the left logo and center meta block; the bottom sign-off slot suppresses.
- [ ] **AC22**: The Vector LHU does not introduce new keys to the `printedReport.*` config namespace. It reuses `accreditationLogoPosition`, `accreditationImage`, `accreditationNumber`, and `headerName` from the patient-report-redesign admin configuration page.

---

## 16. Open Questions

1. Should Mode B report show historical baseline indices for comparison (e.g., "Jakarta 5-year average MIR = 82")?
2. Is QR code on page footer required for Vector LHU (as per S06 enhancement)?
3. Should positive_resolution_% threshold trigger a warning or note if < 75%?

---

## References

- **S06 Laporan Hasil FRS** — baseline inheritance
- **patient-report-redesign-spec.md** — Canonical patient report spec. Vector LHU inherits header band (§7.1), accreditation logo placement logic (§7.1b / §7.7a), admin config surface (§15), and page footer (§7.8).
- **patient-report-redesign-addendum-r5.md** — Round 5 addendum clarifying accreditation-logo position config (§7.1b TOP variant, §7.7a BOTTOM default, §15.6 admin config). Vector LHU reuses this parameter set.
- **S06d-vector-lhu-preview.html** — HTML preview demonstrating configurable header + accreditation logo position toggle; reference for JSX mockup pattern.
- **V01 Vector Specimen Types Taxonomy** — data model
- **Vector Surveillance Reporting** — metrics definitions
- **WHO Entomological Surveillance Protocols** — standards reference
- **KAN Accreditation Requirements** — Indonesian standards

---

## 17. i18n Keys (MessageResources additions)

All English text in the Vector LHU is keyed for translation via OpenELIS MessageResources. Keys follow the camelCase convention established in patient-report-redesign-spec §8. When wiring the JRXML or Carbon React report template, devs will use these keys to localize the UI.

### Reused from patient-report-spec §8

The following keys are already defined in `MessageResources_*.properties` and reused without change:

| Key | EN |
|---|---|
| `test` | Test |
| `status` | Status |
| `date` | Date |
| `note` | Note |
| `about` | Page X of Y suffix |

### New keys to add to MessageResources_*.properties

These keys are specific to the Vector LHU and do not exist in the patient-report spec. Add to all language bundles (minimum: English, Bahasa Indonesia, French).

| Key | EN | ID (Bahasa Indonesia) |
|---|---|---|
| `inspectionResultReportTitle` | Inspection Result Report | LAPORAN HASIL PEMERIKSAAN |
| `reportNumber` | Report Number | Nomor Laporan |
| `reportDate` | Report Date | Tanggal Laporan |
| `sampleBarcode` | Sample Barcode | Kode Barcode |
| `collectionDate` | Collection Date | Tanggal Koleksi |
| `location` | Location | Lokasi |
| `genus` | Genus | Genus |
| `species` | Species | Spesies |
| `pcrTarget` | PCR Target | Target PCR |
| `ctValue` | Ct Value | Ct Value |
| `speciesIdentification` | Species Identification Results | Hasil Identifikasi Spesies |
| `surveillanceObjective` | Surveillance Objective | Tujuan Surveilans |
| `endemicDengueSurveillance` | Endemic Dengue Surveillance | Surveilans Endemis Dengue |
| `totalPoolsTested` | Total Pools Tested | Total Pools Diuji |
| `positivePools` | Positive Pools | Pools Positif |
| `minimumInfectionRate` | Minimum Infection Rate (MIR) | Minimum Infection Rate (MIR) |
| `infectionRatePer1000` | Infection Rate per 1000 organisms | Laju Infeksi per 1000 Organisme |
| `collectionDensity` | Collection Density | Kepadatan Koleksi |
| `positiveResolutionPct` | Positive Resolution % | Positive Resolution % |
| `highRisk` | High Risk | Risiko Tinggi |
| `moderate` | Moderate | Moderat |
| `highConfidence` | High Confidence | Kepercayaan Tinggi |
| `houseIndex` | House Index | House Index |
| `containerIndex` | Container Index | Container Index |
| `breteauIndex` | Breteau Index | Breteau Index |
| `housesExamined` | Houses Examined | Rumah Diperiksa |
| `housesPositive` | Houses Positive | Rumah Positif |
| `containersExamined` | Containers Examined | Kontainer Diperiksa |
| `containersPositive` | Containers Positive | Kontainer Positif |
| `confidence` | Confidence | Kepercayaan |

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
