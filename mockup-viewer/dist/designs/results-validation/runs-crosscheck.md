# Crosscheck: Runs (shared unit of QC, reagent lot and result review)

**Verdict: Proceed with coordination.** Nothing contradicts an active GLOBAL decision, but the run's storage collides with a statement in the engineering repo's authoritative analyzer spec (OGC-1054: "`QcRun` is not part of the target architecture"), and the four sibling specs this FRS touches are not in the spec registry at all, so overlap matching against them was done by hand. Recommended next step: write the FRS with the run described as information, not as a table, declare it as a named Dependency, and put the storage question on Samuel's OGC-1147 D1 with OGC-1054's constraint quoted.

Run 2026-09-09 against `spec-registry.md` (38 rows), `decision-log.md` (D-001 to D-051), `current-state-gotchas.md`, and the upstream constitution (now v1.11.1; the skill pointer is synced to v1.10.0, see upkeep).

## Footprint

Entities: Analysis, Result (incl. `RESULT.component_id`), Test, TestSection / Lab Unit, Analyzer, ReagentLot / ReagentConsumptionEvent, the existing import models (`QCSample`, `RunQCStatus`, `ImportedResult`, `RunSettings`), Westgard `qc_result` / `qc_control_lot` / `qc_rule_violation`, the specced `QcRun` (OGC-427 / OGC-428, not yet in code), `test_qc_target` (QC Targets spec, not yet in code), Workplan / batch, NonConformity, Alerts (critical ack), SystemUser.

Routes and pages: `/Results` (worklist, gains `?run=` filter and Runs / Held chips), `/AnalyzerResults?id=` (to redirect), the generated Results ▸ Analyzer menu entries (OGC-1178, to retire), Workplan pages (gain "Batch these" creating a run), Test Catalog editor QC Targets section (gains control-per-run policy), the Analyzers list overflow (Import link retargets to `/Results?run=`).

Shared concepts: QC verdict and QC-fail signal, reagent lot provenance, "in review by X" presence, correction workflow, critical acknowledgment, contrast tags, exception queue, lab-unit scoping.

Write, state and hold actions: create run (three sources), record control per run, evaluate per-test verdict, hold and release rows, Retest / Reject / Accept-despite (files NCE), Keep / Replace / Ignore on duplicates, Batch these, run state transitions Open → Held → Complete → Superseded.

## Contradictions (vs decision-log and upstream constraints)

| Design choice | Decision / constraint | Conflict | Severity |
|---|---|---|---|
| Earlier working assumption that `QcRun` grows into the run record | OGC-1054 Analyzer Management spec (repo, authoritative for engineering): "`AnalyzerQcRule` and `QcRun` are not part of the target architecture"; openelis-work data-model suggestions "are not implementation direction" | The FRS must not prescribe `QcRun` as the run table. Describe the run as information and declare it as a Dependency; storage is engineering's call under OGC-1147 D1 | HIGH (would be CRITICAL if written into the FRS as a directive) |
| Retiring the generated Results ▸ Analyzer menu entries | D-027 (Analyzers is a top-level SideNav group with per-analyzer subpages) and D-043 (the two-level access rule is "consumed by the generated menu, the import page and the Pending Imports inbox") | Not a reversal: D-043's rule still applies, it is consumed by the Runs chip and run header instead of a generated menu. D-027 is untouched (the Analyzers group keeps its list, types, errors, QC, maintenance). Record the consumer change explicitly so D-043 does not read as violated | MEDIUM |
| Run header dissolves the QA/QC sidebar and OGC-428's Manual QC banner into one QC block | D-005 (inline expansion, no modals), D-011 (Result Entry panel additions are inline rows, not Accordions) | Compatible, provided the QC block is a Tile stack and per-row run info is an inline row in the reference zone, not an Accordion | LOW |
| "Held" and "Waiting" tags on the worklist | Addendum convention "selected items show labels, not counts" | Compatible; chips must show the run ids or labels on expansion, not only a count | LOW |

No contradiction with D-001, D-002, D-004, D-006, D-007, D-009, D-012 or D-044. D-044 is reinforced: the run surfaces gate on per-lab-unit Results rights, never on Analyser Import.

## Overlaps (vs sibling specs; the registry has no rows for any of them, see upkeep)

| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| Analyzer Results Import v2 (OGC-288) | Whole page: QC-first panel, Run Settings, exceptions, G1 to G13 | This FRS takes over Overview/IA, G1 and run-level QC scope; every other FR survives and is consumed. Needs a supersession note at the top of the v2 FRS and a re-scope of OGC-288 (Vishal's draft PR #2584 was closed unmerged in May; no active build) | HIGH |
| Results Entry multicomponent (OGC-811) | Section D Reagents, QC and Controls; FR-B2 provenance; FR-O concurrency | Lot and control move from "this row" to "this row's run". FR-D3/D4 capture UI is unchanged; its scope changes. Needs a supersession note; OGC-1025 (R6, Samuel) is the affected slice | HIGH |
| Manual and RDT QC persistence (OGC-1147, Samuel) | Source-typed QC results, target prefill, QC-fail signal scope, D1 to D5 | FR-C1's "same test + lab unit + session window" becomes "same run". D1 must now satisfy three consumers (Results Entry, run header, QC dashboard) and OGC-1054's constraint. Coordination item for Samuel, not a rewrite | HIGH |
| Batch Workplan reagent QC (OGC-427) | Batch, reagent lot QC, `QcRun` vocabulary | The batch becomes a run (source WORKPLAN); its control is the run's control and its results carry the run id. "Batch these" from the worklist is a new entry into this feature | HIGH |
| Analyzer Manual QC Recording (OGC-428) | Import page real estate; `QcRun` vocabulary; QC frequency rule | Stays instrument-level and outside the run model; its status line moves into the run header's Run settings block when the source is an analyzer. Reuse its DAILY / PER_SHIFT / CUSTOM_HOURS rule if a run-timeout is ever needed (not in v1) | MEDIUM |
| Test Catalog QC Targets and LOD/LOQ | `test_qc_target`, prefill precedence | Gains two policy fields (control required per run; on missing: warn or hold). Its FR-D1 snapshot rule now snapshots onto the run's control record | MEDIUM |
| Analyzer Results Lab Unit Access (OGC-1178, registry row exists) | D-043 two-level gate, generated Results ▸ Analyzer menu, `/AnalyzerResults?id=` | Menu entries retire; gate consumed by the Runs chip and `?run=` filter. Registry row's routes column needs updating; OGC-1178 is Ready, not built, so this is a spec change not a rework | MEDIUM |
| Westgard Phase 2 / QA dashboard (OGC-682, OGC-685) | `qc_result`, `qc_control_lot`, L-J, violations | Quantitative manual controls recorded on a run still need to reach the statistics store; this FRS consumes, does not redefine | MEDIUM |
| Critical Result Acknowledgment (registry row) | Pending-ack Alerts task on accept | Reused unchanged (import G6 already says so) | LOW |
| Inventory redesign (registry row) | ReagentLot, consumption events, D-037 auto-consume from Test↔Reagent link | Lot per run creates one consumption event per accepted result, same as today; confirm auto-consume still fires per result, not per run | LOW |
| NCE module | Accept-despite files a pre-populated NCE | Reused unchanged | LOW |

## Dependencies

Upstream, must exist first (declare in FRS Dependencies):

- A persisted run record with id, source, state, lab unit, operator, time span, and per-test verdicts, referenced from Result or Analysis. Not built; not `QcRun` per OGC-1054. Storage is OGC-1147 D1's call.
- Source-typed control results (OGC-1147, in progress) and the QC Targets store (`test_qc_target`, specced, not built).
- `RESULT.component_id` runtime linkage (OGC-1124, Done) and target→component ingestion (OGC-1129, Done).
- Results Entry per-row save and presence ("in review by X", FR-O1 to O3, OGC-1020).
- Pending-import lookup by accession so the worklist can show "Waiting in RUN-x" (new; belongs to the re-scoped OGC-1137).

Downstream, affected and needing re-review: OGC-288, OGC-1137, OGC-1025, OGC-1147, OGC-427, OGC-1178, the QC Targets spec, and the Validation page (consumes the QC-fail signal; scope of the signal changes from window to run).

## You may be forgetting

- One "run verdict" component rendered identically in the run header, the Runs chip popover and the QC dashboard's run list. Build it once.
- One "run reference" affordance (id, source icon, state tag, link) used by the worklist tags, the History section of a result, the NCE that Accept-despite files, and the Validation page's hold reason.
- A shared i18n namespace for the run vocabulary so OGC-1147, OGC-427 and this FRS stop each minting Pass / Fail / Valid / Invalid. Constitution v1.11.0 now mandates search-before-mint and `common.*` reuse; `common.*` itself is still pending PR #3863.
- Audit verbs: one namespace for run events (created, control recorded, held, released, accepted-despite, superseded) so the three creation paths do not each invent their own.

## Registry and governance upkeep triggered by this run

- Registry gaps: no rows exist for Results Entry (OGC-811), Analyzer Results Import v2 (OGC-288), Batch Workplan reagent QC (OGC-427), Analyzer Manual QC (OGC-428), Manual/RDT QC persistence (OGC-1147), QC Targets, or Westgard Phase 2. Add all seven plus a Runs row; without them `/crosscheck` matched only one row (OGC-1178) for a feature that touches eight.
- Candidate decisions: (a) a run is the unit of QC, reagent lot and result review with exactly three creation sources; a manual entry is a run of one; (b) QC verdicts are per test within a run; (c) control-per-run policy lives on the test in QC Targets; (d) "Run" is the UI noun, "Batch" only the workplan verb.
- Constitution pointer: upstream is v1.11.1 (2026-09-07); skill pointer says v1.10.0. Re-sync needed: v1.11.0 added Principle VII Key Reuse and Hygiene (affects every Localization table); v1.11.1 corrected the frontend data-fetching stack (SWR removed, TanStack Query v4 adopted target).
- `verified-data-models.md` has no entry for `QcRun`, `qc_result`, `qc_control_lot`, `QCSample` or `RunQCStatus`; the QC stores should be added before OGC-1147 D1 is decided.

All upkeep is owed to the repo copies (`OpenELIS Feature Design/openelis-design-skill-src/references/` and `skills/openelis-design/references/`), not the synced skill directory; no workspace folder is connected in this session so it is outstanding.
