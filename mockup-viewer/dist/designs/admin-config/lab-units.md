# Lab Units Management — Approach Update

**Feature slug:** `lab-units-management`
**Target Release:** OpenELIS Global v3.2
**Version:** 2.0 (2026-07-15) — rebased on the real data model (`TEST_SECTION`); aligned to the Test Catalog Management shell
**Jira:** OGC-189 (this story) · OGC-290 · OGC-361 (domain — see Build Reality) · OGC-949 (umbrella) · siblings: OGC-224 (Panels), OGC-296 (Sample Types)

> **Why v2.0:** the previous `lab-units.md` was written without inspecting the schema. It
> targets a nonexistent `lab_unit` table (the real entity is **`TEST_SECTION`**), requires a
> "Code/Abbreviation" column that doesn't exist, marks Description optional (it's NOT NULL),
> proposes adding `display_order`/`description_key` columns that duplicate existing
> `sort_order`/localization, and invents Programs/Projects/Workflows junctions against
> speculative tables. It also specified bulk assign, import/export, and a 3-option
> deactivation cascade — all out of scope here. This version specifies only what the real
> model supports, in the same shell pattern as Panels and Sample Types.

---

## Lab Context

### Current State
A **lab unit** (historically "test section") is the bench or department that performs a
test — Chemistry, Hematology, Microbiology, Serology. Every test belongs to exactly one lab
unit, which drives workplans, result-entry grouping, and reporting rollups. Lab units are
configured today on a legacy Master Lists page, disconnected from the tests they organize.

### Pain
The list is flat and unmanaged: no view of which tests a unit carries, renames risk breaking
what technologists see mid-shift, and there's no home for lab units beside the tests,
panels, and sample types they relate to. The word "test section" survives in the UI even
though everyone says "lab unit".

### What Changes
Lab units join the **Test Catalog Management** shell as a fourth context beside Tests,
Panels, and Sample Types — same list pattern, same editor shell, same deactivate-only
lifecycle. Each unit shows its basics and, read-only, the tests assigned to it (assignment
itself stays on the test, where it already lives).

---

## The real data model (verified in source — full reference: `test-catalog-data-model.md`)

**Entity:** `test.valueholder.TestSection` (lives in the `test` package), table
**`TEST_SECTION`**: `NAME` varchar(20) · `DESCRIPTION` varchar(60) **NOT NULL** ·
`display_key` varchar(60) · `IS_EXTERNAL` char(1) · `is_active` · `ORG_ID` FK →
Organization · `name_localization_id` FK · **`PARENT_TEST_SECTION` self-FK (hierarchy)** ·
`sort_order` integer. Tests link via `test.test_section_id`.

- **No code column exists** — the v1 spec's required "Code/Abbreviation" is dropped.
- **No domain column on develop** — despite OGC-361's ticket status, a repo-wide search
  finds no trace (D-025: Done ≠ shipped). See Build Reality below.
- **Hierarchy exists in the schema, not in this UI (decision):** `PARENT_TEST_SECTION` is
  real but no shipped surface consumes it visibly. v1 renders lab units as a **flat list**,
  documents the column, and neither edits nor invents hierarchy. If a real nesting need
  emerges, it's its own design pass.
- `ORG_ID` and `IS_EXTERNAL` are shown read-only where set (integration/reference facts,
  not routine admin edits).

## Surface & IA

**Lab Units** is a peer context under `Test Catalog Management` (Tests / Panels / Sample
Types / **Lab Units**). List route `/admin/TestCatalogList?entity=labunits`; editor
`/MasterListsPage/TestCatalogEditor/labUnit/<id>/<section>`; breadcrumb
`Home / Admin Management / Test Catalog Management / Lab Units / <name>`. Replaces the
legacy Test Section Master Lists page. Terminology is **"Lab Unit"** everywhere; "test
section" never appears in UI copy.

## Lab Units list

Columns: **Name** · **Description** · **Domain** (tag — once built, see Build Reality) ·
**Tests** (count) · **Status** · **Actions**. Filters: search, Domain, Status.
"**Add Lab Unit**" opens a blank record in the editor shell (inline, not a modal).

## Editor sections (SideNav submenus — same shell, no tabs)

### Basic Info
| Field | Type | Required | Notes |
|---|---|---|---|
| **Name** | Text | Yes | varchar(20) — enforce length in UI; localized display via existing localization FK |
| **Description** | Text | **Yes** | varchar(60) NOT NULL (v1 spec wrongly said optional) |
| **Domain** | Radio | Yes (once built) | Exactly one of Clinical / Environmental / Vector — Dependency 2; Clinical primary at launch |
| **External** | Read-only tag | — | Shows `IS_EXTERNAL` when set; not editable here |
| **Organization** | Read-only | — | Shows linked org when set |
| **Active** | Toggle | Yes | **On deactivate with N active tests assigned:** warn — "{n} active tests are assigned to this lab unit; they keep working but won't appear under it in workplans until it's reactivated or they're reassigned." No cascade, reversible. Reassignment happens per test (Basic Info → Lab Unit), not in bulk here |

### Associated Tests — read-only
Lists the tests whose `test_section_id` points here (name, code, sample type, status), each
linking to **Open in Test Catalog**. Assignment is a *test* attribute edited in the test's
Basic Info — not duplicated here (the same view-don't-write pattern as Sample Types'
Associated Tests).

### Display Order
Position in lab-unit ordering (`sort_order`) — same all-rows-with-this-one-highlighted
pattern as Sample Types.

*(No Terminology section — lab units have no coded-terminology need today. No
Programs/Projects/Workflows tabs — those junctions don't exist; out of scope.)*

## Build Reality — Domain (OGC-361)

The handoff record says lab-unit domain is "Done (OGC-361)". **Source contradicts this:**
no `test_section` migration exists on develop and OGC-361 appears nowhere in the repo.
Until reconciled, this FRS treats domain as **Dependency 2 (unbuilt)** — same declared-
migration pattern as Panels (column + backfill to CLINICAL, mechanism dev's call). The
Domain field ships with the dependency, not before. **Action for Casey:** reconcile the
Jira status vs the branch before dev picks this up.

## Access
Existing **Test Catalog Manager / Admin** capability, same as the rest of the shell.

## Dependencies (net-new)
1. **Lab Units context + editor** in the shell (list + `/rest/test-catalog/lab-units`).
   *Backend + frontend.*
2. **Domain on TEST_SECTION** — single required Clinical/Environmental/Vector, backfill
   CLINICAL (OGC-936 pattern). Mechanism dev's call; reconcile OGC-361 first. *Backend.*

## Out of scope
- Hierarchy editing (`PARENT_TEST_SECTION` documented, untouched).
- Bulk test reassignment, import/export, deactivation cascade (v1 spec's versions rejected).
- Programs / Projects / Workflows assignment tabs (junctions don't exist).
- A code/abbreviation field (no column; not invented).

## Localization (new keys)
| Key | English |
|---|---|
| `label.testCatalog.entity.labUnits` | Lab Units |
| `label.labUnit.name` | Name |
| `label.labUnit.description` | Description |
| `tag.labUnit.external` | External |
| `warning.labUnit.deactivateInUse` | {n} active tests are assigned to this lab unit; they keep working but won't appear under it in workplans until it's reactivated or they're reassigned. |
| `note.labUnit.associatedTests.viewOnly` | View only — a test's lab unit is set on the test (Basic Info → Lab Unit). |
| `link.labUnit.associatedTests.openTest` | Open in Test Catalog |

Missing keys fall back to English.
