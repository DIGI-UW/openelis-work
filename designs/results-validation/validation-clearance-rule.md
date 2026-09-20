# Validation Clearance Rule and Empty-State Explanation — FRS v0.1

**Epic:** OGC-817 (Validation page v4). **Affected slice:** OGC-1029.
**Supersedes:** `designs/results-validation/validation-page-v4.md` **FR-B1** (see §9).
**Companions:** `notes/validation-clear-lane-clarify.md`, `notes/validation-clear-lane-crosscheck.md`.
**Date:** 2026-09-20. FRS is version-agnostic; slicing happens in `/breakdown`.

---

## 1. Lab Context

### Current State

A clinical laboratory does not report a result the moment a machine produces it. A second
person, the validator, looks at every finished result and decides whether it can be released
to the doctor who ordered it. In OpenELIS that review happens on the Validation screen, which
lists every result waiting for that decision, often a hundred or more at the start of a shift.

Most of those results are unremarkable: a haemoglobin of 14 in a healthy adult, a white cell
count square in the middle of its expected range. A few are not: a value far outside the
expected range, a result someone edited after first saving it, a result flagged as dangerously
abnormal that nobody has phoned through to the ward yet, or a result that came from a run where
the laboratory's own quality control material gave the wrong answer. Quality control, or QC,
means running a sample of known value alongside the patient samples to prove the instrument and
reagents were behaving; if the control reads wrong, every patient result from that run is
suspect.

The Validation screen was redesigned to sort those two groups apart automatically. Rows with
nothing concerning go into a **Clear** lane, rows carrying any risk signal go into a
**Needs review** lane, and a single button, **Release all clear**, releases the whole Clear
lane under one electronic signature. The validator then opens only the risky rows one at a time.

### Pain

The Clear lane is permanently empty, on every installation, and the button beside it is
permanently greyed out and reads "Release all clear (0)". A validator watching a screen full of
ordinary in-range results, none of them flagged, none of them edited, cannot release any of them
in bulk and is given no reason why. They go back to opening all hundred rows one at a time, which
is the exact work the redesign existed to remove.

The cause is that clearance requires the system to affirmatively confirm QC passed for the
result, and the field it checks is only ever filled in for a special kind of sample: a blank, a
duplicate or a control sample deliberately added to a batch. An ordinary patient sample never has
that field filled in, so the check never passes and the row never clears. A second, separate
cause affects qualitative tests such as rapid diagnostic tests: a result of "negative" can only
be judged normal if somebody has recorded in the test catalogue that "negative" is the expected
normal answer. Where nobody has, those rows are stuck too.

Nothing on the screen says any of this. The validator sees a broken button.

### What Changes

The validator arrives at the start of the shift, sees that most of the queue has sorted itself
into the Clear lane, checks the handful of flagged rows in Needs review, and releases the rest
with one signature. The work that used to take a hundred clicks takes one review pass and one
button.

Clearance now asks "does anything on this row say stop", rather than "has everything been
positively certified". A control that actually failed still stops the row, and always will. A
control that was never run simply is not a fact about the row, so it no longer blocks it. And
when the Clear lane genuinely is empty, the screen says why, in the queue, so the laboratory
either works the flagged rows or goes and fills in the missing catalogue entry, instead of
reporting a bug.

---

## 2. Overview

This specification changes the rule that decides which rows the Validation queue considers safe
to release in bulk, makes that rule the single rule that automated validation also obeys, and
adds an on-screen explanation whenever the safe lane is empty or the bulk action is unavailable.

It is deliberately small. It introduces no new screen, no new route, no new configuration surface
and no new stored data. Its forward path, tightening the rule again once real per-test quality
control evidence exists, is designed so that the rule itself never has to change a second time.

### Navigation & URL

Unchanged. Verified against the deployed route table on 2026-09-20.

- **SideNav placement:** existing Validation group; no items added, removed or reordered.
- **Breadcrumb:** as shipped for each page; no crumb changes.
- **URL routes:** `/ResultValidation` (Routine), `/AccessionValidation` (By Order, carries the
  **Include auto-validated** toggle), `/AccessionValidationRange`, `/ResultValidationByTestDate`.

---

## 3. User Stories

- **As a validator,** I want the Clear lane to actually contain my ordinary in-range results, so
  that I can release them in one action instead of opening every row.
- **As a validator,** I want a known quality-control failure to keep stopping a row, so that a
  bulk release can never send out a result from a run I know went wrong.
- **As a validator,** when the Clear lane is empty I want the queue to tell me why, so that I know
  whether to work the flagged rows or to fix something in the test catalogue.
- **As a validator,** I want the signature I give on a bulk release to attest to something
  accurate, so that I am not certifying a check the system did not perform.
- **As a laboratory manager,** I want automated validation to obey the same safety rule as the
  bulk button, so that automation can never release what a person is forbidden to release.

---

## 4. Functional Requirements

### A. The clearance rule

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | A row is **Clear** when all of the following hold: it has a known reference range; its value is within that range; it has no open non-conformity; it has not been modified after first save; it is not critical; it is not nonconforming; it has no critical-value acknowledgment pending; and it carries **no quality-control failure**. Any other row is **Needs review**. | Replaces the affirmative QC-pass term of the superseded FR-B1. Every other term is unchanged. |
| FR-2 | The fail-safe posture is retained for every input the row genuinely has. A missing or indeterminate reference range, or a value that cannot be judged against one, excludes the row from Clear. | A row is still never *assumed* clear on an input that exists but is unknown. |
| FR-3 | The absence of a quality-control evaluation is **not** a clearance input. It neither clears nor blocks a row; it is simply not a fact about that row. A recorded quality-control **failure** excludes the row. | The distinction the superseded rule collapsed. |
| FR-4 | An analysis with more than one result component is Clear only when every one of its component rows is Clear. An analysis with no rows is never Clear. | Preserves existing multi-component behaviour. |
| FR-5 | The rule is evaluated server-side, on the rows the queue itself served, for both the lane display and the bulk release, so a bulk release never trusts a client-supplied list. | Preserves the existing guard. |
| FR-6 | The rule exists once, in one shared module, and is stated once in this specification. Every consumer calls it. No consumer re-implements it, client-side or otherwise. | `ValidationSignals.isClear` is that module and already carries its own unit tests. |

### B. Automated validation

| ID | Requirement | Notes |
|---|---|---|
| FR-7 | Automated validation evaluates the rule in FR-1. Anything the Clear lane will not release under a human signature, automation does not release unattended. | One predicate, two consumers. |
| FR-8 | Rows surfaced by the **Include auto-validated** toggle are presented as already released. They are excluded from both lanes and from the "Release all clear (N)" count. | Otherwise N overstates the outstanding work. |
| FR-9 | With the toggle off, behaviour is unchanged: auto-validated rows do not appear. | |

### C. Quality control on the row

| ID | Requirement | Notes |
|---|---|---|
| FR-10 | The review panel carries a quality-control slot that renders **only when a quality-control fact exists** for that analysis. When none exists the slot renders nothing. No constant "not evaluated" placeholder is displayed. | A line that reads identically on every row in every laboratory is noise, and teaches validators to stop reading chips. |
| FR-11 | The existing quality-control failure chip in the "Check before release" column is unchanged in appearance, placement and vocabulary. | It is a flag and a quick reference; acting on a failure happens in the quality-control acknowledgment panel, which is unchanged by this specification. |
| FR-12 | The slot in FR-10 is designed to accept, without redesign, a quality-control verdict from any source: an instrument-reported verdict, a manually entered bench control, or a rapid-test control line recorded as a qualitative valid or invalid outcome. | See §8. |

### D. Explaining the bulk action

| ID | Requirement | Notes |
|---|---|---|
| FR-13 | Whenever "Release all clear" is disabled, the queue displays, adjacent to the button, a short statement of why. The statement is derived from the queue, never configured. | The greyed button with no explanation is the defect this addresses. |
| FR-14 | The explanation distinguishes at least these reasons, and names the count for each that applies: (a) every row carries a risk signal, with the dominant signals named; (b) one or more tests in the queue have no reference value recorded in the test catalogue, so their results cannot be judged; (c) the queue is empty; (d) bulk release is switched off for this laboratory. | (b) is the qualitative case. It is actionable, and naming it sends the laboratory to the test catalogue rather than to a bug report. |
| FR-15 | Where more than one reason applies, the explanation names each with its count rather than collapsing them into a single message. | A laboratory with both problems needs to see both. |
| FR-16 | The bulk confirm dialog carries one line stating what clearance checked and what it did not, which the electronic signature then attests to. | The signature must not imply a check that was not performed. |
| FR-17 | Releasing or retesting from the queue produces a visible confirmation naming what happened and to how many rows. A row leaving the queue silently is not sufficient feedback. | Same empty-feedback family as FR-13; grouped here deliberately. |

### E. Forward compatibility

| ID | Requirement | Notes |
|---|---|---|
| FR-18 | When a per-test control-required policy exists, a test whose policy requires a control per run and has no passing control in its run presents as a **hold**, which is a Needs-review signal in the same family as a quality-control failure. The rule in FR-1 is unchanged by its arrival. | This is why FR-1 is worded as "no quality-control failure" rather than as a policy test. |
| FR-19 | A test with no control-required policy set remains clearable. | Matches how laboratories actually operate; a policy nobody set is not a policy. |

---

## 5. Information & Data

Everything below is data OpenELIS holds today. This specification adds none.

| Information | Where it lives today | Role here |
|---|---|---|
| Whether the result is within its reference range, and whether a reference range is known at all | The result's applicable limit for that patient, specimen and component; the displayed reference range is non-empty only for a numeric limit with authored bounds, or a select-list limit with an authored expected-normal dictionary value | Two clearance inputs (FR-1, FR-2) and the source of empty-state reason (b) |
| Result flag (invalid, critical, abnormal, normal) | Derived from the same limit, shared with Results Entry so the two screens cannot disagree | Clearance inputs |
| Whether the result changed after first save | The analysis revision, stamped 1 on first save and incremented after | Clearance input |
| Whether a non-conformity is open against the analysis | Non-conformity status; a missing status is treated as open | Clearance input |
| Whether a critical-value acknowledgment is outstanding | An open critical-result alert on the analysis | Clearance input |
| Whether a quality-control evaluation exists for the analysis, and its outcome | The per-result quality-control evaluation, populated only where a sample item carries a quality-control profile | **Read as a failure signal only** (FR-3). Its absence is not an input. |
| Failed quality-control samples in scope | The existing quality-control acknowledgment records surfaced on this screen | Unchanged; the acknowledgment panel remains where a failure is acted on (FR-11) |
| Whether an analysis was auto-validated | Existing analysis state consumed by the Include auto-validated toggle | FR-8 |
| Staleness token | The analysis last-updated timestamp round-tripped by the row | Unchanged guard |

**Lifecycle.** Lane membership is computed on every queue load. It is never stored, never chosen
by a user, and has no state of its own.

---

## 6. Access

Accessible via the existing **Validator** role; this feature lives entirely inside that role's
existing workflow and introduces no new capability.

- **View the queue and its lanes:** a Validator.
- **Release a single row, release all clear, reject, retest:** a Validator. Unchanged.
- **A user without the role** does not see the Validation queue at all.
- **When bulk release is unavailable** (no clear rows, or switched off for the laboratory) the
  button is **disabled and visible, never hidden**, so the explanation in FR-13 is readable.
  Hiding the control would remove the very affordance the explanation attaches to.

---

## 7. Localization

Every string below carries an i18n key. Keys marked REUSE already exist and are not re-minted;
search before minting per the key-reuse requirement.

| Key | English fallback | Context |
|---|---|---|
| `label.validation.releaseAllClear` | Release all clear | REUSE. Bulk button. |
| `label.validation.needsReview` | Needs review | REUSE. Lane label. |
| `label.validation.signal.qcfail` | QC fail | REUSE. Row chip, unchanged. |
| `label.validation.emptyState.signals` | All {count} results in this queue carry something to check before release. | FR-14 (a) |
| `label.validation.emptyState.signalsDetail` | Most common: {signals}. | FR-14 (a), names the dominant signals |
| `label.validation.emptyState.noReference` | {count} results are for tests with no reference value recorded in the test catalogue, so they cannot be judged as normal. | FR-14 (b) |
| `label.validation.emptyState.noReferenceHint` | Record an expected normal value for these tests in the Test Catalogue to let their results clear. | FR-14 (b), the action |
| `label.validation.emptyState.queueEmpty` | Nothing is waiting for validation. | FR-14 (c) |
| `label.validation.emptyState.bulkDisabled` | Bulk release is switched off for this laboratory. | FR-14 (d) |
| `label.validation.release.scope` | Clearance checks the reference range, result flags, non-conformities, edits after save and critical acknowledgment, and stops any result with a recorded quality-control failure. It does not confirm that quality control was performed. | FR-16, the confirm-dialog line |
| `label.validation.qc.verdict` | Quality control | FR-10, the row slot label, rendered only when a verdict exists |
| `message.validation.released` | Released {count} results. | FR-17 |
| `message.validation.retestRequested` | Retest requested for {count} results. | FR-17 |

**Retired.** The always-true "QC not evaluated" row string is removed by FR-10. Note the retirement
so the duplicate-and-orphan ratchet does not fail the build.

**Domain variants.** Environmental and vector variants fall back to the clinical string, as for the
rest of this screen.

---

## 8. Dependencies

**None blocking.** Every requirement in sections A to D reads only data the queue already serves.
This is deliberate: it is what makes the affected slice testable again.

Forward dependencies for section E, declared but not blocking:

- **Per-test control-required policy** (control required per run; on a missing control, warn or
  hold), belonging on the test beside its quality-control targets in the Test Catalogue. Already
  in scope for the QC Targets work; not built. FR-18 consumes it and must not define it.
- **Source-typed quality-control results with a qualitative outcome**, so a manually entered bench
  control or a rapid-test control line can be recorded at all. Not built; the manual and reagent
  quality-control routes are placeholders on the current deployment.
- **A per-test verdict within a run**, joining control results to the analyses they cover. Not
  built.

None of the three changes the rule in FR-1 when it arrives.

---

## 9. Supersession

This specification supersedes **FR-B1** of `validation-page-v4.md`, which required an affirmative
quality-control pass as a clearance input. The fail-safe principle FR-B1 established is retained
in FR-2 and applies to every input a row genuinely has. What changes is the treatment of an input
that does not exist for the row at all: FR-B1 read absence as risk, and FR-1 reads it as absence.

A corresponding decision-log entry records the reversal so it is not re-specified later.

---

## 10. Out of Scope

- Any new quality-control authoring surface. The Test Catalogue is where quality-control
  reference data is authored, and this specification adds nothing to it.
- Any per-laboratory configuration switch governing whether quality control is a required
  clearance input. Considered and rejected in favour of the per-test policy.
- The quality-control acknowledgment panel and its workflow, which are unchanged.
- Rejection, referral, the multi-level validation pipeline, and patient-longitudinal delta checks.
- Consolidating the two per-test quality-control reference records in the Test Catalogue. Related,
  separately decided, and owned by the QC Targets specification.
