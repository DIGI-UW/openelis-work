# Vector Specimen Types & Taxonomy
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-13
**Status:** Draft for Review
**Jira:** TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Sample Type Domain Classification (S-04, OGC-538), Compliance Standards Administration (S-01, OGC-528), Sampling Site Registry (S-02, OGC-536)

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
13. Seed Data

---

## 1. Executive Summary

V-01 establishes the foundational data model and admin configuration UI for vector surveillance in OpenELIS Global. It introduces three reference catalogs — **Vector Species**, **Trap Types**, and **Vector Sample Types** — plus the two-level `CollectionLot` → `VectorSpecimen` data model that downstream vector specs (V-02 Collection Workflow, V-03 Testing & Identification, V-04 Surveillance Reporting) will operate on. This is the first spec in the vector extension layer, and its data model is the foundation for all vector workflows.

---

## 2. Problem Statement

**Current state:** OpenELIS has no concept of vector specimens (mosquitoes, ticks, rodents, other arthropods). Existing Sample Types are clinical or environmental, and the data model assumes one-sample-per-test — which does not work for mosquito pools (one PCR test run on 25 pooled mosquitoes). Vector surveillance programs in Indonesia and other countries currently track this data in paper logbooks or Excel, with no linkage to laboratory test results.

**Impact:**
- National vector surveillance programs (e.g., Indonesia's Malaria and Dengue surveillance) cannot use OpenELIS for their collection-to-result workflows.
- Labs running both clinical and vector testing need a separate system for vector work, fragmenting their data.
- Downstream reporting (density indices, infection rates, distribution) is impossible without a standardized specimen model.

**Proposed solution:** Extend the existing Sample Type framework with a VECTOR domain, introduce three admin-managed reference catalogs (Species, Trap Types, Vector Sample Types), and define the `CollectionLot` / `VectorSpecimen` entities that support both individual and pooled specimens. This spec delivers only the admin configuration UI and data model — the collection, testing, and reporting workflows come in V-02, V-03, and V-04.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Vector Program Coordinator | Full CRUD on Species, Trap Types, Vector Sample Types | Primary admin user |
| National Reference Lab Admin | Full CRUD + bulk seed import | May import WHO/CDC reference lists |
| Lab Supervisor | View all three catalogs | Read-only for order entry context |
| Lab Technician | View Species + Trap Types only | Used at sample receipt for matching |
| System Administrator | Full | Platform-level role |

**Required permission keys:**

- `vector.species.view` — List, search, filter species catalog
- `vector.species.edit` — Create, update, deactivate species records
- `vector.trapType.view` — List, search trap type registry
- `vector.trapType.edit` — Create, update, deactivate trap types
- `vector.sampleType.view` — View vector-domain sample types and their profiles
- `vector.sampleType.edit` — Extend Sample Types into VECTOR domain, configure VectorSpecimenProfile

---

## 4. Functional Requirements

### 4.1 Vector Species Catalog

**FR-V01-001:** The system MUST provide a catalog of vector species with taxonomic identification at genus + species + optional subspecies level.

**FR-V01-002:** Each species record MUST include: genus, species, optional subspecies, common name, organism group (MOSQUITO / TICK / RODENT / OTHER_ARTHROPOD / OTHER_ANIMAL), optional default test panel, active flag.

**FR-V01-003:** Each species MUST support multi-select associations to target pathogens (e.g., *Aedes aegypti* → Dengue, Chikungunya, Zika, Yellow Fever).

**FR-V01-004:** Each species MUST support multi-select lifecycle stages (EGG, LARVA, PUPA, NYMPH, ADULT, ENGORGED_ADULT) — varies by organism group.

**FR-V01-005:** The catalog MUST ship with a seed list of ~40 common vector species covering the major Indonesian and global program needs (see Seed Data section).

**FR-V01-006:** Genus field MUST offer typeahead suggestions from existing genera in the catalog to encourage consistency.

**FR-V01-007:** Species records MUST be soft-deletable (marked inactive) to preserve referential integrity for historical collection lots. Hard delete MUST be blocked when any CollectionLot references the species.

### 4.2 Trap Type Registry

**FR-V01-010:** The system MUST provide a registry of collection devices (traps) with code, display name, target organism group, collection method, description, and active flag.

**FR-V01-011:** Each trap type MUST be classified by collection method: LIGHT, BAIT, GRAVID, ADULT_RESTING, LARVAL, DRAG, SNAP, LIVE, OVIPOSITION, OTHER.

**FR-V01-012:** The registry MUST ship with seed data for WHO-standard and common devices: CDC Light Trap, BG-Sentinel, BG-Pro, Ovitrap, Gravid Trap, Human Landing Catch (HLC), Pyrethrum Spray Collection (PSC), Tick Drag, Tick Flag, Sherman Trap, Tomahawk Trap, Pitfall Trap (see Seed Data).

**FR-V01-013:** Trap types MUST be soft-deletable. Hard delete blocked when referenced by CollectionLot.

### 4.3 Vector Sample Type Extension

**FR-V01-020:** The existing `sampleDomain` enum (from S-04, OGC-538) MUST be extended with the VECTOR value. Existing CLINICAL, ENVIRONMENTAL, and BOTH values remain unchanged.

**FR-V01-021:** Sample Types with `sampleDomain = VECTOR` MUST have an associated `VectorSpecimenProfile` 1:1 record holding vector-specific defaults.

**FR-V01-022:** The VectorSpecimenProfile MUST include: default pooling strategy (INDIVIDUAL / POOL_FIXED / POOL_VARIABLE), default pool size (nullable when strategy=INDIVIDUAL), expected lifecycle stages (multi-select), allowed organism groups (multi-select), preservation method default.

**FR-V01-023:** The existing Sample Type admin UI MUST be extended: when the user selects `sampleDomain = VECTOR`, a "Vector Profile" accordion section MUST appear on the edit form.

**FR-V01-024:** When a Sample Type's domain is changed FROM VECTOR to another domain, the system MUST warn the user that the VectorSpecimenProfile record will be archived; confirmation required.

### 4.4 Collection Lot & Vector Specimen Data Model (model-only in V-01)

**FR-V01-030:** The system MUST define the `CollectionLot` entity as the container for vector collection events. Each lot represents one trap-collection event: either a pool of N organisms or an individual.

**FR-V01-031:** The `CollectionLot` entity MUST reference: sampling site (FK to SamplingSite from S-02), trap type (FK), collection date/time, pool flag, pool size (NULL when individual), collector name, weather conditions (optional), status (DRAFT / RECEIVED / PROCESSING / TESTED / ARCHIVED).

**FR-V01-032:** The system MUST define the `VectorSpecimen` entity as an individual organism record within a CollectionLot. For an INDIVIDUAL lot, there is exactly 1 specimen; for a POOL lot, there are N specimens.

**FR-V01-033:** Each `VectorSpecimen` MUST reference: parent CollectionLot (FK), species (FK, may be NULL until identified), lifecycle stage, sex (MALE / FEMALE / UNKNOWN / N_A), condition (LIVE / DEAD / DAMAGED / ENGORGED).

**FR-V01-034:** V-01 MUST NOT provide UI for creating or editing CollectionLot or VectorSpecimen records — these belong to V-02 Collection Workflow and V-03 Testing & Identification.

**FR-V01-035:** V-01 MUST NOT provide UI for pool deconvolution — this belongs to V-03.

### 4.5 Bulk Seed Import

**FR-V01-040:** Admins holding `vector.species.edit` OR `vector.trapType.edit` MUST be able to reload the bundled seed dataset (idempotent — inserts missing records, skips existing matches by unique key).

**FR-V01-041:** Bulk seed reload MUST produce an import summary: created count, skipped-existing count, error count, duration.

**FR-V01-042:** Bulk seed reload MUST be audit-logged (who, when, counts).

---

## 5. Data Model

### New Entities

**VectorSpecies**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| genus | VARCHAR(60) | Yes | e.g., "Aedes", "Anopheles" |
| species | VARCHAR(60) | Yes | e.g., "aegypti", "sundaicus" |
| subspecies | VARCHAR(60) | No | e.g., "complex" |
| common_name | VARCHAR(100) | No | e.g., "Yellow Fever Mosquito" |
| organism_group | ENUM | Yes | MOSQUITO / TICK / RODENT / OTHER_ARTHROPOD / OTHER_ANIMAL |
| default_test_panel_id | UUID | No | FK → TestPanel (optional suggested panel) |
| active | BOOLEAN | Yes | Soft-delete flag, default TRUE |
| created_at, updated_at, created_by, updated_by | — | Yes | Audit fields |

**Unique constraint:** `(genus, species, subspecies)` — `subspecies` treated as empty string for uniqueness when NULL.

**VectorSpeciesPathogen** (many-to-many)

| Field | Type | Required | Notes |
|---|---|---|---|
| species_id | UUID | Yes | FK → VectorSpecies |
| pathogen_code | VARCHAR(40) | Yes | e.g., "DENV", "CHIKV", "PLASMODIUM_FALCIPARUM" |

**VectorSpeciesLifecycle** (many-to-many)

| Field | Type | Required | Notes |
|---|---|---|---|
| species_id | UUID | Yes | FK → VectorSpecies |
| stage | ENUM | Yes | EGG / LARVA / PUPA / NYMPH / ADULT / ENGORGED_ADULT |

**TrapType**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| code | VARCHAR(30) | Yes | Unique. e.g., "CDC_LT", "BG_SENT", "OVITRAP" |
| display_name | VARCHAR(100) | Yes | e.g., "CDC Light Trap" |
| target_organism_group | ENUM | Yes | MOSQUITO / TICK / RODENT / OTHER_ARTHROPOD / OTHER_ANIMAL |
| collection_method | ENUM | Yes | LIGHT / BAIT / GRAVID / ADULT_RESTING / LARVAL / DRAG / SNAP / LIVE / OVIPOSITION / OTHER |
| description | TEXT | No | Free text |
| active | BOOLEAN | Yes | Soft-delete flag |
| created_at, updated_at, created_by, updated_by | — | Yes | Audit fields |

**VectorSpecimenProfile** (1:1 with SampleType)

| Field | Type | Required | Notes |
|---|---|---|---|
| sample_type_id | UUID | Yes | PK, FK → SampleType |
| pooling_strategy | ENUM | Yes | INDIVIDUAL / POOL_FIXED / POOL_VARIABLE |
| default_pool_size | INT | No | Required when strategy=POOL_FIXED; max 100 |
| expected_lifecycle_stages | ARRAY<ENUM> | No | Subset of stages |
| allowed_organism_groups | ARRAY<ENUM> | Yes | At least one |
| preservation_method | VARCHAR(60) | No | e.g., "95% Ethanol", "RNAlater", "Silica Gel" |

**CollectionLot** (model only — UI in V-02)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| lab_number | VARCHAR(40) | Yes | Unique, assigned at receipt (V-02) |
| sampling_site_id | UUID | Yes | FK → SamplingSite (S-02) |
| trap_type_id | UUID | Yes | FK → TrapType |
| sample_type_id | UUID | Yes | FK → SampleType (must be VECTOR domain) |
| collection_start_at | TIMESTAMP | Yes | Trap deployed |
| collection_end_at | TIMESTAMP | Yes | Trap collected |
| is_pool | BOOLEAN | Yes | TRUE if >1 specimen pooled together |
| pool_size | INT | No | Required when is_pool=TRUE; NULL when individual |
| collector_name | VARCHAR(120) | No | Field collector |
| weather_conditions | TEXT | No | Optional |
| status | ENUM | Yes | DRAFT / RECEIVED / PROCESSING / TESTED / ARCHIVED |
| created_at, updated_at, created_by, updated_by | — | Yes | Audit |

**VectorSpecimen** (model only — UI in V-03)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| collection_lot_id | UUID | Yes | FK → CollectionLot |
| species_id | UUID | No | FK → VectorSpecies (NULL until identified) |
| lifecycle_stage | ENUM | No | See stages above |
| sex | ENUM | No | MALE / FEMALE / UNKNOWN / N_A |
| condition | ENUM | No | LIVE / DEAD / DAMAGED / ENGORGED |
| notes | TEXT | No | Morphological observations |
| created_at, updated_at | — | Yes | Audit |

### Modified Entities

**SampleType (existing)**

- `sampleDomain` enum extended: add `VECTOR` value (existing: CLINICAL, ENVIRONMENTAL, BOTH).
- No other SampleType changes in V-01.

---

## 6. API Endpoints

### Vector Species
- `GET  /api/v1/admin/vector/species` — List with filters (organism_group, active, search)
- `GET  /api/v1/admin/vector/species/{id}` — Detail with pathogens, lifecycle stages
- `POST /api/v1/admin/vector/species` — Create
- `PUT  /api/v1/admin/vector/species/{id}` — Update
- `DELETE /api/v1/admin/vector/species/{id}` — Soft delete (sets active=FALSE)

### Trap Types
- `GET  /api/v1/admin/vector/trap-types` — List with filters
- `GET  /api/v1/admin/vector/trap-types/{id}` — Detail
- `POST /api/v1/admin/vector/trap-types` — Create
- `PUT  /api/v1/admin/vector/trap-types/{id}` — Update
- `DELETE /api/v1/admin/vector/trap-types/{id}` — Soft delete

### Vector Sample Types (Profile)
- `GET  /api/v1/admin/vector/sample-types` — List all SampleTypes where sampleDomain=VECTOR, with embedded VectorSpecimenProfile
- `PUT  /api/v1/admin/vector/sample-types/{id}/profile` — Upsert VectorSpecimenProfile

### Seed Import
- `POST /api/v1/admin/vector/seed/reload` — Reload bundled seed data (idempotent)

---

## 7. UI Design

### 7.1 Entry Point
**Admin → Vector Surveillance → Reference Data**

Single page with three Carbon `Tabs`:
1. **Species** (default)
2. **Trap Types**
3. **Vector Sample Types**

Breadcrumb: `Admin / Vector Surveillance / Reference Data`

### 7.2 Species Tab

**Layout:** `DataTable` with `TableToolbar` (search + organism group filter + "Add Species" button + "Reload Seed Data" overflow menu).

**Columns:**
- Genus + species (italicized per taxonomic convention)
- Common Name
- Organism Group (Carbon `Tag` — green=mosquito, blue=tick, purple=rodent, warm-gray=other-arthropod, gray=other-animal)
- Pathogens (up to 3 `Tag` chips + "+N more")
- Status (`Tag` green=Active, gray=Inactive)
- Actions (Edit / Deactivate)

**Row expansion (inline edit):** Two columns —
- Left: genus (`ComboBox` typeahead), species (`TextInput`), subspecies (`TextInput`), common name (`TextInput`), organism group (`Select`), default test panel (`ComboBox`)
- Right: `Accordion` for "Advanced" — pathogens (`MultiSelect`), lifecycle stages (`MultiSelect` filtered by organism group), active toggle (`Toggle`)

**Primary actions at bottom of expansion:** Save / Cancel (Carbon `Button`).

### 7.3 Trap Types Tab

**Layout:** `DataTable` + `TableToolbar` (search + organism group filter + method filter + "Add Trap Type").

**Columns:**
- Code (monospace)
- Display Name
- Target Organism Group (`Tag`)
- Collection Method (`Tag` kind=teal)
- Status (`Tag`)
- Actions

**Row expansion:** code, display name, target organism group (`Select`), collection method (`Select`), description (`TextArea`), active toggle.

### 7.4 Vector Sample Types Tab

**Layout:** `DataTable` — read-mostly. Shows all SampleTypes where `sampleDomain = VECTOR`.

**Columns:**
- Sample Type Name (existing SampleType.name)
- Allowed Organism Groups (Tag chips)
- Pooling Strategy (`Tag` — e.g., purple=POOL_FIXED, blue=INDIVIDUAL)
- Default Pool Size
- Preservation Method
- Actions (Edit Profile)

**Row expansion:** VectorSpecimenProfile editor — pooling strategy (`RadioButtonGroup`), default pool size (`NumberInput`, shown only when strategy=POOL_FIXED), expected lifecycle stages (`MultiSelect`), allowed organism groups (`MultiSelect`), preservation method (`TextInput` or `ComboBox` with common options).

**Note:** Creating a new vector Sample Type happens in the existing Sample Type admin page (S-04 extension). This tab is for editing the VectorSpecimenProfile of existing vector-domain Sample Types.

### 7.5 Delete Confirmation Modal (destructive only)

Single `Modal` shared across all tabs — shown only on "Delete / Deactivate" action. Body: warns that the item will be soft-deleted (active=FALSE) and cannot be linked to new collection lots, but existing references are preserved. Primary action: `kind="danger"` Confirm.

### 7.6 Reload Seed Data Modal (bulk action)

Shown from overflow menu on Species and Trap Types tabs. Explains: "This will insert any missing records from the bundled seed dataset. Existing records matching by (genus, species, subspecies) for Species or by (code) for Trap Types will not be modified." Shows import summary after completion (inline `InlineNotification`).

---

## 8. Business Rules

**BR-V01-001:** A species record's uniqueness is determined by the tuple `(genus, species, subspecies)`, case-insensitive. Subspecies NULL and empty string are treated as equivalent for uniqueness.

**BR-V01-002:** When a species is soft-deleted, existing CollectionLot references remain intact; only new specimen records are blocked from linking to it.

**BR-V01-003:** Default test panel on a species is a *suggestion* — it pre-populates the panel selection at order entry but does not enforce.

**BR-V01-004:** Lifecycle stage enum MUST be validated against organism group:
- MOSQUITO: EGG / LARVA / PUPA / ADULT
- TICK: LARVA / NYMPH / ADULT / ENGORGED_ADULT
- RODENT: ADULT (only)
- OTHER: ADULT (only, unless extended later)

**BR-V01-005:** Trap type's target organism group constrains which Sample Types can be associated at collection time (V-02 will enforce; V-01 defines the constraint).

**BR-V01-006:** A Sample Type's `sampleDomain` cannot be changed to VECTOR unless a VectorSpecimenProfile is created in the same transaction.

**BR-V01-007:** A Sample Type's `sampleDomain` cannot be changed FROM VECTOR if any active CollectionLot references it; user must first archive or delete those lots.

**BR-V01-008:** Pooling strategy POOL_FIXED requires `default_pool_size` between 1 and 100; POOL_VARIABLE allows pool size to be specified per lot; INDIVIDUAL forces pool_size = NULL (is_pool = FALSE).

**BR-V01-009:** Seed reload is idempotent. If a seed record's unique key already exists, the existing record is left unchanged — seed reload NEVER overwrites user edits.

**BR-V01-010:** Soft-delete of a trap type does not cascade. Existing CollectionLot.trap_type_id references remain valid; the trap type simply doesn't appear in new lot creation dropdowns.

---

## 9. Localization

| Key | English Default |
|---|---|
| `heading.vectorRef.title` | Vector Surveillance Reference Data |
| `heading.vectorRef.subtitle` | Manage species, trap types, and vector sample type profiles |
| `nav.vectorRef.breadcrumb` | Vector Surveillance |
| `tab.vectorRef.species` | Species |
| `tab.vectorRef.trapTypes` | Trap Types |
| `tab.vectorRef.sampleTypes` | Vector Sample Types |
| `label.vectorSpecies.genus` | Genus |
| `label.vectorSpecies.species` | Species |
| `label.vectorSpecies.subspecies` | Subspecies |
| `label.vectorSpecies.commonName` | Common Name |
| `label.vectorSpecies.organismGroup` | Organism Group |
| `label.vectorSpecies.pathogens` | Associated Pathogens |
| `label.vectorSpecies.lifecycleStages` | Lifecycle Stages |
| `label.vectorSpecies.defaultTestPanel` | Default Test Panel |
| `label.vectorSpecies.active` | Active |
| `label.vectorSpecies.advanced` | Advanced |
| `label.vectorSpecies.status.active` | Active |
| `label.vectorSpecies.status.inactive` | Inactive |
| `label.vectorSpecies.organismGroup.mosquito` | Mosquito |
| `label.vectorSpecies.organismGroup.tick` | Tick |
| `label.vectorSpecies.organismGroup.rodent` | Rodent |
| `label.vectorSpecies.organismGroup.otherArthropod` | Other Arthropod |
| `label.vectorSpecies.organismGroup.otherAnimal` | Other Animal |
| `label.trapType.code` | Code |
| `label.trapType.displayName` | Display Name |
| `label.trapType.targetOrganism` | Target Organism |
| `label.trapType.collectionMethod` | Collection Method |
| `label.trapType.description` | Description |
| `label.trapType.method.light` | Light |
| `label.trapType.method.bait` | Bait |
| `label.trapType.method.gravid` | Gravid |
| `label.trapType.method.adultResting` | Adult Resting |
| `label.trapType.method.larval` | Larval |
| `label.trapType.method.drag` | Drag |
| `label.trapType.method.snap` | Snap |
| `label.trapType.method.live` | Live Capture |
| `label.trapType.method.oviposition` | Oviposition |
| `label.trapType.method.other` | Other |
| `label.vectorSampleType.name` | Sample Type |
| `label.vectorSampleType.poolingStrategy` | Pooling Strategy |
| `label.vectorSampleType.defaultPoolSize` | Default Pool Size |
| `label.vectorSampleType.preservationMethod` | Preservation Method |
| `label.vectorSampleType.expectedStages` | Expected Lifecycle Stages |
| `label.vectorSampleType.allowedGroups` | Allowed Organism Groups |
| `label.vectorSampleType.strategy.individual` | Individual |
| `label.vectorSampleType.strategy.poolFixed` | Pool — Fixed Size |
| `label.vectorSampleType.strategy.poolVariable` | Pool — Variable Size |
| `button.vectorRef.addSpecies` | Add Species |
| `button.vectorRef.addTrapType` | Add Trap Type |
| `button.vectorRef.save` | Save |
| `button.vectorRef.cancel` | Cancel |
| `button.vectorRef.deactivate` | Deactivate |
| `button.vectorRef.reloadSeed` | Reload Seed Data |
| `placeholder.vectorRef.search` | Search… |
| `placeholder.vectorRef.filterOrganismGroup` | Filter by organism group |
| `placeholder.vectorRef.filterMethod` | Filter by collection method |
| `message.vectorRef.seedReloadComplete` | Seed reload complete: {created} created, {skipped} skipped. |
| `message.vectorRef.deactivateConfirm` | This record will be deactivated. Existing references will be preserved, but it cannot be used in new collection lots. Continue? |
| `error.vectorSpecies.genusRequired` | Genus is required. |
| `error.vectorSpecies.speciesRequired` | Species is required. |
| `error.vectorSpecies.duplicate` | A species with this genus + species + subspecies already exists. |
| `error.trapType.codeRequired` | Trap type code is required. |
| `error.trapType.codeDuplicate` | This trap type code is already in use. |
| `error.vectorSampleType.poolSizeRequired` | Default pool size is required when strategy is Pool — Fixed Size. |
| `error.vectorSampleType.allowedGroupsRequired` | At least one allowed organism group must be selected. |

---

## 10. Validation Rules

- Genus and species MUST match regex `^[A-Z][a-z]+$` (first char capital, rest lowercase) to enforce taxonomic convention. System-enforced on save with inline error (`TextInput invalid` + `invalidText`).
- Trap type code MUST match regex `^[A-Z0-9_]{2,30}$` (uppercase alphanumeric + underscore). Unique constraint enforced with 400 error + user-friendly inline message.
- Pool size (when required) MUST be integer between 1 and 100.
- Pathogen codes MUST come from a controlled vocabulary (seed list includes ~30 common arbovirus/protozoan codes; admins may add new ones).
- All text fields HTML-escaped before display to prevent XSS.

---

## 11. Security & Permissions

| Operation | Required Permission | UI Enforcement | API Enforcement |
|---|---|---|---|
| View Species tab | `vector.species.view` | Tab hidden | 403 |
| Add/Edit Species | `vector.species.edit` | Add button + row actions hidden | 403 |
| View Trap Types tab | `vector.trapType.view` | Tab hidden | 403 |
| Add/Edit Trap Types | `vector.trapType.edit` | Add button + row actions hidden | 403 |
| View Vector Sample Types tab | `vector.sampleType.view` | Tab hidden | 403 |
| Edit Vector Sample Type Profile | `vector.sampleType.edit` | Row expansion Save disabled | 403 |
| Reload Seed Data | Either `.edit` permission | Overflow menu item hidden | 403 |

All write operations logged to audit trail with: userId, timestamp, action (CREATE/UPDATE/SOFT_DELETE), entityType, entityId, before/after JSON snapshot.

---

## 12. Acceptance Criteria

**AC-V01-001:** As a Vector Program Coordinator with `vector.species.edit`, I can navigate to Admin → Vector Surveillance → Reference Data, see the Species tab active, and view the seeded species catalog with organism group tags.

**AC-V01-002:** I can click "Add Species", enter Genus="Aedes", Species="albopictus", Common Name="Asian Tiger Mosquito", Organism Group=Mosquito, associate pathogens Dengue/Chikungunya/Zika, and save. The row appears in the table immediately.

**AC-V01-003:** I can click "Edit" on an existing species row, the row expands inline (no modal), I modify the common name, and Save. The change persists after a page refresh.

**AC-V01-004:** Attempting to create a duplicate species (same genus + species + subspecies) produces an inline error message on the species field.

**AC-V01-005:** I can switch to the Trap Types tab, see the seeded trap registry, filter by Target Organism = Mosquito, and see only mosquito traps listed.

**AC-V01-006:** I can switch to the Vector Sample Types tab, expand a vector-domain Sample Type row, see the VectorSpecimenProfile editor with pooling strategy radio group, and save changes to the default pool size.

**AC-V01-007:** Changing Pooling Strategy to "Pool — Fixed Size" reveals a NumberInput for default pool size (progressive disclosure). Submitting without a value shows an inline validation error.

**AC-V01-008:** As a Lab Technician with only `vector.species.view` and `vector.trapType.view`, I can view the Species and Trap Types tabs but the Add button is hidden and row Edit actions are disabled. The Vector Sample Types tab is not visible.

**AC-V01-009:** Clicking "Reload Seed Data" on Species tab shows a confirmation, then an InlineNotification reporting counts (created, skipped). Existing user-edited records are not overwritten.

**AC-V01-010:** All visible strings on the page render from i18n keys — switching locale to Indonesian shows Indonesian translations throughout.

**AC-V01-011:** Soft-deleting a species marks it inactive; it no longer appears in the default filter view (Active=TRUE) but is shown when the Active filter is set to "All".

**AC-V01-012:** The API rejects unauthorized edit requests with HTTP 403 even if the UI is bypassed.

---

## 13. Seed Data

### Vector Species Seed (~40 records, organism_group / genus / species / common_name / pathogens)

**Mosquitoes (18):**
- MOSQUITO / Aedes / aegypti / Yellow Fever Mosquito / DENV, CHIKV, ZIKV, YFV
- MOSQUITO / Aedes / albopictus / Asian Tiger Mosquito / DENV, CHIKV, ZIKV
- MOSQUITO / Anopheles / sundaicus / — / PLASMODIUM_FALCIPARUM, PLASMODIUM_VIVAX
- MOSQUITO / Anopheles / gambiae / African Malaria Mosquito / PLASMODIUM_FALCIPARUM
- MOSQUITO / Anopheles / stephensi / — / PLASMODIUM_FALCIPARUM, PLASMODIUM_VIVAX
- MOSQUITO / Anopheles / funestus / — / PLASMODIUM_FALCIPARUM
- MOSQUITO / Anopheles / dirus / — / PLASMODIUM_FALCIPARUM
- MOSQUITO / Anopheles / balabacensis / — / PLASMODIUM_KNOWLESI
- MOSQUITO / Anopheles / maculatus / — / PLASMODIUM_FALCIPARUM
- MOSQUITO / Culex / quinquefasciatus / Southern House Mosquito / WNV, WEE, SLEV
- MOSQUITO / Culex / pipiens / Common House Mosquito / WNV
- MOSQUITO / Culex / tritaeniorhynchus / — / JEV
- MOSQUITO / Culex / tarsalis / — / WNV, WEE
- MOSQUITO / Mansonia / uniformis / — / BRUGIA_MALAYI
- MOSQUITO / Armigeres / subalbatus / — / —
- MOSQUITO / Psorophora / ferox / — / —
- MOSQUITO / Ochlerotatus / triseriatus / Eastern Treehole Mosquito / LACV
- MOSQUITO / Haemagogus / janthinomys / — / YFV

**Ticks (10):**
- TICK / Ixodes / scapularis / Blacklegged Tick / BORRELIA_BURGDORFERI, ANAPLASMA_PHAGOCYTOPHILUM, BABESIA_MICROTI
- TICK / Ixodes / pacificus / Western Blacklegged Tick / BORRELIA_BURGDORFERI
- TICK / Ixodes / ricinus / Castor Bean Tick / BORRELIA_BURGDORFERI, TBEV
- TICK / Amblyomma / americanum / Lone Star Tick / EHRLICHIA_CHAFFEENSIS, HEARTLAND
- TICK / Dermacentor / variabilis / American Dog Tick / RICKETTSIA_RICKETTSII
- TICK / Dermacentor / andersoni / Rocky Mountain Wood Tick / RICKETTSIA_RICKETTSII, CTFV
- TICK / Rhipicephalus / sanguineus / Brown Dog Tick / RICKETTSIA_RICKETTSII
- TICK / Haemaphysalis / longicornis / Asian Longhorned Tick / SFTSV
- TICK / Hyalomma / marginatum / — / CCHFV
- TICK / Ornithodoros / moubata / — / BORRELIA_DUTTONII

**Rodents (7):**
- RODENT / Rattus / rattus / Black Rat / LEPTOSPIRA, YERSINIA_PESTIS
- RODENT / Rattus / norvegicus / Brown Rat / LEPTOSPIRA, YERSINIA_PESTIS, HANTAVIRUS
- RODENT / Mus / musculus / House Mouse / LCMV
- RODENT / Peromyscus / maniculatus / Deer Mouse / SIN_NOMBRE_HANTA
- RODENT / Bandicota / indica / Greater Bandicoot Rat / LEPTOSPIRA
- RODENT / Apodemus / agrarius / Striped Field Mouse / HANTAAN
- RODENT / Sigmodon / hispidus / Hispid Cotton Rat / HANTAVIRUS

**Other (5):**
- OTHER_ARTHROPOD / Phlebotomus / papatasi / Sand Fly / LEISHMANIA_MAJOR
- OTHER_ARTHROPOD / Lutzomyia / longipalpis / Sand Fly / LEISHMANIA_INFANTUM
- OTHER_ARTHROPOD / Glossina / morsitans / Tsetse Fly / TRYPANOSOMA_BRUCEI
- OTHER_ARTHROPOD / Triatoma / infestans / Kissing Bug / TRYPANOSOMA_CRUZI
- OTHER_ARTHROPOD / Simulium / damnosum / Black Fly / ONCHOCERCA_VOLVULUS

### Trap Type Seed (~15 records)

| Code | Display Name | Target | Method |
|---|---|---|---|
| CDC_LT | CDC Light Trap | MOSQUITO | LIGHT |
| BG_SENT | BG-Sentinel Trap | MOSQUITO | ADULT_RESTING |
| BG_PRO | BG-Pro Trap | MOSQUITO | ADULT_RESTING |
| OVITRAP | Ovitrap | MOSQUITO | OVIPOSITION |
| GRAVID | Gravid Trap | MOSQUITO | GRAVID |
| HLC | Human Landing Catch | MOSQUITO | BAIT |
| PSC | Pyrethrum Spray Collection | MOSQUITO | ADULT_RESTING |
| LARVAL_DIP | Larval Dipping | MOSQUITO | LARVAL |
| TICK_DRAG | Tick Drag | TICK | DRAG |
| TICK_FLAG | Tick Flag | TICK | DRAG |
| CO2_TRAP | CO2-Baited Tick Trap | TICK | BAIT |
| SHERMAN | Sherman Live Trap | RODENT | LIVE |
| TOMAHAWK | Tomahawk Live Trap | RODENT | LIVE |
| SNAP | Snap Trap | RODENT | SNAP |
| PITFALL | Pitfall Trap | OTHER_ARTHROPOD | LIVE |

---

**End of FRS v1.0**
