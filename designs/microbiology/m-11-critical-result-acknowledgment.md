# M-11 Critical-Result Acknowledgment — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Cross-cutting OpenELIS foundation (Micro is forcing function)
**Phase:** 1A — co-ships with Micro Phase 1A
**Owner:** Microbiology Module (M-00 parent), but a general OE feature
**Status:** Draft

This spec rebuilds the critical-result notification mechanism as a polymorphic table that can attach to any clinical entity (Result, Case, Isolate, Sample). The existing `critical_result_notification` table is keyed only on `result_id`, which doesn't fit Micro's Sample-level (Gram-stain) or Case-level (per-isolate phenotype) criticals. Per crosswalk Q4, Casey confirmed: the existing table isn't really used today, so we rebuild without migration burden, and Micro is the trigger to finally do this rework that several other roadmap items have been blocked on.

> This FRS is self-contained. There is no separate addendum — every decision from the design review (header + isolate-tile entry points setting `target_type`; the Open → Acknowledged → Closed state machine with `close_reason`; clinician free-text fallback; follow-up notification) is written inline below. The feature uses the **polymorphic `critical_notification`** table (target CASE/ISOLATE/RESULT/SAMPLE) and is invoked from M-04.

---

## 1. Overview

### 1.1 Purpose

Three orthogonal needs converge in this spec:

1. **Capturing critical communications** — the lab tech or supervisor calls a clinician about a critical finding. The system records who called whom, when, what was said, and tracks acknowledgment.
2. **Surfacing unacknowledged criticals to the lab** — the existing aspirational Alerts Dashboard becomes a working surface where unacknowledged criticals appear until resolved.
3. **Supporting any clinical entity as the target** — not just AST results (chemistry-shape). Micro criticals are often pre-result (a Gram stain call is a critical communication before any antibiotics have been tested).

The existing `critical_result_notification` table is keyed solely on `result_id`. M-11 replaces it with a polymorphic `critical_notification` table that supports `RESULT`, `CASE`, `ISOLATE`, or `SAMPLE` as target types. The Micro Case Workbench (M-04) is the primary invoker.

### 1.2 Routes

| Surface | Route |
|---------|-------|
| Critical Notifications Dashboard (was the aspirational Alerts Dashboard) | `/alerts/criticals` |
| Log Critical Notification modal | (invoked from Case Detail header / Isolate tile, Result detail, Sample detail) |

### 1.3 Users

| Role | Actions |
|------|---------|
| Microbiology Tech | Log a critical notification |
| Microbiology Supervisor | Log + acknowledge + manage queue |
| Clinical Tech (chemistry/heme) | Log a critical for their domain |
| Lab Manager | Configure which findings auto-suggest critical notification (Phase 1B) |
| System Administrator | All actions |

### 1.4 Integration

- **M-04 Case Workbench Core** — primary invoker. Adds "Log critical notification" entry points on the **Case Detail header** (`target_type = CASE`) and on **each isolate tile** (`target_type = ISOLATE`); consumer of the M-11 model (mirrors M-04 §11 / A7).
- **M-05 AST Entry & Interpretation** — Phase 1B: certain AST results (CRE, MRSA from sterile site, VRE) suggest critical notification via Expert Rules.
- **Existing Results module** — chemistry and hematology critical thresholds (panic values) can log via M-11 instead of the old `critical_result_notification` table.
- **Alerts Dashboard** — existing aspirational surface that finally gets wired with this rework.

---

## 2. Data model

### 2.1 The polymorphic notification table

```
critical_notification
├── notification_id (UUID PK)
├── target_type (enum: RESULT, CASE, ISOLATE, SAMPLE)
├── target_id (UUID — FK semantics enforced by application; refers to corresponding entity)
├── trigger_type (enum: MANUAL_LOG, EXPERT_RULE, PANIC_VALUE, ANALYZER_FLAG)
├── status (enum: OPEN, ACKNOWLEDGED, CLOSED — explicit state machine; see §2.4)
├── notified_at (timestamp, default now())
├── notified_by (FK to user)
├── clinician_id (FK to OE provider, nullable — set when chosen from the provider directory)
├── clinician_name (text — directory name or free-text fallback)
├── clinician_name_unmatched (bool, default false — true when name was free-typed without a directory match; see §3.3)
├── clinician_role (text, nullable, e.g., "ER attending", "Hospital pharmacist")
├── clinician_phone (text, nullable)
├── clinician_email (text, nullable)
├── notification_method (enum: PHONE, EMAIL, IN_PERSON, FAX, PAGER, OTHER)
├── message (text, macro-enabled, `reporting` category)
├── recipient_acknowledged (bool, default false)
├── acknowledged_at (timestamp, nullable)
├── acknowledged_by (text, nullable — name; not FK because the clinician may not be an OE user)
├── acknowledged_via (enum: VERBAL, READBACK, EMAIL, IN_PERSON, OTHER, nullable)
├── closed_at (timestamp, nullable)
├── closed_by (FK to user, nullable)
├── close_reason (enum: ACKNOWLEDGED, RECONCILED, DUPLICATE, ERROR, nullable)
├── linked_notification_id (FK to self, nullable — for follow-up calls; see §5.6)
└── audit columns
```

Foreign-key semantics (the polymorphism — target CASE/ISOLATE/RESULT/SAMPLE):

- `target_type = RESULT` → `target_id` refers to `result.result_id`
- `target_type = CASE` → `target_id` refers to `micro_case.case_id`
- `target_type = ISOLATE` → `target_id` refers to `micro_isolate.isolate_id`
- `target_type = SAMPLE` → `target_id` refers to `sample.sample_id`

These are not enforced as DB foreign keys (the polymorphism prevents single FK constraint) but are enforced at the application layer with validation and integrity checks.

`status`, `clinician_id`, and `clinician_name_unmatched` are the only additions versus v1.0: `status` makes the Open → Acknowledged → Closed lifecycle a first-class column (§2.4) rather than something derived ad hoc from the acknowledge/close timestamps; `clinician_id` / `clinician_name_unmatched` support the directory-vs-free-text fallback (§3.3).

### 2.4 State machine — Open → Acknowledged → Closed

A notification has three **distinct** states, tracked in `status`:

| State | Definition | Entered when |
|-------|-----------|--------------|
| **OPEN** | Logged, recipient not yet confirmed to have acknowledged | On save when "Recipient acknowledged at time of call" was not checked |
| **ACKNOWLEDGED** | Recipient has acknowledged receipt of the critical | The acknowledge action records who/via/when, **or** the "acknowledged at time of call" shortcut is used on the log modal |
| **CLOSED** | The loop is finished and the entry is filed out of the active queue | An explicit Close action with a `close_reason` |

Transition rules:

- **OPEN → ACKNOWLEDGED.** Recording acknowledgment (via the Acknowledge modal §4, or the log-time "acknowledged with readback" shortcut §3.4) sets `recipient_acknowledged = true`, `acknowledged_at/by/via`, and `status = ACKNOWLEDGED`.
- **ACKNOWLEDGED does not auto-close.** Acknowledged criticals remain visible (acknowledged-but-open) so a supervisor can confirm the loop before filing; closing is an **explicit** action. The one exception: when acknowledgment is captured via the Acknowledge modal and the operator chooses "Acknowledge and close," the system performs the acknowledge then immediately closes with `close_reason = ACKNOWLEDGED`.
- **→ CLOSED.** Closing requires a `close_reason`:
  - `ACKNOWLEDGED` — normal completion after the recipient acknowledged.
  - `RECONCILED` — resolved another way (e.g., result corrected/withdrawn, duplicate of a call already closed).
  - `DUPLICATE` — logged twice; this one filed against the real entry.
  - `ERROR` — logged in error.
  - An OPEN (never-acknowledged) critical may be closed directly with `RECONCILED`, `DUPLICATE`, or `ERROR` (not `ACKNOWLEDGED`, since no acknowledgment occurred).
- Closing requires `critical.notify.acknowledge`. State changes are audited.

### 2.2 Deprecation of the existing table

The existing `critical_result_notification` table is deprecated:

- Schema kept for the data migration window (Phase 1A).
- No new writes to the old table from any code path.
- Read paths that previously queried the old table are migrated to the polymorphic table with a `target_type = RESULT` filter.
- Phase 2 or later: drop the old table after a release cycle of stability.

Per Casey: existing table is aspirational with no real production data, so migration burden is minimal.

### 2.3 Configuration table (Phase 1B)

In Phase 1B, lab managers can configure which findings auto-suggest critical notification:

```
critical_threshold_config (Phase 1B)
├── config_id (PK)
├── domain (enum: CHEMISTRY, HEMATOLOGY, MICRO, OTHER)
├── condition_type (enum: NUMERIC_THRESHOLD, ORGANISM_PHENOTYPE, PANIC_FLAG)
├── condition_payload (JSON: e.g., `{ "antibiotic": "MEM", "interpretation": "R", "specimen_type": "blood" }`)
├── auto_suggest (bool — should the system prompt the user)
├── auto_log (bool — should the system log without user action, Phase 2+)
├── default_message_template (text)
└── audit columns
```

Phase 1A ships without this table; all criticals are manually triggered by user action.

---

## 3. Log Critical Notification modal

### 3.1 Trigger and entry points

Entry points each produce a notification with the appropriate `target_type` — the entry point itself sets `target_type` (mirrors M-04 A7):

| Context | Entry point | target_type |
|---------|-------------|-------------|
| Case Detail header (M-04) | "Log critical notification" button in the **case header** | CASE |
| Case Detail isolate tile (M-04) | "Log critical notification" action on a specific **isolate tile** | ISOLATE |
| Result Detail (existing OE) | "Log critical notification" button | RESULT |
| Sample Detail (existing OE) | "Log critical notification" button | SAMPLE |
| AST Edit modal (M-05) | "Log critical notification" link beside an antibiotic row | RESULT (the AST result row) |

The two Micro entry points are the **case header** (sets `target_type = CASE`) and **each isolate tile** (sets `target_type = ISOLATE`); the modal reads the invoking context to populate `target_type`/`target_id` and the read-only target header. On save the case-header unacknowledged badge appears optimistically per M-04 §11.

### 3.2 Layout

`ComposedModal` size `md`.

```
┌─ Log Critical Notification ─────────────────────────────────────────────────┐
│                                                                              │
│  Target: Case MC-2024-001234 — MARTINEZ, Carlos                              │
│  Reason: Critical finding requires immediate provider notification           │
│                                                                              │
│  Clinician notified: *                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ [Search providers...]                                                  ▼ │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  Or enter name manually: ┌────────────────────────────┐ Role: ┌───────────┐ │
│                          │                            │       │ ER attg.  │ │
│                          └────────────────────────────┘       └───────────┘ │
│  ⚠ "Dr. Patell" not found in the provider directory — saved as typed.       │
│                                                                              │
│  Method: *                                                                   │
│  (•) Phone   ( ) Email   ( ) In-person   ( ) Pager   ( ) Fax   ( ) Other    │
│                                                                              │
│  Time of notification: *  ┌──────────────────┐  Auto: now                   │
│                           │ 2026-05-12 07:38 │                              │
│                           └──────────────────┘                              │
│                                                                              │
│  Message / substance of communication: *                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ .gnr from blood culture set drawn at 7:00 AM. Final ID and AST in     │ │
│  │ progress. Patient should be on broad-spectrum coverage.                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  Macros: `reporting` (type . for shortcuts)                                 │
│                                                                              │
│  Notified by: Olivia Mendez (current user)                                  │
│                                                                              │
│  ☐ Recipient acknowledged at time of call (with readback)                   │
│  └─ If checked: Acknowledged via:  (•) Readback  ( ) Verbal  ( ) Other      │
│                                                                              │
│  [Cancel]                                                            [Save] │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Clinician lookup — free-text fallback

The clinician field is a `ComboBox` over the existing OE provider directory, but a critical call often goes to someone not in that directory (covering attending, on-call pharmacist). The fallback is non-blocking and typo-aware:

- **Directory match (preferred):** choosing a provider sets `clinician_id`, fills `clinician_name`/role/phone/email from the record, and leaves `clinician_name_unmatched = false`.
- **Free-text fallback (allowed):** the operator can type a name the directory doesn't contain. On save with no match, the system **warns but does not block** — an inline notice ("'{name}' not found in the provider directory — saved as typed") lets the operator catch a typo, but they may proceed. The row saves with `clinician_id = NULL`, `clinician_name = <typed>`, `clinician_name_unmatched = true`.
- **Why warn-not-block:** a critical communication must never be blocked by directory completeness; the warning catches typos without preventing the legitimate off-directory call. Unmatched names are queryable (`clinician_name_unmatched = true`) so admins can later reconcile or extend the directory.

### 3.4 Fields

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Target | Read-only header | — | Auto-populated from entry context; sets target_type/target_id (§3.1) |
| Clinician notified | `ComboBox` over OE provider directory; allows free-text entry | Yes | Free-text path per §3.3 (warn-on-no-match, allow save) |
| Clinician name (free text) | `TextInput` | If ComboBox not used | Sets `clinician_name_unmatched = true` when no match |
| Clinician role | `TextInput` | No | E.g., "ER attending" |
| Method | `RadioButtonGroup` | Yes | PHONE / EMAIL / IN_PERSON / PAGER / FAX / OTHER |
| Time of notification | `DateTimePicker`, default now | Yes | Tech can backdate if logging after the fact (audit captures both event time and log time) |
| Message | `MacroTextarea`, `reporting` category | Yes | Substance of the call |
| Recipient acknowledged | `Checkbox` | No | If checked, captures acknowledgment metadata and sets `status = ACKNOWLEDGED`; otherwise the notification stays OPEN in the queue |
| Acknowledged via | `RadioButtonGroup` (only if acknowledged) | Yes when acknowledged | READBACK / VERBAL / OTHER |

### 3.5 On save

1. Write `critical_notification` row with all captured data, `target_type`/`target_id` from the entry point (§3.1), and clinician fields per §3.3.
2. If `recipient_acknowledged = true`, set `acknowledged_at` to notification time, `acknowledged_via`, and `status = ACKNOWLEDGED`; otherwise `status = OPEN`.
3. Write Timeline event (if target_type is CASE or ISOLATE) of type CRITICAL_NOTIFY.
4. Update relevant entity's "has unacknowledged critical" flag (computed; not a stored column) — the case-header badge appears optimistically (M-04 §11).
5. Push to Alerts Dashboard queue.
6. Close modal; return to source context.

---

## 4. Acknowledge Critical Notification

### 4.1 Trigger

From the Alerts Dashboard queue, or from the Case Detail / Isolate detail surface showing an unacknowledged critical badge.

### 4.2 Modal

```
┌─ Acknowledge Critical Notification ──────────────────────────────────────────┐
│                                                                              │
│  Critical notified 2026-05-12 07:38 by Olivia Mendez to Dr. Patel (ER)      │
│  Target: Case MC-2024-001234 — MARTINEZ, Carlos                              │
│  Message: .gnr from blood culture set drawn at 7:00 AM. Final ID and AST   │
│           in progress. Patient should be on broad-spectrum coverage.        │
│                                                                              │
│  Acknowledgment details:                                                     │
│                                                                              │
│  Acknowledged by: *                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Dr. Patel                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Via: *                                                                      │
│  (•) Verbal   ( ) Readback   ( ) Email   ( ) In-person   ( ) Other          │
│                                                                              │
│  Acknowledged at: *  ┌──────────────────┐                                   │
│                     │ 2026-05-12 07:55 │                                    │
│                     └──────────────────┘                                    │
│                                                                              │
│  Acknowledged by current user: Olivia Mendez                                │
│                                                                              │
│  Notes (optional):                                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Dr. Patel confirmed verbal communication; will order meropenem.        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ☐ Close this notification (reason: Acknowledged)                            │
│                                                                              │
│  [Cancel]                                            [Mark Acknowledged]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Fields

| Field | Required |
|-------|----------|
| Acknowledged by (name) | Yes |
| Via | Yes |
| Acknowledged at | Yes |
| Notes | No |
| Close this notification | No — when checked, also closes with `close_reason = ACKNOWLEDGED` (§2.4) |

### 4.4 Permissions

- `critical.notify.acknowledge` required.
- Anyone with the permission can acknowledge any open critical (not just the original notifier — labs often have one supervisor closing the loop on multiple criticals).

---

## 5. Alerts Dashboard — Criticals

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Home / Alerts / Critical Notifications                                       │
│ Critical Notifications                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │
│  │ Open         │ │ Acknowledged │ │ Closed       │                        │
│  │ (Today)      │ │ (Today)      │ │ (Today)      │                        │
│  │      3       │ │      8       │ │      6       │                        │
│  └──────────────┘ └──────────────┘ └──────────────┘                        │
│                                                                              │
│  [Search...]   Status: [Open ▼]   Domain: [All ▼]   Period: [Today ▼]       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Time     │ Target          │ Patient   │ Notified to  │ Status    │ Action │
├──────────┼─────────────────┼───────────┼──────────────┼───────────┼────────┤
│ 07:38    │ Case MC-...1234 │ MARTINEZ  │ Dr. Patel    │ ⚠ Open    │ Ack    │
│          │ Blood culture   │ Carlos    │ (ER attg.)   │           │        │
│ 09:15    │ Case MC-...1235 │ JOHNSON   │ Dr. Wilson   │ ⚠ Open    │ Ack    │
│          │ CSF culture     │ Mary      │ (Hosp medic.)│           │        │
│ 10:42    │ Result R-21456  │ CHEN      │ Dr. Lee      │ ⚠ Open    │ Ack    │
│          │ K+ panic value  │ Wei       │ (ICU)        │           │        │
│ 11:30    │ Case MC-...1230 │ SMITH     │ Dr. Patel    │ ✓ Acked   │ View   │
│          │ Urine culture   │ Jane      │              │ 11:50     │        │
└──────────┴─────────────────┴───────────┴──────────────┴───────────┴────────┘
```

### 5.2 Summary cards

Cards reflect the `status` column directly (§2.4):

- **Open** — `status = OPEN`
- **Acknowledged** — `status = ACKNOWLEDGED` (acknowledged but not yet closed)
- **Closed** — `status = CLOSED`

### 5.3 Filters

| Filter | Options |
|--------|---------|
| Status | All, Open, Acknowledged, Closed |
| Domain | All, Microbiology, Chemistry, Hematology, Other |
| Period | Today, This Week, This Month, Custom |
| Notified by | Dropdown of OE users |
| Target type | All, Case, Result, Isolate, Sample |

### 5.4 Row actions

- **Ack** — open Acknowledgment modal (if Open) → OPEN → ACKNOWLEDGED
- **View** — read-only detail view (if Acknowledged or Closed)
- **Close** — explicitly mark as closed with a `close_reason` (§2.4); requires `critical.notify.acknowledge`
- **Add follow-up** — log a follow-up notification linked to this one (§5.6)

### 5.5 Close modal

Closing (from the row action or via "Acknowledge and close") opens a small confirm with a required `close_reason` selector (ACKNOWLEDGED / RECONCILED / DUPLICATE / ERROR). The reason offered is constrained per §2.4 (a never-acknowledged critical cannot be closed as ACKNOWLEDGED). On confirm, `closed_at/by`, `close_reason`, and `status = CLOSED` are written and audited.

### 5.6 Follow-up notification

A follow-up is a **new `critical_notification` row linked to the original** via `linked_notification_id`, used when the lab calls the clinician again about the same finding (e.g., the first call went unacknowledged, or new information — final ID, AST result — must be communicated). "Add follow-up":

- Opens the Log Critical Notification modal **pre-filled** from the source: same `target_type`/`target_id`, same clinician (pre-selected, editable), and a short message stub referencing the prior call ("Follow-up to critical notified 2026-05-12 07:38 …").
- On save, the new row's `linked_notification_id` points at the original; both appear in the queue, and the original's detail view lists its follow-ups as a linked chain so the full communication thread is visible.
- A follow-up has its own Open → Acknowledged → Closed lifecycle independent of the original (acknowledging the follow-up does not auto-acknowledge the original, and vice versa).

### 5.7 Permissions

| Action | Permission |
|--------|-----------|
| View Critical Notifications Dashboard | `critical.notify.view` |
| Acknowledge | `critical.notify.acknowledge` |
| Close | `critical.notify.acknowledge` |
| Add follow-up | `critical.notify.log` (same as logging a new critical) |

---

## 6. Migration from existing `critical_result_notification`

### 6.1 Migration plan

Phase 1A migration steps:

1. New `critical_notification` table is created with the polymorphic schema (including `status`).
2. Any existing rows in `critical_result_notification` are migrated:
   - `target_type` set to `RESULT`
   - `target_id` set to the existing `result_id`
   - `status` derived from existing acknowledge/close fields (acknowledged-and-closed → CLOSED, acknowledged → ACKNOWLEDGED, else OPEN)
   - All other fields mapped to the new schema
3. Old table is renamed to `critical_result_notification_deprecated` (preserved for one release cycle, read-only).
4. All write paths in chemistry, hematology, and existing modules redirected to the new polymorphic API.
5. All read paths updated.

Per Casey's confirmation that the existing table has no real data, this migration is effectively a no-op for data, but the schema migration applies.

### 6.2 API compatibility

A thin compatibility shim provides the old `critical_result_notification` API contract for any external consumers (rare; mostly internal):

- Old `POST /api/critical-result-notification` accepts requests, translates to new API path, returns identical response shape.
- Deprecation warning header included.
- Removed in Phase 2.

---

## 7. Acceptance criteria

- **AC-M11-01**: New polymorphic `critical_notification` table created with the schema in §2.1 (target CASE/ISOLATE/RESULT/SAMPLE).
- **AC-M11-02**: Log Critical Notification modal renders correctly from all entry points (Case header, Isolate tile, Result, Sample, AST row).
- **AC-M11-03**: target_type and target_id correctly identify the entity per entry context.
- **AC-M11-04**: All required fields validated on save.
- **AC-M11-05**: Macro support works in the message field (`reporting` category).
- **AC-M11-06**: Acknowledgment captures clinician name, method, time, by.
- **AC-M11-07**: Recipient-acknowledged-at-time-of-call shortcut sets `acknowledged_at` and `status = ACKNOWLEDGED` in one step.
- **AC-M11-08**: Alerts Dashboard renders open / acknowledged / closed correctly from the `status` column.
- **AC-M11-09**: Filters reduce list appropriately.
- **AC-M11-10**: Acknowledge action opens modal and updates state (OPEN → ACKNOWLEDGED).
- **AC-M11-11**: Migration of existing `critical_result_notification` rows preserves data integrity (including derived `status`).
- **AC-M11-12**: Compatibility shim accepts old API requests and routes to new endpoint.
- **AC-M11-13**: All actions respect permissions.
- **AC-M11-14**: Critical notifications surface in M-04 Case Detail when target is the Case (or one of its Isolates or AST results).
- **AC-M11-15**: NFR-02 (scale, < 2s render with 500 notifications), NFR-04 (a11y).
- **AC-M11-16** *(folds G1)*: M-04 exposes a "Log critical notification" entry point in the **case header** (sets `target_type = CASE`) and on **each isolate tile** (sets `target_type = ISOLATE`); the entry point sets `target_type` and the case-header unacknowledged badge appears optimistically.
- **AC-M11-17** *(folds G2)*: OPEN, ACKNOWLEDGED, and CLOSED are distinct states tracked in `status`; ACKNOWLEDGED does not auto-close (except the explicit "Acknowledge and close" shortcut); closing requires a `close_reason` and a never-acknowledged critical cannot be closed as ACKNOWLEDGED.
- **AC-M11-18** *(folds G3)*: Clinician lookup allows a free-text fallback that warns on no directory match but does not block save; the row records `clinician_id = NULL` and `clinician_name_unmatched = true`.
- **AC-M11-19** *(folds G4)*: "Add follow-up" creates a new `critical_notification` linked via `linked_notification_id`, pre-filled from the source (target, clinician, reference stub), with its own lifecycle; the original's detail view shows the linked follow-up chain.

---

## 8. i18n keys

Estimated 55-70 keys. Pattern:

```
alerts.criticals.title                       "Critical Notifications"
alerts.criticals.summaryCard.open            "Open (Today)"
alerts.criticals.summaryCard.acknowledged    "Acknowledged (Today)"
alerts.criticals.summaryCard.closed          "Closed (Today)"
alerts.criticals.column.time                 "Time"
alerts.criticals.column.target               "Target"
alerts.criticals.column.patient              "Patient"
alerts.criticals.column.notifiedTo           "Notified to"
alerts.criticals.column.status               "Status"
alerts.criticals.column.action               "Action"
alerts.criticals.action.acknowledge          "Ack"
alerts.criticals.action.view                 "View"
alerts.criticals.action.close                "Close"
alerts.criticals.action.addFollowUp          "Add follow-up"
alerts.criticals.status.open                 "Open"
alerts.criticals.status.acknowledged         "Acknowledged"
alerts.criticals.status.closed               "Closed"
alerts.criticals.modal.log.title             "Log Critical Notification"
alerts.criticals.modal.log.target            "Target"
alerts.criticals.modal.log.reason            "Critical finding requires immediate provider notification"
alerts.criticals.modal.log.clinician         "Clinician notified"
alerts.criticals.modal.log.clinician.helper  "Search providers or enter name manually"
alerts.criticals.modal.log.clinician.unmatched "\"{{name}}\" not found in the provider directory — saved as typed."
alerts.criticals.modal.log.clinicianRole     "Role"
alerts.criticals.modal.log.method            "Method"
alerts.criticals.modal.log.method.phone      "Phone"
alerts.criticals.modal.log.method.email      "Email"
alerts.criticals.modal.log.method.inPerson   "In-person"
alerts.criticals.modal.log.method.pager      "Pager"
alerts.criticals.modal.log.method.fax        "Fax"
alerts.criticals.modal.log.method.other      "Other"
alerts.criticals.modal.log.time              "Time of notification"
alerts.criticals.modal.log.message           "Message / substance of communication"
alerts.criticals.modal.log.message.helper    "Macros: `reporting` (type . for shortcuts)"
alerts.criticals.modal.log.notifiedBy        "Notified by"
alerts.criticals.modal.log.acknowledgedAtCall "Recipient acknowledged at time of call (with readback)"
alerts.criticals.modal.log.ackViaReadback    "Readback"
alerts.criticals.modal.log.ackViaVerbal      "Verbal"
alerts.criticals.modal.log.ackViaOther       "Other"
alerts.criticals.modal.ack.title             "Acknowledge Critical Notification"
alerts.criticals.modal.ack.acknowledgedBy    "Acknowledged by"
alerts.criticals.modal.ack.via               "Via"
alerts.criticals.modal.ack.at                "Acknowledged at"
alerts.criticals.modal.ack.notes             "Notes (optional)"
alerts.criticals.modal.ack.closeToo          "Close this notification (reason: Acknowledged)"
alerts.criticals.modal.ack.markAcknowledged  "Mark Acknowledged"
alerts.criticals.modal.close.title           "Close Critical Notification"
alerts.criticals.modal.close.reason          "Close reason"
alerts.criticals.modal.close.reason.acknowledged "Acknowledged"
alerts.criticals.modal.close.reason.reconciled "Reconciled"
alerts.criticals.modal.close.reason.duplicate "Duplicate"
alerts.criticals.modal.close.reason.error    "Error"
alerts.criticals.followUp.title              "Follow-up Critical Notification"
alerts.criticals.followUp.stub               "Follow-up to critical notified {{datetime}}"
alerts.criticals.followUp.linkedChain        "Follow-ups"
```

---

## 9. Open verification items

- Confirm existing OE provider table for Clinician ComboBox (and the field used for `clinician_id`).
- Confirm existing OE audit infrastructure (M-NFR-03 verification).
- Confirm existing patterns for compatibility shim during API deprecation.

---

## 10. References

- M-00 Microbiology Module Parent Specification
- M-NFR Non-Functional Requirements
- M-04 Case Workbench Core (primary invoker; header + isolate-tile entry points; §11 / A7 placement and optimistic badge)
- M-05 AST Entry & Interpretation (Phase 1B Expert Rules drive auto-suggestion)
- `amr-crosswalk-working.md` Q4 (polymorphic notification rework)
- `project_critical_result_ack_global_todo` memory (the queued global TODO this M-11 closes)
- Existing aspirational `critical_result_notification` table (deprecated by M-11)
