# FRS — Reporting Ranges by Method

**Feature:** Per-method reporting ranges for Test Catalog, anchored on an explicit allowed-methods model per test and a master Methods admin page.
**Status:** Draft v2 — promoted from a stub; now a full FRS covering allowed methods per test, Methods admin page, per-method range editor, and CSV import extension.
**Owner:** Casey (caseyi@uw.edu)
**Date:** 2026-04-23
**Related patterns:** P-01 (Admin Table), P-02 (Inline row-expand edit), P-03 (Create modal), P-04 (Confirm delete), P-05 (Form validation), P-06 (Empty state), P-13 (Permission gate)
**Permission:** `TEST_CATALOG_MANAGE` (existing scope — no new permission keys)

---

## 1. Overview

OpenELIS Global has a single reporting range attached to each Test. In practice, the same test is often run on more than one method — Manual vs. an analyzer, Method A vs. Method B — and each method has its own reliable measurement range. A single per-test range forces the lab to either pick the widest method (weakening the "result outside of reporting range, please verify" prompt) or not configure the warning at all.

This feature introduces **methods as a first-class concept** on a test, and moves reporting ranges from Test-scoped to **Test × Method**-scoped. It does three things:

1. Adds a master **Methods** admin page (under Test Catalog) that catalogs all methods in the lab, whether added by the admin, seeded as system defaults (Manual), or registered by an analyzer plugin (e.g. GeneXpert).
2. Adds a **Methods section** and a **per-method reporting range** grid to each test's admin row-expand — both editable in the same row-expand session.
3. Extends the result-entry range lookup to use the method actually associated with the result, so the warning reflects the method used.

There is **no new fallback layer**. If a method has no reporting range configured, the test's existing reporting range (as it works today) applies unchanged.

## 2. User Stories

- As a **lab manager**, I want to configure different reporting ranges per method so the out-of-range warning reflects each method's legitimate measurement range.
- As a **bench tech**, I want the warning to reflect the method I actually ran so I'm not told to re-check valid results just because another method has a wider range.
- As a **lab admin**, I want a master Methods page so I can see every method the lab has on file — including the ones a plugin registered when an analyzer was configured — and manage the ones I created.
- As a **lab admin**, I want analyzer-registered methods to appear automatically on any test mapped to that analyzer so I don't have to hand-maintain two lists.
- As a **lab admin**, I want to add a new method to a test from the test's own admin row without bouncing to a different page.
- As a **QA lead**, I want the reporting range to be traceable to the method at the time of result entry so audit reviews show the correct range was applied.

## 3. Functional Requirements

### 3.1 Data model

```
method                                            -- master catalog
  id                (pk)
  code              VARCHAR UNIQUE NOT NULL      -- immutable after create
  name              VARCHAR NOT NULL
  source            VARCHAR NOT NULL              -- enum: 'MANUAL' | 'USER' | 'PLUGIN'
  plugin_id         VARCHAR NULL                  -- set only when source = 'PLUGIN'
  analyzer_id       FK NULL                       -- set only when source = 'PLUGIN', points to
                                                 --   the analyzer whose plugin registered the method
  active            BOOLEAN NOT NULL DEFAULT TRUE
  created_on / updated_on

test_method                                       -- explicit allowed-methods list per test
  id                (pk)
  test_id           (fk → test)
  method_id         (fk → method)
  source            VARCHAR NOT NULL              -- enum: 'MANUAL_DEFAULT' | 'USER_ADDED' | 'ANALYZER_AUTO'
  analyzer_mapping_id  FK NULL                    -- set only when source = 'ANALYZER_AUTO'
                                                 -- references test_analyzer_mapping so
                                                 -- un-mapping the analyzer cascades row removal
  created_on / updated_on
  UNIQUE (test_id, method_id)

test_method_range
  id                (pk)
  test_id           (fk → test)
  method_id         (fk → method)
  low_value         NUMERIC NULL
  high_value        NUMERIC NULL
  units             VARCHAR NULL                  -- inherits test's reporting units by default
  created_on / updated_on
  UNIQUE (test_id, method_id)
```

Notes:
- `method.source = 'MANUAL'` seeds a single **"Manual"** row at migration time. Every test gets a `test_method` row linking to this Manual method at creation time (source `MANUAL_DEFAULT`). Manual cannot be removed from a test.
- `method.source = 'PLUGIN'` rows are written by the analyzer plugin's registration hook when an analyzer is configured (see §3.6). Plugin rows are **read-only** on the Methods admin page.
- `test_method.source = 'ANALYZER_AUTO'` rows are created whenever a test is mapped to an analyzer whose plugin has registered one or more methods. These rows are **read-only** on the Test row-expand — to remove them, un-map the analyzer.
- No `ON DELETE CASCADE` from `method` → anything else; `method.active = false` is used instead so history is preserved.

### 3.2 Methods admin page *(Sub-2)*

Route: `/admin/test-catalog/methods`. SideNav: a new submenu item **"Methods"** under **Test Catalog** (v2-3 IA).

| # | Requirement |
|---|---|
| FR-1 | P-01 Admin Table with columns: **Code · Name · Source · Used by N tests · Status**. Sortable on Code, Name, Source, Used by, Status. |
| FR-2 | Source is rendered as a Carbon `Tag` — `Manual` (gray), `User` (cyan), `<Analyzer name>` (warm) — based on `method.source` and (for PLUGIN) the registering analyzer's name. |
| FR-3 | Toolbar primary action **"Add method"** (P-03 Create modal): fields Code (2–16 chars `[A-Z0-9-]+`, immutable after create), Name (1–120 chars), Active (Toggle, default ON). The created method has `source = 'USER'`. |
| FR-4 | P-02 Inline row-expand edit on USER rows. On MANUAL and PLUGIN rows, the row-expand is **read-only** — shows the row, explains the source (`"Registered by GeneXpert analyzer plugin"` or `"System-provided default"`), and displays which tests currently use the method. No editable fields. |
| FR-5 | Delete (P-04 Confirm) is offered **only** on USER rows with `Used by = 0`. MANUAL and PLUGIN rows are never deletable. USER rows with usage show the delete button disabled with a tooltip identifying the blocking tests (`"Used by N tests — remove from each test first"`). |
| FR-6 | Filter bar: filter by Source (All / Manual / User / Plugin — with a sub-select for specific plugin/analyzer). Search by code/name substring. Empty state P-06. |
| FR-7 | Writes gated behind `TEST_CATALOG_MANAGE` (P-13). Users without the scope see the table read-only. |

### 3.3 Test row-expand — Methods section *(Sub-3)*

Location: inside the existing Test admin row-expand (Test Catalog → Test Management → row expand).

| # | Requirement |
|---|---|
| FR-8 | New section **"Methods"** sits above the existing reporting range controls. A Carbon `DataTable` with columns: **Method · Source · Added on · actions**. Manual and analyzer-auto rows show their source Tag and no delete affordance. User-added rows show a Delete button (P-04 Confirm). |
| FR-9 | Toolbar inside the Methods section — a single primary button **"Add method"** opens a modal with two stacked options: (a) **Pick existing** (a Carbon `ComboBox` filtered to methods not already on this test, excluding analyzer-scoped methods whose analyzer isn't mapped to this test); (b) **Create new** — inline form for Code / Name, creates a method with `source = 'USER'` and adds it to this test as `source = 'USER_ADDED'` in one action. |
| FR-10 | Attempting to delete a row with `source = 'ANALYZER_AUTO'` is **blocked** with an inline banner: `"This method is provided by the [Analyzer name] analyzer mapping. To remove it, un-map the analyzer from this test."` (FR from directive answer C.ii) |
| FR-11 | Attempting to delete a row with `source = 'MANUAL_DEFAULT'` is **blocked** with an inline banner: `"Manual is always available and cannot be removed."` |
| FR-12 | When an analyzer mapping is added or removed from a test (elsewhere in Test admin), the Methods section reflects the change on next render: analyzer methods appear / disappear accordingly, along with their `test_method_range` rows (range rows follow the allowed-methods row lifecycle — removing an analyzer removes its range entries for this test). |

### 3.4 Test row-expand — Reporting ranges section *(Sub-3)*

| # | Requirement |
|---|---|
| FR-13 | A **Reporting ranges** table appears beneath the Methods section, with one row per method listed in the Methods section. Columns: **Method · Low · High · Units · actions**. Row order: same as the Methods section (Manual first, then analyzer-auto, then user-added by `created_on`). |
| FR-14 | Low, High, Units are editable inline on every row regardless of method source — even the row for an analyzer-auto method (since the range is lab policy, not plugin data). Units defaults to the test's reporting units on creation but can be overridden. |
| FR-15 | Per-row action: **"Apply this range to all methods"** — a button on each row that copies that row's Low / High / Units to every other row in the table on this test. Prompts for confirmation if any destination rows already have non-empty values (P-04): `"Overwrite [N] existing range(s)?"`. |
| FR-16 | Validation (P-05): Low ≤ High when both provided. Empty low and empty high are both allowed and mean "not configured" for that method. Mixed empties (one filled, one not) trigger an inline validation error on the row. |
| FR-17 | Empty state: if the Methods section has only Manual (no analyzer or user methods added), the Reporting ranges table still shows one row (for Manual) and is functional. |
| FR-18 | Writes gated behind `TEST_CATALOG_MANAGE` (P-13). |

### 3.5 Result-entry method-aware lookup *(Sub-4)*

| # | Requirement |
|---|---|
| FR-19 | At result entry or analyzer import, resolve the active **method** for the result: (a) the tech's method selection in result entry; (b) the analyzer-provided method from the import payload. |
| FR-20 | Look up `test_method_range` by (test_id, method_id). If a row exists with a non-null low and/or high, use those values for the out-of-range warning evaluation. |
| FR-21 | If no `test_method_range` row exists, or the row has both low and high null, the test's existing reporting range applies unchanged — the same range that would apply today for a test with no method-specific ranges configured. **No new fallback logic is introduced.** |
| FR-22 | Out-of-range warning copy, firing semantics, and placement are unchanged. Only the range value the lookup returns is affected. |
| FR-23 | Audit log entries for a result that triggered a range warning identify which (test, method, range source) was used (e.g. `"method range: GeneXpert / 5-40"`, or `"test-level range: 5-50"`). |

### 3.6 Plugin registration hook *(Sub-1)*

| # | Requirement |
|---|---|
| FR-24 | When an analyzer plugin is enabled (analyzer configured for the instance), the analyzer's init hook calls a `MethodRegistry.register(analyzer, methods[])` service that upserts one `method` row per declared method, with `source = 'PLUGIN'`, `plugin_id = <plugin id>`, `analyzer_id = <analyzer id>`. |
| FR-25 | Re-registration (same analyzer upgraded or re-initialized) updates name/active but never changes `code`. If a plugin removes a method in a new release, the `method` row is set to `active = false`, **not** deleted, to preserve history on existing tests. |
| FR-26 | When an analyzer is mapped to a test (existing `test_analyzer_mapping` flow), the mapping service must insert one `test_method` row per `PLUGIN`-sourced method registered by that analyzer, with `source = 'ANALYZER_AUTO'`, `analyzer_mapping_id = <mapping id>`. |
| FR-27 | When an analyzer is un-mapped from a test, cascade-remove the `ANALYZER_AUTO` rows with that `analyzer_mapping_id`. The corresponding `test_method_range` rows are removed in the same transaction. |

### 3.7 CSV import extension

| # | Requirement |
|---|---|
| FR-28 | The existing Test Catalog CSV import must be extended to carry methods assigned to each test and reporting ranges per method. Exact column schema is **deferred to build** (owner: Reagan — existing maintainer of the CSV importer; confirm with him during Sub-1 kickoff). |
| FR-29 | Plugin-sourced methods in the CSV are accepted as an explicit assignment only if the referenced analyzer is currently mapped to the test; otherwise the row is rejected with a clear error. USER methods referenced by an unknown code are auto-created by the importer only if an optional `auto_create_methods` flag is passed; otherwise rejected. |
| FR-30 | Export mirrors import. |

## 4. Out of Scope

- Clinical reference ranges (normal / abnormal / critical) — reporting range only here.
- Age- or sex-stratified reporting ranges — method dimension only.
- Dilution workflow changes downstream of the out-of-range warning.
- Migration of existing single-per-test reporting ranges into per-method ranges — labs continue to get test-level behavior until they configure per-method rows.
- A Methods reporting dashboard or usage analytics.
- Per-method units differing from the test's reporting units across the board (units are per `test_method_range` row; no enforcement that they all match, only UI defaulting to the test's reporting units).

## 5. Edge Cases

| Scenario | Expected behavior |
|---|---|
| Lab deletes a User method with `Used by = 0` | Hard delete; row removed. FR-5. |
| Lab tries to delete a User method with `Used by > 0` | Delete button disabled; tooltip names the blocking tests. |
| Analyzer plugin upgrade removes a method | Method row set `active = false`, not deleted. Existing tests keep their row; range still applies; Methods admin page tags it as Inactive. FR-25. |
| Tech selects a method at result entry that is no longer on the test's allowed list (stale UI / race) | Range lookup falls through to the test-level range (FR-21); warning fires against that. Treated as a data drift and logged. |
| Un-mapping an analyzer from a test | All `ANALYZER_AUTO` rows for that analyzer cascade-removed; their `test_method_range` rows removed. Manual + user-added methods unchanged. |
| Test has two analyzers mapped, each registering a method of the same code | Second registration is rejected by the `method.code` uniqueness constraint at the catalog layer; plugin authors must namespace codes. Flagged as an implementation note for plugin development. |
| User picks "Apply this range to all methods" on a row that has only empty values | Button is disabled until at least one of Low/High is set on the source row. |

## 6. Acceptance Criteria

1. [FR-1, FR-3, FR-7] **Given** a user with `TEST_CATALOG_MANAGE`, **when** they navigate to `Test Catalog → Methods`, **then** the Admin Table renders with Manual (Source: Manual), all plugin-registered methods (Source: analyzer name, read-only), and any user-defined methods (Source: User, editable). The "Add method" button opens the P-03 modal.
2. [FR-4, FR-5] **Given** a PLUGIN-sourced method, **when** the user expands the row, **then** the expand panel is read-only and delete is not offered. Given a USER method with `Used by = 0`, **when** the user opens the P-04 Confirm delete modal and confirms, **then** the row is removed.
3. [FR-8, FR-9] **Given** a test with Manual plus two analyzer-registered methods, **when** the user opens the Test row-expand and scrolls to the Methods section, **then** all three rows are visible with the right source tags. Clicking "Add method" → "Pick existing" surfaces only methods not already on this test and not plugin-scoped to an un-mapped analyzer.
4. [FR-9 — Create new] **Given** the Add method modal, **when** the user picks "Create new", enters a code and name, and saves, **then** a method is created with `source = 'USER'` and a `test_method` row is created for this test with `source = 'USER_ADDED'` — one action.
5. [FR-10] **Given** a test with an analyzer-auto method, **when** the user attempts to remove it from the Methods section, **then** the UI shows the blocking banner instead of deleting.
6. [FR-13, FR-14] **Given** a test with three methods, **when** the user opens the Reporting ranges section, **then** three rows are editable with Low / High / Units per row.
7. [FR-15] **Given** three methods on a test, two with empty ranges and one filled (Low 3, High 40, Units mg/dL), **when** the user clicks "Apply this range to all methods" on the filled row, **then** a confirmation modal appears (or does not, if the other rows are empty), and on confirm all three rows carry the same values.
8. [FR-16] **Given** a row with Low > High, **when** the user attempts to save, **then** a P-05 inline validation error appears and save is blocked.
9. [FR-19, FR-20, FR-21] **Given** a test with methods M-A (range 5–40) and M-B (no range configured), **when** a result against M-A of value 50 is entered, **then** the out-of-range warning fires. Given a result against M-B of value 50, **then** the warning fires or not depending on the test's **existing** test-level range (no new fallback logic was introduced).
10. [FR-24, FR-26] **Given** the GeneXpert plugin is enabled and an analyzer is mapped to Test-X, **when** the mapping is saved, **then** every plugin-registered method for that analyzer has a `test_method` row on Test-X with `source = 'ANALYZER_AUTO'` and the Methods section shows them.
11. [FR-27] **Given** the analyzer from AC-10 is un-mapped from Test-X, **when** the un-map is saved, **then** all ANALYZER_AUTO rows and their `test_method_range` rows for that mapping are removed.
12. [FR-28] **Given** the Test Catalog CSV importer, **when** a file with per-test methods and ranges is uploaded, **then** the importer creates `test_method` and `test_method_range` rows consistent with FR-29. (Schema finalized during build.)

## 7. Permissions

All writes in §3.2–§3.4 and §3.7 require `TEST_CATALOG_MANAGE`. No new permission key is introduced. Plugin-driven writes in §3.6 are triggered by the analyzer admin flow (same scope) and the plugin lifecycle (system-level).

## 8. Dependencies

- Existing `test_analyzer_mapping` (Analyzer Test Name admin surface) — drives ANALYZER_AUTO rows.
- Existing analyzer plugin framework — must expose an init-time hook where `MethodRegistry.register(...)` can be called.
- Existing Test Catalog CSV importer — owner: Reagan. Extension scope confirmed during Sub-1 kickoff.

## 9. Localization Keys

| Key | English |
|---|---|
| `admin.testCatalog.nav.methods` | "Methods" |
| `admin.testCatalog.methods.heading` | "Methods" |
| `admin.testCatalog.methods.desc` | "Master catalog of methods used by this lab. Plugin-registered methods are read-only; create and manage your own methods here." |
| `admin.testCatalog.methods.addCta` | "Add method" |
| `admin.testCatalog.methods.col.code` | "Code" |
| `admin.testCatalog.methods.col.name` | "Name" |
| `admin.testCatalog.methods.col.source` | "Source" |
| `admin.testCatalog.methods.col.usedBy` | "Used by" |
| `admin.testCatalog.methods.col.status` | "Status" |
| `admin.testCatalog.methods.source.manual` | "Manual" |
| `admin.testCatalog.methods.source.user` | "User" |
| `admin.testCatalog.methods.source.plugin` | "Plugin: [analyzer]" |
| `admin.testCatalog.methods.readOnly.plugin` | "Registered by the [analyzer] analyzer plugin." |
| `admin.testCatalog.methods.readOnly.manual` | "System-provided default — always available on every test." |
| `admin.testCatalog.methods.deleteBlockedUsage` | "Used by [N] tests — remove from each test first." |
| `admin.testCatalog.test.methods.heading` | "Methods" |
| `admin.testCatalog.test.methods.addCta` | "Add method" |
| `admin.testCatalog.test.methods.pickExisting` | "Pick existing method" |
| `admin.testCatalog.test.methods.createNew` | "Create new method" |
| `admin.testCatalog.test.methods.removeBlockedAnalyzer` | "This method is provided by the [analyzer] mapping. To remove it, un-map the analyzer from this test." |
| `admin.testCatalog.test.methods.removeBlockedManual` | "Manual is always available and cannot be removed." |
| `admin.testCatalog.test.ranges.heading` | "Reporting ranges by method" |
| `admin.testCatalog.test.ranges.col.method` | "Method" |
| `admin.testCatalog.test.ranges.col.low` | "Low" |
| `admin.testCatalog.test.ranges.col.high` | "High" |
| `admin.testCatalog.test.ranges.col.units` | "Units" |
| `admin.testCatalog.test.ranges.applyToAll` | "Apply this range to all methods" |
| `admin.testCatalog.test.ranges.applyConfirmOverwrite` | "Overwrite [N] existing range(s)?" |
| `admin.testCatalog.test.ranges.validateRange` | "Low must be less than or equal to High." |
| `admin.testCatalog.test.ranges.validateMixedEmpty` | "Both Low and High must be filled, or both left empty." |

## 10. Traceability

| FR | Sub-issue | Delivers |
|---|---|---|
| FR-24 – FR-27 | Sub-1 (data + API + plugin hook) | Data model, endpoints, plugin init hook, analyzer-mapping cascade |
| FR-28 – FR-30 | Sub-1 (CSV extension — schema deferred) | Import/export columns |
| FR-1 – FR-7 | Sub-2 (Methods admin page) | Master catalog UI |
| FR-8 – FR-18 | Sub-3 (Test row-expand) | Methods section + per-method ranges + Apply-to-all |
| FR-19 – FR-23 | Sub-4 (result-entry lookup) | Method-aware range resolution at validation time |

## 11. Open Questions

- [ ] **CSV schema** — column shape for per-test methods and per-method ranges. Owner: Reagan. Resolve at Sub-1 kickoff.
- [ ] **Plugin code namespacing guidance** — can we require plugins to prefix their `method.code` with the analyzer short-code (e.g. `GXPT-XPERT-MTB`) to avoid catalog collisions across plugins? Recommended but not enforced in Sub-1 schema.
- [ ] **Existing methods mockup** — `designs/admin-config/methods` (listed in the admin menu redesign roadmap as "existing") should be pulled up and reconciled with this FRS before Sub-2 JSX lands. If it's substantially different, Sub-2 may need to replace or revise that mockup.
