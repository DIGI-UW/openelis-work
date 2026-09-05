# OGC-782 Microbiology / AMR — UAT Findings Report

**Instance:** `amr.openelis-global.org` · app **3.2.1.11** · review deployment **`ad18410`**
**Scope:** the stacked OGC-782 microbiology implementation through R2, graded against the in-app UAT checklist (21 stories / 60 steps) and against M-00 §§1.4, 4, 5, 8, 11.
**Run date:** 2026-08-13 → 2026-08-14 · **Run by:** Claude (openelis-test-catalog-qa)
**Companion docs:** `spec-delta-OGC-782-amr-20260813-1620.md`, `uat-review-run-OGC-782-amr-20260813.md`, `amr-end-to-end-walkthrough-20260813.md`

---

## 1. Headline

**The standard bacteriology workflow works end to end.** I drove a case from order → routed case → inoculation with lot traceability → positive → isolate → identification → AST run → breakpoint interpretation → AST review → **final report release**, then opened an amendment, corrected the organism, and released an amended report that correctly reads "Version 2 · Amended · Corrects version 1".

That matters because the seed data made it look otherwise: **200 cases and not one had ever progressed past `PRELIM_RELEASED`**, with every resistance counter at zero. The downstream half wasn't broken, just unexercised.

**32 of 60 checklist steps executed: 26 pass, 6 fail.** Two of the failures are serious and neither is in order entry.

---

## 2. Failures

### F-1 · Change workflow returns 500 — Unassigned cases cannot be classified
**Severity: High** · Story AMR-S18 step 1 · Relates to OGC-926 (marked *Done*), M-00 §8.4

`PUT /rest/microbiology/cases/{id}/workflow` returns `500 Internal Server Error` for **both** culture methods the UI itself offers as compatible:

| Case | Method | Result |
|---|---|---|
| `fbe9f526…` | 52 · UAT bacteriology culture | **500** |
| `fbe9f526…` | 54 · UAT alternate bacteriology culture | **500** |
| `fad2e3cc…` | 52 | **500** |
| `fbe9f526…` | 53 (not offered) | `400 MICROBIOLOGY_WORKFLOW_METHOD_INCOMPATIBLE` |

The validation layer is correct — an *incompatible* method returns a clean named 400. **Only the valid happy path 500s.**

The UI is correct right up to submit: workflow picker offers Bacteriology / Mycobacteriology TB, Culture Protocol stays disabled until a workflow is chosen then filters to compatible methods, reason is required. On failure **nothing is surfaced** — no banner, no toast. The case silently stays Unassigned, the reason is discarded, no activity is written.

**Impact:** 8 Unassigned cases on this instance are permanently stuck behind their own banner — *"Culture setup, isolate work, AST, and reporting are held until this case is classified."* This is the M-00 §8.4 UNASSIGNED escape hatch and it is inoperable.

**Note:** `PUT .../protocol` on the same case shape works fine, so the fault is specific to the workflow endpoint. Needs server logs.

---

### F-2 · Amended results are indistinguishable on the patient-facing view
**Severity: High (clinical safety)** · Story AMR-S07 step 2

After releasing an amended report, `/PatientResults/{id}` lists **both versions consecutively** under the same test:

```
UAT microbiology culture
  ISO-1: Reference organism (UAT); Ciprofloxacin S     ← amended (current)
  ISO-1: Escherichia coli (UAT);   Ciprofloxacin S     ← superseded
```

Inspected the DOM: both are plain `<td>`/`<span>` cells with **no class, no version label, no Amended/Superseded tag, no badge** (queried `[class*=tag]`, `[class*=badge]`, `[class*=status]` — only the National-ID chip matched).

A clinician reading patient results sees two contradictory organism identifications for the same isolate with nothing indicating which is current or that a correction occurred.

**The data model is right** — the case-level Amendments panel renders "Version 1 · Final", "Version 2 · Amended", "Corrects version 1". Only the patient-results rendering fails to carry it through.

---

### F-3 · AST corrections return 500 while a case is under amendment
**Severity: High** · Story AMR-S06 steps 1 and 2

`POST /rest/microbiology/ast/runs/{runId}/readings` returns a bare `500` once a case is in `AMENDMENT_IN_PROGRESS`.

**Cause isolated, not assumed** — the same POST on the same run:

| Case state | Result |
|---|---|
| Open (pre-release) | `200` ✓ |
| `FINAL_RELEASED` (locked) | `409 MICROBIOLOGY_CASE_LOCKED / FINAL_CASE_LOCKED` ✓ correct |
| `AMENDMENT_IN_PROGRESS` | **`500` Internal Server Error** |

Reproduced on both attempts of the run. Isolate corrections under the *same* amendment work fine (organism re-identification saved, wrote `ISOLATE_UPDATED`).

**So the amendment unlock is partial: you can correct the isolate identification but not the AST data** — which is most of what an amendment exists for. This also blocks AMR-S06 entirely, since a Retest cannot be started while an attempt is In Progress and that attempt cannot be resolved.

---

### F-4 · Worklist breadcrumb discards queue state
**Severity: Medium** · Story AMR-S17 step 2

The case route correctly carries `workflow=…&sort=…` forward. Returning via the **"Microbiology worklist" breadcrumb** empties the query string, resets Workflow to *All workflows* and Sort to *Priority*, and renders a different row set.

Reproduced on two independent filter combinations (`BACTERIOLOGY+newest`, `MYCOBACTERIOLOGY_TB+newest`). State is **not** lost on reload of the canonical URL, so the defect is isolated to the breadcrumb linking the bare `/Microbiology/worklist` path rather than the referring URL.

**Impact:** a tech who opens a case from a filtered queue is returned to the unfiltered default and loses their place — the exact "without losing my queue state" goal the story names.

---

### F-5 · Non-culture-only order cannot be saved
**Severity: Low** (order entry is being replaced) · Story AMR-S01 step 5

Selecting only *UAT routine non-culture test* behaves correctly at entry — no Microbiology Program Details panel, Program stays empty. But `POST /rest/SamplePatientEntry` returns:

```json
{"error":"Order save did not persist (verification check failed). See server logs."}
```

Three consecutive times, HTTP 500, with **nothing surfaced in the UI** and Save / Save & Next / Save Draft all still enabled. The culture order through the identical flow saved cleanly, so it is specific to the non-culture-only selection.

---

### F-6 · Worklist pagination off-by-one
**Severity: Medium** · Found outside the checklist

`page=0` and `page=1` return **byte-identical rows**. Reproduced at `pageSize=10` and `pageSize=100`, and on both the culture and AST grains. Paging 0→2 yields 289 rows against a reported total of 189, with 100 duplicates. The shared queue is unusable past the first page.

---

## 3. Secondary defects

| # | Finding | Detail |
|---|---|---|
| D-1 | **Alerts dashboard shows 1970 dates** | All **16** Microbiology Critical alerts render Created as e.g. `1/21/1970, 8:19:02 AM`, including one created during this run. Seconds being rendered as milliseconds. |
| D-2 | **Report readiness badge contradicts its own checks** | Overall badge reads **"Not Ready"** while both sub-checks read green *"Final release ready"* and the Release button is enabled and works. Reproduced on two cases. Corrects to "Final Released" after release. |
| D-3 | **WHONET readiness reuses the wrong string** | Under heading *WHONET READINESS*, the state line reads "WHONET export ready" but the tick text repeats **"Final release ready"**. |
| D-4 | **Raw ORM error leaks to the client** | Recording an AST reading against an unidentified isolate returns `400 {"error":"MICROBIOLOGY_REFERENCE_INVALID","message":"id to load is required for loading"}` with **no UI feedback** across 3 attempts. The underlying rule (identify before AST) is correct and the call returns 200 once the isolate is confirmed — only the surfacing is wrong. |
| D-5 | **Critical-result target picker is inert** | The *Critical result target* select (Case / Isolate / Sample Item / Result) is driven by the `targetType` URL parameter; changing it in the dropdown leaves `targetType=CASE`. The target can only be set by entering from the corresponding surface. |
| D-6 | **Patient DOBs render as "Invalid date format:"** | Most seeded `UATMICRO-*` patients in Patient Search; only `UATMICRO-01C82736AB` shows a real DOB. |
| D-7 | **Seeded stage/data out of sync** | Case `UATMICRO54F33E95EE` sat at stage `SETUP_RECORDED` with **no recorded media**, leaving *Add subculture* disabled until an inoculation was actually recorded. |

---

## 4. Spec divergences (M-00)

These are documentation drift, not build defects — the doc is generally the stale party.

| Spec | Delivered | Note |
|---|---|---|
| §11 i18n key table — 13 keys under `micro.*` | **709 keys, all under `microbiology.*`; 0 of the 13 present** | The §8 `module.surface.element` *pattern* is honoured. Sibling specs citing `micro.*` keys cite keys that don't exist. Cheapest fix is amending the docs. |
| §5 stage names | `SETUP_RECORDED` (≠ INOCULATING), `IDENTIFICATION` (≠ ORGANISM_ID), `REVIEW_READY` (≠ READY_REVIEW), `PRELIM_RELEASED` (≠ PRELIM_REPORTED), `FINAL_RELEASED` (≠ FINAL_REPORTED), `NO_GROWTH_READY` (≠ NO_GROWTH_FINAL), plus new `AST_READY` | Naming drift only — see the withdrawal in §6. |
| Glossary — Significance: 5 values | **4 values**: Unknown / Clinically significant / Contaminant / Normal flora | No `COLONIZER`; `PROBABLE_CONTAMINANT` collapses to *Contaminant*. Feeds WHONET/antibiogram semantics, so reconcile deliberately. |
| §1.4 Micro submenu — Worklist / Case Search / Antibiogram | **Microbiology worklist / WHONET export** | Case Search absent (0 matching i18n keys, no route). Antibiogram correctly absent (post-1B). WHONET export present but not in §1.4's submenu. |
| §1.4 Admin — Breakpoint Catalog at top level | Nested under *Microbiology reference data* | Plus an extra *Patient origins*. Macro Library and WHONET Mapping admin absent. |

---

## 5. What works and should be preserved

- **§8.1 no per-case ownership.** Worklist rows carry **no** owner or assignment field; the column is *Last activity by*; the page is badged *Shared queue*. The only `assign`-matching key in 709 is about `workflow_type = UNASSIGNED`.
- **§8.2 reuse.** `cultureMethodId` (Method / A-REUSE-1), `nonconformanceCount` (NCE), `activities[]` (History/Note), `siblingCases` (SampleItem × workflow_type). *Mark lost* routes into the **same** nonconformance form as *Report NCE* — the specified reuse, not a micro-only mechanism.
- **§8.3 inline, not modal.** Section rail with in-place expansion, deep-linked via `?section=`; bench actions are inline confirms.
- **Reagent-lot governance.** The expired lot is genuinely `disabled` (not merely styled) with a named reason, FEFO lots tagged *use first*, QC status shown, and counts decrement on use (20 → 19 → 18).
- **Panel auto-ordering.** `panelProvenance: ORGANISM_DEFAULT` — identifying the organism pulls its configured default panel with no manual choice (A-REUSE-2).
- **Breakpoint interpretation.** Faithful to the loaded catalog with a stable `breakpointRuleId` and clean band boundaries (probed S ≤8 / I 16 / R ≥32).
- **Stage-aware gating.** *Mark positive* disabled at Received; *Review AST run* disabled until every ordered antibiotic has a reading; *Revert to original* disabled pending a revert reason; *Start repeat attempt* disabled until the antibiotic is chosen. Four separate guards, all correct.
- **Override / revert.** Both reason-gated, with original preserved alongside the override and full history.
- **Repeat/retest model.** Attempt 2 records `attemptType` and `sourceRunId`, retains its reason, and leaves Attempt 1 untouched and still *Included in report*.
- **Critical communications.** Open → Acknowledged → Closed, reason-gated at close, synced to the **existing** Alerts dashboard as *Microbiology Critical / Resolved*.
- **Final-release lock is enforced server-side**, not just in the UI — driving the API directly returns `409 FINAL_CASE_LOCKED`.
- **Amendment lifecycle.** Open → unlock → correct → release → re-lock, with Version 1 preserved verbatim and Version 2 declaring what it corrects.
- **Date integrity.** Day-13/14 dates survive entry → persistence → re-render with no day/month transposition.

---

## 6. Withdrawn — findings that did not survive verification

Kept visible so the ledger reads as self-correcting rather than as advocacy.

- **"The entire terminal / unhappy-path branch of §5 is absent."** Withdrawn. This rested on a regex sweep of loaded JS chunks — but the app is code-split, and the worklist page loads ~31 of them. Re-running the identical sweep after visiting the case sections raised it to 58 chunks and surfaced `FINAL_RELEASED`, `LOST_SPECIMEN`, `LOST_SPECIMEN_POSITIVE`. I then drove a case into `FINAL_RELEASED` and another into `AMENDED`. **Absence cannot be proven from the client bundle.** Only the naming drift survives.
- **"Ciprofloxacin MIC 4 reported Susceptible — clinically backwards."** Withdrawn. Probing the full range showed the seeded rule is S ≤8 / I 16 / R ≥32, applied faithfully. The engine is right; the *"CLSI 2026"* seed values are synthetic. **Flagged separately** so nobody reads UAT output as clinically valid.
- **"Discarding micro details still persists a case."** Withdrawn. A controlled repro showed the discard path persists nothing (0 cases after typing history, after Discard, after Cancel, after `beforeunload`). The stray case came from my own harness sequencing.
- **"Mark positive does nothing."** Withdrawn — the item is correctly `disabled` at Received stage.
- **"Program does not resolve to Microbiology."** Withdrawn — recorded against the legacy `/SamplePatientEntry` screen by mistake. On `/order/enter` it resolves and is disabled.
- **"Revert to original is broken."** Withdrawn — correctly disabled pending a required revert reason.
- **"Micro REST endpoints are all live."** Withdrawn — un-prefixed `/rest/...` paths return SPA fallback HTML with status 200. Only `/api/OpenELIS-Global/rest/...` gives real status codes.

---

## 7. Environment note — deploy churn broke review continuity

The instance redeployed **at least four times** during the run: `bc7ca33` → `8da391a` → `ac2341c` → `ad18410`.

The review widget keys every answer by `deploymentId` and does not migrate them. Each deploy silently orphaned prior answers and reset stories to step 1 — I lost and re-recorded verdicts three times. **A human reviewer would lose their place with no warning.** Worth fixing, or freezing the build for review windows, before asking people to work a 60-step checklist.

---

## 8. Coverage

**Recorded (32/60):**

| Story | Result |
|---|---|
| AMR-S01 · M-03 Route culture order | 4 pass / 1 fail |
| AMR-S02 · M-04 Record culture progression | 4 pass |
| AMR-S03 · M-11 Communicate and release | 3 pass |
| AMR-S05 · M2 Open a controlled correction | 2 pass |
| AMR-S06 · M2 Preserve repeat/retest attempts | 2 fail |
| AMR-S07 · M2 Release and verify corrected results | 1 pass / 1 fail |
| AMR-S09 · M2/R1 Trace bench consumable lots | 3 pass |
| AMR-S17 · M-07 Work the Culture queue | 1 pass (2 marks lost to deploy) |
| AMR-S18 · M-04 Classify and navigate sibling cases | 1 fail / 1 pass |
| AMR-S19 · M-04 Identify isolates and manage exceptions | 3 pass |
| AMR-S20 · M-05 Review manual AST | 3 pass |
| AMR-S28 · M-04 Set or change bench protocol | 2 pass |

**Not yet run (28):** AMR-S04 TB shared-specimen reflection · S08 keyboard a11y · S10 organism/antibiotic vocabularies · S11 AST panel versions · S12 breakpoint catalog lifecycle · S13 breakpoint CSV import · S14 WHONET export (6) · S21 analyzer AST and QC · S22 AST queue.

---

## 9. Recommended order of repair

1. **F-1 Change workflow 500** — unblocks 8 stuck cases and the whole UNASSIGNED path.
2. **F-2 amended results on patient view** — clinical-safety; the data is already correct, this is a render fix.
3. **F-3 AST corrections under amendment** — amendments are currently half-functional.
4. **F-6 pagination off-by-one** and **F-4 breadcrumb state** — small, isolated, high daily friction.
5. **D-1 epoch dates**, **D-2/D-3 readiness copy**, **D-4 raw ORM error** — cheap credibility fixes.
6. **Spec reconciliation** (§11 keys, §5 stage names, significance values) — doc-side.
7. **Stabilise deploys** before human UAT.

---

## 10. Test data created

On patient `UATMICRO-01C82736AB` unless noted. Per LIMS rule these should be **deactivated, never hard-deleted**.

| Lab / case | State |
|---|---|
| `DEV01260000000000031` | Saved, micro case created (legacy screen) |
| `DEV01260000000000034` | **FINAL_RELEASED** — full walkthrough case |
| `DEV01260000000000035` | Saved; harness artefact |
| `DEV01260000000000036` | Not saved (F-5) |
| `DEV01260000000000037` | Not saved (discard repro) |
| `UATMICRO54F33E95EE` (`fb337e70…`) | **FINAL_RELEASED + amended to Version 2** |

**Caveat:** while probing the breakpoint bands I posted 8 extra readings to run `d4ddf430…`, so `DEV01260000000000034`'s report reflects my last Ciprofloxacin reading (MIC 32 → R), not the first (MIC 4 → S). Don't read that case as a clinical example.

---

*All API assertions are reproducible from the browser console using the `/api/OpenELIS-Global` base path.*
