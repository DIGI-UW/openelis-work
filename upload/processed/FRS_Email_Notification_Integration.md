# Email Notification Integration
## Functional Requirements Specification — v1.0

**Version:** 1.2
**Date:** 2026-03-23
**Status:** Draft for Review
**Jira:** OGC (story TBD — relates to OGC-437)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Results Entry, Final Validation, Administration, Provider Management

> **Note:** This FRS is a delta document. All shared patterns — trigger rule model,
> dispatch hook (final validation only), retry logic (auto-retry + delivery log),
> permission layering, and i18n requirements — are defined in
> `FRS_TextIt_SMS_Integration.md` and apply here without repetition. Only
> email-specific differences are documented below.

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements (email-specific)
5. Data Model (email-specific)
6. API Endpoints
7. UI Design
8. Business Rules (email-specific)
9. Localization (email-specific additions)
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

This feature adds an SMTP-based email notification channel to OpenELIS Global, complementing the TextIt SMS channel (OGC-437). When a result reaches final validation, OpenELIS evaluates per-test-type trigger rules and dispatches an email to the ordering provider's email address using a configurable subject and body template with merge fields. The delivery log, retry logic, and configuration UI follow the same patterns as the SMS integration, maximising component and code reuse.

---

## 2. Problem Statement

**Current state:** The SMS notification channel (OGC-437) covers providers with mobile numbers. Many providers — particularly clinicians at higher-level facilities with reliable internet — prefer or require email for result notifications. No native email dispatch exists in OpenELIS.

**Proposed solution:** Add an independent email notification channel under Administration → Notifications → Email Notifications. It operates in parallel with SMS — both channels can fire for the same result if both are enabled and the provider has both a mobile number and an email address.

---

## 3. User Roles & Permissions

Same roles as SMS. Additional permission keys:

- `email.config.view` — View SMTP config, email trigger rules, email template
- `email.config.modify` — Edit SMTP credentials, trigger rules, template, retry policy
- `email.log.view` — View email delivery log
- `email.log.retry` — Manually retry a failed email delivery

---

## 4. Functional Requirements

### 4.1 SMTP Connection Configuration

**FR-4.1-001:** The system MUST provide a configuration form with fields: SMTP Host, SMTP Port, Username, Password, From Address, From Display Name, and a Toggle for STARTTLS/SSL.

**FR-4.1-002:** Password MUST be stored encrypted at rest (AES-256) and MUST NOT be returned in GET responses.

**FR-4.1-003:** "Send Test Email" MUST send a test message to a configurable test recipient address and display an `InlineNotification` with the result.

**FR-4.1-004:** Global enable/disable Toggle follows the same pattern as SMS (FR-4.1-004 in SMS FRS).

### 4.2 Per-Test-Type Email Trigger Rules

Identical to SMS trigger rules (FR-4.2 in SMS FRS v1.1) — same Coded/Numeric branching, same value checklist, same Critical/Non-Normal flag toggles, same numeric range mode, same search/pagination UI, same "Disable All" bulk action. Email trigger rules are a **separate set** from SMS trigger rules — a test type can be configured with different trigger conditions per channel independently (e.g., "MTB DETECTED only" for SMS, "All results" for email).

**EmailTestTypeTrigger** + **EmailRecipientRule** — identical schema to `SmsTestTypeTrigger` + `SmsRecipientRule` (separate tables). `manualEmailAddress` replaces `manualPhoneNumber`. `useCustomTemplate` / `customTemplate` apply to email body only (subject always uses the global subject template for that recipient type).

The combined Test Triggers UI (shared with SMS — see SMS FRS §7) shows both channels side by side in the same inline expansion. Trigger rules for each channel remain stored and evaluated independently.

### 4.3 Email Template Engine

**FR-4.3-001:** The system MUST provide configurable email Subject and Body templates **per recipient type**: `ORDERING_PROVIDER`, `PATIENT`, and `MANUAL` — following the same model as SMS (see SMS FRS FR-4.3-001 through 001b). HTML email is out of scope for v1.

**FR-4.3-001a:** A **"Use same template for all recipient types"** toggle applies independently to the email channel. When disabled, three editor sections are shown — each with its own Subject input and Body textarea.

**FR-4.3-001b:** Default template content per recipient type:

| Recipient Type | Default Subject | Default Body (summary) |
|---|---|---|
| Ordering Provider | `OpenELIS Result: {{test_name}} for {{patient_id}}` | Formal clinical notification addressed to `{{provider_name}}` with test, result, facility, date, lab number |
| Patient | `Your Test Result — {{test_name}}` | Plain-language notification addressed to `{{patient_id}}` with result, facility, date, lab number, instruction to contact provider |
| Fixed Address | `Lab Alert: {{test_name}} — {{facility}}` | Structured surveillance format: LABORATORY NOTIFICATION header, all key fields in block layout |

**FR-4.3-002:** Both subject and body support the following merge fields, insertable via a helper toolbar:

| Merge Field | Resolved Value |
|---|---|
| `{{provider_name}}` | Full name of the ordering provider |
| `{{patient_id}}` | OpenELIS patient ID |
| `{{test_name}}` | Name of the test type |
| `{{result}}` | Result interpretation text |
| `{{facility}}` | Facility name |
| `{{validated_at}}` | Date/time of final validation |
| `{{lab_number}}` | OpenELIS lab number for the sample |

**FR-4.3-003:** No character limit applies to the body. The subject MUST be limited to 255 characters.

**FR-4.3-004:** A live preview panel MUST render both subject and body with example values substituted.

**FR-4.3-005:** Template dispatch priority (highest to lowest): (1) rule-level `customTemplate` (email body only), (2) recipient-type-specific global template, (3) `ALL` global template. Follows the same priority logic as SMS (SMS FRS FR-4.3-005).

### 4.4 Email Dispatch (Backend)

Follows same pattern as SMS dispatch (FR-4.4 in SMS FRS) with these differences:

**FR-4.4-001:** The dispatch service looks up the ordering provider's `email` field on the provider record (instead of `mobilePhone`). If no email is present, the attempt is logged as SKIPPED_NO_EMAIL.

**FR-4.4-002:** Email is sent via Spring `JavaMailSender` using the configured SMTP credentials.

**FR-4.4-003:** The rendered subject and body are stored as snapshots in `EmailDeliveryLog` at time of dispatch.

### 4.5 Retry Logic

Identical to SMS retry logic. Shares the same configurable maxRetries and retryIntervalMinutes fields (from a shared `NotificationRetryConfig` entity, or as separate config — see BR-001).

### 4.6 Email Delivery Log

Same columns as SMS delivery log with these substitutions:
- "Lab Number" column retained (same field)
- "Phone" column → "Email" (masked: first 2 chars + domain, e.g. `ja••••@moh.gov.pg`)
- Status values: DELIVERED, FAILED_PERMANENT, PENDING, RETRYING, SKIPPED_NO_EMAIL
- Status Tag kinds: same as SMS

---

## 5. Data Model

### New Entities

**EmailNotificationConfig**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key, singleton |
| enabled | Boolean | Yes | Global on/off |
| smtpHost | String(255) | Yes | SMTP server hostname |
| smtpPort | Integer | Yes | Default: 587 |
| smtpUsername | String(255) | Yes | SMTP auth username |
| smtpPassword | String(512) | Yes | Encrypted at rest |
| fromAddress | String(255) | Yes | Sender email address |
| fromDisplayName | String(100) | No | e.g. "OpenELIS Results" |
| useTls | Boolean | Yes | Default: true |
| sameTemplateForAll | Boolean | Yes | When true, `subjectTemplateAll` / `bodyTemplateAll` used for all recipient types; default: false |
| subjectTemplateAll | String(255) | No | Global fallback subject |
| bodyTemplateAll | Text | No | Global fallback body |
| subjectTemplateProvider | String(255) | No | Subject for ORDERING_PROVIDER |
| bodyTemplateProvider | Text | No | Body for ORDERING_PROVIDER |
| subjectTemplatePatient | String(255) | No | Subject for PATIENT |
| bodyTemplatePatient | Text | No | Body for PATIENT |
| subjectTemplateManual | String(255) | No | Subject for MANUAL (fixed address) |
| bodyTemplateManual | Text | No | Body for MANUAL (fixed address) |
| maxRetries | Integer | Yes | Default: 3 |
| retryIntervalMinutes | Integer | Yes | Default: 15 |
| logRetentionDays | Integer | Yes | Default: 90 |
| testRecipientEmail | String(255) | No | Used by "Send Test Email" action only |

**EmailTestTypeTrigger** — identical structure to `SmsTestTypeTrigger` (separate table, same parent/child model): `EmailTestTypeTrigger` (one row per test type, holds `enabled` flag) + `EmailRecipientRule` (one row per recipient rule, holds `recipientType`, `manualEmailAddress`, `triggerOnValues`, `triggerOnCritical`, `triggerOnNonNormal`, `numericMode`, `numericLow`, `numericHigh`, `useCustomTemplate`, `customTemplate`). For MANUAL recipient type, the stored field is `manualEmailAddress` (not phone). SKIPPED status is `SKIPPED_NO_EMAIL` instead of `SKIPPED_NO_PHONE`. Same trigger evaluation logic as SMS (see SMS FRS §5).

**EmailDeliveryLog** — identical structure to `SmsDeliveryLog` with:
- `providerEmail` (String 255) instead of `providerPhone`
- `renderedSubject` (String 255) added
- `status` values: PENDING, DELIVERED, RETRYING, FAILED_PERMANENT, SKIPPED_NO_EMAIL

### Modified Entities

**Provider** — verify field presence (add if missing):

| Field | Type | Notes |
|---|---|---|
| email | String(255) | Provider's email address for notification delivery |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/email/config` | Get email config (password masked) | `email.config.view` |
| PUT | `/api/v1/email/config` | Save/update email config | `email.config.modify` |
| POST | `/api/v1/email/config/test` | Send test email to testRecipientEmail | `email.config.modify` |
| GET | `/api/v1/email/triggers` | List email trigger rules | `email.config.view` |
| PUT | `/api/v1/email/triggers/{testTypeId}` | Update email trigger for test type | `email.config.modify` |
| PUT | `/api/v1/email/triggers/bulk-disable` | Disable all email triggers | `email.config.modify` |
| GET | `/api/v1/email/log` | List email delivery log (paginated) | `email.log.view` |
| GET | `/api/v1/email/log/{id}` | Get single delivery log entry | `email.log.view` |
| POST | `/api/v1/email/log/{id}/retry` | Retry a FAILED_PERMANENT entry | `email.log.retry` |

---

## 7. UI Design

See companion mockup: `preview-notifications.jsx` (combined SMS + Email Notifications preview)

### Navigation Path

Administration → Notifications → (flat submenu, shared with SMS channel)

| Submenu Item | Notes |
|---|---|
| SMS Connection | SMS-only |
| Email Connection | Email-only |
| **Test Triggers** | **Combined — single table, SMS + Email side by side in inline expansion** |
| **Message Templates** | **Combined — SMS and Email sections on the same page; per-recipient-type toggle per channel** |
| SMS Retry Policy | SMS-only |
| Email Retry Policy | Email-only |
| SMS Delivery Log | SMS-only |
| Email Delivery Log | Email-only |

### Interaction Patterns

Identical to SMS (sidebar submenu navigation, inline row expansion for trigger edits, `InlineNotification` for test send result and save confirmation).

---

## 8. Business Rules

**BR-001:** SMS and email retry/log retention config MAY share values from a single `NotificationRetryConfig` singleton, or each channel MAY have its own. Implementation preference: shared config to avoid duplication, with per-channel override capability in v2.

**BR-002:** Email and SMS are independent channels. Both fire if both are enabled, the result matches both trigger rules, and the provider has both `mobilePhone` and `email`. Neither channel's failure affects the other.

**BR-003:** `SKIPPED_NO_EMAIL` is not an error state — no `InlineNotification` is shown to admin on the config page. It is visible in the delivery log for operational visibility.

**BR-004:** SMTP password is stored and handled identically to the TextIt API token — AES-256 encrypted, masked in all GET responses and UI displays.

---

## 9. Localization (additions)

| i18n Key | Default English Text |
|---|---|
| `heading.emailConfig.title` | Email Notification Configuration |
| `heading.emailConfig.connection` | SMTP Connection |
| `heading.emailConfig.triggers` | Test Type Triggers |
| `heading.emailConfig.template` | Message Template |
| `heading.emailConfig.retryPolicy` | Retry Policy |
| `heading.emailLog.title` | Email Delivery Log |
| `label.emailConfig.smtpHost` | SMTP Host |
| `label.emailConfig.smtpPort` | SMTP Port |
| `label.emailConfig.username` | Username |
| `label.emailConfig.password` | Password |
| `label.emailConfig.fromAddress` | From Address |
| `label.emailConfig.fromName` | From Display Name |
| `label.emailConfig.useTls` | Use TLS/STARTTLS |
| `label.emailConfig.testRecipient` | Test Recipient Email |
| `label.emailConfig.subject` | Email Subject |
| `label.emailConfig.body` | Email Body |
| `label.emailLog.email` | Email |
| `label.emailStatus.skipped` | Skipped (No Email) |
| `button.emailConfig.sendTest` | Send Test Email |
| `message.emailConfig.testSuccess` | Test email sent successfully. |
| `error.emailConfig.connectionFailed` | Could not connect to SMTP server. Check host, port, and credentials. |
| `error.emailConfig.subjectRequired` | Email subject is required. |
| `error.emailConfig.bodyRequired` | Email body is required. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| smtpHost | Required | `error.emailConfig.hostRequired` |
| smtpPort | Required; integer 1–65535 | `error.emailConfig.portRange` |
| smtpUsername | Required | `error.emailConfig.usernameRequired` |
| smtpPassword | Required on first save | `error.emailConfig.passwordRequired` |
| fromAddress | Required; valid email format | `error.emailConfig.fromAddressInvalid` |
| subjectTemplate | Required; max 255 chars | `error.emailConfig.subjectRequired` |
| bodyTemplate | Required | `error.emailConfig.bodyRequired` |

---

## 11. Security & Permissions

Identical permission enforcement pattern to SMS (UI hide + API 403). Replace `sms.*` permission keys with `email.*` equivalents throughout.

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `email.config.view` can access Administration → Notifications → Email Notifications
- [ ] SMTP password stored encrypted; never returned in GET response
- [ ] "Send Test Email" sends to configured test recipient and shows success/error InlineNotification
- [ ] Email trigger rules are independent from SMS trigger rules
- [ ] Per-test-type email triggers editable via inline row expansion (no modal)
- [ ] "Use same template for all recipient types" toggle switches between single-editor and three-editor layout (Provider / Patient / Fixed Address) for email channel
- [ ] Each per-type subject + body template saves independently; preview renders `{{lab_number}}`, `{{provider_name}}`, and all other merge fields with example values
- [ ] At dispatch, correct template selected per FR-4.3-005 priority (rule custom → type-specific global → ALL global)
- [ ] Email dispatched to correct recipient (provider email, patient email, or manual address) based on firing rule's `recipientType`
- [ ] No email sent when provider has no email; log entry created as SKIPPED_NO_EMAIL
- [ ] Failed dispatch retries automatically (same retry config as SMS)
- [ ] Delivery log shows masked email addresses (`ja••••@moh.gov.pg`)
- [ ] Manual retry available for FAILED_PERMANENT entries

### Non-Functional

- [ ] All UI strings use i18n keys
- [ ] Email dispatch asynchronous — does not block final validation
- [ ] SMTP password AES-256 encrypted at rest

### Integration

- [ ] Dispatch fires on final validation only, independently of SMS channel
- [ ] `Provider.email` field present (Liquibase migration if absent)
- [ ] Both SMS and email can fire for the same result when both channels enabled and provider has both contact fields
