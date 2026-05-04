# Quality Indicator: Amendment Rate
## FRS Outline — Sprint 4 (QA Menu Roadmap)

**Document Version:** 0.2 (outline + locked scope decisions)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline with scope decisions locked; full FRS authored in Sprint 4
**Sidenav placement:** `Quality Assurance → Quality Indicators → Amendment Rate`

---

## 1. Purpose

Track the percentage of validated/released results that are subsequently amended. Amendment Rate is a CAP-checklist QI because every amended result represents a release of incorrect data into clinical use — it's a direct measure of post-analytical correctness.

This QI consumes existing data: the result audit log (status transitions and value changes after validation) and the NCE register (every amendment of a released result generates an NCE under trigger #3 of the NCE Report FRS v3.1, the "result rejection with retest" pathway, plus a discrete "amendment" subcategory). No new data collection is required.

## 2. Standards & background

| Source | What they say |
|---|---|
| ISO 15189:2022 §8.8 | Quality indicators must include post-analytical processes; amendment of released results is a recommended indicator. |
| CAP GEN.20377 | Amendment rate is one of the QM examples called out as a useful indicator. |
| CLSI QMS24 / Plebani | Industry references typically target < 0.5% for amendment rate, with action threshold at 1%. |

## 3. Definition

### 3.1 Formula

```
Amendment Rate (%) = (Amended Results ÷ Released Results) × 100
```

Computed at: lab, section, test, analyst (validating user), reason category, time period.

### 3.2 Numerator

Count of result records whose `result_history` shows a value, unit, or interpretive change *after* the result reached `validated`/`released` state during the reporting window. Excludes pre-validation edits (those are working-state corrections, not amendments).

Includes:
- Numeric value changed.
- Unit changed (rare, usually a config error caught downstream).
- **Comment changes that alter clinical interpretation** (locked AR-Q1) — defined as any change to the structured interpretive comment field that produces a different clinical reading. Whitespace and pure formatting changes do not count.
- Result added to a previously-released report (addendum). **Counts as 1**, tagged `addendum` (locked AR-Q2). Filterable on the detail page.
- Auto-rerun replacement values, even when within delta-check tolerance. Counts by default; lab-configurable toggle defaulting OFF (locked AR-Q3).

Excludes:
- Cancellation of a released result (counted under a separate cancellation indicator).
- Trivial comment edits that do not alter clinical interpretation (typo fixes, whitespace, formatting).

### 3.3 Denominator

Count of results that reached `validated`/`released` state at any point during the reporting window. (A result released in March and amended in April counts once in March's denominator and once in April's numerator.)

### 3.4 Reporting window

Daily, weekly, monthly, quarterly, year-to-date. Default dashboard view: rolling 30 days.

### 3.5 Time-elapsed handling (locked AR-Q4)

**No headline cutoff.** Every post-release change counts in the headline rate. Time-elapsed (release → amendment) is captured and surfaced as a drill-down dimension so labs can spot patterns (e.g., "critical results released after 5pm get amended at 8am") without gating the headline number.

### 3.6 Anatomic Pathology severity weighting (locked AR-Q5)

**Raw rate in v1; severity weighting deferred to v2.** AP amendments come in severity tiers (clarification / addendum / diagnostic discrepancy). v1 counts each as 1 amendment regardless of severity, keeping the QI definition consistent across all test categories. Severity is captured on the underlying NCE so a v2 weighting layer is purely additive.

### 3.7 Lab-level enablement

This QI is **enabled by default** for new installs. Amendment Rate is universally relevant for any lab that releases results (which is every clinical lab) and is called out by CAP GEN.20377. Disable is supported through `Admin → QI Configuration → Amendment Rate` for unusual cases (e.g., research-only labs that don't release clinical reports), with the same disable behavior as Critical Callback: tile removed, detail route 404, no alerts, history preserved. See `qi-configuration-outline.md`.

## 4. Threshold defaults (configurable)

| Test category | Target | Action threshold | Source |
|---|---|---|---|
| Routine chemistry / hematology | < 0.5% | > 1.0% | CAP/CLSI common reference |
| Microbiology | < 1.0% | > 2.0% | Industry common |
| Anatomic pathology | < 0.3% | > 0.6% | CAP cytopathology PT reference |
| Molecular | < 0.5% | > 1.0% | Industry common |
| Overall | < 0.5% | > 1.0% | Lab-configurable rollup |

Thresholds configurable per lab via QI threshold settings.

## 5. Data sources

| Source | Field(s) | Purpose |
|---|---|---|
| `result` table | `id`, `status`, `released_at`, `analyte_id`, `validating_user_id`, `section_id` | Denominator, drill-down dimensions |
| `result_history` table | `result_id`, `prior_value`, `new_value`, `prior_status`, `new_status`, `changed_at`, `changed_by`, `reason_code` | Numerator detection — find any post-release value/unit/interp change |
| `nce_event` (linked via `nce_result_link`) | `category=Post-Analytical`, `subcategory=Amendment`, `severity`, `trigger_source` | Drill-down from numerator row to NCE detail |

No new tables. The amendment-detection query is a window function over `result_history` filtered to entries whose `prior_status` was a terminal validated state.

## 6. UI sketch

### 6.1 Tile (on QI Dashboard)

```
┌─────────────────────────────────────────┐
│ Amendment Rate                          │
│                                         │
│   0.31%   ↑ 0.05% vs prior 30d          │
│   ▓▓░░░░ Target: < 0.5%                 │
│                                         │
│   8 amended of 2,580 released           │
└─────────────────────────────────────────┘
```

**Data-source note:** OpenELIS does not currently capture a structured "amendment reason" on `Result` or `ElectronicSignature`. The tile shows rate + count only — no Pareto, no top-reason line. If a structured reason is added in a future migration (out of v1 scope), the tile gains a "Top reason" line at that point.

### 6.2 Detail page

- KPI strip: current rate, prior-period delta, target line, action threshold line.
- Trend chart: rate line by week.
- Top-amendments table: one row per amended result with link to its NCE; columns include test, prior value, new value, validating user, amender, time elapsed between release and amendment. **Reason column omitted in v1** — see data-source note in §6.1.
- Section/test breakdown: bar chart by section, click-through to test-level breakdown.
- Filters: date range, section, test, validating user, amending user. (Reason filter not available — see §6.1 data-source note.)
- Export: CSV (filtered table) and PDF (current view as report).

### 6.3 Visual cues

Same target/amber/action-threshold-red color logic as Rejection Rate.

## 7. NCE linkage

- Each amended result already generates an NCE (NCE Report FRS — typically a Post-Analytical / Amendment NCE). Drill-through navigates to `/qa/qms/nce/{id}`.
- The amendment-reasons taxonomy on this page **is** the NCE subcategory taxonomy — no parallel reason set.
- Threshold breach raises an Alert (`label.alert.qi.amendmentRate.actionThreshold`) on the Alerts dashboard with severity = High.

## 8. Permissions

| Permission | Description |
|---|---|
| `qa.view.qi` | View Quality Indicators pillar including this dashboard. |
| `qa.manage.qi` | Edit thresholds and targets. |
| `nce.view.all` | Required to drill through to a specific amendment NCE. |

Default QA Officer role and Lab Director recipe both bundle `qa.view.qi` + `qa.manage.qi`.

## 9. Acceptance criteria (outline)

- [ ] Numerator detects a value change on a result that previously reached `validated` state.
- [ ] Numerator detects a unit change post-release.
- [ ] Numerator detects an interpretation/comment change (when the comment-only-edit toggle is OFF).
- [ ] Numerator excludes pre-validation working edits.
- [ ] Numerator excludes a cancellation (cancellation is its own indicator).
- [ ] Denominator counts every result that reached `validated` in the window.
- [ ] Tile renders with current value, delta, target.
- [ ] Trend chart, top-amendments table, reason Pareto, section/test breakdown all reconcile with the KPI strip.
- [ ] Drill-through opens the linked NCE.
- [ ] Threshold breach raises the canonical Alert.
- [ ] User without `qa.view.qi` does not see the tile or detail page.

## 10. Resolved scope decisions (2026-04-23)

| ID | Question | Decision | Notes |
|---|---|---|---|
| AR-Q1 | Comment-only edits | **Count only changes that alter clinical interpretation.** | Defined narrowly: any change to the structured interpretive comment field that produces a different clinical reading. Whitespace and pure formatting do not count. See §3.2. |
| AR-Q2 | Addendum results | **Count as 1, tag as `addendum`.** | Filterable on the detail page; reversible if labs want a non-addendum-only headline later. See §3.2. |
| AR-Q3 | Auto-rerun amendments | **Count by default; lab-configurable toggle defaulting OFF.** | Within-tolerance auto-reruns still represent pre-analytical drift QA needs to see. See §3.2. |
| AR-Q4 | Time-elapsed cutoff | **No headline cutoff; track elapsed time as drill-down.** | See §3.5. |
| AR-Q5 | AP severity weighting | **Raw rate v1; severity weighting deferred to v2.** | Keeps definition consistent across test categories in v1. Severity captured on underlying NCE so v2 weighting is purely additive. See §3.6. |

## 11. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.qi.amendmentRate.title` |
| Tile label | `label.qi.amendmentRate.tileLabel` |
| Target line | `label.qi.amendmentRate.target` |
| Action threshold line | `label.qi.amendmentRate.actionThreshold` |
| Trend chart title | `label.qi.amendmentRate.trend` |
| Reason Pareto title | `label.qi.amendmentRate.reasonPareto` |
| Section breakdown title | `label.qi.amendmentRate.sectionBreakdown` |
| Alert (action threshold breach) | `label.alert.qi.amendmentRate.actionThreshold` |

Full list in the Sprint 4 FRS.

---

*Outline only — full FRS authored in Sprint 4.*
