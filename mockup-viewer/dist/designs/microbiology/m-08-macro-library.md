# M-08 Macro Library — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Admin → Macro Library (cross-cutting; Micro is first consumer)
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent), but cross-cutting OE feature
**Status:** Draft

> This FRS is self-contained. The AMR design-review edits — category helper text, the category chip on the macro dropdown, the seeded-vs-user-added distinction, the bulk-edit confirm, reserved-code handling, client cache refresh, and export/import legibility — are written **inline** in the relevant sections below; there is no separate edits doc or addendum.

This spec covers the cross-cutting macro system: a typing shortcut mechanism (`.code` → expanded text) that any opted-in field in OpenELIS can use. Micro is the first consumer, but the architecture is general so chemistry, hematology, pathology, and other modules can adopt later. This is **not** a Micro-specific feature.

---

## 1. Lab Context

**Current State.** Lab techs and supervisors retype the same narrative phrases dozens of times a day — Gram-stain observations, colony descriptions, interpretation paragraphs, clinical-correlation comments — by hand into free-text report fields.

**Pain.** Retyping is slow and inconsistent: the same finding gets worded three ways across reports, and standard language (ESBL confirmation wording, contamination caveats) drifts from the lab's intended phrasing. There is no shared, curated phrase library the way clinical EHRs have dot-phrases.

**What Changes.** A curated **Macro Library** turns short trigger codes into expansions: type `.gpc`, get "Gram positive cocci in clusters." Macros are organized into eight fixed **categories**, each bound to specific field contexts; a field only offers the macros for its category, and the macro dropdown shows a **category chip** so the user always knows which set is active. Seeded defaults ship with the system and are visually distinguished from a lab's own additions.

---

## 2. Overview

### 2.1 Purpose

Lab techs and supervisors generate substantial narrative text in micro reports: Gram stain observations, colony descriptions, clinical correlation comments, interpretation paragraphs. The same phrases recur dozens of times per day across specimens. A macro library is the LIMS equivalent of the dot-phrases in clinical EHRs: type `.gpc`, get "Gram positive cocci in clusters."

The macro mechanism has three parts:

1. **Macro Library admin** — CRUD over macros, categorized, with seed defaults.
2. **MacroExpansionService** — runtime service that intercepts field input, watches for trigger codes, and replaces them with the expansion.
3. **Macro-enabled field contract** — UI primitives (`MacroTextarea`, `MacroInput`) that participate in the expansion mechanism. Fields opt in by category.

### 2.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Macro Library list | `/admin/macros` | Admin → Macro Library |
| Add / Edit Macro | (modal overlay on list) | — |
| Import Defaults / Export / Bulk Edit | (modals on list) | — |

### 2.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Full CRUD; Import Defaults; Export; Bulk Edit |
| Microbiology Supervisor | View; create / edit own additions (Phase 1B) |
| Microbiology Technician | View; use macros |
| System Administrator | All actions |

### 2.4 Integration

- **M-04 Case Workbench Core** — every macro-enabled field references the Library.
- **M-05 AST Entry & Interpretation** — override justification fields use macros.
- **M-03 Order Entry Hook** — Clinical History field uses macros (per Micro Order Entry hook).
- **M-09 WHONET Export** — comment/annotation fields could use macros (Phase 1B).
- **Future modules** — pathology, cytology, chemistry can opt fields in.

---

## 3. Data model

```
macro
├── macro_id (UUID PK)
├── trigger_code (text, unique, 2-15 chars, starts with `.`, lowercase alphanumeric after period)
├── expansion (text, ≤ 500 chars)
├── category (enum: clinical, gramStain, colony, culture, organisms, ast, reporting, timeline)
├── description (text, nullable, ≤ 200 chars — helper text in dropdown)
├── active (bool, default true)
├── seeded (bool, default false — true if from system defaults)
├── usage_count (int, default 0 — incremented on each use; Phase 1B for analytics)
├── created_at, created_by, last_updated_at, last_updated_by
└── audit columns
```

Categories are fixed (enum, not user-extensible) so field bindings work consistently across the app. Individual macros within categories are freely managed.

**Seeded vs. user-added (review edit H4/R-06).** The `seeded` flag distinguishes the system-shipped default set from a lab's own additions. This distinction is surfaced in the UI: the list view shows a **"Seeded"** badge on `seeded = true` rows, and a **Source** filter (Seeded / User-added / All) lets a manager see at a glance which macros the lab created versus which came with the system. Import Defaults and Hub refresh act only on seeded rows (§8.1, §7) — user-added macros are never touched.

---

## 4. Categories

The eight categories are bound to specific field contexts. Each category carries **helper text** (review edit H4) describing what it's for and where it appears; the same text shows under the Category dropdown in the editor (§5) and as the tooltip on the category chip in the macro dropdown (§6.1).

| Category | Bound to | Description / helper text | Example codes |
|----------|----------|---------------------------|---------------|
| `clinical` | Order Entry Clinical History; Patient History fields | "Patient history, symptoms, and conditions — appears in clinical-history fields." | `.feb`, `.uti`, `.sep`, `.abx`, `.dm`, `.immuno` |
| `gramStain` | Isolate Gram Stain Observation | "Gram-stain observations — appears in the isolate Gram-stain field." | `.gpc`, `.gnr`, `.wbc`, `.epi`, `.mixed`, `.nobac` |
| `colony` | Isolate Colony Morphology | "Colony appearance descriptions — appears in the colony-morphology field." | `.lact`, `.bhemo`, `.muc`, `.pig`, `.small` |
| `culture` | Isolate Preliminary ID Notes; Final ID Notes; Clinical Notes; Final Report Culture Results | "Culture outcomes and observations — appears in ID-notes and culture-result fields." | `.nml`, `.ngr`, `.mix`, `.cnt`, `.iso`, `.col5` |
| `organisms` | (any text field where organism names are typed) | "Common organism names — available in any text field." | `.ecoli`, `.saur`, `.mrsa`, `.pseudo`, `.kleb` |
| `ast` | AST Edit Override Justification; AST General Comments; Expert Review Justification (Phase 1B) | "AST-related comments and decisions — appears in override-justification and AST-comment fields." | `.dtneg`, `.dtpos`, `.esblc`, `.mrsac`, `.qcok` |
| `reporting` | Final Report Comments (Interpretation / Clinical / Technologist Notes); Amendment Description | "Report conclusions and recommendations — appears in final-report comment fields." | `.final`, `.prelim`, `.contact`, `.ic`, `.corr` |
| `timeline` | Timeline Event Notes | "Culture-workflow events — appears in timeline note fields." | `.sub24`, `.gram`, `.vitek`, `.maldi` |

---

## 5. List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Macro Library                                                        │
│                                                                              │
│ Macro Library                                                    [+ Add New] │
│                                       [Import Defaults] [Export] [Bulk Edit] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Category: [All ▼]  Source: [All ▼]  Status: [Active ▼]  [Search macros...]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Code     │ Expansion                            │ Category   │ Source │ Status│
├──────────┼──────────────────────────────────────┼────────────┼────────┼───────┤
│ .gpc     │ Gram positive cocci in clusters.     │ gramStain  │ Seeded │ Active│
│ .gnr     │ Gram negative rods.                  │ gramStain  │ Seeded │ Active│
│ .nml     │ No growth after 5 days of            │ culture    │ Seeded │ Active│
│          │ incubation.                          │            │        │       │
│ .locmix  │ Mixed flora — see attached note.     │ culture    │ User   │ Active│
│ .dtneg   │ D-test performed, negative.          │ ast        │ Seeded │ Active│
│          │ Clindamycin reported as susceptible. │            │        │       │
│ .final   │ Final report. No further testing     │ reporting  │ Seeded │ Active│
│          │ indicated.                           │            │        │       │
│ .sub24   │ Subcultured to BAP and MAC at 24     │ timeline   │ Seeded │ Active│
│          │ hours.                               │            │        │       │
└──────────┴──────────────────────────────────────┴────────────┴────────┴───────┘
  Showing 1-50 of 85    [< 1 2 >]
```

The **Source** column + filter (review edit H4/R-06) distinguishes seeded defaults from user-added macros.

**Carbon components:** `DataTable` with `TableToolbar` (search + Category, Source, and Status filters), `Pagination`, `OverflowMenu` for row actions.

Row overflow menu: Edit · Duplicate · Deactivate · Delete.

**Empty state.** Fresh deployment before Import Defaults: "No macros yet. **Import Defaults** to load the 85 standard macros, or **+ Add New** to create your own."

---

## 6. Add / Edit modal

`ComposedModal` size `md`.

```
┌─ Add Macro ─────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Code: *                              Category: *                            │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐   │
│  │ .                            │    │ gramStain                     ▼  │   │
│  └──────────────────────────────┘    └──────────────────────────────────┘   │
│  Must start with period (.)           Gram-stain observations — appears in   │
│                                       the isolate Gram-stain field.          │
│                                                                              │
│  Expansion: *                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Gram positive cocci in clusters.                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  Text that will be inserted (max 500 characters)                            │
│                                                                              │
│  Description:                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ GPC in clusters — typical of Staphylococcus                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  Optional help text shown in macro dropdown                                 │
│                                                                              │
│  Status:  (•) Active  ( ) Inactive                                          │
│                                                                              │
│  [Cancel]                                                            [Save] │
└──────────────────────────────────────────────────────────────────────────────┘
```

The Category dropdown's helper text (review edit H4) updates to the selected category's description (per §4) so the manager sees where the macro will appear before saving.

### 6.1 Field validation

| Field | Validation |
|-------|-----------|
| Code | Required. Must start with `.`. 2-15 chars total. Lowercase alphanumeric after period. Unique across all categories. Cannot be a reserved code (`.help`, `.list` — see §6.5). Auto-converts to lowercase. |
| Category | Required. From the eight enum values. |
| Expansion | Required. ≤ 500 chars. Plain text (no formatting). |
| Description | Optional. ≤ 200 chars. |
| Status | Required. Active / Inactive. |

---

## 7. Macro expansion mechanism

### 7.1 Field opt-in

Two new Carbon-styled UI primitives:

- **`MacroTextarea`** — wraps Carbon `TextArea`. Accepts prop `macroCategory` (one of the eight category strings). Renders the helper text "[.] Type period for macros" below the field.
- **`MacroInput`** — wraps Carbon `TextInput` for single-line fields.

Both primitives manage macro state internally:

- On user typing, track the position of the most recent `.` character.
- When `.` is typed, open a dropdown filtered by category.
- As user continues typing, narrow the dropdown to codes matching the prefix.
- On Enter / Tab / mouse click, insert the expansion and close the dropdown.
- On Escape, close the dropdown without insertion.

**Category chip on the dropdown (review edit H4/R-06).** The macro dropdown renders a small **category chip** in its header — e.g. `gramStain` — so the user can see which category's macros are being offered. The chip carries the category's helper text as a tooltip. This makes it obvious that a field only surfaces its own category's macros (a Gram-stain field won't show `.final`), removing the "why isn't my macro here?" confusion.

### 7.2 Auto-expand vs. dropdown

Two trigger paths:

- **Dropdown** — user types `.`; dropdown opens (with the category chip per §7.1); user navigates with arrows + Enter/Tab. This is the discovery path.
- **Auto-expand** — user types `.code` followed by space or tab. If the code exists in the field's category, the expansion replaces the trigger inline. This is the power-user path.

Both paths produce the same result: the expansion replaces the trigger code in the field value. The trigger itself is not preserved in the saved value.

### 7.3 Service call

```
MacroExpansionService.lookup(
   trigger_code: text,
   category: text
) → { expansion: text } | null
```

Service queries the active macro for that code in that category. Returns expansion or null.

Service is called on each user keystroke when in the dropdown state, and on auto-expand attempt. For performance (NFR-05: < 50ms), the macro library is **client-side cached** on initial page load. The service does an in-memory lookup. Server is only consulted on cache miss or refresh.

### 7.4 Cache invalidation / refresh (review edit R-06)

When a Lab Manager edits the Macro Library, all clients should pick up the change within 5 minutes. Mechanisms:

- **Manual refresh** — a "Refresh Macros" action in the user profile (rare) forces a re-fetch of the client-side cache. The Macro Library admin also shows a hint after a save: *"Edits reach other users' fields on their next page load (or via Refresh Macros)."*
- **Automatic** — if OE has a session push (WebSocket / polling), the server sends a cache-invalidation signal so open clients re-fetch; otherwise the change picks up on next page load.

For Phase 1A, manual refresh + next-page-load is acceptable; the post-save hint sets that expectation explicitly.

### 7.5 Reserved codes

The system reserves a small set of codes for future use:

- `.help` — would show macro library help (not implemented Phase 1A)
- `.list` — would list available macros (not implemented Phase 1A)

These cannot be saved as user codes. Validation rejects them with the message *"This code is reserved by the system."* (review edit R-06: the reserved-code rule is stated in both the editor validation and the i18n catalog).

---

## 8. Seed defaults

Phase 1A ships with 85 default macros across the eight categories, all with `seeded = true`. Examples per category (full list TBD at implementation):

### gramStain (14)

```
.gpc    → Gram positive cocci in clusters.
.gpcp   → Gram positive cocci in pairs.
.gpcc   → Gram positive cocci in chains.
.gpr    → Gram positive rods.
.gnr    → Gram negative rods.
.gnc    → Gram negative cocci.
.gnd    → Gram negative diplococci.
.yeast  → Yeast cells present.
.wbc    → White blood cells present.
.wbc+   → Many white blood cells present (> 25/hpf).
.epi    → Epithelial cells present.
.epi+   → Many epithelial cells present, suggestive of contamination.
.nobac  → No bacteria seen on Gram stain.
.mixed  → Mixed gram positive and gram negative flora.
```

### colony (8)

```
.lact   → Lactose-fermenting colonies on MacConkey agar.
.nlact  → Non-lactose-fermenting colonies on MacConkey agar.
.bhemo  → Beta-hemolytic colonies on blood agar.
.ahemo  → Alpha-hemolytic colonies on blood agar.
.nhemo  → Non-hemolytic (gamma) colonies on blood agar.
.muc    → Mucoid colonies observed.
.pig    → Pigmented colonies observed.
.small  → Small colony variants noted.
```

### culture (12)

```
.nml    → No growth after 5 days of incubation.
.ngr    → No significant growth.
.ng24   → No growth at 24 hours. Incubation continued.
.ng48   → No growth at 48 hours. Incubation continued.
.mix    → Mixed flora isolated, suggestive of contamination. Clinical correlation recommended.
.cnt    → Considered contamination based on clinical context and culture findings.
.iso    → Isolated in pure culture.
.pre    → Preliminary identification. Final identification pending.
.conf   → Identification confirmed by additional testing.
.col3   → Colony count: 10³ CFU/mL.
.col4   → Colony count: 10⁴ CFU/mL.
.col5   → Colony count: ≥ 10⁵ CFU/mL (significant bacteriuria).
```

### organisms (9)

```
.ecoli  → Escherichia coli
.kleb   → Klebsiella pneumoniae
.saur   → Staphylococcus aureus
.mrsa   → Methicillin-resistant Staphylococcus aureus (MRSA)
.mssa   → Methicillin-susceptible Staphylococcus aureus (MSSA)
.cons   → Coagulase-negative staphylococci
.pseudo → Pseudomonas aeruginosa
.efaec  → Enterococcus faecalis
.spneu  → Streptococcus pneumoniae
```

### ast (11)

```
.dtneg   → D-test performed, negative. Clindamycin reported as susceptible.
.dtpos   → D-test positive (inducible clindamycin resistance detected). Clindamycin reported as resistant.
.esblc   → ESBL confirmed by phenotypic testing. All penicillins, cephalosporins, and aztreonam reported as resistant regardless of MIC.
.esblneg → ESBL screen negative.
.mrsac   → MRSA confirmed. All beta-lactams reported as resistant.
.vrec    → Vancomycin resistance confirmed (VRE).
.cpec    → Carbapenemase production confirmed. Contact infection control.
.cascd   → Cascade reporting applied per laboratory protocol.
.qcok    → QC within acceptable limits.
.retest  → Result confirmed by repeat testing.
.manual  → Manual override applied per supervisor review.
```

### reporting (10)

```
.final   → Final report. No further testing indicated.
.prelim  → Preliminary report. Final identification and susceptibility testing in progress.
.amend   → Amended report. Please disregard previous results.
.contact → Critical value. Physician notified.
.ic      → Infection control notified per protocol.
.repeat  → Repeat culture recommended if clinically indicated.
.corr    → Clinical correlation recommended.
.nfr     → Normal flora recovered. No pathogens isolated.
.cnsig   → Coagulase-negative staphylococci isolated from single blood culture. May represent skin contamination. Clinical correlation required.
.respfl  → Upper respiratory flora isolated. No predominant pathogen identified.
```

### timeline (13)

```
.sub24   → Subcultured to BAP and MAC at 24 hours.
.sub48   → Subcultured at 48 hours.
.subbap  → Subcultured to blood agar plate.
.subchoc → Subcultured to chocolate agar.
.submac  → Subcultured to MacConkey agar.
.gram    → Gram stain performed.
.pos     → Positive signal detected by instrument.
.posaer  → Positive signal detected in aerobic bottle.
.posana  → Positive signal detected in anaerobic bottle.
.read24  → Plates read at 24 hours.
.read48  → Plates read at 48 hours.
.vitek   → VITEK 2 card inoculated for identification and susceptibility testing.
.maldi   → MALDI-TOF identification performed.
```

### clinical (10)

```
.feb     → Fever, chills, and malaise.
.uti     → Dysuria, frequency, and urgency consistent with urinary tract infection.
.sep     → Clinical signs of sepsis. Blood cultures ordered.
.pneu    → Productive cough, fever, and abnormal chest findings.
.abx     → Patient currently on antibiotic therapy.
.abx2w   → Patient received antibiotics within the past 2 weeks.
.dm      → History of diabetes mellitus.
.immuno  → Immunocompromised patient.
.cvc     → Central venous catheter in place.
.hosp    → Hospitalized for more than 48 hours.
```

Seeded macros have `seeded = true`. Hub updates (Phase 1B) refresh seeded rows; local additions and modifications are preserved (per the seeded-vs-user-added rule, §3).

---

## 9. Bulk operations

### 9.1 Import Defaults

Restores the seeded default set. Three modes:

- **Merge** (default) — add missing seeded macros, leave existing ones untouched
- **Replace seeded** — re-import all seeded macros, overwriting current seeded values; user additions left alone
- **Replace all** — destroy current macro library and re-seed (confirmation required)

Each mode names exactly what it touches so a manager doesn't accidentally lose user-added macros; "Replace all" carries an explicit destructive-action confirmation.

### 9.2 Export

Export the current macro library to CSV or JSON. Used for backups, sharing between OE instances, or external editing. The export includes the `seeded` flag so a re-import preserves the seeded-vs-user-added distinction.

CSV format:

```csv
trigger_code,category,expansion,description,active,seeded
.gpc,gramStain,"Gram positive cocci in clusters.","GPC in clusters",true,true
.gnr,gramStain,"Gram negative rods.",,true,true
.locmix,culture,"Mixed flora — see attached note.",,true,false
...
```

### 9.3 Bulk Edit

Select multiple macros via DataTable checkboxes. Bulk operations:

- Change category
- Activate / Deactivate
- Delete

**Confirmation (review edit R-06).** Every bulk operation shows a confirmation that names the count and the affected macros before applying — *"Change category to 'culture' for 6 macros?"* / *"Deactivate 4 macros?"* / *"Delete 3 macros? This cannot be undone."* The destructive Delete confirm is explicit and lists the codes being removed.

---

## 10. Permissions

| Action | Permission |
|--------|-----------|
| View Macro Library list | `micro.macro.view` |
| Add / edit / delete macros | `micro.macro.manage` |
| Import Defaults / Export / Bulk Edit | `micro.macro.manage` |
| Use macros in fields (everyone) | (no separate permission; comes from the field's permission) |

---

## 11. Acceptance criteria

- **AC-M08-01**: List view shows all macros with category, source, and status filters; a Source column distinguishes Seeded vs. User-added (review edit H4/R-06).
- **AC-M08-02**: Add modal validates code format (`.` prefix, 2-15 chars, lowercase alphanumeric, unique).
- **AC-M08-03**: Reserved codes (`.help`, `.list`) rejected with the "reserved by the system" message (review edit R-06).
- **AC-M08-04**: Expansion length ≤ 500 chars enforced.
- **AC-M08-05**: Add / Edit / Delete actions work; the Category dropdown shows downstream-context helper text (review edit H4).
- **AC-M08-06**: Import Defaults loads all 85 seeded macros in Merge mode without overwriting user additions; each mode states what it touches.
- **AC-M08-07**: Export generates valid CSV with all current macros, including the `seeded` flag.
- **AC-M08-08**: Bulk Edit works for category change, activate / deactivate, delete; each bulk op shows a count-named confirmation, Delete being destructive (review edit R-06).
- **AC-M08-09**: `MacroTextarea` and `MacroInput` primitives integrate with Carbon styling.
- **AC-M08-10**: Typing `.` in a macro-enabled field opens the dropdown.
- **AC-M08-11**: Dropdown filters by category and typed prefix, and shows a **category chip** identifying the active category (review edit H4/R-06).
- **AC-M08-12**: Arrow keys navigate dropdown; Enter / Tab selects; Escape closes.
- **AC-M08-13**: Auto-expand on `.code` + space replaces inline.
- **AC-M08-14**: Macro lookup < 50ms (NFR-05).
- **AC-M08-15**: Saved field value contains expansion text, not trigger code.
- **AC-M08-16**: aria-live announces selected expansion (NFR-04).
- **AC-M08-17**: Deactivated macros do not appear in dropdowns but remain in admin list.
- **AC-M08-18**: A client cache refresh path exists (manual "Refresh Macros" + next-page-load); the admin shows the post-save propagation hint (review edit R-06).
- **AC-M08-19**: Empty state renders before Import Defaults.

---

## 12. i18n keys

Estimated 50-60 keys. Pattern:

```
admin.macro.list.title                      "Macro Library"
admin.macro.list.action.addNew              "Add New"
admin.macro.list.action.importDefaults      "Import Defaults"
admin.macro.list.action.export              "Export"
admin.macro.list.action.bulkEdit            "Bulk Edit"
admin.macro.list.column.code                "Code"
admin.macro.list.column.expansion           "Expansion"
admin.macro.list.column.category            "Category"
admin.macro.list.column.source              "Source"
admin.macro.list.column.status              "Status"
admin.macro.list.source.seeded              "Seeded"
admin.macro.list.source.user                "User-added"
admin.macro.list.filter.category            "Category"
admin.macro.list.filter.source              "Source"
admin.macro.list.filter.status              "Status"
admin.macro.list.search.placeholder         "Search macros..."
admin.macro.list.empty                      "No macros yet. Import Defaults to load the 85 standard macros, or Add New."
admin.macro.modal.title.add                 "Add Macro"
admin.macro.modal.title.edit                "Edit Macro"
admin.macro.modal.refreshHint               "Edits reach other users' fields on their next page load (or via Refresh Macros)."
admin.macro.field.code.label                "Code"
admin.macro.field.code.helper               "Must start with period (.)"
admin.macro.field.code.error.format         "Code must start with period, 2-15 chars, lowercase alphanumeric"
admin.macro.field.code.error.duplicate      "Code already exists"
admin.macro.field.code.error.reserved       "This code is reserved by the system"
admin.macro.field.category.label            "Category"
admin.macro.field.category.helper           "Where this macro will appear"
admin.macro.field.expansion.label           "Expansion"
admin.macro.field.expansion.helper          "Text that will be inserted (max 500 characters)"
admin.macro.field.description.label         "Description"
admin.macro.field.description.helper        "Optional help text shown in macro dropdown"
admin.macro.field.status.active             "Active"
admin.macro.field.status.inactive           "Inactive"
admin.macro.category.clinical               "Clinical"
admin.macro.category.clinical.helper        "Patient history, symptoms, and conditions — appears in clinical-history fields."
admin.macro.category.gramStain              "Gram Stain"
admin.macro.category.gramStain.helper       "Gram-stain observations — appears in the isolate Gram-stain field."
admin.macro.category.colony                 "Colony"
admin.macro.category.colony.helper          "Colony appearance descriptions — appears in the colony-morphology field."
admin.macro.category.culture                "Culture"
admin.macro.category.culture.helper         "Culture outcomes and observations — appears in ID-notes and culture-result fields."
admin.macro.category.organisms              "Organisms"
admin.macro.category.organisms.helper       "Common organism names — available in any text field."
admin.macro.category.ast                    "AST"
admin.macro.category.ast.helper             "AST-related comments — appears in override-justification and AST-comment fields."
admin.macro.category.reporting              "Reporting"
admin.macro.category.reporting.helper       "Report conclusions and recommendations — appears in final-report comment fields."
admin.macro.category.timeline               "Timeline"
admin.macro.category.timeline.helper        "Culture-workflow events — appears in timeline note fields."
admin.macro.importDefaults.modal.title      "Import Default Macros"
admin.macro.importDefaults.mode.merge       "Merge — add missing seeded macros, leave existing untouched"
admin.macro.importDefaults.mode.replaceSeeded "Replace seeded — re-import seeded values; user additions preserved"
admin.macro.importDefaults.mode.replaceAll  "Replace all — destroy current library and re-seed (confirmation required)"
admin.macro.bulkEdit.modal.title            "Bulk edit {{count}} macros"
admin.macro.bulkEdit.action.changeCategory  "Change category"
admin.macro.bulkEdit.action.activate        "Activate"
admin.macro.bulkEdit.action.deactivate      "Deactivate"
admin.macro.bulkEdit.action.delete          "Delete"
admin.macro.bulkEdit.confirm.changeCategory "Change category to '{{category}}' for {{count}} macros?"
admin.macro.bulkEdit.confirm.delete         "Delete {{count}} macros? This cannot be undone."
field.macro.hint                            "[.] Type period for macros"
field.macro.dropdown.category.chip          "{{category}}"
field.macro.dropdown.aria.label             "Macro selection — use arrow keys to navigate, Enter to select"
field.macro.dropdown.empty                  "No matching macros for category {{category}}"
field.macro.aria.expanded                   "Macro {{code}} expanded"
```

---

## 13. Open verification items

- Confirm OE has a client-side cache invalidation mechanism (WebSocket / polling) or if Phase 1A manual refresh is acceptable.
- Confirm Carbon's `TextArea` and `TextInput` can be wrapped without losing accessibility features.

---

## 14. References

- M-00 Microbiology Module Parent Specification
- M-NFR Non-Functional Requirements (NFR-04 a11y, NFR-05 perf, NFR-07 i18n)
- M-04 Case Workbench Core (consumer)
- M-05 AST Entry & Interpretation (consumer)
- `amr-crosswalk-working.md` — Macros as cross-cutting feature
- v1.1 AMR Configuration FRS §10 — original Macro Library spec; M-08 supersedes
