# Patient Sex & Age Display on Validation Screen
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-09
**Status:** Draft for Review
**Jira:** OGC-291 (Validation), OGC-343
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Validation, Results Entry, Reference Ranges

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

This enhancement adds patient biological sex and age (in Days-Months-Years format) to the validation screen. Both fields are displayed in the patient header area and as inline columns in the results DataTable. The age is calculated as of the sample collection date. This enables validators at all levels (routine, technical, supervisor) to instantly verify whether the normal/reference ranges shown for each result are appropriate for the patient's demographic profile — without navigating to a separate patient record.

---

## 2. Problem Statement

**Current state:** Validators reviewing results on the validation screen can see the test name, result value, and normal range, but cannot see the patient's sex or age. To verify that the reference range is appropriate (e.g., pediatric vs. adult, male vs. female for analytes like creatinine or hemoglobin), validators must navigate away from the validation screen to the patient record, mentally calculate the age, then return. This disrupts workflow and increases the risk of approving results against incorrect reference ranges.

**Impact:** Mismatched reference ranges can lead to false normal/abnormal classifications. In pediatric and neonatal care, where reference ranges shift rapidly with age, the risk is especially acute. Validators who skip the demographic check due to workflow friction may approve clinically misleading results.

**Proposed solution:** Display patient sex (single letter: M/F/U) and age (Days-Months-Years format, calculated at sample collection date) in two locations on the validation screen: (1) the patient information header area, and (2) as two new columns ("Sex" and "Age") in the results validation DataTable. This applies to all validation levels.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Routine Validator | View | Sees sex and age on routine validation screen |
| Technical Validator | View | Sees sex and age on technical validation screen |
| Supervisor Validator | View | Sees sex and age on supervisor validation screen |
| Lab Technician (no validate perm) | None | Cannot access validation screen |

**Required permission keys:**

- `result.validate` — Existing permission; no new permission key required. Sex and age are read-only display fields that inherit access from the validation screen itself.

---

## 4. Functional Requirements

### 4.1 Patient Header Display

**FR-HDR-001:** The patient information header on the validation screen MUST display the patient's biological sex as the full word ("Male", "Female", or "Unknown").

**FR-HDR-002:** The patient information header MUST display the patient's age in Days-Months-Years format (e.g., "0D-3M-25Y") calculated as of the sample collection date.

**FR-HDR-003:** If the patient's date of birth is not recorded in the system, the age field MUST display "Unknown" instead of a calculated value.

**FR-HDR-004:** If the patient's sex is not recorded in the system, the sex field MUST display "Unknown".

**FR-HDR-005:** The sex display in the header MUST use a Carbon `Tag` component with `kind="blue"` for visual distinction.

### 4.2 DataTable Column Display

**FR-TBL-001:** The validation results DataTable MUST include a "Sex" column displaying the patient's biological sex as a single letter: "M" (Male), "F" (Female), or "U" (Unknown).

**FR-TBL-002:** The validation results DataTable MUST include an "Age" column displaying the patient's age in D-M-Y format (e.g., "0D-3M-25Y") calculated as of the sample collection date.

**FR-TBL-003:** The Sex and Age columns MUST be positioned after the patient name/ID columns and before the test name column, so that demographic context is visible before the validator reads the result and reference range.

**FR-TBL-004:** The Sex and Age columns MUST be sortable to allow validators to group results by patient demographics when reviewing batches.

**FR-TBL-005:** When a patient's date of birth is missing, the Age column MUST display "—" (em dash).

**FR-TBL-006:** When a patient's sex is missing, the Sex column MUST display "U".

### 4.3 Age Calculation

**FR-AGE-001:** Age MUST be calculated as: `sampleCollectionDate - patient.dateOfBirth`, expressed as the number of complete years, remaining complete months, and remaining days.

**FR-AGE-002:** The format MUST be `[D]D-[M]M-[Y]Y` where D = days, M = months, Y = years. Examples: "15D-0M-0Y" (15-day-old neonate), "0D-6M-2Y" (2 years 6 months old), "0D-0M-45Y" (45 years old).

**FR-AGE-003:** Age calculation MUST use the sample collection date recorded on the order, NOT the current system date or the validation date.

**FR-AGE-004:** If the sample collection date is missing, the system MUST fall back to the order entry date for age calculation and display an informational indicator (e.g., "~" prefix) to signal the approximation.

---

## 5. Data Model

### New Entities

None — no new database entities are required.

### Modified Entities

No schema changes required. The data needed already exists:

| Source Entity | Field | Type | Notes |
|---|---|---|---|
| Patient | sex | String | Already stored ("M", "F", null) |
| Patient | dateOfBirth | Date | Already stored |
| Sample | collectionDate | Date | Already stored on the sample/order |

### Computed Fields (API response only)

| Field | Type | Computation | Notes |
|---|---|---|---|
| patientAge | String | `collectionDate - dateOfBirth` → "XD-YM-ZY" | Calculated server-side per result |
| patientSex | String | Direct from Patient.sex, defaulting to "U" | Normalized for display |

---

## 6. API Endpoints

No new endpoints required. The existing validation results endpoint must be modified:

| Method | Path | Change | Permission |
|---|---|---|---|
| GET | `/api/v1/validation/results` | Add `patientSex` and `patientAge` fields to each result item in the response | `result.validate` |

**Response field additions:**

```json
{
  "results": [
    {
      "accessionNumber": "...",
      "patientName": "...",
      "patientSex": "M",
      "patientAge": "0D-3M-25Y",
      "patientAgeApproximate": false,
      "testName": "...",
      "result": "...",
      "normalRange": "..."
    }
  ]
}
```

- `patientSex`: "M", "F", or "U"
- `patientAge`: Formatted D-M-Y string, or null if DOB is missing
- `patientAgeApproximate`: Boolean — true if collection date was missing and order entry date was used instead

---

## 7. UI Design

See companion React mockup: `validation-patient-demographics-mockup.jsx`

### Navigation Path

Validation → Routine Results / Technical Validation / Supervisor Validation

### Key Screens

1. **Validation Results List** — Enhanced with Sex and Age columns in the DataTable, plus sex and age in the patient header Tile.

### Interaction Patterns

- **Read-only display** — No edit, expand, or modal behavior for the new fields
- **Sortable columns** — Sex and Age columns support click-to-sort
- **Patient header** — Existing patient info Tile extended with Sex tag and Age text

---

## 8. Business Rules

**BR-001:** Age MUST always be calculated relative to the sample collection date, not the current date or the validation date.

**BR-002:** If dateOfBirth is null, age displays as "—" (em dash) in the table and "Unknown" in the header.

**BR-003:** If sex is null or not one of the recognized values, it MUST normalize to "U" (Unknown).

**BR-004:** The age calculation MUST handle edge cases: same-day collection (0D-0M-0Y for a newborn), leap years, and month-boundary crossings.

**BR-005:** If sample collection date is missing but order entry date exists, use order entry date and set `patientAgeApproximate = true`. The UI MUST indicate the approximation with a "~" prefix (e.g., "~0D-3M-25Y").

**BR-006:** Sex and age display MUST be consistent across all validation levels (routine, technical, supervisor). No level-specific differences.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| **New keys (this feature)** | |
| `label.validation.patientSex` | Sex |
| `label.validation.patientAge` | Age (D-M-Y) |
| `label.validation.sex.male` | Male |
| `label.validation.sex.female` | Female |
| `label.validation.sex.unknown` | Unknown |
| `label.validation.sex.male.short` | M |
| `label.validation.sex.female.short` | F |
| `label.validation.sex.unknown.short` | U |
| `label.validation.age.unknown` | Unknown |
| `label.validation.age.approximate.tooltip` | Age is approximate — sample collection date was not recorded |
| `heading.validation.patientInfo` | Patient Information |
| `label.validation.patientId` | Patient ID |
| `label.validation.collectionDate` | Collection Date |
| **Existing keys (verified in mockup)** | |
| `label.validation.accessionNumber` | Accession # |
| `label.validation.patientName` | Patient |
| `label.validation.testName` | Test |
| `label.validation.result` | Result |
| `label.validation.unit` | Unit |
| `label.validation.normalRange` | Normal Range |
| `label.validation.status` | Status |
| `label.validation.status.pending` | Pending |
| `label.validation.status.accepted` | Accepted |
| `label.validation.status.rejected` | Rejected |
| `label.validation.resultsDescription` | Review results and verify reference ranges against patient sex and age. |
| `heading.validation.routine` | Routine Validation |
| `heading.validation.results` | Results Pending Validation |
| `placeholder.validation.search` | Search by accession, patient, or test... |
| `button.validation.accept` | Accept |
| `button.validation.reject` | Reject |
| `button.validation.acceptSelected` | Accept Selected |
| `button.validation.rejectSelected` | Reject Selected |
| `button.validation.save` | Save |
| `message.validation.accepted` | Results validated successfully. |
| `message.validation.rejected` | Results rejected. |
| `nav.home` | Home |
| `nav.validation` | Validation |
| `nav.validation.routine` | Routine Results |

---

## 10. Validation Rules

No form validation rules apply — all fields are read-only display. Server-side validation of the age calculation is covered by unit tests.

| Computation | Rule | Handling |
|---|---|---|
| Age calculation | DOB must not be after collection date | Display "—" if DOB > collection date (data error) |
| Sex normalization | Must be "M", "F", or null | Normalize anything else to "U" |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View validation screen (including sex/age) | `result.validate` | Page not shown in menu |

No new permissions are introduced. Sex and age are read-only patient demographics already visible on other screens (patient record, order entry). Displaying them on the validation screen does not expand data access beyond what validators already have.

---

## 12. Acceptance Criteria

### Functional

- [ ] Patient header displays full sex word ("Male"/"Female"/"Unknown") with a Carbon Tag
- [ ] Patient header displays age in D-M-Y format (e.g., "0D-3M-25Y")
- [ ] DataTable includes "Sex" column with single letter ("M"/"F"/"U")
- [ ] DataTable includes "Age" column with D-M-Y format
- [ ] Age is calculated from sample collection date, not current date
- [ ] Sex and Age columns are sortable
- [ ] When DOB is missing, table shows "—" and header shows "Unknown"
- [ ] When sex is missing, table shows "U" and header shows "Unknown"
- [ ] When collection date is missing, age uses order entry date with "~" prefix
- [ ] Sex and age display on routine, technical, and supervisor validation levels

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Page load time is not measurably degraded (sex/age adds negligible payload)
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with French language file to verify i18n

### Integration

- [ ] Existing validation workflow (accept/reject/save) is unaffected by the new columns
- [ ] Reference Ranges module is NOT modified — this feature is display-only
