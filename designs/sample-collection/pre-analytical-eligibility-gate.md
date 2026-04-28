# S-09 — Pre-Analytical Eligibility Gate & Resampling
## Addendum to S-03 v2.0 (Step 3 QA/QC)
### Functional Requirements Specification — v2.0

**Version:** 2.0 (rebased rewrite of v1.0)
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** OGC-TBD (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Addendum to:** [S-03 v2.0 — Environmental Order Entry](./S03-environmental-order-entry-frs-v2.0.md) §5.3 (Step 3 QA/QC + Intake Acceptance)
**Supersedes:** v1.0 — original was built on the old 4-step workflow ("Step 4 QA Review"). With S-03 v2.0's 3-step model, Step 4 doesn't exist; the per-sample NCE button at S-03 v2.0 §5.3.1 is now the rejection action. v2.0 rebases on the current model and trims what's now redundant.

---

## 1. Overview

S-03 v2.0 §5.3 (Step 3 QA/QC + Intake Acceptance) covers the **rejection action** — the lab tech clicks the existing NCE button on a sample, picks a coded reason, and either flags or rejects. That covers the rejection half of an eligibility gate.

S-09 v2.0 covers what S-03 v2.0 doesn't:

1. **Per-SampleType acceptance criteria checklist.** Each SampleType has configured acceptance rules (transit-time window, volume range, temperature range, container requirements, label requirements). At Step 3, the system pre-populates a checklist for each sample, auto-evaluating which criteria pass/fail based on Step 2 data. The lab tech ticks through visually, and the NCE pre-populates from the failing criteria.
2. **Resample sample action.** A third option alongside accept-with-flag and reject — creates a linked new order (pre-populated from the original) and notifies the customer/requester.
3. **Status formalization.** `IN_PROGRESS` → `PENDING_LABELING` → `PENDING_INTAKE` → `ELIGIBLE` / `RESAMPLING` / `REJECTED` documented as named values driving dashboards and SLAs.
4. **Lab-unit gate behavior config.** Per-domain `Mandatory` / `Prompted` / `Disabled` flag.

What v1.0 had that v2.0 drops:

- ❌ References to "Step 4 QA Review" — Step 4 doesn't exist in the 3-step model.
- ❌ Eligibility Worklist sidebar entry point — replaced by a status filter on the existing Order Dashboard.
- ❌ Shipment-level batch grouping — pushed to a P2 follow-up; not v1 scope.
- ❌ Dual-entry of arrival data — Step 2 captures it, Step 3 displays it (already in S-03 v2.0).
- ❌ Vector CollectionLot variant — defer to V-02 spec.

## 2. Scope

**In scope:**
- Per-SampleType acceptance criteria registry (admin-side: configure rules per SampleType)
- Auto-populated criteria checklist at Step 3 with auto-evaluation against Step 2 data
- Failing criteria pre-populate the NCE dialog reason
- New "Resample" outcome on the per-sample NCE flow (alongside accept-with-flag and reject)
- Resample creates a linked new order (Draft state) with `resampled_from` link + customer/requester notification
- Status formalization: `IN_PROGRESS / PENDING_LABELING / PENDING_INTAKE / ELIGIBLE / RESAMPLING / REJECTED`
- Order Dashboard filter on `status = PENDING_INTAKE` to surface the daily intake queue (replaces the v1.0 Eligibility Worklist sidebar)
- Lab-unit + per-domain gate behavior config (`Mandatory` / `Prompted` / `Disabled`)

**Out of scope:**
- Per-sample NCE button rendering and coded-reason picklist — already in S-03 v2.0 §5.3.1
- Shipment-level batch grouping — P2 follow-up
- Vector CollectionLot variant — V-02 spec
- New main-menu pages

## 3. Functional Requirements

### 3.1 SampleType Acceptance Criteria Registry

**FR-01.** The SampleType admin form SHALL include an "Acceptance Criteria" tab where admins configure rules:

| Criterion | Type | Notes |
|---|---|---|
| Transit time max | Hours (NumberInput) | Hours from collection to receipt |
| Volume range | Min + Max (mL) | Optional |
| Receipt temperature range | Min + Max (°C) | Optional |
| Required container types | Multi-select | From a configurable list (sterile bottle, brown glass, etc.) |

> **Note:** Label-completeness checking is handled by the existing OpenELIS label management module — not in scope for S-09.

Rules are optional per SampleType; if none configured, the checklist at Step 3 is empty for that sample (and the gate is effectively skipped for that sample).

### 3.2 Step 3 Criteria Checklist

**FR-02.** S-03 v2.0 §5.3.1 (Per-Sample NCE Button) is extended: clicking on a sample row SHALL open a side panel showing the auto-populated criteria checklist for that sample's SampleType. Each criterion shows a green ✓ (pass) or red ✕ (fail) computed from Step 2 data. Failing criteria are pre-selected in the NCE dialog reason picklist when the tech opens it.

**FR-03.** A summary indicator on the per-sample table row at Step 3:
- All criteria pass → green Tag "Eligible"
- Any criterion fails → yellow Tag "Review" (becomes the trigger for the lab tech to open the NCE dialog)
- No criteria configured → no Tag

### 3.3 Resample Sample Action

**FR-04.** The existing OE NCE dialog (per S-03 v2.0 §5.3.1) SHALL be extended with a third sample_action radio option: **Resample**. The existing options "Continue with NCE flag" and "Reject sample" remain unchanged.

**FR-05 (Resample commit behavior).** When the operator commits the NCE with `sample_action = Resample`, the system SHALL:
1. Mark the original sample's status as `REJECTED_RESAMPLING` (terminal for the original physical sample).
2. Create a new Draft order pre-populated from the original order:
   - Same site, compliance standard (if any), sample type quantities, tests, default conditions
   - `resampled_from` field set to the original order ID
   - Status: `IN_PROGRESS` at Step 1
3. Send a notification (email or TextIt SMS, per the site's configured notification channel) to the original requester / customer with: original LABNO, failure reason, deep link to the new Draft order.

**FR-06.** The new Resample order behaves like any other order — reception fills it in when the resampled physical sample arrives. The `resampled_from` link is preserved for audit and analytics.

### 3.4 Status Formalization

**FR-07.** The Order entity SHALL have a `status` enum with documented values:

| Status | Meaning |
|---|---|
| `DRAFT` | Step 1 not yet submitted |
| `IN_PROGRESS` | Submitted Step 1; in Step 2 or Step 3 |
| `PENDING_LABELING` | Sub-state during Step 2 |
| `PENDING_INTAKE` | Sub-state during Step 3 (samples awaiting NCE/eligibility decision) |
| `ELIGIBLE` | All samples passed eligibility (or accepted-with-flag); batch advanced to bench |
| `RESAMPLING` | At least one sample marked Resample; batch may have other samples that proceeded |
| `REJECTED` | Entire batch rejected (no samples advanced) |

These are formalizations of currently-implicit states. Existing screens read `status` going forward.

### 3.5 Order Dashboard Status Filter

**FR-08.** The existing Order Dashboard SHALL gain a `Status` filter dropdown (multi-select) including the values from FR-07. Operators looking for the daily intake queue filter to `PENDING_INTAKE`. This replaces the v1.0 proposed Eligibility Worklist sidebar — a filter on the existing dashboard is sufficient.

### 3.6 Lab-Unit Gate Behavior

**FR-09.** Lab unit configuration SHALL include a per-domain (Clinical / Env / Vector) flag for gate behavior:

- `Mandatory` — Step 3 cannot be submitted while any sample has `Review` status (failing criteria)
- `Prompted` — Step 3 surfaces the criteria but doesn't block submission; tech can override with single-click acknowledgment
- `Disabled` — criteria checklist is hidden; only the existing NCE button (S-03 v2.0 §5.3.1) is available

SILNAS labs configure `Mandatory` for all three domains; clinical-only labs may configure `Prompted` for clinical and rely on existing intake checks.

## 4. Data Model

```sql
-- SampleType acceptance criteria
CREATE TABLE sample_type_acceptance_criteria (
  id BIGSERIAL PRIMARY KEY,
  sample_type_id BIGINT NOT NULL REFERENCES sample_type(id) ON DELETE CASCADE,
  transit_time_max_hours INTEGER,
  volume_min_ml NUMERIC,
  volume_max_ml NUMERIC,
  receipt_temp_min_c NUMERIC,
  receipt_temp_max_c NUMERIC,
  required_container_types JSONB,  -- array of container type codes
  UNIQUE(sample_type_id)
);

-- Order status formalization
ALTER TABLE orders ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE orders ADD COLUMN resampled_from_order_id BIGINT REFERENCES orders(id);

-- Lab-unit gate behavior
ALTER TABLE lab_unit ADD COLUMN gate_behavior_clinical VARCHAR(20) DEFAULT 'Prompted';
ALTER TABLE lab_unit ADD COLUMN gate_behavior_env VARCHAR(20) DEFAULT 'Mandatory';
ALTER TABLE lab_unit ADD COLUMN gate_behavior_vector VARCHAR(20) DEFAULT 'Mandatory';

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_resampled_from ON orders(resampled_from_order_id);
```

## 5. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/sample-types/{id}/acceptance-criteria` | Read criteria for evaluation |
| PUT | `/api/v1/sample-types/{id}/acceptance-criteria` | Admin save criteria |
| GET | `/api/v1/samples/{id}/eligibility` | Auto-evaluate criteria for a sample (returns pass/fail per criterion) |
| POST | `/api/v1/samples/{id}/resample` | Commit Resample action (creates new order + sends notification) |
| GET | `/api/v1/orders?status=PENDING_INTAKE` | Dashboard filter |

## 6. Acceptance Criteria

- [ ] SampleType admin includes Acceptance Criteria tab with rule fields
- [ ] Step 3 sample rows show Eligible / Review / no-tag indicator
- [ ] Side panel shows criteria checklist with auto-evaluation
- [ ] NCE dialog pre-populates reason from failing criteria
- [ ] NCE dialog gains "Resample" sample_action option
- [ ] Resample commit creates linked new Draft order with `resampled_from` set
- [ ] Resample sends notification via configured channel
- [ ] Order status enum implemented with documented values
- [ ] Order Dashboard gains Status filter
- [ ] Lab-unit config includes per-domain gate behavior (Mandatory / Prompted / Disabled)
- [ ] No new main-menu pages introduced

## 7. Notes

- ~50% the size of v1.0 because:
  - Rebased on 3-step model (no "Step 4" rewriting needed)
  - Eligibility Worklist sidebar replaced by an Order Dashboard filter
  - Shipment batch grouping deferred to P2
  - Vector CollectionLot variant deferred to V-02
- Net new value over S-03 v2.0: criteria checklist + Resample action + status formalization + per-domain gate behavior. The rejection-action surface is reused from S-03 v2.0 §5.3.1.
