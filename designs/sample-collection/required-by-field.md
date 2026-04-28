# GENERIC — Required-By Date on Order Entry Step 1
## Cross-Cutting OE Feature (NOT part of the Env/Vector epic)
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** TBD (file under generic OE backlog, not OGC-527)
**Origin:** Split out from S-03d v1.0 Part A. Original spec bundled this generic field with env-specific SOP holding-time logic; the split places this where it belongs — as a cross-cutting OE feature affecting clinical, env, vector, and EQA orders.

---

## 1. Overview

OpenELIS does not currently capture a due date or required-by date at the order level. The EQA module has a `testing_deadline` field but it lives in EQA-specific Tab 2 and is not available to other order types. This spec adds a **Required By** date+time field to Order Entry Step 1 for **all order types**. The EQA-specific `eqa_deadline` is unified with this field.

## 2. Scope

**In scope:**
- New `required_by` column on the Order entity (TIMESTAMP WITH TIME ZONE, nullable)
- DatePicker + TimePicker pair on Order Entry Step 1, all order types
- Display on Steps 2+ context card when set
- Optional by default; lab-config flag to make it required per lab unit
- Unification with EQA `eqa_deadline` (the EQA module reads `required_by` going forward)

**Out of scope:**
- SOP holding-time auto-calc (env/vector-specific) — see S-03d v2.0
- Worklist deadline color-coding (env/vector-specific) — see S-03d v2.0
- Notification rules tied to the deadline (existing EQA alerts continue unchanged, reading from `required_by`)

## 3. Functional Requirements

**FR-01.** Step 1 of Order Entry SHALL display a **Required By** field consisting of a Carbon `DatePicker` (single-date variant) and an inline `TimePicker`. Field is optional by default.

**FR-02.** Lab unit configuration SHALL include a per-domain flag (`Clinical / Env / Vector / EQA`) marking the field as required for orders of that domain. When required and missing, Step 1 cannot be submitted.

**FR-03.** When set, the value SHALL display on Steps 2+ in the Order Context Card as a read-only line: "Required By: {date time}".

**FR-04.** The EQA module SHALL be migrated to read from `required_by` instead of `eqa_deadline`. The existing EQA Tab 2 deadline input is removed (replaced by Step 1 entry).

**FR-05.** Existing EQA deadline alert system (3-day, 1-day, 4-hour) reads from `required_by` unchanged.

## 4. Data Model

```sql
ALTER TABLE orders ADD COLUMN required_by TIMESTAMP WITH TIME ZONE;

-- Migration: copy existing EQA deadlines into the new column, then drop the old column.
UPDATE orders o
SET required_by = e.testing_deadline
FROM eqa_orders e
WHERE o.id = e.order_id AND e.testing_deadline IS NOT NULL;

ALTER TABLE eqa_orders DROP COLUMN testing_deadline;
```

## 5. Acceptance Criteria

- [ ] Required-By field renders on Step 1 of all order types
- [ ] Optional by default
- [ ] Per-domain required-flag enforced when configured
- [ ] Value displays on Steps 2+ Context Card when set
- [ ] EQA deadline alerts continue working from the new column
- [ ] EQA Tab 2 deadline input removed
- [ ] Migration backfills existing EQA deadlines into `required_by`

## 6. Notes

- Trivial spec by design — this is a small generic field plus a column migration. Should be ~1 sprint of work.
- Once shipped, S-03 v2.0 §3.2 non-goal #9 is satisfied (env order entry inherits the field automatically).
- S-03d v2.0 Parts B+C consume this field for SOP holding-time calc and worklist color-coding.
