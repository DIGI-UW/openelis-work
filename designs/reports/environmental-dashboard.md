# Environmental Dashboard & Trend Analysis
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-10
**Status:** Draft for Review
**Jira:** TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`), recharts
**Related Modules:** Compliance Standards Administration (S-01, OGC-528), Sampling Site Registry (S-02, OGC-531), Environmental Order Entry (S-03, OGC-537), Compliance Evaluation Engine (S-05, OGC-547), Laporan Hasil (S-06, OGC-552)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Scope & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
   - 5.1 Dashboard Layout & KPI Summary
   - 5.2 Compliance Rate Trend Chart (Primary)
   - 5.3 Site Drill-Down View
   - 5.4 Exceedance Summary Table
   - 5.5 Site Comparison Bar Chart
   - 5.6 Filters & Date Range
   - 5.7 CSV Export
6. Data Model
7. API Endpoints
8. UI Design
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria

---

## 1. Executive Summary

The Environmental Dashboard (S-07) provides Lab Managers and Environmental Program Officers with a retrospective visualization of compliance trends across all monitored sampling sites. It aggregates data from completed environmental orders (S-03), compliance evaluations (S-05), and compliance standards (S-01) into monthly time-series charts, KPI summary cards, an exceedance summary table, and a site comparison view.

The dashboard answers the core management question: "How are our sites trending — are any getting worse?" It uses monthly aggregation with a default 12-month view, supports drill-down from site-level compliance rates to individual parameter breakdowns, and provides CSV export of all aggregated data for external reporting. This completes the operational visibility layer of the environmental compliance workflow.

---

## 2. Problem Statement

**Current state:** After environmental results are validated and compliance evaluations are computed (via S-05), there is no aggregate view of compliance performance over time. Lab Managers must manually review individual order results or Laporan Hasil certificates to assess whether a site's water quality is improving or deteriorating. There is no way to compare compliance rates across sites, identify parameter-level trends, or spot exceedance hotspots without exporting raw data to Excel.

**Impact:** Without trend visibility, emerging water quality problems go undetected until they become severe. Lab Managers cannot prioritize re-sampling resources effectively. Regulatory reporting to the ministry requires manual aggregation of individual certificates — a slow, error-prone process. Program officers lack a dashboard view for stakeholder briefings.

**Proposed solution:** A dedicated dashboard page at **Reports → Environmental Dashboard** that aggregates ComplianceEvaluation data into monthly compliance rate time-series, organized by sampling site. KPI cards provide at-a-glance counts (total orders, overall compliance rate, total exceedances, sites monitored). A primary line chart shows compliance rate (% parameters passing) per site over time. Clicking a site drills into per-parameter trend lines. A secondary exceedance summary table lists recent non-compliant results. All aggregated data is exportable as CSV.

---

## 3. Scope & Non-Goals

### 3.1 In Scope

- Dashboard page (Reports → Environmental Dashboard) with KPI summary cards
- Primary trend chart: compliance rate per site over time (monthly, 12-month default)
- Site drill-down: per-parameter trend lines for a selected site
- Exceedance summary table: recent non-compliant and marginal evaluations
- Site comparison bar chart: compliance rate by site for the selected period
- Filters: date range, sampling site, compliance standard
- CSV export of aggregated data tables

### 3.2 Non-Goals

- **3.2.1** Push notifications or alert rules engine — future enhancement (S-07b)
- **3.2.2** Real-time streaming data — dashboard queries on page load and manual refresh
- **3.2.3** PDF export of charts — use browser print or screenshot for now
- **3.2.4** Map visualization (GIS) — future enhancement requiring mapping library
- **3.2.5** Predictive analytics or forecasting — v1.0 is retrospective only
- **3.2.6** Weekly or quarterly aggregation toggle — v1.0 is monthly only
- **3.2.7** Embeddable dashboard widgets for the OpenELIS home page — future enhancement

---

## 4. User Roles & Permissions

| Role | View Dashboard | Export CSV | Notes |
|---|---|---|---|
| Lab Technician | Yes | Yes | Can view dashboard for orders they have access to |
| Lab Manager | Yes | Yes | Primary user — sees all sites in their lab unit |
| Environmental Program Officer | Yes | Yes | Cross-site overview for program management |
| System Administrator | Yes | Yes | Full access |

**Required permission keys:**

- `environmental.dashboard.view` — Access the Environmental Dashboard page, view KPI cards, charts, and exceedance table
- `environmental.dashboard.export` — Download CSV exports of aggregated data

---

## 5. Functional Requirements

### 5.1 Dashboard Layout & KPI Summary

**ED-1-001:** The system SHALL provide a dashboard page at **Reports → Environmental Dashboard** that displays environmental compliance trend data in a single-page layout with KPI cards, charts, and a data table.

**ED-1-002:** The dashboard SHALL display four KPI summary cards at the top of the page:

| KPI | Calculation | Icon |
|---|---|---|
| Total Orders | Count of eligible environmental orders in the selected date range | 📦 |
| Overall Compliance Rate | (Total PASS evaluations / Total evaluations) × 100, displayed as percentage | ✓ |
| Total Exceedances | Count of FAIL evaluations in the selected date range | ⚠ |
| Sites Monitored | Count of distinct sampling sites with at least one order in the date range | 📍 |

**ED-1-003:** Each KPI card SHALL display a trend indicator comparing the current period's value to the previous equivalent period (e.g., current 12 months vs. prior 12 months): arrow up (green) if improving, arrow down (red) if worsening, dash if unchanged. "Improving" means higher compliance rate and lower exceedances.

**ED-1-004:** The dashboard SHALL load data automatically when the page is opened using the default filters (all sites, all standards, last 12 months).

### 5.2 Compliance Rate Trend Chart (Primary)

**ED-2-001:** The dashboard SHALL display a primary line chart showing **compliance rate (% of parameters with PASS status)** per sampling site over time, with monthly aggregation.

**ED-2-002:** Each site SHALL be represented as a separate line with a distinct color. The legend SHALL display site name and site code.

**ED-2-003:** The X-axis SHALL show months (e.g., "Apr 2025", "May 2025", …, "Mar 2026"). The Y-axis SHALL show compliance rate from 0% to 100%.

**ED-2-004:** The chart SHALL display a horizontal reference line at 100% (full compliance) as a dashed gray line.

**ED-2-005:** If more than 6 sites are present, the chart SHALL display the top 5 sites by order volume and group remaining sites into an "Other" composite line. Users can toggle specific sites on/off via the legend.

**ED-2-006:** Hovering over a data point SHALL display a tooltip showing: site name, month, compliance rate, total parameters evaluated, pass/marginal/fail counts.

**ED-2-007:** Clicking a site line or legend entry SHALL trigger the site drill-down view (§5.3).

### 5.3 Site Drill-Down View

**ED-3-001:** When a user clicks a site in the primary chart, the dashboard SHALL display a drill-down panel below the primary chart showing per-parameter trend lines for that site.

**ED-3-002:** The drill-down panel SHALL contain a line chart with one line per parameter (e.g., pH, Turbidity, Lead, E. coli) showing the actual result value over time (monthly data points).

**ED-3-003:** For each parameter, the chart SHALL display the regulatory threshold as a horizontal reference line (dashed, colored red for MAX thresholds, blue for MIN, both for RANGE).

**ED-3-004:** The drill-down panel SHALL include a site summary header showing: site name, site code, GPS coordinates, total orders in period, current month compliance rate.

**ED-3-005:** The drill-down panel SHALL include a "Back to overview" button that collapses the panel and returns to the primary chart view.

**ED-3-006:** Descriptive parameters (e.g., Odor) SHALL be excluded from the drill-down line chart since they have no numeric value axis. They SHALL be listed in a note below the chart: "Descriptive parameters not shown: {list}."

### 5.4 Exceedance Summary Table

**ED-4-001:** The dashboard SHALL display a DataTable below the charts listing all FAIL and MARGINAL compliance evaluations within the selected date range, ordered by evaluation date descending.

**ED-4-002:** The exceedance table SHALL display the following columns:

| Column | Content | Sort |
|---|---|---|
| Date | Collection date from `complianceContext.collectionDateTime` | Yes (default desc) |
| Lab Number | Order lab number | Yes |
| Site | Sampling site name, site code below | Yes |
| Parameter | Test name | Yes |
| Result | Numeric value with unit | No |
| Threshold | Regulatory limit(s) | No |
| Status | "Non-Compliant" (red Tag) or "Marginal" (yellow Tag) | Yes |

**ED-4-003:** The table SHALL support pagination (25 rows per page default) and toolbar search filtering.

**ED-4-004:** The table SHALL display a row count summary above: "{N} exceedances found ({F} non-compliant, {M} marginal)."

### 5.5 Site Comparison Bar Chart

**ED-5-001:** The dashboard SHALL display a horizontal bar chart comparing compliance rates across all sites for the selected date range.

**ED-5-002:** Each bar SHALL represent one sampling site, colored by compliance rate: green (≥90%), yellow (70–89%), red (<70%).

**ED-5-003:** Bars SHALL be sorted by compliance rate ascending (worst sites at top) to draw attention to problem sites.

**ED-5-004:** Each bar SHALL display the compliance rate percentage as a label at the end of the bar.

### 5.6 Filters & Date Range

**ED-6-001:** The dashboard toolbar SHALL provide the following filters:

| Filter | Component | Behavior |
|---|---|---|
| Date Range | DatePicker (from/to) | Default: 12 months back from today through today |
| Sampling Site | ComboBox (searchable, multi-select) | "All Sites" default; filter to one or more specific sites |
| Compliance Standard | ComboBox (searchable) | "All Standards" default; filter to a specific standard |

**ED-6-002:** Filter changes SHALL update all dashboard components (KPI cards, all charts, exceedance table) simultaneously.

**ED-6-003:** A "Refresh" button SHALL allow manual data reload without changing filters.

**ED-6-004:** The dashboard SHALL display a "Last updated" timestamp showing when the data was last loaded.

### 5.7 CSV Export

**ED-7-001:** The dashboard SHALL provide CSV export buttons for the following data sets:

| Export | Filename Pattern | Contents |
|---|---|---|
| Compliance Trends | `compliance-trends_{from}_{to}.csv` | Monthly compliance rates per site: columns = Site, SiteCode, Month, TotalParams, PassCount, MarginalCount, FailCount, ComplianceRate |
| Exceedance List | `exceedances_{from}_{to}.csv` | All FAIL and MARGINAL evaluations: columns = Date, LabNumber, Site, SiteCode, Parameter, Result, Unit, Threshold, Status |
| Site Comparison | `site-comparison_{from}_{to}.csv` | Per-site summary: columns = Site, SiteCode, TotalOrders, TotalParams, PassCount, MarginalCount, FailCount, ComplianceRate |

**ED-7-002:** Export buttons SHALL be grouped in an OverflowMenu with a download icon in the toolbar area.

**ED-7-003:** CSV files SHALL use UTF-8 encoding with BOM for proper handling in Excel.

---

## 6. Data Model

### New Entities

None — the dashboard reads from existing entities and computes aggregations at query time or via a lightweight materialized view.

### Aggregation Queries (Server-Side)

**ComplianceTrendAggregation** — computed per API request:

| Field | Type | Source |
|---|---|---|
| siteId | Long | SamplingSite.id |
| siteName | String | SamplingSite.name |
| siteCode | String | SamplingSite.code |
| month | String (YYYY-MM) | Derived from Order.collectionDateTime |
| totalParameters | Integer | Count of ComplianceEvaluation records |
| passCount | Integer | Count where status = PASS |
| marginalCount | Integer | Count where status = MARGINAL |
| failCount | Integer | Count where status = FAIL |
| complianceRate | Double | (passCount / totalParameters) × 100 |

**ExceedanceRecord** — computed per API request:

| Field | Type | Source |
|---|---|---|
| evaluationId | Long | ComplianceEvaluation.id |
| orderId | Long | Order.id |
| labNumber | String | Order.labNumber |
| collectionDate | Timestamp | complianceContext.collectionDateTime |
| siteId | Long | SamplingSite.id |
| siteName | String | SamplingSite.name |
| siteCode | String | SamplingSite.code |
| parameterName | String | Test.name |
| resultValue | String | Result.value |
| resultUnit | String | Result.unit |
| threshold | String | ComplianceThreshold display string |
| status | Enum | FAIL or MARGINAL |

### Modified Entities

None — S-07 is read-only. It queries ComplianceEvaluation, Order, SamplingSite, ComplianceStandard, and ComplianceThreshold without modification.

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/environmental/dashboard/summary` | KPI summary (total orders, compliance rate, exceedances, sites) with trend comparison | `environmental.dashboard.view` |
| GET | `/api/v1/environmental/dashboard/compliance-trends` | Monthly compliance rate aggregation per site | `environmental.dashboard.view` |
| GET | `/api/v1/environmental/dashboard/site-drilldown/{siteId}` | Per-parameter monthly result values for a specific site | `environmental.dashboard.view` |
| GET | `/api/v1/environmental/dashboard/exceedances` | Paginated list of FAIL and MARGINAL evaluations | `environmental.dashboard.view` |
| GET | `/api/v1/environmental/dashboard/site-comparison` | Compliance rate summary per site for bar chart | `environmental.dashboard.view` |
| GET | `/api/v1/environmental/dashboard/export/trends` | CSV export of compliance trends data | `environmental.dashboard.export` |
| GET | `/api/v1/environmental/dashboard/export/exceedances` | CSV export of exceedance list | `environmental.dashboard.export` |
| GET | `/api/v1/environmental/dashboard/export/site-comparison` | CSV export of site comparison data | `environmental.dashboard.export` |

### Common Query Parameters

All dashboard endpoints accept the following query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `dateFrom` | ISO date | 12 months ago | Start of date range |
| `dateTo` | ISO date | today | End of date range |
| `siteIds` | Comma-separated Longs | all | Filter to specific site(s) |
| `standardId` | Long | all | Filter to a specific compliance standard |

### Compliance Trends Response

```json
{
  "trends": [
    {
      "siteId": 42,
      "siteName": "Intake Point A — Citarum River",
      "siteCode": "SITE-042",
      "monthly": [
        {
          "month": "2025-05",
          "totalParameters": 20,
          "passCount": 18,
          "marginalCount": 1,
          "failCount": 1,
          "complianceRate": 90.0
        }
      ]
    }
  ]
}
```

### Summary Response

```json
{
  "totalOrders": 147,
  "overallComplianceRate": 87.3,
  "totalExceedances": 42,
  "sitesMonitored": 8,
  "trendComparison": {
    "ordersTrend": "UP",
    "complianceTrend": "DOWN",
    "exceedancesTrend": "UP",
    "sitesTrend": "STABLE"
  }
}
```

---

## 8. UI Design

See companion React mockup: `S07-environmental-dashboard-mockup.jsx`

### Navigation Path

- **Reports → Environmental Dashboard**

### Key Screens

1. **Dashboard overview** — KPI cards + primary compliance rate trend chart + site comparison bar chart + exceedance summary table
2. **Site drill-down** — Inline panel below primary chart showing per-parameter trend lines for a selected site

### Interaction Patterns

- **KPI cards** with trend indicators at top of page
- **Line chart** with clickable site lines for drill-down, tooltip on hover
- **Horizontal bar chart** for site comparison, color-coded by compliance rate
- **DataTable** with pagination, search, and column sort for exceedance list
- **ComboBox filters** in toolbar for site, standard, date range
- **OverflowMenu** for CSV export options
- **Manual refresh** button with "last updated" timestamp

---

## 9. Business Rules

**BR-001:** The dashboard only includes data from orders that have ALL results validated and released AND all compliance evaluations in a non-PENDING status. This is the same eligibility criteria as S-06 (Laporan Hasil).

**BR-002:** Compliance rate is calculated as `(PASS evaluations / total evaluations) × 100`, rounded to one decimal place. MARGINAL evaluations are counted as passing for the compliance rate calculation (they meet the regulatory limit) but are separately tracked.

**BR-003:** Monthly aggregation groups orders by the month of `complianceContext.collectionDateTime`, NOT the order creation or validation date. This ensures the trend reflects when samples were actually collected.

**BR-004:** If a compliance evaluation was overridden (via S-05), the dashboard uses the **effective (overridden) status**, not the original auto-evaluated status.

**BR-005:** The trend comparison in KPI cards compares the current date range to the equivalent previous period. For the default 12-month view, this compares the last 12 months to the 12 months before that. If insufficient historical data exists, the trend indicator shows "—" (insufficient data).

**BR-006:** Sites with fewer than 3 orders in the selected date range are included in the exceedance table and site comparison but are marked with a "Low data" indicator to flag statistical unreliability.

**BR-007:** The exceedance table includes both FAIL and MARGINAL evaluations. FAIL evaluations are listed first within each date group to prioritize attention.

**BR-008:** CSV exports include all data matching the current filter criteria, not just the visible page of the DataTable. This ensures complete data for external reporting.

**BR-009:** The dashboard does not cache data — each page load or manual refresh queries the database for current results. This is acceptable because the query operates on ComplianceEvaluation records, which are only created after validation (a low-frequency event).

**BR-010:** If no data exists for the selected filters, the dashboard displays an empty state with a message: "No environmental compliance data found for the selected filters. Adjust the date range or site selection."

---

## 10. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `nav.reports.environmentalDashboard` | Environmental Dashboard |
| `heading.envDashboard.title` | Environmental Dashboard — Compliance Trends |
| `heading.envDashboard.subtitle` | Monitor compliance rates, exceedance trends, and site performance over time |
| `label.envDashboard.totalOrders` | Total Orders |
| `label.envDashboard.complianceRate` | Compliance Rate |
| `label.envDashboard.totalExceedances` | Total Exceedances |
| `label.envDashboard.sitesMonitored` | Sites Monitored |
| `label.envDashboard.trendUp` | ↑ Improving |
| `label.envDashboard.trendDown` | ↓ Worsening |
| `label.envDashboard.trendStable` | — Stable |
| `label.envDashboard.trendInsufficient` | — Insufficient data |
| `heading.envDashboard.complianceTrend` | Compliance Rate by Site |
| `heading.envDashboard.siteComparison` | Site Comparison |
| `heading.envDashboard.exceedances` | Exceedance Summary |
| `heading.envDashboard.drilldown` | Parameter Trends — {siteName} |
| `label.envDashboard.complianceRateAxis` | Compliance Rate (%) |
| `label.envDashboard.month` | Month |
| `label.envDashboard.fullCompliance` | Full Compliance (100%) |
| `label.envDashboard.date` | Date |
| `label.envDashboard.labNumber` | Lab Number |
| `label.envDashboard.site` | Site |
| `label.envDashboard.parameter` | Parameter |
| `label.envDashboard.result` | Result |
| `label.envDashboard.threshold` | Threshold |
| `label.envDashboard.status` | Status |
| `label.envDashboard.nonCompliant` | Non-Compliant |
| `label.envDashboard.marginal` | Marginal |
| `label.envDashboard.exceedanceCount` | {total} exceedances found ({fail} non-compliant, {marginal} marginal) |
| `label.envDashboard.lowData` | Low data |
| `label.envDashboard.descriptiveNote` | Descriptive parameters not shown: {list} |
| `label.envDashboard.other` | Other ({count} sites) |
| `label.envDashboard.lastUpdated` | Last updated: {timestamp} |
| `label.envDashboard.filter.dateFrom` | Date From |
| `label.envDashboard.filter.dateTo` | Date To |
| `label.envDashboard.filter.site` | Sampling Site |
| `label.envDashboard.filter.standard` | Compliance Standard |
| `label.envDashboard.filter.allSites` | All Sites |
| `label.envDashboard.filter.allStandards` | All Standards |
| `button.envDashboard.refresh` | Refresh |
| `button.envDashboard.export` | Export |
| `button.envDashboard.exportTrends` | Export Compliance Trends (CSV) |
| `button.envDashboard.exportExceedances` | Export Exceedance List (CSV) |
| `button.envDashboard.exportSiteComparison` | Export Site Comparison (CSV) |
| `button.envDashboard.backToOverview` | Back to overview |
| `message.envDashboard.noData` | No environmental compliance data found for the selected filters. Adjust the date range or site selection. |
| `message.envDashboard.exportSuccess` | CSV exported successfully. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Date From (filter) | Must be before Date To | Client-side validation, no error key |
| Date range | Maximum 24-month range | `message.envDashboard.maxRange` |
| Site selection | At least "All Sites" or one specific site | Client-side default |

---

## 12. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Environmental Dashboard | `environmental.dashboard.view` | Page not shown in Reports menu |
| Export CSV | `environmental.dashboard.export` | Export menu items hidden; API returns 403 |

---

## 13. Acceptance Criteria

### Functional

- [ ] User with `environmental.dashboard.view` can access Reports → Environmental Dashboard
- [ ] Dashboard loads automatically with default filters (all sites, all standards, 12 months)
- [ ] KPI cards display correct total orders, compliance rate, exceedance count, and site count
- [ ] KPI trend indicators correctly compare current period to prior equivalent period
- [ ] Primary line chart shows monthly compliance rate per site with distinct colors
- [ ] Hovering a data point shows tooltip with site name, month, compliance rate, and counts
- [ ] Clicking a site line opens the drill-down panel with per-parameter trend lines
- [ ] Drill-down chart shows regulatory thresholds as reference lines
- [ ] Descriptive parameters are excluded from drill-down chart with explanatory note
- [ ] "Back to overview" button collapses the drill-down panel
- [ ] Exceedance table lists all FAIL and MARGINAL evaluations, paginated, sortable
- [ ] Site comparison bar chart displays sites sorted by compliance rate ascending
- [ ] Bar colors match compliance rate thresholds (green ≥90%, yellow 70–89%, red <70%)
- [ ] Changing filters updates all dashboard components simultaneously
- [ ] "Refresh" button reloads data without changing filters
- [ ] "Last updated" timestamp displays correctly

### Export

- [ ] User with `environmental.dashboard.export` can download compliance trends CSV
- [ ] User can download exceedance list CSV
- [ ] User can download site comparison CSV
- [ ] CSV files use UTF-8 with BOM encoding
- [ ] CSV exports include all data matching filters, not just visible page

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Dashboard loads within 3 seconds for up to 1000 orders / 12 months
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized access)
- [ ] Empty state displays when no data matches filters
- [ ] Sites with < 3 orders show "Low data" indicator
