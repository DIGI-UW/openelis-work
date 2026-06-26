# Blood Bank: Issue-to-Patient & Emergency Release
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-25
**Status:** Draft for Review
**Jira:** OGC-461 (Blood Bank epic OGC-453)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Blood Bank Program & Unit Reception (Spec 2 / OGC-457), Patient Blood Bank Record (Spec 3 / OGC-459), Pre-Transfusion Testing & Transfusion Request (Spec 4 / OGC-454), Order Entry (existing), Results Entry (existing), Validation (existing)

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

This spec defines the final stage of the OpenELIS Blood Bank transfusion chain: the physical issue of blood units from the blood bank to clinical staff, and a supervisor-gated emergency release pathway for urgent cases where standard crossmatch testing cannot be completed before issue. A dedicated Issue Queue screen surfaces all `APPROVED` transfusion requests awaiting handover. Before issuing, the blood bank technologist completes a mandatory 4-item pre-issue safety checklist and records who is physically receiving the units. Confirming issue transitions the `TransfusionRequest` to `ISSUED`, creates `TransfusionHistoryEntry` records for each unit, and automatically populates the Unit Issuance Log in the Patient Blood Bank Record (Spec 3). Emergency release bypasses crossmatch testing, transitions a request directly from `PENDING` to `APPROVED`, and requires supervisor sign-off with a documented clinical reason.

---

## 2. Problem Statement

**Current state:** There is no structured pathway in OpenELIS for a blood bank technologist to confirm the physical handover of blood units to a nurse or clinician. Once crossmatch testing is complete, the chain of custody is managed on paper or verbally, with no system record of who received the units, when, or whether pre-issue safety checks were performed.

**Impact:** Missing traceability data for the final handover step means a transfusion audit — required under WHO, AABB, and ISO 15189 standards — cannot be completed entirely within OpenELIS. Pre-issue safety failures (wrong patient, expired unit, mismatched component type) that might be caught by a structured checklist go undetected because no checklist exists.

**Proposed solution:** A dedicated Issue Queue screen (Blood Bank → Issue Queue) showing all `APPROVED` transfusion requests. A case view for each request guides the technologist through a 4-item pre-issue safety checklist before enabling the Confirm Issue action. Issue confirmation creates an immutable `TransfusionHistoryEntry` per unit, transitions the request to `ISSUED`, and populates the Patient Blood Bank Record automatically. An emergency release modal allows supervisors to bypass crossmatch with a documented reason.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Blood Bank Technologist | Perform standard issue from queue, view issue history | Cannot initiate emergency release |
| Blood Bank Supervisor | All Technologist permissions + initiate emergency release, approve emergency requests | Emergency release requires this role |
| Blood Bank Admin | View Issue Queue and history | No write access |
| System Administrator | Full | — |

**Required permission keys:**

- `bloodbank.issue.view` — View the Issue Queue and issue history
- `bloodbank.issue.confirm` — Confirm issue of an approved transfusion request (complete checklist + submit)
- `bloodbank.issue.emergency` — Initiate emergency release (create request at APPROVED, bypassing crossmatch)

---

## 4. Functional Requirements

### 4.1 Issue Queue

**FR-1-001:** A dedicated "Issue Queue" page SHALL be accessible via Blood Bank → Issue Queue in the Carbon SideNav. It SHALL display all `TransfusionRequest` records with status `APPROVED` that have not yet been issued, across all patients, sorted by approval timestamp ascending (oldest first).

**FR-1-002:** The Issue Queue SHALL display summary stat tiles at the top of the page showing: (a) total pending issue count, (b) count of requests approved more than 60 minutes ago (late), (c) count flagged as emergency release.

**FR-1-003:** The Issue Queue DataTable SHALL include the following columns: Request ID, Patient Name, Patient ID, Component Type, Units, ABO/Rh, Approved At, Wait Time, Emergency Flag, Status, and an Actions column.

**FR-1-004:** The Issue Queue SHALL provide a filter bar allowing filtering by: Component Type (multi-select), Emergency Flag (toggle), and a date range picker for Approved At.

**FR-1-005:** The Issue Queue SHALL include a toolbar "Emergency Release" button (accessible to users with `bloodbank.issue.emergency`) that opens the Emergency Release modal.

**FR-1-006:** Users without `bloodbank.issue.view` permission SHALL NOT see the Issue Queue in the SideNav. Direct URL access SHALL return HTTP 403.

### 4.2 Issue Case View

**FR-2-001:** Clicking a row in the Issue Queue SHALL navigate to the Issue Case View for that request. The Case View SHALL use a two-panel layout: a 240px fixed left sidebar and a scrollable right panel.

**FR-2-002:** The left sidebar SHALL display read-only request metadata: Request ID, Patient Name, Patient ID, Date of Birth, ABO/Rh type, Component Type, Quantity, Requesting Clinician, Approved By, Approved At, Crossmatch Result summary (Compatible / Emergency Release — No Crossmatch), and any active compatibility warnings from Spec 4.

**FR-2-003:** The right panel SHALL display a unit list table showing each `TransfusionRequestUnit` linked to the request with columns: Unit Number, ABO/Rh, Component Type, Expiry Date, Storage Location, Crossmatch Result.

**FR-2-004:** Below the unit list, the right panel SHALL display the Pre-Issue Safety Checklist section containing the following 4 mandatory checkboxes:

| Checklist Item | i18n Key |
|---|---|
| Patient ID verified against unit label | `label.issue.checklist.patientId` |
| Unit expiry date confirmed — unit is not expired | `label.issue.checklist.expiry` |
| Unit condition visually inspected — no discoloration, clots, or damage | `label.issue.checklist.condition` |
| Blood component type matches transfusion request | `label.issue.checklist.componentType` |

**FR-2-005:** Below the checklist, the right panel SHALL display a "Received By" `TextInput` (required) where the technologist enters the name of the nurse or clinician physically collecting the units.

**FR-2-006:** The "Confirm Issue" button SHALL be disabled until all 4 checklist items are checked AND the "Received By" field is non-empty. An `InlineNotification` (kind: warning) SHALL be displayed when the button is disabled explaining what is required.

**FR-2-007:** When the user clicks "Confirm Issue" with all prerequisites met, a confirmation `Modal` SHALL appear showing a summary: Patient name, unit count, component type, and "Received By" value. The modal SHALL have two actions: "Confirm & Issue" (primary) and "Cancel" (secondary).

**FR-2-008:** On confirmation, the system SHALL:
  1. Transition `TransfusionRequest.status` from `APPROVED` to `ISSUED`
  2. Set `TransfusionRequest.issuedAt` to current timestamp
  3. Set `TransfusionRequest.issuedBy` to the current user
  4. Set `TransfusionRequest.receivedBy` to the value entered in the "Received By" field
  5. Set `TransfusionRequest.checklistBitmask` to the bitmask of the 4 completed checklist items (all 4 = 0b1111 = 15)
  6. For each `TransfusionRequestUnit`, create a `TransfusionHistoryEntry` record
  7. For each issued unit, transition `BloodUnit.status` from `RESERVED` to `ISSUED`
  8. Append to the Patient Blood Bank Record Unit Issuance Log (Spec 3) automatically

**FR-2-008:** After a successful issue, the user SHALL be redirected back to the Issue Queue with an `InlineNotification` (kind: success) confirming the issue.

**FR-2-009:** Users without `bloodbank.issue.confirm` permission SHALL see the Case View in read-only mode. The checklist, Received By field, and Confirm Issue button SHALL be hidden. An `InlineNotification` (kind: info) SHALL indicate that the user does not have issue permission.

### 4.3 Emergency Release

**FR-3-001:** Users with `bloodbank.issue.emergency` permission SHALL be able to initiate an emergency release via the "Emergency Release" toolbar button in the Issue Queue, or via the "Emergency Release" action on a `PENDING` request in the Spec 4 Pre-Transfusion Testing worklist.

**FR-3-002:** The Emergency Release modal SHALL capture the following fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Patient | Patient search | Yes | Search existing patient; or select "Unknown Patient" option |
| Unknown Patient | Toggle | No | Shown if no patient match; forces O-neg units only |
| Component Type | Select | Yes | From active BloodComponentTypes; emergency only permits pRBC (O-negative) and FFP (AB) |
| Quantity | Integer (1-4) | Yes | Default 1 |
| Clinical Reason | Textarea | Yes | Free text; minimum 10 characters; recorded on CompatibilityOverride |
| Supervisor PIN / Password | Password | Yes | Confirms supervisor identity; validated against current user credentials |

**FR-3-003:** On submission of the Emergency Release form, the system SHALL:
  1. Create a new `TransfusionRequest` with `isEmergencyRelease = true`
  2. Set status directly to `APPROVED`, bypassing `UNITS_SELECTED` and `CROSSMATCH_COMPLETE`
  3. Create a `CompatibilityOverride` record with `reason = clinicalReason`, `overriddenBy = currentUser`, `overrideType = EMERGENCY_RELEASE`
  4. Automatically select the oldest available O-negative pRBC or AB FFP units (per component type) up to the requested quantity and set them to `RESERVED`
  5. Display a warning if insufficient eligible units are available in inventory

**FR-3-004:** Emergency release requests SHALL be flagged with an `InlineNotification` (kind: error) banner in the Issue Case View reading "Emergency Release — No Crossmatch Performed. Confirm with clinical team before issue."

**FR-3-005:** Emergency release requests SHALL display an "EMERGENCY" `Tag` (kind: red) in the Issue Queue DataTable row and Case View sidebar.

**FR-3-006:** If insufficient O-negative pRBC or AB FFP units are available in inventory to fulfill the emergency request, the system SHALL display a warning `InlineNotification` in the modal specifying how many units are available. The supervisor MAY proceed with a partial quantity or cancel. The system SHALL NOT silently substitute other unit types.

### 4.4 Issue History

**FR-4-001:** The Issue Queue SHALL include an "Issue History" tab that displays all `TransfusionRequest` records with status `ISSUED`, sorted by `issuedAt` descending, for audit purposes. This tab is accessible to all users with `bloodbank.issue.view`.

**FR-4-002:** The Issue History DataTable SHALL include columns: Request ID, Patient Name, Component Type, Units Issued, Issued At, Issued By, Received By, Emergency Flag.

**FR-4-003:** Clicking a row in Issue History SHALL open a read-only Case View of the issued request, including the completed checklist state and `TransfusionHistoryEntry` records. No edit actions are available on issued requests.

---

## 5. Data Model

### New Entities

**TransfusionHistoryEntry**

Created one per `TransfusionRequestUnit` when a `TransfusionRequest` transitions to `ISSUED`.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| transfusionRequest | TransfusionRequest | Yes | FK to parent request |
| transfusionRequestUnit | TransfusionRequestUnit | Yes | FK to specific unit |
| patient | Patient | Yes | Denormalized from request for direct Patient BB Record access |
| bloodUnitId | String (50) | Yes | ISBT 128 unit number; denormalized for audit trail even if unit record changes |
| componentType | String (50) | Yes | Denormalized from unit |
| aboGroup | String (5) | Yes | Denormalized from unit |
| rhFactor | String (10) | Yes | Denormalized from unit |
| issuedAt | LocalDateTime | Yes | Timestamp of Confirm Issue action |
| issuedBy | SystemUser | Yes | Blood bank technologist who confirmed issue |
| receivedBy | String (200) | Yes | Free-text name of nurse/clinician who collected units |
| checklistBitmask | Integer | Yes | Bitmask of 4 completed checklist items; 15 (0b1111) = all complete |
| isEmergencyRelease | Boolean | Yes | True if parent request was an emergency release |
| compatibilityOverrideId | Long | No | FK to CompatibilityOverride if emergency or supervisor override applied |
| createdAt | LocalDateTime | Yes | Auto-set on creation |

### Modified Entities

**TransfusionRequest** — Add fields:

| Field | Type | Notes |
|---|---|---|
| issuedAt | LocalDateTime | Set when status transitions to ISSUED |
| issuedBy | SystemUser | User who confirmed issue |
| receivedBy | String (200) | Free-text recipient recorded at issue time |
| checklistBitmask | Integer | Bitmask of 4 pre-issue checklist items; required before ISSUED transition |
| isEmergencyRelease | Boolean | True if created via emergency release pathway |

**TransfusionRequest status lifecycle** (full chain across Specs 4 and 5):

```
PENDING → UNITS_SELECTED → CROSSMATCH_COMPLETE → APPROVED → ISSUED
                                                    ↑
                              Emergency Release creates directly at APPROVED
```

**BloodUnit** (from Spec 2) — No new fields. Status transitions:
- `RESERVED → ISSUED` on `TransfusionRequest` → `ISSUED`
- `RESERVED → AVAILABLE` on `TransfusionRequest` → `CANCELLED`

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/bloodbank/issue-queue` | List APPROVED requests awaiting issue; supports filter params (componentType, emergency, dateFrom, dateTo) | `bloodbank.issue.view` |
| GET | `/api/v1/bloodbank/issue-queue/history` | List ISSUED requests (history tab) | `bloodbank.issue.view` |
| GET | `/api/v1/bloodbank/issue-queue/stats` | Return stat tile counts (pending, late, emergency) | `bloodbank.issue.view` |
| GET | `/api/v1/bloodbank/transfusion-request/{id}/issue-context` | Return request + units + checklist state for Case View | `bloodbank.issue.view` |
| POST | `/api/v1/bloodbank/transfusion-request/{id}/issue` | Confirm issue: validates checklist bitmask, receivedBy, transitions to ISSUED, creates TransfusionHistoryEntry records | `bloodbank.issue.confirm` |
| POST | `/api/v1/bloodbank/emergency-release` | Create emergency release request at APPROVED; auto-selects eligible units | `bloodbank.issue.emergency` |
| GET | `/api/v1/bloodbank/transfusion-history/{patientId}` | Return all TransfusionHistoryEntry for a patient (used by Patient BB Record) | `bloodbank.issue.view` |

---

## 7. UI Design

See companion React mockup: `issue-to-patient-mockup.jsx`

### Navigation Path

Blood Bank (SideNav) → Issue Queue (distinct SideNavMenuItem)

### Key Screens

1. **Issue Queue (Worklist)** — Stat tiles + filter bar + DataTable of APPROVED requests + Emergency Release toolbar button + Issue History tab
2. **Issue Case View** — Left sidebar (request metadata, units, compatibility summary) + right panel (unit list table, pre-issue checklist, Received By field, Confirm Issue button)
3. **Emergency Release Modal** — Patient search, component type, quantity, clinical reason, supervisor PIN
4. **Issue Confirmation Modal** — Summary before final Confirm Issue submit

### Interaction Patterns

- DataTable row click navigates to Case View (no modal)
- Pre-issue checklist: 4 inline `Checkbox` items; checking all 4 and filling Received By enables Confirm Issue
- Emergency Release: `Modal` with 5-section form (constitution Principle 3 exception for modals)
- Issue Confirmation: secondary `Modal` for destructive/irreversible action confirmation (constitution Principle 3)
- Issue History tab: `Tabs` component on the Issue Queue page switching between Pending and History views

---

## 8. Business Rules

**BR-001:** A `TransfusionRequest` can only be issued if its status is exactly `APPROVED`. Attempting to issue a request in any other status SHALL return HTTP 409.

**BR-002:** The `checklistBitmask` submitted with the issue request MUST equal 15 (all 4 items checked). The API SHALL reject requests with any other bitmask value with HTTP 422 and error key `error.issue.checklistIncomplete`.

**BR-003:** The `receivedBy` field MUST be non-empty and contain at least 2 characters. The API SHALL reject empty or whitespace-only values with HTTP 422 and error key `error.issue.receivedByRequired`.

**BR-004:** Emergency release is restricted to O-negative pRBC and AB FFP component types. Attempting to create an emergency release for any other component type SHALL return HTTP 422 with error key `error.issue.emergencyComponentInvalid`.

**BR-005:** An emergency release request with `unknownPatient = true` SHALL only receive O-negative pRBC units. AB FFP requires a known patient with ABO type on file or clinical discretion noted in the reason field.

**BR-006:** Unit auto-selection for emergency release uses FIFO (oldest expiry first within eligible AVAILABLE units of the correct type). If fewer eligible units exist than requested, the system creates the request with the available count and flags the shortfall.

**BR-007:** Once a `TransfusionRequest` reaches `ISSUED` status, it is immutable. No fields may be modified. Corrections require a new request.

**BR-008:** The `TransfusionHistoryEntry` is written in the same database transaction as the `TransfusionRequest` status transition. If the transaction fails, both changes are rolled back together.

**BR-009:** A request approved more than 60 minutes ago and still in `APPROVED` status is considered "late." The Issue Queue stat tile and row styling SHALL reflect this (late rows shown with `Tag kind="warm-gray"` and a clock icon).

**BR-010:** Supervisor PIN verification for emergency release SHALL validate the submitted password against the current authenticated user's credentials via the existing OpenELIS password verification mechanism. The user must already hold `bloodbank.issue.emergency` permission — PIN entry is a second confirmation step, not a permission bypass.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.issue.queueTitle` | Issue Queue |
| `heading.issue.historyTitle` | Issue History |
| `heading.issue.caseViewTitle` | Issue Request |
| `heading.issue.emergencyModal` | Emergency Release |
| `heading.issue.confirmModal` | Confirm Issue |
| `heading.issue.checklist` | Pre-Issue Safety Checklist |
| `heading.issue.unitList` | Units to Issue |
| `label.issue.statPending` | Pending Issue |
| `label.issue.statLate` | Late (>60 min) |
| `label.issue.statEmergency` | Emergency Release |
| `label.issue.requestId` | Request ID |
| `label.issue.patient` | Patient |
| `label.issue.patientId` | Patient ID |
| `label.issue.dob` | Date of Birth |
| `label.issue.componentType` | Component Type |
| `label.issue.units` | Units |
| `label.issue.aboRh` | ABO/Rh |
| `label.issue.approvedAt` | Approved At |
| `label.issue.waitTime` | Wait Time |
| `label.issue.emergencyFlag` | Emergency |
| `label.issue.status` | Status |
| `label.issue.issuedAt` | Issued At |
| `label.issue.issuedBy` | Issued By |
| `label.issue.receivedBy` | Received By |
| `label.issue.receivedByPlaceholder` | Enter name of nurse or clinician collecting units |
| `label.issue.checklist.patientId` | Patient ID verified against unit label |
| `label.issue.checklist.expiry` | Unit expiry date confirmed — unit is not expired |
| `label.issue.checklist.condition` | Unit condition visually inspected — no discoloration, clots, or damage |
| `label.issue.checklist.componentType` | Blood component type matches transfusion request |
| `label.issue.unitNumber` | Unit Number |
| `label.issue.expiryDate` | Expiry Date |
| `label.issue.storageLocation` | Storage Location |
| `label.issue.crossmatchResult` | Crossmatch Result |
| `label.issue.requestingClinician` | Requesting Clinician |
| `label.issue.approvedBy` | Approved By |
| `label.issue.compatibilityWarning` | Compatibility Warning |
| `label.issue.unknownPatient` | Unknown Patient |
| `label.issue.clinicalReason` | Clinical Reason |
| `label.issue.supervisorPin` | Supervisor Password |
| `label.issue.quantity` | Quantity |
| `button.issue.confirmIssue` | Confirm Issue |
| `button.issue.emergencyRelease` | Emergency Release |
| `button.issue.cancelIssue` | Cancel |
| `button.issue.backToQueue` | Back to Issue Queue |
| `button.issue.submitEmergency` | Submit Emergency Release |
| `message.issue.issueSuccess` | Units issued successfully. Patient Blood Bank Record updated. |
| `message.issue.emergencyCreated` | Emergency release request created and approved. Proceed to issue. |
| `message.issue.checklistRequired` | Complete all checklist items and enter a recipient name before issuing. |
| `message.issue.emergencyBanner` | Emergency Release — No Crossmatch Performed. Confirm with clinical team before issue. |
| `message.issue.insufficientUnits` | Only {available} unit(s) of the requested type available. Proceeding will create a partial release. |
| `message.issue.readOnly` | You do not have permission to issue units. Contact your supervisor. |
| `message.issue.lateWarning` | This request has been approved for over 60 minutes. Please prioritize issue. |
| `message.issue.confirmSummary` | You are about to issue {count} unit(s) of {componentType} to patient {patientName}. Received by: {receivedBy}. This action cannot be undone. |
| `error.issue.checklistIncomplete` | All 4 pre-issue checklist items must be completed before issue. |
| `error.issue.receivedByRequired` | Received By is required and must be at least 2 characters. |
| `error.issue.emergencyComponentInvalid` | Emergency release is only permitted for O-negative pRBC and AB FFP. |
| `error.issue.notApproved` | This request is not in APPROVED status and cannot be issued. |
| `error.issue.supervisorPinInvalid` | Supervisor password is incorrect. Emergency release not created. |
| `nav.issue.queue` | Issue Queue |
| `nav.issue.history` | Issue History |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| checklistBitmask | Must equal 15 (all 4 items checked) | `error.issue.checklistIncomplete` |
| receivedBy | Required; minimum 2 characters; maximum 200 characters | `error.issue.receivedByRequired` |
| clinicalReason (emergency) | Required; minimum 10 characters; maximum 1000 characters | `error.issue.clinicalReasonRequired` |
| componentType (emergency) | Must be pRBC (O-negative) or FFP (AB) | `error.issue.emergencyComponentInvalid` |
| quantity (emergency) | Integer 1–4 | `error.issue.quantityRange` |
| supervisorPin | Must match current user's password via existing auth mechanism | `error.issue.supervisorPinInvalid` |
| transfusionRequest.status (at issue time) | Must be APPROVED | `error.issue.notApproved` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Issue Queue and history | `bloodbank.issue.view` | Page not shown in SideNav; direct URL returns HTTP 403 |
| Confirm issue of a request | `bloodbank.issue.confirm` | Checklist, Received By, and Confirm Issue button hidden; read-only `InlineNotification` shown |
| Initiate emergency release | `bloodbank.issue.emergency` | Emergency Release toolbar button hidden; API returns HTTP 403 |

All three permission checks are enforced at both UI layer (component visibility) and API layer (HTTP 403 for unauthorized requests).

---

## 12. Acceptance Criteria

### Functional — Issue Queue

- [ ] Users with `bloodbank.issue.view` see the Issue Queue in the Blood Bank SideNav
- [ ] The Issue Queue displays only `TransfusionRequest` records with status `APPROVED`
- [ ] Stat tiles correctly show pending count, late count (>60 min), and emergency count
- [ ] Filtering by Component Type, Emergency Flag, and date range reduces the DataTable rows correctly
- [ ] Clicking a row navigates to the Issue Case View for that request
- [ ] The Issue History tab shows all `ISSUED` requests sorted by `issuedAt` descending

### Functional — Issue Case View

- [ ] The left sidebar displays all request metadata fields (FR-2-002)
- [ ] The unit list table shows all `TransfusionRequestUnit` records linked to the request
- [ ] All 4 pre-issue checklist items are displayed as unchecked on initial load
- [ ] The "Confirm Issue" button is disabled until all 4 checkboxes are checked AND Received By is non-empty
- [ ] An `InlineNotification` (warning) is shown while prerequisites are incomplete
- [ ] Completing all prerequisites enables the Confirm Issue button
- [ ] Clicking Confirm Issue shows the confirmation modal with correct patient name, unit count, component type, and Received By value
- [ ] Confirming the modal transitions `TransfusionRequest` to `ISSUED` and redirects to Issue Queue with success notification
- [ ] After issue, `BloodUnit.status` for each issued unit is `ISSUED`
- [ ] After issue, a `TransfusionHistoryEntry` exists for each issued unit with correct fields
- [ ] After issue, the Patient Blood Bank Record Unit Issuance Log contains the new entries
- [ ] Emergency release requests show the red `InlineNotification` banner in the Case View

### Functional — Emergency Release

- [ ] Users without `bloodbank.issue.emergency` do not see the Emergency Release button
- [ ] Users with `bloodbank.issue.emergency` can open the Emergency Release modal from the Issue Queue toolbar
- [ ] The modal rejects non-O-neg pRBC and non-AB FFP component types with an error
- [ ] A valid emergency release creates a `TransfusionRequest` with `isEmergencyRelease = true` and status `APPROVED`
- [ ] A `CompatibilityOverride` record is created with `overrideType = EMERGENCY_RELEASE` and the supplied reason
- [ ] The oldest available eligible units are auto-selected and set to `RESERVED`
- [ ] A warning is displayed if insufficient eligible units exist
- [ ] An incorrect supervisor password shows `error.issue.supervisorPinInvalid` and does not create the request

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English text in JSX
- [ ] Issue confirmation API call completes within 3 seconds under normal conditions
- [ ] All permission checks enforced at API layer (HTTP 403 for unauthorized requests)
- [ ] `TransfusionHistoryEntry` creation and `TransfusionRequest` status transition occur in a single database transaction (rolled back together on failure)
- [ ] Emergency release units auto-selection uses FIFO (oldest expiry first)

### Integration

- [ ] Patient Blood Bank Record Unit Issuance Log (Spec 3) is populated automatically on issue without manual intervention
- [ ] `BloodUnit.status` transitions from `RESERVED` to `ISSUED` on issue (Spec 2 inventory)
- [ ] Emergency release reads available O-negative pRBC and AB FFP from the Spec 2 inventory workbench (no separate inventory store)
