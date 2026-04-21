# X-01 — Referral-Out Notification
## Addendum to Existing Referral Out Module
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft for Review
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Addendum to:** Existing Referral Out module (OpenELIS core)
**Prerequisites:** [OGC-437](https://uwdigi.atlassian.net/browse/OGC-437) (TextIt SMS) + [OGC-439](https://uwdigi.atlassian.net/browse/OGC-439) (Email/SMTP) must be deployed
**Source requirement:** OGC-527 Layer 4 gap spec — inter-lab transfer notification for ENV/Vector workflows

---

## 1. Overview

OpenELIS already supports referring specific tests on an order to an external laboratory ("Refer Out"). The referral mechanics — selecting the external lab, assigning tests, recording the referral, entering referred results — are fully implemented in the existing module.

X-01 adds a single missing capability: a **configurable notification** sent to the ordering customer (and optionally the submitting user) when a referral is created. This lets the customer know their sample has been forwarded to another laboratory for testing, who to contact for updates, and what to expect.

X-01 extends the same OGC-437/OGC-439 notification infrastructure used by S-06b (`LH_COMPLETED` trigger). It adds one new event type (`REFERRAL_OUT`), one new toggle in the notification admin configuration, and a referral-specific notification template.

### 1.1 What this addendum adds

| Area | New capability |
|------|----------------|
| Notification trigger | New `REFERRAL_OUT` event fires when a referral is saved in the Refer Out workflow |
| Admin config toggle | Enable/disable referral-out notification globally, with per-lab-unit override |
| Notification template | Referral-specific template with merge fields for referred lab, tests, and expected turnaround |
| Recipient config | `ORDERING_PROVIDER` (customer contact) + optional `SUBMITTING_USER` (internal staff) |
| Channels | Email and/or WhatsApp via existing OGC-437/OGC-439 dispatch pipeline |
| Sent Messages tab | Referral notifications appear in the existing S-06b global Sent Messages tab |

### 1.2 What this addendum does NOT change

- The Refer Out workflow mechanics — unchanged (lab selection, test assignment, result entry)
- The notification infrastructure (OGC-437 SMS dispatch, OGC-439 Email/SMTP) — unchanged
- The Combined Triggers admin page — extended with one new row, not redesigned
- The Combined Templates admin page — extended with one new template type, not redesigned
- Clinical referral workflow — X-01 applies to all orders (ENV and clinical) wherever Refer Out is used; it is not ENV-only

---

## 2. User Stories

- **US-01** — As a lab manager, I want to enable automatic customer notification when a sample is referred to an external lab so that customers are not left waiting without knowing their sample has moved.
- **US-02** — As an environmental analyst, I want to receive a message when my submitted sample is referred to another lab so that I know who to contact for status updates on that test.
- **US-03** — As a system administrator, I want to configure the referral-out notification independently of the LH delivery notification so that I can enable it for relevant lab units without changing other notification behavior.

---

## 3. Functional Requirements

### 3.1 Notification Trigger

**FR-01** — The system MUST fire a `REFERRAL_OUT` event when a referral record is saved for an order (the moment the lab clicks Save/Confirm on the Refer Out screen). This event is distinct from `LH_COMPLETED` and fires independently of result validation.

**FR-02** — If a single order has multiple referrals to different external labs (different tests referred to different labs), each saved referral MUST fire a separate `REFERRAL_OUT` event. Notifications are per-referral, not per-order.

**FR-03** — The `REFERRAL_OUT` event MUST be processed through the same async dispatch queue as `LH_COMPLETED` (OGC-437 §3.2) with the same 3× retry and delivery logging behavior.

### 3.2 Admin Configuration

**FR-04** — The **Combined Triggers Page** (OGC-439 §4.1) MUST display a new row for `REFERRAL_OUT` alongside the existing `LH_COMPLETED` row. The row contains:

| Column | Value |
|--------|-------|
| Trigger | Referral Out |
| Event | `REFERRAL_OUT` |
| Enabled | Toggle (default OFF) |
| Channels | Multi-select: Email, WhatsApp |
| Recipients | Multi-select: Ordering Provider, Submitting User |

**FR-05** — The toggle MUST default to **OFF** globally. Labs must explicitly enable referral-out notification. This prevents unexpected notification behavior in labs that were not expecting it.

**FR-06** — The system MUST support a **per-lab-unit override**: if a lab unit has a specific configuration, it overrides the global toggle. This allows enabling notification for ENV lab units only, without affecting clinical units.

**FR-07** — Recipient types for `REFERRAL_OUT`:

| Recipient Type | Resolution |
|---------------|-----------|
| `ORDERING_PROVIDER` | Resolves to the customer contact on the order (same resolution logic as S-06b §3.2 FR-05/06) — email address and/or phone from the order's ordering provider record |
| `SUBMITTING_USER` | Resolves to the OpenELIS user who created/submitted the order — email from user profile |

Both recipient types MAY be selected simultaneously. If `ORDERING_PROVIDER` has no contact information on the order, that channel is skipped silently (same behavior as S-06b FR-07).

### 3.3 Notification Template

**FR-08** — The **Combined Templates Page** (OGC-439 §4.2) MUST display a new template entry for `REFERRAL_OUT`. The template is user-authored free text (same as S-06b §3.3) with the following merge fields available:

| Merge Field | Value |
|------------|-------|
| `{{order_id}}` | Order accession number |
| `{{sample_id}}` | Sample/specimen ID (lab number) |
| `{{referred_lab}}` | Name of the external laboratory receiving the referral |
| `{{referred_tests}}` | Comma-separated list of test names in this referral |
| `{{referral_date}}` | Date the referral was created (formatted per lab locale) |
| `{{expected_return}}` | Expected result return date, if entered (blank if not set) |
| `{{lab_name}}` | Sending laboratory's name |
| `{{lab_phone}}` | Sending laboratory's contact phone |

**FR-09** — A default template MUST be seeded on installation (or first enable of the trigger):

> *"Your sample [{{sample_id}}] has been referred to {{referred_lab}} for the following tests: {{referred_tests}}. Referral date: {{referral_date}}. Expected results by: {{expected_return}}. For inquiries, contact {{lab_name}} at {{lab_phone}}."*

The default template is editable. Labs should localise it for their language.

**FR-10** — Template body is user-authored free text and is NOT subject to i18n key management. UI chrome labels (field names, section headers) use i18n keys per §7.

### 3.4 Delivery Tracking

**FR-11** — All `REFERRAL_OUT` notification attempts MUST be logged in the same delivery log as `LH_COMPLETED` (OGC-437 `SmsDeliveryLog` / OGC-439 email log). The `event_type` column stores `REFERRAL_OUT`.

**FR-12** — Referral-out notifications MUST appear in the **Sent Messages tab** (S-06b §6.1) with Type = "Referral Out". The Reference column links to the order.

---

## 4. Data Model

No new tables. Two new rows in the existing `notification_trigger_config` table:

```sql
INSERT INTO notification_trigger_config (event_type, enabled, channels, recipients)
VALUES ('REFERRAL_OUT', false, '[]', '["ORDERING_PROVIDER"]');
```

One new row in `notification_template`:
```sql
INSERT INTO notification_template (event_type, channel, locale, body)
VALUES ('REFERRAL_OUT', 'SMS', 'default', 'Your sample {{sample_id}} has been referred to {{referred_lab}} for: {{referred_tests}}. Referral date: {{referral_date}}. Contact {{lab_name}} at {{lab_phone}}.');
```

The existing `ReferralItem` entity (or equivalent) needs no changes — the `REFERRAL_OUT` event fires on `ReferralItem.save()` using the existing referral ID and order context.

---

## 5. API Changes

No new endpoints. The existing notification dispatch endpoint accepts the `REFERRAL_OUT` event type once added to the `NotificationEventType` enum.

---

## 6. UI Changes

### 6.1 Combined Triggers Page — new row

One new row added to the triggers DataTable (see FR-04). No layout changes.

### 6.2 Combined Templates Page — new template type

One new template entry selectable under event type = "Referral Out". Reuses the existing template editor form.

### 6.3 Sent Messages tab — new Type value

The Type column in the Sent Messages DataTable (S-06b) adds "Referral Out" as a selectable filter value. No structural changes to the tab.

---

## 7. Localization

| i18n Key | English Fallback |
|----------|-----------------|
| `notification.trigger.referralOut` | Referral Out |
| `notification.trigger.referralOut.description` | Notify customer when a sample is referred to an external laboratory |
| `notification.template.referralOut.defaultBody` | *(seeded as default template — user-editable, not i18n-managed)* |
| `sentMessages.type.referralOut` | Referral Out |

---

## 8. Security & Permissions

No new permission keys. The existing notification admin permissions (from OGC-437/OGC-439) gate access to the Combined Triggers and Templates pages. The `REFERRAL_OUT` trigger row is managed under the same permissions as `LH_COMPLETED`.

---

## 9. Acceptance Criteria

**Admin configuration:**
- [ ] `REFERRAL_OUT` row appears in Combined Triggers Page alongside `LH_COMPLETED`
- [ ] Toggle defaults to OFF; enabling it activates the notification pipeline
- [ ] Per-lab-unit override is configurable
- [ ] Recipient types: Ordering Provider and Submitting User are selectable
- [ ] Channel options: Email and WhatsApp are selectable
- [ ] Default template is seeded and editable in Combined Templates Page

**Notification behavior:**
- [ ] Saving a referral fires the `REFERRAL_OUT` event (when trigger is enabled)
- [ ] Notification is dispatched to the configured recipients via configured channels
- [ ] If an order has multiple referrals, each referral fires a separate notification
- [ ] Merge fields resolve correctly: `{{referred_lab}}`, `{{referred_tests}}`, `{{referral_date}}`, `{{expected_return}}`
- [ ] If `ORDERING_PROVIDER` has no contact info, the notification is silently skipped for that recipient (no error)
- [ ] 3× retry behavior applies on dispatch failure

**Delivery tracking:**
- [ ] Notification appears in Sent Messages tab with Type = "Referral Out"
- [ ] Delivery log records attempt, channel, status, and timestamp
- [ ] Failed deliveries are visible and can be resent from Sent Messages tab

---

## 10. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| OGC-437 (TextIt SMS) | Hard prerequisite — SMS dispatch pipeline must be deployed |
| OGC-439 (Email/SMTP) | Hard prerequisite — Email dispatch pipeline must be deployed |
| S-06b (LH Delivery / Sent Messages) | Sent Messages tab is S-06b's deliverable — X-01 adds a new row type to it |
| Existing Referral Out module | X-01 hooks into `ReferralItem.save()` — no changes to referral mechanics |
| `NotificationEventType` enum | Needs `REFERRAL_OUT` added as a new value |
