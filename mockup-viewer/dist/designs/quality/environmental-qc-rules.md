# S-08 — QC Result Evaluation & Validation Warning
## Functional Requirements Specification — v2.0

**Version:** 2.0 (significant rewrite of v1.0)
**Date:** 2026-04-25
**Status:** Draft for Review
**Jira:** [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Related:** S-03 v2.0 (QC sample creation), S-05 (Compliance Evaluation Engine — same pattern, parallel evaluator), S-06 (Laporan Hasil)
**Supersedes:** v1.0 — original spec covered four things: (a) QC Protocol Configuration admin, (b) QC Sample Creation at order entry, (c) QC Result Evaluation, (d) QC Warning at validation. v2.0 covers only (c) and (d). (a) was dropped per the 2026-04-25 design decision (user knows their regulation's QC frequency requirements; no admin enforcement). (b) is now in S-03 v2.0 §5.3.2 (QC Quick-Add buttons).

---

## 1. Overview

When a QC sample (Blank / Duplicate / Control) flows through to the bench and accumulates results, the system SHALL evaluate those results against type-specific acceptance criteria and surface failures to the validator before result release.

Acceptance criteria evaluated:
- **Blank** — result must be ≤ blank threshold (configured per-test, e.g., method detection limit). Failure = potential contamination.
- **Duplicate** — Relative Percent Difference (RPD) between parent sample and duplicate must be ≤ RPD threshold (per-test). Failure = poor measurement precision.
- **Control** — measured value must be within recovery window (per-test, default ± 20% of expected). Failure = matrix interference or analytical bias.

QC failures generate a **non-blocking** warning at the validation screen. The validator must acknowledge the failure with justification before releasing results.

## 2. Scope

**In scope:**
- QC evaluation function (parallel to S-05's `evaluateCompliance()`) — `evaluateQc(sample, result)`
- Per-test acceptance thresholds: blank threshold (numeric per-test), RPD threshold (% per-test), recovery window (% per-test)
- Storage of QC evaluation outcome on the result entity (`qcEvaluation`: PASS / FAIL / N/A)
- "QC Status" column on the Results Entry expanded panel (alongside the Compliance column from S-05)
- Validation screen QC warning banner with required justification + acknowledgment
- Laporan Hasil consumes QC pass/fail summary for the certificate's QC section

**Out of scope:**
- QC Protocol Configuration admin (DROPPED from v1.0 per 2026-04-25 — user knows requirements, no enforcement)
- QC Sample Creation (now in S-03 v2.0 §5.3.2)
- Per-batch QC frequency rules ("you need N more blanks") — not enforced
- EQA / proficiency testing — separate flow
- CRM/LRM material registry — lab tech enters expected value inline at S-03 v2.0 §5.3.2

## 3. Functional Requirements

**FR-01 (Acceptance thresholds on test catalog).** The test catalog admin form SHALL include three optional fields per test (env/vector only):

| Field | Type | Default | Notes |
|---|---|---|---|
| `qcBlankThreshold` | NumberInput (test units) | null | Failure if blank result > this |
| `qcRpdThreshold` | NumberInput (%) | 20 | Failure if duplicate RPD > this |
| `qcRecoveryWindowPct` | NumberInput (%) | 20 | Failure if control recovery outside ± this from expected |

**FR-02 (`evaluateQc()` function).** Triggered at result save time when `sample.qcType ≠ null`. Logic per QC type:

```
BLANK:     pass = (result_value ≤ qcBlankThreshold)
DUPLICATE: rpd = abs(parent_value - dup_value) / mean(parent_value, dup_value) * 100
           pass = (rpd ≤ qcRpdThreshold)
CONTROL:   recovery = (result_value / expected_value) * 100
           pass = (100 - qcRecoveryWindowPct ≤ recovery ≤ 100 + qcRecoveryWindowPct)
```

The evaluation result is stored on the Result entity as `qcEvaluation` (enum: PASS, FAIL, N_A) and `qcEvaluationDetail` (free-text computed metric, e.g., "RPD = 24.3% (threshold 20%)").

**FR-03 (Results Entry display).** The Results Entry expanded panel SHALL show a "QC Status" indicator next to each result row whose sample is a QC sample:
- Green ✓ "QC Pass"
- Red ✕ "QC Fail — {detail}"
- Gray "QC N/A" (when threshold not configured)

For client samples linked to a QC duplicate (parent), the parent row shows a small "↺ duplicate available" tag with click-to-expand showing the RPD calculation.

**FR-04 (Validation warning).** When validating a batch where any QC sample has `qcEvaluation = FAIL`, an `InlineNotification` (kind="warning") banner SHALL appear at the top of the validation screen:

> "QC failures detected: {N} of {M} QC samples failed acceptance criteria. Review and acknowledge below before releasing results."

Below the banner, a list of failing QC samples with their `qcEvaluationDetail` is shown. The validator MUST:
- Check an "I have reviewed the QC failures" acknowledgment checkbox
- Enter a justification (TextArea, max 500 chars, required)

before the "Release Results" button is enabled. The acknowledgment + justification are recorded in the audit trail.

**FR-05 (Laporan Hasil integration).** The Laporan Hasil report (S-06) SHALL include a QC Summary section listing each QC sample in the batch with its type, acceptance result, and computed metric. Failed QC samples are flagged with a footnote.

## 4. Data Model

```sql
ALTER TABLE test ADD COLUMN qc_blank_threshold NUMERIC;
ALTER TABLE test ADD COLUMN qc_rpd_threshold NUMERIC DEFAULT 20;
ALTER TABLE test ADD COLUMN qc_recovery_window_pct NUMERIC DEFAULT 20;

ALTER TABLE result ADD COLUMN qc_evaluation VARCHAR(10);  -- PASS | FAIL | N_A
ALTER TABLE result ADD COLUMN qc_evaluation_detail VARCHAR(500);

CREATE TABLE validation_qc_acknowledgment (
  id BIGSERIAL PRIMARY KEY,
  validation_id BIGINT NOT NULL REFERENCES validation(id),
  acknowledged_by_user_id BIGINT NOT NULL REFERENCES user(id),
  acknowledged_at TIMESTAMP NOT NULL,
  justification TEXT NOT NULL
);
```

## 5. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/results/{id}/evaluate-qc` | Trigger QC evaluation (idempotent) |
| GET | `/api/v1/orders/{id}/qc-summary` | List QC samples + their evaluations for a batch |
| POST | `/api/v1/validations/{id}/qc-acknowledgment` | Submit acknowledgment + justification |

## 6. Acceptance Criteria

- [ ] Three QC acceptance threshold fields on env/vector tests in catalog admin
- [ ] `evaluateQc()` runs at result save time
- [ ] Result entity persists `qcEvaluation` + `qcEvaluationDetail`
- [ ] Results Entry shows QC Status indicator
- [ ] Validation screen blocks release until QC failures are acknowledged with justification
- [ ] Laporan Hasil includes QC Summary section
- [ ] Audit trail records acknowledgment + justification
- [ ] Pure result-evaluation focus — no admin protocol page, no sample-creation flow (those are in other specs)

## 7. Notes

- ~30% the size of v1.0 because we dropped Protocol Config and Sample Creation.
- Parallel pattern to S-05: `evaluateQc()` mirrors `evaluateCompliance()`, both extending the existing `evaluateResult()` clinical-flag pattern. Three evaluators run side-by-side at result save time.
