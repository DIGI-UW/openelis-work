# Programs Management — Consolidated Functional Requirements Specification

> **In plain language (for the dev):** A "Program" in OpenELIS is a named lab initiative — HIV Care,
> TB DOTS, a dengue sentinel survey, a water-quality surveillance program. This rework brings the
> Programs admin page in line with the rest of the catalog admin and modernizes it in four ways:
> (1) every Program gets a **Domain** (Clinical / Environmental / Vector) so pickers and reports can
> filter by it; (2) the page **moves** under Admin → Test Management where it belongs; (3) the
> Questionnaire authoring gets a **Visual Builder ↔ JSON** switch with a **live preview**; and (4)
> Programs get a proper **Deactivate / Reactivate** lifecycle (no hard delete). One consolidated spec,
> version-agnostic — the implementing developer slices the work from the Epic (we don't pre-slice into
> stories anymore).

**Feature:** Programs admin rework — Domain classification, Test Management IA, Visual/JSON Questionnaire builder + live preview, and Deactivate/Reactivate lifecycle
**Status:** Draft v2.0 (consolidated)
**Date:** 2026-07-01
**Supersedes:** `programs-management-frs.md` (base Domain FRS) + `programs-management-deactivate-addendum.md` (lifecycle addendum) — merged here into one source
**Jira epic:** OGC-781 (Programs Management Rework) — **not yet in build** (In Progress/claimed, no implementation PR as of 2026-07-01); this consolidated spec replaces the phased breakdown in that epic
**Pattern source:** OGC-748 (Test Catalog Basic Info — Domain radio group)
**Related tickets:** OGC-361 (Lab Unit Domain), OGC-538 (SampleType Domain follow-up), OGC-189 (Lab Units Redesign), OGC-296 (Sample Type Management), OGC-527 (Env/Vector Epic)
**Governing decisions:** D-002 (no hard delete), D-004 (Domain has no BOTH), D-005 (inline edit; modal for destructive/large), D-012 (path-segment route), D-013 (breadcrumb label drift), D-028 (one Epic per mockup; dev slices)

---

## Lab Context

### Current State

A Program is a named clinical or surveillance initiative that a country's ministry of health runs
across the lab network — each with its own indicator set, funder reporting, and often its own
order-entry form. Today the Programs admin is a flat list editor (name, code, description, lab-unit
assignment, active flag), and it sits on the main Admin menu rather than with the other catalog admin
pages. It has no field saying what *kind* of work a Program does, so an environmental
compliance program sits in the same dropdown as a clinical HIV program at Reception. Editing a
Program's order-entry Questionnaire is done through an "Edit JSON" toggle or a bare set of question
cards, with no live view of what reception staff will actually see. And the only lifecycle control is
a bare Active checkbox with no confirmation, no warning about orders in use, and no way to find a
switched-off Program again.

### Pain

A reception clerk at SILNAS Indonesia enters 40–60 orders a day across clinical, environmental, and
vector work, and must pick a Program from a dropdown of ~35 — with no way to filter — so scrolling
wastes time and cross-domain mis-attribution happens (a water sample coded to a clinical hepatitis
program), which corrupts both programs' indicator counts. An admin building a Program's order form
edits raw JSON or bare cards and only discovers a field-ordering mistake when reception complains,
because there's no preview. And when a surveillance project ends, unchecking Active silently drops the
Program from reception's picker with no warning that 300 historical orders reference it — and because
the Program then disappears from the list with no way back, the admin recreates it as a duplicate,
splitting the indicator counts.

### What Changes

Every Program gets a **Domain** (Clinical / Environmental / Vector), set the same way as on Tests and
Lab Units, with a list column, a list filter, and downstream filtering of the Order Entry Program
picker — so reception sees only the ~12 programs relevant to the order's domain. The page **moves**
under Admin → Test Management alongside the rest of the catalog admin. Questionnaire authoring gets a
**Visual Builder ↔ JSON** content switcher with a **live "Example" preview** so admins see exactly
what reception will see as they build. And Programs get a real **Deactivate / Reactivate** lifecycle:
deactivating warns how many orders are affected and confirms history is preserved; the list hides
deactivated programs by default behind a **Show deactivated** toggle; reactivating is one click, so
duplicates stop happening. No Program is ever hard-deleted.

---

## Navigation & URL

- **SideNav placement:** `Admin → Test Management → Programs` (moved from the main Admin menu — an IA
  fix). SideNav-config change only; URL is unchanged, so existing bookmarks stay valid.
- **Breadcrumb (list):** `Home / Admin Management / Test Management / Programs`
- **Breadcrumb (editor):** `Home / Admin Management / Test Management / Programs / Add/Edit Program`
- **Breadcrumb label quirk (D-013):** SideNav reads "Admin"; first breadcrumb reads "Admin
  Management" — preserved live-app drift.
- **URL (list):** `/MasterListsPage/program` — existing live path-segment (singular `program`);
  preserved to avoid breaking deep links.
- **Editor is INLINE, not a separate page (decision 2026-07-01, reverses the earlier "dedicated
  page" call):** clicking **Edit** on a list row expands the full editor inline beneath the row;
  **Add Program** opens the same editor inline at the top of the list. This matches D-005 (inline
  row expansion for edits) and keeps the admin in one place. There is no separate `/program/<uuid>`
  editor route; an optional deep link may open the list with a given row pre-expanded, but that is a
  convenience, not a distinct page. The Questionnaire section's two-column editor + live preview
  renders inside the expanded region (it is tall, so the expanded row scrolls).

---

## Overview

Rework the Programs admin to harmonize with the rest of the catalog admin and modernize Questionnaire
authoring, across four pillars:

1. **Domain field** — CLINICAL / ENVIRONMENTAL / VECTOR on every Program; list column + filter;
   Order Entry picker filtering.
2. **IA move** — Programs relocates under Test Management (SideNav config; URL unchanged).
3. **Questionnaire authoring** — `ContentSwitcher` (Visual Builder ↔ JSON), question-card overhaul
   (auto-save on blur, OverflowMenu, inline answer-options editor), and a live "Example" preview pane.
4. **Deactivate / Reactivate lifecycle** — confirmed deactivate with order-reference count, default
   hide-deactivated + Show-deactivated toggle, one-click reactivate, audit — no hard delete.

The FRS is **version-agnostic**. It does not pre-slice into phases or stories; the implementing
developer slices the work from the Epic against the live code (D-028). A non-binding slicing guide is
included at the end for orientation only.

---

## User Stories

1. **As a lab administrator**, I want to mark each Program Clinical / Environmental / Vector so Programs
   behaves like the rest of the catalog and downstream pickers can filter accurately.
2. **As a reception clerk** entering an environmental order, I want the Program picker to show only
   Environmental programs so I stop coding a water sample to a clinical program.
3. **As a lab administrator**, I want to filter the Programs list by Domain and by active/deactivated
   so I can audit the catalog without scrolling past irrelevant rows.
4. **As a lab administrator**, I want to author a Program's order form either by pasting FHIR
   Questionnaire JSON or by building questions visually, and see a **live preview** of what reception
   will see.
5. **As a lab administrator** retiring a program, I want to **deactivate** it with a confirmation that
   tells me how many orders reference it and that history is preserved — and **reactivate** it in one
   click if needed — so I never silently break the picker or create a duplicate.
6. **As an auditor**, I want Domain changes and deactivate/reactivate recorded in the audit trail, so
   program lifecycle and classification changes are traceable for accreditation.

---

## Functional Requirements

### Domain classification

**FR-1 — Domain field on the Program record.** Add a `domain` column to `program`:
`ENUM('CLINICAL','ENVIRONMENTAL','VECTOR')`, not nullable (backfilled — FR-7). No schema default.

**FR-2 — Domain radio group (Basic Info).** Required Carbon `RadioButtonGroup` labeled "Domain" with
Clinical / Environmental / Vector. Save disabled until selected; nothing pre-selected for a new
Program; exactly one selection (no BOTH — D-004); placed under Name/Code/Description, above lab-unit
assignment.

**FR-3 — Domain change confirmation (existing Program).** Changing the saved Domain opens a
confirmation modal (copy mirrors OGC-748): historical orders were evaluated against the prior domain's
rules; the change is forward-looking and does not re-code past orders. New (unsaved) Programs don't
trigger it.

**FR-4 — Domain column in the list.** Between Name and Lab Unit, a sortable Carbon `Tag` column:
Clinical → `blue`, Environmental → `green`, Vector → `purple`.

**FR-5 — Domain filter on the list.** A Carbon `MultiSelect` labeled "Domain" (Clinical / Environmental
/ Vector); empty = all; combines via AND with Name/Code search and the Show-deactivated toggle
(FR-19); session-persistent, resets on logout.

**FR-6 — Order Entry Program picker filtered by order Domain.** At Step 1, the picker shows only
Programs where `domain = <order domain>` AND `active = true`. Domain-specific empty-state messages
(e.g. "No Clinical programs are currently active…"). No BOTH; orders carry exactly one domain.

**FR-7 — Migration backfill.** Add `domain` nullable; backfill existing rows to `CLINICAL`; alter to
NOT NULL; emit a one-time post-upgrade banner ("Programs upgraded — all defaulted to Clinical. Review
and re-classify Environmental/Vector programs.").

**FR-8 — Audit (Domain).** `PROGRAM_DOMAIN_UPDATED` on every Domain change of a persisted Program
(`{from, to, program_code}`, actor, timestamp). Create rides the existing `PROGRAM_CREATED` payload.
Migration backfill emits one `PROGRAM_DOMAIN_BACKFILLED_BY_MIGRATION` attributed to `SYSTEM_MIGRATION`.

**FR-9 — Envers.** `Program` is `@Audited`; confirm the new `domain` column is tracked (no field-level
exclusion).

### Editor & Questionnaire authoring

**FR-10 — Inline editor layout.** The editor renders inline (row expansion for Edit; a panel at the
top of the list for Add). Top-to-bottom: an at-a-glance guidance intro → Basic Info → Domain →
Lifecycle (edit only) → Questionnaire (two-column: editor left, live "Example" preview right) → Save /
Cancel (Save disabled until Domain selected and form valid). The label "Example" is the **rendered
preview pane** (FR-13.5), not a free-text input.

**FR-10.1 — Basic Info fields (Code and UUID not surfaced).** Basic Info shows only **Program Name**
(with helper: the name reception sees at order entry) and **Lab unit(s)** (FR-10.2). The program's
**`code` and `uuid` are system-managed and are NOT shown in the editor or the list** (decision
2026-07-01) — they remain on the record (and in the API) but are not user-facing fields. This removes
the live-app confusion of a raw `program.name.program`-labelled Code field and an internal UUID.

**FR-10.2 — Lab unit(s) is a multi-select with Select-all.** A Program may be run by more than one lab
unit, so the single "Test Section" control becomes a **multi-select** (Carbon `FilterableMultiSelect`)
labelled **"Lab unit(s)"** with a **Select all** affordance. **Data-model dependency (D-009):** the
current `program`→lab-unit link is single-valued (one `test_section`); supporting multiple units
requires a **`program_lab_unit` junction table** (many-to-many). This is a **named new dependency** —
flag at build; the Order Entry Program picker (FR-6) filters by Domain, not by lab unit, so it is
unaffected. Label is "Lab unit" everywhere (the term "Test Section" is retired from this UI).

**FR-11 — Mode switch (ContentSwitcher).** Carbon `ContentSwitcher` with two equal segments —
**Visual Builder** (default) and **JSON**. Replaces the legacy Edit JSON `Toggle`. One mode visible at
a time; underlying store is one FHIR Questionnaire resource; switching round-trips through it. JSON →
Visual Builder prompts before discarding unsaved/invalid JSON.

**FR-11.1 — Round-trip limits.** Lossless only for the GUI-supported subset (`linkId`, `text`, `type`,
`answerOption[]` for Choice/Checkbox). Advanced FHIR features (`enableWhen`, `repeats`, nested
`item[]`, `required`, `readOnly`, `initial[]`, `code[]`, extensions) are preserved verbatim and shown
as read-only "advanced" cards steering the admin to JSON mode. (Catalyst, OGC-113, is the future
assistive path — not a dependency here; D-023.)

**FR-12 — JSON mode validation.** Validate button parses JSON, checks FHIR Questionnaire R4 shape
(`resourceType === 'Questionnaire'`, `item[]`, each item has `linkId`/`text`/`type` from the allowed
enum); inline Carbon `InlineNotification` error (with reason) or success ("Validated — N questions").
Submit disabled until valid.

**FR-13 — Visual Builder cards.** Questionnaire id input; repeating Question cards (Carbon `Tile`) with
Question Text, Question Type (`Select`, 10 FHIR item.type values — FR-15), answer-options sub-section
for Choice/Checkbox (FR-14), and an `OverflowMenu` (⋮) with Delete (Modal-confirmed). **No per-card
Save** — inputs commit to in-memory state on blur; the page Submit persists in one transaction. No
"draft" visual treatment. "Add New Question" seeds "New Field" + Type "String".

**FR-14 — Answer-options editor (Choice/Checkbox).** Repeating `TextInput` rows + per-row ghost delete
`IconButton` + "+ Add option"; empty-state placeholder; persists to `answerOption[]` as
`{valueString}`; switching Type away preserves the array; imported `valueCoding` renders read-only with
a "(coded)" badge (edit in JSON).

**FR-15 — Question Type enum.** Exactly 10 values, this order: Boolean, Choice, Checkbox, Integer,
Decimal, Date, Time, String, Text, Quantity. Default String.

**FR-15.3 — Quantity units are extension-defined (JSON-only).** A `quantity` answer is a number **plus
a unit**, but FHIR R4 does not put the unit on the bare `item.type`: the allowed unit(s) come from the
`questionnaire-unit` (one fixed unit) or `questionnaire-unitOption` (a choice list) extension on the
item — and *"in the absence of either, any unit is valid."* Those extensions are outside the Visual
Builder's editable subset (FR-11.1), so a Quantity question authored purely in the Visual Builder is
**unit-unconstrained** (accepts any unit). To fix or offer units, author them in **JSON mode**. The
live preview renders a Quantity as a number input + a unit control to make the unit's presence obvious;
the guidance/example text states the unit is set via the extension in JSON. (Source: FHIR R4
questionnaire-unit / -unitOption extensions.)

**FR-13.5 — Live "Example" preview pane.** Right of the editor, renders the questionnaire read-only as
reception will see it. Visual Builder: updates immediately (text debounced ~200ms). JSON: updates only
after a successful Validate, with a "Preview reflects last validated JSON. Validate to refresh." caption
when dirty. Each Type maps to the correct read-only Carbon control; empty-state placeholder; scrolls
independently. Does not exercise `enableWhen`/`repeats`/nested items in v-scope.

**FR-16 — On-screen guidance.** Domain "What does each Domain mean?" disclosable; dismissible
Questionnaire dual-path info banner (persist dismissal in `user_preference`); non-dismissible JSON
reference card (format line + 10 item.type chips + LLM-authoring tip); GUI empty-state Tile; per-Type
example sentence under the Type dropdown. All i18n-wrapped under `admin.programs.guidance.*`.

**FR-17 — i18n leak fix.** Replace the leaking raw keys `program.name.program` / `program.name.code`
with proper labels + fallbacks so raw keys never render.

### Lifecycle — Deactivate / Reactivate (No Hard Delete — D-002)

**FR-18 — Lifecycle state.** The existing `program.active` boolean is the lifecycle state: **Active**
(`true`) or **Deactivated** (`false`). There is **no hard-delete path** — the editor and list expose
Deactivate / Reactivate only.

**FR-18.1 — Deactivate action.** In the list row `OverflowMenu` (⋮) and in the editor Basic Info
(status `Tag` + a `Button kind="danger--tertiary"`). The bare Active checkbox is retired in favor of
this explicit, labeled control.

**FR-18.2 — Deactivate confirmation (with order count).** Opens a confirmation `Modal`:
> **Deactivate this Program?** "{programName}" will stop appearing in the order-entry Program picker
> for new orders. Its {orderCount} historical order(s) keep their program coding and all indicator
> counts are preserved. You can reactivate it any time from the Programs list. [Cancel] [Deactivate]

`{orderCount}` is a read-time indexed count (`sample`/`order` by `program_id`); if unavailable, the
modal degrades to generic copy without blocking. Zero-order case uses "This Program has no orders…".

**FR-18.3 — Reactivate.** From the row `OverflowMenu` / editor (visible when Show-deactivated is on).
**Not** modal-gated (non-destructive, reversible); shows a success `InlineNotification`; the Program
returns to the domain-filtered order picker (FR-6).

**FR-19 — List defaults to hiding deactivated + Show-deactivated toggle.** The list hides deactivated
Programs by default (D-002). A Carbon `Toggle` "Show deactivated" in the toolbar reveals them (rows
muted, "Inactive" `gray` Tag). Combines via AND with Name/Code search and the Domain filter (FR-5);
session-persistent, resets on logout. (This is the resolution of the "active/inactive" filter — a
default-hide toggle, not a neutral show-all filter.)

**FR-19.1 — Status column.** An "Active" status column (sortable) after the Domain column: Active →
`green` "Active"; Deactivated → `gray` "Inactive".

**FR-20 — Audit (lifecycle).** `PROGRAM_DEACTIVATED` (`{program_code, orderCount, actor}`) and
`PROGRAM_REACTIVATED` (`{program_code, actor}`). Envers already tracks `active` on the `@Audited`
entity.

---

## Permissions & Audit

- **Role attachment:** the existing **Admin** role bundle (binary admin bit) grants all Programs admin
  actions, including Deactivate / Reactivate. **Test Catalog Manager does NOT** grant Programs access
  (documented exception, scoped to Test Catalog). No new permission keys (D-006).
- **Audit events:** `PROGRAM_DOMAIN_UPDATED`, `PROGRAM_DEACTIVATED`, `PROGRAM_REACTIVATED`, plus the
  migration backfill event. No read auditing.
- **Envers:** `Program` `@Audited`; `domain` and `active` tracked.

---

## Data Model

### Existing entities reused

- **`program`** — reused. Stores the Questionnaire as a FHIR Questionnaire resource (confirm exact
  storage shape at build); no structural change to Questionnaire storage. Reuses existing `active`.
- **`audit_trail`** — reused for the events above.
- **FHIR Questionnaire (R4)** — reused; item types restricted to the 10-value enum (FR-15).
- **Domain enum** — canonical `CLINICAL / ENVIRONMENTAL / VECTOR`; no BOTH anywhere (D-004).

### New columns

| Table | Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|---|
| `program` | `domain` | `ENUM('CLINICAL','ENVIRONMENTAL','VECTOR')` | NOT NULL (post-migration) | none | backfilled to `CLINICAL` |

**New junction (FR-10.2 — multi lab unit):** a **`program_lab_unit`** table (`program_id`,
`test_section_id`) to support a Program serving multiple lab units (many-to-many), replacing the
single-valued link. Named new dependency; migrate existing single assignments into one junction row
each. `{orderCount}` (FR-18.2) is a read-time count, not stored.

**Not surfaced (FR-10.1):** `program.code` and the program UUID remain on the record and in the API but
are **not** shown in the editor or list — no schema change, a UI-visibility decision only.

---

## API & Data Reuse (D-029 — reuse the existing Program backend; do not rebuild it)

The Programs admin already has a working backend — **reuse it.** Confirm exact paths against the repo
before build (`ProgramController` / the React admin's `getFromOpenElisServer` calls); the known/likely
endpoints:

| Operation | Method + path | Status |
|---|---|---|
| Create / update a Program (incl. Questionnaire) | `POST /rest/program` | **Existing** — `ProgramController.createProgram` (persists the record, then the FHIR Questionnaire via `fhirPersistanceService`). Reuse; add `domain` + `active` + `labUnits[]` to the payload additively. |
| List Programs | `GET /rest/program` (or the Master List program feed) | **Existing — confirm exact path.** Reuse; add `domain`/`active` to the response additively; the Domain filter + Show-deactivated are server-side query params. |
| Order-Entry Program picker feed | existing Step-1 programs call | **Existing.** FR-6 adds a server-side `domain = <order domain> AND active = true` filter to the same call — no new endpoint. |
| Deactivate / Reactivate | reuse the Program update path (`active` flag on `POST /rest/program`) | **Existing** — lifecycle is a field update, **not** a new endpoint. |

**New endpoints: none required.** Domain, lifecycle, and multi-lab-unit all ride on the existing
Program create/update + list calls (additive fields). The only new *data* is the `program.domain`
column and the `program_lab_unit` junction (Data Model). If build discovers the list/picker path
differs, record it here — do not assume a new controller.

---

## i18n reuse (D-029 — keep translation cost down)

Before adding any key below, reuse an existing one with the same English. **Common labels reuse the
shared namespace** — do **not** mint program-scoped versions: **Cancel, Search, Yes, No, Domain
(shared with Test/Lab Unit), Clinical / Environmental / Vector** (shared Domain value labels already
exist from OGC-748/OGC-361), and the status words **Active / Inactive**. The Domain radio, list column,
filter, and value tags should all pull the **same** Domain keys the Test Catalog and Lab Unit editors
use — one Domain vocabulary across the catalog, translated once. Truly new keys here are the
Programs-specific guidance, questionnaire-builder, and deactivate-modal strings. Mark each key
**Reuse**/**New** in the Localization table and keep the New count minimal.

---

## Dependencies

1. **OGC-748** (Test Catalog Domain) — pattern source (radio, modal copy, i18n naming).
2. **OGC-361** (Lab Unit Domain) — sibling; same enum/pattern; ship in the same release for harmony.
3. **OGC-538** (SampleType Domain) — separate follow-up to migrate `Both` → 3-value enum; FR-6 does
   **not** depend on SampleType Domain values, so specs ship independently.
4. **OGC-189** (Lab Units Redesign) — visual-parity reference.
5. **Order Entry Step 1** — sets the order's Domain; FR-6 is a server-side filter on the Programs API
   from that step. No UI change to Step 1 itself.

---

## Slicing guidance (non-binding — the dev slices from the Epic; D-028)

This spec is **not** pre-sliced into stories. Per current policy, the Epic (OGC-781) is the unit of
handoff and the implementing developer slices PR-sized increments from it against the live code. For
orientation only, natural seams a dev might use — each an independently shippable, dependency-ordered
slice, sized to a reviewable PR:

- **Domain harmonization** — schema + backfill + Basic Info radio + change modal + list column/filter
  + Order Entry picker filter + the IA move. Ships the domain value end-to-end on its own.
- **Deactivate / Reactivate lifecycle** — status column + Show-deactivated toggle (default hide) +
  deactivate confirm w/ order count + reactivate + audit. Independent of the editor modernization.
- **Questionnaire editor modernization** — ContentSwitcher + Visual Builder auto-save cards +
  OverflowMenu + JSON validate + guidance + i18n-leak fix.
- **Live preview + answer-options + round-trip safety** — the "Example" pane, Choice/Checkbox options
  editor, and FHIR advanced-feature preservation.

Cross-cutting concerns (i18n keys, audit entries, Envers, role attachment) belong to whichever slice
introduces them — not separate slices.

---

## Acceptance Criteria

Domain: [ ] radio required in Basic Info · [ ] Save disabled until Domain chosen (new) · [ ] change
modal on existing · [ ] Cancel no-save / Confirm writes audit · [ ] sortable colored Tag column ·
[ ] MultiSelect filter (server-side, AND with search + Show-deactivated) · [ ] Order Entry picker
filters by order Domain · [ ] domain-specific empty states · [ ] migration backfills to CLINICAL + NOT
NULL · [ ] post-upgrade banner once · [ ] `PROGRAM_DOMAIN_UPDATED` payload · [ ] Envers tracks Domain ·
[ ] REST adds `domain` additively.

Editor/Questionnaire: [ ] editor order per FR-10 · [ ] ContentSwitcher replaces Toggle, one mode
visible · [ ] mode-switch discards prompt · [ ] Validate JSON w/ inline error/success · [ ] cards:
Text + Type + OverflowMenu, default String · [ ] blur-commit, no per-card Save, no draft styling ·
[ ] 10 Types in order · [ ] Add New Question focuses text · [ ] Delete modal-confirmed · [ ] answer
options for Choice/Checkbox, preserve on Type-switch, "(coded)" read-only · [ ] round-trip lossless for
supported subset · [ ] live "Example" preview updates per mode rules + non-interactive + empty-state +
independent scroll · [ ] guidance affordances + per-user banner dismissal · [ ] i18n leaks fixed ·
[ ] all strings i18n-wrapped.

Lifecycle: [ ] list hides deactivated by default · [ ] Show-deactivated toggle (AND with filters,
session-persistent) · [ ] sortable green/gray status column · [ ] Deactivate in row menu + editor ·
[ ] deactivate modal shows order count / history-preserved · [ ] modal degrades gracefully + zero-order
copy · [ ] Cancel no-op / Deactivate writes `PROGRAM_DEACTIVATED` and drops from default list ·
[ ] Reactivate (non-modal) restores + success notice + `PROGRAM_REACTIVATED` + returns to picker ·
[ ] no hard-delete control anywhere · [ ] lifecycle strings i18n-wrapped.

---

## i18n keys

The consolidated key set merges the Domain/editor/guidance keys from the base FRS
(`admin.programs.*`, `admin.programs.basicInfo.domain.*`, `admin.programs.questionnaire.*`,
`admin.programs.guidance.*`, `breadcrumb.*`, `orderEntry.programPicker.empty.*`) with the lifecycle
keys below. All require English fallbacks before merge (Principle VII); other languages follow the
translation cycle.

| Key | English fallback |
|---|---|
| `admin.programs.list.column.active` | Active |
| `admin.programs.list.status.active` | Active |
| `admin.programs.list.status.inactive` | Inactive |
| `admin.programs.list.toggle.showDeactivated` | Show deactivated |
| `admin.programs.action.deactivate` | Deactivate |
| `admin.programs.action.reactivate` | Reactivate |
| `admin.programs.deactivate.modal.title` | Deactivate this Program? |
| `admin.programs.deactivate.modal.body` | "{programName}" will stop appearing in the order-entry Program picker for new orders. Its {orderCount} historical order(s) keep their program coding and all indicator counts are preserved. You can reactivate it at any time from the Programs list. |
| `admin.programs.deactivate.modal.body.noOrders` | This Program has no orders and will simply stop appearing for new orders. You can reactivate it at any time. |
| `admin.programs.deactivate.modal.confirm` | Deactivate |
| `admin.programs.deactivate.modal.cancel` | Cancel |
| `admin.programs.reactivate.success` | {programName} reactivated |

> The full Domain/editor/guidance i18n table (200+ keys) carries over unchanged from the base FRS —
> reproduce it verbatim in the implementation; it is not re-listed here to keep this consolidated
> document readable. The lifecycle keys above are additive to it.

---

## Out of Scope

- Catalyst LLM assistance for Questionnaire authoring (OGC-70 / OGC-113) — future; no work here.
- Program indicator definitions and funder report bindings.
- Multi-domain Programs / a BOTH value — a Program serves exactly one Domain (two Programs with a
  shared code prefix if needed).
- Programs editor multi-tab redesign (mirror of OGC-189) — future FRS.
- Per-Program lab-unit Domain enforcement — admin discretion in v-scope.
- Bulk deactivate/reactivate; cascade lifecycle from lab-unit; scheduled auto-deactivation (no
  end-date field exists).

---

## Reference set (one coherent handoff for Claude Code)

This feature ships as **one reference set** — a single implementer works all of it from these three
files together (the implementer is Claude Code, so a consolidated set beats scattered docs):

1. **Spec:** `programs-management.md` (this file)
2. **Mockup:** `programs-management.jsx` (Carbon; all four pillars incl. the new lifecycle)
3. **Preview:** `programs-management.html` (interactive; list + editor views)

These supersede the base `programs-management-frs.md`, the `programs-management-deactivate-addendum.md`,
and the older `programs-management-mockup.jsx`/`-preview.html` — do not hand those off separately.

## Handoff Media

| Asset | Type | Path | Shows |
|---|---|---|---|
| `programs-management.html` | interactive preview | workspace | target UI — list (Domain col, status, Show-deactivated toggle, Deactivate/Reactivate, confirm modal) + editor (Domain radio, lifecycle control, ContentSwitcher, live Example preview) |
| `programs-management.jsx` | Carbon mockup | workspace | implementation reference for the above |
| `handoff-programs-before/01-programs-list-current.png` | live "before" screenshot | `OpenELIS QA/docs-media/handoff-programs-before/` | current Program editor — captures the pain the FRS fixes: the raw `program.name.program` i18n leak used as a label (FR-17), the legacy "Edit Json" toggle (FR-11 replaces with ContentSwitcher), the "Example" preview label (FR-13.5), **no Domain field** (FR-2), and the misplaced "Program Entry" main-menu location + "Admin Management" breadcrumb (the IA move) |
| `handoff-programs-before/walkthrough.webm` | clip | same folder | navigation through the current editor |

Captured live from testing.openelis-global.org (v3.2.1.10) on 2026-07-01 via the openelis-screenshots
harness. Media is not committed by default; publish by copying into the gallery/Epic attachment.

---

## Mockup note

The companion mockup (`programs-management-mockup.jsx` / the committed
`designs/admin-config/programs-management.jsx`) predates the lifecycle work and must gain: the
**Active status column**, the **Show-deactivated `Toggle`** in the table toolbar, the row
**OverflowMenu Deactivate/Reactivate** actions, the **deactivate confirmation Modal** (with order
count), and the editor Basic-Info **status Tag + Deactivate/Reactivate control** replacing the bare
Active checkbox. The HTML preview should echo these so reviewers see the lifecycle affordances.
