# S-09: Pre-Analytical Eligibility Gate & Resampling
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-16
**Status:** Draft for Review
**Jira:** OGC-TBD (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:**
- Sample Collection Redesign (COL-1..COL-12, QA-1..QA-6, DSH-1..DSH-9)
- NCE Dashboard & CAPA Management FRS
- NCE Results Entry Integration FRS (inline-form pattern, `source_type` / `trigger_action` / `sample_action`)
- S-01 Compliance Standards Administration (OGC-528)
- S-02 Sampling Site Registry (OGC-531)
- S-03 Environmental Order Entry (OGC-537)
- S-04 Sample Type Domain Classification (OGC-538)
- S-10 Sample Distribution & Analyst Assignment (pending)
- V-01 Vector Specimen Types & Taxonomy (OGC-555)
- Notification Admin (Email + TextIt SMS Integration)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. User Roles & Permissions
5. User Stories
6. Functional Requirements
   - 6.1 Order Status Model (Formalization)
   - 6.2 Step 4 — Eligibility Assessment (New QA Review Behavior)
   - 6.3 Accept Outcome
   - 6.4 Reject Outcome — NCE Integration
   - 6.5 Resample Sample Action
   - 6.6 Shipment-Level Batch Grouping
   - 6.7 Per-SampleType Acceptance Criteria Configuration
   - 6.8 Eligibility Worklist (Sidebar Entry Point)
   - 6.9 Vector CollectionLot Variant
   - 6.10 Lab-Unit Gate Behavior Configuration
   - 6.11 Analytics & Audit Data Contract
7. Data Model
8. API Endpoints
9. Navigation & Screen Inventory
10. Business Rules
11. Localization
12. Validation Rules
13. Security & Permissions
14. Acceptance Criteria
15. Appendix A — Cross-Reference to Parent Specs
16. Appendix B — Cross-Reference to SILNAS PRD

---

## 1. Executive Summary

S-09 formalizes the **pre-analytical eligibility gate** required by ISO 15189 §5.4, ISO 17025 §7.4, and the SILNAS PRD. Rather than introducing a new step in the Sample Collection Redesign's 4-step workflow, S-09 **extends Step 4 (QA Review)** to make its Approve/Reject decision the regulatory eligibility gate. This keeps the 4-step model intact, preserves the existing QA Officer role as the acceptance actor (reframed as "Specimen/Sample Receiver" in environmental/vector contexts via i18n), and reuses the Step 4 completeness dashboard, sample review table, inline Report NCE form, and Approve/Reject action bar that already exist in the redesign FRS.

S-09 is deliberately a thin orchestration layer. It adds one new screen (the **Eligibility Worklist**, a filtered shortcut into Step 4 for receivers working daily queues), one new NCE trigger point (`source_type: eligibility_assessment`, `trigger_action: eligibility_gate`), one new NCE sample action (**Resample** — a third radio option alongside the existing "Continue with NCE flag" and "Reject sample"), and formalizes the implicit status sequence (`IN_PROGRESS` → `PENDING_LABELING` → `PENDING_QA` → `ELIGIBLE` / `RETURNED_FROM_QA` / `PRE_ANALYTICAL_REJECTED*`) that the current redesign carries implicitly. Everything else — the Step 2 collector NCE, the Step 4 order-level NCE, the label printing pipeline, the NCE CAPA workflow, the notification admin — is reused unchanged.

The Arrival & Acceptance data (arrival date/time at lab, computed time-in-transit, receiving staff member) is split across the workflow to match physical reality: **Step 2 captures** arrival when a collected sample is physically received at the lab (via the existing "Received at Lab" fields in COL-2), and **Step 4 displays** the computed values as read-only context alongside the eligibility decision — so the QA officer sees transit-time breaches at the moment of review without re-entering data. QR label generation remains in Step 3 (Label & Store) as today; Step 4 Accept advances the order into `ELIGIBLE` status, which feeds S-10 Distribution. There is no behavior change to Step 3.

The **Resample** sample action is the one genuinely new piece of workflow. On commit it (1) marks the original sample `PRE_ANALYTICAL_REJECTED_RESAMPLING` (terminal for the original physical sample), (2) creates a **Resample Request** — a new order shell pre-populated from the original's site, compliance standard, sample types, tests, customer, and requester, parked at Step 1 in Draft state with a `resampled_from` link back to the original — and (3) notifies the original order's requester via the site's configured notification channel (email or TextIt SMS per the existing Notification Admin) including the original lab number, failure reason, and a deep link to the new Resample Request. When the resampled physical sample later arrives, it enters the workflow as a fresh order at Step 1 with `resampled_from` preserved for audit and analytics.

The gate applies uniformly to **clinical, environmental, and vector** sample domains via a lab-unit configuration (`Mandatory` / `Prompted` / `Disabled` per domain, mirroring the NCE trigger-behavior model). SILNAS configures `Mandatory` for all three domains; a clinical-only lab may configure `Prompted` for Clinical and rely on the Step 2 inline NCE for the main failure modes. For vector workflows, the gate operates on a **CollectionLot** (from V-01) rather than individual specimens within a pool — pool-specific criteria (size meets VectorSpecimenProfile minimum, desiccation absent, preservation medium appropriate, cold chain intact) augment the shared criteria library.

Downstream dependencies: S-10 consumes `ELIGIBLE` to populate its distribution worklist; S-06 Laporan Hasil reads the Step 4 Eligibility Assessment record for the "Sample Acceptance" block of the compliance certificate; S-07 Environmental Dashboard gains acceptance-rate, rejection-rate, resampling-rate, and median-transit-time tiles; V-02 Vector Collection Workflow inherits the gate for CollectionLot acceptance without further spec work.

---

## 2. Problem Statement

**Current state:** The Sample Collection Redesign provides two NCE entry points that partially cover pre-analytical quality:

1. **Step 2 Collect Sample — inline Report NCE (COL-4):** The field collector flags a sample as non-conforming at the moment of collection. This covers field-condition failures (patient vein collapse, wrong tube, missed draw).
2. **Step 4 QA Review — inline Report NCE (QA-3):** The QA officer reports an order-level or sample-level NCE during post-collection review, with scope selector (Specific Sample / Entire Order) and full NCE category/severity/description form.

Neither entry point is named "eligibility assessment" and neither is structured as a regulatory acceptance checkpoint with a criteria checklist derived from the SampleType's configured acceptance rules. Step 2 is collector-operated and typically occurs in the field or collection ward, not at the lab receipt bench. Step 4 approval/rejection exists but has no documented criteria framework — the QA officer inspects the sample and either clicks Approve or opens a Report NCE form with free-form fields.

**Regulatory context:**

- **ISO 15189:2022 §5.4.1** requires that laboratories establish documented procedures for the receipt, transport, and handling of primary samples, including criteria for acceptance or rejection.
- **ISO 15189:2022 §5.4.6** requires laboratories to record the date and time of primary sample receipt, the identity of the person receiving the sample, and any deviation from acceptance criteria.
- **ISO/IEC 17025:2017 §7.4.2** requires that test items be uniquely identified at receipt with records of receipt date, condition at receipt, and any deviations.
- **SILNAS PRD v0.5** (Environmental Module Table 11 rows 10–12; Vector Module Table 16 rows 10–11) specifies an explicit "Eligibility Test" step with Arrival Date/Time, Time Difference, Staff, Eligible/Non-Eligible decision, rejection reason, resampling outcome, and customer notification.

**Gap:** OpenELIS currently satisfies the regulatory requirements implicitly (the QA Officer role performs acceptance at Step 4, and the NCE system records rejections) but does not expose the checkpoint as a first-class named workflow state with:

1. A **per-SampleType criteria checklist** derived from configured acceptance rules (SOP transit window, volume range, temperature range, container requirements, label requirements) — so each sample type enforces the right rules.
2. A **queryable worklist** filtered to samples awaiting the gate decision — so receivers can work through daily queues without searching the full order dashboard.
3. A **Resample outcome** distinct from both "Continue with NCE flag" and "Reject sample" — so the common case of "sample unusable, ask field team to re-collect" is one commit rather than a reject-plus-manually-create-new-order dance.
4. A **formalized status** for the interim state between sample arrival and the gate decision — so dashboards, analytics, and SLAs can hang off it cleanly.
5. A **batch grouping affordance** for shared-cause rejections — cold chain break across an entire cooler is a single root cause, not 12 independent NCEs.

**Impact of not solving:** Labs running under ISO 15189 / 17025 cannot produce accreditation-grade pre-analytical audit records from OpenELIS without supplementary paper logs. Environmental and vector programs following the SILNAS model cannot implement the PRD's "Eligibility Test" step as written. Resampling loops require manual order creation with no data link between the rejected original and the resampled replacement, breaking acceptance-rate analytics.

**Proposed solution:** Extend Step 4 (QA Review) with a structured Eligibility Assessment section that (a) pre-populates a criteria checklist from the sample's SampleType acceptance rules, (b) displays the Step 2-captured arrival data (arrival time, transit duration) as read-only context with SOP-breach flagging, (c) offers Accept / Reject / Return-to-Step actions on the existing Step 4 action bar, and (d) on Reject opens the existing Step 4 inline Report NCE with `Category = Pre-Analytical` and `trigger_action = eligibility_gate` pre-populated, where the sample_action radio gains a third option (**Resample**) that creates a linked new order and notifies the customer. Add a sidebar Eligibility Worklist that deep-links into Step 4 filtered to `PENDING_QA`. Formalize the `PENDING_LABELING` / `PENDING_QA` / `ELIGIBLE` status sequence as documented values rather than implicit states. Configure the gate behavior per lab-unit and per-domain as `Mandatory` / `Prompted` / `Disabled`.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Make the Step 4 eligibility decision explicit and structured** — Replace the current free-form QA approve/reject with a criteria-checklist-driven decision while preserving the existing inline Report NCE for failures.
2. **Formalize the implicit status sequence** — `IN_PROGRESS` → `PENDING_LABELING` → `PENDING_QA` → `ELIGIBLE` / `RETURNED_FROM_QA` / `PRE_ANALYTICAL_REJECTED*` as documented, queryable statuses.
3. **Provide a worklist shortcut into Step 4** — A sidebar Eligibility Worklist filtered to `PENDING_QA` samples, sortable by arrival time, so receivers can work daily queues without searching the order dashboard.
4. **Extend the NCE sample-action model with Resample** — One commit rejects the original and creates a pre-populated new order for re-collection, with automatic customer notification.
5. **Configure acceptance criteria per SampleType** — The existing SampleType admin page gains a "Acceptance Criteria" accordion with SOP window, volume range, temperature range, container requirements, label requirements, each with severity mapping and recoverable-or-not flag.
6. **Support pool-level assessment for vector** — The gate operates on a CollectionLot with pool-specific criteria, not on individual specimens.
7. **Lab-unit-configurable gate behavior** — Per-domain `Mandatory` / `Prompted` / `Disabled` so each lab enforces the gate where regulatory requirements apply.
8. **Shipment-level batch grouping** — When multiple samples from the same logical shipment fail the same criterion, offer to group them into a single NCE (mirroring NCE Results Entry §7.3).
9. **Provide the data contract for downstream consumers** — S-10 Distribution, S-06 Laporan Hasil, S-07 Environmental Dashboard can read eligibility assessment data from a single documented API.

### 3.2 Non-Goals

1. **A new 5th step in the Sample Collection Redesign.** Step 4 expansion only; no new routable step.
2. **A new user role.** The QA Officer role absorbs the Specimen/Sample Receiver function; PRD-mandated "Specimen/Sample Receiver" label is applied via i18n in environmental/vector contexts.
3. **A new NCE entity or parallel rejection path.** Rejections flow through the existing NCE system with a new trigger_action; no data model duplication.
4. **Changes to Step 2 data capture.** Arrival time, received-at-lab timestamp, and receiving staff continue to be captured in Step 2 via the existing `Received at Lab` fields in COL-2. Step 4 displays these as read-only context.
5. **Changes to Step 3 label generation.** QR labels continue to generate in Step 3 (Label & Store) via the existing label configuration. Step 4 Accept does not re-trigger label generation.
6. **A new notification service.** Customer notifications on Resample/Reject use the existing Notification Admin (email + TextIt SMS).
7. **A new QR label design.** Reuses lab-configured label types from ORD-1a / LBL-2.
8. **Changes to clinical order-entry behavior unrelated to the gate.** Labs may configure the gate as `Disabled` for Clinical domain to preserve current behavior.
9. **Reworking the Reject→Return-to-Step flow.** QA-5's "Reject back to Step 1/2/3" behavior is preserved unchanged — that is a different decision from eligibility rejection and coexists on the Step 4 action bar.

---

## 4. User Roles & Permissions

### 4.1 Role Mapping

The PRD's **Specimen/Sample Receiver** role maps to the existing **QA Officer** role in the Sample Collection Redesign. No new role is introduced. The role's display label is i18n-configurable per workflow domain:

| Workflow Domain | Display Label (default) | i18n Key |
|---|---|---|
| Clinical | QA Officer | `role.qaOfficer.clinical` |
| Environmental | Specimen/Sample Receiver | `role.qaOfficer.environmental` |
| Vector | Specimen Receiver (Vector) | `role.qaOfficer.vector` |

### 4.2 Permission Keys

S-09 introduces four new permission keys that gate the eligibility-specific capabilities within Step 4. These are additive to existing `order.qa` permissions — a user with `order.qa` alone can view Step 4 but cannot commit eligibility decisions unless also granted `eligibility.*`.

| Permission | Description |
|---|---|
| `eligibility.view` | View the Eligibility Worklist sidebar entry and the Eligibility Assessment section on Step 4 |
| `eligibility.assess` | Commit Accept / Reject decisions on the eligibility assessment; implies `eligibility.view` |
| `eligibility.resample` | Select the Resample sample_action on rejection; implies `eligibility.assess` |
| `eligibility.reject` | Commit a Reject decision with rejection of the sample (no resample); implies `eligibility.assess` |

**Default role bundles:**

| Role | `order.qa` | `eligibility.view` | `eligibility.assess` | `eligibility.resample` | `eligibility.reject` |
|---|---|---|---|---|---|
| QA Officer | ✓ | ✓ | ✓ | ✓ | ✓ |
| Specimen/Sample Receiver (env/vector alias) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lab Technician | — | ✓ | — | — | — |
| Lab Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lab Administrator | ✓ | ✓ | ✓ | ✓ | ✓ |

### 4.3 Dependency on Existing Permissions

| Action | Required Permissions |
|---|---|
| View Step 4 QA Review screen | `order.qa` |
| View Eligibility Assessment section on Step 4 | `order.qa` + `eligibility.view` |
| Commit Accept decision | `order.qa` + `eligibility.assess` |
| Commit Reject with "Continue with NCE flag" | `order.qa` + `eligibility.assess` + `nce.report` |
| Commit Reject with "Reject sample" | `order.qa` + `eligibility.reject` + `nce.report` |
| Commit Reject with "Resample" | `order.qa` + `eligibility.resample` + `nce.report` + `order.enter` (to create the Resample Request) |
| Configure per-SampleType acceptance criteria | `sampleType.edit` |
| Configure lab-unit gate behavior | `labUnit.admin` |

---

## 5. User Stories

### 5.1 QA Officer / Specimen/Sample Receiver (primary actor)

- **US-1:** As a **QA Officer**, I want the existing Step 4 completeness dashboard (QA-1) to be augmented with a per-sample **Eligibility Assessment** section showing the SampleType's acceptance criteria as a checklist with pass/fail indicators, so that I have a structured decision surface rather than free-form approve/reject.

- **US-2:** As a **QA Officer**, I want the Eligibility Assessment section to display Step 2-captured arrival data (arrival date/time at lab, time-in-transit since collection, receiving staff member) as read-only context, with a clear breach indicator if transit time exceeded the SampleType's SOP window, so that I can evaluate transit-related criteria without re-entering data.

- **US-3:** As a **QA Officer**, when all criteria pass I want the existing Step 4 **Approve** button to commit the eligibility decision, write an `EligibilityAssessment` audit row, and advance status to `ELIGIBLE`, so that the Accept action is the same button I've always used — just with structured criteria preceding it.

- **US-4:** As a **QA Officer**, when any criterion fails I want the existing Step 4 **Report NCE** inline form (QA-3) to open pre-populated with `Category = Pre-Analytical`, severity auto-selected from the failing criterion's severity mapping, description auto-generated from the failing criteria list, and context banner showing arrival details + compliance standard (S-03) + sampling site (S-02), so that I use the same NCE design language the collector and QA officer already use.

- **US-5:** As a **QA Officer**, I want the NCE inline form's sample_action radio to include a third option — **Resample** — alongside "Continue with NCE flag" and "Reject sample," so that the common "sample unusable, ask field team to re-collect" case is one commit rather than two.

- **US-6:** As a **QA Officer**, when I commit a Resample decision I want the system to (a) mark the original sample `PRE_ANALYTICAL_REJECTED_RESAMPLING`, (b) create a new Resample Request order pre-populated from the original, and (c) notify the original requester via the configured channel (email/SMS) with a deep link to the new order — all in one action.

- **US-7:** As a **QA Officer**, I want a sidebar **Eligibility Worklist** under Sample Collection that deep-links into Step 4 filtered to `PENDING_QA`, sorted by arrival time ascending (oldest first), so that I can work through my daily receiving queue without searching the main order dashboard.

- **US-8:** As a **QA Officer**, I want to scan a QR code or enter a lab number from the worklist header to jump directly to Step 4 for that order, so that when a customer calls about a specific sample I can act on it immediately.

- **US-9:** As a **QA Officer**, when multiple samples from the same shipment fail the same criterion (e.g., cold chain break across 12 samples arriving in one cooler), I want the system to offer to group them into a single NCE (mirroring NCE Results Entry §7.3), so that I file one root-cause NCE instead of 12 identical ones.

- **US-10:** As a **QA Officer**, I want the existing Step 4 **Return to Step N** action (QA-5) to remain a distinct action from eligibility Reject, so that data-completeness returns (missing Step 1 patient info, missing Step 2 collection data) are handled separately from physical-integrity rejections.

### 5.2 Vector Program Coordinator

- **US-11:** As a **Vector Program Coordinator**, I want the eligibility gate to operate on an entire **CollectionLot** rather than per-specimen, so that a pool of 50 mosquitoes is assessed as one unit with one decision.

- **US-12:** As a **Vector Program Coordinator**, I want pool-specific criteria available in the checklist (pool size meets `VectorSpecimenProfile` minimum, desiccation absent, preservation medium appropriate, cold chain intact from field to lab), so that vector-specific integrity issues are first-class options rather than generic "container integrity" reasons.

- **US-13:** As a **Vector Program Coordinator**, I want the Eligibility Worklist to show trap type, collection-end date/time, and organism group alongside lab number, so that time-sensitive lots (live mosquitoes for virus isolation) are prioritizable over preserved lots.

### 5.3 Lab Manager / Quality Officer

- **US-14:** As a **Lab Manager**, I want eligibility-gate metrics (acceptance rate, rejection rate, resampling rate, median time-in-transit) exposed as tiles on the existing Environmental Dashboard (S-07) and as an aggregate row on the Lab Management Dashboard, so that pre-analytical quality is a visible KPI.

- **US-15:** As a **Quality Officer**, I want every Reject decision to appear in the NCE Dashboard's **Pre-Analytical** bucket with `trigger_action = eligibility_gate`, so that eligibility-gate rejections are trend-analyzable alongside other pre-analytical NCEs via the existing NCE analytics.

- **US-16:** As a **Quality Officer**, I want to configure per-SampleType acceptance criteria (which checks apply, SOP window in hours, required volume range, temperature range, each criterion's severity and recoverable-or-not flag) via the existing SampleType admin page, so that each sample type's rules live in one canonical admin surface.

### 5.4 Lab Administrator

- **US-17:** As a **Lab Administrator**, I want to configure the eligibility gate per lab-unit per `sampleDomain` (Clinical / Environmental / Vector / BOTH) as **Mandatory / Prompted / Disabled** — matching the NCE trigger-behavior model — so that labs can enforce the gate where ISO 15189/17025 require it and skip it where it's overhead.

- **US-18:** As a **Lab Administrator**, I want to grant the eligibility permission bundle (`eligibility.view`, `eligibility.assess`, `eligibility.resample`, `eligibility.reject`) to specific users via the RBAC management page, so that only trained staff can commit accept/reject decisions while the rest of the lab sees the worklist read-only.

### 5.5 Field Collector / Customer

- **US-19:** As a **Field Collector** (customer who submitted the sample), I want to receive an SMS or email when my sample is rejected or needs resampling — including the original lab number, the reason, and a link to the new Resample Request (if applicable) — so that I can schedule re-collection or investigate the cause without calling the lab.

- **US-20:** As a **Field Collector**, when I receive a resampling notification, I want the new collection order pre-populated with the original order's site, compliance standard, sample types, tests, customer, and requester so that my re-entry work is minimal.

### 5.6 Cross-Cutting

- **US-21:** As a **Lab Technician** working downstream, I want samples to remain invisible in my Distribution (S-10) and Testing worklists until they have passed the eligibility gate (`ELIGIBLE` status), so that I never accidentally test a sample that hasn't been formally accepted.

- **US-22:** As any **lab user**, I want the full Eligibility Assessment record (who, when, criteria evaluated, decision, any linked NCE, any linked Resample Request) visible in the sample's audit trail, so that chain-of-custody is reconstructible for accreditation audits.

- **US-23:** As a **Resample Request**, I want my originating sample's `resampled_from` link preserved through the full workflow, so that acceptance-rate analytics can distinguish first-attempt vs. resampled acceptances and track resampling loops (repeated failures of the same collection source).

---

## 6. Functional Requirements

### 6.1 Order Status Model (Formalization)

**ID:** ELIG-1-001
**Priority:** P0
**Requirement:**
The Order entity SHALL expose a documented `status` enum with the following values. Values marked "existing (implicit)" represent states the Sample Collection Redesign already carries without a documented name. Values marked "new" are introduced by S-09.

| Status | Origin | Description | Entered When | Display Label (i18n) |
|---|---|---|---|---|
| `DRAFT` | existing | Step 1 saved as draft per ORD-4 | Draft save on Step 1 | `status.draft` |
| `IN_PROGRESS` | existing (implicit) | Order created; Steps 1–3 not fully complete | Step 1 submit | `status.inProgress` |
| `PENDING_LABELING` | **new** | Step 2 saved with `received_at_lab` timestamp set; awaiting Step 3 | Step 2 save where sample has Received at Lab date | `status.pendingLabeling` |
| `PENDING_QA` | **new** | Step 3 complete; awaiting Step 4 eligibility assessment | Step 3 save | `status.pendingQA` (env/vector: `status.waitingForQC`) |
| `ELIGIBLE` | **new** | Step 4 Accept committed; ready for S-10 Distribution | Step 4 Accept commit | `status.eligible` |
| `RETURNED_FROM_QA` | existing | Step 4 rejected back to a prior step per QA-5 | Step 4 Return to Step N | `status.returnedFromQA` |
| `PRE_ANALYTICAL_REJECTED` | **new** | Step 4 Reject + "Reject sample" sample_action; terminal | Step 4 Reject commit, sample_action=reject | `status.preAnalyticalRejected` |
| `PRE_ANALYTICAL_REJECTED_RESAMPLING` | **new** | Step 4 Reject + "Resample" sample_action; terminal for original; Resample Request spawned | Step 4 Reject commit, sample_action=resample | `status.preAnalyticalRejectedResampling` |
| `NCE_FLAGGED` | existing (implicit) | Sample continues processing with an NCE flag per COL-4 / QA-3 "Continue with NCE flag" | NCE submit with sample_action=continue | no distinct label; displayed as current workflow status + NCE flag badge |
| `DISTRIBUTED` | existing (implicit) | S-10 Distribution commit | S-10 Distribution commit | `status.distributed` |
| `TESTING` | existing | Results entry in progress | Analyst opens in Results Entry | `status.testing` |
| `COMPLETE` | existing | Final validation and report release | Final validation commit | `status.complete` |

**Acceptance Criteria:**
- [ ] `Order.status` column on the orders table populated with the enum values above
- [ ] Migration backfills existing orders to the best-fit new status based on their step completion state
- [ ] Status transitions are enforced at the API layer — invalid transitions return HTTP 409
- [ ] Each status has an i18n key; environmental/vector contexts can display `status.waitingForQC` for `PENDING_QA` when configured
- [ ] The sample_action `continue` does not change the Order.status; it sets an NCE flag badge alongside existing status

---

**ID:** ELIG-1-002
**Priority:** P0
**Requirement:**
Status transitions SHALL follow the state diagram below. Transitions not listed are prohibited.

```
DRAFT ─────────────► IN_PROGRESS (on Step 1 submit)
IN_PROGRESS ───────► PENDING_LABELING (on Step 2 save with received_at_lab set)
IN_PROGRESS ───────► RETURNED_FROM_QA (on Step 4 Return to Step N where N=1)

PENDING_LABELING ──► PENDING_QA (on Step 3 save)
PENDING_LABELING ──► RETURNED_FROM_QA (on Step 4 Return to Step N where N=2)

PENDING_QA ────────► ELIGIBLE (on Step 4 Accept)
PENDING_QA ────────► PRE_ANALYTICAL_REJECTED (on Step 4 Reject, sample_action=reject)
PENDING_QA ────────► PRE_ANALYTICAL_REJECTED_RESAMPLING (on Step 4 Reject, sample_action=resample)
PENDING_QA ────────► PENDING_QA (on Step 4 Reject, sample_action=continue — NCE flag set, status unchanged)
PENDING_QA ────────► RETURNED_FROM_QA (on Step 4 Return to Step N)

RETURNED_FROM_QA ──► IN_PROGRESS / PENDING_LABELING / PENDING_QA (on re-save of the target step)

ELIGIBLE ──────────► DISTRIBUTED (on S-10 Distribution commit)

PRE_ANALYTICAL_REJECTED* ─ terminal (no outgoing transitions)
```

**Acceptance Criteria:**
- [ ] State diagram is the canonical reference for status-transition API validation
- [ ] Attempting an invalid transition returns HTTP 409 with a `ValidationError` indicating the current status and allowed transitions
- [ ] Terminal statuses cannot be reopened; a rejected order's re-collection creates a new Resample Request order, not a revival of the terminal order

---

### 6.2 Step 4 — Eligibility Assessment (New QA Review Behavior)

**ID:** ELIG-2-001
**Priority:** P0
**Requirement:**
The Step 4 QA Review screen SHALL be extended with an **Eligibility Assessment** section positioned above the existing Sample Review table (QA-2) and below the existing Completeness Dashboard (QA-1). The section has three sub-regions per sample, rendered as a Carbon `Tile` with a blue left border (`--cds-blue-60`):

1. **Arrival & Transit Context** (read-only): Arrival date/time at lab (from Step 2 `received_at_lab`), time-in-transit since collection (computed: `received_at_lab - collection_date_time`), receiving staff member (from Step 2 `received_by`), SOP transit window for the SampleType (from admin config), breach indicator (red `InlineNotification` if actual transit exceeds SOP window).
2. **Criteria Checklist**: Pre-populated from the SampleType's configured acceptance criteria (see 6.7). Each criterion is a row with: criterion label (e.g., "Container integrity intact"), pass/fail toggle (Carbon `Toggle`), optional note textfield, and a severity tag inherited from the SampleType config. Default state is all criteria unchecked (awaiting officer assessment). A criterion may be marked "auto-pass" when the SampleType config specifies computed validation (e.g., SOP transit window check is auto-computed from Arrival & Transit Context; the toggle is pre-set to pass/fail and is read-only).
3. **Compliance Context** (read-only): Compliance standard name + regulation number (from S-03 `complianceContext`), sampling site code + name (from S-02), SampleType name and domain (Clinical / Environmental / Vector). Displayed as small tags/badges.

**Acceptance Criteria:**
- [ ] Eligibility Assessment section appears on Step 4 only when the lab-unit gate behavior is `Mandatory` or `Prompted` for the order's SampleType domain (see 6.10)
- [ ] Section hidden when gate is `Disabled` for the domain
- [ ] Arrival & Transit Context displays values from Step 2; if `received_at_lab` is null, shows `InlineNotification` (kind="warning") "Sample has not been recorded as received at lab; return to Step 2 to capture receipt"
- [ ] Transit breach indicator appears as red `InlineNotification` when `(now - collection_date_time) > SampleType.sopTransitHours` at render time, OR when `received_at_lab - collection_date_time > SampleType.sopTransitHours`
- [ ] Criteria checklist renders one row per configured criterion for the SampleType
- [ ] Auto-pass criteria render as read-only pass/fail with a lock icon
- [ ] Each criterion row has a note textfield (placeholder: "Optional — note any observed condition")
- [ ] Severity tag color-coded per Carbon scale (Critical=red, Major=orange, Minor=amber)
- [ ] Compliance Context shows standard, site, sample type, domain; hidden rows for clinical orders without standard/site

---

**ID:** ELIG-2-002
**Priority:** P0
**Requirement:**
The existing Step 4 action bar (QA-5 Approve / Reject / Return to Step) SHALL be extended with eligibility-aware behavior:

- **Approve button:** Enabled only when all criteria are marked pass (or auto-pass). Label changes to "Accept" when the gate is `Mandatory` for the order's domain; otherwise remains "Approve". Commits the eligibility decision per 6.3.
- **Report NCE button (QA-3):** Always enabled. When any criterion is marked fail, the button auto-pre-populates the NCE form per 6.4 when clicked. When no criterion is marked fail, the button opens a blank NCE form as today.
- **Return to Step N (QA-5):** Unchanged. Still available as a distinct action for data-completeness returns (not for eligibility rejection).

**Acceptance Criteria:**
- [ ] Approve/Accept button disabled when any criterion is unchecked or marked fail
- [ ] Approve/Accept button tooltip when disabled: "All criteria must be marked pass before accepting"
- [ ] Button label toggles between "Accept" (when gate=Mandatory) and "Approve" (otherwise) per domain
- [ ] Report NCE button remains in action bar position matching existing QA-3 design
- [ ] Return to Step N action remains functional and distinct
- [ ] Clicking Approve/Accept with unchecked criteria shows a warning modal: "Some criteria are not marked pass. Commit anyway? This will be recorded as an override."

---

**ID:** ELIG-2-003
**Priority:** P1
**Requirement:**
The Step 4 completeness dashboard (QA-1) SHALL be extended with an "Eligibility" indicator per sample, summarizing the criteria checklist state:

| Indicator State | Condition |
|---|---|
| Green ✓ "All criteria pass" | All criteria marked pass or auto-pass |
| Red ✗ "N criteria failed" | One or more criteria marked fail |
| Gray – "Not yet assessed" | One or more criteria unchecked |
| Yellow ⚠ "Transit window exceeded" | SOP window breach (regardless of criteria state) |

**Acceptance Criteria:**
- [ ] Each sample row in the completeness dashboard includes an Eligibility column
- [ ] Indicator icon and text match the states above
- [ ] Clicking the indicator scrolls the page to the corresponding sample's Eligibility Assessment section
- [ ] Indicator hidden when gate is `Disabled` for the domain

---

### 6.3 Accept Outcome

**ID:** ELIG-3-001
**Priority:** P0
**Requirement:**
On Step 4 Approve/Accept commit (when all criteria pass or the override modal is confirmed), the system SHALL:

1. Create an `EligibilityAssessment` audit row with: order ID, sample ID, decision=`ACCEPTED`, criteria snapshot (criterion IDs + pass state + notes at commit time), assessor user ID, commit timestamp, arrival timestamp, transit duration.
2. Transition order status `PENDING_QA → ELIGIBLE`.
3. Emit an `OrderStatusChanged` event consumable by S-10 Distribution, S-07 Dashboard, and audit trail viewers.
4. Navigate the user back to the Eligibility Worklist (if entered from there) or to the order dashboard (if entered from elsewhere), with a success toast: "Sample {labNumber} accepted. Status: Eligible."

**Acceptance Criteria:**
- [ ] `EligibilityAssessment` row persisted in a single transaction with the status change
- [ ] If any criterion was overridden (fail state accepted), the `EligibilityAssessment.override` flag is true and the override justification text is persisted
- [ ] Override commit requires a free-text justification (min 10 chars)
- [ ] `OrderStatusChanged` event published with old/new status
- [ ] Success toast displays lab number and new status
- [ ] No QR label generation triggered — Step 3 Label & Store already handled labels before arrival at Step 4

---

**ID:** ELIG-3-002
**Priority:** P1
**Requirement:**
When Accept is committed on an order whose samples include at least one linked NCE with sample_action=`continue` (NCE-flagged), the success toast SHALL note the NCE flag persists: "Sample {labNumber} accepted with {N} active NCE flag(s). Status: Eligible."

**Acceptance Criteria:**
- [ ] NCE flag count displayed in toast when > 0
- [ ] Active NCEs (not in Closed – Verified status) remain flagged on the sample downstream
- [ ] Accept does not close or modify linked NCEs

---

### 6.4 Reject Outcome — NCE Integration

**ID:** ELIG-4-001
**Priority:** P0
**Requirement:**
When the QA Officer clicks **Report NCE** on Step 4 while one or more criteria are marked fail, the system SHALL open the existing Step 4 inline Report NCE form (QA-3 pattern) pre-populated as follows:

| Field | Auto-Populated Value | Source |
|---|---|---|
| Scope | "Specific Sample" | The sample whose criteria failed; grouping offer in 6.6 may escalate to multiple samples |
| Category | "Pre-Analytical" | Hardcoded for eligibility_gate trigger |
| Subcategory | Mapped from the highest-severity failing criterion | SampleType criterion config |
| Severity | Highest severity among failing criteria | SampleType criterion config |
| Title | Auto-generated: "Eligibility gate failure: {count} criteria failed" | Computed |
| Description | Auto-generated bulleted list of failing criteria with notes: "• Container integrity intact: FAIL — seal broken\n• Temperature range: FAIL — 25°C (expected 2-8°C)" | Computed from checklist state |
| Sample Action | "Reject sample" (default for non-recoverable criteria) OR "Resample" (default when all failing criteria have `recoverable=true` in config) | Computed from criterion config |
| Linked Items | Auto-linked: sample, parent order, compliance standard (if env), sampling site (if env) | Context |

The form's **Context Banner** (per NCE Results Entry §3.2) SHALL be augmented with:

```
📌 CONTEXT — ELIGIBILITY GATE
   Lab #: {labNumber} · Sample Type: {sampleTypeName} · Domain: {domain}
   Arrival: {arrivalDateTime} · Transit: {transitDuration} (SOP: {sopWindow}h)
   Site: {siteCode} – {siteName} (env/vector only)
   Standard: {standardName} (env only)
   Failing Criteria: {criterionLabel1}, {criterionLabel2}, ...
```

The NCE record written on submit SHALL include:

- `source_type`: `"eligibility_assessment"` (new)
- `trigger_action`: `"eligibility_gate"` (new)
- `trigger_type`: `"mandatory"` when gate=Mandatory, else `"prompted"`
- `failing_criteria_snapshot`: JSON array of criterion IDs and notes at submit time

**Acceptance Criteria:**
- [ ] Form opens inline below the Sample Review row matching existing QA-3 pattern
- [ ] Warm cream background + orange top border matching NCE inline form design
- [ ] Context banner additions render correctly per domain (env/vector show standard & site; clinical omits)
- [ ] Pre-populated fields are editable by the officer
- [ ] Description auto-generation escapes user input safely
- [ ] NCE `source_type` and `trigger_action` fields persisted for analytics
- [ ] `failing_criteria_snapshot` persisted for audit reconstruction

---

**ID:** ELIG-4-002
**Priority:** P0
**Requirement:**
The sample_action radio on the NCE inline form SHALL be extended with a third option — **Resample** — in addition to the existing "Continue with NCE flag" and "Reject sample". The three options are:

| Option | Description | i18n Key |
|---|---|---|
| Continue with NCE flag | Record NCE but continue processing the sample. Status unchanged; NCE flag badge added. | `label.nce.sampleAction.continue` |
| Reject sample | Record NCE and mark sample `PRE_ANALYTICAL_REJECTED`. Terminal for this sample. No re-collection scheduled. | `label.nce.sampleAction.reject` |
| **Resample** (new) | Record NCE, mark sample `PRE_ANALYTICAL_REJECTED_RESAMPLING`, spawn a Resample Request (see 6.5), and notify the customer. | `label.nce.sampleAction.resample` |

The Resample option SHALL be:

- Visible always when the user has `eligibility.resample` permission
- Default-selected when all failing criteria have `recoverable=true` in the SampleType config
- Disabled with tooltip "Field re-collection not applicable for this failure type" when all failing criteria have `recoverable=false`

**Acceptance Criteria:**
- [ ] Third radio option "Resample" added to the NCE inline form sample_action selector
- [ ] Option labeled per i18n key `label.nce.sampleAction.resample`
- [ ] Description: "Reject this sample and automatically create a new collection order for re-collection. The customer will be notified."
- [ ] Default selection computed from failing criteria recoverable flags
- [ ] Option hidden entirely when user lacks `eligibility.resample` permission
- [ ] Disabled state tooltip rendered when `recoverable=false`
- [ ] Existing NCE pages (Results Entry, Validation) are unaffected — Resample only appears for NCEs originating from `source_type=eligibility_assessment`

---

**ID:** ELIG-4-003
**Priority:** P0
**Requirement:**
On NCE submit with sample_action=`reject`:

1. NCE record is created per standard NCE flow (category=Pre-Analytical, linked to sample/order)
2. Sample status transitions `PENDING_QA → PRE_ANALYTICAL_REJECTED` (terminal)
3. All tests on the order associated with that sample are cancelled (existing NCE reject-sample behavior)
4. Customer notification is sent per 6.5.3 (without Resample Request link)
5. Success toast: "Sample {labNumber} rejected. NCE {nceNumber} created."
6. User is returned to the Eligibility Worklist

**Acceptance Criteria:**
- [ ] Status transition occurs in same transaction as NCE creation
- [ ] Pending tests on the rejected sample are cancelled
- [ ] Customer notification sent (or queued if service unavailable, with retry)
- [ ] Toast displays both lab number and NCE number

---

### 6.5 Resample Sample Action

**ID:** ELIG-5-001
**Priority:** P0
**Requirement:**
On NCE submit with sample_action=`resample`:

1. NCE record is created per standard flow
2. Original sample status transitions `PENDING_QA → PRE_ANALYTICAL_REJECTED_RESAMPLING` (terminal)
3. A **Resample Request** (new order) is spawned per 6.5.2
4. Customer notification is sent per 6.5.3 with the Resample Request deep link
5. Success toast: "Sample {labNumber} rejected. NCE {nceNumber} created. Resample Request {newLabNumber} queued."
6. User is returned to the Eligibility Worklist

**Acceptance Criteria:**
- [ ] All four state changes (NCE, status, Resample Request, notification) occur atomically per 6.5.4
- [ ] Toast displays original lab number, NCE number, and new Resample Request lab number

---

**ID:** ELIG-5-002
**Priority:** P0
**Requirement:**
The Resample Request SHALL be a new Order entity created via the existing Step 1 order creation API, pre-populated from the original rejected order with the following field mapping:

| Resample Request Field | Source (Original Order) |
|---|---|
| `resampled_from_order_id` | Original order ID (new column) |
| `resampled_from_nce_id` | The NCE that triggered the resample (new column) |
| `status` | `DRAFT` |
| `workflow_type` | Copied from original |
| `sampling_site_id` | Copied from original (env/vector) |
| `compliance_standard_id` | Copied from original (env) |
| `compliance_standard_version` | Copied from original (env) |
| `customer_id` | Copied from original |
| `requester_id` | Copied from original |
| `program_id` | Copied from original |
| `tests` | Copied from original (all tests that were on the rejected sample's Requested Tests list) |
| `sample_types` | Copied from original (same types as the rejected sample) |
| `collection_method` | Copied from original (env) |
| `priority` | Copied from original |
| `lab_number` | NOT copied — fresh lab number generated per lab rules |

The Resample Request is parked in `DRAFT` state and appears in the "My Drafts" list of the **requester** (not the QA officer), so the original customer/collector can review and proceed with field re-collection.

**Acceptance Criteria:**
- [ ] Resample Request created with all fields above populated
- [ ] Fresh lab number generated; original lab number preserved as `resampled_from` reference
- [ ] Status is `DRAFT`
- [ ] Requester sees the draft in their draft list
- [ ] Opening the Resample Request shows a banner: "This is a resample of Lab #{originalLabNumber}. See NCE {nceNumber} for rejection reason."
- [ ] Deep link `resampled_from_order_id` is navigable from the new order's detail view
- [ ] Original rejected order's detail view shows a bidirectional link: "Resample Request created: Lab #{newLabNumber}"

---

**ID:** ELIG-5-003
**Priority:** P0
**Requirement:**
On Resample or Reject sample_action commit, the system SHALL send a notification to the original order's requester via the lab's configured notification channel (per the existing Notification Admin configuration — email, TextIt SMS, or both). The notification content SHALL include:

| Field | Value (Reject) | Value (Resample) |
|---|---|---|
| Subject / Header | "Sample rejected: Lab #{originalLabNumber}" | "Resampling required: Lab #{originalLabNumber}" |
| Body | Rejection reason (from NCE description); failing criteria list; link to original order detail | Rejection reason; failing criteria list; link to new Resample Request ({newLabNumber}); instruction: "Please schedule re-collection at your earliest convenience" |
| Action Link | Original order detail URL | New Resample Request detail URL |

Template text is i18n-configurable per language and per channel (SMS vs. email).

**Acceptance Criteria:**
- [ ] Notification queued via existing Notification Admin service on NCE submit
- [ ] Notification channel (email/SMS/both) determined by requester's contact preferences + lab config
- [ ] Email notification includes both subject and body
- [ ] SMS notification includes abbreviated body with shortened URL
- [ ] Both include deep link (original or new order) as clickable action
- [ ] Template text uses i18n keys: `notification.eligibility.reject.*` and `notification.eligibility.resample.*`
- [ ] Notification send failures are logged and retried per existing Notification Admin retry policy
- [ ] Audit trail includes notification send attempts (success and failure)

---

**ID:** ELIG-5-004
**Priority:** P0
**Requirement:**
The Resample commit SHALL be transactional: all four operations (NCE creation, status transition, Resample Request creation, notification queueing) SHALL succeed together or all SHALL roll back. If any step fails, the officer sees an error toast and the original sample remains in `PENDING_QA`.

**Acceptance Criteria:**
- [ ] Single database transaction covers NCE, status, Resample Request
- [ ] Notification queueing is transactional with the database commit (outbox pattern or equivalent)
- [ ] Failure rolls back all changes
- [ ] Error toast is descriptive: "Resample failed: {reason}. No changes were made. Please retry or contact support."

---

### 6.6 Shipment-Level Batch Grouping

**ID:** ELIG-6-001
**Priority:** P1
**Requirement:**
When the QA Officer commits a Reject on a sample and there are **other samples in `PENDING_QA` status that share the same root-cause signal**, the system SHALL offer to group them into the same NCE (mirroring NCE Results Entry §7.3).

Root-cause signals for grouping:

| Signal | Condition |
|---|---|
| Shipment ID match | Samples share a shipment identifier (if captured at Step 2) |
| Transit cooler match | Samples share a cooler/container identifier (if captured at Step 2) |
| Cold chain break | Temperature criterion failed AND arrival-time proximity < 2 hours |
| Receiving staff + arrival time window | Same receiver, same arrival date, arrival time within 15 minutes |

When at least one other sample matches a grouping signal, the submit button on the NCE inline form SHALL display a grouping offer banner:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔗 OTHER SAMPLES MATCH THIS ROOT CAUSE                                  │
│                                                                          │
│ 3 other samples arriving in the same shipment may share this failure:   │
│ • Lab #ENV-2026-00124 (Water — Surface)                                 │
│ • Lab #ENV-2026-00125 (Water — Ground)                                  │
│ • Lab #ENV-2026-00126 (Water — Surface)                                 │
│                                                                          │
│ [ ] Include these samples in the same NCE                               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Grouping offer banner appears when at least one other sample matches a signal
- [ ] Banner lists each candidate sample with lab number and sample type
- [ ] Checkbox defaults unchecked; officer opts in
- [ ] When checked, submit commits a single NCE linked to all selected samples and applies the same sample_action to each
- [ ] Each grouped sample gets an independent Resample Request (if sample_action=resample) — they are separate physical samples that each need their own re-collection
- [ ] Audit trail links all grouped samples to the shared NCE
- [ ] Toast reflects group: "Sample {labNumber} and 3 others rejected under NCE {nceNumber}."

---

### 6.7 Per-SampleType Acceptance Criteria Configuration

**ID:** ELIG-7-001
**Priority:** P0
**Requirement:**
The existing SampleType admin page (OGC-296 / S-04) SHALL be extended with an **Acceptance Criteria** accordion when the SampleType's `sampleDomain` is Clinical, Environmental, or Vector. The accordion contains:

| Field | Type | Required | Notes |
|---|---|---|---|
| SOP Transit Window (hours) | NumberInput | Yes | Max allowed elapsed time from collection to receipt |
| Criteria List | Repeatable row editor | Yes | At least one criterion |
| Severity Mapping | Per-criterion (Critical / Major / Minor) | Yes | Used to pre-populate NCE severity on rejection |
| Recoverable Flag | Per-criterion (boolean) | Yes | Controls Resample availability as default sample_action |
| Auto-Compute Rule | Per-criterion (enum: none, transit_window, temperature_range, volume_range) | No | If set, the criterion is evaluated automatically from Step 2 data |

Each criterion row contains:

- **Label** (text, i18n key): e.g., "Container integrity intact"
- **Description** (textarea, optional): Helper text shown to receiver
- **Severity** (radio: Critical / Major / Minor)
- **Recoverable** (checkbox): If checked, Resample is a valid sample_action for this failure
- **Auto-Compute Rule** (select): `none` (manual only), `transit_window` (auto-fail if arrival > SOP window), `temperature_range` (auto-fail if captured temp outside range), `volume_range` (auto-fail if volume below minimum)
- **Subcategory Mapping** (select, NCE subcategory): What NCE subcategory this criterion failure maps to

**Default criteria library** ships with the system and can be reused across SampleTypes:

| Default Criterion | Severity | Recoverable | Auto-Compute |
|---|---|---|---|
| Container integrity intact | Major | Yes | none |
| Label legibility | Minor | Yes | none |
| Sample volume sufficient | Major | Yes | volume_range |
| Temperature within range | Critical | Yes (if cold chain re-collection feasible) | temperature_range |
| SOP transit window met | Major | Yes (if collection source available) | transit_window |
| Chain-of-custody form present | Major | No (paperwork remediation, not re-collection) | none |
| Biohazard disposal requirements met | Critical | No | none |

**Acceptance Criteria:**
- [ ] Acceptance Criteria accordion appears on SampleType admin for Clinical/Environmental/Vector domains
- [ ] SampleTypes can inherit from the default criteria library and override per-criterion values
- [ ] SOP Transit Window is required for environmental/vector; optional for clinical
- [ ] Auto-compute rules are enforced at the API layer when Step 4 loads; computed pass/fail cannot be manually overridden without an override justification
- [ ] Adding/removing criteria is a soft change — existing `PENDING_QA` orders retain the criteria set that was active when they entered Step 4
- [ ] Each criterion has an i18n key for label and description

---

**ID:** ELIG-7-002
**Priority:** P1
**Requirement:**
Vector SampleTypes (sampleDomain=VECTOR) SHALL inherit additional pool-specific default criteria:

| Vector Default Criterion | Severity | Recoverable | Auto-Compute |
|---|---|---|---|
| Pool size meets VectorSpecimenProfile minimum | Major | Yes | pool_size (new rule) |
| Desiccation absent | Critical | Yes (if trap still active) | none |
| Preservation medium appropriate | Major | No (remediation via lab preservation) | none |
| Specimens not damaged (pool integrity) | Major | Yes | none |

The `pool_size` auto-compute rule reads `CollectionLot.pool_size` and compares to the SampleType's `VectorSpecimenProfile.default_pool_size` minimum.

**Acceptance Criteria:**
- [ ] Vector default criteria added to the default library with `organism_group` tag for applicability filtering
- [ ] `pool_size` auto-compute rule implemented
- [ ] Admin can adjust per-SampleType

---

### 6.8 Eligibility Worklist (Sidebar Entry Point)

**ID:** ELIG-8-001
**Priority:** P0
**Requirement:**
The sidebar Sample Collection submenu SHALL include a new item: **Eligibility Worklist**. Position: after "QA Review" in the submenu, under the "Add Order" parent. The menu item is gated by `eligibility.view` permission.

Clicking the menu item navigates to `/order/eligibility-worklist`, which renders a filtered view of the order dashboard with the following characteristics:

- **Filter:** `status = PENDING_QA` (hardcoded, not editable by user)
- **Default sort:** `received_at_lab` ascending (oldest first — longest-waiting samples at top)
- **Columns (in order):**
  1. Lab Number
  2. Sample Type + Domain badge (Clinical / Environmental / Vector colored tag)
  3. Received At (date/time, with relative "N hours ago")
  4. Transit Duration (with red breach indicator if exceeded)
  5. Customer / Site (patient name for clinical; site code+name for env; trap + collection date for vector)
  6. Compliance Standard (env only)
  7. Priority
  8. Action button: "Assess" (primary, teal; opens Step 4 scrolled to Eligibility Assessment)

- **Header controls:**
  - Lab Number scan/search bar (per NAV-6) — scanning routes to Step 4 for that order
  - Domain filter chips (All / Clinical / Environmental / Vector)
  - Receiving-staff filter (defaults to "All"; can be set to "My receipts" to show only samples the current user received at Step 2)
  - Export CSV button (exports current filtered view per DSH pattern)

**Acceptance Criteria:**
- [ ] Sidebar menu item added under Sample Collection / Add Order parent
- [ ] Menu item hidden for users without `eligibility.view` permission
- [ ] Worklist loads within 2 seconds for up to 500 PENDING_QA orders
- [ ] Default sort is oldest first by received_at_lab
- [ ] Transit breach indicator renders in red when transit exceeds SOP window for the SampleType
- [ ] Domain filter chips persist selection within session
- [ ] Scan bar routes to Step 4 scrolled to Eligibility Assessment section
- [ ] "Assess" action routes to Step 4 scrolled to the sample's Eligibility Assessment section

---

**ID:** ELIG-8-002
**Priority:** P1
**Requirement:**
The Eligibility Worklist SHALL display summary tiles at the top of the page:

| Tile | Value |
|---|---|
| Awaiting Assessment | Count of orders in `PENDING_QA` |
| SOP Breaches | Count where transit duration > SOP window |
| Oldest Waiting | Time-in-queue of the oldest order (e.g., "3h 42m") |
| My Receipts | Count received at lab by current user (clickable to filter) |

Tiles use the Carbon `SummaryCard` pattern matching the NCE Dashboard summary cards.

**Acceptance Criteria:**
- [ ] Tiles render above the worklist table
- [ ] Counts update in real-time (or on page refresh with `< 5s` staleness)
- [ ] "SOP Breaches" tile uses red accent color
- [ ] Tiles are keyboard-navigable per XC-6

---

### 6.9 Vector CollectionLot Variant

**ID:** ELIG-9-001
**Priority:** P0
**Requirement:**
For orders whose primary subject is a **CollectionLot** (SampleType.sampleDomain=VECTOR per V-01), the Eligibility Assessment operates on the CollectionLot as a single unit rather than on individual `VectorSpecimen` records within the lot. The Step 4 screen SHALL:

1. Display CollectionLot-specific context in place of the standard sample context: trap type, collection start/end date/time, pool flag, pool size, collector name, weather conditions, target organism group
2. Load vector-specific default criteria (per 6.7.2) in addition to the SampleType's base criteria
3. Evaluate the `pool_size` auto-compute rule against `CollectionLot.pool_size`
4. On Reject + Resample, spawn a Resample Request where the "sample" is a new CollectionLot linked to the same trap type, site, and SampleType — not a patient-style sample

**Acceptance Criteria:**
- [ ] Step 4 detects CollectionLot orders via `SampleType.sampleDomain = VECTOR`
- [ ] Vector context block replaces clinical/environmental context block
- [ ] Pool size auto-compute rule evaluates correctly
- [ ] Resample Request for vector creates a new order with CollectionLot shell, not a Sample shell

---

### 6.10 Lab-Unit Gate Behavior Configuration

**ID:** ELIG-10-001
**Priority:** P0
**Requirement:**
The Lab Unit admin settings (CFG-1 in Sample Collection Redesign) SHALL be extended with an **Eligibility Gate Behavior** sub-section. For each supported `sampleDomain`, the admin configures one of three behaviors:

| Behavior | Step 4 Behavior | Enforced By |
|---|---|---|
| **Mandatory** | Eligibility Assessment section appears; Accept button disabled until all criteria pass (with override available); gate is regulatory-required | Default for Environmental and Vector; per-lab for Clinical |
| **Prompted** | Eligibility Assessment section appears; Accept button always enabled; criteria are advisory | Optional per lab |
| **Disabled** | Eligibility Assessment section hidden; Step 4 behaves as per the unmodified Sample Collection Redesign | For labs without regulatory gate requirements |

The configuration is per lab-unit per domain:

```
Lab Unit: Main Clinical Lab
  ├── Clinical: Mandatory / Prompted / [Disabled]   ← default: Disabled
  ├── Environmental: [Mandatory] / Prompted / Disabled   ← default: Mandatory
  └── Vector: [Mandatory] / Prompted / Disabled   ← default: Mandatory
```

**Acceptance Criteria:**
- [ ] Lab Unit admin page includes Eligibility Gate Behavior config per domain
- [ ] Defaults applied on migration: Environmental=Mandatory, Vector=Mandatory, Clinical=Disabled
- [ ] Changing behavior affects new orders entering Step 4 immediately; in-flight orders retain behavior that was active when they entered PENDING_QA
- [ ] Labs configured as "Both" domain in their Workflow Type see both Clinical and Environmental behavior configs

---

### 6.11 Analytics & Audit Data Contract

**ID:** ELIG-11-001
**Priority:** P1
**Requirement:**
The system SHALL expose aggregate eligibility-gate metrics via the existing analytics API for consumption by S-07 Environmental Dashboard, Lab Management Dashboard, and ad-hoc reporting:

| Metric | Definition | Aggregation |
|---|---|---|
| Acceptance Rate | `ELIGIBLE` count / total Step 4 decisions | Per SampleType, per domain, per lab-unit, per date range |
| Rejection Rate | `PRE_ANALYTICAL_REJECTED` + `PRE_ANALYTICAL_REJECTED_RESAMPLING` count / total | Same as above |
| Resampling Rate | `PRE_ANALYTICAL_REJECTED_RESAMPLING` count / total rejections | Same as above |
| Median Transit Duration | Median of (received_at_lab - collection_date_time) across Step 4 commits | Same as above |
| Top Failing Criteria | Criterion IDs with the highest failure counts | Top-N with date range filter |

**Acceptance Criteria:**
- [ ] Metrics endpoint `/api/v1/analytics/eligibility?dateFrom=&dateTo=&sampleTypeId=&domain=&labUnitId=` returns all metrics
- [ ] Metrics computed from `EligibilityAssessment` table + `Order.status` + NCE records
- [ ] S-07 Dashboard consumes the endpoint for environmental tiles
- [ ] Response time < 2 seconds for queries spanning 1 year

---

**ID:** ELIG-11-002
**Priority:** P0
**Requirement:**
Every sample's audit trail SHALL include the full Eligibility Assessment record: decision, criteria snapshot (with pass state and notes at commit time), assessor, commit timestamp, arrival timestamp, transit duration, linked NCE (if reject), linked Resample Request (if resample), override flag + justification (if override), shipment grouping reference (if grouped).

**Acceptance Criteria:**
- [ ] `EligibilityAssessment` record retrievable via `/api/v1/orders/{id}/eligibility-assessment`
- [ ] Audit trail UI (per QA-6) renders the assessment in chronological order alongside other events
- [ ] ISO 15189 / 17025 accreditation queries can reconstruct chain-of-custody from this record

---

## 7. Data Model

### 7.1 New Entities

**EligibilityAssessment**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| order_id | Long (FK) | Yes | FK to Order |
| sample_id | Long (FK) | No | FK to Sample (null for lot-level vector) |
| collection_lot_id | Long (FK) | No | FK to CollectionLot (null for sample-level) |
| decision | ENUM | Yes | `ACCEPTED` / `REJECTED_CONTINUE` / `REJECTED_SAMPLE` / `REJECTED_RESAMPLE` |
| assessor_user_id | Long (FK) | Yes | Committing user |
| committed_at | TIMESTAMP | Yes | Commit timestamp (server) |
| arrival_timestamp | TIMESTAMP | No | Snapshot of received_at_lab |
| transit_duration_hours | Decimal | No | Computed at commit |
| sop_window_hours | Decimal | No | Snapshot of SampleType SOP window at commit |
| override | Boolean | Yes | True if criteria had failures but decision was ACCEPTED |
| override_justification | Text | No | Required when override=true |
| shipment_group_id | UUID | No | Links samples rejected together per 6.6 |
| linked_nce_id | Long (FK) | No | FK to NCE (null for ACCEPTED) |
| linked_resample_order_id | Long (FK) | No | FK to new Order (only for REJECTED_RESAMPLE) |
| criteria_snapshot | JSONB | Yes | Array of `{criterionId, label, pass, notes, severity}` at commit |

**Index:** `(order_id)`, `(sample_id)`, `(assessor_user_id, committed_at)`, `(shipment_group_id)`

**SampleTypeCriterion**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | PK |
| sample_type_id | Long (FK) | Yes | FK to SampleType |
| label_i18n_key | VARCHAR(100) | Yes | i18n key for display label |
| description_i18n_key | VARCHAR(100) | No | i18n key for helper description |
| severity | ENUM | Yes | `CRITICAL` / `MAJOR` / `MINOR` |
| recoverable | Boolean | Yes | Resample is valid sample_action default |
| auto_compute_rule | ENUM | No | `none` / `transit_window` / `temperature_range` / `volume_range` / `pool_size` |
| nce_subcategory | VARCHAR(50) | Yes | Mapped NCE subcategory on failure |
| sort_order | Integer | Yes | Display order in checklist |
| active | Boolean | Yes | Soft-delete flag |
| created_at, updated_at | — | Yes | Audit |

### 7.2 Modified Entities

**Order (extends existing)**

| Field | Type | Required | Notes |
|---|---|---|---|
| status | ENUM | Yes | Extended per ELIG-1-001 |
| received_at_lab | TIMESTAMP | No | Set at Step 2 Received at Lab (existing COL-2 field; now documented) |
| received_by_user_id | Long (FK) | No | Set at Step 2 Received at Lab (existing COL-2 field; now documented) |
| resampled_from_order_id | Long (FK) | No | **New** — FK to original Order when this order is a Resample Request |
| resampled_from_nce_id | Long (FK) | No | **New** — FK to the NCE that triggered the resample |
| eligibility_gate_behavior_at_entry | ENUM | No | **New** — Snapshot of `Mandatory`/`Prompted`/`Disabled` at time of PENDING_QA entry; used to resolve UI behavior for in-flight orders |

**LabUnit (extends existing)**

| Field | Type | Required | Notes |
|---|---|---|---|
| eligibility_gate_clinical | ENUM | Yes | `Mandatory` / `Prompted` / `Disabled`; default `Disabled` |
| eligibility_gate_environmental | ENUM | Yes | Default `Mandatory` |
| eligibility_gate_vector | ENUM | Yes | Default `Mandatory` |

**NCE (extends existing)**

| Field | Type | Required | Notes |
|---|---|---|---|
| source_type | VARCHAR(50) | No | Adds value `eligibility_assessment` |
| trigger_action | VARCHAR(50) | No | Adds value `eligibility_gate` |
| failing_criteria_snapshot | JSONB | No | **New** — populated when source_type=eligibility_assessment |
| sample_action | ENUM | Yes | Adds value `resample` |

### 7.3 Schema Changes

```sql
-- Status enum extension
ALTER TYPE order_status ADD VALUE 'PENDING_LABELING';
ALTER TYPE order_status ADD VALUE 'PENDING_QA';
ALTER TYPE order_status ADD VALUE 'ELIGIBLE';
ALTER TYPE order_status ADD VALUE 'PRE_ANALYTICAL_REJECTED';
ALTER TYPE order_status ADD VALUE 'PRE_ANALYTICAL_REJECTED_RESAMPLING';

-- Order extensions
ALTER TABLE orders ADD COLUMN resampled_from_order_id BIGINT REFERENCES orders(id);
ALTER TABLE orders ADD COLUMN resampled_from_nce_id BIGINT REFERENCES nce(id);
ALTER TABLE orders ADD COLUMN eligibility_gate_behavior_at_entry VARCHAR(20);
CREATE INDEX idx_orders_status_received ON orders(status, received_at_lab) WHERE status = 'PENDING_QA';
CREATE INDEX idx_orders_resampled_from ON orders(resampled_from_order_id);

-- LabUnit extensions
ALTER TABLE lab_unit ADD COLUMN eligibility_gate_clinical VARCHAR(20) DEFAULT 'Disabled';
ALTER TABLE lab_unit ADD COLUMN eligibility_gate_environmental VARCHAR(20) DEFAULT 'Mandatory';
ALTER TABLE lab_unit ADD COLUMN eligibility_gate_vector VARCHAR(20) DEFAULT 'Mandatory';

-- NCE extensions
ALTER TABLE nce ADD COLUMN failing_criteria_snapshot JSONB;
-- sample_action enum extension (if enum) or CHECK constraint update
ALTER TABLE nce DROP CONSTRAINT IF EXISTS nce_sample_action_check;
ALTER TABLE nce ADD CONSTRAINT nce_sample_action_check
  CHECK (sample_action IN ('continue', 'reject', 'resample'));

-- New tables
CREATE TABLE eligibility_assessment (
    id UUID PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    sample_id BIGINT REFERENCES sample(id),
    collection_lot_id BIGINT REFERENCES collection_lot(id),
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('ACCEPTED','REJECTED_CONTINUE','REJECTED_SAMPLE','REJECTED_RESAMPLE')),
    assessor_user_id BIGINT NOT NULL REFERENCES users(id),
    committed_at TIMESTAMP NOT NULL,
    arrival_timestamp TIMESTAMP,
    transit_duration_hours DECIMAL(10,2),
    sop_window_hours DECIMAL(10,2),
    override BOOLEAN NOT NULL DEFAULT FALSE,
    override_justification TEXT,
    shipment_group_id UUID,
    linked_nce_id BIGINT REFERENCES nce(id),
    linked_resample_order_id BIGINT REFERENCES orders(id),
    criteria_snapshot JSONB NOT NULL
);
CREATE INDEX idx_elig_assess_order ON eligibility_assessment(order_id);
CREATE INDEX idx_elig_assess_sample ON eligibility_assessment(sample_id);
CREATE INDEX idx_elig_assess_assessor ON eligibility_assessment(assessor_user_id, committed_at);
CREATE INDEX idx_elig_assess_shipment ON eligibility_assessment(shipment_group_id);

CREATE TABLE sample_type_criterion (
    id UUID PRIMARY KEY,
    sample_type_id BIGINT NOT NULL REFERENCES sample_type(id),
    label_i18n_key VARCHAR(100) NOT NULL,
    description_i18n_key VARCHAR(100),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL','MAJOR','MINOR')),
    recoverable BOOLEAN NOT NULL,
    auto_compute_rule VARCHAR(30),
    nce_subcategory VARCHAR(50) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sample_type_criterion ON sample_type_criterion(sample_type_id, active, sort_order);
```

---

## 8. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/orders?status=PENDING_QA&sort=receivedAt,asc` | Eligibility Worklist data | `eligibility.view` |
| GET | `/api/v1/orders/{id}/eligibility-context` | Step 4 Eligibility Assessment context (arrival, criteria, compliance) | `order.qa` + `eligibility.view` |
| POST | `/api/v1/orders/{id}/eligibility-assessment/accept` | Commit Accept | `order.qa` + `eligibility.assess` |
| POST | `/api/v1/orders/{id}/eligibility-assessment/reject` | Commit Reject (with sample_action and NCE data in body) | `order.qa` + `eligibility.assess` + `nce.report` |
| GET | `/api/v1/orders/{id}/eligibility-assessment` | Retrieve committed assessment | `order.qa` |
| GET | `/api/v1/orders/{id}/grouping-candidates` | Find other PENDING_QA samples matching shipment signals | `eligibility.assess` |
| GET | `/api/v1/sample-types/{id}/criteria` | List acceptance criteria | `sampleType.view` |
| PUT | `/api/v1/sample-types/{id}/criteria` | Update criteria set | `sampleType.edit` |
| GET | `/api/v1/analytics/eligibility` | Aggregate metrics | `analytics.view` |
| GET | `/api/v1/lab-units/{id}/eligibility-config` | Per-domain gate behavior | `labUnit.view` |
| PUT | `/api/v1/lab-units/{id}/eligibility-config` | Update per-domain gate behavior | `labUnit.admin` |

**Accept request body:**
```json
{
  "criteria": [
    {"criterionId": "uuid", "pass": true, "notes": ""}
  ],
  "override": false,
  "overrideJustification": null
}
```

**Reject request body:**
```json
{
  "criteria": [
    {"criterionId": "uuid", "pass": false, "notes": "Seal broken"}
  ],
  "nce": {
    "category": "Pre-Analytical",
    "subcategory": "Specimen Integrity",
    "severity": "Major",
    "title": "Eligibility gate failure: 1 criterion failed",
    "description": "• Container integrity: FAIL — seal broken",
    "sampleAction": "resample",
    "groupedSampleIds": []
  }
}
```

---

## 9. Navigation & Screen Inventory

S-09 does not introduce full new screens — it extends existing screens and adds one worklist shortcut.

| Screen | Extension | Source Requirement |
|---|---|---|
| **Step 4 — QA Review** (env/vector/clinical when gate != Disabled) | Adds Eligibility Assessment section above Sample Review table; Approve button becomes eligibility-aware; Report NCE form gains Resample sample_action | ELIG-2-001, 2-002, 4-001, 4-002 |
| **Eligibility Worklist** (new sidebar entry) | Filtered view of order dashboard: `status=PENDING_QA`; summary tiles; scan bar | ELIG-8-001, 8-002 |
| **SampleType Admin** (existing) | Acceptance Criteria accordion on edit form | ELIG-7-001 |
| **Lab Unit Admin** (existing) | Eligibility Gate Behavior per-domain config | ELIG-10-001 |
| **NCE Dashboard** (existing) | Filter option: `trigger_action = eligibility_gate`; no design change required | ELIG-11-001 |
| **S-07 Environmental Dashboard** (existing) | New tiles: acceptance rate, rejection rate, resampling rate, median transit | ELIG-11-001 |
| **Order Audit Trail** (existing) | Renders EligibilityAssessment events in timeline | ELIG-11-002 |

See companion mockup: `S09-eligibility-gate-mockup.jsx`

---

## 10. Business Rules

**BR-001:** The eligibility gate applies only to samples whose order has passed through Step 3 (Label & Store). Samples in `IN_PROGRESS` or `PENDING_LABELING` are not eligible for Step 4 gate review.

**BR-002:** The gate operates per-sample, not per-order. An order with multiple samples may have some Accepted and others Rejected in the same Step 4 session. Order-level advancement to `ELIGIBLE` requires all samples to be Accepted; otherwise the order remains in `PENDING_QA` until all samples have a committed decision.

**BR-003:** An order whose samples are all Rejected (combination of `PRE_ANALYTICAL_REJECTED` and `PRE_ANALYTICAL_REJECTED_RESAMPLING`) transitions to `PRE_ANALYTICAL_REJECTED` at the order level. This mirrors QA-4's order-auto-reject behavior.

**BR-004:** The `Resample` sample_action is available only when at least one failing criterion has `recoverable=true`. Configured admin-side.

**BR-005:** Resample Requests are independent orders with their own lab numbers. Rejecting a Resample Request triggers a cascading Resample loop only if the QA Officer selects Resample again — there is no automatic re-spawn chain.

**BR-006:** Auto-computed criteria (transit_window, temperature_range, volume_range, pool_size) are read-only in the Step 4 checklist. The officer cannot manually flip an auto-computed fail to pass without committing an override with justification.

**BR-007:** The gate behavior setting (`Mandatory`/`Prompted`/`Disabled`) at the time an order enters `PENDING_QA` is snapshot in `Order.eligibility_gate_behavior_at_entry` and governs the Step 4 UI for that order, even if the admin changes the lab-unit setting afterward.

**BR-008:** Override commits (criteria failed but Accept clicked with override justification) are first-class audit events. S-07 dashboard displays override rate as a separate metric alongside acceptance/rejection rates.

**BR-009:** The grouping signal logic (6.6) is applied only at the moment the officer opens the NCE inline form. Subsequent changes to other samples (arrivals, rejections) do not retroactively update the grouping offer on an open form.

**BR-010:** When a SampleType's Acceptance Criteria are modified while orders are in `PENDING_QA`, in-flight orders retain the criteria set that was active at the time they entered `PENDING_QA`. The `criteria_snapshot` on the EligibilityAssessment preserves this.

**BR-011:** Notifications for Reject and Resample outcomes honor the requester's notification preferences (email, SMS, both, none). A requester who has opted out of notifications does not receive one, but the NCE and Resample Request are still created — the lab must contact them manually.

**BR-012:** The Step 4 `Return to Step N` action (QA-5) is a workflow correction, distinct from eligibility Reject. A QA Officer who needs to return an order for Step 2 data correction uses Return to Step 2, not Reject. The NCE subcategory for "Data Incomplete" is not an eligibility failure.

**BR-013:** Clinical samples in a lab-unit configured with `Clinical: Disabled` do not see the Eligibility Assessment section at Step 4 and behave per the unmodified Sample Collection Redesign.

---

## 11. Localization

All user-facing text externalized via i18n keys. Key additions:

| Key | Default English |
|---|---|
| `heading.eligibility.assessment` | Eligibility Assessment |
| `heading.eligibility.arrivalContext` | Arrival & Transit |
| `heading.eligibility.criteria` | Acceptance Criteria |
| `heading.eligibility.complianceContext` | Compliance Context |
| `label.eligibility.arrivalAt` | Received at lab |
| `label.eligibility.transitDuration` | Time in transit |
| `label.eligibility.receivedBy` | Received by |
| `label.eligibility.sopWindow` | SOP window |
| `label.eligibility.sopBreach` | SOP transit window exceeded |
| `label.eligibility.criterionPass` | Pass |
| `label.eligibility.criterionFail` | Fail |
| `label.eligibility.criterionAutoComputed` | Automatically evaluated |
| `label.eligibility.notesPlaceholder` | Optional — note any observed condition |
| `button.eligibility.accept` | Accept |
| `button.eligibility.approve` | Approve |
| `button.eligibility.reportNce` | Report NCE |
| `message.eligibility.override.confirm` | Some criteria are not marked pass. Commit anyway? This will be recorded as an override. |
| `label.eligibility.override.justification` | Override justification (required) |
| `label.nce.sampleAction.resample` | Resample |
| `label.nce.sampleAction.resample.desc` | Reject this sample and automatically create a new collection order for re-collection. The customer will be notified. |
| `message.eligibility.resample.unavailable` | Field re-collection not applicable for this failure type |
| `heading.eligibility.grouping.title` | Other samples match this root cause |
| `label.eligibility.grouping.checkbox` | Include these samples in the same NCE |
| `notification.eligibility.reject.subject` | Sample rejected: Lab #{labNumber} |
| `notification.eligibility.reject.body` | Your submitted sample was rejected at our lab. Reason: {reason}. Failing criteria: {criteriaList}. NCE reference: {nceNumber}. View details: {orderUrl} |
| `notification.eligibility.resample.subject` | Resampling required: Lab #{labNumber} |
| `notification.eligibility.resample.body` | Your submitted sample cannot be processed and requires re-collection. Reason: {reason}. New request: Lab #{newLabNumber}. Please schedule re-collection at your earliest convenience. View details: {resampleUrl} |
| `status.pendingLabeling` | Pending Labeling |
| `status.pendingQA` | Pending QA |
| `status.waitingForQC` | Waiting for QC |
| `status.eligible` | Eligible |
| `status.preAnalyticalRejected` | Pre-Analytical Rejected |
| `status.preAnalyticalRejectedResampling` | Resampling Requested |
| `menu.order.eligibilityWorklist` | Eligibility Worklist |
| `label.worklist.awaitingAssessment` | Awaiting Assessment |
| `label.worklist.sopBreaches` | SOP Breaches |
| `label.worklist.oldestWaiting` | Oldest Waiting |
| `label.worklist.myReceipts` | My Receipts |
| `label.admin.sampleType.acceptanceCriteria` | Acceptance Criteria |
| `label.admin.labUnit.eligibilityGate` | Eligibility Gate Behavior |
| `label.admin.labUnit.eligibilityGate.mandatory` | Mandatory |
| `label.admin.labUnit.eligibilityGate.prompted` | Prompted |
| `label.admin.labUnit.eligibilityGate.disabled` | Disabled |

---

## 12. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Accept commit without criteria | All criteria must be checked (pass/fail) | `error.eligibility.criteriaIncomplete` |
| Override without justification | `override_justification` min 10 chars | `error.eligibility.overrideJustificationRequired` |
| Reject commit without NCE | NCE required when decision is reject | `error.eligibility.nceRequired` |
| Resample on non-recoverable failure | At least one failing criterion must have `recoverable=true` | `error.eligibility.resampleNotAllowed` |
| Status transition | Must match state diagram per ELIG-1-002 | `error.eligibility.invalidStatusTransition` |
| SampleType criteria | At least one criterion per SampleType for enabled domain | `error.eligibility.criteriaMissing` |

---

## 13. Security & Permissions

Covered in §4. Summary:

- Users without `order.qa` cannot view Step 4 at all.
- Users with `order.qa` but without `eligibility.view` see Step 4 without the Eligibility Assessment section.
- Users with `eligibility.view` but without `eligibility.assess` see the section read-only.
- Users with `eligibility.assess` can commit Accept and Reject with `continue` sample_action.
- `eligibility.reject` is required to commit Reject with `reject` sample_action.
- `eligibility.resample` is required to commit Reject with `resample` sample_action.
- Admin configuration requires `sampleType.edit` (criteria) and `labUnit.admin` (gate behavior).

---

## 14. Acceptance Criteria

### Functional

- [ ] Step 4 displays Eligibility Assessment section when gate is Mandatory or Prompted for the order's domain
- [ ] Criteria checklist pre-populated from SampleType config
- [ ] Auto-computed criteria evaluated server-side and displayed read-only
- [ ] Arrival & Transit context shows Step 2 data; SOP breach indicator renders when applicable
- [ ] Accept button enabled only when all criteria pass (or override confirmed)
- [ ] Accept transitions PENDING_QA → ELIGIBLE and creates EligibilityAssessment record
- [ ] Reject opens existing Step 4 inline Report NCE pre-populated per ELIG-4-001
- [ ] NCE sample_action radio includes new Resample option when user has `eligibility.resample`
- [ ] Resample creates new order linked via `resampled_from_order_id`, sends notification, marks original PRE_ANALYTICAL_REJECTED_RESAMPLING
- [ ] Shipment grouping offer appears when other PENDING_QA samples match signals
- [ ] Grouped reject commits single NCE linked to all selected samples; Resample creates independent new orders per grouped sample
- [ ] Eligibility Worklist renders at /order/eligibility-worklist with PENDING_QA filter
- [ ] Vector CollectionLot orders use pool-specific context and criteria
- [ ] Lab Unit admin exposes per-domain gate behavior configuration
- [ ] SampleType admin exposes Acceptance Criteria accordion for Clinical/Env/Vector domains
- [ ] Order status model per ELIG-1-001 enforced at API layer
- [ ] Returned from QA (QA-5) flow remains functionally distinct from eligibility Reject

### Non-Functional

- [ ] All UI strings use i18n keys
- [ ] Eligibility Worklist loads within 2 seconds for 500 PENDING_QA orders
- [ ] Step 4 Accept commit completes within 1 second
- [ ] Analytics endpoint responds within 2 seconds for 1-year queries
- [ ] Permissions enforced at API layer (HTTP 403 for unauthorized)
- [ ] Resample commit is transactional (all-or-nothing)
- [ ] WCAG 2.1 AA compliance per XC-3

### Integration

- [ ] S-10 Distribution consumes ELIGIBLE status for worklist
- [ ] S-06 Laporan Hasil reads EligibilityAssessment for Sample Acceptance block
- [ ] S-07 Environmental Dashboard displays eligibility metric tiles
- [ ] V-02 Vector Collection Workflow inherits gate behavior for CollectionLot without additional spec work
- [ ] Existing NCE system accepts new `source_type` and `trigger_action` values
- [ ] Existing Notification Admin service delivers reject/resample notifications
- [ ] Existing audit trail renders EligibilityAssessment events

---

## Appendix A — Cross-Reference to Parent Specs

| S-09 Requirement | Extends | Parent Spec |
|---|---|---|
| ELIG-1-001 | — (new enum formalization) | Sample Collection Redesign (implicit status states) |
| ELIG-2-001, 2-002, 2-003 | QA-1, QA-2, QA-3, QA-5 | Sample Collection Redesign |
| ELIG-3-001, 3-002 | QA-5 (Approve) | Sample Collection Redesign |
| ELIG-4-001, 4-002, 4-003 | QA-3 (Report NCE inline); NCE Results Entry §3 | Sample Collection Redesign; NCE FRS |
| ELIG-5-001..004 | NCE sample_action pattern; ORD-4 (draft order) | NCE FRS; Sample Collection Redesign |
| ELIG-6-001 | NCE Results Entry §7.3 (grouping offer) | NCE FRS |
| ELIG-7-001, 7-002 | OGC-296 / S-04 SampleType admin | S-04 |
| ELIG-8-001, 8-002 | DSH-1..DSH-9 (order dashboard) | Sample Collection Redesign |
| ELIG-9-001 | V-01 CollectionLot | V-01 |
| ELIG-10-001 | CFG-1 (Lab Unit config) | Sample Collection Redesign |
| ELIG-11-001 | S-07 Environmental Dashboard | S-07 |
| ELIG-11-002 | QA-6 (audit trail) | Sample Collection Redesign |

---

## Appendix B — Cross-Reference to SILNAS PRD

| PRD Table / Row | PRD Requirement | S-09 Coverage |
|---|---|---|
| ENV Table 11 rows 10–11 | Eligibility test with Arrival Date/Time, Time Difference, Staff, Eligible/Non-Eligible radio | ELIG-2-001, 2-002, 3-001, 4-001 |
| ENV Table 11 row 11 | Resampling action + reason + customer notification | ELIG-4-002, 5-001, 5-002, 5-003 |
| ENV Table 11 row 12 | Registration Rejection (Pre-Analytical Rejection) | ELIG-4-003, ELIG-1-001 `PRE_ANALYTICAL_REJECTED` status |
| Vector Table 16 rows 10–11 | Same eligibility + resampling structure for vector | ELIG-9-001, 7-002 |
| ENV Status "Waiting for QC" | PRD status mapping | `PENDING_QA` with i18n `status.waitingForQC` for env/vector |
| ENV Status "Pre Analytic Rejection" | PRD status mapping | `PRE_ANALYTICAL_REJECTED` |
| ENV QR label generation on eligibility pass | PRD requirement | Handled upstream in Step 3 per existing LBL-2; S-09 does not re-trigger |
| Customer notification (WhatsApp/email) | PRD requirement | ELIG-5-003 via Notification Admin |

---

*End of Document*
