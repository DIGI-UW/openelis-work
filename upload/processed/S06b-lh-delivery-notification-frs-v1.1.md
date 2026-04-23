# S-06b — LH Delivery Notification
## Addendum to S-06: Laporan Hasil (OGC-552)
### Functional Requirements Specification — v1.1

**Version:** 1.1  
**Date:** 2026-04-20  
**Status:** Draft for Review  
**Addendum to:** [S-06 FRS — Laporan Hasil Compliance Report](./S06-laporan-hasil-compliance-report-frs-v1.0.md) / [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552)  
**Built on top of:** [OGC-439 — Email Notification Integration](https://uwdigi.atlassian.net/browse/OGC-439) · [OGC-437 — SMS/TextIt Notification Integration](https://uwdigi.atlassian.net/browse/OGC-437)  
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)  
**Source requirement:** Bogor requirements spreadsheet (Tab 3 — Modul Lingkungan, Tab 4 — Vector & BPP Module): "Document Download — Customer downloads digitally signed LH via email/WhatsApp link. Must Have, Phase 1. Note: Notification/mark if email is not successfully delivered."

---

## 1. Overview

This addendum extends S-06 to cover the **post-signature delivery step**: once a Laporan Hasil (LH) PDF has been digitally signed and released, the system automatically sends the ordering party a notification (email and/or WhatsApp) containing a secure download link to retrieve their certificate.

S-06 v1.0 explicitly deferred this as Non-Goal §3.2.3 ("Email/distribution workflow — future enhancement"). This addendum fulfils that deferral.

### 1.1 Relationship to OGC-437 and OGC-439

**S-06b is an extension to the notification infrastructure designed in OGC-437 (SMS/TextIt) and OGC-439 (Email/SMTP), not a parallel system.** Those stories define the channel providers, async dispatch queue, delivery log schema, retry mechanism, admin config pages, and template management UI. S-06b depends on that infrastructure being in place and adds only the pieces specific to ENV/Vector LH delivery.

**Implementation dependency:** OGC-437 and OGC-439 MUST be implemented (channel infrastructure and delivery log schema merged) before S-06b development begins.

### 1.2 Delta — what S-06b adds

| Delta item | Notes |
|---|---|
| **`LH_COMPLETED` trigger event** | The ENV/Vector equivalent of clinical final validation. The existing OGC-437/439 system fires on clinical final validation; `LH_COMPLETED` fires when the LH is digitally signed and released — the same conceptual moment for a different workflow branch. |
| **`ORDERING_PROVIDER` contact resolution for ENV orders** | The `ORDERING_PROVIDER` recipient type already exists in OGC-437/439. In ENV/Vector context the ordering provider is the entity that submitted the order (the customer/company). S-06b ensures the contact resolver pulls email + phone from the order's customer contact fields for ENV orders, not from the clinical provider directory. |
| **Secure download token + public endpoint (Part 1)** | OGC-437/439 send result summaries. S-06b adds `lh_download_token`, `GET /lh/download?token=` (no auth required), configurable TTL, and rate limiting. **Part 1** assumes the OpenELIS server has a publicly reachable IP. See §3.4 for Part 2 (FHIR consolidated server). |
| **`{{lh_download_link}}` merge field** | New merge field rendering the token URL into message body. |
| **"Sent Messages" global tab** | A new main-menu tab consolidating delivery tracking for all notification types (LH, clinical, future). Delivery status and resend actions live here, not on individual result or LH list pages. |
| **Bilingual template defaults** | Default template for `LH_COMPLETED` ships with Indonesian and English chrome strings. The message body itself is user-authored free text — no system translation required for the body. |

### 1.3 What this addendum does NOT change

- PDF generation, certificate structure, e-signature flow — unchanged (S-06 §5.3–§5.4)
- Batch download ZIP — unchanged (S-06 §5.5)
- Report numbering — unchanged (S-06 §5.2.4)
- Any existing S-06 acceptance criteria — remain valid
- OGC-437/439 channel infrastructure, admin config pages, template editor — unchanged

---

## 2. User Stories

- **US-01** — As a validator, I want the system to automatically notify the ordering party by email and WhatsApp when I release the LH, so that they receive their certificate promptly without requiring manual distribution.
- **US-02** — As a lab officer, I want a dedicated "Sent Messages" view where I can see the delivery status of all notifications — LH and clinical — at a glance, so I can follow up on failures before a customer calls.
- **US-03** — As a lab officer, I want to resend a delivery notification with a single click from the Sent Messages tab when the original delivery failed or the customer requests a resend.
- **US-04** — As a customer, I want to receive a direct download link for my signed certificate that works without logging into any system, so that I can retrieve it from any device.
- **US-05** — As a lab administrator, I want the system to mark any delivery failure clearly so that no report goes undelivered silently.

---

## 3. Functional Requirements

### 3.1 Notification Trigger

**FR-01** — When an LH record is digitally signed and released (status transitions to the equivalent of "validated/completed" in the LH workflow), the system MUST enqueue a delivery notification job for that LH. This event is represented as a new notification event type: **`LH_COMPLETED`**. It is the ENV/Vector analogue of the clinical final validation event used by OGC-437/439.

**FR-02** — The delivery notification job MUST execute within 60 seconds of the status transition (asynchronous, non-blocking; reuses existing dispatch queue from OGC-437/439).

**FR-03** — The trigger applies to both Environmental and Vector LH records.

**FR-04** — Notifications MUST NOT be sent for LH records that have no contact information on the originating order (no email and no phone). In this case the delivery status is set to `NO_CONTACT` and no error is raised.

### 3.2 Recipient Resolution — `ORDERING_PROVIDER` for ENV/Vector Orders

**FR-05** — The `LH_COMPLETED` trigger MUST be pre-configured with a recipient rule of type `ORDERING_PROVIDER`.

**FR-06** — In ENV/Vector order context, `ORDERING_PROVIDER` resolves to the **ordering entity** (the company or individual who submitted the order — i.e. the customer). The contact resolver MUST pull email address and phone/WhatsApp number from the order's customer contact fields, not from the clinical provider directory.

**FR-07** — This resolution difference is isolated to the contact-lookup step. The recipient type name `ORDERING_PROVIDER` is unchanged; no new enum value is required.

**FR-08** — Lab administrators may add additional recipient rules (e.g., `MANUAL` fixed addresses for CC notifications) via the existing `CombinedTriggersPage` (OGC-439).

### 3.3 Notification Channels

**FR-09** — The system MUST attempt email delivery via the OGC-439 SMTP provider if a customer email address is on the order.

**FR-10** — The system MUST attempt WhatsApp/SMS delivery via the OGC-437 TextIt provider if a customer phone number is on the order.

**FR-11** — If both channels are available, both are attempted independently. Failure on one does not suppress the other. Retry behavior follows the OGC-437/439 retry policy (3× at 15-minute intervals).

**FR-12** — The email message template (managed via `CombinedTemplatesPage`, event `LH_COMPLETED`) MUST include the `{{lh_download_link}}` merge field (§3.4). The default template ships with Indonesian and English **chrome strings** (subject line, salutation, expiry notice, footer). The **message body** is free-text authored by lab staff in their local language — it does not require system-provided translation strings.

**FR-13** — The WhatsApp template MUST include `{{lh_download_link}}` and `{{order_number}}`. Length MUST NOT exceed 1,000 characters.

### 3.4 Secure Download Link

> This section describes two deployment scenarios. **Part 1** is the Phase 1 implementation. **Part 2** is a planned future extension.

#### Part 1 — Direct download (OpenELIS server has a public IP)

**FR-14** — The system MUST generate a unique, time-limited download token for each delivery dispatch. Token: cryptographically random 128-bit value, URL-safe base64 encoded.

**FR-15** — The download URL format is: `https://[openelis-host]/lh/download?token=[token]`

**FR-16** — Tokens MUST expire 30 days after generation. Expiry duration MUST be configurable in Admin → System Configuration (key: `lh.download.token.ttl.days`, default: `30`, min: 1, max: 365).

**FR-17** — A token may be used any number of times before expiry (no single-use restriction). Each access is logged (§3.7).

**FR-18** — On token access, the system MUST return the signed LH PDF as a file download (`Content-Disposition: attachment`). File name: `LH_[OrderNumber]_[LabCode].pdf`.

**FR-19** — Expired or invalid tokens MUST return HTTP 410 with a page instructing the customer to contact the lab for a new link.

**FR-20** — The download endpoint MUST NOT require authentication. Rate limiting: 20 requests per token per hour.

**FR-21** — The `{{lh_download_link}}` merge field MUST be available in all templates for `LH_COMPLETED`. The resolver generates and persists the token at dispatch time, then injects the URL.

#### Part 2 — Consolidated FHIR server (OpenELIS server does NOT have a public IP) *(planned, not in scope for Part 1)*

**FR-22 (Part 2)** — For deployments where the OpenELIS instance is not publicly reachable, the download link SHALL resolve via a separately hosted consolidated FHIR server that stores a copy of the signed LH PDF or the corresponding FHIR DiagnosticReport resource.

**FR-23 (Part 2)** — On LH completion, OpenELIS SHALL push the signed PDF (or FHIR DiagnosticReport) to the configured consolidated FHIR server endpoint. The download token link SHALL point to that FHIR server rather than the OpenELIS host.

**FR-24 (Part 2)** — The consolidated FHIR server URL and credential MUST be configurable in Admin → System Configuration. When a FHIR server URL is configured, Part 2 behavior takes precedence over Part 1 for token URL generation.

> Part 2 will be specified in a companion addendum (S-06b-part2) once FHIR server infrastructure is defined.

### 3.5 Delivery Status Tracking

**FR-25** — Each LH record MUST carry a `delivery_status` field:

| Status | Description |
|--------|-------------|
| `PENDING` | Notification enqueued, not yet attempted |
| `SENT` | At least one channel delivered successfully |
| `FAILED` | All attempted channels returned a failure |
| `NO_CONTACT` | No contact information on the order |
| `RESENT` | Manually resent after initial failure or by request |

**FR-26** — Delivery status MUST be surfaced in the **Sent Messages tab** (§6.1), not on the LH list page or results screen.

### 3.6 Manual Resend

**FR-27** — A **Resend** action MUST be available for any LH notification record with status `FAILED`, `SENT`, or `RESENT`.

**FR-28** — Triggering Resend MUST:
1. Regenerate a new token (extending expiry 30 days from the resend date)
2. Re-attempt delivery on all configured channels via the existing dispatch queue
3. Log the resend attempt with the actor's user ID and timestamp
4. Update `delivery_status` to `RESENT`

**FR-29** — Resend is rate-limited to once per 10 minutes per LH record (server-side; cooldown surfaced in UI).

**FR-30** — After a successful resend, the system MUST display an inline success notification.

**FR-31** — After a failed resend, the system MUST display an inline error notification with the failure reason and status MUST remain `FAILED`.

### 3.7 Delivery Audit Log

**FR-32** — All delivery attempts (automatic and manual) MUST be recorded in the shared delivery log (OGC-437/439 pattern) with: LH record ID, channel, timestamp, actor, status, and error detail.

**FR-33** — The delivery log for a given LH MUST be viewable in a read-only modal from the Sent Messages tab.

**FR-34** — Token access events MUST be logged in `lh_download_token_access_log`: token ID, timestamp, IP address, HTTP response code.

---

## 4. Data Model

### 4.1 New column on `laporan_hasil`

```sql
ALTER TABLE laporan_hasil ADD COLUMN delivery_status VARCHAR(20)
    NOT NULL DEFAULT 'PENDING'
    CHECK (delivery_status IN ('PENDING','SENT','FAILED','NO_CONTACT','RESENT'));
```

### 4.2 Shared delivery log — extension

The `DeliveryLog` table (OGC-437/439) MUST support a nullable `laporan_hasil_id` FK to correlate LH delivery events. If OGC-437/439 use a polymorphic event reference, that mechanism is reused.

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

### 4.5 Enum extensions (OGC-437/439 shared enums)

- Add `LH_COMPLETED` to `NotificationEventType` (or equivalent constant).
- No change to `RecipientType` — `ORDERING_PROVIDER` is reused with ENV-aware contact resolution.

---

## 5. API Endpoints

### 5.1 Trigger resend (staff)

```
POST /api/v1/laporan-hasil/{id}/resend
Authorization: Bearer [token] — requires ROLE_LH_SEND
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

### 5.3 Customer download (public, no auth) — Part 1

```
GET /lh/download?token={token}
No Authorization header required
Response 200: PDF binary (Content-Disposition: attachment; filename="LH_[order]_[lab].pdf")
Response 410: Token expired or not found
Response 429: Rate limit exceeded (20 req/token/hr)
```

---

## 6. UI — "Sent Messages" Tab

### 6.1 Global "Sent Messages" tab (new main-menu item)

A new top-level tab **"Sent Messages"** is added to the OpenELIS main navigation. This tab consolidates delivery tracking for all outbound notifications across the system — LH delivery (S-06b), clinical result notifications (OGC-437/439), and any future notification types.

The tab displays a filterable, sortable DataTable with one row per notification dispatch event. Columns:

| Column | Content |
|--------|---------|
| **Date/Time** | Dispatch timestamp |
| **Type** | Notification event type (e.g., LH Completed, Clinical Result) |
| **Recipient** | Name + masked email/phone |
| **Channel** | EMAIL / WHATSAPP |
| **Status** | Carbon `Tag` per status table (§3.5) |
| **Reference** | Link to the associated LH or result record |
| **Actions** | Overflow menu: Resend · View Delivery Log |

The Reference column provides a direct link to the relevant screen (LH detail view, result entry page, etc.) so staff can navigate to the source record without searching.

### 6.2 Status tag colors

| Status | Tag kind | Label |
|--------|----------|-------|
| `PENDING` | `purple` | Pending |
| `SENT` | `green` | Sent |
| `FAILED` | `red` | Failed |
| `NO_CONTACT` | `gray` | No Contact |
| `RESENT` | `teal` | Resent |

When `delivery_status = FAILED`, the row background uses Carbon `$layer-accent-01` (light red tint). The Resend action is directly in the overflow menu — no detail view required.

### 6.3 Delivery log modal

Accessible via overflow menu → "View Delivery Log". Displays shared delivery log entries in a read-only DataTable: Channel, Status, Attempted At, Actor, Error Detail.

### 6.4 LH list page — minimal indicator only

The LH list page (S-06) does NOT add a full Delivery column or resend controls. It MAY show a compact status icon (e.g., a small colored dot or icon) as a passive indicator that delivery tracking is available. Full delivery management is in the Sent Messages tab.

### 6.5 Admin — LH delivery settings

Under Admin → System Configuration, add a collapsible section "LH Delivery Settings":
- `lh.delivery.enabled` Toggle (default: ON)
- `lh.download.token.ttl.days` NumberInput (default: 30, min: 1, max: 365)
- `lh.download.fhir.server.url` TextInput — FHIR consolidated server URL (blank = Part 1 behavior; populated = Part 2 behavior) *(Part 2 field, greyed-out and labelled "Coming in Part 2" for Phase 1 release)*

> Email From Name, Email From Address, and WhatsApp credentials are configured in the existing OGC-439/OGC-437 admin sections — not duplicated here.

---

## 7. Business Rules

**BR-01** — Delivery is triggered only when an LH is digitally signed and released. Draft, unsigned, or voided records never trigger delivery.

**BR-02** — If both email and WhatsApp delivery fail within the initial attempt window (inclusive of OGC-437/439 retries), delivery status is set to `FAILED` and a system alert is written to the admin notification feed.

**BR-03** — A resend may be triggered at most once per 10 minutes per LH record (server-side cooldown).

**BR-04** — A resend generates one new token. The prior token is NOT revoked — it continues to work until its own expiry.

**BR-05** — Contact information is pulled from the order at dispatch time. Changes to order contact after dispatch do not retroactively update delivery logs.

**BR-06** — S-06b MUST NOT be enabled in production until OGC-437 and OGC-439 channel infrastructure is deployed and configured.

---

## 8. Localization

i18n strings cover **UI chrome only** (labels, status names, column headers, system notifications, subject-line format). The message body of each notification template is **free-text, authored by lab staff in their local language** and does not use system translation strings.

| i18n Key | English Fallback |
|----------|-----------------|
| `lh.delivery.status.pending` | Pending |
| `lh.delivery.status.sent` | Sent |
| `lh.delivery.status.failed` | Failed |
| `lh.delivery.status.noContact` | No Contact |
| `lh.delivery.status.resent` | Resent |
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
| `nav.sentMessages` | Sent Messages |
| `sentMessages.column.type` | Type |
| `sentMessages.column.recipient` | Recipient |
| `sentMessages.column.channel` | Channel |
| `sentMessages.column.status` | Status |
| `sentMessages.column.reference` | Reference |

---

## 9. Security & Permissions

| Permission Key | Scope |
|----------------|-------|
| `ROLE_LH_SEND` | Trigger manual resend from Sent Messages tab |
| `ROLE_LH_VIEW` | View LH entries in Sent Messages tab and delivery log |
| `ROLE_NOTIFICATIONS_VIEW` | View all entries in Sent Messages tab (cross-module) |
| `ROLE_ADMIN_LH_CONFIG` | Edit LH delivery settings in Admin |

- The public download endpoint (`/lh/download`) requires no authentication but is rate-limited and token-scoped.
- Download tokens are opaque random values; they do not embed or expose any PII.
- Email addresses and phone numbers are never included in the download URL.
- All delivery attempts are logged for audit regardless of outcome.

---

## 10. Acceptance Criteria

**Trigger**
- [ ] When an LH is signed and released, a delivery notification is dispatched within 60 seconds via the OGC-437/439 dispatch queue
- [ ] `LH_COMPLETED` event type is available in `CombinedTriggersPage`
- [ ] No notification is sent for `NO_CONTACT` records; no error is raised

**Recipient**
- [ ] `ORDERING_PROVIDER` recipient rule on `LH_COMPLETED` resolves contact from order customer fields (not clinical provider directory)
- [ ] Pre-configured `ORDERING_PROVIDER` recipient rule is present for `LH_COMPLETED` in `CombinedTriggersPage`

**Channels**
- [ ] Email is sent when a customer email address is on the order
- [ ] WhatsApp is sent when a customer phone number is on the order
- [ ] Both channels are attempted independently

**Secure download link (Part 1)**
- [ ] `{{lh_download_link}}` renders a valid token URL in message body
- [ ] Download link works without authentication and returns the correct signed PDF
- [ ] Expired link returns HTTP 410 with the expiry message
- [ ] Token TTL is configurable via Admin → System Configuration

**Sent Messages tab**
- [ ] "Sent Messages" appears in main navigation
- [ ] Tab shows LH delivery events with Type, Recipient, Channel, Status, Reference columns
- [ ] Status tags display correct colors per status table
- [ ] Failed rows display visual red treatment
- [ ] Reference column links to the associated LH record
- [ ] Tab is filterable by Type, Status, and date range

**Resend**
- [ ] Resend is available from Sent Messages tab overflow menu for FAILED, SENT, RESENT records
- [ ] Resend generates a new token and re-attempts all channels
- [ ] Success and failure inline notifications appear as expected
- [ ] Resend is rate-limited to once per 10 minutes per LH record

**Audit**
- [ ] Every delivery attempt is recorded in shared delivery log
- [ ] Delivery log modal accessible from Sent Messages tab overflow menu
- [ ] Token access events logged with timestamp and IP

**Permissions**
- [ ] Staff without `ROLE_LH_SEND` cannot trigger resend (action hidden; API returns 403)
- [ ] Public download endpoint returns no authentication-gated data

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-06 (OGC-552) | Parent spec — supersedes Non-Goal §3.2.3 |
| **OGC-439 — Email Notification Integration** | **Hard prerequisite** — SMTP channel, `CombinedTriggersPage`, delivery log must be merged first |
| **OGC-437 — SMS/TextIt Notification Integration** | **Hard prerequisite** — TextIt channel, retry mechanism must be merged first |
| Report Print Configuration (S-06 §5.1) | Email From Name and lab contact used in default template |
| Customer/order contact fields (S-03, OGC-537) | Email and phone resolved from here for `ORDERING_PROVIDER` in ENV context |
| Electronic Signature (existing) | LH release event — this is the `LH_COMPLETED` trigger source |
| Admin → System Configuration | Token TTL, delivery toggle, and (Part 2) FHIR server URL configured here |
| S-06b Part 2 *(future)* | Consolidated FHIR server delivery path for labs without public IP |
