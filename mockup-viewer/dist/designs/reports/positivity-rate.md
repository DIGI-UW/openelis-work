# Positivity Rate Report & Dashboard Widget

## Functional Requirements Specification — v1.2

**Version:** 1.2
**Date:** 2026-09-10
**Status:** Reviewed — Ready for Development
**Jira:** OGC-433
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Test Catalog, Results Entry, Reports, Dashboard

### Revision Notes (v1.2 — 2026-09-10)

Follows up on two gaps identified in design review of v1.1:

- **Numeric-result tests.** v1.1 had no way to define positivity for a test whose result is a number (viral load, CD4 count, any quantitative assay) rather than a coded value — the inline config form only offered a checkbox list of discrete result codes. Resolved by restricting Numeric (and free-text) result types to the existing "All Non-Normal Results" match mode: OpenELIS already computes an abnormal flag (H/L/Critical) for numeric results against the test's reference range — the same derivation Custom Data Export documents for its `abnormalFlag` variable (see `designs/reports/custom-data-export.md`, Domain: TEST_RESULTS). "Specific Result Codes" remains available only for Dictionary-result tests, since those are the only ones with a discrete code list to choose from. New FR-4.1-002a, BR-002a.
- **Lab Management Dashboard integration.** v1.1's FR-4.3-002 said each widget instance is "pre-configured by a system administrator" without describing any actual mechanism, because none exists anywhere in OpenELIS. Resolved by adding a new `PositivityDashboardTile` entity (§5), seeded via migration and updated per-deployment through the same CSV-based admin import already planned for `TestSurveillanceMapping` in `designs/system/lab-management-dashboard.md` — no new admin UI in v1, consistent with that FRS's own decision to defer all other dashboard-content customization (Quick Actions, My Queue row pinning) past v1. The dashboard's Positivity Rate section links out to the full Positivity Rate Report for any test that isn't preconfigured with a tile. New §4.4, new entity in §5, new endpoint in §6. The widget's host page is now specifically the Lab Management Dashboard (`/dashboards/management`), not the generic unnamed "Dashboard" v1.1 referred to.
- **Related, not merged.** Confirmed Positivity Rate stays its own surface, separate from both Custom Data Export (a raw row-level export tool, not an aggregation tool — see the standing recommendation in that FRS's cross-reference below) and the FHIR-based Disease Surveillance Dashboard (`designs/reports/disease-surveillance-dashboard.md`, a national/ministry reporting feature built on GeneXpert FHIR data, out of scope here). Cross-referenced Custom Data Export's `abnormalFlag` variable as the raw-row equivalent of this feature's `ALL_ABNORMAL` definition, for power users who want per-result rows instead of an aggregate rate. Ad hoc "Specific Result Codes" definitions remain unavailable as a static export column, since they're chosen per report run, not a stored property of the result — that ad hoc-ness is exactly why this report exists as its own surface.

### Revision Notes (v1.1 — 2026-09-10)

v1.0 described two incompatible models at once: the Executive Summary and §4.1 said positivity definitions are configured inline per report run with nothing persisted, while §5–7, §9, §11, and half of §12 specced a separate, persisted, admin-managed `PositivityConfig` entity with its own CRUD page. The gallery mockup registered in MANIFEST.yaml (`positivity-rate.jsx`) built the persisted-admin version; a second, unregistered Carbon mockup (`positivity-rate-carbon.jsx`) built the inline version. Jira OGC-433 already committed to the inline model ("No separate admin configuration page," "No new config entity required for v1").

This revision resolves the conflict in favor of the inline model, consistent with OGC-433 and the Carbon mockup:

- Removed the persisted `PositivityConfig` entity, its CRUD API, its admin page, its permissions, and its acceptance criteria (v1.0 §5–7, §9, §11, §12 admin block).
- Retired BR-001, BR-006, BR-007, which only made sense under the persisted-config model.
- Fixed the duplicate rule ID (two rules were both numbered BR-008); the date-range-inclusivity rule is now BR-008a.
- Fixed FR-4.2-002 and one Acceptance Criteria bullet that still described tests as coming from a list of "active positivity configurations" rather than the ad hoc typeahead-and-configure flow the rest of the document (and both mockups) actually describe.
- Fixed the widget `config` prop, which was documented three different ways across this FRS, the mockups, and the Jira ticket. Settled on the Jira ticket's shape, `{ testId, testName, defaultPreset, matchMode, positiveResultCodes }`, because it's the only one of the three that actually works under the inline model: since nothing is persisted server-side, each dashboard widget instance has to carry its own complete positivity definition rather than referencing a saved config that doesn't exist.
- Changed the report and export endpoints from GET with flat query params to POST with a JSON body, because FR-4.1-004 always required per-test `matchMode`/`positiveResultCodes` to travel with the request, which a GET query string can't cleanly carry for multiple tests.
- Removed a stray Validation Rules row that referenced a "Generate" button on the widget; the widget has no such button (FR-4.3-004 — presets auto-fetch).
- The registered gallery mockup has been swapped from the old admin-CRUD file to the Carbon/inline file (same path, `designs/reports/positivity-rate.jsx`); the old admin-CRUD version is archived at `designs/_archive/2026-09-10/positivity-rate-admin-crud-v1.0.jsx` for reference.

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

This feature introduces two surfaces for tracking test positivity rates in OpenELIS Global: a full-page **Positivity Rate Report** and a reusable **Dashboard Widget (PositivityRateTile)**. Labs running HIV, malaria, TB, or other disease programs need real-time visibility into what proportion of tests are returning positive results — a key metric for program monitoring and funder reporting. Currently, this requires manual extraction and spreadsheet calculation. These features compute positivity directly from OpenELIS result data, allow date range filtering with persisted selections, and support CSV export. Positivity definitions are configured at the point of use, not stored server-side: an ad hoc definition per report run for the report page, and a fixed definition per instance for each dashboard widget (set when the widget is placed).

The report supports any test regardless of result type. Coded (dictionary) tests can define positivity by specific result codes or by OpenELIS's existing abnormal-result flag; numeric and free-text tests are limited to the abnormal-result flag, since there is no discrete code list to define against (§4.1). The dashboard widget is hosted specifically on the Lab Management Dashboard (`designs/system/lab-management-dashboard.md`), where a small set of tiles is preconfigured per deployment rather than placed through an in-app admin UI (§4.4).

---

## 2. Problem Statement

**Current state:** Lab coordinators and program managers must manually export results data and calculate positivity rates in external spreadsheets. There is no built-in reporting surface in OpenELIS that shows the proportion of positive results for a given test over a time period.

**Impact:** Manual calculation is error-prone, time-consuming, and prevents timely program monitoring. Funder reporting requirements (e.g., PEPFAR, GFATM) often mandate periodic positivity rate data; delays or errors in this data risk compliance and funding.

**Proposed solution:** A full-page report where the user configures, per report run, which tests to include and what counts as "positive" for each (specific result codes, where the test's result type supports them, or all non-normal results); CSV export; and a reusable dashboard widget that displays single-test positivity stats at a glance using a positivity definition fixed at widget-placement time. Both surfaces persist the user's last filter selection client-side for fast regeneration.

---

## 3. User Roles & Permissions

| Role | Report Access | Widget Access | Notes |
|---|---|---|---|
| Lab Technician | None | View only (if a positivity tile is on the Lab Management Dashboard and the user holds `MANAGEMENT_DASHBOARD`) | Cannot access report page |
| Lab Supervisor | View + Export | View only | Can generate and export reports |
| Program Manager | View + Export | View only | Primary user of the report |
| System Administrator | Full | Full | Provisions dashboard tiles via seed migration / CSV import (§4.4) — not an in-app action |

**Required permission keys:**
- `positivityReport.view` — Access the Positivity Rate Report page and generate reports
- `positivityReport.export` — Export CSV from the report
- `positivityWidget.view` — View a positivity rate dashboard widget tile, wherever it is hosted

There is no separate positivity-configuration permission set. The report's per-run positivity definition isn't stored, so there's nothing to gate access to beyond the report itself. The dashboard widget's positivity definition is set per tile instance by provisioning a `PositivityDashboardTile` record (§4.4, §5) — a deploy-time / CSV-import action, not a runtime admin-UI action, so no dedicated in-app permission governs it. Visibility of the Positivity Rate section on the Lab Management Dashboard itself follows that dashboard's own `MANAGEMENT_DASHBOARD` grant (see `designs/system/lab-management-dashboard.md`, FR-MGMT-009).

---

## 4. Functional Requirements

### 4.1 Positivity Definition — Inline in Report

There is no admin configuration page for positivity definitions, and nothing about a test's positivity rule is stored between report runs. Users configure what counts as "positive" directly within the report filter panel at the time of report generation. This configuration is submitted as part of the report API request and is not persisted server-side between sessions.

**FR-4.1-001:** The report filter panel SHALL include a typeahead search field that allows users to search all available tests by name and add one or more tests to the report.

**FR-4.1-002:** For each test added to the report, the system SHALL display an inline positivity definition form with:
- Match mode selector (radio): **Specific Result Codes** or **All Non-Normal Results**
- When "Specific Result Codes" is selected: a checkbox list of all valid coded result values for that test

**FR-4.1-002a:** When the added test's result type is Numeric or free-text rather than Dictionary (coded), the inline positivity definition form SHALL display only the "All Non-Normal Results" option; the "Specific Result Codes" radio and its checkbox list SHALL NOT be rendered for that test, since there is no discrete code list to select from. See BR-002a for the underlying rule.

**FR-4.1-003:** Users SHALL be able to remove a previously added test from the filter panel before generating.

**FR-4.1-004:** The positivity definition is submitted as part of the report API request body for each test. The server applies the submitted definition at query time — no stored configuration is required.

**FR-4.1-005:** Validation SHALL prevent report generation if a test is set to "Specific Result Codes" but no codes are checked. An inline error SHALL indicate which test(s) are missing code selections.

### 4.2 Positivity Rate Report

**FR-4.2-001:** The system SHALL provide a Positivity Rate Report page accessible via Reports → Positivity Rate Report.

**FR-4.2-002:** The report page SHALL include a filter panel with the following controls:
- Date range: start date and end date (both required to generate)
- Test selection: the typeahead search and inline per-test positivity definition described in §4.1. There is no pre-existing list of "configured" tests to choose from — any test can be added and its positivity rule set on the spot.

**FR-4.2-003:** The system SHALL persist the user's last filter selection (date range, selected tests, and their per-test positivity definitions) in browser session storage, and restore it on page load with a visible notice.

**FR-4.2-004:** Upon clicking "Generate Report", the system SHALL query all completed results for the selected tests within the date range and compute for each test:
- Total tested: count of all completed results for that test in the period
- Total positive: count of results matching the positivity configuration
- Positivity rate: (Total positive ÷ Total tested) × 100, rounded to two decimal places

**FR-4.2-005:** Results SHALL be displayed in a Carbon `DataTable` with summary columns: Test Name, Total Tested, Total Positive, Positivity Rate (%), and Non-Normal Rate (%).

**FR-4.2-005a:** Each row in the report table SHALL support inline expansion to reveal a **result code breakdown sub-table**, showing for each distinct result code recorded for that test in the period: the result code label, the count of results with that code, and the percentage of total tested.

**FR-4.2-005b:** The result code breakdown SHALL include a highlighted summary row showing the **Non-Normal Rate** — the percentage of all results that are not the configured normal value. The normal value for a test is the result code designated as "normal" in the test's reference configuration (typically "Negative" for qualitative tests). If no normal value is explicitly configured, the system SHALL display the non-normal rate as "N/A" with a tooltip explaining the omission.

**FR-4.2-006:** If a selected test has zero completed results in the date range, it SHALL appear in the table with Total Tested = 0, Total Positive = 0, Positivity Rate = "N/A", and Non-Normal Rate = "N/A".

**FR-4.2-007:** The report toolbar SHALL include an "Export CSV" button. Clicking it SHALL download a CSV file named `positivity-rate-[startDate]-[endDate].csv` containing all displayed rows.

**FR-4.2-008:** The CSV export SHALL include all columns shown in the table, plus a metadata header row with the generation date and date range applied.

**FR-4.2-009:** The report SHALL display an empty state message prompting the user to add at least one test if none have been added.

**FR-4.2-010:** The report SHALL display an `InlineNotification` (kind="error") if the data fetch fails.

**FR-4.2-011:** The "Generate Report" button SHALL be disabled and show a loading indicator while the fetch is in progress.

**FR-4.2-012:** A "Reset" button SHALL clear all filter selections and remove the persisted session state.

### 4.3 Dashboard Widget (PositivityRateTile)

**FR-4.3-001:** The system SHALL provide a reusable React component `PositivityRateTile` that can be placed on a dashboard page.

**FR-4.3-002:** Each `PositivityRateTile` instance is provisioned from a `PositivityDashboardTile` record (§5) — not placed through an in-app admin UI. Every instance carries a complete positivity definition, since nothing is persisted server-side beyond the tile record itself:
- The test to display (`testId`, `testName`)
- The default preset date range (one of: LAST_7_DAYS, MONTH_TO_DATE, LAST_MONTH, QUARTER_TO_DATE)
- The positivity definition for that instance (`matchMode`, and `positiveResultCodes` when `matchMode` is SPECIFIC_CODES)

See §4.4 for how tiles are provisioned and hosted on the Lab Management Dashboard specifically.

**FR-4.3-003:** The widget SHALL display the following metrics for the configured test and selected date range:
- Positivity rate (%) — displayed prominently
- Total tested count
- Total positive count

**FR-4.3-004:** The widget SHALL include a preset date range selector with the following options, displayed as a compact button group:
- **Last 7 Days** — rolling 7-day window ending today
- **Month to Date** — first day of the current calendar month through today
- **Last Month** — first through last day of the previous calendar month
- **Quarter to Date** — first day of the current calendar quarter through today

Selecting a preset SHALL immediately fetch and display updated data without requiring a separate "Generate" button click. The widget has no manual date-entry controls.

**FR-4.3-004a:** Date ranges SHALL be computed dynamically at the time of selection. Persisted state is the **preset key** (e.g., LAST_7_DAYS), not the resolved start/end dates, so data is always current when the widget loads.

**FR-4.3-005:** The widget SHALL persist the user's last selected preset for that widget instance in browser session storage. On page load the persisted preset SHALL be restored and data SHALL be fetched automatically.

**FR-4.3-006:** The widget SHALL display an `InlineLoading` indicator while fetching data.

**FR-4.3-007:** The widget SHALL display an `InlineNotification` (kind="error") inline within the tile if the data fetch fails.

**FR-4.3-008:** The widget SHALL display "No data available" when Total Tested = 0 for the selected date range.

**FR-4.3-009:** The widget tile SHALL be accessible to roles holding the `positivityWidget.view` permission, in addition to whatever the hosting page requires (for the Lab Management Dashboard, `MANAGEMENT_DASHBOARD` — see §4.4, §11).

**FR-4.3-010:** The widget component SHALL accept a `config` prop of shape `{ testId, testName, defaultPreset, matchMode, positiveResultCodes }` to enable reuse across multiple dashboard configurations. `positiveResultCodes` is required when `matchMode` is `SPECIFIC_CODES` and omitted otherwise.

### 4.4 Dashboard Integration — Lab Management Dashboard

**FR-4.4-001:** The Lab Management Dashboard (`/dashboards/management`, see `designs/system/lab-management-dashboard.md`) SHALL include a Positivity Rate section rendering one `PositivityRateTile` per active `PositivityDashboardTile` record (§5), ordered by `displayOrder`.

**FR-4.4-002:** Tile instances are NOT configurable at runtime through the UI in v1. They are provisioned via a seed migration and updated per-deployment through the same CSV-based admin import mechanism already planned for `TestSurveillanceMapping` (see `designs/system/lab-management-dashboard.md` §5.2). No new admin page ships in v1.

**FR-4.4-003:** The Positivity Rate section SHALL include a "View full report" link to the standalone Positivity Rate Report page, so any test not covered by a preconfigured tile remains reachable through ad hoc report generation.

**FR-4.4-004:** If zero active `PositivityDashboardTile` records exist for a deployment, the entire Positivity Rate section SHALL be hidden from the Management Dashboard (Adaptive Rendering Rule 1, per `designs/system/lab-management-dashboard.md` FR-X-006), rather than rendering an empty section.

**FR-4.4-005:** Each rendered tile behaves exactly as specified in §4.3 (preset selector, metrics, loading/error states). The Management Dashboard hosting context only determines how the tile's config is sourced (§5) — it does not change the tile's own behavior.

---

## 5. Data Model

No entities are required for the report itself. The report reads from existing `Analysis` and `TestResult` entities to compute positivity counts; positivity definitions (report: per test per run, widget: per widget instance) travel with the request rather than being stored, except for the tile-provisioning entity below.

### New Entity — Dashboard Widget Provisioning

**`PositivityDashboardTile`** — small configuration entity, `@Audited` (Envers), following the same seed-migration + CSV-import pattern already used for `SurveillanceProgram` and `TestSurveillanceMapping` in `designs/system/lab-management-dashboard.md` §5.2.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `testId` | UUID | FK → `Test.id` |
| `matchMode` | varchar(20) | `SPECIFIC_CODES` or `ALL_ABNORMAL` |
| `positiveResultCodes` | text | Comma-separated result codes; required when `matchMode` = `SPECIFIC_CODES`, null otherwise. Only valid for Dictionary-result tests (BR-002a). |
| `defaultPreset` | varchar(20) | One of `LAST_7_DAYS` / `MONTH_TO_DATE` / `LAST_MONTH` / `QUARTER_TO_DATE` |
| `displayOrder` | int | Tile ordering within the dashboard's Positivity Rate section |
| `isActive` | boolean | Soft-disable without deleting (same pattern as `SurveillanceProgram.isActive`) |
| `modifiedAt` | timestamp | |
| `modifiedBy` | varchar | |

v1 ships with an empty default seed — unlike `TestSurveillanceMapping`'s WHO-recommended defaults, there's no universal "right" set of tests to feature on every deployment's dashboard. Each deployment provisions its own tiles at setup time via the shared CSV-import tooling. An interactive add/edit admin page is a future enhancement, consistent with the same deferral already made for `TestSurveillanceMapping` and `SurveillanceProgram`.

### Client-Side State

Filter/preset persistence (FR-4.2-003, FR-4.3-005) is implemented in browser `sessionStorage`, scoped per browser session:

| Surface | Key | Contents |
|---|---|---|
| Report | `positivity_report_filters` | Last date range, selected tests, and each test's `matchMode`/`positiveResultCodes` |
| Widget (per instance) | `positivity_widget_preset_{testId}` | Last selected preset key |

### Modified Entities

None.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| POST | `/api/v1/reports/positivity-rate` | Compute positivity stats for given tests, date range, and per-test positivity definitions | `positivityReport.view` |
| POST | `/api/v1/reports/positivity-rate/export` | Download CSV of positivity stats for the same request shape | `positivityReport.export` |
| GET | `/api/v1/reports/positivity-rate/dashboard-tiles` | Return the ordered list of active `PositivityDashboardTile` records (testId, resolved testName, matchMode, positiveResultCodes, defaultPreset, displayOrder), for the Lab Management Dashboard to render (§4.4) | `MANAGEMENT_DASHBOARD` |

POST is used for the report/export endpoints (rather than GET with query params) because each request carries a structured, per-test positivity definition (FR-4.1-004) that a flat query string can't cleanly represent for multiple tests. The dashboard-tiles endpoint is a simple GET since it takes no request-specific parameters; the Management Dashboard calls it once on load, then requests each tile's data from the report endpoint using the same shape the report page uses (a single-entry `tests` array).

### Request Body — `/api/v1/reports/positivity-rate` and `/export`

```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-03-19",
  "tests": [
    {
      "testId": 42,
      "matchMode": "SPECIFIC_CODES",
      "positiveResultCodes": ["Positive"]
    },
    {
      "testId": 7,
      "matchMode": "ALL_ABNORMAL"
    }
  ]
}
```

The widget submits the same shape with a single entry in `tests`, built from its own `config` prop (FR-4.3-010).

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

### Response Shape — `/api/v1/reports/positivity-rate/dashboard-tiles`

```json
{
  "tiles": [
    {
      "testId": 1,
      "testName": "HIV Rapid Test",
      "matchMode": "SPECIFIC_CODES",
      "positiveResultCodes": ["Positive"],
      "defaultPreset": "MONTH_TO_DATE",
      "displayOrder": 1
    }
  ]
}
```

---

## 7. UI Design

See companion React mockup: `positivity-rate.jsx`

### Navigation Paths

- **Report:** Reports → Positivity Rate Report
- **Widget:** Lab Management Dashboard (`/dashboards/management`) → Positivity Rate section, preconfigured tiles only (§4.4) — plus a "View full report" link back to the standalone report for anything not preconfigured

### Key Screens

1. **Positivity Rate Report Page** — Filter panel (Tile) + results DataTable with CSV export toolbar
2. **PositivityRateTile Widget** — Compact tile with preset date range selector and metric display
3. **Lab Management Dashboard — Positivity Rate section** — one or more PositivityRateTile widgets in a row, sourced from `PositivityDashboardTile` records, with a "View full report" link

### Interaction Patterns

- **Typeahead-add** for tests in the report filter panel, each with its own inline positivity definition (not a pre-populated multi-select)
- **Result-type-aware config form** — Dictionary-result tests offer both match modes; Numeric/free-text tests offer only "All Non-Normal Results" (FR-4.1-002a)
- **Inline row expansion** for the report's result code breakdown (not a modal)
- **Persisted filter state** restored on page load with visible `InlineNotification` (kind="info")
- **Generate button** disabled while loading; `InlineLoading` replaces spinner
- **CSV export** via browser download (Content-Disposition: attachment)
- **Empty state** rendered inside DataTable when no data is available
- Widget presets auto-fetch on selection; there is no separate "Generate" affordance on the widget
- Dashboard-hosted tiles are read-only from the UI's perspective — no add/edit/remove controls; provisioning happens outside the app (§4.4)

---

## 8. Business Rules

> BR-001, BR-006, and BR-007 (v1.0) are **retired** — they described a persisted, admin-managed positivity configuration that does not exist under the inline model (see Revision Notes). Numbering below preserves the surviving rule IDs rather than renumbering, so references elsewhere don't drift.

**BR-002:** When matchMode is `SPECIFIC_CODES`, a result is counted as positive if and only if its coded result value exactly matches one of the values in `positiveResultCodes` (case-insensitive comparison).

**BR-002a:** The `SPECIFIC_CODES` match mode SHALL only be offered for tests whose result type is Dictionary (coded). Tests with a Numeric or free-text result type SHALL only offer `ALL_ABNORMAL`, since there is no discrete code list to define against. This applies identically to the report's inline config (FR-4.1-002a) and to `PositivityDashboardTile` provisioning (§5) — a numeric test cannot be assigned `positiveResultCodes`.

**BR-003:** When matchMode is `ALL_ABNORMAL`, a result is counted as positive if and only if the OpenELIS abnormal flag is set on that result record. For numeric results, this is the same H/L/Critical flag computed from the test's `ResultLimit` bounds documented in `designs/reports/custom-data-export.md` (Domain: TEST_RESULTS, `abnormalFlag`); for coded results, it is the existing abnormal designation on the result's dictionary entry.

**BR-003a:** The **Non-Normal Rate** is computed as: (count of results where resultCode ≠ normalResultCode) ÷ Total Tested × 100. The normal result code defaults to "Negative" for qualitative tests and is determined by the test's reference range configuration in OpenELIS. The non-normal rate includes all result values that are not normal — this will typically be a superset of the positivity rate (e.g., it includes "Invalid" and "Indeterminate" results in addition to "Positive").

**BR-003b:** The result code breakdown in the report SHALL enumerate every distinct result code recorded for that test in the date range, including normal, positive, and other codes (e.g., Invalid, Indeterminate, Equivocal). Each code is shown with its count and percentage of total tested. The breakdown values MUST sum to 100% of total tested.

**BR-004:** Only results in `COMPLETED` status SHALL be included in positivity calculations. Results in ENTERED, IN_PROGRESS, REJECTED, or CANCELLED status SHALL be excluded.

**BR-005:** Positivity rate SHALL be expressed as a percentage rounded to two decimal places. When Total Tested = 0, the rate SHALL be returned as `null` and displayed as "N/A".

**BR-008:** Dashboard widget preset date ranges SHALL be computed at fetch time using the following rules (all dates inclusive):
- **LAST_7_DAYS:** startDate = today − 6 days; endDate = today
- **MONTH_TO_DATE:** startDate = first day of current month; endDate = today
- **LAST_MONTH:** startDate = first day of previous month; endDate = last day of previous month
- **QUARTER_TO_DATE:** startDate = first day of current calendar quarter (Q1=Jan 1, Q2=Apr 1, Q3=Jul 1, Q4=Oct 1); endDate = today

The resolved date range SHALL be displayed to the user as a subtitle beneath the preset selector (e.g., "Jan 1 – Mar 19, 2026").

**BR-008a:** The date range filter is inclusive on both ends (results on startDate and endDate are included).

**BR-009:** CSV export SHALL reflect exactly the data currently displayed on screen — the same date range, test selection, and positivity definitions as the last "Generate" run.

**BR-010:** A `PositivityDashboardTile` record with `isActive = false` SHALL be excluded from the `dashboard-tiles` response and SHALL NOT render on the Lab Management Dashboard, without being deleted.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files.

### Positivity Definition (inline, used on the report page)

| i18n Key | Default English Text |
|---|---|
| `label.positivityConfig.matchMode` | Match Mode |
| `label.positivityConfig.matchMode.specificCodes` | Specific Result Codes |
| `label.positivityConfig.matchMode.allAbnormal` | All Non-Normal Results |
| `label.positivityConfig.positiveResultCodes` | Positive Result Code(s) |
| `label.positivityConfig.status` | Type |
| `button.positivityConfig.cancel` | Remove |
| `error.positivityConfig.codesRequired` | At least one positive result code is required for this match mode. |
| `message.positivityConfig.numericRestricted` | This test's result is numeric, so positivity is defined using "All Non-Normal Results." |

> `label.positivityConfig.status` labels the Type column (Normal/Positive/Other) in the result code breakdown, not an admin config's active/inactive state — there is no admin config. `button.positivityConfig.cancel` labels the "×" remove-test control on a test's inline config card. `message.positivityConfig.numericRestricted` is the helper caption shown in place of the Specific Result Codes option for Numeric/free-text tests (FR-4.1-002a).

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
| `message.positivityReport.noTests` | Add at least one test to generate a report. |
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

### Lab Management Dashboard Integration

| i18n Key | Default English Text |
|---|---|
| `heading.positivityDashboard.sectionTitle` | Positivity Rate |
| `link.positivityDashboard.viewFullReport` | View full report |
| `message.positivityDashboard.noTiles` | (Section hidden — see FR-4.4-004; no key needed if never rendered) |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Positive Result Codes | Required when matchMode = SPECIFIC_CODES; min 1 code | `error.positivityConfig.codesRequired` |
| Match Mode (numeric/free-text test) | SPECIFIC_CODES not selectable; UI does not render the option (FR-4.1-002a) | n/a — no error state, option simply absent |
| Start Date (report) | Required | `error.positivityReport.startDateRequired` |
| End Date (report) | Required; must be ≥ start date | `error.positivityReport.endBeforeStart` |
| Tests (report) | Min 1 test selected | `error.positivityReport.testsRequired` |

> The widget has no manual date-range entry and no "Generate" action to gate (FR-4.3-004); its only inputs are the preset buttons, which always resolve to a valid range.

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Positivity Rate Report page | `positivityReport.view` | Page not shown in Reports menu |
| Generate report data | `positivityReport.view` | Generate button hidden; API returns 403 |
| Export CSV | `positivityReport.export` | Export CSV button hidden; API returns 403 |
| View dashboard widget tile | `positivityWidget.view` | Widget tile not rendered |
| View Positivity Rate section on Lab Management Dashboard | `MANAGEMENT_DASHBOARD` (dashboard-level grant, see `designs/system/lab-management-dashboard.md` FR-MGMT-009) | Section (and the rest of the dashboard) returns 403 / "Access denied," consistent with the rest of that page |
| Provision or edit a `PositivityDashboardTile` | None (deploy-time seed migration / CSV import, not a runtime action) | N/A — there is no in-app control to deny |

---

## 12. Acceptance Criteria

### Functional — Positivity Rate Report

- [ ] User with `positivityReport.view` can access Reports → Positivity Rate Report
- [ ] The typeahead test search allows adding any test; there is no pre-populated "configured tests" list — each test's positivity definition (match mode + codes) is set inline when it's added (§4.1)
- [ ] Adding a test whose result type is Numeric or free-text shows only "All Non-Normal Results" — the "Specific Result Codes" option and its checkbox list are not rendered (FR-4.1-002a)
- [ ] Generating a report with valid inputs returns correct Total Tested, Total Positive, and Positivity Rate per test
- [ ] A test with zero results in the date range appears in results with "N/A" positivity rate
- [ ] Results matching `SPECIFIC_CODES` mode count only exact code matches (case-insensitive)
- [ ] Results matching `ALL_ABNORMAL` mode count only results with abnormal flag set, using the same abnormal-flag computation as Custom Data Export's `abnormalFlag` variable for numeric results
- [ ] Only results in COMPLETED status are included in calculations
- [ ] Last filter selection (date range, tests, and their positivity definitions) is restored on page reload with `message.positivityReport.filtersRestored` notice
- [ ] "Reset" clears all filters and removes persisted selection
- [ ] Report table displays Non-Normal Rate column alongside Positivity Rate
- [ ] Expanding a report row shows a result code breakdown sub-table with count and rate for each result code
- [ ] Result code breakdown percentages sum to 100% of total tested
- [ ] Result codes are tagged: normal (blue), positive (green), other (warm-gray)
- [ ] When no normal result code is configured for a test, Non-Normal Rate shows "N/A" with tooltip
- [ ] CSV export includes Non-Normal Rate column and an expanded result code breakdown section
- [ ] User with `positivityReport.export` can download a CSV matching the on-screen data
- [ ] User without `positivityReport.export` does not see the Export CSV button; API returns 403
- [ ] Generating with no tests added shows validation error
- [ ] Generating with a SPECIFIC_CODES test and no codes checked shows `error.positivityConfig.codesRequired` naming the affected test(s)
- [ ] Generating with end date before start date shows validation error
- [ ] Report page shows error notification when API returns failure

### Functional — Dashboard Widget

- [ ] PositivityRateTile renders correctly with a valid `config` prop (`testId`, `testName`, `defaultPreset`, `matchMode`, `positiveResultCodes` as applicable)
- [ ] Widget displays rate %, Total Tested, and Total Positive for the configured test, positivity definition, and active preset
- [ ] Selecting a preset immediately fetches updated data — no separate Generate action
- [ ] Widget shows `InlineLoading` while data is being fetched
- [ ] Widget shows error notification if data fetch fails
- [ ] Widget shows "No data available" when Total Tested = 0
- [ ] Last selected preset for the widget instance is restored on page reload (sessionStorage, keyed by testId)
- [ ] Users without `positivityWidget.view` permission do not see the widget tile rendered

### Functional — Lab Management Dashboard Integration

- [ ] The Management Dashboard renders one PositivityRateTile per active `PositivityDashboardTile` record, ordered by `displayOrder`
- [ ] A tile provisioned with `matchMode = ALL_ABNORMAL` for a numeric test renders and computes correctly (no `positiveResultCodes` present)
- [ ] The Positivity Rate section includes a working "View full report" link to the standalone report page
- [ ] With zero active `PositivityDashboardTile` records, the entire Positivity Rate section is hidden, not shown empty
- [ ] Deactivating a tile (`isActive = false`) removes it from the dashboard without deleting the record
- [ ] `GET /api/v1/reports/positivity-rate/dashboard-tiles` returns 403 for a user lacking `MANAGEMENT_DASHBOARD`
- [ ] No in-app UI exists for adding, editing, or reordering tiles in v1; provisioning is via seed migration / CSV import only

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
- [ ] No new database schema for the report itself — positivity definitions travel with the request (report) or live in each widget instance's own configuration (dashboard)
- [ ] `PositivityDashboardTile` is the only new schema addition, scoped to dashboard tile provisioning, and reuses the CSV-import tooling built for `TestSurveillanceMapping` rather than introducing a new import mechanism
