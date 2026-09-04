# IHC Case View — Marker Scoring on Versioned Interpretive Thresholds

**FRS · Version 2.0 · 2026-09-04**
**Supersedes:** `designs/pathology/ihc-case-view.md` (titled "v2 Enhancements", December 2025 — a feature-set version, not a converted document)
**Shell:** conforms to `case-view-shell.md` v1.0 — see Shell Conformance
**Module:** Immunohistochemistry → Case Detail View
**Route:** `/ImmunohistochemistryCaseView/:immunohistochemistrySampleId` *(existing live route)*
**SideNav:** `Immunohistochemistry → Dashboard → Case View`
**Breadcrumb:** `Home / Immunohistochemistry / Dashboard / Case [LabNumber]`
**Epic:** `OGC-265`
**Role required:** existing `Histopathology` module role bundle

---

## Lab Context

*A developer-onboarding narrative for someone who has never worked in a clinical laboratory. Read this first. It stands on its own — no cross-references to other sections of this spec.*

### Current State

Immunohistochemistry, or IHC, is a stain that answers a specific question. Ordinary histology stains show a pathologist what the tissue looks like; IHC shows what proteins the cells are actually making. An antibody that binds one particular protein is washed over a tissue section, and wherever that protein is present the antibody leaves a coloured deposit. The pathologist then looks down the microscope and scores how much, how strongly, and where.

For breast cancer this is not a descriptive extra — it decides the patient's drug therapy. Three markers are run on essentially every case. **ER** and **PgR** (oestrogen and progesterone receptor) determine whether the tumour will respond to anti-hormonal treatment; the pathologist reports the percentage of tumour nuclei that stain and how intensely. **HER2** determines whether the patient is eligible for HER2-targeted drugs; it is scored 0, 1+, 2+ or 3+ on how complete and how intense the staining is around the cell membrane, and a 2+ result is ambiguous enough that it is reflexed to a second technique — **ISH**, in-situ hybridisation, which counts actual copies of the HER2 gene per nucleus against a reference chromosome-17 probe and produces a ratio. **Ki-67** estimates how fast the tumour is dividing. Other panels do other jobs: antibody sets that establish where an unknown tumour originated, mismatch-repair proteins that flag a tumour for immunotherapy, PD-L1 for checkpoint-inhibitor eligibility.

The critical thing about all of this is that the *numbers are not the answer*. A raw figure like "18% of nuclei stained" or "a HER2/CEP17 ratio of 1.8" only becomes a clinical result when a published guideline threshold is applied to it. Those thresholds are set by external bodies — ASCO and CAP jointly for the breast markers, the International Ki-67 in Breast Cancer Working Group for Ki-67 — and they are **revised**. The HER2 guideline has four editions: 2007, 2013, a 2018 focused update, and a 2023 update. The 2013 edition dropped the IHC 3+ threshold from over 30% of cells to over 10%. The 2018 update abolished the ISH "equivocal" category entirely and replaced it with five named groups. The same raw ratio can therefore be positive under one edition and equivocal under another.

In OpenELIS today, `ImmunohistochemistrySample` ships with a technician, a pathologist, a three-value status enum, a reports collection, a `reffered` flag and — usefully — a `@OneToOne` back to the `PathologySample` it came from. The screen users see is `ImmunohistochemistryCaseView.jsx`. The December 2025 design intended to replace it hardcodes a Ki-67 cutoff of 20% in three separate places, embeds an ISH interpretation table, and emits a sentence reading "Patient eligible for HER2-targeted therapy."

### Pain

Guideline thresholds are compiled into the application, so the application is wrong the moment a guideline moves — and it has already moved.

Three concrete examples, all verifiable against current published guidance. First, the hardcoded **Ki-67 cutoff of 20% is not defensible on current evidence**. The IKWG's 2021 recommendations endorse only two thresholds, 5% and 30%, and state that values between them should not drive care because "concordance was less than acceptable" — so 20% sits inside the band the guideline body explicitly rejected. The one regulatory anchor for 20%, a companion-diagnostic requirement on adjuvant abemaciclib, was withdrawn by the FDA in March 2023. A number compiled into three places in the source is now supported by neither the prognostic nor the regulatory literature, and changing it is a code release.

Second, the **ISH interpretation table is on the 2013 model while labelled 2018**. It still routes a ratio below 2.0 with 4.0 to 6.0 signals per nucleus to "Equivocal — retest with alternate assay". The 2018 focused update removed the equivocal category and made that combination Group 4, requiring concurrent IHC review instead. A lab following the screen is following superseded guidance.

Third, the screen **collapses HER2 IHC 0 and 1+ into a single "Negative"**. Since trastuzumab deruxtecan was extended to IHC 1+ and to 2+/ISH-negative disease, that distinction determines whether a patient with metastatic disease is eligible for a drug. Folding the two together destroys therapy-relevant information at the point of capture. Relatedly, ASCO/CAP's 2023 panel deliberately declined to create a "HER2-low" reporting category while ESMO's consensus does use the term — so two guideline bodies now disagree on the vocabulary, and any single vocabulary compiled into the code is wrong for somebody.

There is also a straightforward accreditation gap: there is **no control block, no control lot and no internal-control status anywhere** in the current design. CAP requires a predictive-marker report to state the antibody clone or probe and the scoring method used, and the ER/PgR guideline requires internal control status to be reported for every case scoring 0–10%. None of that is capturable today.

### What Changes

After this work ships:

- Interpretive thresholds stop being code and become **versioned reference data**, subscribed and stamped with their source and edition. A result stores the raw measurement the technologist saw *and* the identity of the threshold set that turned it into a category, so a report can always be read back against the rules that produced it. When a guideline is revised, the lab takes the new edition as content; historical results keep the edition they were reported under and are not silently re-interpreted.
- The threshold key carries every dimension that actually varies — **marker, antibody clone, assay and platform, scoring system, tumour type, and drug or indication** — because PD-L1 alone has four approved assays and five scoring systems whose cutoffs are explicitly not interchangeable. A single "threshold" field cannot hold that, and pretending otherwise is how a lab reports a 22C3 cutoff against an SP142 stain.
- HER2 IHC 0 and 1+ are stored as **distinct, non-collapsible values**. Whether a deployment also reports a "HER2-low" descriptor is a configurable vocabulary choice, not application logic, because the guideline bodies disagree.
- Every marker result records its antibody clone, its assay and platform, its scoring method, its external control lot, and its internal control status — the things CAP requires a predictive-marker report to state.
- The case sits on the shared Case View Shell, so it gains what it has never had: accordion sections that lock with a stated reason, a sign-out step, a reports section, a critical-result path, translated strings, and Carbon components instead of a Material-purple palette.
- The case's link back to the histopathology case that referred it is surfaced, using the `pathology_sample_id` relationship the entity already carries, and the referring case's blocks and slides are read rather than duplicated.

A backend developer who has never worked in immunohistochemistry should now know: antibodies stain proteins, a pathologist scores the staining as a number, and an externally-published and periodically-revised threshold turns that number into a result that decides a drug — so the threshold has to be data, with a version.

---

## Overview

The IHC Case View is the case-detail screen used by pathologists to score antibody and ISH markers and sign out a predictive-marker report. This redesign replaces the current screen with a structured, shell-conformant workflow that moves every interpretive threshold out of application code into versioned, source-stamped reference data, grounds every UI element in the existing `immunohistochemistry_sample` schema and the referring case's `pathology_block` and `pathology_slide` rows, records the clone, platform, scoring method and control status that accreditation requires, and hooks positive predictive findings into the same report and critical-result paths as its sibling screens.

### Navigation & URL

| Item | Value |
|------|-------|
| URL | `/ImmunohistochemistryCaseView/:immunohistochemistrySampleId` — unchanged from the current route. `ImmunohistochemistryController` declares `@PathVariable("immunohistochemistrySampleId")`, and `ImmunohistochemistryDashboard.openCaseView` navigates to `"/ImmunohistochemistryCaseView/" + id`. The December 2025 FRS wrote `:caseId`. |
| SideNav | `Immunohistochemistry → Dashboard → Case View` — opens from the IHC Dashboard worklists. |
| Breadcrumb | `Home / Immunohistochemistry / Dashboard / Case [LabNumber]` — the shipped component already uses an i18n breadcrumb key `breadcrumb.caseView`. |
| Page title | `Immunohistochemistry Case — [LabNumber]` |

### Scope

**In scope (this FRS):** case-detail screen redesign on the shared Case View Shell; consumption of versioned interpretive threshold sets for marker categorisation, with the applied set recorded per result; marker result capture including clone, assay and platform, scoring system, raw measurement and control status; HER2 IHC scoring with 0 and 1+ preserved as distinct values; ISH counting and group interpretation; ER/PgR percentage-and-intensity reporting with the low-positive band and its mandatory comment; Ki-67 capture against the current endorsed bands; configurable antibody panel templates with a completion view; pre-analytic cold-ischemia and fixation time capture; the referral relationship back to the histopathology case; findings, reports, sign-out and the critical-result hook.

**Out of scope (parked, or owned elsewhere):**

- **The threshold-set mechanism itself** — the versioned, source-stamped reference-data model and its subscription and update path are folded into the **Catalog Subscription epic**. This FRS specifies what it consumes and what it records, never how sets are authored, distributed or updated.
- **Therapy-eligibility statements.** The screen reports a marker category. It does not emit treatment recommendations. The December 2025 design's "Patient eligible for HER2-targeted therapy" is removed and not replaced; eligibility is a clinical decision made outside the laboratory report.
- **Molecular subtype classification** (Luminal A/B, HER2-enriched, triple-negative) — a derived classification with contested cutpoints and no single guideline owner. Parked pending SME review; see Dependencies.
- **Histopathology bench stages** — grossing through coverslipping belong to the referring pathology case (`OGC-264`). This screen reads its blocks and slides.
- **Label printing and presets** — shared `barcodeWorkflow`; `OGC-284` lists IHC Case View as M8 "Pathology family rollout via shared orchestration"; presets are `OGC-285`.
- **Report delivery and print presets** — `OGC-1031`, anchor `OGC-431`.
- **Text macro expansion** — `OGC-788`. This FRS names the fields that consume it.
- **Whole-slide imaging** — tile serving, multi-scan, annotation, measurement and side-by-side compare. The December 2025 design specified all of these with 13 requirements and two new entities; one attached image per slide only, on the referring case's existing `pathology_slide.image`.
- **Synoptic cancer-protocol reporting** — CAP electronic Cancer Protocols require discrete paired element/response capture. The marker-result model does not foreclose it; structured synoptic output is a separate FRS.
- **Non-breast panel content** beyond what is needed to demonstrate configurability — the antibody panels for tumour-of-unknown-origin, GIST, prostate and lymphoma workups are dictionary and panel-template content, authored by the lab, not requirements here.

---

## User Stories

1. **As a pathologist**, I want the threshold that turned my raw count into a category named on screen and stored with the result, so that I can tell which guideline edition my report was issued under.
2. **As a pathologist**, I want to record a HER2 IHC score of 0 and a score of 1+ as different things, so that a patient's eligibility for a therapy indicated at 1+ is not lost at the point of capture.
3. **As a laboratory director**, I want a guideline revision to be a content update rather than a software release, so that my laboratory can stay inside the currency window my accreditation requires without waiting for a version of OpenELIS.
4. **As a pathologist**, I want the clone, platform, scoring method and control status captured with each marker, so that my predictive-marker report states what CAP requires it to state.
5. **As a lab manager**, I want the IHC case to show the histopathology case that referred it and read that case's blocks and slides, so that the same tissue is not described twice in two places and cannot drift.

---

## Layout

The shell's Workbench layout with the progress rail **off** — this screen has three gated sections, below the five-section threshold, so the sticky Case Summary panel is the orientation device.

```
 Home / Immunohistochemistry / Dashboard / Case 25IHC000044
 Immunohistochemistry Case — 25IHC000044
├──────────────── PatientHeader (existing common component) ──────────────────┤
│ DOE, JANE │ DOB 1965-07-22 (61 y) │ F │ UHID … │        Status: IN_PROGRESS  │
│ ╭ Prior anatomic-pathology results ───────────────────────────────────────╮ │
│ │ 25TST000210  2026-08-14  Breast core   C50.9 Invasive ductal carcinoma  │ │
│ ╰──────────────────────────────────────── [View full patient history] ────╯ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌ WORK SECTIONS ─────────────────────────────┐ ╭ CASE SUMMARY ───────────╮ │
│ │ ▸ 1. Case Information & Referral           │ │ Referred from: 25TST…   │ │
│ │ ▾ 2. Specimen & Pre-analytics   [complete] │ │ Panel: Breast (4 of 4)  │ │
│ │ ▾ 3. Panel & Markers           [4 of 4]    │ │ ER:    Positive 85%     │ │
│ │ ▾ 4. Marker Results            [ER+ HER2?] │ │ PgR:   Positive 45%     │ │
│ │ ▾ 5. Controls                  [pass]      │ │ HER2:  2+ → ISH pending │ │
│ │ ▸ 6. Findings & Interpretation  🔒         │ │ Ki-67: 18% (indet.)     │ │
│ │ ▸ 7. Reports                               │ │ Thresholds: 3 sets      │ │
│ └────────────────────────────────────────────┘ ╰─────────────────────────╯ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: IN_PROGRESS  [Discard changes] [Save draft] [Send to pathologist]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

The three-button top tab strip in the current design (`📊 Report Scoring` / `📋 Panel Templates` / `🔬 Digital Slides`) is replaced by accordion sections. It has no completion state, no ordering and no gating — the tabs are freely reachable in any order — and it makes the marker scores and the interpretation they feed mutually invisible, which is the one correlation the pathologist is on this screen to make.

---

## Shell Conformance

| Element | Status | Variation / note |
|---|---|---|
| S-1 PatientHeader | conforms | replaces the hardcoded purple gradient banner and its single flat patient string |
| S-2 Prior related results | conforms | cross-bench; the referring histopathology case appears here as well as in section 1 |
| S-3 Accordion sections | conforms | **introduced** — converted from the three-button tab strip |
| S-4 Section state model | conforms | **introduced** — the current screen has no gating of any kind |
| S-5 Progress rail | conforms — **off** | three gated sections, below the S-5.1 threshold |
| S-6 Case Summary panel | conforms | **introduced**; every marker's current category and the threshold sets in force |
| S-7 Action bar | conforms | **introduced** a validated primary action; the current footer's three buttons have no handlers |
| S-8 Status transitions | conforms | consumes the existing `ImmunohistochemistryStatus`, plus one added value — see FR-2 |
| S-9 Critical-result hook | conforms | **introduced** — FR-11 |
| S-10 Identified objects | conforms with variation | reads the referring case's `PathologyBlock` and `PathologySlide` — already consumed by `ImmunohistochemistryCaseViewDisplayItem` — and holds none of its own |

---

## Functional Requirements

### FR-1 · Case Information and Referral section (display-only, collapsed by default)

Backed by `ImmunohistochemistrySample` and, through it, the referring case.

**FR-1.1** Displays the case metadata pattern of FR-1 in the pathology FRS, read from the parent `Sample`.

**FR-1.2 · The referral is surfaced, not re-entered.** `ImmunohistochemistrySample` already carries `pathologySample` as a `@OneToOne` (`pathology_sample_id`) and a `reffered` boolean — **spelled that way in the schema, and preserved deliberately** rather than corrected in a migration that would touch a shipped column for cosmetic reasons. The section shows the referring histopathology case's lab number as a link, its conclusion, and the blocks and slides available from it. **FR-1.3** A case with no referring pathology case — IHC ordered directly — renders that row as `—` with a hint, not an error.

**FR-1.4** Blocks and slides are **read from the referring case**, never duplicated here. Their designations and barcodes are the referring case's, per the identifier scheme in the pathology FRS FR-9.3, so one tissue block has one identity across both screens.

### FR-2 · Status model

**FR-2.1** The screen drives the existing `ImmunohistochemistryStatus` enum: `IN_PROGRESS` ("In Progress"), `READY_PATHOLOGIST` ("Ready for Pathologist"), `COMPLETED` ("Completed").

**FR-2.2** One value is added — **`UNDER_REVIEW`** ("Under Pathologist Review") — for the same reason as in the pathology FRS: without it the IHC Dashboard's awaiting-review count includes cases a pathologist already has open. This is the only enum change; IHC has no bench stages of its own because the tissue work belongs to the referring case.

**FR-2.3** Every transition records the actor from the session and the server timestamp, per shell S-8.2 and `ISO 15189:2022` 7.3.1(d). **FR-2.4** Reopen from `COMPLETED` returns the case to `UNDER_REVIEW` and voids the prior report row rather than deleting it.

### FR-3 · Specimen and Pre-analytics section

**FR-3.1** Records the pre-analytic variables that determine whether a predictive-marker result is valid at all: **cold-ischemia time** (excision to fixation) and **total fixation time**, plus the fixative used. These must be recorded and, where the case came from another laboratory, transmitted with it. **FR-3.2** Values outside the lab's configured acceptable window raise a Carbon `InlineNotification` kind `warning` on the section and are carried into the report as a qualifying comment — they do not block scoring, because the pathologist may still legitimately report with a caveat. **FR-3.3** Where the specimen was fixed at a referring facility and the times are unknown, they are recorded as unknown rather than defaulted; "not recorded" is a reportable fact.

### FR-4 · Panel and Markers section

**FR-4.1** A case is scored against a **panel template** — a named, configurable list of markers, each flagged required or optional. Templates are dictionary-and-configuration content (breast hormone receptor, HER2, mismatch repair, tumour-of-unknown-origin, and whatever the lab authors), never compiled marker lists. **FR-4.2** Selecting a template seeds a marker row per marker; markers may be added beyond the template and template markers may be marked not-performed with a reason.

**FR-4.3** Panel completion is **derived from whether each required marker has a result**, not from a manually ticked checkbox. The December 2025 design's completion meter is driven by a human ticking "Complete" per marker, which measures someone's diligence in ticking rather than whether the work is done. **FR-4.4** The completion badge names the outstanding markers, per the labels-not-counts convention.

### FR-5 · Marker Results section — raw measurement and applied threshold

This is the section the whole FRS exists for.

**FR-5.1 · Every marker result stores the raw measurement and the identity of the threshold set applied to it.** The derived category is recorded too, but it is a consequence, not the record. The stored set of facts per marker, which is also what CAP requires a predictive-marker report to state:

| Recorded | Example | Why |
|---|---|---|
| Marker | `ER` | dictionary-backed |
| Antibody clone or probe | `SP1` | **CAP requires the clone or probe on the report** |
| Assay and platform | `Ventana BenchMark ULTRA · FDA-cleared` | FDA-cleared vs laboratory-developed changes validation obligations |
| Scoring system | `Percentage + intensity` | **CAP requires the scoring method on the report** |
| Raw measurement | `85% nuclei, intensity strong` | the observation |
| Cells or nuclei counted | `400` | required for ISH; good practice elsewhere |
| Threshold set applied | `ASCO/CAP ER-PgR 2020 · v1` | the provenance that makes the category meaningful |
| Derived category | `Positive` | computed, displayed with its source |
| Manual override + reason | — | FR-5.5 |
| Internal control status | `Present, adequate` | **required for every ER/PgR case scoring 0–10%** |
| External control lot | `CTRL-2026-0184` | FR-8 |

**FR-5.2 · The threshold key is composite.** A set is identified by `(marker, clone, assay/platform, scoring system, tumour type, drug or indication)`. This is not over-engineering: PD-L1 has four approved assays (22C3, 28-8, SP263, SP142) and five scoring systems (TPS, CPS, TC, IC, percentage of tumour cells), and their cutoffs are drug-, indication-, assay- and scoring-system-specific and **explicitly not interchangeable**. A single scalar threshold field would let a laboratory report a 22C3 cutoff against an SP142 stain and see nothing wrong.

**FR-5.3 · The applied set is displayed, not hidden.** Each result shows its category alongside the set that produced it — source, edition and effective date — as a Carbon `Tag` plus a hint, e.g. `Positive · ASCO/CAP 2020`. A pathologist should never have to ask which rules a number was read against.

**FR-5.4 · Freeze at report; apply forward.** The threshold set identity is written onto the result when the result is entered, and a later edition **does not** retro-change a signed-out result. This is a design decision this FRS is making, not a requirement it is meeting: I could find no published rule on re-interpreting historical results when a guideline changes — neither CAP's breakpoint FAQs nor CLSI's implementation toolkit addresses it. The nearest analogue is the antimicrobial-susceptibility practice of maintaining a "breakpoints in use" list naming, for each combination, the breakpoint applied *including its source and publication year*, with new editions applied prospectively. We follow that shape and say so.

**FR-5.5 · Manual override is permitted and must be reasoned.** A pathologist may override a derived category; doing so requires a reason, is visibly marked on the result and in the report, and is audited. The underlying raw measurement and the threshold set that would have applied are both retained. **FR-5.6** Where no threshold set exists for a marker's key combination, the screen records the raw measurement and shows the category as `Not interpreted — no threshold set for this combination`, rather than silently falling back to another set.

### FR-6 · HER2 and ISH

**FR-6.1 · HER2 IHC is scored 0, 1+, 2+, 3+ and these are four distinct stored values.** They are **not collapsible** into positive/negative at capture. Since trastuzumab deruxtecan was extended to IHC 1+ and 2+/ISH-negative disease, the 0-versus-1+ distinction is therapy-determining, and the December 2025 design's `Negative | Equivocal | Positive` field destroys it.

**FR-6.2** The current threshold content, seeded from the ASCO/CAP 2023 guideline update (which confirmed the 2018 criteria without changing them):

| Score | Criterion |
|---|---|
| `3+` | complete, intense circumferential membrane staining in **>10%** of tumour cells |
| `2+` | weak-to-moderate **complete** membrane staining in **>10%** |
| `1+` | **incomplete**, faint or barely perceptible staining in **>10%** |
| `0` | no staining observed |

**FR-6.3 · A "HER2-low" descriptor is configurable vocabulary, not logic.** ASCO/CAP's 2023 panel explicitly declined to create a HER2-low interpretive category; ESMO's 2023 consensus statements use the term. Because two guideline bodies disagree, whether a deployment renders a HER2-low descriptor — and on which score combinations — is a property of the threshold set, and the underlying stored value remains the 0/1+/2+/3+ score.

**FR-6.4 · ISH counting and groups.** A 2+ IHC result reflexes to ISH. The section records nuclei counted, average HER2 signals per nucleus, average CEP17 signals per nucleus, and the derived ratio. The seeded group definitions, from the same guideline:

| Group | Ratio | Average HER2 signals/cell | Result |
|---|---|---|---|
| 1 | ≥ 2.0 | ≥ 4.0 | Positive |
| 2 | ≥ 2.0 | < 4.0 | Requires concurrent IHC review |
| 3 | < 2.0 | ≥ 6.0 | Requires concurrent IHC review |
| 4 | < 2.0 | ≥ 4.0 and < 6.0 | Requires concurrent IHC review |
| 5 | < 2.0 | < 4.0 | Negative |

**FR-6.5 · There is no ISH "equivocal" category.** The 2018 focused update abolished it. Groups 2, 3 and 4 route to a **concurrent IHC review** workflow, not to a retest-with-alternate-assay message. The December 2025 design's Group 4 → "Equivocal — Retest with alternate assay" is the pre-2018 model and is removed.

### FR-7 · ER, PgR and Ki-67

**FR-7.1 · ER and PgR are reported as percentage plus intensity.** These are the required elements in CAP's Breast Biomarker reporting template (v1.6.0.0, March 2025). Seeded thresholds, from the ASCO/CAP 2020 guideline update:

| Category | Criterion |
|---|---|
| Positive | **1%–100%** of tumour nuclei staining |
| **Low positive** | **1%–10%** — carries a **mandatory reporting comment** about limited data on endocrine responsiveness |
| Negative | 0 or < 1% |

**FR-7.2** The low-positive comment is threshold-set content, rendered automatically into the report and not editable away, though the pathologist may add to it. **FR-7.3 · Internal control status is required for every case scoring 0–10%**, per the same guideline, and the section will not mark the marker complete without it.

**FR-7.4 · Allred is an optional supplementary score, never the primary derivation.** In the current CAP template it appears only as an "Alternative Scoring System Score"; percentage and intensity are the required elements. Where a lab reports Allred it is recorded alongside, computed from the same proportion and intensity inputs. The December 2025 design makes Allred the primary derivation path with its own auto-calculation and lock-to-override, which inverts the current guidance.

**FR-7.5 · Ki-67 records the percentage and the band the current guideline endorses.** Seeded from the IKWG 2021 recommendations, which endorse **only** two thresholds:

| Band | Criterion | Note |
|---|---|---|
| Low | **≤ 5%** | actionable |
| Indeterminate | **> 5% and < 30%** | **explicitly not actionable** — IKWG states concordance in this range "was less than acceptable" |
| High | **≥ 30%** | actionable |

**FR-7.6** A result in the indeterminate band is reported as indeterminate with the guideline's own caveat. It is **not** forced to a binary by a 20% cutpoint. The screen shows the raw percentage prominently, because that is the durable observation; the band is the interpretation and it may change. **FR-7.7** Where a deployment must apply a different cutpoint — a companion-diagnostic requirement, a local protocol — it does so by configuring a threshold set whose source names that requirement, and the result records which set was used.

### FR-8 · Controls section

This section does not exist in the current design at all, and it is required for accreditation.

**FR-8.1** Each marker run records its **external control**: the control block or slide used, its lot, and whether the positive and negative controls performed as expected. **FR-8.2** Each marker result records its **internal control status** — present and adequate, present and inadequate, or absent — which is mandatory for ER and PgR cases scoring 0–10% (FR-7.3) and good practice throughout. **FR-8.3** A failed external control blocks the marker from being marked complete and raises a Carbon `InlineNotification` kind `error`; the run is repeated and the failure is retained rather than overwritten. **FR-8.4** Assay validation and proficiency-testing records are **not** held on the case — they are laboratory-level records — but the section links to them so a reviewer can reach them.

### FR-9 · Findings and Interpretation section

**FR-9.1** Disabled until the case reaches `READY_PATHOLOGIST`, with the `lockedHint` naming the condition. **FR-9.2** Holds the pathologist's narrative interpretation as a Carbon `TextArea` consuming macro expansion from `OGC-788`, and a structured summary of every marker with its category and applied threshold set.

**FR-9.3 · The screen reports marker categories and does not emit therapy recommendations.** The December 2025 design's `✓ Patient eligible for HER2-targeted therapy` and `⚠ Recommend retesting with an alternative HER2 assay` are removed. A laboratory report states what was measured and how it was categorised; eligibility and retesting decisions belong to the clinician and to the lab's own SOP, not to a rendered string in a case view.

**FR-9.4** A standing note that final classification requires clinical correlation is retained as threshold-set or report-template content rather than a hardcoded warning box. **FR-9.5** Both the interpretation and every required marker must be complete before sign-out.

### FR-10 · Reports section

**FR-10.1** Behaves exactly as the pathology FRS FR-15: a version list, **one click opens the report in a new browser tab**, `Generate report` opens the generated version in a new tab, versions accumulate, and there are no per-row View, Download, Print or Email buttons. **FR-10.2** Backed by the existing `ImmunohistochemistrySampleReport` collection, with the same `version_number` / `report_type` / `voided` additions.

**FR-10.3 · The report must state, per marker:** the antibody clone or probe, the assay and platform, the scoring method, the raw measurement, the derived category, the threshold set with its source and edition, the control status, and the pre-analytic times. This is the CAP predictive-marker reporting requirement plus the provenance this FRS adds. **FR-10.4** Delivery, queueing and print presets are owned by `OGC-1031`.

### FR-11 · Critical-result acknowledgment hook

**FR-11.1** A marker result whose derived category is flagged critical in its threshold set — configurable, because which predictive results a lab treats as critical is a local decision — marks the case as containing a critical result. **FR-11.2** A persistent Carbon `InlineNotification` kind `warning` with `role="alert"` states that acknowledgment will be required. **FR-11.3** On sign-out the case emits `CriticalResultEvent`, per shell S-9, gated downstream by `criticalResultAcknowledgmentEnabled`, never blocking sign-out.

### FR-12 · Localization

Every visible string wrapped in `t(key, fallback)` per Constitution Principle VII, under the `ihc.*` namespace following the shell's group vocabulary, with shell-shared strings from `caseView.*`. The current design has **zero** i18n keys and every string hardcoded.

**FR-12.1 · A conversion hazard, called out because it will bite whoever implements this.** In the current JSX, enum values are keyed on their display strings: `intensityScores = { 'Negative': 0, 'Weak': 1, 'Moderate': 2, 'Strong': 3 }`, `her2Status === 'Positive'`, and `panelMarkerStatus[marker.name]` keyed on the displayed marker name. Translating those labels breaks the arithmetic and the lookups. **Keys must be decoupled from labels before any i18n is added** — this is a prerequisite of FR-12, not a later cleanup.

### FR-13 · Audit Trail

Every state-changing action writes an `audit_trail` row. Actor from Spring Security; no PII in payloads.

| Action verb | Trigger | Target | Payload summary |
|---|---|---|---|
| `IHC_PREANALYTICS_SAVED` | FR-3 | `immunohistochemistry_sample.id` | cold-ischemia and fixation minutes |
| `IHC_PANEL_APPLIED` | FR-4.2 | `immunohistochemistry_sample.id` | template id, marker count |
| `IHC_MARKER_RESULT_SAVED` | FR-5.1 | `ihc_marker_result.id` | marker, clone, raw measurement, `threshold_set_ref`, derived category |
| `IHC_MARKER_OVERRIDDEN` | FR-5.5 | `ihc_marker_result.id` | derived category, overridden category, reason |
| `IHC_MARKER_NOT_INTERPRETED` | FR-5.6 | `ihc_marker_result.id` | the key combination with no matching set |
| `IHC_CONTROL_FAILED` | FR-8.3 | `ihc_marker_result.id` | control lot, which control failed |
| `IHC_CASE_SENT_TO_PATHOLOGIST` | FR-2 | `immunohistochemistry_sample.id` | `status_from`, `status_to` |
| `IHC_CASE_SIGNED_OUT` | FR-2 | `immunohistochemistry_sample.id` | `status_from`, `critical_result_emitted` |
| `IHC_CASE_REOPENED` | FR-2.4 | `immunohistochemistry_sample.id` | `voided_report_id` |
| `IHC_REPORT_GENERATED` | FR-10.1 | report id | `version`, `type` |
| `IHC_CRITICAL_RESULT_EMITTED` | FR-11.3 | `immunohistochemistry_sample.id` | marker, derived category |

### FR-14 · Envers coverage

- `ImmunohistochemistrySample` *(existing entity — **not** currently annotated; must be added)*
- `IhcMarkerResult` *(new — predictive clinical data determining therapy; must be audited)*
- `ImmunohistochemistrySampleReport` *(existing — follows the existing report-table pattern, unaudited; `voided` plus the audit verbs carry the history)*

The referring case's `PathologyBlock` and `PathologySlide` are audited by the pathology FRS, not here.

---

## Data Model

### Reused (existing — no schema changes)

| Entity | Table | Notes |
|---|---|---|
| `ImmunohistochemistrySample` | `immunohistochemistry_sample` | extends `ProgramSample`. Already carries `technician`, `pathologist` (`SystemUser` `@OneToOne`), `status` (`ImmunohistochemistryStatus`, `@NotNull`), `reports` (`@OneToMany`), **`pathologySample` (`@OneToOne`, `pathology_sample_id`)** and **`reffered` (Boolean)**. The referral relationship the December 2025 FRS did not use already exists here. |
| `PathologyBlock`, `PathologySlide` | `pathology_block`, `pathology_slide` | Read from the referring case. `ImmunohistochemistryCaseViewDisplayItem` already imports both. **No IHC-side copies.** |
| `Dictionary` / `DictionaryCategory` | `dictionary`, `dictionary_category` | Markers, antibody clones, platforms, panel templates, control lots, fixatives and criticality flags are all dictionary content. |
| `ImmunohistochemistryDisplayItem`, `ImmunohistochemistryCaseViewDisplayItem`, `ImmunohistochemistryDashBoardCount` | — | Existing DTOs; extended, not replaced. |

### Reused with additions

| Entity | Table | Additions and why |
|---|---|---|
| `ImmunohistochemistrySampleReport` | existing | `version_number INTEGER`; `report_type VARCHAR(16)` ∈ `DRAFT`/`FINAL`/`EXTERNAL`; `voided BOOLEAN NOT NULL DEFAULT false` — same as the pathology report additions, for the same reasons. |
| `ImmunohistochemistrySample` | `immunohistochemistry_sample` | `cold_ischemia_minutes INTEGER` nullable; `total_fixation_minutes INTEGER` nullable; `fixative_dictionary_id` nullable FK; `panel_template_id` nullable FK; `interpretation TEXT` nullable (FR-9.2). Remove `orphanRemoval = true` from the `reports` collection, per shell S-10.4. |

### New (one new entity)

**`IhcMarkerResult`** — `ihc_marker_result`, many rows per `immunohistochemistry_sample` (1:many), one per marker scored.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | sequence `ihc_marker_result_seq` |
| `immunohistochemistry_sample_id` | INTEGER FK | not null |
| `marker_dictionary_id` | INTEGER FK `dictionary` | not null |
| `clone` | VARCHAR(64) | antibody clone or probe — CAP-required on the report |
| `platform` | VARCHAR(128) | assay and instrument |
| `assay_regulatory_status` | VARCHAR(16) | `FDA_CLEARED` / `LDT` |
| `scoring_system` | VARCHAR(32) | e.g. `PERCENT_INTENSITY`, `HER2_IHC`, `ISH_RATIO`, `TPS`, `CPS` |
| `raw_percent` | NUMERIC(5,2) | nullable |
| `raw_intensity` | VARCHAR(16) | nullable; `NEGATIVE`/`WEAK`/`MODERATE`/`STRONG` — stored as a code, never as a display label (FR-12.1) |
| `raw_score` | VARCHAR(16) | nullable; e.g. HER2 IHC `0`/`1+`/`2+`/`3+` — four distinct values (FR-6.1) |
| `cells_counted` | INTEGER | nullable |
| `ish_her2_signals`, `ish_cep17_signals` | NUMERIC(6,2) | nullable |
| `ish_ratio` | NUMERIC(6,3) | nullable; derived and stored for report fidelity |
| `alternative_score` | VARCHAR(16) | nullable; e.g. Allred, as a supplementary score only (FR-7.4) |
| `threshold_set_ref` | VARCHAR(128) | the applied set's stable identity, with source and edition. Nullable **only** where FR-5.6 applies |
| `derived_category` | VARCHAR(64) | nullable when not interpreted |
| `override_category` | VARCHAR(64) | nullable |
| `override_reason` | VARCHAR(255) | nullable; required when `override_category` is set |
| `internal_control_status` | VARCHAR(24) | `PRESENT_ADEQUATE` / `PRESENT_INADEQUATE` / `ABSENT` |
| `external_control_lot` | VARCHAR(64) | nullable |
| `external_control_result` | VARCHAR(16) | `PASS` / `FAIL` |
| `not_performed_reason` | VARCHAR(255) | nullable (FR-4.2) |
| `recorded_at`, `recorded_by` | TIMESTAMP / FK | server clock and session user |

Liquibase changeset `2.9.x.x/ihc_marker_result.xml`. `@Audited` via Envers. No PII columns.

One new entity, and deliberately one: the panel template is dictionary and configuration content rather than a table of its own, and the threshold sets belong to the Catalog Subscription epic. The December 2025 FRS proposed four new tables — `ihc_panel_template`, `ihc_panel_template_marker`, `ihc_panel_test_mapping` and two digital-slide tables — of which the panel pair becomes configuration, the mapping table appeared only in XML and never in its own data model, and the slide tables are out of scope.

### Schema additions (small)

| Change | Reason |
|---|---|
| `ImmunohistochemistryStatus` enum: add `UNDER_REVIEW` | FR-2.2 — separates the dashboard's awaiting count from cases in hand |
| Remove `orphanRemoval = true` from `ImmunohistochemistrySample.reports` | shell S-10.4 |
| Add `@Audited` to `ImmunohistochemistrySample` | FR-14 |
| Common properties `ihc.preanalytics.coldIschemiaMaxMinutes`, `ihc.preanalytics.fixationMinMinutes`, `ihc.preanalytics.fixationMaxMinutes` | FR-3.2 |
| Decouple enum keys from display labels in the existing component | FR-12.1 — a prerequisite, not a cleanup |

### Dependencies (named, not designed in this FRS)

| Dependency | Status | What this FRS needs |
|---|---|---|
| **Interpretive threshold sets** | Folded into the **Catalog Subscription epic** | The versioned, source-stamped reference-data model, its composite key `(marker, clone, assay/platform, scoring system, tumour type, drug or indication)`, and its subscription and update path. This FRS **consumes** sets and records `threshold_set_ref` per result; it does not define authoring, distribution or currency management. The same mechanism serves AMR breakpoints (CLSI M100 annual editions, EUCAST annual tables), which is why it is one mechanism and not two. |
| **Threshold seed content** | Written here with citations; **SME review required before release** | The seeded values in FR-6 (ASCO/CAP 2023 HER2 IHC criteria and ISH Groups 1–5), FR-7.1 (ASCO/CAP 2020 ER/PgR 1% and 1–10% low-positive) and FR-7.5 (IKWG 2021 Ki-67 5% and 30% bands) each carry their source and edition. They are drawn from current published guidance but **must be reviewed and signed off by a pathologist before release**, not before merge. PD-L1 sets are named with per-assay and per-drug cutoffs where those could be verified; **MMR/MSI sets are named but seeded empty** because the specific loci counts and percentage-unstable thresholds could not be verified against a primary source, and inventing them would be worse than leaving them for the lab. |
| **Case View Shell** | New, this pass | Structural conformance per the table above. |
| **Pathology Case View v2** | `OGC-264`, this pass | FR-1.2 and FR-1.4 read the referring case and its blocks and slides. The identifier scheme is defined there (FR-9.3) and shared. |
| **Global Critical Result Acknowledgment** | TODO | FR-11.3 emits `CriticalResultEvent`. |
| **Macro Library** | `OGC-788`, in progress | FR-9.2 consumes expansion in the interpretation field. |
| **Shared `barcodeWorkflow`** | Built; rollout scheduled | `OGC-284` lists IHC Case View as M8. |
| **Report Print Queue** | `OGC-1031`, anchor `OGC-431` | FR-10 lists and opens; delivery owned there. |
| **Molecular subtype classification** | Parked | Luminal A/B, HER2-enriched and triple-negative classification is derived from ER, PgR, HER2 and Ki-67, and its cutpoints are contested with no single guideline owner. If it returns, it must be a threshold-set-driven derivation like every other interpretation, and it needs SME review. The December 2025 design's hardcoded classifier is not carried forward. |
| **Assay validation and proficiency-testing records** | Not built | FR-8.4 links to laboratory-level validation and PT records. CAP requires validation for predictive markers and PT participation; neither is a case-level record and neither exists as a surface today. |

---

## Permissions

| Action | Role bundle | Notes |
|---|---|---|
| Open IHC Case View | `Histopathology` (existing) | Same bundle as pathology; IHC is a bench within the same department. |
| Save draft | `Histopathology` | Existing. No new per-action key. |
| Record pre-analytics, panel and marker results | `Histopathology` | Existing. |
| Override a derived category | `Histopathology` | Existing, with a mandatory reason and an audit record — the control is accountability, not a permission key. |
| Send to pathologist, sign out, reopen | `Histopathology` | Existing. Capability follows case status. |
| Add a dictionary entry (marker, clone, platform) | existing dictionary-entry permission | A user without it sees the add option disabled with the reason. |
| Author or edit a threshold set | **not granted on this screen** | Threshold sets are reference data managed through the Catalog Subscription mechanism, not edited from a case. |

**Roles Builder additions:** None. The current design has **no permissions section at all** — no `Role required:` line, no per-endpoint authorisation on any of its 17 endpoints, no role check in its JSX, and no permission on its destructive `DELETE` endpoints or its Generate Report action. Its `§1.3 Users` table lists job titles against *benefits*, which is not a permission model.

**Verification note:** as with pathology, `OGC-9` indicates the Histopathology bundle's grants have been wrong before; confirm against the running app before implementation.

---

## Acceptance Criteria

| AC | Statement | Traces to |
|----|-----------|-----------|
| AC-1 | The screen loads at `/ImmunohistochemistryCaseView/:immunohistochemistrySampleId` and renders the patient header, prior-results panel, seven accordion sections, Case Summary and action bar; no progress rail | Layout, S-5 |
| AC-2 | The referring histopathology case is shown from the existing `pathology_sample_id` relationship and its `reffered` flag; no new column is added on either side | FR-1.2 |
| AC-3 | Blocks and slides are read from the referring case; no IHC-side block or slide row is created | FR-1.4, S-10 |
| AC-4 | `ImmunohistochemistryStatus` gains `UNDER_REVIEW` and no other value; every transition records actor and server timestamp | FR-2 |
| AC-5 | Cold-ischemia and total fixation times are recorded, or explicitly recorded as unknown; out-of-window values warn and carry a report comment but do not block scoring | FR-3 |
| AC-6 | Panel completion is derived from whether each required marker has a result, and the badge names the outstanding markers rather than showing only a count | FR-4.3, FR-4.4 |
| AC-7 | Every marker result stores clone, platform, assay regulatory status, scoring system, raw measurement, `threshold_set_ref` and derived category | FR-5.1 |
| AC-8 | A threshold set is resolved on the full composite key; a set for one assay or scoring system is never applied to another | FR-5.2 |
| AC-9 | Each result displays its applied threshold set's source and edition next to the category | FR-5.3 |
| AC-10 | A signed-out result's `threshold_set_ref` and `derived_category` are unchanged by the later arrival of a newer threshold-set edition | FR-5.4 |
| AC-11 | An overridden category requires a reason, is marked on screen and in the report, retains the raw measurement and the set that would have applied, and is audited | FR-5.5 |
| AC-12 | A key combination with no matching threshold set records the raw measurement and reports `Not interpreted`; no fallback set is applied | FR-5.6 |
| AC-13 | HER2 IHC persists as one of four distinct values `0`, `1+`, `2+`, `3+`; no capture path collapses `0` and `1+` | FR-6.1 |
| AC-14 | A "HER2-low" descriptor appears only when the applied threshold set defines it; the stored value remains the 0/1+/2+/3+ score | FR-6.3 |
| AC-15 | ISH records nuclei counted, HER2 and CEP17 signal averages and the derived ratio, and resolves to Groups 1–5 | FR-6.4 |
| AC-16 | No ISH result is categorised "Equivocal"; Groups 2, 3 and 4 route to concurrent IHC review | FR-6.5 |
| AC-17 | ER and PgR report percentage and intensity as the required elements; a result of 1–10% is categorised low positive and carries the mandatory comment | FR-7.1, FR-7.2 |
| AC-18 | A marker cannot be marked complete without internal control status when the ER or PgR result is 0–10% | FR-7.3 |
| AC-19 | Allred, where recorded, is stored as a supplementary alternative score and is never the source of the derived category | FR-7.4 |
| AC-20 | Ki-67 resolves to Low (≤5%), Indeterminate (>5% and <30%) or High (≥30%) under the seeded IKWG set; no 20% cutpoint exists in application code | FR-7.5, FR-7.6 |
| AC-21 | A failed external control blocks marker completion, raises an error notification, and is retained rather than overwritten | FR-8.3 |
| AC-22 | The screen renders no therapy-eligibility or retesting recommendation anywhere | FR-9.3 |
| AC-23 | A report row opens in a new tab on a single click, with no per-row View, Download, Print or Email buttons; the report states clone, platform, scoring method, raw measurement, category, threshold set with source and edition, control status and pre-analytic times per marker | FR-10 |
| AC-24 | A critical-flagged category renders a `role="alert"` notification and emits `CriticalResultEvent` on sign-out; sign-out succeeds with the feature flag disabled | FR-11 |
| AC-25 | No enum value, lookup key or status comparison is keyed on a display label; translating a label changes no arithmetic or branch | FR-12.1 |
| AC-26 | Every visible string resolves through `t(key, fallback)` with a key present in the Localization table | FR-12 |
| AC-27 | No new per-action permission key is introduced; access is gated by the existing `Histopathology` role bundle; threshold sets cannot be edited from this screen | Permissions |
| AC-28 | Reports are voided rather than deleted; no collection uses `orphanRemoval` | S-10.4 |
| AC-29 | Every form field has a label; every icon-only action has an `aria-label`; every category badge conveys state in text as well as colour; section headers expose `aria-expanded` | NFR |

---

## Localization

New keys under `ihc.*` following the shell's group vocabulary; shell-shared strings reused from `caseView.*`. The shipped component already uses an i18n breadcrumb key (`breadcrumb.caseView`); the December 2025 design has zero keys.

| Key | English fallback | Reused? |
|-----|------------------|---------|
| `ihc.label.case` | Immunohistochemistry Case | new |
| `ihc.section.caseInfo` | Case Information & Referral | new |
| `ihc.section.preanalytics` | Specimen & Pre-analytics | new |
| `ihc.section.panel` | Panel & Markers | new |
| `ihc.section.markerResults` | Marker Results | new |
| `ihc.section.controls` | Controls | new |
| `ihc.section.findings` | Findings & Interpretation | new |
| `ihc.section.reports` | Reports | new |
| `ihc.stage.inProgress` | In Progress | existing |
| `ihc.stage.readyPathologist` | Ready for Pathologist | existing |
| `ihc.stage.underReview` | Under Pathologist Review | new |
| `ihc.stage.completed` | Completed | existing |
| `ihc.label.referredFrom` | Referred from | new |
| `ihc.label.coldIschemia` | Cold-ischemia time (minutes) | new |
| `ihc.label.fixationTime` | Total fixation time (minutes) | new |
| `ihc.label.fixative` | Fixative | new |
| `ihc.label.panelTemplate` | Panel template | new |
| `ihc.label.marker` | Marker | new |
| `ihc.label.clone` | Antibody clone / probe | new |
| `ihc.label.platform` | Assay & platform | new |
| `ihc.label.scoringSystem` | Scoring method | new |
| `ihc.label.percentStained` | % cells stained | new |
| `ihc.label.intensity` | Intensity | new |
| `ihc.label.cellsCounted` | Cells / nuclei counted | new |
| `ihc.label.her2Score` | HER2 IHC score | new |
| `ihc.label.ishSignals` | Average signals per nucleus | new |
| `ihc.label.ishRatio` | HER2 / CEP17 ratio | new |
| `ihc.label.ishGroup` | ISH group | new |
| `ihc.label.alternativeScore` | Alternative score (e.g. Allred) | new |
| `ihc.label.thresholdSet` | Threshold set applied | new |
| `ihc.label.derivedCategory` | Category | new |
| `ihc.label.internalControl` | Internal control | new |
| `ihc.label.externalControlLot` | External control lot | new |
| `ihc.label.interpretation` | Interpretation | new |
| `ihc.action.applyPanel` | Apply panel template | new |
| `ihc.action.addMarker` | Add marker | new |
| `ihc.action.overrideCategory` | Override category | new |
| `ihc.action.sendToPathologist` | Send to pathologist | new |
| `ihc.action.signOut` | Sign out & finalize | new |
| `ihc.badge.markersOutstanding` | Outstanding: {markers} | new |
| `ihc.badge.notInterpreted` | Not interpreted | new |
| `ihc.locked.awaitingPathologist` | Available once the case is sent to the pathologist | new |
| `ihc.banner.lowPositiveComment` | 1–10% staining is reported as low positive. There are limited data on endocrine responsiveness in this range. | new |
| `ihc.banner.ki67Indeterminate` | Values between 5% and 30% are not currently actionable; concordance in this range is below the threshold the guideline accepts. | new |
| `ihc.banner.noThresholdSet` | No threshold set exists for this marker, clone, assay and scoring-system combination. The measurement is recorded but not interpreted. | new |
| `ihc.banner.controlFailed` | The external control for this run failed. The marker cannot be completed until the run is repeated. | new |
| `ihc.banner.preanalyticsOutOfWindow` | Recorded times fall outside the laboratory's acceptable window. The result may be reported with a qualifying comment. | new |
| `ihc.banner.criticalResult` | This result requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard on sign-out. | new |
| `ihc.banner.overridden` | Category manually overridden from {derived} to {override}. | new |
| `ihc.empty.noReports` | No reports yet. Complete the interpretation to generate one. | new |
| `ihc.empty.noReferral` | This case was not referred from a histopathology case. | new |

52 keys: 3 existing, 49 new. Shell-shared strings are additional, under `caseView.*`.

---

## Non-functional Requirements

| Aspect | Target |
|--------|--------|
| Initial load | First contentful paint ≤ 1.5 s on a 4G connection from a 1× CPU mobile-class device. Existing `ImmunohistochemistryCaseView` baseline; must not regress. |
| Save draft | ≤ 500 ms on a case with ≤ 20 markers. |
| Threshold resolution | ≤ 100 ms to resolve a set on the composite key and derive a category — this happens on every keystroke in a percentage field, so it must be a local lookup, not a round trip per character. |
| Sign-out | ≤ 2.0 s including report generation. |
| Accessibility | WCAG 2.1 AA. All form fields labelled; section headers keyboard-operable with `aria-expanded`; every icon-only action carries an `aria-label`; every category badge conveys state in text as well as colour; the critical-result and control-failure banners are announced via `role="alert"`; numeric inputs expose their units. |
| Localization | All shipped UI locales (en, fr, es, sw, ta, de, zh, ro, si). |
| Browser | Chrome / Edge / Firefox latest; tablet Safari read-only. |

---

## What changed vs the December 2025 FRS

The prior document is titled "IHC Case View v2 Enhancements" and carries `Version: 2.0`, but that is a **feature-set** version. It is a December 2025 first-generation design: no Lab Context, no FR ids, no Localization section, no permissions section, no status model, no Carbon. This revision is the first converted one.

| Area | Prior FRS | v2 (this FRS) |
|------|----|----|
| **Interpretive thresholds** | Compiled into the application: Ki-67 20% hardcoded in three places, an ISH table, Allred proportion bands, a molecular-subtype classifier | Versioned, source-stamped reference data resolved on a composite key; the applied set recorded per result; guideline revision becomes content, not a release |
| **Ki-67** | Single 20% cutpoint | IKWG 2021 bands: ≤5% low, >5–<30% explicitly indeterminate, ≥30% high. The 20% cutpoint's regulatory anchor was withdrawn in March 2023 |
| **HER2 ISH** | Groups with a "Group 4 → Equivocal → retest with alternate assay" branch | ASCO/CAP Groups 1–5 with no equivocal category; Groups 2–4 route to concurrent IHC review |
| **HER2 IHC** | `Negative / Equivocal / Positive`, collapsing 0 and 1+ | Four distinct non-collapsible values 0, 1+, 2+, 3+; "HER2-low" as configurable vocabulary because ASCO/CAP and ESMO disagree |
| **ER / PgR** | Allred as the primary auto-calculated derivation | Percentage plus intensity as the required elements (CAP template v1.6.0.0); 1% positivity cutoff and the 1–10% low-positive band with its mandatory comment (ASCO/CAP 2020); Allred supplementary only |
| **Controls** | Absent entirely | A Controls section: external control block and lot, pass/fail, internal control status — mandatory for ER/PgR 0–10% |
| **Pre-analytics** | Absent | Cold-ischemia and total fixation times recorded, with an acceptable window and a report comment when outside it |
| **Therapy statements** | Rendered "Patient eligible for HER2-targeted therapy" and "Recommend retesting with an alternative HER2 assay" | Removed. The screen reports categories; eligibility is a clinical decision |
| **Data model** | Four new tables (two panel tables, an XML-only mapping table with no data model entry, two digital-slide tables); `IHCCase` treated as pre-existing but never verified | One new table (`ihc_marker_result`); panels become configuration; reuses `ImmunohistochemistrySample` and the referring case's blocks and slides |
| **Referral link** | Not used | Uses the existing `pathology_sample_id` `@OneToOne` and `reffered` flag; no new column on either side |
| **Blocks and slides** | No blocks concept; a digital thumbnail strip over four mock images | Reads the referring pathology case's identified blocks and slides, which `ImmunohistochemistryCaseViewDisplayItem` already imports |
| **Panel completion** | A manually ticked checkbox per marker driving a progress bar | Derived from whether each required marker has a result; the badge names what is outstanding |
| **Layout** | A three-button top tab strip with no completion state, no ordering and no gating | Shell-conformant accordion sections with derived state and stated lock reasons |
| **Status / sign-out** | No status model, no sign-out, no state transitions anywhere; one display string `IN_PROGRESS` in a banner | Consumes the existing three-value `ImmunohistochemistryStatus` plus `UNDER_REVIEW`; validated sign-out; reopen voids the prior report |
| **Reports** | No reports section; a report-type selector and one handler-less Generate button | Version list, one click opens in a new tab, generation opens the new version, CAP-required per-marker content |
| **Digital pathology** | 13 requirements, 6 config keys, 2 new entities, 8 endpoints, OpenSlide/DICOM/PathCore/Aperio/Philips integrations, measure and annotate (both handler-less) | Out of scope; one attached image per slide on the referring case's existing column |
| **Permissions** | None — no section, no `Role required:`, no endpoint authorisation, no role check, none on the `DELETE` endpoints | The existing `Histopathology` bundle; capability follows status; no new keys |
| **i18n** | Zero keys; enum values keyed on display strings so translation would break the arithmetic | 52 keys with the key/label decoupling named as a prerequisite |
| **Carbon** | No Carbon at all; ~300 lines of inline styles in a Material-purple palette (`#7b1fa2`, `#9c27b0`), no `#0f62fe` anywhere | Carbon components named per requirement, per Constitution Principle II |
| **Audit / Envers** | Not declared | 11 `audit_trail` verbs; Envers declared per entity |
| **Critical results** | Not mentioned | `CriticalResultEvent` on a critical-flagged category, behind the shared flag, never blocking sign-out |
| **Route** | `/ImmunohistochemistryCaseView/:caseId` | `/ImmunohistochemistryCaseView/:immunohistochemistrySampleId` — matches the controller's `@PathVariable` and the dashboard's navigation |
| **Lab Context** | Absent | Three-subsection developer onboarding narrative as the first section |

---

## Related and prior art

- **Case View Shell** (`case-view-shell.md`) — the structural contract this screen implements. This is the shell's heaviest conversion: seven of ten elements are introduced here rather than adapted.
- **Pathology Case View v2** (`OGC-264`) — the referring screen. Defines the shared block and slide identifier scheme (FR-9.3) and creates the referral this screen receives.
- **Cytology Case View v2.0** — sibling screen; origin of the critical-result hook pattern.
- **Catalog Subscription epic** — owns the versioned interpretive threshold-set mechanism this FRS consumes. The same mechanism serves AMR breakpoints, which is the reason it is one mechanism.
- **AMR / microbiology breakpoint strategy** (Confluence: *Microbiology — Breakpoint Source & Update Strategy*) — the prior art for versioned, source-attributed interpretive data. CLSI M100 annual editions and EUCAST annual tables are the same problem shape as ASCO/CAP guideline editions, and CAP's antimicrobial checklist requirement to keep a "breakpoints in use" list naming source and publication year is the model for FR-5.4.
- **Macro Library** (`OGC-788`) — owns expansion in FR-9.2.
- **Barcode label quantity management** (`OGC-284`) / **Label presets** (`OGC-285`) — own label printing.
- **Report Print Queue** (`OGC-1031`, anchor `OGC-431`) — owns report delivery.
- **Global Critical Result Acknowledgment** — receiver of the event emitted by FR-11.3.

---

*End of FRS — v2.0, 2026-09-04*
