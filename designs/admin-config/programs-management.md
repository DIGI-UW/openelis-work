# Programs Management — Functional Requirements Specification

**Feature:** Programs admin rework with Domain classification
**Status:** Draft v1.0
**Date:** 2026-05-27
**Pattern source:** OGC-748 (Test Catalog Basic Info — Domain radio group)
**Related tickets:** OGC-189 (Lab Units Redesign), OGC-361 (Lab Unit Domain), OGC-538 (SampleType Domain), OGC-296 (Sample Type Management), OGC-527 (Env/Vector Epic)

---

## Lab Context

### Current State

A "program" in OpenELIS is a named clinical or surveillance initiative — HIV care, TB DOTS, malaria sentinel surveillance, antenatal HBV screening — that a country's ministry of health runs across the lab network. Each program has its own indicator set, its own funder reporting, and often its own order-entry form (e.g. an HIV order captures patient cohort, regimen, prior viral load; a TB order captures sputum sample number and treatment phase). Today the Programs admin in OpenELIS is a flat list editor: name, code, description, lab unit assignment, active flag. There is no field on the Program record that says what *kind* of work it does — clinical patient testing, environmental compliance monitoring, or vector surveillance — so every Program looks the same in every dropdown.

The result is that an environmental compliance program ("Water Quality Surveillance — Lake Toba") sits in the same dropdown as a clinical program ("HIV Treatment Cohort") at Reception, and a vector surveillance program ("Dengue Sentinel — Jakarta Mosquito Index") sits next to both. Reception staff scroll through programs that don't apply to the order they're entering, and order-entry forms have no programmatic way to filter the Program picker by the domain of the current order.

### Pain

A reception clerk at SILNAS Indonesia enters 40-60 orders a day across clinical patient draws, environmental water samples from district health offices, and pooled mosquito samples from vector surveillance teams. Each order requires picking a Program from a dropdown of ~35 active Programs. About a third of those programs apply to clinical patients, a third to environmental samples, and a third to vector specimens — but the dropdown shows all of them, in alphabetical order, with no way to filter. The clerk wastes time scrolling, and worse, mis-attribution happens: an environmental water sample gets coded against a clinical HBV program because the names look similar. When the mistake is caught at validation, the order has to be re-coded, the indicator counts for both programs are wrong for that period, and the funder report for whichever program ends up over- or under-counted needs a manual correction note.

The deeper problem is system-wide harmonization. Tests already have a Domain field on Basic Info (OGC-748: CLINICAL / ENVIRONMENTAL / VECTOR). Lab Units are getting Domain in OGC-361. Sample Types currently ship with a pre-decision enum shape (OGC-538) and will be realigned to the canonical 3-value enum in a separate follow-up. Programs are the last catalog entity without a Domain field, which means downstream filtering (only-show-relevant-programs-for-this-domain-order) cannot be built until Programs has the same attribute on the same enum.

### What Changes

Every Program gets a Domain — Clinical, Environmental, or Vector — set when the Program is created or edited. On the Programs admin list, a Domain column and a Domain filter let an admin slice to "show me just vector programs" in one click. At Reception, when a clerk has indicated the order is environmental (Step 1 of the order wizard), the Program picker shows only Environmental programs. Clinical orders see only Clinical programs. The clerk's program list shrinks from 35 to roughly 12, and the cross-domain mis-attribution path is closed. Funder indicator counts stop drifting from mis-coded orders. The Programs admin no longer behaves differently from the Tests admin, the Lab Units admin, or the Sample Types admin — Domain is one canonical attribute on every catalog entity, set the same way, named the same way, filtered the same way.

---

## Navigation & URL

- **SideNav placement:** `Admin → Test Management → Programs`. Programs belongs to the Test Management cluster — alongside Test Catalog, Sample Types, Lab Units, and other test-related catalog admin — not directly under the main Admin menu. Today the live page sits at `/MasterListsPage/program` and is exposed off the main admin menu (an IA bug). This rework **moves** Programs back under Test Management where it belongs functionally.
- **Breadcrumb trail (list view):** `Home / Admin Management / Test Management / Programs`
- **Breadcrumb trail (editor):** `Home / Admin Management / Test Management / Programs / Add/Edit Program`
- **Breadcrumb label quirk:** The first crumb reads **"Admin Management"** while the SideNav menu label is just **"Admin"** — that's a live-app drift preserved here (see `reference_admin_breadcrumb_label_quirk` memory). Harmonizing the two labels is a separate IA cleanup, not in scope for this FRS.
- **URL route (list):** `/MasterListsPage/program` — preserves the existing live URL path-segment style. The live URL uses singular `program` (not `programs`); preserve that to avoid breaking deep links from other admin pages.
- **URL route (editor):** `/MasterListsPage/program/<uuid>` for editing an existing Program; `/MasterListsPage/program/new` for creating a new one.

**IA move for engineering:** The relocation from main-admin-menu to Test Management is a SideNav config change, not a URL change. The URL `/MasterListsPage/program` stays the same; only the menu entry moves. Existing bookmarks remain valid.

The editor remains a dedicated page (matching the existing `Add/Edit Program` flow), not an inline row expansion — the Questionnaire section with its 2-column editor + preview layout is too tall to be useful in an inline expansion, and the existing user mental model already expects a page transition for editing.

---

## Overview

Add a required **Domain** radio group (CLINICAL / ENVIRONMENTAL / VECTOR) to the Programs admin editor, with corresponding list-view column, list-view filter, and downstream filtering on the Order Entry Program picker. Harmonizes the Programs catalog entity with the Tests / Lab Units / Sample Types Domain pattern.

This FRS is scoped to the Domain field and its immediate filter/picker consequences. Broader Programs editor improvements (custom order-entry form linkage, indicator config, funder report binding) are out of scope for this FRS and tracked separately.

---

## User Stories

1. **As a lab administrator** maintaining the Programs catalog, I want to mark each Program as Clinical, Environmental, or Vector so that Programs behaves consistently with the rest of the catalog admin and downstream pickers can filter accurately.
2. **As a reception clerk** entering an environmental sample order, I want the Program picker to show only Environmental programs so I stop accidentally coding a water sample against a clinical hepatitis program.
3. **As a lab administrator** auditing the Programs catalog, I want to filter the list by Domain so I can verify all my Vector programs are present and active without scrolling past 25 unrelated Clinical programs.
4. **As an upgrade-admin** rolling out this release, I want existing Programs to be auto-assigned a sensible default Domain so the system stays usable while I re-classify any non-clinical Programs manually.
5. **As a funder-reporting analyst** pulling indicator counts by program, I want Domain on the Program record so my pivot tables can group "environmental compliance hits" separately from "clinical patient encounters" without string-matching on program name.
6. **As a lab administrator** configuring a Program's custom order-entry form, I want to either paste a FHIR Questionnaire JSON I received from a partner deployment OR build the questions visually one at a time — whichever fits the moment. The current page already supports both modes; the rework must preserve them.
7. **As a lab administrator** building a Program's form visually, I want each question to have a Question Text, a Question Type (Boolean / Choice / Checkbox / Integer / Decimal / Date / Time / String / Text / Quantity — the FHIR Questionnaire item.type values), and a per-question Save/Delete control on the card so I can iterate freely without losing in-progress edits.

---

## Functional Requirements

### FR-1 — Domain field on Program record

Add a `domain` column to the `program` table. Type: `ENUM('CLINICAL', 'ENVIRONMENTAL', 'VECTOR')`. Not nullable. No default at the schema level — the migration backfills existing rows (see FR-7).

### FR-2 — Domain radio group in Program editor (Basic Info section)

The Program editor's Basic Info section displays a required Carbon `RadioButtonGroup` labeled "Domain" with three options:

- Clinical
- Environmental
- Vector

Rules:
- Required. The Save button on Basic Info is disabled until a Domain is selected.
- One selection only. The Domain enum has exactly three values; there is no "Both" option anywhere in the system (an order is one domain at a time; a catalog entry serves one domain).
- Default for a *new* Program: nothing pre-selected. Admin must choose.
- Field placement: directly under Name / Code / Description, above the lab-unit assignment.

### FR-3 — Domain change confirmation modal (existing Program)

When an admin changes the Domain on an existing Program (i.e., the radio's saved value changes), a confirmation modal appears before save commits. Copy mirrors OGC-748:

> **Change Program Domain?**
> Historical orders associated with this Program were evaluated against the prior domain's rules. New orders will use the new domain's rules. This change is forward-looking and does not re-code past orders.
>
> [Cancel] [Confirm change]

No domain change on a new (unsaved) Program triggers the modal — only edits to a persisted record.

### FR-4 — Domain column in Programs list view

The Programs list view adds a Domain column between "Name" and "Lab Unit". Renders as a Carbon `Tag`:

- Clinical → `Tag kind="blue"` with label "Clinical"
- Environmental → `Tag kind="green"` with label "Environmental"
- Vector → `Tag kind="purple"` with label "Vector"

Column is sortable.

### FR-5 — Domain filter on Programs list view

Above the Programs list, add a Carbon `MultiSelect` filter labeled "Domain" with three options (Clinical / Environmental / Vector). Selecting one or more filters the list. Empty selection = show all. Filter state persists for the session but resets on logout. Filter combines with existing search (Name / Code) and Active/Inactive filter using AND.

### FR-6 — Order Entry Program picker filtered by order Domain

At Step 1 of the order-entry wizard (Reception), the order's Domain is set to one of CLINICAL / ENVIRONMENTAL / VECTOR (orders carry exactly one domain — there is no cross-domain order). The Program picker on the order form filters as follows:

| Order Domain | Programs shown |
|---|---|
| CLINICAL | Programs where `domain = CLINICAL` AND `active = true` |
| ENVIRONMENTAL | Programs where `domain = ENVIRONMENTAL` AND `active = true` |
| VECTOR | Programs where `domain = VECTOR` AND `active = true` |

The picker's empty-state message changes based on the filter: "No Clinical programs are currently active. Ask your admin to activate one or change the order domain."

Earlier draft text in `env-vector-workflows.md` listed a four-value enum `(CLINICAL | ENVIRONMENTAL | VECTOR | BOTH)`. That fourth value is **retired** — it doesn't make sense as a real workflow (a clerk with a clinical sample and an environmental sample creates two orders, not one composite order). All Domain-aware design assumes the 3-value enum.

### FR-7 — Migration backfill

On upgrade:
- Add the `domain` column to `program` as nullable initially.
- Run a backfill: set `domain = 'CLINICAL'` for all existing rows (Clinical is the dominant historical use case across OpenELIS deployments).
- After backfill, alter the column to `NOT NULL`.
- Emit a one-time post-upgrade banner to admins: "Programs upgraded — all existing Programs defaulted to Clinical Domain. Review the Programs list and re-classify Environmental or Vector programs as needed."

### FR-8 — Audit trail entries

Every Domain change on a persisted Program emits an `audit_trail` row:

- **Action:** `PROGRAM_DOMAIN_UPDATED`
- **Target entity:** `program`
- **Target id:** `program.id`
- **Payload summary:** `{from: 'CLINICAL', to: 'ENVIRONMENTAL', program_code: 'HBV-ANC-01'}`
- **Actor:** auto-captured from Spring Security context
- **Timestamp:** auto

Creation of a new Program already audits via the existing `PROGRAM_CREATED` action; the Domain field rides along in that event payload (no new event for create).

### FR-9 — Envers coverage

The `Program` entity is annotated `@Audited`. Confirm the new `domain` column is included in revision tracking (Envers picks it up automatically on `@Audited` entities unless `@NotAudited` is applied — verify no field-level exclusion exists).

### FR-10 — i18n keys

All visible strings localized under the following namespaces:

| Key | English fallback |
|---|---|
| `breadcrumb.home` | Home |
| `breadcrumb.adminManagement` | Admin Management |
| `breadcrumb.testManagement` | Test Management |
| `breadcrumb.admin.programs` | Programs |
| `breadcrumb.admin.programs.editor` | Add/Edit Program |
| `admin.programs.basicInfo.programName.label` | Program Name |
| `admin.programs.basicInfo.code.label` | Code |
| `admin.programs.basicInfo.uuid.label` | UUID |
| `admin.programs.basicInfo.testSection.label` | Test Section (Lab Unit) |
| `admin.programs.questionnaire.preview.label` | Example |
| `admin.programs.questionnaire.preview.empty` | No questions yet — start adding questions to see the preview. |
| `admin.programs.questionnaire.preview.stale` | Preview reflects last validated JSON. Validate to refresh. |
| `admin.programs.basicInfo.domain.label` | Domain |
| `admin.programs.basicInfo.domain.required` | Domain is required |
| `admin.programs.basicInfo.domain.option.clinical` | Clinical |
| `admin.programs.basicInfo.domain.option.environmental` | Environmental |
| `admin.programs.basicInfo.domain.option.vector` | Vector |
| `admin.programs.basicInfo.domain.change.modal.title` | Change Program Domain? |
| `admin.programs.basicInfo.domain.change.modal.body` | Historical orders associated with this Program were evaluated against the prior domain's rules. New orders will use the new domain's rules. This change is forward-looking and does not re-code past orders. |
| `admin.programs.basicInfo.domain.change.modal.confirm` | Confirm change |
| `admin.programs.basicInfo.domain.change.modal.cancel` | Cancel |
| `admin.programs.questionnaire.section.title` | Questionnaire |
| `admin.programs.questionnaire.mode.visualBuilder` | Visual Builder |
| `admin.programs.questionnaire.mode.json` | JSON |
| `admin.programs.questionnaire.mode.switcher.aria` | Questionnaire authoring mode |
| `admin.programs.questionnaire.json.placeholder` | Paste FHIR Questionnaire JSON here |
| `admin.programs.questionnaire.json.validate` | Validate JSON |
| `admin.programs.questionnaire.json.invalid` | Invalid FHIR Questionnaire — see error below |
| `admin.programs.questionnaire.id.label` | Questionnaire id |
| `admin.programs.questionnaire.questions.section.title` | Questions |
| `admin.programs.questionnaire.question.text.label` | Question Text |
| `admin.programs.questionnaire.question.type.label` | Question Type |
| `admin.programs.questionnaire.question.type.boolean` | Boolean |
| `admin.programs.questionnaire.question.type.choice` | Choice |
| `admin.programs.questionnaire.question.type.checkbox` | Checkbox |
| `admin.programs.questionnaire.question.type.integer` | Integer |
| `admin.programs.questionnaire.question.type.decimal` | Decimal |
| `admin.programs.questionnaire.question.type.date` | Date |
| `admin.programs.questionnaire.question.type.time` | Time |
| `admin.programs.questionnaire.question.type.string` | String |
| `admin.programs.questionnaire.question.type.text` | Text |
| `admin.programs.questionnaire.question.type.quantity` | Quantity |
| `admin.programs.questionnaire.question.actions.menu.aria` | Question actions |
| `admin.programs.questionnaire.question.actions.delete` | Delete question |
| `admin.programs.questionnaire.question.addNew` | Add New Question |
| `admin.programs.questionnaire.answerOptions.section.title` | Answer options |
| `admin.programs.questionnaire.answerOptions.option.label` | Option |
| `admin.programs.questionnaire.answerOptions.option.delete.aria` | Delete this option |
| `admin.programs.questionnaire.answerOptions.addOption` | + Add option |
| `admin.programs.questionnaire.answerOptions.empty` | No options yet — add at least one so reception can pick a value. |
| `admin.programs.questionnaire.answerOptions.codedBadge` | (coded) |
| `admin.programs.questionnaire.modeSwitch.unsavedJson.title` | Unsaved JSON changes |
| `admin.programs.questionnaire.modeSwitch.unsavedJson.body` | Switching modes will discard unsaved JSON. Validate and apply first, or discard. |
| `admin.programs.list.column.domain` | Domain |
| `admin.programs.list.filter.domain.label` | Domain |
| `admin.programs.list.filter.domain.placeholder` | Filter by Domain |
| `orderEntry.programPicker.empty.clinical` | No Clinical programs are currently active. Ask your admin to activate one or change the order domain. |
| `orderEntry.programPicker.empty.environmental` | No Environmental programs are currently active. Ask your admin to activate one or change the order domain. |
| `orderEntry.programPicker.empty.vector` | No Vector programs are currently active. Ask your admin to activate one or change the order domain. |

**Live i18n leak fix:** the shipped Add/Edit Program page currently renders the raw keys `program.name.program` and `program.name.code` as labels because their translations are missing. Replace those references with the new `admin.programs.basicInfo.programName.label` and `admin.programs.basicInfo.code.label` keys above (and add English + locale fallbacks so the raw key never shows again).

### FR-11 — Editor page layout (preserve existing structure with Domain inserted)

The Add/Edit Program editor page has the following sections in this top-to-bottom order:

1. **Program selector** at top (Carbon `Select`) — "New Program" or pick an existing one for editing. Mirrors current behavior.
2. **Basic Info** section — `Grid` with two columns:
   - Left column: Program Name, Code
   - Right column: UUID (read-only on existing records), Test Section (Lab Unit)
   - Full-width: **Domain radio group (new, required, per FR-2)** rendered immediately below the basic fields and above the Questionnaire section
3. **Questionnaire** section — see FR-12..FR-15 and FR-13.5 (rendered preview pane). Internally a two-column layout: editor on the left, live rendered preview on the right.
4. **Submit** button at bottom (disabled until Domain is selected and form is valid)

The live page exposes a label "Example" next to a pane that renders the questionnaire as it will appear at order entry — this is the rendered preview pane (FR-13.5), not a free-text input. Earlier drafts of this FRS mis-labeled it as a free-text input; the actual behavior is a live preview.

### FR-12 — Mode switch (Visual Builder ↔ JSON)

The Questionnaire section header uses a Carbon **`ContentSwitcher`** with two equal segments:

- **Visual Builder** (default) — the structured GUI builder (FR-14): Questionnaire id field plus a repeating list of Question cards, each with text, type, and (for Choice/Checkbox) answer options.
- **JSON** — a single multi-line textarea pre-seeded with the current FHIR Questionnaire JSON. Admin pastes or edits raw FHIR R4 JSON. A "Validate" button parses it and shows inline error / success messaging (FR-13).

`ContentSwitcher` is used instead of a `Toggle` because both modes are equally valid authoring paths — `Toggle` implies "on/off relative to a default mode", which misframes the choice. The previously-rendered live label "Edit JSON" with On/Off is retired.

Only one mode is visible at a time. The underlying data store is a single FHIR Questionnaire resource — switching modes round-trips through it:

- **JSON → Visual Builder:** parse the JSON, hydrate the GUI cards. If the JSON has unsaved invalid edits OR unsaved valid edits not yet applied, prompt before discarding (FR-12.1).
- **Visual Builder → JSON:** serialize the GUI state back to FHIR Questionnaire JSON, drop into the textarea. (No "unsaved cards" prompt needed — see FR-14 for the new auto-save behavior; Visual Builder no longer has a draft state.)

**FR-12.1 — Round-trip representational limits:** Round-trip is lossless **only for the subset of FHIR Questionnaire features the GUI builder supports**: `linkId`, `text`, `type` (10 allowed values per FR-15), and `answerOption[]` for Choice/Checkbox types. The following FHIR Questionnaire features are **preserved verbatim through ON-mode** but are **not editable in GUI mode**:

- `enableWhen` (conditional logic on questions)
- `repeats` (repeating item groups)
- Nested `item[]` (sub-questions)
- `required`, `readOnly`, `initial[]` (per-question flags)
- `code[]` (LOINC / SNOMED bindings)
- Custom extensions (`extension[]`)

When the GUI builder encounters a question with any of these features, it shows the card in a **read-only "advanced" state** with a small notice: *"This question uses advanced FHIR features (enableWhen, nested items, …). Edit in JSON mode to modify."* The Save and reordering controls are hidden on these cards; only Delete remains. This prevents silent data loss while keeping the dual-path usable.

The Catalyst Form Builder (OGC-113, future) is expected to support `enableWhen` and the other advanced features visually — this is one of the assistive gaps Catalyst is meant to close. Until then, the JSON paste path is the supported way to author advanced questions.

### FR-13 — JSON paste mode validation

On clicking "Validate JSON" (or on Submit while in JSON mode), the system:

- Parses the textarea as JSON. Malformed JSON → inline error with line/column.
- Validates against FHIR Questionnaire R4 shape: `resourceType === 'Questionnaire'`, `item[]` array (may be empty), each item has `linkId`, `text`, `type` from the allowed enum.
- On invalid input, render a Carbon `InlineNotification kind="error"` below the textarea with the failure reason. Submit is disabled until validation passes.
- On valid input, show a Carbon `InlineNotification kind="success"` with count: "Validated — N questions detected."

### FR-13.5 — Live rendered preview pane ("Example")

To the right of the Questionnaire editor (whether in JSON or GUI mode), a **live preview pane** renders the questionnaire as it will appear at order entry. Label: **"Example"** (preserves the existing live-page label). This is a read-only preview — clicks on its inputs do nothing in the admin context; it exists to show the admin what reception staff will see.

**Update triggers:**

- **GUI mode** — every Save Question, Delete Question, Add New Question, or Type change updates the preview immediately. Edits to the Question Text field update the preview live (debounced ~200ms to avoid jitter).
- **JSON mode** — the preview updates only after a successful **Validate JSON** (FR-13). Until validation passes, the preview shows the last-validated state with a small caption: *"Preview reflects last validated JSON. Validate to refresh."*
- **Mode switch** — after a successful mode switch the preview reflects the now-active state (no flicker).

**Rendering rules:**

- Each question renders the appropriate Carbon input control for its Type (e.g. `Checkbox` group for Checkbox, `Select` for Choice, `DatePicker` for Date, `TextArea` for Text). The 10 Question Types from FR-15 map one-to-one to Carbon controls.
- All inputs are disabled / `readOnly`. The preview is non-interactive.
- The pane's heading shows the Questionnaire's `title` if present, otherwise the Program Name.
- Empty state: when there are zero questions, the pane shows a single-line placeholder: *"No questions yet — start adding questions to see the preview."*
- The pane is independently scrollable when the questionnaire grows tall, so the editor on the left stays anchored.

**Why this matters:** It closes the feedback loop between JSON / GUI edits and what reception clerks actually see. Without it, admins build forms blind and discover field-ordering or label issues only when reception complains. The live page already has this; the rework preserves it as a first-class feature, not a nice-to-have.

**Out of scope for v1:** The preview does not exercise `enableWhen` (no conditional show/hide based on inputs), does not exercise `repeats`, and does not exercise nested `item[]`. Those are rendered statically as if always-visible / non-repeating. A future enhancement may add `enableWhen` simulation (paired with Catalyst, OGC-113).

### FR-14 — Visual Builder mode (question cards)

When the mode switcher is on **Visual Builder**:

- **Questionnaire id** input above the Questions list. Free text; auto-suggested from Program code if blank on first save.
- **Questions** section — repeating list of **Question cards**. Each card is a Carbon `Tile` with this layout:
  - **Question Text** (Carbon `TextInput`, default placeholder "New Field")
  - **Question Type** dropdown (Carbon `Select`) with exactly 10 values, matching FHIR Questionnaire item.type — listed in FR-15
  - **Answer options sub-section** — appears when Type is `Choice` or `Checkbox` (see FR-14.1)
  - **OverflowMenu (⋮)** in the card's top-right corner with destructive actions (currently just "Delete question" — confirmed via Modal). Reordering, duplicate, and other future per-card actions live here too.
- **Add New Question** button below the list creates a fresh card seeded with "New Field" + Type "String" (the live page's defaults) and focuses the Question Text input.

**No per-card Save button.** All inputs commit to in-memory state on blur (or on Enter / dropdown change), matching the rest of the OpenELIS admin form conventions. The single **Submit** button at the bottom of the page persists everything to the database in one transaction. The previous design's per-card Save + orange "draft" border is retired — it created ambiguous "what does Save commit to?" semantics and visual noise that conflicted with the live preview pane (FR-13.5).

Cards are reorderable via drag handle (Carbon `pattern-drag` ghost reuses the Test Catalog pattern). v1 may ship without drag-reorder if engineering capacity is tight; document as a v2 deferral if so.

### FR-14.1 — Answer options editor (Choice / Checkbox)

When a question's Type is `Choice` or `Checkbox`, the card reveals an **Answer options** sub-section directly below the Type dropdown. Layout:

- Section heading: "Answer options" (small text-uppercase label, same treatment as the "Questions" section heading at the page level)
- Repeating list of **option rows**. Each row contains:
  - Carbon `TextInput` (size `sm`) for the option's display text
  - Inline `IconButton` (kind `ghost`, size `sm`, trash icon) on the right of the input to delete that option
- **+ Add option** button (Carbon `Button kind="ghost" size="sm"` with Add icon) below the list
- Empty state when no options exist yet: a one-line placeholder *"No options yet — add at least one so reception can pick a value."* Save is allowed to proceed without options (FHIR Questionnaire permits empty answerOption arrays), but the live preview pane shows an empty dropdown for that question, which is the visual signal to add options.

**Persistence:** Options populate the question's `answerOption[]` array in the underlying FHIR Questionnaire. Each row maps to `{ valueString: "<text>" }`. Other FHIR `value[x]` variants on existing imported Questionnaires (e.g. `valueCoding` with a code system) are preserved verbatim on round-trip — the Visual Builder displays the `valueCoding.display` text for the row label but does not let the admin edit the code/system inline (those are GUI-mode read-only fields shown as a small badge "(coded)" next to the row; admins must use JSON mode to edit the underlying code).

**Switching Type:** Changing the Type from Choice/Checkbox to something else hides the answer options sub-section but **does not delete the underlying answerOption[]**. Switching back restores the options. This avoids accidental data loss when an admin clicks the wrong Type.

**Validation:** A `Choice` question with zero options is permitted at save (the FHIR Questionnaire is still valid) but the live preview shows an empty Select widget, signaling that ordering staff will see a no-option dropdown. No hard-blocking validation at save time — admins may intentionally save a partial draft.

### FR-15 — Question Type enum (matches FHIR Questionnaire item.type)

The Question Type dropdown has exactly these 10 values, in this order, matching what ships today:

| Value | i18n key | FHIR item.type code |
|---|---|---|
| Boolean | `...question.type.boolean` | `boolean` |
| Choice | `...question.type.choice` | `choice` |
| Checkbox | `...question.type.checkbox` | (FHIR uses `choice` with multi-select; OpenELIS exposes Checkbox as a distinct UI type) |
| Integer | `...question.type.integer` | `integer` |
| Decimal | `...question.type.decimal` | `decimal` |
| Date | `...question.type.date` | `date` |
| Time | `...question.type.time` | `time` |
| String | `...question.type.string` | `string` |
| Text | `...question.type.text` | `text` |
| Quantity | `...question.type.quantity` | `quantity` |

Default Type for a new question is **String**, matching today's behavior.

**FR-15.1** — Choice / Checkbox types reveal a sub-section for managing the option list (linkId + display value pairs). Out of scope for the rework's MVP — the current page lets admins edit option lists; preserve that behavior pass-through.

**FR-15.2** — Switching modes (FR-12) with unsaved Question cards: prompt with a Modal — "You have unsaved questions. Save them before switching to JSON mode, or discard and continue." Buttons: [Discard and switch] [Cancel].

### FR-16 — On-screen guidance (so admins don't have to guess)

The page surfaces guidance inline at each decision point. Not tooltips that demand a hover; visible affordances admins read without leaving the page.

**FR-16.1 — Domain field "What does each Domain mean?" disclosable:** Below the Domain radio's helper text, a `Button kind="ghost" size="sm"` reading "What does each Domain mean?" toggles a `Tile` explaining what each Domain selects for downstream — patient fields (Clinical), sampling site + compliance standard (Environmental), collection lot + taxonomy (Vector). Helper text alone is too thin for admins making a first-time classification decision.

**FR-16.2 — Questionnaire section "How to use" banner:** At the top of the Questionnaire section, a dismissible `InlineNotification kind="info"` explains the dual-path:
- "GUI builder (Edit JSON off) — add questions one at a time. Best when starting from scratch or making small edits."
- "JSON paste (Edit JSON on) — paste a complete FHIR Questionnaire from a partner deployment. Best when reusing an existing form."
- "Switch between modes at any time — your work round-trips through the same JSON."

The banner is dismissible per user (persist dismissal in user preferences via existing `user_preference` table; key `admin.programs.questionnaire.guidance.dismissed`).

**FR-16.3 — JSON mode reference card:** Below the JSON textarea, a non-dismissible `Tile` shows a minimal reference enough to let someone (typically using an LLM) produce a valid payload:
- One-line format declaration: "Format: FHIR R4 Questionnaire"
- Allowed `item.type` values as 10 chips: `boolean`, `choice`, `checkbox`, `integer`, `decimal`, `date`, `time`, `string`, `text`, `quantity`
- One-line tip: "Paste a partner export, hand-write it, or ask an LLM to produce a FHIR R4 Questionnaire JSON using only the item.type values above."

The card deliberately does *not* teach the FHIR Questionnaire spec inline (no walkthrough of `resourceType`, `linkId`, `text`, `item[]` structure). Anyone qualified to author or paste FHIR JSON either knows the spec or will hand the request to an LLM with the above constraints — both paths work without us reproducing the spec on screen. The Validate button (FR-13) catches malformed inputs.

**FR-16.4 — GUI mode empty state:** When the Questions list is empty, replace the Add New Question button with an empty-state `Tile`:
- Heading: "No questions yet"
- Body: "Add questions one at a time below, or flip Edit JSON on to paste a complete Questionnaire from another deployment."
- Primary action: "+ Add First Question" button

**FR-16.5 — Per-question type example:** When a Question Type is selected, the card shows a small example sentence in a `Tile` immediately below the Type dropdown — e.g. for Integer: *"Whole numbers only. Example: 'Gestational age (weeks)' — 24."* The example updates live when the Type changes. This avoids admins guessing the difference between String and Text, or Choice and Checkbox. (See FR-15 for the full enum; FR-16.5 adds the example sentence to each.)

| Type | Example sentence |
|---|---|
| Boolean | Use when the question has a yes/no answer. Example: "First antenatal visit?" |
| Choice | One option picked from a fixed list. Example: "Specimen condition" — Acceptable / Compromised / Rejected. |
| Checkbox | Multiple options can be selected. Example: "Symptoms present" — Fever, Cough, Headache, Fatigue. |
| Integer | Whole numbers only. Example: "Gestational age (weeks)" — 24. |
| Decimal | Numbers with decimal places. Example: "Maternal weight (kg)" — 62.4. |
| Date | Calendar date picker. Example: "Date of last menstrual period". |
| Time | Time-of-day picker. Example: "Time of sample collection". |
| String | Short free-text, single line. Example: "Provider name". |
| Text | Long-form free-text, multi-line. Example: "Clinical notes". |
| Quantity | Numeric value with a unit. Example: "Volume collected — 5 mL". |

**FR-16.6 — Localization:** All guidance strings (banner, reference card, empty state, type examples, domain explainer rows) are i18n-wrapped under `admin.programs.guidance.*`. No raw English strings in the JSX. The example sentences MUST be localizable because the example domain references ("antenatal visit", "specimen condition") may not be culturally / linguistically natural in every deployment language and translators should be free to substitute equally clear domain examples.

### FR-17 — Relationship to Catalyst (OGC-70 / OGC-113)

This FRS is a Domain rework, not a Questionnaire-builder rewrite. The existing JSON paste path and the GUI question-card builder are both shipped, supported, and durable — they are the configuration mechanism for Program Questionnaires.

**Catalyst** (OGC-70 parent epic) is a future LLM-powered assistive tool for OpenELIS users. The **Catalyst Form Builder** (OGC-113, Backlog) is one of its planned modules — a future drag-and-drop + natural-language layer that helps admins build forms with LLM assistance. Catalyst will sit *alongside* the existing paths as an assistive accelerator (e.g., "Generate the HBV antenatal Questionnaire from this description"), not as a forced replacement that retires the manual JSON/GUI paths.

For this rework: do nothing special for Catalyst integration. When Catalyst ships, it will read/write the same FHIR Questionnaire resource the existing paths produce, so no schema changes are needed here to make it future-compatible.

---

## On-screen guidance i18n keys

Add to the i18n table (extends FR-10):

| Key | English fallback |
|---|---|
| `admin.programs.guidance.domain.toggle.show` | What does each Domain mean? |
| `admin.programs.guidance.domain.toggle.hide` | Hide what each Domain means |
| `admin.programs.guidance.domain.clinical` | Patient-centered orders. Forms capture patient identifiers, provider, prior history. Shows in Clinical reception flows. |
| `admin.programs.guidance.domain.environmental` | Compliance & surveillance sampling (water, food, air). Forms capture sampling site, compliance standard, hold-time. No patient fields. |
| `admin.programs.guidance.domain.vector` | Vector / specimen surveillance (mosquito, tick). Forms capture collection lot, species/taxonomy, pool manifest. |
| `admin.programs.guidance.questionnaire.banner.title` | How to add questions to this Program's order form |
| `admin.programs.guidance.questionnaire.banner.body.gui` | GUI builder (Edit JSON off) — add questions one at a time. Best when starting from scratch or making small edits. |
| `admin.programs.guidance.questionnaire.banner.body.json` | JSON paste (Edit JSON on) — paste a complete FHIR Questionnaire from a partner deployment. Best when reusing an existing form. |
| `admin.programs.guidance.questionnaire.banner.body.roundTrip` | Switch between modes at any time — your work round-trips through the same JSON. |
| `admin.programs.guidance.json.referenceCard.format` | Format: FHIR R4 Questionnaire |
| `admin.programs.guidance.json.referenceCard.allowedTypes` | Allowed item.type values: |
| `admin.programs.guidance.json.referenceCard.tip` | Paste a partner export, hand-write it, or ask an LLM to produce a FHIR R4 Questionnaire JSON using only the item.type values above. |
| `admin.programs.guidance.gui.emptyState.title` | No questions yet |
| `admin.programs.guidance.gui.emptyState.body` | Add questions one at a time below, or flip Edit JSON on to paste a complete Questionnaire from another deployment. |
| `admin.programs.guidance.gui.emptyState.action` | + Add First Question |
| `admin.programs.guidance.type.example.boolean` | Use when the question has a yes/no answer. Example: "First antenatal visit?" |
| `admin.programs.guidance.type.example.choice` | One option picked from a fixed list. Example: "Specimen condition" — Acceptable / Compromised / Rejected. |
| `admin.programs.guidance.type.example.checkbox` | Multiple options can be selected. Example: "Symptoms present" — Fever, Cough, Headache, Fatigue. |
| `admin.programs.guidance.type.example.integer` | Whole numbers only. Example: "Gestational age (weeks)" — 24. |
| `admin.programs.guidance.type.example.decimal` | Numbers with decimal places. Example: "Maternal weight (kg)" — 62.4. |
| `admin.programs.guidance.type.example.date` | Calendar date picker. Example: "Date of last menstrual period". |
| `admin.programs.guidance.type.example.time` | Time-of-day picker. Example: "Time of sample collection". |
| `admin.programs.guidance.type.example.string` | Short free-text, single line. Example: "Provider name". |
| `admin.programs.guidance.type.example.text` | Long-form free-text, multi-line. Example: "Clinical notes". |
| `admin.programs.guidance.type.example.quantity` | Numeric value with a unit. Example: "Volume collected — 5 mL". |

---

## Permissions & Audit

- **Role attachment:** Existing **Admin** role bundle (the binary admin bit) grants Programs admin access. The Test Catalog Manager role does **not** grant Programs editor access — Test Catalog Manager is a documented exception scoped to Test Catalog only (per memory `feedback_openelis_admin_permissions`). No new permission keys are introduced. OpenELIS uses binary admin + per-module roles; do not introduce per-action keys like `program.domain.edit`.
- **Roles Builder additions:** None.
- **Audit events:** `PROGRAM_DOMAIN_UPDATED` per FR-8. No read auditing.
- **Envers coverage:** Yes on `Program` entity per FR-9 (existing `@Audited`).

---

## Data Model

### Existing entities reused

- **`program`** — existing OpenELIS table. Reused. Already stores the Questionnaire as a FHIR Questionnaire resource (JSON column or linked FHIR resource — confirm exact storage shape with engineering during build). No structural change to Questionnaire storage in this rework.
- **`audit_trail`** — existing. Reused for the `PROGRAM_DOMAIN_UPDATED` action.
- **FHIR Questionnaire** — existing FHIR R4 resource. Item types restricted to the 10-value enum in FR-15. No FHIR schema change.
- **Domain enum** — canonical values are `CLINICAL / ENVIRONMENTAL / VECTOR`. Used on Test (OGC-748), Lab Unit (OGC-361 rewritten), and Programs (this FRS). Pre-decision artifacts may show a 4-value version with `BOTH`; that fourth value has been retired and should not appear in new specs, schema, or UI. SampleType (OGC-538) historically shipped with `Clinical / Environmental / Both`; alignment to the 3-value enum is a separate follow-up.

### New columns

| Table | Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|---|
| `program` | `domain` | `ENUM('CLINICAL', 'ENVIRONMENTAL', 'VECTOR')` | NOT NULL (after migration) | none | Backfilled to `CLINICAL` for existing rows |

No new entities. No new junction tables.

---

## Dependencies

1. **OGC-748** (Test Catalog Basic Info Domain — Backlog) — pattern source. Mirror its radio group component, modal copy, and i18n key naming convention.
2. **OGC-361** (Lab Unit Domain — In Progress, rewritten today) — sibling implementation; same enum, same pattern. Coordinate so both ship in the same release for harmonization.
3. **OGC-538** (SampleType Domain Classification — Done) — currently ships with the pre-decision `Clinical / Environmental / Both` shape, which is incompatible with the canonical 3-value enum. A separate follow-up ticket is required to migrate SampleType to `CLINICAL / ENVIRONMENTAL / VECTOR` (retiring `Both` rows by re-classifying each — typically `Both` → `CLINICAL` if the sample type is primarily clinical, or `ENVIRONMENTAL` if primarily environmental; admins re-classify post-migration). **Programs FR-6 does not depend on SampleType Domain values** (the Program picker filters by Program's own Domain, not by Sample Type's), so the two specs can ship independently. The SampleType realignment is tracked as a separate ticket and is the last harmonization step.
4. **OGC-189** (Lab Units Redesign Epic) — for visual parity. The Programs editor here is the existing single-page editor; a future Programs Management Redesign (parallel to OGC-189) can wrap this Domain field into a multi-tab editor without changing FR-1..FR-10.
5. **Order Entry Step 1** (3-step Reception wizard for Env/Vector per the 2026-04-25 revision; clinical may still use its existing flow) — Step 1 sets the order's Domain. FR-6 is a server-side filter on the Programs API call from that step. **No UI change required to Step 1 itself.**

---

## Non-Functional Requirements

- **Performance:** Programs list with Domain filter must return in <300ms for 500 programs (current max deployment is ~120). Server-side filter on indexed `(domain, active)` columns.
- **Migration safety:** Backfill must run as a single transaction. On a 120-row Programs table this is trivial; design holds even at 1000 rows. Rollback path: drop `domain` column.
- **Backwards compatibility:** Any existing REST clients that GET `/programs` continue to receive existing fields. The new `domain` field is added to the response payload (additive). No API version bump required.
- **i18n:** All keys must have English fallbacks (per Constitution Principle 1). French (Madagascar deployments) and Bahasa Indonesia (SILNAS Indonesia) translations follow in the normal translation cycle — not blocking.

---

## Out of Scope (this FRS)

- Catalyst LLM assistance for Questionnaire authoring (OGC-70 / OGC-113) — future assistive layer; no integration work in this rework
- Program indicator definitions and funder report bindings
- Multi-domain Programs. A Program serves exactly one Domain; this is a deliberate constraint, not a v1 limitation. If a deployment thinks they need a Program that serves both clinical and environmental work, the right answer is two Programs (one per Domain) sharing a common code prefix — not a fourth `BOTH` enum value. The same constraint applies on the order side.
- Programs editor multi-tab redesign (mirror of OGC-189 for Programs) — deferred to a future FRS
- Per-Program lab-unit Domain enforcement (e.g., a Vector Program may only be assignable to a Vector lab unit). Not enforced in v1; admin discretion. Add as a v2 validation if mis-assignment becomes a real pain point.

---

## Acceptance Criteria

- [ ] **AC-1** Domain radio group rendered in Program Basic Info section, three options, required
- [ ] **AC-2** Save button disabled until Domain is selected on a new Program
- [ ] **AC-3** Domain change on an existing Program triggers confirmation modal with OGC-748-style copy
- [ ] **AC-4** Cancel on modal does not save; Confirm commits and writes audit row
- [ ] **AC-5** Domain column rendered in Programs list view as colored Carbon Tag (blue / green / purple)
- [ ] **AC-6** Domain column is sortable
- [ ] **AC-7** Domain MultiSelect filter present above list; filters server-side; combines with Name search and Active filter via AND
- [ ] **AC-8** Order Entry Step 1 Program picker filters by order Domain per FR-6 table
- [ ] **AC-9** Picker empty state displays correct Domain-specific i18n message
- [ ] **AC-10** Migration backfills existing rows to CLINICAL and enforces NOT NULL
- [ ] **AC-11** Post-upgrade banner displayed once to admins after migration
- [ ] **AC-12** `PROGRAM_DOMAIN_UPDATED` audit row written on every Domain change with correct payload shape
- [ ] **AC-13** Envers revision tracks Domain column changes on the `Program` entity
- [ ] **AC-14** All UI strings i18n-wrapped per FR-10 key list
- [ ] **AC-15** Existing REST clients receive the new `domain` field additively (no breaking change)
- [ ] **AC-16** Editor page renders Program selector → Basic Info row → Domain radio → Questionnaire section in that order (FR-11)
- [ ] **AC-17** Edit JSON toggle switches between raw JSON textarea (ON) and Question card builder (OFF); only one mode visible at a time (FR-12)
- [ ] **AC-18** Mode switch with unsaved JSON / unsaved Question cards prompts before discarding (FR-12, FR-15.2)
- [ ] **AC-19** Validate JSON button parses + validates against FHIR Questionnaire R4 shape with inline error or success notification (FR-13)
- [ ] **AC-20** Question card renders Question Text, Question Type dropdown, and an OverflowMenu (⋮) in the top-right; default Type is "String" (FR-14)
- [ ] **AC-20.1** Card inputs commit to in-memory state on blur (or Enter / dropdown change); no per-card Save button is present
- [ ] **AC-20.2** No "draft" visual treatment on cards — cards always reflect current in-memory state
- [ ] **AC-21** Question Type dropdown has exactly 10 values in the listed order (FR-15)
- [ ] **AC-22** Add New Question button appends a fresh card with "New Field" + Type "String" and focuses the Question Text input (FR-14)
- [ ] **AC-23** OverflowMenu "Delete question" requires Modal confirmation before removing the card (FR-14)
- [ ] **AC-23.1** When Type is Choice or Checkbox, the card shows an Answer options sub-section with repeating TextInput rows, per-row delete buttons, and an "+ Add option" button (FR-14.1)
- [ ] **AC-23.2** Changing Type to a non-Choice/Checkbox value hides the answer options sub-section but preserves the underlying answerOption[] array; switching back restores them
- [ ] **AC-23.3** Imported answerOption entries with valueCoding render with a small "(coded)" badge and a read-only label; admin must use JSON mode to edit the underlying code/system
- [ ] **AC-24** Mode round-trip is lossless: switching Visual Builder → JSON → Visual Builder returns the same JSON (modulo whitespace) when no edits are made (FR-12)
- [ ] **AC-25** Broken i18n keys `program.name.program` and `program.name.code` no longer leak in the live UI (FR-10 fix)
- [ ] **AC-26** Domain field has a "What does each Domain mean?" toggle that reveals an explainer for all three values (FR-16.1)
- [ ] **AC-27** Questionnaire section opens with a dismissible info banner explaining the GUI vs JSON paths; dismissal persists per user (FR-16.2)
- [ ] **AC-28** JSON mode shows a non-dismissible reference card listing required keys, the 10 allowed item.type values as chips, and a partner-export tip (FR-16.3)
- [ ] **AC-29** GUI mode shows an empty-state Tile when no questions exist with heading, body copy, and a "+ Add First Question" primary action (FR-16.4)
- [ ] **AC-30** Each question card displays an example sentence below the Type dropdown that updates live when the Type changes (FR-16.5)
- [ ] **AC-31** All guidance strings are i18n-wrapped under `admin.programs.guidance.*` (FR-16.6)
- [ ] **AC-32** Live "Example" preview pane renders to the right of the Questionnaire editor in both modes (FR-13.5)
- [ ] **AC-33** Preview pane updates immediately on every GUI mode change (add / edit / delete / type change / debounced text edit)
- [ ] **AC-34** Preview pane updates only after a successful Validate in JSON mode, and shows a "last validated" caption when JSON is dirty
- [ ] **AC-35** Each Question Type renders the correct read-only Carbon control in the preview (Checkbox group for Checkbox, Select for Choice, DatePicker for Date, etc.)
- [ ] **AC-36** Preview pane is non-interactive (all inputs `readOnly`)
- [ ] **AC-37** Empty state placeholder shown when zero questions exist
- [ ] **AC-38** Preview pane scrolls independently when the questionnaire is taller than the viewport

---

## Localization Table

See FR-10 above. All keys must appear in the English `messages.properties` (or equivalent) before merge. Other languages follow in translation cycle.

---

## Open Questions

1. Should the **Domain change confirmation modal** also list the count of historical orders attached to the Program (e.g., "This Program has 1,247 historical orders…")? — *Recommendation:* not in v1; the simple copy is sufficient and querying the count adds latency to the save flow. Revisit if admins ask.
2. Should the **list view Domain filter** default to "current user's primary Domain" (if such a profile attribute exists) or to "All"? — *Recommendation:* default to All. Auto-filtering hides records and confuses admins doing a routine catalog scan.
3. Should Vector be visually distinguished beyond color (e.g., a small mosquito icon)? — *Recommendation:* not in v1. Tag color + label is sufficient and consistent with Tests / Lab Units.
