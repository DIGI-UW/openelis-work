# Positivity Rate Report & Dashboard Widget
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Draft for Review
**Jira:** OGC-TBD
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Test Catalog, Results Entry, Reports, Dashboard

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

This feature introduces two surfaces for tracking test positivity rates in OpenELIS Global: a full-page **Positivity Rate Report** and a reusable **Dashboard Widget (PositivityRateTile)**. Labs running HIV, malaria, TB, or other disease programs need real-time visibility into what proportion of tests are returning positive results — a key metric for program monitoring and funder reporting. Currently, this requires manual extraction and spreadsheet calculation. These features compute positivity directly from OpenELIS result data, allow date range filtering with persisted selections, and support CSV export. In v1, widgets are pre-configured by the system and gated by role; in v2, per-user widget configuration will be introduced.

---

## 2. Problem Statement

**Current state:** Lab coordinators and program managers must manually export results data and calculate positivity rates in external spreadsheets. There is no built-in reporting surface in OpenELIS that shows the proportion of positive results for a given test over a time period.

**Impact:** Manual calculation is error-prone, time-consuming, and prevents timely program monitoring. Funder reporting requirements (e.g., PEPFAR, GFATM) often mandate periodic positivity rate data; delays or errors in this data risk compliance and funding.

**Proposed solution:** Introduce a configurable positivity definition per test (specific result codes or all non-normal results), a full-page report page for multi-test positivity analysis with CSV export, and a reusable dashboard widget that displays single-test positivity stats at a glance. Both surfaces persist the user's last filter selection for fast regeneration.

---

## 3. User Roles & Permissions

| Role | Report Access | Widget Access | Config Access | Notes |
|---|---|---|---|---|
| Lab Technician | None | View only (if role-gated tile is on dashboard) | None | Cannot access report page |
| Lab Supervisor | View + Export | View only | None | Can generate and export reports |
| Program Manager | View + Export | View only | None | Primary user of the report |
| Lab Administrator | View + Export | View only | Full | Configures positivity definitions |
| System Administrator | Full | Full | Full | — |

**Required permission keys:**

- `positivityReport.view` — Access the Positivity Rate Report page and generate reports
- `positivityReport.export` — Export CSV from the report
- `positivityWidget.view` — View a positivity rate dashboard widget tile

---

## 4. Functional Requirements

### 4.1 Positivity Definition — Inline in Report

There is no separate admin configuration page for positivity definitions. Users configure what counts as "positive" directly within the report filter panel at the time of report generation. This configuration is submitted as part of the report request and is not persisted server-side between sessions.

**FR-4.1-001:** The report filter panel SHALL include a typeahead search field that allows users to search all available tests by name and add one or more tests to the report.

**FR-4.1-002:** For each test added to the report, the system SHALL display an inline positivity definition form with:
- Match mode selector (radio): **Specific Result Codes** or **All Non-Normal Results**
- When "Specific Result Codes" is selected: a checkbox list of all valid coded result values for that test

**FR-4.1-003:** Users SHALL be able to remove a previously added test from the filter panel before generating.

**FR-4.1-004:** The positivity definition is submitted as part of the report API request payload for each test. The server applies the submitted definition at query time — no stored configuration is required.

**FR-4.1-005:** Validation SHALL prevent report generation if a test is set to "Specific Result Codes" but no codes are checked. An inline error SHALL indicate which test(s) are missing code selections.

### 4.2 Positivity Rate Report

**FR-4.2-001:** The system SHALL provide a Positivity Rate Report page accessible via Reports → Positivity Rate Report.

**FR-4.2-002:** The report page SHALL include a filter panel with the following controls:
- Date range: start date and end date (both required to generate)
- Test selection: multi-select of all tests that have an active positivity configuration

**FR-4.2-003:** The system SHALL persist the user's last filter selection (date range and selected tests) in the browser session, and restore it on page load with a visible notice.

**FR-4.2-004:** Upon clicking "Generate Report", the system SHALL query all completed results for the selected tests within the date range and compute for each test:
- Total tested: count of all completed results for that test in the period
- Total positive: count of results matching the positivity configuration
- Positivity rate: (Total positive ÷ Total tested) × 100, rounded to two decimal places

**FR-4.2-005:** Results SHALL be displayed in a Carbon `DataTable` with summary columns: Test Name, Total Tested, Total Positive, Positivity Rate (%), and Non-Normal Rate (%).

**FR-4.2-005a:** Each row in the report table SHALL support inline expansion to reveal a **result code breakdown sub-table**, showing for each distinct result code recorded for that test in the period: the result code label, the count of results with that code, and the percentage of total tested.

**FR-4.2-005b:** The result code breakdown SHALL include a highlighted summary row showing the **Non-Normal Rate** — the percentage of all results that are not the configured normal value. The normal value for a test is the result code designated as "normal" in the test's reference configuration (typically "Negative" for qualitative tests). If no normal value is explicitly configured, the system SHALL display the non-normal rate as "N/A" with a tooltip explaining the omission.

**FR-4.2-006:** If a selected test has zero completed results in the date range, it SHALL appear in the table with Total Tested = 0, Total Positive = 0, Positivity Rate = "N/A", and Non-Normal Rate = "N/A".

**FR-4.2-007:** The report toolbar SHALL include a "Export CSV" button. Clicking it SHALL download a CSV file named `positivity-rate-[startDate]-[endDate].csv` containing all displayed rows.

**FR-4.2-008:** The CSV export SHALL include all columns shown in the table, plus a metadata header row with the generation date and date range applied.

**FR-4.2-009:** The report SHALL display an empty state message if no tests with active positivity configurations exist.

**FR-4.2-010:** The report SHALL display an `InlineNotification` (kind="error") if the data fetch fails.

**FR-4.2-011:** The "Generate Report" button SHALL be disabled and show a loading indicator while the fetch is in progress.

**FR-4.2-012:** A "Reset" button SHALL clear all filter selections and remove the persisted session state.

### 4.3 Dashboard Widget (PositivityRateTile)

**FR-4.3-001:** The system SHALL provide a reusable React component `PositivityRateTile` that can be placed on a dashboard page.

**FR-4.3-002:** In v1, each `PositivityRateTile` instance SHALL be pre-configured by a system administrator, specifying:
- The test to display (testId, testName)
- The default preset date range (one of: LAST_7_DAYS, MONTH_TO_DATE, LAST_MONTH, QUARTER_TO_DATE)

**FR-4.3-003:** The widget SHALL display the following metrics for the configured test and selected date range:
- Positivity rate (%) — displayed prominently
- Total tested count
- Total positive count

**FR-4.3-004:** The widget SHALL include a preset date range selector with the following options, displayed as a compact button group:
- **Last 7 Days** — rolling 7-day window ending today
- **Month to Date** — first day of the current calendar month through today
- **Last Month** — first through last day of the previous calendar month
- **Quarter to Date** — first day of the current calendar quarter through today

Selecting a preset SHALL immediately fetch and display updated data without requiring a separate "Generate" button click.

**FR-4.3-004a:** Date ranges SHALL be computed dynamically at the time of selection. Persisted state is the **preset key** (e.g., LAST_7_DAYS), not the resolved start/end dates, so data is always current when the widget loads.

**FR-4.3-005:** The widget SHALL persist the user's last selected preset for that widget instance in the browser session. On page load the persisted preset SHALL be restored and data SHALL be fetched automatically.

**FR-4.3-006:** The widget SHALL display an `InlineLoading` indicator while fetching data.

**FR-4.3-007:** The widget SHALL display an `InlineNotification` (kind="error") inline within the tile if the data fetch fails.

**FR-4.3-008:** The widget SHALL display "No data available" when Total Tested = 0 for the selected date range.

**FR-4.3-009:** The widget tile SHALL be accessible to roles holding the `positivityWidget.view` permission. The dashboard page SHALL not render the tile for users lacking this permission.

**FR-4.3-010:** The widget component SHALL accept a `config` prop of shape `{ testId, testName, defaultStartDate, defaultEndDate }` to enable reuse across multiple dashboard configurations.

---

## 5. Data Model

### New Entities

**PositivityConfig**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| testId | Long | Yes | FK to Test entity |
| matchMode | Enum (SPECIFIC_CODES, ALL_ABNORMAL) | Yes | Positivity determination strategy |
| positiveResultCodes | String (comma-delimited) | Conditional | Required when matchMode = SPECIFIC_CODES; stores coded result values |
| active | Boolean | Yes | Default true; set false to deactivate without deleting |
| createdDate | Timestamp | Yes | Auto-set on creation |
| modifiedDate | Timestamp | Yes | Auto-updated on change |
| createdByUserId | Long | Yes | FK to SystemUser |

**PositivityReportPreference** *(persists last-used filter state per user)*

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| userId | Long | Yes | FK to SystemUser |
| surface | Enum (REPORT, WIDGET) | Yes | Which surface this preference belongs to |
| widgetConfigKey | String | No | Identifies widget instance for WIDGET surface |
| startDate | Date | No | Last used start date |
| endDate | Date | No | Last used end date |
| selectedTestIds | String (comma-delimited) | No | Last selected test IDs (REPORT surface only) |
| updatedDate | Timestamp | Yes | Auto-updated on change |

> **Note:** If server-side persistence for filter state is not feasible in v1, browser sessionStorage may be used as an implementation fallback. The FRS requirement (FR-4.2-003, FR-4.3-005) still holds at the UX level.

### Modified Entities

No existing entities are modified. The feature reads from existing `Analysis` and `TestResult` entities to compute positivity counts.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/reports/positivity-rate` | Compute positivity stats for given tests and date range | `positivityReport.view` |
| GET | `/api/v1/reports/positivity-rate/export` | Download CSV of positivity stats | `positivityReport.export` |
| GET | `/api/v1/positivity-config` | List all positivity configurations | `positivityConfig.view` |
| POST | `/api/v1/positivity-config` | Create a new positivity configuration | `positivityConfig.modify` |
| PUT | `/api/v1/positivity-config/{id}` | Update an existing configuration | `positivityConfig.modify` |
| DELETE | `/api/v1/positivity-config/{id}` | Delete a positivity configuration | `positivityConfig.delete` |

### Query Parameters — `/api/v1/reports/positivity-rate`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `testIds` | String (comma-delimited) | Yes | One or more test IDs |
| `startDate` | Date (YYYY-MM-DD) | Yes | Inclusive start of date range |
| `endDate` | Date (YYYY-MM-DD) | Yes | Inclusive end of date range |

### Response Shape — `/api/v1/reports/positivity-rate`

```json
{
  "generatedAt": "2026-03-19T10:00:00Z",
  "startDate": "2026-01-01",
  "endDate": "2026-03-19",
  "results": [
    {
      "testId": 42,
      "testName": "HIV Rapid Test",
      "totalTested": 1240,
      "totalPositive": 87,
      "positivityRate": 7.02,
      "normalResultCode": "Negative",
      "nonNormalRate": 8.47,
      "resultBreakdown": [
        { "resultCode": "Positive",      "count": 87,   "rate": 7.02,  "isPositive": true,  "isNormal": false },
        { "resultCode": "Negative",      "count": 1140, "rate": 91.94, "isPositive": false, "isNormal": true  },
        { "resultCode": "Invalid",       "count": 10,   "rate": 0.81,  "isPositive": false, "isNormal": false },
        { "resultCode": "Indeterminate", "count": 3,    "rate": 0.24,  "isPositive": false, "isNormal": false }
      ]
    }
  ]
}
```

> `nonNormalRate` = (totalTested − count of normalResultCode results) ÷ totalTested × 100. Null if normalResultCode is not configured for the test.

---

## 7. UI Design

See companion React mockup: `positivity-rate-mockup.jsx`

### Navigation Paths

- **Report:** Reports → Positivity Rate Report
- **Widget:** Dashboard (pre-configured placement, role-gated)
- **Admin Config:** Admin → Test Management → Positivity Configuration

### Key Screens

1. **Positivity Configuration Admin Page** — DataTable listing test/config pairs with inline row expansion for add/edit
2. **Positivity Rate Report Page** — Filter panel (Tile) + results DataTable with CSV export toolbar
3. **PositivityRateTile Widget** — Compact dashboard tile with date range picker and metric display

### Interaction Patterns

- **Inline row expansion** for positivity config add/edit (not modal)
- **Persisted filter state** restored on page load with visible `InlineNotification` (kind="info")
- **Generate button** disabled while loading; `InlineLoading` replaces spinner
- **CSV export** via browser download (Content-Disposition: attachment)
- **Empty state** rendered inside DataTable when no data is available

---

## 8. Business Rules

**BR-001:** A test that has no active positivity configuration SHALL NOT appear in the test selection MultiSelect on the report page or be configurable as a widget target.

**BR-002:** When matchMode is `SPECIFIC_CODES`, a result is counted as positive if and only if its coded result value exactly matches one of the values in `positiveResultCodes` (case-insensitive comparison).

**BR-003:** When matchMode is `ALL_ABNORMAL`, a result is counted as positive if and only if the OpenELIS abnormal flag is set on that result record.

**BR-003a:** The **Non-Normal Rate** is computed as: (count of results where resultCode ≠ normalResultCode) ÷ Total Tested × 100. The normal result code defaults to "Negative" for qualitative tests and is determined by the test's reference range configuration in OpenELIS. The non-normal rate includes all result values that are not normal — this will typically be a superset of the positivity rate (e.g., it includes "Invalid" and "Indeterminate" results in addition to "Positive").

**BR-003b:** The result code breakdown in the report SHALL enumerate every distinct result code recorded for that test in the date range, including normal, positive, and other codes (e.g., Invalid, Indeterminate, Equivocal). Each code is shown with its count and percentage of total tested. The breakdown values MUST sum to 100% of total tested.

**BR-004:** Only results in `COMPLETED` status SHALL be included in positivity calculations. Results in ENTERED, IN_PROGRESS, REJECTED, or CANCELLED status SHALL be excluded.

**BR-005:** Positivity rate SHALL be expressed as a percentage rounded to two decimal places. When Total Tested = 0, the rate SHALL be returned as `null` and displayed as "N/A".

**BR-006:** A test MAY have only one active positivity configuration at a time. Attempting to create a second active configuration for the same test SHALL return a validation error.

**BR-007:** Deactivating a positivity configuration SHALL not affect historical report data — past computations are derived from result records, not stored.

**BR-008:** Dashboard widget preset date ranges SHALL be computed at fetch time using the following rules (all dates inclusive):
- **LAST_7_DAYS:** startDate = today − 6 days; endDate = today
- **MONTH_TO_DATE:** startDate = first day of current month; endDate = today
- **LAST_MONTH:** startDate = first day of previous month; endDate = last day of previous month
- **QUARTER_TO_DATE:** startDate = first day of current calendar quarter (Q1=Jan 1, Q2=Apr 1, Q3=Jul 1, Q4=Oct 1); endDate = today

The resolved date range SHALL be displayed to the user as a subtitle beneath the preset selector (e.g., "Jan 1 – Mar 19, 2026").

**BR-008:** The date range filter is inclusive on both ends (results on startDate and endDate are included).

**BR-009:** CSV export SHALL reflect exactly the data currently displayed on screen — the same date range and test selection as the last "Generate" run.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

### Positivity Configuration Admin

| i18n Key | Default English Text |
|---|---|
| `heading.positivityConfig.pageTitle` | Positivity Configuration |
| `heading.positivityConfig.addNew` | Add Positivity Configuration |
| `heading.positivityConfig.edit` | Edit Positivity Configuration |
| `label.positivityConfig.test` | Test |
| `label.positivityConfig.matchMode` | Match Mode |
| `label.positivityConfig.matchMode.specificCodes` | Specific Result Codes |
| `label.positivityConfig.matchMode.allAbnormal` | All Non-Normal Results |
| `label.positivityConfig.positiveResultCodes` | Positive Result Code(s) |
| `label.positivityConfig.status` | Status |
| `label.positivityConfig.status.active` | Active |
| `label.positivityConfig.status.inactive` | Inactive |
| `label.positivityConfig.lastModified` | Last Modified |
| `button.positivityConfig.addNew` | Add Configuration |
| `button.positivityConfig.save` | Save |
| `button.positivityConfig.cancel` | Cancel |
| `button.positivityConfig.deactivate` | Deactivate |
| `message.positivityConfig.saveSuccess` | Positivity configuration saved successfully. |
| `message.positivityConfig.deactivateConfirm` | Are you sure you want to deactivate this configuration? |
| `message.positivityConfig.deactivateSuccess` | Configuration deactivated. |
| `error.positivityConfig.duplicateTest` | An active configuration already exists for this test. |
| `error.positivityConfig.codesRequired` | At least one positive result code is required for this match mode. |
| `placeholder.positivityConfig.selectTest` | Select a test |
| `placeholder.positivityConfig.selectCodes` | Select result codes |

### Positivity Rate Report

| i18n Key | Default English Text |
|---|---|
| `heading.positivityReport.pageTitle` | Positivity Rate Report |
| `heading.positivityReport.filters` | Report Filters |
| `heading.positivityReport.results` | Report Results |
| `label.positivityReport.startDate` | Start Date |
| `label.positivityReport.endDate` | End Date |
| `label.positivityReport.tests` | Tests |
| `label.positivityReport.testName` | Test Name |
| `label.positivityReport.totalTested` | Total Tested |
| `label.positivityReport.totalPositive` | Total Positive |
| `label.positivityReport.positivityRate` | Positivity Rate (%) |
| `label.positivityReport.nonNormalRate` | Non-Normal Rate (%) |
| `label.positivityReport.resultBreakdown` | Result Breakdown |
| `label.positivityReport.resultCode` | Result Code |
| `label.positivityReport.count` | Count |
| `label.positivityReport.rate` | Rate (%) |
| `label.positivityReport.normalResult` | Normal |
| `label.positivityReport.positiveResult` | Positive |
| `label.positivityReport.otherResult` | Other |
| `label.positivityReport.nonNormalSummary` | Non-Normal Total |
| `message.positivityReport.noNormalConfigured` | Normal result code not configured for this test. Non-normal rate unavailable. |
| `label.positivityReport.generatedAt` | Generated |
| `button.positivityReport.generate` | Generate Report |
| `button.positivityReport.reset` | Reset |
| `button.positivityReport.exportCsv` | Export CSV |
| `message.positivityReport.filtersRestored` | Your last filter selection has been restored. |
| `message.positivityReport.noTests` | No tests with active positivity configurations are available. |
| `message.positivityReport.noResults` | No completed results found for the selected tests and date range. |
| `message.positivityReport.generating` | Generating report... |
| `message.positivityReport.exportSuccess` | CSV export downloaded. |
| `error.positivityReport.fetchFailed` | Failed to load report data. Please try again. |
| `error.positivityReport.exportFailed` | CSV export failed. Please try again. |
| `error.positivityReport.startDateRequired` | Start date is required. |
| `error.positivityReport.endDateRequired` | End date is required. |
| `error.positivityReport.endBeforeStart` | End date must be after start date. |
| `error.positivityReport.testsRequired` | At least one test must be selected. |
| `placeholder.positivityReport.selectTests` | Select tests |
| `label.positivityReport.naRate` | N/A |

### Dashboard Widget

| i18n Key | Default English Text |
|---|---|
| `heading.positivityWidget.title` | Positivity Rate |
| `label.positivityWidget.totalTested` | Total Tested |
| `label.positivityWidget.totalPositive` | Total Positive |
| `label.positivityWidget.positivityRate` | Positivity Rate |
| `label.positivityWidget.noData` | No data available for this period. |
| `label.positivityWidget.preset.last7Days` | Last 7 Days |
| `label.positivityWidget.preset.monthToDate` | Month to Date |
| `label.positivityWidget.preset.lastMonth` | Last Month |
| `label.positivityWidget.preset.quarterToDate` | Quarter to Date |
| `message.positivityWidget.loading` | Loading... |
| `error.positivityWidget.fetchFailed` | Failed to load data. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Test (config) | Required; must not already have an active config | `error.positivityConfig.duplicateTest` |
| Match Mode (config) | Required | `error.positivityReport.testsRequired` |
| Positive Result Codes | Required when matchMode = SPECIFIC_CODES; min 1 code | `error.positivityConfig.codesRequired` |
| Start Date (report) | Required | `error.positivityReport.startDateRequired` |
| End Date (report) | Required; must be ≥ start date | `error.positivityReport.endBeforeStart` |
| Tests (report) | Min 1 test selected | `error.positivityReport.testsRequired` |
| Date Range (widget) | Both dates required before "Generate" is enabled | `error.positivityReport.startDateRequired` / `endDateRequired` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Positivity Rate Report page | `positivityReport.view` | Page not shown in Reports menu |
| Generate report data | `positivityReport.view` | Generate button hidden; API returns 403 |
| Export CSV | `positivityReport.export` | Export CSV button hidden; API returns 403 |
| View Positivity Config admin page | `positivityConfig.view` | Page not shown in Admin menu |
| Add/Edit positivity configuration | `positivityConfig.modify` | Add/Edit controls hidden; API returns 403 |
| Deactivate positivity configuration | `positivityConfig.modify` | Deactivate button hidden; API returns 403 |
| Delete positivity configuration | `positivityConfig.delete` | Delete option hidden; API returns 403 |
| View dashboard widget tile | `positivityWidget.view` | Widget tile not rendered on dashboard |

---

## 12. Acceptance Criteria

### Functional — Positivity Configuration

- [ ] User with `positivityConfig.view` can navigate to Admin → Test Management → Positivity Configuration
- [ ] User with `positivityConfig.modify` can create a new configuration using inline row expansion (no modal)
- [ ] Creating a config with matchMode = SPECIFIC_CODES and no codes selected shows validation error `error.positivityConfig.codesRequired`
- [ ] Creating a second active configuration for the same test shows error `error.positivityConfig.duplicateTest`
- [ ] Creating a config with matchMode = ALL_ABNORMAL succeeds without requiring result codes
- [ ] Deactivating a configuration shows a confirmation and removes it from active filtering without deleting the record
- [ ] User without `positivityConfig.modify` cannot see Add/Edit/Deactivate controls (buttons hidden; API returns 403)

### Functional — Positivity Rate Report

- [ ] User with `positivityReport.view` can access Reports → Positivity Rate Report
- [ ] The test MultiSelect only lists tests with active positivity configurations
- [ ] Generating a report with valid inputs returns correct Total Tested, Total Positive, and Positivity Rate per test
- [ ] A test with zero results in the date range appears in results with "N/A" positivity rate
- [ ] Results matching `SPECIFIC_CODES` mode count only exact code matches (case-insensitive)
- [ ] Results matching `ALL_ABNORMAL` mode count only results with abnormal flag set
- [ ] Only results in COMPLETED status are included in calculations
- [ ] Last filter selection is restored on page reload with `message.positivityReport.filtersRestored` notice
- [ ] "Reset" clears all filters and removes persisted selection
- [ ] Report table displays Non-Normal Rate column alongside Positivity Rate
- [ ] Expanding a report row shows a result code breakdown sub-table with count and rate for each result code
- [ ] Result code breakdown percentages sum to 100% of total tested
- [ ] Result codes are tagged: normal (gray), positive (green/red per rate), other (warm-gray)
- [ ] When no normal result code is configured for a test, Non-Normal Rate shows "N/A" with tooltip
- [ ] CSV export includes Non-Normal Rate column and an expanded result code breakdown section
- [ ] User with `positivityReport.export` can download a CSV matching the on-screen data
- [ ] User without `positivityReport.export` does not see the Export CSV button; API returns 403
- [ ] Generating with no tests selected shows validation error
- [ ] Generating with end date before start date shows validation error
- [ ] Report page shows error notification when API returns failure

### Functional — Dashboard Widget

- [ ] PositivityRateTile renders correctly with a valid `config` prop
- [ ] Widget displays rate %, Total Tested, and Total Positive for the configured test and date range
- [ ] Widget shows `InlineLoading` while data is being fetched
- [ ] Widget shows error notification if data fetch fails
- [ ] Widget shows "No data available" when Total Tested = 0
- [ ] User can change the date range and click Generate to refresh widget data
- [ ] Last used date range for the widget is restored on page reload
- [ ] Users without `positivityWidget.view` permission do not see the widget tile rendered

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Report page loads within 2 seconds; data generation completes within 5 seconds for up to 10 tests over a 12-month range
- [ ] Works on screens 1280px wide and above
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized requests)
- [ ] All i18n keys documented in the Localization section of this FRS
- [ ] Carbon DataTable used for all tabular data; no raw HTML tables

### Integration

- [ ] Positivity computation reads from existing Analysis/TestResult entities — no new result storage required
- [ ] CSV export is generated server-side and streamed with `Content-Disposition: attachment`
