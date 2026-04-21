# Jira Story: Blood Bank — Pre-Transfusion Testing Worklist & Case View

---

## Header

**Summary:** Blood Bank: Pre-Transfusion Testing — Worklist Dashboard & Request Case View (Spec 4)

**Issue Type:** Story
**Priority:** High
**Labels:** `openelis-global`, `fullstack`, `blood-bank`
**Component:** Frontend + Backend
**Epic:** Blood Bank (set `parent` to Blood Bank Epic key in Jira UI)
**Depends On:**
- Blood Bank Admin Config & Program Setup (Spec 1 — Blood Bank program must exist before unit pool is queryable)
- Blood Unit Reception & Inventory Workbench (Spec 2 — reserve/unreserve endpoints required)
- Patient Blood Bank Record (Spec 3 — `/compatibility-profile` endpoint required for pool filtering)

---

## Description

### Background

This is Spec 4 of the OpenELIS Blood Bank module (Phase 1). OpenELIS currently has no structured pathway for requesting blood transfusions, selecting compatible units, or linking crossmatch test results to a specific patient-unit pairing. Without this workflow, unit selection is manual, compatibility assessment is ad hoc, and there is no system-enforced audit trail connecting a crossmatch result to the patient who received the unit.

This story implements the Transfusion Request entity, the compatibility-filtered unit selection panel, the crossmatch result tracking interface, and the supervisor approval step. The UI is modeled on the OpenELIS Pathology Dashboard + Case View pattern: a stat-tile worklist dashboard and a left-sidebar case detail view using the Carbon UI Shell SideNav navigation structure.

FRS: `pretransfusion-testing-frs-v1.0.md`
Mockup: `pretransfusion-testing-mockup.jsx`

### Scope

**In scope:**
- TransfusionRequest, TransfusionRequestUnit, and CompatibilityOverride entities and persistence layer
- REST API endpoints for request CRUD, unit selection, compatibility override, and approve/cancel lifecycle
- Transfusion Request Worklist dashboard (stat tiles + filterable DataTable, Pathology Dashboard pattern)
- New Transfusion Request form (inline Carbon form with patient search, component type, quantity, indication, clinician, required-by, request type)
- Request Case Detail view (Carbon SideNav shell + left workflow-stage sidebar + collapsible sections: Request Info, Patient Blood Bank, Unit Selection, Crossmatch Results, Approval)
- ABO/Rh + alloantibody + special attribute compatibility filtering of unit pool (sourced from Spec 2 and Spec 3)
- Soft compatibility interlock with supervisor override modal and CompatibilityOverride audit record
- Type & screen notice when patient ABO/Rh type is not on record (non-blocking info notification)
- EMERGENCY request badge, top-sort in worklist, and routing note to Spec 5
- Cancellation flow with reason selection and automatic unit unreservation via Spec 2

**Out of scope (deferred to subsequent specs):**
- Spec 5: Issue-to-Patient and Emergency Release — physical handover, issue record, wristband label
- Spec 6: Blood Bank Reporting — transfusion rate, turnaround, utilization dashboards
- Crossmatch test ordering UI — uses existing Results Entry workflow; no new test ordering UI in this story
- ISBT 128 barcode scanning for unit selection — deferred to Spec 2 enhancement

### User Story

As a **Blood Bank Technologist or Supervisor**, I want to manage transfusion requests from a single worklist and work each case through unit selection, crossmatch, and approval so that compatible blood units are reserved, tested, and signed off before issue — with all compatibility decisions audited and traceable.

---

## Acceptance Criteria

### Functional

**Request Creation (FRS FR-1-001, FR-1-002, FR-1-003)**
- [ ] A user with `bloodbank.request.create` can create a Transfusion Request from Blood Bank > New Transfusion Request or from within the Patient Blood Bank Record
- [ ] The creation form captures: Patient (required), Component Type (required), Quantity >= 1 (required), Clinical Indication (optional), Ordering Clinician (required), Required By datetime (optional), Request Type ROUTINE / URGENT / EMERGENCY (required)
- [ ] On save, a unique Request Number is assigned (format TR-YYYYMMDD-NNN) and status is PENDING; the request appears immediately in the worklist

**Type & Screen Gate (FRS FR-1-004, FR-2-001, FR-2-003)**
- [ ] If patient has no confirmed ABO/Rh type on record, an `InlineNotification` (kind="info") states a type and screen is required before unit selection; request creation is NOT blocked
- [ ] If patient already has a confirmed ABO/Rh type, type & screen notice is not shown and unit selection is available immediately

**Emergency Requests (FRS FR-1-005, BR-006)**
- [ ] Emergency requests display an EMERGENCY `Tag` (kind="red") in the worklist and sort to the top of the list regardless of other sort/filter state
- [ ] Emergency requests display an `InlineNotification` (kind="warning") in the case view noting they are routed to Emergency Release (Spec 5)

**Unit Selection & Compatibility (FRS FR-3-001 through FR-3-007, BR-001, BR-002, BR-004)**
- [ ] Unit Selection panel calls `GET /api/v1/bloodbank/requests/{id}/compatible-units`, which filters the inventory pool by: ABO/Rh compatibility, active High-significance alloantibody antigen-negative status, special requirements (Tier 2 only), not expired, not reserved for another request
- [ ] Compatible units display a `Tag` (kind="green", label "Compatible"); incompatible units display a `Tag` (kind="red", label "Incompatible") with a tooltip listing each incompatibility reason
- [ ] Selecting a compatible unit calls `POST /api/v1/bloodbank/requests/{id}/units`, which triggers Spec 2 reserve endpoint; unit status changes to RESERVED in the inventory
- [ ] Selecting an incompatible unit triggers a warning modal listing incompatibility reasons; user must hold `bloodbank.request.override` to proceed — without the permission the Override button is hidden and the unit is non-selectable
- [ ] Attempting to select a unit already reserved for another request returns an error notification (kind="error")
- [ ] Request status advances to UNITS_SELECTED after the first unit is reserved

**Compatibility Override (FRS FR-4-001, FR-4-002, BR-003)**
- [ ] Confirming an override with a non-empty free-text reason creates a CompatibilityOverride record with: request ID, unit ID, incompatibility reasons, override reason, user ID, timestamp
- [ ] Overridden units display an "Override" `Tag` (kind="warm-gray") in the selected units list; the override reason is viewable inline
- [ ] Override reason field shows `invalid` / `invalidText` Carbon validation state if submitted empty; the CompatibilityOverride record is NOT created

**Crossmatch Results (FRS FR-5-001 through FR-5-005)**
- [ ] Crossmatch results are entered through the existing Results Entry workflow with Transfusion Request ID and unit order ID as context; result options are COMPATIBLE / INCOMPATIBLE / INCONCLUSIVE
- [ ] INCOMPATIBLE crossmatch result displays a soft warning `InlineNotification` (kind="warning") on the request case view
- [ ] Request status advances to CROSSMATCH_COMPLETE when all crossmatch results for all selected units have been entered

**Approval (FRS FR-6-001, FR-6-002, FR-6-003, BR-005)**
- [ ] Approve button is visible only to users with `bloodbank.request.approve`; hidden otherwise
- [ ] Approving a request with any INCOMPATIBLE crossmatch result that has no CompatibilityOverride record shows a validation error listing the specific unit-patient pairings requiring override; approval is blocked
- [ ] Successful approval records approving user + timestamp on the TransfusionRequest; status changes to APPROVED; request appears in Spec 5 issue queue
- [ ] Reserved unit status remains RESERVED after approval (not released until Spec 5 issue)

**Cancellation (FRS FR-7-001, FR-7-002, FR-7-003, BR-007)**
- [ ] A user with `bloodbank.request.cancel` can cancel a PENDING, UNITS_SELECTED, or CROSSMATCH_COMPLETE request; Supervisors can also cancel APPROVED requests
- [ ] Cancellation requires selecting a reason (Patient cancelled / No longer required / Incorrect request / Other); reason field shows Carbon validation error if submitted blank
- [ ] On cancellation, all units reserved for this request are unreserved via Spec 2 unreserve endpoint; their derived status returns to AVAILABLE in the inventory
- [ ] Cancelled status is reflected immediately in the worklist

**Worklist (FRS FR-8-001, FR-8-002, FR-8-003, FR-8-004)**
- [ ] Worklist is accessible at Blood Bank > Pre-Transfusion Testing showing stat tiles (Requests in Progress, Awaiting Approval, Emergency Requests, Approved this week) and a Carbon DataTable of active requests
- [ ] Default view shows PENDING, UNITS_SELECTED, CROSSMATCH_COMPLETE, and APPROVED requests; Cancelled and Issued are accessible via status filter dropdown
- [ ] DataTable columns: Request Number, Patient, Component, Qty, Type (Tag), Status (Tag), Required By, Ward, Clinician
- [ ] Clicking a row opens the request case detail view (Pathology Case View pattern: 240px sticky left workflow sidebar + scrollable collapsible sections + sticky footer action bar)
- [ ] Worklist stat tiles are clickable and act as quick filters on the table

**Permissions (FRS Section 11)**
- [ ] Users without `bloodbank.request.view` do not see Blood Bank > Pre-Transfusion Testing in the SideNav; direct URL access returns HTTP 403
- [ ] Users without `bloodbank.request.create` do not see the New Request button; direct POST to `/api/v1/bloodbank/requests` returns HTTP 403
- [ ] Users without `bloodbank.request.selectUnit` do not see the unit selection controls; direct API call returns HTTP 403
- [ ] Users without `bloodbank.request.approve` do not see the Approve button; direct PUT to `/approve` returns HTTP 403
- [ ] Users without `bloodbank.request.cancel` do not see the Cancel button; direct PUT to `/cancel` returns HTTP 403
- [ ] Users without `bloodbank.request.override` cannot select incompatible units; the Override option is not rendered

### Non-Functional

- [ ] All UI strings use `t(key, fallback)` i18n keys — zero hardcoded English strings in JSX (FRS Section 9 keys)
- [ ] All i18n keys follow the `[category].[feature].[identifier]` convention documented in FRS Section 9
- [ ] Worklist loads within 2 seconds for up to 500 active requests
- [ ] Compatible unit pool returns within 1 second for inventory of 1,000 units
- [ ] UI works correctly on screens 1280px wide and above
- [ ] All write operations enforced at API layer regardless of UI state

### Integration

- [ ] Compatible unit pool is sourced from Spec 2 `GET /api/v1/bloodbank/units/available`, filtered with Spec 3 `GET /api/v1/bloodbank/patients/{id}/compatibility-profile`
- [ ] Spec 2 reserve endpoint correctly sets `linkedTransfusionRequestId` and changes derived unit status to RESERVED; reflected in Inventory Workbench
- [ ] Spec 2 unreserve endpoint correctly clears `linkedTransfusionRequestId` and returns unit to AVAILABLE on request cancellation
- [ ] Crossmatch result entered via existing Results Entry flow updates `crossmatchResult` on the TransfusionRequestUnit record
- [ ] An APPROVED TransfusionRequest appears in the Spec 5 issue queue with all unit and patient data available

---

## Technical Notes

### Backend (Java/Hibernate)

**New entities (JPA/Hibernate):**
- `TransfusionRequest` — see FRS Section 5 for field definitions; status ENUM mapped to `transfusion_request` table
- `TransfusionRequestUnit` — junction table linking TransfusionRequest to blood unit Order and crossmatch test Order; `crossmatch_result` ENUM field updated by Results Entry event listener
- `CompatibilityOverride` — immutable audit record; no update or delete operations permitted at service layer

**Service layer:**
- `TransfusionRequestService.createRequest()` — validates patient exists, assigns unique requestNumber, persists, fires worklist refresh event
- `TransfusionRequestService.selectUnit()` — calls BloodUnitService.reserve() (Spec 2), creates TransfusionRequestUnit, advances status
- `TransfusionRequestService.override()` — persists CompatibilityOverride; validates overrideReason non-empty at service layer
- `TransfusionRequestService.approve()` — checks all TransfusionRequestUnits have crossmatchResult set and any INCOMPATIBLE result has an associated CompatibilityOverride; persists approvedByUserId + approvedDatetime
- `TransfusionRequestService.cancel()` — calls BloodUnitService.unreserve() for each linked unit; sets status CANCELLED; records reason

**Compatibility filtering** (`/compatible-units`):
- Call Spec 3 `/compatibility-profile` to get patient ABO/Rh + active alloantibodies + special requirements
- Filter Spec 2 available pool: ABO/Rh compatibility matrix (FRS BR-001), antigen-negative filter (FRS BR-002), special attributes (Tier 2), not expired, not reserved
- Return full pool — both compatible and incompatible units — with `compatible: boolean` and `incompatibilityReasons: String[]` per unit so the UI can render both groups

**Results Entry integration:**
- Add `TransfusionRequestUnit` update hook to Results Entry validation listener: when a test with a linked `crossmatchTestOrderId` is validated, update `crossmatchResult` on the corresponding `TransfusionRequestUnit`
- After update, check if all units for the request now have a result; if yes, advance request status to CROSSMATCH_COMPLETE

**Liquibase migrations:**
- `createTable` for `transfusion_request`, `transfusion_request_unit`, `compatibility_override`
- Foreign key constraints to `patient`, `orders` (Spec 2 blood unit order), `orders` (crossmatch test order), `system_user`
- Index on `transfusion_request.status`, `transfusion_request.patient_id`

### Frontend (React/Carbon)

**Navigation:** Blood Bank > Pre-Transfusion Testing in Carbon `SideNav` > `SideNavMenu` > `SideNavMenuItem` (active). Carbon UI Shell SideNav pattern — hamburger-triggered slide-out; no horizontal submenu bars.

**Worklist view — Pathology Dashboard pattern:**
- 4 stat tiles: plain white `Tile` (no color borders), label + large number, clickable as quick filters
- Filter row: `TableToolbarSearch` + "My requests" `Checkbox` + Status `Select` + Component `Select`
- `DataTable` with `TableToolbar`, column sort, pagination footer
- EMERGENCY requests: `Tag` kind="red", always sorted to top using client-side sort before rendering

**Case detail view — Pathology Case View pattern:**
- Fixed 240px left sidebar: workflow stage nav (Request Info / Patient Blood Bank / Unit Selection / Crossmatch Results / Approval) with SVG status icons (empty/active/complete/locked circles), scrollTo on click
- Scrollable main content: `Accordion`-style collapsible `Tile` sections keyed to sidebar stages
- Sticky footer action bar: Back / Cancel / Approve / Proceed to Issue (Spec 5)

**Key Carbon components:** `DataTable`, `TableToolbar`, `TableToolbarSearch`, `Tag`, `InlineNotification`, `Modal` (override + cancel modals only — destructive confirmation), `Accordion`, `Tile`, `Button`, `TextInput`, `TextArea`, `Select`, `NumberInput`, `DatePicker`, `Checkbox`

**State management:** Local `useState` hooks for worklist filters, case view section expand/collapse, selected units map, crossmatch result entry form, override modal, cancel modal. No Redux required for this story.

### API

New endpoints (all under `/api/v1/bloodbank/requests`):

| Method | Path | Permission |
|---|---|---|
| GET | `/` | `bloodbank.request.view` |
| GET | `/{id}` | `bloodbank.request.view` |
| POST | `/` | `bloodbank.request.create` |
| PUT | `/{id}/cancel` | `bloodbank.request.cancel` |
| PUT | `/{id}/approve` | `bloodbank.request.approve` |
| GET | `/{id}/compatible-units` | `bloodbank.request.selectUnit` |
| POST | `/{id}/units` | `bloodbank.request.selectUnit` |
| DELETE | `/{id}/units/{unitId}` | `bloodbank.request.selectUnit` |
| POST | `/{id}/units/{unitId}/override` | `bloodbank.request.override` |

Permission checks enforced at Spring Security method level (`@PreAuthorize`) and at service layer. All endpoints return HTTP 403 for unauthorized callers regardless of UI state.

### Dependencies

- **Blocked by:** Blood Bank Admin Config (Spec 1) — Blood Bank program and component types must be configured before the component type `Select` can be populated
- **Blocked by:** Blood Unit Inventory (Spec 2) — reserve/unreserve endpoints and the available unit pool must be implemented
- **Blocked by:** Patient Blood Bank Record (Spec 3) — `/compatibility-profile` endpoint must return ABO/Rh, alloantibodies, and special requirements
- **Blocks:** Issue-to-Patient & Emergency Release (Spec 5) — APPROVED TransfusionRequests feed the issue queue

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Compatibility filter returns wrong pool (ABO/Rh logic error) | Medium | High | Unit test ABO matrix (BR-001) with all 8 patient/donor combinations before integration; add integration test against Spec 2+3 stubs |
| CompatibilityOverride record missing on override confirmation | Low | High | Service-layer assertion that CompatibilityOverride persists before reserve completes; rollback reserve if override write fails |
| Results Entry listener does not fire on crossmatch validation | Medium | High | Add integration test: create request, mock test validation event, assert TransfusionRequestUnit.crossmatchResult updated and status advances |
| Spec 2 reserve endpoint unavailable during development | High | Medium | Mock BloodUnitService.reserve() with a feature flag stub; develop worklist and case view UI in parallel against seed data |
| Performance: large compatible-unit pool response time > 1 sec | Low | Medium | Add index on `blood_unit.component_type_id`, `blood_unit.status`; profile with 1,000-unit dataset before release |

---

*FRS: `pretransfusion-testing-frs-v1.0.md`*
*Mockup: `pretransfusion-testing-mockup.jsx`*
*Part of: Blood Bank Epic (Phase 1, Spec 4 of 5)*
