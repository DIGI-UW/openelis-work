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

- **v2.1 (2026-04-23, this addendum):** Adds Refer Out capability to Step 3 (Label & Store). Refer Out operates at the **sample level** — a physical specimen cannot be both kept and referred, so referring any test on a sample refers the whole sample and every test assigned to it. Partial referral is achieved by having multiple samples on an order, some referred and some in-house. Adds `REFERRED_OUT` order status (fires when all samples are referred). Adds dashboard filters for referred-out orders. Referral UI is integrated alongside the existing LBL-2 Print Labels and LBL-3 Storage Assignment sections so Step 3 reads as one unified step. Preserves existing Refer Out module mechanics and X-01 notification trigger.
- **v2.0 (2026-04-16, parent):** Merged S-03 (Environmental Order Entry) into main redesign FRS. See parent FRS change log.

---

## 1. Overview

The Sample Collection Redesign v2.0 decomposes the monolithic `AddOrder.js` form into four independently routable steps (Enter Order → Collect Sample → Label & Store → QA Review). In the original monolith the "Refer Out" workflow was embedded alongside result reporting; the v2.0 redesign inadvertently dropped it because the four-step decomposition was organized around the sample lifecycle, not the test lifecycle.

This addendum restores the existing OpenELIS **Refer Out** workflow into Step 3 (Label & Store). Referrals are assigned *after* samples have been collected and labeled — that is the point at which the tech knows which physical specimen is going where. The existing Refer Out module (referring lab config, `ReferralItem` entity, referred result entry, FHIR outbound referral) is reused without modification; this addendum only specifies the **UI placement**, the **order status transitions** that fire when samples are referred, and the **dashboard filters** that surface referred-out orders.

This addendum also does not re-specify the notification pipeline — **X-01 Referral-Out Notification** (v1.0) handles that, triggered by `ReferralItem.save()`. When the tech saves a referral per this spec, X-01 fires its notification.

### 1.1 Unit of referral — SAMPLE, not test

A referral operates on a **physical sample** (one tube/specimen/container). Once a sample is referred out, **every test assigned to that sample** goes with it — they share one physical object and cannot be in two laboratories at once.

This has three practical consequences:

1. **Partial referral = partial samples, not partial tests.** An order with partial referral is an order whose *samples* split across locations: some samples stay in-house (with all their tests), some go to an external lab (with all their tests). You cannot refer a subset of tests on a single sample and keep the rest in-house.
2. **If a tech needs to run some tests in-house and refer others for the same patient, they must collect multiple samples at Step 2** (e.g., two aliquots of blood). Each sample can then be routed independently.
3. **All-samples-referred → order is REFERRED_OUT.** Not all-tests — the count that matters is the count of active, non-voided samples.

This design intentionally diverges from how the original `ReferralItem` entity is structured in the legacy OpenELIS (which stores one referral per test). The UI enforces sample-level choices, but the backend still persists one `ReferralItem` per test for compatibility with existing referred-result-entry and reporting screens. See §4 Data Model.

### 1.2 What this addendum adds

| Area | New capability |
|------|----------------|
| Step 3 UI | Sample-centric table with a Refer Out column per sample; referral is a sample-level action — all tests on that sample inherit the referral |
| Step 3 integration | Refer Out UI rendered alongside the existing LBL-2 Print Labels and LBL-3 Storage Assignment sections — one unified step, not a separate screen |
| Step 3 bulk action | "Refer all in-house samples to Lab X" action |
| Order status | New `REFERRED_OUT` terminal status when **all active samples** on an order are referred |
| QA bypass rule | Fully-referred orders skip Step 4 QA and close on the in-house side |
| Partial referral | Order continues through Step 4 QA normally; only in-house samples' tests count toward completeness |
| Order Dashboard | Two new filters — "Has Referred Samples" (partial + full) and "Fully Referred Out" |
| Order Context Card | Adds a "Referred" chip with sample count when ≥1 sample is referred |

### 1.3 What this addendum does NOT change

- **Existing Refer Out module mechanics** — unchanged. This addendum reuses: the referring lab admin config, the `ReferralItem` entity, the FHIR ServiceRequest outbound referral pathway, and the referred-result-entry screen.
- **X-01 Notification pipeline** — unchanged. Saving a referral in Step 3 fires `REFERRAL_OUT` event as specified in X-01 v1.0 FR-01.
- **Step 1, Step 2, Step 4 forms** — unchanged by this addendum (Step 4 logic extended only by the auto-approve rule, no UI change).
- **Lab Unit Workflow Configuration** — Refer Out applies to Clinical, Environmental, and Both modes identically.
- **Permissions model** — uses existing Refer Out permission key (`Refer Out`) — no new permission.

---

## 2. User Stories

Appended to parent FRS §5.

- **US-26** — As a lab technician, after labeling a sample, I want to refer that physical specimen to an external lab (carrying all its tests with it) so the specimen and its referral are recorded together in a single step.
- **US-27** — As a lab technician, when the entire order is being sent out, I want to refer every in-house sample on the order to a single external lab with one action so I don't have to click through each sample.
- **US-28** — As a lab technician, when I need to run some tests in-house and refer others for the same patient, I want to collect the specimen as multiple samples (e.g., two aliquots) during Step 2 so each sample can be routed independently at Step 3.
- **US-29** — As a QA officer, I don't want orders where every sample has been referred externally to appear in my QA queue — there is no in-house testing to validate.
- **US-30** — As a lab manager, I want to see which orders have samples out at external labs so I can follow up with those labs if results are late.
- **US-31** — As a lab manager, I want to distinguish "some samples referred" from "all samples referred" on the dashboard so I can see which orders are still partially in-house.

---

## 3. Functional Requirements

### 3.1 Label & Store (Step 3) — Refer Out UI

Appended to parent FRS §6.4 (LBL-1 through LBL-4). Refer Out is rendered **within the existing Step 3 layout**, alongside the LBL-2 Print Labels section and the LBL-3 Storage Assignment — not as a separate screen or tab. The Samples List (LBL-1) gains a Refer Out column.

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **LBL-5** | **P0** | The Step 3 Samples List (parent LBL-1) MUST be rendered as a sample-centric table (one row per physical sample) with columns: Sample ID, Sample Type, Tests (list of test name chips), Storage Location (from LBL-3, editable inline), Label Actions (from LBL-2, inline Print button), **Refer Out** (new). The Refer Out column displays a Carbon Tag per sample: "In-house" (kind=`gray`, default), "Referred — [Lab Name]" (kind=`purple`), "Sent to External" (kind=`blue` — FHIR transmission acknowledged), or "Awaiting External Results" (kind=`blue` — external lab has received and accepted). | Table renders one row per sample. All columns visible. Tag state updates on referral save. |
| **LBL-6** | **P0** | Each sample row MUST provide a **Refer Out Sample** action (overflow menu or inline button). Selecting it expands an inline form below the row with: ReferringLab `ComboBox` (required, options from existing referring-lab admin config), Reason `TextArea` (optional, free text, max 500 chars), Expected Return Date `DatePicker` (optional), Notify Customer `Checkbox` (default checked if X-01 trigger is enabled; hidden otherwise), and a read-only preview listing the tests that will go with this sample: "This will refer {{sampleType}} ({{sampleId}}) and all {{testCount}} tests on it to {{labName}}: {{testList}}." Save and Cancel buttons on the expansion. | Row expands. All fields render. Preview lists all tests on the sample. Save persists one `ReferralItem` per test on the sample (see §4). Cancel collapses without save. Modal is NOT used for the per-sample case. |
| **LBL-7** | **P0** | A **Bulk Refer Out** button MUST appear in the Samples table toolbar. Clicking opens a Carbon `Modal` with: ReferringLab `ComboBox` (required), Reason `TextArea` (optional), Expected Return Date `DatePicker` (optional), Notify Customer `Checkbox`, and a preview list showing "This will refer {{sampleCount}} samples ({{testCount}} tests total) to {{labName}}: {{sampleList}}." Confirming refers every **in-house** sample on the order to the chosen lab; every test on each referred sample is carried over. Modal is justified because the action changes order-level status (see REF-2) and touches multiple samples at once. | Modal opens. Preview counts reflect unreferred samples and their tests. Confirm refers N samples and all tests on them in one transaction. Cancel closes without change. |
| **LBL-8** | **P0** | A sample that has ALREADY been referred MUST NOT be included in the Bulk Refer Out preview or action. The bulk action operates on remaining in-house samples only. If zero in-house samples remain, the Bulk Refer Out button is disabled with tooltip "No in-house samples to refer." | Bulk modal excludes referred samples. Button disabled when count = 0. |
| **LBL-9** | **P0** | After a referral is saved (per-sample LBL-6 or bulk LBL-7), the affected sample rows MUST update the Refer Out column Tag to "Referred — [Lab Name]" without a page reload. An `InlineNotification` (kind=`success`) MUST appear at the top of the Step 3 panel confirming "Referred {{sampleCount}} samples ({{testCount}} tests) to [Lab Name]." and MUST auto-dismiss after 5 seconds. | Rows update in place. Success notification appears and dismisses. |
| **LBL-10** | **P0** | Saving a referral MUST fire the existing X-01 `REFERRAL_OUT` event (X-01 FR-01) **once per sample** referred — because X-01 FR-02 specifies one event per referral record and the UI groups a sample's tests into one logical referral per sample per receiving lab. If the data model stores one `ReferralItem` per test (see §4), the backend MUST coalesce same-sample/same-receiving-lab referrals into a single X-01 event. | `REFERRAL_OUT` fires once per (sample × receiving lab) combination, not per test. |
| **LBL-11** | **P0** | A sample referral MAY be **undone** before the external lab acknowledges receipt. The row overflow menu includes an "Undo Referral" action when state is "Referred — [Lab Name]" and the referral has not yet moved to "Awaiting External Results". Undo voids every `ReferralItem` on that sample and emits no additional X-01 event. All tests on the sample return to the in-house pipeline. | Undo action present only in "Referred" state. Undo reverts sample Tag to "In-house" and restores all tests to in-house. |
| **LBL-12** | P1 | When FHIR outbound referral is configured for the selected referring lab, the system MUST transmit one FHIR `ServiceRequest` per sample (grouping all tests on the sample as `ServiceRequest.basedOn` entries) to the receiving lab **immediately** as part of the referral save transaction. No "Send now vs batch" choice is offered on the refer-out form. Transmission state is reflected in the sample row Tag: "Referred" = saved locally (brief, typically <1 s), "Sent to External" = FHIR transmission succeeded, "Awaiting External Results" = external lab acknowledged via FHIR `Task` response. If FHIR transmission fails, row shows kind=`red` Tag with "Send Failed — Retry" action; the local referral record is preserved so retry does not re-create `ReferralItem` rows. | One FHIR ServiceRequest sent per referred sample, synchronously with save. Failure state visible and retryable without duplicating referrals. |
| **LBL-13** | P1 | For non-FHIR referring labs (paper/manifest only), the sample row Tag transitions are: "In-house" → "Referred — [Lab Name]" → (stays; manual return when results are entered via existing referral-result-entry screen). No Send Failed state. | Paper-only labs do not attempt FHIR send. |
| **LBL-14** | **P0** | The existing LBL-2 Print Labels section and LBL-3 Storage Assignment MUST remain the primary Step 3 sections and sit alongside the sample table. Referral actions do NOT replace labeling or storage — a referred sample still needs a printed label (it travels with the specimen to the external lab) and a storage location (it is stored locally until pickup). After referral, the Storage Location field for that sample MAY remain editable (BR-REF-4) so the tech can move the physical specimen between fridges before pickup. | Print Labels section visible. Storage Assignment visible. Both remain functional for referred samples. |

### 3.2 Order Status Transitions — Auto-Complete on Full Referral

Appended to parent FRS §6.5 (QA-1 through QA-6) and §4.3 OrderContext.

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-1** | **P0** | The `orderStatus` enum (parent FRS §4.3) MUST add a new value: `REFERRED_OUT`. Semantics: every active (non-voided) sample on the order has an active referral. The order has no in-house testing to perform or validate. | Enum value present. Schema migration included. |
| **REF-2** | **P0** | When a referral save (LBL-6 or LBL-7) results in **all** active samples on the order being referred, the order `orderStatus` MUST transition from `LABELING` (or `QA_REVIEW` if already there) directly to `REFERRED_OUT`. Step 4 QA Review is bypassed — the QA officer does not see the order in their queue. The count that matters is the sample count, not the test count. | All-samples-referred save transitions status. Order disappears from QA queue. Audit trail records transition. |
| **REF-3** | **P0** | A `REFERRED_OUT` order is considered **closed on the in-house side** but remains **open on the referral side** until external results return via the existing referral-result-entry screen. The order does not appear in the QA queue, does not block dashboards, and does not require any further lab action until external results return. | Order not in QA queue. Order visible in "Fully Referred Out" dashboard filter. |
| **REF-4** | **P0** | When external results return for a **fully** `REFERRED_OUT` order (via existing referral-result-entry screen), the system MUST auto-transition the order to `APPROVED` once all `ReferralItem` rows are marked complete with results. The external lab's entry acts as the validating action — no in-house validator review is required. Audit trail records `APPROVED_BY = EXTERNAL:{{referringLabId}}` and `validated_at` = external result entry timestamp. Rationale: a `REFERRED_OUT` order has no in-house testing to validate; the external lab is the authoritative source. | External result entry on a `REFERRED_OUT` order transitions status to `APPROVED` automatically. Audit trail shows external validator identity. |
| **REF-4a** | **P0** | For **partially** referred orders (some samples in-house, some referred), the order MUST still require explicit in-house validator action before reaching `APPROVED` (unchanged in-house behavior). External results attach as read-only and feed into the validator's review, but the in-house validator remains the approver of record. | Partial-referral order requires validator action to reach APPROVED. External results visible in validator view. |
| **REF-5** | **P0** | For a **partially** referred order (at least one sample still in-house), the order continues through `LABELING` → `QA_REVIEW` → `APPROVED` normally. Tests on referred samples are excluded from Step 4 QA completeness checks — QA-1 (parent FRS §6.5) MUST treat tests on referred samples as "not applicable" (not red/yellow). | QA completeness excludes referred-sample tests. Mixed order transitions through QA normally. |
| **REF-6** | **P0** | Undoing a sample referral (LBL-11) that caused an order to enter `REFERRED_OUT` state MUST revert the order to `LABELING` (or the last pre-`REFERRED_OUT` status, read from the audit trail). The order re-enters the appropriate queue. | Undo on last-referred sample reverts status. Audit trail captures revert. |
| **REF-7** | P1 | If a `REFERRED_OUT` order has ALL its sample referrals voided (via LBL-11 on each), it reverts to the previous status (typically `LABELING`) and requires manual re-entry into QA. | Revert-all behavior correct. |

### 3.3 Order Context Card — Referred Chip

Appended to parent FRS §4.3 (Context card rendering).

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-8** | **P0** | When an order has ≥1 referred sample, the Order Context Card (NAV-5) MUST display a "Referred" Tag (kind=`purple`) with sample count, e.g. "Referred (2 of 4 samples)." For fully-referred orders the text reads "Referred (all samples)." Clicking the Tag anchors the page to the Step 3 sample table and scrolls the first referred row into view. | Chip displays with sample count. Clicking scrolls/anchors. Fully-referred label differs. |

### 3.4 Order Dashboard — Filters

Appended to parent FRS §6.9 (DSH-1 through DSH-9).

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **DSH-10** | **P0** | Dashboard Filters (DSH-7) MUST add a new filter: **Referred Out** with options: "Any" (default), "Has Referred Samples" (orders where ≥1 sample is referred — includes both partial and full), "Fully Referred Out" (orders where all active samples are referred — `orderStatus = REFERRED_OUT`). Filter combines with existing filters via AND. | Filter present. All three options work. Combines with other filters correctly. |
| **DSH-11** | **P0** | Dashboard table rows for orders matching "Has Referred Samples" or "Fully Referred Out" MUST show a Referred Tag (kind=`purple`) in the Status column alongside the primary status. Example row status: "Labeling" + "Referred (2 of 4 samples)" or "Referred Out" + "Referred (all samples)". | Status column renders both statuses. |
| **DSH-12** | P1 | Clicking a "Fully Referred Out" row MUST route to Step 3 (Label & Store) with the sample table anchored — not Step 4 QA, since there is no QA to perform. For partial referrals, clicking routes to the current step per existing DSH behavior. | Fully-referred click routes to Step 3. Partial click routes to current step. |
| **DSH-13** | **Deferred** | A top-of-dashboard "Awaiting External Results" badge is **out of scope for v2.1**. The DSH-10 filter (Has Referred Samples / Fully Referred Out) is sufficient follow-up triage for now. A dedicated Referred-Out dashboard is planned as a separate initiative; external-results tracking (TAT, stale threshold, pending badge) will be re-specified there. | Not implemented in v2.1. |

### 3.5 Lab Unit Configuration

| ID | Priority | Requirement | Testability |
|----|----------|-------------|-------------|
| **REF-9** | P1 | Refer Out at Label & Store MUST be available under all three workflow modes (Clinical, Environmental, Both). No per-mode gating. | Refer Out visible in all three modes. |
| ~~REF-10~~ | ~~Dropped~~ | *Dropped from v2.1 scope.* Bulk Refer Out (LBL-7) is always enabled for every lab unit. No `allowBulkReferOut` admin flag. If a future deployment needs per-sample-only workflow, file a follow-up. | — |

---

## 4. Data Model

The existing legacy `ReferralItem` entity in OpenELIS stores one referral row per test (analysis). This addendum preserves that schema — the backend creates one `ReferralItem` per test on the sample when a sample is referred. Conceptually the referral is sample-level; physically the table stores test-level rows so that existing referred-result-entry and reporting screens (which iterate `ReferralItem` by test/analysis) continue to work without change.

**Sample-level grouping is derived, not stored:**

| Derivation | Rule |
|-----------|------|
| "Sample is referred" | `EXISTS(SELECT 1 FROM referral_item ri JOIN analysis a ON ri.analysis_id = a.id WHERE a.sample_id = :sampleId AND ri.voided = false)` |
| "All tests on sample referred" | For the UI, an invariant holds: **every** test on a referred sample is also referred. Per-test partial referral within a sample is blocked at the UI and API layer. |
| "Fully referred out order" | All active (non-voided) samples on the order have all their tests referred. Materialized as `orderStatus = REFERRED_OUT`. |

**Backend invariant (enforced at service layer, not DB constraint for performance):** when a new `ReferralItem` is created for any test on a sample, the service MUST create `ReferralItem` rows for every other test on that same sample to the same receiving lab in the same transaction. When a `ReferralItem` is voided, all sibling `ReferralItem` rows for the same sample MUST be voided in the same transaction. This keeps the data model consistent with the sample-level UI constraint.

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
| `has_referred_samples` | `EXISTS(SELECT 1 FROM sample s JOIN analysis a ON a.sample_id = s.id JOIN referral_item ri ON ri.analysis_id = a.id WHERE s.sample_order_id = sample_order.id AND ri.voided = false)` |
| `fully_referred` | `orderStatus = 'REFERRED_OUT'` |
| `referred_sample_count` | `COUNT(DISTINCT s.id)` where sample s has at least one active (non-voided) `ReferralItem` |
| `total_sample_count` | `COUNT(DISTINCT s.id)` where sample s is not cancelled |

---

## 5. API Endpoints

No new endpoints. Extensions only:

| Endpoint | Change |
|----------|--------|
| `POST /rest/sample/{sampleId}/referral` | **New** (or extension of existing `/rest/referral`) — accepts `{ referringLabId, reason, expectedReturnDate, notifyCustomer }`. Server creates one `ReferralItem` per test on the sample, all pointing at the same receiving lab, in a single transaction. Returns `{ sampleId, createdReferralIds: [...], newOrderStatus: 'LABELING' \| 'REFERRED_OUT' }`. Emits one X-01 `REFERRAL_OUT` event (LBL-10 coalescing). |
| `POST /rest/order/{id}/referral/bulk` | **New** — accepts `{ referringLabId, reason, expectedReturnDate, notifyCustomer }`. Server calls the per-sample referral logic for every remaining in-house sample on the order in a single transaction. Returns `{ referredSampleIds: [...], createdReferralCount: N, newOrderStatus: 'LABELING' \| 'REFERRED_OUT' }`. Emits one X-01 event per sample. |
| `PUT /rest/sample/{sampleId}/referral/undo` | **New** — voids every `ReferralItem` on the sample and recomputes order status. Returns `{ newOrderStatus }`. Idempotent. |
| `GET /rest/order/search` | Existing dashboard search endpoint — add query params `hasReferredSamples=bool` and `fullyReferred=bool` for DSH-10. |

---

## 6. Business Rules

Appended to parent FRS §9.

| ID | Rule |
|----|------|
| **BR-REF-1** | An order's `orderStatus` transitions to `REFERRED_OUT` the moment the save that results in all active samples being referred completes — not on a scheduled job. Atomic with the save. |
| **BR-REF-2** | Voiding a sample referral MUST re-evaluate order status synchronously. If the last referred sample is voided, revert to the pre-`REFERRED_OUT` status from the audit log. If no audit log entry exists (edge case), revert to `LABELING`. |
| **BR-REF-3** | Tests on referred samples are excluded from Step 4 QA completeness checks (parent FRS QA-1). They show in the QA panel as a "Referred (external)" group per sample for informational context, not as incomplete. |
| **BR-REF-4** | A `REFERRED_OUT` order MUST still allow edit of storage location (LBL-3) and reprint of labels (LBL-2) for each sample in case the physical specimen is moved between refrigerators before external pickup or the label is damaged. All other sample-level Step 3 fields are read-only once referred. |
| **BR-REF-5** | A `REFERRED_OUT` order is treated as "closed" for in-house workload reports (TAT, productivity). It is treated as "open" for referral-pending-results reports. |
| **BR-REF-6** | Adding a new sample to an order that is currently `REFERRED_OUT` (via Edit Order workflow, parent FRS §6.8) MUST revert the order to `LABELING` — the new sample is in-house by default and requires the normal pipeline. |
| **BR-REF-7** | Per-test referral within a single sample MUST NOT be supported at the UI or API layer. If a tech needs mixed routing (some tests in-house, some external) for one patient, they must collect multiple samples at Step 2 first. The sample-collection step's "+ New Sample" action is the mechanism for this. |

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
| `label.sampleCollection.referOut.bulk.modalTitle` | Refer All In-House Samples to External Lab |
| `label.sampleCollection.referOut.bulk.preview` | This will refer {{sampleCount}} samples ({{testCount}} tests total) to {{labName}}. |
| `label.sampleCollection.referOut.perSample.preview` | This will refer {{sampleType}} ({{sampleId}}) and all {{testCount}} tests on it to {{labName}}. |
| `label.sampleCollection.referOut.form.referringLab` | Referring Lab |
| `label.sampleCollection.referOut.form.reason` | Reason (optional) |
| `label.sampleCollection.referOut.form.expectedReturn` | Expected Return Date |
| `label.sampleCollection.referOut.form.notifyCustomer` | Notify customer of referral |
| `label.sampleCollection.referOut.notification.success` | Referred {{sampleCount}} samples ({{testCount}} tests) to {{labName}}. |
| `label.sampleCollection.referOut.notification.fhirFailure` | FHIR transmission failed. Referral saved locally — retry send. |
| `label.sampleCollection.referOut.contextCard.referredPartial` | Referred ({{referredCount}} of {{totalCount}} samples) |
| `label.sampleCollection.referOut.contextCard.referredAll` | Referred (all samples) |
| `label.sampleCollection.referOut.status.fullyReferred` | Referred Out |
| `label.dashboard.filter.referredOut` | Referred Out |
| `label.dashboard.filter.referredOut.any` | Any |
| `label.dashboard.filter.referredOut.hasReferred` | Has Referred Samples |
| `label.dashboard.filter.referredOut.fullyReferred` | Fully Referred Out |
| `label.dashboard.badge.awaitingExternal` | Awaiting External Results ({{count}}) |
| `error.referOut.noReferringLab` | Select a referring lab before saving. |
| `error.referOut.bulkNoSamples` | No in-house samples to refer. All samples on this order are already referred. |
| `error.referOut.perTestBlocked` | This sample has multiple tests. Referring it sends every test with the specimen. To keep some tests in-house, collect a separate sample at Step 2 first. |

---

## 8. Validation Rules

Appended to parent FRS §11.

| ID | Rule |
|----|------|
| **VR-REF-1** | ReferringLab is required on the per-sample Refer Out form and on the Bulk Refer Out modal. Save disabled until populated. |
| **VR-REF-2** | Bulk Refer Out is disabled if `referred_sample_count == total_sample_count` (all active samples already referred). |
| **VR-REF-3** | Expected Return Date (if provided) MUST be in the future. Past dates rejected. |
| **VR-REF-4** | Reason text is limited to 500 characters. |
| **VR-REF-5** | Undo Referral is disabled once the referring lab has acknowledged receipt (FHIR `Task` response arrived). After acknowledgment, voiding requires an admin role (reuses existing Refer Out void permission). |
| **VR-REF-6** | Attempting to call `POST /rest/analysis/{id}/referral` (legacy per-test endpoint, if exposed) against an analysis whose sibling analyses on the same sample are not being referred MUST return 400 with `error.referOut.perTestBlocked`. Enforces BR-REF-7 at the API boundary. |

---

## 9. Security & Permissions

Appended to parent FRS §12.

| Permission | Scope |
|-----------|-------|
| **Refer Out** (existing) | Required to create a referral via LBL-6 or LBL-7. UI layer: hide Refer Out actions when permission is absent. API layer: `POST /rest/sample/{sampleId}/referral` and `POST /rest/order/{id}/referral/bulk` return 403 when caller lacks permission. |
| **Void Referral** (existing) | Required for LBL-11 Undo Referral. UI: action hidden when absent. API: `PUT /rest/sample/{sampleId}/referral/undo` returns 403. |
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

## 12. Open Questions — Resolved 2026-04-23

All open questions were resolved with the product owner during the v2.1 review:

- **OQ-1 (REF-4 scope) — RESOLVED:** For **fully** `REFERRED_OUT` orders, external result entry auto-transitions the order to `APPROVED` with the external lab recorded as the validating actor (see REF-4 above). For **partially** referred orders, explicit in-house validator action is still required (see REF-4a).
- **OQ-2 (LBL-12 FHIR send timing) — RESOLVED:** Immediate send on save. No "Send now vs batch" UI. LBL-12 updated accordingly.
- **OQ-3 (DSH-13 badge) — RESOLVED:** Dropped from v2.1. The DSH-10 filter is sufficient for now. A dedicated Referred-Out dashboard will be designed as a separate initiative and will re-specify external-results tracking (TAT, stale thresholds, pending counts).
- **OQ-4 (REF-10 allowBulkReferOut flag) — RESOLVED:** Dropped. Bulk Refer Out is always enabled for every lab unit. No admin flag.

## 13. Follow-ups (Out of Scope for v2.1)

- **Referred-Out dashboard (new initiative).** Dedicated dashboard for tracking external-results-pending orders, TAT per referring lab, stale thresholds, and follow-up triage. Replaces the deferred DSH-13 badge with a richer view. To be scoped separately.
- **External validator audit detail.** REF-4 records `APPROVED_BY = EXTERNAL:{{referringLabId}}`. A future enhancement MAY capture the external validator's individual identity (from FHIR `Practitioner` reference in the inbound result bundle) rather than just the lab.
