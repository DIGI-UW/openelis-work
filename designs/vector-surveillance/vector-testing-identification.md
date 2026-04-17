# Vector Testing & Identification
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-17
**Status:** Draft for Review
**Jira:** TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Vector Specimen Types & Taxonomy (V-01, OGC-555), Vector Collection Workflow (V-02, OGC-581), Results Entry (existing), Test Catalog (existing)

### Change Log

- **v1.0 (2026-04-17):** Initial draft.

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
**I want to** configure named pathogen screening panels (e.g., "Dengue Surveillance Panel" = NS1 ELISA + NS1 RT-PCR),
**so that** technicians always order the correct test set for each surveillance program without manual selection.

**Acceptance:** Admin page under Vector Surveillance → Test Panels. Create/edit/deactivate panels. Each panel has a name, optional organism group filter, and one or more tests from the OpenELIS test catalog. Panel is available at order entry when domain = VECTOR.

---

### US-V03-06 — Positive Pool Alert
**As a** Lab Technician,
**I want to** be alerted immediately when a pooled lot receives a positive pathogen result,
**so that** I can initiate deconvolution without searching for the affected lot.

**Acceptance:** An InlineNotification (kind="warning") appears on the lot detail view when pool_flag=true AND at least one linked Result has value = POSITIVE. Notification names the positive test and includes an "Initiate Deconvolution" action button. Alert also appears on the identification worklist row for that lot.

---

### US-V03-07 — Deconvolution Workflow
**As a** Lab Technician,
**I want to** generate child specimen records and a new re-test order from a deconvolution modal,
**so that** the individual confirmation workflow is tracked end-to-end in OpenELIS rather than on paper.

**Acceptance:** Deconvolution modal lets the coordinator specify the number of sub-pools or individual specimens, sub-pool sizes, and test panel to use. On submit, child VectorSpecimen records are created linked to the parent CollectionLot, and a new Order is generated in PENDING state. Parent lot status advances to DECONVOLUTION_IN_PROGRESS.

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

**FR-V03-ID-001:** The system SHALL provide a Vector Identification worklist showing all CollectionLots with `sampleDomain = VECTOR` and `status IN (RECEIVED, IDENTIFICATION_IN_PROGRESS)`.

**FR-V03-ID-002:** Each worklist row SHALL display: Lot ID, Sampling Site name, Trap Type, Collection Date, Organism Group tag, total specimen count, identified specimen count, identification status tag (NOT_STARTED / IN_PROGRESS / COMPLETE).

**FR-V03-ID-003:** Clicking a lot row SHALL navigate to the Lot Identification Detail page showing a DataTable of all `VectorSpecimen` records belonging to that lot.

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

**FR-V03-PNL-001:** An admin page SHALL exist at Admin → Vector Surveillance → Test Panels listing all `VectorTestPanel` records in a `DataTable` with columns: Panel Name, Organism Group, Test Count, Status tag, Actions.

**FR-V03-PNL-002:** Clicking "Add Panel" SHALL inline-expand a new row form with fields: Panel Name (`TextInput`, required, unique), Description (`TextArea`, optional), Organism Group (`Select` over VectorGroup catalog, optional filter hint), Tests (`MultiSelect` over active tests from the OpenELIS test catalog), Active (`Toggle`, default on).

**FR-V03-PNL-003:** Clicking an existing panel row's Edit button SHALL inline-expand the same form pre-populated with existing values.

**FR-V03-PNL-004:** Deactivating a panel (Active toggle off) SHALL not delete it. Inactive panels SHALL be hidden from order entry but remain visible in the admin list with an "Inactive" Tag kind="gray".

**FR-V03-PNL-005:** At order entry for VECTOR-domain orders, a "Test Panel" `ComboBox` field SHALL appear in the test selection section. Selecting a panel SHALL auto-populate the test list with all tests from that panel.

**FR-V03-PNL-006:** After panel auto-population, individual tests MAY be added or removed by the ordering user before saving the order. The panel selection is stored for traceability but the individual test list is the binding order.

**FR-V03-PNL-007:** The Panel admin DataTable SHALL support search by panel name and filter by organism group and active status.

---

### 4.3 Pool Deconvolution Workflow

**FR-V03-DEC-001:** The system SHALL monitor linked Results for all CollectionLots where `pool_flag = true`. When any linked Result transitions to a final state with value = POSITIVE (or equivalent positive indicator), the system SHALL set the lot's `deconvolutionStatus` to PENDING.

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
1. Create a `DeconvolutionTask` record linked to the parent lot and the triggering positive Result
2. Create the specified number of child `VectorSpecimen` records, each linked to the parent CollectionLot and the DeconvolutionTask
3. Generate a new re-test Order in PENDING state with the selected test panel's tests and the child specimens as the sample
4. Set parent lot `deconvolutionStatus` to IN_PROGRESS
5. Show `InlineNotification` kind="success" confirming how many child specimens and which re-test order were created

**FR-V03-DEC-006:** Child specimens SHALL inherit from the parent lot: sampling site, trap type, collection date range. They SHALL be auto-labelled as `[parentLotId]-D[n]` (e.g., `BPP-01-LOT-042-D01`, `-D02`, …).

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
| vectorSpecimen | VectorSpecimen | Yes | FK (unique — one ID record per specimen) |
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

**VectorTestPanel**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| name | String(200) | Yes | Unique across active panels |
| description | String(500) | No | |
| organismGroup | VectorGroup | No | Filter hint for order entry ComboBox |
| isActive | Boolean | Yes | Default true |
| createdBy | SystemUser | Yes | |
| createdAt | Timestamp | Yes | |
| updatedBy | SystemUser | No | |
| updatedAt | Timestamp | No | |

**VectorTestPanelItem**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| panel | VectorTestPanel | Yes | FK |
| test | Test | Yes | FK to existing OpenELIS Test entity |
| sortOrder | Integer | No | Display order within panel |

**DeconvolutionTask**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| parentLot | CollectionLot | Yes | FK |
| triggerResult | Result | Yes | FK to positive Result that triggered deconvolution |
| strategy | Enum(INDIVIDUAL, SUB_POOL) | Yes | |
| childSpecimenCount | Integer | Yes | Total child specimens created |
| subPoolCount | Integer | No | Populated when strategy = SUB_POOL |
| specimensPerSubPool | Integer | No | Populated when strategy = SUB_POOL |
| status | Enum(PENDING, IN_PROGRESS, COMPLETE) | Yes | |
| positiveCount | Integer | No | Set on completion |
| deconvolutionOutcomePct | Decimal(5,2) | No | positiveCount / childSpecimenCount × 100 |
| reTestOrder | Order | No | FK to generated re-test order |
| initiatedBy | SystemUser | Yes | |
| initiatedAt | Timestamp | Yes | |
| completedAt | Timestamp | No | |
| notes | String(1000) | No | |

### Modified Entities

**CollectionLot** — Add fields:

| Field | Type | Notes |
|---|---|---|
| identificationStatus | Enum(NOT_STARTED, IN_PROGRESS, COMPLETE) | Default NOT_STARTED; updated as specimens are identified |
| deconvolutionStatus | Enum(NOT_APPLICABLE, PENDING, IN_PROGRESS, COMPLETE) | Default NOT_APPLICABLE; set to PENDING on positive pool result |

**VectorSpecimen** — Add fields:

| Field | Type | Notes |
|---|---|---|
| identificationStatus | Enum(NOT_IDENTIFIED, PRESUMPTIVE, CONFIRMED) | Default NOT_IDENTIFIED |
| isDeconvolutionChild | Boolean | Default false; true for child specimens created by a DeconvolutionTask |
| deconvolutionTask | DeconvolutionTask | FK, null unless isDeconvolutionChild = true |
| childLabel | String(50) | Auto-generated label for deconvolution children, e.g. "BPP-01-LOT-042-D01" |

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

### Test Panels

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/vector/panels` | List panels (filterable by active, organism group) | `vector.panel.view` |
| GET | `/api/v1/vector/panels/{id}` | Get panel with test items | `vector.panel.view` |
| POST | `/api/v1/vector/panels` | Create panel | `vector.panel.edit` |
| PUT | `/api/v1/vector/panels/{id}` | Update panel | `vector.panel.edit` |
| PUT | `/api/v1/vector/panels/{id}/deactivate` | Deactivate panel | `vector.panel.edit` |

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

- **Identification Workbench:** Worklist → Vector Identification (new menu item under existing Worklist menu)
- **Panel Admin:** Admin → Vector Surveillance → Test Panels
- **Deconvolution (lot detail):** Accessible from identification worklist row or from lot's detail page

### Key Screens

1. **Identification Worklist** — tabbed DataTable: "Pending ID" | "In Progress" | "Deconvolution" | "Complete". Each row shows lot summary and identification progress badge.
2. **Lot Identification Detail** — specimen DataTable with inline row expansion for per-specimen ID form. Mixed-species summary bar at top. Positive-pool InlineNotification when applicable.
3. **Bulk Apply Modal** — compact Modal with species/method/confidence form; applies to all checked specimens on confirm.
4. **Deconvolution Modal** — strategy selection, child specimen count, panel selector; generates child records + re-test order on submit.
5. **Panel Admin** — admin config DataTable with inline row expansion for create/edit. Active/inactive toggle, test MultiSelect.

### Interaction Patterns

- Inline row expansion for per-specimen identification (not modals)
- `TableBatchActions` for bulk-apply across selected specimens
- `Accordion` for optional Molecular Details section (collapsed by default)
- `InlineNotification` kind="warning" for positive pool deconvolution prompt
- `Modal` used for: bulk-apply (compact, applies to many rows), deconvolution initiation (multi-section, 5+ fields)

---

## 8. Business Rules

**BR-V03-001:** A lot's `identificationStatus` SHALL advance to IN_PROGRESS as soon as one specimen receives an identification, and to COMPLETE only when all specimens have `identificationStatus != NOT_IDENTIFIED`.

**BR-V03-002:** Pool deconvolution (FR-V03-DEC-001) SHALL only trigger for lots where `pool_flag = true`. Individual specimen lots with a positive result SHALL not receive a deconvolution prompt.

**BR-V03-003:** Bulk-apply (FR-V03-ID-009) SHALL copy species, method, confidence, and notes. It SHALL NOT copy molecular detail fields (targetGene, assayName, genbankAccession, linkedResult) — these are specimen-specific.

**BR-V03-004:** Child specimens created by a DeconvolutionTask SHALL inherit from the parent CollectionLot: samplingsite, trapType, collectionStartDate, collectionEndDate. They SHALL NOT inherit: poolFlag (always false for deconvolution children), organism_count (always 1 for individual strategy).

**BR-V03-005:** A VectorTestPanel SHALL require at least one active VectorTestPanelItem to be activated (`isActive = true`).

**BR-V03-006:** Deactivating a VectorTestPanel SHALL not affect existing orders that used the panel — the test list was copied to the order at time of ordering (BR-V03-PNL per FR-V03-PNL-006).

**BR-V03-007:** The `genbankAccession` field, if populated, SHALL match the pattern `[A-Z]{1,2}[0-9]{5,8}` (INSDC standard accession format). Frontend validation warns; API returns 422 for invalid format.

**BR-V03-008:** A DeconvolutionTask SHALL NOT be created if a PENDING or IN_PROGRESS DeconvolutionTask already exists for the same lot and the same triggerResult. Duplicate prevention prevents duplicate child specimen sets from the same positive result.

**BR-V03-009:** When `deconvolutionStatus = COMPLETE`, the parent lot SHALL expose `deconvolutionOutcomePct` in the lot detail API response and display the outcome summary tile (FR-V03-DEC-009).

**BR-V03-010:** Species identified with confidence = PRESUMPTIVE SHALL be flagged in V-04 surveillance exports with a "P" indicator. Only CONFIRMED identifications count toward MIR calculations.

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
| DeconvolutionTask.childSpecimenCount | Required, min 2, max 200 | `error.vectorDec.countRequired` |
| DeconvolutionTask.panel | Required | `error.vectorDec.panelRequired` |

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

### Functional — Test Panels

- [ ] Admin user can create a panel with name, description, organism group filter, and test selections
- [ ] Panel with no tests cannot be set to Active; system shows validation error
- [ ] Deactivated panel no longer appears in order entry ComboBox
- [ ] Selecting a panel at order entry auto-populates the test list; individual tests can be added or removed
- [ ] Duplicate panel name is rejected with an error message

### Functional — Deconvolution

- [ ] Positive result on a pool lot causes `deconvolutionStatus = PENDING` and displays InlineNotification (warning) on lot detail page
- [ ] Deconvolution worklist tab shows all lots with deconvolutionStatus ≠ NOT_APPLICABLE
- [ ] Completing the deconvolution modal creates the correct number of child specimens with auto-generated labels
- [ ] A new re-test Order is created in PENDING state linked to the child specimens
- [ ] Parent lot status advances to DECONVOLUTION_IN_PROGRESS
- [ ] When all child results finalized, system computes positiveCount and deconvolutionOutcomePct and advances lot to DECONVOLUTION_COMPLETE
- [ ] Attempting to initiate a second deconvolution on the same lot/result returns an error

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
