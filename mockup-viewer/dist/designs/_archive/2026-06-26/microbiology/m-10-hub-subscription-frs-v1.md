# M-10 Hub Subscription — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Admin → Hub Subscription
**Phase:** 1B
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec unifies what was previously split between AMR Configuration §9 (Hub Subscription for organism/antibiotic/AST Panel updates) and WHONET Integration §2.3 (Import Hub for WHONET codes). One admin page, one mechanism, four data domains.

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
- **M-02 Breakpoint Catalog** — breakpoint table updates land here.
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

### 2.2 Data model

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
├── records_with_conflicts (int)
├── error_summary (text, nullable)
└── audit columns

hub_import_record (per-record audit)
├── record_id (PK)
├── run_id (FK)
├── domain (enum)
├── action (enum: ADDED, UPDATED, SKIPPED_LOCAL_CUSTOMIZED, SKIPPED_UNCHANGED, ERROR)
├── target_table (text, e.g., "organism_master")
├── target_id (UUID, nullable)
├── source_data (JSON, the row from the Hub)
├── error_message (text, nullable)
└── audit columns
```

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
- **Locally customized** rows highlighted blue with warning "this row will not be updated because it was locally customized"

### 3.2 Import

Triggers `hub_import_run` for the domain. The import:

1. Adds new rows (seeded = true).
2. Updates existing seeded rows.
3. **Does not modify** rows where `locally_customized = true` (preserves lab modifications).
4. Writes per-record audit entries in `hub_import_record`.
5. Returns summary to user.

After import:

- For breakpoint domain: new breakpoint_standard rows are created with `status = Loaded`, not yet active. Lab manager activates explicitly per M-02 §8.
- For organism/antibiotic: new rows visible in M-01 reference data lists; existing rows updated as appropriate.
- For WHONET codes: new mappings appear in M-09 admin pages.

---

## 4. Import history

`/admin/hub-subscription/history`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Hub Subscription / Import History                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Date / Time      │ Domain      │ Triggered │ Status  │ Added │ Updated │ ⋮ │
├──────────────────┼─────────────┼───────────┼─────────┼───────┼─────────┼───┤
│ 2026-05-15 06:01 │ Breakpoints │ Auto      │ Success │ 1,312 │ 0       │ ⋮ │
│ 2026-05-10 14:23 │ Organisms   │ Manager   │ Success │ 3     │ 2       │ ⋮ │
│ 2026-04-01 06:00 │ All         │ Auto      │ Success │ 0     │ 5       │ ⋮ │
│ 2026-03-15 09:14 │ Antibiotics │ Manager   │ Partial │ 1     │ 0       │ ⋮ │
│                  │             │           │         │       │         │   │
│                  │             │           │ (3 conflicts skipped) │     │   │
└──────────────────┴─────────────┴───────────┴─────────┴───────┴─────────┴───┘
```

Click a row to drill into the per-record audit.

---

## 5. Permissions

| Action | Permission |
|--------|-----------|
| View Hub Subscription config | `micro.hub.manage` |
| Edit Hub URL / API key / subscriptions | `micro.hub.manage` |
| Manually trigger import | `micro.hub.manage` |
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
- **AC-M10-08**: Locally customized rows preserved; flagged in summary.
- **AC-M10-09**: New breakpoint_standard rows imported with `status = Loaded`, not active.
- **AC-M10-10**: Import history shows all past runs with detail drilldown.
- **AC-M10-11**: All actions respect `micro.hub.manage`.
- **AC-M10-12**: Hub authentication failures show clear error.

---

## 7. i18n keys

Estimated 35-45 keys.

---

## 8. Open verification items

- Confirm Hub URL endpoint format and API contract (managed externally — verify with Hub maintainer team).
- Confirm encrypted API key storage path in OE.

---

## 9. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (consumer of organism/antibiotic/AST Panel updates)
- M-02 Breakpoint Catalog (consumer of breakpoint updates)
- M-09 WHONET Export (consumer of WHONET code updates)
- v1.1 AMR Configuration FRS §9 and v1.1 WHONET Integration FRS §2.3 (superseded by unified M-10)
