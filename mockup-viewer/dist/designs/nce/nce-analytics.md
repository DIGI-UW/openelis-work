# NCE Analytics & Reporting
## Functional Requirements Specification

**Document Version:** 3.0  
**Date:** February 18, 2026  
**Author:** Casey Iiams-Hauser  
**Mockup Reference:** `nce-analytics.jsx`

---

## Related Documents

| Document | Scope |
|----------|-------|
| **NCE Dashboard & CAPA Management FRS** | Navigation, NCE list views, CAPA workflow, batch actions |
| **NCE Non-Conformity Report FRS** | NCE creation form, data model, categories, linking, configuration, triggers |
| **NCE Results Entry Integration FRS** | Inline NCE form, delta check alerts, trigger integration |

---

## 1. Overview

The NCE Analytics module provides comprehensive quality metrics, trend analysis, and reporting capabilities. It is accessible via the NCE → Analytics submenu and also surfaced as a summary widget on the NCE Dashboard views.

### 1.1 Purpose

- Provide real-time quality metrics for laboratory management
- Enable trend analysis to identify patterns and recurring issues
- Support accreditation and audit requirements with exportable reports
- Drive continuous quality improvement through data-informed decision-making
- Track CAPA effectiveness and recurrence rates over time

### 1.2 i18n Requirement

All user-facing text — including chart titles, axis labels, KPI card labels, filter options, report titles, export button labels, and tooltip text — MUST be externalized to resource bundles for multi-language (i18n) support.

---

## 2. Navigation

### 2.1 Access Points

| Access Point | Description |
|--------------|-------------|
| NCE → Analytics | Full analytics page (sidebar submenu item) |
| Dashboard Widget | Summary KPI cards on My Assignments / All NCEs / Pending Verification views, with "View Full Analytics" link |

### 2.2 Page Header

```
NCE  ›  Analytics

📊 NCE Analytics
   Quality metrics and trend analysis
```

| Element | Tag |
|---------|-----|
| Breadcrumb | `label.breadcrumb.nce` › `label.menu.nce.analytics` |
| Page title | `label.nce.analytics.title` |
| Page subtitle | `label.nce.analytics.subtitle` |

---

## 3. Global Filters

A filter bar appears at the top of the analytics page, applying to all charts and metrics.

### 3.1 Date Range Selector

Preset buttons plus a custom date range option:

| Option | Label | Period | Tag |
|--------|-------|--------|-----|
| 7d | "7 Days" | Last 7 days | `label.nce.analytics.dateRange.7d` |
| 30d | "30 Days" | Last 30 days (default) | `label.nce.analytics.dateRange.30d` |
| 90d | "90 Days" | Last 90 days | `label.nce.analytics.dateRange.90d` |
| 12m | "12 Months" | Last 12 months | `label.nce.analytics.dateRange.12m` |
| Custom | "Custom" | User-selected start/end dates | `label.nce.analytics.dateRange.custom` |

### 3.2 Category Filter

| Option | Tag |
|--------|-----|
| All Categories (default) | `label.nce.analytics.category.all` |
| Pre-Analytical | `label.nce.category.preAnalytical` |
| Analytical | `label.nce.category.analytical` |
| Post-Analytical | `label.nce.category.postAnalytical` |
| Administrative | `label.nce.category.administrative` |

### 3.3 Export Button

| Button | Description | Tag |
|--------|-------------|-----|
| Export CSV | Downloads the underlying data for all visible charts | `label.nce.analytics.exportCsv` |
| Export PDF | Generates a PDF snapshot of the analytics page | `label.nce.analytics.exportPdf` |

---

## 4. KPI Summary Cards

Four key performance indicator cards appear at the top of the analytics page.

### 4.1 Card Definitions

| KPI | Tag (Label) | Tag (Help) | Calculation | Trend |
|-----|-------------|------------|-------------|-------|
| Total NCEs | `label.nce.analytics.kpi.totalNces` | `label.nce.analytics.kpi.totalNces.help` | Count of NCEs created in selected period | ▲/▼ % vs. prior equivalent period |
| Avg Resolution | `label.nce.analytics.kpi.avgResolution` | `label.nce.analytics.kpi.avgResolution.help` | Mean calendar days from open to closed-verified | ▲/▼ days vs. prior equivalent period |
| CAPA Effectiveness | `label.nce.analytics.kpi.capaEffectiveness` | `label.nce.analytics.kpi.capaEffectiveness.help` | Percentage of effectiveness reviews marked effective | ▲/▼ percentage points vs. prior period |
| Recurrence Rate | `label.nce.analytics.kpi.recurrenceRate` | `label.nce.analytics.kpi.recurrenceRate.help` | Percentage of closed NCEs that resulted in a linked recurrence NCE | ▲/▼ percentage points vs. prior period |

### 4.2 Card Visual Design

Each card displays:
1. **Label** — KPI name (bold)
2. **Value** — Large numeric display
3. **Unit** — Days, %, or count
4. **Trend delta** — Comparison vs. prior period with arrow icon
   - Green (▲ for improvement, ▼ for improvement depending on metric)
   - Red (▲ for worsening, ▼ for worsening depending on metric)

**Improvement direction per KPI:**

| KPI | Improvement | Worsening |
|-----|-------------|-----------|
| Total NCEs | ▼ fewer NCEs (green) | ▲ more NCEs (red) |
| Avg Resolution | ▼ shorter time (green) | ▲ longer time (red) |
| CAPA Effectiveness | ▲ higher % (green) | ▼ lower % (red) |
| Recurrence Rate | ▼ lower % (green) | ▲ higher % (red) |

### 4.3 Prior Period Calculation

"Prior period" means the equivalent duration immediately preceding the selected period. For example:
- "Last 30 Days" → compares against the 30 days before that
- "Last 12 Months" → compares against the preceding 12 months
- Custom range → compares against an equal-length period ending at the custom start date

---

## 5. Charts

The analytics page displays nine charts organized in a responsive grid layout. Charts should render using a charting library compatible with Carbon Design System (e.g., Carbon Charts for React or Recharts).

### 5.1 NCE Trend (Line Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.nceTrend` — "NCE Trend (Weekly)" |
| Type | Line chart with area fill |
| X-axis | Week-starting dates (e.g., "Dec 23", "Dec 30", "Jan 6") |
| X-axis label | `label.nce.analytics.chart.nceTrend.xAxis` — "Week Starting" |
| Y-axis | Integer count |
| Y-axis label | `label.nce.analytics.chart.nceTrend.yAxis` — "Number of NCEs" |
| Data points | One point per week; each point labeled with its value |
| Grid lines | Horizontal grid lines at Y-axis tick intervals |
| Line color | Teal (`#0d9488`) |
| Area fill | Teal at 8% opacity |
| Granularity toggle | Weekly (default), Daily, Monthly — Tag: `label.nce.analytics.chart.granularity` |

### 5.2 Category Breakdown (Horizontal Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.categoryBreakdown` — "NCEs by Category" |
| Type | Horizontal bar chart |
| Categories | Pre-Analytical, Analytical, Post-Analytical, Administrative |
| Bar display | Bar width proportional to count; count label at end of bar; percentage of total |
| Colors | Blue (`#1565c0`), Green (`#2e7d32`), Purple (`#6a1b9a`), Gray (`#616161`) |

### 5.3 Severity Distribution (Horizontal Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.severityDistribution` — "NCEs by Severity" |
| Type | Horizontal bar chart |
| Severities | Critical, Major, Minor |
| Colors | Red (`#d32f2f`), Orange (`#e65100`), Amber (`#f57f17`) |

### 5.4 Trigger Type Distribution (Stacked Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.triggerType` — "NCEs by Trigger Type" |
| Type | Stacked horizontal bar chart |
| Segments | Manual, Mandatory, Prompted (created), Prompted (dismissed) |
| Colors | Gray (`#616161`), Red (`#d32f2f`), Orange (`#e65100`), Amber with striping (`#f57f17`) |
| Dismissal rate | Display percentage of prompted NCEs that were dismissed |
| Tag (dismissal) | `label.nce.analytics.chart.triggerType.dismissalRate` |

### 5.5 Root Cause Pareto (Bar + Line Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.rootCausePareto` — "Root Cause Analysis (Pareto)" |
| Type | Combination bar + cumulative line chart |
| X-axis | Root cause categories ordered by frequency (descending) |
| Y-axis (left) | Count of NCEs |
| Y-axis (right) | Cumulative percentage |
| Bar color | Teal (`#00695c`) |
| Line color | Orange (`#e65100`) |
| 80% line | Dashed horizontal reference line at 80% cumulative |

### 5.6 Top Rejection Reasons (Horizontal Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.rejectionReasons` — "Top Rejection Reasons" |
| Type | Horizontal bar chart |
| Data | Top 5 rejection reasons by count |
| Bar color | Red (`#d32f2f`) |
| Count labels | At end of each bar |

### 5.7 Time to Closure by Category (Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.timeToClosureByCategory` — "Avg Time to Closure by Category" |
| Type | Vertical bar chart |
| X-axis | Categories (Pre-Analytical, Analytical, Post-Analytical, Administrative) |
| Y-axis | Average days to closure |
| Y-axis label | `label.nce.analytics.chart.timeToClosureByCategory.yAxis` — "Days" |
| Bar color | Teal (`#00695c`) |
| Value labels | On top of each bar |

### 5.8 CAPA Completion Rate (Line Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.capaCompletionRate` — "CAPA Completion Rate Over Time" |
| Type | Line chart |
| X-axis | Months |
| Y-axis | Percentage (0–100%) |
| Y-axis label | `label.nce.analytics.chart.capaCompletionRate.yAxis` — "Completion Rate (%)" |
| Line color | Green (`#2e7d32`) |
| Reference line | Dashed line at 100% target |

### 5.9 NCEs by Department (Horizontal Bar Chart)

| Property | Value |
|----------|-------|
| Title | `label.nce.analytics.chart.ncesByDepartment` — "NCEs by Department / Test Section" |
| Type | Horizontal bar chart |
| Data | NCE count grouped by department/test section |
| Bar color | Blue (`#1565c0`) |
| Sort | Descending by count |

---

## 6. Dashboard Widget

A condensed analytics widget appears on the NCE Dashboard views (My Assignments, All NCEs, Pending Verification) above the NCE list.

### 6.1 Widget Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📊 Quality Metrics (Last 30 Days)                                            │
├───────────────┬───────────────┬───────────────┬──────────────────────────────┤
│ Total NCEs    │ Avg Resolution│ CAPA Effective│ Recurrence Rate              │
│     47        │   5.2 days    │     94%       │      6%                      │
│ ▲ 12% vs prior│ ▼ 0.8 days   │ ▲ 2%          │ ▼ 2%                         │
├───────────────┴───────────────┴───────────────┴──────────────────────────────┤
│ [View Full Analytics →]                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Widget Specifications

| Element | Tag |
|---------|-----|
| Widget title | `label.nce.analytics.widget.title` — "Quality Metrics (Last 30 Days)" |
| View Full Analytics link | `label.nce.analytics.widget.viewFull` |

The widget always shows the last 30 days regardless of any filters applied to the NCE list. Clicking "View Full Analytics" navigates to NCE → Analytics.

### 6.3 Widget Refresh

The widget metrics refresh on each page load and when the dashboard list data refreshes. No separate polling interval.

---

## 7. Formal Reports

In addition to the interactive analytics page, the system generates formal reports accessible via Reports → Routine Reports → NCE Reports (or via the Export buttons on the analytics page).

### 7.1 NCE Summary Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.summary` — "NCE Summary Report" |
| Filters | Date range, Category, Severity, Status |
| Content | Total NCEs by category (pie), by severity (bar), by status, by trigger type, trend over time, average time to closure, top 5 root causes |
| Export | PDF, CSV |

### 7.2 CAPA Effectiveness Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.capaEffectiveness` — "CAPA Effectiveness Report" |
| Filters | Date range, CAPA Category, Assigned To |
| Content | Total CAPAs by status, overdue CAPAs, effectiveness review results (effective vs. recurrence), time to completion trends |
| Export | PDF, CSV |

### 7.3 Root Cause Analysis Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.rootCause` — "Root Cause Analysis Report" |
| Filters | Date range, Category, Root Cause Category |
| Content | Root cause distribution (pie), root cause by NCE category (stacked bar), root cause trends over time, Pareto analysis |
| Export | PDF, CSV |

### 7.4 User Performance Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.userPerformance` — "User Performance Report" |
| Filters | Date range, User, Department |
| Content | NCEs assigned per user, average resolution time by user, overdue NCEs by user, CAPAs completed by user |
| Export | PDF, CSV |

### 7.5 Trend Analysis Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.trendAnalysis` — "Trend Analysis Report" |
| Filters | Date range, Category, Granularity (daily/weekly/monthly) |
| Content | NCEs by day of week, by time of day, seasonal patterns, correlation with test volume |
| Export | PDF, CSV |

### 7.6 Rejection & Cancellation Quality Report

| Property | Value |
|----------|-------|
| Title | `label.nce.report.rejectionQuality` — "Rejection & Cancellation Quality Report" |
| Filters | Date range, Trigger Type, Department |
| Content | Rejection volume by reason (bar), rejection trends over time, most common reasons by department, prompt dismissal rate, cancellation volume by type (test vs. order) |
| Export | PDF, CSV |

---

## 8. API Endpoints

### 8.1 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/reports/analytics` | KPI card metrics with trend comparisons |
| GET | `/api/nce/reports/analytics/trend` | Trend data (weekly/daily/monthly NCE counts) |
| GET | `/api/nce/reports/analytics/category-breakdown` | NCE counts by category |
| GET | `/api/nce/reports/analytics/severity-distribution` | NCE counts by severity |
| GET | `/api/nce/reports/analytics/trigger-type` | NCE counts by trigger type with dismissal rates |
| GET | `/api/nce/reports/analytics/root-cause-pareto` | Root cause counts ordered for Pareto analysis |
| GET | `/api/nce/reports/analytics/rejection-reasons` | Top rejection reasons by count |
| GET | `/api/nce/reports/analytics/time-to-closure` | Average closure time by category |
| GET | `/api/nce/reports/analytics/capa-completion` | CAPA completion rate over time |
| GET | `/api/nce/reports/analytics/by-department` | NCE counts by department/test section |

### 8.2 Analytics Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dateFrom` | date | Start of analysis period |
| `dateTo` | date | End of analysis period |
| `category` | string | Filter by NCE category |
| `granularity` | string | daily, weekly, monthly (for trend data) |

### 8.3 Formal Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/reports/summary` | NCE Summary Report data |
| GET | `/api/nce/reports/capa-effectiveness` | CAPA Effectiveness Report data |
| GET | `/api/nce/reports/root-cause` | Root Cause Analysis Report data |
| GET | `/api/nce/reports/user-performance` | User Performance Report data |
| GET | `/api/nce/reports/trend` | Trend Analysis Report data |
| GET | `/api/nce/reports/rejection-quality` | Rejection & Cancellation Quality Report data |

### 8.4 Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce/reports/export` | Export any report to PDF or CSV |

**Request body:**
```json
{
  "reportType": "summary",
  "format": "pdf",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-02-18",
  "filters": {
    "category": "pre_analytical",
    "severity": null
  }
}
```

---

## 9. Acceptance Criteria

### KPI Cards
- [ ] Four KPI cards display: Total NCEs, Avg Resolution, CAPA Effectiveness, Recurrence Rate
- [ ] Each card shows the metric value and trend delta vs. prior period
- [ ] Trend arrows use green for improvement and red for worsening
- [ ] Improvement direction is correct per KPI (fewer NCEs = green, higher effectiveness = green, etc.)
- [ ] Prior period calculation is correct for each date range option

### Charts
- [ ] NCE Trend chart displays weekly line chart with area fill
- [ ] NCE Trend Y-axis is labeled "Number of NCEs" with numeric tick marks
- [ ] NCE Trend X-axis shows week-starting dates (e.g., "Dec 23", "Jan 6") labeled "Week Starting"
- [ ] NCE Trend data points display value labels above each point
- [ ] Granularity toggle switches between daily, weekly, monthly views
- [ ] Category Breakdown displays horizontal bar chart with counts and percentages
- [ ] Severity Distribution displays with correct color coding (red, orange, amber)
- [ ] Trigger Type distribution shows stacked bar with dismissal rate
- [ ] Root Cause Pareto shows bar + cumulative line with 80% reference line
- [ ] Top Rejection Reasons shows top 5 reasons by count
- [ ] Time to Closure by Category shows average days per category
- [ ] CAPA Completion Rate shows line chart with 100% target reference
- [ ] NCEs by Department shows counts sorted descending

### Filters
- [ ] Date range presets (7d, 30d, 90d, 12m) work correctly
- [ ] Custom date range picker works correctly
- [ ] Category filter applies to all charts
- [ ] All charts update when filters change
- [ ] Export CSV downloads data reflecting current filters
- [ ] Export PDF generates page snapshot reflecting current filters

### Dashboard Widget
- [ ] Widget appears on My Assignments, All NCEs, Pending Verification views
- [ ] Widget always shows last 30 days (independent of list filters)
- [ ] "View Full Analytics" navigates to NCE → Analytics
- [ ] Widget metrics are accurate and match full analytics page for the same period

### Formal Reports
- [ ] NCE Summary Report generates with correct data
- [ ] CAPA Effectiveness Report generates with correct data
- [ ] Root Cause Analysis Report generates with correct data
- [ ] User Performance Report generates with correct data
- [ ] Trend Analysis Report generates with correct data
- [ ] Rejection & Cancellation Quality Report generates with correct data
- [ ] All reports exportable to PDF
- [ ] All reports exportable to CSV

### i18n
- [ ] All chart titles, axis labels, KPI labels, filter labels, and button text use localization tags
- [ ] No hard-coded English strings in the implementation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | OpenELIS Implementation Team | Initial draft (combined document, Section 10) |
| 2.0 | 2026-02-14 | OpenELIS Implementation Team | Added dashboard widget, user performance report, trend analysis, full analytics page spec |
| 3.0 | 2026-02-18 | OpenELIS Implementation Team | Split into separate FRS. Added chart-level specifications with axis labels, colors, data types. Added formal report definitions. Added dashboard widget spec. NCE Trend chart now requires week-starting date labels on X-axis and "Number of NCEs" Y-axis label. |

---

*End of Document*
