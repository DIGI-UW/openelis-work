# OpenELIS Global — Flexible RBAC System

**Product Requirements Document (PRD)**
**Version:** 1.0 — Draft
**Date:** March 4, 2026
**Author:** Casey / DIGI, University of Washington
**Status:** Draft — Pending Review

---

## Problem Statement

OpenELIS Global currently uses a hard-coded role system with two tiers: **Global Roles** (Global Administrator, User Account Administrator, Audit Trail, Analyser Import, Cytopathologist, Pathologist) and **Lab Unit Roles** (Reception, Results, Validation, Reports) assigned per lab unit. While this provides basic separation of duties, the approach cannot accommodate the diverse permission needs across the 26+ country implementations. Administrators cannot create custom roles, cannot compose fine-grained module-level permissions, and cannot properly represent external users like clinicians who need to order tests. The rigidity forces workarounds — users are given overly broad access (e.g., Global Administrator when they only need a subset of admin functions), or administrators must request code changes for new role configurations, creating security risks and deployment bottlenecks.

### Current State (v3.2.x)

**Global Roles (checkbox list, not scoped to lab units):**
- Global Administrator — Access to all admin functions
- User Account Administrator — User account administration features only
- Audit Trail — Access to all audit trail
- Analyser Import — Import results from analyzers
- Cytopathologist — Cytopathology-specific workflow role
- Pathologist — Pathology-specific workflow role

**Lab Unit Roles (assigned per lab unit via dropdown):**
- Reception — Access to Order, Patient, and Non-Conformity tabs
- Results — Access to Work Plan, Non-Conformity, and Results tabs
- Validation — Access to Validation and Non-Conformity tabs
- Reports — Access to Reports tab (CSV export only available to Global Administrators)

**Existing UX patterns to preserve or improve:**
- "Copy Permissions From User" feature for quick provisioning
- Lab unit dropdown selector with "Add New Permission" to stack multiple unit assignments
- "All Permissions" checkbox shortcut per lab unit
- Modify/Deactivate/Add workflow from user list page
- Filter by Lab Unit Roles and Active/Administrator status on user list

---

## Goals

**G1.** Enable administrators to create, edit, and delete fully custom roles by composing module-level permissions — no code changes required.

**G2.** Support role scoping at three levels: global, department/discipline (e.g., Pathology, Microbiology, Hematology), and individual lab unit — with inheritance so that a department-scoped role cascades to its child lab units.

**G3.** Introduce a "Test Requester" role type with provider metadata (facility, license number, specialty, NPI) that uses the same RBAC system as lab staff but delivers an adaptive UI experience focused on ordering.

**G4.** Maintain backward compatibility with all existing default roles — both global (Global Administrator, User Account Administrator, Audit Trail, Analyser Import, Cytopathologist, Pathologist) and lab unit (Reception, Validation, Results, Reports) — as pre-built templates that can be cloned and customized.

**G5.** Integrate seamlessly with the existing Keycloak OAuth authentication layer, syncing roles and permissions without requiring a parallel auth system.

---

## Non-Goals

**NG1. Attribute-Based Access Control (ABAC):** We are not implementing rule-based policies (e.g., "allow access only during business hours" or "only if patient is in region X"). RBAC with scoping is sufficient for this phase.

**NG2. Per-record permissions:** We will not gate access to individual patient records or individual test results. Access is controlled at the module/feature level, not the data-row level.

**NG3. Clinician self-registration portal:** Test requesters will be provisioned by lab administrators. A self-service registration flow for clinicians is a future consideration.

**NG4. Migration of Keycloak to a different IdP:** We assume Keycloak remains the identity provider. This spec does not cover switching to a different SSO platform.

**NG5. Audit log redesign:** While the new RBAC system will emit audit events for role changes, redesigning the audit logging system itself is out of scope.

---

## User Stories

### Lab Administrator

**US-1.** As a **lab administrator**, I want to **create a new custom role by selecting from a list of module-level permissions** so that I can tailor access for specialized staff (e.g., a "QA Reviewer" who can view results and reports but not enter or validate them).

**US-2.** As a **lab administrator**, I want to **scope a role assignment to a specific department (e.g., Pathology) or globally** so that a user has the right access in the right organizational units without needing separate role assignments per lab unit.

**US-3.** As a **lab administrator**, I want to **clone an existing role template and modify it** so that I can quickly create variants of standard roles (e.g., a "Senior Technician" based on the Results role with added validation permissions).

**US-4.** As a **lab administrator**, I want to **assign the "Test Requester" role to a clinician and attach their provider metadata (facility, license, specialty)** so that their orders are properly attributed and they only see the ordering interface.

**US-5.** As a **lab administrator**, I want to **view a summary of all permissions a user has across their role assignments** so that I can audit effective access and spot conflicts or over-provisioning.

**US-6.** As a **lab administrator**, I want to **deactivate a role without deleting it** so that I can temporarily revoke a permission set while preserving the configuration for future use.

### Lab Technician / Staff

**US-7.** As a **lab technician**, I want to **see only the modules and features I have permission to access** so that the interface is uncluttered and I cannot accidentally perform actions outside my scope.

**US-8.** As a **lab technician with multiple role assignments**, I want my **effective permissions to be the union of all my assigned roles** so that I don't lose access when an additional role is added.

### Test Requester (Clinician)

**US-9.** As a **test requester (clinician)**, I want to **log in and immediately see an ordering-focused interface** so that I can quickly submit test requests without navigating the full lab system.

**US-10.** As a **test requester**, I want to **view the status and results of tests I have ordered** so that I can follow up on patient care without contacting the lab directly.

**US-11.** As a **test requester**, I want my **facility and provider information to be automatically attached to my orders** so that the lab knows where to send results and who is responsible.

### System (Technical)

**US-12.** As the **system**, I want to **enforce permissions on both the frontend (UI visibility) and backend (API authorization)** so that access control cannot be bypassed by direct API calls.

**US-13.** As the **system**, I want to **log all role creation, modification, assignment, and deletion events with timestamps and acting user** so that there is a complete audit trail for compliance (ISO 15189).

---

## Requirements

### P0 — Must-Have

#### R1. Permission Registry

Define a canonical list of **screen-level permissions** mapped directly to the OpenELIS menu structure and routes. Each permission controls access to a specific screen or group of screens. **Permissions are grouped by the actual top-level menu headers** in the OpenELIS UI, so the permission categories match exactly what users see in the main navigation.

**🔖 Order** (`banner.menu.sample`) — scopeable to lab unit or department:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `order:add` | Add Order | `/SamplePatientEntry` | Reception |
| `order:modify` | Edit Order | `/ModifyOrder` | Reception |
| `order:search` | Find Order / Sample Edit | `/SampleEdit` | Reception |
| `order:batch_entry` | Batch Order Entry | `/SampleBatchEntrySetup` | Reception |
| `order:electronic` | Incoming / Electronic Orders | `/ElectronicOrders` | Reception |
| `order:barcode` | Print Barcode | `/PrintBarcode` | Reception |
| `order:sample_manage` | Sample Management | `/SampleManagement` | Reception |
| `order:aliquot` | Aliquot | `/Aliquot` | Reception |

**👤 Patient** (`banner.menu.patient`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `patient:manage` | Add/Search Patients | `/PatientManagement` | Reception |
| `patient:history` | Patient History | `/PatientHistory` | Reception |
| `patient:merge` | Patient Merge | `/PatientMerge` | New (admin) |

**🔬 Results** (`banner.menu.results`) — scopeable to lab unit or department:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `results:by_unit` | Results by Unit (Logbook) | `/LogbookResults` | Results |
| `results:by_patient` | Results by Patient | `/PatientResults` | Results |
| `results:by_accession` | Results by Accession | `/AccessionResults` | Results |
| `results:by_status` | Results by Test, Date or Status | `/StatusResults` | Results |
| `results:by_range` | Results by Range | `/RangeResults` | Results |
| `results:referred_out` | Referred Out Tests | `/ReferredOutTests` | Results |
| `results:analyzer` | Analyzer Results Import | `/AnalyzerResults` | Analyser Import |

**✅ Validation** (`banner.menu.resultvalidation`) — scopeable to lab unit or department:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `validation:by_unit` | Validation by Unit | `/ResultValidation` | Validation |
| `validation:by_accession` | Validation by Accession | `/AccessionValidation` | Validation |
| `validation:by_range` | Validation by Range | `/AccessionValidationRange` | Validation |
| `validation:by_test_date` | Validation by Test Date | `/ResultValidationByTestDate` | Validation |

**📅 Workplan** (`banner.menu.workplan`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `workplan:by_test_section` | By Test Section | `/WorkPlanByTestSection` | Results |
| `workplan:by_test` | By Test Type | `/WorkplanByTest` | Results |
| `workplan:by_panel` | By Panel | `/WorkplanByPanel` | Results |
| `workplan:by_priority` | By Priority | `/WorkplanByPriority` | Results |

**⚠ Non-Conform** (`banner.menu.nonconformity`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `nonconformity:report` | Report Non-Conforming Event | `/ReportNonConformingEvent` | Reception, Results, Validation |
| `nonconformity:view` | View Non-Conforming Events | `/ViewNonConformingEvent` | Reception, Results, Validation |
| `nonconformity:corrective` | Corrective Actions | `/NCECorrectiveAction` | Reception, Results, Validation |

**🏥 Pathology / Cytology / Immunohistochemistry** — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `pathology:dashboard` | Pathology Dashboard | `/PathologyDashboard` | Pathologist |
| `pathology:case_view` | Pathology Case View | `/PathologyCaseView/:id` | Pathologist |
| `cytology:dashboard` | Cytology Dashboard | `/CytologyDashboard` | Cytopathologist |
| `cytology:case_view` | Cytology Case View | `/CytologyCaseView/:id` | Cytopathologist |
| `ihc:dashboard` | Immunohistochemistry Dashboard | `/ImmunohistochemistryDashboard` | New |
| `ihc:case_view` | IHC Case View | `/ImmunohistochemistryCaseView/:id` | New |

**📊 Reports** (`banner.menu.reports`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `reports:routine` | Routine Reports | `/RoutineReports`, `/RoutineReport` | Reports |
| `reports:study` | Study Reports | `/StudyReports`, `/StudyReport` | Reports |
| `reports:audit_trail` | Audit Trail Report | `/AuditTrailReport` | Audit Trail |
| `reports:csv_export` | CSV Export | (within report views) | Global Administrator |

**📦 Inventory** (`banner.menu.inventory`) — global:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `inventory:dashboard` | Inventory Dashboard | `/inventory` | New |
| `inventory:catalog` | Manage Catalog | `/inventory/catalog` | New |
| `inventory:items` | Inventory Items | `/inventory/items` | New |
| `inventory:reports` | Inventory Reports | `/inventory/reports` | New |

**🧊 Storage** (`banner.menu.storage`) — global:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `storage:dashboard` | Cold Storage Dashboard | `/Storage` | New |
| `storage:device_management` | Device Management | `/Storage/devices` | New |
| `freezer:monitoring` | Freezer Monitoring | `/FreezerMonitoring` | New |

**💰 Billing** (`banner.menu.billing`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `billing:manage` | Billing Management | `/Billing` | New |

**🧬 Generic Sample** (`banner.menu.generic.sample`) — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `generic_sample:order` | Create Order | `/GenericSample/Order` | New |
| `generic_sample:edit` | Edit Order | `/GenericSample/Edit` | New |
| `generic_sample:import` | Import Samples | `/GenericSample/Import` | New |
| `generic_sample:results` | Enter Results | `/GenericSample/Results` | New |

**📓 Notebook** — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `notebook:dashboard` | Notebook Dashboard | `/NoteBookDashboard` | New |
| `notebook:entry` | Notebook Entry/Edit | `/NoteBookEntryForm` | New |
| `notebook:sample_order` | Notebook Sample Order | `/NotebookSampleOrder` | New |

**📋 Program** — scopeable:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `program:dashboard` | Program Dashboard | `/genericProgram` | New |
| `program:case_view` | Program Case View | `/programView/:id` | New |

**⚙ Admin** (`banner.menu.administration`) — global, under Admin Management sidebar:

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `admin:user_management` | User Management | `/userManagement` | User Account Administrator |
| `admin:role_management` | Role Management | (new) | New |
| `admin:test_management` | Test Management | `/testManagementConfigMenu` | Global Administrator |
| `admin:organization` | Organization Management | `/organizationManagement` | Global Administrator |
| `admin:barcode_config` | Barcode Configuration | `/barcodeConfiguration` | Global Administrator |
| `admin:lab_number` | Lab Number Management | `/labNumber` | Global Administrator |
| `admin:program_config` | Program Configuration | `/program` | Global Administrator |
| `admin:provider` | Provider Management | `/providerMenu` | Global Administrator |
| `admin:result_reporting` | Result Reporting Config | `/resultReportingConfiguration` | Global Administrator |
| `admin:batch_reassignment` | Batch Test Reassignment | `/batchTestReassignment` | Global Administrator |
| `admin:reflex_tests` | Reflex Test Configuration | `/reflex` | Global Administrator |
| `admin:calculated_value` | Calculated Value Config | `/calculatedValue` | Global Administrator |
| `admin:analyzer_test_name` | Analyzer Test Name | `/AnalyzerTestName` | Global Administrator |
| `admin:menu_config` | Menu Configuration | `/globalMenuManagement` etc. | Global Administrator |
| `admin:general_config` | General Configurations | (form entry config) | Global Administrator |
| `admin:app_properties` | Application Properties | (common properties) | Global Administrator |
| `admin:test_notification` | Test Notification Config | (test notification) | Global Administrator |
| `admin:dictionary` | Dictionary Management | (dictionary menu) | Global Administrator |
| `admin:notify_user` | Notify User / Broadcast | (notification) | Global Administrator |
| `admin:search_index` | Search Index Management | (search index) | Global Administrator |
| `admin:plugins` | Plugin Management | `/PluginFile` | Global Administrator |
| `admin:audit_trail` | Audit Trail Access | `/AuditTrailReport` | Audit Trail |

**🩺 Test Requester** (special — for external clinicians):

| Permission Key | Screen(s) | Route(s) | Maps to Current Role |
|---|---|---|---|
| `requester:create_order` | Create Test Order | `/SamplePatientEntry` (requester mode) | New |
| `requester:view_own_orders` | View Own Orders | (new) | New |
| `requester:view_own_results` | View Own Results | `/PatientResults` (filtered) | New |

**Acceptance Criteria:**
- Permissions are stored in a database table, not hard-coded in application code.
- Each permission has a unique key, display name, and description.
- Permissions can be added via database migration without application code changes.
- The system ships with the default permission set above, and implementations can add custom permissions.

#### R2. Role Management (CRUD)

Administrators with the `admin:roles` permission can create, read, update, and delete roles.

**Acceptance Criteria:**
- A role has: unique name, description, list of assigned permissions, active/inactive status, role type (standard, admin, or requester), scope constraint (global-only, scopeable, or any), origin (system or custom), and metadata schema (for requester roles).
- The system ships with **10 default roles** matching the current hard-coded roles. These are marked with an "Origin: System" indicator and cannot be deleted but can be cloned and their permissions can be customized. Custom roles are marked "Origin: Custom" and may be deleted:
  - **Global defaults:** Global Administrator, User Account Administrator, Audit Trail, Analyser Import, Cytopathologist, Pathologist
  - **Lab Unit defaults:** Reception, Results, Validation, Reports
  - **New default:** Test Requester (requester type)
- Administrators can create new roles from scratch by selecting any combination of permissions.
- The Create/Edit Role form displays a **sticky permission counter bar** showing the number of selected permissions out of the total (e.g., "12 of 72 permissions selected") that updates in real-time as checkboxes are toggled. The Save and Cancel actions are embedded in this sticky bar for constant visibility.
- Each permission group heading includes a "Select all" action link that toggles all permissions in that group. The link must be visually distinguishable as interactive (underline, hover state).
- Administrators can clone an existing role to use as a starting template.
- Deleting a custom role requires confirmation and displays how many users are currently assigned to it. Only custom-origin roles can be deleted; system-origin roles show Edit and Clone actions only.
- Deactivating a role removes its permissions from all assigned users without deleting the role or its assignments.

#### R3. Scope-Based Role Assignment

When assigning a role to a user, the administrator selects the scope: Global, Department/Discipline, or Lab Unit.

**Acceptance Criteria:**
- **Global scope:** The role's permissions apply across the entire system, in all lab units.
- **Department scope:** The role's permissions apply to all lab units within a department (e.g., assigning "Results" scoped to "Pathology" grants access to all lab units under Pathology). Departments map to the existing organizational hierarchy (Pathology, Microbiology, Hematology, Biochemistry, Immunology/Serology, Parasitology, Virology, etc.).
- **Lab Unit scope:** The role's permissions apply only within a single lab unit (preserving current behavior).
- A user can have multiple role assignments at different scopes (e.g., "Results" in Hematology + "Reports" globally).
- The user's effective permissions are the union of all their role assignments, evaluated per lab unit context.
- The admin UI shows a matrix/summary view of a user's effective permissions across all scopes.

**User Management UX requirements:**
- The user list uses **Carbon ExpandableRow** pattern: clicking a user row expands an inline detail panel directly below it (no radio buttons or separate Modify button). The expand chevron in the first column rotates to indicate expanded state.
- Adding a new role assignment to a user opens a **modal dialog** (not an inline nested panel) to keep the inline detail height manageable and reduce nesting depth.
- Current role assignments display a **scope legend** showing the color coding: purple border = Global, teal border = Department, blue border = Lab Unit.
- An **unsaved changes indicator** (yellow bar) appears at the top of the inline detail panel when modifications have been made. If the user navigates away (clicks another row or sidebar item) without saving, a confirmation dialog warns of unsaved changes.
- The user's account details button is labeled "Edit Account Info" (not "Edit Details") to disambiguate from role editing.
- Status column displays "Active" / "Inactive" as full text (not "Y" / "N") alongside the status dot for accessibility.
- The expand column header includes `aria-label="Expand row"` for screen readers.

#### R4. Test Requester Role Type

A special role type called "Test Requester" that carries provider metadata and triggers an adaptive UI.

**Acceptance Criteria:**
- Requester roles have an additional metadata schema with fields: Facility/Organization, License Number, Specialty, Provider ID (e.g., NPI), and Phone/Contact.
- When a user's only roles are of type "requester," the UI renders an ordering-focused layout (order creation, order status, results viewing) instead of the full lab interface.
- When a user has both requester and standard roles, the UI provides navigation to both the ordering portal and the lab interface.
- Provider metadata is automatically attached to orders created by the requester.
- Requesters can only view orders and results they have created/are associated with (enforced by `orders:view_own` permission).

#### R5. Backend Authorization Enforcement

Every API endpoint must check permissions server-side, independent of the frontend.

**Acceptance Criteria:**
- A Spring Security-based authorization layer intercepts API requests and evaluates the user's effective permissions (from all role assignments and scopes) against the required permission for the endpoint.
- The current lab unit context (from the request or session) is used to resolve scoped permissions.
- Unauthorized requests return HTTP 403 with a standardized error body.
- Permission checks are cached per-session and invalidated when role assignments change.

#### R6. Frontend Permission-Based Rendering

The React frontend conditionally renders navigation items, pages, and action buttons based on the user's permissions.

**Acceptance Criteria:**
- A `usePermissions()` hook (or equivalent context provider) exposes the user's effective permissions to all components.
- Sidebar navigation only shows menu items the user has permission to access.
- Action buttons (e.g., "Validate," "Enter Results") are hidden or disabled when the user lacks the required permission.
- Attempting to navigate directly to a restricted URL redirects to a "not authorized" page.

**Accessibility requirements (WCAG 2.1 AA):**
- Helper/description text under form fields and permission checkboxes must meet 4.5:1 contrast ratio (use `$gray-70` / `#525252` minimum, not `$gray-50`).
- Status indicators (active/inactive dots) must not rely on color alone; include text labels alongside color indicators.
- Permission checkbox items must have sufficient touch targets (minimum 0.5rem vertical padding) for tablet use in lab environments.
- Use Carbon Design System icon components (`@carbon/icons-react`) for production UI instead of emoji characters (emoji is acceptable in mockups/prototypes only).
- All interactive elements that appear as text links (e.g., "Select all" in permission groups) must have visible interactive affordance (underline, hover state, or button styling).

#### R7. Keycloak Integration

Roles and permissions are managed in OpenELIS and communicated to/from Keycloak.

**Acceptance Criteria:**
- OpenELIS remains the source of truth for role definitions and assignments. Keycloak handles authentication only.
- On login, OpenELIS retrieves the user identity from Keycloak (via OAuth token) and loads role assignments from its own database.
- User provisioning can optionally sync from Keycloak user attributes (e.g., mapping Keycloak groups to OpenELIS roles for bulk provisioning).
- Changes to role assignments in OpenELIS take effect on the user's next login or session refresh.

#### R8. Audit Logging

All RBAC-related events are logged for ISO 15189 compliance.

**Acceptance Criteria:**
- The following events are logged: role created, role modified, role deleted, role activated/deactivated, permission added/removed from role, role assigned to user, role unassigned from user, user login with resolved permissions.
- Each log entry includes: timestamp, acting user ID, target user/role ID, action type, before/after state (for modifications).
- Audit logs are append-only and cannot be modified or deleted through the application.

### P1 — Nice-to-Have

#### R9. Role Templates Gallery

A UI page that displays the default and community-contributed role templates with descriptions, letting administrators browse and clone.

#### R10. Permission Dependency Hints

When composing a role, the UI suggests related permissions (e.g., if you add `validation:access`, it hints that `results:access` is commonly paired with it).

#### R11. Bulk User Role Assignment

Ability to assign a role to multiple users at once (e.g., "assign the Reception role to all users in Hematology").

#### R12. Role Assignment Expiration

Ability to set a time-limited role assignment (e.g., a visiting clinician gets requester access for 30 days).

#### R13. Permission Inspector (Phase 2)

A standalone admin tool under Admin Management → Permission Inspector where an administrator can select any user and see their effective permissions resolved across all scopes and lab units.

**Acceptance Criteria:**
- Accessible at Admin Management → Permission Inspector in the sidebar.
- A user search/picker allows the admin to select any system user.
- Displays a matrix of permissions × lab units/departments showing resolved access.
- Shows which role assignment grants each permission (provenance).
- Does not require navigating to the user's edit page first.

### P2 — Future Considerations

**F1. Fine-Grained CRUD Permissions:** Evolve screen-level permissions to include action-level granularity (e.g., `patient:read`, `patient:write`, `patient:delete`) for implementations that need it.

**F2. Clinician Self-Registration:** A portal where clinicians can request test requester access, subject to admin approval.

**F3. Organization/Facility Hierarchy:** Extend scoping beyond lab units to support multi-facility or multi-site deployments with facility-level role assignments.

**F4. FHIR-Based Permission Scoping:** Leverage FHIR consent and access control resources for cross-system interoperability.

---

## Data Model (Conceptual)

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│  Permission  │       │    Role          │       │    User      │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id           │       │ id               │       │ id           │
│ key (unique) │◄──────│ name             │       │ username     │
│ display_name │  M:N  │ description      │       │ keycloak_id  │
│ description  │       │ role_type        │       │ is_active    │
│ category     │       │   (standard|     │       └──────┬──────┘
└─────────────┘       │    requester)    │              │
                       │ is_active        │              │
                       │ is_default       │              │
                       └────────┬─────────┘              │
                                │                        │
                       ┌────────┴────────────────────────┴──────┐
                       │       UserRoleAssignment                │
                       ├─────────────────────────────────────────┤
                       │ id                                      │
                       │ user_id  → User                         │
                       │ role_id  → Role                         │
                       │ scope_type (global|department|lab_unit) │
                       │ scope_id  → (null|dept_id|lab_unit_id)  │
                       │ assigned_by → User                      │
                       │ assigned_at                              │
                       │ expires_at (nullable, P1)               │
                       └─────────────────────────────────────────┘

                       ┌─────────────────────────────────────────┐
                       │       ProviderMetadata                  │
                       │       (for requester-type users)        │
                       ├─────────────────────────────────────────┤
                       │ id                                      │
                       │ user_id → User                          │
                       │ facility_name                            │
                       │ license_number                           │
                       │ specialty                                │
                       │ provider_id (NPI or local equivalent)   │
                       │ phone                                    │
                       │ email                                    │
                       └─────────────────────────────────────────┘

                       ┌─────────────────────────────────────────┐
                       │       Department                        │
                       ├─────────────────────────────────────────┤
                       │ id                                      │
                       │ name (e.g., Pathology, Microbiology)    │
                       │ description                              │
                       └────────────────┬────────────────────────┘
                                        │ 1:N
                       ┌────────────────┴────────────────────────┐
                       │       LabUnit                           │
                       ├─────────────────────────────────────────┤
                       │ id                                      │
                       │ name                                     │
                       │ department_id → Department               │
                       └─────────────────────────────────────────┘
```

**Permission resolution algorithm:**

```
effective_permissions(user, lab_unit) =
    UNION of permissions from:
      1. All roles where scope_type = 'global'
      2. All roles where scope_type = 'department'
         AND scope_id = lab_unit.department_id
      3. All roles where scope_type = 'lab_unit'
         AND scope_id = lab_unit.id
    (filtered to active roles and non-expired assignments)
```

---

## Success Metrics

### Leading Indicators (change within weeks of launch)

| Metric | Target | Measurement |
|---|---|---|
| Custom roles created per implementation | ≥ 3 within 30 days of upgrade | Count of non-default roles in DB |
| Time to provision a new user | < 5 minutes (from ≥ 15 minutes today) | Admin task timing study |
| Admin support tickets for role changes | ↓ 80% from baseline | Ticket tracking |

### Lagging Indicators (change over months)

| Metric | Target | Measurement |
|---|---|---|
| Over-provisioned users (users with more access than needed) | ↓ 50% from baseline | Permission audit report |
| External requester adoption | ≥ 10 clinician accounts per site within 6 months | User count with requester role type |
| Code-change requests for new roles | → 0 | GitHub issue tracking |

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-1 | Should departments be configurable per implementation (e.g., some labs have "Molecular Biology" as a department) or should there be a fixed list? | Engineering / Implementers | Open |
| OQ-2 | How should permission changes propagate to active sessions — immediate invalidation vs. next-login? Immediate adds complexity but is more secure. | Engineering | Open |
| OQ-3 | For the Test Requester adaptive UI — should this be a completely separate React route tree, or a conditional layout within the existing app shell? | Design / Frontend | Open |
| OQ-4 | Do we need to support permission *deny* rules (explicitly blocking a permission that would otherwise be granted by another role), or is union-only sufficient? | Product / Security | Open |
| OQ-5 | Should the Keycloak sync be bidirectional (Keycloak groups → OpenELIS roles), or should OpenELIS always be the sole source of role assignments? | Engineering / IT | Open |
| OQ-6 | What is the migration plan for existing user role assignments? Automatic mapping of current hard-coded roles to new default role templates? | Engineering | Open |

---

## Timeline Considerations

**Hard dependencies:**
- The existing Keycloak integration must remain functional throughout the transition. Any changes to auth flow require careful staging.
- Database migration must handle mapping of existing hard-coded role assignments to new role/assignment tables without downtime.

**Suggested phasing:**

| Phase | Scope | Estimate |
|---|---|---|
| **Phase 1 — Foundation** | Permission registry (screen-level), Role CRUD, scope-based assignment, backend enforcement, migration of existing roles. New admin sidebar items: Role Management, User Management updates | 6–8 weeks |
| **Phase 2 — Frontend + Inspector** | Permission-based UI rendering (sidebar/menu filtering), admin Role Management pages, user role assignment UI with scoping, Permission Inspector tool | 4–6 weeks |
| **Phase 3 — Requester** | Test Requester role type, provider metadata, adaptive ordering UI, own-orders-only filtering | 4–6 weeks |
| **Phase 4 — Polish** | Role templates gallery, permission hints, bulk assignment, documentation, implementer training materials | 2–4 weeks |

**Total estimated effort:** 16–24 weeks (parallel frontend/backend work can compress this).

---

## Navigation Structure

The new RBAC features integrate into the existing OpenELIS Admin Management sidebar. New items are marked with **(new)**.

```
Admin Management (sidebar)
├── Reflex Tests Configuration
├── Analyzer Test Name
├── Lab Number Management
├── Program Entry
├── Provider Management
├── Barcode Configuration
├── List Plugins
├── Organization Management
├── Result Reporting Configuration
├── User Management                    ← existing, updated
│   ├── [User List with expandable inline detail rows] ← click row to edit
│   └── [+ Add User]                  ← button in toolbar
├── Role Management                    ← (new)
│   ├── [Role List]                    ← (new) default tab
│   ├── [Create Role]                  ← (new)
│   └── [Edit Role]                    ← (new)
├── Permission Inspector               ← (new, Phase 2)
│   └── [Select User → View Matrix]
├── Batch Test Reassignment
├── Test Management
├── Menu Configuration ▸
├── General Configurations ▸
├── Application Properties
├── Test Notification Configuration
├── Dictionary Menu
├── Notify User
├── Search Index Management
└── Legacy Admin
```

**Navigation pattern:** Sidebar items link to a page with tabbed sub-views (matching existing OpenELIS pattern). For example, clicking "Role Management" opens the Role List tab, with tabs for Create Role and Edit Role appearing contextually. User Management uses a single-page dashboard with expandable inline rows instead of tabs.

**Page subtitle pattern:** Keep subtitles concise (action phrase only, e.g., "Create, edit, and manage roles with screen-level permissions") with a "Learn more" link to inline help or documentation. Avoid embedding full explanations in subtitles.

---

## Technical Notes

**Stack context:** OpenELIS Global uses Spring Boot (backend), React with Carbon Design System (frontend), PostgreSQL (database), Docker (deployment), and Keycloak (OAuth/SSO).

**Key implementation considerations:**

The permission check on the backend should use a Spring Security `PermissionEvaluator` or custom `AccessDecisionVoter` that reads from the `UserRoleAssignment` table. Permission results should be cached per-session (e.g., in a request-scoped bean or Redis) and invalidated on role changes.

On the frontend, the effective permission set should be loaded on login (via a `/api/me/permissions` endpoint) and stored in a React context. A `<PermissionGate permission="validation:access">` wrapper component can conditionally render children. The Carbon sidebar should dynamically build its navigation tree from the user's permitted modules.

For the department hierarchy, consider leveraging the existing OpenELIS `test_section` / organizational unit tables rather than creating an entirely new department model — this avoids data duplication and ensures consistency with existing lab unit configuration.
