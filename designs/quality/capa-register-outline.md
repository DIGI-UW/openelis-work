# CAPA Register
## FRS Outline — Sprint 3 (QA Menu Roadmap)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored in Sprint 3
**Sidenav placement:** `Quality Assurance → QMS & Improvement → CAPA Register`

---

## 1. Purpose

CAPA Register gives the QA Officer a view of every Corrective and Preventive Action across all NCEs in one place — sortable, filterable, drillable to the parent NCE. ISO 15189:2022 §8.7 / §8.9 expect a lab to be able to enumerate its open and closed CAPAs and demonstrate effectiveness; this register is that surface.

**Critical scope note (DEC05):** CAPA is **not a new entity**. The full data model — `nce_capa` and `nce_effectiveness_review` tables — is already specified in NCE Report FRS v3.1 and will exist by Sprint 2. CAPA Register is a **standalone view** over that data, not a new entity or a parallel store.

## 2. Scope

In scope:
- List view of all CAPAs across all NCEs.
- Filter by: status, type (Corrective/Preventive/Both), category (Training/Process Change/Equipment/Documentation/Other), assigned user, date range, parent NCE severity.
- Sort by: due date, status, parent NCE severity, assignee.
- Drill-through to parent NCE detail.
- Drill-through to effectiveness review (where applicable).
- Overdue indicators (CAPAs past their due date and not completed).
- Bulk actions: reassign, change status (limited per CAPA-level permissions).

Out of scope:
- Authoring or editing CAPAs (that lives on the NCE detail page per NCE Report FRS v3.1 §8).
- Adding effectiveness reviews (also on NCE detail).
- Multi-site rollup (single-site v1 per DEC03).
- Standalone CAPAs not linked to an NCE (does not exist in the data model — every CAPA has a parent NCE).

## 3. Page layout

```
Quality Assurance › QMS & Improvement › CAPA Register

  ┌─────────────────────────────────────────────────────────────────┐
  │ Summary                                                          │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
  │  │  In      │ │ Pending  │ │ Overdue  │ │ Completed│            │
  │  │ Progress │ │          │ │          │ │ (last 90)│            │
  │  │   12     │ │    8     │ │    3     │ │    47    │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  └─────────────────────────────────────────────────────────────────┘

  Filters:  [Status ▾]  [Type ▾]  [Category ▾]  [Assignee ▾]
            [Date range]  [Severity (parent NCE) ▾]   Clear all

  ┌─────────────────────────────────────────────────────────────────┐
  │ ☐  ID         Type      Category    Description           ...   │
  ├─────────────────────────────────────────────────────────────────┤
  │ ☐  CAPA-204   Corrective Training  Phlebotomy IV-arm…    ⏰ over │
  │      Parent NCE: NCE-20260105-0023 (Critical · Pre-Analytical)  │
  │      Assigned: M. Garcia · Due: 2026-01-15 · in_progress        │
  ├─────────────────────────────────────────────────────────────────┤
  │ ☐  CAPA-205   Preventive Equipment Centrifuge maintenance       │
  │      Parent NCE: NCE-20260108-0031 (Major · Analytical)         │
  │      Assigned: J. Smith · Due: 2026-02-28 · pending             │
  └─────────────────────────────────────────────────────────────────┘

  Showing 1–25 of 67 · Page size [25 ▾]   < Prev   1 2 3   Next >
```

### 3.1 Summary tiles

Five tiles at the top of the page summarize the current filter scope:

| Tile | Definition |
|---|---|
| In Progress | CAPAs with `status = in_progress`. |
| Pending | CAPAs with `status = pending`. |
| Overdue | CAPAs with `due_date < now()` AND `status != completed`. |
| Pending Effectiveness Review | CAPAs whose parent NCE is in `closed_pending_verification` status (effectiveness review due or overdue) — surfaced from the parent NCE state. Click to filter the list to those CAPAs. Mirrors the NCE Dashboard's Pending Verification view but scoped to CAPA owners. |
| Completed (last 90 days) | CAPAs with `status = completed` AND `completion_date >= now() - 90d`. Window fixed at 90d for v1 (configurable in v2). |

Tile counts respect the current filter set. Clicking a tile applies the equivalent filter (e.g., clicking "Overdue" filters the list to overdue CAPAs).

### 3.2 List columns

| Column | Source | Notes |
|---|---|---|
| Checkbox | (selection) | For bulk actions |
| ID | `nce_capa.id` (formatted as `CAPA-{n}`) | Click → CAPA detail (inline expansion) |
| Type | `nce_capa.type` | Corrective / Preventive / Both |
| Category | `nce_capa.category` | Training / Process Change / Equipment / Documentation / Other |
| Description | `nce_capa.description` (truncated) | Hover for full text |
| Parent NCE | `nce_event` joined via `nce_capa.nce_event_id` | Link to NCE detail; shows NCE number, severity, category |
| Assignee | `nce_capa.assigned_to` (joined to user) | User name |
| Due date | `nce_capa.due_date` | Overdue indicator if past |
| Status | `nce_capa.status` | pending / in_progress / completed |

### 3.3 Row expansion

Clicking a row expands it inline (per OpenELIS sidenav-submenus convention; no modals). The expanded panel shows:

- Full description text.
- Resolution notes (if `status = completed`).
- Completion date + completing user (if `status = completed`).
- Effectiveness review status (Pending / Due / Effective / Not Effective) with link to the review on the parent NCE if applicable.
- Action buttons: Reassign (if `nce.assign` permission), Open Parent NCE (always), Mark Complete (if `nce.capa.manage` permission AND status != completed; opens an inline completion form).

The expanded panel is **read-mostly**. Authoring of new CAPAs and full effectiveness review entry remain on the NCE detail page — this register does not duplicate those forms.

## 4. Filters

| Filter | Type | Options |
|---|---|---|
| Status | Multi-select dropdown | Pending, In Progress, Completed |
| Type | Multi-select dropdown | Corrective, Preventive, Both |
| Category | Multi-select dropdown | Training, Process Change, Equipment, Documentation, Other |
| Assignee | Multi-select user picker | All lab users (those who have ever been assigned a CAPA) |
| Date range | Date picker | Filters by `due_date` |
| Parent NCE severity | Multi-select dropdown | Critical, Major, Minor |
| Search | Text input | Searches CAPA description + parent NCE number |
| Effectiveness review state | Multi-select dropdown | Pending / Due / Effective / Not Effective / N/A — joined via parent NCE's `nce_effectiveness_review` |
| Clear all | Link button | Resets all filters |

Filters persist within session; URL query params reflect active filters for shareability.

## 5. Bulk actions

When one or more rows are selected, a batch action bar appears (teal background per the NCE Dashboard pattern):

| Action | Permission required | Behavior |
|---|---|---|
| Reassign | `nce.assign` | Opens a user picker; reassigns selected CAPAs to one user. Audit log entry per CAPA. |
| Mark Complete | `nce.capa.manage` | Opens a single completion form (resolution notes, completion date) applied to all selected CAPAs. Use case: a single training was delivered that satisfies multiple Training-category CAPAs. |

Bulk actions are skipped (with toast notification) for any selected CAPA already in `completed` status.

## 6. Data sources

| Source | Field(s) | Purpose |
|---|---|---|
| `nce_capa` | `id`, `nce_event_id`, `type`, `category`, `description`, `assigned_to`, `due_date`, `status`, `completion_date`, `resolution_notes` | Primary table |
| `nce_event` (joined via `nce_capa.nce_event_id`) | `id`, `nce_number`, `severity`, `category`, `subcategory`, `status` | Parent NCE context column + filter |
| `nce_effectiveness_review` (joined via `nce_event.id`) | `effective`, `review_date` | Drill-through to effectiveness review status in the row expansion |
| `users` (joined via `nce_capa.assigned_to`) | `name`, `email` | Assignee display |

**No new tables.** The view is pure SQL over the existing NCE data model.

### 6.1 Endpoint

The page reads from a new endpoint: `GET /rest/nce/capa?status=...&type=...&...` — a query over the existing `nce_capa` joined to `nce_event`. Implementation reuses the NCE module's existing service layer (NCEventService and related). Controller-level addition.

Wrapper effort: ~3–4h (controller + DTO).

## 7. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.qms` | Required to see this page. Without it, the QMS pillar is hidden in the sidenav. |
| `nce.view.all` | Required to see CAPAs on NCEs the user did not author or get assigned. Without it, the register filters to only the user's own assignments and reported NCEs' CAPAs. |
| `nce.assign` | Required to use Reassign (single or bulk). |
| `nce.capa.manage` | Required to use Mark Complete (single or bulk). |

Per the qa-menu roadmap, QA Officer default role bundles all of these. Lab Director recipe also includes them.

## 8. Acceptance criteria (outline)

- [ ] Page renders at `/qa/qms/capa-register` with summary tiles and the CAPA list.
- [ ] Summary tile counts respect the current filter set.
- [ ] Clicking a summary tile applies the equivalent filter.
- [ ] List columns render per §3.2; row expansion shows description, resolution notes, completion info, effectiveness review link, action buttons.
- [ ] Overdue indicator appears on rows where `due_date < now()` AND `status != completed`.
- [ ] Status / Type / Category / Assignee / Date range / Parent NCE severity filters work independently and in combination.
- [ ] Search matches against description text and parent NCE number.
- [ ] Bulk Reassign and Bulk Mark Complete work; status-completed CAPAs are skipped with a toast.
- [ ] Drill-through to parent NCE opens NCE detail at `/qa/qms/nce/{id}`.
- [ ] User without `qa.view.qms` does not see the QMS pillar in the sidenav and cannot reach this page.
- [ ] User without `nce.view.all` sees only their own scope.
- [ ] All visible strings localized; no hard-coded English.

## 9. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.capa.register.title` |
| Summary tile: In Progress | `label.capa.summary.inProgress` |
| Summary tile: Pending | `label.capa.summary.pending` |
| Summary tile: Overdue | `label.capa.summary.overdue` |
| Summary tile: Completed | `label.capa.summary.completed` |
| Filter labels | `label.capa.filter.*` (status / type / category / assignee / dateRange / severity / search) |
| Column headers | `label.capa.column.*` |
| Row action: Reassign | `label.capa.action.reassign` |
| Row action: Mark Complete | `label.capa.action.markComplete` |
| Row action: Open Parent NCE | `label.capa.action.openParent` |
| Bulk action bar | `label.capa.batch.*` |

Full list in the Sprint 3 FRS.

## 10. Resolved decisions (2026-04-23)

| ID | Question | Decision |
|---|---|---|
| A1 | "Completed (last 90d)" tile window | **Fixed at 90 days in v1; configurable in v2.** Aligns with quarterly QA review cadence. |
| A2 | Effectiveness-review surfacing | **Add a Pending Effectiveness Review tile + filter to CAPA Register** in addition to the NCE Dashboard's Pending Verification view. Surfaces the work both places — QA Officers who live in the CAPA Register get a top-level signal without context-switching. |
| A3 | Bulk Mark-Complete UX | **Single shared resolution note** with a warning banner ("This note applies to all {N} selected CAPAs"). Per-CAPA notes in v2 if labs ask. |
| A4 | Orphaned-by-recurrence CAPAs | Original CAPAs stay linked to the original NCE; the new recurrence-linked NCE gets its own. **"Linked-recurrence" badge** on the original parent NCE column. |

### Still open

(none — all four resolved.)

---

*Outline only — full FRS authored in Sprint 3.*
