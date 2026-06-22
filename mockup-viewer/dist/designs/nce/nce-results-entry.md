# NCE Results Entry Integration
## Functional Requirements Specification

**Document Version:** 3.0  
**Date:** February 18, 2026  
**Author:** Casey Iiams-Hauser  
**Mockup Reference:** `nce-results-entry-v2.jsx`

---

## Related Documents

| Document | Scope |
|----------|-------|
| **NCE Dashboard & CAPA Management FRS** | Navigation, NCE list views, CAPA workflow, batch actions |
| **NCE Non-Conformity Report FRS** | NCE creation form, data model, categories, linking, configuration, triggers |
| **NCE Analytics FRS** | KPI dashboard, trend charts, reports, export |

---

## 1. Overview

This specification defines how Non-Conformity Event (NCE) recording is integrated into the Results Entry and Result Validation screens. Rather than opening modal dialogs, NCE forms expand inline within the result row, maintaining context and reducing workflow disruption.

### 1.1 Purpose

- Enable contextual NCE creation directly from the point of occurrence in Results Entry
- Provide inline delta check alerts with one-click NCE creation
- Auto-populate NCE fields from result context to reduce data entry
- Display NCE indicators on results that have associated quality events
- Support configurable automatic prompts for quality-significant results

### 1.2 i18n Requirement

All user-facing text — including labels, button text, alert messages, context banner content, form fields, severity descriptions, and sample action descriptions — MUST be externalized to resource bundles for multi-language (i18n) support.

---

## 2. Results Entry Screen Context

The Results Entry screen follows the existing OpenELIS layout accessible via Results → Results Entry in the sidebar.

### 2.1 Column Headers

| Column | Description | Tag |
|--------|-------------|-----|
| Lab Number | Order accession number | `label.results.labNumber` |
| Patient | Patient name | `label.results.patient` |
| Test | Test name | `label.results.test` |
| Normal Range | Reference range for the test | `label.results.normalRange` |
| Result | Entered result value | `label.results.result` |
| Flags | Flag badges (Critical High/Low, High/Low, Delta Check) | `label.results.flags` |

### 2.2 Result Row (Collapsed)

Each result displays as a single row with expandable detail:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▶  DEV01260000000123  Smith, John  Potassium  3.5–5.0  6.8 mmol/L  ⚠ CritH │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Result Row (Expanded)

Clicking the chevron expands to show existing detail sections plus a new "Report NCE" action:

**Patient Info Banner:** Gray background strip with patient demographics.

**Detail Sections (existing):** Notes, Interpretation, Method & Reagents, Order Info, Attachments, History, QA/QC, Referral — all existing OpenELIS functionality unchanged.

**Row Actions Bar:**

| Action | Description | Style | Tag |
|--------|-------------|-------|-----|
| Accept Result | Accept the result for validation | Primary (teal) | `label.results.action.accept` |
| Add Note | Add a note to the result | Secondary (outlined) | `label.results.action.addNote` |
| Report NCE | Opens inline NCE form below the row | Secondary (outlined, orange border) | `label.results.action.reportNce` |
| Review Delta | Opens delta check details (if delta flag present) | Secondary (outlined, purple border) | `label.results.action.reviewDelta` |

---

## 3. Inline NCE Form

When "Report NCE" is clicked from a result row action, an inline NCE form expands below the result row. This replaces the previous modal-based approach.

### 3.1 Visual Design

The inline form uses a warm-toned panel to visually distinguish it from the normal result expansion:

| Property | Value |
|----------|-------|
| Top border | 3px solid `#e65100` (orange) |
| Background | `#fffbf0` (warm cream) |
| Left/right margin | Aligned with result row content |
| Animation | Slide-down expand, 200ms ease-out |

### 3.2 Context Banner (Auto-populated)

A read-only context banner appears at the top of the inline form, auto-populated from the result that triggered it:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📌 CONTEXT                                                                  │
│    Lab #: DEV01260000000123 · Test: Potassium · Result: 6.8 mmol/L          │
│    Patient: Smith, John (3456789) · Flags: Critical High                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Auto-populated fields:**

| Field | Source | Tag |
|-------|--------|-----|
| Lab Number | Current order accession number | `label.nce.context.labNumber` |
| Test | Current test name | `label.nce.context.test` |
| Result | Current result value with units | `label.nce.context.result` |
| Patient | Patient name and ID | `label.nce.context.patient` |
| Flags | Any active flag badges | `label.nce.context.flags` |

### 3.3 Form Fields

| Field | Required | Type | Default (Contextual) | Tag |
|-------|----------|------|---------------------|-----|
| Category | Yes | Dropdown | "Analytical" | `label.nce.field.category` |
| Subcategory | Yes | Dropdown | Filtered by selected category | `label.nce.field.subcategory` |
| Severity | Yes | Radio cards | "Critical" if critical value flag present; otherwise blank | `label.nce.field.severity` |
| Title | No | Text input | Empty | `label.nce.field.title` |
| Description | No | Textarea | Empty | `label.nce.field.description` |
| Immediate Action | No | Textarea | Empty | `label.nce.field.immediateAction` |
| Sample Action | Yes | Radio cards | "Continue with NCE flag" | `label.nce.field.sampleAction` |

#### 3.3.1 Category / Subcategory

Category dropdown defaults to "Analytical" when triggered from Results Entry. Subcategory options filter dynamically based on the selected category. The user can change the category, which updates the subcategory options.

#### 3.3.2 Severity Radio Cards

Three radio card options, each with a description beneath the label:

| Severity | Description | Color | Tag (Label) | Tag (Description) |
|----------|-------------|-------|-------------|-------------------|
| Critical | Patient safety risk, regulatory violation | Red border | `label.nce.severity.critical` | `label.nce.severity.critical.desc` |
| Major | Significant quality or operational impact | Orange border | `label.nce.severity.major` | `label.nce.severity.major.desc` |
| Minor | Limited impact, easily corrected | Amber border | `label.nce.severity.minor` | `label.nce.severity.minor.desc` |

**Auto-selection:** When the triggering result has a critical flag (Critical High or Critical Low), severity defaults to "Critical."

#### 3.3.3 Sample Action Radio Cards

| Option | Description | Tag (Label) | Tag (Description) |
|--------|-------------|-------------|-------------------|
| Continue with NCE flag | Record NCE but continue processing the sample. An NCE flag appears on the result. | `label.nce.sampleAction.continue` | `label.nce.sampleAction.continue.desc` |
| Reject sample | Record NCE and reject the sample. Sample status set to "Rejected" and pending tests cancelled. | `label.nce.sampleAction.reject` | `label.nce.sampleAction.reject.desc` |

### 3.4 Linked Items (Read-only)

Below the form fields, a read-only "Linked Items" section shows what will be automatically linked:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔗 LINKED ITEMS (auto)                                                      │
│    🧪 Sample: DEV01260000000123 – Serum (Chemistry Panel)                   │
│    📊 Result: Potassium – 6.8 mmol/L                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

- The triggering result is automatically linked
- The parent sample is automatically linked (derived from the result)
- Additional links can be added from the full NCE form (Report NCE from Dashboard)
- Tag: `label.nce.linkedItems.auto`

### 3.5 Form Actions

| Button | Position | Style | Tag |
|--------|----------|-------|-----|
| Cancel | Bottom-right | Ghost (text only) | `label.button.cancel` |
| Submit NCE | Bottom-right | Primary (teal bg) | `label.nce.action.submitNce` |

**Cancel behavior:** Collapses the inline form. No data is saved. The result row returns to its expanded detail state.

**Submit behavior:**
1. Validate required fields (category, subcategory, severity, sample action)
2. Create NCE via `POST /api/nce` with auto-linked items
3. If sample action = "Reject sample": set sample status to Rejected, cancel pending tests
4. Collapse the inline form
5. Display success toast notification with NCE number
6. Add NCE flag badge to the result row

---

## 4. Delta Check Alert

When a result value triggers a delta check threshold (comparison against the patient's previous result for the same test), an inline alert panel expands automatically below the result row.

### 4.1 Visual Design

| Property | Value |
|----------|-------|
| Left border | 3px solid `#6a1b9a` (purple) |
| Background | `#f3e5f5` (light purple) |
| Animation | Slide-down expand, 200ms ease-out |

### 4.2 Alert Content

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠ DELTA CHECK ALERT                                                         │
│                                                                              │
│ Hemoglobin result shows significant change from previous.                    │
│                                                                              │
│ Current: 8.2 g/dL    Previous: 14.1 g/dL (01/03/2026)                      │
│ Change: −41.8%        Threshold: ±30%                                        │
│                                                                              │
│                                      [Dismiss]  [Report NCE]                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Fields:**

| Field | Description | Tag |
|-------|-------------|-----|
| Alert Title | "Delta Check Alert" | `label.nce.deltaCheck.title` |
| Alert Message | Explanation of the delta check trigger | `label.nce.deltaCheck.message` |
| Current Value | Current result value | `label.nce.deltaCheck.currentValue` |
| Previous Value | Most recent prior result with date | `label.nce.deltaCheck.previousValue` |
| Change | Percentage change (absolute) | `label.nce.deltaCheck.change` |
| Threshold | Configured delta check threshold | `label.nce.deltaCheck.threshold` |

### 4.3 Alert Actions

| Button | Behavior | Style | Tag |
|--------|----------|-------|-----|
| Dismiss | Close the alert panel. Dismissal is recorded in audit trail. | Ghost (text only) | `label.button.dismiss` |
| Report NCE | Opens the inline NCE form (Section 3) pre-populated with delta check context | Primary (teal bg) | `label.nce.action.reportNce` |

**Dismiss behavior:**
1. Confirmation dialog: "No NCE will be recorded for this delta check. Continue?" — Tag: `label.nce.deltaCheck.dismissConfirm`
2. If confirmed: alert collapses, dismissal logged to audit trail with user, timestamp, result ID, delta values
3. If cancelled: alert remains open

**Report NCE behavior:**
1. Alert panel collapses
2. Inline NCE form opens with pre-populated fields:
   - Category: "Analytical"
   - Subcategory: "Result Discrepancy"
   - Description: Auto-generated text describing the delta check values
   - Result and sample auto-linked

### 4.4 Delta Check Configuration

Delta check thresholds are configurable per test via Admin → NCE Configuration → Automatic Prompt Settings.

| Setting | Description | Tag |
|---------|-------------|-----|
| Delta Check Enabled | Enable/disable delta check alerts per test | `label.admin.nce.deltaCheck.enabled` |
| Threshold (%) | Percentage change threshold (default: 30%) | `label.admin.nce.deltaCheck.threshold` |
| Threshold (Absolute) | Absolute value change threshold (alternative to percentage) | `label.admin.nce.deltaCheck.absoluteThreshold` |
| Comparison Period | Maximum lookback period for previous results (default: 90 days) | `label.admin.nce.deltaCheck.comparisonPeriod` |

---

## 5. Automatic Prompt Triggers

In addition to delta checks, the following conditions can automatically trigger inline alerts in Results Entry:

### 5.1 Critical Value Entry

When a result value falls within the critical range defined for the test:

**Trigger:** Result entered that meets critical value criteria (critical high or critical low).

**Behavior:** Configurable (mandatory / prompted / disabled).

**Default:** Prompted — alert appears but can be dismissed.

**Pre-populated:** Category = "Analytical", Severity = "Critical", result and sample auto-linked.

### 5.2 Extreme Value Entry

When a result exceeds 3× the upper limit or falls below 0.3× the lower limit:

**Trigger:** Result value outside extreme bounds.

**Behavior:** Configurable (mandatory / prompted / disabled).

**Default:** Prompted.

**Pre-populated:** Category = "Analytical", Subcategory = "Result Discrepancy", result and sample auto-linked.

### 5.3 Trigger Behavior Summary

| Trigger | Default Behavior | Alert Style | Tag |
|---------|-----------------|-------------|-----|
| Delta check threshold exceeded | Prompted | Purple inline alert | `label.nce.trigger.deltaCheck` |
| Critical value entered | Prompted | Red inline alert | `label.nce.trigger.criticalValue` |
| Extreme value (>3× or <0.3× limits) | Prompted | Orange inline alert | `label.nce.trigger.extremeValue` |

All trigger behaviors are individually configurable per site via Admin → NCE Configuration → Trigger Behavior.

---

## 6. Flag Badges on Result Rows

### 6.1 Existing Flags (Unchanged)

These flags are part of existing OpenELIS Results Entry functionality:

| Flag | Condition | Color | Tag |
|------|-----------|-------|-----|
| Critical High | Result above critical high range | Red bg `#fdecea`, red text | `label.flag.criticalHigh` |
| Critical Low | Result below critical low range | Red bg `#fdecea`, red text | `label.flag.criticalLow` |
| High | Result above normal range | Orange bg `#fff3e0`, orange text | `label.flag.high` |
| Low | Result below normal range | Blue bg `#e3f2fd`, blue text | `label.flag.low` |

### 6.2 New Flags (NCE Integration)

| Flag | Condition | Color | Tag |
|------|-----------|-------|-----|
| Delta Check | Delta threshold exceeded (not yet dismissed or resolved) | Purple bg `#f3e5f5`, purple text | `label.flag.deltaCheck` |
| NCE | Result has an associated NCE record | Orange bg `#fff3e0`, orange text, with ⚠ icon | `label.flag.nce` |

### 6.3 NCE Flag Behavior

- The NCE flag appears on a result row after an NCE has been submitted that links to that result
- Clicking the NCE flag navigates to the NCE detail view in the NCE Dashboard
- If a result has multiple associated NCEs, the flag displays a count (e.g., "⚠ NCE (2)")
- The flag persists until all linked NCEs are in Closed – Verified status

---

## 7. Result Validation Screen

The Result Validation screen (Results → Validation) follows the same patterns as Results Entry with these additions:

### 7.1 Additional Trigger Points

| Trigger | # | Behavior | Description |
|---------|---|----------|-------------|
| Result rejection with retest | 3 | Prompted | Validator rejects result and orders retest |
| Result rejection without retest | 4 | Mandatory | Validator rejects result with no retest (nullification) |

### 7.2 Trigger #3: Result Rejection with Retest

**Current behavior:** Validator clicks "Reject – Retest" and original result is marked rejected with a new test instance created.

**NCE integration:** After the rejection action completes, an inline alert appears:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ℹ REJECTION RECORDED                                                         │
│                                                                              │
│ Potassium result (6.8 mmol/L) has been rejected and sent for retest.        │
│ Would you like to document this as a Non-Conformity Event?                   │
│                                                                              │
│                                      [No, Continue]  [Report NCE]           │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Element | Tag |
|---------|-----|
| Alert title | `label.nce.trigger.rejectionRecorded` |
| Alert message | `label.nce.trigger.rejectionRetest.message` |
| No, Continue button | `label.nce.trigger.noContinue` |
| Report NCE button | `label.nce.action.reportNce` |

**"No, Continue" behavior:** Dismissal confirmation dialog appears (same as delta check). If dismissed, audit trail records the dismissal.

**Pre-populated NCE fields:**
- Category: "Analytical"
- Subcategory: auto-suggested from rejection reason
- Both original rejected result AND new retest order are linked
- Trigger type: `result_rejection_retest`

### 7.3 Trigger #4: Result Rejection Without Retest

**Current behavior:** Validator rejects result without ordering retest — effectively nullifying the result.

**NCE integration:** Mandatory — the inline NCE form opens immediately and CANNOT be dismissed. The reject action is blocked until the NCE is submitted.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔴 MANDATORY: Document this non-conformity to complete the rejection.        │
│                                                                              │
│ [Full inline NCE form with no Cancel button]                                │
│                                                                              │
│                                                        [Submit NCE]          │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Element | Tag |
|---------|-----|
| Mandatory banner | `label.nce.trigger.mandatory.banner` |
| Mandatory message | `label.nce.trigger.rejectionNoRetest.message` |

**Behavior:**
- No Cancel button — form must be completed
- Closing the browser or navigating away cancels the rejection action
- Severity defaults to "Major"
- Category: "Analytical"
- Trigger type: `result_rejection_no_retest`

**Grouping:** If multiple results on the same order are rejected without retest in the same validation session, the system should offer to group them into a single NCE.

- Tag: `label.nce.trigger.groupOffer` — "Other results on this order were also rejected. Add them to the same NCE?"
- "Yes, Group" button: adds results to the same NCE as additional linked items
- "No, Separate NCE" button: creates individual NCEs per result

---

## 8. NCE Icon on All Views

Results with associated NCEs display an NCE indicator icon (⚠) across all views where results appear:

| View | Indicator Placement |
|------|---------------------|
| Results Entry | Flag badge in Flags column |
| Result Validation | Flag badge in Flags column |
| Result Search | NCE icon column |
| Patient Report | NCE indicator next to affected results |
| Order Detail | NCE indicator next to affected tests |

The icon is always clickable and navigates to the NCE detail view. Tag: `label.nce.icon.tooltip` — "View associated Non-Conformity Event"

---

## 9. API Endpoints

### 9.1 NCE Creation from Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce` | Create NCE with auto-linked result and sample |

**Request body includes:**
- Standard NCE fields (category, subcategory, severity, title, description, immediate_action)
- `source_type`: "results_entry" or "validation"
- `source_reference_id`: result ID
- `trigger_type`: "manual", "prompted", "mandatory"
- `trigger_action`: "delta_check", "critical_value", "extreme_value", "result_rejection_retest", "result_rejection_no_retest"
- `sample_action`: "continue" or "reject"
- `linked_results[]`: array of result IDs
- `linked_samples[]`: array of sample IDs (auto-derived)

### 9.2 Delta Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/results/{id}/delta-check` | Get delta check data for a result (current vs. previous) |

**Response:**
```json
{
  "currentValue": 8.2,
  "previousValue": 14.1,
  "previousDate": "2026-01-03T10:30:00Z",
  "changePercent": -41.8,
  "threshold": 30,
  "triggered": true
}
```

### 9.3 Prompt Dismissal

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce/prompt-dismissal` | Record that a prompt was dismissed |

**Request body:**
```json
{
  "trigger_action": "delta_check",
  "source_type": "results_entry",
  "source_reference_id": 12345,
  "result_id": 67890,
  "context": "Delta check -41.8% (threshold 30%)"
}
```

### 9.4 NCE Flag Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/results/{id}/nce-flags` | Check if a result has associated NCEs |

**Response:**
```json
{
  "hasNce": true,
  "nceCount": 1,
  "nceIds": ["NCE-20260105-0023"]
}
```

---

## 10. Acceptance Criteria

### Inline NCE Form
- [ ] "Report NCE" button appears in result row actions
- [ ] Clicking "Report NCE" expands an inline form below the result row (not a modal)
- [ ] Inline form has orange top border and warm cream background
- [ ] Context banner auto-populates with lab number, test, result value, patient, flags
- [ ] Category defaults to "Analytical" when triggered from Results Entry
- [ ] Severity defaults to "Critical" when result has a critical flag
- [ ] Sample Action provides "Continue with NCE flag" and "Reject sample" options
- [ ] Result and parent sample are auto-linked (read-only linked items section)
- [ ] Cancel collapses the form without saving
- [ ] Submit creates the NCE, collapses the form, shows success toast with NCE number
- [ ] If "Reject sample" selected, sample status changes to Rejected and pending tests are cancelled
- [ ] NCE flag badge appears on the result row after submission

### Delta Check Alert
- [ ] Delta check alert appears automatically when threshold exceeded
- [ ] Alert shows current value, previous value with date, change percentage, threshold
- [ ] Alert uses purple color scheme (border and background)
- [ ] "Dismiss" shows confirmation dialog before closing
- [ ] Dismissal is recorded in audit trail
- [ ] "Report NCE" opens inline NCE form pre-populated with delta check context
- [ ] Delta check thresholds are configurable per test by admin

### Automatic Prompts
- [ ] Critical value entry triggers inline alert (configurable behavior)
- [ ] Extreme value entry triggers inline alert (configurable behavior)
- [ ] Each trigger can be set to mandatory, prompted, or disabled
- [ ] Mandatory triggers cannot be dismissed
- [ ] Prompted triggers show dismissal confirmation

### Validation Screen Triggers
- [ ] Result rejection with retest shows prompted NCE inline alert (Trigger #3)
- [ ] Result rejection without retest opens mandatory NCE inline form (Trigger #4)
- [ ] Mandatory form has no Cancel button
- [ ] Multiple rejections in same session can be grouped into single NCE
- [ ] Both original result and retest order are linked for Trigger #3

### NCE Indicators
- [ ] NCE flag badge (⚠) appears on results with associated NCEs
- [ ] Flag displays count when multiple NCEs exist
- [ ] Flag is clickable and navigates to NCE detail in Dashboard
- [ ] Flag appears in Results Entry, Validation, Result Search, Patient Report, Order Detail
- [ ] Flag persists until all linked NCEs are Closed – Verified

### i18n
- [ ] All labels, buttons, alert messages, and descriptions use localization tags
- [ ] No hard-coded English strings in the implementation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | OpenELIS Implementation Team | Initial draft (combined document) |
| 2.0 | 2026-02-14 | OpenELIS Implementation Team | Rejection/cancellation integration |
| 3.0 | 2026-02-18 | OpenELIS Implementation Team | Split into separate FRS. Modal replaced with inline form. Delta check alert changed from modal to inline panel. Added Validation screen triggers #3 and #4 detail. Added NCE flag behavior across all views. |

---

*End of Document*
