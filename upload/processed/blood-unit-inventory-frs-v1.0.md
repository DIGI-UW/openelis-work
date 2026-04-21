# Blood Bank: Blood Bank Program & Unit Reception
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Draft for Review
**Jira:** TBD (Blood Bank epic)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Order Entry (existing), Sample Types / Lab Units (existing), Results Entry (existing), Validation (existing), Patient Blood Bank Record (Spec 2), Pre-Transfusion Testing & Transfusion Request (Spec 3), Issue-to-Patient & Emergency Release (Spec 4)

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

This spec defines the Blood Bank program configuration and blood unit reception workflow. Rather than introducing a separate inventory system, blood unit reception is implemented as a specialized order entry flow using a new "Blood Bank" program type. Each received blood unit is an order. The Blood Bank program configures the order entry form to capture unit-specific metadata (unit number, component type, ABO/Rh, expiration date, storage location, ISBT 128 barcode) and allows confirmatory diagnostic tests (ABO/Rh typing, infectious disease screening) to be ordered on the unit at receipt time. The existing order → sample → test → result → validation chain handles the full unit reception workflow. A Blood Bank inventory workbench view surfaces all Blood Bank program orders as a unit-centric list with lifecycle status derived from order state.

---

## 2. Problem Statement

**Current state:** Blood unit receipt, storage, and confirmatory testing are disconnected workflows — or managed entirely on paper. There is no structured way within OpenELIS to receive a unit, record its metadata, order confirmatory tests against it, and track it through to availability.

**Impact:** Disconnected workflows mean confirmatory test results cannot be automatically linked to a unit's availability status, storage is untracked, and the full chain from unit receipt to patient transfusion cannot be audited within a single system.

**Proposed solution:** Introduce a Blood Bank program in OpenELIS's existing program framework. Order entry for this program is configured to capture blood unit metadata as program-specific fields. Confirmatory tests are ordered on the unit using the existing test ordering infrastructure. The existing results entry and validation workflows bring the unit from received (quarantine) to available. A dedicated inventory workbench view provides a unit-centric view of all Blood Bank program orders.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Blood Bank Technologist | Create Blood Bank orders (receive units), enter results, view inventory | Cannot perform order validation (QUARANTINE → AVAILABLE transition) |
| Blood Bank Supervisor | All Technologist permissions + validate orders (release units to available) | Mirrors existing validation role scoped to Blood Bank program |
| Blood Bank Admin | Configure Blood Bank program settings, view inventory | Cannot create orders or enter results |
| Ordering Clinician | No access to Blood Bank program orders | Blood unit orders are internal lab documents, not patient orders |
| System Administrator | Full | — |

**Required permission keys:**

- `bloodbank.program.view` — View Blood Bank program orders and inventory
- `bloodbank.program.order` — Create Blood Bank program orders (receive units)
- `bloodbank.program.result` — Enter results on Blood Bank program orders
- `bloodbank.program.validate` — Validate Blood Bank program orders (release unit to Available)
- `bloodbank.program.discard` — Discard a blood unit (cancel order with discard reason)
- `bloodbank.program.configure` — Configure Blood Bank program settings (Admin only)

---

## 4. Functional Requirements

### 4.1 Blood Bank Program Configuration

**FR-1-001:** A new program type "Blood Bank" SHALL be added to the OpenELIS program framework, configurable via Admin → Blood Bank → Program Settings (accessible to users with `bloodbank.program.configure`).

**FR-1-002:** The Blood Bank program configuration SHALL define the following program-specific order fields, captured in addition to standard order fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Unit Number | Text (50) | Yes | ISBT 128 donation ID or manual; unique across all Blood Bank orders |
| ISBT 128 Raw | Text (500) | No | Stored automatically when barcode parsed; not shown on form |
| Component Type | Select | Yes | Populated from active sample types under the "Blood Bank" lab unit (existing OpenELIS sample type infrastructure) |
| ABO Group | Select | Yes | A / B / AB / O |
| Rh Type | Select | Yes | Positive / Negative |
| Expiration Date | Date | Yes | Must be future date |
| Storage Location | Select | Yes | Active OpenELIS storage locations |
| Supplier / Blood Center | Text (100) | No | — |
| Special Attributes | Multi-select | No | Irradiated / CMV Negative / Leukoreduced / Washed / HLA Matched |

**FR-1-003:** The Blood Bank program configuration SHALL specify a default panel of confirmatory tests automatically added to each new Blood Bank order. The default panel SHALL be configurable by Blood Bank Admins and SHALL initially include: ABO Grouping and Rh Typing.

**FR-1-004:** Additional tests (e.g., infectious disease screening: HIV Ag/Ab, HBsAg, Anti-HCV, Syphilis) MAY be added to the default panel or added per-order during order entry, using the existing test selection infrastructure.

### 4.2 Blood Unit Reception (Order Entry)

**FR-2-001:** A user with `bloodbank.program.order` permission SHALL access blood unit reception via a "Receive Blood Unit" entry point, which opens the existing order entry form pre-configured for the Blood Bank program.

**FR-2-002:** The Unit Number field SHALL be the first focus target on the order entry form and SHALL support ISBT 128 barcode scan input. On scan (detected by `=` prefix or configurable ISBT delimiter):
- Unit Number, ABO Group, Rh Type, Component Type, and Expiration Date SHALL be auto-populated from the parsed barcode.
- Auto-populated fields SHALL display a visual indicator ("Auto-filled from barcode") and remain editable for correction.
- The raw barcode string SHALL be stored in the ISBT 128 Raw program field regardless of subsequent edits.

**FR-2-003:** If the scanned or entered unit number already exists in the system (across all statuses), the system SHALL display an inline validation error and prevent saving.

**FR-2-004:** The order entry form SHALL display the Blood Bank program fields (FR-1-002) in a dedicated "Unit Details" section, rendered using the standard program field display pattern from the existing order entry infrastructure.

**FR-2-005:** The confirmatory test panel (FR-1-003) SHALL be pre-selected in the test selection section of the order entry form. The technologist MAY add or remove tests before saving.

**FR-2-006:** On save, the order SHALL be created with standard order status (entered / in-progress per existing order lifecycle). The blood unit inventory status SHALL be derived as QUARANTINE until the order is validated. No new order status values are introduced.

**FR-2-007:** After successful save, the form SHALL support rapid sequential entry — the form SHALL reset for the next unit without requiring re-navigation, enabling batch receipt of a shipment.

### 4.3 Blood Unit Inventory Workbench

**FR-3-001:** A Blood Unit Inventory workbench page SHALL be accessible via Blood Bank → Inventory. It SHALL display all Blood Bank program orders as a unit-centric list — one row per order (blood unit).

**FR-3-002:** The inventory table SHALL display: Unit Number, Component Type, ABO/Rh, Expiration Date, Storage Location, Derived Status, Days Until Expiry, and Actions.

**FR-3-003:** Derived Status SHALL be computed from the underlying order state as follows:

| Derived Status | Condition | Tag kind |
|---|---|---|
| Quarantine | Order not yet fully validated (results pending or in progress) | `purple` |
| Available | All confirmatory tests validated; no linked Transfusion Request | `green` |
| Reserved | Order has an active linked Transfusion Request ID | `blue` |
| Issued | Order marked as complete/issued via Spec 5 workflow | `teal` |
| Discarded | Order cancelled with a discard reason | `gray` |
| Expired | Expiration date has passed AND order not yet issued | `red` |

**FR-3-004:** The workbench SHALL default to showing Quarantine, Available, and Reserved units. Issued, Discarded, and Expired units SHALL be accessible via a Status filter dropdown.

**FR-3-005:** Days Until Expiry SHALL be displayed as: plain text (> 7 days), warm-gray Tag (4–7 days), red Tag (1–3 days), red "Expired" Tag (past expiration).

**FR-3-006:** A warning `InlineNotification` (kind="warning") SHALL appear at the top of the workbench if any Available or Quarantine units are within 3 days of expiration.

**FR-3-007:** Clicking a row SHALL expand an inline detail panel showing: all unit program fields, linked order accession number, linked confirmatory test results and their validation status, and (for Reserved units) the linked Transfusion Request identifier.

### 4.4 Unit Discard

**FR-4-001:** A user with `bloodbank.program.discard` permission SHALL be able to discard a Quarantine or Available unit. Reserved units cannot be discarded without first cancelling the linked Transfusion Request.

**FR-4-002:** Discarding SHALL trigger a confirmation modal requiring a discard reason (Expired / Quality issue / Not needed / Other). On confirmation, the underlying order SHALL be cancelled with the discard reason stored as a cancellation note.

**FR-4-003:** Discarded units SHALL remain in the database for audit and reporting (Spec 6) but SHALL NOT appear in the default inventory view.

### 4.5 Automatic Expiration Flagging

**FR-5-001:** A scheduled background job SHALL run daily and flag any Available or Quarantine blood unit orders whose expiration date has passed as Expired (derived status). No new order status is created; expiration is a derived condition checked at display time and by the background job which adds an expiration flag to the program data.

**FR-5-002:** Expired units SHALL be excluded from the crossmatch-compatible unit pool in the Transfusion Request workflow (Spec 4).

### 4.6 Integration Hook: Unit Reservation (for Spec 4)

**FR-6-001:** When the Transfusion Request / Crossmatch workflow (Spec 4) selects a unit for crossmatch, a Transfusion Request ID SHALL be written to the Blood Bank order's program data, setting the derived status to Reserved.

**FR-6-002:** If the Transfusion Request is cancelled or the crossmatch is abandoned, the Transfusion Request ID SHALL be cleared from the order's program data, returning the derived status to Available.

---

## 5. Data Model

### No New Entities Required

Blood Bank program fields are stored using the **existing OpenELIS program data model** — the same infrastructure used by all other programs (e.g., EQA, HIV, TB). No new entities, no schema extension. The Blood Bank program is a new program instance configured with the fields listed in FR-1-002; the values are persisted through the standard program field storage mechanism.

The following Blood Bank program fields map to the existing program data infrastructure:

| Program Field | Type | Required | Notes |
|---|---|---|---|
| Unit Number | String(50) | Yes | Unique across all Blood Bank orders; serves as the unit identifier |
| ISBT 128 Raw | String(500) | No | Stored on scan for audit trail |
| Component Type | Reference (SampleType) | Yes | FK to existing SampleType under "Blood Bank" lab unit; stored as reference ID in program data |
| ABO Group | Enum string | Yes | A / B / AB / O |
| Rh Type | Enum string | Yes | Positive / Negative |
| Expiration Date | Date | Yes | Used for expiry derivation |
| Storage Location | Reference (existing storage location) | Yes | FK stored as reference ID in program data |
| Supplier / Blood Center | String(100) | No | — |
| Special Attributes | Multi-value string | No | Pipe-delimited: IRRADIATED\|CMV_NEGATIVE\|LEUKOREDUCED etc. |
| Linked Transfusion Request ID | String | No | Set/cleared by Spec 4 reservation workflow |
| Discard Reason | Enum string | No | Set on order cancellation |
| Discard Reason Text | String(500) | No | Required when Discard Reason = OTHER |

### Existing Infrastructure Reused (No Schema Changes)

- **Order** — Blood Bank program orders are standard orders. No new fields on Order.
- **Program / ProgramData** — existing program framework stores all Blood Bank-specific fields. "Blood Bank" is a new program instance configured at setup, not a new entity type.
- **Sample** — blood unit represented as a sample; unit number used as sample/accession identifier.
- **Test / Result / Validation** — existing workflows handle confirmatory tests with no modification.
- **Storage Location** — existing entity; referenced by ID in program data fields.

### State Derivation Logic (No New Order Status Values)

```
Derived Status = f(order.status, validationState, programData)

if programData.isExpired == true
  AND order.status != CANCELLED
  AND order.status != COMPLETED     → EXPIRED

else if order.status == CANCELLED   → DISCARDED

else if order.status == COMPLETED   → ISSUED  (set by Spec 5)

else if programData.linkedTransfusionRequestId != null  → RESERVED

else if allConfirmatoryTestsValidated(order)            → AVAILABLE

else                                                    → QUARANTINE
```

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/bloodbank/units` | List Blood Bank orders as unit inventory (filterable) | `bloodbank.program.view` |
| GET | `/api/v1/bloodbank/units/available` | List Available units only — crossmatch pool (Spec 4) | `bloodbank.program.view` |
| GET | `/api/v1/bloodbank/units/{orderId}` | Get single unit with program data + test results | `bloodbank.program.view` |
| POST | `/api/v1/bloodbank/units/parse-isbt` | Parse ISBT 128 barcode → program field values | `bloodbank.program.order` |
| PUT | `/api/v1/bloodbank/units/{orderId}/discard` | Cancel order with discard reason | `bloodbank.program.discard` |
| PUT | `/api/v1/bloodbank/units/{orderId}/reserve` | Set linkedTransfusionRequestId (called by Spec 4) | Internal |
| PUT | `/api/v1/bloodbank/units/{orderId}/unreserve` | Clear linkedTransfusionRequestId (called by Spec 4) | Internal |
| POST | `/api/v1/bloodbank/units/flag-expired` | Background job: set isExpired on past-expiry units | Internal (scheduled) |
| GET | `/api/v1/bloodbank/program/config` | Get Blood Bank program configuration | `bloodbank.program.view` |
| PUT | `/api/v1/bloodbank/program/config` | Update Blood Bank program configuration | `bloodbank.program.configure` |

Note: Unit creation (reception) is handled through the existing Order Entry API (`POST /api/v1/orders`) with `programId` = Blood Bank. No new order creation endpoint is required.

---

## 7. UI Design

See companion React mockup: `blood-unit-inventory-mockup.jsx`

### Navigation Path

- **Reception:** Blood Bank → Receive Unit (opens existing order entry configured for Blood Bank program)
- **Inventory:** Blood Bank → Inventory
- **Program Config:** Admin → Blood Bank → Program Settings

### Key Screens

1. **Receive Unit (order entry)** — Existing order entry form with Blood Bank program fields surfaced in a "Unit Details" panel. Unit Number field is scan-ready. ISBT 128 auto-populate on scan. Confirmatory test panel pre-selected.
2. **Blood Unit Inventory workbench** — DataTable of all Blood Bank program orders as unit rows. Status filter, component type filter, expiry warning banner, per-row derived status Tags.
3. **Unit detail inline panel** — Expands on row click. Shows program fields + linked order accession + confirmatory test results + validation status + linked Transfusion Request (if Reserved).
4. **Discard modal** — Reason selection, required for confirmation.

### Interaction Patterns

- **Scan-first order entry** — Unit Number is autoFocus; ISBT scan drives the rest of the form
- **Inline row expansion** for unit detail (no modals for viewing)
- **Modal** for discard confirmation only (destructive action)

---

## 8. Business Rules

**BR-001:** Unit numbers must be globally unique across all Blood Bank program orders regardless of status. A unit number from a discarded or expired order cannot be reused.

**BR-002:** A unit in Reserved status cannot be discarded without first cancelling the linked Transfusion Request in Spec 4. The discard endpoint must check for a non-null `linkedTransfusionRequestId` and return an error if present.

**BR-003:** Unit program fields (ABO Group, Rh Type, Component Type) are immutable once the order's confirmatory tests have been validated (i.e., once the unit reaches Available status). Corrections are only permitted in Quarantine state.

**BR-004:** The `/api/v1/bloodbank/units/available` endpoint must apply all three exclusion filters: order not cancelled, isExpired = false, linkedTransfusionRequestId = null. Any unit failing any filter must not appear in the crossmatch pool.

**BR-005:** The Blood Bank default confirmatory test panel is configurable by Blood Bank Admins. Any change to the default panel affects only new orders created after the change; existing orders are unaffected.

**BR-006:** ISBT 128 raw barcode strings must be stored on reception regardless of whether the user subsequently edits any auto-populated field. This is an audit requirement.

**BR-007:** The expiration date must be in the future at the time of order creation. The order entry form must validate this before saving.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.bbInventory.title` | Blood Unit Inventory |
| `heading.bbInventory.receiveUnit` | Receive Blood Unit |
| `heading.bbInventory.unitDetails` | Unit Details |
| `heading.bbInventory.programSettings` | Blood Bank Program Settings |
| `label.bbInventory.unitNumber` | Unit Number |
| `label.bbInventory.componentType` | Component Type |
| `label.bbInventory.aboGroup` | ABO Group |
| `label.bbInventory.rhType` | Rh Type |
| `label.bbInventory.expirationDate` | Expiration Date |
| `label.bbInventory.storageLocation` | Storage Location |
| `label.bbInventory.supplier` | Supplier / Blood Center |
| `label.bbInventory.specialAttributes` | Special Attributes |
| `label.bbInventory.daysToExpiry` | Days to Expiry |
| `label.bbInventory.derivedStatus` | Status |
| `label.bbInventory.linkedOrder` | Order Accession |
| `label.bbInventory.linkedRequest` | Linked Transfusion Request |
| `label.bbInventory.autoFilled` | Auto-filled from barcode |
| `label.bbInventory.confirmatorytests` | Confirmatory Tests |
| `label.bbInventory.status.quarantine` | Quarantine |
| `label.bbInventory.status.available` | Available |
| `label.bbInventory.status.reserved` | Reserved |
| `label.bbInventory.status.issued` | Issued |
| `label.bbInventory.status.discarded` | Discarded |
| `label.bbInventory.status.expired` | Expired |
| `button.bbInventory.receiveUnit` | Receive Blood Unit |
| `button.bbInventory.discard` | Discard |
| `button.bbInventory.cancel` | Cancel |
| `button.bbInventory.refresh` | Refresh |
| `message.bbInventory.receiveSuccess` | Unit {unitNumber} received. Confirmatory tests ordered. |
| `message.bbInventory.discardSuccess` | Unit {unitNumber} discarded. |
| `message.bbInventory.expiryWarning` | {count} unit(s) are expiring within 3 days. Review inventory. |
| `message.bbInventory.discardConfirm` | Are you sure you want to discard this unit? This cannot be undone. |
| `error.bbInventory.unitNumberRequired` | Unit number is required. |
| `error.bbInventory.unitNumberDuplicate` | A unit with this number already exists. |
| `error.bbInventory.componentTypeRequired` | Component type is required. |
| `error.bbInventory.aboRequired` | ABO group is required. |
| `error.bbInventory.rhRequired` | Rh type is required. |
| `error.bbInventory.expirationRequired` | Expiration date is required. |
| `error.bbInventory.expirationPast` | Expiration date must be in the future. |
| `error.bbInventory.storageRequired` | Storage location is required. |
| `error.bbInventory.cannotDiscardReserved` | Cannot discard: unit is reserved for a transfusion request. Cancel the request first. |
| `error.bbInventory.discardReasonRequired` | Discard reason is required. |
| `placeholder.bbInventory.searchUnits` | Search by unit number... |
| `nav.bloodbank.inventory` | Inventory |
| `nav.bloodbank.receiveUnit` | Receive Unit |
| `nav.bloodbank.programSettings` | Program Settings |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| unitNumber | Required, max 50 chars | `error.bbInventory.unitNumberRequired` |
| unitNumber | Unique across all Blood Bank orders | `error.bbInventory.unitNumberDuplicate` |
| componentTypeId | Required, active type | `error.bbInventory.componentTypeRequired` |
| aboGroup | Required | `error.bbInventory.aboRequired` |
| rhType | Required | `error.bbInventory.rhRequired` |
| expirationDate | Required, must be future date | `error.bbInventory.expirationRequired` / `error.bbInventory.expirationPast` |
| storageLocationId | Required, active location | `error.bbInventory.storageRequired` |
| discardReason | Required when discarding | `error.bbInventory.discardReasonRequired` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View inventory | `bloodbank.program.view` | Blood Bank → Inventory not shown |
| Receive unit (create order) | `bloodbank.program.order` | Receive Unit entry point hidden; API returns 403 |
| Enter confirmatory test results | `bloodbank.program.result` | Result entry restricted (existing result permission model) |
| Validate order (release to Available) | `bloodbank.program.validate` | Validate action hidden; API returns 403 |
| Discard unit | `bloodbank.program.discard` | Discard button hidden; API returns 403 |
| Configure program settings | `bloodbank.program.configure` | Admin → Blood Bank → Program Settings hidden |

---

## 12. Acceptance Criteria

### Functional

- [ ] Blood Bank program exists in OpenELIS program framework with all fields from FR-1-002
- [ ] User with `bloodbank.program.order` can open Receive Unit and create a Blood Bank order
- [ ] Scanning a valid ISBT 128 barcode auto-populates Unit Number, ABO Group, Rh Type, Component Type, and Expiration Date
- [ ] Raw ISBT 128 string is stored in program data regardless of subsequent field edits
- [ ] Non-ISBT input is accepted as plain unit number; other fields left for manual entry
- [ ] Default confirmatory test panel (ABO + Rh Typing) is pre-selected in the order
- [ ] System blocks receipt of unit with duplicate unit number
- [ ] System blocks receipt of unit with past expiration date
- [ ] After save, confirmation shows "Unit [X] received. Confirmatory tests ordered."
- [ ] Form resets for next unit after save (batch receipt support)
- [ ] Blood Unit Inventory workbench shows all Blood Bank orders with correct derived status
- [ ] QUARANTINE status shown for orders with unvalidated confirmatory tests
- [ ] AVAILABLE status shown for orders where all confirmatory tests are validated
- [ ] RESERVED status shown when linkedTransfusionRequestId is set
- [ ] Status filter correctly hides/shows Discarded and Expired units
- [ ] Days to Expiry Tags use correct color coding (warm-gray ≤7, red ≤3)
- [ ] Expiry warning banner fires when any Available/Quarantine unit is within 3 days
- [ ] Unit detail inline panel shows program fields + confirmatory test results + validation status
- [ ] User with `bloodbank.program.discard` can discard Available/Quarantine unit via modal with reason
- [ ] System blocks discard of Reserved units with appropriate error message
- [ ] Background job flags past-expiry units; they no longer appear in default inventory view
- [ ] `/api/v1/bloodbank/units/available` returns only Available, non-expired, non-reserved units

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Inventory workbench loads within 2 seconds for up to 1,000 active units
- [ ] Works correctly on screens 1280px wide and above
- [ ] All i18n keys listed in Section 9 of this FRS
- [ ] All write operations enforced at API layer (HTTP 403 for unauthorized requests)

### Integration

- [ ] Sample types under the "Blood Bank" lab unit populate the Component Type dropdown in order entry
- [ ] Active storage locations from existing OpenELIS infrastructure populate Storage Location dropdown
- [ ] Confirmatory test results entered and validated via existing Results Entry and Validation workflows transition unit to Available status
- [ ] Spec 4 reserve/unreserve calls correctly update linkedTransfusionRequestId and reflect in inventory derived status
- [ ] Spec 5 order completion correctly reflects as Issued in inventory derived status

---

## Appendix: Architectural Decision Record

**Decision:** Blood unit = Order (not a separate BloodUnit entity)
**Rationale:** Reuses existing order entry, test ordering, results entry, and validation infrastructure. Confirmatory diagnostic tests on received units flow through the existing test workflow without modification. Component types reuse the existing sample type / lab unit infrastructure — the "Blood Bank" lab unit groups all blood product sample types (pRBC, FFP, PLT, etc.). Storage reuses existing storage location infrastructure. Reduces net-new code to: (1) Blood Bank program configuration, (2) inventory workbench view, (3) ISBT 128 parser. No new entities and no schema changes required.

**Deferred to v2:** Guided workflows linking storage location types to compatible component types (e.g., warn if pRBC assigned to platelet incubator).

---

*FRS paired with: `blood-unit-inventory-mockup.jsx`*
*Part of: Blood Banking Module — Phase 1, Spec 1 of 5*
