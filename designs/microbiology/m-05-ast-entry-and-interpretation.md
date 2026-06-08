# M-05 AST Entry & Interpretation — Functional Requirements Specification

**Version:** 2.0 (consolidated — inline interactions per Principle 3; folds in the design-review/`/analyze` decisions; no separate addendum)
**Date:** 2026-06-05
**Module:** Microbiology → Case Workbench → AST (inline within M-04)
**Surfaces:** inline panels within Case Detail (`/microbiology/case/:caseId`) and the Worklist AST grain (M-07)
**Phase:** MVP-1A + Phase 1A+ (analyzer ingest)
**Status:** Draft
**Mockup:** `m-05-ast-entry-prototype.html` (inline, supersedes the modal mock)

> Self-contained. Key decisions written inline: **AST setup and entry are inline section/row expansions, not modal pop-ups** (constitution Principle 3); **breakpoint standard is flexibly selectable per run and snapshotted**; **analyzer results ingest automatically — no manual import**; overrides preserve the original reading with inline revert + reading history; "no breakpoint" and QC-fail states are guided.

---

## 1. Lab Context
**Current State.** After an organism is identified, the tech sets up susceptibility testing — picks the antibiotic panel, runs it (disk diffusion read by eye, or an instrument like VITEK/Phoenix), and records each drug's MIC or zone and whether the organism is Susceptible / Intermediate / Resistant (S/I/R). Today those S/I/R calls are looked up by hand against CLSI or EUCAST breakpoint tables and transcribed from instrument printouts.

**Pain.** Hand-looking-up breakpoints for 16+ drugs per isolate is slow and error-prone; transcription introduces mistakes caught late; and when the lab corrects an interpretation (e.g. an ESBL makes you report a cephalosporin R regardless of MIC), there's no clean record of the original value, who changed it, or why.

**What Changes.** AST is done **inline on the case**: set up the run, and as MIC/zone values are entered (or pushed by the analyzer) the system interprets S/I/R against the chosen breakpoint standard automatically. Overrides are an inline row that **keeps the original value**, captures a reason, and is revertible. No hand lookups, no transcription, full audit.

---

## 2. Overview
Three workflows, one data shape: **Manual** (tech types MIC/zone), **Analyzer** (instrument pushes results), **Hybrid** (analyzer lands, tech reviews/overrides). Each produces a `micro_ast_run` header + per-antibiotic rows in the existing `result` table (multi-reading), interpreted by the `BreakpointLookupService`.

### 2.1 Surfaces (inline, not modals)
- **AST setup** and **AST entry/results** render as **inline panels within the Case Detail AST section** (M-04 §4.5), and are reachable from the Worklist AST grain (M-07). Per Principle 3 there are **no pop-up modals**; the only inline-row expansion is the per-drug override. Modals are reserved for destructive confirmations (e.g. Clear All).

### 2.2 Integration
M-01 (panels, antibiotics) · M-02 (`BreakpointLookupService`, breakpoint standards) · M-04 (case/isolate context, AST section, analyzer event channel) · M-06 (Phase 1B expert rules use this override substrate) · M-08 (macro-enabled justification/comments) · M-12 (reagent/card lot, FIFO).

### 2.3 Users
Tech — set up, enter, override with justification. Supervisor — all of that + review/revert overrides + override a QC-fail flag.

---

## 3. Data model
```
micro_ast_run
├── ast_run_id (PK)
├── isolate_id (FK)
├── ast_panel_id (FK) + panel_version (snapshot)
├── method (enum: VITEK2, PHOENIX, DISK_DIFFUSION, ETEST, MANUAL_BROTH, …)
├── breakpoint_standard_id (FK) + breakpoint_version (snapshot)   ← chosen at setup (§4)
├── analyzer_card_id (text, nullable; scanned or from instrument link)
├── reagent_lot_id (FK via M-12)
├── status (PENDING_SETUP, IN_PROGRESS, READING, COMPLETE, QC_FAILED, RERUN_REQUIRED, INVALIDATED)
└── audit columns                                              (Envers @Audited)

result (existing OE table, extended via multi-reading)
├── micro_ast_run_id (FK, nullable — set only for AST results)
├── antibiotic_id (FK)
├── readings[]  (existing multi-reading mechanism)
│     ├── mic / zone (numeric, nullable)
│     ├── interpretation (S/I/R, nullable)
│     ├── source (ANALYZER_AUTO, MANUAL_ENTRY, OVERRIDE)
│     └── matched_by (ORGANISM / GROUP / SPECIMEN / NONE)  — interpretation provenance
└── (current reading = latest; OVERRIDE supersedes for display/report)

micro_ast_override (audit)
├── override_id (PK) · result_id (FK) · reading_id (FK)
├── original_interpretation, override_interpretation
├── original_mic/zone, override_mic/zone (nullable)
├── rule_id (FK expert_rule_definition, nullable — null = manual)
├── justification (text, macro `ast`) · overridden_by · overridden_at
└── reverted_by, reverted_at (nullable)                       (Envers @Audited)
```
**No new masters** — reuses the existing `result`/multi-reading mechanism and M-01/M-02/M-12 references.

---

## 4. AST setup (inline panel)
Triggered by **Set up AST** on an identified isolate (disabled until `organism_id` is set). Fields:

| Field | Control | Notes |
|---|---|---|
| AST panel | ComboBox (M-01), defaulted from `isolate.default_ast_panel_id` | "Default for {organism} + {specimen}. Override if needed." |
| Method | Radio/select | VITEK 2 / Phoenix / Disk diffusion / Etest / Manual broth |
| **Breakpoint standard** | ComboBox (M-02) | **Defaults to the lab's active standard, but any *loaded* standard/version is selectable per run** (CLSI or EUCAST; some labs mix by organism group or pin an older version during a transition). **Snapshotted** on the run — switching the lab default later never changes this run. Loaded/active set managed in M-02. |
| Card / disc lot | ReagentLotPicker (M-12) | **FIFO** (oldest-expiry first), QC status shown, expired/locked blocked — same as results-entry reagent selection. |
| Analyzer card ID | scan-or-type | Captured from the instrument link or **scanned**. |

On save: write `micro_ast_run` (`status = PENDING_SETUP`, snapshotted standard/version + panel/version), pre-populate `result` rows for each panel antibiotic (`interpretation = null`), write an `AST_SETUP` Timeline event (M-04), transition the case to AST_IN_PROGRESS.

---

## 5. AST entry & results (inline)
The run renders as an inline table in the case AST section: **Antibiotic · MIC · Zone · Interp · Source · (override)**. Run header shows panel · method · breakpoint standard · lot · status, and the **matched-breakpoint level** per the lookup.

### 5.1 Interpretation
On MIC/zone change, the frontend calls `BreakpointLookupService.lookup(organism_id, antibiotic_id, method, breakpoint_standard_id, specimen_type_id)` → thresholds + `matched_by`. The interpretation auto-fills and the **matched level (specimen-specific → organism → group → none)** is shown so the user trusts the result.
- **No breakpoint (`matched_by = NONE`):** the Interp field becomes a manual select with a **"no standard breakpoint — interpret per local SOP"** guidance note (not just an empty enabled dropdown).

### 5.2 Override — inline row, preserves original, revertible
Selecting a row's **Override** toggles an **inline override row directly beneath it** (not a modal, not an accordion): new interpretation + **justification** (macro `ast`, required). On save: a new `OVERRIDE` reading is appended (original ANALYZER/MANUAL reading is **never deleted**), a `micro_ast_override` audit row records original→override + who/when/why, and the row's current interpretation becomes the override. The overridden row offers **"show original"** (inline reading history: original→override, rule if any, actor, time) and a **Revert to original/analyzer value** action (supervisor/`micro.ast.override`, with justification).

### 5.3 Analyzer results — automatic, no manual import
Analyzer results arrive via the M-04 event channel (`AST_RESULT_AVAILABLE`), populate the readings (`source = ANALYZER_AUTO`), and the run flips to COMPLETE — **automatically**. A run still awaiting results shows an **"awaiting analyzer results"** state. There is **no "Import from analyzer" button**; a push that fails to match is reconciled on **Admin → Stuck analyzer events** (M-04). The tech may still override any analyzer row inline.

### 5.4 Toolbar actions
- **Apply Defaults** — re-run the lookup against the current standard for every row (e.g. after the lab changes its active standard). 
- **Clear All** — destructive; the one place a **confirmation modal** is used; writes an audit row.
- (No "Import from analyzer" action — see §5.3.)

### 5.5 QC-fail handling
On an `AST_QC_FAIL` event the run shows a **banner** and disables save, with explicit inline actions: **Invalidate & start a new AST run**, and (supervisor) **Override QC flag** with justification. (No silent dead-end.)

---

## 6. Override conventions, audit, permissions
Original-value preservation is mandatory (§5.2). Override types: manual (rule_id null) and expert-rule (M-06, Phase 1B). **Permissions** (existing bundles, no per-action keys): enter results — Analyst; override / revert — `micro.ast.override` (supervisor); QC-flag override — supervisor. Every override/revert/QC action is audited (`micro_ast_override` + `audit_trail`); `micro_ast_run` and the override table are `@Audited` (Envers).

---

## 7. Acceptance criteria
- **AC-M05-01**: AST setup and entry are **inline panels/rows, not modals** (Principle 3); the only modal is the Clear-All confirmation.
- **AC-M05-02**: Setup snapshots panel/version + breakpoint standard/version; **breakpoint standard is selectable per run** (defaults to active; any loaded standard/version) and a later change to the lab default does not alter historical runs.
- **AC-M05-03**: MIC/zone entry auto-interprets via `BreakpointLookupService`; the matched level is shown; `matched_by = NONE` gives manual select + local-SOP guidance.
- **AC-M05-04**: Override is an inline row requiring justification; original reading preserved; `micro_ast_override` written; **revert** available to supervisors; inline reading-history ("show original") present.
- **AC-M05-05**: Analyzer results ingest automatically (no manual import); awaiting-results state shown; unmatched pushes go to the stuck-events admin page.
- **AC-M05-06**: Card/disc lot uses FIFO + QC like results-entry; card ID scannable; expired/locked lots blocked (M-12).
- **AC-M05-07**: QC-fail shows a banner with Invalidate-&-start-new and supervisor QC-override (justified); save blocked until resolved.
- **AC-M05-08**: All override/revert/QC actions audited; entities `@Audited`.

## 8. i18n keys (pattern `micro.ast.*`)
~60–80 keys: setup field labels + helpers, breakpoint-standard helper, table headers, interp values, matched-level labels, no-breakpoint guidance, override fields + revert, awaiting-results, QC-fail banner + actions, Apply-Defaults / Clear-All, error strings. (Maintained with implementation.)

## 9. References
M-01 (panels/antibiotics) · M-02 (BreakpointLookupService, standards, flexibility) · M-04 §4.5/§7 (AST section, analyzer channel, stuck-events) · M-06 (Phase 1B override substrate) · M-08 (macros) · M-12 (reagent FIFO) · OGC-312/813 (NCE/disposition reuse, for the rejection family) · `m-05-ast-entry-prototype.html`.
