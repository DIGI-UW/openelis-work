# S-03d — SOP Holding-Time Auto-Calc & Worklist Deadline Flagging
## Addendum to S-03 (Env/Vector only)
### Functional Requirements Specification — v2.0

**Version:** 2.0 (rewrite of v1.0)
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** [OGC-593](https://uwdigi.atlassian.net/browse/OGC-593)
**Addendum to:** [S-03 v2.0](./S03-environmental-order-entry-frs-v2.0.md) and the cross-cutting Required-By spec ([GENERIC-required-by-field-frs.md](./GENERIC-required-by-field-frs.md))
**Supersedes:** v1.0 — original bundled a generic Required-By field (now split out) with env-specific holding-time logic. v2.0 covers env/vector-specific behavior only.

---

## 1. Overview

Environmental and vector tests have hold-times — regulatory time limits between sample collection and analysis. v2.0 of this addendum adds two env/vector-specific capabilities on top of the generic `required_by` field:

**Part B — SOP Holding-Time Auto-Calculation.** When env/vector tests with `sop_max_holding_hours` are on the order and the collection date/time is recorded (Step 2), the system suggests a deadline equal to `collection_datetime + min(sop_max_holding_hours)`. The suggestion auto-populates the `required_by` field; reception can accept or override.

**Part C — Worklist Deadline Color-Coding.** The env/vector testing worklist displays a color-coded indicator per order based on time remaining vs. `required_by`.

## 2. Scope

**In scope:**
- New `sop_max_holding_hours` column on the test catalog (env/vector tests only)
- Live calculation in S-03 v2.0 Step 1 / Step 2 as tests are added/removed
- Auto-populate the generic `required_by` field with the calculation result
- "Suggested" tag on auto-calculated values; user can override with explicit edit
- Worklist color-coded `Deadline` column for env/vector orders
- Hold-time-exceeded indicator on Step 3 sample rows (already in S-03 v2.0 §5.2.2 — this spec wires the data in)

**Out of scope:**
- Generic `required_by` field — see [GENERIC-required-by-field-frs.md](./GENERIC-required-by-field-frs.md)
- Hold-time-exceeded NCE auto-flagging — already in S-03 v2.0 §5.3.1
- Clinical orders (no SOP holding-time concept)

## 3. Functional Requirements

**FR-01 (Test Catalog admin extension).** The test catalog admin form SHALL add an `SOP Max Holding Time (hours)` NumberInput, visible only when the test's `sampleDomain` includes ENVIRONMENTAL or VECTOR. Optional; nullable means "no SOP holding time defined."

**FR-02 (Step 1 / Step 2 calculation).** When at least one test on the order has `sop_max_holding_hours` set AND a collection date/time is known (from Step 1 default conditions or Step 2 per-sample), the system SHALL compute `suggested_required_by = collection_datetime + min(sop_max_holding_hours)` across all tests on the order. The value populates the `required_by` field with a `Suggested` tag.

**FR-03 (Recalculation triggers).** Suggestion recalculates live when: tests are added/removed, collection date/time changes, or the standard's test panel is modified. If user has manually overridden `required_by`, recalculation is suppressed (flag preserved on the order: `required_by_user_override = true`).

**FR-04 (Worklist deadline column).** The env/vector testing worklist SHALL display a `Deadline` column with a color-coded indicator:
- ≥ 24 h remaining → green Tag "On time"
- 4–24 h remaining → yellow Tag "Approaching"
- < 4 h remaining → orange Tag "Imminent"
- Past `required_by` → red Tag "Exceeded"

Indicator updates live as time elapses (computed at render).

**FR-05 (Step 3 hold-time indicator).** S-03 v2.0 §5.2.2 already specifies a "Hold-time exceeded" red indicator on Step 3 sample rows. This spec confirms the data source: the `sop_max_holding_hours` field on each test linked to the sample drives that indicator.

## 4. Data Model

```sql
ALTER TABLE test ADD COLUMN sop_max_holding_hours INTEGER;
ALTER TABLE orders ADD COLUMN required_by_user_override BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_test_sop_holding ON test(sop_max_holding_hours) WHERE sop_max_holding_hours IS NOT NULL;
```

## 5. Acceptance Criteria

- [ ] Test catalog admin shows SOP Max Holding Time only for env/vector tests
- [ ] Step 1 auto-calculates `required_by` when tests + collection time are known
- [ ] "Suggested" tag distinguishes auto-calculated from user-entered values
- [ ] User override suppresses recalculation
- [ ] Worklist deadline indicator color-codes per FR-04
- [ ] Hold-time indicator on Step 3 reads from `sop_max_holding_hours`

## 6. Notes

- Substantially smaller than v1.0 because the generic Required-By field was split out.
- Depends on the generic Required-By spec landing first.
