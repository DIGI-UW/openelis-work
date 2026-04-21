# S-06b — LH Delivery Notification
## Addendum to S-06: Laporan Hasil (OGC-552)
### Functional Requirements Specification — v1.0

**Version:** 1.0  
**Date:** 2026-04-20  
**Status:** Draft for Review  
**Addendum to:** [S-06 FRS — Laporan Hasil Compliance Report](./S06-laporan-hasil-compliance-report-frs-v1.0.md) / [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552)  
**Built on top of:** [OGC-439 — Email Notification Integration](https://uwdigi.atlassian.net/browse/OGC-439) · [OGC-437 — SMS/TextIt Notification Integration](https://uwdigi.atlassian.net/browse/OGC-437)  
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)  
**Source requirement:** Bogor requirements spreadsheet (Tab 3 — Modul Lingkungan, Tab 4 — Vector & BPP Module): "Document Download — Customer downloads digitally signed LH via email/WhatsApp link. Must Have, Phase 1. Note: Notification/mark if email is not successfully delivered."

---

## 1. Overview

This addendum extends S-06 to cover the **post-signature delivery step**: once a Laporan Hasil (LH) PDF has been digitally signed and its status transitions to `COMPLETED`, the system automatically sends the customer a notification (email and/or WhatsApp) containing a secure, time-limited download link to retrieve their certificate.

S-06 v1.0 explicitly deferred this as Non-Goal §3.2.3 ("Email/distribution workflow — future enhancement"). This addendum fulfils that deferral.

### 1.1 Relationship to OGC-437 and OGC-439

**S-06b is an extension to the notification infrastructure designed in OGC-437 (SMS/TextIt) and OGC-439 (Email/SMTP), not a parallel system.** Those stories define the channel providers, async dispatch queue, delivery log schema, retry mechanism, admin config pages, and template management UI. S-06b depends on that infrastructure being in place and adds only the pieces specific to ENV/Vector LH delivery:

| Delta item | Why OGC-437/439 do not cover it |
|---|---|
| **`LH_COMPLETED` trigger event** | OGC-437/439 fire on *clinical final validation*. ENV/Vector has a separate LH signing/completion event not wired to those triggers. |
| **`CUSTOMER` recipient type** | Existing types are `ORDERING_PROVIDER`, `PATIENT`, `MANUAL`. ENV/Vector orders have a *customer* (company or individual), not a patient. Resolution must pull contact from order customer fields. |
| **Secure download token + public endpoint** | OGC-437/439 send result summaries, not file download links. S-06b adds `lh_download_token`, `GET /lh/download?token=` (no auth), TTL, and rate limiting. |
| **`{{lh_download_link}}` merge field** | New merge field rendering the token URL into the message body. |
| **Delivery status column on LH list** | OGC-437/439 do not surface delivery status in any result-facing UI. S-06b adds the `delivery_status` field and Carbon Tag column to the LH DataTable. |
| **Resend action on LH list page** | OGC-437/439 have no staff-facing resend UI. S-06b adds overflow-menu Resend directly on the LH list with a 10-min server-side cooldown. |
| **Bilingual template (Indonesian + English)** | OGC-437/439 support per-trigger templates but do not mandate bilingual output. ENV customer email must carry both Indonesian and English content. |

**Implementation dependency:** OGC-437 and OGC-439 MUST be implemented (or at minimum the channel infrastructure and delivery log schema must be merged) before S-06b development begins.

### 1.2 Summary of additions in this addendum

| Area | New capability |
|------|---------------|
| Notification trigger | Automatic send on LH status → `COMPLETED` (new event type) |
| Recipient | `CUSTOMER` recipient type resolving contact from order fields |
| Channels | Email (OGC-439 SMTP) + WhatsApp (OGC-437 TextIt) |
| Secure download link | Time-limited token URL; no login required |
| Download merge field | `{{lh_download_link}}` available in email/WhatsApp templates |
| Delivery tracking | Per-LH delivery status on `laporan_hasil`: `PENDING` → `SENT` / `FAILED` |
| Failure visibility | Staff see failed delivery prominently; can resend manually |
| Manual resend | Overflow-menu resend from the Laporan Hasil list page |
| Audit trail | All send attempts via shared `DeliveryLog` pattern; token access log separate |

### 1.3 What this addendum does NOT change

- PDF generation, certificate structure, e-signature flow — unchanged (S-06 §5.3–§5.4)
- Batch download ZIP — unchanged (S-06 §5.5)
- Report numbering — unchanged (S-06 §5.2.4)
- Any existing S-06 acceptance criteria — remain valid
- OGC-437/439 channel infrastructure, admin config pages, template editor — unchanged

---

## 2. User Stories

- **US-01** — As a validator, I want the system to automatically notify the customer by email and WhatsApp when I sign the LH, so that customers receive their results promptly without requiring manual distribution.
- **US-02** — As a lab officer, I want to see at a glance which LH reports have been successfully delivered and which have failed, so I can follow up on failed deliveries before a customer calls asking for their report.
- **US-03** — As a lab officer, I want to resend a delivery notification with a single click when the original delivery failed or the customer requests a resend, so that I do not need to manually create and send download links.
- **US-04** — As a customer, I want to receive a direct download link for my signed certificate that works without logging into any system, so that I can retrieve my results from any device.
- **US-05** — As a lab administrator, I want the system to mark any delivery attempt that fails (bounced email, undeliverable WhatsApp) clearly so that no report goes undelivered silently.

---

## 3. Functional Requirements

### 3.1 Notification Trigger

**FR-01** — When an LH record transitions to status `COMPLETED` (digital signature applied, LH released), the system MUST enqueue a delivery notification job using the existing OGC-437/OGC-439 async dispatch infrastructure. This requires a new notification event type: `LH_COMPLETED`.

**FR-02** — The delivery notification job MUST execute within 60 seconds of the status transition (asynchronous, non-blocking; reuses existing dispatch queue).

**FR-03** — The trigger applies to both Environmental and Vector LH records (any LH generated via S-06 or the equivalent Vector reporting workflow).

**FR-04** — Notifications MUST NOT be sent for LH records that have no customer contact information on file (no email and no WhatsApp number). In this case, the delivery status is set to `NO_CONTACT` and no error is raised.

### 3.2 Recipient Resolution — New `CUSTOMER` Recipient Type

**FR-05** — A new recipient type `CUSTOMER` MUST be added to the shared recipient-rule system (alongside the existing `ORDERING_PROVIDER`, `PATIENT`, and `MANUAL` types defined in OGC-437/439).

**FR-06** — For the `CUSTOMER` recipient type, the system MUST resolve contact information from the order's registered customer fields (customer email address and customer phone/WhatsApp number), not from patient or provider records.

**FR-07** — The `LH_COMPLETED` trigger MUST be configured by default with a `CUSTOMER` recipient rule. Lab administrators may add additional recipient rules (e.g., `MANUAL` fixed addresses for CC) via the existing `CombinedTriggersPage` (OGC-439).

### 3.3 Notification Channels

**FR-08** — The system MUST attempt email delivery via the OGC-439 SMTP provider if a customer email address is recorded on the originating order.

**FR-09** — The system MUST attempt WhatsApp/SMS delivery via the OGC-437 TextIt provider if a customer phone number is recorded on the originating order.

**FR-10** — If both channels are available, both are attempted independently. Failure on one channel does not suppress the other. Retry behavior follows the OGC-437/439 retry policy (3× at 15-minute intervals).

**FR-11** — The email message template (managed via `CombinedTemplatesPage`) for the `LH_COMPLETED` event MUST include by default:
- Subject line: `[Lab Name] — Laporan Hasil tersedia / Test Certificate Ready: [Order Number]`
- Customer name (salutation)
- Order number and collection date
- `{{lh_download_link}}` merge field (§3.4)
- Link expiry notice (e.g., "This link expires in 30 days")
- Lab contact information from Report Print Configuration (S-06 §5.1)

**FR-12** — The WhatsApp message template MUST include `{{lh_download_link}}` and `{{order_number}}`. Message length MUST NOT exceed 1,000 characters.

**FR-13** — The default email template for `LH_COMPLETED` MUST be bilingual (Indonesian primary, English secondary). This is a template-level requirement; the template editor in `CombinedTemplatesPage` accommodates this without system changes.

### 3.4 Secure Download Link — New Infrastructure

**FR-14** — The system MUST generate a unique, time-limited download token for each LH delivery notification dispatch. Token: cryptographically random 128-bit value, URL-safe base64 encoded.

**FR-15** — The download URL format is: `https://[host]/lh/download?token=[token]`

**FR-16** — Tokens MUST expire 30 days after generation. The expiry duration MUST be configurable in Admin → System Configuration (key: `lh.download.token.ttl.days`, default: `30`).

**FR-17** — A token may be used any number of times before expiry (no single-use restriction). Each access is logged (§3.6).

**FR-18** — On token access, the system MUST return the signed LH PDF as a file download (`Content-Disposition: attachment`). File name format: `LH_[OrderNumber]_[LabCode].pdf`.

**FR-19** — Expired or invalid tokens MUST return HTTP 410 with a page instructing the customer to contact the lab for a new link.

**FR-20** — The download endpoint MUST NOT require authentication (no login). Rate limiting: maximum 20 requests per token per hour.

**FR-21** — The `{{lh_download_link}}` merge field MUST be available in all templates for the `LH_COMPLETED` trigger. The merge field resolver generates and persists the token at dispatch time, then injects the URL.

### 3.5 Delivery Status Tracking

**FR-22** — Each LH record MUST have a `delivery_status` field with the following values:

| Status | Description |
|--------|-------------|
| `PENDING` | Notification job enqueued, not yet attempted |
| `SENT` | At least one channel delivered successfully |
| `FAILED` | All attempted channels returned a delivery failure |
| `NO_CONTACT` | No customer contact information available |
| `RESENT` | Manually resent after initial failure or by request |

**FR-23** — Delivery status MUST be visible in the Laporan Hasil list table as a Carbon `Tag`:

| Status | Tag kind | Label |
|--------|----------|-------|
| `PENDING` | `purple` | Pending |
| `SENT` | `green` | Sent |
| `FAILED` | `red` | Failed |
| `NO_CONTACT` | `gray` | No Contact |
| `RESENT` | `teal` | Resent |

**FR-24** — When delivery status is `FAILED`, the row MUST display a prominent inline warning and the Resend action MUST be immediately accessible without opening a detail view.

### 3.6 Manual Resend

**FR-25** — A **Resend** action MUST be available for any LH record with status `FAILED`, `SENT`, or `RESENT` (i.e., any record where the PDF is complete).

**FR-26** — Triggering Resend MUST:
1. Regenerate a new token (extending expiry 30 days from the resend date)
2. Re-attempt delivery on all configured channels via the existing dispatch queue
3. Log the resend attempt with the actor's user ID and timestamp (shared delivery log)
4. Update `delivery_status` to `RESENT`

**FR-27** — Resend MUST be available from the LH list page (overflow menu) without navigating away.

**FR-28** — After a successful resend, the system MUST display an inline success notification: "Notification resent to [email/WhatsApp]."

**FR-29** — After a failed resend, the system MUST display an inline error notification with the failure reason and `delivery_status` MUST remain `FAILED`.

**FR-30** — Resend is rate-limited to once per 10 minutes per LH record (server-side; cooldown surfaced in UI per §8 i18n key `lh.delivery.resend.cooldown`).

### 3.7 Delivery Audit Log

**FR-31** — All delivery attempts (automatic and manual) MUST be recorded in the shared `DeliveryLog` (OGC-437/439 pattern) with: LH record ID, channel (`EMAIL` / `WHATSAPP`), timestamp, actor (system or user ID), status (`DELIVERED` / `FAILED` / `BOUNCED`), and error detail if failed.

**FR-32** — The delivery log for a given LH MUST be viewable in a read-only modal accessible via overflow menu → "View Delivery Log" in the LH detail view.

**FR-33** — The download token access log MUST record: token ID, access timestamp, IP address, HTTP response code. Stored separately from the delivery log in `lh_download_token_access_log`.

---

## 4. Data Model

### 4.1 New column on `laporan_hasil` (or equivalent LH entity)

```sql
ALTER TABLE laporan_hasil ADD COLUMN delivery_status VARCHAR(20)
    NOT NULL DEFAULT 'PENDING'
    CHECK (delivery_status IN ('PENDING','SENT','FAILED','NO_CONTACT','RESENT'));
```

### 4.2 Shared delivery log — extension

The `DeliveryLog` table from OGC-437/439 MUST support a nullable `laporan_hasil_id` foreign key to correlate LH delivery events. If OGC-437/439 use a polymorphic event reference, that mechanism is reused.

### 4.3 New table: `lh_download_token`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BIGINT` PK | Auto-increment |
| `laporan_hasil_id` | `BIGINT` FK | → `laporan_hasil.id` |
| `token` | `VARCHAR(255)` | Unique, indexed |
| `created_at` | `TIMESTAMP` | UTC |
| `expires_at` | `TIMESTAMP` | UTC; `created_at` + TTL |
| `access_count` | `INT` | Default 0 |
| `last_accessed_at` | `TIMESTAMP` nullable | UTC |

### 4.4 New table: `lh_download_token_access_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BIGINT` PK | Auto-increment |
| `token_id` | `BIGINT` FK | → `lh_download_token.id` |
| `accessed_at` | `TIMESTAMP` | UTC |
| `ip_address` | `VARCHAR(45)` | IPv4 or IPv6 |
| `http_response_code` | `INT` | 200, 410, 429 |

### 4.5 New notification event type (enum extension)

Add `LH_COMPLETED` to the `NotificationEventType` enum (or equivalent constant used by OGC-437/439 trigger system).

### 4.6 New recipient type (enum extension)

Add `CUSTOMER` to the `RecipientType` enum (or equivalent) with resolver: pull `customer_email` and `customer_phone` from the order entity.

---

## 5. API Endpoints

### 5.1 Trigger resend (staff)

```
POST /api/v1/laporan-hasil/{id}/resend
Authorization: Bearer [token] — requires ROLE_LH_SEND permission
Response 200: { "status": "RESENT", "channels": ["EMAIL", "WHATSAPP"], "sentAt": "..." }
Response 400: { "error": "lh.delivery.noContact" }
Response 404: { "error": "lh.notFound" }
Response 429: { "error": "lh.delivery.resend.cooldown", "retryAfterSeconds": 600 }
```

### 5.2 Get delivery log (staff)

```
GET /api/v1/laporan-hasil/{id}/delivery-log
Authorization: Bearer [token]
Response 200: [ { "channel": "EMAIL", "status": "DELIVERED", "attemptedAt": "...", ... } ]
```

### 5.3 Customer download (public, no auth)

```
GET /lh/download?token={token}
No Authorization header required
Response 200: PDF binary (Content-Disposition: attachment; filename="LH_[order]_[lab].pdf")
Response 410: Token expired or not found
Response 429: Rate limit exceeded (20 req/token/hr)
```

---

## 6. UI Changes (Addendum to S-06 UI)

### 6.1 Laporan Hasil list page — new columns

Add two columns to the existing LH DataTable:

| Column | Content |
|--------|---------|
| **Delivery** | Carbon `Tag` per FR-23 |
| **Actions** | Existing actions + Resend (overflow menu item, visible for all completed LH) |

The Delivery column MUST be filterable (filter by status in the existing toolbar filter).

### 6.2 Failed delivery visual treatment

When `delivery_status = FAILED`, the row background uses Carbon `$layer-accent-01` (light red tint) and the Delivery tag displays `red` kind. No modal required — the Resend action is directly in the overflow menu.

### 6.3 Delivery log modal

Accessible via overflow menu → "View Delivery Log". Displays shared delivery log entries in a read-only DataTable: Channel, Status, Attempted At, Actor, Error Detail. No editing or actions in this modal.

### 6.4 Admin — LH delivery settings

Under Admin → System Configuration, add a collapsible section "LH Delivery Settings" with:
- `lh.delivery.enabled` Toggle (default: ON)
- `lh.download.token.ttl.days` NumberInput (default: 30, min: 1, max: 365)

> Note: Email From Name, Email From Address, and WhatsApp credentials are configured in the existing OGC-439/OGC-437 admin sections — do not duplicate those fields here.

---

## 7. Business Rules

**BR-01** — Delivery is triggered only for `COMPLETED` LH records. Draft, unsigned, or voided records never trigger delivery.

**BR-02** — If both email and WhatsApp delivery fail within the initial attempt window (inclusive of OGC-437/439 retries), delivery status is set to `FAILED` and a system alert is written to the admin notification feed.

**BR-03** — A resend may be triggered at most once per 10 minutes per LH record (server-side cooldown).

**BR-04** — Download token generation is idempotent per resend event. A resend generates one new token; the prior token is NOT revoked — it continues to work until its own expiry.

**BR-05** — Customer contact information is pulled from the order's registered customer fields at the time of notification dispatch. Changes to customer contact after dispatch do not retroactively update previous delivery logs.

**BR-06** — S-06b MUST NOT be enabled in production until OGC-437 and OGC-439 channel infrastructure is deployed and configured (SMTP credentials and TextIt credentials present).

---

## 8. Localization

| i18n Key | English Fallback |
|----------|-----------------|
| `lh.delivery.status.pending` | Pending |
| `lh.delivery.status.sent` | Sent |
| `lh.delivery.status.failed` | Failed |
| `lh.delivery.status.noContact` | No Contact |
| `lh.delivery.status.resent` | Resent |
| `lh.delivery.column.header` | Delivery |
| `lh.delivery.resend.button` | Resend |
| `lh.delivery.resend.success` | Notification resent successfully |
| `lh.delivery.resend.error` | Resend failed — {reason} |
| `lh.delivery.resend.cooldown` | Resend available in {minutes} min |
| `lh.delivery.log.title` | Delivery Log |
| `lh.delivery.log.channel` | Channel |
| `lh.delivery.log.status` | Status |
| `lh.delivery.log.attemptedAt` | Attempted At |
| `lh.delivery.log.actor` | Sent By |
| `lh.delivery.log.error` | Error Detail |
| `lh.download.expired.title` | Link Expired |
| `lh.download.expired.message` | This download link has expired. Please contact your laboratory to request a new link. |
| `lh.admin.delivery.enabled` | Enable LH Delivery Notifications |
| `lh.admin.delivery.tokenTtl` | Download Link Expiry (days) |
| `lh.email.subject` | {labName} — Laporan Hasil tersedia / Test Certificate Ready: {orderNumber} |
| `notification.eventType.lhCompleted` | LH Completed |
| `notification.recipientType.customer` | Customer |

---

## 9. Security & Permissions

| Permission Key | Scope |
|----------------|-------|
| `ROLE_LH_SEND` | Trigger manual resend |
| `ROLE_LH_VIEW` | View delivery status and delivery log |
| `ROLE_ADMIN_LH_CONFIG` | Edit LH delivery settings in Admin |

- The public download endpoint (`/lh/download`) requires no authentication but is rate-limited and token-scoped.
- Download tokens are opaque random values; they do not embed or expose any PII.
- Email addresses and phone numbers are never included in the download URL.
- All delivery attempts are logged for audit regardless of outcome.

---

## 10. Acceptance Criteria

**Trigger**
- [ ] When an LH is signed and status transitions to `COMPLETED`, a delivery notification is dispatched within 60 seconds via the OGC-437/439 dispatch queue
- [ ] No notification is sent for records with `NO_CONTACT` status; no error is raised

**Recipient**
- [ ] `CUSTOMER` recipient type resolves email and phone from order customer fields
- [ ] `LH_COMPLETED` trigger is pre-configured with a `CUSTOMER` recipient rule in `CombinedTriggersPage`

**Channels**
- [ ] Email is sent when a customer email address is on file
- [ ] WhatsApp is sent when a customer phone number is on file
- [ ] Both channels are attempted independently when both are available
- [ ] Email body contains order number, customer name, download link, and lab contact

**Secure download link**
- [ ] `{{lh_download_link}}` renders a valid token URL in email and WhatsApp messages
- [ ] Download link works without authentication
- [ ] Link returns the correct signed PDF as a file download
- [ ] Expired link returns HTTP 410 with the expiry message
- [ ] Token TTL is configurable via Admin → System Configuration

**Delivery status**
- [ ] LH list shows Delivery column with correct Tag color per status
- [ ] Failed delivery rows display in visual `FAILED` treatment
- [ ] Delivery column is filterable in the existing toolbar

**Resend**
- [ ] Resend action is available for FAILED, SENT, and RESENT records via overflow menu
- [ ] Resend generates a new token and re-attempts all channels via the dispatch queue
- [ ] Success inline notification appears after resend
- [ ] Error inline notification appears if resend also fails
- [ ] Resend is rate-limited to once per 10 minutes per LH record (UI shows cooldown message)

**Audit**
- [ ] Every delivery attempt is recorded in the shared delivery log with channel, status, timestamp, actor
- [ ] Delivery log is viewable via "View Delivery Log" in the overflow menu
- [ ] Token access events are logged in `lh_download_token_access_log` with timestamp and IP

**Permissions**
- [ ] Staff without `ROLE_LH_SEND` cannot trigger resend (action hidden; API returns 403)
- [ ] Public download endpoint does not expose any authentication-gated data

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-06 (OGC-552) | Parent spec — this addendum extends §5 and §6; supersedes Non-Goal §3.2.3 |
| **OGC-439 — Email Notification Integration** | **Hard prerequisite** — SMTP channel, template editor, `CombinedTriggersPage` must be deployed first |
| **OGC-437 — SMS/TextIt Notification Integration** | **Hard prerequisite** — TextIt/WhatsApp channel, delivery log, retry mechanism must be deployed first |
| Report Print Configuration (S-06 §5.1) | Email From Name and lab contact pulled from here (via OGC-439 config) |
| Customer/order contact fields | Email and phone on the order registration form (S-03, OGC-537) |
| Electronic Signature (existing) | LH `COMPLETED` status set by e-sign flow — this is the trigger |
| Admin → System Configuration | Token TTL and delivery toggle configured here |
