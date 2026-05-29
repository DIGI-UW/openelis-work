# Reference Lab Results — Functional Requirements Specification

**Version:** 1.0 (Draft)
**Date:** 2026-05-28
**Module:** Sample Shipment → Reference Lab Results
**Route:** `/SampleShipment/reference-lab-results`
**SideNav:** Sample Shipment → Reference Lab Results
**Breadcrumb:** Home / Sample Shipment / Reference Lab Results
**Owner:** Casey + OpenELIS team
**Status:** Draft for review
**Umbrella Jira:** OGC-796 (to be promoted to Epic)
**Folds in:** OGC-605, OGC-589, parts of OGC-624

---

## 1. Lab Context

### 1.1 Current State

A clinical laboratory often can't perform every test it's asked to run. Some tests need specialized equipment (HIV viral load, genetic sequencing, certain microbiology cultures, antimicrobial susceptibility on rare organisms). Some need reagents that ran out. Some need confirmatory analysis at a higher-tier reference lab. In all these cases the lab **refers out** — physically packages and sends the sample to a partner reference lab, then waits for the result to come back.

In OpenELIS today, when a technician decides to refer a test out, they check a "Refer Out" box on the Result Entry (Logbook) page. The system records the referral but does almost nothing with it afterward. There is a search page at `/ReferredOutTests` titled "Referrals" — it is a three-pane search shell over an empty table. No live tracking, no view of what's outstanding, no clear path to reconcile results when they come back. Labs work around this gap with email, paper logs, and spreadsheets.

A sibling feature called **Sample Shipment** (recently shipped to the testing instance at `/SampleShipment/*`) handles the physical side: packing samples into boxes, printing labels and manifests, scanning boxes at the receiving lab, capturing non-conformities, exchanging FHIR (Fast Healthcare Interoperability Resources) `SupplyDelivery` messages between sender and receiver. That feature ends when a box is physically received and all samples have been accepted into the receiving lab's workflow (the "Reconciled" state). What happens to the test results in between — who is tracking what is still outstanding at the reference lab, what has come back, what needs a validator's eye — has no surface today.

### 1.2 Pain

- A reference lab returns a result via FHIR `DiagnosticReport`. The receiving OpenELIS instance accepts the resource but no one notices. The lab manager finds out two weeks later when the requesting clinician calls asking for the result.
- The `ReferralStatus` enum on the `Referral` entity has 5 values (`CREATED, SENT, RECEIVED, FINISHED, CANCELED`) but the code only ever writes 3 (`CREATED, RECEIVED, CANCELED`). `SENT` and `FINISHED` are dead. A validator looking at a referral has no way to tell whether the sample is still en route, at the reference lab, in progress at the reference lab, or returned.
- The `Referral` entity has rich shipment-tracking fields (`assignedBox`, `lostStatus`, `lostDate`, `lostReason`, `priority`) populated nowhere in the UI. The schema knows what was wanted; the wiring never happened.
- A box reaches `Received` at the reference lab and the lab manager has no signal that result reconciliation needs to happen. The Box state stays at `Received` indefinitely until someone manually marks it `Reconciled`. The "stuck Box" problem is real and silent.
- OGC-624 (currently in progress) proposes a *second* status field (`subcontractStatus`) parallel to `ReferralStatus` with a different lifecycle (`DRAFT → DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED`). If both ship as proposed, the same row will carry two divergent state fields.
- When a peer reference lab rejects a referral (sends FHIR `Task.status = rejected`), today there is no code path that puts the original local Analysis back into a workable state. The Analysis is orphaned and the validator has to manually delete and re-create the order to re-refer.
- **Most reference labs are not on OpenELIS.** Results return by phone, fax, paper, or email — no FHIR `DiagnosticReport` flows back. Today there is no path to manually post such a result against the original referred Analysis from the Referral view. The validator has to navigate separately to Result Entry, search for the lab number, type the value, save — and the Referral row stays in `requested` forever because nothing tells the Referral state machine that the result is in.

### 1.3 What Changes

A new SideNav item called **Reference Lab Results** lives under Sample Shipment. Lab managers, validators, and clinicians open it any time of day and see, in one place: how many tests are outstanding at reference labs (with how many days have passed since dispatch), how many results have come back today and need acceptance, and the history of everything closed in the past N days.

When a result arrives via `DiagnosticReport`, the row appears in the "Returned — needs action" view. A validator clicks **Accept**, the result flows into the local Analysis, and the validator continues into Result Entry as they would for any other result. If the reference lab rejected the sample, a **Reject** action sends `Task.status = rejected` back and re-opens the local Analysis with the original Refer Out flag intact — the validator can re-refer to a different reference lab without re-keying patient or test information.

The `ReferralStatus` enum migrates to FHIR `Task.status`–aligned values via a one-time Liquibase migration. The `cancelled` and `rejected` paths get wired into `FhirReferralServiceImpl` (today they are commented out). The full FHIR Task lifecycle (`draft → requested → received → in-progress → completed`, plus `cancelled` and `rejected` as exits) is the canonical state machine for every referral. Display labels remain localizable so the UI can still read "Sent — awaiting acceptance" or "At reference lab" without inventing new enum values.

Stuck Boxes stop being silent. An aging banner appears on the Reference Lab Results page when referrals cross threshold (default >7 days outstanding, configurable). The lab manager has a single page that says "you have N tests still at reference labs, M of them are over threshold."

For reference labs that aren't on OpenELIS, every Outstanding row has a **"Manually enter result"** action that deep-links to the existing Result Entry screen with the order pre-loaded. The validator types in the value and the reference lab's reported date/time, saves, and the Referral state machine advances to `completed` automatically. No new entry form, no duplicate code — just a deep link into existing Result Entry plus a small server-side hook that detects "this Result save lands on an Analysis with an open Referral" and advances the Referral.

---

## 2. Overview

### 2.1 Purpose

Provide a single operational surface for tracking the **data lifecycle** of every referred sample after physical shipment — from "sent to reference lab" through "result returned and reconciled into local Analysis." Complements the existing Sample Shipment feature, which owns the physical lifecycle (boxes, manifests, receiving). The two surfaces are tightly coupled at the Box.Reconciled transition: a Box cannot be marked Reconciled until every contained Referral has reached `completed` (result accepted) or `rejected`/`cancelled` (terminal exit).

### 2.2 Scope

In scope for this FRS:
- New SideNav item under Sample Shipment, single-page surface with internal filter switching
- Three filter views: Outstanding · Returned — needs action · History
- Per-row inline-expand detail panel
- Accept / Reject / Open in Result Entry actions on the Returned view
- State-model migration from current `ReferralStatus` enum to FHIR Task statuses
- Outbound write path: emit the full FHIR Task lifecycle in `FhirReferralServiceImpl`
- Inbound read path: handle peer `Task.status = received | in-progress | rejected` updates
- Result reconciliation: when `DiagnosticReport` arrives, route to original `Analysis` and surface
- Order Entry Step 3 refer-out hook (OGC-605)
- Box ↔ Referral cross-links (read-only)
- Stuck-referral aging banner
- Audit_trail entries for state transitions and validator actions
- Liquibase migration with reversibility

### 2.3 Non-goals

Explicitly NOT in scope:
- Anything inside the Sample Shipment feature (box creation, sample assignment, manifest, label, receiving workflow, non-conformity capture, facility registry, label preset admin, FHIR SupplyDelivery exchange) — already shipped
- The Unassigned Samples tab at `/SampleShipment/unassigned` — already shipped
- Source detection on Incoming Orders (deferred per `/clarify` Q3)
- Auto-accept inbound FHIR Task (deferred)
- Reference Lab admin redesign (uses existing Organization Management)
- Admin UI to reverse a Lost referral (the audit verb `REFERRAL_LOST_REVERSED` is reserved for the existing Sample Shipment admin path; this FRS does not design that UI)
- Multi-test bulk dispatch as a single Referral row (one Analysis per Referral stays the invariant)
- Turnaround-time / rejection-rate metrics dashboard (separate Reports work)
- Mobile responsiveness beyond Carbon defaults

### 2.4 IA placement

| Item | Value |
|---|---|
| SideNav | Sample Shipment → Reference Lab Results |
| Route | `/SampleShipment/reference-lab-results` |
| Query params | `?view=outstanding\|returned\|history` (default: outstanding) · `?refLab=<id>` · `?range=7\|30\|90` |
| Breadcrumb | Home / Sample Shipment / Reference Lab Results |
| Page title (h1) | Reference Lab Results |
| Count badge on SideNav item | Renders count of Returned — needs action when > 0 (e.g. `Reference Lab Results [3]`) |

The page is a single scroll surface. No in-page Carbon Tabs — the three filter views switch via a Carbon `ChipSet` (single-select) at the top of the page. View state is encoded in the URL query string for deep-linkability.

### 2.5 Roles and access

Attaches to existing OpenELIS role bundles. No new permission keys.

| Role bundle | Outstanding view | Returned view | History view | Accept / Reject |
|---|---|---|---|---|
| Validator | read | read | read | write |
| Lab Manager | read | read | read | write |
| Analyst | read | read | read | — |
| Reception | read (no patient PHI) | — | — | — |
| Provider | read (only their own referrals) | — | — | — |
| Admin | full | full | full | write |

**No invented per-action permission keys.** Access is granted by membership in the existing role bundles. UI hides actions the role cannot perform.

### 2.6 Audit

Every state-changing action writes an `audit_trail` row. See §10 for the full table; summary:

| Action | Audit verb | Target |
|---|---|---|
| Validator/Reception receives a returned result | `REFERRAL_RESULT_RECEIVED` | `Referral.id` |
| Validator Rejects a returned result | `REFERRAL_RESULT_REJECTED` | `Referral.id` |
| Referral state transitions (any) | `REFERRAL_STATE_CHANGED` | `Referral.id` |
| Validator opens in Result Entry | not audited (read) | — |
| Lab manager marks Lost | `REFERRAL_MARKED_LOST` | `Referral.id` |

Envers coverage: the existing `Referral` and `ReferralResult` entities already have `@Audited`; no new entities introduced.

---

## 3. User Stories

**US-1 — Lab Manager: Daily outstanding-tests review.** *As a Lab Manager, I want to open Reference Lab Results each morning and see, in one place, every test that's still out at a reference lab with how long it has been waiting, so that I can identify stuck samples and chase the reference lab when needed.*

**US-2 — Validator: Result return reconciliation.** *As a Validator, I want to see at a glance which results came back from reference labs today, and accept each one into the originating local Analysis with a single click, so that those results flow into the normal validation queue without manual re-entry.*

**US-3 — Validator: Handling a rejection.** *As a Validator, when a reference lab rejects a sample (insufficient volume, wrong tube type, hemolysis, etc.), I want to reject the referral in the system with a reason, close the original Analysis as terminal-rejected, and have the system notify the requesting clinician and the lab-side Alerts screen so re-collection gets arranged. A new sample will require a new order — I don't try to recycle the broken one.*

**US-4 — Lab Manager: Stuck-box surfacing.** *As a Lab Manager, I want the system to highlight referrals that are over an aging threshold (default 7 days outstanding) so I notice stuck cases before clinicians call.*

**US-5 — Sample Shipping coordinator: Closing the loop.** *As a Sample Shipping coordinator, I want to see, on a Box's detail page, how many of its samples still need result reconciliation before the Box can be marked Reconciled, so the physical workflow and the data workflow stay aligned.*

---

## 4. Functional requirements

### 4.1 Page-level structure

**FR-PAGE-001 — Single scroll layout.**
The page renders in this vertical order:
1. Page header with h1 "Reference Lab Results" and breadcrumb
2. Aging banner (conditionally rendered, see FR-AGING-001)
3. Metric tiles row (4 tiles, Carbon Tile with thick colored left border)
4. Primary filter ChipSet (single-select: Outstanding · Returned — needs action · History)
5. Secondary filter row (Reference Lab dropdown · Date range picker · Priority MultiSelect · Days outstanding bucket Select)
6. DataTable (columns vary per active filter chip — see FR-COLUMNS-* below)
7. Per-row inline-expand detail panel (Carbon `TableExpandedRow`, NOT a modal)

**FR-PAGE-002 — No in-page tabs.**
The three filter states use a Carbon `ChipSet`. The page MUST NOT render Carbon `Tabs` for switching between Outstanding / Returned / History. Modals are only used for destructive confirmation (Reject, Mark Lost).

**FR-PAGE-003 — Deep-linkability.**
The active filter chip and secondary filter selections MUST be reflected in the URL query string. Pasting the URL into a new tab MUST land on the same view. Browser back/forward navigation MUST move between previous filter states.

**FR-PAGE-004 — Carbon visual conventions match deployed Sample Shipment.**
- Metric tiles use the thick-colored-left-border pattern (uppercase caption, large number above)
- Yellow `InlineNotification kind="warning"` for the aging banner
- Empty state copy: "No referrals found for the selected filters."

### 4.2 Metric tiles

**FR-METRIC-001 — Four tiles, left-to-right.**
| Tile label | Color accent | Count source |
|---|---|---|
| OUTSTANDING | green | Count of Referrals with Task status ∈ {requested, received, in-progress}, DiagnosticReport absent |
| RETURNED — NEEDS ACTION | red | Count of Referrals with Task status = completed AND DiagnosticReport present AND not yet reconciled to local Analysis |
| RECONCILED TODAY | teal | Count of Referrals reconciled (`REFERRAL_RESULT_RECEIVED` event) since 00:00 local time |
| REJECTED THIS WEEK | warm-gray | Count of Referrals with Task status = rejected, rejection date within last 7 days |

**FR-METRIC-002 — Clickable filter trigger.**
Clicking a metric tile MUST set the primary filter chip to the matching view (Outstanding → Outstanding, Returned → Returned, Reconciled Today → History with date filter = today, Rejected This Week → History with status filter = rejected and date filter = last 7 days).

**FR-METRIC-003 — Real-time refresh.**
Counts refresh on page load and on any state-changing action (Accept / Reject / Mark Lost). No background polling in v1.

### 4.3 Filter behavior

**FR-FILTER-001 — Primary filter chip is single-select.**
ChipSet with three chips: `Outstanding`, `Returned — needs action`, `History`. Default selection: Outstanding. Selection persists across page reloads via URL.

**FR-FILTER-002 — Secondary filters apply AND-style.**
All secondary filters combine with AND logic against the primary chip's base query.

**FR-FILTER-003 — Secondary filter list.**
| Filter | Component | Source / values |
|---|---|---|
| Reference Lab | Dropdown | From existing Organization Management (organizations tagged as `referenceLab`) |
| Date range | DatePicker (range) | Applies to Sent Date by default; switches to Closed Date when primary chip = History |
| Priority | MultiSelect | Routine, Urgent, STAT — values from existing `priority` field on `Referral` |
| Days outstanding bucket | Select | All · 0-7 · 7-30 · >30 — only visible when primary chip = Outstanding |

**FR-FILTER-004 — Clear all.**
A "Clear filters" ghost button next to the secondary filter row resets all secondary filters but does NOT change the primary chip.

### 4.4 Outstanding view

**FR-OUTSTANDING-001 — DataTable columns.**
| Column | Sortable | Default |
|---|---|---|
| Lab Number | yes | — |
| Patient | yes | — |
| Test(s) | no | shows comma-separated test names; truncated at 3 with "+N more" overflow |
| Reference Lab | yes | — |
| Box ID | no | Carbon Link to `/SampleShipment/box/<id>`; opens in same tab |
| Sent Date | yes | descending — DEFAULT SORT |
| Status | yes | Carbon Tag with kind from §6 mapping table |
| Days outstanding | yes | computed; cell turns yellow at >7 days, red at >30 days |
| Priority | yes | Carbon Tag (Routine=gray, Urgent=warm-gray, STAT=red) |

**FR-OUTSTANDING-002 — Default sort.**
Sent Date descending (most-recently-sent first).

**FR-OUTSTANDING-003 — Row click expands inline.**
Clicking a row (anywhere except the Box ID link or Action column) expands the row inline via `TableExpandedRow`. Only one row expanded at a time; clicking another row collapses the previous.

**FR-OUTSTANDING-004 — Row write actions.**
The primary action — **"Enter result"** — surfaces as a visible **two-line Carbon Button** in a dedicated Actions column at the right of every Outstanding row. The button is sized to wrap the text "Enter result" across two lines (≈88px wide, kind=`tertiary`, size=`sm`) so the action is one-click-obvious without an overflow menu. The deployed Sample Shipment surface uses overflow menus; this surface deliberately deviates because manual-entry is the single most common action by far (most reference labs are not on OpenELIS).
A secondary action — "Mark Lost" — lives only in the expand panel (FR-EXPAND-006). It's a less-frequent path and benefits from the friction of a row click.
Auto-driven FHIR state transitions on Outstanding rows continue to fire from inbound peer messages.

**FR-OUTSTANDING-005 — Manually enter result action.**

The realistic case: most reference labs do not run OpenELIS and return results by phone / fax / paper / email. The validator needs to post the result against the original referred Analysis without leaving the Reference Lab Results context.

Behavior:
- Every Outstanding row renders a visible **two-line Carbon Button** labeled `t('referral.action.enterResult', 'Enter result')` in a dedicated Actions column (kind=`tertiary`, size=`sm`, ≈88px wide so the text wraps cleanly).
- The expand panel (Outstanding mode) renders the same action as a primary Button (size=`sm`, kind=`primary`).
- Clicking deep-links to the existing Result Entry screen: `/result?sampleId=<labNumber>` (the existing "enter result by lab number" route — reuses every existing component, no new entry form).
- Existing Result Entry already accepts manual capture of the result value AND the reported date/time. No changes to Result Entry UI in v1.
- **Server-side hook:** the existing `ResultService.create` (or `LogbookResultsController` save handler) is wrapped to detect "the saved Result lands on an Analysis with an open Referral (`Task.status != completed`)". When detected, the hook:
  - Advances Referral's `Task.status = completed`
  - Sets `Referral.reconciled = true`, `reconciled_at = now`, `reconciled_by = current user`
  - Sets new flag `Referral.manually_entered = true` (NEW column — see §5.1)
  - Emits FHIR Task PUT with `status = completed` (peer will see the closure even though they didn't send a DiagnosticReport)
  - Emits `audit_trail` row with verb `REFERRAL_RESULT_RECEIVED` and payload `{ source: "manual", entry_method: "result_entry" }`
- After Result Entry save, the Referral row moves directly from Outstanding to History (NOT to Returned-needs-action — the user already entered the result, no Accept step needed).
- In History, the row carries a `Manually entered` Tag (Carbon Tag kind `warm-gray`) so the audit trail makes the entry method legible.
- Manual entry follows existing Result Entry validation-queue behavior (Analysis status → `not_validated`, enters local validation queue). This is intentional — the transcription itself benefits from local validation, even though the underlying result was peer-validated. The validation step here is "did the typist transcribe correctly?", not "is the result clinically correct."

### 4.5 Returned — needs action view

**FR-RETURNED-001 — DataTable columns.**
| Column | Sortable | Default |
|---|---|---|
| Lab Number | yes | — |
| Patient | yes | — |
| Test(s) | no | comma-separated, truncated |
| Reference Lab | yes | — |
| Result summary | no | First test result + units, with "+N more" if multi-test referral |
| Returned Date | yes | descending — DEFAULT SORT |
| Original requestor | yes | Provider name from local order |
| Actions | no | Two visible buttons: **Accept** (primary) and **Reject…** (danger--ghost). Open in Result Entry lives in the expand panel only. |

**FR-RETURNED-002 — Accept action (reception model).**

**Important:** The reference lab has already validated and released the result on its end. The local Accept action is **reception**, not revalidation. The local lab is responsible for posting the result to the right Analysis and capturing the local "received by + timestamp" audit point — NOT for re-reviewing the result clinically.

Selecting Accept commits the returned result(s) into the original `Analysis`(es). For each test on the Referral:
- Create/update the corresponding `Result` row tied to the original `Analysis` by mapping `DiagnosticReport.Observation` → `Result` via existing `ResultService.create`
- **Set Analysis status to `validated`/released** (NOT to `not_validated` — no local validation queue step for reference-lab returns)
- Set Referral row's `Task.status = completed` (confirming write)
- Set local flag `Referral.reconciled = true`, `reconciled_at = now`, `reconciled_by = current user`
- Emit `audit_trail` row with verb `REFERRAL_RESULT_RECEIVED`
- Row is removed from the Returned view, appears in History
- If this was the last unreconciled Referral in the containing Box, surface a notification on the Box detail page: "All referrals reconciled — ready to close box."

**Multi-test referrals.** When the DiagnosticReport carries multiple Observations (e.g. a HBV+HCV combined referral), Accept is **per-test with an "Accept all results" shortcut**. The expand panel renders one result card per test with its own per-card Accept button; a primary "Accept all results" button at the top of the result section accepts every test at once. A validator MAY also Reject one test while accepting another (covered in FR-RETURNED-003.1).

**FR-RETURNED-002.1 — Critical / Abnormal flag hook into Alerts feature.**
If a returning DiagnosticReport.Observation carries `interpretation` flag `Critical` (or, by configuration, `Abnormal`), the Accept action MUST additionally write an entry into the existing **Alerts feature** (separate from this FRS — see `critical_result_ack_global_todo` and the Alerts module). The Referral feature does NOT design that surface; it only emits the trigger. Payload includes patient identifier, test code, returned value, reference range, and a deep link to the original Analysis. The local Accept action otherwise proceeds normally — receipt and posting are NOT blocked by the alert.

**FR-RETURNED-002.2 — Identifier mismatch exception.**
If the DiagnosticReport's `subject` reference cannot be resolved to a local Patient/Analysis (peer used an unknown identifier, lab number doesn't match), the Accept action MUST refuse and route the row to an exception state. Surfaces as a small "Exceptions" indicator on the Returned view. v1 keeps the exception handling lightweight: row stays in Returned with an exception tag, and reception staff manually reconciles via the existing patient-search workflow before the row can be Accepted. A dedicated exception queue UI is out of scope for v1 (could be revisited if exception volume warrants).

**FR-RETURNED-003 — Reject action (terminal close + re-collection notification).**

**Important:** Peer rejections are nearly always physical-sample problems (insufficient volume, wrong tube, hemolysis, damaged container, temperature deviation, clotted, mislabeled). In every realistic case the existing sample is gone or unusable, so the workflow is NOT "re-refer the same sample" — it's "patient needs to come back, new sample collected, new order created."

Selecting Reject opens a confirmation modal (the only destructive modal in this feature). Modal contents:
- Sample identifying info (Lab Number, Patient, Test)
- Required TextArea: "Reason for rejection" (free text, min 1 char, max 500 char) — pre-populated from peer's `Task.statusReason.text` if present
- Optional Select: pre-filled reason from existing OpenELIS non-conformity types (Insufficient volume, Wrong sample type, Damaged container, Temperature deviation, Hemolyzed, Clotted, Mislabeled, Other)
- Carbon `InlineNotification kind="warning"`: "Rejecting closes the Analysis as terminal-rejected. The requesting clinician will be notified to arrange re-collection. A new order will be needed when a fresh sample is collected."
- Confirm button (danger primary) labeled "Reject and notify clinician"
- Cancel button (ghost)

On confirm:
- Set `Task.status = rejected`
- Set Referral row's `cancelDate = now`, `cancelReason = reason`, `reject_reason_code = <selected>`, `reject_reason_text = <free text>`
- **Close the original Analysis as terminal** with a new status `rejected_by_reference_lab` (NEW Analysis state value — Liquibase). The Analysis is NOT re-opened; re-collection produces a new order → new Analysis → new Lab Number per existing order-entry flow.
- Emit FHIR Task PUT with `status = rejected` and reason in `Task.statusReason.text`
- **Fire notification to requesting clinician** via existing OGC-589 notification infra (NEW event type `REFERRAL_REJECTED_NEEDS_RECOLLECTION` — registers with OGC-589's trigger registry). Payload: patient identifier, original Lab Number, test code(s), reject reason, deep link to the (now closed) Analysis for reference.
- **Emit trigger into the existing Alerts feature** so the rejection appears on the lab-side Alerts screen with an acknowledgment step. The Alerts feature owns the ack UX; this story only emits the trigger.
- Emit `audit_trail` row with verb `REFERRAL_RESULT_REJECTED`, payload includes reason code + text
- No re-refer prompt and no re-open path — re-collection is the clinician's responsibility, captured via a fresh order.

**FR-RETURNED-004 — Open in Result Entry action.**
A ghost Button in the expand panel labeled "Open in Result Entry" navigates to the existing Logbook page (`/result?sampleId=<labNumber>`) with the sample pre-selected. The referral row remains in the Returned view until the validator acts on it (Accept or Reject) from there or from this surface. This is a context-only shortcut for validators who want to see the patient's surrounding result history before accepting; it is NOT a write action. Lives in the expand panel only (not on the row) since it's a secondary navigation, not a primary decision.

**FR-RETURNED-005 — Default sort.**
Returned Date descending.

### 4.6 History view

**FR-HISTORY-001 — DataTable columns.**
| Column | Sortable | Default |
|---|---|---|
| Lab Number | yes | — |
| Patient | yes | — |
| Test(s) | no | comma-separated, truncated |
| Reference Lab | yes | — |
| Outcome | yes | Reconciled · Rejected · Cancelled · Lost (Carbon Tag) |
| Closed date | yes | descending — DEFAULT SORT |
| Box ID | no | Carbon Link |
| Days total | yes | Closed date − Sent date |

**FR-HISTORY-002 — Read-only.**
No write actions. Inline expand shows the same panel as other views but with no action buttons; instead the activity log shows the full transition history.

**FR-HISTORY-003 — Default sort.**
Closed date descending.

### 4.7 Per-row inline-expand detail panel

**FR-EXPAND-001 — Layout.**
Expanding a row reveals a `Tile` filling the row's `TableCell colSpan` with three columns of detail (Carbon `Grid`, 4-4-4 split on `lg`; stacked on `md` and below):
- Left: **Original order context**
- Center: **Reference lab transit**
- Right: **Result** (Returned/History only) OR **Activity log** (Outstanding)

Below the three columns, a single-row **Activity log** spans the full width (Carbon `StructuredList`).

**FR-EXPAND-002 — Original order context fields.**
- Local Lab Number (link to `/Patient/<id>` patient summary)
- Original Analysis state at refer-out time
- Requesting provider name + role
- Specimen collection date/time
- Original test code(s) and local test name(s)
- Clinical notes (if present from order entry)

**FR-EXPAND-003 — Reference lab transit fields.**
- Reference lab name (link to existing Organization Management record, opens in new tab)
- Box ID (link to Sample Shipment box detail)
- Dispatched date/time (from `Box.sentDate`)
- Received-at-reference-lab date/time (from `Box.receivedDate`)
- FHIR Task UUID (small monospace, copyable)
- Manifest version (from Box record)

**FR-EXPAND-004 — Result fields (Returned and History views only).**
For each test on the Referral:
- Test name
- Returned value + units
- Reference range
- Peer's interpretation flag (Normal · Abnormal · Critical) if present in DiagnosticReport
- Peer's comments / notes

If multi-test: stacked sub-tiles per test.

**FR-EXPAND-005 — Activity log.**
StructuredList rows, one per state transition, columns: Timestamp · Actor · From state · To state · Notes. Generated by joining `audit_trail` rows for this Referral.

**FR-EXPAND-005.1 — Returned-result data source.**
The result-card fields rendered in FR-EXPAND-004 (Returned and History views) are rendered **directly from the inbound `DiagnosticReport.Observation` resources** stored in the FHIR persistence layer. They are NOT persisted to a separate transient table. The Accept action (FR-RETURNED-002) is what persists into the standard `Result` entity by mapping each Observation to a `Result` row tied to the originating Analysis. This means:
- Reference range, units, interpretation flag, and peer comments are read at render time from the FHIR resource; no schema additions for these fields.
- Multi-test referrals carry multiple Observations under one DiagnosticReport; the mockup's stacked result cards reflect that.
- Once Accepted, the persistent `Result.value`, `Result.units`, `Result.notes`, etc. carry forward via existing OpenELIS schema; the original DiagnosticReport remains in FHIR storage for audit.

**FR-EXPAND-006 — Outstanding-view Mark Lost action.**
On the Outstanding view, the expanded panel includes a "Mark Lost" Button (kind="ghost") in the bottom-right. Click opens a confirmation modal with required reason TextArea. On confirm: set `Referral.lostStatus = true`, `lostDate = now`, `lostReason = reason`. The FHIR Task remains in its current status (lost is a local-only side flag, not a FHIR Task transition). Row moves to History view with Outcome = Lost.

### 4.8 Aging banner

**FR-AGING-001 — Banner conditions.**
Render a Carbon `InlineNotification kind="warning"` at the top of the page (below header, above metric tiles) when:
- Active primary filter chip = Outstanding, AND
- Count of Referrals with Days outstanding > threshold (default 7 days, see FR-AGING-003) ≥ 1

**FR-AGING-002 — Banner content.**
- Title: "Stuck referrals require attention"
- Subtitle: "{N} referrals have been at a reference lab for more than {threshold} days. Consider contacting the reference lab or reassigning."
- Action link in banner: "Filter to stuck only" — applies Days outstanding bucket filter to ">30" or ">7" matching the configured threshold

**FR-AGING-003 — Threshold configuration.**
Threshold is read from `unassigned_alert_config.referralStuckThresholdDays` (table added by Sample Shipment feature; reuse). Default value 7. Admin-configurable on the Settings page (out of scope for this FRS to design the admin UI, but a config row MUST be added).

### 4.9 Sample Shipment integration

**FR-INT-001 — Box-to-Referral back link.**
On the Sample Shipment Box detail page (existing surface), add a section "Reference Lab Results" listing the count of Referrals contained in the box, grouped by Task status. Clicking a count navigates to Reference Lab Results pre-filtered to that Box ID. *Note: this is a small change to the existing Box detail page; flag in `/breakdown` as a dependency story.*

**FR-INT-002 — Reconciliation gate on Box state.**
When a user attempts to transition a Box from `Received` to `Reconciled` and any contained Referral has Task status ∉ {completed, rejected, cancelled} (or `lostStatus = true`), the transition is blocked with a Carbon `InlineNotification kind="error"`: "Cannot reconcile box — {N} samples still awaiting result reconciliation. See Reference Lab Results."

**FR-INT-003 — Reverse link from Referral row.**
The Box ID column in all three Referral views links to the Box detail page in Sample Shipment.

### 4.10 Order Entry Step 3 hook (OGC-605)

**FR-OE-001 — Refer Out at order time.**
On Step 3 of the new 4-step Order Entry wizard (OGC-605 scope), a per-test Refer Out checkbox creates a `Referral` row immediately on Order Save with `Task.status = draft`. The created Referral appears in the Sample Shipment Unassigned Samples tab automatically (sample carries `referral_flag = true`).

**FR-OE-002 — Dedupe with Result Entry path.**
Both Order Entry and Result Entry create paths must dedupe on Analysis ID. A second click of Refer Out on either path against the same Analysis is a no-op if a Referral row exists for that Analysis in non-terminal state.

### 4.11 FHIR integration

**FR-FHIR-001 — Outbound state writes.**
`FhirReferralServiceImpl` MUST emit FHIR Task PUTs on every state transition:
| Local transition | FHIR Task.status |
|---|---|
| Referral created via Order Entry or Result Entry | `draft` (no PUT yet; Task not yet emitted to peer) |
| Box containing referral transitions to Sent | `requested` (PUT emitted) |
| Peer's Task PUT to received | `received` (local update only) |
| Peer's Task PUT to in-progress | `in-progress` (local update only) |
| DiagnosticReport arrives | `completed` (existing path; refine to confirm) |
| **Local Result saved against an Analysis with active Referral (manual entry path)** | **`completed` (PUT emitted; see FR-OUTSTANDING-005)** |
| Validator's Reject action | `rejected` (PUT emitted) |
| User cancels referral | `cancelled` (PUT emitted; un-comment existing path) |

**FR-FHIR-002 — Inbound state reads.**
A new endpoint or extension of the existing FHIR Task receive handler accepts peer Task PUTs and updates local Referral state. Acceptance rules:
- A PUT against a Referral in `draft` is rejected (peer should not see drafts)
- A PUT to `received` is accepted against a Referral in `requested` (idempotent)
- A PUT to `in-progress` is accepted against a Referral in `requested` or `received` (idempotent)
- A PUT to `rejected` is accepted against any non-terminal Referral; triggers FR-RETURNED-003 effects (re-open Analysis, retain Refer Out flag)
- Out-of-order PUTs (peer sends in-progress before received) are accepted by latching the most advanced state

**FR-FHIR-003 — DiagnosticReport routing.**
Incoming `DiagnosticReport` resources MUST be routed to the originating Referral by matching `DiagnosticReport.basedOn` to the stored ServiceRequest UUID (`Referral.fhirUuid`). On match:
- Parse Observations into per-test result data
- Set Referral's `Task.status = completed`
- Set `Referral.diagnosticReportUuid` (NEW column)
- Trigger Returned-needs-action surface

**FR-FHIR-004 — No peer-lab distinction.**
Per `/clarify` Q3 decision, no `OpenELISReferralTask` profile is introduced in v1. The FHIR IG remains as-is. Inbound Tasks from any source (EMR or peer lab) land in Incoming Orders as today.

### 4.12 State-model migration

**FR-MIG-001 — Liquibase changeset.**
A Liquibase changeset renames `ReferralStatus` enum values to FHIR-aligned strings:
| Old value | New value |
|---|---|
| `CREATED` | `draft` |
| `SENT` | `requested` |
| `RECEIVED` | `received` |
| `FINISHED` | `completed` |
| `CANCELED` | `cancelled` |

Plus three new values: `in-progress`, `rejected`, `lost` (note: `lost` is the local side flag previously stored in `lostStatus` bool; the bool is retained for back-compat, but a derived view treats it as a pseudo-status for the History view).

**FR-MIG-002 — Reversibility.**
The Liquibase changeset MUST include a `rollback` block that restores the original enum values.

**FR-MIG-003 — Pre-conditions.**
The changeset MUST include a Liquibase `preConditions` block asserting that no rows currently hold values `SENT` or `FINISHED` (today these are dead per audit; assert before migration). If found, fail the migration with a clear error and require manual triage.

**FR-MIG-004 — Backfill.**
Existing rows migrate by direct rename. No row-level data transformation needed.

**FR-MIG-005 — Application-layer enum.**
The Java `ReferralStatus` enum in `org.openelisglobal.referral.valueholder` updates to match. References across `ReferralService`, `ReferredOutTestsRestController`, `FhirReferralServiceImpl` recompile against new values.

### 4.13 OGC-624 reconciliation

**FR-624-001 — Close state-field scope.**
The OGC-624 proposed `subcontractStatus` field is NOT added. Any work-in-progress code referencing it is re-pointed at `ReferralStatus` (FHIR-aligned per FR-MIG-001). Coordinated with OGC-624's owner before the change; surgery handled in `/breakdown`.

**FR-624-002 — Carry forward non-state scope.**
OGC-624's other scope folds into this FRS:
- Subcontract metadata panel → Sample Shipment's existing destination/notes fields (no new build)
- Outbound WhatsApp/email notify → integrates with OGC-589's notification infra; lives in the expand panel as a "Notify reference lab" Button (NOT in scope for this FRS to spec the integration; flag as a dependency on OGC-589)
- Inbound FHIR registration → already covered by existing Incoming Orders behavior

---

## 5. Data Model

### 5.1 Existing tables — modifications

**`referral` (existing — modify):**
| Column | Type | Change | Notes |
|---|---|---|---|
| `status` | varchar(32) | **migrated values** (FR-MIG-001) | enum strings, FHIR-aligned |
| `diagnostic_report_uuid` | uuid | **NEW** | nullable; set when DiagnosticReport routes in. Null when result was manually entered. |
| `reconciled` | boolean | **NEW** | default false; set true on Accept action or manual Result save against open Referral |
| `reconciled_at` | timestamp | **NEW** | nullable; set on Accept or manual entry |
| `reconciled_by` | bigint | **NEW** | FK to user; set on Accept or manual entry |
| `manually_entered` | boolean | **NEW** | default false; set true by FR-OUTSTANDING-005 server-side hook when a Result is saved against an Analysis with an open Referral. Drives the "Manually entered" Tag in History view. |
| `reject_reason_code` | varchar(64) | **NEW** | nullable; from non-conformity types when Reject used pre-filled reason |
| `reject_reason_text` | text | **NEW** | nullable; required when reject_reason_code is null |
| `assigned_box_id` | bigint | existing (`assignedBox`) | unchanged |
| `lost_status` | boolean | existing (`lostStatus`) | unchanged |
| `lost_date`, `lost_reason` | existing | unchanged |
| `priority` | varchar(16) | existing | unchanged; now surfaced in UI |
| `fhir_uuid` | uuid | existing | unchanged |
| `cancel_date`, `cancel_reason` | existing | unchanged |

### 5.2 Existing tables — no schema change, new usage

**`audit_trail` (existing — no schema change, new event verbs):**
- `REFERRAL_RESULT_RECEIVED`
- `REFERRAL_RESULT_REJECTED`
- `REFERRAL_STATE_CHANGED`
- `REFERRAL_MARKED_LOST`

Payload format follows existing OpenELIS audit conventions: `{ entityType: "referral", entityId: <uuid>, before: <status>, after: <status>, actorId: <userId>, notes: <free text> }`.

### 5.3 Entities NOT changing

- `Box` / `Shipment` — owned by Sample Shipment; this FRS reads but does not write
- `Sample` / `Analysis` / `Result` — existing; Accept action writes Result rows via the existing service layer (`ResultService.create`), not a new write path
- `Organization` (reference labs) — read-only, from existing Organization Management

### 5.4 Dependency — NEW data not yet built

Two pieces of data are required by this FRS but do not exist today and must be flagged as named dependencies:

| Dependency | Owned by | Required by FRs |
|---|---|---|
| `unassigned_alert_config.referralStuckThresholdDays` admin setting | This FRS or a co-shipping setting | FR-AGING-003 |
| Sample Shipment Box detail page's "Reference Lab Results" section | Sample Shipment team (small UI change) | FR-INT-001 |

Both are surfaced in `/breakdown` as dependency stories.

---

## 6. State machine — FHIR Task lifecycle

### 6.1 Canonical states

| State | Meaning |
|---|---|
| `draft` | Referral row exists locally; no FHIR Task emitted to peer yet |
| `requested` | Box containing this referral has been Sent; FHIR Task PUT emitted |
| `received` | Peer reference lab has acknowledged receipt of the sample |
| `in-progress` | Peer reference lab is actively running the test |
| `completed` | Result has been returned via DiagnosticReport |
| `cancelled` | Sender (this lab) cancelled the referral |
| `rejected` | Peer reference lab rejected the sample (insufficient volume, wrong type, etc.) |

### 6.2 Local-only side flags

- `lostStatus` (bool, existing) — sample lost in transit. Sample's FHIR Task remains in its current status; `lost` shows in History view as the Outcome via a derived render. Setting `lostStatus = true` is a sender-side action only; doesn't emit a FHIR Task PUT.

### 6.3 Allowed transitions

```
draft → requested      (Box sent — automated)
draft → cancelled      (user cancel)
requested → received   (peer PUT or manual override)
requested → cancelled  (user cancel)
requested → rejected   (peer PUT)
received → in-progress (peer PUT)
received → rejected    (peer PUT)
in-progress → completed (DiagnosticReport arrives)
in-progress → rejected  (peer PUT)
```

All transitions emit an `audit_trail` row with verb `REFERRAL_STATE_CHANGED`.

### 6.4 Carbon Tag mapping for Status column

| State | Tag kind | Display label i18n key |
|---|---|---|
| draft | gray | `referral.status.draft` (default: "Draft") |
| requested | blue | `referral.status.requested` (default: "Sent — awaiting acceptance") |
| received | purple | `referral.status.received` (default: "At reference lab") |
| in-progress | warm-gray | `referral.status.inProgress` (default: "In progress at reference lab") |
| completed | teal | `referral.status.completed` (default: "Result returned") |
| rejected | red | `referral.status.rejected` (default: "Rejected by reference lab") |
| cancelled | gray | `referral.status.cancelled` (default: "Cancelled") |
| lost (side flag) | red | `referral.status.lost` (default: "Lost in transit") |

---

## 7. Localization

All visible strings in the UI MUST be wrapped via `t(key, fallback)`. New keys:

| Key | Fallback (English) |
|---|---|
| `referral.page.title` | "Reference Lab Results" |
| `referral.breadcrumb.referenceLabResults` | "Reference Lab Results" |
| `referral.sidenav.referenceLabResults` | "Reference Lab Results" |
| `referral.chip.outstanding` | "Outstanding" |
| `referral.chip.returned` | "Returned — needs action" |
| `referral.chip.history` | "History" |
| `referral.metric.outstanding` | "Outstanding" |
| `referral.metric.returnedNeedsAction` | "Returned — needs action" |
| `referral.metric.reconciledToday` | "Reconciled today" |
| `referral.metric.rejectedThisWeek` | "Rejected this week" |
| `referral.column.labNumber` | "Lab Number" |
| `referral.column.patient` | "Patient" |
| `referral.column.tests` | "Test(s)" |
| `referral.column.referenceLab` | "Reference Lab" |
| `referral.column.boxId` | "Box ID" |
| `referral.column.sentDate` | "Sent Date" |
| `referral.column.status` | "Status" |
| `referral.column.daysOutstanding` | "Days outstanding" |
| `referral.column.priority` | "Priority" |
| `referral.column.resultSummary` | "Result summary" |
| `referral.column.returnedDate` | "Returned Date" |
| `referral.column.originalRequestor` | "Original requestor" |
| `referral.column.outcome` | "Outcome" |
| `referral.column.closedDate` | "Closed date" |
| `referral.column.daysTotal` | "Days total" |
| `referral.action.accept` | "Accept" |
| `referral.action.reject` | "Reject" |
| `referral.action.openInResultEntry` | "Open in Result Entry" |
| `referral.action.enterResult` | "Enter result" (rendered as two-line button on row) |
| `referral.action.markLost` | "Mark Lost" |
| `referral.tag.manuallyEntered` | "Manually entered" |
| `referral.action.notifyReferenceLab` | "Notify reference lab" |
| `referral.action.clearFilters` | "Clear filters" |
| `referral.filter.referenceLab` | "Reference Lab" |
| `referral.filter.dateRange` | "Date range" |
| `referral.filter.priority` | "Priority" |
| `referral.filter.daysOutstandingBucket` | "Days outstanding" |
| `referral.filter.allDays` | "All" |
| `referral.filter.days0to7` | "0-7" |
| `referral.filter.days7to30` | "7-30" |
| `referral.filter.daysOver30` | ">30" |
| `referral.banner.stuckReferralsTitle` | "Stuck referrals require attention" |
| `referral.banner.stuckReferralsSubtitle` | "{N} referrals have been at a reference lab for more than {threshold} days." |
| `referral.banner.filterToStuck` | "Filter to stuck only" |
| `referral.emptyState` | "No referrals found for the selected filters." |
| `referral.table.outstanding.title` | "Outstanding referrals" |
| `referral.table.outstanding.desc` | "{N} referrals at reference labs awaiting results" (ICU plural) |
| `referral.table.returned.title` | "Returned — needs action" |
| `referral.table.returned.desc` | "{N} results awaiting reconciliation to local Analysis" (ICU plural) |
| `referral.table.history.title` | "History" |
| `referral.table.history.desc` | "{N} closed referrals" (ICU plural) |
| `referral.expand.statusDetail` | "Status detail" |
| `referral.expand.outcomeDetail` | "Outcome detail" |
| `referral.action.acceptToAnalysis` | "Accept to Analysis" |
| `referral.action.more` | "More actions" |
| `referral.result.referenceRange` | "Reference range:" |
| `referral.result.testLabel` | "Test" |
| `referral.result.valueLabel` | "Value" |
| `referral.result.unitsLabel` | "Units" |
| `referral.result.notesLabel` | "Notes" |
| `referral.result.flagLabel` | "Flag" |
| `referral.testsOverflow` | "more" (used in "+N more" overflow) |
| `referral.daysUnit` | "{N, plural, one {# day} other {# days}}" (ICU plural) |
| `referral.expand.criticalBadge` | "CRITICAL" |
| `referral.stuck.title` | "Stuck" |
| `referral.stuck.subtitle` | "Consider contacting the reference lab." |
| `referral.expand.originalOrderContext` | "Original order context" |
| `referral.expand.referenceLabTransit` | "Reference lab transit" |
| `referral.expand.result` | "Result" |
| `referral.expand.activityLog` | "Activity log" |
| `referral.expand.fhirTaskUuid` | "FHIR Task UUID" |
| `referral.expand.manifestVersion` | "Manifest version" |
| `referral.reject.modalTitle` | "Reject referral" |
| `referral.reject.reasonLabel` | "Reason for rejection" |
| `referral.reject.reasonPlaceholder` | "Describe why this referral is being rejected" |
| `referral.reject.preFilledReasonLabel` | "Common reason (optional)" |
| `referral.reject.warning` | "Rejecting this referral will re-open the original Analysis. The Refer Out flag will remain set so you can re-refer to a different lab." |
| `referral.reject.confirmButton` | "Reject and re-open Analysis" |
| `referral.markLost.modalTitle` | "Mark referral lost in transit" |
| `referral.markLost.reasonLabel` | "Reason" |
| `referral.markLost.warning` | "Marking this referral as lost is reversible only by an administrator." |
| `referral.outcome.reconciled` | "Reconciled" |
| `referral.outcome.rejected` | "Rejected" |
| `referral.outcome.cancelled` | "Cancelled" |
| `referral.outcome.lost` | "Lost" |
| Plus `referral.status.*` keys from §6.4 |
| Plus `referral.audit.*` keys for audit log display |

---

## 8. Permissions & Audit

### 8.1 Role attachment

Per `references/permissions-and-audit.md`: no new permission keys. Access is granted via existing role bundles.

| Role bundle | Read | Accept | Reject | Mark Lost | Reverse Lost |
|---|---|---|---|---|---|
| Validator | ✓ | ✓ | ✓ | ✓ | ✗ |
| Lab Manager | ✓ | ✓ | ✓ | ✓ | ✗ |
| Analyst | ✓ | ✗ | ✗ | ✗ | ✗ |
| Reception | ✓ (PHI-limited) | ✗ | ✗ | ✗ | ✗ |
| Provider | ✓ (own referrals only) | ✗ | ✗ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

UI MUST hide action buttons for roles without write access. API endpoints MUST enforce same matrix via existing Spring Security annotations on the controller.

### 8.2 Audit verbs

| Verb | When | Target | Payload |
|---|---|---|---|
| `REFERRAL_STATE_CHANGED` | Any FHIR Task state transition | `Referral.id` | `{ from: <state>, to: <state>, source: peer\|user\|system }` |
| `REFERRAL_RESULT_RECEIVED` | Validator Accepts | `Referral.id` | `{ analysisId: <id>, resultId: <id> }` |
| `REFERRAL_RESULT_REJECTED` | Validator Rejects | `Referral.id` | `{ reasonCode: <code>, reasonText: <text> }` |
| `REFERRAL_MARKED_LOST` | User marks Lost | `Referral.id` | `{ reason: <text> }` |
| `REFERRAL_LOST_REVERSED` | Admin reverses Lost flag | `Referral.id` | `{ priorLostDate: <date>, priorReason: <text> }` |

### 8.3 Envers coverage

Existing `Referral` and `ReferralResult` entities already have `@Audited` (row-level history via Hibernate Envers). No new entities introduced. New columns (`diagnostic_report_uuid`, `reconciled`, `reconciled_at`, `reconciled_by`, `reject_reason_code`, `reject_reason_text`) are automatically captured by Envers via the existing class-level annotation.

---

## 9. Non-functional requirements

**NFR-1 — Performance.** Page initial load < 2 seconds with up to 1000 Referrals across all states; DataTable filtering and sort are server-side and respond < 500ms for typical filter combinations. Aging banner count query MUST use the existing `referral.status` index plus a new index on `(status, sent_date)` if needed.

**NFR-2 — Accessibility.** WCAG 2.1 AA. Color is never the sole indicator — Tag kinds also have text labels; days-outstanding cell color is paired with an icon when over threshold. Keyboard navigation: filter chips, secondary filters, table rows, and expand panels are all reachable by Tab; row expand toggles by Enter/Space. Screen reader announces row state change on expand. Modals trap focus per Carbon default.

**NFR-3 — i18n.** All visible strings via `t(key, fallback)` per §7. Date and number formatting via existing `useLocale()` hook. Days-outstanding cell respects locale numeric formatting.

**NFR-4 — Browser support.** Same matrix as current OpenELIS (Chrome, Firefox, Safari, Edge — last two stable versions).

**NFR-5 — Concurrency.** Two validators racing to Accept the same Referral: optimistic locking via existing `Referral.version` column (already present). Second user gets a Carbon InlineNotification "Another user updated this referral; refresh to see the latest state."

**NFR-6 — Idempotency on FHIR receive.** Peer Task PUTs to states behind current state are no-ops, not errors. Out-of-order PUTs latch to the most-advanced status.

**NFR-7 — Migration safety.** Liquibase changeset includes a backup table (`referral_status_migration_backup`) populated before the rename; rollback restores from backup.

---

## 10. Dependencies (named)

| Dependency | Required by | Status | Owner |
|---|---|---|---|
| Order Entry Step 3 Refer Out hook | FR-OE-001 | Backlog as OGC-605 | Order Entry team |
| Sample Shipment Box detail "Reference Lab Results" section | FR-INT-001 | Not yet built | Sample Shipment team |
| OGC-589 Referral-Out Notification infra | FR-624-002 | In progress | Notifications team |
| `unassigned_alert_config.referralStuckThresholdDays` row | FR-AGING-003 | Not yet seeded | This FRS adds via Liquibase |
| OGC-624 owner sign-off on state-model surgery | FR-624-001 | Coordination needed | TBD — confirm in `/breakdown` |

---

## 11. Open questions

These don't block FRS approval but should be tracked during build:

1. **What's the exact semantics of "Provider sees only their own referrals" (§2.5)?** Owned by the requesting provider's `accountId`? By the ordering session? Confirm in build kickoff.
2. ~~**Multi-test referrals on Accept**~~ **Resolved 2026-05-28**: per-test Accept with an "Accept all results" shortcut. See FR-RETURNED-002.
3. ~~**Re-refer UX after Reject**~~ **Resolved 2026-05-28**: no re-refer prompt. Reject closes the Analysis as terminal (`rejected_by_reference_lab`); requesting clinician is notified via OGC-589 to arrange re-collection; rejection also emits a trigger into the existing Alerts feature for lab-side acknowledgment; a new order with a fresh sample is created through the existing order-entry flow.
4. **Reception model resolved 2026-05-28**: returning DiagnosticReports are reception (not revalidation). Critical/Abnormal-flagged results emit a trigger into the existing Alerts feature, which owns the acknowledgment UX. Identifier-mismatch routes to a lightweight exception state in v1.

---

## 12. Acceptance criteria

The FRS is ready for `/breakdown` when:
- ✅ Lab Context covers Current State, Pain, What Changes in plain English
- ✅ IA placement is declared (SideNav, breadcrumb, URL)
- ✅ Permissions & Audit declared (existing role bundles; no invented keys)
- ✅ Every FR has a Carbon component or service implementation called out
- ✅ State machine fully mapped to FHIR Task with Tag kinds and i18n keys
- ✅ Data model changes listed with column types and rationale
- ✅ Localization table covers every visible string
- ✅ Dependencies named and owned
- ✅ Constitution alignment: no new permission keys, no multitenancy UI, no invented data fields (every column traces to existing schema or is declared NEW)
