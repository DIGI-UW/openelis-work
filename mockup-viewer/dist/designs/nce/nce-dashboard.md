# NCE Dashboard & CAPA Management
## Functional Requirements Specification

**Document Version:** 3.0  
**Date:** February 18, 2026  
**Author:** Casey Iiams-Hauser  
**Mockup Reference:** `nce-dashboard-v2.jsx`

---

## Related Documents

| Document | Scope |
|----------|-------|
| **NCE Non-Conformity Report FRS** | NCE creation form, data model, categories, linking workflow, configuration |
| **NCE Results Entry Integration FRS** | Inline NCE form in Results Entry, delta check alerts, trigger integration |
| **NCE Analytics FRS** | KPI dashboard, trend charts, reports, export |

---

## 1. Overview

The NCE Dashboard is the central hub for managing Non-Conformity Events and CAPA (Corrective and Preventive Action) workflows. It provides a unified view of all quality events, task assignment, investigation tracking, and effectiveness verification.

### 1.1 Purpose

- Provide a single unified interface for NCE lifecycle management
- Enable focused task management through filtered views (My Assignments, All NCEs, Pending Verification)
- Support the full CAPA workflow from acknowledgment through effectiveness verification
- Surface aging/SLA indicators to prevent overdue NCEs
- Allow batch operations for efficient NCE triage

### 1.2 i18n Requirement

All user-facing text — including labels, status names, severity labels, filter options, button text, column headers, summary card titles, breadcrumbs, and menu items — MUST be externalized to resource bundles for multi-language (i18n) support. Mockups display English labels; the FRS documents the localization tag for each.

---

## 2. Navigation & Menu Structure

### 2.1 Main Menu Placement

NCE is a **top-level menu category** in the OpenELIS sidebar, positioned between "Sample" and "Quality Control":

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
NCE                          ◄── NEW TOP-LEVEL CATEGORY
  ├── My Assignments         ◄── Default landing view
  ├── All NCEs
  ├── Pending Verification
  ├── Report NCE             ◄── Opens NCE creation form
  └── Analytics              ◄── Opens analytics dashboard
Quality Control
Reports
  ├── Routine Reports
  └── Study Reports
Administration
  ├── Test Management
  ├── AMR Configuration
  ├── NCE Configuration      ◄── Admin settings for NCE
  ├── Site Information
  └── User Management
```

### 2.2 Sidebar Behavior

| Behavior | Description |
|----------|-------------|
| **Expand/Collapse** | Clicking the "NCE" parent item toggles the submenu open/closed |
| **Active State** | Active submenu item highlighted with teal background (`#e0f2f1`) and left border (`3px solid #00695c`) |
| **Default Expanded** | NCE submenu is expanded by default when any NCE view is active |
| **Badge (Optional)** | NCE parent item may display a count badge for unacknowledged critical NCEs assigned to the current user |

### 2.3 Breadcrumb

Every NCE view displays a breadcrumb below the header:

```
NCE  ›  My Assignments
NCE  ›  All NCEs
NCE  ›  Pending Verification
```

### 2.4 Localization Tags — Navigation

| Element | Tag |
|---------|-----|
| Menu category | `label.menu.nce` |
| My Assignments | `label.menu.nce.myAssignments` |
| All NCEs | `label.menu.nce.allNces` |
| Pending Verification | `label.menu.nce.pendingVerification` |
| Report NCE | `label.menu.nce.reportNce` |
| Analytics | `label.menu.nce.analytics` |
| Breadcrumb separator | `label.breadcrumb.separator` |

---

## 3. Dashboard Views

### 3.1 My Assignments (Default)

The default landing view when navigating to NCE. Shows only NCEs assigned to the current user.

**Filter:** `assigned_to = current_user` applied automatically.

**Info Banner:** Blue banner displayed: "Showing NCEs assigned to {currentUser}"

**Available Actions:** Acknowledge, Begin Investigation, Add Note, Assign To (reassign)

### 3.2 All NCEs

Shows all NCEs regardless of assignment. Requires appropriate permission.

**Filter:** No automatic assignment filter.

**Permission:** `nce.view.all` — users without this permission see only their own assignments and NCEs they reported.

### 3.3 Pending Verification

Shows NCEs in "Closed – Pending Verification" status awaiting effectiveness review.

**Filter:** `status = closed_pending_verification` applied automatically.

**Info Banner:** Teal banner displayed: "Showing closed NCEs awaiting effectiveness review"

**Available Actions:** Effectiveness Review, Add Note

### 3.4 View Switching

Clicking a submenu item in the sidebar updates the content area immediately. No full page reload. The URL updates to reflect the active view (e.g., `/nce/my-assignments`, `/nce/all`, `/nce/pending-verification`).

---

## 4. Summary Cards

Four summary cards appear at the top of every list view. Card counts reflect the current view's filter scope.

| Card | Label Tag | Description | Color | Icon |
|------|-----------|-------------|-------|------|
| Critical | `label.nce.severity.critical` | Count of critical severity NCEs in current view | Red (`#d32f2f` on `#fdecea`) | AlertTriangle |
| Major | `label.nce.severity.major` | Count of major severity NCEs in current view | Orange (`#e65100` on `#fff3e0`) | AlertCircle |
| Minor | `label.nce.severity.minor` | Count of minor severity NCEs in current view | Amber (`#f57f17` on `#fffde7`) | FileText |
| Overdue | `label.nce.overdue` | NCEs exceeding response time SLA | Red with pulse animation | Clock |

### 4.1 Overdue Calculation

An NCE is "overdue" when it exceeds the SLA for its current status and severity:

| Severity | Acknowledge SLA | Investigation SLA |
|----------|----------------|-------------------|
| Critical | 24 hours | 48 hours |
| Major | 48 hours | 5 business days |
| Minor | 7 days | 14 days |

SLA times are configurable via Admin → NCE Configuration → SLA Settings.

---

## 5. Filter Bar

### 5.1 Filter Controls

| Filter | Type | Options | Tag |
|--------|------|---------|-----|
| Search | Text input | Free-text search on NCE number, title, description | `label.nce.filter.search` |
| Status | Dropdown | All Status, Open, Acknowledged, Under Investigation, Corrective Action, Closed – Pending (only in Pending Verification view) | `label.nce.filter.status` |
| Category | Dropdown | All Categories, Pre-Analytical, Analytical, Post-Analytical, Administrative | `label.nce.filter.category` |
| Severity | Dropdown | All Severities, Critical, Major, Minor | `label.nce.filter.severity` |
| Clear All | Link button | Resets all filters to default | `label.nce.filter.clearAll` |

### 5.2 Filter Behavior

- Filters are applied client-side for the current page and server-side for pagination
- Filters persist within the current session (not across sessions)
- Summary card counts update to reflect filtered results
- URL query parameters reflect active filters for shareability
- "Clear All" resets all filters and restores the full list

---

## 6. NCE List

### 6.1 Collapsed Row

Each NCE displays as a collapsible row card:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ☐  ▶  ●  NCE-20260105-0023              [Open]  ⏰ Overdue     2 days  │
│         Critical potassium – verify sample integrity                    │
│         Pre-Analytical › Specimen Integrity · Assigned: J. Smith        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Row Elements:**

| Element | Description | Tag |
|---------|-------------|-----|
| Checkbox | Batch selection | — |
| Chevron | Expand/collapse indicator (▶ / ▼) | — |
| Severity Dot | Colored dot (red/orange/amber) matching severity | — |
| NCE Number | Monospace font, links to detail | — |
| Status Badge | Colored pill badge with status label | `label.nce.status.*` |
| Overdue Indicator | Red clock icon + "Overdue" text (if applicable) | `label.nce.overdue` |
| Age | Time since occurrence (e.g., "2 days") | — |
| Title | NCE title text, truncated with ellipsis | — |
| Category/Subcategory | Category › Subcategory path | `label.nce.category.*` |
| Assigned To | User name | `label.nce.assignedTo` |

### 6.2 Expanded Row

Clicking a row expands it to show a tabbed detail view:

#### Tabs

| Tab | Label Tag | Content |
|-----|-----------|---------|
| Event Details | `label.nce.tab.eventDetails` | Description, Immediate Action, Trigger source, Linked items (samples, results), Notes/attachment counts |
| Investigation | `label.nce.tab.investigation` | Root cause category, root cause details; or "Investigation has not started yet" placeholder |
| CAPA (n) | `label.nce.tab.capa` | List of CAPA actions with status indicators; "+ Add CAPA" button |
| History | `label.nce.tab.history` | Timeline of all audit events (created, assigned, status changes, notes added) |

#### Event Details Tab

**Description Block:**
- Label: `label.nce.description`
- Display: Gray background block with full description text

**Immediate Action Block:**
- Label: `label.nce.immediateAction`
- Display: Gray background block with action taken text

**Trigger Source:**
- Label: `label.nce.triggerSource`
- Display: Trigger description (e.g., "Sample rejection at reception (Mandatory)")

**Linked Items:**
- Label: `label.nce.linkedItems`
- Samples displayed with flask icon, lab number, and test list
- Results displayed with chart icon, test name, value, and flag badges
- Each linked item is a clickable link to the source record

**Metadata Footer:**
- Notes count with message icon
- Attachment count with paperclip icon

#### Investigation Tab

When investigation has not started:
- Italic placeholder text: "Investigation has not started yet."
- Tag: `label.nce.investigation.notStarted`

When investigation is in progress or complete:
- Root Cause label + category name (bold)
- Root Cause Details in gray background block

#### CAPA Tab

Each CAPA displays as a card:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ✓  [Corrective] Training                                            │
│    Remedial phlebotomy training on IV arm avoidance                  │
│    Assigned: M. Garcia · Due: 2026-01-15 · Status: in progress      │
└──────────────────────────────────────────────────────────────────────┘
```

**CAPA Card Elements:**

| Element | Description | Tag |
|---------|-------------|-----|
| Status Icon | CheckCircle (completed, green), Clock (in_progress, blue), AlertCircle (pending, gray) | — |
| Type Badge | Corrective / Preventive / Both | `label.nce.capa.type.*` |
| Category | Training, Process Change, Equipment, Documentation, Other | `label.nce.capa.category.*` |
| Description | Free text description | — |
| Assigned To | User name | `label.nce.capa.assignedTo` |
| Due Date | Date | `label.nce.capa.dueDate` |
| Status | pending, in_progress, completed | `label.nce.capa.status.*` |
| Resolution | Shown only for completed CAPAs, green background | `label.nce.capa.resolution` |

**"+ Add CAPA" button:** `label.nce.capa.add`

#### History Tab

Timeline display with colored dots and entries:

```
● A. Johnson created this NCE                    · 2 days ago
● J. Smith was assigned                           · 2 days ago
● J. Smith added a note                           · 1 day ago
```

Dot colors indicate action type (blue = creation, purple = assignment, gray = note).

### 6.3 Row Actions

Actions displayed at the bottom of the expanded row, separated by a border:

| Action | Condition | Style | Tag |
|--------|-----------|-------|-----|
| Acknowledge | Status = open | Primary (teal bg) | `label.nce.action.acknowledge` |
| Begin Investigation | Status = acknowledged | Primary (teal bg) | `label.nce.action.beginInvestigation` |
| Assign To | Any non-closed status | Secondary (outlined) | `label.nce.action.assignTo` |
| Add Note | Any status | Secondary (outlined) | `label.nce.action.addNote` |
| Effectiveness Review | Status = closed_pending | Primary (teal bg) | `label.nce.action.effectivenessReview` |

---

## 7. Batch Actions

### 7.1 Selection

- Individual row checkboxes for selection
- "Select All" checkbox in header (selects visible page only)
- Selected count displayed: "{n} selected"

### 7.2 Batch Action Bar

Appears when one or more rows are selected. Teal background strip.

| Action | Description | Tag |
|--------|-------------|-----|
| Acknowledge | Acknowledge all selected open NCEs | `label.nce.batch.acknowledge` |
| Assign To | Open assignment dropdown for all selected NCEs | `label.nce.batch.assignTo` |

### 7.3 Batch Constraints

- Batch Acknowledge only applies to NCEs in "Open" status; others are skipped with toast notification
- Batch Assign applies to any non-closed NCE
- After batch action, selection is cleared and list refreshes

---

## 8. CAPA Workflow

### 8.1 Status Flow

```
┌────────┐  Acknowledge  ┌──────────────┐  Begin        ┌─────────────────────┐
│  Open  │ ─────────────►│ Acknowledged │ ─────────────►│ Under Investigation │
└────────┘               └──────────────┘               └─────────────────────┘
                                                                   │
                                                        Add CAPA   │
                                                                   ▼
┌───────────────────────┐   Complete All    ┌───────────────────────────────────┐
│ Closed – Pending      │ ◄────────────────│      Corrective Action            │
│ Verification          │      CAPAs       │  (One or more CAPAs in progress)  │
└───────────────────────┘                  └───────────────────────────────────┘
          │
          │ Effectiveness
          │ Review
          ▼
   ┌──────────────┐       Not Effective       ┌──────────────────────┐
   │   Effective  │ ─────────────────────────►│ New Linked NCE Created│
   └──────────────┘                           └──────────────────────┘
          │
          ▼
   ┌──────────────────┐
   │ Closed – Verified │
   └──────────────────┘
```

### 8.2 Status Definitions

| Status | Tag | Description | Available Actions |
|--------|-----|-------------|-------------------|
| Open | `label.nce.status.open` | Newly reported, not yet reviewed | Acknowledge, Assign, Add Note |
| Acknowledged | `label.nce.status.acknowledged` | Reviewed, pending investigation | Begin Investigation, Assign, Add Note |
| Under Investigation | `label.nce.status.underInvestigation` | Root cause analysis in progress | Complete Investigation, Add CAPA, Add Note |
| Corrective Action | `label.nce.status.correctiveAction` | CAPA(s) assigned and in progress | View/Update CAPAs, Add Note |
| Closed – Pending Verification | `label.nce.status.closedPending` | All CAPAs complete, awaiting effectiveness review | Effectiveness Review, Add Note |
| Closed – Verified | `label.nce.status.closedVerified` | Effectiveness confirmed, NCE fully resolved | View only |

### 8.3 Add CAPA

When "Add CAPA" is clicked from the CAPA tab, an inline form expands (not a modal):

**Fields:**

| Field | Required | Type | Options / Tag |
|-------|----------|------|---------------|
| Type | Yes | Radio | Corrective / Preventive / Both — `label.nce.capa.type.*` |
| Category | Yes | Dropdown | Training, Process Change, Equipment, Documentation, Other — `label.nce.capa.category.*` |
| Description | Yes | Textarea | Free text — `label.nce.capa.description` |
| Assign To | Yes | Dropdown | User list — `label.nce.capa.assignTo` |
| Due Date | Yes | Date picker | — `label.nce.capa.dueDate` |

**Actions:** Cancel (`label.button.cancel`), Add CAPA (`label.nce.capa.add`)

### 8.4 CAPA Completion

When completing a CAPA:

| Field | Required | Type | Tag |
|-------|----------|------|-----|
| Resolution Notes | Yes | Textarea | `label.nce.capa.resolutionNotes` |
| Completion Date | Yes | Date picker | `label.nce.capa.completionDate` |
| Attachments | No | File upload | `label.nce.capa.attachments` |

When all CAPAs on an NCE are completed, the NCE automatically transitions to "Closed – Pending Verification" and an effectiveness review date is set (default: 30 days, configurable).

### 8.5 Effectiveness Review

Displayed as an inline form when "Effectiveness Review" is clicked:

| Field | Required | Type | Tag |
|-------|----------|------|-----|
| Review Date | Yes | Date picker | `label.nce.effectiveness.reviewDate` |
| Effective | Yes | Radio (Yes/No) | `label.nce.effectiveness.effective` |
| Evidence | Yes | Textarea | `label.nce.effectiveness.evidence` |
| Notes | No | Textarea | `label.nce.effectiveness.notes` |

**If Effective = Yes:** NCE status → Closed – Verified.

**If Effective = No:** A new linked NCE is created with a reference to the original. The original NCE status → Closed – Recurrence. The new NCE inherits category, subcategory, and linked items from the original.

---

## 9. Aging & SLA Indicators

### 9.1 Visual Indicators

| Indicator | Meaning | Color |
|-----------|---------|-------|
| ⏰ Red | Overdue (exceeded SLA based on severity) | `#d32f2f` |
| ⏰ Amber | Approaching due (within 24 hours of SLA) | `#f57f17` |
| 🕐 Gray | Within SLA | `#a8a8a8` |

### 9.2 SLA Defaults (Configurable)

| Severity | Acknowledge SLA | Investigation Start SLA |
|----------|----------------|------------------------|
| Critical | 24 hours | 48 hours |
| Major | 48 hours | 5 business days |
| Minor | 7 days | 14 days |

---

## 10. Pagination

| Element | Description | Tag |
|---------|-------------|-----|
| Page size selector | Dropdown: 25, 50, 100 per page | `label.pagination.perPage` |
| Record count | "Showing 1–25 of 47" format | `label.pagination.showing` |
| Page buttons | Prev / numbered / Next | `label.pagination.prev`, `label.pagination.next` |

Default page size: 25. Default sort: occurrence date descending (newest first).

---

## 11. "Report NCE" Button

A primary action button appears in the top-right of every list view (My Assignments, All NCEs, Pending Verification):

- Label: `label.nce.action.reportNce`
- Style: Teal background, white text, Plus icon
- Behavior: Navigates to NCE → Report NCE (sidebar submenu and content area switch)
- The Report NCE form is defined in the **NCE Non-Conformity Report FRS**

---

## 12. Alerts Integration

The NCE system surfaces the following items on the OpenELIS Alerts dashboard:

| Alert | Condition | Priority | Tag |
|-------|-----------|----------|-----|
| Overdue NCE | NCE exceeded SLA | High | `label.alert.nce.overdue` |
| Approaching SLA | NCE within 24 hours of SLA | Medium | `label.alert.nce.approachingSla` |
| Effectiveness Review Due | Review date reached or passed | Medium | `label.alert.nce.reviewDue` |
| Overdue CAPA | CAPA past due date | High | `label.alert.nce.capaOverdue` |
| Unassigned Critical | Critical NCE with no assignee | Critical | `label.alert.nce.unassignedCritical` |

---

## 13. API Endpoints

### 13.1 Dashboard & List

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce` | List NCEs with filter/sort/pagination |
| GET | `/api/nce/dashboard` | Summary card counts for current view |
| GET | `/api/nce/my-assignments` | Current user's assigned NCEs |
| GET | `/api/nce/pending-verification` | NCEs in closed-pending status |
| GET | `/api/nce/{id}` | Full NCE detail |

### 13.2 Status Transitions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce/{id}/acknowledge` | Open → Acknowledged |
| POST | `/api/nce/{id}/begin-investigation` | Acknowledged → Under Investigation |
| POST | `/api/nce/{id}/close` | All CAPAs complete → Closed – Pending Verification |
| POST | `/api/nce/{id}/effectiveness-review` | Submit effectiveness review |

### 13.3 CAPA

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/{id}/capa` | List CAPAs for NCE |
| POST | `/api/nce/{id}/capa` | Add CAPA |
| PUT | `/api/nce/{id}/capa/{capaId}` | Update CAPA |
| POST | `/api/nce/{id}/capa/{capaId}/complete` | Complete CAPA with resolution |

### 13.4 Notes & Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/{id}/notes` | Get NCE notes |
| POST | `/api/nce/{id}/notes` | Add note |
| GET | `/api/nce/{id}/attachments` | List attachments |
| POST | `/api/nce/{id}/attachments` | Upload attachment |

### 13.5 Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/{id}/history` | Full audit timeline |

### 13.6 Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `category` | string | Filter by category |
| `severity` | string | Filter by severity |
| `assignedTo` | integer | Filter by assigned user |
| `assignedToMe` | boolean | Filter to current user |
| `dateFrom` | date | Occurrence date start |
| `dateTo` | date | Occurrence date end |
| `search` | string | Full-text search |
| `overdue` | boolean | Filter to overdue only |
| `page` | integer | Page number |
| `pageSize` | integer | Results per page (default: 25) |
| `sortBy` | string | Sort field |
| `sortOrder` | string | asc/desc |

---

## 14. Access Control

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

---

## 15. Acceptance Criteria

### Navigation
- [ ] NCE appears as a top-level menu category in the sidebar
- [ ] Five submenu items are present: My Assignments, All NCEs, Pending Verification, Report NCE, Analytics
- [ ] Clicking each submenu item updates the content area without full page reload
- [ ] Active submenu item is visually highlighted with teal left border
- [ ] Breadcrumb displays correctly for each view (NCE › View Name)
- [ ] Default landing view is "My Assignments"

### Dashboard Views
- [ ] My Assignments shows only NCEs assigned to current user
- [ ] My Assignments displays info banner identifying the current user
- [ ] All NCEs shows all NCEs (permission-gated)
- [ ] Pending Verification filters to closed-pending status only
- [ ] Pending Verification displays info banner explaining the view

### Summary Cards
- [ ] Four summary cards display (Critical, Major, Minor, Overdue)
- [ ] Card counts reflect the active view's filter scope
- [ ] Overdue card uses pulse animation
- [ ] Overdue calculation respects SLA configuration

### Filters
- [ ] Search, Status, Category, Severity filters work independently and in combination
- [ ] "Clear All" resets all filters
- [ ] Summary card counts update when filters change

### NCE List
- [ ] Collapsed rows display NCE number, title, category, severity dot, status badge, assigned to, age
- [ ] Overdue indicator displays for NCEs exceeding SLA
- [ ] Clicking a row expands to show tabbed detail view
- [ ] Event Details tab shows description, immediate action, trigger, linked items
- [ ] Investigation tab shows root cause or "not started" placeholder
- [ ] CAPA tab shows list of CAPAs with status indicators
- [ ] History tab shows audit timeline
- [ ] Row actions display appropriate buttons based on NCE status

### Batch Actions
- [ ] Checkboxes allow individual and batch selection
- [ ] Batch action bar appears when items are selected
- [ ] Batch Acknowledge works for open NCEs (skips others with notification)
- [ ] Batch Assign opens assignment dropdown

### CAPA Workflow
- [ ] NCE can be acknowledged (Open → Acknowledged)
- [ ] Investigation can be started (Acknowledged → Under Investigation)
- [ ] Root cause category and details can be recorded
- [ ] CAPA can be added with type, category, description, assignee, due date
- [ ] CAPA status tracks: Pending → In Progress → Completed
- [ ] CAPA completion requires resolution notes
- [ ] When all CAPAs complete, NCE moves to Closed – Pending Verification
- [ ] Effectiveness review date is set on closure (default: 30 days)
- [ ] Effectiveness review "effective" → Closed – Verified
- [ ] Effectiveness review "not effective" → Creates linked NCE

### Alerts
- [ ] Overdue NCEs appear on Alerts dashboard
- [ ] NCEs approaching SLA appear on Alerts dashboard
- [ ] Effectiveness reviews due appear on Alerts dashboard
- [ ] Overdue CAPAs appear on Alerts dashboard
- [ ] Unassigned critical NCEs appear on Alerts dashboard

### i18n
- [ ] All labels, buttons, status names, and messages use localization tags
- [ ] No hard-coded English strings in the implementation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | OpenELIS Implementation Team | Initial draft (combined document) |
| 2.0 | 2026-02-14 | OpenELIS Implementation Team | Rejection/cancellation integration |
| 3.0 | 2026-02-18 | OpenELIS Implementation Team | Split into separate FRS. NCE promoted to top-level menu with submenu navigation replacing tab bar. Inline forms replace modals for CAPA and effectiveness review. |

---

*End of Document*
