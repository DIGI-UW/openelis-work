# User Management — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-04-23
**Status:** Draft for Casey review
**Phase:** 5 (admin redesign), Page 1 of Top-5
**Bucket:** People & Access (IA v2.3)
**Author:** Casey / DIGI, University of Washington
**Source design inputs (authoritative):**
- `openelis-work/designs/rbac/rbac-revamp-prd.md` v1.0 (2026-03-04) — Flexible RBAC PRD — cited as **PRD** below
- `openelis-work/designs/rbac/rbac-ui-mockup.html` — visual + interaction reference
- `openelis-work/designs/admin-config/password-enhancements.md` v1.0 (2026-03-15) — absorbed into §4.6 Password Reset
- `OpenELIS Feature Design/admin-pattern-library.md` v1.0 — pattern IDs P-01…P-13 referenced inline
- `openelis-work/jira-handoff-rbac.md` — existing Jira Epic + phase tasks (indonesia label, Reagan)

---

## 1. Overview

User Management is the admin's directory of login accounts. It shows every person (and external clinician) who can authenticate into OpenELIS Global, the role assignments that determine what each person can do, and the scope those assignments apply to (Global, Department, or Lab Unit). It is the only place an admin can add a user, edit their account info, assign or revoke roles, reset a password (with OWASP force-reset-on-next-login default), deactivate a user, or attach provider metadata to a Test Requester. Role *definitions* live on the separate Role Management page — this page consumes those roles and attaches them to users at specific scopes.

---

## 2. User Stories

Traced to PRD US-1…US-13 where applicable.

**US-UM-1** (PRD US-1, US-2). As a **lab administrator**, I want to **view a filterable list of every user account** so that I can find any user quickly by name, login, role, or active status.

**US-UM-2** (PRD US-2, US-3). As a **lab administrator**, I want to **expand a user row inline and assign them a role at a specific scope (Global, Department, or Lab Unit)** so that I can grant access in the right organisational unit without navigating to a separate page.

**US-UM-3** (PRD US-5). As a **lab administrator**, I want to **see a user's current role assignments colour-coded by scope** so that I can audit effective access at a glance.

**US-UM-4** (PRD US-4, US-11). As a **lab administrator**, I want to **attach provider metadata (facility, license, specialty, NPI) to any user who has a Test Requester role assignment** so that their orders are properly attributed.

**US-UM-5** (password-enhancements FR-FR-001 to FR-FR-008). As a **lab administrator**, I want to **reset a user's password with a force-reset-on-next-login toggle defaulted on** so that any temporary password I set cannot remain active after the user logs in once.

**US-UM-6**. As a **lab administrator**, I want to **deactivate a user without deleting their account** so that I preserve audit trail linkage while immediately revoking login access.

**US-UM-7**. As a **lab administrator**, I want to **bootstrap a new user's permissions by copying from an existing user** so that provisioning is fast when a new hire will have the same access as a peer.

---

## 3. Jobs-To-Be-Done (JTBD)

| JTBD | Situation | Motivation | Outcome |
|---|---|---|---|
| JTBD-UM-1 | New staff joins a lab unit | Get them working this shift | New account created and assigned the right roles at the right scope in under 5 minutes (PRD success metric) |
| JTBD-UM-2 | Staff moves between lab units | Prevent stale access | Old assignment removed, new one added, effective permissions reflect the move on next login |
| JTBD-UM-3 | Admin gets called about a forgotten password | Unblock the user fast without leaving a shared password live | Reset with force-reset ON; user changes it themselves at next login |
| JTBD-UM-4 | External clinician needs to order tests | Give them ordering access without exposing the lab interface | Requester role assigned + provider metadata populated; user sees the adaptive ordering UI on next login |
| JTBD-UM-5 | Staff leaves | Immediate revocation, preserve audit trail | Deactivate toggled off; role assignments retained for rehire but blocked from login |
| JTBD-UM-6 | Auditor asks "who has admin globally?" | Compliance query | Filter by role + scope; export CSV for evidence |

---

## 4. Functional Requirements

### 4.1 User list (landing view)

**FR-UM-01.** The page MUST render a paginated DataTable of users with columns: **First Name · Last Name · Login Name · Roles · Pwd Expires · Status · Timeout**, plus a leading expand-chevron column (width 48 px, `aria-label="admin.users.aria.expandRow"`). *(pattern: P-02)*

**FR-UM-02.** The table toolbar MUST provide: full-text search over First Name, Last Name, Login Name, Email; a Role filter dropdown populated from the Role Management roster; an "Only Active" filter toggle; batch-action entry point for **Deactivate Selected**. *(patterns: P-03 search/filter, P-04 batch)*

**FR-UM-03.** The toolbar MUST include a primary-kind "Add User" button that opens a full-width inline "new user" expansion panel above the table (not a modal). *(pattern: P-05 inline expansion applied in new-row variant)*

**FR-UM-04.** Clicking anywhere on a user's row (except action buttons) MUST toggle the inline detail panel. The expand-chevron MUST rotate 90° when expanded. At most one detail panel MAY be open at a time. *(pattern: P-05)*

**FR-UM-05.** The Roles column MUST render each current assignment as a small Carbon Tag, coloured by role type (Standard = blue, Admin = purple, Specialty = teal, Requester = green). Overflow (more than 3 assignments) renders "+N more". *(pattern: P-08)*

**FR-UM-06.** The Status column MUST render a coloured status dot (green = Active, gray = Inactive) **paired with the full text "Active" / "Inactive"**. Colour alone MUST NOT be the sole signal (WCAG 1.4.1; PRD R6 accessibility). *(pattern: P-08)*

**FR-UM-07.** Pwd Expires MUST render in the user's configured locale date format (DD/MM/YYYY for most African deployments). When the password has expired, the cell MUST render a warning Tag ("Expired") in addition to the date, coloured red. *(pattern: P-08)*

**FR-UM-08.** Timeout MUST render as a number of minutes with the suffix " min". The column is display-only on the list; editable in the expanded detail. *(pattern: P-02)*

**FR-UM-09.** The table MUST support client-side sorting on First Name, Last Name, Login Name, Pwd Expires, Status, Timeout. Roles column is not sortable. *(pattern: P-02)*

**FR-UM-10.** The table MUST paginate at 25 / 50 / 100 rows per page, default 25, with standard Carbon pagination footer. *(pattern: P-12)*

**FR-UM-11.** When filters yield zero results, the table area MUST render an empty state (P-10) with message "admin.users.empty.title" = "No users match your filters" and a ghost-kind "Clear filters" button.

**FR-UM-12.** On initial load before user data resolves, the table body MUST render a skeleton loader of 5 rows (Carbon `DataTableSkeleton`). *(pattern: P-11)*

### 4.2 Inline detail panel (expanded row)

**FR-UM-13.** The expanded panel MUST span all table columns via `colSpan` and render inside a Carbon `Tile` with a 2px top border in `$blue-60` to signal active expansion.

**FR-UM-14.** The panel MUST contain (in top-to-bottom order):
  1. **Unsaved-changes bar** (P-09 yellow InlineNotification variant) — hidden until any field mutates, then sticky at the top of the panel saying "Unsaved changes — click Save to apply or Close to discard."
  2. **User summary bar** — read-only Login / Name / Pwd Expires / Status at a glance, plus an "Edit Account Info" ghost button (right-aligned).
  3. **Copy Permissions From User** card — a compact horizontal form with a username ComboBox + Apply button.
  4. **Role Assignments** header with primary "Add Role Assignment" button.
  5. **Scope legend** — colour swatch key: purple = Global, teal = Department, blue = Lab Unit.
  6. **List of current role-assignment cards** (see §4.3).
  7. **Provider Metadata** section — rendered only when at least one assigned role is of type `requester` (see §4.4).
  8. **Password & Session** section — Reset Password action + Session Timeout input (see §4.6).
  9. **Actions row** — "Save", "Cancel", and (for existing users) "Deactivate" / "Reactivate".

**FR-UM-15.** Navigating away from the panel (clicking another row, a sidebar item, or the Cancel button) with unsaved changes MUST show a Carbon destructive confirm modal: "Discard unsaved changes?" with "Discard" (danger) and "Keep editing" (ghost). *(pattern: P-06)*

**FR-UM-16.** All labels in the user summary bar MUST use `$gray-70` (`#525252`) or darker for 4.5:1 contrast against the `$blue-10` panel background (PRD R6 a11y).

### 4.3 Role assignments

**FR-UM-17.** Each current role assignment MUST render as a Role Assignment Card containing:
  - Role type Tag (coloured per role type — see FR-UM-05)
  - Role name (bold, 13 px)
  - Scope summary: "Scope: **Global**" or "Scope: **Department** — Hematology (all units)" or "Scope: **Lab Unit** — Immunology"
  - Left border colour: 3 px purple (Global) / teal (Department) / blue (Lab Unit) — colour *and* the scope text both communicate scope for a11y.
  - "Remove" danger-ghost button on the right.

**FR-UM-18.** Clicking "Remove" MUST show a Carbon confirm modal "Remove <role name>?" with the consequence text: "The user will lose the permissions granted by this assignment on their next login or session refresh." Confirm button is kind `danger`. *(pattern: P-06)*

**FR-UM-19.** Clicking "Add Role Assignment" MUST open a Carbon Modal with these fields:
  - **Role** — `Select` populated from the Role Management roster (active roles only), grouped by type (Standard / Admin / Specialty / Requester). Required.
  - **Scope** — `Select` with options Global / Department / Lab Unit. Required.
  - **Target** — `Select` conditionally populated based on Scope: empty (disabled) for Global; Department list for Department scope; Lab Unit list for Lab Unit scope.
  - Info text: "Scope levels: Global = everywhere. Department = all lab units in that department. Lab Unit = single unit only."
  - Actions: "Cancel" (ghost) / "Add Assignment" (primary).

**FR-UM-20.** If a Role's `scope_constraint` in the registry is `global-only` (e.g., Global Administrator, User Account Administrator, Audit Trail, Analyser Import), the Scope field in the modal MUST lock to Global and the Target field MUST be disabled. A hint row MUST read "This role is always Global."

**FR-UM-21.** The modal MUST disable Save until all required fields resolve to a legal combination (PRD R3 acceptance criteria).

**FR-UM-22.** On successful Add, the modal closes, the new card renders in the assignment list, and the unsaved-changes bar appears. *(pattern: P-09 InlineNotification does not fire on add — only on save-to-server.)*

### 4.4 Provider metadata (Test Requester users)

**FR-UM-23.** The Provider Metadata section MUST be visible only when the user has at least one active role assignment of type `requester`. When the last requester role is removed (mid-edit), the section collapses and its data is preserved in state but not submitted.

**FR-UM-24.** The section MUST contain fields: **Facility / Organization** (TextInput, max 120 chars), **License Number** (TextInput, max 60), **Specialty** (Select — General Practice, Internal Medicine, Pediatrics, Surgery, … configurable per deployment via Dictionary), **Provider ID** (TextInput, max 60 — typically NPI or local equivalent), **Phone** (TextInput, format-validated per locale), **Email** (TextInput, email-validated).

**FR-UM-25.** At least **Facility** and **License Number** are required for any user with a requester assignment; attempting to Save without them MUST display inline field-level errors (P-07 invalid state) and prevent the API call.

### 4.5 Add User (new-row variant)

**FR-UM-26.** The Add User panel MUST render the same layout as the edit panel except:
  - All fields empty / defaulted.
  - No "Deactivate" button.
  - "Create User" replaces "Save" as the primary action.
  - Copy Permissions From User card is present and offered; if used, pre-fills all Role Assignments and Provider Metadata.
  - Login Name, First Name, Last Name, Email are required.
  - A temporary-password field is provided and the force-reset toggle is defaulted ON per §4.6.

**FR-UM-27.** Login Name uniqueness MUST be validated on blur via `GET /api/users?loginName={q}` and displayed as an inline invalid state (P-07) if already taken.

### 4.6 Password & Session (absorbs password-enhancements.md)

**FR-UM-28.** The section MUST expose: **Reset Password** action (ghost button) · **Force password reset at next login** toggle · **Password Expiration Date** (DatePicker, read-only display for the list page, editable here) · **Session Timeout (minutes)** NumberInput with min=5, max=1440, step=5, default 480.

**FR-UM-29.** Clicking Reset Password MUST open a Modal containing:
  - Temporary Password (TextInput, type=password by default with a show/hide toggle; min length 8, max 64; pasting allowed; Unicode allowed — per password-enhancements FR-PP-001 through FR-PP-007).
  - Force password reset at next login (Toggle, default ON — per password-enhancements FR-FR-002).
  - Info text: "The user will be required to choose a new password the next time they log in."
  - Cancel (ghost) / Reset Password (primary).

**FR-UM-30.** On successful reset, the Modal closes and a success InlineNotification (P-09 green) appears at the top of the expanded panel: "Password reset. The user will be prompted to change it on their next login." The notification is dismissible.

**FR-UM-31.** When password validation fails, ALL unmet requirements MUST be shown simultaneously in the modal (password-enhancements FR-PP-008), not just the first one.

**FR-UM-32.** Password Expiration Date MUST default to **10 years from today** when a new password is set (password-enhancements FR-PP-006).

### 4.7 Deactivate / Reactivate

**FR-UM-33.** The "Deactivate" action MUST open a Carbon destructive confirm modal with consequence text listing the number of active sessions that will be terminated and the roles that will be retained-but-inert. *(pattern: P-06)*

**FR-UM-34.** A deactivated user renders in the list with gray status dot, "Inactive" text, and muted row typography (0.75 opacity). Assignments are preserved. The "Deactivate" action becomes "Reactivate" on reopen.

**FR-UM-35.** Batch Deactivate (from TableBatchActions) MUST aggregate the consequence into a single confirm modal showing the count of users and active sessions across the selection.

### 4.8 Permission gating

**FR-UM-36.** The page MUST be reachable only to users holding `admin:user_management` (PRD R1 Admin table). Before the RBAC migration ships, the page MUST fall back to the current binary `ADMIN_MENU` check; post-migration, both checks may be active during transition and either grants access.

**FR-UM-37.** API endpoints called from this page MUST enforce `admin:user_management` server-side (PRD R5). Unauthorized responses (HTTP 403) MUST render as P-09 error InlineNotification "You don't have permission to modify users" without leaking the underlying API response.

### 4.9 Audit logging (PRD R8)

**FR-UM-38.** The UI MUST NOT render audit logs, but every write operation — user create, account-info edit, role assignment add/remove, password reset, force-reset toggle change, deactivate, reactivate — MUST produce a server-side audit event with the acting user, target user, action type, and before/after snapshot. Audit viewing is out of scope for this page.

---

## 5. Data Model

### 5.1 Entities

**User**

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| loginName | String(64) | Unique, required |
| firstName | String(120) | required |
| lastName | String(120) | required |
| email | String(120) | required; validated |
| phone | String(40) | optional; locale-validated |
| displayName | String(120) | nullable; falls back to "firstName lastName" |
| timezone | String(64) | IANA timezone; nullable → lab default |
| locale | String(10) | BCP-47; nullable → lab default |
| isActive | Boolean | default true |
| keycloakId | String(64) | nullable, set on first login via Keycloak sync |
| lastLoginAt | Timestamp | nullable |
| passwordHash | String | bcrypt cost ≥ 10 or Argon2id (password-enhancements FR-PP-009) |
| passwordLastChangedAt | Timestamp | set on any password write |
| passwordExpirationDate | Date | default +10 years from passwordLastChangedAt |
| forcePasswordReset | Boolean | default false; set true on admin password reset unless unchecked |
| sessionTimeoutMinutes | Integer | 5–1440, default 480 |
| createdAt | Timestamp | |
| createdBy | UUID → User.id | |
| updatedAt | Timestamp | |
| updatedBy | UUID → User.id | |

**UserRoleAssignment**

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID → User.id | required |
| roleId | UUID → Role.id | required; Role entity defined in Role Management FRS |
| scopeType | Enum | `global` \| `department` \| `lab_unit` |
| scopeId | UUID | nullable for global; Department.id or LabUnit.id otherwise |
| assignedBy | UUID → User.id | audit |
| assignedAt | Timestamp | |
| expiresAt | Timestamp | nullable (P1 per PRD R12) |

**ProviderMetadata** (requester-type users only)

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID → User.id | unique (1:1) |
| facilityName | String(120) | required when user has requester role |
| licenseNumber | String(60) | required when user has requester role |
| specialty | String(60) | Dictionary-backed |
| providerId | String(60) | NPI or local equivalent |
| phone | String(40) | |
| email | String(120) | |

### 5.2 Relationships

- User 1—N UserRoleAssignment
- User 1—0..1 ProviderMetadata
- UserRoleAssignment N—1 Role (defined in Role Management)
- UserRoleAssignment N—0..1 Department OR LabUnit (polymorphic via scopeType/scopeId)

### 5.3 API endpoints consumed

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/users` | Paginated user list; query params for search, role, active filter |
| GET | `/api/users/{id}` | Single user detail for inline panel |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/{id}` | Update account info + timeout + password-expiry |
| POST | `/api/users/{id}/deactivate` | Deactivate |
| POST | `/api/users/{id}/reactivate` | Reactivate |
| POST | `/api/users/{id}/reset-password` | Body: `{ temporaryPassword, forceResetOnNextLogin }` |
| GET | `/api/users/{id}/role-assignments` | List |
| POST | `/api/users/{id}/role-assignments` | Body: `{ roleId, scopeType, scopeId }` |
| DELETE | `/api/users/{id}/role-assignments/{assignmentId}` | Remove |
| GET | `/api/users/{id}/provider-metadata` | Fetch |
| PUT | `/api/users/{id}/provider-metadata` | Upsert |
| POST | `/api/users/{id}/copy-permissions` | Body: `{ sourceUserLoginName }` |
| GET | `/api/roles?active=true` | Populate Add Role Assignment modal |
| GET | `/api/departments` | Populate Target when scope=department |
| GET | `/api/lab-units` | Populate Target when scope=lab_unit |

---

## 6. Patterns Used

| Pattern | Where |
|---|---|
| P-01 Admin Config Table shell | Page layout |
| P-02 DataTable column conventions | User list |
| P-03 Toolbar / search / filter | User list toolbar |
| P-04 Batch actions | Deactivate Selected |
| P-05 Inline row expansion | Detail panel (edit) + Add User (new-row) |
| P-06 Destructive confirm modal | Remove assignment, Deactivate, Discard unsaved, Reset Password confirm |
| P-07 Form field conventions | All fields in detail panel + both modals |
| P-08 Status/type Tag mapping | Role-type tags + Active/Inactive status |
| P-09 InlineNotification feedback | Unsaved-changes bar + save success + reset success + 403 error |
| P-10 Empty state | Zero-filter-result users |
| P-11 Loading / skeleton | Initial table load |
| P-12 Pagination | List footer |
| P-13 Permission gating | `admin:user_management` frontend + backend |

---

## 7. Permission Scope

**Required permission key:** `admin:user_management` (per PRD R1 Admin permission group).

**Transitional behaviour:** During RBAC migration, the page also accepts the current binary `ADMIN_MENU` check so existing Global Administrators retain access without waiting for role reassignment. Backend MUST enforce at least one of the two (PRD R5).

**Route:** `/admin/users` (preserving current legacy route `/userManagement` as a 301 redirect during migration).

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Initial page load (list of first 25 users) ≤ 1.5 s p95 on a 10,000-user dataset.
- Row expansion ≤ 200 ms (data pre-fetched with the list via `?include=roleAssignments`).
- Add Role Assignment modal opens ≤ 150 ms; populates `/api/roles` from local cache if available.

### 8.2 Accessibility (WCAG 2.1 AA, PRD R6)

- All interactive elements keyboard-reachable; expand chevron toggleable with Enter and Space.
- Focus restoration after any modal closes returns to the trigger button.
- Colour contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components.
- Scope coding not dependent on colour alone — scope text always present.
- Touch targets ≥ 44 × 44 CSS px in the expanded panel (PRD: 0.5 rem vertical padding minimum on checkbox items).
- Screen reader announces "user row expanded / collapsed" via live region on toggle.
- Carbon `@carbon/icons-react` used for all icons (no emoji in production render — PRD R6 a11y rule).

### 8.3 Internationalisation

See §10. All visible strings resolve through `t(key, fallback)`; no hardcoded English in the mockup.

### 8.4 Security

- Temporary passwords MUST NEVER appear in URL query strings, logs, or browser history.
- Reset-password API call uses PUT/POST with body; response contains no password echo.
- Role assignment changes trigger cache invalidation so the next session refresh picks them up (PRD R5).
- Audit event is written *before* the 200 is returned to the client.

### 8.5 Observability

Client-side events to emit to the existing analytics pipeline: `user_created`, `user_deactivated`, `user_reactivated`, `role_assignment_added`, `role_assignment_removed`, `password_reset`, `force_reset_toggled`, `copy_permissions_applied`.

---

## 9. Acceptance Criteria

Each criterion traces to one or more FR numbers.

| ID | Given / When / Then | Traces |
|---|---|---|
| AC-UM-01 | **Given** I am an admin with `admin:user_management` **When** I load `/admin/users` **Then** I see a table of users paginated at 25 rows with columns First Name, Last Name, Login Name, Roles, Pwd Expires, Status, Timeout and a leading expand chevron. | FR-UM-01, FR-UM-10 |
| AC-UM-02 | **Given** I type "abert" in search **When** results render **Then** only users whose First Name, Last Name, Login Name, or Email contain "abert" (case-insensitive) appear. | FR-UM-02 |
| AC-UM-03 | **Given** I filter by Role = "Reception" and Only Active = on **When** results render **Then** only active users with at least one Reception assignment appear. | FR-UM-02 |
| AC-UM-04 | **Given** the user list is empty after filtering **When** the table renders **Then** the empty state shows "No users match your filters" with a ghost "Clear filters" button. | FR-UM-11 |
| AC-UM-05 | **Given** the page is loading **When** data is in flight **Then** a DataTable skeleton of 5 rows is shown. | FR-UM-12 |
| AC-UM-06 | **Given** I click a user row **When** the panel expands **Then** the chevron rotates, the Tile border is blue-60, and the panel contains unsaved bar (hidden), summary bar, Copy Permissions card, Role Assignments header + legend + cards, Password & Session, Actions row. | FR-UM-04, FR-UM-13, FR-UM-14 |
| AC-UM-07 | **Given** I edit any field **When** the next change is made **Then** the yellow unsaved-changes bar appears at the top of the panel. | FR-UM-14 |
| AC-UM-08 | **Given** I click Cancel with unsaved changes **When** the confirm modal appears **Then** it reads "Discard unsaved changes?" with Discard (danger) and Keep editing (ghost) buttons. | FR-UM-15 |
| AC-UM-09 | **Given** I click Add Role Assignment **When** the modal opens **Then** it contains Role, Scope, Target fields and the Add button is disabled until a legal combination is resolved. | FR-UM-19, FR-UM-21 |
| AC-UM-10 | **Given** I select role "Global Administrator" **When** the modal re-renders **Then** Scope locks to Global, Target is disabled, and the hint "This role is always Global" is shown. | FR-UM-20 |
| AC-UM-11 | **Given** a user has a Test Requester role assignment **When** the detail panel renders **Then** the Provider Metadata section is visible. **When** I remove the last requester role **Then** the section collapses. | FR-UM-23 |
| AC-UM-12 | **Given** the user has a requester role and I try to save without a Facility value **When** I click Save **Then** the Facility field shows inline error state and the save API is NOT called. | FR-UM-25 |
| AC-UM-13 | **Given** I click Reset Password **When** the modal opens **Then** the Force-Reset toggle is ON by default and the Temporary Password field allows paste and accepts 8–64 Unicode chars. | FR-UM-29 |
| AC-UM-14 | **Given** I enter an invalid password **When** validation runs **Then** ALL unmet requirements are displayed at once. | FR-UM-31 |
| AC-UM-15 | **Given** I click Deactivate **When** the confirm modal appears **Then** it shows the number of active sessions that will be terminated and the list of assignments that will be preserved-but-inert. | FR-UM-33 |
| AC-UM-16 | **Given** I am not an admin **When** I navigate to `/admin/users` **Then** I receive a 403 render with "You don't have permission to modify users" and no user data is fetched. | FR-UM-36, FR-UM-37 |
| AC-UM-17 | **Given** any write operation succeeds **When** the response returns **Then** a server audit event exists with acting user, target user, action type, and before/after snapshot. | FR-UM-38 |
| AC-UM-18 | **Given** I save a user edit **When** the API returns 200 **Then** the unsaved bar disappears, a green InlineNotification appears, and the row reflects new values without a full page reload. | FR-UM-30 (pattern analog) |
| AC-UM-19 | **Given** the page is rendered **When** I audit color usage **Then** no information is conveyed by color alone — every scope, status, and tag has a textual label alongside the color cue. | FR-UM-06, FR-UM-17, §8.2 |
| AC-UM-20 | **Given** the page is rendered **When** I audit DOM **Then** every visible string is wrapped in `t(key, fallback)` and the keys match §10. | Pattern P-13, §10 |

---

## 10. Localization

All i18n keys use the namespace `admin.users.*` or shared `admin.common.*`. Fallback English is the working default; other bundles provided by the i18n team.

| Key | Fallback |
|---|---|
| admin.users.page.title | User Management |
| admin.users.page.subtitle | Click a user row to expand and edit their role assignments. |
| admin.users.breadcrumb.adminMgmt | Admin Management |
| admin.users.breadcrumb.users | Users |
| admin.users.action.addUser | Add User |
| admin.users.action.deactivateSelected | Deactivate selected |
| admin.users.filter.role.placeholder | Filter by role |
| admin.users.filter.onlyActive | Only Active |
| admin.users.search.placeholder | Search by name, login, or email… |
| admin.users.column.firstName | First Name |
| admin.users.column.lastName | Last Name |
| admin.users.column.loginName | Login Name |
| admin.users.column.roles | Roles |
| admin.users.column.pwdExpires | Pwd Expires |
| admin.users.column.status | Status |
| admin.users.column.timeout | Timeout |
| admin.users.status.active | Active |
| admin.users.status.inactive | Inactive |
| admin.users.aria.expandRow | Expand user row |
| admin.users.unsaved.message | Unsaved changes — click Save to apply or Close to discard. |
| admin.users.summary.login | Login |
| admin.users.summary.name | Name |
| admin.users.summary.pwdExpires | Pwd Expires |
| admin.users.summary.status | Status |
| admin.users.action.editAccount | Edit Account Info |
| admin.users.copy.label | Copy Permissions From User: |
| admin.users.copy.placeholder | Enter username… |
| admin.users.copy.apply | Apply |
| admin.users.roles.sectionTitle | Role Assignments |
| admin.users.roles.addAssignment | Add Role Assignment |
| admin.users.roles.scopeLegend.global | Global |
| admin.users.roles.scopeLegend.department | Department |
| admin.users.roles.scopeLegend.labUnit | Lab Unit |
| admin.users.roles.scope.prefix | Scope: |
| admin.users.roles.scope.allUnits | — All lab units |
| admin.users.roles.remove | Remove |
| admin.users.roles.remove.confirm.title | Remove role assignment |
| admin.users.roles.remove.confirm.body | The user will lose the permissions granted by this assignment on their next login or session refresh. |
| admin.users.modal.addAssignment.title | Add Role Assignment |
| admin.users.modal.addAssignment.role | Role |
| admin.users.modal.addAssignment.scope | Scope |
| admin.users.modal.addAssignment.target | Target (if scoped) |
| admin.users.modal.addAssignment.info | Scope levels: Global = everywhere. Department = all lab units in that department. Lab Unit = single unit only. |
| admin.users.modal.addAssignment.globalOnlyHint | This role is always Global. |
| admin.users.provider.title | Provider Metadata |
| admin.users.provider.visibilityNote | Shown when a Test Requester role is assigned. |
| admin.users.provider.facility | Facility / Organization |
| admin.users.provider.license | License Number |
| admin.users.provider.specialty | Specialty |
| admin.users.provider.providerId | Provider ID |
| admin.users.provider.phone | Phone |
| admin.users.provider.email | Email |
| admin.users.password.section | Password & Session |
| admin.users.password.resetPassword | Reset Password |
| admin.users.password.forceReset | Force password reset at next login |
| admin.users.password.expiration | Password Expiration Date |
| admin.users.session.timeout | Session Timeout (minutes) |
| admin.users.modal.resetPassword.title | Reset Password |
| admin.users.modal.resetPassword.temp | Temporary Password |
| admin.users.modal.resetPassword.info | The user will be required to choose a new password the next time they log in. |
| admin.users.modal.resetPassword.submit | Reset Password |
| admin.users.deactivate.button | Deactivate |
| admin.users.reactivate.button | Reactivate |
| admin.users.deactivate.confirm.title | Deactivate user |
| admin.users.deactivate.confirm.sessionCount | Active sessions that will be terminated: {count} |
| admin.users.deactivate.confirm.assignmentsRetained | Role assignments preserved (inert until reactivated): {n} |
| admin.users.save | Save |
| admin.users.cancel | Cancel |
| admin.users.createUser | Create User |
| admin.users.discard.confirm.title | Discard unsaved changes? |
| admin.users.discard.confirm.discard | Discard |
| admin.users.discard.confirm.keep | Keep editing |
| admin.users.empty.title | No users match your filters |
| admin.users.empty.clear | Clear filters |
| admin.users.toast.saved | Changes saved |
| admin.users.toast.passwordReset | Password reset. The user will be prompted to change it on their next login. |
| admin.users.toast.forbidden | You don't have permission to modify users |

Shared / re-used:

| Key | Fallback |
|---|---|
| admin.common.pagination.itemsPerPage | Items per page: |
| admin.common.pagination.range | {start}–{end} of {total} |
| admin.common.roleType.standard | Standard |
| admin.common.roleType.admin | Admin |
| admin.common.roleType.specialty | Specialty |
| admin.common.roleType.requester | Requester |

---

## 11. Out of Scope

- **Role CRUD** — lives in Role Management (Phase 5 Page 2).
- **Permission matrix** — Permission Inspector (Phase 2 per PRD R13).
- **Password policy settings (length, hash algorithm, Unicode)** — global, configured in Application Properties.
- **Keycloak IdP configuration** — Integrations bucket.
- **Audit log viewer** — Reports bucket.
- **Self-service profile editing by non-admin users** — out of admin redesign scope; handled in a separate track.
- **Role assignment expiration date UX** — deferred (PRD P1 R12).
- **Bulk role-assignment "assign role X to all users in department Y"** — deferred (PRD P1 R11).
- **LDAP-backed read-only mode** — not implemented in this pass; noted as deployment consideration.
- **MFA / TOTP setup** — not part of this page.

---

## 12. Open Questions

| # | Question | Resolution path |
|---|---|---|
| OQ-UM-1 | Should deactivated users be visible in the default view (greyed) or hidden behind an "include inactive" filter? | Default is *hidden*; "Include inactive" checkbox adds them back (aligns with existing OpenELIS behaviour; confirm with Reagan during Phase 1 implementation). |
| OQ-UM-2 | Should email changes trigger a verification flow? | Out of scope for v1; flagged as a security follow-up. |
| OQ-UM-3 | Does Copy Permissions From User copy Provider Metadata too? | Assumption: NO — metadata is identity-specific. Confirm with implementers. |
| OQ-UM-4 | What happens to a requester's existing open orders if their requester role is removed? | Assumption: orders stay open, the user just loses ordering UI access. Confirm with Reagan. |
| OQ-UM-5 | Is Session Timeout per-user or per-role? | Current behaviour = per-user. RBAC PRD does not override. Keep per-user. |
| OQ-UM-6 | Does "Pwd Expires" shown in the list need a red tag for passwords within 14 days of expiry, or only on expiry? | Proposed: yellow tag at ≤14 days, red tag at expired. Confirm. |

---

## 13. Traceability

| FR | PRD ref | AC | i18n keys |
|---|---|---|---|
| FR-UM-01 | — | AC-UM-01 | admin.users.column.* |
| FR-UM-02 | US-1 | AC-UM-02, AC-UM-03 | admin.users.search.* admin.users.filter.* |
| FR-UM-05, 06, 17 | R6 a11y | AC-UM-19 | admin.common.roleType.*, admin.users.status.* |
| FR-UM-13, 14 | mockup §User Mgmt | AC-UM-06 | admin.users.unsaved.message, admin.users.summary.* |
| FR-UM-17 to 22 | R3, US-2 | AC-UM-09, AC-UM-10 | admin.users.modal.addAssignment.* |
| FR-UM-23 to 25 | R4, US-4, US-11 | AC-UM-11, AC-UM-12 | admin.users.provider.* |
| FR-UM-26, 27 | — | (covered by AC-UM-01 + modal analogs) | admin.users.createUser |
| FR-UM-28 to 32 | password-enhancements FR-PP, FR-FR | AC-UM-13, AC-UM-14 | admin.users.password.*, admin.users.modal.resetPassword.* |
| FR-UM-33 to 35 | — | AC-UM-15 | admin.users.deactivate.* |
| FR-UM-36, 37 | R1, R5 | AC-UM-16 | admin.users.toast.forbidden |
| FR-UM-38 | R8 | AC-UM-17 | — |

---

## 14. Change log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-04-23 | 1.0 | Casey / Claude (openelis-design v3.1) | Initial FRS — Phase 5 Page 1, ports rbac-ui-mockup User Management view + absorbs password-enhancements UX. |
