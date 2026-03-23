# TextIt SMS Notification Integration
## Functional Requirements Specification — v1.0

**Version:** 1.2
**Date:** 2026-03-23
**Status:** Draft for Review
**Jira:** OGC (story TBD — linked to OGC-435, OGC-436)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Results Entry, Final Validation, Administration, Provider Management

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

This feature integrates OpenELIS Global with TextIt (hosted RapidPro) to deliver SMS result notifications to ordering providers upon final result validation. It replaces GxAlert's SMS alert capability as part of the PNG v2 Aspect/GxAlert decommission programme. Administrators configure TextIt API credentials, define per-test-type SMS trigger rules, compose message templates with merge fields, and monitor delivery via a paginated delivery log with auto-retry.

---

## 2. Problem Statement

**Current state:** GxAlert (Aspect) delivers SMS alerts to clinicians when GeneXpert results are ready. With the full decommission of Aspect in favour of OpenELIS Global, there is no native mechanism to notify ordering providers by SMS when a result has been validated.

**Impact:** Clinicians currently rely on SMS alerts to act on TB/HIV results in a timely manner. Without SMS notification, turnaround time effectively increases by the time it takes a clinician to manually check the LIS or receive results by phone — a significant patient safety concern in resource-limited settings.

**Proposed solution:** Integrate OpenELIS with TextIt (hosted RapidPro) via its REST API. When a result reaches final validation, OpenELIS evaluates the per-test-type trigger rules for that result. If the result interpretation matches the configured trigger condition, OpenELIS dispatches an SMS to the ordering provider's mobile number using a configurable message template. Delivery status is tracked in a delivery log with automatic retry (3 attempts, 15-minute intervals).

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| System Administrator | Full config + log view | Can configure TextIt credentials, edit all trigger rules, edit message template, view all delivery logs |
| Lab Manager | Log view only | Can view delivery log, manually retry failed messages; cannot edit config |
| Lab Technician | None | No access to SMS config or delivery log |

**Required permission keys:**

- `sms.config.view` — View TextIt connection config, trigger rules, message template
- `sms.config.modify` — Edit TextIt credentials, trigger rules, message template, retry policy
- `sms.log.view` — View SMS delivery log
- `sms.log.retry` — Manually retry a failed SMS delivery

---

## 4. Functional Requirements

### 4.1 TextIt Connection Configuration

**FR-4.1-001:** The system MUST provide a configuration form to store the TextIt REST API base URL, API token, and sending channel identifier (Flow or Broadcast channel UUID).

**FR-4.1-002:** The API token MUST be stored encrypted at rest. It MUST NOT be returned in plain text in any GET API response; the UI MUST display a masked placeholder (e.g., `••••••••`) once saved.

**FR-4.1-003:** The system MUST provide a "Test Connection" action that sends a test request to the TextIt API and displays an `InlineNotification` (kind="success" or kind="error") with the result.

**FR-4.1-004:** The system MUST allow the administrator to enable or disable the SMS integration globally via a Toggle without deleting saved credentials.

### 4.2 Per-Test-Type SMS Trigger Rules

**FR-4.2-001:** The system MUST allow administrators to configure, per test type, one or more **recipient rules**. Each rule targets a specific recipient and carries its own trigger conditions and an optional custom message template override. A single test type may have multiple rules — for example, send to the ordering provider on REACTIVE and to a fixed district coordinator number on any REACTIVE result with a different message.

**FR-4.2-001a:** Supported recipient types per rule:
- `ORDERING_PROVIDER` — mobile phone number from the ordering provider record.
- `PATIENT` — mobile phone number from the patient record.
- `MANUAL` — a fixed phone number entered by the administrator (e.g., district TB coordinator). Stored per-rule.

**FR-4.2-001b:** Each rule fires independently at final validation. Multiple rules on a single test type each produce a separate dispatch attempt and separate delivery log entry.

**FR-4.2-001c:** If a rule's recipient type is `PATIENT` or `ORDERING_PROVIDER` and no corresponding phone number exists on file, dispatch MUST be skipped and logged as `SKIPPED_NO_PHONE`.

**FR-4.2-002:** For **Coded result tests**, each recipient rule's trigger conditions MUST support:
- A multi-select checklist of specific result values to fire on (e.g., "MTB DETECTED", "RIF RESISTANT").
- An independent "Critical flag" toggle — fires when the result carries the OpenELIS critical flag, regardless of coded value.
- An independent "Non-Normal flag" toggle — fires when the result is flagged outside reference range.
- Conditions are OR'd: dispatch fires if ANY checked condition matches.

**FR-4.2-003:** For **Numeric result tests**, each recipient rule's trigger conditions MUST support:
- Trigger mode: "Fire when value is outside range", "Fire when value is inside range", or "Fire for all results".
- Low bound (optional) and High bound (optional) numeric fields.
- Independent "Critical flag" and "Non-Normal flag" toggles.
- Numeric range and flag conditions are OR'd.

**FR-4.2-004:** Each recipient rule MUST support a **custom message template override** — a toggle that, when enabled, replaces the global SMS template for that specific recipient. Supports all standard merge fields. If disabled, the global template is used.

**FR-4.2-005:** The trigger rules table MUST list all active test types in the system (potentially 300+), read from the existing OpenELIS test catalog. The table MUST support: free-text search by test type name; filter by lab unit/section; pagination (default 10 rows per page).

**FR-4.2-006:** Each test type defaults to DISABLED (enabled: false, one rule targeting ORDERING_PROVIDER with no conditions set). A new test type added to the catalog inherits this default.

**FR-4.2-007:** Editing a trigger rule MUST use inline row expansion (not a modal) per Constitution Principle 3.

**FR-4.2-008:** The system MUST allow bulk-disabling all test types via a toolbar "Disable All" action.

**FR-4.2-009:** The trigger table summary column MUST show: gray "Disabled", warm-gray "Not Configured", or green "N rules — Provider + Patient" etc. reflecting the number of active rules and recipient types.

### 4.3 Message Template Engine

**FR-4.3-001:** The system MUST provide configurable SMS message templates **per recipient type**: `ORDERING_PROVIDER`, `PATIENT`, and `MANUAL`. At dispatch, the template selected is the one whose recipient type matches the firing rule's `recipientType`. If no type-specific template is saved, the system falls back to the `ALL` (global) template.

**FR-4.3-001a:** A **"Use same template for all recipient types"** toggle MUST be available at the top of the Message Templates configuration page. When enabled, a single `ALL` template is displayed and used for every recipient type. When disabled, three separate template editors are shown — one per recipient type — each independently editable with its own merge field toolbar and live preview.

**FR-4.3-001b:** Default template content per recipient type:
- **Ordering Provider:** `OpenELIS: {{test_name}} for {{patient_id}} — Result: {{result}}. Validated: {{validated_at}}. Lab #: {{lab_number}}.`
- **Patient:** `Your {{test_name}} result is ready: {{result}}. Please contact your healthcare provider. Lab #: {{lab_number}}.`
- **Fixed Address:** `ALERT [{{facility}}] {{test_name}} | Patient: {{patient_id}} | Result: {{result}} | Validated: {{validated_at}} | Lab #: {{lab_number}}`

**FR-4.3-002:** Each template editor MUST support the following merge fields, insertable via a helper toolbar:

| Merge Field | Resolved Value |
|---|---|
| `{{patient_id}}` | OpenELIS patient ID |
| `{{test_name}}` | Name of the test type |
| `{{result}}` | Result interpretation text (e.g., MTB DETECTED) |
| `{{facility}}` | Facility name of the ordering site |
| `{{validated_at}}` | Date/time of final validation (ISO 8601 local) |
| `{{lab_number}}` | OpenELIS lab number for the sample |

**FR-4.3-003:** Each template editor MUST display a live character count and a rendered preview with example values substituted.

**FR-4.3-004:** The system MUST warn (not block) when a template exceeds 160 characters (1 SMS segment), and block save when any template exceeds 480 characters.

**FR-4.3-005:** Template dispatch priority order (highest to lowest): (1) rule-level `customTemplate` (set per `SmsRecipientRule`), (2) recipient-type-specific global template, (3) `ALL` global template. At least one of (2) or (3) must be saved — the system MUST NOT dispatch with an empty template.

### 4.4 SMS Dispatch (Backend)

**FR-4.4-001:** The system MUST hook into the final validation event in OpenELIS. When a result reaches final validation status, the SMS dispatch service MUST be invoked.

**FR-4.4-002:** For each final-validated result, the dispatch service MUST iterate over all `SmsRecipientRule` rows for the result's test type and evaluate each independently using the trigger evaluation logic in Section 5. Each matching rule produces a separate dispatch attempt and a separate `SmsDeliveryLog` entry.

**FR-4.4-003:** If the parent `SmsTestTypeTrigger.enabled = false`, all rules for that test type are skipped (no dispatch, no log entries for any rule).

**FR-4.4-004:** The dispatch service MUST render the applicable template using the priority order defined in FR-4.3-005: (1) rule-level `customTemplate`, (2) recipient-type-specific global template (`ORDERING_PROVIDER`, `PATIENT`, or `MANUAL`), (3) `ALL` global template. All merge fields are substituted with resolved values for the result and recipient. Unresolvable merge fields are replaced with an empty string (not the literal token).

**FR-4.4-005:** The dispatch service MUST POST to the TextIt Broadcasts API with the rendered message and resolved recipient phone number. The request MUST include the configured API token as a Bearer token.

**FR-4.4-006:** The dispatch service MUST create an `SmsDeliveryLog` entry for every dispatch attempt with status PENDING, then update to DELIVERED or FAILED based on the TextIt API response.

**FR-4.4-007:** If the global SMS integration Toggle is disabled, the dispatch service MUST be a no-op (no API calls, no log entries).

### 4.5 Retry Logic

**FR-4.5-001:** If a dispatch attempt fails (TextIt API returns a non-2xx response or times out), the system MUST automatically retry up to 3 times with a 15-minute interval between attempts.

**FR-4.5-002:** After 3 failed attempts, the delivery log entry MUST be marked as FAILED_PERMANENT. No further automatic retries MUST occur.

**FR-4.5-003:** The maximum retry count (default 3) and retry interval (default 15 minutes) MUST be configurable by a system administrator.

**FR-4.5-004:** A user with `sms.log.retry` permission MUST be able to manually trigger a retry of a FAILED_PERMANENT log entry. A manual retry resets the attempt counter and restarts the automatic retry cycle.

### 4.6 SMS Delivery Log

**FR-4.6-001:** The system MUST provide a paginated delivery log table showing all SMS dispatch attempts with columns: Lab Number, Test Type, Provider Name, Phone (masked), Result, Status, Attempts, Last Attempt At, Actions.

**FR-4.6-002:** The delivery log MUST be filterable by Status (ALL / DELIVERED / FAILED_PERMANENT / PENDING / RETRYING / SKIPPED_NO_PHONE) and by date range.

**FR-4.6-003:** Status MUST be rendered using Carbon `Tag` with semantic kinds: DELIVERED=green, FAILED_PERMANENT=red, PENDING=blue, RETRYING=warm-gray, SKIPPED_NO_PHONE=gray.

**FR-4.6-004:** The Actions column MUST show a "Retry" button only for FAILED_PERMANENT entries and only when the user holds `sms.log.retry` permission.

**FR-4.6-005:** The delivery log MUST retain entries for a configurable retention period (default 90 days). Older entries MUST be automatically purged by a scheduled job.

---

## 5. Data Model

### New Entities

**SmsNotificationConfig**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key, singleton (only one row) |
| enabled | Boolean | Yes | Global on/off switch |
| textitBaseUrl | String(255) | Yes | TextIt REST API base URL |
| textitApiToken | String(512) | Yes | Encrypted at rest; never returned in GET |
| textitChannelUuid | String(255) | Yes | TextIt Flow or Broadcast channel UUID |
| sameTemplateForAll | Boolean | Yes | When true, `messageTemplateAll` is used for all recipient types; default: false |
| messageTemplateAll | String(480) | No | Global fallback template used when `sameTemplateForAll = true` or no type-specific template is set |
| messageTemplateProvider | String(480) | No | Template for ORDERING_PROVIDER recipients |
| messageTemplatePatient | String(480) | No | Template for PATIENT recipients |
| messageTemplateManual | String(480) | No | Template for MANUAL (fixed address) recipients |
| maxRetries | Integer | Yes | Default: 3 |
| retryIntervalMinutes | Integer | Yes | Default: 15 |
| logRetentionDays | Integer | Yes | Default: 90 |
| updatedAt | Timestamp | Yes | Last config save timestamp |
| updatedBy | String(100) | Yes | Username of last editor |

**SmsTestTypeTrigger** — one row per test type; holds the master enabled flag and is the parent to `SmsRecipientRule`.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| testTypeId | Long | Yes | FK → Test (existing entity); unique constraint |
| enabled | Boolean | Yes | Global on/off for this test type; default: false |
| updatedAt | Timestamp | Yes | Last updated timestamp |
| updatedBy | String(100) | Yes | Username of last editor |

**SmsRecipientRule** — one row per recipient rule on a test type. A test type may have multiple rules.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| triggerId | Long | Yes | FK → SmsTestTypeTrigger |
| sortOrder | Integer | Yes | Display/evaluation order; default: insertion order |
| recipientType | Enum | Yes | ORDERING_PROVIDER, PATIENT, MANUAL |
| manualPhoneNumber | String(50) | No | Populated only when recipientType = MANUAL |
| triggerOnValues | JSON/Text | No | Coded tests: list of specific result value strings. Null = none. |
| triggerOnCritical | Boolean | Yes | Fire on Critical flag; default: false |
| triggerOnNonNormal | Boolean | Yes | Fire on Non-Normal flag; default: false |
| numericMode | Enum | No | OUTSIDE_RANGE, INSIDE_RANGE, ALL. Null for Coded tests. |
| numericLow | Double | No | Lower bound; null = no lower bound |
| numericHigh | Double | No | Upper bound; null = no upper bound |
| useCustomTemplate | Boolean | Yes | If true, customTemplate overrides global template; default: false |
| customTemplate | String(480) | No | Per-recipient message template; null = use global |
| updatedAt | Timestamp | Yes | Last updated |

**Trigger evaluation logic (backend) — per SmsRecipientRule:**
1. If parent `SmsTestTypeTrigger.enabled = false` → skip all rules, no dispatch.
2. For each `SmsRecipientRule` on the test type:
   a. Resolve recipient phone: look up ORDERING_PROVIDER or PATIENT phone; if not found, log SKIPPED_NO_PHONE and continue to next rule. For MANUAL, use `manualPhoneNumber`.
   b. Evaluate trigger conditions (OR logic): `result.value IN triggerOnValues` OR (`triggerOnCritical AND result.isCritical`) OR (`triggerOnNonNormal AND result.isNonNormal`) OR numeric range match (for numeric tests).
   c. If no condition matches → no dispatch for this rule (no log entry).
   d. Render template per FR-4.3-005 priority: `customTemplate` (rule) → type-specific global template (`messageTemplateProvider` / `messageTemplatePatient` / `messageTemplateManual`) → `messageTemplateAll`.
   e. POST to TextIt Broadcasts API. Create `SmsDeliveryLog` entry for this rule/recipient.

**SmsDeliveryLog**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| analysisId | Long | Yes | FK → Analysis (result record) |
| testTypeId | Long | Yes | FK → Test |
| providerId | Long | No | FK → Provider; null if no provider on order |
| providerPhone | String(30) | No | Phone at time of dispatch (snapshot) |
| renderedMessage | String(480) | Yes | Fully rendered SMS text (snapshot) |
| status | Enum | Yes | PENDING, DELIVERED, RETRYING, FAILED_PERMANENT, SKIPPED_NO_PHONE |
| attemptCount | Integer | Yes | Default: 0 |
| lastAttemptAt | Timestamp | No | Timestamp of most recent attempt |
| deliveredAt | Timestamp | No | Set when status transitions to DELIVERED |
| textitMessageId | String(255) | No | TextIt message ID returned on success |
| errorDetail | String(1000) | No | Last error response from TextIt API |
| createdAt | Timestamp | Yes | Log entry creation time |

### Modified Entities

**Provider** — Verify field presence (add if missing):

| Field | Type | Notes |
|---|---|---|
| mobilePhone | String(30) | Provider's mobile number for SMS delivery; E.164 format |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/sms/config` | Get SMS config (token masked) | `sms.config.view` |
| PUT | `/api/v1/sms/config` | Save/update SMS config | `sms.config.modify` |
| POST | `/api/v1/sms/config/test-connection` | Test TextIt API connectivity | `sms.config.modify` |
| GET | `/api/v1/sms/triggers` | List all test type trigger rules | `sms.config.view` |
| PUT | `/api/v1/sms/triggers/{testTypeId}` | Update trigger rule for a test type | `sms.config.modify` |
| PUT | `/api/v1/sms/triggers/bulk-disable` | Set all triggers to DISABLED | `sms.config.modify` |
| GET | `/api/v1/sms/log` | List delivery log entries (paginated, filterable) | `sms.log.view` |
| GET | `/api/v1/sms/log/{id}` | Get single delivery log entry detail | `sms.log.view` |
| POST | `/api/v1/sms/log/{id}/retry` | Manually retry a FAILED_PERMANENT entry | `sms.log.retry` |

---

## 7. UI Design

See companion React mockup: `textit-sms-integration-mockup.jsx`

### Navigation Path

Administration → Notifications → (flat submenu)

| Submenu Item | Page |
|---|---|
| SMS Connection | TextIt API credentials, global enable toggle, Test Connection |
| Email Connection | SMTP credentials, global enable toggle, Send Test Email |
| **Test Triggers** | **Combined SMS + Email trigger rules — single table, dual-panel inline edit** |
| **Message Templates** | **Combined SMS + Email templates — per-recipient type, "same for all" toggle** |
| SMS Retry Policy | maxRetries, retryIntervalMinutes, logRetentionDays |
| Email Retry Policy | (same fields, email channel) |
| SMS Delivery Log | Filterable log, retry action |
| Email Delivery Log | (same structure, email channel) |

Note: SMS and Email triggers/templates were previously separate submenus. They are now unified pages shared by both channels to simplify administration. See `preview-notifications.jsx` for the combined UI mockup.

### Key Screens

1. **SMS Connection** — TextIt API URL, token (masked), channel UUID, global enable Toggle, Test Connection button
2. **Test Triggers** *(shared)* — DataTable of test types; columns: Test Type, Result Type, 📱 SMS summary tag, ✉ Email summary tag, Edit; inline row expansion shows SMS and Email rule-card panels side by side
3. **Message Templates** *(shared)* — "Use same template for all recipient types" toggle; when off: three editors (Ordering Provider / Patient / Fixed Address) each with textarea, merge field toolbar, live preview; applies independently to SMS and Email sections on the same page
4. **SMS Retry Policy** — maxRetries NumberInput, retryIntervalMinutes NumberInput, logRetentionDays NumberInput
5. **SMS Delivery Log** — Filterable DataTable; Tag-based status; Retry button on FAILED_PERMANENT rows

### Interaction Patterns

- **Sidebar submenu** (not tabs) for separating configuration concerns — per OpenELIS navigation constitution
- **Inline row expansion** for editing per-test-type trigger rules — no modal
- `InlineNotification` for Test Connection result (success/error) and save confirmation
- Phone number in delivery log displayed masked: `+675 •••• ••89`

---

## 8. Business Rules

**BR-001:** The TextIt API token MUST be encrypted at rest using AES-256. The token MUST never be included in any GET API response body. The UI MUST replace the stored value with a masked placeholder on page load.

**BR-002:** If an ordering provider has no mobile phone number on their provider record, the dispatch service MUST skip SMS and log the attempt as SKIPPED_NO_PHONE. No error or alert is raised — this is an expected operational state.

**BR-003:** A new test type added to the test catalog MUST automatically receive a trigger rule of DISABLED. The trigger rule record is created by a database trigger or application hook on test type creation.

**BR-004:** The message template MUST be rendered server-side immediately before dispatch. Merge fields that cannot be resolved (e.g., missing facility name) MUST be replaced with an empty string, not the literal merge field token.

**BR-005:** If the global SMS integration Toggle is set to disabled, no SMS dispatch occurs regardless of trigger rule configuration. The Toggle state is evaluated first in the dispatch decision tree.

**BR-006:** Auto-retry attempts MUST be executed by a background scheduler (Spring `@Scheduled`). They MUST NOT block the result validation flow. Final validation completes successfully regardless of SMS dispatch outcome.

**BR-007:** A manual retry (via `POST /api/v1/sms/log/{id}/retry`) resets `attemptCount` to 0 and sets `status` to PENDING, restarting the auto-retry cycle. Only entries with status FAILED_PERMANENT are eligible.

**BR-008:** The delivery log retention job MUST run nightly. Entries older than `logRetentionDays` with status DELIVERED or SKIPPED_NO_PHONE MUST be purged. FAILED_PERMANENT entries MUST be retained for an additional 30 days beyond the retention period for audit purposes.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.smsConfig.title` | SMS / TextIt Notification Configuration |
| `heading.smsConfig.connection` | TextIt Connection |
| `heading.smsConfig.triggers` | Test Type Triggers |
| `heading.smsConfig.template` | Message Template |
| `heading.smsConfig.retryPolicy` | Retry Policy |
| `heading.smsLog.title` | SMS Delivery Log |
| `label.smsConfig.enabled` | Enable SMS Notifications |
| `label.smsConfig.baseUrl` | TextIt API Base URL |
| `label.smsConfig.apiToken` | API Token |
| `label.smsConfig.channelUuid` | Channel UUID |
| `label.smsConfig.sameTemplateForAll` | Use same template for all recipient types |
| `label.smsConfig.templateAll` | Template (all recipient types) |
| `label.smsConfig.templateProvider` | Ordering Provider Template |
| `label.smsConfig.templatePatient` | Patient Template |
| `label.smsConfig.templateManual` | Fixed Address Template |
| `label.smsConfig.characterCount` | {{count}} / 480 characters ({{segments}} SMS segment(s)) |
| `label.smsConfig.maxRetries` | Maximum Retry Attempts |
| `label.smsConfig.retryInterval` | Retry Interval (minutes) |
| `label.smsConfig.logRetention` | Log Retention (days) |
| `label.smsLog.labNumber` | Lab Number |
| `label.smsLog.testType` | Test Type |
| `label.smsLog.provider` | Provider |
| `label.smsLog.phone` | Phone |
| `label.smsLog.result` | Result |
| `label.smsLog.status` | Status |
| `label.smsLog.attempts` | Attempts |
| `label.smsLog.lastAttempt` | Last Attempt |
| `label.smsStatus.delivered` | Delivered |
| `label.smsStatus.failed` | Failed |
| `label.smsStatus.pending` | Pending |
| `label.smsStatus.retrying` | Retrying |
| `label.smsStatus.skipped` | Skipped (No Phone) |
| `button.smsConfig.save` | Save Configuration |
| `button.smsConfig.testConnection` | Test Connection |
| `button.smsConfig.bulkDisable` | Disable All |
| `button.smsConfig.insertField` | Insert Merge Field |
| `button.smsLog.retry` | Retry |
| `message.smsConfig.saveSuccess` | SMS configuration saved successfully. |
| `message.smsConfig.connectionSuccess` | Connection to TextIt API successful. |
| `message.smsConfig.tokenMasked` | API token is saved. Enter a new value to replace it. |
| `error.smsConfig.baseUrlRequired` | TextIt API Base URL is required. |
| `error.smsConfig.tokenRequired` | API Token is required. |
| `error.smsConfig.channelUuidRequired` | Channel UUID is required. |
| `error.smsConfig.templateTooLong` | Message template cannot exceed 480 characters. |
| `error.smsConfig.connectionFailed` | Could not connect to TextIt API. Check the URL and token. |
| `placeholder.smsConfig.baseUrl` | https://textit.com/api/v2 |
| `placeholder.smsConfig.apiToken` | ••••••••••••••••••••••••••••••••••• |
| `placeholder.smsConfig.channelUuid` | e.g. 12345678-abcd-efgh-ijkl-000000000000 |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| textitBaseUrl | Required; must be valid URL (https) | `error.smsConfig.baseUrlRequired` |
| textitApiToken | Required on first save; optional on update (blank = keep existing) | `error.smsConfig.tokenRequired` |
| textitChannelUuid | Required | `error.smsConfig.channelUuidRequired` |
| messageTemplateAll / messageTemplateProvider / messageTemplatePatient / messageTemplateManual | At least one non-empty template required; each present template must be max 480 characters | `error.smsConfig.templateTooLong` |
| maxRetries | Required; integer 1–10 | `error.smsConfig.maxRetriesRange` |
| retryIntervalMinutes | Required; integer 5–120 | `error.smsConfig.retryIntervalRange` |
| logRetentionDays | Required; integer 30–365 | `error.smsConfig.retentionDaysRange` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View SMS config | `sms.config.view` | Page not shown in Administration menu |
| Save SMS config | `sms.config.modify` | Save button hidden; API returns 403 |
| Test connection | `sms.config.modify` | Test Connection button hidden; API returns 403 |
| Edit trigger rules | `sms.config.modify` | Edit button hidden in trigger table; API returns 403 |
| Bulk disable triggers | `sms.config.modify` | Disable All button hidden; API returns 403 |
| View delivery log | `sms.log.view` | Delivery Log page not shown in Administration menu |
| Retry failed SMS | `sms.log.retry` | Retry button hidden; API returns 403 |

**Additional security requirements:**

- The TextIt API token MUST be encrypted at rest using AES-256 with the OpenELIS application encryption key.
- The token MUST be excluded from all GET API responses. The `textitApiToken` field in the response MUST be replaced with a constant masked string.
- Provider phone numbers in the delivery log MUST be displayed masked in the UI (last 2 digits visible only).
- All admin config endpoints MUST require authentication. Unauthenticated requests MUST return HTTP 401.

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `sms.config.view` can access Administration → Notifications → SMS / TextIt Configuration
- [ ] User with `sms.config.modify` can save TextIt credentials and the API token is not returned in plain text in any subsequent GET response
- [ ] Test Connection button returns success notification when TextIt API is reachable with valid credentials
- [ ] Test Connection button returns error notification with descriptive message when credentials are invalid
- [ ] Disabling the global SMS Toggle prevents any SMS from being dispatched on result validation
- [ ] Per-test-type trigger rules are editable via inline row expansion without opening a modal
- [ ] Bulk Disable All sets all test type trigger conditions to DISABLED
- [ ] "Use same template for all recipient types" toggle switches between single-editor and three-editor (Provider / Patient / Fixed Address) layout
- [ ] Each per-type template saves independently; preview renders `{{lab_number}}` and all other merge fields with example values
- [ ] Save is blocked when any template exceeds 480 characters
- [ ] At dispatch, the correct template is selected per FR-4.3-005 priority order (rule custom → type-specific global → ALL global)
- [ ] SMS is dispatched to the correct recipient (ordering provider, patient, or manual address) based on the firing rule's `recipientType`
- [ ] No SMS is dispatched when provider has no mobile phone number; log entry created as SKIPPED_NO_PHONE
- [ ] Failed SMS delivery is retried automatically up to 3 times at 15-minute intervals
- [ ] After 3 failed attempts, log entry is marked FAILED_PERMANENT
- [ ] User with `sms.log.retry` can manually retry a FAILED_PERMANENT entry; retry resets attempt counter
- [ ] Delivery log shows correct status Tags (green/red/blue/warm-gray/gray) per status value
- [ ] Delivery log is filterable by status and date range

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] API token encrypted at rest; never returned in GET response
- [ ] SMS dispatch is asynchronous — final validation completes regardless of SMS outcome
- [ ] Page loads within 2 seconds under typical network conditions
- [ ] Permissions enforced at API layer (HTTP 403 for unauthorized requests)

### Integration

- [ ] SMS dispatch hook fires on OpenELIS final validation event (not intermediate validation)
- [ ] TextIt Broadcasts API called with correct Bearer token and E.164-formatted phone number
- [ ] Delivery log `textitMessageId` populated from TextIt API response on successful dispatch
- [ ] Provider `mobilePhone` field present on provider record and accessible to dispatch service
