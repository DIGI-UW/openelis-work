# Reagent Forecasting — Facility-Level Stock View
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-23
**Status:** Draft for Review
**Jira:** OGC (story TBD — child of OGC-436)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Inventory, Reagent Forecasting (OGC-436 national workbench)

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

This feature provides a facility-level reagent stock view within OpenELIS for lab technicians and managers at a single site. It allows facility staff to monitor GeneXpert cartridge Days of Stock, update their current stock count, and receive proactive reorder alerts — without needing access to the national forecasting workbench. This is the facility-facing counterpart to the national/regional ReagentForecasting workbench (OGC-436), which is restricted to program managers and administrators.

---

## 2. Problem Statement

**Current state:** The national reagent forecasting workbench (OGC-436) provides stock-out prediction across all facilities but is a program-manager tool. Facility-level lab staff have no native way to see their own stock status, days of supply, or reorder alerts within OpenELIS.

**Impact:** Lab technicians manually track cartridge stock on paper or in spreadsheets. They are not notified proactively when stock is critical. Inaccurate stock data fed into the national forecasting engine reduces forecast reliability.

**Proposed solution:** Add a facility-level Reagent Stock page under Inventory in the OpenELIS sidebar. The page shows the authenticated user's facility's cartridge stock status with Days of Stock, reorder alerts, and an inline stock count update form. Stock counts entered at the facility level feed directly into the national forecasting engine (ReagentForecast entity in OGC-436).

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | View own facility; update stock count | Cannot view other facilities; cannot edit thresholds |
| Lab Manager | View own facility; update stock count; view consumption history | Cannot view other facilities unless they also hold `inventory.forecast.viewAll` |
| Program Manager / System Administrator | Access national workbench (OGC-436) | Not the primary user of this page |

**Required permission keys:**

- `inventory.stock.view` — View cartridge stock status for own facility
- `inventory.stock.update` — Enter stock on hand updates for own facility

---

## 4. Functional Requirements

### 4.1 Facility Stock Dashboard

**FR-4.1-001:** The system MUST display a stock status card for each GeneXpert cartridge type tracked for the authenticated user's facility, showing: cartridge type name, current stock on hand, Average Daily Consumption (ADC), Days of Stock (DoS), status badge, and last updated timestamp.

**FR-4.1-002:** Status badges MUST use Carbon `Tag` with semantic kinds matching the national workbench: CRITICAL=red, LOW=warm-gray, ADEQUATE=green, OVERSTOCKED=blue, INSUFFICIENT_DATA=gray.

**FR-4.1-003:** If any cartridge type has status CRITICAL or LOW, the system MUST display an `InlineNotification` (kind="error" for CRITICAL, kind="warning" for LOW) at the top of the page listing the affected cartridge types and their DoS values.

**FR-4.1-004:** The page MUST display the facility name, current date, and a summary line showing the count of cartridge types by status (e.g., "1 Critical · 2 Low · 3 Adequate").

**FR-4.1-005:** The page MUST show the date and time the forecast was last computed for the facility.

### 4.2 Stock Count Update

**FR-4.2-001:** Each cartridge type card MUST include an inline "Update Stock" action that expands in-place (no modal) to reveal a NumberInput for entering the current stock on hand.

**FR-4.2-002:** On saving a stock count update, the system MUST:
1. Record a stock correction event (not a consumption event) with timestamp and user
2. Trigger a forecast recalculation for the facility
3. Refresh the card's DoS and status without a full page reload

**FR-4.2-003:** The stock count input MUST be in whole units (cartridges). Negative values MUST be rejected.

**FR-4.2-004:** After a successful stock update, the card MUST show an inline success indicator and the updated DoS value.

### 4.3 Consumption History

**FR-4.3-001:** Each cartridge type card MUST include a collapsible "Consumption History" section (Accordion) showing a table of the last 30 days of daily consumption, with columns: Date, Tests Run, Cartridges Used.

**FR-4.3-002:** The consumption history table MUST be read-only. It is derived from `CartridgeConsumptionEvent` records (OGC-436 entity).

**FR-4.3-003:** The Accordion MUST be collapsed by default (optional/advanced config per Constitution Principle 3).

### 4.4 Navigation

**FR-4.4-001:** The facility stock page MUST be accessible from the OpenELIS sidebar under Inventory → Reagent Stock.

**FR-4.4-002:** The page MUST NOT be accessible via the Administration → Reagent Forecasting path, which is reserved for the national workbench (OGC-436).

---

## 5. Data Model

### New Entities

**StockCorrectionEvent**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| siteId | Long | Yes | FK → Organization (facility) |
| cartridgeTypeId | Long | Yes | FK → Test (GeneXpert cartridge type) |
| previousStockOnHand | Integer | Yes | Value before this correction |
| newStockOnHand | Integer | Yes | Value entered by user |
| correctedBy | String(100) | Yes | Username of submitter |
| correctedAt | Timestamp | Yes | Timestamp of correction |
| notes | String(500) | No | Optional free-text note |

### Modified Entities

**ReagentForecast** (OGC-436 entity) — add field:

| Field | Type | Notes |
|---|---|---|
| stockOnHand | Integer | Current stock on hand at time of last forecast; updated by StockCorrectionEvent |
| lastCorrectedAt | Timestamp | Timestamp of last manual stock correction |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/inventory/my-facility/stock` | Get all cartridge stock forecasts for authenticated user's facility | `inventory.stock.view` |
| PUT | `/api/v1/inventory/my-facility/stock/{cartridgeTypeId}` | Update stock on hand for a cartridge type; triggers recalculation | `inventory.stock.update` |
| GET | `/api/v1/inventory/my-facility/stock/{cartridgeTypeId}/history` | Get 30-day consumption history for a cartridge type | `inventory.stock.view` |

Note: `/my-facility` resolves the facility from the authenticated user's site assignment — no facility ID parameter required, preventing cross-facility data access.

---

## 7. UI Design

See companion React mockup: `preview-reagent-forecasting-facility.jsx`

### Navigation Path

**Inventory → Reagent Stock**

### Key Screens

1. **Facility Stock Dashboard** — Alert banner (if critical/low), summary line, per-cartridge-type stock cards in a responsive grid
2. **Stock Card — Collapsed** — Cartridge name, DoS, status Tag, stock on hand, last updated, "Update Stock" and "History" action buttons
3. **Stock Card — Update Stock Expanded** — NumberInput for new stock count, Save/Cancel inline
4. **Stock Card — History Expanded** — Accordion with 30-day consumption table

### Interaction Patterns

- **Inline expansion** within each card for stock update form (not a modal — Constitution Principle 3)
- **Accordion** for consumption history (optional/advanced, collapsed by default — Constitution Principle 3)
- **`InlineNotification`** at page top for CRITICAL/LOW alerts
- Card layout (2-column grid on 1280px+, 1-column on smaller screens)

---

## 8. Business Rules

**BR-001:** A facility user MUST only see stock data for the facility they are assigned to in their OpenELIS user profile. The `/my-facility` endpoint resolves facility from session — no facility ID is accepted as a parameter.

**BR-002:** Entering a new stock on hand value creates a `StockCorrectionEvent` record. This is distinct from a `CartridgeConsumptionEvent` (which is auto-generated from GeneXpert results). The correction does not alter consumption history.

**BR-003:** After a stock correction, the forecasting engine MUST immediately recalculate DoS for the affected cartridge type using the new `stockOnHand` value. ADC is not recalculated — it uses the current rolling window average.

**BR-004:** If a cartridge type has INSUFFICIENT_DATA status (fewer than 14 days of consumption history), DoS is displayed as "—" and a note "Insufficient history for forecast" is shown in place of the DoS value.

**BR-005:** The facility stock page shows the same status thresholds as the national workbench (CRITICAL < 7 days, LOW < reorder threshold, etc.) as configured by the program manager in OGC-436.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.facilityStock.title` | Reagent Stock |
| `heading.facilityStock.subtitle` | GeneXpert Cartridge Inventory |
| `label.facilityStock.facility` | Facility |
| `label.facilityStock.lastUpdated` | Forecast last updated |
| `label.facilityStock.stockOnHand` | Stock on Hand |
| `label.facilityStock.adc` | Avg. Daily Consumption |
| `label.facilityStock.dos` | Days of Stock |
| `label.facilityStock.status` | Status |
| `label.facilityStock.lastCorrected` | Last stock count |
| `label.facilityStock.insufficientData` | Insufficient history |
| `label.facilityStock.newStockCount` | New Stock Count (cartridges) |
| `label.facilityStock.consumptionHistory` | Consumption History (last 30 days) |
| `label.facilityStock.date` | Date |
| `label.facilityStock.testsRun` | Tests Run |
| `label.facilityStock.cartridgesUsed` | Cartridges Used |
| `label.facilityStatus.critical` | Critical |
| `label.facilityStatus.low` | Low Stock |
| `label.facilityStatus.adequate` | Adequate |
| `label.facilityStatus.overstocked` | Overstocked |
| `label.facilityStatus.insufficientData` | Insufficient Data |
| `button.facilityStock.updateStock` | Update Stock |
| `button.facilityStock.save` | Save |
| `button.facilityStock.cancel` | Cancel |
| `message.facilityStock.saveSuccess` | Stock count updated. Forecast recalculated. |
| `message.facilityStock.criticalAlert` | Critical stock level — reorder immediately. |
| `message.facilityStock.lowAlert` | Low stock — reorder recommended. |
| `error.facilityStock.negativeStock` | Stock count cannot be negative. |
| `error.facilityStock.required` | Stock count is required. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| newStockOnHand | Required | `error.facilityStock.required` |
| newStockOnHand | Must be ≥ 0 (integer) | `error.facilityStock.negativeStock` |
| newStockOnHand | Must be ≤ 100,000 | `error.facilityStock.tooHigh` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View facility stock page | `inventory.stock.view` | Page not shown in Inventory menu |
| Update stock count | `inventory.stock.update` | Update Stock button hidden; API returns 403 |
| View consumption history | `inventory.stock.view` | History accordion hidden |

**Additional security requirements:**

- The `/my-facility` endpoint MUST resolve facility from the authenticated session. Any attempt to access another facility's data via path manipulation MUST return HTTP 403.
- Facility ID MUST NOT be accepted as a URL or query parameter on `/my-facility` endpoints.

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `inventory.stock.view` can access Inventory → Reagent Stock from the sidebar
- [ ] Page shows only the authenticated user's own facility's stock data
- [ ] Each cartridge type card shows stock on hand, ADC, DoS, status Tag, and last updated timestamp
- [ ] CRITICAL cartridge types trigger a red `InlineNotification` at page top listing affected types and DoS
- [ ] LOW cartridge types trigger a warning `InlineNotification` listing affected types
- [ ] "Update Stock" expands inline within the card (no modal opens)
- [ ] Saving a new stock count records a `StockCorrectionEvent` and immediately recalculates DoS
- [ ] Updated DoS and status Tag reflect the new stock count after save without full page reload
- [ ] Negative stock count is rejected with validation error
- [ ] Consumption History accordion is collapsed by default; expands to show 30-day daily table
- [ ] INSUFFICIENT_DATA cartridges show "—" for DoS and a note instead of a forecast value

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Page loads within 2 seconds for facilities with up to 10 cartridge types
- [ ] Permissions enforced at API layer — `/my-facility` returns 403 for cross-facility access attempts
- [ ] Works on screens 1280px wide and above

### Integration

- [ ] `StockCorrectionEvent` created on every successful stock update
- [ ] Forecast recalculation uses updated `stockOnHand` immediately (synchronous or near-real-time)
- [ ] Status thresholds match the values configured in the national forecasting config (OGC-436)
- [ ] Consumption history reads from `CartridgeConsumptionEvent` records from OGC-436
