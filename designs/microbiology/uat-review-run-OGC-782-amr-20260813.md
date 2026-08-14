# UAT Review-Widget Run — OGC-782 stack on amr.openelis-global.org

**Date:** 2026-08-13 · **Run by:** Claude (openelis-test-catalog-qa) · **For:** Casey Iiams-Hauser
**Companion to:** `spec-delta-OGC-782-amr-20260813-1620.md`

---

## 0. Read this first — the run was invalidated by deploy churn

The instance **redeployed four times during the session**. Deployment ids observed, in order, from the review widget's own storage:

| # | Deployment id | Seen during |
|---|---|---|
| 1 | `bc7ca33…` | First widget open, legacy-screen attempt |
| 2 | `8da391a…` | All five M-03 verdicts |
| 3 | `ac2341c…` | M-07 steps 1–2 |
| 4 | `ad18410…` | Current, after your reload |

**The review widget keys every answer by `deploymentId`.** When a deploy lands, the previously recorded answers are not migrated, not surfaced, and not warned about — the story simply reads as barely started again. My five M-03 verdicts still exist under `8da391a` and are invisible on the current build; the M-07 breadcrumb FAIL recorded under `ac2341c` is likewise orphaned.

**This is a finding in its own right, independent of my run:** any reviewer part-way through a checklist silently loses their place and their answers whenever the environment redeploys. On an instance deploying this often, the widget cannot hold a completed review. Worth fixing before you ask humans to work these 14 stories.

**Consequence for this report:** treat the verdicts below as *verified observations*, not as durable widget state. The evidence is reproducible; where it landed in local storage is not.

---

## 1. Checklist scope correction

The checklist is **14 stories, not 10**. Six only become visible via "All server stories":

| Story id | Title | Steps |
|---|---|---|
| AMR-S01 | R2 · M-03 · Route and contextualize a culture order | 5 |
| AMR-S17 | R1 · M-07 · Work the Culture queue | 3 |
| AMR-S18 | R1 · M-04 · Classify and navigate sibling cases | 2 |
| AMR-S02 | R1 · M-04 · Record culture progression | 3 |
| AMR-S28 | R2 · M-04 · Set or change the bench protocol | 2 |
| AMR-S19 | R1 · M-04 · Identify isolates and manage exceptions | 3 |
| AMR-S20 | R1 · M-05 · Review manual AST | 3 |
| AMR-S21 | R1 · M-05 · Review analyzer AST and QC | 2 |
| AMR-S22 | R1 · M-07 · Work the AST queue | 3 |
| AMR-S03 | R1 · M-11 · Communicate and release results | 3 |
| **AMR-S04** | **M1 · Shared-specimen reflection (optional)** | 1 |
| **AMR-S05** | **M2 · Open a controlled correction** | 2 |
| **AMR-S08** | **M2 · Review the workflow by keyboard** | 1 |
| **AMR-S09** | **M2/R1 · Trace bench consumable lots** | 3 |
| **AMR-S11** | **M3 · Publish immutable AST panel versions** | 2 |
| **AMR-S12** | **M3 · Control breakpoint catalog lifecycle** | 3 |

(16 rows — the widget lists 14 selectable stories plus two that appear only in the page-scoped view.)

**Completed this run: 8 of ~36 steps.** M-03 (5/5) and M-07 Culture queue (3/3).

---

## 2. Verdicts

### AMR-S01 — R2 · M-03 · Route and contextualize a culture order — **4 PASS / 1 FAIL**

| Step | Verdict | Evidence |
|---|---|---|
| 1 · Program + Micro Program Details | **PASS** | On `/order/enter`: `program` input value `"Microbiology"`, `disabled=true`, helper "Microbiology is derived from the selected culture test". Culture Protocol is read-only text with a **Derived** badge ("UAT micro culture / Blood agar - 18-24h - Ambient"), not an input. **Exactly 5** editable controls, counted from the DOM. No critical-notification control. Bacteriology badge shown. |
| 2 · Date validation + Save & Next | **PASS** | Collection `12/07/2026` → inline "Collection date cannot be before date of admission." with **both** Save and Save & Next `disabled=true`. `14/07/2026` → error cleared, both re-enabled, advanced to Label & Store. **No day/month swap**: case API returns `admissionDate: "2026-07-13"`. Micro context round-tripped to the case (origin INPATIENT, sets 2, history verbatim, abx true, BACTERIOLOGY). |
| 3 · Reopen + no duplicate | **PASS** | Reopened via Scan barcode → Enter Order step: all 5 controls `readOnly=true` with values preserved. API: **exactly one** case for the accession, `siblingCases: 0`. Workbench shows the derived protocol with "Recorded inoculations are never rewritten". |
| 4 · Discard confirmation guard | **PASS** | Clearing the test raises "Remove microbiology workflow?". **Cancel** → test stays checked, panel stays, "Keep this history" preserved, Program still locked (`disabled=true`). **Discard details** → panel removed, test unchecked, Program cleared and editable. Confirmation re-raised on the second clear. |
| 5 · Non-culture-only order | **FAIL** | See Δ-A below. |

### AMR-S17 — R1 · M-07 · Work the Culture queue — **2 PASS / 1 FAIL**

| Step | Verdict | Evidence |
|---|---|---|
| 1 · Canonical URL round-trip | **PASS** | Workflow + Sort wrote to the URL; after a hard reload, workflow `BACTERIOLOGY`, sort `newest`, 20 rows, and **first and last row innerText identical**. |
| 2 · Open case, return via breadcrumb | **FAIL** | See Δ-B below. |
| 3 · Row context + row action | **PASS** | Full context in a Carbon data table. Stage-appropriate gating is **correct**: at Received, "Mark positive"/"Mark no growth" render disabled; "Open case"/"Mark lost" enabled. "Open case" routed to `section=setup` matching the row's due action, preserved the `q=` filter, and changed no clinical state (stage and activity count identical before/after via API). |

---

## 3. Δ Ledger (new findings from this run)

### Δ-A — A non-culture-only order cannot be saved; the UI reports nothing
**Severity: High (server-side) · but see scoping note**

Selecting only "UAT routine non-culture test" on a UAT micro specimen behaves correctly at entry — no Microbiology Program Details panel, Program stays empty. But saving fails outright:

```
POST /api/OpenELIS-Global/rest/SamplePatientEntry  →  500
{"error":"Order save did not persist (verification check failed). See server logs."}
```

Reproduced **3 consecutive times** on lab `DEV01260000000000036`. The UI surfaces **nothing** — no banner, no toast, no field error (queried `[class*=error]`, `[role=alert]`, `[class*=notification]`, `[class*=toast]` — all empty) and Save / Save & Next / Save Draft all stay enabled, so the click reads as a no-op.

**Contrast variant:** the culture order (`DEV01260000000000034`) saved cleanly through the identical flow, so this is specific to the non-culture-only selection, not general order entry.

*Scoping note from Casey: order entry is not the production path, so priority is low — but this is a genuine server-side failure, not a UI quirk, and the silent-failure behaviour is the part worth keeping.*

### Δ-B — The worklist breadcrumb discards queue state
**Severity: Medium · Category: correctness (M-07)**

The case route correctly carries `workflow=…&sort=…` forward. Returning via the **"Microbiology worklist" breadcrumb** empties the query string, resets Workflow to `""` (All workflows) and Sort to `priority`, and renders a different row set.

Reproduced on two independent filter combinations — `BACTERIOLOGY+newest` and `MYCOBACTERIOLOGY_TB+newest` — identical loss both times. State is **not** lost on reload of the canonical URL (step 1 passes), so the defect is isolated to the breadcrumb, which appears to link the bare `/Microbiology/worklist` path rather than the referring URL.

**Impact:** a tech who opens a case from a filtered queue is returned to the unfiltered default and loses their place — precisely the "without losing my queue state" goal this story names.

### Δ-C — Review answers are orphaned on every deploy
**Severity: Medium (tooling) · blocks sustained UAT**

See §0. Answers are keyed by `deploymentId`; a redeploy resets the story to step 1 with no warning and no migration. Four deploys in roughly one hour made a sustained review impossible.

### Δ-D — Legacy Add Order: unsatisfiable required field + silent disable
**Severity: Low (legacy screen, slated for replacement)**

On `/SamplePatientEntry`, `ward/dept/unit` is `required` but its select contains **exactly one option — the empty placeholder** (PMGH, the only configured site, has no subunits), so native validation can never pass. Separately, the actual submit blocker was a blank Lab Number, surfaced only by hooking the response:

```
{"fieldErrors":[{"field":"sampleOrderItems.labNo","defaultMessage":"must not be blank"}]}
```

The UI showed no message and simply left Submit greyed. On the new `/order/enter` screen the same field is **not** required — confirming this is legacy-only.

### Δ-E — Patient search renders "Invalid date format:" for most UAT patients
**Severity: Low · Category: cosmetic/data**

In Patient Results, the Date of Birth cell reads `Invalid date format: Invalid date format:` for most seeded `UATMICRO-*` patients; only `UATMICRO-01C82736AB` shows a real DOB (13/03/1990). Incidental to the review script but visible to any reviewer following it.

---

## 4. Withdrawn — findings that did not survive verification

Kept visible so the ledger reads as self-correcting.

- **"Discarding micro details still persists a case."** Case `DEV01260000000000035` carried `clinicalHistory: "Keep this history"` — the exact text the discard was meant to remove — and I had not pressed Save. Looked like a data-integrity bug. **Withdrawn:** a controlled repro on `DEV01260000000000037` showed zero cases created after typing history (0), after Discard details (0), after Cancel (0), and after firing `beforeunload`/`pagehide` (0). Order 035 was saved by my own harness sequencing, not by the discard path. Step 4 stands as PASS.
- **"Mark positive does nothing — no request issued."** True that no POST fired, but the screenshot shows the menu item is **rendered disabled** at Received stage. Correct stage-appropriate gating, not a defect.
- **"Program does not resolve to Microbiology."** Recorded as a FAIL early on. **Withdrawn:** captured against the legacy `/SamplePatientEntry` screen by mistake. On the specified route `/order/enter` it resolves correctly and is disabled. Corrected in the widget.
- **"Micro REST endpoints are all live."** From the companion report — un-prefixed `/rest/...` paths return SPA fallback HTML with status 200. Only `/api/OpenELIS-Global/rest/...` gives real status codes.

---

## 5. What works and should be preserved

Re-confirmed on the live build during this run:

- **§8.1 no per-case ownership** — worklist row objects carry no owner/assignment field; the table's column is **Last activity by** (user + timestamp); page badged "Shared queue".
- **§8.2 reuse** — case detail carries `cultureMethodId` (Method, A-REUSE-1), `nonconformanceCount` (NCE), `activities[]` (History/Note), `siblingCases` (SampleItem × workflow_type).
- **§8.3 inline, not modal** — Case Detail is a section rail (Case info · Inoculation · Timeline · Isolates · AST results · Expert review · Critical communication · Reports · Amendments) expanding in place, deep-linked via `?section=`.
- **Workflow routing** — `workflow_type` live across the queue (BACTERIOLOGY / MYCOBACTERIOLOGY_TB / UNASSIGNED, plus reserved MYCOLOGY in the filter), with the M-04 *Change workflow* escape hatch.
- **Stage-appropriate action gating** — bench actions disable themselves when the case stage makes them invalid, rather than failing at submit.
- **Folded dashboard** — "Today's resistance hits" (ESBL/MRSA/CRE/VRE/MDR) and "Recent activity (25)" render on the worklist itself, honouring the §1.4 D0 decision.
- **Date integrity** — day-13 and day-14 dates survive entry → persistence → re-render with no day/month transposition, on both the admission and collection fields.

---

## 6. Test data created (for cleanup)

All on patient `UATMICRO-01C82736AB`:

| Lab number | State | Note |
|---|---|---|
| `DEV01260000000000031` | Saved, micro case created | Legacy-screen order, clinical history prefixed `QA_AUTO_0813` |
| `DEV01260000000000034` | Saved, micro case `c932b1c0…` | The M-03 walk-through case; history "Persistent fever after antibiotics" |
| `DEV01260000000000035` | Saved, micro case `aa39d5b9…` | Unintended — harness artefact; history "Keep this history" |
| `DEV01260000000000036` | **Not saved** (500) | Non-culture-only, Δ-A |
| `DEV01260000000000037` | **Not saved** | Discard-repro, no case created |

Per LIMS rule these should be **deactivated, never hard-deleted**. I did not deactivate them — no deactivation control was exercised this run, and the cases are stage `RECEIVED` with no clinical results attached.

---

## 7. Recommended next actions

1. **Stabilise the environment before any human UAT.** Four deploys in an hour, each orphaning review answers, makes the 14-story checklist unfinishable. Either freeze the build for the review window or migrate widget answers across deployments (Δ-C).
2. **Fix the breadcrumb** (Δ-B) — small, isolated, and it directly defeats the stated goal of the M-07 story.
3. **Fix the worklist pagination off-by-one** (from the companion report — `page=0` and `page=1` return identical rows, reproduced at two page sizes and both grains).
4. **Triage the non-culture 500** (Δ-A) from server logs — low priority given order entry is being replaced, but the silent-failure pattern may be shared with the replacement.
5. **Re-run the remaining ~28 steps** once the build is stable — M-04 (×4 stories), M-05 (×2), M-07 AST queue, M-11, plus the six M1/M2/M3 stories not previously enumerated.

---

*All API assertions reproducible from the browser console on `/Microbiology/worklist` using the `/api/OpenELIS-Global` base path. Verdicts recorded in the widget were not submitted — no server-side review record was created.*
