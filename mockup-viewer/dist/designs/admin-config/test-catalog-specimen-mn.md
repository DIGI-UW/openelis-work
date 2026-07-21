# FRS — Test↔Sample-Type Many-to-Many, Phase 1 (shared config)

**Feature slug:** `test-catalog-mn-phase1`
**Status:** Draft for review · **Author:** Casey (with design assistant) · **Date:** 2026-07-20
**Supersedes decision:** D-028 (specimen-is-identity) → record **D-035** before build.
**Companion docs:** reassessment brief (`test-catalog-specimen-model-reassessment.md`), crosscheck (`test-catalog-mn-crosscheck.md`).
**Scope note:** Phase 1 delivers *many sample types per test with **shared** configuration* + specimen-aware resolution. Per-specimen **override** (ranges/LOINC differing by specimen) is **Phase 2**; duplicate-collapse **migration** is **Phase 3**. This FRS is version-agnostic where noted; the phase boundary is called out in Out of Scope.

---

## Lab Context

### Current State
OpenELIS treats a "test" as bound to a single specimen (sample type). To offer the same measurement on more than one specimen, a lab today must create a **separate test record per specimen** — "Glucose(Serum)", "Glucose(Plasma)", "Glucose(CSF)" are three unrelated rows. In environmental and vector labs this is acute: a single physical-chemistry measurement like **Color** or **Turbidity** applies to a dozen or more water and environmental sample types (drinking water, surface water, sea water, spa water, waste, soil…). On the live env/vector instance, 155 of 459 catalog tests are already stretched across multiple sample types, and the catalog software has no first-class way to express that — so the same measurement is duplicated or awkwardly linked.

### Pain
A lab manager configuring "Turbidity" for nine water sample types must build and maintain **nine near-identical test records** — nine sets of result components, nine identical scales, nine places to fix a typo. When a value scale changes, eight of the nine silently drift out of sync. Worse, the underlying software assumes exactly one specimen per test: when an electronic order or analyzer result arrives keyed only by a code, the system resolves "which specimen?" by taking an **arbitrary first match**, so a result can attach to the wrong specimen with no warning. The current catalog also *flags* any test that a lab has (reasonably) attached to several specimens as a configuration **error**, telling managers their working setup is broken.

### What Changes
A measurement that runs on many specimens becomes **one test associated with many sample types**. The manager builds Turbidity once, ticks the water sample types it applies to, and it appears — correctly — under each of those specimens at order entry. Machine intake stops guessing: when an order or analyzer message carries a specimen, the system resolves to that specimen deterministically; when it carries none, the order is held for specimen clarification rather than silently mis-assigned. And having a test on several specimens is no longer an error — it's the supported, expected shape. (In this phase the configuration is *shared* across the specimens; letting ranges or codes differ per specimen comes in Phase 2.)

## Overview

A test may be associated with one or more sample types through the existing `SAMPLETYPE_TEST` junction, used as the genuine many-to-many relationship it already is at the schema level. All test configuration (result components, units, ranges, LOINC/terminology, storage) is **shared** across the associated specimens in Phase 1. Every place the application resolves a test↔specimen relationship becomes **specimen-aware** instead of first-match. The catalog list presents a multi-specimen test as a single row listing its specimens, and the catalog-health rule that treated multi-association as an error is inverted.

### Navigation & URL
- **Sample-type association** lives on the test editor's **Basic Info** section: `/MasterListsPage/TestCatalogEditor/<testId>/basic-info` (existing route; D-012 path-segment pattern).
- **List:** `/admin/TestCatalogList` (existing; a multi-specimen test renders as one row with its specimens shown).
- **Breadcrumb:** `Home / Admin / Test Catalog / <Test name>` (existing chain; D-013 "Admin Management" drift preserved).
- **SideNav:** no new slot (existing Test Catalog placement).

## User Stories
1. As a **catalog manager**, I want to associate one test with several sample types so I configure a shared measurement (Turbidity, Color) once instead of cloning it per specimen.
2. As a **catalog manager**, I want the list to show a multi-specimen test as one row with its specimens, so a large env catalog stays readable.
3. As a **lab technologist / orderer**, I want a multi-specimen test to appear under each of its specimens at order entry and resolve to the specimen I chose, so results never attach to the wrong specimen.
4. As an **integration/analyzer**, I want an incoming coded result to resolve to the correct specimen when the message carries one, and to be held for clarification (not guessed) when it doesn't.
5. As a **catalog manager**, I want multi-specimen association to be a supported shape, not flagged as an error.

## Functional Requirements

### Association (editor)
- **FR-1.** The shipped Basic Info already renders a single-value **Sample type** control (`basic-info-edit-sample-type`) alongside Name, Code, Description, Lab Unit, Domain, AMR surveillance, Active, Orderable (verified live, 2026-07-20). Phase 1 **changes that one control from single-select to a typeahead multi-select** (Carbon `FilterableMultiSelect`) over active sample types (D-007), rendering the selected specimens as **removable chips with labels** (never a bare count; addendum). At least one sample type is required to save an orderable/active test. No other Basic Info field changes.
- **FR-2.** Adding a sample type writes a `SAMPLETYPE_TEST` row; removing one deletes that association (no hard delete of the *test*; association rows are join records, safe to remove — D-002 applies to domain records, not join rows). Duplicate associations are prevented in the write path.
- **FR-3 (domain guard, D-030).** The sample-type control only offers, and only accepts, sample types whose domain matches the test's domain; attaching a mismatched domain is refused with an inline message.
- **FR-4 (shared config, Phase 1).** All configuration (result components, units, ranges, LOINC/terminology, storage) applies identically to every associated sample type. The editor shows one configuration; there is no per-specimen divergence in this phase (see Out of Scope → Phase 2).

### Resolution (the backend fix — the heart of Phase 1)
- **FR-5.** Replace every first-match (`.get(0)`) test↔specimen resolution with **specimen-aware** resolution: `getTypeOfSample(test)` and the LOINC routing callers (`getActiveTestsByLoinc` in analyzer auto-create, the three e-order controllers, FHIR `TaskInterpreter`) resolve using the specimen in context. Generalize the existing `LabOrderSearchProvider.getActiveTestByLoincCodeAndSampleType(loinc, sampleTypeId)` disambiguation to all sites.
- **FR-6 (manual order entry).** A test associated with N sample types appears in the order-entry test picker under **each** of those sample types; ordering it under a chosen specimen resolves to that specimen (the orderer already selects the sample type — no ambiguity).
- **FR-7 (machine intake, specimen present).** When an e-order/analyzer/FHIR message carries a specimen coding, resolve deterministically to that specimen.
- **FR-8 (machine intake, no specimen).** When no specimen is carried and the code maps to a multi-specimen test, **do not first-match**: hold the order at the assay level for specimen clarification, resolved at collection/accession (chooser surfaced to the accessioner). Hard-reject only when no valid specimen exists for the context. (Aligns with OGC-1142 "Intake Implications".)

### List & health
- **FR-9.** In the catalog list, a multi-specimen test renders as **one row** whose Sample-type cell lists its specimens (e.g. "Water +8"); the flat per-specimen duplicate rows disappear once associations replace duplicates (duplicates handled in Phase 3 migration; net-new multi-specimen tests show correctly immediately).
- **FR-10 (invert FR-62.c).** Multiple sample-type associations are **no longer an error**. The health finding is re-scoped to flag only genuine problems: **zero** sample-type links (Error), and — reserved for Phase 2 — an incomplete per-specimen override. Pre-existing multi-association tests raise nothing.

### Terminology & LOINC (per-specimen) — handle it right from day one
LOINC is specimen-sensitive *by the standard* (Glucose in Serum/Plasma = 2345-7; in CSF = 2342-4), so terminology overrides are not an afterthought — they are the standard-conformant behavior. Phase 1 is shared, but the store and resolution must be built so per-specimen terminology drops in without migration.

- **FR-11 (store is specimen-keyable now — Phase 1).** The test↔terminology mapping store (the OGC-1142 polymorphic terminology store) MUST key each mapping on **(entity_type, entity_id, sample_type_id)** where `sample_type_id` **null = shared** (applies to all the test's specimens) and a value = **specimen-specific**. Phase 1 writes only shared (null) mappings, but the schema must accept the specimen-scoped form immediately so Phase 2 adds no migration. This extends the *already-delivered* Terminology "Applies to" per-component scoping to sample-type scope.
- **FR-12 (Phase 1 shared LOINC — env-safe).** A Phase 1 test carries one shared LOINC/terminology set across all its specimens — correct for environmental physical-chemistry, where the specimen doesn't change the code. The clinically-divergent case is the Phase 2 override.
- **FR-13 (Phase 2 per-specimen override).** The Terminology section shows shared mappings by default with an **"Override for a specific specimen"** affordance (mirrors the Ranges override): pick a sample type, give it its own LOINC/SNOMED/CIEL/OCL mapping; it applies to that specimen only, others keep the shared set. Retires the FR-53 "LOINC not copied because specimen-specific" workaround — there's nothing to copy.
- **FR-14 (specimen-aware reverse routing — Phase 1).** `getActiveTestsByLoinc` MUST honor specimen scope: a specimen-specific LOINC (CSF 2342-4) resolves directly to (test, CSF); a combined/shared LOINC (2345-7 Ser/Plas) resolves to the test and takes the specimen from context (FR-7/8) — never first-match. This is part of the Phase 1 `.get(0)` fix and makes today's non-conformant "same LOINC on every sibling" situation correct.

## Data Model
Authority: `openelis-design/references/test-catalog-data-model.md`. **No new entity in Phase 1.**
- `SAMPLETYPE_TEST` is used as the true m:n association it already is (schema has no unique pair constraint; the app's `size()==1` write-path assertions are removed).
- Resolution reads become specimen-parameterized; the `.get(0)` sites are the changed surface.
- **Declared dependency (Phase 2, not built here):** per-(test, sample-type) override storage for `result_limits` (specimen scoping) and LOINC/terminology (hosted by the OGC-1142 polymorphic terminology store). Phase 1 is shared-only and needs no override storage.
- Migration of existing duplicate/legacy multi-link data is **Phase 3** (deactivate/merge, never delete — D-002).

## Access
Entirely within the existing **Test Catalog Manager / Admin** capability. A manager who can edit tests can add/remove sample-type associations; viewers see the associations read-only. No new roles.

## Retires / Supersedes (the complexity reduction)
This model **replaces**, not augments, the shipped/spec'd variant subsystem. The many-to-many association + per-specimen override does the same job with one record instead of N linked duplicates, so the following are explicitly retired (coordinate via the crosscheck; migrate existing data in Phase 3):

- **D-033 variant-link grouping** and the grouped list (Completion v2 **FR-46–FR-51**) — a test's specimens are now intrinsic to the one record, not a link across sibling records. The grouped-vs-flat toggle (**FR-50**) goes away (one row already shows all specimens).
- **"Add specimen variant" copy flow** (Completion v2 **FR-52–FR-55**) — replaced by "tick another specimen" (shared) or "override one field for one specimen" (Phase 2). No copy, no sibling record.
- **Copied-ranges review** (**FR-53** draft/review banner) and the **variant-drift** problem + its finding (Silent-Failure #5) — there are no siblings to drift.
- **FR-62.c multi-link error** — inverted (FR-10): multi-association is normal.

What a manager does instead: one test, its specimens on a multi-select, override the exceptions (Phase 2). "Spin off a separate test" survives only for a genuinely different test (different components/purpose) — which is just a new test, with no linking because it isn't a variant.

> **Honest trade:** user-facing and maintenance complexity drop sharply (no duplicate records, no drift, no copy/link/review machinery). In exchange, complexity moves into the data layer (per-specimen override storage in Phase 2 + the specimen-aware resolution refactor here), and there is a one-time transition cost to supersede the already-built variant features and migrate existing grouped/duplicated data (Phase 3).

## Out of Scope
- **Per-specimen override** of ranges/LOINC/units (Phase 2) — Phase 1 config is shared across all associated specimens.
- **Duplicate-collapse migration** of existing per-specimen test rows and the 56 pathology multi-links (Phase 3).
- **AMR/isolate modeling** — a different axis (organism↔antibiotic), tracked separately.
- Bulk association editing across many tests at once.

## Non-Functional Requirements
- **NFR-1.** Specimen-aware resolution adds no perceptible latency at order entry / intake vs. the current first-match.
- **NFR-2.** The sample-type multi-select is keyboard-navigable and screen-reader labelled; selected specimens announced.
- **NFR-3.** New strings localized, `[category].testCatalog.[identifier]`, universal-English fallback.

## Dependencies
- **Upstream (must land within Phase 1):** the specimen-aware resolution refactor of the `.get(0)` sites — this is the core work; the editor UI is thin over it.
- **Downstream (coordinate — see crosscheck):** Sample Type Management v2.1 ("Associated Tests" becomes additive attach), Completion v2 (variant grouping / FR-62.c inversion), Panel Management (resolution consistency), Env/Vector order entry (consumer), Analyzer Types & Mapping (LOINC routing).

## Localization (new keys)
| Key | English |
|---|---|
| `label.testCatalog.basicInfo.sampleTypes` | Sample types |
| `helper.testCatalog.basicInfo.sampleTypesMulti` | Select every specimen this test runs on. Configuration is shared across them. |
| `error.testCatalog.basicInfo.sampleTypeRequired` | Select at least one sample type. |
| `error.testCatalog.basicInfo.sampleTypeDomain` | This sample type's domain doesn't match the test's domain. |
| `label.testCatalog.list.sampleTypesSummary` | {first} +{n} |
| `notice.testCatalog.intake.awaitingSpecimen` | Awaiting specimen — this test runs on several specimens; resolve at collection. |
| `tag.testCatalog.finding.noSampleTypeLink` | No sample-type link |

## Acceptance spot checks
1. On a CLINICAL test, the Sample types control offers only CLINICAL sample types; adding "Serum" and "Plasma" shows two removable chips and persists two `SAMPLETYPE_TEST` rows (read back on a different surface).
2. An env test "Turbidity" associated with Water + Drinking + Surface appears under all three at order entry; ordering under "Surface Water" produces an analysis resolved to Surface Water.
3. A FHIR e-order carrying LOINC + a Specimen coding resolves to that specimen; the same order with **no** specimen coding is held "awaiting specimen", not first-matched.
4. A test with three sample-type associations shows **no** error tag; a test with **zero** links shows the "No sample-type link" error.
5. The catalog list shows the multi-specimen test as one row with "Water +2", not three rows.

## Suggested slicing (PR-sized, D-026 — dev owns final breakdown)
| Slice | Content |
|---|---|
| P1a | Specimen-aware resolution: replace `.get(0)` at the 8 sites; manual order entry under each specimen (FR-5/6/7) |
| P1b | Machine intake no-specimen hold + accession chooser (FR-8) |
| P1c | Editor Sample-types multi-select + domain guard + write path (FR-1/2/3/4) |
| P1d | List one-row rendering + health-finding inversion (FR-9/10) |
