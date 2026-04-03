# Electronic Signature for 21 CFR Part 11 Compliance
## Functional Requirements Specification

**Document Version:** 1.0  
**Date:** February 9, 2026  
**Author:** OpenELIS Global Implementation Team  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Goals](#2-design-goals)
3. [Regulatory Requirements Summary](#3-regulatory-requirements-summary)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Data Model](#5-data-model)
6. [First-Use Certification](#6-first-use-certification)
7. [Signature Ceremony](#7-signature-ceremony)
8. [Signature Points](#8-signature-points)
9. [Audit Trail Integration](#9-audit-trail-integration)
10. [Authentication Integration](#10-authentication-integration)
11. [User Interface Specification](#11-user-interface-specification)
12. [API Endpoints](#12-api-endpoints)
13. [Configuration & Administration](#13-configuration--administration)
14. [Error Handling](#14-error-handling)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Future Enhancements](#16-future-enhancements)

---

## 1. Overview

### 1.1 Purpose

Implement electronic signatures in OpenELIS Global that comply with 21 CFR Part 11, enabling laboratories subject to FDA regulation to use electronic records and signatures as legally equivalent to paper records and handwritten signatures.

### 1.2 Scope

This specification covers electronic signatures for two primary laboratory workflows:

- **Result Entry** — technologist signs upon saving/submitting results (meaning: "Authored")
- **Result Validation** — supervisor validates and releases results (meaning: "Validated and Released") or rejects results (meaning: "Rejected")

The implementation is limited to:

- Non-biometric signatures (user ID + password)
- Web application only
- Local authentication and Keycloak SSO
- Extension of existing audit trail infrastructure

### 1.3 Out of Scope (Future Versions)

- Biometric signatures (fingerprint, facial recognition)
- Digital signatures (cryptographic/PKI-based)
- Mobile or offline signing
- Signatures for NCE/CAPA workflows (to be added when those modules are complete)
- Signatures for QC review, order entry, or configuration changes

### 1.4 Regulatory Reference

- **21 CFR Part 11** — Electronic Records; Electronic Signatures (FDA)
- **§11.50** — Signature manifestations
- **§11.100** — General requirements for electronic signatures
- **§11.200** — Electronic signature components and controls
- **§11.300** — Controls for identification codes/passwords

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **21 CFR Part 11 Compliance** | Meet all technical requirements for non-biometric electronic signatures under Subparts B and C |
| **Minimal Friction** | Leverage session-based signing per §11.200(a)(1)(i) so users authenticate fully once, then sign with password only for subsequent actions |
| **Existing Patterns** | Build on OpenELIS Global's existing audit trail, session management, and authentication infrastructure |
| **Configurable** | Allow administrators to enable/disable e-signatures per site (not all OpenELIS deployments require FDA compliance) |
| **Non-Disruptive** | When e-signatures are disabled, result entry and validation workflows function exactly as they do today |

---

## 3. Regulatory Requirements Summary

This section maps 21 CFR Part 11 requirements to implementation decisions.

### 3.1 Signature Components (§11.200)

| Requirement | Implementation |
|-------------|----------------|
| At least two distinct identification components | User ID (login name) + password |
| Continuous session: first signing uses all components | Full user ID + password modal on first signing action in session |
| Continuous session: subsequent signings use at least one component | Password-only modal for subsequent signing actions |
| Non-continuous session: each signing uses all components | After logout or session timeout (per existing OWASP-compliant session management), full user ID + password required again |

### 3.2 Signature Manifestation (§11.50)

Each electronic signature must be linked to its record and display:

| Element | Source |
|---------|--------|
| Printed name of the signer | User's full name from user profile |
| Date and time of signing | Server-generated UTC timestamp |
| Meaning of the signature | Hardcoded per action: "Authored", "Validated and Released", or "Rejected" |

### 3.3 Uniqueness & Controls (§11.100, §11.300)

| Requirement | Implementation |
|-------------|----------------|
| Unique to one individual, not reusable or reassigned | Enforced by existing user management — unique user IDs |
| Identity verification before signature issuance | Admin verifies identity during user account creation (procedural) |
| Periodic check/recall/revision of credentials | Enforced by existing password aging policies and Keycloak configuration |
| No two individuals share the same ID + password combination | Enforced by unique user ID constraint in database |
| Attempted use by non-owner requires collaboration of two or more | Two-component authentication (ID + password) ensures this |

### 3.4 First-Use Certification (§11.100(c))

Prior to or at the time of first use, the signer must certify that their electronic signature is the legally binding equivalent of their handwritten signature. This is implemented as a one-time acknowledgment dialog.

### 3.5 Audit Trail (§11.10(e))

Electronic signature events must be recorded in secure, computer-generated, time-stamped audit trails. The existing OpenELIS audit trail will be extended to capture signature-specific metadata.

---

## 4. User Roles & Permissions

### 4.1 Signing Roles

| Role | Signing Actions | Permission |
|------|----------------|------------|
| Technologist | Result Entry ("Authored") | `RESULT_ENTRY_SIGN` |
| Supervisor / Lab Director | Validation ("Validated and Released"), Rejection ("Rejected") | `RESULT_VALIDATE_SIGN` |
| Administrator | Enable/disable e-signatures, view signature audit logs, manage first-use certifications | `ESIG_ADMIN` |

### 4.2 Role Constraints

- A user cannot validate/release their own authored results (enforced by existing dual-signature workflow)
- A user must have completed first-use certification before any signing action
- Signing permissions are additive — a supervisor may also have result entry signing permission

---

## 5. Data Model

### 5.1 Electronic Signature Record

A new `electronic_signature` table stores each signature event. This table is append-only (no updates or deletes permitted at the application level).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `signer_id` | FK → `system_user.id` | The user who signed |
| `signer_name_printed` | VARCHAR(255) | Full name of signer at time of signing (denormalized for compliance — name changes don't alter historical records) |
| `signature_meaning` | ENUM('AUTHORED', 'VALIDATED_AND_RELEASED', 'REJECTED') | Hardcoded meaning of the signature |
| `signed_at` | TIMESTAMP WITH TIME ZONE | Server-generated signing timestamp (UTC) |
| `record_type` | VARCHAR(100) | Type of record signed (e.g., `RESULT`, `ANALYSIS`) |
| `record_id` | UUID | FK to the signed record |
| `rejection_reason` | TEXT | Required when `signature_meaning` = 'REJECTED', NULL otherwise |
| `session_signing_sequence` | INTEGER | Sequence number within the signing session (1 = full auth, 2+ = password-only) |
| `auth_method` | ENUM('LOCAL', 'KEYCLOAK') | Authentication method used for this signature |
| `client_ip` | VARCHAR(45) | IP address of the signing client |
| `user_agent` | VARCHAR(500) | Browser user agent string |

### 5.2 First-Use Certification Record

A new `esig_first_use_certification` table records each user's one-time certification.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | FK → `system_user.id` | The certifying user |
| `certified_at` | TIMESTAMP WITH TIME ZONE | Timestamp of certification |
| `certification_text` | TEXT | The exact legal text the user acknowledged |
| `client_ip` | VARCHAR(45) | IP address at time of certification |
| `user_agent` | VARCHAR(500) | Browser user agent string |

### 5.3 Signing Session Tracking

Signing session state is tracked server-side (not in a new table, but in the existing session store).

| Session Attribute | Type | Description |
|-------------------|------|-------------|
| `esig_session_active` | BOOLEAN | Whether the user has completed a full e-signature authentication in this session |
| `esig_session_started_at` | TIMESTAMP | When the first full signing occurred |
| `esig_signing_count` | INTEGER | Number of signatures executed in this session |

Session signing state is cleared when the user's application session ends (logout, timeout, or any OWASP-compliant session invalidation event).

---

## 6. First-Use Certification

### 6.1 Trigger

When a user attempts their first electronic signature action and no record exists in `esig_first_use_certification` for that user, the system presents the certification dialog before proceeding to the signature ceremony.

### 6.2 Certification Text

The certification dialog presents the following text (configurable by admin):

> "I, [Full Name], certify that my electronic signature, as used within this system, is the legally binding equivalent of my handwritten signature. I understand that electronic signatures executed under my credentials carry the same legal weight and accountability as traditional handwritten signatures, in accordance with 21 CFR Part 11."

### 6.3 Workflow

1. User attempts a signing action (e.g., clicks "Save Results" with e-signatures enabled)
2. System checks `esig_first_use_certification` for the user
3. If no certification exists, the certification modal is displayed
4. User reads the text, checks "I agree," and confirms
5. Certification record is created with timestamp, IP, and user agent
6. System proceeds to the normal signature ceremony
7. On all subsequent signing actions, step 2 returns a certification record and the system skips directly to the signature ceremony

### 6.4 Constraints

- Certification cannot be revoked by the user — only an admin can delete a certification record (which would force re-certification)
- The certification text version is stored with the record, so changes to the template do not retroactively alter existing certifications

---

## 7. Signature Ceremony

The signature ceremony is the authentication step required at the point of signing.

### 7.1 First Signing in Session (Full Authentication)

When `esig_session_active` is `false` (user has not yet signed in this session):

1. System presents a modal dialog with:
   - **User ID field** (pre-filled with current logged-in username, editable)
   - **Password field** (empty)
   - **Signature meaning** displayed as read-only text (e.g., "You are signing as: Authored")
   - **Rejection reason field** (visible only for rejection actions, required)
   - **Sign / Cancel buttons**
2. User enters credentials and clicks "Sign"
3. System authenticates the user ID + password against the active auth provider (local or Keycloak)
4. If authentication succeeds:
   - Electronic signature record is created
   - `esig_session_active` is set to `true`
   - `esig_signing_count` is set to `1`
   - The underlying action (result save, validation, rejection) is executed
5. If authentication fails:
   - Error message displayed: "Authentication failed. Please check your credentials and try again."
   - The action is not executed
   - Failed attempt is logged in the audit trail

### 7.2 Subsequent Signings in Session (Password-Only)

When `esig_session_active` is `true` (user has already signed in this session):

1. System presents a compact modal dialog with:
   - **Signer identity** displayed as read-only text (e.g., "Signing as: Jane Smith (jsmith)")
   - **Password field** (empty)
   - **Signature meaning** displayed as read-only text
   - **Rejection reason field** (visible only for rejection actions, required)
   - **Sign / Cancel buttons**
2. User enters password and clicks "Sign"
3. System authenticates the password for the current user against the active auth provider
4. If authentication succeeds:
   - Electronic signature record is created
   - `esig_signing_count` is incremented
   - The underlying action is executed
5. If authentication fails:
   - Same error handling as §7.1, step 5

### 7.3 Session Continuity

- The signing session inherits the application's existing session timeout behavior
- Any event that invalidates the application session (logout, idle timeout, browser close, OWASP session invalidation) also clears the signing session state
- After session invalidation, the next signing action requires full authentication (§7.1)

### 7.4 Credential Verification

The signature ceremony always verifies credentials in real-time against the auth provider. It does not rely on the existing application session token alone — the user must actively re-enter their password even though they are already logged in. This ensures the person physically present at the workstation is the credential owner.

---

## 8. Signature Points

### 8.1 Result Entry — "Authored"

| Attribute | Value |
|-----------|-------|
| **Trigger** | Technologist clicks "Save" / "Submit" on the result entry screen |
| **Signature Meaning** | `AUTHORED` |
| **Record Type** | `RESULT` |
| **Record ID** | The result/analysis ID being saved |
| **Who Signs** | The logged-in technologist with `RESULT_ENTRY_SIGN` permission |
| **Behavior When E-Sig Disabled** | Results save normally with no signature ceremony (current behavior) |
| **Behavior When E-Sig Enabled** | Signature ceremony modal appears before the save is committed. Save is only committed if signing succeeds. |

### 8.2 Result Validation & Release — "Validated and Released"

| Attribute | Value |
|-----------|-------|
| **Trigger** | Supervisor clicks "Accept" / "Validate" on the result validation screen |
| **Signature Meaning** | `VALIDATED_AND_RELEASED` |
| **Record Type** | `RESULT` |
| **Record ID** | The result/analysis ID being validated |
| **Who Signs** | The logged-in supervisor with `RESULT_VALIDATE_SIGN` permission |
| **Side Effects** | Upon successful signing, the result is both validated and released (made available on reports / sent to EMR) |
| **Behavior When E-Sig Disabled** | Validation proceeds normally (current behavior) |
| **Behavior When E-Sig Enabled** | Signature ceremony modal appears before validation is committed |

### 8.3 Result Rejection — "Rejected"

| Attribute | Value |
|-----------|-------|
| **Trigger** | Supervisor clicks "Reject" on the result validation screen |
| **Signature Meaning** | `REJECTED` |
| **Record Type** | `RESULT` |
| **Record ID** | The result/analysis ID being rejected |
| **Who Signs** | The logged-in supervisor with `RESULT_VALIDATE_SIGN` permission |
| **Additional Fields** | `rejection_reason` (required, free-text) |
| **Side Effects** | Upon successful signing, the result is returned to the technologist for correction |
| **Behavior When E-Sig Disabled** | Rejection proceeds normally (current behavior) |
| **Behavior When E-Sig Enabled** | Signature ceremony modal appears with required rejection reason field |

### 8.4 Batch Operations

When a user validates, releases, or rejects multiple results at once (batch action):

- A single signature ceremony is triggered for the batch
- One electronic signature record is created per result in the batch (each linked to its respective result ID)
- All signature records share the same `signed_at` timestamp and `session_signing_sequence`
- If any individual result fails to save after signing, the entire batch is rolled back and no signature records are persisted

---

## 9. Audit Trail Integration

### 9.1 Events Logged

The following events are appended to the existing OpenELIS audit trail:

| Event | Data Captured |
|-------|---------------|
| **Signature Executed** | Signer ID, signer printed name, signature meaning, record type, record ID, timestamp, IP, user agent, auth method, session sequence number |
| **Signature Failed (Auth Failure)** | Attempted signer ID, timestamp, IP, user agent, failure reason |
| **First-Use Certification Completed** | User ID, timestamp, IP, certification text version |
| **First-Use Certification Revoked** | Admin user ID, target user ID, timestamp, reason |
| **E-Signature Feature Enabled/Disabled** | Admin user ID, timestamp, old value, new value |
| **Signing Session Started** | User ID, timestamp, IP |
| **Signing Session Ended** | User ID, timestamp, reason (logout, timeout, etc.) |

### 9.2 Audit Trail Constraints

- Audit trail records are append-only — no modifications or deletions
- Audit trail cannot be disabled by any user role (per §11.10(e))
- Audit trail records are retained for the same period as the signed records they reference
- Audit trail is available for agency (FDA) review and copying

### 9.3 Signature Display on Records

When viewing a result that has been electronically signed, the system displays the signature manifestation inline:

- **Authored by:** [Full Name] — [Date/Time UTC]
- **Validated and Released by:** [Full Name] — [Date/Time UTC]
- **Rejected by:** [Full Name] — [Date/Time UTC] — Reason: [text]

These are read-only displays sourced from the `electronic_signature` table.

---

## 10. Authentication Integration

### 10.1 Local Authentication

When OpenELIS is configured with local authentication:

- The signature ceremony validates the user ID and password directly against the OpenELIS user database
- Password verification uses the same hashing algorithm as the login flow
- Account lockout policies (failed attempt limits) apply to signature authentication attempts

### 10.2 Keycloak SSO

When OpenELIS is configured with Keycloak:

- The signature ceremony validates credentials via the Keycloak Resource Owner Password Credentials (ROPC) grant or a direct access grant endpoint
- This requires the Keycloak client to be configured with direct access grants enabled
- The Keycloak realm's password policies (complexity, aging, lockout) apply
- If Keycloak is unavailable, signing is blocked (the system does not fall back to local auth)

### 10.3 Auth Method Recording

Each signature record stores the `auth_method` used (`LOCAL` or `KEYCLOAK`), providing traceability for auditors reviewing how credentials were verified.

---

## 11. User Interface Specification

All UI components use Carbon for React, consistent with the existing OpenELIS Global frontend.

### 11.1 First-Use Certification Modal

- **Component:** Carbon `ComposedModal` (medium size)
- **Header:** "Electronic Signature Certification"
- **Body:** Certification text (see §6.2) displayed in a scrollable text area
- **Footer:**
  - Checkbox: "I have read and agree to the above certification"
  - Primary button: "Certify" (disabled until checkbox is checked)
  - Secondary button: "Cancel" (returns user to previous screen without signing)

### 11.2 Full Signature Modal (First Sign in Session)

- **Component:** Carbon `ComposedModal` (small size)
- **Header:** "Electronic Signature Required"
- **Body:**
  - Signature meaning badge: e.g., `Tag` component with "Authored" / "Validated and Released" / "Rejected"
  - `TextInput`: User ID (pre-filled, editable)
  - `PasswordInput`: Password (empty, autofocused)
  - `TextArea`: Rejection reason (conditionally visible, required for rejections)
- **Footer:**
  - Primary button: "Sign"
  - Secondary button: "Cancel"
- **Validation:** Sign button disabled until both User ID and Password are populated (and Rejection Reason if applicable)

### 11.3 Password-Only Signature Modal (Subsequent Signs in Session)

- **Component:** Carbon `ComposedModal` (small size)
- **Header:** "Electronic Signature"
- **Body:**
  - Read-only identity line: "Signing as: [Full Name] ([username])"
  - Signature meaning badge
  - `PasswordInput`: Password (empty, autofocused)
  - `TextArea`: Rejection reason (conditionally visible, required for rejections)
- **Footer:**
  - Primary button: "Sign"
  - Secondary button: "Cancel"

### 11.4 Signature Manifestation Display

On result detail views and validation screens, signed results display a signature block:

- Uses a Carbon `Tile` or inline styled block
- Shows each signature event chronologically:
  - Icon (pen icon) + "Authored by [Name] on [Date Time]"
  - Icon (checkmark icon) + "Validated and Released by [Name] on [Date Time]"
  - Icon (close icon) + "Rejected by [Name] on [Date Time] — Reason: [text]"
- Read-only, not interactive

### 11.5 Admin Configuration Panel

Under Admin > Electronic Signatures:

- Toggle: "Enable Electronic Signatures" (site-wide on/off)
- Table: First-use certifications (user, date, actions: revoke)
- Table: Recent signature events (searchable, filterable, exportable)
- Editable text field: First-use certification text template

---

## 12. API Endpoints

### 12.1 Signature Execution

```
POST /api/v1/electronic-signature
```

Request body:

```json
{
  "userId": "jsmith",
  "password": "********",
  "signatureMeaning": "AUTHORED",
  "recordType": "RESULT",
  "recordId": "uuid-of-result",
  "rejectionReason": null
}
```

Response (success):

```json
{
  "signatureId": "uuid-of-signature",
  "signerNamePrinted": "Jane Smith",
  "signedAt": "2026-02-09T14:32:00Z",
  "signatureMeaning": "AUTHORED",
  "sessionSigningSequence": 1
}
```

Response (auth failure): `401 Unauthorized`

Response (not certified): `403 Forbidden` with body `{ "error": "FIRST_USE_CERTIFICATION_REQUIRED" }`

### 12.2 First-Use Certification

```
POST /api/v1/electronic-signature/certify
```

Request body:

```json
{
  "userId": "jsmith",
  "password": "********",
  "certificationTextVersion": "1.0"
}
```

### 12.3 Signature Query

```
GET /api/v1/electronic-signature?recordType=RESULT&recordId={id}
```

Returns all signatures associated with a record, ordered chronologically.

### 12.4 Session Signing Status

```
GET /api/v1/electronic-signature/session-status
```

Response:

```json
{
  "sessionActive": true,
  "signingCount": 3,
  "sessionStartedAt": "2026-02-09T14:30:00Z"
}
```

### 12.5 Admin: Certification Management

```
GET /api/v1/admin/electronic-signature/certifications
DELETE /api/v1/admin/electronic-signature/certifications/{userId}
```

### 12.6 Admin: Signature Audit Log

```
GET /api/v1/admin/electronic-signature/audit-log?startDate={}&endDate={}&userId={}&signatureMeaning={}
```

Returns paginated, filterable signature event history for compliance review.

---

## 13. Configuration & Administration

### 13.1 Site-Level Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `esig.enabled` | Boolean | `false` | Master toggle for electronic signatures site-wide |
| `esig.certification.text` | Text | See §6.2 | Configurable certification text |
| `esig.certification.version` | String | `"1.0"` | Version identifier for certification text (increment on changes) |
| `esig.auth.lockout.max_attempts` | Integer | `5` | Max failed signature auth attempts before account lockout |
| `esig.auth.lockout.duration_minutes` | Integer | `30` | Lockout duration after max failed attempts |

### 13.2 Feature Toggle Behavior

When `esig.enabled` is `false`:

- All result entry, validation, and rejection workflows behave exactly as they do today
- No signature modals are presented
- No signature records are created
- The admin panel for e-signatures is still accessible for configuration

When `esig.enabled` is `true`:

- All signature points (§8) require successful electronic signature before the action is committed
- First-use certification is enforced
- Signature manifestations are displayed on signed records

### 13.3 Enabling E-Signatures

When an administrator enables e-signatures for the first time:

1. All existing users with signing permissions will be prompted for first-use certification on their next signing action
2. Results entered/validated before e-signatures were enabled retain their existing audit trail (no retroactive signing required)
3. The enablement event is logged in the audit trail

---

## 14. Error Handling

| Scenario | System Behavior |
|----------|-----------------|
| Auth provider (Keycloak) unavailable | Signing blocked. Error: "Unable to verify credentials. Please try again or contact your administrator." The underlying action (save, validate, reject) is not executed. |
| User enters wrong password | Error: "Authentication failed. Please check your credentials and try again." Attempt is logged. Lockout policy applies. |
| User account is locked | Error: "Your account has been locked due to multiple failed attempts. Please contact your administrator." |
| User lacks signing permission | Signature modal is not presented. The action button (Save, Validate, Reject) is not visible or is disabled per existing permission controls. |
| Network error during signing | Error: "A network error occurred. Your signature was not recorded. Please try again." The action is not executed. |
| Concurrent modification (result changed by another user between modal open and sign) | Error: "This record has been modified by another user. Please refresh and try again." Signature is not recorded. |
| Batch signing partial failure | Entire batch is rolled back. Error: "Unable to complete batch signing. No results were modified. Please try again." |

---

## 15. Acceptance Criteria

### 15.1 First-Use Certification

- [ ] First-time signer sees certification modal before their first signature
- [ ] Certification modal displays configurable legal text
- [ ] User cannot proceed to sign without checking "I agree" and confirming
- [ ] Certification record is stored with timestamp, IP, user agent, and text version
- [ ] Subsequent signing actions skip the certification modal
- [ ] Admin can revoke a user's certification, forcing re-certification
- [ ] Certification revocation is logged in audit trail

### 15.2 Signature Ceremony — Full Authentication

- [ ] First signing in a session presents modal with User ID + Password fields
- [ ] User ID is pre-filled with the current logged-in username
- [ ] Password field is autofocused
- [ ] Signature meaning is displayed as a read-only badge
- [ ] Clicking "Sign" authenticates against the active auth provider (local or Keycloak)
- [ ] Successful auth creates an electronic signature record and executes the action
- [ ] Failed auth displays error, logs the attempt, and does not execute the action
- [ ] Session signing state is set to active after successful first signing

### 15.3 Signature Ceremony — Password-Only

- [ ] Subsequent signings in the same session present a compact modal with password only
- [ ] Signer identity is displayed as read-only text
- [ ] Successful auth creates a signature record and executes the action
- [ ] Failed auth does not invalidate the signing session (user can retry)

### 15.4 Session Continuity

- [ ] Logout clears the signing session state
- [ ] Session timeout clears the signing session state
- [ ] Any OWASP session invalidation event clears the signing session state
- [ ] After session invalidation, the next signing requires full authentication

### 15.5 Result Entry Signing

- [ ] When e-signatures are enabled, clicking "Save" on result entry triggers the signature ceremony
- [ ] Results are only saved if the signature ceremony succeeds
- [ ] The signature record is linked to the result with meaning "AUTHORED"
- [ ] When e-signatures are disabled, result entry works as it does today

### 15.6 Result Validation Signing

- [ ] When e-signatures are enabled, clicking "Accept"/"Validate" triggers the signature ceremony
- [ ] Results are validated and released only if the signature ceremony succeeds
- [ ] The signature record is linked to the result with meaning "VALIDATED_AND_RELEASED"
- [ ] A user cannot validate their own authored results

### 15.7 Result Rejection Signing

- [ ] When e-signatures are enabled, clicking "Reject" triggers the signature ceremony
- [ ] The rejection reason field is visible and required
- [ ] Results are rejected only if the signature ceremony succeeds
- [ ] The signature record includes the rejection reason with meaning "REJECTED"

### 15.8 Batch Operations

- [ ] Batch validate/reject triggers a single signature ceremony
- [ ] One signature record is created per result in the batch
- [ ] If any result in the batch fails, the entire batch is rolled back

### 15.9 Signature Manifestation

- [ ] Signed results display signature details (name, date/time, meaning) on result detail views
- [ ] Rejected results display the rejection reason alongside the signature
- [ ] Signature displays are read-only

### 15.10 Audit Trail

- [ ] All signature events are logged in the existing audit trail
- [ ] Failed signature attempts are logged
- [ ] Signing session start/end events are logged
- [ ] Audit trail records cannot be modified or deleted
- [ ] Audit trail cannot be disabled

### 15.11 Administration

- [ ] Admin can enable/disable e-signatures site-wide
- [ ] Admin can view and export signature audit logs
- [ ] Admin can manage first-use certifications
- [ ] Admin can configure certification text and version
- [ ] Enablement/disablement events are logged in audit trail

---

## 16. Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Biometric Signatures** | Support fingerprint or other biometric methods per §11.200(b) | Medium |
| **Digital Signatures (PKI)** | Cryptographic signing with certificates for tamper-evident records | Medium |
| **NCE/CAPA Signatures** | Extend e-signatures to NCE acknowledgment, CAPA approval, and closure | High |
| **QC Review Signatures** | E-signatures for QC acceptance/rejection | Medium |
| **Order Entry Signatures** | E-signatures for test ordering in high-regulation contexts | Low |
| **Signature Delegation** | Temporary delegation of signing authority (e.g., vacation coverage) with full audit | Low |
| **Multi-Factor Authentication** | Add TOTP or hardware token as a signing component | Medium |
| **Offline Signing** | Queue signatures for sync when connectivity is restored | Low |
| **Report-Level Signatures** | Composite signature display on printed/PDF lab reports | High |
