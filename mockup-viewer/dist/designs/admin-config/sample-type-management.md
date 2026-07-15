# Sample Type Management — Approach Update

**Feature slug:** `sample-type-management`
**Target Release:** OpenELIS Global v3.2
**Version:** 2.1 (2026-07-14) — aligned to the verified Test Catalog data model reference and the Test Catalog Manageability decisions (variant model)
**Jira:** OGC-296 (this story) · OGC-538 Domain Classification (Done) · OGC-949 (Test Catalog Management umbrella) · sibling: Panel Management domain upgrade (OGC-224), Lab Units (OGC-189)

> **Why v2.0:** the v1.0 FRS proposed a standalone `/admin/sample-type-management` page with a **5-tab interface** and a **WHONET-only** mapping tab. Verified against source (`typeofsample.TypeOfSample` + the `SAMPLETYPE_TEST` / `SAMPLETYPE_PANEL` junctions), and aligned to the decisions from the Panel Management domain upgrade, this version: (1) moves Sample Types into the **Test Catalog Management shell** as a context, (2) uses **SideNav submenu sections, not tabs**, (3) replaces the WHONET-only mapping with the **full terminology mapper** (parity with tests/panels), and (4) grounds every field in the real model, flagging net-new ones as dependencies.
>
> **Why v2.1:** aligned to the source-verified data model reference (`test-catalog-data-model.md`) and the Test Catalog Manageability FRS decisions: (1) **Associated Tests becomes read-only** — a test's specimen is identity, so "adding a test to a sample type" is *creating a specimen variant*, which lives in the Test Catalog, not here; (2) the **domain column reality is corrected** — `TYPE_OF_SAMPLE.DOMAIN` is a legacy one-character column, not the Clinical/Environmental/Vector enum, so the single-domain model requires a declared migration; (3) `SAMPLETYPE_PANEL` is noted as live in order entry (backend keeps it in sync; not surfaced here).

---

## Lab Context

### Current State
A **sample type** (specimen type) is the kind of material a test runs on — serum, plasma, whole blood, urine, CSF, stool. Each is a small master-list record: a name, a short local abbreviation, an active flag, and — already in the data — a **domain** (Clinical / Environmental / Vector). Sample types are linked to the tests and panels that can run on them. Today they're configured on legacy Master Lists pages, separate from the rest of the catalog.

### Pain
Sample-type configuration is fragmented and disconnected from the tests and panels it relates to, and there's no consistent home for it alongside the other catalog reference data. Labs also can't record, in one place, how a given specimen type should be **handled by default** — the storage condition (e.g. refrigerated 2–8°C), how long it can be kept, and how it's disposed of — so that guidance lives in people's heads or on paper.

### What Changes
Sample types are managed in the same **Test Catalog Management** surface as tests and panels — switch the surface to **Sample Types**. Each sample type opens in the same editor shell with its own menu sections: its basics (incl. domain), the tests associated with it, its default storage & disposal requirements, and its coded-terminology mappings. One consistent place, consistent with how tests and panels now work.

---

## The real data model (verified in source — full reference: `test-catalog-data-model.md`)

- **`TypeOfSample`** (`org.openelisglobal.typeofsample.valueholder.TypeOfSample`, table `TYPE_OF_SAMPLE`): `description` varchar(20) NOT NULL, **`DOMAIN` varchar(1)** — a **legacy one-character column** (convention `'H'` = human), **not** the Clinical/Environmental/Vector enum; `localAbbreviation` varchar(10) unique, `isActive` boolean, `sortOrder` integer, `name_localization_id` FK, `display_key`.
- **`TypeOfSampleTest`** (table `SAMPLETYPE_TEST`): sample type ↔ test. Structurally m:n with **no unique pair constraint**, but every write path maintains **exactly one row per test** (specimen-is-identity, D-028). Also carries `display_order` (per-sample-type test ordering, OGC-938/985 — real and built) and an unmapped legacy `is_panel` column visible in DB dumps.
- **`TypeOfSamplePanel`** (table `SAMPLETYPE_PANEL`): sample type ↔ panel. **Still live on the hot path** — the order-entry panel list and e-order panel→sample-type resolution consume it. Not surfaced in this editor (panels derive their sample types from member tests), but the backend must keep it in sync; retirement is a separate backend story.
- **Not on the record today** (net-new — see Dependencies): the **Clinical/Environmental/Vector domain** (migration from the legacy 1-char column), a **WHONET/terminology mapping**, and **default storage & disposal requirements**.

---

## Surface & IA

Sample Types is a **context in the Test Catalog Management shell**, reached by selecting **Sample Types** in the **main SideNav** (Tests / Panels / Sample Types are peer entries under `Test Catalog Management` — a mutually-exclusive entity choice, not a top toggle or filter). Selecting it lists sample types; opening one uses the **same editor shell** as tests and panels, with a **SAMPLE TYPE** entity badge and its sections rendered as **SideNav submenus one level below the entity** (Admin › Test Catalog Management › Sample Types › Basic Info / Associated Tests / Display Order / Disposal / Terminology). **No tabs, no editor-local rail, no top segmented control.** Replaces the standalone `/admin/sample-type-management` page and the legacy Master Lists pages.

---

## Sample Types list

Columns: **Name** · **Abbreviation** · **Domain** (tag) · **Tests** (count) · **Status** · **Actions**. (v2.1: dropped the "Storage default" column — no per-type storage field exists or is added; the only per-type lifecycle field is the Disposal free-text, which doesn't belong in a list column.) Filters: search (name), **Domain**, Status. "**Add Sample Type**" opens a blank record in the editor.

---

## Editor sections (SideNav submenus — same shell, no tabs)

### Basic Info
| Field | Type | Required | Notes |
|---|---|---|---|
| **Name** | Text | Yes | Localized display name. Must be unique. |
| **Local abbreviation** | Text | No | Short code shown in compact UIs (`localAbbreviation`). |
| **Domain** | Radio | Yes | **Required — choose exactly one** of CLINICAL / ENVIRONMENTAL / VECTOR (real single `domain`). **Clinical primary at launch**, matching panels. |
| **Active** | Toggle | Yes | Inactive sample types don't appear in order-entry dropdowns. **On deactivate,** if active tests use this type, **warn** ("N active tests use this type; they won't be orderable while it's inactive") and proceed — no cascade; deactivation is reversible and order entry simply stops offering it. |

### Associated Tests — **read-only** (supersedes v2.0's additive model)
Lists the **test records that carry this sample type** (`SAMPLETYPE_TEST`), each row linking to
**Open in Test Catalog**. **No add, no remove, no typeahead.**

**Data-model reality (important):** a test run on several specimen types is stored as
**separate test records — one per sample type — each with its own LOINC** ("Hemoglobin (Whole
Blood)" and "Hemoglobin (Serum)" are two records), and every write path keeps exactly one
sample-type link per test (D-028). So "adding a test to this sample type" is really
**creating a specimen variant of an existing test** — a Test Catalog operation (the
"＋ Variant" flow in the Test Catalog Manageability FRS, which copies the source test's
configuration and links it into the assay group). Doing it from the sample-type side would
duplicate that flow with less context, so this section is deliberately a view: it answers
"what runs on this specimen?" and hands off to the test editor for changes. An inline note
states this and names the ＋ Variant path.

### Display Order
Positions this sample type in the **order-entry Sample Type menu** (the real `sortOrder`). Shows **all** sample types in their current order with **this one highlighted and draggable**, plus a numeric position — drag or type to place it. (This is menu ordering only; it is not shown as a Basic Info field.)

### Disposal
A single **free-text** field, **Disposal instructions** (e.g. "Autoclave before disposal via biohazard waste") — the primary lifecycle action for a specimen is disposal. Displayed **read-only elsewhere** as reference guidance. Deliberately free text, not structured: the **authoritative, structured** handling/disposal config is **per-test** (`TestSampleHandling` — `disposalMethod`, `disposalTimeframe`, `protectFromLight`, `specialInstructions` — test editor Storage section, OGC-752) and the **per-specimen** disposal workflow (Sample Storage, `disposeSampleItem`). This per-type text is a lightweight reference, not a second source of truth.

### Terminology
The **full terminology mapper** (parity with tests/panels): **Coding system** (LOINC / SNOMED / CIEL / OCL / **WHONET**), **Code**, **How it relates** (Same as / Broader than / Narrower than), add/remove. Replaces the v1.0 WHONET-only tab; WHONET remains a first-class coding system here for AMR surveillance exports. **Net-new for sample types (Dependency)** — reuse the test terminology mechanism.

---

## Domain

Sample types carry a **single, required domain** — the admin chooses **exactly one of Clinical / Environmental / Vector** (single-domain is final; OGC-538's "Both" wording is superseded). The editor surfaces it (Clinical primary at launch; Environmental/Vector later, consistent with the panel rollout). Domain scopes where the sample type is offered and keeps env/vector specimen types out of clinical order entry.

**Build reality (verified on develop):** the existing `TYPE_OF_SAMPLE.DOMAIN` column is a
**legacy varchar(1)** (`'H'`-style codes), incompatible with the enum. The single-domain model
therefore requires a **declared migration** (Dependency 4): introduce the enum-valued domain
and map/backfill the legacy codes (existing rows default to CLINICAL, consistent with the
`test.domain` backfill in OGC-936). Only `test.domain` exists in enum form today — Panel and
TestSection have no domain column at all, so each sibling FRS owns its own migration.

---

## Access
Via the existing **Test Catalog Manager / Admin** capability that governs the rest of the Test Catalog surface.

---

## Dependencies (net-new — not present today)
1. **Sample Types context + editor** in the Test Catalog Management shell (list + `/rest/test-catalog/sample-types` beyond the current Display-Order-only endpoint). *Backend + frontend.*
2. **Free-text Disposal instructions** on the sample type (one text column) — a small addition; the authoritative structured handling stays **per-test** (`TestSampleHandling`, OGC-752) and per-specimen (Sample Storage disposal). Deliberately not structured on the type, to avoid duplicating `TestSampleHandling`. *Backend + frontend.*
3. **Terminology mappings for sample types** (incl. WHONET) — reuse the test terminology mechanism; a `sampletype↔terminology` store + endpoint. Optionally add WHONET to the source enum (currently LOINC/SNOMED/CIEL/OCL). *Backend + frontend.*
4. **Domain migration** — replace/reinterpret the legacy `TYPE_OF_SAMPLE.DOMAIN` varchar(1) with the required single Clinical/Environmental/Vector domain (backfill existing rows to CLINICAL, matching the OGC-936 `test.domain` pattern). Mechanism is the dev's call; this FRS specifies only the behavior. *Backend.*

---

## Out of scope
- **Standalone `/admin/sample-type-management` page** — replaced by the shell context.
- **5-tab interface** — replaced by SideNav sections.
- **Bulk export** — deferred (parity with panels' deferred import/export).
- **Physical specimen storage/location tracking** — that's the Sample Storage feature; this only sets per-type defaults.
- **Environmental / Vector at launch** — Clinical primary first.

---

## Localization (new/changed keys)
| Key | English |
|---|---|
| `label.testCatalog.entity.sampleTypes` | Sample Types |
| `label.sampleType.abbreviation` | Local abbreviation |
| `label.sampleType.displayOrder` | Position in the Sample Type menu |
| `label.sampleType.disposalInstructions` | Disposal instructions |
| `warning.sampleType.deactivateInUse` | {count} active tests use this type; they won't be orderable while it's inactive. |
| `note.sampleType.associatedTests.viewOnly` | View only — a test's specimen is part of its identity. To run a test on this sample type, create a specimen variant in the Test Catalog. |
| `link.sampleType.associatedTests.openTest` | Open in Test Catalog |

Missing keys fall back to English.
