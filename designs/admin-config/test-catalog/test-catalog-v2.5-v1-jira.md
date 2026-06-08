# Jira — Test Catalog Management v2.5 v1 — Epic + Stories

**Date:** 2026-05-14
**FRS:** `test-catalog-requirements-v2.5.md` (companion to `test-catalog-requirements-v2.4.md`)
**Preview:** `test-catalog-preview-v2.5-v1.html`
**Scope:** v1 only. v2 epic + stories will be written when v1 is in flight.

## Suggested epic labels and parent

- **Parent / project:** OpenELIS Global (OGC)
- **Common labels** (apply to epic + every child story): `test-catalog`, `admin`, `v1`, `carbon`, `global`
- **Conditionally add:** `iso-15189` (if your release line tracks it), `madagascar` (AMR fields), `clinical-safety` (Ranges story for neonatal bilirubin)
- **Assignee suggestions** (from memory): front-end Carbon work → Piotr; admin-menu i18n scope → Mozzy Mutesa; can leave unassigned and let triage route

---

## EPIC — Test Catalog Management v2.5 v1 (Unified Editor + Foundation)

**Summary:** Ship the unified Test Catalog Management editor (v1 of the v2.4 vision) — **directly replaces** shipped Test / Test Section / Panel / Method admin pages (legacy entries decommissioned at v1 release), introduces Domain + AMR + Result Components as foundational fields, lands all heavy schema migrations up-front. **No feature flag** — v1 has parity with shipped behavior for everything not yet in v2.

**Why now:**

- Today's catalog admin requires navigating 5 separate admin pages (Test, Test Section, Panel, Method, Reagent) to configure one test. Consolidating to a single SideNav-routed editor reduces lab-admin training, fewer broken navigation paths, faster catalog setup.
- Neonatal bilirubin (and other neonatal critical thresholds) need **hour-level** critical ranges with **coverage validation** — today's flat low/high model doesn't support either, which is a clinical-safety gap.
- WHONET / GLASS AMR surveillance partners (Madagascar) require an `is_amr_test` flag + WHONET antibiotic codes to export properly — currently done by hand.
- The full v2.4 product also needs Domain (Clinical / Environmental / Vector) and Result Components (multi-value tests like BP, spirometry) to support Environmental / Vector workflows (SILNAS Indonesia) and FHIR-correct co-collection. Landing these in v1's schema means v2 is purely additive.

**v1 scope (this epic):**

9 SideNav sections functional — Basic Info, Sample & Results, Methods, Ranges, Sample Storage, **Display Order**, Panels, Terminology, Analyzers (read-only) — plus the editor scaffold, Test List View with filters, permissions, standard states, `Save as new test…` Duplicate workflow, Activation Acknowledgment modal for incomplete coverage, and all heavy schema migrations. **No feature flag.**

**v2 deferred (separate epic):**

Labels, Reagents, Alerts, Reflex & Calc, Compliance + polish on v1 sections (Range Editor Visual/Table views, Sample Storage audit) + Localization Hardening behavior. **v2 SideNav entries are hidden in v1** — not shown as "Coming Soon" stubs. The SideNav grows from 9 entries in v1 to 14 in v2.

**Acceptance (epic-level demo criteria):**

- [ ] Open Admin → Test Catalog Management → see new list view (click-to-open rows, no Actions column, filter bar collapsed by default with active-filter-count badge on the Filters toggle)
- [ ] Click a test → open new SideNav-routed editor with **9 SideNav entries** (Basic Info / Sample & Results / Methods / Ranges / Sample Storage / Display Order / Panels / Terminology / Analyzers; v2 entries not yet visible)
- [ ] Editor header: primary `Save Test` + secondary `Save as new test…` (Duplicate) + tertiary `Cancel`
- [ ] `Save as new test…` clones the test's full configuration into a new test record after the admin enters a new Name + Code
- [ ] Edit Basic Info including Domain (forced selection on save) and AMR flag (revealing WHONET sub-fields when enabled)
- [ ] Disable AMR on a test with historical exports → historical results unchanged, new results not exported, WHONET config persists
- [ ] Edit Sample & Results on a multi-component test (BP: systolic + diastolic) — per-component config (Select List Options + Result Interpretations) wraps each component in a Carbon Accordion item; single-component tests render flat
- [ ] Add a new unit inline via the Unit ComboBox without leaving the editor
- [ ] Reorder rows in Result Components / Select List Options / Result Interpretations via drag-handle OR Arrow Up/Down keys (keyboard-only path works end-to-end)
- [ ] Configure neonatal critical ranges at hour granularity (0–23h, 24–35h, ...); Coverage Validation green-lights all age windows; Fill Gap pre-fills from adjacent range
- [ ] **Save a test with incomplete Coverage Validation** → save succeeds; warnings surfaced but not blocking
- [ ] **Attempt to set the test Active with incomplete coverage** → Activation Acknowledgment modal appears; admin must check "I understand…" before primary `Activate anyway` enables; acknowledgment logged to `test_activation_acknowledgment`; test goes Active with a `Coverage incomplete` Tag in list view
- [ ] Configure Sample Storage including special handling (no emojis) + Override Restricted; enabling Override Restricted on a test with in-progress orders leaves those orders' settings unchanged
- [ ] Add this test to multiple panels via the typeahead picker; each selected panel renders as an expandable row; expanding reveals position editing via drag-drop / numeric / keyboard arrows; inline panel creation from the picker's dropdown footer
- [ ] Display Order section: select a sample type → drag-and-drop reorder the tests assigned to that sample type; keyboard arrows work as accessibility alternative
- [ ] Add LOINC + SNOMED CT terminology mappings
- [ ] View the read-only list of analyzers that can run this test (derived from the analyzer test-code mappings); confirm there is no `+ Link Analyzer` button on this surface; clicking an analyzer name navigates to the analyzer's Master Lists record
- [ ] `admin.testCatalog.manage` permission gates the routes (UI hidden + HTTP 403); no permission shows the standard empty state
- [ ] No console errors when viewing a test in a language that doesn't have every translation (graceful behavior; full Localization Hardening lands in v2)
- [ ] After v1 ships, legacy Test / Test Section / Panel / Method admin entries are removed from the Admin SideNav

**Hard dependencies:**

- Carbon DataTable, ComboBox, Accordion, Modal, Pagination components in current `@carbon/react`
- Legacy admin pages can be safely decommissioned (parity confirmed)

**Out of scope for this epic:**

- v2 sections (Labels, Reagents, Alerts, Reflex & Calc, Compliance)
- Range Editor Table View + Visual View
- Sample Storage audit-write triggers
- Full Localization Hardening behavior (table schema only)
- Test-reagent linkage (v2 prerequisite)
- Full configurable Label Preset Management (separate FRS)

---

## Child stories

### Story 1 — Editor scaffold + Test List View + permissions + states + schema migrations + legacy-admin decommission

**Summary:** Stand up the new Test Catalog Management editor surface — SideNav routing for the 8 v1 sections, Test List View with full filter bar (default collapsed), permissions, standard states (empty / loading / error / no-permission), all v1 schema migrations, and decommission of the legacy Test / Section / Panel / Method admin entries. **No feature flag** — v1 is a direct replacement.

**Why this is one story:** the scaffold + schema work has no useful sub-decomposition; every section depends on these landing first. Engineering can land a single PR that's reviewable end-to-end before the per-section work starts.

**Acceptance criteria:**

- [ ] All routes `/admin/test-catalog`, `/admin/test-catalog/:testId/:section` are reachable
- [ ] SideNav shows the **8 v1 section entries only**: Basic Info, Sample & Results, Methods, Ranges, Sample Storage, Panels, Terminology, Analyzers (v2 entries are not yet visible — they appear when v2 ships)
- [ ] Test List View renders with click-to-open rows, no Actions column, keyboard-focusable rows, Enter opens editor
- [ ] Filter bar **default state collapsed**; Filters toggle reveals Section / Sample Type / Result Type / Status / Domain (multi-select chip) / AMR; Clear All button; active filter count badge on the toggle
- [ ] Filter state + page + page size reflected in URL; preserved on refresh
- [ ] Pagination supports 25 / 50 / 100 / All; defaults to 25; filter or page-size change resets to page 1; Carbon `<Pagination>` exposes page-number jump input
- [ ] Empty / loading / error / no-permission states render correctly per v2.4 §States
- [ ] `admin.testCatalog.manage` gates all routes (UI hide + API 403)
- [ ] Editor header shows primary `Save Test` + secondary `Save as new test…` + tertiary `Cancel`
- [ ] `Save as new test…` opens a modal asking for new Name + Code; on confirm, clones the rest of the test's configuration (Domain, AMR, components, ranges, methods, panels, terminology, analyzers, sample storage) into a new test record and navigates to the new test's editor
- [ ] Legacy Test / Test Section / Panel / Method admin entries are removed from the Admin SideNav at v1 release; no feature flag, no rollback path other than reverting the release
- [ ] All v1 schema migrations land cleanly:
  - `test.domain` column + backfill CLINICAL
  - `test.is_amr_test` + `test_amr_config` + `whonet_antibiotic_codes` seed
  - `test_result_component` + `component_id` on `test_range`/`test_interpretation`/`test_select_list_option` + auto-create PRIMARY component for every existing test + backfill referencing rows
  - `unit_of_measure` master table seeded
  - `test_localization` table (schema only)
  - `test_sample_handling` + `test_sample_handling_history` (audit table empty in v1)
  - `panel_test (panel_id, test_id, display_order)`
  - `test_section_assignment (test_id, section_id, is_primary)`
  - `test_sample_type.display_order` column with deployment default
  - `test_activation_acknowledgment (test_id, user_id, acknowledged_at, gaps_acknowledged JSONB)` table for Coverage acknowledgment audit
- [ ] Common i18n keys (`admin.testCatalog.common.*`, `admin.testCatalog.list.*`, `admin.testCatalog.editor.*` minus the 5 stale sidenav group keys) land
- [ ] Production JSX uses `@carbon/react` components throughout (`<DataTable>`, `<TableToolbar>`, `<Tag>`, `<Modal>`, `<Accordion>`, `<Pagination>`, `<ComboBox>`); modals inherit Carbon `<Modal>` focus-trap behavior

**FRS trace:** §0.5–§0.8, §2.9, §2.10, §2.11, D-01, D-10
**Dependencies:** none
**Estimated size:** XL

---

### Story 2 — Basic Info (Domain + AMR + status flags)

**Summary:** The new editor's Basic Info section — Test Name / Reporting Name / Code / Description, Domain radio group (CLINICAL / ENVIRONMENTAL / VECTOR, required), AMR flag with conditional WHONET sub-fields, status flags (Active / Orderable / Internal QA).

**Acceptance criteria:**

- [ ] Test Name, Reporting Name, Code, Description editable
- [ ] Domain radio group: CLINICAL / ENVIRONMENTAL / VECTOR; required; cannot save Basic Info without a selection
- [ ] AMR flag checkbox; when enabled, reveals WHONET Antibiotic Code + Antibiotic Class + Test Method + Breakpoint Standard + Disk Potency
- [ ] WHONET Antibiotic Code typeahead from `whonet_antibiotic_codes` reference table
- [ ] **AMR disable retention behavior:** historical results retain their result-time export status (already-exported stays exported, queued-for-export still goes); new results created while AMR is OFF are not eligible for export; WHONET config (Antibiotic Code / Class / Method / Breakpoint / Potency) persists on the test record so re-enabling restores the full config
- [ ] Status flags: Active, Orderable, Internal QA — No Results Release (with tooltip per D-11 distinguishing from EQA participant workflow)
- [ ] **Active toggle gated by Coverage Validation:** if Coverage Validation has unresolved gaps when admin sets Active, the Activation Acknowledgment modal from Story 5 is invoked
- [ ] Changing Domain on an existing test triggers a confirmation modal — v1 copy focuses only on "historical results were evaluated against the prior domain's rules. New results will use the new domain's rules." (the "section visibility may change" line is omitted in v1; re-added in v2 when Compliance lights up)
- [ ] Save persists to `test`, `test_amr_config`
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.basicInfo.*`

**FRS trace:** §2.1, v2.4 §Test Domain, v2.4 §AMR Test Flag, v2.4 §Test Editor Status Flags
**Dependencies:** Story 1
**Estimated size:** M

---

### Story 3 — Sample & Results (multi-component + Result Interpretations + inline-add Unit)

**Summary:** The Sample & Results section — Sample Types multi-select + Default; Result Components sub-table (compact one-row default, full multi-column when 2+); per-component Result Type / Unit (FK with inline-add) / Sig Digits / Default / Allow Multiple Readings / Active; Select List Options per component; Result Interpretations per component with adaptive value field; Copy from Test.

**Why this is one story (and not two):** Result Components, Select List Options, and Result Interpretations are tightly coupled — every one of them attaches to a component, the Component selector appears across all three when there are 2+ components, and the migration creates them in lockstep. Splitting them would create artificial seams.

**Acceptance criteria:**

- [ ] **Sample Types selection uses Carbon `<FilterableMultiSelect>` (typeahead)**, not a checkbox list; ≥1 required; selected types appear as removable tags below the input
- [ ] **Default Sample Type uses Carbon `<ComboBox>` (typeahead)** scoped to currently selected Sample Types; disabled until ≥1 Sample Type is selected; removing default-from-multi clears default and shows a warning notification
- [ ] Result Components sub-table: single-component compact view (Code hidden), full view at 2+ components
- [ ] Per component: Code (unique within test), Label, Display Order, Result Type (NUMERIC / SELECT_LIST / MULTI_SELECT / FREE_TEXT), Unit FK (NUMERIC only), Sig Digits 0–6, Default Result, Allow Multiple Readings toggle, Active toggle, drag-handle reorder, Edit/Delete
- [ ] Adding a 2nd component switches to full multi-column rendering
- [ ] **Per-component accordion pattern (M-03):** for tests with 2+ components, per-component Select List Options and Result Interpretations are wrapped in Carbon `<Accordion>` items below the Result Components table — one accordion item per component, header shows component Label + Code + badge counts ("N options" / "N interpretations"). Single-component tests render Select List Options + Interpretations flat (no accordion).
- [ ] Unit field is a Carbon ComboBox with typeahead from `unit_of_measure` + "+ Add new unit…" sentinel at the bottom of the dropdown
- [ ] Inline-add Unit opens an in-place form: Code (required, unique) / Display Name / UCUM Code / Description; Save creates the master record, auto-selects it for the current component, refreshes other component dropdowns
- [ ] Select List Options sub-table per component when Result Type is SELECT_LIST or MULTI_SELECT; drag-drop reorder; inline add/edit; Active toggle
- [ ] Result Interpretations: Add / Edit modal with adaptive value field — text input for numeric (supports `>N`, `<N`, `>=N`, `<=N`, `N-M`, exact); checkbox list for select-list tests with multi-trigger support (selected values shown as removable tags)
- [ ] Color dropdown (9 options) for interpretations + live preview in modal
- [ ] Copy from Test (interpretations): search + select source test; preview interpretations; choose Replace or Append; labels + colors preserved
- [ ] FHIR mapping per D-02: each component is its own Observation; Observation.component[] NOT used
- [ ] **Keyboard reorder (M-02):** every drag-drop surface (Result Components, Select List Options, Result Interpretations) has Arrow Up / Arrow Down buttons per row for keyboard-only reorder. Drag-drop and keyboard reorder write to the same `display_order` field.
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.sampleResults.*`

**FRS trace:** §2.2, v2.4 §Result Components, v2.4 §Sample & Results Configuration, v2.4 §Result Interpretations, D-02
**Dependencies:** Story 1 (schema migration of `test_result_component` + `component_id` columns must be in)
**Estimated size:** XL

---

### Story 4 — Methods (link + inline create + shortcodes)

**Summary:** Methods section — link existing methods, inline-create a new method (Name + Code only), method shortcodes (Code field for macro entry at result time), set default method, effective date per linked method, Copy methods from another test.

**Acceptance criteria:**

- [ ] Linked methods table: Name, Code (shortcode), Default flag, Effective Date, Edit / Remove actions
- [ ] "+ Link Method" opens method selector with available (unlinked) methods
- [ ] "+ Create New Method" expands inline form below the table: Name + Code (uppercase, alphanumeric, no spaces, 3–10 chars recommended); Create & Link button creates the method in Master Lists AND links to current test
- [ ] Default method radio: exactly one default per test allowed
- [ ] Effective Date per linked method; required
- [ ] Copy from Test (methods): same pattern as Result Interpretations Copy from Test
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.methods.*`

**FRS trace:** §2.3, v2.4 §NEW: Inline Method Creation, v2.4 §Shortcodes for Macro-Style Input
**Dependencies:** Story 1
**Estimated size:** M

---

### Story 5 — Ranges (Structured view + Coverage Validation + hour granularity + Activation Acknowledgment)

**Summary:** Reference Ranges editor — Structured view (accordion per range type, grouped by sex, sorted ascending by age), four range types (Normal / Valid / Critical / Reporting), age units including **hours** for neonatal cases, Add/Edit modal with Fill Gap and Copy-to-other-sex pre-fill, Coverage Validation panel (Male / Female cards, GAP / OVERLAP detection, Fill Gap CTA), and the Activation Acknowledgment modal that gates setting the test Active when coverage is incomplete.

**Why neonatal-bilirubin matters for this story:** the spec's clinical-safety test case. Validate against the v2.4 example range set (0-23h: >7.9, 24-35h: >10.9, 36-47h: >13.9, 48-71h: >14.9, 72h-13d: >17.9, 14d-∞: >15.0).

**Acceptance criteria:**

- [ ] Four range types: Normal, Valid, Critical, Reporting
- [ ] Age units: hours, days, weeks, months, years
- [ ] Sex: Male, Female, All
- [ ] Structured view: accordion per range type, sub-grouped by sex, sorted ascending by normalized-to-days age; per-row: index, age range (∞ when 999y), Low, High, mini visual bar; row hover reveals Edit / Copy to other sex / Delete
- [ ] Header shows "Reference Ranges (Structured view)" in v1; no view-mode dropdown until v2 lights up Table + Visual views (M-07)
- [ ] Add/Edit Range modal: title "Add/Edit {Range Type}"; source banner shows when invoked from Fill Gap / Copy-to-other-sex; Applies To radio (All / Male / Female); Age Range (From / To with unit select); Value Range (Low / High; placeholder "Leave blank if N/A" for Critical with optional fields, both required otherwise); Cancel / Save
- [ ] Save validates: age From < age To, at least one value field filled, no overlap conflict, hour-boundary correctness — but **save is never blocked** by incomplete Coverage Validation
- [ ] Coverage Validation panel (toggleable via "Validate Coverage" button): side-by-side Male / Female Tile cards; "Complete Coverage" green-check when all age windows covered; per-issue red card with GAP or OVERLAP pill, gap range, suggested values from adjacent range, "Fill Gap" CTA
- [ ] Tests with only "All" sex ranges display two Coverage Validation cards (Male + Female), both indicating coverage via the "All" ranges (M-08)
- [ ] Fill Gap action: opens Add Range modal with sex / age range / Low / High pre-filled from the adjacent range; source banner "Values from: {source range}"; user can edit before save
- [ ] Copy-to-other-sex action: opens Add Range modal with sex flipped; banner "Copied from {source sex}: {age range}"
- [ ] **Activation Acknowledgment modal (NEW for v2.5, H-03 + R-01 resolution):** when an admin attempts to set the test Active with unresolved Coverage Validation gaps:
  - Modal title "Activate test with incomplete coverage?"
  - Body lists each gap (e.g., "Female · Normal range · 56 days to 1 year not covered") with consequence text
  - "I understand this test will not be validated against the listed demographics" checkbox
  - Primary `Activate anyway` disabled until checkbox checked
  - Secondary `Fill gaps now` returns to Ranges with first gap pre-selected for Fill Gap
  - On confirm: row inserted into `test_activation_acknowledgment` (test_id, user_id, acknowledged_at, gaps_acknowledged JSONB); test goes Active; Test List View row shows `Coverage incomplete` Tag
  - Re-presented if gap pattern changes after acknowledgment
- [ ] `validate_coverage` API endpoint returns `{ valid, coverage: { male: { complete, gaps[] }, female: { complete, gaps[] } } }`
- [ ] `applicable_range` API endpoint returns the applicable range per type for a given demographic
- [ ] Coverage check normalizes hours/days/weeks/months/years to days; verifies first range starts at 0; verifies each range's age_to + epsilon == next age_from (no gaps); verifies last range extends to ∞ (999y)
- [ ] `test_range.component_id` foreign key respected; Range Editor shows Component selector when test has 2+ components
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.ranges.*` (Structured view + Coverage Validation + Activation Acknowledgment keys; Visual view keys are v2)
- [ ] **Out of scope for this story:** Table view, Visual view, Bulk Actions toolbar (these are v2)

**FRS trace:** §2.4, v2.4 §Range Types Overview, v2.4 §Detailed Range Requirements, v2.4 §NEW: Functional Coverage Validation
**Dependencies:** Story 1, Story 3 (for `component_id`)
**Estimated size:** XL

---

### Story 6 — Sample Storage

**Summary:** Sample Storage section — storage conditions (standard list + custom), max duration with unit, stability notes, special handling checkboxes, disposal method + timeframe, special instructions, Override Restricted lock.

**Acceptance criteria:**

- [ ] Storage Conditions dropdown with 10 standard options + Custom
- [ ] Custom Storage Conditions text field shown when Custom selected
- [ ] Maximum Storage Duration: number + unit (Hours / Days / Weeks / Months); required
- [ ] Stability Notes free text
- [ ] Special Handling checkboxes: Protect from light, Do not freeze, Do not refrigerate, Keep upright, Centrifuge before storage, Aliquot before storage (per v2.4 list — without emojis)
- [ ] Disposal Method dropdown (9 options); required
- [ ] Disposal Timeframe number + unit (Days / Weeks / Months); optional
- [ ] Special Instructions textarea
- [ ] Override Restricted checkbox; helper text; Locked badge when enabled
- [ ] Storage / disposal settings rendered as read-only in Order Entry when Override Restricted is enabled
- [ ] **In-progress order behavior (M-05):** when an admin enables Override Restricted on a test that has orders in progress, those orders keep their existing storage settings (locked-but-unchanged). New orders created after the flag is enabled use the locked version.
- [ ] **No emojis in special-handling labels (L-07):** "Protect from light", "Do not freeze", etc. — the v2.4 string table emojis are removed. Use Carbon icons inline if a visual marker is desired.
- [ ] Persists to `test_sample_handling`
- [ ] **Out of scope for this story:** audit-write triggers to `test_sample_handling_history` (table exists from Story 1 schema; writes are v2)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.sampleStorage.*`

**FRS trace:** §2.5, v2.4 §Sample Storage Tab, D-09
**Dependencies:** Story 1
**Estimated size:** M

---

### Story 7 — Panels (typeahead picker + expandable rows + drag-drop/numeric/keyboard position)

**Summary:** Panel Membership section — typeahead picker at the top to add this test to a panel; selected panels render as expandable accordion rows below the picker; each expanded row provides position editing via drag-drop, numeric input, and keyboard arrows (all three paths stay synchronized); inline create new panel from the picker's dropdown footer.

**Acceptance criteria:**

- [ ] **Add-panel picker uses Carbon `<FilterableMultiSelect>` (typeahead)** at the top: "Add this test to panel…" — admin types to filter; selecting adds the panel as a row below
- [ ] **`+ Create New Panel` is a separate button** next to the picker (matches the Methods section pattern of `+ Link Method` / `+ Create New Method`). Toggles open an inline form (Panel Name only); on Create the new panel is added to the picker's selected set
- [ ] **Selected panels render as Carbon `<Accordion>` items below the picker.** Collapsed header shows: panel name, test count, current position of "This test". Expanded body reveals position editor + preview list
- [ ] After inline panel create, show a Carbon `<InlineNotification>` for ~5 seconds linking to Master Lists → Panels for additional config (per M-06)
- [ ] Position editor in expanded row: numeric input "Position N of M" + preview list showing current panel order
- [ ] **Drag-drop in the preview list:** "This test" row is draggable via grip handle `≡`; existing panel tests are static (not draggable); drop zones appear between rows; drag updates numeric input live
- [ ] **Keyboard reorder:** when "This test" row is focused, Arrow Up / Arrow Down moves position; mirrors drag-drop
- [ ] All three input paths (drag, numeric, keyboard) write to the same `panel_test.display_order` field and stay synchronized
- [ ] Position validation: integer, min 1, max testCount+1
- [ ] Removing a panel from the typeahead's selected set un-links the test from that panel (with confirmation)
- [ ] Persists to `panel_test` junction with `display_order`
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.panels.*`

**FRS trace:** §2.6, v2.4 §NEW: Panel Membership with Display Order
**Dependencies:** Story 1
**Estimated size:** M

---

### Story 8 — Terminology Mappings

**Summary:** Terminology Mappings section — display existing mappings, add LOINC / SNOMED CT / CIEL / OCL codes with relationship type, edit, delete.

**Acceptance criteria:**

- [ ] Terminology table: Source (Tag) / Code / Relationship / Actions
- [ ] "+ Add Mapping" form: Terminology Source (LOINC / SNOMED CT / CIEL / OCL), Code, Relationship (Same As / Broader Than / Narrower Than)
- [ ] Edit / Remove per row
- [ ] **Out of scope for this story:** bulk import, conflict detection across tests (v2)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.terminology.*`

**FRS trace:** §2.7, v2.4 §Terminology Mappings
**Dependencies:** Story 1
**Estimated size:** S

---

### Story 9 — Analyzers (read-only display derived from analyzer mappings)

**Summary:** Analyzers section is a **read-only display** showing which analyzers can run this test. The list is derived from the analyzer test-code mappings configured at the analyzer end (Administration → Master Lists → Analyzers → [analyzer] → test code mappings). No link/unlink operations from the Test Editor — admins make changes at the analyzer's record.

**Acceptance criteria:**

- [ ] Read-only table of analyzers that can run this test: Analyzer Name / Location / Serial Number / Status (Online / Offline / Maintenance Tag)
- [ ] Each analyzer row's name links out to that analyzer's record in Master Lists for editing
- [ ] No `+ Link Analyzer` button, no Unlink action, no modal — this is a display surface only
- [ ] Info card: "This list is maintained in the analyzer's test code mappings. To add or remove an analyzer for this test, go to Administration → Master Lists → Analyzers → [analyzer name] → test code mappings."
- [ ] Empty state: "No analyzers have this test in their test-code mappings." with a link to Master Lists → Analyzers
- [ ] Source of truth: query the analyzer test-code mapping table; this section does not write to any table
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.analyzers.*`

**FRS trace:** §2.8 (revised; v2.4 §Analyzers Tab is superseded — v2.5 walks back the link/unlink editor per Casey's call 2026-05-14)
**Dependencies:** Story 1
**Estimated size:** S

---

### Story 10 — Display Order (drag-drop ordering of tests within a sample type)

**Summary:** New SideNav section. Lets an admin reorder tests within a selected sample type via drag-drop, with keyboard arrows as the accessibility alternative. Order persists to `test_sample_type.display_order` (column already added by Story 1's schema migration) and applies to order entry, result entry, worklists, and reports. Pulled into v1 from v2 per Casey's call (2026-05-14): drag-drop infrastructure already exists.

**Acceptance criteria:**

- [ ] Display Order section is the 6th SideNav entry (between Sample Storage and Panels)
- [ ] Sample Type selector at the top — Carbon `<ComboBox>` (typeahead) — admin picks which sample type's order to edit
- [ ] Test list below the selector shows all tests assigned to that sample type, sorted by current `display_order`
- [ ] Each row has a drag handle `≡`, position number (1, 2, 3, ...), and test name
- [ ] **Drag-drop reorder:** all rows draggable; drop zones between rows; live position-number updates during drag
- [ ] **Keyboard reorder:** Arrow Up / Arrow Down on a focused row moves the row within the list
- [ ] Auto-save on drop (no explicit Save button required for this section)
- [ ] Persists to `test_sample_type.display_order`
- [ ] Order is sample-type specific (the same test can have different positions in different sample types)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.displayOrder.*`

**FRS trace:** §2.5b (pulled from v2 §3.1 to v1), v2.4 §NEW: Test Display Order (Within Sample Type)
**Dependencies:** Story 1 (schema migration of `test_sample_type.display_order`)
**Estimated size:** M

---

## Summary table

| # | Story | Size | Depends on |
|---|---|---|---|
| 1 | Editor scaffold + Test List View + permissions + states + schema migrations + legacy-admin decommission | XL | — |
| 2 | Basic Info (Domain + AMR + status flags + Activation gate) | M | 1, 5 |
| 3 | Sample & Results (multi-component + per-component accordion + Result Interpretations + inline-add Unit) | XL | 1 |
| 4 | Methods (link + inline create + shortcodes) | M | 1 |
| 5 | Ranges (Structured + Coverage Validation + hour granularity + Activation Acknowledgment modal) | XL | 1, 3 |
| 6 | Sample Storage | M | 1 |
| 7 | Panels (typeahead picker + expandable rows + drag-drop/numeric/keyboard position) | M | 1 |
| 8 | Terminology Mappings | S | 1 |
| 9 | Analyzers (read-only display, no link/unlink) | S | 1 |
| 10 | Display Order (drag-drop within sample type) | M | 1 |

**Sequencing suggestion:** Story 1 first as a foundation PR. Then Stories 4 / 6 / 7 / 8 / 9 / 10 can run in parallel. Story 3 unblocks Story 5; both are the biggest pieces and best handled by the same engineer or close pair. Story 2's Activation gate depends on Story 5's Activation Acknowledgment modal — sequence Basic Info after Ranges, or stub the gate in Story 2 and wire it up when Story 5 lands.

**Suggested labels per story:** `test-catalog`, `admin`, `v1`, `carbon`, plus any sub-domain label (`clinical-safety` on Story 5; `madagascar` + `whonet` on Story 2; `interop` + `fhir` on Story 3).
