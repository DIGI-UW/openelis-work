# Environmental Order Entry Integration
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-03
**Status:** Draft for Review
**Jira:** [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Sample Collection Redesign (ORD-2, ORD-3, ORD-7, ORD-10, COL-3, DSH-1–9, QA-1–6), Compliance Standards Administration (S-01, OGC-528), Sampling Site Registry (S-02, OGC-531), Test Catalog (OGC-49)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
   - 5.1 Compliance Standard Selection (Step 1 — Enter Order)
   - 5.2 Sample Type Selection & Test Panel Auto-Suggestion
   - 5.3 Collection Conditions (Configurable per Program)
   - 5.4 Regulatory Reference Field
   - 5.5 Site Metadata Auto-Population
   - 5.6 Standard Persistence Through Workflow
   - 5.7 Dashboard Extensions for Environmental Orders
   - 5.8 QA Review Environmental Completeness
   - 5.9 Reporting Data Requirements
6. Data Model
7. API Endpoints
8. Navigation & Screen Inventory
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria

---

## 1. Executive Summary

S-03 is the integration specification that connects the three foundational environmental/vector modules — compliance standards administration (S-01), sampling site registry (S-02), and the sample collection redesign — into a cohesive environmental order entry workflow. While each predecessor spec defines its own domain (standards, sites, order steps), none specifies how they interact during the act of entering an environmental order.

This spec closes those integration gaps: compliance standard selection at order time with test panel auto-suggestion, configurable collection conditions per environmental program, auto-populated regulatory reference, site metadata pre-filling, standard persistence through all four workflow steps, dashboard search/filter extensions for environmental orders, QA completeness checks for environmental-specific fields, and the reporting data contract needed for downstream Laporan Hasil (compliance report) generation.

S-03 does **not** introduce new pages or navigation items. It extends the existing Enter Order step (Step 1) environmental section, adds read-only environmental context to Steps 2–4, and augments the order dashboard and QA review.

---

## 2. Problem Statement

**Current state:** The sample collection redesign defines a workflow toggle (Clinical / Environmental) that shows or hides field sections, and references S-02 for site search/create. However, several critical integration points remain unspecified:

- There is no UI field for selecting a compliance standard during environmental order entry, despite S-01 defining the standards infrastructure and FR-4-001 referencing "standard selection during registration."
- The "environmental conditions" and "regulatory reference" fields mentioned in ORD-2 and COL-3 are named but never defined — no field types, no validation, no data model.
- The selected compliance standard does not flow through the 4-step workflow, so Steps 2–4 and the QA review have no compliance context.
- The order dashboard search and filters are clinical-centric (patient name, lab number) with no support for site-based search or compliance standard filtering.
- QA completeness checks do not verify environmental-specific data (GPS, conditions, site linkage, standard selection).

**Impact:** Without these integration points, an environmental lab using OpenELIS cannot enter a compliant order — they must manually track which standard applies, which tests are required, and whether collection conditions were recorded. This defeats the purpose of the environmental workflow toggle and leaves S-01 and S-02 as isolated admin features with no operational connection to the order workflow.

**Proposed solution:** Extend the Enter Order environmental section with a compliance standard ComboBox (after site selection, before test selection) that auto-suggests the test panel for the selected standard. Define collection conditions as configurable fields per environmental program (leveraging the existing Program infrastructure from ORD-10). Auto-populate the regulatory reference from the selected standard. Persist the standard in the order context card across all 4 steps. Extend the dashboard with site and standard search/filter. Add environmental completeness checks to QA review. Define the reporting data contract for Laporan Hasil.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Enable end-to-end environmental order entry** — From site selection through compliance standard selection, test panel suggestion, collection conditions, and QA review, with no manual steps outside the system.
2. **Connect S-01 and S-02 to the order workflow** — The compliance standard selected at order time drives test panel suggestions and flows through to results validation and reporting.
3. **Define collection conditions as structured data** — Configurable per environmental program, replacing the undefined "environmental conditions" placeholder in ORD-2/COL-3.
4. **Support environmental order discovery** — Dashboard search by site code/name and filter by compliance standard, so environmental orders are findable without knowing a patient name.
5. **Enable QA verification of environmental data** — QA review checks for GPS, conditions, site linkage, and standard selection completeness.
6. **Provide the data contract for Laporan Hasil** — Define which order-time data fields are required for downstream compliance reporting.

### 3.2 Non-Goals

1. **Compliance evaluation engine** — S-05 will define the logic for evaluating test results against compliance thresholds. S-03 defines only the data that flows *into* that engine (selected standard, thresholds).
2. **New pages or navigation changes** — S-03 extends existing screens, not new ones.
3. **Clinical workflow changes** — Nothing in S-03 affects clinical order entry behavior.
4. **Test catalog configuration** — Environmental sample types (water, air, soil, vector specimens) are configured in the existing test catalog as standard sample types. S-03 consumes these sample types at order time (via the standard's `applicableSampleTypes` and the full system sample type list for overrides) but does not define new sample type infrastructure.
5. **Compliance standard administration** — Fully covered by S-01. S-03 only consumes standards at order time.
6. **Site registry administration** — Fully covered by S-02. S-03 only consumes sites at order time.

---

## 4. User Roles & Permissions

S-03 does not introduce new permission keys. It reuses permissions from the parent specs:

| Role | Enter Order (Env) | Standard Selection | Collection Conditions | QA Review (Env) |
|---|---|---|---|---|
| Lab Technician / Clerk | Full (via existing order permissions) | Select from active standards | Enter/edit conditions | View only |
| Environmental Sample Collector | View + Collect | View selected standard | Enter/edit conditions | None |
| Lab Manager | Full | Select + view | View | Full |
| QA Officer | View | View selected standard | View | Full (approve/reject) |
| System Administrator | Full | Full | Full | Full |

**Referenced permission keys:**

From Sample Collection Redesign:
- `order.enter` — Create/edit orders in Step 1
- `order.collect` — Record sample collection in Step 2
- `order.qa` — Approve/reject in Step 4

From S-01 (Compliance Standards):
- `compliance.standard.view` — View and select standards during order entry
- `compliance.threshold.view` — View thresholds for auto-suggestion

From S-02 (Site Registry):
- `site.registry.view` — Search and select sites during order entry
- `site.registry.create` — Create new site inline during order entry

---

## 5. Functional Requirements

### 5.1 Compliance Standard Selection (Step 1 — Enter Order)

**ID:** ENV-1-001
**Priority:** P0
**Requirement:**
When the workflow toggle is set to Environmental (or the lab unit is Environmental-only), the Enter Order form SHALL display a **Compliance Standard** section between the Sampling Site selection (S-02) and the Test/Panel selection (ORD-7). The section contains:

- **Section header:** "Compliance Standard" with an info tooltip: "Select the regulatory standard for this order. This determines which tests and thresholds apply."
- **Standard ComboBox** (required for environmental orders): Typeahead search filtered to ACTIVE compliance standards only (per S-01 BR-001). ComboBox items display: Standard Name, Issuing Body, Regulation Number, and a Status Tag (green for Active). When the lab unit has a default environmental program (ORD-10), and that program is associated with a specific compliance standard, the ComboBox SHALL be pre-populated with that standard. The user can change or clear it.
- **Selected Standard Card** (read-only, appears after selection): Displays standard name, issuing body, regulation number, version, effective date, and a count of linked tests. Card uses a Carbon `Tile` with a blue left border (`--cds-blue-60`).
- **"View Thresholds" link** on the card: Opens a read-only accordion showing all parameter groups and their threshold values for the selected standard. Does not navigate away from the order form.

**Acceptance Criteria:**
- [ ] ComboBox appears only in Environmental workflow mode
- [ ] ComboBox is filtered to ACTIVE standards only (DRAFT, SUPERSEDED, ARCHIVED excluded)
- [ ] Typeahead filters by name, issuing body, or regulation number
- [ ] Selecting a standard shows the Selected Standard Card
- [ ] Card displays name, issuing body, regulation number, version, effective date, linked test count
- [ ] "View Thresholds" opens inline accordion without page navigation
- [ ] Default program standard pre-populates the ComboBox when configured
- [ ] Clearing the ComboBox removes the card and clears the auto-suggested tests (with confirmation if tests were modified)
- [ ] Standard selection is required — form cannot be submitted without a standard in Environmental mode

---

**ID:** ENV-1-002
**Priority:** P1
**Requirement:**
The Compliance Standard ComboBox SHALL support filtering by the selected site's sample-type affinity. If the selected sampling site (from S-02) has a site type of WATER_SOURCE, the standard list SHALL prioritize (but not exclusively filter) standards whose `applicableSampleTypes` include water-related sample types. A "Show All Standards" toggle below the ComboBox allows the user to override this prioritization and see all active standards.

**Acceptance Criteria:**
- [ ] Standards matching the site type appear first in the dropdown
- [ ] Non-matching standards still appear below a divider
- [ ] "Show All Standards" toggle removes prioritization
- [ ] Prioritization updates when the selected site changes

---

### 5.2 Sample Type Selection & Test Panel Auto-Suggestion

**ID:** ENV-2-001
**Priority:** P0
**Requirement:**
When a compliance standard is selected (ENV-1-001), the system SHALL display a **Sample Type Selection** section between the Standard Card and the Test/Panel selection area. This section presents the standard's `applicableSampleTypes` (from S-01) as a **checkbox list**, allowing the technician to check off which sample types they physically have available. The section contains:

- **Section header:** "Select Available Samples" with helper text: "Check the sample types you have collected for this order. Tests will be suggested based on your selections."
- **Checkbox list:** One checkbox per sample type in the standard's `applicableSampleTypes` array. Each row displays: sample type name, sample type code (in secondary text). All checkboxes unchecked by default.
- **"Add Other Sample Type" button** (kind="ghost", icon=Add): Opens a **ComboBox overlay** that lists **all sample types in the system** (not just those on the standard), including an "Other" option. This allows the technician to add a sample type that is outside the selected regulation. When an override sample type is added, it appears in the checklist with a Tag (kind="purple") reading "Not in Standard" and a warning tooltip: "This sample type is not listed under the selected compliance standard."
- **Count indicator:** Below the checklist: "{N} sample types selected"

When at least one sample type is selected, the system SHALL auto-populate the Test/Panel selection area (ORD-7) with a **suggested test panel** filtered to tests that: (a) have at least one active ComplianceThreshold linked to the selected standard (per S-01 FR-4-001), AND (b) are applicable to at least one of the selected sample types. The suggestion is presented as:

- An `InlineNotification` (kind="info") above the test selection: "Based on [Standard Name] and [N] selected sample types, [M] tests have been suggested."
- Each suggested test appears pre-selected in the test panel selector with a Tag indicating "Suggested" (kind="blue").
- The user can deselect suggested tests, add additional tests not linked to the standard, or clear all suggestions.

**Step 2 Auto-Population:** The sample types selected in Step 1 SHALL auto-populate the sample type field(s) in Step 2 — Collect Sample, eliminating the need for redundant sample type selection. If all sample information has been captured in Step 1, the sample type selection portion of Step 2 is pre-filled and the technician only needs to confirm or adjust.

**Acceptance Criteria:**
- [ ] Selecting a standard displays the sample type checkbox list from the standard's `applicableSampleTypes`
- [ ] Technician can check/uncheck individual sample types
- [ ] "Add Other Sample Type" button opens a ComboBox with all system sample types + "Other"
- [ ] Override sample types display "Not in Standard" tag with purple color
- [ ] Count indicator updates as checkboxes change
- [ ] Selecting sample types triggers test auto-suggestion filtered by both standard and selected types
- [ ] Suggested tests are pre-selected in the test panel selector
- [ ] "Suggested" tag distinguishes auto-suggested tests from manually added ones
- [ ] InlineNotification shows standard name, sample type count, and suggested test count
- [ ] User can deselect individual suggested tests
- [ ] User can add tests not linked to the standard
- [ ] Changing the standard clears sample type selections and re-populates from new standard's `applicableSampleTypes` (with confirmation if user modified the list)
- [ ] If the selected standard has no linked tests for the selected sample types, an InlineNotification (kind="warning") displays: "No tests are linked to this standard for the selected sample types. Please add tests manually or contact your administrator."
- [ ] Selected sample types auto-populate Step 2 sample type fields, skipping redundant selection

---

**ID:** ENV-2-002
**Priority:** P1
**Requirement:**
The suggested test panel SHALL be organized by Parameter Group (as defined in S-01). Each group appears as a collapsible section header in the test selector, with its member tests listed below. Groups follow the sort order defined in the standard's configuration.

**Acceptance Criteria:**
- [ ] Tests are grouped by Parameter Group name
- [ ] Groups are collapsible (Accordion pattern)
- [ ] Group sort order matches the standard's configuration
- [ ] Tests within a group are sorted alphabetically by test name
- [ ] Group header shows count of selected vs. total tests in group

---

### 5.3 Collection Conditions (Configurable per Program)

**ID:** ENV-3-001
**Priority:** P0
**Requirement:**
The "Collection Conditions" sub-section in the Environmental order entry (referenced in ORD-2) SHALL display a set of structured fields that are **configurable per environmental program** (leveraging the existing Program infrastructure from ORD-10). When a program is selected, the collection conditions fields for that program are loaded dynamically.

The **default field set** for environmental programs (used when no program-specific configuration exists) includes:

| Field | Type | Required | Notes |
|---|---|---|---|
| Water Temperature | NumberInput (°C) | No | Shown for water-related programs |
| Ambient Temperature | NumberInput (°C) | No | Shown for all environmental programs |
| Weather Conditions | Select | No | Options: Clear, Cloudy, Rain, Storm, Wind, Other |
| Collection Method | Select | Yes | Options: Manual Grab, Composite (Time), Composite (Flow), Automated Sampler, Passive, Trap Collection, Other |
| Preservation Method | TextInput | No | Free-text (e.g., "HNO3 acidification", "4°C cooler") |
| Field Notes | TextArea | No | Free-text, max 1000 chars |

Administrators can configure per-program field sets via the Program configuration in Admin settings (extending the existing "Additional Order Information" pattern from ORD-10). Fields can be added, removed, reordered, and marked as required or optional per program.

**Acceptance Criteria:**
- [ ] Collection Conditions section appears below the site and standard selections in Environmental mode
- [ ] Fields load dynamically based on the selected program
- [ ] Default field set renders when no program-specific config exists
- [ ] Collection Method is required; other fields optional by default
- [ ] Admin can configure per-program field sets (add/remove/reorder/required toggle)
- [ ] Fields save to the order entity and are retrievable in Steps 2–4
- [ ] Validation errors display using Carbon `invalidText` props

---

**ID:** ENV-3-002
**Priority:** P0
**Requirement:**
The Collection Conditions fields SHALL also be available on **Step 2 — Collect Sample** (extending COL-3) for environmental orders. If conditions were entered in Step 1, they are pre-populated and editable. If Step 1 was skipped (order started at Step 2), the full conditions form appears blank. GPS capture (manual entry or device geolocation per COL-3) appears within this section.

Additionally, **sample types selected in Step 1** (ENV-2-001) SHALL auto-populate the sample type field(s) in Step 2. This eliminates redundant sample type selection — the technician sees their Step 1 selections pre-filled and can confirm or adjust. If sample types were fully specified in Step 1, the sample type portion of Step 2 requires no further input.

**Acceptance Criteria:**
- [ ] Collection conditions from Step 1 carry forward to Step 2
- [ ] Sample types from Step 1 auto-populate Step 2 sample type fields
- [ ] Pre-populated sample types are editable on Step 2
- [ ] Conditions are editable on Step 2
- [ ] GPS capture appears within the collection conditions section
- [ ] If no Step 1 conditions exist, fields appear blank on Step 2
- [ ] Save on Step 2 updates the same data as Step 1 conditions

---

### 5.4 Regulatory Reference Field

**ID:** ENV-4-001
**Priority:** P0
**Requirement:**
The Collection Conditions section SHALL include a **Regulatory Reference** field that is:

- **Auto-populated** when a compliance standard is selected (ENV-1-001): displays the standard's name and regulation number (e.g., "PP No. 22/2021 — Baku Mutu Air Permukaan").
- **Read-only** when auto-populated from a standard, with a lock icon and tooltip: "Auto-populated from selected compliance standard."
- **Editable** when no compliance standard is selected, or when the user clicks an "Override" link next to the field. Override clears the auto-populated value and enables free-text entry.
- **Saved** with the order regardless of source (auto-populated or manual).

**Acceptance Criteria:**
- [ ] Field auto-populates when standard is selected
- [ ] Field is read-only with lock icon when auto-populated
- [ ] "Override" link enables manual editing
- [ ] Override clears the auto-populated value
- [ ] Field is freely editable when no standard is selected
- [ ] Value persists across all 4 workflow steps
- [ ] i18n key used for label and placeholder

---

### 5.5 Site Metadata Auto-Population

**ID:** ENV-5-001
**Priority:** P1
**Requirement:**
When a sampling site is selected in the Enter Order environmental section (per S-02 FR-5.3.1), the system SHALL auto-populate the following downstream fields from the site's metadata:

| Site Field | Target Field | Behavior |
|---|---|---|
| GPS coordinates (lat/lng) | Collection GPS (COL-3) | Pre-populated in Step 2; editable (collector may be at a different point within the site) |
| Environmental Zone | Collection Conditions → Zone | Pre-populated; editable |
| Site Type | Standard ComboBox prioritization | Used to prioritize matching standards (ENV-1-002) |
| Total Collections count | Selected Site Card | Displayed for reference ("47 previous collections") |
| Last Collection Date | Selected Site Card | Displayed for reference |

**Acceptance Criteria:**
- [ ] GPS from site pre-fills Step 2 collection GPS
- [ ] Environmental zone from site pre-fills collection conditions
- [ ] Site type drives standard ComboBox prioritization
- [ ] Collection history displayed on the Selected Site Card
- [ ] All pre-populated fields are editable by the user
- [ ] Changing the selected site re-triggers auto-population (with confirmation if fields were manually modified)

---

### 5.6 Standard Persistence Through Workflow

**ID:** ENV-6-001
**Priority:** P0
**Requirement:**
The compliance standard selected in Step 1 SHALL be persisted with the order entity and displayed as a **read-only field in the Order Context Card** on all subsequent steps (Collect Sample, Label & Store, QA Review). The context card displays:

- Standard name and regulation number
- Standard status Tag (green "Active")
- A "View Thresholds" link (same behavior as ENV-1-001)

The standard is **not editable** on Steps 2–4. To change the standard, the user must return to Step 1.

**Acceptance Criteria:**
- [ ] Standard name and regulation number appear in the order context card on Steps 2, 3, and 4
- [ ] Status tag renders correctly
- [ ] "View Thresholds" link works on all steps
- [ ] Standard is read-only on Steps 2–4
- [ ] Standard is editable only on Step 1
- [ ] If no standard was selected (clinical order), the standard line does not appear in the context card

---

**ID:** ENV-6-002
**Priority:** P0
**Requirement:**
The compliance standard ID and version SHALL be stored with the order entity for downstream use by the Compliance Evaluation Engine (S-05). When results are entered for tests linked to the selected standard, the evaluation engine uses the stored standard ID and version to look up applicable thresholds — not the current live standard (which may have been updated since order entry). This ensures result evaluation is consistent with the standard in effect at order time.

**Acceptance Criteria:**
- [ ] `complianceStandardId` and `complianceStandardVersion` stored on the Order entity
- [ ] Values set at order creation time and immutable thereafter (except via Step 1 edit)
- [ ] If the standard is superseded after order entry, the order retains the original version
- [ ] API returns standard ID and version in order detail responses

---

### 5.7 Dashboard Extensions for Environmental Orders

**ID:** ENV-7-001
**Priority:** P1
**Requirement:**
The Order Dashboard search bar (DSH-2) SHALL be extended to support search by **site code** and **site name** in addition to the existing patient name, lab number, national ID, and referring lab number. Site-based search is active regardless of workflow toggle — it simply returns no results for clinical-only orders.

**Acceptance Criteria:**
- [ ] Typing a site code (e.g., "WS-001") in the search bar returns matching environmental orders
- [ ] Typing a site name (e.g., "Ciliwung") returns matching environmental orders
- [ ] Search works across both site code and site name fields
- [ ] Clinical orders are not affected (they have no site)
- [ ] Search is case-insensitive

---

**ID:** ENV-7-002
**Priority:** P1
**Requirement:**
The Order Dashboard filter dropdowns (DSH-7) SHALL be extended with a **Compliance Standard** filter. The filter is a ComboBox showing all ACTIVE compliance standards. Selecting a standard filters the dashboard to orders associated with that standard. The filter combines with existing filters (Status, Date Range, Priority) via AND logic.

**Acceptance Criteria:**
- [ ] Compliance Standard filter ComboBox appears alongside existing filters
- [ ] Only ACTIVE standards shown in the filter
- [ ] Selecting a standard filters the order table
- [ ] Filter combines with other filters via AND
- [ ] Clearing the filter shows all orders

---

**ID:** ENV-7-003
**Priority:** P1
**Requirement:**
Environmental orders in the dashboard table (DSH-4) SHALL display the **Site Code** in the Patient/Subject column (replacing or supplementing the patient name). The column header SHALL be "Patient / Site" and display: patient name for clinical orders, site code + site name for environmental orders. Additionally, the **Compliance Standard** name SHALL appear as a secondary line below the site info, in smaller text with a Tag (kind="teal") showing the standard's short name.

**Acceptance Criteria:**
- [ ] Column header reads "Patient / Site"
- [ ] Clinical orders show patient name as before
- [ ] Environmental orders show site code + site name
- [ ] Compliance standard name appears as secondary text with teal Tag
- [ ] Orders without a standard show no secondary line

---

### 5.8 QA Review Environmental Completeness

**ID:** ENV-8-001
**Priority:** P0
**Requirement:**
The QA Review completeness dashboard (QA-1) SHALL include environmental-specific completeness checks when the order is Environmental. In addition to the standard step-completion indicators, the following checks SHALL appear:

| Check | Status: Complete | Status: Incomplete |
|---|---|---|
| Sampling Site linked | Site code + name displayed | "No sampling site selected" (red) |
| Compliance Standard selected | Standard name + regulation displayed | "No compliance standard selected" (yellow warning) |
| GPS coordinates captured | Coordinates displayed (monospace) | "GPS not recorded" (yellow warning) |
| Collection conditions recorded | "N of M fields completed" | "Collection conditions incomplete" (yellow warning) |
| Collection method specified | Method name displayed | "Collection method not specified" (red — required field) |

**Acceptance Criteria:**
- [ ] Environmental checks appear only for Environmental orders
- [ ] Complete checks display green indicator with data
- [ ] Incomplete required checks display red indicator
- [ ] Incomplete optional checks display yellow warning
- [ ] Clicking an incomplete check navigates to the relevant step for correction
- [ ] All checks update dynamically when order data changes

---

**ID:** ENV-8-002
**Priority:** P1
**Requirement:**
The QA Review sample review table (QA-2) SHALL include two additional columns for environmental orders:

- **Site** — Site code (as a link that opens the site detail in a new tab)
- **Standard** — Compliance standard short name with a status Tag

These columns appear only when the order is Environmental.

**Acceptance Criteria:**
- [ ] Site column shows site code as a clickable link
- [ ] Standard column shows standard name with Tag
- [ ] Columns hidden for clinical orders
- [ ] Columns appear alongside existing columns (type, tests, status, NCE)

---

### 5.9 Reporting Data Requirements

**ID:** ENV-9-001
**Priority:** P1
**Requirement:**
The order entity SHALL store sufficient structured data at order time to enable downstream generation of the **Laporan Hasil (LH) — Compliance Test Report**. The following fields MUST be persisted with the order and available via API for report generation:

| Field | Source | Required for LH |
|---|---|---|
| `complianceStandardId` | ENV-1-001 (standard selection) | Yes — identifies the applicable standard |
| `complianceStandardVersion` | ENV-1-001 | Yes — ensures threshold lookup uses order-time version |
| `complianceStandardName` | Denormalized from standard | Yes — displayed on report header |
| `regulationNumber` | From standard or manual override | Yes — displayed on report header |
| `siteCode` | S-02 (site selection) | Yes — identifies sampling location |
| `siteName` | S-02 | Yes — displayed on report |
| `siteGpsCoordinates` | S-02 / COL-3 | Yes — displayed on report |
| `sampleTypes` | ENV-2-001 (sample type selection) | Yes — list of sample types collected, with standard/override flag |
| `collectionMethod` | ENV-3-001 | Yes — documented on report |
| `collectionDateTime` | COL-2 | Yes — documented on report |
| `waterTemperature` | ENV-3-001 (if applicable) | Conditional — water programs only |
| `ambientTemperature` | ENV-3-001 | Optional |
| `weatherConditions` | ENV-3-001 | Optional |
| `preservationMethod` | ENV-3-001 | Optional |
| `fieldNotes` | ENV-3-001 | Optional |
| `regulatoryReference` | ENV-4-001 | Yes — displayed on report header |

**Acceptance Criteria:**
- [ ] All required fields are stored on the order entity
- [ ] API endpoint returns all LH fields in the order detail response
- [ ] Conditional fields (e.g., waterTemperature) are null for non-applicable programs
- [ ] Denormalized fields (standardName, regulationNumber) are snapshot values from order time, not live lookups
- [ ] Report generation module (future) can retrieve all needed data from a single order API call

---

**ID:** ENV-9-002
**Priority:** P2
**Requirement:**
The order detail API response SHALL include a `complianceContext` object containing all compliance-related data in a single nested structure, for convenience of report generators and downstream consumers:

```json
{
  "complianceContext": {
    "standardId": "std-001",
    "standardVersion": "2021-01",
    "standardName": "PP No. 22/2021 — Baku Mutu Air Permukaan",
    "regulationNumber": "PP No. 22/2021",
    "issuingBody": "Pemerintah Republik Indonesia",
    "siteCode": "WS-001",
    "siteName": "Sungai Ciliwung — Manggarai",
    "siteGps": { "latitude": -6.1885, "longitude": 106.8114 },
    "sampleTypes": [
      { "id": "st-001", "name": "Surface Water", "code": "WATER_SURFACE", "isFromStandard": true },
      { "id": "st-003", "name": "Groundwater", "code": "WATER_GROUND", "isFromStandard": true }
    ],
    "collectionMethod": "Manual Grab",
    "collectionDateTime": "2026-04-03T08:30:00+07:00",
    "regulatoryReference": "PP No. 22/2021 — Baku Mutu Air Permukaan",
    "conditions": {
      "waterTemperature": 28.5,
      "ambientTemperature": 31.2,
      "weatherConditions": "Clear",
      "preservationMethod": "HNO3 acidification",
      "fieldNotes": "Collected 50m downstream of industrial discharge point"
    }
  }
}
```

**Acceptance Criteria:**
- [ ] `complianceContext` object included in order detail API response
- [ ] All fields populated from order-time data
- [ ] `conditions` sub-object contains program-specific fields
- [ ] Null/absent fields omitted from JSON (not sent as null)

---

## 6. Data Model

### 6.1 Modified Entities

**Order (extends existing)**

| Field | Type | Required | Notes |
|---|---|---|---|
| `complianceStandardId` | Long (FK) | Yes (env) | FK to ComplianceStandard.id; null for clinical orders |
| `complianceStandardVersion` | String | Yes (env) | Snapshot of standard version at order time |
| `complianceStandardName` | String (255) | Yes (env) | Denormalized for reporting; snapshot at order time |
| `regulationNumber` | String (100) | Yes (env) | From standard or manual override (ENV-4-001) |
| `regulatoryReference` | String (500) | No | Full regulatory reference text (auto-populated or manual) |
| `siteId` | Long (FK) | Yes (env) | FK to SamplingSite.id; null for clinical orders |
| `collectionMethod` | String (50) | Yes (env) | From collection conditions; enum value |
| `waterTemperature` | Decimal | No | °C; null if not applicable |
| `ambientTemperature` | Decimal | No | °C |
| `weatherConditions` | String (50) | No | Enum value from Select |
| `preservationMethod` | String (255) | No | Free-text |
| `fieldNotes` | Text | No | Free-text, max 1000 chars |

**OrderSampleType (new join table)**

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | Long (FK) | Yes | FK to Order.id |
| `sampleTypeId` | Long (FK) | Yes | FK to SampleType.id (existing test catalog entity) |
| `isFromStandard` | Boolean | Yes | `true` if sample type came from the standard's `applicableSampleTypes`; `false` if added via override |
| `sortOrder` | Integer | No | Preserves order of selection |

### 6.2 Entity Relationships

**Order → ComplianceStandard**
- Order.complianceStandardId → ComplianceStandard.id
- Relationship: Many-to-One (N:1)
- Cascade: No cascade delete (standard deactivation does not affect existing orders)

**Order → SamplingSite**
- Order.siteId → SamplingSite.id
- Relationship: Many-to-One (N:1)
- Cascade: Site deactivation does not affect existing orders; deactivated sites cannot be selected for new orders

**Order → SampleType (via OrderSampleType)**
- Order.id → OrderSampleType.orderId → SampleType.id
- Relationship: Many-to-Many through OrderSampleType join table
- Tracks which sample types the technician selected in Step 1, including override types

**ComplianceStandard → Test (via ComplianceThreshold)**
- Used at order time for test panel auto-suggestion (ENV-2-001)
- Relationship: Many-to-Many through ComplianceThreshold
- Query (updated to filter by selected sample types): SELECT DISTINCT t.* FROM Test t JOIN ComplianceThreshold ct ON t.id = ct.testId JOIN TestSampleType tst ON t.id = tst.testId WHERE ct.standardId = ? AND ct.isActive = true AND tst.sampleTypeId IN (?)

### 6.3 Database Schema Changes

```sql
-- Extend order table with environmental fields
ALTER TABLE orders ADD COLUMN compliance_standard_id BIGINT REFERENCES compliance_standard(id);
ALTER TABLE orders ADD COLUMN compliance_standard_version VARCHAR(50);
ALTER TABLE orders ADD COLUMN compliance_standard_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN regulation_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN regulatory_reference VARCHAR(500);
ALTER TABLE orders ADD COLUMN site_id BIGINT REFERENCES sampling_site(id);
ALTER TABLE orders ADD COLUMN collection_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN water_temperature DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN ambient_temperature DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN weather_conditions VARCHAR(50);
ALTER TABLE orders ADD COLUMN preservation_method VARCHAR(255);
ALTER TABLE orders ADD COLUMN field_notes TEXT;

-- Order-to-SampleType join table (tracks samples selected at order time)
CREATE TABLE order_sample_type (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    sample_type_id BIGINT NOT NULL REFERENCES sample_type(id),
    is_from_standard BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER,
    UNIQUE(order_id, sample_type_id)
);
CREATE INDEX idx_order_sample_type_order ON order_sample_type(order_id);

-- Index for dashboard search by site
CREATE INDEX idx_orders_site_id ON orders(site_id);
CREATE INDEX idx_orders_compliance_standard_id ON orders(compliance_standard_id);
```

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance-standards?status=ACTIVE` | List active standards for ComboBox | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/applicable-sample-types` | Get sample types linked to a standard | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/suggested-tests?sampleTypeIds={ids}` | Get tests filtered by standard AND selected sample types | `compliance.threshold.view` |
| GET | `/api/v1/sample-types` | List all sample types in the system (for override ComboBox) | `order.enter` |
| GET | `/api/v1/compliance-standards/{id}/parameter-groups` | Get parameter groups with thresholds for accordion view | `compliance.threshold.view` |
| GET | `/api/v1/orders/{id}` | Get order detail including `complianceContext` | `order.enter` |
| PUT | `/api/v1/orders/{id}` | Update order (includes environmental fields) | `order.enter` |
| GET | `/api/v1/orders?siteCode={code}` | Search orders by site code (dashboard) | `order.enter` |
| GET | `/api/v1/orders?siteName={name}` | Search orders by site name (dashboard) | `order.enter` |
| GET | `/api/v1/orders?standardId={id}` | Filter orders by compliance standard (dashboard) | `order.enter` |

---

## 8. Navigation & Screen Inventory

S-03 does not introduce new screens. It extends existing screens from the Sample Collection Redesign:

| Screen | Extension | Source Requirement |
|---|---|---|
| **Step 1 — Enter Order** (Environmental section) | Adds Compliance Standard ComboBox, Selected Standard Card, Sample Type Checklist (with override), Test Panel Auto-Suggestion, Collection Conditions fields, Regulatory Reference | ENV-1-001, ENV-2-001, ENV-3-001, ENV-4-001, ENV-5-001 |
| **Step 2 — Collect Sample** | Sample types auto-populated from Step 1; Collection Conditions fields carried forward; GPS pre-populated from site | ENV-2-001, ENV-3-002, ENV-5-001 |
| **Steps 2, 3, 4 — Order Context Card** | Standard name + regulation number + View Thresholds link | ENV-6-001 |
| **Order Dashboard** | Search by site code/name; Compliance Standard filter; Patient/Site column | ENV-7-001, ENV-7-002, ENV-7-003 |
| **Step 4 — QA Review** | Environmental completeness checks; Site + Standard columns in review table | ENV-8-001, ENV-8-002 |

See companion mockup: `S03-environmental-order-entry-mockup.jsx`

---

## 9. Business Rules

**BR-001:** An environmental order MUST have a compliance standard selected before it can be submitted (transition from Draft to Entered). Clinical orders have no such requirement.

**BR-002:** The compliance standard version stored on the order is a **snapshot** from order creation time. If the standard is subsequently superseded or updated, the order retains the original version for evaluation consistency.

**BR-003:** Test panel auto-suggestion is a **suggestion only** — the user can deselect suggested tests and add non-suggested tests. The order is valid with any combination of tests, not just the suggested set.

**BR-004:** Collection conditions fields are configurable per environmental program. If the program configuration changes after an order is entered, existing orders retain the field values they had at entry time. New orders use the updated configuration.

**BR-005:** The regulatory reference field has two modes: auto-populated (from standard) and manual override. Once overridden, the field retains the manual value even if the standard changes. Re-selecting the same standard does not re-populate the overridden value.

**BR-006:** Site metadata auto-population (ENV-5-001) is a **pre-fill only** — the collector can override all pre-populated values at Step 2. The order stores the final values entered by the user, not the site defaults.

**BR-007:** QA environmental completeness checks (ENV-8-001) are advisory, not blocking. A QA officer can approve an environmental order even if some optional checks are incomplete (e.g., missing GPS). Required checks (site, standard, collection method) must be complete for approval.

**BR-008:** Dashboard site-based search (ENV-7-001) searches both the `siteCode` and `siteName` fields on the order entity. It does not search the site registry directly — only orders that have a site linked.

**BR-009:** Sample type selection (ENV-2-001) presents the standard's `applicableSampleTypes` as a checklist. When no sample types are checked, no tests are auto-suggested. Test auto-suggestion is triggered by the combination of selected standard + selected sample types, not by standard selection alone.

**BR-010:** A user may add sample types not listed in the selected compliance standard via the "Add Other Sample Type" override. Override sample types are visually distinguished ("Not in Standard" tag) but are fully functional — tests applicable to those sample types appear in the suggestion list. This supports field realities where a non-standard sample is collected alongside regulated samples. The system SHALL NOT block submission.

**BR-011:** Sample types selected in Step 1 auto-populate Step 2. The technician can adjust sample types on Step 2, but changes on Step 2 do NOT retroactively change Step 1 selections or re-trigger test suggestions. Test suggestions are locked to Step 1 selections.

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added:

| i18n Key | Default English Text |
|---|---|
| `heading.envOrder.complianceStandard` | Compliance Standard |
| `heading.envOrder.collectionConditions` | Collection Conditions |
| `heading.envOrder.regulatoryReference` | Regulatory Reference |
| `heading.envOrder.selectSamples` | Select Available Samples |
| `heading.envOrder.suggestedTests` | Suggested Tests |
| `heading.envOrder.environmentalChecks` | Environmental Completeness |
| `label.envOrder.standard` | Compliance Standard |
| `label.envOrder.standard.name` | Standard Name |
| `label.envOrder.standard.issuingBody` | Issuing Body |
| `label.envOrder.standard.regulationNumber` | Regulation Number |
| `label.envOrder.standard.version` | Version |
| `label.envOrder.standard.effectiveDate` | Effective Date |
| `label.envOrder.standard.linkedTests` | Linked Tests |
| `label.envOrder.collectionMethod` | Collection Method |
| `label.envOrder.waterTemperature` | Water Temperature (°C) |
| `label.envOrder.ambientTemperature` | Ambient Temperature (°C) |
| `label.envOrder.weatherConditions` | Weather Conditions |
| `label.envOrder.preservationMethod` | Preservation Method |
| `label.envOrder.fieldNotes` | Field Notes |
| `label.envOrder.regulatoryReference` | Regulatory Reference |
| `label.envOrder.regulatoryReference.override` | Override |
| `label.envOrder.regulatoryReference.autoPopulated` | Auto-populated from selected compliance standard |
| `label.envOrder.qaCheck.siteLinked` | Sampling Site |
| `label.envOrder.qaCheck.standardSelected` | Compliance Standard |
| `label.envOrder.qaCheck.gpsRecorded` | GPS Coordinates |
| `label.envOrder.qaCheck.conditionsRecorded` | Collection Conditions |
| `label.envOrder.qaCheck.methodSpecified` | Collection Method |
| `label.envOrder.dashboard.patientSite` | Patient / Site |
| `label.envOrder.dashboard.standardFilter` | Compliance Standard |
| `placeholder.envOrder.standard.search` | Search standards by name or regulation number... |
| `placeholder.envOrder.collectionMethod` | Select collection method... |
| `placeholder.envOrder.weatherConditions` | Select weather conditions... |
| `placeholder.envOrder.preservationMethod` | e.g., HNO3 acidification, 4°C cooler |
| `placeholder.envOrder.fieldNotes` | Enter field observations... |
| `placeholder.envOrder.regulatoryReference` | Enter regulatory reference... |
| `button.envOrder.viewThresholds` | View Thresholds |
| `button.envOrder.showAllStandards` | Show All Standards |
| `button.envOrder.overrideReference` | Override |
| `label.envOrder.selectSamples.helper` | Check the sample types you have collected for this order. Tests will be suggested based on your selections. |
| `label.envOrder.sampleCount` | {count} sample types selected |
| `button.envOrder.addOtherSampleType` | Add Other Sample Type |
| `tag.envOrder.notInStandard` | Not in Standard |
| `tooltip.envOrder.notInStandard` | This sample type is not listed under the selected compliance standard. |
| `message.envOrder.testsSuggested` | Based on {standardName} and {sampleCount} selected sample types, {testCount} tests have been suggested. |
| `message.envOrder.noLinkedTests` | No tests are linked to this standard. Please add tests manually or contact your administrator. |
| `message.envOrder.standardRequired` | A compliance standard is required for environmental orders. |
| `message.envOrder.clearSuggestions` | Changing the standard will clear suggested tests. Continue? |
| `message.envOrder.qaComplete` | Environmental data complete |
| `message.envOrder.qaIncomplete` | Environmental data incomplete |
| `error.envOrder.standardRequired` | Please select a compliance standard. |
| `error.envOrder.collectionMethodRequired` | Collection method is required. |
| `error.envOrder.temperatureRange` | Temperature must be between -50 and 100 °C. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Compliance Standard | Required for environmental orders | `error.envOrder.standardRequired` |
| Collection Method | Required for environmental orders | `error.envOrder.collectionMethodRequired` |
| Water Temperature | Numeric, range -50 to 100 | `error.envOrder.temperatureRange` |
| Ambient Temperature | Numeric, range -50 to 100 | `error.envOrder.temperatureRange` |
| Field Notes | Max 1000 characters | `error.envOrder.fieldNotesMaxLength` |
| Preservation Method | Max 255 characters | `error.envOrder.preservationMaxLength` |
| Regulatory Reference | Max 500 characters | `error.envOrder.referenceMaxLength` |

---

## 12. Security & Permissions

S-03 reuses existing permission keys. No new permissions are introduced.

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View compliance standards in ComboBox | `compliance.standard.view` | ComboBox disabled with message "Insufficient permissions" |
| View thresholds accordion | `compliance.threshold.view` | "View Thresholds" link hidden |
| Select/change standard on order | `order.enter` | Standard ComboBox disabled |
| Enter collection conditions | `order.enter` (Step 1) or `order.collect` (Step 2) | Conditions fields disabled |
| View environmental QA checks | `order.qa` | QA page accessible; env checks visible |
| Search dashboard by site | `order.enter` | Search works (site search is just a search filter) |
| Filter dashboard by standard | `order.enter` + `compliance.standard.view` | Standard filter hidden if no `compliance.standard.view` |

---

## 13. Acceptance Criteria

### Functional

- [ ] Environmental order entry flow: select site → select standard → select sample types → review suggested tests → enter conditions → submit
- [ ] Sample type checklist displays standard's `applicableSampleTypes` after standard selection
- [ ] "Add Other Sample Type" override allows selecting any system sample type including OTHER
- [ ] Override sample types display "Not in Standard" tag
- [ ] Selected sample types auto-populate Step 2, eliminating redundant selection
- [ ] Standard ComboBox filters to ACTIVE standards only
- [ ] Test panel auto-suggestion populates correct tests from standard's thresholds
- [ ] Collection conditions fields configurable per program
- [ ] Regulatory reference auto-populates from standard; supports manual override
- [ ] Site metadata (GPS, zone) pre-populates downstream fields
- [ ] Standard persists in order context card on Steps 2, 3, 4 (read-only)
- [ ] Dashboard search finds environmental orders by site code/name
- [ ] Dashboard filter by compliance standard works
- [ ] QA completeness checks verify GPS, conditions, site, standard, collection method
- [ ] Changing standard triggers test re-suggestion with confirmation
- [ ] Clinical orders are unaffected by all S-03 changes

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Standard ComboBox loads within 500ms
- [ ] Test auto-suggestion completes within 1 second
- [ ] Dashboard search by site returns results within 2 seconds
- [ ] All environmental fields stored with order for reporting (ENV-9-001)
- [ ] `complianceContext` API response includes all Laporan Hasil fields
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)

### Integration

- [ ] S-01 compliance standards appear in the order-time ComboBox
- [ ] S-02 site search works within the order entry environmental section
- [ ] Order context card displays standard from S-01 on all workflow steps
- [ ] QA checks reference S-02 site data and S-01 standard data
- [ ] Dashboard search/filter integrates with existing DSH-1 through DSH-9 requirements
- [ ] `complianceContext` API response is consumable by future Laporan Hasil report generator

---

## Appendix A: Cross-Reference to Parent Specs

| S-03 Requirement | Extends | Parent Spec |
|---|---|---|
| ENV-1-001 | ORD-2, ORD-3 | Sample Collection Redesign |
| ENV-1-002 | — | New (site-type prioritization) |
| ENV-2-001 | ORD-7, S-01 FR-4-001, S-01 `applicableSampleTypes` | Sample Collection Redesign + S-01 |
| ENV-2-002 | — | New (parameter group organization) |
| ENV-3-001 | ORD-2, ORD-10, COL-3 | Sample Collection Redesign |
| ENV-3-002 | COL-3 | Sample Collection Redesign |
| ENV-4-001 | ORD-2 | Sample Collection Redesign |
| ENV-5-001 | ORD-2, S-02 FR-5.3.1 | Sample Collection Redesign + S-02 |
| ENV-6-001 | NAV-5 | Sample Collection Redesign |
| ENV-6-002 | S-01 BR-010 | S-01 |
| ENV-7-001 | DSH-2 | Sample Collection Redesign |
| ENV-7-002 | DSH-7 | Sample Collection Redesign |
| ENV-7-003 | DSH-4 | Sample Collection Redesign |
| ENV-8-001 | QA-1 | Sample Collection Redesign |
| ENV-8-002 | QA-2 | Sample Collection Redesign |
| ENV-9-001 | — | New (reporting contract) |
| ENV-9-002 | — | New (API shape) |
