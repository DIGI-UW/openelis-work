# Blood Bank: Component Type Configuration
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Draft for Review
**Jira:** TBD (Blood Bank epic)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Blood Unit Inventory (Spec 2), Lab Configuration (existing), Data Dictionary (existing)

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

This spec defines the Blood Component Type configuration admin page — the only net-new reference data required to support blood banking in OpenELIS. It allows Blood Bank Admins to manage the catalog of blood product types (e.g., pRBC, FFP, Platelets) that blood units will be classified under in the inventory and transfusion request workflows. Storage locations and reagent lots are managed through OpenELIS's existing Lab Configuration and Data Dictionary infrastructure respectively, and are referenced — not duplicated — by the blood banking module.

---

## 2. Problem Statement

**Current state:** OpenELIS has no concept of blood component types. Existing reference data infrastructure (storage locations, reagent lots) covers the other configuration needs for blood banking. The only gap is a standardized, admin-managed catalog of blood product types that the Blood Unit Inventory and Transfusion Request modules can reference.

**Impact:** Without a managed component type catalog, blood unit receipt and transfusion request forms would require free-text product entry, leading to inconsistent naming (e.g., "PRBC" vs "pRBC" vs "packed cells") and broken downstream filtering and reporting.

**Proposed solution:** Add a single Blood Component Types admin configuration page, following the standard OpenELIS admin table pattern (consistent with Test Methods, Result Options, and Lab Units). Pre-seed common component types on installation. Allow Blood Bank Admins to add, edit, and deactivate types as needed.

**Out of scope:** Storage location management (handled by existing Lab Configuration), reagent lot management (handled by existing Data Dictionary / QC infrastructure). Both are referenced by blood bank workflows without modification. Guided integration workflows linking these to blood banking contexts are deferred to v2.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Blood Bank Admin | Full CRUD | Can create, edit, and deactivate component types |
| Blood Bank Supervisor | Read-only | Can view the page but cannot modify records |
| Blood Bank Technologist | No access | Page not shown in menu |
| Ordering Clinician | No access | Page not shown in menu |
| System Administrator | Full | Can perform all Blood Bank Admin actions |

**Required permission keys:**

- `bloodbank.config.view` — View blood bank configuration pages
- `bloodbank.componenttype.add` — Create new blood component types
- `bloodbank.componenttype.modify` — Edit existing blood component types
- `bloodbank.componenttype.deactivate` — Deactivate blood component types

---

## 4. Functional Requirements

### 4.1 Page Layout & Navigation

**FR-1-001:** The Blood Component Types page SHALL be accessible via Admin → Blood Bank → Component Types.

**FR-1-002:** The page SHALL follow the standard OpenELIS admin config table pattern: a searchable DataTable with an inline "Add" row expansion at the top and per-row inline edit expansion, consistent with the Test Methods and Result Options pages.

### 4.2 Listing & Search

**FR-2-001:** The page SHALL display all blood component types in a DataTable with the following columns: Name, Abbreviation, Default Volume (mL), Storage Requirement, Active status, and Actions.

**FR-2-002:** A toolbar search input SHALL filter the table by Name or Abbreviation in real time (client-side filter).

**FR-2-003:** Inactive component types SHALL remain visible in the table and be distinguishable by a gray "Inactive" Tag. They SHALL NOT be hidden by default, but the search/filter state does not need to exclude them.

### 4.3 Create Component Type

**FR-3-001:** A user with `bloodbank.componenttype.add` permission SHALL be able to create a new component type using an "Add Component Type" button in the table toolbar. The creation form SHALL appear as an inline row expansion at the top of the table — not in a modal.

**FR-3-002:** The creation form SHALL include the following fields:
- **Name** (text input, required, max 100 chars, must be unique across all statuses)
- **Abbreviation** (text input, required, max 10 chars, must be unique across all statuses, e.g., "pRBC", "FFP", "PLT")
- **Default Volume mL** (number input, optional, min 1, max 9999)
- **Storage Requirement** (select, required): Refrigerated 1–6°C / Frozen –18°C or below / Frozen –65°C or below / Room Temperature 20–24°C / Agitated Room Temperature / Other
- **Description** (text area, optional, max 500 chars) — in an Accordion section labeled "Additional Details"

**FR-3-003:** On successful save, the system SHALL display an `InlineNotification` (kind="success") and the new record SHALL appear in the table.

### 4.4 Edit Component Type

**FR-4-001:** A user with `bloodbank.componenttype.modify` permission SHALL be able to edit a component type via inline row expansion. The Edit button SHALL toggle the row open and closed. Only one row SHALL be expanded at a time.

**FR-4-002:** All fields from FR-3-002 are editable, EXCEPT: the Abbreviation field of a pre-seeded record (isPreSeeded = true) SHALL be read-only. The Name of a pre-seeded record remains editable.

**FR-4-003:** Saving an edit SHALL collapse the row and show an `InlineNotification` (kind="success").

### 4.5 Deactivate Component Type

**FR-5-001:** A user with `bloodbank.componenttype.deactivate` permission SHALL see a "Deactivate" button on active records. Inactive records SHALL show an "Activate" button to re-enable them.

**FR-5-002:** Clicking "Deactivate" SHALL trigger a confirmation modal (the one permitted use of a modal per constitution Principle 3 — destructive action confirmation).

**FR-5-003:** If a component type is referenced by one or more blood units currently in inventory, the deactivation SHALL be blocked. The system SHALL display an `InlineNotification` (kind="error"): "Cannot deactivate: [N] unit(s) in inventory use this component type."

**FR-5-004:** Deactivated component types SHALL NOT appear in the component type dropdown in the Blood Unit Inventory receipt form (Spec 2) or in the Transfusion Request form (Spec 4).

### 4.6 Pre-Seeded Records

**FR-6-001:** The following component types SHALL be pre-seeded on fresh installation:

| Name | Abbreviation | Default Volume (mL) | Storage Requirement |
|---|---|---|---|
| Packed Red Blood Cells | pRBC | 250 | Refrigerated 1–6°C |
| Fresh Frozen Plasma | FFP | 220 | Frozen –18°C or below |
| Platelets | PLT | 50 | Agitated Room Temperature |
| Cryoprecipitate | CRYO | 15 | Frozen –18°C or below |
| Whole Blood | WB | 450 | Refrigerated 1–6°C |
| Granulocytes | GRA | 200 | Room Temperature 20–24°C |

**FR-6-002:** Pre-seeded records SHALL be marked with a "Default" teal Tag in the Name column. Their Abbreviation field SHALL be read-only. All other fields are editable.

**FR-6-003:** Pre-seeded records SHALL NOT be deletable at the database level (isPreSeeded = true guard on the deactivate endpoint blocks permanent removal).

---

## 5. Data Model

### New Entity

**BloodComponentType**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| name | String(100) | Yes | Unique across all statuses |
| abbreviation | String(10) | Yes | Unique across all statuses |
| description | String(500) | No | Optional narrative |
| defaultVolumeMl | Integer | No | Typical unit volume in mL |
| storageRequirement | Enum | Yes | REFRIGERATED / FROZEN_MINUS18 / FROZEN_MINUS65 / ROOM_TEMP / AGITATED_ROOM_TEMP / OTHER |
| isActive | Boolean | Yes | Default true |
| isPreSeeded | Boolean | Yes | Default false; guards abbreviation edit and prevents deletion |
| createdDate | Timestamp | Yes | Auto-set on create |
| lastUpdatedDate | Timestamp | Yes | Auto-set on update |
| lastUpdatedBy | Long (FK → SystemUser) | Yes | Audit trail |

### Existing Infrastructure Referenced (No Changes)

- **Storage locations** — existing OpenELIS Lab Configuration storage records are referenced by the Blood Unit Inventory module (Spec 2). No modifications to the existing entity are required for Phase 1. Guided blood-bank-specific storage workflows deferred to v2.
- **Reagent lots** — existing OpenELIS QC/reagent infrastructure is referenced by the Pre-Transfusion Testing module (Spec 4) for reagent lot selection during test recording. No modifications required for Phase 1.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/bloodbank/component-types` | List all component types | `bloodbank.config.view` |
| GET | `/api/v1/bloodbank/component-types/active` | List active types only (for dropdowns) | `bloodbank.config.view` |
| GET | `/api/v1/bloodbank/component-types/{id}` | Get single component type | `bloodbank.config.view` |
| POST | `/api/v1/bloodbank/component-types` | Create component type | `bloodbank.componenttype.add` |
| PUT | `/api/v1/bloodbank/component-types/{id}` | Update component type | `bloodbank.componenttype.modify` |
| PUT | `/api/v1/bloodbank/component-types/{id}/deactivate` | Deactivate | `bloodbank.componenttype.deactivate` |
| PUT | `/api/v1/bloodbank/component-types/{id}/activate` | Re-activate | `bloodbank.componenttype.deactivate` |

---

## 7. UI Design

See companion React mockup: `blood-bank-admin-config-mockup.jsx`

### Navigation Path

Admin → Blood Bank → Component Types

### Key Screens

1. **Component Types list** — Standard admin config DataTable. Active records show a green "Active" Tag; inactive show gray "Inactive". Pre-seeded records show a teal "Default" Tag next to the name.
2. **Inline add form** — Expands at top of table when "Add Component Type" is clicked. Description field in Accordion for progressive disclosure.
3. **Inline edit form** — Expands on the row being edited. Abbreviation is disabled for pre-seeded records.
4. **Deactivate confirmation modal** — Simple confirmation: record name + warning that it will no longer appear in blood unit workflows.

### Interaction Patterns

- **Inline row expansion** for add and edit forms (no modals for create/edit)
- **Modal** for deactivate confirmation only (destructive action)
- **Accordion** for optional Description field within the add/edit form

---

## 8. Business Rules

**BR-001:** Name must be unique across all blood component types regardless of active/inactive status.

**BR-002:** Abbreviation must be unique across all blood component types regardless of active/inactive status. Reusing an abbreviation from a deactivated record is not permitted.

**BR-003:** A component type referenced by one or more blood units in inventory (BloodUnit.componentTypeId) cannot be deactivated until those units are issued, discarded, or reassigned.

**BR-004:** Pre-seeded component type abbreviations are immutable. The API must enforce this: PUT requests attempting to change the abbreviation of an isPreSeeded=true record must return HTTP 400.

**BR-005:** All create and modify actions must record the acting user's ID and timestamp in lastUpdatedBy / lastUpdatedDate.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.componentType.title` | Component Types |
| `label.componentType.name` | Name |
| `label.componentType.abbreviation` | Abbreviation |
| `label.componentType.defaultVolumeMl` | Default Volume (mL) |
| `label.componentType.storageRequirement` | Storage Requirement |
| `label.componentType.description` | Description |
| `label.componentType.active` | Active |
| `label.componentType.inactive` | Inactive |
| `label.componentType.default` | Default |
| `label.componentType.additionalDetails` | Additional Details |
| `label.componentType.status` | Status |
| `button.componentType.add` | Add Component Type |
| `button.componentType.save` | Save |
| `button.componentType.cancel` | Cancel |
| `button.componentType.edit` | Edit |
| `button.componentType.deactivate` | Deactivate |
| `button.componentType.activate` | Activate |
| `message.componentType.saveSuccess` | Component type saved successfully. |
| `message.componentType.deactivateSuccess` | Component type deactivated. |
| `message.componentType.activateSuccess` | Component type activated. |
| `message.componentType.deactivateConfirm` | Are you sure you want to deactivate this component type? It will no longer appear in blood unit and transfusion request workflows. |
| `error.componentType.nameRequired` | Name is required. |
| `error.componentType.abbreviationRequired` | Abbreviation is required. |
| `error.componentType.nameDuplicate` | A component type with this name already exists. |
| `error.componentType.abbreviationDuplicate` | This abbreviation is already in use. |
| `error.componentType.cannotDeactivate` | Cannot deactivate: {count} unit(s) in inventory use this component type. |
| `placeholder.componentType.search` | Search component types... |
| `nav.bloodbank.componentTypes` | Component Types |
| `nav.bloodbank.section` | Blood Bank |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| name | Required | `error.componentType.nameRequired` |
| name | Max length 100 | `error.componentType.nameMaxLength` |
| name | Unique (all statuses) | `error.componentType.nameDuplicate` |
| abbreviation | Required | `error.componentType.abbreviationRequired` |
| abbreviation | Max length 10 | `error.componentType.abbreviationMaxLength` |
| abbreviation | Unique (all statuses) | `error.componentType.abbreviationDuplicate` |
| abbreviation | Immutable on pre-seeded records | HTTP 400 from API |
| defaultVolumeMl | Integer, min 1, max 9999 (if provided) | `error.componentType.volumeRange` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Component Types page | `bloodbank.config.view` | Page not shown in Admin → Blood Bank menu |
| Add new component type | `bloodbank.componenttype.add` | "Add Component Type" button hidden |
| Edit component type | `bloodbank.componenttype.modify` | Edit button hidden; API returns 403 |
| Deactivate / Activate | `bloodbank.componenttype.deactivate` | Deactivate/Activate button hidden; API returns 403 |

All API endpoints enforce permissions server-side and return HTTP 403 for unauthorized requests.

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `bloodbank.config.view` can access Admin → Blood Bank → Component Types
- [ ] Page displays all component types in a DataTable with Name, Abbreviation, Default Volume, Storage Requirement, Status, and Actions columns
- [ ] User with `bloodbank.componenttype.add` can create a new component type via inline form; record appears in table on save
- [ ] `InlineNotification` (kind="success") appears after successful save
- [ ] Inline validation error shown if Name is left empty
- [ ] Inline validation error shown if Abbreviation is left empty
- [ ] System blocks save and shows error when Name duplicates an existing record (any status)
- [ ] System blocks save and shows error when Abbreviation duplicates an existing record (any status)
- [ ] User with `bloodbank.componenttype.modify` can edit a component type via inline row expansion
- [ ] Abbreviation field is disabled (read-only) for pre-seeded records
- [ ] User with `bloodbank.componenttype.deactivate` can deactivate an active type not referenced by inventory
- [ ] Deactivation confirmation modal appears before deactivating
- [ ] System blocks deactivation when type is referenced by inventory units; error shows unit count
- [ ] Deactivated records remain visible in table with gray "Inactive" Tag
- [ ] User can re-activate a deactivated component type
- [ ] Six pre-seeded component types appear on fresh installation, each with a teal "Default" Tag
- [ ] Deactivated component types do not appear in Blood Unit Inventory component type dropdown (Spec 2)

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Page loads within 2 seconds under typical conditions
- [ ] Works correctly on screens 1280px wide and above
- [ ] All i18n keys listed in Section 9 of this FRS
- [ ] All write operations enforced at API layer (HTTP 403 for unauthorized requests)

### Integration

- [ ] Active component types appear in the component type dropdown in Blood Unit Inventory receipt form (Spec 2)
- [ ] Active component types appear in the Transfusion Request component selector (Spec 4)
- [ ] Deactivated types do not appear in any downstream dropdown

---

## Appendix: Deferred to v2

- Guided workflow linking existing storage location types to compatible blood component types (e.g., warn if a pRBC unit is assigned to a platelet incubator)
- Guided workflow surfacing expiring reagent lots relevant to blood bank tests from the existing reagent infrastructure
- Component type-specific volume validation rules in the Blood Unit Inventory receipt form

---

*FRS paired with: `blood-bank-admin-config-mockup.jsx`*
*Part of: Blood Banking Module — Phase 1, Spec 1 of 6*
