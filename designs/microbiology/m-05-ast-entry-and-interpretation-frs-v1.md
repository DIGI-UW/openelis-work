# M-05 AST Entry & Interpretation — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology → Case Workbench → AST
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the AST setup and result-entry modals invoked from Case Detail (M-04), the `BreakpointLookupService` that converts raw MIC / zone values to S/I/R, the manual override mechanism with audit, and analyzer-ingested AST results. Expert Rules (which can also drive overrides) live in M-06 and are out of Phase 1A scope.

---

## 1. Overview

### 1.1 Purpose

The AST workflow has three modes that must coexist:

1. **Manual entry** — tech reads disk diffusion zones or broth dilution MICs and types them in.
2. **Analyzer-ingested** — VITEK 2 / Phoenix push AST results via the analyzer event channel (M-04 §10).
3. **Hybrid** — automated AST result lands; tech reviews, possibly overrides one or more values manually.

All three paths produce the same data shape: an `micro_ast_run` header row + per-antibiotic result rows in the existing `result` table (per crosswalk Q2). The `BreakpointLookupService` is called to interpret MIC or zone numbers into S/I/R values.

### 1.2 Routes (modals invoked from M-04)

| Surface | Trigger |
|---------|---------|
| AST Setup modal | "Set up AST" button on an Isolate in M-04 |
| AST Edit modal | "Edit AST" button on an AST Run row in M-04 §6 |
| AST Audit overlay | "View Audit" button on an AST Run row |
| AST QC view (Phase 1B) | sidebar drilldown |

### 1.3 Users

| Role | Actions |
|------|---------|
| Microbiology Technician | Set up AST, enter results manually, apply overrides with justification |
| Microbiology Supervisor | All of the above; review and revert overrides |
| Lab Manager | All of the above |
| Medical Technologist | Same as Tech for analyzer integration |

### 1.4 Integration

- **M-01 Reference Data** — AST Panels (which antibiotics to test) and Antibiotic Master.
- **M-02 Breakpoint Catalog** — BreakpointLookupService queries this.
- **M-04 Case Workbench Core** — invokes M-05 modals; consumes resulting AST Runs.
- **M-06 Expert Rules** (Phase 1B) — applies post-AST-result overrides; M-05's override mechanism is the substrate.
- **M-08 Macro Library** — override justification and AST comments are macro-enabled.
- **M-12 Test → Reagent Linkage** — AST card / disc lot referenced per AST Run.
- **M-04 §10 Analyzer event channel** — consumes AST_RESULT_AVAILABLE events.

---

## 2. AST Run data model

```
micro_ast_run
├── run_id (UUID PK)
├── case_id (FK to micro_case)
├── isolate_id (FK to specific isolate VERSION — see M-04 §5 reidentification)
├── ast_panel_id (FK to ast_panel)
├── ast_panel_version (int, snapshot at run creation)
├── breakpoint_standard_id (FK to breakpoint_standard)
├── breakpoint_version (text, snapshot at run creation, e.g., "CLSI_M100_2024")
├── method (enum: VITEK_2, BD_PHOENIX, SENSITITRE, DISK_DIFFUSION, ETEST, BROTH_MICRODILUTION, MANUAL)
├── status (enum: PENDING_SETUP, IN_PROGRESS, READING, COMPLETE, QC_FAILED, RERUN_REQUIRED, INVALIDATED)
├── analyzer_card_id (text, nullable — analyzer-side identifier when method is automated)
├── reagent_lot_id (FK to qc_lot via M-12)
├── started_at (timestamp)
├── started_by (FK to user)
├── completed_at (timestamp, nullable)
├── invalidated_at (timestamp, nullable)
├── invalidated_by (FK, nullable)
├── invalidated_reason (enum, nullable)
├── general_comments (text, macro-enabled, `ast` category)
├── audit columns

result (existing OE table, extended via multi-reading)
├── result_id (PK)
├── (existing columns)
├── micro_ast_run_id (FK to micro_ast_run, nullable — only set for AST results)
├── antibiotic_id (FK to antibiotic_master, nullable — only set for AST results)
├── readings (multi-reading per OE existing mechanism):
│     ├── mic_value (numeric, nullable)
│     ├── mic_unit (text, default "ug/mL")
│     ├── zone_diameter (numeric, nullable, mm)
│     ├── interpretation (enum: S, I, R, NS [non-susceptible], SDD [susceptible-dose-dependent])
│     ├── source (enum: ANALYZER_AUTO, MANUAL_ENTRY, OVERRIDE)
│     └── breakpoint_version (text, snapshot at interpretation time)
└── audit columns

micro_ast_override (audit table)
├── override_id (PK)
├── result_id (FK to result row that was overridden)
├── reading_id (FK to specific reading within the result row, since results are multi-reading)
├── original_interpretation (enum)
├── original_mic, original_zone (numeric, preserved)
├── override_interpretation (enum)
├── override_mic, override_zone (numeric, nullable — usually only interpretation changes)
├── rule_id (FK to expert_rule_definition, nullable — null if manual override)
├── rule_version (int, nullable, snapshot)
├── justification (text, macro-enabled, `ast` category, required)
├── overridden_at (timestamp)
├── overridden_by (FK to user)
├── reverted_at (timestamp, nullable — if a supervisor reverts the override)
├── reverted_by (FK, nullable)
├── revert_justification (text, nullable)
└── audit columns
```

---

## 3. AST Setup modal

### 3.1 Trigger

From M-04 Case Detail → Isolate tile → "Set up AST" button.

Pre-condition: the Isolate has at least preliminary information (Gram stain or organism). The button is disabled otherwise (tooltip explains).

### 3.2 Layout

`ComposedModal` size `md`.

```
┌─ Set up AST — Isolate 1 (E. coli, eco) ─────────────────────────────────────┐
│                                                                              │
│  AST Panel: *                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ GN-STD — Gram-negative standard (16 antibiotics)                  ▼     │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Default for E. coli + blood specimen. Override if needed.                   │
│                                                                              │
│  Method: *                                                                   │
│  (•) VITEK 2 AST-GN     ( ) Disk diffusion     ( ) Etest                    │
│  ( ) BD Phoenix         ( ) Broth microdilution ( ) Manual                  │
│                                                                              │
│  Analyzer Card ID:                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ V2-CRD-2026-05-12-001                                                   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Scan or enter the card barcode; required for analyzer-ingested methods      │
│                                                                              │
│  Breakpoint Standard: *                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ EUCAST v14.0 (active)                                              ▼   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Defaults to the lab's active standard for the publisher                     │
│                                                                              │
│  Reagent Lot: *                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ VITEK GN AST card — Lot AST-GN-26-04-117 (expires 2026-08-15)     ▼   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Filter to unlocked, unexpired lots only                                     │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  [Cancel]                                                            [Save]  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Fields

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| AST Panel | `ComboBox` referencing active `ast_panel` records, defaulted from Isolate.default_ast_panel_id | Yes | Helper text: "Default for [organism] + [specimen]. Override if needed." |
| Method | `RadioButtonGroup` | Yes | VITEK_2, BD_PHOENIX, SENSITITRE, DISK_DIFFUSION, ETEST, BROTH_MICRODILUTION, MANUAL |
| Analyzer Card ID | `TextInput` | Yes for analyzer methods | Card barcode |
| Breakpoint Standard | `ComboBox` referencing breakpoint_standard, defaulted to lab's active standard for publisher | Yes | Helper text: "Defaults to the lab's active standard." Tech can pick CLSI vs EUCAST per run if both active |
| Reagent Lot | `ComboBox` filtered to active reagent lots for the chosen method's reagent type | Yes | Validated via M-12 |

### 3.4 Validation on save

- All required fields populated.
- Reagent lot is unlocked AND not expired (M-12 service call).
- For analyzer methods: card ID format matches the analyzer's expected pattern (regex per analyzer profile).
- AST Panel version is snapshotted into the run.
- Breakpoint Standard version is snapshotted into the run.

### 3.5 On save

1. Write `micro_ast_run` row with `status = PENDING_SETUP`, all snapshotted values.
2. Write Timeline event AST_SETUP referencing the run.
3. Transition Case stage to AST_IN_PROGRESS if currently in ORGANISM_ID.
4. Pre-populate `result` rows for each antibiotic in the AST Panel, with `micro_ast_run_id` set, `interpretation = null`, ready to receive readings.
5. Close modal; return to Case Detail.

If method = MANUAL or DISK_DIFFUSION: the user typically then clicks "Edit AST" to enter results. If method = VITEK_2 or PHOENIX or SENSITITRE: the analyzer will push results via event channel.

---

## 4. AST Edit modal

### 4.1 Trigger

From Case Detail → AST Run row → "Edit AST" button. Or from AST Worklist → row action.

### 4.2 Layout

`ComposedModal` size `xl`.

```
┌─ Edit AST — Isolate 1 (E. coli) — Run #1 ───────────────────────────────────┐
│                                                                              │
│  Panel: GN-STD VITEK 2  ·  Method: VITEK 2 AST-GN  ·  Card: V2-CRD-...001    │
│  Breakpoint: EUCAST v14.0  ·  Lot: AST-GN-26-04-117  ·  Status: Complete    │
│  Started: 2026-05-12 07:54 by Olivia  ·  Completed: 2026-05-12 11:45 (auto) │
│                                                                              │
│  Quick actions: [Import from Analyzer] [Apply Defaults] [Clear All]         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Antibiotic       │ MIC      │ Zone │ Interp │ Override?  │ Source     │ │
│  ├──────────────────┼──────────┼──────┼────────┼────────────┼────────────┤ │
│  │ Ampicillin       │ > 32     │  —   │ R      │            │ ANALYZER   │ │
│  │ Amox/Clav        │ 16       │  —   │ R      │            │ ANALYZER   │ │
│  │ TMP/SMX          │ ≤ 0.5    │  —   │ S      │            │ ANALYZER   │ │
│  │ Cefazolin        │ 8        │  —   │ R      │            │ ANALYZER   │ │
│  │ Ceftriaxone      │ 16       │  —   │ R      │ [☑]        │ ANALYZER   │ │
│  │ Cefepime         │ 2        │  —   │ I      │            │ ANALYZER   │ │
│  │ Meropenem        │ ≤ 0.25   │  —   │ S      │            │ ANALYZER   │ │
│  │ Ertapenem        │ ≤ 0.25   │  —   │ S      │            │ ANALYZER   │ │
│  │ Ciprofloxacin    │ 2        │  —   │ I      │            │ ANALYZER   │ │
│  │ Levofloxacin     │ 1        │  —   │ S      │            │ ANALYZER   │ │
│  │ Gentamicin       │ 4        │  —   │ S      │            │ ANALYZER   │ │
│  │ Amikacin         │ 4        │  —   │ S      │            │ ANALYZER   │ │
│  │ Tobramycin       │ ≤ 1      │  —   │ S      │            │ ANALYZER   │ │
│  │ Fosfomycin       │ ≤ 32     │  —   │ S      │            │ ANALYZER   │ │
│  │ Nitrofurantoin   │ ≤ 16     │  —   │ S      │            │ ANALYZER   │ │
│  │ Aztreonam        │ 8        │  —   │ R      │            │ ANALYZER   │ │
│  └──────────────────┴──────────┴──────┴────────┴────────────┴────────────┘ │
│                                                                              │
│  ┌─ Override on Ceftriaxone (checkbox selected above) ─────────────────────┐ │
│  │ Original: R (MIC 16, EUCAST 14.0)                                       │ │
│  │ New interpretation: R (unchanged — flagged for ESBL)                    │ │
│  │ Justification: *                                                         │ │
│  │ ┌──────────────────────────────────────────────────────────────────────┐ │ │
│  │ │ .esblc                                                               │ │ │
│  │ └──────────────────────────────────────────────────────────────────────┘ │ │
│  │ Macros: `ast` (type . for shortcuts)                                    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  General AST Comments:                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ESBL phenotype confirmed by combined disk testing.                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  Macros: `ast`                                                              │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  [Cancel]                                                            [Save]  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Per memory** `feedback_result_entry_panel_inline_rows`: the override section appears as an inline row below the result table when the Override checkbox is selected — not wrapped in an Accordion.

### 4.3 Result row interaction

Each row of the antibiotics DataTable:

- **MIC column** — `NumberInput` or `TextInput` accepting WHONET-style values (`≤`, `<`, `>`, `≥`, exact). For VITEK-imported, displays the analyzer value. For Manual / Disk Diffusion, the tech types.
- **Zone column** — `NumberInput` in mm for Disk Diffusion method.
- **Interp** — Auto-calculated by `BreakpointLookupService` when MIC or Zone changes. User can override.
- **Override** — `Checkbox`; when selected, the inline override section appears below the table for that row.
- **Source** — Read-only badge: ANALYZER, MANUAL, OVERRIDE.

### 4.4 BreakpointLookupService integration

When the user enters or modifies an MIC or zone value:

1. Frontend calls `BreakpointLookupService.lookup(isolate.organism_id, antibiotic_id, method, breakpoint_standard_id, specimen_type_id)`.
2. Service returns thresholds + `matched_by`.
3. Frontend computes interpretation per the rules in M-02 §6.3.
4. Interpretation appears in the Interp column.
5. If `matched_by = NONE`, Interp dropdown is enabled for manual selection with a "no breakpoint" badge.

### 4.5 Override mechanism

The Override checkbox toggles inline override entry below the row. Required fields when override is on:

- **New interpretation** — Dropdown S / I / R / NS / SDD
- **Justification** — `MacroTextarea`, `ast` category, required

On save:

1. The Reading associated with the result row gets a new entry: `source = OVERRIDE`, `interpretation = override_value`.
2. A `micro_ast_override` row is written capturing original vs. new, justification, user, timestamp.
3. The result row's "current" interpretation (displayed in reports and downstream) is the OVERRIDE reading. The original ANALYZER or MANUAL reading remains accessible.

### 4.6 Apply Defaults action

For analyzer-ingested AST: re-runs BreakpointLookupService against the current breakpoint standard for every antibiotic. Useful when the lab changes the active standard after results arrived.

For Manual / Disk Diffusion: no-op (no analyzer values to reinterpret).

### 4.7 Import from Analyzer action

For an AST Run with method = VITEK_2 / PHOENIX / SENSITITRE: triggers a pull from the analyzer event channel for any unprocessed AST_RESULT_AVAILABLE events matching the card ID. Used when the event channel had a backlog or the tech wants to manually trigger ingestion.

### 4.8 Clear All action

Confirmation dialog. Clears all result rows back to empty. Used when the lab decides to invalidate and re-do an AST Run without setting up a new run. Writes audit row.

### 4.9 QC failure handling

If during analyzer ingestion an AST_QC_FAIL event is received:

- AST Run `status` → QC_FAILED.
- A banner appears in the modal: "QC organism on this card failed. Results cannot be released. Re-run AST against fresh card."
- Save is disabled until either: (a) user manually invalidates the run with a reason and starts a fresh AST Setup, OR (b) supervisor overrides the QC failure flag (with documented reason).

### 4.10 Save behavior

On Save:

1. Persist all changes (new readings, overrides, comments).
2. If AST Run status transitions to COMPLETE, write Timeline event AST_RESULT_RECEIVED with summary.
3. Trigger expert rule evaluation (Phase 1B — M-06).
4. Return to Case Detail.

---

## 5. AST Audit overlay

Triggered by "View Audit" on an AST Run row. Side panel slides in from the right showing:

```
┌─ AST Run #1 Audit ───────────────────────────────────────────────────────────┐
│                                                                              │
│  Run setup:                                                                  │
│  2026-05-12 07:54  Olivia  · Panel: GN-STD · Method: VITEK 2                │
│                       Breakpoint: EUCAST v14.0 · Lot: AST-GN-26-04-117      │
│                                                                              │
│  Result ingest:                                                              │
│  2026-05-12 11:45  Analyzer auto · 16 antibiotics                           │
│                                                                              │
│  Overrides:                                                                  │
│  2026-05-12 12:03  Olivia  · Ceftriaxone: R → R (ESBL flag, justification)  │
│  2026-05-12 14:55  Dr. Adeyemi  · Gentamicin: S → R (ESBL cascade)         │
│                                                                              │
│  Reading history per antibiotic (expand to see all):                         │
│  Ceftriaxone:                                                                │
│    R (OVERRIDE, 2026-05-12 12:03, ESBL flag)                                │
│    R (ANALYZER, 2026-05-12 11:45, EUCAST v14.0, MIC 16)                     │
│  Gentamicin:                                                                 │
│    R (OVERRIDE, 2026-05-12 14:55, cascade rule, justification)              │
│    S (ANALYZER, 2026-05-12 11:45, EUCAST v14.0, MIC 4)                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Audit is read-only. Reverts are done from the main AST Edit modal (supervisor selects the override row, clicks revert, provides justification).

---

## 6. Manual entry workflow

For method = MANUAL or DISK_DIFFUSION, the workflow differs:

- AST Setup writes the AST Run with `status = PENDING_SETUP`.
- Tech opens AST Edit and manually types each antibiotic's MIC value (for broth) or zone diameter (for disk).
- Frontend calls BreakpointLookupService on each input change; auto-fills the Interp dropdown.
- Tech can override Interp directly (e.g., for "no breakpoint" antibiotics where the lab has a local SOP).
- Tech saves; AST Run `status` → COMPLETE.

---

## 7. Override conventions

### 7.1 Override types

| Type | Source | Trigger |
|------|--------|---------|
| Manual override | `source = OVERRIDE`, `rule_id = NULL` | Tech / supervisor selects Override checkbox in AST Edit modal |
| Expert rule override (Phase 1B) | `source = OVERRIDE`, `rule_id = <rule>`, `rule_version = <version>` | Expert Rules Engine applies on AST Run state change |
| Revert | Existing override row marked `reverted_at` | Supervisor reverts an existing override |

### 7.2 Original-value preservation

The original ANALYZER or MANUAL reading is never deleted. The result row carries an immutable readings list; OVERRIDE is added as a new reading, not a replacement. The "current" value displayed is the most recent reading; the audit shows all readings.

### 7.3 Override permissions

- `micro.ast.override` required to apply an override.
- `micro.report.final` required to revert an override (supervisor-level decision).

---

## 8. Acceptance criteria

- **AC-M05-01**: AST Setup modal validates all required fields including reagent lot.
- **AC-M05-02**: AST Setup snapshots panel_version and breakpoint_version into the AST Run.
- **AC-M05-03**: Card ID format validates per analyzer profile regex.
- **AC-M05-04**: Reagent lot validation rejects locked or expired lots.
- **AC-M05-05**: AST Run creation transitions Case from ORGANISM_ID to AST_IN_PROGRESS.
- **AC-M05-06**: Pre-populated `result` rows match the AST Panel's antibiotic list.
- **AC-M05-07**: BreakpointLookupService called on each MIC / zone input; correct precedence applied.
- **AC-M05-08**: Interpretation computed correctly for MIC (LE comparator) and disk diffusion (GE comparator).
- **AC-M05-09**: "No breakpoint match" displays prompt for manual interpretation.
- **AC-M05-10**: Override checkbox toggles inline override entry inline below the row (not in Accordion, per memory).
- **AC-M05-11**: Override save writes `micro_ast_override` row preserving original value.
- **AC-M05-12**: AST Run status transitions: PENDING_SETUP → IN_PROGRESS (manual entry started) → COMPLETE (all rows have interpretation).
- **AC-M05-13**: Analyzer-ingested results write OVERRIDE-able results via the multi-reading mechanism.
- **AC-M05-14**: Apply Defaults re-interprets all rows against the current breakpoint standard.
- **AC-M05-15**: AST QC fail blocks save until invalidated or supervisor-overridden.
- **AC-M05-16**: Audit overlay displays all reading history per antibiotic.
- **AC-M05-17**: NFR-02 (scale, < 1s panel render with 16 antibiotics).
- **AC-M05-18**: NFR-04 (a11y) — all interactions keyboard-reachable.
- **AC-M05-19**: NFR-08 (security) — all overrides require permission server-side.

---

## 9. i18n keys

Estimated 60-80 keys. Examples:

```
micro.ast.setup.modal.title                    "Set up AST — {{isolateLabel}}"
micro.ast.setup.field.panel.label              "AST Panel"
micro.ast.setup.field.panel.helper.organismDefault "Default for {{organism}} + {{specimen}} specimen. Override if needed."
micro.ast.setup.field.method.label             "Method"
micro.ast.setup.field.method.option.vitek2     "VITEK 2"
micro.ast.setup.field.method.option.phoenix    "BD Phoenix"
micro.ast.setup.field.method.option.sensititre "Sensititre"
micro.ast.setup.field.method.option.disk       "Disk diffusion"
micro.ast.setup.field.method.option.etest      "Etest"
micro.ast.setup.field.method.option.broth      "Broth microdilution"
micro.ast.setup.field.method.option.manual     "Manual"
micro.ast.setup.field.cardId.label             "Analyzer Card ID"
micro.ast.setup.field.cardId.helper            "Scan or enter the card barcode"
micro.ast.setup.field.standard.label           "Breakpoint Standard"
micro.ast.setup.field.standard.activeHint      "(active)"
micro.ast.setup.field.lot.label                "Reagent Lot"
micro.ast.setup.field.lot.helper               "Filter to unlocked, unexpired lots only"
micro.ast.setup.error.lotLocked                "Reagent lot is locked by QC"
micro.ast.setup.error.lotExpired               "Reagent lot expired on {{date}}"
micro.ast.edit.modal.title                     "Edit AST — {{isolateLabel}} — Run #{{runNumber}}"
micro.ast.edit.header.panel                    "Panel"
micro.ast.edit.header.method                   "Method"
micro.ast.edit.header.card                     "Card"
micro.ast.edit.header.breakpoint               "Breakpoint"
micro.ast.edit.header.lot                      "Lot"
micro.ast.edit.header.status                   "Status"
micro.ast.edit.action.importAnalyzer           "Import from Analyzer"
micro.ast.edit.action.applyDefaults            "Apply Defaults"
micro.ast.edit.action.clearAll                 "Clear All"
micro.ast.edit.table.column.antibiotic         "Antibiotic"
micro.ast.edit.table.column.mic                "MIC"
micro.ast.edit.table.column.zone               "Zone"
micro.ast.edit.table.column.interp             "Interp"
micro.ast.edit.table.column.override           "Override?"
micro.ast.edit.table.column.source             "Source"
micro.ast.edit.interp.S                        "S"
micro.ast.edit.interp.I                        "I"
micro.ast.edit.interp.R                        "R"
micro.ast.edit.interp.NS                       "NS"
micro.ast.edit.interp.SDD                      "SDD"
micro.ast.edit.interp.noBreakpoint             "No breakpoint"
micro.ast.edit.source.analyzer                 "ANALYZER"
micro.ast.edit.source.manual                   "MANUAL"
micro.ast.edit.source.override                 "OVERRIDE"
micro.ast.edit.override.title                  "Override on {{antibiotic}}"
micro.ast.edit.override.original               "Original"
micro.ast.edit.override.newInterp              "New interpretation"
micro.ast.edit.override.justification.label    "Justification"
micro.ast.edit.override.justification.required "Justification required for overrides"
micro.ast.edit.generalComments.label           "General AST Comments"
micro.ast.edit.qcFailed.banner                 "QC organism on this card failed. Results cannot be released. Re-run AST against fresh card."
micro.ast.audit.title                          "AST Run #{{runNumber}} Audit"
micro.ast.audit.section.setup                  "Run setup"
micro.ast.audit.section.ingest                 "Result ingest"
micro.ast.audit.section.overrides              "Overrides"
micro.ast.audit.section.readingHistory         "Reading history per antibiotic"
... (further keys at implementation)
```

---

## 10. Open verification items

- Confirm `result` table's multi-reading extension mechanism specifics (per crosswalk Q2 verification).
- Confirm `qc_lot` table's reagent linkage path (per M-12 dependency).
- Confirm analyzer profile pattern for card ID regex (per crosswalk Q3 verification).

---

## 11. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (invokes M-05 modals; consumes AST Runs)
- M-02 Breakpoint Catalog (`BreakpointLookupService`)
- M-01 AMR Reference Data (AST Panel, Antibiotic Master)
- M-06 Expert Rules Engine (Phase 1B; uses override substrate)
- M-08 Macro Library (`ast` category)
- M-12 Test → Reagent Linkage (reagent_lot_id)
- `amr-crosswalk-working.md` Q2 (AST results data model)
- `amr-micro-narrative-v1-for-devs.md` Phase 3 + 4
