# Lab Management Dashboard
## Functional Requirements Specification — v1.0

**Version:** 1.2
**Date:** 2026-03-24
**Status:** Draft for Review
**Jira:** [To be assigned]
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Results Entry, Validation, TAT Reporting, Analyzer Integrations, Inventory, Quality Control, Test Catalog

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

The Lab Management Dashboard provides Lab Directors and Managers with a centralized, read-only, auto-refreshing view of laboratory operations across all sections. It surfaces six key performance indicators — workload, turnaround time compliance, QC pass rates, equipment status, stock levels, and disease surveillance trends (TB, HIV, Malaria, AMR) — in a single page aggregated from existing OpenELIS data. This eliminates the need for directors to context-switch across five or more modules to form an operational picture and supports faster, evidence-based decision-making.

---

## 2. Problem Statement

**Current state:** Lab Directors must individually visit Results Entry, Validation queues, TAT Reporting, analyzer logs, inventory records, and surveillance data to assess the current state of the laboratory. There is no consolidated operational view available to leadership.

**Impact:** Delayed identification of bottlenecks — TAT breaches, equipment outages, QC failures, stock shortages — leads to delayed corrective action and potential patient care impact. In high-volume facilities (e.g., national reference laboratories), directors spend significant time navigating modules rather than acting on findings. Disease surveillance trends (TB, HIV, Malaria, AMR) are particularly difficult to monitor continuously without a dedicated view.

**Proposed solution:** A dedicated Lab Management Dashboard page accessible from the main navigation sidebar. It aggregates read-only KPIs and trend data from existing OpenELIS modules, auto-refreshes every 10 minutes (configurable 5–30 min), and supports per-section filtering for comparative analysis across sections.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Director / Manager | View | Full cross-section dashboard; default Section filter = "All Sections" |
| Section Supervisor | View | Full dashboard visible; UI defaults Section filter to their assigned section |
| System Administrator | View | Full access |
| Lab Technician | None | Dashboard menu item not displayed; API returns HTTP 403 |

**Required permission keys:**

- `dashboard.view` — Grants access to the Lab Management Dashboard page. Controls menu item visibility and all API endpoint authorization. No write permissions are defined; this feature is fully read-only.

---

## 4. Functional Requirements

### 4.1 Page-Level Behavior

**FR-1-001:** The dashboard SHALL be accessible at navigation path: Home → Dashboard (new top-level sidebar item added after the existing Home link).

**FR-1-002:** The dashboard SHALL auto-refresh all widget data every 10 minutes by default. The refresh interval SHALL be user-configurable on the page between 5 minutes (minimum) and 30 minutes (maximum).

**FR-1-003:** The dashboard SHALL display a "Last updated" timestamp showing when data was most recently loaded, formatted as a 12-hour time string (e.g., "Last updated: 10:42 AM").

**FR-1-004:** The dashboard SHALL provide a manual Refresh button. Clicking it triggers an immediate full data reload and updates the "Last updated" timestamp. A Carbon `Loading` spinner SHALL appear during any data load (initial, auto-refresh, or manual).

**FR-1-005:** The dashboard SHALL provide a Section filter `Select` control. Changing the selected section SHALL update all widgets simultaneously within 2 seconds. Default value is "All Sections."

**FR-1-006:** The dashboard SHALL provide a Date Range `Select` control with four options: Today, Last 7 Days, Last 30 Days, Last 90 Days. Default value is "Today." Changing the selection updates all time-based metrics and trend charts.

**FR-1-007:** A user with `dashboard.view` permission SHALL see "Dashboard" in the main navigation sidebar. A user without this permission SHALL NOT see this menu item and SHALL receive HTTP 403 on any direct API call.

**FR-1-008:** The dashboard SHALL display a Carbon `InlineNotification` (kind="error") banner at the top of the content area whenever any of the following critical thresholds are breached: QC pass rate < 90% for any section, any configured analyzer has been offline for more than 2 hours, or any stock item has status "Critical." Multiple simultaneous alerts SHALL each appear as a separate notification.

### 4.2 KPI Summary Tiles

**FR-2-001:** The dashboard SHALL display six KPI summary tiles in a single row at the top of the content area (below the filter controls and any alert notifications):

1. **Tests Today** — Total samples received in the current calendar day, regardless of section or date range filter.
2. **Pending** — Count of samples currently in "Pending" or "In Progress" status at the time of last refresh.
3. **TAT Compliance** — Percentage of completed tests in the selected date range that met their configured TAT target.
4. **QC Pass Rate** — Percentage of QC runs that passed in the selected date range.
5. **Analyzers Online** — Count of analyzers currently online out of total configured (displayed as "N / M").
6. **Stock Alerts** — Count of inventory items currently in "Low" or "Critical" status.

**FR-2-002:** Each KPI tile SHALL display the current value prominently, and a secondary delta indicator showing change vs. the prior equivalent period (e.g., "↑ 12% vs yesterday" for Tests Today).

**FR-2-003:** Four KPI tiles SHALL display a Carbon `Tag` indicating status using the following thresholds:

| KPI | green | warm-gray | red |
|---|---|---|---|
| TAT Compliance | ≥ 95% | 85–94% | < 85% |
| QC Pass Rate | ≥ 95% | 90–94% | < 90% |
| Analyzers Online | All online | 1 offline | ≥ 2 offline |
| Stock Alerts | 0 alerts | 1–2 alerts | ≥ 3 alerts |

Tests Today and Pending tiles do not carry status Tags (they are informational counts only).

### 4.3 Workload by Section

**FR-3-001:** The dashboard SHALL display a Workload table using Carbon `DataTable` with expandable rows. Each top-level row represents a lab **section** and shows aggregate totals across all units within that section. Columns: Section, Total, Pending, In Progress, Completed, Rejected.

**FR-3-002:** When Section filter = "All Sections," all sections SHALL appear as top-level rows. When a specific section is selected, only that section's aggregate row appears (still expandable to show its units).

**FR-3-003:** The Pending, In Progress, Completed, and Rejected counts SHALL use Carbon `Tag` with kinds: purple (Pending), blue (In Progress), green (Completed), red (Rejected). Tags apply to both section-level and unit-level rows.

**FR-3-004:** The Total column SHALL display a plain number (no Tag) representing the sum of all statuses. The section-level Total is the sum of all unit totals within that section.

**FR-3-005:** Clicking the expand icon on a section row SHALL reveal one child row per lab unit within that section. **All units are shown** regardless of status (workload is a volume view, not a compliance view — there is no threshold to breach). Unit rows use the same column structure (Unit Name, Total, Pending, In Progress, Completed, Rejected). Unit rows are visually indented. Expanding or collapsing a section row does not trigger a data reload. Note: the dashboard does not expand to individual test level within a unit — test-level workload detail is available through the existing Workplan module.

### 4.4 Turnaround Time (TAT)

**FR-4-001:** The dashboard SHALL display a TAT summary `DataTable` with expandable rows. Each top-level row represents a lab **section** and shows section-level aggregate TAT statistics. Columns: Section, Target (hrs), Average (hrs), Min (hrs), Max (hrs), Compliance.

**FR-4-002:** TAT compliance SHALL be calculated as: (count of completed tests within TAT target ÷ total completed tests in period) × 100, rounded to one decimal place. Section-level compliance is a weighted average across all units within the section.

**FR-4-003:** TAT start time is the sample receipt timestamp. TAT end time is the result validation timestamp. Samples without a validation timestamp (still pending/in-progress) are excluded from the compliance calculation.

**FR-4-004:** The Compliance column SHALL use Carbon `Tag`: green (≥ 95%), warm-gray (85–94%), red (< 85%). Tags apply to both section-level and unit-level rows.

**FR-4-005:** If no TAT target is configured for a section or unit, the Target and Compliance columns SHALL display a Carbon `Tag` kind="gray" with text from i18n key `label.dashboard.noTarget`.

**FR-4-006:** TAT targets SHALL be sourced from the `tatTargetHours` field on the `test` entity in the Test Catalog (Admin → Test Management). This is a new field to be added to the `test` entity as a prerequisite story (see Section 5 — Configuration Dependencies). For each test in the selected period, the dashboard SHALL compare the actual TAT to that test's `tatTargetHours` value. Tests without a `tatTargetHours` value are **excluded from compliance calculation** (they do not inflate or deflate the rate). The section-level and unit-level TAT target displayed in the table is the volume-weighted average of the individual test targets for tests that had results in the selected period. If no test in the section/unit has a configured target, the Target cell displays `label.dashboard.noTarget` and the Compliance cell displays the "No target set" gray Tag.

**FR-4-007:** The TAT expand icon on a section row SHALL only be shown (and the row SHALL only be expandable) when that section's compliance is below the 95% green threshold. Clicking the expand icon reveals only the **out-of-compliance unit rows** (i.e., units with compliance < 95%), using the same column structure (Unit Name, Target (hrs), Average (hrs), Min (hrs), Max (hrs), Compliance). Compliant units are not shown in the expanded view — the intent is to surface what needs attention, not provide a full unit breakdown. Unit rows are visually indented. If the section is at 95% or above, no expand icon is shown. Expanding or collapsing does not trigger a data reload.

### 4.5 Quality Control Metrics

**FR-5-001:** The dashboard SHALL display a QC summary section using a Carbon `Accordion`. The accordion item is collapsed by default (optional advanced view per Constitution Principle 3).

**FR-5-002:** The expanded QC section SHALL contain a Carbon `DataTable` with columns: Section, QC Runs, Passes, Failures, Pass Rate.

**FR-5-003:** The Pass Rate column SHALL use Carbon `Tag`: green (≥ 95%), warm-gray (90–94%), red (< 90%).

**FR-5-004:** A QC failure is defined as any QC result that falls outside the configured Westgard rules for that analyte/control combination.

**FR-5-005:** If no QC data exists for a section in the selected date range, that section SHALL display "–" in all numeric columns.

### 4.6 Disease Surveillance

**FR-6-001:** The dashboard SHALL display a Disease Surveillance panel using Carbon `Tabs` with four tabs: TB, HIV, Malaria, AMR. The TB tab is active by default.

**FR-6-002:** Each surveillance tab SHALL display the following for the current month (regardless of the global Date Range filter, which applies only to trend history depth). The sparkline always shows the last 6 complete calendar months regardless of the global Date Range selection:
- Positivity rate (positive results ÷ total tested × 100, rounded to one decimal place)
- Total tested this month (count)
- Total positive this month (count)
- A sparkline trend chart showing positivity rate per month over the last 6 months

**FR-6-003:** The positivity rate SHALL be accompanied by a Carbon `Tag`: green if ≤ the lab-configured alert threshold for that program, red if > threshold. If no threshold is configured, a Tag kind="gray" with text from `label.dashboard.noThreshold` is displayed.

**FR-6-004:** The AMR tab SHALL additionally display: MDR isolate count (count of multi-drug-resistant isolates this month) and MDR rate (MDR isolates ÷ total isolates tested × 100).

**FR-6-005:** Surveillance data SHALL be sourced from existing test results in OpenELIS, filtered by the set of test codes mapped to each disease program. This mapping is a required configuration dependency (see Section 5 — Data Model Dependencies).

**FR-6-006:** If no test codes are mapped to a program, the corresponding tab SHALL display an informational `InlineNotification` (kind="info") with text from `label.dashboard.noProgramTests`.

### 4.7 Equipment Status

**FR-7-001:** The dashboard SHALL display an Equipment Status `DataTable` with columns: Analyzer Name, Section, Status, Last Results Imported. Maintenance scheduling data (last maintenance date, next maintenance due) is not included — maintenance data is not currently available as a structured field in the Analyzer Integrations module.

**FR-7-002:** The Status column SHALL use Carbon `Tag` with kinds:
- green → "Online"
- warm-gray → "Warning"
- red → "Offline"
- blue → "Maintenance"

**FR-7-003:** "Last Results Imported" SHALL reflect the date and time of the most recent successful analyzer result import, sourced from the `analyzer_import_log` table. If no import has ever occurred for this analyzer, the column displays text from `label.dashboard.never`. This timestamp is the primary operational signal for analyzer activity: a long elapsed time since the last import may indicate an offline or misconfigured analyzer even if its connection status shows "Online."

**FR-7-004:** Equipment data SHALL be sourced from the existing Analyzer Integrations module. No new equipment data entry capability is introduced in this feature.

**FR-7-005:** The Section filter SHALL apply to the Equipment table, showing only analyzers associated with the selected section.

### 4.8 Stock Levels

**FR-8-001:** The dashboard SHALL display a Stock Levels `DataTable` showing only items in "Low" or "Critical" status. Columns: Item Name, Section, Current Stock, Unit, Status, Days Remaining.

**FR-8-002:** The Status column SHALL use Carbon `Tag` with kinds:
- green → "Normal" (not shown by default filter, but used when section filter reduces all to normal)
- warm-gray → "Low"
- red → "Critical"

**FR-8-003:** "Days Remaining" is an estimate calculated as: current stock quantity ÷ average daily consumption over the prior 30 days. If insufficient consumption history exists (< 7 days), it displays text from `label.dashboard.na`.

**FR-8-004:** If all stock items are in Normal status (no Low or Critical items), the Stock section SHALL display an empty-state `InlineNotification` (kind="success") with text from `label.dashboard.noStockAlerts`.

**FR-8-005:** Stock data SHALL be sourced from the existing OpenELIS inventory/stock management module. No new stock data entry is in scope for this feature.

**FR-8-006:** The Stock Levels table SHALL include a **Forecast** column showing the projected stock-out date for each Low or Critical item, sourced from the stock forecasting module (dependent on the stock forecasting story). The forecast is calculated by the forecasting module and consumed read-only here. If forecasting data is unavailable for an item, the column displays `label.dashboard.na`.

---

## 5. Data Model

No new database entities are required. The dashboard aggregates read-only data from existing OpenELIS entities:

### Read-Only Data Sources

| Source Entity/Table | Source Module | Data Used |
|---|---|---|
| `sample`, `analysis` | Core lab workflow | Workload counts by section and status |
| `analysis` (with receipt and validation timestamps) | Results Entry / Validation | TAT calculation |
| `qc_log`, `qc_result` | Quality Control | QC pass/fail counts per section |
| `analyzer_connection`, `analyzer_import_log` | Analyzer Integrations | Equipment status, last active timestamp |
| `test` (`tat_target_hours` field) | Test Catalog | Per-test TAT target for compliance calculation |
| `inventory_item`, `stock_level` | Inventory/Stock | Stock quantities, status, consumption rate |
| `test_result` (filtered by program-mapped test codes) | Results Entry | Surveillance positivity rates and trends |

### Configuration Dependencies (Out of Scope — Separate Stories Required)

The following prerequisite stories must be completed before the indicated dashboard features render meaningful data:

1. **Surveillance program mapping** — A mapping of OpenELIS test codes to disease surveillance programs (TB, HIV, Malaria, AMR) and per-program positivity thresholds must be pre-configured in Admin settings. Until complete, surveillance tabs display the `label.dashboard.noProgramTests` informational notification.

2. **TAT target field on Test Catalog** — A new `tatTargetHours` (decimal, nullable) field must be added to the `test` entity in Admin → Test Management → Test Catalog. This is a single field addition — no new module or page is needed; it is added as a new input to the existing test edit form. Once this field exists, TAT compliance can be calculated at the individual test level, then aggregated to unit and section level on the dashboard. Until this prerequisite story is complete, all tests are treated as having no target: the TAT table shows calculated averages but the Target and Compliance columns display `label.dashboard.noTarget` for all sections and units.

3. **Stock forecasting module** — The projected stock-out date (Forecast column in FR-8-006) is sourced from the stock forecasting module. Until that story is complete, the Forecast column displays `label.dashboard.na` for all items.

---

## 6. API Endpoints

All dashboard endpoints are GET-only (read-only). All require `dashboard.view` permission. Unauthorized requests return HTTP 403.

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/dashboard/summary` | KPI rollup (6 tiles + deltas) | `dashboard.view` |
| GET | `/api/v1/dashboard/workload` | Workload by section with status breakdown | `dashboard.view` |
| GET | `/api/v1/dashboard/tat` | TAT stats and compliance by section | `dashboard.view` |
| GET | `/api/v1/dashboard/quality` | QC run counts and pass rate by section | `dashboard.view` |
| GET | `/api/v1/dashboard/surveillance/{program}` | Surveillance data; program = tb, hiv, malaria, amr | `dashboard.view` |
| GET | `/api/v1/dashboard/equipment` | Analyzer status list | `dashboard.view` |
| GET | `/api/v1/dashboard/stock` | Stock items in Low or Critical status | `dashboard.view` |

**Shared query parameters (all endpoints):**
- `section` (optional, string) — Section ID; omit or pass `all` for all sections.
- `dateRange` (optional, enum) — One of: `today`, `7d`, `30d`, `90d`. Default: `today`.

**Response format:** All endpoints return JSON with a `data` object and a `generatedAt` ISO 8601 timestamp.

---

## 7. UI Design

See companion React mockup: `lab-management-dashboard-mockup.jsx`

### Navigation Path

Home → Dashboard (new top-level item in the left sidebar, below existing "Home" link)

### Page Layout (top to bottom)

1. **Page header** — Title, Section filter Select, Date Range Select, Last Updated timestamp, Refresh button, refresh interval NumberInput
2. **Alert banner zone** — Zero or more InlineNotification (kind="error") for critical thresholds
3. **KPI tile row** — Six Tile components in a Grid row
4. **Operational tables row** — Two-column: Workload DataTable (left) + TAT DataTable (right)
5. **Quality Control section** — AccordionItem (collapsed by default) containing QC DataTable
6. **Disease Surveillance section** — Tabs (TB / HIV / Malaria / AMR) with stats + sparkline
7. **Operational footer row** — Two-column: Equipment Status DataTable (left) + Stock Levels DataTable (right)

### Interaction Patterns

- Section filter and Date Range selects update all widgets simultaneously (no submit button needed; change event triggers re-fetch)
- Tabs for disease surveillance (four programs)
- Accordion for QC detail (collapsed by default — optional/secondary information)
- Loading spinner overlays the content area during any data load cycle
- No inline row expansion, no modals — this page is fully read-only

---

## 8. Business Rules

**BR-001:** The dashboard is fully read-only. No write operations of any kind are exposed from this page.

**BR-002:** TAT calculation uses sample receipt time as the start, and result validation time as the end. Tests without a validation timestamp (still pending or in progress) are excluded from all TAT compliance calculations.

**BR-003:** The Section filter value "All Sections" returns aggregate data across all sections. Counts are summed; rates and percentages are weighted averages weighted by test volume.

**BR-004:** Disease surveillance positivity data is filtered by the test codes mapped to each program. If a test code is mapped to more than one program, its results count toward each mapped program independently.

**BR-005:** QC pass rate is calculated only over days that had at least one QC run. Days with no QC runs do not contribute to the denominator.

**BR-006:** The stock "Days Remaining" estimate requires at least 7 days of consumption history. If fewer than 7 days of history are available, display the value from `label.dashboard.na` ("N/A").

**BR-007:** Equipment "Last Results Imported" reflects the most recent successful analyzer result import timestamp from `analyzer_import_log`. If the analyzer is configured but has never had a successful import, display the value from `label.dashboard.never` ("Never"). A stale "Last Results Imported" timestamp (e.g., > 2 hours ago) is one of the conditions that triggers the analyzer offline `InlineNotification` in FR-1-008.

**BR-010:** Section-level workload and TAT rows always show aggregate totals. Unit-level rows (shown when expanded) always show only the data for that individual unit. The sum of all unit-level Total values MUST equal the section-level Total for that section.

**BR-012:** TAT compliance is calculated at the individual **test** level: a test result is "within target" if (validation timestamp − receipt timestamp) ≤ `tatTargetHours` for that test. Section and unit compliance is the proportion of test results within target across all tests with a configured target in that scope. Tests without a `tatTargetHours` value are excluded from both the numerator and denominator — they neither improve nor reduce the compliance rate.

**BR-013:** The TAT expand icon on a section row is only displayed when that section's compliance is below 95% (i.e., the section Tag is warm-gray or red). Sections at ≥ 95% compliance do not have an expand control — the expanded view would be empty anyway. In the expanded view, only units with compliance < 95% are shown.

**BR-014:** The dashboard does not show TAT data at the individual test level. Test-level TAT detail is out of scope for this feature. The Workplan module (batch-workplan-reagent-qc feature) provides test-level workflow visibility.

**BR-011:** Stock forecasting data (projected stock-out date) is sourced read-only from the stock forecasting module. The dashboard does not perform its own forecasting calculation.

**BR-008:** The auto-refresh timer resets after a manual refresh. A manual refresh does not interrupt or conflict with any in-flight auto-refresh cycle.

**BR-009:** Sections with no data in the selected date range SHALL still appear as rows in the Workload and TAT tables, with zero values in count columns and "–" in calculated rate columns.

---

## 9. Localization

All UI text is externalized via `t(key, fallback)`. The following i18n keys must be added to the OpenELIS message properties files:

| i18n Key | Default English Text |
|---|---|
| `nav.dashboard.labManagement` | Lab Management Dashboard |
| `heading.dashboard.title` | Lab Management Dashboard |
| `heading.dashboard.kpi` | Key Performance Indicators |
| `heading.dashboard.workload` | Workload by Section |
| `heading.dashboard.tat` | Turnaround Time |
| `heading.dashboard.quality` | Quality Control |
| `heading.dashboard.surveillance` | Disease Surveillance |
| `heading.dashboard.equipment` | Equipment Status |
| `heading.dashboard.stock` | Stock Levels |
| `label.dashboard.section` | Section |
| `label.dashboard.allSections` | All Sections |
| `label.dashboard.dateRange` | Date Range |
| `label.dashboard.today` | Today |
| `label.dashboard.last7days` | Last 7 Days |
| `label.dashboard.last30days` | Last 30 Days |
| `label.dashboard.last90days` | Last 90 Days |
| `label.dashboard.lastUpdated` | Last updated |
| `label.dashboard.refreshInterval` | Auto-refresh every (minutes) |
| `label.dashboard.testsToday` | Tests Today |
| `label.dashboard.pending` | Pending |
| `label.dashboard.tatCompliance` | TAT Compliance |
| `label.dashboard.qcPassRate` | QC Pass Rate |
| `label.dashboard.analyzersOnline` | Analyzers Online |
| `label.dashboard.stockAlerts` | Stock Alerts |
| `label.dashboard.analyzerName` | Analyzer Name |
| `label.dashboard.status` | Status |
| `label.dashboard.lastResultsImported` | Last Results Imported |
| `label.dashboard.itemName` | Item Name |
| `label.dashboard.currentStock` | Current Stock |
| `label.dashboard.unit` | Unit |
| `label.dashboard.daysRemaining` | Days Remaining |
| `label.dashboard.stockForecast` | Projected Stock-Out |
| `label.dashboard.total` | Total |
| `label.dashboard.unitName` | Lab Unit |
| `label.dashboard.expandSection` | Expand section breakdown |
| `label.dashboard.collapseSection` | Collapse section breakdown |
| `label.dashboard.inProgress` | In Progress |
| `label.dashboard.completed` | Completed |
| `label.dashboard.rejected` | Rejected |
| `label.dashboard.target` | Target (hrs) |
| `label.dashboard.average` | Average (hrs) |
| `label.dashboard.minimum` | Min (hrs) |
| `label.dashboard.maximum` | Max (hrs) |
| `label.dashboard.compliance` | Compliance |
| `label.dashboard.qcRuns` | QC Runs |
| `label.dashboard.qcPasses` | Passes |
| `label.dashboard.qcFailures` | Failures |
| `label.dashboard.passRate` | Pass Rate |
| `label.dashboard.positivityRate` | Positivity Rate |
| `label.dashboard.totalTested` | Total Tested |
| `label.dashboard.totalPositive` | Total Positive |
| `label.dashboard.mdrCount` | MDR Isolates |
| `label.dashboard.mdrRate` | MDR Rate |
| `label.dashboard.noTarget` | No target set |
| `label.dashboard.noThreshold` | No threshold |
| `label.dashboard.noStockAlerts` | All stock levels are within normal range. |
| `label.dashboard.noProgramTests` | No tests are configured for this program. Configure mappings in Admin → Lab Configuration. |
| `label.dashboard.online` | Online |
| `label.dashboard.offline` | Offline |
| `label.dashboard.warning` | Warning |
| `label.dashboard.maintenance` | Maintenance |
| `label.dashboard.normal` | Normal |
| `label.dashboard.low` | Low |
| `label.dashboard.critical` | Critical |
| `label.dashboard.never` | Never |
| `label.dashboard.na` | N/A |
| `label.dashboard.trend` | Trend (6 months) |
| `label.dashboard.last6months` | Last 6 months |
| `label.dashboard.aboveThreshold` | Above threshold |
| `label.dashboard.withinThreshold` | Within threshold |
| `label.dashboard.tbProgram` | Tuberculosis (TB) |
| `label.dashboard.hivProgram` | HIV |
| `label.dashboard.malariaProgram` | Malaria |
| `label.dashboard.amrProgram` | Antimicrobial Resistance (AMR) |
| `label.dashboard.currentMonth` | Current Month |
| `label.dashboard.vs` | vs prior period |
| `button.dashboard.refresh` | Refresh |
| `message.dashboard.criticalQC` | QC pass rate below 90% threshold. Immediate review required. |
| `message.dashboard.analyzerOffline` | One or more analyzers have been offline for more than 2 hours. |
| `message.dashboard.criticalStock` | Critical stock shortage detected. Resupply action required. |
| `message.dashboard.refreshing` | Refreshing dashboard data… |
| `placeholder.dashboard.section` | Select section |
| `placeholder.dashboard.dateRange` | Select date range |
| `error.dashboard.refreshInterval` | Refresh interval must be between 5 and 30 minutes. |

---

## 10. Validation Rules

This dashboard is read-only. The only user-modifiable input is the refresh interval setting.

| Field | Rule | Error Key |
|---|---|---|
| Refresh interval | Integer between 5 and 30 (inclusive) | `error.dashboard.refreshInterval` |
| Section filter | Must be a valid section ID or the string "all" | Validated server-side; invalid values return all sections |
| Date range | Must be one of: today, 7d, 30d, 90d | Validated server-side; invalid values default to "today" |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View dashboard page | `dashboard.view` | "Dashboard" not shown in navigation sidebar |
| Call any dashboard API endpoint | `dashboard.view` | API returns HTTP 403; no data returned |
| Change refresh interval setting | `dashboard.view` (same permission) | Control is not shown if user lacks view permission |

No write permissions exist for this feature. All operations are read-only data aggregation.

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `dashboard.view` permission can access the Lab Management Dashboard at Home → Dashboard
- [ ] User without `dashboard.view` does not see "Dashboard" in the navigation sidebar and receives HTTP 403 on direct API access
- [ ] All six KPI tiles display correct values and delta indicators on initial page load
- [ ] TAT Compliance, QC Pass Rate, Analyzers Online, and Stock Alerts KPI tiles display Carbon Tag with correct color per FR-2-003 thresholds
- [ ] Selecting a section from the Section filter updates all widgets to reflect section-specific data
- [ ] Selecting a date range from the Date Range filter updates all time-based metrics and chart data
- [ ] Dashboard auto-refreshes every 10 minutes by default and updates the "Last updated" timestamp
- [ ] Manual Refresh button triggers a full data reload; Loading spinner displays during reload; "Last updated" timestamp updates after completion
- [ ] Refresh interval can be changed to any integer between 5 and 30; values outside this range show validation error from `error.dashboard.refreshInterval`
- [ ] Workload DataTable section-level rows display aggregate totals: Section, Total, Pending (purple Tag), In Progress (blue Tag), Completed (green Tag), Rejected (red Tag)
- [ ] Expanding a Workload section row reveals per-unit child rows with the same column structure; child row totals sum to the section total
- [ ] TAT DataTable section-level rows show aggregate TAT statistics; compliance Tags display green (≥ 95%), warm-gray (85–94%), or red (< 85%) correctly; compliance is calculated from per-test `tatTargetHours` values
- [ ] TAT section rows with compliance ≥ 95% do NOT display an expand icon
- [ ] Expanding a non-compliant TAT section row reveals only out-of-compliance unit rows (units with compliance < 95%)
- [ ] Section or unit with no tests having a configured TAT target displays Tag kind="gray" with text "No target set"
- [ ] QC section is collapsed by default; expanding the Accordion reveals the QC DataTable
- [ ] QC pass rate Tags display green (≥ 95%), warm-gray (90–94%), or red (< 90%) correctly
- [ ] Disease Surveillance panel has four tabs: TB, HIV, Malaria, AMR; TB tab is active by default
- [ ] Each surveillance tab displays positivity rate, total tested, total positive, and a 6-month sparkline trend
- [ ] AMR tab additionally shows MDR isolate count and MDR rate
- [ ] Surveillance tab for a program with no configured test codes displays InlineNotification kind="info"
- [ ] Equipment DataTable columns are: Analyzer Name, Section, Status, Last Results Imported; Status Tags: green (Online), warm-gray (Warning), red (Offline), blue (Maintenance)
- [ ] Equipment "Last Results Imported" shows the timestamp of the most recent successful import; displays "Never" if no import has occurred
- [ ] Stock DataTable shows only Low and Critical items with Forecast (projected stock-out date) column; displays empty-state InlineNotification kind="success" when all items are Normal
- [ ] InlineNotification kind="error" banners appear for: QC pass rate < 90%, analyzer offline > 2 hours, any Critical stock item
- [ ] Section filter applies to Equipment DataTable (shows only analyzers in selected section)

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] All i18n keys documented in Section 9 of this FRS
- [ ] Dashboard renders all widgets within 3 seconds under typical network conditions
- [ ] Auto-refresh does not interrupt user interaction (filter changes, tab switches, accordion expansion) in progress during a refresh cycle
- [ ] All status indicators use Carbon `Tag` with semantic `kind` — no custom colored spans, badges, or CSS classes
- [ ] Page is functional on screens 1280px wide and above
- [ ] Permissions enforced at API layer (HTTP 403 for unauthorized requests)

### Integration

- [ ] Workload counts match data visible in Results Entry module for the same time period and section
- [ ] TAT compliance percentages are consistent with data in TAT Reporting module (when available)
- [ ] Equipment status matches analyzer connection state shown in Analyzer Integrations module
- [ ] Stock levels match data in Inventory module for the same items
