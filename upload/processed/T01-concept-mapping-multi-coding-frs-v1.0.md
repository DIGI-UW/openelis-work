# Concept Mapping & Multi-Coding
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-21
**Status:** Draft for Review
**Jira:** OGC-[TBD] (terminology work stream; likely under a new "Terminology" epic parallel to OGC-527 Vector and OGC-354 Sample Collection)
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Test Management Redesign (OGC-173, existing Terminology tab), Catalog & Terminology Subscriptions (v1.1 addendum to OGC-447), Compliance Standards Administration (S-01 v1.1 addendum), Vector Specimen Types & Taxonomy (V-01 v1.4 addendum), Sample Type Management (OGC-296 / S-04), FHIR Outbound Integration.

### Change Log

- **v1.0 (2026-04-21):** Initial draft — polymorphic `ConceptMapping` table enabling any supported entity (Test, SampleType, VectorSpecies, VectorGroup, ComplianceThreshold) to carry multiple codings across multiple code systems; extends the existing Terminology tab in the Test Management redesign to become the concrete multi-coding admin surface; defines FHIR CodeableConcept emission with primary-first ordering; integrates with the Catalog & Terminology Subscription mechanism (v1.1 addendum) as the concept-delivery pipeline.
- **v1.0.1 (2026-04-21):** Removed the admin-facing "Outbound FHIR Preview" tile from the Terminology tab (FR-T01-021 region #2, FR-T01-026, related i18n keys, acceptance criterion, and FHIR-preview API endpoint). FHIR outbound emission behavior (FR-T01-050 through FR-T01-054) is unchanged. Terminology tab shell harmonized with the canonical Test Editor shell pattern from `test-catalog-mockup-v2.1.jsx`.

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Stories
4. User Roles & Permissions
5. Functional Requirements
6. Data Model
7. API Endpoints
8. UI Design
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria

---

## 1. Executive Summary

T-01 introduces a single polymorphic `ConceptMapping` table that lets any supported OpenELIS entity (Test, SampleType, VectorSpecies, VectorGroup, ComplianceThreshold) carry multiple codings across multiple code systems simultaneously. This replaces the "single LOINC code column" model with a `CodeableConcept`-shaped structure identical to how FHIR natively represents coded data: one primary coding (the canonical one for internal use), plus any number of secondary codings (used for interop, aggregation, and traceability).

The existing **Terminology tab** in the Test Management redesign — already reserved in the Test Editor sidebar but currently stubbed — is the concrete admin surface for multi-coding on tests. This spec specifies its full contents and defines a reusable `<MultiCodingPanel>` React component that is also embedded inside Sample Type admin, Vector Species admin, Vector Group admin, and the Compliance Threshold row editor in S-01.

Concepts delivered by the Catalog & Terminology Subscription mechanism (v1.1 addendum) populate a local `Concept` cache; `ConceptMapping` rows reference that cache. The FHIR outbound integration emits all codings for an entity in a single `CodeableConcept`, primary first, without collapsing or re-resolving — this is the architectural move that makes LOINC-primary + multi-system interop possible without abandoning the existing Test Catalog model.

---

## 2. Problem Statement

**Current state:** OpenELIS stores a single external code per entity. `Test.loincCode` is a string column. `SampleType` has a WHONET mapping column. `VectorSpecies.genus/species` are free text. Nowhere does the data model allow two or more standardized codings to coexist on one entity.

**Impact:**
- FHIR outbound messages emit a single `Coding` in each `CodeableConcept`, stripping downstream consumers of the ability to resolve concepts through their preferred code system.
- Environmental and vector testing domains that LOINC does not cover (vector species → NCBI Taxonomy; regulatory parameters → Baku Mutu / WHO / EPA value sets; environmental habitats → ENVO) have no structural place to live.
- One Health aggregation and national public health reporting (DHIS2, VectorBase, WHO GMP) cannot map OpenELIS data back to their native namespaces without external crosswalk tables maintained elsewhere.
- When a curated value set is delivered via Catalog Subscription (v1.1), there is no local model for storing its concepts or attaching them to local entities.

**Proposed solution:** A single polymorphic `ConceptMapping` table links any supported entity to any number of `(codeSystem, code, display)` tuples, with one per-entity row flagged `isPrimary = true` by convention. A local `Concept` cache table stores the concept definitions themselves (delivered via subscription, seed file, or manual entry). The existing Terminology tab in the Test Editor is built out with a multi-coding DataTable and inline add/edit. The same `<MultiCodingPanel>` component is embedded into the four other affected admin surfaces. FHIR outbound integration reads all mappings for an entity and emits them as parallel `Coding` entries in the outgoing `CodeableConcept`.

---

## 3. User Stories

- **As a Test Catalog administrator**, I want to attach multiple standardized codes to a test (LOINC as primary; SNOMED CT for specimen context; local regulatory parameter codes from Baku Mutu) so that outgoing FHIR messages carry complete CodeableConcepts and downstream systems can resolve the concept in their preferred namespace.
- **As a Vector Program Coordinator**, I want to map each vector species to its NCBI Taxonomy ID (and optionally VectorBase and GBIF identifiers) so that entomological data from OpenELIS can roll up into VectorBase and international vector surveillance databases.
- **As a Compliance Administrator**, I want each regulatory parameter threshold to trace back to a concept in an upstream value set (a Baku Mutu PP22/2021 ValueSet delivered via OCL) so that the provenance of every compliance rule is visible and updatable.
- **As a Terminology Administrator**, I want to see which codes on an entity came from a subscription versus manual entry, and to edit or retire them consistently across all affected entities without touching each one individually.
- **As a FHIR Integration Engineer**, I want OpenELIS's outbound `CodeableConcept` elements to contain all codings defined for the underlying entity, with the primary coding emitted first, so that external consumers can choose their preferred namespace without a separate crosswalk step.

---

## 4. User Roles & Permissions

| Role | View Concept Cache | Manage Concept Cache | View Mappings | Manage Mappings | Notes |
|---|---|---|---|---|---|
| Lab Technician | No | No | No | No | No terminology access; mappings are invisible in analyst-facing screens |
| Test Catalog Administrator | View | No | View | View + Modify (Test only) | Standard Test Editor access; multi-coding on Test entities |
| Vector Program Coordinator | View | No | View | View + Modify (VectorSpecies, VectorGroup) | Multi-coding on vector entities |
| Compliance Administrator | View | No | View | View + Modify (ComplianceThreshold, SampleType domain) | Multi-coding on regulatory entities |
| Terminology Administrator | Full | Full | Full | Full | New specialized role for OCL / seed / subscription governance |
| System Administrator | Full | Full | Full | Full | Platform superuser |

**Required permission keys:**

- `terminology.concept.view` — View the local Concept cache (code + display + system + source)
- `terminology.concept.manage` — Create, edit, retire manual concepts (not sourced from subscription)
- `terminology.mapping.view` — View the multi-coding panel on any entity
- `terminology.mapping.modify` — Add, edit, remove coding mappings on an entity (also requires the entity's own modify permission — e.g., `test.modify` for a Test's mappings)

**Two-key enforcement:** Editing the coding mappings on a Test requires BOTH `terminology.mapping.modify` AND `test.modify`. This mirrors the S-01 model where `compliance.threshold.modify` gates threshold edits per-test. It prevents a terminology-only admin from indirectly editing clinical test definitions, and prevents a test-only admin from drifting terminology without oversight.

---

## 5. Functional Requirements

### 5.1 Polymorphic ConceptMapping Table

**FR-T01-001:** The system SHALL introduce a single `ConceptMapping` table that links any supported entity to any number of local `Concept` rows. The table is polymorphic — it references the target entity by `(entityType, entityId)` rather than a typed FK.

**FR-T01-002:** The v1.0 supported `entityType` values SHALL be:

| entityType | Target Entity | Mapped To |
|---|---|---|
| `TEST` | Test Catalog entry | One or more codings (e.g., LOINC primary, SNOMED secondary) |
| `SAMPLE_TYPE` | SampleType | Specimen codings (e.g., SNOMED specimen hierarchy, ENVO environmental material) |
| `VECTOR_SPECIES` | VectorSpecies | Taxonomic codings (NCBI Taxonomy, VectorBase, GBIF) |
| `VECTOR_GROUP` | VectorGroup | Ontology codings (SNOMED CT family, NCBI family) |
| `COMPLIANCE_THRESHOLD` | ComplianceThreshold | Regulatory parameter concept codings (upstream value set codes) |

**FR-T01-003:** The `entityType` enum SHALL be extensible in future minor revisions without schema migration. Adding a new entityType (e.g., `ANALYZER`, `ORGANISM`, `PATHOGEN`) requires only an enum addition and a UI surface that embeds `<MultiCodingPanel>`.

**FR-T01-004:** Each `ConceptMapping` row SHALL carry one coding: a reference to a local `Concept` plus an `isPrimary` flag. An entity may have at most one `isPrimary = true` row per entityType; any number of `isPrimary = false` rows is permitted.

**FR-T01-005:** The `isPrimary` flag SHALL be mutually exclusive within the set of mappings for a single entity. Setting a mapping to primary SHALL automatically demote any existing primary for that entity within the same transaction.

**FR-T01-006:** Deleting an entity SHALL cascade-delete all `ConceptMapping` rows referencing it. Deleting a `Concept` SHALL be blocked while any `ConceptMapping` row references it; the admin must first retire the concept (soft-delete via `Concept.isActive = false`), which preserves mappings but hides the concept from new-coding pickers.

### 5.2 Local Concept Cache

**FR-T01-010:** The system SHALL maintain a local `Concept` table as a cache of code system entries, populated by one of three sources: catalog subscription (via v1.1 addendum), seed-file load (via v1.1 addendum), or manual administrator entry.

**FR-T01-011:** Each `Concept` row SHALL carry: `id`, `systemUri` (the CodeSystem canonical URL, e.g., `http://loinc.org`), `code`, `display`, `definition` (optional), `isActive`, `source` (SUBSCRIPTION / SEED_FILE / MANUAL), `sourceSubscriptionId` (nullable), `version` (the upstream version the row was last synced to), `lastSyncedAt`.

**FR-T01-012:** `Concept` rows are uniquely identified by `(systemUri, code, version)`. Two versions of the same code may coexist during a transition window (e.g., a code display changed in the latest LOINC release) — `ConceptMapping` rows reference a specific `Concept.id`, not a `(system, code)` pair, so a concept version bump does not silently change mapped entities.

**FR-T01-013:** When a subscription applies a Changed concept (per catalog-subscription FR-A3-008), the system SHALL update the local `Concept.display` and `definition` in place on the matching `(systemUri, code)` row. `ConceptMapping` rows are not touched — they continue to reference the same `Concept.id`, and the new display propagates automatically through joins.

**FR-T01-014:** A manually-entered concept (`source = MANUAL`) MAY later be linked to a subscription by the administrator (via a "Link to Subscription" action). When linked, the concept's `source` transitions to `SUBSCRIPTION`, `sourceSubscriptionId` is set, and the concept participates in future pending-update flows for that subscription.

### 5.3 Terminology Tab — Test Editor Extension

**FR-T01-020:** The existing Terminology tab in the Test Management redesign Test Editor sidebar SHALL be built out with the contents defined in this section. The tab's placement, label, and permission gate (`terminology.mapping.view`) are inherited from the existing redesign; T-01 does not alter the tab's navigation.

**FR-T01-021:** The Terminology tab contents SHALL consist of a single primary region: the reusable `<MultiCodingPanel>` component configured with `entityType = "TEST"` and the current Test's ID. The panel renders a Carbon `DataTable` of `ConceptMapping` rows with inline add/edit. The tab SHALL be hosted inside the canonical Test Editor shell (header with back button, title, Cancel/Save actions; vertical tab sidebar grouped as Configuration / Organization / Resources / Automation / Compliance; content area `maxWidth 64rem` with `1.5rem` padding) — identical in structure to every other Test Editor tab. No inline FHIR-preview tile is rendered in the admin UI; the outbound FHIR shape is defined in §5.6 and remains observable via the entity's outbound FHIR resource rather than a dedicated preview.

**FR-T01-022:** The Multi-Coding Panel DataTable SHALL display columns: Code, Display, Code System (Tag), Primary (Tag + toggle), Source (Tag), Actions. Rows SHALL be sortable by any column and filterable by code system via a toolbar ComboBox.

**FR-T01-023:** A new mapping SHALL be added via inline row expansion at the top of the DataTable, NOT a modal. The add form SHALL contain:
- **Code System** (ComboBox with type-ahead against the local `Concept.systemUri` values plus a "Browse subscribed value sets…" link that opens the value-set drill-down drawer — FR-T01-040)
- **Concept** (ComboBox with type-ahead against the `Concept` cache, scoped to the selected code system; displays `code — display`)
- **Primary** (Checkbox; if checked, the existing primary mapping for this entity is demoted upon save)
- **Notes** (optional TextArea)

**FR-T01-024:** Editing an existing mapping SHALL use inline row expansion. Fields match the add form. The Primary toggle column in the DataTable SHALL also permit one-click primary reassignment without opening the edit form.

**FR-T01-025:** Removing a mapping SHALL use a destructive confirmation `Modal`. The modal copy SHALL warn if the mapping is currently `isPrimary = true` and no other mappings exist on the entity: "Removing the only coding on this entity will leave it uncoded in FHIR outbound messages. Continue?"

### 5.4 Shared `<MultiCodingPanel>` Component

**FR-T01-030:** The system SHALL provide a reusable React component `<MultiCodingPanel entityType entityId editable primaryRequired />` that implements the DataTable + inline add/edit pattern described in §5.3. The component SHALL be usable in the following admin surfaces:

- **Test Editor → Terminology tab** (TEST)
- **Sample Type Editor → new "Codings" section inside the Basic Info tab** (SAMPLE_TYPE) — added via S-04 addendum, not this spec
- **Vector Species Editor → inline row expansion "Codings" accordion** (VECTOR_SPECIES) — added via V-01 v1.4 addendum
- **Vector Group Editor → inline row expansion "Codings" accordion** (VECTOR_GROUP) — added via V-01 v1.4 addendum
- **Compliance Threshold Editor → "Concept" accordion inside the threshold inline-expansion row** (COMPLIANCE_THRESHOLD) — added via S-01 v1.1 addendum

**FR-T01-031:** The component SHALL accept a `primaryRequired` prop. When `true` (default for TEST and SAMPLE_TYPE), the entity MUST have at least one primary mapping; attempting to save the entity with zero mappings SHALL produce a validation error. When `false` (default for VECTOR_SPECIES, VECTOR_GROUP, COMPLIANCE_THRESHOLD), a zero-mapping state is acceptable and the FHIR outbound omits the `coding` array in favor of `text`-only emission.

**FR-T01-032:** The component SHALL accept an `editable` prop. When `false`, the DataTable is read-only (no inline add/edit, no row actions), suitable for analyst-facing views. The Terminology tab passes `editable = true` iff the user holds `terminology.mapping.modify` AND the entity's own modify permission.

**FR-T01-033:** The component SHALL emit a `onChange` callback with the full current mapping list whenever a row is added, edited, removed, or re-primaried. This allows the embedding admin surface to mark the parent form as dirty, trigger validation, or refresh any surrounding state.

### 5.5 Value Set Browse Drawer

**FR-T01-040:** The Multi-Coding Panel SHALL provide a "Browse subscribed value sets…" link that opens a full-width Carbon drawer listing all locally cached `ValueSet` entries delivered via catalog subscription or seed file.

**FR-T01-041:** The drawer SHALL display a DataTable of value sets with columns: Name, Code System, Source (subscription name or "Seed file"), Version, Concept Count, Last Synced. Row selection SHALL expand a nested DataTable of the value set's member concepts, each with a "Use this code" button that prepopulates the Multi-Coding Panel's add form with the selected concept.

**FR-T01-042:** The drawer SHALL support filtering value sets by Code System (ComboBox), Source (Select), and free-text search on Name.

**FR-T01-043:** When the current entity already has a mapping referencing a given value-set concept, the "Use this code" button SHALL display as disabled with the tooltip "Already mapped — edit via the Terminology tab."

### 5.6 FHIR Outbound Integration

**FR-T01-050:** The FHIR outbound integration layer SHALL read all `ConceptMapping` rows for an entity when serializing that entity to FHIR, and emit them as parallel `Coding` entries within the appropriate `CodeableConcept` element.

**FR-T01-051:** The primary mapping (`isPrimary = true`) SHALL appear first in the `coding` array AND carry `userSelected = true`. All other mappings SHALL appear in order of `createdAt` ascending, with `userSelected` unset or `false`.

**FR-T01-052:** The `text` element of the `CodeableConcept` SHALL carry the entity's own display (e.g., `Test.name`, `SampleType.description`). This is independent of any coding and SHALL always be emitted.

**FR-T01-053:** If an entity has zero `ConceptMapping` rows, the `coding` array SHALL be omitted from the outbound FHIR and only `text` is emitted. This preserves the round-trip semantic of an uncoded-but-displayed concept per FHIR R4.

**FR-T01-054:** FHIR outbound SHALL NOT emit mappings whose referenced `Concept.isActive = false` (retired concepts). This applies even if the mapping itself remains in the table — the retired concept is effectively invisible in outbound emission. Retired concepts are retained for historical traceability only.

### 5.7 Bulk Operations & Import

**FR-T01-060:** The system SHALL support a Bulk Mapping import via CSV, accessible from a Terminology Administration admin page (`Admin → Terminology → Bulk Mappings`) gated by `terminology.mapping.modify`.

**FR-T01-061:** The CSV format SHALL include columns: `entity_type`, `entity_identifier` (match key), `system_uri`, `code`, `is_primary`. The entity_identifier match strategy SHALL follow the catalog-subscription identity strategy — canonical URL first, then entity-type-specific business key (e.g., Test.loincCode or Test.name for `entity_type = TEST`).

**FR-T01-062:** The bulk import SHALL display a preview table with Match Status per row (Matched / Not Found / Ambiguous) before commit. Rows with errors SHALL be highlighted and excluded unless the admin checks "Skip error rows."

**FR-T01-063:** The bulk import SHALL write an audit log entry including: filename, row count, mappings created, mappings updated, errors skipped, and the user who ran the import.

---

## 6. Data Model

### New Entities

**Concept**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| systemUri | String (1024) | Yes | CodeSystem canonical URL (e.g., `http://loinc.org`) |
| code | String (255) | Yes | Code value within the system |
| display | String (1024) | Yes | Human-readable display |
| definition | String (4096) | No | Upstream definition text |
| isActive | Boolean | Yes | Default true; false = retired (not shown in new-coding pickers) |
| source | Enum | Yes | SUBSCRIPTION, SEED_FILE, MANUAL |
| sourceSubscriptionId | Long | No | FK to CatalogSubscription when source = SUBSCRIPTION |
| version | String (100) | No | Upstream version at last sync (from CodeSystem.version or ValueSet.version) |
| lastSyncedAt | Timestamp | No | Null for MANUAL source |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**Uniqueness constraint:** `(systemUri, code, version)` must be unique. Null version is treated as a distinct version for uniqueness purposes.

**ConceptMapping**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| entityType | Enum | Yes | TEST, SAMPLE_TYPE, VECTOR_SPECIES, VECTOR_GROUP, COMPLIANCE_THRESHOLD |
| entityId | Long | Yes | The target entity's own primary key |
| conceptId | Long | Yes | FK to Concept |
| isPrimary | Boolean | Yes | Default false; at most one per (entityType, entityId) |
| notes | String (1024) | No | Optional administrator notes |
| createdBy | String | Yes | Username |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**Uniqueness constraint:** `(entityType, entityId, conceptId)` must be unique — the same concept cannot be mapped twice to the same entity.

**Partial uniqueness constraint:** At most one row where `(entityType, entityId)` matches AND `isPrimary = true`. Enforced at the DB level via a partial unique index.

**ValueSet** (local cache for FR-T01-040 drawer; populated by catalog subscription v1.1 ValueSet handling)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| canonicalUrl | String (1024) | Yes | ValueSet canonical URL (e.g., `https://api.openconceptlab.org/orgs/openelis-global/collections/BakuMutuWaterParameters/`) |
| name | String (255) | Yes | Display name |
| version | String (100) | No | Version at last sync |
| sourceSubscriptionId | Long | No | FK to CatalogSubscription |
| lastSyncedAt | Timestamp | No | — |

**ValueSetMember** (join table between ValueSet and Concept)

| Field | Type | Required | Notes |
|---|---|---|---|
| valueSetId | Long | Yes | FK to ValueSet — part of composite PK |
| conceptId | Long | Yes | FK to Concept — part of composite PK |
| sortOrder | Integer | No | Member order within the value set |

### Modified Entities

**Test** — no structural changes. `Test.loincCode` remains as a denormalized convenience column populated from the primary ConceptMapping when systemUri = `http://loinc.org`. A DB trigger or service-layer hook keeps the two in sync.

**SampleType, VectorSpecies, VectorGroup, ComplianceThreshold** — no structural changes. All multi-coding state lives in `ConceptMapping`.

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/terminology/concepts` | Search concepts (paginated; filters: system, query, source) | `terminology.concept.view` |
| POST | `/api/v1/terminology/concepts` | Create a manual concept | `terminology.concept.manage` |
| PUT | `/api/v1/terminology/concepts/{id}` | Edit a manual concept | `terminology.concept.manage` |
| PUT | `/api/v1/terminology/concepts/{id}/retire` | Retire a concept (set isActive = false) | `terminology.concept.manage` |
| GET | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings` | List all mappings for an entity | `terminology.mapping.view` |
| POST | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings` | Add a mapping | `terminology.mapping.modify` + entity modify permission |
| PUT | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings/{id}` | Edit a mapping (change primary flag, notes) | `terminology.mapping.modify` + entity modify |
| DELETE | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings/{id}` | Remove a mapping | `terminology.mapping.modify` + entity modify |
| GET | `/api/v1/terminology/value-sets` | List cached ValueSets (filterable) | `terminology.concept.view` |
| GET | `/api/v1/terminology/value-sets/{id}/members` | List ValueSet member concepts | `terminology.concept.view` |
| POST | `/api/v1/terminology/bulk-mappings/preview` | Preview CSV bulk import | `terminology.mapping.modify` |
| POST | `/api/v1/terminology/bulk-mappings/apply` | Apply CSV bulk import | `terminology.mapping.modify` |
| GET | `/api/v1/terminology/bulk-mappings/template` | Download CSV template | `terminology.mapping.view` |

---

## 8. UI Design

See companion React mockup: `T01-concept-mapping-multi-coding-mockup.jsx`

### Navigation Path

- **Multi-coding on a Test** — Admin → Test Management → Test Catalog → [Test Editor] → Terminology tab
- **Multi-coding on a Sample Type** — Admin → Sample Type Management → [Sample Type Editor] → Basic Info → Codings section
- **Multi-coding on a Vector Species** — Admin → Vector Surveillance → Species → [inline row expansion] → Codings accordion
- **Multi-coding on a Vector Group** — Admin → Vector Surveillance → Groups → [inline row expansion] → Codings accordion
- **Multi-coding on a Compliance Threshold** — Admin → Test Management → Test Catalog → [Test Editor] → Compliance tab → [threshold inline row expansion] → Concept accordion
- **Concept cache + bulk import** — Admin → Terminology (new top-level admin submenu) → Concepts / Value Sets / Bulk Mappings

### Key Screens

1. **Terminology Tab** (Test Editor sidebar, under the Resources tab group) — the headline surface. Hosted inside the canonical Test Editor shell (header + vertical tab sidebar + content area) that matches every other Test Editor tab. The tab body renders the `<MultiCodingPanel>`: a DataTable of ConceptMapping rows with inline add/edit, primary toggle column, and source tag. No FHIR preview tile is rendered inline.
2. **Browse Value Sets Drawer** — full-width side drawer opened from the Multi-Coding Panel toolbar. Two-level DataTable (value sets → members).
3. **Terminology Admin Page** — list/search the local Concept cache; three tabs (Concepts / Value Sets / Bulk Mappings).
4. **Bulk Mappings Import Modal** — FileUploader + template download + preview table with row-level match status.
5. **Embedded Multi-Coding Panel** — same component rendered inside the Sample Type editor, Vector Species editor, Vector Group editor, and Compliance Threshold editor. Visual style is identical to the Terminology tab; wrapping container is adapted per embedding surface.

### Test Editor Shell Harmonization

The Terminology tab is one of 14 tabs in the canonical Test Editor shell defined by `test-catalog-mockup-v2.1.jsx`. The tab groups and active-state styling MUST match that reference exactly:

| Group | Tabs |
|---|---|
| Configuration | Basic Info, Sample & Results, Ranges, Sample Storage |
| Organization | Display Order, Panels, Labels |
| Resources | **Terminology**, Reagents |
| Automation | Analyzers, Methods, Alerts, Reflex & Calc |
| Compliance | Compliance |

Active tab styling: `#defbe6` background, `#0e6027` text and 3px left border. Sidebar width: `14rem`. Content area: `flex: 1`, `padding: 1.5rem`, `maxWidth: 64rem`. Header: back button + "Edit Test: [Name]" title + subtitle with Test ID / LOINC / Sample Type / Result Type + Cancel/Save actions pinned right.

### Interaction Patterns

- Inline row expansion for add/edit (no modals)
- Modal only for destructive remove confirmation and Bulk Mappings CSV import
- Carbon `Tag` for source (SUBSCRIPTION → blue, SEED_FILE → teal, MANUAL → warm-gray) and for code system (LOINC → green, SNOMED → purple, NCBI Taxonomy → cyan, ENVO → teal, OpenELIS local → gray)
- Typeahead ComboBox for concept search, scoped to the selected code system
- One-click primary reassignment via a single-click toggle in the Primary column

---

## 9. Business Rules

**BR-T01-01:** An entity may have zero or many mappings. At most one mapping per entity is `isPrimary = true`. If a second mapping is saved with `isPrimary = true`, the existing primary is demoted to `isPrimary = false` in the same transaction.

**BR-T01-02:** `Test.loincCode` (the pre-existing column) is kept in sync with the Test's primary ConceptMapping when that mapping's `systemUri = http://loinc.org`. If the primary mapping is not LOINC, `Test.loincCode` is set to null. This preserves backward compatibility for legacy code that reads `Test.loincCode` directly while the new multi-coding model is rolled out. The denormalization is maintained by a service-layer hook on ConceptMapping save/delete.

**BR-T01-03:** A Concept cannot be hard-deleted while any ConceptMapping references it. Administrators retire (soft-delete) via `isActive = false`, which preserves historical mappings for audit but hides the concept from new-coding pickers.

**BR-T01-04:** Adding a mapping to an entity is permitted only when the user holds BOTH `terminology.mapping.modify` AND the entity's existing modify permission (e.g., `test.modify` for Test entities). Both API and UI enforce this.

**BR-T01-05:** An entity with `primaryRequired = true` in the UI (Test, SampleType) SHALL NOT save with zero mappings. The save button is disabled until at least one mapping exists AND one is flagged primary.

**BR-T01-06:** Removing a primary mapping when other mappings exist SHALL automatically promote the next-created mapping (by `createdAt` ascending) to primary. The admin receives an `InlineNotification` (kind="info") informing them of the automatic promotion.

**BR-T01-07:** Removing the last mapping on an entity with `primaryRequired = true` is blocked by the business rule; the admin must first add a replacement mapping.

**BR-T01-08:** FHIR outbound emission uses the primary-first ordering described in FR-T01-051. Consumers MUST NOT rely on array index for identity; they should match on `system + code`.

**BR-T01-09:** A subscribed Concept whose upstream `isActive` becomes false (retired in upstream) SHALL be proposed for retirement through the v1.1 Members-Diff review workflow. Accepting the retirement sets local `Concept.isActive = false`. ConceptMappings referencing the retired concept remain in place but the mapping no longer contributes to FHIR outbound emission (FR-T01-054).

**BR-T01-10:** Bulk import is idempotent: a row with the same `(entityType, entityId, systemUri, code)` as an existing mapping is treated as an update (e.g., flipping `isPrimary`), not an insert. Primary reassignments follow BR-T01-01.

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added:

| i18n Key | Default English Text |
|---|---|
| `nav.terminology` | Terminology |
| `heading.terminology.concepts` | Concepts |
| `heading.terminology.valueSets` | Value Sets |
| `heading.terminology.bulkMappings` | Bulk Mappings |
| `heading.multiCoding.panelTitle` | Codings |
| `heading.multiCoding.addNew` | Add Coding |
| `heading.multiCoding.edit` | Edit Coding |
| `heading.multiCoding.browseValueSets` | Browse Value Sets |
| `label.multiCoding.code` | Code |
| `label.multiCoding.display` | Display |
| `label.multiCoding.codeSystem` | Code System |
| `label.multiCoding.primary` | Primary |
| `label.multiCoding.source` | Source |
| `label.multiCoding.source.subscription` | From subscription |
| `label.multiCoding.source.seedFile` | From seed file |
| `label.multiCoding.source.manual` | Manual |
| `label.multiCoding.notes` | Notes |
| `label.multiCoding.noMappings` | No codings defined |
| `label.multiCoding.searchConcept` | Search for a concept... |
| `label.concept.isActive` | Active |
| `label.concept.isRetired` | Retired |
| `label.concept.version` | Version |
| `label.concept.lastSynced` | Last Synced |
| `label.valueSet.canonicalUrl` | Canonical URL |
| `label.valueSet.memberCount` | Members |
| `label.valueSet.useThisCode` | Use this code |
| `label.valueSet.alreadyMapped` | Already mapped |
| `label.bulkMappings.entityType` | Entity Type |
| `label.bulkMappings.entityIdentifier` | Entity Identifier |
| `label.bulkMappings.matchStatus` | Match Status |
| `label.bulkMappings.matchStatus.matched` | Matched |
| `label.bulkMappings.matchStatus.notFound` | Not Found |
| `label.bulkMappings.matchStatus.ambiguous` | Ambiguous |
| `button.multiCoding.add` | Add Coding |
| `button.multiCoding.edit` | Edit |
| `button.multiCoding.remove` | Remove |
| `button.multiCoding.makePrimary` | Make Primary |
| `button.multiCoding.browseValueSets` | Browse subscribed value sets... |
| `button.bulkMappings.downloadTemplate` | Download Template |
| `button.bulkMappings.uploadPreview` | Upload & Preview |
| `button.bulkMappings.applyImport` | Apply Import |
| `message.multiCoding.primaryDemoted` | Previous primary coding was demoted. |
| `message.multiCoding.primaryAutoPromoted` | The next coding was automatically promoted to primary. |
| `message.multiCoding.removeLastWarning` | Removing the only coding will leave this entity uncoded in FHIR outbound messages. Continue? |
| `message.multiCoding.saveSuccess` | Coding saved. |
| `message.multiCoding.removeSuccess` | Coding removed. |
| `message.concept.retireConfirm` | Retire this concept? It will be hidden from new-coding pickers but existing mappings will be preserved. |
| `message.concept.retireSuccess` | Concept retired. |
| `message.bulkMappings.importSuccess` | Bulk import complete: {0} mappings created, {1} updated, {2} errors skipped. |
| `error.multiCoding.primaryRequired` | At least one coding must be marked primary before saving. |
| `error.multiCoding.duplicateMapping` | This concept is already mapped to this entity. |
| `error.concept.cannotDeleteInUse` | This concept is used by {0} mappings and cannot be deleted. Retire it instead. |
| `error.bulkMappings.entityNotFound` | Entity not found: {0} |
| `error.bulkMappings.conceptNotFound` | Concept not found in local cache: {0}|{1} |
| `placeholder.multiCoding.searchConcept` | Type to search concepts in {0}... |
| `placeholder.concept.search` | Search concepts by code or display... |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| ConceptMapping.conceptId | FK to existing Concept | `error.multiCoding.conceptNotFound` |
| ConceptMapping (entityType, entityId, conceptId) | Unique | `error.multiCoding.duplicateMapping` |
| ConceptMapping.isPrimary (partial unique) | At most one primary per (entityType, entityId) | Enforced at DB + service layer |
| Entity save (primaryRequired = true) | At least one mapping with isPrimary = true | `error.multiCoding.primaryRequired` |
| Concept.systemUri | Valid URI | `error.concept.invalidUri` |
| Concept (systemUri, code, version) | Unique | `error.concept.duplicate` |
| Concept delete | Blocked if referenced by any ConceptMapping | `error.concept.cannotDeleteInUse` |
| Bulk import CSV row | entityType in enum | `error.bulkMappings.invalidEntityType` |
| Bulk import CSV row | entityIdentifier resolves unambiguously | `error.bulkMappings.entityNotFound` / `error.bulkMappings.ambiguous` |

---

## 12. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Terminology tab or Multi-Coding Panel | `terminology.mapping.view` | Tab/panel not rendered |
| View Concept cache admin page | `terminology.concept.view` | Menu item hidden |
| Add/edit/remove mapping on a Test | `terminology.mapping.modify` AND `test.modify` | Inline add/edit disabled; API returns 403 |
| Add/edit/remove mapping on a SampleType | `terminology.mapping.modify` AND `sampleType.modify` | Same pattern |
| Add/edit/remove mapping on a VectorSpecies | `terminology.mapping.modify` AND `vector.species.edit` | Same pattern |
| Add/edit/remove mapping on a VectorGroup | `terminology.mapping.modify` AND `vector.group.edit` | Same pattern |
| Add/edit/remove mapping on a ComplianceThreshold | `terminology.mapping.modify` AND `compliance.threshold.modify` | Same pattern |
| Create/edit/retire manual Concept | `terminology.concept.manage` | Buttons hidden; API 403 |
| Bulk import CSV | `terminology.mapping.modify` | Page hidden; API 403 |

---

## 13. Acceptance Criteria

### Functional

- [ ] A Test can have multiple ConceptMappings, one marked primary; the primary mapping appears first in the FHIR CodeableConcept
- [ ] Marking a second mapping as primary automatically demotes the previous primary within a single transaction
- [ ] `Test.loincCode` stays in sync with the primary ConceptMapping when that mapping's system is `http://loinc.org`
- [ ] The Terminology tab renders a DataTable of mappings with inline add/edit; no modals used for edit
- [ ] The Terminology tab is hosted inside the canonical Test Editor shell (header, vertical tab sidebar grouped Configuration / Organization / Resources / Automation / Compliance, content area with `maxWidth 64rem`) matching `test-catalog-mockup-v2.1.jsx`
- [ ] A SampleType, VectorSpecies, VectorGroup, and ComplianceThreshold can each carry multi-codings via the shared component
- [ ] Saving a Test or SampleType with zero mappings is blocked with the `primaryRequired` validation error
- [ ] Removing a primary mapping when other mappings exist auto-promotes the next-created mapping to primary and shows an info notification
- [ ] Removing the last mapping on a `primaryRequired` entity is blocked — the admin must add a replacement first
- [ ] The Browse Value Sets drawer lists cached ValueSets and lets the admin pick a concept to prepopulate the add form
- [ ] "Use this code" is disabled for concepts already mapped to the current entity

### Source Tracking

- [ ] Concepts delivered by a catalog subscription carry `source = SUBSCRIPTION` and `sourceSubscriptionId`
- [ ] Concepts loaded from seed files carry `source = SEED_FILE`
- [ ] Manually-entered concepts carry `source = MANUAL`
- [ ] Source tags are rendered in the DataTable with correct Carbon Tag kinds (blue/teal/warm-gray)
- [ ] A concept retired via subscription Members-Diff accept is hidden from new-coding pickers but existing mappings remain visible
- [ ] Retired concepts are excluded from FHIR outbound emission (FR-T01-054)

### Permissions

- [ ] User with only `terminology.mapping.view` cannot add, edit, or remove mappings
- [ ] User with `terminology.mapping.modify` but not `test.modify` cannot edit Test mappings (two-key enforcement)
- [ ] User without `terminology.concept.manage` cannot create, edit, or retire manual concepts
- [ ] Direct API calls return HTTP 403 when either required permission is missing

### FHIR Integration

- [ ] Outbound FHIR `CodeableConcept` elements carry all mappings in parallel `Coding` entries
- [ ] The primary coding carries `userSelected = true` and appears first
- [ ] Entities with zero mappings emit `text` only; no `coding` array
- [ ] Retired concepts do not appear in outbound `coding` arrays even if their mapping still exists

### Bulk Import

- [ ] CSV template can be downloaded and matches the column spec in FR-T01-061
- [ ] Preview shows per-row match status and validation errors
- [ ] Apply is blocked when any errors exist, unless "Skip error rows" is checked
- [ ] Successful import writes an audit log entry with filename, counts, and user

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English
- [ ] Terminology tab loads within 2 seconds for Tests with up to 20 mappings
- [ ] Browse Value Sets drawer loads within 3 seconds for cached value sets containing up to 2,000 concepts
- [ ] Feature tested with Indonesian (`id`) and French (`fr`) language files
- [ ] All Carbon Tags use semantic `kind` values; no hardcoded colors

### Integration

- [ ] Catalog subscription v1.1 Members-Diff accepts populate the Concept cache correctly
- [ ] Seed-file load on startup populates Concept and ValueSet tables without duplication on restart
- [ ] S-01 ComplianceThreshold "Concept" accordion renders via the shared `<MultiCodingPanel>`
- [ ] V-01 VectorSpecies "Codings" accordion renders via the shared `<MultiCodingPanel>`
- [ ] V-01 VectorGroup "Codings" accordion renders via the shared `<MultiCodingPanel>`
- [ ] Audit trail records all mapping add/edit/remove, primary reassignments, bulk imports, and concept retirements
