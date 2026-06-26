# S-03d — SOP Deadline Calculation [SUPERSEDED — split into v2.0 + cross-cutting ticket]
## ⚠️ DEPRECATED — See S-03d v2.0 + cross-cutting Required-By ticket
### Functional Requirements Specification — v1.0 [HISTORICAL]

**Status (2026-04-25):** ⚠️ **SUPERSEDED.** Original v1.0 bundled three things that don't belong in the same spec: Part A (generic Required-By field on Step 1, applies to ALL order types — clinical, env, vector, EQA), Part B (SOP holding-time auto-calc, env/vector-specific), and Part C (worklist deadline color-coding, env/vector-specific). Now split:
> - **Part A** moved to a cross-cutting OE ticket (`GENERIC-required-by-field-frs.md`) — affects all domains, doesn't belong in the Env epic.
> - **Parts B + C** stay as the env addendum, rewritten as `S03d-sop-deadline-calculation-frs-v2.0.md`.
>
> Original v1.0 content preserved below for historical reference only.

---

# S-03d — SOP Deadline Calculation & Order Due Date [original v1.0]
## Addendum to S-03
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-21
**Status:** ⚠️ SUPERSEDED — see header above
**Jira:** [OGC-593](https://uwdigi.atlassian.net/browse/OGC-593)
**Addendum to:** [S-03 FRS — Environmental Order Entry Integration](./S03-environmental-order-entry-frs-v1.0.md) / [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537)
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Source requirement:** Bogor requirements spreadsheet — Must Have, Phase 1: "Compute testing deadline from collection date/time + SOP maximum holding time. Flag approaching/exceeded deadlines in ENV testing worklist."
**Related specs:** [EQA FRS](./eqa-requirements.md) — EQA deadline DatePicker is the canonical source of the shared due-date pattern reused here

---

## 1. Overview

OpenELIS order entry does not currently capture a due date or required-by date at the order level. The EQA module introduced a `testing_deadline` field (Carbon `DatePicker` + time input) for EQA orders, but this lives in the EQA-specific Tab 2 and is not available to clinical, environmental, or vector orders.

S-03d adds **two related capabilities**:

### Part A — General Due Date on Order Entry Step 1 (all order types)

A `Required By` date-and-time field on **Step 1 — Enter Order** for all order types (clinical, environmental, vector, EQA). This generalises the EQA deadline concept: the same `DatePicker` + time-input pair is surfaced once, in Step 1, and the EQA module's `eqa_deadline` is unified with this field. The field is **optional by default** and can be made mandatory per lab configuration.

### Part B — SOP Maximum Holding Time + Auto-Calculation (ENV/Vector orders only)

For environmental and vector orders, each test can have a `sop_max_holding_hours` configured by an admin (per test, per matrix). When the order has tests with holding times configured and a collection date/time is known (from Step 2 or entered on Step 1), the system **calculates the testing deadline** as:

```
testing_deadline = collection_datetime + min(sop_max_holding_hours across all tests on order)
```

The calculated deadline is presented as a **suggestion** that auto-populates the `Required By` field. The user can accept or override it. The calculation updates live as tests are added/removed.

### Part C — Worklist Deadline Flagging (ENV/Vector orders)

The ENV and Vector testing worklists display a **deadline status indicator** for each order that has a `required_by` date set. The indicator is colour-coded by time remaining.

### 1.1 What this addendum changes

| Area | Change |
|------|--------|
| Order Entry Step 1 | New `Required By` date+time field (all order types) |
| EQA module | `eqa_deadline` field unified with the new `required_by` field; EQA Tab 2 field removed to avoid duplication |
| Admin — Test Catalog | New `SOP Max Holding Time` field per test (ENV/Vector only) |
| ENV/Vector worklist | New `Deadline` column with colour-coded status indicator |
| Order context card | `Required By` date shown on Steps 2–4 context card when set |
| Order entity | New `required_by` column (TIMESTAMP WITH TIME ZONE, nullable) |

### 1.2 What this addendum does NOT change

- The EQA deadline alert system (3-day, 1-day, 4-hour alerts) — those continue to read from the unified `required_by` field unchanged
- The clinical order entry workflow — the `Required By` field appears on Step 1 but is not required and has no SOP calculation
- The storage/disposition UI
- Validation, reporting, or result entry workflows

---

## 2. User Stories

- **US-01** — As a lab technician, I want to record a required-by date on any order at the time of entry so that downstream staff know when results are needed without checking outside systems.
- **US-02** — As an environmental lab tech, I want the system to calculate the testing deadline automatically from the collection date and SOP holding times so that I don't have to compute it manually for each test.
- **US-03** — As a lab supervisor, I want the testing worklist to visually flag orders approaching or exceeding their SOP deadline so that I can prioritise work and avoid holding-time violations.
- **US-04** — As a test catalog admin, I want to configure a maximum holding time for each test so that the system can enforce SOP compliance without relying on manual calculations.

---

## 3. Functional Requirements

### 3.1 Part A — Required By Field on Order Entry Step 1

**FR-01** — The system MUST add a `Required By` field to **Step 1 — Enter Order** for all order types. The field SHALL appear between the Priority field and the Requested Tests section. It consists of:

- A **Carbon `DatePicker`** (range mode: OFF; single date) labelled `t('order.requiredByDate', 'Required by (date)')`
- A **Carbon `TimePicker`** labelled `t('order.requiredByTime', 'Time')` rendered inline to the right of the DatePicker
- Both fields are optional by default.
- Helper text: `t('order.requiredByHelper', 'Leave blank if no deadline applies.')`

**FR-02** — The `Required By` field MUST persist to the `order.required_by` column (TIMESTAMP WITH TIME ZONE, nullable) on the order entity.

**FR-03** — When `required_by` is set, it MUST be displayed as a **read-only field in the Order Context Card** on Steps 2, 3, and 4. Format: `Required by: DD MMM YYYY HH:mm`. The context card label is `t('order.context.requiredBy', 'Required by')`.

**FR-04** — If `required_by` is set and is in the past at the time of saving Step 1, the system MUST show an `InlineNotification` (kind="warning") with message: `t('order.requiredByPast', 'The required-by date is in the past. Please confirm this is intentional.')`. The form can still be saved.

**FR-05** — Lab administrators MUST be able to configure whether the `Required By` field is mandatory for each order type (Clinical / Environmental / Vector / EQA) via a toggle in Administration → Site Information → Order Settings. Default: optional for all types.

**FR-06** — The EQA module's `eqa_deadline` field (Tab 2 of EQA order entry) MUST be removed. The `eqa_deadline` database column MUST be migrated to `order.required_by` via a data migration script. The EQA deadline-alert system (3-day, 1-day, 4-hour alerts) reads from `order.required_by` after migration. All i18n keys referencing `eqa.deadline` are deprecated; `order.requiredByDate` / `order.requiredByTime` are the canonical keys.

**FR-07** — The `Required By` date-time pair uses the same Carbon `DatePicker` + time input pattern established in the EQA module. Date format respects the lab's configured locale (ISO 8601 display for EN; DD/MM/YYYY for ID).

### 3.2 Part B — SOP Holding Time Configuration (Admin)

**FR-08** — The system MUST add a `SOP Max Holding Time` field to the test catalog record for tests that belong to ENV or Vector panels. The field is:

- A **Carbon `NumberInput`** (min: 1, max: 10000, step: 1) for the numeric value
- A **Carbon `Select`** for unit: `hours` | `days` (stored internally always as hours)
- The field is **optional**. Tests without a holding time do not participate in the auto-calculation.
- Label: `t('admin.test.sopHoldingTime', 'SOP Max Holding Time')`
- Helper: `t('admin.test.sopHoldingTimeHelper', 'Maximum time from collection to result. Used to calculate testing deadlines for ENV/Vector orders.')`

**FR-09** — The `SOP Max Holding Time` MUST be stored as `test.sop_max_holding_hours NUMERIC(8,2) NULL` on the test entity (or an ENV/Vector-specific extension table if the core test entity is not to be modified). Values entered in days are converted to hours on save.

**FR-10** — The admin MUST be able to set the `SOP Max Holding Time` for each test from the existing Test Catalog Management admin page, using inline row expansion (per constitution §C-3). The field appears in the expanded edit row only when the test is associated with an ENV or Vector panel.

### 3.3 Part B — Auto-Calculation on Order Entry (ENV/Vector only)

**FR-11** — For ENV and Vector orders, whenever the order has at least one test with `sop_max_holding_hours` configured, and the order has a collection date/time (either entered in the Collection Conditions section on Step 1 or carried from Step 2), the system MUST compute:

```
calculated_deadline = collection_datetime + min(sop_max_holding_hours) across all tests with holding times on the order
```

**FR-12** — The calculated deadline MUST be presented as an **auto-fill suggestion** in the `Required By` field: the date and time inputs are populated, and an `InlineNotification` (kind="info") appears below reading:

```
t('order.deadlineCalculated',
  'Required-by date auto-calculated from collection date + shortest SOP holding time ({{hours}}h across {{count}} tests). You may override this value.',
  { hours: minHoldingHours, count: testsWithHoldingTime }
)
```

**FR-13** — The auto-calculation MUST update in real time as:
- Tests are added or removed from the order
- The collection date/time changes

**FR-14** — If the user manually edits the `Required By` field after an auto-calculation, the `InlineNotification` MUST change to indicate the value has been overridden:

```
t('order.deadlineOverridden', 'Required-by date manually set (SOP calculated: {{calculatedDate}}). The manual value will be saved.')
```

**FR-15** — If tests span multiple SOP holding times, the system MUST use the **minimum** holding time (most restrictive). A tooltip on the auto-fill notification lists each test and its holding time so the technician understands the basis.

**FR-16** — If no collection date/time is available on Step 1, the auto-calculation MUST be deferred. The `Required By` field shows helper text: `t('order.deadlinePendingCollection', 'SOP deadline will be calculated once collection date/time is entered.')`. When the user later fills in a collection date/time (on Step 1 or Step 2), the calculation fires.

### 3.4 Part C — Worklist Deadline Flagging

**FR-17** — The ENV and Vector testing worklists MUST display a `Deadline` column. The column shows the `required_by` value (formatted as relative time e.g. "in 2h 15m" or "3h ago") or "—" if not set.

**FR-18** — The `Deadline` column MUST use a colour-coded indicator based on time remaining:

| Time remaining | Indicator | Carbon Tag kind |
|---------------|-----------|----------------|
| > threshold (configurable) | Green | `green` |
| ≤ threshold and > 0 | Amber | `warm-gray` |
| Exceeded (past deadline) | Red | `red` |

**FR-19** — The approaching-deadline threshold MUST be configurable in Administration → Site Information → Order Settings as a `NumberInput` (unit: hours, default: 4, min: 1, max: 72). Label: `t('admin.deadlineApproachThreshold', 'Approaching deadline threshold (hours)')`.

**FR-20** — The worklist MUST support sorting by the `Deadline` column (ascending: nearest deadline first). The default sort order for the ENV/Vector worklist MUST place orders with deadlines before orders without, sorted by deadline ascending.

**FR-21** — The worklist MUST provide a **filter chip** for `Approaching deadline` and `Overdue` so supervisors can instantly isolate at-risk orders.

**FR-22** — Exceeded-deadline orders (Tag kind="red") MUST also display a **warning icon** (`WarningAlt` from `@carbon/icons-react`) before the time value. The table row background MAY use a subtle red tint (no hardcoded hex — use `--cds-support-error-inverse` at 10% opacity via a CSS custom property).

---

## 4. Data Model

```sql
-- Part A: Order-level due date (all order types)
ALTER TABLE orders
  ADD COLUMN required_by TIMESTAMPTZ NULL;

-- Migration: copy EQA deadlines to the new unified column
UPDATE orders o
SET    required_by = e.eqa_deadline
FROM   eqa_order_extension e
WHERE  e.order_id = o.id
AND    e.eqa_deadline IS NOT NULL;

-- Part B: SOP holding time per test (ENV/Vector)
ALTER TABLE test
  ADD COLUMN sop_max_holding_hours NUMERIC(8,2) NULL;
-- Note: if the core test entity cannot be modified, create:
-- CREATE TABLE test_env_config (
--   test_id     BIGINT PRIMARY KEY REFERENCES test(id),
--   sop_max_holding_hours NUMERIC(8,2) NULL
-- );

-- Admin config: approaching-deadline threshold
-- Stored in existing site_information or lab_configuration table:
-- key = 'deadline.approaching.threshold.hours', value = '4' (default)
```

**No new tables required.** The EQA `eqa_deadline` column on the EQA extension table is deprecated after migration and may be dropped in a subsequent cleanup migration.

---

## 5. API Changes

No new REST endpoints. Changes to existing endpoints:

| Endpoint | Change |
|----------|--------|
| `POST /api/v1/orders` | Accept `requiredBy: ISO-8601 datetime` in request body |
| `PUT /api/v1/orders/{id}` | Accept `requiredBy` update |
| `GET /api/v1/orders/{id}` | Return `requiredBy` in response |
| `GET /api/v1/worklist/env` | Return `requiredBy`, `deadlineStatus` (`NONE` / `OK` / `APPROACHING` / `EXCEEDED`) per order |
| `GET /api/v1/worklist/vector` | Same as above |
| `PUT /api/v1/admin/tests/{id}` | Accept `sopMaxHoldingHours` update |
| `GET /api/v1/admin/tests/{id}` | Return `sopMaxHoldingHours` |

New calculation utility endpoint (optional, for client-side pre-validation):

```
GET /api/v1/orders/deadline-preview?collectionDatetime=...&testIds=1,2,3
→ { calculatedDeadline: "2026-04-22T14:30:00Z", basisHours: 8, basisTest: "Coliform Count" }
```

---

## 6. Business Rules

**BR-01** — `Required By` is optional for all order types unless lab configuration sets it as mandatory for a specific order type.

**BR-02** — The SOP auto-calculation uses the **minimum** holding time across all tests with `sop_max_holding_hours` configured. Tests without a holding time are excluded from the calculation but do not block it.

**BR-03** — If collection date/time is not available when the order is saved on Step 1, the `Required By` field is left blank (not an error). The calculation fires as soon as a collection date is entered.

**BR-04** — A manually set `Required By` date overrides the auto-calculated suggestion. The system stores the user's value regardless of whether it aligns with the SOP calculation.

**BR-05** — EQA deadline alerts continue to fire based on `order.required_by` after migration. The alert thresholds (72h, 24h, 4h) and alert infrastructure are unchanged.

**BR-06** — The `Approaching deadline` threshold used for worklist colouring applies to ALL order types shown in the worklist (ENV and Vector). It does NOT apply to EQA orders (the EQA module has its own alert thresholds).

**BR-07** — `sop_max_holding_hours` is an informational/advisory configuration. The system flags violations; it does not block result entry after the deadline.

---

## 7. Admin Configuration

New settings in Administration → Site Information → Order Settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Required By` mandatory — Clinical | Toggle | OFF | Make Required By field mandatory for clinical orders |
| `Required By` mandatory — Environmental | Toggle | OFF | Make Required By field mandatory for ENV orders |
| `Required By` mandatory — Vector | Toggle | OFF | Make Required By field mandatory for vector orders |
| `Required By` mandatory — EQA | Toggle | OFF | Make Required By field mandatory for EQA orders |
| Approaching deadline threshold | NumberInput (hours) | 4 | Hours before deadline at which worklist turns amber |

---

## 8. Localization

| Key | English fallback |
|-----|----------------|
| `order.requiredByDate` | Required by (date) |
| `order.requiredByTime` | Time |
| `order.requiredByHelper` | Leave blank if no deadline applies. |
| `order.requiredByPast` | The required-by date is in the past. Please confirm this is intentional. |
| `order.context.requiredBy` | Required by |
| `order.deadlineCalculated` | Required-by date auto-calculated from collection date + shortest SOP holding time ({{hours}}h across {{count}} tests). You may override this value. |
| `order.deadlineOverridden` | Required-by date manually set (SOP calculated: {{calculatedDate}}). The manual value will be saved. |
| `order.deadlinePendingCollection` | SOP deadline will be calculated once collection date/time is entered. |
| `admin.test.sopHoldingTime` | SOP Max Holding Time |
| `admin.test.sopHoldingTimeHelper` | Maximum time from collection to result. Used to calculate testing deadlines for ENV/Vector orders. |
| `admin.deadlineApproachThreshold` | Approaching deadline threshold (hours) |
| `worklist.deadline` | Deadline |
| `worklist.deadlineApproaching` | Approaching deadline |
| `worklist.deadlineExceeded` | Overdue |
| `worklist.deadlineNone` | — |
| `worklist.filter.approaching` | Approaching deadline |
| `worklist.filter.overdue` | Overdue |

---

## 9. Acceptance Criteria

**Part A — Required By field:**
- [ ] `Required By` date+time field appears on Step 1 for all order types (Clinical, ENV, Vector, EQA)
- [ ] Field is optional by default; can be made mandatory per order type in admin config
- [ ] Value persists to `order.required_by` on save
- [ ] Value appears in Order Context Card on Steps 2, 3, 4 when set
- [ ] Past-date warning InlineNotification shown when saved with a past date
- [ ] EQA orders no longer show the duplicate deadline field in Tab 2
- [ ] EQA deadline data migrated from `eqa_deadline` to `order.required_by` without loss

**Part B — SOP holding time:**
- [ ] Admin can set `SOP Max Holding Time` (hours or days) per test in Test Catalog Management
- [ ] Field only appears for tests in ENV or Vector panels
- [ ] Values in days are stored as hours
- [ ] For ENV/Vector orders with collection date and tests with holding times, `Required By` auto-populates with calculated deadline
- [ ] InlineNotification shows basis (minimum holding hours, test count)
- [ ] Calculation updates live when tests are added/removed or collection date changes
- [ ] Manually overriding the auto-calculated value shows the "overridden" notification variant
- [ ] If no collection date available, helper text shown; calculation deferred
- [ ] Multi-test orders use the minimum holding time (most restrictive)

**Part C — Worklist flagging:**
- [ ] ENV and Vector worklists display a `Deadline` column
- [ ] Deadline column shows relative time ("in 2h 15m" / "3h ago") or "—"
- [ ] Green Tag: > threshold hours remaining
- [ ] Amber Tag: ≤ threshold hours remaining and not yet exceeded
- [ ] Red Tag + WarningAlt icon: deadline exceeded
- [ ] Worklist sortable by Deadline column (default sort: nearest deadline first, no-deadline orders last)
- [ ] Filter chips for `Approaching deadline` and `Overdue` work correctly
- [ ] Approaching threshold configurable in admin settings (default 4h)

---

## 10. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-03 (ENV Order Entry) / OGC-537 | Parent — this addendum extends Step 1 of the same order entry workflow |
| EQA FRS (eqa-requirements.md) | Donor — `DatePicker` + time-input pattern and deadline alert system; `eqa_deadline` migrated to `required_by` |
| EQA Addendum (eqa-enrollment-addendum.md) | Updated — EQA Tab 2 deadline field removed; EQA alert system reads from unified field |
| OGC-296 (sampleDomain) | Gate — SOP auto-calculation applies to ENV and Vector orders only, gated by sampleDomain |
| Test Catalog Management | Hook point — `sop_max_holding_hours` added via inline row expansion on existing admin page |
| ENV/Vector Worklist | Hook point — new `Deadline` column + filter chips |
