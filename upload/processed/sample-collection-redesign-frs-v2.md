# Functional Requirements Specification
## Sample Collection Process Redesign
### Decoupled Order Entry with Unified Clinical/Environmental Workflows

**OpenELIS Global**
**Version:** 2.0
**Date:** 2026-04-16
**Status:** Draft for Review
**Jira:** OGC-527 (Vector & Environmental epic); related: OGC-537 (Environmental Order Entry — now merged here), OGC-528 (S-01 Compliance Standards), OGC-531 (S-02 Sampling Site Registry)
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Compliance Standards Administration (S-01), Sampling Site Registry (S-02), Sample Type Domain Classification (S-04/OGC-538), Test Catalog (OGC-49)

### Change Log

- **v2.0 (2026-04-16):** Merged S-03 (Environmental Order Entry Integration, OGC-537) into this spec. All ENV-x-xxx requirements are now inline in their relevant step sections. Added §6 Data Model, §7 API Endpoints, §10 Localization, §11 Validation Rules, §12 Security & Permissions. Added OrderContext specification (§4.2) covering environmental fields. Added step-independence rules for environmental orders. Added barcode-scan edit flow for environmental context. Supersedes `S03-environmental-order-entry-frs-v1.0.md`.
- **v1.0 (2026-03):** Initial draft — 4-step decoupled architecture, clinical/environmental workflow toggle, order dashboard, edit order, incoming external orders.

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. Architecture Overview
   - 4.1 Current State
   - 4.2 Proposed State — 4-Step Decoupled Architecture
   - 4.3 OrderContext Specification
   - 4.4 Workflow Toggle — Lab Unit Configuration
5. User Stories
6. Functional Requirements
   - 6.1 Navigation & Step Decoupling
   - 6.2 Step 1 — Enter Order
   - 6.3 Step 2 — Collect Sample
   - 6.4 Step 3 — Label & Store
   - 6.5 Step 4 — QA Review
   - 6.6 Lab Unit Workflow Configuration
   - 6.7 Cross-Cutting Requirements
   - 6.8 Edit Order Workflow
   - 6.9 Order Dashboard
   - 6.10 Incoming External Orders
7. Data Model
8. API Endpoints
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. UI Design
14. Acceptance Criteria
15. Resolved Decisions
16. Timeline Considerations

---

## 1. Executive Summary

The current OpenELIS Global sample collection process is a single monolithic form where order entry, sample collection, labeling/storage, and QA review are tightly coupled. In practice these steps are performed by different people at different times. This spec decomposes the monolith into four independently routable steps unified by a shared OrderContext, with a workflow toggle (Clinical / Environmental / Both) that controls which fields appear at each step.

With v2.0, the environmental order entry integration (formerly S-03) is merged directly into this spec. Environmental orders follow the same 4-step pipeline as clinical orders but add compliance standard selection, structured collection conditions, site metadata auto-population, sample-type-driven test suggestion, and environmental QA completeness checks — all wired through the shared OrderContext so every step has full environmental context regardless of entry point.

---

## 2. Problem Statement

**Current state:** The Add Order flow is a single React component tree rooted at *AddOrder.js* which renders PatientInfo, AddSample, OrderEntryAdditionalQuestions, OrderReferralRequest, and OrderResultReporting as tightly coupled children. All state is managed via useState hooks in the parent, creating a single massive form submission. The sidebar provides a single "Add Order" entry point.

Additionally, OpenELIS maintains separate workflows for clinical and environmental samples despite sharing significant overlapping logic. Environmental labs must manually track which compliance standard applies, which tests are required, and whether collection conditions were recorded — the environmental workflow toggle added in the current design only shows/hides fields without connecting to compliance standards (S-01) or the sampling site registry (S-02).

**Impact:** Continued workflow inefficiency, higher error rates in sample tracking, inability to support physician-facing order entry, ongoing code duplication across clinical/environmental modules, and no end-to-end regulatory compliance traceability for environmental labs.

**Proposed solution:** Decompose the monolithic form into four independently routable step-components unified by a shared OrderContext. Each step is accessible directly via URL or barcode scan. The workflow toggle controls which fields appear, with environmental mode adding compliance standard selection (consuming S-01), structured collection conditions, site metadata pre-population (consuming S-02), and sample-type-driven test panel suggestions. Environmental context flows through OrderContext to all steps and into the QA completeness dashboard.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Decouple the sample lifecycle into 4 independent steps** (Enter Order, Collect Sample, Label & Store, QA) each accessible as its own submenu item under "Add Order," reducing average form completion time by 40%.
2. **Enable wizard-with-shortcuts navigation** so the default sequential flow guides new users while experienced users can jump directly to any step.
3. **Unify clinical and environmental sample workflows** into a single flexible pipeline controlled by lab unit configuration, reducing duplicated frontend components by 60%.
4. **Enable end-to-end environmental compliance traceability** — from site selection through compliance standard selection, test panel suggestion, collection conditions, and QA review, with no manual steps outside the system.
5. **Connect S-01 and S-02 to the order workflow** — the compliance standard selected at order time drives test suggestions and flows through to results validation and reporting.
6. **Lay the groundwork for a physician-facing order entry app** by making "Enter Order" self-contained with a clean API contract.
7. **Maintain full backward compatibility** with existing FHIR-based integrations and the current REST API.

### 3.2 Non-Goals

1. **Building the physician-facing app itself** — this FRS makes the order entry step decoupled enough to support it, not the external app.
2. **Migrating the legacy Java/JSP UI** — changes target the React frontend only.
3. **Changing the test catalog or panel management** — test/panel availability remains unchanged.
4. **Barcode printer hardware integration** — Label & Store generates label data; hardware integration is separate.
5. **Role-based access control changes** — permissions follow the existing model via the server-driven menu system.
6. **Compliance evaluation engine** — S-05 defines the logic for evaluating results against thresholds. This spec defines only the data that flows *into* that engine.
7. **Compliance standard administration** — fully covered by S-01. This spec consumes standards at order time.
8. **Site registry administration** — fully covered by S-02. This spec consumes sites at order time.
9. **Test catalog configuration** — environmental sample types are standard sample types in the catalog. This spec consumes them.

---

## 4. Architecture Overview

### 4.1 Current State

Today the Add Order flow is a single React component tree rooted at *AddOrder.js*. The sidebar menu is server-driven via */rest/menu* and provides a single "Add Order" entry point. All state is managed via useState hooks in the parent component.

### 4.2 Proposed State — 4-Step Decoupled Architecture

The monolithic form is decomposed into four independently routable step-components, unified by a shared OrderContext:

| Step | Route | Primary Actor | Key Data |
|------|-------|---------------|----------|
| **1. Enter Order** | /order/enter | Physician / Clerk | Patient/subject or site, requester, compliance standard (env), sample types, tests, priority |
| **2. Collect Sample** | /order/collect | Phlebotomist / Collector | Sample type, collection date/time, collector ID, GPS (env), collection conditions (env), rejection |
| **3. Label & Store** | /order/label | Lab Technician | Lab number, barcode gen, storage location, temperature |
| **4. QA Review** | /order/qa | QA Officer | Completeness check (incl. environmental checks), rejection handling, non-conformity flags |

### 4.3 OrderContext Specification

OrderContext is a shared React context that holds the current order's state across all four steps. It is populated from the API when an order is loaded (via barcode scan, lab number entry, or dashboard navigation) and updated on each step save.

**Core fields (all orders):**

| Field | Type | Set By | Notes |
|-------|------|--------|-------|
| `orderId` | Long | Step 1 (save) | Null until first save |
| `labNumber` | String | Step 1 | Auto-generated or manual |
| `orderStatus` | Enum | Any step | DRAFT, ENTERED, COLLECTING, LABELING, QA_REVIEW, APPROVED, REJECTED |
| `workflowType` | Enum | Lab unit config | CLINICAL, ENVIRONMENTAL, BOTH |
| `sampleCategory` | Enum | Step 1 (when BOTH) | CLINICAL or ENVIRONMENTAL — set per order when lab unit is BOTH |
| `patientId` | Long | Step 1 (clinical) | Null for environmental |
| `patientSummary` | Object | Step 1 (clinical) | Name, DOB, gender, IDs — for context card |
| `requesterId` | Long | Step 1 | Provider or requestor |
| `facilityId` | Long | Step 1 | Ordering facility |
| `programId` | Long | Step 1 | Selected program |
| `tests` | Array | Step 1 / Step 2 | Selected tests/panels |
| `samples` | Array | Step 2 | Collected sample records |
| `stepCompletion` | Object | All steps | `{ step1: 'complete', step2: 'in_progress', step3: 'pending', step4: 'pending' }` |

**Environmental fields (set when `workflowType` is ENVIRONMENTAL or `sampleCategory` is ENVIRONMENTAL):**

| Field | Type | Set By | Notes |
|-------|------|--------|-------|
| `siteId` | Long | Step 1 | FK to SamplingSite (S-02) |
| `siteSummary` | Object | Step 1 | Code, name, type, GPS, zone — for context card |
| `complianceStandardId` | Long | Step 1 | FK to ComplianceStandard (S-01) |
| `complianceStandardVersion` | String | Step 1 | Snapshot at order time — immutable on Steps 2–4 |
| `complianceStandardName` | String | Step 1 | Denormalized for display/reporting |
| `regulationNumber` | String | Step 1 | From standard or manual override |
| `regulatoryReference` | String | Step 1 | Full regulatory reference text |
| `selectedSampleTypes` | Array | Step 1 | `[{ sampleTypeId, name, code, isFromStandard }]` |
| `collectionMethod` | String | Step 1 / Step 2 | Enum value |
| `collectionConditions` | Object | Step 1 / Step 2 | `{ waterTemp, ambientTemp, weather, preservation, fieldNotes }` |
| `gpsCoordinates` | Object | Step 1 (auto from site) / Step 2 (collector override) | `{ lat, lng }` |

**Context card rendering:** Every step page displays an Order Context Card (NAV-5) that renders from OrderContext. For environmental orders the context card additionally shows: site code + name, compliance standard name + regulation number + status Tag, and a "View Thresholds" link.

**Step-independence rule:** Because each step is independently routable, OrderContext MUST be loadable from the API at any step. If a user navigates directly to `/order/collect?orderId=123`, the system loads the full OrderContext from the server, including all environmental fields set in Step 1. If the order has no Step 1 data yet (edge case: order created externally), OrderContext fields are null and the step renders with empty/default values.

### 4.4 Workflow Toggle — Lab Unit Configuration

Each lab unit gains a configuration property controlling which workflow type(s) are enabled. This toggle affects which form fields appear during Enter Order and Collect Sample. It does not change available tests or the QA pipeline.

| Mode | Fields Shown | Fields Hidden |
|------|-------------|---------------|
| **Clinical** | Patient demographics (name, DOB, sex, national ID), clinical diagnosis, referring physician, insurance/payment | Site/environment description, GPS, environmental conditions, compliance standard. All location fields optional. |
| **Environmental** | Sampling Site search/create (mirrors Patient search pattern), compliance standard selection, sample type checklist, collection conditions, regulatory reference. Requestor handled same as clinical but not necessarily a clinical provider. | Patient demographics, patient photo, clinical diagnosis, insurance/payment |
| **Both (Unified)** | All fields shown, organized into collapsible sections. User selects sample category (Clinical / Environmental) per order, and the form adapts dynamically. | None hidden; sections collapse contextually based on sample category selection |

---

## 5. User Stories

### 5.1 Physician / Ordering Clerk

- **US-1:** As a physician, I want to enter a lab order with patient info and requested tests so that the lab can prepare for sample collection without me being present.
- **US-2:** As an ordering clerk, I want to see only the fields relevant to my lab unit's workflow type so I'm not overwhelmed by irrelevant fields.
- **US-3:** As a physician, I want the order entry form to work as a standalone step so a future physician-facing app can use the same interface.

### 5.2 Sample Collector / Phlebotomist

- **US-4:** As a phlebotomist, I want to look up an existing order and record sample collection details without re-entering order information.
- **US-5:** As an environmental sample collector, I want to record GPS coordinates, site conditions, and collection method for my collection so the data meets regulatory requirements.
- **US-6:** As a collector, I want to reject a sample at collection time with a reason code so the order can be flagged for re-collection.
- **US-12:** As a sample collector, I want to import pre-collected samples from a CSV file so I can efficiently register batches of samples.
- **US-13:** As a sample collector, I want to download a CSV template matching my container format so I can prepare sample data offline before uploading.
- **US-16:** As a sample collector, when adding a test to a sample, I want to choose whether to add it to an existing compatible sample or collect a new sample.
- **US-17:** As a sample collector, I want to print additional specimen labels during collection without navigating away.

### 5.3 Lab Technician

- **US-7:** As a lab technician, I want to scan or enter lab numbers and assign storage locations so I can track where each sample is physically stored.
- **US-8:** As a lab technician, I want to generate and print barcoded labels from the Label & Store step.

### 5.4 QA Officer

- **US-9:** As a QA officer, I want a dedicated review screen showing order completeness and flagging non-conformities so I can approve or reject before testing begins.
- **US-10:** As a QA officer, I want to see the full audit trail across all four steps.
- **US-14:** As a QA officer, I want to report a Non-Conforming Event for a specific sample or the entire order.
- **US-15:** As a QA officer, I want the system to automatically set an order to 'Rejected' when all its samples have been rejected.

### 5.5 Lab Administrator

- **US-11:** As a lab administrator, I want to configure each lab unit's workflow type in admin settings so the order forms automatically show the right fields.

### 5.6 Environmental Order Entry (merged from S-03)

- **US-26:** As an environmental lab clerk, I want to select a compliance standard during order entry so the system can suggest the correct tests and record which regulation applies.
- **US-27:** As an environmental lab clerk, I want to check off which sample types I have available and see only the tests applicable to those types, so I don't have to search the full test catalog.
- **US-28:** As an environmental sample collector, I want collection conditions from Step 1 to carry forward to Step 2 so I don't re-enter them, and I want to adjust GPS and conditions at collection time.
- **US-29:** As a QA officer reviewing an environmental order, I want to see completeness checks for site, standard, GPS, conditions, and collection method so I can verify regulatory data before approval.
- **US-30:** As a lab manager, I want to search the order dashboard by site code or site name and filter by compliance standard, so I can find environmental orders without knowing a patient name.

### 5.7 Order Dashboard & Incoming Orders

- **US-22:** As a lab technician, I want a single dashboard showing all my in-progress orders so I can quickly see what needs attention.
- **US-23:** As a lab technician, I want to search for orders by patient name, lab number, national ID, site code, or site name, and optionally include incoming external orders.
- **US-24:** As a lab receptionist, I want to accept incoming orders from EMRs and referral labs, choosing whether to keep the referring lab's number or generate a new one.
- **US-25:** As a lab manager, I want orders returned from QA highlighted in the dashboard.

### 5.8 Edit Order Workflow

- **US-18:** As a lab technician, I want to scan a lab number to load an existing order in read-only mode and press 'Edit' to modify.
- **US-19:** As a lab technician, I want to see which tests have results or have been validated before making changes.
- **US-20:** As a lab administrator, I want to be the only role that can cancel tests with results.
- **US-21:** As a QA officer, I want cancellation of tests with results to require an NCE audit trail entry.

---

## 6. Functional Requirements

### 6.1 Navigation & Step Decoupling

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| NAV-1 | **P0** | The sidebar menu shall display 'Add Order' as an expandable parent with 4 child items: Enter Order, Collect Sample, Label & Store, QA Review. | Menu renders all 4 items; each routes to its own page; items highlight correctly. |
| NAV-2 | **P0** | Each step shall be independently routable via /order/enter, /order/collect, /order/label, /order/qa. | Direct URL navigation loads the correct step without requiring prior steps. |
| NAV-3 | **P0** | A step-indicator (progress bar) shall appear at the top of each step page showing status of all 4 steps for the current order. | Progress bar shows completed (green), in-progress (blue), pending (gray) states. |
| NAV-4 | P1 | The wizard flow shall auto-advance to the next step on successful save, with an option to stay on the current step. | 'Save & Next' and 'Save' buttons both present; Save & Next navigates forward. |
| NAV-5 | P1 | Each step page shall display a summary card of the order context (lab number, patient/subject or site, tests, status) to orient the user. For environmental orders, the context card SHALL additionally display: site code + name, compliance standard name + regulation number + Active status Tag, and a "View Thresholds" link that opens an inline accordion of parameter groups and thresholds. The context card renders from OrderContext (§4.3). | Summary card visible and populated on all 4 step pages. Lab number displayed prominently. Environmental fields appear only for environmental orders. "View Thresholds" opens accordion without page navigation. |
| NAV-6 | **P0** | A barcode scan / lab number search bar shall appear at the top of every step page. Scanning or entering a lab number loads that order's full OrderContext (including all environmental fields) into the current step in read-only mode (see EDT-1). | Barcode scan field accepts scanner input and manual entry. Valid lab number loads order data including environmental context. Invalid lab number shows error. |
| NAV-7 | **P0** | The 'Edit Order' sidebar menu item shall be deprecated and replaced by the lab number scan/search functionality present on every step. | Edit Order menu item removed or marked deprecated. |
| NAV-8 | **P0** | After a barcode scan or lab number entry, the system shall provide immediate inline feedback: success notification (green) with order summary if found, or error notification (red) if not found. Feedback within 500ms. | Success scan shows green inline notification. Error scan shows red notification. Auto-dismisses after 5 seconds. |

### 6.2 Step 1 — Enter Order

#### 6.2.1 Core Order Fields (All Workflows)

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| ORD-1 | **P0** | Enter Order shall assign a Lab Number at the top of the form (auto-generated or manual entry) to enable tracking across all subsequent steps. | Lab number generated per existing rules. Displayed prominently at top. Carried forward to all steps via OrderContext. |
| ORD-1a | **P0** | Enter Order shall include a Print Labels section (below lab number), collapsed by default and expandable on click. Configurable label types with default quantities loaded from lab configuration: Order Label, Sample Label (disabled until specimen added, qty per specimen), Slide Label, Block Label, Freezer Label, and others as configured. Individual Print buttons + 'Print All Labels'. | Print Labels section collapsed by default; expandable. Label types from config. Sample Label disabled until specimen added. Quantities editable. Individual and bulk print actions. |
| ORD-1b | **P0** | Enter Order shall capture: requester info, site/department, priority, and subject information (patient for clinical; sampling site for environmental). Requested tests/panels and sample type are OPTIONAL at this step and can be specified later during collection. | All fields save to the order entity. Order can be saved without tests selected. |
| ORD-3 | **P0** | When lab unit is set to 'Both', a sample category toggle (Clinical / Environmental) shall appear, showing/hiding the patient vs. site sections dynamically. If the lab unit supports only one workflow type, the toggle shall not be shown. | Toggle present only when lab unit is 'Both'. Toggle hidden when only one workflow type. |
| ORD-4 | P1 | Enter Order shall support saving as Draft so physicians can return to complete later. | Draft orders appear in 'My Drafts' list; re-opening restores all entered data. |
| ORD-5 | **P0** | The Enter Order step shall use the existing FHIR R4 order API endpoint for data exchange, extending it as needed. | Existing FHIR order endpoint reused; returns order ID on creation. |
| ORD-6 | P1 | Provisional clinical diagnosis field shall support ICD-10/ICD-11 code lookup. | Typeahead search returns matching ICD codes; selected code saved with order. |
| ORD-7 | **P0** | Test/panel selection shall show all available tests with dropdown filters for lab unit and sample type. Lists must be paginated. | Paginated lists with filters. All tests available initially. |
| ORD-8 | P1 | Provider search triggered by entering part of a last name, first name, or phone number and pressing Search. Results appear inline. Inline disambiguation table for multiple matches. Selected provider card after selection. Same pattern for environmental requestors. | Provider search fields with Search button. Inline results table. Select button per row. Works for both clinical and environmental. |
| ORD-8a | **P0** | Department / Ward / Unit field disabled with "Select facility first..." until a facility is selected. If facility has subunits, dropdown enables and populates. If no subunits, stays disabled with "No subunits available." Clearing facility resets department. | Department field disabled by default. Populates on facility selection. Resets on clear. |
| ORD-9 | P1 | When a patient is selected (clinical), a summary card displays photo (if available), demographics, and identifiers. | Selected patient card shows photo/placeholder, name, DOB, gender, IDs. |
| ORD-10 | **P0** | Program field is a typeahead ComboBox. Selecting a program shows program-specific additional fields. Environmental workflow auto-selects default environmental program per lab unit config. | Typeahead filters dropdown. Program-specific fields appear dynamically. Environmental default auto-selects. |
| ORD-11 | **P0** | 'New Patient' inline form matches existing OpenELIS Add/Modify Patient form with all standard fields and collapsible sections. | All fields match existing form. Collapsible sections. Save creates patient and auto-selects. |

#### 6.2.2 Clinical Workflow — Patient Section

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| ORD-2-C | **P0** | Clinical workflow shows patient search/entry (local + Client Registry if configured). Search fields, inline results table, selected patient card. | Patient search, inline results, selected card — all per existing OpenELIS pattern. |

#### 6.2.3 Environmental Workflow — Site, Standard, Sample Types, Conditions

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| ORD-2-E | **P0** | Environmental workflow replaces the Patient section with a **Sampling Site** section that mirrors the patient search/create pattern: "Search for Site" / "New Site" tab pair, search fields (site code, name, type, region), inline results table with Select buttons, and read-only Selected Site card showing site details (code, name, type, subtype, GPS, zone, collection history count, last collection date). "New Site" opens an inline create form for registering a new site to the Site Registry (S-02). | Switching workflow mode changes visible sections without page reload. Environmental mode shows site search/create section instead of patient section. Site search returns results in inline table. Selected site card displays all fields. New Site form saves to registry and auto-selects. |
| ENV-1-001 | **P0** | When the workflow is Environmental, the Enter Order form SHALL display a **Compliance Standard** section between the Sampling Site selection and the Test/Panel selection. The section contains: (a) a **Standard ComboBox** (required) — typeahead filtered to ACTIVE standards only (S-01), items display: name, issuing body, regulation number, status Tag. When the selected program has an associated default standard, the ComboBox is pre-populated. (b) a **Selected Standard Card** (read-only, after selection) — standard name, issuing body, regulation number, version, effective date, linked test count. Tile with blue left border. (c) a **"View Thresholds" link** — opens read-only accordion of parameter groups and thresholds, inline (no navigation). | ComboBox appears only in Environmental mode. Filtered to ACTIVE only. Typeahead by name, issuing body, regulation number. Selection shows card. Card shows all fields. "View Thresholds" opens accordion inline. Default program standard pre-populates. Standard is required — form cannot submit without it. |
| ENV-1-002 | P1 | The Standard ComboBox SHALL support filtering by the selected site's sample-type affinity. Standards matching the site type appear first; non-matching appear below a divider. "Show All Standards" toggle overrides prioritization. Prioritization updates on site change. | Matching standards first. Divider. Toggle. Updates on site change. |
| ENV-2-001 | **P0** | When a compliance standard is selected, a **Sample Type Selection** section appears between the Standard Card and the Test/Panel selection. Contains: (a) **Checkbox list** — one per sample type in the standard's `applicableSampleTypes`, showing name + code. All unchecked by default. (b) **"Add Other Sample Type" button** (ghost, +Add icon) — opens ComboBox overlay listing ALL system sample types plus "Other". Override types appear with a Tag (purple) reading "Not in Standard" and a warning tooltip. (c) **Count indicator** — "{N} sample types selected". When at least one sample type is selected, the Test/Panel selection (ORD-7) auto-populates with a **suggested test panel** filtered to tests that have active ComplianceThresholds for the selected standard AND are applicable to selected sample types. Suggestion: InlineNotification (info) above test selection with "Based on [Standard Name] and [N] sample types, [M] tests have been suggested." Suggested tests are pre-selected with a "Suggested" Tag (blue). User can deselect or add non-suggested tests. **Step 2 auto-population:** Selected sample types auto-populate Step 2 sample type fields, eliminating redundant selection. | Standard selection shows sample type checklist. Checkboxes work. "Add Other" opens system-wide ComboBox. Override types show purple "Not in Standard" tag. Count updates. Selecting types triggers test suggestion. Suggested tests pre-selected with blue tag. InlineNotification shows counts. User can modify. Changing standard clears and re-populates (with confirmation if modified). No-linked-tests warning shown when applicable. Sample types auto-populate Step 2. |
| ENV-2-002 | P1 | Suggested test panel SHALL be organized by Parameter Group (from S-01). Each group as a collapsible section header with member tests below. Groups sorted per standard config. Tests within group sorted alphabetically. Group header shows selected/total count. | Tests grouped. Collapsible. Sorted per config. Count in header. |
| ENV-3-001 | **P0** | The Environmental section SHALL include a **Collection Conditions** sub-section with structured fields configurable per environmental program (leveraging ORD-10). Default field set: Water Temperature (NumberInput °C, optional, water programs only), Ambient Temperature (NumberInput °C, optional), Weather Conditions (Select: Clear/Cloudy/Rain/Storm/Wind/Other, optional), Collection Method (Select: Manual Grab/Composite Time/Composite Flow/Automated Sampler/Passive/Trap Collection/Other, **required**), Preservation Method (TextInput, optional), Field Notes (TextArea, max 1000 chars, optional). Administrators can configure per-program field sets (add/remove/reorder/required toggle) via Admin settings. | Collection Conditions appears in Environmental mode. Fields load per program. Default field set renders when no program config exists. Collection Method required. Admin can configure per-program field sets. Fields save to order and are in OrderContext. Validation uses Carbon `invalidText`. |
| ENV-4-001 | **P0** | The Collection Conditions section SHALL include a **Regulatory Reference** field: auto-populated from selected standard (name + regulation number), read-only with lock icon when auto-populated, editable when no standard selected or via "Override" link, saved with order regardless of source. | Auto-populates on standard selection. Read-only with lock icon. "Override" enables manual editing. Freely editable without standard. Persists across all steps via OrderContext. |
| ENV-5-001 | P1 | When a sampling site is selected, the system SHALL auto-populate downstream fields from site metadata: GPS coordinates → Step 2 collection GPS (editable), environmental zone → collection conditions zone (editable), site type → standard ComboBox prioritization (ENV-1-002), total collections count + last collection date → Selected Site Card. Changing site re-triggers auto-population (with confirmation if fields were manually modified). | GPS pre-fills Step 2. Zone pre-fills conditions. Site type drives prioritization. History on card. All pre-populated fields editable. Re-triggers on site change with confirmation. |

### 6.3 Step 2 — Collect Sample

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| COL-1 | **P0** | Collect Sample shall display a 'Requested Tests' table showing all tests/panels ordered in Step 1 with compatible sample types. Panels as group headers with '+ [Type] (all)' buttons. Individual test checkboxes for panel deselection. Click behavior: no match → new sample created directly; match exists → inline popover to choose existing sample or new sample. Test/panel can be assigned to multiple samples. | Tests table with panel headers. Choose-or-create popover. Multiple sample assignment. |
| COL-2 | **P0** | Each sample card includes: sample type dropdown, quantity (value + UOM from test catalog), collection conditions. Optional 'Collection Data' section: collection date, time, collector (name/badge). 'Received at Lab' section: received date/time auto-populated from server clock, editable. Pre-filled from Step 1 selections. | All fields save. Pre-filled fields editable. Collection data optional. Received date/time auto-populate. UOM from catalog. |
| ENV-3-002 | **P0** | For environmental orders, the Collection Conditions fields from Step 1 SHALL carry forward to Step 2 (pre-populated, editable). If Step 1 was skipped (order started at Step 2), conditions form appears blank. GPS capture (manual entry or device geolocation per COL-3) appears within this section. **Sample types selected in Step 1** (ENV-2-001) SHALL auto-populate Step 2 sample type fields, eliminating redundant selection. | Conditions from Step 1 carry forward. Sample types from Step 1 auto-populate. Both editable. GPS within conditions section. Blank if no Step 1 data. Save on Step 2 updates same data. |
| COL-3 | **P0** | Environmental collections shall include GPS capture (manual entry or device geolocation) and environmental conditions, rendered within the Collection Conditions section (ENV-3-002). | GPS coordinates save to sample. Geolocation API used when available. |
| COL-4 | **P0** | Collector shall be able to report a Non-Conforming Event (NCE) for a specific sample via a collapsed inline 'Report NCE' section on each sample card. NCE fields: type, severity, description, checkbox to mark sample as Rejected. | NCE section collapsed on each card. Expanding shows fields. Checking 'Rejected' marks sample. NCE saves with sample. If all rejected → order Rejected. |
| COL-5 | P1 | Multiple samples per order with independent collection tracking. | Each sample line tracks independently. |
| COL-11 | **P0** | Sample type button click: no match → new sample created directly; match → inline popover listing existing samples plus 'New [Type] sample (separate draw)'. Test/panel assignable to multiple samples. Panel '+ [Type] (all)' buttons follow same logic. | No match: direct create. Match: popover with options. Multi-sample assignment. Panel buttons follow same logic. |
| COL-12 | **P0** | 'Print Labels' button on each sample card + section-level 'Print More Sample Labels' button. | Per-sample and section-level print. Same label config as Steps 1 and 3. |
| COL-6 | **P0** | Downloadable CSV templates for batch import: Standard (flat list), 10×10 Box Layout, 96-Well Plate. | Templates download as .csv with correct headers. Box/plate include position coordinates. |
| COL-7 | **P0** | CSV upload (drag-and-drop or file picker, max 5 MB), parsed into preview table with row-level validation (✓ Valid, ⚠ Warning, ✗ Error). | Upload accepts .csv. Preview table with status indicators. Validation checks: required fields, sample type exists, date format, volume numeric. |
| COL-8 | **P0** | CSV preview summary (total, valid, warning, error counts). 'Import N Valid Samples' button. 'Fix Warnings' option. Editable cells in preview. | Import valid only. Fix warnings highlights rows. Editable cells. |
| COL-9 | P1 | Imported CSV samples added to order's sample list, treated identically to manual samples for all subsequent steps. | After import, samples appear in list. Editable. Normal workflow. |
| COL-10 | P2 | CSV import supports container position mapping (row/column or grid coordinate). | Position data saves and is available in Label & Store. |

### 6.4 Step 3 — Label & Store

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| LBL-1 | **P0** | Label & Store displays order's lab number and collected samples. Lab number is read-only (assigned in Step 1). For environmental orders, the Order Context Card (NAV-5) shows site + standard per §4.3. | Lab number in context card. Not editable. Environmental context visible. |
| LBL-2 | **P0** | Print Labels section: same configurable label types as Step 1 (Order, Sample, Slide, Block, Freezer), with adjustable quantities and individual/bulk print. Sample Label qty per specimen. | Same label config. Quantities adjustable. Print actions functional. |
| LBL-3 | **P0** | Storage assignment uses existing OpenELIS 'Assign Storage Location' interface rendered inline (not modal), auto-expanded. Includes: sample info card, quick assign via barcode scan, location search with 'Location +' button, optional position field, optional condition notes. Storage assigned on Save / Save & Next — no separate Assign button. | Inline storage form. No separate Assign button. Barcode scan. Location search. Save assigns. |
| LBL-4 | P2 | Position field accepts container position formats and validates against storage location configuration. | Position saves. Format validated if location has defined positions. |

### 6.5 Step 4 — QA Review

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| QA-1 | **P0** | QA Review displays a completeness dashboard showing which steps are complete, incomplete, or have issues. | Green/yellow/red indicators per step per sample. |
| ENV-8-001 | **P0** | For environmental orders, the completeness dashboard SHALL include additional environmental checks: (a) Sampling Site linked — site code + name or "No sampling site selected" (red). (b) Compliance Standard selected — standard name + regulation or "No compliance standard selected" (yellow). (c) GPS coordinates captured — coordinates or "GPS not recorded" (yellow). (d) Collection conditions recorded — "N of M fields completed" or "Collection conditions incomplete" (yellow). (e) Collection method specified — method name or "Collection method not specified" (red — required). Clicking an incomplete check navigates to the relevant step for correction. | Environmental checks appear only for environmental orders. Complete = green with data. Incomplete required = red. Incomplete optional = yellow. Click navigates to step. Dynamic updates. |
| QA-2 | **P0** | Sample Review table: each sample with type, assigned tests, collection status, NCE reports, 'Report NCE' button per sample. | All columns present. NCE column. Per-sample NCE button. |
| ENV-8-002 | P1 | For environmental orders, the Sample Review table SHALL include two additional columns: **Site** (site code as a link to site detail in new tab) and **Standard** (standard short name with status Tag). Columns hidden for clinical orders. | Site column with clickable link. Standard column with Tag. Hidden for clinical. |
| QA-3 | **P0** | Collapsed inline 'Report NCE' section for sample-level or order-level NCE. Fields: scope (Sample/Order), sample selection, NCE category (Pre-analytical/Analytical/Post-analytical/Documentation/Safety), type, severity, description, Rejected checkbox. | Collapsed NCE section. Scope selector. All fields. Submit saves NCE. Optional rejection. |
| QA-4 | **P0** | If ALL samples rejected, order automatically enters 'Rejected' state. Optional actions (storage, labeling) still allowed for archival. | Last rejection triggers Rejected state. Dashboard shows rejected. |
| QA-5 | **P0** | QA officer can approve for testing or reject back to a specific step (dropdown: Enter Order / Collect Sample / Label & Store). Rejected order appears in target step's queue with 'Returned from QA' indicator. | Approve advances. Reject with step dropdown. Returned indicator. |
| QA-6 | P1 | Full audit trail visible across all 4 steps with timestamps and actor IDs. | Audit log chronological. Filterable by step and actor. |

### 6.6 Lab Unit Workflow Configuration

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| CFG-1 | **P0** | Lab Unit admin settings shall include a 'Workflow Type' dropdown: Clinical, Environmental, Both. | Dropdown present. Saves to lab unit configuration. |
| CFG-2 | **P0** | Changing the workflow type immediately affects which form fields appear on Enter Order and Collect Sample. | Forms dynamically show/hide correct field groups after config save. |
| CFG-3 | P1 | Preview/summary of enabled fields displayed in admin panel when configuring workflow type. | Hovering or expanding shows field list per type. |
| CFG-4 | P2 | Custom field groups beyond Clinical/Environmental may be defined per lab unit. | Admin can create custom field group. |

### 6.7 Cross-Cutting Requirements

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| XC-1 | **P0** | All step pages shall implement auto-save (every 30s when dirty) with visible save-status indicator ('Saved'/'Saving...'/'Unsaved changes'). Navigating away from dirty form triggers browser confirmation dialog. Critical for unreliable power/connectivity environments. | Auto-save 30s on dirty forms. Status indicator. Browser warning. Recoverable. Queues saves in low-connectivity. |
| XC-2 | P1 | All entity search patterns (Patient, Provider, Site) shall use a unified search interaction model: search fields, Search button, inline results table, Select buttons, read-only selected entity card. | All searches follow same pattern. |
| XC-3 | **P0** | All text meets WCAG 2.1 AA contrast (4.5:1 min). Disabled states use strikethrough or '(unavailable)' label, not opacity reduction. | All text ≥ 4.5:1. No opacity-based disabled. |
| XC-4 | **P0** | All interactive elements have 32px min touch target (Carbon small size). | All buttons ≥ 32px. Checkboxes/radios use Carbon wrappers. |
| XC-5 | **P0** | ARIA attributes for screen readers. Progress stepper with aria-label. Collapsible sections with role='button', tabindex, aria-expanded. Popovers with focus traps and aria-live. | Screen reader navigable. Stepper announces. Collapsibles announce. Popovers trap focus. |
| XC-6 | **P0** | Keyboard-accessible with visible focus indicators (Carbon focus ring). All interactive elements reachable via Tab. Enter/Space activates. | Tab reachable. Focus ring. Enter/Space. No keyboard traps. |

### 6.8 Edit Order Workflow

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| EDT-1 | **P0** | When an existing order is loaded via barcode scan or lab number entry, all step screens render in read-only mode by default. All fields greyed out/disabled. Prominent 'Edit' button in page header. Pressing 'Edit' enables editable fields. For environmental orders, the environmental context (site, standard, conditions) is also rendered read-only, with the full Order Context Card showing environmental data per §4.3. | Read-only by default. All fields including environmental greyed out. Edit button enables fields. Environmental context card populated. |
| EDT-2 | **P0** | Each test shows visual status indicator: 'Results Entered' (blue dot), 'Validated' (green check), 'No Results' (gray dash), 'Cancelled' (red X with strikethrough). | Status indicators in both Requested Tests table and Sample cards. |
| EDT-3 | **P0** | Tests with results NOT cancellable by non-admin users. Cancel button disabled with tooltip "Admin role required." Lab Administrator sees enabled Cancel button. | Non-admin disabled. Tooltip. Admin enabled. |
| EDT-4 | **P0** | Admin cancelling a test with results requires mandatory NCE entry. NCE captures: reason, category, description, admin identity. Cancellation + NCE recorded in audit trail. Test shows strikethrough with NCE ref. | Mandatory NCE form. Audit trail. Strikethrough with ref. |
| EDT-5 | P1 | Tests without results cancellable by any edit-permitted user. No NCE required but audit-trailed. | Enabled for edit-permitted. Audit trail. No NCE. |
| EDT-6 | **P0** | Edit Order uses the same 4-step screens as new order. User lands on whichever step they were viewing when they scanned. All existing order data pre-populated. | Same screens. Pre-populated. User lands on current step. |

### 6.9 Order Dashboard

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| DSH-1 | **P0** | "Add Order" parent menu item navigates to an Order Dashboard as default landing. Default view: "My In-Progress Orders" (orders current user has touched, not yet through QA). | Clicking "Add Order" → dashboard. Default shows user's in-progress orders. |
| DSH-2 | **P0** | Search bar searches by patient name, lab number, national ID, referring lab number, **site code**, and **site name**. Results replace default view. Clearing search restores default. Site-based search is always active (returns no results for clinical-only orders). | Search accepts all fields including site. Results in same table. Clear restores. Site search case-insensitive. |
| DSH-3 | **P0** | "Include external sources" checkbox next to search bar. When checked, incoming orders from EMRs and referral labs appear. Unchecked by default. | Checkbox default unchecked. Checked shows external orders in visually distinct section (purple border). |
| DSH-4 | **P0** | Dashboard table columns: Lab Number (or Referring Lab Number), **Patient / Site** (patient name for clinical, site code + site name for environmental, compliance standard name as secondary text with teal Tag for environmental), Requesting Facility, Priority, Current Step (mini progress bar), Last Updated, Action button ("Continue" / "Accept" / "Fix Issue"). | All columns rendered including Patient/Site with environmental display. Progress bar color-coded. Action buttons route correctly. Environmental orders show standard as secondary text with teal Tag. Orders without standard show no secondary line. |
| DSH-5 | **P0** | "+ New Order" button in dashboard header → Step 1 with blank form. | Button top-right. Routes to blank Step 1. |
| DSH-6 | **P0** | Barcode scan / lab number quick-lookup bar. Scanning routes to relevant step (same as NAV-6). | Scan bar present. Valid → routes. Invalid → inline error. |
| DSH-7 | P1 | Filter dropdowns: Status (In Progress/Awaiting QA/Completed/All), date range (From/To), Priority, and **Compliance Standard** (ComboBox showing ACTIVE standards). Filters combine via AND. | All filters present including Compliance Standard. Dynamic table update. Combinable via AND. |
| DSH-8 | **P0** | Orders returned from QA highlighted (yellow background, "Returned from QA" status). "Fix Issue" button routes to the step QA rejected it back to. | Visually distinct. Label shows target step. "Fix Issue" routes correctly. |
| DSH-9 | P1 | Pagination with configurable items per page (25/50/100). Default 100. | Pagination controls. Items per page dropdown. |
| ENV-7-INC | P1 | The "Include external sources" checkbox shall show a count badge of pending external orders (e.g., "Include external sources (3)"). | Badge count visible. Updates dynamically. |

### 6.10 Incoming External Orders

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| INC-1 | **P0** | Incoming external orders accessible via dashboard's "Include external sources" toggle. Old "Search Incoming Test Requests" screen deprecated. | External orders in dashboard. Old screen deprecated. |
| INC-2 | **P0** | External order rows: Referring Lab Number, Patient/Subject (or site for environmental), Requesting Facility, Priority, Source type, Received date/time, "Accept" button. Visual distinction (purple "External" badge, border). | All fields. Badge. Purple border. Accept button. |
| INC-3 | **P0** | "Accept" navigates to Step 1 with external order data pre-populated. User reviews/confirms before proceeding. | Pre-fills patient/site, requester, tests. Modifiable. |
| INC-4 | **P0** | Lab Number options for accepted external order: scan barcode, enter manually, generate new, or "Use Current" (keeps referring lab number). Referring lab number always stored as reference. | All four options. "Use Current" button. Referring number stored. |
| INC-5 | P1 | External orders indicate which steps have pre-populated data from source system. Pre-populated data editable. | Visual indicator per step. Editable. Empty steps pending. |

---

## 7. Data Model

### 7.1 Modified Entities

**Order (extends existing)**

| Field | Type | Required | Notes |
|---|---|---|---|
| `labNumber` | String | Yes | Assigned in Step 1 |
| `orderStatus` | Enum | Yes | DRAFT, ENTERED, COLLECTING, LABELING, QA_REVIEW, APPROVED, REJECTED |
| `workflowType` | Enum | Yes | CLINICAL, ENVIRONMENTAL — derived from lab unit config or per-order toggle |
| `patientId` | Long (FK) | Yes (clinical) | FK to Patient; null for environmental |
| `siteId` | Long (FK) | Yes (env) | FK to SamplingSite (S-02); null for clinical |
| `complianceStandardId` | Long (FK) | Yes (env) | FK to ComplianceStandard (S-01); null for clinical |
| `complianceStandardVersion` | String(50) | Yes (env) | Snapshot at order time — immutable after creation (except via Step 1 edit) |
| `complianceStandardName` | String(255) | Yes (env) | Denormalized for reporting; snapshot at order time |
| `regulationNumber` | String(100) | Yes (env) | From standard or manual override (ENV-4-001) |
| `regulatoryReference` | String(500) | No | Full regulatory reference text (auto or manual) |
| `collectionMethod` | String(50) | Yes (env) | Enum value from Collection Conditions |
| `waterTemperature` | Decimal(5,2) | No | °C; null if not applicable |
| `ambientTemperature` | Decimal(5,2) | No | °C |
| `weatherConditions` | String(50) | No | Enum value |
| `preservationMethod` | String(255) | No | Free-text |
| `fieldNotes` | Text | No | Max 1000 chars |
| `programId` | Long (FK) | No | FK to Program |
| `requesterId` | Long (FK) | Yes | Provider or requestor |
| `facilityId` | Long (FK) | Yes | Ordering facility |
| `priority` | Enum | No | ROUTINE, URGENT, STAT |

**SampleType (existing)** — No schema changes. Consumed at order time via the standard's `applicableSampleTypes` and the full system sample type list for overrides.

### 7.2 New Entities

**OrderSampleType (join table — tracks sample types selected at order time)**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Long | Yes | PK |
| `orderId` | Long (FK) | Yes | FK to Order |
| `sampleTypeId` | Long (FK) | Yes | FK to SampleType |
| `isFromStandard` | Boolean | Yes | `true` if from standard's `applicableSampleTypes`; `false` if override |
| `sortOrder` | Integer | No | Preserves selection order |

**Unique constraint:** `(orderId, sampleTypeId)`

### 7.3 Entity Relationships

- **Order → ComplianceStandard** — Many-to-One. No cascade delete (standard deactivation does not affect existing orders).
- **Order → SamplingSite** — Many-to-One. Site deactivation does not affect existing orders; deactivated sites cannot be selected for new orders.
- **Order → SampleType (via OrderSampleType)** — Many-to-Many. Tracks which sample types the technician selected in Step 1.
- **ComplianceStandard → Test (via ComplianceThreshold)** — Many-to-Many through ComplianceThreshold. Used at order time for test panel auto-suggestion (ENV-2-001). Query filters by selected sample types: `SELECT DISTINCT t.* FROM Test t JOIN ComplianceThreshold ct ON t.id = ct.testId JOIN TestSampleType tst ON t.id = tst.testId WHERE ct.standardId = ? AND ct.isActive = true AND tst.sampleTypeId IN (?)`

### 7.4 Database Schema Changes

```sql
-- Environmental fields on order table
ALTER TABLE orders ADD COLUMN workflow_type VARCHAR(20) NOT NULL DEFAULT 'CLINICAL';
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

-- Order-to-SampleType join table
CREATE TABLE order_sample_type (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    sample_type_id BIGINT NOT NULL REFERENCES sample_type(id),
    is_from_standard BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER,
    UNIQUE(order_id, sample_type_id)
);
CREATE INDEX idx_order_sample_type_order ON order_sample_type(order_id);

-- Indexes for dashboard search
CREATE INDEX idx_orders_site_id ON orders(site_id);
CREATE INDEX idx_orders_compliance_standard_id ON orders(compliance_standard_id);
```

---

## 8. API Endpoints

### 8.1 Order CRUD

| Method | Path | Description | Permission |
|---|---|---|---|
| POST | `/api/v1/orders` | Create order (includes environmental fields) | `order.enter` |
| GET | `/api/v1/orders/{id}` | Get order detail including `complianceContext` for environmental orders | `order.enter` |
| PUT | `/api/v1/orders/{id}` | Update order (Step 1 fields including environmental) | `order.enter` |
| PUT | `/api/v1/orders/{id}/collect` | Update Step 2 fields (collection data, conditions override) | `order.collect` |
| PUT | `/api/v1/orders/{id}/label` | Update Step 3 fields (storage assignment) | `order.enter` |
| PUT | `/api/v1/orders/{id}/qa` | QA approval/rejection | `order.qa` |

### 8.2 Compliance Standard (consumed from S-01)

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance-standards?status=ACTIVE` | List active standards for ComboBox | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/applicable-sample-types` | Sample types linked to a standard | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/suggested-tests?sampleTypeIds={ids}` | Tests filtered by standard AND selected sample types | `compliance.threshold.view` |
| GET | `/api/v1/compliance-standards/{id}/parameter-groups` | Parameter groups with thresholds for accordion view | `compliance.threshold.view` |

### 8.3 Sample Types

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/sample-types` | List all system sample types (for override ComboBox) | `order.enter` |

### 8.4 Dashboard Search & Filter

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/orders?search={term}` | Unified search: patient name, lab number, national ID, site code, site name | `order.enter` |
| GET | `/api/v1/orders?standardId={id}` | Filter by compliance standard | `order.enter` |
| GET | `/api/v1/orders?status={status}` | Filter by order status | `order.enter` |
| GET | `/api/v1/orders?dateFrom={date}&dateTo={date}` | Filter by date range | `order.enter` |

### 8.5 Compliance Context (for reporting — S-05, S-06)

The order detail response (`GET /api/v1/orders/{id}`) SHALL include a `complianceContext` object for environmental orders:

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
      { "id": "st-001", "name": "Surface Water", "code": "WATER_SURFACE", "isFromStandard": true }
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

Null/absent fields omitted from JSON.

---

## 9. Business Rules

**BR-001:** An environmental order MUST have a compliance standard selected before it can be submitted (transition from Draft to Entered). Clinical orders have no such requirement.

**BR-002:** The compliance standard version stored on the order is a snapshot from order creation time. If the standard is subsequently superseded, the order retains the original version for evaluation consistency.

**BR-003:** Test panel auto-suggestion is a suggestion only — the user can deselect suggested tests and add non-suggested tests. The order is valid with any combination of tests.

**BR-004:** Collection conditions fields are configurable per environmental program. If the program configuration changes after an order is entered, existing orders retain the field values they had at entry time.

**BR-005:** The regulatory reference field has two modes: auto-populated (from standard) and manual override. Once overridden, re-selecting the same standard does not re-populate the overridden value.

**BR-006:** Site metadata auto-population (ENV-5-001) is pre-fill only — the collector can override all pre-populated values at Step 2. The order stores the final values entered by the user.

**BR-007:** QA environmental completeness checks (ENV-8-001) are advisory, not blocking. A QA officer can approve an environmental order even if some optional checks are incomplete (e.g., missing GPS). Required checks (site, standard, collection method) must be complete for approval.

**BR-008:** Dashboard site-based search searches both `siteCode` and `siteName` fields on the order entity, not the site registry directly.

**BR-009:** Sample type selection presents the standard's `applicableSampleTypes` as a checklist. When no sample types are checked, no tests are auto-suggested. Suggestion requires standard + selected sample types.

**BR-010:** A user may add sample types not in the standard via the override. Override types are visually distinguished but fully functional. The system SHALL NOT block submission.

**BR-011:** Sample types selected in Step 1 auto-populate Step 2. Changes on Step 2 do NOT retroactively change Step 1 selections or re-trigger test suggestions. Suggestions are locked to Step 1 selections.

**BR-012:** Each step is independently enterable. An environmental order that begins at Step 2 (e.g., collector navigates directly to `/order/collect`) loads whatever OrderContext exists from the API. If no Step 1 environmental data exists (no standard, no site), the step renders without environmental pre-population and the collector can enter conditions from scratch. Missing Step 1 data will surface as incomplete in the QA completeness dashboard.

**BR-013:** When an existing order is loaded via barcode scan (NAV-6), the full OrderContext — including all environmental fields — is loaded from the API and rendered in read-only mode. The 'Edit' button enables editing of the current step's fields only; environmental context from other steps (e.g., standard selected in Step 1) remains read-only when editing Step 2.

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added:

### 10.1 Navigation & Dashboard

| i18n Key | Default English Text |
|---|---|
| `nav.order.addOrder` | Add Order |
| `nav.order.enterOrder` | Enter Order |
| `nav.order.collectSample` | Collect Sample |
| `nav.order.labelStore` | Label & Store |
| `nav.order.qaReview` | QA Review |
| `heading.order.dashboard` | Order Dashboard |
| `label.order.dashboard.search` | Search by patient, lab number, site code, or site name |
| `label.order.dashboard.includeExternal` | Include external sources |
| `label.order.dashboard.patientSite` | Patient / Site |
| `label.order.dashboard.standardFilter` | Compliance Standard |
| `button.order.newOrder` | + New Order |
| `button.order.continue` | Continue |
| `button.order.accept` | Accept |
| `button.order.fixIssue` | Fix Issue |
| `label.order.returnedFromQa` | Returned from QA |

### 10.2 Step 1 — Enter Order

| i18n Key | Default English Text |
|---|---|
| `heading.order.enterOrder` | Enter Order |
| `label.order.labNumber` | Lab Number |
| `label.order.priority` | Priority |
| `label.order.printLabels` | Print Labels |
| `label.order.program` | Program |
| `button.order.saveNext` | Save & Next |
| `button.order.save` | Save |
| `button.order.cancel` | Cancel |
| `heading.order.patient` | Patient Information |
| `heading.order.site` | Sampling Site |
| `label.order.searchSite` | Search for Site |
| `label.order.newSite` | New Site |
| `heading.envOrder.complianceStandard` | Compliance Standard |
| `label.envOrder.standard` | Compliance Standard |
| `label.envOrder.standard.name` | Standard Name |
| `label.envOrder.standard.issuingBody` | Issuing Body |
| `label.envOrder.standard.regulationNumber` | Regulation Number |
| `label.envOrder.standard.version` | Version |
| `label.envOrder.standard.effectiveDate` | Effective Date |
| `label.envOrder.standard.linkedTests` | Linked Tests |
| `placeholder.envOrder.standard.search` | Search standards by name or regulation number... |
| `button.envOrder.viewThresholds` | View Thresholds |
| `button.envOrder.showAllStandards` | Show All Standards |
| `heading.envOrder.selectSamples` | Select Available Samples |
| `label.envOrder.selectSamples.helper` | Check the sample types you have collected for this order. Tests will be suggested based on your selections. |
| `label.envOrder.sampleCount` | {count} sample types selected |
| `button.envOrder.addOtherSampleType` | Add Other Sample Type |
| `tag.envOrder.notInStandard` | Not in Standard |
| `tooltip.envOrder.notInStandard` | This sample type is not listed under the selected compliance standard. |
| `tag.envOrder.suggested` | Suggested |
| `message.envOrder.testsSuggested` | Based on {standardName} and {sampleCount} selected sample types, {testCount} tests have been suggested. |
| `message.envOrder.noLinkedTests` | No tests are linked to this standard for the selected sample types. Please add tests manually or contact your administrator. |
| `message.envOrder.standardRequired` | A compliance standard is required for environmental orders. |
| `message.envOrder.clearSuggestions` | Changing the standard will clear suggested tests. Continue? |

### 10.3 Collection Conditions

| i18n Key | Default English Text |
|---|---|
| `heading.envOrder.collectionConditions` | Collection Conditions |
| `label.envOrder.collectionMethod` | Collection Method |
| `label.envOrder.waterTemperature` | Water Temperature (°C) |
| `label.envOrder.ambientTemperature` | Ambient Temperature (°C) |
| `label.envOrder.weatherConditions` | Weather Conditions |
| `label.envOrder.preservationMethod` | Preservation Method |
| `label.envOrder.fieldNotes` | Field Notes |
| `label.envOrder.regulatoryReference` | Regulatory Reference |
| `label.envOrder.regulatoryReference.override` | Override |
| `label.envOrder.regulatoryReference.autoPopulated` | Auto-populated from selected compliance standard |
| `placeholder.envOrder.collectionMethod` | Select collection method... |
| `placeholder.envOrder.weatherConditions` | Select weather conditions... |
| `placeholder.envOrder.preservationMethod` | e.g., HNO3 acidification, 4°C cooler |
| `placeholder.envOrder.fieldNotes` | Enter field observations... |
| `placeholder.envOrder.regulatoryReference` | Enter regulatory reference... |
| `button.envOrder.overrideReference` | Override |

### 10.4 QA Review — Environmental

| i18n Key | Default English Text |
|---|---|
| `heading.envOrder.environmentalChecks` | Environmental Completeness |
| `label.envOrder.qaCheck.siteLinked` | Sampling Site |
| `label.envOrder.qaCheck.standardSelected` | Compliance Standard |
| `label.envOrder.qaCheck.gpsRecorded` | GPS Coordinates |
| `label.envOrder.qaCheck.conditionsRecorded` | Collection Conditions |
| `label.envOrder.qaCheck.methodSpecified` | Collection Method |
| `message.envOrder.qaComplete` | Environmental data complete |
| `message.envOrder.qaIncomplete` | Environmental data incomplete |
| `error.envOrder.standardRequired` | Please select a compliance standard. |
| `error.envOrder.collectionMethodRequired` | Collection method is required. |
| `error.envOrder.temperatureRange` | Temperature must be between -50 and 100 °C. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Lab Number | Required | `error.order.labNumberRequired` |
| Compliance Standard | Required for environmental orders | `error.envOrder.standardRequired` |
| Collection Method | Required for environmental orders | `error.envOrder.collectionMethodRequired` |
| Water Temperature | Numeric, range -50 to 100 | `error.envOrder.temperatureRange` |
| Ambient Temperature | Numeric, range -50 to 100 | `error.envOrder.temperatureRange` |
| Field Notes | Max 1000 characters | `error.envOrder.fieldNotesMaxLength` |
| Preservation Method | Max 255 characters | `error.envOrder.preservationMaxLength` |
| Regulatory Reference | Max 500 characters | `error.envOrder.referenceMaxLength` |
| Patient (clinical) | Required for clinical orders | `error.order.patientRequired` |
| Site (environmental) | Required for environmental orders | `error.order.siteRequired` |

---

## 12. Security & Permissions

### 12.1 Permission Keys

**From existing OpenELIS:**
- `order.enter` — Create/edit orders in Step 1
- `order.collect` — Record sample collection in Step 2
- `order.qa` — Approve/reject in Step 4

**From S-01 (Compliance Standards):**
- `compliance.standard.view` — View and select standards during order entry
- `compliance.threshold.view` — View thresholds for auto-suggestion and accordion

**From S-02 (Site Registry):**
- `site.registry.view` — Search and select sites during order entry
- `site.registry.create` — Create new site inline during order entry

### 12.2 Permission Matrix

| Action | Required Permission | UI Behavior if Denied | API Behavior |
|---|---|---|---|
| Access Enter Order step | `order.enter` | Step hidden in sidebar | HTTP 403 |
| Access Collect Sample step | `order.collect` | Step hidden in sidebar | HTTP 403 |
| Access QA Review step | `order.qa` | Step hidden in sidebar | HTTP 403 |
| View compliance standards in ComboBox | `compliance.standard.view` | ComboBox disabled with "Insufficient permissions" | HTTP 403 |
| View thresholds accordion | `compliance.threshold.view` | "View Thresholds" link hidden | HTTP 403 |
| Select/change standard on order | `order.enter` | Standard ComboBox disabled | HTTP 403 |
| Enter collection conditions | `order.enter` (Step 1) or `order.collect` (Step 2) | Fields disabled | HTTP 403 |
| View environmental QA checks | `order.qa` | QA page accessible; env checks visible | N/A |
| Search dashboard by site | `order.enter` | Search works (filter only) | N/A |
| Filter dashboard by standard | `order.enter` + `compliance.standard.view` | Standard filter hidden | N/A |
| Create new site inline | `site.registry.create` | "New Site" tab hidden | HTTP 403 |

---

## 13. UI Design

See companion mockups:
- `sample-collection-redesign-mockup.jsx` — unified clinical/environmental order entry
- `sample-collection-redesign-preview.html` — interactive HTML preview

### Navigation Path

Add Order (sidebar) → Order Dashboard (landing) → + New Order → Step 1 (Enter Order) → Step 2 (Collect Sample) → Step 3 (Label & Store) → Step 4 (QA Review)

Or: Any step directly via barcode scan / lab number entry / dashboard "Continue" button.

### Key Screens

1. **Order Dashboard** — Unified table of in-progress orders with search/filter, external order toggle, action buttons.
2. **Step 1 — Enter Order** — Lab number, print labels, patient/site section (workflow-dependent), compliance standard + sample type selection (environmental), test/panel selection, collection conditions (environmental), program selection.
3. **Step 2 — Collect Sample** — Requested tests with sample assignment, sample cards with collection data, collection conditions carry-forward (environmental), CSV import.
4. **Step 3 — Label & Store** — Label printing, storage assignment with barcode scan.
5. **Step 4 — QA Review** — Completeness dashboard (including environmental checks), sample review table, NCE reporting, approve/reject.

### Interaction Patterns

- **Wizard-with-shortcuts** — default sequential flow with sidebar shortcut to any step.
- **Inline row expansion** — edit forms within table rows (no modals for editing).
- **Unified search pattern** — Patient, Provider, Site all use same search → inline results → selected card pattern (XC-2).
- **Barcode scan on every step** — primary way to load existing orders.
- **Read-only default for loaded orders** — explicit Edit button to enable modification.
- **Collapsible sections** — Print Labels, View Thresholds, Collection Conditions optional sections.
- **Auto-save** — 30s interval with visible status indicator.

---

## 14. Acceptance Criteria

### 14.1 Functional — Core Workflow

- [ ] 4-step navigation works: sidebar items, direct URL, barcode scan all load correct step
- [ ] OrderContext loads from API on any step entry (step-independence verified)
- [ ] Progress bar reflects step completion accurately
- [ ] Save & Next advances; Save stays on current step
- [ ] Auto-save triggers every 30s on dirty forms
- [ ] Browser navigation warning on unsaved changes

### 14.2 Functional — Clinical Workflow

- [ ] Clinical mode shows patient section, hides site/standard/conditions
- [ ] Patient search, inline results, selected card all functional
- [ ] Provider search follows same pattern
- [ ] Test/panel selection paginated with filters

### 14.3 Functional — Environmental Workflow (merged from S-03)

- [ ] Environmental mode shows site section, standard selection, sample type checklist, collection conditions; hides patient section
- [ ] Site search/create follows patient search pattern (search, inline results, selected card, new site form)
- [ ] Standard ComboBox filters to ACTIVE only; typeahead by name, issuing body, regulation number
- [ ] Default program standard pre-populates ComboBox when configured
- [ ] Selected Standard Card shows name, issuing body, regulation, version, date, linked test count
- [ ] "View Thresholds" opens inline accordion
- [ ] Sample type checklist from standard's `applicableSampleTypes` after standard selection
- [ ] "Add Other Sample Type" opens system-wide ComboBox with "Not in Standard" tag for overrides
- [ ] Selecting sample types triggers test auto-suggestion filtered by standard + types
- [ ] Suggested tests pre-selected with "Suggested" tag; user can modify
- [ ] InlineNotification shows standard name, sample type count, suggested test count
- [ ] Collection conditions fields load per selected program; default set when no config
- [ ] Collection Method required; other fields optional
- [ ] Regulatory reference auto-populates from standard; "Override" enables manual editing
- [ ] Site metadata (GPS, zone) pre-populates downstream fields
- [ ] Standard + site + conditions persist in OrderContext across all steps
- [ ] Order context card on Steps 2–4 shows environmental data (site, standard, View Thresholds)
- [ ] Sample types from Step 1 auto-populate Step 2 — no redundant selection
- [ ] Collection conditions carry forward to Step 2 (editable)
- [ ] GPS capture on Step 2 within conditions section
- [ ] Environmental QA completeness checks: site, standard, GPS, conditions, collection method
- [ ] QA review table shows Site and Standard columns for environmental orders
- [ ] Dashboard search by site code/name works
- [ ] Dashboard Compliance Standard filter works
- [ ] Dashboard Patient/Site column shows site info + standard tag for environmental orders
- [ ] Changing standard clears sample types + re-suggests tests (with confirmation)
- [ ] Clinical orders unaffected by all environmental changes

### 14.4 Functional — Edit Order

- [ ] Barcode scan loads full order (including environmental context) in read-only mode
- [ ] Edit button enables editing on current step only
- [ ] Test status indicators (results, validated, cancelled) visible
- [ ] Admin-only cancel for tests with results; mandatory NCE
- [ ] Same 4-step screens used for new and edit workflows

### 14.5 Functional — Dashboard & Incoming

- [ ] Dashboard is default landing for "Add Order"
- [ ] External orders toggle with count badge
- [ ] Accept flow pre-populates Step 1
- [ ] Returned-from-QA highlighting with Fix Issue routing

### 14.6 Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Standard ComboBox loads within 500ms
- [ ] Test auto-suggestion completes within 1 second
- [ ] Dashboard search returns within 2 seconds
- [ ] All environmental fields stored with order for reporting (complianceContext API)
- [ ] Permissions enforced at UI and API layers
- [ ] WCAG 2.1 AA contrast, 32px touch targets, keyboard accessible, ARIA attributes

### 14.7 Integration

- [ ] S-01 compliance standards appear in order-time ComboBox
- [ ] S-02 site search works within order entry environmental section
- [ ] Order context card displays standard from S-01 on all workflow steps
- [ ] QA checks reference S-02 site data and S-01 standard data
- [ ] `complianceContext` API response consumable by S-05 (evaluation engine) and S-06 (Laporan Hasil)
- [ ] FHIR R4 order API extended with environmental fields

---

## 15. Resolved Decisions

| # | Question | Resolution | Status |
|---|----------|-----------|--------|
| 1 | Server-driven menu vs client-side submenu expansion? | Extend server-driven /rest/menu to support sub-items. Upcoming granular role creator enables per-screen permissions. | ✅ Resolved |
| 2 | Physician-facing app: shared components or API-only? | API-only. Physician app will likely run from same server with scoped UI. | ✅ Resolved |
| 3 | FHIR alignment? | FHIR R4 native. Reuse existing endpoint, extend as needed. | ✅ Resolved |
| 4 | How do clinical and environmental workflows differ? | Environmental skips patient section entirely. Requestor same mechanism. Sample types from test catalog per lab unit. | ✅ Resolved |
| 5 | Where do environmental requirements live? | Merged into this spec (v2.0). S-03 superseded. | ✅ Resolved (v2.0) |
| 6 | How does environmental context flow across steps? | Via OrderContext (§4.3). Loaded from API on any step entry. Environmental fields read-only on Steps 2–4 except collection conditions on Step 2. | ✅ Resolved (v2.0) |

### Remaining Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 7 | Data migration strategy for existing in-progress orders during transition? | Engineering | ⏳ Deferred |

---

## 16. Timeline Considerations

### Phase 1: Foundation (Weeks 1–4)

- Implement OrderContext shared state and routing infrastructure
- Build Step 1 (Enter Order) with clinical workflow fields
- Add lab unit workflow type configuration to admin settings

### Phase 2: Collection & Storage (Weeks 5–8)

- Build Step 2 (Collect Sample) with environmental field support
- Build Step 3 (Label & Store) with lab number generation
- Implement wizard navigation and progress bar

### Phase 3: Environmental Integration (Weeks 7–10, overlaps Phase 2)

- Add environmental sections to Step 1: site search/create, compliance standard selection, sample type checklist, test auto-suggestion, collection conditions
- Wire OrderContext environmental fields through Steps 2–4
- Add environmental completeness checks to QA Review
- Extend dashboard with site/standard search and filters

### Phase 4: QA & Polish (Weeks 11–14)

- Build Step 4 (QA Review) with completeness dashboard
- Implement audit trail across all steps
- Integration testing with S-01, S-02, FHIR interfaces
- User acceptance testing with lab partners

### Dependencies

- Backend REST API updates for step-level save/retrieve (Engineering)
- Server-driven menu system update to support expandable sub-items (Engineering)
- Lab unit configuration schema migration (DBA/Engineering)
- S-01 Compliance Standards Administration — must be implemented for environmental standard selection
- S-02 Sampling Site Registry — must be implemented for site search/create
- S-04 Sample Type Domain Classification — recommended for workflow toggle

---

## Appendix A: S-03 Cross-Reference (for traceability)

This appendix maps every former S-03 requirement to its location in the unified spec, confirming no requirements were lost in the merge.

| Former S-03 ID | Description | Location in v2.0 |
|---|---|---|
| ENV-1-001 | Compliance Standard selection | §6.2.3, ENV-1-001 |
| ENV-1-002 | Site-type standard prioritization | §6.2.3, ENV-1-002 |
| ENV-2-001 | Sample type selection & test auto-suggestion | §6.2.3, ENV-2-001 |
| ENV-2-002 | Parameter group organization | §6.2.3, ENV-2-002 |
| ENV-3-001 | Collection conditions (configurable per program) | §6.2.3, ENV-3-001 |
| ENV-3-002 | Conditions carry-forward to Step 2 + sample type auto-population | §6.3, ENV-3-002 |
| ENV-4-001 | Regulatory reference field | §6.2.3, ENV-4-001 |
| ENV-5-001 | Site metadata auto-population | §6.2.3, ENV-5-001 |
| ENV-6-001 | Standard persistence in context card | §4.3 (OrderContext) + NAV-5 |
| ENV-6-002 | Standard version snapshot for evaluation | §7.1 (Data Model, `complianceStandardVersion`) + BR-002 |
| ENV-7-001 | Dashboard search by site | §6.9, DSH-2 (unified) |
| ENV-7-002 | Dashboard compliance standard filter | §6.9, DSH-7 (unified) |
| ENV-7-003 | Dashboard Patient/Site column | §6.9, DSH-4 (unified) |
| ENV-8-001 | QA environmental completeness checks | §6.5, ENV-8-001 |
| ENV-8-002 | QA review table Site + Standard columns | §6.5, ENV-8-002 |
| ENV-9-001 | Reporting data requirements | §7.1 (Data Model) + §8.5 (`complianceContext` API) |
| ENV-9-002 | `complianceContext` API response | §8.5 |
