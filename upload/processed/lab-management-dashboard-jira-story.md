# Jira Story — Lab Management Dashboard

**Summary:** Dashboard: Add Lab Management Dashboard — centralized KPI view for lab directors

**Issue Type:** Story
**Priority:** High
**Labels:** openelis-global, dashboard, fullstack
**Component:** Frontend, Backend
**Epic Link:** *(to be assigned)*
**Depends On:**
- *(Prereq A)* TAT target field (`tatTargetHours`) added to Test Catalog test entity — see Technical Notes
- *(Prereq B)* Surveillance program → test code mapping in Admin → Lab Configuration — see Technical Notes
- *(Prereq C)* Stock Forecasting module — see Technical Notes

---

## Description

### Background

Lab Directors and Managers must currently visit at least five separate modules — Results Entry, Validation, TAT Reporting, Analyzer Integrations, Inventory, and surveillance reports — to assess the operational state of the laboratory at any point in time. This fragmentation delays identification of bottlenecks such as TAT breaches, analyzer outages, QC failures, and critical stock shortages. In high-volume facilities (e.g., national reference laboratories), this navigational overhead competes directly with time available for corrective action. A centralized, auto-refreshing dashboard that surfaces actionable KPIs across all sections will eliminate this context-switching burden and improve operational response times.

Full specification: `lab-management-dashboard-frs-v1.1.md` (document version 1.2)
React mockup: `lab-management-dashboard-mockup.jsx`
Visual preview: `lab-management-dashboard-preview.html`

### Scope

**In scope:**
- New top-level sidebar navigation item: Home → Dashboard (visible only to users with `dashboard.view`)
- Six KPI summary tiles with delta indicators: Tests Today, Pending, TAT Compliance, QC Pass Rate, Analyzers Online, Stock Alerts
- Workload by Section DataTable with expandable rows — expand shows **all units** (volume view, no compliance threshold)
- Turnaround Time DataTable with expandable rows — expand icon shown **only on non-compliant sections** (< 95%); expanded view shows **only out-of-compliance units**; TAT targets sourced per-test from `tatTargetHours` on the Test Catalog `test` entity
- Quality Control section in a collapsed Accordion with QC pass rate DataTable
- Disease Surveillance Tabs (TB, HIV, Malaria, AMR) with positivity rates, counts, and 6-month sparkline trend charts
- Equipment Status DataTable: Analyzer Name, Section, Status, **Last Results Imported** (sourced from `analyzer_import_log`; no maintenance scheduling columns)
- Stock Levels DataTable: Low and Critical items only, with **Forecast (Projected Stock-Out)** column sourced from the stock forecasting module
- Critical threshold InlineNotification banners: QC < 90%, analyzer offline > 2 hours, any Critical stock item
- Section filter and Date Range filter (Today / Last 7 / 30 / 90 Days) affecting all widgets simultaneously
- Auto-refresh polling every 10 minutes by default (user-configurable 5–30 min)
- 7 read-only GET API endpoints under `/api/v1/dashboard/`; all require `dashboard.view`
- Full i18n coverage — all strings externalized via `t(key, fallback)`

**Out of scope (deferred):**
- Test-level TAT or workload drill-down — the Workplan module provides test-level workflow visibility
- Write operations of any kind — this feature is fully read-only
- Maintenance scheduling columns in the Equipment table — maintenance data is not available as structured fields in Analyzer Integrations
- Custom alert threshold configuration — thresholds are fixed per FRS (surveillance positivity thresholds configured in Prereq B)
- Export or print functionality
- Real-time WebSocket/SSE push — polling only for this version

### User Story

As a **Lab Director or Manager**, I want to **view a single consolidated dashboard showing workload, TAT compliance, QC pass rates, equipment status, stock levels, and disease surveillance trends across all lab sections**, so that **I can quickly identify operational issues requiring attention without navigating between five or more separate modules.**

---

## Acceptance Criteria

### Functional

- [ ] User with `dashboard.view` permission sees "Dashboard" in the main navigation sidebar at Home → Dashboard; user without this permission does not see the item and receives HTTP 403 on any direct API call (`FR-1-007`)
- [ ] All six KPI tiles display current values and delta indicators vs. the prior equivalent period on initial page load (`FR-2-001`, `FR-2-002`)
- [ ] TAT Compliance, QC Pass Rate, Analyzers Online, and Stock Alerts KPI tiles display Carbon `Tag` with correct color per threshold: green / warm-gray / red (`FR-2-003`)
- [ ] Workload DataTable section rows show aggregate totals; status columns use Tags: purple (Pending), blue (In Progress), green (Completed), red (Rejected) (`FR-3-001`, `FR-3-003`)
- [ ] Expanding any Workload section row reveals **all** per-unit child rows with the same columns; sum of unit totals equals the section total (`FR-3-005`, `BR-010`)
- [ ] TAT DataTable section rows with compliance ≥ 95% do **not** display an expand icon (`FR-4-007`, `BR-013`)
- [ ] Expanding a non-compliant TAT section row (< 95%) reveals only units with compliance < 95%; compliant units are not shown (`FR-4-007`, `BR-013`)
- [ ] TAT compliance is calculated at the individual test level using `tatTargetHours` from the Test Catalog; tests without a configured target are excluded from both numerator and denominator (`FR-4-006`, `BR-012`)
- [ ] Sections or units where no test has a configured TAT target display Tag kind="gray" with text "No target set" in both Target and Compliance columns (`FR-4-005`, `FR-4-006`)
- [ ] QC section is collapsed by default; expanding the Accordion reveals the QC DataTable with Tags: green (≥ 95%), warm-gray (90–94%), red (< 90%) (`FR-5-001`–`FR-5-003`)
- [ ] Disease Surveillance panel has tabs: TB, HIV, Malaria, AMR; TB is active on load; each tab shows positivity rate, total tested, total positive, and 6-month sparkline (`FR-6-001`, `FR-6-002`)
- [ ] AMR tab additionally displays MDR isolate count and MDR rate (`FR-6-004`)
- [ ] Surveillance tab with no configured test codes displays InlineNotification kind="info" (`FR-6-006`)
- [ ] Equipment DataTable columns: Analyzer Name, Section, Status, Last Results Imported; Status Tags: green (Online), warm-gray (Warning), red (Offline), blue (Maintenance) (`FR-7-001`, `FR-7-002`)
- [ ] "Last Results Imported" shows the timestamp of the most recent successful import from `analyzer_import_log`; displays "Never" if no import has occurred (`FR-7-003`, `BR-007`)
- [ ] Stock DataTable shows only Low and Critical items with a Forecast (Projected Stock-Out) column; displays empty-state InlineNotification kind="success" when all items are Normal (`FR-8-001`, `FR-8-004`, `FR-8-006`)
- [ ] Section filter updates all widgets simultaneously; Date Range filter updates all time-based metrics and charts (`FR-1-005`, `FR-1-006`)
- [ ] Section filter applies to the Equipment DataTable (only analyzers in the selected section are shown) (`FR-7-005`)
- [ ] Dashboard auto-refreshes at the configured interval; "Last updated" timestamp updates after each cycle (`FR-1-002`, `FR-1-003`)
- [ ] Manual Refresh button triggers a full reload, shows Carbon `Loading` spinner during reload, and updates the timestamp on completion (`FR-1-004`)
- [ ] Refresh interval accepts integers 5–30; values outside this range show validation error from `error.dashboard.refreshInterval` (`FR-1-002`)
- [ ] InlineNotification kind="error" banners appear for: QC pass rate < 90% in any section, any analyzer offline > 2 hours, any Critical stock item — multiple alerts appear as separate notifications (`FR-1-008`)

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX; all keys present in FRS Section 9 and added to OpenELIS message properties files (`Constitution Principle 1`)
- [ ] Dashboard renders all widgets within 3 seconds under typical network conditions
- [ ] Auto-refresh does not interrupt in-progress user interactions (filter changes, tab switches, accordion expansion)
- [ ] All status indicators use Carbon `Tag` with semantic `kind` — no custom colored spans, badges, or CSS classes (`Constitution Principle 2`)
- [ ] Page is functional on screens 1280px wide and above
- [ ] Permission enforced at both layers: UI (menu item hidden) and API (HTTP 403 for unauthorized requests) (`Constitution Principle 4`)

### Integration

- [ ] Workload counts match data in the Results Entry module for the same time period and section
- [ ] TAT compliance percentages are consistent with the TAT Reporting module (when available)
- [ ] TAT targets used for compliance calculation match the `tatTargetHours` values configured in Admin → Test Management → Test Catalog (requires Prereq A to be complete)
- [ ] Equipment status matches the analyzer connection state shown in the Analyzer Integrations module
- [ ] Stock levels match data in the Inventory module for flagged items

---

## Technical Notes

### Backend (Java/Hibernate)

- No new database entities required — the dashboard aggregates read-only data from existing tables: `sample`, `analysis`, `qc_log`, `qc_result`, `analyzer_connection`, `analyzer_import_log`, `test` (with new `tat_target_hours` field via Prereq A), `inventory_item`, `stock_level`, `test_result`
- Create `DashboardAggregationService` with DAO-layer HQL/JPQL projections returning DTOs — do not load full Hibernate entity graphs for dashboard reads
- **TAT compliance query:** For each `analysis` record in the date range with both receipt and validation timestamps, compute elapsed hours; compare to `test.tat_target_hours`; exclude records where `tat_target_hours IS NULL`. Aggregate to unit and section level. Until Prereq A is merged, all tests have a null target and compliance cells display "No target set"
- **Equipment "Last Results Imported":** `SELECT MAX(import_timestamp) FROM analyzer_import_log GROUP BY analyzer_id`
- Add `dashboard.view` permission key to the permissions table; apply `@PreAuthorize` (or equivalent Spring Security annotation) to all `/api/v1/dashboard/**` route handlers
- Surveillance data filtered by program-mapped test codes (Prereq B); if no mapping exists, return empty result so the UI renders the info notification
- Stock Forecast column: join on `inventory_item_id` to the forecasting module's projected stock-out date (Prereq C); return null if no forecast row exists — UI displays "N/A"

### Frontend (React/Carbon)

- New top-level route and sidebar entry guarded by `dashboard.view` permission check
- Carbon components: `Tile` (KPI tiles), `DataTable` + `TableExpandRow` + `TableExpandedRow` (Workload and TAT tables), `Accordion` + `AccordionItem` (QC section), `Tabs` + `Tab` + `TabPanel` (Disease Surveillance), `Select` (Section and Date Range filters), `Loading` (refresh spinner), `InlineNotification` (alerts and empty states), `Tag` (all status indicators), `NumberInput` (refresh interval)
- `useState` for expanded row tracking, active tab, and filter state; `useEffect` with `setInterval` for auto-refresh; cancel interval on unmount
- Sparkline trend charts: lightweight SVG `<polyline>` computed from the 6-month positivity rate array — no external charting library required
- Filter changes and manual refresh call all 7 API endpoints in parallel via `Promise.all`
- Reference: `lab-management-dashboard-mockup.jsx`

### API

Seven new read-only endpoints (all GET, all require `dashboard.view`):

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/dashboard/summary` | 6 KPI tiles + delta values |
| GET | `/api/v1/dashboard/workload` | Section + unit workload counts |
| GET | `/api/v1/dashboard/tat` | TAT stats + compliance by section + unit |
| GET | `/api/v1/dashboard/quality` | QC run counts + pass rate by section |
| GET | `/api/v1/dashboard/surveillance/{program}` | program ∈ {tb, hiv, malaria, amr} |
| GET | `/api/v1/dashboard/equipment` | Analyzer status + last import timestamp |
| GET | `/api/v1/dashboard/stock` | Low/Critical stock items + projected stock-out date |

Shared query params: `section` (optional; omit or `all` for all sections), `dateRange` (optional; `today` / `7d` / `30d` / `90d`; default `today`).
All responses: `{ "data": { … }, "generatedAt": "<ISO 8601>" }`.

### Dependencies

**Blocked by (must be merged before full functionality is available):**

- **Prereq A — TAT target field on Test Catalog:** Add `tat_target_hours` (decimal, nullable) column to the `test` table and a corresponding `tatTargetHours` field to the `test` entity; add the input to the existing test edit form in Admin → Test Management → Test Catalog. A companion update to `catalog-subscription-frs-v1.0.md` adds the `ActivityDefinition → Test.tatTargetHours` FHIR field mapping so TAT targets can also be ingested via the catalog subscription flow. Until merged: all TAT Compliance cells display "No target set."

- **Prereq B — Surveillance program mapping:** Admin configuration for mapping OpenELIS test codes to TB, HIV, Malaria, and AMR programs, including per-program positivity alert thresholds. Location: Admin → Lab Configuration. Until merged: all Disease Surveillance tabs display the `label.dashboard.noProgramTests` info notification.

- **Prereq C — Stock Forecasting module:** The Forecast (Projected Stock-Out) column is sourced from the stock forecasting module's output. Until merged: Forecast column displays "N/A" for all items.

*Note: Issue links ("depends on") must be added manually in the Jira UI after story creation — the MCP API does not support setting issue links at creation time.*

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prerequisite stories not merged before this story is picked up | High | Medium | Dashboard degrades gracefully — affected columns/tabs render empty states ("No target set" / info notification / N/A). Prereqs do not block dashboard delivery itself. |
| Aggregation query performance on high-volume datasets (national reference lab) | Medium | High | Use DAO-layer DTO projections; add DB indexes on `analysis.receipt_timestamp`, `analysis.validation_timestamp`, `analyzer_import_log.import_timestamp`; benchmark with realistic data volumes before release |
| `analyzer_import_log` table structure not matching assumption | Low | Medium | Confirm table exists and has `analyzer_id` + `import_timestamp` columns before backend sprint starts |
| 6-month sparkline SVG on low-resolution screens | Low | Low | Use simple `<polyline>` SVG with no external dependency; test at 1280px minimum width |
