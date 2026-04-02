# Validation Screen Enhancements
## Functional Requirements Specification — v2.0

**Version:** 2.1
**Date:** 2026-04-01
**Status:** Draft for Review
**Jira:** OGC-291 (Validation), OGC-343
**Gallery:** [Validation Page Mockup](https://digi-uw.github.io/openelis-work/#/results-validation/validation-page)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Validation, Results Entry, Reference Ranges, Admin Configuration

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

This specification covers a staged set of enhancements to the OpenELIS Global validation screen. These changes improve validator confidence in result correctness and support configurable multi-level validation workflows.

**Enhancement A — Patient Demographics (Sex & Age):** Adds patient biological sex and age (Days-Months-Years format, calculated at sample collection date) as inline columns in the results table and in the patient header. Enables validators to verify that normal/reference ranges are appropriate for the patient's demographic profile without navigating away.

**Enhancement B — Multi-Level Validation Column:** When the lab is configured for more than one validation level, a new "Validation" column appears in the results table showing the current level (e.g., "Validation 1/2"). This column is hidden for single-level labs to avoid visual noise.

**Enhancement C — Context-Aware Save Button:** The Save button label dynamically reflects what will happen when clicked — showing counts of results that will be released versus advanced to the next validation level.

**Enhancement D — Validation History Tooltip:** Hovering or clicking the validation level tag reveals a tooltip showing the full validation progress: which levels are complete, who validated at each level and when, and which level is currently awaiting action.

**Enhancement E — Expanded Detail Panel Parity with Results Entry:** Brings the validation expanded row panel into alignment with the Results Entry page's expanded panel. Adds always-visible Notes section (view and add), Interpretation section (read-only review), full tab bar (Method & Reagents, Order Info, Attachments, QA/QC, History, Referral), result range tier highlighting (normal/abnormal/critical/invalid), and NCE badge visibility — so validators have full clinical context without navigating away.

---

## 2. Problem Statement

### 2.1 Demographics Gap (Enhancement A)

**Current state:** Validators can see the test name, result value, and normal range, but cannot see the patient's sex or age. To verify that the reference range is appropriate (e.g., pediatric vs. adult, male vs. female for analytes like creatinine or hemoglobin), validators must navigate away to the patient record, mentally calculate the age, then return. This disrupts workflow and increases the risk of approving results against incorrect reference ranges.

**Impact:** Mismatched reference ranges can lead to false normal/abnormal classifications. In pediatric and neonatal care, where reference ranges shift rapidly with age, the risk is especially acute.

**Proposed solution:** Display patient sex (single letter: M/F/U) and age (Days-Months-Years format) as two new table columns and in the patient header.

### 2.2 Multi-Level Validation Visibility (Enhancements B, C, D)

**Current state:** When a lab configures multi-level validation (e.g., supervisor review followed by lab manager sign-off), the validation screen shows no indication of which level the result is currently at, who has already validated, or what the Save action will do (release vs. advance). Validators operate without context about where a result sits in the approval chain.

**Impact:** Validators may not realize a result still needs additional sign-offs, leading to confusion about why a result wasn't released after they saved. Supervisors reviewing second-level results have no quick way to see who performed the first validation, requiring them to check audit logs.

**Proposed solution:** (B) Add a "Validation X/Y" column that appears only when multi-level validation is active. (C) Make the Save button label reflect the outcome of the current action. (D) Provide a tooltip on the level tag showing the complete validation chain with names and timestamps.

### 2.3 Incomplete Detail Context (Enhancement E)

**Current state:** The validation expanded row shows only a result value input, normal range, method/analyzer, and three tabs (Method & Reagents, History, QA/QC). Validators cannot see notes left by the lab technician during entry, interpretation context, order information, attachments, referral status, or NCE flags. To review this information, they must navigate to the Results Entry page or patient record, losing their place in the validation queue.

**Impact:** Validators make approval decisions without full context. A tech may have left a note explaining an anomalous value ("hemolyzed specimen, recollected, result confirmed on repeat"), but the validator cannot see it. Critical or abnormal range highlighting is absent, so validators must mentally compare every value against the reference range. NCE flags are invisible, meaning a validator might approve a result that has a pending non-conformity event.

**Proposed solution:** Mirror the Results Entry expanded panel structure in the validation view: always-visible Notes section (view and add new validation notes), read-only Interpretation display, full 6-tab bar (Method & Reagents, Order Info, Attachments, QA/QC, History, Referral), result range tier color coding, and NCE badge display in the flags column.

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

### 4.4 Multi-Level Validation Column (Enhancement B)

**FR-LVL-001:** When the lab is configured for more than one validation level (`levelsRequired > 1`), the results table MUST display a "Validation" column showing the result's current position in the validation chain.

**FR-LVL-002:** The Validation column MUST display a tag showing "Validation X/Y" where X is the current validation level and Y is the total levels required (e.g., "Validation 1/2", "Validation 2/2").

**FR-LVL-003:** When the result has completed one or more previous validation levels (i.e., `validationLevelCurrent > 1`), the tag MUST include a checkmark icon to indicate prior levels are complete.

**FR-LVL-004:** When the result is at its final validation level (`validationLevelCurrent == validationLevelsRequired`), the tag MUST use a visually distinct style (teal background) to signal that saving will release the result.

**FR-LVL-005:** When the result is at an intermediate level (not final), the tag MUST use a different style (blue background) to signal that saving will advance the result to the next level.

**FR-LVL-006:** The Validation column MUST be hidden entirely when the lab is configured for single-level validation (`levelsRequired == 1`) to avoid visual clutter. The table structure MUST remain unchanged for single-level labs.

**FR-LVL-007:** The Validation column MUST be positioned between the "Result" column and the "Save" checkbox column.

### 4.5 Context-Aware Save Button (Enhancement C)

**FR-SAV-001:** When multi-level validation is active and one or more results are checked for saving, the Save button label MUST dynamically reflect the outcome of the save action.

**FR-SAV-002:** If all checked results are at their final validation level, the Save button MUST read: `Save — validates & releases N result(s)` where N is the count.

**FR-SAV-003:** If all checked results are at an intermediate level, the Save button MUST read: `Save — advances N result(s) to next level` where N is the count.

**FR-SAV-004:** If the checked results include a mix of final-level and intermediate-level results, the Save button MUST read: `Save — N will release, M will advance` where N and M are the respective counts.

**FR-SAV-005:** When no results are checked, or when the lab uses single-level validation, the Save button MUST display the default label "Save".

**FR-SAV-006:** The Save button label MUST update in real time as the user checks or unchecks individual Save checkboxes, Save All Normal, or Save All Results.

### 4.6 Validation History Tooltip (Enhancement D)

**FR-TIP-001:** Hovering over or clicking the validation level tag (FR-LVL-002) MUST display a tooltip/popover showing the full validation progress for that result.

**FR-TIP-002:** The tooltip MUST display each validation level as a row containing: the level number, the required role name (e.g., "Supervisor", "Lab Manager"), and the status.

**FR-TIP-003:** For completed validation levels, the tooltip MUST show: a checkmark icon, the validator's name, and the date/time of validation (e.g., "Dr. Williams — 03/01/2026 10:15").

**FR-TIP-004:** For the current (in-progress) validation level, the tooltip MUST show: an open circle icon and the text "Awaiting your validation".

**FR-TIP-005:** For future (not-yet-reached) validation levels, the tooltip MUST show: a dimmed circle icon and the text "Pending".

**FR-TIP-006:** The tooltip MUST include a title "Validation Progress" at the top.

**FR-TIP-007:** The tooltip MUST dismiss when the user moves the mouse away from the tag (on hover) or clicks outside the tooltip (on click).

### 4.7 Expanded Panel — Notes Section (Enhancement E)

**FR-NOTE-001:** The expanded validation panel MUST include an always-visible, collapsible Notes section positioned above the tab bar, matching the layout of the Results Entry expanded panel.

**FR-NOTE-002:** The Notes section MUST display all existing notes for the result, including notes added during Results Entry, modification reason notes (prefixed `[Modification reason]`), and any prior validation notes.

**FR-NOTE-003:** Each note MUST display: author name, date/time, note type badge (internal / external / modification), and body text.

**FR-NOTE-004:** Validators MUST be able to add new notes via an inline "Add Note" form within the Notes section. New notes are tagged with type "validation" and the current validator's identity.

**FR-NOTE-005:** The "Add Note" form MUST contain a text area and a "Save Note" button. The button MUST be disabled when the text area is empty.

**FR-NOTE-006:** Notes added during validation MUST persist immediately (saved to the result's note list via API) and appear in the Notes section without requiring a page refresh.

**FR-NOTE-007:** The Notes section header MUST show a count badge indicating the total number of notes (e.g., "Notes (3)").

### 4.8 Expanded Panel — Interpretation Section (Enhancement E)

**FR-INTERP-001:** The expanded validation panel MUST include an always-visible, collapsible Interpretation section positioned below Notes and above the tab bar.

**FR-INTERP-002:** The Interpretation section MUST display any interpretation entered during Results Entry, including: the selected interpretation template (if any) and the free-text interpretation body.

**FR-INTERP-003:** The Interpretation section is read-only on the Validation page. Validators can review but not edit interpretations. Interpretation authoring remains on the Results Entry page.

**FR-INTERP-004:** If no interpretation was entered during Results Entry, the section MUST display a muted placeholder: "No interpretation entered."

### 4.9 Expanded Panel — Full Tab Bar (Enhancement E)

**FR-TAB-001:** The expanded validation panel MUST include the same 6-tab bar as the Results Entry expanded panel: Method & Reagents (default), Order Info, Attachments, QA/QC, History, Referral.

**FR-TAB-002:** The **Method & Reagents** tab MUST show the analyzer name, method, and reagent lot/expiry information associated with the result.

**FR-TAB-003:** The **Order Info** tab MUST show the order details: ordering clinician, order date, priority, clinical notes, and specimen collection information.

**FR-TAB-004:** The **Attachments** tab MUST display any files attached to the result (images, PDFs, instrument printouts). Validators can view but not add attachments from the Validation page.

**FR-TAB-005:** The **QA/QC** tab MUST show QC status, control values, and Levey-Jennings context for the result's analyte/instrument combination.

**FR-TAB-006:** The **History** tab MUST show previous results for the same patient and test, including dates, values, deltas, and who validated each.

**FR-TAB-007:** The **Referral** tab MUST show referral status if the result was referred to or from an external lab, including the referring lab name, referral date, and status.

### 4.10 Result Range Tier Highlighting (Enhancement E)

**FR-RANGE-001:** The result value in both the collapsed row and expanded panel MUST be color-coded according to the same range tier classification used on the Results Entry page: Normal (default), Abnormal (yellow), Critical (orange), Invalid (dark red).

**FR-RANGE-002:** Range evaluation MUST use the `rangeBounds` data (normal, critical, valid ranges) returned by the API for each result.

**FR-RANGE-003:** The Flags column MUST display range badges (H, L, C, !) matching the Results Entry page's flag system.

**FR-RANGE-004:** On the Validation page, range highlighting is informational only — it does NOT gate the validate/advance action. Validators can approve results regardless of range tier.

### 4.11 NCE Badge Display (Enhancement E)

**FR-NCE-001:** When a result has a linked Non-Conformity Event, the Flags column MUST display an "NCE" badge: teal for open NCEs, gray for closed NCEs.

**FR-NCE-002:** The NCE badge tooltip MUST show: NCE number, category, subcategory, severity, and status — matching the Results Entry page badge behavior.

**FR-NCE-003:** Results with open NCEs that have status "Cancelled" MUST still appear in the validation list (if their lab unit is selected) but their validate checkbox MUST be disabled with a tooltip: "Cannot validate — open NCE."

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
| LabConfig | levelsRequired | Integer | Already stored; default 1 |
| LabConfig | levels[] | Array | Already stored; each entry has level number and role name |
| ValidationHistory | level | Integer | Already stored per result |
| ValidationHistory | validatedBy | String | Already stored |
| ValidationHistory | validatedAt | Timestamp | Already stored |
| ValidationHistory | role | String | Already stored |
| ValidationHistory | action | String | Already stored ("VALIDATE", "REJECT", etc.) |

### Computed Fields (API response only)

| Field | Type | Computation | Notes |
|---|---|---|---|
| patientAge | String | `collectionDate - dateOfBirth` → "XD-YM-ZY" | Calculated server-side per result |
| patientSex | String | Direct from Patient.sex, defaulting to "U" | Normalized for display |
| validationLevelsRequired | Integer | From LabConfig (lab-wide or unit override) | Per-result for display |
| validationLevelCurrent | Integer | Next validation level needed for this result | 1-indexed |
| validationHistory | Array | List of completed validation entries | Includes who, when, role, action |

---

## 6. API Endpoints

No new endpoints required. The existing validation results endpoint must be modified:

| Method | Path | Change | Permission |
|---|---|---|---|
| GET | `/api/v1/validation/results` | Add demographics and validation-level fields to each result item | `result.validate` |

**Response field additions (v2.1 — includes Enhancement E fields):**

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
      "normalRange": "...",
      "rangeBounds": {
        "normal": { "low": 4.0, "high": 10.0 },
        "critical": { "low": 2.0, "high": 30.0 },
        "valid": { "low": 0.1, "high": 100.0 }
      },
      "validationLevelsRequired": 2,
      "validationLevelCurrent": 1,
      "validationHistory": [
        {
          "level": 1,
          "validatedBy": "Dr. Williams",
          "validatedAt": "2026-03-01T10:15:00Z",
          "role": "Supervisor",
          "action": "VALIDATE"
        }
      ],
      "notes": [
        {
          "id": 1,
          "date": "2026-03-01T09:30:00Z",
          "author": "J. Smith",
          "type": "internal",
          "body": "Hemolyzed specimen, recollected and confirmed on repeat."
        }
      ],
      "interpretation": {
        "code": "RBC-ANEMOD",
        "label": "Mild Anemia",
        "text": "RBC count slightly below reference range. Recommend correlation with Hgb, Hct, and reticulocyte count."
      },
      "nce": {
        "number": "NCE-20260301-1234",
        "status": "open",
        "category": "Analytical",
        "subcategory": "Instrument Malfunction",
        "severity": "Minor"
      },
      "orderInfo": {
        "orderingClinician": "Dr. Chen",
        "orderDate": "2026-02-28",
        "priority": "Routine",
        "clinicalNotes": "Annual checkup",
        "collectionInfo": "Venipuncture, left arm"
      },
      "attachments": [],
      "referral": null
    }
  ]
}
```

**Field definitions:**

- `patientSex`: "M", "F", or "U"
- `patientAge`: Formatted D-M-Y string, or null if DOB is missing
- `patientAgeApproximate`: Boolean — true if collection date was missing and order entry date was used instead
- `rangeBounds`: Object — normal, critical, and valid range boundaries for client-side range tier evaluation (same structure as Results Entry API)
- `validationLevelsRequired`: Integer — total validation levels configured for this result's lab unit (from LabConfig or unit override)
- `validationLevelCurrent`: Integer — the validation level this result is currently awaiting (1-indexed; equals `validationLevelsRequired` at the final level)
- `validationHistory`: Array — list of completed validation entries, each with `level`, `validatedBy`, `validatedAt`, `role`, and `action`
- `notes`: Array — all notes on the result (from entry, modification, or validation), each with `id`, `date`, `author`, `type`, and `body`
- `interpretation`: Object or null — interpretation entered during Results Entry, with `code`, `label`, and `text`
- `nce`: Object or null — linked Non-Conformity Event, with `number`, `status`, `category`, `subcategory`, `severity`
- `orderInfo`: Object — order details including clinician, date, priority, clinical notes, collection info
- `attachments`: Array — file attachment metadata
- `referral`: Object or null — referral details if applicable

**New endpoint for validation notes:**

| Method | Path | Description | Permission |
|---|---|---|---|
| POST | `/api/v1/validation/results/{id}/notes` | Add a validation note to a result | `result.validate` |

**Request body:**

```json
{
  "body": "Confirmed with repeat testing. Validated.",
  "type": "validation"
}
```

---

## 7. UI Design

### Companion Mockups

| Mockup | Scope | Notes |
|---|---|---|
| `validation-page-stage1-demographics-mockup.jsx` | Stage 1 flat table with Demographics + Validation column + Save button + Tooltip | Primary reference for implementation |
| `validation-page-mockup-v3-demographics.jsx` | Expanded-row view with demographics in both table and patient banner | Future stage reference |
| `validation-page-stage1-mockup.jsx` | Stage 1 baseline without demographics | Before/after comparison |

### Navigation Path

Validation → Routine Results / Technical Validation / Supervisor Validation

### Key Screens

1. **Validation Results List** — Enhanced with Sex and Age columns, conditional Validation column, context-aware Save button, and validation history tooltips.

### Interaction Patterns

- **Read-only demographics** — Sex and Age columns are display-only, no edit behavior
- **Sortable columns** — Sex and Age columns support click-to-sort
- **Conditional Validation column** — Appears only when `levelsRequired > 1`; hidden for single-level labs
- **Validation level tag** — Interactive: hover or click reveals history tooltip
- **Tooltip dismiss** — Mouse-leave or click-outside dismisses the validation history tooltip
- **Dynamic Save label** — Updates in real time as checkboxes are toggled

---

## 8. Business Rules

### Demographics (Enhancement A)

**BR-001:** Age MUST always be calculated relative to the sample collection date, not the current date or the validation date.

**BR-002:** If dateOfBirth is null, age displays as "—" (em dash) in the table and "Unknown" in the header.

**BR-003:** If sex is null or not one of the recognized values, it MUST normalize to "U" (Unknown).

**BR-004:** The age calculation MUST handle edge cases: same-day collection (0D-0M-0Y for a newborn), leap years, and month-boundary crossings.

**BR-005:** If sample collection date is missing but order entry date exists, use order entry date and set `patientAgeApproximate = true`. The UI MUST indicate the approximation with a "~" prefix (e.g., "~0D-3M-25Y").

**BR-006:** Sex and age display MUST be consistent across all validation levels (routine, technical, supervisor). No level-specific differences.

### Multi-Level Validation (Enhancements B, C, D)

**BR-007:** The Validation column MUST only appear when `levelsRequired > 1`. For single-level labs (`levelsRequired == 1`), the column MUST be completely absent from the DOM — not merely hidden.

**BR-008:** Saving a result at an intermediate validation level (`validationLevelCurrent < validationLevelsRequired`) MUST advance it to the next level. Saving at the final level MUST release the result.

**BR-009:** The Save button label MUST reflect the combined effect of all currently checked results. It MUST update immediately (no debounce) when checkboxes change.

**BR-010:** The validation history tooltip MUST show entries only for completed levels. It MUST NOT display history for the current or future levels beyond the status indicator.

**BR-011:** When "Save All Normal" is checked, only results where `isNonconforming == false` are included. When "Save All Results" is checked, all results are included regardless of nonconforming status.

**BR-012:** A result's `validationLevelCurrent` MUST be derived from its `validationHistory` — it equals `max(history.level) + 1`, capped at `validationLevelsRequired`. If no history exists, the current level is 1.

### Expanded Panel Parity (Enhancement E)

**BR-013:** Notes from all sources (entry, modification, prior validation) MUST be displayed in chronological order, oldest first. New validation notes appear at the bottom.

**BR-014:** Validation notes added via the expanded panel MUST be persisted immediately via API and MUST NOT require a page-level save action. The note save is independent of the validate action.

**BR-015:** The Interpretation section MUST be read-only on the Validation page. The validator's role is to review and approve, not to author interpretations.

**BR-016:** Range tier evaluation on the Validation page MUST use the same `evaluateResult(value, rangeBounds)` function as Results Entry: invalid → critical → abnormal → normal, evaluated in that priority order.

**BR-017:** Range highlighting on the Validation page is purely informational. Unlike Results Entry (where critical values gate the save action), the validator can approve any result regardless of range tier. No acknowledgment gate is required.

**BR-018:** NCE badges on the Validation page MUST render from the same `nce` data structure as Results Entry. Open NCEs disable the validate checkbox; closed NCEs are informational only.

**BR-019:** The full 6-tab bar tab data (Order Info, Attachments, Referral) is lazy-loaded on expand — the initial validation results list API returns only the summary fields. Detail data is fetched on demand when the row is expanded.

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
| **New keys (Enhancement B — Validation Column)** | |
| `label.validation.level` | Validation |
| `label.validation.level.progress` | Validation {current}/{total} |
| `label.validation.level.tooltip.title` | Validation Progress |
| `label.validation.level.tooltip.complete` | Level {level} ({role}) |
| `label.validation.level.tooltip.awaiting` | Awaiting your validation |
| `label.validation.level.tooltip.pending` | Pending |
| **New keys (Enhancement C — Save Button)** | |
| `button.validation.save.release` | Save — validates & releases {count} result(s) |
| `button.validation.save.advance` | Save — advances {count} result(s) to next level |
| `button.validation.save.mixed` | Save — {releaseCount} will release, {advanceCount} will advance |
| **New keys (Enhancement E — Expanded Panel)** | |
| `label.validation.notes` | Notes |
| `label.validation.notes.count` | Notes ({count}) |
| `label.validation.notes.add` | Add Note |
| `button.validation.notes.save` | Save Note |
| `placeholder.validation.notes.add` | Add a validation note... |
| `label.validation.notes.type.internal` | Internal |
| `label.validation.notes.type.external` | External |
| `label.validation.notes.type.modification` | Modification |
| `label.validation.notes.type.validation` | Validation |
| `label.validation.notes.empty` | No notes on this result. |
| `label.validation.interpretation` | Interpretation |
| `label.validation.interpretation.empty` | No interpretation entered. |
| `label.validation.tab.method` | Method & Reagents |
| `label.validation.tab.orderInfo` | Order Info |
| `label.validation.tab.attachments` | Attachments |
| `label.validation.tab.qaqc` | QA/QC |
| `label.validation.tab.history` | History |
| `label.validation.tab.referral` | Referral |
| `label.validation.range.abnormal` | Abnormal |
| `label.validation.range.critical` | Critical |
| `label.validation.range.invalid` | Invalid |
| `label.validation.nce` | NCE |
| `label.validation.nce.tooltip` | NCE {number} · {category} / {subcategory} · {severity} · {status} |
| `label.validation.nce.cannotValidate` | Cannot validate — open NCE |
| `label.validation.orderInfo.clinician` | Ordering Clinician |
| `label.validation.orderInfo.date` | Order Date |
| `label.validation.orderInfo.priority` | Priority |
| `label.validation.orderInfo.clinicalNotes` | Clinical Notes |
| `label.validation.orderInfo.collection` | Specimen Collection |
| `label.validation.attachments.empty` | No attachments. |
| `label.validation.referral.empty` | No referral information. |
| `message.validation.noteSaved` | Note saved. |
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

No form validation rules apply — all new display fields are read-only. Server-side validation of the age calculation and level tracking is covered by unit tests.

| Computation | Rule | Handling |
|---|---|---|
| Age calculation | DOB must not be after collection date | Display "—" if DOB > collection date (data error) |
| Sex normalization | Must be "M", "F", or null | Normalize anything else to "U" |
| Validation level bounds | `validationLevelCurrent` must be between 1 and `validationLevelsRequired` | Clamp to valid range; log warning |
| History consistency | Each history entry's level must be < `validationLevelCurrent` | Ignore out-of-range entries; log warning |
| Save action integrity | Cannot save a result if `validationLevelCurrent` is 0 or has already been fully released | Disable Save checkbox for released results |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View validation screen (including sex/age, validation levels) | `result.validate` | Page not shown in menu |
| Perform validation (save/advance/release) | `result.validate` | Save button disabled |
| Add validation note | `result.validate` | Add Note form not shown |
| View notes, interpretation, attachments, order info | `result.validate` | Hidden (inherits from page access) |

No new permissions are introduced. Sex, age, and validation level information are read-only display fields. The validation history tooltip shows only names of validators who have already acted — this is existing audit data, not a new access grant. RBAC is unchanged from the current system.

---

## 12. Acceptance Criteria

### Enhancement A — Patient Demographics

- [ ] DataTable includes "Sex" column with single letter ("M"/"F"/"U")
- [ ] DataTable includes "Age (D-M-Y)" column with Days-Months-Years format
- [ ] Sex and Age columns are positioned between Sample Info and Test Name
- [ ] Age is calculated from sample collection date, not current date
- [ ] Sex and Age columns are sortable
- [ ] When DOB is missing, table shows "—" for age
- [ ] When sex is missing, table shows "U"
- [ ] When collection date is missing, age uses order entry date with "~" prefix in amber italic
- [ ] Neonatal patient (e.g., 3-month-old) shows age like "4D-3M-0Y"
- [ ] Sex and age display on routine, technical, and supervisor validation levels

### Enhancement B — Multi-Level Validation Column

- [ ] "Validation" column appears when `levelsRequired > 1`
- [ ] "Validation" column is hidden when `levelsRequired == 1`
- [ ] Tag shows "Validation X/Y" with correct level numbers
- [ ] Tag at intermediate level uses blue styling
- [ ] Tag at final level uses teal styling with checkmark icon
- [ ] Tag at level 1 (no prior validations) shows no checkmark icon
- [ ] Column is positioned between Result and Save columns

### Enhancement C — Context-Aware Save Button

- [ ] Save button reads "Save" when nothing is checked
- [ ] Save button reads "Save" for single-level labs regardless of what is checked
- [ ] Checking results at final level shows "Save — validates & releases N result(s)"
- [ ] Checking results at intermediate level shows "Save — advances N result(s) to next level"
- [ ] Checking a mix of final and intermediate results shows "Save — N will release, M will advance"
- [ ] Label updates immediately when checkboxes are toggled
- [ ] "Save All Normal" correctly excludes nonconforming results from count
- [ ] "Save All Results" includes all results in count

### Enhancement D — Validation History Tooltip

- [ ] Hovering over the validation tag shows the tooltip
- [ ] Clicking the validation tag shows the tooltip
- [ ] Tooltip title reads "Validation Progress"
- [ ] Completed levels show checkmark icon, validator name, and date/time
- [ ] Current level shows open circle icon and "Awaiting your validation"
- [ ] Future levels show dimmed circle icon and "Pending"
- [ ] Tooltip dismisses on mouse-leave
- [ ] Tooltip dismisses on click-outside

### Enhancement E — Expanded Panel Parity

#### Notes
- [ ] Notes section is always visible in expanded panel, above tab bar
- [ ] All existing notes display in chronological order with author, date, type badge, and body
- [ ] Modification reason notes display with "[Modification reason]" prefix and distinct badge
- [ ] Validator can add a new note via inline "Add Note" form
- [ ] New note persists immediately via API without requiring page-level save
- [ ] Note count badge updates when a note is added
- [ ] Empty state shows "No notes on this result."

#### Interpretation
- [ ] Interpretation section is always visible in expanded panel, below Notes
- [ ] Displays selected interpretation template label and free-text body from Results Entry
- [ ] Section is read-only — no edit controls
- [ ] Empty state shows "No interpretation entered."

#### Full Tab Bar
- [ ] Tab bar shows 6 tabs: Method & Reagents, Order Info, Attachments, QA/QC, History, Referral
- [ ] Method & Reagents tab shows analyzer, method, reagent lot/expiry
- [ ] Order Info tab shows clinician, order date, priority, clinical notes, collection info
- [ ] Attachments tab lists file attachments (view-only)
- [ ] QA/QC tab shows control values and QC status
- [ ] History tab shows previous results with dates, values, deltas, and validators
- [ ] Referral tab shows referral status or "No referral information"
- [ ] Tab data lazy-loads on expand

#### Range Tier Highlighting
- [ ] Result values color-coded: normal (default), abnormal (yellow), critical (orange), invalid (dark red)
- [ ] Flags column shows H, L, C, ! badges matching Results Entry
- [ ] Range highlighting is informational — does NOT gate validate action
- [ ] Range evaluation uses same `evaluateResult()` logic as Results Entry

#### NCE Badges
- [ ] Teal NCE badge shown in Flags column for open NCEs
- [ ] Gray NCE badge shown for closed NCEs
- [ ] NCE badge tooltip shows number, category, subcategory, severity, status
- [ ] Validate checkbox disabled for results with open NCEs
- [ ] Disabled checkbox shows tooltip: "Cannot validate — open NCE"

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Page load time is not measurably degraded
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with French language file to verify i18n
- [ ] Single-level lab UI is visually identical to pre-enhancement layout (no Validation column visible)

### Integration

- [ ] Existing validation workflow (accept/reject/save) is unaffected by the new columns
- [ ] Reference Ranges module is NOT modified — this feature is display-only
- [ ] Validation history entries are created by the existing audit system — no new audit writes required
- [ ] Notes added on Validation page are visible on Results Entry page (shared note list)
- [ ] Interpretation entered on Results Entry page is visible on Validation page (read-only)
- [ ] NCE badge data consistent between Results Entry and Validation pages
- [ ] Range bounds from same source as Results Entry (test/analyte configuration)
- [ ] Validation notes API (`POST /api/v1/validation/results/{id}/notes`) returns 403 for users without `result.validate`
