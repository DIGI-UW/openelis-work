# QA Menu v1 (MVP) — Functional Requirements Specification

**Document Version:** 1.0
**Date:** 2026-04-30
**Author:** Casey Iiams-Hauser
**Status:** Ship-ready FRS for v1 (MVP)
**Effort estimate:** ~45–55 engineer-hours with Claude (~80–110 without)
**Companion mockup:** `qa-v1-preview.html`
**Supersedes:** —

---

## 0. What v1 actually ships

A new top-level **Quality Assurance** sidenav group with **one child**: **QI Dashboard**. The dashboard renders four KPI tiles (Average TAT, Rejection Rate, Amendment Rate, NCE Pulse) computed from data already in OpenELIS, plus per-tile detail placeholders that show filterable tables of underlying records.

**v1 does not** rehome any existing pages, build pillar landings, ship QA Overview, add QI configuration, support Critical Callback Compliance, or modernize the NCE Register. Those land in v2 and beyond per `qa-menu-versioning-plan.md`.

This FRS is the ship-ready consolidation of:
- `qa-mvp-kpi-rollup-outline.md` — primary MVP outline
- `qi-rejection-rate-outline.md` — data sources for the rejection-rate wrapper
- `qi-amendment-rate-outline.md` — data sources for the amendment-rate wrapper
- `qi-dashboard-outline.md` — dashboard shell (subset for MVP)

The mockup `qa-v1-preview.html` is the canonical visual reference. Any conflict between text below and the mockup → mockup wins for visual layout; FRS wins for data/permission/acceptance semantics.

---

## 1. Scope

### In scope

1. **Top-level Quality Assurance sidenav group** with the `New` tag in v1.
2. **Single child node**: QI Dashboard.
3. **QI Dashboard page** with four tiles, reporting-window selector, last-recomputed timestamp, refresh button, and an MVP banner.
4. **Four detail-page placeholders** — filterable tables with NCE drill-through where relevant.
5. **Three new REST wrappers** — `/rest/qi/rejection-rate`, `/rest/qi/amendment-rate`, `/rest/reports/tat/compliance`.
6. **Client-side filter logic** for the NCE Pulse tile (no backend wrapper needed).
7. **Permission registry additions** — `qa.view.overview`, `qa.view.qi`, `qa.manage.qi` registered in the flexible-roles engine.
8. **QA Officer default role** pre-bundled with v1 permissions.
9. **i18n** — every string externalized to resource bundles.

### Out of scope (deferred)

| Feature | Lands in |
|---|---|
| QA Overview landing page (5-question strip + 4 pillar tiles) | v2 |
| NCE menu rehome to `/qa/qms/nce-register` | v2 |
| Audit Trail rehome to QMS pillar | v2 |
| Westgard Rules + Run Review/L-J rehomes | v2 |
| Electronic Signature Log | v2 |
| Accreditation Status registry | v3 |
| Modern NCE Register UI | v4 |
| NCE Create/Report flow | v5 |
| NCE Analytics page | v6 |
| CAPA Register | v7 |
| QI Dashboard full + QI Configuration + Pillar-3 detail pages | v8 |
| Critical Callback Compliance | v9 |
| EQA V2 (My EQA, Lab Performance, Follow-Up, Competency, Program Mgmt) | v10–v11 |
| Results Entry inline NCE upgrade | v12 |

### Non-goals (v1 does not change these)

- No backend rewrites of existing TAT, NCE, or sample query services.
- No URL changes to existing pages (NCE, Westgard, Audit Trail, etc. stay where they are).
- No schema migrations.
- No new tables.
- No multi-site / multi-lab support.
- No user-customizable dashboards.

---

## 2. Information architecture

### 2.1 Sidenav

A new top-level entry is added to the OpenELIS sidenav between `Sample` and `Quality Control`:

```
Home
Order
Results
Patient
Sample
Validation
Quality Assurance                          ◄── NEW (top-level)
  └── QI Dashboard                         ◄── NEW (only child)
Quality Control
EQA
Reports
Administration
```

The Quality Assurance parent shows the **`New`** tag for one major release after launch (auto-removed in v2 once additional children land).

Click behavior:

| Click | Result |
|---|---|
| Quality Assurance parent | Expands the submenu and navigates to the only child (QI Dashboard) |
| QI Dashboard child | Navigates to `/qa/qi/dashboard` |

### 2.2 Routes

| Path | Page |
|---|---|
| `/qa/qi/dashboard` | QI Dashboard MVP (default landing for the QA menu in v1) |
| `/qa/qi/dashboard/detail/tat` | Average TAT detail (filterable lab-unit / test table) |
| `/qa/qi/dashboard/detail/tat/lab-unit/{labUnit}` | Per-lab-unit drill (test rows for that unit) |
| `/qa/qi/dashboard/detail/rejection-rate` | Rejection Rate detail (pie chart + bar charts + table) |
| `/qa/qi/dashboard/detail/amendment-rate` | Amendment Rate detail (table only — no reason data) |
| `/qa/qi/dashboard/detail/nce-pulse` | NCE Pulse detail (routes through existing NCE Register filtered to critical-open) |

### 2.3 Breadcrumbs

```
Quality Assurance  ›  QI Dashboard
Quality Assurance  ›  QI Dashboard  ›  Average TAT
Quality Assurance  ›  QI Dashboard  ›  Average TAT  ›  Chemistry
Quality Assurance  ›  QI Dashboard  ›  Rejection Rate
```

The Quality Assurance segment links to `/qa/qi/dashboard` (since QI Dashboard is the only QA-pillar landing in v1).

---

## 3. QI Dashboard

### 3.1 Page layout

```
Quality Assurance › QI Dashboard

[ MVP banner — yellow stripe, dismissible? No, persistent for v1 ]

[ Reporting window: Rolling 30 days ▾ ]   Last recomputed: 2m ago   [ ↻ Refresh ]

┌──────────────────────┐  ┌──────────────────────┐
│ Average TAT          │  │ Rejection Rate       │
│  18h 47m   ↓ 0:32    │  │  1.7%   ↓ 0.3%       │
│  vs prior 30d        │  │  ▓▓▓░░░ Target < 2%  │
│  Across 12 lab units │  │  42 rejected of 2471 │
│  Slowest: Micro 61h  │  │  Worst: Hema (3.2%)  │
│  View detail ↗       │  │  View detail ↗       │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│ Amendment Rate       │  │ NCE Pulse            │
│  0.31%   ↑ 0.05%     │  │  5 critical pending  │
│  ▓▓░░░░ Target < 0.5%│  │  3 CAPAs overdue     │
│  8 amended of 2,580  │  │  Click to view       │
│  released            │  │  in NCE Register     │
│  View detail ↗       │  │  View NCE Register ↗ │
└──────────────────────┘  └──────────────────────┘
```

### 3.2 Header strip

| Element | Component | Behavior |
|---|---|---|
| Reporting-window selector | Carbon `Dropdown` | Options: Rolling 7d / Rolling 30d (default) / Rolling 90d / Year-to-date. Persists per user across logouts (cookie or user-pref store). |
| Last-recomputed timestamp | Plain text | "Last recomputed: 2m ago" — relative time of the staleest tile. Hover for absolute. |
| Refresh button | Carbon `Button` (kind=ghost) | Forces all four tiles to recompute. Rate-limited to once per 30 seconds per user. |

### 3.3 MVP banner

A persistent yellow banner above the header strip. Tag: `label.qi.dashboard.mvpBanner`. Default text:

> **MVP dashboard.** Tiles use existing OpenELIS data + small REST wrappers. Configurable thresholds, Critical Callback Compliance, and full detail pages arrive in v8.

Removed cleanly when v8 ships (no graduated banner, no first-visit toast — DEC34).

### 3.4 Tile shell

All four tiles share the same Carbon `Tile` shell. Anatomy:

```
┌─────────────────────────────────┐
│ [colored top border 3px]        │
├─────────────────────────────────┤
│ {Tile name}              ⓘ     │   ← title row
│                                 │
│   {primary value} {delta}       │   ← KPI + period-over-period delta
│   [progress bar with markers]   │   ← present on rate tiles, omitted on count tiles
│   {target line}                 │   ← present on rate tiles, replaced with secondary count on count tiles
│                                 │
│   {secondary line}              │   ← supporting context
│   View detail ↗                 │   ← link to detail (or NCE Register for NCE Pulse)
└─────────────────────────────────┘
```

| Element | Detail |
|---|---|
| Top border | 3px. Carbon green 60 (`#198038`) for "good direction"; amber 50 (`#f1c21b`) for "approaching action threshold"; red 60 (`#da1e28`) for "past action threshold"; blue 60 (`#0f62fe`) for tiles without a target band. |
| Primary value | 1.75rem, weight 300, monospaced numerics. |
| Delta | 0.8125rem. Color = green-when-moving-in-good-direction, red-when-bad, gray-when-flat (< 0.05% absolute change). Arrow: ↑ / ↓ / — |
| Progress bar | Carbon-tokens-aligned. Fill % relative to target. Marker at the target value. Omitted on tiles where the primary value is a count (NCE Pulse) or doesn't have a target (Average TAT in v1). |
| Target line | Below progress bar. e.g., "Target < 2%" or "vs prior 30d" for non-target tiles. |
| Secondary line | Tile-specific supporting context (count breakdown, worst category, etc.). |
| Detail link | "View detail ↗" — navigates to per-tile detail page. NCE Pulse instead reads "View NCE Register ↗" and routes through the filtered NCE Register. |

ⓘ icon shows a brief tooltip describing what the tile measures. No ⚙ utility icon in v1 (no QI Configuration page yet).

### 3.5 Per-tile specifications

#### 3.5.1 Average TAT

| Field | v1 value |
|---|---|
| Top border color | Blue 60 — no good/bad band in v1 |
| Primary value | Average TAT across all completed test orders in the window, formatted as `Xh YYm` |
| Delta | Difference from the same-length prior window (e.g., last 30d vs. 30d before that). Down arrow = good (faster TAT) |
| Progress bar | Omitted (no threshold) |
| Target line | "vs prior 30d" |
| Secondary line | "Across N lab units · Slowest: {labUnitName} ({Xh YYm})" |
| Drill-through | `/qa/qi/dashboard/detail/tat` |

**Data source notes:**
- Backend wrapper: new `/rest/reports/tat/compliance` endpoint *does not* compute compliance against a threshold in v1. Despite the endpoint name, it returns aggregate average TAT data (mean, median, p90) by lab unit + by test, all reused from existing `TATReportServiceImpl`.
- **Renaming consideration:** since v1 does not compute compliance, we either (a) name the endpoint `/rest/reports/tat/aggregate` for clarity, or (b) keep the original specced name `/rest/reports/tat/compliance` for continuity with v8 (which adds a `?thresholdHours=N` query param and computes compliance %). **Recommendation: keep the name `/rest/reports/tat/compliance`** — v8 adds the threshold parameter to the same endpoint without renaming. Document in the controller javadoc that the threshold parameter is optional and v1 ignores it.
- No per-test TAT target stored in OpenELIS today. Method-level breakdown also unsupported by current API. Both deferred.

#### 3.5.2 Rejection Rate

| Field | v1 value |
|---|---|
| Top border color | Green 60 if rate < 2% (target); amber 50 if 2% ≤ rate < 3% (action threshold); red 60 if rate ≥ 3% |
| Primary value | Rejection rate as a % of test orders rejected in the window |
| Delta | Difference from same-length prior window. Down arrow = good (fewer rejections) |
| Progress bar | Filled to (rate / 2%) × 100% capped at 100%. Marker at the 2% target. Color matches top border. |
| Target line | "Target < 2%" |
| Secondary line | "{N} rejected of {M} test orders · Worst: {testCategory} ({rate}%)" |
| Drill-through | `/qa/qi/dashboard/detail/rejection-rate` |

**Data source notes:**
- Numerator: rejected test orders linked to NCE events with `nce_event.subcategory` mapped through `nce_rejection_reason_mapping`.
- Denominator: test orders accessioned in the window (from `sample_test_order` per RR-Q4 — confirmed in Sprint 1 inventory; the canonical table name may vary by deployment).
- "Worst category" comes from `test_section.lab_unit` joined to the test.
- All real data — no vapor.

#### 3.5.3 Amendment Rate

| Field | v1 value |
|---|---|
| Top border color | Green 60 if rate < 0.5% (target); amber 50 if 0.5% ≤ rate < 1% (action threshold); red 60 if rate ≥ 1% |
| Primary value | Amendment rate as a % of released results amended in the window |
| Delta | Difference from same-length prior window. Down arrow = good (fewer amendments) |
| Progress bar | Filled to (rate / 0.5%) × 100% capped at 100%. Marker at the 0.5% target. |
| Target line | "Target < 0.5%" |
| Secondary line | "{N} amended of {M} released" — **no "Top reason" line.** |
| Drill-through | `/qa/qi/dashboard/detail/amendment-rate` |

**Data source notes:**
- Numerator: post-validation result changes captured via `electronic_signature` rows (record_type=RESULT, sequential signatures with diff in value/unit/interp).
- **No structured "amendment reason" captured in OpenELIS today** — confirmed via DIGI-UW/OpenELIS-Global-2 audit. The tile shows rate + count only. No Pareto, no top-reason line. Detail page intentionally omits a Reason column.

#### 3.5.4 NCE Pulse

| Field | v1 value |
|---|---|
| Top border color | Red 60 (count > 0); green 60 (count = 0). v1 ships with red because critical-open count is presumed > 0; if count = 0, switch to green automatically. |
| Primary value | Count of unacknowledged-or-open Critical-severity NCEs |
| Delta | Plain text "critical pending ack" (not a numeric delta — the count is the headline). Gray. |
| Progress bar | Omitted (count, not rate) |
| Target line | "{N} CAPAs overdue" — secondary count for context |
| Secondary line | "Click to view in NCE Register" |
| Drill-through | NCE Register filtered to `severity=Critical AND status IN (open, acknowledged)`. v1 = legacy NCE Register; v4 = modern NCE Register. |

**Data source notes:**
- No new wrapper. Reads existing `/rest/nce/dashboard` endpoint and filters client-side.
- Critical-open count: client-side filter on the existing `NceDashboardItemDTO[]` payload: `severity=Critical AND status IN (open, acknowledged)`.
- Overdue-CAPA count: walk `nce_capa` joined to the dashboard payload for `due_date < now() AND status != completed`.
- ~1h frontend filter logic; 0h backend.

### 3.6 Recompute cadence

Per RR-Q1 (locked DEC16): **hybrid model**.

- The trailing 7 days are recomputed live (every sample-status change / result-status change invalidates the relevant aggregate).
- Data older than 7 days is recomputed nightly via scheduled job.
- Live aggregates use a cache invalidation hook on the ingest path. The hook is small (~3-5h to add). Indexes already exist on `sample.status`, `sample.received_date`, and `result.status`.

Refresh button (header strip) forces full recompute, rate-limited to 30s per user.

---

## 4. Detail-page placeholders

Each tile drills through to a detail page. v1 ships placeholder pages — filterable tables with NCE drill-through where relevant. Full detail pages with heatmaps + Pareto + per-test breakdown arrive in v8.

### 4.1 Average TAT detail

Two-level drill-down:

- **Top level**: list of lab units. Columns: Lab unit, Average TAT, Test orders count, "Slowest test in unit" (preview text).
- **Drill into a lab unit**: per-test breakdown. Columns: Test, Average TAT, Test orders count.
- **Method drill is not supported**. Sub-banner notes: "Method-level drill (e.g., test on different analyzers) requires a small TAT API extension (~2–4h, deferred)."

Filters: Date range (mirrors dashboard window), Segment (Order → Validation default), Calculation mode (Calendar hours / Working time), Priority (All / Routine / Stat / etc.).

### 4.2 Rejection Rate detail

Single-level filterable table. Columns: Date, Test, Sample #, Lab unit, Reason, NCE link.

Filters: Date range, Test, Section, Reason category, Lab unit. Sub-banner cites real data sources: "Rejection reasons come from `nce_event.subcategory` via `nce_rejection_reason_mapping`."

**Note on v1 vs. v8**: v1 detail page is just the table. v8 adds the pie chart of reasons + heatmap by ordering location × test category + Pareto cumulative chart. Visible in `qa-final-preview.html` for reference.

### 4.3 Amendment Rate detail

Single-level filterable table. Columns: Released at, Test, Sample #, Prior value, New value, Validator, Amender, NCE link. **No Reason column.**

Filters: Date range, Test, Section, Validating user, Amending user. Sub-banner cites: "OpenELIS does not currently capture a structured 'amendment reason.' Reason column intentionally omitted; rate + count + before/after values are what's available."

### 4.4 NCE Pulse "detail"

Routes through the existing NCE Register filtered to `severity=Critical AND status IN (open, acknowledged)`. v1 does not implement an inline detail page — drill-through opens the legacy NCE Register at the same filter. Sub-banner: "Drill-through routes through the existing NCE Register filtered to critical-open. Full inline detail arrives with the NCE Register modernization in v4."

---

## 5. Backend additions

### 5.1 New REST wrappers

Three new controller methods. All flag-and-proceed cross-team review (TAT module is owned by a different team; NCE/sample modules are not changed).

#### 5.1.1 `GET /rest/qi/rejection-rate`

| Parameter | Required | Description |
|---|---|---|
| `from` | yes | ISO 8601 date inclusive |
| `to` | yes | ISO 8601 date exclusive |
| `groupBy` | no | `testCategory` (default), `test`, `labUnit`, `reason` |

Response DTO: `RejectionRateResponse`

```java
public class RejectionRateResponse {
    private BigDecimal rate;          // % rejected
    private long numerator;           // rejected test orders
    private long denominator;         // total test orders
    private List<RejectionBreakdown> breakdown;
    private OffsetDateTime asOf;
}

public class RejectionBreakdown {
    private String dimension;         // e.g., test category name
    private long numerator;
    private long denominator;
    private BigDecimal rate;
}
```

Implementation: single SQL query joining `sample_test_order` to `nce_event` via `nce_sample_link` and `nce_result_link`, grouped by the requested dimension. ~3–4h.

Files:
- `src/main/java/org/openelisglobal/qi/controller/rest/RejectionRateRestController.java` (new)
- `src/main/java/org/openelisglobal/qi/dto/RejectionRateResponse.java` (new)
- `src/main/java/org/openelisglobal/qi/service/RejectionRateService.java` (new)

#### 5.1.2 `GET /rest/qi/amendment-rate`

| Parameter | Required | Description |
|---|---|---|
| `from` | yes | ISO 8601 date inclusive |
| `to` | yes | ISO 8601 date exclusive |
| `groupBy` | no | `testCategory` (default), `test`, `validator`, `amender` |

Response DTO: `AmendmentRateResponse` — same shape as RejectionRateResponse.

Implementation: window function over `electronic_signature` filtered to `record_type='RESULT'`, detecting sequential signatures with diff in value/unit/interp. ~3–4h.

Files:
- `src/main/java/org/openelisglobal/qi/controller/rest/AmendmentRateRestController.java` (new)
- `src/main/java/org/openelisglobal/qi/dto/AmendmentRateResponse.java` (new)
- `src/main/java/org/openelisglobal/qi/service/AmendmentRateService.java` (new)

#### 5.1.3 `GET /rest/reports/tat/compliance`

Despite the name, in v1 this returns aggregate **average TAT** data, not a compliance percentage. The name is preserved for continuity with v8, which adds a `thresholdHours` query parameter for compliance computation.

| Parameter | Required | Description |
|---|---|---|
| `from`, `to` | yes | Date range |
| `segment` | no | `OVERALL` (default), `ORDER_TO_COLLECTION`, `COLLECTION_TO_RECEIPT`, `RECEIPT_TO_TESTING`, `RECEIPT_TO_RESULT`, `RECEIPT_TO_VALIDATION`, `RESULT_TO_VALIDATION` |
| `calculationMode` | no | `CALENDAR` (default) or `WORKING_TIME` |
| `breakdownBy` | no | `LAB_UNIT` (default for v1 dashboard tile), `TEST`, `PRIORITY`, `SAMPLE_TYPE`, `ORDERING_SITE` |
| `thresholdHours` | no | **Reserved for v8.** v1 endpoint accepts but ignores this parameter. |
| Existing filters | no | `labUnitIds`, `testIds`, `panelIds`, `priority`, `sampleTypeId`, `orderingSiteId` (passed to existing `TATReportServiceImpl.summary`) |

Response DTO: `TATComplianceResponse`

```java
public class TATComplianceResponse {
    private BigDecimal averageHours;       // mean
    private BigDecimal medianHours;
    private BigDecimal percentile90Hours;
    private long testOrderCount;
    private List<TATBreakdownRow> breakdown;  // one row per dimension value
    private OffsetDateTime asOf;
    // v8: BigDecimal compliancePercentage, long passCount, long failCount
}

public class TATBreakdownRow {
    private String dimension;              // lab unit / test / etc.
    private BigDecimal averageHours;
    private long testOrderCount;
    private String slowestTestInDimension;  // for the "Slowest: X" tile line
}
```

Implementation: thin wrapper over existing `TATReportServiceImpl.summary` — no service-layer changes. ~2–3h.

Files:
- `src/main/java/org/openelisglobal/reports/tat/controller/rest/TATReportRestController.java` (extend with new method)
- `src/main/java/org/openelisglobal/reports/tat/bean/TATComplianceResponse.java` (new)

**Cross-team review:** TAT module is owned by a different team. Tag the module owners as reviewers in the PR description; do not block merge on their sign-off. If they prefer a different parameter shape, accept the change in a follow-up PR (DEC23).

### 5.2 No schema changes

v1 does not introduce any new tables, columns, or indexes. All wrappers query existing tables.

### 5.3 No write-side changes

v1 is read-only. No existing workflows write new data; no new e-signature events; no existing endpoints change behavior.

---

## 6. Permission registry

### 6.1 New permissions

Three permissions added to the flexible-roles engine:

| Permission key | Description |
|---|---|
| `qa.view.overview` | Visibility of the Quality Assurance top-level sidenav node. Required to see the QA group at all. |
| `qa.view.qi` | Visibility of the QI Dashboard. Required to render the dashboard. |
| `qa.manage.qi` | **Reserved.** Registered as a permission key but has no effect in v1 (no editable surfaces). Will gate the QI Configuration page in v8. |

Visibility rule: `User sees QI Dashboard ⇔ qa.view.overview ∧ qa.view.qi`.

### 6.2 QA Officer default role

A new pre-configured default role ships in v1: **QA Officer**.

Role bundle:
- `qa.view.overview`
- `qa.view.qi`
- `qa.manage.qi`

Plus all `nce.*` permissions inherited from the existing NCE module (since NCE Pulse drills through to NCE Register).

This is the only new default role in v1. Lab Director, Inspector/Auditor, etc. remain as documented bundles customers compose themselves via the flexible-roles UI (per `project_flexible_roles.md`).

### 6.3 Behavior for users without permissions

- User without `qa.view.overview`: Quality Assurance sidenav node is hidden; direct navigation to `/qa/qi/dashboard` returns 403.
- User with `qa.view.overview` but without `qa.view.qi`: Quality Assurance sidenav node is visible but has no children; landing on `/qa` redirects to a "no accessible QA pages" message. (Edge case — most users will have both.)

---

## 7. i18n

### 7.1 New localization keys (preliminary)

| Element | Key |
|---|---|
| Sidenav: Quality Assurance | `label.menu.qa` |
| Sidenav: QI Dashboard | `label.menu.qa.qiDashboard` |
| Page title | `label.qi.dashboard.title` |
| Reporting window selector | `label.qi.dashboard.window` |
| Last recomputed | `label.qi.dashboard.lastRecomputed` |
| Refresh button | `label.qi.dashboard.refresh` |
| MVP banner | `label.qi.dashboard.mvpBanner` |
| Tile: TAT label | `label.qi.tile.tat.label` |
| Tile: Rejection Rate label | `label.qi.tile.rejectionRate.label` |
| Tile: Amendment Rate label | `label.qi.tile.amendmentRate.label` |
| Tile: NCE Pulse label | `label.qi.tile.ncePulse.label` |
| Tile: View detail link | `label.qi.tile.viewDetail` |
| Tile: View NCE Register link | `label.qi.tile.viewNceRegister` |
| Detail: Filter | Reason | `label.qi.detail.filter.reason` |
| Detail: Filter | Lab unit | `label.qi.detail.filter.labUnit` |
| (… see appendix B for the full list) |

### 7.2 i18n requirements

- Every visible string uses `t(key, fallback)` pattern.
- No hard-coded English in the React component tree.
- French and Khmer translations land alongside the English defaults at v1 release. Translation work is not counted in the engineer-hours estimate (translator availability is the bottleneck).

---

## 8. Frontend implementation notes

### 8.1 Carbon components used

| Carbon component | Use |
|---|---|
| `SideNav`, `SideNavItems`, `SideNavMenu`, `SideNavMenuItem` | Quality Assurance menu node + child |
| `Breadcrumb`, `BreadcrumbItem` | Page breadcrumb |
| `Dropdown` | Reporting window selector |
| `Button` (kind=ghost) | Refresh button |
| `Tile` | Each KPI tile |
| `InlineNotification` (kind=warning) | MVP banner |
| `DataTable`, `TableContainer`, `TableHead`, `TableRow`, etc. | Detail-page tables |
| `Tag` (kind=cool-gray, magenta, etc.) | Test category pill, NCE link |

### 8.2 Routing

`react-router-dom` v6. Route table:

```jsx
<Route path="/qa">
  <Route index element={<Navigate to="/qa/qi/dashboard" replace />} />
  <Route path="qi/dashboard" element={<QIDashboardMVP />} />
  <Route path="qi/dashboard/detail/tat" element={<TATDetail />} />
  <Route path="qi/dashboard/detail/tat/lab-unit/:labUnit" element={<TATLabUnitDetail />} />
  <Route path="qi/dashboard/detail/rejection-rate" element={<RejectionRateDetail />} />
  <Route path="qi/dashboard/detail/amendment-rate" element={<AmendmentRateDetail />} />
  <Route path="qi/dashboard/detail/nce-pulse" element={<Navigate to="/nce/dashboard?severity=Critical&status=open,acknowledged" replace />} />
</Route>
```

The NCE Pulse drill-through is a `Navigate` redirect to the existing NCE Dashboard URL with query filters; v1 does not duplicate the NCE list UI.

### 8.3 Component file structure

```
src/main/webapp/app/quality-assurance/
  index.jsx                    // route mount
  QADashboard.jsx              // outer shell; reads permissions; renders QIDashboardMVP
  qi-dashboard/
    QIDashboardMVP.jsx         // header strip + 4 tiles
    QITile.jsx                 // shared tile shell
    detail/
      TATDetail.jsx
      TATLabUnitDetail.jsx
      RejectionRateDetail.jsx
      AmendmentRateDetail.jsx
  hooks/
    useReportingWindow.js      // user-pref persistence
    useQIWrappers.js           // fetches /rest/qi/* and /rest/reports/tat/compliance
```

### 8.4 User-prefs

Reporting-window selection persists per user across logouts via `user_pref` (existing).

### 8.5 Data refresh

Each tile fetches independently on dashboard mount. Refresh button forces re-fetch with `cache=false`. Live recompute (per §3.6) means the wrapper response reflects fresh data within seconds of the last sample/result write, so no polling is needed in v1.

---

## 9. Acceptance criteria

### 9.1 IA + sidenav

- [ ] New top-level "Quality Assurance" sidenav group renders with the `New` tag.
- [ ] Single child node "QI Dashboard" appears under it.
- [ ] Clicking the parent expands the submenu and navigates to QI Dashboard.
- [ ] Active state on QI Dashboard is teal-bordered when on that page.

### 9.2 QI Dashboard

- [ ] Page renders at `/qa/qi/dashboard`.
- [ ] Four tiles display in fixed order: Average TAT, Rejection Rate, Amendment Rate, NCE Pulse.
- [ ] MVP banner is visible at the top of the page.
- [ ] Reporting-window selector offers Rolling 7d / 30d / 90d / Year-to-date with default Rolling 30d.
- [ ] Selection persists per user across logouts.
- [ ] Last-recomputed timestamp reflects the staleest tile's recompute time.
- [ ] Refresh button forces re-fetch and is rate-limited to once per 30 seconds per user.

### 9.3 Tile rendering

- [ ] Each tile shows title, primary value, delta, secondary line, detail link.
- [ ] Top-border color reflects the tile's good/bad/neutral band per §3.5.
- [ ] Progress bar renders on Rejection Rate and Amendment Rate; omitted on Average TAT and NCE Pulse.
- [ ] Average TAT tile has no threshold/target framing — primary value is just an average.
- [ ] Amendment Rate tile **does not show a "Top reason" line.**
- [ ] NCE Pulse tile shows critical-open count + overdue-CAPA count with no progress bar.
- [ ] Clicking a tile navigates to the corresponding detail (or NCE Register for NCE Pulse).

### 9.4 Detail pages

- [ ] TAT detail shows lab-unit table with click-to-drill into per-test rows.
- [ ] TAT detail explicitly notes that method-level drill is a deferred enhancement.
- [ ] Rejection Rate detail renders a filterable table with NCE drill-through. Reason column populated from `nce_event.subcategory`.
- [ ] Amendment Rate detail renders a filterable table without a Reason column. Sub-banner explicitly notes the missing data.
- [ ] NCE Pulse detail redirects to existing NCE Register with the filter applied.

### 9.5 Backend

- [ ] `GET /rest/qi/rejection-rate` returns 200 with documented DTO shape against fixture data.
- [ ] `GET /rest/qi/amendment-rate` returns 200 with documented DTO shape.
- [ ] `GET /rest/reports/tat/compliance` returns 200 with `averageHours`, `medianHours`, `percentile90Hours`, `breakdown[]`, `asOf` fields populated. `compliancePercentage` field absent or null in v1.
- [ ] All three endpoints return 403 for users lacking `qa.view.qi`.
- [ ] All three endpoints honor `from` / `to` parameters.

### 9.6 Permissions

- [ ] Three new permission keys (`qa.view.overview`, `qa.view.qi`, `qa.manage.qi`) appear in the flexible-roles engine.
- [ ] QA Officer default role ships pre-bundled with the v1 permissions + all `nce.*`.
- [ ] User without `qa.view.overview` does not see the Quality Assurance sidenav node.
- [ ] User without `qa.view.qi` cannot reach `/qa/qi/dashboard` (403 / redirect).

### 9.7 i18n

- [ ] All visible strings localized; no hard-coded English in the component tree.
- [ ] French and Khmer translation bundles updated for the new keys before release.

### 9.8 Cross-cutting

- [ ] Hash routes from the mockup (`#/qa/qi-dashboard`, `#/qa/qi-dashboard/detail/tat`, etc.) resolve to the React routes.
- [ ] No console errors / warnings on dashboard mount.
- [ ] Lighthouse accessibility score ≥ 95 on the dashboard page.
- [ ] Mobile viewport (≤ 480px) renders the 4 tiles in a single column.
- [ ] Browser back/forward preserves the reporting window selection.

---

## 10. Open items

### 10.1 Resolved during design (no impact on build)

| Question | Decision | Source |
|---|---|---|
| Per-test TAT target | Doesn't exist; v1 uses no threshold | Code audit (DEC23 superseded by data-source verification) |
| Amendment reason | Doesn't exist; tile shows no "Top reason" | Code audit |
| Method-level TAT drill | Not supported by current API; deferred | Code audit |
| NCE composite tile in MVP | Include — 4 tiles total | DEC32 |
| MVP reporting windows | 7d / 30d / 90d / YTD | DEC33 |
| MVP banner sunset | Delete cleanly when v8 ships | DEC34 |
| Recompute cadence | Hybrid (live ≤ 7d, nightly > 7d) | DEC16 |

### 10.2 Outstanding (low risk; resolve during build)

1. **`sample_test_order` table name confirmation** — the canonical OpenELIS schema may use `analysis` or `test_request_line`. Sprint 1 inventory confirms; the join logic is unchanged.
2. **Live recompute hook performance** — the cache invalidation hook on the ingest path has not been benchmarked. Engineering lead to confirm acceptable latency. Fallback: nightly-only recompute (~50ms vs. 5–10ms cost per ingest event).
3. **TAT module cross-team review parameter shape** — `breakdownBy=LAB_UNIT` vs. `breakdownBy=labUnit` (case convention). Match the existing endpoint's convention; confirm in PR.

---

## 11. Effort estimate

Per `effort-estimate-with-claude.md` Sprint 1:

| Item | Hours (low–high) |
|---|---|
| Top-level QA sidenav group + IA skeleton | 4–6 |
| Permission registry (qa.view.* / qa.manage.qi) | 3–5 |
| QA Officer default role | 2–3 |
| `/rest/qi/rejection-rate` wrapper | 3–4 |
| `/rest/qi/amendment-rate` wrapper | 3–4 |
| `/rest/reports/tat/compliance` wrapper | 2–3 |
| QI Dashboard frontend (header + 4 tiles + drill-through routing) | 12–16 |
| Detail-page placeholders × 3 (TAT 2-level, Rejection, Amendment) | 8–11 |
| NCE Pulse client-filter logic | 1 |
| Tests (unit + integration) | 4–6 |
| Cross-team PR review iteration | 2–3 |
| **Total** | **44–62** |

Baseline: ~50h with Claude. Without Claude: ~80–110h.

---

## 12. Cross-references

| Document | Relevance |
|---|---|
| `qa-menu-roadmap.md` | Master roadmap; v1 is the first phase |
| `qa-menu-versioning-plan.md` | Thin-slice version sequence; v1 corresponds to the "v1" entry |
| `qa-mvp-kpi-rollup-outline.md` | Original MVP outline; superseded by this FRS for v1 scope |
| `qi-rejection-rate-outline.md` | Underlying data-source spec for the rejection-rate wrapper |
| `qi-amendment-rate-outline.md` | Underlying data-source spec for the amendment-rate wrapper |
| `qi-dashboard-outline.md` | Dashboard shell pattern (subset for v1 MVP) |
| `qa-v1-preview.html` | Canonical visual mockup |
| `qa-v2-preview.html` | Reference for what v2 will add (QA Overview, pillar landings, E-Sig Log, rehome stubs) |
| `qa-final-preview.html` | End-state mockup; v1 is the first slice |
| `effort-estimate-with-claude.md` | Hour estimates per sprint/version |
| `qa-menu-roadmap.xlsx` | Sprint Plan + Decisions Log + Dependencies sheet |

---

## 13. Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-04-30 | Casey | Initial ship-ready FRS for v1 (MVP). Consolidates `qa-mvp-kpi-rollup-outline.md` + per-QI outlines + audit-driven data-source decisions. Endpoint name `/rest/reports/tat/compliance` preserved for continuity with v8 despite v1 not computing compliance. |

---

## Appendix A — Mock data shapes (for fixtures + tests)

### A.1 Rejection Rate response (rolling 30d sample)

```json
{
  "rate": 0.017,
  "numerator": 42,
  "denominator": 2471,
  "breakdown": [
    { "dimension": "Hematology",   "numerator": 14, "denominator": 442,  "rate": 0.0317 },
    { "dimension": "Microbiology", "numerator":  6, "denominator": 187,  "rate": 0.0321 },
    { "dimension": "Chemistry",    "numerator": 18, "denominator": 1284, "rate": 0.0140 },
    { "dimension": "Immunology",   "numerator":  3, "denominator": 256,  "rate": 0.0117 },
    { "dimension": "Molecular",    "numerator":  1, "denominator":  94,  "rate": 0.0106 }
  ],
  "asOf": "2026-04-30T10:00:00Z"
}
```

### A.2 Amendment Rate response (rolling 30d sample)

```json
{
  "rate": 0.0031,
  "numerator": 8,
  "denominator": 2580,
  "breakdown": [
    { "dimension": "Chemistry",  "numerator": 5, "denominator": 1284, "rate": 0.0039 },
    { "dimension": "Hematology", "numerator": 2, "denominator":  812, "rate": 0.0025 },
    { "dimension": "Molecular",  "numerator": 1, "denominator":   94, "rate": 0.0106 }
  ],
  "asOf": "2026-04-30T10:00:00Z"
}
```

### A.3 TAT compliance (v1) response (rolling 30d, breakdownBy=LAB_UNIT)

```json
{
  "averageHours": 18.78,
  "medianHours": 14.20,
  "percentile90Hours": 47.50,
  "testOrderCount": 2731,
  "breakdown": [
    { "dimension": "Chemistry",   "averageHours": 18.7, "testOrderCount": 1284, "slowestTestInDimension": "Lipid panel (28h)" },
    { "dimension": "Hematology",  "averageHours": 14.2, "testOrderCount":  812, "slowestTestInDimension": "PT/INR (19h)" },
    { "dimension": "Microbiology","averageHours": 61.2, "testOrderCount":  187, "slowestTestInDimension": "Culture & sensitivity (96h)" },
    { "dimension": "Molecular",   "averageHours": 32.4, "testOrderCount":   94, "slowestTestInDimension": "HIV viral load (48h)" },
    { "dimension": "Immunology",  "averageHours": 22.1, "testOrderCount":  256, "slowestTestInDimension": "Allergen panel (36h)" },
    { "dimension": "Toxicology",  "averageHours": 19.8, "testOrderCount":  138, "slowestTestInDimension": "Drug screen (24h)" }
  ],
  "asOf": "2026-04-30T10:00:00Z"
}
```

(`compliancePercentage`, `passCount`, `failCount` fields are absent or null in v1; v8 populates them when `thresholdHours` is passed.)

---

## Appendix B — Full localization tag list

(Generated during Sprint 1 frontend build; this FRS lists the principal keys in §7.1.)

---

*End of v1 (MVP) FRS.*
