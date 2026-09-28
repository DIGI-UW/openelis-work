# Validation Clearance Rule — Slicing Guide

> **Non-binding.** A suggestion for the implementer, not a set of tickets. The developer slices.
> Sized for a **Claude Code pipeline**: each slice is one branch, one PR, one review (D-026),
> not a story-point estimate.

**FRS:** `notes/validation-clearance-rule-frs-v0.1.md`
**Mockup:** `validation-clearance-rule-mockup.jsx`
**Preview:** `validation-clearance-rule-preview.html`
**Decisions:** D-056 (clearance on known failure), D-057 (one predicate, two consumers)
**Epic:** OGC-817 · **Fixes the blocked slice:** OGC-1029

---

## Handoff ticket

**Type:** Story, not an Epic. One screen, no new data model, and OGC-817 already exists as the
Epic for this lineage, so a second Epic would nest Epics, which Jira's flat hierarchy does not
support. Linked to OGC-817 with "is part of".

**Labels:** `openelis-global`, `results-validation`, `validation`, `v4`, `frontend`, `fullstack`,
`png-deliverable`, `qc`
**Contract:** CPHL PNG · **Assignee:** mozzy mutesa

---

## Suggested slices

Three PRs, dependency-ordered. Slice 1 alone unblocks OGC-1029's acceptance criteria.

### Slice 1 — A validator can bulk-release the ordinary results in their queue

The clearance predicate itself.

| Covers | What the reviewer is checking |
|---|---|
| FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 | The affirmative QC-pass term is gone and nothing else moved. Absence of a QC evaluation neither clears nor blocks. A recorded failure still blocks. Fail-safe still holds for reference range and range match. Multi-component `allClear` unchanged. Still evaluated server-side on served rows. One module, no second copy of the rule. |

The diff should be small and the unit tests should carry it: the existing `ValidationSignalsTest`
already asserts the old behaviour, so the changed assertions are the specification. Worth adding a
case proving a row with a null QC evaluation and no other signal is now Clear, and one proving a
recorded failure still is not.

**This is the slice that makes OGC-1029 testable.** It can ship alone.

### Slice 2 — The queue tells a validator why it cannot bulk-release

| Covers | What the reviewer is checking |
|---|---|
| FR-13, FR-14, FR-15, FR-16, FR-17 | The explanation is derived from the queue, never configured. Each reason is named separately with its count rather than collapsed. The no-reference-value reason names the action, so a lab goes to the Test Catalogue rather than filing a bug. The confirm dialog line matches the rule actually applied. Release and retest produce visible confirmation. |

Localization for the new keys lands here, in this slice, not as separate work. `npm run i18n:find`
before minting: the no-reference reason may reuse an existing test-catalogue or `common.*` key.

### Slice 3 — Automated validation obeys the same rule, and QC shows only when it is real

| Covers | What the reviewer is checking |
|---|---|
| FR-7, FR-8, FR-9, FR-10, FR-11, FR-12 | Auto-validation calls the shared predicate rather than its own logic. Auto-validated rows sit outside both lanes and outside the count. The constant "QC not evaluated" row display is gone, its i18n key is retired so the orphan ratchet does not trip, and the slot renders only when a verdict exists. The QC-fail chip is untouched. |

Ordered last because it is the slice most likely to surface a surprise in the existing
auto-validation path, and slices 1 and 2 should not wait behind that.

---

## Coverage check

- Every FR appears in at least one slice: **yes.** FR-1 to FR-6 in slice 1, FR-7 to FR-12 in
  slice 3, FR-13 to FR-17 in slice 2. FR-18 and FR-19 are forward-compatibility statements with
  no build in this feature; they are satisfied by FR-1's wording and are checked by review, not
  by code.
- Every mockup element is built by at least one slice: **yes.**
- Every slice is titled and scoped around user value, not a technical layer: **yes.**
- Cross-cutting concerns folded into their user-facing slice: localization in slice 2 (new keys)
  and slice 3 (retired key); access unchanged throughout, so nothing to fold.

## Notes for the implementer

- The rule is the whole feature. If the diff in slice 1 is more than a handful of lines plus test
  changes, something has been misread.
- Do not add a configuration switch for whether QC is required. That was considered and rejected;
  the per-test policy (D-054) is where it belongs, and it does not exist yet.
- Do not read the QC acknowledgment panel into the lane rule. The chip is a flag and a quick
  reference; the panel is where a failure is acted on. They answer different questions.
