# S-03b — Sampling Uncertainty Field [SUPERSEDED]
## ⚠️ DEPRECATED — Absorbed into S-03 v2.0 §5.1.10
### Functional Requirements Specification — v1.0 [HISTORICAL]

**Status (2026-04-25):** ⚠️ **SUPERSEDED.** This addendum has been collapsed into the main S-03 v2.0 spec as two new optional fields in the Default Collection Conditions field set (§5.1.10). The full FRS treatment was overdesigned for what amounts to a NumberInput + Select pair. No separate Jira ticket needed — track the work as a sub-task of OGC-537. Original v1.0 content preserved below for historical reference only.

---

# S-03b — Sampling Uncertainty Field [original v1.0]
## Addendum to S-03: Environmental Order Entry Integration (OGC-537)
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** ⚠️ SUPERSEDED — see header above
**Addendum to:** [S-03 FRS — Environmental Order Entry Integration](./S03-environmental-order-entry-frs-v1.0.md) / [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537)
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Source requirement:** PRD v0.5 §3.3: "Mandatory sample data field for environmental samples — field sampling uncertainty."

---

## 1. Overview

This addendum extends S-03 §5.3 (Collection Conditions) to add a **Sampling Uncertainty** field to every environmental order. ISO 17025 and many national environmental regulations require laboratories to characterize the uncertainty associated with the field collection process (e.g., variability in grab sample timing, temperature stability during transport, operator technique), separate from the analytical measurement uncertainty calculated at result time.

S-03b adds a single structured field — a numeric value plus unit type — to the Collection Conditions form in Step 1 and Step 2. The field is mandatory for environmental orders. It is stored on the order entity and flows through to the Laporan Hasil (compliance report) as specified in S-03 §5.9.

### 1.1 What this addendum adds

| Area | New capability |
|------|----------------|
| Collection Conditions (Step 1) | Sampling Uncertainty NumberInput + unit type Select, mandatory for ENV orders |
| Collection Conditions (Step 2) | Same field pre-populated from Step 1, editable by collector |
| Data model | `samplingUncertaintyValue` (decimal) + `samplingUncertaintyUnit` (enum) on `env_order_conditions` |
| Laporan Hasil data contract | Uncertainty value + unit included in report data payload (§5.9) |
| i18n | 8 new localization keys |
| Admin config | Field included in per-program configurable field set (can be marked optional for specific programs) |

### 1.2 What this addendum does NOT change

- Analytical (per-analyte) measurement uncertainty — this is a result-level attribute calculated at validation time, not a collection-level field. S-03b covers **field/sampling uncertainty only**.
- Existing Collection Conditions fields — unchanged (S-03 §5.3 ENV-3-001 default field set).
- Collection Conditions carry-forward mechanism (ENV-3-002) — already handles field-to-Step 2 propagation; S-03b adds to the list of propagated fields without changing the mechanism.
- Compliance threshold evaluation (S-05) — uncertainty value is informational and reporting-only in v1.0; it does not gate result validation.

---

## 2. User Stories

- **US-01** — As an environmental field collector, I want to record the sampling uncertainty at collection time so that the compliance report accurately reflects the confidence level of the field collection process, not just the lab analysis.
- **US-02** — As a QA officer, I want to verify that a sampling uncertainty value was recorded before approving an environmental order so that we meet ISO 17025 documentation requirements.
- **US-03** — As a lab manager, I want the sampling uncertainty to appear on the Laporan Hasil so that our reports meet national regulatory submission standards without manual post-processing.

---

## 3. Functional Requirements

### 3.1 Sampling Uncertainty Field — Step 1 (Enter Order)

**FR-01** — The Collection Conditions section (S-03 §5.3, ENV-3-001) in Step 1 MUST include a **Sampling Uncertainty** row immediately before the Field Notes field. The row contains two controls presented side-by-side:

| Control | Type | Notes |
|---------|------|-------|
| Uncertainty Value | NumberInput | Positive decimal, min 0.00, max 999.99, step 0.01, 2 decimal places |
| Unit Type | Select | Options: `%` (Relative %) · `mg/L` · `μg/L` · `CFU/100 mL` · `Other (free text)` |

When "Other (free text)" is selected as the unit type, a small TextInput appears inline to the right of the Select, allowing the user to type a custom unit string (max 20 chars).

**FR-02** — The Sampling Uncertainty field MUST be **mandatory** for all environmental orders by default. The form MUST prevent submission if the field is blank. Error message: `t('collectionConditions.samplingUncertainty.required', 'Sampling uncertainty is required for environmental orders.')`.

**FR-03** — The field MAY be configured as optional on a per-program basis by the administrator (extending the existing S-03 §5.3 admin configuration for per-program field sets). When marked optional for a program, the Required indicator is suppressed and the field can be left blank.

**FR-04** — The NumberInput MUST validate:
- Value must be > 0 when provided. Zero is not a valid uncertainty value. Error: `t('collectionConditions.samplingUncertainty.nonZero', 'Uncertainty value must be greater than 0.')`
- Value must be ≤ 100.00 when unit type is `%`. Error: `t('collectionConditions.samplingUncertainty.percentMax', 'Relative uncertainty cannot exceed 100%.')`
- Custom unit string (when "Other" selected) must not be blank. Error: `t('collectionConditions.samplingUncertainty.unitRequired', 'Please specify the unit.')`

### 3.2 Sampling Uncertainty Field — Step 2 (Collect Sample)

**FR-05** — The Sampling Uncertainty field MUST appear in the Collection Conditions section of Step 2 (ENV-3-002), consistent with how all other Collection Conditions fields carry forward.

**FR-06** — If the field was entered in Step 1, it MUST be pre-populated in Step 2 with the Step 1 value, and remain editable by the collector.

**FR-07** — If Step 2 is the first point of entry (Step 1 was skipped or not completed), the field appears blank and mandatory (subject to the same per-program override from FR-03).

**FR-08** — Changes made to the Sampling Uncertainty field in Step 2 MUST overwrite the Step 1 value. The last-saved value (from whichever step the user last edited) is the authoritative value.

### 3.3 QA Review Integration

**FR-09** — The QA completeness check (S-03 §5.8) MUST include verification that the Sampling Uncertainty field is populated when it is configured as mandatory for the order's program. If the field is empty, the QA review MUST display a completeness warning (not a hard block) alongside the other ENV completeness checks.

### 3.4 Laporan Hasil Data Contract

**FR-10** — The Sampling Uncertainty value and unit type MUST be included in the Laporan Hasil reporting data payload (S-03 §5.9). The payload field names are `samplingUncertaintyValue` (decimal) and `samplingUncertaintyUnit` (string). If the field was not entered (program configured as optional and left blank), both fields are `null` in the payload.

---

## 4. Data Model

The `env_order_conditions` table (introduced in S-03) gains two new columns:

```sql
ALTER TABLE env_order_conditions
  ADD COLUMN sampling_uncertainty_value  DECIMAL(6,2)  NULL,
  ADD COLUMN sampling_uncertainty_unit   VARCHAR(30)   NULL;
-- sampling_uncertainty_unit stores the resolved unit string:
-- "%" for relative, unit name (e.g., "mg/L", "μg/L") for absolute,
-- or the user-typed custom string when "Other" is selected.
```

No new tables. No new entities. No foreign key dependencies.

**Constraint:** When `sampling_uncertainty_unit` is `%`, the engine MUST enforce `sampling_uncertainty_value <= 100.00` at the API layer (not only the UI). Return HTTP 422 with `{ "error": "samplingUncertainty.percentMax" }` if violated.

---

## 5. API Changes

No new endpoints. The existing S-03 `POST /api/v1/env-orders` and `PATCH /api/v1/env-orders/{id}` request bodies gain two new optional fields:

```json
{
  "collectionConditions": {
    "...existing fields...",
    "samplingUncertaintyValue": 2.50,
    "samplingUncertaintyUnit": "%"
  }
}
```

The existing `GET /api/v1/env-orders/{id}` response body returns these fields in the same `collectionConditions` object.

**Validation at API layer:**
- `samplingUncertaintyValue`: must be > 0 when present
- `samplingUncertaintyUnit`: must be non-empty when `samplingUncertaintyValue` is present
- When `samplingUncertaintyUnit = "%"`: `samplingUncertaintyValue` must be ≤ 100.00

---

## 6. UI Changes (Addendum to S-03 §5.3)

### 6.1 Updated default field set for Collection Conditions

The default field set table in ENV-3-001 is updated with one new row:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Water Temperature | NumberInput (°C) | No | Shown for water-related programs |
| Ambient Temperature | NumberInput (°C) | No | All environmental programs |
| Weather Conditions | Select | No | Clear / Cloudy / Rain / Storm / Wind / Other |
| Collection Method | Select | **Yes** | Manual Grab / Composite / Automated / Trap / Other |
| Preservation Method | TextInput | No | Free-text |
| **Sampling Uncertainty** | **NumberInput + Unit Select** | **Yes (default)** | **NEW — S-03b** |
| Field Notes | TextArea | No | Free-text, max 1000 chars |

### 6.2 Field layout within Collection Conditions

The Sampling Uncertainty row uses a two-column inline layout:

```
[ Uncertainty Value (NumberInput, 120px) ]  [ Unit Type (Select, 160px) ]  [ Custom Unit TextInput, 100px — visible only when "Other" selected ]
```

Helper text below the row: `t('collectionConditions.samplingUncertainty.helper', 'Enter the field sampling uncertainty, not the analytical measurement uncertainty.')`

The Carbon `NumberInput` uses `allowEmpty={false}`, `min={0.01}`, `max={999.99}`, `step={0.01}`.

---

## 7. Business Rules

**BR-01** — Sampling uncertainty at this field records **field/collection uncertainty only** — the variability attributable to the sampling process (timing, handling, transport). It is distinct from analytical measurement uncertainty, which is calculated per-analyte at results validation time and is not in scope here.

**BR-02** — The value is recorded once per order (not per sample type or per test). All sample types collected under the same order share the same sampling uncertainty value.

**BR-03** — When a program administrator configures the Collection Conditions field set and removes the Sampling Uncertainty field from the program's configuration, this is equivalent to setting it as optional. The field is still stored and displayed if previously entered; it is simply not required for that program.

**BR-04** — The Sampling Uncertainty value does not affect compliance evaluation in v1.0. It is informational and reporting-only. Future S-05b may incorporate it into the compliance evaluation logic.

---

## 8. Localization

| i18n Key | English Fallback |
|----------|-----------------|
| `collectionConditions.samplingUncertainty.label` | Sampling Uncertainty |
| `collectionConditions.samplingUncertainty.placeholder` | e.g. 2.50 |
| `collectionConditions.samplingUncertainty.unitLabel` | Unit |
| `collectionConditions.samplingUncertainty.helper` | Field/sampling uncertainty — not analytical measurement uncertainty |
| `collectionConditions.samplingUncertainty.customUnit` | Specify unit |
| `collectionConditions.samplingUncertainty.required` | Sampling uncertainty is required for environmental orders. |
| `collectionConditions.samplingUncertainty.nonZero` | Uncertainty value must be greater than 0. |
| `collectionConditions.samplingUncertainty.percentMax` | Relative uncertainty cannot exceed 100%. |
| `collectionConditions.samplingUncertainty.unitRequired` | Please specify the unit. |

**Template body note:** No template body text exists for this field. All UI strings are covered by i18n keys above. Labeling in the Laporan Hasil report template is user-authored per S-06b conventions.

---

## 9. Security & Permissions

No new permission keys. The Sampling Uncertainty field inherits the existing S-03 collection conditions permissions:

| Action | Required Permission |
|--------|-------------------|
| Enter / edit (Steps 1 & 2) | `order.enter` or `order.collect` |
| View in QA review | `order.qa` |
| Configure field set in Admin | `admin.program.configure` (existing) |

---

## 10. Acceptance Criteria

**Step 1 (Enter Order):**
- [ ] Sampling Uncertainty row appears in the Collection Conditions section, between Preservation Method and Field Notes
- [ ] Row contains a NumberInput (value) and a Select (unit type) side-by-side
- [ ] Selecting "Other (free text)" from the unit Select reveals an inline TextInput for custom unit entry
- [ ] Field is marked as required by default; form cannot be submitted without a value
- [ ] Submitting with value = 0 shows validation error: "Uncertainty value must be greater than 0."
- [ ] Submitting with value > 100 when unit = "%" shows validation error about percent maximum
- [ ] Submitting without a unit when "Other" is selected shows "Please specify the unit."

**Step 2 (Collect Sample):**
- [ ] Sampling Uncertainty row appears in the Collection Conditions section on Step 2
- [ ] Value entered in Step 1 is pre-populated in Step 2
- [ ] Value is editable on Step 2; saving overwrites the Step 1 value
- [ ] If Step 1 was skipped, field appears blank and required on Step 2

**QA Review:**
- [ ] QA completeness check flags orders with empty Sampling Uncertainty (for mandatory-configured programs)
- [ ] Completeness warning displays alongside other ENV completeness checks

**Admin Config:**
- [ ] Program admin can toggle Sampling Uncertainty to optional for specific programs
- [ ] When set to optional, Required indicator is suppressed and form can be submitted without a value

**Data / API:**
- [ ] `samplingUncertaintyValue` and `samplingUncertaintyUnit` are stored on the order entity
- [ ] Both fields appear in the Laporan Hasil report data payload
- [ ] API returns HTTP 422 when `samplingUncertaintyUnit = "%"` and value > 100

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-03 ENV-3-001 | Parent requirement — this addendum extends the default Collection Conditions field set |
| S-03 ENV-3-002 | Carry-forward mechanism — Sampling Uncertainty added to the list of fields propagated from Step 1 to Step 2 |
| S-03 §5.8 (QA completeness) | QA completeness check extended to include Sampling Uncertainty validation |
| S-03 §5.9 (Laporan Hasil data contract) | Reporting payload extended with two new fields |
| S-05b (Final Storage Disposition) | Future: S-05b may incorporate sampling uncertainty into compliance evaluation logic |
| ISO 17025:2017 §7.6 | Measurement uncertainty requirement — field sampling uncertainty is a distinct component |
