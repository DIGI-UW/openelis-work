# QA MVP KPI Rollup
## FRS Outline — Sprint 2 (QA Menu Roadmap, MVP fast-follow)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Final FRS in the QA-menu spec sequence — the MVP closing step
**Sidenav placement:** `Quality Assurance → Quality Indicators → QI Dashboard` (same path as the full Sprint 4 dashboard; MVP replaces full version on this route)

---

## 1. Purpose

Ship a minimum-viable Quality Indicators dashboard early — using only KPIs that can be computed from data **already in the system** plus the small REST wrappers we've already specced — so users get tangible Pillar-3 value before the full Sprint 4 buildout lands.

The MVP is deliberately a thin slice of the full Sprint 4 vision:

- **Same URL** as the full dashboard so the migration is invisible to users — the MVP is replaced in place when Sprint 4 ships.
- **Three KPI tiles only** (Rejection Rate, Amendment Rate, TAT Compliance) — KPIs whose data exists today and whose wrappers are small.
- **No configuration page** — fixed defaults, no enable/disable, no per-test thresholds, no admin surface. Configurability arrives with Sprint 4's full buildout.
- **No NCE drill-through tile** in v1 of the MVP — NCE register data is available via existing `/rest/nce/dashboard`, but adding a fourth KPI tile is incremental scope. Punt to Sprint 4 alongside the rest of the polished build.

This is the last spec in the QA menu FRS-creation sequence. Everything before it (NCE FRS v4.0, three QI outlines, QI Configuration, QI Dashboard, QA Overview) is full-version scope. This MVP intentionally ships less of that, faster.

## 2. Scope

In scope:
- **Four tiles**: Rejection Rate, Amendment Rate, TAT Compliance, NCE Composite (open critical NCEs + overdue CAPAs).
- Fixed default thresholds matching the per-QI outlines (no editing in MVP).
- Reporting window selector: **Rolling 7d / 30d / 90d / Year-to-date** (default Rolling 30d). Skip "This quarter" — Sprint 4 adds.
- Last-recomputed timestamp + refresh button.
- Drill-through links to per-QI detail pages (placeholders in MVP; full pages arrive in Sprint 4).
- Permissions gating identical to the full version.
- An "MVP — full dashboard arrives in Sprint 4" banner so users know what they're seeing.

Out of scope (deferred to Sprint 4):
- Critical Callback Compliance tile (needs schema work per CC-Q1; default-disabled anyway).
- QI Configuration admin page (no enable/disable, no threshold editing, no per-test overrides in MVP).
- Disable cascade behavior (no disabled state to cascade in MVP since all four MVP tiles are always-on).
- "This quarter" reporting window option.
- Worst-of rollup to QA Overview (Sprint 1 QA Overview QI tile reads MVP data; the full enable-aware logic arrives with Sprint 4).
- Heatmaps and Pareto charts on the per-QI detail pages (MVP routes detail clicks to a placeholder "Detail view arrives in Sprint 4" page until then).

## 3. What "existing data" means

Every MVP KPI computes from data the system already captures:

| Tile | Existing data source | Wrapper status | Wrapper effort |
|---|---|---|---|
| Rejection Rate | `sample_test_order` joined to `nce_event` via `nce_sample_link` and `nce_result_link`; test category from `test_section` | New wrapper needed: `GET /rest/qi/rejection-rate?from=...&to=...&groupBy=testCategory` | ~3–4h |
| Amendment Rate | `result` post-validation changes captured via `electronic_signature` (record_type=RESULT, sequential signatures with diff in value/unit/interp). **No reason data captured** — tile shows rate + count only, no Pareto or top-reason line. | New wrapper needed: `GET /rest/qi/amendment-rate?from=...&to=...&groupBy=testCategory` | ~3–4h |
| TAT Compliance | `/rest/reports/tat/summary` (existing). **No per-test TAT target stored in OpenELIS** — v1 uses a single lab-wide threshold (default 24h, configurable in Admin → QI Configuration → TAT Threshold). Compliance % = test orders completed within threshold ÷ total test orders. | Wrapper already specced for full Sprint 4: `GET /rest/reports/tat/compliance?thresholdHours=24` | ~2–3h (already on Sprint 4 list; pull forward) |
| NCE Composite | `/rest/nce/dashboard` (existing — full `NceDashboardItemDTO[]` already on the wire) | **No new wrapper.** Client-side filter on existing payload: `severity=Critical AND status IN (open, acknowledged)` for critical-open count; walk `nce_capa` for `due_date < now()` and `status != completed` for overdue-CAPA count. | 0h backend; ~1h frontend filter logic |

All new wrappers are pure controller-level additions — no schema changes, no service-layer refactors. They follow the same flag-and-proceed pattern as the TAT compliance wrapper.

**Total MVP backend effort: ~8–11 engineer-hours for the three new wrappers, plus the dashboard frontend (~1h extra for the NCE filter logic).**

## 4. Sprint placement

Placement: **Sprint 2 fast-follow** (or end-of-Sprint-2 if Sprint 2 NCE work finishes early).

Rationale:
- Sprint 1 is full of IA + NCE FRS + QA Overview build — no slack for an MVP push.
- Sprint 2 is NCE/CAPA bedrock build. Adding the MVP KPI dashboard in parallel is feasible because the MVP wrappers + frontend are independent of NCE work.
- Sprint 3 is rehomes and new QMS views — already busy and dependency-heavy.
- Sprint 4 is the full Pillar-3 build that this MVP gives way to.

If Sprint 2 capacity is tight, the MVP can slide to a "Sprint 2.5" mini-sprint between 2 and 3. It does not need to be on the critical path.

## 5. Page layout (MVP)

Identical shape to the full QI Dashboard, fewer tiles, simpler header. Reuses the same Carbon component patterns.

```
Quality Assurance › Quality Indicators › QI Dashboard

  ┌──────────────────────────────────────────────────────────────┐
  │ Reporting window:  [Rolling 30 days ▾]   Last recomputed: 2m │
  │                                                    ↻ Refresh  │
  │                                                                │
  │ ⓘ MVP dashboard — full version arrives in Sprint 4            │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐
  │ TAT Compliance       │  │ Rejection Rate       │
  │  92.4% ↑0.6%         │  │  1.7%  ↓0.3%         │
  │  ▓▓▓▓▓▓░ Target ≥ 90%│  │  ▓▓▓░░░ Target < 2%  │
  │  View detail ↗       │  │  View detail ↗       │
  └──────────────────────┘  └──────────────────────┘
  ┌──────────────────────┐  ┌──────────────────────┐
  │ Amendment Rate       │  │ NCE Pulse            │
  │  0.31% ↑0.05%        │  │  5 critical open     │
  │  ▓▓░░░░ Target < 0.5%│  │  3 CAPAs overdue     │
  │  View detail ↗       │  │  View NCE Register ↗ │
  └──────────────────────┘  └──────────────────────┘
```

Note: four tiles in MVP. Critical Callback absent (default-off, schema-pending). NCE Pulse uses existing `/rest/nce/dashboard` data with client-side filter — no new backend.

## 6. Tile shell (MVP)

Same shell as the full dashboard's §4.1, with two omissions:

- **No ⚙ utility icon** on tiles (no configuration page exists yet to deep-link to).
- **No ⓘ tooltip** on tiles (deferred to Sprint 4 polish; the page-level MVP banner explains what users are looking at).

All other tile elements (title, primary value, delta, progress bar, target line, detail link) carry over identically. The shell is implemented to the full spec; the omissions are render-time conditionals so Sprint 4's polish reuses 100% of the MVP code.

## 7. Detail page placeholders

In MVP, clicking "View detail ↗" on a tile navigates to a placeholder page:

```
Rejection Rate — Detail

ⓘ Full detail view arrives in Sprint 4.

For now: a simple table of rejected test orders
in the current reporting window (with link to NCE).

[Date filter] [Section filter] [Reason filter]

| Date | Test | Sample # | Reason | NCE |
| ...                                       |

← Back to QI Dashboard
```

Minimum viable detail = a filterable table with NCE links. No heatmap, no Pareto, no per-test breakdown. Sprint 4 replaces the placeholder with the full detail page.

## 8. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.qi` | Required to see the MVP dashboard at all. |
| `qa.manage.qi` | No effect in MVP (no editable surfaces). Will gate the configuration page in Sprint 4. |

Same gating rule applies as in the full version: without `qa.view.qi`, the user doesn't see the QI pillar in the sidenav.

## 9. Sprint-4 transition behavior

When Sprint 4 ships, the MVP is replaced in place:

- The same URL (`/qa/qi/dashboard`) renders the full dashboard.
- The MVP banner is **deleted cleanly** — no graduated banner, no first-visit toast, no leftover MVP signage.
- The existing four tiles gain ⓘ + ⚙ utility icons.
- A fifth tile (Critical Callback Compliance) appears for labs that opt-in via the new QI Configuration page.
- The NCE Pulse tile may evolve in scope or get an upgraded server-side endpoint (decided in Sprint 4 planning); it does not disappear.
- Detail-page placeholders are replaced with full detail pages (heatmap, Pareto, per-test breakdown).
- Reporting-window selector adds "This quarter" alongside the four MVP options.

No data migration. No URL changes. No user-visible discontinuity beyond "the dashboard got more powerful." User-persisted reporting-window preference carries forward.

## 10. Acceptance criteria (MVP)

- [ ] Page renders at `/qa/qi/dashboard` with four tiles (TAT, Rejection Rate, Amendment Rate, NCE Pulse) in fixed order.
- [ ] Rejection Rate tile uses test-order unit per RR-Q4 (revised); numerator/denominator math reconciles against fixture data.
- [ ] Amendment Rate tile counts comment-changes-that-alter-clinical-interpretation per AR-Q1.
- [ ] TAT Compliance tile reads from the new `/rest/reports/tat/compliance` wrapper.
- [ ] NCE Pulse tile filters existing `/rest/nce/dashboard` payload to `severity=Critical AND status IN (open, acknowledged)` for the critical-open count, and walks `nce_capa` for `due_date < now() AND status != completed` for the overdue-CAPA count.
- [ ] NCE Pulse tile drill-through navigates to NCE Register filtered to the same critical-open set.
- [ ] Reporting-window selector offers Rolling 7d / 30d / 90d / Year-to-date and affects all four tiles.
- [ ] Selection persists per user across logouts.
- [ ] Last-recomputed timestamp reflects the staleest tile.
- [ ] Refresh rate-limited to once per 30 seconds per user.
- [ ] MVP banner is visible at top of page; localized; uses tag `label.qi.dashboard.mvpBanner`.
- [ ] Detail-page placeholder renders for each tile with a basic filterable table (NCE Pulse exception: drill-through goes to NCE Register, not a placeholder).
- [ ] User without `qa.view.qi` cannot reach the page.
- [ ] All visible strings localized; no hard-coded English.
- [ ] Sprint-4 transition test: turning on the full dashboard at the same URL preserves the user's reporting-window selection and removes the MVP banner cleanly without leaving any residual UI.

## 11. Localization tags (MVP-specific)

| Element | Tag |
|---|---|
| MVP banner | `label.qi.dashboard.mvpBanner` |
| Detail placeholder banner | `label.qi.detail.mvpPlaceholderBanner` |

All other tags reuse the per-QI and dashboard tags from their respective outlines.

## 12. Resolved decisions (2026-04-23)

| ID | Question | Decision |
|---|---|---|
| MVP-Q1 | NCE composite tile in MVP? | **Include — 4 tiles.** Uses existing `/rest/nce/dashboard` with client-side filter. ~0h backend, ~1h frontend. |
| MVP-Q2 | Reporting window options | **Rolling 7d / 30d / 90d / Year-to-date** (default Rolling 30d). Skip "This quarter" until Sprint 4. |
| MVP-Q3 | MVP banner sunset | **Delete cleanly when Sprint 4 ships.** No graduated banner, no first-visit toast. |

---

*Final outline in the QA menu FRS-creation sequence. Closes the spec set.*
