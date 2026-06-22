# Quality Indicator: Critical Callback Compliance
## FRS Outline — Sprint 4 (QA Menu Roadmap)

**Document Version:** 0.2 (outline + locked scope decisions)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline with scope decisions locked; full FRS authored in Sprint 4
**Sidenav placement:** `Quality Assurance → Quality Indicators → Critical Callback Compliance`

---

## 1. Purpose

Track the percentage of critical results that are successfully communicated (called back) to the ordering provider, with documented read-back acknowledgment, within the lab's defined target time.

Critical Callback Compliance is the canonical post-analytical patient-safety QI. CAP COM.30000 series and ISO 15189 §7.4.1.6 both require monitoring this; The Joint Commission identifies failure to communicate critical results as a sentinel-level patient safety event.

This QI consumes the existing critical-result notification log, extended with read-back acknowledgment fields if not already captured, plus the NCE register (every failed callback or out-of-target callback generates an NCE under a new "Critical Callback Failure" subcategory).

## 2. Standards & background

| Source | What they say |
|---|---|
| ISO 15189:2022 §7.4.1.6 | Lab must define critical results, communicate them promptly, and document the communication. |
| CAP COM.30000 series | Documented critical-result reporting policies, including read-back, are required; performance must be monitored. |
| TJC NPSG.02.03.01 | National Patient Safety Goal: report critical results on a timely basis. |
| CLSI GP47 | Provides guidance on critical-value lists and notification timing. |

## 3. Definition

### 3.1 Formula

```
Critical Callback Compliance (%) =
    (Critical Results Successfully Called Within Target ÷ Total Critical Results) × 100
```

A critical result is "successfully called within target" when **all four** of the following are recorded:

1. Caller identity (lab user who placed the call)
2. Recipient identity (clinician who took the call, captured by name + role/credential)
3. Read-back confirmation (the recipient repeated back the result)
4. Time elapsed from result release to recipient acknowledgment ≤ target

### 3.2 Numerator

Critical results released during the reporting window that have a callback log entry meeting all four criteria above.

### 3.3 Denominator

All critical results released during the reporting window. (A result is "critical" if it falls outside the lab-configured critical reference range for that test or carries a critical interpretive flag.)

### 3.4 Reporting window

Daily, weekly, monthly, quarterly, year-to-date. Default dashboard view: rolling 30 days.

### 3.5 "Unable to reach" handling (locked CC-Q2)

A documented callback attempt that fails to reach the recipient (e.g., three attempts, no contact made) is **non-compliant by default**, with a lab-configurable override. Aligned with TJC NPSG.02.03.01 patient-outcome framing: the safety outcome failed regardless of cause.

A separate **Callback Escalation Rate** sub-indicator surfaces attempts vs. successes so labs can distinguish "lab tried but couldn't reach the clinician" from "lab didn't try" without diluting the headline compliance number.

### 3.6 Out-of-hours target measurement (locked CC-Q3)

Target time is measured against **wall-clock**, not business hours. A critical result released at 10pm with a 60-minute target must be acknowledged by 11pm. Aligned with TJC intent (communicate critical results promptly regardless of hour).

Lab-configurable override per test or section is supported for environments that genuinely cannot staff overnight callback for a specific test, with documented justification recorded on the override.

### 3.7 Per-test threshold setting (locked CC-Q6)

**Overall lab target only in v1.** Per-test compliance thresholds are not configurable; per-test breakdowns appear as drill-downs on the detail page so labs see where compliance is dragging without per-test threshold tuning. v2 may add per-test threshold setting if customer demand surfaces.

### 3.8 Auto-paging (locked CC-Q4)

**Deferred until raised by a customer.** No partner labs currently use auto-paging systems. The FRS notes the gap; if a future customer surfaces an auto-paging integration, the rule will be: auto-page counts as callback initiation, but the recipient acknowledgment with read-back is what closes the loop (consistent with TJC's read-back requirement).

### 3.9 Lab-level enablement (locked CC-Q7)

**This QI is optional, not always-on.** Some labs (e.g., reference laboratories without direct clinical communication, research-only labs) do not perform critical-result callback at all. Forcing the QI on for every install would produce nonsensical zeros and false action-threshold breaches.

The Critical Callback Compliance QI is enabled or disabled at the lab level in **Admin → QI Configuration → Critical Callback Compliance** (see §6.4 below). When disabled:

- The tile is removed from the QI Dashboard.
- The detail page is unreachable (404/redirect to QI Dashboard).
- No callback NCEs are auto-generated by missed callbacks.
- The new Critical Callback Failure NCE subcategory (per NCE Report FRS v3.2) is hidden from NCE creation forms.
- Background recompute jobs skip this QI.
- Existing historical data is preserved (re-enabling restores the dashboard with full history).

Default for new installs: **disabled**. Labs opt in during their QI configuration step rather than opting out of a feature they may not use.

## 4. Target defaults (configurable)

| Setting | Default | Source |
|---|---|---|
| Compliance target | 100% | TJC / CAP — "every one, every time" |
| Action threshold | < 95% | Common lab QM-plan threshold |
| Callback target time (inpatient) | 30 minutes | CAP common practice; configurable |
| Callback target time (outpatient) | 60 minutes | CAP common practice; configurable |
| Read-back required | Yes | TJC requirement; cannot be disabled in v1 |

Targets configurable per lab; per-test overrides allowed (e.g., critical INR for warfarin patients may have a tighter callback target).

## 5. Data sources

| Source | Field(s) | Purpose |
|---|---|---|
| `result` table | `id`, `flags`, `released_at`, `analyte_id`, `is_critical` (computed) | Denominator — critical-flagged results |
| `critical_result_callback` table (new or extended) | `result_id`, `caller_user_id`, `recipient_name`, `recipient_role`, `read_back_confirmed`, `attempted_at`, `acknowledged_at`, `outcome` (success / unable_to_reach / refused) | Numerator — callback log with all four required fields |
| `nce_event` (linked via `nce_result_link`) | Created on missed callback (target time exceeded, no acknowledgment, or read-back not confirmed) | Drill-down to NCE detail |

**Possible new field requirement:** if the existing critical-result callback log doesn't already capture all four required elements (caller, recipient, read-back, ack time), the v0.1 spec includes a small schema extension as a Sprint 4 dependency. Confirm during the inventory phase of Sprint 4.

## 6. UI sketch

### 6.1 Tile (on QI Dashboard)

```
┌─────────────────────────────────────────┐
│ Critical Callback Compliance            │
│                                         │
│   97.4%   ↓ 0.8% vs prior 30d           │
│   ▓▓▓▓▓▓░ Target: 100%                  │
│   ▓▓▓▓▓▓▓ Action threshold: ≥ 95%       │
│                                         │
│   76 of 78 critical results acknowledged│
│   2 missed callbacks → 2 NCEs           │
└─────────────────────────────────────────┘
```

### 6.2 Detail page

- KPI strip: compliance %, target, action threshold, count of missed callbacks (with linked NCEs).
- Trend chart: weekly compliance % with target and action-threshold reference lines.
- Median time-to-acknowledge: gauge or bar showing median minutes by inpatient/outpatient.
- Time-to-ack distribution: histogram of acknowledgment elapsed time, with target line drawn through the histogram.
- Section/test breakdown: which tests are dragging compliance down.
- Failure breakdown: missed callbacks split by reason — `unable_to_reach`, `refused`, `over_target`, `no_read_back`, `no_callback_recorded`.
- Drill-through table: one row per missed callback with link to its NCE and the result detail.
- Filters: date range, inpatient/outpatient, section, test, caller, time-of-day.
- Export: CSV (filtered table) and PDF (current view as report).

### 6.3 Visual cues

Inverted color logic relative to Rejection/Amendment Rate (higher is better here):

| State | Cue |
|---|---|
| At 100% | Green tile |
| Between target (100%) and action threshold (95%) | Amber tile |
| Below action threshold (< 95%) | Red tile + alert icon (also surfaces on QA Overview) |

### 6.4 Admin enablement page (cross-reference)

When this QI is **disabled** at the lab level (per §3.9), none of the UI elements in §6.1–§6.3 render. The QI Dashboard simply omits the tile; the detail route returns a 404 (or redirects to QI Dashboard with an info banner: "Critical Callback Compliance is not enabled for this laboratory. Configure in Admin → QI Configuration.").

The enable/disable control lives at:

```
Admin → QI Configuration → Critical Callback Compliance
  ├── Enabled (toggle)
  ├── Compliance target           [shown when enabled]
  ├── Action threshold            [shown when enabled]
  ├── Inpatient callback target   [shown when enabled]
  ├── Outpatient callback target  [shown when enabled]
  ├── Read-back required          [shown when enabled; locked ON in v1]
  └── "Unable to reach" treated as compliant after N attempts  [shown when enabled]
```

Per the QA menu roadmap, the Admin Menu redesign is a parallel initiative; the **QI Configuration** page is a new admin leaf with its own brief outline (`qi-configuration-outline.md`) covering all three Pillar-3 QIs. Reference Rate and Amendment Rate also live there but default to **enabled** (they are universally relevant) while Critical Callback defaults to **disabled** for new installs.

## 7. NCE linkage

- A missed callback (no acknowledgment within target time, OR no read-back recorded, OR no callback at all) generates an NCE in a new subcategory `Post-Analytical / Critical Callback Failure`. This is a new NCE trigger to be added in the NCE Report FRS during Sprint 4 (sub-revision of FRS v3.1, anticipated v3.2).
- Drill-through from a missed-callback row navigates to `/qa/qms/nce/{id}`.
- Threshold breach (< 95% on the rolling window) raises an Alert (`label.alert.qi.criticalCallback.actionThreshold`) on the Alerts dashboard with severity = Critical (the highest severity available — patient safety adjacent).

## 8. Permissions

| Permission | Description |
|---|---|
| `qa.view.qi` | View Quality Indicators pillar including this dashboard. |
| `qa.manage.qi` | Edit compliance target and callback target time. |
| `nce.view.all` | Required to drill through to a specific missed-callback NCE. |
| `result.callback.log` | Existing permission — required to record a callback in Results Entry; does not affect this QI's view. |

Default QA Officer role and Lab Director recipe both bundle `qa.view.qi` + `qa.manage.qi`.

## 9. Acceptance criteria (outline)

- [ ] A critical result with all four required callback elements present and within target time counts as compliant.
- [ ] A critical result with no callback log entry at all counts as non-compliant.
- [ ] A critical result with a callback entry but no read-back confirmation counts as non-compliant.
- [ ] A critical result whose acknowledgment time is past the target counts as non-compliant.
- [ ] An "unable to reach" callback documented with at least three attempts is configurable as compliant or non-compliant; default = non-compliant.
- [ ] Tile color reflects target/action-threshold state.
- [ ] Trend chart, time-to-ack distribution, section breakdown, and failure breakdown all reconcile with the KPI strip.
- [ ] Drill-through from a missed-callback row opens the linked NCE.
- [ ] Threshold breach raises a Critical-severity Alert.
- [ ] All visible strings localized; no hard-coded English.
- [ ] User without `qa.view.qi` does not see the tile or detail page.

## 10. Resolved scope decisions (2026-04-23)

| ID | Question | Decision | Notes |
|---|---|---|---|
| CC-Q1 | Callback log schema | **Audit in Sprint 3.** | Bake into Sprint 3 inventory work alongside the Audit Trail rehome. If schema lacks caller/recipient/read-back/ack-time, Sprint 4 starts with a migration. **Highest-leverage open item.** |
| CC-Q2 | "Unable to reach" handling | **Non-compliant by default; lab-configurable.** | Aligned with TJC NPSG.02.03.01 framing. Separate Callback Escalation Rate sub-indicator surfaces attempts vs. successes. See §3.5. |
| CC-Q3 | Out-of-hours target | **Wall-clock; lab-configurable per-test/section.** | TJC intent. See §3.6. |
| CC-Q4 | Auto-paging integrations | **Deferred until a customer raises it.** | No partner labs currently use auto-paging. FRS documents the future rule. See §3.8. |
| CC-Q5 | Critical-value list location | **Sprint 3 inventory.** | Likely already in `analyte_critical_range` or similar; confirm. |
| CC-Q6 | Per-test threshold setting | **Overall target only in v1.** | Per-test drill-downs surface where compliance is dragging without per-test threshold tuning. v2 may add. See §3.7. |
| CC-Q7 | Mandatory vs. optional QI | **Optional — admin-configurable per lab.** | Reference labs without direct clinical communication don't need it. See §3.9 + new admin page in §6.4. |

## 11. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.qi.criticalCallback.title` |
| Tile label | `label.qi.criticalCallback.tileLabel` |
| Target line | `label.qi.criticalCallback.target` |
| Action threshold line | `label.qi.criticalCallback.actionThreshold` |
| Trend chart title | `label.qi.criticalCallback.trend` |
| Time-to-ack histogram | `label.qi.criticalCallback.timeToAck` |
| Failure breakdown title | `label.qi.criticalCallback.failureBreakdown` |
| Alert (action threshold breach) | `label.alert.qi.criticalCallback.actionThreshold` |
| Failure reason: unable_to_reach | `label.qi.criticalCallback.reason.unableToReach` |
| Failure reason: refused | `label.qi.criticalCallback.reason.refused` |
| Failure reason: over_target | `label.qi.criticalCallback.reason.overTarget` |
| Failure reason: no_read_back | `label.qi.criticalCallback.reason.noReadBack` |
| Failure reason: no_callback_recorded | `label.qi.criticalCallback.reason.noCallbackRecorded` |

Full list in the Sprint 4 FRS.

---

*Outline only — full FRS authored in Sprint 4.*
