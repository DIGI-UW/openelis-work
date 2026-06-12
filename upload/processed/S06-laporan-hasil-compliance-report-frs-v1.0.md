# Laporan Hasil — Compliance Report (Sertifikat Hasil Uji)
## Functional Requirements Specification — v1.0 (amended 2026-04-28)

**Version:** 1.0 (amended in place 2026-04-28)
**Date:** 2026-04-05 · amended 2026-04-28
**Status:** Draft for Review
**Jira:** [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))

> **⚠️ 2026-04-28 amendment — multi-regulation + multi-component rendering.**
> S-03 v2.0 was amended same day to support ≥1 compliance standard per order via the `order_compliance_standard` join. S-05 v2.0 was amended to evaluate per regulation × component. This certificate spec amends accordingly:
>
> - **Header lists all selected regulations** in `selectionOrder` from the order's `order_compliance_standard` join. Each regulation gets its own header line: regulation number (monospace) + standard name + issuing body + version. No "primary" — they're stacked equally.
> - **Per-result section**: each result row shows compliance per regulation as a small grouped pattern. Visual: per-result table cell renders `[PP 22/2021: ✓ Pass · ≤25 NTU] [WHO-DWG-4: ⚠ Marginal · ≤5 NTU]`. If a regulation has no applicable threshold for that test, render `[WHO-DWG-4: — no threshold]` in muted text. Mirrors S-05 v2.0 §4.4 threshold-source list and §4.5 inline indicator patterns.
> - **Multi-component tests** render one row per (test, component) — the existing single-row-per-result rendering generalizes. Component label appears as a sub-row indent. Each component evaluates independently per regulation.
> - **Repeated readings** (e.g., noise survey with N readings around a building) render as a sub-table grouped by `reading_group_id`. Each reading shows its own component values + per-regulation flags.
> - **QC Summary section** unchanged from S-08 v2.0 amendment — sits below the per-result section, lists batch QC samples + their evaluation outcomes. Independent of the multi-regulation amendment.
>
> Data contract additions: report generator reads `order_compliance_standard` rows for the header, and for each result reads the list of (flag, source) tuples returned by S-05 v2.0's evaluator (one per applicable regulation × component).
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`), PDF generation (server-side)
**Related Modules:** Compliance Standards Administration (S-01, OGC-528), Sampling Site Registry (S-02, OGC-531), Environmental Order Entry (S-03, OGC-537), Compliance Evaluation Engine (S-05, OGC-547), Report-Level Electronic Signatures, Patient Report Print Queue

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Scope & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
   - 5.1 Report Print Configuration (Shared)
   - 5.2 Report Generation Page
   - 5.3 PDF Certificate Structure
   - 5.4 E-Signature Integration
   - 5.5 Batch Generation & Download
   - 5.6 Audit Trail
6. Data Model
7. API Endpoints
8. UI Design
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria

---

## 1. Executive Summary

The Laporan Hasil (S-06) adds a formal compliance report generation capability to OpenELIS Global, completing the end-to-end environmental compliance workflow: order → test → evaluate → report. When all results on an environmental order have been validated and released, the order becomes eligible for Sertifikat Hasil Uji (Test Results Certificate) generation — a formal PDF document matching Indonesian regulatory requirements under PP No. 22/2021 and KAN/ISO 17025 accreditation standards.

The feature introduces two components. First, a shared **Report Print Configuration** admin page (Admin → Report Configuration) where lab administrators configure header/footer elements — lab name, logo, accreditation number, address, page numbering, and footer text — that are inherited by the Laporan Hasil and can be consumed by all other printed reports in the system. Second, a dedicated **Reports → Laporan Hasil** page where users filter eligible orders by date range, site, standard, and compliance status, then generate individual certificate PDFs or batch-download a ZIP of multiple certificates.

Each certificate includes a header block (lab identity from shared config), sample information (from `complianceContext`), a results table with compliance evaluations (from `ComplianceEvaluation` records), an overall compliance conclusion, and a dual e-signature block (Tested by / Validated and Released by) using the existing electronic signature infrastructure.

---

## 2. Problem Statement

**Current state:** OpenELIS Global has no mechanism to produce formal compliance test certificates for environmental samples. After a technician enters results and a validator releases them, the compliance evaluation data exists in the database (via S-05) but there is no way to generate the official regulatory document that Indonesian labs must provide to clients, regulators, and accreditation bodies. Additionally, there is no centralized configuration for common report elements (lab name, logo, accreditation number) — each report template currently hardcodes or independently manages these values.

**Impact:** Without automated certificate generation, lab staff must manually transcribe validated results into external templates (Word, Excel, or paper forms). This is slow, error-prone, and breaks the audit trail. It also means the compliance evaluation data computed by S-05 is not reflected on the official document. KAN-accredited environmental labs (ISO 17025) are required to produce traceable, reproducible test certificates with electronic signatures — manual transcription fails this requirement. The lack of shared print configuration means that when lab details change (new accreditation number, address update), every report template must be updated independently.

**Proposed solution:** A dedicated report generation page under Reports → Laporan Hasil that queries fully-validated environmental orders, presents them in a filterable DataTable, and generates formal Sertifikat Hasil Uji PDFs on demand. The PDF layout follows Indonesian regulatory conventions and pulls header/footer elements from a new shared Report Print Configuration. E-signatures are rendered using the existing electronic signature data model. A shared admin page for print configuration ensures lab identity is managed in one place and inherited by all reports.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- Shared Report Print Configuration (Admin → Report Configuration) for lab identity, logo, accreditation, header/footer elements
- Report generation page (Reports → Laporan Hasil) with filters and batch selection
- PDF generation of individual Sertifikat Hasil Uji per order
- PDF structure: header, sample info, regulatory reference, results table, compliance conclusion, e-signature block
- E-signature integration using existing `electronic_signature` table
- Batch PDF generation producing a ZIP file of individual certificates
- Generation audit trail (who generated, when, which orders)
- Report numbering (sequential certificate number per site per year)

### 3.2 Non-Goals

- **3.2.1** Inline PDF preview/renderer in the browser — user downloads and opens in their PDF viewer
- **3.2.2** Consolidated multi-order reports — each order produces one PDF
- **3.2.3** Email/distribution workflow — future enhancement
- **3.2.4** Report template customization UI — future enhancement (v1.0 uses a fixed layout)
- **3.2.5** Non-environmental reports — the Laporan Hasil page only handles environmental compliance certificates. Clinical patient reports use the existing Patient Report pipeline.
- **3.2.6** Cryptographic PDF signing (PKI) — out of scope per the existing e-signature spec
- **3.2.7** Re-generation restrictions — users may regenerate a certificate at any time (each generation is logged)

---

## 4. User Roles & Permissions

| Role | View Report Page | Generate PDF | Configure Print Settings | Notes |
|---|---|---|---|---|
| Lab Technician | Yes | Yes | No | Can view and generate for orders they have access to |
| Lab Manager | Yes | Yes | No | Can view and generate for all orders in their lab unit |
| Reporting Clerk | Yes | Yes | No | Primary user — batch generation workflow |
| System Administrator | Yes | Yes | Yes | Full access including Report Print Configuration |

**Required permission keys:**

- `compliance.report.view` — Access the Laporan Hasil report page and view eligible orders
- `compliance.report.generate` — Generate PDF certificates (single or batch)
- `report.config.view` — View the Report Print Configuration page
- `report.config.modify` — Edit report print configuration settings (logo, header, footer, etc.)

---

## 5. Functional Requirements

### 5.1 Report Print Configuration (Shared)

**LH-1-001:** The system SHALL provide an admin page at **Admin → Report Configuration** where authorized users can manage shared print settings that are inherited by all printed reports in the system.

**LH-1-002:** The Report Print Configuration SHALL include the following settings:

| Setting | Type | Required | Default | Notes |
|---|---|---|---|---|
| Lab Name | Text (255) | Yes | — | Official laboratory name as it appears on reports |
| Lab Subtitle | Text (255) | No | — | Secondary line (e.g., "Environmental Testing Division") |
| Lab Address Line 1 | Text (255) | Yes | — | Street address |
| Lab Address Line 2 | Text (255) | No | — | City, province, postal code |
| Lab Phone | Text (50) | No | — | Contact phone number |
| Lab Email | Text (100) | No | — | Contact email |
| Lab Website | Text (255) | No | — | Lab website URL |
| Accreditation Number | Text (100) | No | — | e.g., "KAN LP-XXX-IDN" |
| Accreditation Body | Text (100) | No | "KAN" | Name of accrediting body |
| Lab Logo | Image (PNG/JPG) | No | — | Uploaded image, max 500KB, rendered in PDF header |
| Accreditation Logo | Image (PNG/JPG) | No | — | Uploaded image (e.g., KAN logo), max 500KB |
| Report Footer Text | Text (500) | No | — | Custom footer text for all reports (e.g., disclaimer) |
| Show Page Numbers | Boolean | Yes | true | Whether "Page X of Y" appears on multi-page reports |
| Page Number Format | Enum | Yes | `PAGE_X_OF_Y` | Options: `PAGE_X_OF_Y`, `PAGE_X`, `NONE` |
| Date Format | Enum | Yes | `DD/MM/YYYY` | Date display format on printed reports |
| Certificate Number Prefix | Text (20) | No | "LHU" | Prefix for auto-generated certificate numbers |

**LH-1-003:** Settings SHALL be stored in the existing `site_information` table using the key prefix `report.config.*` (e.g., `report.config.labName`, `report.config.labLogo`). This follows the established OpenELIS configuration pattern.

**LH-1-004:** Logo images SHALL be stored as base64-encoded values in `site_information` or as file references in the server filesystem (implementation choice). The API SHALL return logo data as a base64 data URI for PDF rendering.

**LH-1-005:** Changes to Report Print Configuration SHALL take effect immediately for all subsequently generated reports. Previously generated PDFs are not retroactively updated.

**LH-1-006:** The admin page SHALL use the standard Carbon DataTable + inline row expansion pattern (per Constitution Principle 3), with settings grouped into sections: Lab Identity, Accreditation, Page Layout, Numbering.

**LH-1-007:** The system SHALL validate uploaded logo images: file types limited to PNG and JPG, maximum file size 500KB, recommended dimensions displayed as helper text (e.g., "Recommended: 200×80px").

### 5.2 Report Generation Page

**LH-2-001:** The system SHALL provide a report page at **Reports → Laporan Hasil** that displays a DataTable of environmental orders eligible for certificate generation.

**LH-2-002:** An order is **eligible** for Laporan Hasil generation when ALL of the following are true:
- The order has a non-null `complianceContext` (i.e., it is an environmental order linked to a compliance standard via S-03)
- ALL results on the order have been validated and released (status = `Released`)
- ALL results with compliance thresholds have a `ComplianceEvaluation` record with a status other than `PENDING`

**LH-2-003:** The report page toolbar SHALL provide the following filters:

| Filter | Component | Behavior |
|---|---|---|
| Date Range | DatePicker (from/to) | Filters by order collection date; default: last 30 days |
| Sampling Site | ComboBox (searchable) | Filters by site from S-02 registry; "All Sites" default |
| Compliance Standard | ComboBox (searchable) | Filters by standard from S-01; "All Standards" default |
| Compliance Status | Select | Options: All, All Compliant, Has Issues (marginal or fail), Non-Compliant (has fail) |
| Generation Status | Select | Options: All, Not Yet Generated, Previously Generated |

**LH-2-004:** The DataTable SHALL display the following columns:

| Column | Content | Sort |
|---|---|---|
| (checkbox) | Batch selection | — |
| Lab Number | Order lab number (e.g., "ENV-2026-001") | Yes |
| Site | Sampling site name, site ID below | Yes |
| Standard | Compliance standard short name | Yes |
| Collection Date | From `complianceContext.collectionDateTime` | Yes (default desc) |
| Tests | Count of tests on the order | No |
| Compliance | Aggregate status: "All Compliant" (green Tag), "Issues Found" (red Tag), counts | No |
| Last Generated | Timestamp of most recent PDF generation, or "—" if never | Yes |
| Actions | "Generate PDF" button | — |

**LH-2-005:** The DataTable SHALL support Carbon batch actions via `TableBatchActions`. When one or more rows are selected, a batch toolbar SHALL appear with:
- "Generate PDFs" button — generates individual PDFs for each selected order
- "Download ZIP" button — generates all selected PDFs and packages them into a single ZIP download
- Selected count display (e.g., "3 items selected")

**LH-2-006:** Clicking "Generate PDF" on a single row SHALL immediately trigger server-side PDF generation and initiate a browser download of the PDF file. The filename SHALL follow the pattern: `LHU-{certificateNumber}_{siteCode}_{labNumber}.pdf` (e.g., `LHU-2026-0042_SITE-042_ENV-2026-001.pdf`).

**LH-2-007:** Each row SHALL be expandable (inline row expansion) to show a compliance summary preview before generation:
- Site name, site ID, GPS coordinates
- Standard name and version
- Collection date/time, sample types, collection method
- Compliance evaluation summary: parameter name, result, threshold, status (mini-table)
- E-signature status: names and timestamps of analyst and validator

**LH-2-008:** The page SHALL display a summary bar above the DataTable showing aggregate counts: total eligible orders, how many have been generated vs. not yet generated.

### 5.3 PDF Certificate Structure (Sertifikat Hasil Uji)

**LH-3-001:** Each generated PDF SHALL follow this structure:

**Header Block** (from Report Print Configuration):
```
┌──────────────────────────────────────────────────────────────────┐
│ [Lab Logo]                                    [Accreditation Logo]│
│                                                                   │
│              {Lab Name}                                           │
│              {Lab Subtitle}                                       │
│              {Lab Address Line 1}                                 │
│              {Lab Address Line 2}                                 │
│              {Phone} | {Email} | {Website}                        │
│              Accreditation: {Accreditation Number}                 │
├──────────────────────────────────────────────────────────────────┤
│  SERTIFIKAT HASIL UJI / TEST RESULTS CERTIFICATE                 │
│  Certificate No: {CertificateNumberPrefix}-{YYYY}-{SeqNum}       │
│  Date of Issue: {generationDate}                                  │
└──────────────────────────────────────────────────────────────────┘
```

**LH-3-002:** Sample Information Block (from `complianceContext`):

| Field | Source |
|---|---|
| Sample Description | Sample type names from order |
| Sampling Site | `complianceContext.siteName` |
| Site Code | `complianceContext.siteCode` |
| GPS Coordinates | `complianceContext.siteGps` |
| Collection Date/Time | `complianceContext.collectionDateTime` |
| Collection Method | `complianceContext.collectionMethod` |
| Received Date/Time | Order received timestamp |
| Regulatory Reference | `complianceContext.regulatoryReference` |
| Standard | `complianceContext.standardName` (version) |

**LH-3-003:** Collection Conditions Block (from `complianceContext.conditions`, shown only when at least one field is non-null):

| Field | Source |
|---|---|
| Water Temperature | `conditions.waterTemperature` °C |
| Ambient Temperature | `conditions.ambientTemperature` °C |
| Weather Conditions | `conditions.weatherConditions` |
| Preservation Method | `conditions.preservationMethod` |
| Field Notes | `conditions.fieldNotes` |

**LH-3-004:** Results Table — the core of the certificate:

| Column | Content |
|---|---|
| No. | Sequential row number |
| Parameter | Test name |
| Method | Test method (from test catalog) |
| Unit | Result unit |
| Result | Numeric value or descriptive tag text |
| Regulatory Limit | Threshold value(s) from ComplianceThreshold |
| Status | "Memenuhi" (Compliant) / "Mendekati Batas" (Marginal) / "Tidak Memenuhi" (Non-Compliant) |

**LH-3-005:** Results in the table SHALL be grouped by parameter group (e.g., "Physical Parameters," "Chemical Parameters — Inorganic," "Microbiological Parameters") with group headers as sub-headings.

**LH-3-006:** Results with a compliance status of FAIL SHALL be visually emphasized — bold text and a marker symbol (e.g., "✗") in the Status column. PASS results use a checkmark ("✓"). MARGINAL results use a warning symbol ("⚠").

**LH-3-007:** If any compliance evaluation was overridden (via S-05), the Status column SHALL display the override status with an asterisk (*). A footnote at the bottom of the results table SHALL read: "* Status overridden by {overrideBy} on {overrideAt}. Justification: {overrideJustification}"

**LH-3-008:** Compliance Conclusion Block — below the results table:

- **If ALL evaluations are PASS:** "Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu sesuai {standardName}." / "Based on the test results, all parameters meet the quality standards per {standardName}."
- **If ANY evaluation is FAIL:** "Berdasarkan hasil pengujian, {N} parameter tidak memenuhi baku mutu sesuai {standardName}." / "Based on the test results, {N} parameters do not meet the quality standards per {standardName}." Followed by a list of non-compliant parameter names.
- **If MARGINAL but no FAIL:** "Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu, namun {N} parameter mendekati batas sesuai {standardName}." / "Based on the test results, all parameters meet the quality standards, however {N} parameters are approaching limits per {standardName}."

**LH-3-009:** The conclusion text SHALL be bilingual (Indonesian primary, English secondary) to support both domestic and international reporting needs.

### 5.4 E-Signature Integration

**LH-4-001:** The PDF footer SHALL include a dual e-signature block using data from the existing `electronic_signature` table:

```
┌────────────────────────────┬────────────────────────────┐
│  Diuji oleh / Tested by:   │  Disahkan oleh / Approved: │
│                             │                            │
│  {analyst_name}             │  {validator_name}           │
│  {analyst_title}            │  {validator_title}          │
│  {entry_timestamp}          │  {validation_timestamp}     │
│                             │                            │
│  Meaning: Authored          │  Meaning: Validated and     │
│                             │  Released                   │
├─────────────────────────────┴────────────────────────────┤
│  — Ditandatangani secara elektronik / Electronically     │
│    Signed —                                               │
│  {Report Footer Text from config}                         │
└──────────────────────────────────────────────────────────┘
```

**LH-4-002:** The "Tested by" signer SHALL be determined by finding the e-signature record with `signature_meaning = 'Authored'` associated with the results on the order. If multiple analysts authored different results, the system SHALL list all unique analysts.

**LH-4-003:** The "Approved by" signer SHALL be determined by finding the e-signature record with `signature_meaning = 'Validated and Released'` associated with the results on the order.

**LH-4-004:** If e-signatures are disabled at the site level (per the existing e-signature spec's configuration), the signature block SHALL fall back to blank signature lines with "Tested by:" and "Approved by:" labels for manual signing after printing.

**LH-4-005:** The signature block SHALL include the "Electronically Signed" indicator text per §11.50 requirements, consistent with the Report-Level Electronic Signatures spec.

### 5.5 Batch Generation & Download

**LH-5-001:** When the user selects multiple orders and clicks "Download ZIP," the system SHALL:
1. Generate individual PDF certificates for each selected order (server-side)
2. Package all PDFs into a single ZIP archive
3. Initiate browser download of the ZIP file
4. Log each generation individually in the audit trail

**LH-5-002:** The ZIP filename SHALL follow the pattern: `Laporan_Hasil_{YYYY-MM-DD}_{count}certificates.zip`

**LH-5-003:** During batch generation, the UI SHALL display a progress indicator (Carbon `Loading` or `ProgressBar`) showing N of M certificates generated.

**LH-5-004:** If any individual PDF generation fails during batch processing, the system SHALL continue generating remaining certificates, include a `_ERRORS.txt` file in the ZIP listing failed order numbers and error reasons, and display an `InlineNotification` (kind="warning") after download.

### 5.6 Audit Trail

**LH-6-001:** Every PDF generation event SHALL create an immutable audit record containing:

| Field | Value |
|---|---|
| Event type | `COMPLIANCE_REPORT_GENERATED` |
| Order ID | The order for which the certificate was generated |
| Certificate number | The assigned sequential certificate number |
| Generated by | Username of the user who triggered generation |
| Generated at | Timestamp |
| File hash | SHA-256 hash of the generated PDF (for integrity verification) |

**LH-6-002:** The "Last Generated" column in the DataTable SHALL display the timestamp from the most recent audit record for that order.

**LH-6-003:** Previously generated certificates SHALL be re-generable at any time. Each generation creates a new audit record. The certificate number remains the same for re-generations of the same order (it is assigned on first generation and reused).

---

## 6. Data Model

### New Entities

**ReportPrintConfig**

Stored in the existing `site_information` table using key prefix `report.config.*`:

| Key | Type | Default | Notes |
|---|---|---|---|
| `report.config.labName` | String | — | Lab name |
| `report.config.labSubtitle` | String | null | Secondary line |
| `report.config.addressLine1` | String | — | Address line 1 |
| `report.config.addressLine2` | String | null | City/province/postal |
| `report.config.phone` | String | null | Phone |
| `report.config.email` | String | null | Email |
| `report.config.website` | String | null | URL |
| `report.config.accreditationNumber` | String | null | e.g., "KAN LP-XXX-IDN" |
| `report.config.accreditationBody` | String | "KAN" | Accrediting body |
| `report.config.labLogo` | String (base64) | null | Encoded logo image |
| `report.config.accreditationLogo` | String (base64) | null | Encoded accreditation logo |
| `report.config.footerText` | String | null | Custom footer |
| `report.config.showPageNumbers` | Boolean | true | Page number toggle |
| `report.config.pageNumberFormat` | String | "PAGE_X_OF_Y" | Format enum |
| `report.config.dateFormat` | String | "DD/MM/YYYY" | Date format |
| `report.config.certificatePrefix` | String | "LHU" | Certificate number prefix |

**ComplianceReportAudit**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| orderId | Long | Yes | FK to Order |
| certificateNumber | String (50) | Yes | e.g., "LHU-2026-0042" |
| generatedBy | String | Yes | Username |
| generatedAt | Timestamp | Yes | Generation timestamp |
| fileHash | String (64) | Yes | SHA-256 of generated PDF |
| fileSize | Long | Yes | PDF file size in bytes |
| complianceStatus | Enum | Yes | COMPLIANT, MARGINAL, NON_COMPLIANT — overall status at generation time |
| parameterCount | Integer | Yes | Total parameters evaluated |
| passCount | Integer | Yes | Parameters with PASS status |
| marginalCount | Integer | Yes | Parameters with MARGINAL status |
| failCount | Integer | Yes | Parameters with FAIL status |

**CertificateNumberSequence**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| siteId | Long | Yes | FK to SamplingSite (or null for global sequence) |
| year | Integer | Yes | Calendar year |
| lastNumber | Integer | Yes | Last assigned sequence number |

**Uniqueness constraint:** (`siteId`, `year`) must be unique.

### Modified Entities

None — S-06 reads from existing entities (Order, ComplianceEvaluation, SamplingSite, ComplianceStandard, electronic_signature) but does not modify them.

---

## 7. API Endpoints

### Report Print Configuration

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/report-config` | Get all report print configuration settings | `report.config.view` |
| PUT | `/api/v1/report-config` | Update report print configuration settings (bulk) | `report.config.modify` |
| POST | `/api/v1/report-config/logo` | Upload lab logo image | `report.config.modify` |
| POST | `/api/v1/report-config/accreditation-logo` | Upload accreditation logo image | `report.config.modify` |
| DELETE | `/api/v1/report-config/logo` | Remove lab logo | `report.config.modify` |
| DELETE | `/api/v1/report-config/accreditation-logo` | Remove accreditation logo | `report.config.modify` |

### Laporan Hasil Report

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance/reports/eligible-orders` | List orders eligible for Laporan Hasil generation, with filters | `compliance.report.view` |
| GET | `/api/v1/compliance/reports/eligible-orders/{orderId}/preview` | Get compliance summary preview for a single order (expanded row data) | `compliance.report.view` |
| POST | `/api/v1/compliance/reports/generate` | Generate PDF for a single order; returns PDF binary | `compliance.report.generate` |
| POST | `/api/v1/compliance/reports/generate-batch` | Generate PDFs for multiple orders; returns ZIP binary | `compliance.report.generate` |
| GET | `/api/v1/compliance/reports/audit?orderId={id}` | Get generation audit history for an order | `compliance.report.view` |

### Generate Request Body

```json
{
  "orderId": 6789
}
```

### Generate Batch Request Body

```json
{
  "orderIds": [6789, 6790, 6791]
}
```

### Eligible Orders Response

```json
{
  "orders": [
    {
      "orderId": 6789,
      "labNumber": "ENV-2026-001",
      "siteName": "Intake Point A — Citarum River",
      "siteCode": "SITE-042",
      "standardName": "PP No. 22/2021 — Drinking Water Quality",
      "collectionDate": "2026-04-04T07:30:00+07:00",
      "testCount": 5,
      "complianceStatus": "NON_COMPLIANT",
      "passCount": 3,
      "marginalCount": 1,
      "failCount": 1,
      "lastGeneratedAt": null,
      "certificateNumber": null
    }
  ],
  "totalCount": 1,
  "generatedCount": 0,
  "notGeneratedCount": 1
}
```

---

## 7a. Domain Variants (S06c, S06d)

S06 specifies the **base** Laporan Hasil compliance report — letterhead, customer block, dates timeline, signature/verification block, page footer, certificate-numbering, e-signature integration, and audit trail. These are the chassis. Two **domain-specific variants** plug their own result-table shapes into the same chassis without forking the configuration surface or the parameter list:

| Sibling FRS | Scope | Key divergence | Files |
|---|---|---|---|
| **S06c — Environmental LHU** (`S06c-environmental-lhu-frs-v1.0.md`) | Environmental samples — water (air minum, air limbah), food (pangan/makanan), ambient air (udara ruang), surface swabs (usap), physical conditions (pencahayaan, kebisingan, kelembaban) | Result table columns `No. \| Parameter \| Hasil Uji \| Baku Mutu \| Satuan \| Ket.` (Metode column dropped; methods in compact footnote). Multi-matrix bundling supported. KAN per-parameter asterisk; methods + accreditation coverage as compact footnote. | `S06c-environmental-lhu-preview.html`, `S06c-environmental-lhu-preview-annotated.html`, `S06c-environmental-lhu-mockup.jsx` |
| **S06d — Vector LHU** (`S06d-vector-lhu-frs-v1.0.md`) | Vector surveillance — mosquito species ID via PCR, larval/imago surveys, infection indices (DBD, malaria, JE) | Three flexible result-table modes: A (Species ID), B (Surveillance Indices: MIR, infection rate, density, positive_resolution_%), C (Larval Population Indices: House/Container/Breteau Index, Angka Bebas Jentik). Multi-LHU number bundling supported. | `S06d-vector-lhu-preview.html`, `S06d-vector-lhu-preview-annotated.html`, `S06d-vector-lhu-mockup.jsx` |

**Inheritance principle.** Both variants reuse — without redefining — the patient-report-redesign printed-report config: `headerName`, `accreditationImage`, `accreditationNumber`, `accreditationLogoPosition` (TOP/BOTTOM, default BOTTOM). The `Admin → General Configuration → Printed Reports Configuration` page from patient-report-spec §15 + addendum r5 §15.6 controls layout for **all** Laporan Hasil variants identically. No new config keys are introduced.

**Annotated bilingual sibling previews.** Each variant ships two HTML previews: the canonical Indonesian-only version (production output, matches real Labkesmas convention) and an `*-annotated.html` sibling with bilingual column headers, hover tooltips, and an inline glossary panel — devel-only aid for non-Indonesian reviewers, hidden on print.

**Research artifact.** `S06-lhu-crosswalk-raw.md` — bucketing + crosswalk of 37 real LHU sample PDFs (10 environmental, 1 vector, 22 clinical-skipped) collected from Indonesian Labkesmas. Used as the evidence base for both S06c and S06d field/column choices.

---

## 8. UI Design

See companion React mockup: `S06-laporan-hasil-mockup.jsx`

### Navigation Paths

- **Reports → Laporan Hasil** — Report generation page (new menu entry)
- **Admin → Report Configuration** — Shared print configuration page (new menu entry)

### Key Screens

1. **Report Generation Page** — DataTable with filters, batch select, inline expansion preview, Generate PDF / Download ZIP actions
2. **Report Print Configuration** — Admin settings page with grouped form fields: Lab Identity, Accreditation, Page Layout, Numbering. Uses Accordion sections with inline editing.

### Interaction Patterns

- **DataTable with batch selection** for multi-order generation
- **Inline row expansion** showing compliance summary preview before generation
- **Accordion sections** on admin config page grouping related settings
- **File upload** for logo images with preview thumbnail
- **Progress indicator** during batch generation
- **InlineNotification** for success/warning/error feedback

---

## 9. Business Rules

**BR-001:** An order becomes eligible for Laporan Hasil generation only when ALL results are validated and released AND all compliance evaluations have a non-PENDING status. Orders with partially validated results do not appear in the eligible list.

**BR-002:** Certificate numbers are assigned on first generation and follow the pattern `{prefix}-{YYYY}-{NNNN}` where NNNN is a zero-padded sequential number per calendar year. The prefix comes from Report Print Configuration (`report.config.certificatePrefix`, default "LHU"). Re-generating the same order reuses its certificate number.

**BR-003:** The compliance conclusion text on the PDF uses the **effective** compliance status — if an evaluation was overridden (via S-05), the override status is used, not the original auto-evaluation.

**BR-004:** The results table on the PDF is ordered by parameter group, then by test name within each group. Parameter group headers appear as sub-headings.

**BR-005:** The PDF uses bilingual labels (Indonesian primary / English secondary) for all section headers and the compliance conclusion. Result values, parameter names, and units are not translated — they are scientific notation.

**BR-006:** If Report Print Configuration has not been completed (lab name is empty), PDF generation SHALL be blocked with an error: "Report configuration incomplete. Please configure lab identity at Admin → Report Configuration before generating certificates."

**BR-007:** The e-signature block uses data from the `electronic_signature` table. If e-signatures are disabled site-wide, the block renders blank signature lines for manual signing. If e-signatures are enabled but a specific result lacks a signature record, the block shows "Pending signature" for that role.

**BR-008:** Each PDF generation event is logged. The audit record includes a SHA-256 hash of the PDF content for integrity verification. This supports ISO 17025 traceability requirements.

**BR-009:** Batch generation is limited to 50 orders per request to prevent server resource exhaustion. The UI disables the batch action when more than 50 rows are selected and displays a helper message.

**BR-010:** Report Print Configuration changes are NOT retroactive — they only affect PDFs generated after the change. This is intentional: previously issued certificates represent the lab's identity at the time of issue.

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `nav.reports.laporanHasil` | Laporan Hasil |
| `nav.admin.reportConfig` | Report Configuration |
| `heading.laporanHasil.title` | Laporan Hasil — Compliance Report |
| `heading.laporanHasil.subtitle` | Generate Sertifikat Hasil Uji (Test Results Certificates) for validated environmental orders |
| `heading.reportConfig.title` | Report Print Configuration |
| `heading.reportConfig.subtitle` | Configure shared header, footer, and layout settings for all printed reports |
| `heading.reportConfig.labIdentity` | Lab Identity |
| `heading.reportConfig.accreditation` | Accreditation |
| `heading.reportConfig.pageLayout` | Page Layout |
| `heading.reportConfig.numbering` | Numbering |
| `label.laporanHasil.labNumber` | Lab Number |
| `label.laporanHasil.site` | Site |
| `label.laporanHasil.standard` | Standard |
| `label.laporanHasil.collectionDate` | Collection Date |
| `label.laporanHasil.tests` | Tests |
| `label.laporanHasil.compliance` | Compliance |
| `label.laporanHasil.lastGenerated` | Last Generated |
| `label.laporanHasil.allCompliant` | All Compliant |
| `label.laporanHasil.issuesFound` | Issues Found |
| `label.laporanHasil.nonCompliant` | Non-Compliant |
| `label.laporanHasil.notGenerated` | Not Yet Generated |
| `label.laporanHasil.generated` | Generated |
| `label.laporanHasil.totalEligible` | Total Eligible |
| `label.laporanHasil.filter.dateFrom` | Date From |
| `label.laporanHasil.filter.dateTo` | Date To |
| `label.laporanHasil.filter.site` | Sampling Site |
| `label.laporanHasil.filter.standard` | Compliance Standard |
| `label.laporanHasil.filter.complianceStatus` | Compliance Status |
| `label.laporanHasil.filter.generationStatus` | Generation Status |
| `label.laporanHasil.filter.allSites` | All Sites |
| `label.laporanHasil.filter.allStandards` | All Standards |
| `label.laporanHasil.filter.statusAll` | All |
| `label.laporanHasil.filter.statusCompliant` | All Compliant |
| `label.laporanHasil.filter.statusIssues` | Has Issues |
| `label.laporanHasil.filter.statusNonCompliant` | Non-Compliant (Fail) |
| `label.laporanHasil.filter.genAll` | All |
| `label.laporanHasil.filter.genNotYet` | Not Yet Generated |
| `label.laporanHasil.filter.genPrevious` | Previously Generated |
| `label.reportConfig.labName` | Lab Name |
| `label.reportConfig.labSubtitle` | Lab Subtitle |
| `label.reportConfig.addressLine1` | Address Line 1 |
| `label.reportConfig.addressLine2` | Address Line 2 |
| `label.reportConfig.phone` | Phone |
| `label.reportConfig.email` | Email |
| `label.reportConfig.website` | Website |
| `label.reportConfig.accreditationNumber` | Accreditation Number |
| `label.reportConfig.accreditationBody` | Accreditation Body |
| `label.reportConfig.labLogo` | Lab Logo |
| `label.reportConfig.accreditationLogo` | Accreditation Logo |
| `label.reportConfig.footerText` | Report Footer Text |
| `label.reportConfig.showPageNumbers` | Show Page Numbers |
| `label.reportConfig.pageNumberFormat` | Page Number Format |
| `label.reportConfig.dateFormat` | Date Format |
| `label.reportConfig.certificatePrefix` | Certificate Number Prefix |
| `label.reportConfig.logoHelp` | PNG or JPG, max 500KB. Recommended: 200×80px |
| `button.laporanHasil.generate` | Generate PDF |
| `button.laporanHasil.generateBatch` | Generate PDFs |
| `button.laporanHasil.downloadZip` | Download ZIP |
| `button.laporanHasil.loadOrders` | Load Orders |
| `button.reportConfig.save` | Save Configuration |
| `button.reportConfig.uploadLogo` | Upload Logo |
| `button.reportConfig.removeLogo` | Remove Logo |
| `message.laporanHasil.generating` | Generating certificate... |
| `message.laporanHasil.generatingBatch` | Generating {current} of {total} certificates... |
| `message.laporanHasil.success` | Certificate generated successfully. |
| `message.laporanHasil.batchSuccess` | {count} certificates generated and packaged into ZIP. |
| `message.laporanHasil.batchPartial` | {success} of {total} certificates generated. {failed} failed — see _ERRORS.txt in ZIP. |
| `message.reportConfig.saved` | Report configuration saved. |
| `message.reportConfig.incomplete` | Report configuration incomplete. Please configure lab identity at Admin → Report Configuration before generating certificates. |
| `message.laporanHasil.batchLimit` | Batch generation is limited to 50 orders. Please select fewer orders. |
| `message.laporanHasil.noOrders` | No eligible orders found for the selected filters. |
| `error.reportConfig.logoTooLarge` | Logo file exceeds 500KB limit. |
| `error.reportConfig.logoInvalidType` | Invalid file type. Please upload a PNG or JPG image. |
| `error.reportConfig.required` | This field is required. |
| `heading.laporanHasil.preview.siteInfo` | Site Information |
| `heading.laporanHasil.preview.compliance` | Compliance Summary |
| `heading.laporanHasil.preview.signatures` | E-Signatures |
| `label.laporanHasil.preview.parameter` | Parameter |
| `label.laporanHasil.preview.result` | Result |
| `label.laporanHasil.preview.threshold` | Threshold |
| `label.laporanHasil.preview.status` | Status |
| `label.laporanHasil.preview.testedBy` | Tested by |
| `label.laporanHasil.preview.approvedBy` | Approved by |
| `label.pdf.sertifikatHasilUji` | SERTIFIKAT HASIL UJI / TEST RESULTS CERTIFICATE |
| `label.pdf.certificateNo` | Certificate No |
| `label.pdf.dateOfIssue` | Date of Issue |
| `label.pdf.sampleInfo` | INFORMASI SAMPEL / SAMPLE INFORMATION |
| `label.pdf.conditions` | KONDISI PENGAMBILAN / COLLECTION CONDITIONS |
| `label.pdf.results` | HASIL PENGUJIAN / TEST RESULTS |
| `label.pdf.conclusion` | KESIMPULAN / CONCLUSION |
| `label.pdf.signatures` | TANDA TANGAN / SIGNATURES |
| `label.pdf.testedBy` | Diuji oleh / Tested by |
| `label.pdf.approvedBy` | Disahkan oleh / Approved by |
| `label.pdf.electronicallySigned` | Ditandatangani secara elektronik / Electronically Signed |
| `label.pdf.compliant` | Memenuhi / Compliant |
| `label.pdf.marginal` | Mendekati Batas / Marginal |
| `label.pdf.nonCompliant` | Tidak Memenuhi / Non-Compliant |
| `label.pdf.overrideFootnote` | * Status overridden by {overrideBy} on {overrideAt}. Justification: {overrideJustification} |
| `label.pdf.conclusionAllPass` | Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu sesuai {standardName}. / Based on the test results, all parameters meet the quality standards per {standardName}. |
| `label.pdf.conclusionFail` | Berdasarkan hasil pengujian, {count} parameter tidak memenuhi baku mutu sesuai {standardName}. / Based on the test results, {count} parameters do not meet the quality standards per {standardName}. |
| `label.pdf.conclusionMarginal` | Berdasarkan hasil pengujian, seluruh parameter memenuhi baku mutu, namun {count} parameter mendekati batas sesuai {standardName}. / Based on the test results, all parameters meet the quality standards, however {count} parameters are approaching limits per {standardName}. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Lab Name (config) | Required | `error.reportConfig.required` |
| Address Line 1 (config) | Required | `error.reportConfig.required` |
| Lab Logo (config) | Max 500KB, PNG/JPG only | `error.reportConfig.logoTooLarge` / `error.reportConfig.logoInvalidType` |
| Accreditation Logo (config) | Max 500KB, PNG/JPG only | `error.reportConfig.logoTooLarge` / `error.reportConfig.logoInvalidType` |
| Certificate Prefix (config) | Max 20 characters, alphanumeric + hyphen | `error.reportConfig.required` |
| Batch selection | Max 50 orders | Enforced client-side; `message.laporanHasil.batchLimit` |
| Order eligibility | All results released + all evaluations non-PENDING | Enforced server-side; order excluded from eligible list |

---

## 12. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Laporan Hasil page | `compliance.report.view` | Page not shown in Reports menu |
| Generate PDF (single or batch) | `compliance.report.generate` | Generate/Download buttons hidden; API returns 403 |
| View Report Configuration page | `report.config.view` | Page not shown in Admin menu |
| Edit report print settings | `report.config.modify` | Form fields disabled; Save button hidden; API returns 403 |
| Upload/remove logos | `report.config.modify` | Upload/Remove buttons hidden; API returns 403 |

---

## 13. Acceptance Criteria

### Functional

- [ ] User with `compliance.report.view` can access Reports → Laporan Hasil and see eligible orders
- [ ] Orders only appear when ALL results are validated/released and ALL compliance evaluations are non-PENDING
- [ ] User can filter by date range, site, standard, compliance status, and generation status
- [ ] User can expand a row to see compliance summary preview with site info, evaluations, and e-signature status
- [ ] User with `compliance.report.generate` can click "Generate PDF" and download a single certificate
- [ ] PDF contains correct header (from Report Print Configuration), sample info, results table, conclusion, and e-signature block
- [ ] PDF results table shows parameter groups with sub-headings and correct compliance status symbols
- [ ] PDF compliance conclusion text is bilingual and correctly reflects overall status
- [ ] PDF e-signature block shows analyst and validator names/timestamps from electronic_signature records
- [ ] If e-signatures disabled, PDF shows blank signature lines for manual signing
- [ ] Overridden evaluations show override status with asterisk and footnote explanation
- [ ] User can batch-select orders and download a ZIP of individual certificates
- [ ] Batch generation shows progress indicator and handles partial failures gracefully
- [ ] Certificate numbers are assigned sequentially per year and reused on re-generation
- [ ] Every generation event is recorded in ComplianceReportAudit with SHA-256 hash
- [ ] "Last Generated" column updates after successful generation

### Report Print Configuration

- [ ] Admin user can access Admin → Report Configuration
- [ ] Admin can configure lab name, subtitle, address, phone, email, website
- [ ] Admin can upload/remove lab logo and accreditation logo (PNG/JPG, max 500KB)
- [ ] Admin can configure accreditation number and body
- [ ] Admin can toggle page numbers and select format
- [ ] Admin can set date format and certificate number prefix
- [ ] Configuration changes are reflected in subsequently generated PDFs
- [ ] PDF generation is blocked if lab name is not configured

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Report page loads within 2 seconds for up to 500 eligible orders
- [ ] Single PDF generation completes within 5 seconds
- [ ] Batch generation of 50 PDFs completes within 60 seconds
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with Indonesian language file

### Integration

- [ ] Reads `complianceContext` from order detail API (S-03)
- [ ] Reads `ComplianceEvaluation` records from compliance API (S-05)
- [ ] Reads e-signature data from `electronic_signature` table
- [ ] Reads Report Print Configuration from `site_information` table
- [ ] S-07 (Dashboard) can query ComplianceReportAudit to show generation metrics

---

## Appendix A: Dependency Map

| Upstream Spec | What S-06 Reads |
|---|---|
| S-01 (OGC-528) | ComplianceStandard — name, version, regulation number |
| S-02 (OGC-531) | SamplingSite — name, code, GPS, classification |
| S-03 (OGC-537) | `complianceContext` on Order — all sample info and conditions |
| S-05 (OGC-547) | ComplianceEvaluation records — status, thresholds, overrides |
| E-Signature spec | `electronic_signature` table — signer names, timestamps, meanings |
| Report Print Config (this spec) | `site_information` keys — lab identity, logos, layout settings |

## Appendix B: PDF Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ [Lab Logo]         {Lab Name}                [Accred. Logo]      │
│                    {Lab Subtitle}                                 │
│                    {Address} | {Phone} | {Email}                  │
│                    Accreditation: {Number} — {Body}               │
├──────────────────────────────────────────────────────────────────┤
│         SERTIFIKAT HASIL UJI / TEST RESULTS CERTIFICATE          │
│         Certificate No: LHU-2026-0042                            │
│         Date of Issue: 05/04/2026                                │
├──────────────────────────────────────────────────────────────────┤
│  INFORMASI SAMPEL / SAMPLE INFORMATION                           │
│  ┌────────────────────────┬─────────────────────────────────┐    │
│  │ Sampling Site          │ Intake Point A — Citarum River  │    │
│  │ Site Code              │ SITE-042                        │    │
│  │ GPS Coordinates        │ -6.1885, 106.8114               │    │
│  │ Collection Date/Time   │ 04/04/2026 07:30                │    │
│  │ Collection Method      │ Manual Grab                     │    │
│  │ Sample Types           │ Surface Water                   │    │
│  │ Regulatory Reference   │ PP No. 22/2021                  │    │
│  │ Standard               │ PP No. 22/2021 — Drinking Water │    │
│  │                        │ Quality (Version 2021)          │    │
│  └────────────────────────┴─────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│  KONDISI PENGAMBILAN / COLLECTION CONDITIONS                     │
│  Water Temp: 28.5°C | Ambient: 31.2°C | Weather: Clear          │
│  Preservation: HNO3 acidification                                │
│  Notes: Collected 50m downstream of industrial discharge point   │
├──────────────────────────────────────────────────────────────────┤
│  HASIL PENGUJIAN / TEST RESULTS                                  │
│                                                                  │
│  Physical Parameters                                             │
│  ┌────┬───────────┬────────┬──────┬────────┬──────────┬────────┐│
│  │ No │ Parameter │ Method │ Unit │ Result │ Limit    │ Status ││
│  ├────┼───────────┼────────┼──────┼────────┼──────────┼────────┤│
│  │  1 │ pH        │ SNI …  │ pH   │  7.2   │ 6.5–8.5  │ ✓      ││
│  │  2 │ Turbidity │ SNI …  │ NTU  │  4.3   │ ≤ 5.0    │ ⚠      ││
│  │  3 │ Odor      │ SNI …  │ —    │ No odor│ Odorless │ ✓      ││
│  └────┴───────────┴────────┴──────┴────────┴──────────┴────────┘│
│                                                                  │
│  Chemical Parameters — Inorganic                                 │
│  ┌────┬───────────┬────────┬──────┬────────┬──────────┬────────┐│
│  │  4 │ Lead (Pb) │ SNI …  │ mg/L │ 0.015  │ ≤ 0.01   │ ✗      ││
│  └────┴───────────┴────────┴──────┴────────┴──────────┴────────┘│
│                                                                  │
│  Microbiological Parameters                                      │
│  ┌────┬───────────┬────────┬──────────┬────────┬───────┬───────┐│
│  │  5 │ E. coli   │ SNI …  │ CFU/100mL│    0   │ ≤ 0   │ ✓     ││
│  └────┴───────────┴────────┴──────────┴────────┴───────┴───────┘│
├──────────────────────────────────────────────────────────────────┤
│  KESIMPULAN / CONCLUSION                                         │
│  Berdasarkan hasil pengujian, 1 parameter tidak memenuhi baku    │
│  mutu sesuai PP No. 22/2021: Lead (Pb).                          │
│  Based on the test results, 1 parameter does not meet the        │
│  quality standards per PP No. 22/2021: Lead (Pb).                │
├──────────────────────────────────────────────────────────────────┤
│  TANDA TANGAN / SIGNATURES                                       │
│  ┌────────────────────────┬──────────────────────────────┐       │
│  │ Diuji oleh/Tested by:  │ Disahkan oleh/Approved by:   │       │
│  │ A. Sutanto              │ Dr. Sari Wijaya              │       │
│  │ Lab Technician          │ Lab Manager                  │       │
│  │ 04/04/2026 08:30 UTC    │ 04/04/2026 14:15 UTC         │       │
│  │ Meaning: Authored       │ Meaning: Validated & Released│       │
│  ├─────────────────────────┴──────────────────────────────┤       │
│  │ — Ditandatangani secara elektronik /                    │       │
│  │   Electronically Signed —                               │       │
│  │ {Report Footer Text}                                    │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                              Page 1 of 1         │
└──────────────────────────────────────────────────────────────────┘
```
