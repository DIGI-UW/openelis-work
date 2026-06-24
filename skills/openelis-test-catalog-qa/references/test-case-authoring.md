# Test-Case Authoring — writing deep, chained, gradeable test cases

> How to write and maintain the QA catalog so cases are **deep** (walk a whole workflow,
> proving each step's output lands in the next), **gradeable** (acceptance tier + maturity),
> and **honest about their own limits** (flag what isn't covered and where the workflow is
> unknown, so Casey can guide it). This is the authoring standard behind `master-test-cases.md`
> and `references/test-cases.md`.

## Where the catalog lives (reconciled — no duplicate sources of truth)
- **`master-test-cases.md`** (repo root) — the **detailed master catalog** (all suites/DEEP suites, full steps). The source of truth for case detail.
- **`references/test-cases.md`** — the original **Test Catalog module** subset (TC-01…TC-11), kept for that module's depth.
- **`references/suite-catalog.md`** — the **index** (suite letters → area → key notes + run phases + route discovery). Points *to* the two above; it is not a third copy of the steps.
- **`madagascar-uat-test-suite.md`** — deployment **UAT** (LO-xx/DU-xx) for the Madagascar e-SIL acceptance; run alongside standard suites on that deployment.
- **`coverage-gap-analysis.md` / `test-case-gaps-*.md`** — the live menu-map vs coverage, and per-version expected-result updates. New gap findings append here.

When you add or change cases, edit `master-test-cases.md` (detail) and reflect the suite in `suite-catalog.md` (index). Don't fork a parallel catalog.

---

## 1. Anatomy of a good TC
Every case declares:
- **ID + suite** (e.g. `TC-ORD-03`, Suite B).
- **Preconditions / data dependency** — what must exist first, expressed against **Step 0.6 Data Census** (e.g. "≥1 patient with an active order in Hematology"), not a hardcoded fixture. If the census can't satisfy it, the case is BLOCKED, not FAIL.
- **Steps** — exact, UI-path or API, one action per line.
- **Acceptance criterion tier** (Section 7.6): RENDER < FUNCTION < PERSIST < ROUND-TRIP < CROSS-LINK < REPORTABLE. Pick the **highest tier the case actually proves** — and include the evidence for it.
- **Expected read-back** — for any write, the *different-surface* read that proves it landed (Section 7.5).
- **Maturity target** (Section 5.5) — the M-level a PASS would justify for the module.

A case whose acceptance criterion is only RENDER is a smoke check, and caps the module at M1. Catalog growth should be biased toward PERSIST/ROUND-TRIP/CROSS-LINK cases.

## 2. Deep, chained cases — follow the action all the way through
A shallow case checks one screen. A **deep case walks a workflow and proves each handoff
lands**: the output of step N is the *input you verify* at step N+1, end to end.

**Authoring pattern (the "landing check" at every handoff):**
1. Write down the workflow as a chain of state transitions across modules — e.g. *Order placed → sample received → result entered → validated → on Patient Report → queryable as FHIR*.
2. For each transition, define the **handoff artifact** (the accession, the result id, the validated flag) and a **landing check** that reads it back on the *next* surface — not the one that wrote it. The order isn't "placed" because the POST returned 200; it's placed because the **Modify Order screen shows the patient linked** and the accession is findable.
3. The case PASSes only if **every** handoff lands. A break at any handoff is a FAIL located at that step (this is how Chain A surfaces patient-order linkage breaks and Chain B surfaces the rejection→NCE→report silo).
4. Where a UI step is blocked by a hanging control, use the **API substitute** for that leg (tag it `API-substituted`) so the chain still proves the data path while the UI gap stays visible (Section 11.5).
5. End on a **terminal landing**: a regulator-visible output (branded PDF, FHIR resource, audit entry) where possible — that's the REPORTABLE tier and the strongest proof the workflow truly completed.

Deep cases belong in **Chains** (`references/workflows.md`) when they cross 3+ modules; author single-module deep cases the same way (write → different-surface read-back → assert).

**Example skeleton (chained):**
```
TC-CHAIN-ORD-01 — Order → Result → Validation → Patient Report  [CROSS-LINK→REPORTABLE]
 Pre: census shows an orderable test in Hematology with result options defined
 1. Place order for patient P, test T            → landing: Modify Order shows P linked to new accession A   [ROUND-TRIP]
 2. Enter result R for A (API-substituted if Accept checkbox blocks)  → landing: result reads back on Logbook for A   [PERSIST]
 3. Validate A                                   → landing: A leaves the validation queue; status=validated via different read  [ROUND-TRIP]
 4. Generate Patient Status Report for P         → landing: PDF contains test T = R   [REPORTABLE]
 Fail rule: any handoff that doesn't land = FAIL at that step (not "minor")
```

## 3. Surface what's NOT covered and what's UNCERTAIN (the collaboration loop)
A run/authoring pass must end by producing **two explicit lists** — this is how the catalog
gets better over time and how Casey steers it:

- **UNCOVERED (new work, no case exists).** Any screen/menu item/endpoint/workflow with no TC. Derive candidates from: the live hamburger + Admin menu map (vs `coverage-gap-analysis.md`), new routes that appeared since last run, and any FRS/feature shipped in `openelis-design`'s `spec-registry.md`/`current-state-gotchas.md`. For each, write one line: *"No coverage: <area> — <why it matters>."* Propose the suite it belongs in.
- **UNCERTAIN (workflow unknown — ask Casey).** Any place where the *intended* workflow isn't clear enough to write a correct expected result — e.g. "what should happen when a reflex fires on an already-validated sample?", "is a rejected EQA sample supposed to appear on the Rejection Report?". Phrase each as a **direct question for Casey**, with what you observed and the candidate interpretations. Do **not** invent an expected result and silently assert PASS/FAIL on a workflow you don't understand — that produces false findings. Mark the case `NEEDS-GUIDANCE` and move on.

Put both lists in the report (and append durable ones to `coverage-gap-analysis.md`). The
UNCERTAIN list is the high-value output: it's where Casey's domain knowledge turns a guess into
a real test.

## 4. Maintenance workflow (keeping the catalog current)
- **On a new feature/FRS:** read the feature (often in `openelis-design`), author deep cases that walk its primary workflow end-to-end, add them to `master-test-cases.md`, index in `suite-catalog.md`.
- **On a version bump:** run the diff discipline of `test-case-gaps-*.md` — which expected results changed, which bugs resolved/regressed (status from Jira, per `bug-triage.md`), which routes moved (re-verify vs `admin-ia-inventory.md`).
- **On coverage review:** regenerate the live menu-map vs coverage (`coverage-gap-analysis.md`); promote UNCOVERED items into authored cases; retire cases for removed features (mark retired, don't delete the record).
- **Never** bake a bug-status table or dated findings into a case file — those live in Jira / dated reports.

## 5. Anti-patterns
- A "PASS" that only proves the page rendered, presented as if the feature works. (Cap at M1; say so.)
- A write case with no different-surface read-back. (Not gradeable above PERSIST.)
- Inventing the expected behavior of a workflow you don't understand instead of marking it `NEEDS-GUIDANCE`.
- Hardcoding instance-specific fixtures instead of expressing preconditions against the Data Census.
- Authoring a 12-step chain that stops checking after step 3 — every handoff gets a landing check or the chain is shallow.
