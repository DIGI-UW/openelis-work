# S-14 — Inter-Lab Transfer & Subcontract
## Addendum to existing OE Refer Out / Referral module
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** TBD (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Addendum to:** Existing OE Referral / Refer Out module
**Supersedes:** S-03c v1.0 (env/vector subcontract addendum) — merged here. The artificial split between "env/vector subcontract" and "general inter-lab transfer" was overdesign; both extend the same OE referral surface and are now one addendum. Generic to all order types.

---

## 1. Overview

OpenELIS already has a Refer Out module (sample selection, lab assignment, result entry) and a Referral dashboard. S-14 extends that module with three additions:

1. **Subcontract metadata panel** on the Refer Out screen — agreement reference, handoff datetime, expected return, chain-of-custody contact.
2. **Status workflow** — `DRAFT` → `DISPATCHED` → `RECEIVED` → `RESULTS_RETURNED` → `CLOSED`, with status visible on the order context card and the existing referral dashboard.
3. **Outbound notifications** — WhatsApp/email to the target lab and (configurably) the customer when status transitions to `DISPATCHED`. Reuses existing notification admin (Email + TextIt SMS).

Generic to all order types; the metadata panel applies whenever a referral is created. No new main-menu page; the existing Referral dashboard gains columns + a Subcontract-status filter.

## 2. Scope

**In scope:**
- Subcontract metadata fields on the Refer Out screen (agreement ref, handoff date/time, expected return, chain-of-custody contact name + phone)
- 5-state status workflow with status update actions
- Status badge on order context card
- Subcontract Status column + filter on existing Referral dashboard (DSH-equivalent)
- Outbound notification at `DISPATCHED` (target lab + optional customer)
- Audit log for status transitions
- Inbound referral registration flow — when a referral arrives from another OE instance via FHIR (see S-03 v2.0 §14), it appears in the Referral dashboard with origin metadata

**Out of scope:**
- New main-menu "Subcontract Register" page (DROPPED from S-03c v1.0 §3.3 — use existing referral dashboard with filter instead)
- Refer Out workflow mechanics (lab selection, test assignment, result entry) — unchanged
- Clinical Refer Out — same metadata panel applies to clinical too (it's generic)
- Notification authoring UI — reuses existing notification admin
- Payment / billing integration — covered by S-13 (deferred)

## 3. Functional Requirements

**FR-01 (Subcontract metadata panel).** When a Refer Out referral is saved, the Refer Out screen SHALL display a Subcontract Metadata panel with:

| Field | Type | Required | Notes |
|---|---|---|---|
| Agreement Reference | TextInput | No | e.g., "Subcontract Agreement #2026-INDO-LAB-09" |
| Handoff Date/Time | DateTimePicker | Yes | When samples physically left the lab |
| Expected Return Date | DatePicker | No | Used for outstanding-subcontract follow-up |
| Chain-of-Custody Contact (name) | TextInput | No | At the receiving lab |
| Chain-of-Custody Contact (phone) | TextInput | No | |
| Notes | TextArea | No | Max 500 chars |

**FR-02 (Status workflow).** Each referral has a `subcontractStatus`:
- `DRAFT` — referral created but not yet dispatched
- `DISPATCHED` — samples physically handed off (Handoff Date/Time recorded)
- `RECEIVED` — receiving lab confirmed receipt (manual entry by operator OR automatic when inbound FHIR Task moves to `accepted`)
- `RESULTS_RETURNED` — external results entered into the existing Refer Out result-entry screen
- `CLOSED` — operator closes the referral after results are validated

Each transition logged with actor + timestamp in `referral_status_history`.

**FR-03 (Order context card).** When an order has any referral with a non-CLOSED `subcontractStatus`, the order context card on Steps 2+ SHALL display a status badge: "Subcontract: {status}".

**FR-04 (Referral dashboard extension).** The existing Referral dashboard SHALL gain:
- A `Subcontract Status` column showing the latest status with a colored Tag
- A `Subcontract Status` filter (multi-select)
- An `Expected Return Date` column with a "Past Due" indicator when the date has passed and status is still `DISPATCHED`

**FR-05 (Outbound notification at DISPATCHED).** On transition to `DISPATCHED`, the system SHALL send:
- An email to the target lab's chain-of-custody contact with the agreement reference, handoff details, and a list of dispatched samples (LABNOs + types)
- A WhatsApp/SMS message to the customer (if customer notification preference is configured for the order's site) with a brief receipt-confirmation note

Both reuse the existing Notification Admin templates (X-01 — REFERRAL_OUT notification was the original event; this spec extends to fire on status transition rather than only at referral creation).

**FR-06 (Inbound FHIR referral registration).** When an inbound FHIR Bundle arrives (per S-03 v2.0 §14), and `Specimen.parent.identifier.system` indicates a known partner OE instance, the system creates an entry in the Referral dashboard's Inbound tab with:
- Source lab (from `ServiceRequest.requester`)
- Sender's LABNO
- Local LABNO assigned at intake
- FHIR Task ID for traceability
- Status: `RECEIVED` (already in our hands)

## 4. Data Model

```sql
ALTER TABLE referral ADD COLUMN agreement_reference VARCHAR(100);
ALTER TABLE referral ADD COLUMN handoff_datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE referral ADD COLUMN expected_return_date DATE;
ALTER TABLE referral ADD COLUMN coc_contact_name VARCHAR(100);
ALTER TABLE referral ADD COLUMN coc_contact_phone VARCHAR(50);
ALTER TABLE referral ADD COLUMN subcontract_notes TEXT;
ALTER TABLE referral ADD COLUMN subcontract_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE referral ADD COLUMN inbound_fhir_task_id VARCHAR(100);

CREATE TABLE referral_status_history (
  id BIGSERIAL PRIMARY KEY,
  referral_id BIGINT NOT NULL REFERENCES referral(id),
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by_user_id BIGINT NOT NULL REFERENCES user(id),
  changed_at TIMESTAMP NOT NULL,
  notes TEXT
);
CREATE INDEX idx_referral_substatus ON referral(subcontract_status);
CREATE INDEX idx_referral_expected_return ON referral(expected_return_date);
```

## 5. Acceptance Criteria

- [ ] Subcontract metadata panel renders on Refer Out for all order types
- [ ] 5-state status workflow with documented transitions
- [ ] Status badge visible on order context card when subcontract is open
- [ ] Existing Referral dashboard gains status column + filter + Expected Return column
- [ ] Outbound notification fires at DISPATCHED (email + WhatsApp/SMS)
- [ ] Inbound FHIR referrals register on the dashboard's Inbound tab
- [ ] Status transitions logged in `referral_status_history` with actor + timestamp
- [ ] No new main-menu pages introduced

## 6. Notes

- Significantly tighter than S-03c v1.0 + planned-S-14: dropped the standalone Subcontract Register page, generalized from env/vector to all order types, and consolidated the FHIR-inbound registration with the outbound flow.
- Reuses existing Notification Admin (X-01) — no new notification infra.
- "Subcontract" and "Inter-lab Transfer" are operationally the same surface; the title combines both for clarity.
