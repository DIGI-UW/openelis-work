# Test Rules Authoring — MVP Functional Requirements Specification

**Status:** Draft for review
**Author:** Casey Iiams-Hauser (caseyi@uw.edu)
**Last updated:** 2026-05-11
**Module:** Admin → Test Rules (replaces *Reflex Tests Management* + *Calculated Value Tests Management*)
**Target release:** MVP — first shippable rule-authoring redesign

---

## 1. Overview

### 1.1 Problem

OpenELIS Global today exposes two admin pages for rule authoring — *Reflex Tests Management* and *Calculated Value Tests Management* — both under *Admin → Reflex Tests Configuration*. Audit of the live testing instance (testing.openelis-global.org) surfaced consistent problems on both pages:

- Existing rules appear as collapsed cards showing only a rule name and an enable toggle. The lab manager cannot see what a rule does without opening its editor.
- The condition editor on Reflex uses a row-of-rows pattern with an "Over All Option" ANY/ALL dropdown that's jargon for OR/AND. Compound conditions with nesting are not expressible.
- The Calculated Values editor uses four "Add" buttons (Test Result, Mathematical Function, Integer, Patient Attribute) alongside a redundant *Insert Operation* dropdown carrying the same four values, with no live preview of the resulting formula or its computed output.
- Neither editor supports semantic predicates ("is outside normal," "is critically high"). Authors must hand-encode numeric thresholds against the test catalog's reference ranges, which means a range change in the catalog silently invalidates every rule that referenced the old value.
- The test/panel picker is a flat dropdown that cannot scale to deployments with hundreds of tests.
- There is no way to preview, simulate, or test a rule before saving.
- There is no template library, so common rules (TSH reflex, urine culture from dipstick, HIV cascade) get hand-rebuilt at every site rollout.

These pains have been confirmed across multiple production OpenELIS deployments and during the live audit captured 2026-05-11.

### 1.2 Scope of MVP

This spec covers the **MVP** scope of a rule-authoring redesign. MVP is defined as the smallest viable surface that replaces the current broken authoring experience and unlocks rule creation at the scale a real lab catalog requires (hundreds of tests, dozens of panels, multi-condition rules with multiple actions).

The MVP covers:

- A unified Test Rules admin page replacing both legacy pages.
- A Compose-mode authoring UI for Reflex rules using plain-English semantic predicates with AND/OR composition and multi-action support.
- A Calculated Value editor that adapts to the destination test: **formula bar** with live preview for numeric outputs, **decision table** for coded outputs.
- **Analyzer parameters** (melting points, Ct values, band-present flags, internal-control validity) as first-class condition inputs alongside test results, sourced from the existing QC-table linkage and associated with results at import.
- A searchable test/panel picker with sample-type filtering.
- A Test Catalog reference panel surfacing the catalog metadata each rule depends on, including analyzer parameters per test.
- A new rule data model based on a typed AST (semantic predicates + operator predicates) that supports future Phase 2 features (algorithm-as-graph, multi-step calc) without migration.

**Phase 2 capabilities** (formula bar for Reflex, decision-table cascade mode, algorithm-as-graph, simulator, validation tests, templates library) are documented in §10 and intentionally out of scope for MVP.

### 1.3 Success Criteria

MVP is successful when:

1. A lab manager can open the Test Rules page, scan the list, and identify what every rule does at a glance without opening an editor.
2. A lab manager can author a new compound reflex rule (≥ 2 conditions, ≥ 2 actions) in under three minutes without consulting documentation.
3. A reference-range change in the Test Catalog automatically updates every rule that uses a catalog-based predicate referencing that test — no rule re-edit required.
4. Searching for a test or panel in the action picker returns results in under 200 ms with a catalog of 500 entries.
5. Existing rules from the legacy editors are auto-migrated to the new AST without loss of semantics.
6. ISO 15189 audit reviewers can read any rule's plain-English form without lab-software training.

---

## 2. User Stories

| ID | Story |
|----|-------|
| US-1 | As a **lab manager**, I want to scan the Test Rules page and see what every rule does without opening it, so that I can audit lab automation in minutes rather than hours. |
| US-2 | As a **lab manager**, I want to author a reflex like "when TSH is outside normal AND Free T4 is less than 0.7, order the thyroid antibody panel" using plain-English questions, so that I can set up clinical automation without learning rule-builder syntax. |
| US-3 | As a **lab IT / deployment implementer**, I want to search hundreds of tests and panels by name, ID, or LOINC code with a same-sample-type default, so that I can wire up real lab catalogs at scale. |
| US-4 | As a **clinical reviewer / lab director**, I want every rule to read as a plain English sentence with the underlying catalog ranges visible, so that I can sign off on lab automation against published clinical guidelines. |
| US-5 | As a **biomedical scientist** maintaining catalog metadata, I want predicates that need ranges or thresholds to be visibly disabled in the picker with a reason ("needs critical thresholds in the catalog"), so that I know what catalog work I need to complete to unlock a question. |
| US-6 | As a **microbiology / molecular technologist**, I want to author a rule that combines analyzer-level raw values (melting points, band-present flags, internal-control validity) with reported results to produce a coded interpretation (e.g., "Wild type" vs "Rifampicin resistance suspected" for TB GenoType MTBDRplus), so that interpretation logic lives in OpenELIS as auditable rules rather than in technologists' heads. |

---

## 3. Functional Requirements

### 3.1 List View

**MVP is one page.** This is important to clarify before reading the rest of the FRS or looking at the mockups: the entire MVP product surface is the single route `/MasterListsPage/testRules` (the list view). Editing happens via inline row expansion — there is no separate editor route in MVP. Algorithms and multi-step calculations show an "Open in editor" CTA on their expanded row but those linked editors are Phase 2 work.

The dedicated preview files (`reflex-tests-redesign-preview.html`, `calculated-values-redesign-v2-preview.html`, `calc-decision-table-preview.html`) show the editors **at full width** so design reviewers can see them clearly, but those editors render *inside* an expanded list row in production. The list view preview (`test-rules-list-view-preview.html`) demonstrates the entry point and the navigation model; its placeholder inline editor is replaced by the real editor from the dedicated previews at implementation time.

**FR-1 · Unified Test Rules list.** A single admin page at `/MasterListsPage/testRules` lists every rule in the system. The legacy `reflex` and `calculatedValue` routes redirect to this page with the appropriate type filter pre-applied.

**FR-2 · Plain-language rule summary.** Each row renders the rule as `WHEN [predicate(s)] THEN [actions]` in colored phrase chips, not as code. Example: `WHEN TSH is outside normal AND FT4 is less than 0.7 THEN Order Thyroid Antibody Panel + add external note`.

**FR-3 · Type, status, and trigger columns.** Each row shows: rule type (Rule / Calculation), status (Active / Disabled), trigger description ("On TSH result," "On all inputs resulted"), last edited (date + author), and an overflow action menu.

**FR-4 · Filters.** Filter rules by type, status, trigger sample type, and trigger test. Filters are URL-encoded so links are shareable.

**FR-5 · Search.** Free-text search across rule name, referenced test name, test ID, LOINC code, and rule summary text. Search results update live as the user types; debounce 150 ms.

**FR-6 · Inline expansion.** Clicking a row's chevron expands it inline to reveal the editor. Only one row at a time may be expanded. Clicking the chevron again, or any other row, collapses the current and (optionally) expands the next.

**FR-7 · + New menu.** A primary "+ New" button on the toolbar reveals two options for MVP: *Simple rule* (Reflex) and *Simple calculation* (Calculated Value). Each menu item carries a one-line description of when to use it. *Algorithm* and *Multi-step calculation* are visible but disabled with "Phase 2" labels.

**FR-8 · Counts row.** A small counts strip above the toolbar shows total rules, active count, and per-type counts (Rules: N · Calcs: M). Each count is a clickable filter shortcut.

### 3.2 Common Authoring Concepts

**FR-9 · Rule name, status, trigger sample.** Every rule has a required name (≤ 120 chars), a status (Active / Disabled), and a trigger sample type (Serum / Plasma / Whole Blood / EDTA Tube / Urines / etc., or "Any sample type"). These appear in a single field-row at the top of every editor.

**FR-10 · Sample-type scope on Calculated Values.** Each Calculated Value rule has an "Applies to" control: *All sample types* (rule fires whenever every input test has a numeric result regardless of sample type) or *Selected sample types* (rule fires only on the listed sample types). Multi-select chips list the selected sample types. Default for new rules: *Selected sample types* containing the trigger sample.

**FR-11 · Multiple conditions with AND/OR.** Both Reflex and Calculated Values support compound conditions. Conditions are joined with AND or OR. Parens for grouping are supported in Formula bar (Calculated Values) but not in MVP Compose mode (defer nested groups to Phase 2 — flat AND/OR is sufficient for the rules a lab authors at MVP launch).

**FR-12 · Multiple actions per rule.** Reflex rules carry an ordered list of actions. Calculated Value rules write exactly one final result (the destination test) per rule but may include note actions in MVP — currently this is captured as a single action of type `compute`. (Multi-step calcs writing multiple intermediates are Phase 2.)

### 3.3 Reflex Authoring — Compose Mode

**FR-13 · Compose mode is the default Reflex editor.** Conditions are authored as a row-list. The first row begins "WHEN"; subsequent rows pick AND or OR from a joiner dropdown. Each row has three picker controls: test, predicate (question), and (when the predicate takes a value) one or more value inputs.

**FR-14 · Test picker.** Each condition row's test picker is a searchable combobox over all numeric and coded tests in the Test Catalog. Reflex-only tests (those orderable but not result-producing) are excluded from condition rows.

**FR-15 · Predicate picker.** After picking a test, the predicate dropdown shows all available predicates grouped into three optgroups:

- **Catalog-based** — uses the test's reference range, critical thresholds, or delta threshold. Includes: `is within the normal range`, `is outside the normal range`, `is above the normal range`, `is below the normal range`, `is critically high`, `is critically low`, `is at a critical value (either direction)`, `has an abnormal flag`. (The `has changed significantly from the prior result` predicate is included when the catalog defines a delta threshold for that test.)
- **Specific value** — author enters a numeric threshold. Includes: `is greater than (>)`, `is at least (≥)`, `is less than (<)`, `is at most (≤)`, `is exactly (=)`, `is between (inclusive)`. Available on every numeric test regardless of catalog metadata.
- **Coded value** — for tests with discrete coded results (HIV Reactive/Non-Reactive, Strep Positive/Negative). Two predicates only: `is…` and `is not…`. Both take a multi-select set of coded values; the rendered phrase reads "X is Reactive" (single) or "X is Reactive or Weak Reactive" (multi).

**FR-16 · Predicate availability — disabled with reason.** Predicates the selected test cannot support are shown in the dropdown but disabled, with the unmet requirement appended to the label. Example for a coded test: `is critically high — needs critical thresholds in the catalog`. The five disabling reasons are: needs a reference range, needs critical thresholds, needs a delta threshold, needs coded values, needs a numeric test type.

**FR-17 · Value input per predicate.** When a predicate with a `valueInput` field is selected, an input renders inline next to the predicate dropdown. Input types: `number` (single number with units label), `range` (two numbers joined by "and"), `coded` (single-select from the test's coded values), `codedMulti` (checkbox set over the coded values).

**FR-18 · Rule reads as.** A persistent blue panel at the top of the editor renders the entire rule as a flowing plain-English sentence using the test names, predicate phrases (with substituted values where applicable), and the AND/OR joiners. Example: *"Reflex the thyroid antibody panel when **TSH** is outside the normal range **AND** **FT4** is less than 0.7 ng/dL."* This is the artifact reviewers sign off on.

**FR-19 · Action list with prominent + Add affordance.** Below the conditions, a "THEN do all of the following" section lists actions. Each action row has: an action-type dropdown, type-specific fields, and a delete control. Below the rows, a full-width dashed blue `+ Add another action` button with hint text listing available action types.

**FR-20 · Action types — MVP.** Three action types: `Order Test or Panel`, `Internal Note` (visible to lab staff only), `External Note` (visible to clinician). The `Order Test or Panel` action carries: target (test or panel), priority (Routine / STAT / Urgent), and an optional reason string. `Send Alert` is Phase 2 (needs alerts subsystem integration). `Set Priority` is intentionally NOT included — priority is already a field on `Order Test`; a standalone "set priority" action was confusing and is removed from the design.

### 3.4 Calculated Values Authoring — Formula Bar

**FR-21 · Formula bar is the default Calculated Values editor.** A monospace text input with syntax-highlighted overlay. Identifiers are colored by token type (test result → blue, function → purple, operator → pink, constant → green). Unknown identifiers are underlined with a red wavy line and surfaced in the inline lint summary.

**FR-22 · Variable picker side panel.** A tabbed side panel lists insertable items grouped by Test Results, Patient Attributes (Age, Sex, Sample), and Functions (`min`, `max`, `mean`, `log`, `pow`, `round`, `if`, `eq`). Each entry is click-to-insert at the cursor.

**FR-22a · Keyboard shortcut for variable picker.** Typing `@` in the formula bar opens an inline autocomplete picker at the cursor anchored to the current word, identical in shape to the side panel's match list. **Do not use `/`** — it conflicts with the division operator and would break arithmetic formulas like Friedewald LDL (`TC - HDL - TRIG/5`). Functions are surfaced via `Ctrl+Space`. `Escape` closes the inline picker. `Tab` or `Enter` accepts the highlighted suggestion. The `@` glyph is consumed when the user selects a suggestion (it's the trigger, not part of the inserted identifier). If no suggestion exists, the literal `@` is preserved and a lint warning marks it as an unknown character.

**FR-23 · Math view (rendered formula).** Below the formula bar, a read-only "Rendered" panel displays the formula in proper math notation: variables shown as pills with their units, division rendered as a fraction bar, parens balanced. This is the artifact reviewers sign off on for calculated values.

**FR-24 · Live preview with sample inputs.** A right pane shows one numeric input per variable referenced in the formula. As the author edits inputs or the formula itself, the computed output recomputes and renders in a green result tile with the output's units. If the computed value falls in a flagged reference range, the flag (e.g., "Optimal," "Borderline high") renders below the value.

**FR-25 · Output destination.** Each Calculated Value rule writes to exactly one destination test in the Test Catalog. The destination test is selected via the same searchable test picker (FR-27).

**FR-26 · Catalog-based and specific-value references in `if()`.** Calculated Values support semantic predicates inside `if()` (e.g., `if(isFemale(Sex), formula1, formula2)`). The flowchart panel rendering branching is Phase 2; MVP renders `if()` as text.

### 3.4a Calculated Value Output Kind — Numeric vs Coded

**FR-26a · Output kind is driven by the destination test.** Every Calculated Value rule writes to exactly one destination test in the Test Catalog. The rule's output kind is determined by the destination test's `type` field: a numeric destination yields a `numeric` output kind; a coded destination yields a `coded` output kind. Authors do not toggle output kind separately — choosing the destination chooses the editor.

**FR-26b · Numeric output → formula bar.** When output kind is `numeric`, the editor uses the Formula bar pattern (FR-21 through FR-26): one formula expression, math view, live preview against sample inputs, units, decimals, optional `if()` branches.

**FR-26c · Coded output → decision table.** When output kind is `coded`, the editor uses a Decision Table pattern. The author writes a list of rules; each rule is a Compose-style condition block (using the same predicate vocabulary as Reflex) plus a single result picker drawn from the destination test's coded value list. Evaluation is top-down, first match wins. The rule list is followed by a required **Otherwise** row whose result also picks from the destination's coded values; this guarantees every input produces a defined output. Each rule supports the move-up / move-down / delete controls in its header.

**FR-26d · Coded output simulator.** The right pane of a coded-output editor shows one input control per referenced input (test result or analyzer parameter). As inputs change, the simulator evaluates all rules top-down and displays the computed result with the matched rule number (or "Otherwise — fell through" when no rule matches). Result rendering matches the destination test's display formatting.

**FR-26e · Coded-output rule reads-as preview.** Each rule renders an inline plain-English sentence summarizing its condition chain. The decision table header shows the destination test name and possible-values chips at the top of the editor.

### 3.4b Analyzer Parameters as Rule Inputs

**FR-26f · Analyzer parameter as TestRef target.** A condition row's input is not limited to a test's reported result. When the catalog associates analyzer parameters with a test (FR-26h), each parameter becomes a selectable input in the input picker. The reference shape is `{ testId, paramId? }` — `paramId` absent means "the test result," `paramId` present means "this analyzer parameter for this test."

**FR-26g · Picker distinguishes results from parameters.** The input picker shows analyzer parameters and reported results as siblings in the same searchable list. Each option carries a distinct chip — `RESULT` (blue) vs `PARAM` (purple) — and a metadata line showing the parameter ID, units, and (for coded params) possible values. Search matches against the parameter's name, its parent test's ID, and its parameter ID (e.g., `TB_GT.rpoB_mp`).

**FR-26h · Analyzer parameter metadata in catalog.** The Test Catalog optionally stores a list of analyzer parameters per test. Each parameter has: a parameter ID (unique within the test), a human-readable name, a type (`numeric` or `coded`), units (for numeric), reference range (for numeric, optional), and possible values (for coded). The metadata is populated from the existing **QC table**: instrument-side fields already captured for QC purposes are linked to patient results at result-import time, then surfaced to the catalog and to the rule editor.

**FR-26i · Predicate vocabulary applies uniformly.** All predicates from §3.3 (`isOutsideNormal`, `isCritical`, `gt`, `between`, `is`, `isNot`, etc.) work on analyzer parameters the same way they work on test results. Availability is governed by parameter metadata using the same rules in FR-16: a numeric parameter with a `refRange` supports catalog-based predicates; a coded parameter supports `is`/`is not`; all numeric parameters support specific-value comparison predicates.

**FR-26j · Catalog reference card includes parameters.** The right-pane Test Catalog reference card (FR-30) lists the analyzer parameters for each referenced test, grouped under a section labeled "Analyzer parameters" with a source indicator ("via QC table linkage · N captured"). Each parameter row shows its ID, name, type, and the relevant catalog metadata (units, range, or values).

### 3.5 Test / Panel Picker

**FR-27 · Searchable picker.** The picker is a combobox with:
- A text input that filters in real time across name, ID, and LOINC code.
- A selected-item pill (with a clear ✕) showing the picked entity, its kind chip (Test or Panel), name, and ID.
- A dropdown list of matches grouped by Tests and Panels with section headers and counts.
- Each match row shows: kind chip, name, metadata line (ID, LOINC or type, units, panel members if applicable), and the sample-type chip.
- Match list is capped at 12 tests + 8 panels visible at once with "…and N more — refine your search" overflow.

**FR-28 · Sample-type filter.** At the top of the picker dropdown, two radio buttons:
- **Same sample type only** (default) — filters to entities whose sample matches the rule's trigger sample.
- **All sample types — requires new collection** — broadens the search. An amber warning bar appears in the dropdown: *"Cross-sample reflex — firing this rule will trigger an order with a different sample type than the trigger. The lab will need to collect a new specimen."*

**FR-29 · Cross-sample audit reason.** When a rule's order target uses a different sample type than the trigger sample, the rule must carry an `auditReason` string field (≤ 240 chars) explaining the cross-sample justification. The reason is shown on the rule's row in the list view, on the order itself when the rule fires, and in the rule's revision history. Save fails with an inline error if the reason is missing for any cross-sample target.

### 3.6 Test Catalog Reference

**FR-30 · Catalog reference card.** The right pane of every Reflex rule editor includes a "Test catalog data" card listing each test referenced by the rule's conditions. Each card shows the test's reference range, critical thresholds, delta threshold, and coded values from the catalog. Missing fields render as grey-italic placeholders ("No critical thresholds set"). A "→ Edit in Test Catalog" link opens the test's catalog entry in a new tab.

**FR-31 · Symbolic references in stored AST.** Catalog-based predicates store a symbolic reference to the test, not a snapshot of the range values. When a test's reference range or critical thresholds change in the catalog, every rule using a catalog-based predicate on that test reflects the change without requiring re-edit or re-save.

**FR-32 · Catalog change audit log.** A reference-range or critical-threshold change in the Test Catalog generates an audit-log entry that includes: which catalog field changed, the old and new values, the user who made the change, the timestamp, and a list of every rule (by ID) whose evaluation behavior changed as a result. The list view exposes a filter "Rules affected by recent catalog change" that shows only rules whose evaluation may have shifted in the last 30 days.

### 3.6a Unified Input Picker

**FR-30a · One Input Picker component used everywhere.** A single React component (`UnifiedInputPicker`) handles every place the user is selecting something testable. The picker has two modes:

- **`mode: 'input'`** — for condition rows. Search across test results AND analyzer parameters. No panels. No sample-type filter.
- **`mode: 'target'`** — for action targets (Order Test or Panel). Search across tests AND panels. No analyzer parameters. Sample-type filter active (same-sample default; "All sample types — requires new collection" override).

The picker renders as a chip-style trigger button showing the human-readable name and a small monospace technical ID. The dropdown panel includes a search field, optgroup-style section headers (Tests / Analyzer parameters / Panels), and per-row kind chips (`RESULT` / `PARAM` / `PANEL`).

**FR-30b · Picker accessibility.** The trigger is a `<button>` with `aria-haspopup="listbox"` and `aria-expanded`. The dropdown panel is `role="listbox"`. Escape closes the dropdown and returns focus to the trigger. Clicking outside also closes. Items are buttons; keyboard arrow navigation through the dropdown is required.

**FR-30c · Picker selected-value clear control.** The trigger chip carries an inline ✕ that clears the selection without opening the dropdown. The clear button is accessible (`role="button"`, `aria-label="Clear selection"`).

### 3.7 Save, Validation, and Status

**FR-33 · Save validates required fields.** Save fails if: rule name is blank or > 120 chars; no conditions are defined; any condition row is incomplete (test, predicate, or required value missing); no actions are defined; any action's target or required field is missing; cross-sample reflex audit reason is missing.

**FR-34 · Status toggle with confirmation.** Each rule has a single `Active / Disabled` toggle. The legacy "Toggle Rule" switch and "Active: true" checkbox duplicate of the current UI is replaced with this one control. Disabled rules never fire but remain editable. Switching from Active to Disabled prompts a confirmation modal (Carbon `Modal` with `kind="danger"`) explaining the consequences ("this rule will stop firing immediately on save; existing reflex orders are not affected; you can re-enable any time from the row's overflow menu"). Re-enabling does not require confirmation.

**FR-35 · Audit metadata.** Each rule stores `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, and `revisionCount`. The list view exposes "last edited by" inline.

### 3.8 UI States

**FR-36 · Empty state — list view.** When the system has zero rules (fresh deployment) or current filters yield zero matches, the table is replaced with an empty-state block containing an icon, a title, an explanatory subtitle, and a primary "+ Create your first rule" button. The empty-state distinguishes "no rules exist" from "no matches" via the subtitle copy.

**FR-37 · Empty state — editor.** A new rule opens with a single empty condition row and a single empty action row pre-laid-out. Placeholders read "Pick an input first to see questions you can ask." Save is disabled until the rule has at least one complete condition row and one complete action.

**FR-38 · Saving state.** While a save mutation is in flight, the Save button label changes to "Saving…", the Save and Cancel buttons are `disabled`, and the Save button carries `aria-busy="true"`. The entire editor remains visible so the user understands what's being saved.

**FR-39 · Save-failed state.** When save returns a validation error, an `InlineNotification` with `kind="error"` appears above the footer actions listing every problem (one per `<li>`). The first error condition or action row also receives an inline error indicator (red border on the picker or value input) and focus jumps to the first invalid field. The error block is `role="alert"` so screen readers announce it.

**FR-40 · Confirmation modals for destructive actions.** A modal appears when the user: disables an Active rule (FR-34), deletes a rule, or deletes a rule via batch action (FR-41). Modal uses Carbon `Modal` with primary button `kind="danger"` and a clear consequence statement.

### 3.9 List View Batch Operations

**FR-41 · Multi-select on list view.** Each row has a leading checkbox. A select-all checkbox in the table header selects every row matching the current filter. Selected rows are visually highlighted.

**FR-42 · Batch action bar.** When ≥ 1 row is selected, a sticky action bar appears at the top of the table with the selected count, action buttons (Enable, Disable, Export CSV, Delete…), and a Clear-selection ✕. The Delete action triggers FR-40's confirmation. Enable/Disable apply individually to each selected rule's status.

**FR-43 · Batch operation safety.** Batch Delete shows the count of rules to be deleted in the confirmation modal and requires the user to type "DELETE" before the confirm button is enabled (Phase 2 — MVP uses a single-tap confirm with the count).

---

## 4. Data Model

### 4.1 Rule entity

```
Rule {
  id: UUID
  name: String(120)
  type: enum { reflex, calc }
  status: enum { active, disabled }
  triggerSample: SampleType | "any"

  // Reflex-only
  conditionTree: ConditionAST?      // present when type=reflex
  actions: List<Action>?            // present when type=reflex

  // Calc-only
  destinationTest: TestRef?         // present when type=calc; drives outputKind
  outputKind: enum { numeric, coded }? // derived from destinationTest's type
  formula: FormulaAST?              // present when type=calc AND outputKind=numeric
  decisionTable: DecisionTable?     // present when type=calc AND outputKind=coded
  outputUnits: String?              // numeric calc only
  outputDecimals: Integer?          // numeric calc only
  appliesTo: SampleScope            // calc only — {mode: 'all'|'selected', samples: List<SampleType>}

  // Shared
  auditReason: String(240)?         // required if any reflex action or calc input crosses sample type
  createdAt, updatedAt: Timestamp
  createdBy, updatedBy: UserRef
  revisionCount: Integer
}
```

### 4.2 Condition AST

```
ConditionAST = ConditionGroup | Predicate

ConditionGroup {
  op: enum { AND, OR }
  children: List<ConditionAST>     // MVP: flat list (depth = 1); Phase 2 allows nesting
}

Predicate {
  predicateId: String              // e.g. "isOutsideNormal", "gt", "is", "isNot"
  testRef: TestRef                 // symbolic reference into Test Catalog (see 4.3a)
  value?: Number | [Number, Number] | String | List<String>
                                   // shape depends on predicateId's valueInput
}
```

### 4.2a TestRef — reported result OR analyzer parameter

```
TestRef {
  testId: TestID
  paramId?: AnalyzerParamID        // when present, the predicate references the named
                                   // analyzer parameter on this test, not the reported result
}
```

Examples:
- `{ testId: "TSH" }` — TSH's reported numeric result.
- `{ testId: "HIV_Screen" }` — HIV Screen's reported coded result.
- `{ testId: "TB_GT", paramId: "rpoB_mp" }` — rpoB melting point captured by the TB GenoType analyzer.
- `{ testId: "TB_GT", paramId: "IC" }` — TB GenoType internal-control validity flag.

### 4.2b DecisionTable — coded-output Calculations

```
DecisionTable {
  rules: List<DecisionRule>
  otherwise: CodedValue            // required — picks from destinationTest's coded values
}

DecisionRule {
  id: Integer                      // stable within the table; used for revision diffs
  condition: ConditionAST          // same shape as Reflex conditions
  result: CodedValue               // picks from destinationTest's coded values
}
```

Evaluation: rules are evaluated top-down in order; the first whose `condition` evaluates to true determines the result. If no rule matches, the `otherwise` value is the result. Order is preserved across saves and is the author's responsibility (move-up / move-down controls in the editor).

### 4.3 Predicate catalog (MVP set)

| ID | Group | Requires (catalog metadata) | Value input | Compiles to |
|----|-------|------------------------------|-------------|-------------|
| `isNormal`             | catalog | refRange      | none      | `T >= refLow AND T <= refHigh` |
| `isOutsideNormal`      | catalog | refRange      | none      | `T < refLow OR T > refHigh` |
| `isAboveNormal`        | catalog | refRange      | none      | `T > refHigh` |
| `isBelowNormal`        | catalog | refRange      | none      | `T < refLow` |
| `isCritical`           | catalog | criticalRange | none      | `T <= criticalLow OR T >= criticalHigh` |
| `isCriticallyHigh`     | catalog | criticalRange | none      | `T >= criticalHigh` |
| `isCriticallyLow`      | catalog | criticalRange | none      | `T <= criticalLow` |
| `isFlagged`            | catalog | refRange      | none      | `flag(T) != "N"` |
| `changedSignificantly` | catalog | deltaPct      | none      | `abs(T - prior(T)) / prior(T) * 100 >= deltaPct` |
| `gt`, `gte`, `lt`, `lte`, `eq` | value | numeric | number | `T <op> v` |
| `between`              | value   | numeric       | range     | `T >= lo AND T <= hi` |
| `is`                   | coded   | values        | codedMulti| `T == "v"` or `T IN (...)` |
| `isNot`                | coded   | values        | codedMulti| `T != "v"` or `T NOT IN (...)` |

### 4.4 Action

```
Action = OrderAction | NoteAction

OrderAction {
  kind: "order"
  target: { kind: "test" | "panel", id: ID }
  priority: enum { routine, stat, urgent }
  reason: String(240)?
}

NoteAction {
  kind: "note_internal" | "note_external"
  text: String(2000)
}
```

### 4.5 Formula AST (Calculated Values)

```
FormulaAST = Literal | TestRef | AttrRef | BinaryOp | FunctionCall | IfExpression

Literal       { value: Number }
TestRef       { testId: TestID }
AttrRef       { attrId: "Age" | "Sex" | "Sample" }
BinaryOp      { op: enum { +,-,*,/,>,<,>=,<=,==,!=,AND,OR }, left, right }
FunctionCall  { fn: enum { min, max, mean, log, pow, round, if, eq, abs }, args: List<FormulaAST> }
IfExpression  { condition: FormulaAST, then: FormulaAST, else: FormulaAST }
```

### 4.6 Test Catalog dependencies

The redesign treats the Test Catalog as the source of truth for:
- Test ID, name, LOINC code, type (numeric / coded / reflex)
- Sample type
- Units
- Reference range (`refLow`, `refHigh`)
- Critical thresholds (`criticalLow`, `criticalHigh`)
- Delta threshold percentage
- Coded values (for coded-result tests)
- **Analyzer parameters** (list per test, see §4.6a)

The MVP assumes all of the above are already capturable in the existing OpenELIS test catalog. Open Question OQ-3 in §11 calls out the items that may need schema work.

### 4.6a Analyzer parameters

Each Test in the catalog optionally carries a list of analyzer parameters that the analyzer reports alongside the reportable result:

```
AnalyzerParameter {
  id: AnalyzerParamID              // unique within the parent test (e.g., "rpoB_mp", "IC")
  name: String                     // human-readable label
  type: enum { numeric, coded }
  units?: String                   // when type=numeric
  refRange?: [Number, Number]      // when type=numeric — informational, enables catalog-based predicates
  values?: List<String>            // when type=coded
}
```

**Source of parameter data:** Analyzer parameters are sourced from the existing QC table in OpenELIS, which already captures instrument-side fields for quality control purposes. The required change is:

1. **At result import time**, when an analyzer reports a patient result, the same instrument-side fields already captured for QC are associated with the patient's `Result` record as `analyzerParameterValues` keyed by `paramId`.
2. **The Test Catalog editor** is extended to allow per-test definition of which analyzer parameters are exposed for rule authoring. The mapping between catalog `paramId` and the QC-table field is the catalog's responsibility.

This is the only new persistence work in MVP scope.

### 4.7 Panel entity

```
Panel {
  id: ID
  name: String
  sample: SampleType
  testIds: List<TestID>          // ordered list of constituent tests
}
```

Panels are first-class catalog entities for MVP. If they are not already first-class in OpenELIS (Open Question OQ-4), a panel-management UI in Test Catalog is a co-dependency of MVP.

---

## 5. UI / UX Specification

### 5.1 Layout patterns

- **List view → inline expansion** for rule editing (per Constitution: no modals for forms).
- **Two-pane editor** inside the expansion: left = authoring (Compose or Formula bar), right = reference (Test Catalog data card for Reflex; Live Preview for Calculated Values).
- **Full-width Add CTAs** for Add Condition / Add Action: dashed blue border, plus-circle badge, clear label and hint text.
- **Persistent rule preview** ("Rule reads as") at the top of every editor.

### 5.2 Primary Carbon components

- `DataTable` — rule list with column headers, sortable.
- `Tile` — editor panels (left pane, right pane).
- `Tag` — status (green Active / gray Disabled), type chips, sample-type chips.
- `ComboBox` — searchable test/panel picker; variable picker for Calculated Values.
- `MultiSelect` — sample-type scope selection on calc rules.
- `Select` — predicate dropdown (with native `optgroup` + `disabled` options for unavailable predicates).
- `TextInput`, `NumberInput`, `TextArea` — name, reason, note, value inputs.
- `Toggle` — Active/Disabled status.
- `Accordion` — collapsible Test Catalog reference card, advanced settings.
- `Button` (primary, secondary, ghost, danger) — Save, Cancel, action add, delete row.
- `InlineNotification` — validation errors on save; cross-sample warning in picker.
- `Modal` — only for destructive confirmation (delete rule).

### 5.3 Token color conventions

| Token kind | Color | Use |
|------------|-------|-----|
| Test variable      | `#0043ce` (blue 70) | Test ID references |
| Patient attribute  | `#a2191f` (red 70) | Age, Sex, Sample |
| Function           | `#491d8b` (purple 70) | min, max, log, if |
| Predicate (rendered phrase) | `#0072c3` (cyan 60) | isOutsideNormal in text form |
| Operator           | `#d12771` (magenta 60) | `+`, `-`, `*`, `/`, `>`, etc. |
| Boolean keyword    | `#8a3ffc` (purple 50) | AND, OR, NOT, IN |
| Number             | `#198038` (green 50) | Literals |
| String / coded     | `#0e6027` (green 60) | "Reactive" |
| Unknown identifier | `#a2191f` underline wavy | Lint error |

### 5.4 Accessibility (WCAG 2.1 AA)

- All form controls keyboard accessible.
- The Compose row joiner dropdown receives focus order between rows.
- The searchable picker is keyboard-navigable: Tab into the search input, arrow keys to move through matches, Enter to select, Escape to close.
- Color contrast on token rendering meets 4.5:1 against the white panel background (verified for the chosen IBM Plex Sans body weight).
- Disabled predicate options retain their disabled-reason text in the option label (not as a tooltip alone) so screen readers announce the reason.
- The "Cross-sample reflex" warning bar uses both the amber color and a ⚠ icon plus explicit text — not color alone.

---

## 6. Localization

Every visible UI string is wrapped in `t(key, fallback)` per Constitution Principle 1. Keys follow the `rules.[area].[identifier]` convention.

| Key | English fallback | Context |
|-----|------------------|---------|
| `rules.list.page_title` | Test Rules | List page H1 |
| `rules.list.search_placeholder` | Search rules by name, test, or destination… | Toolbar search |
| `rules.list.new_button` | + New | Toolbar primary button |
| `rules.list.new_rule` | Simple rule | + New menu item |
| `rules.list.new_calc` | Simple calculation | + New menu item |
| `rules.list.col_type` | Type | Table column |
| `rules.list.col_status` | Status | Table column |
| `rules.list.col_rule` | Rule | Table column |
| `rules.list.col_trigger` | Trigger | Table column |
| `rules.list.col_edited` | Last edited | Table column |
| `rules.list.filter_status_all` | Status: All | Filter pill |
| `rules.list.filter_sample_all` | Sample: All | Filter pill |
| `rules.list.empty_message` | No rules match your filters. | Empty state |
| `rules.status.active` | Active | Status tag |
| `rules.status.disabled` | Disabled | Status tag |
| `rules.type.rule` | Rule | Type chip |
| `rules.type.calc` | Calculation | Type chip |
| `rules.editor.name_label` | Rule name | Editor field label |
| `rules.editor.trigger_sample_label` | Trigger sample | Editor field label |
| `rules.editor.when_block` | WHEN | Block header |
| `rules.editor.then_block` | THEN do all of the following | Block header |
| `rules.editor.reads_as_label` | RULE READS AS | Preview header |
| `rules.editor.add_condition` | Add another condition | Add CTA |
| `rules.editor.add_condition_hint` | join with AND or OR | Add CTA hint |
| `rules.editor.add_action` | Add another action | Add CTA |
| `rules.editor.add_action_hint` | Order test · Order panel · Note | Add CTA hint |
| `rules.editor.save` | Save changes | Footer button |
| `rules.editor.cancel` | Cancel | Footer button |
| `rules.compose.pick_test` | — select test — | Test picker placeholder |
| `rules.compose.pick_question` | — pick a question — | Predicate picker placeholder |
| `rules.compose.pick_test_first` | Pick a test first to see questions you can ask | Predicate picker disabled state |
| `rules.compose.joiner_when` | WHEN | First-row joiner label |
| `rules.compose.joiner_and` | AND | Joiner option |
| `rules.compose.joiner_or` | OR | Joiner option |
| `rules.action.order` | Order Test or Panel | Action type |
| `rules.action.note_internal` | Internal Note | Action type |
| `rules.action.note_external` | External Note | Action type |
| `rules.action.priority_routine` | Routine | Priority option |
| `rules.action.priority_stat` | STAT | Priority option |
| `rules.action.priority_urgent` | Urgent | Priority option |
| `rules.action.reason_placeholder` | Reason (visible on order) | Reason input placeholder |
| `rules.action.note_internal_placeholder` | Internal note (visible to lab staff) | Note input placeholder |
| `rules.action.note_external_placeholder` | External note (visible to clinician) | Note input placeholder |
| `rules.picker.search_placeholder` | Search tests and panels… | Picker input placeholder |
| `rules.picker.scope_same` | Same sample type only | Picker filter radio |
| `rules.picker.scope_all` | All sample types | Picker filter radio |
| `rules.picker.scope_warning` | requires new collection | Picker filter chip |
| `rules.picker.cross_sample_warning` | Cross-sample reflex — firing this rule will trigger an order with a different sample type than the trigger. The lab will need to collect a new specimen. | Picker amber warning |
| `rules.picker.no_matches` | No matches. | Empty results |
| `rules.picker.tests_section` | Tests | Section header |
| `rules.picker.panels_section` | Panels | Section header |
| `rules.predicate.is_normal` | is within the normal range | Catalog predicate label |
| `rules.predicate.is_outside_normal` | is outside the normal range | Catalog predicate label |
| `rules.predicate.is_above_normal` | is above the normal range | Catalog predicate label |
| `rules.predicate.is_below_normal` | is below the normal range | Catalog predicate label |
| `rules.predicate.is_critical` | is at a critical value (either direction) | Catalog predicate label |
| `rules.predicate.is_critically_high` | is critically high | Catalog predicate label |
| `rules.predicate.is_critically_low` | is critically low | Catalog predicate label |
| `rules.predicate.is_flagged` | has an abnormal flag | Catalog predicate label |
| `rules.predicate.changed_significantly` | has changed significantly from the prior result | Catalog predicate label |
| `rules.predicate.gt` | is greater than (>) | Value predicate label |
| `rules.predicate.gte` | is at least (≥) | Value predicate label |
| `rules.predicate.lt` | is less than (<) | Value predicate label |
| `rules.predicate.lte` | is at most (≤) | Value predicate label |
| `rules.predicate.eq` | is exactly (=) | Value predicate label |
| `rules.predicate.between` | is between (inclusive) | Value predicate label |
| `rules.predicate.is` | is… | Coded predicate label |
| `rules.predicate.is_not` | is not… | Coded predicate label |
| `rules.predicate.disabled_refrange` | needs a reference range in the catalog | Disabled-reason suffix |
| `rules.predicate.disabled_critical` | needs critical thresholds in the catalog | Disabled-reason suffix |
| `rules.predicate.disabled_delta` | needs a delta threshold in the catalog | Disabled-reason suffix |
| `rules.predicate.disabled_values` | needs coded values in the catalog | Disabled-reason suffix |
| `rules.predicate.disabled_numeric` | needs a numeric test type | Disabled-reason suffix |
| `rules.catalog_ref.title` | Test catalog data | Right-pane title |
| `rules.catalog_ref.subtitle` | What's defined in the catalog for each test in this rule. | Right-pane subtitle |
| `rules.catalog_ref.no_refrange` | No reference range set | Missing-metadata placeholder |
| `rules.catalog_ref.no_critical` | No critical thresholds set | Missing-metadata placeholder |
| `rules.catalog_ref.no_delta` | No delta threshold set | Missing-metadata placeholder |
| `rules.catalog_ref.edit_link` | Edit in Test Catalog | Catalog deep link |
| `rules.calc.applies_to_label` | Applies to | Sample-scope header |
| `rules.calc.applies_to_all` | All sample types | Sample-scope radio |
| `rules.calc.applies_to_selected` | Selected sample types | Sample-scope radio |
| `rules.calc.output_dest_label` | Destination test | Output picker label |
| `rules.calc.output_units_label` | Units | Output units label |
| `rules.calc.output_decimals_label` | Decimals | Output decimals label |
| `rules.calc.preview_title` | Live preview | Preview pane title |
| `rules.calc.preview_subtitle` | Edit the formula on the left or change inputs here. Output recomputes live. | Preview pane subtitle |
| `rules.calc.computed_label` | Computed | Computed-value tile label |
| `rules.calc.flag_label` | Flag | Flag inline label |
| `rules.error.name_required` | Rule name is required. | Save validation error |
| `rules.error.no_conditions` | Add at least one condition. | Save validation error |
| `rules.error.no_actions` | Add at least one action. | Save validation error |
| `rules.error.incomplete_condition` | One or more conditions are incomplete. | Save validation error |
| `rules.error.cross_sample_reason_required` | Cross-sample reflex requires an audit reason. | Save validation error |
| `rules.error.otherwise_required` | Pick an Otherwise result so every input produces a defined output. | Save validation error |
| `rules.calc.output_kind_label` | Output type | Editor field label |
| `rules.calc.output_kind_numeric` | Numeric | Output kind chip |
| `rules.calc.output_kind_coded` | Coded | Output kind chip |
| `rules.calc.output_destination_label` | Output goes to | Decision-table destination header |
| `rules.calc.output_destination_hint` | Because the destination is a coded test, the editor uses a decision table instead of a formula bar. Each row maps a condition to one of the possible result values. First match wins. | Decision-table editor hint |
| `rules.calc.decision_rule_n` | Rule {n} | Decision rule card title |
| `rules.calc.then_result_is` | THEN result is | Decision rule THEN bar label |
| `rules.calc.pick_result` | — pick a result — | Result picker placeholder |
| `rules.calc.otherwise_title` | Otherwise (if no rule above matches) | Otherwise row title |
| `rules.calc.otherwise_subtitle` | A catch-all so every input produces a defined output. Required. | Otherwise row subtitle |
| `rules.calc.add_decision_rule` | Add another rule | + Add rule CTA |
| `rules.calc.add_decision_rule_hint` | evaluated top-down; first match wins | + Add rule hint |
| `rules.calc.move_up` | Move up | Rule card move-up button |
| `rules.calc.move_down` | Move down | Rule card move-down button |
| `rules.calc.delete_rule` | Delete rule | Rule card delete button |
| `rules.calc.simulator_result_label` | Computed result | Simulator output label |
| `rules.calc.simulator_matched` | Matched Rule {n} (top-down evaluation) | Simulator trace label |
| `rules.calc.simulator_otherwise` | No rule matched — fell through to Otherwise. | Simulator trace label (else) |
| `rules.picker.kind_result` | Result | Picker chip for test result |
| `rules.picker.kind_param` | Param | Picker chip for analyzer parameter |
| `rules.catalog_ref.params_section` | Analyzer parameters | Catalog card section header |
| `rules.catalog_ref.params_source` | via QC table linkage · {n} captured | Catalog card source line |
| `rules.list.empty_title` | No rules yet | List empty-state title |
| `rules.list.empty_desc` | Reflex rules and calculations live here. Start by creating one. | List empty-state subtitle |
| `rules.list.empty_filter_desc` | No rules match your filters. Try clearing them or change the search. | List empty-state subtitle (filtered) |
| `rules.list.empty_create` | + Create your first rule | List empty-state CTA |
| `rules.list.batch_count` | {n} selected | Batch action bar count |
| `rules.list.batch_enable` | Enable | Batch action |
| `rules.list.batch_disable` | Disable | Batch action |
| `rules.list.batch_export` | Export CSV | Batch action |
| `rules.list.batch_delete` | Delete… | Batch action |
| `rules.list.batch_clear` | Clear selection | Batch clear button (sr-only label) |
| `rules.editor.save_in_progress` | Saving… | Save button (in flight) |
| `rules.editor.save_error_title` | Couldn't save this rule — please fix the issues below: | Save-error block title |
| `rules.editor.disable_rule` | Disable rule | Editor disable button |
| `rules.editor.disable_confirm_title` | Disable this rule? | Confirmation modal title |
| `rules.editor.disable_confirm_body` | This rule will stop firing immediately on save. Existing reflex orders are not affected. You can re-enable from the row's overflow menu at any time. | Confirmation modal body |
| `rules.editor.disable_confirm_action` | Disable rule | Confirmation modal danger button |
| `rules.editor.cancel_action` | Cancel | Generic cancel button |
| `rules.picker.kind_panel` | Panel | Picker chip for panel |
| `rules.calc.formula_hint` | Press @ for variable picker · Ctrl+Space for functions | Formula bar hint text |

Translators: French (`fr`) translations required at MVP launch. Spanish (`es`) and Portuguese (`pt`) by end of Phase 2.

---

## 7. Permissions & Security

### 7.1 Permission keys

| Permission | Behaviour |
|------------|-----------|
| `RULES_VIEW`     | Read access to the Test Rules list and editor (read-only mode hides Save, +Add buttons, delete controls). |
| `RULES_EDIT`     | Create, edit, save, delete rules. Status toggle. |
| `RULES_REVIEW`   | (Phase 2) Approve/sign-off on a rule before it goes Active. MVP treats Save by `RULES_EDIT` as immediately Active. |

### 7.2 Enforcement

- UI: every Save / Add / Delete / status toggle control is hidden or disabled when the user lacks `RULES_EDIT`.
- API: every mutation endpoint validates `RULES_EDIT`. 403 on absence. The mutation `editJiraIssue`-style verbs (`/api/rules/:id`, `POST/PUT/DELETE`) carry server-side permission checks.
- Audit log: every mutation records the acting user and a serialized diff.

### 7.3 Open permission question

Per the memory `OpenELIS admin permissions are binary`, the current OpenELIS admin permission is effectively all-or-nothing. MVP either:
- **Option A:** Treats Rules as part of the existing admin permission (binary: any admin can edit). Simpler; matches today's behavior.
- **Option B:** Introduces `RULES_EDIT` as a new granular permission. Requires permission system work co-scoped with this feature.

Recommend Option A for MVP. Option B is Phase 2 along with `RULES_REVIEW`.

---

## 8. Non-Functional Requirements

### 8.1 Performance

- **NFR-1:** List page initial render ≤ 1.5 s for 500 rules.
- **NFR-2:** Test/panel picker search returns results in ≤ 200 ms for a catalog of 500 tests + 50 panels.
- **NFR-3:** Inline editor expansion ≤ 400 ms (open + content render).
- **NFR-4:** Save mutation round-trip ≤ 1 s for a typical rule.
- **NFR-5:** Live preview recompute (Calculated Values) ≤ 50 ms per input change.

### 8.2 Browser support

- Chrome / Edge / Firefox / Safari last 2 major versions.
- The preview / production builds use no features beyond ES2020 baseline.

### 8.3 Accessibility

- **NFR-A1:** WCAG 2.1 AA across the entire flow.
- **NFR-A2:** Keyboard navigation through the picker, the Compose rows, and the action list. Tab order is left-to-right, top-to-bottom. Shift+Tab reverses.
- **NFR-A3:** Screen reader: all disabled-predicate reasons are part of the option's accessible label, not tooltip only.
- **NFR-A4:** Collapsible cards are rendered as `<button>` elements with `aria-expanded` and `aria-controls` referencing the body region.
- **NFR-A5:** Picker dropdown closes on Escape and returns focus to the trigger. Click-outside closes without changing selection. The dropdown panel is `role="listbox"` with arrow-key navigation through items.
- **NFR-A6:** Modal dialogs trap focus inside the modal until dismissed. The first focusable element receives focus on open; the trigger element regains focus on close. `aria-modal="true"` is set.
- **NFR-A7:** Inline validation errors are wired via `aria-describedby` to the offending input. The summary error block is `role="alert"` for screen-reader announcement on save failure.
- **NFR-A8:** Color contrast: 4.5:1 for text, 3:1 for large text and UI elements. Status, kind chip, and predicate phrase tokens are verified against the Carbon white background.
- **NFR-A9:** No information conveyed by color alone. Status uses both color and text ("Active" / "Disabled"). Cross-sample warning uses both amber color and the ⚠ icon plus explicit text.
- **NFR-A10:** Minimum touch target size 32×32 px for action buttons, chevrons, and reorder controls per Carbon guidance.

### 8.4 Auditability (ISO 15189 alignment)

- Every save records a structured diff.
- Every rule shows its revision history (Phase 2 UI; MVP stores the data).
- Every catalog change that affects rules surfaces in the list view filter.
- Every cross-sample reflex carries a stored audit reason.

### 8.5 Internationalization

- All strings via `t()`.
- Number formatting follows the user's locale for reference-range and computed-value display.

---

## 9. Acceptance Criteria

### 9.1 Author flows

**AC-1 — List view scan:** A user opens `/admin/testRules`, the page renders 25 rules within 1.5 s. Each rule shows its name, type, status, and a plain-English WHEN/THEN summary. (Maps to FR-1, FR-2, FR-3, US-1.)

**AC-2 — Author simple Reflex rule:** A user clicks `+ New → Simple rule`. The inline editor opens. The user types a rule name, selects trigger sample (Serum), picks `TSH` as the first condition's test, picks `is outside the normal range` as the predicate. No value input appears (catalog-based predicate). The user clicks `+ Add another action`, picks `Order Test or Panel`, searches "free t4", selects FT4 from the picker, clicks Save. The rule is persisted and reappears on the list with its plain-English summary. Round trip ≤ 5 s. (Maps to FR-13, FR-14, FR-15, FR-19, FR-27, US-2.)

**AC-3 — Compound rule with AND:** A user adds a second condition row, picks `Free T4` and the predicate `is less than (<)`. A number input appears next to the predicate. The user types `0.7`. The "Rule reads as" preview updates to *"…when **TSH** is outside the normal range AND **FT4** is less than 0.7 ng/dL."* Save succeeds. (Maps to FR-11, FR-17, FR-18.)

**AC-4 — Coded predicate:** A user picks `HIV Screen` as the test, picks `is…`. A checkbox set appears showing Reactive, Weak Reactive, Non-Reactive. User checks "Reactive". Preview reads *"…when **HIV Screen** is Reactive…"*. (Maps to FR-15 coded, FR-17 codedMulti.)

**AC-5 — Disabled predicate with reason:** A user picks a coded test (HIV Screen) as the condition test. The dropdown shows `is critically high — needs critical thresholds in the catalog` greyed out. (Maps to FR-16.)

**AC-6 — Picker same-sample filter:** Trigger sample = Serum. User opens the action's order picker, searches "lipid". The Lipid Panel and four lipid tests appear. User toggles to "All sample types". No new entries appear (lipids are all Serum) but the warning bar shows. (Maps to FR-27, FR-28.)

**AC-7 — Cross-sample warning + reason required:** Trigger sample = Serum. User toggles picker to "All sample types", searches "blood culture". Blood Culture (Whole Blood) appears with a sample-chip "Whole Blood". User selects it. Save fails with an inline error pointing to a required `auditReason` field. User enters "Per sepsis SOP — escalation on critical glucose". Save succeeds. (Maps to FR-28, FR-29, FR-33.)

**AC-8 — Calculated Value live preview:** A user creates a calc rule `LDL = TC - HDL - TRIG/5`. As they type the formula, the math view below renders `Total Cholesterol [mg/dL] − HDL [mg/dL] − Triglycerides [mg/dL] / 5` with proper fraction bar. The right pane shows three input fields (TC, HDL, TRIG). Entering TC=200, HDL=50, TRIG=150 displays computed LDL=120 with units mg/dL. Sample-type scope is set to Selected: [Serum, Plasma]. (Maps to FR-21, FR-23, FR-24, FR-10.)

**AC-9 — Catalog range change propagation:** A rule references `isOutsideNormal(TSH)`. Lab IT updates TSH's reference range in the Test Catalog from `0.4–4.5` to `0.5–4.0`. The Test Rules list view shows the rule in the "Rules affected by recent catalog change" filter. The rule's compiled expression now uses the new range. (Maps to FR-31, FR-32.)

**AC-10 — Plain-English preview accuracy:** Every rule rendered by FR-18 (Rule reads as) matches the user's stated intent verbatim. Reviewer / lab director can validate a rule against published guidelines without consulting the technical form. (Maps to US-4.)

### 9.2 Validation flows

**AC-11 — Save blocks on missing fields:** Save fails with localized inline errors for: missing name, no conditions, no actions, incomplete condition row, missing cross-sample reason. The first error receives focus.

**AC-12 — Disabling a rule:** A user opens an Active rule, toggles status to Disabled, saves. The rule stops firing immediately. The list view updates the status chip. The rule remains visible (Disabled rules are not deleted).

### 9.3 Catalog integration

**AC-13 — Picker scales to large catalog:** A test catalog of 500 tests + 50 panels is loaded. The picker remains responsive (search latency ≤ 200 ms) and the dropdown caps visible results with refine-search hints.

**AC-14 — Symbolic catalog references in stored AST:** Inspecting a saved rule's persisted form shows the predicate stores a symbolic reference to the test (e.g., `predicateId: "isOutsideNormal", testRef: { testId: "TSH" }`), not a snapshot of the range values.

**AC-15 — Coded-output Calculation (TB GenoType):** A user creates a new Calculation, picks `TB GenoType Resistance Interpretation` as the destination. The editor switches from formula bar to decision table because the destination is a coded test. The user creates four rules referencing the parent test's analyzer parameters (`TB_GT.IC`, `TB_GT.rpoB_pres`, `TB_GT.rpoB_mp`, `TB_GT.inhA_pres`, `TB_GT.katG_pres`) using a mix of coded `is` and numeric `between` predicates. The Otherwise row picks "Indeterminate." Save succeeds. The simulator with inputs IC=Yes, rpoB_pres=Yes, inhA_pres=No, katG_pres=No, rpoB_mp=84.2 reports "Matched Rule 2 → Wild type." Changing rpoB_mp to 79.0 reports "Matched Rule 3 → Rifampicin resistance suspected." (Maps to FR-26a/b/c/d/e, FR-26f/g/h/i, US-6.)

**AC-16 — Analyzer parameter picker:** In the condition input picker, typing "rpoB" returns two matches: `TB_GT.rpoB_pres` (PARAM chip, coded, Yes/No) and `TB_GT.rpoB_mp` (PARAM chip, numeric, °C, range 82.5–86.5). Typing "TB" returns the parent test's reported result (RESULT chip, coded) plus all six analyzer parameters. The chip clearly distinguishes parameter from result. (Maps to FR-26g.)

**AC-17 — Parameter-derived catalog metadata enables predicates:** For a numeric analyzer parameter with `refRange` defined in the catalog, the catalog-based predicates (`isOutsideNormal`, `isAboveNormal`, `isBelowNormal`) are enabled in the predicate dropdown. For a coded analyzer parameter, only `is` and `is not` are enabled; specific-value and catalog-based numeric predicates are greyed out with "needs a numeric test type." (Maps to FR-26i, FR-16.)

**AC-18 — Rule ordering matters and is visible:** A user moves Rule 3 above Rule 2 using the up arrow in the rule header. The simulator's result changes accordingly when the inputs would have matched both rules. The list view's plain-language summary preserves the order. (Maps to FR-26c.)

**AC-19 — Otherwise required:** Save fails if the Otherwise row is left blank, with a localized inline error pointing to that row. Every coded-output Calculation must terminate with a defined fallback. (Maps to FR-26c, FR-33.)

### 9.4 UI states

**AC-20 — Empty state on fresh deployment:** Opening the Test Rules page with zero rules in the system shows the empty-state block (icon, "No rules yet" title, explanatory subtitle, "+ Create your first rule" primary button). No empty table renders. (Maps to FR-36.)

**AC-21 — Saving state.** Clicking Save while a server request is in flight: Save button shows "Saving…", Save and Cancel buttons are disabled, the rest of the editor stays visible and interactive. `aria-busy="true"` is on the Save button. (Maps to FR-38.)

**AC-22 — Save-failed visual.** A save validation error renders an inline error block above the footer listing every problem, with `role="alert"`. Focus jumps to the first invalid field. The picker chip for an invalid input shows the `.ip-trigger.error` red border. (Maps to FR-39.)

**AC-23 — Disable confirmation.** Clicking Disable Rule on an Active rule opens a Carbon Modal with kind="danger". The modal explains the consequence. Confirm disables the rule; Cancel leaves it Active. The trigger button regains focus on close. (Maps to FR-34, FR-40.)

### 9.5 Batch operations

**AC-24 — Multi-select reveals batch bar.** Selecting one or more rows via row checkboxes reveals the batch action bar above the table with the selected count, Enable / Disable / Export CSV / Delete buttons, and a Clear ✕. (Maps to FR-41, FR-42.)

**AC-25 — Select-all in header.** The header checkbox selects every row currently rendered by the active filter. Toggling it again deselects. The state is `indeterminate` when some but not all visible rows are selected. (Maps to FR-41.)

**AC-26 — Batch delete confirmation.** Clicking Delete with N rows selected opens a Carbon Modal warning that N rules will be deleted permanently. Confirm performs the delete; Cancel preserves selection. (Maps to FR-40, FR-42.)

### 9.6 Accessibility

**AC-27 — Keyboard end-to-end.** A user authors a complete rule using only the keyboard: Tab into rule name, Tab through trigger sample, Tab to first condition's input picker, Enter to open, type to search, arrow keys to navigate matches, Enter to select, Tab through predicate and value inputs, Tab through actions, Tab to Save, Enter. No mouse used. (Maps to NFR-A1, NFR-A2.)

**AC-28 — Screen reader collapsible.** With a screen reader active, focusing a Test catalog data collapsible head announces "Test catalog data, collapsed, button. Expandable" (or similar per platform). Activating with Enter or Space expands and the announcement updates to "expanded." (Maps to NFR-A4.)

**AC-29 — Disabled predicates accessible.** Disabled options in the predicate dropdown have their disabling reason in the option's label text so screen readers announce "is critically high, needs critical thresholds in the catalog, disabled." (Maps to NFR-A3.)

---

## 10. Out of Scope (Phase 2 and later)

### 10.1 Phase 2 — power features

The following are explicitly out of scope for MVP. The MVP data model and UI shell are designed to accept them additively without migration.

- **Formula bar (Type-it) mode for Reflex** — typed text expression as alternative to Compose. Same AST.
- **Technical-form toggle and DMN export** — show stored predicate calls + compiled numeric expressions; export to OMG DMN.
- **Simulator** — paste sample inputs, trace which rules fire, see actions.
- **Validation tests** — author asserts `(inputs → expected output)`; run on save.
- **Decision-table mode for shared-trigger cascades** — multiple rules sharing one trigger test (HIV Reactive / Weak Reactive / Non-Reactive) authored as one decision table.
- **Multi-step Calculated Values** — named intermediates feeding a final value (MELD-Na with caps and Na-adjustment, full CKD-EPI 2021). The current `if()` works for two-way branches; multi-step requires Phase 2 work.
- **Flowchart panel** for branching calc values (eGFR by sex).
- **Templates library** — searchable algorithm library with citations (Friedewald 1972, NKF-ASN 2021, WHO 2019). MVP may ship with 3–5 inline starter templates.
- **Cascade preview overlay** — read-only diagram showing how rules chain.
- **Conflict detection at save** — warn when two rules could fire on the same result.
- **Trigger modes** — "On test result" vs "On test order" (cascade invisible to provider).
- **`Send Alert` action type** — needs the alerts subsystem integration.
- **Nested condition groups** with parens for `(A AND B) OR (C AND D)` shape rules. MVP supports flat AND/OR only.
- **Run against historical results** — author can replay the last 30 days of patient results through the new rule to see how often it would have fired and what it would have ordered. Important for ISO 15189 sign-off but not required day 1.
- **Drag-to-reorder** for decision-table rules. MVP uses larger up/down icon buttons.
- **Carbon `Accordion`** replaces the custom collapsible component used in the mockups.
- **Granular `RULES_REVIEW` permission** — sign-off step before Active.
- **Per-rule revision history UI** — list of past versions with diffs.

### 10.2 Phase 3 — deferred

- **Algorithm-as-graph editor** — BPMN-style canvas for genuinely multi-step protocols (HIV 3-test national algorithm with retest, TB cascade with DST, newborn screening). The AST supports this; only the canvas UI is deferred.
- **CQL / FHIR Clinical Reasoning export** — interoperability with external CDS engines.
- **Cross-site rule templating / sharing** — export rules from one site for another to import.
- **Delta-check predicates if catalog doesn't already carry delta thresholds** — requires catalog backfill work.
- **Comprehensive per-rule analytics** (firing rate, false-positive rate, latency).
- **Bulk import of analyzer parameter definitions** from instrument vendor profiles. MVP populates manually per test.
- **Numeric-output Calculations using a decision-table view** (alternative to formula bar) — e.g., authoring MELD-Na's piecewise logic as a table. MVP keeps numeric calcs on formula bar; coded calcs use decision table.

---

## 11. Dependencies & Open Questions

### 11.1 Dependencies

- **Test Catalog metadata.** The MVP assumes the Test Catalog carries: reference range, critical thresholds, coded values, sample type, and LOINC code per test. Critical-threshold capture in particular has been confirmed by the user (2026-05-11) as already supported across all tests in the deployment.
- **QC-table linkage to results.** Analyzer parameters captured in the QC table today must be associated with patient results at import time (see §4.6a). This is a new addition to the result-import code path and is the only new persistence work introduced by MVP.
- **Panel as catalog entity.** MVP picker treats Panel as a first-class catalog entity. Confirmation needed (OQ-4).
- **Carbon for React component versions.** Carbon `DataTable`, `ComboBox`, `MultiSelect`, `Select` (with optgroup + disabled options), `Tag`, `Toggle`, `InlineNotification` — all from `@carbon/react` ≥ 11.x.
- **i18n infrastructure.** Existing `t()` helper and key registry in the OpenELIS frontend.
- **Audit log infrastructure.** Storage of structured diffs per rule mutation and per catalog change.

### 11.2 Open Questions

- **OQ-1 — Permission granularity.** Adopt Option A (treat rules as part of the existing binary admin permission) or Option B (introduce `RULES_EDIT` and ship the permission system extension co-scoped with this feature)?
- **OQ-2 — Existing rule migration.** Existing rules in `reflex` and `calculatedValue` legacy tables need a migration to the new `Rule` schema and `ConditionAST`. Plan: write a one-time migration script that lifts each existing rule's `ANY/ALL` + condition rows into a flat `ConditionGroup` with the matching predicate. The migration must be invertible for rollback.
- **OQ-3 — Catalog schema gaps.** Confirm Test Catalog already stores: delta threshold per numeric test; LOINC code per test; coded value enumerations per coded test. If any are missing, MVP scope may need to absorb the schema work.
- **OQ-4 — Panel as first-class entity.** Confirm OpenELIS already stores panels as composed entities with test membership. If not, MVP either includes a panel-management UI in Test Catalog or panels slide to Phase 2.
- **OQ-5 — Cross-sample auto-order behavior.** When a cross-sample reflex fires, does OpenELIS auto-create a sample collection order, or does it queue a "needs collection" task for phlebotomy? Behavior depends on the existing collection workflow.
- **OQ-6 — Flat vs nested condition groups in MVP.** Spec proposes flat AND/OR (no nesting) in MVP Compose. Confirm: are there real lab rules that require nested groups (e.g., `(A AND B) OR (C AND D)`)? If yes for MVP, the Compose builder needs a bracket affordance.
- **OQ-7 — Sample-type scope on Reflex rules.** Calculated Values supports `Selected sample types`. Should Reflex also? If a TSH reflex should fire on Serum AND Plasma, the answer is yes — but the user's stated norm is same-sample reflex, which suggests no for MVP. Recommend deferring to Phase 2 unless a real-world case surfaces.
- **OQ-8 — Default trigger mode.** MVP assumes "On test result" (legacy reflex behavior). Confirm no immediate need for "On test order" (cascade hidden from provider).
- **OQ-9 — QC table linkage scope.** Confirmed (2026-05-11) that analyzer parameters are already captured in the QC table. Open: which subset of QC fields should be exposed per analyzer integration in MVP, and is the QC→Result association at import-time keyed by sample ID, run ID, or both? Answer determines storage shape in §4.6a.
- **OQ-10 — Analyzer parameter catalog migration.** New `analyzerParameters` field on Test Catalog records. Migration approach: ship the field empty for all existing tests; lab IT populates parameter definitions per test as part of catalog setup. Alternatively, bulk-import seeds for common instruments (TB GenoType, GeneXpert, Cobas) via vendor profiles. Phase 2 work either way.
- **OQ-11 — Coded calc destination existing in catalog.** Does OpenELIS today support creating a coded-result "destination" test that has no analyzer integration — i.e., a test whose result is only ever set by a Calculation rule? If not, MVP needs a small extension to Test Catalog to allow "computed result" as a test source.

---

## 12. References

### 12.1 Mockups

- `calculated-values-redesign-v2-preview.html` — Calculated Values formula bar pattern (numeric output), math view, live preview, sample-type scope.
- `calc-decision-table-preview.html` — Calculated Values decision-table pattern (**coded output**), analyzer parameters as condition inputs. Canonical example: TB GenoType MTBDRplus interpretation.
- `reflex-tests-redesign-preview.html` — Reflex Compose mode, predicate picker with availability, multi-action, searchable test/panel picker, Test Catalog reference.
- `test-rules-list-view-preview.html` — Unified Rules / Algorithms / Multi-step list view, type filters, +New menu, catalog cross-reference.
- `algorithm-as-graph-preview.html` — *Phase 2/3 reference.* Algorithm canvas and multi-step calc — not in MVP scope.

### 12.2 Audit captures

- Live audit of `/MasterListsPage/calculatedValue` and `/MasterListsPage/reflex` performed 2026-05-11 on testing.openelis-global.org. Findings documented in §1.1.

### 12.3 Prior art

- HL7 Clinical Quality Language (CQL) — semantic predicate naming conventions.
- OMG Decision Model and Notation (DMN) — workflow + decision-table model that informs Phase 2 algorithm-as-graph.
- IBM Carbon Design System — UI components and tokens.
- Looker LookML, Notion formulas, Airtable filters — formula-bar + side-panel + math-view pattern.
- WHO Consolidated Guidelines on HIV Testing Services (2019) — cascade modeling reference for Phase 2 algorithms.
