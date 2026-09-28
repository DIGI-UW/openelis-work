# Runs — Slicing Guide (non-binding suggestion for the developer)

**Mockup:** `runs-mockup.jsx`
**FRS:** `runs-frs.md` (v0.4, 2026-09-22)
**Preview:** `runs-preview.html`
**Pipeline assumption:** Claude Code (agentic) implementer, so slices are sized to **one reviewable PR each** (D-026), not to story points. Points are given only as a human-team fallback.
**Total slices:** 9
**Human-team fallback:** 3 versions, roughly 66 points, 3 to 4 sprints

The developer slices the work. This guide is the suggested order; every slice is a user-facing capability, dependency-ordered, and covered by FRS acceptance criteria.

> **Re-cut for v0.4.** The v0.2 guide is superseded. Two things it planned no longer exist: a bespoke "what this accept writes" review panel, and the rack-scale triage/all-rows view split. Both were replaced by reuse: the run's rows use the worklist's own filter chips, and a row expands into the Results Entry panel with the analyzer value prefilled. Three contracts it did not carry are now explicit and are sliced below: what Accept leaves behind (D-059), how a run's verdict reaches Validation (D-061), and what happens to the worklist's other filters (D-062).

## Handoff ticket (Epic)

**Title:** Runs: one unit of QC, reagent lot and result review across analyzer, workplan and manual results
**Description summary:** Every result belongs to a run (analyzer message, workplan batch, or a run of one from a manual save). Controls, lot and a per-test QC verdict live on the run; the Results worklist shows waiting and held rows and opens a run as a filtered view with a run header, replacing the separate Analyzer Results Import page.
**Parent / linked program epic:** to be confirmed at ticket creation (candidates: OGC-682 QA Menu Release umbrella, OGC-899 PNG/CPHL Phase II).
**Why Epic, not Story:** several screens (worklist, run header, Workplan, QC Targets section), new data (run record, run-linked controls, Result → run reference), more than one PR.

## v1 — The analyzer run is visible and reviewable

**Fallback estimate:** 24 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 1. Tech sees that a pending row has a value waiting in an analyzer run, and opens that run | 8 | FR-A1, FR-A2, FR-B1 (run created from message, no QC gate yet), FR-D1 (Runs chip, Open count only), FR-D3, FR-E1, FR-E1b, FR-E3 (read-only), FR-E5, FR-E8 | `run.chip.*`, `run.tag.waiting`, `run.header.*`, `run.filters.replaced*` keys; Results rights, lab-unit scoped (D-043); pending-value lookup by accession (Dependency 4); `/AnalyzerResults?id=` redirect, its transition notice and the menu retirement (Dependency 8) |
| 2. Tech works a rack-sized run: whole-run chip counts, paging, and a selection that follows the run rather than the page | 8 | FR-E1a, FR-E6, FR-E11, FR-E11a, FR-E12 | Reuses the worklist's existing chip row; Runs adds only the Held chip and whole-run counts (D-063 fence). Server-side paging and bulk-by-filter-plus-exclusions (Dependency 9). `run.bulk.*` keys |
| 3. Tech opens a row and accepts it as an ordinary result entry, prefilled and editable | 8 | FR-E10, FR-E10a, FR-E13, FR-E14, FR-E7 (critical ack), FR-E9 (concurrency) | **Reuses the Results Entry row panel unchanged** (OGC-811 section D); Runs adds the provenance line, the prefill and tag, and the edited-value provenance. Accept writes entered-not-validated and never releases (D-059). Multi-component rendering, Keep/Replace and critical ack all come from the panel and Import v2, not from new code |

Result after v1: analyzer runs are visible from the worklist, review happens on `/Results?run=`, a 96-position rack is workable, accepted results land in the Validation queue as ordinary result entries, and the old import page redirects. QC is still the existing whole-run gate.

## v2 — The per-test QC gate, holds, and their consumers

**Fallback estimate:** 29 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 4. A failed control holds only that test's rows, on every surface | 8 | FR-A3, FR-A4, FR-C1 to FR-C4, FR-C6, FR-C7, FR-D2, FR-D4, FR-E2, FR-G1 | `run.state.*`, `run.verdict.*`, `run.tag.held`, `run.filter.held` keys; run-linked control record (Dependency 2); QC-fail signal scoped to run and covered test (OGC-1147 consumer); audit `run.audit.testHeld / testReleased / controlRecorded` |
| 5. Tech dispositions a held test: Retest, Reject, or Accept despite QC failure with an NCE | 8 | FR-C5, FR-A3 (Superseded), FR-A5, FR-A6, FR-G6 | `run.link.retestOf / supersededBy`; NCE pre-population from the run; audit `retestRequested / rejectedQc / acceptedDespiteQc / completed / superseded`; Accept-despite available to Results rights and logged |
| 6. Validator sees the run's QC verdict and provenance on the Validation row | 5 | FR-G3 | **Cross-team.** Runs supplies the verdict into the slot `validation-clearance-rule` FR-10/FR-12 defines and does not render it (D-061). Fuller provenance fills the existing Reagents, QC and Controls section. D-056 and D-057 untouched; no run-sourced exemption from automated validation. Coordinate with OGC-1226 (Mozzy) before starting |
| 7. Exceptions are resolved on the run header | 5 | FR-E4 | Reuses the existing exception queue and the Analyzer Types & Mapping deep link |
| 8. Quality officer sets the control-per-run policy on the test | 3 | FR-H1, FR-H2, FR-H3 | `admin.testCatalog.qcTargets.policy.*` keys; Admin and Test Catalog Manager edit, others read-only; extends `test_qc_target` (Dependency 3). Can ride with slice 4 |

Result after v2: the analyzer path is complete on the new surface with per-test holds, and the validator can see why a row was held or accepted despite a failure. Import v2 FRs are all delivered or consumed.

## v3 — Manual runs: workplan batches and runs of one

**Fallback estimate:** 13 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 9. Tech records a manual result and its lot and control once per run: a workplan batch is a run, a single save is a run of one, and "Batch these" makes a run from the worklist | 13 (split if human team: 9a workplan-as-run 8, 9b run-of-one and Batch these 5) | FR-B2 to FR-B5, FR-D5, FR-D6, FR-D7, FR-E3 (lot selection, Use last-used lot, Mark complete), FR-F1, FR-G2, FR-G4, FR-G5 | `run.tag.batched`, `run.action.batchThese`, `run.action.markComplete` keys; Workplan batch service exposed (Dependency 7); Results Entry section D re-scoped to the row's run (OGC-1025 slice); reagent consumption per accepted result carries the run's lot; QC dashboard run list link |

Result after v3: every result created after ship references a run; OGC-427 and OGC-1147 consume the run; the QC dashboard's source filter lists runs from all three sources.

## Coverage check

- Every FR from the FRS appears in at least one slice: yes. FR-A1–A6, B1–B5, C1–C7, D1–D7, E1, E1a, E1b, E2–E14, F1, G1–G6, H1–H3 are all assigned above.
- Every UI element in the mockup is built by at least one slice: yes. Runs chip and popover (1), waiting tag (1), filter-replacement notice (1), chip row with whole-run counts and pagination (2), bulk bar and run-scoped selection (2), expanded Results Entry panel with prefill and edited treatment (3), held tag and Held chip (4), run header QC block and Record control (4, 5), Exceptions block (7), Run settings (1, 9), batched tag and Batch these (9).
- Every slice is titled and scoped around user value, not a technical layer: yes.
- Cross-cutting concerns folded into their user-facing slice: localization per slice; access per slice (Results rights, lab-unit scoped throughout; Admin and Test Catalog Manager for slice 8 only).
- Dependencies honored: slice 1 needs the run record and Result → run reference (Dependency 1) and the accession lookup (Dependency 4); slice 2 needs server-side paging and bulk-by-filter (Dependency 9); slice 4 needs the run-linked control record (Dependency 2) and the QC Targets store (Dependency 3); slice 9 needs the Workplan batch service (Dependency 7). No slice needs a later slice.

## Notes for the implementer

- **Two regions of the mockup are not designs.** The filter chip row and the expanded row panel are fenced in the mockup and preview with a "reuse, do not re-implement" marker (D-063). Build them from the shipped components and take their real contents from the live app and their owning specs; where the artifacts differ from the live app, the live app is right (D-008). What Runs actually specifies there is the Held chip with whole-run counts, and the provenance line, prefilled tagged value and edited-value treatment. Slices 2 and 3 are small precisely because of this; if either starts to look like a rewrite of a shipped component, stop and re-read FR-E1a and FR-E10.
- **Accept is not a release.** Accept writes an entered, unvalidated result and hands it to the one clearance predicate like any other row (D-059, D-057). Do not add a run-specific bypass, and do not exempt run-sourced rows from automated validation either. Slice 3 is where this is easy to get wrong.
- **Storage is yours to decide, with one constraint.** The FRS describes the run as information. OGC-1054 (repo, authoritative) says `QcRun` is not part of the target architecture and openelis-work data-model suggestions are not implementation direction (D-055). Decide the run record's storage together with OGC-1147 D1 (Samuel) so there is one answer, and record it in the PR or a dev-notes ADR.
- **Coordinate four tickets.** OGC-1147 (control results and QC-fail signal scope), OGC-1025 (Results Entry section D re-scope), OGC-427 (batch as run) and **OGC-1226 (the Validation clearance rule, whose FR-10/FR-12 slot slice 6 fills)** are live. Slice 6 should not start before OGC-1226's slot exists.
- **i18n.** Constitution v1.11.1 Principle VII: run `npm run i18n:find` before minting any key in the FRS string table; `common.*` rows are pending PR #3863. Runs mints nothing in the `label.validation.*` namespace; anything rendered on the Validation page uses that page's keys.
- **Slice 1 is the risky one.** It changes IA (redirect, menu retirement) and introduces the run record. Ship it behind nothing new; the existing reagent-lot gate and Results rights are the only flags involved.
