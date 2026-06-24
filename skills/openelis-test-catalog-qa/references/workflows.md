# Mandatory Workflows — Chains, Personas, Reconciliation, Audit

> Cross-module workflows that every run executes (tiered — see SKILL.md run tiers).
> Bug ids referenced here are operational hazards/examples; their CURRENT status lives in
> Jira, not in this file (see `bug-triage.md`).

---

## Section 11 — Chains: Cross-Module Workflow Suites (MANDATORY in every test run)

Chains are end-to-end workflows that cross 3+ modules. They are not optional — every test run that targets a non-trivial subset of the system must execute at least Chain A (Order Lifecycle). Chains that depend on admin config (e.g., Chain F EQA) must run their prerequisite (Suite FK) first.

| Chain | Name | Modules | What it tests | Caught (or would have caught) |
|-------|------|---------|----------------|--------------------------------|
| **A** ✅ | Order Lifecycle | Order → Sample → Result → Validation → Patient Report → FHIR | The whole forward path. Order created, patient linked, sample received, result entered, validated, appears on Patient Status Report PDF, and is queryable as FHIR Observation. **Implemented** as `tests/chains/chain-a-order-lifecycle.spec.ts` (run via `--project=chain-a`). 8 named steps each with explicit acceptance criterion per §7.6. Steps 3-4 use API substitutes per §11.5 (BUG-31 blocks the Carbon Accept checkbox). | BUG-37 (patient-order linkage), BUG-8 (silent data loss on save) |
| **B** ✅ | Rejection → NCE → Report | Order rejection → NCE auto-creation → Rejection Report → Dashboard counter | The cross-module data flow Phase 23 invented ad-hoc. **Implemented** as `tests/chains/chain-b-rejection.spec.ts` (run via `--project=chain-b`). 8 steps; Steps 5/6/7/8 each map to one of the four distinct BUG-29 symptoms (A: qa_event creation, D: View NCE search, B: Rejection Report PDF, C: Dashboard counter), so a partial fix to BUG-29 surfaces clearly *which* subsystem was patched. Step 3 uses API substitute per §11.5 (Reject Sample is a Carbon checkbox, BUG-31 family). | BUG-29 (rejection silo) |
| **C** ✅ | Reflex Trigger | Admin reflex rule create → Result entry → Workplan check | Confirms reflex actually fires. **Implemented** as `tests/chains/chain-c-reflex-trigger.spec.ts` (run via `--project=chain-c`). 6 steps with API substitute per §11.5 (BUG-31 bypass). Step 5 is the definitive engine-fired check — gives a clean PASS or FAIL answer to "do reflex rules actually fire?" — the question Phase 28 left unverified. | BUG-31 (UI path) — but API substitute lets us probe the engine directly |
| **D** ✅ | Calculated Value | Admin calc create → Two source results enter → Calc appears on results | Confirms compute engine runs. **Implemented** as `tests/chains/chain-d-calculated-value.spec.ts` (run via `--project=chain-d`). 7 steps. Discovers an active calc rule, seeds an order with all its operand tests, enters every operand via API, checks the calc test was produced (Step 5) AND has a value (Step 6) AND the math is plausible (Step 7). Three distinct fail modes, three distinct expects. | BUG-31 (UI path) — but API substitute lets us probe the engine directly |
| **E** ✅ | Sample Validation Lifecycle | Result enter → Reject for technical reasons → Re-test → Validate → Patient Report | Tests the back-and-forth path real labs walk. **Implemented** as `tests/chains/chain-e-sample-validation-lifecycle.spec.ts` (run via `--project=chain-e`). 6 steps. Step 6 catches the case where both the initial wrong value AND the corrected value appear on the report (history-without-current-marker bug). | Distinct from BUG-29 (sample rejection); tests RESULT rejection. |
| **F** ✅ | EQA Distribution | Admin enable EQA → Create program → Create shipment → Distribute → Participant enters result → Score → Report | Confirms the EQA workflow end-to-end. **Implemented** as `tests/chains/chain-f-eqa-distribution.spec.ts` (run via `--project=chain-f`). 6 steps. Step 1 explicitly checks the eqaEnabled config precondition and BAILs with the fix path if false — alone solves the OGC-518–524 cluster of silently-cancelled tickets. Step 5 catches BUG-39. | OGC-518–524 cluster, BUG-39 |
| **G** ✅ | Cold-Chain Excursion | Device configured → Simulated excursion → Alert fires → Corrective action linked → Audit log entry | Confirms the regulatory-required loop. **Implemented** as `tests/chains/chain-g-cold-chain-excursion.spec.ts` (run via `--project=chain-g`). 5 steps. BAILs cleanly if no device configured (most common case). Hardware-substitute: API path to insert a synthetic excursion event. Real Modbus/BACnet sensor integration remains out of scope (workplan E6). | CAP/CLIA gap — most installs have no devices configured |
| **H** ✅ | Permission Enforcement | Admin create user with restricted role → Login as that user → Attempt restricted action → Fail with 403 | Confirms access control is enforced, not just configured. **Implemented** as `tests/chains/chain-h-permission-enforcement.spec.ts` (run via `--project=chain-h`). 4 steps + afterAll cleanup. Spawns a second browser context to log in as the restricted user. Distinguishes 401 (session) from 403 (forbidden). Dependent on BUG-3 / BUG-20 (UserCreate). | BUG-3, BUG-20 |
| **I** ✅ | Site Branding to Report | Admin update branding → Generate Patient Status Report PDF → Branding appears | Confirms the pipeline from admin to output. **Implemented** as `tests/chains/chain-i-site-branding-to-report.spec.ts` (run via `--project=chain-i`). 6 steps. Step 3 explicitly checks the NOTE-16 root cause (labName set/empty). Step 5 catches "null" tokens in PDF body. Step 6 is the strongest test — modify labName → regenerate → assert change appears → restore via `test.afterAll`. | NOTE-16 (report header "null"), NOTE-29 (Contact Tracing "null") |
| **J** ✅ | Audit Trail Coverage | Edit reference range, delete result, grant admin role → Audit Trail shows each | Confirms audit entries are written for sensitive actions. **Implemented** as `tests/chains/chain-j-audit-trail-coverage.spec.ts` (run via `--project=chain-j`). 5 steps. Step 4 maps each sensitive action to a corresponding audit entry. Step 5 verifies entries have who/when/what fields populated — the regulatory minimum. | Audit coverage previously unverified |
| **K** ✅ | Cross-installation FHIR Round-trip | UI write → FHIR read → External FHIR POST → UI read | The integration use case OpenELIS markets. **Implemented** as `tests/chains/chain-k-fhir-round-trip.spec.ts` (run via `--project=chain-k`). 6 steps. Step 4 verifies UI→FHIR projection (forward). Step 5 attempts FHIR POST (write surface). Step 6 verifies FHIR→UI back-projection (reverse). BLOCKED clean if FHIR is read-only. | BUG-56 territory; integration footgun for EMR projects |
| **L** ✅ | Lab Number Uniqueness | Concurrent Add Order, Batch Order Entry, EQA Sample, Generic Sample → No duplicate lab numbers | Confirms accession generation across paths. **Implemented** as `tests/chains/chain-l-lab-number-uniqueness.spec.ts` (run via `--project=chain-l`). 4 steps. Burst-creates 10 orders in parallel via Promise.all inside page.evaluate (matches concurrent-user workload). Year-rollover scenario documented as manual-only. | Sample-identification disaster risk |

**Chain reporting:** Each chain produces a single PASS/PARTIAL/FAIL with module-level breakdown. A chain at M3 in module A but M1 in module B is rated at the floor — M1.

A test phase that does not include any Chains may not report a maturity above M2 for any module touched.

### Section 11.5 — Blocking-Bug Etiquette (applies to Chains, Personas, Calibration, and Y-RECON)

A "mandatory" step in v6 means **must be attempted and reported on** — not "must complete successfully before continuing." Real bugs in mandatory chains are a feature of the design, not a defect: that's how Order Lifecycle (Chain A) surfaces BUG-37 and Rejection (Chain B) surfaces BUG-29 every session until they're fixed. The dashboard going red on those chains is the system working as intended.

The exception is when a mandated step would actively damage the session — hang the tab, exhaust Chrome's 6-connection-per-origin pool, or otherwise prevent subsequent suites from running. In that case, the step gets **BLOCKED**, not FAIL, and the session continues.

**Rule:** When a mandated step hits a known browser-hanging or pool-exhausting bug:

1. **Do NOT perform the destructive action.** No `.click()` on the Carbon Accept checkbox (BUG-31). No retried POST to `/rest/reportnonconformingevent` (BUG-38). No second tab opening on a known-hanging endpoint while a first tab is still pending.
2. **Mark the step BLOCKED.** Record the bug number and a one-line note: "Step blocked by BUG-XX; not re-attempted to preserve session."
3. **Mark the parent chain or persona PARTIAL** if any other step in the chain/persona did complete; otherwise BLOCKED.
4. **Continue to the next chain, persona, or suite.** Do not abort the session.

**Known blockers as of v6:**
- **BUG-31** — Carbon Accept checkbox `.click()` hangs the browser tab for ~60s. Affects Chain A (result entry leg), Chain C (reflex trigger), Chain D (calculated value), Persona PB (Bench Tech), Persona PC (Validating Biologist, validation save path).
- **BUG-38** — `POST /rest/reportnonconformingevent` hangs indefinitely and pool-exhausts after the first call. Affects Chain B (NCE-creation leg), Persona PE (QA Officer, file-NCE step).
- **BUG-32** (resolved in v3.2.1.6 but historical) — Verify per Step 0.5 before assuming OK.

**API substitution is allowed for blocking-bug legs of a chain.** If the destructive UI step has a non-destructive API equivalent (e.g., POST result via REST instead of clicking Accept), use the API and tag the chain leg as `API-substituted`. The chain still PASSes if the round-trip read-back matches; the substitution is logged so the UI gap stays visible.

**What this rule is not.** It is not permission to mark a chain BLOCKED whenever it's inconvenient. A chain that FAILs because the feature is broken (BUG-29 rejection → NCE; BUG-37 patient-order linkage) is a genuine FAIL and must be reported as such. BLOCKED is reserved for "performing the next step would prevent further testing."

---

## Section 12 — Personas: Day-in-the-life Walk-throughs

Personas test what a real role does in a working day. Each persona is one TC that crosses multiple screens. PASS requires the persona to complete every documented action without workarounds.

| Persona | What a normal day looks like |
|---------|------------------------------|
| **PA — Receptionist** ✅ | Search for patient by national ID; if found, place an order for them on the right program; if not, create the patient and place the order. Print barcode labels. Hand off the order. |
| **PB — Bench Tech (Hematology)** ✅ | Open Workplan filtered to Hematology. Pick one sample from the queue. Enter results for CBC panel. Save. Move on to next. Bulk-save normal results on 10 outstanding routine cases. |
| **PC — Validating Biologist** ✅ | Open Validation Routine for Hematology. Review results. Add a note where needed. Reject one for re-test. Validate the rest. Open Patient Results for one validated case and confirm it's there. |
| **PD — Lab Manager** ✅ | Pull morning Dashboard, drill into Orders In Progress. Pull yesterday's Rejection Report. Pull weekly Statistics Report. Confirm the Test Turn-Around-Time KPIs match the underlying data. |
| **PE — QA Officer** ✅ | View NCE Dashboard. Pick one open NCE. Document corrective action. Pull Non-Conformity By Section/Reason report for the quarter. Confirm CAP/CLIA compliance footer on cold-chain export. |
| **PF — Lab Administrator** ✅ | First-time setup: change site branding (logo, colors, lab name), configure barcode formats, set up one new test (TestAdd), set up one new analyzer mapping, enable EQA, create one new user with Receptionist role, generate a user manual link to share. |

**A persona PASSes** only if the persona completes every step using documented UI paths, with no workarounds. If a step requires a config toggle the persona shouldn't have to know about (like EQA enabled), that's a FAIL of PF — it counts against the Lab Administrator persona because they shouldn't have hidden requirements.

Personas surface architectural gaps. PD will catch the dashboard-to-reality mismatch; PF will catch the EQA-not-enabled silent dead-end; PE will catch the rejection chain break.

**Implementation (Phase C, 2026-05-13):** all 6 personas are Playwright specs under `tests/personas/`. Each is one `test.describe.serial` with 4–6 steps. They reuse `tests/chains/_common.ts` (apiCall, markStep) and where appropriate `helpers/networkCapture.ts` from Phase E2. Run individually via `--project=persona-pa` through `--project=persona-pf`. PF includes `test.afterAll` cleanup that restores site branding and the eqaEnabled toggle even on mid-test failure.

---

## Section 13 — Dashboard Counter Reconciliation (Y-RECON, Required every run)

For each Dashboard KPI, fetch the underlying list and assert `len(list) == counter`. Mismatches are **FAIL**, not informational.

| KPI | Backing list / query | Assertion |
|-----|----------------------|-----------|
| Orders In Progress | LogbookResults across all units with status=In Progress | Sum equals counter |
| Ready For Validation | AccessionValidation queue size | Equals counter |
| Orders Entered By User Today | Audit Trail filtered to entered=today | Equals counter |
| Orders Rejected Today | Rejection Report for today | Equals counter — currently FAILs per BUG-29 |
| Un-Printed Results | Result list with printed=false | Equals counter |
| Electronic Orders | Incoming Test Requests filtered to "Entered" status | Equals counter |
| Average Turn-Around Time (three sub-KPIs) | Sample audit timestamps; compute median | Within ±10% of displayed value |

The assertion failure mode catches counter-drift bugs that would otherwise be invisible (BUG-29 class).

---


---

## Partial-Feature Audit (quarterly + on major version bumps)

Once per quarter, and on every major version bump, run the Partial-Feature Audit. The audit is a deliberate hunt for features that pass the standard render-PASS criterion but are functionally incomplete. The output is a list of M0–M2 modules ranked by lab impact.

**Procedure:**

1. **Enumerate visible features.** From the sidebar, every top-level item is a candidate. List every screen the user can reach.
2. **For each screen, check four signals:**
   - **a.** Are there i18n keys leaking through? (Suggests an unmaintained branch — see BUG-43, BUG-44, BUG-47, NOTE-35.)
   - **b.** Do any primary buttons return 4xx/5xx? (Inventory Reports Generate, NCE submit, Storage Locations POST.)
   - **c.** Is there a filter that doesn't filter? (BUG-41 Inventory active filter; BUG-60 LogbookResults pre-v3.2.1.6.)
   - **d.** Does a "successful" write read back missing fields? (BUG-8 TestModify.)
3. **For each module, rate Maturity M0–M5** (Section 5.5). Document the evidence.
4. **Lab Impact rank.** For each M0–M2 module, write one sentence: "A lab needing X cannot do X because Y." Sort the list by severity.

The audit produces a delivery document, not a Jira fire-hose. File Jira tickets only for the top 10 issues, ranked by lab impact. The rest go in the audit report as a prioritization backlog.

**Seed list of suspect features (audit baseline, 2026-05-12):** Inventory storage locations (M1, BUG-40), Inventory Reports (M1, BUG-45), Inventory active filter (M2-broken, BUG-41), Cold Storage compliance loop (M2 unverified), EQA distribution (M1 without config), Reflex rules (M4 verified v3.2.1.10), Calculated values (M4 verified v3.2.1.10 - numeric + select-list), Pathology workflow progression (M2 unverified), Rejection workflow chain (M2 broken, BUG-29), Patient-order linkage on order create (M1.5 broken, BUG-37), NCE submission (M1 broken, BUG-38), Permission enforcement (M1 unverified), Audit trail coverage (M2 unverified), FHIR resource round-trip (M2 unverified), Notification subsystem (M1), Order Programs Questionnaire (M1 unverified), Bar code label printing (M1 unverified), Storage Boxes grid assignment (M2 unverified), Lab number generation cross-path uniqueness (M2 unverified), Search index reindex button (M0 unverified).
