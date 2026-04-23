# Functional Requirements Specification — Addendum
## Sample Collection Redesign — Referral Out at Label & Store
### Addendum to Sample Collection Redesign v2.0

**OpenELIS Global**
**Version:** 2.1 (addendum to main FRS v2.0)
**Date:** 2026-04-23
**Status:** Draft for Review
**Parent FRS:** `sample-collection-redesign.md` v2.0 (2026-04-16)
**Jira parent epic:** OGC-527 (Env & Vector); parent redesign epic: Sample Collection Redesign
**Related:** X-01 Referral-Out Notification (v1.0) — referral notification trigger; existing Refer Out module (OpenELIS core) — referral mechanics
**Technology:** Java Spring, Carbon React (`@carbon/react`)

---

## Change Log

- **v2.1 (2026-04-23, this addendum):** Adds Refer Out capability to Step 3 (Label & Store). Adds partial/full referral handling rules. Adds `REFERRED_OUT` order status. Adds dashboard filters for referred-out orders. Preserves existing Refer Out module mechanics and X-01 notification trigger.
- **v2.0 (2026-04-16, parent):** Merged S-03 (Environmental Order Entry) into main redesign FRS. See parent FRS change log.

---

## 1. Overview

The Sample Collection Redesign v2.0 decomposes the monolithic `AddOrder.js` form into four independently routable steps (Enter Order → Collect Sample → Label & Store → QA Review). In the original monolith the "Refer Out" workflow was embedded alongside result reporting; the v2.0 redesign inadvertently dropped it because the four-step decomposition was organized around the sample lifecycle, not the test lifecycle.

This addendum restores the existing OpenELIS **Refer Out** workflow into Step 3 (Label & Store). Referrals are assigned *after* samples have been collected and labeled — that is the point at which the tech knows which physical specimen is going where. The existing Refer Out module (referring lab config, `ReferralItem` entity, referred result entry, FHIR outbound referral) is reused without modification; this addendum only specifies the **UI placement**, the **order status transitions** that fire when tests are referred, and the **dashboard filters** that surface referred-out orders.

This addendum also does not re-specify the notification pipeline — **X-01 Referral-Out Notification** (v1.0) handles that, triggered by `ReferralItem.save()`. When the tech saves a referral per this spec, X-01 fires its notification.

### 1.1 What this addendum adds

| Area | New capability |
|------|----------------|
| Step 3 UI | Inline Refer Out column on the Samples & Tests table; per-test and per-sample Refer Out assignment |
| Step 3 bulk action | "Refer all to Lab X" action referring every remaining test on the order to one external lab |
| Order status | New `REFERRED_OUT` terminal status when **all** tests on an order are referred |
| QA bypass rule | Fully-referred orders skip Step 4 QA and close on the in-house side |
| Partial referral | Order continues through Step 4 QA normally; referred tests split off into the existing referral track |
| Order Dashboard | Two new filters — "Has Referred Tests" (partial + full) and "Fully Referred Out" |
| Order Context Card | Adds a "Referred" chip with count when ≥1 test is referred |

### 1.2 What this addendum does NOT change

- **Existing Refer Out module mechanics** — unchanged. This addendum reuses: the referring lab admin config, the `ReferralItem` entity, the FHIR ServiceRequest outbound referral pathway, and the referred-result-entry screen.
- **X-01 Notification pipeline** — unchanged. Saving a referral in Step 3 fires `REFERRAL_OUT` event as specified in X-01 v1.0 FR-01.
- **Step 1, Step 2, Step 4 forms** — unchanged by this addendum (Step 4 logic extended only by the auto-approve rule, no UI change).
- **Lab Unit Workflow Configuration** — Refer Out applies to Clinical, Environmental, and Both modes identically.
- **Permissions model** — uses existing Refer Out permission key (`Refer Out`) — no new permission.

---

## 2. User Stories

Appended to parent FRS §5.

- **US-26** — As a lab technician, after labeling a sample, I want to mark one or more of its tests for referral to an external lab so that the physical specimen and its referral are recorded together in a single step.
- **US-27** — As a lab technician, I want to refer every test on an order to a single external lab with one action so I don't have to click through each test when the whole order is being sent out.
- **US-28** — As a QA officer, I don't want to see orders where every test has been referred externally in my QA queue — those orders have no in-house testing to validate.
- **US-29** — As a lab manager, I want to see which orders have tests out at external labs so I can follow up with those labs if results are late.
- **US-30** — As a lab manager, I want to distinguish "some tests referred" from "all tests referred" on the dashboard so I can see which orders are still partially in-house.

---

## 3. Functional Requirements

### 3.1 Label & Store (Step 3) — Refer Out UI

Appended to parent FRS §6.4 (LBL-1 through LBL-4).

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **LBL-5** | **P0** | The Samples & Tests table on Step 3 MUST include a **Refer Out** column (after Storage Location). Each row (one row per test within a sample) displays the referral state as a Carbon Tag: "In-house" (kind=`gray`, default), "Referred — [Lab Name]" (kind=`purple`), or "Awaiting External Results" (kind=`blue`, set once the referral is saved and the external lab has acknowledged receipt). | Tag renders per row. State updates on referral save. |
| **LBL-6** | **P0** | Each table row MUST provide a **Refer Out** action (overflow menu or inline button, per Carbon). Selecting it expands an inline form below the row with: ReferringLab `ComboBox` (required, options from existing referring-lab admin config), Reason `TextArea` (optional, free text, max 500 chars), Expected Return Date `DatePicker` (optional), and Notify Customer `Checkbox` (default checked if X-01 trigger is enabled; hidden otherwise). Save and Cancel buttons on the expansion. | Row expands. All fields render. Lab dropdown populated. Save persists a `ReferralItem`. Cancel collapses without save. Modal is NOT used. |
| **LBL-7** | **P0** | A **Bulk Refer Out** button MUST appear above the table, left-aligned. Clicking opens a Carbon `Modal` with: ReferringLab `ComboBox` (required), Reason `TextArea` (optional), Expected Return Date `DatePicker` (optional), Notify Customer `Checkbox`, and a preview list showing "This will refer N tests on M samples to [Lab Name]." Confirming creates one `ReferralItem` per remaining in-house test, all pointing at the chosen lab. Modal is justified here because the action changes order-level status (see LBL-10) and is non-reversible without per-test undo. | Modal opens. Preview count reflects unreferred tests. Confirm creates N referrals in one transaction. Cancel closes without change. |
| **LBL-8** | **P0** | A test that has ALREADY been referred MUST NOT be included in the Bulk Refer Out count. The bulk action refers only remaining in-house tests. | Bulk modal count excludes already-referred tests. Re-opening bulk modal after a prior referral shows updated count. |
| **LBL-9** | **P0** | After a referral is saved (per-row LBL-6 or bulk LBL-7), the affected table rows MUST update the Refer Out column Tag to "Referred — [Lab Name]" without a page reload. An `InlineNotification` (kind=`success`) MUST appear at the top of the Step 3 panel confirming "Referred N tests to [Lab Name]." and MUST auto-dismiss after 5 seconds. | Rows update in place. Success notification appears and dismisses. |
| **LBL-10** | **P0** | Saving a referral MUST fire the existing X-01 `REFERRAL_OUT` event (X-01 FR-01) per referral record. If X-01 trigger is disabled globally and no lab-unit override enables it, no notification is sent — this is normal X-01 behavior. | `REFERRAL_OUT` event fires on save. X-01 FR-02 per-referral behavior honored. |
| **LBL-11** | **P0** | A referral MAY be **undone** before the external lab acknowledges receipt. The row overflow menu includes an "Undo Referral" action when state is "Referred — [Lab Name]" and the referral has not yet moved to "Awaiting External Results". Undo voids the `ReferralItem` and emits no additional X-01 event (the original `REFERRAL_OUT` event is not recalled — this is consistent with existing behavior and X-01 is not in scope to modify). | Undo action present only in "Referred" state. Undo reverts Tag to "In-house". |
| **LBL-12** | P1 | When FHIR outbound referral is configured for the selected referring lab, the system MUST transmit a FHIR `ServiceRequest` to the receiving lab as part of the referral save (existing outbound pathway — no new API). Transmission state is reflected in the row Tag: "Referred" = saved locally, "Sent to External" = FHIR transmission succeeded, "Awaiting External Results" = external lab acknowledged via `Task` response. If FHIR transmission fails, row shows kind=`red` Tag with "Send Failed — Retry" action. | FHIR ServiceRequest sent for FHIR-enabled referring lab. Failure state visible and retryable. |
| **LBL-13** | P1 | For non-FHIR referring labs (paper/manifest only), the row Tag transitions are: "In-house" → "Referred — [Lab Name]" → (stays in this state; manual return when results are entered via existing referral-result-entry screen). No Send Failed state. | Paper-only labs do not attempt FHIR send. |

### 3.2 Order Status Transitions — Auto-Complete on Full Referral

Appended to parent FRS §6.5 (QA-1 through QA-6) and §4.3 OrderContext.

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-1** | **P0** | The `orderStatus` enum (parent FRS §4.3) MUST add a new value: `REFERRED_OUT`. Semantics: every test on the order has an active (non-voided) referral. The order has no in-house testing to perform or validate. | Enum value present. Schema migration included. |
| **REF-2** | **P0** | When a referral save (LBL-6 or LBL-7) results in **all** active tests on the order having active referrals, the order `orderStatus` MUST transition from `LABELING` (or `QA_REVIEW` if already there) directly to `REFERRED_OUT`. Step 4 QA Review is bypassed — the QA officer does not see the order in their queue. | All-referred save transitions status. Order disappears from QA queue. Audit trail records transition. |
| **REF-3** | **P0** | A `REFERRED_OUT` order is considered **closed on the in-house side** but remains **open on the referral side** until external results return via the existing referral-result-entry screen. The order does not appear in the QA queue, does not block dashboards, and does not require any further lab action until external results return. | Order not in QA queue. Order visible in "Fully Referred Out" dashboard filter. |
| **REF-4** | **P0** | When external results return for a `REFERRED_OUT` order (via existing referral-result-entry screen), the existing behavior is preserved — results are attached to the order, the `ReferralItem` is marked complete, and the order can be reported. No new status is introduced for "results returned" at this time — the existing `APPROVED` state (set when all results are validated, including external) applies. | External result entry on `REFERRED_OUT` order works as before. Final validated order is `APPROVED`. |
| **REF-5** | **P0** | For a **partially** referred order (at least one test still in-house), the order continues through `LABELING` → `QA_REVIEW` → `APPROVED` normally. Referred tests are excluded from Step 4 QA completeness checks — QA-1 (parent FRS §6.5) MUST treat referred tests as "not applicable" and not red/yellow. | QA completeness excludes referred tests. Mixed order transitions through QA normally. |
| **REF-6** | **P0** | Undoing a referral (LBL-11) that caused an order to enter `REFERRED_OUT` state MUST revert the order to `LABELING` (or the last pre-`REFERRED_OUT` status, read from the audit trail). The order re-enters the appropriate queue. | Undo on last-referred test reverts status. Audit trail captures revert. |
| **REF-7** | P1 | If a `REFERRED_OUT` order has ALL its referrals voided (via LBL-11 on each), it reverts to the previous status (typically `LABELING`) and requires manual re-entry into QA. | Revert-all behavior correct. |

### 3.3 Order Context Card — Referred Chip

Appended to parent FRS §4.3 (Context card rendering).

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-8** | **P0** | When an order has ≥1 active referral, the Order Context Card (NAV-5) MUST display a "Referred" Tag (kind=`purple`) with count, e.g. "Referred (2 of 4)." For fully-referred orders the text reads "Referred (all)." Clicking the Tag anchors the page to the Step 3 referrals section. | Chip displays with count. Clicking scrolls/anchors. Fully-referred label differs. |

### 3.4 Order Dashboard — Filters

Appended to parent FRS §6.9 (DSH-1 through DSH-9).

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **DSH-10** | **P0** | Dashboard Filters (DSH-7) MUST add a new filter: **Referred Out** with options: "Any" (default), "Has Referred Tests" (orders where ≥1 test is referred — includes both partial and full), "Fully Referred Out" (orders where all tests are referred — `orderStatus = REFERRED_OUT`). Filter combines with existing filters via AND. | Filter present. All three options work. Combines with other filters correctly. |
| **DSH-11** | **P0** | Dashboard table rows for orders matching "Has Referred Tests" or "Fully Referred Out" MUST show a Referred Tag (kind=`purple`) in the Status column alongside the primary status. Example row status: "Labeling • Referred (2 of 4)" or "Referred Out (all)". | Status column renders both statuses. |
| **DSH-12** | P1 | Clicking a "Fully Referred Out" row MUST route to Step 3 (Label & Store) with the referrals section anchored — not Step 4 QA, since there is no QA to perform. For partial referrals, clicking routes to the current step per existing DSH behavior. | Fully-referred click routes to Step 3. Partial click routes to current step. |
| **DSH-13** | P2 | A dashboard badge MAY show the total count of "Awaiting External Results" across all orders — a single number visible at the top of the dashboard for quick follow-up triage. | Badge renders with correct count. Clicking filters to those orders. |

### 3.5 Lab Unit Configuration

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-9** | P1 | Refer Out at Label & Store MUST be available under all three workflow modes (Clinical, Environmental, Both). No per-mode gating. | Refer Out visible in all three modes. |
| **REF-10** | P2 | A lab unit SHOULD support a configuration flag `allowBulkReferOut` (default true) that hides the Bulk Refer Out button (LBL-7) when false. Useful for labs that want to force per-test review before referral. | Flag hides button when false. Per-row Refer Out still works. |

---

## 4. Data Model

No new tables — reuses the existing `ReferralItem` entity. One new enum value:

```java
public enum OrderStatus {
  DRAFT,
  ENTERED,
  COLLECTING,
  LABELING,
  QA_REVIEW,
  REFERRED_OUT,  // new — added by v2.1 addendum
  APPROVED,
  REJECTED;
}
```

Schema migration (conceptual):

```sql
-- Liquibase changeset: add REFERRED_OUT to OrderStatus CHECK constraint
ALTER TABLE clinlims.sample_order DROP CONSTRAINT sample_order_status_check;
ALTER TABLE clinlims.sample_order ADD CONSTRAINT sample_order_status_check
  CHECK (status IN ('DRAFT','ENTERED','COLLECTING','LABELING','QA_REVIEW','REFERRED_OUT','APPROVED','REJECTED'));
```

No new columns on `sample_order`, `analysis`, or `referral_item`. The order-level "Fully Referred Out" state is derivable from `referral_item` rows, but is materialized as `orderStatus = REFERRED_OUT` for efficient dashboard filtering.

**Derived columns (computed in backend for dashboard queries):**

| Column | Derivation |
|--------|-----------|
| `has_referred_tests` | `EXISTS(SELECT 1 FROM referral_item WHERE order_id = sample_order.id AND voided = false)` |
| `fully_referred` | `orderStatus = 'REFERRED_OUT'` |
| `referred_count` | `COUNT(referral_item WHERE order_id = sample_order.id AND voided = false)` |
| `total_test_count` | `COUNT(analysis WHERE order_id = sample_order.id AND cancelled = false)` |

---

## 5. API Endpoints

No new endpoints. Extensions only:

| Endpoint | Change |
|----------|--------|
| `POST /rest/referral` | Existing endpoint — no change to request/response. On save, emits X-01 `REFERRAL_OUT` event (existing). |
| `POST /rest/order/{id}/referral/bulk` | **New** — accepts `{ referringLabId, reason, expectedReturnDate, notifyCustomer }`. Server creates one `ReferralItem` per remaining in-house test on the order in a single transaction. Returns `{ createdReferrals: [...], newOrderStatus: 'LABELING' \| 'REFERRED_OUT' }`. |
| `PUT /rest/order/{id}/referral/{referralId}/undo` | **New** — voids a `ReferralItem` and recomputes order status. Returns `{ newOrderStatus }`. Idempotent. |
| `GET /rest/order/search` | Existing dashboard search endpoint — add query params `hasReferred=bool` and `fullyReferred=bool` for DSH-10. |

---

## 6. Business Rules

Appended to parent FRS §9.

| ID | Rule |
|----|------|
| **BR-REF-1** | An order's `orderStatus` transitions to `REFERRED_OUT` the moment the save that results in all active tests having active referrals completes — not on a scheduled job. Atomic with the save. |
| **BR-REF-2** | Voiding a referral MUST re-evaluate order status synchronously. If the last referral is voided, revert to the pre-`REFERRED_OUT` status from the audit log. If no audit log entry exists (edge case), revert to `LABELING`. |
| **BR-REF-3** | Referred tests are excluded from Step 4 QA completeness checks (parent FRS QA-1). They show in the QA panel as a separate "Referred (external)" group for informational context, not as incomplete. |
| **BR-REF-4** | A `REFERRED_OUT` order MUST still allow edit of storage location (LBL-3) in case the physical specimen is moved between refrigerators before external pickup. All other Step 3 fields are read-only once referred. |
| **BR-REF-5** | A `REFERRED_OUT` order is treated as "closed" for in-house workload reports (TAT, productivity). It is treated as "open" for referral-pending-results reports. |
| **BR-REF-6** | Adding a new test to an order that is currently `REFERRED_OUT` (via Edit Order workflow, parent FRS §6.8) MUST revert the order to `LABELING` — the new test is in-house by default and requires the normal pipeline. |

---

## 7. Localization

Appended to parent FRS §10.

| i18n Key | English Fallback |
|----------|-----------------|
| `label.sampleCollection.referOut.column` | Refer Out |
| `label.sampleCollection.referOut.inhouse` | In-house |
| `label.sampleCollection.referOut.referredTo` | Referred — {{labName}} |
| `label.sampleCollection.referOut.awaitingExternal` | Awaiting External Results |
| `label.sampleCollection.referOut.sendFailed` | Send Failed — Retry |
| `label.sampleCollection.referOut.action.refer` | Refer Out |
| `label.sampleCollection.referOut.action.undo` | Undo Referral |
| `label.sampleCollection.referOut.action.retry` | Retry Send |
| `label.sampleCollection.referOut.bulk.button` | Bulk Refer Out |
| `label.sampleCollection.referOut.bulk.modalTitle` | Refer All Tests to External Lab |
| `label.sampleCollection.referOut.bulk.preview` | This will refer {{testCount}} tests on {{sampleCount}} samples to {{labName}}. |
| `label.sampleCollection.referOut.form.referringLab` | Referring Lab |
| `label.sampleCollection.referOut.form.reason` | Reason (optional) |
| `label.sampleCollection.referOut.form.expectedReturn` | Expected Return Date |
| `label.sampleCollection.referOut.form.notifyCustomer` | Notify customer of referral |
| `label.sampleCollection.referOut.notification.success` | Referred {{count}} tests to {{labName}}. |
| `label.sampleCollection.referOut.notification.fhirFailure` | FHIR transmission failed. Referral saved locally — retry send. |
| `label.sampleCollection.referOut.contextCard.referredPartial` | Referred ({{referredCount}} of {{totalCount}}) |
| `label.sampleCollection.referOut.contextCard.referredAll` | Referred (all) |
| `label.sampleCollection.referOut.status.fullyReferred` | Referred Out |
| `label.dashboard.filter.referredOut` | Referred Out |
| `label.dashboard.filter.referredOut.any` | Any |
| `label.dashboard.filter.referredOut.hasReferred` | Has Referred Tests |
| `label.dashboard.filter.referredOut.fullyReferred` | Fully Referred Out |
| `label.dashboard.badge.awaitingExternal` | Awaiting External Results ({{count}}) |
| `error.referOut.noReferringLab` | Select a referring lab before saving. |
| `error.referOut.bulkNoTests` | No in-house tests to refer. All tests on this order are already referred. |

---

## 8. Validation Rules

Appended to parent FRS §11.

| ID | Rule |
|----|------|
| **VR-REF-1** | ReferringLab is required on the per-row Refer Out form. Save disabled until populated. |
| **VR-REF-2** | Bulk Refer Out is disabled if `referred_count == total_test_count` (all tests already referred). |
| **VR-REF-3** | Expected Return Date (if provided) MUST be in the future. Past dates rejected. |
| **VR-REF-4** | Reason text is limited to 500 characters. |
| **VR-REF-5** | Undo Referral is disabled once the referring lab has acknowledged receipt (FHIR `Task` response arrived). After acknowledgment, voiding requires an admin role (reuses existing Refer Out void permission). |

---

## 9. Security & Permissions

Appended to parent FRS §12.

| Permission | Scope |
|-----------|-------|
| **Refer Out** (existing) | Required to create a referral via LBL-6 or LBL-7. UI layer: hide Refer Out actions when permission is absent. API layer: `POST /rest/referral` and `POST /rest/order/{id}/referral/bulk` return 403 when caller lacks permission. |
| **Void Referral** (existing) | Required for LBL-11 Undo Referral. UI: action hidden when absent. API: `PUT /rest/order/{id}/referral/{id}/undo` returns 403. |
| No new permission keys added. Existing Refer Out module permissions are reused. | |

---

## 10. Acceptance Criteria

**Label & Store — Refer Out UI:**
- [ ] Samples & Tests table has a Refer Out column with per-row state Tag
- [ ] Per-row Refer Out action opens inline expansion (not modal)
- [ ] Inline form has ReferringLab, Reason, Expected Return Date, Notify Customer fields
- [ ] Save persists a `ReferralItem` and fires X-01 `REFERRAL_OUT` event
- [ ] Bulk Refer Out button opens modal with preview count
- [ ] Bulk action creates one `ReferralItem` per remaining in-house test
- [ ] Success notification appears and auto-dismisses after 5 seconds
- [ ] Undo Referral action reverts row Tag to "In-house" and re-evaluates order status

**Order Status Transitions:**
- [ ] `REFERRED_OUT` is a valid value in the `OrderStatus` enum
- [ ] Order transitions to `REFERRED_OUT` when last in-house test is referred
- [ ] `REFERRED_OUT` order does not appear in QA queue
- [ ] Partial-referral order transitions through QA normally, with referred tests excluded from completeness
- [ ] Voiding the last referral reverts order to pre-`REFERRED_OUT` status (read from audit log)

**Order Context Card:**
- [ ] "Referred (N of M)" chip displayed on Context Card when ≥1 referral active
- [ ] Chip reads "Referred (all)" for fully-referred orders
- [ ] Clicking chip anchors to Step 3 referrals section

**Order Dashboard:**
- [ ] New filter "Referred Out" with options Any / Has Referred Tests / Fully Referred Out
- [ ] Filter combines with other filters via AND
- [ ] Row Status column shows both primary status and Referred chip
- [ ] Clicking a Fully Referred Out row routes to Step 3, not Step 4
- [ ] Dashboard badge shows count of "Awaiting External Results"

**FHIR Outbound (P1):**
- [ ] FHIR-enabled referring lab triggers FHIR `ServiceRequest` transmission on referral save
- [ ] Transmission state reflected in row Tag (Referred → Sent to External → Awaiting External Results)
- [ ] FHIR send failure shows red Tag with Retry action

**Localization:**
- [ ] All visible strings use `t(key, fallback)` helper
- [ ] All new keys present in parent FRS §10 Localization table (via §7 above)

**Permissions:**
- [ ] Refer Out actions hidden/disabled when caller lacks "Refer Out" permission
- [ ] Bulk endpoint returns 403 when caller lacks permission

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| Parent FRS `sample-collection-redesign.md` v2.0 | Extends §4.3 OrderContext, §6.4 Step 3, §6.5 Step 4, §6.9 Dashboard. |
| Existing OpenELIS Refer Out module | Hard prerequisite — `ReferralItem` entity, referring-lab admin config, referred-result-entry screen are reused. |
| X-01 Referral-Out Notification v1.0 | Integration point — `REFERRAL_OUT` event fires on referral save (X-01 FR-01). |
| FHIR Outbound Referral (existing) | Used when referring lab is FHIR-capable (LBL-12). |
| Audit Trail (parent FRS QA-6) | Used by REF-6 to determine pre-`REFERRED_OUT` status for revert. |

---

## 12. Open Questions

- **OQ-1 (REF-4 scope):** Should external results attached to a `REFERRED_OUT` order automatically transition the order to `APPROVED`, or must a validator explicitly approve? v2.1 preserves existing behavior (explicit validator action) — confirm.
- **OQ-2 (LBL-12 FHIR):** For FHIR-capable referring labs, should the UI offer a "Send now" vs "Save for batch send" choice, or is immediate send the only mode? Default here is immediate.
- **OQ-3 (DSH-13 badge):** Is "Awaiting External Results" a useful top-level dashboard badge, or is it enough to surface via the filter alone? Current designation is P2.
- **OQ-4 (REF-10 lab-unit flag):** Is `allowBulkReferOut` a real concern from any deployment, or can LBL-7 always be enabled? Defaults to always-enabled until a lab asks.
