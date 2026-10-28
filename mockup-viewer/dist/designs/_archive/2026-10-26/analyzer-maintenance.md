# Analyzer Maintenance & Service Tracking — Functional Requirements Specification

**Version:** 1.0 (Draft)
**Date:** 2026-06-05
**Status:** Draft for review
**Author:** Casey Iiams-Hauser
**Module:** New top-level `Analyzers` SideNav group + new `EquipmentMaintenanceLog` entity
**Mockup:** `analyzer-maintenance-preview.html`
**Sister epic / consumer:** OGC-897 Management Dashboard (equipment cards extend once this ships) + OGC-896 Home Page Redesign (Lab Snapshot analyzer connections cell extends)

---

## 1. Lab Context

### 1.1 Current State

OpenELIS already manages analyzers — instruments like the Sysmex XN-550, Abbott Architect c4000, or GeneXpert IV — via an entity at `org.openelisglobal.analyzer.valueholder.Analyzer`. Today, analyzer configuration (channels, test mappings, file watchers, HL7 / ASTM message parsing) lives under **Admin → Resources → Analyzer Management** — buried in the admin section that bench techs and lab managers don't typically visit. The page handles instrument *configuration* but not the day-to-day *operational* concerns of running an instrument.

Maintenance — service visits, calibration runs, repair tickets, routine cleaning — is tracked in paper logbooks, side spreadsheets, or vendor emails. None of it lives in OpenELIS. When the calibration interval on a hematology analyzer comes due, the tech in charge has to remember; there's no system reminder. When a service technician visits to repair a GeneXpert, the report goes into a folder somewhere; OpenELIS sees nothing. The lab manager preparing a monthly stakeholder report or an ISO 15189 surveillance audit reconstructs equipment history from invoices, sign-off sheets, and what people remember.

Cold-storage equipment (freezers) has dedicated monitoring with temperature alerts via the `Alert` entity. Lab analyzers don't have an analogous workflow.

### 1.2 Pain

Equipment failures surface late. When the Roche cobas 4800 goes offline at 14:00 on a Tuesday, the first signal is a tech noticing the HIV viral load queue stopped moving — usually after the day's results were supposed to be released. The same thing happens with calibration drift: the lab finds out the analyzer was out of spec when a QC failure flags it, not when the calibration interval lapsed.

Service history is reconstructed, not recorded. When an auditor asks for the last 12 months of maintenance on Analyzer X, the lab manager hunts through emails and binders. The answer often comes back "we think we did it in March" rather than "23 March, calibration by vendor Tech A, downtime 2 hours, signed off by Dr. K."

Cost visibility is missing. A lab manager budgeting for next year has no aggregated figure for what analyzer maintenance actually costs. Each service invoice is a one-off paper trail.

Compliance is fragile. ISO 15189 surveillance audits and similar quality accreditation expect a complete service history with second-person verification on certain events (calibration, after-major-repair QC). Today this lives outside OpenELIS and only some labs maintain it rigorously.

The existing analyzer admin page being **hidden in Admin** is itself a friction point. Most users who need to *use* analyzer data (techs running tests, lab managers planning) don't have an obvious place to navigate; the only people who naturally find Admin → Resources are sysadmin-level users.

### 1.3 What Changes

OpenELIS already has an analyzer area at `frontend/src/pages/analyzers/` with in-progress pages for QC Dashboard, QC Alerts, and Corrective Actions (currently placeholders). This epic **plugs Maintenance into that existing analyzer area** as another menu item alongside the others, rather than inventing a parallel top-level. The analyzer area becomes the single landing for *anything analyzer*: list, QC dashboard, alerts, corrective actions, and now maintenance.

The analyzer area gets a new **Maintenance** page (`/analyzers/maintenance`). One page, not two. A filter dropdown at the top scopes the view: *All analyzers* (cross-lab service history, useful for auditors and lab managers) or a specific analyzer (per-instrument log, useful for the tech who just finished a calibration). Same DataTable, same form, same audit trail — the filter just narrows the rows.

A bench tech who just finished a calibration clicks `+ Log new event`, picks Calibration from a dropdown, enters the date, who performed it (in-house or external vendor), the room the analyzer is in (reusing OpenELIS's existing `StorageRoom` entity at room level), downtime hours, outcome (Completed / In Progress / Failed / Needs Follow-up), and the next due date. Saves. The event is now in the system, audited, and available for the Mgmt Dashboard, the auditor, and the next tech to ask "when was this last calibrated?"

Approaching due dates surface as **Alerts** through the same Alert entity that already handles freezer temperature breaches. Seven days before a calibration is due, an `EQUIPMENT_MAINTENANCE_DUE` Alert fires; the Home page Attention feed and the Mgmt Dashboard equipment cards both pick it up automatically because they already read the Alert table.

For compliance-conscious labs, an optional `verifiedBy` field captures the second-person verification required by ISO 15189 for calibration and major service events. For cost-tracking labs, an optional `cost` field aggregates into the budget. For others, those fields stay empty and don't add friction.

Once this epic ships, OGC-897's Management Dashboard equipment cards stop showing "last activity only" — they extend to render last-service date, next-calibration due, and overdue flags (red) based on `EquipmentMaintenanceLog` data. OGC-896's Lab Snapshot analyzer connections cell similarly evolves from heartbeat-only to lifecycle-aware.

---

## 2. User Stories

- **US-1.** As a **bench technician**, I want to log analyzer maintenance events as they happen so the lab has an accurate service history without me writing it in two places.
- **US-2.** As a **lab manager**, I want to see analyzer-by-analyzer service history and upcoming due dates so I can plan calibration schedules and budget for vendor service visits.
- **US-3.** As a **compliance officer / quality manager**, I want a complete audit trail of every maintenance event with optional second-person verification, so ISO 15189 surveillance audits pass without manual reconstruction.
- **US-4.** As a **lab director**, I want analyzer service status to surface on the Management Dashboard so equipment isn't a silent risk in stakeholder briefings.
- **US-5.** As an **OpenELIS admin migrating from the old IA**, I want existing Analyzer Management configuration to be reachable from the new Analyzers group so my workflow doesn't break.

---

## 3. Overview

This feature elevates Analyzer Management out of `Admin → Resources` into a new top-level **Analyzers** SideNav group and adds a maintenance/service log feature alongside the existing analyzer configuration. The maintenance log captures events (service, calibration, repair, etc. — configurable via Dictionary), surfaces upcoming due dates as Alerts using the existing Alert entity, and provides the data foundation that lets OGC-897 (Management Dashboard) and OGC-896 (Home page) extend their equipment-related surfaces from heartbeat-only to lifecycle-aware.

The work has two distinct slices:

1. **IA elevation:** the existing Analyzer Management page moves from Admin to the new `Analyzers` SideNav group as the `Configuration` submenu of each analyzer's detail page. No data model change; routes change to `/analyzers/{id}/configuration`; a redirect from the old admin URL preserves bookmarks for one release. Existing permissions (Admin bundle) carry over.

2. **Maintenance & Service feature:** new `EquipmentMaintenanceLog` entity, new admin form for entry/edit, list view per analyzer and cross-analyzer, due-date reminder Alerts via a new `EQUIPMENT_MAINTENANCE_DUE` AlertType. Event types are extensible via the existing Dictionary admin mechanism.

---

## 4. Functional Requirements

### 4.1 IA — extending the existing analyzer area

**FR-IA-001 — Add `Maintenance` to the existing analyzer area.** OpenELIS already has a frontend analyzer area at `frontend/src/pages/analyzers/` with in-progress pages (QC Dashboard, QC Alerts, Corrective Actions). This epic adds **Maintenance** as another page in that area. No new top-level SideNav group is invented.

The analyzer area's menu becomes (in display order):

- `All Analyzers` — existing list view
- `QC Dashboard` — existing (placeholder)
- `QC Alerts` — existing (placeholder)
- `Corrective Actions` — existing (placeholder)
- `Maintenance` — **new (this epic)**
- Per-analyzer detail page (existing — accessed by clicking an analyzer in the list)

The Maintenance page consolidates what would otherwise be two views (per-analyzer service history + cross-analyzer maintenance log) into one. A filter dropdown at the top of the page scopes the table.

**FR-IA-002 — Route + breadcrumb.**
- Route: `/analyzers/maintenance` (with optional query param `?analyzerId={id}` to pre-filter)
- Breadcrumb: `Home / Analyzers / Maintenance`
- SideNav placement: under the existing `Analyzers` group, after `Corrective Actions` and before per-analyzer detail

**FR-IA-003 — Configuration stays where it is.** This epic does NOT move the existing per-analyzer configuration pages (the Admin → Analyzer Management work) into a new location. Those pages stay accessible via their current routes. A small future enhancement can rationalize that IA; not in scope here.

### 4.2 Maintenance page

**FR-MAINT-001 — Page layout.** Three stacked sections:

1. **Top: scope filter + summary strip.** A `Carbon <MultiSelect.Filterable>` component at the top — *Filter by analyzer:* — listing every analyzer by name (with type as secondary text). Multi-select with checkboxes; empty selection = `All analyzers`. Multiple analyzers can be selected at once (e.g., both Hematology bench units when comparing throughput on duplicate Sysmex XN-550 instruments).
   - Empty selection (default) → summary strip shows lab-wide counts (e.g., "47 events this period · 3 overdue · 5 due in next 30 days"); table includes `Analyzer` column
   - 1 analyzer selected → summary strip shows that analyzer's name + type + location + last service + next due (with overdue red flag); `Analyzer` column omitted from table (redundant)
   - 2+ analyzers selected → summary strip shows narrowed lab counts ("12 events across 2 analyzers · 1 overdue · 2 due in next 30 days"); `Analyzer` column shown in table

2. **Middle: `+ Log new event` primary button.** When clicked, opens the inline entry form (FR-MAINT-003). If exactly one analyzer is selected in the scope filter, the form's `Analyzer` field defaults to that analyzer (but stays editable in case the user wants to switch).

3. **Bottom: event history.** Carbon `<DataTable>` with inline-row-expansion. Trimmed columns show only the most actionable takeaways; full event detail lives in the expanded row.

**FR-MAINT-002 — DataTable: trimmed columns + expanded-row detail.** Only the most actionable takeaways appear in the table view; the rest of the maintenance record lives in the expanded row.

**Trimmed columns (6 max, default sort by date descending):**

| Column | Source | Visibility |
|---|---|---|
| Analyzer | `analyzerId` → `Analyzer.name` (with `Analyzer.type` shown as smaller secondary text below the name) | Shown when scope filter = `All analyzers` OR 2+ analyzers selected; hidden when exactly 1 analyzer is selected (redundant) |
| Date | `performedDate` | Always |
| Type | `eventTypeId` → Dictionary lookup name (with Carbon `<Tag>` chip coloring per event type) | Always |
| Outcome | `outcome` enum (with Carbon `<Tag>` chip — green for Completed, red for Failed, amber for In Progress / Needs Follow-up) | Always |
| Next due | `nextDueDate` (red text if past due, amber if within 7 days) | Always |
| Actions | Expand/collapse row · Edit · Archive (overflow menu) | Always |

Sortable by every column. Additional toolbar filters (independent of the scope multi-select): date range, event type, outcome, vendor.

**Expanded-row content (shown when row is opened):** A Carbon `Tile` with the full event detail, organized as two columns:

- *Left column:* Performed by · Location (StorageRoom name) · Vendor or "In-house" · Cost (formatted with currency) · Downtime hours
- *Right column:* Parts replaced · Notes (full text, not truncated) · Verified by + verified-at timestamp (or "Not verified")

Edit and Archive buttons live at the bottom of the expanded row.

**FR-MAINT-003 — Entry / edit form (inline row expansion).** When `+ Log new event` is clicked, an inline row expands above the table with a form. When an existing row's `Edit` is clicked, the row expands in place. Fields:

| Field | Carbon component | Required |
|---|---|---|
| Analyzer | `<ComboBox>` (Analyzer search by name; type shown as secondary text) — defaults to scope-filter selection if exactly one analyzer is selected | Yes |
| Event type | `<Select>` (Dictionary lookup, category `EQUIPMENT_MAINTENANCE_TYPE`) | Yes |
| Performed date | `<DatePicker>` | Yes |
| Performed by | `<ComboBox>` (SystemUser search) | Yes |
| Location | `<ComboBox>` (StorageRoom search) — defaults to selected analyzer's current `storageRoomId`; falls back to existing `Analyzer.location` free-text display when no FK is set | No |
| Outcome | `<RadioButtonGroup>` (Completed / In Progress / Failed / Needs Follow-up) | Yes |
| Downtime hours | `<NumberInput>` step 0.5 | No |
| Vendor | `<TextInput>` placeholder "In-house" | No |
| Cost | `<NumberInput>` step 0.01, currency suffix | No |
| Parts replaced | `<TextArea>` | No |
| Notes | `<TextArea>` | No |
| Next due date | `<DatePicker>` | No |
| Verified by | `<ComboBox>` (SystemUser search) | No |

Validation: `outcome = Completed` AND `nextDueDate < performedDate` → warning ("Next due is in the past — was this intentional?"). `cost < 0` → error. `downtimeHours < 0` → error.

**FR-MAINT-004 — Save behavior.** On save:

- Create or update `EquipmentMaintenanceLog` row
- Emit `audit_trail` entry (`EQUIPMENT_MAINTENANCE_LOGGED` for new, `EQUIPMENT_MAINTENANCE_UPDATED` for edit, `EQUIPMENT_MAINTENANCE_VERIFIED` if `verifiedBy` is being newly set)
- If `nextDueDate` is set: schedule (or update) an `EQUIPMENT_MAINTENANCE_DUE` Alert to fire 7 days before that date with severity WARNING; on the due date with severity CRITICAL

**FR-MAINT-005 — Archive behavior.** Maintenance log rows are **archived, not deleted** (soft-delete pattern). Archive action opens a Carbon confirmation modal: *"Archive this maintenance event? It will be hidden from the default view but preserved in the audit trail."* On confirm:

- Set `archived_at = now()` and `archived_by = currentUser` on the row
- Emit `EQUIPMENT_MAINTENANCE_ARCHIVED` audit event
- Row disappears from the default table view

A toolbar toggle `Show archived` reveals archived rows (rendered with muted styling — gray background, "Archived {date} by {user}" tag). When archived rows are visible, the `Archive` action on those rows changes to `Unarchive`, which clears `archived_at` and `archived_by` and emits `EQUIPMENT_MAINTENANCE_UNARCHIVED`.

No hard-delete option exists in v1. If a row was created in error and must be removed entirely, that's a database-level operation outside this UI (and Envers still preserves the history).

### 4.3 Alert pathway for due dates

**FR-ALERT-001 — Reminder Alerts.** New `AlertType` enum value: `EQUIPMENT_MAINTENANCE_DUE`. When an `EquipmentMaintenanceLog.nextDueDate` is reached or approaches:

- **7 days before:** Alert with `severity = WARNING`, `alertType = EQUIPMENT_MAINTENANCE_DUE`, `alertEntityType = "Analyzer"`, `alertEntityId = analyzerId`, `contextData = {logId, eventType, nextDueDate, daysUntilDue}`, `message = "Calibration due in 7 days: {analyzer name}"`
- **On / past due date:** Alert severity escalates to `CRITICAL`; same record, status remains `OPEN` until acknowledged or until a new event with matching `eventTypeId` is logged for that analyzer (which auto-resolves the alert)

A scheduled job (`@Scheduled` in Spring) runs daily to evaluate due dates and emit / update Alerts. Uses the existing Alert dedup mechanism.

**FR-ALERT-002 — Downstream consumer wiring.** OGC-897 Management Dashboard equipment cards subscribe to Alerts with `alertType = EQUIPMENT_MAINTENANCE_DUE`. OGC-896 Home Attention feed gets an equipment-due row when these Alerts exist. Neither needs to know about `EquipmentMaintenanceLog` directly — they only consume Alerts.

---

## 5. Data Model

### 5.1 Reused entities

| Entity (Java path) | Used by | Notes |
|---|---|---|
| `Analyzer` (`org.openelisglobal.analyzer.valueholder.Analyzer`) | FK target from `EquipmentMaintenanceLog.analyzerId`; display uses `Analyzer.name` (lab-given designation) AND `Analyzer.type` / `analyzer_type_id` (model identifier, e.g., "Sysmex XN-550") as separate display elements — never collapse the two. Multiple analyzers can share a type; name disambiguates. | Existing entity. Existing `Analyzer.location` is a free-text varchar(60) that this epic does NOT remove — coexists with the new `storageRoomId` FK. Future enhancement: add `serialNumber`, `assetTag`, `installationDate` (see §11 Open questions). Adding `storageRoomId` is a small schema extension on this existing entity. |
| `StorageRoom` (`org.openelisglobal.storage.valueholder.StorageRoom`) | FK target for analyzer location | Reused at room level only. The hierarchy below Room (StorageDevice / StorageShelf / StorageRack / StorageBox) is for sample storage, not analyzer placement |
| `SystemUser` (`org.openelisglobal.systemuser.valueholder.SystemUser`) | FK targets for `performedBy` and `verifiedBy` | Existing |
| `Dictionary` (`org.openelisglobal.dictionary.valueholder.Dictionary`) | FK target for `eventTypeId` | New Dictionary category `EQUIPMENT_MAINTENANCE_TYPE` seeded with: Service, Calibration, Repair, Inspection, Cleaning. Labs extend via existing Dictionary admin UI |
| `Alert` (`org.openelisglobal.alert.valueholder.Alert`) | Receives `EQUIPMENT_MAINTENANCE_DUE` Alert records | Existing polymorphic alert pathway; reuse-as-is |
| `Analysis` (`org.openelisglobal.analysis.valueholder.Analysis`) | Read for "department / use" derivation and last-activity calculation | Existing; uses `analyzerId` field already on Analysis |

### 5.2 New entities

**`EquipmentMaintenanceLog`** — `@Audited` (Envers).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | PK |
| `analyzerId` | FK → `Analyzer.id` | Yes | Which analyzer this event is for |
| `eventTypeId` | FK → `Dictionary.id` (category `EQUIPMENT_MAINTENANCE_TYPE`) | Yes | What kind of event |
| `storageRoomId` | FK → `StorageRoom.id` | No | Where the analyzer is located; defaults from analyzer's current location at log time |
| `performedDate` | timestamp | Yes | When the event happened |
| `performedBy` | FK → `SystemUser.id` | Yes | Who performed it (in-house tech) |
| `outcome` | enum (`COMPLETED`, `IN_PROGRESS`, `FAILED`, `NEEDS_FOLLOW_UP`) | Yes | Result of the event |
| `downtimeHours` | numeric(5,2) | No | Instrument out of service for X hours |
| `vendor` | varchar(255) | No | External service provider name; empty = in-house |
| `cost` | numeric(10,2) | No | Cost for budget/accounting; currency from system config |
| `partsReplaced` | text | No | Free text in v1 |
| `notes` | text | No | Description, observations, follow-up actions |
| `nextDueDate` | date | No | Next service/calibration due; drives reminder Alert |
| `verifiedBy` | FK → `SystemUser.id` | No | Second-person verification (for ISO 15189 compliance) |
| `verifiedAt` | timestamp | No | Set when verifiedBy is set |
| `archivedAt` | timestamp | No | Soft-delete timestamp; null = active, non-null = archived |
| `archivedBy` | FK → `SystemUser.id` | No | User who archived; null when row is active |
| Standard audit columns | `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` | Yes (auto) | |

**New `Analyzer.storageRoomId` field** (extends existing entity, no separate row in this table). FK → `StorageRoom.id`, optional. Lets the analyzer have a "home" location independent of any single maintenance event. Defaults the form's location field.

**New `AlertType` enum value:** `EQUIPMENT_MAINTENANCE_DUE`. Added to existing `org.openelisglobal.alert.valueholder.AlertType` enum.

**New Dictionary category** `EQUIPMENT_MAINTENANCE_TYPE` seeded with `Service`, `Calibration`, `Repair`, `Inspection`, `Cleaning` on initial migration.

---

## 6. Dependencies and adjacent epics

### 6.1 Dependencies (in scope for this epic)

- New `EquipmentMaintenanceLog` entity with `@Audited`
- New Dictionary category seed
- New `AlertType` enum value + reminder service (`@Scheduled` daily evaluator)
- `Analyzer.storageRoomId` field addition (small schema extension)
- IA: new top-level `Analyzers` SideNav group + per-analyzer submenu pattern + old route redirects
- All FR-LIST-*, FR-MAINT-*, FR-LOG-*, FR-ALERT-* requirements

### 6.2 Adjacent epics and downstream consumers (waiting on this)

- **OGC-897 Management Dashboard** equipment cards extend from last-activity-only to show last-service, next-calibration, and overdue states once `EquipmentMaintenanceLog` is populated.
- **OGC-896 Home Page Redesign** Lab Snapshot analyzer connections cell similarly extends. Home Attention feed gets a new "Equipment maintenance overdue" row when `EQUIPMENT_MAINTENANCE_DUE` Alerts exist with status OPEN.
- **Future QA Dashboard equipment status panel** consumes the same data.

### 6.3 Out of OpenELIS scope

- Non-analyzer equipment (microscopes, centrifuges, ambient labware) — separate future epic if a need surfaces.
- Mobile / portable equipment tracking — separate future epic.

---

## 7. Permissions, Audit, and Localization

### 7.1 Role attachment

| Surface | Role required | Notes |
|---|---|---|
| Existing analyzer area (`All Analyzers`, `QC Dashboard`, `QC Alerts`, `Corrective Actions`, per-analyzer detail) | Existing analyzer-area permission (carries over unchanged) | No change — this epic doesn't alter access to the existing pages |
| `Maintenance` page — view | Same as the existing analyzer area | Read access for anyone with access to the analyzer area |
| `Maintenance` page — log / edit / archive | Existing Admin bundle | Same write permission as analyzer admin; no new grant needed |
| `verifiedBy` field assignment | Existing Admin bundle | No new grant; some labs may want a separate "quality manager" sub-grant in future (v1.x consideration) |

Per the binary-admin + role-bundles convention, no new per-action permission keys are introduced.

### 7.2 Audit events

| Event verb | Trigger | Target | Payload | Actor |
|---|---|---|---|---|
| `EQUIPMENT_MAINTENANCE_LOGGED` | New `EquipmentMaintenanceLog` row created | `EquipmentMaintenanceLog.id` | `{analyzerId, eventTypeId, performedDate, performedBy, outcome, downtimeHours, vendor, cost, nextDueDate}` | Spring Security current user |
| `EQUIPMENT_MAINTENANCE_UPDATED` | Existing row edited | `EquipmentMaintenanceLog.id` | `{fieldsChanged: {field: {old, new}}, ...}` | Spring Security current user |
| `EQUIPMENT_MAINTENANCE_ARCHIVED` | Row archived (soft-delete: `archived_at` set) | `EquipmentMaintenanceLog.id` | `{archivedRecord: {analyzerId, eventTypeId, performedDate}, archivedAt}` | Spring Security current user |
| `EQUIPMENT_MAINTENANCE_UNARCHIVED` | Archived row restored (`archived_at` cleared) | `EquipmentMaintenanceLog.id` | `{restoredRecord: {analyzerId, eventTypeId, performedDate}}` | Spring Security current user |
| `EQUIPMENT_MAINTENANCE_VERIFIED` | `verifiedBy` field newly set | `EquipmentMaintenanceLog.id` | `{verifiedBy, verifiedAt}` | Spring Security current user |
| `ANALYZER_LOCATION_UPDATED` | `Analyzer.storageRoomId` updated | `Analyzer.id` | `{old: roomId, new: roomId}` | Spring Security current user |

Payloads include only entity IDs and configuration data — no patient PII (analyzers don't carry patient data anyway).

### 7.3 Envers coverage

| Entity | `@Audited` | Rationale |
|---|---|---|
| `EquipmentMaintenanceLog` | Yes | Configuration / compliance-grade record; ISO 15189 audit trail requires complete history. Archive (soft-delete) preserves rows in the table; Envers additionally tracks edit history |
| `Analyzer` (existing, with new `storageRoomId` field) | Verify existing `@Audited` status; new field inherits whatever's there. Recommend Yes. | Equipment master data; changes are audit-worthy |

### 7.4 Localization

All visible strings use the i18n helper. Key naming follows `[category].[feature].[identifier]` convention.

**SideNav and breadcrumbs (only the new keys added by this epic):**

| Key | Default English |
|---|---|
| `sidenav.analyzers.maintenance` | Maintenance |
| `breadcrumb.analyzers.maintenance` | Maintenance |

Existing keys for the analyzer area (`sidenav.analyzers`, `sidenav.analyzers.all`, `sidenav.analyzers.qcDashboard`, `sidenav.analyzers.qcAlerts`, `sidenav.analyzers.correctiveActions`, etc.) carry over unchanged from the existing analyzer pages.

**Scope filter:**

| Key | Default English |
|---|---|
| `label.analyzers.maintenance.scope.label` | Filter by analyzer |
| `label.analyzers.maintenance.scope.allAnalyzers` | All analyzers |
| `label.analyzers.maintenance.summary.allAnalyzers` | {0} events this period · {1} overdue · {2} due in next 30 days |

**Maintenance page:**

| Key | Default English |
|---|---|
| `label.analyzer.maintenance.title` | Maintenance |
| `label.analyzer.maintenance.summary.lastService` | Last service: {0} |
| `label.analyzer.maintenance.summary.nextDue` | Next due: {0} |
| `label.analyzer.maintenance.summary.overdue` | Overdue: {0} |
| `label.analyzer.maintenance.button.logNew` | + Log new event |
| `label.analyzer.maintenance.column.analyzer` | Analyzer |
| `label.analyzer.maintenance.column.date` | Date |
| `label.analyzer.maintenance.column.type` | Type |
| `label.analyzer.maintenance.column.performedBy` | Performed by |
| `label.analyzer.maintenance.column.outcome` | Outcome |
| `label.analyzer.maintenance.column.downtime` | Downtime |
| `label.analyzer.maintenance.column.vendor` | Vendor |
| `label.analyzer.maintenance.column.nextDue` | Next due |
| `label.analyzer.maintenance.column.notes` | Notes |
| `label.analyzer.maintenance.column.verified` | Verified |
| `label.analyzer.maintenance.column.actions` | Actions |
| `label.analyzer.maintenance.outcome.completed` | Completed |
| `label.analyzer.maintenance.outcome.inProgress` | In Progress |
| `label.analyzer.maintenance.outcome.failed` | Failed |
| `label.analyzer.maintenance.outcome.needsFollowUp` | Needs Follow-up |
| `label.analyzer.maintenance.vendor.inHouse` | In-house |
| `label.analyzer.maintenance.form.analyzer` | Analyzer |
| `label.analyzer.maintenance.form.eventType` | Event type |
| `label.analyzer.maintenance.form.performedDate` | Date performed |
| `label.analyzer.maintenance.form.performedBy` | Performed by |
| `label.analyzer.maintenance.form.location` | Location |
| `label.analyzer.maintenance.form.outcome` | Outcome |
| `label.analyzer.maintenance.form.downtime` | Downtime (hours) |
| `label.analyzer.maintenance.form.vendor` | Vendor (leave empty if in-house) |
| `label.analyzer.maintenance.form.cost` | Cost |
| `label.analyzer.maintenance.form.partsReplaced` | Parts replaced |
| `label.analyzer.maintenance.form.notes` | Notes |
| `label.analyzer.maintenance.form.nextDueDate` | Next due date |
| `label.analyzer.maintenance.form.verifiedBy` | Verified by |
| `label.analyzer.maintenance.form.save` | Save event |
| `label.analyzer.maintenance.form.cancel` | Cancel |
| `label.analyzer.maintenance.form.archive` | Archive event |
| `label.analyzer.maintenance.form.unarchive` | Unarchive event |
| `label.analyzer.maintenance.confirmArchive` | Archive this maintenance event? It will be hidden from the default view but preserved in the audit trail. |
| `label.analyzer.maintenance.toolbar.showArchived` | Show archived |
| `label.analyzer.maintenance.tag.archived` | Archived {0} by {1} |
| `validation.analyzer.maintenance.nextDuePast` | Next due date is in the past — is that intentional? |
| `validation.analyzer.maintenance.negativeCost` | Cost cannot be negative. |
| `validation.analyzer.maintenance.negativeDowntime` | Downtime cannot be negative. |
| `label.alert.equipmentMaintenanceDue.title` | Maintenance due |
| `label.alert.equipmentMaintenanceDue.message` | {0}: {1} due in {2} days |
| `label.alert.equipmentMaintenanceDue.messageOverdue` | {0}: {1} overdue by {2} days |

---

## 8. Acceptance Criteria

### 8.1 IA

- [ ] `Maintenance` menu item appears in the existing analyzer area, after `Corrective Actions` and before per-analyzer detail
- [ ] No new top-level SideNav group is introduced
- [ ] Existing analyzer pages (`All Analyzers`, `QC Dashboard`, `QC Alerts`, `Corrective Actions`, per-analyzer detail) remain unchanged
- [ ] Route `/analyzers/maintenance` is reachable; query param `?analyzerId={id}` pre-filters scope correctly
- [ ] Breadcrumb chain renders `Home / Analyzers / Maintenance`
- [ ] Deep-linking works — pasting `/analyzers/maintenance?analyzerId=X` into a new tab lands on the filtered view

### 8.2 Maintenance page

- [ ] Page renders at `/analyzers/maintenance` with the scope filter dropdown at the top
- [ ] Scope filter defaults to `All analyzers` when no query param is supplied
- [ ] When a specific analyzer is selected (via dropdown or query param), summary strip shows that analyzer's name, location, last service, next-due (with overdue red flag if applicable)
- [ ] When `All analyzers` is selected, summary shows lab-wide event counts (X events this period · Y overdue · Z due in next 30 days)
- [ ] DataTable shows `Analyzer` column when scope = `All analyzers`; hides it when filtered to a specific analyzer
- [ ] `+ Log new event` button opens inline-expansion form at top of the table
- [ ] Form has 13 fields per FR-MAINT-003 (including the new `Analyzer` field); required fields enforced; validation warnings/errors render correctly
- [ ] When the scope filter has a specific analyzer selected, the form's `Analyzer` field defaults to that analyzer but stays editable
- [ ] Save creates an `EquipmentMaintenanceLog` row and emits `EQUIPMENT_MAINTENANCE_LOGGED` audit event
- [ ] If `nextDueDate` set, an `EQUIPMENT_MAINTENANCE_DUE` Alert is scheduled per FR-MAINT-004
- [ ] Existing rows editable via inline row expansion; save emits `EQUIPMENT_MAINTENANCE_UPDATED`
- [ ] Archive is allowed with confirmation modal; sets `archived_at` + `archived_by`; emits `EQUIPMENT_MAINTENANCE_ARCHIVED` audit event
- [ ] Default table view excludes rows with `archived_at IS NOT NULL`
- [ ] `Show archived` toolbar toggle reveals archived rows with muted styling and "Archived {date} by {user}" tag
- [ ] When archived rows are visible, the action becomes `Unarchive`; restoring clears `archived_at` + `archived_by` and emits `EQUIPMENT_MAINTENANCE_UNARCHIVED`
- [ ] Setting `verifiedBy` for the first time emits `EQUIPMENT_MAINTENANCE_VERIFIED` audit event
- [ ] No hard-delete UI is exposed in v1
- [ ] Envers preserves complete row edit history; archive state is captured via the entity's own `archived_at` field plus the audit event

### 8.3 Alert pathway

- [ ] New `EQUIPMENT_MAINTENANCE_DUE` AlertType added to enum
- [ ] Daily `@Scheduled` job evaluates `EquipmentMaintenanceLog.nextDueDate` and emits Alerts:
  - 7 days before due → Alert with `severity = WARNING`
  - On / past due date → Alert escalates to `severity = CRITICAL` (existing record, status remains OPEN)
- [ ] Logging a new event with matching `eventTypeId` for the same analyzer auto-resolves the prior due Alert
- [ ] Alert message and contextData populated per FR-ALERT-001
- [ ] Existing Alert dedup mechanism prevents duplicate Alerts within 30 minutes

### 8.4 Cross-cutting

- [ ] All visible strings localized; no hardcoded English
- [ ] All tabular data uses Carbon `<DataTable>`
- [ ] All inline styles use Carbon `--cds-*` tokens
- [ ] All write actions audit_trail-logged with documented payloads
- [ ] `@Audited` on `EquipmentMaintenanceLog`
- [ ] WCAG 2.1 AA: keyboard navigation, sufficient contrast, ARIA roles

---

## 9. Non-functional requirements

- **Performance:** Maintenance page renders < 1.5s for a lab with 50 analyzers and 5 years of maintenance history (worst case = `All analyzers` scope with full year filter). Per-analyzer-filtered view renders < 1s for an analyzer with 200 historical events.
- **Scheduled job:** Daily evaluator runs at 06:00 local time; takes < 30 seconds for a lab with 100 analyzers and 1,000 future-dated maintenance logs.
- **Accessibility:** WCAG 2.1 AA. Severity in Alerts conveyed via color AND text.
- **Localization:** English, French, Spanish, Portuguese, Bahasa Indonesia at launch; structure supports additional locales without code changes.
- **Browser support:** Modern Chrome, Firefox, Safari, Edge. No IE11.
- **Bandwidth:** Optimized for low-bandwidth deployments (PNG, Indonesia, Madagascar). Initial payload < 200KB JS + CSS.

---

## 10. Out of scope (deferred)

| Item | Reason | Lands in |
|---|---|---|
| Attachments (PDF service reports, vendor invoices) | Generic attachment model not in OpenELIS; standalone effort | Future epic |
| Pre/post-QC auto-link (attaching QC runs to a calibration event) | Workflow complexity; not a v1 blocker | v1.x |
| Parts inventory tracking (structured parts list with Inventory integration) | v1 uses free-text `partsReplaced`; structured needs inventory model extension | v1.x or separate |
| Non-analyzer equipment (microscopes, centrifuges, etc.) | Different domain; analyzer-specific in v1 | Future epic |
| Mobile / portable equipment tracking | Different domain | Future epic |
| Reminder delivery via email/SMS (beyond in-app Alerts) | Requires notification infrastructure; in-app Alert is sufficient for v1 | v1.x |
| Per-deployment "verifiedBy required" rule for specific event types | Some labs require it, others don't; default is optional in v1 | v1.x admin config |
| Separate Quality Manager role with elevated verification permission | v1 reuses Admin bundle; new sub-grant if labs need it | v1.x |
| Cost rollup dashboard (sum spend per quarter, per vendor) | Separate reporting concern | Future Reports work |
| Vendor / external service provider master data (vs. free-text varchar) | v1 uses varchar; if labs want structured vendors with contact info, future enhancement | Future epic |
| Auto-purge of archived maintenance events | **Never.** ISO 15189 and accreditation audits require a permanent service history. Archived rows are hidden from the default view but preserved indefinitely in the database (and tracked by Envers). No retention policy or auto-purge schedule exists. | Out of scope permanently |

---

## 11. Open questions (TBD before /breakdown)

1. **`Analyzer.storageRoomId` migration:** existing analyzer rows have no location. Migration sets it null; deployments can backfill via admin. Confirm this is acceptable vs. requiring an upfront assignment migration.
2. **Existing analyzer-area permission name:** confirm exact permission/grant identifier in `system_role_module` so the new Maintenance page inherits the same access scope. (Possible names: `analyzerManagement`, `analyzers`, `analyzer_admin` — verify against live.)
3. **`Analyzer.serialNumber` / `assetTag`:** worth adding for asset tracking and search? Low cost, high value for compliance. Recommended yes, but not strictly required.
4. **Default value for `outcome` when logging a new event:** `Completed` (most common) or null (force selection)? Recommended `Completed` for ergonomic default.
5. **Cost currency:** picked up from existing OpenELIS system config (which has a currency setting), or per-event override? Recommended single system-wide currency in v1.
6. **Existing Alert page UI:** verify it can render `EQUIPMENT_MAINTENANCE_DUE` polymorphically; if not, scope a small extension to render analyzer-specific context.
7. **`@Scheduled` job placement:** new dedicated component, or extend an existing scheduled-evaluator service (e.g., the freezer-temperature evaluator)? Recommended new component to keep ownership clean.

---

*End of FRS — version-agnostic. Slicing into versions, story decomposition, and sprint capacity happen in `/breakdown`. Data model verified against `OpenELIS-Global-2/develop` SHA d7435687 on 2026-06-05.*
