# Compliance Evaluation Engine [SUPERSEDED]
## ⚠️ DEPRECATED — Reframed in S-05 v2.0 as reference-range extension; tag library split to S-05a
### Functional Requirements Specification — v1.0 [HISTORICAL]

**Status (2026-04-26):** ⚠️ **SUPERSEDED.** v1.0 framed compliance evaluation as a parallel engine with its own `ComplianceEvaluation` entity, dedicated evaluator, and regulation banner on the results screen. Per the 2026-04-26 design review with Casey, that framing was overdesigned: not all tests on a regulation-driven order are governed by the regulation, and the evaluation pattern is naturally a reference-range scope dimension (like age/sex), not a separate engine.
>
> **v2.0 reframes** (`S05-compliance-evaluation-engine-frs-v2.0.md`):
> - Add `compliance_standard_id` (nullable FK) to existing `referenceRange` table — same data model, one new scope dimension
> - Existing `evaluateResult()` becomes regulation-aware via that scope; no new evaluator
> - Drop the regulation banner from the results entry screen — per-result inline indicator matches the existing clinical normal-range pattern
> - Drop the `ComplianceEvaluation` entity — existing result-eval audit trail covers it
> - Drop the Descriptive Tag Library — split to **S-05a Reusable Categorical Result Vocabulary** (it's broader than env compliance and doesn't share infrastructure with the range-extension)
>
> Net effect: ~40% smaller spec, no parallel infrastructure. Original v1.0 content preserved below for historical reference only.

---

# Compliance Evaluation Engine [original v1.0]
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-04
**Status:** ⚠️ SUPERSEDED — see header above
**Jira:** [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Compliance Standards Administration (S-01, OGC-528), Environmental Order Entry (S-03, OGC-537), Results Entry (results-page.jsx), Validation Page, Laporan Hasil Report (S-06)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Scope & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
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

The Compliance Evaluation Engine (S-05) adds automatic regulatory compliance evaluation to OpenELIS Global's results entry workflow. When a technician enters a result for a test linked to a compliance standard (via S-01 ComplianceThresholds), the system automatically evaluates the result against the threshold and displays a pass/marginal/fail indicator inline — using the same green/yellow/red visual language already used for clinical reference range flags. This extends the existing `evaluateResult()` pattern with a parallel `evaluateCompliance()` function.

The engine supports four threshold types: numeric maximum, minimum, and range evaluations (auto-evaluated), and descriptive evaluations where the technician selects observed conditions from a system-managed tag library via type-ahead search. A configurable marginal zone (percentage of threshold) enables early-warning indicators for parameters approaching regulatory limits. Unit conversion is handled automatically where known conversion factors exist.

Evaluation results are computed at save time and stored permanently with the result record. They persist through validation and are consumed downstream by the Laporan Hasil report generator (S-06). No re-evaluation of historical results is supported in v1.0 — results are version-locked to the compliance standard in effect at order time.

---

## 2. Problem Statement

**Current state:** OpenELIS Global evaluates results exclusively against clinical reference ranges — normal/abnormal/critical flagging against patient-centric thresholds. The existing `evaluateResult()` function in the results entry page compares numeric values against `rangeBounds` (normal, critical, valid) and displays green/yellow/red indicators. Environmental and vector testing laboratories must compare results against regulatory compliance thresholds (e.g., Indonesia's Baku Mutu standards, WHO drinking water guidelines), but there is no mechanism to perform this evaluation or display the result.

**Impact:** Without automated compliance evaluation, environmental lab technicians must mentally cross-reference each result against printed regulatory tables. This is error-prone, slow, and makes it impossible to generate automated compliance reports (Laporan Hasil). Validators cannot see compliance status during sign-off, meaning non-compliant results may be released without appropriate flagging. The accreditation requirements of ISO 17025 and KAN mandate traceable, auditable compliance evaluation.

**Proposed solution:** Extend the results entry and validation workflows with a compliance evaluation engine that runs in parallel with the existing clinical range evaluation. When an order is linked to a compliance standard (via S-03), the engine looks up applicable ComplianceThresholds (from S-01), evaluates each result, and displays pass/marginal/fail indicators alongside the existing normal/abnormal/critical indicators. The evaluation is stored as a `ComplianceEvaluation` record linked to the result and the standard version, providing full audit traceability.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- Compliance evaluation logic for MAX, MIN, RANGE, and DESCRIPTIVE threshold types
- Three-tier result classification: Pass (green), Marginal (yellow), Fail (red)
- Configurable marginal zone (percentage per threshold, default 0%)
- Descriptive tag library with type-ahead MultiSelect for qualitative observations
- Unit conversion engine with known conversion table; warning for unknown conversions
- Compliance indicator display on the existing Results Entry page (results-page.jsx)
- Compliance indicator display on the existing Validation page
- Compliance summary section in the expanded result detail panel
- `ComplianceEvaluation` entity for persisting evaluation results
- `DescriptiveTagLibrary` entity for managing qualitative observation tags
- API endpoints for evaluation and tag library management
- Version-lock semantics: evaluation uses the standard version stored at order time

### 3.2 Non-Goals

- **3.2.1** Admin UI for managing ComplianceThresholds — that is S-01 (OGC-528)
- **3.2.2** Compliance report generation (Laporan Hasil) — that is S-06
- **3.2.3** Environmental dashboard and trend analysis — that is S-07
- **3.2.4** Re-evaluation of historical results — future enhancement
- **3.2.5** Unit conversion factor administration UI — v1.0 uses a hardcoded conversion table; a future spec may add admin UI
- **3.2.6** Modifications to the order entry flow — that is S-03 (OGC-537)
- **3.2.7** New standalone pages — S-05 introduces no new navigation entries

---

## 4. User Roles & Permissions

| Role | View Compliance Indicators | Enter Descriptive Tags | Override Evaluation | Manage Tag Library | Notes |
|---|---|---|---|---|---|
| Lab Technician | Yes | Yes | No | No | Sees indicators at result entry; selects tags for descriptive thresholds |
| Lab Manager | Yes | Yes | Yes | No | Can override a compliance evaluation with justification |
| System Administrator | Yes | Yes | Yes | Yes | Full access including tag library management |

**Required permission keys:**

- `compliance.evaluation.view` — View compliance indicators on results entry and validation pages
- `compliance.evaluation.override` — Override an auto-evaluated compliance result with justification
- `compliance.taglibrary.view` — View the descriptive tag library (all users with results access)
- `compliance.taglibrary.manage` — Add, edit, deactivate tags in the descriptive tag library

---

## 5. Functional Requirements

### 5.1 Compliance Evaluation Logic

**CEV-1-001:** When a technician saves a result value for a test that has one or more active ComplianceThresholds linked to the order's compliance standard (stored in `complianceContext` per S-03), the system SHALL automatically evaluate the result against each applicable threshold.

**CEV-1-002:** The evaluation SHALL use the compliance standard ID and version stored on the order at creation time (per S-01 FR-7-003 and S-03 ENV-8-001). The system SHALL NOT use the current live standard — the evaluation is version-locked.

**CEV-1-003:** For **Maximum** thresholds (`thresholdType = MAX`):
- **Pass:** result ≤ threshold value AND result ≤ (threshold value × (1 - marginPercent/100))
- **Marginal:** result > (threshold value × (1 - marginPercent/100)) AND result ≤ threshold value
- **Fail:** result > threshold value

**CEV-1-004:** For **Minimum** thresholds (`thresholdType = MIN`):
- **Pass:** result ≥ threshold value AND result ≥ (threshold value × (1 + marginPercent/100))
- **Marginal:** result < (threshold value × (1 + marginPercent/100)) AND result ≥ threshold value
- **Fail:** result < threshold value

**CEV-1-005:** For **Range** thresholds (`thresholdType = RANGE`):
- **Pass:** result within [lower, upper] AND not within marginal zone of either bound
- **Marginal:** result within [lower, upper] but within marginPercent of either the lower or upper bound
- **Fail:** result < lower OR result > upper

**CEV-1-006:** For **Descriptive** thresholds (`thresholdType = DESCRIPTIVE`):
- The result entry field for descriptive tests SHALL render as a type-ahead ComboBox (filterable MultiSelect) populated from the DescriptiveTagLibrary.
- The technician selects one or more tags describing the observed condition (e.g., "Clear," "No odor," "Colorless").
- The ComplianceThreshold's `expectedTags` field contains the set of tags representing a compliant condition.
- **Pass:** ALL expected tags are present in the selected tags (selected may contain additional tags).
- **Fail:** One or more expected tags are NOT present in the selected tags.
- **Marginal:** Not applicable to descriptive thresholds — evaluation is binary (Pass/Fail).

**CEV-1-007:** When `marginPercent` is 0 (the default), evaluation is binary Pass/Fail — no Marginal zone exists.

### 5.2 Unit Conversion

**CEV-2-001:** Before evaluating, the system SHALL compare the result's unit against the threshold's unit. If they match, evaluation proceeds directly.

**CEV-2-002:** If units differ, the system SHALL look up the conversion factor in the `UnitConversion` table. If a conversion factor exists, the system SHALL convert the result value to the threshold's unit before evaluation and store a `unitConverted = true` flag on the ComplianceEvaluation record.

**CEV-2-003:** If units differ and NO conversion factor exists, the system SHALL:
- Set the evaluation status to `UNIT_MISMATCH`
- Display an `InlineNotification` (kind="warning") on the result row: "Unit mismatch: result in [resultUnit], threshold in [thresholdUnit]. Cannot auto-evaluate."
- The result SHALL NOT receive a pass/marginal/fail indicator — it is flagged for manual review.

**CEV-2-004:** The system SHALL ship with a default conversion table covering common environmental lab conversions: mg/L ↔ µg/L, mg/L ↔ ppm, µg/L ↔ ppb, °C ↔ °F, NTU ↔ FNU (1:1), CFU/mL ↔ CFU/100mL, MPN/100mL conversions. The table is stored in the database and seeded at deployment.

### 5.3 Descriptive Tag Library

**CEV-3-001:** The system SHALL maintain a `DescriptiveTagLibrary` table containing reusable qualitative observation tags. Each tag has a `code`, `displayText`, `category` (e.g., "Odor," "Color," "Turbidity," "Appearance"), and `isActive` flag.

**CEV-3-002:** The tag library SHALL be pre-seeded with common environmental observation values:
- **Color:** Colorless, Clear, Yellow, Brown, Green, Turbid, Milky
- **Odor:** No odor, Odorless, Chlorine, Sulfur, Earthy, Musty, Chemical
- **Appearance:** Clear, Slightly turbid, Turbid, Opaque, Foamy, Oily sheen
- **Taste:** Tasteless, Acceptable, Chlorine taste, Metallic, Salty, Bitter
- **Presence:** Absent, Present, Detected, Not detected, Positive, Negative

**CEV-3-003:** A user with `compliance.taglibrary.manage` permission SHALL be able to add, edit, and deactivate tags via Admin → Environmental → Descriptive Tag Library. This is a simple admin config table following the standard DataTable + inline row expansion pattern.

**CEV-3-004:** The type-ahead ComboBox on the results entry page SHALL filter the tag library by `category` when the test has a category hint (stored on the ComplianceThreshold), or show all active tags when no category hint is set. The ComboBox SHALL support free-text filtering across both `displayText` and `category`.

### 5.4 Results Entry Page — UI Extensions

**CEV-4-001:** On the results entry list (collapsed row view), when a test has a compliance evaluation, the system SHALL display a compliance Tag next to the existing clinical range indicator:
- **Pass:** `Tag kind="green"` with text "Compliant"
- **Marginal:** `Tag kind="warm-gray"` with text "Marginal" (using yellow background via inline style to match existing yellow abnormal pattern)
- **Fail:** `Tag kind="red"` with text "Non-Compliant"
- **Unit Mismatch:** `Tag kind="purple"` with text "Unit Mismatch"
- **Pending:** No tag shown until result is entered and saved

**CEV-4-002:** On the results entry list (collapsed row view), when a test has a descriptive threshold, the result column SHALL display the selected tag labels (comma-separated, truncated to 2 visible + "+N more") instead of a numeric value.

**CEV-4-003:** In the expanded result detail panel, the system SHALL add a **"Compliance"** section below the existing Notes and Interpretation sections. This section is a `Tile` containing:
- **Standard name and version** (from `complianceContext`)
- **Parameter group** name
- **Threshold details:** type, value(s), unit, margin percentage
- **Evaluation result:** Pass/Marginal/Fail Tag with the evaluated value
- **Converted value note** (if unit conversion was applied): "Result converted from [X] to [Y] using factor [Z]"
- **Override button** (visible to users with `compliance.evaluation.override`): opens an inline form with a justification TextArea and a Select for the override value (Pass/Fail)

**CEV-4-004:** When a result value is entered or modified in the inline input field, the compliance evaluation SHALL run immediately (client-side preview) and update the indicator. The definitive evaluation is computed server-side at save time.

**CEV-4-005:** For tests with descriptive thresholds, the result input field SHALL be replaced with a ComboBox (type-ahead, multi-select) populated from the DescriptiveTagLibrary. The field SHALL show:
- Selected tags as Carbon Tags within the input
- A type-ahead dropdown filtering available tags
- Category headers grouping tags in the dropdown
- The expected tags from the threshold highlighted with a checkmark icon in the dropdown

**CEV-4-006:** When multiple ComplianceThresholds apply to the same test (from different parameter groups within the same standard), the system SHALL evaluate against each threshold independently. The collapsed row shows the worst-case indicator (Fail > Marginal > Pass). The expanded Compliance section shows a DataTable with one row per threshold evaluation.

### 5.5 Validation Page — UI Extensions

**CEV-5-001:** The Validation page SHALL display the same compliance indicators as the Results Entry page. Compliance Tags SHALL appear in the same position — next to the clinical range indicator on each result row.

**CEV-5-002:** The Validation expanded detail SHALL include the same Compliance section as the Results Entry page, but in read-only mode (no override button — overrides are only available pre-validation).

**CEV-5-003:** The Validation page SHALL display a **compliance summary banner** at the top of each order when the order has a `complianceContext`. The banner shows:
- Standard name and version
- Aggregate counts: N Pass, N Marginal, N Fail, N Pending
- An overall status: "All Compliant" (green), "Issues Found" (red), or "Pending Results" (blue)

### 5.6 Evaluation Override

**CEV-6-001:** A user with `compliance.evaluation.override` permission SHALL be able to override an auto-evaluated compliance result. The override form SHALL require:
- Override value: Select (Pass / Fail)
- Justification: TextArea (required, minimum 10 characters)

**CEV-6-002:** Overridden evaluations SHALL display a "Overridden" Tag (kind="purple") next to the compliance indicator, with a tooltip showing: override value, justifier name, timestamp, and justification text.

**CEV-6-003:** The system SHALL write an audit log entry for every override, recording: original evaluation, override value, justifier, timestamp, and justification.

---

## 6. Data Model

### New Entities

**ComplianceEvaluation**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| resultId | Long | Yes | FK to Result (the test result record) |
| orderId | Long | Yes | FK to Order (for query convenience) |
| thresholdId | Long | Yes | FK to ComplianceThreshold (from S-01) |
| standardId | Long | Yes | FK to ComplianceStandard (denormalized for query) |
| standardVersion | String (100) | Yes | Snapshot of standard version at evaluation time |
| evaluationStatus | Enum | Yes | PASS, MARGINAL, FAIL, UNIT_MISMATCH, PENDING |
| resultValue | Double | No | The numeric result value used for evaluation (after any conversion) |
| resultUnit | String (100) | No | Unit of the result as entered |
| thresholdUnit | String (100) | No | Unit of the threshold |
| unitConverted | Boolean | Yes | Default false; true if unit conversion was applied |
| conversionFactor | Double | No | The factor applied (null if no conversion) |
| marginPercent | Double | Yes | The margin percentage used (snapshot from threshold) |
| descriptiveTagsSelected | Set\<String\> | No | Tag codes selected by technician (for DESCRIPTIVE type) |
| descriptiveTagsExpected | Set\<String\> | No | Expected tag codes from threshold (snapshot) |
| overrideStatus | Enum | No | PASS, FAIL (null if not overridden) |
| overrideJustification | String (2048) | No | Required when overridden |
| overrideBy | String | No | Username of overrider |
| overrideAt | Timestamp | No | When the override was applied |
| evaluatedBy | String | Yes | Username (system for auto, user for manual) |
| evaluatedAt | Timestamp | Yes | When the evaluation was computed |

**DescriptiveTag**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| code | String (50) | Yes | Unique machine-readable code (e.g., "COLOR_CLEAR") |
| displayText | String (255) | Yes | Human-readable label (e.g., "Clear") |
| category | String (100) | Yes | Grouping category (e.g., "Color," "Odor," "Appearance") |
| sortOrder | Integer | Yes | Display order within category |
| isActive | Boolean | Yes | Default true; false = deactivated |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**Uniqueness constraint:** `code` must be globally unique.

**UnitConversion**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| fromUnit | String (100) | Yes | Source unit (e.g., "mg/L") |
| toUnit | String (100) | Yes | Target unit (e.g., "µg/L") |
| factor | Double | Yes | Multiply source by factor to get target (e.g., 1000.0) |
| isReversible | Boolean | Yes | Default true; if true, reverse conversion = 1/factor |

**Uniqueness constraint:** (`fromUnit`, `toUnit`) must be unique.

### Modified Entities

**ComplianceThreshold** (from S-01) — Add fields:

| Field | Type | Notes |
|---|---|---|
| marginPercent | Double | Marginal zone as percentage of threshold value. Default 0.0 (binary pass/fail) |
| expectedTags | Set\<String\> | For DESCRIPTIVE type: tag codes representing compliant condition |
| tagCategoryHint | String (100) | For DESCRIPTIVE type: preferred category to filter tag library in the ComboBox |

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| POST | `/api/v1/compliance/evaluate` | Evaluate a single result against its thresholds; returns ComplianceEvaluation | `compliance.evaluation.view` |
| POST | `/api/v1/compliance/evaluate-batch` | Evaluate all results for an order; returns list of ComplianceEvaluations | `compliance.evaluation.view` |
| GET | `/api/v1/compliance/evaluations?orderId={id}` | Get all evaluations for an order | `compliance.evaluation.view` |
| GET | `/api/v1/compliance/evaluations?resultId={id}` | Get evaluations for a specific result | `compliance.evaluation.view` |
| PUT | `/api/v1/compliance/evaluations/{id}/override` | Override an evaluation (requires justification) | `compliance.evaluation.override` |
| GET | `/api/v1/compliance/tags` | List all active descriptive tags (optionally filtered by `?category=`) | `compliance.taglibrary.view` |
| GET | `/api/v1/compliance/tags/search?q={query}` | Search tags by displayText or category (type-ahead) | `compliance.taglibrary.view` |
| POST | `/api/v1/compliance/tags` | Add a new descriptive tag | `compliance.taglibrary.manage` |
| PUT | `/api/v1/compliance/tags/{id}` | Edit a descriptive tag | `compliance.taglibrary.manage` |
| DELETE | `/api/v1/compliance/tags/{id}` | Deactivate a descriptive tag (soft delete) | `compliance.taglibrary.manage` |
| GET | `/api/v1/compliance/unit-conversions` | List all unit conversion factors | `compliance.evaluation.view` |

### Evaluate Request Body

```json
{
  "resultId": 12345,
  "resultValue": 0.045,
  "resultUnit": "mg/L",
  "orderId": 6789,
  "descriptiveTagCodes": ["COLOR_CLEAR", "ODOR_NONE"]
}
```

### Evaluate Response Body

```json
{
  "evaluations": [
    {
      "thresholdId": 101,
      "parameterGroup": "Chemical Parameters",
      "thresholdType": "MAX",
      "thresholdValue": 0.05,
      "thresholdUnit": "mg/L",
      "marginPercent": 10.0,
      "evaluationStatus": "MARGINAL",
      "resultValue": 0.045,
      "unitConverted": false,
      "message": "Result is within 10% marginal zone of maximum threshold (0.05 mg/L)"
    }
  ],
  "worstStatus": "MARGINAL"
}
```

---

## 8. UI Design

See companion React mockup: `S05-compliance-evaluation-engine-mockup.jsx`

### Navigation Path

No new navigation entries. S-05 extends these existing pages:
- Results → Enter Results (results-page.jsx)
- Results → Validation
- Admin → Environmental → Descriptive Tag Library (new admin config table)

### Key Screens (modified)

1. **Results Entry — Collapsed Row** — Compliance Tag added next to clinical range indicator
2. **Results Entry — Expanded Detail** — Compliance section added as a Tile below Notes/Interpretation
3. **Results Entry — Descriptive Input** — ComboBox replacing TextInput for descriptive tests
4. **Validation — Row + Summary Banner** — Same indicators plus order-level compliance summary
5. **Admin — Descriptive Tag Library** — Standard DataTable + inline expansion admin page

### Interaction Patterns

- **Inline compliance indicators** — Tags appear automatically as results are entered (client-side preview; server-side at save)
- **Same green/yellow/red pattern** as existing clinical range evaluation — no new visual vocabulary
- **Type-ahead MultiSelect** for descriptive thresholds — ComboBox with category grouping
- **Inline override form** in expanded detail — TextArea + Select, no modal
- **Inline row expansion** for tag library admin (per Constitution Principle 3)

---

## 9. Business Rules

**BR-001:** Compliance evaluation is computed at result save time. The evaluation uses the standard version stored on the order (version-lock). If the standard has been superseded since order creation, the original version is still used.

**BR-002:** When `marginPercent` is 0 (default), evaluation is strictly binary: Pass or Fail. No Marginal status is possible.

**BR-003:** For MAX thresholds, the marginal zone is the region between `threshold × (1 - marginPercent/100)` and `threshold`. For MIN thresholds, the marginal zone is between `threshold` and `threshold × (1 + marginPercent/100)`. For RANGE thresholds, marginal zones exist at both bounds.

**BR-004:** For descriptive thresholds, the expected tags are compared using a **superset check**: the selected tags must include ALL expected tags. Additional selected tags do not cause failure. Marginal is not applicable — evaluation is binary Pass/Fail.

**BR-005:** Unit conversion is **transparent to the technician** — the result is entered in whatever unit the lab uses, and the system converts before evaluation. The conversion is recorded on the ComplianceEvaluation for audit purposes.

**BR-006:** When multiple thresholds apply to the same test (from different parameter groups), each is evaluated independently. The collapsed row shows the **worst-case** status (Fail > Marginal > Pass > Pending).

**BR-007:** An override replaces the displayed status but does NOT modify the original auto-evaluation. Both the original and override are preserved in the ComplianceEvaluation record.

**BR-008:** The evaluation is computed once at save time and is immutable. Changing the result value creates a new evaluation (the old one is retained for audit). No re-evaluation of finalized results.

**BR-009:** If a test has both clinical reference ranges AND compliance thresholds, both evaluations run independently. The clinical indicator (normal/abnormal/critical) and the compliance indicator (pass/marginal/fail) are displayed side by side. They do not interact.

**BR-010:** The Descriptive Tag Library is shared across all compliance standards. Tags are not scoped to individual standards — any tag can be used for any descriptive threshold. The `tagCategoryHint` on the threshold controls which tags are shown first in the dropdown.

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `label.compliance.evaluation.title` | Compliance Evaluation |
| `label.compliance.evaluation.standard` | Standard |
| `label.compliance.evaluation.version` | Version |
| `label.compliance.evaluation.parameterGroup` | Parameter Group |
| `label.compliance.evaluation.threshold` | Threshold |
| `label.compliance.evaluation.thresholdType` | Type |
| `label.compliance.evaluation.thresholdValue` | Limit |
| `label.compliance.evaluation.margin` | Margin |
| `label.compliance.evaluation.result` | Result |
| `label.compliance.evaluation.status` | Status |
| `label.compliance.evaluation.pass` | Compliant |
| `label.compliance.evaluation.marginal` | Marginal |
| `label.compliance.evaluation.fail` | Non-Compliant |
| `label.compliance.evaluation.unitMismatch` | Unit Mismatch |
| `label.compliance.evaluation.pending` | Pending |
| `label.compliance.evaluation.overridden` | Overridden |
| `label.compliance.evaluation.convertedFrom` | Converted from {0} to {1} (factor: {2}) |
| `label.compliance.evaluation.allCompliant` | All Compliant |
| `label.compliance.evaluation.issuesFound` | Issues Found |
| `label.compliance.evaluation.pendingResults` | Pending Results |
| `label.compliance.summary.title` | Compliance Summary |
| `label.compliance.summary.pass` | {0} Pass |
| `label.compliance.summary.marginal` | {0} Marginal |
| `label.compliance.summary.fail` | {0} Fail |
| `label.compliance.summary.pending` | {0} Pending |
| `label.compliance.tags.title` | Descriptive Tag Library |
| `label.compliance.tags.code` | Code |
| `label.compliance.tags.displayText` | Display Text |
| `label.compliance.tags.category` | Category |
| `label.compliance.tags.sortOrder` | Sort Order |
| `label.compliance.tags.active` | Active |
| `label.compliance.tags.selectTags` | Select observed conditions |
| `label.compliance.tags.expectedTag` | Expected |
| `label.compliance.tags.searchPlaceholder` | Search tags... |
| `label.compliance.override.title` | Override Evaluation |
| `label.compliance.override.value` | Override To |
| `label.compliance.override.justification` | Justification |
| `label.compliance.override.justificationPlaceholder` | Explain why this evaluation is being overridden (min 10 characters) |
| `label.compliance.override.by` | Overridden by |
| `label.compliance.override.at` | Overridden at |
| `button.compliance.override` | Override |
| `button.compliance.override.save` | Save Override |
| `button.compliance.override.cancel` | Cancel |
| `button.compliance.tags.add` | Add Tag |
| `button.compliance.tags.save` | Save |
| `button.compliance.tags.cancel` | Cancel |
| `message.compliance.evaluation.unitMismatch` | Unit mismatch: result in {0}, threshold in {1}. Cannot auto-evaluate. |
| `message.compliance.evaluation.converted` | Result converted from {0} to {1} for evaluation. |
| `message.compliance.override.success` | Compliance evaluation overridden successfully. |
| `message.compliance.tags.saveSuccess` | Tag saved successfully. |
| `message.compliance.tags.deleteConfirm` | Are you sure you want to deactivate this tag? |
| `error.compliance.override.justificationRequired` | Justification is required (minimum 10 characters). |
| `error.compliance.tags.codeRequired` | Tag code is required. |
| `error.compliance.tags.codeDuplicate` | A tag with this code already exists. |
| `error.compliance.tags.displayTextRequired` | Display text is required. |
| `heading.compliance.tags.list` | Descriptive Tag Library |
| `heading.compliance.tags.addNew` | Add New Tag |
| `heading.compliance.tags.edit` | Edit Tag |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Override justification | Required, min 10 characters | `error.compliance.override.justificationRequired` |
| Tag code | Required, unique | `error.compliance.tags.codeRequired`, `error.compliance.tags.codeDuplicate` |
| Tag displayText | Required | `error.compliance.tags.displayTextRequired` |
| Tag category | Required | `error.compliance.tags.categoryRequired` |
| marginPercent | 0–100, numeric | `error.compliance.threshold.marginRange` |
| expectedTags | At least 1 for DESCRIPTIVE type | `error.compliance.threshold.expectedTagsRequired` |

---

## 12. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View compliance indicators | `compliance.evaluation.view` | Compliance Tags and section hidden; results page functions normally for clinical use |
| Override evaluation | `compliance.evaluation.override` | Override button hidden in Compliance section |
| View tag library page | `compliance.taglibrary.view` | Page not shown in Admin menu |
| Manage tags | `compliance.taglibrary.manage` | Add/Edit/Delete buttons hidden in tag library |
| View descriptive ComboBox | `compliance.taglibrary.view` | ComboBox visible (read-only tag list for all results users) |

---

## 13. Acceptance Criteria

### Functional

- [ ] Entering a numeric result for a test with a MAX threshold displays Pass (green) when result ≤ threshold
- [ ] Entering a numeric result exceeding a MAX threshold displays Fail (red)
- [ ] Entering a numeric result within the marginal zone displays Marginal (yellow) when marginPercent > 0
- [ ] MIN and RANGE thresholds evaluate correctly with pass/marginal/fail
- [ ] Descriptive threshold tests show a type-ahead ComboBox instead of numeric input
- [ ] Selecting all expected tags in the ComboBox evaluates as Pass
- [ ] Missing an expected tag evaluates as Fail
- [ ] Unit mismatch with no conversion factor shows warning notification and "Unit Mismatch" tag
- [ ] Unit mismatch with a known conversion factor auto-converts and evaluates correctly
- [ ] Converted results show conversion note in the expanded Compliance section
- [ ] Multiple thresholds on the same test show worst-case indicator on collapsed row
- [ ] Multiple thresholds show per-threshold detail table in expanded Compliance section
- [ ] Compliance indicators appear on the Validation page alongside clinical indicators
- [ ] Validation page shows compliance summary banner with aggregate counts
- [ ] Override form requires justification (min 10 chars) and records override in audit trail
- [ ] Overridden evaluation shows "Overridden" tag with tooltip
- [ ] `complianceContext` order API includes evaluations after save
- [ ] Evaluation is version-locked to standard version at order time

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Compliance evaluation adds < 200ms to result save time
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with Indonesian locale language file
- [ ] Evaluation audit trail complete: original value, conversion, override history

### Integration

- [ ] S-06 (Laporan Hasil) can consume ComplianceEvaluation records via API
- [ ] S-07 (Dashboard) can query evaluations by site, standard, date range
- [ ] Existing clinical range evaluation unaffected — both run in parallel
- [ ] Results entry mockup (results-page.jsx) extended, not replaced

---

## Appendix A: Evaluation Algorithm Pseudocode

```
function evaluateCompliance(result, threshold, conversionTable):
    // Step 1: Unit conversion
    if result.unit ≠ threshold.unit:
        factor = conversionTable.lookup(result.unit, threshold.unit)
        if factor is null:
            return { status: UNIT_MISMATCH }
        convertedValue = result.value × factor
    else:
        convertedValue = result.value

    // Step 2: Evaluate by type
    switch threshold.type:
        case MAX:
            if convertedValue > threshold.valueUpper:
                return { status: FAIL }
            marginBound = threshold.valueUpper × (1 - threshold.marginPercent / 100)
            if convertedValue > marginBound:
                return { status: MARGINAL }
            return { status: PASS }

        case MIN:
            if convertedValue < threshold.valueLower:
                return { status: FAIL }
            marginBound = threshold.valueLower × (1 + threshold.marginPercent / 100)
            if convertedValue < marginBound:
                return { status: MARGINAL }
            return { status: PASS }

        case RANGE:
            if convertedValue < threshold.valueLower or convertedValue > threshold.valueUpper:
                return { status: FAIL }
            lowerMargin = threshold.valueLower + (threshold.valueUpper - threshold.valueLower) × threshold.marginPercent / 100
            upperMargin = threshold.valueUpper - (threshold.valueUpper - threshold.valueLower) × threshold.marginPercent / 100
            if convertedValue < lowerMargin or convertedValue > upperMargin:
                return { status: MARGINAL }
            return { status: PASS }

        case DESCRIPTIVE:
            selectedCodes = result.descriptiveTagCodes
            expectedCodes = threshold.expectedTags
            if expectedCodes ⊆ selectedCodes:
                return { status: PASS }
            return { status: FAIL }
```

## Appendix B: Default Unit Conversion Seed Data

| From Unit | To Unit | Factor | Reversible |
|---|---|---|---|
| mg/L | µg/L | 1000.0 | Yes |
| mg/L | ppm | 1.0 | Yes |
| µg/L | ppb | 1.0 | Yes |
| °C | °F | 1.8 (+ offset 32) | Yes* |
| NTU | FNU | 1.0 | Yes |
| CFU/mL | CFU/100mL | 100.0 | Yes |
| MPN/100mL | MPN/mL | 0.01 | Yes |

*Note: °C ↔ °F uses a non-linear conversion (°F = °C × 1.8 + 32). The system SHALL implement this as a special-case conversion rather than a simple multiplication factor.

## Appendix C: Cross-Reference to Upstream Specs

| Upstream Spec | Entity/Concept | How S-05 Consumes It |
|---|---|---|
| S-01 (OGC-528) | ComplianceStandard | Standard name, version, status for display |
| S-01 (OGC-528) | ComplianceThreshold | Threshold type, values, unit, parameter group for evaluation |
| S-01 (OGC-528) | ParameterGroup | Group name for display in Compliance section |
| S-03 (OGC-537) | `complianceContext` on Order | Standard ID, version, linked thresholds — the evaluation input |
| S-03 (OGC-537) | ENV-8-001 | Version-lock: order stores standard version at creation time |
| S-04 (OGC-538) | sampleDomain | Determines if workflow toggle shows environmental indicators |
| Results Entry | `evaluateResult()` | Parallel function — S-05 adds `evaluateCompliance()` alongside it |
| Results Entry | rangeBounds pattern | S-05 reuses same green/yellow/red indicator pattern |
