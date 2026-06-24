# QA Report Template

> Step 5 produces a report in this structure. Save as `qa-report-[instance]-[YYYYMMDD-HHMM].md`.
> The report is **maturity- and acceptance-criterion driven**, not just a pass count — that's
> what makes it honest about how complete a module is.

---

## 1. Header
- **Instance / URL**, app version (from the footer or `/actuator/info` if available)
- **Date/time**, tester (agent), skill version
- **Run tier:** smoke / standard / full (see SKILL.md)
- **Suites run** (letters/ranges) and **Data Census result** (from Step 0.6 — or "instance empty, render-only" if reset)
- **Calibration result** (Step 0.5 — which known issues were re-verified and their current state)

## 2. Summary table
| Module | Suites | Pass | Fail | Blocked | Gap | **Maturity (M0–M5)** | Top issue |
|---|---|---|---|---|---|---|---|

- **Maturity is mandatory per module** (Section 5.5 rubric). A module is rated at the lowest
  M-level any sub-feature hits.
- A module whose phase reported only **RENDER** acceptance criteria is capped at **M1**,
  regardless of pass count (Section 7.6).

## 3. Per-suite results
For each TC: `TC-ID | scenario | result (PASS/FAIL/BLOCKED/GAP) | acceptance criterion (RENDER/FUNCTION/PERSIST/ROUND-TRIP/CROSS-LINK/REPORTABLE) | note`.
- Any result above RENDER must include its **evidence** (read-back diff, cross-module check, PDF excerpt). A higher-tier claim without evidence is downgraded to RENDER.

## 4. Chains, Personas, Reconciliation
- **Chains** (Section 11 / workflows.md): each as PASS/PARTIAL/FAIL with module-level floor rating; note API-substituted legs and BLOCKED steps with the bug id.
- **Personas** (Section 12): PASS only if completed via documented UI paths with no workarounds; record where a hidden prerequisite forced a FAIL.
- **Y-RECON** (Section 13): each Dashboard KPI vs its backing list — `counter == len(list)` PASS/FAIL.

## 5. Failures requiring attention
For each **new** FAIL (one that passed bug-triage — see `bug-triage.md`):
- Environment, TC ID, exact step, expected vs actual, severity, screenshot/capture ref.
- The 2-of-3 bug-revalidation evidence (fresh tab / re-login / 3× API) confirming it's not transient.
- Jira key if filed, or formatted bug report if Jira unavailable.

## 6. Gaps & partial features
- GAP = feature absent/unreachable. Partial = renders but incomplete (cite maturity + the failing signal from the Partial-Feature Audit).

## 7. Appendix — full action log
- Timestamped action log with screenshots; the raw census/calibration captures.

---

## Acceptance Criteria tiers (reference — Section 7.6)
RENDER < FUNCTION < PERSIST < ROUND-TRIP < CROSS-LINK < REPORTABLE. Each TC declares one;
the tier gates the maturity a module can claim. Only-RENDER ⇒ M1 cap.

## Maturity rubric (reference — Section 5.5)
M0 Stub · M1 Form-only · M2 Saves (same-endpoint read-back) · M3 Round-trips (different
endpoint/screen) · M4 Cross-links (module A affects module B) · M5 Reportable (compliant
output: branded PDF, validated FHIR, audit trail). Module = lowest sub-feature level.
