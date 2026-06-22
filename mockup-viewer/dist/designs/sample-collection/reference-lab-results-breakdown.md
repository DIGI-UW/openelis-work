# Reference Lab Results — Story Breakdown

**Mockup:** `referral-redesign-mockup.jsx`
**FRS:** `referral-redesign-frs.md`
**Total versions:** 3
**Total points:** 58
**Sprints required (estimate):** 3 × 2-week sprints

---

## Epic

**Title:** Reference Lab Results — Outstanding tests + result reconciliation
**Description summary:**
Adds a sample-level data-state tracking surface for referrals: dashboard for outstanding tests at reference labs, an inbox for returning DiagnosticReports awaiting validator acceptance, and a closed-referral history. Includes migration of `ReferralStatus` to FHIR Task-aligned states and wiring of the full Task lifecycle on both outbound and inbound paths. Complements the shipped Sample Shipment feature (which owns physical shipping logistics) by handling the per-sample data state between Box.Received and Box.Reconciled.

**Parent / linked program epic:** none — standalone Epic; coordinate with OGC-624 (in-progress) for state-model surgery
**Promote from:** OGC-796 (created 2026-05-28; promote to Epic on approval)
**Labels:** `referral`, `sample-shipment`, `fhir`, `madagascar`, `global`
**Folds in:** OGC-605, OGC-589 (their scope absorbed as child stories below)

---

## v1 — Read-only foundation + state-model migration

**Sprint target:** 20 points
**Actual:** 20 points
**Shippable slice:** Lab managers and validators can open Reference Lab Results, see what's outstanding at reference labs with how many days, **manually post results from non-OpenELIS reference labs via the existing Result Entry screen** (state advances automatically), browse a History of closed referrals, and mark stuck samples as Lost. State-model migration runs cleanly in the background. Auto-driven DiagnosticReport routing and Accept/Reject for peer OpenELIS labs lands in v2.

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| **S1.1 — Migrate ReferralStatus to FHIR Task states** | 5 | FR-MIG-001 through FR-MIG-005 | Liquibase changeset (with rollback + preConditions); Java enum update in `org.openelisglobal.referral.valueholder.ReferralStatus`; reference updates across `ReferralService`, `ReferralResultService`, `FhirReferralServiceImpl`, `ReferredOutTestsRestController`. i18n keys `referral.status.*` (8 keys per §6.4 of FRS). `audit_trail` plumbing for `REFERRAL_STATE_CHANGED` verb (writes start in v2 actions). Envers — no new entities. |
| **S1.2 — Scaffold Reference Lab Results page** | 5 | FR-PAGE-001/002/003/004, FR-METRIC-001/002/003, FR-FILTER-001/002/003/004 | New Spring controller + REST endpoint at `/SampleShipment/reference-lab-results`; React page shell with breadcrumb + h1; new SideNav submenu item under Sample Shipment (count-badge wired in v2 when Returned counts are non-zero); 4 metric tiles with clickable filter triggers; primary filter ChipSet; secondary filter row (Reference Lab dropdown from existing Organization Management, Date range, Priority MultiSelect, Days bucket Select); URL query-param deep-linkability; role attachment to existing Validator / Lab Manager / Admin (read-only for Analyst / Reception / Provider). i18n keys: `referral.page.title`, `referral.sidenav.*`, `referral.breadcrumb.*`, `referral.chip.*`, `referral.metric.*`, `referral.filter.*`. |
| **S1.3 — Outstanding DataTable + inline expand + Manual Entry path + Mark Lost** | 5 | FR-OUTSTANDING-001/002/003/004/005, FR-EXPAND-001/002/003/005/006, FR-FHIR-001 (manual-entry trigger row) | 9-column DataTable + actions column with server-side sort and pagination; inline row expansion (3-column panel: Original order context, Reference lab transit, Status detail); Activity log StructuredList. **Manual Entry path**: per-row **two-line "Enter result" Button** (visible, NOT in an overflow menu — see FR-OUTSTANDING-004) + expand-panel primary Button, both deep-link to `/result?sampleId=<labNumber>` (zero new UI — reuses existing Result Entry); server-side hook in `ResultService.create` / `LogbookResultsController` detects "save against open Referral" and advances `Task.status = completed`, sets `reconciled`, `reconciled_at`, `reconciled_by`, `manually_entered = true`, emits FHIR Task PUT, emits `audit_trail` `REFERRAL_RESULT_RECEIVED` with `source: manual`. Mark Lost button + modal + write path (expand-panel only). New columns on `referral`: `manually_entered` (Liquibase). i18n keys: column headers, expand-panel labels, `referral.action.enterResult`, `referral.tag.manuallyEntered`, Mark Lost modal copy. `audit_trail` verbs `REFERRAL_MARKED_LOST` and `REFERRAL_RESULT_RECEIVED`. |
| **S1.4 — History DataTable + inline expand** | 3 | FR-HISTORY-001/002/003 | 8-column DataTable; read-only inline expand (Outcome detail panel); reuses the activity-log component from S1.3. i18n keys: outcome labels, column headers. |
| **S1.5 — Aging banner + threshold seed** | 2 | FR-AGING-001/002/003 | Liquibase row insert: `unassigned_alert_config.referralStuckThresholdDays` default 7 (additive only; reuses existing config table from Sample Shipment); Carbon `InlineNotification kind="warning"` with count + "Filter to stuck only" action. i18n keys: `referral.banner.*`. |

---

## v2 — Result acceptance + DiagnosticReport routing

**Sprint target:** 20 points
**Actual:** 20 points
**Shippable slice:** When a result returns from a reference lab via FHIR `DiagnosticReport`, it appears in the Returned — needs action view. Validators can Accept (commits to local Analysis, advances to validation queue) or Reject (sends FHIR Task PUT with reason, re-opens local Analysis). State-machine drives Box.Reconciled correctly.

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| **S2.1 — Returned DataTable + result-card rendering** | 5 | FR-RETURNED-001/005, FR-EXPAND-004, FR-EXPAND-005.1 | 8-column DataTable; inline expand with result-card stack reading directly from FHIR `DiagnosticReport.Observation` resources (no schema additions); CRITICAL flag highlight; multi-test row support; SideNav count-badge now populates. i18n keys: result-card labels, returned-view column headers, critical-badge label. |
| **S2.2 — Receive-to-Analysis action (reception model) + per-test handling + Alerts hook** | 5 | FR-RETURNED-002, FR-RETURNED-002.1, FR-RETURNED-002.2, FR-RETURNED-004 | Reception (not revalidation): map `DiagnosticReport.Observation` → `Result` via existing `ResultService.create`; set Analysis status to **`validated`/released** (NOT `not_validated` — peer already validated); set `Referral.reconciled = true`, `reconciled_at`, `reconciled_by`; confirming `Task.status = completed`; per-test Accept + "Accept all results" shortcut on multi-test referrals; Box-detail "ready to close box" notification when last Referral resolves; "Open in Result Entry" deep link; **emit trigger into Alerts feature when peer-flag is Critical/Abnormal** (the Alerts feature owns the ack UX — this story only fires the trigger); identifier-mismatch exception (no exception queue UI in v1 — just an exception tag on the row). i18n keys: `referral.action.accept`, `referral.action.acceptToAnalysis`, `referral.action.acceptAll`, `referral.exception.identifierMismatch`. `audit_trail` verb `REFERRAL_RESULT_RECEIVED`. New columns on `referral`: `reconciled`, `reconciled_at`, `reconciled_by` (Liquibase) — Envers covers automatically via existing `@Audited`. **Dependency**: existing Alerts feature must accept inbound trigger payloads (confirm shape before build). |
| **S2.3 — Reject action + terminal-close + re-collection notification** | 5 | FR-RETURNED-003 | Reject modal (only destructive modal in this feature); Select pre-filled from peer's `Task.statusReason.text`; free-text TextArea (maxCount 500); FHIR PUT `Task.status = rejected`; **close original Analysis as terminal** with new status `rejected_by_reference_lab` (NEW Analysis status value — Liquibase seed); fire OGC-589 notification event `REFERRAL_REJECTED_NEEDS_RECOLLECTION` to requesting clinician; emit trigger into existing Alerts feature for lab-side ack. i18n keys: `referral.reject.*`. `audit_trail` verb `REFERRAL_RESULT_REJECTED` with reason in payload. New columns on `referral`: `reject_reason_code`, `reject_reason_text` (Liquibase). New Analysis status value via Liquibase. **Dependency**: OGC-589 must accept the new event type; existing Alerts feature must accept the lab-side trigger. |
| **S2.4 — DiagnosticReport inbound routing** | 5 | FR-FHIR-003 | New handler matches `DiagnosticReport.basedOn` → `Referral.fhirUuid` (ServiceRequest UUID); sets `Referral.diagnosticReportUuid` (NEW column — Liquibase); sets `Task.status = completed`; triggers Returned view surface; idempotent re-handling. `audit_trail` verb `REFERRAL_STATE_CHANGED` with `source=peer`. |

---

## v3 — Box integration + Order Entry hook + Inbound peer states

**Sprint target:** 20 points
**Actual:** 18 points (headroom: could absorb a 2-pt polish story, see Open Items)
**Shippable slice:** Refer-out can be declared at Order Entry Step 3 (OGC-605 lands). Sample Shipment Box detail surfaces referral-reconciliation status. Box can't be Reconciled until all contained Referrals are terminal. Peer reference labs can drive state transitions via FHIR Task PUTs. Outbound notification to reference labs (OGC-589 hook) wired.

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| **S3.1 — Box-to-Referral back link on Box detail** | 3 | FR-INT-001 | Small change to existing Sample Shipment Box detail page: new "Reference Lab Results" section listing Referral count grouped by Task status with deep link. Coordinate with Sample Shipment team. i18n keys: `referral.boxDetail.referralStatusSummary`. |
| **S3.2 — Box.Reconciled gate** | 2 | FR-INT-002 | Block Box transition to `Reconciled` if any contained Referral is non-terminal. Carbon `InlineNotification kind="error"` on existing Box transition UI. Coordinate with Sample Shipment team. i18n keys: `referral.box.cannotReconcileMessage`. |
| **S3.3 — Order Entry Step 3 Refer Out hook (OGC-605)** | 5 | FR-OE-001, FR-OE-002 | Per-test Refer Out checkbox on Step 3 of the 4-step Order Entry wizard; create Referral row at order save with `status = draft`; dedupe with Result Entry path on Analysis ID; feeds existing Unassigned Samples tab automatically via existing `referral_flag` on Sample. Coordinate with Order Entry team. Absorbs OGC-605. i18n keys: `orderEntry.step3.referOut.*`. |
| **S3.4 — Inbound peer Task state reads** | 5 | FR-FHIR-001 (received/in-progress/rejected portions), FR-FHIR-002 | New endpoint or extension accepts peer Task PUTs; updates local Referral for `received`, `in-progress`, `rejected` peer-driven transitions; idempotency + out-of-order latching per NFR-6. `audit_trail` verb `REFERRAL_STATE_CHANGED` with `source=peer` per transition. |
| **S3.5 — Notify reference lab action (OGC-589 integration)** | 3 | FR-624-002 (notify portion) | "Notify reference lab" button in expand panel; fires existing OGC-589 trigger with referral context; coordinate with notification team. Absorbs OGC-589. i18n keys: `referral.action.notifyReferenceLab`, `referral.notify.*`. |

---

## Coordination items (not stories — handle before/during /breakdown Jira creation)

- **OGC-624 state-field surgery.** Close OGC-624's `subcontractStatus` scope; re-point any in-progress code at the unified FHIR-aligned `ReferralStatus`. Coordinate with OGC-624's owner (likely Herbert per memory; **confirm before Jira surgery**). Other OGC-624 scope (subcontract metadata panel, shipment fields) is already covered by Sample Shipment, so most of OGC-624 just closes as superseded.
- **OGC-605 absorbed by S3.3.** Close OGC-605 on the new Epic creation; reopen if S3.3 slips out of v3.
- **OGC-589 absorbed by S3.5.** OGC-589's notification infra is the dependency; the trigger registration for `REFERRAL_OUT` event type lives in OGC-589's own deliverable. Confirm with the OGC-589 owner that the event type registration accommodates a "validator-initiated re-notify" use case (per S3.5).
- **OGC-796** is the Epic on creation. Description gets refreshed with this breakdown plan's link.

---

## Coverage check

- **Every FR from the FRS appears in at least one version:** ✅
  - All FR-PAGE-*, FR-METRIC-*, FR-FILTER-*, FR-OUTSTANDING-*, FR-EXPAND-* → v1
  - All FR-RETURNED-*, FR-FHIR-003 → v2
  - All FR-INT-*, FR-OE-*, FR-FHIR-001/002, FR-624-002 → v3
  - All FR-MIG-*, FR-AGING-* → v1
  - All FR-HISTORY-* → v1
  - FR-FHIR-004 (no peer-lab distinction) is a NON-action; documented in FRS §4.11, no story needed
- **Every UI element in the mockup gets built by at least one story:** ✅
  - Metric tiles, ChipSet, secondary filter row, Outstanding table, History table, expand panels, aging banner → v1
  - Returned table, result cards, Accept/Reject buttons, Reject modal → v2
- **All cross-cutting concerns assigned:**
  - i18n keys: ✅ (each story carries the keys it introduces)
  - Role attachment: ✅ (Validator / Lab Manager / Admin for write actions; existing bundles)
  - `audit_trail` entries: ✅ (5 verbs distributed across stories — `REFERRAL_STATE_CHANGED`, `REFERRAL_MARKED_LOST`, `REFERRAL_RESULT_ACCEPTED`, `REFERRAL_RESULT_REJECTED`, plus reserved `REFERRAL_LOST_REVERSED` which the existing Sample Shipment admin path will trigger)
  - Envers coverage: ✅ (no new entities; new columns auto-covered by existing `@Audited` on `Referral`)

---

## Open items (resolve before Jira creation OR during sprint planning, not blocking the plan)

1. **OGC-624 owner confirmation.** Reach out before Epic promotion / story creation.
2. ~~**Multi-test Accept behavior**~~ **Resolved 2026-05-28**: per-test with "Accept all results" shortcut. Folded into S2.2.
3. ~~**Re-refer prompt after Reject**~~ **Resolved 2026-05-28**: no re-refer prompt. Reject closes Analysis as terminal `rejected_by_reference_lab`; clinician notified via OGC-589 (`REFERRAL_REJECTED_NEEDS_RECOLLECTION`); lab-side ack via existing Alerts feature; new sample → new order → new Analysis through existing order-entry flow.
4. **Provider-role "own referrals only" scoping** (FRS §11.1). Probably 2 pts to wire correctly; not in any current story. Add to v3 or v4.
5. ~~**Reception vs revalidation model**~~ **Resolved 2026-05-28**: reception model. Returning results post directly as `validated`; critical-flag results emit a trigger into the existing Alerts feature for acknowledgment; identifier-mismatch routes to lightweight exception tag in v1.

---

## Stage 5 — Jira creation plan (run after your green light)

Order:
1. **Promote OGC-796 to Epic.** Update title to "Reference Lab Results — Outstanding tests + result reconciliation". Update description with link to this breakdown plan and the FRS gallery permalink. Add labels.
2. **For each v1 story (S1.1 – S1.5):** create as Issue Type = Story, set Epic Link = OGC-796, set Story Points (per table), add labels (Epic labels + `v1`), title format `Reference Lab Results: <story summary> (v1)`. Description uses `references/jira-template.md` with acceptance criteria tracing back to the listed FRs.
3. **For each v2 and v3 story:** same pattern with `v2` / `v3` labels.
4. **OGC-605 and OGC-589:** add comment linking to OGC-796 and S3.3 / S3.5 respectively; set "is part of" link; set status to Closed (Superseded) only after confirming with owners.
5. **OGC-624:** add comment with the state-model surgery plan; **do not close** until confirming with owner.
6. **Report back:** Epic key + counts of stories created per version + links.

---

## Summary

| Version | Points | Stories | Outcome |
|---|---|---|---|
| v1 | 20 | 5 | Read-only dashboard + history + state-model migration ships |
| v2 | 20 | 4 | Result acceptance/rejection ships; DiagnosticReport routing live |
| v3 | 18 | 5 | OGC-605 and OGC-589 absorbed; Box integration gated; peer-driven state machine complete |
| **Total** | **58** | **14** | **3 sprints** |

The plan respects: ≤20 points per version, thin shippable slice at every step, no forward dependencies, no backend-only versions, FRS stays version-agnostic.

**Awaiting your green light to create Jira tickets.** After approval I'll promote OGC-796 to Epic and create the 14 child Stories with labels and acceptance criteria.
