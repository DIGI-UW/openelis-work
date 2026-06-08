# M-10 Hub Subscription — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Admin → Hub Subscription
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec unifies what was previously split between AMR Configuration §9 (Hub Subscription for organism/antibiotic/AST Panel updates) and WHONET Integration §2.3 (Import Hub for WHONET codes). One admin page, one mechanism, four data domains.

> This FRS is self-contained. There is no separate addendum — every decision from the design review (update-availability discovery signal/banner; conflict resolution for locally-customized rows; "Activate in Breakpoint Catalog →" hand-off to M-02; import-summary structure + history) is written inline below.

---

## 1. Overview

### 1.1 Purpose

The Hub is a central repository (managed externally by an OE community / consortium) that supplies updates to reference data: breakpoint tables, organism master entries, antibiotic master entries, and WHONET code mappings. OE pulls; never pushes.

A typical scenario: CLSI publishes M100 2026 in January 2026. The Hub maintainers convert it to OE-importable format (per M-02 §7.2 CSV schema). OE deployments pull the new standard from the Hub at their own pace, validate, switch over.

### 1.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Hub Subscription admin | `/admin/hub-subscription` | Admin → Hub Subscription |
| Available updates list | `/admin/hub-subscription/available` | (sub-page) |
| Import history | `/admin/hub-subscription/history` | (sub-page) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Configure subscription URL, check updates, import |
| System Administrator | All actions |

### 1.4 Integration

- **M-01 AMR Reference Data** — organism / antibiotic / AST Panel updates land here.
- **M-02 Breakpoint Catalog** — breakpoint table updates land here; the import summary hands off newly-loaded breakpoint versions to M-02 for activation (§3.4).
- **M-09 WHONET Export** — WHONET code mapping updates land here.

---

## 2. Subscription configuration

### 2.1 Single Hub URL

The lab points OE at one Hub URL (e.g., `https://hub.openelis-global.org`). Authentication via API key configured per deployment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Hub Subscription                                                     │
│                                                                              │
│ Hub Configuration                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Hub URL: *                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ https://hub.openelis-global.org                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  API Key: *                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  [Test Connection]                                                           │
│                                                                              │
│  Subscriptions: (which data domains to pull)                                 │
│  ☑ Breakpoint Tables (CLSI, EUCAST)                                          │
│  ☑ Organism Master                                                           │
│  ☑ Antibiotic Master                                                         │
│  ☑ WHONET Code Mappings                                                     │
│                                                                              │
│  Auto-check for updates: ☑   Frequency: [Daily ▼]                            │
│                                                                              │
│  [Save Configuration]                                                        │
│                                                                              │
│ ──────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ Last update check: 2026-05-15 06:00 (Success)                               │
│ Available updates: 2 [View]                                                  │
│ [Check Now]                                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Update-availability discovery signal

Operators must not have to poll the Hub page to learn that updates exist. When `auto_check` finds available updates (or a manual "Check Now" does), the system raises a passive discovery signal:

- **Nav badge** — a count badge ("N") on the `Admin → Hub Subscription` sidenav item, equal to the number of pending available-update sets across subscribed domains. The badge clears when all available sets have been imported or explicitly dismissed.
- **Admin banner** — on entering any Admin surface, a dismissible banner: *"N updates available from Hub — [View]."* "View" links to the Available Updates page (§3). Dismiss hides the banner for the session but leaves the nav badge until the updates are imported.
- The signal is computed from the result of the last successful check (`hub_subscription_config.last_check_at` / the set of currently-available update sets reported by the Hub) — no new polling on the operator's part.

### 2.3 Data model

```
hub_subscription_config
├── config_id (PK, singleton — only one row per deployment)
├── hub_url (text)
├── api_key (text, encrypted)
├── subscribed_domains (JSON array: ["BREAKPOINTS", "ORGANISMS", "ANTIBIOTICS", "WHONET_CODES"])
├── auto_check_enabled (bool)
├── auto_check_frequency (enum: DAILY, WEEKLY, MONTHLY)
├── last_check_at (timestamp, nullable)
├── last_check_status (enum: SUCCESS, FAILED, IN_PROGRESS)
├── last_check_error (text, nullable)
├── available_update_count (int, default 0 — drives the §2.2 nav badge/banner; refreshed each check)
└── audit columns

hub_import_run
├── run_id (PK)
├── domain (enum: BREAKPOINTS, ORGANISMS, ANTIBIOTICS, WHONET_CODES)
├── triggered_by (FK to user, nullable for auto)
├── triggered_at (timestamp)
├── completed_at (timestamp, nullable)
├── status (enum: IN_PROGRESS, SUCCESS, FAILED, PARTIAL)
├── records_added (int)
├── records_updated (int)
├── records_unchanged (int)
├── records_skipped_customized (int)
├── records_with_conflicts (int)
├── error_summary (text, nullable)
└── audit columns

hub_import_record (per-record audit)
├── record_id (PK)
├── run_id (FK)
├── domain (enum)
├── action (enum: ADDED, UPDATED, SKIPPED_LOCAL_CUSTOMIZED, SKIPPED_UNCHANGED, OVERRIDDEN_LOCAL_CUSTOMIZED, ERROR)
├── target_table (text, e.g., "organism_master")
├── target_id (UUID, nullable)
├── source_data (JSON, the row from the Hub)
├── error_message (text, nullable)
└── audit columns
```

`available_update_count` and the `records_skipped_customized` rollup are the only additions; the `OVERRIDDEN_LOCAL_CUSTOMIZED` action value records the §3.2 explicit-override case.

---

## 3. Available updates

When the user clicks "View" or "Check Now":

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Hub Subscription / Available Updates                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ The Hub has 2 update sets available:                                         │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Breakpoint Tables                                                        │ │
│ │ - CLSI M100 2026 (new version) — 1,312 breakpoints                      │ │
│ │ - EUCAST v15.0 (new version) — 891 breakpoints                          │ │
│ │ Published 2026-04-28 by Hub maintainers                                  │ │
│ │ [Preview Changes]  [Import]                                              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Organism Master                                                          │ │
│ │ - 3 new organisms (Burkholderia mallei, Mycoplasma genitalium,           │ │
│ │   Klebsiella variicola)                                                  │ │
│ │ - 2 updated organisms (Klebsiella pneumoniae intrinsic resistances)     │ │
│ │ Published 2026-05-10 by Hub maintainers                                  │ │
│ │ [Preview Changes]  [Import]                                              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each update is per-domain. The user can preview before importing.

### 3.1 Preview Changes

Side panel showing the diff between current state and Hub state:

- **Added** rows highlighted green
- **Updated** rows highlighted yellow with side-by-side before/after
- **Locally customized** rows highlighted blue with warning "this row was locally customized — by default it will not be updated" — see §3.2 for the conflict-resolution controls.

### 3.2 Conflict resolution for locally-customized rows

A row that the lab has edited locally (`locally_customized = true`) is, by default, **skipped** by an import so lab modifications are never silently clobbered. The operator is not, however, left with only a blue highlight — the preview gives them visibility and an explicit choice per customized row:

- **View the diff anyway.** Each locally-customized row in the preview is expandable to show the full **local-current vs. Hub-incoming** comparison, so the operator can judge whether the Hub change matters even though it will be skipped by default.
- **Explicit per-row override.** Each customized row carries a **"Use Hub version (override local edit)"** control. Choosing it marks that row to be updated by this import despite the customization; the import records it as `OVERRIDDEN_LOCAL_CUSTOMIZED` (distinct from the default `SKIPPED_LOCAL_CUSTOMIZED`) and clears the row's `locally_customized` flag so future imports treat it as seeded again. This requires `micro.hub.manage` and is captured in the per-record audit (who overrode what, with before/after).
- **Default remains skip.** With no explicit override, customized rows are skipped and counted under `records_skipped_customized`; the summary calls them out (§3.4).

### 3.3 Import

Triggers `hub_import_run` for the domain. The import:

1. Adds new rows (seeded = true).
2. Updates existing seeded rows.
3. **Does not modify** rows where `locally_customized = true` (preserves lab modifications) **unless** the operator explicitly chose "Use Hub version" for that row in the preview (§3.2).
4. Writes per-record audit entries in `hub_import_record` (including `OVERRIDDEN_LOCAL_CUSTOMIZED` for explicit overrides).
5. Returns the summary to the user (§3.4).

After import:

- For breakpoint domain: new `breakpoint_standard` rows are created with `status = Loaded`, not yet active. The import summary surfaces an **"Activate in Breakpoint Catalog →"** hand-off (§3.4); activation itself happens in M-02 §8.
- For organism/antibiotic: new rows visible in M-01 reference data lists; existing rows updated as appropriate.
- For WHONET codes: new mappings appear in M-09 admin pages.

### 3.4 Import summary + activation hand-off

On completion the import shows a structured success summary (not free prose), then links to the per-record history:

```
┌─ Import complete — Breakpoint Tables ───────────────────────────────────────┐
│                                                                              │
│  ✓ 3 added   ✓ 2 updated   ⤺ 1 skipped (locally customized)                 │
│  0 errors                                                                    │
│                                                                              │
│  Newly loaded breakpoint versions (not yet active):                          │
│   • CLSI M100 2026   — status: Loaded   [Activate in Breakpoint Catalog →]  │
│   • EUCAST v15.0     — status: Loaded   [Activate in Breakpoint Catalog →]  │
│                                                                              │
│  [View import detail]                                  [Done]               │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Summary structure:** a count line of the form **"{added} added, {updated} updated, {skipped} skipped (customized), {errors} errors"** drawn directly from the `hub_import_run` counters, with the skipped-customized count linking to the affected rows in the preview/diff.
- **Activation hand-off (closes the M-10 → M-02 gap):** for each breakpoint version the import created with `status = Loaded`, the summary renders an **"Activate in Breakpoint Catalog →"** link that deep-links to that version in the M-02 Breakpoint Catalog (M-02 §8) where the lab manager sets its effective date and activates it. Import never auto-activates a breakpoint standard.
- **Link to history:** "View import detail" opens the run's per-record audit (§4), and the summary is itself reachable later from Import History.

---

## 4. Import history

`/admin/hub-subscription/history`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Hub Subscription / Import History                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Date / Time      │ Domain      │ Triggered │ Status  │ Added │ Updated │Skip│ ⋮ │
├──────────────────┼─────────────┼───────────┼─────────┼───────┼─────────┼────┼───┤
│ 2026-05-15 06:01 │ Breakpoints │ Auto      │ Success │ 1,312 │ 0       │ 0  │ ⋮ │
│ 2026-05-10 14:23 │ Organisms   │ Manager   │ Success │ 3     │ 2       │ 1  │ ⋮ │
│ 2026-04-01 06:00 │ All         │ Auto      │ Success │ 0     │ 5       │ 0  │ ⋮ │
│ 2026-03-15 09:14 │ Antibiotics │ Manager   │ Partial │ 1     │ 0       │ 3  │ ⋮ │
│                  │             │           │         │       │         │    │   │
│                  │             │           │ (3 conflicts skipped) │       │    │   │
└──────────────────┴─────────────┴───────────┴─────────┴───────┴─────────┴────┴───┘
```

Click a row to drill into the per-record audit, which shows each row's action (ADDED / UPDATED / SKIPPED_LOCAL_CUSTOMIZED / SKIPPED_UNCHANGED / OVERRIDDEN_LOCAL_CUSTOMIZED / ERROR), target, and source data. The structured summary (§3.4) is regenerated from these counters when a run is reopened.

---

## 5. Permissions

| Action | Permission |
|--------|-----------|
| View Hub Subscription config | `micro.hub.manage` |
| Edit Hub URL / API key / subscriptions | `micro.hub.manage` |
| Manually trigger import | `micro.hub.manage` |
| Override a locally-customized row on import | `micro.hub.manage` |
| View import history | `micro.hub.manage` AND `audit.read` |

---

## 6. Acceptance criteria

- **AC-M10-01**: Configuration page accepts Hub URL + API key.
- **AC-M10-02**: Test Connection button validates URL + API key.
- **AC-M10-03**: Auto-check runs at configured frequency.
- **AC-M10-04**: Available Updates page shows per-domain available updates.
- **AC-M10-05**: Preview Changes shows diff (Added / Updated / Locally Customized).
- **AC-M10-06**: Import adds new rows with `seeded = true`.
- **AC-M10-07**: Import updates existing seeded rows.
- **AC-M10-08**: Locally customized rows preserved by default; flagged in summary.
- **AC-M10-09**: New breakpoint_standard rows imported with `status = Loaded`, not active.
- **AC-M10-10**: Import history shows all past runs with detail drilldown.
- **AC-M10-11**: All actions respect `micro.hub.manage`.
- **AC-M10-12**: Hub authentication failures show clear error.
- **AC-M10-13** *(folds F1)*: When updates are available, a nav badge ("N") appears on the Hub Subscription sidenav item and a dismissible "N updates available from Hub — View" banner appears on Admin surfaces; both derive from the last check, requiring no operator polling.
- **AC-M10-14** *(folds F2)*: A locally-customized row's full local-vs-Hub diff is viewable in the preview, and a per-row "Use Hub version (override local edit)" control lets the operator explicitly override the skip; an override is recorded as `OVERRIDDEN_LOCAL_CUSTOMIZED` in the per-record audit and clears the row's `locally_customized` flag.
- **AC-M10-15** *(folds F3)*: For each newly-loaded breakpoint version, the import summary renders an "Activate in Breakpoint Catalog →" link that deep-links to that version in M-02 for activation; import never auto-activates.
- **AC-M10-16** *(folds F4)*: The import summary shows a structured "{added} added, {updated} updated, {skipped} skipped (customized), {errors} errors" line drawn from `hub_import_run` counters and links to the run's per-record import history.

---

## 7. i18n keys

Estimated 45-55 keys, including the discovery banner (`admin.hub.updatesAvailable.banner`), nav badge (`admin.hub.navBadge`), override control (`admin.hub.preview.useHubVersion`), summary line (`admin.hub.import.summary`), and activation hand-off (`admin.hub.import.activateInCatalog`).

---

## 8. Open verification items

- Confirm Hub URL endpoint format and API contract (managed externally — verify with Hub maintainer team), including the shape of the "available update sets" response that drives `available_update_count`.
- Confirm encrypted API key storage path in OE.
- Confirm the M-02 deep-link target for "Activate in Breakpoint Catalog →" (route + version identifier).

---

## 9. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (consumer of organism/antibiotic/AST Panel updates)
- M-02 Breakpoint Catalog (consumer of breakpoint updates; activation hand-off target — §8)
- M-09 WHONET Export (consumer of WHONET code updates)
- v1.1 AMR Configuration FRS §9 and v1.1 WHONET Integration FRS §2.3 (superseded by unified M-10)
