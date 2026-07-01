# Test Catalog Editor — Completion & Correction FRS

**Feature slug:** `test-catalog-editor-completion`
**Author:** Casey Iiams-Hauser
**Status:** Draft for review
**Self-contained:** This document stands alone. It describes the current built behavior of the Test Catalog editor and the target behavior in full, including the verified analyzer/order import model. A developer (or Claude Code) can implement from this document without any other spec.

---

## Lab Context

### Current State

A clinical laboratory offers a menu of tests — Hemoglobin, Glucose, an HIV rapid test, and so on. Each test needs configuration before a technician can order it or record a result: which specimen it runs on (whole blood, serum, urine), what the result looks like (a number with units, a value from a list, or free text), what counts as a normal or dangerous value for a given age and sex, which analyzers can run it, and what standardized code it maps to. That code is a **LOINC** — Logical Observation Identifiers Names and Codes, an international coding system that lets systems agree that "this result means hemoglobin in whole blood."

OpenELIS deliberately keeps a **separate test record for each specimen type**. "Hemoglobin(Whole Blood)" and "Hemoglobin(Serum)" are two different tests. That is correct and intended: the two specimens can have different normal ranges and must have different LOINC codes (see the import model below). A lab administrator configures each of these in a web page called the Test Catalog editor: open the catalog list, click a test, and work through left-hand sections (Basic Info, Sample & Results, Methods, Ranges, Storage, Panels, Terminology, Analyzers, Display Order, and others). The editor already works for editing a test that already exists.

**How analyzer and electronic-order results find their test (verified in the source).** An analyzer bridge converts the instrument's own test code to a LOINC and sends that LOINC plus the lab number to OpenELIS. OpenELIS resolves the LOINC to a test with a single query — "the active test whose LOINC equals this code" — and, when more than one matches, silently takes the first. The same resolver is used for inbound electronic/FHIR orders. So **LOINC is the routing key, it is matched across the whole active catalog (not narrowed by specimen or accession), and a duplicate is resolved by first-match.**

### Pain

Four concrete problems block real work:

1. **You cannot create a test from the new catalog.** The unified catalog list only opens tests that already exist — it has no "New test" button. A create flow does exist, but only as a separate 7-step wizard in the *old* Test Management menu, disconnected from the unified editor — so there are two parallel worlds and no path from the catalog to "add a test."

2. **Updating shared settings means opening one editor per specimen.** Because hemoglobin is four separate tests (whole blood, serum, and so on), changing the normal range — which is usually identical across those specimens — means opening four editors and repeating the same edit four times. It's slow and it's easy to update three and forget the fourth, leaving the lab with inconsistent ranges for the same analyte.

3. **Nothing protects the LOINC codes that routing depends on.** Because results route by first-matching LOINC across the whole active catalog, two active tests that accidentally carry the same LOINC will silently send results to the wrong one, and a test with no LOINC can never receive analyzer or electronic-order results — but the editor gives no warning in either case.

4. **The section that defines a test's results shows everything at once.** Whatever the test's result type, the Sample & Results section displays every field — a numeric test still shows the select-list options table, a coded test still shows a fifty-item unit dropdown — and the "copy from another test" control renders the entire catalog inline. Even a one-result test reads as a wall of controls, with no guidance on what each field means or when to fill it.

Separately, when the application runs in a non-English language (French, Luganda, Bahasa Indonesia), test names and labels don't reliably show the translation for the language the user is working in — untranslated content and raw values leak through, and there's no consistent rule for what to show when a translation is missing.

### What Changes

An administrator can add a brand-new test from the catalog list and land in the editor to finish configuring it. Configuring what a test records is now guided: the admin picks how the result is captured — a number, a value from a list, or free text — and sees only the fields that apply, with plain-language help and a live preview of exactly what the technician will see. When several tests are the same analyte on different specimens, the administrator can **select them and edit their shared settings together in one screen** — set the normal range once and it lands on all of them — while each test keeps its own identity and its own LOINC. The editor warns when a test that should receive results has no LOINC, and flags any two active tests that share a LOINC before they can silently mis-route results. And a French, Luganda, or Bahasa user sees names and labels in their own language, falling back to English only where a translation hasn't been entered yet — never a wall of other languages to read past.

---

## Overview

This feature completes and corrects the existing Test Catalog editor. It adds the missing create-a-test workflow; adds a way to edit the shared configuration of related tests (the same analyte across specimen types) in one place without opening several editors; adds LOINC integrity guardrails that protect analyzer and electronic-order routing; restructures the Sample & Results section around the result type with progressive disclosure, plain-language guidance, and a live result-entry preview; fixes coverage-validation gap detection and the range-to-component association; and applies one universal rule for showing localized labels with English fallback.

It does not change the data model: tests stay separate per specimen type, each with its own LOINC. It does not introduce a new module — everything lands in the Test Catalog editor and the catalog list that already exist.

### Starting Point (verified against `testing.openelis-global.org`, v3.2.1.x, and the `DIGI-UW/OpenELIS-Global-2` source)

So the implementer knows the baseline:

- **Catalog list** at `/admin/TestCatalogList?page=1&pageSize=25`: filter bar (Domain, Status, AMR, Sample Type), search, pagination, click-to-open rows. **No add/create control; no row selection.**
- **Editor** at `/MasterListsPage/TestCatalogEditor/<testId>/<section>`. Sections present today: `basic-info`, `sample-results`, `methods`, `ranges`, `storage`, `panels`, `labels`, `terminology`, `reagents`, `analyzers`, `alerts`, `reflex-calc`, `localization`, `display-order`.
- **Create path:** the unified catalog list has **no create button**; the only create flow is the legacy `/MasterListsPage/TestAdd` → `TestStepForm` **7-step wizard** in the old Test Management menu (steps: test section + name/report name En/Fr → panels + unit of measure → result type + LOINC + flags → sample types + display order → select-list options [coded types] → numeric ranges/age/sig-digits [numeric] → review & save). It is disconnected from the unified editor and duplicates several of its sections.
- **`sample-results`**: fields for one-or-more result components (`comp-code-*`, `comp-label-*`, `comp-type-*` [Numeric / Select list (dictionary) / Free text — **only three of the platform's result types**], `comp-uom-*`, `comp-sigdig-*`, `comp-default-*`, `comp-order-*`), a Select-List Options table, an Interpretations table, and a "Copy configuration from test" control. The specimen type is part of the test's identity (in the name), not chosen here. The platform's full result-type set (verified in `TypeOfTestResultServiceImpl.ResultType` and the CSV import handler) is Numeric (N), Single-select/Dictionary (D), Multi-select (M), Cascading multi-select (C), Remark/free text (R), Titer (T) and Alpha (A) — the editor picker is missing M/C/T/A even though result entry, validation, referral and FHIR handle them.
- **`terminology`**: `terminology-source` (LOINC / SNOMED / CIEL / OCL), Code, `terminology-relationship`, Add mapping. One set of codes per test.
- **`ranges`**: round-trips age/sex bands with Male/Female coverage cards. **Coverage gap detection is unreliable** (narrowing an open-ended band to leave an uncovered span can still report "fully covered"), and a range added via the Add-range dialog can be saved **without its result-component association**.
- **`display-order`**: a native `<select>` listing every specimen type; selecting one lists that specimen's tests as `Position | Test` with drag + up/down.
- **`localization`**: `#localization-locale`, per-locale Test Name + Reporting Name, helper "Untranslated fields fall back to English." Storage is correct; runtime rendering in the active locale with fallback is not consistently applied across the editor.
- **Import resolver (source):** `TestService.getActiveTestsByLoinc(loinc)` → `From Test t where t.loinc = :loinc and t.isActive='Y'`; callers (`AnalyzerServiceImpl.autoCreateTestMappings`, `ElectronicOrdersController`, `RestElectronicOrdersController`, `StudyElectronicOrdersController`, `LabOrderSearchProvider`, `PatientDashBoardProvider`) take `tests.get(0)`. A test has one LOINC via `Test.getLoinc()`.

### Navigation & URL

No new routes except the create-test entry; the combined editor reuses the editor shell. All routes verified against the live app.

- **Catalog list:** `/admin/TestCatalogList` — gains a **New test** button and **row selection** with a batch action **Edit related tests together**.
- **Create form:** a Carbon `Modal` over the list (no separate route); on confirm, navigates to the new test's editor.
- **Combined editor:** `/MasterListsPage/TestCatalogEditor/group/<comma-separated-ids>/<section>` — the existing editor shell rendered over a selected set of tests (path segment is a stable, deep-linkable id list; the section sub-route matches the single-test editor's sections).
- **Single-test editor:** `/MasterListsPage/TestCatalogEditor/<testId>/<section>` — unchanged pattern; `ranges`, `terminology`, and `localization` behavior changes internally.
- **Breadcrumb:** `Home / Admin Management / Test Catalog / <Test Name or "N tests"> / <Section>` (SideNav label is "Admin", breadcrumb reads "Admin Management" — preserve this existing drift).

---

## User Stories

- As a **lab administrator**, I want to create a new test from scratch from the catalog list, so that I can build my lab's test menu without duplicating an unrelated test.
- As a **lab administrator**, I want to select the same analyte's specimen-type tests and edit their shared settings (like normal ranges) once, so that I don't have to open four editors and risk leaving them inconsistent.
- As a **lab administrator**, I want each test to keep its own LOINC even when I edit shared settings together, so that analyzer and electronic-order results keep routing to the right test.
- As a **lab administrator**, I want to be warned when a test has no LOINC or shares a LOINC with another active test, so that results don't silently fail to import or route to the wrong test.
- As a **French / Luganda / Bahasa-speaking user**, I want test names and labels in my own language with English shown only where no translation exists, so that I never read past languages I don't use.

---

## Functional Requirements

### Group A — Create a new test

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | The catalog list shows a **New test** button (Carbon `Button` with `Add` icon) at the **left of the filter row, before the Domain filter**, visible to users who can manage the catalog. | Placed with the filters (left of Domain) so it's the first control reached, not buried in the page header. |
| FR-2 | Clicking **New test** opens the **editor's Basic Info section blank, inline** — the same editor shell used for editing (left section nav shows `← All Tests / Editing: New test` with Basic Info active; header shows **Save** and **Cancel**). It is **not** a modal or a separate wizard. Basic Info captures: **Name** (required), **Reporting name** (required), **Code** (required, auto-suggested from name), **Lab Unit** (required — the grouping the shipped editor currently labels "Test section"; standardize on "Lab Unit"), **Sample type** (required, typeahead — one specimen per test), **Domain** (required radio), **AMR / Active / Orderable** toggles, and **Description**. Result type and everything else are configured in Sample & Results and the other sections afterward. | Matches the unified model: creating a test *is* editing a blank one. Reuses the shipped Basic Info layout; fields grounded in the live editor + the legacy `TestStepForm`. |
| FR-3 | On **Save**, the test is created in **Inactive** status and the editor stays open on it at `/MasterListsPage/TestCatalogEditor/<newId>/basic-info`, with a success `InlineNotification` "Test '<name>' created. Complete its configuration in the sections at left." The other section-nav entries become active for the now-persisted test. | New tests start Inactive so they aren't orderable until configured. |
| FR-4 | Test code uniqueness is enforced: an existing code shows a field-level error "A test with this code already exists" and does not create the test. | Carbon `TextInput` `invalid`/`invalidText`. |
| FR-5 | **Cancel** discards the unsaved new test and returns to the catalog list; nothing is created. | Editor header `Cancel`. |
| FR-38 | The unified catalog's **New test** flow **replaces the legacy create path** (`/MasterListsPage/TestAdd` → `TestStepForm` 7-step wizard). Tests are created from the catalog list and configured in the unified editor; the legacy wizard is retired so there is one create path, not two. | Removes the parallel create world; no configuration lives in two places. |
| FR-39 | The catalog list shows a **Sample type column**. It is filterable by sample type today but the column isn't displayed, so admins can't see which specimen a row is — essential given same-name sibling tests. Existing columns/tags stay: Name (with AMR, Coverage-incomplete, and No-LOINC tags), Code, Domain, Status. | Grounded on the shipped list (Name / Code / Domain / Status); adds the missing Sample type column. |
| FR-40 | The list filters (Domain, Status, AMR, Sample type) move into a **collapsible Filters panel** with an active-filter count; the **Sample type filter is a typeahead** `ComboBox` (long list), the others stay simple dropdowns. Search stays inline and debounced; row selection (FR-6) and **New test** (FR-1) sit in the table toolbar. | Grounded on the shipped filter row; tidies the always-on four-dropdown strip and applies the large-catalog rule to Sample type. |

### Group B — Sample & Results (single-test result capture & guidance)

**Goal:** let an administrator make a test enterable and interpretable — correctly, and in seconds for the common one-result case — without needing LIMS knowledge. The **Result type** is the pivotal choice and drives what the section shows; on-screen guidance and a live preview replace tribal knowledge. This layout is used in both the single-test editor and the combined editor's Sample & Results section (Group C).

| ID | Requirement | Notes |
|---|---|---|
| FR-27 | The section opens with a one-line purpose ("Define what a technician records for this test and how results are interpreted") and marks every field Required or Optional. | Orientation for occasional admins. |
| FR-28 | **Result type is chosen first.** Three common types are shown as primary choices — **Numeric**, **Single-select list (dictionary)**, **Free text** — each with a one-line description and example. Four specialised / legacy types — **Multi-select list**, **Cascading multi-select**, **Titer** (a dilution ratio like 1:10, 1:20 — common in serology), **Alpha** (validated alphanumeric text) — sit behind an **"Advanced / legacy types"** disclosure so they remain available (and existing tests keep working, FR-37) without cluttering the common path. The choice drives which fields display (progressive disclosure); irrelevant fields are hidden, not merely ignored. | Root fix for "everything shows at once." The current editor exposes only Numeric / Single-select / Free text; Multi-select (`M`), Cascading (`C`), Titer (`T`) and Alpha (`A`) are supported by the platform (result entry, validation, referral, FHIR) but missing from the picker — this restores them under Advanced without featuring the rare ones. |
| FR-29 | **Numeric** shows only: Label, Unit of measure (typeahead `ComboBox` + inline "＋ Add new unit…"), Significant digits (with a live example, e.g. "12.3"), Default result (optional), Allow multiple readings (helper: "for tests measured more than once"). A helper links out: "Normal & critical ranges are set in the Ranges section →". | Select-list options and unit/sig-digits never appear for other types. |
| FR-30 | **Single-select and Multi-select list (dictionary)** share the same options editor (Value, Normal flag, Sort order, Actions, Add option); units and significant digits are hidden. **Single-select** adds a single Default result chosen from the options. **Multi-select** lets the technician pick one or more values and specifies **no single reference value** (per the platform definition); its Default is optional and multi-valued. **Cascading multi-select** (advanced) groups the options and lets the technician select multiple groups — each option carries its parent group. | Restores multi-select/cascading, which the platform already handles at result entry, validation, referral and FHIR. |
| FR-31 | **Free text** shows only: Label and Default result (optional), with a note "No units, significant digits, or ranges apply to free-text results." | Minimal by nature. |
| FR-32 | **Interpretations (flagging rules)** are an optional, clearly-labeled subsection with a plain-language intro and a teaching empty state ("No flagging rules yet. Add one to auto-mark results like 'DETECTED' as positive."). The value field adapts to the result type (numeric input vs. select value). Applies to Numeric and Select list. | Reframes today's bare "Interpretations" table. |
| FR-33 | Unit of measure and **"Start from another test's setup"** (today's "Copy configuration from test") use a **typeahead `ComboBox`**, never a full static list; "Start from another test's setup" is a quiet secondary action at the top of the section, not an always-expanded catalog dropdown. | Drift fix: today both are native selects and the copy control renders the whole catalog inline. |
| FR-34 | The section states "Most tests record one result." A **single component renders as one flat block** (no accordion). **Add component** adds another; with **2+ components each becomes a Carbon `Accordion` panel** (header: label + code + result type), and Display order becomes relevant. Component reorder via drag handle and keyboard Arrow Up/Down. Inline guidance draws the distinction: **add a component** when the test measures several *different things* (e.g. a differential — neutrophils %, lymphocytes %…); use **Multi-select / Cascading** (under **Advanced / legacy types**) when *one* result is chosen from a list of values. | Single-component tests stay simple; multi-component stays readable; and admins don't confuse components (several fields) with multi-select (several values in one field). |
| FR-35 | A **live "Result entry preview"** panel renders the actual result-entry control(s) a technician will see for the current configuration — a number field with its unit, a single-select dropdown, a **multi-select control (one or more values)**, a cascading grouped selector, a titer field, or a text field — updating live as the admin edits. Read-only; nothing is saved from it. It **reuses the existing Results Entry control rendering**, not a reimplementation. | Strongest on-screen guidance: abstract config becomes concrete. Kept low-lift by reuse (see Dependencies). |
| FR-36 | All on-screen guidance (purpose line, per-field helper text with examples, teaching empty states, the Ranges cross-link) has i18n keys and follows the universal locale / English-fallback rule (Group F). | Guidance is localized like everything else. |
| FR-37 | The editor MUST expose every result type the platform supports and MUST **preserve a test's existing type** when editing — including **Titer** (values like 1:10, 1:20) and legacy **Alpha** (validated alphanumeric). It must never silently change or drop a type it doesn't offer in the picker. | A test already saved as `M`/`C`/`T`/`A` must remain editable without its type being corrupted or downgraded. |

### Group C — Edit related tests together (the shared-settings editor)

| ID | Requirement | Notes |
|---|---|---|
| FR-6 | The catalog list supports **row selection** (Carbon `TableSelectRow`). When 2+ rows are selected, a batch action **Edit related tests together** appears in the table toolbar. | The admin defines the "family" by selecting rows — no new grouping entity is stored. |
| FR-7 | To make sibling tests easy to find, the list search/filter already narrows by name and specimen; selecting an analyte's rows (e.g. all "Hemoglobin…" tests) is the intended path. Optionally, a single-test editor offers **Edit related tests…**, which opens the list pre-filtered to active tests sharing this test's name stem (text before the first parenthesis) with them pre-selected. | Convenience only; the stem match is a suggestion the admin confirms, not a stored relationship. |
| FR-8 | **Edit related tests together** opens the editor shell over the selected set at `/MasterListsPage/TestCatalogEditor/group/<ids>/<section>`, showing the **shared-configuration sections**: Sample & Results (result components, select-list options, interpretations), Methods, Ranges, and Sample Storage. | Same section layout as the single-test editor, applied to N tests. |
| FR-9 | For each shared field, when **all selected tests hold the same value**, the field shows that value once and is editable; saving writes it to every selected test's own records. | "Edit once, apply to all" — the core of the feature. |
| FR-10 | For each shared field where the **selected tests differ**, the field shows a "Differs across tests" state with a control to expand and see each test's current value, plus **Set all to…** to harmonize. Nothing is overwritten until the admin acts. | No silent clobbering of a test that legitimately differs. |
| FR-11 | Saving in the combined editor writes each shared section to **every selected test's own rows** (a per-test deep write, not a shared record). Ranges written this way MUST carry the correct result-component association per FR-19. | Preserves the separate-test data model. |
| FR-12 | **Identity and routing fields are per-test and are NOT editable as shared fields:** Test name, Test code, Specimen type, and **Terminology / LOINC**. The combined editor shows these read-only per test (a compact per-test list) so the admin can see them, with a link to open that single test to change them. | LOINC must never be harmonized across siblings — that would break routing (see Group C). |
| FR-13 | The combined editor header shows how many tests are being edited ("Editing 4 tests") and lists them; the admin can deselect a test from the set before saving. | Clear scope of a bulk write. |
| FR-14 | Display Order is **not** part of the combined editor (each specimen type has its own ordering list); it stays in the single-test editor. | Ordering is inherently per-specimen. |

### Group D — LOINC integrity (protects analyzer & order routing)

| ID | Requirement | Notes |
|---|---|---|
| FR-15 | In the Terminology section, if a test has **no LOINC** and is otherwise configured to receive results (Active, orderable), show an `InlineNotification` (warning): "This test has no LOINC. Analyzer and electronic-order results cannot be imported to it." | Grounded in the resolver: no LOINC → never matched by `getActiveTestsByLoinc`. |
| FR-16 | When saving a test's LOINC (or activating a test), the system checks whether **another active test already has the same LOINC**. If so, show a warning identifying the other test(s): "LOINC {code} is also used by {test name}. Incoming results for this code route to only one test (first match) — results may be sent to the wrong test." | Grounded: resolver returns a list and every caller takes `get(0)` — duplicates silently mis-route. |
| FR-17 | The duplicate-LOINC check runs across the **whole active catalog** (not scoped by specimen or accession), because the resolver is not scoped. The warning appears both on the Terminology section and in the combined editor's per-test LOINC list (FR-12). | Match the real resolution scope. |
| FR-18 | The duplicate-LOINC condition is a **warning, not a hard block** (a lab may knowingly stage a replacement test), but it MUST be visible and MUST be surfaced again on activation. Deactivating one of the colliding tests clears the warning. | Warn-and-proceed, consistent with no-hard-block patterns; deactivation (not deletion) resolves it. |

### Group E — Coverage validation & range correctness (Ranges)

| ID | Requirement | Notes |
|---|---|---|
| FR-19 | A range added or edited via the Add/Edit-range dialog MUST persist the **result component it constrains**, so per-component ranges resolve correctly at result entry. | Fixes a verified defect where added ranges saved without a component association. |
| FR-20 | Coverage validation MUST correctly detect gaps: when the union of a sex's (or "All") ranges leaves any age span within the reportable lifetime uncovered, the coverage card MUST show a **gap**, not "fully covered." Verified failing case that MUST be caught: a band changed from "15+ (open-ended)" to "15–30" leaves 30+ uncovered → must report a gap. | Fixes a verified defect. |
| FR-21 | Coverage is computed over **normalized age units** (all bands converted to a common unit, e.g. days) before union/gap analysis, treating an absent upper bound as open-ended to the top of the reportable lifetime. | Root cause: compare normalized bounds, not stored strings. |

### Group F — Localization at runtime (universal English fallback)

| ID | Requirement | Notes |
|---|---|---|
| FR-22 | Every user-visible test label rendered anywhere in the editor and catalog list (test name, reporting name, and any other localizable test-owned label) MUST render the value for the **user's active application locale**. | One rule, applied everywhere. |
| FR-23 | When no translation exists for the active locale for a field, the system MUST fall back to **English**. This is the single universal fallback rule — there is no chain through other locales. | Casey's rule: fallback is English, universally. |
| FR-24 | A user working in a non-English locale MUST NOT see other locales' translations inline anywhere except the Localization authoring section. They see their locale, or English if untranslated. | No leaking of unrelated languages into normal editing. |
| FR-25 | The **Localization authoring section** is the one place all locales are visible/editable: pick a locale, edit that locale's Test Name and Reporting Name; untranslated fields are marked ("Falls back to English") so gaps are visible. | Authoring is the deliberate exception to FR-24. |
| FR-26 | Where a field shows the English fallback because the active locale is untranslated, that is silent for end users (no clutter); the "untranslated" indicator appears only in the Localization authoring section. | Fallback invisible in normal use, visible only where you fix it. |

### Group G — Panels (test-side membership & position)

**Goal:** from a test, manage which panels it belongs to and where it sits in each — the test-side view of the panel↔test relationship. Managing panels themselves (creating, curating, ordering all their tests, panel-specific LOINC) lives in the separate **Panel Management** feature; this section is only the test-side.

| ID | Requirement | Notes |
|---|---|---|
| FR-41 | The Panels section lists the panels this test belongs to (columns Panel, Position, Actions) with an **Add to panel** typeahead `ComboBox` to add the test to another panel. | Grounded on the built section ("Manage which panels this test belongs to, and its position within each"); picker is typeahead per the large-catalog rule. |
| FR-42 | Each panel row shows the test's **actual position** within that panel (today the Position field renders **blank**) and lets the admin reposition **this test** via drag handle and keyboard Arrow Up/Down, with the panel's other tests shown for context. Position numbers update live. | Same test-centric pattern as the Ranges/Display-Order fix; closes the blank-Position gap. |
| FR-43 | **Create new panel** creates a panel **inline with just a Name** — code, Lab Units, sample types, description, LOINC, and other tests are all optional and configured later in Panel Management. On create, the panel is added to the picker and this test is assigned to it, with an `InlineNotification` linking to Panel Management for further setup. | Casey's call: a name-only inline create is the right workflow-level minimum; everything else is optional. |
| FR-44 | Removing a row (trash) removes **this test's membership** in that panel; it does **not** delete the panel. | Relationship removal, not a domain-record delete. Panels are deactivated in Panel Management, never hard-deleted (No-Hard-Delete). |
| FR-45 | This section and Panel Management write the same `panel_test (panel_id, test_id, display_order)` relationship — the Position here is the `display_order` Panel Management edits from the panel side. | One model, two views; keeps the surfaces consistent. |

---

## Information & Data

All items trace to data OpenELIS holds today **except** where flagged as a Dependency.

- **Test** — name, reporting name, code (unique), domain (Clinical / Environmental / Vector), status (Active / Inactive), one specimen type, **one LOINC** (`Test.getLoinc()`). *(existing)*
- **Result component** — code, label, result type, unit of measure (FK to unit master), significant digits, default result, display order, allow-multiple-readings, active; with child Select-list options (value, sort order, normal flag) and Interpretations (value match, interpretation, severity). *(existing)*
- **Range** — type (Normal / Valid / Critical / Reporting), sex (Male / Female / All), age-from, age-to, low, high, and the **result component it constrains**. *(range exists; the component association must be reliably written — FR-19)*
- **Terminology mapping** — source (LOINC / SNOMED / CIEL / OCL), code, relationship; keyed to the test. *(existing; LOINC integrity checks are the change)*
- **Specimen type (sample type)** — the lab's configured specimen types. *(existing master list)*
- **Test localization** — per-locale test name and reporting name, English as base. *(existing storage; runtime resolution rule is the change)*
- **Analyzer test mapping** — `AnalyzerTestMapping` links an analyzer's code to a test via LOINC; the LOINC→test resolver is `getActiveTestsByLoinc` (first-match). *(existing; read-only context for the integrity checks)*

State/lifecycle: a test is created **Inactive**, configured, then set **Active** to become orderable and importable. Tests are never hard-deleted — deactivate/reactivate only (No-Hard-Delete).

The "related tests" set in Group B is defined by the administrator's selection at edit time; it is **not** a stored entity (no new "test family" table).

---

## Access

Accessible via the existing **Test Catalog Manager** role (which already governs the Test Catalog editor and `/admin/TestCatalogList`).

- **Who can use it:** a Test Catalog Manager can open the catalog list, create tests, and open the single-test and combined editors.
- **Who can do what:** a Test Catalog Manager can create tests (FR-1–5), edit shared settings across selected tests (FR-6–14), edit LOINC/terminology per test and see the integrity warnings (FR-15–18), edit ranges (FR-19–21), and author localization (FR-22–26). A user without the role does not see **New test**, row selection, or the editor entry, and the editor routes return the standard no-permission state.

Access is described as capability, not a new permission key — no per-action keys are introduced (the app has no per-action permission model).

---

## Localization

New/changed visible strings. Existing editor strings keep their current keys. Naming: `[category].[feature].[identifier]`, feature = `testCatalog`.

| Key | English fallback | Context |
|---|---|---|
| `button.testCatalog.newTest` | New test | List toolbar (FR-1) |
| `title.testCatalog.createTest` | Create new test | Create modal (FR-2) |
| `label.testCatalog.testName` | Test name | Create modal / per-test list |
| `label.testCatalog.testCode` | Test code | Create modal / per-test list |
| `label.testCatalog.domain` | Domain | Create modal |
| `label.testCatalog.specimenType` | Specimen type | Create modal / per-test list |
| `error.testCatalog.codeExists` | A test with this code already exists | Uniqueness error (FR-4) |
| `notification.testCatalog.testCreated` | Test '{name}' created. Complete its configuration below. | Post-create (FR-3) |
| `button.testCatalog.editRelated` | Edit related tests together | List batch action (FR-6) |
| `button.testCatalog.editRelatedFromEditor` | Edit related tests… | Single-editor convenience (FR-7) |
| `label.testCatalog.editingNTests` | Editing {count} tests | Combined editor header (FR-13) |
| `state.testCatalog.differsAcrossTests` | Differs across tests | Shared field divergence (FR-10) |
| `button.testCatalog.setAllTo` | Set all to… | Harmonize control (FR-10) |
| `label.testCatalog.perTestIdentity` | Identity & LOINC (per test) | Combined editor per-test list (FR-12) |
| `helper.testCatalog.sampleResultsPurpose` | Define what a technician records for this test and how results are interpreted. | Section purpose (FR-27) |
| `label.testCatalog.resultType` | How is this result captured? | Result-type chooser (FR-28) |
| `desc.testCatalog.resultTypeNumeric` | Numeric — a measured number with a unit (e.g. 12.3 g/dL). | Result-type card (FR-28) |
| `desc.testCatalog.resultTypeSelect` | Single-select list — one value chosen from a fixed set (e.g. Detected / Not detected). | Result-type card (FR-28) |
| `desc.testCatalog.resultTypeMultiSelect` | Multi-select list — one or more values from a list; no reference value. | Result-type card (FR-28) |
| `desc.testCatalog.resultTypeCascading` | Cascading multi-select — grouped options; select multiple groups. | Result-type card (FR-28) |
| `desc.testCatalog.resultTypeTiter` | Titer — a dilution ratio such as 1:10 or 1:20 (common in serology). | Advanced type card (FR-28) |
| `desc.testCatalog.resultTypeAlpha` | Alpha — validated alphanumeric text (a code or short coded value). | Advanced type card (FR-28) |
| `label.testCatalog.advancedTypes` | Advanced / legacy types | Result-type disclosure (FR-28) |
| `helper.testCatalog.componentVsMulti` | Add a component when the test measures several different things (e.g. a differential). Use Multi-select or Cascading (under Advanced / legacy types) when one result is chosen from a list of values. | Components-vs-multi guidance (FR-34) |
| `desc.testCatalog.resultTypeText` | Free text — a typed comment or description. | Result-type card (FR-28) |
| `helper.testCatalog.sigDigitsExample` | Shown to the technician as {example}. | Significant-digits live example (FR-29) |
| `helper.testCatalog.allowMultiple` | For tests measured more than once (e.g. a repeated reading). | Allow-multiple helper (FR-29) |
| `link.testCatalog.rangesCrossLink` | Normal & critical ranges are set in the Ranges section → | Cross-link (FR-29) |
| `note.testCatalog.freeTextNoExtras` | No units, significant digits, or ranges apply to free-text results. | Free-text note (FR-31) |
| `empty.testCatalog.noInterpretations` | No flagging rules yet. Add one to auto-mark results like 'Detected' as positive. | Interpretations empty state (FR-32) |
| `button.testCatalog.startFromTest` | Start from another test's setup | Copy-config secondary action (FR-33) |
| `helper.testCatalog.mostTestsOneResult` | Most tests record one result. Add a component only if this test produces several values. | Multi-component helper (FR-34) |
| `heading.testCatalog.resultEntryPreview` | Result entry preview | Live preview panel (FR-35) |
| `helper.testCatalog.resultEntryPreview` | This is what a technician will see when entering this result. | Live preview helper (FR-35) |
| `warning.testCatalog.noLoinc` | This test has no LOINC. Analyzer and electronic-order results cannot be imported to it. | FR-15 |
| `warning.testCatalog.duplicateLoinc` | LOINC {code} is also used by {testName}. Incoming results for this code route to only one test (first match) — results may be sent to the wrong test. | FR-16/17 |
| `helper.testCatalog.coverageGap` | Coverage gap: {span} is not covered. | Ranges coverage (FR-20) |
| `hint.testCatalog.fallsBackToEnglish` | Falls back to English | Localization authoring marker (FR-25) |
| `label.testCatalog.panels.addToPanel` | Add to panel | Panels section picker (FR-41) |
| `label.testCatalog.panels.position` | Position | Panels table (FR-42) |
| `button.testCatalog.panels.createNew` | Create new panel | Inline create (FR-43) |
| `notification.testCatalog.panels.created` | Panel '{name}' created and this test added. Configure it in Panel Management → | Inline-create result (FR-43) |
| `confirm.testCatalog.panels.remove` | Remove this test from {panel}? | Remove membership (FR-44) |

All keys must exist in every supported locale's resource bundle; missing keys fall back to the English value above (consistent with FR-23).

---

## Dependencies

Named new data/capabilities this feature relies on that are not fully present today. These must be built as part of this work (or coordinated with backend) — they are not assumed to exist.

1. **Create-test endpoint.** An endpoint to create a minimal Inactive test from the FR-2 fields. *Backend.*
2. **Multi-test shared-write endpoint(s).** A way to write a shared section (ranges, result components + children, methods, storage) to a set of test IDs in one transaction, per-test (FR-11). *Backend.*
3. **Shared-value diffing.** Given a set of tests and a section, the combined editor needs to know which fields are common vs. divergent (FR-9/10). This can be computed client-side from per-test reads or provided by an endpoint; specify which during build. *Backend/frontend.*
4. **Range → result-component association written reliably** (FR-19). *Backend fix.*
5. **Coverage-validation gap algorithm** with normalized age units and correct gap/overlap detection (FR-20/21). *Logic fix.*
6. **Duplicate-active-LOINC lookup** — reuse `getActiveTestsByLoinc(loinc)` to detect collisions and, for a given test, exclude itself (FR-16/17). *Backend (resolver exists).*
7. **Runtime localized-label resolution with English fallback** applied across the editor and list, not only the Localization section (FR-22–26). *Backend/frontend service.*
8. **Editable Name / Code / Description in Basic Info.** The shipped Basic Info currently marks name/code/description editing as "a later milestone" (read-only today). Creating a test in-place (FR-2) requires these to be editable in Basic Info. *Frontend + backend.*
9. **Reusable Results Entry control rendering for the live preview** (FR-35). The preview must render the same numeric/select/free-text controls the technician sees at result entry; expose or reuse the existing Results Entry component(s) so the preview is not a separate reimplementation that could drift. Progressive disclosure (FR-28–31) and the typeahead pickers (FR-33) are frontend-only. *Frontend (reuse).*

No dependency on unbuilt upstreams outside this feature (Reagents linkage, EQA V2, configurable Label Presets, Critical Result Acknowledgment) — those sections are untouched here.

---

## Out of Scope

- **Duplicate/"Save as new test" workflow** — not built today and explicitly excluded from this feature.
- **Multiple specimen types on one test / per-specimen LOINC within one test** — explicitly rejected; the data model keeps a separate test (with its own LOINC) per specimen type.
- **A stored "test family"/parent-analyte entity** — the related-tests set is defined by selection at edit time, not persisted.
- **Reagents, Labels (configurable presets), Alerts authoring, Reflex & Calc, Compliance** sections — untouched; they keep current behavior.
- **Panel Management (the panel-side admin)** — the panel list, panel editor, per-test panel LOINC, and import/export are a **separate FRS/Epic** (`panel-requirements.md`). This FRS covers only the **test-side Panels section** (FR-41–45).
- **Bulk terminology import / cross-test code conflict *resolution* beyond the duplicate-LOINC warning** — detection is in scope (FR-16); automatic resolution is not.
- **Changing accession-scoped import matching** — this FRS surfaces the first-match global behavior via warnings; it does not change the resolver.
- **Hard deletion of any test or configuration** — deactivate/reactivate only.
