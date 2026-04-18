# Reagent Forecasting Module — GeneXpert Cartridge Stock-Out Prediction
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-23
**Status:** Draft for Review
**Jira:** [To be created — OELIS-INVT-002]
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Inventory Management, Analyzer Integration, Admin Configuration

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

This feature adds GeneXpert cartridge stock-out prediction and reorder alerting to the OpenELIS inventory module. Based on each facility's cartridge consumption history recorded in OpenELIS, the system calculates days-of-stock remaining per site, compares it against a configurable reorder threshold, and surfaces alerts to lab managers before a stock-out occurs. This is a direct replacement for Aspect/GxAlert's supply chain monitoring capability. v1 scope is limited to GeneXpert cartridges (MTB/RIF, MTB/XDR, and other GeneXpert assay types configured in the system).

---

## 2. Problem Statement

**Current state:** OpenELIS records cartridge lot usage per test result, but there is no calculation of consumption rate, no days-of-stock projection, and no alerting when stock is low. Lab managers and supply chain officers must manually count stock and estimate reorder timing — a process prone to error that has caused stock-outs in field programs.

**Impact:** GeneXpert cartridge stock-outs halt TB/HIV testing entirely. In a national program with dozens of sites, even brief stock-outs can delay patient diagnosis, miss infectious cases, and generate gaps in program data. The loss of Aspect's supply chain dashboards means this risk is unmanaged until OpenELIS provides a replacement.

**Proposed solution:** Extend the OpenELIS inventory module to compute a rolling Average Daily Consumption (ADC) per cartridge type per facility, calculate Days of Stock (DoS) remaining, and trigger configurable threshold-based alerts. Results are displayed in a workbench-style page accessible to lab managers and program managers, and published to the central FHIR repo for Superset dashboard consumption.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | None | Does not access inventory forecasting |
| Lab Manager | View + configure own facility | Can view forecast for their facility; set reorder threshold for their site |
| Supply Chain Officer | View all sites | Read-only view across all facilities; cannot modify thresholds |
| Program Manager | View all sites | Read-only; sees national rollup via Superset |
| System Administrator | Full | Can configure all thresholds; can set forecasting parameters globally |

**Required permission keys:**

- `inventory.forecast.view` — View the reagent forecasting page
- `inventory.forecast.modify` — Configure reorder thresholds and forecasting parameters
- `inventory.forecast.viewAll` — View forecasts for all facilities (not just own facility)

---

## 4. Functional Requirements

### 4.1 Consumption Tracking

**FR-1-001:** OpenELIS MUST record a cartridge consumption event whenever a GeneXpert test result is validated. Each event MUST capture: facility ID, cartridge type (assay), lot number, quantity consumed (always 1 per test), and result date.

**FR-1-002:** Consumption events MUST be linked to the existing `InventoryItem` record for the cartridge lot used. If a cartridge lot is not found in inventory (unregistered lot), the event MUST still be recorded and the lot flagged as untracked.

**FR-1-003:** Manual consumption adjustments (wastage, expiry removals) MUST be recordable by a Lab Manager via the existing inventory adjustment workflow, and MUST be included in consumption calculations.

### 4.2 Average Daily Consumption (ADC) Calculation

**FR-2-001:** OpenELIS MUST calculate ADC per cartridge type per facility using the formula:

```
ADC = Total cartridges consumed in the lookback window / Lookback window days
```

**FR-2-002:** The default lookback window MUST be 90 days. The lookback window MUST be configurable per program (globally) from 30 to 180 days by a System Administrator.

**FR-2-003:** If a facility has fewer than 14 days of consumption history, the ADC MUST be flagged as `INSUFFICIENT_DATA` and Days of Stock MUST NOT be calculated. The forecasting row for that facility MUST display a "Insufficient history" Tag.

**FR-2-004:** ADC MUST be recalculated nightly (scheduled job) and on-demand via a "Recalculate" button available to users with `inventory.forecast.modify`.

### 4.3 Days of Stock (DoS) Calculation

**FR-3-001:** OpenELIS MUST calculate Days of Stock Remaining per cartridge type per facility using:

```
DoS = Current stock on hand / ADC
```

**FR-3-002:** Current stock on hand MUST be sourced from the existing OpenELIS inventory module (sum of active, non-expired lot quantities at the facility).

**FR-3-003:** DoS MUST be recalculated whenever stock on hand changes (new receipt, consumption event, or manual adjustment).

### 4.4 Reorder Threshold Configuration

**FR-4-001:** A System Administrator or Lab Manager MUST be able to configure a reorder threshold (in days of stock) per cartridge type per facility.

**FR-4-002:** The default reorder threshold MUST be 30 days. This default MUST be configurable globally by a System Administrator and overridable per facility by a Lab Manager.

**FR-4-003:** A maximum stock threshold (in days of stock) MAY optionally be configured per facility to flag overstocking. Default is not set.

### 4.5 Stock Status Classification

**FR-5-001:** Each facility-cartridge combination MUST be classified into one of four statuses based on its DoS:

| Status | Condition | Tag kind |
|---|---|---|
| `CRITICAL` | DoS < 7 days OR stock on hand = 0 | `red` |
| `LOW` | DoS ≥ 7 and < reorder threshold | `orange` |
| `ADEQUATE` | DoS ≥ reorder threshold and ≤ max threshold (if set) | `green` |
| `OVERSTOCKED` | DoS > max threshold (if max threshold is set) | `purple` |
| `INSUFFICIENT_DATA` | < 14 days consumption history | `gray` |

**FR-5-002:** The forecasting workbench MUST default to showing all facilities. A filter MUST allow narrowing to only `CRITICAL` + `LOW` sites to focus on at-risk facilities.

### 4.6 Alerts

**FR-6-001:** When a facility-cartridge combination transitions to `CRITICAL` or `LOW` status, an `InlineNotification` alert MUST appear on the OpenELIS home dashboard for all users at that facility with `inventory.forecast.view` permission.

**FR-6-002:** Alert notifications MUST be dismissible per user. Dismissed alerts MUST reappear if the status worsens (e.g., from `LOW` to `CRITICAL`).

**FR-6-003:** Alert summary counts MUST be visible in the side navigation badge for the Inventory section when any facility has `CRITICAL` status.

**FR-6-004:** Alerts MUST include: cartridge type name, current DoS, current stock on hand, and the reorder threshold.

### 4.7 FHIR Publication

**FR-7-001:** Forecasting data (DoS, stock on hand, ADC, status, reorder threshold) MUST be published to the central FHIR repo as a FHIR R4 `SupplyDelivery` or `InventoryReport` resource per facility per cartridge type on each nightly recalculation.

**FR-7-002:** Published FHIR resources MUST include the facility `Organization` reference and the cartridge item code so Superset can aggregate supply data across sites.

---

## 5. Data Model

### New Entities

**CartridgeConsumptionEvent**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| facilityId | Long | Yes | FK → Organization |
| cartridgeType | String(128) | Yes | Assay name, e.g., "MTB/RIF Ultra" |
| cartridgeTypeCode | String(64) | Yes | Internal code for FHIR mapping |
| lotNumber | String(64) | No | May be null if lot untracked |
| quantityConsumed | Integer | Yes | Always 1 for GeneXpert |
| consumedAt | Timestamp | Yes | Result validation datetime |
| resultId | Long | Yes | FK → Result |
| isManualAdjustment | Boolean | Yes | True for wastage/expiry events |

**ReagentForecast**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| facilityId | Long | Yes | FK → Organization |
| cartridgeTypeCode | String(64) | Yes | |
| averageDailyConsumption | Decimal(10,2) | No | Null if INSUFFICIENT_DATA |
| stockOnHand | Integer | Yes | Current lot-summed quantity |
| daysOfStock | Decimal(10,1) | No | Null if ADC unavailable |
| status | Enum | Yes | CRITICAL, LOW, ADEQUATE, OVERSTOCKED, INSUFFICIENT_DATA |
| reorderThresholdDays | Integer | Yes | Effective threshold for this facility |
| maxThresholdDays | Integer | No | Optional overstock threshold |
| lookbackWindowDays | Integer | Yes | Window used for ADC calculation |
| calculatedAt | Timestamp | Yes | When this forecast was last computed |
| fhirResourceId | String(64) | No | FHIR resource ID after publish |

**ReagentForecastConfig**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| facilityId | Long | No | Null = global default |
| cartridgeTypeCode | String(64) | No | Null = applies to all cartridge types |
| defaultReorderThresholdDays | Integer | Yes | Default 30 |
| maxThresholdDays | Integer | No | Optional |
| lookbackWindowDays | Integer | Yes | Default 90 |
| lastModifiedBy | String | Yes | |
| lastModifiedAt | Timestamp | Yes | |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/inventory/forecast` | List all facility-cartridge forecasts | `inventory.forecast.view` |
| GET | `/api/v1/inventory/forecast?facilityId={id}` | Forecast for one facility | `inventory.forecast.view` |
| GET | `/api/v1/inventory/forecast?status=CRITICAL,LOW` | Filter by status | `inventory.forecast.view` |
| POST | `/api/v1/inventory/forecast/recalculate` | Trigger on-demand recalculation | `inventory.forecast.modify` |
| GET | `/api/v1/inventory/forecast/config` | Get forecasting configuration | `inventory.forecast.view` |
| PUT | `/api/v1/inventory/forecast/config` | Save global config | `inventory.forecast.modify` |
| PUT | `/api/v1/inventory/forecast/config/{facilityId}` | Save per-facility override | `inventory.forecast.modify` |
| GET | `/api/v1/inventory/forecast/alerts` | Get active alerts for current user's facility | `inventory.forecast.view` |
| POST | `/api/v1/inventory/forecast/alerts/{id}/dismiss` | Dismiss an alert | `inventory.forecast.view` |

---

## 7. UI Design

See companion React mockup: `reagent-forecasting-mockup.jsx`

### Navigation Path

Inventory → Reagent Forecasting

### Key Screens

1. **Forecasting Workbench** — DataTable showing all facilities × cartridge types with DoS, status Tag, stock on hand, ADC, and reorder threshold. Inline row expansion to edit threshold per row.
2. **Global Config (Accordion)** — Lookback window and default reorder threshold settings; visible at top of page, collapsed by default.
3. **Alert Banner** — InlineNotification displayed when any CRITICAL sites are present.

### Interaction Patterns

- **Inline row expansion** to edit reorder threshold per facility-cartridge row (not a modal)
- **Accordion** for global configuration settings (not primary workflow)
- **InlineNotification** at top of page for CRITICAL sites
- **DataTable filter** to show only CRITICAL + LOW rows
- **Tag** for status with semantic colors per the status classification table

---

## 8. Business Rules

**BR-001:** ADC is calculated using only days where at least one test was performed at the facility. Days with zero consumption due to facility closure or equipment downtime MUST be excluded if the facility has recorded a "closure" event. In the absence of closure tracking in v1, all calendar days in the lookback window are included (zero-consumption days reduce ADC).

**BR-002:** Expired cartridge lots MUST be excluded from the stock on hand calculation. Expiry date is sourced from the existing InventoryItem lot record.

**BR-003:** Stock on hand MUST reflect the sum across all active (non-expired, non-depleted) lots at the facility for the given cartridge type. Cross-facility stock is NOT included.

**BR-004:** A facility-level reorder threshold ALWAYS takes precedence over the global default when set.

**BR-005:** DoS of 0 (zero stock on hand) MUST always be classified as `CRITICAL` regardless of threshold settings.

**BR-006:** Forecasting data published to FHIR MUST use the same facility `Organization` resource identifiers as the diagnostic result publication (FR-5-001 in the FHIR Publication FRS) to enable cross-referencing in Superset.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.forecast.title` | Reagent Forecasting |
| `heading.forecast.subtitle` | GeneXpert cartridge stock-out prediction by facility |
| `heading.forecast.globalConfig` | Global Forecasting Configuration |
| `label.forecast.facility` | Facility |
| `label.forecast.cartridgeType` | Cartridge Type |
| `label.forecast.daysOfStock` | Days of Stock |
| `label.forecast.stockOnHand` | Stock on Hand |
| `label.forecast.adc` | Avg Daily Consumption |
| `label.forecast.status` | Status |
| `label.forecast.reorderThreshold` | Reorder Threshold (days) |
| `label.forecast.calculatedAt` | Last Calculated |
| `label.forecast.lookbackWindow` | ADC Lookback Window (days) |
| `label.forecast.defaultReorderThreshold` | Default Reorder Threshold (days) |
| `label.forecast.status.critical` | Critical |
| `label.forecast.status.low` | Low Stock |
| `label.forecast.status.adequate` | Adequate |
| `label.forecast.status.overstocked` | Overstocked |
| `label.forecast.status.insufficientData` | Insufficient History |
| `button.forecast.recalculate` | Recalculate |
| `button.forecast.saveThreshold` | Save Threshold |
| `button.forecast.showAtRisk` | Show At-Risk Only |
| `button.forecast.showAll` | Show All Sites |
| `message.forecast.recalculateStarted` | Forecast recalculation started. Results will update shortly. |
| `message.forecast.thresholdSaved` | Reorder threshold updated for {facility}. |
| `error.forecast.thresholdRequired` | Reorder threshold is required. |
| `error.forecast.thresholdRange` | Threshold must be between 1 and 365 days. |
| `message.forecast.criticalAlert` | {count} site(s) have CRITICAL cartridge stock. Review the Reagent Forecasting page. |
| `message.forecast.insufficientData` | Insufficient consumption history (< 14 days). ADC cannot be calculated. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| reorderThresholdDays | Required, integer, min 1, max 365 | `error.forecast.thresholdRequired`, `error.forecast.thresholdRange` |
| maxThresholdDays | Optional; if set, must be > reorderThresholdDays | `error.forecast.maxThresholdRange` |
| lookbackWindowDays | Required, min 30, max 180 | `error.forecast.lookbackRange` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View forecasting page | `inventory.forecast.view` | Page not shown in Inventory menu |
| View all facilities | `inventory.forecast.viewAll` | Only own facility rows shown |
| Edit threshold (own facility) | `inventory.forecast.modify` | Edit button hidden in row; API returns 403 |
| Save global config | `inventory.forecast.modify` | Config fields are read-only |
| Trigger recalculation | `inventory.forecast.modify` | Recalculate button hidden |

---

## 12. Acceptance Criteria

### Functional

- [ ] Lab Manager at Facility A can view the forecasting workbench and see rows for each GeneXpert cartridge type in use at their facility
- [ ] DoS is correctly calculated as `stock on hand / ADC` for a facility with ≥ 14 days of consumption history
- [ ] A facility with DoS < 7 days displays `CRITICAL` status with a red Tag
- [ ] A facility with DoS between 7 and the reorder threshold displays `LOW` status with an orange Tag
- [ ] A facility with < 14 days consumption history displays `INSUFFICIENT_DATA` gray Tag and no DoS value
- [ ] Inline row expansion allows Lab Manager to edit the reorder threshold for their facility and save without a modal
- [ ] System Administrator can set the global lookback window (30–180 days) and default reorder threshold
- [ ] An InlineNotification alert appears on the home dashboard for Lab Manager when their facility has CRITICAL status
- [ ] Dismissed alerts reappear if status worsens to CRITICAL from a lower severity
- [ ] Triggering "Recalculate" re-computes ADC and DoS and updates all rows
- [ ] Forecasting data is published to the FHIR repo as InventoryReport/SupplyDelivery resources nightly

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Forecasting workbench page loads within 3 seconds for a 100-facility program
- [ ] ADC recalculation job completes within 5 minutes for a 200-facility program with 90-day lookback
- [ ] Permissions enforced at API layer (HTTP 403 for unauthorized)

### Integration

- [ ] FHIR InventoryReport resources reference the same facility Organization IDs used in DiagnosticReport publication
- [ ] Superset can query FHIR for `InventoryReport?subject=Organization/{facilityId}` and receive current DoS and stock data
- [ ] DHIS2 push (if configured) includes supply data in each batch run alongside result data
