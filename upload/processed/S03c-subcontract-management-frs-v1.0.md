# S-03c — Subcontract Management
## Addendum to S-03: Environmental Order Entry Integration (OGC-537) and V-02: Vector Collection Workflow (OGC-581)
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft for Review
**Addendum to:** [S-03 FRS — Environmental Order Entry Integration](./S03-environmental-order-entry-frs-v1.0.md) / [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) and [V-02 FRS — Vector Collection Workflow](./V02-vector-collection-workflow-frs-v1.0.md) / [OGC-581](https://uwdigi.atlassian.net/browse/OGC-581)
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Source requirement:** Bogor requirements spreadsheet — Must Have, Phase 1: "Track samples sent to subcontract/external laboratories with handoff date, expected return, and subcontract status."

---

## 1. Overview

OpenELIS already supports referring specific tests to an external laboratory via the Refer Out module (sample selection, lab assignment, result entry). However, in environmental and vector testing contexts, sending samples to external contracted laboratories carries additional regulatory and operational requirements that the existing Refer Out module does not address:

- Formal subcontract agreements must be tracked (subcontract number / agreement reference)
- Handoff must be recorded precisely (date, time, chain of custody)
- Status must progress through a defined workflow visible to operators
- Environmental labs must demonstrate external lab compliance in their own audit trail (ISO 17025 §6.6 and §7.7)
- A consolidated subcontract log (across all active orders) is needed so supervisors can track outstanding external work without navigating individual orders

S-03c adds a **subcontract layer** on top of the existing Refer Out module: structured metadata fields attached to each referral record, a defined status workflow, and a new **Subcontract Register** — a dedicated list view showing all active and recent subcontracts across ENV and Vector orders.

### 1.1 What this addendum adds

| Area | New capability |
|------|----------------|
| Refer Out screen | Subcontract metadata panel (agreement reference, handoff datetime, expected return, chain-of-custody contact) — ENV/Vector orders only |
| Subcontract status workflow | Five-state status: `DRAFT` → `DISPATCHED` → `RECEIVED` → `RESULTS_RETURNED` → `CLOSED` |
| Order view — ENV/Vector context card | Subcontract status badge visible inline (alongside existing compliance standard context) |
| Subcontract Register | New main-menu item under "Referrals" — lists all ENV/Vector subcontracts with filter, pagination, and status update actions |
| Audit log | Each status transition is logged with actor + timestamp |
| i18n | 14 new localization keys |

### 1.2 What this addendum does NOT change

- The Refer Out workflow mechanics (lab selection, test assignment, result entry) — unchanged
- Clinical Refer Out — S-03c metadata panel applies to ENV and Vector orders only; it does not appear on clinical referrals
- The existing referral result entry flow — unchanged; result entry occurs through the existing Refer Out result entry screen
- X-01 (REFERRAL_OUT notification) — S-03c status transitions do not re-fire REFERRAL_OUT; the notification fires once at referral creation only

---

## 2. User Stories

- **US-01** — As an environmental lab technician, I want to record the subcontract agreement reference and handoff details when I send a sample to an external lab so that we have a documented chain of custody for ISO 17025 compliance.
- **US-02** — As a lab supervisor, I want to see all outstanding subcontracts in one place so that I can follow up with external labs before expected return dates are exceeded.
- **US-03** — As a QA officer, I want to mark a subcontract as "Results Returned" when results arrive so that the order's audit trail accurately reflects when external data became available.
- **US-04** — As an environmental analyst, I want to see the current subcontract status on my order summary so that I know whether to expect results from the external lab or if they have already been entered.

---

## 3. Functional Requirements

### 3.1 Subcontract Metadata Panel — Refer Out Screen

**FR-01** — When a Refer Out referral is saved for an **ENV or Vector order**, the system MUST display a **Subcontract Metadata** collapsible panel in the Refer Out screen, below the standard referral fields (external lab selection, test assignment). The panel contains:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Agreement Reference | TextInput | No | Subcontract number, MOU reference, or agreement code. Max 60 chars. |
| Handoff Date / Time | DateTimePicker | **Yes** | Date and time the sample was physically handed off to the external lab or courier. Defaults to current datetime. |
| Expected Return Date | DatePicker | **Yes** | Expected date for results to be returned. Must be ≥ Handoff Date. |
| Chain-of-Custody Contact | TextInput | No | Name of the individual who accepted custody at the external lab or courier. Max 80 chars. |
| Notes | TextArea | No | Free text notes for the handoff. Max 500 chars. |

**FR-02** — The Subcontract Metadata panel MUST appear only on ENV and Vector orders. It MUST NOT appear on clinical Refer Out referrals. Order type is determined by the `sampleDomain` value on the order (OGC-296).

**FR-03** — The **Handoff Date/Time** and **Expected Return Date** fields MUST be required when the panel is visible. The Refer Out Save action MUST be blocked if either field is blank, displaying:
- `t('subcontract.handoffDate.required', 'Handoff date and time are required.')`
- `t('subcontract.expectedReturn.required', 'Expected return date is required.')`

**FR-04** — The **Expected Return Date** MUST be validated at both the UI and API layers:
- Must be ≥ Handoff Date. Error: `t('subcontract.expectedReturn.beforeHandoff', 'Expected return date must be on or after the handoff date.')`

**FR-05** — The **Subcontract Status** is not editable in the Refer Out metadata panel. It is set to `DISPATCHED` automatically when the referral with subcontract metadata is first saved. The status can only be advanced via the Subcontract Register (§3.3) or the Order context card (§3.2).

### 3.2 Order View — Subcontract Status Badge

**FR-06** — The ENV/Vector order context card (Step 1–4 side panel and order view) MUST display a **Subcontract Status** badge for each referral that has subcontract metadata:

| Status | Badge colour | Label |
|--------|-------------|-------|
| `DISPATCHED` | Blue | Dispatched |
| `RECEIVED` | Teal | Received by External Lab |
| `RESULTS_RETURNED` | Green | Results Returned |
| `CLOSED` | Gray | Closed |

**FR-07** — If an order has multiple referrals (to different external labs), each referral shows its own badge. The most critical status (furthest from `CLOSED`) is surfaced in the order summary view.

### 3.3 Subcontract Status Workflow

**FR-08** — The subcontract status follows a five-state linear workflow:

```
DRAFT → DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED
```

| Transition | Who can trigger | How |
|-----------|-----------------|-----|
| `DRAFT` → `DISPATCHED` | System | Automatically on Refer Out save (with subcontract metadata) |
| `DISPATCHED` → `RECEIVED` | Lab staff with `referral.update` permission | Manual — via Subcontract Register or order context card action |
| `RECEIVED` → `RESULTS_RETURNED` | Lab staff with `referral.update` permission | Manual — typically triggered after results are entered via Refer Out result entry |
| `RESULTS_RETURNED` → `CLOSED` | Lab supervisor with `referral.close` permission | Manual — indicates review complete and audit trail finalised |
| Any status → `CLOSED` | Lab supervisor with `referral.close` permission | Force-close allowed (e.g., cancelled subcontract) |

**FR-09** — Each status transition MUST be written to an **audit log** record containing: subcontract ID, from-status, to-status, actor (user ID + display name), and timestamp.

**FR-10** — `DRAFT` status is only used internally when subcontract metadata fields are partially completed but not yet saved. It is never surfaced in the UI as a visible status.

### 3.4 Subcontract Register

**FR-11** — A **Subcontract Register** MUST be added as a new page under the existing **Referrals** section of the main navigation (alongside the existing Refer Out list and Refer In list). Navigation path: Referrals → Subcontract Register.

**FR-12** — The Subcontract Register MUST display a DataTable (Carbon) with the following columns:

| Column | Description |
|--------|-------------|
| Order ID | Accession number — links to the order |
| External Lab | Name of the external laboratory |
| Tests | Comma-separated list of referred test names |
| Agreement Ref | Subcontract agreement reference (blank if not set) |
| Handoff | Handoff date (formatted per lab locale) |
| Expected Return | Expected return date; highlighted amber if within 3 days of today; red if overdue |
| Status | Status badge (see FR-06) |
| Actions | Advance Status button; View Details link |

**FR-13** — The register MUST support the following filters:
- Status (multi-select: Dispatched, Received, Results Returned, Closed; default: all except Closed)
- External Lab (typeahead search)
- Date range for Handoff date
- Date range for Expected Return date

**FR-14** — The register MUST support pagination (Carbon Pagination; default 10 per page; options: 10, 25, 50).

**FR-15** — The **Advance Status** action on a row opens a confirmation modal displaying: current status, proposed next status, subcontract details (order ID, external lab, tests, handoff, expected return). The actor must confirm before the transition is applied.

**FR-16** — The register MUST be accessible to users with `referral.view` permission. The Advance Status action requires `referral.update`. The force-close action requires `referral.close`.

### 3.5 Overdue Alert

**FR-17** — Any subcontract where today's date exceeds the **Expected Return Date** and the status is still `DISPATCHED` or `RECEIVED` MUST be highlighted in the Subcontract Register with a red row background and an `OVERDUE` tag. No automated notification is sent (notification handling is out of scope for v1.0; may be addressed in a future addendum).

---

## 4. Data Model

The `referral_item` table (existing) gains new columns to hold subcontract metadata:

```sql
ALTER TABLE referral_item
  ADD COLUMN subcontract_agreement_ref  VARCHAR(60)   NULL,
  ADD COLUMN subcontract_handoff_at     TIMESTAMP     NULL,
  ADD COLUMN subcontract_expected_return DATE          NULL,
  ADD COLUMN subcontract_coc_contact    VARCHAR(80)   NULL,
  ADD COLUMN subcontract_notes          VARCHAR(500)  NULL,
  ADD COLUMN subcontract_status         VARCHAR(20)   NULL
        CHECK (subcontract_status IN (
          'DRAFT', 'DISPATCHED', 'RECEIVED', 'RESULTS_RETURNED', 'CLOSED'
        ));
```

New audit log table:

```sql
CREATE TABLE subcontract_status_log (
  id                  BIGSERIAL PRIMARY KEY,
  referral_item_id    BIGINT        NOT NULL REFERENCES referral_item(id),
  from_status         VARCHAR(20)   NOT NULL,
  to_status           VARCHAR(20)   NOT NULL,
  actor_user_id       BIGINT        NOT NULL REFERENCES system_user(id),
  transitioned_at     TIMESTAMP     NOT NULL DEFAULT now(),
  notes               VARCHAR(500)
);
```

---

## 5. API Changes

No new entities — extends the existing referral endpoints.

**`POST /api/v1/referrals` and `PATCH /api/v1/referrals/{id}`** request bodies gain:

```json
{
  "subcontract": {
    "agreementRef": "SUB-2026-041",
    "handoffAt": "2026-04-20T09:00:00",
    "expectedReturn": "2026-04-27",
    "cocContact": "Budi Santoso",
    "notes": "Handed off to courier at BLHD front desk"
  }
}
```

**`PATCH /api/v1/referrals/{id}/subcontract-status`** — advance or force-close subcontract status:

```json
{ "toStatus": "RECEIVED", "notes": "Confirmed received by Dr. Wati at Pusat Lab" }
```
Returns HTTP 200 with updated referral object, or HTTP 422 if the transition is invalid.

**`GET /api/v1/subcontracts`** — new list endpoint powering the Subcontract Register:

Query params: `status`, `externalLab`, `handoffFrom`, `handoffTo`, `returnFrom`, `returnTo`, `page`, `pageSize`.

---

## 6. UI Changes

### 6.1 Refer Out Screen — Subcontract Metadata Panel

Collapsible `Accordion` (Carbon) labelled **"Subcontract Details"** inserted below the standard Refer Out test assignment section. Expanded by default when creating a new referral on an ENV/Vector order. Contains the fields defined in FR-01.

### 6.2 Order Context Card — Status Badges

Existing context card (Step 1–4 side panel) gains a **"Subcontracts"** row if any referrals on the order have subcontract metadata. Each referral shows its status badge inline.

### 6.3 Subcontract Register — New Page

Standard Carbon DataTable page. Filters in a row above the table (consistent with other OpenELIS list pages). Overdue rows use `bx--table-row--error` styling pattern. Pagination below the table.

### 6.4 Navigation Addition

Under **Referrals** in the left nav: add "Subcontract Register" item after "Refer In" and before any existing pending/completed items. Uses `DocumentMultiple_01` icon from `@carbon/icons-react`.

---

## 7. Business Rules

**BR-01** — Subcontract metadata is only collected for **ENV and Vector** orders. Clinical orders use the standard Refer Out flow without subcontract tracking.

**BR-02** — A referral on an ENV/Vector order is not required to have subcontract metadata. Labs may use Refer Out without subcontracting if the referral is to an affiliate or internal sister lab.

**BR-03** — Subcontract status does not gate result entry. Results can be entered via Refer Out result entry regardless of subcontract status.

**BR-04** — An `OVERDUE` marker is computed at display time based on `subcontract_expected_return` vs. today's date. It is not stored as a separate status.

**BR-05** — Force-closing a subcontract (`referral.close` permission required) is permitted regardless of current status. A notes field is mandatory on force-close to capture the reason.

---

## 8. Localization

| i18n Key | English Fallback |
|----------|-----------------|
| `subcontract.panel.title` | Subcontract Details |
| `subcontract.agreementRef.label` | Agreement Reference |
| `subcontract.agreementRef.placeholder` | e.g. SUB-2026-041 |
| `subcontract.handoffAt.label` | Handoff Date & Time |
| `subcontract.handoffAt.required` | Handoff date and time are required. |
| `subcontract.expectedReturn.label` | Expected Return Date |
| `subcontract.expectedReturn.required` | Expected return date is required. |
| `subcontract.expectedReturn.beforeHandoff` | Expected return date must be on or after the handoff date. |
| `subcontract.cocContact.label` | Chain-of-Custody Contact |
| `subcontract.notes.label` | Handoff Notes |
| `subcontract.status.dispatched` | Dispatched |
| `subcontract.status.received` | Received by External Lab |
| `subcontract.status.resultsReturned` | Results Returned |
| `subcontract.status.closed` | Closed |
| `subcontract.register.title` | Subcontract Register |
| `subcontract.overdue` | Overdue |
| `subcontract.advanceStatus.confirm` | Confirm status transition |

---

## 9. Security & Permissions

| Action | Required Permission |
|--------|-------------------|
| View subcontract metadata on Refer Out | `referral.view` (existing) |
| Enter / edit subcontract metadata | `referral.update` (existing) |
| View Subcontract Register | `referral.view` |
| Advance subcontract status | `referral.update` |
| Force-close subcontract | `referral.close` (new permission key — see below) |
| View audit log | `referral.view` |

**New permission key:** `referral.close` — assigned to Lab Supervisor and Lab Admin roles by default. Allows force-close of any subcontract status.

---

## 10. Acceptance Criteria

**Refer Out — Subcontract Metadata Panel:**
- [ ] Panel appears on ENV/Vector Refer Out, hidden on clinical Refer Out
- [ ] Handoff Date/Time and Expected Return Date are required; form cannot be saved without them
- [ ] Expected Return Date must be ≥ Handoff Date; violation shows validation error
- [ ] Agreement Reference, COC Contact, and Notes are optional free-text fields
- [ ] Saving the referral sets subcontract status to `DISPATCHED` automatically

**Order Context Card:**
- [ ] Subcontracts row appears on ENV/Vector order context card if any referrals have subcontract metadata
- [ ] Each referral's status badge is displayed with correct colour coding
- [ ] If Expected Return Date is overdue, badge shows `OVERDUE` tag alongside the status badge

**Subcontract Register:**
- [ ] New page accessible under Referrals navigation
- [ ] DataTable shows all columns: Order ID, External Lab, Tests, Agreement Ref, Handoff, Expected Return, Status, Actions
- [ ] Overdue rows are visually highlighted (red background + OVERDUE tag)
- [ ] Status filter defaults to all except Closed
- [ ] Advance Status button opens confirmation modal with current + next status
- [ ] Confirming the modal advances the status; cancelling does nothing
- [ ] Pagination works; default page size is 10

**Status Workflow:**
- [ ] Status transitions follow the defined workflow (DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED)
- [ ] Force-close requires `referral.close` permission and mandatory notes field
- [ ] Each transition is recorded in `subcontract_status_log` with actor and timestamp

**Data / API:**
- [ ] `subcontract_*` columns are stored on `referral_item`
- [ ] `PATCH /api/v1/referrals/{id}/subcontract-status` returns 422 for invalid transitions
- [ ] `GET /api/v1/subcontracts` filters by status, external lab, and date range
- [ ] API enforces: `subcontract_expected_return >= DATE(subcontract_handoff_at)`

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-03 §5.x (Refer Out) | Parent — S-03c extends the referral entity in the ENV order context |
| V-02 (Vector Collection Workflow) | Parent — S-03c applies equally to Vector orders |
| OGC-296 (`sampleDomain`) | Gate — `sampleDomain` determines whether the subcontract panel is shown |
| X-01 (REFERRAL_OUT notification) | Sibling — notification fires on referral creation; S-03c status changes do not re-fire it |
| Existing `referral_item` table | Extended with 6 new columns; no breaking changes |
| ISO 17025:2017 §6.6 (Externally provided products) | Regulatory driver — external lab selection and qualification tracking |
| ISO 17025:2017 §7.7 (Ensuring validity of results) | Regulatory driver — chain-of-custody records for externally analysed samples |
