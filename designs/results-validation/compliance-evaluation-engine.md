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

**S-05 v2.0 adds two new scope dimensions to that existing mechanism: compliance standard and component.** When a regulation-driven order is in scope, the evaluator looks for reference range rows matching each of the order's selected `complianceStandardIds`. If the test is multi-component (e.g., noise pollution = heading° + dB level), the evaluator looks up a range per component independently. The existing fallback chain (regulation-specific → demographic → generic → no flag) holds.

This means **no new entity, no new evaluator, no new audit trail, no new UI banner, no parallel evaluation pattern**. Just two nullable scope columns on `referenceRange` and a slightly extended lookup query.

> **⚠️ 2026-04-28 amendment — multi-regulation + multi-component.**
> - **Multi-regulation:** S-03 v2.0 was amended same day to support ≥1 compliance standard per order via the `order_compliance_standard` join. The S-05 evaluator now runs the range lookup **once per selected standard**, returning N flags per result (one per regulation). The result entry inline indicator shows them **side-by-side** when more than one applies. Threshold-source annotation in expanded result detail becomes a list (one line per regulation that returned a flag).
> - **Multi-component:** Tests may produce N labelled values per result instance (e.g., heading° + dB level). Component definitions live on the test catalog (Casey's parallel thread); S-05 just consumes them. `referenceRange` gains a nullable `component_id` so the same regulation can have different ranges for the heading vs the dB level. Result entry renders one input row per component; each evaluates independently.
> - **Repeated readings:** A test instance may produce multiple tuples of components (e.g., a noise survey takes N readings around a building, each producing heading° + dB). These ride OE's existing `result` row pattern (Option α from the design call) — multiple result rows tied by a `reading_group_id`, each row carrying a component reference. S-05's evaluator runs per (reading, component, regulation) — same lookup chain, just iterated.

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

### 4.2 Evaluator Lookup Order (amended 2026-04-28)

**FR-02.** `evaluateResult(test, sample, value, component, order)` SHALL look up the applicable reference range(s).

**For each selected compliance standard on the order** (read from `order_compliance_standard` join, ordered by `selectionOrder`):

1. Look for a `referenceRange` row matching `(test_id, component_id, compliance_standard_id, compliance_standard_version)` using that standard's snapshotted version. If found → emit a flag tagged with this standard.
2. If not, fall back to `(test_id, component_id, compliance_standard_id, NULL)` (any version of that standard). If found → emit a flag.
3. If still no match: skip to next selected standard. (No demographic fallback for regulation-scoped lookups — regulations are absolute.)

**After iterating all selected standards** (or if the order has no standards selected, e.g., ad-hoc branch):

4. Demographic-scoped range matching `(test_id, component_id, sample_type_id, age_range, sex)` → emit a flag tagged "demographic".
5. Generic range matching `(test_id, component_id)` → emit a flag tagged "generic".
6. If nothing matched: return no flag.

`component_id` is NULL for single-component tests (existing OE behavior). For multi-component tests, the evaluator runs steps 1–6 once per component.

**The function returns a list of (flag, source) tuples**, one per applicable regulation plus optionally one demographic/generic. Existing `Normal | Abnormal | Critical` flag set unchanged — no new tier.

### 4.3 Reference Range Admin UI

**FR-03.** The existing reference range admin page SHALL gain a **Compliance Standard** filter ComboBox above the range list. Default value: "(generic)". Selecting a standard scopes the list to ranges for that standard. Adding a new range with a non-NULL standard creates a regulation-scoped row.

The form to add/edit a range gains a single Select field: "Compliance Standard (optional)" — same set of active standards from S-01.

### 4.4 Expanded Result Detail — Threshold Source List (amended 2026-04-28)

**FR-04.** When an evaluated result is expanded on the results entry page or validation page, the panel SHALL include a "Threshold sources" annotation. **One line per regulation that emitted a flag**, plus optionally a demographic / generic line if those were the only matches.

Examples:

- Single-regulation order: `Threshold source · PP No. 22/2021 — ≤ 25 NTU`
- Multi-regulation order with shared threshold: two lines:
  - `PP No. 22/2021 — ≤ 25 NTU`
  - `WHO-DWG-4 — ≤ 5 NTU`
- Multi-regulation order with one match + one miss (one regulation has no threshold for this test):
  - `PP No. 22/2021 — ≤ 25 NTU`
  - `WHO-DWG-4 — no applicable threshold` (tagged in muted color so the miss is visible but quiet)
- Generic-only fallback: `Generic reference range — ≤ 25 NTU`
- Multi-component: one section header per component, each with its own threshold sources list

This replaces the v1.0 "Compliance Detail Tile" — same information, simpler render, no new component.

### 4.5 Result Entry Inline Indicator (amended 2026-04-28)

**FR-04a.** The per-result inline flag indicator on the results entry page SHALL adapt to the number of applicable regulations:

- **0 or 1 applicable regulation:** existing OE behavior — single Normal/Abnormal/Critical Tag.
- **≥2 applicable regulations:** small grouped Tag pattern — one Tag per regulation, side by side, each labelled with the standard's short name + the per-regulation flag color. Example: `[PP 22/2021: ✓] [WHO-DWG-4: ⚠]`.
- **Multi-component test:** flags shown per component, with the component label. Example for a noise test: `Heading: [PP 22/2021: ✓]` on one row, `dB level: [PP 22/2021: ⚠] [WHO-NOISE: ✕]` on the next.

Hover or expand reveals the threshold source(s) per FR-04.

### 4.5 Version Lock

**FR-05.** Range lookup uses the order's stored `complianceStandardVersion` (snapshot taken at order creation per S-03 v2.0 §5.1.5). If the standard is superseded after order entry, the order continues to use the original version's ranges. Same semantics as v1.0; just enforced by the version column on the lookup rather than a separate evaluation entity.

## 5. Data Model (amended 2026-04-28)

```sql
-- Original v2.0 columns
ALTER TABLE reference_range ADD COLUMN compliance_standard_id BIGINT REFERENCES compliance_standard(id);
ALTER TABLE reference_range ADD COLUMN compliance_standard_version VARCHAR(50);

-- 2026-04-28 amendment: component scope dimension for multi-component tests
ALTER TABLE reference_range ADD COLUMN component_id BIGINT REFERENCES test_component(id);

-- Indexes
CREATE INDEX idx_referencerange_compliance ON reference_range(compliance_standard_id) WHERE compliance_standard_id IS NOT NULL;
CREATE INDEX idx_referencerange_component ON reference_range(component_id) WHERE component_id IS NOT NULL;

-- 2026-04-28 amendment: result rows gain optional component + reading_group references
-- (test_component definitions live on the test catalog — Casey's parallel thread —
--  but result-side columns belong here so the evaluator can pick the right range)
ALTER TABLE result ADD COLUMN component_id BIGINT REFERENCES test_component(id);
ALTER TABLE result ADD COLUMN reading_group_id BIGINT;  -- groups multiple readings of a multi-component test
CREATE INDEX idx_result_reading_group ON result(reading_group_id) WHERE reading_group_id IS NOT NULL;
```

The `referenceRange` table now has up to **three nullable scope dimensions** layered on (test, sample_type, age, sex):
- `compliance_standard_id` (NULL = generic, non-NULL = regulation-scoped)
- `compliance_standard_version` (only meaningful when `compliance_standard_id` is non-NULL)
- `component_id` (NULL = single-component test, non-NULL = multi-component scope)

No new entity introduced. The `test_component` table is owned by the test catalog spec (parallel thread).

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
