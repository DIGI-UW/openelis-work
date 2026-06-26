# Clinical Order Entry — Gate Register & Change List

Live walkthrough on indonesiademo.openelis-global.org (build v3.2.1.10). Purpose: (1) document every gate that blocks progress so we can get the order through and capture docs screenshots, and (2) record what we'd change for the final version. Hand-off target: Reagan.

Wizard stages: **Enter Order → Collect → Label & Store → QA Review** (4 steps).

---

## Live deep-test findings — Enter Order enable logic (25 Jun, Chrome-driven)

Drove a fresh clinical order field-by-field, watching the Save & Next `disabled` state:

- **Save & Next stays DISABLED** with: empty form → +lab number → +patient (Peter Parker) → +Site (Casey Hospital) → +Sample Type. It only enables once **a test/panel is also added**.
- **Therefore the effective enable set = Lab Number + Patient + Site + Sample Type + ≥1 Test.** Provider is **not** marked required (no `*`) and is not part of the enable gate; Program is not part of it either.
- **Required indicators on the form:** "Lab Number *", "Site Name *", plus one more `*` — so Site is genuinely required (confirms G3 / legacy / Casey). Provider has no `*`.
- **G5/G6 CONFIRMED live as drift:** the build requires a **Sample Type + a Test** to advance Enter Order, which contradicts FRS ORD-1b ("sample type and tests are OPTIONAL at this step… order can be saved without tests selected") and the stated intent (step-1 pre-population is optional; collector confirms in step 2).
- **Tooling note (also a dev signal):** the Carbon sample-type/unit selects are controlled components that **revert a programmatically-set value** — they only register a real user-generated change event. This is why headless capture must use Playwright `selectOption`, and why pure-JS probing of the test-selection step is unreliable. Remaining Collect/multi-sample/refer-out cases are best driven via the Playwright harness (real events) or hand-driven with capture.

### ⭐ ROOT CAUSE of the Collect "Save failed" — date-format bug (G8 supersedes; primary Reagan item)

Captured the failing request payload live (clinical Collect, 25 Jun). The generic "Save failed" toast hides a **server 400** on `POST rest/SamplePatientEntry`:

```
fieldErrors: [{ field: "sampleXML", defaultMessage: "Field sampleXML date is not in a valid date format" }]
```

The **sampleXML serializes the sample `date` and `receivedDate` as MM/DD/YYYY** while the rest of the payload and the app locale use **DD/MM/YYYY**:

```
sampleXML: <sample ... date='06/25/2026' ... receivedDate='06/25/2026' uom='49' quantity='1' ...>
   vs.  currentDate="25/06/2026"  requestDate="25/06/2026"  birthDateForDisplay="15/05/1990"
```

The server parses DD/MM, so `06/25/2026` = day 06 / **month 25** → invalid → 400.

- **Deterministic when the day-of-month > 12** (today = 25 → always fails); **ambiguous/may pass when day ≤ 12** — this is exactly the intermittency ("sometimes it works, sometimes the order is unrecoverable") that's been observed.
- **Quantity/Unit/other-field toggles do NOT fix it** (G7/G8): confirmed live across multiple attempts — the 400 persists with quantity=1, Unit set (uom='49'), and with/without "lab performed sampling". The captured sampleXML date stayed `06/25/2026` (MM/DD) every time. (An earlier impression that "setting the UOM fixes it" did not hold up — the date serialization is consistently malformed today.) The malformed value is the **collection/received date the picker holds**, serialized MM/DD regardless of other edits.
- **Workaround to get past Collect today:** set the Collection Date (and Received Date) to a **day-of-month ≤ 12** — then the MM/DD string still has a valid month under DD/MM parsing, so the format check passes (the interpreted date is wrong, but it saves). This is only a test workaround, not a fix.
- **Date format is configured** in **Admin → General Configuration → Site Information → Date locale**. The rest of the payload already honours it (DD/MM/YYYY); the sampleXML `date`/`receivedDate` do not — they emit MM/DD/YYYY.
- **Surfacing:** the only feedback is the generic "Save failed" toast — no field-level message — and once a bad save posts, the order is **unrecoverable** (drives G1).
- **Field desync CONFIRMED (the unrecoverable mechanism):** with the Collection Date / Received Date fields showing **01/06/2026** on screen, the submitted sampleXML still posted **`date='06/25/2026'` / `receivedDate='06/25/2026'`** (today, MM/DD) and 400'd. So the submitted sampleXML date is **not bound to the Collection Date field** — it carries a stale/today value, and editing the field changes only the display. Once the order is in this state it can **never** save → unrecoverable (G1).
- **Two coupled defects for Reagan:**
  1. **Date format:** serialize the sampleXML `date`/`receivedDate` (and any sampleXML date attrs) using the **configured Date locale (Admin → General Configuration → Site Information)**, consistent with the rest of the payload (DD/MM/YYYY) — not MM/DD.
  2. **Field binding:** the submitted sampleXML date must reflect the **Collection Date field value**, and must update when the user edits it (currently it's frozen to a stale/today value, which makes a failed order unrecoverable).
  - Plus: **surface the real server fieldError** instead of the generic "Save failed" toast. Highest-priority order-entry bug; root of the Collect failures and G1.
- **Caveat / unexplained:** a clinical order (DEV…058) *was* driven to Completed earlier the same day, so there is some path that saves; the exact success-vs-fail trigger isn't fully isolated, but the failing path is definitively the stale MM/DD sampleXML date above. Re-test on a day-of-month ≤ 12 to separate the format issue from the binding issue.

## Page 1 — Enter Order

| # | Gate / behaviour observed | Required to proceed? | Recommended change for final version |
| :-- | :-- | :-- | :-- |
| G1 | If required fields are not filled correctly on the **first** attempt, the page throws a **non-clearable system error**. Worse: it is **not recoverable** — reloading or starting a new Add Order does NOT clear it, and the previously chosen Site/Provider persist into the next order (see G12). | n/a — defect | Validation must be non-destructive: block Save & Next with inline field errors, never a fatal/unrecoverable error. The error must be recoverable in place, and a new Add Order must start from clean state. |
| G2 | **Program** must be selected. | Yes | Confirm whether Program should truly be mandatory for every clinical order, or default/optional. |
| G3 | **Site** (sampling site / requester site) must be selected. | Yes | Confirm required; ensure the autocomplete commits the selection cleanly. |
| G4 | **Referring doc / Provider** must be set. | Yes | Confirm required vs optional. |
| G5 | **Sample (type)** must be chosen. | Yes | Expected. |
| G6 | **Tests** must be added. | Yes | Expected. |
| — | National ID (patient) — required when creating a New Patient; empty value silently blocks Save & Next (no inline error). | Yes (new patient) | Surface an inline "National ID required" error instead of a silent block. |

## Page 2 — Collect

| # | Gate / behaviour observed | Required to proceed? | Recommended change for final version |
| :-- | :-- | :-- | :-- |
| G7 | **Unit of measure (UOM)** of the sample must be chosen. | Yes | Expected if quantity is given — but see G8. |
| G8 | **Quantity defaults to `1`** (a false value), with the Unit blank. CONFIRMED live: quantity input = `1` by default. | **CRITICAL — data integrity** | A pre-filled `1` writes a **false quantity** into the saved record even when no quantity was measured. Quantity MUST render **blank/null** and only persist a value the user actually enters. **Null is correct; a default of 1 is NOT** (Casey). This corrupts data even on an otherwise-successful save — independent of the date bug — so it is its own critical fix, not just a UX nicety. A blank UOM must not error the save (UOM derives from the catalog / required only when a quantity is entered). |
| G9 | **Collect page loads scrolled to the bottom** instead of the top on stage transition. | UX defect | On entering a stage, scroll to the top (focus the first actionable field / the stepper). |

## Page 3 — Label & Store

| # | Gate / behaviour observed | Required to proceed? | Recommended change for final version |
| :-- | :-- | :-- | :-- |
| G10 | **Save & Next is blocked until you BOTH click "Print All Labels" AND make a storage choice** (assign a location or tick "Skip storage for unassigned samples"). Confirmed live: had to do both to continue. | Yes — defect | Both should be **optional** — allow Save & Next with neither done. **Skipping storage must require NO click**: if the user does nothing, unassigned samples process immediately. NOT in the spec — LBL-3 makes storage optional with no Assign button, NAV-4 does not condition Save & Next on print/storage. Pure implementation drift. |

Print Labels (Order Label + per-sample labels), Print All Labels, a Refer Out / Subcontract table, and the skip-storage toggle are all present. Reached Label & Store (2/4) after setting the Collect Unit (`SamplePatientEntry` 200).

## Page 4 — QA Review

| # | Gate / behaviour observed | Required to proceed? | Recommended change for final version |
| :-- | :-- | :-- | :-- |
| G11 | QA Checklist has 4 FIXED items that must all be ticked before Submit: Patient info correct; Sample types/tests correct; **Labels have been printed and applied**; **Storage locations have been assigned**. The last two can be untrue (e.g., storage was skipped on Label & Store), forcing the user to attest to something that did not happen. | Yes | Per Casey: the QA/QC checklist should only gate Submit **when the corresponding configuration option is enabled** (Samuel is building this setting). With the option off (default), the checklist must not block Submit. When on, make items conditional on the order (relax "Storage assigned" when skipped, "Labels printed" when not applicable). |

Shows read-only Patient Information, Sample Summary, and Order Details. Actions: Save, Submit, Report NCE (danger). "QA checklist is incomplete" message blocks Submit until all four boxes are ticked.

---

## Run log

**Order DEV01260000000000058** (Peter Parker, build v3.2.1.10, 25 Jun 2026)

- **Page 1 Enter Order:** filled Program = Routine Testing, Site = Casey Hospital, Provider = Dr Casey, Sample Type = Whole Blood, Panel = NFS (18 tests), Patient = Peter Parker (National ID NID-PARKER-1990). An early premature Save (before Program/Sample) saved cleanly and stayed on Enter Order — no error this time; the non-clearable error (G1) was not reproduced on this run.
- **Save & Next → Collect:** POST `rest/SamplePatientEntry` returned **200**. Advanced to Collect.
- **Collect load:** page opened scrolled to the bottom (G9). Sample 1 defaults: Sample Type = Whole Blood, **Quantity = 1, Unit = empty** (G8 error combo). Received Date/Time auto-filled; Collection Date/Time present.
- **Collect → Label & Store:** set Unit = mL (cleared G8), Save & Next → `SamplePatientEntry` 200, reached Label & Store (2/4).
- **Label & Store → QA Review:** had to click Print All Labels AND tick Skip Storage to enable Save & Next (G10); then advanced to QA Review (3/4), URL `/order/clinical/qa?order=DEV…058`.
- **QA Review → Submit:** ticked all 4 checklist items, clicked Submit → "Sample order has been saved." Order **DEV01260000000000058 = Completed (4/4 steps)**, all stages Complete. Full clinical wizard verified end-to-end.

---

## Verified happy-path recipe (clears every gate)

1. **Enter Order** — Generate Lab Number; choose Patient (New Patient requires a **National ID**); select **Program**; set **Site** (search → Select); set **Provider** (search → Select); choose **Sample Type**; add a **Panel / Tests**. Fill ALL of these before the first Save & Next (a wrong/partial first entry risks the G1 non-clearable error).
2. **Collect** — set the **Unit** (e.g., mL) on each sample. Quantity defaults to 1; with no Unit the save errors (G8). Leave Collection/Received date-times as pre-filled. Save & Next.
3. **Label & Store** — click **Print All Labels** AND tick **Skip storage for unassigned samples** (or assign a location). Both are currently required to advance (G10). Save & Next.
4. **QA Review** — tick all four checklist items → **Submit** → "Sample order has been saved"; order shows **Completed**.

## Gate summary for Reagan

Defects to fix:
- **G1** — bad/partial first entry can throw a non-clearable system error (reported; not reproduced on this run). Validation must be non-destructive: inline field errors, recoverable in place.
- **G8** — Quantity defaults to `1` with empty Unit → save error. Make Quantity **optional with no default**; require a Unit only when a Quantity is entered.
- **G9** — Collect (and stage transitions) load scrolled to the bottom. Scroll to top / focus first field on stage entry.
- **G10** — Label & Store forces **Print All Labels + a storage choice** to advance. Both should be optional.
- **G11** — QA checklist forces attesting "Labels printed" and "Storage assigned" even when those were skipped. Make conditional on the order, or advisory.

To confirm (intended vs. accidental requirements):
- **G2–G6** — Program, Site, Provider, Sample, Tests all required on Enter Order. Confirm which should truly be mandatory for a clinical order (esp. Program and Provider).

---

## Additional defects & state issues (Casey review, 25 Jun 2026)

| # | Gate / behaviour | Recommended change for final version |
| :-- | :-- | :-- |
| G12 | **Stale requester state.** After the G1 system error (and within a session), the previously chosen **Site and Provider persist** into a new Add Order even though they shouldn't, and they **don't actually function** once the rest of the form is filled (the order behaves as if the requester is invalid). NOTE: a fully fresh browser-tab load of `/order/clinical/enter` shows Site/Provider **empty**, so this is in-session SPA state leakage, not persisted data. This is also the likely cause of the headless harness's Collect "Save failed" (no server request fires — a client-side handler error on an improperly-bound requester). | On New / Add Order, fully reset order state (clear Site, Provider, Program, samples). Ensure a selected Site/Provider actually binds and is used by downstream saves; never carry one order's requester into the next. |
| G13 | **Many unlabeled gotchas / unintended mandatory fields** throughout the workflow (fields that are required without being marked, and gates that were not intended). Full enumeration is the purpose of the deep-testing pass below. | Audit every field: mark truly-required fields with the required indicator; remove unintended mandatory/gating behaviour. |

**Headline for Reagan/Samuel:** this workflow accumulated several **unintended gates and broken state** (G1 unrecoverable error, G8 quantity default, G10 forced print/storage, G11 always-on QA gating, G12 stale requester). Many are likely **drift from the original spec** rather than intended design — see crosswalk below.

---

## Spec crosswalk (drift vs. original FRS) — in progress

Compared observed live behaviour against the original Sample Collection Redesign / Order Entry FRS (gallery `designs/sample-collection/sample-collection-redesign.md`, OGC-537). Classification: **matches spec**, **drift from spec**, or **non-desired function not in spec**.

> **Framing caveat:** the FRS models ONE decoupled workflow with a clinical/environmental toggle. The team later decided to treat **Clinical, Environmental, and Vector as three SEPARATE workflows**, and the FRS was not necessarily updated. So a "drift" on *which fields are required per domain* (G2–G6) may be an **intended consequence of the split**, not a defect — confirm against the current clinical-workflow intent. The clear bugs (G1, G7, G8, G9, G10, G11, G12) are non-desired regardless of the split.

| Gate | Observed | FRS reference | Classification | Recommendation |
| :-- | :-- | :-- | :-- | :-- |
| G1 | Non-clearable, unrecoverable system error; reload/new order doesn't clear; stale Site/Provider persist | XC-1 "auto-save… Recoverable"; DSH-5 "+ New Order → Step 1 with **blank form**" | **non-desired** (bug) | Crash/state defect: error boundary that clears OrderContext; enforce blank-form on new order |
| G2 Program | Appears required to advance | ORD-10 (typeahead combo); **§11 has no Program required-rule** | drift — **confirm vs split** | Decide per current clinical intent; if required, add to §11 + mark field |
| G3 Site | Required to advance | §11 requires Patient (clinical); Site required for *environmental* | drift — **confirm vs split** | For clinical, only Patient is FRS-required; confirm whether clinical now requires a site |
| G4 Provider | Required to advance | ORD-8 search only; **not in §11** | drift — **confirm vs split** | Confirm intended; spec treats it as optional |
| G5 Sample Type | Required to advance | ORD-1b: "sample type **OPTIONAL** at this step… can be specified later during collection" | drift — **confirm vs split** | Per unified FRS optional; confirm if the clinical split intends it required |
| G6 Tests | Required to advance | ORD-1b: tests **OPTIONAL**; "Order can be saved without tests selected" | drift — **confirm vs split** | Same as G5 |
| G7 Quantity default | Quantity defaults to 1 | COL-2 "value + UOM from test catalog"; no default specified | **non-desired** (bug) | Remove hardcoded default; leave blank |
| G8 Qty w/o unit error | Qty 1 + empty UOM → save error | No §11 rule requires quantity/UOM | **non-desired** (bug) | Don't error on blank UOM; derive from catalog or allow blank |
| G9 Scroll | Stage loads scrolled to bottom | Not specified | **non-desired** (bug) | Load at top |
| G10 Print+Storage gate | Save & Next blocked unless Print All Labels AND a storage choice | LBL-3 storage "optional", "no separate Assign button"; NAV-4 not conditioned | **non-desired** (bug) | Remove the dual precondition; both optional |
| G11 QA checklist gate | 4 items must be ticked to Submit (incl. Labels/Storage), even when storage skipped | BR-007: "QA… checks are **advisory, not blocking**" | **non-desired** (drift from advisory model) | Make advisory; config-gate per Samuel's setting; condition items on the order |
| G12 Stale requester | Stale Site/Provider leaks into new in-session order, doesn't function | DSH-5 "+ New Order → blank form" | **non-desired** (bug) | Reset OrderContext on new order; ensure requester actually binds |
| G13 Misc mandatory/gates | Unlabeled/unintended required fields & gates | §11 is a closed required-field list | drift / non-desired (case-by-case) | Audit every required asterisk vs §11 + current per-workflow intent |

### Key findings

- **Drift magnitude — the implementation got away from the spec significantly, and in the wrong direction.** Nearly all the catalogued friction (G1, G5, G6, G7, G8, G9, G10, G11, G12) is **not in the FRS** — the build *added* gates the spec never asked for. The FRS actually describes the looser, desired behaviour: sample/tests optional at step 1 (ORD-1b), storage optional with no Assign button (LBL-3), Save & Next not conditioned on print/storage (NAV-4), QA advisory not blocking (BR-007), errors recoverable (XC-1), new order blank (DSH-5). So the fix is largely **bringing the build back to the spec**, not changing the spec — except the per-domain required-field set (Site/Provider required, Program optional), which the split/legacy-config decision settles.
- **Clear bugs to fix regardless of the workflow split:** G1 (unrecoverable crash), G7/G8 (quantity default + qty-without-unit error), G9 (scroll), G10 (forced print + storage), G11 (QA checklist should be advisory per BR-007, not a hard gate), G12 (stale requester vs DSH-5 blank-form). None of these have spec backing.
- **Required-field questions (G2–G6) need a per-workflow decision, not a spec lookup.** The unified FRS says Sample Type and Tests are *optional* at Enter Order (ORD-1b) and marks only Patient required for clinical (§11). The build makes Program/Site/Provider/Sample/Tests all hard-required. Because the team split into three separate workflows after the FRS, the right move is to confirm the intended required set for the **clinical** workflow specifically and update the (now-stale) FRS to match.
- **The FRS itself needs updating** to reflect the three-separate-workflow decision, so future crosswalks have an accurate baseline.

### Design items to revisit (post-capture)

- **Step-1 → Step-2 test/sample linkage.** Rethink how the tests ordered in Step 1 (and any samples that arrived with the request) carry into Step 2 (Collect) to help the **phlebotomist decide what to draw and which tests map to which sample** (sample↔test assignment). Current pre-population model may be over-complicated; design a clearer collect-side experience.
- **Possible duplicate-patient bug.** Confirm whether saving an order creates a **new patient even when an existing patient was looked up** (many "Peter Parker" records exist; most are from automated New-Patient runs, but verify the lookup path). Inspect the `SamplePatientEntry` payload's `patientUpdateStatus` / patient id handling.

### Design intent (Casey, 25 Jun 2026)

- **Step-1 sample/tests are meant to be OPTIONAL pre-population, not required.** The intent: reception holds the order form (and maybe the samples) at Enter Order, so they *can* log the sample type and requested tests there; then the person collecting in Step 2 (Collect) only **confirms** them rather than re-entering. So G5/G6 making Sample Type + Tests hard-required at Enter Order is the **opposite** of the intent — they should be enterable-but-optional at step 1 and confirmable at step 2. (Casey notes this pre-population design may have been over-complicated and is open to simplifying.) This aligns with FRS ORD-1b.
- **Empty-form gating works correctly:** Save & Next is **disabled** on a blank Enter Order (confirmed live) — so the non-clearable crash (G1) is not an empty-submit; it comes from a specific partial/invalid combination, still to be pinned down.
