# Password Policy Enhancements (OWASP Alignment + Force Reset)
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-15
**Status:** Draft for Review
**Jira:** TBD
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** User Management (Admin → System → Users & Roles)

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

This feature aligns OpenELIS Global's password policy with OWASP Authentication Cheat Sheet and ASVS 4.x best practices, and adds a "force password reset on next login" mechanism. Admins can set a temporary password for a user with the force-reset flag defaulted to ON, requiring the user to choose a new password at their next login. The password policy itself shifts to a modern length-based approach (minimum 8, maximum 64 characters) with no composition rules, no periodic expiry, and full Unicode/whitespace support — per current OWASP guidance.

---

## 2. Problem Statement

**Current state:** OpenELIS currently enforces legacy password rules: minimum 7 characters, may contain upper/lowercase letters or numbers, must contain at least one of `*, $, #, !`, and must not contain any other characters. These rules directly conflict with modern OWASP guidance, which recommends removing composition rules entirely and allowing all Unicode characters. The existing "Modify User" page (Admin Management → User Management → Modify User) also includes a mandatory "Password Expiration Date" field, which conflicts with OWASP's recommendation against periodic password expiry. When an administrator resets a user's password, there is no mechanism to force the user to change that temporary password at next login, leaving shared/known temporary passwords active indefinitely.

**Impact:** Legacy complexity rules frustrate users (especially in low-resource settings) without meaningfully improving security. Temporary passwords that persist create a security gap — any person who knows the temporary password retains access. This is a compliance risk for labs operating under ISO 15189, CAP, or national regulatory frameworks.

**Proposed solution:** Update the password validation policy to OWASP standards (length-based, no composition rules), add a `forcePasswordReset` flag to the user entity, default this flag to ON when an admin resets a password, and present a mandatory password-change interstitial at login when the flag is set.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Any authenticated user | Change own password when force-reset is triggered | Interstitial at login; cannot navigate away |
| User Management roles (existing RBAC) | Reset other users' passwords + set force-reset toggle | Inherits existing user management page permissions |
| System Administrator | Full | Can reset any user, always has force-reset toggle |

**Required permission keys:**

- `user.resetPassword` — Ability to reset another user's password (existing or new key, inherits from current user management RBAC)
- No new permission keys required for the force-reset toggle; it is gated by the same permission as password reset

---

## 4. Functional Requirements

### 4.1 Password Policy (OWASP Alignment)

**FR-PP-001:** The system MUST enforce a minimum password length of **8 characters**.
**FR-PP-002:** The system MUST permit passwords up to **64 characters** in length.
**FR-PP-003:** The system MUST NOT enforce character composition rules (no mandatory uppercase, lowercase, digits, or special characters).
**FR-PP-004:** The system MUST allow all printable Unicode characters, including spaces and special characters, in passwords.
**FR-PP-005:** The system MUST NOT silently truncate passwords.
**FR-PP-006:** The system MUST retain the "Password Expiration Date" field but default it to **10 years from the date the password is set**. This accommodates countries with regulatory requirements for periodic password expiry while following the OWASP recommendation against short rotation cycles. When a password expires, the system MUST treat it the same as `force_password_reset = true` — the user is redirected to the password-change interstitial at next login.
**FR-PP-007:** The system MUST allow users to paste into password fields.
**FR-PP-008:** When a password fails validation, the system MUST display ALL unmet requirements simultaneously (not just the first failure).
**FR-PP-009:** The system MUST hash passwords using bcrypt with a cost factor of at least 10, or Argon2id if available. Existing bcrypt hashes remain valid and are upgraded on next successful login.

### 4.2 Force Password Reset on Next Login

**FR-FR-001:** The `login_user` entity (or equivalent) MUST include a `force_password_reset` boolean field, defaulting to `false`.
**FR-FR-002:** When an admin resets a user's password via the user management page, the `force_password_reset` flag MUST default to `true` (toggle ON).
**FR-FR-003:** The admin MAY uncheck the force-reset toggle before saving, setting the flag to `false`.
**FR-FR-004:** When a user logs in and `force_password_reset` is `true`, the system MUST redirect them to the existing **Change Password** page before granting access to any other page.
**FR-FR-005:** When displayed due to a force-reset, the Change Password page MUST display an informational banner explaining why the user must change their password (e.g., "Your administrator has required you to change your password before continuing." or "Your password has expired. Please set a new password to continue.").
**FR-FR-006:** When displayed due to a force-reset, the **Exit button MUST be hidden or disabled** — the user cannot navigate away until the password is successfully changed.
**FR-FR-007:** The Change Password page MUST display: Username (read-only), Current Password, New Password, Repeat Password — matching the existing page layout with form fields on the left and requirements text on the right.
**FR-FR-008:** Upon successful password change, the system MUST set `force_password_reset` to `false` and redirect the user to the default landing page.
**FR-FR-009:** The Change Password page MUST enforce the same password policy rules defined in FR-PP-001 through FR-PP-008.
**FR-FR-010:** The new password MUST NOT be the same as the current (temporary) password.

### 4.2.1 Change Password Page Updates (All Contexts)

**FR-CP-001:** The existing Change Password page MUST update its password requirements text to reflect the new OWASP-compliant policy (same requirements as FR-PD-001 through FR-PD-003), replacing the old rules ("Must Be at least 7 characters", "Must contain at least one of *, $, #, !", etc.).
**FR-CP-002:** The Change Password page MUST retain the "Must not be the same as the current password" rule in its requirements display.
**FR-CP-003:** The Change Password page MUST retain the existing two-column layout: form fields (Username, Current Password, New Password, Repeat Password) on the left, password requirements on the right.

### 4.3 Admin Password Reset Flow

**FR-AR-001:** On the existing Modify User page (Admin Management → User Management → Modify User), the password section MUST display: the updated OWASP-compliant password requirements text, a "Password" field, a "Repeat Password" field, and a new "Force password reset on next login" toggle.
**FR-AR-002:** The "Force password reset on next login" toggle MUST default to ON when the admin is changing a user's password.
**FR-AR-003:** The admin MUST enter a password that passes the same password policy validation (FR-PP-001 through FR-PP-005).
**FR-AR-004:** Upon successful save, the system MUST display an `InlineNotification` (kind="success") confirming the user was saved.
**FR-AR-005:** If the force-reset toggle was ON, the notification MUST indicate that the user will be required to change their password at next login.
**FR-AR-006:** The "Password Expiration Date" field MUST be retained on the Modify User page. When an admin sets or resets a password, the expiration date MUST auto-populate to **10 years from the current date** by default. The admin MAY override this to a shorter or longer period as required by local policy. When a user's password expiration date passes, the system MUST treat it identically to `force_password_reset = true` — redirecting the user to the password-change interstitial at next login.

### 4.4 Password Requirements Display

**FR-PD-001:** The password requirements text on the Modify User page MUST be updated to reflect the new policy. The old text ("Must Be at least 7 characters", "May contain upper and lower case letters or numbers", "Must contain at least one of the following characters: *, $, #, !", "Must not contain any other characters") MUST be replaced.
**FR-PD-002:** The new requirements text MUST read: "Must be at least 8 characters" and "May be up to 64 characters" and "May contain any characters including spaces".
**FR-PD-003:** The requirements text MUST be localized using i18n keys.

---

## 5. Data Model

### Modified Entities

**login_user** — Add field:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| force_password_reset | Boolean | Yes | false | Set to true when admin resets password with force-reset toggle ON. Cleared when user completes password change. |

### Configuration (application.properties or site_information)

| Property | Type | Default | Notes |
|---|---|---|---|
| password.minLength | Integer | 8 | Minimum password length |
| password.maxLength | Integer | 64 | Maximum password length |
| password.expirationDays | Integer | 3650 | Default password expiration in days (10 years). Auto-populates the Password Expiration Date field when a password is set. Configurable per site for countries requiring shorter expiry periods. |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| PUT | `/api/v1/users/{id}/password` | Admin resets a user's password | `user.resetPassword` |
| POST | `/api/v1/auth/force-change-password` | User changes own password during force-reset interstitial | Authenticated (self only) |
| GET | `/api/v1/auth/login-status` | Returns login status including `forcePasswordReset` flag | Authenticated (self only) |

**PUT `/api/v1/users/{id}/password` request body:**
```json
{
  "newPassword": "string",
  "forceResetOnNextLogin": true
}
```

**POST `/api/v1/auth/force-change-password` request body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

## 7. UI Design

See companion React mockup: `password-enhancements-mockup.jsx`

### Navigation Path

**Admin password reset:** Home → Admin Management → User Management → [select user] → Modify User page (existing page, enhanced password section)

**Force-reset interstitial:** Login → (automatic redirect) → Force Password Change page → (redirect to home on success)

### Key Screens

1. **Modify User page (enhanced)** — The existing Modify User page is updated: the password requirements text changes to OWASP-compliant rules, the "Password Expiration Date" field is retained (defaulting to 10 years from current date when password is set), and a new "Force password reset on next login" toggle is added below the Repeat Password field (defaulting to ON when password fields are populated).
2. **User Management list page (enhanced)** — A new "Reset Required" column is added to the user table showing a Tag badge when `force_password_reset` is true for a user, giving admins visibility into which users have pending resets.
3. **Change Password page (enhanced for force-reset)** — The existing Change Password page is reused. When triggered by force-reset: an info banner is added at the top explaining why the change is required, and the Exit button is hidden/disabled. The two-column layout is preserved: form fields on the left (Username, Current Password, New Password, Repeat Password), updated OWASP requirements on the right.

### Interaction Patterns

- **Existing form page pattern** for Modify User — follows the current OpenELIS convention of navigating to a separate page for user editing (not inline expansion, matching existing behavior)
- **Interstitial page** (full-page redirect, no modal) for force-reset — this is a login flow, not an edit form
- **Real-time inline validation** using Carbon's `invalid`/`invalidText` props
- **Toggle control** for force-reset with helper text explaining the behavior

---

## 8. Business Rules

**BR-001:** Password minimum length is 8 characters. Maximum is 64 characters.
**BR-002:** No character composition rules are enforced (no uppercase/lowercase/digit/special requirements).
**BR-003:** All printable Unicode characters including spaces are permitted.
**BR-004:** Passwords are never silently truncated.
**BR-005:** Password Expiration Date defaults to 10 years from the date the password is set. When the expiration date passes, the system treats it as a forced password reset (same behavior as `force_password_reset = true`). Admins may set a shorter or longer expiration per local regulatory requirements.
**BR-006:** When an admin resets a user's password, the "force password reset on next login" toggle defaults to ON.
**BR-007:** A user with `force_password_reset = true` MUST change their password before accessing any application page.
**BR-008:** The new password during force-reset MUST differ from the current (temporary) password.
**BR-009:** After successful forced password change, `force_password_reset` is set to `false` and the user proceeds to the default landing page.
**BR-010:** Password fields MUST support paste operations (no paste-blocking).

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.password.forceChange` | Change Your Password |
| `label.password.forceChangeInstructions` | Your administrator has required you to change your password before continuing. |
| `label.password.username` | Username |
| `label.password.newPassword` | New Password |
| `label.password.confirmPassword` | Confirm Password |
| `label.password.forceResetToggle` | Force password reset on next login |
| `label.password.forceResetHelperText` | When enabled, the user must change their password the next time they log in. |
| `button.password.changePassword` | Change Password |
| `button.password.resetPassword` | Reset Password |
| `button.password.save` | Save |
| `button.password.cancel` | Cancel |
| `message.password.resetSuccess` | Password has been reset successfully. |
| `message.password.resetSuccessForceReset` | Password has been reset. The user will be required to change their password at next login. |
| `message.password.changeSuccess` | Your password has been changed successfully. |
| `error.password.tooShort` | Password must be at least 8 characters. |
| `error.password.tooLong` | Password must be no more than 64 characters. |
| `error.password.mismatch` | Passwords do not match. |
| `error.password.required` | Password is required. |
| `error.password.sameAsCurrent` | New password must be different from the current password. |
| `error.password.changeFailed` | Failed to change password. Please try again. |
| `heading.password.adminReset` | Reset User Password |
| `placeholder.password.newPassword` | Enter new password |
| `placeholder.password.confirmPassword` | Re-enter new password |
| `label.password.requirements` | Password must: |
| `label.password.req.minLength` | Be at least 8 characters |
| `label.password.req.maxLength` | Be no more than 64 characters |
| `label.password.req.anyChars` | May contain any characters including spaces |
| `label.password.resetRequired` | Reset Required |
| `label.password.columnResetRequired` | Password Reset Required |
| `label.password.expirationDate` | Password Expiration Date |
| `message.password.expired` | Your password has expired. Please set a new password to continue. |
| `heading.password.change` | Change Password |
| `placeholder.password.currentPassword` | Current Password |
| `placeholder.password.repeatPassword` | Repeat Password |
| `label.password.req.notSame` | Must not be the same as the current password |
| `button.password.submit` | Submit |
| `button.password.exit` | Exit |
| `label.password.exitHidden` | (Exit disabled — password change required) |
| `label.password.expirationHelperText` | Defaults to 10 years from today. Adjust if local policy requires shorter expiry. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| New Password | Required | `error.password.required` |
| New Password | Min 8 characters | `error.password.tooShort` |
| New Password | Max 64 characters | `error.password.tooLong` |
| Confirm Password | Required | `error.password.required` |
| Confirm Password | Must match New Password | `error.password.mismatch` |
| New Password (force-reset) | Must differ from current/temp password | `error.password.sameAsCurrent` |

**Validation display rule (FR-PP-008):** When multiple validation rules fail simultaneously, ALL failing rules MUST be displayed together. Implementation: show each failing rule as a separate line within the `invalidText` prop.

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| Reset another user's password | `user.resetPassword` (existing RBAC) | "Reset Password" button hidden; API returns 403 |
| Toggle force-reset flag | Same as reset password | Toggle not visible if reset button is hidden |
| Change own password (force-reset interstitial) | Authenticated (self only) | N/A — user is always authenticated at this point |

**Additional security considerations:**

- Temporary passwords set by admins are hashed immediately — never stored in plaintext.
- The force-reset interstitial blocks all navigation; session tokens issued during force-reset state have restricted scope (cannot call non-auth API endpoints).
- Rate limiting SHOULD be applied to the force-change-password endpoint to prevent brute-force attempts.
- The current (temporary) password is required during force-reset to confirm the user is the person who received the temp password.

---

## 12. Acceptance Criteria

### Functional

- [ ] Password validation enforces minimum 8 characters and maximum 64 characters
- [ ] No character composition rules are enforced (uppercase, special chars, etc.)
- [ ] Passwords support all printable Unicode characters including spaces
- [ ] Paste is allowed in all password fields
- [ ] All unmet validation rules display simultaneously (not just the first)
- [ ] Admin can expand "Reset Password" inline on the user management table
- [ ] "Force password reset on next login" toggle defaults to ON in the reset form
- [ ] Admin can uncheck the force-reset toggle before saving
- [ ] Success notification reflects whether force-reset was enabled
- [ ] User with `force_password_reset = true` is redirected to password change interstitial on login
- [ ] User cannot navigate away from the interstitial until password is changed
- [ ] New password must differ from the current/temporary password
- [ ] After successful change, `force_password_reset` is cleared and user reaches home page
- [ ] Admin without `user.resetPassword` permission does not see the Reset Password button

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Interstitial page loads within 2 seconds
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Passwords hashed with bcrypt (cost ≥ 10) or Argon2id
- [ ] Works on screens 1280px wide and above

### Integration

- [ ] Existing user sessions are not invalidated when force-reset flag is set (takes effect at next login)
- [ ] Existing password hashes remain valid (no migration required for current users)

---

## v2 Enhancements (Deferred)

The following are documented for future implementation and are explicitly OUT OF SCOPE for v1:

- **Breached password check** — Validate new passwords against HaveIBeenPwned API (k-anonymity) or a bundled blocklist of top compromised passwords
- **Password strength meter** — Real-time visual indicator showing password strength as the user types (Weak / Fair / Strong / Very Strong)
- **Self-service password reset** — "Forgot password" flow with email-based recovery
- **Multi-factor authentication (MFA)** — TOTP or similar second factor
- **Password expiry policy** — Configurable expiry (only on compromise, not periodic)
