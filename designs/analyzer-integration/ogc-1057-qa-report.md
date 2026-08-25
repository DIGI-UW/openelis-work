# OGC-1057 — Analyzer guided setup: QA report

| | |
|---|---|
| **Story** | [OGC-1057](https://uwdigi.atlassian.net/browse/OGC-1057) — *Analyzer Types: guided analyzer setup + verify + connect (v3)*, slice of OGC-1054 |
| **Spec** | [`analyzer-profile-mapping.md`](./analyzer-profile-mapping.md) — Analyzer Types & Mapping FRS |
| **Slice scope** | FR-B1…B6, FR-C1…C3, FR-F1…F2 · **AC-1 … AC-10** |
| **Instance** | analyzers.openelis-global.org · v3.2.1.11 (35.85.196.163) |
| **Date** | 2026-08-12 |
| **Method** | Interactive walkthrough (Claude in Chrome) with REST round-trip verification, findings ruled bug-vs-harness live by Casey Iiams-Hauser |
| **In-app UAT** | `analyzers--ANAL-S07` / `ANAL-S09` — 3 stories, 9 steps, all answered |
| **Test suite** | `analyzer-guided-setup.spec.ts` + `analyzer-guided-setup.md` in the OpenELIS-QA repo |

---

## Verdict

The guided setup is **built and coherent as a shell**. Add Analyzer expands inline with the list
still visible, the instrument picker loads a shipped profile with a clear summary, name and lab
units round-trip cleanly, readiness recalculates live and states its blockers in plain language,
and there is no plugin class, no regex and no raw config anywhere in the lab-facing flow. That part
of the FRS's intent is met.

What is not built is the thing the feature exists for: **mapping**. There is no way to map an
analyzer test code to an OpenELIS test through the interface, the profile does not apply whole and
does not say so, and the one remediation control that does exist cannot be saved. The result is
that **no analyzer created from a shipped profile can be verified or activated through the UI.**
The instance bears this out — 12 analyzers, one ACTIVE, and that one was configured by another path.

**Maturity: M1.** Instrument alone reaches M3. Verify is capped at M1 — no catalog cross-link, the
profile does not round-trip, no mapping GUI, sign-off unreachable. Connect is M2 for the stored
address; its probe was not judged. A module rates at its lowest sub-feature.

---

## Acceptance criteria

| AC | Requirement | Result |
|---|---|---|
| AC-1 | Add Analyzer expands inline; list stays visible | **PASS** |
| AC-2 | Instrument → Verify → Connect, stacked, collapsing to summaries | **PARTIAL** — separate routes; a 4th "Review" step exists |
| AC-3 | Search-based instrument picker; selection loads the profile | **PASS** — Dropdown type-ahead |
| AC-4 | "My instrument isn't listed" → name, protocol, connection type | **FAIL** |
| AC-5 | Verify row shows code · test · LOINC · status; deterministic LOINC==LOINC vs active tests | **FAIL** |
| AC-6 | Explicit human confirmation, `ANALYZER_MAPPING_VERIFIED` audited | **FAIL** |
| AC-7 | QC codes in Verify, confirmed | **FAIL** |
| AC-8 | Non-match offers Resolve → search / catalog link / don't-receive | **FAIL** |
| AC-9 | A missing test does not block the others | **FAIL** |
| AC-10 | One-way default; two-way only when supported, probe-verified, degrades on timeout | **PARTIAL / deferred** |

Also touched: AC-12 result-mapping empty state **PASS**; AC-17 deactivate-never-delete **FAIL**.

---

## Findings

### 1 — There is no way to add or re-point an analyzer code in the GUI *(blocking)*

The Profile-Applied Test Mappings table has **zero controls on every row**, both on the setup step
and on the standalone Field Mappings page reached from the row menu. The whole page offers seven
controls: two breadcrumbs, *Open Test Catalog* (only from a result-value empty state), *Save result
mappings*, *Verify current setup*, *Manage QC rules*, *Add or select control lot*. No add-row, no
edit, no re-point, no remove, no Resolve.

The only surface that can ever receive a new code is *Pending Unmapped Codes*, which is populated by
transmission. A code can therefore only enter the system by the instrument sending it — never by an
administrator entering it. For a lab standing up a new cartridge menu, or correcting a mapping, that
is backwards. **FR-D1, FR-D2 and FR-C2 are unbuilt.**

### 2 — The profile applies only what resolves, and says nothing about the rest *(blocking)*

| Profile | Declared | Persisted | Dropped |
|---|---|---|---|
| `astm/genexpert-astm` | 28 | 13 | HIV-1 Qual, HBV, HPV HR, HPV 16_18-45, CT, NG, EV, CDIFF, MRSA, SA, TV, VANA, VANB, Mpox, WB |
| `file/quantstudio` | 17 | 10 | CHIKV, CHIK, ZIKV, ZIKA, MPXV, Mpox, MPox |
| `astm/sysmex-xn` | 13 | 13 | — |
| `hl7/mindray-bc5380` | 13 | 13 | — |

The filter is deliberate: what survives maps to diseases this catalog has tests for (HIV, Dengue,
COVID, MTB/RIF); what is dropped maps to diseases it does not (Zika, Chikungunya, Mpox, HPV, CT/NG,
C. difficile, MRSA, Trichomonas). Two defects sit on top of it:

- **It is silent.** The Verify table still lists all 28 GeneXpert rows with status `Profile`.
  Nothing marks which 15 were discarded, and there is no Resolve action — so the administrator signs
  off on codes that were never stored. This is precisely what FR-B4 ("nothing maps itself silently")
  and FR-C2/C3 exist to prevent.
- **Resolution is not LOINC-based and is unreliable.** `HBV` is dropped although
  `HBsAg (Hepatitis B surface antigen)(Serum)` is in the catalog.

Combined with finding 1 there is no recovery path, which is what makes this severe rather than
merely untidy.

### 3 — The remediation control cannot be saved, so nothing can be activated *(blocking)*

On *Result Value Mappings*, an unbound row exposes a correct picker — `result-value-options?testCode=MTB`
returns exactly the three active options of test 395, and tests without options show the
"No active result options are configured for this mapped test" message with an *Open Test Catalog*
link. FR-E1 and FR-E2 are satisfied.

But selecting an option leaves **`Save result mappings` disabled**, the row keeps `LEGACY_UNBOUND`,
and after reload the field is empty again. Confirmed four ways: scripted click, real mouse click, a
third attempt after QC readiness was green, and **by hand by Casey**. The button carries no tooltip
or `aria-describedby` and is disabled from page load — the selection never marks the form dirty.
Only 20 of the 44 rows expose a picker at all.

Because `UNBOUND_RESULT_VALUES` gates `readyForActivation`, and it is the **only** remaining blocker
on the test analyzer once a control lot exists, a single non-enabling button is all that stands
between a fully-configured analyzer and activation.

**Repro:** `/analyzers/342/mappings` → Result Value Mappings → any `LEGACY_UNBOUND` row with a
picker (MTB, MTB-RIF, COVID19, SARSCOV2, SARS-CoV-2, Xpress) → choose any option → *Save result
mappings* stays greyed.

### 4 — No catalog resolution, and the bindable test set is wrong

The `OpenELIS Test` column renders the profile's `test_name_hint` string, not a resolved catalog
test. (Sysmex ships hints — "White Blood Cells"; the GeneXpert profile has no hint field, so it
falls back to the code.) `Status` is the literal string `Profile` on every row.

Where a picker exists, `test-mapping-options` returns the **same fixed 13 legacy tests** — CD4
percentage count, Determine, Genie III, Innolia, Murex, Vironostika, GB, Lymph %, Integral — with
**byte-identical id arrays for a Molecular analyzer (342) and a Hematology analyzer (343)**. It is
therefore not lab-unit scoped, it is 13 out of **183** catalog tests, and there is no search.

The catalog does contain the tests the profiles name (`White Blood Cells(Whole Blood)` and so on).
And the **Control Lot form in the same module offers all 183 tests with search** — so a
full-catalog searchable picker already exists in this codebase; the mapping screen simply does not
use it.

**What is needed:** search the whole Test Catalog (filters welcome, lab-unit scoping optional), plus
a link out to add a missing test and return to map it.

### 5 — FR-C1 is not implementable as written *(spec defect)*

Even a correct implementation would fail today. The shipped GeneXpert profile's LOINCs are not 1:1:

- `MTB` and `MTB-RIF` → both `85362-2`
- `COVID19`, `SARSCOV2`, `SARS-CoV-2`, `Xpress` → all `94500-6`
- `HIV-VL`, `HIV`, `HIV-1 Viral`, `VL` → all `20447-9`
- `VANA` and `VANB` → both `62261-3`

And `test-mapping-options` returns catalog tests with **empty LOINC fields** — the FRS's own
prerequisite ("OpenELIS ships default tests pre-mapped with LOINC as part of this work") has not
landed. **FR-C1 needs a documented tie-break rule before AC-5 can be satisfied by anyone.**

### 6 — The mapping sign-off is coupled to the QC program

`Verify current setup` is disabled whenever `blockers[]` is non-empty. On the Sysmex analyzer
`mappingReady` is **true** and it is still disabled, blocked only by `NO_ACTIVE_CONTROL_LOT`.
`qcApplicable` is `true` for **every** analyzer checked, including ones built from profiles shipping
**zero** QC rules — Mindray BC-5380 returns `NO_ACTIVE_QC_RULE` *and* `NO_ACTIVE_CONTROL_LOT`.

So a lab that maps its analyzer perfectly still cannot verify or activate it until someone creates a
QC rule and registers a control lot. The FRS does not ask for this, and MC-4 explicitly puts the QC
program out of scope for this surface. Meanwhile `Save and continue` stays enabled and the stepper
marks Verify **Complete** while `currentlyVerified` remains `false` — a step reporting itself done
without the confirmation it exists to capture (AC-6).

### 7 — No path to define a profile for an unlisted instrument

Absent from the Instrument step, and absent from Analyzer Types, which has no Create/Add control at
all; `/analyzers/types/new` is not a route. A deployment can only ever use the 20 shipped profiles.
**FR-B3 / AC-4 unbuilt.**

### 8 — Control-lot save hides the real validation error

*Add or select control lot* → `/analyzers/qc/control-lots/new?analyzerId={id}` with the analyzer
pre-filled. A form completed with lot number, material, level, expiry and test returns **400** with
the banner *"Failed to save control lot"*. The server's actual reason is
`"Manufacturer fixed method requires both mean and standard deviation"`. Mean and SD live behind the
*Statistics Configuration → Configure* link, display as `-`, are not marked required and are not
flagged on submit. Setting Mean 1.00 / SD 0.10 saved cleanly, and `qcReady` flipped to `true` with
`NO_ACTIVE_CONTROL_LOT` clearing immediately.

### 9 — Hard Delete, no Deactivate

The row menu is `Field Mappings · Test Connection · Copy Mappings · Edit · QC Rules · Control Lots ·
Delete (danger)`. No Deactivate/Reactivate — against FR-A3/AC-17 and the LIMS no-hard-delete rule.
`Copy Mappings` also appears where FR-H specifies fork-on-save and explicitly no clone.

---

## Deferred — re-test with the analyzer simulator attached

**Connect / Test Connection.** *Not judged.* The modal echoes `Name / IP address / Port` and reports
no success or failure; with blank fields the body is empty; no request is issued when the button is
pressed. The no-request observation is client-side and independent of instrument reachability, but
the harness was not connected, so this may be under-configuration rather than a defect.

Not harness-dependent and still standing:

- `plugin-config` reports `connectionRole: "SERVER"` — OpenELIS listens and the instrument dials in
  — so for an analyzer-initiated profile the IP/port the Connect step collects is inert, and the
  listener port the admin must set on the instrument is exposed nowhere in the UI or the API.
- All three communication directions are offered even for a profile declaring no LIS-initiated
  support (Sysmex), which FR-F2 says should not be offered. The default itself correctly follows the
  profile: GeneXpert declares `communication.mode: BOTH` → created `BOTH`; Sysmex declares none →
  created `ANALYZER_INITIATED`.

Baseline captured on analyzer **344** (`QA_AUTO_0812 GX workflow`, `identifierPattern`
`GENEXPERT|CEPHEID`, 32.82.68.83:9600): pending codes 0, pending result values 0, result-value
mappings 44 (2 bound), analyzer-code mappings 0. FR-B7/B8 and FR-G remain untested.

---

## Withdrawn during the walkthrough

Recorded so the record is honest about what QA got wrong:

- **"The instrument picker has no search."** Carbon `Dropdown` type-ahead works — focus the trigger,
  type `sys`, *Sysmex XN Series* highlights. The original finding was an automation artefact:
  synthetic keystrokes sent to an unfocused page were swallowed by a global search shortcut. Also
  verified this cannot affect a real user — typing into Analyzer Name behaves normally and stray
  keystrokes neither navigate nor clear the form.
- **"Two-way is offered by default regardless of the profile."** The default does follow the
  profile; see the Deferred section for what actually holds.

---

## What works and should be preserved

- Inline Add Analyzer with the list still visible behind it (AC-1).
- Profile load with a legible summary — tests mapped, QC defaults, result values — and a toast.
- Name and multi-lab-unit assignment round-tripping through a second endpoint.
- Readiness that recalculates live, and a Review step that names its blockers in plain language.
- The result-option picker correctly scoped to the mapped test, with a Test Catalog link when a test
  has no options.
- No developer-facing fields anywhere in the lab flow (AC-19 in spirit).

---

## Recommended next steps

1. Treat findings 1, 2 and 3 as the blocking set for OGC-1057. Finding 3 is the smallest fix with
   the largest effect — it alone unblocks activation.
2. Reuse the Control Lot form's full-catalog test picker on the mapping table (finding 4).
3. Rule on finding 5 (LOINC tie-break) as a spec amendment before any matching work starts.
4. Decide findings 6 and the Review-step/control-lot gate as spec amendments rather than defects.
5. Re-test Connect with the simulator attached before filing anything there.

---

## Test data left on the instance

`QA_AUTO_0812 GeneXpert` (342, carrying control lot `QA_AUTO_0812_LOT1` on test 395),
`QA_AUTO_0812 Sysmex walkthrough` (343), `QA_AUTO_0812 GX workflow` (344). Not cleaned up: the only
available action is a hard Delete and the LIMS rule is deactivate-never-delete (finding 9).
