# M-07 Microbiology Worklist — Functional Requirements Specification

**Version:** 2.0 (consolidated — supersedes m-07-worklists.md and folds in all AMR-review decisions)
**Date:** 2026-06-05
**Module:** Microbiology → Worklist
**Routes:** `/microbiology/worklist`, `/microbiology/case-search`
**Phase:** MVP-1A (with Phase-1B items marked)
**Status:** Draft
**Mockup:** `m-07-worklists-prototype.html` (single canonical mockup)

> This FRS is self-contained. There is no separate addendum — every decision from the design review (shared queue / no ownership, single page, culture·AST grain toggle, automatic analyzer ingest, folded-in resistance + activity) is written inline below.

---

## 1. Lab Context

**Current State.** In a small clinical lab, microbiology cultures are tracked on paper logs, whiteboards, or a spreadsheet: which specimens are incubating, which bottles flagged positive overnight, which isolates still need identification, which susceptibility (AST = Antimicrobial Susceptibility Testing) runs are finished. Whoever is on shift scans those logs each morning and works down them.

**Pain.** The log doesn't tell you *what needs doing right now* — a tech reads every row to find the one positive blood culture that needs subculturing today, and a STAT case can sit unnoticed between the routine ones. Because a workup runs for days to weeks and staff rotate by shift, "whose case is this" is meaningless — the person who set it up is rarely the one on the bench when it's ready. AST results printed from the instrument get hand-copied, and there's no single place that shows "these three cases are waiting on me before lunch."

**What Changes.** One shared **Worklist** page replaces the paper log: a live, state-filtered queue sorted by urgency (STAT first, then longest-waiting). Whoever is on shift works the top of the list — no case is "owned." Positive signals and finished AST runs appear automatically from the instruments (no manual import, no transcription). Clicking any row opens the case to work it up. The same page carries a small resistance-hit strip and a recent-activity panel, so a supervisor's glance and a tech's queue are the same screen.

---

## 2. Overview

### 2.1 Purpose
A single operational surface — the **Worklist** — that shows every in-flight microbiology case by *what it needs next*, and routes the user into the Case Workbench (M-04) to act. It is read-mostly: it displays and navigates; the actual work happens in the case.

### 2.2 Navigation & URL
- **SideNav:** `Microbiology → Worklist` (default landing for micro), and `Microbiology → Case Search`. **No separate Dashboard item** — the former dashboard's content is folded into the Worklist page (§5).
- **Breadcrumb:** `Home / Microbiology / Worklist`.
- **URL:** `/microbiology/worklist` (deep-linkable; the grain and active filter may be encoded as query params, e.g. `?grain=ast&status=ready`). Case Search: `/microbiology/case-search`.

### 2.3 Users
| Role | Use |
|------|-----|
| Microbiology Technician | Primary — works the queue, opens cases to act |
| Microbiology Supervisor | Same queue; also reads the resistance strip / activity |
| Lab Manager | Glance at counts, resistance hits, recent activity |

### 2.4 Integration
- **M-04 Case Workbench** — the Worklist is a read-mostly projection of `micro_case` / `micro_isolate` / `micro_ast_run`; every row opens a case. No data is created here.
- **M-05 AST** — the AST grain shows AST runs; the row menu's "Edit AST" opens the M-05 modal.
- **M-04 analyzer event channel** — positive signals and AST results arrive automatically (§4.4); nothing is manually imported on this page.
- **M-09 WHONET export** (Phase 1B) — an "Export to WHONET" action appears on the AST grain, disabled until 1B.

---

## 3. User Stories
- As a tech starting a shift, I want one list of what needs doing now, sorted by urgency, so I don't read every row to find the STAT positive.
- As a tech, I want to pick up whatever is ready regardless of who set it up, because cases aren't owned and staff rotate.
- As a tech, I want analyzer results to just appear on the case, so I never import or transcribe a run.
- As a supervisor, I want today's resistance hits and recent activity on the same page, so a glance and the work queue are one screen.

---

## 4. The Worklist

### 4.1 One page, two grains
The Worklist is a single page with a **grain toggle**:
- **Cultures** (default) — one row per case/specimen. Columns: Lab #, Patient, Specimen, Stage, **Due action**, Priority, Last activity by, (row menu).
- **AST runs** — one row per isolate-run (a case may have several). Columns: Lab #, Isolate, Patient, Organism, Panel, Status, Flags *(Phase 1B)*, Started, Priority, (row menu).

The two grains exist only because the unit of work differs (case vs. isolate-run); they are **not** separate modules or pages.

**Sibling cases on one specimen (shared `SampleItem`).** When one specimen drives two workflows (bacterial + TB on one sputum — M-04 §2A), there are **two case rows** in the Cultures grain, each with its own stage/due-action (their lifecycles differ — bacterial done in days, TB running weeks). To keep them legible they are **visually grouped**: rows sharing a `sample_item_id` show a small **"⛓ linked · 2 workflows"** marker and a workflow tag (🧫 Bacteriology / 🫁 TB), and may be displayed adjacently (grouped by specimen) when sorted by specimen. They are **not** merged into one row — each is worked independently — but the grouping + the M-04 §4.1a sibling chip make the shared specimen obvious so a tech doesn't treat them as unrelated. The grouping is computed from `sample_item_id`; no new field.

### 4.2 Shared, state-driven queue — no per-case ownership
There is no case "owner." The queue is organized by **state and urgency**, not by person:
- **Needs-action summary cards** filter the list. Cultures: Total · Incubating · Positive · Growth detected · Ready to finalize. AST: In queue · Pending setup · In progress · **Results in — review** · (Expert flags — 1B, disabled).
- **New analyzer results flag.** When an AST run lands as `RESULTS_IN` (analyzer pushed results, not yet reviewed — M-05 §5.3), the case carries a **"● results in"** badge on its culture row and is counted in the AST grain's **Results in — review** card, so whoever's on shift sees that results arrived and need review/accept. The flag clears when the run is accepted.
- **Default sort = urgency:** STAT first, then by stage urgency (positive/ready highest), then longest-waiting.
- **Accountability is per-action, not per-case:** the "Last activity by" column reflects who last acted; full attribution lives on the case (`inoculated_by`, `event_by`, AST entered/overridden by, `*_released_by`) + audit_trail. `micro_case.assigned_tech_user_id` remains in the schema but **nullable and unused by default** (optional opt-in assignment behind a config flag for larger/structured labs only).
- **Optional transient lock** (recommended): a short-lived, auto-released "being worked" indicator to prevent two techs double-entering the same positive simultaneously — concurrency safety, not ownership.

### 4.3 Due-action column (deterministic)
Computed from case stage so the recommendation is consistent, not free-text:

| Stage | Due action | Detail line |
|------|-----------|-------------|
| INCUBATING | Incubating | Day _n_ of _max_ |
| POSITIVE | Subculture & Gram stain | flagged positive |
| GROWTH | Add / identify isolate | colonies visible |
| ORGANISM_ID | ID in progress — set up AST | identifying |
| AST | Review AST results | card loaded |
| READY | Review & release final | all AST complete |

Fallback when `inoculated_at` or protocol max-day is null: show the stage label with no day count.

### 4.4 Analyzer results arrive automatically — no manual import
Positive signals and AST results are pushed by the instruments through the M-04 event channel (`POSITIVE_SIGNAL`, `AST_RESULT_AVAILABLE`), write their rows, and appear on the case and in results. **There is no "Import from analyzer" button on the Worklist or in AST entry.** The AST grain states this and shows an "awaiting analyzer results" state on runs that haven't returned. The only manual path for a push that fails to match is **Admin → Stuck analyzer events** (M-04 reconciliation), not a worklist action.

### 4.5 Row interaction & actions
- **Click a row** → open the case (Cultures → Case Detail; AST → Case Detail with the AST run expanded).
- **Row overflow menu** (Cultures): Open case · Mark positive · Mark no growth · Mark lost. (AST): Open case · Edit AST (M-05) · View audit · Set up new AST run.
- **Page actions** (AST grain): Print list; QC dashboard; Export to WHONET *(1B, disabled with tooltip)*. **No import action.**
- **Auto-refresh** every 30s with a "updated _n_s ago" chip; new positive rows briefly flash.
- **Empty states:** each grain/filter shows a clear empty state with guidance (e.g. "No cultures match — clear the search or pick a different card").

---

## 5. Folded-in panels (former Dashboard)
The standalone dashboard was thin and largely re-stated the worklist's own cards, so its content lives on the Worklist page:
- **Today's resistance hits** — a compact strip (ESBL / MRSA / CRE / VRE / MDR). Phase 1A shows manual-override counts; Phase 1B populates from the Expert Rules engine (M-06).
- **Recent activity** — a collapsible panel (last ~25 timeline events across cases), for situational awareness.
- The needs-action summary cards already provide the at-a-glance counts a dashboard would.

A dedicated read-only manager dashboard MAY return later as an optional view if a larger deployment needs it; it is not a core surface in MVP-1A.

---

## 6. Case Search
A separate, simple search across all cases (open and closed) by lab number, patient, organism, or date range, at `/microbiology/case-search`. Distinct from the Worklist (which is the in-flight operational queue). Detailed spec deferred; route reserved.

---

## 7. Data
Read-only over existing entities (`micro_case`, `micro_isolate`, `micro_ast_run`, timeline events) — **no new tables or fields** introduced by this FRS. `assigned_tech_user_id` is consumed only when the optional assignment flag is on.

## 8. Permissions & Audit
- **Access:** `micro.case.view` (Analyst/Validator/Manager bundles). The Worklist is read-only; state-changing actions are performed in the case (M-04) and audited there.
- **No audit on reads.** No new audit events originate on this page.

## 9. Non-functional
- Worklist (200 rows) renders < 2 s; filter/sort < 300 ms (NFR-02). Auto-refresh must not lose scroll/focus. WCAG 2.1 AA (NFR-04): cards and rows keyboard-navigable; status conveyed by text + colour, not colour alone.

## 10. i18n keys (pattern `micro.worklist.*`)
```
micro.worklist.title                         "Worklist"
micro.worklist.grain.cultures                "Cultures"
micro.worklist.grain.ast                     "AST runs"
micro.worklist.card.total                    "Total pending"
micro.worklist.card.incubating               "Incubating"
micro.worklist.card.positive                 "Positive"
micro.worklist.card.growth                   "Growth detected"
micro.worklist.card.ready                    "Ready to finalize"
micro.worklist.col.dueAction                 "Due action"
micro.worklist.col.lastActivity              "Last activity by"
micro.worklist.due.incubating                "Incubating"
micro.worklist.due.positive                  "Subculture & Gram stain"
micro.worklist.due.growth                    "Add / identify isolate"
micro.worklist.due.organismId                "ID in progress — set up AST"
micro.worklist.due.ast                       "Review AST results"
micro.worklist.due.ready                     "Review & release final"
micro.worklist.ast.awaitingResults           "Awaiting analyzer results"
micro.worklist.panel.resistanceHits          "Today's resistance hits"
micro.worklist.panel.recentActivity          "Recent activity"
micro.worklist.empty.cultures                "No cultures match. Clear the search or pick a different card."
micro.worklist.export.whonet.phase1b         "Export to WHONET (Phase 1B)"
... (further keys as implemented)
```

## 11. Acceptance criteria
- **AC-M07-01**: One Worklist page with a Cultures/AST grain toggle; no separate Dashboard or AST module in the SideNav.
- **AC-M07-02**: No "My cases only" filter and no case-owner column; default sort is urgency (STAT → stage urgency → longest-waiting).
- **AC-M07-03**: Needs-action summary cards filter the list per grain.
- **AC-M07-04**: Due-action column follows the §4.3 stage mapping deterministically, with the null fallback.
- **AC-M07-05**: No "Import from analyzer" action anywhere on the page; AST runs without results show "awaiting analyzer results."
- **AC-M07-06**: Clicking a row opens the case (AST grain opens with the run expanded); row overflow actions per §4.5.
- **AC-M07-07**: Resistance-hit strip and collapsible recent-activity panel render on the Worklist; summary cards provide the counts.
- **AC-M07-08**: Phase-1B controls (Expert-flags card, Export to WHONET) render disabled with a tooltip in 1A.
- **AC-M07-09**: Empty states present for every grain/filter; auto-refresh preserves focus/scroll.
- **AC-M07-10**: Read-only — no `micro_*` writes originate here; `micro.case.view` enforced.

## 12. References
- M-04 Case Workbench Core (the surface every row opens; analyzer event channel; stuck-events admin)
- M-05 AST Entry (AST grain row → Edit AST)
- M-06 Expert Rules (Phase 1B — resistance hits, expert-flags column)
- M-09 WHONET Export (Phase 1B — export action)
- M-00 Parent (shared-queue principle; glossary)
- Mockup: `m-07-worklists-prototype.html`
