# Blood Bank: Pre-Transfusion Testing & Transfusion Request
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Draft for Review
**Jira:** TBD (Blood Bank epic)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Blood Bank Program & Unit Reception (Spec 1), Patient Blood Bank Record (Spec 2), Issue-to-Patient & Emergency Release (Spec 5), Order Entry (existing), Results Entry (existing), Validation (existing)

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

This spec defines the Transfusion Request and pre-transfusion testing workflow in OpenELIS. A Transfusion Request is created when a clinician orders blood for a patient. The workflow: (1) creates the request and links it to the patient, (2) selects compatible units from the blood unit inventory crossmatch pool, (3) triggers pre-transfusion testing (type & screen or type & crossmatch) using the existing order/result/validation chain, and (4) holds selected units as Reserved until testing is complete and the request is either approved for issue or cancelled. Compatibility assessment applies ABO/Rh matching, alloantibody-driven antigen-negative filtering, and (if Tier 2 is enabled) special requirement matching — all sourced from the Patient Blood Bank Record. Soft safety interlocks warn on incompatibility and require supervisor override with audit trail; they do not hard-block.

---

## 2. Problem Statement

**Current state:** There is no structured pathway in OpenELIS for a clinician to request blood, for the lab to select compatible units, and for crossmatch testing to be linked to a specific patient-unit pairing. Crossmatch results, when they exist, are not automatically tied to inventory availability.

**Impact:** Unit selection is manual and error-prone. There is no system-enforced link between a requested unit, its crossmatch result, and the patient it is intended for. Incompatibilities may be missed at issue time.

**Proposed solution:** A Transfusion Request entity that links a patient to one or more blood units selected from the compatible inventory pool. Pre-transfusion tests are ordered using the existing test ordering infrastructure, tied to the request. The unit reservation mechanism from Spec 1 holds selected units off the general pool. When testing is validated, the request moves to Approved and units become available for issue via Spec 5. Soft compatibility interlocks warn when a unit-patient pairing has a potential incompatibility; a supervisor can override with a recorded reason.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Blood Bank Technologist | Create transfusion requests, select units, enter crossmatch results, view requests | Cannot approve (validate) requests |
| Blood Bank Supervisor | All Technologist permissions + approve requests, override compatibility warnings | Override creates audited record |
| Blood Bank Admin | View requests and results | No write access |
| Ordering Clinician | Create transfusion requests (via order entry), view request status | Cannot select units or enter results |
| System Administrator | Full | — |

**Required permission keys:**

- `bloodbank.request.view` — View transfusion requests and crossmatch results
- `bloodbank.request.create` — Create a transfusion request
- `bloodbank.request.selectUnit` — Select units from the crossmatch pool and reserve them
- `bloodbank.request.result` — Enter crossmatch results (existing result permission, scoped to Blood Bank)
- `bloodbank.request.approve` — Approve a request (validate crossmatch results)
- `bloodbank.request.cancel` — Cancel a request and release reserved units
- `bloodbank.request.override` — Override a compatibility warning

---

## 4. Functional Requirements

### 4.1 Transfusion Request Creation

**FR-1-001:** A Transfusion Request SHALL be created by a user with `bloodbank.request.create` permission via Blood Bank → New Transfusion Request, or from within the patient's record. A request SHALL always be linked to a specific patient.

**FR-1-002:** The Transfusion Request form SHALL capture:

| Field | Type | Required | Notes |
|---|---|---|---|
| Patient | Patient search / select | Yes | Links to existing OpenELIS patient record |
| Component Type | Select | Yes | From sample types under Blood Bank lab unit |
| Quantity | Integer | Yes | Number of units requested; default 1 |
| Clinical Indication | Text (500) | No | Free text; why blood is being requested |
| Ordering Clinician | Text (200) | Yes | Name of requesting physician |
| Required By Date/Time | Datetime | No | Target availability; drives urgency display |
| Request Type | Select | Yes | Routine / Urgent / Emergency |

**FR-1-003:** On save, the request SHALL be assigned a unique Transfusion Request ID and a status of PENDING. The request SHALL appear in the Blood Bank worklist (FR-3-001).

**FR-1-004:** If the patient has no ABO/Rh type on record (Spec 2), the system SHALL display an InlineNotification (kind="info") indicating a type & screen must be completed before unit selection is possible, but SHALL NOT block request creation.

**FR-1-005:** Emergency requests (Request Type = Emergency) SHALL immediately display an InlineNotification (kind="error") and flag the request with an EMERGENCY badge in the worklist. Emergency requests bypass the normal unit selection flow and are handled by the Spec 5 emergency release pathway.

### 4.2 Type & Screen

**FR-2-001:** If the patient does not have a confirmed ABO/Rh type (Spec 2, FR-2-002), a type & screen order SHALL be initiated from within the transfusion request. This uses the existing order entry flow with the Blood Bank program, pre-selecting the ABO Grouping and Rh Typing + antibody screen test panel.

**FR-2-002:** The type & screen order SHALL be linked to the Transfusion Request ID. When results are validated, the Patient Blood Bank Record is updated (Spec 2 event listener), and the request worklist SHALL reflect the updated ABO/Rh status without requiring a page reload.

**FR-2-003:** If the patient already has a confirmed ABO/Rh type (Spec 2), the type & screen step is skipped and unit selection proceeds directly.

### 4.3 Unit Selection & Compatibility Assessment

**FR-3-001:** Once the patient has a confirmed ABO/Rh type, a user with `bloodbank.request.selectUnit` permission SHALL be able to open the Unit Selection panel within the request. This calls `/api/v1/bloodbank/units/available` to retrieve the current crossmatch pool, filtered to the requested component type.

**FR-3-002:** The system SHALL automatically apply the following compatibility filters to the pool before display:

| Filter | Source | Applied |
|---|---|---|
| ABO/Rh compatibility | Patient confirmed ABO/Rh from Spec 2 `/compatibility-profile` | Always |
| Alloantibody antigen-negative filtering | Active High-significance alloantibodies from Spec 2 | Always |
| Special attribute matching | Active special requirements from Spec 2 (Tier 2 only) | When Tier 2 enabled |
| Not expired | `isExpired = false` from Spec 1 | Always |
| Not reserved | `linkedTransfusionRequestId = null` from Spec 1 | Always |

**FR-3-003:** Units that pass all filters SHALL be displayed as COMPATIBLE in the selection table. Units that fail any filter SHALL still be displayed but marked as INCOMPATIBLE, with a tooltip listing the specific incompatibility reasons. This is a soft interlock — incompatible units can still be selected with supervisor override.

**FR-3-004:** The unit selection table SHALL display per unit: Unit Number, Component Type, ABO/Rh, Special Attributes Tags, Days Until Expiry, Storage Location, and Compatibility status Tag (Compatible / Incompatible).

**FR-3-005:** A user with `bloodbank.request.selectUnit` selects units up to the requested quantity. Selected units SHALL be immediately reserved via the Spec 1 reserve endpoint (`PUT /api/v1/bloodbank/units/{orderId}/reserve`), setting `linkedTransfusionRequestId` and changing derived status to RESERVED.

**FR-3-006:** If the user selects an INCOMPATIBLE unit, the system SHALL display a soft warning modal listing the specific incompatibility reason(s). The user MAY proceed only if they hold `bloodbank.request.override` permission. On proceeding, a compatibility override record SHALL be created (FR-4-001).

**FR-3-007:** The request status SHALL advance to UNITS_SELECTED after at least one unit is reserved.

### 4.4 Compatibility Override

**FR-4-001:** When a user overrides a compatibility warning, a CompatibilityOverride record SHALL be created capturing: request ID, unit ID, override reason (free text, required), overriding user ID, timestamp, and the specific incompatibility reasons overridden. This record is immutable and available in the audit log.

**FR-4-002:** Overridden units SHALL display an "Override" Tag in the selected units list, visible to all users with `bloodbank.request.view`. The override reason SHALL be viewable inline.

### 4.5 Crossmatch Testing

**FR-5-001:** After unit selection, a crossmatch test SHALL be ordered for each selected unit-patient pairing using the existing test ordering infrastructure. The test is linked to both the Transfusion Request ID and the blood unit order (Spec 1 order ID).

**FR-5-002:** The test type SHALL be configurable per component type in Blood Bank program settings: Immediate Spin Crossmatch / Antiglobulin Crossmatch / Electronic Crossmatch / No Crossmatch Required. Default: Antiglobulin Crossmatch for pRBC; No Crossmatch Required for FFP and PLT.

**FR-5-003:** Crossmatch results SHALL be entered using the existing Results Entry workflow. The result options are: COMPATIBLE / INCOMPATIBLE / INCONCLUSIVE.

**FR-5-004:** If any crossmatch result is entered as INCOMPATIBLE, the system SHALL display a soft warning in the request view. A Blood Bank Supervisor with `bloodbank.request.override` may proceed with an override (FR-4-001).

**FR-5-005:** The request status SHALL advance to CROSSMATCH_COMPLETE when all crossmatch results for all selected units have been entered (regardless of result value).

### 4.6 Request Approval

**FR-6-001:** A user with `bloodbank.request.approve` SHALL approve a request from the request detail view, advancing status to APPROVED. Approval is the validation step for the pre-transfusion testing workflow — it represents the Blood Bank Supervisor's sign-off that the unit-patient pairings are acceptable.

**FR-6-002:** The approve action SHALL be blocked if any crossmatch result is INCOMPATIBLE AND no override record exists for that pairing. The system SHALL display a validation error listing the specific pairings requiring override before approval.

**FR-6-003:** On approval, each reserved unit's status SHALL remain RESERVED. The request SHALL be visible in the Issue-to-Patient queue (Spec 5). The approving user and timestamp SHALL be recorded on the request.

### 4.7 Request Cancellation

**FR-7-001:** A user with `bloodbank.request.cancel` SHALL cancel a request from PENDING, UNITS_SELECTED, or CROSSMATCH_COMPLETE status. Approved requests may only be cancelled by a Blood Bank Supervisor.

**FR-7-002:** On cancellation, all units reserved for this request SHALL be automatically unreserved via the Spec 1 unreserve endpoint, clearing `linkedTransfusionRequestId` and returning derived status to AVAILABLE.

**FR-7-003:** Cancellation SHALL require a reason (Patient cancelled / No longer required / Incorrect request / Other). The reason SHALL be recorded on the request and surfaced in reporting (Spec 5).

### 4.8 Transfusion Request Worklist

**FR-8-001:** A Blood Bank Worklist page SHALL be accessible via Blood Bank → Worklist. It displays all active Transfusion Requests as a table with: Request ID, Patient name/MRN, Component Type, Quantity, Request Type Tag, Status Tag, Required By datetime, and assigned technologist (if any).

**FR-8-002:** The worklist SHALL default to showing PENDING, UNITS_SELECTED, CROSSMATCH_COMPLETE, and APPROVED requests. Cancelled and Issued requests SHALL be accessible via a Status filter.

**FR-8-003:** EMERGENCY requests SHALL display prominently with a red EMERGENCY badge and SHALL sort to the top of the worklist regardless of other filters.

**FR-8-004:** Clicking a row SHALL open the request detail view (inline expansion or dedicated page — implementation choice).

---

## 5. Data Model

### New Entities

**TransfusionRequest**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| requestNumber | String(20) | Yes | Human-readable ID, e.g. TR-20260310-001 |
| patientId | Long | Yes | FK to Patient |
| componentTypeId | Long | Yes | FK to SampleType under Blood Bank lab unit |
| quantityRequested | Integer | Yes | Number of units |
| clinicalIndication | Text | No | — |
| orderingClinician | String(200) | Yes | — |
| requiredByDatetime | Timestamp | No | — |
| requestType | Enum | Yes | ROUTINE / URGENT / EMERGENCY |
| status | Enum | Yes | PENDING / UNITS_SELECTED / CROSSMATCH_COMPLETE / APPROVED / CANCELLED / ISSUED |
| approvedByUserId | Long | No | Set on approval |
| approvedDatetime | Timestamp | No | — |
| cancellationReason | Enum | No | — |
| cancellationNote | String(500) | No | — |
| createdByUserId | Long | Yes | — |
| createdDatetime | Timestamp | Yes | — |

**TransfusionRequestUnit** (junction: request ↔ reserved blood unit)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | — |
| transfusionRequestId | Long | Yes | FK to TransfusionRequest |
| bloodUnitOrderId | Long | Yes | FK to Order (Spec 1 blood unit order) |
| crossmatchTestOrderId | Long | No | FK to Order (crossmatch test order) |
| crossmatchResult | Enum | No | COMPATIBLE / INCOMPATIBLE / INCONCLUSIVE / PENDING |
| hasCompatibilityOverride | Boolean | Yes | Default false |
| createdDatetime | Timestamp | Yes | — |

**CompatibilityOverride**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | — |
| transfusionRequestUnitId | Long | Yes | FK to TransfusionRequestUnit |
| incompatibilityReasons | Text | Yes | Pipe-delimited list of reasons overridden |
| overrideReason | Text | Yes | Free text from overriding user; required |
| overriddenByUserId | Long | Yes | — |
| overriddenDatetime | Timestamp | Yes | Immutable |

### Existing Infrastructure Reused

- **Order / Test / Result / Validation** — crossmatch tests ordered on existing infrastructure; results entered and validated through existing workflows
- **SampleType / LabUnit** — component type selection
- **Spec 1 reserve/unreserve** — `PUT /api/v1/bloodbank/units/{orderId}/reserve|unreserve`
- **Spec 2 `/compatibility-profile`** — ABO/Rh + alloantibodies + special requirements for pool filtering

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/bloodbank/requests` | List transfusion requests (filterable by status, patient, date) | `bloodbank.request.view` |
| GET | `/api/v1/bloodbank/requests/{id}` | Get single request with units and crossmatch results | `bloodbank.request.view` |
| POST | `/api/v1/bloodbank/requests` | Create transfusion request | `bloodbank.request.create` |
| PUT | `/api/v1/bloodbank/requests/{id}/cancel` | Cancel request, release reserved units | `bloodbank.request.cancel` |
| PUT | `/api/v1/bloodbank/requests/{id}/approve` | Approve request (supervisor sign-off) | `bloodbank.request.approve` |
| GET | `/api/v1/bloodbank/requests/{id}/compatible-units` | Get filtered compatible pool for this request | `bloodbank.request.selectUnit` |
| POST | `/api/v1/bloodbank/requests/{id}/units` | Add unit to request (triggers reserve on Spec 1) | `bloodbank.request.selectUnit` |
| DELETE | `/api/v1/bloodbank/requests/{id}/units/{unitId}` | Remove unit from request (triggers unreserve) | `bloodbank.request.selectUnit` |
| POST | `/api/v1/bloodbank/requests/{id}/units/{unitId}/override` | Record compatibility override | `bloodbank.request.override` |

Crossmatch test ordering and result entry use the existing order/result APIs with Transfusion Request ID passed as a context field.

---

## 7. UI Design

See companion React mockup: `pretransfusion-testing-mockup.jsx`

### Navigation Path

- **Worklist:** Blood Bank → Worklist
- **New request:** Blood Bank → New Transfusion Request (or from patient record Blood Bank tab)
- **Request detail:** Click row in worklist → request detail view

### Key Screens

1. **Transfusion Request Worklist** — DataTable of active requests. EMERGENCY badge + top sort for urgent cases. Status Tags, Required By column for time-sensitivity awareness.
2. **New Transfusion Request form** — Inline form: patient search, component type, quantity, indication, clinician, required-by, request type. ABO/Rh availability notice if no type on record.
3. **Request detail view** — Shows request metadata, patient ABO/Rh summary, selected units table, crossmatch results status, approve / cancel actions.
4. **Unit selection panel** — Filtered compatible pool table. Compatibility tags per unit. Incompatibility tooltip on hover. Soft warning modal on selecting incompatible unit.
5. **Compatibility override modal** — Required reason text field; only rendered when user holds override permission.

### Interaction Patterns

- **Soft interlock** — incompatible units shown but flagged; warning modal before selection; hard block only if no override permission
- **Inline request detail** — worklist row expands or links to dedicated view; no navigation away from worklist required for common actions
- **Status progression visible** — PENDING → UNITS_SELECTED → CROSSMATCH_COMPLETE → APPROVED shown as a step indicator on the request detail

---

## 8. Business Rules

**BR-001:** ABO/Rh compatibility rules applied to the crossmatch pool:

| Patient ABO | Compatible Donor RBC ABO |
|---|---|
| O | O only |
| A | A, O |
| B | B, O |
| AB | A, B, AB, O (universal recipient) |

Rh-negative patients receive Rh-negative units only. Rh-positive patients may receive Rh-positive or Rh-negative units.

**BR-002:** Alloantibody antigen-negative filtering: for each active High-significance alloantibody in the patient's profile, units that have not been tested and confirmed antigen-negative for that specificity are excluded from the compatible pool. In practice this means units lacking a documented antigen-negative result for the relevant antigen are excluded. Units without phenotype data on record are treated as potentially antigen-positive and excluded.

**BR-003:** The compatibility interlock is soft — a Blood Bank Supervisor with `bloodbank.request.override` may select any unit regardless of compatibility status. Every override is recorded with reason and user in CompatibilityOverride and is surfaced in the audit log and reporting (Spec 5).

**BR-004:** A unit may only be associated with one active Transfusion Request at a time. Attempting to select a unit that is already Reserved for a different request SHALL return an error.

**BR-005:** The approve action requires all crossmatch results to be entered. It does not require all results to be COMPATIBLE — it requires that INCOMPATIBLE results have an associated CompatibilityOverride record.

**BR-006:** Emergency requests (Request Type = EMERGENCY) do not go through the unit selection → crossmatch → approve flow. They are routed directly to the Spec 5 emergency release pathway and are excluded from this workflow after creation.

**BR-007:** Cancelling a request at any status (except ISSUED) releases all reserved units. Status ISSUED is terminal — cancellation is not possible after issue.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.bbRequest.worklist` | Transfusion Request Worklist |
| `heading.bbRequest.newRequest` | New Transfusion Request |
| `heading.bbRequest.requestDetail` | Transfusion Request Detail |
| `heading.bbRequest.unitSelection` | Select Units |
| `heading.bbRequest.crossmatchResults` | Crossmatch Results |
| `label.bbRequest.requestNumber` | Request Number |
| `label.bbRequest.patient` | Patient |
| `label.bbRequest.componentType` | Component Type |
| `label.bbRequest.quantity` | Units Requested |
| `label.bbRequest.indication` | Clinical Indication |
| `label.bbRequest.orderingClinician` | Ordering Clinician |
| `label.bbRequest.requiredBy` | Required By |
| `label.bbRequest.requestType` | Request Type |
| `label.bbRequest.status` | Status |
| `label.bbRequest.crossmatchResult` | Crossmatch Result |
| `label.bbRequest.overrideReason` | Override Reason |
| `label.bbRequest.cancellationReason` | Cancellation Reason |
| `label.bbRequest.compatible` | Compatible |
| `label.bbRequest.incompatible` | Incompatible |
| `label.bbRequest.override` | Override |
| `label.bbRequest.status.pending` | Pending |
| `label.bbRequest.status.unitsSelected` | Units Selected |
| `label.bbRequest.status.crossmatchComplete` | Crossmatch Complete |
| `label.bbRequest.status.approved` | Approved |
| `label.bbRequest.status.cancelled` | Cancelled |
| `label.bbRequest.status.issued` | Issued |
| `label.bbRequest.type.routine` | Routine |
| `label.bbRequest.type.urgent` | Urgent |
| `label.bbRequest.type.emergency` | Emergency |
| `button.bbRequest.newRequest` | New Transfusion Request |
| `button.bbRequest.selectUnits` | Select Units |
| `button.bbRequest.approve` | Approve Request |
| `button.bbRequest.cancel` | Cancel Request |
| `button.bbRequest.override` | Override Warning |
| `button.bbRequest.confirmOverride` | Confirm Override |
| `message.bbRequest.noAboType` | No confirmed ABO/Rh type on record. A type and screen must be completed before unit selection. |
| `message.bbRequest.emergencyRouted` | Emergency request created. Proceed to Emergency Release (Spec 5). |
| `message.bbRequest.approveSuccess` | Request approved. Units ready for issue. |
| `message.bbRequest.cancelSuccess` | Request cancelled. Reserved units released. |
| `message.bbRequest.overrideWarning` | This unit has a compatibility concern. Selecting it requires a documented override reason. |
| `message.bbRequest.incompatibleBlock` | One or more unit-patient pairings have incompatibility results without an override. Resolve before approving. |
| `error.bbRequest.patientRequired` | Patient is required. |
| `error.bbRequest.componentTypeRequired` | Component type is required. |
| `error.bbRequest.quantityRequired` | Quantity must be at least 1. |
| `error.bbRequest.clinicianRequired` | Ordering clinician is required. |
| `error.bbRequest.overrideReasonRequired` | Override reason is required. |
| `error.bbRequest.cancellationReasonRequired` | Cancellation reason is required. |
| `error.bbRequest.unitAlreadyReserved` | This unit is already reserved for another request. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| patientId | Required | `error.bbRequest.patientRequired` |
| componentTypeId | Required | `error.bbRequest.componentTypeRequired` |
| quantityRequested | Required, integer ≥ 1 | `error.bbRequest.quantityRequired` |
| orderingClinician | Required, max 200 chars | `error.bbRequest.clinicianRequired` |
| override.overrideReason | Required when overriding | `error.bbRequest.overrideReasonRequired` |
| cancellationReason | Required on cancel | `error.bbRequest.cancellationReasonRequired` |

---

## 11. Security & Permissions

| Action | Permission | UI Behavior if Denied |
|---|---|---|
| View worklist | `bloodbank.request.view` | Blood Bank → Worklist not shown |
| Create request | `bloodbank.request.create` | New Request button hidden; API 403 |
| Select units | `bloodbank.request.selectUnit` | Select Units action hidden; API 403 |
| Override compatibility | `bloodbank.request.override` | Override option not shown; incompatible units non-selectable |
| Enter crossmatch results | `bloodbank.request.result` | Result entry restricted |
| Approve request | `bloodbank.request.approve` | Approve button hidden; API 403 |
| Cancel request | `bloodbank.request.cancel` | Cancel button hidden; API 403 |

---

## 12. Acceptance Criteria

### Functional

- [ ] Transfusion Request can be created by user with `bloodbank.request.create`; assigned unique Request Number and PENDING status
- [ ] Patient with no ABO/Rh type on record shows type & screen required notice; request creation not blocked
- [ ] Emergency requests display EMERGENCY badge, sort to top of worklist, and route to Spec 5
- [ ] Unit selection panel calls `/compatible-units` and applies ABO/Rh + alloantibody + special attribute filters
- [ ] Compatible units shown with green Compatible Tag; incompatible units shown with red Incompatible Tag and reason tooltip
- [ ] Selecting an incompatible unit requires override permission; triggers warning modal with required reason
- [ ] CompatibilityOverride record created with reason, user, timestamp on override
- [ ] Selected units reserved via Spec 1 reserve endpoint; status changes to RESERVED in inventory
- [ ] Request status advances to UNITS_SELECTED after first unit reserved
- [ ] Crossmatch tests ordered and linked to request and unit order IDs
- [ ] Crossmatch results entered via existing Results Entry workflow; result reflected on request detail
- [ ] Request status advances to CROSSMATCH_COMPLETE when all results entered
- [ ] Approve action blocked if any INCOMPATIBLE result has no override record
- [ ] Approve records approving user + timestamp; request status → APPROVED
- [ ] Cancel releases all reserved units via Spec 1 unreserve endpoint; status → CANCELLED
- [ ] Worklist shows PENDING / UNITS_SELECTED / CROSSMATCH_COMPLETE / APPROVED by default; filterable
- [ ] Cancelled and Issued requests accessible via status filter

### Non-Functional

- [ ] All UI strings use i18n keys
- [ ] Worklist loads within 2 seconds for up to 500 active requests
- [ ] Compatible unit pool returns within 1 second for inventory of 1,000 units
- [ ] Works on screens 1280px and above
- [ ] All write operations enforced at API layer

### Integration

- [ ] Compatible pool sourced from Spec 1 `/available` endpoint, filtered with Spec 2 `/compatibility-profile`
- [ ] Spec 1 reserve/unreserve correctly updates unit derived status; reflected in inventory workbench
- [ ] Validated crossmatch results update crossmatch result field on TransfusionRequestUnit
- [ ] Approved requests appear in Spec 5 issue queue
- [ ] Spec 2 patient record shows issued unit in issuance log after Spec 5 issue

---

*FRS paired with: `pretransfusion-testing-mockup.jsx`*
*Part of: Blood Banking Module — Phase 1, Spec 3 of 5*
