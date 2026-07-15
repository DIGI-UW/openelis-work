# Test Catalog Completion v2 — Consolidated FRS

**Feature slug:** `test-catalog-completion-v2`
**Status:** Draft for review · **Author:** Casey Iiams-Hauser (with design assistant) · **Date:** 2026-07-14
**Audience:** single handoff document for the implementing agent (Claude Code / Mozzy). Load THIS file only.

**Supersedes as the active work list:**
- `test-catalog-editor-completion.md` (FR-1–FR-45) — most of it is now DELIVERED (see Baseline);
  its undelivered remainder is re-stated here as corrections (FR-66+), so the old doc is
  reference/history, not a work source.
- `test-catalog-manageability-frs.md` (FR-46–FR-65) — incorporated verbatim-in-substance as
  Part B, so it does not need to be loaded separately.

**Inputs:** delivered-code audit of `frontend/src/components/admin/testCatalog/` @ `develop`
(commit `c81d708`), 2026-07-14 (`test-catalog-delivered-vs-spec-audit.md`); data-model
authority `openelis-design/references/test-catalog-data-model.md` (source-verified 2026-07-14).

**FR numbering:** FR-1–45 = original completion spec (mostly delivered; not re-listed).
FR-46–65 = Manageability (Part B). FR-66+ = delivered-feature corrections (Part A).

---

## Lab Context

### Current State
The unified Test Catalog editor shipped: catalog managers configure tests in one place —
list with filters, inline create, result components, ranges with coverage checking, storage,
panels, labels, terminology, alerts, reagents, localization, display order. The build is
faithful to the specs in the large, but a band of small elements was dropped in delivery
(the labels preset picker filters out custom presets; terminology mappings have no display
name; LOINC warnings — LOINC being the universal code that identifies a lab observation,
and the key analyzers and electronic orders route by — exist only inside one section; the
combined editor shipped half its shared sections), and the catalog still treats each
specimen variant of an assay as a stranger row.

### Pain
Concretely: an admin who built a custom label preset cannot attach it to any test — the
picker silently offers only the 5 system presets. A manager can activate a test that cannot
capture a result (no components), and the first symptom is a technologist at an empty result
screen mid-shift. Two active tests sharing a LOINC route analyzer results to whichever
matches first, and nothing outside the Terminology section says so. A 100+ row catalog shows
"Glucose (Serum)" and "Glucose (CSF)" 60 rows apart, and configuring the third glucose
variant means re-typing everything. When ranges are incomplete, Save silently refuses with
no indication of what's wrong.

### What Changes
The delivered editor gets its dropped elements back: custom presets attach, an
order-entry preview shows what labels will do, terminology carries display names, LOINC
hazards surface in the list / combined editor / activation, the combined editor covers all
four shared sections and shows per-test values before overwriting. On top of that,
the list groups specimen variants under assay rows via an explicit admin-controlled link,
"Add specimen variant" clones a test onto a new specimen in minutes, a new test always has
its primary component and cannot be activated incomplete — with a visible checklist instead
of silent failure — and configuration problems are tagged right in the list behind a single
"! Only tests with issues" filter.

## User Stories

1. As a **catalog manager**, I want the custom label presets I built to be attachable to
   tests, and to see what order entry will print, so label configuration is real, not
   decorative.
2. As a **catalog manager**, I want LOINC problems visible where I work (list, combined
   editor, activation), so routing hazards are caught before results misroute.
3. As a **catalog manager**, I want the test list grouped by assay with specimen variants
   together, and a copy-based way to add a variant, so a 400-test catalog stays navigable
   and variants don't drift.
4. As a **catalog manager**, I want a new test to start with its primary component and a
   completeness checklist that blocks activation until the test can capture a result, so
   technologists never meet an empty result screen.
5. As a **catalog manager**, when the editor refuses to save I want it to name the blocking
   section and field and link me there.

---

## Baseline — DELIVERED, verified in code. Do NOT rebuild. (audit 2026-07-14)

| Area | Delivered (evidence) |
|---|---|
| List (FR-39/40) | Columns Name/Sample type/Code/Domain/Status; AMR + Coverage-incomplete tags; collapsible Filters panel w/ active count; sample-type typeahead filter; debounced search; URL-mirrored pagination; row selection + "Edit related tests together"; New test button (`TestCatalogList.jsx`) |
| Create in place (FR-1–5) | `/TestCatalogEditor/new/basic-info`, code auto-suggest until edited, 409 uniqueness error, created Inactive w/ exact FR-3 text, "Lab Unit" terminology (`BasicInfoSection.jsx`) |
| Result components (FR-27–37 core, OGC-1127) | CRUD, reorder, 7 result types (advanced behind disclosure), unit typeahead + inline add, sig digits, single-primary `isPrimary`, `showOnReport` (primary forced true), live preview, copy-from-test (`SampleResultsSection.jsx`) |
| Storage | All TestSampleHandling fields, group mode, version-history modal (`StorageSection.jsx`) |
| Panels (FR-41–45 core) | Membership table w/ populated Position, add-to-panel ComboBox, inline name-only create, remove=membership-only (`PanelsSection.jsx`) |
| Terminology core (FR-15/16) | 4-source mapper w/ relationships, inline add, no-LOINC + duplicate-LOINC warnings verbatim from `/loinc-integrity`; bonus per-component "Applies to" scoping (`TerminologySection.jsx`) |
| Labels core | Preset table: add, Default/Max qty + validation, Allow Override, global order-entry override toggle, empty state, remove confirm (`LabelsSection.jsx`) |
| Alerts / Reagents / ReflexCalc / Localization / Display Order | All functional, none stubs; ReflexCalc read-only by design; Analyzers read-only by deliberate re-scope |
| Combined editor core (FR-12–14) | Ranges + Storage shared; identity read-only; deselect; Display Order excluded (`CombinedTestEditor.jsx`) |

---

## Part A — Delivered-feature corrections (FR-66+)

### Labels

- **FR-66 (Custom presets attachable).** Remove the `isSystem` filter in `LabelsSection.jsx`'s
  preset picker: the "Add Label Type" dropdown offers **every active per-sample preset**
  (`prints_per_sample = true`) — system and custom, from Label Preset Management.
  Order-only presets stay excluded (nothing to override per sample). **Owning spec:**
  `barcode-labels.md` v2.5 (OGC-285) §3 — it supersedes the 4-fixed-preset era and already
  specifies this picker, the per-link `allow_override`, and the master toggle; FR-66/67
  here restate its Test Catalog surface so this document stands alone. Coordinate the P1
  slice with OGC-285 rather than duplicating it. **Dependency reality check:** Label Preset Management is
  now DELIVERED on develop (`frontend/src/components/admin/labelPresets/`, route
  `/labelPresets`) — the older "configurable presets don't exist" constraint (D-019 /
  current-state-gotchas) is stale and superseded by this observation.
  (Coordination check 2026-07-14: no conflict with OGC-285; FR-67's preview matches its
  §3.4 verbatim in intent.)
- **FR-67 (Order Entry Preview + section copy).** Below the config table, an **"Order Entry
  Preview"** subsection: "When this test is ordered, the Labels section will be pre-populated
  as follows" — table of Label type / Qty / Source (per-test config vs preset default), with
  the locked-quantity note when override is off. Add the two spec'd section headings and
  helper copy ("Default Labels for This Test", "Label Generation Settings"). This is the
  admin's only feedback on what order entry will actually do.
- **FR-68 (Retire the legacy Labels tab).** `testManagement/labelsTab/LabelsTab.jsx` hits the
  same endpoints as the new section — same two-worlds problem FR-38 killed for create.
  Retire/redirect it so there is one Labels surface.

### Terminology

- **FR-69 (Display Name, auto-fetched).** Each mapping gains a **Display Name**: auto-fetched
  from the terminology service on code entry (InlineLoading while fetching, editable after,
  required before save). Backfill: existing mappings get display names lazily on next edit;
  a health finding (FR-62.i) counts mappings with empty display names. Without this, FHIR
  codings ship with no `display`.
- **FR-70 (Relationship required).** The relationship dropdown loses its "none" option;
  existing null relationships read as SAME_AS until edited.

### LOINC surfacing (the FR-15–18 intent, finished)

- **FR-71 (No-LOINC list tag).** The list row DTO carries `hasLoinc`; active tests without a
  LOINC show the "No LOINC" tag in the Name column (the FR-39 element that was dropped).
- **FR-72 (Combined-editor + activation LOINC checks).** The combined editor's per-test
  identity list re-surfaces the FR-16 duplicate warning per test (FR-17 as spec'd); the
  activation flow re-runs `/loinc-integrity` and includes duplicate/no-LOINC findings in the
  `ActivationAckModal` alongside coverage gaps (FR-18 as spec'd — warning, never a block).

### Combined editor depth

- **FR-73 (All four shared sections).** Add **Sample & Results** and **Methods** to the
  combined editor's shared sections (FR-8 as spec'd), joining Ranges and Storage.
- **FR-74 (See before you overwrite).** Replace the single section-level banner with the
  FR-10 contract: per-field "Differs across tests" state with an expandable view of **each
  test's current value**, and "Set all to…" only after the values are visible. When the
  selection spans specimen types, the Ranges section shows the persistent
  specimen-dependent warning (Part B, FR-51).

### Result-type correctness

- **FR-75 (Retire the Cascading result type).** Result type **C (Cascading)** is removed
  from the chooser entirely (create and edit) — decided 2026-07-14: no longer needed, and
  it was never configurable (no grouping UI ever shipped). Any *existing* test with
  `result_type = 'C'` keeps working exactly as today (it already behaves as Multi-select),
  renders its type as read-only "Cascading (legacy)" with helper text suggesting conversion
  to Multi-select, and surfaces as an Info-level health finding (FR-62.j). No data
  migration; no hard removal of existing records.
- **FR-76 (Default result honors type).** Default result for D = select from the option
  list; for M = multi-select from options; free-text input only for N/A (FR-31 as spec'd).
- **FR-77 (Preview fidelity).** The live result-entry preview reuses the actual Results
  Entry input components (FR-35), replacing the disabled-lookalike reimplementation.
  Lower priority; schedule with FR-73's Sample & Results work.

### Dead controls & polish

- **FR-78 (No dead buttons).** The editor-header **Save** placeholder (info toast) is
  removed — saves are per-section and the header must not pretend otherwise. The
  **"Save as new test…"** placeholder either wires to **Add specimen variant** (FR-52) when
  Part B lands, or is removed until then. A shipped no-op button is a silent failure.
- **FR-79 (Panels polish batch).** Reposition performs live renumbering against the panel's
  other tests (not a local ±1); the "View order" context refreshes as position changes;
  remove-membership gets its spec'd confirmation.
- **FR-80 (AMR tag placement).** AMR renders beside the test name (FR-39), not in the
  Domain cell; tag color per the status-tag mapping.

### Storage

- **FR-86 (Restore spec'd value lists).** The delivered Storage section narrowed the value
  lists; restore the spec'd sets — 9 storage conditions (adding ultra-low freezer, cold
  room, cool room, controlled room temperature, warm incubator), 6 handling flags (adding
  Keep upright, Centrifuge promptly, Aliquot on receipt), 9 disposal methods. Values are
  strings in `test_sample_handling` (varchar columns) — frontend option lists + constants,
  no schema change. The spec'd temperature quick-reference card is optional polish within
  this FR.

### Sample & Results — targeted fidelity fixes (audit + mockup diff, Casey-reviewed)

**Stance:** the delivered section is *mostly right*. The mockup-vs-delivered diff found 20
divergences; most are **accepted as delivered** (recorded below so the old mockup stops
being the contract). What follows are the fixes worth making.

- **FR-81 (Guidance restored).** Reinstate the in-context teaching the mockup had:
  (a) Significant digits becomes a `NumberInput` (min 0, max 3) with the dynamic helper
  "Shown to the technician as 12.3"; (b) the Numeric info cross-link "Normal & critical
  ranges are set in the Ranges section →"; (c) the type-specific explainer notes
  (Multi-select, Free-text "no units/ranges apply", Titer, Alpha); (d) the
  component-vs-multi-select guidance paragraph; (e) the type-chooser prompt reads
  **"How is this result captured?"** (question form, per mockup).
- **FR-82 (Interpretations coaching).** Empty interpretations render the mockup's
  dashed-border empty state — "No flagging rules yet. Add one to auto-mark results like
  'Detected' as positive." — with the "(optional)" framing in the heading, not an empty
  table with headers.
- **FR-83 (Create a new select-list option inline).** The options editor's dictionary
  typeahead currently only *finds existing* dictionary entries. Add an inline
  **"Add new option"** path (mirroring the delivered add-new-unit inline form): when the
  typed value has no dictionary match, offer "Create '{value}' as a new option" — creates
  the dictionary entry and adds it to the list in one gesture. Same role as the rest of the
  editor; dictionary entry is created active.
- **FR-84 (Sort order explained + sensible defaults).** The options table's "Sort order"
  column and the per-component "Display order" field get helper text stating what they
  order and where it shows ("the order options appear in the technician's result list" /
  "the order components appear in result entry and on reports"). New options/components
  default to append (max+1) so the numbers never demand attention unless reordering.
- **FR-85 (Preview, live where it stands).** Keep the preview's delivered position
  (inline, single column — accepted), but restore its designed behavior: **enabled**
  interactive controls (real Dropdown / checkboxes / 3-row TextArea for free text), blue
  accent framing, "This is what a technician will see" helper. FR-77 (reusing the actual
  Results Entry components) is the implementation vehicle — treat FR-77/85 as one story.

**Accepted deviations (deliberate; do not "fix"):** single-column layout instead of the
two-column Grid; multi-component Accordion (post-mockup feature, needed); the per-component
plumbing fields (Code / Primary / Show-on-report / Display order / reorder arrows — from
OGC-1127/985, post-date the mockup); inline-editable options table (more capable than the
mockup's read-only table); inline whole-config copy-from-test (supersedes Mockup B's
interpretations-only modal); interpretation **Severity** select (delivered extra — keep,
back-filled into this spec as the interpretation model); relocation of sample type to Basic
Info (matches Mockup A / FR-2).

**Verification pointer:** live instance routes for eyeballing —
`/MasterListsPage/TestCatalogEditor/306/labels` (Labels, FR-66/67) and the same editor's
`/sample-results` section (FR-81–85).

---

## Part B — Manageability (FR-46–FR-65, incorporated from the Manageability FRS)

> Full normative content; the standalone `test-catalog-manageability-frs.md` matches this
> section and needn't be loaded separately.

### Group H — Assay-grouped list view (default)

- **FR-46 (Grouping key — an explicit variant link, nothing automatic).** The list groups
  tests into *assay groups*. Two tests belong to the same group **when and only when** a
  persisted **variant link** records them as members of the same group. Groups form in
  exactly two ways: creating a specimen variant (FR-52) writes the link automatically; an
  admin explicitly linking existing tests (FR-51) writes it deliberately. **No name matching
  of any kind** — no suggestions, no heuristics. How the link is stored is the dev's call
  (declared data addition in Dependencies): behavior only — durable, auditable, at most one
  group per test, removable (Unlink). Group display label derives at render time (variants'
  common name stem); not new stored data.
  **Day one: silence** — nothing auto-links; legacy catalogs open ungrouped with no
  grouping findings. Rejected alternatives (recorded): liquibase 1:1 name auto-link (data
  mutation in a migration); shared `name_localization_id` as the key (localization semantics
  undefended; re-pointing renames tests system-wide).
- **FR-47 (Group row).** Collapsible header: assay label, variant count ("3 specimen
  variants"), status union ("2 Active · 1 Inactive"), domain tag (groups expected
  single-domain; mixed = FR-62.g), group-level issue roll-up. Expanding shows variant rows
  with the existing FR-39/40 columns.
- **FR-48 (Single-variant assays)** render as plain flat rows — no group chrome.
- **FR-49 (Search/filters)** match variants; a group renders when ≥1 variant matches,
  auto-expanded to matches with "show N more variants" for hidden siblings; groups with no
  match are hidden.
- **FR-50 (View toggle).** Grouped ⇄ Flat in the toolbar; flat = the delivered FR-39/40
  list exactly; encoded as `?view=flat`, remembered per user. Pagination counts groups in
  grouped view, rows in flat.
- **FR-51 (Group actions & linking).** Group header: **Edit variants together** (opens the
  combined editor with the group's active variants pre-selected) and **Add specimen
  variant** (FR-52). Group-editor contract (restated from FR-8–14 + FR-73/74): shared =
  Sample & Results, Methods, Ranges, Storage; per-test read-only = Name, Code, Specimen,
  Terminology/LOINC; excluded = Display Order, Panels, Analyzers, Reflex/Calc, Alerts,
  Labels. When a selection spans specimen types the Ranges section shows a persistent
  warning (ranges are specimen-dependent; "Set all to…" across specimens is usually wrong).
  **Link variants** = toolbar action on ≥2 selected ungrouped rows; writes the variant-link
  record after a confirmation listing the tests (deselectable). **No side effects on names,
  codes, or any field — membership only.** **Unlink** (group header, confirmed) reverses it.

### Group I — Add specimen variant

- **FR-52 (One flow, three entry points, visible copy source).** Row action preselects that
  variant as copy source; the open test's editor action preselects the open test; the group
  header preselects the most recently updated active variant. The form always shows a
  **"Copy from" ComboBox** of the group's variants — presets over one control, not
  redundant buttons. Changing source re-derives copied config + code suggestion unless
  edited. (Supersedes the old completion spec's out-of-scope exclusion of duplicate/save-as-new —
  deliberate reversal; FR-38 retired the wizard, leaving repeated full creates as the only
  variant path. Wire or remove the delivered "Save as new test…" stub accordingly, FR-78.)
- **FR-53 (What copies).** All result components (incl. primary flags, labels, types, units,
  sig digits, defaults, **and Dictionary components' result-option lists — the
  `test_result.component_id` rows — whole**), Sample & Results guidance, Methods,
  Storage/handling, and Basic Info settings other than identity (domain, Lab Unit,
  orderable/notify/reportable flags; Lab Unit + flags editable, domain per FR-54a).
  **Ranges copy as drafts** — see review mechanism below. **Not copied:** panel memberships,
  analyzer mappings, reflex rules, calc rules, alerts, and **terminology incl. LOINC**
  (specimen-specific; carryover manufactures the FR-62.a hazard).
  **Copied-ranges review (section-level, one gesture):** while drafts are unconfirmed the
  Ranges section shows one banner — "Ranges copied from {source} — review for {specimen},
  then save or mark reviewed" — with a **Mark ranges reviewed** button; saving the section
  (edited or not) clears the state; the button just performs that save. **No new datum**:
  reviewed = "Ranges saved since creation", derivable from existing audit columns; existing
  data and from-scratch tests default to reviewed — day one raises nothing.
- **FR-54 (Fresh identity).** The variant is recorded as a member of the source's group
  (FR-46 link, automatic); name seeded from assay name + specimen per the shipped display
  convention; **Code** reuses the delivered derive-from-name auto-suggest, seeded with
  assay name + chosen specimen, re-deriving until user-edited, uniqueness per FR-4;
  **Sample type** is a required typeahead ComboBox excluding specimens already used by the
  group's active variants. **LOINC does not appear on this form** — terminology lives in
  the Terminology section, starts empty, with helper "LOINC codes are specimen-specific —
  the source test's code applies to {source specimen} only"; the FR-16 duplicate warning
  fires there unchanged.
- **FR-54a (No fake-editable fields).** Not-writable-here renders as **static text, never
  disabled inputs**: the assay name (renamed only via Edit variants together) and the
  domain ("Inherited from {assay} — all variants share a domain"). Lab Unit and flags stay
  real controls.
- **FR-55 (Lifecycle).** Created **Inactive** (FR-3), lands at `basic-info`
  (`/MasterListsPage/TestCatalogEditor/new/basic-info?copyFrom=<testId>`), subject to the
  FR-57 gate; writes exactly one `SAMPLETYPE_TEST` row (specimen-is-identity, D-028).

### Group J — Minimum-viable create & activation integrity

- **FR-56 (Primary component always present).** From-scratch create: one component row
  pre-created and marked Primary, visible with no ＋ click; label defaults to the test name;
  result type required on that row. Variant create: components arrive **copied whole**
  (FR-53) with a "Copied" indicator — the gate is already satisfied on open. ＋ adds
  *additional* components only. Backend invariant: every test has a PRIMARY component
  (`TestResultComponent`, OGC-937 M1 backfill) — the UI must not construct violations.
- **FR-57 (Structural activation gate — API-enforced).** A test cannot be set Active
  without (a) a name, (b) ≥1 active Primary component with a result type, (c) non-empty
  result options on any active Dictionary component. Refused activation opens a
  **completeness panel** linking each unmet item to its section/field — never a silent
  no-op. Saving as Inactive is always allowed. **The gate is a validation rule of the
  `/rest/test-catalog` contract** — analyzer auto-create, e-order intake, imports, and
  scripted clients meet the same rule. A UI-only gate is decoration.
- **FR-58 (Completeness checklist).** Persistent editor-header indicator, two tiers:
  **Required to activate** (FR-57 items) and **Advisory** (warn, never block — FR-18
  precedent): LOINC assigned (links to Terminology), range coverage complete, copied ranges
  reviewed, localization present. Each item links to its section.
- **FR-59 (No silent save failures).** Any refused save/activation (a) shows an inline
  error naming the blocking section(s)/field(s), (b) badges the section in the section nav,
  (c) marks failing fields with Carbon validation states. A dead Save with no stated reason
  is a defect — including the known case: incomplete ranges blocking save with nothing
  marked.
- **FR-60 (Existing bad records).** Already-Active tests with zero (active) components are
  **not auto-deactivated**; they surface as FR-62.b and meet FR-57 on next re-activation.

### Group K — Catalog health, integrated in the list

- **FR-61 (Surfacing).** (a) One Filters-panel toggle: **"! Only tests with issues"**
  (warning icon; no severity dropdown — severity reads off the tags); (b) per-row issue
  tags by the Name column; (c) group-row roll-ups; (d) dismissible banner "{n} tests have
  configuration issues · Show" that switches the toggle on. No new page or SideNav slot.
  Counts split by severity ("3 errors · 9 warnings"), errors first; no per-finding
  acknowledge in v1 (named follow-up if pilots open with unfixable counts).
- **FR-62 (Finding types).**
  | ID | Finding | Severity |
  |---|---|---|
  | a | Same LOINC active on ≥2 tests, same specimen — routing genuinely nondeterministic (`getActiveTestsByLoinc().get(0)`) | Error |
  | b | Active test with zero (active) result components | Error |
  | b2 | Active Dictionary-type component with an empty result-option list | Error |
  | c | Test with zero or multiple sample-type links (violates D-028 one-link convention; both exist in real data) | Error |
  | d | Same LOINC on ≥2 tests, different specimens — **not necessarily miscoding** (combined-specimen LOINCs like 2345-7 Ser/Plas are legitimate); reads "routing cannot tell these apart — ensure incoming orders carry a specimen" | Warning (Info within a linked group) |
  | e | Range coverage incomplete, or copied ranges unreviewed — **variant-copy flow only; nothing predating this feature is flagged** | Warning |
  | g | Assay group spanning multiple domains (possible only via post-link edits) | Info |
  | i | Terminology mapping with empty Display Name (FR-69 backfill) | Info |
  | j | Test using the retired Cascading result type — works as Multi-select; suggest converting (FR-75) | Info |
  | — | Active test with no LOINC — absorbed as the FR-71 list tag | Warning |
- **FR-63 (Severity rendering).** Error red / Warning warm-gray / Info gray; tag text =
  finding name; tooltip = one-line explanation.
- **FR-64 (Actionability).** Every finding links to the section that fixes it.
- **FR-65 (Computation).** Server-side over existing tables, cached, invalidated on catalog
  writes; list returns per-row summaries; no perceptible latency at 1,000 tests (NFR-1).

---

## Silent-Failure Inventory (regression checklist)

| # | Silent failure | Fixed by |
|---|---|---|
| 1 | Incomplete ranges block saving with nothing marked | FR-59, FR-58 |
| 2 | Active test with no components → technologist hits empty result screen | FR-56/57/60, FR-62.b |
| 2b | Active Dictionary component with empty select list → empty dropdown | FR-57.c, FR-62.b2, FR-83 |
| 3 | Duplicate active LOINC routes results first-match, invisibly | FR-15–18 delivered + FR-71/72 + FR-62.a/d |
| 4 | 0-or-multi sample-type-link tests behave unpredictably; nothing reports them | FR-62.c |
| 5 | Variant drift: a corrected range/method on one variant never reaches siblings | FR-46/47 grouping, FR-51 group edit, FR-53 draft review |
| 6 | Custom label presets silently unattachable; admins get no order-entry feedback | FR-66/67 |
| 7 | Dead header buttons (Save toast, "Save as new test…" no-op) | FR-78 |
| 8 | Cascading type selectable but unconfigurable | FR-75 (type retired) |

---

## Navigation & URL

List `/admin/TestCatalogList` (grouped default; `?view=flat`); editor
`/MasterListsPage/TestCatalogEditor/<testId>/<section>`; create
`.../TestCatalogEditor/new/basic-info` (+ `?copyFrom=<testId>` for variants); combined
editor `.../TestCatalogEditor/group/<ids>/<section>`. SideNav: no new slots. Breadcrumb
preserves the "Admin" → "Admin Management" drift (D-013).

## Access

Entirely within the existing **Test Catalog Manager / Admin** capability. Viewers of the
list see groups, tags, and the issues toggle; users who can edit tests can link/unlink,
add variants, and are subject to the activation gate. No new roles.

## Data Model

**One declared data addition; no schema designed here.** Authority:
`openelis-design/references/test-catalog-data-model.md` (source-verified 2026-07-14).

- **Named new data element — variant-link record (FR-46):** persisted, auditable membership
  of tests in one assay group (≤1 group per test; removable). Storage mechanism (group-id
  column, junction table, or equivalent) is the dev's decision.
- Variant creation writes what the existing create path writes — one `TEST` row, one
  `SAMPLETYPE_TEST` row (D-028), copied child rows (`test_result_component`, `test_result`
  incl. Dictionary options, `result_limits` as drafts, `test_sample_handling`) — plus the
  variant link.
- Health findings compute from existing tables (`test`, `test_result_component`,
  `test_result`, `SAMPLETYPE_TEST`, `result_limits`).
- Range-review state: no new datum (derivable from audit columns; explicit flag is a
  permitted dev optimization). Terminology Display Name (FR-69) extends the existing
  mapping store — shape is dev's call.
- **Dev note (not a requirement):** DB unique constraints on `sampletype_test(test_id)` and
  `panel_item(panel_id, test_id)` would make FR-62.c unrecreatable; product deliberately
  does not specify — dev's call.

## Intake Implications (informative — e-order/accessioning thread owns the design)

The variant link is the data prerequisite for: (1) vague-LOINC resolution — combined-specimen
codes (2345-7 Ser/Plas) or XXX-system codes map BROADER_THAN onto several variants of one
group; intake resolves within the group by FHIR Specimen coding, replacing catalog-wide
first-match; (2) received-specimen ≠ ordered-specimen → "switch to the {specimen} variant"
(same assay, id swap in group, intent + audit preserved; no variant = meaningful rejection);
(3) order-before-collection — a vague-coded e-order holds at assay level until the draw
fixes the variant. None specified here.

## Out of Scope

- Bulk operations (activate/deactivate, reassign lab unit, set domain by selection) — next
  slice after this ships; row selection is designed not to preclude it.
- Auto-deactivation/auto-repair of existing bad records (FR-60 surfaces, never mutates).
- A stored assay entity beyond the variant link; per-specimen LOINC on one test;
  multi-sample-type test records (rejected; D-028).
- Sample-type-side test management (read-only there; variants are created in the Test
  Catalog — see sample-type-management v2.1).
- Cascading-type authoring (the type itself is retired, FR-75; no grouping UI will be
  built).
- Panel-side management, terminology-store architecture (per-entity vs polymorphic —
  recommendation pending), export/import of health findings.

## Non-Functional Requirements

- **NFR-1:** grouped render + findings add no perceptible list latency at 1,000 tests /
  400 groups (server-side cache, FR-65).
- **NFR-2:** groups, tags, banner, checklist, completeness panel fully keyboard-navigable
  and screen-reader labelled (group rows announce expanded/collapsed + variant count).
- **NFR-3:** all new strings localized, `[category].testCatalog.[identifier]`, universal
  English fallback (FR-22–26 delivered behavior).

## Localization (new keys — Part A + Part B; existing delivered keys unchanged)

| Key | English |
|---|---|
| `heading.testCatalog.labels.defaultLabels` | Default Labels for This Test |
| `heading.testCatalog.labels.generationSettings` | Label Generation Settings |
| `heading.testCatalog.labels.orderEntryPreview` | Order Entry Preview |
| `helper.testCatalog.labels.orderEntryPreview` | When this test is ordered, the Labels section will be pre-populated as follows |
| `label.testCatalog.labels.col.source` | Source |
| `helper.testCatalog.labels.lockedQty` | Quantities are locked at order entry while override is off |
| `label.testCatalog.terminology.displayName` | Display name |
| `helper.testCatalog.terminology.displayNameAuto` | Fetched from the terminology service — edit if needed |
| `label.testCatalog.list.noLoinc` | No LOINC |
| `helper.testCatalog.sampleResults.sigDigitsExample` | Shown to the technician as 12.3 |
| `note.testCatalog.sampleResults.rangesCrossLink` | Normal & critical ranges are set in the Ranges section |
| `label.testCatalog.sampleResults.howCaptured` | How is this result captured? |
| `empty.testCatalog.interpretations` | No flagging rules yet. Add one to auto-mark results like "Detected" as positive. |
| `button.testCatalog.options.createNew` | Create "{value}" as a new option |
| `helper.testCatalog.options.sortOrder` | The order options appear in the technician's result list |
| `helper.testCatalog.components.displayOrder` | The order components appear in result entry and on reports |
| `label.testCatalog.group.variantCount` | {n} specimen variants |
| `label.testCatalog.group.statusSummary` | {a} Active · {i} Inactive |
| `button.testCatalog.group.editTogether` | Edit variants together |
| `button.testCatalog.group.addVariant` | Add specimen variant |
| `button.testCatalog.list.viewGrouped` | Grouped |
| `button.testCatalog.list.viewFlat` | Flat |
| `label.testCatalog.list.showMoreVariants` | Show {n} more variants |
| `filter.testCatalog.list.issuesOnly` | Only tests with issues |
| `banner.testCatalog.list.issuesSummary` | {n} tests have configuration issues |
| `button.testCatalog.list.showIssues` | Show |
| `button.testCatalog.list.linkVariants` | Link as variants |
| `button.testCatalog.group.unlink` | Unlink group |
| `confirm.testCatalog.unlinkVariants` | Unlink this group? The {n} tests remain unchanged; they just stop grouping together. |
| `warning.testCatalog.activate.loinc` | LOINC check: {detail}. You can activate anyway — this is a warning, not a block. |
| `confirm.testCatalog.linkVariants` | Link these {n} tests as specimen variants of one assay? They will group together in the list. Names and codes are not changed. |
| `label.testCatalog.variant.copyFrom` | Copy from |
| `helper.testCatalog.variant.codeSuggested` | Suggested from the test name and specimen — edit to override |
| `helper.testCatalog.variant.loincBlank` | LOINC codes are specimen-specific — the source test's code applies to {specimen} only |
| `label.testCatalog.variant.domainInherited` | Inherited from {assay} — all variants share a domain |
| `tag.testCatalog.component.copied` | Copied |
| `banner.testCatalog.ranges.copiedReview` | Ranges copied from {test} — review for {specimen}, then save or mark reviewed |
| `button.testCatalog.ranges.markReviewed` | Mark ranges reviewed |
| `label.testCatalog.component.primary` | Primary component |
| `heading.testCatalog.editor.completeness` | Completeness |
| `heading.testCatalog.editor.requiredToActivate` | Required to activate |
| `heading.testCatalog.editor.advisory` | Advisory |
| `error.testCatalog.activate.blocked` | This test can't be activated yet |
| `error.testCatalog.save.blockedBy` | Saving is blocked by {section}: {detail} |
| `tag.testCatalog.finding.duplicateLoincSameSpecimen` | Duplicate LOINC (same specimen) |
| `tag.testCatalog.finding.duplicateLoincCrossSpecimen` | Duplicate LOINC (cross-specimen) |
| `tag.testCatalog.finding.noComponents` | No result components |
| `tag.testCatalog.finding.emptyOptions` | Empty select list |
| `tag.testCatalog.finding.legacyCascading` | Cascading (legacy) — convert to Multi-select |
| `tag.testCatalog.finding.sampleTypeLinks` | Sample-type link problem |
| `tag.testCatalog.finding.rangesIncomplete` | Ranges incomplete |
| `tag.testCatalog.finding.rangesUnreviewed` | Copied ranges unreviewed |
| `tag.testCatalog.finding.mixedDomains` | Mixed domains in group |
| `tag.testCatalog.finding.missingDisplayName` | Mapping missing display name |

## Acceptance spot checks

1. A custom label preset created in Label Preset Management appears in the test editor's
   Add Label Type picker; the Order Entry Preview shows type/qty/source and the locked-qty
   note when override is off. (Verify at `/MasterListsPage/TestCatalogEditor/306/labels`.)
2. Typing a nonexistent value in a Dictionary component's option search offers
   "Create '{value}' as a new option"; accepting creates the dictionary entry and appends
   it (sort order = max+1, no manual numbering needed).
3. Glucose on Serum/Plasma/CSF: linked via selection → one group row, "3 specimen
   variants"; `?view=flat` = delivered list unchanged; Unlink reverses with no field
   changes.
4. Add specimen variant from Glucose(Serum): typeahead excludes used specimens; assay name
   + domain render as static text; code pre-derives (Glucose + CSF → suggested, stops on
   edit); components arrive complete incl. the Dictionary option list; Terminology is empty
   with the specimen-specific helper; Ranges shows the copied-drafts banner until saved or
   Mark-ranges-reviewed; created Inactive.
5. New from-scratch test: primary component pre-seeded; Save & Activate with empty result
   type opens the completeness panel linking to the field; POSTing an activation for a
   zero-component test via the REST API is refused with the same rule (FR-57 API-enforced).
6. Two active tests, same LOINC + same specimen: both carry the error tag; the "! Only
   tests with issues" toggle shows them; the combined editor and activation surfaces repeat
   the warning (FR-72). The same LOINC across two *linked* variants shows Info, not
   Warning.
7. With ranges incomplete, Save names the Ranges section inline, badges it in the nav, and
   marks the rows — at no point silently inert.

## Suggested slicing (PR-sized, D-026 — the implementing dev owns the final breakdown)

| Slice | Content | Size |
|---|---|---|
| P1 | Quick corrections: FR-66/67 Labels (+ live-route verify), FR-68 legacy tab retirement, FR-78 dead buttons, FR-79 panels polish, FR-80 AMR tag, FR-86 storage value lists | S |
| P2 | LOINC surfacing: FR-71 list tag (row DTO), FR-72 combined-editor + activation checks | S–M |
| P3 | Terminology: FR-69 display name + lookup + FR-62.i backfill finding, FR-70 relationship required | M |
| P4 | Sample & Results touch-ups: FR-81/82 guidance + coaching, FR-83 inline new option, FR-84 sort-order helpers, FR-85/77 live preview, FR-76 type-aware defaults, FR-75 cascading retirement | M |
| P5 | Create integrity: FR-56–60 (pre-seeded primary, API-enforced gate, checklist, no-silent-save) | M |
| P6 | Grouped list: FR-46–50 + variant-link datum (read paths + link/unlink UI FR-51) | M–L |
| P7 | Add specimen variant: FR-52–55 (+ wire "Save as new test…" per FR-78) | M–L |
| P8 | Catalog health: FR-61–65 (server findings, tags, banner, toggle) | M |
| P9 | Combined-editor depth: FR-73/74 (schedule with P6 — same surface) | L |

Order: P1–P4 are independent of P5–P9 and can ship immediately. P6 precedes P7 (entry
points) and P9 (surface). Every slice independently shippable; acceptance criteria above
are machine-checkable per slice.

## Decisions (resolved 2026-07-14, Casey)

1. **Storage value lists — restore (FR-86).** The spec'd values are standard lab practice;
   see FR-86 in Part A.
2. **Cascading — retired (FR-75).** Removed from the chooser; existing `result_type='C'`
   tests keep working, marked legacy with a convert-to-Multi-select suggestion. The FR-30
   grouping UI is not built; the earlier gate/flag plan is superseded.
3. **Terminology store — one polymorphic store (recommendation, mechanism still dev's
   call).** One mapping shape (entity type + entity id + source + code + display name +
   relationship) serves tests, panels, and sample types: one mapper UI, one validation
   path, WHONET and Display Name added once instead of three times, and future entities
   join free. The cost is app-level (not FK-level) referential integrity on the entity id —
   acceptable in this codebase. Three parallel per-entity tables triplicate every future
   change and will drift.
