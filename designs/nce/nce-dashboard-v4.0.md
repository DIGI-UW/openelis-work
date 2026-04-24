# NCE Register & CAPA Management
## Functional Requirements Specification

**Document Version:** 4.0
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Mockup Reference:** `nce-dashboard-v2.jsx` (still valid — only nav chrome changes)
**Supersedes:** `nce-dashboard.md` v3.0 (2026-02-18)

---

## What changed in v4.0

v4.0 is a **rehoming revision**. The data model, CAPA workflow, list/detail UX, batch actions, alerts, API surface, and acceptance criteria from v3.0 are all preserved. What changes is where NCE lives in the information architecture:

- NCE is **no longer a top-level sidenav category**. It is rehomed under the new top-level **Quality Assurance** menu, pillar **QMS & Improvement**, leaf **NCE Register**.
- Default landing view (**My Assignments**) is preserved, but reached via `Quality Assurance → QMS & Improvement → NCE Register → My Assignments`.
- **Analytics** moves under NCE Register (was a sibling submenu under the top-level NCE node; is now a child of NCE Register).
- **Report NCE** remains reachable from every list view via the primary button in the top-right; it also appears as a submenu item under NCE Register for discoverability.
- URL paths re-rooted from `/nce/*` to `/qa/qms/nce/*`. Server emits 301 redirects from old paths for one major release.
- Localization tag namespace re-rooted from `label.menu.nce.*` to `label.menu.qa.qms.nce.*`. Old keys remain valid as aliases for one major release.
- **NCE Configuration** stays in Admin for now (the admin-menu redesign is a parallel initiative). A cross-link from QA → QMS → NCE Register points to `Admin → NCE Configuration`, same pattern as Audit Trail preserves its Admin cross-link.
- RBAC keys (`nce.*`) are unchanged in meaning. They remain the atomic permissions registered under the flexible-roles engine. The new `qa.view.qms` permission gates visibility of the QA → QMS pillar itself; a user needs both `qa.view.qms` **and** the relevant `nce.*` permission to see NCE views.

Everything else — CAPA workflow, status flow, effectiveness review logic, summary cards, filter bar, batch actions, alerts integration, API endpoints, data model — is carried forward from v3.0 unchanged.

---

## Related Documents

| Document | Scope |
|----------|-------|
| **qa-menu-roadmap.md / .xlsx** | QA menu consolidation roadmap — this FRS lands in Sprint 1 / Sprint 2 |
| **NCE Non-Conformity Report FRS v3.1** | NCE creation form, 11 trigger points, full data model including `nce_capa` and `nce_effectiveness_review` tables |
| **NCE Results Entry Integration FRS v3.0** | Long-term target for inline Results Entry NCE flow (current "Report NCE" button is Phase-1 interim; swap in Sprint 6) |
| **NCE Analytics FRS v3.0** | 4 KPIs, 9 charts, 6 reports — lives under QA → QMS → NCE Register → Analytics |

---

## 1. Overview

The NCE Register is the central hub for managing Non-Conformity Events and CAPA (Corrective and Preventive Action) workflows. It sits inside the **Quality Assurance** top-level menu under the **QMS & Improvement** pillar, alongside CAPA Register, Accreditation Status, Audit Trail, and Electronic Signature Log.

### 1.1 Purpose

- Provide a single unified interface for NCE lifecycle management within the QA menu.
- Enable focused task management through filtered views (My Assignments, All NCEs, Pending Verification).
- Support the full CAPA workflow from acknowledgment through effectiveness verification.
- Surface aging/SLA indicators to prevent overdue NCEs.
- Allow batch operations for efficient NCE triage.
- Contribute data upward to the **QA Overview** rollup and the **QMS pillar** landing page.

### 1.2 i18n Requirement

All user-facing text — labels, status names, severity labels, filter options, button text, column headers, summary card titles, breadcrumbs, and menu items — MUST be externalized to resource bundles. Mockups display English labels; this FRS documents the localization tag for each.

Old `label.menu.nce.*` keys remain valid as aliases during the transition; new keys under `label.menu.qa.qms.nce.*` are the canonical form.

---

## 2. Navigation & Menu Structure

### 2.1 Sidenav placement (v4.0)

NCE Register is reached via the new Quality Assurance menu. It is **not** a top-level item.

```
Home
Order
  ├── Order Entry
  ├── Order Search
  ├── Batch Order Entry
  └── Electronic Orders
Results
  ├── Results Entry
  ├── Validation
  └── Result Search
Patient
Sample
Quality Assurance                          ◄── NEW TOP-LEVEL (from qa-menu-roadmap)
  ├── QA Overview
  ├── Statistical QC
  │   ├── Run Review & Levey-Jennings
  │   ├── Westgard Rules
  │   ├── Batch Workplan Reagent QC        (cross-link)
  │   └── Analyzer Manual QC               (cross-link)
  ├── EQA (Proficiency Testing)
  │   ├── My EQA
  │   ├── EQA Oversight
  │   │   ├── EQA Lab Performance
  │   │   ├── Follow-Up Queue
  │   │   └── Analyst Competency
  │   └── EQA Program Management           (eqa.provider only)
  ├── Quality Indicators
  │   ├── QI Dashboard
  │   ├── TAT Compliance                   (deep-link to existing report)
  │   ├── Rejection Rate
  │   ├── Amendment Rate
  │   └── Critical Callback Compliance
  └── QMS & Improvement
      ├── NCE Register                     ◄── THIS FRS
      │   ├── My Assignments               ◄── default landing view
      │   ├── All NCEs
      │   ├── Pending Verification
      │   ├── Report NCE
      │   └── Analytics
      ├── CAPA Register                    (view over existing nce_capa data)
      ├── Accreditation Status
      ├── Audit Trail                      (rehomed from Admin; Admin cross-link preserved)
      └── Electronic Signature Log
Reports
  ├── Routine Reports
  └── Study Reports
Administration
  ├── Test Management
  ├── AMR Configuration
  ├── NCE Configuration                    ◄── stays in Admin; cross-linked from QA → QMS
  ├── Site Information
  └── User Management
```

**Removed in v4.0:** the top-level `NCE` node previously positioned between `Sample` and `Quality Control`.

### 2.2 Sidebar behavior

| Behavior | Description |
|----------|-------------|
| Expand/Collapse | Clicking the **Quality Assurance** parent toggles the full QA submenu; clicking **QMS & Improvement** toggles the pillar submenu; clicking **NCE Register** toggles the five NCE submenu items. |
| Active state | Active submenu item highlighted with teal background (`#e0f2f1`) and left border (`3px solid #00695c`). Parent items in the active path are also expanded. |
| Default expanded | When any NCE view is active, the chain `Quality Assurance → QMS & Improvement → NCE Register` is expanded by default. |
| Badge (optional) | The **NCE Register** node may display a count badge for unacknowledged critical NCEs assigned to the current user. The QMS pillar parent may aggregate this count. |

**No Carbon Tabs** for switching among My Assignments / All NCEs / Pending Verification — they are sidenav submenu items per the OpenELIS sidenav-submenus convention.

### 2.3 Breadcrumbs

Every NCE view displays a four-segment breadcrumb below the header:

```
Quality Assurance  ›  QMS & Improvement  ›  NCE Register  ›  My Assignments
Quality Assurance  ›  QMS & Improvement  ›  NCE Register  ›  All NCEs
Quality Assurance  ›  QMS & Improvement  ›  NCE Register  ›  Pending Verification
Quality Assurance  ›  QMS & Improvement  ›  NCE Register  ›  Report NCE
Quality Assurance  ›  QMS & Improvement  ›  NCE Register  ›  Analytics
```

When viewing a specific NCE detail, a fifth segment is appended: `… › NCE Register › All NCEs › NCE-20260105-0023`.

### 2.4 Localization tags — navigation (v4.0 namespace)

| Element | v4.0 tag | v3.0 tag (alias) |
|---------|----------|------------------|
| Top-level menu | `label.menu.qa` | — |
| QMS pillar | `label.menu.qa.qms` | — |
| NCE Register node | `label.menu.qa.qms.nceRegister` | `label.menu.nce` |
| My Assignments | `label.menu.qa.qms.nce.myAssignments` | `label.menu.nce.myAssignments` |
| All NCEs | `label.menu.qa.qms.nce.allNces` | `label.menu.nce.allNces` |
| Pending Verification | `label.menu.qa.qms.nce.pendingVerification` | `label.menu.nce.pendingVerification` |
| Report NCE | `label.menu.qa.qms.nce.reportNce` | `label.menu.nce.reportNce` |
| Analytics | `label.menu.qa.qms.nce.analytics` | `label.menu.nce.analytics` |
| Breadcrumb separator | `label.breadcrumb.separator` | (unchanged) |

v3.0 tags remain valid aliases for one major release so deployed translations don't break. New translation work uses v4.0 keys only.

### 2.5 URL paths (v4.0)

| View | v4.0 path | v3.0 path (301 redirect for one major release) |
|------|-----------|-----------------------------------------------|
| My Assignments | `/qa/qms/nce/my-assignments` | `/nce/my-assignments` |
| All NCEs | `/qa/qms/nce/all` | `/nce/all` |
| Pending Verification | `/qa/qms/nce/pending-verification` | `/nce/pending-verification` |
| Report NCE | `/qa/qms/nce/report` | `/nce/report` |
| Analytics | `/qa/qms/nce/analytics` | `/nce/analytics` |
| NCE Detail | `/qa/qms/nce/{id}` | `/nce/{id}` |

**API paths are unchanged** — the REST surface continues at `/api/nce/*`. Only UI routes are re-rooted.

### 2.6 Cross-links preserved from the old IA

| From | Link text | To | Why |
|------|-----------|-----|-----|
| Admin sidenav | "NCE Configuration" | `/admin/nce-config` | Admin-side entry preserved; NCE config stays in Admin during this sprint series. |
| QA → QMS → NCE Register (header utility link) | "NCE Configuration ↗" | `/admin/nce-config` | QA Officer can jump directly to config from the register without navigating away. |
| Alerts dashboard | Any NCE alert | `/qa/qms/nce/{id}` | Preserved from v3.0 with the new URL root. |
| Results Entry NCE badge | Badge click | `/qa/qms/nce/{id}` | Preserved with the new URL root. |

---

## 3. Dashboard Views

Unchanged from v3.0 other than sidebar/breadcrumb wiring. Summary of views:

### 3.1 My Assignments (default)

Default landing when navigating to `Quality Assurance → QMS & Improvement → NCE Register`. Filter `assigned_to = current_user` applied automatically. Info banner: "Showing NCEs assigned to {currentUser}". Available actions: Acknowledge, Begin Investigation, Add Note, Assign To (reassign).

### 3.2 All NCEs

No automatic assignment filter. Requires `nce.view.all`. Users without this permission see only their own assignments and NCEs they reported.

### 3.3 Pending Verification

Filter `status = closed_pending_verification` applied automatically. Info banner: "Showing closed NCEs awaiting effectiveness review". Available actions: Effectiveness Review, Add Note.

### 3.4 View switching

Clicking a submenu item in the sidebar updates the content area immediately (no full page reload). The URL updates to reflect the active view under the new `/qa/qms/nce/*` root. Browser Back/Forward works.

---

## 4. Summary Cards

Unchanged from v3.0. Four summary cards (Critical, Major, Minor, Overdue) appear at the top of every list view. Counts reflect the current view's filter scope. Overdue calculation respects the configurable SLA table:

| Severity | Acknowledge SLA | Investigation SLA |
|----------|----------------|-------------------|
| Critical | 24 hours | 48 hours |
| Major | 48 hours | 5 business days |
| Minor | 7 days | 14 days |

SLA times remain configurable via `Admin → NCE Configuration → SLA Settings`.

---

## 5. Filter Bar

Unchanged from v3.0. Controls: Search (free text on NCE number, title, description), Status (dropdown), Category (dropdown), Severity (dropdown), Clear All. Filters persist within session; URL query params reflect active filters for shareability; summary card counts update when filters change.

---

## 6. NCE List

Unchanged from v3.0. Collapsed/expanded row behavior, tabbed detail view (Event Details, Investigation, CAPA (n), History), row actions, and overdue indicators all carry forward as specified in v3.0 §6.

---

## 7. Batch Actions

Unchanged from v3.0. Individual and "select all" (page-scoped) checkboxes; batch action bar with Acknowledge and Assign To actions; constraint that Batch Acknowledge only applies to Open-status NCEs.

---

## 8. CAPA Workflow

Unchanged from v3.0. Status flow, status definitions, Add CAPA inline form, CAPA completion fields, and Effectiveness Review behavior (Effective → Closed-Verified; Not Effective → new linked NCE created, original → Closed-Recurrence) all carry forward.

**Data model note (carried from NCE Report FRS v3.1):** CAPA is **not net-new**. The `nce_capa` and `nce_effectiveness_review` tables are already part of the NCE data model. The separate **CAPA Register** leaf under QA → QMS (specified outside this FRS) is a *view* over the same data, not a new entity.

---

## 9. Aging & SLA Indicators

Unchanged from v3.0. Visual indicators: red clock (overdue), amber clock (approaching due, within 24 hours of SLA), gray clock (within SLA). SLA defaults unchanged.

---

## 10. Pagination

Unchanged from v3.0. Page size 25/50/100 (default 25). Record count "Showing 1–25 of 47" format. Default sort: occurrence date descending (newest first).

---

## 11. "Report NCE" Button

Primary action button in the top-right of every list view (My Assignments, All NCEs, Pending Verification). Label tag updated to `label.nce.action.reportNce` (unchanged key). Click behavior updated to navigate to `/qa/qms/nce/report` (or open the v3.0 inline form once Sprint 6 lands — see the Results Entry FRS reconciliation note below).

**Results Entry note (from qa-menu-roadmap DEC08):** the long-term target for Results Entry NCE reporting is the v3.0 inline-form experience with Sample Action radios, auto-delta-check, mandatory trigger #4, and row-level NCE flag badge. The currently-shipped "Report NCE" button in Results Entry is an interim Phase-1 implementation. Handler swap scheduled for Sprint 6 of the QA menu roadmap.

---

## 12. Alerts Integration

Unchanged from v3.0. Five alerts surface to the OpenELIS Alerts dashboard: Overdue NCE, Approaching SLA, Effectiveness Review Due, Overdue CAPA, Unassigned Critical. Alert deep-links use the new `/qa/qms/nce/{id}` URL root.

---

## 13. API Endpoints

**Unchanged from v3.0.** Backend REST surface remains at `/api/nce/*`. Only UI routes are re-rooted in v4.0. Listed for reference:

### 13.1 Dashboard & List
- `GET /api/nce`
- `GET /api/nce/dashboard`
- `GET /api/nce/my-assignments`
- `GET /api/nce/pending-verification`
- `GET /api/nce/{id}`

### 13.2 Status Transitions
- `POST /api/nce/{id}/acknowledge`
- `POST /api/nce/{id}/begin-investigation`
- `POST /api/nce/{id}/close`
- `POST /api/nce/{id}/effectiveness-review`

### 13.3 CAPA
- `GET /api/nce/{id}/capa`
- `POST /api/nce/{id}/capa`
- `PUT /api/nce/{id}/capa/{capaId}`
- `POST /api/nce/{id}/capa/{capaId}/complete`

### 13.4 Notes & Attachments
- `GET  /api/nce/{id}/notes`
- `POST /api/nce/{id}/notes`
- `GET  /api/nce/{id}/attachments`
- `POST /api/nce/{id}/attachments`

### 13.5 Audit
- `GET /api/nce/{id}/history`

### 13.6 Query Parameters
Unchanged: `status`, `category`, `severity`, `assignedTo`, `assignedToMe`, `dateFrom`, `dateTo`, `search`, `overdue`, `page`, `pageSize`, `sortBy`, `sortOrder`.

---

## 14. Access Control

### 14.1 NCE permissions (unchanged from v3.0)

| Permission | Description |
|------------|-------------|
| `nce.view.own` | View own assignments and reported NCEs (default for all lab users) |
| `nce.view.all` | View all NCEs across the laboratory |
| `nce.acknowledge` | Acknowledge NCEs |
| `nce.investigate` | Begin investigation, record root cause |
| `nce.capa.manage` | Add, update, and complete CAPAs |
| `nce.assign` | Assign/reassign NCEs to other users |
| `nce.effectiveness.review` | Perform effectiveness reviews |
| `nce.batch` | Perform batch actions |

### 14.2 New QA menu permission (v4.0)

| Permission | Description |
|------------|-------------|
| `qa.view.qms` | Visibility of the QA → QMS & Improvement pillar in the sidebar. **Required in addition to any `nce.*` permission** for NCE views to render. |

### 14.3 Visibility rule

```
User sees NCE Register submenu  ⇔  qa.view.qms  ∧  (nce.view.own ∨ nce.view.all)
User sees a specific NCE        ⇔  qa.view.qms  ∧  (nce.view.all ∨ assigned/reported by user)
```

This gating respects the flexible-roles initiative (see `project_flexible_roles.md`): `qa.view.qms` is the pillar visibility atom; `nce.*` remain the entity-level atoms. The default **QA Officer** role ships with both `qa.view.qms` and all `nce.*` permissions bundled. Lab Director and Inspector/Auditor bundles documented in the qa-menu-roadmap.

---

## 15. Acceptance Criteria (v4.0 delta)

Carry forward all v3.0 acceptance criteria. Amend the Navigation section as below; everything else (Dashboard Views, Summary Cards, Filters, NCE List, Batch Actions, CAPA Workflow, Alerts, i18n) is unchanged.

### Navigation (revised)
- [ ] NCE is **not** a top-level sidenav category.
- [ ] NCE Register is reachable at `Quality Assurance → QMS & Improvement → NCE Register`.
- [ ] Five NCE submenu items are present under NCE Register: My Assignments, All NCEs, Pending Verification, Report NCE, Analytics.
- [ ] Clicking each submenu item updates the content area without full page reload.
- [ ] Active submenu item highlighted with teal left border; ancestors (QMS & Improvement, Quality Assurance) are expanded.
- [ ] Breadcrumb displays four segments in list views and five in detail views (`Quality Assurance › QMS & Improvement › NCE Register › {view}` / `… › {NCE number}`).
- [ ] Default landing view is **My Assignments**.
- [ ] Top-level `NCE` node from v3.0 is removed from the sidebar.
- [ ] URL paths under `/qa/qms/nce/*` render correctly; legacy `/nce/*` paths respond with 301 to the new URL.
- [ ] A user missing `qa.view.qms` does not see the QA → QMS pillar in the sidenav even if they have `nce.*` permissions.
- [ ] A user missing any `nce.*` permission does not see NCE Register under a visible QMS pillar.
- [ ] Localization: both v3.0 (`label.menu.nce.*`) and v4.0 (`label.menu.qa.qms.nce.*`) tag families resolve to the same string until the v3.0 alias is removed in the next major release.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | OpenELIS Implementation Team | Initial draft (combined document). |
| 2.0 | 2026-02-14 | OpenELIS Implementation Team | Rejection/cancellation integration. |
| 3.0 | 2026-02-18 | OpenELIS Implementation Team | Split into separate FRS. NCE promoted to top-level menu with submenu navigation replacing tab bar. Inline forms replace modals for CAPA and effectiveness review. |
| 4.0 | 2026-04-23 | Casey Iiams-Hauser | **Rehoming revision.** NCE rehomed under new top-level Quality Assurance menu, pillar QMS & Improvement, leaf NCE Register. Top-level `NCE` sidenav node removed. Analytics moved under NCE Register. URL paths re-rooted from `/nce/*` to `/qa/qms/nce/*` with 301 redirects. Localization namespace re-rooted from `label.menu.nce.*` to `label.menu.qa.qms.nce.*` with v3.0 aliases preserved. New permission `qa.view.qms` gates pillar visibility. NCE Configuration stays in Admin with cross-link from QA. Data model, CAPA workflow, API surface, summary cards, list/detail UX, batch actions, alerts, and i18n carried forward unchanged. |

---

*End of Document*
