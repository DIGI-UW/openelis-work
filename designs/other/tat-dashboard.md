# TAT Analytics Dashboard - Functional Requirements Specification

**Version:** 1.0  
**Date:** February 17, 2026  
**Module:** Reports → Turn Around Time → Dashboard  
**Route:** `/reports/tat/dashboard`  
**Status:** Draft (V2 — Future)

---

## 1. Overview

### Purpose

Provide a TAT Analytics Dashboard as a V2 enhancement to the TAT reporting module, offering at-a-glance operational status with KPI tiles, configurable target thresholds, compliance tracking, and real-time monitoring of orders exceeding targets. Replaces/enhances the existing homepage 96-hour delayed TAT widget.

### Scope

V2 analytics dashboard with KPIs, real-time monitoring, and configurable target thresholds. Builds on the V1 TAT Report and Calendar Management features.

### Menu Location

Reports → Turn Around Time (Dashboard view toggle within TAT module)

### Dependencies

- **TAT Report (V1)** — Underlying TAT calculation engine, segments, and data model
- **Calendar Management** — Public holiday and weekend configuration for Working Time mode

---

## 2. Dashboard Components

### 2.1 KPI Tiles

Four summary tiles across the top of the dashboard:

| KPI | Description | Trend Indicator |
|-----|-------------|-----------------|
| **Avg TAT Today** | Mean TAT for all tests validated today | vs. yesterday (↑/↓ %) |
| **STAT Avg TAT** | Mean TAT for STAT priority tests validated today | vs. yesterday (↑/↓ %) |
| **Breaching Target** | Count of tests currently past their configured TAT target | vs. yesterday (↑/↓ count) |
| **Orders in Progress** | Count of orders with at least one test not yet validated | Current count only |

- Green trend arrow for improvement, red for degradation
- Click any KPI to navigate to filtered report view

### 2.2 Target Compliance Grid

Table showing TAT target compliance by lab unit:

| Column | Description |
|--------|-------------|
| **Lab Unit** | Laboratory section name |
| **Target** | Configured TAT target (e.g., "≤ 2h") |
| **Current Median** | Median TAT for the current day/period |
| **Compliance %** | Percentage of tests meeting the target |
| **Status** | Visual progress bar: Green (≥90%), Yellow (70–89%), Red (<70%) |

### 2.3 Configurable TAT Targets

Admin interface for setting target thresholds:

- Targets configurable per **test**, **lab unit**, or **priority level**
- Example: "Hemoglobin STAT ≤ 1 hour", "Chemistry Routine ≤ 4 hours"
- Green/Yellow/Red thresholds configurable (default: ≥90% green, 70-89% yellow, <70% red)
- Targets stored in database, editable by lab managers

### 2.4 Currently Exceeding Target Panel

Live list of orders currently past their TAT target:

| Column | Description |
|--------|-------------|
| **Lab Number** | Linked to order view |
| **Test** | Test name |
| **Lab Unit** | Laboratory section |
| **Current TAT** | Elapsed time since receipt |
| **Target** | Configured target for this test |
| **Overdue By** | How far past target |

- Sorted by most overdue first
- "View all" link navigates to TAT Report Detail List filtered to delayed orders
- Auto-refreshes every 5 minutes

### 2.5 7-Day Trend Mini Chart

- Compact line chart showing median TAT for the past 7 days
- Data points are clickable to navigate to that day's report
- Shows trend direction at a glance

---

## 3. TAT Calculation Modes

Dashboard supports both calculation modes from the TAT Report:

- **Calendar Time** (default) — All elapsed hours included
- **Working Time** — Excludes weekends and public holidays (per Calendar Management configuration)

Mode toggle available in dashboard header. All KPIs, compliance calculations, and trend data reflect the selected mode.

---

## 4. Data Model Additions

```sql
CREATE TABLE tat_target (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES test(id),
    lab_unit_id INTEGER REFERENCES test_section(id),
    priority VARCHAR(20), -- ROUTINE, STAT, ASAP, or NULL (any)
    segment VARCHAR(50) NOT NULL, -- TAT segment enum
    target_hours DECIMAL(8,2) NOT NULL,
    green_threshold INTEGER DEFAULT 90, -- compliance % for green
    yellow_threshold INTEGER DEFAULT 70, -- compliance % for yellow
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES system_user(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES system_user(id),
    modified_date TIMESTAMP
);
```

---

## 5. Permissions

| Permission | Description |
|------------|-------------|
| `tat.dashboard.view` | View the TAT Dashboard |
| `tat.target.manage` | Configure TAT target thresholds |

---

## 6. Acceptance Criteria

- [ ] **AC-D1**: Dashboard accessible as a view within the TAT module
- [ ] **AC-D2**: KPI tiles show correct calculations with trend indicators vs. previous day
- [ ] **AC-D3**: Clicking a KPI navigates to filtered report view
- [ ] **AC-D4**: Target compliance grid displays configured targets vs. actual median
- [ ] **AC-D5**: Targets configurable per test, lab unit, and priority level
- [ ] **AC-D6**: Compliance percentage calculated correctly with green/yellow/red visual indicators
- [ ] **AC-D7**: Exceeding target panel shows live list of overdue orders sorted by most overdue
- [ ] **AC-D8**: Lab numbers in exceeding target panel link to order view
- [ ] **AC-D9**: Exceeding target panel auto-refreshes every 5 minutes
- [ ] **AC-D10**: 7-day trend chart renders correctly with clickable data points
- [ ] **AC-D11**: Calendar Time / Working Time toggle recalculates all dashboard values
- [ ] **AC-D12**: Homepage 96-hour widget links to dashboard (or is replaced)

---

## 7. Future Enhancements (Out of Scope)

1. **Automated Alerts** — Email/notification when TAT exceeds configured thresholds
2. **Technologist Performance** — TAT breakdown by individual technologist (with appropriate privacy controls)
3. **Referring Provider Reports** — TAT reports formatted for sending to ordering providers
4. **Scheduled Report Delivery** — Automatic generation and email delivery of TAT reports on a schedule
5. **Comparison Reports** — Compare TAT between time periods (this month vs. last month, this year vs. last year)

---

## 8. Related Specifications

| Document | Description |
|----------|-------------|
| **Calendar Management FRS** | Admin page for public holidays and weekend configuration |
| **TAT Report FRS (V1)** | Report page with summary, detail list, and trend charts |
