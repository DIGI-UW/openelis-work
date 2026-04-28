# S-05 — Regulation-Scoped Reference Ranges
## Functional Requirements Specification — v2.0

**Version:** 2.0 (significant rewrite of v1.0)
**Date:** 2026-04-26
**Status:** Draft for Review
**Jira:** [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Related:** S-01 Compliance Standards Admin (OGC-528), S-03 v2.0 Order Entry (OGC-537), S-06 Laporan Hasil (OGC-552), S-05a Reusable Categorical Result Vocabulary (split out from v1.0)
**Supersedes:** v1.0 — original framed compliance evaluation as a parallel engine with new `ComplianceEvaluation` entity, dedicated evaluator, and regulation banner on the results screen. Per the 2026-04-26 design review, that framing was overdesigned. v2.0 reframes compliance evaluation as a reference-range scope dimension (like age/sex), not a new engine.

---

## 1. Overview

OpenELIS already has a reference-range mechanism that drives the per-result green/yellow/red indicator on the results entry page. The existing `evaluateResult()` function compares numeric values against a `referenceRange` row scoped by test (and optionally sample type, age, sex). Result entry shows the indicator inline next to each result; validation displays the same indicator at sign-off.

**S-05 v2.0 adds one new scope dimension to that existing mechanism: compliance standard.** When a regulation-driven order is in scope, the evaluator looks for a reference range row matching the order's `complianceStandardId`. If found, it uses those bounds. If not, it falls back to the test's generic reference range (existing behavior). Tests with no regulation-specific bounds AND no generic range simply show no indicator — same as a clinical test with no reference range configured.

This means **no new entity, no new evaluator, no new audit trail, no new UI banner, no parallel evaluation pattern**. Just one nullable FK on `referenceRange` and a small change to the lookup query.

## 2. What Changed from v1.0

| v1.0 element | v2.0 disposition |
|---|---|
| `ComplianceEvaluation` entity (new) | ❌ Dropped — existing `Result.normalFlag` + result-eval audit trail covers it |
| `evaluateCompliance()` function (new, parallel to `evaluateResult()`) | ❌ Dropped — `evaluateResult()` becomes regulation-aware via scope |
| 3-tier Pass/Marginal/Fail classification | 🔁 Mapped to existing `Normal/Abnormal/Critical` flags — no new visual language |
| Configurable marginal zone (% per threshold) | ✅ Kept — implemented as a column on `referenceRange` (existing or new) |
| Unit conversion engine | ✅ Kept — same hardcoded conversion table approach as v1.0 |
| Regulation banner on results entry screen | ❌ Dropped — per-result inline indicator only |
| Compliance summary section in expanded result detail | ✅ Kept (lighter form) — shows the threshold source ("PP No. 22/2021 — ≤ 25 NTU") in the expanded view |
| Descriptive tag library | 🔀 Split out to **S-05a Reusable Categorical Result Vocabulary** |
| Version-lock semantics (eval uses standard version stored at order time) | ✅ Kept — `referenceRange` lookup uses the order's stored `complianceStandardVersion` |
| API endpoints | 🔁 Reduced — no separate evaluation endpoint; threshold lookup folded into existing result entry endpoints |

## 3. Scope

**In scope:**
- Add `compliance_standard_id` (nullable FK to `compliance_standard.id`) to existing `referenceRange` table
- Add `compliance_standard_version` (nullable string) to lock to the standard version snapshot at order time
- Update `evaluateResult()` to prefer regulation-scoped ranges when the order has a `complianceStandardId` set
- Fall-back chain: regulation-scoped range → demographic-scoped range → generic test range → no flag
- Reference range admin UI gains a "Compliance Standard" filter dropdown (NULL = generic, otherwise pick a standard)
- Expanded result detail shows the threshold source line ("PP No. 22/2021 — ≤ 25 NTU")
- Marginal zone per range row (existing approach, just stored on the new column variant)

**Out of scope:**
- Descriptive / categorical observations (qualitative tags) → **S-05a**
- Compliance dashboards and reporting → S-07 / S-06 (consume the same flag the existing pattern already produces)
- Override workflow with audit trail — existing OE override on results entry already provides this
- New permission keys — `referenceRange.edit` already exists

## 4. Functional Requirements

### 4.1 Reference Range Schema Extension

**FR-01.** The existing `referenceRange` table SHALL gain two nullable columns:

```sql
ALTER TABLE reference_range ADD COLUMN compliance_standard_id BIGINT REFERENCES compliance_standard(id);
ALTER TABLE reference_range ADD COLUMN compliance_standard_version VARCHAR(50);
CREATE INDEX idx_referencerange_compliance ON reference_range(compliance_standard_id) WHERE compliance_standard_id IS NOT NULL;
```

NULL values mean "generic / clinical reference range" (existing semantic). Non-NULL values scope the row to a specific compliance standard at a specific version.

### 4.2 Evaluator Lookup Order

**FR-02.** `evaluateResult(test, sample, value, order)` SHALL look up the applicable reference range in this order:

1. If `order.complianceStandardId` is non-NULL: look for a `referenceRange` row matching `(test_id, compliance_standard_id, compliance_standard_version)` from the order's stored snapshot. If found, use it.
2. Otherwise (or if step 1 misses): look for demographic-scoped range matching `(test_id, sample_type_id, age_range, sex)`. Existing behavior.
3. Otherwise: look for the test's generic range matching `(test_id)`. Existing behavior.
4. Otherwise: return no flag.

The evaluation result remains the existing `Normal | Abnormal | Critical` flag set — no new tier.

### 4.3 Reference Range Admin UI

**FR-03.** The existing reference range admin page SHALL gain a **Compliance Standard** filter ComboBox above the range list. Default value: "(generic)". Selecting a standard scopes the list to ranges for that standard. Adding a new range with a non-NULL standard creates a regulation-scoped row.

The form to add/edit a range gains a single Select field: "Compliance Standard (optional)" — same set of active standards from S-01.

### 4.4 Expanded Result Detail — Threshold Source Line

**FR-04.** When an evaluated result is expanded on the results entry page or validation page, the panel SHALL include a one-line "Threshold source" annotation:

- If regulation-scoped range used: "PP No. 22/2021 — ≤ 25 NTU"
- If generic range used: "Generic reference range — ≤ 25 NTU"
- If no range matched: omit the line

This replaces the v1.0 "Compliance Detail Tile" — same information, simpler render, no new component.

### 4.5 Version Lock

**FR-05.** Range lookup uses the order's stored `complianceStandardVersion` (snapshot taken at order creation per S-03 v2.0 §5.1.5). If the standard is superseded after order entry, the order continues to use the original version's ranges. Same semantics as v1.0; just enforced by the version column on the lookup rather than a separate evaluation entity.

## 5. Data Model

```sql
-- Two columns on existing reference_range table
ALTER TABLE reference_range ADD COLUMN compliance_standard_id BIGINT REFERENCES compliance_standard(id);
ALTER TABLE reference_range ADD COLUMN compliance_standard_version VARCHAR(50);
CREATE INDEX idx_referencerange_compliance ON reference_range(compliance_standard_id) WHERE compliance_standard_id IS NOT NULL;
```

That's it. No new entity. No new join table.

## 6. API Endpoints

No new endpoints. Existing reference range admin endpoints (`GET /api/v1/reference-ranges`, `POST`, `PUT`, `DELETE`) gain optional `complianceStandardId` filter parameter.

## 7. Permissions

No new keys. `referenceRange.edit` (existing) gates the admin page changes.

## 8. UI Mockup Notes

- Results entry page is **unchanged** structurally. The existing per-result Normal/Abnormal/Critical inline indicator does the work.
- Expanded result detail gains the one-line threshold-source annotation (FR-04).
- Reference range admin page gains a Compliance Standard filter + form field.
- **No regulation banner anywhere.** Order's regulation context is implicit from `order.complianceStandardId`; users don't need a screen-level reminder.

## 9. Acceptance Criteria

- [ ] `compliance_standard_id` and `compliance_standard_version` columns added to `referenceRange`
- [ ] `evaluateResult()` lookup follows the FR-02 fallback chain
- [ ] Reference range admin page has a Compliance Standard filter
- [ ] Reference range form has a Compliance Standard Select (optional)
- [ ] Expanded result detail shows threshold source line
- [ ] No regulation banner added to results entry or validation pages
- [ ] No new entity, no new evaluator, no new permission key
- [ ] Existing demographic-scoped (age/sex) ranges continue to work unchanged
- [ ] Version lock holds — superseding a standard after order entry doesn't change the order's evaluation

## 10. Notes

- ~40% smaller than v1.0 because the engine framing dissolved into "one extra scope dimension on an existing mechanism."
- The descriptive tag library (qualitative observations like "scum present", "filamentous algae") didn't fit the numeric-range pattern and was the only piece in v1.0 that genuinely needed new infrastructure. It moves to S-05a — a small standalone spec that's domain-neutral (useful for clinical morphology observations as well, not just env compliance).
- S-06 (Laporan Hasil) and S-07 (Env Dashboard) consume the existing `Result.normalFlag` field, same as the v1.0 design — they don't depend on the engine being a separate entity. No spec changes downstream.
- S-09 v2.0 (Eligibility Gate) doesn't depend on S-05 at all — independent.
