# QI Dashboard
## FRS Outline — Sprint 4 (QA Menu Roadmap)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored in Sprint 4
**Sidenav placement:** `Quality Assurance → Quality Indicators → QI Dashboard` (default landing for the Pillar-3 node)

---

## 1. Purpose

The QI Dashboard is the rollup landing page for the Quality Indicators pillar. It answers the third of the five ISO 15189 quality questions ("Are we meeting our quality indicators?") in a single view, with deep-links to per-QI detail pages and to the TAT report.

It is deliberately a *thin* page. The substance lives in the per-QI specs:
- `qi-tat-compliance` (existing TAT report — deep-linked, not duplicated)
- `qi-rejection-rate-outline.md`
- `qi-amendment-rate-outline.md`
- `qi-critical-callback-compliance-outline.md`

This outline covers only the shared frame: tile layout, visibility rules tied to QI Configuration, header utilities, empty state, and the cross-QI behaviors that sit above any single indicator.

## 2. Scope

In scope:
- Tile layout and shared tile shell.
- Visibility rule: the dashboard renders only QIs enabled per `Admin → QI Configuration` (DEC19 from qa-menu-roadmap).
- Empty state when all QIs are disabled.
- Header utilities: link to QI Configuration (admin only), reporting-window selector, last-recomputed timestamp.
- Deep-links from each tile to its detail page (or to the TAT report for the TAT tile).
- Roll-up to the QA Overview pillar tile (this dashboard supplies the QA Overview "Quality Indicators" tile data).

Out of scope:
- The actual numerator/denominator/threshold logic per QI (lives in per-QI outlines).
- QI configuration UI (lives in `qi-configuration-outline.md`).
- Custom user-defined indicators (v2 enhancement).
- Multi-site rollup (v2 per roadmap DEC03).

## 3. Page layout

### 3.1 Top-level structure

```
Quality Assurance › Quality Indicators › QI Dashboard

  ┌────────────────────────────────────────────────────────────────────┐
  │ Reporting window:  [Rolling 30 days ▾]    Last recomputed: 2m ago │
  │                                            ↻ Refresh   ⚙ Configure │
  └────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐
  │ TAT Compliance       │  │ Rejection Rate       │
  │  92.4% ↑0.6%         │  │  1.7%  ↓0.3%         │
  │  ▓▓▓▓▓▓░ Target ≥ 90%│  │  ▓▓▓░░░ Target < 2%  │
  │  View TAT report ↗   │  │  View detail ↗       │
  └──────────────────────┘  └──────────────────────┘
  ┌──────────────────────┐  ┌──────────────────────┐
  │ Amendment Rate       │  │ Critical Callback    │
  │  0.31% ↑0.05%        │  │  Compliance          │
  │  ▓▓░░░░ Target < 0.5%│  │  97.4% ↓0.8%         │
  │  View detail ↗       │  │  Target 100% / ≥95%  │
  │                      │  │  View detail ↗       │
  └──────────────────────┘  └──────────────────────┘
```

### 3.2 Header strip

| Element | Behavior | Tag |
|---|---|---|
| Reporting window selector | Dropdown: Rolling 7d / Rolling 30d / Rolling 90d / This quarter / Year to date. Default: Rolling 30d. Selection persists per user (not per session). | `label.qi.dashboard.window` |
| Last recomputed timestamp | "Last recomputed: 2m ago" — relative time; hover for absolute. Picks the most-stale tile's recompute time. | `label.qi.dashboard.lastRecomputed` |
| Refresh button | Forces a recompute of all visible tiles. Rate-limited to once per 30 seconds per user to protect the ingest path. | `label.qi.dashboard.refresh` |
| Configure link | Visible only with `qa.manage.qi`. Deep-links to `Admin → QI Configuration`. | `label.qi.dashboard.configure` |

### 3.3 Tile grid

Tiles are arranged in a responsive 2×2 (or 1×4 on narrow viewports) grid. Tile order is fixed: TAT, Rejection Rate, Amendment Rate, Critical Callback Compliance — left-to-right, top-to-bottom. Disabled QI tiles are simply omitted (no placeholder); the grid reflows.

## 4. Shared tile shell

Each tile renders the same structure regardless of QI:

```
┌─────────────────────────────┐
│ {QI name}              ⚙ ⓘ │   ← title + utility icons
│                             │
│   {primary value} {delta}   │   ← KPI + period-over-period delta
│   {progress bar}            │   ← bar with target (and action) markers
│   Target: {value}           │
│                             │
│   {secondary line}          │   ← optional: count summary or top-reason
│   View detail ↗             │   ← link to detail page (or TAT report)
└─────────────────────────────┘
```

### 4.1 Tile elements

| Element | Description |
|---|---|
| Title | QI name. Localized via the QI's own tag (e.g., `label.qi.rejectionRate.tileLabel`). |
| Utility icon ⓘ | Hover/tap shows the QI's one-sentence purpose (the "what does this measure" tooltip from each QI's outline §1). |
| Utility icon ⚙ | Visible only with `qa.manage.qi`; deep-links to that QI's panel inside QI Configuration. |
| Primary value | Current rate or count, formatted to the QI's own conventions. Bold, 24pt. |
| Delta | "↑0.6%" or "↓0.3%" vs. the prior identical-length window. Color and arrow direction respect each QI's own "good direction" semantics — see §5. |
| Progress bar | Filled bar from 0 to 100% of target. Markers for target and action threshold. Color follows §5. |
| Target line | "Target: < 2%" / "Target: 100%" — the QI's headline target value. |
| Secondary line | Optional supporting context. Per QI: TAT shows samples-on-time; Rejection Rate shows rejected vs. total + worst category; Amendment Rate shows amended vs. released + top reason; Critical Callback shows acknowledged vs. total + missed-callback NCEs. |
| Detail link | "View detail ↗" navigates to the QI's detail page. TAT tile reads "View TAT report ↗" and navigates to the existing TAT report under Reports. |

### 4.2 Tile click behavior

Clicking anywhere on the tile body navigates to the detail page (same as the "View detail" link). Clicking ⚙ navigates to QI Configuration. Clicking ⓘ shows the tooltip without navigating.

## 5. Color and direction semantics (cross-QI)

The dashboard supports two direction conventions because Critical Callback is "higher is better" while Rejection Rate, Amendment Rate, and TAT (when measured as a non-compliance rate — but TAT here uses on-time-%, also higher-is-better) have different alignments.

| QI | Good direction | Tile-color rule |
|---|---|---|
| TAT Compliance | Higher = better (% on time) | Green at/above target; amber between target and action threshold; red below action threshold. |
| Rejection Rate | Lower = better | Green at/below target; amber between target and action threshold; red above action threshold. |
| Amendment Rate | Lower = better | Same as Rejection Rate. |
| Critical Callback Compliance | Higher = better | Same as TAT Compliance. |

The progress-bar fill direction is consistent — bar fills left-to-right showing how the *current value* relates to the *target*. The color shift is what conveys good/bad. Delta arrow color: green if moving in the good direction, red if moving in the bad direction, gray if no change (< 0.05% absolute).

## 6. Visibility rule

A tile renders if and only if its underlying QI is **enabled** in `Admin → QI Configuration`. The dashboard reads each QI's enabled state on page load and again on refresh.

If TAT is enabled (it always is, in the v1 default state — TAT Compliance is presumed always-on), the tile renders. The other three tiles are present only when their QI Configuration toggle is on. Per DEC19, the v1 install defaults are:

| QI | Default | Therefore tile visible by default? |
|---|---|---|
| TAT Compliance | Enabled | Yes |
| Rejection Rate | Enabled | Yes |
| Amendment Rate | Enabled | Yes |
| Critical Callback Compliance | Disabled | No |

Labs that opt-in to Critical Callback see the fourth tile.

## 7. Empty state

If a lab disables all four QIs (unusual but possible), the dashboard renders:

```
  No Quality Indicators are enabled for this laboratory.

  [⚙ Configure Quality Indicators]   ← visible only with qa.manage.qi
  [↗ Read about quality indicators]  ← link to in-app docs
```

Localization tags: `label.qi.dashboard.emptyState.title`, `label.qi.dashboard.emptyState.cta`.

## 8. Roll-up to QA Overview

The QA Overview landing page (separate outline forthcoming) shows a "Quality Indicators" pillar tile. That tile aggregates **only enabled QIs**:

- If all enabled QIs are within target: pillar tile is green ("All indicators within target").
- If any enabled QI is between target and action threshold: amber ("1 indicator approaching threshold").
- If any enabled QI is above the action threshold (or below, for higher-is-better QIs): red ("1 indicator past action threshold").

This dashboard supplies the data; the QA Overview page reads it.

## 9. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.qi` | Required to see the QI Dashboard at all. Without it, the QI pillar parent in the sidenav is hidden. |
| `qa.manage.qi` | Reveals the ⚙ utility icons on each tile and the "Configure" link in the header strip. |
| Per-QI permissions inherited from the detail page | Users without the underlying drill-through permissions see the tile but cannot navigate to detail. (Spec note: this is a rare case — typically `qa.view.qi` covers everything.) |

## 10. Acceptance criteria (outline)

- [ ] Page renders at `/qa/qi/dashboard` (or whatever path the IA proposal locks).
- [ ] Tiles render in fixed order: TAT, Rejection Rate, Amendment Rate, Critical Callback.
- [ ] A disabled QI's tile is omitted; the grid reflows without a placeholder.
- [ ] Reporting-window selector updates all tiles simultaneously.
- [ ] Selection of reporting window persists per user (cookie or user-pref store).
- [ ] Last-recomputed timestamp reflects the staleest tile's recompute time.
- [ ] Refresh button forces a recompute and is rate-limited to once per 30 seconds per user.
- [ ] Tile click navigates to the QI's detail page (or TAT report for TAT).
- [ ] Tile ⚙ icon is visible only with `qa.manage.qi` and deep-links to the right config panel.
- [ ] Tile ⓘ tooltip shows the QI's one-sentence purpose without navigating.
- [ ] Tile color and arrow direction respect each QI's good-direction convention.
- [ ] Empty state renders when all QIs are disabled, with config CTA visible only with `qa.manage.qi`.
- [ ] All visible strings localized; no hard-coded English.
- [ ] User without `qa.view.qi` does not see the QI pillar in the sidenav and cannot reach this page directly.

## 11. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.qi.dashboard.title` |
| Reporting-window selector | `label.qi.dashboard.window` |
| Last-recomputed timestamp | `label.qi.dashboard.lastRecomputed` |
| Refresh button | `label.qi.dashboard.refresh` |
| Configure link | `label.qi.dashboard.configure` |
| Tile detail-link suffix | `label.qi.dashboard.viewDetail` |
| TAT detail-link override | `label.qi.dashboard.viewTatReport` |
| Empty-state title | `label.qi.dashboard.emptyState.title` |
| Empty-state CTA | `label.qi.dashboard.emptyState.cta` |

Per-QI tile labels are owned by each QI's own outline (`label.qi.rejectionRate.tileLabel`, etc.) — this dashboard does not duplicate them.

## 12. Resolved decisions + remaining open questions

### Resolved 2026-04-23

**TAT data source — wrapper endpoint required (RESOLVED via DIGI-UW/OpenELIS-Global-2 code audit):** A modern REST API already exists at `/rest/reports/tat/summary`, `/rest/reports/tat/detail`, `/rest/reports/tat/trend`, and `/rest/reports/tat/export`. The summary endpoint returns mean / median / p90 / histogram / per-dimension breakdown, but **does not return a compliance percentage**. The QI Dashboard tile will not call `/summary` directly because translating its response into a single tile-ready compliance % introduces threshold logic that belongs server-side.

**Decision:** Sprint 4 adds a thin wrapper endpoint `GET /rest/reports/tat/compliance` that:
- Takes `fromDate`, `toDate`, `segment`, `threshold` (e.g., `≤24h`), plus the existing `/summary` filter parameters.
- Internally calls the existing `TATReportServiceImpl` summary path.
- Applies threshold arithmetic to histogram bins.
- Returns `{ compliancePercentage, passCount, failCount, threshold, asOf }`.
- Inherits the existing `/summary` security and role checks.

Reuses 100% of the existing query logic; pure controller-level addition. Files to extend:
- `src/main/java/org/openelisglobal/reports/tat/controller/rest/TATReportRestController.java` — add `/compliance` endpoint
- `src/main/java/org/openelisglobal/reports/tat/bean/TATComplianceResponse.java` — new DTO

No changes to `TATReportServiceImpl`, `TATCalculationService`, `TATSummaryResponse`, or `TATResult`.

**Cross-team review:** The TAT module is owned by a different team. The `/rest/reports/tat/compliance` endpoint is small enough (single controller method, single new DTO) that we proceed without blocking on approval. Flag the change in the Sprint 4 PR description and tag the TAT module owners as reviewers; do not block merge on their sign-off. If they prefer a different parameter shape (e.g., structured `thresholdHours` + `thresholdOperator` vs. a single string), accept the change in a follow-up PR rather than delaying Sprint 4.

### Still open

1. **Reporting-window persistence** — per-user (cookie/user-pref) or per-session (state only)? Recommend per-user; persists across logouts. Casey to confirm.
2. **Refresh rate-limit value** — 30s is a guess; if recompute is genuinely live (per RR-Q1 hybrid recompute), refresh may be unnecessary. Decide once recompute behavior is observed in staging.
3. **QA Overview rollup tile drill-through target** — should the "Quality Indicators" pillar tile on QA Overview drill through to this dashboard or to the worst-performing QI's detail? Recommend this dashboard (the rollup landing); user picks the offending QI from there. Casey to confirm when QA Overview spec lands.

---

*Outline only — full FRS authored in Sprint 4.*
