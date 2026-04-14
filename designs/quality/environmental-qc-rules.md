# Environmental QC Rules
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-10
**Status:** Draft for Review
**Jira:** [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Compliance Standards Administration (S-01, OGC-528), Environmental Order Entry (S-03, OGC-537), Compliance Evaluation Engine (S-05, OGC-547), Laporan Hasil (S-06, OGC-552), Existing QC Framework (batch workplan, Westgard rules)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Scope & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
   - 5.1 QC Protocol Configuration (within S-01 Standards)
   - 5.2 QC Sample Creation at Order Entry
   - 5.3 QC Result Entry & Evaluation
   - 5.4 QC Review Tab on Results Entry
   - 5.5 QC Warning on Validation
   - 5.6 QC in Laporan Hasil
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

Environmental QC Rules (S-08) extends OpenELIS Global's quality control framework to cover field-level quality assurance for environmental sampling. Unlike the existing reagent/analyzer QC system (which validates instrument performance), environmental QC validates sample integrity — ensuring that the collection, transport, and handling process did not introduce contamination or measurement bias.

The feature introduces four environmental QC sample types: **field blanks** (detect contamination from collection equipment), **trip blanks** (detect contamination during transport), **duplicate samples** (assess measurement precision), and **spike recovery** (verify matrix effects on analyte detection). QC requirements are configured per compliance standard (S-01), QC samples are created as linked children during order entry (S-03), and QC results are evaluated against configurable acceptance criteria. QC failures produce a warning — not a hard block — on the validation screen, requiring the validator to acknowledge the failure with a justification before releasing results.

---

## 2. Problem Statement

**Current state:** OpenELIS Global has a comprehensive QC framework for clinical laboratory operations — reagent lot QC, analyzer manual QC, Westgard rules, and Levey-Jennings charts. However, environmental testing has a fundamentally different QC paradigm. Environmental labs must demonstrate that field collection, transport, and sample handling did not compromise results. This requires field blanks, trip blanks, duplicate precision checks, and spike recovery assessments. There is currently no mechanism to define these QC types, link them to environmental orders, evaluate them against acceptance criteria, or surface QC failures during result validation.

**Impact:** Without automated environmental QC, labs must track QC samples manually (paper logs, separate spreadsheets), making it impossible to enforce QC protocols consistently. QC failures are easily missed during validation because there is no system-level integration between QC results and the parent order's validation workflow. This creates compliance risk for ISO 17025 and KAN-accredited labs, which must demonstrate documented QC procedures with traceable results.

**Proposed solution:** Extend the compliance standards configuration (S-01) with a QC Protocol section where admins define required environmental QC types and their acceptance criteria per standard. During environmental order entry (S-03), the system prompts the technician to add required QC samples as linked child orders. QC results are entered through the normal results workflow, then auto-evaluated against the configured acceptance criteria. A QC tab appears in the results entry expanded panel (alongside the existing Compliance tab from S-05), showing linked QC samples and their pass/fail status. If any QC sample fails, a warning banner appears on the validation screen — the validator must acknowledge the failure with justification before releasing results.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- QC Protocol configuration section within S-01 standard definitions
- Four environmental QC types: Field Blank, Trip Blank, Duplicate Sample, Spike Recovery
- Configurable acceptance criteria per QC type per standard (with regulatory defaults)
- QC sample creation as linked children during S-03 order entry
- Auto-evaluation of QC results against acceptance criteria
- QC Review tab in the results entry expanded panel (S-05 extension)
- QC warning banner on validation screen with acknowledgment + justification workflow
- QC summary section in the Laporan Hasil expanded preview (S-06 extension)

### 3.2 Non-Goals

- **3.2.1** Dedicated Environmental QC Review page — future enhancement for cross-order QC analysis
- **3.2.2** Levey-Jennings charts for environmental QC — environmental QC is event-based, not time-series like reagent QC
- **3.2.3** Hard-blocking validation on QC failure — validator warning with acknowledgment only
- **3.2.4** Reagent/analyzer QC modifications — existing QC framework is untouched
- **3.2.5** QC sample scheduling or planning — technician adds QC samples manually at order entry per protocol
- **3.2.6** Matrix spike duplicate (MSD) calculations — v1.0 covers single spike recovery only
- **3.2.7** Automatic re-sampling triggers based on QC failure — future enhancement

---

## 4. User Roles & Permissions

| Role | Configure QC Protocol | Add QC Samples | View QC Tab | Acknowledge QC Failure | Notes |
|---|---|---|---|---|---|
| Lab Technician | No | Yes | Yes | No | Adds QC samples at order entry, enters QC results |
| Lab Manager | No | Yes | Yes | Yes | Can acknowledge QC failures during validation |
| Validator | No | No | Yes | Yes | Primary user for QC acknowledgment workflow |
| System Administrator | Yes | Yes | Yes | Yes | Configures QC protocols within S-01 standards |

**Required permission keys:**

- `compliance.qc.protocol.view` — View QC protocol configuration within a compliance standard
- `compliance.qc.protocol.modify` — Edit QC protocol settings (acceptance criteria, required QC types)
- `compliance.qc.samples.add` — Add QC samples to an environmental order
- `compliance.qc.view` — View QC tab and QC results on orders
- `compliance.qc.acknowledge` — Acknowledge QC failures during validation (required to release orders with QC failures)

---

## 5. Functional Requirements

### 5.1 QC Protocol Configuration (within S-01 Standards)

**QC-1-001:** The system SHALL add a "QC Protocol" section to the compliance standard detail page (S-01). This section is displayed as an Accordion panel below the existing threshold configuration.

**QC-1-002:** The QC Protocol section SHALL allow administrators to configure the following environmental QC types:

| QC Type | Code | Purpose | Acceptance Criterion Type |
|---|---|---|---|
| Field Blank | `FIELD_BLANK` | Detect contamination from collection equipment | Result < threshold (e.g., < MDL) |
| Trip Blank | `TRIP_BLANK` | Detect contamination during transport | Result < threshold (e.g., < MDL) |
| Duplicate Sample | `DUPLICATE` | Assess measurement precision via RPD | RPD ≤ threshold (e.g., ≤20%) |
| Spike Recovery | `SPIKE_RECOVERY` | Verify analyte recovery in sample matrix | Recovery % within range (e.g., 75–125%) |

**QC-1-003:** For each enabled QC type, the administrator SHALL configure:

| Setting | Type | Default | Description |
|---|---|---|---|
| Enabled | Boolean | false | Whether this QC type is required for this standard |
| Frequency | Enum | `PER_EVENT` | How often QC is required: `PER_EVENT` (every sampling event), `PER_N_SAMPLES` (1 per N samples) |
| Frequency N | Integer | 10 | If PER_N_SAMPLES, the N value (e.g., 1 duplicate per 10 samples) |
| Acceptance Lower | Double | varies | Lower acceptance bound (e.g., 75% for spike recovery) |
| Acceptance Upper | Double | varies | Upper acceptance bound (e.g., 125% for spike recovery) |
| Acceptance Unit | Enum | `PERCENT` | `PERCENT` (for RPD, recovery %), `ABSOLUTE` (for blank < value), `MDL_RELATIVE` (for blank < N × MDL) |
| Parameters | Multi-select | all | Which parameters this QC type applies to (default: all parameters in the standard) |

**QC-1-004:** The system SHALL provide the following default acceptance criteria:

| QC Type | Default Lower | Default Upper | Default Unit |
|---|---|---|---|
| Field Blank | 0 | MDL | `MDL_RELATIVE` |
| Trip Blank | 0 | MDL | `MDL_RELATIVE` |
| Duplicate | 0 | 20 | `PERCENT` (RPD) |
| Spike Recovery | 75 | 125 | `PERCENT` |

**QC-1-005:** The QC Protocol section SHALL use an Accordion pattern with one AccordionItem per QC type. Each item displays the enabled status, frequency, and acceptance criteria in a compact inline form.

### 5.2 QC Sample Creation at Order Entry

**QC-2-001:** When creating an environmental order (S-03) for a standard that has QC protocol requirements, the system SHALL display a "QC Samples" section in the order entry form showing the required QC types.

**QC-2-002:** For each required QC type, the system SHALL display a row with: QC type name, requirement status (Required / Optional), and an "Add" button. Required QC samples are pre-checked.

**QC-2-003:** When the user adds a QC sample, the system SHALL create a linked child order with:
- `orderType`: `ENV_QC`
- `parentOrderId`: the parent environmental order ID
- `qcType`: the QC type code (`FIELD_BLANK`, `TRIP_BLANK`, `DUPLICATE`, `SPIKE_RECOVERY`)
- `complianceContext`: inherited from the parent order
- Same sample types and test assignments as the parent (for the parameters the QC type covers)

**QC-2-004:** For DUPLICATE type, the system SHALL indicate that the duplicate sample must be collected from the same source at the same time as the parent sample and assigned the same tests.

**QC-2-005:** For SPIKE_RECOVERY type, the system SHALL prompt for the spike concentration (the known amount of analyte added to the sample). This value is stored on the QC order for recovery calculation.

**QC-2-006:** The order entry form SHALL display a QC completeness indicator: "QC: {N} of {M} required samples added" with a warning if required QC samples are missing. The order CAN be submitted without all QC samples (soft requirement), but the warning is logged.

### 5.3 QC Result Entry & Evaluation

**QC-3-001:** QC sample results SHALL be entered through the standard results entry workflow. QC orders appear in the results worklist with a "QC" Tag indicator alongside the parent order's lab number.

**QC-3-002:** When a QC result is entered and saved, the system SHALL automatically evaluate it against the configured acceptance criteria:

**Field Blank / Trip Blank evaluation:**
- PASS: result value < acceptance threshold (default: below MDL)
- FAIL: result value ≥ acceptance threshold

**Duplicate evaluation (RPD — Relative Percent Difference):**
- RPD = |Parent Result - Duplicate Result| / ((Parent Result + Duplicate Result) / 2) × 100
- PASS: RPD ≤ acceptance upper threshold (default: ≤20%)
- FAIL: RPD > acceptance upper threshold
- If parent result is not yet entered, evaluation is PENDING

**Spike Recovery evaluation:**
- Recovery % = ((Spiked Result - Unspiked Result) / Spike Concentration) × 100
- PASS: Recovery % within [acceptance lower, acceptance upper] (default: 75–125%)
- FAIL: Recovery % outside range
- If unspiked (parent) result is not yet entered, evaluation is PENDING

**QC-3-003:** The QC evaluation result SHALL be stored as an `EnvironmentalQcEvaluation` entity with: qcOrderId, parentOrderId, parameterName, qcType, evaluationStatus (PASS/FAIL/PENDING), calculatedValue (RPD or recovery %), acceptanceLower, acceptanceUpper, evaluatedAt.

### 5.4 QC Review Tab on Results Entry

**QC-4-001:** When an environmental order has linked QC samples, the results entry expanded panel SHALL display an additional "QC" tab alongside the existing tabs (Results, Compliance, Notes, History).

**QC-4-002:** The QC tab SHALL display a DataTable of linked QC samples with the following columns:

| Column | Content |
|---|---|
| QC Type | Field Blank / Trip Blank / Duplicate / Spike Recovery (Tag, color-coded) |
| Lab Number | QC order lab number |
| Parameter | Parameter name |
| QC Result | QC sample result value with unit |
| Parent Result | Parent order result (for Duplicate and Spike) |
| Calculated | RPD % or Recovery % (for Duplicate and Spike) |
| Acceptance | Acceptance range (e.g., "≤20%" or "75–125%") |
| Status | PASS (green Tag) / FAIL (red Tag) / PENDING (gray Tag) |

**QC-4-003:** If any QC evaluation has FAIL status, the QC tab header SHALL display a red warning badge with the count of failures (e.g., "QC ⚠ 2").

**QC-4-004:** The QC tab SHALL display a summary line above the table: "QC Status: {pass} passed, {fail} failed, {pending} pending of {total} evaluations."

### 5.5 QC Warning on Validation

**QC-5-001:** When a validator opens an environmental order that has one or more QC evaluations with FAIL status, the system SHALL display a prominent InlineNotification (kind="warning") at the top of the validation panel:

"⚠ QC Warning: {N} quality control check(s) failed for this order. Review the QC tab before releasing results."

**QC-5-002:** The validator SHALL NOT be blocked from releasing results. However, if QC failures exist and the validator clicks "Validate and Release," the system SHALL display a confirmation dialog requiring:
- A justification text field (TextArea, minimum 10 characters, required)
- An acknowledgment checkbox: "I have reviewed the QC failures and accept responsibility for releasing these results."
- "Confirm Release" and "Cancel" buttons

**QC-5-003:** The acknowledgment SHALL be stored as a `QcAcknowledgment` record: orderId, acknowledgedBy, acknowledgedAt, justificationText, failedQcCount.

**QC-5-004:** If all QC evaluations are PASS or PENDING, the validation proceeds normally with no additional prompts.

**QC-5-005:** If the order has no linked QC samples despite the standard requiring them (missing QC), the system SHALL display an InlineNotification (kind="info"): "ℹ No QC samples linked to this order. The compliance standard requires {list of required QC types}."

### 5.6 QC in Laporan Hasil

**QC-6-001:** The Laporan Hasil (S-06) expanded row preview SHALL include a QC section below the e-signature section showing the QC status summary for the order.

**QC-6-002:** The QC section SHALL display: QC type, parameter, calculated value (RPD or recovery %), acceptance range, and status for each QC evaluation.

**QC-6-003:** If QC failures were acknowledged, the section SHALL display: "QC failures acknowledged by {name} on {date}. Justification: {text}."

**QC-6-004:** The generated PDF certificate (Laporan Hasil) SHALL include a "Quality Control" section after the results table and before the conclusion, listing QC results and their pass/fail status. If QC failures were acknowledged, the acknowledgment text SHALL appear as a footnote.

---

## 6. Data Model

### New Entities

**EnvironmentalQcProtocol**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| standardId | Long | Yes | FK to ComplianceStandard (S-01) |
| qcType | Enum | Yes | `FIELD_BLANK`, `TRIP_BLANK`, `DUPLICATE`, `SPIKE_RECOVERY` |
| enabled | Boolean | Yes | Whether this QC type is required |
| frequency | Enum | Yes | `PER_EVENT`, `PER_N_SAMPLES` |
| frequencyN | Integer | No | N value for PER_N_SAMPLES |
| acceptanceLower | Double | No | Lower acceptance bound |
| acceptanceUpper | Double | No | Upper acceptance bound |
| acceptanceUnit | Enum | Yes | `PERCENT`, `ABSOLUTE`, `MDL_RELATIVE` |

**Uniqueness constraint:** (`standardId`, `qcType`) must be unique.

**EnvironmentalQcProtocolParameter**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| protocolId | Long | Yes | FK to EnvironmentalQcProtocol |
| testId | Long | Yes | FK to Test (parameter) |

Absent = all parameters. When entries exist, QC applies only to listed parameters.

**EnvironmentalQcOrder** (extends Order or linked via)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| parentOrderId | Long | Yes | FK to parent environmental Order |
| qcType | Enum | Yes | `FIELD_BLANK`, `TRIP_BLANK`, `DUPLICATE`, `SPIKE_RECOVERY` |
| spikeConcentration | Double | No | For SPIKE_RECOVERY: known spike amount (mg/L or relevant unit) |
| spikeUnit | String | No | Unit for spike concentration |

**EnvironmentalQcEvaluation**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| qcOrderId | Long | Yes | FK to EnvironmentalQcOrder |
| parentOrderId | Long | Yes | FK to parent Order |
| testId | Long | Yes | FK to Test (parameter) |
| qcType | Enum | Yes | QC type code |
| status | Enum | Yes | `PASS`, `FAIL`, `PENDING` |
| calculatedValue | Double | No | RPD % or Recovery % |
| qcResultValue | String | No | Raw QC result |
| parentResultValue | String | No | Parent order result (snapshot) |
| acceptanceLower | Double | No | Configured lower bound at evaluation time |
| acceptanceUpper | Double | No | Configured upper bound at evaluation time |
| evaluatedAt | Timestamp | Yes | Evaluation timestamp |

**QcAcknowledgment**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| orderId | Long | Yes | FK to parent Order |
| acknowledgedBy | String | Yes | Username |
| acknowledgedAt | Timestamp | Yes | Acknowledgment timestamp |
| justificationText | String (1000) | Yes | Validator's justification |
| failedQcCount | Integer | Yes | Number of failed QC evaluations at acknowledgment time |

### Modified Entities

**Order** — add field:

| Field | Type | Notes |
|---|---|---|
| orderType | Enum | Add `ENV_QC` value to existing order type enum |

**ComplianceStandard** (S-01) — no schema change. QC protocol stored in `EnvironmentalQcProtocol` linked via `standardId`.

---

## 7. API Endpoints

### QC Protocol Configuration

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance/standards/{standardId}/qc-protocol` | Get QC protocol for a standard | `compliance.qc.protocol.view` |
| PUT | `/api/v1/compliance/standards/{standardId}/qc-protocol` | Update QC protocol settings (bulk) | `compliance.qc.protocol.modify` |

### QC Sample Management

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/orders/{orderId}/qc-samples` | List QC samples linked to an order | `compliance.qc.view` |
| POST | `/api/v1/orders/{orderId}/qc-samples` | Add a QC sample to an order | `compliance.qc.samples.add` |
| GET | `/api/v1/orders/{orderId}/qc-requirements` | Get required QC types for an order's standard | `compliance.qc.view` |

### QC Evaluation

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/orders/{orderId}/qc-evaluations` | Get QC evaluation results for an order | `compliance.qc.view` |
| POST | `/api/v1/orders/{orderId}/qc-acknowledge` | Acknowledge QC failures for validation release | `compliance.qc.acknowledge` |

### QC Protocol Request Body

```json
{
  "protocols": [
    {
      "qcType": "FIELD_BLANK",
      "enabled": true,
      "frequency": "PER_EVENT",
      "frequencyN": null,
      "acceptanceLower": 0,
      "acceptanceUpper": 1,
      "acceptanceUnit": "MDL_RELATIVE",
      "parameterIds": []
    },
    {
      "qcType": "DUPLICATE",
      "enabled": true,
      "frequency": "PER_N_SAMPLES",
      "frequencyN": 10,
      "acceptanceLower": 0,
      "acceptanceUpper": 20,
      "acceptanceUnit": "PERCENT",
      "parameterIds": []
    }
  ]
}
```

### QC Evaluations Response

```json
{
  "evaluations": [
    {
      "id": 101,
      "qcType": "FIELD_BLANK",
      "qcLabNumber": "ENV-2026-001-FB",
      "testName": "Lead (Pb)",
      "qcResult": "0.001",
      "qcUnit": "mg/L",
      "parentResult": null,
      "calculatedValue": null,
      "acceptanceLower": 0,
      "acceptanceUpper": 0.003,
      "acceptanceDisplay": "< MDL (0.003)",
      "status": "PASS",
      "evaluatedAt": "2026-04-04T14:30:00+07:00"
    }
  ],
  "summary": {
    "total": 8,
    "pass": 6,
    "fail": 1,
    "pending": 1
  },
  "acknowledgment": null
}
```

---

## 8. UI Design

See companion React mockup: `S08-environmental-qc-rules-mockup.jsx`

### Navigation Paths

- **Admin → Compliance Standards → [Standard Detail] → QC Protocol** — Accordion section for configuring QC requirements
- **Results Entry → [Order Row] → QC Tab** — QC review tab in expanded panel
- **Validation → [Order] → QC Warning Banner** — Warning notification + acknowledgment dialog
- **Reports → Laporan Hasil → [Order Row] → QC Section** — QC summary in expanded preview

### Key Screens

1. **QC Protocol Configuration** — Accordion within S-01 standard detail, one panel per QC type with enable toggle, frequency selector, acceptance range inputs
2. **QC Tab on Results Entry** — DataTable showing linked QC samples, their results, calculated values, and pass/fail status
3. **QC Warning + Acknowledgment** — InlineNotification banner + confirmation modal with justification TextArea

### Interaction Patterns

- **Accordion** for QC protocol config grouped by QC type
- **Inline tab** on existing results entry expanded panel
- **InlineNotification** (kind="warning") for QC failure banner
- **Modal** for acknowledgment confirmation (destructive-confirm pattern — releasing with known QC failures)
- **Tag** for QC type labels and pass/fail/pending status

---

## 9. Business Rules

**BR-001:** QC samples are linked to their parent order via `parentOrderId`. A parent environmental order can have 0 to N QC samples, one per QC type per protocol requirement.

**BR-002:** QC evaluation is automatically triggered when a QC result is saved. For Duplicate and Spike Recovery, evaluation also requires the parent result to be entered — if missing, the evaluation status is PENDING and re-evaluated when the parent result is saved.

**BR-003:** QC failure does NOT block validation. It produces a warning. The validator must acknowledge the failure with a justification (minimum 10 characters) to release results. This acknowledgment is stored as an immutable audit record.

**BR-004:** QC acceptance criteria are snapshot at evaluation time — if the admin changes the criteria after evaluation, existing evaluations are not retroactively updated.

**BR-005:** RPD (Relative Percent Difference) for duplicates is calculated as: `|R1 - R2| / ((R1 + R2) / 2) × 100`. If both results are 0, RPD = 0 (pass). If one result is 0 and the other is not, RPD = 200% (likely fail).

**BR-006:** Spike Recovery is calculated as: `((Spiked - Unspiked) / SpikeConcentration) × 100`. The spiked result comes from the QC order; the unspiked result from the parent order.

**BR-007:** QC samples with `orderType = ENV_QC` are excluded from the S-06 Laporan Hasil eligible orders list — they are not independently reportable. Their data appears only within the parent order's QC section.

**BR-008:** If a compliance standard requires QC samples (has enabled QC types) and the order is submitted without them, the system logs a warning but does not block submission. The missing QC is surfaced on the validation screen as an informational notice.

**BR-009:** Descriptive parameters (e.g., Odor) are excluded from Duplicate RPD and Spike Recovery calculations since they have no numeric values. Field Blank and Trip Blank can still apply to descriptive parameters (checking for absence of contamination).

**BR-010:** QC evaluations are included in the S-07 Environmental Dashboard exceedance calculations only when the "Include QC" filter is enabled (off by default — dashboard focuses on sample compliance, not QC compliance).

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.qcProtocol.title` | QC Protocol |
| `heading.qcProtocol.subtitle` | Configure environmental quality control requirements for this standard |
| `heading.qcTab.title` | QC |
| `heading.qcTab.titleWithWarning` | QC ⚠ {count} |
| `label.qcType.fieldBlank` | Field Blank |
| `label.qcType.tripBlank` | Trip Blank |
| `label.qcType.duplicate` | Duplicate Sample |
| `label.qcType.spikeRecovery` | Spike Recovery |
| `label.qcProtocol.enabled` | Enabled |
| `label.qcProtocol.frequency` | Frequency |
| `label.qcProtocol.frequencyPerEvent` | Every sampling event |
| `label.qcProtocol.frequencyPerN` | 1 per {n} samples |
| `label.qcProtocol.acceptanceLower` | Lower Bound |
| `label.qcProtocol.acceptanceUpper` | Upper Bound |
| `label.qcProtocol.acceptanceUnit` | Unit |
| `label.qcProtocol.unitPercent` | Percent (%) |
| `label.qcProtocol.unitAbsolute` | Absolute Value |
| `label.qcProtocol.unitMdl` | Relative to MDL |
| `label.qcProtocol.parameters` | Parameters |
| `label.qcProtocol.allParameters` | All Parameters |
| `label.qcTab.qcType` | QC Type |
| `label.qcTab.labNumber` | Lab Number |
| `label.qcTab.parameter` | Parameter |
| `label.qcTab.qcResult` | QC Result |
| `label.qcTab.parentResult` | Parent Result |
| `label.qcTab.calculated` | Calculated |
| `label.qcTab.acceptance` | Acceptance |
| `label.qcTab.status` | Status |
| `label.qcTab.pass` | Pass |
| `label.qcTab.fail` | Fail |
| `label.qcTab.pending` | Pending |
| `label.qcTab.summary` | QC Status: {pass} passed, {fail} failed, {pending} pending of {total} evaluations |
| `label.qcTab.rpd` | RPD |
| `label.qcTab.recovery` | Recovery |
| `label.qcSamples.title` | QC Samples |
| `label.qcSamples.completeness` | QC: {added} of {required} required samples added |
| `label.qcSamples.required` | Required |
| `label.qcSamples.optional` | Optional |
| `label.qcSamples.spikeConcentration` | Spike Concentration |
| `label.qcAcknowledge.title` | Acknowledge QC Failures |
| `label.qcAcknowledge.checkbox` | I have reviewed the QC failures and accept responsibility for releasing these results |
| `label.qcAcknowledge.justification` | Justification |
| `label.qcAcknowledge.acknowledgedBy` | QC failures acknowledged by {name} on {date} |
| `button.qcSamples.add` | Add |
| `button.qcAcknowledge.confirm` | Confirm Release |
| `button.qcAcknowledge.cancel` | Cancel |
| `button.qcProtocol.save` | Save QC Protocol |
| `message.qcWarning` | ⚠ QC Warning: {count} quality control check(s) failed for this order. Review the QC tab before releasing results. |
| `message.qcMissing` | No QC samples linked to this order. The compliance standard requires: {types}. |
| `message.qcProtocol.saved` | QC protocol saved. |
| `message.qcSamples.added` | QC sample added. |
| `error.qcAcknowledge.justificationRequired` | Justification is required (minimum 10 characters). |
| `error.qcAcknowledge.checkboxRequired` | You must acknowledge the QC failures before releasing. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Acceptance Upper (protocol) | Must be > Acceptance Lower | Client-side validation |
| Frequency N (protocol) | Required when frequency = PER_N_SAMPLES, must be > 0 | Client-side validation |
| Spike Concentration (order entry) | Required for SPIKE_RECOVERY QC samples, must be > 0 | Client-side validation |
| Justification (acknowledgment) | Required, minimum 10 characters | `error.qcAcknowledge.justificationRequired` |
| Acknowledgment checkbox | Must be checked to confirm | `error.qcAcknowledge.checkboxRequired` |

---

## 12. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View QC protocol config | `compliance.qc.protocol.view` | QC Protocol accordion hidden on standard detail |
| Edit QC protocol config | `compliance.qc.protocol.modify` | Form fields disabled; Save button hidden; API returns 403 |
| Add QC samples to order | `compliance.qc.samples.add` | "Add" buttons hidden in QC Samples section |
| View QC tab on results entry | `compliance.qc.view` | QC tab not shown in expanded panel |
| Acknowledge QC failures | `compliance.qc.acknowledge` | "Confirm Release" disabled; must escalate to authorized validator |

---

## 13. Acceptance Criteria

### Functional

- [ ] Admin can configure QC protocol (enable/disable QC types, set frequency, set acceptance criteria) per compliance standard
- [ ] Default acceptance criteria are pre-populated (blank < MDL, RPD ≤20%, recovery 75–125%)
- [ ] QC protocol settings are saved and loaded correctly
- [ ] At order entry (S-03), required QC types are displayed based on the standard's QC protocol
- [ ] Technician can add QC samples as linked children of the parent order
- [ ] QC orders appear in results worklist with "QC" indicator
- [ ] QC results are auto-evaluated against acceptance criteria when saved
- [ ] Duplicate RPD and Spike Recovery calculations are correct
- [ ] QC evaluations re-trigger when parent result is saved (for PENDING evaluations)
- [ ] QC tab appears on results entry expanded panel for orders with linked QC samples
- [ ] QC tab shows correct DataTable with all columns (type, result, calculated, acceptance, status)
- [ ] QC failure count badge appears on QC tab header
- [ ] Warning banner displays on validation screen when QC failures exist
- [ ] Validator must provide justification (≥10 chars) and check acknowledgment to release
- [ ] QC acknowledgment is stored as immutable audit record
- [ ] Missing QC info notice displays when required QC samples are absent
- [ ] QC summary appears in Laporan Hasil expanded preview and PDF

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] QC evaluation completes within 1 second of result save
- [ ] QC samples excluded from S-06 eligible orders list (not independently reportable)
