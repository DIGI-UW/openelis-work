# Compliance Standards Administration
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-02
**Status:** Draft for Review
**Jira:** [OGC-528](https://uwdigi.atlassian.net/browse/OGC-528) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Test Catalog (OGC-49), Catalog Subscription & Metadata Sync, Results Entry, Non-Patient Registration (S-02), Compliance Evaluation Engine (S-05)

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

The Compliance Standards Administration feature introduces a configurable regulatory standards framework into OpenELIS Global, enabling laboratories to define, manage, and version compliance standards against which non-clinical test results are evaluated. In Indonesia, these are Baku Mutu standards (PP No. 22/2021 for water quality, PP No. 41/1999 for ambient air, etc.); internationally, they may be WHO guidelines, EPA limits, EU Water Framework Directive thresholds, or any country-specific regulatory framework.

Rather than building a parallel admin surface, the feature extends the existing Test Catalog infrastructure. Compliance standards are lightweight named entities (regulatory metadata), while the actual per-parameter thresholds live as a new "Compliance Thresholds" tab on each test's detail page — alongside existing reference ranges and clinical decision rules. This design ensures that all test configuration remains centralized in the Test Catalog, and compliance thresholds follow the same admin patterns already familiar to OpenELIS administrators.

Standards can be pre-populated at deployment time via CSV files placed in a designated directory (following the same seed-data pattern used for the test catalog), imported in bulk via CSV upload at runtime, or managed individually through the admin UI.

---

## 2. Problem Statement

**Current state:** OpenELIS Global's result evaluation system is designed for clinical reference ranges — normal/abnormal flagging against patient-centric thresholds. Environmental and vector testing laboratories do not evaluate results against patient reference ranges; instead, they compare results against externally published regulatory standards (e.g., Indonesia's Baku Mutu, WHO drinking water guidelines, EPA National Primary Drinking Water Regulations). There is currently no mechanism to define, version, or select these compliance standards within OpenELIS, and no way to evaluate test results against regulatory thresholds.

**Impact:** Without compliance standard support, environmental labs cannot use OpenELIS for their core workflow. Lab staff must manually compare results to printed regulatory tables, introducing transcription errors and delaying compliance reports. The Laporan Hasil (LH) report cannot include automated compliance flagging, undermining the accreditation requirements of ISO 17025 and KAN (Komite Akreditasi Nasional).

**Proposed solution:** Introduce a ComplianceStandard entity representing a named regulatory framework (with issuing body, regulation number, effective date, version, and status). Each standard organizes its parameters into ParameterGroups for logical grouping (e.g., "Physical Parameters," "Chemical Parameters," "Microbiological Parameters"). Individual parameter thresholds are defined on test catalog entries via a new ComplianceThreshold entity, linking a test to a standard with threshold type (max, min, range, descriptive) and values. At deployment time, implementers can place CSV seed files in `/data/compliance-standards/` to pre-populate standards and thresholds — identical to how the test catalog is seeded on fresh installation. At runtime, administrators can also import standards via CSV upload or manage them individually through the UI.

---

## 3. User Roles & Permissions

| Role | Standards List | Standard CRUD | Threshold CRUD | CSV Import | CSV Seed (Deploy) | Notes |
|---|---|---|---|---|---|---|
| Lab Technician | View only | None | None | None | N/A | Can see which standard applies to a sample but cannot modify |
| Lab Manager | View | View only | View only | None | N/A | Can monitor standards configuration |
| System Administrator | Full | Full | Full | Full | Server-side | Can manage all standards, thresholds, and imports |

**Required permission keys:**

- `compliance.standard.view` — View the Compliance Standards list and detail pages
- `compliance.standard.add` — Create a new compliance standard
- `compliance.standard.modify` — Edit an existing compliance standard
- `compliance.standard.delete` — Deactivate (soft-delete) a compliance standard
- `compliance.standard.import` — Import standards and thresholds from CSV
- `compliance.threshold.view` — View the Compliance Thresholds tab on test catalog entries
- `compliance.threshold.modify` — Add, edit, or remove thresholds on test catalog entries

---

## 4. Functional Requirements

### 4.1 Compliance Standards List (Admin Page)

**FR-1-001:** The system SHALL provide a Compliance Standards page accessible at Admin → Test Management → Compliance Standards.

**FR-1-002:** The system SHALL display all compliance standards in a searchable, sortable, paginated DataTable with the following columns: Name, Issuing Body, Regulation Number, Version, Effective Date, Status, Parameter Groups (count), Linked Tests (count), Actions.

**FR-1-003:** The system SHALL display each standard's Status as a Carbon `Tag` with the following semantic kinds: Active (`green`), Draft (`blue`), Superseded (`warm-gray`), Archived (`gray`).

**FR-1-004:** The system SHALL allow a user with `compliance.standard.add` to add a new standard by clicking "Add Standard." The add form SHALL appear via inline row expansion at the top of the DataTable — not in a modal dialog.

**FR-1-005:** The system SHALL allow a user with `compliance.standard.modify` to edit an existing standard via inline row expansion. Clicking "Edit" on a row expands the edit form in place.

**FR-1-006:** The system SHALL allow a user with `compliance.standard.delete` to deactivate a standard via a destructive confirmation modal. Deactivation sets status to Archived and does NOT delete previously evaluated results. Deactivated standards are excluded from the registration-time standard selection dropdown but remain visible in the admin list with an Archived tag.

**FR-1-007:** The add/edit form SHALL contain the following fields: Name (required, TextInput), Issuing Body (required, TextInput), Regulation Number (required, TextInput), Description (optional, TextArea), Version (required, TextInput), Effective Date (required, DatePicker), Expiry Date (optional, DatePicker), Country/Region (required, ComboBox with type-ahead from existing values plus free text), Applicable Sample Types (required, MultiSelect from test catalog sample type categories), Status (required, Select: Draft, Active, Superseded, Archived).

**FR-1-008:** The system SHALL support filtering the standards list by: Status (Select), Country/Region (ComboBox), Applicable Sample Type (Select), and free-text search on Name, Issuing Body, or Regulation Number.

**FR-1-009:** The system SHALL display a "Linked Tests" count on each standard row showing how many test catalog entries have at least one ComplianceThreshold linked to that standard. Clicking the count SHALL navigate to the Test Catalog page with a filter pre-applied for that standard.

### 4.2 Parameter Groups

**FR-2-001:** Each ComplianceStandard SHALL contain one or more ParameterGroups. A ParameterGroup is a logical grouping of related parameters within a standard (e.g., "Physical Parameters," "Inorganic Chemical Parameters," "Microbiological Parameters").

**FR-2-002:** The system SHALL display Parameter Groups as a collapsible Accordion section within the standard's inline expansion row. Each AccordionItem shows the group name, description, and count of thresholds linked to tests in that group.

**FR-2-003:** The system SHALL allow a user with `compliance.standard.modify` to add, edit, reorder, and remove Parameter Groups within a standard. Adding a group uses an inline text input within the Accordion. Removing a group is only permitted if no ComplianceThresholds reference it; otherwise, the system SHALL display an error notification.

**FR-2-004:** Each ParameterGroup SHALL have the following fields: Name (required, TextInput), Description (optional, TextArea), Sort Order (Integer, managed via drag handle or up/down arrows).

### 4.3 Compliance Thresholds on Test Catalog

**FR-3-001:** The Test Catalog Editor (vertical tab sidebar) SHALL include a new "Compliance" tab in the sidebar, placed under a new **Compliance** section group after the existing Automation group. The tab follows the same vertical tab sidebar pattern used by all other test editor tabs (Basic Info, Sample & Results, Ranges, Sample Storage, Display Order, Panels, Labels, Terminology, Reagents, Analyzers, Methods, Alerts, Reflex & Calc). The tab is visible to users with `compliance.threshold.view` permission.

**FR-3-002:** The Compliance Thresholds tab SHALL display a DataTable of all thresholds defined for the current test, with columns: Standard Name, Parameter Group, Threshold Type (Tag), Threshold Value(s), Unit, Effective Date, Status, Actions.

**FR-3-003:** The system SHALL support the following threshold types, displayed as Carbon Tags: Maximum (`red` Tag, label "Max ≤"), Minimum (`blue` Tag, label "Min ≥"), Range (`teal` Tag, label "Range"), Descriptive (`purple` Tag, label "Qualitative").

**FR-3-004:** For threshold type "Maximum": the system SHALL store a single numeric upper-limit value. A result is Compliant if result ≤ threshold.

**FR-3-005:** For threshold type "Minimum": the system SHALL store a single numeric lower-limit value. A result is Compliant if result ≥ threshold.

**FR-3-006:** For threshold type "Range": the system SHALL store a lower and upper numeric value. A result is Compliant if lower ≤ result ≤ upper.

**FR-3-007:** For threshold type "Descriptive": the system SHALL store a text description of the acceptable condition (e.g., "No odor," "Clear," "Absent"). Compliance evaluation for descriptive thresholds requires manual analyst judgment — the system SHALL flag these as "Manual Review Required" rather than auto-evaluating.

**FR-3-008:** The system SHALL allow a user with `compliance.threshold.modify` to add a new threshold via inline row expansion. The add form SHALL include: Standard (required, ComboBox filtered to Active standards), Parameter Group (required, Select filtered to groups within the selected standard), Threshold Type (required, Select), Value(s) (conditional fields based on type), Unit (TextInput, pre-populated from test catalog's default unit if available), Notes (optional, TextArea).

**FR-3-009:** The system SHALL allow a user with `compliance.threshold.modify` to edit an existing threshold via inline row expansion.

**FR-3-010:** The system SHALL allow a user with `compliance.threshold.modify` to remove a threshold. Removal is only permitted if the threshold has not been used in any compliance evaluation. If it has been used, the system SHALL offer to archive (deactivate) it instead.

**FR-3-011:** When a standard's status is changed to Superseded or Archived, the system SHALL display a warning banner on the Compliance Thresholds tab for any test that has thresholds linked to that standard, reading: "This test has thresholds linked to [Standard Name] which is now [status]. Results will no longer be evaluated against this standard."

**FR-3-012:** The Compliance Thresholds tab SHALL support grouping the threshold table by Standard Name (default) or by Parameter Group, toggled via a "Group by" Select control above the table.

### 4.4 Standard → Test Catalog Mapping

**FR-4-001:** When an administrator selects a ComplianceStandard during non-clinical registration (S-02), the system SHALL auto-suggest a test panel composed of all tests that have at least one active ComplianceThreshold linked to that standard.

**FR-4-002:** The Compliance Standards list page SHALL include a "View Linked Tests" action per standard row that opens a read-only panel showing all tests with thresholds for that standard, organized by Parameter Group.

**FR-4-003:** The system SHALL support a "Quick Link" workflow from the Parameter Group accordion: a "Link Test" button per group that opens a ComboBox to search and select a test from the catalog, then expands the threshold add form pre-populated with the standard and group.

### 4.5 CSV Import (Runtime)

**FR-5-001:** The Compliance Standards list page SHALL include an "Import from CSV" button visible to users with `compliance.standard.import` permission.

**FR-5-002:** Clicking "Import from CSV" SHALL open a modal dialog containing: a FileUploader component accepting `.csv` files (max 5MB), a "Download Template" link that downloads a pre-formatted CSV template, an import scope selector (Radio: "Standards & Groups only" or "Standards, Groups & Thresholds"), and an "Upload & Preview" button.

**FR-5-003:** The CSV template for "Standards, Groups & Thresholds" SHALL have the following columns: `standard_name`, `issuing_body`, `regulation_number`, `version`, `effective_date`, `country_region`, `sample_types` (semicolon-delimited), `group_name`, `group_sort_order`, `test_name` (matched against test catalog by name or LOINC code), `test_loinc_code` (optional, used for matching), `threshold_type` (max|min|range|descriptive), `threshold_value_lower`, `threshold_value_upper`, `threshold_value_descriptive`, `unit`, `notes`.

**FR-5-004:** After upload, the system SHALL parse the CSV and display a preview DataTable showing: Row Number, Standard Name, Group, Test Match Status (Matched / Not Found / Ambiguous), Threshold, Validation Status (Valid / Error). Rows with errors SHALL be highlighted with a red left-border and display the error message in the Validation Status column.

**FR-5-005:** The preview SHALL display summary counts: Total Rows, Standards to Create/Update, Groups to Create, Thresholds to Create, Errors. The "Import" button SHALL be disabled if there are any errors, unless the user checks "Skip error rows."

**FR-5-006:** Test matching in CSV import SHALL use the following ordered strategy: (1) Match by `test_loinc_code` if provided, (2) Match by exact `test_name` against the test catalog's name field, (3) If no match is found, mark the row as "Not Found" error. If multiple matches are found, mark as "Ambiguous."

**FR-5-007:** For standards that already exist (matched by `standard_name` + `regulation_number`), the import SHALL update existing fields rather than creating duplicates. New parameter groups and thresholds SHALL be added to the existing standard.

**FR-5-008:** The system SHALL write an audit log entry for each CSV import, recording: filename, row count, standards created/updated, thresholds created, errors skipped, importing user, and timestamp.

### 4.6 Deployment-Time CSV Seeding

**FR-6-001:** The system SHALL support pre-populating compliance standards, parameter groups, and thresholds from CSV files placed in the `/data/compliance-standards/` directory on the server filesystem. This follows the same pattern used for test catalog seed data.

**FR-6-002:** On application startup (fresh installation or upgrade), the system SHALL scan the `/data/compliance-standards/` directory for `.csv` files. For each file found, the system SHALL parse it using the same CSV format defined in FR-5-003 and load the data into the database.

**FR-6-003:** Seed-loaded records SHALL be marked with a `isPreSeeded = true` flag on the ComplianceStandard entity. Pre-seeded standards SHALL display a teal "Default" Tag in the Name column of the admin list to distinguish them from user-created standards.

**FR-6-004:** Pre-seeded standards SHALL be fully editable (administrators can modify names, add/remove groups and thresholds). The `isPreSeeded` flag is informational only and does not restrict editing. However, pre-seeded standards SHALL NOT be deletable — only deactivation (Archive) is permitted. The delete action SHALL be hidden for pre-seeded records, and the API SHALL return HTTP 403 if deletion is attempted.

**FR-6-005:** The system SHALL use idempotent loading: if a standard with the same `standard_name` + `regulation_number` already exists in the database, the seed loader SHALL skip that standard (no overwrite). This ensures that administrator customizations are preserved across application restarts and upgrades.

**FR-6-006:** Seed loading errors SHALL be logged to the application log with WARN level, including the filename, row number, and error message. Seed loading SHALL NOT prevent application startup — partial loads are acceptable.

**FR-6-007:** The system SHALL provide a default seed file `baku-mutu-pp22-2021-water.csv` containing Indonesia's PP No. 22/2021 water quality standard with all parameter groups and thresholds. Additional seed files for other Indonesian standards (PP No. 41/1999 air quality, etc.) can be added by implementers.

**FR-6-008:** The seed file directory path (`/data/compliance-standards/`) SHALL be configurable via the `compliance.seed.directory` key in the system configuration table, allowing deployments to customize the path.

### 4.7 Versioning & Lifecycle

**FR-7-001:** Each ComplianceStandard SHALL have a Version field (string, e.g., "2021," "v3.1," "2026 Amendment"). When a regulation is revised, administrators create a new ComplianceStandard record with the updated version and set the previous version's status to Superseded.

**FR-7-002:** When a standard is superseded, the system SHALL display a banner on the old standard's detail view: "This standard has been superseded by [New Standard Name] (Version [X]) effective [Date]." The banner SHALL include a link to the new standard.

**FR-7-003:** Results evaluated against a standard SHALL store the standard ID and version at evaluation time (version-lock semantics). If a standard is later superseded, previously evaluated results retain their original evaluation — they are NOT retroactively re-evaluated.

**FR-7-004:** The system SHALL support a "Copy Standard" action that duplicates a standard (with all parameter groups and threshold configurations) as a new Draft-status record, pre-populating the version field with "[Original Version] — Copy." This facilitates creating a new version from an existing one.

---

## 5. Data Model

### New Entities

**ComplianceStandard**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| name | String (255) | Yes | Display name (e.g., "PP No. 22/2021 — Water Quality") |
| issuingBody | String (255) | Yes | Regulatory authority (e.g., "Government of Indonesia," "WHO," "US EPA") |
| regulationNumber | String (255) | Yes | Official regulation identifier |
| description | String (2048) | No | Full description of the standard's scope |
| version | String (100) | Yes | Version or year identifier |
| effectiveDate | Date | Yes | When the standard becomes enforceable |
| expiryDate | Date | No | Null if no expiry; set when superseded |
| countryRegion | String (255) | Yes | Country or region of applicability |
| applicableSampleTypes | Set\<String\> | Yes | Sample type categories this standard applies to (e.g., "Water," "Air," "Soil") |
| status | Enum | Yes | DRAFT, ACTIVE, SUPERSEDED, ARCHIVED |
| supersededById | Long | No | FK to the ComplianceStandard that replaced this one |
| isPreSeeded | Boolean | Yes | Default false; true for deployment-time seed data |
| createdBy | String | Yes | Username |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**Uniqueness constraint:** (`name`, `regulationNumber`, `version`) must be unique.

**ParameterGroup**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| standardId | Long | Yes | FK to ComplianceStandard |
| name | String (255) | Yes | Group name (e.g., "Physical Parameters") |
| description | String (1024) | No | Optional description |
| sortOrder | Integer | Yes | Display order within the standard |

**Uniqueness constraint:** (`standardId`, `name`) must be unique.

**ComplianceThreshold**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| testId | Long | Yes | FK to Test (test catalog entity) |
| standardId | Long | Yes | FK to ComplianceStandard |
| parameterGroupId | Long | Yes | FK to ParameterGroup |
| thresholdType | Enum | Yes | MAX, MIN, RANGE, DESCRIPTIVE |
| valueLower | Double | No | Required for MIN, RANGE |
| valueUpper | Double | No | Required for MAX, RANGE |
| valueDescriptive | String (1024) | No | Required for DESCRIPTIVE |
| unit | String (100) | No | Overrides test's default unit if different |
| notes | String (1024) | No | Regulatory notes or methodology reference |
| isActive | Boolean | Yes | Default true; false = archived threshold |
| createdBy | String | Yes | Username |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**Uniqueness constraint:** (`testId`, `standardId`, `parameterGroupId`) must be unique — one threshold per test per standard per group.

**ComplianceImportLog**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| fileName | String (255) | Yes | Original filename |
| importType | Enum | Yes | CSV_UPLOAD, SEED_FILE |
| standardsCreated | Integer | Yes | Count of new standards |
| standardsUpdated | Integer | Yes | Count of updated standards |
| groupsCreated | Integer | Yes | Count of new parameter groups |
| thresholdsCreated | Integer | Yes | Count of new thresholds |
| rowsSkipped | Integer | Yes | Count of error rows skipped |
| importedBy | String | Yes | Username (or "SYSTEM" for seed files) |
| importedAt | Timestamp | Yes | — |
| importData | Text | No | Full CSV content for audit trail |

### System Configuration Settings (new keys)

| Config Key | Type | Default | Description |
|---|---|---|---|
| `compliance.seed.directory` | String | `/data/compliance-standards/` | Filesystem path scanned for seed CSV files at startup |

### Modified Entities

**Test** — No structural changes. ComplianceThreshold links to Test via FK. The existing Test entity gains compliance thresholds through the new ComplianceThreshold join, not through new columns on Test itself.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance-standards` | List standards (filterable, paginated) | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}` | Get standard with parameter groups | `compliance.standard.view` |
| POST | `/api/v1/compliance-standards` | Create standard | `compliance.standard.add` |
| PUT | `/api/v1/compliance-standards/{id}` | Update standard | `compliance.standard.modify` |
| DELETE | `/api/v1/compliance-standards/{id}` | Deactivate (archive) standard | `compliance.standard.delete` |
| POST | `/api/v1/compliance-standards/{id}/copy` | Copy standard as new Draft | `compliance.standard.add` |
| GET | `/api/v1/compliance-standards/{id}/parameter-groups` | List parameter groups | `compliance.standard.view` |
| POST | `/api/v1/compliance-standards/{id}/parameter-groups` | Add parameter group | `compliance.standard.modify` |
| PUT | `/api/v1/compliance-standards/{id}/parameter-groups/{gid}` | Update parameter group | `compliance.standard.modify` |
| DELETE | `/api/v1/compliance-standards/{id}/parameter-groups/{gid}` | Remove parameter group | `compliance.standard.modify` |
| GET | `/api/v1/compliance-standards/{id}/linked-tests` | Tests with thresholds for this standard | `compliance.standard.view` |
| GET | `/api/v1/tests/{testId}/compliance-thresholds` | List thresholds for a test | `compliance.threshold.view` |
| POST | `/api/v1/tests/{testId}/compliance-thresholds` | Add threshold to test | `compliance.threshold.modify` |
| PUT | `/api/v1/tests/{testId}/compliance-thresholds/{tid}` | Update threshold | `compliance.threshold.modify` |
| DELETE | `/api/v1/tests/{testId}/compliance-thresholds/{tid}` | Remove/archive threshold | `compliance.threshold.modify` |
| POST | `/api/v1/compliance-standards/import` | Import from CSV (multipart) | `compliance.standard.import` |
| GET | `/api/v1/compliance-standards/import/template` | Download CSV template | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/import/log` | List import history | `compliance.standard.import` |
| GET | `/api/v1/compliance-standards/for-sample-type/{sampleType}` | Standards applicable to a sample type | `compliance.standard.view` |

---

## 7. UI Design

See companion React mockup: `S01-compliance-standards-mockup.jsx`

### Navigation Path

Admin → Test Management → Compliance Standards (for standards CRUD)
Admin → Test Management → Test Catalog → [Test Editor] → Compliance tab (vertical tab sidebar, per-test thresholds)

### Key Screens

1. **Compliance Standards List** (Admin → Test Management → Compliance Standards) — DataTable listing all standards with search, filter, and status tags. Inline row expansion for add/edit forms. Accordion for parameter groups within the expanded row. "Import from CSV" button in toolbar. Pre-seeded records show teal "Default" tag.

2. **Compliance Tab** (Test Catalog → [Test Editor] → Compliance) — New vertical tab in the Test Editor sidebar under a "Compliance" section group (after the Automation group). Uses the same vertical tab sidebar layout as all other test editor tabs (Configuration, Organization, Resources, Automation groups). Contains a DataTable of thresholds grouped by standard or parameter group. Inline row expansion for add/edit. Threshold type shown as colored Tag. Uses Shield/CheckCircle icon consistent with the compliance domain.

3. **CSV Import Modal** — Modal with FileUploader, template download link, scope selector, and preview table. Opened from the Standards list page toolbar.

4. **Linked Tests Panel** — Read-only expandable panel showing tests organized by parameter group for a given standard.

### Interaction Patterns

- **Inline row expansion** for standard add/edit forms and threshold add/edit forms (not modals)
- **Accordion** for parameter groups within the standard expansion row
- **Modal** for CSV import (multi-step with file upload + preview — exceeds inline scope) and destructive archive confirmation
- **Vertical tab sidebar** on test catalog editor (existing pattern — adds new "Compliance" tab to the sidebar alongside Basic Info, Ranges, Methods, Alerts, etc.)
- **"Group by" toggle** on thresholds table for standard vs. parameter group view
- **ComboBox with type-ahead** for standard selection and test search

---

## 8. Business Rules

**BR-001:** A ComplianceStandard with status DRAFT cannot be selected during sample registration. Only ACTIVE standards appear in registration dropdowns.

**BR-002:** A ComplianceStandard cannot be deleted if any ComplianceThreshold references it. It can only be archived (status → ARCHIVED).

**BR-003:** A ParameterGroup cannot be deleted if any ComplianceThreshold references it. The system SHALL display an inline error notification identifying the linked thresholds.

**BR-004:** When a standard's status transitions from ACTIVE to SUPERSEDED, the system SHALL prompt the administrator to select the replacement standard. The `supersededById` field is set, and a link is shown on the old standard.

**BR-005:** The (`testId`, `standardId`, `parameterGroupId`) combination must be unique per ComplianceThreshold. A test cannot have two different thresholds for the same parameter in the same standard.

**BR-006:** For threshold type MAX: `valueUpper` is required; `valueLower` and `valueDescriptive` must be null. For MIN: `valueLower` is required. For RANGE: both `valueLower` and `valueUpper` are required, and `valueLower` < `valueUpper`. For DESCRIPTIVE: `valueDescriptive` is required; numeric values must be null.

**BR-007:** Pre-seeded standards (`isPreSeeded = true`) cannot be deleted. The delete button is hidden in the UI and the API returns HTTP 403.

**BR-008:** Seed file loading is idempotent: standards already present in the database (matched by `name` + `regulationNumber`) are skipped. This preserves administrator customizations across restarts.

**BR-009:** CSV import matches tests by LOINC code first (if provided), then by exact name. Ambiguous matches are flagged as errors.

**BR-010:** Results evaluated against a compliance standard store the `standardId` and `version` at evaluation time. Subsequent changes to the standard or its thresholds do NOT retroactively affect previously evaluated results.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `label.complianceStandard.title` | Compliance Standards |
| `label.complianceStandard.name` | Standard Name |
| `label.complianceStandard.issuingBody` | Issuing Body |
| `label.complianceStandard.regulationNumber` | Regulation Number |
| `label.complianceStandard.description` | Description |
| `label.complianceStandard.version` | Version |
| `label.complianceStandard.effectiveDate` | Effective Date |
| `label.complianceStandard.expiryDate` | Expiry Date |
| `label.complianceStandard.countryRegion` | Country / Region |
| `label.complianceStandard.sampleTypes` | Applicable Sample Types |
| `label.complianceStandard.status` | Status |
| `label.complianceStandard.linkedTests` | Linked Tests |
| `label.complianceStandard.parameterGroups` | Parameter Groups |
| `label.complianceStandard.preSeeded` | Default |
| `label.complianceThreshold.title` | Compliance Thresholds |
| `label.complianceThreshold.standard` | Standard |
| `label.complianceThreshold.parameterGroup` | Parameter Group |
| `label.complianceThreshold.thresholdType` | Threshold Type |
| `label.complianceThreshold.thresholdType.max` | Max ≤ |
| `label.complianceThreshold.thresholdType.min` | Min ≥ |
| `label.complianceThreshold.thresholdType.range` | Range |
| `label.complianceThreshold.thresholdType.descriptive` | Qualitative |
| `label.complianceThreshold.valueLower` | Lower Value |
| `label.complianceThreshold.valueUpper` | Upper Value |
| `label.complianceThreshold.valueDescriptive` | Descriptive Value |
| `label.complianceThreshold.unit` | Unit |
| `label.complianceThreshold.notes` | Notes |
| `label.complianceThreshold.groupBy` | Group by |
| `label.complianceThreshold.groupBy.standard` | Standard |
| `label.complianceThreshold.groupBy.parameterGroup` | Parameter Group |
| `placeholder.complianceStandard.search` | Search by name, issuing body, or regulation number... |
| `placeholder.complianceStandard.selectStandard` | Select a compliance standard... |
| `placeholder.complianceThreshold.selectTest` | Search for a test... |
| `button.complianceStandard.add` | Add Standard |
| `button.complianceStandard.edit` | Edit |
| `button.complianceStandard.archive` | Archive |
| `button.complianceStandard.copy` | Copy Standard |
| `button.complianceStandard.import` | Import from CSV |
| `button.complianceStandard.downloadTemplate` | Download Template |
| `button.complianceStandard.viewLinkedTests` | View Linked Tests |
| `button.complianceStandard.linkTest` | Link Test |
| `button.complianceThreshold.add` | Add Threshold |
| `button.complianceThreshold.edit` | Edit |
| `button.complianceThreshold.remove` | Remove |
| `button.complianceStandard.save` | Save |
| `button.complianceStandard.cancel` | Cancel |
| `button.complianceStandard.uploadPreview` | Upload & Preview |
| `button.complianceStandard.importConfirm` | Import |
| `button.complianceStandard.skipErrors` | Skip error rows |
| `message.complianceStandard.saveSuccess` | Compliance standard saved successfully. |
| `message.complianceStandard.archiveSuccess` | Compliance standard archived. |
| `message.complianceStandard.copySuccess` | Standard copied as new Draft. |
| `message.complianceStandard.importSuccess` | Import complete: {0} standards, {1} groups, {2} thresholds created. |
| `message.complianceStandard.archiveConfirm` | Are you sure you want to archive this compliance standard? Existing evaluated results will not be affected. |
| `message.complianceStandard.supersededBanner` | This standard has been superseded by {0} (Version {1}) effective {2}. |
| `message.complianceThreshold.inactiveStandardWarning` | This test has thresholds linked to {0} which is now {1}. Results will no longer be evaluated against this standard. |
| `message.complianceThreshold.saveSuccess` | Compliance threshold saved successfully. |
| `message.complianceThreshold.removeSuccess` | Compliance threshold removed. |
| `message.complianceThreshold.removeConfirm` | Are you sure you want to remove this threshold? |
| `message.complianceThreshold.archiveInstead` | This threshold has been used in evaluations and cannot be deleted. It will be deactivated instead. |
| `error.complianceStandard.required` | This field is required. |
| `error.complianceStandard.duplicate` | A standard with this name, regulation number, and version already exists. |
| `error.complianceStandard.cannotDeletePreSeeded` | Pre-seeded standards cannot be deleted. Use Archive instead. |
| `error.complianceStandard.cannotDeleteWithThresholds` | This standard has linked thresholds and cannot be deleted. |
| `error.complianceThreshold.duplicate` | A threshold for this test, standard, and parameter group already exists. |
| `error.complianceThreshold.invalidRange` | Lower value must be less than upper value. |
| `error.complianceStandard.importTestNotFound` | Test not found in catalog: {0} |
| `error.complianceStandard.importTestAmbiguous` | Multiple tests match: {0} |
| `error.complianceStandard.importFileTooLarge` | File exceeds maximum size of 5MB. |
| `error.complianceStandard.importInvalidFormat` | Invalid CSV format. Download the template for the expected column layout. |
| `heading.complianceStandard.list` | Compliance Standards |
| `heading.complianceStandard.addNew` | Add New Compliance Standard |
| `heading.complianceStandard.edit` | Edit Compliance Standard |
| `heading.complianceStandard.import` | Import Compliance Standards from CSV |
| `heading.complianceStandard.importPreview` | Import Preview |
| `heading.complianceThreshold.addNew` | Add Compliance Threshold |
| `heading.complianceThreshold.edit` | Edit Compliance Threshold |
| `nav.complianceStandard` | Compliance Standards |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| ComplianceStandard.name | Required, max 255 chars | `error.complianceStandard.required` |
| ComplianceStandard.issuingBody | Required, max 255 chars | `error.complianceStandard.required` |
| ComplianceStandard.regulationNumber | Required, max 255 chars | `error.complianceStandard.required` |
| ComplianceStandard.version | Required, max 100 chars | `error.complianceStandard.required` |
| ComplianceStandard.effectiveDate | Required, valid date | `error.complianceStandard.required` |
| ComplianceStandard.countryRegion | Required | `error.complianceStandard.required` |
| ComplianceStandard.applicableSampleTypes | Required, at least one | `error.complianceStandard.required` |
| ComplianceStandard (name+regNum+version) | Unique combination | `error.complianceStandard.duplicate` |
| ComplianceThreshold (testId+stdId+groupId) | Unique combination | `error.complianceThreshold.duplicate` |
| ComplianceThreshold (RANGE) | valueLower < valueUpper | `error.complianceThreshold.invalidRange` |
| ComplianceThreshold (MAX) | valueUpper required, numeric | `error.complianceStandard.required` |
| ComplianceThreshold (MIN) | valueLower required, numeric | `error.complianceStandard.required` |
| ComplianceThreshold (DESCRIPTIVE) | valueDescriptive required | `error.complianceStandard.required` |
| ParameterGroup.name | Required, unique per standard | `error.complianceStandard.required` |
| CSV file | Max 5MB, .csv extension | `error.complianceStandard.importFileTooLarge` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View standards list | `compliance.standard.view` | Page not shown in admin menu |
| Add standard | `compliance.standard.add` | "Add Standard" button hidden |
| Edit standard | `compliance.standard.modify` | Edit button hidden; API returns 403 |
| Archive standard | `compliance.standard.delete` | Archive button hidden; API returns 403 |
| Import from CSV | `compliance.standard.import` | "Import from CSV" button hidden; API returns 403 |
| View thresholds tab | `compliance.threshold.view` | Tab not rendered on test detail page |
| Add/edit threshold | `compliance.threshold.modify` | Add/Edit buttons hidden; API returns 403 |
| Remove threshold | `compliance.threshold.modify` | Remove button hidden; API returns 403 |
| Delete pre-seeded standard | N/A — always prohibited | Delete action hidden; API returns 403 with error key |

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `compliance.standard.view` can access the Compliance Standards page from Admin → Test Management
- [ ] User can create a new compliance standard with all required fields and sees a success notification
- [ ] User can edit an existing standard via inline row expansion
- [ ] User can add, edit, reorder, and remove parameter groups within a standard
- [ ] User can archive a standard and the status tag updates to "Archived"
- [ ] Archived standards are excluded from registration-time selection dropdowns
- [ ] User can copy a standard, producing a new Draft with all groups and threshold configurations
- [ ] Superseded standards display a banner with a link to the replacement standard
- [ ] The Compliance tab appears in the Test Editor vertical tab sidebar under a Compliance section group
- [ ] User can add a threshold with type Max, Min, Range, or Descriptive
- [ ] Threshold type-specific fields appear/hide correctly based on selection
- [ ] Duplicate threshold (same test + standard + group) is rejected with an error message
- [ ] Range validation enforces lower < upper
- [ ] "View Linked Tests" shows all tests with thresholds for a given standard
- [ ] Standard selection auto-suggests a test panel during registration (verified via S-02 integration)
- [ ] CSV import: user can download the template
- [ ] CSV import: upload parses and displays a preview with match status per row
- [ ] CSV import: errors are highlighted and import is blocked (unless "Skip error rows" is checked)
- [ ] CSV import: successful import creates standards, groups, and thresholds; success notification shows counts
- [ ] CSV import: test matching works by LOINC code first, then by name
- [ ] CSV import: existing standards are updated (not duplicated) on re-import

### Deployment-Time Seeding

- [ ] On fresh installation, CSV files in `/data/compliance-standards/` are loaded automatically
- [ ] Pre-seeded standards display a teal "Default" tag in the admin list
- [ ] Pre-seeded standards cannot be deleted (button hidden, API returns 403)
- [ ] Pre-seeded standards can be edited (name, groups, thresholds)
- [ ] Seed loading is idempotent: restarting the application does not duplicate existing standards
- [ ] Seed loading errors are logged but do not prevent application startup
- [ ] The default `baku-mutu-pp22-2021-water.csv` seed file loads correctly on Indonesian deployments

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Standards list page loads within 2 seconds with 50+ standards
- [ ] CSV import handles files with 500+ rows within 10 seconds
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Feature tested with Indonesian (`id`) and French (`fr`) language files
- [ ] All status indicators use Carbon Tag with correct semantic kinds

### Integration

- [ ] Compliance Evaluation Engine (S-05) can query thresholds by standard + test
- [ ] Non-Patient Registration (S-02) can list active standards filtered by sample type
- [ ] Results page displays compliance status tags based on threshold evaluation
- [ ] Version-lock: evaluated results store standard version and are not retroactively affected by standard changes
- [ ] Audit trail records all standard modifications, threshold changes, and CSV imports
