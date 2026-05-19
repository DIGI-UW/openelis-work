# OpenELIS Global — Barcode Labels v2: Configurable Label Preset Management

## Functional Requirements Specification

**Version:** 2.3 (per-scope quantities — separate per-order / per-sample flags)
**Date:** 2026-05-18
**Author:** Casey Iiams-Hauser (filed via Cowork)
**Module:** Administration → Master Lists → Label Presets · Test Catalog → Labels tab · Order Entry → Add Order step
**Status:** Draft (awaiting design review)
**Jira:** [OGC-285](https://uwdigi.atlassian.net/browse/OGC-285)
**Depends on:** [OGC-284](https://uwdigi.atlassian.net/browse/OGC-284) (Barcode Labels v1 — Freezer + Order Entry Label Configuration)
**Required by:** [OGC-761](https://uwdigi.atlassian.net/browse/OGC-761) (Test Catalog Management v2.5 §Labels — consumes this preset system)
**Relates to:** [OGC-759](https://uwdigi.atlassian.net/browse/OGC-759) (Test Catalog Management v2.5 v2 epic), [OGC-746](https://uwdigi.atlassian.net/browse/OGC-746) (Test Editor scaffold), [OGC-358](https://uwdigi.atlassian.net/browse/OGC-358) (new UI Label & Store step)

---

## 1. Overview

### 1.1 Purpose

Extend OpenELIS Global's barcode label system from a fixed set of system label types (Order / Specimen / Block / Slide / Freezer) to an **admin-configurable preset system**. Lab administrators define their own label types — including custom dimensions, barcode style, and the system content fields they want printed — and tests in the Test Catalog declare which presets they require and at what quantity. Order Entry aggregates label requirements across all tests in an order and produces a single, deterministic label workload.

### 1.2 Problem Statement

The v1 barcode label system (OGC-284) hardcodes the five system label types. This blocks several real-world clinical scenarios:

- **Pathology workflows** need cryo-vial labels, FFPE block labels, aliquot labels, and case-level labels with different dimensions and content fields.
- **Storage workflows** need cryogenic-resistant labels that differ from order-level labels in both size and required content (storage location, expiry date).
- **Site-specific labels** vary by country and accreditation regime — some sites need GS1 DataMatrix; others need Code 128; others need QR codes that encode a URL.
- **Per-test label requirements** vary widely. A CBC needs one specimen label and zero pathology labels; a tissue biopsy needs one specimen label, four block labels, and eight slide labels. v1 forces the lab to manually adjust these every time at Order Entry.

### 1.3 Solution Summary

This release adds two new admin surfaces and one Order Entry enhancement:

1. **Master Lists → Label Presets** — admins create, edit, duplicate, deactivate, and configure custom label presets. Each preset defines dimensions, barcode style, a selection of system content fields, and **print scope** (per-order, per-sample, or both) with independent default and max quantities for each scope.
2. **Test Catalog → Labels tab** — for each test, admins link one or more per-sample presets and set default per-sample quantity, max per-sample quantity, and whether order-entry override is allowed. Tests apply to samples, so per-order quantities are configured only at the preset level. Replaces the 4-fixed-preset constraint that ships with OGC-761.
3. **Enhanced Order Entry** — when tests are selected, the Labels section renders two tables. The Order Labels table lists per-order presets with a single row for the order. The Sample Labels table lists per-sample presets with one row per sample, columns built dynamically from the union of presets linked to tests in the order. Quantities pre-populate from the per-test config; cells show which test drove each count so the technician understands the source.

### 1.4 Users

| Role | Benefits |
|------|----------|
| Lab Administrator | Define site-specific labels without engineering work; deactivate retired presets without breaking historical orders. |
| Pathology Staff | Per-test label generation produces the right block/slide/cryo-vial counts automatically. |
| Lab Technician (Order Entry) | Default label counts are intelligent (test-driven) instead of one-size-fits-all; aggregation across multi-test orders is transparent. |
| Sample Storage | Cryogenic-resistant labels with storage-location and expiry-date fields print on the right size stock. |

### 1.5 Scope

**In scope (this release):**
- Label Preset CRUD (Master Lists) — dimensions, barcode style, ordered list of system content fields.
- Test Catalog → Labels tab (replaces OGC-761's 4-fixed-preset implementation when this ships).
- Order Entry aggregation rules + source attribution.
- Migration: convert the 5 v1 system label types (Order, Specimen, Block, Slide, Freezer) into pre-seeded, locked system presets so existing configurations continue to work unchanged.

**Out of scope (this release — deferred to v3+):**
- **Custom user-defined content fields** (free text or fixed-value rows on a preset). v2 supports only the system field set enumerated in §2.4.
- **Live preview pane** in the preset editor. v2 has no in-editor rendering of the label; admins validate visually at print time. A future release may reintroduce a preview surface.
- **Manual-confirm per-preset mode.** All presets auto-generate; the post-save print dialog from OGC-284 §3.4 already gives the technician a per-type Print button, which is sufficient to control expensive stock without per-cell confirmation gates.
- **Full WYSIWYG label designer** (drag a Patient Name field anywhere on the canvas). v2 supports content-field selection + ordering, not pixel-perfect placement.
- **Per-preset font/typography controls.** Fields render in the system label font.
- **Conditional content fields** (e.g., "show Stain Type only when test is histology"). Deferred.
- **The OGC-284 Order Entry quantity UI gap.** Tracked separately — see [OGC-284 cohesive FRS §10](./barcode-config.md).

---

## 2. Master Lists → Label Presets

### 2.1 Location

New entry in **Administration → Master Lists → Label Presets** (`/MasterListsPage#labelPresets`).

In the v2.5 admin SideNav, Label Presets sits in the Master Lists group, alphabetically between "Lab Units" and "Methods".

### 2.2 List View

Carbon `<DataTable>` with click-to-open rows. Columns:

| Column | Source | Notes |
|---|---|---|
| Preset Name | `label_preset.name` | Unique within the lab. |
| Dimensions | `label_preset.height_mm × label_preset.width_mm` | Rendered as "25 × 76 mm". |
| Barcode Type | `label_preset.barcode_type` | Code 128 / QR / DataMatrix. |
| Status | `label_preset.is_active` | `<Tag type="green">Active</Tag>` or `<Tag type="gray">Inactive</Tag>`. |
| Actions | — | Edit · Duplicate · Deactivate. No hard Delete — see §2.6. |

**System presets** (the 5 originally-shipped types: Order / Specimen / Block / Slide / Freezer) are seeded by migration with `is_system = true` and cannot be renamed or deactivated. They can be edited (dimensions, content fields, default/max counts, scope flags) but their name is locked. The seeded "Order Label" preset is seeded with `prints_per_order = true` and `prints_per_sample = false`; the other four are seeded with `prints_per_order = false` and `prints_per_sample = true`. The scope flags on system presets remain editable in case a site wants to change a system preset's scope (e.g., also print Specimen Label at the order level). See §4.3.

**Filter bar** (collapsible): Barcode Type, Status. URL-reflected state.

**"+ Add Label Preset"** button opens the editor in a Carbon `<Modal>` (not a side panel — preset config is a substantial form).

### 2.3 Editor — Preset Configuration

Sections, top to bottom:

**Basic Info**
- Preset Name (TextInput, required, unique-within-lab validation on blur)
- Active (Toggle, default On)

**Dimensions**
- Height (NumberInput, mm, step 1, required, min 5 max 200)
- Width (NumberInput, mm, step 1, required, min 5 max 200)
- Helper text: "Match the dimensions of your label stock. Common sizes: 25 × 76 mm (standard), 25 × 50 mm (small), 13 × 44 mm (slide)."

**Barcode Settings**
- Barcode Type (Dropdown: Code 128 / QR / DataMatrix)

**Print Scope & Quantities**

The admin declares whether the preset prints at the order level, the sample level, or both. At least one scope MUST be selected; the editor blocks Save if neither checkbox is checked.

- **Per order — prints once per order** (Carbon `<Checkbox>`)
  - When checked, the following NumberInputs are revealed:
    - Default per order (NumberInput, integer ≥ 0) — system-level fallback used in the Order row at Order Entry.
    - Max per order (NumberInput, integer ≥ Default per order) — caps the Order row cell's NumberInput.
- **Per sample — prints once per sample** (Carbon `<Checkbox>`)
  - When checked, the following NumberInputs are revealed:
    - Default per sample (NumberInput, integer ≥ 0) — system-level fallback used in the Sample row cells when no per-test override exists.
    - Max per sample (NumberInput, integer ≥ Default per sample) — caps each Sample row cell's NumberInput.

Validation: at least one of the two checkboxes MUST be checked. If only Per order is checked, the per-sample inputs are hidden; if only Per sample is checked, the per-order inputs are hidden. If both are checked, both groups are shown.

Helper text under the scope checkboxes: "Per-order labels print once for the entire order. Per-sample labels print once for each sample in the order. Most labels are per-sample (Specimen, Block, Slide, Freezer). The Order Label is typically per-order."

**Content Fields**
- A FilterableMultiSelect picker populated with the complete system field set enumerated in §2.4 (15 fields). The admin can choose any subset; the chosen fields are then displayed in §2.4's reorderable list. Lab Number is always present, locked at position 1, and not selectable in the picker.

### 2.4 Editor — Content Fields

A reorderable list of fields that will appear on the label. Each row:

- Drag handle (also keyboard-accessible: Arrow Up / Arrow Down moves the focused row)
- Field name (e.g., "Patient Name")
- Required toggle (locked On for Lab Number; user-controlled for all others)
- Remove button (locked for Lab Number)

**System fields** available to add. The §2.3 Content Fields picker (FilterableMultiSelect) is populated from this complete set of 15 system fields, filtering out fields already added. v2 only supports this fixed set; user-defined custom fields are out of scope for MVP and deferred to v3+.

| Field | Source |
|---|---|
| Lab Number | always required, always present, locked at position 1 |
| Patient Name | patient master |
| Patient ID | patient master |
| Patient Date of Birth | patient master |
| Patient Sex | patient master |
| Site ID | site config |
| Collection Date and Time | sample |
| Collected By | sample |
| Tests | test list on the order |
| Specimen Type | sample type |
| Block ID | pathology block record |
| Slide ID | pathology slide record |
| Stain Type | pathology slide record |
| Case Number | pathology case |
| Storage Location | storage record |
| Expiry Date | storage record |

### 2.5 Localization

i18n key prefix for this surface: `admin.labelPresets.*` (resolved via Spring `MessageSource`). The FRS specifies the prefix only; FE engineers define individual keys at implementation. French and English are the primary translations for v2 release; see §11 for the full localization budget.

### 2.6 Lifecycle Operations

| Operation | Behavior |
|---|---|
| **Save** | Validates name uniqueness, dimensions, scope (`prints_per_order OR prints_per_sample`), and per-scope max ≥ default. Writes `label_preset` + `label_preset_field` rows. Updates an `updated_at` audit timestamp. |
| **Save as new** (Duplicate) | Clones the preset; user must enter a new name before save. |
| **Deactivate** | Sets `is_active = false`. Preset disappears from "+ Add Label Type" pickers but persists everywhere it's already linked. Historical orders are unaffected. Reactivation is one click. |
| **Hard Delete** | Not supported. Presets that have never been referenced anywhere can be removed via a separate admin tool; otherwise deactivate. |
| **Edit** | Editing a preset's dimensions or content fields takes effect for all future labels printed against that preset. Historical orders re-print using the snapshot rules in §6.3. |

### 2.7 System Preset Migration

At v2 release, a migration runs against every site:

1. Read existing barcode keys from `site_information`. v1 (OGC-284 §5.1) uses the following canonical key names, which this migration reads:
   - **Order** — `barcode.order.default`, `barcode.order.max`, `barcode.order.height`, `barcode.order.width`
   - **Specimen** — `barcode.specimen.default`, `barcode.specimen.max`, `barcode.specimen.height`, `barcode.specimen.width`
   - **Block** — `barcode.block.default`, `barcode.block.max`, `barcode.block.height`, `barcode.block.width`
   - **Slide** — `barcode.slide.default`, `barcode.slide.max`, `barcode.slide.height`, `barcode.slide.width`
   - **Freezer** — `barcode.freezer.default`, `barcode.freezer.max`, `barcode.freezer.height`, `barcode.freezer.width`
2. Create five rows in `label_preset` with `is_system = true`, named "Order Label", "Specimen Label", "Block Label", "Slide Label", "Freezer Label". Scope flags are seeded as follows:
   - **Order Label** — `prints_per_order = true`, `prints_per_sample = false`
   - **Specimen Label** — `prints_per_order = false`, `prints_per_sample = true`
   - **Block Label** — `prints_per_order = false`, `prints_per_sample = true`
   - **Slide Label** — `prints_per_order = false`, `prints_per_sample = true`
   - **Freezer Label** — `prints_per_order = false`, `prints_per_sample = true`

   Dimensions copied from `site_information`.
3. Create `label_preset_field` rows matching the current Barcode Configuration "Barcode Label Elements" checkboxes for each type (Lab Number always required; the optional fields per type from OGC-284 §2.3 carry over).
4. **Default and max counts MOVE** from `site_information.barcode.{type}.default` / `barcode.{type}.max` keys into the new per-scope quantity columns. The mapping is scope-aware:
   - **Order** — `prints_per_order = true`; `default_per_order = site_information.barcode.order.default`; `max_per_order = site_information.barcode.order.max`. The per-sample columns receive their schema defaults (`default_per_sample = 0`, `max_per_sample = 10`) but are inert because `prints_per_sample = false`.
   - **Specimen** — `prints_per_sample = true`; `default_per_sample = site_information.barcode.specimen.default`; `max_per_sample = site_information.barcode.specimen.max`. The per-order columns receive their schema defaults but are inert.
   - **Block** — `prints_per_sample = true`; `default_per_sample = site_information.barcode.block.default`; `max_per_sample = site_information.barcode.block.max`.
   - **Slide** — `prints_per_sample = true`; `default_per_sample = site_information.barcode.slide.default`; `max_per_sample = site_information.barcode.slide.max`.
   - **Freezer** — `prints_per_sample = true`; `default_per_sample = site_information.barcode.freezer.default`; `max_per_sample = site_information.barcode.freezer.max`.

   These per-scope columns on `label_preset` become the canonical source for default and max quantities. Legacy `site_information.barcode.*` keys are retained read-only for one release cycle as the rollback mirror described below.

**Move-vs-mirror resolution:** the legacy `site_information.barcode.*` keys are retained as **read-only mirrors for one release cycle only**. They are NOT actively dual-written by the application; the migration writes them once at cutover and the app then ignores them. The mirror exists solely to support emergency rollback to v2.0 if the v2 release stalls in production. A follow-up migration in the next release (v2.x) removes the legacy keys entirely once all callers are confirmed migrated.

---

## 3. Test Catalog → Labels Tab

### 3.1 Location

In the new Test Editor (delivered by OGC-746 v1 epic), Labels is the 8th SideNav entry, between "Panels" and "Terminology Mappings".

**Compatibility with OGC-761:** When this v2 ships, the OGC-761 implementation (which constrains the Labels tab to the 4 system fixed presets) is superseded by the full preset picker described here. OGC-761's `test_label_preset_link` table is reused without dropping any columns; this release adds `allow_override` per §3.5 / §6.2.

### 3.2 Per-Test Linked Presets Table

Tests apply to samples, not to orders directly. The Labels tab therefore only links **per-sample presets** to tests; the per-order scope is controlled exclusively by the preset's own `prints_per_order` flag and `default_per_order` / `max_per_order` values. The Preset dropdown is filtered to active presets where `prints_per_sample = true`. Presets that are `prints_per_order = true` AND `prints_per_sample = false` (order-only presets) are excluded from this picker because there is nothing to override.

Carbon `<DataTable>` columns:

| Column | Notes |
|---|---|
| Preset | `<Dropdown>` populated with active presets where `prints_per_sample = true`, excluding any already linked to this test. Includes system per-sample presets (Specimen / Block / Slide / Freezer) and any custom per-sample presets. |
| Default Per Sample | NumberInput, integer ≥ 0. Overrides the preset's own `default_per_sample` for this specific test only. |
| Max Per Sample | NumberInput, integer ≥ Default Per Sample. Overrides the preset's own `max_per_sample` for this specific test only. |
| Allow Override | `<Checkbox>` — when on, the user can change the qty at Order Entry within the Max Per Sample range. When off, the qty is locked at Default Per Sample. |
| Actions | Remove from this test. |

**"+ Add Label Type"** button opens a `<Dropdown>` picker with active per-sample presets minus any already linked.

The Mode column from earlier drafts is deliberately not present; the Test Catalog only overrides per-sample quantities, never per-order.

### 3.3 Test-Level Toggles

Above the table:

- **Allow label count override at order entry** (Toggle, default On) — a master switch. When off, all per-preset Allow Override checkboxes are forced off and Order Entry shows the labels as read-only.

### 3.4 Order Entry Preview

Below the linked presets table, a small "Order Entry Preview" card renders a Carbon `<StructuredList>` summary of how this test's labels will appear in Order Entry — preset name, default qty, override status. No graphical label preview is rendered (live preview is out of scope; see §1.5).

### 3.5 Schema reference (additions to existing OGC-761 table)

The `test_label_preset_link` table was introduced by OGC-761. Its existing columns are:

- `id` (BIGSERIAL PRIMARY KEY)
- `test_id` (BIGINT, FK to `test`)
- `preset_id` (BIGINT, FK to `label_preset`)
- `default_qty` (INTEGER) — override of `label_preset.default_per_sample`; column name retained for OGC-761 back-compat
- `max_qty` (INTEGER) — override of `label_preset.max_per_sample`; column name retained for OGC-761 back-compat

In v2 this release reinterprets the two integer columns as **per-sample overrides only**:

- `default_qty` → overrides `label_preset.default_per_sample` for this test. (Documented in code comments and the ALTER block in §6.2; column name retained for backward compatibility with OGC-761.)
- `max_qty` → overrides `label_preset.max_per_sample` for this test.

This release adds **one** new column conceptually:

- `allow_override` (BOOLEAN) — controls whether Order Entry users can adjust the qty for the per-sample cell.

A CHECK constraint added in §6.2 ensures rows in `test_label_preset_link` reference only presets where `prints_per_sample = true`; linking an order-only preset (`prints_per_order = true` AND `prints_per_sample = false`) to a test is rejected.

The canonical DDL for this change is the ALTER statement in **§6.2** — that is the source of truth; the list above is descriptive only. A separate new table `test_label_config` (defined in §6.2) carries the test-level master `allow_order_entry_override` toggle.

### 3.6 Localization

i18n key prefix for this surface: `admin.testCatalog.labels.*`.

---

## 4. Enhanced Order Entry — Labels Section

### 4.1 Location

The Labels section on Order Entry → Add Order step (Step 4), positioned between **ORDER** and **RESULT REPORTING**, as defined in OGC-284 §3.1.

### 4.2 Dynamic Column Construction

The Labels section renders as **two separate tables** — Order Labels and Sample Labels — each with independently computed columns.

**Order Labels table columns:**
1. All active presets with `prints_per_order = true`, regardless of whether any test on the order linked them. (Per-order presets are lab-wide, not test-driven.)
2. Sort: system presets first (in seed order), then custom presets alphabetically.

**Sample Labels table columns:**
1. Compute the union of presets linked to all tests in the order via `test_label_preset_link`, restricted to those with `prints_per_sample = true`.
2. If no tests are selected, fall back to active system presets where `prints_per_sample = true` (Specimen / Block / Slide / Freezer).
3. Sort: system presets first, then custom presets alphabetically.

### 4.3 Row Construction

Two tables, each with its own row structure:

**Order Labels table:**
| Row | Cells |
|---|---|
| Order | One cell per per-order preset column. Defaults from `preset.default_per_order`; max from `preset.max_per_order`. |
| **Total** | Live sum across columns. |

**Sample Labels table:**
| Row | Cells |
|---|---|
| Sample 1 | One cell per per-sample preset column. Aggregation rules apply (see §4.4). |
| Sample N | Same. |
| **Total** | Live sum per column across all samples. |

A preset that has both `prints_per_order = true` and `prints_per_sample = true` appears in both tables independently — the per-order quantity defaults from `preset.default_per_order` (single row), and the per-sample quantity defaults from the test-link override or `preset.default_per_sample`.

### 4.4 Cell Behavior

**Order Labels cells** are Carbon `<NumberInput>` pre-populated with `preset.default_per_order`. Max = `preset.max_per_order`. No source tag (per-order quantities are lab-wide, not test-driven).

**Sample Labels cells** are Carbon `<NumberInput>` pre-populated using this resolution order:

1. **Test-driven default** — if the order contains tests linked to this preset, take the highest `default_per_sample` across those test links. (E.g., if Test A overrides to 2 and Test B overrides to 3, the cell starts at 3.) The cell shows a small `<Tag>` below: "from Test B".
2. **Preset default** — if no tests in the order link to this preset, fall back to `preset.default_per_sample`. The cell shows `<Tag>`: "system default".

Max range = highest `max_per_sample` across linked tests, or `preset.max_per_sample` if no test links. Validation: `0 ≤ entered_value ≤ max`.

If any linked test has `allow_override = false`, that cell is read-only and shows a small lock icon with tooltip "Quantity locked by test catalog".

If the test-level `allow_order_entry_override` toggle is off for any test in the order, all cells driven by that test are read-only.

#### 4.4.1 Aggregation conflict-resolution rules

When multiple tests in the same order link the same preset, conflicting per-test settings are resolved as follows:

| Field | Conflict | Resolution |
|---|---|---|
| `default_qty` | Two tests with different defaults | Highest value wins. The source `<Tag>` names the driving test. (Codifies AC-17.) |
| `max_qty` | Two tests with different maxes | Highest value wins. The cell's NumberInput max attribute uses this value. |
| `allow_override` | One test allows override, another doesn't | **Most-restrictive wins.** The cell renders read-only with a lock icon. Tooltip names the locking test: "Quantity locked by test catalog (locked by Test X)." |

The conflict-resolution function runs server-side at `POST /api/orderEntry/labelRequest` (§7) and is reproducible; the same inputs always produce the same column set + cell defaults.

### 4.5 Total Row

A pinned bottom row summing each column, displayed as bold numbers. A right-aligned summary text reads: "Total: 14 labels across 5 types".

### 4.6 Post-Save Print Dialog Compatibility

The post-save print dialog defined in OGC-284 §3.4 continues to work. The dialog dynamically lists every preset with a non-zero count in the saved order. Each preset gets its own Print button so the technician can route different sizes / stock types to different printers as needed. There is no per-cell or per-preset confirmation step in v2 — all presets behave the same way at print time.

### 4.7 Localization

i18n key prefix for this surface: `orderEntry.labels.*`.

---

## 5. Functional Requirements

### 5.1 Label Presets — Master Lists

| ID | Requirement |
|---|---|
| LP-1 | System SHALL display a Label Presets list view at `/MasterListsPage#labelPresets`. |
| LP-2 | Admin MAY create a new preset with a unique name, dimensions, and barcode settings. |
| LP-3 | Admin MAY select content fields from the system field set (see §2.4) and arrange them in display order. |
| LP-4 | Admin MAY duplicate a preset via "Save as new", clearing the name field for required entry. |
| LP-5 | Admin MAY deactivate a preset; deactivated presets persist on historical orders but disappear from "+ Add Label Type" pickers. |
| LP-6 | System SHALL prevent renaming or deactivating any `is_system = true` preset. |
| LP-7 | System SHALL validate that `max_per_order ≥ default_per_order`, `max_per_sample ≥ default_per_sample`, and all are non-negative integers. At least one scope (`prints_per_order` or `prints_per_sample`) MUST be true. |
| LP-8 | System SHALL persist Lab Number as a required, locked, first-position field on every preset. |

### 5.2 Test Catalog — Labels Tab

| ID | Requirement |
|---|---|
| TL-1 | System SHALL display a Labels section in the Test Editor SideNav. |
| TL-2 | Admin MAY link any active preset to a test with default qty, max qty, and allow-override flag. |
| TL-3 | System SHALL prevent linking the same preset to the same test twice. |
| TL-4 | System SHALL display an Order Entry Preview (Carbon `<StructuredList>`) summarizing the configuration. |
| TL-5 | System SHALL aggregate per-sample label requirements across all tests in an order by taking the highest `test_label_preset_link.default_qty` per preset. (Per-order quantities are not test-driven; they're configured at the preset level.) |
| TL-6 | System SHALL fall back to `label_preset.default_per_sample` when an order contains no tests linked to that preset. |

### 5.3 Order Entry

| ID | Requirement |
|---|---|
| OE-1 | System SHALL dynamically construct Labels-section columns from the union of presets across all tests in the order. |
| OE-2 | System SHALL display, per cell, a source `<Tag>` indicating whether the value came from a test ("from Test X") or system default. |
| OE-3 | Cells whose driving test has `allow_override = false` SHALL be read-only with a lock icon. When multiple tests link the same preset and any one of them has `allow_override = false`, the cell SHALL be locked (most-restrictive wins per §4.4.1). |
| OE-4 | System SHALL display a live Total row summing each column. |
| OE-5 | System SHALL persist the entered label quantities with the order upon Save, including a JSONB snapshot of each preset's config (see §6.3). |
| OE-6 | Reprinting from Order View SHALL use the snapshot stored with the order, not the current `label_preset` config. |

### 5.4 Migration & Backward Compatibility

| ID | Requirement |
|---|---|
| MG-1 | At v2 release, system SHALL create one `label_preset` row per existing v1 system label type, populated from `site_information.barcode.*` keys. |
| MG-2 | System SHALL set `is_system = true` on each migrated preset. |
| MG-3 | Existing OGC-761 `test_label_preset_link` rows SHALL continue to function unchanged after the schema additions; new columns receive their schema defaults. |
| MG-4 | Existing v1 orders SHALL continue to print labels against their snapshot rules (see §6.3). |
| MG-5 | Legacy `site_information.barcode.*` keys SHALL be retained as read-only mirrors for one release cycle and removed in the subsequent maintenance migration (see §2.7). |

---

## 6. Data Model

### 6.1 New Tables

```sql
CREATE TABLE label_preset (
  id                  BIGSERIAL PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  height_mm           INTEGER NOT NULL CHECK (height_mm BETWEEN 5 AND 200),
  width_mm            INTEGER NOT NULL CHECK (width_mm BETWEEN 5 AND 200),
  barcode_type        VARCHAR(20) NOT NULL CHECK (barcode_type IN ('CODE_128','QR','DATAMATRIX')),
  prints_per_order    BOOLEAN NOT NULL DEFAULT false,
  prints_per_sample   BOOLEAN NOT NULL DEFAULT true,
  default_per_order   INTEGER NOT NULL DEFAULT 0 CHECK (default_per_order >= 0),
  max_per_order       INTEGER NOT NULL DEFAULT 10 CHECK (max_per_order >= default_per_order),
  default_per_sample  INTEGER NOT NULL DEFAULT 0 CHECK (default_per_sample >= 0),
  max_per_sample      INTEGER NOT NULL DEFAULT 10 CHECK (max_per_sample >= default_per_sample),
  is_system           BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT label_preset_name_uniq UNIQUE (name),
  CONSTRAINT label_preset_scope_required CHECK (prints_per_order OR prints_per_sample)
);

CREATE TABLE label_preset_field (
  id            BIGSERIAL PRIMARY KEY,
  preset_id     BIGINT NOT NULL REFERENCES label_preset(id) ON DELETE CASCADE,
  field_key     VARCHAR(60) NOT NULL,            -- e.g. 'PATIENT_NAME', 'LAB_NUMBER'
  source_type   VARCHAR(20) NOT NULL DEFAULT 'SYSTEM' CHECK (source_type = 'SYSTEM'),
  is_required   BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  CONSTRAINT label_preset_field_order_uniq UNIQUE (preset_id, display_order),
  CONSTRAINT label_preset_field_key_uniq   UNIQUE (preset_id, field_key)
);
```

Note: `source_type` is constrained to a single value (`SYSTEM`) in v2; the column exists to allow a future migration to introduce additional source types (user-defined custom fields, query-driven fields) without an `ALTER TYPE` round trip. See §1.5 for what was deferred.

### 6.2 Modified Tables

```sql
-- existing from OGC-761; adds the override-control column.
ALTER TABLE test_label_preset_link
  ADD COLUMN allow_override BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE test_label_config (
  test_id                    BIGINT PRIMARY KEY REFERENCES test(id) ON DELETE CASCADE,
  allow_order_entry_override BOOLEAN NOT NULL DEFAULT true
);
```

The OGC-761 `test_label_preset_link` table is assumed to already exist at v2 release with columns: `id`, `test_id`, `preset_id`, `default_qty`, `max_qty`. This release adds only `allow_override`.

### 6.3 Snapshot Rule for Historical Orders

When labels are saved with an order (in the Order Entry Labels section), the system writes one `order_label_request` row per `(sample, preset)` pair, including a frozen JSONB `preset_snapshot` capturing the preset config and the per-test link settings that drove the quantity at save time. Reprinting from Order View renders this snapshot, not the current preset config — protecting historical orders from admin edits.

```sql
CREATE TABLE order_label_request (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL,
  sample_id       BIGINT,                  -- null for order-level labels
  preset_id       BIGINT NOT NULL REFERENCES label_preset(id),
  qty             INTEGER NOT NULL CHECK (qty >= 0),
  preset_snapshot JSONB NOT NULL,          -- frozen copy of preset + fields + link settings at save time
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 6.3.1 Canonical `preset_snapshot` JSONB shape

The snapshot MUST conform to the following structure. Reprints read from this shape only; new fields added to `label_preset` in future releases do not retroactively appear in historical snapshots.

```json
{
  "preset": {
    "id": 17,
    "name": "Specimen Label",
    "height_mm": 25,
    "width_mm": 76,
    "barcode_type": "CODE_128"
  },
  "fields": [
    { "field_key": "LAB_NUMBER",   "field_label": "Lab Number",   "is_required": true,  "display_order": 1 },
    { "field_key": "PATIENT_NAME", "field_label": "Patient Name", "is_required": false, "display_order": 2 },
    { "field_key": "COLLECTION_DATETIME", "field_label": "Collection Date/Time", "is_required": false, "display_order": 3 }
  ],
  "test_link": {
    "test_id": 412,
    "default_qty": 2,
    "max_qty": 5,
    "allow_override": true
  }
}
```

Notes on the shape:

- **`preset`** — captures everything needed to render the label frame and barcode.
- **`fields`** — ordered list of `{field_key, field_label, is_required, display_order}`. `field_label` is included so the rendered label is decoupled from the system label set evolving over time.
- **`test_link`** — the linked test settings at save time. If the cell was driven by the system default rather than a specific test link, this object is set to `null` and `qty` reflects `label_preset.default_qty` at save time.
- The snapshot is **frozen**: edits to `label_preset` or `test_label_preset_link` made after the order is saved have no effect on the rendered label at reprint.

---

## 7. API Endpoints

All endpoints follow the standard Spring Boot error envelope on failure (HTTP status + `{ "timestamp", "status", "error", "message", "path" }`). Auth scope per endpoint is listed in the **Scope** column.

| Method | Endpoint | Description | Scope |
|---|---|---|---|
| GET | `/api/labelPresets` | List presets (filter: status). | `admin.barcode.manage` |
| POST | `/api/labelPresets` | Create preset (with content fields in body). | `admin.barcode.manage` |
| GET | `/api/labelPresets/{id}` | Read preset detail. | `admin.barcode.manage` |
| PUT | `/api/labelPresets/{id}` | Update preset. | `admin.barcode.manage` |
| PATCH | `/api/labelPresets/{id}/activate` | Toggle `is_active`. | `admin.barcode.manage` |
| POST | `/api/labelPresets/{id}/duplicate` | Server-side clone; client supplies new name. | `admin.barcode.manage` |
| GET | `/api/tests/{id}/labelConfig` | Get linked presets + test-level toggle. | `admin.testCatalog.manage` |
| PUT | `/api/tests/{id}/labelConfig` | Replace linked presets + test-level toggle. | `admin.testCatalog.manage` |
| POST | `/api/orderEntry/labelRequest` | Compute the dynamic Labels section given a set of test IDs + sample types. Returns the column set + per-cell defaults + max + source tag. | `order.create` |
| GET | `/api/orders/{id}/labels` | Get persisted label request for an order (uses snapshot). | `order.read` |
| GET | `/api/barcode/print/{orderId}/{presetId}` | Generate PDF for a preset's labels for the order (uses snapshot). | `order.read` |

### 7.1 Request / response examples

**`POST /api/labelPresets`** — create a new preset.

Request:
```json
{
  "name": "Cryo Vial Label",
  "height_mm": 25,
  "width_mm": 25,
  "barcode_type": "QR",
  "default_qty": 1,
  "max_qty": 4,
  "is_active": true,
  "fields": [
    { "field_key": "LAB_NUMBER",       "is_required": true,  "display_order": 1 },
    { "field_key": "STORAGE_LOCATION", "is_required": false, "display_order": 2 },
    { "field_key": "EXPIRY_DATE",      "is_required": false, "display_order": 3 }
  ]
}
```

Success response (`201 Created`):
```json
{
  "id": 42,
  "name": "Cryo Vial Label",
  "height_mm": 25,
  "width_mm": 25,
  "barcode_type": "QR",
  "prints_per_order": false,
  "prints_per_sample": true,
  "default_per_order": 0,
  "max_per_order": 0,
  "default_per_sample": 1,
  "max_per_sample": 4,
  "is_system": false,
  "is_active": true,
  "created_at": "2026-05-18T14:00:00Z",
  "updated_at": "2026-05-18T14:00:00Z",
  "fields": [
    { "id": 101, "field_key": "LAB_NUMBER",       "is_required": true,  "display_order": 1 },
    { "id": 102, "field_key": "STORAGE_LOCATION", "is_required": false, "display_order": 2 },
    { "id": 103, "field_key": "EXPIRY_DATE",      "is_required": false, "display_order": 3 }
  ]
}
```

**`PUT /api/labelPresets/{id}`** — full replacement (PATCH semantics not supported in v2; clients send the whole preset).

Request body: same shape as POST. Success response (`200 OK`): same shape as POST.

**`PUT /api/tests/{id}/labelConfig`** — replace linked presets and test-level toggle.

Request:
```json
{
  "allow_order_entry_override": true,
  "links": [
    { "preset_id": 17, "default_qty": 1, "max_qty": 5,  "allow_override": true  },
    { "preset_id": 24, "default_qty": 4, "max_qty": 12, "allow_override": false }
  ]
}
```

Success response (`200 OK`):
```json
{
  "test_id": 412,
  "allow_order_entry_override": true,
  "links": [
    { "id": 991, "preset_id": 17, "default_qty": 1, "max_qty": 5,  "allow_override": true  },
    { "id": 992, "preset_id": 24, "default_qty": 4, "max_qty": 12, "allow_override": false }
  ]
}
```

**`POST /api/orderEntry/labelRequest`** — compute the dynamic Labels section for a candidate order.

Request:
```json
{
  "test_ids": [412, 518],
  "samples": [
    { "sample_id_local": "S1", "sample_type": "BLOOD_EDTA" },
    { "sample_id_local": "S2", "sample_type": "TISSUE" }
  ]
}
```

Success response (`200 OK`):
```json
{
  "order_columns": [
    { "preset_id": 1, "name": "Order Label", "is_system": true, "max": 10 }
  ],
  "sample_columns": [
    { "preset_id": 17, "name": "Specimen Label", "is_system": true, "max": 5  },
    { "preset_id": 24, "name": "Slide Label",    "is_system": true, "max": 12 }
  ],
  "order_row": {
    "cells": [
      { "preset_id": 1, "default": 2, "max": 10, "locked": false, "source": "preset_default" }
    ]
  },
  "sample_rows": [
    {
      "sample_id_local": "S1",
      "cells": [
        { "preset_id": 17, "default": 1, "max": 5,  "locked": false, "source": "test", "source_test_id": 412, "source_test_name": "CBC" }
      ]
    },
    {
      "sample_id_local": "S2",
      "cells": [
        { "preset_id": 17, "default": 1, "max": 5,  "locked": false, "source": "test", "source_test_id": 518, "source_test_name": "Tissue Biopsy" },
        { "preset_id": 24, "default": 4, "max": 12, "locked": true,  "source": "test", "source_test_id": 518, "source_test_name": "Tissue Biopsy" }
      ]
    }
  ]
}
```

The `locked: true` flag mirrors the §4.4.1 most-restrictive rule: any linked test with `allow_override = false` locks the cell.

---

## 8. Acceptance Criteria

### Label Presets — Master Lists
- [ ] **AC-1** — Admin opens Master Lists → Label Presets and sees the 5 system presets (Order, Specimen, Block, Slide, Freezer) pre-seeded.
- [ ] **AC-2** — Admin creates a new "Cryo Vial Label" preset (25 × 25 mm, QR, fields Lab Number + Storage Location + Expiry Date) and saves successfully.
- [ ] **AC-3** — Admin attempts to deactivate a system preset → blocked with an inline error.
- [ ] **AC-4** — Preset Name uniqueness is enforced; attempting to save a duplicate name produces a field-level error.
- [ ] **AC-5** — Admin deactivates a custom preset → preset disappears from "+ Add Label Type" pickers but historical orders linked to it still print.
- [ ] **AC-6** — "Save as new" requires a different name before save succeeds.
- [ ] **AC-7** — Validation: `max_per_order < default_per_order` or `max_per_sample < default_per_sample` blocks save with a field-level error. Attempting to save with both scope flags off also blocks save.

### Test Catalog — Labels Tab
- [ ] **AC-8** — Labels SideNav entry appears in the Test Editor.
- [ ] **AC-9** — Admin links "Specimen Label" (default 1, max 5, allow override) and "Slide Label" (default 4, max 12, no override) to the CBC test and saves.
- [ ] **AC-10** — Order Entry Preview renders the configuration summary accurately, with lock indicators where appropriate.
- [ ] **AC-11** — Admin cannot link the same preset to the same test twice.
- [ ] **AC-12** — Setting test-level `allow_order_entry_override` to off renders all per-preset Allow Override checkboxes as forced-off and disabled.

### Order Entry
- [ ] **AC-13** — User adds CBC + tissue biopsy to an order; the Labels section columns include Order, Specimen, Block, Slide, Freezer, plus any custom preset linked to either test, sorted system-first.
- [ ] **AC-14** — Each cell shows a source `<Tag>` indicating which test or system default drove the value.
- [ ] **AC-15** — Cells with `allow_override = false` are read-only with a lock icon.
- [ ] **AC-16** — Override-locked cells in Order Entry render read-only with a lock icon when **any** linked test has `allow_override = false` (most-restrictive wins per §4.4.1).
- [ ] **AC-17** — Aggregation: same preset on two tests with different defaults uses the higher value.
- [ ] **AC-18** — Total row sums each column live as cells change.
- [ ] **AC-19** — Order Save writes `order_label_request` rows including a JSONB `preset_snapshot` per the §6.3.1 shape.
- [ ] **AC-20** — Reprint from Order View uses `order_label_request.preset_snapshot`, not the current `label_preset` config; subsequent edits to the preset do not change the rendered label.

### Migration
- [ ] **AC-21** — Running the v2 migration creates exactly 5 system presets per site, with dimensions copied from `site_information.barcode.*` keys.
- [ ] **AC-22** — Migration maps `site_information.barcode.order.{default,max}` into `label_preset.default_per_order` / `max_per_order` for the seeded Order Label preset; the other four (Specimen, Block, Slide, Freezer) map into `default_per_sample` / `max_per_sample`. Legacy keys mirror read-only for one release cycle; the subsequent maintenance release migration removes them.
- [ ] **AC-23** — Existing OGC-284 orders continue to print labels correctly after migration.
- [ ] **AC-24** — OGC-761 `test_label_preset_link` rows persist and remain valid after the schema additions; `allow_override` populates to its schema default (`true`).

### Accessibility
- [ ] **AC-25** — All Carbon components render correctly with screen reader (NVDA + JAWS smoke test).
- [ ] **AC-26** — Content-field reordering works via keyboard (Arrow Up / Arrow Down on focused row).
- [ ] **AC-27** — Color is never the sole indicator of status (system Tag, lock icon include text/icon).

---

## 9. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| OGC-284 (Barcode Labels v1) | Done — but with implementation gaps (see [OGC-284 cohesive FRS](./barcode-config.md) §10). | Provides the v1 system-preset schema; v2 migration consumes it. |
| OGC-761 (v2.5 §Labels — 4 fixed presets) | Backlog | v2 supersedes OGC-761's picker UI but reuses its `test_label_preset_link` table. |
| OGC-746 (v2.5 v1 — Test Editor scaffold) | Backlog | Provides the Test Editor SideNav that hosts the Labels tab. |
| OGC-358 (new UI Label & Store step) | Backlog | Should inherit the Order Entry aggregation behavior from §4. |
| PDF generation library | Already in production | Used to render labels per snapshot. |
| Barcode generation library | Already in production | Used by v1; no changes. |

---

## 10. Open Questions

| # | Question | Owner |
|---|---|---|
| Q1 | Do we need a "label-template-version" column on `order_label_request` so reprint can choose between snapshot-at-save vs current preset? Snapshot is the safer default; some sites may want "always use current". | Piotr / Casey |
| Q2 | What's the right home for the "Allow label count override at order entry" master toggle — per-test (current proposal), per-lab, or both? | Casey + lab admins |
| Q3 | How do we handle accessibility for the drag-handle on content fields when the user is dragging? Carbon doesn't ship a fully a11y drag-drop; do we use react-aria's useDrag or roll our own keyboard-only fallback? | Design + engineering |
| Q4 | When v3+ reintroduces user-defined custom fields, do we ship them as `CUSTOM_FREETEXT` / `CUSTOM_FIXED` source types under the existing `label_preset_field.source_type` column, or as a separate `label_preset_custom_field` table? Affects the v2 schema shape we lock in here. | Engineering review |

---

## 11. Localization

OpenELIS Global localizes via Spring `MessageSource` keys. This FRS specifies the i18n key prefix per surface; FE engineers define individual keys at implementation. The prefixes used in this release:

| Surface | Key prefix |
|---|---|
| §2 Master Lists → Label Presets | `admin.labelPresets.*` |
| §3 Test Catalog → Labels tab | `admin.testCatalog.labels.*` |
| §4 Order Entry → Labels section | `orderEntry.labels.*` |

**Translation scope:** French and English are the primary translation targets for the v2 release. Bidirectional (RTL) layout is not required.

**Layout budget:** column widths in the Master Lists table, the Test Catalog linked-presets table, and the Order Entry Labels table SHOULD accommodate up to **~30% text expansion** versus the English source string. Source `<Tag>` chips ("from Test X", "system default") and lock-icon tooltips are included in this budget. Long preset names truncate with an `<OverflowMenu>` tooltip rather than wrapping.

---

## 12. Future Considerations (v3+)

- **User-defined custom content fields** — free-text and fixed-value rows on a preset (the original v2 proposal, deferred for MVP).
- **Live preview pane** — graphical in-editor render of the label as the admin configures it.
- **Manual-confirm per-preset mode** — a per-cell gate at Order Entry forcing the technician to acknowledge before expensive stock is printed.
- **WYSIWYG canvas designer** — drag fields to specific positions, set fonts per field.
- **Per-site label preset libraries** — share preset definitions across multiple OpenELIS deployments (FHIR Library resource? OCL? something else?).
- **Conditional content fields** — show Stain Type only when sample type is histology.
- **Multi-language labels** — render content fields in the patient's preferred language where applicable (Lab Number stays numeric).
- **Reprint audit trail** — log every reprint with timestamp + user; surface in Order View for chain-of-custody.

---

## 13. References

- [OGC-285 in Jira](https://uwdigi.atlassian.net/browse/OGC-285)
- [OGC-284 cohesive FRS](./barcode-config.md) — v1 spec + implementation gap analysis
- [OGC-761 (v2.5 §Labels — 4 fixed presets)](https://uwdigi.atlassian.net/browse/OGC-761)
- [OGC-759 (v2.5 v2 epic)](https://uwdigi.atlassian.net/browse/OGC-759)
- [OGC-746 (Test Editor scaffold)](https://uwdigi.atlassian.net/browse/OGC-746)
- [OGC-358 (new UI Label & Store step)](https://uwdigi.atlassian.net/browse/OGC-358)
- [Test Catalog Management v2.5 — v1 + v2 Delivery Plan](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/1313865740/Test+Catalog+Management+v2.5+v1+v2+Delivery+Plan)
- Mockup: `barcode-labels-v2.jsx`
