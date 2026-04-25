# Vector Testing & Identification
## Functional Requirements Specification — v1.0

**Version:** 1.11
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Vector Specimen Types & Taxonomy (V-01, OGC-555), Vector Collection Workflow (V-02, OGC-581), Results Entry (existing), Test Catalog (existing), Reflex Rules (existing)

### Change Log

- **v1.11 (2026-04-25 — characterization in scope):** Promoted blood meal analysis, *Plasmodium* drug-resistance genotyping, and vector insecticide-resistance testing into V-03 v1.0 scope based on lab-tech feedback. Added `physiologicalState` enum field to VectorSpecimenIdentification (UNFED / BLOOD_FED / HALF_GRAVID / GRAVID per Detinova age-grading classification). Added VR-06 Plasmodium Drug Resistance reflex rule (fires on confirmed *P. falciparum* positive). Added three new seed Panels to Appendix A.5: Mosquito Blood-Meal Identification Panel, Plasmodium Drug Resistance Panel, Vector Insecticide Resistance Panel. Identification form gets a `physiologicalState` Select; the form auto-suggests the Blood-Meal Panel when state = BLOOD_FED. §14 Future Scope trimmed to host-range expansion and regional variants only (the workflows themselves are now shipped). New FR-V03-ID-012 (physiological state field), BR-V03-014 (blood meal suggestion). New i18n keys for physiological state strings.
- **v1.10 (2026-04-24 — characterization scope fence):** Added explicit out-of-scope statement to §2 Problem Statement naming pathogen drug-resistance genotyping, vector insecticide-resistance testing, and blood-meal analysis. Added new §14 Future Scope section with subsections 14.1 (V-03b drug resistance), 14.2 (V-03c insecticide resistance), 14.3 (V-03d blood meal), and 14.4 (cross-cutting reflex coverage note). All three workflows are enabled today via lab-authored Reflex Rules and Panels — only the platform-level seed data is deferred. §14.3 flags an optional future `physiologicalState` enum on VectorSpecimenIdentification as a possible small additive change.
- **v1.9 (2026-04-24 — reflex integration):** Extended BR-V03-012 to cover reflex rule evaluation at aliquot creation (eager) and as results are validated (lazy). Reflex-generated test orders are ADDED to copied parent orders, not substituted. Provenance (copied / reflex / manual) now required on every order. Added new permission key `reflex.vector.edit`. Added Appendix A — Vector Seed Reflex Rules (VR-01 through VR-05) and Recommended Default Vector Test Catalog. BR-V03-011 updated to reference BR-V03-012. FR-V03-DEC-005.3 updated to reference BR-V03-012. New §1 Executive Summary sentence noting reflex-driven speciation/characterization pattern. New §12 Reflex Integration acceptance criteria block.
- **v1.8 (2026-04-24 — clarify pass):** Applied all CRITICAL and HIGH fixes from constitution/clarify review: version header corrected; trap type removed from US-V03-01 and FR-V03-DEC-006 inheritance list; FR-V03-DEC-005 "modal" changed to "inline panel"; FR-V03-ID-003 changed from page navigation to inline expansion; FR-V03-ID-009 Bulk Apply changed from Modal to inline Tile; permission description updated for vector.deconvolution.initiate; FR-V03-DEC-004 save-block rule for unassigned specimens added; FR-V03-ID-001 corrected to use identificationStatus field.
- **v1.7 (2026-04-24):** Unified pool+specimen table — single table replaces dual stacked view. Pool header rows (with ↗ Split) sit above their specimen rows in the same table; no separate hierarchy view above a flat list. Re-split creates child pool rows nested under the parent (parent row is preserved); recursive — a sub-pool can be re-split at any depth. 'Reset all pools' removed — pool reassignment after physical preparation is out of scope per ISO 17025 chain-of-custody requirements (§7.5 technical records). Specimens rows use └╴/├╴ tree connectors to indicate pool membership.
- **v1.6 (2026-04-24):** Major deconvolution UX redesign. No modal — deconvolution is fully inline. Filter pills replaced with a Status dropdown (default: Pending). Trap type removed from worklist and lot detail. Split into Sub-pools available on all lots (not just positive ones). Pool assignment strategies: Assign randomly, Auto sub-pool by species, Assign manually (drag-and-drop). Pool hierarchy tree shown in lot detail after save, with Re-split action. Localization keys updated.
- **v1.5 (2026-04-23):** Deconvolution modal simplified — removed "Individual specimens / Sub-pools" RadioButtonGroup strategy selector. Modal now has two plain fields: Number of Aliquots and Organisms per Aliquot. "Individual" is just organisms-per-aliquot = 1; sub-pools are organisms-per-aliquot > 1. Soft warning added when total organisms exceeds parent quantity. V-02 data model note updated: `quantity` field already exists on Sample; only UOM display is suppressed for VECTOR domain.
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
13. Reporting — Laporan Hasil Consolidation
14. Future Scope
    - 14.1 Host range expansion for Blood-Meal Identification
    - 14.2 Drug-resistance reference set updates
    - 14.3 Insecticide formulation expansion
    - 14.4 Vectorial Capacity Calculation
    - 14.5 Reflex Engine Coverage Note
Appendix A — Vector Seed Reflex Rules & Recommended Default Test Catalog

---

## 1. Executive Summary

V-03 adds species identification and pathogen screening workflows to the vector surveillance module in OpenELIS Global. It introduces three coordinated capabilities: a **Species Identification Workbench** for per-specimen taxonomic classification (morphological or molecular) with bulk-apply for homogeneous lots; an **admin-configured Vector Test Panel library** for consistent pathogen screening across programs; and a **Pool Deconvolution Workflow** that triggers automatically when a pooled lot yields a positive pathogen result, generating child specimen records and re-test orders to trace individual infections. Pathogen test results continue to flow through the standard Results Entry workflow, preserving its audit trail and validation levels. Downstream pathogen speciation and characterization workflows are driven by the existing Reflex Rule engine, pre-seeded with six seed rules covering speciation (VR-01 Malaria, VR-02 Dengue, VR-03 Arbovirus, VR-04 Zika, VR-05 Chikungunya) and pathogen drug-resistance genotyping (VR-06 *Plasmodium* — *pfkelch13*, *pfcrt*, *pfmdr1*, *dhfr*/*dhps* on confirmed *P. falciparum* positive). Two additional vector characterization workflows ship as seed Panels without reflex rules: blood-meal host identification (lab-tech driven, surfaced as a soft suggestion when a specimen is marked blood-fed via the new `physiologicalState` field) and vector insecticide-resistance testing (program-driven, manually ordered). See Appendix A. No new reflex infrastructure is introduced by V-03. V-03 is the third spec in the vector surveillance layer and directly feeds V-04 Surveillance Reporting with the species-confirmed, infection-resolved specimen data required to compute density indices and minimum infection rates.

---

## 2. Problem Statement

**Current state:** OpenELIS has no mechanism to record species identification for vector specimens received from field collection. Once a lot arrives at the lab (V-02), the system knows it contains mosquitoes or ticks from a given site, but cannot record which species, how identification was performed, or whether molecular confirmation was obtained. Pathogen test results (PCR, ELISA) exist in Results Entry but are not linked to per-specimen taxonomy. Pool deconvolution — the process of identifying which individual mosquitoes in a positive pool carry the pathogen — is tracked on paper or in Excel entirely outside the system.

**Impact:**
- Indonesia's national vector surveillance programs (Ministry of Health Regulation No. 50/2017) require species-level infection data. Without per-specimen species records linked to test results, OpenELIS cannot generate the Minimum Infection Rate (MIR) calculations required for outbreak response reporting.
- Mixed-species pools (Aedes + Culex in a single BG-Sentinel trap) are common in Indonesian urban sites. Applying a single species to the whole pool produces incorrect surveillance data.
- Positive pool deconvolution performed outside the system creates data gaps — labs lose traceability between the positive pool result and the individual specimen(s) that tested positive in the follow-up.
- Technicians manually assemble test requisitions for each vector lot, creating variation in which tests are ordered across collection events for the same surveillance program.

**Proposed solution:** Extend the OpenELIS workflow with a dedicated Vector Identification step (per-specimen, bulk-apply capable) between lot receipt (V-02) and results finalization. Add an admin-configured test panel library so coordinators define once and technicians apply consistently. Build a deconvolution workflow triggered by positive pool results that creates trackable child specimens and re-test orders, closing the loop between pool-level and individual-level infection data.

**Characterization workflows in v1.0 scope** (per v1.11 — driven by lab-tech feedback):

- **Blood-meal analysis / host identification** — PCR on the bloodmeal to determine whether the mosquito fed on human, cattle, or other host. Captured via the new Mosquito Blood-Meal Identification Panel (Appendix A.5.6) and the new `physiologicalState` field on VectorSpecimenIdentification. Manually ordered by the lab tech; the identification form suggests the panel when `physiologicalState = BLOOD_FED`.
- **Drug-resistance genotyping** of the *pathogen* — *pfkelch13* (artemisinin), *pfcrt* (chloroquine), *pfmdr1* (multiple), and *dhfr*/*dhps* (sulfadoxine-pyrimethamine). Captured via the new Plasmodium Drug Resistance Panel (Appendix A.5.7) and the new VR-06 reflex rule that fires on confirmed *P. falciparum* positive.
- **Insecticide-resistance testing** of the *vector* — kdr (pyrethroids), ace-1 (organophosphates/carbamates), and WHO bottle bioassay. Captured via the new Vector Insecticide Resistance Panel (Appendix A.5.8). Manually ordered (program-driven, not pathogen-driven) — no reflex rule.

---

## 2a. User Stories

### US-V03-01 — Identification Queue
**As a** Lab Technician,
**I want to** see all received vector lots awaiting species identification in a dedicated worklist,
**so that** I can work through my identification queue without searching across the system.

**Acceptance:** Worklist shows only VECTOR-domain lots where identificationStatus != COMPLETE. Lot rows show site name, collection date (if set), organism group, specimen count, and identification progress (0/25 identified).

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
**I want to** generate child specimen records and a new re-test order from an inline panel,
**so that** the individual confirmation workflow is tracked end-to-end in OpenELIS rather than on paper.

**Acceptance:** Inline sub-pool panel opens below the lot detail (no modal). Tech selects number of pools and assignment strategy (randomly / by species / manually). Preview shows proposed grouping. In manual mode specimens are drag-and-drop. On save, pool tree appears in the lot detail showing pools with their assigned specimens indented below each pool header.

---

### US-V03-08 — Deconvolution Status View
**As a** Lab Supervisor,
**I want to** see the deconvolution status of all positive pool lots in one view,
**so that** I can ensure no positive results are left unresolved before surveillance data is submitted to the national program.

**Acceptance:** A deconvolution filter option in the Status dropdown shows all lots with deconvolutionStatus ≠ NOT_APPLICABLE.

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
- `vector.deconvolution.initiate` — Create child Aliquots (sub-pools) and copy test orders from parent Sample
- `vector.deconvolution.view` — View deconvolution status and child lot detail
- `reflex.vector.edit` — Create, edit, or deactivate Reflex Rules scoped to VECTOR-domain results (managed via existing Admin → Reflex Rules, filtered by domain). Granted to System Administrator by default; MAY be granted to Vector Program Coordinator per deployment policy. NOT granted to Lab Technician.

---

## 4. Functional Requirements

### 4.1 Species Identification Workbench

**FR-V03-ID-001:** The system SHALL provide a Vector Identification worklist showing all Samples with `sampleDomain = VECTOR` and `identificationStatus IN (NOT_STARTED, IN_PROGRESS)` or `deconvolutionStatus = PENDING`. The worklist uses a **Status dropdown filter** (default: Pending = all not-complete) rather than SideNav sub-items. Filter options: Pending / Not Started / Partial ID / Deconvolution / Complete.

**FR-V03-ID-002:** Each worklist row SHALL display: Sample ID, Sampling Site (if set), Collection Date, Organism Group tag, total specimen count, identified specimen count, identification status tag.

**FR-V03-ID-003:** Clicking a sample row SHALL expand the Sample Identification Detail inline within the worklist row (no page navigation).

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

**FR-V03-ID-009:** Clicking "Bulk Apply ID" SHALL expand an inline `Tile` within the batch action bar area (not a Modal), pre-populated with the identification data from the first selected specimen. The Tile SHALL contain the same species/method/confidence/notes fields. On confirm, all selected specimens SHALL receive the same values. This interaction is intentionally non-modal because the action is non-destructive and involves 4 fields — consistent with Constitution Principle 3.

**FR-V03-ID-010:** When all specimens in a lot have `identificationStatus != NOT_IDENTIFIED`, the lot's `identificationStatus` SHALL automatically advance to `COMPLETE` and the lot SHALL be removed from the "Pending ID" worklist tab.

**FR-V03-ID-011:** A mixed-species summary panel SHALL appear at the top of the Lot Identification Detail page showing a bar chart of species distribution across all identified specimens in the lot (e.g., "Aedes aegypti: 18 | Culex quinquefasciatus: 7").

**FR-V03-ID-012 (added v1.11):** The inline identification form SHALL include a **Physiological State** `Select` (sourced from VectorSpecimenIdentification.physiologicalState enum) with options: Unfed, Blood-fed, Half-gravid, Gravid, Unknown (default). The field SHALL NOT be required — labs may leave it Unknown for males, non-mosquito specimens, or when the state is not assessed.

**FR-V03-ID-013 (added v1.11):** When physiologicalState is set to BLOOD_FED on save, the system SHALL display an `InlineNotification` kind="info" beneath the saved specimen with message `message.vectorId.bloodMealSuggest` ("Blood-fed female detected. Order Blood-Meal Identification Panel?") and a "Add Panel to Order" action button. Clicking the action button SHALL add the Mosquito Blood-Meal Identification Panel (Appendix A.5.6) to the specimen's pending test orders. Per BR-V03-014, this is a soft suggestion — never an automatic order.

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

**FR-V03-DEC-002:** On the Sample Identification Detail page, when `deconvolutionStatus = PENDING`, an `InlineNotification` kind='warning' SHALL appear at the top. A **'Split into Sub-pools' button** SHALL be present on ALL vector lots — not only positive ones — enabling proactive splitting before test results. Clicking this button expands the inline sub-pool panel within the lot detail row (no modal).

**FR-V03-DEC-003:** The identification worklist row for a lot with `deconvolutionStatus = PENDING` SHALL display a Tag kind="red" labelled "Deconvolution Needed".

**FR-V03-DEC-004:** The inline sub-pool panel SHALL contain:
- Positive test name and result (read-only, shown only when posTest is set)
- Parent sample lab number and quantity (read-only)
- **Number of pools** (NumberInput, required, min 2) — calculated label shows organisms/pool distribution
- **Assignment method** (RadioButtonGroup):
  - *Assign randomly* — evenly distributes specimens across pools
  - *Auto sub-pool by species* — groups specimens by species; pool header is labelled with species name when all specimens in pool share one species
  - *Assign manually* — opens drag-and-drop view; specimens shown with grab handles; unassigned section shown in red until all specimens are placed
- **Preview Grouping** button — applies the strategy and shows proposed pool groupings inline
- In preview: each pool shows as an expandable row with its lab number (LABNO.X) and specimen list underneath
- **Sticky dark action bar** at bottom of panel: assigned count, pool count, Save Pools button
- On save: inline panel collapses to success message; pool hierarchy tree renders in the specimen section
- In manual assignment mode, the **Save Pools button SHALL be disabled** while any specimens remain in the unassigned section. The sticky action bar SHALL display the unassigned count in orange (e.g., "3 unassigned"). The Save button becomes enabled only when unassigned count = 0.

**FR-V03-DEC-005:** On submitting the inline sub-pool panel, the system SHALL:
1. Create child Aliquots from the parent Sample using the existing OpenELIS aliquot mechanism. Each aliquot is assigned a lab number per the LABNO.X-Y convention.
2. Set the `quantity` on each child Aliquot to the organisms-per-sub-pool value entered in the modal.
3. Create test orders on each child Aliquot per BR-V03-012 — copied parent orders plus any reflex-generated orders — all in PENDING state. The parent Sample's existing test orders and results SHALL remain unchanged.
4. Set parent Sample `deconvolutionStatus` to IN_PROGRESS.
5. Show `InlineNotification` kind='success' confirming how many aliquots and test orders were created.

**FR-V03-DEC-006:** Child specimens SHALL be numbered using OpenELIS's existing aliquot-numbering convention. Given a parent pool lab number `LABNO` (e.g., `VCT-2026-000042`):

- First-level aliquots off the main pool: `LABNO.1`, `LABNO.2`, `LABNO.3`, …
- Sub-pools deconvoluted from an aliquot: `LABNO.1-1`, `LABNO.1-2`, …
- The pattern is iterative: a sub-pool can itself be deconvoluted into `LABNO.1-1-1`, `LABNO.1-1-2`, etc., supporting progressive localisation of a positive signal without limit.

Each child specimen receives a real accession number and barcode so lab operations can track it as a physical object. The parent-child relationship is maintained via the existing aliquot parent pointer on the OpenELIS Sample/accession object — no new `parentLotId` field is introduced.

Child Aliquots SHALL inherit from the parent Sample: sampling site (if set on parent). They SHALL also inherit the parent's organism group and species identification (if already set on the parent) as defaults; either MAY be explicitly re-identified on the child if re-examination is performed. Child specimens SHALL inherit the parent's Panel and test order list as defaults; the coordinator MAY add or remove tests on the child's re-test order before submission.

**FR-V03-DEC-007:** After pools are saved, the Sample Identification Detail page SHALL display a single **unified pool + specimen table** (one table, not two stacked). Pool header rows (grey/purple by depth) appear within the table at the appropriate position; specimen rows follow immediately below their pool, indented with tree connectors (└╴/├╴). Each pool header row SHALL display: pool label (species-named when auto-by-species), lab number (LABNO.X), organism count, and a **↗ Split** action button when the pool contains more than one specimen and has not been further split. When ↗ Split is used on a sub-pool, the child pool rows appear nested beneath the parent pool row — the parent row is preserved and NOT replaced. This pattern is recursive: a sub-pool can itself be split into further sub-pools at any depth, producing LABNO.X-Y-Z notation. A **Re-split** action is not available at the top level once any specimen has been physically prepared (ISO 17025 §7.5). The column header reads 'Pool / Specimen' when pools are assigned; 'Specimen' when no pools exist.

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
| physiologicalState | Enum(UNFED, BLOOD_FED, HALF_GRAVID, GRAVID, UNKNOWN) | No | **Added v1.11.** Detinova age-grading classification. UNKNOWN = not assessed. Used to drive Blood-Meal Panel suggestion (BR-V03-014) and surveillance vectorial-capacity calculations. Applies to female mosquitoes only — labs MAY leave NULL for males or non-mosquito specimens. |

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

1. **Vector Identification Worklist** — Status filter dropdown (default: Pending) in the toolbar row alongside the search field. No SideNav sub-items for status filtering. Trap type not shown.
2. **Lot Detail (inline)** — specimen DataTable rendered inside the expanded worklist row. Mixed-species summary bar, positive-pool InlineNotification, bulk-apply batch action, per-specimen inline ID forms — all inline, no breadcrumb or separate page.
3. **Bulk Apply Modal** — compact Modal with species/method/confidence form; applies to all checked specimens on confirm.
4. **Sub-pool Creation Panel (inline)** — Opens inline below lot detail (no modal). Contains number of pools input, assignment strategy selector (RadioButtonGroup), preview grouping button, and sticky action bar with Save Pools. Supports random distribution, auto-grouping by species with species-named pool headers, and manual drag-and-drop assignment with unassigned red zone.
5. **Unified Pool + Specimen Table** — single DataTable with pool header rows interspersed with specimen rows. Pool rows: grey background at depth 0, purple at depth 1+, ▸/▾ icon, lab number, organism count, ↗ Split button (when qty > 1 and no children yet). Specimen rows: indented with └╴/├╴ connectors, checkbox, specimen label, lab number, ID status, species, confidence, ▼ Identify action. When no pools are assigned, table renders as a flat specimen list (standard mode).
6. **Panel Admin (shared)** — standard Panel admin page (panel.md v1.1). Coordinators use Domain filter = VECTOR to scope the list. Vector Config tab shown when editing/creating a VECTOR panel.

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

**BR-V03-011:** Child Aliquots created by deconvolution SHALL inherit from the parent Sample: (a) organism group (SampleType), (b) species identification and confidence level if already set on the parent, and (c) test orders per BR-V03-012. Each inherited value (a or b) MAY be explicitly overridden on the child; an override does not affect the parent or sibling aliquots.

**BR-V03-012:** Test orders on deconvolution aliquots are produced by the following sequence:

1. **Copied orders.** The parent Sample's test orders are copied to each child Aliquot as new independent orders in PENDING state. The parent Sample's original test orders and their results SHALL remain visible and unchanged. Both the parent result and each aliquot's result are stored and independently accessible.

2. **Reflex evaluation at creation (eager).** At aliquot creation time, the Reflex Engine SHALL evaluate all active Reflex Rules against the parent Sample's existing results. Any rules whose trigger conditions are satisfied SHALL generate additional test orders on the child Aliquot. Reflex-generated orders are **added** to — not substituted for — the copied parent orders.

3. **Reflex evaluation at validation (lazy).** As results land on child Aliquots and pass validation, the Reflex Engine SHALL continue to evaluate applicable Reflex Rules against those results and generate further test orders on the same Aliquot per rule configuration.

4. **Provenance.** Every test order SHALL carry a provenance record identifying whether it was (a) copied from a parent Sample, (b) added by a specific Reflex Rule, or (c) manually added by a user. Provenance is visible in the order's audit trail and is included in ISO 17025 technical records (§7.5).

5. **Administration.** Reflex Rules applicable to VECTOR-domain Samples are managed in the existing Admin → Reflex Rules page, filtered by domain = VECTOR. Editing Vector reflex rules requires the `reflex.vector.edit` permission. A set of seed rules covering common surveillance patterns (see Appendix A) SHALL ship with OpenELIS as Active = true.

**BR-V03-013:** Pool assignment is a physical act. Once any sub-pool's status has advanced beyond DRAFT (i.e., it has been received, barcoded, or has any test result), the pool groupings for that sample SHALL be treated as immutable. A 'Reset all pools' function SHALL NOT exist in the production UI. Corrections to pool assignments after physical preparation require a documented supervisor override via the sample amendment workflow (out of scope for V-03).

**BR-V03-014 (added v1.11):** Setting `physiologicalState = BLOOD_FED` on a VectorSpecimenIdentification SHALL surface a *suggestion* to add the Mosquito Blood-Meal Identification Panel (Appendix A.5.6) to the specimen's test orders. The system SHALL NOT auto-order the panel — the suggestion is dismissable, and the lab tech explicitly accepts via UI action. This is intentional: blood-meal analysis is situational (some surveillance programs always run it on blood-fed specimens, others run it only for specific host-preference studies). The suggestion is recorded as `Notes: "Blood-meal panel suggested but not ordered"` if dismissed, for audit completeness.

**BR-V03-015 (added v1.11):** When VR-06 (Plasmodium Drug Resistance) reflex fires on a confirmed *P. falciparum* positive, the resulting test orders inherit the standard reflex provenance ("reflex:VR-06") per BR-V03-012 §4. Drug-resistance results MAY be flagged for export to national reference databases (WHO Global Malaria Programme drug resistance surveillance) via the existing FHIR outbound push pipeline; the export flag is configured at the Panel level on the Plasmodium Drug Resistance Panel and is not a per-result UI choice.

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
| `label.vectorId.physiologicalState` | Physiological State |
| `label.vectorId.physiologicalState.unfed` | Unfed |
| `label.vectorId.physiologicalState.bloodFed` | Blood-fed |
| `label.vectorId.physiologicalState.halfGravid` | Half-gravid |
| `label.vectorId.physiologicalState.gravid` | Gravid |
| `label.vectorId.physiologicalState.unknown` | Unknown / not assessed |
| `message.vectorId.bloodMealSuggest` | Blood-fed female detected. Order Blood-Meal Identification Panel? |
| `button.vectorId.addBloodMealPanel` | Add Panel to Order |
| `button.vectorId.dismissBloodMealSuggest` | Dismiss |
| `message.vectorId.bloodMealAdded` | Blood-Meal Identification Panel added to specimen test orders. |
| `message.vectorId.bloodMealDismissed` | Suggestion dismissed; recorded in specimen Notes. |
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
| `label.vectorDec.poolCount` | Number of pools |
| `label.vectorDec.assignmentMethod` | Assignment method |
| `label.vectorDec.assignRandomly` | Assign randomly |
| `label.vectorDec.assignBySpecies` | Auto sub-pool by species |
| `label.vectorDec.assignManually` | Assign manually |
| `label.vectorDec.notes` | Notes |
| `label.vectorDec.status.pending` | Deconvolution Needed |
| `label.vectorDec.status.inProgress` | Deconvolution In Progress |
| `label.vectorDec.status.complete` | Deconvolution Complete |
| `button.vectorDec.splitSubpools` | Split into Sub-pools |
| `button.vectorDec.previewGrouping` | Preview Grouping |
| `button.vectorDec.savePools` | Save Pools |
| `button.vectorDec.reSplit` | Re-split |
| `button.vectorDec.cancel` | Cancel |
| `heading.vectorDec.poolTree` | Sub-pool Grouping |
| `message.vectorDec.success` | Sub-pools created and assigned. Pool hierarchy saved. |
| `message.vectorDec.complete` | Deconvolution complete — {positive} of {total} specimens positive ({pct}%). |
| `error.vectorDec.countRequired` | Pool count is required. |
| `error.vectorDec.duplicate` | A deconvolution task is already active for this lot and positive result. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| VectorSpecimenIdentification.vectorSpecies | Required | `error.vectorId.speciesRequired` |
| VectorSpecimenIdentification.identificationMethod | Required | `error.vectorId.methodRequired` |
| VectorSpecimenIdentification.confidence | Required | `error.vectorId.confidenceRequired` |
| VectorMolecularRecord.genbankAccession | Pattern `[A-Z]{1,2}[0-9]{5,8}` if provided | `error.vectorId.accessionFormat` |
| VectorSpecimenIdentification.physiologicalState | Optional; one of UNFED / BLOOD_FED / HALF_GRAVID / GRAVID / UNKNOWN; defaults to UNKNOWN when not set | — |
| VectorTestPanel.name | Required, unique among active panels | `error.vectorPanel.nameRequired`, `error.vectorPanel.nameDuplicate` |
| VectorTestPanel.items | At least 1 item if isActive = true | `error.vectorPanel.noTests` |
| Deconvolution — Number of Aliquots | Required; integer ≥ 2 | `error.vectorDec.countRequired` |
| Deconvolution — Organisms per Aliquot | Required; integer ≥ 1 | `error.vectorDec.quantityRequired` |
| Deconvolution — Total organisms (Number × Organisms per Aliquot) | Soft warning (non-blocking) if > parent quantity | `warning.vectorDec.exceedsParentQuantity` |

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
- [ ] Identification form includes a Physiological State Select (Unfed / Blood-fed / Half-gravid / Gravid / Unknown), default Unknown
- [ ] When Physiological State = Blood-fed and the form is saved, a soft suggestion appears offering to add the Mosquito Blood-Meal Identification Panel
- [ ] Accepting the suggestion adds the panel to the specimen's pending orders; dismissing records the dismissal in specimen Notes
- [ ] The system never auto-orders the Blood-Meal Panel — it only ever suggests (BR-V03-014)
- [ ] VR-06 Plasmodium Drug Resistance reflex fires only on confirmed *P. falciparum* positive results (not other Plasmodium species)
- [ ] Drug-resistance test orders carry provenance "reflex:VR-06" in the audit trail

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

- [ ] Sub-pool panel opens inline within the lot detail, not in a modal
- [ ] Split into Sub-pools button is available on all vector lots
- [ ] Assign randomly distributes specimens evenly
- [ ] Auto by species groups specimens by species; pool header shows species name when all specimens match
- [ ] Manual mode shows drag-and-drop; unassigned specimens shown in red; all must be assigned before save
- [ ] On save, pool header rows appear in the unified specimen table above their grouped specimens
- [ ] ↗ Split on a pool row (qty > 1, no children) opens the scoped re-split panel for that pool; saving creates child pool rows nested under the parent without removing the parent row
- [ ] A 'Reset all pools' action does not exist in the UI
- [ ] Specimens rows show └╴ (last in pool) or ├╴ (not last) tree connectors indicating pool membership

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

### Reflex Integration

- [ ] Deconvolution aliquots receive copied parent test orders PLUS any reflex-generated orders at creation (eager evaluation)
- [ ] Reflex rules continue to fire as new aliquot results are validated (lazy evaluation)
- [ ] Reflex-generated orders are additive — copied parent orders remain on the aliquot alongside them
- [ ] Each test order on an aliquot shows provenance (copied-from-parent / reflex-rule-VR-NN / manual) in the audit trail
- [ ] Admin → Reflex Rules page supports Domain filter including VECTOR, and seed rules VR-01 through VR-05 appear as Active = true on a fresh install
- [ ] Lab Technician role cannot access Admin → Reflex Rules page (reflex.vector.edit permission not granted)
- [ ] Seed reflex rule referencing a missing output Panel auto-deactivates with warning.reflex.seedPanelMissing logged
- [ ] Labs can author custom reflex rules that fire alongside seed rules (cumulative ADD behavior)

---

## 13. Reporting — Laporan Hasil Consolidation

When a deconvoluted pool sample's results are included in a Laporan Hasil (S-06 Compliance Report) or a vector surveillance certificate, the following consolidation rules apply:

**FR-V03-RPT-001:** The customer-facing certificate SHALL present deconvoluted children consolidated under their parent pool, not as a flat list of child accession numbers. The child `LABNO.X-Y` identifiers are internal tracking references and SHALL NOT be listed as standalone rows on the certificate.

**FR-V03-RPT-002:** The certificate SHALL include a deconvolution narrative in the findings section. Format:

> *"Pool [LABNO] tested positive for [pathogen]. Deconvolution performed across [N] sub-specimens ([LABNO.1], [LABNO.2], …). [M] of [N] sub-specimens confirmed positive: [LABNO.1-1] — [species], [confidence]."*

The narrative is generated automatically from the deconvolution aliquot records and their VectorSpecimenIdentification data. It replaces a flat results table for positive pools.

**FR-V03-RPT-003:** The deconvolution lineage depth is recorded but not expanded beyond two levels on the printed certificate. Deeper nesting (e.g., `LABNO.1-1-1`) is accessible in the system audit view and API but summarised as "further sub-deconvolution performed" on the certificate.

**FR-V03-RPT-004:** The parent pool result row on the certificate SHALL show status "Positive — Deconvolution Complete" (or "Positive — Deconvolution In Progress" if not yet resolved) rather than a raw result value. The individual pathogen result values are shown in the deconvolution narrative block, not in the main results table.

---

## 14. Future Scope

> Most characterization workflows that previously lived in this section have been promoted into V-03 v1.0 (per v1.11). What remains here is the truly future work that benefits from a future spec or release.

### 14.1 Host range expansion for Blood-Meal Identification

The Mosquito Blood-Meal Identification Panel (Appendix A.5.6) ships with the urban/rural workhorse hosts: human, bovine, canine, avian (chicken), porcine, caprine. Future expansion candidates:

- **Sylvatic / wildlife hosts** — non-human primate, bat, rodent, deer — needed for forest-edge transmission research and zoonotic surveillance. Likely shipped as an optional add-on Panel ("Bloodmeal — Wildlife Hosts") rather than added to the default panel, since most surveillance programs don't run them.
- **Regional livestock variants** — ovine (sheep), equine, water buffalo — added as default Panel content when deployed in regions where these are dominant blood sources.

This is content/catalog work, not platform work. Labs MAY add these as additional tests within the existing panel today.

### 14.2 Drug-resistance reference set updates

VR-06 ships with the current WHO Global Malaria Programme reference set (pfkelch13, pfcrt, pfmdr1, dhfr, dhps). The reference set updates roughly every 5–10 years as drug policy and resistance epidemiology evolve. A future spec release SHOULD review the marker set against the current WHO Antimalarial Resistance Surveillance Reference at deployment time. New markers (e.g., for new antimalarial introductions) are added by extending the existing Plasmodium Drug Resistance Panel — no schema change.

### 14.3 Insecticide formulation expansion

The Vector Insecticide Resistance Panel (Appendix A.5.8) ships with deltamethrin and permethrin bioassays plus kdr/ace-1 genotyping. Programs using non-default insecticides (Bendiocarb, Pirimiphos-methyl, Clothianidin, neonicotinoids) extend the panel locally. Future scope candidate: ship regional default bundles (e.g., a "Sub-Saharan Africa Pyrethroid + IRS" bundle).

### 14.4 Vectorial Capacity Calculation

With the new `physiologicalState` field, OpenELIS now has the data shape to compute **vectorial capacity** (Garrett-Jones 1964 formulation) for a given vector species at a given site over a given period. This is a research-grade entomological metric that combines biting rate, parity (proportion of females that have laid eggs at least once), survival probability, and vector competence. Out of scope for V-03 v1.0 reporting; possible candidate for V-04 v1.4 (alongside the MLE infection-rate estimator already deferred to V-04c).

### 14.5 Cross-Cutting Note — Reflex Engine Coverage

The reflex engine extended in BR-V03-012 has now demonstrated coverage of speciation (VR-01..05) AND characterization (VR-06) workflows. Labs may author additional reflex rules through Admin → Reflex Rules without engineering involvement — the platform requires only catalog content (Panels) and rule configuration to enable any new pathogen, host, or marker workflow.

---

## Appendix A — Vector Seed Reflex Rules & Recommended Default Test Catalog

This appendix defines the Reflex Rules and supporting Panel/test catalog entries that SHALL ship with OpenELIS as pre-configured seed data when the Vector domain is enabled. Seed rules are Active = true by default on a new installation, are managed through the existing Admin → Reflex Rules page (filtered by domain = VECTOR), and require the `reflex.vector.edit` permission to modify or deactivate.

### A.1 Seed Rule Conventions

All seed rules conform to the following:

- **Behavior:** ADD — reflex output is appended to the target Aliquot's existing orders, not substituted.
- **Evaluation:** Both eager (at aliquot creation against the parent's existing results) and lazy (as validated results land on the aliquot).
- **Trigger scope:** Fires on any VECTOR-domain specimen — pool or individual — whose result matches the trigger condition. Labs MAY constrain further (e.g., to `quantity = 1`) by editing the rule.
- **Provenance tag:** "System Seed Rule — VR-NN" in the order audit trail, distinguishing shipped rules from lab-authored rules.
- **Activation state:** Active on install. Deactivation is non-destructive and reversible.

### A.2 Seed Rule Inventory

| ID | Rule Name | Trigger Panel | Trigger Condition | Output Panel | Notes |
|---|---|---|---|---|---|
| VR-01 | Malaria Speciation | Malaria Screening Panel | Any result outside normal range | Plasmodium Speciation Panel | Default speciation covers *P. falciparum*, *P. vivax*, *P. malariae*, *P. ovale*. Labs may add *P. knowlesi* or remove species per regional scope. |
| VR-02 | Dengue Serotyping | Dengue Screening Panel | Any result outside normal range | DENV Serotyping Panel | Default covers DENV-1 through DENV-4. Fires on NS1 ELISA or NS1 RT-PCR positive. |
| VR-03 | Arbovirus Confirmation | Arbovirus Screening Panel | Any result outside normal range | Arbovirus Confirmation Panel | Generic confirmation step. Labs with pathogen-specific screens (Zika, Chikungunya, WNV) SHOULD replace this with the pathogen-specific reflex rules below. |
| VR-04 | Zika Confirmation | Zika Screening Panel | Any result outside normal range | Zika Confirmation Panel | Fires on Zika RT-PCR positive. Confirmation panel typically referred out to reference lab (PRNT capability). |
| VR-05 | Chikungunya Confirmation | Chikungunya Screening Panel | Any result outside normal range | Chikungunya Confirmation Panel | Fires on CHIKV RT-PCR or IgM positive. Confirmation includes genotype/lineage determination. |
| VR-06 | Plasmodium Drug Resistance | Plasmodium Speciation Panel | *P. falciparum* species-specific PCR result outside normal range | Plasmodium Drug Resistance Panel | **Added v1.11.** Fires only on *P. falciparum* positive (other species are not yet associated with widespread drug resistance markers). WHO Global Malaria Programme reference set: pfkelch13, pfcrt, pfmdr1, dhfr, dhps. Labs MAY constrain to individual specimens (`quantity = 1`) to avoid running expensive sequencing on unresolved pools — recommended default. |

### A.3 Panel Pre-requisites

Each seed reflex rule references an output Panel that MUST exist in the Panel catalog. On application startup, the Reflex Engine SHALL check each active seed rule's output Panel. If the referenced Panel is missing or inactive, the rule SHALL be deactivated automatically and a warning logged to the admin audit trail with message key `warning.reflex.seedPanelMissing` and the rule identifier. This prevents runtime failures when a lab deploys without the full pathogen surveillance test catalog. The rule remains in configuration (Active = false) and the admin can re-enable it once the missing Panel is added.

### A.4 Lab-Authored Rule Extensions

Labs MAY author additional reflex rules through Admin → Reflex Rules. Lab-authored rules follow the same structure as seed rules but carry a "Lab-Authored — created by [user] on [date]" provenance tag. A lab-authored rule MAY target the same trigger Panel as a seed rule; in that case both rules fire (ADD semantics), producing cumulative reflex output. This supports local customisation (e.g., a lab adding a drug-resistance genotyping reflex on top of the standard Malaria Speciation reflex) without requiring seed rule modification.

### A.5 Recommended Default Vector Test Catalog

The following Panels and constituent tests SHOULD be pre-loaded into the VECTOR Test Catalog on OpenELIS installations that enable Vector surveillance. Labs MAY modify, replace, or extend any entry; the seed reflex rules in A.2 reference Panels by stable ID so edits to test membership do not break reflex linkage.

All panels carry `panelDomain = VECTOR`. Where an organism group is specified, the panel is suggested (not restricted) at order entry when the sample's organism group matches (FR-V03-PNL-004).

#### A.5.1 Malaria Surveillance

**Panel: Malaria Screening Panel (vector)**

- Organism Group: Mosquito (Anopheles)
- Description: First-pass pan-*Plasmodium* detection on pooled or individual Anopheles specimens.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Pan-Plasmodium CSP ELISA | ELISA | 71712-2 | POS / NEG | Circumsporozoite protein antigen; classic entomological method |
| Pan-Plasmodium 18S rRNA PCR | Real-time PCR | 32702-1 | POS / NEG + Ct | Genus-level; higher sensitivity than CSP ELISA |

**Panel: Plasmodium Speciation Panel (vector)**

- Organism Group: Mosquito (Anopheles)
- Description: Species-level confirmation following positive pan-*Plasmodium* result. Target of VR-01 reflex.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| *P. falciparum* species-specific PCR | Real-time PCR | — | POS / NEG + Ct | 18S rRNA or cytb target |
| *P. vivax* species-specific PCR | Real-time PCR | — | POS / NEG + Ct | |
| *P. malariae* species-specific PCR | Real-time PCR | — | POS / NEG + Ct | |
| *P. ovale* species-specific PCR | Real-time PCR | — | POS / NEG + Ct | |

Labs MAY add *P. knowlesi*-specific PCR where endemic (Southeast Asia).

#### A.5.2 Dengue Surveillance

**Panel: Dengue Screening Panel (vector)**

- Organism Group: Mosquito (*Aedes aegypti*, *Ae. albopictus*)
- Description: Initial DENV detection in *Aedes* pools.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| DENV NS1 Antigen ELISA | ELISA | 72839-2 | POS / NEG | Non-structural protein 1 |
| DENV Pan-serotype RT-PCR | RT-PCR | 76753-0 | POS / NEG + Ct | Amplifies across all four serotypes |

**Panel: DENV Serotyping Panel (vector)**

- Organism Group: Mosquito (*Aedes*)
- Description: Serotype confirmation following positive DENV screen. Target of VR-02 reflex.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| DENV-1 RT-PCR | Serotype-specific RT-PCR | 85820-6 | POS / NEG + Ct | |
| DENV-2 RT-PCR | Serotype-specific RT-PCR | 85821-4 | POS / NEG + Ct | |
| DENV-3 RT-PCR | Serotype-specific RT-PCR | 85822-2 | POS / NEG + Ct | |
| DENV-4 RT-PCR | Serotype-specific RT-PCR | 85823-0 | POS / NEG + Ct | |

#### A.5.3 Arbovirus Surveillance (Generic)

**Panel: Arbovirus Screening Panel (vector)**

- Organism Group: Mosquito, Tick
- Description: Pan-arbovirus screen covering flaviviruses and alphaviruses; for labs without pathogen-specific screens.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Pan-flavivirus RT-PCR | RT-PCR | — | POS / NEG + Ct | NS5 or 3'UTR target |
| Pan-alphavirus RT-PCR | RT-PCR | — | POS / NEG + Ct | nsP1 or E1 target |

**Panel: Arbovirus Confirmation Panel (vector)**

- Organism Group: Mosquito, Tick
- Description: Generic confirmation when pathogen-specific panels are not available. Target of VR-03 reflex. Labs SHOULD replace this with pathogen-specific reflex rules (VR-04, VR-05, or lab-authored) once specific positivity has been localised.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Virus isolation (cell culture) | Cell culture | — | Isolated / Not isolated | C6/36 or Vero cells |
| Pathogen-specific sequencing | Sanger / NGS | — | Sequence + species call | Generic; replaced by specific panels in most labs |

#### A.5.4 Zika Virus Surveillance

**Panel: Zika Screening Panel (vector)**

- Organism Group: Mosquito (*Aedes*)
- Description: Zika-specific detection in *Aedes* pools.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Zika RT-PCR (NS5 target) | Real-time RT-PCR | 81650-4 | POS / NEG + Ct | |

**Panel: Zika Confirmation Panel (vector)**

- Organism Group: Mosquito
- Description: Post-positive confirmation. Target of VR-04 reflex. Often referred out to reference lab.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Zika envelope gene sequencing | Sanger / NGS | — | Sequence + lineage call | Asian, African lineage determination |
| Zika plaque reduction neutralization | PRNT₉₀ | — | Titer (numeric) | Reference lab capability |

#### A.5.5 Chikungunya Virus Surveillance

**Panel: Chikungunya Screening Panel (vector)**

- Organism Group: Mosquito (*Aedes*)
- Description: CHIKV detection in *Aedes* pools.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| CHIKV RT-PCR | Real-time RT-PCR | 80825-3 | POS / NEG + Ct | nsP1 or E1 target |
| CHIKV IgM ELISA | ELISA | — | POS / NEG | Optional; used when PCR negative but suspicion remains |

**Panel: Chikungunya Confirmation Panel (vector)**

- Organism Group: Mosquito
- Description: Genotype and lineage confirmation. Target of VR-05 reflex.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| CHIKV E1 gene sequencing | Sanger / NGS | — | Sequence + genotype call | ECSA, West African, Asian lineage |
| CHIKV virus isolation | Cell culture | — | Isolated / Not isolated | C6/36 cells |

#### A.5.6 Mosquito Blood-Meal Identification (v1.11)

**Panel: Mosquito Blood-Meal Identification Panel (vector)**

- Organism Group: Mosquito (any blood-feeding species)
- Description: Host species identification on blood-fed female mosquitoes. Suggested by the system when a specimen's `physiologicalState = BLOOD_FED` (FR-V03-ID-013, BR-V03-014). Always manually ordered — never auto-ordered. Default host list covers the urban/rural workhorse species; labs add wildlife or regional hosts as needed.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| Bloodmeal — Human (cytb) | Host-specific PCR | — | POS / NEG | Kent & Norris (2005) cytb primers, Homo sapiens reverse |
| Bloodmeal — Bovine (Bos taurus) | Host-specific PCR | — | POS / NEG | Cattle |
| Bloodmeal — Canine (Canis familiaris) | Host-specific PCR | — | POS / NEG | Dog |
| Bloodmeal — Avian (Gallus gallus) | Host-specific PCR | — | POS / NEG | Chicken (proxy for avian hosts in urban contexts) |
| Bloodmeal — Porcine (Sus scrofa) | Host-specific PCR | — | POS / NEG | Pig |
| Bloodmeal — Caprine (Capra hircus) | Host-specific PCR | — | POS / NEG | Goat |

Labs SHOULD extend the panel locally with regionally-relevant hosts (e.g., wildlife species for sylvatic transmission studies, ovine for sheep-rearing regions). The Detinova `physiologicalState` field on VectorSpecimenIdentification (FR-V03-ID-012) drives the panel suggestion.

#### A.5.7 Plasmodium Drug Resistance (v1.11)

**Panel: Plasmodium Drug Resistance Panel (vector)**

- Organism Group: Mosquito (Anopheles)
- Description: Drug-resistance genotyping of *P. falciparum* parasites in confirmed positive specimens. Target of VR-06 reflex. WHO Global Malaria Programme reference set; labs SHOULD verify markers against current WHO Antimalarial Resistance Surveillance Reference at deployment time.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| pfkelch13 | Sanger sequencing | — | Variant call (e.g., "C580Y") + sequence | Artemisinin partial resistance — WHO-tracked marker |
| pfcrt | PCR + restriction / sequencing | — | Variant call (76T / K76) | Chloroquine resistance |
| pfmdr1 | PCR + sequencing | — | Variant calls (Y86, Y184, S1034, N1042, D1246) + sequence | Multiple-drug resistance |
| dhfr | PCR + sequencing | — | Variant calls (S108, N51, R59, I164) + sequence | Pyrimethamine component of SP |
| dhps | PCR + sequencing | — | Variant calls (A437, K540, A581, A613) + sequence | Sulfadoxine component of SP |

Drug-resistance results MAY be flagged for export to national WHO reference databases per BR-V03-015 (Panel-level export flag).

#### A.5.8 Vector Insecticide Resistance (v1.11)

**Panel: Vector Insecticide Resistance Panel (vector)**

- Organism Group: Mosquito (any vector species; Anopheles, Aedes, Culex)
- Description: Genotyping and bioassay testing of vector specimens for resistance to insecticides used in the local vector-control program. **Manually ordered — no reflex rule.** Insecticide testing is program-driven (the vector-control program decides what to test and when), not pathogen-driven, so V-03 does not ship a reflex for it. Labs that want to auto-order insecticide testing on confirmed primary vectors MAY author their own reflex rule via Admin → Reflex Rules.

| Test Name | Method | LOINC (approx) | Result Type | Notes |
|---|---|---|---|---|
| kdr-East (L1014S) | PCR-RFLP / TaqMan | — | RR / RS / SS | Pyrethroid resistance, eastern *An. gambiae s.l.* |
| kdr-West (L1014F) | PCR-RFLP / TaqMan | — | RR / RS / SS | Pyrethroid resistance, western *An. gambiae s.l.* |
| ace-1 (G119S) | PCR-RFLP / TaqMan | — | RR / RS / SS | Organophosphate / carbamate resistance |
| WHO bottle bioassay — Deltamethrin | Phenotypic bioassay | — | % mortality at 24h, susceptibility class | Per WHO 2022 standard procedure |
| WHO bottle bioassay — Permethrin | Phenotypic bioassay | — | % mortality at 24h, susceptibility class | Per WHO 2022 standard procedure |

Labs SHOULD add bioassays for the specific insecticide formulations used in their region (e.g., Bendiocarb, Pirimiphos-methyl, Clothianidin) — the WHO procedure is applicable to any compound. Substrate sample type is typically a leg-aliquot of the source specimen.

### A.6 LOINC Coding Note

LOINC codes marked "(approx)" are the closest commonly-used clinical-equivalent codes that have been extended for vector surveillance use; the specimen source is "Arthropod, Mosquito" rather than human. Where a vector-specific LOINC code exists, it SHOULD be used; where no LOINC code exists, labs MAY assign local codes in their Test Catalog (the Test entity supports local code + LOINC code side by side). Vector surveillance test coding is evolving; this list represents best-available mappings as of 2026-04 and SHOULD be reviewed against the current LOINC database (loinc.org) at deployment time. Seed rules reference Panels by stable ID, not by LOINC, so LOINC updates do not require reflex rule changes.
