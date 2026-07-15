# Panel Management — Domain Upgrade

**Feature slug:** `panel-management-domain`
**Target Release:** OpenELIS Global v3.2
**Version:** 2.2 (2026-07-14) — aligned to the verified Test Catalog data model reference (`test-catalog-data-model.md`) and the Test Catalog Manageability decisions
**Jira:** OGC-224 (this epic) · OGC-753 + OGC-980/981/982 (test-side Panels section, built) · OGC-1140 (inline create inherits domain) · OGC-949 (Test Catalog Management umbrella)
**Related surfaces (planned, separate):** OGC-296 (Sample Type management) · OGC-189 (Lab Units management)

> **Why v2.0:** the previous draft (v1.x) described an aspirational model — a per-test "panel LOINC," a panel `code`, panel-level lab units, stored panel sample types, and bulk import/export. Verified against source (`panel.Panel`, `panelitem.PanelItem`, and the OGC-949 API contract), **none of those exist**. This version is rebased on what a Panel really is and adds the one thing this effort is actually about: a **Domain** on the panel.
>
> **v2.1 (2026-07-14):** (1) Panels adopt the **full terminology mapper** the test editor uses (LOINC / SNOMED / CIEL / OCL, + proposed **WHONET**) instead of a lone LOINC string — the LOINC becomes the primary mapping in a new **Terminology** section. (2) IA correction: the editor's sections are **main-menu SideNav submenus** one level below the entity (Admin › Test Catalog Management › Panels › Basic Info / Tests / Terminology), **not** an editor-local rail and not in-page tabs. (3) Sample Type management will need the parallel updates (domain-aware + terminology mapper) — flagged on OGC-296.
>
> **v2.2 (2026-07-14):** aligned to the source-verified data model reference: (1) **`SAMPLETYPE_PANEL` is live in order entry and e-order intake** — panel sample types stay UI-derived, but membership writes must keep the junction in sync; (2) **panel LOINC is a live routing key at FHIR intake** (`getPanelByLoincCode`), not just metadata; (3) PanelItem's legacy columns and missing pair-uniqueness recorded; (4) the migration SQL sketch replaced by a behavioral dependency (schema mechanics are dev's call); (5) touchpoints with the Test Catalog Manageability variant model noted.

---

## Lab Context

### Current State
A **panel** is a named bundle of tests a lab orders together — "Complete Blood Count" pulls white cells, red cells, hemoglobin, and so on. In OpenELIS a panel is a small record: a **name**, an optional **description**, a single **LOINC** code (the standardized identifier for the whole panel), a **sort order**, and an ordered list of its member tests. Panels are managed today on a set of separate legacy "Master Lists" pages (create a panel, order its tests, assign tests to it).

### Pain
Panels have **no notion of what kind of testing they belong to**. OpenELIS now runs three kinds of work — routine **clinical** testing, **environmental** testing (e.g. water quality), and **vector** surveillance (e.g. mosquito-borne disease). Nothing stops an admin from putting an environmental test and a clinical test in the same panel, which produces a nonsensical order and muddies where the panel shows up. There's also no single place to manage panels alongside the rest of the catalog — they live on their own legacy pages, disconnected from the test editor.

### What Changes
Every panel gets an explicit **Domain** (Clinical / Environmental / Vector). Adding tests to a panel is **guarded** to that domain, so a panel can never mix a clinical test with an environmental one. Panel management moves into the unified **Test Catalog Management** surface (reached by switching that surface from **Tests** to **Panels**), so panels are curated next to tests instead of on separate legacy pages. At launch only **Clinical** is enabled and every existing panel is set to Clinical; Environmental and Vector turn on in a later phase.

---

## The real data model (verified in source — full reference: `test-catalog-data-model.md`)

- **`Panel`** (`org.openelisglobal.panel.valueholder.Panel`, table `PANEL`): `panelName` varchar(20), `description` varchar(60) NOT NULL, `loinc` varchar(10) (single), `sortOrderInt`, `localization` FK, active flag. **Confirmed absent on develop:** code, lab unit, sample-type column, **and domain** — no `3.5.x.x` changeset touches `panel`, so the domain is entirely this effort's addition (Dependency 1). Only `test.domain` exists in enum form today (OGC-936).
- **`PanelItem`** (`org.openelisglobal.panelitem.valueholder.PanelItem`, table `PANEL_ITEM`): links `panel` ↔ `test` with a `sortOrder`. **No per-test LOINC.** Two legacy columns devs will meet but this UI never surfaces: `TEST_LOCAL_ABBREV` (hbm-unique, a bugzilla-2559 relic) and `METHOD_NAME`. **No unique constraint on (panel_id, test_id)** — duplicate membership is only app-prevented.
- **`TypeOfSamplePanel`** (table `SAMPLETYPE_PANEL`): panel ↔ sample type. **Not surfaced in this UI** (sample types are derived from member tests), but **live on the hot path**: the order-entry panel list (`getTypeOfSamplePanelsForSampleType`) and e-order panel→sample-type resolution (`getTypeOfSampleForPanelId(..).get(0)`) consume it. **Membership writes must keep it in sync** (as `TestModifyServiceImpl` already does) or order entry shows stale panel lists; retirement is a separate backend story (derive from PanelItem × SAMPLETYPE_TEST).
- **Panel LOINC is a live routing key**, not just metadata: FHIR intake matches panels by it (`PanelDAOImpl.getPanelByLoincCode` ← `TaskInterpreterImpl.createPanelFromFHIR`, `LabOrderSearchProvider`). Keep `panel.loinc` as the denormalized primary code in front of the terminology store.
- **Not on a panel** (and not added here): a `code` (the **LOINC is the panel's identifier**); a **lab unit / test section** (a panel legitimately spans sections — scope by domain instead); a stored **sample-type** set (derived from member tests).

**Domain addition (Dependency 1):** a single required domain on `panel`, existing rows
backfilled to CLINICAL — matching the OGC-936 `test.domain` pattern. Mechanism is the dev's
call; this FRS specifies the behavior, not the migration.

---

## Surface & IA

Panel management lives **inside Test Catalog Management** (no standalone page). Entity switching is done through the **main SideNav**, not a top-of-list toggle: **Tests / Panels / Sample Types** are peer entries under `Test Catalog Management` in the Admin menu — a mutually-exclusive entity choice, **not** a filter. Selecting **Panels** lists panels; opening one loads the **same editor shell** as a test, with a **PANEL** entity badge (vs **TEST**). The panel's sections render as **SideNav submenus one level below the entity** (Admin › Test Catalog Management › Panels › Basic Info / Tests / Terminology) — the OpenELIS SideNav-submenu pattern, **not** in-page tabs, **not** an editor-local rail, and **not** a segmented control at the top of the list.

The SideNav is built to extend: **Sample Types** and **Lab Units** master-list management are follow-on contexts as peer entries in the same menu (separate stories — OGC-296, OGC-189).

- **List route:** `/admin/TestCatalogList?entity=panels` (deep-linkable / bookmarkable).
- **Editor route:** `/MasterListsPage/TestCatalogEditor/panel/<id>/<section>` (mirrors the test route with a `panel` entity segment).
- **Breadcrumb:** Home > Admin > Test Catalog > Panels > [Panel Name].
- Replaces the legacy `PanelManagement` / `PanelCreate` / `PanelOrder` / `PanelTestAssign` pages (removed per OGC-949).
- ⚠ Verify the exact switch/URL treatment against the live app before dev handoff.

---

## Panels list

Columns: **Panel Name** · **LOINC** · **Tests** (count) · **Domain** (tag) · **Sample Types** (derived from member tests, read-only) · **Status** (Active/Inactive) · **Actions**. Filters: search (name / LOINC), **Domain**, Status. Row opens the panel editor. "**Add Panel**" opens a blank panel in the editor shell.

An info banner notes the upgrade: *"Panels now carry a Domain. The upgrade set every existing panel to Clinical; Environmental / Vector are editable in a later phase."*

---

## Panel editor sections (SideNav submenus — same shell, no tabs)

### Basic Info
| Field | Type | Required | Notes |
|---|---|---|---|
| **Panel Name** | Text | Yes | The panel's name. |
| **Terminology** | (own section) | — | Coded-system mappings are managed in the **Terminology** section (below). The **LOINC** mapping is the panel's primary identifier. **There is no separate panel code.** |
| **Domain** | Radio | Yes | CLINICAL / ENVIRONMENTAL / VECTOR. **Only Clinical is enabled at launch**; the others are disabled with a "later phase" note. Set from the originating test on inline create. |
| **Sample Types** | Read-only | — | **Derived** from the member tests; shown for reference. Editing sample types directly is the planned Sample Types work (OGC-296). |
| **Description** | Textarea | No | |
| **Active** | Toggle | Yes | Orderable when active. **Cannot be activated with zero tests** — see Activation rules. |

### Activation rules
- A panel **cannot be activated until it has at least one test.** With zero tests the Active toggle is **disabled (not clickable)** and shows helper text: *"Add at least one test before this panel can be activated."*
- A **newly created** panel **defaults to Active when its first test is added** (create → add first test → active).
- When **editing an existing** panel, its Active state is **preserved as-is** — adding/removing tests never auto-flips it (the auto-activate applies only to a panel's first-ever test at creation). Removing the last test from an active panel surfaces the same "needs ≥1 test" guard before it can be re-saved active.

### Tests (the centerpiece)
The ordered list of member tests — columns: **order** (drag-handle + numeric, writes `panel_item.sort_order`), **test name**, **test code**, remove. **LOINC is not shown here** — whoever manages membership doesn't need it. **Add a test** is a **typeahead searchable by name or test code**; picking a result **appends it to the end** of the list (positions renumber from there). The picker is **domain-guarded** — only tests in the panel's domain are offered, so a panel never mixes domains. **No per-test panel LOINC** — a test's LOINC lives on the Test and is unchanging.

### Terminology
Panels adopt the **same terminology mapper as tests** (parity with OGC-754). A table of coded-system mappings — **Source** (LOINC / SNOMED / CIEL / OCL; **WHONET** proposed for AMR alignment — not in the current source enum yet), **Code**, **Relationship** (SAME_AS / BROADER_THAN / NARROWER_THAN) — with add/remove. The **LOINC** mapping is the panel's primary identifier (replaces the lone `panel.loinc` string as the surfaced concept, though the primary LOINC can still be denormalized onto `panel.loinc` for list display and order-entry). Reconciles to the desired set on save, keyed on (source, code), exactly like the test terminology section.

### Vector Config
Deferred to the Environmental/Vector phase (organism-group metadata). Not shown while only Clinical is enabled.

---

## Domain — the core of this effort

- Every panel has exactly one **Domain**. Default CLINICAL.
- **Membership guard:** the Add-tests picker only offers tests in the panel's domain; a panel cannot contain tests from more than one domain.
- **Order-entry filtering** follows domain (a panel appears only for orders of its domain). Which sample types a panel is relevant to continues to derive from its member tests.
- **Inline create (OGC-1140):** a panel created inline from a test **inherits that test's domain** and is **Active on creation**; the test becomes the panel's first member. (No lab unit, no code — those don't exist on a panel.)
- **Launch scope:** only **Clinical** is selectable; the upgrade backfills every existing panel to Clinical. Environmental and Vector (and Vector Config) arrive in a later phase.

---

## Relationship to the test-side Panels section (OGC-753, built)

The Test Catalog editor's **test-side** Panels section ("which panels is *this test* in", add-to-panel, reposition this test) is already built (OGC-980/981/982) and writes the same `panel_item.sort_order`. This FRS is the **panel-side** (the panel list + panel editor). Both are two views of one model. The test-side inline "Create new panel" is where OGC-1140's inherit-domain behavior applies.

**Variant-model touchpoint (Test Catalog Manageability FRS):** panel membership is
**per test record** — i.e., per specimen variant. A panel contains "Glucose (Serum)", not
"Glucose"; the Add-tests picker shows the specimen-specific records, and the panel's derived
sample types follow from exactly which variants are members. Creating a specimen variant
does **not** copy the source test's panel memberships (deliberate — the source already
occupies those slots).

---

## Access

Via the existing **Test Catalog Manager / Admin** capability that already governs the Test Catalog editor and list. A user without it doesn't see the Panels context or the editor.

---

## Dependencies (net-new — not present today)

1. **`panel.domain` column** + the upgrade backfill to CLINICAL. *Backend / migration.*
2. **Domain-guarded test membership** — the Add-tests picker and the membership write reject cross-domain tests. **The membership write also keeps `SAMPLETYPE_PANEL` synchronized** whenever it changes the panel's derived sample-type set (order entry and e-order intake read that junction today). *Backend + frontend.*
3. **Inline-create inherits domain + Active-on-create** (OGC-1140) — extend the built `POST /rest/test-catalog/panels` (which currently takes name-only) to accept/inherit domain. *Backend + frontend.*
4. **Panel list + panel editor** on the `/rest/test-catalog/panels` API (the list API currently returns only `{id, name}` — it needs domain, LOINC, test count, derived sample types, status). *Backend + frontend.*
5. **Panel terminology mappings** — the full multi-source mapper (parity with the test Terminology section, OGC-754). Panels have only a single `loinc` string today, so this needs a panel↔terminology-mapping store (reuse the test terminology mechanism) + a `/rest/test-catalog/panels/{id}/terminology` endpoint. Optionally add **WHONET** to the source enum (currently LOINC/SNOMED/CIEL/OCL). *Backend + frontend.*

---

## Out of scope

- **Panel code** — panels are identified by name + LOINC; no code field.
- **Lab unit on a panel** — panels span sections; scoped by domain instead.
- **Stored panel sample types** — derived from member tests (direct management is OGC-296).
- **Per-test "panel LOINC"** — a test's LOINC is on the Test, unchanging.
- **Bulk import/export** — not in current scope.
- **Environmental / Vector domains and Vector Config** — later phase; Clinical only at launch.
- **Sample Type / Lab Unit master-list management** — planned follow-on contexts in this shell (OGC-296, OGC-189).

---

## Localization (new/changed keys)

| Key | English |
|---|---|
| `label.testCatalog.entity.panels` | Panels |
| `label.panel.domain` | Domain |
| `helper.panel.domainGuard` | Only {domain}-domain tests can be added to this panel. |
| `helper.panel.loincIsIdentifier` | The panel's LOINC serves as its identifier. |
| `note.panel.sampleTypesDerived` | Sample types are derived from the tests in this panel. |
| `note.panel.domainUpgrade` | Panels now have a Domain; existing panels were set to Clinical. |
| `note.panel.domainLaterPhase` | Environmental and Vector domains are enabled in a later phase. |

Missing keys fall back to English.
