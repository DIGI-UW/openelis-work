# Referral Redesign — Problem Framing & Brainstorm (v2)

**Author:** Casey + Claude
**Date:** 2026-05-28
**Status:** Pre-FRS direction-setting (v2 — re-scoped after Box of Samples integration)
**Umbrella Jira:** OGC-796 (to be promoted to Epic)
**Related tickets:** OGC-624 (in progress), OGC-589 (in progress), OGC-605 (backlog), OGC-503, OGC-449 (closed)
**Sibling feature already live:** Sample Shipment / Referred Sample Container Management — `/SampleShipment/*` on testing.openelis-global.org

---

## 1. The reframing

The original brainstorm assumed the Referral feature would handle the full lifecycle from refer-out through return-of-result. After loading the Referred Sample Container spec and mining the deployed `Sample Shipment` feature on testing, the picture is different:

**The Sample Shipment system already exists, is live, and owns:**
- Box creation, sample assignment, manifest generation, label printing
- The full 9-state physical shipment lifecycle: `Draft → Ready to Send → Sent → In Transit → Partially Received → Received → Reconciled → Cancelled → Lost in Transit`
- An "Unassigned Samples" tab for referred samples not yet in a box
- Receiving workflow with non-conformity capture
- FHIR `SupplyDelivery` exchange and facility registry admin
- A shipping dashboard with metric tiles: IN TRANSIT / DELIVERED / RECONCILED / TOTAL SAMPLES

**What the Sample Shipment system does NOT own:**
- The data state of an individual referred Analysis after the box has been received at the reference lab
- The arrival, reconciliation, and acceptance of returned `DiagnosticReport` results into the local Analyses
- A view of "what tests am I still waiting on from reference labs?"
- A view of "what results came back today and need a validator's eye?"

That gap — **between Box.Received and Box.Reconciled** — is the Referral redesign's home. Conceptually:

| FHIR resource | Owned by | Lifecycle |
|---|---|---|
| `SupplyDelivery` | Sample Shipment | Physical shipping of boxes |
| `Task` + `ServiceRequest` | **Referral (this redesign)** | Per-sample referral state, return-result reconciliation |
| `DiagnosticReport` | Referral inbound side | Results returning from reference labs |

The two systems run on parallel lifecycles, tightly coupled but separately rendered.

---

## 2. Locked decisions (carried forward from /clarify, all still valid)

| Q | Decision |
|---|---|
| 1. State machine | FHIR Task states canonical (`draft → requested → received → in-progress → completed` + `cancelled`/`rejected` as exits) |
| 2. Creation paths | Both Order Entry Step 3 AND Result Entry, dedupe on Analysis ID |
| 3. Inbound enhancement | None in v1 — existing Incoming Orders queue handles it; no Source column |
| 4. Ticket umbrella | OGC-796 = Epic; OGC-605/OGC-589 fold in; OGC-624 surgery on state model |

The /clarify pass results stand. The Box integration narrows scope but does not invalidate any decision.

---

## 3. New scope — what the redesigned Referral feature actually does

### 3.1 Surface 1: Outstanding Tests dashboard
Sample-level view of every referral where the local FHIR Task is in `requested`, `received`, or `in-progress` and no `DiagnosticReport` has arrived. Filter by reference lab, days outstanding, priority. SLA timer per row. Direct link to the Box that carried the sample (read-only).

### 3.2 Surface 2: Result Return inbox
The primary attention lane. Rows where `Task.status = completed` and a `DiagnosticReport` has arrived, but a validator hasn't yet accepted the result into the local Analysis. Three actions per row: **Accept to Analysis** (commits the result, advances local Analysis to validation queue), **Reject with reason** (sends `Task.status = rejected` back, re-opens local Analysis), **Open in Result Entry** (jump to the existing Logbook page with the sample loaded).

### 3.3 Surface 3: Performed / Rejected history
Closed referrals — completed and reconciled, or rejected, or cancelled. Read-only audit view. Filter, search, export.

### 3.4 State-model migration (existing scope)
`ReferralStatus` enum → FHIR Task states. Liquibase migration. Update outbound write path in `FhirReferralServiceImpl` to emit the full lifecycle (today only `REQUESTED → COMPLETED` are written; `CANCELLED` is commented out).

### 3.5 Integration with Sample Shipment
- Each Referral row links to its containing Box (forward link, read-only)
- Each Box row in Sample Shipment gains a "View Referrals" overflow action (back link, read-only) — small change to existing screen, flag as a dependency
- When a Box transitions to `Reconciled`, the system asserts that all Referrals contained have Task status of `completed` or `rejected`; if not, raise an inline warning (does not block reconciliation, just surfaces drift)

### 3.6 OGC-605 Order Entry Step 3 hook
Locked in via Q2 — declared at order time, dedupe on Analysis. The order-entry-side Refer Out checkbox writes the Referral row in `draft` state and feeds it into the Unassigned Samples tab on Sample Shipment automatically.

---

## 4. IA placement — SideNav submenu item, internal filter chips (no in-page tabs)

**Decision:** The redesigned Referral surface is a **new SideNav submenu item** under the existing `Sample Shipment` group. **No in-page Carbon Tabs** — per OpenELIS convention, multi-view screens use SideNav submenu items, not tabs. The page itself uses a **filter chip group** to switch between the three view states.

> *Note on the deployed Sample Shipment UI: it currently renders Dashboard / Create Box / Receive Box / Reports / Settings as Carbon Tabs in addition to being separate SideNav-reachable routes. That double rendering is a violation of the sidenav convention but is shipped — out of scope to fix here. The new Reference Lab Results page only renders in SideNav; it does NOT add to the tab strip.*

### 4.1 SideNav structure
```
Sample Shipment (top-level)
├── Dashboard              /SampleShipment/dashboard
├── Create Box             /SampleShipment/create-box
├── Receive Box            /SampleShipment/receive
├── Reference Lab Results  /SampleShipment/reference-lab-results  ← NEW
├── Reports                /SampleShipment/reports
└── Settings               /SampleShipment/settings
```

The new SideNav item gets a count badge (e.g. `Reference Lab Results [3]` when 3 results are awaiting reconciliation) to drive attention without requiring the user to open the page first.

### 4.2 Page layout — single scroll, internal filter switching

```
Header: Reference Lab Results  (h1)
Breadcrumb: Home / Sample Shipment / Reference Lab Results
────────────────────────────────────────────────────────
Metric tiles row (Carbon Tile, thick left border):
  [Outstanding: 12]  [Returned — needs action: 3]  [Reconciled today: 7]  [Rejected: 1]
────────────────────────────────────────────────────────
Filter chip group (Carbon ChipSet, single-select):
  ( Outstanding ) ( Returned — needs action ) ( History )
Plus secondary filters: Reference Lab • Date range • Priority • Days outstanding bucket
────────────────────────────────────────────────────────
DataTable (single table, contents driven by the active chip):
  columns vary per filter state (see below)
  inline row expand for detail panel
```

The filter chip is reflected in the URL as a query parameter (`?view=outstanding|returned|history`) so the view is deep-linkable. Clicking a metric tile sets the corresponding chip.

### 4.3 The three filter states

| Chip | Drives DataTable to show | Default sort |
|---|---|---|
| **Outstanding** | Task status `requested` / `received` / `in-progress`, no DiagnosticReport yet | Days outstanding, descending |
| **Returned — needs action** | Task status `completed`, DiagnosticReport present, not yet reconciled | Returned date, descending |
| **History** | Reconciled, Rejected, Cancelled — read-only | Closed date, descending |

### 4.4 Default columns per filter state

**Outstanding:** Lab Number · Patient · Test(s) · Reference Lab · Box ID · Sent Date · Status · Days outstanding · Priority

**Returned — needs action:** Lab Number · Patient · Test(s) · Reference Lab · Result · Returned Date · Original requestor · Action menu (Accept / Reject / Open in Result Entry)

**History:** Lab Number · Patient · Test(s) · Reference Lab · Outcome · Closed date · Box ID · Days total

### 4.5 Shared secondary filters
Date range (sent date) · Reference lab · Priority · Days outstanding bucket (matching the Unassigned Samples aging convention: 0-7 / 7-30 / >30 days)

### 4.6 Per-row expand panel
Same Carbon inline-row expand convention (NOT a modal). Sections:
- **Original order context** — local lab number, original Analysis state, requesting provider, collection date
- **Reference lab transit** — Box ID (link), dispatched date, received-at-reference-lab date, manifest version
- **Result** (Returned tab only) — DiagnosticReport summary, returned value(s), units, reference range, peer's interpretation
- **Activity log** — Task state transitions, who, when, audit trail

---

## 5. Visual conventions to lift from the deployed Sample Shipment UI

These will land verbatim in the mockup:

- **Metric tiles** — Carbon Tile with thick colored left border, large numeric value, uppercase caption underneath. Color family: green for active in-flight, teal for completed-and-good, blue for total, red for attention-needed.
- **Sticky Summary side-panel** — when a referral row is in detail view, the right-side panel holds the Accept / Reject / Open buttons (matches Create Box's pattern).
- **Yellow `InlineNotification` stack** — for validation gates (e.g. "Cannot accept — reference range missing").
- **Sub-tab pattern** — Carbon Tabs with iconDescription, count tags for attention.
- **Single-scroll page** — no accordion, no modals (modals only for destructive confirmations like Reject).
- **Empty state copy** — "No X found for selected filters."

---

## 6. Updated state-model migration plan

Same as v1 brainstorm — no change. Repeating here for completeness:

1. Liquibase migration: `ReferralStatus` enum values rename to FHIR-aligned strings. Keep old values readable for transition window.
2. Update `FhirReferralServiceImpl.createReferralTask`:
   - `draft` set at creation (no Task emitted yet)
   - `requested` set when Box transitions to `Sent` (matches the existing wire moment in Sample Shipment)
   - `received` set when Box transitions to `Received` (NEW — wires from Sample Shipment receive action)
   - `in-progress` set when peer's Task PUT or first partial DiagnosticReport arrives (NEW handler)
   - `completed` set when full DiagnosticReport arrives (existing behavior; refine)
   - `cancelled` set on sender-initiated cancel (un-comment existing code path)
   - `rejected` set on validator's Reject action (NEW handler)
3. Backfill: `CREATED → draft`, `RECEIVED → received` if no result yet else `completed`, `CANCELED → cancelled`. Dead `SENT/FINISHED` rows shouldn't exist; if they do, map to `requested/completed` respectively.
4. The Box's existing `Reconciled` state is the box-level signal that all contained Referrals have reached `completed` or `rejected`. The Referral state machine and the Box state machine are joined at the Box.Reconciled transition (asserted, not auto-cascaded).

---

## 7. OGC-624 reconciliation — updated

OGC-624 (Inter-Lab Transfer & Subcontract) proposes a `subcontractStatus` field with `DRAFT → DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED`. Most of this is already covered by the Box's 9-state model. The redesign supersedes the state-field proposal.

**Reconciliation plan:**
- **Close OGC-624's state-model scope.** Code already written for `subcontractStatus` re-points at the unified `ReferralStatus` (now FHIR-aligned) on the sample side, and the existing 9-state box enum on the box side. Two clean state machines (Box logistics + Referral data state) — no third invented status field.
- **OGC-624's subcontract metadata panel** is already covered by Sample Shipment's destination/temperature/notes fields. Re-point.
- **OGC-624's outbound WhatsApp/email** integrates with OGC-589's notification infra. Lives on the Referral row's expand panel as a "Notify reference lab" action that fires the existing trigger.
- **OGC-624's inbound FHIR registration** — already covered by existing Incoming Orders behavior per Q3.
- **Coordinate with OGC-624's owner before any surgery.** Likely Herbert per memory; confirm during /breakdown.

---

## 8. Open risks

1. **Box.Reconciled definition is firm: received AND all samples accepted into the workflow.** Confirmed by Casey 2026-05-28. A Box cannot reach `Reconciled` until every contained Referral has been either accepted to its local Analysis (`Task.status = completed` + result reconciled) or formally rejected/cancelled. **The Referral feature explicitly drives the transition to Reconciled** — every Accept action on the Returned tab is a step toward closing a Box. The Sample Shipment UI may want to surface, on the Box detail, "N samples awaiting reconciliation in Reference Lab Results" with a deep link.

2. **Stuck Boxes are the real drift case.** A Box can sit at `Received` indefinitely if a peer never returns the DiagnosticReport. The Outstanding view's "Days outstanding" SLA timer is the primary signal. Risk: lab managers don't notice; need an aging banner on the Reference Lab Results page when there are >X stuck referrals.

3. **State-model migration is destructive.** Liquibase must be reversible. Migration tested on a copy of production. Pre-conditions and rollback block on the changeset are non-negotiable.

4. **Peer-OE state synchronization is async.** Peer's Task PUT to `received` may arrive before local `requested` write commits (race on first dispatch). Receive endpoint must idempotently accept the latest state regardless of order.

5. **A peer-rejected referral needs to put the original Analysis back into a workable state.** Today no such code path exists. Spec must define: which Analysis state does it return to (`not_started`? `in_progress`?), is the Refer Out flag retained, does the validator get notified.

6. **OGC-605 is in backlog.** If it doesn't land in the same sprint cluster as the Referral dashboard, v1 dashboard will only see referrals created via Result Entry. Acceptable; the empty/sparse state of the dashboard is fine.

7. **Bulk re-referral.** If a Reject sends the Analysis back, can the validator re-refer immediately? Yes, but to which lab — the same one (with a manual override) or a different one? FRS-level decision.

---

## 9. Out of scope for v1 (explicit)

- **All of Sample Shipment** — box creation, sample-to-box assignment, manifest generation, label printing, receiving workflow, non-conformity capture, facility registry, label preset admin, FHIR `SupplyDelivery` exchange. **Already shipped, not touched.**
- **Unassigned Samples tab** — already shipped at `/SampleShipment/unassigned`. Our work feeds it via OGC-605 (Order Entry refer-out path) and the Result Entry path.
- Source detection on Incoming Orders (Q3)
- Auto-accept inbound FHIR (Q3)
- Reference Lab admin redesign — already exists, reused
- Multi-test bulk dispatch as a single Referral (one-Analysis-per-Referral stays the invariant)
- Metrics/turnaround reports — separate Reports work, not the operational dashboard
- Mobile app for outstanding-test lookup
- Predictive alerts for aging referrals

---

## 10. What I need from you before I write the FRS

**Resolved by Casey 2026-05-28:**

- ✅ Three-surface decomposition (Outstanding / Returned / History)
- ✅ Lives under `/SampleShipment/*` as a SideNav submenu item, not a tab
- ✅ `Reconciled` = received AND all samples accepted into the workflow

**Remaining for FRS:**

- Default columns per filter state (§4.4) — open for tweaks
- Inline-row expand sections (§4.6) — open for tweaks
- Visual conventions to lift from the deployed Sample Shipment UI (§5)
- OGC-624 reconciliation plan (§7) — confirm OGC-624 owner before any ticket surgery in `/breakdown`

If no further pushback, I'll start the FRS.
