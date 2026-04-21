# Jira Story: Concept Mapping & Multi-Coding (T-01)

## Metadata

| Field | Value |
|---|---|
| **Summary** | Concept Mapping & Multi-Coding: polymorphic ConceptMapping table + shared `<MultiCodingPanel>` + FHIR primary-first emission |
| **Issue Type** | Story |
| **Project** | OGC (OpenELIS Global Community) |
| **Epic Link** | OGC-527 (Vector Program) |
| **Labels** | `vector`, `Indonesia` |
| **Assignee** | Reagan |
| **Reporter** | caseyi@uw.edu |
| **Priority** | High |
| **Components** | Test Management · Terminology · FHIR Integration |
| **Fix Version** | TBD |
| **Related** | OGC-173 (Test Management redesign) · OGC-447 (Catalog & Terminology Subscriptions v1.1) · OGC-296 / S-04 (Sample Types) · S-01 (Compliance Standards) · V-01 (Vector Taxonomy v1.4) |

---

## Summary

Introduce a single polymorphic `ConceptMapping` table that lets any supported OpenELIS entity (Test, SampleType, VectorSpecies, VectorGroup, ComplianceThreshold) carry multiple standardized codings simultaneously — structured identically to FHIR's native `CodeableConcept`. This replaces the "single LOINC column" model across the system and enables primary-first multi-code FHIR emission without abandoning existing Test Catalog semantics.

The existing Terminology tab in the Test Editor (reserved but stubbed in OGC-173) is built out with the concrete multi-coding admin surface. A reusable `<MultiCodingPanel>` React component is the single implementation, embedded into all five affected admin surfaces (Test, Sample Type, Vector Species, Vector Group, Compliance Threshold).

## Problem

OpenELIS today stores a single external code per entity (`Test.loincCode`, `SampleType` WHONET column, free-text `VectorSpecies.genus/species`). There is no structural place for a second coding, which blocks:

- FHIR outbound messages emitting complete `CodeableConcept` elements — downstream consumers get a single `Coding` and must resolve every concept in our chosen namespace rather than their preferred one.
- Domains that LOINC does not cover: vector species (NCBI Taxonomy, VectorBase, GBIF), regulatory parameters (Baku Mutu PP22/2021, WHO GMP, EPA value sets), environmental habitats (ENVO).
- National public-health reporting pipelines (DHIS2, VectorBase, WHO GMP) that need the data back in their own namespaces without an external crosswalk table.
- Any local model for storing concepts delivered by the Catalog Subscription mechanism (OGC-447 v1.1 addendum).

In the Indonesia deployment specifically, vector surveillance and environmental compliance data both need to participate in international aggregation — neither can today.

## Proposed Solution

1. **Single polymorphic `ConceptMapping` table** — links any supported entity (via `entityType` + `entityId`) to any number of `(codeSystem, code, display)` tuples, with one per-entity row flagged `isPrimary = true`.
2. **Local `Concept` cache table** — stores the concept definitions themselves (delivered via OGC-447 subscription, seed file, or manual admin entry).
3. **Build out the Terminology tab** in the Test Editor with a `<MultiCodingPanel>` — Carbon `DataTable` of mappings, inline add/edit, primary toggle column, source tag (SUBSCRIPTION / SEED_FILE / MANUAL). Hosted in the canonical Test Editor shell (back button, vertical tab sidebar grouped Configuration / Organization / Resources / Automation / Compliance, content area `maxWidth 64rem`) identical to every other Test Editor tab.
4. **Embed the same `<MultiCodingPanel>`** into Sample Type admin, Vector Species admin, Vector Group admin, and the S-01 Compliance Threshold row editor.
5. **Value Set Browse drawer** — pick concepts from cached OCL ValueSets (delivered via OGC-447) with a "Use this code" button that prepopulates the add form.
6. **FHIR outbound integration** — read all mappings for an entity and emit them as parallel `Coding` entries in `CodeableConcept`, primary first with `userSelected = true`. Zero mappings → emit `text` only. Retired concepts → excluded from emission.
7. **Bulk CSV import** for mappings at `Admin → Terminology → Bulk Mappings`.

## User Stories

- As a **Test Catalog administrator**, I want to attach multiple standardized codes to a test (LOINC primary; SNOMED for specimen context; local Baku Mutu regulatory parameter codes) so that outgoing FHIR messages carry complete CodeableConcepts and downstream systems can resolve the concept in their preferred namespace.
- As a **Vector Program Coordinator**, I want to map each vector species to its NCBI Taxonomy ID (and optionally VectorBase and GBIF identifiers) so that entomological data from OpenELIS rolls up into VectorBase and international vector surveillance databases.
- As a **Compliance Administrator**, I want each regulatory parameter threshold to trace back to a concept in an upstream value set (Baku Mutu PP22/2021 via OCL) so that the provenance of every compliance rule is visible and updatable.
- As a **Terminology Administrator**, I want to see which codes on an entity came from a subscription versus manual entry, and to edit or retire them consistently across all affected entities without touching each one individually.
- As a **FHIR Integration Engineer**, I want OpenELIS's outbound `CodeableConcept` elements to contain all codings defined for the underlying entity, with the primary coding emitted first, so that external consumers can choose their preferred namespace without a separate crosswalk step.

## Functional Scope (traced to FRS v1.0.1)

### Polymorphic ConceptMapping (§5.1)
- FR-T01-001 — single polymorphic `ConceptMapping` table keyed by `(entityType, entityId)`
- FR-T01-002 — entityType enum: TEST, SAMPLE_TYPE, VECTOR_SPECIES, VECTOR_GROUP, COMPLIANCE_THRESHOLD
- FR-T01-003 — enum extensible without schema migration
- FR-T01-004 / 005 — one primary per entity; setting primary demotes existing primary in same txn
- FR-T01-006 — cascade behavior on entity delete; soft-delete concepts via `isActive = false`

### Local Concept cache (§5.2)
- FR-T01-010 / 011 — `Concept` table with `systemUri`, `code`, `display`, `source`, `sourceSubscriptionId`, `version`, `lastSyncedAt`
- FR-T01-012 — uniqueness on `(systemUri, code, version)`
- FR-T01-013 — subscription Changed diffs update `Concept.display` in place; mappings unchanged
- FR-T01-014 — manual concept can be linked to subscription post-hoc

### Terminology tab — Test Editor (§5.3)
- FR-T01-020 — build out existing Terminology tab; inherit placement, label, and `terminology.mapping.view` permission gate from OGC-173
- FR-T01-021 — tab contains the `<MultiCodingPanel>`; hosted in canonical Test Editor shell
- FR-T01-022 — DataTable columns: Code, Display, Code System (Tag), Primary (Tag + toggle), Source (Tag), Actions
- FR-T01-023 — inline row expansion for Add (no modal); ComboBox for Code System + Concept, Checkbox for Primary, optional Notes
- FR-T01-024 — inline row expansion for Edit; one-click primary reassignment via column toggle
- FR-T01-025 — remove uses destructive confirmation Modal with warning copy for last-mapping case

### Shared `<MultiCodingPanel>` (§5.4)
- FR-T01-030 — reusable component signature `<MultiCodingPanel entityType entityId editable primaryRequired />`
- FR-T01-031 — `primaryRequired` prop; Test/SampleType default true; Vector/Compliance default false
- FR-T01-032 — `editable` prop; enforces two-key permission (`terminology.mapping.modify` AND entity modify permission)
- FR-T01-033 — `onChange` callback with full mapping list

### Value Set Browse drawer (§5.5)
- FR-T01-040 — drawer lists cached ValueSets with two-level DataTable (value sets → members)
- FR-T01-041 — "Use this code" button prepopulates the add form
- FR-T01-042 — filter by Code System, Source, free-text Name
- FR-T01-043 — disable "Use this code" for already-mapped concepts

### FHIR Outbound (§5.6)
- FR-T01-050 — emit all `ConceptMapping` rows as parallel `Coding` entries in `CodeableConcept`
- FR-T01-051 — primary first; `userSelected = true` on primary; secondaries in `createdAt` ascending
- FR-T01-052 — always emit `text` element from entity's own display field
- FR-T01-053 — zero mappings → omit `coding` array; `text` only
- FR-T01-054 — retired concepts (isActive = false) excluded from outbound emission

### Bulk Operations (§5.7)
- FR-T01-060 — Bulk Mapping CSV import at `Admin → Terminology → Bulk Mappings`
- FR-T01-061 — CSV columns: entity_type, entity_identifier, system_uri, code, is_primary; identity strategy per OGC-447
- FR-T01-062 — preview table with Matched / Not Found / Ambiguous status; "Skip error rows" option
- FR-T01-063 — audit log entry per import (filename, counts, errors, user)

## Data Model

### New entities

**`Concept`** — cache of code system entries

| Field | Type | Notes |
|---|---|---|
| id | Long | PK |
| systemUri | String(1024) | CodeSystem canonical URL |
| code | String(255) | Code value |
| display | String(1024) | Display text |
| definition | String(4096) | Optional |
| isActive | Boolean | Soft-delete via false |
| source | Enum | SUBSCRIPTION / SEED_FILE / MANUAL |
| sourceSubscriptionId | Long | FK when source = SUBSCRIPTION |
| version | String(100) | Upstream version at last sync |
| lastSyncedAt | Timestamp | Null for MANUAL |

*Unique constraint:* `(systemUri, code, version)`.

**`ConceptMapping`** — polymorphic join

| Field | Type | Notes |
|---|---|---|
| id | Long | PK |
| entityType | Enum | TEST / SAMPLE_TYPE / VECTOR_SPECIES / VECTOR_GROUP / COMPLIANCE_THRESHOLD |
| entityId | Long | Target entity PK |
| conceptId | Long | FK to Concept |
| isPrimary | Boolean | Partial-unique: at most one true per (entityType, entityId) |
| notes | String(1024) | Optional |
| createdBy / createdAt / updatedAt | — | Audit |

*Unique constraint:* `(entityType, entityId, conceptId)`.
*Partial unique index:* one primary per `(entityType, entityId)` where `isPrimary = true`.

**`ValueSet`** + **`ValueSetMember`** — local cache populated by OGC-447 subscription ValueSet handling.

### Modified entities

- `Test.loincCode` kept as denormalized convenience column, auto-synced from primary ConceptMapping when `systemUri = http://loinc.org` (BR-T01-02)
- `SampleType`, `VectorSpecies`, `VectorGroup`, `ComplianceThreshold` — no structural changes

## API Endpoints

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/terminology/concepts` | `terminology.concept.view` |
| POST | `/api/v1/terminology/concepts` | `terminology.concept.manage` |
| PUT | `/api/v1/terminology/concepts/{id}` | `terminology.concept.manage` |
| PUT | `/api/v1/terminology/concepts/{id}/retire` | `terminology.concept.manage` |
| GET | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings` | `terminology.mapping.view` |
| POST | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings` | `terminology.mapping.modify` + entity modify |
| PUT | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings/{id}` | `terminology.mapping.modify` + entity modify |
| DELETE | `/api/v1/terminology/entities/{entityType}/{entityId}/mappings/{id}` | `terminology.mapping.modify` + entity modify |
| GET | `/api/v1/terminology/value-sets` | `terminology.concept.view` |
| GET | `/api/v1/terminology/value-sets/{id}/members` | `terminology.concept.view` |
| POST | `/api/v1/terminology/bulk-mappings/preview` | `terminology.mapping.modify` |
| POST | `/api/v1/terminology/bulk-mappings/apply` | `terminology.mapping.modify` |
| GET | `/api/v1/terminology/bulk-mappings/template` | `terminology.mapping.view` |

## Permissions

Four new permission keys:

- `terminology.concept.view` — view local Concept cache
- `terminology.concept.manage` — create / edit / retire manual concepts
- `terminology.mapping.view` — view Multi-Coding Panel on any entity
- `terminology.mapping.modify` — add / edit / remove mappings (requires entity's own modify permission as second key)

**Two-key enforcement** (BR-T01-04): editing mappings on a Test requires BOTH `terminology.mapping.modify` AND `test.modify`. Mirrors the S-01 pattern for threshold edits. Prevents terminology-only admins from drifting clinical test definitions and test-only admins from drifting terminology.

## UI Design

See companion mockup: `T01-concept-mapping-multi-coding-mockup.jsx`
Visual preview: `T01-concept-mapping-multi-coding-preview.html`

### Test Editor shell harmonization

The Terminology tab is one of 14 tabs in the canonical Test Editor shell defined by `test-catalog-mockup-v2.1.jsx`. This story MUST match that reference exactly:

| Group | Tabs |
|---|---|
| Configuration | Basic Info, Sample & Results, Ranges, Sample Storage |
| Organization | Display Order, Panels, Labels |
| Resources | **Terminology** (this story), Reagents |
| Automation | Analyzers, Methods, Alerts, Reflex & Calc |
| Compliance | Compliance |

- Active tab: `#defbe6` background, `#0e6027` text + 3px left border
- Sidebar width: `14rem`
- Content area: `flex: 1`, `padding: 1.5rem`, `maxWidth: 64rem`
- Header: back button + "Edit Test: [Name]" title + subtitle (Test ID / LOINC / Sample Type / Result Type) + Cancel/Save actions pinned right

### Interaction patterns

- Inline row expansion for add/edit (no modal)
- Modal only for destructive remove confirmation and Bulk Mappings CSV import
- Carbon `Tag` for source (SUBSCRIPTION → blue, SEED_FILE → teal, MANUAL → warm-gray) and code system (LOINC → green, SNOMED → purple, NCBI Taxonomy → cyan, ENVO → teal, OpenELIS local → gray)
- Typeahead ComboBox for concept search scoped to selected code system
- One-click primary reassignment via column toggle

## Localization

All UI text externalized. New i18n keys listed in FRS §10 (44 keys across headings, labels, buttons, messages, errors, placeholders). Testing required with Indonesian (`id`) and French (`fr`).

## Acceptance Criteria

### Functional
- [ ] **AC-F-01** — A Test can have multiple ConceptMappings, one marked primary; primary appears first in FHIR CodeableConcept (FR-T01-050, 051)
- [ ] **AC-F-02** — Marking a second mapping as primary automatically demotes the previous primary in a single transaction (FR-T01-005)
- [ ] **AC-F-03** — `Test.loincCode` stays in sync with the primary ConceptMapping when `systemUri = http://loinc.org`; null otherwise (BR-T01-02)
- [ ] **AC-F-04** — Terminology tab renders DataTable with inline add/edit; no modals used for edit (FR-T01-022, 023, 024)
- [ ] **AC-F-05** — Terminology tab is hosted inside the canonical Test Editor shell (header + vertical tab sidebar with 5 groups + content area `maxWidth 64rem`) matching `test-catalog-mockup-v2.1.jsx` (FR-T01-021)
- [ ] **AC-F-06** — SampleType, VectorSpecies, VectorGroup, and ComplianceThreshold each carry multi-codings via the shared `<MultiCodingPanel>` (FR-T01-030)
- [ ] **AC-F-07** — Saving a Test or SampleType with zero mappings is blocked with `primaryRequired` validation error (FR-T01-031, BR-T01-05)
- [ ] **AC-F-08** — Removing the primary mapping when other mappings exist auto-promotes the next-created mapping to primary and surfaces an info `InlineNotification` (BR-T01-06)
- [ ] **AC-F-09** — Removing the last mapping on a `primaryRequired` entity is blocked (BR-T01-07)
- [ ] **AC-F-10** — Browse Value Sets drawer lists cached ValueSets and lets the admin pick a concept to prepopulate the add form (FR-T01-040, 041)
- [ ] **AC-F-11** — "Use this code" disabled for concepts already mapped to the current entity (FR-T01-043)

### Source tracking
- [ ] **AC-S-01** — Subscribed concepts carry `source = SUBSCRIPTION` and `sourceSubscriptionId`
- [ ] **AC-S-02** — Seed-file concepts carry `source = SEED_FILE`
- [ ] **AC-S-03** — Manual concepts carry `source = MANUAL`
- [ ] **AC-S-04** — Source tags rendered with correct Carbon Tag kinds (blue / teal / warm-gray)
- [ ] **AC-S-05** — A concept retired via subscription Members-Diff accept is hidden from new-coding pickers but existing mappings remain visible
- [ ] **AC-S-06** — Retired concepts excluded from FHIR outbound emission (FR-T01-054)

### Permissions
- [ ] **AC-P-01** — User with only `terminology.mapping.view` cannot add, edit, or remove mappings
- [ ] **AC-P-02** — User with `terminology.mapping.modify` but not `test.modify` cannot edit Test mappings (two-key enforcement, BR-T01-04)
- [ ] **AC-P-03** — User without `terminology.concept.manage` cannot create, edit, or retire manual concepts
- [ ] **AC-P-04** — Direct API calls return HTTP 403 when either required permission is missing

### FHIR Integration
- [ ] **AC-H-01** — Outbound FHIR `CodeableConcept` elements carry all mappings as parallel `Coding` entries (FR-T01-050)
- [ ] **AC-H-02** — Primary coding carries `userSelected = true` and appears first (FR-T01-051)
- [ ] **AC-H-03** — Entities with zero mappings emit `text` only; no `coding` array (FR-T01-053)
- [ ] **AC-H-04** — Retired concepts do not appear in outbound `coding` arrays even if their mapping still exists (FR-T01-054)

### Bulk Import
- [ ] **AC-B-01** — CSV template can be downloaded and matches the column spec in FR-T01-061
- [ ] **AC-B-02** — Preview shows per-row match status and validation errors (FR-T01-062)
- [ ] **AC-B-03** — Apply is blocked when any errors exist, unless "Skip error rows" is checked
- [ ] **AC-B-04** — Successful import writes an audit log entry with filename, counts, and user (FR-T01-063)

### Non-Functional
- [ ] **AC-N-01** — All UI strings use i18n keys — zero hardcoded English
- [ ] **AC-N-02** — Terminology tab loads within 2 seconds for Tests with up to 20 mappings
- [ ] **AC-N-03** — Browse Value Sets drawer loads within 3 seconds for cached value sets containing up to 2,000 concepts
- [ ] **AC-N-04** — Feature tested with Indonesian (`id`) and French (`fr`) language files
- [ ] **AC-N-05** — All Carbon Tags use semantic `kind` values; no hardcoded colors

### Integration
- [ ] **AC-I-01** — OGC-447 v1.1 Members-Diff accepts populate the Concept cache correctly
- [ ] **AC-I-02** — Seed-file load on startup populates Concept and ValueSet tables without duplication on restart
- [ ] **AC-I-03** — S-01 ComplianceThreshold "Concept" accordion renders via shared `<MultiCodingPanel>`
- [ ] **AC-I-04** — V-01 VectorSpecies "Codings" accordion renders via shared `<MultiCodingPanel>`
- [ ] **AC-I-05** — V-01 VectorGroup "Codings" accordion renders via shared `<MultiCodingPanel>`
- [ ] **AC-I-06** — Audit trail records all mapping add/edit/remove, primary reassignments, bulk imports, and concept retirements

## Deliverables in this thread

| Artifact | Path |
|---|---|
| FRS v1.0.1 | `T01-concept-mapping-multi-coding-frs-v1.0.md` |
| React/Carbon mockup | `T01-concept-mapping-multi-coding-mockup.jsx` |
| HTML visual preview | `T01-concept-mapping-multi-coding-preview.html` |
| Jira story (this file) | `T01-concept-mapping-multi-coding-jira.md` |

## Dependencies / Ordering

Before this story can reach "Done":

1. **OGC-447 v1.1 Catalog & Terminology Subscriptions** must deliver the Concept cache population path and ValueSet cache tables. T-01 consumes the cache; it does not define the delivery pipeline.
2. **OGC-173 Test Management redesign** must have the Test Editor shell and Terminology tab placeholder merged. T-01 builds out the tab contents; it does not define the shell.
3. **S-01 Compliance Standards v1.1 addendum** and **V-01 Vector Taxonomy v1.4 addendum** reference the shared `<MultiCodingPanel>`. Those addendum stories are siblings — either they integrate the component after T-01 lands, or they land in parallel with T-01 providing the component as a dependency.

## Risks

- **Schema migration order** — the denormalized sync of `Test.loincCode` with the primary ConceptMapping (BR-T01-02) must be implemented atomically with the multi-coding introduction to avoid a window where the legacy column is stale.
- **Permission drift** — two-key enforcement must be unit-tested on every mapping mutation endpoint; if a future endpoint forgets the second key, terminology admins could edit clinical data indirectly.
- **FHIR consumer assumptions** — external consumers reading the primary `Coding` by array index will silently break if we ever change ordering. Spec explicitly requires consumers match on `system + code` (BR-T01-08) — call out in release notes.

## Notes for Reviewer

- The admin-facing "Outbound FHIR Preview" tile was explicitly removed in FRS v1.0.1 per Casey's review. FHIR emission behavior (FR-T01-050 through 054) is unchanged — only the dedicated preview UI tile is gone.
- Shell harmonization is strict: the Terminology tab MUST visually match every other Test Editor tab in OGC-173. Any deviation from `test-catalog-mockup-v2.1.jsx` is a review-blocker.
