# openelis-test-catalog-qa — Changelog

## v7.0 (2026-06-18) — Structural: evergreen skill vs. time-varying state

Root-cause fix for recurring staleness: separated **evergreen methodology** from **state**.
- SKILL.md slimmed from ~1485 lines to a lean methodology file; grading language (acceptance
  tiers, maturity rubric, round-trip rule, error handling, blocking etiquette) kept inline.
- Bundled the previously-missing skill-owned files: `references/suite-catalog.md` (the 205-row
  master table + phases + non-admin route discovery) and `references/report-template.md` (NEW,
  now wires in the 7.6 acceptance tiers + 5.5 maturity that Step 5 never enforced).
- Moved state out of the skill: **Known-Bugs table removed** → `references/bug-triage.md`
  (Jira is source of truth; before filing, run the `openelis-bug-revalidation` 2-of-3 gate +
  Jira search). Validation History → `references/validation-history.md`. Change log → this file.
- Extracted `references/workflows.md` (Chains/Personas/Y-RECON/Partial-Feature Audit) and
  `references/playwright-harness.md` (Carbon workarounds + Playwright rules + operational
  hazards + where the harness repo lives; canonical = one spec per chain, legacy single-file noted).
- Harmonized: Section 4 admin URLs now defer to `openelis-design/admin-ia-inventory.md`;
  built-vs-not → `current-state-gotchas.md`/`spec-registry.md`; Carbon root-cause →
  `carbon-anti-patterns.md`; a11y depth → `accessibility-review` skill.
- Wired `openelis-bug-revalidation` into Step 6 (not just calibration).
- Added explicit two-substrate guidance (Chrome vs Playwright) and smoke/standard/full run tiers.
- Stable H1 (no inline version sprawl); tightened description; removed contradictory suite counts
  (catalog is the inventory source of truth).

---


### v6.13 (2026-05-13) — v6.12 corrections applied in-place + Chain I rewrite
Closes the loop opened by v6.12. The v6.12 PR documented the 10 spec corrections via `apiShapes.ts` and shipped them as a sidecar patch file (`helpers/_common-v612-patch.ts`) without editing the chain/persona specs in place. v6.13 applies the corrections directly:

- `tests/chains/_common.ts`: `findOrSeedOrder` now reads `patientSearchResults` (not `patientList`), uses `patientID` (not `patientPK`) on object property reads, `ChainOrderRef.patientID` field renamed. `acquireAnyAccession()` and `eqaEnabledRequiresJspNotRest()` folded in from the sidecar.
- Across all 12 chain specs + 6 persona specs: mechanical replacement of `patientList`→`patientSearchResults`, `patient.patientPK`→`patient.patientID`, `patientProperties.nationalId`→top-level `nationalId` on SampleEdit, `?testSectionId=N`→`?testUnitId=N` on Logbook filter URLs. (URL params `?patientPK=` and POST-payload sending keys `{patientProperties: {patientPK: ...}}` retained pending live capture confirmation — left as TODO.)
- `tests/chains/chain-i-site-branding-to-report.spec.ts` rewritten end-to-end. The original premise "PDF reports show 'null' when SiteInformation.labName is missing" was based on the assumption that labName lives in site-branding or SiteInformation — neither was true per the pilot. The rewritten Chain I tests what IS testable today: site-branding round-trip (read → modify primaryColor → confirm → restore). Reduced from 6 steps to 4 steps. The labName/PDF check moves to a future chain that drives the JSP admin form via Playwright UI.
- `helpers/_common-v612-patch.ts` deleted.

After v6.13 the chains are runnable end-to-end at the spec level — though several still depend on live capture for the SamplePatientEntry POST shape and the eqaEnabled JSP form interaction.

### v6.12 (2026-05-13) — Phase A1 pilot + spec corrections grounded in live capture
The v6 methodology was run live against testing.openelis-global.org for the first time. 35 minutes of live Chrome time surfaced 3 candidate real findings (NEW-1 Y-RECON mismatch, NEW-2 ReportPrint 500, NEW-3 FHIR metadata HTML shell) and 10 spec bugs in the chains and personas. The methodology is doing its job — §13 Y-RECON caught NEW-1 on first try; §6.5 stopped me filing the false-positive endpoint paths I'd inferred from documents.
The single most important lesson: every one of the 10 spec bugs was the author (me) inferring an endpoint shape from documents rather than from live capture. **§6.5b "Use captureAround when authoring NEW spec steps" closes that gap** — the network capture helper from v6.10 is now mandatory at authoring time, not just at bug-filing time.
Added:
- §6.5b authoring-time capture rule with a code snippet showing the pattern.
- `helpers/apiShapes.ts` as single source of truth for the corrected response shapes: `patientSearchResults` key, `patientID` field, `birthdate` field, `labUnitList` for lab section IDs, `testUnitId` logbook filter param, `SampleEdit` Struts form top-level fields, `site-branding` schema (no `labName`), FHIR base path candidates, EQA enablement only at JSP not REST.
- `_common.ts` corrections: `findOrSeedOrder` reads the right keys; new `acquireAnyAccession(page)` helper that turns the Y-RECON Dashboard-vs-Logbook gap into a single clear assertion result.
- 3 new candidate findings (NEW-1, NEW-2, NEW-3) added to the bug table.
- BUG-14 marked as possibly regressed pending live retest.
- The full pilot session report is `pilot-2026-05-13-session-report.md` in the repo.
Module maturity downgrades from live evidence: Order Workflow M1.5 → M1, Dashboard M2 → M1.5, Reports M2 → M1.5, FHIR M3 → M1.5. The `maturity-dashboard.html` should be regenerated.
Workplan status: A1 ✅. Remaining: A1 follow-up retests on NEW-1/2/3 with corrected specs, Phase D spec-walks, Phase E3-E7 tooling, Phase F upstream PRs.

### v6.11 (2026-05-13) — Phase C: all 6 §12 Personas implemented
- 6 new specs under `tests/personas/`. Each is a day-in-the-life walk-through for one role, written as a single test.describe.serial that fails cleanly when the role hits a hidden requirement, missing UI path, or broken cross-module link.
- PA Receptionist (~190 lines, 6 steps): patient search → create → order → barcode print. Catches BUG-37 at Step 5 (the receptionist hands off an order whose patient isn't linked).
- PB Bench Tech Hematology (~140 lines, 4 steps): Workplan filter → result entry × N → round-trip → bulk-save normals. API-substituted per §11.5 because BUG-31 hangs the Carbon Accept checkbox.
- PC Validating Biologist (~110 lines, 4 steps): Validation queue → reject one for retest with note → validate rest → confirm on Patient Results. Depends on PB having entered something.
- PD Lab Manager (~150 lines, 5 steps): Dashboard → KPI vs underlying-list reconciliation (§13) → Rejection Report PDF (BUG-29 catch) → Statistics Report PDF (BUG-42 catch) → TAT sanity.
- PE QA Officer (~150 lines, 5 steps): NCE Dashboard → BUG-29 sanity check (zero NCEs + rejections today = silo confirmed at people layer) → corrective action → quarterly Non-Conformity report → CAP/CLIA cold-chain compliance footer.
- PF Lab Administrator (~200 lines, 6 steps + afterAll cleanup): site branding round-trip → barcode config → TestAdd (BUG-1/BUG-12 catch) → **enable EQA (the hidden-requirement catch that previously cost 7 cancelled tickets, OGC-518–524)** → create restricted user (BUG-3 catch) → User Manual PDF link.

All 6 personas marked ✅ in §12. Workplan Phase C status: complete. Remaining workplan items: D (FRS spec-walks), E3–E7 (more tooling), F (reports + upstream), A1 (live pilot).

### v6.10 (2026-05-13) — Phase E2 Live Network Capture Helper
- `helpers/networkCapture.ts` — new module turning §6.5 from "discipline" into "harness-enforced contract." Exports `startCapture`, `captureAround`, `saveAsEvidence`, `assertBugEvidence`, `assert404Observed`, `summarize`.
- §6.5a added with usage example. Tests that mark a 404 as FAIL without first calling `assertBugEvidence` (which throws if the app never actually called the claimed-broken path) should be considered incomplete.
- Auth/cookie headers automatically redacted in saved evidence files, so capture JSON is safe to commit and safe to paste into Jira tickets.
- Closes the loop on the 2026-04-20 false-positive cluster (OGC-535/562/563/565/566/568) at the infrastructure level — the next time someone tries to file a 404 bug against a path the app doesn't call, the harness blocks the bug ticket with a descriptive error pointing at the actual paths captured during the action.

### v6.9 (2026-05-12) — Chains E/F/G/H/J/K/L complete (Phases B5–B11)
- All 12 §11 chains are now Playwright specs in `tests/chains/`. Five (A, B, C, D, I) landed earlier; seven (L, E, F, G, H, J, K) added in this bump.
- Chain L (Lab Number Uniqueness): 4 steps, burst-creates 10 orders in parallel inside one `page.evaluate`, asserts all returned accessions are distinct, then asserts they share the configured prefix. Catches generator races.
- Chain E (Sample Validation Lifecycle): 6 steps. Distinct from Chain B's sample rejection — this tests RESULT rejection (retest workflow). Step 6 catches the case where both initial wrong value AND corrected value appear on the report.
- Chain F (EQA Distribution): 6 steps. Step 1 explicitly checks the eqaEnabled config precondition with a clear fix path, solving the OGC-518–524 cluster pattern. Step 5 catches BUG-39.
- Chain G (Cold-Chain Excursion): 5 steps. BAILs cleanly if no Cold Storage device configured (most common case). Uses API-direct excursion insertion as hardware-substitute; the real sensor-integration test is out of scope (workplan E6).
- Chain H (Permission Enforcement): 4 steps with afterAll cleanup. Spawns a second browser context to log in as a restricted user. Distinguishes 401 (session) from 403 (forbidden). Dependent on BUG-3.
- Chain J (Audit Trail Coverage): 5 steps. Performs 2-3 sensitive actions, then verifies each produced an audit entry with identifying who/when/what fields populated.
- Chain K (FHIR Round-trip): 6 steps. Forward direction (UI→FHIR read), write surface (FHIR POST), and reverse direction (FHIR→UI back-projection). BLOCKED clean if FHIR is read-only.

Every chain reuses `tests/chains/_common.ts` with zero changes — `apiCall`, `findOrSeedOrder`, `extractPdfText`, `markStep` all proven sufficient for the full set. Workplan Phase B (chains) is complete; the remaining workplan items move to Phase C (Personas).

### v6.8 (2026-05-12) — Chain I Site Branding → Report (Phase B4)
- Fifth §11 chain implemented. `tests/chains/chain-i-site-branding-to-report.spec.ts` (6 steps). First chain that can plausibly PASS on the current testing instance (admin write path already proven in Phase 36 Chain C; only the admin→report propagation remained unverified).
- Step 3 explicitly probes the NOTE-16 root cause — labName empty/null in SiteInformation. If found unset, the chain reports clearly that PDFs will show "null" because the upstream config is empty (different bug class than "pipeline is broken").
- Step 6 is the strongest test in the chain: modify labName → regenerate PDF → assert the new value appears → `test.afterAll` restores the original. Catches stale-cache and pipeline-lossy issues that Step 5 (read existing config) can't.
- Uses defensive endpoint probing per §6.5 — tries SiteInformation, siteInformation, SiteInformationMenu in priority order; bails with a clear error if none responds.

### v6.7 (2026-05-12) — Chains C + D Reflex/Calc engines (Phase B3)
- Chain C (`tests/chains/chain-c-reflex-trigger.spec.ts`, 6 steps) and Chain D (`tests/chains/chain-d-calculated-value.spec.ts`, 7 steps) implemented together. Both API-substituted per §11.5 because BUG-31 blocks the UI result-entry step.
- These are the two chains the prior catalog could *never* verify — Phase 28 admin tests confirmed both engines have working CRUD pages, but no test had ever observed either engine actually firing because BUG-31 blocked the result-entry step that would trigger one.
- Chain C Step 5 = definitive PASS/FAIL on "does the reflex engine fire on API writes?"
- Chain D Steps 5/6/7 split the calc engine check into three distinct symptoms: (5) calc test row produced, (6) row has a value, (7) value math is plausible. A partial-fix scenario (engine adds row but doesn't compute) surfaces clearly.
- Both chains reuse `tests/chains/_common.ts` with zero changes. Chain D adds its own multi-test order POST inline rather than extending the shared helper — kept for clarity until the pattern repeats.

### v6.6 (2026-05-12) — Chain B Rejection → NCE → Report implemented (Phase B2)
- Second chain from §11 is now a Playwright spec: `tests/chains/chain-b-rejection.spec.ts`. 8 named steps. The key design choice: Steps 5, 6, 7, 8 each probe one of the *four distinct symptoms* of BUG-29 (qa_event creation gap, View NCE search empty, Rejection Report PDF 503, Dashboard counter stuck at 0) so a partial fix surfaces clearly which subsystem was patched — not "rejection workflow FAILed" as a single opaque red light.
- Step 3 uses API substitute per §11.5 (Reject Sample is a Carbon checkbox, same BUG-31 family).
- Adds a "PARTIAL" status to Step 7's PDF-content check: PDF generates but is empty for today's rejections — a soft signal that BUG-29 reaches all the way through to the report layer.
- Reuses `tests/chains/_common.ts` helpers introduced in v6.5 with no changes.

### v6.5 (2026-05-12) — Chain A Order Lifecycle implemented (Phase B1)
- First chain from §11 Chains is now an actual Playwright spec: `tests/chains/chain-a-order-lifecycle.spec.ts`. Eight named steps (1: acquire order, 2: BUG-37 linkage check, 3: result entry via API substitute, 4: validation, 5: PDF generation, 6: PDF content match, 7: FHIR Observation fetch, 8: round-trip value match).
- Each step declares its §7.6 Acceptance Criterion (RENDER / FUNCTION / PERSIST / ROUND-TRIP / CROSS-LINK / REPORTABLE) and references the SKILL section that mandates it. Steps 3 and 4 use API substitutes per §11.5 because BUG-31 blocks the UI path.
- Added `tests/chains/_common.ts` with reusable helpers: CSRF-aware `apiCall`, `findOrSeedOrder`, minimal PDF text extractor (no external deps), structured step logger. Same helpers will power Chains B–L.
- Playwright project `chain-a` depends only on `setup`, not `data-setup`, so it can run against any seeded instance via the §0.6a script.

### v6.4 (2026-05-12) — Bulk seed script (Phase E1)
- Step 0.6 Data Census now has an 0.6a "Bulk seed script" sub-section with invocation commands. The seed script (`seed-data.setup.ts` + `helpers/seed-factory.ts` + `helpers/seed-config.ts` in the repo) is idempotent, round-trip-verifies every write per §7.5, detects and counts BUG-37 instances as it runs, and writes a machine-readable summary to `.auth/seed-state.json`.
- Targets 50 patients and 100 orders spread across 5 lab sections; status-transition seeding (IN_PROGRESS / READY_FOR_VALIDATION / REJECTED) intentionally not attempted while BUG-31 blocks the result-entry UI. Documented as an open item for workplan Phase B Chain C/D.

### v6.3 (2026-05-12) — Bug-revalidation cross-link
- Step 0.5 Calibration now explicitly references the `openelis-bug-revalidation` companion SKILL v1.1, which handles each new FAIL after calibration. The two protocols are designed to work together: this SKILL governs pre-phase calibration of known bugs; the companion SKILL governs reproducibility confirmation of new FAILs. Destructive bugs (BUG-31, BUG-38) use indirect evidence in both protocols.

### v6.2 (2026-05-12) — Bug-list calibration sweep
- Section 8 bug table re-calibrated against 2026-04-20/21 QA reports. 9 bugs marked Resolved, 6 marked False Positive (wrong endpoint pattern), 2 Retracted, 1 Downgraded (BUG-1 → merge with BUG-12). Strikethrough severity + bold action highlight tickets ready for Jira closure.
- See `bug-calibration-delta-2026-05-12.md` for the full delta document with per-bug evidence trail and top-5 priorities for the next live session.

### v6.1 (2026-05-12) — Blocking-bug etiquette
- Step 0.5: Calibration must use indirect evidence path for destructive bugs (BUG-31, BUG-38). Never re-trigger a known browser-hanging action.
- Section 11.5: Blocking-Bug Etiquette rule — when a mandated step would hang the session, mark BLOCKED + PARTIAL and continue. Clarifies that "mandatory" means "must be attempted and reported on," not "must succeed." Lists current known blockers (BUG-31, BUG-38) and allows API substitution for destructive-UI legs of chains.

### v6 (2026-05-12) — Lab-readiness lens
- Step 0.5: Calibration step before each new test phase.
- Step 0.6: Data Census gate before E2E or persona suites.
- Section 5.5: Feature Maturity Rubric (M0–M5). Replaces binary PASS/FAIL with maturity rating per module.
- Section 6.5: Mandatory live-network-capture rule before filing any 404-based bug. Closes the false-positive cluster pattern (OGC-535/562/563/565/566/568).
- Section 7.5: Round-trip Write Verification mandatory for all writes. Closes BUG-8 / BUG-29 / BUG-37 class.
- Section 7.6: Acceptance Criteria Standard (RENDER / FUNCTION / PERSIST / ROUND-TRIP / CROSS-LINK / REPORTABLE).
- Section 8.5: Partial-Feature Audit — quarterly + on major version. Seeded with 20 baseline suspect features.
- Section 11: Chains — 12 canonical cross-module workflows, mandatory.
- Section 12: Personas — 6 day-in-the-life walk-throughs.
- Section 13: Dashboard Counter Reconciliation — mandatory every run.

### v6.14 (2026-06-17) — Reflex & Calc engines VERIFIED firing (v3.2.1.10) + calc-engine mechanics

Verified end-to-end on indonesiadev v3.2.1.10, where **BUG-31 does not reproduce**, so the reflex (Chain C) and calculated-value (Chain D) engines were finally observed firing through the UI. Both move from M1/unverified to **M4 (cross-link verified)** on that build.

**Calculated-value engine — how it actually behaves (MUST READ before testing Chain D):**
- Fires **server-side on result SAVE** (`POST /rest/LogbookResults`). It **ADDS the output test as a new row, with the computed result**, only when that test is **NOT already on the order**. It does **NOT back-fill** an output test that is already ordered/present as an empty row. **False-negative trap:** if the order already carries the calc's output test (e.g. it was added by a reflex rule, or ordered manually), the calc appears "not to fire." A clean Chain-D order must order **only the operand/source tests**, never the output test.
- The added row appears **after save + refresh**, not in the same render. Re-saving the source **recomputes**. Allow a few seconds / poll before declaring non-fire.
- **Two output modes:** (1) **Numeric** — e.g. `Creatinine x 2 -> Total Cholesterol`. (2) **Select-list / dictionary** — choose a relational operator (Is Greater Than Or Equal, etc.) and a **dictionary test** as Final Result; a **"Select Dictionary Value"** dropdown then appears to set the value when the condition is true, e.g. `Creatinine >= 5 -> Urine pregnancy test = Positive`. Mapping N value-bands -> N dictionary values needs **N separate rules**. Works **cross-sample** if the order has a sample of the output test's type.
- **Builder gotchas:** Final Result typeahead is **prefix-match** (search "Urine", not "pregnancy", or dictionary tests look absent); thresholds are **integer-only** (no decimals — unusable for sub-integer ranges like Beta HCG 0.05-0.20); the Mathematical Function `<select>` only binds on a **real selection event** (programmatic value-set doesn't register); **Submit always CREATES** (re-saving an existing rule 409s "Duplicate Calculation Name" — deactivate via the toggle and add a new rule).

**Chain D spec implication:** Step 7's numeric plausibility check assumes a numeric output and will FALSELY FAIL on a relational/dictionary rule — branch on output result-type (N vs D); for D, assert the result equals the configured dictionary value (or is a non-empty dictionary option) rather than running numeric math.

**Reflex engine:** confirmed firing on v3.2.1.10 (GPT/ALAT >= 40 -> GOT/ASAT auto-added on result save).

**Evidence:** indonesiadev run, orders DEV...0009 (reflex), DEV...010 (calc numeric + select-list). Detail in the run report `qa-report-indonesiadev-vector-env-20260615.md` sections 9-14.
