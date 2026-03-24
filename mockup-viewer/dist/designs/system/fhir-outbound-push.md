# FHIR Outbound Push — National Hub Integration
## Functional Requirements Specification — v1.0

**Version:** 1.1
**Date:** 2026-03-24
**Status:** Draft for Review
**Amendment:** v1.1 — Added Private Key JWT (RFC 7523 / signed assertion) as a fourth authentication type; adds key management UI, JWT signing service, and HAPI FHIR interceptor configuration guidance.
**Jira:** OGC (story TBD)
**Technology:** Java Spring Framework, HAPI FHIR R4, Carbon React
**Related Modules:** Results Entry, Final Validation, Administration, FHIR Transform Service
**Related FRS:** `FRS_TextIt_SMS_Integration.md`, `FRS_Email_Notification_Integration.md`

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Background — Existing FHIR Infrastructure
4. User Roles & Permissions
5. Functional Requirements
6. Data Model
7. API Endpoints
8. UI Design
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria

---

## 1. Executive Summary

This feature adds an event-driven FHIR outbound push capability to OpenELIS Global, enabling each lab site to automatically report validated results to a central HAPI FHIR R4 server in real time. When a result reaches final validation, OpenELIS assembles a FHIR Bundle (DiagnosticReport + Observations + referenced resources) and POSTs it to the configured central FHIR store. Failed pushes auto-retry and are surfaced in an admin delivery log. Configuration — including the remote FHIR endpoint, authentication credentials, and per-site facility Organisation ID — is managed through the OpenELIS admin UI.

This is the integration layer for the PNG v2 national laboratory hub: multiple OpenELIS instances (federated per lab site, or a shared instance with site isolation) all push validated results to one central HAPI FHIR server, creating a national aggregated laboratory result repository for surveillance, reporting, and downstream system consumption.

---

## 2. Problem Statement

**Current state:** OpenELIS has a complete FHIR R4 transformation layer (`FhirTransformServiceImpl`) and a subscriber mechanism (`org.openelisglobal.fhir.subscriber`) capable of pushing FHIR resources to a remote server. However, the transform runs as a batch job (triggered on application boot or via a manual GET endpoint), not in real time on result validation. There is no admin UI for configuring the remote FHIR endpoint, and no delivery log for monitoring or retrying failed pushes. All FHIR configuration requires editing `application.properties` files on each server.

**Proposed solution:** Wire the existing FHIR transform and push infrastructure to the final validation event, add an admin-configurable connection page (remote URL, auth, facility Organisation ID), and add a delivery log with auto-retry — following the same pattern as the SMS and Email notification channels.

**Out of scope:** The Task-based inbound lab order workflow (OpenMRS/EMR → OpenELIS via FHIR Task) is not in scope for this story. PNG lab sites enter orders directly in OpenELIS; no inbound FHIR order polling is required.

---

## 3. Background — Existing FHIR Infrastructure

The following components already exist and are **not rebuilt** by this story:

| Component | Location | What it does |
|---|---|---|
| `FhirTransformServiceImpl` | `dataexchange/fhir/service` | Transforms OpenELIS entities → FHIR R4: Patient, DiagnosticReport, Observation, ServiceRequest, Specimen, Task, Practitioner, Organization |
| `FhirPersistanceService` | `dataexchange/fhir/service` | Saves FHIR resources to the local HAPI FHIR sidecar |
| `DataExportService` | `dataexchange/fhir` | Pushes resources from local FHIR store to configured remote subscriber |
| `FhirTransformationController` | `fhir/transormation/controller` | Batch trigger: transforms Patients and Samples on boot or via GET `/OEToFhir` |
| `FhirFacilityOrganizationService` | `dataexchange/fhir/service` | Manages facility Organisation resources |
| Local HAPI FHIR sidecar | `application.properties` → `org.openelisglobal.fhirstore.uri` | Local FHIR store running alongside OpenELIS |
| Subscriber mechanism | `org.openelisglobal.fhir.subscriber` | Pushes subscribed resource types to a remote FHIR server |
| LOINC codes | Test catalog | Every test type and panel has a LOINC code — terminology mapping is complete |

**What this story adds:** An event-driven trigger on final validation, an admin configuration UI, and a delivery log with retry.

---

## 4. User Roles & Permissions

| Permission Key | Description |
|---|---|
| `fhir.outbound.config.view` | View FHIR outbound connection config and delivery log |
| `fhir.outbound.config.modify` | Edit remote FHIR URL, auth credentials, facility ID, retry policy, enable/disable |
| `fhir.outbound.log.view` | View FHIR delivery log |
| `fhir.outbound.log.retry` | Manually retry a FAILED_PERMANENT push entry |

---

## 5. Functional Requirements

### 5.1 FHIR Outbound Connection Configuration

**FR-5.1-001:** The system MUST provide a configuration form with the following fields:
- Remote FHIR Base URL (e.g., `https://hapi.nationallab.pg/fhir`)
- Authentication Type: BEARER_TOKEN, BASIC, NONE, or PRIVATE_KEY_JWT
- Auth Token / Password (masked; encrypted at rest)
- Auth Username (shown only when auth type is BASIC)
- Facility FHIR Organisation ID — the FHIR `Organization` resource ID for this lab site in the central FHIR store (e.g., `Organization/png-pom-national-lab`)
- Global enable/disable Toggle

**FR-5.1-002:** Auth token and password MUST be stored encrypted at rest (AES-256, same key infrastructure as OGC-437 TextIt token) and MUST NOT be returned in GET responses.

**FR-5.1-003:** A **"Test Connection"** action MUST attempt a FHIR capability statement request (`GET [baseUrl]/metadata`) to the configured remote URL with the configured auth credentials and display an `InlineNotification` with the result (success shows FHIR server version; error shows HTTP status and message).

**FR-5.1-004:** When the global enable Toggle is disabled, no FHIR push fires on validation. Existing queued PENDING/RETRYING entries continue to retry regardless of this toggle (they were already committed).

### 5.1a Private Key JWT Authentication (v1.1)

**FR-5.1-005:** When auth type = `PRIVATE_KEY_JWT`, the Connection page MUST display a **Key Management** section below the auth type selector containing:
- A key status indicator (Carbon `Tag`: green `ACTIVE` or red `NOT CONFIGURED`) with algorithm, public key fingerprint (SHA-256, first 16 chars), and key creation date when ACTIVE
- A **"Generate New Key Pair"** button
- An **"Upload Private Key (PEM)"** accordionItem (collapsed by default — less-common path)
- When a key is ACTIVE: a read-only monospace `TextArea` displaying the full public key PEM, with a "Copy Public Key" button
- JWT configuration fields: Issuer ID, JWT Audience, Token Expiry
- An informational `InlineNotification` (info kind) explaining that the public key must be registered on the HAPI FHIR server

**FR-5.1-006:** "Generate New Key Pair" MUST:
- Call `POST /api/v1/fhir/outbound/config/keys/generate` — generates RSA-2048 key pair server-side
- Store the private key AES-256 encrypted at rest (never returned in any API response)
- Derive and store the public key PEM and SHA-256 fingerprint
- Display the public key immediately in the read-only `TextArea`
- Show a success `InlineNotification`: "Key pair generated. Copy the public key and register it on the HAPI FHIR server before enabling."
- If a key already exists, show a destructive confirmation before overwriting (this is the one permitted modal use — irreversible replacement)

**FR-5.1-007:** "Upload Private Key (PEM)" accordion MUST accept a PKCS8 or PKCS1 PEM-encoded RSA or EC private key pasted into a `TextArea`. On upload, the system MUST:
- Validate the PEM is parseable as a supported private key type
- Derive the corresponding public key from the uploaded private key
- Store the private key AES-256 encrypted; display the derived public key and fingerprint
- Reject with inline `invalidText` if the PEM cannot be parsed: "Invalid PEM format. Please provide a valid PKCS8 or PKCS1 private key."

**FR-5.1-008:** The public key `TextArea` MUST be read-only with `aria-label` "Public key PEM". A "Copy Public Key" button MUST copy the full PEM to the clipboard and briefly display "Copied!" inline.

**FR-5.1-009:** A "Remove Key" ghost button MUST be shown when a key is ACTIVE. Clicking it MUST show a destructive confirmation modal (permitted — irreversible). On confirmation: delete the key, reset status to NOT CONFIGURED, and automatically set the global enable Toggle to `false`.

**FR-5.1-010:** The global enable Toggle MUST be disabled (non-interactive, with helper text) when auth type = `PRIVATE_KEY_JWT` and key status = NOT CONFIGURED. Helper text: "Configure a key pair before enabling Private Key JWT authentication."

**FR-5.1-011:** JWT Configuration fields (shown only when auth type = `PRIVATE_KEY_JWT`):
- **Issuer ID** (`iss` / `sub` claim) — unique identifier for this OpenELIS instance as registered on the HAPI FHIR server. Required. Max 255 chars. Example: `png-site-portmoresby-lab`
- **JWT Audience** (`aud` claim) — defaults to the Remote FHIR Base URL value. Can be overridden. Required. Must be a valid HTTPS URL.
- **Token Expiry** (minutes) — how long each signed JWT is valid. Integer 1–60. Default: 10 minutes.

### 5.2 Event-driven Push on Final Validation

**FR-5.2-001:** On the final validation event, the system MUST, asynchronously and non-blocking:

   a. Call `FhirTransformService` to transform the validated sample's entities into FHIR resources (Patient, DiagnosticReport, Observation(s), Specimen) and persist them to the local HAPI FHIR sidecar.

   b. Assemble a FHIR `transaction` Bundle containing:
   - `DiagnosticReport` (status: `final`) with LOINC code from the test type
   - `Observation`(s) for each result component — LOINC code from the test/panel; value as `valueQuantity` (numeric) or `valueCodeableConcept` (coded)
   - `Patient` (conditional create using patient identifier as `ifNoneExist`)
   - `Organization` (conditional create using the configured facility Organisation ID)
   - `Specimen` (linked from DiagnosticReport)

   c. POST the Bundle to `[remoteBaseUrl]` with the configured auth header.

   d. Write one `FhirDeliveryLog` entry with the outcome (DELIVERED, PENDING for first-time failures).

**FR-5.2-002:** The push MUST fire on final validation only — not on preliminary results, result corrections before final validation, or administrative saves.

**FR-5.2-003:** The `DiagnosticReport.performer` MUST reference the facility Organisation using the configured Facility FHIR Organisation ID, so the central FHIR server can attribute the result to the correct lab site.

**FR-5.2-004:** If the global enable Toggle is disabled, the validation event listener MUST skip the FHIR push entirely and NOT create a `FhirDeliveryLog` entry.

**FR-5.2-005:** If the remote FHIR server returns a 2xx response, the log entry MUST be written as DELIVERED. If it returns a 4xx (non-retryable) response, FAILED_PERMANENT. If it returns a 5xx, network timeout, or connection error, PENDING (eligible for auto-retry).

### 5.3 FHIR Delivery Log

**FR-5.3-001:** The system MUST provide a paginated delivery log table (20 rows/page) with columns: Lab Number, Test Type, Patient ID, FHIR DiagnosticReport ID, Status, Attempts, Last Attempt, Actions.

**FR-5.3-002:** Status MUST be displayed as a Carbon `Tag` with the following kinds:

| Status | Tag Kind | Meaning |
|---|---|---|
| DELIVERED | green | Successfully pushed and accepted by remote FHIR server |
| PENDING | blue | Queued; first attempt not yet made or in progress |
| RETRYING | yellow | At least one failure; next retry scheduled |
| FAILED_PERMANENT | red | All retry attempts exhausted |

**FR-5.3-003:** The log MUST be filterable by Status and by date range (Last Attempt date).

**FR-5.3-004:** A **"Retry"** action MUST be available on FAILED_PERMANENT rows for users with `fhir.outbound.log.retry`. Clicking Retry resets the entry's status to PENDING and attempts counter to 0, making it eligible for the next retry scheduler cycle.

**FR-5.3-005:** DELIVERED entries are automatically purged after `logRetentionDays` (default: 90) by a nightly scheduled job. FAILED_PERMANENT entries are retained indefinitely until manually retried or resolved.

### 5.4 Retry Policy

**FR-5.4-001:** The system MUST provide a configurable retry policy with fields: Maximum Retry Attempts (default: 3), Retry Interval (minutes, default: 15), Log Retention Days (default: 90).

**FR-5.4-002:** A Spring `@Scheduled` job MUST poll for PENDING and RETRYING entries, attempt re-push, and update status on outcome. After `maxRetries` failed attempts, status becomes FAILED_PERMANENT.

**FR-5.4-003:** Each retry increments the `attempts` counter and updates `lastAttemptAt`.

---

## 6. Data Model

### New Entities

**FhirOutboundConfig** (singleton)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key, singleton (id = 1) |
| enabled | Boolean | Yes | Global on/off; default: false |
| remoteBaseUrl | String(512) | Yes | Central HAPI FHIR server base URL |
| authType | Enum | Yes | BEARER_TOKEN, BASIC, NONE, PRIVATE_KEY_JWT |
| authToken | String(1024) | No | Bearer token; AES-256 encrypted |
| authUsername | String(255) | No | Used for BASIC auth only |
| authPassword | String(512) | No | AES-256 encrypted |
| jwtPrivateKey | String(4096) | No | PKCS8 PEM private key; AES-256 encrypted; never returned in API |
| jwtPublicKeyPem | String(2048) | No | Public key PEM for display/copy; not secret |
| jwtKeyAlgorithm | Enum | No | RSA_2048, EC_P256 |
| jwtKeyFingerprint | String(128) | No | SHA-256 fingerprint of public key (display only) |
| jwtKeyCreatedAt | Timestamp | No | When the key was generated or uploaded |
| jwtIssuerId | String(255) | No | iss/sub claim; must match HAPI FHIR interceptor config |
| jwtAudience | String(512) | No | aud claim; defaults to remoteBaseUrl if blank |
| jwtExpiryMinutes | Integer | No | 1–60; default 10 |
| facilityOrganisationId | String(255) | Yes | FHIR Organization resource ID for this lab site |
| maxRetries | Integer | Yes | Default: 3 |
| retryIntervalMinutes | Integer | Yes | Default: 15 |
| logRetentionDays | Integer | Yes | Default: 90 |

**FhirDeliveryLog**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| labNumber | String(255) | Yes | OpenELIS lab number |
| testTypeName | String(255) | Yes | Human-readable test type |
| patientId | String(255) | Yes | OpenELIS patient ID |
| fhirDiagnosticReportId | String(255) | No | FHIR DiagnosticReport resource ID from local store |
| remoteResourceId | String(255) | No | Resource ID returned by remote FHIR server on success |
| status | Enum | Yes | PENDING, DELIVERED, RETRYING, FAILED_PERMANENT |
| attempts | Integer | Yes | Default: 0 |
| lastAttemptAt | Timestamp | No | |
| errorMessage | String(2048) | No | Last error HTTP status + body snippet |
| createdAt | Timestamp | Yes | |
| sampleId | Long | Yes | FK to OpenELIS Sample |

### Modified Entities

None. All FHIR transformation entities are pre-existing. Existing `application.properties` config keys (`org.openelisglobal.fhir.subscriber`, `org.openelisglobal.fhirstore.uri`, etc.) are migrated to `FhirOutboundConfig` and retained as fallback defaults for backward compatibility.

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/fhir/outbound/config` | Get outbound FHIR config (auth credentials masked) | `fhir.outbound.config.view` |
| PUT | `/api/v1/fhir/outbound/config` | Save/update outbound FHIR config | `fhir.outbound.config.modify` |
| POST | `/api/v1/fhir/outbound/config/test` | Test connection to remote FHIR server | `fhir.outbound.config.modify` |
| GET | `/api/v1/fhir/outbound/log` | List delivery log entries (paginated) | `fhir.outbound.log.view` |
| GET | `/api/v1/fhir/outbound/log/{id}` | Get single delivery log entry | `fhir.outbound.log.view` |
| POST | `/api/v1/fhir/outbound/log/{id}/retry` | Retry a FAILED_PERMANENT entry | `fhir.outbound.log.retry` |
| POST | `/api/v1/fhir/outbound/config/keys/generate` | Generate RSA-2048 key pair server-side; returns public key PEM + fingerprint | `fhir.outbound.config.modify` |
| POST | `/api/v1/fhir/outbound/config/keys/upload` | Upload and store PEM private key; returns derived public key PEM + fingerprint | `fhir.outbound.config.modify` |
| DELETE | `/api/v1/fhir/outbound/config/keys` | Remove key pair; resets auth state | `fhir.outbound.config.modify` |
| GET | `/api/v1/fhir/outbound/config/keys/public` | Get current public key PEM for display/copy | `fhir.outbound.config.view` |

---

## 8. UI Design

See companion mockup: `preview-fhir-outbound.jsx` (to be created)

### Navigation Path

**Administration → Integrations → FHIR Outbound Hub**

Submenus:

| Submenu Item | Page |
|---|---|
| Connection | Remote FHIR URL, auth credentials, facility Organisation ID, enable toggle, Test Connection |
| Delivery Log | Paginated push log, retry action |
| Retry Policy | maxRetries, retryIntervalMinutes, logRetentionDays |

### Key Screens

1. **Connection** — single `PageCard` with labelled fields for URL, auth type (Select), token/password (masked TextInput), facility Organisation ID, global Toggle; "Test Connection" button triggers capability statement check and shows `InlineNotification` with result.

2. **Delivery Log** — DataTable with Lab Number, Test Type, Patient ID, FHIR Report ID, Status (Tag), Attempts, Last Attempt, Actions (Retry button on FAILED_PERMANENT rows); date range filter and status filter above table; pagination.

3. **Retry Policy** — `PageCard` with three `NumberInput` fields; Save button.

### Interaction Patterns

Identical to SMS/Email notification admin pages: sidebar submenu navigation, `InlineNotification` for save confirmation and test connection result, Carbon `Tag` for status display, pagination for log table.

---

## 8. Business Rules

**BR-001:** The FHIR push is independent of SMS and Email notification channels. All three fire from the same final validation event. Failure of any one channel does not affect the others.

**BR-002:** If `FhirOutboundConfig.enabled = false`, the validation event listener exits immediately and creates no `FhirDeliveryLog` entry for that result.

**BR-003:** If `FhirTransformService` fails to produce a valid Bundle (e.g., missing required fields), the entry is logged as FAILED_PERMANENT immediately with the error message. No retry is scheduled, as this indicates a data quality issue rather than a connectivity failure.

**BR-004:** The `Patient` resource in the Bundle MUST be a conditional create using the OpenELIS patient identifier system and value as the `ifNoneExist` condition. This prevents duplicate Patient resources in the central FHIR store when multiple results for the same patient arrive.

**BR-005:** The configured Facility Organisation ID is used as-is in `DiagnosticReport.performer`. It is the administrator's responsibility to ensure this ID corresponds to an existing `Organization` resource in the central FHIR store. The system SHOULD warn (but not block) on save if the Test Connection cannot resolve the Organisation ID.

**BR-006:** Auth token and password are migrated from `application.properties` to the database on first application boot after this feature is deployed, if the `application.properties` values are present. The properties file values are used as defaults and overridden by database values once saved through the UI.

**BR-007:** For multi-site deployments, each OpenELIS instance has its own `FhirOutboundConfig` (in its own database). Each points to the same central HAPI FHIR server URL but uses a different `facilityOrganisationId` to attribute results to the correct lab.

**BR-008 (v1.1):** When auth type = `PRIVATE_KEY_JWT`, OpenELIS MUST assemble a signed JWT assertion for each outbound FHIR request with the following claims: `iss` = jwtIssuerId, `sub` = jwtIssuerId, `aud` = jwtAudience (or remoteBaseUrl if blank), `jti` = UUID v4 (unique per token), `exp` = now + jwtExpiryMinutes, `iat` = now. The JWT MUST be signed using the stored RSA-2048 private key (RS256 algorithm) and sent as the `Authorization: Bearer <jwt>` header.

**BR-009 (v1.1):** JWTs MAY be cached in memory and reused across requests until their `exp` is within 30 seconds of expiry, at which point a new JWT MUST be generated. The cache key is the `jwtIssuerId`. Each cached token retains its original `jti`; a new `jti` is generated when the token is refreshed.

**BR-010 (v1.1):** If auth type = `PRIVATE_KEY_JWT` and key status = NOT CONFIGURED, the global enable Toggle MUST be non-interactive. Attempting to save with `enabled = true` and no key MUST return a validation error: `error.fhirOutbound.keyRequired`.

**BR-011 (v1.1):** Private key material is NEVER returned in any API response. The `GET /api/v1/fhir/outbound/config` endpoint MUST return only: `jwtKeyAlgorithm`, `jwtKeyFingerprint`, `jwtKeyCreatedAt`, `jwtPublicKeyPem`, `jwtIssuerId`, `jwtAudience`, `jwtExpiryMinutes`. The `jwtPrivateKey` column is excluded from all read paths.

**BR-012 (v1.1):** In the federated PNG deployment, each lab site generates its own key pair. The HAPI FHIR server interceptor maintains one row per site: `{jwtIssuerId → jwtPublicKeyPem}`. Revoking a site's access requires deleting its row from the interceptor config — no other site is affected.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.fhirOutbound.title` | FHIR Outbound Hub |
| `heading.fhirOutbound.connection` | Connection |
| `heading.fhirOutbound.log` | Delivery Log |
| `heading.fhirOutbound.retryPolicy` | Retry Policy |
| `label.fhirOutbound.remoteUrl` | Remote FHIR Base URL |
| `label.fhirOutbound.authType` | Authentication Type |
| `label.fhirOutbound.authToken` | Bearer Token |
| `label.fhirOutbound.authUsername` | Username |
| `label.fhirOutbound.authPassword` | Password |
| `label.fhirOutbound.facilityOrgId` | Facility Organisation ID |
| `label.fhirOutbound.enabled` | Enable FHIR Outbound Push |
| `label.fhirLog.labNumber` | Lab Number |
| `label.fhirLog.fhirReportId` | FHIR Report ID |
| `label.fhirStatus.delivered` | Delivered |
| `label.fhirStatus.pending` | Pending |
| `label.fhirStatus.retrying` | Retrying |
| `label.fhirStatus.failedPermanent` | Failed |
| `button.fhirOutbound.testConnection` | Test Connection |
| `button.fhirOutbound.retry` | Retry |
| `message.fhirOutbound.testSuccess` | Connection successful. FHIR server version: {{version}} |
| `message.fhirOutbound.configSaved` | FHIR outbound configuration saved. |
| `error.fhirOutbound.connectionFailed` | Could not connect to FHIR server. Check URL and credentials. |
| `error.fhirOutbound.urlRequired` | Remote FHIR base URL is required. |
| `label.fhirOutbound.authType.privateKeyJwt` | Private Key JWT (Signed Assertion) |
| `heading.fhirOutbound.keyManagement` | Key Management |
| `label.fhirOutbound.keyStatus` | Key Status |
| `label.fhirOutbound.keyStatus.active` | Active |
| `label.fhirOutbound.keyStatus.notConfigured` | Not Configured |
| `label.fhirOutbound.keyAlgorithm` | Key Algorithm |
| `label.fhirOutbound.keyFingerprint` | Public Key Fingerprint |
| `label.fhirOutbound.keyCreatedAt` | Key Generated |
| `label.fhirOutbound.publicKeyPem` | Public Key (PEM) |
| `label.fhirOutbound.jwtIssuerId` | Issuer ID (iss / sub claim) |
| `label.fhirOutbound.jwtAudience` | JWT Audience (aud claim) |
| `label.fhirOutbound.jwtExpiry` | Token Expiry (minutes) |
| `button.fhirOutbound.generateKeyPair` | Generate New Key Pair |
| `button.fhirOutbound.uploadKey` | Upload Private Key (PEM) |
| `button.fhirOutbound.copyPublicKey` | Copy Public Key |
| `button.fhirOutbound.removeKey` | Remove Key |
| `message.fhirOutbound.keyGenerated` | Key pair generated. Copy the public key and register it on the HAPI FHIR server before enabling. |
| `message.fhirOutbound.keyCopied` | Public key copied to clipboard. |
| `message.fhirOutbound.keyUploaded` | Private key uploaded and public key derived successfully. |
| `message.fhirOutbound.keyRemoved` | Key pair removed. FHIR outbound push has been disabled. |
| `error.fhirOutbound.keyRequired` | A key pair must be configured before enabling Private Key JWT authentication. |
| `error.fhirOutbound.invalidPem` | Invalid PEM format. Please provide a valid PKCS8 or PKCS1 private key. |
| `error.fhirOutbound.issuerRequired` | Issuer ID is required for Private Key JWT authentication. |
| `error.fhirOutbound.jwtExpiryRange` | Token expiry must be between 1 and 60 minutes. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| remoteBaseUrl | Required; must be a valid HTTPS URL | `error.fhirOutbound.urlRequired` |
| authToken | Required when authType = BEARER_TOKEN | `error.fhirOutbound.tokenRequired` |
| authUsername | Required when authType = BASIC | `error.fhirOutbound.usernameRequired` |
| authPassword | Required when authType = BASIC | `error.fhirOutbound.passwordRequired` |
| facilityOrganisationId | Required; must match format `ResourceType/id` (e.g., `Organization/png-pom-lab`) | `error.fhirOutbound.orgIdInvalid` |
| maxRetries | Required; integer 1–10 | `error.fhirOutbound.retriesRange` |
| retryIntervalMinutes | Required; integer 5–1440 | `error.fhirOutbound.intervalRange` |
| logRetentionDays | Required; integer 1–730 | `error.fhirOutbound.retentionRange` |
| jwtIssuerId | Required when authType = PRIVATE_KEY_JWT; max 255 chars | `error.fhirOutbound.issuerRequired` |
| jwtAudience | Required when authType = PRIVATE_KEY_JWT; valid HTTPS URL | `error.fhirOutbound.urlRequired` |
| jwtExpiryMinutes | Required when authType = PRIVATE_KEY_JWT; integer 1–60 | `error.fhirOutbound.jwtExpiryRange` |

---

## 11. Security & Permissions

- All config endpoints require `fhir.outbound.config.view` or `fhir.outbound.config.modify`
- Auth credentials never returned in GET responses (masked on read)
- AES-256 encryption for bearer token and password at rest — same key infrastructure as SMS/Email channels
- UI hides configuration form entirely for users without `fhir.outbound.config.view`
- Log retry action hidden for users without `fhir.outbound.log.retry`

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `fhir.outbound.config.modify` can configure remote FHIR URL, auth type, credentials, facility Organisation ID, and save; credentials never returned in GET response
- [ ] "Test Connection" sends `GET [url]/metadata` with configured auth and shows FHIR server version on success, error details on failure
- [ ] Disabling global enable Toggle stops FHIR push on subsequent validations; no FhirDeliveryLog entry created
- [ ] On final validation, a FHIR transaction Bundle (DiagnosticReport + Observations + Patient + Specimen + Organization) is assembled and POSTed to the remote FHIR server asynchronously
- [ ] `DiagnosticReport` carries the LOINC code from the test type; each `Observation` carries the LOINC code from the test/panel component
- [ ] `DiagnosticReport.performer` references the configured facility Organisation ID
- [ ] `Patient` resource uses conditional create to prevent duplicates in the central FHIR store
- [ ] Successful push → FhirDeliveryLog status = DELIVERED; 5xx/timeout → PENDING; 4xx → FAILED_PERMANENT
- [ ] Auto-retry job picks up PENDING/RETRYING entries, attempts push, updates status; after maxRetries failures → FAILED_PERMANENT
- [ ] Delivery log shows correct status Tags, attempt count, and last attempt timestamp
- [ ] Manual retry available for FAILED_PERMANENT entries; resets status to PENDING and attempts to 0
- [ ] Log filterable by status and date range
- [ ] DELIVERED entries purged after logRetentionDays by nightly job
- [ ] FHIR push failure does not affect SMS or Email channel dispatch; all three fire independently from the same validation event

### Non-Functional

- [ ] FHIR push is asynchronous — final validation completes regardless of remote FHIR server availability
- [ ] Bundle assembly and POST complete within 5 seconds under normal connectivity (not a hard requirement for the scheduler path)
- [ ] All UI strings use i18n keys

### Integration

- [ ] Works correctly when OpenELIS has no incoming Task-based orders (local order entry only)
- [ ] Works correctly for both federated deployment (one instance per lab, each with its own `facilityOrganisationId`) and shared instance (per-facility Organisation ID configuration)
- [ ] Existing `application.properties` FHIR config migrated to database on first boot; no manual re-entry required for sites upgrading from `application.properties`-based config

### Private Key JWT (v1.1)

- [ ] "Private Key JWT (Signed Assertion)" available as auth type option in Connection config
- [ ] "Generate New Key Pair" produces RSA-2048 key pair server-side; private key stored encrypted; public key PEM displayed in read-only TextArea immediately
- [ ] "Copy Public Key" copies PEM to clipboard; inline "Copied!" confirmation shown
- [ ] "Upload Private Key (PEM)" accepts PKCS8/PKCS1 PEM; public key is derived and displayed; invalid PEM rejected with inline error
- [ ] Key status Tag shows Active (green) when key present; Not Configured (red) when absent
- [ ] Global enable Toggle non-interactive (disabled) when auth type = PRIVATE_KEY_JWT and no key configured
- [ ] "Remove Key" shows destructive confirmation, then removes key and sets toggle to false
- [ ] On FHIR push with PRIVATE_KEY_JWT, a signed JWT is assembled with correct iss, sub, aud, jti, exp, iat claims and sent as Authorization: Bearer header
- [ ] JWT is signed RS256 with the stored private key; the HAPI FHIR interceptor validates with the registered public key
- [ ] Private key never returned in any GET API response; only fingerprint, algorithm, and public key PEM returned
- [ ] Each federated site uses its own key pair and Issuer ID; revoking one site does not affect others

---

## Appendix A: FHIR Bundle Structure

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "DiagnosticReport",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "{{testLoinc}}" }] },
        "subject": { "reference": "Patient/{{patientFhirId}}" },
        "performer": [{ "reference": "{{facilityOrganisationId}}" }],
        "issued": "{{validatedAt}}",
        "result": [{ "reference": "Observation/{{obsId}}" }],
        "specimen": [{ "reference": "Specimen/{{specimenId}}" }]
      },
      "request": { "method": "POST", "url": "DiagnosticReport" }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "{{componentLoinc}}" }] },
        "subject": { "reference": "Patient/{{patientFhirId}}" },
        "valueCodeableConcept": { "coding": [{ "system": "{{resultCodeSystem}}", "code": "{{resultCode}}", "display": "{{resultDisplay}}" }] }
      },
      "request": { "method": "POST", "url": "Observation" }
    },
    {
      "resource": { "resourceType": "Patient", "identifier": [{ "system": "{{patientIdSystem}}", "value": "{{patientId}}" }] },
      "request": { "method": "POST", "url": "Patient", "ifNoneExist": "identifier={{patientIdSystem}}|{{patientId}}" }
    }
  ]
}
```

---

## Appendix B: HAPI FHIR Server Configuration — Private Key JWT Interceptor (v1.1)

This appendix documents what a HAPI FHIR server administrator must configure to support Private Key JWT authentication from OpenELIS. **This is outside OpenELIS scope** but is a prerequisite for end-to-end testing.

### Overview

The recommended approach for controlling the HAPI FHIR server is a custom `IServerInterceptor` that validates incoming signed JWT Bearer tokens directly — no external OAuth2 authorization server (Keycloak, etc.) required. The interceptor maintains a table of trusted issuers: one row per registered OpenELIS lab site.

### Interceptor Responsibilities

The interceptor MUST perform the following on every incoming request:

1. Extract the `Authorization: Bearer <token>` header
2. Parse the JWT (without verification) to extract the `iss` (issuer) claim
3. Look up the registered public key for that `iss` value from the trusted-issuers table
4. If no public key found for the issuer → reject with HTTP 401
5. Verify the JWT signature using the registered public key (RS256)
6. Verify `exp` claim: if now > exp → reject with HTTP 401 (token expired)
7. Verify `aud` claim: must match the HAPI FHIR server's configured base URL
8. Verify `jti` uniqueness within the expiry window (replay prevention): if the jti has been seen before and has not yet expired → reject with HTTP 401
9. If all checks pass → allow the request through

### Trusted Issuers Table

```sql
CREATE TABLE fhir_trusted_issuers (
  issuer_id       VARCHAR(255) PRIMARY KEY,  -- matches OpenELIS jwtIssuerId
  public_key_pem  TEXT NOT NULL,             -- PEM-encoded RSA public key
  facility_name   VARCHAR(255),              -- human label (optional)
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at   TIMESTAMP NOT NULL
);
```

One row per OpenELIS lab site. To register a new site: INSERT a row with the site's Issuer ID and the public key PEM copied from the OpenELIS Key Management UI. To revoke a site: set `enabled = FALSE` or DELETE the row.

### JWT Token Structure Expected

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
{
  "iss": "png-site-portmoresby-lab",
  "sub": "png-site-portmoresby-lab",
  "aud": "https://hapi.nationallab.pg/fhir",
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1711234567,
  "exp": 1711235167
}
```

### Replay Prevention Cache

The interceptor MUST maintain an in-memory (or Redis) set of recently seen `jti` values, evicting entries after their corresponding `exp` timestamp has passed. This prevents a captured JWT from being replayed within its validity window.

### Spring Bean Registration (HAPI FHIR)

```java
@Bean
public JwtValidationInterceptor jwtValidationInterceptor(TrustedIssuerRepository repo) {
    return new JwtValidationInterceptor(repo);
}

// In your HAPI FHIR server config:
@Override
protected void initialize() {
    super.initialize();
    registerInterceptor(jwtValidationInterceptor);
}
```

### Per-Site Setup Checklist (HAPI FHIR Admin)

1. OpenELIS admin generates key pair on the Connection config page
2. OpenELIS admin copies the public key PEM
3. HAPI FHIR admin inserts a row into `fhir_trusted_issuers` with the site's Issuer ID and the public key PEM
4. OpenELIS admin enables the FHIR outbound push toggle
5. Run "Test Connection" from OpenELIS to verify end-to-end

### Dependencies

- Nimbus JOSE + JWT (`com.nimbusds:nimbus-jose-jwt:9.x`) — JWT parsing and RS256 verification on the HAPI FHIR side
- HAPI FHIR JPA Server 6.x+ — interceptor registration API
