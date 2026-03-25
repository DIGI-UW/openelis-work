# Functional Requirements Specification
## Sample Collection Process Redesign
### Decoupled Order Entry with Unified Clinical/Environmental Workflows

**OpenELIS Global**
Version 1.0 | March 2026

| | |
|---|---|
| **Author** | Casey I. / I-TECH UW |
| **Status** | Draft |
| **Audience** | Engineering, Product, Lab Stakeholders |

---

## 1. Problem Statement

The current OpenELIS Global sample collection process is implemented as a single monolithic form (*AddOrder.js*) where order entry, sample collection, labeling/storage, and QA are tightly coupled into one workflow. In practice, these steps are frequently performed by **different people at different times** — a physician or clerk enters the order, a phlebotomist collects the sample, a lab technician labels and stores it, and a QA officer reviews it. The monolithic design forces all actors to navigate the same complex form, creating bottlenecks and data entry errors.

Additionally, OpenELIS currently maintains **separate workflows for clinical and environmental/veterinary samples**, despite sharing significant overlapping logic. This duplication increases maintenance burden and makes it difficult for labs that process both types of samples to operate efficiently.

**Impact of not solving:** Continued workflow inefficiency, higher error rates in sample tracking, inability to support physician-facing order entry, and ongoing code duplication across clinical/environmental modules.

---

## 2. Goals

1. **Decouple the sample lifecycle into 4 independent steps** (Enter Order, Collect Sample, Label & Store, QA) each accessible as its own submenu item under "Add Order," reducing average form completion time by 40%.
2. **Enable wizard-with-shortcuts navigation** so that the default sequential flow guides new users, while experienced users can jump directly to any step from the sidebar.
3. **Unify clinical and environmental sample workflows** into a single flexible pipeline controlled by lab unit configuration, reducing duplicated frontend components by 60%.
4. **Lay the groundwork for a physician-facing order entry app** by making the "Enter Order" step self-contained with a clean API contract.
5. **Maintain full backward compatibility** with existing FHIR-based integrations and the current REST API for lab number generation, provider lookup, and test catalogs.

---

## 3. Non-Goals (Out of Scope)

- **Building the physician-facing app itself** — this FRS covers making the order entry step decoupled enough to support it, not the external app.
- **Migrating the legacy Java/JSP UI** — changes target the React frontend only.
- **Changing the test catalog or panel management** — test/panel availability remains unchanged; only which metadata fields display is affected by the workflow toggle.
- **Barcode printer hardware integration** — the Label & Store step will generate label data but hardware integration is a separate effort.
- **Role-based access control changes** — permissions for who can access which steps will follow the existing OpenELIS permission model via the server-driven menu system. Note: an upcoming granular role creator feature will enable per-screen permissions in the future.

---

## 4. Architecture Overview

### 4.1 Current State

Today, the Add Order flow is a single React component tree rooted at *AddOrder.js* which renders PatientInfo, AddSample (with SampleType children), OrderEntryAdditionalQuestions, OrderReferralRequest, and OrderResultReporting as tightly coupled child components. All state is managed via useState hooks in the parent, creating a single massive form submission. The sidebar menu is server-driven via */rest/menu* and currently provides a single "Add Order" entry point.

### 4.2 Proposed State

The monolithic form will be decomposed into four independently routable step-components, unified by a shared **OrderContext** that holds the order ID and status. The sidebar "Add Order" menu item becomes an expandable parent with four child items:

| Step | Route | Primary Actor | Key Data |
|------|-------|---------------|----------|
| **1. Enter Order** | /order/enter | Physician / Clerk | Patient/subject info, requester, site, tests, priority |
| **2. Collect Sample** | /order/collect | Phlebotomist / Collector | Sample type, collection date/time, collector ID, GPS, rejection |
| **3. Label & Store** | /order/label | Lab Technician | Lab number, barcode gen, storage location, temperature |
| **4. QA Review** | /order/qa | QA Officer | Completeness check, rejection handling, non-conformity flags |

### 4.3 Workflow Toggle — Lab Unit Configuration

Each lab unit (organizational unit in OpenELIS) will gain a new configuration property controlling which workflow type(s) are enabled. This toggle affects **which form fields appear** during the Enter Order and Collect Sample steps. It does ***not*** change available tests or the QA pipeline.

| Mode | Fields Shown | Fields Hidden |
|------|-------------|---------------|
| **Clinical** | Patient demographics (name, DOB, sex, national ID), clinical diagnosis, referring physician, insurance/payment | Site/environment description, GPS coordinates, environmental conditions. All location fields optional. |
| **Environmental** | Location hierarchy (Region/District/Town-Village from OpenELIS locations), GPS coordinates, environmental conditions, collection site description, regulatory reference. Requestor handled same as clinical but not necessarily a clinical provider. | Patient demographics, patient photo, clinical diagnosis, insurance/payment |
| **Both (Unified)** | All fields shown, organized into collapsible sections. User selects sample category (Clinical / Environmental) per sample line, and the form adapts dynamically. | None hidden; sections collapse contextually based on sample category selection |

---

## 5. User Stories

### 5.1 Physician / Ordering Clerk

- **US-1:** As a physician, I want to enter a lab order with patient info and requested tests so that the lab can prepare for sample collection without me being present.
- **US-2:** As an ordering clerk, I want to see only the fields relevant to my lab unit's workflow type (clinical vs environmental) so I'm not overwhelmed by irrelevant fields.
- **US-3:** As a physician, I want the order entry form to work as a standalone step so a future physician-facing app can use the same interface.

### 5.2 Sample Collector / Phlebotomist

- **US-4:** As a phlebotomist, I want to look up an existing order and record sample collection details (type, time, conditions) without re-entering order information.
- **US-5:** As an environmental sample collector, I want to record GPS coordinates and site conditions for my collection so the data meets regulatory requirements.
- **US-6:** As a collector, I want to reject a sample at collection time with a reason code so the order can be flagged for re-collection.
- **US-12:** As a sample collector, I want to import pre-collected samples from a CSV file so I can efficiently register batches of samples that arrive in storage containers (e.g., 10×10 boxes, 96-well plates).
- **US-13:** As a sample collector, I want to download a CSV template matching my container format so I can prepare sample data offline before uploading.
- **US-16:** As a sample collector, when adding a test to a sample, I want to choose whether to add it to an existing compatible sample or collect a new sample, so I can accurately reflect when separate draws are needed.
- **US-17:** As a sample collector, I want to print additional specimen labels during collection (e.g., if I drew more than expected or need a different sample type) without navigating away from the collection step.

### 5.3 Lab Technician

- **US-7:** As a lab technician, I want to scan or enter lab numbers and assign storage locations so I can track where each sample is physically stored.
- **US-8:** As a lab technician, I want to generate and print barcoded labels from the Label & Store step so I can label containers without switching screens.

### 5.4 QA Officer

- **US-9:** As a QA officer, I want a dedicated review screen showing order completeness and flagging any non-conformities so I can approve or reject before testing begins.
- **US-10:** As a QA officer, I want to see the full audit trail (who did what, when) across all four steps so I can verify chain of custody.
- **US-14:** As a QA officer, I want to report a Non-Conforming Event (NCE) for a specific sample or the entire order from the QA Review step, so that quality issues are formally documented and trigger corrective action workflows.
- **US-15:** As a QA officer, I want the system to automatically set an order to 'Rejected' status when all its samples have been rejected, so that fully rejected orders are clearly flagged without requiring manual status changes.

### 5.5 Lab Administrator

- **US-11:** As a lab administrator, I want to configure each lab unit's workflow type (Clinical, Environmental, or Both) in the admin settings so the order forms automatically show the right fields.

### 5.6 Order Dashboard & Incoming Orders

- **US-22:** As a lab technician, I want a single dashboard showing all my in-progress orders so I can quickly see what needs attention and continue where I left off, without searching separately for each order.
- **US-23:** As a lab technician, I want to search for orders within my lab by patient name, lab number, or national ID, and optionally include incoming external orders in the same search, so I don't have to navigate to a separate screen.
- **US-24:** As a lab receptionist, I want to accept incoming orders from EMRs and referral labs into our workflow, choosing whether to keep the referring lab's number or generate a new one, so our lab can track the order in our own system.
- **US-25:** As a lab manager, I want to see which orders have been returned from QA highlighted in the dashboard so I can prioritize fixing quality issues.

### 5.7 Edit Order Workflow

- **US-18:** As a lab technician, I want to scan or enter a lab number to load an existing order in read-only mode so I can review order details without accidentally changing them, and press 'Edit' when I intentionally need to modify something.
- **US-19:** As a lab technician, I want to easily see which tests on an order have results entered or have been validated so I understand the current state before making changes.
- **US-20:** As a lab administrator, I want to be the only role that can cancel tests which already have results entered, so that result data is protected from accidental removal by non-admin staff.
- **US-21:** As a QA officer, I want any cancellation of a test that has results to require an audit trail entry (NCE) so that the reason for discarding results is formally documented and traceable.

---

## 6. Functional Requirements

### 6.1 Navigation & Step Decoupling

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| NAV-1 | **P0** | The sidebar menu shall display 'Add Order' as an expandable parent with 4 child items: Enter Order, Collect Sample, Label & Store, QA Review. | Menu renders all 4 items; each routes to its own page; items highlight correctly. |
| NAV-2 | **P0** | Each step shall be independently routable via /order/enter, /order/collect, /order/label, /order/qa. | Direct URL navigation loads the correct step without requiring prior steps. |
| NAV-3 | **P0** | A step-indicator (progress bar) shall appear at the top of each step page showing status of all 4 steps for the current order. | Progress bar shows completed (green), in-progress (blue), pending (gray) states. |
| NAV-4 | P1 | The wizard flow shall auto-advance to the next step on successful save, with an option to stay on the current step. | 'Save & Next' and 'Save' buttons both present; Save & Next navigates forward. |
| NAV-5 | P1 | Each step page shall display a summary card of the order context (lab number, patient/subject, tests, status) to orient the user. | Summary card visible and populated on all 4 step pages. Lab number displayed prominently. |
| NAV-6 | **P0** | A barcode scan / lab number search bar shall appear at the top of every step page. Scanning a barcode or manually entering a lab number loads that order into the current step in read-only mode (see EDT-1). Lab numbers can be scanned from printed labels or entered manually. This replaces the separate 'Edit Order' screen. | Barcode scan field accepts scanner input and manual entry. Valid lab number loads order data into the current step in read-only mode. Invalid lab number shows error. Replaces Edit Order menu item. |
| NAV-7 | **P0** | The 'Edit Order' sidebar menu item shall be deprecated and replaced by the lab number scan/search functionality present on every step. | Edit Order menu item removed or marked deprecated. All order editing done via scanning lab number on the relevant step. |
| NAV-8 | **P0** | After a barcode scan or lab number entry, the system shall provide immediate inline feedback: a success notification (green) showing order summary (lab number, patient name, status) if found, or an error notification (red) if not found. Feedback shall appear within 500ms of scan completion. | Success scan shows green inline notification with order summary. Error scan shows red inline notification with message. Notification appears within 500ms. Notification auto-dismisses after 5 seconds or on next scan. |

### 6.2 Step 1 — Enter Order

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| ORD-1 | **P0** | Enter Order shall assign a Lab Number at the top of the form (auto-generated or manual entry) to enable tracking across all subsequent steps. The lab number shall be the primary identifier for the order throughout the system. | Lab number generated per existing lab number rules. Displayed prominently at top of Step 1. Carried forward to all subsequent steps in context card and barcode scan. |
| ORD-1a | **P0** | Enter Order shall include a Print Labels section (below lab number), collapsed by default and expandable on click. Configurable label types with default quantities loaded from lab configuration include: Order Label (Lab No + Order Details), Sample Label (Sample No + barcode), Slide Label (Lab No only from this view), Block Label (Lab No only from this view), Freezer Label (Sample No + storage info), and others as configured. Sample Labels shall be disabled (grayed out) until at least one specimen has been added to the order. When enabled, the Sample Label quantity is per specimen on the order. Each type has an adjustable quantity and individual Print button, plus a 'Print All Labels' action. | Print Labels section collapsed by default; expandable on click. Label types and default quantities loaded from site config. Sample Label row disabled until specimen added. Quantities editable. Slide and Block labels from Enter Order contain Lab Number only. Individual and bulk print actions available. Label printing also available on Step 3. |
| ORD-1b | **P0** | Enter Order shall capture: requester info, site/department, priority, and subject information (patient for clinical; location hierarchy for environmental). Requested tests/panels and sample type are OPTIONAL at this step and can be specified later during collection. | All fields save to the order entity and are retrievable by later steps. Order can be saved without tests selected. |
| ORD-2 | **P0** | Clinical workflow shows patient search/entry (local + Client Registry if configured). Environmental workflow skips patient entirely and instead shows location hierarchy (Region / District / Town-Village) from the existing OpenELIS location structure, plus GPS and site description. All environmental location fields are optional. | Switching workflow mode changes visible sections without page reload. Environmental location fields have no required indicators. |
| ORD-3 | **P0** | When lab unit is set to 'Both', a sample category toggle (Clinical / Environmental) shall appear, showing/hiding the patient vs. location sections dynamically. If the lab unit supports only one workflow type (e.g., Clinical only), the toggle shall not be shown — the system shall automatically use that single workflow type. | Toggle present only when lab unit is 'Both'; choosing a category shows/hides appropriate field sections. Toggle hidden when only one workflow type is configured; that type is auto-applied. |
| ORD-4 | P1 | Enter Order shall support saving as Draft so physicians can return to complete later. | Draft orders appear in a 'My Drafts' list; re-opening restores all entered data. |
| ORD-5 | **P0** | The Enter Order step shall use the existing FHIR R4 order API endpoint for data exchange, extending it as needed. The API must follow FHIR R4 ServiceRequest profiles. | Existing FHIR order endpoint reused; documented in OpenAPI spec; returns order ID on creation. |
| ORD-6 | P1 | Provisional clinical diagnosis field shall support ICD-10/ICD-11 code lookup. | Typeahead search returns matching ICD codes; selected code saved with order. |
| ORD-7 | **P0** | Test/panel selection shall show all available tests (from test catalog) with dropdown filters for lab unit and sample type. Lists must be paginated for performance. | Panel and test lists paginated (default page size configurable). Filter dropdowns narrow results. All tests available initially. |
| ORD-8 | P1 | Provider search shall be triggered by entering part of a last name, first name, or phone number and pressing a Search button. Results appear inline (not in a modal) below the search fields. If multiple providers match, an inline disambiguation table shall list all matches with a Select button per row. Selecting a provider populates a read-only selected provider card. Provider search queries a provider registry if configured, otherwise searches previously entered providers. Site Name search follows the same pattern — entering a name triggers search, and multiple matches show inline disambiguation. Environmental requestors use the same search/entry mechanism but are not necessarily clinical providers. | Provider search fields (last name, first name, phone) with Search button. Inline results table shows matching providers. Select button per row. Selected provider card shown after selection. Site name search with inline disambiguation if multiple matches. Works for both clinical and environmental workflows. |
| ORD-8a | **P0** | The Department / Ward / Unit field shall be disabled and display "Select facility first..." until a facility (site) has been selected. Once a facility is selected, the system shall check whether that facility has subunits (departments, wards, units) configured. If subunits exist, the Department field shall become enabled and populated with the facility's subunits. If the selected facility has no subunits, the Department field shall remain hidden or display "No subunits available" in a disabled state. Clearing the selected facility shall reset the Department field back to its disabled initial state. | Department field disabled by default with "Select facility first..." placeholder. After facility selection: if subunits exist, dropdown enables and populates with subunit list plus count indicator; if no subunits, field stays disabled with "No subunits available." Clearing facility resets department field. |
| ORD-9 | P1 | When a patient is selected (clinical workflow), a summary card shall display the patient's photo (if available in their record), demographics, and identifiers. | Selected patient card shows photo placeholder or actual photo, name, DOB, gender, IDs, and data source. |
| ORD-10 | **P0** | The Program field shall be a typeahead dropdown combo (ComboBox) that allows users to type to filter or select from the full list. Typing narrows the dropdown to matching programs; selecting from the list or pressing Enter commits the choice. When a program is selected, an 'Additional Order Information' section shall display program-specific fields configured for that program. The section appears/disappears dynamically based on the selected program. Programs include both clinical programs (e.g., VL Program, EID Program, TB Program, COVID-19) and environmental programs (e.g., Lead in Well Water, Parasite Monitoring, Water Quality Monitoring). When the workflow toggle is set to Environmental, the system shall auto-select a default environmental program (configurable per lab unit; e.g., "Lead in Well Water") and display its additional fields immediately, reducing clicks. Switching to Clinical clears the environmental default if no program was explicitly chosen. For labs where a program is commonly used (e.g., VL Program for clinical), it may be pre-selected by default. | Program field is a typeahead combo: typing filters the dropdown list; arrow keys navigate; Enter selects. Selecting a program dynamically shows the correct additional fields. Changing program hides previous and shows new fields. Environmental programs appear in the list alongside clinical programs. Toggling to Environmental auto-selects the configured default environmental program. Fields are configurable per program in admin settings. Data saves to the order and is available in subsequent steps. |
| ORD-11 | **P0** | The 'New Patient' inline form shall match the existing OpenELIS Add/Modify Patient form, including: photo upload, Unique Health ID, National ID*, Last Name, First Name, Primary Phone, Gender* (Male/Female radio), Date of Birth*, Age/Years/Months/Days fields, and collapsible sections for Emergency Contact Info (last name, first name, email, phone) and Additional Information (Town, Street, Camp/Commune, Region dropdown, District dropdown, Education dropdown, Marital Status dropdown, Nationality dropdown, Specify Other Nationality). | All fields match existing Add/Modify Patient form. Collapsible sections expand/collapse. Save creates patient and auto-selects. Required fields (*) enforce validation. |

### 6.3 Step 2 — Collect Sample

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| COL-1 | **P0** | Collect Sample shall display a 'Requested Tests' table showing all tests and panels ordered in Step 1 with compatible sample types from the test catalog. Panels are displayed as group header rows with '+ [Type] (all)' buttons that assign all panel tests to a sample at once. Individual tests within a panel have checkboxes allowing deselection from the panel on this order. Standalone tests show their own sample type buttons. Click behavior: if no matching sample type exists, a new sample is created directly. If one or more matching samples exist, an inline popover lets the user choose: add the test to an existing sample of that type, or create a new sample (separate draw). A test or panel can be assigned to multiple samples when separate draws are needed (e.g., two Plasma draws for the same test). Each sample card shall display its assigned tests using the existing OpenELIS test-to-sample assignment format. | Requested tests table shows panels as group headers with '(all)' buttons and individual tests with checkboxes. When no match exists, new sample created directly. When match exists, inline popover offers existing sample(s) or new sample choice. Tests can be assigned to multiple samples. Panel tests can be deselected via checkbox. Sample cards display assigned tests using existing OE format. |
| COL-2 | **P0** | Each sample card in Collect Sample shall include: sample type dropdown, quantity (2-part: numeric value + Unit of Measure dropdown from test catalog), and collection conditions. An optional 'Collection Data' section contains: collection date, collection time, and collector (name or badge ID) — these are filled when the specimen is physically collected and are not required. A 'Received at Lab' section contains: received date and received time, both auto-populated from the server clock when the sample record is opened, and editable by the user. If a sample type and test were specified in Step 1, those fields shall be pre-filled. | All fields save and associate with the correct order and sample line. Pre-filled fields are editable. Collection date/time/collector are optional. Received date/time auto-populate from server time and are editable. Quantity UOM list populated from test catalog for the selected sample type. |
| COL-3 | **P0** | Environmental collections shall include GPS capture (manual entry or device geolocation) and environmental conditions. | GPS coordinates save to sample; geolocation API used when available. |
| COL-4 | **P0** | Collector shall be able to report a Non-Conforming Event (NCE) for a specific sample via a collapsed inline 'Report NCE' section on each sample card. The NCE section replaces the previous 'Rejected?' dropdown. NCE fields include: NCE type (from configured list), severity (Minor/Major/Critical), description, and a checkbox to mark the sample as Rejected. Full NCE details and corrective action workflow are specified in the NCE rewrite module. | NCE report section appears collapsed on each sample card. Expanding shows NCE type, severity, description fields. Checking 'Rejected' marks sample as rejected. NCE data saves with sample. If all samples rejected, order enters Rejected state. |
| COL-5 | P1 | Multiple samples per order shall be supported with independent collection tracking. | Each sample line tracks its own collection status independently. |
| COL-11 | **P0** | When clicking a sample type button in the Requested Tests table: if no matching sample exists, a new sample shall be created directly with the test assigned. If one or more matching samples of that type exist, an inline popover shall appear listing each existing sample (with its current test assignments) plus a 'New [Type] sample (separate draw)' option. The user selects where to assign the test and confirms. A single test or panel may be assigned to multiple samples when separate draws are required (e.g., two Plasma draws, or one test split across multiple samples). Panel-level '+ [Type] (all)' buttons shall follow the same choose-or-create logic for all panel tests at once. | No match: new sample created directly. Match exists: inline popover lists existing samples plus new-sample option. User selects and confirms. A test/panel can be assigned to multiple samples. Panel buttons follow same choose-or-create logic. Tests can be deselected from panel via checkbox. |
| COL-12 | **P0** | Collect Sample shall provide an option to print additional specimen labels for any sample (e.g., if more volume was drawn than expected, or a different sample type is needed). A 'Print Labels' button shall appear on each sample card, and a 'Print More Sample Labels' button shall be available at the section level. | Per-sample 'Print Labels' button prints specimen labels for that sample. Section-level 'Print More Sample Labels' button opens label printing for additional/new specimens. Labels use same label config as Steps 1 and 3. |
| COL-6 | **P0** | Collect Sample shall provide downloadable CSV templates for batch sample import. Templates shall be available for: Standard (flat list), 10×10 Box Layout (positional grid), and 96-Well Plate layout. | Each template downloads as a .csv file with pre-filled headers matching the required fields (position, sample type, collection date/time, volume, UOM, collector). Box/plate templates include position coordinates. |
| COL-7 | **P0** | Collect Sample shall accept CSV file upload (drag-and-drop or file picker, max 5 MB) and parse the contents into a preview table with row-level validation. | Upload accepts .csv files; preview table shows all parsed rows with status indicators (✓ Valid, ⚠ Warning, ✗ Error) per row. Validation checks: required fields present, sample type exists in catalog, date format valid, volume is numeric. |
| COL-8 | **P0** | The CSV preview shall display a summary (total samples parsed, valid count, warning count, error count) and allow the user to import only valid samples or fix issues before importing. | 'Import N Valid Samples' button imports only rows passing validation. 'Fix Warnings' option highlights rows needing correction. User can edit individual cells in the preview before importing. |
| COL-9 | P1 | Imported samples from CSV shall be added to the order's sample list and treated identically to manually entered samples for all subsequent steps (Label & Store, QA Review). | After CSV import, samples appear in the order's sample list with all fields populated from the CSV. Samples are editable and proceed through normal workflow. |
| COL-10 | P2 | CSV import shall support container position mapping, preserving the physical position (row/column or grid coordinate) of each sample within its storage container. | Position data from CSV (e.g., A1-H12 for well plates, 1-1 through 10-10 for boxes) saves to sample record and is available in Label & Store step. |

### 6.4 Step 3 — Label & Store

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| LBL-1 | **P0** | Label & Store shall display the order's lab number (assigned in Step 1) and collected samples. The lab number is read-only at this step since it was assigned during order entry. | Lab number displayed in context card. Not editable on this step. |
| LBL-2 | **P0** | Label & Store shall include a Print Labels section showing the same configurable label types as Step 1 — Order Label (Lab No + Order Details), Sample Label (Sample No + barcode), Slide Label (Sample No + details), Block Label (Sample No + details), Freezer Label (Sample No + storage info) — loaded from lab configuration, with adjustable quantities and individual/bulk print actions. Sample Label quantity is per specimen on the order. This allows labels to be reprinted or additional labels to be printed at this stage. | Same label type config as Step 1 including Freezer Label. Label names use 'Sample No' (not 'Specimen'). Sample Label qty is per specimen. Quantities adjustable. Print actions functional. Note indicates labels can also be printed from Step 1. |
| LBL-3 | **P0** | Storage assignment shall use the existing OpenELIS 'Assign Storage Location' interface rendered inline (not as a modal) and auto-expanded. It shall include: sample info card (Sample Item ID, Sample Type, Status), Quick Assign via barcode scan, location search with 'Location +' button to create new locations, optional position field (e.g., A5, 1-1, RED-12), and optional condition notes textarea. There is no separate 'Assign' button — storage locations are assigned when the user clicks Save or Save & Next. | Inline storage form matches existing OpenELIS storage modal fields. No separate Assign button. Storage location is saved when the screen is saved (Save or Save & Next). Barcode scan field accepts scanner input. Location search queries existing storage locations. |
| LBL-4 | P2 | Position field in storage assignment shall accept container position formats (e.g., A5 for well plates, 1-1 for grid boxes, RED-12 for named positions) and validate against the selected storage location's configuration. | Position saves to sample record; format validated if storage location has defined positions. |

### 6.5 Step 4 — QA Review

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| QA-1 | **P0** | QA Review shall display a completeness dashboard showing which steps are complete, incomplete, or have issues. | Dashboard shows green/yellow/red indicators per step per sample. |
| QA-2 | **P0** | QA Review shall display a Sample Review table listing each sample with its type, assigned tests (using existing OE format), collection status, any NCE reports, and action buttons including 'Report NCE' per sample. | Sample review table shows all samples with test assignments, status, and NCE column. Per-sample Report NCE button available. |
| QA-3 | **P0** | QA Review shall include a collapsed inline 'Report Non-Conforming Event (NCE)' section that allows the QA officer to report an NCE for a specific sample or the entire order. NCE fields include: scope (Specific Sample / Entire Order), sample selection, NCE category (Pre-analytical, Analytical, Post-analytical, Documentation, Safety), NCE type, severity, description, and a checkbox to mark affected sample(s) as Rejected. Full NCE details and corrective action workflow are specified in the NCE rewrite module. | Collapsed NCE section expands on click. Scope selector switches between sample-level and order-level. All NCE fields populate correctly. Submitting saves NCE and optionally marks samples as rejected. |
| QA-4 | **P0** | If ALL samples in an order are marked as Rejected (via NCE reports from Step 2 or Step 4), the order shall be automatically saved in a 'Rejected' state. No further actions are required for a fully rejected order, but optional actions (storage, labeling, etc.) can still be performed if needed for archival purposes. | When last non-rejected sample is rejected, order status changes to Rejected. Rejected order can still have storage and labeling performed. Dashboard shows rejected state clearly. |
| QA-5 | **P0** | QA officer shall be able to approve the order for testing or reject it back to a specific previous step. The reject action shall include a step dropdown selector allowing the QA officer to choose which step to return to (Enter Order, Collect Sample, or Label & Store). The rejected order shall appear in the target step's queue with a 'Returned from QA' indicator. | Approve advances order to testing pipeline. Reject shows step dropdown (Step 1/2/3). Selecting a step and confirming navigates order back to that step's queue. Returned orders display 'Returned from QA' indicator. |
| QA-6 | P1 | Full audit trail shall be visible showing all actions across all 4 steps with timestamps and actor IDs. | Audit log loads with chronological entries; filterable by step and actor. |

### 6.6 Lab Unit Workflow Configuration

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| CFG-1 | **P0** | Lab Unit admin settings shall include a 'Workflow Type' dropdown with options: Clinical, Environmental, Both. | Dropdown present in lab unit edit form; saves to lab unit configuration. |
| CFG-2 | **P0** | Changing the workflow type shall immediately affect which form fields appear on Enter Order and Collect Sample for that unit. | After saving config change, forms dynamically show/hide correct field groups. |
| CFG-3 | P1 | A preview/summary of which fields are enabled shall display in the admin panel when configuring workflow type. | Hovering or expanding shows a field list per workflow type. |
| CFG-4 | P2 | Custom field groups beyond Clinical/Environmental may be defined per lab unit. | Admin can create custom field group; fields appear in order form for that unit. |

### 6.7 Cross-Cutting Requirements

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| XC-1 | **P0** | All step pages shall implement auto-save or, at minimum, an unsaved-changes warning. Periodic auto-save shall save to draft state every 30 seconds when the form is dirty. A visible save-status indicator shall show 'Saved', 'Saving...', or 'Unsaved changes' state. Navigating away from a dirty form shall trigger a browser confirmation dialog. This is critical for environments with unreliable power and connectivity. | Auto-save triggers every 30s on dirty forms. Save status indicator visible on all steps. Browser navigation warning fires on unsaved changes. Auto-saved data recoverable on return. Works in low-connectivity environments (queues saves). |
| XC-2 | P1 | All entity search patterns (Patient, Provider, Site) shall use a unified search interaction model: dedicated search fields, a Search button, inline results table with Select buttons per row, and a read-only selected entity card displayed after selection. This applies to both clinical and environmental workflows. | Patient, Provider, and Site searches all follow the same interaction pattern. Search fields + button + inline table + selected card. Consistent across clinical and environmental workflows. |
| XC-3 | **P0** | All text shall meet WCAG 2.1 AA contrast requirements. Helper text and explanatory notes shall use a minimum contrast ratio of 4.5:1 against their background (var(--cds-gray-60) or darker on white backgrounds). Disabled states shall use text color with strikethrough or '(unavailable)' label rather than opacity reduction. | All body text ≥ 4.5:1 contrast ratio. Helper text uses cds-gray-60 (#6f6f6f) minimum. No opacity-based disabled states. Disabled rows use cds-gray-50 text with strikethrough. |
| XC-4 | **P0** | All interactive elements (buttons, checkboxes, radio buttons, links) shall have a minimum touch target size of 32px height (Carbon small size). Buttons shall use min-height: 32px with appropriate padding. Checkboxes and radio buttons shall use Carbon component wrappers with full-width label click areas. | All buttons ≥ 32px tall. Checkboxes/radios use Carbon components with label click areas. No interactive elements below 32px touch target. Verified on tablet-sized screens. |
| XC-5 | **P0** | All interactive elements shall include appropriate ARIA attributes for screen reader accessibility. Progress stepper shall use aria-label and role attributes. Collapsible sections shall use role='button', tabindex, aria-expanded attributes. Popovers shall include focus traps and aria-live region announcements. | Screen reader can navigate all steps. Stepper announces current step. Collapsible sections announce expanded/collapsed state. Popovers trap focus and announce content. |
| XC-6 | **P0** | All interactive elements shall be keyboard-accessible with visible focus indicators. Focus indicators shall use Carbon's focus ring style (box-shadow: 0 0 0 2px var(--cds-blue-60)). All collapsible sections, buttons, and form controls shall be reachable via Tab key. Enter/Space shall activate buttons and toggle collapsibles. | All interactive elements reachable via Tab. Visible focus ring on all focused elements. Enter/Space activates controls. No keyboard traps. Tab order follows visual reading order. |

### 6.8 Edit Order Workflow

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| EDT-1 | **P0** | When an existing order is loaded via barcode scan or lab number entry, all step screens shall render in read-only mode by default. All form fields shall be visually greyed out / disabled. A prominent 'Edit' button shall appear in the page header. Pressing 'Edit' shall enable all editable fields for that step. This prevents accidental modifications while allowing intentional edits. | Scanned/loaded orders display in read-only mode. All fields greyed out. 'Edit' button visible in header. Clicking 'Edit' enables fields. Read-only mode is the default for all loaded orders. |
| EDT-2 | **P0** | In edit mode, each test in the Requested Tests table and Sample cards shall display a visual status indicator showing: (a) whether results have been entered for that test, (b) whether results have been validated, and (c) whether the test is active or cancelled. Status indicators shall use distinct icons and colors: e.g., 'Results Entered' (blue dot), 'Validated' (green checkmark), 'No Results' (gray dash), 'Cancelled' (red X with strikethrough). | Each test row shows result status indicator. Status icons clearly distinguish: no results, results entered, validated, cancelled. Status visible in both Requested Tests table and Sample cards. |
| EDT-3 | **P0** | Tests that have results entered or have been validated shall NOT be cancellable by standard (non-admin) users. The Cancel button for such tests shall be disabled with a tooltip explaining 'Admin role required to cancel tests with results.' Only users with the Lab Administrator role shall see an enabled Cancel button for tests with results. | Non-admin users cannot cancel tests with results (button disabled). Tooltip explains why. Admin users can cancel tests with results. Tests without results can be cancelled by any user with edit permission. |
| EDT-4 | **P0** | When an admin cancels a test that has results entered or validated, the system shall require a mandatory Non-Conforming Event (NCE) entry before the cancellation is committed. The NCE shall capture: reason for cancellation, NCE category, description, and the admin's identity. The cancellation and NCE shall be recorded in the audit trail. The test status shall change to 'Cancelled' with a visual strikethrough and the NCE reference number displayed. | Cancel action on test with results opens mandatory NCE form. NCE fields required before cancellation commits. Audit trail records cancellation with NCE reference, admin ID, and timestamp. Cancelled test shows strikethrough with NCE ref number. |
| EDT-5 | P1 | Tests without results may be cancelled by any user with edit permission on the order. Cancellation of tests without results does not require an NCE but shall still be recorded in the audit trail with the user's identity and timestamp. | Tests with no results show enabled Cancel button for edit-permitted users. Cancellation recorded in audit trail. No NCE required for tests without results. |
| EDT-6 | **P0** | The Edit Order workflow shall use the same 4-step screens (Enter Order, Collect Sample, Label & Store, QA Review) as the new order workflow. The user lands on whichever step they were viewing when they scanned the lab number. All existing order data shall be pre-populated in the fields. | Same screens used for new and edit workflows. Fields pre-populated with existing data. User lands on current step. Navigation between steps works normally in edit mode. |

### 6.9 Order Dashboard

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| DSH-1 | **P0** | The "Add Order" parent menu item shall navigate to an Order Dashboard as the default landing page. The dashboard shall display a unified table of orders filtered by default to "My In-Progress Orders" (orders the current user has touched that are not yet through QA). | Clicking "Add Order" in sidebar navigates to dashboard. Default view shows current user's in-progress orders. No extra clicks required to see the queue. |
| DSH-2 | **P0** | The dashboard shall include a search bar that searches within the lab's orders by patient name, lab number, national ID, or referring lab number. Search results replace the default table view. Clearing the search restores the default "My In-Progress" view. | Search field accepts text input. Search button triggers query. Results show in same table. Clear restores default view. |
| DSH-3 | **P0** | The dashboard shall include an "Include external sources" checkbox next to the search bar. When checked, search results also include incoming orders from EMRs and referral labs (replacing the current separate "Search Incoming Test Requests" screen). When unchecked (default), only internal lab orders are shown. | Checkbox unchecked by default. Checking it reveals incoming external orders in a visually distinct section (purple left border). Unchecking hides them. |
| DSH-4 | **P0** | The dashboard table shall display for each order: Lab Number (or Referring Lab Number for external), Patient/Subject name, Requesting Facility, Priority, Current Step (with mini step-progress bar showing completion of all 4 steps), Last Updated timestamp, and an Action button ("Continue" for in-progress, "Accept" for external, "Fix Issue" for returned-from-QA). | All columns rendered. Progress bar uses color coding: green=complete, blue=in-progress, yellow=awaiting review, red=issue/returned, gray=pending. Action buttons route to the appropriate step. |
| DSH-5 | **P0** | A prominent "+ New Order" button shall appear in the dashboard header. Clicking it navigates to Step 1 (Enter Order) with a blank form for creating a new order. | Button visible at top-right of dashboard. Clicking routes to Step 1 with empty form. |
| DSH-6 | **P0** | The dashboard shall include a barcode scan / lab number quick-lookup bar. Scanning or entering a lab number routes directly to the relevant step for that order (same behavior as NAV-6). | Scan bar present on dashboard. Valid scan routes to order's current step. Invalid shows inline error per NAV-8. |
| DSH-7 | P1 | The dashboard shall include filter dropdowns for: Status (In Progress, Awaiting QA, Completed, All), date range (From/To), and Priority. Filters apply to the displayed table without a page reload. | Filter dropdowns present. Changing filters updates table dynamically. Multiple filters can be combined. |
| DSH-8 | **P0** | Orders returned from QA (per QA-5) shall be highlighted in the dashboard with a distinct visual treatment (e.g., yellow background row, red "Returned from QA" status) and a "Fix Issue" action button that routes to the step the QA officer rejected it back to. | Returned orders visually distinct. "Returned from QA" label shows target step. "Fix Issue" routes to that step. |
| DSH-9 | P1 | The dashboard shall support pagination with configurable items per page (25, 50, 100). Default is 100. | Pagination controls present. Items per page dropdown works. Page navigation works. |

### 6.10 Incoming External Orders

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| INC-1 | **P0** | Incoming external orders (from EMRs via FHIR, referrals from other labs) shall be accessible via the dashboard's "Include external sources" toggle rather than a separate "Search Incoming Test Requests" screen. The existing screen shall be deprecated. | External orders appear in dashboard when toggle is checked. Old "Search Incoming Test Requests" screen deprecated or redirects to dashboard. |
| INC-2 | **P0** | Each incoming external order row shall display: Referring Lab Number, Patient/Subject, Requesting Facility, Priority, Source type (EMR name or "Referral"), Received date/time, and an "Accept" action button. External orders shall be visually distinguished from internal orders (e.g., purple "External" badge, distinct border). | All fields rendered. "External" badge visible. Purple left border distinguishes from internal orders. Accept button present. |
| INC-3 | **P0** | Clicking "Accept" on an incoming external order shall navigate to Step 1 (Enter Order) with the external order data pre-populated in the form fields. The user reviews/confirms the order details before proceeding. | Accept routes to Step 1. External order data pre-fills patient, requester, tests, and other available fields. User can modify before saving. |
| INC-4 | **P0** | On Step 1 for an accepted external order, the Lab Number field shall offer three options: (a) Scan a barcode to enter a lab number, (b) Enter a lab number manually, (c) Generate a new lab number per lab rules, or (d) "Use Current" button that keeps the referring lab's number as the lab number. The referring lab number shall always be stored as a reference field regardless of which option is chosen. | All four options available on Step 1 for external orders. "Use Current" button visible next to Generate. Referring lab number stored in a reference field. Lab number assigned via any method. |
| INC-5 | P1 | External orders shall indicate which steps have data pre-populated from the source system (e.g., if the EMR provided sample collection data, Step 2 fields are pre-filled). The user can review and modify pre-populated data on each step. | Steps with pre-populated data show a visual indicator (e.g., "Pre-filled from [source]"). Data is editable. Empty steps show as pending in the progress bar. |
| INC-6 | P1 | The dashboard "Include external sources" toggle shall show a count badge indicating how many incoming external orders are awaiting acceptance (e.g., "Include external sources (3)"). | Badge count visible next to the checkbox label when there are pending external orders. Count updates dynamically. |

---

## 7. Success Metrics

### 7.1 Leading Indicators (within 4 weeks of rollout)

- **Step completion rate:** >90% of started steps completed without navigation errors
- **Form field error rate:** <5% validation errors on the Enter Order step (down from current ~15%)
- **Multi-actor usage:** >30% of orders have different users completing different steps

### 7.2 Lagging Indicators (within 3 months)

- **Average order-to-testing time:** 30% reduction in time from order entry to QA approval
- **Sample rejection rate:** 20% reduction due to earlier QA flagging
- **Code duplication:** 60% reduction in duplicated clinical/environmental frontend components

---

## 8. Resolved Decisions

| # | Question | Resolution | Status |
|---|----------|-----------|--------|
| 1 | Server-driven menu vs client-side submenu expansion? | Extend server-driven /rest/menu to support sub-items, keeping the existing permission model. An upcoming granular role creator feature will enable per-screen permissions. | ✅ Resolved |
| 2 | Physician-facing app: shared components or API-only? | API-only approach for now. Physician app will very likely run from the same OpenELIS server with users marked as Physicians, using a scoped UI on the same app. | ✅ Resolved |
| 3 | FHIR alignment for the order API? | FHIR R4 native approach only. OpenELIS already has an API endpoint for FHIR order data exchange — this must be reused and extended as needed. | ✅ Resolved |
| 4 | How do clinical and environmental workflows differ? | Environmental workflow skips the patient section entirely. The requestor is not a clinical provider but is handled through the same search/entry mechanism. Sample type is selected from the Sample Types configured for tests in that lab unit (no separate 'source type' concept). | ✅ Resolved |

### Remaining Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 5 | What is the data migration strategy for existing in-progress orders during the transition? Will they remain in the old UI or be migrated? | Engineering | ⏳ Deferred |

---

## 9. Timeline Considerations

### Phase 1: Foundation (Weeks 1–4)

- Implement OrderContext shared state and routing infrastructure
- Build Step 1 (Enter Order) as standalone page with clinical workflow fields
- Add lab unit workflow type configuration to admin settings

### Phase 2: Collection & Storage (Weeks 5–8)

- Build Step 2 (Collect Sample) with environmental field support
- Build Step 3 (Label & Store) with lab number generation
- Implement wizard navigation and progress bar

### Phase 3: QA & Polish (Weeks 9–12)

- Build Step 4 (QA Review) with completeness dashboard
- Implement audit trail across all steps
- Integration testing with existing FHIR interfaces
- User acceptance testing with lab partners

### Dependencies

- Backend REST API updates for step-level save/retrieve (Engineering)
- Server-driven menu system update to support expandable sub-items (Engineering)
- Lab unit configuration schema migration (DBA/Engineering)
