# QA Overview
## FRS Outline — Sprint 1 (QA Menu Roadmap)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored before Sprint 1 IA build
**Sidenav placement:** `Quality Assurance → QA Overview` (default landing for the QA menu)

---

## 1. Purpose

The QA Overview is the default landing page when a user navigates to the Quality Assurance menu. Its job is to answer, in a single view, the five questions that ISO 15189:2022 and CAP consistently expect a clinical lab to be able to answer about its own quality:

1. Are my analytical runs in control? (ISO 15189 §7.3)
2. How did we perform against our peers last PT cycle? (§7.3)
3. Are we meeting our quality indicators? (§8.8)
4. What non-conformities are open and what are we doing about them? (§8.7 / §8.9)
5. Are we accreditation-ready? (§8.x)

A QA Officer should be able to open this page once a day, scan it, and either feel reassured or know exactly which pillar to drill into. An inspector visiting the lab should be able to start here and work outward.

This page does not own analytical logic. It reads pre-computed status from each of the four pillars and presents them.

## 2. Scope

In scope:
- Five-question strip at the top of the page.
- Four pillar tiles in a 2×2 grid (Statistical QC, EQA, Quality Indicators, QMS & Improvement).
- Roll-up status from each pillar's underlying data.
- Deep-links from every question and tile into the appropriate pillar / leaf.
- Empty / partial states when a pillar is unavailable to the user (permission-gated) or has no data.
- Last-recomputed timestamp.

Out of scope:
- Configuration of any pillar's behavior (lives in pillar-specific admin pages).
- Aggregating data across multiple sites (single-site v1 per roadmap DEC03).
- User-customizable dashboards (v2 enhancement).
- A "QA at a glance" PDF export (deferred; Accreditation Binder export covers this need in v2).

## 3. Page layout

### 3.1 Top-level structure

```
Quality Assurance › QA Overview

  ┌─────────────────────────────────────────────────────────────┐
  │ Five quality questions                                       │
  │                                                              │
  │ 1. Runs in control?      ✓  47 of 47 runs in control (30d)  │
  │ 2. EQA performance?      ⚠  2 fails last PT cycle           │
  │ 3. QIs on target?        ✓  3 of 3 within target            │
  │ 4. Open NCEs?            ⚠  5 critical pending acknowledgment│
  │ 5. Accreditation?        ✓  CAP / ISO 15189: ready          │
  │                                                              │
  │                              Last recomputed: 4m ago  ↻      │
  └─────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐
  │ Statistical QC      │  │ EQA (PT)             │
  │  ✓ in control        │  │  ⚠ 2 fails last cycle│
  │  47 of 47 runs (30d) │  │  Cycle 2026-Q1       │
  │  3 sections          │  │  4 schemes active    │
  │  View Statistical QC↗│  │  View EQA Oversight↗ │
  └──────────────────────┘  └──────────────────────┘
  ┌──────────────────────┐  ┌──────────────────────┐
  │ Quality Indicators  │  │ QMS & Improvement    │
  │  ✓ all within target │  │  ⚠ 5 NCEs pending    │
  │  3 of 3 enabled QIs  │  │  3 CAPAs in progress │
  │  Window: rolling 30d │  │  Audit trail ↗       │
  │  View QI Dashboard ↗ │  │  View NCE Register ↗ │
  └──────────────────────┘  └──────────────────────┘
```

### 3.2 Five-question strip

A single vertically-stacked card at the top, prominent. Each row is one question with a status indicator and a one-line direct answer. The whole row is clickable (it deep-links to the pillar / leaf where the answer lives).

| # | Question | Status indicator source | Deep-link target |
|---|---|---|---|
| 1 | Runs in control? | Statistical QC pillar — count of runs out-of-control in the rolling 30d window | `/qa/statistical-qc/run-review` |
| 2 | EQA performance? | EQA pillar — last cycle pass/fail counts | `/qa/eqa/oversight/lab-performance` |
| 3 | QIs on target? | Quality Indicators pillar — count of enabled QIs above/within/below target | `/qa/qi/dashboard` |
| 4 | Open NCEs? | QMS pillar — count of unacknowledged or open Critical-severity NCEs | `/qa/qms/nce/all` (filtered to status=open + severity=critical) |
| 5 | Accreditation? | QMS pillar — Accreditation Status rollup | `/qa/qms/accreditation` |

Status indicators per row:
- **✓ green** — pillar is healthy on this question
- **⚠ amber** — at least one item needs attention but no action threshold breached
- **✗ red** — at least one item past action threshold or unacknowledged critical
- **— gray** — pillar disabled / no data / user lacks permission to see the answer

### 3.3 Pillar tiles

Below the question strip, four pillar tiles in a responsive 2×2 grid (or 1×4 on narrow viewports). Tile order is fixed: Statistical QC, EQA, Quality Indicators, QMS & Improvement. Tile content is more detailed than the question strip — the strip answers, the tile contextualizes.

Each pillar tile has the same shell:

```
┌──────────────────────────────────────┐
│ {Pillar name}              ⓘ         │
│                                       │
│   {primary status icon + summary}     │
│   {secondary line — counts / context} │
│   {tertiary line — supporting context}│
│                                       │
│   View {pillar landing} ↗             │
└──────────────────────────────────────┘
```

#### 3.3.1 Statistical QC tile

| Element | Source |
|---|---|
| Primary status | Worst-of: in-control vs. flagged vs. out-of-control across all sections in the rolling 30d window |
| Secondary line | "X of Y runs in control" |
| Tertiary line | "Z sections" (count of test sections with QC running) |
| Deep-link | `/qa/statistical-qc/run-review` |

#### 3.3.2 EQA (PT) tile

| Element | Source |
|---|---|
| Primary status | Last completed cycle's pass/fail status (✓ if all passed; ⚠ if any unsatisfactory; ✗ if any unacceptable) |
| Secondary line | "Cycle {cycle name}" with cycle date |
| Tertiary line | "{N} schemes active" |
| Deep-link | `/qa/eqa/oversight/lab-performance` |

#### 3.3.3 Quality Indicators tile

| Element | Source |
|---|---|
| Primary status | **Worst-of all enabled QIs** (per QI Dashboard's own rollup logic — see qi-dashboard-outline.md §8). Disabled QIs do not contribute. |
| Secondary line | "X of Y enabled QIs" — where Y = count of enabled QIs and X = count within target |
| Tertiary line | "Window: rolling 30d" (or whatever the QI Dashboard's user-persisted window is) |
| Deep-link | `/qa/qi/dashboard` |

#### 3.3.4 QMS & Improvement tile

| Element | Source |
|---|---|
| Primary status | Worst-of: unacknowledged critical NCEs > 0 (✗), OR overdue CAPAs > 0 (✗), OR pending verification > 0 (⚠), OR audit-trail anomalies (⚠), OR none (✓) |
| Secondary line | "{N} NCEs pending acknowledgment" |
| Tertiary line | "{N} CAPAs in progress" |
| Deep-link | Primary deep-link goes to NCE Register filtered to open Critical NCEs; the tile also includes a small "Audit Trail ↗" sub-link |

### 3.4 Tile click behavior

Clicking anywhere in the tile body navigates to the deep-link target. Clicking ⓘ shows a tooltip describing what the pillar measures, without navigating.

## 4. Status colors and aggregation rules

### 4.1 Per-pillar aggregation

Each pillar tile aggregates its underlying state with a worst-of rule across the relevant entities:

- **Statistical QC**: worst run state across all sections in the window.
- **EQA**: worst score in the most recent completed cycle.
- **Quality Indicators**: worst-of among enabled QIs (skips disabled per qi-configuration-outline.md DEC19).
- **QMS**: worst-of: open critical NCEs, overdue CAPAs, pending verification, audit anomalies.

### 4.2 Color semantics

| Color | Meaning |
|---|---|
| Green (✓) | All items in the pillar within target. |
| Amber (⚠) | At least one item needs attention but no action threshold breached. |
| Red (✗) | At least one item past action threshold, or an unacknowledged critical. |
| Gray (—) | Pillar disabled, no data yet, or user lacks permission. Does not contribute to overall page state. |

### 4.3 Cross-pillar state

The page itself does not have a single overall status banner. The five-question strip + four-tile grid carry the message. We deliberately avoid a "you are at status: amber" banner because it conceals which pillar drives the worst signal.

## 5. Empty and degraded states

| Condition | Behavior |
|---|---|
| User has `qa.view.overview` but no per-pillar `qa.view.*` permissions | Five-question strip renders gray for inaccessible pillars. Pillar tiles for inaccessible pillars are not rendered (grid reflows). Fallback message on the page if all pillars inaccessible: "You don't have permission to view any QA pillar. Contact your administrator." |
| All four pillars have no data (new install, before any QC run / EQA cycle / QI computed / NCE created) | Each tile renders in gray with a "No data yet" line and a "Get started ↗" link to the pillar's setup or first-action page. |
| A specific pillar's recompute is stale (> 24h) | That tile shows a small ⓘ "Data may be stale — last update {timestamp}" warning. |
| **Pillar not yet built** (Sprint 1 → Sprint 5 gap for EQA) | Pillar tile renders gray with "{Pillar} performance data pending — available after {feature} ships." For EQA specifically: "EQA performance data pending — available after EQA V2 ships in Sprint 5." Deep-link points to the closest existing surface (e.g., the EQA Orders page during the gap). |

## 6. Header utilities

| Element | Behavior |
|---|---|
| Last recomputed timestamp | Displays the staleest tile's recompute time. Hover for absolute time. |
| Refresh button | Forces all four tiles to recompute. Rate-limited to once per 60 seconds per user (more conservative than QI Dashboard's 30s because rolling up four pillars is heavier). |
| Print / export | **Out of scope for v1.** "QA at a glance" PDF export deferred to v2 (paired with the Accreditation Binder export). |

## 7. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.overview` | Required to see the page at all. |
| `qa.view.qc` / `qa.view.eqa` / `qa.view.qi` / `qa.view.qms` | Each pillar tile and its corresponding question-strip row only render if the user holds the matching pillar permission. Without the permission, the row goes gray ("—") and the tile is hidden. |

QA Officer default role per the qa-menu-roadmap bundles `qa.view.overview` plus all four pillar `qa.view.*` permissions.

## 8. Data sources

The QA Overview is a thin aggregator. It does not duplicate query logic; it composes existing pillar endpoints, with thin wrappers added where the existing endpoints don't quite return tile-shaped data. The pattern follows the TAT compliance wrapper precedent.

### 8.1 Endpoint audit (2026-04-23)

| Pillar | Existing endpoint(s) | State | Wrapper needed for QA Overview tile? |
|---|---|---|---|
| Statistical QC | `GET /rest/qc/dashboard/summary?months=N` (returns `QCDashboardSummary`); `GET /rest/qc/dashboard/instruments` | **Partial** — has 1–12 month window logic via `computeDateRange()`, but aggregates to overall compliance, not section-level breakdown. | Yes — new `GET /rest/qc/dashboard/sections?months=1` returning per-section + worst-of status. ~2–3h. |
| EQA | `GET /rest/eqa/orders?status=...&programId=...`; `GET /rest/eqa/orders/summary` (returns `{pending, inProgress, overdue, completedThisMonth}`) | **Partial — and waiting on EQA V2 build** — only counts orders by status, not by scheme/cycle. EQA V2 is fully specced but not yet built; the cycle/scheme model lands with V2 in Sprint 5. | Yes — new `GET /rest/eqa/cycles/latest-performance?schemeId=...` returning most-recent-completed cycle per scheme + worst-of. **Built in Sprint 5 alongside EQA V2 MVP**, not Sprint 1. Until then, the QA Overview EQA tile renders in the gray "pending" state. ~2–3h once V2 ships. |
| Quality Indicators | None yet (QI Dashboard ships in Sprint 4) | **Future** — built in Sprint 4 alongside QI Dashboard. | Built in Sprint 4 by definition. |
| QMS (NCE composite) | `GET /rest/nce/dashboard` (returns full `NceDashboardItemDTO[]` with severity, status, history, notes) | **Sufficient** — full NCE list is on the wire with the fields needed. | Optional — client can filter on `severity=Critical AND status IN (open, acknowledged)` plus walk for overdue CAPAs. Adding a server-side `/rest/nce/dashboard/summary` is ~1–2h if preferred. |

### 8.2 Sprint 1 endpoint deliverables (vs. Sprint 5 EQA)

Sprint 1 adds the **QC sections wrapper** as part of the QA Overview build (parallel team-owned module; flag-and-proceed pattern same as TAT compliance wrapper).

The **EQA cycles wrapper** is **deferred to Sprint 5** because the cycle/scheme model arrives with the EQA V2 build. EQA V2 is already specced out but not yet built; the QA Overview EQA tile will render in the gray "EQA performance data pending" state from Sprint 1 launch until Sprint 5 closes. The five-question strip's Q2 row mirrors that state. The deep-link target (`/qa/eqa/oversight/lab-performance`) will not exist until Sprint 5 either, so during the gap the deep-link points to the existing EQA Orders page.

NCE composite uses the existing dashboard with client-side filtering in v1; a server-side summary is in the Sprint 1 stretch backlog if perf measurement on the client filter shows it's worth the trip.

### 8.3 Files to extend

| Pillar | Files |
|---|---|
| QC | `src/main/java/org/openelisglobal/qc/controller/QCRestController.java` (+ new method); `src/main/java/org/openelisglobal/qc/dto/QCSectionsSummary.java` (new DTO) |
| EQA | `src/main/java/org/openelisglobal/eqa/controller/rest/EQAOrdersRestController.java` (+ new method) or a new `EQACyclesRestController.java`; new DTO for cycle-level summary |
| NCE | (no changes for v1; client-side filter on existing `NceDashboardItemDTO`) |

## 9. Acceptance criteria (outline)

- [ ] Page renders at `/qa/overview` and is the default landing for the Quality Assurance sidenav node.
- [ ] Five-question strip renders all five questions in fixed order with status icons + one-line answers.
- [ ] Each question row is a deep-link to the appropriate pillar / leaf.
- [ ] Four pillar tiles render in fixed order (QC, EQA, QI, QMS) with the documented per-tile element structure.
- [ ] A pillar tile is omitted (and its question row goes gray) when the user lacks the corresponding `qa.view.*` permission.
- [ ] Worst-of color logic respects each pillar's own conventions (e.g., QI Dashboard's enabled-only rollup).
- [ ] Last-recomputed timestamp reflects the staleest tile.
- [ ] Refresh button is rate-limited to once per 60 seconds.
- [ ] Empty states render appropriately for each degraded condition (no permission, no data, stale).
- [ ] All visible strings localized; no hard-coded English.
- [ ] User without `qa.view.overview` does not see the QA menu in the sidenav and cannot reach this page.

## 10. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.qa.overview.title` |
| Question strip header | `label.qa.overview.questions.header` |
| Q1 — runs in control | `label.qa.overview.q1.label` / `label.qa.overview.q1.answer` |
| Q2 — EQA performance | `label.qa.overview.q2.label` / `label.qa.overview.q2.answer` |
| Q3 — QIs on target | `label.qa.overview.q3.label` / `label.qa.overview.q3.answer` |
| Q4 — open NCEs | `label.qa.overview.q4.label` / `label.qa.overview.q4.answer` |
| Q5 — accreditation | `label.qa.overview.q5.label` / `label.qa.overview.q5.answer` |
| Statistical QC tile | `label.qa.overview.tile.qc.*` |
| EQA tile | `label.qa.overview.tile.eqa.*` |
| QI tile | `label.qa.overview.tile.qi.*` |
| QMS tile | `label.qa.overview.tile.qms.*` |
| Empty state — no permissions | `label.qa.overview.emptyState.noPermissions` |
| Empty state — no data | `label.qa.overview.emptyState.noData` |
| Stale data warning | `label.qa.overview.staleData` |

Full list in the Sprint 1 FRS.

## 11. Resolved decisions + remaining open questions

### Resolved 2026-04-23

- **Q1 — Pillar rollup endpoint audit (RESOLVED via DIGI-UW/OpenELIS-Global-2 code audit):** see §8.1. QC and EQA need thin wrappers (Sprint 1, ~2–3h each). NCE uses existing `/rest/nce/dashboard` with client-side filter. QI Dashboard rollup is built in Sprint 4 by definition.
- **Q2 — Statistical QC 30d-window aggregate (RESOLVED, same audit):** `QCDashboardService.computeDateRange()` already supports a months-based window (1–12). The wrapper adds section-grouping on top.
- **Q5 — Open-NCE headline count (RESOLVED, see DEC25):** Critical-severity only for the question-strip headline; total on the QMS tile's secondary line.

### Resolved 2026-04-23 (continued)

- **Q3 — EQA "last completed" definition (LOCKED):** "Last completed" = the most recent **graded** cycle. Cycles whose submission deadline has passed but the provider hasn't graded yet are skipped. Stable result — once shown, doesn't flip until the next graded cycle lands.
- **Q4 — Multi-scheme rollup (LOCKED):** Worst-of across all schemes' latest graded cycles. Find the most-recent-graded-cycle per scheme, then take the worst status across them. Tile primary status reflects the worst-performing scheme; secondary line names the offender ("microbiology last cycle: 2 fails").

### Still open

(none — all five Q1–Q5 resolved.)

---

*Outline only — full FRS authored before Sprint 1 IA build.*
