# M-04 Case Workbench Core — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology → Case Workbench
**Route:** `/microbiology/case/:caseId`
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft
**Size:** XL — the largest module in the bundle

This spec covers the heart of the Micro Module: the Case entity, its state machine, the Case Detail page, Timeline tracking, Isolate management, preliminary and final report release, amendment workflow, and the new analyzer event channel that drives state transitions. AST Result Entry is referenced but lives in M-05. Worklist views are in M-07.

---

## 1. Overview

### 1.1 Purpose

A Case represents the full multi-day workup of a single Sample's microbiology testing — from arrival through final report. Cases tie together everything the lab does for that specimen: inoculation, incubation tracking, positive detection, Gram stain, isolate management, identification, AST setup and results, expert review, preliminary report, supervisor review, final report, amendments.

Case is the new primary abstraction in OpenELIS that the chemistry-shape "Sample → Analysis → Result" model can't express. A Case has stages (lifecycle position), a timeline of events, zero-or-many Isolates each potentially with its own AST Runs, and one or more report versions.

### 1.2 Routes

| Surface | Route |
|---------|-------|
| Case Detail | `/microbiology/case/:caseId` |
| Case Search | `/microbiology/case-search` (search across all cases by lab number, patient, organism, date range) |
| Case Detail print view (for paper backup) | `/microbiology/case/:caseId/print` |

### 1.3 Users

| Role | Primary actions |
|------|-----------------|
| Microbiology Technician | All bench-level data entry (Timeline events, Isolates, AST Setup, manual AST entry, Preliminary release) |
| Microbiology Supervisor | Review, approve overrides, release Final, authorize Amendments |
| Lab Manager | Full access; reidentification of finalized Isolates |
| Medical Technologist | Same as Tech for analyzer-related interactions |

### 1.4 Integration

- **M-01 Reference Data** — Organism Master, AST Panels, Culture Protocols all referenced.
- **M-02 Breakpoint Catalog** — referenced via AST Run header.
- **M-03 Order Entry Hook** — creates the Case via Sample post-save hook.
- **M-05 AST Entry & Interpretation** — modal opened from Case Detail's AST section.
- **M-06 Expert Rules Engine** (Phase 1B) — runs against AST Runs; produces flags rendered in Case Detail.
- **M-07 Worklists** — read Case state for Pending Cultures / AST Worklist / Dashboard.
- **M-08 Macro Library** — every macro-enabled text field references the library.
- **M-11 Critical-Result Acknowledgment** — Case writes critical notifications via M-11's polymorphic table.
- **M-12 Test → Reagent Linkage** — Inoculation events and AST Runs reference reagent lots via M-12.

---

## 2. Case data model

### 2.1 Tables (per M-00 §3 data model overview)

Primary table:

```
micro_case
├── case_id (UUID PK)
├── sample_id (FK to sample, unique — 1:1 Case per Sample)
├── stage (enum, see §3)
├── culture_protocol_id (FK to culture_protocol)
├── assigned_tech_user_id (FK to user, nullable)
├── patient_origin_id (FK to patient_origin)
├── department_id (FK to department)
├── ward (text, nullable)
├── number_of_sets (int, default 1)
├── is_screening_culture (bool, default false)
├── clinical_history (text, macro-enabled)
├── antibiotic_exposure (bool, default false)
├── critical_value_notify (bool, default true)
├── prelim_released_at (timestamp, nullable)
├── prelim_released_by (FK, nullable)
├── final_released_at (timestamp, nullable)
├── final_released_by (FK, nullable)
├── final_version (int, default 0; incremented on each Final release)
├── max_incubation_days (int, computed from culture_protocol.max_incubation_days at Case creation)
├── created_at, created_by, last_updated_at, last_updated_by
└── audit columns
```

### 2.2 Side tables

```
micro_case_inoculation
├── inoculation_id (PK)
├── case_id (FK)
├── media_type_id (FK to media_type)
├── reagent_lot_id (FK via M-12)
├── bottle_or_plate_id (text — analyzer-side identifier)
├── inoculated_at (timestamp)
├── inoculated_by (FK to user)
├── notes (text, macro-enabled)
└── audit columns

micro_timeline_event
├── event_id (PK)
├── case_id (FK)
├── isolate_id (FK to micro_isolate, nullable)
├── event_type (enum, see §4.2)
├── event_at (timestamp)
├── event_by (FK to user)
├── notes (text, macro-enabled)
├── media_type_id (FK, nullable)
├── linked_ast_run_id (FK to micro_ast_run, nullable)
├── linked_analyzer_event_id (FK to analyzer_event, nullable)
└── audit columns

micro_isolate
├── isolate_id (PK)
├── case_id (FK)
├── isolate_number (int, 1-based within Case)
├── version (int, default 1)
├── previous_version_id (FK to self, nullable — non-null only on v2+ rows)
├── current_version (bool — true on the latest version row only, indexed)
├── organism_id (FK to organism_master, nullable until identified)
├── id_method (enum)
├── id_confidence_pct (numeric, nullable)
├── whonet_code (text, denormalized from organism_master)
├── significance (enum)
├── gram_stain_observation (text, macro-enabled)
├── colony_morphology (text, macro-enabled)
├── preliminary_id_notes (text, macro-enabled)
├── final_id_notes (text, macro-enabled)
├── clinical_notes (text, macro-enabled)
├── default_ast_panel_id (FK, populated from organism when organism set)
├── created_at, created_by, last_updated_at, last_updated_by
└── audit columns

micro_ast_run
├── (model in M-05)

micro_case_stage_transition (audit)
├── transition_id (PK)
├── case_id (FK)
├── from_stage (enum)
├── to_stage (enum)
├── reason_code (text, nullable)
├── reason_text (text, nullable, macro-enabled)
├── triggered_by (enum: USER_ACTION, SYSTEM, ANALYZER_EVENT)
├── user_id (FK, nullable)
├── analyzer_event_id (FK to analyzer_event, nullable)
└── timestamp

analyzer_event (cross-cutting; consumed by Case Workbench)
├── event_id (PK)
├── analyzer_id (FK to analyzer profile)
├── event_type (enum)
├── source_id (analyzer-side ID, e.g., bottle_id or card_id)
├── payload (JSON)
├── received_at
├── resolved_at (nullable)
├── status (PENDING, HANDLED, FAILED)
└── audit columns
```

---

## 3. State machine

The state machine is the spine of the Case lifecycle. Every transition is logged in `micro_case_stage_transition`.

### 3.1 Stages

Non-terminal:

- **RECEIVED** — Case created when Sample saved; not yet inoculated
- **INOCULATING** — Tech is in the process of plating
- **INCUBATING** — Plates / bottles in incubator; awaiting growth
- **POSITIVE_SIGNAL** — Analyzer detected positive (blood culture instrument) OR manual plate reading shows growth
- **GROWTH_DETECTED** — Colonies visible; Isolate workup beginning
- **ORGANISM_ID** — Isolate identification in progress
- **AST_IN_PROGRESS** — Susceptibility testing underway on at least one Isolate
- **READY_REVIEW** — All AST complete; awaiting supervisor review
- **PRELIM_REPORTED** — Preliminary report released; workup continues
- **FINAL_REPORTED** — Final report released; Case is read-only except for amendments
- **AMENDED** — Final report has been amended at least once; behaves like FINAL_REPORTED in most contexts

Terminal:

- **NO_GROWTH_FINAL** — Incubation completed with no growth; final negative report released
- **REJECTED_AT_ACCESSIONING** — Sample rejected before inoculation
- **CANCELLED_PRE_INOCULATION** — Order cancelled before plating
- **CANCELLED_POST_INOCULATION** — Order cancelled after plating; plates discarded
- **CANCELLED_POST_POSITIVE** — Order cancelled after positive detection (rare)
- **LOST_SPECIMEN** — Specimen lost / broken pre-positive
- **LOST_SPECIMEN_POSITIVE** — Specimen lost post-positive (Gram stain data may be preserved)

### 3.2 Valid transitions

```
                            ┌──────────────────────┐
                            │   Sample saved with  │
                            │ program=MICROBIOLOGY │
                            └──────────┬───────────┘
                                       │
                                       ▼
                                  RECEIVED
                            ┌──────────┼──────────┐
              ┌─────────────┘          │          └─────────┐
              ▼                        ▼                    ▼
   REJECTED_AT_ACCESSIONING       INOCULATING       CANCELLED_PRE_INOCULATION
        (terminal)                     │                  (terminal)
                                       ▼
                                  INCUBATING ──────────────────────────────┐
                            ┌──────────┼──────────┐                         │
                  ┌─────────┘          │          └─────────┐                │ max incubation
                  ▼                    ▼                    ▼                │ days reached,
        POSITIVE_SIGNAL    CANCELLED_POST_INOCULATION   LOST_SPECIMEN        │ no growth
              │                  (terminal)              (terminal)          │
              │                                                              ▼
              ▼                                                    NO_GROWTH_FINAL
        GROWTH_DETECTED                                            (terminal,
              │                                                     revivable)
              ▼                                                              │
        ORGANISM_ID ◀────────────────────────────────────────── late slow ──┘
              │                                                     grower
        ┌─────┴─────┐                                                 revives
        ▼           ▼
  AST_IN_PROGRESS   CANCELLED_POST_POSITIVE
        │            (terminal)
        │
        ▼
  READY_REVIEW
        │
        ▼
  PRELIM_REPORTED
        │
        ▼
  FINAL_REPORTED ◀── amendment cycle ──┐
        │                              │
        └──── amend ──────► AMENDED ───┘
                              │
                              ▼
                       (returns to FINAL_REPORTED
                        on next amendment cycle)

LOST_SPECIMEN_POSITIVE can be reached from any post-positive stage if specimen lost.
```

### 3.3 Transition table

Each row: from-stage → to-stage, trigger, required permission, side effects.

| From | To | Trigger | Permission | Side effects |
|------|-----|---------|-----------|-------------|
| RECEIVED | INOCULATING | "Start Inoculation" button | `micro.case.edit` | Open Inoculation modal |
| INOCULATING | INCUBATING | Save Inoculation modal | `micro.case.edit` | Writes `micro_case_inoculation` row + Timeline event of type INOCULATION |
| INCUBATING | POSITIVE_SIGNAL | Analyzer event `POSITIVE_SIGNAL` OR manual "Mark Positive" | System / `micro.case.edit` | Timeline event POSITIVE_SIGNAL; worklist row highlights red |
| INCUBATING | NO_GROWTH_FINAL | Manual "Mark No Growth" after incubation hours met | `micro.case.edit` | Timeline event NO_GROWTH; Final report released |
| INCUBATING | LOST_SPECIMEN | Manual "Mark Lost" | `micro.case.edit` | Timeline event LOST; reason text required |
| INCUBATING | CANCELLED_POST_INOCULATION | Order cancellation propagates | System | Cascade from Order Entry; reason captured |
| POSITIVE_SIGNAL | GROWTH_DETECTED | First Isolate save OR Subculture event | `micro.case.edit` | Auto-transition on Isolate or Subculture |
| GROWTH_DETECTED | ORGANISM_ID | Tech opens Isolate workup (Add/Edit Isolate) | `micro.case.edit` | Implicit on first edit |
| ORGANISM_ID | AST_IN_PROGRESS | First AST Setup save | `micro.ast.setup` | Writes `micro_ast_run` row |
| AST_IN_PROGRESS | READY_REVIEW | All Isolates have at least one complete AST Run, no pending expert flags (Phase 1B) | System | Worklist surfaces case in Ready-for-Review filter |
| READY_REVIEW | PRELIM_REPORTED | "Release Preliminary" button | `micro.report.preliminary` | Generates Prelim report, releases via distribution channels |
| Any non-terminal | PRELIM_REPORTED | "Release Preliminary" (early release on Gram stain) | `micro.report.preliminary` | Same as above. **Preliminary release allowed as early as first Isolate with Gram stain.** |
| PRELIM_REPORTED | FINAL_REPORTED | "Release Final" button (supervisor) | `micro.report.final` | Generates Final report, locks Case |
| FINAL_REPORTED | AMENDED | "Amend Report" → save | `micro.report.amend` | Increments `final_version`; releases v2+ Final report |
| AMENDED | FINAL_REPORTED | (immediate after amendment release) | System | Stage settles to FINAL_REPORTED |
| NO_GROWTH_FINAL | POSITIVE_SIGNAL | Late slow grower (rare) | `micro.case.edit` | Revives Case; reason text required; previous Final report stays as v1 |
| FINAL_REPORTED | LOST_SPECIMEN_POSITIVE | (rare; if isolate lost after final but additional testing was pending) | `micro.case.edit` | Captures lost-specimen event; amendment workflow triggered |

### 3.4 Transition rules

**General:**

- Every transition writes a `micro_case_stage_transition` audit row.
- Stage transitions are atomic with the work that triggered them (saving an Isolate auto-transitions ORGANISM_ID; the Isolate save and the stage transition are in one DB transaction).
- The UI displays the Case stage prominently on the Case Detail page header and the worklist.
- Terminal stages disable all data-entry actions except amendment-relevant ones.

**Preliminary release on Gram stain (per critique):**

The v1.1 FRS gated preliminary release behind "isolates identified." That's wrong for blood cultures — a positive Gram stain is the clinically actionable result for empiric therapy. M-04 allows Preliminary release as early as `POSITIVE_SIGNAL` once at least one Isolate has a Gram Stain Observation populated. The tech doesn't have to wait for final ID or AST.

**Cancellation cascades:**

When the parent Order is cancelled in Order Entry, OE emits a cancellation event. M-04's listener inspects the Case's current stage and transitions to the appropriate cancellation terminal stage (CANCELLED_PRE_INOCULATION / CANCELLED_POST_INOCULATION / CANCELLED_POST_POSITIVE). Reason text from the OE cancellation is captured.

**Reidentification:**

A finalized Isolate (any Isolate in a FINAL_REPORTED Case) can be reidentified by a user with `micro.isolate.reidentify` permission. This creates a new `micro_isolate` row (`version + 1`, `previous_version_id` set) and sets `current_version = true` on the new row, false on the old. AST Runs against the old version remain FK'd to the old version (not auto-re-evaluated, per crosswalk Q4 rule 2). Triggers an amendment cycle on the Case's Final report.

---

## 4. Timeline section

### 4.1 Display

```
┌─ Timeline ───────────────────────────────────────────────────────────────────┐
│                                                              [+ Add Event]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 2026-05-12 07:38   GRAM_STAIN (Isolate 1)                            Olivia │
│ Gram negative rods, many                                                     │
│                                                                              │
│ 2026-05-12 07:32   SUBCULTURE (Isolate 1)                            Olivia │
│ Subcultured to BAP and MAC at 24 hours.                                      │
│                                                                              │
│ 2026-05-12 06:55   POSITIVE_SIGNAL                          BacT/Alert auto │
│ FA bottle FA24012 — aerobic positive at 23h44m incubation                    │
│                                                                              │
│ 2026-05-11 07:18   INOCULATION                                       Olivia │
│ FA24012, FN24012 inoculated. BacT/Alert load time 07:18.                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                              [Show All ▼]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Carbon components:** Custom timeline rendered as a vertical stack of cards, each a `Tile` with timestamp, event type badge (using `Tag` for color), Isolate reference (if applicable), notes preview (first 2 lines), and source (user name or "BacT/Alert auto" for analyzer-pushed events).

By default, the timeline shows the 10 most recent events. "Show All" expands the full list.

### 4.2 Event types

| Code | Display label | Trigger | Macro category |
|------|---------------|---------|----------------|
| INOCULATION | Inoculated | Saving Inoculation modal | `timeline` |
| POSITIVE_SIGNAL | Positive signal | Analyzer event | `timeline` (read-only, no notes editable) |
| GRAM_STAIN | Gram stain | Saving Gram Stain Observation field on Isolate | `gramStain` |
| PLATE_READING | Plate reading | Manual entry by tech on subcultured plates | `colony` |
| SUBCULTURE | Subculture | Manual entry when tech subcultures to a fresh plate | `timeline` |
| ORGANISM_ID_PRELIM | Preliminary ID | Saving preliminary ID notes on Isolate | `culture` |
| ORGANISM_ID_FINAL | Final ID | Setting organism_id on Isolate | `culture` |
| AST_SETUP | AST setup | Saving AST Setup modal (M-05) | `ast` |
| AST_RESULT_RECEIVED | AST results received | Analyzer event AST_RESULT_AVAILABLE | `ast` (auto-generated, editable notes) |
| EXPERT_RULE_DECISION | Expert review | Saving Expert Review modal (Phase 1B, M-06) | `ast` |
| OVERRIDE_APPLIED | Override applied | Manual override on AST Result | `ast` |
| CRITICAL_NOTIFY | Critical called | Saving Critical Notification modal | `reporting` |
| REPORT_RELEASED | Report released | Releasing Prelim or Final | `reporting` |
| AMENDMENT_RELEASED | Amendment released | Releasing amended Final | `reporting` |
| GENERAL_NOTE | Note | Free-form note from tech or supervisor | `clinical` |
| STAGE_TRANSITION | Stage change | Any stage transition (auto-generated, brief) | (no macros) |
| LOST_SPECIMEN | Specimen lost | Manual "Mark Lost" action | `culture` |
| NO_GROWTH | No growth final | Manual or automatic finalization | `culture` |
| REJECTED | Specimen rejected | At accessioning | `culture` |
| CANCELLATION | Cancelled | Order cancellation cascade | `reporting` |
| REIDENTIFICATION | Reidentification | Saving new Isolate version | `culture` |

### 4.3 Add Event modal

`ComposedModal` size `md`.

- **Event Type** (Dropdown, required) — limited to manually-addable types (not auto-only)
- **Date / Time** (DatePicker + TimePicker, default now, required)
- **Related Isolate** (Dropdown — N/A General, Isolate 1 - [organism], Isolate 2 - [organism], ...) — required for Isolate-scoped event types
- **Media** (Dropdown referencing `media_type`, shown only for SUBCULTURE / PLATE_READING)
- **Notes** (MacroTextarea, category per event type, ≤ 1000 chars)
- **Cancel · Save**

Auto-generated events (POSITIVE_SIGNAL, AST_RESULT_RECEIVED, STAGE_TRANSITION, AMENDMENT_RELEASED) are not addable from this modal — they're written by the system.

### 4.4 Edit / Delete

Timeline events are editable up to the point of report release. After Prelim release, edits require `micro.report.amend`. After Final release, the timeline is read-only except via amendment workflow.

---

## 5. Isolates section

### 5.1 Display

```
┌─ Isolates ───────────────────────────────────────────────────────────────────┐
│                                                              [+ Add Isolate] │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Isolate 1 ────────────────────────────────────────────────────────────┐  │
│ │ Escherichia coli (eco)                                       v2         │  │
│ │ ID method: MALDI-TOF (99.9% confidence)                                 │  │
│ │ Significance: Clinically Significant                                    │  │
│ │ Gram stain: Gram negative rods, many                                    │  │
│ │ Colony: Lactose-fermenting on MAC, many                                 │  │
│ │ Prelim notes: Probable Enterobacterales. Subcultured to BAP and MAC.    │  │
│ │ Reidentification history: v1 was K. pneumoniae (VITEK 99.5%), corrected │  │
│ │                                                                          │  │
│ │ AST Runs (1):  GN-STD VITEK 2  CLSI M100 2024  Complete                 │  │
│ │ [Edit] [View AST] [Reidentify]                                          │  │
│ └──────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

`Tile` per Isolate showing key identity, an inline AST Run summary, and per-Isolate actions.

### 5.2 Add / Edit Isolate modal

`ComposedModal` size `lg`. Sections via Carbon `Accordion` for compactness, or stacked sections — final UX decision in mockup phase.

**Preliminary ID section:**

- Isolate Number (auto-assigned)
- Gram Stain Observations (`MacroTextarea`, `gramStain` category)
- Colony Morphology (`MacroTextarea`, `colony` category)
- Preliminary ID Notes (`MacroInput`, `culture` category)

**Final ID section:**

- ID Method (Dropdown, required when populating organism: MANUAL_BIOCHEM / VITEK_2 / MALDI_TOF / PCR / OTHER)
- ID Confidence % (NumberInput, 0-100)
- Organism (ComboBox referencing Organism Master, searchable, required to set organism)
- WHONET Code (read-only, auto-populated from organism on save)
- Final ID Notes (`MacroTextarea`, `culture` category)

**Significance section:**

- Significance (Dropdown, required): SIGNIFICANT / NOT_SIGNIFICANT / PROBABLE_CONTAMINANT / COLONIZER / INDETERMINATE
- Clinical Notes (`MacroTextarea`, `culture` category)

**AST Default section:**

- Default AST Panel (ComboBox, populated from organism's `default_ast_panel_id` if organism set; tech can override)

**Footer:**

- Cancel · Save (primary)

### 5.3 Reidentification

Re-Identify action on an Isolate (requires `micro.isolate.reidentify`) opens the same modal but in **versioning mode**:

- Header banner: "You are creating Version 3 of Isolate 1. The previous version (E. coli) and its AST Runs are preserved."
- Reason for reidentification (Dropdown: ID_METHOD_RERUN / SPECIES_REASSIGNMENT / CONTAMINATION_RECLASS / OTHER) — required
- All ID fields pre-populated from current version; user updates
- Significance and notes editable
- Save creates new `micro_isolate` row (version + 1, previous_version_id set), flips `current_version`, writes a Timeline event of type REIDENTIFICATION
- A banner appears on Case Detail header: "Isolate 1 was reidentified — review expert rule applicability and AST interpretation."
- If Case is FINAL_REPORTED, triggers Amendment workflow (Final report v(n+1) generated)

Per crosswalk Q4 Rule 2: **AST Runs do not auto-re-interpret on reidentification**. The lab manually reviews and decides whether AST results are valid for the new organism. If they need to redo AST, they set up a new AST Run against the new Isolate version.

---

## 6. AST Results section

The summary view of AST Runs for the Case. Detailed entry and interpretation live in M-05.

```
┌─ AST Results ────────────────────────────────────────────────────────────────┐
│                                                                              │
│ ┌─ Isolate 1 — E. coli (eco) ───────────────────────────────────────────┐   │
│ │  Run #1  ·  Panel: GN-STD  ·  Method: VITEK 2  ·  CLSI M100 2024     │   │
│ │  Started: 2026-05-12 07:54  ·  Status: Complete (with 3 overrides)    │   │
│ │                                                                        │   │
│ │  Antibiotic         │ MIC      │ Interpretation │ Override?           │   │
│ │  ───────────────────┼──────────┼────────────────┼─────────────────    │   │
│ │  Ampicillin         │ > 32     │ R              │                     │   │
│ │  Ampicillin/Sulb.   │ 16       │ R              │                     │   │
│ │  TMP/SMX            │ ≤ 0.5    │ S              │                     │   │
│ │  Ciprofloxacin      │ 2        │ I              │                     │   │
│ │  Ceftriaxone        │ 16       │ R              │  → R (ESBL)         │   │
│ │  Meropenem          │ ≤ 0.25   │ S              │                     │   │
│ │  Amikacin           │ 4        │ S              │                     │   │
│ │  Gentamicin         │ 4        │ S→R            │  → R (cascade)      │   │
│ │  (... 8 more)                                                          │   │
│ │                                                                        │   │
│ │  [Edit AST] [View Audit] [+ New AST Run]                              │   │
│ └────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Carbon components:** Per-Isolate Tile with `DataTable` inside.

Click "Edit AST" opens the AST Entry modal (M-05). Click "View Audit" opens an audit overlay showing the original vs. override values, the rule (if any) that drove the override, the user who applied it, and the justification.

"+ New AST Run" allows additional AST Runs against the same Isolate — typically used when a confirmation test (e.g., ESBL confirmation card) is run, or when initial AST QC failed and a rerun is needed.

---

## 7. Reports section

### 7.1 Display

```
┌─ Reports ────────────────────────────────────────────────────────────────────┐
│                                                                              │
│ Final (v2) released 2026-05-14 15:32 by Dr. Adeyemi      [View] [Amend]     │
│ Final (v1) released 2026-05-13 09:08 by Dr. Adeyemi      [View] (superseded) │
│ Preliminary released 2026-05-12 07:42 by Olivia          [View]              │
│                                                                              │
│ [Release Preliminary] (disabled: already released)                           │
│ [Release Final]                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Each report version is a `Tile` row with timestamp, releaser, action buttons. The most recent Final is the canonical version; older versions show "(superseded)" and remain accessible.

### 7.2 Preliminary release

The "Release Preliminary" action opens a modal:

```
┌─ Release Preliminary Report? ───────────────────────────────────────────────┐
│                                                                              │
│ Case will be released as preliminary with the following information:        │
│                                                                              │
│ Isolates identified or preliminary:                                          │
│   Isolate 1: Gram negative rods (preliminary)                               │
│   Isolate 2: (none yet)                                                     │
│                                                                              │
│ Critical comm logged: Yes — 2026-05-12 07:38 to ER, Dr. Patel               │
│                                                                              │
│ Preliminary Report Comments:                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ .gnr from blood culture, ID and AST in progress. Recommend broad-       │ │
│ │ spectrum coverage pending final results.                                │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Macros: `reporting`, `culture`                                              │
│                                                                              │
│ Distribution: Email to ordering provider, Print to ER, FHIR push           │
│                                                                              │
│ [Cancel]                                                  [Release Prelim]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

On release:

1. Validate at least one Isolate exists with Gram Stain Observation populated. (Block release if not.)
2. Generate PDF via Jasper (template `micro_preliminary_report.jrxml`).
3. Distribute via configured channels (per existing patient-report distribution infrastructure).
4. Write `report_release_event` row + Timeline event REPORT_RELEASED.
5. Update Case `prelim_released_at` + `prelim_released_by`.
6. Transition Case stage to PRELIM_REPORTED.

### 7.3 Final release

The "Release Final" action requires `micro.report.final` (typically supervisor or manager). The modal includes a release checklist:

```
┌─ Release Final Report? ─────────────────────────────────────────────────────┐
│                                                                              │
│ Pre-release checklist:                                                       │
│   ✓ All Isolates have a final organism identification                       │
│   ✓ AST complete for all clinically significant Isolates                    │
│   ✓ All expert rule flags addressed (or N/A in Phase 1A)                    │
│   ✓ No pending additional tests (e.g., ESBL confirmation)                   │
│   ✓ Clinical correlation reviewed                                            │
│                                                                              │
│ Reviewer: Dr. Adeyemi (current user)                                        │
│ Review Date / Time: 2026-05-13 09:08                                        │
│                                                                              │
│ Culture Results Summary:                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Escherichia coli isolated from blood culture (Isolate 1).               │ │
│ │ ESBL phenotype confirmed.                                                │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Macros: `culture`                                                           │
│                                                                              │
│ Interpretation / Clinical Comments:                                          │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ESBL-producing E. coli. All penicillins, cephalosporins, and aztreonam │ │
│ │ reported as resistant regardless of MIC. Recommend meropenem or         │ │
│ │ amikacin pending clinical response. Infection control notified.         │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Macros: `reporting`                                                         │
│                                                                              │
│ Technologist Notes (internal, not on patient report):                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Re-streaked for purity on 2026-05-13. Pure culture confirmed.           │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Macros: `reporting`                                                         │
│                                                                              │
│ Info:                                                                        │
│ ℹ Releasing final report will notify the ordering provider and lock the     │
│   Case from further edits. Amendments will be possible.                     │
│                                                                              │
│ [Cancel]                                                  [Release Final]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

On release:

1. Validate all checklist items pass. (Block release if any failure.)
2. Generate PDF via Jasper (template `micro_final_report.jrxml`).
3. Distribute via existing patient-report channels.
4. Write `report_release_event` row + Timeline event REPORT_RELEASED.
5. Update Case `final_released_at`, `final_released_by`, `final_version = 1`.
6. Transition Case stage to FINAL_REPORTED.
7. Lock Case from edits (UI prevents most actions; backend enforces).

### 7.4 Amendment

Action available after FINAL_REPORTED. Opens a modal:

```
┌─ Amend Final Report ────────────────────────────────────────────────────────┐
│                                                                              │
│ This Case has a Final report released 2026-05-13 (v1). Amending creates    │
│ a new version (v2). The original is preserved.                              │
│                                                                              │
│ Reason for amendment:                                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ID_CORRECTED ▼                                                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Options: ID_CORRECTED, AST_CORRECTED, QC_FAILURE_RETRO, NEW_ISOLATE_LATE,   │
│ SIGNIFICANCE_CHANGED, CLINICAL_CORRELATION_ADDED, OTHER                     │
│                                                                              │
│ Amendment description:                                                       │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Re-identified Isolate 1 as Klebsiella pneumoniae by MALDI-TOF.          │ │
│ │ AST profile remains valid for the corrected organism.                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ The amendment unlocks Case editing temporarily. Make required changes,      │
│ then return here to Release Amended Final.                                  │
│                                                                              │
│ [Cancel]                                              [Start Amendment]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

On "Start Amendment":

1. Case stage temporarily → AMENDED (allows edits).
2. Timeline event AMENDMENT_STARTED.
3. User makes edits (reidentify Isolate, edit AST, change significance, etc.).
4. User returns to Reports section, clicks "Release Amended Final."
5. Modal repeats the Release Final checklist + amendment-specific comment fields.
6. On release: `final_version` increments; new PDF generated marked "AMENDED"; old version superseded but accessible; Case settles back to FINAL_REPORTED.

---

## 8. Sidebar / Page layout

The Case Detail page uses a left-sidebar navigation (`SideNav`) anchored to the major sections, with the main content area scrollable:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header (existing OpenELIS header)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Home / Microbiology / Case MC-2024-001234                                    │
│ Microbiology Case MC-2024-001234           Stage: AST_IN_PROGRESS            │
│ Patient: MARTINEZ, Carlos | DOB: 1968-04-22 | M | Lab #: BC24-0892          │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │                                                               │
│ CASE         │  Main Content Area                                            │
│ NAVIGATION   │  (Scrollable)                                                 │
│              │                                                               │
│ ✓ Case Info  │  ┌── Case Info ───────────────────────────────────────────┐ │
│ ✓ Inoculation│  │ Patient, specimen, protocol, assigned tech, ...        │ │
│ ✓ Timeline   │  └────────────────────────────────────────────────────────┘ │
│   8 events   │                                                               │
│ ◐ Isolates   │  ┌── Inoculation ─────────────────────────────────────────┐ │
│   1 of 1     │  │ FA24012, FN24012, BacT/Alert, lot # GL-26-04-117      │ │
│ ◐ AST        │  └────────────────────────────────────────────────────────┘ │
│   1 / 1      │                                                               │
│ ○ Expert     │  ┌── Timeline ────────────────────────────────────────────┐ │
│   Review     │  │ (last 10 events; "Show All" expands)                   │ │
│   N/A 1A     │  └────────────────────────────────────────────────────────┘ │
│ ○ Final      │                                                               │
│   Review     │  ┌── Isolates ────────────────────────────────────────────┐ │
│ ○ Reports    │  │ Isolate 1 tile                                          │ │
│              │  │ [+ Add Isolate]                                         │ │
│              │  └────────────────────────────────────────────────────────┘ │
│              │                                                               │
│              │  ┌── AST Results ─────────────────────────────────────────┐ │
│              │  │ Per-Isolate AST runs                                    │ │
│              │  └────────────────────────────────────────────────────────┘ │
│              │                                                               │
│              │  ┌── Reports ─────────────────────────────────────────────┐ │
│              │  │ Release Prelim / Release Final / Amend                  │ │
│              │  └────────────────────────────────────────────────────────┘ │
│              │                                                               │
├──────────────┴──────────────────────────────────────────────────────────────┤
│ ⚠ Unsaved changes  [Discard]  [Save Progress]  [Release Prelim]  [Release Final] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Per memory** `feedback_openelis_sidenav_submenus`: the SideNav uses Carbon `SideNav` with submenu items, not in-page tabs. This is the contextual navigation for the Case Detail page only (different from the app-level Micro Module sidenav).

**Per memory** `feedback_result_entry_panel_inline_rows`: the AST Results section uses inline rows, not Accordion.

**Per memory** `feedback_preview_completeness`: every section is fleshed out, not stubbed.

### 8.1 Sidebar progress indicators

- ✓ (green) — Section complete
- ◐ (orange) — Section partial / in progress
- ○ (gray) — Section not started or N/A

Computed:

- Case Info: ✓ always (it's auto-populated)
- Inoculation: ✓ when at least one `micro_case_inoculation` row exists
- Timeline: count of events, never has a "complete" state (always ◐ or ✓ if any events)
- Isolates: x of y where y is "at least 1 expected" — ◐ if Isolates exist but not all have organism; ✓ when all have organism
- AST: x / y where x = complete AST Runs, y = total AST Runs across all Isolates
- Expert Review: N/A in Phase 1A; ○ until 1B
- Final Review: ○ until READY_REVIEW; ✓ when FINAL_REPORTED
- Reports: count of released reports; ○ until first release

---

## 9. Footer action bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠ Unsaved changes  [Discard]  [Save Progress]  [Release Prelim]  [Release Final] │
└─────────────────────────────────────────────────────────────────────────────┘
```

Sticky footer (Carbon `ButtonSet`). Buttons enabled per Case state and user permission:

| Button | Visible when | Enabled when |
|--------|--------------|--------------|
| Discard Changes | Unsaved edits exist | Always when visible |
| Save Progress | Any section modified | Valid data entered |
| Release Preliminary | Case has at least one Isolate with Gram stain; not yet PRELIM_REPORTED | User has `micro.report.preliminary` |
| Release Final | Case is READY_REVIEW or PRELIM_REPORTED | User has `micro.report.final`; checklist passes |
| Amend Report | Case is FINAL_REPORTED | User has `micro.report.amend` |

---

## 10. Analyzer event channel

This is a new general OE foundation introduced by M-04 (per crosswalk Q3).

### 10.1 Purpose

Existing OE analyzer integrations are result-oriented (one OBX per test result). Blood culture instruments push **events** (POSITIVE_SIGNAL, NEGATIVE_AT_DAY_N, BOTTLE_LOADED, BOTTLE_REMOVED) keyed by bottle ID. VITEK / Phoenix push both results AND events (CARD_LOADED, CARD_COMPLETE, QC_FAIL). The event channel handles non-result messages from analyzers.

### 10.2 Architecture

```
[Analyzer]
   │
   ▼  ASTM / HL7 / vendor protocol
[Analyzer-side service / driver]
   │
   ├──── result messages ────────► existing analyzer result ingestion
   │                                                            │
   │                                                            ▼
   │                                                       result table
   │
   └──── event messages  ────────► new analyzer_event channel
                                                                │
                                                                ▼
                                                       analyzer_event table
                                                                │
                                                                ▼
                                              event handlers (Micro Case
                                              subscribes to relevant types)
```

### 10.3 Event types (Phase 1A scope)

| Event type | Source | Action on receipt |
|------------|--------|-------------------|
| POSITIVE_SIGNAL | Blood culture instrument (BacT/Alert, BACTEC) | Look up Case via `bottle_or_plate_id` → Case stage INCUBATING → POSITIVE_SIGNAL transition; Timeline event |
| NEGATIVE_AT_DAY_N | Blood culture instrument | Look up Case; if past max_incubation_days, transition to NO_GROWTH_FINAL with auto-generated Final report; if not, mark for tech review |
| AST_RESULT_AVAILABLE | AST instrument (VITEK 2, Phoenix) | Look up AST Run via card_id → write `result` rows via existing multi-reading mechanism (M-05) → AST Run status COMPLETE → Timeline event AST_RESULT_RECEIVED |
| AST_QC_FAIL | AST instrument | AST Run status QC_FAILED; alert tech via case detail banner |
| ID_RESULT_AVAILABLE | ID instrument (VITEK 2, MALDI) | Look up Isolate via card_id → update organism_id, id_method, id_confidence |
| BOTTLE_LOADED, BOTTLE_REMOVED, CARD_LOADED, CARD_COMPLETE | Various | Logged for audit; no automatic action |
| MAINTENANCE_DUE, REAGENT_LOW | Various | Phase 1B — surfaces to lab manager via Alerts Dashboard |

### 10.4 Event handler registration

Modules register handlers for event types they care about. Micro Case Service registers for the seven event types above. Future modules (e.g., a chemistry maintenance dashboard) register for MAINTENANCE_DUE / REAGENT_LOW.

### 10.5 Failure handling

If an event arrives but lookup fails (e.g., POSITIVE_SIGNAL with a bottle ID that doesn't match any Case), the event is written to `analyzer_event` with `status = FAILED` and surfaces in a "Stuck Analyzer Events" admin page for manual reconciliation.

### 10.6 Acceptance criteria

- AC-M04-AE-01: BacT/Alert POSITIVE_SIGNAL event correctly transitions a Case from INCUBATING to POSITIVE_SIGNAL.
- AC-M04-AE-02: Case lookup by `bottle_or_plate_id` finds the right Case across multiple inoculation events.
- AC-M04-AE-03: A POSITIVE_SIGNAL for a bottle not matching any Case writes a FAILED analyzer_event and surfaces it in admin.
- AC-M04-AE-04: AST_RESULT_AVAILABLE for a card_id matching an AST Run writes result rows correctly.
- AC-M04-AE-05: Replay of queued events from analyzer-side service after network restore writes in chronological order.

---

## 11. Critical-Result Notification integration

Per M-11, the Case writes critical notifications via the polymorphic `critical_notification` table. The Case Detail page has a "Log Critical Notification" button at the top of the Isolates section (visible whenever the Case has any Isolate or is in POSITIVE_SIGNAL or later stage).

Clicking opens a modal that captures:

- Notified at (default: now)
- Clinician notified (TextInput + ComboBox referencing providers)
- Phone / pager called
- Substance of conversation (MacroTextarea, `reporting` category)
- Notified by (current user)

On save:

- Write `critical_notification` row with `target_type = CASE`, `target_id = case_id`.
- Write Timeline event of type CRITICAL_NOTIFY.
- Display the notification in the Case Detail header with a `Tag` indicator.

---

## 12. Test → Reagent Linkage integration

Per M-12, AST Runs and Inoculation events reference reagent lots:

- **Inoculation modal**: a `ComboBox` per media type referencing active reagent lots for that media. Selecting a lot validates against `qc_lot` (existing) — must be unlocked and not expired.
- **AST Setup modal (M-05)**: a `ComboBox` for the AST card / disk lot. Selecting validates against `qc_lot`.

If a lot is locked or expired, the system blocks save with a clear error.

---

## 13. Permissions

| Action | Permission |
|--------|-----------|
| View Case Detail | `micro.case.view` |
| Edit Case (any field) | `micro.case.edit` |
| Add / edit Isolate | `micro.isolate.create`, `micro.isolate.edit` |
| Reidentify finalized Isolate | `micro.isolate.reidentify` |
| Set up AST Run | `micro.ast.setup` |
| Manual AST result entry | `micro.ast.enter` |
| Override AST interpretation | `micro.ast.override` |
| Release Preliminary | `micro.report.preliminary` |
| Release Final | `micro.report.final` |
| Amend Final | `micro.report.amend` |
| Log critical notification | `critical.notify.create` |
| Acknowledge critical notification | `critical.notify.acknowledge` |

---

## 14. Acceptance criteria

Top-level criteria (each section above has its own AC items; this is the cross-cutting summary):

- **AC-M04-01**: Sample saved with program=MICROBIOLOGY auto-creates a Case in stage RECEIVED via post-save hook.
- **AC-M04-02**: Case Detail page renders Header, Sidebar nav, all six section tiles, Footer action bar.
- **AC-M04-03**: Stage transitions are atomic with their triggering action.
- **AC-M04-04**: All state transitions write `micro_case_stage_transition` rows.
- **AC-M04-05**: Preliminary release allowed as early as POSITIVE_SIGNAL once one Isolate has Gram stain.
- **AC-M04-06**: Final release validates checklist; blocks on failure.
- **AC-M04-07**: Amendment creates new report version preserving original.
- **AC-M04-08**: Reidentification creates new Isolate version preserving old; does not auto-re-interpret AST.
- **AC-M04-09**: Late slow grower can revive NO_GROWTH_FINAL to POSITIVE_SIGNAL with reason captured.
- **AC-M04-10**: Order cancellation cascades to appropriate terminal stage based on Case progress.
- **AC-M04-11**: Analyzer event channel writes events; Case Service consumes registered types.
- **AC-M04-12**: All audit rows are immutable; UPDATE/DELETE attempts via API rejected.
- **AC-M04-13**: Critical notifications integrate via M-11's polymorphic table.
- **AC-M04-14**: Reagent lot validation blocks save on locked/expired lots (via M-12).
- **AC-M04-15**: Permissions enforced server-side on every state-changing action.
- **AC-M04-16**: NFR-02 (scale) and NFR-04 (a11y) satisfied per M-NFR.

---

## 15. i18n keys

Roughly 150-200 keys for M-04 (largest of the modules). Pattern:

```
micro.case.header.title                            "Microbiology Case {{labNumber}}"
micro.case.header.stage.received                   "Received"
micro.case.header.stage.incubating                 "Incubating"
micro.case.header.stage.positiveSignal             "Positive signal"
micro.case.header.stage.organismId                 "Organism ID"
micro.case.header.stage.astInProgress              "AST in progress"
micro.case.header.stage.readyReview                "Ready for review"
micro.case.header.stage.prelimReported             "Preliminary reported"
micro.case.header.stage.finalReported              "Final reported"
micro.case.header.stage.amended                    "Amended"
micro.case.header.stage.noGrowthFinal              "No growth"
micro.case.header.stage.rejected                   "Rejected"
micro.case.header.stage.cancelledPreInoculation    "Cancelled (pre-inoculation)"
micro.case.header.stage.cancelledPostInoculation   "Cancelled (post-inoculation)"
micro.case.header.stage.cancelledPostPositive      "Cancelled (post-positive)"
micro.case.header.stage.lostSpecimen               "Specimen lost"
micro.case.header.stage.lostSpecimenPositive       "Specimen lost (post-positive)"
micro.case.sidebar.section.info                    "Case Info"
micro.case.sidebar.section.inoculation             "Inoculation"
micro.case.sidebar.section.timeline                "Timeline"
micro.case.sidebar.section.isolates                "Isolates"
micro.case.sidebar.section.ast                     "AST"
micro.case.sidebar.section.expertReview            "Expert Review"
micro.case.sidebar.section.finalReview             "Final Review"
micro.case.sidebar.section.reports                 "Reports"
micro.case.section.timeline.addEvent               "+ Add Event"
micro.case.section.timeline.eventType.inoculation  "Inoculated"
micro.case.section.timeline.eventType.positiveSignal "Positive signal"
micro.case.section.timeline.eventType.gramStain    "Gram stain"
... (~40 timeline-event-type keys)
micro.case.section.isolates.addIsolate             "+ Add Isolate"
micro.case.section.isolates.isolateLabel           "Isolate {{number}}"
micro.case.section.isolates.idMethod.manualBiochem "Manual biochemistry"
micro.case.section.isolates.idMethod.vitek2        "VITEK 2"
micro.case.section.isolates.idMethod.maldiTof      "MALDI-TOF"
micro.case.section.isolates.idMethod.pcr           "PCR / Molecular"
... (~30 isolate-section keys)
micro.case.section.ast.runLabel                    "Run #{{number}}"
micro.case.section.ast.editAst                     "Edit AST"
micro.case.section.ast.viewAudit                   "View Audit"
micro.case.section.ast.newAstRun                   "+ New AST Run"
... (~40 AST-section keys)
micro.case.modal.releasePrelim.title               "Release Preliminary Report?"
micro.case.modal.releasePrelim.confirm             "Release Preliminary"
micro.case.modal.releaseFinal.title                "Release Final Report?"
micro.case.modal.releaseFinal.checklist.allIdentified "All Isolates have a final organism identification"
micro.case.modal.releaseFinal.checklist.astComplete "AST complete for all clinically significant Isolates"
micro.case.modal.releaseFinal.checklist.expertResolved "All expert rule flags addressed"
micro.case.modal.releaseFinal.checklist.noPending  "No pending additional tests"
micro.case.modal.releaseFinal.checklist.clinicalReviewed "Clinical correlation reviewed"
micro.case.modal.releaseFinal.confirm              "Release Final"
micro.case.modal.amend.title                       "Amend Final Report"
micro.case.modal.amend.reasonLabel                 "Reason for amendment"
micro.case.modal.amend.reason.idCorrected          "Organism identification corrected"
micro.case.modal.amend.reason.astCorrected         "AST results corrected"
micro.case.modal.amend.reason.qcFailureRetro       "QC failure caught retrospectively"
micro.case.modal.amend.reason.newIsolateLate       "Additional isolate identified late"
micro.case.modal.amend.reason.significanceChanged  "Significance reclassified"
micro.case.modal.amend.reason.clinicalAdded        "Clinical correlation added"
micro.case.modal.amend.reason.other                "Other"
micro.case.modal.amend.description                 "Amendment description"
micro.case.modal.amend.start                       "Start Amendment"
micro.case.modal.amend.releaseAmended              "Release Amended Final"
micro.case.error.permission                        "You do not have permission for this action"
micro.case.error.staleState                        "This Case has been updated by another user; please refresh"
micro.case.error.releasePrelim.noGramStain         "Cannot release preliminary: no Isolate has a Gram stain observation"
micro.case.error.releaseFinal.checklistFailed      "Cannot release final: please complete all checklist items"
... (further keys as the FRS is implemented)
```

---

## 16. Open verification items

- Confirm existing OE patient-report distribution mechanism is reusable (`FRS_FHIR_Outbound_Push.md` and existing print/email surface).
- Confirm Jasper template registration path.
- Confirm existing OE Order cancellation event emission for the cascade hook in §3.4.
- Confirm existing `qc_lot` table schema for M-12 integration.
- Confirm existing `provider` table for clinician ComboBox in Critical Notification modal.

---

## 17. References

- M-00 Microbiology Module Parent Specification
- M-NFR Non-Functional Requirements
- M-01 AMR Reference Data
- M-02 Breakpoint Catalog
- M-03 Order Entry Hook
- M-05 AST Entry & Interpretation
- M-06 Expert Rules Engine (Phase 1B; consumes AST state changes)
- M-07 Worklists
- M-08 Macro Library
- M-11 Critical-Result Acknowledgment
- M-12 Test → Reagent Linkage
- `amr-crosswalk-working.md` Q1, Q2, Q3, Q4, Q5
- `amr-micro-narrative-v1-for-devs.md` Phases 1-5
- `amr-pre-frs-planning-v1.md` §1 (unhappy paths), §4 (versioning rules)
- Existing OE Sample, Order, Result, Patient, Provider, qc_lot tables
