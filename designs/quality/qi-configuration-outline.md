# Admin Page: QI Configuration
## FRS Outline — Sprint 4 (QA Menu Roadmap)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored in Sprint 4 alongside the three QI FRSes
**Sidenav placement:** `Admin → QI Configuration` (with cross-link from `Quality Assurance → Quality Indicators → QI Dashboard` header utility)

---

## 1. Purpose

Centralize per-lab configuration of the four Pillar-3 Quality Indicators (TAT Compliance, Rejection Rate, Amendment Rate, Critical Callback Compliance) on a single admin page. Labs decide which QIs are tracked, set targets and action thresholds, and configure QI-specific behaviors.

This page exists because not every QI is universally applicable. Critical Callback Compliance, in particular, is irrelevant for reference labs without direct clinical communication and for research-only labs. Forcing it on for every install would produce nonsensical zeros and false action-threshold breaches. The same opt-out logic, with different defaults, applies to the other QIs.

## 2. Scope

In scope:
- Enable/disable toggle per QI.
- Per-QI target and action threshold configuration.
- Per-QI advanced behavior toggles (e.g., "unable to reach" handling for Critical Callback, comment-only edit counting for Amendment Rate).
- Audit log of every configuration change (who, when, what changed) — fed into the QMS pillar's Audit Trail.

Out of scope for v1:
- Per-test thresholds (deferred per CC-Q6 and similar).
- Multi-site QI configuration (single-site v1 per roadmap DEC03).
- Custom user-defined QIs (v2 enhancement).

## 3. Defaults at install

| QI | Default state | Rationale |
|---|---|---|
| TAT Compliance | Enabled | Universally tracked; existing TAT report already in production. |
| Rejection Rate | Enabled | ISO 15189:2022 §8.8 + CAP GEN.20377 expectation; every clinical lab handles rejections. |
| Amendment Rate | Enabled | CAP GEN.20377 expectation; every clinical lab releases results. |
| Critical Callback Compliance | **Disabled** | Reference labs without direct clinical communication don't perform callbacks. Labs opt in. |

Default targets and thresholds match the per-QI outlines (e.g., Rejection Rate target < 2%, Amendment Rate target < 0.5%, Critical Callback target 100% / action ≥ 95%).

## 4. UI sketch

### 4.1 Page layout

```
Admin › QI Configuration

Quality Indicators tracked by this laboratory
─────────────────────────────────────────────

  ┌─────────────────────────────────────────────────┐
  │ [✓] TAT Compliance                              │
  │     Tracks turnaround time against per-test     │
  │     targets. ISO 15189 §8.8.                    │
  │     Configure thresholds ↗                      │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ [✓] Rejection Rate                              │
  │     Tracks pre-analytical sample rejection.     │
  │     ISO 15189 §8.8 / CAP GEN.20377.             │
  │     Configure thresholds ↗                      │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ [✓] Amendment Rate                              │
  │     Tracks post-release result amendments.      │
  │     CAP GEN.20377.                              │
  │     Configure thresholds ↗                      │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ [ ] Critical Callback Compliance     ⚠ disabled │
  │     Tracks read-back acknowledgment of critical │
  │     results within target callback time.        │
  │     TJC NPSG.02.03.01 / CAP COM.30000 series.   │
  │     Enable to begin tracking.                   │
  └─────────────────────────────────────────────────┘
```

### 4.2 Per-QI detail panel

Clicking "Configure thresholds ↗" expands a per-QI panel inline (not a modal). Each panel surfaces the QI-specific knobs documented in its outline:

**Rejection Rate panel:**
- Unit of measurement: test order (read-only display; spec-locked per RR-Q4 revision)
- Target rate (%) per **test category** (chemistry, hematology, microbiology, molecular, anatomic pathology, overall)
- Action threshold (%) per test category
- **Per-test override table** — labs can pin tighter targets/thresholds for individual tests (e.g., critical INR, beta-hCG). Add/edit/remove rows. Empty by default; category default applies to any test without an override.
- Recompute cadence: hybrid (live ≤ 7d, nightly > 7d) — read-only display; system-managed
- Self-induced rejections: counted in headline (read-only display; spec-locked)

**Amendment Rate panel:**
- Target rate (%) per test category
- Action threshold (%) per test category
- Auto-rerun amendments: count toggle (default OFF)
- Comment-only edits: count toggle (default OFF — only counts changes that alter clinical interpretation)

**Critical Callback Compliance panel** (visible only when enabled):
- Compliance target (%) — default 100%
- Action threshold (%) — default 95%
- Inpatient callback target (minutes) — default 30
- Outpatient callback target (minutes) — default 60
- Read-back required: locked ON (v1)
- "Unable to reach" attempts before non-compliant: default 3
- Out-of-hours target measurement: wall-clock (default) | per-test override list

**TAT Compliance panel:**
- Cross-link to existing TAT report configuration (do not duplicate)

### 4.3 Save behavior

- Save button per panel; per-panel dirty-state indicator.
- Confirmation modal when disabling a QI that currently has alerts or NCEs in flight ("This will hide the dashboard tile, suppress new alerts, and stop NCE auto-generation. Historical data is preserved. Continue?").
- Audit log entry written for every change with prior value → new value diff.
- Save errors surface inline; partial saves not allowed.

### 4.4 Disable behavior cascade

When a QI is disabled (off → on transition reverses these):

| Surface | Behavior |
|---|---|
| QI Dashboard tile | Removed |
| QI detail page route | 404 / redirect to QI Dashboard with banner: "{QI name} is not enabled for this laboratory. Configure in Admin → QI Configuration." |
| Alerts dashboard | New alerts of this QI's type suppressed |
| NCE auto-generation | Hidden NCE subcategory not raised (Critical Callback Failure for CC-QI; Rejection-related NCEs continue under their own triggers regardless) |
| QA Officer training surfaces | The disabled QI is not referenced |
| Background recompute | Job skips this QI |
| Historical data | Preserved; re-enabling restores the full dashboard with history intact |

## 5. Permissions

| Permission | Description |
|---|---|
| `qa.manage.qi` | Required to enable/disable any QI and to edit any threshold or behavior toggle. |
| `qa.view.qi` | View-only access to this page (read all settings, no edit controls visible). |
| `audit.view` | Required to inspect the configuration change audit log inline on this page. |

QA Officer default role bundles `qa.manage.qi` per the QA menu roadmap. Lab Director recipe also includes it.

## 6. Audit log

Every change made on this page produces an entry routed to the QMS pillar's Audit Trail (`/qa/qms/audit-trail`):

- Actor (user)
- Timestamp
- QI affected
- Field changed
- Prior value → new value
- Optional comment from the user (free text, recommended for disable actions)

The audit log entry uses the existing `audit_event` table; no new schema required.

## 7. Acceptance criteria (outline)

- [ ] Page lists all four Pillar-3 QIs with current enabled/disabled state and a one-line description citing the relevant standard.
- [ ] Toggle per QI immediately reflects in the UI; save persists to backend.
- [ ] Disabling a QI cascades the documented behavior (tile removed, detail 404, alerts suppressed, NCE auto-generation suppressed where applicable).
- [ ] Re-enabling a previously-disabled QI restores the dashboard with full historical data.
- [ ] Per-QI detail panels show only the knobs documented for that QI.
- [ ] Confirm modal appears when disabling a QI with active alerts or in-flight NCEs.
- [ ] Audit log entry is written for every change with full diff.
- [ ] User without `qa.manage.qi` sees the page in read-only mode (no toggles, no save buttons).
- [ ] User without `qa.view.qi` and `qa.manage.qi` cannot reach this page.
- [ ] All visible strings localized; no hard-coded English.

## 8. Dependencies

- Sprint 4 build of the three Pillar-3 QIs lands first; this page is the configuration surface for them.
- Audit Trail rehome (Sprint 3) must be complete so the audit log lands in QMS pillar's Audit Trail.
- Admin Menu IA redesign coordination — the `Admin → QI Configuration` placement should be locked jointly with that initiative (see qa-menu-roadmap dependency D3).

## 9. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.admin.qiConfig.title` |
| Section header | `label.admin.qiConfig.sectionHeader` |
| QI enabled toggle | `label.admin.qiConfig.enabled` |
| QI disabled state | `label.admin.qiConfig.disabledState` |
| Configure thresholds link | `label.admin.qiConfig.configureThresholds` |
| Disable confirmation modal title | `label.admin.qiConfig.confirmDisableTitle` |
| Disable confirmation modal body | `label.admin.qiConfig.confirmDisableBody` |
| Audit log section header | `label.admin.qiConfig.auditLogHeader` |

Full list in the Sprint 4 FRS.

---

*Outline only — full FRS authored in Sprint 4.*
