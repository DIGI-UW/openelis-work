# Westgard Phase 2 — Functional Requirements Specification

**Document Version:** 1.0
**Date:** 2026-05-04
**Author:** Casey Iiams-Hauser
**Status:** Ship-ready FRS for the Westgard Phase 2 work item
**Effort estimate:** ~28–41 engineer-hours total, organized in three priority tiers
**Companion mockup:** `qa-westgard-phase2-preview.html`
**Source-of-truth references:**
- 2026-05-04 code audit: existing Westgard implementation in `DIGI-UW/OpenELIS-Global-2`
- 2026-05-04 UI audit: layout/IA review of existing QC Dashboard React components
- Piotr Mankowski's landscape review (Slack #oe-madagascar-internal, 2026-05-01) — four-QC-feature mental model
- NCE FRS v3.1 — trigger #10 ("QC invalidation from Westgard")
- `qa-menu-versioning-plan.md` v0.2 — Westgard Phase 2 entry

---

## 0. What Westgard Phase 2 actually ships

Four bounded improvements to the existing Westgard / QC Dashboard module — all of which build on infrastructure that already exists. Phase 2 doesn't introduce a new pillar, redesign the existing screens, or change the core rule-evaluation engine. It surfaces information that's already in the database, closes a specced-but-unwired NCE workflow trigger, completes existing partial work, and adds inspector-facing reporting capability.

The work is organized into **three priority tiers** so it can ship together as one PR or split across multiple contributors / sprints:

| Tier | Items | Effort | Owner |
|---|---|---|---|
| **1 — Highest priority** | Active-violations alert banner + Auto-create NCE on critical violations | ~10–14h | Core team (must do) |
| **2 — Add-ons** | Statistical-method completion + Sigma metrics display | ~8–12h | Core team (should do if time) |
| **3 — Nice to have / community** | QC reporting / trend export (CSV + PDF) | ~10–15h | Community contribution candidate |

**Why three tiers:** the audit found the existing Westgard implementation is genuinely solid. Most labs are using it productively today. Phase 2 fills bounded gaps that improve daily QA Officer workflow and inspector readiness — but none of these are blockers for the existing functionality, so a partial ship of just Tier 1 (~10–14h) materially improves the system.

---

## 1. Scope

### 1.1 In scope (organized by tier)

**Tier 1 — Highest priority:**
1. Active-violations alert banner above QC Dashboard summary tiles.
2. Auto-create NCE on critical Westgard violations (NCE FRS v3.1 trigger #10 wiring).

**Tier 2 — Add-ons:**
3. Statistical-method completion: integrate ROLLING mean/SD recalc into rule evaluation; add UI for MANUFACTURER_FIXED manual entry.
4. Sigma metrics display per test (`σ = (TEa − bias) / CV`).

**Tier 3 — Nice to have / community:**
5. QC reporting / trend export: CSV (run detail, violations log) + JasperReports PDF (monthly QC summary, trend report).

### 1.2 Out of scope (stays parked indefinitely)

| Feature | Why parked |
|---|---|
| Patient-based QC / moving averages (CLSI EP25) | Almost no LIMS implements this; post-v3+ at the earliest |
| Cross-instrument peer comparison | Niche; defer until customer asks |
| Dynamic rule recommendation (auto-suggest rule changes from sigma) | Advanced; defer |
| Lot-expiration-soon dashboard indicator | Surfaced in UI audit as minor weakness; worth doing if a partner lab asks, otherwise wait for natural touch |
| Westgard module redesign (layout overhaul) | Existing layout is solid per audit (3 strengths, 3 minor weaknesses); Phase 2 fixes the highest-leverage weakness with item 1 above, the other two are not worth a full redesign |

### 1.3 Non-goals

- Phase 2 does **not** redesign the existing QC Dashboard layout. It adds one banner above the existing summary tiles; the rest of the dashboard is untouched.
- Phase 2 does **not** change the rule evaluation engine. All 8 rules (1-2s, 1-3s, 2-2s, R-4s, 3-1s, 4-1s, 7-t, 10-x) continue to work identically.
- Phase 2 does **not** introduce new database tables. All four items use existing tables (`qc_rule_violation`, `qc_control_lot`, `nce_event`, etc.).
- Phase 2 does **not** add new permission scopes. Existing `qc.view` / `qc.manage` permissions govern.

---

## 2. Audit findings recap

### 2.1 Functional audit (what already exists)

The 2026-05-04 code audit confirmed that the existing Westgard implementation in `DIGI-UW/OpenELIS-Global-2` covers most of what a working clinical lab needs:

| Capability | Status |
|---|---|
| All 8 Westgard rules (1-2s, 1-3s, 2-2s, R-4s, 3-1s, 4-1s, 7-t, 10-x) | **Exists** — concrete `WestgardRuleEvaluator` classes per rule |
| QC Control Lot lifecycle (Establishment / Active / Expired) | **Exists** — `qc_control_lot` table |
| Levey-Jennings charts with ±1/2/3 SD reference lines | **Exists** — `ControlChartDetail.jsx` |
| Per-test-instrument violation detection | **Exists** — `qc_rule_violation` table |
| QC Alerts tab with WARN/REJECTION severity + acknowledgment | **Exists** — `AlertsTab.jsx` |
| Rule configuration with enable/disable toggles per test | **Exists** — `westgard_rule_config` table |
| Z-score computation | **Exists** — in concrete rule evaluators |
| Analyzer QC identification rules | **Exists** — `analyzer_qc_identification_rule` table |
| **Auto-create NCE on critical violations** | **Missing** — addressed in Tier 1 |
| **Corrective action tracking on violations** | **Missing** — resolved by NCE auto-creation |
| Statistical calculation methods (MANUFACTURER_FIXED / INITIAL_RUNS / ROLLING) | **Partial** — addressed in Tier 2 |
| Sigma metrics & OOC probability | **Missing** — addressed in Tier 2 |
| **QC result reporting & trend analysis** | **Partial** — charts on screen, no export; addressed in Tier 3 |

### 2.2 UI audit (what needs layout work)

The 2026-05-04 UI audit reviewed the rendered React components and found three layout strengths to keep + three weaknesses to fix:

**Strengths to preserve:**
1. Summary tiles are immediate & color-coded — instant status read.
2. Active-vs-Acknowledged separation in the Alerts tab — clear mental model.
3. ControlChartDetail is self-contained drill-through — doesn't clutter the dashboard.

**Weaknesses identified:**
1. **Critical info is tab-hidden.** A QA Officer landing on the dashboard cannot see *which* analyzers are in violation until they click into a tab. Summary counts exist, but not the actionable list. → **Tier 1 item 1 fixes this.**
2. **No at-a-glance violation timeline on Alerts tab.** Active violations are cards, acknowledged ones are a table; the design doesn't prioritize "what broke in the last 24h." → Partially addressed by the alert banner; full timeline view is post-Phase 2 if needed.
3. **Lot expiration completely absent from the dashboard.** No inventory status, no warning for lots nearing EOL. → Parked unless a partner lab asks.

The audit's specific 4-hour layout recommendation: "Promote the top 3–5 unacknowledged violations to a collapsible 'Alert Banner' above the summary tiles." This is exactly Tier 1 item 1 below.

---

## 3. Tier 1 — Highest priority (~10–14h core team)

**Tier rationale:** the two most operationally consequential improvements with the smallest combined effort. Together they fix the most-asked daily QA Officer question (item 1) and close the QC ↔ QMS workflow loop (item 2). Either ships independently; both together is the natural Phase 2 minimum.

### 3.1 Active-violations alert banner

**Effort:** ~4h
**Files touched:** `frontend/src/components/qc/dashboard/QCDashboard.jsx` (mount), new `frontend/src/components/qc/dashboard/ActiveViolationsBanner.jsx`

#### Functional requirements

| # | Requirement |
|---|---|
| FR-1.1 | A new collapsible banner renders **above** the existing 4-tile summary grid on `/qa/qc/dashboard`. The banner is positioned between the page header and the summary tiles. |
| FR-1.2 | The banner is **conditionally rendered** — visible only when `unacknowledged_violations_count > 0`. When all violations are acknowledged, the banner disappears entirely. |
| FR-1.3 | The banner header displays: a red severity dot + the unacknowledged count + the label "Unacknowledged QC violations need action" + a "Last 24h" date qualifier + a chevron toggle. |
| FR-1.4 | When expanded (default), the banner shows the **top 3–5 unacknowledged violations** sorted by severity (CRITICAL/REJECTION first, then WARNING) and then by timestamp descending. If more than 5 unacknowledged violations exist, show top 5 + a "View all N active violations in Alerts tab ↗" footer link. |
| FR-1.5 | Each violation row shows: severity dot · timestamp · instrument name · test name · rule code (monospace) · age string ("1h 33m ago") · inline "Acknowledge" button · arrow icon. |
| FR-1.6 | Clicking the row body (anywhere except the Acknowledge button or the arrow) navigates to the violation detail page (existing `/qa/qc/alerts/violation/{id}` or equivalent). |
| FR-1.7 | Clicking the inline Acknowledge button POSTs to the existing acknowledge endpoint, removes the row from the banner on success, and decrements the count badge. If the last unacknowledged violation is acked, the banner collapses + disappears entirely. |
| FR-1.8 | The chevron in the banner header toggles expand/collapse state. State persists per user via existing user-pref mechanism (default: expanded). |
| FR-1.9 | Banner respects the existing 5-minute auto-reload on the dashboard — when QC data refreshes, the banner re-evaluates against the new data. |
| FR-1.10 | Banner is keyboard-accessible: tab to header, enter to toggle; tab through rows; enter on Acknowledge button or arrow. Carbon a11y conventions apply. |

#### Acceptance criteria (Tier 1.1)

- [ ] Banner renders above summary tiles when ≥1 unacknowledged QC violation exists in the last 24h.
- [ ] Banner is absent when all violations are acknowledged.
- [ ] Top 5 violations sorted by severity then timestamp desc.
- [ ] Inline Acknowledge removes the row + decrements count + closes banner if it was the last.
- [ ] Banner expand/collapse state persists per user.
- [ ] Banner respects auto-reload.
- [ ] Lighthouse a11y score ≥ 95 on dashboard with banner present.

### 3.2 Auto-create NCE on critical Westgard violations

**Effort:** ~6–10h
**Files touched:** `src/main/java/org/openelisglobal/qc/service/QCRuleViolationServiceImpl.java` (hook), new `src/main/java/org/openelisglobal/qc/service/QCViolationToNCEService.java` (service)

#### Functional requirements

| # | Requirement |
|---|---|
| FR-2.1 | When a Westgard rule evaluation produces a violation with severity = CRITICAL (i.e., 1-3s, R-4s, or any custom-marked critical rule), the system **auto-creates an NCE event** in the existing `nce_event` table. |
| FR-2.2 | The auto-created NCE uses **NCE FRS v3.1 trigger #10** ("QC invalidation from Westgard"). Subcategory: `Analytical / QC Invalidation`. Severity: Critical. |
| FR-2.3 | The NCE is linked to the violation via the `nce_westgard_link` table (existing per NCE Report FRS v3.1 §7.4). |
| FR-2.4 | The NCE description is auto-generated: `"{Rule code} violation on {instrument name} / {test name} / Lot {lot code}. Z-score {z}. Control value {value} {units}; expected {mean} ± {sd}."` Example: `"1-3s violation on Architect ci8200 / Potassium / Lot 22417C. Z-score +4.0. Control value 4.46 mmol/L; expected 4.30 ± 0.04."` |
| FR-2.5 | The NCE is auto-assigned to: (a) the analyzer's primary owner if configured, otherwise (b) the test section's QA lead if configured, otherwise (c) unassigned (with the existing "Unassigned Critical NCE" alert firing per NCE Dashboard FRS v4.0 §12). |
| FR-2.6 | The NCE's "Immediate action" field is auto-populated: `"Sample run held pending review. Recollection and rerun required if patient samples ran on this analyzer in the violation window."` |
| FR-2.7 | The patient samples run on the affected analyzer between the previous in-control QC and this violation are auto-linked to the NCE via `nce_sample_link` (existing per NCE FRS §7.5). The QA Officer reviews and decides per-sample whether to release / amend / reject. |
| FR-2.8 | Idempotency: if the same violation is re-evaluated (e.g., on a system reload), the system MUST NOT create a duplicate NCE. The `nce_westgard_link` unique constraint on `(qc_violation_id)` enforces this. |
| FR-2.9 | The violation detail page in the QC Alerts tab shows the auto-created NCE as a visible link card (per the Phase 2 mockup). Format: `Auto-created NCE: NCE-YYYYMMDD-NNNN · Critical · Pre-Analytical / QC Invalidation · {assignee}`. |
| FR-2.10 | The NCE detail page (existing) shows the linked QC violation in its Event Details tab via the existing Linked items section (per NCE FRS §6.2). |
| FR-2.11 | Non-critical violations (1-2s warning, 4-1s shift, 10-x trend) do **NOT** auto-create NCEs. Only severity = CRITICAL triggers the auto-create. The QA Officer can manually file an NCE for non-critical violations through the existing manual flow. |

#### Acceptance criteria (Tier 1.2)

- [ ] A 1-3s violation auto-creates an NCE with the documented description, severity, subcategory, and assignment logic.
- [ ] The NCE is linked via `nce_westgard_link`; only one NCE per unique violation.
- [ ] Patient samples on the affected analyzer in the violation window are linked to the NCE.
- [ ] A 1-2s violation does NOT auto-create an NCE.
- [ ] The QC Alerts tab shows the auto-NCE link card on the violation detail.
- [ ] The NCE detail page shows the linked QC violation under Linked items.
- [ ] Re-evaluating the same violation does not create a second NCE.
- [ ] Audit log records the auto-creation (actor: `system:qc-violation-service`).

---

## 4. Tier 2 — Add-ons (~8–12h core team)

**Tier rationale:** completes existing partial work in the rule evaluation pipeline and surfaces an inspector-relevant metric. Lower urgency than Tier 1 but worth doing in the same sprint if capacity allows. Touches the rule evaluator service so should be core team rather than community.

### 4.1 Statistical-method completion + sigma metrics

**Effort:** ~8–12h
**Files touched:** `src/main/java/org/openelisglobal/qc/service/QCControlLotServiceImpl.java`, `src/main/java/org/openelisglobal/qc/service/WestgardRuleEvaluationServiceImpl.java` (read path), new `src/main/java/org/openelisglobal/qc/service/SigmaMetricsService.java`, frontend `ControlChartDetail.jsx` (sigma display)

#### Functional requirements

| # | Requirement |
|---|---|
| FR-3.1 | The `StatisticalCalculationMethod` enum already has three values: `MANUFACTURER_FIXED`, `INITIAL_RUNS`, `ROLLING`. Phase 2 ensures **all three are fully integrated** into rule evaluation: when a control lot's method is set, the rule evaluator reads mean/SD according to that method. |
| FR-3.2 | **MANUFACTURER_FIXED**: a UI form on the QC Lot Management page lets a `qc.manage` user enter the manufacturer-provided mean + SD per level. These values become the active mean/SD for rule evaluation. (Today the enum value exists but there is no UI for entry.) |
| FR-3.3 | **INITIAL_RUNS**: when a lot is marked Active after the establishment phase, mean + SD are computed from the first N initial runs (default N = 20, lab-configurable in admin). These are stored on the lot record and become the active mean/SD. |
| FR-3.4 | **ROLLING**: mean + SD are recomputed continuously from the last N runs (default N = 60, lab-configurable). Recompute happens incrementally on each new QC run. (The recalc logic exists today; this requirement is about wiring it into rule evaluation.) |
| FR-3.5 | The QC Control Lot detail UI surfaces the active statistical method as a dropdown labeled `Statistical calculation method`. Changing the method recalculates mean/SD from the appropriate source and updates the lot record in one transaction. |
| FR-3.6 | A new `SigmaMetricsService` calculates per-test sigma performance: `σ = (TEa − bias) / CV`. Where: `TEa` is the manufacturer's allowable total error (entered in test config or pulled from a per-test setting); `bias` is the percent difference vs. peer mean (last 90d, computed from peer-comparison data — if no peer data, bias = 0 and a "no peer data" qualifier shows); `CV` is `(SD / mean) × 100` from the lot's current statistics. |
| FR-3.7 | Sigma performance is displayed on the Levey-Jennings chart detail page (`ControlChartDetail.jsx`) as a new "Sigma performance" tile alongside the existing Mean / SD / CV statistics footer. |
| FR-3.8 | Sigma is graded with badge labels: `≥ 6 σ World-class` (green), `4–5.9 σ Acceptable` (blue), `3–3.9 σ Marginal` (amber), `< 3 σ Poor` (red). Badge appears next to the numeric sigma value. |
| FR-3.9 | If TEa is not configured for the test, the sigma tile shows `Sigma: not calculable — TEa not configured` with a link to test config. |
| FR-3.10 | Sigma is recalculated whenever the lot's mean/SD changes (i.e., on each new QC run for ROLLING; on lot establishment for INITIAL_RUNS; on manual edit for MANUFACTURER_FIXED). |

#### Acceptance criteria (Tier 2)

- [ ] All three statistical calculation methods (MANUFACTURER_FIXED / INITIAL_RUNS / ROLLING) are operational and drive rule evaluation.
- [ ] MANUFACTURER_FIXED has a UI for manual mean/SD entry.
- [ ] Changing the method on a lot recalculates and updates active mean/SD in one transaction.
- [ ] Sigma is computed correctly per the formula.
- [ ] Sigma badge color matches the band (green / blue / amber / red).
- [ ] Sigma tile renders on ControlChartDetail.
- [ ] If TEa is missing, sigma tile shows the "not calculable" state with link to config.
- [ ] Sigma recalculates when mean/SD changes.

---

## 5. Tier 3 — Nice to have / community (~10–15h)

**Tier rationale:** self-contained scope with bounded inputs (existing QC tables) and outputs (CSV format + JasperReports PDF). No service-layer changes. **Good fit for a community contribution.** Inspectors regularly ask for monthly QC summaries and today the lab takes screenshots — solving this lowers manual work for every accredited lab using OpenELIS.

### 5.1 QC reporting / trend export

**Effort:** ~10–15h
**Files touched:** new `src/main/java/org/openelisglobal/qc/controller/rest/QCReportingRestController.java`, new `src/main/java/org/openelisglobal/qc/service/QCReportingService.java`, new JasperReports templates `src/main/resources/jasperreports/qc/monthly-summary.jrxml` and `src/main/resources/jasperreports/qc/trend-report.jrxml`, frontend `QCDashboard.jsx` (export menu)

#### Functional requirements

| # | Requirement |
|---|---|
| FR-4.1 | A new "Export ▾" button is added to the QC Dashboard top-right toolbar (next to the existing Refresh button). Clicking it opens a dropdown menu with four options. |
| FR-4.2 | **Export option 1 — Monthly QC Summary (PDF)**: a CAP/SANAS-ready summary PDF for a given month, scoped to a single instrument or all instruments. Includes: header (lab name + month + generated-at), Levey-Jennings charts per test (one per page), sigma metrics per test, violation list (date / instrument / test / rule / severity / ack status), summary statistics (total runs / pass rate / violation count). Uses JasperReports template `monthly-summary.jrxml`. |
| FR-4.3 | **Export option 2 — QC Run Detail (CSV)**: every QC run in the date range. Columns: `timestamp_iso`, `instrument_name`, `instrument_id`, `test_code`, `test_name`, `lot_code`, `level`, `value`, `units`, `z_score`, `rules_fired` (semicolon-joined list), `was_acknowledged`, `ack_user`, `ack_timestamp_iso`. UTF-8, RFC-4180 quoting. |
| FR-4.4 | **Export option 3 — Violations Log (CSV)**: all violations in the date range with full ack metadata. Columns: `violation_id`, `timestamp_iso`, `instrument_name`, `test_name`, `lot_code`, `rule_code`, `severity`, `ack_status`, `ack_user`, `ack_timestamp_iso`, `linked_nce_number`, `linked_nce_status`. Includes a header line. |
| FR-4.5 | **Export option 4 — Trend Report (PDF)**: cumulative bias, CV, and sigma trends per test over a configurable window (default 90 days). One page per test. Uses JasperReports template `trend-report.jrxml`. |
| FR-4.6 | Each export option, when clicked, opens a small parameter modal: date range, instrument filter (single or all), test filter (single or all), level filter (single or all). For PDFs, also: scope label override (e.g., "Bay 7 Chemistry Lab" instead of the lab's default name). |
| FR-4.7 | The export endpoint streams the response with `Content-Disposition: attachment; filename="...yyyy-mm-dd.csv"` (or `.pdf`). For PDFs, the filename includes the report type + date range (e.g., `qc-monthly-summary-2026-04.pdf`). |
| FR-4.8 | Export is permission-gated: `qc.view` to export. (No new permission scope.) |
| FR-4.9 | Export size is bounded: CSV exports cap at 100,000 rows (configurable); larger ranges return a warning + suggestion to narrow the window. PDF exports cap at 50 instrument-test combinations per report; larger scopes return a warning. |
| FR-4.10 | Each export action is audit-logged with `action: qc_report_export`, `params: {type, date_range, filters}`, `result_size: rows_or_pages`. |

#### Acceptance criteria (Tier 3)

- [ ] Export button on QC Dashboard opens dropdown with four options.
- [ ] Each export option opens a parameter modal with date range + filters.
- [ ] Monthly Summary PDF renders with all documented sections.
- [ ] Run Detail CSV exports with documented columns and RFC-4180 formatting.
- [ ] Violations Log CSV exports with documented columns including linked NCE info.
- [ ] Trend Report PDF renders with bias / CV / sigma per test.
- [ ] Filenames match the documented format.
- [ ] Permission-gated to `qc.view`.
- [ ] Audit log records each export with parameters.
- [ ] Size caps fire correctly with helpful warning messages.

---

## 6. Acceptance criteria summary by tier

| Tier | Items | Combined hours | Customer-visible value |
|---|---|---|---|
| 1 | Banner + NCE auto-create | ~10–14h | "I can see what's broken without clicking. Critical violations create NCEs automatically." |
| 2 | Sigma + statistical method completion | ~8–12h | "I can see sigma performance per test. All three statistical methods work as designed." |
| 3 | Reporting / export | ~10–15h | "I can export monthly QC summaries for inspectors. No more screenshots." |

**Phase 2 minimum (Tier 1 only):** ~10–14h. Already a meaningful improvement.
**Phase 2 standard (Tier 1 + 2):** ~18–26h. Closes the audit's high-value gaps.
**Phase 2 complete (all tiers):** ~28–41h. Includes community-contributable Tier 3.

---

## 7. Open items

### 7.1 Outstanding (resolve before Tier 1 ships)

1. **NCE v2 scope confirmation.** Does the in-progress NCE v2 build already wire up trigger #10 (QC invalidation from Westgard)? If yes, Tier 1 item 2 collapses into NCE v2 and Phase 2 shrinks to ~22–35h. **Owner:** Casey, confirm with Piotr / Mozzy.
2. **Per-instrument primary owner field.** FR-2.5 references "the analyzer's primary owner if configured" for NCE auto-assignment. Need to confirm: does the existing `instrument` table have a `primary_owner_user_id` field, or do we need to use a section-level owner instead? If neither, fall through to "unassigned" + the existing alert.
3. **TEa (allowable total error) per test.** FR-3.6 needs `TEa` per test. Is this in the existing `test` configuration, or do we need a new field? Likely a small migration; confirm during Tier 2 build.
4. **JasperReports infrastructure.** FR-4.2 / FR-4.5 use JasperReports for PDFs. Confirm the existing patient-report rendering uses the same JasperReports setup so we can reuse it (vs. needing a new PDF generation library).

### 7.2 Resolved during design

| Question | Decision |
|---|---|
| Does Phase 2 redesign the QC Dashboard layout? | No. Adds one alert banner above the existing summary tiles; rest of layout untouched. |
| What violations trigger NCE auto-create? | CRITICAL severity only (1-3s, R-4s, custom-marked critical). 1-2s warnings stay manual. |
| Sigma performance grading thresholds | ≥ 6 σ World-class · 4–5.9 σ Acceptable · 3–3.9 σ Marginal · < 3 σ Poor. Industry-standard Westgard sigma metrics convention. |
| Does QC reporting export require a new permission? | No. Existing `qc.view` permission governs. |
| Is the alert banner expanded by default? | Yes. Collapsible via chevron; state persists per user. |

---

## 8. Dependencies

- **Existing Westgard implementation** (entire `src/main/java/org/openelisglobal/qc/` tree) — Phase 2 extends, doesn't replace.
- **NCE infrastructure** (NCE Report FRS v3.1 — `nce_event`, `nce_capa`, `nce_westgard_link`, `nce_sample_link` tables). Tier 1.2 depends on these existing.
- **NCE v2 build** (in progress) — confirm scope per §7.1.1.
- **Existing JasperReports infrastructure** (used by patient report rendering). Tier 3 reuses.
- **Existing audit log mechanism**. Tiers 1.2, 2, and 3 all write audit events.
- **Existing permission scopes** (`qc.view`, `qc.manage`). No new scopes introduced.
- **Existing `electronic_signature` table** — no, Phase 2 doesn't touch this. (Mentioned only because Tier 1.2 NCE auto-creation produces a system-generated record, not a user signature.)

---

## 9. Effort estimate (consolidated)

| Tier | Item | Hours |
|---|---|---|
| 1.1 | Active-violations alert banner | 4 |
| 1.2 | Auto-create NCE on critical violations | 6–10 |
| **Tier 1 subtotal** | | **10–14** |
| 2.1 | Statistical-method completion + sigma metrics | 8–12 |
| **Tier 2 subtotal** | | **8–12** |
| 3.1 | QC reporting / trend export | 10–15 |
| **Tier 3 subtotal** | | **10–15** |
| **Phase 2 grand total** | | **28–41** |

**Caveats:**
- Subtract ~6–10h if NCE v2 already wires up trigger #10 (Tier 1.2 collapses).
- Subtract ~10–15h if community takes Tier 3 (core team load drops to 18–26h).
- Add ~2–4h if test-level TEa requires a new column / migration (per §7.1.3).
- Add ~4h for translation work into French + Khmer (i18n) — not counted in core team estimate.

---

## 10. Cross-references

| Document | Relevance |
|---|---|
| `qa-westgard-phase2-preview.html` | Visualization of all four Phase 2 items; companion to this FRS |
| `qa-final-preview.html` (QCLanding) | Statistical QC pillar landing surfaces the Phase 2 follow-ups list |
| `qa-menu-versioning-plan.md` | Westgard Phase 2 entry references this FRS |
| `qa-qc-narrative.md` | Act 1 (Westgard) provides the daily-workflow context that justifies Tier 1.1 |
| NCE Report FRS v3.1 | Defines trigger #10, used by Tier 1.2 |
| 2026-05-04 functional audit | Source of the four Phase 2 items |
| 2026-05-04 UI audit | Source of the layout recommendation that became Tier 1.1 |
| Piotr Mankowski's Slack landscape review (2026-05-01) | Four-QC-feature framing context |

---

## 11. Staffing breakdown — what's senior, what's junior, what's community, what waits

We don't have unlimited hours, so each item below is classified by the seniority required + who could realistically take it. Some items split: a senior owns the backend, a junior owns the frontend.

### 11.1 Per-item classification

| # | Item | Sub-task | Effort | Tier | Senior | Junior | Community | Wait & see |
|---|---|---|---|---|---|---|---|---|
| 1.1 | Alert banner | Frontend component (banner + collapse + ack inline) | 4h | 1 | review only | ✅ owns | ✅ alt | — |
| 1.2 | NCE auto-create | Backend QC→NCE service hook (workflow + idempotency + sample linking) | 5–8h | 1 | ✅ owns | — | — | — |
| 1.2 | NCE auto-create | Frontend "auto-NCE link card" on violation detail | 1–2h | 1 | review only | ✅ owns | ✅ alt | — |
| 2.1 | Stat-method completion | Backend rule-evaluator integration (read mean/SD by method) | 4–6h | 2 | ✅ owns | — | — | — |
| 2.1 | Stat-method completion | Frontend MANUFACTURER_FIXED entry form | 2–3h | 2 | review only | ✅ owns | — | — |
| 2.2 | Sigma metrics | Backend `SigmaMetricsService` (TEa lookup + bias + CV → σ) | 2–3h | 2 | ✅ owns | — | — | could wait if no inspector pressure |
| 2.2 | Sigma metrics | Frontend sigma tile on ControlChartDetail | 1–2h | 2 | review only | ✅ owns | — | — |
| 3.1 | Run Detail CSV | Streaming CSV export from existing data | 3–4h | 3 | review only | ✅ owns | ✅ ideal | — |
| 3.1 | Violations Log CSV | Streaming CSV with NCE join | 2–3h | 3 | review only | ✅ owns | ✅ ideal | — |
| 3.1 | Monthly Summary PDF | JasperReports template + service | 4–5h | 3 | mid (JasperReports familiarity) | — | ✅ if JR experience | could wait if labs export CSV instead |
| 3.1 | Trend Report PDF | JasperReports template + service | 3h | 3 | mid (JasperReports familiarity) | — | ✅ if JR experience | could wait — most labs run trend in Excel |
| 3.1 | Export menu UI | Dropdown + parameter modal | 2h | 3 | review only | ✅ owns | ✅ alt | — |

### 11.2 Recommended allocation if hours are tight

**Hours-budget table** (showing what you actually get for what you spend):

| Budget | What ships | Customer-visible value |
|---|---|---|
| **~5h junior** | Just Tier 1.1 (alert banner) | "I can see what's broken without clicking." Solves the highest-leverage UI complaint. |
| **~10h senior + ~3h junior** | Tier 1 in full (banner + NCE auto-create) | Above + "critical violations create NCEs automatically." Closes the QC↔QMS workflow loop. **This is the recommended Phase 2 minimum.** |
| **~16h senior + ~6h junior** | Tier 1 + stat-method completion (skip sigma) | Above + "all three statistical methods drive rule evaluation; MANUFACTURER_FIXED has a UI." Closes the partial-implementation gap without the sigma display. |
| **~18h senior + ~8h junior** | Tier 1 + Tier 2 in full | Above + sigma metrics display. Inspector-relevant for sigma-tier labs. |
| **~18h senior + ~8h junior + ~10h community** | All tiers | Above + CSV/PDF exports. Inspectors stop asking for screenshots. |

### 11.3 What can wait & see

These items are deliberately deferred unless a customer surfaces a specific need:

| Item | Why wait | Trigger that would un-park it |
|---|---|---|
| **Sigma metrics display** (item 2.2) | Useful for sigma-tier labs but not blocking. Most labs don't ask. | A partner lab requests sigma performance review or an inspector specifically asks for it. |
| **Trend Report PDF** (subset of Tier 3) | Most labs export to Excel and trend there; the on-screen Levey-Jennings is enough for daily review. | A community contributor with JasperReports experience volunteers. |
| **Monthly Summary PDF** (subset of Tier 3) | CSV exports satisfy 80% of the inspector ask; PDF is the polish. | Inspector escalation or community contributor. |
| **Lot expiration dashboard indicator** | Surfaced as a minor weakness in the UI audit but no labs have asked. ~4h to add later. | A partner lab reports missing a lot rollover. |
| **Patient-based QC (CLSI EP25 / moving averages)** | Almost no LIMS implements this; advanced labs use external tools. | Customer specifically requests CLSI EP25 implementation (we'd then scope a separate FRS). |
| **Cross-instrument peer comparison** | Niche; useful for multi-site labs. | Multi-site customer requests it (rolls into the v2 backlog "multi-site rollup" thread). |
| **Dynamic rule recommendation** | Advanced sigma-driven feature. | Sigma metrics ship + a customer asks for rule auto-tuning. |
| **NCE auto-create on non-critical violations** (1-2s, 4-1s, 10-x) | Too noisy — would generate a lot of NCEs. Manual flow stays. | Workflow change request from a partner lab. |

### 11.4 Suggested team ask

Based on the staffing classifications above, the cleanest team conversation looks like:

- **Senior dev (Piotr or whoever owns the QC service):** ~10h commitment for Tier 1.2 backend + ~2h reviews. Alone gives us the workflow loop closure.
- **Junior dev / new contributor:** ~5–8h for Tier 1.1 + Tier 1.2 frontend + Tier 2.1 frontend. Alone gives us the dashboard layout fix and one clear-scope frontend project.
- **Community:** Tier 3 (CSV exports first; PDF reports if a JasperReports-familiar contributor steps up). No core team time required.
- **Wait & see:** sigma display, trend PDFs, lot expiration indicator. Each is independently un-parkable later if the trigger condition fires.

If we get only the senior dev's 10h and a junior's 4h (the minimum), we get a banner that surfaces violations + an automatic NCE workflow. That's a meaningful Phase 2 by itself.

---

## 12. Implementation plan / sequencing

### 11.1 Recommended order

```
1. Confirm NCE v2 scope (Casey + Piotr/Mozzy, ~30 min meeting)
   ├─ If trigger #10 in scope → skip Tier 1.2; ship Tier 1.1 alone first
   └─ If not in scope → Tier 1.1 + Tier 1.2 together as one PR

2. Tier 1.1 (banner) — small frontend PR, ~4h
   Reviewer: existing QC module owner
   Acceptance: dashboard renders banner correctly when violations exist

3. Tier 1.2 (NCE auto-create) — small backend PR, ~6–10h
   Reviewer: NCE module owner (Mozzy?) + QC module owner (Piotr?)
   Acceptance: 1-3s violation → NCE in `nce_event` with correct fields + linkages

4. (Optional) Tier 2 — same sprint if capacity
   Single PR touching rule evaluator + new sigma service + frontend tile
   Acceptance: all three stat methods + sigma display

5. (Optional) Tier 3 — community contribution OR back-burner
   Could be three separate PRs (export menu UI · CSV exports · PDF exports)
   Acceptance: each export option produces correct output
```

### 11.2 Cross-team coordination

- **QC module owner** (Piotr): reviewer on Tier 1.1, Tier 1.2 backend, Tier 2.
- **NCE module owner** (Mozzy / NCE v2 build): coordinate Tier 1.2 with NCE v2 scope.
- **Community channel** (Slack #oe-community or similar): announce Tier 3 as a contribution opportunity once Tier 1 lands.

### 11.3 Jira ticket structure

Recommended:
- **Epic:** "Westgard Phase 2 — QC Dashboard improvements"
- **Story 1 (Tier 1.1):** "Active-violations alert banner above QC Dashboard summary tiles"
- **Story 2 (Tier 1.2):** "Auto-create NCE on critical Westgard violations (NCE FRS trigger #10 wiring)"
- **Story 3 (Tier 2):** "Statistical-method completion + sigma metrics display"
- **Story 4 (Tier 3):** "QC reporting / trend export (CSV + PDF)" — labeled `community-good-first-issue`

Each story carries the AC from §3 / §4 / §5 above. Effort labels per §9.

---

## 13. Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-04 | Casey | Initial ship-ready FRS for Westgard Phase 2. Three priority tiers, four items total, ~28–41h end-to-end. Tier 1 (banner + NCE auto-create, ~10–14h) is the recommended Phase 2 minimum. Tier 3 (reporting/export, ~10–15h) flagged as community contribution candidate. Audit findings (functional + UI) recapped in §2. NCE FRS v3.1 trigger #10 wiring is the highest-leverage workflow improvement; scope-confirms with NCE v2 before split decisions. |
| 1.1 | 2026-05-04 | Casey | Added §11 staffing breakdown — per-item classification (senior / junior / community / wait-and-see) + hours-budget table showing what ships at each spending level + suggested team ask. Recommended Phase 2 minimum sharpened to "~10h senior + ~3h junior" for Tier 1 in full. Renumbered later sections (§11→§12, §12→§13). |

---

*End of Westgard Phase 2 FRS.*
