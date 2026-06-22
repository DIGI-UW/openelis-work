# Quality Indicator: Rejection Rate
## FRS Outline — Sprint 4 (QA Menu Roadmap)

**Document Version:** 0.2 (outline + locked scope decisions)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline with scope decisions locked; full FRS authored in Sprint 4
**Sidenav placement:** `Quality Assurance → Quality Indicators → Rejection Rate`

---

## 1. Purpose

Track the percentage of samples that are rejected for any pre-analytical reason. Rejection Rate is one of the most consistently-cited Quality Indicators in ISO 15189:2022 §8.8 and CAP GEN.20377; it is a direct, daily proxy for pre-analytical quality.

This QI consumes data the lab is already capturing (sample disposition + rejection reasons via the existing rejection workflow) and the NCE register (every sample rejection generates an NCE under trigger #1 of the NCE Report FRS v3.1). No new data collection is required.

## 2. Standards & background

| Source | What they say |
|---|---|
| ISO 15189:2022 §8.8 | Mandates the lab establish quality indicators monitoring critical aspects of pre-analytical, analytical, and post-analytical processes; rejection rate is the canonical pre-analytical indicator. |
| CAP GEN.20377 | Requires monitoring rejection rate as part of the QM plan. |
| IFCC WG-LEPS / Plebani et al. | Published reference rejection rates by sample type (e.g., chemistry < 2%, hematology < 1%, microbiology < 5%). |

## 3. Definition

### 3.1 Formula (test-order unit)

```
Rejection Rate (%) = (Rejected Test Orders ÷ Total Test Orders) × 100
```

The unit of measurement is the **test order**, not the sample. A sample with five tests ordered contributes five test orders to the denominator. A full-sample rejection on that sample contributes five test orders to the numerator (every test ordered was prevented). A partial rejection that affects only two of the five tests contributes two to the numerator and five to the denominator.

This is a deliberate change from a sample-level rate. The test-order unit attributes rejections to specific tests, which is what the threshold table (per test category) and the IFCC / CAP reference rates assume.

Computed at: lab, section, **test (primary)**, **test category (rollup)**, ordering location, rejection reason, time period.

### 3.2 Numerator

Count of **test orders that could not be performed** due to sample-related rejection during the reporting window:

- A full-sample rejection (NCE trigger #1) contributes 1 to the numerator for every test ordered on that sample.
- A partial-sample rejection (NCE trigger #2) contributes 1 to the numerator for each affected test.
- A test cancellation tied to a sample-quality issue (NCE triggers #5 / #6) contributes 1 per cancelled test.
- A test cancellation for non-sample-quality reasons (e.g., physician cancelled the order before sample receipt) does **not** contribute.

All numerator events link to NCE events.

### 3.3 Denominator

Count of **test orders accessioned** during the reporting window. (One accessioned sample with N tests ordered = N test orders in the denominator, regardless of subsequent disposition.)

### 3.4 Reporting window

Daily (rolling 24h), weekly, monthly, quarterly, year-to-date. Default dashboard view: rolling 30 days.

### 3.5 Recompute cadence (locked DEC16)

**Hybrid model.** The trailing 7 days are recomputed live (every sample-status change invalidates the relevant aggregate; QA Officer sees today's data). Data older than 7 days is recomputed nightly. This balances live freshness for the actionable window against the cost of touching deep historical aggregates on every ingest.

### 3.6 Breakdown by test ordered (locked DEC16, revised RR-Q4)

The primary breakdown dimension is **test ordered**. The detail-page heatmap is `ordering location × test category` (with drill-down to individual tests). Specimen type is no longer a primary dimension; it appears as a secondary filter only.

Threshold table is keyed on **test category** by default (chemistry, hematology, microbiology, molecular, anatomic pathology), with **per-test override** available in the QI Configuration page for labs that want tighter rules on specific tests (e.g., critical INR or beta-hCG, where rejection has higher clinical impact).

Why test-ordered instead of specimen-type:
- Rejections are clinically attributed to which test couldn't be performed, not which tube it was in.
- Per-test thresholds align with IFCC and CAP reference rate publication conventions (which give rates by test-type) and with how lab QM committees actually set goals.
- Maps cleanly to the existing `test` and `test_section` tables, which have stable IDs already used across the application.

### 3.7 Self-induced rejections (locked DEC16)

Self-induced rejections (e.g., aliquot exhausted during validation rerun, sample destroyed during analysis) **are counted in the headline rate**. The Pareto by NCE trigger source on the detail page splits external vs. self-induced so labs can drill into either; the headline is the honest combined picture.

### 3.8 Partial rejection weighting (locked DEC16)

A partially-rejected sample (some tests rejected, others valid) **counts as 1.0** in the numerator. Consistent with NCE counting (the NCE Report FRS treats partial rejection as its own NCE event). Pareto on the detail page splits full vs. partial so labs can compute proportional themselves if desired.

### 3.9 Lab-level enablement

This QI is **enabled by default** for new installs. Rejection Rate is universally relevant (every lab handles samples and rejects some) and is required by ISO 15189:2022 §8.8 and CAP GEN.20377. Disable is supported through `Admin → QI Configuration → Rejection Rate` for unusual cases (e.g., a lab whose QM committee tracks this externally and doesn't want a duplicate dashboard), with the same disable behavior as Critical Callback: tile removed, detail route 404, no alerts, history preserved. See `qi-configuration-outline.md`.

## 4. Threshold defaults (configurable)

| Test category | Target | Action threshold | Source |
|---|---|---|---|
| Chemistry / immunology | < 2% | > 3% | IFCC WG-LEPS reference |
| Hematology / coagulation | < 1% | > 2% | IFCC WG-LEPS reference |
| Microbiology | < 5% | > 8% | IFCC WG-LEPS reference |
| Molecular | < 1% | > 2% | Internal proxy from chem reference |
| Anatomic pathology | < 1% | > 2% | Internal proxy from chem reference |
| Overall (all categories) | < 2% | > 3% | Lab-configurable rollup |

Per-test overrides supported (a specific test can carry a tighter target than its category). Thresholds and overrides are configured via `Admin → QI Configuration → Rejection Rate` (see `qi-configuration-outline.md`).

## 5. Data sources

| Source | Field(s) | Purpose |
|---|---|---|
| `sample_test_order` table (the test-order line items per sample) | `id`, `test_id`, `sample_id`, `accession_number`, `ordered_at`, `cancelled_at`, `cancellation_reason_code`, `org_id` | Denominator (count of test orders accessioned). Numerator (cancelled lines tied to sample-quality reasons). |
| `sample` table | `id`, `status`, `received_date`, `org_id` | Sample-level rejection cascade — when a sample is fully rejected, all its tests count in the numerator. |
| `test` + `test_section` | `id`, `name`, `test_category`, `section_id` | Breakdown dimensions: per-test, per-test-category, per-section. |
| `nce_event` (linked via `nce_sample_link` and `nce_result_link`) | `category`, `subcategory`, `severity`, `trigger_source`, linked tests | Drill-down by rejection reason; round-trip to NCE detail. |
| `nce_rejection_reason_mapping` | `reason_code` → `nce_subcategory` | Categorize rejections into the three rejection-reason groups (Sample Quality, Identification, Volume/Container). |

No new tables required. The numerator query joins `sample_test_order` to `nce_event` via `nce_sample_link` (full-sample rejection cascades all tests) and `nce_result_link` (partial rejection / test cancellation hits specific tests).

If `sample_test_order` is named differently in the live schema (some installations use `analysis` or `test_request_line`), Sprint 3 inventory confirms the right table; the join logic is unchanged.

## 6. UI sketch

### 6.1 Tile (on QI Dashboard)

```
┌─────────────────────────────────────────┐
│ Rejection Rate                          │
│                                         │
│   1.7%   ↓ 0.3% vs prior 30d            │
│   ▓▓▓░░░ Target: < 2%                   │
│                                         │
│   42 rejected of 2,471 test orders      │
│   Worst category: Hematology (3.2%)     │
└─────────────────────────────────────────┘
```

### 6.2 Detail page

- KPI strip: current rate, prior-period delta, target line, action threshold line.
- Trend chart: stacked bar by week showing rejection counts split by reason category, with rate line overlay.
- Pareto chart: rejection reasons sorted by count descending, cumulative line.
- **Per-test-category breakdown**: bar chart by test category, each bar showing rate vs. category target (color-coded green/amber/red).
- **Heatmap**: ordering location × test category, cell = rejection rate. Drill-down on a cell expands to the per-test view within that category.
- Drill-through table: one row per rejected test order with link to its NCE (round-trip to NCE detail in the QMS pillar). Columns: test name, category, sample number, rejection reason, NCE link.
- Filters: date range, test, test category, section, ordering location, rejection reason category, specimen type (secondary).
- Export: CSV (filtered table), PDF (current view as report).

### 6.3 Visual cues

| State | Cue |
|---|---|
| Within target | Green tile |
| Between target and action threshold | Amber tile |
| Above action threshold | Red tile + alert icon (also surfaces on QA Overview) |

## 7. NCE linkage

This QI is fed by the NCE register and feeds back into it:

- Every rejection event already creates an NCE (NCE Report FRS triggers #1 and #2). Drill-through from a row in this QI navigates to `/qa/qms/nce/{id}`.
- An NCE Pareto on this page is a *view* over the same NCE data the QMS pillar shows — no parallel storage.
- When the rate exceeds the action threshold, an Alert is raised (`label.alert.qi.rejectionRate.actionThreshold`) and posted to the Alerts dashboard with severity = High.

## 8. Permissions

| Permission | Description |
|---|---|
| `qa.view.qi` | View Quality Indicators pillar including this dashboard. |
| `qa.manage.qi` | Edit thresholds and targets. |
| `nce.view.all` | Required to drill through to a specific NCE record (read-through inherits NCE permissions). |

QA Officer default role bundles `qa.view.qi` and `qa.manage.qi`. Lab Director recipe adds the same.

## 9. Acceptance criteria (outline)

- [ ] Rate computes correctly against a known fixture: 5 rejected test orders of 100 accessioned test orders = 5.0%.
- [ ] A full-sample rejection on a sample with N tests contributes N to the numerator (one per test ordered).
- [ ] A partial rejection contributes 1 per affected test only.
- [ ] A non-quality test cancellation (physician cancelled) does **not** contribute to the numerator.
- [ ] Numerator counts both full and partial rejections.
- [ ] Denominator counts accessioned test orders regardless of later disposition.
- [ ] Per-test-category breakdown reconciles: sum of category numerators = overall numerator.
- [ ] Per-test override threshold takes precedence over the category default when set.
- [ ] Tile renders on QI Dashboard with current value, delta, and target line.
- [ ] Tile color reflects target/action-threshold state.
- [ ] Trend chart, Pareto, and heatmap render with correct totals matching the KPI strip.
- [ ] Drill-through from a table row opens the linked NCE in a new tab.
- [ ] Threshold breach raises an Alert with the canonical i18n key.
- [ ] CSV export contains all currently-filtered rows.
- [ ] All visible strings use `t(key, fallback)` pattern; no hard-coded English.
- [ ] User without `qa.view.qi` does not see the tile or detail page.

## 10. Resolved scope decisions (2026-04-23)

| ID | Question | Decision | Notes |
|---|---|---|---|
| RR-Q1 | Recompute cadence | **Hybrid: live for the trailing 7 days, nightly for older.** | Balances live freshness for the actionable window against the cost of touching deep historical aggregates on every ingest. See §3.5. |
| RR-Q2 | Partial rejection weighting | **1.0 — every rejection counts.** | Consistent with NCE counting. See §3.8. |
| RR-Q3 | Multi-tenant rollup | **Out of scope for v1.** | Inherits roadmap DEC03 (single-site v1). |
| RR-Q4 | Breakdown dimension | **By test ordered.** Test-order is the unit of measurement; threshold table is keyed on test category with per-test override. Specimen type demoted to a secondary filter. See §3.1, §3.6, §4. |
| RR-Q5 | Self-induced rejections | **Count all in headline.** | Pareto by NCE trigger source on the detail page surfaces the breakdown. See §3.7. |

## 11. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.qi.rejectionRate.title` |
| Tile label | `label.qi.rejectionRate.tileLabel` |
| Target line | `label.qi.rejectionRate.target` |
| Action threshold line | `label.qi.rejectionRate.actionThreshold` |
| Trend chart title | `label.qi.rejectionRate.trend` |
| Pareto chart title | `label.qi.rejectionRate.pareto` |
| Heatmap title | `label.qi.rejectionRate.heatmap` |
| Alert (action threshold breach) | `label.alert.qi.rejectionRate.actionThreshold` |

Full list in the Sprint 4 FRS.

---

*Outline only — full FRS authored in Sprint 4.*
