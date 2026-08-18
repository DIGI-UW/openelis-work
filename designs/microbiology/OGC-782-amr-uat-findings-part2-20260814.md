# OGC-782 · AMR UAT — Part 2: admin/reference, WHONET, and two withdrawals

**Instance:** amr.openelis-global.org · **Build:** `ad18410` (deployment `20260814T053419Z-ad18410c9222`, branch `feat/782-ogc-782-microbiology-r2-order-bench-protocol`)
**Date:** 2026-08-14 · **Reviewer:** Casey Iiams-Hauser (executed by Claude, signed in as `admin`)
**Supersedes in part:** `OGC-782-amr-uat-findings-20260814.md` (commit `a894697`) — see §1.
**Contains a retraction of its own:** §4 originally reported a harness defect. That claim is withdrawn — the fix was already deployed and the fault was in my test method.

---

## 1. Two previously-filed failures are WITHDRAWN

Both were re-tested under controlled conditions and do not reproduce. They should be struck from the earlier report.

### F-4 — "Breadcrumb discards queue state" → **WITHDRAWN**

Controlled re-test: set **Workflow = Bacteriology** and **Sort = Newest activity** through the UI dropdowns. Both push to the URL (`?workflow=BACTERIOLOGY&sort=newest`). The row link carries them (`/Microbiology/cases/<id>?workflow=BACTERIOLOGY&sort=newest`), the case-page **Worklist** breadcrumb carries them, and clicking it restored both selections exactly.

Round-trip also verified with `stage=INCUBATING`, `urgency=ROUTINE`, `pageSize=10` on the cultures grain, and with `grain=ast&status=pending-setup` on the AST grain — all preserved.

The only omission is `grain` on cultures rows, and cultures is the default grain, so there is no user-visible effect. The original observation was almost certainly an artefact of my own navigation (I had reached the case by a hand-built URL that never carried the filters).

**AMR-S17 step 2 has been corrected from Fail to Pass in the review widget.**

### F-6 — "Worklist pagination off-by-one" → **WITHDRAWN**

Cultures grain, `pageSize=10`: page 1 returns rows 1–10 with the label *"1–10 of 170 items"*; page 2 returns a completely different 10 rows labelled *"11–20 of 170 items"*. AST grain, `pageSize=20`: page 1 returns 20 rows, page 2 returns the remaining 10 of 30. Pagination is correct on both grains.

The only reproducible behaviour is that `page=0` returns the same rows as `page=1`. That is **correct defensive clamping** for a 1-indexed UI, not an off-by-one. My earlier conclusion rested on comparing `page=0` with `page=1` and never comparing `page=1` with `page=2`.

**Net effect:** the six failures in the earlier report are now **four** — F-1 (Change workflow 500), F-2 (amended results indistinguishable on `/PatientResults`), F-3 (AST corrections 500 under amendment), F-5 (non-culture order 500).

---

## 2. New findings

Ranked by consequence.

### N-1 · WHONET export emits one row per AST *reading*, not per isolate–antibiotic
**Severity: High · Category: correctness / surveillance data integrity · Story: AMR-S14**

The WHONET preview and the generated CSV both emit a row for every recorded AST reading. Case `DEV01260000000000034` contributes **10 Ciprofloxacin rows for a single isolate** with contradictory codes — 8 × `S`, 1 × `R`, 1 × `I`.

De-duplication is set to *First patient-organism isolate in 7 days*, which dedups **isolates**, not readings. WHONET's data model expects one result per isolate–antibiotic; ten conflicting CIPUAT rows for one organism–drug pair corrupt both numerator and denominator of any resistance rate computed from the file.

The repeat readings in this case came from my own breakpoint-band probing, but the scenario is legitimate and is explicitly in scope elsewhere in this checklist: AMR-S21 step 2 covers *"invalidate a blocked run and start its repeat"*. Any corrected or repeated reading will multiply-count.

**Suggested fix:** collapse to the last reportable reading per (isolate, antibiotic, method) at export time, or exclude superseded readings the same way the report preview does.

**Evidence:** `WHONET_2026-08-01_to_2026-08-31.csv`, 15 data rows, of which 10 are `DEV01260000000000034 | CIPUAT`.

---

### N-2 · Server-side errors are swallowed by the reference-data dialogs
**Severity: High · Category: usability / trust · Story: AMR-S13 (and adjacent)**

Two separate confirmed cases where the API returns a clean, specific, actionable error and the UI displays **absolutely nothing**:

| Action | Server response | What the user sees |
|---|---|---|
| Import a CSV with wrong headers | `400 MICROBIOLOGY_REFERENCE_INVALID` — *"Missing required CSV columns: publisher, version, organism_or_group, antibiotic_whonet_code, method, specimen_type_id, breakpoint_type, susceptible_value, intermediate_lower_value, intermediate_upper_value, resistant_value, units"* | Filename echoed, **Apply valid rows** stays greyed, no message |
| Save a local correction that collides with an existing rule | `409 MICROBIOLOGY_REFERENCE_CONFLICT` — *"A breakpoint rule already exists for this context"* | Dialog stays open, fields appear cleared, no message |

The backend messages are genuinely good. They just never reach the screen. A lab admin handed a real CLSI CSV with a column-name mismatch gets a dead dialog and no way to diagnose it.

**Suggested fix:** surface `message` from the error envelope in the dialog's notification slot. Both endpoints already return exactly what the user needs.

---

### N-3 · Breakpoint CSV preview never reports *unchanged* or *locally customized* rows
**Severity: Medium-High · Category: correctness of preview · Story: AMR-S13 steps 3 and 4**

The apply path is correct; the **preview** path is not, and the preview is what an admin reads before deciding to apply.

- **Re-import of an already-imported row.** Preview: `validRows: 1, unchangedRows: 0` — reported as new work. Apply: no duplicate rule is created (rule count stays 1). So the preview says it will import a row that it will not import.
- **Row whose rule now carries a local correction.** Preview: `validRows: 1, unchangedRows: 0`, with no *locally customized* marker and no warning that applying would touch a local override. Apply: correctly recomputes to `validRows: 0, skippedRows: 3, importedRows: 0` and **leaves the local correction intact** (verified — the rule kept `R = 16` and Source `Local correction`).

So the protection is real and the data is safe. The preview simply does not run the same comparison the apply step runs, and the `unchangedRows` counter is never populated. An admin reviewing a 2000-row CLSI update would be told every well-formed row is a change.

**Suggested fix:** have `/imports/preview` run the same diff as `/imports/apply` and populate `unchangedRows` plus a per-row `locallyCustomized` flag.

---

### N-4 · Breakpoint import accepts clinically impossible numeric bands
**Severity: Medium · Category: validation · Story: AMR-S13 step 1**

Vocabulary validation is strong — unknown organism, unknown antibiotic code, unsupported method, invalid decimal, missing units are all caught with row-specific, actionable messages. Numeric **plausibility** is not checked:

| Row | Result |
|---|---|
| `susceptible_value=64, intermediate 2–4, resistant_value=8` (S threshold above R threshold) | **accepted as valid** |
| `susceptible_value=-5` (negative MIC) | **accepted as valid** |
| Two rows in one file with identical organism + antibiotic + method | **both accepted as valid**, no duplicate-key error |

An inverted band makes every MIC between 8 and 64 simultaneously susceptible and resistant. Since breakpoints drive S/I/R directly, a typo'd CLSI row would silently produce wrong interpretations.

**Suggested fix:** validate `susceptible < intermediate_lower ≤ intermediate_upper < resistant`, reject negatives, and flag intra-file duplicate keys.

---

### N-5 · A reviewed AST run never names its own breakpoint standard, and the screen implies it was re-based
**Severity: Medium · Category: trust / traceability · Story: AMR-S12 step 3**

The data layer is correct. After activating `CLSI SYNTH-UAT-LOADED`, the reviewed run on `DEV01260000000000034` still reports `breakpointStandardId: oe-micro-standard-05d86b88f`, `breakpointVersion: 2026`, `panelVersion: 6`, and every reading keeps its original `breakpointRuleId` and interpretation. **Nothing is recalculated.**

But the case screen never displays that. The only "Breakpoint standard" control in the AST section is the **new-run setup picker**, which after activation reads *"CLSI SYNTH-UAT-LOADED"* — the newly active standard — rendered directly above the reviewed attempt table. The AST attempts table shows only *"Matched breakpoint: Standard"*, with no standard name or version.

A supervisor auditing that case would reasonably conclude the reviewed result had been re-based onto a standard published after it was signed out. For an AMR module whose whole value is defensible S/I/R provenance, that is the wrong impression to leave.

**Suggested fix:** display the run's bound standard and version on the attempt row, and label the setup picker unambiguously (e.g. *"Standard for new run"*).

---

### N-6 · TB sibling cases present the bacteriology bench workflow verbatim
**Severity: Medium (forward-looking) · Category: spec gap · Story: AMR-S04**

Sibling handling itself is good — see §3. But opening the `MYCOBACTERIOLOGY_TB` sibling shows the **identical** case workbench: Inoculation → Isolates → AST results → Expert review, with next step *"Case received. Record initial setup to begin incubation."* and a **Start inoculation** button.

Nothing in the screen signals that TB is out of scope for this MVP, and a bench tech following the on-screen prompt would record bacteriology setup against a TB record.

**Highest-value gap for a future TB bench workflow** (the question AMR-S04 asks): TB needs its own stage machine, not the bacteriology one —
1. **Smear microscopy with AFB grading** (scanty / 1+ / 2+ / 3+) as a first-class result, reportable before culture.
2. **LJ / MGIT culture with 6–8 week incubation** and negative-at-week-N logic, versus bacteriology's 24–48 h cadence.
3. **DST with first- and second-line drug panels** and MDR/XDR/RR classification — semantically distinct from an AST panel, and the thing that determines patient treatment.
4. **Molecular results (Xpert MTB/RIF, LPA)** arriving out of band and needing reconciliation against culture.

Until those exist, the cheapest fix is to make the TB sibling read-only with an explicit *"TB bench workflow not available in this release"* state, rather than offering bacteriology actions.

---

### N-7 · The selected AST queue tile carries no accessible or visible selected state
**Severity: Low · Category: a11y / clarity · Story: AMR-S22 step 1**

Selecting **Pending setup** applies correctly and survives reload (`?grain=ast&status=pending-setup`, 9 rows). The tile records the selection only as Carbon's `cds--tile--is-clicked` class, which renders no discernible visual difference, and carries **no `aria-pressed`, `aria-current`, or `aria-selected`**.

After a reload the user cannot tell from the tile row which queue is active; only the row count and the URL reveal it. Screen-reader users get nothing at all.

---

### N-8 · Minor copy and labelling
**Severity: Low**

- **Δ-G still open.** Under **WHONET READINESS** the state line reads *"WHONET export ready"* but the tick beneath still repeats *"Final release ready"* — the final-release string reused in the WHONET tile. Unchanged since the 2026-08-13 report.
- **WHONET mapping-readiness item names.** Exclusions are itemised and attributed — *"WHONET mapping pending (UAT 43C6E0F6AB) · 2 rows excluded"* with a working **Fix organism mapping** deep link. The second item is labelled only *"ISO-1 · 8 rows excluded"*, which is ambiguous across cases.
- **WHONET period semantics.** The file is named `WHONET_2026-08-01_to_2026-08-31.csv`, but every populated `COLLECTION_DATE` in it (2026-07-14, 2026-07-26) falls outside that window, and 3 of 15 rows have an **empty** `COLLECTION_DATE`. The period evidently filters on release date, not specimen date. Defensible, but a surveillance file named for a period whose specimen dates all sit outside it invites mis-binning — worth labelling the filter explicitly.
- **AST panel picker hides the version.** New AST setup lists *"Gram negative AST panel (UAT)"* with no version number, so the bench cannot see which version they are binding.
- **Breakpoint rules table has no specimen column.** Filtering by a concrete Specimen context (Sputum) returned 0 rows for a rule that renders with no specimen shown, so a reviewer cannot tell whether the rule is specimen-scoped or was filtered out wrongly.

---

## 3. What worked well in this leg

**Immutable AST panel versions (AMR-S11) — clean.** Editing `Gram negative AST panel (UAT)` v16 opens a version editor with per-antibiotic order, Tier (1–3) and Report behavior (**Always / Cascade / Only when resistant** — the M-00 §8.2 reflex semantics), under a standing banner *"Saving creates a new panel version; existing AST runs keep their original version."* Publishing is gated by a confirmation that names the version: *"Publish version 17? Existing AST runs will retain their original panel version."* Afterwards v17 is Current, v16 demotes to Historical, v1–v15 remain, and the reviewed run still names v6. New setup binds a different record id from the one I edited. Nothing overwritten.

**Breakpoint standard lifecycle (AMR-S12) — clean.** Activation lives on the standard detail page, requires an effective date, and keeps the button disabled until one is supplied. Exactly one standard is Active at a time: activating `SYNTH-UAT-ED9ACA23` demoted `SYNTH-UAT-LOADED` to Loaded while preserving its effective date; re-activating restored the fixture. All four rule filters round-trip through the URL with zero drift.

**CSV import ergonomics (AMR-S13) — the good half.** Preview never applies anything (`importedRows: 0` until Apply). Errors are row-numbered and specific. **Download rejected rows** produces `breakpoint-import-rejected.csv` with `row_number, message, source_row` — the full source line, so a lab can fix and re-submit. An imported standard lands as **Loaded**, never auto-Active.

**WHONET export (AMR-S14) — 6/6.** Correct breadcrumb (Home / Reports / WHONET export), correct defaults on arrival (previous complete month, clinically significant, first isolate in 7 days), all state addressable in the URL and byte-identical after reload, mapping-repair deep link that opens the exact organism record and leaves the preview in history, WHONET-standard CSV headers, and 18/18 focusable controls with proper accessible names and workflow-ordered focus.

**Sibling workflow handling (AMR-S04) — the mechanism is right.** `UATMICROF99D265F37` carries one accession and one sample item (`40`) with two case records. Each header shows *"Related specimen workflows:"* with a working link to the other, and *"Workflow: Bacteriology"* / *"Workflow: Mycobacteriology TB"*. No duplicate accessioning. The gap is what the TB record then offers (N-6), not how it is identified.

**AST queue honesty about deferred scope (AMR-S22).** *"Today's resistance hits"* is bounded and attributed — *"Analyzer-reported flags completed today; OpenELIS expert-rule detection remains Phase 1B"* — and the **Expert flags (1B)** tile renders greyed with `–` rather than a fake zero. The Flags column repeats the same caveat per row. Deferred behaviour is not dressed up as implemented.

---

## 4. Review-widget status

### Recorded this leg

| Story | Result |
|---|---|
| AMR-S10 · Maintain organism and antibiotic vocabularies | 4/4 **Pass** |
| AMR-S17 · Work the Culture queue | 3/3 **Pass** (step 2 corrected from Fail — see §1) |
| AMR-S11 · Publish immutable AST panel versions | 2/2 **Pass** |
| AMR-S12 · Control breakpoint catalog lifecycle | 3/3 **Pass** |
| AMR-S14 · Preview and export WHONET CSV | 6/6 **Pass** |

### RETRACTED — "the harness story selector is broken"

**This report originally claimed the widget's story selector was defective and recommended a ticket. That claim is withdrawn.** It was wrong, and the error was mine.

The harness on this instance is `DIGI-UW/openelis-review-tooling` at `f3b34f7c` ("fix(review): mount independently of host app load", 2026-08-14). Walking that commit's ancestry, every story-navigation fix is **already in the deployed build**:

| Commit | |
|---|---|
| `870bab81` | fix(uat): review real stories separately |
| `a490afaa` | feat(uat): **add route-aware story navigator** |
| `91b87f8b` | fix(uat): reveal story overview after selection |
| `fb2acf1d` | fix(uat): keep story description in view |
| `fd820099` | refactor: declutter review widget controls |
| `c3cc8882` | fix(uat): **reject stale story preferences** |
| `f3b9975b` | fix(uat): **keep overlay disclosures exclusive** |
| `bc5fd810` | fix: **make UAT story navigation transactional** |
| `7fdde793` | fix: **preserve open panel across story switches** |

All nine merged to `main` as PR #14, *"Fix UAT story navigation and review widget state"*. The deployment sits one commit behind that head but contains the lot.

Each behaviour I catalogued as a defect is that fix working as designed:

| What I observed | What it actually is |
|---|---|
| `prefs.story` rewritten back on every load | `c3cc8882` **reject stale story preferences** — a stale pref is supposed to be rejected |
| Selection reverting after `activateStory()` | `bc5fd810` **make UAT story navigation transactional**. The source says so in a comment I quoted and still misread: *"the requested story does not become visible state until its checklist passes validation"* |
| The disclosure closing itself | `f3b9975b` **keep overlay disclosures exclusive** |
| Page→story resolution preferring one story | `a490afaa` **route-aware story navigator** |

Two faults in my method produced the false finding:

1. **Synthetic events were `composed: false`.** `new MouseEvent('click')` defaults to `composed: false`, so it does not cross the shadow boundary the way a trusted click does. Every conclusion I drew about "the widget ignores clicks" rests on events that were never equivalent to a user's.
2. **Coordinates were measured across a display change.** Mid-session the Chrome window moved between monitors — `devicePixelRatio` went 1 → 2 and `innerHeight` 914 → 858. My screenshot-to-viewport scaling was computed before that and used after it, so the "physical" clicks that appeared to miss the widget were landing somewhere else on the page.

**Correct characterisation:** the story selector was not shown to be broken. It was not successfully exercised. Those are different claims, and only the second is supported by what I did.

### Recordable in principle, unrecorded in this run

Where two stories share a route path, the route-aware navigator resolves to one of them, and reaching the other requires using the selector — which I never drove correctly:

| Story | Steps | Shares a route with |
|---|---|---|
| AMR-S13 · Import breakpoint updates safely | 4 | AMR-S12 (`/MasterListsPage/MicrobiologyReference/breakpoints`) |
| AMR-S22 · Work the AST queue | 3 | AMR-S17 (`/Microbiology/worklist`) |
| AMR-S21 · Review analyzer AST and QC | 2 | AMR-S17 |
| AMR-S04 · Shared-specimen reflection | 1 | AMR-S17 |
| AMR-S08 · Review the workflow by keyboard | 1 | AMR-S17 |

All were **tested against the live instance**; the substance is in §2 and §5 and stands on its own. Only the widget bookkeeping is outstanding, and a reviewer picking the story from the selector should be able to enter them.

---

## 5. Verdicts for the five stories not entered in the widget

| Story | Step | Verdict | Basis |
|---|---|---|---|
| **S13** | 1 · mixed-validity preview | **Pass** | 1 valid / 2 skipped, row-specific actionable errors, `importedRows: 0` before Apply |
| **S13** | 2 · rejected CSV + apply | **Pass** | `breakpoint-import-rejected.csv` carries source rows; `SYNTH-UAT-QA1` created as **Loaded**, not Active |
| **S13** | 3 · re-import idempotency | **Fail** | No duplicate rule created ✓, but the row is reported as *valid*, not *unchanged* (N-3) |
| **S13** | 4 · local-correction protection | **Fail** | Rule is visibly marked *Local correction* ✓ and is not overwritten ✓, but the preview does not report it as locally customized (N-3) |
| **S22** | 1 · grain/status URL round-trip | **Pass** | `grain=ast&status=pending-setup` survives reload; row link carries `section=ast&astIsolateId=…` and opens the exact isolate |
| **S22** | 2 · active-state context | **Pass** | States named, resistance bounded and attributed, Expert Rules honestly deferred (N-7 is a separate low-severity nit) |
| **S22** | 3 · row command + refresh focus | **Not verified** | Row commands open case-scoped actions correctly, but focus preservation across manual refresh could not be verified — see the method note below |
| **S21** | 1 · analyzer run context | **N/A** | `analyzerResultsAvailable` is `false` on all 39 AST rows and all 100 culture rows. The step is explicitly conditional on analyzer traffic being available; there is none on this instance |
| **S21** | 2 · accept / invalidate / import issues | **N/A** | Same reason. The **Analyzer Import Issues** reconciliation path is named in the worklist banner, but with zero unmatched events there is nothing to exercise |
| **S04** | 1 · TB sibling reflection | **Pass** | Distinguishable, cross-linked, one accession, one sample item — see §3. Gap noted as N-6 |
| **S08** | 1 · keyboard inspection | **Partial** | All 28 focusable controls on the final case carry accessible names (0 unnamed); no keyboard trap — the hidden session-timeout modal's sentinels and Close correctly refuse focus. Amendment / attempt / reporting / lock status is conveyed in **text** (*Attempt 1, Original, Reviewed, Initial attempt, Included in report, Final Released, Final release ready*), not colour alone. **Focus-indicator visibility not verified** |

**Method note on keyboard testing — read with the §4 retraction in mind.** I reported that the browser extension could not deliver real `Tab` keystrokes or focusing clicks (`document.activeElement` stayed `BODY`). The same two method faults that produced the false harness finding apply here: the focusing clicks were aimed with scaling measured before the window changed displays, so they may simply have missed. Order, names and trap behaviour were verified programmatically via `.focus()`, which cannot observe `:focus-visible` styling. Focus-indicator visibility on the case workbench is therefore **unverified** — not failed, and not demonstrated to be untestable. It should be re-checked by hand or with correctly-aimed input. On the WHONET page the same method did show indicators, so at least that screen styles plain `:focus`.

---

## 6. Test data created this leg

All on the UAT instance; none should be hard-deleted (LIMS rule — deactivate instead).

- `Gram negative AST panel (UAT)` **v17** published (Ciprofloxacin moved Tier 2 → Tier 3). v16 demoted to Historical.
- Breakpoint standard `CLSI SYNTH-UAT-LOADED` activated with effective date **2026-08-14** (was Loaded, no standard was Active before).
- Breakpoint standard `CLSI SYNTH-UAT-ED9ACA23` briefly activated (2026-08-15) to prove demotion, then reverted.
- New breakpoint standard `CLSI SYNTH-UAT-QA1` created by CSV import — status **Loaded**, 1 rule, subsequently given a local correction (`R = 16`).
- No cases created, no results released, no downloads written to disk (the WHONET CSV and rejected-rows CSV were captured in memory via the blob, not saved).
