# Reference Lab Results — Dev Primer

**Audience:** Backend or frontend developer with no clinical laboratory background, picking up the Reference Lab Results Epic (OGC-796) for the first time.
**Read time:** ~12 minutes.
**Goal of this document:** Give you the workflow narrative grounded in what a lab actually does, so the 14 stories under this Epic feel like one coherent feature rather than 14 disconnected tickets.

---

## 1. Why this exists in plain English

A clinical laboratory can't run every test in-house. Specialized assays — HIV viral load, M. tuberculosis culture, whole exome sequencing, certain confirmatory tests — go to a **reference lab** (a partner laboratory with the equipment, expertise, or accreditation the local lab doesn't have). When that happens, the local lab packages up the sample, ships it, waits days or weeks, gets a result back, and posts that result into the patient's record.

Two pieces of software work together to make this happen in OpenELIS:

| System | What it owns |
|---|---|
| **Sample Shipment** (already shipped — `/SampleShipment/*`) | The physical lifecycle: packing samples into boxes, printing labels and manifests, scanning at the receiving lab, capturing non-conformities, exchanging FHIR `SupplyDelivery` messages. |
| **Reference Lab Results** (this Epic — new, `/SampleShipment/reference-lab-results`) | The data lifecycle: which samples are still out at reference labs, which results have come back, posting those results to the right local `Analysis`, handling rejections and lost samples. |

The two systems are tightly coupled but separately rendered. They share the `Box` entity (Sample Shipment owns it) and the `Referral` entity (this Epic owns it). They join at one transition: a Box can only reach `Reconciled` when every contained Referral has been resolved (either result posted, or rejected, or cancelled).

If you remember nothing else from this primer: **Sample Shipment = "where's my shipment?". Reference Lab Results = "where's my result?".**

---

## 2. Walk through a realistic case — the happy path

Meet **Jean Rakoto**, a 42-year-old man living with HIV in Antananarivo, Madagascar. His clinician orders a quarterly HIV-1 RNA viral load test to monitor his treatment response. The local district hospital lab can draw the blood but doesn't have the molecular biology equipment to run viral loads, so they refer to **CEDRES Reference Laboratory** in Abidjan.

Here is the full timeline. Story IDs in parentheses tie back to the breakdown plan.

### Step 1 — Order entry
The reception clerk creates a new order in OpenELIS. On Step 3 of the order entry wizard, they tick "Refer Out" next to the Viral Load test and pick CEDRES as the reference lab. *(S3.3 — Order Entry Step 3 hook)*
A `Referral` row is created with `Task.status = draft`. The sample, when collected, will carry `referral_flag = true`. It immediately appears in Sample Shipment's **Unassigned Samples** tab — "this sample needs a box."

> Alternative entry point: a tech might decide mid-bench, during Result Entry, that the test needs to go out. They tick "Refer Out" on the result row. Same outcome — a `Referral` in `draft`, sample tagged for shipment. Both creation paths dedupe on `analysis_id`.

### Step 2 — Boxing the sample
Across the lab, a shipping coordinator opens Sample Shipment, sees the unassigned sample on the dashboard, and adds it to a Box bound for CEDRES with 8 other samples. They mark the Box **Ready to Send**, print the label, generate the manifest, then click Send. The Box transitions to `Sent`.

Behind the scenes, the Sample Shipment server emits a FHIR PUT for each contained Referral: `Task.status = requested`. A FHIR `SupplyDelivery` message goes to CEDRES's endpoint with the manifest. *(S1.1 — State migration, S3.1/S3.2 — Box integration plumbing)*

### Step 3 — In transit
For two days, Jean Rakoto's sample sits in a cold-chain courier box flying from Tana to Abidjan. The Referral row in OpenELIS shows `Task.status = requested`. If a lab manager opens **Reference Lab Results → Outstanding** they see the row with "2 days outstanding" and status `Sent — awaiting acceptance`. *(S1.2/S1.3 — Scaffolding + Outstanding view)*

### Step 4 — Arrival at the reference lab
The box arrives at CEDRES. A CEDRES tech scans the box ID and each sample barcode. CEDRES is on OpenELIS too, so their system emits FHIR PUTs back: `Task.status = received` for each sample. Our local Referral row updates automatically. The Outstanding view now shows `At reference lab`. *(S3.4 — Inbound peer Task state reads)*

CEDRES sets up the viral load assay; they emit another PUT: `Task.status = in-progress`. Our Outstanding view shows `In progress at reference lab`.

### Step 5 — Result returns
Two days later CEDRES finishes the test, validates the result on their end, and emits a FHIR `DiagnosticReport` with one `Observation`: HIV-1 RNA = "< 20 copies/mL (undetectable)". *(S2.4 — DiagnosticReport inbound routing)*

The local OpenELIS server receives the report, matches `DiagnosticReport.basedOn` to the stored ServiceRequest UUID on the Referral, sets `Referral.diagnostic_report_uuid`, and advances `Task.status = completed`.

### Step 6 — Validator reception
A validator opens Reference Lab Results the next morning. The **Returned — needs action** chip is showing a count of `1`. They click it, see Jean Rakoto's row, expand it. The right-hand panel shows the result card: `< 20 copies/mL`, reference range `Undetectable: < 20`, flag `Normal`. They click **Accept to Analysis**. *(S2.1, S2.2 — Returned view + Accept action)*

The server-side handler maps `DiagnosticReport.Observation` → `Result` row tied to Jean Rakoto's original Analysis via the existing `ResultService.create`. The Analysis is set to `validated` (released) — **no local revalidation step**, because CEDRES already validated it on their end. `Referral.reconciled = true`. An `audit_trail` row with verb `REFERRAL_RESULT_RECEIVED` records who did the reception and when.

### Step 7 — Box reconciliation
When the validator accepts the last unresolved Referral in this Box, a notification surfaces on the Box detail page in Sample Shipment: **"All referrals reconciled — ready to close box."** The shipping coordinator marks the Box **Reconciled**, terminal state.

The patient record now shows Jean Rakoto's viral load result. The clinician sees it on their next visit. End of the happy path.

---

## 3. Alternative narratives — the cases the spec actually has to handle

The happy path is the easy story. Real lab work has more variety. The Epic handles five more narratives that all flow through the same surface.

### 3a. The reference lab isn't on OpenELIS — manual entry
CEDRES is fictional-on-OpenELIS for this example. Most reference labs aren't. **Central Public Health Laboratory (CPHL)**, for instance, returns CD4 counts by phone. The validator answers the call, has the result on a sticky note, and clicks the visible two-line **"Enter result"** button on the row in Outstanding. *(S1.3 — Manual Entry path)*

That button is a deep link to the existing Result Entry screen with the order's lab number pre-loaded. The validator types in the value, sets the reference-lab reported date/time (the existing date capture in Result Entry), saves. A server-side hook in `ResultService.create` notices: "this Result lands on an Analysis with an open Referral." It advances `Task.status = completed`, sets `manually_entered = true`, and the row jumps from Outstanding straight to History with a **Manually entered** tag.

This is the single most common case in practice. The two-line button (not an overflow menu) reflects that.

### 3b. Critical result
CPHL returns a positive Cryptococcal antigen titer of 1:80 on a patient with suspected HIV-related opportunistic infection. The DiagnosticReport carries `Observation.interpretation = Critical`. When the validator clicks Accept, the result posts normally, AND a trigger fires into the existing **Alerts feature** (separate from this Epic — see the global "Critical Result Acknowledgment" idea). The Alerts feature owns the acknowledgment UX; this Epic only emits the trigger. *(S2.2 — Critical hook)*

### 3c. The reference lab rejects the sample
Insufficient volume. Wrong tube type. Hemolyzed. Damaged container. Temperature deviation in transit. Mislabeled.

In every realistic case the existing physical sample is gone or unusable. The reference lab sends `Task.status = rejected` with a reason in `Task.statusReason.text`. Our local validator opens Reference Lab Results, sees the row in Returned, expands it, sees the reason, clicks **Reject**. *(S2.3 — Reject action)*

The modal confirms the action. On confirm:
- `Task.status = rejected` (PUT emitted to peer for symmetry — peer already set it but our PUT confirms)
- Original `Analysis` is closed with a new terminal status `rejected_by_reference_lab` — not re-opened
- A notification fires to the requesting clinician via the existing OGC-589 trigger registry (`REFERRAL_REJECTED_NEEDS_RECOLLECTION`) so they know to ask the patient back for a new sample
- A trigger fires to the Alerts feature for lab-side acknowledgment
- The row moves to History with Outcome = Rejected

**Important workflow detail:** the validator does NOT "re-refer" the same sample. The clinician arranges re-collection, the patient comes back, a NEW order is created through the existing order-entry flow with a fresh sample and fresh Analysis. Each Lab Number represents one collection event.

### 3d. The box is lost in transit
A courier loses the box. Two weeks pass, no FHIR PUTs from the reference lab. The Outstanding view's aging banner lights up: "5 referrals have been at a reference lab for more than 7 days." *(S1.5 — Aging banner)*

The lab manager calls the courier, confirms the loss, and on the relevant rows clicks **Mark Lost** from the expand panel. They enter a free-text reason ("courier confirmed loss in transit"). The Referral row gets `lostStatus = true`, `lostDate = now`, and moves to History with Outcome = Lost. The FHIR Task stays in `requested` (lost is a local-only flag, not a FHIR state transition).

Like rejection, recovery means a new order with a fresh sample.

### 3e. Multi-test referrals
Some referrals carry more than one test. A Hep-B/Hep-C combined referral arrives with two Observations in the DiagnosticReport: HBV DNA = `2.1 × 10⁴ IU/mL` (abnormal — active replication), HCV RNA = `Not detected` (normal). *(S2.2 — Multi-test handling)*

The expand panel shows two stacked result cards. The validator can Accept individual tests with a per-test button, or click **Accept all results** to commit everything at once. Real-world usage is dominated by the "everything looks fine, accept all" case; the per-test option exists for the edge cases where one test in a combined panel needs investigation while the other is ready to release.

---

## 4. The state machine you actually need to understand

Two state machines on parallel lifecycles, joined at the Box.Reconciled transition.

### 4a. Referral state machine (this Epic owns it)

```
draft ──→ requested ──→ received ──→ in-progress ──→ completed
  │           │             │             │              │
  │           │             │             │              └──→ (Accept) reconciled (terminal)
  │           │             │             │              └──→ (Reject) rejected (terminal)
  │           │             │             │
  │           │             │             └──→ (peer reject) rejected (terminal)
  │           │             │             └──→ (peer in-progress) in-progress
  │           │             │
  │           │             └──→ (peer reject) rejected (terminal)
  │           │
  │           └──→ (user cancel) cancelled (terminal)
  │           └──→ (peer reject) rejected (terminal)
  │
  └──→ (user cancel) cancelled (terminal)

Plus local-only side flag: lostStatus = true (FHIR state unchanged; row appears as Lost in History)
```

These are FHIR `Task.status` values — same vocabulary the reference lab uses, which means peer-OpenELIS labs and our local UI agree on what every state means. Display labels stay localizable (the UI may say "Sent — awaiting acceptance" instead of "requested" — the i18n table in §7 of the FRS handles that).

The migration from the old `CREATED/SENT/RECEIVED/FINISHED/CANCELED` enum to these FHIR-aligned values is a one-shot Liquibase changeset with rollback. *(S1.1)*

### 4b. Box state machine (Sample Shipment owns it — for reference only)

```
Draft → Ready to Send → Sent → In Transit → Partially Received → Received → Reconciled
                                                                                  ↑
                                              (gated: all Referrals must be      │
                                              completed/rejected/cancelled/lost  │
                                              before the Box can reach this state)
```

The gate is enforced by S3.2. Block the transition with an `InlineNotification kind="error"` if any contained Referral is still non-terminal.

### 4c. Where they touch
- Box.Sent emits `requested` on every contained Referral
- Box.Received emits `received` on every contained Referral (or peer's PUT does — either way idempotent)
- Box.Reconciled is gated by every Referral being terminal
- That's it. No other coupling.

---

## 5. How the 14 stories map onto the narrative

| Narrative step | Stories |
|---|---|
| Refer Out at order entry OR result entry | S3.3 (OE Step 3 hook) |
| State migration (old enum → FHIR Task) | S1.1 |
| The Reference Lab Results page itself | S1.2 |
| Outstanding view + Mark Lost + Manual Entry | S1.3 |
| History view | S1.4 |
| Aging banner for stuck referrals | S1.5 |
| Returned — needs action view | S2.1 |
| Accept-to-Analysis (reception model) + Critical hook + Multi-test | S2.2 |
| Reject + clinician notify + Alerts ack | S2.3 |
| Inbound DiagnosticReport routing | S2.4 |
| Box detail back link to Referrals | S3.1 |
| Box.Reconciled gate | S3.2 |
| Inbound peer Task PUTs (received/in-progress/rejected) | S3.4 |
| Notify reference lab from expand panel | S3.5 |

---

## 6. Integration points (what we touch elsewhere)

- **Sample Shipment** (existing, live on testing). We add: a count summary on the Box detail page (S3.1), a state-transition gate (S3.2). We do NOT touch any other Sample Shipment surface.
- **Result Entry / Logbook** (existing). We add: a server-side hook in `ResultService.create` / `LogbookResultsController` that detects "this Result save lands on an Analysis with an open Referral" and advances the Referral state. We do NOT change the Result Entry UI.
- **Order Entry wizard** (in flight as OGC-605). We absorb OGC-605 into S3.3. Coordinate with the Order Entry team during sprint planning.
- **OGC-589 Notifications**. We absorb OGC-589 into S3.5 and add a new event type `REFERRAL_REJECTED_NEEDS_RECOLLECTION` to the trigger registry in S2.3. Coordinate with the notifications owner.
- **Alerts feature** (separate Epic — "Critical Result Acknowledgment"). We emit triggers for critical-result reception (S2.2) and reject (S2.3). The Alerts feature owns the acknowledgment UX. We do NOT design that surface in this Epic.
- **OGC-624 Inter-Lab Transfer & Subcontract** (in progress, owner Samuel Male). Its proposed parallel `subcontractStatus` field is superseded — coordinate with Samuel before any state-field surgery.

---

## 7. What success looks like

After all three sprints ship:

- The Referrals page at `/ReferredOutTests` can be retired (or redirected to the new surface)
- Every referral has a single FHIR-aligned state visible to validators, lab managers, and the requesting clinician
- No more silent stuck boxes — the aging banner surfaces them
- Reference-lab-not-on-OpenELIS labs are first-class citizens via the Enter result button
- Critical and rejected results route to the Alerts feature for centralized lab-side acknowledgment
- The two systems (Sample Shipment + Reference Lab Results) stay separately responsible but never drift, because they share the Referral table and the Box.Reconciled gate enforces convergence

If you remember nothing else from this primer, again: **Sample Shipment = "where's my shipment?". Reference Lab Results = "where's my result?".** Build accordingly.

---

## 8. Source artifacts

- FRS: `referral-redesign-frs.md`
- Mockup: `referral-redesign-mockup.jsx`
- Visual preview: `referral-redesign-preview.html` (open in any browser)
- Breakdown plan: `referral-redesign-breakdown.md`
- Brainstorm / problem framing: `referral-redesign-brainstorm.md`
- `/analyze` quality report: `referral-redesign-analyze-report.md`
