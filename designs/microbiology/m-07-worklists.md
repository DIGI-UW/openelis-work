# M-07 Microbiology Worklists — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology → Worklists
**Phase:** 1A (Pending Cultures + AST Worklist core); Dashboard slippable to 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the three list-view surfaces in the Micro Module: Pending Cultures Worklist, AST Worklist, and Microbiology Dashboard. All three are read-mostly views over data owned by M-04 (Case + Isolate + AST Run state). Per memory `feedback_openelis_sidenav_submenus`, these are sidenav submenu items under Microbiology — not in-page tabs.

---

## 1. Overview

### 1.1 Purpose

The worklist surfaces support three distinct workflows:

- **Pending Cultures Worklist** — primary tech surface for incubation tracking, plate reading, subculture decisions. Used during morning rounds.
- **AST Worklist** — primary tech surface for AST setup, reading, and post-run flag handling.
- **Microbiology Dashboard** — manager / supervisor surface for at-a-glance state across all open cases.

Each view's design follows the same pattern: summary cards at top, filter bar, paginated DataTable below.

### 1.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Pending Cultures Worklist | `/microbiology/pending-cultures` | Microbiology → Pending Cultures |
| AST Worklist | `/microbiology/ast-worklist` | Microbiology → AST Worklist |
| Microbiology Dashboard | `/microbiology/dashboard` | Microbiology → Dashboard |
| Case Search | `/microbiology/case-search` | Microbiology → Case Search |

### 1.3 Users

| Role | Primary view |
|------|--------------|
| Microbiology Technician | Pending Cultures + AST Worklist |
| Microbiology Supervisor | All three |
| Lab Manager | Dashboard (overview), all three available |
| Medical Technologist | AST Worklist (focused on instrument interactions) |

### 1.4 Integration

- **M-04 Case Workbench Core** — primary data source. Worklists query `micro_case`, `micro_isolate`, `micro_ast_run` state.
- **M-08 Macro Library** — N/A (worklists are read-only views).
- **M-09 WHONET Export** (Phase 1B) — AST Worklist "Export WHONET" quick action.

---

## 2. Pending Cultures Worklist

### 2.1 Purpose

Show all Cases that have been inoculated but not yet finalized. Tech opens this first thing in the morning and works through each row.

### 2.2 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Microbiology / Pending Cultures                                              │
│ Pending Cultures                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Total    │ │ Incubat- │ │ Positive │ │ Growth   │ │ Ready to │          │
│  │ Pending  │ │ ing      │ │ (Action) │ │ Detected │ │ Finalize │          │
│  │   12     │ │    7     │ │    2     │ │    2     │ │    1     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [Search lab# or patient...]   Stage: [All ▼]  Specimen: [All ▼]      │  │
│  │ Tech: [All ▼]  ☐ My Cases Only                  [Refresh]            │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Lab No / Patient   │ Specimen │ Protocol  │ Stage          │ Bottles/ │  │
│  │                    │          │           │                │ Media    │  │
│  ├────────────────────┼──────────┼───────────┼────────────────┼──────────┤  │
│  │ BC24-0892          │ Blood    │ BC-STD    │ ⚠ POSITIVE     │ FA24012, │  │
│  │ MARTINEZ, Carlos   │ R Antec. │           │ Subculture     │ FN24012  │  │
│  │ MC-2024-001234     │          │           │                │          │  │
│  ├────────────────────┼──────────┼───────────┼────────────────┼──────────┤  │
│  │ BC24-0891          │ Blood    │ BC-STD    │ INCUBATING     │ FA24011, │  │
│  │ JOHNSON, Mary      │ L Antec. │           │ Day 2 of 5     │ FN24011  │  │
│  │ MC-2024-001233     │          │           │                │          │  │
│  ├────────────────────┼──────────┼───────────┼────────────────┼──────────┤  │
│  │ UC24-0455          │ Urine    │ UR-RTN    │ GROWTH         │ BAP, MAC │  │
│  │ SMITH, Jane        │ Midstr.  │           │ Isolate workup │          │  │
│  │ MC-2024-001230     │          │           │                │          │  │
│  └────────────────────┴──────────┴───────────┴────────────────┴──────────┘  │
│                                                                              │
│  Items per page: [25 ▼]    1-25 of 35    [< 1 2 >]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Summary cards

`Tile` components in a horizontal row:

| Card | Metric | Color | Click action |
|------|--------|-------|--------------|
| Total Pending | All non-terminal Cases | Blue | Reset filters; show all |
| Incubating | Cases in INCUBATING stage | Teal | Filter to INCUBATING |
| Positive (Action) | Cases in POSITIVE_SIGNAL stage | Red | Filter to POSITIVE_SIGNAL |
| Growth Detected | Cases in GROWTH_DETECTED stage | Orange | Filter to GROWTH_DETECTED |
| Ready to Finalize | Cases at incubation end with no growth, ready to mark NO_GROWTH_FINAL | Green | Filter to those |

### 2.4 Filters

| Filter | Type | Options |
|--------|------|---------|
| Search | TextInput | Lab number or patient name (case-insensitive substring) |
| Stage | Dropdown | All, Incubating, Positive, Growth Detected, Organism ID, Ready to Finalize, AST in Progress, Ready for Review |
| Specimen | MultiSelect | Reference to active specimen types |
| Tech | Dropdown | All techs (active users with `micro.case.edit`) |
| My Cases Only | Checkbox | Filters to assigned_tech_user_id = current_user |
| Date Range | DatePicker pair | From/To request date |

### 2.5 Columns

| Column | Source | Sortable |
|--------|--------|----------|
| Lab No / Patient | `micro_case.sample_id → sample.lab_number` + Patient name + Case ID | Yes (default sort: Lab No desc) |
| Specimen | Sample type name + source | Yes |
| Protocol | culture_protocol.name | Yes |
| Stage | `micro_case.stage` rendered as Tag with color; subtitle with detail like "Day 2 of 5" computed from inoculation date + protocol.max_incubation_days | Yes |
| Bottles / Media | Comma-separated `micro_case_inoculation.bottle_or_plate_id` | No |
| Last Read | Latest timeline event timestamp | Yes |
| Due Action | Computed from stage (per table below) | No |
| Priority | From Order (URGENT / STAT / ROUTINE) | Yes |
| Tech | Assigned tech name | Yes |
| Actions | Overflow menu: Open Case · Mark Positive · Mark No Growth · Mark Lost | No |

### 2.6 Stage detail and due action

| Stage | Stage badge | Detail subtitle | Due action |
|-------|-------------|-----------------|------------|
| INOCULATING | Default gray | "In progress" | Continue setup |
| INCUBATING | Info teal | "Day N of M" computed | Monitor (no action) |
| POSITIVE_SIGNAL | Red, highlighted row | Time since signal | Subculture & Gram |
| GROWTH_DETECTED | Orange | "Isolate workup" | ID & AST setup |
| ORGANISM_ID | Teal | "ID in progress" | Continue ID |
| AST_IN_PROGRESS | Teal | "AST in progress" | Manage AST (link to AST Worklist) |
| READY_REVIEW | Green | "Awaiting supervisor" | Supervisor review |
| Ready to Finalize | Green | Incubation hours met | Mark No Growth final |

### 2.7 Row highlighting

- **POSITIVE_SIGNAL rows**: Red background tint (`bg-red-10`). Drawing attention.
- **Ready to Finalize rows**: Green background tint.
- **STAT priority rows**: Red left border (`border-l-red-60`).
- **Other rows**: Default; hover state.

### 2.8 Polling and auto-refresh

- Auto-refresh every 30 seconds (configurable per NFR-02).
- New positive signals appearing during refresh briefly flash the row (CSS transition).
- "Refresh" button manually triggers immediate refresh.

### 2.9 Click row behavior

Clicking anywhere on a row except overflow menu navigates to `/microbiology/case/:caseId`.

### 2.10 Acceptance criteria

- **AC-M07-PC-01**: List renders all non-terminal Cases for the deployment.
- **AC-M07-PC-02**: Summary cards correctly count by stage and clicking applies the filter.
- **AC-M07-PC-03**: Search filters by lab number or patient name substring.
- **AC-M07-PC-04**: Stage / specimen / tech filters reduce list appropriately.
- **AC-M07-PC-05**: My Cases Only checkbox filters to current user.
- **AC-M07-PC-06**: POSITIVE_SIGNAL rows are visually highlighted red.
- **AC-M07-PC-07**: "Day N of M" computed correctly from inoculation date + protocol max days.
- **AC-M07-PC-08**: Auto-refresh polling at 30 seconds; manual refresh button works.
- **AC-M07-PC-09**: Click row navigates to Case Detail.
- **AC-M07-PC-10**: Renders ≤ 200 rows in < 2s (NFR-02).
- **AC-M07-PC-11**: All interactions keyboard-reachable (NFR-04).

---

## 3. AST Worklist

### 3.1 Purpose

Show all AST Runs that are not yet finalized into a released report. Tech opens this to track which AST cards are loaded, which results are arriving, and which need supervisor review.

### 3.2 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Microbiology / AST Worklist                                                  │
│ AST Worklist                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Total    │ │ Pending  │ │ In       │ │ Ready    │ │ Expert   │          │
│  │ AST Tests│ │ Setup    │ │ Progress │ │ Review   │ │ Flags    │          │
│  │   14     │ │    2     │ │    5     │ │    5     │ │    3     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [Search...]  Status: [All ▼]  Panel: [All ▼]  ☐ Ready Only            │  │
│  │                                            [Import from Analyzer]      │  │
│  │                                            [Print List] [Export WHONET]│  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Lab No / Isolate │ Patient   │ Organism      │ Panel  │ Status │ Flag │  │
│  ├──────────────────┼───────────┼───────────────┼────────┼────────┼──────┤  │
│  │ BC24-0892 / 1    │ MARTINEZ  │ E. coli (eco) │ GN-STD │ Complete│ 2   │  │
│  │ Run #1           │ Carlos    │               │ VITEK 2│  ⚠      │ ESBL│  │
│  ├──────────────────┼───────────┼───────────────┼────────┼────────┼──────┤  │
│  │ UC24-0455 / 1    │ SMITH     │ E. coli (eco) │ GN-UR  │ In Prog │ —    │  │
│  │ Run #1           │ Jane      │               │ VITEK 2│         │      │  │
│  ├──────────────────┼───────────┼───────────────┼────────┼────────┼──────┤  │
│  │ WC24-0118 / 1    │ JOHNSON   │ S. aureus     │ GP-AST │ Reading │ —    │  │
│  │ Run #1           │ Mary      │ (sau)         │ Disk   │         │      │  │
│  └──────────────────┴───────────┴───────────────┴────────┴────────┴──────┘  │
│                                                                              │
│  Items per page: [25 ▼]    1-14 of 14                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Summary cards

| Card | Metric | Color |
|------|--------|-------|
| Total AST Tests | All non-finalized AST Runs | Blue |
| Pending Setup | Status PENDING_SETUP | Gray |
| In Progress | Status IN_PROGRESS or READING | Teal |
| Ready for Review | Status COMPLETE not in released report | Green |
| Expert Flags | Total count of unresolved Phase 1B flags (zero in 1A) | Orange |

### 3.4 Filters

| Filter | Type | Options |
|--------|------|---------|
| Search | TextInput | Lab number, patient name, or organism name |
| Status | Dropdown | All, Pending Setup, In Progress, Reading, Complete, QC Failed |
| Panel | Dropdown | All AST panels |
| Ready Only | Checkbox | Filters to Status COMPLETE |
| Tech | Dropdown | All techs |

### 3.5 Columns

| Column | Source |
|--------|--------|
| Lab No / Isolate | Case lab number + Isolate # + Run # |
| Patient | Patient last name + first name |
| Organism | Italicized name + WHONET code |
| Panel | AST Panel code + method |
| Status | AST Run status as Tag |
| Flags | Count + flag types (D-Test, MRSA, ESBL, Cascade applied) — Phase 1B populates |
| Started | AST Run started_at |
| Priority | From Case's Order |
| Tech | started_by user |
| Actions | Overflow menu: Open Case · Edit AST · View Audit · Set up new AST Run |

### 3.6 Row highlighting

- **QC_FAILED rows**: Red background tint.
- **Complete with flags rows**: Yellow background tint.
- **Pending Setup rows**: Default.
- **STAT priority rows**: Red left border.

### 3.7 Quick actions

| Action | Behavior |
|--------|----------|
| Import from Analyzer | Opens existing analyzer import dialog; pulls pending AST results from event channel |
| Print List | Generates a printable PDF of the current filtered worklist for paper backup |
| Export to WHONET | Phase 1B; opens M-09 export with filters pre-populated from current view |
| QC Dashboard | Navigate to QC monitoring (existing QA infrastructure) |

### 3.8 Acceptance criteria

- **AC-M07-AST-01**: List shows all non-finalized AST Runs.
- **AC-M07-AST-02**: Summary cards correctly count by status.
- **AC-M07-AST-03**: Filters work; "Ready Only" reduces to Status=COMPLETE.
- **AC-M07-AST-04**: Click row navigates to Case Detail with AST Run pre-expanded.
- **AC-M07-AST-05**: Import from Analyzer triggers event-channel pull.
- **AC-M07-AST-06**: Print List generates valid PDF.
- **AC-M07-AST-07**: Export to WHONET (Phase 1B) opens M-09 with filters applied.
- **AC-M07-AST-08**: Renders ≤ 200 rows in < 2s.
- **AC-M07-AST-09**: All interactions keyboard-reachable.

---

## 4. Microbiology Dashboard

### 4.1 Purpose

Manager / supervisor view. Aggregate state at a glance across all Cases.

### 4.2 Status note for Phase 1A

Per planning doc §6 phasing, Dashboard is **slippable from Phase 1A** if capacity tightens. Recommendation: ship in 1A; slip to 1B only if needed. Phase 1A users primarily live in Pending Cultures and AST Worklist; the Dashboard adds productivity for supervisors but doesn't gate clinical work.

### 4.3 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Home / Microbiology                                                          │
│ Microbiology Dashboard                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────┐│
│  │ Cases In Progress│ │ Awaiting Review  │ │ Positive Cultures│ │ Complete ││
│  │       12         │ │        4         │ │ (Today)          │ │ (Week)   ││
│  │                  │ │                  │ │        3         │ │    28    ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────┘│
│                                                                              │
│  Recent Activity:                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Time      │ Patient   │ Stage          │ Organism       │ Action     │  │
│  ├───────────┼───────────┼────────────────┼────────────────┼────────────┤  │
│  │ 14:55     │ MARTINEZ  │ FINAL_REPORTED │ E. coli        │ Dr. Adeyemi│  │
│  │ 14:38     │ SMITH     │ AST_IN_PROG    │ Pending        │ Olivia     │  │
│  │ 14:12     │ JOHNSON   │ READY_REVIEW   │ S. aureus      │ Olivia     │  │
│  │ 13:47     │ CHEN      │ POSITIVE_SIG   │ Pending        │ BacT/Alert │  │
│  │ 13:30     │ GARCIA    │ NO_GROWTH_FIN  │ —              │ System     │  │
│  └───────────┴───────────┴────────────────┴────────────────┴────────────┘  │
│                                                                              │
│  Today's Resistance Hits:                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 1 × ESBL E. coli (blood)                                                │  │
│  │ 1 × MRSA (wound)  [Phase 1B will surface from Expert Rules]            │  │
│  │ 0 × CRE                                                                 │  │
│  │ 0 × VRE                                                                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Summary cards

| Card | Metric | Source |
|------|--------|--------|
| Cases In Progress | Count of non-terminal Cases | `micro_case` where stage in (RECEIVED, INOCULATING, INCUBATING, POSITIVE_SIGNAL, GROWTH_DETECTED, ORGANISM_ID, AST_IN_PROGRESS) |
| Awaiting Review | Count READY_REVIEW | `micro_case` where stage = READY_REVIEW |
| Positive Cultures (Today) | Count where created_at or POSITIVE_SIGNAL transition today | Today's positive Cases |
| Complete (Week) | Count where FINAL_REPORTED in last 7 days | Recent finalizations |

### 4.5 Recent activity

Last 25 timeline events across all Cases, in reverse chronological order. Click row → Case Detail.

### 4.6 Today's Resistance Hits

Pre-Phase-1B: based on manual AST overrides marked with phenotype flag categories.
Phase 1B: surfaced from Expert Rules engine results.

Count by phenotype: ESBL, MRSA, CRE, VRE, MDR. With organism + specimen for the small list.

### 4.7 Acceptance criteria

- **AC-M07-DB-01**: Summary cards compute correctly.
- **AC-M07-DB-02**: Recent activity shows latest 25 timeline events.
- **AC-M07-DB-03**: Today's Resistance Hits accurately count phenotype flags.
- **AC-M07-DB-04**: All click actions navigate appropriately.
- **AC-M07-DB-05**: Renders in < 1.5s with realistic data volumes.

---

## 5. Case Search

### 5.1 Purpose

A search-everything surface across all Micro Cases — historical and current.

### 5.2 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Microbiology / Case Search                                                   │
│ Case Search                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [🔍 Search by lab #, patient, organism, MRN...]                            │
│                                                                              │
│  Advanced filters:                                                           │
│  Date range: [From] to [To]                                                  │
│  Stage: [Any ▼]   Organism: [Any ▼]   Antibiotic: [Any ▼]   Result: [Any ▼] │
│  Phenotype: [☐ ESBL  ☐ MRSA  ☐ CRE  ☐ VRE  ☐ MDR]                          │
│                                                                              │
│  Results (sorted by request date, newest first):                             │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ ... result rows                                                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

Returns matching Cases (paginated 25 per page). Click row → Case Detail.

### 5.3 Acceptance criteria

- **AC-M07-CS-01**: Search by lab #, patient name, organism name, MRN returns expected matches.
- **AC-M07-CS-02**: Advanced filters work in combination.
- **AC-M07-CS-03**: Date range respects index for query performance.
- **AC-M07-CS-04**: Pagination works with large result sets.

---

## 6. Permissions

| Action | Permission |
|--------|-----------|
| View Pending Cultures | `micro.worklist.view` |
| View AST Worklist | `micro.worklist.view` |
| View Dashboard | `micro.worklist.view` |
| Case Search | `micro.case.view` |

The worklist quick actions (Mark Positive, Mark No Growth, etc.) each require their corresponding `micro.case.edit` permission. Display the action but disable if missing.

---

## 7. i18n keys

Estimated 60-80 keys. Pattern:

```
micro.worklist.pending.title                "Pending Cultures"
micro.worklist.pending.summaryCard.total    "Total Pending"
micro.worklist.pending.summaryCard.incubating "Incubating"
micro.worklist.pending.summaryCard.positive "Positive (Action)"
micro.worklist.pending.summaryCard.growth   "Growth Detected"
micro.worklist.pending.summaryCard.ready    "Ready to Finalize"
micro.worklist.pending.column.labNoPatient  "Lab No / Patient"
micro.worklist.pending.column.specimen      "Specimen"
micro.worklist.pending.column.protocol      "Protocol"
micro.worklist.pending.column.stage         "Stage"
micro.worklist.pending.column.bottlesMedia  "Bottles / Media"
micro.worklist.pending.column.lastRead      "Last Read"
micro.worklist.pending.column.dueAction     "Due Action"
micro.worklist.pending.column.priority      "Priority"
micro.worklist.pending.column.tech          "Tech"
micro.worklist.pending.stage.incubating.detail "Day {{day}} of {{max}}"
micro.worklist.pending.stage.positive.detail  "{{minutes}}m since signal"
micro.worklist.pending.dueAction.subculture "Subculture & Gram"
micro.worklist.pending.dueAction.isolate    "Isolate & ID"
micro.worklist.pending.dueAction.continue   "Continue setup"
micro.worklist.pending.dueAction.monitor    "Monitor"
micro.worklist.pending.dueAction.finalize   "Mark No Growth final"
micro.worklist.pending.filter.myCases       "My Cases Only"
micro.worklist.ast.title                    "AST Worklist"
micro.worklist.ast.summaryCard.total        "Total AST Tests"
micro.worklist.ast.summaryCard.pendingSetup "Pending Setup"
micro.worklist.ast.summaryCard.inProgress   "In Progress"
micro.worklist.ast.summaryCard.readyReview  "Ready for Review"
micro.worklist.ast.summaryCard.expertFlags  "Expert Flags"
micro.worklist.ast.action.importAnalyzer    "Import from Analyzer"
micro.worklist.ast.action.printList         "Print List"
micro.worklist.ast.action.exportWhonet      "Export to WHONET"
micro.worklist.ast.action.qcDashboard       "QC Dashboard"
micro.worklist.dashboard.title              "Microbiology Dashboard"
micro.worklist.dashboard.recentActivity.title "Recent Activity"
micro.worklist.dashboard.resistanceHits.title "Today's Resistance Hits"
micro.worklist.caseSearch.title             "Case Search"
micro.worklist.caseSearch.placeholder       "Search by lab #, patient, organism, MRN..."
```

---

## 8. Open verification items

- Confirm whether OE has a shared worklist polling infrastructure to reuse (vs. building per-worklist).
- Confirm print-worklist PDF mechanism (likely reuses Jasper).

---

## 9. References

- M-00 Microbiology Module Parent Specification
- M-04 Case Workbench Core (primary data source)
- M-05 AST Entry & Interpretation (AST Run state)
- M-09 WHONET Export (Phase 1B quick action target)
- M-NFR Non-Functional Requirements (scale and a11y)
- `feedback_openelis_sidenav_submenus` (sidenav patterns)
