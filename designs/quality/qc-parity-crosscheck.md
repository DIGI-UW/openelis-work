# Crosscheck: QC parity with SENAITE (Analyzer Maintenance v2 + Runs amendment A1)

**Date:** 2026-10-21
**Inputs:** decision log (`openelis-design-skill-src/references/decision-log.md`, highest local ID D-334 in `upload/`), spec registry, current-state gotchas, Analyzer Maintenance FRS v1.0 (OGC-1015, Ready), Runs FRS v0.4 (OGC-1200, Backlog), S-08 Environmental QC evaluation v2.0 (OGC-554, Done), Test Catalog QC Targets (OGC-1148, In Review), Analyzer Manual QC (OGC-428, Backlog), Batch Workplan reagent QC (OGC-427). Code checked on `develop` at `965d6d1`.

**Verdict:** ⚠ Proceed with coordination. Nothing contradicts an active GLOBAL decision, but the lockout reverses two feature-level choices (OGC-428 non-blocking instrument QC, S-08 "no per-batch QC frequency rules") and both documents write into Runs, which is not built yet. Next step: write both FRSs with the reversals stated and Runs declared as a dependency.

## Footprint

- **Entities:** `Analyzer` (existing: `name`, `is_active`, `bridge_connection_id`, `test_unit_ids`, connection `status` enum INACTIVE/SETUP/VALIDATION/ACTIVE/ERROR_PENDING/OFFLINE), maintenance log (specced in OGC-1015, not in code), Dictionary category `EQUIPMENT_MAINTENANCE_TYPE` (specced), `Alert`, `Analysis.analyzerId` (existing), run and run control record (Runs, not built), `SampleItemQcProfile` (existing: `qc_type`, `parent_sample_item_id`, `expected_value`, `control_lot_id`), `TestQcThreshold` (existing; folding into the Test Catalog QC section per D-058), `Result.qcEvaluation` (existing), `qc_result` / `qc_rule_violation` (Westgard, existing), attachment storage (OGC-811 pattern, D-086).
- **Routes / pages:** `/analyzers`, `/analyzers/maintenance`, `/Results?run=<id>`, Workplan, Test Catalog editor QC section, `/MasterListsPage/WorkPlanConfigurationMenu`.
- **Shared concepts:** run hold and its actions (Retest, Reject, Accept despite with NCE), per-test verdict, control-per-run policy, QC rows excluded from client reports, Alerts and the Home attention feed.
- **Write / state actions:** log maintenance event with certificate, verify event, take an instrument out of service and return it, instrument-test lock set and lifted, add blank or duplicate to a run, apply placement rules or a layout.

## Contradictions (vs decision log and sibling specs)

| Design choice | Decision / spec | Conflict | Severity |
|---|---|---|---|
| A failed instrument-level control holds later results on that instrument | OGC-428 BR-AQC-005 ("manual QC status is informational... does not block") | Reversal. The QA narrative already says "a block on instrument use if FAIL", so the two docs disagree today. Record a new decision and add a supersession note to OGC-428 | HIGH |
| Per-test placement rules that place blanks and duplicates and warn or hold when one is missing | S-08 v2.0 scope ("Per-batch QC frequency rules... not enforced"; user knows their regulation) | Reversal for runs, extending D-054 (which already did this for controls). Rules are opt-in per test, default off, so a lab that does not configure them sees no change | HIGH |
| Maintenance v1 FR-IA-001 menu lists QC Dashboard, QC Alerts, Corrective Actions under Analyzers | D-069 (QC lives under Quality) | v1 predates D-069. v2 aligns, and D-069's child list gains **Maintenance** (amend D-069) | MEDIUM |
| Non-analyzer equipment brought into the register | Maintenance v1 §6.3 (non-analyzer equipment out of scope) | In-spec reversal at Casey's direction (2026-10-21) | LOW |

No contradiction with D-002 (events are archived, instruments deactivated), D-053 (the run hold stays per test; the instrument lock is a new, separate cross-run rule), D-056 (the lock is a known failure, so it holds; absence of QC still neither clears nor blocks), D-112 (no reason field on edits), or MUST B (lab units only, no site filter).

## Overlaps

| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| Runs (OGC-1200) | FR-A3 Held definition, FR-A4 verdicts, FR-C1 control record, FR-C4/C5 hold actions, FR-H1 policy block, FR-B2/B4 batch creation | Both documents add hold reasons and control kinds to the run. The Runs amendment owns every change to the run; Maintenance v2 only publishes the instrument status that Runs reads | HIGH |
| Test Catalog QC section (OGC-1148, In Review, Mozzy) | D-058 blank ceiling and RPD limit; D-054 policy block | Placement rules and on-failure policy for blanks and duplicates land in the same section. Coordinate before OGC-1148 merges | HIGH |
| S-08 evaluation (`QcEvaluationServiceImpl`, `Result.qcEvaluation`, `validation_qc_acknowledgment`) | Blank and duplicate evaluation | D-058 kept the S-08 and run evaluation paths separate "until Runs joins them". The amendment is that join: one evaluator, two entry points (order-entry field QC and in-run lab QC) | HIGH |
| `Analyzer.status` (connection lifecycle) | the word "status" | Service state (In service / Restricted / Out of service) must not be stored in or confused with the connection status. Different label, different field | MEDIUM |
| Westgard (`qc_rule_violation`) | control rejection | A Westgard rejection of a control is a Fail for the lock; a warning (1-2s) is not | MEDIUM |
| Microbiology v3 AST QC (OGC-1528) | QC strain runs on AST instruments | AST QC failures should set the same instrument-test lock, not a micro-only one | MEDIUM |
| Workplan Configuration admin page | named QC layouts | Reuse that page for layouts rather than a new admin page | MEDIUM |
| D-099, D-082 | QC rows never in client reports; aliquot numbering | A lab duplicate is an aliquot `{labNo}-{n}.{m}` with a QC profile and must stay out of client reports and statistics | MEDIUM |

## Dependencies

- **Upstream (declare in FRS):** Runs (OGC-1200, Backlog) for every hold effect; Analyzer Maintenance v1 data (OGC-1015, Ready, not in code; v2 replaces it before build); Test Catalog QC section (OGC-1148, In Review); attachment storage pattern (OGC-811, D-086); privilege catalogue PR #3443 (not merged).
- **Downstream (re-review):** Management Dashboard OGC-897 equipment cards, Home attention feed OGC-896, Validation clearance rule (row QC slot, D-061), Analyzer Manual QC OGC-428, S-08 OGC-554, user manual analyzer pages (OGC-1297 doc review).

## You may be forgetting

- **One instrument status, computed once on the server**, read by run creation, the Results Entry Analyzer picker, the Analyzers list, dashboards and Alerts. No surface derives it on its own.
- **One hold vocabulary.** Instrument holds join the existing QC-fail family on the worklist (one signal per problem, D-105), with the reason naming the instrument and the certificate or control.
- **Certificates are maintenance events**, not a second record type.
- **Translation namespaces:** `analyzer.maintenance.*`, `analyzer.service.*` for Maintenance v2; `run.qc.*` for the Runs amendment.

## Registry upkeep triggered

- Amend the "Analyzer Maintenance & Service" row (entities, shared concepts, non-analyzer equipment in scope).
- Amend the "Runs" row (blank and duplicate kinds, placement rules, layouts, instrument hold).
- Amend the "Environmental QC evaluation (OGC-554 S-08)" row (evaluation joined to runs).
- New decisions (provisional IDs, renumber at registration): instrument service status; instrument-test lock and its release; certificates as events; in-run lab QC; placement rules and layouts; OGC-428 reversal; D-069 amendment.
