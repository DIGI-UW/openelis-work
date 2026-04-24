# Vector Testing & Identification
## Functional Requirements Specification — v1.0

**Version:** 1.3
**Date:** 2026-04-23
**Status:** Draft for Review
**Jira:** TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Vector Specimen Types & Taxonomy (V-01, OGC-555), Vector Collection Workflow (V-02, OGC-581), Results Entry (existing), Test Catalog (existing)

### Change Log

- **v1.4 (2026-04-23):** Major data model simplification. CollectionLot → existing Sample entity. VectorSpecimen (pooling) → existing Aliquot entity. DeconvolutionTask removed as new entity — deconvolution creates Aliquots (LABNO.X-Y) with copied test orders. VectorSpecimenIdentification FK changed from VectorSpecimen → Sample/Aliquot. pool_flag references removed (every VECTOR Sample is a pool). New BR: test orders copied to aliquots, parent orders unchanged. Deconvolution trigger updated to quantity > 1.
- **v1.3 (2026-04-23):** Removed `ALL` from `panelDomain` enum throughout. `FR-V03-PNL-002/004` updated — panels are single-domain only; order entry shows only `panelDomain = VECTOR` panels (not "VECTOR"). Data model Panel entry updated. API endpoint description updated. Acceptance criteria updated. Aligns with panel.md v1.2 and single-domain design decision.
- **v1.2 (2026-04-23):** Deconvolution child-specimen labeling replaced end-to-end. `[parentLotId]-D[n]` convention removed; replaced with OpenELIS aliquot numbering (`LABNO.X-Y`). FR-V03-DEC-006 rewritten. VectorSpecimen `childLabel` field example updated. Data model note added confirming parent-child linkage uses existing aliquot parent pointer. BR-V03-011 added (child specimens inherit parent organism group, species ID, and Panel/test orders). UI section updated with `LABNO.X-Y` column header. Laporan Hasil consolidation note added (§13). Acceptance criteria updated to reference aliquot labeling format.
- **v1.1 (2026-04-17):** Removed standalone `VectorTestPanel` and `VectorTestPanelItem` entities. Vector test panels are now a configuration step within the unified Panel admin (panel.md v1.1). The existing `Panel` entity gains `panelDomain` (CLINICAL/ENVIRONMENTAL/VECTOR) and `vectorOrganismGroup` fields. Vector Config tab in Panel editor is conditionally shown when domain = VECTOR. Identification worklist navigation changed from tabs to SideNav submenus. Lot detail opens inline on row click (row expansion) rather than navigating to a separate page.
- **v1.0 (2026-04-17):** Initial draft.

---

## Changes from Prior Draft (v1.1 → v1.2)

| FR / Section | What Changed |
|---|---|
| FR-V03-DEC-006 | Removed `[parentLotId]-D[n]` / `-D01` labeling. Replaced with aliquot convention `LABNO.X-Y` (e.g., `VCT-2026-000042.1-1`). Added iterative nesting note. |
| FR-V03-DEC-006 | Added child inheritance rule: organism group, species ID, and Panel/test orders inherited from parent by default; each may be explicitly overridden. |
| Data Model — VectorSpecimen `childLabel` | Updated example from `"BPP-01-LOT-042-D01"` to `"VCT-2026-000042.1-1"`. Added note that parent-child linkage uses the existing aliquot parent pointer — no new `parentLotId` FK field. |
| BR-V03-011 | New rule: child specimens inherit organism group, species identification, and Panel/test orders from parent lot. |
| §7 UI Design — Deconvolution Workbench | Added note: child-specimen column header reads "Specimen ID (Aliquot)" and displays `LABNO.X-Y` format labels. |
| §13 Reporting — Laporan Hasil Consolidation | New section: deconvoluted children are consolidated under the parent pool on the customer-facing certificate. Lineage shown as narrative, not flat list of child accessions. |
| §12 Acceptance Criteria — Deconvolution | Updated: child specimens use `LABNO.X-Y` aliquot format, not `-D[n]` format. |

---

## Table of Contents

1. Executive Summary
2. Problem Statement
2a. User Stories
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

V-03 adds species identification and pathogen screening workflows to the vector surveillance module in OpenELIS Global. It introduces three coordinated capabilities: a **Species Identification Workbench** for per-specimen taxonomic classification (morphological or molecular) with bulk-apply for homogeneous lots; an **admin-configured Vector Test Panel library** for consistent pathogen screening across programs; and a **Pool Deconvolution Workflow** that triggers automatically when a pooled lot yields a positive pathogen result, generating child specimen records and re-test orders to trace individual infections. Pathogen test results continue to flow through the standard Results Entry workflow, preserving its audit trail and validation levels. V-03 is the third spec in the vector surveillance layer and directly feeds V-04 Surveillance Reporting with the species-confirmed, infection-resolved specimen data required to compute density indices and minimum infection rates.

---

## 2. Problem Statement

**Current state:** OpenELIS has no mechanism to record species identification for vector specimens received from field collection. Once a lot arrives at the lab (V-02), the system knows it contains mosquitoes or ticks from a given site, but cannot record which species, how identification was performed, or whether molecular confirmation was obtained. Pathogen test results (PCR, ELISA) exist in Results Entry but are not linked to per-specimen taxonomy. Pool deconvolution — the process of identifying which individual mosquitoes in a positive pool carry the pathogen — is tracked on paper or in Excel entirely outside the system.

**Impact:**
- Indonesia's national vector surveillance programs (Ministry of Health Regulation No. 50/2017) require species-level infection data. Without per-specimen species records linked to test results, OpenELIS cannot generate the Minimum Infection Rate (MIR) calculations required for outbreak response reporting.
- Mixed-species pools (Aedes + Culex in a single BG-Sentinel trap) are common in Indonesian urban sites. Applying a single species to the whole pool produces incorrect surveillance data.
- Positive pool deconvolution performed outside the system creates data gaps — labs lose traceability between the positive pool result and the individual specimen(s) that tested positive in the follow-up.
- Technicians manually assemble test requisitions for each vector lot, creating variation in which tests are ordered across collection events for the same surveillance program.

**Proposed solution:** Extend the OpenELIS workflow with a dedicated Vector Identification step (per-specimen, bulk-apply capable) between lot receipt (V-02) and results finalization. Add an admin-configured test panel library so coordinators define once and technicians apply consistently. Build a deconvolution workflow triggered by positive pool results that creates trackable child specimens and re-test orders, closing the loop between pool-level and individual-level infection data.

---

## 2a. User Stories

### US-V03-01 — Identification Queue
**As a** Lab Technician,
**I want to** see all received vector lots awaiting species identification in a dedicated worklist,
**so that** I can work through my identification queue without searching across the system.

**Acceptance:** Worklist shows only VECTOR-domain lots in RECEIVED or IDENTIFICATION_IN_PROGRESS status. Lot rows show site name, trap type, collection date, organism group, specimen count, and identification progress (0/25 identified).

---

### US-V03-02 — Per-Specimen Species Identification
**As a** Lab Technician,
**I want to** record species, identification method, and confidence level for each specimen in a lot,
**so that** taxonomy data is traceable for surveillance reporting with per-specimen accuracy.

**Acceptance:** Expanding a specimen row reveals a form with species ComboBox (searchable from V-01 catalog), method selector (MORPHOLOGICAL / MOLECULAR / BOTH), and confidence selector (CONFIRMED / PRESUMPTIVE). Saving updates the specimen's ID status tag from NOT_IDENTIFIED to PRESUMPTIVE or CONFIRMED.

---

### US-V03-03 — Bulk-Apply for Homogeneous Lots
**As a** Lab Technician,
**I want to** select multiple specimens and apply a single species identification to all of them at once,
**so that** I don't have to enter the same data 25 times for a homogeneous mosquito pool.

**Acceptance:** Checking two or more specimen rows activates a "Bulk Apply ID" batch action. Clicking it opens a compact form pre-filled from the first selected specimen. On save, all selected specimens receive the same species/method/confidence. Molecular detail fields (target gene, accession) are NOT bulk-copied (specimen-specific).

---

### US-V03-04 — Molecular Identification Details
**As a** Lab Technician,
**I want to** record the target gene, assay name, and GenBank accession number when species confirmation is molecular,
**so that** the identification has full methodological traceability for submission to national reference databases.

**Acceptance:** When method = MOLECULAR or BOTH, a "Molecular Details" Accordion section appears in the identification form with fields for target gene, assay name, and GenBank accession. Accession number field is optional. Values persist per specimen and are visible in the lot export.

---

### US-V03-05 — Vector Test Panel Configuration
**As a** Vector Program Coordinator,
**I want to** configure named pathogen screening panels (e.g., "Dengue Surveillance Panel" = NS1 ELISA + NS1 RT-PCR) using the unified Panel admin,
**so that** technicians always order the correct test set for each surveillance program without manual selection, and vector panels share the same UX as clinical and environmental panels.

**Acceptance:** Panels with domain = VECTOR are configured in the standard Panel admin page (Admin → Test Panels). The Vector Config tab appears when domain = VECTOR, exposing the organism group filter field. Panel is available at VECTOR-domain order entry. No separate Vector Test Panels page exists. See `panel.md` v1.1 for full UI specification.

---

### US-V03-06 — Positive Pool Alert
**As a** Lab Technician,
**I want to** be alerted immediately when a pooled lot receives a positive pathogen result,
**so that** I can initiate deconvolution without searching for the affected lot.

**Acceptance:** An InlineNotification (kind="warning") appears on the sample detail view when quantity > 1 AND at least one linked Result has value = POSITIVE. Notification names the positive test and includes an "Initiate Deconvolution" action button. Alert also appears on the identification worklist row for that sample.

---

### US-V03-07 — Deconvolution Workflow
**As a** Lab Technician,
**I want to** generate child specimen records and a new re-test order from a deconvolution modal,
**so that** the individual confirmation workflow is tracked end-to-end in OpenELIS rather than on paper.

**Acceptance:** Deconvolution modal lets the coordinator specify the number of sub-pools or individual specimens, sub-pool sizes, and test panel to use. On submit, child Aliquots are created using the existing OpenELIS aliquot mechanism (LABNO.X-Y numbering). Each aliquot receives COPIES of the parent's test orders as new independent orders. The parent Sample's existing test orders and results are unchanged.

---

### US-V03-08 — Deconvolution Status View
**As a** Lab Supervisor,
**I want to** see the deconvolution status of all positive pool lots in one view,
**so that** I can ensure no positive results are left unresolved before surveillance data is submitted to the national program.

**Acceptance:** Worklist tab "Deconvolution" shows all lots with deconvolutionStatus ≠ NOT_APPLICABLE. Columns: lot ID, site, positive test, child specimens created, results received, status tag (PENDING / IN_PROGRESS / COMPLETE). Supervisor can drill into any lot.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | Perform species identification; initiate deconvolution | Cannot configure panels |
| Vector Program Coordinator | Full identification + deconvolution + panel CRUD | Primary operational role |
| Lab Supervisor | View worklist, lot detail, deconvolution status; cannot edit identification | Read-only for oversight |
| National Reference Lab Admin | All coordinator permissions + bulk import | May import WHO/CDC reference panels |
| System Administrator | Full | Platform-level role |

**Required permission keys:**

- `vector.identification.view` — View identification worklist and lot specimen detail
- `vector.identification.perform` — Create and update VectorSpecimenIdentification records
- `vector.identification.bulk` — Use bulk-apply batch action
- `vector.panel.view` — View test panel list and detail
- `vector.panel.edit` — Create, update, deactivate test panels
- `vector.deconvolution.initiate` — Create DeconvolutionTask and child specimens
- `vector.deconvolution.view` — View deconvolution status and child lot detail

---

## 4. Functional Requirements

### 4.1 Species Identification Workbench

**FR-V03-ID-001:** The system SHALL provide a Vector Identification worklist showing all Samples with `sampleDomain = VECTOR` and `status IN (RECEIVED, IDENTIFICATION_IN_PROGRESS)`.

**FR-V03-ID-002:** Each worklist row SHALL display: Lot ID, Sampling Site name, Trap Type, Collection Date, Organism Group tag, total specimen count, identified specimen count, identification status tag (NOT_STARTED / IN_PROGRESS / COMPLETE).

**FR-V03-ID-003:** Clicking a sample row SHALL navigate to the Sample Identification Detail page showing a DataTable of all Aliquots belonging to that Sample, plus the Sample itself.

**FR-V03-ID-004:** Each specimen row SHALL display: Specimen ID, organism group tag, current ID status tag (NOT_IDENTIFIED / PRESUMPTIVE / CONFIRMED), identified species (if set), and an expand button.

**FR-V03-ID-005:** Expanding a specimen row SHALL reveal an inline identification form containing:
- Species (`ComboBox`, searchable by genus, species name, or organism group; sourced from V-01 VectorSpecies catalog, active only)
- Identification Method (`Select`: MORPHOLOGICAL / MOLECULAR / BOTH)
- Confidence (`Select`: CONFIRMED / PRESUMPTIVE)
- Notes (`TextArea`, optional, max 500 chars)
- Molecular Details `Accordion` (collapsed by default, auto-expanded when method = MOLECULAR or BOTH)

**FR-V03-ID-006:** The Molecular Details Accordion SHALL contain:
- Target Gene (`TextInput`, e.g. "COI", "ITS2", "28S rDNA"; optional)
- Assay Name (`TextInput`, e.g. "Multiplex RT-PCR Dengue"; optional)
- GenBank Accession (`TextInput`, format hint "MVxxxxxx"; optional)
- Link to Pathogen Result (`ComboBox` over linked Results for this lot; optional)

**FR-V03-ID-007:** Saving an identification SHALL update the specimen's `identificationStatus` to PRESUMPTIVE or CONFIRMED, record `identifiedBy` (current user) and `identifiedAt` (server timestamp), and show an `InlineNotification` kind="success".

**FR-V03-ID-008:** The specimen DataTable SHALL support multi-row selection via `TableSelectRow`. When two or more rows are selected, a `TableBatchActions` bar SHALL appear with action "Bulk Apply ID".

**FR-V03-ID-009:** Clicking "Bulk Apply ID" SHALL open a compact Modal pre-populated with the identification data from the first selected specimen. The modal SHALL contain the same species/method/confidence/notes fields. On confirm, all selected specimens SHALL receive the same values. Molecular Detail fields (target gene, assay, accession) SHALL NOT be copied in bulk (they remain specimen-specific).

**FR-V03-ID-010:** When all specimens in a lot have `identificationStatus != NOT_IDENTIFIED`, the lot's `identificationStatus` SHALL automatically advance to `COMPLETE` and the lot SHALL be removed from the "Pending ID" worklist tab.

**FR-V03-ID-011:** A mixed-species summary panel SHALL appear at the top of the Lot Identification Detail page showing a bar chart of species distribution across all identified specimens in the lot (e.g., "Aedes aegypti: 18 | Culex quinquefasciatus: 7").

---

### 4.2 Vector Test Panel Administration

> Vector test panels are managed through the **unified Panel admin** (Admin → Test Panels), not a separate Vector Surveillance page. The requirements below describe the vector-specific behaviour within that shared UI. See `panel.md` v1.1 for the complete Panel admin specification.

**FR-V03-PNL-001:** The Panel admin list view SHALL include a **Domain** column (Tag: CLINICAL=blue / ENVIRONMENTAL=teal / VECTOR=purple) and a **Domain filter** dropdown (All Domains / Clinical / Environmental / Vector).

**FR-V03-PNL-002:** The Panel editor's Basic Info tab SHALL include a **Panel Domain** field (`Select`: CLINICAL / ENVIRONMENTAL / VECTOR). Changing this field to VECTOR SHALL reveal the **Vector Config** tab in the editor.

**FR-V03-PNL-003:** The **Vector Config** tab SHALL contain an **Organism Group** field (`ComboBox` over active VectorGroup catalog, optional). When set, this field acts as a suggestion hint at order entry — it does not restrict which panels are selectable.

**FR-V03-PNL-004:** At order entry for VECTOR-domain orders, the panel `ComboBox` SHALL show only active panels with `panelDomain = VECTOR`. Panels whose `vectorOrganismGroup` matches the lot's organism group SHALL be sorted to the top with a "Suggested" label.

**FR-V03-PNL-005:** Selecting a panel at order entry SHALL auto-populate the test list with all tests from that panel. Individual tests MAY be added or removed after panel selection. The panel selection is stored for traceability; the individual test list is the binding order.

**FR-V03-PNL-006:** Deactivating a panel (Active toggle off) SHALL hide it from order entry. It remains visible in the admin list with an "Inactive" Tag. Existing orders that used the panel are not affected.

---

### 4.3 Pool Deconvolution Workflow

**FR-V03-DEC-001:** The system SHALL monitor linked Results for all Samples with `sampleDomain = VECTOR` and `quantity > 1`. When any linked Result transitions to a final state with value = POSITIVE (or equivalent positive indicator), the system SHALL set the sample's `deconvolutionStatus` to PENDING.

**FR-V03-DEC-002:** On the Lot Identification Detail page, when `deconvolutionStatus = PENDING`, an `InlineNotification` kind="warning" SHALL appear at the top of the page with text identifying the positive test name and a prominent "Initiate Deconvolution" button.

**FR-V03-DEC-003:** The identification worklist row for a lot with `deconvolutionStatus = PENDING` SHALL display a Tag kind="red" labelled "Deconvolution Needed".

**FR-V03-DEC-004:** Clicking "Initiate Deconvolution" SHALL open a Modal containing:
- Positive test name and result value (read-only summary)
- Deconvolution Strategy (`RadioButtonGroup`: "Individual specimens" / "Sub-pools")
- If Sub-pools selected: Sub-pool count (`NumberInput`) and specimens per sub-pool (`NumberInput`)
- If Individual: individual count (`NumberInput`, pre-filled from parent lot organism_count)
- Test Panel selector (`ComboBox` over active VectorTestPanels)
- Notes (`TextArea`, optional)

**FR-V03-DEC-005:** On submitting the deconvolution modal, the system SHALL:
1. Create child Aliquots from the parent Sample using the existing OpenELIS aliquot mechanism. Each aliquot is assigned a lab number per the LABNO.X-Y convention.
2. Set the `quantity` on each child Aliquot to the organisms-per-sub-pool value entered in the modal.
3. Copy the parent Sample's test orders to each child Aliquot as new independent orders (PENDING state). The parent Sample's existing test orders and results SHALL remain unchanged.
4. Set parent Sample `deconvolutionStatus` to IN_PROGRESS.
5. Show `InlineNotification` kind='success' confirming how many aliquots and test orders were created.

**FR-V03-DEC-006:** Child specimens SHALL be numbered using OpenELIS's existing aliquot-numbering convention. Given a parent pool lab number `LABNO` (e.g., `VCT-2026-000042`):

- First-level aliquots off the main pool: `LABNO.1`, `LABNO.2`, `LABNO.3`, …
- Sub-pools deconvoluted from an aliquot: `LABNO.1-1`, `LABNO.1-2`, …
- The pattern is iterative: a sub-pool can itself be deconvoluted into `LABNO.1-1-1`, `LABNO.1-1-2`, etc., supporting progressive localisation of a positive signal without limit.

Each child specimen receives a real accession number and barcode so lab operations can track it as a physical object. The parent-child relationship is maintained via the existing aliquot parent pointer on the OpenELIS Sample/accession object — no new `parentLotId` field is introduced.

Child specimens SHALL inherit from the parent lot: sampling site, trap type, collection date range. They SHALL also inherit the parent's organism group and species identification (if already set on the parent) as defaults; either MAY be explicitly re-identified on the child if re-examination is performed. Child specimens SHALL inherit the parent's Panel and test order list as defaults; the coordinator MAY add or remove tests on the child's re-test order before submission.

**FR-V03-DEC-007:** A dedicated "Deconvolution" tab on the identification worklist SHALL show all lots with `deconvolutionStatus != NOT_APPLICABLE` in a DataTable with columns: Lot ID, Site, Positive Test, Child Specimens, Results Received / Total, Status tag.

**FR-V03-DEC-008:** When all child specimen results are received and finalized, the system SHALL automatically compute:
- `positiveCount` = number of child specimens with a POSITIVE result
- `deconvolutionOutcome` = positiveCount / totalChildSpecimens × 100 (%)
- Parent lot `deconvolutionStatus` SHALL advance to COMPLETE

**FR-V03-DEC-009:** The deconvolution outcome SHALL be surfaced on the parent lot detail page as a summary tile: "Deconvolution Complete — 3 of 25 specimens positive (12%)".

---

## 5. Data Model

### New Entities

**VectorSpecimenIdentification**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| sample | Sample | Yes | FK — the Sample or Aliquot this identification belongs to (one ID record per sample/aliquot) |
| vectorSpecies | VectorSpecies | Yes | FK to V-01 species catalog |
| identificationMethod | Enum(MORPHOLOGICAL, MOLECULAR, BOTH) | Yes | |
| confidence | Enum(CONFIRMED, PRESUMPTIVE) | Yes | |
| identifiedBy | SystemUser | Yes | Performing technician |
| identifiedAt | Timestamp | Yes | Server-set on create |
| notes | String(500) | No | |
| molecularRecord | VectorMolecularRecord | No | FK, one-to-one (null if method = MORPHOLOGICAL) |

**VectorMolecularRecord**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| identification | VectorSpecimenIdentification | Yes | FK, one-to-one |
| targetGene | String(100) | No | e.g. "COI", "ITS2", "28S rDNA" |
| assayName | String(200) | No | e.g. "Multiplex RT-PCR Dengue" |
| genbankAccession | String(50) | No | Format: 1–2 letters + 5–8 digits, e.g. "MW123456" |
| linkedResult | Result | No | FK to pathogen test result if same PCR run confirmed species |

**~~VectorTestPanel~~ — REMOVED in v1.1**

> Vector panels are now represented by the existing `Panel` entity with `panelDomain = VECTOR`. No separate entity is introduced. `VectorTestPanelItem` is replaced by the existing `PanelTest` join entity.

**DeconvolutionTask — REMOVED**

> Deconvolution creates standard OpenELIS Aliquots from the parent Sample. No new entity is needed. The LABNO.X-Y aliquot numbering convention tracks the parent-child relationship. A lightweight `VectorDeconvolutionEvent` audit record (parent Sample ID, triggering Result ID, aliquot count, initiated by, timestamp) MAY be stored for reporting, but is not a required data model change for V-03 delivery.

### Modified Entities

**Panel** — Add fields (shared entity, see `panel.md` v1.1):

| Field | Type | Notes |
|---|---|---|
| panelDomain | Enum(CLINICAL, ENVIRONMENTAL, VECTOR) | Default CLINICAL |
| vectorOrganismGroup | VectorGroup | FK, nullable; only relevant when panelDomain = VECTOR |

**Sample** — Modified (existing entity)

| Field | Type | Notes |
|---|---|---|
| `quantity` | INTEGER | **New field.** Number of organisms in this pool or aliquot. Minimum 1. Required for all VECTOR-domain Samples. |
| `deconvolutionStatus` | Enum(NOT_APPLICABLE, PENDING, IN_PROGRESS, COMPLETE) | **New field.** Default NOT_APPLICABLE. Set to PENDING on positive result when quantity > 1. |
| `identificationStatus` | Enum(NOT_STARTED, IN_PROGRESS, COMPLETE) | **New field.** Default NOT_STARTED. Updated as species ID is performed. |

**VectorSpecimen entity — REMOVED for pooling purposes**

> The pooling structure (parent pool → sub-pools → individuals) uses the existing Sample → Aliquot relationship. `VectorSpecimenIdentification` (see above) is linked directly to Sample/Aliquot records.

---

## 6. API Endpoints

### Species Identification

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/vector/identification/worklist` | Lots pending identification (pageable, filterable) | `vector.identification.view` |
| GET | `/api/v1/vector/identification/lots/{lotId}/specimens` | Specimens for lot with ID status | `vector.identification.view` |
| POST | `/api/v1/vector/identification/specimens/{specimenId}/identify` | Create or update identification | `vector.identification.perform` |
| POST | `/api/v1/vector/identification/specimens/bulk-identify` | Bulk-apply identification to list of specimen IDs | `vector.identification.bulk` |
| GET | `/api/v1/vector/identification/specimens/{specimenId}/identification` | Get identification record | `vector.identification.view` |

### Test Panels (via unified Panel API)

> Vector panels use the existing Panel CRUD API. The endpoints below are additions/modifications to support domain filtering. See Panel admin spec for the full API.

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/panels?domain=VECTOR` | List panels filtered to VECTOR domain only | `panel.view` |
| GET | `/api/v1/panels?domain=VECTOR&organismGroup={groupId}` | List panels with organism group suggestion sort | `panel.view` |
| PUT | `/api/v1/panels/{id}` | Update panel (now includes `panelDomain`, `vectorOrganismGroupId`) | `panel.edit` |

### Deconvolution

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/vector/deconvolution/worklist` | Lots with deconvolution tasks | `vector.deconvolution.view` |
| POST | `/api/v1/vector/deconvolution/initiate` | Create task + child specimens + re-test order | `vector.deconvolution.initiate` |
| GET | `/api/v1/vector/deconvolution/{taskId}` | Get task status and child specimen summary | `vector.deconvolution.view` |
| PUT | `/api/v1/vector/deconvolution/{taskId}/complete` | Force-complete task (supervisor override) | `vector.deconvolution.initiate` |

---

## 7. UI Design

See companion React mockup: `vector-testing-identification.jsx`
See interactive HTML preview: `vector-testing-identification.html`

### Navigation Path

- **Identification Workbench:** SideNav → Worklist → Vector Identification (SideNavMenu with submenus: Pending ID / In Progress / Deconvolution / Complete)
- **Panel Admin:** Admin → Test Panels (unified Panel admin, filtered by domain = VECTOR via toolbar Domain filter)
- **Lot detail:** Opens **inline** within the worklist row — clicking a lot row expands the specimen DataTable directly beneath it. No page navigation.

### Key Screens

1. **Identification Worklist** — SideNav submenus control the active filter (Pending ID / In Progress / Deconvolution / Complete). Lot rows are expandable; clicking a row expands an inline lot detail section beneath it.
2. **Lot Detail (inline)** — specimen DataTable rendered inside the expanded worklist row. Mixed-species summary bar, positive-pool InlineNotification, bulk-apply batch action, per-specimen inline ID forms — all inline, no breadcrumb or separate page.
3. **Bulk Apply Modal** — compact Modal with species/method/confidence form; applies to all checked specimens on confirm.
4. **Deconvolution Modal** — strategy selection, child specimen count, panel selector; generates child records + re-test order on submit. The child-specimen DataTable in this modal (and in the Deconvolution worklist) uses column header **"Specimen ID (Aliquot)"** and displays labels in `LABNO.X-Y` format (e.g., `VCT-2026-000042.1-1`, `VCT-2026-000042.1-2`). The `-D[n]` format SHALL NOT appear anywhere in the UI.
5. **Panel Admin (shared)** — standard Panel admin page (panel.md v1.1). Coordinators use Domain filter = VECTOR to scope the list. Vector Config tab shown when editing/creating a VECTOR panel.

### Interaction Patterns

- **SideNav submenus** (not tabs) for worklist filter navigation
- **Inline row expansion** for lot detail within the worklist (not page navigation)
- Inline row expansion for per-specimen identification within the lot detail (not modals)
- `TableBatchActions` for bulk-apply across selected specimens
- `Accordion` for optional Molecular Details section (collapsed by default)
- `InlineNotification` kind="warning" for positive pool deconvolution prompt
- `Modal` used for: bulk-apply (compact, applies to many rows), deconvolution initiation (multi-section, 5+ fields)

---

## 8. Business Rules

**BR-V03-001:** A lot's `identificationStatus` SHALL advance to IN_PROGRESS as soon as one specimen receives an identification, and to COMPLETE only when all specimens have `identificationStatus != NOT_IDENTIFIED`.

**BR-V03-002:** Deconvolution SHALL only be available for VECTOR-domain Samples with `quantity > 1` and a positive result. Samples with `quantity = 1` (single organism) show test results but no deconvolution prompt.

**BR-V03-003:** Bulk-apply (FR-V03-ID-009) SHALL copy species, method, confidence, and notes. It SHALL NOT copy molecular detail fields (targetGene, assayName, genbankAccession, linkedResult) — these are specimen-specific.

**BR-V03-004:** Child Aliquots created by deconvolution SHALL inherit: organism group (SampleType), sampling site (if set on parent). They SHALL receive COPIES of the parent's test orders as new independent orders. The parent Sample's existing test orders and results SHALL remain unchanged.

**BR-V03-005:** A VectorTestPanel SHALL require at least one active VectorTestPanelItem to be activated (`isActive = true`).

**BR-V03-006:** Deactivating a VectorTestPanel SHALL not affect existing orders that used the panel — the test list was copied to the order at time of ordering (BR-V03-PNL per FR-V03-PNL-006).

**BR-V03-007:** The `genbankAccession` field, if populated, SHALL match the pattern `[A-Z]{1,2}[0-9]{5,8}` (INSDC standard accession format). Frontend validation warns; API returns 422 for invalid format.

**BR-V03-008:** A deconvolution operation SHALL NOT be initiated if a deconvolution is already IN_PROGRESS for the same Sample and triggering Result. The system checks `deconvolutionStatus = IN_PROGRESS` on the parent Sample before allowing initiation.

**BR-V03-009:** When `deconvolutionStatus = COMPLETE`, the parent lot SHALL expose `deconvolutionOutcomePct` in the lot detail API response and display the outcome summary tile (FR-V03-DEC-009).

**BR-V03-010:** Species identified with confidence = PRESUMPTIVE SHALL be flagged in V-04 surveillance exports with a "P" indicator. Only CONFIRMED identifications count toward MIR calculations.

**BR-V03-011:** Child Aliquots created by deconvolution SHALL inherit from the parent Sample: (a) organism group (SampleType), (b) species identification and confidence level if already set on the parent, and (c) COPIES of the parent's test orders as new independent orders. Each inherited value MAY be explicitly overridden on the child; an override does not affect the parent or sibling aliquots.

**BR-V03-012:** Test orders on deconvolution aliquots are **copies** of the parent's test orders — they are new independent orders in PENDING state. The parent Sample's original test orders and their results SHALL remain visible and unchanged. Both the parent result (positive) and each aliquot's result are stored and accessible.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.vectorId.worklist` | Vector Identification Worklist |
| `heading.vectorId.lotDetail` | Lot Identification Detail |
| `heading.vectorId.specimenGrid` | Specimens |
| `heading.vectorId.speciesSummary` | Species Distribution |
| `label.vectorId.lotId` | Lot ID |
| `label.vectorId.samplingsite` | Sampling Site |
| `label.vectorId.trapType` | Trap Type |
| `label.vectorId.collectionDate` | Collection Date |
| `label.vectorId.organismGroup` | Organism Group |
| `label.vectorId.specimenCount` | Specimens |
| `label.vectorId.identifiedCount` | Identified |
| `label.vectorId.identificationStatus` | ID Status |
| `label.vectorId.species` | Species |
| `label.vectorId.method` | Identification Method |
| `label.vectorId.method.morphological` | Morphological |
| `label.vectorId.method.molecular` | Molecular |
| `label.vectorId.method.both` | Morphological + Molecular |
| `label.vectorId.confidence` | Confidence |
| `label.vectorId.confidence.confirmed` | Confirmed |
| `label.vectorId.confidence.presumptive` | Presumptive |
| `label.vectorId.notes` | Notes |
| `label.vectorId.molecularDetails` | Molecular Details |
| `label.vectorId.targetGene` | Target Gene |
| `label.vectorId.assayName` | Assay Name |
| `label.vectorId.genbankAccession` | GenBank Accession |
| `label.vectorId.linkedResult` | Linked Pathogen Result |
| `label.vectorId.status.notIdentified` | Not Identified |
| `label.vectorId.status.presumptive` | Presumptive |
| `label.vectorId.status.confirmed` | Confirmed |
| `button.vectorId.save` | Save Identification |
| `button.vectorId.cancel` | Cancel |
| `button.vectorId.bulkApply` | Bulk Apply ID |
| `button.vectorId.applyToAll` | Apply to All Selected |
| `message.vectorId.saveSuccess` | Identification saved. |
| `message.vectorId.bulkSuccess` | Identification applied to {count} specimens. |
| `error.vectorId.speciesRequired` | Species is required. |
| `error.vectorId.methodRequired` | Identification method is required. |
| `error.vectorId.confidenceRequired` | Confidence is required. |
| `error.vectorId.accessionFormat` | GenBank accession format: 1–2 letters followed by 5–8 digits (e.g. MW123456). |
| `heading.vectorPanel.title` | Vector Test Panels |
| `label.vectorPanel.name` | Panel Name |
| `label.vectorPanel.description` | Description |
| `label.vectorPanel.organismGroup` | Organism Group Filter |
| `label.vectorPanel.tests` | Tests |
| `label.vectorPanel.active` | Active |
| `label.vectorPanel.testCount` | Tests |
| `button.vectorPanel.add` | Add Panel |
| `button.vectorPanel.save` | Save Panel |
| `button.vectorPanel.deactivate` | Deactivate |
| `message.vectorPanel.saveSuccess` | Test panel saved. |
| `message.vectorPanel.deactivated` | Panel deactivated. |
| `error.vectorPanel.nameRequired` | Panel name is required. |
| `error.vectorPanel.nameDuplicate` | A panel with this name already exists. |
| `error.vectorPanel.noTests` | At least one test is required to activate a panel. |
| `heading.vectorDec.title` | Pool Deconvolution |
| `label.vectorDec.positiveTest` | Positive Test |
| `label.vectorDec.strategy` | Deconvolution Strategy |
| `label.vectorDec.strategy.individual` | Individual specimens |
| `label.vectorDec.strategy.subpool` | Sub-pools |
| `label.vectorDec.specimenCount` | Number of Specimens |
| `label.vectorDec.subPoolCount` | Number of Sub-pools |
| `label.vectorDec.specimensPerSubPool` | Specimens per Sub-pool |
| `label.vectorDec.panel` | Test Panel |
| `label.vectorDec.notes` | Notes |
| `label.vectorDec.status.pending` | Deconvolution Needed |
| `label.vectorDec.status.inProgress` | Deconvolution In Progress |
| `label.vectorDec.status.complete` | Deconvolution Complete |
| `button.vectorDec.initiate` | Initiate Deconvolution |
| `button.vectorDec.confirm` | Confirm & Generate Specimens |
| `button.vectorDec.cancel` | Cancel |
| `message.vectorDec.success` | Deconvolution initiated: {count} specimens created. Re-test order {orderId} generated. |
| `message.vectorDec.complete` | Deconvolution complete — {positive} of {total} specimens positive ({pct}%). |
| `error.vectorDec.countRequired` | Specimen count is required. |
| `error.vectorDec.panelRequired` | A test panel is required. |
| `error.vectorDec.duplicate` | A deconvolution task is already active for this lot and positive result. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| VectorSpecimenIdentification.vectorSpecies | Required | `error.vectorId.speciesRequired` |
| VectorSpecimenIdentification.identificationMethod | Required | `error.vectorId.methodRequired` |
| VectorSpecimenIdentification.confidence | Required | `error.vectorId.confidenceRequired` |
| VectorMolecularRecord.genbankAccession | Pattern `[A-Z]{1,2}[0-9]{5,8}` if provided | `error.vectorId.accessionFormat` |
| VectorTestPanel.name | Required, unique among active panels | `error.vectorPanel.nameRequired`, `error.vectorPanel.nameDuplicate` |
| VectorTestPanel.items | At least 1 item if isActive = true | `error.vectorPanel.noTests` |
| Aliquot quantity per sub-pool | Required; integer ≥ 1 | error.vectorDec.quantityRequired |
| Sub-pool count | Required; integer ≥ 2 | error.vectorDec.countRequired |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View identification worklist | `vector.identification.view` | Menu item not shown |
| Perform species identification | `vector.identification.perform` | Save button disabled; API returns 403 |
| Bulk-apply identification | `vector.identification.bulk` | Batch action hidden |
| View test panels | `vector.panel.view` | Admin page not accessible |
| Create/edit test panels | `vector.panel.edit` | Add Panel and Edit buttons hidden; API returns 403 |
| View deconvolution worklist | `vector.deconvolution.view` | Deconvolution tab hidden |
| Initiate deconvolution | `vector.deconvolution.initiate` | "Initiate Deconvolution" button hidden; API returns 403 |

---

## 12. Acceptance Criteria

### Functional — Species Identification

- [ ] User with `vector.identification.view` can access the Vector Identification worklist from the Worklist menu
- [ ] Worklist shows only VECTOR-domain lots in RECEIVED or IDENTIFICATION_IN_PROGRESS status
- [ ] Expanding a specimen row reveals species ComboBox, method selector, confidence selector, and notes field
- [ ] When method = MOLECULAR or BOTH, Molecular Details accordion auto-expands with targetGene, assayName, accession fields
- [ ] Saving an identification updates the specimen's status tag and shows a success notification
- [ ] When all specimens in a lot are identified, the lot advances to COMPLETE and moves off the pending worklist
- [ ] Selecting 2+ specimens and clicking "Bulk Apply ID" applies the form values to all selected specimens; molecular detail fields are not copied
- [ ] Species distribution summary panel updates as specimens are identified

### Functional — Test Panels (via unified Panel admin)

- [ ] Panel Domain field present in Basic Info tab with options CLINICAL / ENVIRONMENTAL / VECTOR
- [ ] Vector Config tab appears (and only appears) when domain = VECTOR
- [ ] Organism Group field in Vector Config tab is populated from VectorGroup catalog
- [ ] Panel list view shows Domain column and Domain filter dropdown
- [ ] At VECTOR-domain order entry, panel ComboBox shows only panels with domain = VECTOR
- [ ] Panels with matching organism group sorted to top with "Suggested" label
- [ ] Selecting a panel auto-populates test list; individual tests can be added or removed
- [ ] Deactivated panel does not appear in order entry ComboBox

### Functional — Deconvolution

- [ ] Positive result on a pool sample (quantity > 1) causes `deconvolutionStatus = PENDING` and displays InlineNotification (warning) on sample detail page
- [ ] Deconvolution submenu item shows all samples with deconvolutionStatus ≠ NOT_APPLICABLE
- [ ] Completing the deconvolution modal creates the correct number of child Aliquots with auto-generated `LABNO.X-Y` aliquot labels (e.g., `VCT-2026-000042.1-1`); no `-D[n]` format appears
- [ ] New test orders are COPIED from the parent Sample to each child Aliquot in PENDING state; the parent's existing orders are unchanged
- [ ] Parent sample status advances to DECONVOLUTION_IN_PROGRESS
- [ ] When all child results finalized, system computes positiveCount and deconvolutionOutcomePct and advances sample to DECONVOLUTION_COMPLETE
- [ ] Attempting to initiate deconvolution on a Sample already in deconvolutionStatus=IN_PROGRESS for the same result returns an error

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Identification worklist loads within 2 seconds for lots with up to 200 specimens
- [ ] Species ComboBox search returns results within 300ms for a catalog of 500 species
- [ ] Permissions enforced at API level — HTTP 403 for unauthorized operations
- [ ] Feature works on screens 1280px wide and above
- [ ] All i18n keys documented in §9 Localization table

### Integration

- [ ] VectorSpecimenIdentification records are accessible via V-04 surveillance reporting data exports
- [ ] Deconvolution child specimens are linkable to parent lot in V-04 density index calculations
- [ ] CONFIRMED species identifications with POSITIVE pathogen results contribute to MIR numerator in V-04
- [ ] Re-test orders created by deconvolution appear in standard Results Entry worklist with VECTOR domain indicator

---

## 13. Reporting — Laporan Hasil Consolidation

When a deconvoluted pool sample's results are included in a Laporan Hasil (S-06 Compliance Report) or a vector surveillance certificate, the following consolidation rules apply:

**FR-V03-RPT-001:** The customer-facing certificate SHALL present deconvoluted children consolidated under their parent pool, not as a flat list of child accession numbers. The child `LABNO.X-Y` identifiers are internal tracking references and SHALL NOT be listed as standalone rows on the certificate.

**FR-V03-RPT-002:** The certificate SHALL include a deconvolution narrative in the findings section. Format:

> *"Pool [LABNO] tested positive for [pathogen]. Deconvolution performed across [N] sub-specimens ([LABNO.1], [LABNO.2], …). [M] of [N] sub-specimens confirmed positive: [LABNO.1-1] — [species], [confidence]."*

The narrative is generated automatically from the deconvolution aliquot records and their VectorSpecimenIdentification data. It replaces a flat results table for positive pools.

**FR-V03-RPT-003:** The deconvolution lineage depth is recorded but not expanded beyond two levels on the printed certificate. Deeper nesting (e.g., `LABNO.1-1-1`) is accessible in the system audit view and API but summarised as "further sub-deconvolution performed" on the certificate.

**FR-V03-RPT-004:** The parent pool result row on the certificate SHALL show status "Positive — Deconvolution Complete" (or "Positive — Deconvolution In Progress" if not yet resolved) rather than a raw result value. The individual pathogen result values are shown in the deconvolution narrative block, not in the main results table.
